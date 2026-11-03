import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FeedLiveUpdatesBanner } from '../FeedLiveUpdatesBanner';
import { ChannelUpdateGroup } from '../../../hooks/useFeedLiveEvents';

describe('FeedLiveUpdatesBanner', () => {
  const sampleGroups: ChannelUpdateGroup[] = [
    {
      feedSlug: 'marvel',
      feedTitle: 'Marvel Universe',
      feedIcon: '🛡️',
      feedColor: '#ef4444',
      count: 3,
      notes: [
        { noteId: '1', title: 'Avengers 5' },
        { noteId: '2', title: 'Spider-Man 4' },
        { noteId: '3', title: 'Doomsday' },
      ],
    },
    {
      feedSlug: 'cinema',
      feedTitle: 'Кино',
      feedIcon: '🎬',
      feedColor: '#8b5cf6',
      count: 2,
      notes: [
        { noteId: '4', title: 'Movie 1' },
        { noteId: '5', title: 'Movie 2' },
      ],
    },
  ];

  it('renders nothing when newEventsCount is 0', () => {
    const { container } = render(
      <FeedLiveUpdatesBanner
        newEventsCount={0}
        groupedChannels={[]}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders total count and grouped channel chips', () => {
    render(
      <FeedLiveUpdatesBanner
        newEventsCount={5}
        groupedChannels={sampleGroups}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/Новые публикации \(\+5\):/i)).toBeInTheDocument();
    expect(screen.getByText('Marvel Universe')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.getByText('Кино')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('calls onApply when clicking "Показать"', async () => {
    const onApply = vi.fn();
    render(
      <FeedLiveUpdatesBanner
        newEventsCount={5}
        groupedChannels={sampleGroups}
        onApply={onApply}
        onDismiss={vi.fn()}
      />
    );

    const showButton = screen.getByRole('button', { name: /Показать/i });
    await userEvent.click(showButton);
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectChannel with feedSlug when clicking a channel badge', async () => {
    const onSelectChannel = vi.fn();
    render(
      <FeedLiveUpdatesBanner
        newEventsCount={5}
        groupedChannels={sampleGroups}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        onSelectChannel={onSelectChannel}
      />
    );

    const marvelChip = screen.getByTitle('Открыть ленту Marvel Universe');
    await userEvent.click(marvelChip);
    expect(onSelectChannel).toHaveBeenCalledWith('marvel');
  });

  it('calls onDismiss when clicking close button', async () => {
    const onDismiss = vi.fn();
    render(
      <FeedLiveUpdatesBanner
        newEventsCount={5}
        groupedChannels={sampleGroups}
        onApply={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    const closeBtn = screen.getByTitle('Скрыть оповещение');
    await userEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
