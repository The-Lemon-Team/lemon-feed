import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LemonModerationItem,
  ModerationQueryOptions,
  ModerationStats,
  ModerationStatus,
} from '@lenta/lemon-bus';
import { feedBusApi } from '../api/feedBusApi';
import { useFeedBusLiveSse, FeedBusLiveEvent } from './useFeedBusLiveSse';

export function useFeedBusState() {
  const [items, setItems] = useState<LemonModerationItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<ModerationStatus | 'ALL'>('PENDING');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [rejectingItem, setRejectingItem] = useState<LemonModerationItem | null>(null);
  const [editingItem, setEditingItem] = useState<LemonModerationItem | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await feedBusApi.getStats();
      setStats(res);
    } catch {
      // Ignore background error
    }
  }, []);

  const fetchPage = useCallback(
    async (resetOffset = true) => {
      setIsLoading(true);
      const nextOffset = resetOffset ? 0 : offset;

      const query: ModerationQueryOptions = {
        status: selectedStatus,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        limit: 30,
        offset: nextOffset,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      try {
        const [page, _stats] = await Promise.all([
          feedBusApi.queryItems(query),
          feedBusApi.getStats().catch(() => null),
        ]);

        if (resetOffset) {
          setItems(page.items);
          setOffset(0);
        } else {
          setItems((prev) => {
            const existing = new Set(prev.map((i) => i.id));
            const fresh = page.items.filter((i) => !existing.has(i.id));
            return [...prev, ...fresh];
          });
          setOffset(nextOffset);
        }

        setTotal(page.total);
        setHasMore(page.hasMore);
        if (_stats) setStats(_stats);
      } catch (err) {
        console.warn('[FeedBus] Failed to fetch items:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedStatus, selectedCategory, searchQuery, offset]
  );

  useEffect(() => {
    fetchPage(true);
    setSelectedIds(new Set());
  }, [selectedStatus, selectedCategory, searchQuery]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setOffset((prev) => prev + items.length);
    fetchPage(false);
  }, [isLoading, hasMore, items.length, fetchPage]);

  // Actions
  const handleApprove = useCallback(
    async (id: string, overrides?: Partial<LemonModerationItem>) => {
      try {
        // Optimistic UI removal if viewing pending
        if (selectedStatus === 'PENDING') {
          setItems((prev) => prev.filter((i) => i.id !== id));
          setTotal((prev) => Math.max(0, prev - 1));
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  pendingCount: Math.max(0, prev.pendingCount - 1),
                  approvedCount: prev.approvedCount + 1,
                }
              : null
          );
        }

        await feedBusApi.approveItem(id, overrides, 'curator');
        fetchStats();
      } catch (err: any) {
        console.error('[FeedBus] Approve error:', err);
        fetchPage(true);
      }
    },
    [selectedStatus, fetchStats, fetchPage]
  );

  const handleReject = useCallback(
    async (id: string, reason?: string) => {
      try {
        if (selectedStatus === 'PENDING') {
          setItems((prev) => prev.filter((i) => i.id !== id));
          setTotal((prev) => Math.max(0, prev - 1));
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  pendingCount: Math.max(0, prev.pendingCount - 1),
                  rejectedCount: prev.rejectedCount + 1,
                }
              : null
          );
        }

        await feedBusApi.rejectItem(id, reason, 'curator');
        setRejectingItem(null);
        fetchStats();
      } catch (err: any) {
        console.error('[FeedBus] Reject error:', err);
        fetchPage(true);
      }
    },
    [selectedStatus, fetchStats, fetchPage]
  );

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<LemonModerationItem>) => {
      try {
        const res = await feedBusApi.updateItem(id, patch);
        setItems((prev) => prev.map((i) => (i.id === id ? res.item : i)));
        setEditingItem(null);
      } catch (err: any) {
        console.error('[FeedBus] Update error:', err);
      }
    },
    []
  );

  const handleBatchApprove = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      if (selectedStatus === 'PENDING') {
        const idSet = new Set(ids);
        setItems((prev) => prev.filter((i) => !idSet.has(i.id)));
        setTotal((prev) => Math.max(0, prev - ids.length));
      }
      setSelectedIds(new Set());
      await feedBusApi.batchApprove(ids, 'curator');
      fetchPage(true);
    } catch (err: any) {
      console.error('[FeedBus] Batch approve error:', err);
      fetchPage(true);
    }
  }, [selectedIds, selectedStatus, fetchPage]);

  const handleBatchReject = useCallback(
    async (reason?: string) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      try {
        if (selectedStatus === 'PENDING') {
          const idSet = new Set(ids);
          setItems((prev) => prev.filter((i) => !idSet.has(i.id)));
          setTotal((prev) => Math.max(0, prev - ids.length));
        }
        setSelectedIds(new Set());
        await feedBusApi.batchReject(ids, reason, 'curator');
        fetchPage(true);
      } catch (err: any) {
        console.error('[FeedBus] Batch reject error:', err);
        fetchPage(true);
      }
    },
    [selectedIds, selectedStatus, fetchPage]
  );

  const handleImportWatchers = useCallback(
    async (limit = 100) => {
      try {
        setIsLoading(true);
        await feedBusApi.importWatcherItems(limit);
        await fetchPage(true);
      } catch (err: any) {
        console.error('[FeedBus] Import watchers error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPage]
  );

  // Selection toggles
  const toggleSelectId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Live SSE listener
  const handleLiveEvent = useCallback(
    (ev: FeedBusLiveEvent) => {
      if (ev.type === 'MODERATION_ITEM_ADDED' && ev.item) {
        if (selectedStatus === 'PENDING' || selectedStatus === 'ALL') {
          setItems((prev) => {
            if (prev.some((i) => i.id === ev.item!.id)) return prev;
            return [ev.item!, ...prev];
          });
          setTotal((prev) => prev + 1);
        }
        fetchStats();
      } else if (ev.type === 'MODERATION_ITEM_APPROVED' || ev.type === 'MODERATION_ITEM_REJECTED') {
        if (ev.noteId && selectedStatus === 'PENDING') {
          setItems((prev) => prev.filter((i) => i.id !== ev.noteId));
          setTotal((prev) => Math.max(0, prev - 1));
        }
        fetchStats();
      }
    },
    [selectedStatus, fetchStats]
  );

  useFeedBusLiveSse({ onEvent: handleLiveEvent });

  return {
    items,
    total,
    stats,
    isLoading,
    hasMore,
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
    refresh: () => fetchPage(true),
  };
}
