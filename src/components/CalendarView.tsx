'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { Deal, DealStage, STAGE_LABELS, STAGES } from '@/types/database';
import { supabase } from '@/lib/supabase';
import DealModal from './DealModal';
import SpawnChildModal from './SpawnChildModal';

// Stage colors for calendar - matching kanban progression
// Blues → Orange/Yellow → Greens → Gray
const STAGE_DOT_COLORS: Record<DealStage, string> = {
  // Pitch/Outreach: Purples
  outreach: '#a855f7', // purple-500
  pitched: '#8b5cf6', // violet-500
  // Negotiation flow: Orange → Yellow
  negotiation: '#f97316', // orange-500
  agreed: '#f59e0b', // amber-500
  contract: '#eab308', // yellow-500
  // Content → Paid: Blue → Green transition
  content: '#3b82f6', // blue-500
  approval: '#06b6d4', // cyan-500
  scheduled: '#14b8a6', // teal-500
  delivered: '#10b981', // emerald-500
  invoiced: '#22c55e', // green-500
  paid: '#16a34a', // green-600
  // Finished/Paused: Grays
  complete: '#6b7280', // gray-500
  paused: '#9ca3af', // gray-400
};

interface CalendarViewProps {
  onBackToKanban?: () => void;
}

export default function CalendarView({ onBackToKanban }: CalendarViewProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activities, setActivities] = useState<import('@/types/database').DealActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [spawnParentDeal, setSpawnParentDeal] = useState<Deal | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Helper to get child deals for a parent
  const getChildDeals = useCallback((parentId: string) => {
    return deals.filter(d => d.parent_deal_id === parentId)
      .sort((a, b) => (a.month_number || 0) - (b.month_number || 0));
  }, [deals]);

  // Helper to get parent deal for a child
  const getParentDeal = useCallback((parentId: string | null) => {
    if (!parentId) return null;
    return deals.find(d => d.id === parentId) || null;
  }, [deals]);

  const fetchDeals = useCallback(async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('archived', false)
      .order('next_action_date', { ascending: true });

    if (error) {
      console.error('Error fetching deals:', error);
      return;
    }

    setDeals(data || []);
    setLoading(false);
  }, []);

  const fetchActivities = useCallback(async (dealId: string) => {
    const { data, error } = await supabase
      .from('deal_activities')
      .select('*')
      .eq('deal_id', dealId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }

    setActivities(data || []);
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    if (selectedDeal?.id) {
      fetchActivities(selectedDeal.id);
    }
  }, [selectedDeal?.id, fetchActivities]);

  // Group deals by date
  const dealsByDate = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    deals.forEach(deal => {
      if (deal.next_action_date) {
        if (!grouped[deal.next_action_date]) {
          grouped[deal.next_action_date] = [];
        }
        grouped[deal.next_action_date].push(deal);
      }
    });
    return grouped;
  }, [deals]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleSave = async (dealData: Partial<Deal>, keepOpen = false) => {
    if (!selectedDeal?.id) return;

    const { error } = await supabase
      .from('deals')
      .update({ ...dealData, updated_at: new Date().toISOString() })
      .eq('id', selectedDeal.id);

    if (error) {
      console.error('Error updating deal:', error);
      return;
    }

    setDeals((prev) =>
      prev.map((d) =>
        d.id === selectedDeal.id
          ? { ...d, ...dealData, updated_at: new Date().toISOString() }
          : d
      )
    );

    if (!keepOpen) {
      setIsModalOpen(false);
      setSelectedDeal(null);
    }
  };

  const handleAddActivity = async (dealId: string, note: string) => {
    const { data, error } = await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        date: format(new Date(), 'yyyy-MM-dd'),
        note,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding activity:', error);
      return;
    }

    setActivities((prev) => [data, ...prev]);
  };

  const handleArchive = async (dealId: string) => {
    const { error } = await supabase
      .from('deals')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', dealId);

    if (error) {
      console.error('Error archiving deal:', error);
      return;
    }

    setDeals((prev) => prev.filter((d) => d.id !== dealId));
    setIsModalOpen(false);
    setSelectedDeal(null);
  };

  const handleDoSpawn = async (data: { stage: DealStage; value: number; notes: string }) => {
    if (!spawnParentDeal) return;

    const existingChildren = getChildDeals(spawnParentDeal.id);
    const nextMonthNumber = existingChildren.length + 1;

    const { error } = await supabase
      .from('deals')
      .insert({
        brand: `${spawnParentDeal.brand} — Month ${nextMonthNumber}`,
        slug: `${spawnParentDeal.slug}-month-${nextMonthNumber}`,
        stage: data.stage,
        priority: spawnParentDeal.priority,
        value: `$${data.value.toLocaleString()}`,
        contact_name: spawnParentDeal.contact_name,
        contact_email: spawnParentDeal.contact_email,
        contact_source: spawnParentDeal.contact_source,
        waiting_on: 'us',
        follow_up_count: 0,
        notes: data.notes || `Month ${nextMonthNumber} for ${spawnParentDeal.brand}`,
        archived: false,
        is_multi_month: false,
        parent_deal_id: spawnParentDeal.id,
        month_number: nextMonthNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating child card:', error);
      throw error;
    }

    const currentValue = parseFloat(spawnParentDeal.value?.replace(/[$,]/g, '') || '0');
    const newValue = Math.max(0, currentValue - data.value);
    const newTotalMonths = (spawnParentDeal.total_months || 0) || nextMonthNumber;

    await supabase
      .from('deals')
      .update({
        is_multi_month: true,
        total_months: Math.max(newTotalMonths, nextMonthNumber),
        monthly_value: data.value,
        value: newValue > 0 ? `$${newValue.toLocaleString()} remaining` : spawnParentDeal.value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', spawnParentDeal.id);

    await supabase.from('deal_activities').insert({
      deal_id: spawnParentDeal.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: `Spawned Month ${nextMonthNumber} child card ($${data.value.toLocaleString()}) → ${data.stage}`,
    });

    fetchDeals();
  };

  const today = new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {onBackToKanban && (
            <button
              onClick={onBackToKanban}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Board
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800">Calendar View</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stage Legend */}
      <div className="bg-white rounded-lg p-3 mb-4 shadow-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {STAGES.filter(s => s !== 'paused').map(stage => (
            <div key={stage} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{ 
                  backgroundColor: STAGE_DOT_COLORS[stage],
                  borderColor: STAGE_DOT_COLORS[stage],
                }}
              />
              <span className="text-gray-600">{STAGE_LABELS[stage]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-4 border-l pl-4">
            <div className="w-3 h-3 rounded-full border-2 border-gray-400" style={{ borderStyle: 'solid' }} />
            <span className="text-gray-600">Parent</span>
            <div className="w-3 h-3 rounded-full border-2 border-gray-400 ml-2" style={{ borderStyle: 'dashed' }} />
            <span className="text-gray-600">Child</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayDeals = dealsByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`
                  min-h-[120px] border-b border-r p-2 cursor-pointer transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${isToday ? 'bg-blue-50' : ''}
                  ${isSelected ? 'ring-2 ring-inset ring-blue-400' : ''}
                  hover:bg-gray-50
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isToday ? 'text-blue-600' : ''}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Deal dots/cards */}
                <div className="space-y-1">
                  {dayDeals.slice(0, isSelected ? dayDeals.length : 3).map(deal => {
                    const isChild = !!deal.parent_deal_id;
                    const isParent = deal.is_multi_month && !deal.parent_deal_id;
                    
                    return (
                      <div
                        key={deal.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDealClick(deal);
                        }}
                        className={`
                          text-xs px-1.5 py-1 rounded cursor-pointer
                          hover:ring-1 hover:ring-offset-1 transition-all
                          ${isChild ? 'border-dashed' : 'border-solid'}
                          border-2
                        `}
                        style={{
                          backgroundColor: `${STAGE_DOT_COLORS[deal.stage]}15`,
                          borderColor: STAGE_DOT_COLORS[deal.stage],
                        }}
                        title={`${deal.brand} - ${STAGE_LABELS[deal.stage]}${deal.next_action ? ` - ${deal.next_action}` : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          <span 
                            className="px-1 py-0.5 rounded text-white text-[10px] font-medium shrink-0"
                            style={{ backgroundColor: STAGE_DOT_COLORS[deal.stage] }}
                          >
                            {STAGE_LABELS[deal.stage]}
                          </span>
                          <span className="truncate text-gray-700">
                            {isParent && '📅 '}
                            {isChild && deal.month_number && `P${deal.month_number} `}
                            {deal.brand}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {!isSelected && dayDeals.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayDeals.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deals without dates */}
      {deals.filter(d => !d.next_action_date).length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Deals without Next Action Date ({deals.filter(d => !d.next_action_date).length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {deals.filter(d => !d.next_action_date).map(deal => {
              const isChild = !!deal.parent_deal_id;
              const isParent = deal.is_multi_month && !deal.parent_deal_id;
              
              return (
                <div
                  key={deal.id}
                  onClick={() => handleDealClick(deal)}
                  className={`
                    text-sm px-2 py-1.5 rounded cursor-pointer
                    hover:ring-1 hover:ring-offset-1 transition-all
                    ${isChild ? 'border-dashed' : 'border-solid'}
                    border-2
                  `}
                  style={{
                    backgroundColor: `${STAGE_DOT_COLORS[deal.stage]}15`,
                    borderColor: STAGE_DOT_COLORS[deal.stage],
                  }}
                  title={`${STAGE_LABELS[deal.stage]}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="px-1.5 py-0.5 rounded text-white text-xs font-medium shrink-0"
                      style={{ backgroundColor: STAGE_DOT_COLORS[deal.stage] }}
                    >
                      {STAGE_LABELS[deal.stage]}
                    </span>
                    <span className="text-gray-700">
                      {isParent && '📅 '}
                      {isChild && deal.month_number && `P${deal.month_number} `}
                      {deal.brand}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deal Modal */}
      <DealModal
        deal={selectedDeal}
        activities={activities}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDeal(null);
        }}
        onSave={handleSave}
        onAddActivity={handleAddActivity}
        onArchive={handleArchive}
        onCreateMonthlyPortion={() => {}}
        isNew={false}
        childDeals={selectedDeal ? getChildDeals(selectedDeal.id) : []}
        parentDeal={selectedDeal ? getParentDeal(selectedDeal.parent_deal_id) : null}
      />

      {/* Spawn Child Modal */}
      {spawnParentDeal && (
        <SpawnChildModal
          isOpen={isSpawnModalOpen}
          onClose={() => {
            setIsSpawnModalOpen(false);
            setSpawnParentDeal(null);
          }}
          parentDeal={spawnParentDeal}
          existingChildCount={getChildDeals(spawnParentDeal.id).length}
          onSpawn={handleDoSpawn}
        />
      )}
    </div>
  );
}
