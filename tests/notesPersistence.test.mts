import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNotesSaveQueue,
  clearStoredNotesDraft,
  mergeAuthoritativeNotes,
  readStoredNotesDraft,
  storeNotesDraft,
  type NotesAuthority,
} from '../src/lib/notesPersistence.ts';
import type { AppState, Project } from '../src/types/index.ts';

function makeState(notes: string): AppState {
  const project: Project = {
    id: 'project-1',
    name: 'Project',
    notes,
    color: '#fff',
    cards: [],
    todos: [],
    todoCategories: [],
    events: [],
    activities: [],
    createdAt: 1,
  };
  return { projects: [project], activeProjectId: project.id };
}

test('serializes note writes in the order they were requested', async () => {
  const events: string[] = [];
  let releaseFirst!: () => void;
  const firstBlocked = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const save = createNotesSaveQueue(async (_projectId, notes) => {
    events.push(`start:${notes}`);
    if (notes === 'first') await firstBlocked;
    events.push(`finish:${notes}`);
  });

  const first = save('project-1', 'first');
  const second = save('project-1', 'second');
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ['start:first']);

  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, [
    'start:first',
    'finish:first',
    'start:second',
    'finish:second',
  ]);
});

test('continues with the newest note after an earlier save fails', async () => {
  const saved: string[] = [];
  const save = createNotesSaveQueue(async (_projectId, notes) => {
    if (notes === 'first') throw new Error('offline');
    saved.push(notes);
  });

  await assert.rejects(save('project-1', 'first'));
  await save('project-1', 'second');
  assert.deepEqual(saved, ['second']);
});

test('keeps a pending local note authoritative over a stale realtime snapshot', () => {
  const authorities = new Map<string, NotesAuthority>([
    ['project-1', { value: 'local draft', pending: true, protectUntil: Infinity }],
  ]);

  const merged = mergeAuthoritativeNotes(makeState('old server value'), authorities, 100);
  assert.equal(merged.projects[0].notes, 'local draft');
  assert.equal(authorities.has('project-1'), true);
});

test('releases local authority after realtime confirms the saved value', () => {
  const authorities = new Map<string, NotesAuthority>([
    ['project-1', { value: 'saved value', pending: false, protectUntil: 1_000 }],
  ]);

  const merged = mergeAuthoritativeNotes(makeState('saved value'), authorities, 100);
  assert.equal(merged.projects[0].notes, 'saved value');
  assert.equal(authorities.has('project-1'), false);
});

test('keeps a durable per-project draft until it is explicitly cleared', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };

  storeNotesDraft('project-1', 'cannot be lost', storage);
  assert.equal(readStoredNotesDraft('project-1', storage)?.value, 'cannot be lost');

  clearStoredNotesDraft('project-1', storage);
  assert.equal(readStoredNotesDraft('project-1', storage), null);
});
