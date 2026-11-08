import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeedSourceTabs } from '../useFeedSourceTabs';
import type { Feed, Note } from '@lenta/shared';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useFeedSourceTabs', () => {
  const mockAllFeeds: Feed[] = [
    { id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' } as any,
    { id: 'f-habr', slug: 'spark-habr', title: 'Хабр & IT', privacy: 'public' } as any,
    { id: 'f-empty', slug: 'public-empty', title: 'Empty Feed', privacy: 'public' } as any,
  ];

  const mockNotes: Note[] = [
    {
      id: 'n1',
      title: 'AI Note 1',
      privacy: 'public',
      status: 'PUBLISHED',
      folderPath: 'Spark/AI',
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI (Spark)', privacy: 'public' },
    } as any,
  ];

  it('filters out 0-count tabs in normal mode unless active', () => {
    const { result } = renderHook(
      () =>
        useFeedSourceTabs({
          streamSource: 'all',
          setStreamSource: vi.fn(),
          selectedFeedSlug: undefined,
          setSelectedFeedSlug: vi.fn(),
          isPublicMode: false,
          appMode: 'dev',
          allFeeds: mockAllFeeds,
          notes: mockNotes,
          isLoading: false,
          isEditMode: false,
        }),
      { wrapper: createWrapper() }
    );

    // AI has 1 note -> should be present
    expect(result.current.activeTabs.some((t) => t.slug === 'spark-ai')).toBe(true);

    // Empty feed has 0 notes -> should be filtered out
    expect(result.current.activeTabs.some((t) => t.slug === 'public-empty')).toBe(false);
  });

  it('preserves an empty tab if it is currently selected by the user', () => {
    const { result } = renderHook(
      () =>
        useFeedSourceTabs({
          streamSource: 'all',
          setStreamSource: vi.fn(),
          selectedFeedSlug: 'public-empty',
          setSelectedFeedSlug: vi.fn(),
          isPublicMode: false,
          appMode: 'dev',
          allFeeds: mockAllFeeds,
          notes: mockNotes,
          isLoading: false,
          isEditMode: false,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.activeTabs.some((t) => t.slug === 'public-empty')).toBe(true);
  });

  it('keeps 0-count database tabs visible in edit mode for management', () => {
    const { result } = renderHook(
      () =>
        useFeedSourceTabs({
          streamSource: 'all',
          setStreamSource: vi.fn(),
          selectedFeedSlug: undefined,
          setSelectedFeedSlug: vi.fn(),
          isPublicMode: false,
          appMode: 'dev',
          allFeeds: mockAllFeeds,
          notes: mockNotes,
          isLoading: false,
          isEditMode: true,
        }),
      { wrapper: createWrapper() }
    );

    // In edit mode, user needs to see and manage feeds
    expect(result.current.activeTabs.length).toBeGreaterThan(0);
  });

  describe('Privacy Contour Scaffolding & Auto-Switching', () => {
    it('shows only private streams in visibleSourceModes when notesPrivacy is "private"', () => {
      const { result } = renderHook(
        () =>
          useFeedSourceTabs({
            streamSource: 'private_feeds',
            setStreamSource: vi.fn(),
            selectedFeedSlug: undefined,
            setSelectedFeedSlug: vi.fn(),
            isPublicMode: false,
            appMode: 'dev',
            notesPrivacy: 'private',
            allFeeds: mockAllFeeds,
            notes: mockNotes,
            isLoading: false,
          }),
        { wrapper: createWrapper() }
      );

      const modes = result.current.visibleSourceModes;
      expect(modes.length).toBeGreaterThan(0);
      expect(modes.every((m) => m.privacy === 'private' || m.id === 'private_feeds')).toBe(true);
      expect(modes.some((m) => m.id === 'all')).toBe(false);
      expect(modes.some((m) => m.id === 'it_dev')).toBe(false);
    });

    it('shows only public streams in visibleSourceModes when notesPrivacy is "public"', () => {
      const { result } = renderHook(
        () =>
          useFeedSourceTabs({
            streamSource: 'all',
            setStreamSource: vi.fn(),
            selectedFeedSlug: undefined,
            setSelectedFeedSlug: vi.fn(),
            isPublicMode: false,
            appMode: 'dev',
            notesPrivacy: 'public',
            allFeeds: mockAllFeeds,
            notes: mockNotes,
            isLoading: false,
          }),
        { wrapper: createWrapper() }
      );

      const modes = result.current.visibleSourceModes;
      expect(modes.length).toBeGreaterThan(0);
      expect(modes.every((m) => m.privacy !== 'private' && m.id !== 'private_feeds')).toBe(true);
      expect(modes.some((m) => m.id === 'all')).toBe(true);
      expect(modes.some((m) => m.id === 'private_feeds')).toBe(false);
    });

    it('auto-redirects from a public stream to "private_feeds" when notesPrivacy switches to "private"', () => {
      const setStreamSource = vi.fn();
      const setSelectedFeedSlug = vi.fn();

      renderHook(
        () =>
          useFeedSourceTabs({
            streamSource: 'all',
            setStreamSource,
            selectedFeedSlug: 'spark-ai',
            setSelectedFeedSlug,
            isPublicMode: false,
            appMode: 'dev',
            notesPrivacy: 'private',
            allFeeds: mockAllFeeds,
            notes: mockNotes,
            isLoading: false,
          }),
        { wrapper: createWrapper() }
      );

      expect(setStreamSource).toHaveBeenCalledWith('private_feeds');
      expect(setSelectedFeedSlug).toHaveBeenCalledWith(undefined);
    });

    it('auto-redirects from a private stream to "all" when notesPrivacy switches to "public"', () => {
      const setStreamSource = vi.fn();
      const setSelectedFeedSlug = vi.fn();

      renderHook(
        () =>
          useFeedSourceTabs({
            streamSource: 'private_feeds',
            setStreamSource,
            selectedFeedSlug: undefined,
            setSelectedFeedSlug,
            isPublicMode: false,
            appMode: 'dev',
            notesPrivacy: 'public',
            allFeeds: mockAllFeeds,
            notes: mockNotes,
            isLoading: false,
          }),
        { wrapper: createWrapper() }
      );

      expect(setStreamSource).toHaveBeenCalledWith('all');
      expect(setSelectedFeedSlug).toHaveBeenCalledWith(undefined);
    });

    it('does not redirect away from private stream/feed when notesPrivacy switches to "public" and selectedFeedSlug is active', () => {
      const setStreamSource = vi.fn();
      const setSelectedFeedSlug = vi.fn();

      localStorage.setItem(
        'lenta_custom_stream_modes',
        JSON.stringify([
          { id: 'all', label: 'Все ленты', emoji: '🌐', privacy: 'public', isBuiltin: true },
          { id: 'code_learning', label: 'Code Learning', emoji: '💻', privacy: 'private' },
        ])
      );

      const { result } = renderHook(
        () =>
          useFeedSourceTabs({
            streamSource: 'code_learning' as any,
            setStreamSource,
            selectedFeedSlug: 'javascript-questions',
            setSelectedFeedSlug,
            isPublicMode: false,
            appMode: 'dev',
            notesPrivacy: 'public',
            allFeeds: mockAllFeeds,
            notes: mockNotes,
            isLoading: false,
          }),
        { wrapper: createWrapper() }
      );

      expect(setStreamSource).not.toHaveBeenCalledWith('all');
      expect(setSelectedFeedSlug).not.toHaveBeenCalledWith(undefined);
      expect(result.current.visibleSourceModes.some((m) => m.id === 'code_learning')).toBe(true);
    });

    it('preserves custom private stream (e.g. /jm-daily) on startup when notesPrivacy is "private" and dbStreams are loading or loaded', () => {
      const setStreamSource = vi.fn();
      const setSelectedFeedSlug = vi.fn();

      // Simulate saved custom stream in localStorage or dbStreams
      localStorage.setItem(
        'lenta_custom_stream_modes',
        JSON.stringify([
          { id: 'all', label: 'Все ленты', emoji: '🌐', privacy: 'public', isBuiltin: true },
          { id: 'private_feeds', label: 'Все приватные', emoji: '🔮', privacy: 'private', isBuiltin: true },
          { id: 'jm_daily', label: 'JM Daily', emoji: '📁', privacy: 'private' },
        ])
      );

      const { result } = renderHook(
        () =>
          useFeedSourceTabs({
            streamSource: 'jm_daily' as any,
            setStreamSource,
            selectedFeedSlug: undefined,
            setSelectedFeedSlug,
            isPublicMode: false,
            appMode: 'dev',
            notesPrivacy: 'private',
            allFeeds: mockAllFeeds,
            notes: mockNotes,
            isLoading: false,
          }),
        { wrapper: createWrapper() }
      );

      // Should NOT redirect away to 'private_feeds'
      expect(setStreamSource).not.toHaveBeenCalledWith('private_feeds');
      expect(result.current.visibleSourceModes.some((m) => m.id === 'jm_daily')).toBe(true);
    });

    it('does not redirect unknown custom stream while streams are loading from backend', () => {
      const setStreamSource = vi.fn();
      const setSelectedFeedSlug = vi.fn();

      renderHook(
        () =>
          useFeedSourceTabs({
            streamSource: 'jm_daily' as any,
            setStreamSource,
            selectedFeedSlug: undefined,
            setSelectedFeedSlug,
            isPublicMode: false,
            appMode: 'dev',
            notesPrivacy: 'private',
            allFeeds: mockAllFeeds,
            notes: mockNotes,
            isLoading: true,
          }),
        { wrapper: createWrapper() }
      );

      // While loading, it should wait for dbStreams rather than immediately redirecting to 'private_feeds'
      expect(setStreamSource).not.toHaveBeenCalledWith('private_feeds');
    });
  });

  describe('Custom Stream Route Resolution (e.g. /jm-daily)', () => {
    it('parses /jm-daily?appMode=dev&notesPrivacy=private as streamSource="jm_daily"', async () => {
      const { parseFeedRouteString } = await import('../../utils/feedRouteMappings');
      const parsed = parseFeedRouteString('/jm-daily?appMode=dev&notesPrivacy=private');
      expect(parsed.streamSource).toBe('jm_daily');
      expect(parsed.selectedFeedSlug).toBeUndefined();
    });

    it('still parses known feed aliases (e.g. /changelogs, /habr) as selectedFeedSlug on streamSource="all"', async () => {
      const { parseFeedRouteString } = await import('../../utils/feedRouteMappings');
      const changelogs = parseFeedRouteString('/changelogs');
      expect(changelogs.streamSource).toBe('all');
      expect(changelogs.selectedFeedSlug).toBe('spark-changelogsfeed');

      const habr = parseFeedRouteString('/habr');
      expect(habr.streamSource).toBe('all');
      expect(habr.selectedFeedSlug).toBe('spark-habr');
    });
  });
});
