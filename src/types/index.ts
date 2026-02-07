export type Id = string;

export type KanbanStatus = 'todo' | 'in-progress' | 'complete';

export type CardPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanCard {
  id: Id;
  title: string;
  description?: string;
  status: KanbanStatus;
  priority?: CardPriority;
  dueDate?: string; // ISO date string YYYY-MM-DD
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

// Calendar event types
export type CalendarEventColor = '#e5a54b' | '#6ec47f' | '#5b9bd5' | '#d67bff' | '#ff7b7b' | '#7bdfff' | '#ffb86b' | '#ff7baf';

export interface CalendarEvent {
  id: Id;
  title: string;
  description?: string;
  date: string; // ISO date string YYYY-MM-DD
  time?: string; // HH:MM format (optional, for all-day events)
  endTime?: string; // HH:MM format (optional)
  color: CalendarEventColor;
  createdAt: number;
}

// Activity log entry
export type ActivityType =
  | 'card_created'
  | 'card_moved'
  | 'card_completed'
  | 'card_deleted'
  | 'todo_created'
  | 'todo_completed'
  | 'event_created'
  | 'project_created';

export interface ActivityEntry {
  id: Id;
  type: ActivityType;
  title: string;
  detail?: string;
  timestamp: number;
}

export interface Project {
  id: Id;
  name: string;
  cards: KanbanCard[];
  todos: TodoItem[];
  notes: string;
  events: CalendarEvent[];
  activities: ActivityEntry[];
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
