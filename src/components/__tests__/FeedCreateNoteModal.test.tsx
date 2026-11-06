import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
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

    it('uses defaultDate for the event date', () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultDate="2026-12-24" />);
      expect(document.querySelector('input[type="date"]')).toHaveValue('2026-12-24');
    });

    it('preselects the feed matching defaultFeedSlug once feeds load', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultFeedSlug="diary" />);
      await waitFor(() => expect(selects()[feedSelect]).toHaveValue('feed-2'));
    });

    it('leaves the feed empty when defaultFeedSlug matches nothing', async () => {
      mockApi();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} defaultFeedSlug="nope" />);
      await screen.findByText(/IT News/);
      expect(selects()[feedSelect]).toHaveValue('');
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
    it('sends a minimal note and reports success', async () => {
      const api = mockApi();
      const onCreated = vi.fn();
      renderWithProviders(<FeedCreateNoteModal isOpen onClose={vi.fn()} onCreated={onCreated} defaultDate="2026-10-31" />);

      await userEvent.type(titleInput(), '  Hello world  ');
      await userEvent.click(submit());

      expect(await screen.findByText('Запись успешно создана!')).toBeInTheDocument();
      const body = api.getBody()!;
      expect(body).toMatchObject({
        title: 'Hello world',
        type: 'SINGLE',
        startDate: '2026-10-31T00:00:00.000Z',
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
});
