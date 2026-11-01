import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedModalsState } from '../useFeedModalsState';
import { feedApi } from '../../api/client';

vi.mock('../../api/queries', () => ({
  useUpdateNote: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../../api/client', () => ({
  feedApi: {
    getNoteById: vi.fn().mockResolvedValue(null as any),
  },
}));

vi.mock('../useLiveNoteSubscription', () => ({
  useLiveNoteSubscription: vi.fn(),
}));

describe('useFeedModalsState - Open Note by ID and Workspace integration', () => {
  const openNoteMock = vi.fn();
  const closeNoteMock = vi.fn();
  const refetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedApi.getNoteById).mockResolvedValue(null as any);
  });

  it('opens note detail modal immediately when handleOpenNoteById is called with an in-memory note', async () => {
    const dummyNote = {
      id: 'note-123',
      title: 'Крупнейший взлом в истории',
      type: 'EVENT',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: '2026-10-31T12:00:00Z',
      feed: { id: 'feed-1', slug: 'spark-habr', title: 'Хабр & IT' },
    } as any;

    // Simulate an adapter that would filter out spark-habr notes (e.g. IT Daily adapter)
    const restrictiveAdapter = {
      adaptNotes: vi.fn(() => []), // rejects note
      getTabs: vi.fn(() => []),
    } as any;

    const { result } = renderHook(() =>
      useFeedModalsState({
        noteId: undefined,
        openNote: openNoteMock,
        closeNote: closeNoteMock,
        allMappedNotes: [dummyNote],
        activeAdapter: restrictiveAdapter,
        isPublicMode: false,
        appMode: 'dev',
        refetch: refetchMock,
      })
    );

    expect(result.current.selectedDetailItem).toBeNull();

    await act(async () => {
      await result.current.handleOpenNoteById('note-123');
    });

    expect(openNoteMock).toHaveBeenCalledWith('note-123');
    expect(result.current.selectedDetailItem).not.toBeNull();
    expect(result.current.selectedDetailItem?.id).toBe('note-123');
    expect(result.current.selectedDetailItem?.title).toBe('Крупнейший взлом в истории');
  });

  it('opens note detail modal immediately when initialNote is passed from workspace pin', async () => {
    const pinnedNote = {
      id: 'note-pinned-1',
      title: 'Pinned Workspace Note',
      type: 'EVENT',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: '2026-10-31T12:00:00Z',
      feed: { id: 'feed-2', slug: 'spark-tech', title: 'Tech' },
    } as any;

    const restrictiveAdapter = {
      adaptNotes: vi.fn(() => []),
      getTabs: vi.fn(() => []),
    } as any;

    const { result } = renderHook(() =>
      useFeedModalsState({
        noteId: undefined,
        openNote: openNoteMock,
        closeNote: closeNoteMock,
        allMappedNotes: [], // not in stream
        activeAdapter: restrictiveAdapter,
        isPublicMode: false,
        appMode: 'dev',
        refetch: refetchMock,
      })
    );

    await act(async () => {
      await result.current.handleOpenNoteById('note-pinned-1', pinnedNote);
    });

    expect(openNoteMock).toHaveBeenCalledWith('note-pinned-1');
    expect(result.current.selectedDetailItem?.id).toBe('note-pinned-1');
    expect(result.current.selectedDetailItem?.title).toBe('Pinned Workspace Note');
  });

  it('fetches full note from API by ID when not found in memory', async () => {
    const fetchedNote = {
      id: 'note-remote-99',
      title: 'Remote Loaded Note',
      type: 'EVENT',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: '2026-10-31T12:00:00Z',
      feed: { id: 'feed-9', slug: 'spark-ai', title: 'AI' },
    } as any;

    vi.mocked(feedApi.getNoteById).mockResolvedValueOnce(fetchedNote);

    const restrictiveAdapter = {
      adaptNotes: vi.fn(() => []),
      getTabs: vi.fn(() => []),
    } as any;

    const { result } = renderHook(() =>
      useFeedModalsState({
        noteId: undefined,
        openNote: openNoteMock,
        closeNote: closeNoteMock,
        allMappedNotes: [],
        activeAdapter: restrictiveAdapter,
        isPublicMode: false,
        appMode: 'dev',
        refetch: refetchMock,
      })
    );

    await act(async () => {
      await result.current.handleOpenNoteById('note-remote-99');
    });

    expect(feedApi.getNoteById).toHaveBeenCalledWith('note-remote-99');
    expect(result.current.selectedDetailItem?.id).toBe('note-remote-99');
    expect(result.current.selectedDetailItem?.title).toBe('Remote Loaded Note');
  });

  describe('Keyboard shortcuts for Create Note', () => {
    it('opens create note modal when "c" is pressed without modifiers', () => {
      const { result } = renderHook(() =>
        useFeedModalsState({
          noteId: undefined,
          openNote: openNoteMock,
          closeNote: closeNoteMock,
          allMappedNotes: [],
          activeAdapter: { adaptNotes: vi.fn(() => []), getTabs: vi.fn(() => []) } as any,
          isPublicMode: false,
          appMode: 'dev',
          refetch: refetchMock,
        })
      );

      expect(result.current.isCreateNoteOpen).toBe(false);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true });
        window.dispatchEvent(event);
      });

      expect(result.current.isCreateNoteOpen).toBe(true);
    });

    it('does not open create note modal when Ctrl+C or Cmd+C is pressed', () => {
      const { result } = renderHook(() =>
        useFeedModalsState({
          noteId: undefined,
          openNote: openNoteMock,
          closeNote: closeNoteMock,
          allMappedNotes: [],
          activeAdapter: { adaptNotes: vi.fn(() => []), getTabs: vi.fn(() => []) } as any,
          isPublicMode: false,
          appMode: 'dev',
          refetch: refetchMock,
        })
      );

      expect(result.current.isCreateNoteOpen).toBe(false);

      let ctrlEventPrevented = false;
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'c',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(event);
        ctrlEventPrevented = event.defaultPrevented;
      });

      expect(result.current.isCreateNoteOpen).toBe(false);
      expect(ctrlEventPrevented).toBe(false);

      let metaEventPrevented = false;
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'c',
          metaKey: true,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(event);
        metaEventPrevented = event.defaultPrevented;
      });

      expect(result.current.isCreateNoteOpen).toBe(false);
      expect(metaEventPrevented).toBe(false);
    });

    it('does not open create note modal when a modal dialog is present in DOM', () => {
      // Simulate an external modal dialog (e.g. DeleteWorkspaceModal)
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      document.body.appendChild(dialog);

      const { result } = renderHook(() =>
        useFeedModalsState({
          noteId: undefined,
          openNote: openNoteMock,
          closeNote: closeNoteMock,
          allMappedNotes: [],
          activeAdapter: { adaptNotes: vi.fn(() => []), getTabs: vi.fn(() => []) } as any,
          isPublicMode: false,
          appMode: 'dev',
          refetch: refetchMock,
        })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true });
        window.dispatchEvent(event);
      });

      expect(result.current.isCreateNoteOpen).toBe(false);

      document.body.removeChild(dialog);
    });
  });
});
