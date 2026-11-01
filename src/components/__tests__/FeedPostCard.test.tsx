import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeFeedItem } from '../../test/fixtures';
import { FeedPostCard } from '../FeedPostCard';

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

describe('FeedPostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('PostCard › rendering', () => {
    it('renders channel title, handle with single @, category badge and note title', () => {
      const item = makeFeedItem({
        channelTitle: 'Tech Radar',
        channelHandle: '@@techradar',
        category: { label: 'Технологии', emoji: '💻', colorClass: 'border-blue-500' },
        title: 'DeepSeek-V3 Architecture Deep Dive',
      });

      render(<FeedPostCard item={item} appMode="public" />);

      expect(screen.getByText('Tech Radar')).toBeInTheDocument();
      expect(screen.getByText('@techradar')).toBeInTheDocument();
      expect(screen.getByText(/Технологии/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'DeepSeek-V3 Architecture Deep Dive' })).toBeInTheDocument();
    });

    it('formats date and displays time in Russian locale', () => {
      const item = makeFeedItem({
        publishedAt: '2026-10-31T09:15:00.000Z',
      });

      render(<FeedPostCard item={item} appMode="public" />);

      // Contains Russian month abbreviation or day number
      expect(screen.getByText(/31/)).toBeInTheDocument();
    });

    it('shows views count and high resonance badge when score >= 80', () => {
      const normalItem = makeFeedItem({ resonanceScore: 45 });
      const { unmount } = render(<FeedPostCard item={normalItem} appMode="public" />);
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.queryByText(/Резонанс 45%/)).toBeNull();
      unmount();

      const highResItem = makeFeedItem({ resonanceScore: 92 });
      render(<FeedPostCard item={highResItem} appMode="public" />);
      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('Резонанс 92%')).toBeInTheDocument();
    });

    it('shows curator when provided and not "auto"', () => {
      const itemWithCurator = makeFeedItem({ curator: 'Alice Editor' });
      const { unmount } = render(<FeedPostCard item={itemWithCurator} appMode="public" />);
      expect(screen.getByText('Alice Editor')).toBeInTheDocument();
      unmount();

      const itemAuto = makeFeedItem({ curator: 'auto' });
      render(<FeedPostCard item={itemAuto} appMode="public" />);
      expect(screen.queryByText('auto')).toBeNull();
    });

    it('shows up to 3 hashtags stripping leading #', () => {
      const item = makeFeedItem({
        hashtags: ['#ai', 'neural', '#machinelearning', 'extraTag'],
      });

      render(<FeedPostCard item={item} appMode="public" />);

      expect(screen.getByRole('button', { name: '#ai' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '#neural' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '#machinelearning' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '#extraTag' })).toBeNull();
    });

    it('shows folder path badge in staging mode when provided', () => {
      const item = makeFeedItem({
        rawPayload: { folderPath: 'Research/Models' },
      });

      const { unmount } = render(<FeedPostCard item={item} appMode="staging" />);
      expect(screen.getByText('Research/Models')).toBeInTheDocument();
      unmount();

      render(<FeedPostCard item={item} appMode="public" />);
      expect(screen.queryByText('Research/Models')).toBeNull();
    });
  });

  describe('PostCard › cover image', () => {
    it('renders image banner with coverUrl', () => {
      const item = makeFeedItem({
        coverUrl: 'https://cdn.example.com/cover.jpg',
      });

      render(<FeedPostCard item={item} appMode="public" />);
      const img = screen.getByRole('img', { name: item.title });
      expect(img).toHaveAttribute('src', 'https://cdn.example.com/cover.jpg');
    });

    it('falls back to rawPayload images when coverUrl is absent', () => {
      const item = makeFeedItem({
        coverUrl: undefined,
        rawPayload: {
          images: [{ url: 'https://cdn.example.com/raw-cover.png' }],
        },
      });

      render(<FeedPostCard item={item} appMode="public" />);
      const img = screen.getByRole('img', { name: item.title });
      expect(img).toHaveAttribute('src', 'https://cdn.example.com/raw-cover.png');
    });

    it('hides cover image when error occurs', () => {
      const item = makeFeedItem({
        coverUrl: 'https://cdn.example.com/broken.png',
      });

      render(<FeedPostCard item={item} appMode="public" />);
      const img = screen.getByRole('img', { name: item.title });
      fireEvent.error(img);
      expect(screen.queryByRole('img', { name: item.title })).toBeNull();
    });
  });

  describe('PostCard › expand / collapse', () => {
    it('displays snippet for short text and does not show expand button', () => {
      const item = makeFeedItem({
        description: 'Short update about recent advancements.',
      });

      render(<FeedPostCard item={item} appMode="public" />);
      expect(screen.getByText(/Short update about/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Читать далее/ })).toBeNull();
    });

    it('shows "Читать далее" for long description and toggles full text', async () => {
      const longText = 'A'.repeat(300);
      const item = makeFeedItem({
        description: `${longText}\n\nKey finding: breakthrough achieved in latent space optimization.`,
      });

      render(<FeedPostCard item={item} appMode="public" />);

      const expandBtn = screen.getByRole('button', { name: /Читать далее/ });
      expect(expandBtn).toBeInTheDocument();

      await userEvent.click(expandBtn);
      expect(screen.getByRole('button', { name: /Свернуть/ })).toBeInTheDocument();
      expect(screen.getByText(/breakthrough achieved/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /Свернуть/ }));
      expect(screen.getByRole('button', { name: /Читать далее/ })).toBeInTheDocument();
    });
  });

  describe('PostCard › actions and callbacks', () => {
    it('calls onOpenDetail when card is clicked', async () => {
      const onOpenDetail = vi.fn();
      const item = makeFeedItem();

      render(<FeedPostCard item={item} onOpenDetail={onOpenDetail} appMode="public" />);

      await userEvent.click(screen.getByRole('article'));
      expect(onOpenDetail).toHaveBeenCalledWith(item);
    });

    it('calls onEditNote and stops propagation to onOpenDetail', async () => {
      const onOpenDetail = vi.fn();
      const onEditNote = vi.fn();
      const item = makeFeedItem();

      render(
        <FeedPostCard
          item={item}
          onOpenDetail={onOpenDetail}
          onEditNote={onEditNote}
          appMode="staging"
        />
      );

      const editBtn = screen.getByTitle('Редактировать запись');
      await userEvent.click(editBtn);

      expect(onEditNote).toHaveBeenCalledWith(item);
      expect(onOpenDetail).not.toHaveBeenCalled();
    });

    it('calls onAiCover and stops propagation to onOpenDetail', async () => {
      const onOpenDetail = vi.fn();
      const onAiCover = vi.fn();
      const item = makeFeedItem();

      render(
        <FeedPostCard
          item={item}
          onOpenDetail={onOpenDetail}
          onAiCover={onAiCover}
          appMode="staging"
        />
      );

      const aiBtn = screen.getByTitle('Создать обложку (AI)');
      await userEvent.click(aiBtn);

      expect(onAiCover).toHaveBeenCalledWith(item);
      expect(onOpenDetail).not.toHaveBeenCalled();
    });

    it('calls onSelectTag and stops propagation to onOpenDetail', async () => {
      const onOpenDetail = vi.fn();
      const onSelectTag = vi.fn();
      const item = makeFeedItem({ hashtags: ['deeplearning'] });

      render(
        <FeedPostCard
          item={item}
          onOpenDetail={onOpenDetail}
          onSelectTag={onSelectTag}
          appMode="public"
        />
      );

      const tagBtn = screen.getByRole('button', { name: '#deeplearning' });
      await userEvent.click(tagBtn);

      expect(onSelectTag).toHaveBeenCalledWith('deeplearning');
      expect(onOpenDetail).not.toHaveBeenCalled();
    });

    it('copies link on share button click', async () => {
      const item = makeFeedItem({
        title: 'Shareable Note',
        sourceLink: 'https://example.com/share',
      });

      render(<FeedPostCard item={item} appMode="public" />);

      const shareBtn = screen.getByTitle('Поделиться');
      await userEvent.click(shareBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Shareable Note\nhttps://example.com/share'
      );
    });
  });

  describe('PostCard › staging moderation & audio player', () => {
    it('renders StagingCardModerationBar in staging mode', () => {
      const item = makeFeedItem({ status: 'DRAFT' });

      render(<FeedPostCard item={item} appMode="staging" />);
      expect(screen.getByText(/НА ПРЕМОДЕРАЦИИ \(СТЕЙДЖИНГ\)/)).toBeInTheDocument();
    });

    it('[BUG-008] renders NotebookLM podcast widget and safely handles audio play promise', async () => {
      const item = makeFeedItem({
        audioUrl: 'https://cdn.example.com/podcast.mp3',
        audioDuration: 180,
      });

      render(<FeedPostCard item={item} appMode="public" />);

      expect(screen.getByText('NotebookLM AI Podcast')).toBeInTheDocument();
      expect(screen.getByText('3 мин')).toBeInTheDocument();

      const playBtn = screen.getByTitle('Слушать подкаст');
      await userEvent.click(playBtn);
      expect(screen.getByText(/Воспроизведение аудио-выпуска NotebookLM/)).toBeInTheDocument();
    });
  });
});
