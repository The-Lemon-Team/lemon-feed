import { Note } from '@lenta/shared';

export type FeedSourceMode = 'spark' | 'dev' | 'seasons' | 'classic' | 'telegram';

export interface ThematicCategoryBadge {
  label: string;
  emoji: string;
  colorClass: string;
}

export interface UnifiedFeedItem {
  id: string;
  sourceType: FeedSourceMode;
  feedSlug: string;
  channelTitle: string;
  channelHandle: string;
  avatarIcon: string;
  category: ThematicCategoryBadge;
  title: string;
  description: string;
  summary?: string | null;
  publishedAt: string;
  updatedAt?: string | null;
  timeSlot?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  resonanceScore?: number;
  sourceLink?: string | null;
  audioUrl?: string | null;
  audioDuration?: number | null;
  status?: string | null;
  curator?: string | null;
  hashtags?: string[];
  coverUrl?: string | null;
  rawPayload: Note | any;
}

export function extractNoteCoverUrl(note: any): string | null {
  if (!note) return null;
  if (Array.isArray(note.images) && note.images.length > 0) {
    const mainImg = note.images.find((img: any) => img.isMain);
    return mainImg?.url || note.images[0]?.url || null;
  }
  return null;
}

export interface UnifiedSubtopic {
  id: string;
  slug: string;
  subfolder: string;
  title: string;
  emoji: string;
  count: number;
  accentColor?: string;
}

export interface UnifiedFeedTab {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  emoji: string;
  category: string;
  count: number;
  accentColor?: string;
  badgeBgLight?: string;
  badgeTextLight?: string;
  badgeBgDark?: string;
  badgeTextDark?: string;
  description?: string;
  isCustomFolder?: boolean;
  subtopics?: UnifiedSubtopic[];
}

export interface FeedAdapterContext {
  allFeeds: Array<{ id: string; slug: string; title: string; description?: string | null; _count?: { notes: number } }>;
  notes: Note[];
}

export interface FeedAdapter {
  sourceType: FeedSourceMode;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  getTabs: (context: FeedAdapterContext) => UnifiedFeedTab[];
  adaptNotes: (notes: Note[], activeFeedSlug?: string, searchQuery?: string) => UnifiedFeedItem[];
}
