import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineActorSelector } from '../TimelineActorSelector';
import { TIMELINE_ACTORS } from '../../../utils/timelineFeeds';

describe('TimelineActorSelector', () => {
  it('renders select dropdown with all timeline actors and custom author option', () => {
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

    const select = screen.getByRole('combobox', { name: /Выбор персонажа TimeLine/i }) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('actor-alexey');

    const options = Array.from(select.options);
    for (const actor of TIMELINE_ACTORS) {
      expect(options.some((o) => o.value === actor.id)).toBe(true);
    }
    expect(options.some((o) => o.value === 'custom')).toBe(true);
  });

  it('calls onSelectActor when selecting a different actor from select dropdown', () => {
    const handleSelect = vi.fn();
    render(
      <TimelineActorSelector
        selectedActorId="actor-alexey"
        onSelectActor={handleSelect}
        boardSlug="the-lemon-team-bcd"
      />
    );

    const select = screen.getByRole('combobox', { name: /Выбор персонажа TimeLine/i });
    fireEvent.change(select, { target: { value: 'actor-antigravity-agent' } });

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'actor-antigravity-agent' })
    );
  });

  it('calls onSelectActor(null) and renders custom author input when "custom" is selected', () => {
    const handleSelect = vi.fn();
    const handleAuthorChange = vi.fn();

    const { rerender } = render(
      <TimelineActorSelector
        selectedActorId="actor-alexey"
        onSelectActor={handleSelect}
        customAuthor="MyCustomAuthor"
        onCustomAuthorChange={handleAuthorChange}
        boardSlug="the-lemon-team-bcd"
      />
    );

    const select = screen.getByRole('combobox', { name: /Выбор персонажа TimeLine/i });
    fireEvent.change(select, { target: { value: 'custom' } });

    expect(handleSelect).toHaveBeenCalledWith(null);

    // Re-render in custom mode
    rerender(
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
