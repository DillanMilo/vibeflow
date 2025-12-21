'use client';

import { useState, type KeyboardEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function TodoList() {
  const { state, dispatch } = useApp();
  const [newTodo, setNewTodo] = useState('');

  const handleAddTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    dispatch({ type: 'ADD_TODO', payload: text });
    setNewTodo('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-medium text-text-secondary mb-3">Quick Tasks</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-muted transition-colors"
        />
        <button
          onClick={handleAddTodo}
          disabled={!newTodo.trim()}
          className="px-3 py-1.5 text-sm bg-surface border border-border rounded text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {state.todos.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No tasks yet</p>
        ) : (
          state.todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-2 p-2 rounded hover:bg-surface-hover transition-colors"
            >
              <button
                onClick={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
                className={cn(
                  'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                  todo.completed
                    ? 'bg-accent border-accent'
                    : 'border-border hover:border-text-muted'
                )}
              >
                {todo.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <span
                className={cn(
                  'flex-1 text-sm truncate',
                  todo.completed ? 'text-text-muted line-through' : 'text-text-primary'
                )}
              >
                {todo.text}
              </span>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => dispatch({ type: 'PROMOTE_TODO', payload: todo.id })}
                  className="p-1 text-text-muted hover:text-accent transition-colors"
                  title="Move to Kanban"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}
                  className="p-1 text-text-muted hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
