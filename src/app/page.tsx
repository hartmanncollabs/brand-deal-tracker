'use client';

import { useState } from 'react';
import KanbanBoard from '@/components/KanbanBoard';
import CalendarView from '@/components/CalendarView';

export default function Home() {
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');

  return view === 'kanban' ? (
    <KanbanBoard onSwitchToCalendar={() => setView('calendar')} />
  ) : (
    <CalendarView onBackToKanban={() => setView('kanban')} />
  );
}
