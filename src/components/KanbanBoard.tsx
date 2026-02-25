'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Deal, DealActivity, DealStage, STAGES } from '@/types/database';
import { supabase } from '@/lib/supabase';
import Column from './Column';
import DealCard from './DealCard';
import DealModal from './DealModal';
import Dashboard from './Dashboard';
import { format } from 'date-fns';

export default function KanbanBoard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewDeal, setIsNewDeal] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchDeals = useCallback(async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('updated_at', { ascending: false });

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);

    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage: newStage, updated_at: new Date().toISOString() } : d
      )
    );

    // Update in database
    const { error } = await supabase
      .from('deals')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', dealId);

    if (error) {
      console.error('Error updating deal stage:', error);
      fetchDeals(); // Revert on error
    }

    // Add activity
    await supabase.from('deal_activities').insert({
      deal_id: dealId,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: `Moved to ${newStage}`,
    });
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsNewDeal(false);
    setIsModalOpen(true);
  };

  const handleNewDeal = () => {
    setSelectedDeal(null);
    setIsNewDeal(true);
    setIsModalOpen(true);
  };

  const handleSave = async (dealData: Partial<Deal>) => {
    if (isNewDeal) {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating deal:', error);
        return;
      }

      setDeals((prev) => [data, ...prev]);
    } else if (selectedDeal?.id) {
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
    }

    setIsModalOpen(false);
    setSelectedDeal(null);
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

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, archived: true } : d
      )
    );

    setIsModalOpen(false);
    setSelectedDeal(null);
  };

  const activeDeal = deals.find((d) => d.id === activeDragId);
  const filteredDeals = showArchived ? deals : deals.filter((d) => !d.archived);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Dashboard deals={filteredDeals} />

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleNewDeal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Deal
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              deals={filteredDeals.filter((d) => d.stage === stage)}
              onDealClick={handleDealClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="opacity-80">
              <DealCard deal={activeDeal} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
        isNew={isNewDeal}
      />
    </div>
  );
}
