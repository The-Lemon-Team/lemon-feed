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

describe('Tab Telemetry and Counters Across Tab Switches', () => {
  const mockAllFeeds: Feed[] = [
    {
      id: 'f-ai',
      slug: 'spark-ai',
      title: 'AI & Нейросети',
      privacy: 'public',
      _count: { notes: 8 },
    } as any,
    {
      id: 'f-habr',
      slug: 'spark-habr',
      title: 'Хабр & IT',
      privacy: 'public',
      _count: { notes: 12 },
    } as any,
    {
      id: 'f-cl-google',
      slug: 'spark-changelogsfeed-google',
      title: 'Google (Changelogs)',
      privacy: 'public',
      _count: { notes: 5 },
    } as any,
    {
      id: 'f-cl-openai',
      slug: 'spark-changelogsfeed-openai',
      title: 'OpenAI (Changelogs)',
      privacy: 'public',
      _count: { notes: 7 },
    } as any,
  ];

  const aiNotes: Note[] = [
    {
      id: 'n-ai-1',
      title: 'AI Update 1',
      privacy: 'public',
      status: 'PUBLISHED',
      folderPath: 'Spark/AI',
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' },
    } as any,
    {
      id: 'n-ai-2',
      title: 'AI Update 2',
      privacy: 'public',
      status: 'PUBLISHED',
      folderPath: 'Spark/AI',
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' },
    } as any,
  ];

  const habrNotes: Note[] = [
    {
      id: 'n-habr-1',
      title: 'Habr Article 1',
      privacy: 'public',
      status: 'PUBLISHED',
      folderPath: 'Spark/Habr',
      feed: { id: 'f-habr', slug: 'spark-habr', title: 'Хабр & IT', privacy: 'public' },
    } as any,
  ];

  it('preserves other tab counters when in the context of one tab (selectedFeedSlug = spark-ai)', () => {
    // Initial state: User is at stream level, both notes loaded
    const initialNotes = [...aiNotes, ...habrNotes];

    const { result, rerender } = renderHook(
      (props) =>
        useFeedSourceTabs({
          streamSource: 'it_dev',
          setStreamSource: vi.fn(),
          selectedFeedSlug: props.selectedFeedSlug,
          setSelectedFeedSlug: vi.fn(),
          isPublicMode: false,
          appMode: 'dev',
          allFeeds: mockAllFeeds,
          notes: props.notes,
          isLoading: false,
        }),
      {
        wrapper: createWrapper(),
        initialProps: {
          selectedFeedSlug: undefined as string | undefined,
          notes: initialNotes,
        },
      }
    );

    // Initial check: both tabs have non-zero counts
    const aiTabInitial = result.current.activeTabs.find((t) => t.slug === 'spark-ai');
    const habrTabInitial = result.current.activeTabs.find((t) => t.slug === 'spark-habr');
    expect(aiTabInitial).toBeDefined();
    expect(habrTabInitial).toBeDefined();
    expect(aiTabInitial!.count).toBeGreaterThan(0);
    expect(habrTabInitial!.count).toBeGreaterThan(0);

    const initialHabrCount = habrTabInitial!.count;

    // User switches into the context of the AI tab:
    // Backend returns notes ONLY for spark-ai
    rerender({
      selectedFeedSlug: 'spark-ai',
      notes: aiNotes,
    });

    const aiTabSelected = result.current.activeTabs.find((t) => t.slug === 'spark-ai');
    const habrTabWhileAiActive = result.current.activeTabs.find((t) => t.slug === 'spark-habr');

    expect(aiTabSelected).toBeDefined();
    expect(aiTabSelected!.count).toBeGreaterThan(0);

    // CRITICAL BUG VERIFICATION:
    // When in context of AI tab, the Habr tab counter MUST NOT drop to 0 or disappear!
    expect(habrTabWhileAiActive).toBeDefined();
    expect(habrTabWhileAiActive!.count).toBe(initialHabrCount);
  });

  it('preserves telemetry counters when switching back and forth between tabs', () => {
    const { result, rerender } = renderHook(
      (props) =>
        useFeedSourceTabs({
          streamSource: 'it_dev',
          setStreamSource: vi.fn(),
          selectedFeedSlug: props.selectedFeedSlug,
          setSelectedFeedSlug: vi.fn(),
          isPublicMode: false,
          appMode: 'dev',
          allFeeds: mockAllFeeds,
          notes: props.notes,
          isLoading: false,
        }),
      {
        wrapper: createWrapper(),
        initialProps: {
          selectedFeedSlug: undefined as string | undefined,
          notes: [...aiNotes, ...habrNotes],
        },
      }
    );

    // Step 1: Switch to spark-habr (notes only has habrNotes)
    rerender({
      selectedFeedSlug: 'spark-habr',
      notes: habrNotes,
    });

    const aiTabWhileHabrActive = result.current.activeTabs.find((t) => t.slug === 'spark-ai');
    expect(aiTabWhileHabrActive).toBeDefined();
    expect(aiTabWhileHabrActive!.count).toBeGreaterThan(0);

    // Step 2: Switch to spark-ai (notes only has aiNotes)
    rerender({
      selectedFeedSlug: 'spark-ai',
      notes: aiNotes,
    });

    const habrTabWhileAiActive = result.current.activeTabs.find((t) => t.slug === 'spark-habr');
    expect(habrTabWhileAiActive).toBeDefined();
    expect(habrTabWhileAiActive!.count).toBeGreaterThan(0);
  });

  it('populates other tabs telemetry from backend feeds count even on direct tab landing', () => {
    // User directly lands on /spark-ai without ever loading stream-level notes first
    const { result } = renderHook(
      () =>
        useFeedSourceTabs({
          streamSource: 'it_dev',
          setStreamSource: vi.fn(),
          selectedFeedSlug: 'spark-ai',
          setSelectedFeedSlug: vi.fn(),
          isPublicMode: false,
          appMode: 'dev',
          allFeeds: mockAllFeeds,
          notes: aiNotes, // only ai notes loaded
          isLoading: false,
        }),
      { wrapper: createWrapper() }
    );

    const habrTab = result.current.activeTabs.find((t) => t.slug === 'spark-habr');
    expect(habrTab).toBeDefined();
    // Habr should reflect the backend feed count (12) instead of 0
    expect(habrTab!.count).toBe(12);
  });

  it('retains rolled-up subtopics and subtopic counts for changelogs when in another tab', () => {
    const changelogNote: Note = {
      id: 'n-cl-1',
      title: 'Google Release 1.0',
      privacy: 'public',
      status: 'PUBLISHED',
      folderPath: 'Spark/changelogsfeed/google',
      feed: {
        id: 'f-cl-google',
        slug: 'spark-changelogsfeed-google',
        title: 'Google (Changelogs)',
        privacy: 'public',
      },
    } as any;

    const { result, rerender } = renderHook(
      (props) =>
        useFeedSourceTabs({
          streamSource: 'it_dev',
          setStreamSource: vi.fn(),
          selectedFeedSlug: props.selectedFeedSlug,
          setSelectedFeedSlug: vi.fn(),
          isPublicMode: false,
          appMode: 'dev',
          allFeeds: mockAllFeeds,
          notes: props.notes,
          isLoading: false,
        }),
      {
        wrapper: createWrapper(),
        initialProps: {
          selectedFeedSlug: undefined as string | undefined,
          notes: [changelogNote, ...aiNotes],
        },
      }
    );

    const changelogsTab = result.current.activeTabs.find((t) => t.slug === 'spark-changelogsfeed');
    expect(changelogsTab).toBeDefined();
    expect(changelogsTab!.subtopics).toBeDefined();
    expect(changelogsTab!.subtopics!.length).toBeGreaterThan(0);

    // Switch to AI tab (notes only contains aiNotes)
    rerender({
      selectedFeedSlug: 'spark-ai',
      notes: aiNotes,
    });

    const changelogsTabWhileAi = result.current.activeTabs.find((t) => t.slug === 'spark-changelogsfeed');
    expect(changelogsTabWhileAi).toBeDefined();
    expect(changelogsTabWhileAi!.count).toBeGreaterThan(0);
    expect(changelogsTabWhileAi!.subtopics).toBeDefined();
    expect(changelogsTabWhileAi!.subtopics!.length).toBeGreaterThan(0);
  });
});
