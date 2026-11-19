import { useCallback, useMemo } from 'react';
import { LemonModerationItem } from '@lenta/lemon-bus';
import { useCoreLiveStream } from '../../core';

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

  const sseUrl = useMemo(() => {
    const customUrl = (import.meta as any).env?.VITE_LEMON_BUS_URL;
    const base = customUrl ? customUrl.replace(/\/+$/, '') : '';
    return `${base}/events/stream`;
  }, []);

  const handleCoreEvent = useCallback(
    (_eventName: string, parsed: FeedBusLiveEvent) => {
      onEvent?.(parsed);
    },
    [onEvent]
  );

  return useCoreLiveStream<FeedBusLiveEvent>({
    url: sseUrl,
    enabled: enabled && typeof window !== 'undefined',
    eventNames: ['moderation'],
    onEvent: handleCoreEvent,
  });
}
