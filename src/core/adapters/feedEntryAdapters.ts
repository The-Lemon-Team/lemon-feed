import React from 'react';
import { Globe, Lock } from 'lucide-react';
import type { LemonModerationItem } from '@lenta/lemon-bus';
import { UnifiedFeedItem } from '../../adapters/feeds/types';
import { FeedAppRuntimeMode } from '../../utils/appMode';
import {
  CoreWatcherStreamItem,
  FeedEntry,
  FeedEntryBadge,
  FeedScenarioAdapter,
} from '../types';

export interface NoteFeedEntryMeta {
  unifiedItem: UnifiedFeedItem;
  folderPath?: string | null;
  privacy: 'public' | 'private';
}

export interface WatcherFeedEntryMeta {
  streamItem: CoreWatcherStreamItem;
  watcherId: string;
  watcherSlug: string;
  feedSlug: string;
  noteId?: string | null;
}

export interface ModerationFeedEntryMeta {
  moderationItem: LemonModerationItem;
  feedSlug?: string | null;
  streamSlug?: string | null;
  privacy: 'public' | 'private';
  rejectReason?: string | null;
}

const WATCHER_CATEGORY_META: Record<
  string,
  { label: string; emoji: string; colorClass: string }
> = {
  ai: {
    label: 'AI & Нейросети',
    emoji: '🤖',
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/25',
  },
  cybersec: {
    label: 'Кибербезопасность',
    emoji: '🛡️',
    colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/25',
  },
  habr: {
    label: 'Хабр & IT',
    emoji: '💻',
    colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/25',
  },
  politics: {
    label: 'Политика & Мир',
    emoji: '🌍',
    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25',
  },
  frontier: {
    label: 'Фронтир & Tech',
    emoji: '🚀',
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/25',
  },
};

export function createNoteScenarioAdapter(
  appMode: FeedAppRuntimeMode = 'staging'
): FeedScenarioAdapter<UnifiedFeedItem, NoteFeedEntryMeta> {
  return {
    scenarioId: 'notes',
    label: 'Lemon Notes',
    mapItem: (item) => unifiedItemToFeedEntry(item, appMode),
    mapItems: (items) => items.map((item) => unifiedItemToFeedEntry(item, appMode)),
  };
}

export function unifiedItemToFeedEntry(
  item: UnifiedFeedItem,
  appMode: FeedAppRuntimeMode = 'staging'
): FeedEntry<NoteFeedEntryMeta> {
  const isPrivate =
    item.rawPayload?.privacy === 'private' ||
    item.sourceType === 'private_feeds' ||
    item.rawPayload?.feed?.privacy === 'private';

  const badges: FeedEntryBadge[] = [];

  if (item.timeSlot) {
    badges.push({
      id: 'timeslot',
      label:
        item.timeSlot === 'MORNING'
          ? 'Утро'
          : item.timeSlot === 'AFTERNOON'
            ? 'День'
            : 'Вечер',
      tone: 'neutral',
    });
  }

  badges.push(
    isPrivate
      ? {
          id: 'privacy',
          label: 'Private',
          title: 'Приватная заметка (Private)',
          tone: 'purple',
          testId: 'note-privacy-badge-private',
          icon: React.createElement(Lock, {
            className: 'w-2.5 h-2.5 text-purple-500 dark:text-purple-400',
          }),
        }
      : {
          id: 'privacy',
          label: 'Public',
          title: 'Публичная заметка (Public)',
          tone: 'info',
          testId: 'note-privacy-badge-public',
          icon: React.createElement(Globe, {
            className: 'w-2.5 h-2.5 text-sky-500 dark:text-sky-400',
          }),
        }
  );

  const coverUrl =
    item.coverUrl ||
    item.rawPayload?.images?.find((img: any) => img.isMain)?.url ||
    item.rawPayload?.images?.[0]?.url ||
    null;

  const images = Array.isArray(item.rawPayload?.images)
    ? item.rawPayload.images
    : coverUrl
      ? [{ id: 'main', url: coverUrl, isMain: true }]
      : [];

  return {
    id: item.id,
    title: item.title,
    excerpt: item.summary || (item.rawPayload as any)?.summary || null,
    bodyMarkdown: item.description,
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt,
    url: item.sourceLink,
    coverUrl,
    images,
    source: {
      id: item.feedSlug,
      title: item.channelTitle,
      handle: item.channelHandle,
      avatarIcon: item.avatarIcon,
    },
    category: item.category,
    tags: item.hashtags,
    score: item.resonanceScore,
    author: item.curator,
    status: item.status,
    badges,
    meta: {
      unifiedItem: item,
      folderPath:
        appMode === 'staging' ? ((item.rawPayload as any)?.folderPath ?? null) : null,
      privacy: isPrivate ? 'private' : 'public',
    },
  };
}

export const watcherScenarioAdapter: FeedScenarioAdapter<
  CoreWatcherStreamItem,
  WatcherFeedEntryMeta
