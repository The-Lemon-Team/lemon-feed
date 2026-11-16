import { resolvePeerAppUrl } from '@lenta/shared';

/**
 * Utility functions for navigating to host application views (calendar, timeline)
 * across iframe embed mode and standalone mode.
 */

export function getCalendarAppBaseUrl(): string {
  return resolvePeerAppUrl(import.meta.env.VITE_CALENDAR_APP_URL, 5174, 5174, import.meta.env.PROD);
}

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
    window.open(`${getCalendarAppBaseUrl()}/calendar`, '_blank');
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
    window.open(`${getCalendarAppBaseUrl()}/`, '_blank');
  }
}
