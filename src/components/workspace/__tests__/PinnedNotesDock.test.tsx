import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PinnedNotesDock } from '../PinnedNotesDock';
import * as WorkspaceContextModule from '../../../context/WorkspaceContext';

vi.mock('../../../context/WorkspaceContext', () => ({
  useWorkspace: vi.fn(),
}));

vi.mock('../useWorkspaceDnd', () => ({
  useWorkspaceDnd: vi.fn(() => ({
    sensors: [],
    collisionDetection: vi.fn(),
    activePin: null,
    settlingPinId: null,
    activeCardHeight: 0,
    movingPinIds: [],
    companionPinIds: [],
    isDragging: false,
    overContainerId: null,
    crossInsertTarget: null,
    renderedGeneralPins: [],
    renderedPinsByTrack: {},
    handleDragStart: vi.fn(),
    handleDragMove: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragCancel: vi.fn(),
  })),
  WORKSPACE_DROP_ANIMATION: null,
}));

describe('PinnedNotesDock - Nested Modal Escape UX', () => {
  const setIsDockOpenMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(WorkspaceContextModule.useWorkspace).mockReturnValue({
      workspaces: [],
      activeWorkspaceId: 'ws-1',
      activeWorkspace: {
        id: 'ws-1',
        title: 'Main Workspace',
        color: '#3b82f6',
        tracks: [],
        createdAt: '2026-10-31',
        updatedAt: '2026-10-31',
      } as any,
      setActiveWorkspaceId: vi.fn(),
      pins: [],
      isDockOpen: true,
      setIsDockOpen: setIsDockOpenMock,
      unpinNote: vi.fn(),
      updatePin: vi.fn(),
      commitPinsLayout: vi.fn(),
      togglePinFocus: vi.fn(),
      batchToggleFocus: vi.fn(),
      createTrack: vi.fn(),
      deleteTrack: vi.fn(),
      deleteWorkspace: vi.fn(),
    } as any);
  });

  it('closes the workspace drawer on Escape when no nested modal is open (disableEscClose=false)', () => {
    render(<PinnedNotesDock disableEscClose={false} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(setIsDockOpenMock).toHaveBeenCalledTimes(1);
    expect(setIsDockOpenMock).toHaveBeenCalledWith(false);
  });

  it('does NOT close the workspace drawer on Escape when a nested modal (e.g. Note Detail) is open (disableEscClose=true)', () => {
    render(<PinnedNotesDock disableEscClose={true} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(setIsDockOpenMock).not.toHaveBeenCalled();
  });

  it('resumes Escape handling to close the drawer after child modal closes (disableEscClose toggles from true to false)', () => {
    const { rerender } = render(<PinnedNotesDock disableEscClose={true} />);

    // Step 1: User hits Escape while modal is open -> Drawer must stay open
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(setIsDockOpenMock).not.toHaveBeenCalled();

    // Step 2: Note detail modal closes in parent -> disableEscClose becomes false
    rerender(<PinnedNotesDock disableEscClose={false} />);

    // Step 3: Second Escape keypress now closes the drawer
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(setIsDockOpenMock).toHaveBeenCalledTimes(1);
    expect(setIsDockOpenMock).toHaveBeenCalledWith(false);
  });
});
