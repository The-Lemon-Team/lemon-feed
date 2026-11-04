import { describe, it, expect } from 'vitest';
import { AllStreamsFeedAdapter } from '../allStreamsFeedAdapter';
import type { Note, Feed } from '@lenta/shared';

describe('AllStreamsFeedAdapter', () => {
  const sampleFeeds: Feed[] = [
    {
      id: 'f-ai',
      slug: 'spark-ai',
      title: 'AI (Spark)',
      privacy: 'public',
      icon: '🤖',
      color: '#8b5cf6',
      folderPaths: ['Spark/AI'],
      hashtags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any,
    {
      id: 'f-habr',
      slug: 'spark-habr',
      title: 'Habr (Spark)',
      privacy: 'public',
      icon: '💻',
      color: '#0ea5e9',
      folderPaths: ['Spark/Habr'],
      hashtags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any,
    // Private database feeds with count 0 (should NEVER leak into all streams tabs)
    {
      id: 'f-priv-1',
      slug: 'interesting-questions',
      title: 'Interesting Questions',
      privacy: 'private',
      icon: '📁',
      color: '#2481cc',
      folderPaths: [],
      hashtags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any,
    {
      id: 'f-priv-2',
      slug: 'my-movies',
      title: 'My Movies',
      privacy: 'private',
      icon: '📁',
      color: '#2481cc',
      folderPaths: [],
      hashtags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any,
    // Empty public database feed (should NOT be included when count is 0)
    {
      id: 'f-pub-empty',
      slug: 'public-stream',
      title: 'Public Stream',
      privacy: 'public',
      icon: '📁',
      color: '#2481cc',
      folderPaths: [],
      hashtags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any,
  ];

  const sampleNotes: Note[] = [
    {
      id: 'n-ai-1',
      title: 'Anthropic Claude 3.7 Release',
      description: 'Model announcement and benchmarks',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-11-03'),
      folderPath: 'Spark/AI',
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI (Spark)', privacy: 'public' },
    } as any,
    {
      id: 'n-ai-2',
      title: 'OpenAI Gemini Competitor Insights',
      description: 'Analysis of inference costs',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-11-03'),
      folderPath: 'Spark/AI',
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI (Spark)', privacy: 'public' },
    } as any,
    {
      id: 'n-habr-1',
      title: 'Architecture Patterns in TypeScript',
      description: 'DevOps and clean architecture tutorial',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-11-02'),
      folderPath: 'Spark/Habr',
      feed: { id: 'f-habr', slug: 'spark-habr', title: 'Habr (Spark)', privacy: 'public' },
    } as any,
  ];

  it('generates tabs without leaking private feeds or 0-count custom DB feeds', () => {
    const tabs = AllStreamsFeedAdapter.getTabs({
      allFeeds: sampleFeeds,
      notes: sampleNotes,
    });

    // 1. Hot tab is present with correct note count (daily sync items)
    const hotTab = tabs.find((t) => t.slug === 'hot-daily');
    expect(hotTab).toBeDefined();
    expect(hotTab!.count).toBe(3);

    // 2. Spark AI tab is present with 2 notes
    const aiTab = tabs.find((t) => t.slug === 'spark-ai');
    expect(aiTab).toBeDefined();
    expect(aiTab!.count).toBe(2);

    // 3. Private feeds MUST NOT be present
    expect(tabs.some((t) => t.slug === 'interesting-questions')).toBe(false);
    expect(tabs.some((t) => t.slug === 'my-movies')).toBe(false);

    // 4. Empty public database feeds (count 0) MUST NOT be present
    expect(tabs.some((t) => t.slug === 'public-stream')).toBe(false);
  });

  it('adapts notes correctly for hot-daily filter', () => {
    const items = AllStreamsFeedAdapter.adaptNotes(sampleNotes, 'hot-daily');
    expect(items.length).toBe(3);
  });

  it('adapts notes correctly for spark-ai filter', () => {
    const items = AllStreamsFeedAdapter.adaptNotes(sampleNotes, 'spark-ai');
    expect(items.length).toBe(2);
    expect(items.every((item) => item.feedSlug === 'spark-ai')).toBe(true);
  });
});
