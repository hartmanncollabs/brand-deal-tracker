'use client';

import { Deal } from '@/types/database';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

// Revenue tier thresholds (monthly)
const TIERS = [
  { name: 'Starter', min: 0, max: 5000, color: 'slate' },
  { name: 'Rising', min: 5000, max: 10000, color: 'blue' },
  { name: 'Established', min: 10000, max: 25000, color: 'purple' },
  { name: 'Pro', min: 25000, max: 50000, color: 'amber' },
  { name: 'Elite', min: 50000, max: 100000, color: 'emerald' },
  { name: 'Legend', min: 100000, max: Infinity, color: 'yellow' },
];

function parseValue(value: string | null): number {
  if (!value) return 0;
  const match = value.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
}

function getTier(amount: number) {
  return TIERS.find(t => amount >= t.min && amount < t.max) || TIERS[0];
}

function getNextTier(amount: number) {
  const currentTierIndex = TIERS.findIndex(t => amount >= t.min && amount < t.max);
  if (currentTierIndex === -1 || currentTierIndex >= TIERS.length - 1) {
    return null; // Already at max tier
  }
  return TIERS[currentTierIndex + 1];
}

interface TierProgressProps {
  deals: Deal[];
  targetMonth?: Date;
}

export default function TierProgress({ deals, targetMonth }: TierProgressProps) {
  // Default to current month
  const month = targetMonth || new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthLabel = format(month, 'MMMM yyyy');

  // Calculate monthly pipeline: deals in active stages (not outreach/pitched, not paid/complete/paused)
  // For March 2025, we count all deals in negotiation -> invoiced stages
  // This represents "committed/active" revenue for the month
  const pipelineStages = ['negotiation', 'agreed', 'contract', 'content', 'approval', 'scheduled', 'delivered', 'invoiced'];
  
  // Filter deals that are in pipeline stages and not archived
  // Note: For a specific month filter, we'd check created_at or a "delivery_month" field
  // For now, we show all active pipeline deals since there's no month field
  const pipelineDeals = deals.filter(d => 
    pipelineStages.includes(d.stage) && 
    !d.archived &&
    !d.parent_deal_id // Don't double-count children with parents
  );

  const pipelineTotal = pipelineDeals.reduce((sum, d) => sum + parseValue(d.value), 0);
  
  // Get paid deals for the month (using stage_changed_at = when deal moved to paid)
  const paidDeals = deals.filter(d => {
    if (d.stage !== 'paid' || d.archived) return false;
    const changeDate = d.stage_changed_at;
    if (changeDate) {
      try {
        const paidDate = parseISO(changeDate);
        return isWithinInterval(paidDate, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    }
    return false;
  });
  const paidTotal = paidDeals.reduce((sum, d) => sum + parseValue(d.value), 0);

  // Combined total for tier calculation (pipeline + already paid this month)
  const monthlyTotal = pipelineTotal + paidTotal;

  const currentTier = getTier(monthlyTotal);
  const nextTier = getNextTier(monthlyTotal);
  
  // Calculate progress to next tier
  const tierProgress = nextTier 
    ? ((monthlyTotal - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;
  
  const gap = nextTier ? nextTier.min - monthlyTotal : 0;

  // Color mapping
  const colorMap: Record<string, { bg: string; border: string; text: string; progress: string; progressBg: string }> = {
    slate: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', progress: 'bg-slate-500', progressBg: 'bg-slate-200' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', progress: 'bg-blue-500', progressBg: 'bg-blue-200' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', progress: 'bg-purple-500', progressBg: 'bg-purple-200' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', progress: 'bg-amber-500', progressBg: 'bg-amber-200' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', progress: 'bg-emerald-500', progressBg: 'bg-emerald-200' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', progress: 'bg-yellow-400', progressBg: 'bg-yellow-200' },
  };

  const colors = colorMap[currentTier.color] || colorMap.slate;
  const nextColors = nextTier ? colorMap[nextTier.color] : null;

  return (
    <div className={`${colors.bg} rounded-xl border ${colors.border} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {monthLabel} Pipeline
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${colors.text}`}>
              ${monthlyTotal.toLocaleString()}
            </span>
            <span className={`text-sm font-medium ${colors.text} opacity-75`}>
              {currentTier.name} Tier
            </span>
          </div>
        </div>
        
        {nextTier && (
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Next Tier</p>
            <p className={`text-lg font-bold ${nextColors?.text || 'text-gray-700'}`}>
              {nextTier.name}
            </p>
            <p className="text-xs text-gray-500">
              at ${nextTier.min.toLocaleString()}
            </p>
          </div>
        )}
        
        {!nextTier && (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
              🏆 Max Tier!
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className={`h-4 ${colors.progressBg} rounded-full overflow-hidden`}>
          <div 
            className={`h-full ${colors.progress} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(100, tierProgress)}%` }}
          />
        </div>
        
        {/* Tier markers */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>${currentTier.min.toLocaleString()}</span>
          {nextTier && <span>${nextTier.min.toLocaleString()}</span>}
        </div>
      </div>

      {/* Gap indicator */}
      {nextTier && gap > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Gap to {nextTier.name}:</span>
            <span className={`font-bold ${nextColors?.text || 'text-gray-700'}`}>
              ${gap.toLocaleString()}
            </span>
          </div>
          <div className="text-gray-500">
            {Math.round(tierProgress)}% complete
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-200/50 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Active Pipeline</p>
          <p className="font-semibold text-gray-700">${pipelineTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{pipelineDeals.length} deals</p>
        </div>
        <div>
          <p className="text-gray-500">Paid This Month</p>
          <p className="font-semibold text-green-600">${paidTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-400">{paidDeals.length} deals</p>
        </div>
      </div>
    </div>
  );
}
