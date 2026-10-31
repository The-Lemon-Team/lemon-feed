import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { feedApi } from '../api/client';
import { queryKeys } from '../api/queries';
import { Note } from '@lenta/shared';

export interface UseLiveNoteSubscriptionOptions {
  enabled?: boolean;
  intervalMs?: number;
  onUpdate?: (updatedNote: Note) => void;
}

/**
 * Subscribes to realtime updates for an open note (e.g. while FeedDetailModal or FeedEditNoteModal is open).
 * Uses short live-polling while open (default 2500ms) and cleans up / unsubscribes immediately when closed.
 * Automatically synchronizes incoming updates (such as newly generated AI covers or remote DriveBus changes)
 * with the React Query cache and open modal state.
 */
export function useLiveNoteSubscription(
  noteId: string | null | undefined,
  options: UseLiveNoteSubscriptionOptions = {}
) {
  const { enabled = true, intervalMs = 2500, onUpdate } = options;
  const queryClient = useQueryClient();
  const lastUpdatedAtRef = useRef<string | null>(null);

  const isSubscribed = Boolean(noteId && enabled);

  const query = useQuery({
    queryKey: ['feed', 'note-live-subscription', noteId],
    queryFn: async () => {
      if (!noteId) return null;
      return await feedApi.getNoteById(noteId);
    },
    enabled: isSubscribed,
    refetchInterval: isSubscribed ? intervalMs : false,
    refetchIntervalInBackground: false,
    staleTime: 1000,
  });

  useEffect(() => {
    if (!query.data) return;
    const note = query.data;

    // Detect if note was modified or has new images/cover
    const currentUpdated = note.updatedAt ? new Date(note.updatedAt).toISOString() : null;
    if (lastUpdatedAtRef.current && currentUpdated && currentUpdated !== lastUpdatedAtRef.current) {
      // Invalidate detail and list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.noteDetail(note.id) });
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      if (onUpdate) {
        onUpdate(note);
      }
    }
    lastUpdatedAtRef.current = currentUpdated;
  }, [query.data, queryClient, onUpdate]);

  // Reset watermark when noteId changes
  useEffect(() => {
    lastUpdatedAtRef.current = null;
  }, [noteId]);

  return query;
}
