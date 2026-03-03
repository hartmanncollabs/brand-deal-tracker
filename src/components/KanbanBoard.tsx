'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  CollisionDetection,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { Deal, DealActivity, DealStage, STAGES } from '@/types/database';
import { supabase } from '@/lib/supabase';
import Column from './Column';
import DealCard from './DealCard';
import DealModal from './DealModal';
import Dashboard from './Dashboard';
import { format } from 'date-fns';

// Custom collision detection that prefers columns over cards
const customCollisionDetection: CollisionDetection = (args) => {
  // First check if we're over a column (stage)
  const pointerCollisions = pointerWithin(args);
  const columnCollision = pointerCollisions.find((collision) =>
    STAGES.includes(collision.id as DealStage)
  );
  
  if (columnCollision) {
    // Now check if we're also over a card within that column
    const rectCollisions = rectIntersection(args);
    const cardCollision = rectCollisions.find(
      (collision) => !STAGES.includes(collision.id as DealStage)
    );
    
    // If over a card, return that for insertion positioning
    if (cardCollision) {
      return [cardCollision];
    }
    
    // Otherwise return the column
    return [columnCollision];
  }
  
  // Fallback to closest center
  return closestCenter(args);
};

export default function KanbanBoard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewDeal, setIsNewDeal] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeOverId, setActiveOverId] = useState<UniqueIdentifier | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      .order('sort_order', { ascending: true, nullsFirst: false })
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
    setActiveOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setActiveOverId(over?.id ?? null);
    // NO optimistic updates here - let handleDragEnd do the work safely
  };

  // Helper to find target stage from over.id - ALWAYS returns a valid stage or null
  const findTargetStage = (overId: UniqueIdentifier): DealStage | null => {
    // First check if overId is directly a stage name
    if (STAGES.includes(overId as DealStage)) {
      return overId as DealStage;
    }
    
    // Otherwise it's a deal ID - find that deal and return its stage
    // IMPORTANT: We look up the deal's stage, which must be a valid stage name
    const targetDeal = deals.find((d) => d.id === overId);
    if (targetDeal && STAGES.includes(targetDeal.stage)) {
      return targetDeal.stage;
    }
    
    // If we can't determine a valid stage, return null
    return null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragId(null);
    setActiveOverId(null);

    if (!over) return;
    
    // SAFETY: If dropped on itself, do nothing
    if (over.id === active.id) return;

    const dealId = active.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    // Get the target stage - this MUST be a valid stage name from STAGES
    const newStage = findTargetStage(over.id);
    
    // CRITICAL: Validate newStage is actually a valid stage, not a UUID
    // UUIDs are 36 chars with dashes - stage names are short words
    const looksLikeUUID = typeof newStage === 'string' && newStage.length > 20;
    if (!newStage || !STAGES.includes(newStage) || looksLikeUUID) {
      console.error('BLOCKED invalid stage:', { newStage, overId: over.id, activeId: active.id });
      return;
    }
    
    // Double-check: newStage must be one of our known stages
    const validStages: string[] = ['pitch', 'outreach', 'negotiation', 'agreed', 'contract', 'content', 'approval', 'scheduled', 'delivered', 'invoiced', 'paid', 'complete', 'paused'];
    if (!validStages.includes(newStage)) {
      console.error('BLOCKED stage not in hardcoded list:', newStage);
      return;
    }

    const isStageChange = deal.stage !== newStage;
    const isDropOnCard = !STAGES.includes(over.id as DealStage);

    // Get deals in the target column (for reordering)
    const targetColumnDeals = deals
      .filter((d) => d.stage === newStage && d.id !== dealId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    let newSortOrder: number;
    let updates: { id: string; sort_order: number }[] = [];

    if (isDropOnCard) {
      // Dropped on a specific card - insert at that position
      const targetDeal = deals.find((d) => d.id === over.id);
      if (targetDeal) {
        const targetIndex = targetColumnDeals.findIndex((d) => d.id === targetDeal.id);
        
        // Recompute sort orders for the column
        const newOrder = [...targetColumnDeals];
        newOrder.splice(targetIndex, 0, deal);
        
        updates = newOrder.map((d, index) => ({
          id: d.id,
          sort_order: index * 100,
        }));
        
        newSortOrder = targetIndex * 100;
      } else {
        // Fallback: add at end
        newSortOrder = (targetColumnDeals.length) * 100;
      }
    } else {
      // Dropped on column - add at end
      newSortOrder = (targetColumnDeals.length) * 100;
    }

    // Optimistic update
    setDeals((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dealId) {
          return { ...d, stage: newStage, sort_order: newSortOrder, updated_at: new Date().toISOString() };
        }
        // Apply sort order updates for other cards in the column
        const updateEntry = updates.find((u) => u.id === d.id);
        if (updateEntry) {
          return { ...d, sort_order: updateEntry.sort_order };
        }
        return d;
      });
      
      // Re-sort by sort_order
      return updated.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    });

    // Update the dragged deal in database
    const { error } = await supabase
      .from('deals')
      .update({ 
        stage: newStage, 
        sort_order: newSortOrder,
        updated_at: new Date().toISOString() 
      })
      .eq('id', dealId);

    if (error) {
      console.error('Error updating deal:', error);
      fetchDeals(); // Revert on error
      return;
    }

    // Update sort orders for other cards if needed
    if (updates.length > 0) {
      for (const update of updates) {
        if (update.id !== dealId) {
          await supabase
            .from('deals')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }
      }
    }

    // Add activity only for stage changes
    if (isStageChange) {
      await supabase.from('deal_activities').insert({
        deal_id: dealId,
        date: format(new Date(), 'yyyy-MM-dd'),
        note: `Moved to ${newStage}`,
      });
    }
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
  const filteredDeals = deals.filter((d) => {
    // Filter by archived status
    if (!showArchived && d.archived) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesBrand = d.brand?.toLowerCase().includes(query);
      const matchesContact = d.contact_name?.toLowerCase().includes(query);
      const matchesEmail = d.contact_email?.toLowerCase().includes(query);
      if (!matchesBrand && !matchesContact && !matchesEmail) return false;
    }
    
    return true;
  });

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

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex gap-2 items-center">
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
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands..."
            className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              deals={filteredDeals.filter((d) => d.stage === stage)}
              onDealClick={handleDealClick}
              activeOverId={activeOverId}
              activeDragId={activeDragId}
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
