export type Id = string;

export type KanbanStatus = 'todo' | 'in-progress' | 'complete';

export interface KanbanCard {
  id: Id;
  title: string;
  description?: string;
  status: KanbanStatus;
  createdAt: number;
}

export interface TodoItem {
  id: Id;
  text: string;
  completed: boolean;
}

export interface Column {
  id: KanbanStatus;
  title: string;
}

export interface AppState {
  cards: KanbanCard[];
  todos: TodoItem[];
  notes: string;
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'complete', title: 'Complete' },
];

export const STORAGE_KEY = 'vibeflow-data';
