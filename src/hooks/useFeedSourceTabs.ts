import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FEED_ADAPTERS,
  FeedSourceMode,
  UnifiedFeedTab,
  createConfiguredFeedAdapter,
} from '../adapters/feeds';
import { FeedModeOption, DEFAULT_FEED_MODES } from '../components/FeedToolbar';
import { FeedAppRuntimeMode } from '../utils/appMode';

interface UseFeedSourceTabsOptions {
  streamSource: FeedSourceMode;
  setStreamSource: (source: FeedSourceMode) => void;
  selectedFeedSlug?: string;
  setSelectedFeedSlug: (slug?: string) => void;
  isPublicMode: boolean;
  appMode: FeedAppRuntimeMode;
  allFeeds: any[];
  notes: any[];
  isLoading: boolean;
}

export function useFeedSourceTabs({
  streamSource,
  setStreamSource,
  selectedFeedSlug,
  setSelectedFeedSlug,
  isPublicMode,
  appMode,
  allFeeds,
  notes,
  isLoading,
}: UseFeedSourceTabsOptions) {
  // Custom source modes (upper tabs)
  const [sourceModes, setSourceModes] = useState<FeedModeOption[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lenta_custom_stream_modes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const enriched = parsed.map((item: any) => {
              const defaultMatch = DEFAULT_FEED_MODES.find((d) => d.id === item.id);
              if (defaultMatch && !item.filterConfig && defaultMatch.filterConfig) {
                return { ...item, filterConfig: defaultMatch.filterConfig };
              }
              return item;
            });

            const hasAll = enriched.some((m: any) => m.id === 'all');
            const hasTelegram = enriched.some((m: any) => m.id === 'telegram');
            let list = enriched;
            if (!hasAll) {
              const allDef = DEFAULT_FEED_MODES.find((m) => m.id === 'all');
              if (allDef) list = [allDef, ...list];
            }
            if (!hasTelegram) {
              const tgDef = DEFAULT_FEED_MODES.find((m) => m.id === 'telegram');
              if (tgDef) list.push(tgDef);
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

  const handleSaveSourceTab = useCallback((tab: FeedModeOption) => {
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
  }, []);

  const handleDeleteSourceTab = useCallback(
    (tabId: string) => {
      if (tabId === 'all' || tabId === 'telegram') return;
      setSourceModes((prev) => {
        const updated = prev.filter((m) => m.id !== tabId);
        try {
          localStorage.setItem('lenta_custom_stream_modes', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      // If deleting currently active tab, gracefully fallback to 'all'
      if (streamSource === tabId) {
        setStreamSource('all');
        try {
          const url = new URL(window.location.href);
          url.pathname = '/stream';
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore
        }
      }
    },
    [streamSource, setStreamSource]
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

  // Visible source modes depending on runtime mode
  const visibleSourceModes = useMemo(() => {
    if (isPublicMode || appMode === 'public') {
      return sourceModes.filter(
        (m) => m.id !== 'telegram' && m.filterConfig?.privacy !== 'private'
      );
    }
    return sourceModes;
  }, [sourceModes, isPublicMode, appMode]);

  // If in public mode and currently viewing a hidden tab (e.g. telegram or private), redirect to 'all'
  useEffect(() => {
    if (isPublicMode || appMode === 'public') {
      if (streamSource === 'telegram' || streamSource === 'private_feeds') {
        setStreamSource('all');
        try {
          const url = new URL(window.location.href);
          url.pathname = '/stream';
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore
        }
      }
    }
  }, [isPublicMode, appMode, streamSource, setStreamSource]);

  // Active adapter
  const activeAdapter = useMemo(() => {
    if (streamSource === 'all') {
      return FEED_ADAPTERS.all;
    }
    if (streamSource === 'telegram') {
      return FEED_ADAPTERS.telegram;
    }

    const customMode = sourceModes.find((m) => m.id === streamSource);
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
    const filtered = rawTabs.filter((t) => {
      if (t.count > 0) return true;
      const isDbFeed = allFeeds.some((f) => f.id === t.id || f.slug === t.slug);
      if (isDbFeed) return true;
      if (selectedFeedSlug && (t.slug === selectedFeedSlug || t.id === selectedFeedSlug)) return true;
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

    return filtered;
  }, [activeAdapter, allFeeds, notes, selectedFeedSlug]);

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
    // Feed entity editing
    editingFeedTab,
    editingDbFeed,
    isFeedEntityModalOpen,
    handleOpenEditFeed,
    handleOpenAddFeed,
    handleCloseFeedEntityModal,
  };
}
