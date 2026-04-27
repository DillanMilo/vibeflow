'use client';

import { useMemo } from 'react';
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

function todayIso(): string {
  // Local date in YYYY-MM-DD (avoids UTC offset bugs)
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysFromToday(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function sortCards(items: CardWithProject[]): CardWithProject[] {
  return [...items].sort((a, b) => {
    // Urgent/high first, then by status (in-progress before todo), then by title
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

function TodayCard({ item, onClick }: { item: CardWithProject; onClick: () => void }) {
  const { dispatch, state } = useApp();
  const { card, project } = item;
  const isComplete = card.status === 'complete';
  const projectColor = project.color || PROJECT_COLORS[0];
  const overdueDays = card.dueDate ? -daysFromToday(card.dueDate) : 0;
  const isOverdue = overdueDays > 0 && !isComplete;

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // MOVE_CARD operates on the active project, so set it first if needed
    if (state.activeProjectId !== project.id) {
      dispatch({ type: 'SET_ACTIVE_PROJECT', payload: project.id });
    }
    // Defer the move so the active project switch is applied first
    queueMicrotask(() => {
      dispatch({
        type: 'MOVE_CARD',
        payload: { id: card.id, status: isComplete ? 'todo' : 'complete' },
      });
    });
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
      {/* Left color accent stripe based on project */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: projectColor }}
      />

      <div className="flex items-start gap-3">
        {/* Complete checkbox */}
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
          {/* Project + status row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: projectColor }}
              />
              <span className="truncate max-w-[140px]">{project.name}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-text-dim">
              <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[card.status])} />
              {STATUS_LABELS[card.status]}
            </span>
          </div>

          {/* Title */}
          <p className={cn(
            'text-sm md:text-[15px] font-medium text-text-primary leading-snug',
            isComplete && 'line-through text-text-muted'
          )}>
            {card.title}
          </p>

          {/* Description preview */}
          {card.description && (
            <p className="mt-1 text-xs text-text-muted leading-relaxed line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Badges */}
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
          </div>
        </div>

        {/* Chevron */}
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

function SectionHeader({
  title,
  count,
  tone,
  icon,
}: {
  title: string;
  count: number;
  tone: 'danger' | 'accent' | 'success';
  icon: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    danger: 'text-danger bg-danger/10',
    accent: 'text-accent bg-accent/10',
    success: 'text-success bg-success/10',
  };
  return (
    <div className="flex items-center gap-2.5 mb-3 px-1">
      <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center', toneClasses[tone])}>
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-text-primary tracking-tight">
        {title}
      </h2>
      <span className="text-xs text-text-muted font-mono">
        {count}
      </span>
    </div>
  );
}

export function TodayView({ onNavigateToCard }: TodayViewProps) {
  const { state } = useApp();
  const today = todayIso();

  const { overdue, dueToday, completedToday } = useMemo(() => {
    const overdue: CardWithProject[] = [];
    const dueToday: CardWithProject[] = [];
    const completedToday: CardWithProject[] = [];

    for (const project of state.projects) {
      for (const card of project.cards) {
        if (!card.dueDate) continue;
        if (card.status === 'complete') {
          if (card.dueDate === today) {
            completedToday.push({ card, project });
          }
          continue;
        }
        if (card.dueDate < today) {
          overdue.push({ card, project });
        } else if (card.dueDate === today) {
          dueToday.push({ card, project });
        }
      }
    }

    return {
      overdue: sortCards(overdue),
      dueToday: sortCards(dueToday),
      completedToday: sortCards(completedToday),
    };
  }, [state.projects, today]);

  const totalActive = overdue.length + dueToday.length;
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-12">
        {/* Hero header */}
        <div className="mb-6 md:mb-10 animate-fade-in">
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-accent uppercase tracking-[0.18em] mb-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {dateLabel}
          </div>
          <h1 className="text-4xl md:text-6xl tracking-tight leading-none">
            <span className="font-semibold text-text-primary">Today</span>
            <span className="font-display italic text-accent">.</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
            {totalActive === 0 && completedToday.length === 0 ? (
              <>Nothing scheduled. Plan a task or enjoy the calm.</>
            ) : totalActive === 0 ? (
              <>You&apos;re all caught up. Nice work today.</>
            ) : (
              <>
                <span className="font-medium text-text-primary">{totalActive}</span>{' '}
                {totalActive === 1 ? 'task' : 'tasks'} across{' '}
                <span className="font-medium text-text-primary">
                  {new Set([...overdue, ...dueToday].map(i => i.project.id)).size}
                </span>{' '}
                {new Set([...overdue, ...dueToday].map(i => i.project.id)).size === 1 ? 'project' : 'projects'}
                {overdue.length > 0 && (
                  <>
                    {' · '}
                    <span className="text-danger font-medium">{overdue.length} overdue</span>
                  </>
                )}
              </>
            )}
          </p>

          {/* Stat chips */}
          {(totalActive > 0 || completedToday.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-5">
              {overdue.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                  <span className="text-xs font-medium text-danger">
                    {overdue.length} overdue
                  </span>
                </div>
              )}
              {dueToday.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-xs font-medium text-accent">
                    {dueToday.length} due today
                  </span>
                </div>
              )}
              {completedToday.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-xs font-medium text-success">
                    {completedToday.length} completed
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {totalActive === 0 && completedToday.length === 0 && (
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
              All clear today
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              No tasks are due today. Add a due date to a card to see it appear here.
            </p>
          </div>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
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
            <div className="space-y-2">
              {overdue.map((item, i) => (
                <div key={item.card.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <TodayCard
                    item={item}
                    onClick={() => onNavigateToCard(item.project.id, item.card.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Due today */}
        {dueToday.length > 0 && (
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <SectionHeader
              title="Due today"
              count={dueToday.length}
              tone="accent"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <div className="space-y-2">
              {dueToday.map((item, i) => (
                <div key={item.card.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <TodayCard
                    item={item}
                    onClick={() => onNavigateToCard(item.project.id, item.card.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed today */}
        {completedToday.length > 0 && (
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <SectionHeader
              title="Completed today"
              count={completedToday.length}
              tone="success"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <div className="space-y-2">
              {completedToday.map((item, i) => (
                <div key={item.card.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <TodayCard
                    item={item}
                    onClick={() => onNavigateToCard(item.project.id, item.card.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
