import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, getFeedAppMode, getFeedAuthToken } from '../api/client';

export interface LiveNoteEvent {
  id: string;
  type: 'NOTE_CREATED' | 'NOTE_UPDATED' | 'NOTE_DELETED';
  noteId: string;
  title: string;
  feedId?: string | null;
  feedSlug?: string | null;
  feedTitle?: string | null;
  feedIcon?: string | null;
  feedColor?: string | null;
  privacy: 'public' | 'private';
  status: string;
  publishedAt?: string | null;
  timestamp: number;
}

export interface ChannelUpdateGroup {
  feedSlug: string;
  feedTitle: string;
  feedIcon: string;
  feedColor: string;
  count: number;
  notes: Array<{ noteId: string; title: string }>;
}

export function useFeedLiveEvents() {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<LiveNoteEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if EventSource is supported
    if (typeof EventSource === 'undefined') {
      return;
    }

    const appMode = getFeedAppMode();
    const token = getFeedAuthToken();
    const query = new URLSearchParams();
    if (appMode !== 'public' && token) {
      query.set('token', token);
    }

    const base = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace(/\/$/, '') : '';
    const sseUrl = `${base}/events/stream${query.toString() ? `?${query.toString()}` : ''}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('note', (e: MessageEvent) => {
        try {
          const parsed: LiveNoteEvent = JSON.parse(e.data);
          if (parsed && parsed.noteId) {
            setEvents((prev) => {
              if (prev.some((item) => item.id === parsed.id || item.noteId === parsed.noteId)) {
                return prev;
              }
              return [parsed, ...prev];
            });
          }
        } catch {
          // ignore malformed data
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Group events by channel / feed
  const groupedChannels: ChannelUpdateGroup[] = useMemo(() => {
    const groups = new Map<string, ChannelUpdateGroup>();

    for (const evt of events) {
      const slug = evt.feedSlug || 'general';
      const title = evt.feedTitle || (slug === 'general' ? 'Общая лента' : slug);
      const icon = evt.feedIcon || '📁';
      const color = evt.feedColor || '#6366f1';

      const existing = groups.get(slug);
      if (existing) {
        existing.count += 1;
        existing.notes.push({ noteId: evt.noteId, title: evt.title });
      } else {
        groups.set(slug, {
          feedSlug: slug,
          feedTitle: title,
          feedIcon: icon,
          feedColor: color,
          count: 1,
          notes: [{ noteId: evt.noteId, title: evt.title }],
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [events]);

  const applyUpdates = useCallback(() => {
    setEvents([]);
    queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
    queryClient.invalidateQueries({ queryKey: ['feed', 'sources'] });
    queryClient.invalidateQueries({ queryKey: ['feed', 'periods'] });
  }, [queryClient]);

  const dismissUpdates = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    newEventsCount: events.length,
    groupedChannels,
    applyUpdates,
    dismissUpdates,
    isConnected,
  };
}
