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
}

export function KanbanColumn({ id, title, cards }: KanbanColumnProps) {
  const { dispatch } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { setNodeRef, isOver } = useDroppable({ id });

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
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <span className="text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded">
          {cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 rounded-xl bg-surface/50 min-h-[200px] transition-colors',
          isOver && 'bg-surface'
        )}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>

        {isAdding ? (
          <div className="mt-2 bg-surface border border-border rounded-lg p-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Card title"
              autoFocus
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none mb-2"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-transparent text-xs text-text-secondary placeholder:text-text-muted resize-none focus:outline-none mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newTitle.trim()}
                className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setNewTitle('');
                  setNewDescription('');
                  setIsAdding(false);
                }}
                className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 w-full p-2 text-sm text-text-muted hover:text-text-secondary hover:bg-surface rounded-lg transition-colors text-left"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
