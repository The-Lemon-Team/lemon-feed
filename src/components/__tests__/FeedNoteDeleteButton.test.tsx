import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedNoteDeleteButton } from '../FeedNoteDeleteButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import { feedApi } from '../../api/client';

vi.mock('../../api/client', () => ({
  feedApi: {
    deleteNote: vi.fn(),
  },
}));

describe('FeedNoteDeleteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in icon and button variants', () => {
    const { unmount } = renderWithProviders(
      <FeedNoteDeleteButton noteId="note-1" noteTitle="Test Note" variant="icon" />
    );
    expect(screen.getByRole('button', { name: 'Удалить запись' })).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <FeedNoteDeleteButton noteId="note-1" noteTitle="Test Note" variant="button" />
    );
    expect(screen.getByText('Удалить запись')).toBeInTheDocument();
  });

  it('opens confirmation popover on click and cancels cleanly', () => {
    renderWithProviders(
      <FeedNoteDeleteButton noteId="note-1" noteTitle="Test Note" />
    );

    // Confirmation is initially hidden
    expect(screen.queryByText('Удалить эту заметку?')).not.toBeInTheDocument();

    // Click trigger
    fireEvent.click(screen.getByText('Удалить запись'));
    expect(screen.getByText('Удалить эту заметку?')).toBeInTheDocument();
    expect(screen.getByText('«Test Note»')).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByText('Отмена'));
    expect(screen.queryByText('Удалить эту заметку?')).not.toBeInTheDocument();
  });

  it('closes confirmation on Escape and stops event propagation', () => {
    const parentEscapeHandler = vi.fn();
    window.addEventListener('keydown', parentEscapeHandler);

    renderWithProviders(
      <FeedNoteDeleteButton noteId="note-1" noteTitle="Test Note" />
    );

    fireEvent.click(screen.getByText('Удалить запись'));
    expect(screen.getByText('Удалить эту заметку?')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Удалить эту заметку?')).not.toBeInTheDocument();
    expect(parentEscapeHandler).not.toHaveBeenCalled();

    window.removeEventListener('keydown', parentEscapeHandler);
  });

  it('calls deleteNote and triggers onDeleted callback upon confirmation', async () => {
    vi.mocked(feedApi.deleteNote).mockResolvedValueOnce({ success: true });
    const onDeleted = vi.fn();

    renderWithProviders(
      <FeedNoteDeleteButton noteId="note-1" noteTitle="Test Note" onDeleted={onDeleted} />
    );

    fireEvent.click(screen.getByText('Удалить запись'));

    // Confirm button inside popover
    const confirmBtn = screen.getByRole('button', { name: 'Удалить' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(feedApi.deleteNote).toHaveBeenCalledWith('note-1');
      expect(onDeleted).toHaveBeenCalled();
    });
  });
});
