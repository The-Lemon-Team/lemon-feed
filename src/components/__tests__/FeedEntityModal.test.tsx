import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { renderWithProviders } from '../../test/renderWithProviders';
import { FeedEntityModal } from '../FeedEntityModal';

type Body = Record<string, any>;

function mockFeedsApi(opts: { fail?: { status: number; body: unknown } } = {}) {
  const state = {
    post: null as Body | null,
    patch: null as { id: string; body: Body } | null,
    deleted: null as string | null,
    calls: 0,
  };
  const failure = () => (opts.fail ? HttpResponse.json(opts.fail.body as any, { status: opts.fail.status }) : null);
  server.use(
    http.post('*/feeds', async ({ request }) => {
      state.calls++;
      state.post = (await request.json()) as Body;
      return failure() ?? HttpResponse.json({ id: 'new-feed', ...state.post });
    }),
    http.patch('*/feeds/:id', async ({ request, params }) => {
      state.calls++;
      state.patch = { id: String(params.id), body: (await request.json()) as Body };
      return failure() ?? HttpResponse.json({ id: params.id, ...state.patch.body });
    }),
    http.delete('*/feeds/:id', ({ params }) => {
      state.calls++;
      state.deleted = String(params.id);
      return failure() ?? new HttpResponse(null, { status: 204 });
    })
  );
  return state;
}

