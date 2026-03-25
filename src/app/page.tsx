'use client';

import { useState } from 'react';
import KanbanBoard from '@/components/KanbanBoard';
import CalendarView from '@/components/CalendarView';

export default function Home() {
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');

  return (
    <>
      {view === 'kanban' ? (
        <KanbanBoardWithNav onSwitchToCalendar={() => setView('calendar')} />
      ) : (
        <CalendarView onBackToKanban={() => setView('kanban')} />
      )}
    </>
  );
}

function KanbanBoardWithNav({ onSwitchToCalendar }: { onSwitchToCalendar: () => void }) {
  return (
    <div className="relative">
      {/* Calendar toggle button - floating */}
      <button
        onClick={onSwitchToCalendar}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-white shadow-lg rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
        title="Switch to Calendar View"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Calendar
      </button>
      <KanbanBoard />
    </div>
  );
}
