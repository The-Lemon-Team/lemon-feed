import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedCategoriesSheet } from '../FeedCategoriesSheet';
import { UnifiedFeedTab } from '../../../adapters/feeds';

describe('FeedCategoriesSheet', () => {
  const mockTabs: UnifiedFeedTab[] = [
    {
      id: 'tab-1',
      slug: 'tech',
      title: 'Технологии',
      shortTitle: 'Тех',
      emoji: '💻',
      category: 'work',
      count: 42,
    },
    {
      id: 'tab-2',
      slug: 'design',
      title: 'Дизайн',
      shortTitle: 'Диз',
      emoji: '🎨',
      category: 'art',
      count: 15,
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <FeedCategoriesSheet
        isOpen={false}
        onClose={vi.fn()}
        activeTabs={mockTabs}
        onSelectFeed={vi.fn()}
        totalCount={57}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders categories and channel tabs when open', () => {
    render(
      <FeedCategoriesSheet
        isOpen={true}
        onClose={vi.fn()}
        activeTabs={mockTabs}
        onSelectFeed={vi.fn()}
        totalCount={57}
      />
    );

    expect(screen.getByText('Категории и каналы')).toBeInTheDocument();
    expect(screen.getByText('Все каналы')).toBeInTheDocument();
    expect(screen.getByText('57')).toBeInTheDocument();
    expect(screen.getByText('Технологии')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Дизайн')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(
      <FeedCategoriesSheet
        isOpen={true}
        onClose={onClose}
        activeTabs={mockTabs}
        onSelectFeed={vi.fn()}
        totalCount={57}
      />
    );

    // Click backdrop (outermost fixed div)
    const backdrop = screen.getByText('Категории и каналы').closest('.fixed')!;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <FeedCategoriesSheet
        isOpen={true}
        onClose={onClose}
        activeTabs={mockTabs}
        onSelectFeed={vi.fn()}
        totalCount={57}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectFeed when clicking a channel button', () => {
    const onSelectFeed = vi.fn();
    render(
      <FeedCategoriesSheet
        isOpen={true}
        onClose={vi.fn()}
        activeTabs={mockTabs}
        onSelectFeed={onSelectFeed}
        totalCount={57}
      />
    );

    fireEvent.click(screen.getByText('Технологии'));
    expect(onSelectFeed).toHaveBeenCalledWith('tech');

    fireEvent.click(screen.getByText('Все каналы'));
    expect(onSelectFeed).toHaveBeenCalledWith(undefined);
  });

  it('triggers onAddFeed and closes sheet when clicking add feed button', () => {
    const onAddFeed = vi.fn();
    const onClose = vi.fn();
    render(
      <FeedCategoriesSheet
        isOpen={true}
        onClose={onClose}
        activeTabs={mockTabs}
        onSelectFeed={vi.fn()}
        totalCount={57}
        onAddFeed={onAddFeed}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /фид/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    expect(onClose).toHaveBeenCalled();
    expect(onAddFeed).toHaveBeenCalledTimes(1);
  });
});
