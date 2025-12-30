'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function NotesArea() {
  const { notes, dispatch } = useApp();
  const [localNotes, setLocalNotes] = useState(notes);
  const [isSaved, setIsSaved] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when hydrated state changes
  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    queueMicrotask(() => setLocalNotes(notes));
  }, [notes]);

  const handleChange = (value: string) => {
    setLocalNotes(value);
    setIsSaved(false);

    // Debounce save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      dispatch({ type: 'SET_NOTES', payload: value });
      setIsSaved(true);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
          value={localNotes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Jot down ideas, notes, or anything on your mind..."
          className={cn(
            'w-full h-full bg-surface border border-border rounded-xl p-3 md:p-4',
            'text-sm text-text-primary placeholder:text-text-dim',
            'resize-none focus:outline-none',
            'focus:border-border-accent focus:ring-1 focus:ring-accent/20',
            'transition-all duration-200',
            'leading-relaxed'
          )}
        />

        {/* Character count hint */}
        {localNotes.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-text-dim/50">
            {localNotes.length.toLocaleString()} chars
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
