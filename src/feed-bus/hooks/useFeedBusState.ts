import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LemonModerationItem,
  ModerationStatus,
} from '@lenta/lemon-bus';
import {
  ModerationApiClient,
  ModerationNeuron,
  ModerationNeuronState,
} from '@lenta/seasons-neurons';
import { useCoreFeedSelection } from '../../core';
import { feedBusApi } from '../api/feedBusApi';
import { useFeedBusLiveSse, FeedBusLiveEvent } from './useFeedBusLiveSse';

export function useFeedBusState() {
  const neuronRef = useRef<ModerationNeuron | null>(null);
  if (!neuronRef.current) {
    neuronRef.current = new ModerationNeuron({
      apiClient: feedBusApi as unknown as ModerationApiClient,
      pageSize: 30,
      initialFilter: { status: 'PENDING' },
    });
  }
  const neuron = neuronRef.current;

  const [neuronState, setNeuronState] = useState<ModerationNeuronState>(() => neuron.state);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<ModerationStatus | 'ALL'>('PENDING');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    selectedIds,
    toggleSelect: toggleSelectId,
    selectAll: selectAllByIds,
    clearSelection,
  } = useCoreFeedSelection();

  // Modals state
  const [rejectingItem, setRejectingItem] = useState<LemonModerationItem | null>(null);
  const [editingItem, setEditingItem] = useState<LemonModerationItem | null>(null);

  useEffect(() => {
    const sub = neuron.stateObservable.subscribe((next) => {
      setNeuronState(next);
    });
    return () => sub.unsubscribe();
  }, [neuron]);

  useEffect(() => {
    clearSelection();
    neuron
      .loadInitial({
        status: selectedStatus,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .catch((err) => {
        console.warn('[FeedBus] Failed to fetch items:', err);
      });
  }, [neuron, selectedStatus, selectedCategory, searchQuery, clearSelection]);

  const loadMore = useCallback(() => {
    neuron.loadMore().catch((err) => {
      console.warn('[FeedBus] Failed to load more items:', err);
    });
  }, [neuron]);

  const refresh = useCallback(() => {
    neuron.refresh().catch((err) => {
      console.warn('[FeedBus] Failed to refresh items:', err);
    });
  }, [neuron]);

  // Actions via ModerationNeuron
  const handleApprove = useCallback(
    async (id: string, overrides?: Partial<LemonModerationItem>) => {
      try {
        await neuron.approve(id, overrides, 'curator');
        neuron.refreshStats().catch(() => {});
      } catch (err: any) {
        console.error('[FeedBus] Approve error:', err);
        refresh();
      }
    },
    [neuron, refresh]
  );

  const handleReject = useCallback(
    async (id: string, reason?: string) => {
      try {
        await neuron.reject(id, reason, 'curator');
        setRejectingItem(null);
        neuron.refreshStats().catch(() => {});
      } catch (err: any) {
        console.error('[FeedBus] Reject error:', err);
        refresh();
      }
    },
    [neuron, refresh]
  );

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<LemonModerationItem>) => {
      try {
        await neuron.updateItem(id, patch);
        setEditingItem(null);
      } catch (err: any) {
        console.error('[FeedBus] Update error:', err);
      }
    },
    [neuron]
  );

  const handleBatchApprove = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      clearSelection();
      await neuron.batchApprove(ids, 'curator');
    } catch (err: any) {
      console.error('[FeedBus] Batch approve error:', err);
      refresh();
    }
  }, [neuron, selectedIds, clearSelection, refresh]);

  const handleBatchReject = useCallback(
    async (reason?: string) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      try {
        clearSelection();
        await neuron.batchReject(ids, reason, 'curator');
      } catch (err: any) {
        console.error('[FeedBus] Batch reject error:', err);
        refresh();
      }
    },
    [neuron, selectedIds, clearSelection, refresh]
  );

  const handleImportWatchers = useCallback(
    async (limit = 100) => {
      try {
        const res = await neuron.importWatcherItems(limit);
        if (res.imported === 0) {
          await neuron.refresh();
        }
      } catch (err: any) {
        console.error('[FeedBus] Import watchers error:', err);
      }
    },
    [neuron]
  );

  const selectAll = useCallback(() => {
    selectAllByIds(neuronState.items.map((i) => i.id));
  }, [selectAllByIds, neuronState.items]);

  // Live SSE listener routed directly into ModerationNeuron
  const handleLiveEvent = useCallback(
    (ev: FeedBusLiveEvent) => {
      neuron.handleImpulse(ev);
      if (
        ev.type === 'MODERATION_ITEM_ADDED' ||
        ev.type === 'MODERATION_ITEM_APPROVED' ||
        ev.type === 'MODERATION_ITEM_REJECTED' ||
        ev.type === 'MODERATION_ITEMS_IMPORTED'
      ) {
        neuron.refreshStats().catch(() => {});
      }
    },
    [neuron]
  );

  useFeedBusLiveSse({ onEvent: handleLiveEvent });

  return {
    items: neuronState.items,
    total: neuronState.total,
    stats: neuronState.stats,
    isLoading: neuronState.isLoading,
    hasMore: neuronState.hasMore,
    loadMore,
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelectId,
    selectAll,
    clearSelection,
    rejectingItem,
    setRejectingItem,
    editingItem,
    setEditingItem,
    handleApprove,
    handleReject,
    handleUpdate,
    handleBatchApprove,
    handleBatchReject,
    handleImportWatchers,
    refresh,
  };
}
