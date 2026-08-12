import type { KanbanCard } from '@/types';

const NO_DUE_DATE = Number.POSITIVE_INFINITY;

function dueDateValue(dueDate?: string): number {
  if (!dueDate) return NO_DUE_DATE;

  const value = Date.parse(`${dueDate}T00:00:00`);
  return Number.isNaN(value) ? NO_DUE_DATE : value;
}

/**
 * Orders cards by due date while preserving their existing order when dates match.
 * Cards without a valid due date stay at the bottom of their category.
 */
export function sortCardsByDueDate(cards: KanbanCard[]): KanbanCard[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const dateDifference = dueDateValue(a.card.dueDate) - dueDateValue(b.card.dueDate);
      return dateDifference || a.index - b.index;
    })
    .map(({ card }) => card);
}