> = {
  scenarioId: 'watchers',
  label: 'Lemon Watchers Stream',
  mapItem: watcherStreamItemToFeedEntry,
  mapItems: (items) => items.map(watcherStreamItemToFeedEntry),
};

export function watcherStreamItemToFeedEntry(
  item: CoreWatcherStreamItem
): FeedEntry<WatcherFeedEntryMeta> {
  const catMeta = WATCHER_CATEGORY_META[item.category] || {
    label: item.category || 'Новости',
    emoji: '📰',
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
  };

  const badges: FeedEntryBadge[] = [];
  if (item.status === 'PROMOTED') {
    badges.push({
      id: 'status',
      label: 'В шине',
      tone: 'success',
      title: 'Новость отправлена в основную шину (Note)',
    });
  } else if (item.status === 'DISMISSED') {
    badges.push({
      id: 'status',
      label: 'Скрыта',
      tone: 'neutral',
      title: 'Новость скрыта из премодерации',
    });
  } else if (item.status === 'CONVERTING') {
    badges.push({
      id: 'status',
      label: 'AI-обработка…',
      tone: 'warning',
    });
  } else if (item.status === 'FAILED') {
    badges.push({
      id: 'status',
      label: 'Ошибка',
      tone: 'danger',
    });
  } else {
    badges.push({
      id: 'status',
      label: 'Новая',
      tone: 'info',
    });
  }

  return {
    id: item.id,
    title: item.title || item.url,
    excerpt: item.teaser || null,
    bodyMarkdown: item.teaser || null,
    publishedAt: item.pubDate || item.createdAt,
    url: item.url,
    coverUrl: item.imageUrl || null,
    images: item.imageUrl ? [{ id: 'cover', url: item.imageUrl, isMain: true }] : [],
    source: {
      id: item.watcherId,
      title: item.watcherTitle || item.watcherSlug,
      handle: item.watcherSlug,
      avatarIcon: catMeta.emoji,
    },
    category: catMeta,
    tags: item.categories || [],
    author: item.author || item.watcherTitle,
    status: item.status,
    badges,
    meta: {
      streamItem: item,
      watcherId: item.watcherId,
      watcherSlug: item.watcherSlug,
      feedSlug: item.feedSlug,
      noteId: item.noteId,
    },
  };
}

export const moderationScenarioAdapter: FeedScenarioAdapter<
  LemonModerationItem,
  ModerationFeedEntryMeta
> = {
  scenarioId: 'moderation',
  label: 'Lemon-Bus Moderation',
  mapItem: moderationItemToFeedEntry,
  mapItems: (items) => items.map(moderationItemToFeedEntry),
};

export function moderationItemToFeedEntry(
  item: LemonModerationItem
): FeedEntry<ModerationFeedEntryMeta> {
  const catKey = (item.category || '').toLowerCase();
  const catMeta = WATCHER_CATEGORY_META[catKey] || {
    label: item.category || 'Шина',
    emoji: item.icon || '📰',
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
  };

  const badges: FeedEntryBadge[] = [];
  if (item.status === 'APPROVED') {
    badges.push({
      id: 'status',
      label: 'Одобрено',
      tone: 'success',
      title: 'Заметка одобрена и отправлена в боевую ленту',
    });
  } else if (item.status === 'REJECTED') {
    badges.push({
      id: 'status',
      label: 'Отклонено',
      tone: 'danger',
      title: item.rejectReason || 'Заметка отклонена модератором',
    });
  } else {
    badges.push({
      id: 'status',
      label: 'На модерации',
      tone: 'warning',
    });
  }

  badges.push(
    item.privacy === 'private'
      ? {
          id: 'privacy',
          label: 'Private',
          tone: 'purple',
          icon: React.createElement(Lock, {
            className: 'w-2.5 h-2.5 text-purple-500 dark:text-purple-400',
          }),
        }
      : {
          id: 'privacy',
          label: 'Public',
          tone: 'info',
          icon: React.createElement(Globe, {
            className: 'w-2.5 h-2.5 text-sky-500 dark:text-sky-400',
          }),
        }
  );

  return {
    id: item.id,
    title: item.title,
    excerpt: item.summary || item.description || null,
    bodyMarkdown: item.rawContent || item.description || item.summary || null,
    publishedAt: item.startDate || item.createdAt,
    updatedAt: item.updatedAt,
    url: item.sourceLink || null,
    source: {
      id: item.feedSlug || item.sourceType || 'lemon-bus',
      title: item.author || item.sourceType || 'Вотчер',
      handle: item.feedSlug || undefined,
      avatarIcon: item.icon || catMeta.emoji,
    },
    category: catMeta,
    tags: item.hashtags || [],
    score: item.resonanceScore ?? undefined,
    author: item.author || null,
    status: item.status,
    badges,
    meta: {
      moderationItem: item,
      feedSlug: item.feedSlug,
      streamSlug: item.streamSlug,
      privacy: item.privacy,
      rejectReason: item.rejectReason,
    },
  };
}
