import { http, HttpResponse } from 'msw';

/**
 * Default network handlers shared by all tests.
 * Override per-test with `server.use(...)`. Unhandled requests fail the test.
 */
export const handlers = [
  http.get('*/health', () => HttpResponse.json({ status: 'ok' })),
  http.get('*/streams', () => HttpResponse.json([])),
  http.post('*/streams', async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ id: `stream_${Date.now()}`, ...body }, { status: 201 });
  }),
  http.patch('*/streams/:id', async ({ request, params }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ id: params.id, ...body });
  }),
];
