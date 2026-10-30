import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { Note } from '@lenta/shared';
import { UnifiedFeedItem } from '../adapters/feeds/types';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export type FeedHorizon = 'recent' | 'upcoming';
export type PeriodFilterMode = 'bound' | 'all';
export type PeriodActivityStatus = 'active' | 'upcoming' | 'finished';

export interface PeriodMicroBadge {
  id: string;
  title: string;
  emoji: string;
  color: string;
  status: PeriodActivityStatus;
  isBound: boolean;
}

export interface PeriodItem {
  id: string;
  feedId?: string | null;
  feedSlug?: string | null;
  feedTitle?: string | null;
  title: string;
  description?: string | null;
  emoji: string;
  color: string;
  startDate: string;
  endDate?: string | null;
  status: PeriodActivityStatus;
  hashtags: string[];
  rawNote: Note;
}

const DEFAULT_EMOJI = '⏱️';
const DEFAULT_COLOR = '#8b5cf6';

/**
 * Resolves the activity status of a period Note:
 * - 'upcoming': startDate is strictly in the future.
 * - 'finished': endDate is in the past, or dormant for >10 days without activity.
 * - 'active': currently ongoing.
 */
export function getPeriodActivityStatus(note: Note, now = dayjs()): PeriodActivityStatus {
  const start = dayjs(note.startDate);
  if (start.isValid() && start.isAfter(now, 'day')) {
    return 'upcoming';
  }

  if (note.endDate) {
    const end = dayjs(note.endDate);
    if (end.isValid() && end.isBefore(now, 'day')) {
      return 'finished';
    }
  } else {
    // Dormancy check for open-ended periods (7-10 days inactivity)
    const meta = (note.metadata as any) || {};
    const lastActivity = meta.lastActivityAt || note.updatedAt || note.startDate;
    if (lastActivity) {
      const lastActDate = dayjs(lastActivity);
      if (lastActDate.isValid() && now.diff(lastActDate, 'day') > 10) {
        return 'finished';
      }
    }
  }

  return 'active';
}

/**
 * Extracts and maps all PERIOD notes from the raw list of notes.
 */
