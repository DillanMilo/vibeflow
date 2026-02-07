import { getSupabaseClient } from './client';
import type { AppState, Project, KanbanCard, TodoItem, KanbanStatus } from '@/types';
import type { Database } from '@/types/supabase';

type DbProject = Database['public']['Tables']['projects']['Row'];
type DbCard = Database['public']['Tables']['kanban_cards']['Row'];
type DbTodo = Database['public']['Tables']['todo_items']['Row'];

// =====================
// DATA TRANSFORMERS
// =====================

function dbProjectToProject(dbProject: DbProject, cards: DbCard[], todos: DbTodo[]): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    notes: dbProject.notes,
    color: dbProject.color,
    createdAt: dbProject.created_at,
    cards: cards
      .filter(c => c.project_id === dbProject.id)
      .sort((a, b) => a.position - b.position)
      .map(dbCardToCard),
    todos: todos
      .filter(t => t.project_id === dbProject.id)
      .sort((a, b) => a.position - b.position)
      .map(dbTodoToTodo),
    events: [],
    activities: [],
  };
}

function dbCardToCard(dbCard: DbCard): KanbanCard {
  return {
    id: dbCard.id,
    title: dbCard.title,
    description: dbCard.description ?? undefined,
    status: dbCard.status as KanbanStatus,
    createdAt: dbCard.created_at,
  };
}

function dbTodoToTodo(dbTodo: DbTodo): TodoItem {
  return {
    id: dbTodo.id,
    text: dbTodo.text,
    completed: dbTodo.completed,
  };
}

// =====================
// FETCH ALL DATA
// =====================

export async function fetchUserData(userId: string): Promise<AppState> {
  const supabase = getSupabaseClient();

  const [projectsResult, cardsResult, todosResult] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('kanban_cards').select('*').eq('user_id', userId),
    supabase.from('todo_items').select('*').eq('user_id', userId),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (cardsResult.error) throw cardsResult.error;
  if (todosResult.error) throw todosResult.error;

  const projects = (projectsResult.data || []).map(p =>
    dbProjectToProject(p, cardsResult.data || [], todosResult.data || [])
  );

  return {
    projects,
    activeProjectId: projects[0]?.id || null,
  };
}

// =====================
// CRUD OPERATIONS
// =====================

export async function createProject(userId: string, project: Project): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('projects').insert({
    id: project.id,
    user_id: userId,
    name: project.name,
    notes: project.notes,
    color: project.color || '#e5a54b',
    created_at: project.createdAt,
  });

  if (error) throw error;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'color' | 'notes'>>
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);

  if (error) throw error;
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Cards and todos will cascade delete due to FK constraint
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}

export async function createCard(
  userId: string,
  projectId: string,
  card: KanbanCard,
  position: number
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('kanban_cards').insert({
    id: card.id,
    project_id: projectId,
    user_id: userId,
    title: card.title,
    description: card.description || null,
    status: card.status,
    position,
    created_at: card.createdAt,
  });

  if (error) throw error;
}

export async function updateCard(
  cardId: string,
  updates: Partial<Omit<KanbanCard, 'id' | 'createdAt'>> & { position?: number }
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('kanban_cards')
    .update(updates)
    .eq('id', cardId);

  if (error) throw error;
}

