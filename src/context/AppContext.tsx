'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';
import { generateId } from '@/lib/utils';
import type { AppState, KanbanCard, KanbanStatus, TodoItem, CalendarEvent, ActivityEntry, Id, Project } from '@/types';
import { STORAGE_KEY, PROJECT_COLORS } from '@/types';
import { useAuth } from './AuthContext';
import {
  fetchUserData,
  createProject as dbCreateProject,
  migrateLocalStorageToSupabase,
  syncToSupabase,
} from '@/lib/supabase/sync';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

// Migration: old storage key for migrating existing data
const OLD_STORAGE_KEY = 'vibeflow-data';

type Action =
  // Project actions
  | { type: 'ADD_PROJECT'; payload: { name: string; color?: string } }
  | { type: 'UPDATE_PROJECT'; payload: { id: Id; updates: Partial<Pick<Project, 'name' | 'color'>> } }
  | { type: 'DELETE_PROJECT'; payload: Id }
  | { type: 'SET_ACTIVE_PROJECT'; payload: Id }
  // Card actions (operate on active project)
  | { type: 'ADD_CARD'; payload: { title: string; description?: string; status: KanbanStatus } }
  | { type: 'UPDATE_CARD'; payload: { id: Id; updates: Partial<KanbanCard> } }
  | { type: 'DELETE_CARD'; payload: Id }
  | { type: 'MOVE_CARD'; payload: { id: Id; status: KanbanStatus; newIndex?: number } }
  | { type: 'REORDER_CARDS'; payload: { status: KanbanStatus; cardIds: Id[] } }
  // Todo actions (operate on active project)
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: Id }
  | { type: 'DELETE_TODO'; payload: Id }
  | { type: 'PROMOTE_TODO'; payload: Id }
  // Notes action (operates on active project)
  | { type: 'SET_NOTES'; payload: string }
  // Calendar actions (operate on active project)
  | { type: 'ADD_EVENT'; payload: Omit<CalendarEvent, 'id' | 'createdAt'> }
  | { type: 'UPDATE_EVENT'; payload: { id: Id; updates: Partial<CalendarEvent> } }
  | { type: 'DELETE_EVENT'; payload: Id }
  // Hydration
  | { type: 'HYDRATE'; payload: AppState };

const createDefaultProject = (name: string = 'My Project', color?: string): Project => ({
  id: generateId(),
  name,
  cards: [],
  todos: [],
  notes: '',
  events: [],
  activities: [],
  createdAt: Date.now(),
  color: color || PROJECT_COLORS[0],
});

const initialState: AppState = {
  projects: [],
  activeProjectId: null,
};

// Helper to update the active project
const updateActiveProject = (
  state: AppState,
  updater: (project: Project) => Project
): AppState => {
  if (!state.activeProjectId) return state;

  return {
    ...state,
    projects: state.projects.map((project) =>
      project.id === state.activeProjectId ? updater(project) : project
    ),
  };
};

