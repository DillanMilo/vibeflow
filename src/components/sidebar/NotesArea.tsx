'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  clearStoredNotesDraft,
  readStoredNotesDraft,
  storeNotesDraft,
} from '@/lib/notesPersistence';
import { cn } from '@/lib/utils';

type NotesDraft = {
  projectId: string | null;
  value: string;
};

type SaveStatus = 'saved' | 'saving' | 'error';

export function NotesArea() {
  const { activeProject, notes, saveNotes } = useApp();
  const projectId = activeProject?.id ?? null;
  const [localNotes, setLocalNotes] = useState(notes);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const draftRef = useRef<NotesDraft>({ projectId, value: notes });
  const isDirtyRef = useRef(false);
  const initializedProjectRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const clearSaveTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const commitDraft = useCallback((nextDraft: NotesDraft) => {
    if (!nextDraft.projectId) return;

    clearSaveTimeout();
    const { projectId: targetProjectId, value } = nextDraft;

    void saveNotes(targetProjectId, value).then(
      () => {
        const storedDraft = readStoredNotesDraft(targetProjectId, window.localStorage);
        if (storedDraft?.value === value) {
          clearStoredNotesDraft(targetProjectId, window.localStorage);
        }

        if (
          mountedRef.current &&
          draftRef.current.projectId === targetProjectId &&
          draftRef.current.value === value
        ) {
          isDirtyRef.current = false;
          setSaveStatus('saved');
        }
      },
      () => {
        if (
          mountedRef.current &&
          draftRef.current.projectId === targetProjectId &&
          draftRef.current.value === value
        ) {
          setSaveStatus('error');
        }
      }
    );
  }, [clearSaveTimeout, saveNotes]);

  // A local draft always wins after a refresh or a failed network request.
  // It is retried immediately and only removed after the server confirms it.
  useEffect(() => {
    if (initializedProjectRef.current !== projectId) {
      const previousDraft = draftRef.current;
      if (isDirtyRef.current && previousDraft.projectId) {
        commitDraft(previousDraft);
      }

      clearSaveTimeout();
      initializedProjectRef.current = projectId;

      const storedDraft = projectId
        ? readStoredNotesDraft(projectId, window.localStorage)
        : null;
      const nextValue = storedDraft?.value ?? notes;
      const nextDraft = { projectId, value: nextValue };

      draftRef.current = nextDraft;
      isDirtyRef.current = Boolean(storedDraft && nextValue !== notes);

      queueMicrotask(() => {
        if (initializedProjectRef.current !== projectId) return;
        setLocalNotes(nextValue);
        setSaveStatus(isDirtyRef.current ? 'saving' : 'saved');
      });

      if (isDirtyRef.current) {
        commitDraft(nextDraft);
      } else if (storedDraft && projectId) {
        clearStoredNotesDraft(projectId, window.localStorage);
      }
      return;
    }

    // Realtime data may refresh the project repeatedly. It can update a clean
    // editor, but it must never replace a local draft that is being typed.
    if (
      !isDirtyRef.current &&
      draftRef.current.value !== notes &&
      document.activeElement !== textareaRef.current
    ) {
      draftRef.current = { projectId, value: notes };
      queueMicrotask(() => {
        if (initializedProjectRef.current === projectId && !isDirtyRef.current) {
          setLocalNotes(notes);
        }
      });
    }
  }, [clearSaveTimeout, commitDraft, notes, projectId]);

  const handleChange = (value: string) => {
    const nextDraft = { projectId, value };
    draftRef.current = nextDraft;
    isDirtyRef.current = true;
    setLocalNotes(value);
    setSaveStatus('saving');

    if (projectId) {
      storeNotesDraft(projectId, value, window.localStorage);
    }

    clearSaveTimeout();
    timeoutRef.current = setTimeout(() => commitDraft(nextDraft), 500);
  };

  const handleBlur = () => {
    if (isDirtyRef.current) {
      commitDraft(draftRef.current);
    } else if (draftRef.current.value !== notes) {
      draftRef.current = { projectId, value: notes };
      setLocalNotes(notes);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearSaveTimeout();
      if (isDirtyRef.current && draftRef.current.projectId) {
        void saveNotes(draftRef.current.projectId, draftRef.current.value).catch(() => {
          // The durable local draft remains available for the next mount.
        });
      }
    };
  }, [clearSaveTimeout, saveNotes]);

  const statusLabel = saveStatus === 'saved'
    ? 'Saved'
    : saveStatus === 'error'
      ? 'Saved locally'
      : 'Saving...';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-sm font-semibold text-text-primary tracking-wide">
          Notes
        </h2>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 md:w-1.5 md:h-1.5 rounded-full transition-all duration-300',
              saveStatus === 'saved' && 'bg-success',
              saveStatus === 'saving' && 'bg-accent animate-pulse',
              saveStatus === 'error' && 'bg-amber-500'
            )}
          />
          <span className="text-xs text-text-dim">{statusLabel}</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <textarea
          key={projectId ?? 'no-project'}
          ref={textareaRef}
          value={localNotes}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={handleBlur}
          placeholder="Jot down ideas, notes, or anything on your mind..."
          className={cn(
            'w-full h-full bg-surface border border-border rounded-xl p-4',
            'text-base md:text-sm text-text-primary placeholder:text-text-dim',
            'resize-none focus:outline-none overflow-y-auto',
            'focus:border-border-accent focus:ring-1 focus:ring-accent/20',
            'transition-all duration-200',
            'leading-relaxed'
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        />

        {localNotes.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-text-dim/50">
            {localNotes.length.toLocaleString()} chars
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-text-dim/60">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Auto-saved locally</span>
      </div>
    </div>
  );
}
