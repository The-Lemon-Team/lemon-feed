import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateToHostCalendar, navigateToHostTimeline } from '../hostNavigation';

const cases = [
  { name: 'navigateToHostCalendar', fn: navigateToHostCalendar, view: 'month', url: 'http://localhost:5174/calendar' },
  { name: 'navigateToHostTimeline', fn: navigateToHostTimeline, view: 'timeline', url: 'http://localhost:5174/' },
];

describe.each(cases)('$name', ({ fn, view, url }) => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts a LENTA_HOST_NAVIGATE message to the parent when embedded', () => {
    const postMessage = vi.fn();
    vi.spyOn(window, 'parent', 'get').mockReturnValue({ postMessage } as unknown as Window);
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    fn(true);

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'LENTA_HOST_NAVIGATE', source: 'lenta-feed-app', payload: { view } },
      '*'
    );
    expect(open).not.toHaveBeenCalled();
  });

  it('opens the host app in a new tab when standalone', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fn(false);
    expect(open).toHaveBeenCalledWith(url, '_blank');
  });

  it('falls back to opening a tab when "embedded" but there is no distinct parent', () => {
    // In jsdom window.parent === window.
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fn(true);
    expect(open).toHaveBeenCalledWith(url, '_blank');
  });
});
