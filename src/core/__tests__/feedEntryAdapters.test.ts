import { describe, it, expect } from 'vitest';
import {
  createNoteScenarioAdapter,
  moderationScenarioAdapter,
  watcherScenarioAdapter,
} from '../adapters/feedEntryAdapters';
import type { WatcherStreamItem } from '@lenta/seasons-neurons';
import type { LemonModerationItem } from '@lenta/lemon-bus';
import type { UnifiedFeedItem } from '../../adapters/feeds/types';

describe('feedEntryAdapters (@feed-core)', () => {
  it('maps UnifiedFeedItem via createNoteScenarioAdapter with binary privacy badge', () => {
    const adapter = createNoteScenarioAdapter('staging');
    const unified: UnifiedFeedItem = {
      id: 'note-1',
      title: 'Test Note',
      description: 'Body text',
      summary: 'Short excerpt',
      publishedAt: '2026-11-18T10:00:00.000Z',
      sourceType: 'spark',
      feedSlug: 'spark-ai',
      channelTitle: 'Spark AI',
      channelHandle: '@spark_ai',
      avatarIcon: '🤖',
      category: { label: 'AI', emoji: '🤖', colorClass: 'bg-indigo-500/10' },
      hashtags: ['ai'],
      curator: 'Curator',
      status: 'DRAFT',
      rawPayload: {
        privacy: 'private',
        folderPath: 'Spark/AI',
      },
    };

    const entry = adapter.mapItem(unified);
    expect(entry.id).toBe('note-1');
    expect(entry.meta?.privacy).toBe('private');
    expect(entry.meta?.folderPath).toBe('Spark/AI');
    expect(entry.badges?.some((b) => b.id === 'privacy' && b.label === 'Private')).toBe(true);
  });

  it('maps WatcherStreamItem via watcherScenarioAdapter', () => {
    const streamItem: WatcherStreamItem = {
      id: 'w-10',
      watcherId: 'watcher-1',
      watcherSlug: 'deepmind',
      watcherTitle: 'DeepMind Blog',
      category: 'ai',
      feedSlug: 'spark-ai',
      guid: 'guid-10',
      url: 'https://deepmind.google/post',
      title: 'New Model',
      teaser: 'Model teaser',
      author: 'DeepMind',
      pubDate: '2026-11-18T12:00:00.000Z',
      categories: ['ai', 'llm'],
      status: 'NEW',
      createdAt: '2026-11-18T12:00:00.000Z',
    };

    const entry = watcherScenarioAdapter.mapItem(streamItem);
    expect(entry.id).toBe('w-10');
    expect(entry.source.handle).toBe('deepmind');
    expect(entry.badges?.some((b) => b.id === 'status' && b.label === 'Новая')).toBe(true);
    expect(entry.meta?.streamItem.id).toBe('w-10');
  });

  it('maps LemonModerationItem via moderationScenarioAdapter', () => {
    const modItem: LemonModerationItem = {
      id: 'mod-10',
      title: 'Moderation Candidate',
      summary: 'Digest summary',
      rawContent: 'Full markdown content',
      category: 'cybersec',
      feedSlug: 'spark-sec',
      type: 'SINGLE',
      privacy: 'public',
      sourceLink: 'https://example.com/sec',
      sourceType: 'LEMON_WATCHERS',
      origin: 'CODING_AGENT',
      author: 'SecOps',
      resonanceScore: 91,
      hashtags: ['security'],
      status: 'PENDING',
      metadata: {},
      deviceId: 'bus-1',
      createdAt: '2026-11-18T14:00:00.000Z',
      updatedAt: '2026-11-18T14:00:00.000Z',
    };

    const entry = moderationScenarioAdapter.mapItem(modItem);
    expect(entry.id).toBe('mod-10');
    expect(entry.score).toBe(91);
    expect(entry.category.emoji).toBe('🛡️');
    expect(entry.meta?.privacy).toBe('public');
    expect(entry.badges?.some((b) => b.id === 'status' && b.label === 'На модерации')).toBe(true);
    expect(entry.badges?.some((b) => b.id === 'privacy' && b.label === 'Public')).toBe(true);
  });
});
