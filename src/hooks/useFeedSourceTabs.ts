import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FEED_ADAPTERS,
  FeedSourceMode,
  UnifiedFeedTab,
  createConfiguredFeedAdapter,
} from '../adapters/feeds';
import {
  FeedModeOption,
  DEFAULT_FEED_MODES,
  PUBLIC_STREAM_PRESETS,
  PRIVATE_STREAM_PRESETS,
  resolveStreamPrivacy,
} from '../components/toolbar/types';
import { FeedAppRuntimeMode } from '../utils/appMode';
import {
  useStreams,
  useCreateStream,
  useUpdateStream,
  useDeleteStream,
  useReorderStreams,
  useReorderStreamTabs,
} from '../api/queries';

interface UseFeedSourceTabsOptions {
  streamSource: FeedSourceMode;
  setStreamSource: (source: FeedSourceMode) => void;
  selectedFeedSlug?: string;
  setSelectedFeedSlug: (slug?: string) => void;
  isPublicMode: boolean;
  appMode: FeedAppRuntimeMode;
  notesPrivacy?: 'all' | 'public' | 'private';
  allFeeds: any[];
  notes: any[];
  isLoading: boolean;
  isEditMode?: boolean;
}

export function useFeedSourceTabs({
  streamSource,
  setStreamSource,
  selectedFeedSlug,
  setSelectedFeedSlug,
  isPublicMode,
  appMode,
  notesPrivacy = 'all',
  allFeeds,
  notes,
  isLoading,
  isEditMode = false,
}: UseFeedSourceTabsOptions) {
  // Custom source modes (upper tabs)
  const [sourceModes, setSourceModes] = useState<FeedModeOption[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lenta_custom_stream_modes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const LEGACY_DELETED_PRIVATE_IDS = new Set([
              'personal_notes',
              'work_vault',
              'secure_vault',
            ]);
            const enriched = parsed
              .filter((item: any) => !LEGACY_DELETED_PRIVATE_IDS.has(item?.id))
              .map((item: any) => {
                const defaultMatch = DEFAULT_FEED_MODES.find((d) => d.id === item.id);
                if (defaultMatch && !item.filterConfig && defaultMatch.filterConfig) {
                  return { ...item, filterConfig: defaultMatch.filterConfig, privacy: defaultMatch.privacy };
                }
                return item;
              });

            let list = enriched;
            if (!list.some((m: any) => m.id === 'all')) {
              const allDef = PUBLIC_STREAM_PRESETS.find((m) => m.id === 'all');
              if (allDef) list = [allDef, ...list];
            }
            if (!list.some((m: any) => m.id === 'telegram')) {
              const tgDef = PUBLIC_STREAM_PRESETS.find((m) => m.id === 'telegram');
              if (tgDef) list.push(tgDef);
            }
            if (!list.some((m: any) => m.id === 'private_feeds')) {
              const privAllDef = PRIVATE_STREAM_PRESETS.find((m) => m.id === 'private_feeds');
              if (privAllDef) list.push(privAllDef);
            } else {
              list = list.map((m: any) =>
                m.id === 'private_feeds'
                  ? { ...m, isBuiltin: true, privacy: 'private', label: m.label === 'Private feeds' ? 'Все приватные' : m.label }
                  : m
              );
            }
            return list;
          }
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_FEED_MODES;
  });

  const { data: dbStreams = [], isLoading: isStreamsLoading } = useStreams(appMode !== 'public');
  const createStreamMutation = useCreateStream();
  const updateStreamMutation = useUpdateStream();
  const deleteStreamMutation = useDeleteStream();
  const reorderStreamsMutation = useReorderStreams();
  const reorderTabsMutation = useReorderStreamTabs();
  const [customTabOrders, setCustomTabOrders] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lenta_custom_tab_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Synchronize sourceModes with streams from PostgreSQL database
  useEffect(() => {
    if (Array.isArray(dbStreams) && dbStreams.length > 0) {
      const mapped: FeedModeOption[] = dbStreams.map((s) => {
        const feedSlugSet = new Set<string>();
        for (const f of s.feeds || []) {
          if (f?.slug) feedSlugSet.add(f.slug);
        }
        for (const fid of s.feedIds || []) {
          const matched = allFeeds.find((f: any) => f.id === fid || f.slug === fid);
          if (matched?.slug) feedSlugSet.add(matched.slug);
        }
        const feedSlugs = Array.from(feedSlugSet);
        return {
          id: s.slug,
          label: s.title,
          emoji: s.icon || '📁',
          badge: s.badge || undefined,
          privacy: s.privacy || (s.slug === 'private_feeds' ? 'private' : 'public'),
          description: s.description || undefined,
          isBuiltin: s.isBuiltin,
          filterConfig: {
            privacy: s.privacy,
            feedSlugs: feedSlugs.length > 0 ? feedSlugs : undefined,
            tags: s.tags?.length > 0 ? s.tags : undefined,
            folderPaths: s.folderPaths?.length > 0 ? s.folderPaths : undefined,
          },
        };
      });

      // Preserve built-ins ('all', 'telegram', 'private_feeds') if absent, without resurrecting deleted presets
      let list: FeedModeOption[] = mapped;
      if (!list.some((m) => m.id === 'all')) {
        const allDef = PUBLIC_STREAM_PRESETS.find((m) => m.id === 'all');
        if (allDef) list = [allDef, ...list];
      }
      if (!list.some((m) => m.id === 'telegram')) {
        const tgDef = PUBLIC_STREAM_PRESETS.find((m) => m.id === 'telegram');
        if (tgDef) list.push(tgDef);
      }
      if (!list.some((m) => m.id === 'private_feeds')) {
        const privAllDef = PRIVATE_STREAM_PRESETS.find((m) => m.id === 'private_feeds');
        if (privAllDef) {
          const firstPrivIdx = list.findIndex((m) => resolveStreamPrivacy(m) === 'private');
          if (firstPrivIdx >= 0) {
            list = [...list.slice(0, firstPrivIdx), privAllDef, ...list.slice(firstPrivIdx)];
          } else {
            list.push(privAllDef);
          }
        }
      } else {
        list = list.map((m) =>
          m.id === 'private_feeds'
            ? { ...m, isBuiltin: true, privacy: 'private', label: m.label === 'Private feeds' ? 'Все приватные' : m.label }
            : m
        );
      }
      setSourceModes(list);
      try {
        localStorage.setItem('lenta_custom_stream_modes', JSON.stringify(list));
      } catch {
        // ignore
      }
    }
  }, [dbStreams, allFeeds]);

  // Modal states for tabs and feeds
  const [editingSourceTab, setEditingSourceTab] = useState<FeedModeOption | null>(null);
  const [isSourceTabModalOpen, setIsSourceTabModalOpen] = useState(false);

  const [editingFeedTab, setEditingFeedTab] = useState<UnifiedFeedTab | null>(null);
  const [editingDbFeed, setEditingDbFeed] = useState<any | null>(null);
  const [isFeedEntityModalOpen, setIsFeedEntityModalOpen] = useState(false);

  const handleOpenEditSourceTab = useCallback((tab: FeedModeOption) => {
    setEditingSourceTab(tab);
    setIsSourceTabModalOpen(true);
  }, []);

  const handleOpenAddSourceTab = useCallback(() => {
    setEditingSourceTab(null);
    setIsSourceTabModalOpen(true);
  }, []);

  const handleCloseSourceTabModal = useCallback(() => {
    setIsSourceTabModalOpen(false);
    setEditingSourceTab(null);
  }, []);

  const handleSaveSourceTab = useCallback(
    async (tab: FeedModeOption, extraFeed?: { id: string; slug: string }) => {
      // Find matching stream in database
      const existingStream = dbStreams.find((s) => s.slug === tab.id || s.id === tab.id);
      const resolvedFeedIds: string[] = [];
      const feedCandidates = extraFeed ? [...allFeeds, extraFeed] : allFeeds;
      if (tab.filterConfig?.feedSlugs && tab.filterConfig.feedSlugs.length > 0) {
        for (const slug of tab.filterConfig.feedSlugs) {
          const matched = feedCandidates.find((f) => f.slug === slug || f.id === slug);
          if (matched && !resolvedFeedIds.includes(matched.id)) {
            resolvedFeedIds.push(matched.id);
          }
        }
      }

      const payload = {
        slug: tab.id,
        title: tab.label,
        icon: tab.emoji,
        badge: tab.badge,
        description: tab.description,
        privacy: tab.filterConfig?.privacy === 'private' ? ('private' as const) : ('public' as const),
        feedIds: resolvedFeedIds,
        tags: tab.filterConfig?.tags,
        folderPaths: tab.filterConfig?.folderPaths,
      };

      try {
        if (existingStream) {
          await updateStreamMutation.mutateAsync({ id: existingStream.id, data: payload });
        } else {
          await createStreamMutation.mutateAsync(payload);
        }
      } catch (err) {
        console.error('[FeedSourceTabs] Failed to persist stream to database:', err);
      }

      setSourceModes((prev) => {
        const existingIndex = prev.findIndex((m) => m.id === tab.id);
        let updated: FeedModeOption[];
        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex] = tab;
        } else {
          updated = [...prev, tab];
        }
        try {
          localStorage.setItem('lenta_custom_stream_modes', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [dbStreams, allFeeds, updateStreamMutation, createStreamMutation]
  );

  const handleDeleteSourceTab = useCallback(
    (tabId: string) => {
      if (tabId === 'all' || tabId === 'telegram' || tabId === 'private_feeds') return;
      const existingStream = dbStreams.find((s) => s.slug === tabId || s.id === tabId);
      if (existingStream && !existingStream.isBuiltin) {
        deleteStreamMutation.mutate(existingStream.id);
      }

      setSourceModes((prev) => {
        const updated = prev.filter((m) => m.id !== tabId);
        try {
          localStorage.setItem('lenta_custom_stream_modes', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      // If deleting currently active tab, gracefully fallback to 'private_feeds' or 'all'
      if (streamSource === tabId) {
        setStreamSource(notesPrivacy === 'private' ? 'private_feeds' : 'all');
        try {
          const url = new URL(window.location.href);
          url.pathname = notesPrivacy === 'private' ? '/private' : '/';
          url.search = '';
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore
        }
      }
    },
    [streamSource, notesPrivacy, setStreamSource, dbStreams, deleteStreamMutation]
  );

  const handleReorderSourceModes = useCallback(
    (newModes: FeedModeOption[]) => {
      setSourceModes((prev) => {
        // Merge reordered visible subset back into full sourceModes list so hidden contour tabs are never lost!
        const reorderedIds = new Set(newModes.map((m) => m.id));
        const result: FeedModeOption[] = [];
        let reorderedIdx = 0;

        for (const item of prev) {
          if (reorderedIds.has(item.id)) {
            if (reorderedIdx < newModes.length) {
              result.push(newModes[reorderedIdx]);
              reorderedIdx++;
            }
          } else {
            result.push(item);
          }
        }
        while (reorderedIdx < newModes.length) {
          result.push(newModes[reorderedIdx]);
          reorderedIdx++;
        }

        try {
          localStorage.setItem('lenta_custom_stream_modes', JSON.stringify(result));
        } catch {
          // ignore
        }
        return result;
      });

      const reorderPayload = newModes.map((m, idx) => ({
        id: m.id,
        order: idx,
      }));

      reorderStreamsMutation.mutate(reorderPayload);
    },
    [reorderStreamsMutation]
  );

  const handleReorderCategoryTabs = useCallback(
    (newTabs: UnifiedFeedTab[]) => {
      const tabIds = newTabs.map((t) => t.slug || t.id);
      setCustomTabOrders((prev) => {
        const next = {
          ...prev,
          [streamSource]: tabIds,
        };
        try {
          localStorage.setItem('lenta_custom_tab_orders', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      const currentStream = Array.isArray(dbStreams)
        ? dbStreams.find((s) => s.slug === streamSource || s.id === streamSource)
        : undefined;
      if (currentStream) {
        const items = newTabs.map((t, idx) => ({
          tabId: t.slug || t.id,
          order: idx,
        }));
        reorderTabsMutation.mutate({
          streamId: currentStream.id,
          items,
        });
      }
    },
    [streamSource, dbStreams, reorderTabsMutation]
  );

  const handleOpenEditFeed = useCallback(
    (tab: UnifiedFeedTab) => {
      const dbFeed = allFeeds.find((f) => f.id === tab.id || f.slug === tab.slug);
      setEditingFeedTab(tab);
      setEditingDbFeed(dbFeed || null);
      setIsFeedEntityModalOpen(true);
    },
    [allFeeds]
  );

  const handleOpenAddFeed = useCallback(() => {
    setEditingFeedTab(null);
    setEditingDbFeed(null);
    setIsFeedEntityModalOpen(true);
  }, []);

  const handleCloseFeedEntityModal = useCallback(() => {
    setIsFeedEntityModalOpen(false);
    setEditingFeedTab(null);
    setEditingDbFeed(null);
  }, []);

  // Visible source modes depending on runtime mode and notesPrivacy contour
  const visibleSourceModes = useMemo(() => {
    if (isPublicMode || appMode === 'public') {
      return sourceModes.filter(
        (m) => m.id !== 'telegram' && resolveStreamPrivacy(m) !== 'private'
      );
    }
    if (notesPrivacy === 'private') {
      const privates = sourceModes.filter((m) => resolveStreamPrivacy(m) === 'private');
      const list = privates.length > 0 ? [...privates] : [...PRIVATE_STREAM_PRESETS];
      // Guarantee the master "All Private Notes" ('private_feeds') tab is always present in Private mode
      const allPrivIndex = list.findIndex((m) => m.id === 'private_feeds');
      if (allPrivIndex === -1) {
        const privDef = PRIVATE_STREAM_PRESETS.find((m) => m.id === 'private_feeds');
        if (privDef) list.unshift(privDef);
      }
      return list;
    }
    if (notesPrivacy === 'public') {
      const normalizeId = (id: string) => id.toLowerCase().replace(/-/g, '_');
      return sourceModes.filter(
        (m) =>
          (resolveStreamPrivacy(m) === 'public' ||
            (selectedFeedSlug &&
              (m.id === streamSource || normalizeId(m.id) === normalizeId(streamSource)))) &&
          (m.id !== 'telegram' || appMode === 'dev')
      );
    }
    return sourceModes;
  }, [sourceModes, isPublicMode, appMode, notesPrivacy, selectedFeedSlug, streamSource]);

  // If in public mode or contour changes, synchronize active stream with visible contour
  useEffect(() => {
    const normalizeId = (id: string) => id.toLowerCase().replace(/-/g, '_');
    const matchedMode = sourceModes.find(
      (m) => m.id === streamSource || normalizeId(m.id) === normalizeId(streamSource)
    );
    const isKnownBuiltinOrPreset = Boolean(
      matchedMode ||
        DEFAULT_FEED_MODES.some(
          (d) => d.id === streamSource || normalizeId(d.id) === normalizeId(streamSource)
        )
    );

    // Wait for database streams (and feeds) to load before redirecting unknown custom stream/feed slugs (e.g. /jm-daily)
    if (!isKnownBuiltinOrPreset && (isStreamsLoading || isLoading)) {
      return;
    }

    // If custom stream in DB uses underscores (e.g. jm_daily) and URL parsed with hyphens or vice versa, align streamSource id
    if (matchedMode && matchedMode.id !== streamSource) {
      setStreamSource(matchedMode.id as FeedSourceMode);
      return;
    }

    // If streamSource is neither a known stream/mode nor loading, check if it matches a known feed slug in allFeeds
    if (!isKnownBuiltinOrPreset && !isStreamsLoading && allFeeds.length > 0) {
      const matchedFeed = allFeeds.find(
        (f) => f.slug && normalizeId(f.slug) === normalizeId(streamSource)
      );
      if (matchedFeed) {
        const targetSource =
          matchedFeed.privacy === 'private' || notesPrivacy === 'private'
            ? 'private_feeds'
            : 'all';
        setStreamSource(targetSource);
        setSelectedFeedSlug(matchedFeed.slug);
        return;
      }
    }

    // Resolve privacy via the actual mode definition (custom DB streams like code-learning or jm-daily are not in presets)
    const activeStreamPrivacy = resolveStreamPrivacy(matchedMode || streamSource);
    if (isPublicMode || appMode === 'public') {
      if (streamSource === 'telegram' || activeStreamPrivacy === 'private') {
        setStreamSource('all');
        try {
          const url = new URL(window.location.href);
          url.pathname = '/';
          url.search = '';
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore
        }
      }
      return;
    }

    if (notesPrivacy === 'private') {
      if (activeStreamPrivacy === 'public') {
        setStreamSource('private_feeds');
        setSelectedFeedSlug(undefined);
      }
    } else if (notesPrivacy === 'public') {
      if (activeStreamPrivacy === 'private' && !selectedFeedSlug) {
        setStreamSource('all');
        setSelectedFeedSlug(undefined);
      }
    }
  }, [
    isPublicMode,
    appMode,
    notesPrivacy,
    streamSource,
    selectedFeedSlug,
    sourceModes,
    isStreamsLoading,
    isLoading,
    allFeeds,
    setStreamSource,
    setSelectedFeedSlug,
  ]);

  // Active adapter
  const activeAdapter = useMemo(() => {
    if (streamSource === 'all') {
      return FEED_ADAPTERS.all;
    }
    if (streamSource === 'telegram') {
      return FEED_ADAPTERS.telegram;
    }
    if (streamSource === 'private_feeds') {
      return FEED_ADAPTERS.private_feeds;
    }

    const normalizeId = (id: string) => id.toLowerCase().replace(/-/g, '_');
    const customMode = sourceModes.find(
      (m) => m.id === streamSource || normalizeId(m.id) === normalizeId(streamSource)
    );
    if (customMode) {
      return createConfiguredFeedAdapter(customMode);
    }

    if (FEED_ADAPTERS[streamSource]) {
      return FEED_ADAPTERS[streamSource];
    }
    return FEED_ADAPTERS.all;
  }, [streamSource, sourceModes]);

  // Helper to match selected feed slug or alias/subtopic against tabs
  const matchesTabOrSubtopic = (tab: UnifiedFeedTab, targetSlug: string): boolean => {
    if (tab.slug === targetSlug || tab.id === targetSlug) return true;
    if (tab.slug === 'spark-changelogsfeed' && (targetSlug === 'changelogs' || targetSlug === 'changelog')) return true;
    if (tab.slug === 'spark-notebooklmai' && (targetSlug === 'notebooklm' || targetSlug === 'notebooklmai')) return true;
    if (tab.subtopics && tab.subtopics.length > 0) {
      return tab.subtopics.some(
        (s) =>
          s.slug === targetSlug ||
          s.subfolder === targetSlug ||
          (s.subfolder && targetSlug.endsWith(`-${s.subfolder}`))
      );
    }
    return false;
  };

  // Thematic tabs: keep tabs with notes, or actual database feeds (configured for view), or selected feed
  const activeTabs: UnifiedFeedTab[] = useMemo(() => {
    const rawTabs = activeAdapter.getTabs({ allFeeds, notes });
    const currentMode = sourceModes.find((m) => m.id === streamSource);
    const isPrivateStream = streamSource === 'private_feeds' || resolveStreamPrivacy(currentMode || streamSource) === 'private';

    const filtered = rawTabs.filter((t) => {
      if (t.count > 0) return true;
      if (isEditMode) return true;
      if (isPrivateStream) return true; // keep preloaded scaffold tabs in private stream
      const isDbFeed = allFeeds.some((f) => f.id === t.id || f.slug === t.slug);
      if (isDbFeed) return true;
      if (selectedFeedSlug && (t.slug === selectedFeedSlug || t.id === selectedFeedSlug || matchesTabOrSubtopic(t, selectedFeedSlug))) {
        return true;
      }
      return false;
    });

    // If selectedFeedSlug matches a known DB feed that is not yet in rawTabs for this adapter,
    // inject it so the newly created or directly navigated feed tab is instantly visible and selectable
    if (selectedFeedSlug && !filtered.some((t) => matchesTabOrSubtopic(t, selectedFeedSlug))) {
      const dbFeed = allFeeds.find((f) => f.slug === selectedFeedSlug || f.id === selectedFeedSlug);
      if (dbFeed) {
        filtered.push({
          id: dbFeed.id,
          slug: dbFeed.slug,
          title: dbFeed.title,
          shortTitle: dbFeed.title.length > 18 ? `${dbFeed.title.slice(0, 18)}...` : dbFeed.title,
          emoji: dbFeed.icon || '📁',
          accentColor: dbFeed.color || '#2481cc',
          count: dbFeed._count?.notes || 0,
          category: dbFeed.category || 'Общее',
        });
      }
    }

    // Apply overlays and deterministic ordering from StreamTab / custom reorder
    const currentStream = dbStreams.find((s) => s.slug === streamSource || s.id === streamSource);
    const customOrder = customTabOrders[streamSource];
    const streamFeedOrder = currentStream?.feeds?.map((f: any) => f.slug || f.id) || [];
    const orderList = customOrder || (streamFeedOrder.length > 0 ? streamFeedOrder : null);

    if (currentStream?.feeds && currentStream.feeds.length > 0) {
      for (const tab of filtered) {
        const matchingFeed = currentStream.feeds.find(
          (f: any) => f.slug === tab.slug || f.id === tab.id
        );
        if (matchingFeed) {
          if (matchingFeed.customTitle) {
            tab.title = matchingFeed.customTitle;
            tab.shortTitle = matchingFeed.customTitle.length > 18
              ? `${matchingFeed.customTitle.slice(0, 18)}...`
              : matchingFeed.customTitle;
          }
          if (matchingFeed.customIcon) {
            tab.emoji = matchingFeed.customIcon;
          }
          if (matchingFeed.badge) {
            tab.badgeLabel = matchingFeed.badge;
          }
        }
      }
    }

    if (orderList && orderList.length > 0) {
      filtered.sort((a, b) => {
        const indexA = orderList.findIndex((idOrSlug) => idOrSlug === a.id || idOrSlug === a.slug);
        const indexB = orderList.findIndex((idOrSlug) => idOrSlug === b.id || idOrSlug === b.slug);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return filtered;
  }, [activeAdapter, allFeeds, notes, selectedFeedSlug, isEditMode, dbStreams, streamSource, customTabOrders]);

  // Reset selectedFeedSlug if the selected tab becomes empty/unavailable
  useEffect(() => {
    if (!selectedFeedSlug || isLoading || activeTabs.length === 0) return;
    const stillExists = activeTabs.some((t) => matchesTabOrSubtopic(t, selectedFeedSlug));
    if (!stillExists) {
      setSelectedFeedSlug(undefined);
    }
  }, [activeTabs, selectedFeedSlug, isLoading, setSelectedFeedSlug]);

  // Active tab object for sidebar detail
  const activeTabObj: UnifiedFeedTab | null = useMemo(() => {
    if (!selectedFeedSlug) return null;
    return activeTabs.find((t) => matchesTabOrSubtopic(t, selectedFeedSlug)) || null;
  }, [activeTabs, selectedFeedSlug]);

  return {
    sourceModes,
    visibleSourceModes,
    activeAdapter,
    activeTabs,
    activeTabObj,
    // Source tab editing
    editingSourceTab,
    isSourceTabModalOpen,
    handleOpenEditSourceTab,
    handleOpenAddSourceTab,
    handleCloseSourceTabModal,
    handleSaveSourceTab,
    handleDeleteSourceTab,
    handleReorderSourceModes,
    // Feed entity editing
    editingFeedTab,
    editingDbFeed,
    isFeedEntityModalOpen,
    handleOpenEditFeed,
    handleOpenAddFeed,
    handleCloseFeedEntityModal,
    handleReorderCategoryTabs,
  };
}
