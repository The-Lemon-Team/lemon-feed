import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceFloatingButton } from '../WorkspaceFloatingButton';

describe('WorkspaceFloatingButton', () => {
  it('renders with mobile clearance to prevent overlapping the bottom navigation menu', () => {
    const handleClick = vi.fn();
    render(
      <WorkspaceFloatingButton
        onClick={handleClick}
        workspaceTitle="Мой воркспейс"
        pinsCount={3}
        focusCount={1}
        attentionCount={2}
      />
    );

    const button = screen.getByRole('button', { name: /Мой воркспейс/i });
    expect(button).toBeInTheDocument();

    // Must have responsive bottom positioning above FeedBottomNav
    expect(button.className).toContain('bottom-[calc(4.25rem+max(0.5rem,var(--sab)))]');
    expect(button.className).toContain('sm:bottom-5');
    expect(button.className).toContain('z-40');

    // Shows counts
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();

    // Handles click
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders default title and empty state gracefully', () => {
    render(
      <WorkspaceFloatingButton
        onClick={vi.fn()}
        pinsCount={0}
        focusCount={0}
        attentionCount={0}
      />
    );

    expect(screen.getByText('Воркспейс')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
