import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedDesktopRail } from '../FeedDesktopRail';
import { UnifiedFeedTab } from '../../adapters/feeds/types';

describe('FeedDesktopRail', () => {
  const mockTabs: UnifiedFeedTab[] = [
    {
      id: 'tab-1',
      slug: 'tech',
      title: 'Технологии',
      shortTitle: 'Тех',
      emoji: '💻',
      category: 'work',
      count: 10,
    },
  ];

  it('renders permanent onAddFeed buttons when provided and not in public mode', () => {
    const onAddFeed = vi.fn();
    render(
      <FeedDesktopRail
        sourceType="all"
        activeFeed={null}
        tabs={mockTabs}
        onSelectFeed={vi.fn()}
        totalCount={10}
        onAddFeed={onAddFeed}
        isPublicMode={false}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /создать новый рабочий фид/i });
    expect(addButtons.length).toBeGreaterThan(0);

    fireEvent.click(addButtons[0]);
    expect(onAddFeed).toHaveBeenCalledTimes(1);
  });

  it('does not render onAddFeed button in public mode', () => {
    const onAddFeed = vi.fn();
    render(
      <FeedDesktopRail
        sourceType="all"
        activeFeed={null}
        tabs={mockTabs}
        onSelectFeed={vi.fn()}
        totalCount={10}
        onAddFeed={onAddFeed}
        isPublicMode={true}
      />
    );

    expect(screen.queryByRole('button', { name: /создать новый рабочий фид/i })).not.toBeInTheDocument();
  });
});
