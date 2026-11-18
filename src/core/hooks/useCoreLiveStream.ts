import { useEffect, useRef, useState, useCallback } from 'react';

export type LiveStreamStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface UseCoreLiveStreamOptions<TEvent> {
  url: string | null;
  enabled?: boolean;
  eventNames: string[];
  parseEvent?: (eventName: string, rawData: string) => TEvent | null;
  onEvent?: (eventName: string, parsed: TEvent) => void;
  maxBufferedEvents?: number;
}

/**
 * Reusable SSE subscription wrapper for FeedCore.
 * Supports both Notes live updates and Watchers reactive news streams.
 */
export function useCoreLiveStream<TEvent = unknown>({
  url,
  enabled = true,
  eventNames,
  parseEvent,
  onEvent,
  maxBufferedEvents = 200,
}: UseCoreLiveStreamOptions<TEvent>) {
  const [status, setStatus] = useState<LiveStreamStatus>('idle');
  const [pendingEvents, setPendingEvents] = useState<TEvent[]>([]);
  const onEventRef = useRef(onEvent);
  const parseEventRef = useRef(parseEvent);
  onEventRef.current = onEvent;
  parseEventRef.current = parseEvent;

  const eventNamesKey = eventNames.join('|');

  useEffect(() => {
    if (!enabled || !url || typeof EventSource === 'undefined') {
      setStatus('idle');
      return;
    }

    setStatus('connecting');
    const es = new EventSource(url);

    es.onopen = () => {
      setStatus('connected');
    };

    es.onerror = () => {
      setStatus('error');
    };

    const listeners: Array<{ name: string; fn: (ev: MessageEvent) => void }> = [];

    for (const name of eventNames) {
      const fn = (ev: MessageEvent) => {
        try {
          const parsed = parseEventRef.current
            ? parseEventRef.current(name, ev.data)
            : (JSON.parse(ev.data) as TEvent);
          if (!parsed) return;

          if (onEventRef.current) {
            onEventRef.current(name, parsed);
          } else {
            setPendingEvents((prev) => [parsed, ...prev].slice(0, maxBufferedEvents));
          }
        } catch (err) {
          console.warn(`[useCoreLiveStream] Failed to parse SSE event "${name}":`, err);
        }
      };
      es.addEventListener(name, fn);
      listeners.push({ name, fn });
    }

    return () => {
      for (const { name, fn } of listeners) {
        es.removeEventListener(name, fn);
      }
      es.close();
      setStatus('idle');
    };
  }, [url, enabled, eventNamesKey, maxBufferedEvents]);

  const clearPending = useCallback(() => {
    setPendingEvents([]);
  }, []);

  return {
    status,
    pendingEvents,
    pendingCount: pendingEvents.length,
    clearPending,
  };
}
