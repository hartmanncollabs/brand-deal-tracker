'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Deal, DealStage, STAGE_LABELS, STAGE_COLORS } from '@/types/database';
import DealCard from './DealCard';

interface ColumnProps {
  stage: DealStage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export default function Column({ stage, deals, onDealClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalValue = deals.reduce((sum, deal) => {
    if (!deal.value) return sum;
    const match = deal.value.match(/\$?([\d,]+)/);
    if (match) {
      return sum + parseInt(match[1].replace(/,/g, ''), 10);
    }
    return sum;
  }, 0);

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[280px] rounded-lg border-2 ${STAGE_COLORS[stage]} ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="p-3 border-b border-inherit">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">{STAGE_LABELS[stage]}</h2>
          <span className="px-2 py-0.5 bg-white rounded-full text-sm font-medium text-gray-600">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-sm text-green-600 font-medium mt-1">
            ${totalValue.toLocaleString()}
          </p>
        )}
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]"
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
