import { useEffect } from 'react';
import { LemonModerationItem } from '@lenta/lemon-bus';

export interface FeedBusLiveEvent {
  type: string;
  action?: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'UPDATED' | 'IMPORTED';
  noteId?: string;
  item?: LemonModerationItem;
  importedCount?: number;
  timestamp: string;
}

export interface UseFeedBusLiveSseOptions {
  enabled?: boolean;
  onEvent?: (event: FeedBusLiveEvent) => void;
}

export function useFeedBusLiveSse(options: UseFeedBusLiveSseOptions = {}) {
  const { enabled = true, onEvent } = options;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const customUrl = (import.meta as any).env?.VITE_LEMON_BUS_URL;
    const base = customUrl ? customUrl.replace(/\/+$/, '') : '';
    // Use /events/stream via proxy or direct URL
    const sseUrl = `${base}/events/stream`;

    let es: EventSource | null = null;
    try {
      es = new EventSource(sseUrl);

      es.addEventListener('moderation', (ev: MessageEvent) => {
        try {
          const parsed: FeedBusLiveEvent = JSON.parse(ev.data);
          if (onEvent) {
            onEvent(parsed);
          }
        } catch {
          // Ignore malformed frame
        }
      });

      es.onerror = () => {
        // EventSource will auto-reconnect
      };
    } catch (err) {
      console.warn('[FeedBus] SSE connection error:', err);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [enabled, onEvent]);
}
