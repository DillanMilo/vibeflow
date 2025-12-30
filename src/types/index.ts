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

export interface Project {
  id: Id;
  name: string;
  cards: KanbanCard[];
  todos: TodoItem[];
  notes: string;
  createdAt: number;
  color?: string;
}

export interface AppState {
  projects: Project[];
  activeProjectId: Id | null;
}

// Helper to get active project data
export const getActiveProject = (state: AppState): Project | null => {
  if (!state.activeProjectId) return null;
  return state.projects.find(p => p.id === state.activeProjectId) || null;
};

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'complete', title: 'Complete' },
];

export const STORAGE_KEY = 'vibeflow-data-v2';

// Project colors for visual distinction
export const PROJECT_COLORS = [
  '#e5a54b', // amber (default)
  '#6ec47f', // green
  '#5b9bd5', // blue
  '#d67bff', // purple
  '#ff7b7b', // red
  '#7bdfff', // cyan
  '#ffb86b', // orange
  '#ff7baf', // pink
];
