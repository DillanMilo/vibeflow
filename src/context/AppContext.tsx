'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react';
import { generateId } from '@/lib/utils';
import type { AppState, KanbanCard, KanbanStatus, TodoItem, Id } from '@/types';

const STORAGE_KEY = 'vibeflow-data';

type Action =
  | { type: 'ADD_CARD'; payload: { title: string; description?: string; status: KanbanStatus } }
  | { type: 'UPDATE_CARD'; payload: { id: Id; updates: Partial<KanbanCard> } }
  | { type: 'DELETE_CARD'; payload: Id }
  | { type: 'MOVE_CARD'; payload: { id: Id; status: KanbanStatus; newIndex?: number } }
  | { type: 'REORDER_CARDS'; payload: { status: KanbanStatus; cardIds: Id[] } }
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: Id }
  | { type: 'DELETE_TODO'; payload: Id }
  | { type: 'PROMOTE_TODO'; payload: Id }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'HYDRATE'; payload: AppState };

const initialState: AppState = {
  cards: [],
  todos: [],
  notes: '',
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE': {
      return action.payload;
    }

    case 'ADD_CARD': {
      const newCard: KanbanCard = {
        id: generateId(),
        title: action.payload.title,
        description: action.payload.description,
        status: action.payload.status,
        createdAt: Date.now(),
      };
      return { ...state, cards: [...state.cards, newCard] };
    }

    case 'UPDATE_CARD': {
      return {
        ...state,
        cards: state.cards.map((card) =>
          card.id === action.payload.id
            ? { ...card, ...action.payload.updates }
            : card
        ),
      };
    }

    case 'DELETE_CARD': {
      return {
        ...state,
        cards: state.cards.filter((card) => card.id !== action.payload),
      };
    }

    case 'MOVE_CARD': {
      const { id, status, newIndex } = action.payload;
      const cardToMove = state.cards.find((c) => c.id === id);
      if (!cardToMove) return state;

      const otherCards = state.cards.filter((c) => c.id !== id);
      const updatedCard = { ...cardToMove, status };

      if (newIndex !== undefined) {
        const cardsInTargetColumn = otherCards.filter((c) => c.status === status);
        const cardsNotInTarget = otherCards.filter((c) => c.status !== status);
        cardsInTargetColumn.splice(newIndex, 0, updatedCard);
        return { ...state, cards: [...cardsNotInTarget, ...cardsInTargetColumn] };
      }

      return { ...state, cards: [...otherCards, updatedCard] };
    }

    case 'REORDER_CARDS': {
      const { status, cardIds } = action.payload;
      const cardsInColumn = cardIds
        .map((id) => state.cards.find((c) => c.id === id))
        .filter((c): c is KanbanCard => c !== undefined);
      const otherCards = state.cards.filter((c) => c.status !== status);
      return { ...state, cards: [...otherCards, ...cardsInColumn] };
    }

    case 'ADD_TODO': {
      const newTodo: TodoItem = {
        id: generateId(),
        text: action.payload,
        completed: false,
      };
      return { ...state, todos: [...state.todos, newTodo] };
    }

    case 'TOGGLE_TODO': {
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    }

    case 'DELETE_TODO': {
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };
    }

    case 'PROMOTE_TODO': {
      const todo = state.todos.find((t) => t.id === action.payload);
      if (!todo) return state;

      const newCard: KanbanCard = {
        id: generateId(),
        title: todo.text,
        status: 'todo',
        createdAt: Date.now(),
      };

      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
        cards: [...state.cards, newCard],
      };
    }

    case 'SET_NOTES': {
      return { ...state, notes: action.payload };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
  isHydrated: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasHydrated = useRef(false);

  // Load from localStorage on mount (once only)
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'HYDRATE', payload: parsed });
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage on state changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [state, isHydrated]);

  return (
    <AppContext.Provider value={{ state, dispatch, isHydrated }}>
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
