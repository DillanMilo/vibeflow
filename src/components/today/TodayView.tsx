'use client';

import { useMemo, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { KanbanCard, CardPriority, KanbanStatus, Project } from '@/types';
import { PROJECT_COLORS } from '@/types';

interface TodayViewProps {
  onNavigateToCard: (projectId: string, cardId: string) => void;
}

interface CardWithProject {
  card: KanbanCard;
  project: Project;
}

interface ProjectGroup {
  project: Project;
  items: CardWithProject[];
}

const PRIORITY_CONFIG: Record<CardPriority, { label: string; color: string; bg: string; rank: number }> = {
  urgent: { label: 'Urgent', color: 'text-[#ff4444]', bg: 'bg-[#ff4444]/15', rank: 0 },
  high: { label: 'High', color: 'text-[#ff7b7b]', bg: 'bg-[#ff7b7b]/15', rank: 1 },
  medium: { label: 'Med', color: 'text-[#e5a54b]', bg: 'bg-[#e5a54b]/15', rank: 2 },
  low: { label: 'Low', color: 'text-[#5b9bd5]', bg: 'bg-[#5b9bd5]/15', rank: 3 },
};

const STATUS_LABELS: Record<KanbanStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'complete': 'Complete',
};

const STATUS_DOT: Record<KanbanStatus, string> = {
  'todo': 'bg-text-muted',
  'in-progress': 'bg-accent shadow-[0_0_8px_var(--accent-glow)]',
  'complete': 'bg-success',
};

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayIso(): string {
  return isoFromDate(new Date());
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

function diffDays(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + 'T00:00:00').getTime();
  const b = new Date(toIso + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}

function relativeLabel(iso: string, today: string): string {
  const d = diffDays(today, iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d > 1 && d <= 6) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  }
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fullDateLabel(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function sortCards(items: CardWithProject[]): CardWithProject[] {
  return [...items].sort((a, b) => {
    const aRank = a.card.priority ? PRIORITY_CONFIG[a.card.priority].rank : 4;
    const bRank = b.card.priority ? PRIORITY_CONFIG[b.card.priority].rank : 4;
    if (aRank !== bRank) return aRank - bRank;
    if (a.card.status !== b.card.status) {
      if (a.card.status === 'in-progress') return -1;
      if (b.card.status === 'in-progress') return 1;
    }
    return a.card.title.localeCompare(b.card.title);
  });
}

function groupByProject(items: CardWithProject[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();
  for (const item of items) {
    const existing = map.get(item.project.id);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(item.project.id, { project: item.project, items: [item] });
    }
  }
  const groups = Array.from(map.values());
  for (const g of groups) g.items = sortCards(g.items);
  groups.sort((a, b) => {
    if (a.items.length !== b.items.length) return b.items.length - a.items.length;
    return a.project.name.localeCompare(b.project.name);
  });
  return groups;
}

function TodayCard({
  item,
  onClick,
  showProject,
}: {
  item: CardWithProject;
  onClick: () => void;
  showProject: boolean;
}) {
  const { dispatch, state } = useApp();
  const { card, project } = item;
  const isComplete = card.status === 'complete';
  const projectColor = project.color || PROJECT_COLORS[0];
  const today = todayIso();
  const overdueDays = card.dueDate ? diffDays(card.dueDate, today) : 0;
  const isOverdue = overdueDays > 0 && !isComplete;

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.activeProjectId !== project.id) {
      dispatch({ type: 'SET_ACTIVE_PROJECT', payload: project.id });
    }
    queueMicrotask(() => {
      dispatch({
        type: 'MOVE_CARD',
        payload: { id: card.id, status: isComplete ? 'todo' : 'complete' },
      });
    });
  };

  const dateInputRef = useRef<HTMLInputElement>(null);
  const tomorrowIso = shiftDate(today, 1);

  const reschedule = (newIso: string) => {
    if (!newIso || newIso === card.dueDate) return;
    if (state.activeProjectId !== project.id) {
      dispatch({ type: 'SET_ACTIVE_PROJECT', payload: project.id });
    }
    queueMicrotask(() => {
      dispatch({
        type: 'UPDATE_CARD',
        payload: { id: card.id, updates: { dueDate: newIso } },
      });
    });
  };

  const handleMoveToTomorrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    reschedule(tomorrowIso);
  };

  const handlePickDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // fall through to click()
      }
    }
    input.click();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full text-left',
        'bg-surface border border-border rounded-xl p-4',
        'transition-all duration-200',
        'hover:border-border-accent hover:bg-surface-hover hover:-translate-y-0.5 md:hover:shadow-md',
        'active:scale-[0.99]',
        'animate-fade-in-up',
        isOverdue && 'border-danger/40',
        isComplete && 'opacity-60'
      )}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: projectColor }}
      />

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggleComplete}
          aria-label={isComplete ? 'Mark as not complete' : 'Mark complete'}
          className={cn(
            'flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 transition-all',
            'flex items-center justify-center',
            isComplete
              ? 'bg-success border-success text-background'
              : 'border-border-accent hover:border-success hover:bg-success/10 text-transparent hover:text-success'
          )}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {showProject && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: projectColor }}
                />
                <span className="truncate max-w-[140px]">{project.name}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-text-dim">
              <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[card.status])} />
              {STATUS_LABELS[card.status]}
            </span>
          </div>

          <p className={cn(
            'text-sm md:text-[15px] font-medium text-text-primary leading-snug',
            isComplete && 'line-through text-text-muted'
          )}>
            {card.title}
          </p>

          {card.description && (
            <p className="mt-1 text-xs text-text-muted leading-relaxed line-clamp-2">
              {card.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {card.priority && (
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold',
                PRIORITY_CONFIG[card.priority].bg,
                PRIORITY_CONFIG[card.priority].color,
              )}>
                {card.priority === 'urgent' && (
                  <svg className="w-2.5 h-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {PRIORITY_CONFIG[card.priority].label}
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger/15 text-danger">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {overdueDays}d overdue
              </span>
            )}

            {!isComplete && (
              <div className="ml-auto flex items-center gap-1">
                {card.dueDate !== tomorrowIso && (
                  <button
                    type="button"
                    onClick={handleMoveToTomorrow}
                    title="Move to tomorrow"
                    aria-label="Move to tomorrow"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-text-muted bg-surface-hover/60 border border-border-subtle hover:text-accent hover:border-border-accent hover:bg-accent/10 transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M4 12h16" />
                    </svg>
                    Tomorrow
                  </button>
                )}
                <span className="relative inline-flex">
                  <button
                    type="button"
                    onClick={handlePickDate}
                    title="Pick another date"
                    aria-label="Pick another date"
                    className="inline-flex items-center justify-center w-5 h-5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    defaultValue={card.dueDate}
                    min={today}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => reschedule(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Pick another date"
                  />
                </span>
              </div>
            )}
          </div>
        </div>

        <svg
          className="hidden md:block flex-shrink-0 w-4 h-4 text-text-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all mt-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function ProjectGroupBlock({
  group,
  onNavigateToCard,
}: {
  group: ProjectGroup;
  onNavigateToCard: (projectId: string, cardId: string) => void;
}) {
  const { project, items } = group;
  const projectColor = project.color || PROJECT_COLORS[0];
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary truncate">
          {project.name}
        </span>
        <span className="text-[10px] text-text-dim font-mono">{items.length}</span>
        <div className="flex-1 h-px bg-border-subtle ml-1" />
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.card.id} style={{ animationDelay: `${i * 30}ms` }}>
            <TodayCard
              item={item}
              showProject={false}
              onClick={() => onNavigateToCard(item.project.id, item.card.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  tone,
  icon,
}: {
  title: string;
  count: number;
  tone: 'danger' | 'accent' | 'success' | 'neutral';
  icon: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    danger: 'text-danger bg-danger/10',
    accent: 'text-accent bg-accent/10',
    success: 'text-success bg-success/10',
    neutral: 'text-text-secondary bg-surface',
  };
  return (
    <div className="flex items-center gap-2.5 mb-3 px-1">
      <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center', toneClasses[tone])}>
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h2>
      <span className="text-xs text-text-muted font-mono">{count}</span>
    </div>
  );
}

function WeekStrip({
  selectedDate,
  today,
  countByDate,
  onSelect,
}: {
  selectedDate: string;
  today: string;
  countByDate: Map<string, number>;
  onSelect: (iso: string) => void;
}) {
  const days = useMemo(() => {
    const arr: { iso: string; weekday: string; dayNum: number }[] = [];
    const base = new Date(today + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push({
        iso: isoFromDate(d),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      });
    }
    return arr;
  }, [today]);

  return (
    <div className="flex items-stretch gap-1 sm:gap-1.5 pb-1">
      {days.map(({ iso, weekday, dayNum }) => {
        const isSelected = iso === selectedDate;
        const isToday = iso === today;
        const count = countByDate.get(iso) || 0;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            className={cn(
              'flex-1 min-w-0 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 relative',
              'border',
              isSelected
                ? 'bg-accent text-background border-accent shadow-sm'
                : isToday
                ? 'bg-surface border-border-accent text-text-primary hover:bg-surface-hover'
                : 'bg-surface/50 border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-hover hover:border-border'
            )}
          >
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wider',
              isSelected ? 'text-background/80' : 'text-text-dim'
            )}>
              {weekday}
            </span>
            <span className={cn(
              'text-base font-semibold mt-0.5',
              isSelected ? 'text-background' : isToday ? 'text-accent' : 'text-text-primary'
            )}>
              {dayNum}
            </span>
            {count > 0 && (
              <span className={cn(
                'mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full',
                isSelected
                  ? 'bg-background/20 text-background'
                  : 'bg-accent/15 text-accent'
              )}>
                {count}
              </span>
            )}
            {!count && isToday && !isSelected && (
              <span className="mt-1 w-1 h-1 rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TodayView({ onNavigateToCard }: TodayViewProps) {
  const { state } = useApp();
  const today = todayIso();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Build a map of incomplete-task counts per ISO date for the week strip
  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const project of state.projects) {
      for (const card of project.cards) {
        if (!card.dueDate || card.status === 'complete') continue;
        map.set(card.dueDate, (map.get(card.dueDate) || 0) + 1);
      }
    }
    return map;
  }, [state.projects]);

  const isToday = selectedDate === today;
  const isPast = !isToday && selectedDate < today;

  // Cards for the various sections
  const { dueOnDate, overdue, completedOnDate } = useMemo(() => {
    const dueOnDate: CardWithProject[] = [];
    const overdue: CardWithProject[] = [];
    const completedOnDate: CardWithProject[] = [];

    for (const project of state.projects) {
      for (const card of project.cards) {
        if (!card.dueDate) continue;
        if (card.status === 'complete') {
          if (card.dueDate === selectedDate) completedOnDate.push({ card, project });
          continue;
        }
        // Active (not complete) cards
        if (card.dueDate === selectedDate) {
          dueOnDate.push({ card, project });
        } else if (isToday && card.dueDate < today) {
          overdue.push({ card, project });
        }
      }
    }
    return { dueOnDate, overdue, completedOnDate };
  }, [state.projects, selectedDate, today, isToday]);

  const dueGroups = useMemo(() => groupByProject(dueOnDate), [dueOnDate]);
  const overdueGroups = useMemo(() => groupByProject(overdue), [overdue]);
  const completedGroups = useMemo(() => groupByProject(completedOnDate), [completedOnDate]);

  const totalActive = dueOnDate.length + (isToday ? overdue.length : 0);
  const projectsWithWork = new Set([
    ...dueOnDate.map((i) => i.project.id),
    ...(isToday ? overdue.map((i) => i.project.id) : []),
  ]);

  const heroLabel = relativeLabel(selectedDate, today);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-12">
        {/* Hero header */}
        <div className="mb-5 md:mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-accent uppercase tracking-[0.18em] mb-2">
            <span className="relative flex h-2 w-2">
              {isToday && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              )}
              <span className={cn(
                'relative inline-flex h-2 w-2 rounded-full',
                isToday ? 'bg-accent' : 'bg-text-muted'
              )} />
            </span>
            {fullDateLabel(selectedDate)}
          </div>
          <h1 className="text-4xl md:text-6xl tracking-tight leading-none">
            <span className="font-semibold text-text-primary">{heroLabel}</span>
            <span className="font-display italic text-accent">.</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
            {totalActive === 0 && completedOnDate.length === 0 ? (
              isToday ? (
                <>Nothing scheduled. Plan a task or enjoy the calm.</>
              ) : isPast ? (
                <>No tasks were due on this day.</>
              ) : (
                <>No tasks scheduled. A clean slate.</>
              )
            ) : (
              <>
                <span className="font-medium text-text-primary">{totalActive}</span>{' '}
                {totalActive === 1 ? 'task' : 'tasks'} across{' '}
                <span className="font-medium text-text-primary">{projectsWithWork.size}</span>{' '}
                {projectsWithWork.size === 1 ? 'project' : 'projects'}
                {isToday && overdue.length > 0 && (
                  <>
                    {' · '}
                    <span className="text-danger font-medium">{overdue.length} overdue</span>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* Day navigator */}
        <div className="mb-6 md:mb-8 animate-fade-in" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover hover:border-border transition-all"
              aria-label="Previous day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(today)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Jump to today
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover hover:border-border transition-all"
              aria-label="Next day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <WeekStrip
            selectedDate={selectedDate}
            today={today}
            countByDate={countByDate}
            onSelect={setSelectedDate}
          />
        </div>

        {/* Empty state */}
        {totalActive === 0 && completedOnDate.length === 0 && (
          <div className="text-center py-12 md:py-20 animate-fade-in-up">
            <div className="relative inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 mb-6">
              <div className="absolute inset-0 bg-accent/10 rounded-3xl blur-xl" />
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-surface to-background-elevated border border-border-subtle flex items-center justify-center">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-2">
              {isToday ? 'All clear today' : isPast ? 'Nothing was due' : 'Nothing scheduled'}
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              {isToday
                ? 'No tasks are due today. Add a due date to a card to see it appear here.'
                : 'No tasks have a due date for this day yet.'}
            </p>
          </div>
        )}

        {/* Overdue (only shown when viewing today) */}
        {isToday && overdueGroups.length > 0 && (
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <SectionHeader
              title="Overdue"
              count={overdue.length}
              tone="danger"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <div>
              {overdueGroups.map((group) => (
                <ProjectGroupBlock
                  key={group.project.id}
                  group={group}
                  onNavigateToCard={onNavigateToCard}
                />
              ))}
            </div>
          </section>
        )}

        {/* Due on selected date */}
        {dueGroups.length > 0 && (
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <SectionHeader
              title={isToday ? 'Due today' : `Due ${heroLabel}`}
              count={dueOnDate.length}
              tone="accent"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <div>
              {dueGroups.map((group) => (
                <ProjectGroupBlock
                  key={group.project.id}
                  group={group}
                  onNavigateToCard={onNavigateToCard}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed on selected date */}
        {completedGroups.length > 0 && (
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <SectionHeader
              title={isToday ? 'Completed today' : 'Completed'}
              count={completedOnDate.length}
              tone="success"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <div>
              {completedGroups.map((group) => (
                <ProjectGroupBlock
                  key={group.project.id}
                  group={group}
                  onNavigateToCard={onNavigateToCard}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