export function extractPeriodItems(notes: Note[]): PeriodItem[] {
  const now = dayjs();
  const periodNotes = notes.filter((n) => n.type === 'PERIOD' && n.status !== 'ARCHIVED');

  return periodNotes.map((n) => {
    const meta = (n.metadata as any) || {};
    const hashtags = Array.isArray(n.hashtags)
      ? n.hashtags.map((h: any) => (typeof h === 'string' ? h : h.name).replace(/^#/, '').toLowerCase())
      : [];

    return {
      id: n.id,
      feedId: n.feedId || null,
      feedSlug: n.feed?.slug || null,
      feedTitle: n.feed?.title || null,
      title: n.title,
      description: n.description || null,
      emoji: n.icon || meta.emoji || DEFAULT_EMOJI,
      color: meta.color || n.feed?.color || DEFAULT_COLOR,
      startDate: n.startDate,
      endDate: n.endDate || null,
      status: getPeriodActivityStatus(n, now),
      hashtags,
      rawNote: n,
    };
  });
}

/**
 * Sorts and filters items according to the selected horizon:
 * - 'recent': items with publishedAt <= today, sorted DESC (newest first).
 * - 'upcoming': items with publishedAt >= today, sorted ASC (earliest upcoming first).
 */
export function filterNotesByHorizon(
  items: UnifiedFeedItem[],
  horizon: FeedHorizon,
  now = dayjs()
): UnifiedFeedItem[] {
  const todayStart = now.startOf('day');

  if (horizon === 'upcoming') {
    return items
      .filter((item) => {
        const itemDate = dayjs(item.publishedAt);
        return itemDate.isValid() && itemDate.isSameOrAfter(todayStart);
      })
      .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  }

  // 'recent' mode: publishedAt <= today end, DESC
  const todayEnd = now.endOf('day');
  return items
    .filter((item) => {
      const itemDate = dayjs(item.publishedAt);
      return !itemDate.isValid() || itemDate.isSameOrBefore(todayEnd);
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/**
 * Checks if a note is semantically bound to a period (by parent link, hashtag overlap, or same feed).
 */
export function isNoteBoundToPeriod(item: UnifiedFeedItem, period: PeriodItem): boolean {
  const raw = item.rawPayload || {};

  // 1. Explicit parent-child synthesis link
  if (raw.parentNoteId && raw.parentNoteId === period.id) {
    return true;
  }

  // 2. Hashtag overlap
  if (period.hashtags.length > 0 && Array.isArray(item.hashtags)) {
    const itemTags = item.hashtags.map((t) => t.replace(/^#/, '').toLowerCase());
    const hasOverlap = period.hashtags.some((pt) => itemTags.includes(pt));
    if (hasOverlap) return true;
  }

  // 3. Channel/feed origin if the period is declared in this feed
  if (period.feedId && (item.rawPayload?.feedId === period.feedId || item.feedSlug === period.feedSlug)) {
    // If same feed, check if the item falls inside the period's timeline window
    return isNoteInPeriodTimeWindow(item, period);
  }

  return false;
}

/**
 * Checks if a note chronologically falls into the period's start and end date window.
 */
export function isNoteInPeriodTimeWindow(item: UnifiedFeedItem, period: PeriodItem): boolean {
  const noteDate = dayjs(item.publishedAt);
  if (!noteDate.isValid()) return false;

  const startDate = dayjs(period.startDate).startOf('day');
  if (noteDate.isBefore(startDate)) return false;

  if (period.endDate) {
    const endDate = dayjs(period.endDate).endOf('day');
    return noteDate.isSameOrBefore(endDate);
  }

  return true;
}

/**
 * Filters feed items for a chosen period based on the filter mode:
 * - 'bound': strictly semantically related notes (parentNoteId, tags, feed campaign).
 * - 'all': time window clamp (everything that happened during these dates).
 */
export function filterNotesByPeriod(
  items: UnifiedFeedItem[],
  period: PeriodItem,
  mode: PeriodFilterMode
): UnifiedFeedItem[] {
  if (mode === 'bound') {
    return items.filter((item) => isNoteBoundToPeriod(item, period));
  }
  return items.filter((item) => isNoteInPeriodTimeWindow(item, period));
}

/**
 * Extracts micro-badges for an item against all active or selected periods.
 * Returns up to 3 visible badges and the remainder in overflow.
 */
export function extractPeriodMicroBadges(
  item: UnifiedFeedItem,
  allPeriods: PeriodItem[],
  selectedPeriodId?: string
): { visible: PeriodMicroBadge[]; overflow: PeriodMicroBadge[] } {
  const matchedBadges: PeriodMicroBadge[] = [];

  for (const period of allPeriods) {
    const isBound = isNoteBoundToPeriod(item, period);
    const inTimeWindow = isNoteInPeriodTimeWindow(item, period);

    // If a specific period is selected, only badge if it matches that period (or is bound)
    if (selectedPeriodId) {
      if (period.id === selectedPeriodId && (isBound || inTimeWindow)) {
        matchedBadges.push({
          id: period.id,
          title: period.title,
          emoji: period.emoji,
          color: period.color,
          status: period.status,
          isBound,
        });
      }
    } else if (isBound || (inTimeWindow && period.status === 'active')) {
      matchedBadges.push({
        id: period.id,
        title: period.title,
        emoji: period.emoji,
        color: period.color,
        status: period.status,
        isBound,
      });
    }
  }

  // Prioritize bound badges first, then active
  matchedBadges.sort((a, b) => {
    if (a.isBound !== b.isBound) return a.isBound ? -1 : 1;
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return 0;
  });

  return {
    visible: matchedBadges.slice(0, 3),
    overflow: matchedBadges.slice(3),
  };
}
