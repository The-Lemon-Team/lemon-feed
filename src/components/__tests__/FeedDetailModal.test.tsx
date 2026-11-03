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

    it('does not close when a drag that started inside the card is released on the backdrop', () => {
      const onClose = vi.fn();
      render(<FeedDetailModal item={makeFeedItem()} onClose={onClose} />);
      const card = backdrop().firstElementChild as HTMLElement;

      // Start drag inside the card (e.g. text selection)
      fireEvent.mouseDown(card);
      // Release outside on the backdrop
      fireEvent.mouseUp(backdrop());
      // Browser dispatches click on the common ancestor (backdrop)
      fireEvent.click(backdrop());

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Detail › related notes', () => {
    it('renders related notes when present in rawPayload metadata and navigates on click', () => {
      const onOpenNote = vi.fn();
      const itemWithRelated = makeFeedItem({
        rawPayload: {
          metadata: {
            relatedNotes: [
              {
                cleanTitle: '04.11.26 - Релиз World of Warcraft: Forever',
                resolved: true,
                targetNoteId: 'note-wow-release',
                targetTitle: 'Релиз World of Warcraft: Forever',
                targetType: 'EVENT',
                targetIcon: '🚀',
                targetDate: '2026-11-04T12:00:00.000Z',
              },
            ],
          },
        },
      });

      render(<FeedDetailModal item={itemWithRelated} onClose={vi.fn()} onOpenNoteById={onOpenNote} />);

      expect(screen.getByText('Связанные записи (1)')).toBeInTheDocument();
      expect(screen.getByText('Релиз World of Warcraft: Forever')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Релиз World of Warcraft: Forever'));
      expect(onOpenNote).toHaveBeenCalledWith('note-wow-release');
    });

    it('displays back button when navigating forward and navigates back on click', () => {
      const onOpenNote = vi.fn();
      const firstItem = makeFeedItem({ id: 'item-1', title: 'First Note' });
      const secondItem = makeFeedItem({ id: 'item-2', title: 'Second Note' });

      const { rerender } = render(
        <FeedDetailModal item={firstItem} onClose={vi.fn()} onOpenNoteById={onOpenNote} />
      );

      expect(screen.queryByLabelText('Назад к предыдущей новости')).toBeNull();

      // Navigate to second note
      rerender(
        <FeedDetailModal item={secondItem} onClose={vi.fn()} onOpenNoteById={onOpenNote} />
      );

      const backBtn = screen.getByLabelText('Назад к предыдущей новости');
      expect(backBtn).toBeInTheDocument();

      fireEvent.click(backBtn);
      expect(onOpenNote).toHaveBeenCalledWith('item-1');
    });

    it('shows parent breadcrumb banner on direct link entry', () => {
      const onOpenNote = vi.fn();
      const directChildItem = makeFeedItem({
        id: 'child-1',
        title: 'Child Event',
        rawPayload: {
          metadata: {
            relatedNotes: [
              {
                cleanTitle: 'WoW Beta Period',
                resolved: true,
                targetNoteId: 'parent-period-id',
                targetTitle: 'WoW Forever Beta Period',
                isParent: true,
              },
            ],
          },
        },
      });

      render(<FeedDetailModal item={directChildItem} onClose={vi.fn()} onOpenNoteById={onOpenNote} />);

      expect(screen.getByText('Входит в сюжет:')).toBeInTheDocument();
      const parentLink = screen.getByTitle('Перейти к родительской заметке');
      expect(parentLink).toHaveTextContent('WoW Forever Beta Period');

      fireEvent.click(parentLink);
      expect(onOpenNote).toHaveBeenCalledWith('parent-period-id');
    });

    it('applies Telegram-style slide animation classes on forward and backward navigation', () => {
      const onOpenNote = vi.fn();
      const parentItem = makeFeedItem({
        id: 'parent-1',
        title: 'Parent Note',
        rawPayload: {
          metadata: {
            relatedNotes: [
              {
                cleanTitle: 'Child Note',
                resolved: true,
                targetNoteId: 'child-1',
                targetTitle: 'Child Note Title',
              },
            ],
          },
        },
      });
      const childItem = makeFeedItem({
        id: 'child-1',
        title: 'Child Note Title',
        rawPayload: {
          metadata: {
            relatedNotes: [
              {
                cleanTitle: 'Parent Note',
                resolved: true,
                targetNoteId: 'parent-1',
                targetTitle: 'Parent Note',
                isParent: true,
              },
            ],
          },
        },
      });

      const { rerender } = render(
        <FeedDetailModal item={parentItem} onClose={vi.fn()} onOpenNoteById={onOpenNote} />
      );

      // Initially no direction slide animation
      const scrollable = document.querySelector('.touch-scroll');
      expect(scrollable).not.toHaveClass('animate-telegram-forward');
      expect(scrollable).not.toHaveClass('animate-telegram-backward');

      // Click related note (forward)
      fireEvent.click(screen.getByText('Child Note Title'));
      expect(onOpenNote).toHaveBeenCalledWith('child-1');

      // Rerender with childItem
      rerender(<FeedDetailModal item={childItem} onClose={vi.fn()} onOpenNoteById={onOpenNote} />);
      const scrollableAfterForward = document.querySelector('.touch-scroll');
      expect(scrollableAfterForward).toHaveClass('animate-telegram-forward');

      // Click back button (backward)
      const backBtn = screen.getByLabelText('Назад к предыдущей новости');
      fireEvent.click(backBtn);
      expect(onOpenNote).toHaveBeenCalledWith('parent-1');

      // Rerender with parentItem
      rerender(<FeedDetailModal item={parentItem} onClose={vi.fn()} onOpenNoteById={onOpenNote} />);
      const scrollableAfterBack = document.querySelector('.touch-scroll');
      expect(scrollableAfterBack).toHaveClass('animate-telegram-backward');
    });
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
