import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeFeedItem } from '../../test/fixtures';
import { FeedDetailModal } from '../FeedDetailModal';

const backdrop = () => screen.getByRole('dialog');

describe('FeedDetailModal', () => {
  describe('Detail › rendering', () => {
    it('renders nothing without an item', () => {
      render(<FeedDetailModal item={null} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('shows channel, handle (single @), category, title and markdown body', () => {
      const item = makeFeedItem({
        channelTitle: 'IT News',
        channelHandle: '@@it-news',
        category: { label: 'Новости', emoji: '📰', colorClass: '' },
        title: 'Big release',
        description: '## Heading\n\n- one\n- **two**',
      });
      render(<FeedDetailModal item={item} onClose={vi.fn()} />);
      expect(screen.getByText('IT News')).toBeInTheDocument();
      expect(screen.getByText('@it-news')).toBeInTheDocument();
      expect(screen.getByText(/Новости/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Big release' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Heading' })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByText('two').tagName).toBe('STRONG');
    });

    it('renders GFM (tables) from the description', () => {
      render(<FeedDetailModal item={makeFeedItem({ description: '| a | b |\n|---|---|\n| 1 | 2 |' })} onClose={vi.fn()} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('shows the resonance score only when it is a number (0 counts)', () => {
      const { unmount } = render(<FeedDetailModal item={makeFeedItem({ resonanceScore: 0 })} onClose={vi.fn()} />);
      expect(screen.getByText('Резонанс 0%')).toBeInTheDocument();
      unmount();
      render(<FeedDetailModal item={makeFeedItem()} onClose={vi.fn()} />);
      expect(screen.queryByText(/Резонанс/)).toBeNull();
    });

    it('shows curator and source link only when provided', () => {
      const { unmount } = render(
        <FeedDetailModal item={makeFeedItem({ curator: 'Alice', sourceLink: 'https://example.com/x' })} onClose={vi.fn()} />
      );
      expect(screen.getByText('Автор: Alice')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /Открыть оригинал/ });
      expect(link).toHaveAttribute('href', 'https://example.com/x');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      unmount();

      render(<FeedDetailModal item={makeFeedItem()} onClose={vi.fn()} />);
      expect(screen.queryByText(/Автор:/)).toBeNull();
      expect(screen.queryByRole('link')).toBeNull();
    });
  });

  describe('Detail › cover image', () => {
    it('uses coverUrl, falling back to the main image, then the first image', () => {
      const { unmount } = render(<FeedDetailModal item={makeFeedItem({ coverUrl: 'https://cdn/x.png' })} onClose={vi.fn()} />);
      expect(screen.getByRole('img', { name: 'Original title' })).toHaveAttribute('src', 'https://cdn/x.png');
      unmount();

      const images = [{ url: 'https://cdn/first.png' }, { url: 'https://cdn/main.png', isMain: true }];
      const { unmount: u2 } = render(<FeedDetailModal item={makeFeedItem({ rawPayload: { images } })} onClose={vi.fn()} />);
      expect(screen.getByRole('img', { name: 'Original title' })).toHaveAttribute('src', 'https://cdn/main.png');
      u2();

      render(<FeedDetailModal item={makeFeedItem({ rawPayload: { images: [{ url: 'https://cdn/first.png' }] } })} onClose={vi.fn()} />);
      expect(screen.getByRole('img', { name: 'Original title' })).toHaveAttribute('src', 'https://cdn/first.png');
    });

    it('hides the cover if it fails to load', () => {
      render(<FeedDetailModal item={makeFeedItem({ coverUrl: 'https://cdn/broken.png' })} onClose={vi.fn()} />);
      fireEvent.error(screen.getByRole('img', { name: 'Original title' }));
      expect(screen.queryByRole('img', { name: 'Original title' })).toBeNull();
    });

    it('retries the cover when a different item is shown', () => {
      const a = makeFeedItem({ id: 'a', coverUrl: 'https://cdn/a.png' });
      const b = makeFeedItem({ id: 'b', title: 'B', coverUrl: 'https://cdn/b.png' });
      const { rerender } = render(<FeedDetailModal item={a} onClose={vi.fn()} />);
      fireEvent.error(screen.getByRole('img'));
      expect(screen.queryByRole('img')).toBeNull();
      rerender(<FeedDetailModal item={b} onClose={vi.fn()} />);
      expect(screen.getByRole('img', { name: 'B' })).toBeInTheDocument();
    });
  });

  describe('Detail › actions', () => {
    it('hides Edit / AI-cover buttons unless handlers are passed', () => {
      render(<FeedDetailModal item={makeFeedItem()} onClose={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /Редактировать/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /AI Обложка/ })).toBeNull();
    });

    it('calls onEditNote and onAiCover with the item', async () => {
      const item = makeFeedItem();
      const onEditNote = vi.fn();
      const onAiCover = vi.fn();
      render(<FeedDetailModal item={item} onClose={vi.fn()} onEditNote={onEditNote} onAiCover={onAiCover} />);
      await userEvent.click(screen.getByRole('button', { name: /Редактировать/ }));
      await userEvent.click(screen.getByRole('button', { name: /AI Обложка/ }));
      expect(onEditNote).toHaveBeenCalledWith(item);
      expect(onAiCover).toHaveBeenCalledWith(item);
    });

    it('clicking a hashtag selects it (without #) and closes the modal', async () => {
      const onSelectTag = vi.fn();
      const onClose = vi.fn();
      render(<FeedDetailModal item={makeFeedItem({ hashtags: ['alpha', '#beta'] })} onClose={onClose} onSelectTag={onSelectTag} />);
      expect(screen.getByRole('button', { name: '#alpha' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: '#beta' }));
      expect(onSelectTag).toHaveBeenCalledWith('#beta');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hashtag click still closes when no onSelectTag is provided', async () => {
      const onClose = vi.fn();
      render(<FeedDetailModal item={makeFeedItem({ hashtags: ['alpha'] })} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: '#alpha' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Detail › keyboard / dismissal (AGENTS.md §7)', () => {
    it('closes on Escape', async () => {
      const onClose = vi.fn();
      render(<FeedDetailModal item={makeFeedItem()} onClose={onClose} />);
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ignores Escape when disableEscClose is set (child modal on top)', async () => {
      const onClose = vi.fn();
      render(<FeedDetailModal item={makeFeedItem()} onClose={onClose} disableEscClose />);
      await userEvent.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('removes the Escape listener on unmount', async () => {
      const onClose = vi.fn();
      const { unmount } = render(<FeedDetailModal item={makeFeedItem()} onClose={onClose} />);
      unmount();
      await userEvent.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on backdrop click, not on card click', async () => {
      const onClose = vi.fn();
      render(<FeedDetailModal item={makeFeedItem()} onClose={onClose} />);
      await userEvent.click(backdrop().firstElementChild as HTMLElement);
      expect(onClose).not.toHaveBeenCalled();
      await userEvent.click(backdrop());
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes via the X button', async () => {
      const onClose = vi.fn();
      render(<FeedDetailModal item={makeFeedItem()} onClose={onClose} />);
      const header = backdrop().querySelector('h4')!.closest('div.flex.items-center.justify-between')!;
      await userEvent.click(header.querySelector('button')!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.todo(
      'does not close when a drag that started inside the card is released on the backdrop ' +
        '(currently closes: the card stops mousedown propagation, so the overlay never records the origin)'
    );
  });

  describe('Detail › body scroll lock', () => {
    it('locks page scroll while open and restores the previous value on close', () => {
      document.body.style.overflow = 'auto';
      const { unmount } = render(<FeedDetailModal item={makeFeedItem()} onClose={vi.fn()} />);
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('auto');
      document.body.style.overflow = '';
    });

    it('does not touch scroll while there is no item', () => {
      document.body.style.overflow = 'scroll';
      render(<FeedDetailModal item={null} onClose={vi.fn()} />);
      expect(document.body.style.overflow).toBe('scroll');
      document.body.style.overflow = '';
    });
  });
});
