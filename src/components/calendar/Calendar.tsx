'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useGoogleCalendar, type GoogleCalendarEvent } from '@/hooks/useGoogleCalendar';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarEventColor } from '@/types';
import { PROJECT_COLORS } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
}

interface EventFormProps {
  date: string;
  event?: CalendarEvent;
  onClose: () => void;
}

function EventForm({ date, event, onClose }: EventFormProps) {
  const { dispatch } = useApp();
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [time, setTime] = useState(event?.time || '');
  const [endTime, setEndTime] = useState(event?.endTime || '');
  const [color, setColor] = useState<CalendarEventColor>(event?.color || '#e5a54b');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (event) {
      dispatch({
        type: 'UPDATE_EVENT',
        payload: {
          id: event.id,
          updates: {
            title: title.trim(),
            description: description.trim() || undefined,
            date,
            time: time || undefined,
            endTime: endTime || undefined,
            color,
          },
        },
      });
    } else {
      dispatch({
        type: 'ADD_EVENT',
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          date,
          time: time || undefined,
          endTime: endTime || undefined,
          color,
        },
      });
    }
    onClose();
  };

  const displayDate = new Date(date + 'T12:00:00');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border-subtle">
          <h3 className="text-base font-semibold text-text-primary">
            {event ? 'Edit Event' : 'New Event'}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
              autoFocus
              className={cn(
                'w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm',
                'text-text-primary placeholder:text-text-dim',
                'focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-accent/20',
              )}
            />
          </div>

          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (optional)..."
              rows={2}
              className={cn(
                'w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm',
                'text-text-primary placeholder:text-text-dim resize-none',
                'focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-accent/20',
              )}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1.5 block">Start time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(
                  'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm',
                  'text-text-primary',
                  'focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-accent/20',
                  '[color-scheme:dark]'
                )}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-muted mb-1.5 block">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={cn(
                  'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm',
                  'text-text-primary',
                  'focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-accent/20',
                  '[color-scheme:dark]'
                )}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block">Color</label>
            <div className="flex gap-2">
              {(PROJECT_COLORS as CalendarEventColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all hover:scale-110',
                    color === c && 'ring-2 ring-offset-2 ring-offset-surface ring-white/50'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border-subtle flex gap-2 justify-end">
          {event && (
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'DELETE_EVENT', payload: event.id });
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-danger hover:bg-danger-subtle rounded-lg transition-colors mr-auto"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className={cn(
              'px-5 py-2 text-sm font-medium rounded-lg transition-all',
              'bg-accent text-background hover:bg-accent-hover',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {event ? 'Save' : 'Add Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface CalendarProps {
  view?: 'full' | 'compact';
}

export function Calendar({ view = 'full' }: CalendarProps) {
  const { events, cards } = useApp();
  const gcal = useGoogleCalendar();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [showGcalSetupInfo, setShowGcalSetupInfo] = useState(false);

  // Build a map of date -> events
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    }
    return map;
  }, [events]);

  // Build a map of date -> Google Calendar events
  const gcalEventsByDate = useMemo(() => {
    const map: Record<string, GoogleCalendarEvent[]> = {};
    for (const event of gcal.events) {
      // Extract date from ISO string (could be date or datetime)
      const dateStr = event.start.split('T')[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(event);
    }
    return map;
  }, [gcal.events]);

  // Build a map of date -> card due dates
  const cardsDueByDate = useMemo(() => {
    const map: Record<string, typeof cards> = {};
    for (const card of cards) {
      if (card.dueDate && card.status !== 'complete') {
        if (!map[card.dueDate]) map[card.dueDate] = [];
        map[card.dueDate].push(card);
      }
    }
    return map;
  }, [cards]);

  // Calculate deadline indicators from kanban cards (cards in "todo" or "in-progress")
  const activeCardCount = cards.filter(c => c.status !== 'complete').length;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);
    setSelectedDate(dateStr);
  };

  const handleAddEvent = () => {
    setEditingEvent(undefined);
    setShowForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setShowForm(true);
  };

  // Days from previous month to fill first row
  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );

  // Generate calendar grid cells
  const calendarDays: Array<{ day: number; currentMonth: boolean; dateStr: string }> = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const month = currentMonth === 0 ? 11 : currentMonth - 1;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarDays.push({ day, currentMonth: false, dateStr: formatDate(year, month, day) });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, currentMonth: true, dateStr: formatDate(currentYear, currentMonth, day) });
  }

  // Next month padding
  const remainingCells = 42 - calendarDays.length; // 6 rows x 7
  for (let day = 1; day <= remainingCells; day++) {
    const month = currentMonth === 11 ? 0 : currentMonth + 1;
    const year = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarDays.push({ day, currentMonth: false, dateStr: formatDate(year, month, day) });
  }

  // Get selected date events and due cards
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];
  const selectedGcalEvents = selectedDate ? (gcalEventsByDate[selectedDate] || []) : [];
  const selectedDueCards = selectedDate ? (cardsDueByDate[selectedDate] || []) : [];

  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-1 mb-3 flex-shrink-0">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-text-primary">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          {activeCardCount > 0 && (
            <p className="text-xs text-text-muted mt-0.5">
              {activeCardCount} active card{activeCardCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-accent hover:bg-accent-subtle rounded-lg transition-all"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Google Calendar integration */}
      {!gcal.isConnected && (
        <button
          type="button"
          onClick={() => {
            if (!gcal.hasClientId) {
              setShowGcalSetupInfo(true);
              return;
            }
            gcal.connect();
          }}
          disabled={gcal.isLoading}
          className={cn(
            'mb-3 w-full flex items-center gap-3 p-3 rounded-xl border border-[#4285f4]/20 transition-all flex-shrink-0',
            'bg-gradient-to-r from-[#4285f4]/5 via-[#34a853]/5 to-[#fbbc05]/5',
            'hover:from-[#4285f4]/10 hover:via-[#34a853]/10 hover:to-[#fbbc05]/10',
            'hover:border-[#4285f4]/40 active:scale-[0.98]',
            'disabled:opacity-60'
          )}
        >
          {/* Google logo */}
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-text-primary">
              {gcal.isLoading ? 'Connecting...' : 'Sign in with Google'}
            </p>
            <p className="text-[11px] text-text-muted">Sync your Google Calendar events here</p>
          </div>
          <svg className="w-4 h-4 text-text-dim flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Setup info when no client ID */}
      {showGcalSetupInfo && !gcal.hasClientId && (
        <div className="mb-3 p-3 rounded-xl border border-[#fbbc05]/30 bg-[#fbbc05]/5 flex-shrink-0 animate-fade-in">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#fbbc05] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-text-primary">Setup required</p>
              <p className="text-[11px] text-text-muted mt-1">
                Add <code className="px-1 py-0.5 bg-background rounded text-[10px] font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code className="px-1 py-0.5 bg-background rounded text-[10px] font-mono">.env.local</code> file to enable Google Calendar sync.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGcalSetupInfo(false)}
              className="p-1 text-text-dim hover:text-text-primary rounded transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Connected state - compact bar */}
      {gcal.isConnected && (
        <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl border border-[#4285f4]/20 bg-[#4285f4]/5 flex-shrink-0 animate-fade-in">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34a853]" />
              <span className="text-xs font-medium text-text-primary truncate">{gcal.calendarName}</span>
              <span className="text-[10px] text-text-dim flex-shrink-0">
                {gcal.events.length} event{gcal.events.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={gcal.refresh}
            disabled={gcal.isLoading}
            className="p-1.5 text-text-dim hover:text-[#4285f4] hover:bg-[#4285f4]/10 rounded-lg transition-all"
            title="Refresh events"
          >
            <svg className={cn('w-3.5 h-3.5', gcal.isLoading && 'animate-spin')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={gcal.disconnect}
            className="p-1.5 text-text-dim hover:text-danger hover:bg-danger-subtle rounded-lg transition-all"
            title="Disconnect"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {gcal.error && (
        <div className="mb-3 p-3 rounded-xl border border-danger/30 bg-danger/5 flex-shrink-0 animate-fade-in">
          <p className="text-xs text-danger">{gcal.error}</p>
          {gcal.error.includes('Authorized JavaScript Origin') && (
            <p className="text-[11px] text-text-muted mt-1.5">
              In your{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4285f4] underline"
              >
                Google Cloud Console
              </a>
              , edit your OAuth 2.0 Client ID and add this site&apos;s URL to both &quot;Authorized JavaScript origins&quot; and &quot;Authorized redirect URIs&quot;.
            </p>
          )}
        </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1 flex-shrink-0">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-text-dim py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 md:flex-1 md:min-h-0 gap-px bg-border-subtle/30 rounded-xl overflow-hidden border border-border-subtle">
        {calendarDays.map((cell, i) => {
          const dayEvents = eventsByDate[cell.dateStr] || [];
          const dayGcalEvents = gcalEventsByDate[cell.dateStr] || [];
          const dueCards = cardsDueByDate[cell.dateStr] || [];
          const isTodayCell = cell.currentMonth && isToday(currentYear, currentMonth, cell.day);
          const isSelected = cell.dateStr === selectedDate;

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (cell.currentMonth) {
                  handleDateClick(cell.day);
                }
              }}
              className={cn(
                'relative flex flex-col items-center p-1 md:p-1.5 min-h-[44px] md:min-h-[72px] transition-all',
                'bg-background hover:bg-surface-hover',
                !cell.currentMonth && 'opacity-30',
                isSelected && 'bg-accent/10 ring-1 ring-accent/40',
                isTodayCell && 'bg-accent/5'
              )}
            >
              <span
                className={cn(
                  'text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full',
                  isTodayCell
                    ? 'bg-accent text-background font-bold'
                    : cell.currentMonth
                    ? 'text-text-primary'
                    : 'text-text-dim'
                )}
              >
                {cell.day}
              </span>

              {/* Event & due date dots */}
              {(dayEvents.length > 0 || dayGcalEvents.length > 0 || dueCards.length > 0) && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                  {dayGcalEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 bg-[#4285f4]"
                    />
                  ))}
                  {dueCards.length > 0 && (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-sm flex-shrink-0 bg-danger/70" title={`${dueCards.length} card${dueCards.length > 1 ? 's' : ''} due`} />
                  )}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-text-dim">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}

              {/* Desktop: show event titles */}
              <div className="hidden md:flex flex-col gap-0.5 mt-0.5 w-full px-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                    style={{ backgroundColor: ev.color + '30', color: ev.color }}
                  >
                    {ev.time && <span className="opacity-70">{ev.time} </span>}
                    {ev.title}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div className="mt-4 flex-shrink-0 border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </h3>
            <button
              type="button"
              onClick={handleAddEvent}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                'bg-accent text-background hover:bg-accent-hover active:scale-95'
              )}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>

          {/* Due cards for this date */}
          {selectedDueCards.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-text-dim mb-1.5">Cards due:</p>
              <div className="space-y-1">
                {selectedDueCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/5 border border-danger/20"
                  >
                    <div className="w-1.5 h-1.5 rounded-sm bg-danger flex-shrink-0" />
                    <span className="text-xs text-text-primary truncate">{card.title}</span>
                    <span className="text-[10px] text-text-dim ml-auto flex-shrink-0">
                      {card.status === 'todo' ? 'To Do' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEvents.length === 0 && selectedGcalEvents.length === 0 && selectedDueCards.length === 0 ? (
            <p className="text-xs text-text-dim text-center py-4">No events on this day</p>
          ) : (
            <div className="space-y-2 max-h-48 md:max-h-56 overflow-y-auto">
              {/* Vibeflow events */}
              {selectedEvents
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handleEditEvent(event)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      'hover:bg-surface-hover active:scale-[0.98]',
                    )}
                    style={{
                      borderColor: event.color + '40',
                      backgroundColor: event.color + '10',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="text-sm font-medium text-text-primary truncate">
                        {event.title}
                      </span>
                      {event.time && (
                        <span className="text-xs text-text-muted ml-auto flex-shrink-0">
                          {event.time}
                          {event.endTime && ` - ${event.endTime}`}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-1 pl-4">
                        {event.description}
                      </p>
                    )}
                  </button>
                ))}

              {/* Google Calendar events */}
              {selectedGcalEvents.map((event) => {
                const timeStr = event.isAllDay ? 'All day' : event.start.split('T')[1]?.substring(0, 5) || '';
                return (
                  <div
                    key={event.id}
                    className="w-full text-left p-3 rounded-xl border border-[#4285f4]/30 bg-[#4285f4]/5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#4285f4]" />
                      <span className="text-sm font-medium text-text-primary truncate">
                        {event.summary}
                      </span>
                      <span className="text-xs text-text-muted ml-auto flex-shrink-0 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 text-[#4285f4]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        </svg>
                        {timeStr}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-1 pl-4">
                        {event.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Event form modal */}
      {showForm && selectedDate && (
        <EventForm
          date={selectedDate}
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(undefined);
          }}
        />
      )}
    </div>
  );
}
