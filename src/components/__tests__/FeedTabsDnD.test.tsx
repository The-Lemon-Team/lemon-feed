import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FeedStreamSourceRow } from '../toolbar/FeedStreamSourceRow';
import { FeedCategoryTabsRow } from '../toolbar/FeedCategoryTabsRow';
import { FeedModeOption } from '../toolbar/types';
import { UnifiedFeedTab } from '../../adapters/feeds/types';

describe('Feed Tabs Drag-and-Drop (DnD) in Edit Mode', () => {
  const mockSourceModes: FeedModeOption[] = [
    { id: 'all', label: 'Все ленты', emoji: '🌐' },
    { id: 'it_dev', label: 'IT & Dev', emoji: '💻' },
    { id: 'entertainment', label: 'Развлечения', emoji: '🍿' },
  ];

  const mockCategoryTabs: UnifiedFeedTab[] = [
    {
      id: 'tab-changelogs',
      slug: 'spark-changelogsfeed',
      title: 'Changelogs & Релизы',
      shortTitle: 'Changelogs',
      emoji: '🚀',
      category: 'IT & Dev',
      count: 12,
    },
    {
      id: 'tab-ai',
      slug: 'spark-ai',
      title: 'AI Новости',
      shortTitle: 'AI Новости',
      emoji: '🤖',
      category: 'IT & Dev',
      count: 24,
    },
    {
      id: 'tab-habr',
      slug: 'spark-habr',
      title: 'Хабр IT',
      shortTitle: 'Хабр',
      emoji: '📰',
      category: 'IT & Dev',
      count: 8,
    },
  ];

  describe('Stream Source Tabs (Upper Row)', () => {
    it('renders tabs with grab cursor when edit mode is active', () => {
      render(
        <FeedStreamSourceRow
          streamSource="all"
          onSetStreamSource={vi.fn()}
          sourceModes={mockSourceModes}
          isEditMode={true}
          onEditSourceTab={vi.fn()}
          onAddSourceTab={vi.fn()}
          onReorderSourceModes={vi.fn()}
        />
      );

      const streamButtons = screen.getAllByRole('button');
      // The stream buttons should have cursor-grab in edit mode
      const itDevBtn = streamButtons.find((b) => b.textContent?.includes('IT & Dev'));
      expect(itDevBtn).toBeDefined();
      expect(itDevBtn?.className).toContain('cursor-grab');
    });

    it('locks vertical overflow on the horizontal scroll container to prevent vertical clipping/scrolling during drag', () => {
      const { container } = render(
        <FeedStreamSourceRow
          streamSource="all"
          onSetStreamSource={vi.fn()}
          sourceModes={mockSourceModes}
          isEditMode={true}
        />
      );
      const scrollWrapper = container.firstElementChild;
      expect(scrollWrapper?.className).toContain('overflow-x-auto');
      expect(scrollWrapper?.className).toContain('overflow-y-hidden');
    });

    it('renders tabs with standard cursor when edit mode is inactive', () => {
      render(
        <FeedStreamSourceRow
          streamSource="all"
          onSetStreamSource={vi.fn()}
          sourceModes={mockSourceModes}
          isEditMode={false}
        />
      );

      const streamButtons = screen.getAllByRole('button');
      const itDevBtn = streamButtons.find((b) => b.textContent?.includes('IT & Dev'));
      expect(itDevBtn).toBeDefined();
      expect(itDevBtn?.className).toContain('cursor-pointer');
      expect(itDevBtn?.className).not.toContain('cursor-grab');
    });
  });

  describe('Thematic Category Tabs (Lower Row)', () => {
    it('renders category tabs with grab cursor and pencil badges in edit mode', () => {
      render(
        <FeedCategoryTabsRow
          streamSource="it_dev"
          tabs={mockCategoryTabs}
          isAllSelected={false}
          onSelectFeed={vi.fn()}
          totalCount={44}
          isEditMode={true}
          onEditFeed={vi.fn()}
          onAddFeed={vi.fn()}
          onReorderTabs={vi.fn()}
        />
      );

      const tabButtons = screen.getAllByRole('button');
      const aiTab = tabButtons.find((b) => b.textContent?.includes('AI Новости'));
      expect(aiTab).toBeDefined();
      expect(aiTab?.className).toContain('cursor-grab');
    });

    it('does not render grab cursor in normal viewing mode', () => {
      render(
        <FeedCategoryTabsRow
          streamSource="it_dev"
          tabs={mockCategoryTabs}
          isAllSelected={false}
          onSelectFeed={vi.fn()}
          totalCount={44}
          isEditMode={false}
        />
      );

      const tabButtons = screen.getAllByRole('button');
      const aiTab = tabButtons.find((b) => b.textContent?.includes('AI Новости'));
      expect(aiTab).toBeDefined();
      expect(aiTab?.className).toContain('cursor-pointer');
      expect(aiTab?.className).not.toContain('cursor-grab');
    });
  });
});
