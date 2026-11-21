import { describe, it, expect } from 'vitest';
import {
  isTimelineFeed,
  extractTimelineBoardSlug,
  findTimelineActor,
  getTimelineWebUrl,
  TIMELINE_ACTORS,
} from '../timelineFeeds';

describe('timelineFeeds domain utilities', () => {
  it('identifies timeline feed by exact or hyphen/underscore slug', () => {
    expect(isTimelineFeed({ slug: 'the_lemon_team' })).toBe(true);
    expect(isTimelineFeed({ slug: 'the-lemon-team' })).toBe(true);
    expect(isTimelineFeed({ slug: 'news' })).toBe(false);
    expect(isTimelineFeed(null)).toBe(false);
  });

  it('identifies timeline feed by hashtags', () => {
    expect(isTimelineFeed({ slug: 'custom-feed', hashtags: [{ name: 'mode:timeline' }] })).toBe(true);
    expect(isTimelineFeed({ slug: 'custom-feed', hashtags: ['#board:the-lemon-team-bcd'] })).toBe(true);
    expect(isTimelineFeed({ slug: 'custom-feed', hashtags: [{ name: 'lemon-universe' }] })).toBe(true);
    expect(isTimelineFeed({ slug: 'custom-feed', hashtags: [{ name: 'it' }] })).toBe(false);
  });

  it('identifies timeline feed by metadata', () => {
    expect(isTimelineFeed({ slug: 'custom-feed', metadata: { boardMode: 'TIMELINE' } })).toBe(true);
    expect(isTimelineFeed({ slug: 'custom-feed', metadata: { boardSlug: 'my-board' } })).toBe(true);
  });

  it('extracts timeline board slug correctly', () => {
    expect(extractTimelineBoardSlug({ slug: 'the_lemon_team' })).toBe('the-lemon-team-bcd');
    expect(extractTimelineBoardSlug({ slug: 'custom', hashtags: ['board:special-project-xyz'] })).toBe(
      'special-project-xyz'
    );
    expect(extractTimelineBoardSlug({ slug: 'custom', metadata: { boardSlug: 'meta-board' } })).toBe(
      'meta-board'
    );
    expect(extractTimelineBoardSlug(null)).toBe('the-lemon-team-bcd');
  });

  it('finds timeline actor by id, handle, avatar or name', () => {
    const alexey = findTimelineActor('actor-alexey');
    expect(alexey).toBeDefined();
    expect(alexey?.name).toBe('Алексей (в халате)');

    const antigravity = findTimelineActor('antigravity_agent');
    expect(antigravity).toBeDefined();
    expect(antigravity?.id).toBe('actor-antigravity-agent');

    const coder = findTimelineActor('lemon-coder');
    expect(coder).toBeDefined();
    expect(coder?.handle).toBe('lemon_dev');

    const starleader = findTimelineActor('ТимЛид Старлидер');
    expect(starleader).toBeDefined();
    expect(starleader?.id).toBe('actor-starleader');

    expect(findTimelineActor('unknown-user')).toBeUndefined();
    expect(findTimelineActor(null)).toBeUndefined();
  });

  it('generates timeline board url', () => {
    const url = getTimelineWebUrl('the-lemon-team-bcd');
    expect(url).toContain('/timelines/the-lemon-team-bcd');
  });
});
