import type { UnifiedFeedItem } from '../adapters/feeds/types';

/** Minimal valid feed item; override anything via `over` (rawPayload is shallow-merged). */
export function makeFeedItem(
  over: Partial<Omit<UnifiedFeedItem, 'rawPayload'>> & { rawPayload?: Record<string, unknown> } = {}
): UnifiedFeedItem {
  const { rawPayload, ...rest } = over;
  return {
    id: 'note-1',
    sourceType: 'general',
    feedSlug: 'general',
    channelTitle: 'General',
    channelHandle: 'general',
    avatarIcon: '📁',
    category: { label: 'Общее', emoji: '📁', colorClass: '' },
    title: 'Original title',
    description: 'Original description',
    publishedAt: '2026-10-31T18:00:00.000Z',
    hashtags: ['alpha', '#beta'],
    rawPayload: {
      id: 'note-1',
      title: 'Original title',
      startDate: '2026-10-31T18:00:00.000Z',
      publishAt: null,
      status: 'DRAFT',
      privacy: 'private',
      ...rawPayload,
    },
    ...rest,
  };
}

export const makeFeed = (over: Record<string, unknown> = {}) => ({
  id: 'feed-1',
  slug: 'it-news',
  title: 'IT News',
  privacy: 'public',
  icon: '📰',
  ...over,
});
