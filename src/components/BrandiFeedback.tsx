'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { format, parseISO } from 'date-fns';

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
  created_at: string;
}

interface BrandiFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandiFeedback({ isOpen, onClose }: BrandiFeedbackProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feedback' | 'runs'>('runs');
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
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
      // If we're polling and a new run appeared, stop polling
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

    // Open the trigger page to start the run
    window.open('https://claude.ai/code/scheduled/trig_01MXqTt6Hj3C8wz33mKmTvgS', '_blank');

    // Poll for new results every 15 seconds for up to 10 minutes
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[80vh] flex flex-col">
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
            onClick={() => setActiveTab('runs')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'runs'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Run History
            {runs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                {runs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
              activeTab === 'feedback'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Feedback
            {entries.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {entries.length}
              </span>
            )}
          </button>
        </div>

        {/* Runs Tab */}
        {activeTab === 'runs' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
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
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {run.emails_scanned} scanned
                        </span>
                      )}
                      {run.deals_created > 0 && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                          +{run.deals_created} new
                        </span>
                      )}
                      {run.deals_updated > 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {run.deals_updated} updated
                        </span>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
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

            {/* Input */}
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
