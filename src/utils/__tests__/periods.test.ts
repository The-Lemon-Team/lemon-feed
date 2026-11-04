import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import type { Note } from '@lenta/shared';
import type { UnifiedFeedItem } from '../../adapters/feeds/types';
import {
  calculatePeriodMetrics,
  extractPeriodItems,
  extractPeriodMicroBadges,
  filterNotesByHorizon,
  filterNotesByPeriod,
  getPeriodActivityStatus,
  isNoteBoundToPeriod,
  isNoteInPeriodTimeWindow,
  type PeriodItem,
} from '../periods';

// Local-time timestamps (no "Z") keep the tests independent of the machine timezone.
const NOW = dayjs('2026-10-31T12:00:00');

const note = (over: Record<string, unknown> = {}): Note =>
  ({
    id: 'p1',
    title: 'Season',
    type: 'PERIOD',
    status: 'PUBLISHED',
    startDate: '2026-10-01T12:00:00',
    endDate: null,
    updatedAt: '2026-10-30T12:00:00',
    hashtags: [],
    ...over,
  }) as unknown as Note;

const item = (over: Record<string, unknown> = {}): UnifiedFeedItem =>
  ({
    id: 'n1',
    feedSlug: 'feed-a',
    hashtags: [],
    publishedAt: '2026-10-15T12:00:00',
    rawPayload: {},
    ...over,
  }) as unknown as UnifiedFeedItem;

const period = (over: Partial<PeriodItem> = {}): PeriodItem => ({
  id: 'p1',
  feedId: null,
  feedSlug: null,
  title: 'Season',
  emoji: '⏱️',
  color: '#000',
  startDate: '2026-10-01T12:00:00',
  endDate: '2026-10-31T12:00:00',
  status: 'active',
  hashtags: [],
  rawNote: note(),
  ...over,
});

describe('calculatePeriodMetrics', () => {
  it('detects ending soon when 95% elapsed and hours remain', () => {
    // 20-day period: 2026-10-12 to 2026-11-01T12:00:00. Now is 2026-10-31T12:00:00 (19/20 = 95%)
    const metrics = calculatePeriodMetrics(
      '2026-10-12T12:00:00',
      '2026-11-01T12:00:00',
      NOW
    );
    expect(metrics.status).toBe('active');
    expect(metrics.progressPercent).toBe(95);
    expect(metrics.isEndingSoon).toBe(true);
    expect(metrics.timeRemainingText).toBe('1 дн.');
  });

  it('detects ending soon when remaining time <= 72h even with lower percent', () => {
    // 100-day period, 3 days left
    const metrics = calculatePeriodMetrics(
      '2026-07-26T12:00:00',
      '2026-11-02T12:00:00',
      NOW // 2026-10-31T12:00:00 => 48h left
    );
    expect(metrics.status).toBe('active');
    expect(metrics.isEndingSoon).toBe(true);
    expect(metrics.timeRemainingText).toBe('2 дн.');
  });

  it('not ending soon for early period', () => {
    const metrics = calculatePeriodMetrics(
      '2026-10-30T12:00:00',
      '2026-11-30T12:00:00',
      NOW
    );
    expect(metrics.status).toBe('active');
    expect(metrics.isEndingSoon).toBe(false);
    expect(metrics.progressPercent).toBeLessThan(10);
  });
});

describe('getPeriodActivityStatus', () => {
  it('is upcoming when start is on a later day', () => {
    expect(getPeriodActivityStatus(note({ startDate: '2026-11-05T12:00:00' }), NOW)).toBe('upcoming');
  });

  it('is active when it starts later today', () => {
    expect(getPeriodActivityStatus(note({ startDate: '2026-10-31T23:00:00', updatedAt: '2026-10-31T11:00:00' }), NOW)).toBe('active');
  });

  it('is finished when endDate is on an earlier day', () => {
    expect(getPeriodActivityStatus(note({ endDate: '2026-10-20T12:00:00' }), NOW)).toBe('finished');
  });

  it('is active when endDate is today', () => {
    expect(getPeriodActivityStatus(note({ endDate: '2026-10-31T08:00:00' }), NOW)).toBe('active');
  });

  it('open-ended period is finished after more than 10 idle days', () => {
    expect(getPeriodActivityStatus(note({ updatedAt: '2026-10-10T12:00:00' }), NOW)).toBe('finished');
  });

  it('open-ended period with recent metadata.lastActivityAt stays active', () => {
    const n = note({ updatedAt: '2026-09-01T12:00:00', metadata: { lastActivityAt: '2026-10-29T12:00:00' } });
    expect(getPeriodActivityStatus(n, NOW)).toBe('active');
  });
});

