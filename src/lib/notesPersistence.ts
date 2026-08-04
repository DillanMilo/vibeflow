import type { AppState } from '@/types';

const NOTES_DRAFT_PREFIX = 'vibeflow-notes-draft:';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type StoredNotesDraft = {
  value: string;
  updatedAt: number;
};

export type NotesAuthority = {
  value: string;
  pending: boolean;
  protectUntil: number;
};

export function createNotesSaveQueue(
  persist: (projectId: string, notes: string) => Promise<void>
) {
  let tail: Promise<void> = Promise.resolve();

  return (projectId: string, notes: string): Promise<void> => {
    const save = tail
      .catch(() => undefined)
      .then(() => persist(projectId, notes));

    tail = save.catch(() => undefined);
    return save;
  };
}

export function mergeAuthoritativeNotes(
  incoming: AppState,
  authorities: Map<string, NotesAuthority>,
  now: number = Date.now()
): AppState {
  let changed = false;
  const projects = incoming.projects.map((project) => {
    const authority = authorities.get(project.id);
    if (!authority) return project;

    if (!authority.pending && project.notes === authority.value) {
      authorities.delete(project.id);
      return project;
    }

    if (!authority.pending && authority.protectUntil <= now) {
      authorities.delete(project.id);
      return project;
    }

    if (project.notes === authority.value) return project;
    changed = true;
    return { ...project, notes: authority.value };
  });

  return changed ? { ...incoming, projects } : incoming;
}

export function readStoredNotesDraft(
  projectId: string,
  storage: StorageLike
): StoredNotesDraft | null {
  try {
    const raw = storage.getItem(`${NOTES_DRAFT_PREFIX}${projectId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredNotesDraft>;
    if (typeof parsed.value !== 'string' || typeof parsed.updatedAt !== 'number') {
      return null;
    }
    return { value: parsed.value, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export function storeNotesDraft(
  projectId: string,
  value: string,
  storage: StorageLike
): void {
  try {
    storage.setItem(
      `${NOTES_DRAFT_PREFIX}${projectId}`,
      JSON.stringify({ value, updatedAt: Date.now() } satisfies StoredNotesDraft)
    );
  } catch {
    // The in-memory draft remains authoritative if browser storage is unavailable.
  }
}

export function clearStoredNotesDraft(projectId: string, storage: StorageLike): void {
  try {
    storage.removeItem(`${NOTES_DRAFT_PREFIX}${projectId}`);
  } catch {
    // A stale backup is safer than deleting an unsaved draft incorrectly.
  }
}
