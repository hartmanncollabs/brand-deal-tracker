'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { Deal, STAGE_LABELS, DealStage } from '@/types/database';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

interface FeedbackEntry {
  id: string;
  message: string;
  author: string;
  created_at: string;
}

interface RunEntry {
  id: string;
  summary: string;
  deals_created: number;
  deals_updated: number;
  emails_scanned: number;
  suggestions: { type: string; brand: string; message: string }[] | null;
  created_at: string;
}

interface BrandiFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  deals?: Deal[];
  onScrollToDeal?: (dealId: string) => void;
}

export default function BrandiFeedback({ isOpen, onClose, deals = [], onScrollToDeal }: BrandiFeedbackProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'focus' | 'runs' | 'feedback'>('focus');
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [dismissedOverdue, setDismissedOverdue] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const runCountRef = useRef(0);

  const fetchRuns = useCallback(async () => {
    const { data } = await supabase
      .from('brandi_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      if (isRunning && data.length > runCountRef.current) {
        setIsRunning(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
      runCountRef.current = data.length;
      setRuns(data);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isOpen) {
      fetchFeedback();
      fetchRuns();
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, fetchRuns]);

  useEffect(() => {
    if (activeTab === 'feedback') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, activeTab]);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('brandi_feedback')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setEntries(data);
  };

  const handleRunNow = () => {
    setIsRunning(true);
    setActiveTab('runs');
    runCountRef.current = runs.length;
    window.open('https://claude.ai/code/scheduled/trig_01MXqTt6Hj3C8wz33mKmTvgS', '_blank');
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(fetchRuns, 15000);
    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsRunning(false);
    }, 600000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSubmitting(true);
    const author = user?.email?.split('@')[0] || 'unknown';
    const { data, error } = await supabase
      .from('brandi_feedback')
      .insert({ message: newMessage.trim(), author })
      .select()
      .single();
    if (!error && data) {
      setEntries(prev => [...prev, data]);
      setNewMessage('');
    }
    setIsSubmitting(false);
  };

  // Compute focus items
  const today = startOfDay(new Date());
  const overdueDeals = deals.filter(
    d => !d.archived && d.stage !== 'paused' && d.stage !== 'complete' &&
      d.next_action_date && isBefore(parseISO(d.next_action_date), today) &&
      !dismissedOverdue.has(d.id)
  ).sort((a, b) => a.next_action_date!.localeCompare(b.next_action_date!));

  const staleDeals = deals.filter(
    d => !d.archived && d.stage !== 'paused' && d.stage !== 'complete' && d.stage !== 'paid' &&
      !d.next_action_date && d.waiting_on === 'brand' &&
      d.last_contact && isBefore(parseISO(d.last_contact), new Date(Date.now() - 7 * 86400000))
  );

  // Get latest suggestions from most recent run
  const latestSuggestions = runs.length > 0 && runs[0].suggestions ? runs[0].suggestions : [];

  const focusCount = overdueDeals.length + staleDeals.length + latestSuggestions.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-indigo-50 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">Brandi</span>
            <h2 className="text-lg font-semibold text-gray-900">Agent Panel</h2>
            {isRunning && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs rounded-full font-medium animate-pulse">
                <span className="h-2 w-2 bg-indigo-600 rounded-full animate-spin" style={{ animationDuration: '1s' }}></span>
                Scanning...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunNow}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                  Running...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Now
                </>
              )}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('focus')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'focus' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Focus
            {focusCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">{focusCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('runs')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'runs' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Runs
            {runs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{runs.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'feedback' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Feedback
          </button>
        </div>

        {/* Focus Tab */}
        {activeTab === 'focus' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
            {/* Overdue Items */}
            {overdueDeals.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                  Overdue ({overdueDeals.length})
                </h3>
                <div className="space-y-2">
                  {overdueDeals.map(deal => (
                    <div key={deal.id} className="bg-red-50 rounded-lg border border-red-200 p-3 flex items-start justify-between gap-2">
                      <button
                        onClick={() => { onScrollToDeal?.(deal.id); onClose(); }}
                        className="text-left flex-1 hover:opacity-80"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{deal.brand}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                            {deal.next_action_date ? format(parseISO(deal.next_action_date), 'MMM d') : ''}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {STAGE_LABELS[deal.stage as DealStage] || deal.stage}
                          </span>
                        </div>
                        {deal.next_action && (
                          <p className="text-xs text-gray-600 mt-1 italic">→ {deal.next_action}</p>
                        )}
                      </button>
                      <button
                        onClick={() => setDismissedOverdue(prev => { const next = new Set(Array.from(prev)); next.add(deal.id); return next; })}
                        className="text-gray-400 hover:text-gray-600 text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 flex-shrink-0"
                        title="Dismiss for now"
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stale Deals */}
            {staleDeals.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
                  Gone Quiet ({staleDeals.length})
                </h3>
                <div className="space-y-2">
                  {staleDeals.map(deal => (
                    <button
                      key={deal.id}
                      onClick={() => { onScrollToDeal?.(deal.id); onClose(); }}
                      className="w-full text-left bg-amber-50 rounded-lg border border-amber-200 p-3 hover:opacity-80"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{deal.brand}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">
                          Last contact: {deal.last_contact ? format(parseISO(deal.last_contact), 'MMM d') : 'unknown'}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {STAGE_LABELS[deal.stage as DealStage] || deal.stage}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">Waiting on brand — no follow-up date set</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brandi's Suggestions */}
            {latestSuggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
                  Brandi&apos;s Suggestions
                </h3>
                <div className="space-y-2">
                  {latestSuggestions.map((s, i) => (
                    <div key={i} className="bg-indigo-50 rounded-lg border border-indigo-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">Brandi</span>
                        {s.brand && <span className="font-medium text-gray-900 text-sm">{s.brand}</span>}
                      </div>
                      <p className="text-sm text-gray-700">{s.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {focusCount === 0 && (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg mb-1">All clear!</p>
                <p className="text-sm">No overdue items, stale deals, or suggestions right now.</p>
              </div>
            )}
          </div>
        )}

        {/* Runs Tab */}
        {activeTab === 'runs' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {isRunning && (
              <div className="bg-indigo-50 rounded-lg border-2 border-indigo-300 border-dashed p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-indigo-800">Brandi is scanning Liz&apos;s emails...</p>
                  <p className="text-xs text-indigo-600 mt-0.5">This usually takes 2-5 minutes. Results will appear here automatically.</p>
                </div>
              </div>
            )}
            {runs.length === 0 && !isRunning ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No runs yet.</p>
                <p className="text-xs mt-1">Click &quot;Run Now&quot; to trigger Brandi&apos;s first email scan.</p>
              </div>
            ) : (
              runs.map((run) => (
                <div key={run.id} className="bg-indigo-50 rounded-lg border border-indigo-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">Brandi</span>
                      <span className="text-xs text-gray-400">
                        {format(parseISO(run.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {run.emails_scanned > 0 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{run.emails_scanned} scanned</span>
                      )}
                      {run.deals_created > 0 && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">+{run.deals_created} new</span>
                      )}
                      {run.deals_updated > 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{run.deals_updated} updated</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{run.summary}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {entries.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">No feedback yet.</p>
                  <p className="text-xs mt-1">Tell Brandi what to look for, what to skip, or how to categorize deals.</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="flex flex-col">
                    <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[85%] self-end">
                      <p className="text-sm text-gray-800">{entry.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 self-end">
                      {entry.author} &middot; {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="e.g., Skip emails from newsletters..."
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newMessage.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
