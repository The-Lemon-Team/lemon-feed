import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@lenta/shared';
import { isPublicEnvironment, normalizeNotesForPublicFeeds, resolveFeedAppMode } from '../appMode';

function setUrl(url: string) {
  window.history.replaceState({}, '', url);
}

describe('appMode', () => {
  beforeEach(() => {
    localStorage.clear();
    setUrl('/');
    vi.stubEnv('VITE_FEED_APP_MODE', '');
    vi.stubEnv('MODE', 'test');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    setUrl('/');
  });

  describe('isPublicEnvironment', () => {
    it('is false by default', () => {
      expect(isPublicEnvironment()).toBe(false);
    });

    it('is true when VITE_FEED_APP_MODE=public', () => {
      vi.stubEnv('VITE_FEED_APP_MODE', 'PUBLIC');
      expect(isPublicEnvironment()).toBe(true);
    });

    it('is true when build MODE=public', () => {
      vi.stubEnv('MODE', 'public');
      expect(isPublicEnvironment()).toBe(true);
    });
  });

  describe('resolveFeedAppMode', () => {
    it('defaults to dev', () => {
      expect(resolveFeedAppMode()).toBe('dev');
    });

    it('forces public in a public environment, ignoring query and storage', () => {
      vi.stubEnv('VITE_FEED_APP_MODE', 'public');
      setUrl('/?appMode=staging');
      localStorage.setItem('lenta_app_mode', 'dev');
      expect(resolveFeedAppMode()).toBe('public');
    });

    it.each([
      ['?appMode=public', 'public'],
      ['?mode=staging', 'staging'],
      ['?appMode=dev', 'dev'],
      ['?mode=admin', 'dev'],
    ])('reads %s from the query string', (qs, expected) => {
      setUrl(`/${qs}`);
      expect(resolveFeedAppMode()).toBe(expected);
    });

    it('falls back to localStorage when the query is absent', () => {
      localStorage.setItem('lenta_app_mode', 'Staging');
      expect(resolveFeedAppMode()).toBe('staging');
    });

    it('query string wins over localStorage', () => {
      localStorage.setItem('lenta_app_mode', 'staging');
      setUrl('/?appMode=public');
      expect(resolveFeedAppMode()).toBe('public');
    });

    it('ignores unknown values', () => {
      setUrl('/?appMode=banana');
      localStorage.setItem('lenta_app_mode', 'banana');
      expect(resolveFeedAppMode()).toBe('dev');
    });
  });

  describe('normalizeNotesForPublicFeeds', () => {
    const publicFeed = { id: 'pf', title: 'Public', slug: 'public' };
    const adminFeed = { id: 'af', title: 'Admin', slug: 'admin' };

    it('swaps in the public feed and records both feeds in metadata', () => {
      const n = { id: '1', feedId: 'af', feed: adminFeed, publicFeed, publicFeedId: 'pf', metadata: { keep: 1 } } as unknown as Note;
      const [out] = normalizeNotesForPublicFeeds([n]);
      expect(out.feedId).toBe('pf');
      expect(out.feed).toBe(publicFeed);
      expect(out.metadata).toEqual({
        keep: 1,
        adminFeedTitle: 'Admin',
        adminFeedSlug: 'admin',
        publicFeedTitle: 'Public',
        publicFeedSlug: 'public',
      });
    });

    it('uses publicFeed.id when publicFeedId is missing', () => {
      const n = { id: '1', feed: adminFeed, publicFeed } as unknown as Note;
      expect(normalizeNotesForPublicFeeds([n])[0].feedId).toBe('pf');
    });

    it('leaves notes without a public feed untouched (same reference)', () => {
      const n = { id: '1', feed: adminFeed } as unknown as Note;
      expect(normalizeNotesForPublicFeeds([n])[0]).toBe(n);
    });

    it('does not mutate the original note', () => {
      const n = { id: '1', feedId: 'af', feed: adminFeed, publicFeed } as unknown as Note;
      normalizeNotesForPublicFeeds([n]);
      expect(n.feedId).toBe('af');
      expect(n.feed).toBe(adminFeed);
    });
  });
});
