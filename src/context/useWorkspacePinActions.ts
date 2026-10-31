import React, { useCallback, useMemo } from 'react';
import {
  Workspace,
  WorkspacePin,
  PinStatus,
  UpdatePinInput,
  ReorderPinItemInput,
} from '@lenta/shared';
import { workspacesApi } from '../api/workspaces';
import {
  sortPinsDeterministically,
  diffPinLayoutUpdates,
  applyOptimisticLayoutUpdates,
  syncMembershipsWithLayoutUpdates,
} from './workspaceContext.utils';
import type { NoteMembership } from './WorkspaceContext';

export interface UseWorkspacePinActionsParams {
  activeWorkspaceId: string | null;
  pinsRef: React.MutableRefObject<WorkspacePin[]>;
  membershipByKey: Map<string, NoteMembership>;
  setPins: React.Dispatch<React.SetStateAction<WorkspacePin[]>>;
  setMemberships: React.Dispatch<React.SetStateAction<NoteMembership[]>>;
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  fetchPins: () => Promise<void>;
  fetchWorkspaces: () => Promise<void>;
}

export function useWorkspacePinActions({
  activeWorkspaceId,
  pinsRef,
  membershipByKey,
  setPins,
  setMemberships,
  setWorkspaces,
  fetchPins,
  fetchWorkspaces,
}: UseWorkspacePinActionsParams) {
  const addToWorkspace = useCallback(
    async (
      workspaceId: string,
      noteId: string,
      options?: {
        isPinned?: boolean;
        trackId?: string | null;
        status?: PinStatus;
        comment?: string;
      }
    ) => {
      const alreadyExists = membershipByKey.has(`${workspaceId}:${noteId}`);
      const isPinned = options?.isPinned ?? false;
      const status = options?.status || 'ACTIVE';
      const trackId = options?.trackId || null;

      // 1. Optimistic snapshot & immediate local state update (0ms UI response)
      setMemberships((prev) => {
        const filtered = prev.filter(
          (m) => !(m.workspaceId === workspaceId && m.noteId === noteId)
        );
        return [
          ...filtered,
          {
            workspaceId,
            noteId,
            isPinned,
            status,
            trackId,
          },
        ];
      });

      if (!alreadyExists) {
        setWorkspaces((prev) =>
          prev.map((w) => {
            if (w.id !== workspaceId) return w;
            const currentPins = w._count?.pins ?? 0;
            return {
              ...w,
              _count: { ...(w._count || { tracks: 0, pins: 0 }), pins: currentPins + 1 },
            };
          })
        );
      }

      try {
        const res = await workspacesApi.pinNote(workspaceId, {
          noteId,
          isPinned,
          trackId: trackId || undefined,
          status,
          comment: options?.comment,
        });

        // 2. Authoritative sync with backend response
        setMemberships((prev) => {
          const filtered = prev.filter(
            (m) => !(m.workspaceId === workspaceId && m.noteId === noteId)
          );
          return [
            ...filtered,
            {
              workspaceId,
              noteId,
              isPinned: res.isPinned,
              status: res.status,
              trackId: res.trackId || null,
            },
          ];
        });

        if (workspaceId === activeWorkspaceId) {
          setPins((prev) =>
            sortPinsDeterministically([...prev.filter((p) => p.noteId !== noteId), res])
          );
        }

        return res;
      } catch (err) {
        // Rollback optimistic changes on network/server error
        setMemberships((prev) =>
          prev.filter((m) => !(m.workspaceId === workspaceId && m.noteId === noteId))
        );
        if (!alreadyExists) {
          setWorkspaces((prev) =>
            prev.map((w) => {
              if (w.id !== workspaceId) return w;
              const currentPins = w._count?.pins ?? 1;
              return {
                ...w,
                _count: { ...(w._count || { tracks: 0, pins: 0 }), pins: Math.max(0, currentPins - 1) },
              };
            })
          );
        }
        throw err;
      }
    },
    [activeWorkspaceId, membershipByKey, setMemberships, setPins, setWorkspaces]
  );

  const removeFromWorkspace = useCallback(
    async (workspaceId: string, pinIdOrNoteId: string) => {
      const targetPin = pinsRef.current.find(
        (p) => p.id === pinIdOrNoteId || p.noteId === pinIdOrNoteId
      );
      const resolvedNoteId = targetPin?.noteId || pinIdOrNoteId;

      // 1. Optimistic removal from UI state
      setMemberships((prev) =>
        prev.filter((m) => !(m.workspaceId === workspaceId && m.noteId === resolvedNoteId))
      );

      if (workspaceId === activeWorkspaceId) {
        setPins((prev) =>
          prev.filter((p) => p.id !== pinIdOrNoteId && p.noteId !== resolvedNoteId)
        );
      }

      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id !== workspaceId) return w;
          const currentPins = w._count?.pins ?? 1;
          return {
            ...w,
            _count: { ...(w._count || { tracks: 0, pins: 0 }), pins: Math.max(0, currentPins - 1) },
          };
        })
      );

      try {
        await workspacesApi.unpinNote(workspaceId, pinIdOrNoteId);
      } catch (err: any) {
        // If 404, pin is already absent from database, so optimistic removal is successful
        if (err?.response?.status === 404) {
          return;
        }
        // For other server errors, re-sync authoritative state
        await fetchPins();
        await fetchWorkspaces();
        throw err;
      }
    },
    [activeWorkspaceId, pinsRef, setMemberships, setPins, setWorkspaces, fetchPins, fetchWorkspaces]
  );

  const togglePinFocus = useCallback(
    async (pinId: string, isPinned: boolean) => {
      if (!activeWorkspaceId) {
        throw new Error('No active workspace selected');
      }
      const existingPin = pinsRef.current.find((p) => p.id === pinId);

      setPins((prev) => prev.map((p) => (p.id === pinId ? { ...p, isPinned } : p)));
      if (existingPin) {
        setMemberships((prev) =>
          prev.map((m) =>
            m.workspaceId === activeWorkspaceId && m.noteId === existingPin.noteId
              ? { ...m, isPinned }
              : m
          )
        );
      }

      try {
        const updated = await workspacesApi.updatePin(activeWorkspaceId, pinId, { isPinned });
        setPins((prev) =>
          prev.map((p) =>
            p.id === pinId ? { ...p, ...updated, note: updated.note || p.note } : p
          )
        );
        return updated;
      } catch (err) {
        await fetchPins();
        throw err;
      }
    },
    [activeWorkspaceId, pinsRef, setPins, setMemberships, fetchPins]
  );

  const batchToggleFocus = useCallback(
    async (pinIds: string[], isPinned: boolean) => {
      if (!activeWorkspaceId || pinIds.length === 0) return;

      const idSet = new Set(pinIds);
      const affectedNoteIds = new Set(
        pinsRef.current.filter((p) => idSet.has(p.id)).map((p) => p.noteId)
      );

      setPins((prev) => prev.map((p) => (idSet.has(p.id) ? { ...p, isPinned } : p)));
      setMemberships((prev) =>
        prev.map((m) =>
          m.workspaceId === activeWorkspaceId && affectedNoteIds.has(m.noteId)
            ? { ...m, isPinned }
            : m
        )
      );

      try {
        await Promise.all(
          pinIds.map((id) => workspacesApi.updatePin(activeWorkspaceId, id, { isPinned }))
        );
      } catch (err) {
        console.error('Failed to batch toggle focus:', err);
        await fetchPins();
      }
    },
    [activeWorkspaceId, pinsRef, setPins, setMemberships, fetchPins]
  );

  const pinNote = useCallback(
    async (
      noteId: string,
      trackId?: string | null,
      status?: PinStatus,
      comment?: string
    ) => {
      if (!activeWorkspaceId) {
        throw new Error('No active workspace selected');
      }
      return addToWorkspace(activeWorkspaceId, noteId, {
        isPinned: true,
        trackId,
        status,
        comment,
      });
    },
    [activeWorkspaceId, addToWorkspace]
  );

  const unpinNote = useCallback(
    async (pinIdOrNoteId: string) => {
      if (!activeWorkspaceId) return;
      return removeFromWorkspace(activeWorkspaceId, pinIdOrNoteId);
    },
    [activeWorkspaceId, removeFromWorkspace]
  );

  const updatePin = useCallback(
    async (pinId: string, updates: UpdatePinInput) => {
      if (!activeWorkspaceId) {
        throw new Error('No active workspace selected');
      }
      const updated = await workspacesApi.updatePin(activeWorkspaceId, pinId, updates);
      setPins((prev) => {
        const mapped = prev.map((p) =>
          p.id === pinId ? { ...p, ...updated, note: updated.note || p.note } : p
        );
        return updates.order !== undefined ? sortPinsDeterministically(mapped) : mapped;
      });

      if (updates.isPinned !== undefined || updates.trackId !== undefined || updates.status) {
        setMemberships((prev) =>
          prev.map((m) =>
            m.workspaceId === activeWorkspaceId && m.noteId === updated.noteId
              ? {
                  ...m,
                  isPinned: updated.isPinned ?? m.isPinned,
                  trackId: updated.trackId !== undefined ? updated.trackId : m.trackId,
                  status: updated.status ?? m.status,
                }
              : m
          )
        );
      }
      return updated;
    },
    [activeWorkspaceId, setPins, setMemberships]
  );

  /**
   * Unified atomic layout commit for Drag-and-Drop:
   * 1. Diffs updates so unchanged pins are skipped.
   * 2. Applies optimistic trackId + order updates & deterministic sorting in ONE render.
   * 3. Sends ONE transactional batch PATCH request to `/workspaces/:id/pins/reorder`.
   */
  const commitPinsLayout = useCallback(
    async (updates: ReorderPinItemInput[]) => {
      if (!activeWorkspaceId || updates.length === 0) return;

      const currentSnapshot = pinsRef.current;
      const changedUpdates = diffPinLayoutUpdates(currentSnapshot, updates);
      if (changedUpdates.length === 0) return;

      setPins((prev) => applyOptimisticLayoutUpdates(prev, changedUpdates));
      React.startTransition(() => {
        setMemberships((prev) =>
          syncMembershipsWithLayoutUpdates(prev, activeWorkspaceId, currentSnapshot, changedUpdates)
        );
      });

      try {
        await workspacesApi.reorderPins(activeWorkspaceId, { items: changedUpdates });
      } catch (err) {
        console.error('[WorkspaceContext] Failed to commit pin layout, rolling back:', err);
        await fetchPins();
      }
    },
    [activeWorkspaceId, pinsRef, setPins, setMemberships, fetchPins]
  );

  const movePinToTrack = useCallback(
    async (pinId: string, targetTrackId: string | null, targetOrder?: number) => {
      const existing = pinsRef.current.find((p) => p.id === pinId);
      if (!existing) return;
      await commitPinsLayout([
        {
          id: pinId,
          trackId: targetTrackId,
          order: targetOrder !== undefined ? targetOrder : existing.order,
        },
      ]);
    },
    [pinsRef, commitPinsLayout]
  );

  const movePinsToTrack = useCallback(
    async (pinIds: string[], targetTrackId: string | null, baseOrder = 0) => {
      if (pinIds.length === 0) return;
      await commitPinsLayout(
        pinIds.map((id, idx) => ({
          id,
          trackId: targetTrackId,
          order: baseOrder + idx * 10,
        }))
      );
    },
    [commitPinsLayout]
  );

  const reorderPinsInTrack = useCallback(
    async (trackId: string | null, orderedPinIds: string[]) => {
      if (orderedPinIds.length === 0) return;
      await commitPinsLayout(
        orderedPinIds.map((id, idx) => ({
          id,
          trackId,
          order: idx * 10,
        }))
      );
    },
    [commitPinsLayout]
  );

  const createTrack = useCallback(
    async (title: string, color?: string, icon?: string, targetWorkspaceId?: string) => {
      const wsId = targetWorkspaceId || activeWorkspaceId;
      if (!wsId) {
        throw new Error('No active workspace selected');
      }
      const track = await workspacesApi.createTrack(wsId, { title, color, icon });
      await fetchWorkspaces();
      return track;
    },
    [activeWorkspaceId, fetchWorkspaces]
  );

  const deleteTrack = useCallback(
    async (trackId: string, targetWorkspaceId?: string) => {
      const wsId = targetWorkspaceId || activeWorkspaceId;
      if (!wsId) {
        throw new Error('No active workspace selected');
      }
      await workspacesApi.deleteTrack(wsId, trackId);
      await fetchWorkspaces();
      if (wsId === activeWorkspaceId) {
        await fetchPins();
      }
    },
    [activeWorkspaceId, fetchWorkspaces, fetchPins]
  );

  const batchLinkNotes = useCallback(
    async (parentNoteId: string, childNoteIds: string[]) => {
      const res = await workspacesApi.batchLink({ parentNoteId, childNoteIds });
      await fetchPins();
      return res;
    },
    [fetchPins]
  );

  return useMemo(
    () => ({
      addToWorkspace,
      removeFromWorkspace,
      togglePinFocus,
      batchToggleFocus,
      pinNote,
      unpinNote,
      updatePin,
      commitPinsLayout,
      movePinToTrack,
      movePinsToTrack,
      reorderPinsInTrack,
      createTrack,
      deleteTrack,
      batchLinkNotes,
    }),
    [
      addToWorkspace,
      removeFromWorkspace,
      togglePinFocus,
      batchToggleFocus,
      pinNote,
      unpinNote,
      updatePin,
      commitPinsLayout,
      movePinToTrack,
      movePinsToTrack,
      reorderPinsInTrack,
      createTrack,
      deleteTrack,
      batchLinkNotes,
    ]
  );
}
