import { http, HttpResponse } from 'msw';

/**
 * Default network handlers shared by all tests.
 * Override per-test with `server.use(...)`. Unhandled requests fail the test.
 */
export const handlers = [
  http.get('*/health', () => HttpResponse.json({ status: 'ok' })),
  http.get('*/feeds', () => HttpResponse.json([])),
  http.get('*/streams', () => HttpResponse.json([])),
  http.post('*/streams', async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ id: `stream_${Date.now()}`, ...body }, { status: 201 });
  }),
  http.patch('*/streams/:id', async ({ request, params }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ id: params.id, ...body });
  }),
  http.get('*/notes/media/search-images', () => HttpResponse.json([])),
  http.get('*/macros', () => HttpResponse.json([])),
  http.post('*/notes/parse-link', async ({ request }) => {
    const body = (await request.json()) as { url?: string };
    return HttpResponse.json({
      kind: 'youtube',
      url: body.url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      title: 'Parsed YouTube Video',
      shortDescription: 'Short description of the parsed video.',
      description: 'Short description of the parsed video.',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      author: 'YouTube Channel',
      suggestedHashtags: ['youtube', 'video'],
    });
  }),
  http.get('https://noembed.com/embed', () => HttpResponse.json({ error: 'Not Found' }, { status: 404 })),
];