describe('extractPeriodItems', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW.toDate());
  });
  afterEach(() => vi.useRealTimers());

  it('keeps only non-archived PERIOD notes', () => {
    const result = extractPeriodItems([
      note({ id: 'a' }),
      note({ id: 'b', type: 'EVENT' }),
      note({ id: 'c', status: 'ARCHIVED' }),
    ]);
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('drops digests regardless of language/case', () => {
    const result = extractPeriodItems([
      note({ id: 'a', title: 'Дайджест недели' }),
      note({ id: 'b', title: 'Weekly DIGEST' }),
      note({ id: 'c', title: 'Сводка' }),
      note({ id: 'd', title: 'Real period' }),
    ]);
    expect(result.map((p) => p.id)).toEqual(['d']);
  });

  it('preserves multi-day summary digests when endDate is specified', () => {
    const result = extractPeriodItems([
      note({
        id: 'wow-beta',
        title: 'Сводный дайджест World of Warcraft за октябрь 2026',
        startDate: '2026-10-15T00:00:00',
        endDate: '2026-11-02T12:00:00',
      }),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('wow-beta');
    expect(result[0].isEndingSoon).toBe(true);
    expect(result[0].progressPercent).toBeGreaterThan(80);
  });

  it('normalises hashtags (strings and objects, strips #, lowercases)', () => {
    const [p] = extractPeriodItems([note({ hashtags: ['#Foo', { name: '#BAR' }, 'baz'] })]);
    expect(p.hashtags).toEqual(['foo', 'bar', 'baz']);
  });

  it('resolves emoji and color with fallbacks', () => {
    const [def] = extractPeriodItems([note()]);
    expect(def.emoji).toBe('⏱️');
    expect(def.color).toBe('#8b5cf6');

    const [custom] = extractPeriodItems([
      note({ icon: '🎃', metadata: { color: '#ff0000' }, feed: { slug: 's', title: 'T', color: '#00ff00' } }),
    ]);
    expect(custom.emoji).toBe('🎃');
    expect(custom.color).toBe('#ff0000');

    const [feedColor] = extractPeriodItems([note({ feed: { slug: 's', title: 'T', color: '#00ff00' } })]);
    expect(feedColor.color).toBe('#00ff00');
  });

  it('correctly resolves scope (local vs global) and isPromoted from metadata and feed', () => {
    const [localPeriod] = extractPeriodItems([
      note({ id: 'wow-beta', feed: { slug: 'spark-world-of-warcraft' } }),
    ]);
    expect(localPeriod.scope).toBe('local');
    expect(localPeriod.isPromoted).toBe(false);

    const [promotedPeriod] = extractPeriodItems([
      note({
        id: 'wow-promoted',
        feed: { slug: 'spark-world-of-warcraft' },
        metadata: { isPromoted: true, broadcastToBus: true },
      }),
    ]);
    expect(promotedPeriod.scope).toBe('local');
    expect(promotedPeriod.isPromoted).toBe(true);

    const [globalPeriod] = extractPeriodItems([
      note({ id: 'global-season', feed: null, metadata: { scope: 'global' } }),
    ]);
    expect(globalPeriod.scope).toBe('global');
  });
});

describe('filterNotesByHorizon', () => {
  const past = item({ id: 'past', publishedAt: '2026-10-20T12:00:00' });
  const today = item({ id: 'today', publishedAt: '2026-10-31T09:00:00' });
  const future = item({ id: 'future', publishedAt: '2026-11-10T12:00:00' });
  const later = item({ id: 'later', publishedAt: '2026-12-01T12:00:00' });

  it("'recent' excludes the future and sorts newest first", () => {
    const res = filterNotesByHorizon([past, future, today], 'recent', NOW);
    expect(res.map((i) => i.id)).toEqual(['today', 'past']);
  });

  it("'recent' keeps items with invalid dates", () => {
    const bad = item({ id: 'bad', publishedAt: 'not-a-date' });
    expect(filterNotesByHorizon([bad], 'recent', NOW).map((i) => i.id)).toEqual(['bad']);
  });

  it("'upcoming' includes today onward and sorts earliest first", () => {
    const res = filterNotesByHorizon([later, past, future, today], 'upcoming', NOW);
    expect(res.map((i) => i.id)).toEqual(['today', 'future', 'later']);
  });

  it('does not mutate the input array', () => {
    const input = [past, today];
    filterNotesByHorizon(input, 'recent', NOW);
    expect(input.map((i) => i.id)).toEqual(['past', 'today']);
  });
});

describe('isNoteInPeriodTimeWindow', () => {
  it('is inclusive of the start and end days', () => {
    const p = period();
    expect(isNoteInPeriodTimeWindow(item({ publishedAt: '2026-10-01T00:30:00' }), p)).toBe(true);
    expect(isNoteInPeriodTimeWindow(item({ publishedAt: '2026-10-31T23:30:00' }), p)).toBe(true);
  });

  it('rejects before start, after end and invalid dates', () => {
    const p = period();
    expect(isNoteInPeriodTimeWindow(item({ publishedAt: '2026-09-30T23:30:00' }), p)).toBe(false);
    expect(isNoteInPeriodTimeWindow(item({ publishedAt: '2026-11-01T00:30:00' }), p)).toBe(false);
    expect(isNoteInPeriodTimeWindow(item({ publishedAt: 'garbage' }), p)).toBe(false);
  });

  it('open-ended periods have no upper bound', () => {
    expect(isNoteInPeriodTimeWindow(item({ publishedAt: '2030-01-01T00:00:00' }), period({ endDate: null }))).toBe(true);
  });
});

describe('isNoteBoundToPeriod', () => {
  it('binds via parentNoteId', () => {
    expect(isNoteBoundToPeriod(item({ rawPayload: { parentNoteId: 'p1' } }), period())).toBe(true);
    expect(isNoteBoundToPeriod(item({ rawPayload: { parentNoteId: 'other' } }), period())).toBe(false);
  });

  it('binds via hashtag overlap, ignoring # and case', () => {
    const p = period({ hashtags: ['halloween'] });
    expect(isNoteBoundToPeriod(item({ hashtags: ['#Halloween'] }), p)).toBe(true);
    expect(isNoteBoundToPeriod(item({ hashtags: ['#other'] }), p)).toBe(false);
  });

  it('binds via same feed only inside the time window', () => {
    const p = period({ feedId: 'f1', feedSlug: 'feed-a' });
    expect(isNoteBoundToPeriod(item({ feedSlug: 'feed-a' }), p)).toBe(true);
    expect(isNoteBoundToPeriod(item({ feedSlug: 'feed-a', publishedAt: '2025-01-01T12:00:00' }), p)).toBe(false);
    expect(isNoteBoundToPeriod(item({ feedSlug: 'feed-b', rawPayload: { feedId: 'f1' } }), p)).toBe(true);
  });

  it('does not bind unrelated items', () => {
    expect(isNoteBoundToPeriod(item(), period())).toBe(false);
  });
});

describe('filterNotesByPeriod', () => {
  const p = period({ hashtags: ['x'] });
  const bound = item({ id: 'bound', hashtags: ['#x'], publishedAt: '2020-01-01T12:00:00' });
  const inWindow = item({ id: 'win', publishedAt: '2026-10-10T12:00:00' });

  it("'bound' uses semantic links only", () => {
    expect(filterNotesByPeriod([bound, inWindow], p, 'bound').map((i) => i.id)).toEqual(['bound']);
  });

  it("'all' uses the time window only", () => {
    expect(filterNotesByPeriod([bound, inWindow], p, 'all').map((i) => i.id)).toEqual(['win']);
  });
});

describe('extractPeriodMicroBadges', () => {
  const mk = (id: string, over: Partial<PeriodItem> = {}) => period({ id, title: id, ...over });

  it('returns only semantically bound badges when no period is explicitly selected', () => {
    const unboundActive = mk('unbound-active');
    const inWindowFinished = mk('finished', { status: 'finished' });
    const bound = mk('bound', { hashtags: ['x'], status: 'finished' });
    const { visible } = extractPeriodMicroBadges(item({ hashtags: ['x'] }), [unboundActive, inWindowFinished, bound]);
    expect(visible.map((b) => b.id)).toEqual(['bound']);
  });

  it('caps visible bound badges at 3 and moves the rest to overflow', () => {
    const periods = ['a', 'b', 'c', 'd', 'e'].map((id) => mk(id, { hashtags: ['x'] }));
    const { visible, overflow } = extractPeriodMicroBadges(item({ hashtags: ['x'] }), periods);
    expect(visible).toHaveLength(3);
    expect(overflow).toHaveLength(2);
  });

  it('with a selected period returns only that period', () => {
    const { visible } = extractPeriodMicroBadges(item(), [mk('a'), mk('b')], 'b');
    expect(visible.map((b) => b.id)).toEqual(['b']);
  });

  it('returns nothing when the item is outside every window and not bound', () => {
    const { visible, overflow } = extractPeriodMicroBadges(item({ publishedAt: '2019-01-01T12:00:00' }), [mk('a')]);
    expect(visible).toEqual([]);
    expect(overflow).toEqual([]);
  });
});
