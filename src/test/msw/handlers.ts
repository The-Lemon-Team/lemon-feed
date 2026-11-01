import { http, HttpResponse } from 'msw';

/**
 * Default network handlers shared by all tests.
 * Override per-test with `server.use(...)`. Unhandled requests fail the test.
 */
export const handlers = [
  http.get('*/health', () => HttpResponse.json({ status: 'ok' })),
];
