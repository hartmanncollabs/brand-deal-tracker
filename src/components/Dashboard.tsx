'use client';

import { useState, useRef, useEffect } from 'react';
import { Deal, STAGES, STAGE_LABELS } from '@/types/database';
import { isBefore, parseISO, startOfDay, isEqual } from 'date-fns';
import TierProgress from './TierProgress';

interface DashboardProps {
  deals: Deal[];
  onScrollToDeal?: (dealId: string) => void;
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

export default function Dashboard({ deals, onScrollToDeal }: DashboardProps) {
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
  
  // Paid this year (2026)
  const currentYear = new Date().getFullYear();
  const paidThisYear = deals
    .filter(d => d.stage === 'paid' && !d.archived)
    .filter(d => {
      // Check if last_contact or updated_at is this year
      if (d.last_contact) {
        const year = new Date(d.last_contact).getFullYear();
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
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Brand Deals Pipeline</h1>
          <p className="text-gray-500">Track partnerships from pitch to payment</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-blue-50 rounded-lg px-4 py-2 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Active Deals</p>
            <p className="text-2xl font-bold text-blue-700">{activeDeals.length}</p>
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

          <div className="bg-amber-50 rounded-lg px-4 py-2 border border-amber-200">
            <p className="text-sm text-amber-600 font-medium">Waiting</p>
            <p className="text-lg font-bold text-amber-700">
              <span title="Waiting on brand">🏢 {waitingOnBrand}</span>
              {' / '}
              <span title="Waiting on us">📌 {waitingOnUs}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Value Breakdown */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Tier Progress for March 2025 */}
      <div className="mt-4">
        <TierProgress deals={deals} />
      </div>

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
  );
}
