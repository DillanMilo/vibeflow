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

  const completedCount = state.todos.filter(t => t.completed).length;
  const totalCount = state.todos.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-sm font-semibold text-text-primary tracking-wide">
          Quick Tasks
        </h2>
        {totalCount > 0 && (
          <span className="text-xs text-text-dim">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Add task input */}
      <div className="flex gap-2 mb-3 md:mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a quick task..."
            className={cn(
              'w-full bg-surface border border-border rounded-lg px-3 md:px-4 py-2.5 md:py-2.5 text-sm',
              'text-text-primary placeholder:text-text-dim',
              'focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-accent/20',
              'transition-all duration-200'
            )}
          />
        </div>
        <button
          onClick={handleAddTodo}
          disabled={!newTodo.trim()}
          className={cn(
            'px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
            'bg-surface border border-border',
            'text-text-secondary hover:text-text-primary active:text-text-primary',
            'hover:bg-surface-hover active:bg-surface-active hover:border-border-accent',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface disabled:hover:border-border'
          )}
        >
          Add
        </button>
      </div>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {state.todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 md:py-8 text-center">
            <div className="w-14 h-14 md:w-12 md:h-12 rounded-xl bg-surface/50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 md:w-5 md:h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-text-dim">No tasks yet</p>
            <p className="text-xs text-text-dim/60 mt-1">Add quick tasks above</p>
          </div>
        ) : (
          <div className="space-y-1">
            {state.todos.map((todo, index) => (
              <div
                key={todo.id}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-xl',
                  'hover:bg-surface/50 active:bg-surface/70 transition-all duration-200',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
                  className={cn(
                    'w-6 h-6 md:w-5 md:h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center',
                    'transition-all duration-200 active:scale-90',
                    todo.completed
                      ? 'bg-success border-success'
                      : 'border-border hover:border-text-muted active:border-accent'
                  )}
                  aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {todo.completed && (
                    <svg className="w-3.5 h-3.5 md:w-3 md:h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Task text */}
                <span
                  className={cn(
                    'flex-1 text-sm truncate transition-all duration-200',
                    todo.completed
                      ? 'text-text-dim line-through'
                      : 'text-text-primary'
                  )}
                >
                  {todo.text}
                </span>

                {/* Action buttons - always visible on mobile */}
                <div className={cn(
                  'flex gap-1 transition-all duration-200',
                  'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                )}>
                  <button
                    onClick={() => dispatch({ type: 'PROMOTE_TODO', payload: todo.id })}
                    className={cn(
                      'p-2 md:p-1.5 rounded-lg transition-all duration-200 active:scale-90',
                      'text-text-dim hover:text-accent active:text-accent-hover hover:bg-accent-subtle'
                    )}
                    title="Promote to Kanban card"
                    aria-label="Promote to Kanban card"
                  >
                    <svg className="w-4 h-4 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}
                    className={cn(
                      'p-2 md:p-1.5 rounded-lg transition-all duration-200 active:scale-90',
                      'text-text-dim hover:text-danger active:text-danger hover:bg-danger-subtle'
                    )}
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    <svg className="w-4 h-4 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
