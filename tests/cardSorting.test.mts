import assert from 'node:assert/strict';
import test from 'node:test';
import { sortCardsByDueDate } from '../src/lib/cardSorting.ts';
import type { KanbanCard } from '../src/types/index.ts';

const card = (id: string, dueDate?: string): KanbanCard => ({
  id,
  title: id,
  status: 'todo',
  dueDate,
  createdAt: 0,
});

test('sorts dated cards chronologically and leaves undated cards at the bottom', () => {
  const cards = [
    card('undated'),
    card('tomorrow', '2026-08-13'),
    card('today', '2026-08-12'),
    card('next-week', '2026-08-19'),
  ];

  assert.deepEqual(
    sortCardsByDueDate(cards).map(({ id }) => id),
    ['today', 'tomorrow', 'next-week', 'undated'],
  );
});

test('preserves existing order when cards share a date', () => {
  const cards = [
    card('first', '2026-08-12'),
    card('second', '2026-08-12'),
    card('third'),
    card('fourth'),
  ];

  assert.deepEqual(
    sortCardsByDueDate(cards).map(({ id }) => id),
    ['first', 'second', 'third', 'fourth'],
  );
});
