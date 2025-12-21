'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { KanbanCard as KanbanCardType } from '@/types';

interface KanbanCardProps {
  card: KanbanCardType;
  overlay?: boolean;
}

export function KanbanCard({ card, overlay }: KanbanCardProps) {
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
      <div className="bg-surface border border-border rounded-lg p-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Card title"
          autoFocus
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none mb-2"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-transparent text-xs text-text-secondary placeholder:text-text-muted resize-none focus:outline-none mb-2"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditTitle(card.title);
              setEditDescription(card.description || '');
              setIsEditing(false);
            }}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
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
        'group bg-surface border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors',
        isDragging && 'opacity-50',
        overlay && 'shadow-lg rotate-2',
        !isDragging && 'hover:border-text-muted/30'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-text-primary flex-1">{card.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'DELETE_CARD', payload: card.id });
            }}
            className="p-1 text-text-muted hover:text-red-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {card.description && (
        <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{card.description}</p>
      )}
    </div>
  );
}
