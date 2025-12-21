'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

export function NotesArea() {
  const { state, dispatch } = useApp();
  const [localNotes, setLocalNotes] = useState(state.notes);
  const [isSaved, setIsSaved] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when hydrated state changes
  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    queueMicrotask(() => setLocalNotes(state.notes));
  }, [state.notes]);

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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Notes</h2>
        <span className="text-xs text-text-muted">
          {isSaved ? 'Saved' : 'Saving...'}
        </span>
      </div>

      <textarea
        value={localNotes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write your notes here..."
        className="flex-1 w-full bg-surface border border-border rounded p-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-text-muted transition-colors"
      />
    </div>
  );
}
