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
import { Deal, DealActivity, DealStage, STAGES, STAGE_LABELS } from '@/types/database';
import { supabase } from '@/lib/supabase';
import Column from './Column';
import DealCard from './DealCard';
import DealModal from './DealModal';
import SpawnChildModal from './SpawnChildModal';
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

interface KanbanBoardProps {
  onSwitchToCalendar?: () => void;
}

export default function KanbanBoard({ onSwitchToCalendar }: KanbanBoardProps) {
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
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [spawnParentDeal, setSpawnParentDeal] = useState<Deal | null>(null);

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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }

    setActivities(data || []);
  }, []);

  useEffect(() => {
    // Sync any pending Brandi updates before loading deals
    fetch('/api/brandi/sync').finally(() => fetchDeals());

    // Auto-refresh deals every 30 seconds to pick up changes from Brandi or other users
    const interval = setInterval(() => {
      fetch('/api/brandi/sync').finally(() => fetchDeals());
    }, 30000);
    return () => clearInterval(interval);
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
    
    // Double-check: newStage must be one of our known stages (use STAGES constant, not hardcoded list)

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
    const updateData = { 
      stage: newStage, 
      sort_order: newSortOrder,
      updated_at: new Date().toISOString() 
    } as Partial<Deal>;
    
    // Track stage change timestamp for monthly goals
    if (isStageChange) {
      updateData.stage_changed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('deals')
      .update(updateData)
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

  const handleSave = async (dealData: Partial<Deal>, keepOpen = false) => {
    if (isNewDeal) {
      // Auto-generate slug from brand name if not provided
      if (!dealData.slug && dealData.brand) {
        const baseSlug = dealData.brand
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        // Check for existing slugs and append number if needed
        const existing = deals.filter(d => d.slug.startsWith(baseSlug));
        dealData.slug = existing.length > 0 ? `${baseSlug}-${existing.length + 1}` : baseSlug;
      }

      // Clean data: empty strings → null for DATE columns, strip computed fields
      const cleanedData = { ...dealData };
      if (!cleanedData.next_action_date) cleanedData.next_action_date = null;
      if (!cleanedData.last_contact) cleanedData.last_contact = null;
      if (!cleanedData.next_action) cleanedData.next_action = null;
      if (!cleanedData.value) cleanedData.value = null;
      // Remove computed/non-DB fields that would cause insert to fail
      delete (cleanedData as Record<string, unknown>).children;
      delete (cleanedData as Record<string, unknown>).parent;

      const { data, error } = await supabase
        .from('deals')
        .insert({
          ...cleanedData,
          stage_changed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating deal:', error);
        alert(`Failed to create deal: ${error.message}`);
        return;
      }

      setDeals((prev) => [data, ...prev]);
    } else if (selectedDeal?.id) {
      const updatePayload = { ...dealData, updated_at: new Date().toISOString() } as Partial<Deal>;

      // Track stage change timestamp if stage is changing
      if (dealData.stage && dealData.stage !== selectedDeal.stage) {
        updatePayload.stage_changed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deals')
        .update(updatePayload)
        .eq('id', selectedDeal.id);

      if (error) {
        console.error('Error updating deal:', error);
        return;
      }

      // Auto-log meaningful changes as activity
      const changes: string[] = [];
      if (dealData.stage && dealData.stage !== selectedDeal.stage) {
        changes.push(`Stage: ${STAGE_LABELS[selectedDeal.stage] || selectedDeal.stage} → ${STAGE_LABELS[dealData.stage as DealStage] || dealData.stage}`);
      }
      if (dealData.value !== undefined && dealData.value !== selectedDeal.value) {
        changes.push(`Value: ${selectedDeal.value || 'none'} → ${dealData.value || 'none'}`);
      }
      if (dealData.priority !== undefined && dealData.priority !== selectedDeal.priority) {
        changes.push(`Priority: ${selectedDeal.priority} → ${dealData.priority}`);
      }
      if (dealData.waiting_on !== undefined && dealData.waiting_on !== selectedDeal.waiting_on) {
        changes.push(`Waiting on: ${selectedDeal.waiting_on || 'none'} → ${dealData.waiting_on || 'none'}`);
      }
      if (dealData.contact_name !== undefined && dealData.contact_name !== selectedDeal.contact_name && dealData.contact_name) {
        changes.push(`Contact: ${dealData.contact_name}`);
      }
      if (dealData.brief_url !== undefined && dealData.brief_url !== selectedDeal.brief_url) {
        changes.push(dealData.brief_url ? 'Brief uploaded' : 'Brief removed');
      }
      if (dealData.contract_url !== undefined && dealData.contract_url !== selectedDeal.contract_url) {
        changes.push(dealData.contract_url ? 'Contract uploaded' : 'Contract removed');
      }

      if (changes.length > 0) {
        await supabase.from('deal_activities').insert({
          deal_id: selectedDeal.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          note: changes.join(' | '),
        });
      }

      setDeals((prev) =>
        prev.map((d) =>
          d.id === selectedDeal.id
            ? { ...d, ...dealData, updated_at: new Date().toISOString() }
            : d
        )
      );
    }

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

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, archived: true } : d
      )
    );

    setIsModalOpen(false);
    setSelectedDeal(null);
  };

  const handleCreateMonthlyPortion = async (parentDealId: string) => {
    const parentDeal = deals.find(d => d.id === parentDealId);
    if (!parentDeal || !parentDeal.is_multi_month) return;

    const existingChildren = getChildDeals(parentDealId);
    const nextMonthNumber = existingChildren.length + 1;
    const totalMonths = parentDeal.total_months || 0;

    // Parent card is the final month (month N), so children are months 1 through N-1
    if (totalMonths > 0 && nextMonthNumber >= totalMonths) {
      console.error('All child phases created — parent card is the final phase');
      return;
    }

    const monthlyValue = parentDeal.monthly_value || 0;

    const { data, error } = await supabase
      .from('deals')
      .insert({
        brand: parentDeal.brand,
        slug: `${parentDeal.slug}-month-${nextMonthNumber}`,
        stage: 'content', // Child cards start in content
        priority: parentDeal.priority,
        value: `$${monthlyValue.toLocaleString()}`,
        contact_name: parentDeal.contact_name,
        contact_email: parentDeal.contact_email,
        contact_source: parentDeal.contact_source,
        waiting_on: 'us',
        follow_up_count: 0,
        notes: `Phase ${nextMonthNumber} of ${parentDeal.total_months} for ${parentDeal.brand}`,
        archived: false,
        is_multi_month: true,
        parent_deal_id: parentDealId,
        month_number: nextMonthNumber,
        monthly_value: monthlyValue,
        total_months: parentDeal.total_months,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating phase:', error);
      return;
    }

    // Subtract child value from parent
    const currentValue = parseFloat(parentDeal.value?.replace(/[$,]/g, '') || '0');
    const newValue = Math.max(0, currentValue - monthlyValue);

    await supabase
      .from('deals')
      .update({
        value: newValue > 0 ? `$${newValue.toLocaleString()} remaining` : parentDeal.value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parentDealId);

    // Add activity to parent
    await supabase.from('deal_activities').insert({
      deal_id: parentDealId,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: `Created Phase ${nextMonthNumber} ($${monthlyValue.toLocaleString()})`,
    });

    setDeals((prev) => [data, ...prev]);
    fetchDeals();
  };

  // Open spawn child modal
  const handleSpawnChild = (deal: Deal) => {
    setSpawnParentDeal(deal);
    setIsSpawnModalOpen(true);
  };

  // Scroll to a specific deal card
  const handleScrollToDeal = (dealId: string) => {
    const element = document.getElementById(`deal-${dealId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      // Add a brief highlight effect
      element.classList.add('ring-4', 'ring-blue-400');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-blue-400');
      }, 2000);
    }
  };

  // Actually spawn the child card (from + button / SpawnChildModal)
  // This should ALWAYS work — no limit on total_months — so the deal can be extended.
  const handleDoSpawn = async (data: { stage: DealStage; value: number; notes: string }) => {
    if (!spawnParentDeal) return;

    const existingChildren = getChildDeals(spawnParentDeal.id);
    const nextMonthNumber = existingChildren.length + 1;

    // Create the child card
    const { error } = await supabase
      .from('deals')
      .insert({
        brand: `${spawnParentDeal.brand} — Phase ${nextMonthNumber}`,
        slug: `${spawnParentDeal.slug}-phase-${nextMonthNumber}`,
        stage: data.stage,
        priority: spawnParentDeal.priority,
        value: `$${data.value.toLocaleString()}`,
        contact_name: spawnParentDeal.contact_name,
        contact_email: spawnParentDeal.contact_email,
        contact_source: spawnParentDeal.contact_source,
        waiting_on: 'us',
        follow_up_count: 0,
        notes: data.notes || `Phase ${nextMonthNumber} for ${spawnParentDeal.brand}`,
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

    // Update parent card: mark as multi-month, expand total_months if needed
    const currentValue = parseFloat(spawnParentDeal.value?.replace(/[$,]/g, '') || '0');
    const newValue = Math.max(0, currentValue - data.value);
    const newTotalMonths = Math.max(spawnParentDeal.total_months || 0, nextMonthNumber);

    await supabase
      .from('deals')
      .update({
        is_multi_month: true,
        total_months: newTotalMonths,
        monthly_value: data.value,
        value: newValue > 0 ? `$${newValue.toLocaleString()} remaining` : spawnParentDeal.value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', spawnParentDeal.id);

    // Add activity to parent
    await supabase.from('deal_activities').insert({
      deal_id: spawnParentDeal.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: `Spawned Phase ${nextMonthNumber} ($${data.value.toLocaleString()}) → ${data.stage}`,
    });

    // Refresh deals
    fetchDeals();
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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <Dashboard deals={filteredDeals} onScrollToDeal={handleScrollToDeal} onSwitchToCalendar={onSwitchToCalendar} />

      <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2 sm:gap-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleNewDeal}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base"
          >
            + New Deal
          </button>
          <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            <span className="hidden sm:inline">Show archived</span>
            <span className="sm:hidden">Archived</span>
          </label>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands..."
            className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 sm:w-64"
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

      {/* Unsorted deals banner — deals with stages not in the kanban */}
      <UnsortedBanner
        deals={filteredDeals.filter(d => !STAGES.includes(d.stage))}
        onDealClick={handleDealClick}
        onBatchAssign={async (dealIds, stage) => {
          for (const id of dealIds) {
            await supabase
              .from('deals')
              .update({ stage, stage_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq('id', id);
            await supabase.from('deal_activities').insert({
              deal_id: id,
              date: format(new Date(), 'yyyy-MM-dd'),
              note: `Moved to ${STAGE_LABELS[stage]} (batch assign from unsorted)`,
            });
          }
          setDeals(prev => prev.map(d => dealIds.includes(d.id) ? { ...d, stage } : d));
        }}
      />

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
              onSpawnChild={handleSpawnChild}
              activeOverId={activeOverId}
              activeDragId={activeDragId}
              getChildCount={(id) => getChildDeals(id).length}
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
        onCreateMonthlyPortion={handleCreateMonthlyPortion}
        isNew={isNewDeal}
        childDeals={selectedDeal ? getChildDeals(selectedDeal.id) : []}
        parentDeal={selectedDeal ? getParentDeal(selectedDeal.parent_deal_id) : null}
      />

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

// --- Unsorted Deals Banner ---

function UnsortedBanner({
  deals,
  onDealClick,
  onBatchAssign,
}: {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onBatchAssign: (dealIds: string[], stage: DealStage) => Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchStage, setBatchStage] = useState<DealStage>('negotiation');
  const [isAssigning, setIsAssigning] = useState(false);

  if (deals.length === 0) return null;

  const allSelected = deals.length > 0 && selectedIds.size === deals.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deals.map(d => d.id)));
    }
  };

  const handleBatchAssign = async () => {
    if (selectedIds.size === 0) return;
    setIsAssigning(true);
    await onBatchAssign(Array.from(selectedIds), batchStage);
    setSelectedIds(new Set());
    setIsAssigning(false);
  };

  return (
    <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-amber-800">
          {deals.length} unsorted deal{deals.length > 1 ? 's' : ''}
        </p>
        {deals.length > 1 && (
          <button
            onClick={toggleAll}
            className="text-xs text-amber-700 hover:text-amber-900 font-medium"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {deals.map((d) => (
          <button
            key={d.id}
            onClick={(e) => {
              if (selectedIds.size > 0 || e.shiftKey) {
                toggleSelect(d.id);
              } else {
                onDealClick(d);
              }
            }}
            className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
              selectedIds.has(d.id)
                ? 'bg-amber-200 border-amber-400'
                : 'bg-white border-amber-300 hover:bg-amber-100'
            }`}
          >
            {selectedIds.size > 0 && (
              <input
                type="checkbox"
                checked={selectedIds.has(d.id)}
                onChange={() => toggleSelect(d.id)}
                className="mr-1.5 rounded border-amber-400"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <span className="font-medium text-gray-900">{d.brand}</span>
            <span className="text-gray-500 ml-1.5 text-xs">({d.stage})</span>
          </button>
        ))}
      </div>

      {/* Batch assign controls */}
      <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
        <span className="text-xs text-amber-700 font-medium">Assign to:</span>
        <select
          value={batchStage}
          onChange={(e) => setBatchStage(e.target.value as DealStage)}
          className="text-sm border border-amber-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-amber-400"
        >
          {STAGES.map(s => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={handleBatchAssign}
          disabled={selectedIds.size === 0 || isAssigning}
          className="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
        >
          {isAssigning ? 'Assigning...' : `Move ${selectedIds.size > 0 ? selectedIds.size : 'selected'}`}
        </button>
      </div>
    </div>
  );
}
