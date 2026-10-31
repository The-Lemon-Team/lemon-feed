import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSafeNoteUpdatePayload, type NoteFormValues } from '../noteFormPayload';
import type { UnifiedFeedItem } from '../../adapters/feeds/types';

describe('buildSafeNoteUpdatePayload', () => {
  const mockBaseItem: UnifiedFeedItem = {
    id: 'note-hw-1',
    sourceType: 'holidays',
    avatarIcon: '👻',
    feedSlug: 'world-holidays',
    channelTitle: 'Праздники стран мира',
    channelHandle: 'world-holidays',
    category: { label: 'Праздники', emoji: '🎉', colorClass: '' },
    title: 'Хэллоуин (Канун Дня всех святых)',
    description: 'Древний праздник Самайн...',
    publishedAt: '2026-10-31T18:00:00.000Z',
    hashtags: ['#halloween', '#хэллоуин'],
    rawPayload: {
      id: 'note-hw-1',
      title: 'Хэллоуин (Канун Дня всех святых)',
      startDate: '2026-10-31T18:00:00.000Z',
      publishAt: null,
      status: 'PUBLISHED',
      privacy: 'public',
      description: 'Древний праздник Самайн...',
    },
  };

  it('preserves original startDate time and does not overwrite publishAt when user saves without changing date', () => {
    const formValues: NoteFormValues = {
      title: 'Хэллоуин (Канун Дня всех святых)',
      description: 'Древний праздник Самайн...',
      hashtagsStr: '#halloween #хэллоуин',
      eventDate: '2026-10-31', // same date as original 2026-10-31T18:00:00.000Z
      targetPrivacy: 'public',
      targetStatus: 'PUBLISHED',
    };

    const payload = buildSafeNoteUpdatePayload(mockBaseItem, formValues);

    // CRITICAL: startDate must retain the full ISO time (18:00:00.000Z), not truncated to 00:00:00.000Z!
    assert.strictEqual(payload.startDate, '2026-10-31T18:00:00.000Z');
    // CRITICAL: publishAt must NOT be overwritten with new Date() if already published historically!
    assert.strictEqual(payload.publishAt, undefined);
    assert.strictEqual(payload.status, 'PUBLISHED');
  });

  it('preserves existing publishAt timestamp if note was already published with a timestamp', () => {
    const itemWithPublishAt: UnifiedFeedItem = {
      ...mockBaseItem,
      rawPayload: {
        ...mockBaseItem.rawPayload,
        publishAt: '2026-10-25T10:00:00.000Z',
        status: 'PUBLISHED',
      },
    };

    const formValues: NoteFormValues = {
      title: 'Хэллоуин (Канун Дня всех святых)',
      description: 'Обновленное описание',
      hashtagsStr: '#halloween',
      eventDate: '2026-10-31',
      targetPrivacy: 'public',
      targetStatus: 'PUBLISHED',
    };

    const fixedNow = new Date('2026-10-31T07:23:50.000Z');
    const payload = buildSafeNoteUpdatePayload(itemWithPublishAt, formValues, () => fixedNow);

    // Existing publishAt MUST NOT be reset to fixedNow
    assert.strictEqual(payload.publishAt, '2026-10-25T10:00:00.000Z');
    assert.strictEqual(payload.startDate, '2026-10-31T18:00:00.000Z');
  });

  it('sets publishAt to current time when transitioning from DRAFT to PUBLISHED for the first time', () => {
    const draftItem: UnifiedFeedItem = {
      ...mockBaseItem,
      rawPayload: {
        ...mockBaseItem.rawPayload,
        status: 'DRAFT',
        publishAt: null,
      },
    };

    const formValues: NoteFormValues = {
      title: 'Хэллоуин (Канун Дня всех святых)',
      description: 'Древний праздник Самайн...',
      hashtagsStr: '#halloween',
      eventDate: '2026-10-31',
      targetPrivacy: 'public',
      targetStatus: 'PUBLISHED', // User approves & publishes!
    };

    const fixedNow = new Date('2026-10-31T07:23:50.000Z');
    const payload = buildSafeNoteUpdatePayload(draftItem, formValues, () => fixedNow);

    assert.strictEqual(payload.publishAt, '2026-10-31T07:23:50.000Z');
    assert.strictEqual(payload.status, 'PUBLISHED');
  });

  it('clears publishAt when unpublishing to DRAFT', () => {
    const publishedItem: UnifiedFeedItem = {
      ...mockBaseItem,
      rawPayload: {
        ...mockBaseItem.rawPayload,
        status: 'PUBLISHED',
        publishAt: '2026-10-25T10:00:00.000Z',
      },
    };

    const formValues: NoteFormValues = {
      title: 'Хэллоуин (Канун Дня всех святых)',
      description: 'Древний праздник Самайн...',
      hashtagsStr: '#halloween',
      eventDate: '2026-10-31',
      targetPrivacy: 'public',
      targetStatus: 'DRAFT',
    };

    const payload = buildSafeNoteUpdatePayload(publishedItem, formValues);
    assert.strictEqual(payload.publishAt, null);
    assert.strictEqual(payload.status, 'DRAFT');
  });

  it('updates startDate while preserving time if user explicitly changes eventDate', () => {
    const formValues: NoteFormValues = {
      title: 'Хэллоуин (Канун Дня всех святых)',
      description: 'Древний праздник Самайн...',
      hashtagsStr: '#halloween',
      eventDate: '2026-11-01', // User explicitly moves event by 1 day
      targetPrivacy: 'public',
      targetStatus: 'PUBLISHED',
    };

    const payload = buildSafeNoteUpdatePayload(mockBaseItem, formValues);
    // Should apply new date (2026-11-01) with original hours/minutes (18:00:00.000Z)
    assert.strictEqual(payload.startDate, '2026-11-01T18:00:00.000Z');
  });
});
