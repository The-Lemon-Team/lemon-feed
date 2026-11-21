import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineActorSelector } from '../TimelineActorSelector';
import { TIMELINE_ACTORS } from '../../../utils/timelineFeeds';

describe('TimelineActorSelector', () => {
  it('renders all timeline actors and custom author option', () => {
    const handleSelect = vi.fn();
    render(
      <TimelineActorSelector
        selectedActorId="actor-alexey"
        onSelectActor={handleSelect}
        boardSlug="the-lemon-team-bcd"
      />
    );

    expect(screen.getByText('Персонаж TimeLine')).toBeInTheDocument();
    expect(screen.getByText(/В TimeLines/i)).toBeInTheDocument();

    for (const actor of TIMELINE_ACTORS) {
      expect(screen.getByText(actor.name)).toBeInTheDocument();
    }
    expect(screen.getByText('Свой автор / Admin')).toBeInTheDocument();
  });

  it('calls onSelectActor when an actor card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <TimelineActorSelector
        selectedActorId="actor-alexey"
        onSelectActor={handleSelect}
        boardSlug="the-lemon-team-bcd"
      />
    );

    const antigravityBtn = screen.getByText('Antigravity Agent').closest('button');
    expect(antigravityBtn).not.toBeNull();
    fireEvent.click(antigravityBtn!);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'actor-antigravity-agent' })
    );
  });

  it('renders custom author text input when custom mode is active', () => {
    const handleSelect = vi.fn();
    const handleAuthorChange = vi.fn();

    render(
      <TimelineActorSelector
        selectedActorId={null}
        onSelectActor={handleSelect}
        customAuthor="MyCustomAuthor"
        onCustomAuthorChange={handleAuthorChange}
        boardSlug="the-lemon-team-bcd"
      />
    );

    const input = screen.getByPlaceholderText('Введите имя автора...');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('MyCustomAuthor');

    fireEvent.change(input, { target: { value: 'NewAuthor' } });
    expect(handleAuthorChange).toHaveBeenCalledWith('NewAuthor');
  });
});
