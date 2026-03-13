'use client';

import { useState, useEffect } from 'react';
import { Deal, DealActivity, DealStage, STAGES, STAGE_LABELS, STAGE_COLORS, Priority, WaitingOn, DealType } from '@/types/database';
import { format, parseISO } from 'date-fns';

interface DealModalProps {
  deal: Deal | null;
  activities: DealActivity[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Partial<Deal>, keepOpen?: boolean) => void;
  onAddActivity: (dealId: string, note: string) => void;
  onArchive: (dealId: string) => void;
  onCreateMonthlyPortion?: (parentDealId: string) => void;
  isNew?: boolean;
  childDeals?: Deal[]; // Child deals for this parent
  parentDeal?: Deal | null; // Parent deal if this is a child
}

export default function DealModal({
  deal,
  activities,
  isOpen,
  onClose,
  onSave,
  onAddActivity,
  onArchive,
  onCreateMonthlyPortion,
  isNew = false,
  childDeals = [],
  parentDeal = null,
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
        stage: 'outreach',
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
        is_repeat_brand: false,
        past_history: '',
        deal_type: 'posted',
        is_multi_month: false,
        total_months: null,
        monthly_value: null,
        parent_deal_id: null,
        month_number: null,
      });
    }
  }, [deal, isNew]);

  // Computed values for multi-month deals
  const isParentDeal = formData.is_multi_month && !formData.parent_deal_id;
  const isChildDeal = !!formData.parent_deal_id;
  const completedMonths = childDeals.filter(c => c.stage === 'paid' || c.stage === 'complete').length;
  const totalChildValue = childDeals.reduce((sum, c) => {
    const match = c.value?.match(/\$?([\d,]+)/);
    return sum + (match ? parseInt(match[1].replace(/,/g, ''), 10) : 0);
  }, 0);
  const remainingValue = isParentDeal && formData.total_months && formData.monthly_value
    ? (formData.total_months * formData.monthly_value) - totalChildValue
    : null;

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
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${STAGE_COLORS[formData.stage as DealStage || 'outreach']}`}>
                    <select
                      value={formData.stage || 'outreach'}
                      onChange={(e) => {
                        const newStage = e.target.value as DealStage;
                        setFormData({ ...formData, stage: newStage });
                        // Auto-save stage change, keep modal open
                        onSave({ ...formData, stage: newStage }, true);
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

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={formData.stage || 'outreach'}
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
                    Deal Type
                  </label>
                  <select
                    value={formData.deal_type || 'posted'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deal_type: e.target.value as DealType,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="posted">📱 Posted</option>
                    <option value="ugc">🎬 UGC Only</option>
                    <option value="hybrid">🔄 Hybrid</option>
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
              
              {/* Deal type info */}
              {formData.deal_type === 'ugc' && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  🎬 UGC deals skip Scheduled → Delivered (brand posts the content)
                </p>
              )}

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
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData({
                        ...formData,
                        next_action_date: newDate,
                      });
                      // Auto-save date change (skip for new deals), keep modal open
                      if (!isNew) {
                        onSave({ ...formData, next_action_date: newDate }, true);
                      }
                    }}
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
                  onBlur={(e) => {
                    // Auto-save on blur (skip for new deals), keep modal open
                    if (!isNew && e.target.value !== deal?.next_action) {
                      onSave({ ...formData, next_action: e.target.value }, true);
                    }
                  }}
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

              {/* Repeat Brand Section */}
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_repeat_brand || false}
                    onChange={(e) =>
                      setFormData({ ...formData, is_repeat_brand: e.target.checked })
                    }
                    className="rounded border-purple-400 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-purple-800">
                    ↺ Repeat Brand (worked together before)
                  </span>
                </label>
                {formData.is_repeat_brand && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      Past History
                    </label>
                    <textarea
                      value={formData.past_history || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, past_history: e.target.value })
                      }
                      rows={2}
                      placeholder="Previous campaigns, total value, deliverables, outcome..."
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Multi-Month Deal Section */}
              {!isChildDeal && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_multi_month || false}
                      onChange={(e) =>
                        setFormData({ 
                          ...formData, 
                          is_multi_month: e.target.checked,
                          total_months: e.target.checked ? formData.total_months : null,
                          monthly_value: e.target.checked ? formData.monthly_value : null,
                        })
                      }
                      className="rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-blue-800">
                      📅 Multi-Month Deal
                    </span>
                  </label>
                  {formData.is_multi_month && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Total Months
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.total_months || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, total_months: e.target.value ? parseInt(e.target.value) : null })
                            }
                            placeholder="6"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Monthly Value ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.monthly_value || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, monthly_value: e.target.value ? parseFloat(e.target.value) : null })
                            }
                            placeholder="875.00"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      </div>
                      {formData.total_months && formData.monthly_value && (
                        <div className="text-sm text-blue-700">
                          Total contract value: <strong>${(formData.total_months * formData.monthly_value).toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Child Deal Info */}
              {isChildDeal && parentDeal && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-700">
                    <span className="font-medium">📅 Monthly Portion</span> of {parentDeal.brand}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    Month {formData.month_number} of {parentDeal.total_months}
                  </p>
                </div>
              )}

              {/* Monthly Portions List (for parent deals) */}
              {isParentDeal && !isNew && childDeals.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Monthly Portions ({completedMonths}/{childDeals.length} paid)
                  </p>
                  <div className="space-y-1">
                    {childDeals.map((child) => (
                      <div key={child.id} className="flex justify-between text-xs">
                        <span className={child.stage === 'paid' ? 'text-green-600' : 'text-gray-600'}>
                          Month {child.month_number}: {child.stage}
                        </span>
                        <span className="text-gray-500">{child.value}</span>
                      </div>
                    ))}
                  </div>
                  {remainingValue !== null && remainingValue > 0 && (
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
                      Remaining: <strong className="text-green-600">${remainingValue.toLocaleString()}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Create Monthly Portion Button */}
              {isParentDeal && !isNew && onCreateMonthlyPortion && childDeals.length < (formData.total_months || 0) && (
                <button
                  type="button"
                  onClick={() => deal?.id && onCreateMonthlyPortion(deal.id)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  <span>Create Month {childDeals.length + 1} Portion</span>
                </button>
              )}

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
