import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamPrivacyBadge } from '../common/StreamPrivacyBadge';
import { NotesPrivacyContourSwitcher } from '../toolbar/NotesPrivacyContourSwitcher';
import { FeedStreamSourceRow } from '../toolbar/FeedStreamSourceRow';
import { FeedPostCard } from '../FeedPostCard';
import { DEFAULT_FEED_MODES } from '../toolbar/types';
import { UnifiedFeedItem } from '../../adapters/feeds/types';
import { renderHook, act } from '@testing-library/react';
import { useFeedFilters } from '../../hooks/useFeedFilters';

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

describe('Unified Binary Privacy: Badges & Contour Switcher', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  describe('StreamPrivacyBadge', () => {
    it('renders Public badge with globe icon for public streams', () => {
      render(<StreamPrivacyBadge privacy="public" />);
      const badge = screen.getByTestId('stream-privacy-badge-public');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Public');
      expect(badge.className).toContain('text-sky-700');
    });

    it('renders Private badge with lock icon for private streams', () => {
      render(<StreamPrivacyBadge privacy="private" />);
      const badge = screen.getByTestId('stream-privacy-badge-private');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Private');
      expect(badge.className).toContain('text-purple-700');
    });
  });

  describe('FeedStreamSourceRow with Stream Privacy Badges', () => {
    it('renders public badges on public stream tabs and private badge on private stream tabs', () => {
      render(
        <FeedStreamSourceRow
          streamSource="all"
          onSetStreamSource={vi.fn()}
          sourceModes={DEFAULT_FEED_MODES}
        />
      );

      const publicBadges = screen.getAllByTestId('stream-privacy-badge-public');
      expect(publicBadges.length).toBeGreaterThanOrEqual(1);

      const privateBadges = screen.getAllByTestId('stream-privacy-badge-private');
      expect(privateBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('NotesPrivacyContourSwitcher', () => {
    it('renders public, private, and all contour buttons', () => {
      const onChange = vi.fn();
      render(<NotesPrivacyContourSwitcher privacy="all" onChange={onChange} />);

      expect(screen.getByTestId('notes-privacy-contour-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('notes-privacy-public-btn')).toHaveTextContent('Публичный');
      expect(screen.getByTestId('notes-privacy-private-btn')).toHaveTextContent('Приватный');
      expect(screen.getByTestId('notes-privacy-all-btn')).toHaveTextContent('Все');
    });

    it('triggers onChange with correct contour when buttons are clicked', () => {
      const onChange = vi.fn();
      render(<NotesPrivacyContourSwitcher privacy="all" onChange={onChange} />);

      fireEvent.click(screen.getByTestId('notes-privacy-public-btn'));
      expect(onChange).toHaveBeenCalledWith('public');

      fireEvent.click(screen.getByTestId('notes-privacy-private-btn'));
      expect(onChange).toHaveBeenCalledWith('private');

      fireEvent.click(screen.getByTestId('notes-privacy-all-btn'));
      expect(onChange).toHaveBeenCalledWith('all');
    });

    it('does not render when isPublicMode is true (strict public safety)', () => {
      const onChange = vi.fn();
      const { container } = render(
        <NotesPrivacyContourSwitcher privacy="public" onChange={onChange} isPublicMode={true} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('FeedPostCard Note Privacy Badges', () => {
    const baseItem: UnifiedFeedItem = {
      id: 'test-note-1',
      sourceType: 'it_dev',
      feedSlug: 'spark-ai',
      channelTitle: 'Spark AI',
      channelHandle: '@spark_ai',
      avatarIcon: '🤖',
      category: {
        label: 'IT & Dev',
        emoji: '💻',
        colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      },
      title: 'Test Note Title',
      description: 'Test Note Description',
      publishedAt: '2026-11-04T12:00:00Z',
      rawPayload: {
        id: 'test-note-1',
        title: 'Test Note Title',
        privacy: 'public',
      },
    };

    it('renders Public badge when note privacy is public', () => {
      render(<FeedPostCard item={baseItem} onOpenDetail={vi.fn()} />);
      expect(screen.getByTestId('note-privacy-badge-public')).toBeInTheDocument();
      expect(screen.queryByTestId('note-privacy-badge-private')).toBeNull();
    });

    it('renders Private badge when note privacy is private', () => {
      const privateItem: UnifiedFeedItem = {
        ...baseItem,
        id: 'test-note-private',
        rawPayload: {
          id: 'test-note-private',
          title: 'Secret Internal Note',
          privacy: 'private',
        },
      };

      render(<FeedPostCard item={privateItem} onOpenDetail={vi.fn()} />);
      expect(screen.getByTestId('note-privacy-badge-private')).toBeInTheDocument();
      expect(screen.queryByTestId('note-privacy-badge-public')).toBeNull();
    });

    it('does not render duplicate Private badge when category label is also Private', () => {
      const privateAdapterItem: UnifiedFeedItem = {
        ...baseItem,
        id: 'test-note-private-adapter',
        sourceType: 'private_feeds',
        category: {
          label: 'Private',
          emoji: '🔒',
          colorClass: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
        },
        rawPayload: {
          id: 'test-note-private-adapter',
          title: 'Secret Internal Note',
          privacy: 'private',
        },
      };

      render(<FeedPostCard item={privateAdapterItem} onOpenDetail={vi.fn()} />);
      expect(screen.getByTestId('note-privacy-badge-private')).toBeInTheDocument();
      expect(screen.getAllByText(/Private/)).toHaveLength(1);
    });
  });

  describe('useFeedFilters Notes Privacy State', () => {
    it('defaults to "all" and updates via handleSetNotesPrivacy', () => {
      const { result } = renderHook(() =>
        useFeedFilters({
          allPeriods: [],
          setSelectedFeedSlug: vi.fn(),
        })
      );

      expect(result.current.notesPrivacy).toBe('all');

      act(() => {
        result.current.handleSetNotesPrivacy('private');
      });

      expect(result.current.notesPrivacy).toBe('private');
      expect(localStorage.getItem('lenta_notes_privacy')).toBe('private');

      act(() => {
        result.current.handleSetNotesPrivacy('public');
      });

      expect(result.current.notesPrivacy).toBe('public');
      expect(localStorage.getItem('lenta_notes_privacy')).toBe('public');
    });
  });

  describe('Preloaded Scaffold Presets & PrivateFeedsAdapter', () => {
    it('provides distinct Public and Private stream presets', async () => {
      const { PUBLIC_STREAM_PRESETS, PRIVATE_STREAM_PRESETS, resolveStreamPrivacy } = await import(
        '../toolbar/types'
      );

      expect(PUBLIC_STREAM_PRESETS.length).toBeGreaterThanOrEqual(6);
      expect(PUBLIC_STREAM_PRESETS.every((p) => resolveStreamPrivacy(p) === 'public')).toBe(true);

      expect(PRIVATE_STREAM_PRESETS.length).toBeGreaterThanOrEqual(1);
      expect(PRIVATE_STREAM_PRESETS.every((p) => resolveStreamPrivacy(p) === 'private')).toBe(true);

      // Verify string slug privacy resolution
      expect(resolveStreamPrivacy('all')).toBe('public');
      expect(resolveStreamPrivacy('it_dev')).toBe('public');
      expect(resolveStreamPrivacy('private_feeds')).toBe('private');
      expect(resolveStreamPrivacy('personal_notes')).toBe('private');
      expect(resolveStreamPrivacy('work_vault')).toBe('private');
      expect(resolveStreamPrivacy('secure_vault')).toBe('private');
    });

    it('includes private database feeds in PrivateFeedsAdapter even with 0 notes', async () => {
      const { PrivateFeedsAdapter } = await import('../../adapters/feeds/privateFeedsAdapter');

      const tabs = PrivateFeedsAdapter.getTabs({
        allFeeds: [
          { id: 'f1', slug: 'private-notes', title: 'Личные заметки', privacy: 'private' } as any,
          { id: 'f2', slug: 'work-vault', title: 'Рабочий архив', privacy: 'private' } as any,
        ],
        notes: [],
      });

      expect(tabs.length).toBe(2);
      const slugs = tabs.map((t) => t.slug);
      expect(slugs).toContain('private-notes');
      expect(slugs).toContain('work-vault');
    });
  });
});
