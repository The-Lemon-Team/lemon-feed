import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { renderWithProviders } from '../../test/renderWithProviders';
import { makeFeed } from '../../test/fixtures';
import { FeedCreateNoteModal } from '../FeedCreateNoteModal';

type Body = Record<string, any>;

/** Registers feeds + POST /notes handlers; returns a getter for the last POST body. */
function mockApi(opts: { feeds?: unknown[]; postStatus?: number; postBody?: unknown } = {}) {
  let body: Body | null = null;
  const calls = { count: 0 };
  server.use(
    http.get('*/feeds', () => HttpResponse.json(opts.feeds ?? [makeFeed(), makeFeed({ id: 'feed-2', slug: 'diary', title: 'Diary', privacy: 'private', icon: 'lock' })])),
    http.post('*/notes', async ({ request }) => {
      calls.count++;
      body = (await request.json()) as Body;
      if (opts.postStatus && opts.postStatus >= 400) {
        return HttpResponse.json(opts.postBody ?? { message: 'Bad' }, { status: opts.postStatus });
      }
      return HttpResponse.json({ id: 'created-1', ...body });
    })
  );
  return { getBody: () => body, calls };
}

const titleInput = () => screen.getByPlaceholderText(/Введите заголовок/);
const submit = () => screen.getByRole('button', { name: /Создать запись/ });
const [typeSelect, feedSelect, statusSelect] = [0, 1, 2];
const selects = () => screen.getAllByRole('combobox') as HTMLSelectElement[];

