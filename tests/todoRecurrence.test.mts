import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addTodoRecurrence,
  getNextTodoDueDate,
  refreshRecurringTodo,
} from '../src/lib/todoRecurrence.ts';

test('adds daily and weekly recurrences across month boundaries', () => {
  assert.equal(addTodoRecurrence('2026-01-31', 'daily'), '2026-02-01');
  assert.equal(addTodoRecurrence('2026-01-28', 'weekly'), '2026-02-04');
});

test('clamps monthly and yearly recurrences to the last valid day', () => {
  assert.equal(addTodoRecurrence('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(addTodoRecurrence('2024-02-29', 'yearly'), '2025-02-28');
});

test('advances an overdue recurrence to the next future date', () => {
  assert.equal(
    getNextTodoDueDate('2026-07-20', 'daily', '2026-07-26'),
    '2026-07-27'
  );
  assert.equal(
    getNextTodoDueDate('2026-07-01', 'monthly', '2026-07-26'),
    '2026-08-01'
  );
});

test('reactivates completed recurring todos when their due date arrives', () => {
  const refreshed = refreshRecurringTodo(
    {
      id: 'todo-1',
      text: 'Daily stand-up',
      completed: true,
      recurrence: 'daily',
      dueDate: '2026-07-26',
    },
    '2026-07-26'
  );

  assert.equal(refreshed.completed, false);
  assert.equal(refreshed.dueDate, '2026-07-26');
});

test('keeps completed recurring todos checked before the next due date', () => {
  const refreshed = refreshRecurringTodo(
    {
      id: 'todo-1',
      text: 'Daily stand-up',
      completed: true,
      recurrence: 'daily',
      dueDate: '2026-07-27',
    },
    '2026-07-26'
  );

  assert.equal(refreshed.completed, true);
});
