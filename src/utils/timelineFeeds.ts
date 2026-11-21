/**
 * Timeline Feeds & Arena Actors Domain Utilities
 *
 * Connects Lemon Seasons Feed App with Lemon Universe TimeLines:
 * - Detects feeds linked with TimeLines (e.g. #mode:timeline, #board:<slug>, the_lemon_team)
 * - Manages persona/actor profiles (Алексей, Antigravity Agent, Lemon Coder, Starleader)
 * - Generates URLs to TimeLine boards on remote/local environments
 */

import { slugsMatch } from '@lenta/shared';

export interface TimelineActor {
  id: string;
  handle: string;
  name: string;
  title: string;
  avatar: string;
  accent: 'rose' | 'violet' | 'cyan' | 'amber';
  emoji: string;
  badgeClass: string;
  avatarBgClass: string;
}

export const TIMELINE_ACTORS: TimelineActor[] = [
  {
    id: 'actor-alexey',
    handle: 'alexey_bathrobe',
    name: 'Алексей (в халате)',
    title: 'Архитектор Уюта & Неформальный Лидер',
    avatar: 'alexey',
    accent: 'rose',
    emoji: '🌹',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    avatarBgClass: 'bg-rose-500/20 text-rose-500 border-rose-500/40',
  },
  {
    id: 'actor-antigravity-agent',
    handle: 'antigravity_agent',
    name: 'Antigravity Agent',
    title: 'Автономный AI-Архитектор & Кодинг-Агент',
    avatar: 'antigravity-agent',
    accent: 'violet',
    emoji: '🟣',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    avatarBgClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  {
    id: 'actor-lemon-coder',
    handle: 'lemon_dev',
    name: 'Программист (Lemon Team)',
    title: 'Fullstack Инженер & Кодер Lemon Universe',
    avatar: 'lemon-coder',
    accent: 'cyan',
    emoji: '💻',
    badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    avatarBgClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  },
  {
    id: 'actor-starleader',
    handle: 'starleader',
    name: 'ТимЛид Старлидер',
    title: 'Технический Лидер & Архитектор Seasons',
    avatar: 'starleader',
    accent: 'amber',
    emoji: '⚡',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    avatarBgClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
];

export interface FeedTimelineMetaCandidate {
  id?: string;
  slug?: string;
  hashtags?: Array<{ name: string } | string> | null;
  metadata?: any;
}

/**
 * Checks whether a feed or slug belongs to a TimeLine board stream.
 */
export function isTimelineFeed(feed?: FeedTimelineMetaCandidate | null): boolean {
  if (!feed) return false;
  const slug = (feed.slug || '').toLowerCase();
  if (slugsMatch(slug, 'the_lemon_team') || slugsMatch(slug, 'the-lemon-team')) {
    return true;
  }

  if (feed.metadata?.boardMode === 'TIMELINE' || feed.metadata?.boardSlug) {
    return true;
  }

  if (Array.isArray(feed.hashtags)) {
    return feed.hashtags.some((h) => {
      const name = (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim();
      return name === 'mode:timeline' || name.startsWith('board:') || name === 'lemon-universe';
    });
  }

  return false;
}

/**
 * Resolves the TimeLine board slug from feed hashtags, metadata or fallback.
 */
export function extractTimelineBoardSlug(feed?: FeedTimelineMetaCandidate | null): string {
  if (!feed) return 'the-lemon-team-bcd';

  if (feed.metadata?.boardSlug) {
    return feed.metadata.boardSlug;
  }

  if (Array.isArray(feed.hashtags)) {
    for (const h of feed.hashtags) {
      const name = (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim();
      if (name.startsWith('board:')) {
        return name.slice(6);
      }
    }
  }

  const slug = (feed.slug || '').toLowerCase();
  if (slugsMatch(slug, 'the_lemon_team') || slugsMatch(slug, 'the-lemon-team')) {
    return 'the-lemon-team-bcd';
  }

  return slug || 'the-lemon-team-bcd';
}

/**
 * Resolves the full URL to the TimeLine board in Lemon Universe.
 */
export function getTimelineWebUrl(boardSlug?: string): string {
  const isRemote =
    typeof window !== 'undefined' &&
    (window.location.hostname === '192.168.1.100' || window.location.hostname.includes('192.168.'));
  const baseHost = isRemote ? 'http://192.168.1.100:4210' : 'http://localhost:4322';
  return boardSlug ? `${baseHost}/timelines/${boardSlug}` : `${baseHost}/timelines`;
}

/**
 * Finds a known actor by id, handle, avatar key or name.
 */
export function findTimelineActor(idOrNameOrHandle?: string | null): TimelineActor | undefined {
  if (!idOrNameOrHandle) return undefined;
  const q = idOrNameOrHandle.toLowerCase().trim();
  return TIMELINE_ACTORS.find(
    (a) =>
      a.id.toLowerCase() === q ||
      a.name.toLowerCase() === q ||
      a.handle.toLowerCase() === q ||
      a.avatar.toLowerCase() === q
  );
}
