import { describe, it, expect } from 'vitest';
import { createConfiguredFeedAdapter } from '../configuredFeedAdapter';
import { DEFAULT_FEED_MODES } from '../../../components/toolbar/types';
import type { Note } from '@lenta/shared';

describe('createConfiguredFeedAdapter with DEFAULT_FEED_MODES', () => {
  const sampleNotes: Note[] = [
    {
      id: 'n-ai-1',
      title: 'Claude 3.7 Sonnet Announcement',
      description: 'Hybrid reasoning model release',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' },
      hashtags: [{ name: 'ai' }, { name: 'release' }],
      folderPath: 'Spark/AI/Claude.md',
    } as any,
    {
      id: 'n-seasons-1',
      title: 'Daily Log 31.10.2026',
      description: 'Working on feed architecture refactoring',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-daily', slug: 'daily-logs', title: 'Daily Logs', privacy: 'public' },
      hashtags: [{ name: 'daily' }, { name: 'lemon' }],
      folderPath: '01_daily_logs/2026-10-31.md',
    } as any,
    {
      id: 'n-entertainment-1',
      title: 'Avengers: Secret Wars Teaser',
      description: 'New details from Marvel Studios',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-marvel', slug: 'marvel', title: 'Marvel Universe', privacy: 'public' },
      hashtags: [{ name: 'marvel' }, { name: 'cinema' }],
      folderPath: 'Entertainment/Marvel.md',
    } as any,
    {
      id: 'n-holiday-1',
      title: 'День народного единства',
      description: 'Государственный праздник РФ',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-11-04'),
      feed: { id: 'f-holidays', slug: 'russian-holidays', title: 'Праздники РФ', privacy: 'public' },
      hashtags: [{ name: 'holiday' }],
      folderPath: 'Holidays/Russia.md',
    } as any,
    {
      id: 'n-private-1',
      title: 'Internal Architecture Spec',
      description: 'Confidential system design doc',
      privacy: 'private',
      status: 'DRAFT',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-priv', slug: 'work-vault', title: 'Work Vault', privacy: 'private' },
      hashtags: [{ name: 'private' }],
      folderPath: 'private/architecture.md',
    } as any,
  ];

  it('correctly adapts IT & Dev notes based on filterConfig', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    expect(itDevMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(itDevMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-ai-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-entertainment-1')).toBe(false);
    expect(adapted.some((item) => item.id === 'n-private-1')).toBe(false);
  });

  it('correctly adapts Seasons notes based on filterConfig', () => {
    const seasonsMode = DEFAULT_FEED_MODES.find((m) => m.id === 'seasons')!;
    expect(seasonsMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(seasonsMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-seasons-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-ai-1')).toBe(false);
  });

  it('correctly adapts Entertainment notes based on filterConfig', () => {
    const entMode = DEFAULT_FEED_MODES.find((m) => m.id === 'entertainment')!;
    expect(entMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(entMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-entertainment-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-holiday-1')).toBe(false);
  });

  it('correctly adapts Holidays notes based on filterConfig', () => {
    const holidaysMode = DEFAULT_FEED_MODES.find((m) => m.id === 'holidays')!;
    expect(holidaysMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(holidaysMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-holiday-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-seasons-1')).toBe(false);
  });

  it('strictly isolates Private notes when privacy=private filter is configured', () => {
    const privateMode = DEFAULT_FEED_MODES.find((m) => m.id === 'private_feeds')!;
    expect(privateMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(privateMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.length).toBe(1);
    expect(adapted[0].id).toBe('n-private-1');
  });

  it('generates thematic tabs for matching feeds', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    const adapter = createConfiguredFeedAdapter(itDevMode);

    const tabs = adapter.getTabs({
      allFeeds: [{ id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' }],
      notes: sampleNotes,
    });

    expect(tabs.some((t) => t.slug === 'spark-ai')).toBe(true);
  });
});
