'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { fetchUserData } from '@/lib/supabase/sync';
import type { AppState } from '@/types';

type ChangeHandler = (newState: AppState) => void;

export function useRealtimeSync(
  userId: string | null,
  onDataChange: ChangeHandler
) {
  const supabase = getSupabaseClient();
  const isRefetchingRef = useRef(false);

  // Debounced refetch to handle multiple rapid changes
  const refetchData = useCallback(async () => {
    if (!userId || isRefetchingRef.current) return;

    isRefetchingRef.current = true;

    try {
      const newState = await fetchUserData(userId);
      onDataChange(newState);
    } catch (error) {
      console.error('Error refetching data:', error);
    } finally {
      // Small delay before allowing next refetch
      setTimeout(() => {
        isRefetchingRef.current = false;
      }, 100);
    }
  }, [userId, onDataChange]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to all relevant tables
    const channel = supabase
      .channel(`user-${userId}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`,
        },
        () => refetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kanban_cards',
          filter: `user_id=eq.${userId}`,
        },
        () => refetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todo_items',
          filter: `user_id=eq.${userId}`,
        },
        () => refetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, refetchData]);
}
