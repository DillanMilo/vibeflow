'use client';

import { useState, type KeyboardEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { TodoItem, TodoCategory, Id } from '@/types';

function TodoItemRow({
  todo,
  onToggle,
  onPromote,
  onDelete,
  index,
}: {
  todo: TodoItem;
  onToggle: () => void;
  onPromote: () => void;
  onDelete: () => void;
  index: number;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl',
        'hover:bg-surface/50 active:bg-surface/70 transition-all duration-200',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
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
          onClick={onPromote}
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
          onClick={onDelete}
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
  );
}

function CategorySection({
  category,
  todos,
  dispatch,
}: {
  category: TodoCategory;
  todos: TodoItem[];
  dispatch: ReturnType<typeof useApp>['dispatch'];
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const completedCount = todos.filter(t => t.completed).length;

  const handleAddTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    dispatch({ type: 'ADD_TODO', payload: { text, categoryId: category.id } });
    setNewTodo('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddTodo();
    if (e.key === 'Escape') { setNewTodo(''); setIsAdding(false); }
  };

  const handleSaveEdit = () => {
    const name = editName.trim();
    if (!name) return;
    dispatch({ type: 'UPDATE_TODO_CATEGORY', payload: { id: category.id, name } });
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') { setEditName(category.name); setIsEditing(false); }
  };

  return (
    <div className="mb-2">
      {/* Category header */}
      <div className="flex items-center gap-1.5 group/cat">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 flex-1 min-w-0 py-1.5 px-1 rounded-lg hover:bg-surface/50 transition-all"
        >
          <svg
            className={cn(
              'w-3 h-3 text-text-dim transition-transform duration-200 flex-shrink-0',
              isCollapsed && '-rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleSaveEdit}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-xs font-semibold text-accent focus:outline-none min-w-0"
            />
          ) : (
            <span className="text-xs font-semibold text-accent truncate">
              {category.name}
            </span>
          )}
          <span className="text-[10px] text-text-dim flex-shrink-0">
            {completedCount}/{todos.length}
          </span>
        </button>

        {/* Category actions */}
        <div className="flex gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
          {!isEditing && (
            <button
              type="button"
              onClick={() => { setIsEditing(true); setEditName(category.name); }}
              className="p-1 rounded text-text-dim hover:text-accent hover:bg-accent-subtle transition-colors"
              title="Rename category"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => dispatch({ type: 'DELETE_TODO_CATEGORY', payload: category.id })}
            className="p-1 rounded text-text-dim hover:text-danger hover:bg-danger-subtle transition-colors"
            title="Delete category (tasks move to General)"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category content */}
      {!isCollapsed && (
        <div className="ml-3 border-l border-border-subtle/50 pl-2">
          {todos.length === 0 && !isAdding && (
            <p className="text-[11px] text-text-dim py-2 px-1">No tasks yet</p>
          )}

          {todos.map((todo, index) => (
            <TodoItemRow
              key={todo.id}
              todo={todo}
              index={index}
              onToggle={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
              onPromote={() => dispatch({ type: 'PROMOTE_TODO', payload: todo.id })}
              onDelete={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}
            />
          ))}

          {/* Inline add for this category */}
          {isAdding ? (
            <div className="flex gap-1.5 py-1.5 px-1 animate-fade-in">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="New task..."
                autoFocus
                className={cn(
                  'flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs',
                  'text-text-primary placeholder:text-text-dim',
                  'focus:outline-none focus:border-border-accent'
                )}
              />
              <button
                onClick={handleAddTodo}
                disabled={!newTodo.trim()}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all',
                  'bg-accent text-background hover:bg-accent-hover active:scale-95',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                Add
              </button>
              <button
                onClick={() => { setNewTodo(''); setIsAdding(false); }}
                className="px-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 py-1.5 px-1 text-[11px] text-text-dim hover:text-text-muted transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TodoList() {
  const { todos, todoCategories, dispatch } = useApp();
  const [newTodo, setNewTodo] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    dispatch({ type: 'ADD_TODO_CATEGORY', payload: name });
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddCategory();
    if (e.key === 'Escape') { setNewCategoryName(''); setShowAddCategory(false); }
  };

  // Split todos: uncategorized vs categorized
  const uncategorizedTodos = todos.filter(t => !t.categoryId);
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

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

      {/* Add task input (adds to General/uncategorized) */}
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
        {todos.length === 0 && todoCategories.length === 0 ? (
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
            {/* Category sections */}
            {todoCategories.map((category) => {
              const categoryTodos = todos.filter(t => t.categoryId === category.id);
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  todos={categoryTodos}
                  dispatch={dispatch}
                />
              );
            })}

            {/* General (uncategorized) section */}
            {(uncategorizedTodos.length > 0 || todoCategories.length > 0) && (
              <div className={todoCategories.length > 0 ? 'mt-1' : ''}>
                {todoCategories.length > 0 && (
                  <div className="flex items-center gap-1.5 py-1.5 px-1">
                    <span className="text-xs font-semibold text-text-muted">General</span>
                    <span className="text-[10px] text-text-dim">
                      {uncategorizedTodos.filter(t => t.completed).length}/{uncategorizedTodos.length}
                    </span>
                  </div>
                )}
                {uncategorizedTodos.map((todo, index) => (
                  <TodoItemRow
                    key={todo.id}
                    todo={todo}
                    index={index}
                    onToggle={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
                    onPromote={() => dispatch({ type: 'PROMOTE_TODO', payload: todo.id })}
                    onDelete={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}
                  />
                ))}
              </div>
            )}

            {/* Uncategorized todos when no categories exist */}
            {todoCategories.length === 0 && uncategorizedTodos.map((todo, index) => (
              <TodoItemRow
                key={todo.id}
                todo={todo}
                index={index}
                onToggle={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
                onPromote={() => dispatch({ type: 'PROMOTE_TODO', payload: todo.id })}
                onDelete={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add category button */}
      <div className="flex-shrink-0 pt-3 mt-2 border-t border-border-subtle">
        {showAddCategory ? (
          <div className="flex gap-1.5 animate-fade-in">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={handleCategoryKeyDown}
              placeholder="Category name..."
              autoFocus
              className={cn(
                'flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs',
                'text-text-primary placeholder:text-text-dim',
                'focus:outline-none focus:border-border-accent'
              )}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-lg transition-all',
                'bg-accent text-background hover:bg-accent-hover active:scale-95',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              Add
            </button>
            <button
              onClick={() => { setNewCategoryName(''); setShowAddCategory(false); }}
              className="px-2 py-2 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddCategory(true)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all',
              'text-text-dim hover:text-text-muted hover:bg-surface/50',
              'border border-dashed border-border-subtle hover:border-border'
            )}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New category
          </button>
        )}
      </div>
    </div>
  );
}
