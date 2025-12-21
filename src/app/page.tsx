'use client';

import { useApp } from '@/context/AppContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Sidebar } from '@/components/sidebar/Sidebar';

function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 flex gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-72 flex-shrink-0">
            <div className="h-5 w-24 bg-surface rounded mb-3 animate-pulse" />
            <div className="bg-surface/50 rounded-xl p-2 min-h-[200px]">
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <div key={j} className="h-16 bg-surface rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>
      <aside className="w-80 border-l border-border bg-background">
        <div className="p-4 border-b border-border">
          <div className="h-5 w-20 bg-surface rounded mb-3 animate-pulse" />
          <div className="h-8 bg-surface rounded animate-pulse" />
        </div>
        <div className="p-4">
          <div className="h-5 w-16 bg-surface rounded mb-3 animate-pulse" />
          <div className="h-32 bg-surface rounded animate-pulse" />
        </div>
      </aside>
    </div>
  );
}

export default function Home() {
  const { isHydrated } = useApp();

  if (!isHydrated) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
      <Sidebar />
    </div>
  );
}
