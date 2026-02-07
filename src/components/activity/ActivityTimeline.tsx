'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { ActivityType, ActivityEntry } from '@/types';

const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; color: string; bgColor: string }> = {
  card_created: { icon: 'M12 4v16m8-8H4', color: 'text-accent', bgColor: 'bg-accent/15' },
  card_moved: { icon: 'M13 7l5 5m0 0l-5 5m5-5H6', color: 'text-[#5b9bd5]', bgColor: 'bg-[#5b9bd5]/15' },
  card_completed: { icon: 'M5 13l4 4L19 7', color: 'text-success', bgColor: 'bg-success/15' },
  card_deleted: { icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'text-danger', bgColor: 'bg-danger/15' },
  todo_created: { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-[#d67bff]', bgColor: 'bg-[#d67bff]/15' },
  todo_completed: { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'text-success', bgColor: 'bg-success/15' },
  event_created: { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-[#7bdfff]', bgColor: 'bg-[#7bdfff]/15' },
  project_created: { icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'text-accent', bgColor: 'bg-accent/15' },
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function groupByDate(activities: ActivityEntry[]): Record<string, ActivityEntry[]> {
  const groups: Record<string, ActivityEntry[]> = {};

  for (const activity of activities) {
    const date = new Date(activity.timestamp);
    const key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
  }

  return groups;
}

export function ActivityTimeline() {
  const { activities } = useApp();

  const grouped = useMemo(() => groupByDate(activities), [activities]);
  const dateKeys = Object.keys(grouped);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg md:text-xl font-semibold text-text-primary">Activity</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-surface/50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-text-muted font-medium">No activity yet</p>
          <p className="text-xs text-text-dim mt-1 max-w-[200px]">
            Your project activity will show up here as you work
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-semibold text-text-primary">Activity</h2>
        <span className="text-xs text-text-dim bg-surface px-2 py-1 rounded-md border border-border-subtle">
          {activities.length} event{activities.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 min-h-0">
        {dateKeys.map((dateKey) => (
          <div key={dateKey} className="mb-6 last:mb-2">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                {dateKey === new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  ? 'Today'
                  : dateKey}
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Activities */}
            <div className="space-y-1">
              {grouped[dateKey].map((activity, index) => {
                const config = ACTIVITY_CONFIG[activity.type];

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      'group flex items-start gap-3 p-2.5 rounded-xl',
                      'hover:bg-surface/50 transition-all duration-200',
                      'animate-fade-in'
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Icon */}
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
                      <svg className={cn('w-4 h-4', config.color)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary leading-snug">
                        {activity.title}
                      </p>
                      {activity.detail && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">
                          {activity.detail}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <span className="text-xs text-text-dim flex-shrink-0 mt-0.5">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
