'use client';

import { Deal } from '@/types/database';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

interface MonthlyGoalsProps {
  deals: Deal[];
  targetMonth?: Date;
}

function parseValue(value: string | null): number {
  if (!value) return 0;
  const match = value.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
}

interface GoalBarProps {
  label: string;
  current: number;
  goal: number;
  color: 'green' | 'purple';
  dealCount: number;
}

function GoalBar({ label, current, goal, color, dealCount }: GoalBarProps) {
  const progress = Math.min(100, (current / goal) * 100);
  const isComplete = current >= goal;
  
  const colors = {
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      progressBg: 'bg-emerald-100',
      progress: 'bg-emerald-500',
      text: 'text-emerald-700',
      label: 'text-emerald-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      progressBg: 'bg-purple-100',
      progress: 'bg-purple-500',
      text: 'text-purple-700',
      label: 'text-purple-600',
    },
  };

  const c = colors[color];

  return (
    <div className={`${c.bg} rounded-lg border ${c.border} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className={`text-sm font-semibold ${c.label} uppercase tracking-wide`}>
            {label}
          </h4>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${c.text}`}>
              ${current.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              / ${goal.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${c.text}`}>
            {dealCount} deal{dealCount !== 1 ? 's' : ''}
          </span>
          {isComplete && (
            <span className="ml-2 text-lg">🎯</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-3 ${c.progressBg} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${c.progress} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{Math.round(progress)}% of goal</span>
        {current < goal && (
          <span>${(goal - current).toLocaleString()} to go</span>
        )}
      </div>
    </div>
  );
}

export default function MonthlyGoals({ deals, targetMonth }: MonthlyGoalsProps) {
  const month = targetMonth || new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthLabel = format(month, 'MMMM yyyy');

  // Committed stages: agreed, contract, content (and beyond but entered this month)
  const committedStages = ['agreed', 'contract', 'content', 'approval', 'scheduled', 'delivered', 'invoiced', 'paid'];
  
  // Filter deals that moved to committed stages THIS month
  // We use stage_changed_at if available, otherwise fall back to updated_at
  const committedDeals = deals.filter(d => {
    if (!committedStages.includes(d.stage) || d.archived || d.parent_deal_id) return false;
    
    // Check if stage_changed_at is in this month
    const changeDate = d.stage_changed_at || d.updated_at;
    if (changeDate) {
      try {
        const date = parseISO(changeDate);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    }
    return false;
  });

  const committedTotal = committedDeals.reduce((sum, d) => sum + parseValue(d.value), 0);

  const COMMITTED_GOAL = 25000;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          {monthLabel} Goals
        </h3>
        <span className="text-sm text-gray-500">
          Monthly pipeline target
        </span>
      </div>

      <GoalBar
        label="Committed This Month"
        current={committedTotal}
        goal={COMMITTED_GOAL}
        color="green"
        dealCount={committedDeals.length}
      />
    </div>
  );
}
