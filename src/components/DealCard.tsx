'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Deal } from '@/types/database';
import { format, parseISO, isBefore, addDays } from 'date-fns';

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
}

export default function DealCard({ deal, onClick }: DealCardProps) {
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
    transition,
  };

  const isOverdue = deal.next_action_date
    ? isBefore(parseISO(deal.next_action_date), new Date())
    : false;

  const isUrgent = deal.next_action_date
    ? isBefore(parseISO(deal.next_action_date), addDays(new Date(), 2)) && !isOverdue
    : false;

  const priorityColors: Record<string, string> = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-green-500',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border-2 border-l-4 p-3 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow
        ${priorityColors[deal.priority]}
        ${isOverdue ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'}
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{deal.brand}</h3>
        {isOverdue && (
          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
            OVERDUE
          </span>
        )}
        {isUrgent && !isOverdue && (
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">
            SOON
          </span>
        )}
      </div>

      {deal.value && (
        <p className="text-green-600 font-medium text-sm mb-1">{deal.value}</p>
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
