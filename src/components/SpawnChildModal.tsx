'use client';

import { useState, useEffect } from 'react';
import { Deal, DealStage, STAGES, STAGE_LABELS } from '@/types/database';

interface SpawnChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentDeal: Deal;
  existingChildCount: number;
  onSpawn: (data: {
    stage: DealStage;
    value: number;
    notes: string;
  }) => Promise<void>;
}

export default function SpawnChildModal({
  isOpen,
  onClose,
  parentDeal,
  existingChildCount,
  onSpawn,
}: SpawnChildModalProps) {
  const [stage, setStage] = useState<DealStage>('content');
  const [value, setValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setStage('content');
      // Suggest monthly value if available
      setValue(parentDeal.monthly_value?.toString() || '');
      setNotes('');
    }
  }, [isOpen, parentDeal.monthly_value]);

  if (!isOpen) return null;

  const monthNumber = existingChildCount + 1;
  const childName = `${parentDeal.brand} — Phase ${monthNumber}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericValue = parseFloat(value) || 0;
    if (numericValue <= 0) {
      alert('Please enter a valid dollar amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSpawn({
        stage,
        value: numericValue,
        notes,
      });
      onClose();
    } catch (error) {
      console.error('Error spawning child:', error);
      alert('Failed to create child card');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out stages that don't make sense for children (complete, paused)
  const availableStages = STAGES.filter(s => !['complete', 'paused'].includes(s));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Phase
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Child name preview */}
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-dashed border-indigo-300">
            <p className="text-sm text-indigo-700 font-medium">{childName}</p>
            <p className="text-xs text-indigo-500">
              Child of: {parentDeal.brand}
            </p>
          </div>

          {/* Stage selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableStages.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Dollar amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This amount will be subtracted from the parent card
            </p>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., March deliverable, specific products..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Phase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
