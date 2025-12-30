'use client';

import { TodoList } from './TodoList';
import { NotesArea } from './NotesArea';

interface SidebarProps {
  view?: 'tasks' | 'notes' | 'all';
}

export function Sidebar({ view = 'all' }: SidebarProps) {
  // Mobile: show only the selected view
  if (view === 'tasks') {
    return (
      <div className="flex-1 p-4 md:p-5 overflow-hidden bg-background md:bg-background-elevated">
        <TodoList />
      </div>
    );
  }

  if (view === 'notes') {
    return (
      <div className="flex-1 p-4 md:p-5 overflow-hidden bg-background md:bg-background-elevated">
        <NotesArea />
      </div>
    );
  }

  // Desktop: show both sections
  return (
    <aside className="w-[340px] flex-shrink-0 border-l border-border-subtle bg-background-elevated flex flex-col h-full animate-slide-in">
      {/* Quick Tasks Section */}
      <div className="flex-1 p-5 border-b border-border-subtle overflow-hidden">
        <TodoList />
      </div>

      {/* Notes Section */}
      <div className="flex-1 p-5 overflow-hidden">
        <NotesArea />
      </div>

      {/* Decorative footer gradient */}
      <div className="h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </aside>
  );
}
