'use client';

import { useState, useEffect } from 'react';
import { Deal, DealActivity, DealStage, STAGES, STAGE_LABELS, STAGE_COLORS, Priority, WaitingOn } from '@/types/database';
import { format, parseISO } from 'date-fns';

interface DealModalProps {
  deal: Deal | null;
  activities: DealActivity[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Partial<Deal>) => void;
  onAddActivity: (dealId: string, note: string) => void;
  onArchive: (dealId: string) => void;
  isNew?: boolean;
}

export default function DealModal({
  deal,
  activities,
  isOpen,
  onClose,
  onSave,
  onAddActivity,
  onArchive,
  isNew = false,
}: DealModalProps) {
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  useEffect(() => {
    if (deal) {
      setFormData(deal);
    } else if (isNew) {
      setFormData({
        brand: '',
        slug: '',
        stage: 'pitch',
        priority: 'medium',
        value: '',
        contact_name: '',
        contact_email: '',
        contact_source: '',
        last_contact: format(new Date(), 'yyyy-MM-dd'),
        next_action: '',
        next_action_date: '',
        waiting_on: null,
        follow_up_count: 0,
        notes: '',
        archived: false,
      });
    }
  }, [deal, isNew]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAddActivity = () => {
    if (newNote.trim() && deal?.id) {
      onAddActivity(deal.id, newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">
                {isNew ? 'New Deal' : formData.brand}
              </h2>
              {!isNew && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Move to:</span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${STAGE_COLORS[formData.stage as DealStage || 'pitch']}`}>
                    <select
                      value={formData.stage || 'pitch'}
                      onChange={(e) => {
                        const newStage = e.target.value as DealStage;
                        setFormData({ ...formData, stage: newStage });
                        // Auto-save stage change
                        onSave({ ...formData, stage: newStage });
                      }}
                      className="text-sm font-medium bg-transparent cursor-pointer focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {!isNew && (
          <div className="flex border-b">
            <button
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'activity'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              Activity ({activities.length})
            </button>
          </div>
        )}

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        brand: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={formData.value || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    placeholder="$1,000"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={formData.stage || 'pitch'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stage: e.target.value as DealStage,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as Priority,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waiting On
                  </label>
                  <select
                    value={formData.waiting_on || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waiting_on: (e.target.value || null) as WaitingOn,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    <option value="brand">Brand</option>
                    <option value="us">Us</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Source
                </label>
                <input
                  type="text"
                  value={formData.contact_source || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_source: e.target.value })
                  }
                  placeholder="e.g., Picking Daisies Media"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Contact
                  </label>
                  <input
                    type="date"
                    value={formData.last_contact || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, last_contact: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Action Date
                  </label>
                  <input
                    type="date"
                    value={formData.next_action_date || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        next_action_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Action
                </label>
                <input
                  type="text"
                  value={formData.next_action || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, next_action: e.target.value })
                  }
                  placeholder="What needs to happen next?"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between pt-4 border-t">
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => deal?.id && onArchive(deal.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Archive
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add activity note..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddActivity();
                    }
                  }}
                />
                <button
                  onClick={handleAddActivity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No activity yet
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-gray-700">{activity.note}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {format(parseISO(activity.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
