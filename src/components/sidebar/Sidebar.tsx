'use client';

import { TodoList } from './TodoList';
import { NotesArea } from './NotesArea';

export function Sidebar() {
  return (
    <aside className="w-80 flex-shrink-0 border-l border-border bg-background flex flex-col h-full">
      <div className="flex-1 p-4 border-b border-border overflow-hidden">
        <TodoList />
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <NotesArea />
      </div>
    </aside>
  );
}
