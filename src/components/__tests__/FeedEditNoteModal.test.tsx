import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { renderWithProviders } from '../../test/renderWithProviders';
import { makeFeedItem } from '../../test/fixtures';
import { FeedEditNoteModal } from '../FeedEditNoteModal';

type Body = Record<string, any>;

function mockPatch(opts: { status?: number; body?: unknown } = {}) {
  const state: { body: Body | null; url: string | null; calls: number } = { body: null, url: null, calls: 0 };
  server.use(
    http.patch('*/notes/:id', async ({ request, params }) => {
      state.calls++;
      state.url = String(params.id);
      state.body = (await request.json()) as Body;
      if (opts.status && opts.status >= 400) return HttpResponse.json(opts.body ?? {}, { status: opts.status });
      return HttpResponse.json({ id: params.id, ...state.body });
    })
  );
  return state;
}

const saveBtn = () => screen.getByRole('button', { name: /Сохранить правки/ });
const titleInput = () => screen.getByPlaceholderText(/Название новости/);
const descInput = () => screen.getByPlaceholderText(/Текст новости/);
const tagsInput = () => screen.getByPlaceholderText('#ai #podcast #changelog #security');
const dateInput = () => document.querySelector('input[type="date"]') as HTMLInputElement;
const STAGE_TITLES = {
  dev: 'Приватный рабочий контур',
  staging: 'Хаб публикаций (стейджинг)',
  public: 'Опубликовано в паблике',
} as const;
const stage = (key: keyof typeof STAGE_TITLES) => screen.getByTitle(STAGE_TITLES[key]);

