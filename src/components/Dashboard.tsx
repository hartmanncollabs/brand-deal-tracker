'use client';

import { Deal, STAGES, STAGE_LABELS } from '@/types/database';
import { isBefore, parseISO } from 'date-fns';

interface DashboardProps {
  deals: Deal[];
}

export default function Dashboard({ deals }: DashboardProps) {
  const activeDeals = deals.filter((d) => !d.archived && d.stage !== 'paused');
  
  const totalPipelineValue = activeDeals.reduce((sum, deal) => {
    if (!deal.value) return sum;
    const match = deal.value.match(/\$?([\d,]+)/);
    if (match) {
      return sum + parseInt(match[1].replace(/,/g, ''), 10);
    }
    return sum;
  }, 0);

  const overdueCount = activeDeals.filter(
    (d) => d.next_action_date && isBefore(parseISO(d.next_action_date), new Date())
  ).length;

  const waitingOnBrand = activeDeals.filter((d) => d.waiting_on === 'brand').length;
  const waitingOnUs = activeDeals.filter((d) => d.waiting_on === 'us').length;

  const stageCounts = STAGES.filter(s => s !== 'paused' && s !== 'complete').reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage && !d.archived).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Brand Deals Pipeline</h1>
          <p className="text-gray-500">Track partnerships from pitch to payment</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-green-50 rounded-lg px-4 py-2 border border-green-200">
            <p className="text-sm text-green-600 font-medium">Pipeline Value</p>
            <p className="text-2xl font-bold text-green-700">
              ${totalPipelineValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg px-4 py-2 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Active Deals</p>
            <p className="text-2xl font-bold text-blue-700">{activeDeals.length}</p>
          </div>

          {overdueCount > 0 && (
            <div className="bg-red-50 rounded-lg px-4 py-2 border border-red-200">
              <p className="text-sm text-red-600 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
            </div>
          )}

          <div className="bg-amber-50 rounded-lg px-4 py-2 border border-amber-200">
            <p className="text-sm text-amber-600 font-medium">Waiting</p>
            <p className="text-lg font-bold text-amber-700">
              <span title="Waiting on brand">🏢 {waitingOnBrand}</span>
              {' / '}
              <span title="Waiting on us">📌 {waitingOnUs}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(stageCounts)
          .filter(([, count]) => count > 0)
          .map(([stage, count]) => (
            <span
              key={stage}
              className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600"
            >
              {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}: {count}
            </span>
          ))}
      </div>
    </div>
  );
}
