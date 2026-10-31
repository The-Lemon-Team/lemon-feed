import dayjs from 'dayjs';
import type { UnifiedFeedItem } from '../adapters/feeds/types';
import type { UpdateNotePayload } from '../api/client';

export interface NoteFormValues {
  title: string;
  description: string;
  summary?: string;
  author?: string;
  curator?: string;
  sourceLink?: string;
  hashtagsStr: string;
  eventDate: string; // 'YYYY-MM-DD'
  targetPrivacy: 'private' | 'public';
  targetStatus: 'DRAFT' | 'PUBLISHED';
}

/**
 * Constructs a safe UpdateNotePayload preserving original timestamps:
 * 1. If eventDate was not modified by the user, preserves original startDate (including time and timezone).
 * 2. If the note was already PUBLISHED, preserves original publishAt without resetting it to 'now'.
 * 3. Only sets publishAt to 'now' when transitioning from DRAFT/unapproved to PUBLISHED.
 */
export function buildSafeNoteUpdatePayload(
  item: UnifiedFeedItem,
  values: NoteFormValues,
  nowProvider: () => Date = () => new Date()
): UpdateNotePayload {
  const raw = (item.rawPayload as any) || {};

  // 1. Tags normalization
  const tagsArray = values.hashtagsStr
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);

  // 2. Safe Date Preservation:
  const originalStartDate = raw.startDate || item.publishedAt;
  const originalFormattedDate = originalStartDate
    ? dayjs(originalStartDate).format('YYYY-MM-DD')
    : '';

  let startDate: string | undefined;
  if (!values.eventDate) {
    startDate = undefined;
  } else if (values.eventDate === originalFormattedDate && originalStartDate) {
    // Untouched date: strictly keep existing ISO string with full time precision
    startDate = originalStartDate;
  } else {
    // User explicitly picked a different date
    if (originalStartDate) {
      const origDayjs = dayjs(originalStartDate);
      const [y, m, d] = values.eventDate.split('-').map(Number);
      startDate = origDayjs.year(y).month(m - 1).date(d).toISOString();
    } else {
      startDate = new Date(values.eventDate).toISOString();
    }
  }

  // 3. Safe publishAt Preservation:
  let publishAt: string | null | undefined = undefined;
  if (values.targetStatus === 'PUBLISHED') {
    if (raw.publishAt) {
      // Already has a publication timestamp: preserve it
      publishAt = raw.publishAt;
    } else if (raw.status === 'PUBLISHED') {
      // Already published historically without explicit publishAt: do not overwrite
      publishAt = undefined;
    } else {
      // Transitioning from draft/null to PUBLISHED for the first time
      publishAt = nowProvider().toISOString();
    }
  } else {
    // Draft or staging
    publishAt = null;
  }

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    summary: values.summary?.trim() || undefined,
    author: values.author?.trim() || undefined,
    curator: values.author?.trim() || undefined,
    sourceLink: values.sourceLink?.trim() || undefined,
    hashtags: tagsArray,
    startDate,
    privacy: values.targetPrivacy,
    status: values.targetStatus,
    ...(publishAt !== undefined ? { publishAt } : {}),
  };
}