export async function deleteCard(cardId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('kanban_cards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
}

export async function createTodo(
  userId: string,
  projectId: string,
  todo: TodoItem,
  position: number
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('todo_items').insert({
    id: todo.id,
    project_id: projectId,
    user_id: userId,
    text: todo.text,
    completed: todo.completed,
    position,
  });

  if (error) throw error;
}

export async function updateTodo(
  todoId: string,
  updates: Partial<Omit<TodoItem, 'id'>>
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('todo_items')
    .update(updates)
    .eq('id', todoId);

  if (error) throw error;
}

export async function deleteTodo(todoId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('todo_items')
    .delete()
    .eq('id', todoId);

  if (error) throw error;
}

// =====================
// BATCH UPDATE POSITIONS
// =====================

export async function updateCardPositions(
  cards: Array<{ id: string; position: number; status?: string }>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Use Promise.all for parallel updates
  const updates = cards.map(({ id, position, status }) =>
    supabase
      .from('kanban_cards')
      .update({ position, ...(status && { status }) })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const error = results.find(r => r.error)?.error;
  if (error) throw error;
}

// =====================
// MIGRATION HELPER
// =====================

export async function migrateLocalStorageToSupabase(
  userId: string,
  localState: AppState
): Promise<void> {
  for (const project of localState.projects) {
    await createProject(userId, project);

    for (let i = 0; i < project.cards.length; i++) {
      await createCard(userId, project.id, project.cards[i], i);
    }

    for (let i = 0; i < project.todos.length; i++) {
      await createTodo(userId, project.id, project.todos[i], i);
    }
  }
}

// =====================
// SYNC STATE CHANGES
// =====================

export async function syncToSupabase(
  userId: string,
  prev: AppState,
  curr: AppState
): Promise<void> {
  try {
    // Detect and sync project changes
    const prevProjectIds = new Set(prev.projects.map(p => p.id));
    const currProjectIds = new Set(curr.projects.map(p => p.id));

    // New projects
    for (const project of curr.projects) {
      if (!prevProjectIds.has(project.id)) {
        await createProject(userId, project);
        // Also create all cards and todos for new project
        for (let i = 0; i < project.cards.length; i++) {
          await createCard(userId, project.id, project.cards[i], i);
        }
        for (let i = 0; i < project.todos.length; i++) {
          await createTodo(userId, project.id, project.todos[i], i);
        }
      }
    }

    // Deleted projects
    for (const prevProject of prev.projects) {
      if (!currProjectIds.has(prevProject.id)) {
        await deleteProject(prevProject.id);
      }
    }

    // Updated projects (name, color, notes)
    for (const currProject of curr.projects) {
      const prevProject = prev.projects.find(p => p.id === currProject.id);
      if (prevProject) {
        if (
          prevProject.name !== currProject.name ||
          prevProject.color !== currProject.color ||
          prevProject.notes !== currProject.notes
        ) {
          await updateProject(currProject.id, {
            name: currProject.name,
            color: currProject.color,
            notes: currProject.notes,
          });
        }

        // Sync cards within project
        await syncCards(userId, currProject.id, prevProject.cards, currProject.cards);

        // Sync todos within project
        await syncTodos(userId, currProject.id, prevProject.todos, currProject.todos);
      }
    }
  } catch (error) {
    console.error('Failed to sync to Supabase:', error);
  }
}

async function syncCards(
  userId: string,
  projectId: string,
  prevCards: KanbanCard[],
  currCards: KanbanCard[]
): Promise<void> {
  const prevCardIds = new Set(prevCards.map(c => c.id));
  const currCardIds = new Set(currCards.map(c => c.id));

  // New cards
  for (let i = 0; i < currCards.length; i++) {
    const card = currCards[i];
    if (!prevCardIds.has(card.id)) {
      await createCard(userId, projectId, card, i);
    }
  }

  // Deleted cards
  for (const prevCard of prevCards) {
    if (!currCardIds.has(prevCard.id)) {
      await deleteCard(prevCard.id);
    }
  }

  // Updated cards
  const positionUpdates: Array<{ id: string; position: number; status?: string }> = [];

  for (let i = 0; i < currCards.length; i++) {
    const currCard = currCards[i];
    const prevCard = prevCards.find(c => c.id === currCard.id);
    const prevIndex = prevCards.findIndex(c => c.id === currCard.id);

    if (prevCard) {
      const hasContentChange =
        prevCard.title !== currCard.title ||
        prevCard.description !== currCard.description;
      const hasStatusChange = prevCard.status !== currCard.status;
      const hasPositionChange = prevIndex !== i;

      if (hasContentChange) {
        await updateCard(currCard.id, {
          title: currCard.title,
          description: currCard.description,
        });
      }

      if (hasStatusChange || hasPositionChange) {
        positionUpdates.push({
          id: currCard.id,
          position: i,
          ...(hasStatusChange && { status: currCard.status }),
        });
      }
    }
  }

  if (positionUpdates.length > 0) {
    await updateCardPositions(positionUpdates);
  }
}

async function syncTodos(
  userId: string,
  projectId: string,
  prevTodos: TodoItem[],
  currTodos: TodoItem[]
): Promise<void> {
  const prevTodoIds = new Set(prevTodos.map(t => t.id));
  const currTodoIds = new Set(currTodos.map(t => t.id));

  // New todos
  for (let i = 0; i < currTodos.length; i++) {
    const todo = currTodos[i];
    if (!prevTodoIds.has(todo.id)) {
      await createTodo(userId, projectId, todo, i);
    }
  }

  // Deleted todos
  for (const prevTodo of prevTodos) {
    if (!currTodoIds.has(prevTodo.id)) {
      await deleteTodo(prevTodo.id);
    }
  }

  // Updated todos
  for (const currTodo of currTodos) {
    const prevTodo = prevTodos.find(t => t.id === currTodo.id);
    if (prevTodo && prevTodo.completed !== currTodo.completed) {
      await updateTodo(currTodo.id, { completed: currTodo.completed });
    }
  }
}