// Helper to add an activity entry to a project
const addActivity = (project: Project, type: ActivityEntry['type'], title: string, detail?: string): Project => ({
  ...project,
  activities: [
    {
      id: generateId(),
      type,
      title,
      detail,
      timestamp: Date.now(),
    },
    ...project.activities,
  ].slice(0, 100), // Keep last 100 activities
});

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': {
      // Ensure all projects have events and activities arrays (migration safety)
      const migratedPayload = {
        ...action.payload,
        projects: action.payload.projects.map(p => ({
          ...p,
          events: p.events || [],
          activities: p.activities || [],
        })),
      };
      return migratedPayload;
    }

    // === Project Actions ===
    case 'ADD_PROJECT': {
      const newProject = createDefaultProject(
        action.payload.name,
        action.payload.color || PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length]
      );
      const projectWithActivity = addActivity(newProject, 'project_created', `Project "${newProject.name}" created`);
      return {
        ...state,
        projects: [...state.projects, projectWithActivity],
        activeProjectId: state.activeProjectId || newProject.id,
      };
    }

    case 'UPDATE_PROJECT': {
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.id
            ? { ...project, ...action.payload.updates }
            : project
        ),
      };
    }

    case 'DELETE_PROJECT': {
      const newProjects = state.projects.filter((p) => p.id !== action.payload);
      const needNewActive = state.activeProjectId === action.payload;

      return {
        ...state,
        projects: newProjects,
        activeProjectId: needNewActive
          ? (newProjects[0]?.id || null)
          : state.activeProjectId,
      };
    }

    case 'SET_ACTIVE_PROJECT': {
      return {
        ...state,
        activeProjectId: action.payload,
      };
    }

    // === Card Actions (operate on active project) ===
    case 'ADD_CARD': {
      return updateActiveProject(state, (project) => {
        const updated = {
          ...project,
          cards: [
            ...project.cards,
            {
              id: generateId(),
              title: action.payload.title,
              description: action.payload.description,
              status: action.payload.status,
              createdAt: Date.now(),
            },
          ],
        };
        return addActivity(updated, 'card_created', `Card "${action.payload.title}" created`);
      });
    }

    case 'UPDATE_CARD': {
      return updateActiveProject(state, (project) => ({
        ...project,
        cards: project.cards.map((card) =>
          card.id === action.payload.id
            ? { ...card, ...action.payload.updates }
            : card
        ),
      }));
    }

    case 'DELETE_CARD': {
      return updateActiveProject(state, (project) => {
        const card = project.cards.find(c => c.id === action.payload);
        const updated = {
          ...project,
          cards: project.cards.filter((c) => c.id !== action.payload),
        };
        return card ? addActivity(updated, 'card_deleted', `Card "${card.title}" deleted`) : updated;
      });
    }

    case 'MOVE_CARD': {
      const { id, status, newIndex } = action.payload;

      return updateActiveProject(state, (project) => {
        const cardToMove = project.cards.find((c) => c.id === id);
        if (!cardToMove) return project;

        const statusChanged = cardToMove.status !== status;
        const otherCards = project.cards.filter((c) => c.id !== id);
        const updatedCard = { ...cardToMove, status };

        let updated: Project;
        if (newIndex !== undefined) {
          const cardsInTargetColumn = otherCards.filter((c) => c.status === status);
          const cardsNotInTarget = otherCards.filter((c) => c.status !== status);
          cardsInTargetColumn.splice(newIndex, 0, updatedCard);
          updated = { ...project, cards: [...cardsNotInTarget, ...cardsInTargetColumn] };
        } else {
          updated = { ...project, cards: [...otherCards, updatedCard] };
        }

        if (statusChanged) {
          const statusLabels: Record<string, string> = { 'todo': 'To Do', 'in-progress': 'In Progress', 'complete': 'Complete' };
          const actType = status === 'complete' ? 'card_completed' as const : 'card_moved' as const;
          return addActivity(updated, actType, `Card "${cardToMove.title}" moved to ${statusLabels[status]}`);
        }
        return updated;
      });
    }

    case 'REORDER_CARDS': {
      const { status, cardIds } = action.payload;

      return updateActiveProject(state, (project) => {
        const cardsInColumn = cardIds
          .map((id) => project.cards.find((c) => c.id === id))
          .filter((c): c is KanbanCard => c !== undefined);
        const otherCards = project.cards.filter((c) => c.status !== status);
        return { ...project, cards: [...otherCards, ...cardsInColumn] };
      });
    }

    // === Todo Actions (operate on active project) ===
    case 'ADD_TODO': {
      return updateActiveProject(state, (project) => {
        const updated = {
          ...project,
          todos: [
            ...project.todos,
            {
              id: generateId(),
              text: action.payload,
              completed: false,
            },
          ],
        };
        return addActivity(updated, 'todo_created', `Task "${action.payload}" added`);
      });
    }

    case 'TOGGLE_TODO': {
      return updateActiveProject(state, (project) => {
        const todo = project.todos.find(t => t.id === action.payload);
        const updated = {
          ...project,
          todos: project.todos.map((t) =>
            t.id === action.payload
              ? { ...t, completed: !t.completed }
              : t
          ),
        };
        if (todo && !todo.completed) {
          return addActivity(updated, 'todo_completed', `Task "${todo.text}" completed`);
        }
        return updated;
      });
    }

    case 'DELETE_TODO': {
      return updateActiveProject(state, (project) => ({
        ...project,
        todos: project.todos.filter((todo) => todo.id !== action.payload),
      }));
    }

    case 'PROMOTE_TODO': {
      return updateActiveProject(state, (project) => {
        const todo = project.todos.find((t) => t.id === action.payload);
        if (!todo) return project;

        const newCard: KanbanCard = {
          id: generateId(),
          title: todo.text,
          status: 'todo',
          createdAt: Date.now(),
        };

        return {
          ...project,
          todos: project.todos.filter((t) => t.id !== action.payload),
          cards: [...project.cards, newCard],
        };
      });
    }

    // === Notes Action ===
    case 'SET_NOTES': {
      return updateActiveProject(state, (project) => ({
        ...project,
        notes: action.payload,
      }));
    }

    // === Calendar Event Actions ===
    case 'ADD_EVENT': {
      return updateActiveProject(state, (project) => {
        const updated = {
          ...project,
          events: [
            ...project.events,
            {
              id: generateId(),
              ...action.payload,
              createdAt: Date.now(),
            },
          ],
        };
        return addActivity(updated, 'event_created', `Event "${action.payload.title}" scheduled`);
      });
    }

    case 'UPDATE_EVENT': {
      return updateActiveProject(state, (project) => ({
        ...project,
        events: project.events.map((event) =>
          event.id === action.payload.id
            ? { ...event, ...action.payload.updates }
            : event
        ),
      }));
    }

    case 'DELETE_EVENT': {
      return updateActiveProject(state, (project) => ({
        ...project,
        events: project.events.filter((event) => event.id !== action.payload),
      }));
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
  isHydrated: boolean;
  isSyncing: boolean;
  syncError: string | null;
  // Convenience getters for active project
  activeProject: Project | null;
  cards: KanbanCard[];
  todos: TodoItem[];
  notes: string;
  events: CalendarEvent[];
  activities: ActivityEntry[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasHydrated = useRef(false);
  const previousStateRef = useRef<AppState>(initialState);

  // Handle realtime updates from other devices
  const handleRealtimeUpdate = useCallback((newState: AppState) => {
    // Preserve current activeProjectId if the project still exists
    const activeId = state.activeProjectId;
    const projectExists = newState.projects.some(p => p.id === activeId);

    dispatch({
      type: 'HYDRATE',
      payload: {
        ...newState,
        activeProjectId: projectExists ? activeId : newState.activeProjectId,
      },
    });
  }, [state.activeProjectId]);

  // Set up realtime subscriptions
  useRealtimeSync(user?.id || null, handleRealtimeUpdate);

  // Helper to load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      // Try to load new format first
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'HYDRATE', payload: parsed });
        return parsed;
      } else {
        // Try to migrate from old format
        const oldStored = localStorage.getItem(OLD_STORAGE_KEY);

        if (oldStored) {
          const oldData = JSON.parse(oldStored);
          // Migrate old data to new format
          const migratedProject: Project = {
            id: generateId(),
            name: 'My Project',
            cards: oldData.cards || [],
            todos: oldData.todos || [],
            notes: oldData.notes || '',
            events: [],
            activities: [],
            createdAt: Date.now(),
            color: PROJECT_COLORS[0],
          };

          const migratedState: AppState = {
            projects: [migratedProject],
            activeProjectId: migratedProject.id,
          };

          dispatch({ type: 'HYDRATE', payload: migratedState });
          localStorage.removeItem(OLD_STORAGE_KEY);
          return migratedState;
        } else {
          // Fresh start - create default project
          const defaultProject = createDefaultProject('My Project');
          const freshState: AppState = {
            projects: [defaultProject],
            activeProjectId: defaultProject.id,
          };
          dispatch({ type: 'HYDRATE', payload: freshState });
          return freshState;
        }
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
      // Create default project on error
      const defaultProject = createDefaultProject('My Project');
      const freshState: AppState = {
        projects: [defaultProject],
        activeProjectId: defaultProject.id,
      };
      dispatch({ type: 'HYDRATE', payload: freshState });
      return freshState;
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (hasHydrated.current || authLoading) return;

    const loadData = async () => {
      if (user) {
        // User is authenticated - load from Supabase
        try {
          setIsSyncing(true);
          setSyncError(null);
          const serverState = await fetchUserData(user.id);

          // Check if there's localStorage data to migrate
          const localData = localStorage.getItem(STORAGE_KEY);
          if (localData && serverState.projects.length === 0) {
            // Migrate localStorage data to Supabase
            const parsedLocalData = JSON.parse(localData);
            await migrateLocalStorageToSupabase(user.id, parsedLocalData);
            const migratedState = await fetchUserData(user.id);
            dispatch({ type: 'HYDRATE', payload: migratedState });
            localStorage.removeItem(STORAGE_KEY);
            previousStateRef.current = migratedState;
          } else if (serverState.projects.length === 0) {
            // No data anywhere - create default project
            const defaultProject = createDefaultProject('My Project');
            await dbCreateProject(user.id, defaultProject);
            const newState = { projects: [defaultProject], activeProjectId: defaultProject.id };
            dispatch({ type: 'HYDRATE', payload: newState });
            previousStateRef.current = newState;
          } else {
            dispatch({ type: 'HYDRATE', payload: serverState });
            previousStateRef.current = serverState;
          }
        } catch (error) {
          console.error('Failed to load data from Supabase:', error);
          setSyncError('Failed to sync with server. Working offline.');
          // Fall back to localStorage
          const localState = loadFromLocalStorage();
          previousStateRef.current = localState;
        } finally {
          setIsSyncing(false);
        }
      } else {
        // No user - use localStorage only
        const localState = loadFromLocalStorage();
        previousStateRef.current = localState;
      }

      hasHydrated.current = true;
      queueMicrotask(() => setIsHydrated(true));
    };

    loadData();
  }, [user, authLoading, loadFromLocalStorage]);

  // Sync changes to Supabase (and localStorage as backup)
  useEffect(() => {
    if (!isHydrated) return;

    // Always save to localStorage as backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // If user is authenticated, sync to Supabase
    if (user && previousStateRef.current !== state) {
      syncToSupabase(user.id, previousStateRef.current, state);
    }

    previousStateRef.current = state;
  }, [state, isHydrated, user]);

  // Compute convenience values
  const activeProject = state.activeProjectId
    ? state.projects.find((p) => p.id === state.activeProjectId) || null
    : null;

  const contextValue: AppContextType = {
    state,
    dispatch,
    isHydrated,
    isSyncing,
    syncError,
    activeProject,
    cards: activeProject?.cards || [],
    todos: activeProject?.todos || [],
    notes: activeProject?.notes || '',
    events: activeProject?.events || [],
    activities: activeProject?.activities || [],
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
