'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useApp } from '@/context/AppContext';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { COLUMNS, type KanbanStatus, type KanbanCard as KanbanCardType } from '@/types';
import { cn } from '@/lib/utils';

export function KanbanBoard() {
  const { cards, dispatch } = useApp();
  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCardsByStatus = (status: KanbanStatus) => {
    return cards.filter((card) => card.status === status);
  };

  // Handle scroll to detect active column on mobile
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const columnWidth = container.scrollWidth / COLUMNS.length;
    const newIndex = Math.round(scrollLeft / columnWidth);
    setActiveColumnIndex(Math.min(Math.max(newIndex, 0), COLUMNS.length - 1));
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll to column when dot is clicked
  const scrollToColumn = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const columnWidth = container.scrollWidth / COLUMNS.length;
    container.scrollTo({
      left: columnWidth * index,
      behavior: 'smooth',
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find((c) => c.id === activeId);
    if (!activeCard) return;

    // Check if over a column
    const overColumn = COLUMNS.find((col) => col.id === overId);
    if (overColumn && activeCard.status !== overColumn.id) {
      dispatch({
        type: 'MOVE_CARD',
        payload: { id: activeId, status: overColumn.id },
      });
      return;
    }

    // Check if over another card
    const overCard = cards.find((c) => c.id === overId);
    if (overCard && activeCard.status !== overCard.status) {
      dispatch({
        type: 'MOVE_CARD',
        payload: { id: activeId, status: overCard.status },
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeCard = cards.find((c) => c.id === activeId);
    const overCard = cards.find((c) => c.id === overId);

    if (!activeCard) return;

    // If dropped on another card in the same column, reorder
    if (overCard && activeCard.status === overCard.status) {
      const columnCards = getCardsByStatus(activeCard.status);
      const oldIndex = columnCards.findIndex((c) => c.id === activeId);
      const newIndex = columnCards.findIndex((c) => c.id === overId);

      if (oldIndex !== newIndex) {
        const newOrder = [...columnCards];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);

        dispatch({
          type: 'REORDER_CARDS',
          payload: {
            status: activeCard.status,
            cardIds: newOrder.map((c) => c.id),
          },
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative h-full flex flex-col">
        {/* Scrollable columns container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-6 p-4 md:p-6 flex-1 overflow-x-auto snap-x snap-mandatory md:snap-none touch-pan-x"
        >
          {COLUMNS.map((column, index) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              cards={getCardsByStatus(column.id)}
              animationDelay={index}
            />
          ))}
          {/* Spacer for mobile scroll padding */}
          <div className="w-4 md:w-0 flex-shrink-0" />
        </div>

        {/* Column indicator dots - mobile only */}
        <div className="flex md:hidden justify-center gap-2 pb-4 pt-2 bg-gradient-to-t from-background to-transparent">
          {COLUMNS.map((column, index) => (
            <button
              key={column.id}
              type="button"
              onClick={() => scrollToColumn(index)}
              onTouchEnd={(e) => {
                e.stopPropagation();
                scrollToColumn(index);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300 touch-manipulation',
                activeColumnIndex === index
                  ? 'bg-accent w-6'
                  : 'bg-border hover:bg-text-dim'
              )}
              aria-label={`Go to ${column.title} column`}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeCard ? <KanbanCard card={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
