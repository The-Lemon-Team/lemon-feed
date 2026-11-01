import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteTrackModal } from '../DeleteTrackModal';
import { DeleteWorkspaceModal } from '../DeleteWorkspaceModal';

const track = { id: 't1', title: 'Roadmap' } as any;
const workspace = { id: 'w1', title: '  My Space ' } as any;

describe('DeleteTrackModal', () => {
  it('shows the track title', () => {
    render(<DeleteTrackModal isOpen track={track} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('«Roadmap»')).toBeInTheDocument();
  });

  it('renders nothing without a track', () => {
    render(<DeleteTrackModal isOpen track={null} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('confirms and then closes', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<DeleteTrackModal isOpen track={track} onClose={onClose} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: /Удалить/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the API error and stays open when deletion fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue({ response: { data: { message: 'Track is locked' } } });
    const onClose = vi.fn();
    render(<DeleteTrackModal isOpen track={track} onClose={onClose} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: /Удалить/ }));
    expect(await screen.findByText('Track is locked')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('falls back to a default message for errors without details', async () => {
    const onConfirm = vi.fn().mockRejectedValue({});
    render(<DeleteTrackModal isOpen track={track} onClose={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: /Удалить/ }));
    expect(await screen.findByText('Не удалось удалить трек')).toBeInTheDocument();
  });

  it('disables both actions and ignores double clicks while deleting', async () => {
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<DeleteTrackModal isOpen track={track} onClose={vi.fn()} onConfirm={onConfirm} />);
    const del = screen.getByRole('button', { name: /Удалить/ });
    await userEvent.click(del);
    expect(screen.getByRole('button', { name: /Удаление/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Удаление/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    resolve();
  });

  it('Cancel button closes without confirming', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<DeleteTrackModal isOpen track={track} onClose={onClose} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('DeleteWorkspaceModal', () => {
  const submitName = /Удалить воркспейс/;

  it('keeps delete disabled until the exact (trimmed) title is typed', async () => {
    render(<DeleteWorkspaceModal isOpen workspace={workspace} onClose={vi.fn()} onConfirm={vi.fn()} />);
    const input = screen.getByPlaceholderText('Введите название воркспейса');
    const submit = screen.getByRole('button', { name: submitName });
    expect(submit).toBeDisabled();

    await userEvent.type(input, 'My Spac');
    expect(submit).toBeDisabled();

    await userEvent.type(input, 'e');
    expect(submit).toBeEnabled();
  });

  it('is case-sensitive', async () => {
    render(<DeleteWorkspaceModal isOpen workspace={workspace} onClose={vi.fn()} onConfirm={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Введите название воркспейса'), 'my space');
    expect(screen.getByRole('button', { name: submitName })).toBeDisabled();
  });

  it('confirms with Enter once the title matches, then closes', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<DeleteWorkspaceModal isOpen workspace={workspace} onClose={onClose} onConfirm={onConfirm} />);
    await userEvent.type(screen.getByPlaceholderText('Введите название воркспейса'), 'My Space{Enter}');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not confirm on Enter when the title does not match', async () => {
    const onConfirm = vi.fn();
    render(<DeleteWorkspaceModal isOpen workspace={workspace} onClose={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.type(screen.getByPlaceholderText('Введите название воркспейса'), 'nope{Enter}');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows an error and stays open on failure', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    render(<DeleteWorkspaceModal isOpen workspace={workspace} onClose={onClose} onConfirm={onConfirm} />);
    await userEvent.type(screen.getByPlaceholderText('Введите название воркспейса'), 'My Space{Enter}');
    expect(await screen.findByText('boom')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('resets the typed text when reopened', async () => {
    const { rerender } = render(
      <DeleteWorkspaceModal isOpen workspace={workspace} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    await userEvent.type(screen.getByPlaceholderText('Введите название воркспейса'), 'My Space');
    rerender(<DeleteWorkspaceModal isOpen={false} workspace={workspace} onClose={vi.fn()} onConfirm={vi.fn()} />);
    rerender(<DeleteWorkspaceModal isOpen workspace={workspace} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByPlaceholderText('Введите название воркспейса')).toHaveValue('');
  });
});