describe('FeedEditNoteModal', () => {
  describe('Edit › rendering and prefill', () => {
    it('renders nothing without an item', () => {
      renderWithProviders(<FeedEditNoteModal item={null} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('prefills fields from the item', () => {
      const item = makeFeedItem({
        summary: 'Short summary',
        author: 'Alice',
        sourceLink: 'https://example.com/a',
      });
      renderWithProviders(<FeedEditNoteModal item={item} onClose={vi.fn()} />);
      expect(titleInput()).toHaveValue('Original title');
      expect(descInput()).toHaveValue('Original description');
      expect(screen.getByPlaceholderText(/Краткое содержание/)).toHaveValue('Short summary');
      expect(screen.getByPlaceholderText(/Имя куратора/)).toHaveValue('Alice');
      expect(screen.getByPlaceholderText(/t\.me/)).toHaveValue('https://example.com/a');
      expect(tagsInput()).toHaveValue('#alpha #beta');
    });

    it('falls back to curator for author and to rawPayload.summary for summary', () => {
      const item = makeFeedItem({ curator: 'Curator Bob', rawPayload: { summary: 'raw summary' } });
      renderWithProviders(<FeedEditNoteModal item={item} onClose={vi.fn()} />);
      expect(screen.getByPlaceholderText(/Имя куратора/)).toHaveValue('Curator Bob');
      expect(screen.getByPlaceholderText(/Краткое содержание/)).toHaveValue('raw summary');
    });

    it('prefills the event date from rawPayload.startDate, else publishedAt', () => {
      const { unmount } = renderWithProviders(
        <FeedEditNoteModal item={makeFeedItem({ rawPayload: { startDate: '2026-05-05T12:00:00.000Z' } })} onClose={vi.fn()} />
      );
      expect(dateInput()).toHaveValue('2026-05-05');
      unmount();

      const noStart = makeFeedItem({ publishedAt: '2026-06-06T12:00:00.000Z', rawPayload: { startDate: null } });
      renderWithProviders(<FeedEditNoteModal item={noStart} onClose={vi.fn()} />);
      expect(dateInput()).toHaveValue('2026-06-06');
    });

    it('shows the cover state and wires the AI cover button', async () => {
      const onOpenAiCover = vi.fn();
      const item = makeFeedItem();
      renderWithProviders(<FeedEditNoteModal item={item} onClose={vi.fn()} onOpenAiCover={onOpenAiCover} />);
      expect(screen.getByText('У записи нет обложки')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /Создать обложку/ }));
      expect(onOpenAiCover).toHaveBeenCalledWith(item);
    });

    it('shows the active-cover state when the item has a cover', () => {
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem({ coverUrl: '/uploads/c.png' })} onClose={vi.fn()} />);
      expect(screen.getByText('Обложка записи активна')).toBeInTheDocument();
      expect(screen.getByAltText('Cover preview')).toBeInTheDocument();
    });
  });

  describe('Edit › saving with no errors', () => {
    it('PATCHes /notes/:id with the edited fields and reports success', async () => {
      const api = mockPatch();
      const onSaved = vi.fn();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={vi.fn()} onSaved={onSaved} />);

      await userEvent.clear(titleInput());
      await userEvent.type(titleInput(), 'New title');
      await userEvent.click(saveBtn());

      expect(await screen.findByText(/Запись успешно обновлена/)).toBeInTheDocument();
      expect(api.url).toBe('note-1');
      expect(api.body).toMatchObject({ title: 'New title', hashtags: ['alpha', 'beta'], status: 'DRAFT', privacy: 'private' });
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('closes shortly after a successful save', async () => {
      mockPatch();
      const onClose = vi.fn();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={onClose} />);
      await userEvent.click(saveBtn());
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 3000 });
    });
  });

  describe('Edit › special params', () => {
    it('keeps the original startDate (with time) when the date is untouched', async () => {
      const api = mockPatch();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={vi.fn()} />);
      await userEvent.click(saveBtn());
      await screen.findByText(/Запись успешно обновлена/);
      expect(api.body!.startDate).toBe('2026-10-31T18:00:00.000Z');
    });

    it('normalises edited hashtags', async () => {
      const api = mockPatch();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={vi.fn()} />);
      await userEvent.clear(tagsInput());
      await userEvent.type(tagsInput(), '#One, two  #Three');
      await userEvent.click(saveBtn());
      await screen.findByText(/Запись успешно обновлена/);
      expect(api.body!.hashtags).toEqual(['One', 'two', 'Three']);
    });

    it.each([
      ['dev', { privacy: 'private', status: 'DRAFT' }],
      ['staging', { privacy: 'public', status: 'DRAFT' }],
      ['public', { privacy: 'public', status: 'PUBLISHED' }],
    ])('publication stage "%s" maps to privacy/status', async (key, expected) => {
      const api = mockPatch();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={vi.fn()} />);
      await userEvent.click(stage(key));
      await userEvent.click(saveBtn());
      await screen.findByText(/Запись успешно обновлена/);
      expect(api.body).toMatchObject(expected);
    });

    it('publishing a draft sets publishAt; unpublishing clears it', async () => {
      const api = mockPatch();
      const { unmount } = renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={vi.fn()} />);
      await userEvent.click(stage('public'));
      await userEvent.click(saveBtn());
      await screen.findByText(/Запись успешно обновлена/);
      expect(api.body!.publishAt).toEqual(expect.any(String));
      unmount();

      const published = makeFeedItem({ rawPayload: { status: 'PUBLISHED', privacy: 'public', publishAt: '2026-10-25T10:00:00.000Z' } });
      renderWithProviders(<FeedEditNoteModal item={published} onClose={vi.fn()} />);
      await userEvent.click(stage('dev'));
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.body!.publishAt).toBeNull());
    });

    it('preselects the stage from the item (public + PUBLISHED → Public)', async () => {
      const api = mockPatch();
      const published = makeFeedItem({ rawPayload: { status: 'PUBLISHED', privacy: 'public', publishAt: '2026-10-25T10:00:00.000Z' } });
      renderWithProviders(<FeedEditNoteModal item={published} onClose={vi.fn()} />);
      await userEvent.click(saveBtn());
      await screen.findByText(/Запись успешно обновлена/);
      expect(api.body).toMatchObject({ privacy: 'public', status: 'PUBLISHED', publishAt: '2026-10-25T10:00:00.000Z' });
    });

    it('"Сгенерировать выжимку" fills the summary from the description', async () => {
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem({ description: 'A reasonably long description of the note.' })} onClose={vi.fn()} />);
      const summary = screen.getByPlaceholderText(/Краткое содержание/);
      expect(summary).toHaveValue('');
      await userEvent.click(screen.getByRole('button', { name: /Сгенерировать выжимку/ }));
      expect((summary as HTMLTextAreaElement).value.length).toBeGreaterThan(0);
    });

    it('quick IT-cover presets call onOpenAiCover with a template id', async () => {
      const onOpenAiCover = vi.fn();
      const item = makeFeedItem();
      renderWithProviders(<FeedEditNoteModal item={item} onClose={vi.fn()} onOpenAiCover={onOpenAiCover} />);
      const presets = screen.getAllByRole('button').filter((b) => b.getAttribute('title') && b.className.includes('hover:bg-purple-500/15') && !b.textContent?.includes('AI'));
      expect(presets.length).toBeGreaterThan(0);
      await userEvent.click(presets[0]);
      expect(onOpenAiCover).toHaveBeenCalledWith(item, expect.any(String));
    });
  });

  describe('Edit › validation and errors', () => {
    it('rejects an empty title without calling the API', async () => {
      const api = mockPatch();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={vi.fn()} />);
      await userEvent.clear(titleInput());
      await userEvent.click(saveBtn());
      expect(await screen.findByText('Заголовок записи не может быть пустым')).toBeInTheDocument();
      expect(api.calls).toBe(0);
    });

    it('shows the server error and stays open on failure', async () => {
      mockPatch({ status: 403, body: { message: 'Forbidden note' } });
      const onClose = vi.fn();
      const onSaved = vi.fn();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={onClose} onSaved={onSaved} />);
      await userEvent.click(saveBtn());
      expect(await screen.findByText('Forbidden note')).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edit › keyboard / dismissal (AGENTS.md §7)', () => {
    it('closes on Escape', async () => {
      const onClose = vi.fn();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={onClose} />);
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT close on Escape when disableEscClose is set (nested child on top)', async () => {
      const onClose = vi.fn();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={onClose} disableEscClose />);
      await userEvent.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on backdrop click but not on dialog-card click', async () => {
      const onClose = vi.fn();
      renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={onClose} />);
      const backdrop = screen.getByRole('dialog');
      await userEvent.click(backdrop.firstElementChild as HTMLElement);
      expect(onClose).not.toHaveBeenCalled();
      await userEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('removes the Escape listener on unmount', async () => {
      const onClose = vi.fn();
      const { unmount } = renderWithProviders(<FeedEditNoteModal item={makeFeedItem()} onClose={onClose} />);
      unmount();
      await userEvent.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
