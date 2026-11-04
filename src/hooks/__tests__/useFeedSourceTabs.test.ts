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
});
