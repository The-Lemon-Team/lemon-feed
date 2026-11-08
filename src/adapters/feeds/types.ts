import { Note } from '@lenta/shared';

export type FeedPrivacyFilter = 'all' | 'public' | 'private';

export interface FeedTabFilterConfig {
  privacy?: FeedPrivacyFilter;
  feedSlugs?: string[];
  folderPaths?: string[];
  categories?: string[];
  tags?: string[];
}

export type FeedSourceMode =
  | 'all'
  | 'it_dev'
  | 'seasons'
  | 'entertainment'
  | 'holidays'
  | 'telegram'
  | 'private_feeds'
  | 'spark'
  | 'dev'
  | 'classic'
  | 'general'
  | (string & {});

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
  audios?: Array<{ url: string; title?: string; duration?: number | null; mimeType?: string }>;
  status?: string | null;
  author?: string | null;
  curator?: string | null;
  hashtags?: string[];
  coverUrl?: string | null;
  isHot?: boolean;
  rawPayload: Note | any;
}

export interface NoteAudioAttachment {
  url: string;
  title?: string;
  duration?: number | null;
  mimeType?: string;
}

export function extractNoteCoverUrl(note: any): string | null {
  if (!note) return null;
  if (Array.isArray(note.images) && note.images.length > 0) {
    const mainImg = note.images.find((img: any) => img.isMain);
    return mainImg?.url || note.images[0]?.url || null;
  }
  return null;
}

export function extractNoteAudioFields(note: any): {
  audioUrl: string | null;
  audioDuration: number | null;
  audios?: NoteAudioAttachment[];
} {
  if (!note) {
    return { audioUrl: null, audioDuration: null };
  }
  const meta = (note.metadata as any) || {};
  const rawAudios = Array.isArray(meta.audios)
    ? meta.audios.filter((a: any) => a && typeof a.url === 'string' && a.url.trim().length > 0)
    : undefined;
  const primaryUrl =
    meta.audioUrl ||
    meta.podcast?.audioUrl ||
    note.audioUrl ||
    (rawAudios && rawAudios.length > 0 ? rawAudios[0].url : null) ||
    null;
  const duration =
    meta.audioDuration ??
    meta.podcast?.duration ??
    note.audioDuration ??
    (rawAudios && rawAudios.length > 0 ? rawAudios[0].duration ?? null : null) ??
    null;

  return {
    audioUrl: primaryUrl,
    audioDuration: typeof duration === 'number' ? duration : null,
    ...(rawAudios && rawAudios.length > 0 ? { audios: rawAudios } : {}),
  };
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
  isHot?: boolean;
  badgeLabel?: string;
  subtopics?: UnifiedSubtopic[];
}

export interface FeedAdapterContext {
  allFeeds: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    privacy?: 'public' | 'private' | string;
    icon?: string | null;
    color?: string | null;
    folderPaths?: string[];
    hashtags?: string[];
    _count?: { notes: number };
  }>;
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
