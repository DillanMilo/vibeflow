'use client';

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

type NotesDraft = {
  projectId: string | null;
  value: string;
};

type PendingCommit = NotesDraft & {
  ignoreExternalUntil: number;
};

export function NotesArea() {
  const { activeProject, notes, dispatch } = useApp();
  const projectId = activeProject?.id ?? null;
  const [isSaved, setIsSaved] = useState(true);
  const [savedLength, setSavedLength] = useState(notes.length);
  const draftRef = useRef<NotesDraft>({ projectId, value: notes });
  const isDirtyRef = useRef(false);
  const lastCommittedRef = useRef<PendingCommit | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const clearSaveTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const commitDraft = useCallback((nextDraft: NotesDraft) => {
    const targetProjectId = nextDraft.projectId;
    if (!targetProjectId) return;

    clearSaveTimeout();
    lastCommittedRef.current = {
      ...nextDraft,
      // Realtime can briefly return the previous server value while our write
      // is still settling. Keep the local draft authoritative during that gap.
      ignoreExternalUntil: Date.now() + 5_000,
    };

    if (
      draftRef.current.projectId === nextDraft.projectId &&
      draftRef.current.value === nextDraft.value
    ) {
      isDirtyRef.current = false;
      setSavedLength(nextDraft.value.length);
      setIsSaved(true);
    }

    // The textarea owns the urgent typing state. Updating the project and
    // starting persistence can happen at lower priority after the user pauses.
    startTransition(() => {
      dispatch({
        type: 'SET_NOTES',
        payload: { projectId: targetProjectId, notes: nextDraft.value },
      });
    });
  }, [clearSaveTimeout, dispatch]);

  // Reset the draft when switching projects. For same-project updates, ignore
  // the server echo of our own save and never replace text that is still being
  // edited locally.
  useEffect(() => {
    const currentDraft = draftRef.current;

    if (currentDraft.projectId !== projectId) {
      clearSaveTimeout();

      const previousProjectId = currentDraft.projectId;
      if (isDirtyRef.current && previousProjectId) {
        startTransition(() => {
          dispatch({
            type: 'SET_NOTES',
            payload: {
              projectId: previousProjectId,
              notes: currentDraft.value,
            },
          });
        });
      }

      const nextDraft = { projectId, value: notes };
      draftRef.current = nextDraft;
      isDirtyRef.current = false;
      lastCommittedRef.current = null;
      queueMicrotask(() => {
        setSavedLength(notes.length);
        setIsSaved(true);
      });
      return;
    }

    if (isDirtyRef.current) return;

    const lastCommitted = lastCommittedRef.current;
    if (lastCommitted?.projectId === projectId) {
      if (Date.now() < lastCommitted.ignoreExternalUntil) {
        return;
      }
      lastCommittedRef.current = null;
    }

    if (currentDraft.value !== notes) {
      const nextDraft = { projectId, value: notes };
      draftRef.current = nextDraft;
      if (textareaRef.current && document.activeElement !== textareaRef.current) {
        textareaRef.current.value = notes;
        queueMicrotask(() => setSavedLength(notes.length));
      }
    }
  }, [clearSaveTimeout, dispatch, notes, projectId]);

  const handleChange = (value: string) => {
    const nextDraft = { projectId, value };
    draftRef.current = nextDraft;
    isDirtyRef.current = true;
    setIsSaved(false);

    clearSaveTimeout();
    timeoutRef.current = setTimeout(() => {
      commitDraft(nextDraft);
    }, 500);
  };

  const handleBlur = () => {
    if (isDirtyRef.current) {
      commitDraft(draftRef.current);
    } else if (draftRef.current.value !== notes && textareaRef.current) {
      const nextDraft = { projectId, value: notes };
      draftRef.current = nextDraft;
      textareaRef.current.value = notes;
      setSavedLength(notes.length);
    }
  };

  // Flush a pending draft when the Notes panel is closed.
  useEffect(() => {
    return () => {
      clearSaveTimeout();
      const pendingDraft = draftRef.current;
      if (isDirtyRef.current && pendingDraft.projectId) {
        dispatch({
          type: 'SET_NOTES',
          payload: {
            projectId: pendingDraft.projectId,
            notes: pendingDraft.value,
          },
        });
      }
    };
  }, [clearSaveTimeout, dispatch]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-sm font-semibold text-text-primary tracking-wide">
          Notes
        </h2>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 md:w-1.5 md:h-1.5 rounded-full transition-all duration-300',
              isSaved ? 'bg-success' : 'bg-accent animate-pulse'
            )}
          />
          <span className="text-xs text-text-dim">
            {isSaved ? 'Saved' : 'Saving...'}
          </span>
        </div>
      </div>

      {/* Notes textarea */}
      <div className="relative flex-1 min-h-0">
        <textarea
          key={projectId ?? 'no-project'}
          ref={textareaRef}
          defaultValue={notes}
          onChange={(e) => handleChange(e.target.value)}
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

        {/* Character count hint */}
        {savedLength > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-text-dim/50">
            {savedLength.toLocaleString()} chars
          </div>
        )}
      </div>

      {/* Quick formatting hint */}
      <div className="mt-3 flex items-center gap-2 text-xs text-text-dim/60">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Auto-saved locally</span>
      </div>
    </div>
  );
}
