'use client';

import { useState, useRef, useEffect } from 'react';
import { Deal, STAGES, STAGE_LABELS } from '@/types/database';
import { isBefore, parseISO, startOfDay, isEqual } from 'date-fns';
import TierProgress from './TierProgress';
import MonthlyGoals from './MonthlyGoals';
import BrandiFeedback from './BrandiFeedback';
import { useAuth } from './AuthProvider';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface DashboardProps {
  deals: Deal[];
  onScrollToDeal?: (dealId: string) => void;
  onSwitchToCalendar?: () => void;
}

function parseValue(value: string | null): number {
  if (!value) return 0;
  const match = value.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
}

interface DealDropdownProps {
  label: string;
  count: number;
  deals: Deal[];
  bgColor: string;
  borderColor: string;
  textColor: string;
  countColor: string;
  onSelectDeal?: (dealId: string) => void;
}

function DealDropdown({ 
  label, 
  count, 
  deals, 
  bgColor, 
  borderColor, 
  textColor, 
  countColor,
  onSelectDeal 
}: DealDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDealClick = (dealId: string) => {
    setIsOpen(false);
    onSelectDeal?.(dealId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${bgColor} rounded-lg px-4 py-2 border ${borderColor} hover:shadow-md transition-shadow cursor-pointer text-left`}
      >
        <p className={`text-sm ${textColor} font-medium flex items-center gap-1`}>
          {label}
          <svg 
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </p>
        <p className={`text-2xl font-bold ${countColor}`}>{count}</p>
      </button>

      {isOpen && deals.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {deals.map((deal) => (
            <button
              key={deal.id}
              onClick={() => handleDealClick(deal.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-900 text-sm">{deal.brand}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {STAGE_LABELS[deal.stage]}
                </span>
              </div>
              {deal.next_action && (
                <p className="text-xs text-gray-500 mt-1 truncate">→ {deal.next_action}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ deals, onScrollToDeal, onSwitchToCalendar }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [showBrandiFeedback, setShowBrandiFeedback] = useState(false);
  const activeDeals = deals.filter((d) => !d.archived && d.stage !== 'paused');
  
  // Value buckets based on stage
  const potentialValue = deals
    .filter(d => d.stage === 'negotiation' && !d.archived)
    .reduce((sum, d) => sum + parseValue(d.value), 0);
  
  const agreedValue = deals
    .filter(d => (d.stage === 'agreed' || d.stage === 'contract') && !d.archived)
    .reduce((sum, d) => sum + parseValue(d.value), 0);
  
  const currentContractsValue = deals
    .filter(d => ['content', 'approval', 'scheduled', 'delivered', 'invoiced'].includes(d.stage) && !d.archived)
    .reduce((sum, d) => sum + parseValue(d.value), 0);
  
  // Paid this year — using stage_changed_at (when deal moved to paid stage)
  const currentYear = new Date().getFullYear();
  const paidThisYear = deals
    .filter(d => d.stage === 'paid' && !d.archived)
    .filter(d => {
      const changeDate = d.stage_changed_at;
      if (changeDate) {
        const year = new Date(changeDate).getFullYear();
        return year === currentYear;
      }
      return true; // Include if no date to filter by
    })
    .reduce((sum, d) => sum + parseValue(d.value), 0);

  const today = startOfDay(new Date());
  
  const overdueDeals = activeDeals.filter(
    (d) => d.next_action_date && isBefore(parseISO(d.next_action_date), today)
  );

  const dueTodayDeals = activeDeals.filter(
    (d) => d.next_action_date && isEqual(startOfDay(parseISO(d.next_action_date)), today)
  );

  const waitingOnBrand = activeDeals.filter((d) => d.waiting_on === 'brand').length;
  const waitingOnUs = activeDeals.filter((d) => d.waiting_on === 'us').length;

  const stageCounts = STAGES.filter(s => s !== 'paused' && s !== 'complete').reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage && !d.archived).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
    {/* Sticky top bar */}
    <div className="sticky top-0 z-40 bg-white shadow-sm border-b px-4 py-2 sm:py-3 -mx-4 -mt-4 mb-4">
      <div className="flex flex-wrap gap-2 sm:gap-4 items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Brand Deals Pipeline</h1>
          <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">Track partnerships from pitch to payment</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <div className="bg-blue-50 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-600 font-medium">Active</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{activeDeals.length}</p>
          </div>

          {overdueDeals.length > 0 && (
            <DealDropdown
              label="Overdue"
              count={overdueDeals.length}
              deals={overdueDeals}
              bgColor="bg-red-50"
              borderColor="border-red-200"
              textColor="text-red-600"
              countColor="text-red-700"
              onSelectDeal={onScrollToDeal}
            />
          )}

          {dueTodayDeals.length > 0 && (
            <DealDropdown
              label="Due Today"
              count={dueTodayDeals.length}
              deals={dueTodayDeals}
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              textColor="text-orange-600"
              countColor="text-orange-700"
              onSelectDeal={onScrollToDeal}
            />
          )}

          <div className="bg-amber-50 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 border border-amber-200">
            <p className="text-xs sm:text-sm text-amber-600 font-medium">Waiting</p>
            <p className="text-base sm:text-lg font-bold text-amber-700">
              <span title="Waiting on brand">🏢 {waitingOnBrand}</span>
              {' / '}
              <span title="Waiting on us">📌 {waitingOnUs}</span>
            </p>
          </div>

          <button
            onClick={() => setShowBrandiFeedback(true)}
            className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            title="Give Brandi feedback or instructions"
          >
            <p className="text-sm text-indigo-600 font-medium flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden sm:inline">Brandi</span>
            </p>
          </button>

          {onSwitchToCalendar && (
            <button
              onClick={onSwitchToCalendar}
              className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Calendar</span>
              </p>
            </button>
          )}

          <UserMenu user={user} signOut={signOut} />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
      {/* Value Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-purple-50 rounded-lg px-4 py-3 border border-purple-200">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Potential</p>
          <p className="text-xl font-bold text-purple-700">${potentialValue.toLocaleString()}</p>
          <p className="text-xs text-purple-500">In negotiation</p>
        </div>

        <div className="bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Agreed Upon</p>
          <p className="text-xl font-bold text-amber-700">${agreedValue.toLocaleString()}</p>
          <p className="text-xs text-amber-500">Agreed + contract review</p>
        </div>

        <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Active Contracts</p>
          <p className="text-xl font-bold text-blue-700">${currentContractsValue.toLocaleString()}</p>
          <p className="text-xs text-blue-500">Content → invoiced</p>
        </div>

        <div className="bg-green-50 rounded-lg px-4 py-3 border border-green-200">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Paid ({currentYear})</p>
          <p className="text-xl font-bold text-green-700">${paidThisYear.toLocaleString()}</p>
          <p className="text-xs text-green-500">Received this year</p>
        </div>
      </div>

      {/* Collapsible Goals Section */}
      <details className="mt-4 group">
        <summary className="cursor-pointer list-none flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2 border border-gray-200 transition-colors">
          <span className="font-medium text-gray-700">📊 Monthly Goals & Tier Progress</span>
          <svg 
            className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-2 space-y-4">
          <MonthlyGoals deals={deals} />
          <TierProgress deals={deals} />
        </div>
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(stageCounts)
          .filter(([, count]) => count > 0)
          .map(([stage, count]) => (
            <span
              key={stage}
              className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600"
            >
              {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}: {count}
            </span>
          ))}
      </div>
    </div>

    <BrandiFeedback isOpen={showBrandiFeedback} onClose={() => setShowBrandiFeedback(false)} />
    </>
  );
}

// --- User Menu with password change ---

function UserMenu({ user, signOut }: { user: User | null; signOut: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {user?.email?.split('@')[0] || 'Account'}
          </p>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setIsOpen(false); setShowPasswordModal(true); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
            <button
              onClick={() => { setIsOpen(false); signOut(); }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

        {success ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Password updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Re-enter password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

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
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