describe('FeedCreateNoteModal', () => {
  describe('Create › defaults', () => {
    it('dev mode defaults to Private + PUBLISHED, type SINGLE, author Admin', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      expect(selects()[typeSelect]).toHaveValue('SINGLE');
      expect(selects()[statusSelect]).toHaveValue('PUBLISHED');
      expect(screen.getByPlaceholderText('Имя автора...')).toHaveValue('Admin');
    });

    it('staging mode defaults to Public + DRAFT', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} appMode="staging" />);
      expect(selects()[statusSelect]).toHaveValue('DRAFT');
    });

    it('uses defaultDate paired with current local time for the event datetime', () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultDate="2026-12-24" />);
      const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toMatch(/^2026-12-24T\d{2}:\d{2}$/);
    });

    it('defaults to current local date and time when defaultDate is omitted', () => {
      mockApi();
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const expectedPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T`;
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value.startsWith(expectedPrefix)).toBe(true);
      expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('preselects the feed matching defaultFeedSlug once feeds load', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultFeedSlug="diary" />);
      await waitFor(() => expect(selects()[feedSelect]).toHaveValue('feed-2'));
    });

    it('preselects the feed matching defaultFeedSlug with hyphen-underscore mismatch (the-lemon-team -> the_lemon_team) and sets private privacy', async () => {
      mockApi({
        feeds: [
          makeFeed({ id: 'feed-lemon', slug: 'the_lemon_team', title: 'The Lemon Team', privacy: 'private' }),
        ],
      });
      renderWithProviders(
        <FeedCreateNoteModal
          isOpen
          onClose={vi.fn()}
          defaultFeedSlug="the-lemon-team"
        />
      );
      await waitFor(() => expect(selects()[feedSelect]).toHaveValue('feed-lemon'));
    });

    it('leaves the feed empty when defaultFeedSlug matches nothing', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultFeedSlug="nope" />);
      await screen.findByText(/IT News/);
      expect(selects()[feedSelect]).toHaveValue('');
    });

    it('preselects the feed matching activeStreamSource (e.g. jm_daily -> jm-daily) and syncs public privacy when defaultFeedSlug is undefined', async () => {
      mockApi({
        feeds: [
          makeFeed({ id: 'feed-jm', slug: 'jm-daily', title: 'Jm Daily', privacy: 'public' }),
        ],
      });
      const api = mockApi({
        feeds: [
          makeFeed({ id: 'feed-jm', slug: 'jm-daily', title: 'Jm Daily', privacy: 'public' }),
        ],
      });
      renderWithProviders(
        <FeedCreateNoteModal
          isOpen
          onClose={vi.fn()}
          activeStreamSource="jm_daily"
          activeStreamMode={{
            id: 'jm_daily',
            label: 'Jm Daily',
            emoji: '📰',
            privacy: 'public',
          }}
        />
      );
      await waitFor(() => expect(selects()[feedSelect]).toHaveValue('feed-jm'));
      await userEvent.type(titleInput(), 'Note in Jm Daily');
      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()).toMatchObject({
        title: 'Note in Jm Daily',
        feedId: 'feed-jm',
        privacy: 'public',
      });
    });

    it('auto-tags note with custom stream slug when created inside a custom workspace stream without a dedicated feed', async () => {
      const api = mockApi({ feeds: [] });
      renderWithProviders(
        <FeedCreateNoteModal
          isOpen
          onClose={vi.fn()}
          activeStreamSource="jm_daily"
          activeStreamMode={{
            id: 'jm_daily',
            label: 'Jm Daily',
            emoji: '📰',
            privacy: 'public',
            filterConfig: { privacy: 'public' },
          }}
        />
      );
      await userEvent.type(titleInput(), 'Workspace Note');
      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()).toMatchObject({
        title: 'Workspace Note',
        privacy: 'public',
        hashtags: ['jm_daily'],
      });
    });

    it('lists feeds with an emoji fallback for ligature-style icons', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      expect(await screen.findByRole('option', { name: '📰 IT News (it-news)' })).toBeInTheDocument();
      // icon "lock" is a ligature name → private feeds fall back to 🔒
      expect(screen.getByRole('option', { name: '🔒 Diary (diary)' })).toBeInTheDocument();
    });
  });

  describe('Create › with no errors', () => {
    it('sends a minimal note with default current time and reports success', async () => {
      const api = mockApi();
      const onCreated = vi.fn();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} onCreated={onCreated} defaultDate="2026-10-31" />);

      const dateTimeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const expectedIso = new Date(dateTimeInput.value).toISOString();

      await userEvent.type(titleInput(), '  Hello world  ');
      await userEvent.click(submit());

      expect(await screen.findByText('Запись успешно создана!')).toBeInTheDocument();
      const body = api.getBody()!;
      expect(body).toMatchObject({
        title: 'Hello world',
        type: 'SINGLE',
        startDate: expectedIso,
        privacy: 'private',
        status: 'PUBLISHED',
        author: 'Admin',
        curator: 'Admin',
      });
      expect(body.publishAt).toEqual(expect.any(String));
      // empty optionals must be omitted rather than sent as ""
      expect(body.description).toBeUndefined();
      expect(body.summary).toBeUndefined();
      expect(body.sourceLink).toBeUndefined();
      expect(body.hashtags).toBeUndefined();
      expect(body.feedId).toBeUndefined();
      expect(body.endDate).toBeUndefined();
      expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 'created-1' }));
    });

    it('sends exact user-selected date and time in ISO UTC', async () => {
      const api = mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);

      const dateTimeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      fireEvent.change(dateTimeInput, { target: { value: '2026-11-18T14:45' } });
      await userEvent.type(titleInput(), 'Timed Note');
      await userEvent.click(submit());

      expect(await screen.findByText('Запись успешно создана!')).toBeInTheDocument();
      const expectedIso = new Date('2026-11-18T14:45').toISOString();
      expect(api.getBody()!.startDate).toBe(expectedIso);
      expect(api.getBody()!.publishAt).toBe(expectedIso);
    });

    it('resets startDate to current local date and time when clicking "Сейчас"', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultDate="2020-01-01" />);

      const dateTimeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      expect(dateTimeInput.value.startsWith('2020-01-01T')).toBe(true);

      await userEvent.click(screen.getByRole('button', { name: 'Сейчас' }));

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const expectedPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T`;
      expect(dateTimeInput.value.startsWith(expectedPrefix)).toBe(true);
    });

    it('closes itself shortly after a successful save', async () => {
      mockApi();
      const onClose = vi.fn();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={onClose} />);
      await userEvent.type(titleInput(), 'x');
      await userEvent.click(submit());
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 2000 });
    });
  });

  describe('Create › special params', () => {
    it('parses hashtags separated by spaces/commas and strips #', async () => {
      const api = mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      await userEvent.type(titleInput(), 'Tagged');
      await userEvent.type(screen.getByPlaceholderText(/#технологии/), '#ai, #новости  tech');
      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()!.hashtags).toEqual(['ai', 'новости', 'tech']);
    });

    it('omits endDate (the form has no end-date field, even for PERIOD)', async () => {
      const api = mockApi();
      const { unmount } = renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultDate="2026-10-01" />);
      await userEvent.type(titleInput(), 'Period');
      await userEvent.selectOptions(selects()[typeSelect], 'PERIOD');
      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()!.endDate).toBeUndefined();
      unmount();
    });

    it('changing privacy toggle and status is reflected in the payload', async () => {
      const api = mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      await userEvent.type(titleInput(), 'Public draft');
      await userEvent.click(screen.getByRole('button', { name: 'Public' }));
      await userEvent.selectOptions(selects()[statusSelect], 'DRAFT');
      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()).toMatchObject({ privacy: 'public', status: 'DRAFT', publishAt: null });
    });

    it('attaches the selected feed and type', async () => {
      const api = mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      await screen.findByRole('option', { name: /IT News/ });
      await userEvent.type(titleInput(), 'Event in feed');
      await userEvent.selectOptions(selects()[typeSelect], 'EVENT');
      await userEvent.selectOptions(selects()[feedSelect], 'feed-1');
      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()).toMatchObject({ type: 'EVENT', feedId: 'feed-1' });
    });

    it('clearing the author sends no author/curator', async () => {
      const api = mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      await userEvent.type(titleInput(), 'Anon');
      await userEvent.clear(screen.getByPlaceholderText('Имя автора...'));
      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()!.author).toBeUndefined();
      expect(api.getBody()!.curator).toBeUndefined();
    });
  });

  describe('Create › validation and errors', () => {
    it('rejects a whitespace-only title without calling the API', async () => {
      const api = mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      await userEvent.type(titleInput(), '   ');
      await userEvent.click(submit());
      expect(await screen.findByText('Укажите заголовок записи')).toBeInTheDocument();
      expect(api.calls.count).toBe(0);
    });

    it('shows the server message and stays open on failure', async () => {
      mockApi({ postStatus: 422, postBody: { message: 'Title too long' } });
      const onClose = vi.fn();
      const onCreated = vi.fn();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={onClose} onCreated={onCreated} />);
      await userEvent.type(titleInput(), 'x');
      await userEvent.click(submit());
      expect(await screen.findByText('Title too long')).toBeInTheDocument();
      expect(onCreated).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('re-enables submit after a failure so the user can retry', async () => {
      mockApi({ postStatus: 500, postBody: {} });
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      await userEvent.type(titleInput(), 'x');
      await userEvent.click(submit());
      await screen.findByText(/Request failed|Ошибка/);
      expect(submit()).toBeEnabled();
    });
  });

  describe('Create › form lifecycle', () => {
    it('resets the form when reopened', async () => {
      mockApi();
      const { rerender } = renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      await userEvent.type(titleInput(), 'Leftover');
      rerender(<FeedCreateNoteModal isOpen={false} onClose={vi.fn()} />);
      rerender(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      expect(titleInput()).toHaveValue('');
    });

    it('Cancel closes without calling the API', async () => {
      const api = mockApi();
      const onClose = vi.fn();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(api.calls.count).toBe(0);
    });

    it('attaches Google search posters and passes the updated note with images to onCreated', async () => {
      mockApi();
      const onCreated = vi.fn();
      let attachedForNoteId: string | null = null;

      server.use(
        http.get('*/notes/media/search-images', () =>
          HttpResponse.json([
            {
              title: 'Dune Poster',
              imageUrl: 'https://example.com/dune.jpg',
              thumbnailUrl: 'https://example.com/dune-thumb.jpg',
              width: 800,
              height: 1200,
              source: 'IMDb',
            },
          ])
        ),
        http.post('*/notes/:id/images/from-urls', async ({ params }) => {
          attachedForNoteId = String(params.id);
          return HttpResponse.json([
            {
              id: 'img-dune-1',
              noteId: params.id,
              url: '/uploads/notes/dune.webp',
              thumbnailUrl: '/uploads/notes/thumbs/dune.webp',
              isMain: true,
              caption: 'Dune Poster',
              order: 0,
            },
          ]);
        })
      );

      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} onCreated={onCreated} />);

      await userEvent.type(titleInput(), 'Dune Part Two');
      await userEvent.click(screen.getByRole('button', { name: /Найти постер \(Google\)/i }));

      const posterCard = await screen.findByText('Dune Poster');
      await userEvent.click(posterCard);
      await userEvent.click(screen.getByRole('button', { name: /Добавить \(1\)/i }));

      await userEvent.click(submit());

      expect(await screen.findByText('Запись успешно создана!')).toBeInTheDocument();
      expect(attachedForNoteId).toBe('created-1');
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'created-1',
          images: [
            expect.objectContaining({
              id: 'img-dune-1',
              url: '/uploads/notes/dune.webp',
              isMain: true,
            }),
          ],
        })
      );
    });
  });

  describe('Note presets & YouTube link auto-parsing', () => {
    it('activates YouTube Видео preset and applies folderPath & hashtags on submit', async () => {
      const api = mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);

      await userEvent.click(screen.getByRole('button', { name: 'YouTube Видео' }));
      expect(screen.getByLabelText('Ссылка на YouTube видео')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/#технологии/)).toHaveValue('#youtube #video');

      await userEvent.type(titleInput(), 'My Saved Video');
      await userEvent.click(submit());

      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()).toMatchObject({
        title: 'My Saved Video',
        folderPath: 'Videos',
        hashtags: ['youtube', 'video'],
      });
    });

    it('applies a saved QuickAddMacro preset from /macros', async () => {
      const api = mockApi();
      server.use(
        http.get('*/macros', () =>
          HttpResponse.json([
            {
              id: 'macro-yt',
              name: 'YT Digest',
              feedId: 'feed-2',
              folderPath: 'Videos/AI',
              folderPaths: ['Videos/AI'],
              noteType: 'EVENT',
              hashtags: ['youtube', 'ai'],
            },
          ])
        )
      );

      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);
      const macroBtn = await screen.findByRole('button', { name: 'YT Digest' });
      await userEvent.click(macroBtn);

      await userEvent.type(titleInput(), 'Macro Video');
      await userEvent.click(submit());

      await screen.findByText('Запись успешно создана!');
      expect(api.getBody()).toMatchObject({
        title: 'Macro Video',
        feedId: 'feed-2',
        folderPath: 'Videos/AI',
        type: 'EVENT',
        hashtags: ['youtube', 'ai'],
      });
    });

    it('auto-parses initialSourceLink (YouTube) into title, short description, preview poster, and attaches thumbnail on create', async () => {
      const api = mockApi();
      let attachedUrls: any[] = [];

      server.use(
        http.post('*/notes/parse-link', async () =>
          HttpResponse.json({
            kind: 'youtube',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            videoId: 'dQw4w9WgXcQ',
            title: 'Parsed YouTube Title',
            shortDescription: 'Concise video summary for the feed card.',
            description: 'Concise video summary for the feed card.',
            thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            author: 'Veritasium',
            durationSeconds: 612,
            suggestedHashtags: ['youtube', 'video'],
          })
        ),
        http.post('*/notes/:id/images/from-urls', async ({ request }) => {
          const body = (await request.json()) as { items: any[] };
          attachedUrls = body.items;
          return HttpResponse.json([
            {
              id: 'img-yt-1',
              url: '/uploads/media/yt-preview.webp',
              isMain: true,
              order: 0,
            },
          ]);
        })
      );

      renderWithProviders(
        <FeedCreateNoteModal
          isOpen
          onClose={vi.fn()}
          initialSourceLink="https://youtu.be/dQw4w9WgXcQ?t=15"
        />
      );

      await waitFor(() => {
        expect(titleInput()).toHaveValue('Parsed YouTube Title');
      });
      expect(screen.getByPlaceholderText(/Короткая выжимка/)).toHaveValue(
        'Concise video summary for the feed card.'
      );
      expect(screen.getByPlaceholderText('Имя автора...')).toHaveValue('Veritasium');
      expect(screen.getByText('Распознано и заполнено в форму')).toBeInTheDocument();

      await userEvent.click(submit());
      await screen.findByText('Запись успешно создана!');

      expect(api.getBody()).toMatchObject({
        title: 'Parsed YouTube Title',
        summary: 'Concise video summary for the feed card.',
        sourceLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        folderPath: 'Videos',
        author: 'Veritasium',
        hashtags: ['youtube', 'video'],
      });
      expect(attachedUrls).toEqual([
        expect.objectContaining({
          url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          isMain: true,
        }),
      ]);
    });

    it('recognizes a pasted YouTube link in the title input and parses it into the form', async () => {
      mockApi();
      server.use(
        http.post('*/notes/parse-link', async () =>
          HttpResponse.json({
            kind: 'youtube',
            url: 'https://www.youtube.com/watch?v=AbCdEf12345',
            canonicalUrl: 'https://www.youtube.com/watch?v=AbCdEf12345',
            videoId: 'AbCdEf12345',
            title: 'Pasted Link Title',
            shortDescription: 'Pasted link short summary',
            description: 'Pasted link short summary',
            thumbnailUrl: 'https://i.ytimg.com/vi/AbCdEf12345/hqdefault.jpg',
            author: 'Channel X',
            suggestedHashtags: ['youtube', 'video'],
          })
        )
      );

      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} />);

      fireEvent.paste(titleInput(), {
        clipboardData: {
          getData: () => 'https://www.youtube.com/watch?v=AbCdEf12345',
        },
      });

      await waitFor(() => {
        expect(titleInput()).toHaveValue('Pasted Link Title');
      });
      expect(screen.getByPlaceholderText(/Короткая выжимка/)).toHaveValue('Pasted link short summary');
      expect(screen.getByPlaceholderText('https://...')).toHaveValue(
        'https://www.youtube.com/watch?v=AbCdEf12345'
      );
    });
  });
});
