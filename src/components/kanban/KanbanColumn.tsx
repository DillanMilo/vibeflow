'use client';

import { useState, type KeyboardEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useApp } from '@/context/AppContext';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import type { KanbanCard as KanbanCardType, KanbanStatus } from '@/types';

interface KanbanColumnProps {
  id: KanbanStatus;
  title: string;
  cards: KanbanCardType[];
  animationDelay?: number;
}

const statusConfig = {
  'todo': {
    dotClass: 'status-todo',
    label: 'To Do',
  },
  'in-progress': {
    dotClass: 'status-in-progress',
    label: 'In Progress',
  },
  'complete': {
    dotClass: 'status-complete',
    label: 'Complete',
  },
};

export function KanbanColumn({ id, title, cards, animationDelay = 0 }: KanbanColumnProps) {
  const { dispatch } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { setNodeRef, isOver } = useDroppable({ id });
  const config = statusConfig[id];

  const handleAddCard = () => {
    const titleText = newTitle.trim();
    if (!titleText) return;

    dispatch({
      type: 'ADD_CARD',
      payload: {
        title: titleText,
        description: newDescription.trim() || undefined,
        status: id,
      },
    });
    setNewTitle('');
    setNewDescription('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddCard();
    }
    if (e.key === 'Escape') {
      setNewTitle('');
      setNewDescription('');
      setIsAdding(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col flex-shrink-0 animate-fade-in-up',
        'w-[280px] md:w-80', // Responsive width
        'snap-center md:snap-align-none' // Snap on mobile
      )}
      style={{ animationDelay: `${animationDelay * 100}ms` }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 md:mb-4 px-1">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={cn('status-dot', config.dotClass)} />
          <h3 className="text-xs md:text-sm font-medium text-text-secondary tracking-wide uppercase">
            {title}
          </h3>
        </div>
        <span className="text-xs font-medium text-text-dim bg-surface px-2 py-1 rounded-md border border-border-subtle">
          {cards.length}
        </span>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 md:p-3 rounded-xl md:rounded-2xl min-h-[200px] transition-all duration-200',
          'bg-surface/30 border border-border-subtle',
          isOver && 'bg-surface/60 border-border-accent shadow-lg'
        )}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 md:space-y-3">
            {cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} />
            ))}
          </div>
        </SortableContext>

        {/* Add card form */}
        {isAdding ? (
          <div className="mt-2 md:mt-3 bg-surface border border-border rounded-lg md:rounded-xl p-3 md:p-4 shadow-md animate-fade-in">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-dim focus:outline-none mb-2 md:mb-3 font-medium"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add details... (optional)"
              rows={2}
              className="w-full bg-transparent text-xs text-text-secondary placeholder:text-text-dim resize-none focus:outline-none mb-3 md:mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newTitle.trim()}
                className={cn(
                  'px-3 md:px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200',
                  'bg-accent text-background hover:bg-accent-hover active:scale-95',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent disabled:active:scale-100',
                  'shadow-sm hover:shadow-md'
                )}
              >
                Add Card
              </button>
              <button
                onClick={() => {
                  setNewTitle('');
                  setNewDescription('');
                  setIsAdding(false);
                }}
                className="px-3 md:px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className={cn(
              'mt-2 md:mt-3 w-full p-2.5 md:p-3 text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200',
              'text-text-dim hover:text-text-secondary active:text-text-primary',
              'bg-transparent hover:bg-surface/50 active:bg-surface/70',
              'border border-transparent hover:border-border-subtle',
              'text-left flex items-center gap-2'
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add card
          </button>
        )}
      </div>
    </div>
  );
}
