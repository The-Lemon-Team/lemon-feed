import { describe, expect, it } from 'vitest';
import { getPathForFeedSource, parseFeedRouteString } from '../feedRouteMappings';
import { isWatchersEnvironment } from '../appMode';
import {
  buildWatchersRouteUrl,
  parseWatchersRoute,
} from '../../../../feed-watchers/src/utils/watchersRouter';

describe('Watchers tab & standalone routing', () => {
  it('maps /watchers and /watchers/:category to watchers streamSource in feed-app', () => {
    expect(parseFeedRouteString('/watchers')).toMatchObject({
      streamSource: 'watchers',
      selectedFeedSlug: undefined,
    });

    expect(parseFeedRouteString('/watchers/ai')).toMatchObject({
      streamSource: 'watchers',
      selectedFeedSlug: 'ai',
    });

    expect(getPathForFeedSource('watchers', 'habr')).toBe('/watchers/habr');
  });

  it('keeps /watchers inside feed-app unless explicit standalone ?env=watchers or port 5182', () => {
    window.history.replaceState({}, '', '/watchers/ai');
    expect(isWatchersEnvironment()).toBe(false);

    window.history.replaceState({}, '', '/watchers/ai?env=watchers');
    expect(isWatchersEnvironment()).toBe(true);

    window.history.replaceState({}, '', '/');
  });

  it('parses and builds standalone & embedded watchers URL state', () => {
    const parsed = parseWatchersRoute('/watchers/cybersec', '?status=PROMOTED&watcher=pub-xakep&q=CVE&manage=1');
    expect(parsed).toEqual({
      category: 'cybersec',
      status: 'PROMOTED',
      watcher: 'pub-xakep',
      search: 'CVE',
      manage: true,
    });

    window.history.replaceState({}, '', '/watchers/habr?appMode=dev');
    const standaloneUrl = buildWatchersRouteUrl({
      category: 'ai',
      watcher: 'pub-anthropic-news',
      status: 'ALL',
      search: 'claude',
      manage: false,
    });
    expect(standaloneUrl).toBe('/watchers/ai?appMode=dev&status=ALL&watcher=pub-anthropic-news&q=claude');

    const embeddedUrl = buildWatchersRouteUrl(
      {
        category: 'ai',
        watcher: '',
        status: 'PROMOTED',
        search: '',
        manage: true,
      },
      { embedded: true }
    );
    expect(embeddedUrl).toBe('/watchers/habr?appMode=dev&status=PROMOTED&manage=1');

    window.history.replaceState({}, '', '/');
  });
});
