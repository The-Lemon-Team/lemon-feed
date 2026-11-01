/**
 * Utility functions for navigating to host application views (calendar, timeline)
 * across iframe embed mode and standalone mode.
 */

export function navigateToHostCalendar(isEmbed: boolean): void {
  if (isEmbed && typeof window !== 'undefined' && window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'LENTA_HOST_NAVIGATE',
        source: 'lenta-feed-app',
        payload: { view: 'month' },
      },
      '*'
    );
    return;
  }
  if (typeof window !== 'undefined') {
    window.open('http://localhost:5174/calendar', '_blank');
  }
}

export function navigateToHostTimeline(isEmbed: boolean): void {
  if (isEmbed && typeof window !== 'undefined' && window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'LENTA_HOST_NAVIGATE',
        source: 'lenta-feed-app',
        payload: { view: 'timeline' },
      },
      '*'
    );
    return;
  }
  if (typeof window !== 'undefined') {
    window.open('http://localhost:5174/', '_blank');
  }
}
