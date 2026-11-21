import { describe, it, expect } from 'vitest';
import {
  getPathForFeedSource,
  parseFeedRouteString,
  decomposeFeedSlug,
} from '../feedRouteMappings';

describe('feedRouteMappings - General and All Feed Normalization', () => {
  it('normalizes general and all slugs in decomposeFeedSlug', () => {
    expect(decomposeFeedSlug('general')).toEqual({});
    expect(decomposeFeedSlug('all')).toEqual({});
    expect(decomposeFeedSlug(undefined)).toEqual({});
    expect(decomposeFeedSlug('spark-ai')).toEqual({
      feedSlug: 'spark-ai',
      subtopic: undefined,
      cleanFeedAlias: 'ai',
    });
  });

  it('generates clean path without /general when feedSlug is general or all', () => {
    expect(getPathForFeedSource('all', { feedSlug: 'general' })).toBe('/all');
    expect(getPathForFeedSource('all', { feedSlug: 'all' })).toBe('/all');
    expect(getPathForFeedSource('it_dev', { feedSlug: 'general' })).toBe('/it-dev');
    expect(getPathForFeedSource('all', 'general')).toBe('/all');
    expect(getPathForFeedSource('all', 'spark-ai')).toBe('/all/ai');
  });

  it('parses /all/general into streamSource: all and selectedFeedSlug: undefined', () => {
    const parsedGeneral = parseFeedRouteString('/all/general');
    expect(parsedGeneral.streamSource).toBe('all');
    expect(parsedGeneral.selectedFeedSlug).toBeUndefined();

    const parsedAll = parseFeedRouteString('/all/all');
    expect(parsedAll.streamSource).toBe('all');
    expect(parsedAll.selectedFeedSlug).toBeUndefined();
  });
});
