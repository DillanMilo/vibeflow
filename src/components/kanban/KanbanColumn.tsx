'use client';

import { useState, useMemo, type KeyboardEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useApp } from '@/context/AppContext';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import type { KanbanCard as KanbanCardType, KanbanStatus, TodoCategory, Id } from '@/types';

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

interface CardGroup {
  category: TodoCategory | null;
  cards: KanbanCardType[];
}

export function KanbanColumn({ id, title, cards, animationDelay = 0 }: KanbanColumnProps) {
  const { dispatch, todoCategories } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addToTop, setAddToTop] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<Id | ''>('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { setNodeRef, isOver } = useDroppable({ id });
  const config = statusConfig[id];

  // Check if we have any categorized cards in this column
  const hasCategorizedCards = cards.some(c => c.categoryId);

  // Group cards by category
  const groups = useMemo((): CardGroup[] | null => {
    if (todoCategories.length === 0 || !hasCategorizedCards) return null;

    const categoryMap = new Map<string, KanbanCardType[]>();
    const uncategorized: KanbanCardType[] = [];

    for (const card of cards) {
      if (card.categoryId) {
        const existing = categoryMap.get(card.categoryId) || [];
        existing.push(card);
        categoryMap.set(card.categoryId, existing);
      } else {
        uncategorized.push(card);
      }
    }

    const result: CardGroup[] = [];

    // Add groups for categories that have cards
    for (const cat of todoCategories) {
      const catCards = categoryMap.get(cat.id);
      if (catCards && catCards.length > 0) {
        result.push({ category: cat, cards: catCards });
      }
    }

    // Add uncategorized at the end
    if (uncategorized.length > 0) {
      result.push({ category: null, cards: uncategorized });
    }

    return result;
  }, [cards, todoCategories, hasCategorizedCards]);

  // Flat ordered list for SortableContext (grouped order)
  const orderedCardIds = useMemo(() => {
    if (!groups) return cards.map(c => c.id);
    return groups.flatMap(g => g.cards.map(c => c.id));
  }, [groups, cards]);

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleAddCard = () => {
    const titleText = newTitle.trim();
    if (!titleText) return;

    dispatch({
      type: 'ADD_CARD',
      payload: {
        title: titleText,
        description: newDescription.trim() || undefined,
        status: id,
        position: addToTop ? 'top' : 'bottom',
        categoryId: newCategoryId || undefined,
      },
    });
    setNewTitle('');
    setNewDescription('');
    setNewCategoryId('');
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

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  };

  const renderGroupedCards = (cardGroups: CardGroup[]) => (
    <div className="space-y-2 md:space-y-3">
      {cardGroups.map((group) => {
        const groupKey = group.category?.id || '__uncategorized';
        const isGroupCollapsed = collapsedGroups.has(groupKey);
        const completedInGroup = group.cards.filter(c => c.status === 'complete').length;

        return (
          <div key={groupKey}>
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroup(groupKey)}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                'flex items-center gap-1.5 w-full px-2 py-1.5 mb-1.5 rounded-lg transition-all',
                'hover:bg-surface/50'
              )}
            >
              <svg
                className={cn(
                  'w-3 h-3 text-text-dim transition-transform duration-200 flex-shrink-0',
                  isGroupCollapsed && '-rotate-90'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <svg className="w-3 h-3 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-[11px] font-semibold text-accent truncate">
                {group.category?.name || 'General'}
              </span>
              <span className="text-[10px] text-text-dim ml-auto flex-shrink-0">
                {group.cards.length}
              </span>
            </button>

            {/* Group cards */}
            {!isGroupCollapsed && (
              <div className="space-y-2 md:space-y-3">
                {group.cards.map((card, index) => (
                  <KanbanCard key={card.id} card={card} index={index} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderFlatCards = () => (
    <div className="space-y-2 md:space-y-3">
      {cards.map((card, index) => (
        <KanbanCard key={card.id} card={card} index={index} />
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        'flex flex-col flex-shrink-0 animate-fade-in-up md:h-full max-h-none md:max-h-[calc(100dvh-140px)]',
        'w-full md:w-80' // Full width on mobile, fixed on desktop
      )}
      style={{ animationDelay: `${animationDelay * 100}ms` }}
    >
      {/* Column header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between mb-3 md:mb-4 px-1 flex-shrink-0 w-full group/header"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className={cn('status-dot', config.dotClass)} />
          <h3 className="text-xs md:text-sm font-medium text-text-secondary tracking-wide uppercase">
            {title}
          </h3>
          <svg
            className={cn(
              'w-3.5 h-3.5 text-text-dim transition-transform duration-200',
              isCollapsed && '-rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <span className="text-xs font-medium text-text-dim bg-surface px-2 py-1 rounded-md border border-border-subtle">
          {cards.length}
        </span>
      </button>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col rounded-xl md:rounded-2xl transition-all duration-200 overflow-hidden',
          'bg-surface/30 border border-border-subtle',
          isCollapsed ? 'min-h-0 p-0' : 'flex-1 p-2 md:p-3 min-h-[200px]',
          isOver && !isCollapsed && 'bg-surface/60 border-border-accent shadow-lg'
        )}
      >
        {!isCollapsed && (
          <>
            {/* Scrollable cards container */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1 min-h-0">
              <SortableContext items={orderedCardIds} strategy={verticalListSortingStrategy}>
                {groups ? renderGroupedCards(groups) : renderFlatCards()}
              </SortableContext>
            </div>

            {/* Add card form */}
            <div className="flex-shrink-0">
            {isAdding ? (
              <div className="mt-2 md:mt-3 bg-surface border border-border rounded-lg md:rounded-xl p-3 md:p-4 shadow-md animate-fade-in">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  placeholder="What needs to be done?"
                  autoFocus
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-dim focus:outline-none mb-2 md:mb-3 font-medium"
                />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  placeholder="Add details... (optional)"
                  rows={2}
                  className="w-full bg-transparent text-xs text-text-secondary placeholder:text-text-dim resize-none focus:outline-none mb-3"
                />

                {/* Category selector */}
                {todoCategories.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-text-dim">Category:</span>
                    <div className="flex gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setNewCategoryId('')}
                        className={cn(
                          'px-2 py-1 text-[10px] font-medium rounded-md transition-all',
                          newCategoryId === ''
                            ? 'bg-surface-active text-text-primary'
                            : 'text-text-dim hover:text-text-muted hover:bg-surface-hover'
                        )}
                      >
                        None
                      </button>
                      {todoCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewCategoryId(cat.id)}
                          className={cn(
                            'px-2 py-1 text-[10px] font-medium rounded-md transition-all',
                            newCategoryId === cat.id
                              ? 'bg-accent/15 text-accent'
                              : 'text-text-dim hover:text-text-muted hover:bg-surface-hover'
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to top toggle */}
                <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => setAddToTop(!addToTop)}
                    className={cn(
                      'relative w-8 h-[18px] rounded-full transition-colors duration-200',
                      addToTop ? 'bg-accent' : 'bg-border'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform duration-200',
                        addToTop && 'translate-x-[14px]'
                      )}
                    />
                  </button>
                  <span className="text-xs text-text-muted">Add to top of list</span>
                </label>

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
                      setNewCategoryId('');
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
          </>
        )}
      </div>
    </div>
  );
}
