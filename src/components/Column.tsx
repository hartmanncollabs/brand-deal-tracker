'use client';

import { useDroppable, UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Deal, DealStage, STAGE_LABELS, STAGE_COLORS, STAGES } from '@/types/database';
import DealCard from './DealCard';

interface ColumnProps {
  stage: DealStage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  activeOverId: UniqueIdentifier | null;
  activeDragId: string | null;
  isMultiMonthIncomplete?: (deal: Deal) => boolean;
  getChildCount?: (dealId: string) => number;
}

export default function Column({ stage, deals, onDealClick, activeOverId, activeDragId, isMultiMonthIncomplete, getChildCount }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  // Determine if this column is being hovered (either directly or via a card)
  const isColumnHovered = 
    activeOverId === stage || 
    (!STAGES.includes(activeOverId as DealStage) && deals.some((d) => d.id === activeOverId));

  // Find which card is being hovered for insertion indicator
  const hoveredCardId = !STAGES.includes(activeOverId as DealStage) ? activeOverId : null;

  const totalValue = deals.reduce((sum, deal) => {
    if (!deal.value) return sum;
    const match = deal.value.match(/\$?([\d,]+)/);
    if (match) {
      return sum + parseInt(match[1].replace(/,/g, ''), 10);
    }
    return sum;
  }, 0);

  // Sort deals by sort_order
  const sortedDeals = [...deals].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[280px] rounded-lg border-2 transition-all duration-200 ${STAGE_COLORS[stage]} ${
        isColumnHovered ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''
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
        className="flex-1 p-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]"
      >
        <SortableContext
          items={sortedDeals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick(deal)}
                isHovered={hoveredCardId === deal.id}
                isDragSource={activeDragId === deal.id}
                isMultiMonthIncomplete={isMultiMonthIncomplete?.(deal)}
                childCount={deal.is_multi_month && !deal.parent_deal_id ? getChildCount?.(deal.id) : undefined}
              />
            ))}
          </div>
        </SortableContext>
        
        {/* Drop indicator at end of column when hovering column directly */}
        {activeOverId === stage && activeDragId && (
          <div className="h-1 bg-blue-400 rounded mt-2 animate-pulse" />
        )}
      </div>
    </div>
  );
}