const nameInput = () => screen.getByPlaceholderText('Например: ИИ & Модели');
const slugInput = () => screen.getByPlaceholderText('ai-models');
const saveBtn = () => screen.getByRole('button', { name: /Сохранить ленту/ });
const addButtons = () => screen.getAllByRole('button', { name: 'Добавить' }); // [folders, tags]
const folderInput = () => screen.getByPlaceholderText(/Spark\/AI/);
const tagInput = () => screen.getByPlaceholderText(/#ai, #security/);

const feedData = {
  id: 'feed-1',
  slug: 'it-news',
  title: 'IT News',
  description: 'All things IT',
  icon: '📰',
  color: '#10b981',
  privacy: 'private',
  folderPaths: ['Spark/AI'],
  hashtags: ['ai'],
} as any;

const feedTab = (over: Record<string, unknown> = {}) =>
  ({ id: 'tab-uuid', slug: 'tab-slug', title: 'Tab Title', shortTitle: 'Tab', emoji: '🚀', category: 'x', count: 3, accentColor: '#ef4444', description: 'Tab desc', ...over }) as any;

afterEach(() => vi.restoreAllMocks());

describe('FeedEntityModal', () => {
  describe('Feed › create', () => {
    it('shows create-mode header and defaults (public, 📁, blue)', () => {
      mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      expect(screen.getByText('Создание новой ленты (фида)')).toBeInTheDocument();
      expect(screen.getByDisplayValue('📁')).toBeInTheDocument();
      expect(document.querySelector('input[type="color"]')).toHaveValue('#2481cc');
      expect(screen.queryByRole('button', { name: /Удалить ленту/ })).toBeNull();
    });

    it('auto-generates the slug from the title', async () => {
      mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), '  AI & Models_v2!  ');
      expect(slugInput()).toHaveValue('ai-models-v2');
    });

    it('POSTs /feeds with the entered data, then calls onSaved and onClose', async () => {
      const api = mockFeedsApi();
      const onSaved = vi.fn();
      const onClose = vi.fn();
      renderWithProviders(<FeedEntityModal isOpen onClose={onClose} onSaved={onSaved} />);

      await userEvent.type(nameInput(), 'My Feed');
      await userEvent.type(screen.getByPlaceholderText(/Краткое описание/), '  about  ');
      await userEvent.click(saveBtn());

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(onSaved).toHaveBeenCalledTimes(1);
      expect(api.post).toEqual({
        title: 'My Feed',
        slug: 'my-feed',
        description: 'about',
        icon: '📁',
        color: '#2481cc',
        privacy: 'public',
        folderPaths: [],
        hashtags: [],
      });
    });

    it('omits an empty description', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'X');
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.post).not.toHaveProperty('description');
    });

    it('a manually edited slug is kept in create mode until the title changes again', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'Foo');
      await userEvent.clear(slugInput());
      await userEvent.type(slugInput(), 'custom-slug');
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.post!.slug).toBe('custom-slug');
    });
  });

  describe('Feed › special params', () => {
    it('privacy toggle maps to binary public/private', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'Secret');
      await userEvent.click(screen.getByRole('button', { name: /Приватный/ }));
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.post!.privacy).toBe('private');
    });

    it('preset emoji and preset color buttons update the payload', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'Styled');
      await userEvent.click(screen.getByRole('button', { name: '🚀' }));
      const swatches = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).filter((b) => b.style.backgroundColor);
      await userEvent.click(swatches[1]); // #f97316
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.post).toMatchObject({ icon: '🚀', color: '#f97316' });
    });

    it('the custom color picker updates the payload', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'Picker');
      fireEvent.change(document.querySelector('input[type="color"]')!, { target: { value: '#123456' } });
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.post!.color).toBe('#123456');
    });

    it('adds folders (button and Enter), trims, rejects duplicates and blanks, and removes them', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'Folders');

      await userEvent.type(folderInput(), '  Spark/AI  ');
      await userEvent.click(addButtons()[0]);
      await userEvent.type(folderInput(), 'Changelogs{Enter}');
      await userEvent.type(folderInput(), 'Spark/AI{Enter}'); // duplicate
      await userEvent.click(addButtons()[0]); // blank
      expect(screen.getAllByText('Spark/AI')).toHaveLength(1);

      const chip = screen.getByText('Changelogs').parentElement!;
      await userEvent.click(chip.querySelector('button')!);
      expect(screen.queryByText('Changelogs')).toBeNull();

      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.post!.folderPaths).toEqual(['Spark/AI']);
    });

    it('adds hashtags without # (button and Enter), rejects duplicates, removes them', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'Tags');

      await userEvent.type(tagInput(), '#ai');
      await userEvent.click(addButtons()[1]);
      await userEvent.type(tagInput(), 'security{Enter}');
      await userEvent.type(tagInput(), '#ai{Enter}'); // duplicate
      expect(screen.getAllByText('#ai')).toHaveLength(1);

      await userEvent.click(screen.getByText('#security').parentElement!.querySelector('button')!);
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.post!.hashtags).toEqual(['ai']);
    });

    it('Enter inside the folder input does not submit the form', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), 'No submit');
      await userEvent.type(folderInput(), 'A{Enter}');
      expect(api.calls).toBe(0);
    });
  });

  describe('Feed › edit', () => {
    it('prefills from feedData and shows edit-mode header with the slug', () => {
      mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen feedData={feedData} onClose={vi.fn()} />);
      expect(screen.getByText('Настройка ленты (фида)')).toBeInTheDocument();
      expect(screen.getByText('slug: it-news')).toBeInTheDocument();
      expect(nameInput()).toHaveValue('IT News');
      expect(slugInput()).toHaveValue('it-news');
      expect(screen.getByDisplayValue('📰')).toBeInTheDocument();
      expect(document.querySelector('input[type="color"]')).toHaveValue('#10b981');
      expect(screen.getByText('Spark/AI')).toBeInTheDocument();
      expect(screen.getByText('#ai')).toBeInTheDocument();
    });

    it('PATCHes /feeds/:id and keeps the existing slug when the title changes', async () => {
      const api = mockFeedsApi();
      const onSaved = vi.fn();
      renderWithProviders(<FeedEntityModal isOpen feedData={feedData} onClose={vi.fn()} onSaved={onSaved} />);
      await userEvent.clear(nameInput());
      await userEvent.type(nameInput(), 'Renamed');
      await userEvent.click(saveBtn());
      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(api.patch!.id).toBe('feed-1');
      expect(api.patch!.body).toMatchObject({ title: 'Renamed', slug: 'it-news', privacy: 'private', icon: '📰', folderPaths: ['Spark/AI'], hashtags: ['ai'] });
      expect(api.post).toBeNull();
    });

    it('prefills from a feedTab (always public, accent color) and PATCHes when it has a real id', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen feedTab={feedTab()} onClose={vi.fn()} />);
      expect(nameInput()).toHaveValue('Tab Title');
      expect(document.querySelector('input[type="color"]')).toHaveValue('#ef4444');
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.patch).not.toBeNull());
      expect(api.patch!.id).toBe('tab-uuid');
    });

    it('a virtual feedTab (id === slug) is saved via POST and cannot be deleted', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen feedTab={feedTab({ id: 'dev', slug: 'dev' })} onClose={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /Удалить ленту/ })).toBeNull();
      await userEvent.click(saveBtn());
      await waitFor(() => expect(api.post).not.toBeNull());
      expect(api.patch).toBeNull();
    });

    it('resets to a blank form when reopened in create mode', async () => {
      mockFeedsApi();
      const { rerender } = renderWithProviders(<FeedEntityModal isOpen feedData={feedData} onClose={vi.fn()} />);
      rerender(<FeedEntityModal isOpen={false} onClose={vi.fn()} />);
      rerender(<FeedEntityModal isOpen onClose={vi.fn()} />);
      expect(nameInput()).toHaveValue('');
      expect(screen.queryByText('Spark/AI')).toBeNull();
    });
  });

  describe('Feed › delete', () => {
    it('deletes after confirmation, then calls onSaved and onClose', async () => {
      const api = mockFeedsApi();
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const onSaved = vi.fn();
      const onClose = vi.fn();
      renderWithProviders(<FeedEntityModal isOpen feedData={feedData} onClose={onClose} onSaved={onSaved} />);
      await userEvent.click(screen.getByRole('button', { name: /Удалить ленту/ }));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining('IT News'));
      expect(api.deleted).toBe('feed-1');
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the confirmation is declined', async () => {
      const api = mockFeedsApi();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const onClose = vi.fn();
      renderWithProviders(<FeedEntityModal isOpen feedData={feedData} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: /Удалить ленту/ }));
      expect(api.calls).toBe(0);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('shows the server error and stays open when deletion fails', async () => {
      mockFeedsApi({ fail: { status: 409, body: { message: 'Feed has notes' } } });
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onClose = vi.fn();
      renderWithProviders(<FeedEntityModal isOpen feedData={feedData} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: /Удалить ленту/ }));
      expect(await screen.findByText('Feed has notes')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Feed › validation and errors', () => {
    it('rejects an empty title without calling the API', async () => {
      const api = mockFeedsApi();
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), '   ');
      await userEvent.click(saveBtn());
      expect(await screen.findByText('Укажите название фида')).toBeInTheDocument();
      expect(api.calls).toBe(0);
    });

    it('shows the server error and stays open when saving fails', async () => {
      mockFeedsApi({ fail: { status: 409, body: { message: 'Slug already exists' } } });
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onClose = vi.fn();
      const onSaved = vi.fn();
      renderWithProviders(<FeedEntityModal isOpen onClose={onClose} onSaved={onSaved} />);
      await userEvent.type(nameInput(), 'Dup');
      await userEvent.click(saveBtn());
      expect(await screen.findByText('Slug already exists')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
      expect(saveBtn()).toBeEnabled();
    });

    it('clears a previous error on the next successful attempt', async () => {
      renderWithProviders(<FeedEntityModal isOpen onClose={vi.fn()} />);
      await userEvent.type(nameInput(), ' ');
      await userEvent.click(saveBtn());
      expect(await screen.findByText('Укажите название фида')).toBeInTheDocument();
      mockFeedsApi();
      await userEvent.type(nameInput(), 'ok');
      await userEvent.click(saveBtn());
      await waitFor(() => expect(screen.queryByText('Укажите название фида')).toBeNull());
    });
  });

  describe('Feed › keyboard / dismissal (AGENTS.md §7)', () => {
    it('renders nothing when closed', () => {
      renderWithProviders(<FeedEntityModal isOpen={false} onClose={vi.fn()} />);
      expect(document.body.querySelector('.fixed.inset-0')).toBeNull();
    });

    it('closes on Escape and removes the listener on unmount', async () => {
      const onClose = vi.fn();
      const { unmount } = renderWithProviders(<FeedEntityModal isOpen onClose={onClose} />);
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
      unmount();
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on backdrop click, not on card click; Cancel closes without API calls', async () => {
      const api = mockFeedsApi();
      const onClose = vi.fn();
      renderWithProviders(<FeedEntityModal isOpen onClose={onClose} />);
      const backdrop = document.body.querySelector('.fixed.inset-0') as HTMLElement;
      await userEvent.click(backdrop.firstElementChild as HTMLElement);
      expect(onClose).not.toHaveBeenCalled();
      await userEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
      await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
      expect(onClose).toHaveBeenCalledTimes(2);
      expect(api.calls).toBe(0);
    });
  });
});
