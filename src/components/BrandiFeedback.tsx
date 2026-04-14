'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { format, parseISO } from 'date-fns';

interface FeedbackEntry {
  id: string;
  message: string;
  author: string;
  created_at: string;
}

interface BrandiFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandiFeedback({ isOpen, onClose }: BrandiFeedbackProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) fetchFeedback();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('brandi_feedback')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setEntries(data);
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
            <h2 className="text-lg font-semibold text-gray-900">Agent Feedback</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Info + Run Now */}
        <div className="px-4 py-2 bg-indigo-50/50 border-b flex items-center justify-between">
          <span className="text-xs text-indigo-600">
            Instructions here are read by Brandi before every email scan.
          </span>
          <a
            href="https://claude.ai/code/scheduled/trig_01MXqTt6Hj3C8wz33mKmTvgS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Now
          </a>
        </div>

        {/* Messages */}
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
      </div>
    </div>
  );
}
