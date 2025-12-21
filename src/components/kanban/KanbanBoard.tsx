'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
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

export function KanbanBoard() {
  const { state, dispatch } = useApp();
  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCardsByStatus = (status: KanbanStatus) => {
    return state.cards.filter((card) => card.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = state.cards.find((c) => c.id === event.active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = state.cards.find((c) => c.id === activeId);
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
    const overCard = state.cards.find((c) => c.id === overId);
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

    const activeCard = state.cards.find((c) => c.id === activeId);
    const overCard = state.cards.find((c) => c.id === overId);

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
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            cards={getCardsByStatus(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? <KanbanCard card={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
