'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Deal } from '@/types/database';
import { format, parseISO, addDays } from 'date-fns';

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  isHovered?: boolean;
  isDragSource?: boolean;
  isMultiMonthIncomplete?: boolean; // True if this is part of an incomplete multi-month deal
  childCount?: number; // Number of child portions created (for parent cards)
}

export default function DealCard({ deal, onClick, isHovered, isDragSource, isMultiMonthIncomplete, childCount }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 999 : undefined,
  };

  // Compare date strings to avoid timezone issues
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const actionDateStr = deal.next_action_date || null;

  const isDueToday = actionDateStr === todayStr;

  const isOverdue = actionDateStr ? actionDateStr < todayStr : false;

  const isUrgent = actionDateStr
    ? actionDateStr <= format(addDays(new Date(), 2), 'yyyy-MM-dd') && !isOverdue && !isDueToday
    : false;

  const priorityColors: Record<string, string> = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-green-500',
  };

  // Multi-month styling
  const isParentDeal = deal.is_multi_month && !deal.parent_deal_id;
  const isChildDeal = !!deal.parent_deal_id;
  // Only child cards get dashed border - parent cards stay solid
  const showDottedBorder = isChildDeal;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderStyle: showDottedBorder ? 'dashed' : 'solid',
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border-2 border-l-4 p-3 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-all duration-200
        ${priorityColors[deal.priority]}
        ${isOverdue ? 'border-red-500 ring-2 ring-red-200' : isDueToday ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'}
        ${isDragging || isDragSource ? 'opacity-50 shadow-lg scale-[0.98]' : ''}
        ${isHovered ? 'translate-y-3 border-t-blue-400 border-t-4' : ''}
        ${isParentDeal ? 'bg-gradient-to-r from-white to-blue-50' : ''}
        ${isChildDeal ? 'bg-gradient-to-r from-white to-indigo-50 ml-2' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-gray-900 text-sm">{deal.brand}</h3>
          {deal.is_repeat_brand && (
            <span 
              className="text-purple-600 cursor-help" 
              title={deal.past_history || 'Returning brand'}
            >
              ↺
            </span>
          )}
          {deal.deal_type === 'ugc' && (
            <span 
              className="text-amber-600 cursor-help text-xs" 
              title="UGC: Brand posts content (skips scheduled/delivered)"
            >
              🎬
            </span>
          )}
          {isParentDeal && (
            <span 
              className="text-blue-600 cursor-help text-xs" 
              title={`Multi-month: ${deal.total_months || '?'} months @ $${deal.monthly_value?.toLocaleString() || '?'}/mo`}
            >
              📅{deal.total_months || ''}
            </span>
          )}
          {isChildDeal && deal.month_number && (
            <span 
              className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium"
              title="Monthly portion"
            >
              M{deal.month_number}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {isOverdue && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
              OVERDUE
            </span>
          )}
          {isDueToday && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">
              DUE TODAY
            </span>
          )}
          {isUrgent && (
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
              SOON
            </span>
          )}
        </div>
      </div>

      {deal.value && (
        <p className="text-green-600 font-medium text-sm mb-1">
          {deal.value}
          {isParentDeal && childCount !== undefined && deal.total_months && (
            <span className="text-gray-500 font-normal text-xs ml-1">
              ({childCount}/{deal.total_months} months)
            </span>
          )}
        </p>
      )}

      {deal.contact_name && (
        <p className="text-gray-500 text-xs mb-1 truncate">{deal.contact_name}</p>
      )}

      <div className="flex items-center justify-between mt-2 text-xs">
        {deal.last_contact && (
          <span className="text-gray-400">
            {format(parseISO(deal.last_contact), 'MMM d')}
          </span>
        )}
        {deal.waiting_on && (
          <span
            className={`px-1.5 py-0.5 rounded ${
              deal.waiting_on === 'brand'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {deal.waiting_on === 'brand' ? '⏳ Brand' : '📌 Us'}
          </span>
        )}
      </div>

      {deal.next_action && (
        <p className="text-gray-600 text-xs mt-2 truncate italic">
          → {deal.next_action}
        </p>
      )}
    </div>
  );
}
