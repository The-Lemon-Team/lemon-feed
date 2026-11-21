import dayjs from 'dayjs';
import { toDateTimeLocalInput, fromDateTimeLocalInput } from '@lenta/shared';
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
  eventDate: string; // 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm'
  targetPrivacy: 'private' | 'public';
  targetStatus: 'DRAFT' | 'PUBLISHED';
  feedId?: string | null;
  metadata?: any;
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
  const originalFormattedDateTime = originalStartDate
    ? toDateTimeLocalInput(originalStartDate)
    : '';

  let startDate: string | undefined;
  if (!values.eventDate) {
    startDate = undefined;
  } else if (values.eventDate.includes('T')) {
    if (values.eventDate === originalFormattedDateTime && originalStartDate) {
      // Untouched datetime-local: strictly keep existing ISO string (including seconds/ms)
      startDate = originalStartDate;
    } else {
      // User explicitly edited date or time
      startDate = fromDateTimeLocalInput(values.eventDate);
    }
  } else if (values.eventDate === originalFormattedDate && originalStartDate) {
    // Untouched date: strictly keep existing ISO string with full time precision
    startDate = originalStartDate;
  } else {
    // User explicitly picked a different date-only value
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

  // 4. Safe feed handling:
  let feedPayload: { feedId?: string | null; publicFeedId?: string | null } = {};
  if (values.feedId !== undefined) {
    const cleanFeedId = values.feedId ? values.feedId.trim() : null;
    feedPayload = {
      feedId: cleanFeedId,
      publicFeedId: values.targetPrivacy === 'public' ? cleanFeedId : (raw.publicFeedId ? null : undefined),
    };
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
    ...feedPayload,
    ...(publishAt !== undefined ? { publishAt } : {}),
    ...(values.metadata !== undefined
      ? { metadata: values.metadata }
      : raw.metadata !== undefined
      ? { metadata: raw.metadata }
      : {}),
  };
}
