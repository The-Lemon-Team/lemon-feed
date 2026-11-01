import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { makeFeedItem } from '../../test/fixtures';
import { FeedStreamView } from '../FeedStreamView';

vi.mock('../../context/WorkspaceContext', () => ({
  useWorkspaceMembership: vi.fn(() => ({
    workspaces: [],
    membershipsByNoteId: new Map(),
    addToWorkspace: vi.fn(),
    removeFromWorkspace: vi.fn(),
    isNoteInWorkspace: vi.fn(() => false),
    isNotePinnedInWorkspace: vi.fn(() => false),
  })),
}));

vi.mock('../TelegramStreamView', () => ({
  TelegramStreamView: vi.fn(() => <div data-testid="telegram-stream-view">Telegram Stream View</div>),
}));

describe('FeedStreamView', () => {
  const defaultProps = {
    streamSource: 'classic' as const,
    feedItems: [],
    visibleFeedItems: [],
    onSelectFeed: vi.fn(),
    isLoading: false,
    selectedMonth: dayjs('2026-10-01'),
    onResetMonthFilter: vi.fn(),
    onOpenDetail: vi.fn(),
    onSelectTag: vi.fn(),
    visibleCount: 20,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StreamView › loading state', () => {
    it('renders loading indicator when isLoading is true', () => {
      render(<FeedStreamView {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Загрузка ленты...')).toBeInTheDocument();
    });
  });

  describe('StreamView › empty states', () => {
    it('renders default empty state when there are no items and no search query', () => {
      render(<FeedStreamView {...defaultProps} feedItems={[]} visibleFeedItems={[]} />);

      expect(screen.getByText('Нет публикаций')).toBeInTheDocument();
      expect(screen.getByText('В выбранной ленте пока нет записей.')).toBeInTheDocument();
    });

    it('renders search empty state when searchQuery is present', () => {
      render(
        <FeedStreamView
          {...defaultProps}
          feedItems={[]}
          visibleFeedItems={[]}
          searchQuery="quantum computing"
        />
      );

      expect(screen.getByText('Нет публикаций')).toBeInTheDocument();
      expect(screen.getByText('По вашему запросу ничего не найдено.')).toBeInTheDocument();
    });

    it('renders spark empty state and transition button when streamSource is spark', async () => {
      const onSetStreamSource = vi.fn();
      render(
        <FeedStreamView
          {...defaultProps}
          streamSource="spark"
          onSetStreamSource={onSetStreamSource}
          feedItems={[]}
          visibleFeedItems={[]}
        />
      );

      expect(screen.getByText('Приватный контур Spark')).toBeInTheDocument();
      expect(screen.getByText(/Ленты Spark содержат закрытую внутреннюю информацию/)).toBeInTheDocument();

      const switchBtn = screen.getByRole('button', { name: /Перейти в Classic ленты/ });
      await userEvent.click(switchBtn);

      expect(onSetStreamSource).toHaveBeenCalledWith('classic');
    });

    it('renders month filter empty state and reset button when month filter is active', async () => {
      const onResetMonthFilter = vi.fn();
      render(
        <FeedStreamView
          {...defaultProps}
          isMonthFilterActive={true}
          selectedMonth={dayjs('2026-11-01')}
          onResetMonthFilter={onResetMonthFilter}
          feedItems={[]}
          visibleFeedItems={[]}
        />
      );

      expect(screen.getByText(/нет записей для этой папки/)).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: 'Показать все даты' });
      await userEvent.click(resetBtn);

      expect(onResetMonthFilter).toHaveBeenCalled();
    });

    it('renders "Создать первую запись" button in staging mode and handles click', async () => {
      const onCreateNote = vi.fn();
      render(
        <FeedStreamView
          {...defaultProps}
          appMode="staging"
          onCreateNote={onCreateNote}
          feedItems={[]}
          visibleFeedItems={[]}
        />
      );

      const createBtn = screen.getByRole('button', { name: /Создать первую запись/ });
      expect(createBtn).toBeInTheDocument();

      await userEvent.click(createBtn);
      expect(onCreateNote).toHaveBeenCalled();
    });

    it('suppresses "Создать первую запись" in public mode', () => {
      const onCreateNote = vi.fn();
      render(
        <FeedStreamView
          {...defaultProps}
          appMode="public"
          onCreateNote={onCreateNote}
          feedItems={[]}
          visibleFeedItems={[]}
        />
      );

      expect(screen.queryByRole('button', { name: /Создать первую запись/ })).toBeNull();
    });
  });

  describe('StreamView › feed items rendering', () => {
    it('renders list of feed items via FeedPostCard', () => {
      const items = [
        makeFeedItem({ id: 'note-1', title: 'First Note in Stream' }),
        makeFeedItem({ id: 'note-2', title: 'Second Note in Stream' }),
      ];

      render(
        <FeedStreamView
          {...defaultProps}
          feedItems={items}
          visibleFeedItems={items}
          visibleCount={2}
          appMode="public"
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: 'First Note in Stream' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Second Note in Stream' })).toBeInTheDocument();
    });

    it('triggers onOpenDetail when an item is clicked in the stream', async () => {
      const onOpenDetail = vi.fn();
      const items = [makeFeedItem({ id: 'note-1', title: 'Clickable Stream Note' })];

      render(
        <FeedStreamView
          {...defaultProps}
          feedItems={items}
          visibleFeedItems={items}
          visibleCount={1}
          onOpenDetail={onOpenDetail}
          appMode="public"
        />
      );

      await userEvent.click(screen.getByRole('article'));
      expect(onOpenDetail).toHaveBeenCalledWith(items[0]);
    });

    it('suppresses edit and AI cover actions in public mode', () => {
      const onEditNote = vi.fn();
      const onAiCover = vi.fn();
      const items = [makeFeedItem({ id: 'note-1', title: 'Public Note Protected' })];

      render(
        <FeedStreamView
          {...defaultProps}
          feedItems={items}
          visibleFeedItems={items}
          visibleCount={1}
          onEditNote={onEditNote}
          onAiCover={onAiCover}
          appMode="public"
        />
      );

      expect(screen.queryByTitle('Редактировать запись')).toBeNull();
      expect(screen.queryByTitle('Создать обложку (AI)')).toBeNull();
    });

    it('provides edit action in staging mode', () => {
      const onEditNote = vi.fn();
      const items = [makeFeedItem({ id: 'note-1', title: 'Staging Note Editable' })];

      render(
        <FeedStreamView
          {...defaultProps}
          feedItems={items}
          visibleFeedItems={items}
          visibleCount={1}
          onEditNote={onEditNote}
          appMode="staging"
        />
      );

      expect(screen.getByTitle('Редактировать запись')).toBeInTheDocument();
    });
  });

  describe('StreamView › pagination sentinel', () => {
    it('renders pagination sentinel when visibleCount is less than feedItems.length', () => {
      const items = Array.from({ length: 15 }, (_, i) =>
        makeFeedItem({ id: `note-${i}`, title: `Note ${i}` })
      );
      const visible = items.slice(0, 10);

      render(
        <FeedStreamView
          {...defaultProps}
          feedItems={items}
          visibleFeedItems={visible}
          visibleCount={10}
          appMode="public"
        />
      );

      expect(screen.getByText('Показано 10 из 15 публикаций...')).toBeInTheDocument();
    });

    it('does not render pagination sentinel when all items are visible', () => {
      const items = [makeFeedItem({ id: 'note-1', title: 'Single Note' })];

      render(
        <FeedStreamView
          {...defaultProps}
          feedItems={items}
          visibleFeedItems={items}
          visibleCount={1}
          appMode="public"
        />
      );

      expect(screen.queryByText(/Показано/)).toBeNull();
    });
  });

  describe('StreamView › telegram mode', () => {
    it('renders TelegramStreamView when streamSource is telegram', () => {
      render(
        <FeedStreamView
          {...defaultProps}
          streamSource="telegram"
        />
      );

      expect(screen.getByTestId('telegram-stream-view')).toBeInTheDocument();
    });
  });
});
