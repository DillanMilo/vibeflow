'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { cn } from '@/lib/utils';

type MobileView = 'board' | 'tasks' | 'notes';

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header skeleton */}
      <header className="flex-shrink-0 h-14 md:h-16 border-b border-border-subtle px-4 md:px-6 flex items-center">
        <div className="h-6 w-32 shimmer rounded" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content skeleton */}
        <main className="flex-1 flex gap-4 md:gap-6 p-4 md:p-6 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-72 md:w-80 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="h-4 w-4 shimmer rounded-full" />
                <div className="h-4 w-24 shimmer rounded" />
              </div>
              <div className="bg-surface/30 rounded-2xl p-3 min-h-[300px] border border-border-subtle">
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-24 shimmer rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </main>

        {/* Sidebar skeleton - hidden on mobile */}
        <aside className="hidden md:flex w-[340px] border-l border-border-subtle bg-background-elevated animate-slide-in flex-col">
          <div className="p-5 border-b border-border-subtle">
            <div className="h-5 w-28 shimmer rounded mb-4" />
            <div className="h-10 shimmer rounded-lg" />
          </div>
          <div className="p-5">
            <div className="h-5 w-20 shimmer rounded mb-4" />
            <div className="h-40 shimmer rounded-lg" />
          </div>
        </aside>
      </div>

      {/* Mobile nav skeleton */}
      <div className="md:hidden h-16 border-t border-border-subtle bg-background-elevated" />
    </div>
  );
}

function Header() {
  return (
    <header className="flex-shrink-0 h-14 md:h-16 border-b border-border-subtle bg-background/80 backdrop-blur-sm px-4 md:px-6 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="absolute -inset-1 bg-accent/20 rounded-xl blur-md -z-10" />
        </div>

        {/* Brand name */}
        <h1 className="text-lg md:text-xl tracking-tight">
          <span className="font-semibold text-text-primary">vibe</span>
          <span className="font-display italic text-accent">flow</span>
        </h1>
      </div>

      {/* Status indicator - hidden on mobile */}
      <div className="hidden md:flex items-center gap-3 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>All synced</span>
        </div>
      </div>
    </header>
  );
}

function MobileNav({ activeView, onViewChange }: { activeView: MobileView; onViewChange: (view: MobileView) => void }) {
  const navItems: { id: MobileView; label: string; icon: React.ReactNode }[] = [
    {
      id: 'board',
      label: 'Board',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  const handleNavClick = (view: MobileView) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onViewChange(view);
  };

  return (
    <nav className="md:hidden flex-shrink-0 h-16 border-t border-border-subtle bg-background-elevated safe-bottom z-50">
      <div className="flex h-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={handleNavClick(item.id)}
            onTouchEnd={handleNavClick(item.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
              'touch-manipulation select-none',
              activeView === item.id
                ? 'text-accent'
                : 'text-text-muted active:text-text-secondary'
            )}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function Home() {
  const { isHydrated } = useApp();
  const [mobileView, setMobileView] = useState<MobileView>('board');

  if (!isHydrated) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header />

      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <KanbanBoard />
        </main>
        <Sidebar />
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-1 overflow-hidden">
        {mobileView === 'board' && (
          <main className="flex-1 overflow-hidden animate-fade-in">
            <KanbanBoard />
          </main>
        )}
        {mobileView === 'tasks' && (
          <div className="flex-1 overflow-hidden animate-fade-in">
            <Sidebar view="tasks" />
          </div>
        )}
        {mobileView === 'notes' && (
          <div className="flex-1 overflow-hidden animate-fade-in">
            <Sidebar view="notes" />
          </div>
        )}
      </div>

      <MobileNav activeView={mobileView} onViewChange={setMobileView} />
    </div>
  );
}
