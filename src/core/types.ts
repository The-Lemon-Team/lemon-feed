import React from 'react';
import type { WatcherStreamItem, WatcherStreamStatus } from '@lenta/seasons-neurons';

export type FeedBadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'amber';

export interface FeedEntryBadge {
  id: string;
  label: string;
  title?: string;
  tone?: FeedBadgeTone;
  icon?: React.ReactNode;
  testId?: string;
}

export interface FeedEntryCategory {
  label: string;
  emoji: string;
  colorClass: string;
}

export interface FeedEntrySource {
  id: string;
  title: string;
  handle?: string;
  avatarIcon?: string;
  avatarUrl?: string | null;
}

export interface FeedEntryImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  isMain?: boolean;
}

/**
 * Domain-agnostic feed item contract for FeedCore.
 * Can represent a rich Note, a lightweight Watcher stream item, a Telegram post, etc.
 */
export interface FeedEntry<TMeta = any> {
  id: string;
  title: string;
  excerpt?: string | null;
  bodyMarkdown?: string | null;
  publishedAt: string;
  updatedAt?: string | null;
  url?: string | null;
  coverUrl?: string | null;
  images?: FeedEntryImage[];
  source: FeedEntrySource;
  category: FeedEntryCategory;
  tags?: string[];
  score?: number;
  author?: string | null;
  status?: string | null;
  badges?: FeedEntryBadge[];
  meta?: TMeta;
}

export interface FeedCoreTab {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  emoji: string;
  count: number;
  description?: string;
  badgeLabel?: string;
  isHot?: boolean;
}

/**
 * Scenario adapter contract for mapping any backend entity into FeedEntry.
 */
export interface FeedScenarioAdapter<TRaw, TMeta = any> {
  scenarioId: 'notes' | 'watchers' | (string & {});
  label: string;
  mapItem: (raw: TRaw) => FeedEntry<TMeta>;
  mapItems: (items: TRaw[]) => FeedEntry<TMeta>[];
}

export interface FeedCardSlots<TEntry extends FeedEntry<any> = FeedEntry> {
  renderTopBar?: (entry: TEntry) => React.ReactNode;
  renderHeaderBadges?: (entry: TEntry) => React.ReactNode;
  renderHeaderActions?: (entry: TEntry) => React.ReactNode;
  renderBodyExtras?: (entry: TEntry) => React.ReactNode;
  renderFooterLeft?: (entry: TEntry) => React.ReactNode;
  renderFooterActions?: (entry: TEntry) => React.ReactNode;
}

export interface FeedDetailSlots<TEntry extends FeedEntry<any> = FeedEntry> {
  renderBreadcrumb?: (entry: TEntry) => React.ReactNode;
  renderHeaderBadges?: (entry: TEntry) => React.ReactNode;
  renderBodyExtras?: (entry: TEntry) => React.ReactNode;
  renderAfterMarkdown?: (entry: TEntry) => React.ReactNode;
  renderFooterLeft?: (entry: TEntry) => React.ReactNode;
  renderFooterRight?: (entry: TEntry) => React.ReactNode;
}

export type CoreWatcherStreamStatus = WatcherStreamStatus;

export type CoreWatcherStreamItem = WatcherStreamItem;
