'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { KanbanCard as KanbanCardType, KanbanStatus } from '@/types';

interface KanbanCardProps {
  card: KanbanCardType;
  overlay?: boolean;
  index?: number;
}

// Column order for navigation
const COLUMN_ORDER: KanbanStatus[] = ['todo', 'in-progress', 'complete'];

const STATUS_LABELS: Record<KanbanStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'complete': 'Complete',
};

export function KanbanCard({ card, overlay, index = 0 }: KanbanCardProps) {
  const { dispatch } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animationDelay: `${index * 50}ms`,
  };

  // Get current column index and determine if we can move left/right
  const currentIndex = COLUMN_ORDER.indexOf(card.status);
  const canMoveLeft = currentIndex > 0;
  const canMoveRight = currentIndex < COLUMN_ORDER.length - 1;
  const prevStatus = canMoveLeft ? COLUMN_ORDER[currentIndex - 1] : null;
  const nextStatus = canMoveRight ? COLUMN_ORDER[currentIndex + 1] : null;

  const handleMoveCard = (newStatus: KanbanStatus) => {
    dispatch({
      type: 'MOVE_CARD',
      payload: { id: card.id, status: newStatus },
    });
  };

  const handleSave = () => {
    const title = editTitle.trim();
    if (!title) return;

    dispatch({
      type: 'UPDATE_CARD',
      payload: {
        id: card.id,
        updates: {
          title,
          description: editDescription.trim() || undefined,
        },
      },
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditTitle(card.title);
      setEditDescription(card.description || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-surface border border-border-accent rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg animate-fade-in">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Card title"
          autoFocus
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-dim focus:outline-none mb-2 md:mb-3 font-medium"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add details... (optional)"
          rows={2}
          className="w-full bg-transparent text-xs text-text-secondary placeholder:text-text-dim resize-none focus:outline-none mb-3 md:mb-4"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              'px-3 md:px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200',
              'bg-accent text-background hover:bg-accent-hover active:scale-95',
              'shadow-sm hover:shadow-md'
            )}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditTitle(card.title);
              setEditDescription(card.description || '');
              setIsEditing(false);
            }}
            className="px-3 md:px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-surface border border-border rounded-lg md:rounded-xl p-3 md:p-4',
        'cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        'hover:border-border-accent md:hover:shadow-md',
        'active:scale-[0.98]',
        isDragging && 'opacity-40 scale-[0.98]',
        overlay && 'shadow-xl rotate-2 border-accent/50 bg-surface/95 backdrop-blur-sm',
        !overlay && 'animate-fade-in'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Subtle gradient accent on hover - desktop only */}
      <div className="hidden md:block absolute inset-0 rounded-xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative flex items-start justify-between gap-2 md:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium leading-snug">
            {card.title}
          </p>
          {card.description && (
            <p className="text-xs text-text-muted mt-1.5 md:mt-2 line-clamp-2 leading-relaxed">
              {card.description}
            </p>
          )}
        </div>

        {/* Action buttons - always visible on mobile, hover on desktop */}
        <div className={cn(
          'flex gap-1 transition-all duration-200',
          'opacity-100 md:opacity-0 md:group-hover:opacity-100',
          'translate-x-0 md:translate-x-1 md:group-hover:translate-x-0'
        )}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className={cn(
              'p-1.5 md:p-1.5 rounded-lg transition-all duration-200',
              'text-text-dim hover:text-accent active:text-accent-hover',
              'hover:bg-accent-subtle active:bg-accent-subtle'
            )}
            aria-label="Edit card"
          >
            <svg className="w-4 h-4 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'DELETE_CARD', payload: card.id });
            }}
            className={cn(
              'p-1.5 md:p-1.5 rounded-lg transition-all duration-200',
              'text-text-dim hover:text-danger active:text-danger',
              'hover:bg-danger-subtle active:bg-danger-subtle'
            )}
            aria-label="Delete card"
          >
            <svg className="w-4 h-4 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile move buttons */}
      <div className="md:hidden flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (prevStatus) handleMoveCard(prevStatus);
          }}
          disabled={!canMoveLeft}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            'touch-manipulation select-none',
            canMoveLeft
              ? 'text-text-secondary bg-surface-hover active:bg-surface-active active:scale-95'
              : 'text-text-dim/40 cursor-not-allowed'
          )}
          aria-label={prevStatus ? `Move to ${STATUS_LABELS[prevStatus]}` : 'Cannot move left'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {prevStatus && <span>{STATUS_LABELS[prevStatus]}</span>}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (nextStatus) handleMoveCard(nextStatus);
          }}
          disabled={!canMoveRight}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            'touch-manipulation select-none',
            canMoveRight
              ? 'text-text-secondary bg-surface-hover active:bg-surface-active active:scale-95'
              : 'text-text-dim/40 cursor-not-allowed'
          )}
          aria-label={nextStatus ? `Move to ${STATUS_LABELS[nextStatus]}` : 'Cannot move right'}
        >
          {nextStatus && <span>{STATUS_LABELS[nextStatus]}</span>}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Drag handle indicator - desktop only */}
      <div className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
        <svg className="w-3 h-3 text-text-dim" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
    </div>
  );
}
