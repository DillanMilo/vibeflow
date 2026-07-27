import type { TodoItem, TodoRecurrence } from '@/types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseLocalDate(value: string): Date {
  if (!ISO_DATE_PATTERN.test(value)) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return date;
}

function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
    12
  ).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

export function getTodayIsoDate(now = new Date()): string {
  return formatLocalDate(now);
}

export function addTodoRecurrence(
  date: string,
  recurrence: Exclude<TodoRecurrence, 'none'>
): string {
  const next = parseLocalDate(date);

  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      return formatLocalDate(addMonths(next, 1));
    case 'yearly':
      return formatLocalDate(addMonths(next, 12));
  }

  return formatLocalDate(next);
}

export function getNextTodoDueDate(
  currentDueDate: string | undefined,
  recurrence: Exclude<TodoRecurrence, 'none'>,
  today = getTodayIsoDate()
): string {
  let nextDate = currentDueDate && ISO_DATE_PATTERN.test(currentDueDate)
    ? currentDueDate
    : today;

  do {
    nextDate = addTodoRecurrence(nextDate, recurrence);
  } while (nextDate <= today);

  return nextDate;
}

export function refreshRecurringTodo(
  todo: TodoItem,
  today = getTodayIsoDate()
): TodoItem {
  if (!todo.recurrence || todo.recurrence === 'none') {
    return {
      ...todo,
      recurrence: 'none',
      dueDate: undefined,
    };
  }

  const dueDate = todo.dueDate || today;
  return {
    ...todo,
    recurrence: todo.recurrence,
    dueDate,
    completed: todo.completed && dueDate <= today ? false : todo.completed,
  };
}
