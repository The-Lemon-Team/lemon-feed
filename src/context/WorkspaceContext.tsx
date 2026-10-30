import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Workspace,
  WorkspaceTrack,
  WorkspacePin,
  PinStatus,
  CreateWorkspaceInput,
  UpdatePinInput,
} from '@lenta/shared';
import { workspacesApi } from '../api/workspaces';

const ACTIVE_WORKSPACE_STORAGE_KEY = 'lemon_active_workspace_id';

export interface NoteMembership {
  workspaceId: string;
  noteId: string;
  isPinned: boolean;
  status: string;
  trackId: string | null;
}

export interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string) => void;
  pins: WorkspacePin[];
  pinsByNoteId: Map<string, WorkspacePin>;
  memberships: NoteMembership[];
  isLoading: boolean;
  isDockOpen: boolean;
  setIsDockOpen: (open: boolean) => void;
  isNoteInWorkspace: (workspaceId: string, noteId: string) => boolean;
  isNotePinnedInWorkspace: (workspaceId: string, noteId: string) => boolean;
  addToWorkspace: (
    workspaceId: string,
    noteId: string,
    options?: {
      isPinned?: boolean;
      trackId?: string | null;
      status?: PinStatus;
      comment?: string;
    }
  ) => Promise<WorkspacePin>;
  removeFromWorkspace: (workspaceId: string, noteId: string) => Promise<void>;
  togglePinFocus: (pinId: string, isPinned: boolean) => Promise<WorkspacePin>;
  pinNote: (
    noteId: string,
    trackId?: string | null,
    status?: PinStatus,
    comment?: string
  ) => Promise<WorkspacePin>;
  unpinNote: (pinIdOrNoteId: string) => Promise<void>;
  updatePin: (pinId: string, updates: UpdatePinInput) => Promise<WorkspacePin>;
  createTrack: (title: string, color?: string, icon?: string) => Promise<WorkspaceTrack>;
  createWorkspace: (data: CreateWorkspaceInput) => Promise<Workspace>;
  batchLinkNotes: (
    parentNoteId: string,
    childNoteIds: string[]
  ) => Promise<{ success: boolean; linkedCount: number }>;
  refreshWorkspaces: () => Promise<void>;
  refreshPins: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY) || null;
  });
  const [pins, setPins] = useState<WorkspacePin[]>([]);
  const [memberships, setMemberships] = useState<NoteMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await workspacesApi.getWorkspaces();
      setWorkspaces(data);

      if (data.length > 0) {
        const storedId = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
        const match = data.find((w) => w.id === storedId);
        if (match) {
          setActiveWorkspaceIdState(match.id);
        } else {
          const defaultWs = data.find((w) => w.isDefault) || data[0];
          setActiveWorkspaceIdState(defaultWs.id);
          localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, defaultWs.id);
        }
      }
    } catch (err) {
      console.warn('[WorkspaceContext] Failed to load workspaces:', err);
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    try {
      const data = await workspacesApi.getMemberships();
      setMemberships(data);
    } catch (err) {
      console.warn('[WorkspaceContext] Failed to load memberships:', err);
    }
  }, []);

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveWorkspaceIdState(id);
    localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, id);
  }, []);

  const fetchPins = useCallback(async () => {
    if (!activeWorkspaceId) {
      setPins([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await workspacesApi.getPins(activeWorkspaceId);
      setPins(data);
    } catch (err) {
      console.warn('[WorkspaceContext] Failed to load pins:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchWorkspaces();
    fetchMemberships();
  }, [fetchWorkspaces, fetchMemberships]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  const pinsByNoteId = useMemo(() => {
    const map = new Map<string, WorkspacePin>();
    for (const pin of pins) {
      map.set(pin.noteId, pin);
    }
    return map;
  }, [pins]);

  const isNoteInWorkspace = useCallback(
    (workspaceId: string, noteId: string): boolean => {
      return memberships.some(
        (m) => m.workspaceId === workspaceId && m.noteId === noteId
      );
    },
    [memberships]
  );

  const isNotePinnedInWorkspace = useCallback(
    (workspaceId: string, noteId: string): boolean => {
      return memberships.some(
        (m) => m.workspaceId === workspaceId && m.noteId === noteId && m.isPinned
      );
    },
    [memberships]
  );

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
      const res = await workspacesApi.pinNote(workspaceId, {
        noteId,
        isPinned: options?.isPinned ?? false,
        trackId: options?.trackId || undefined,
        status: options?.status || 'ACTIVE',
        comment: options?.comment,
      });

      // Update memberships state
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

      // If active workspace, update pins list
      if (workspaceId === activeWorkspaceId) {
        setPins((prev) => {
          const filtered = prev.filter((p) => p.noteId !== noteId);
          return [...filtered, res];
        });
      }

      // Update workspace pin count locally
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId
            ? { ...w, _count: { ...w._count!, pins: (w._count?.pins || 0) + 1 } }
            : w
        )
      );

      return res;
    },
    [activeWorkspaceId]
  );

  const removeFromWorkspace = useCallback(
    async (workspaceId: string, noteId: string) => {
      await workspacesApi.unpinNote(workspaceId, noteId);

      // Update memberships state
      setMemberships((prev) =>
        prev.filter((m) => !(m.workspaceId === workspaceId && m.noteId === noteId))
      );

      // If active workspace, update pins list
      if (workspaceId === activeWorkspaceId) {
        setPins((prev) => prev.filter((p) => p.noteId !== noteId));
      }

      // Update workspace pin count locally
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId
            ? { ...w, _count: { ...w._count!, pins: Math.max(0, (w._count?.pins || 1) - 1) } }
            : w
        )
      );
    },
    [activeWorkspaceId]
  );

  const togglePinFocus = useCallback(
    async (pinId: string, isPinned: boolean) => {
      if (!activeWorkspaceId) {
        throw new Error('No active workspace selected');
      }
      const updated = await workspacesApi.updatePin(activeWorkspaceId, pinId, { isPinned });
      setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));

      // Update memberships
      setMemberships((prev) =>
        prev.map((m) =>
          m.workspaceId === activeWorkspaceId && m.noteId === updated.noteId
            ? { ...m, isPinned }
            : m
        )
      );

      return updated;
    },
    [activeWorkspaceId]
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
      setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
      return updated;
    },
    [activeWorkspaceId]
  );

  const createTrack = useCallback(
    async (title: string, color?: string, icon?: string) => {
      if (!activeWorkspaceId) {
        throw new Error('No active workspace selected');
      }
      const track = await workspacesApi.createTrack(activeWorkspaceId, {
        title,
        color,
        icon,
      });
      await fetchWorkspaces();
      return track;
    },
    [activeWorkspaceId, fetchWorkspaces]
  );

  const createWorkspace = useCallback(
    async (data: CreateWorkspaceInput) => {
      const created = await workspacesApi.createWorkspace(data);
      await fetchWorkspaces();
      setActiveWorkspaceId(created.id);
      return created;
    },
    [fetchWorkspaces, setActiveWorkspaceId]
  );

  const batchLinkNotes = useCallback(
    async (parentNoteId: string, childNoteIds: string[]) => {
      const res = await workspacesApi.batchLink({
        parentNoteId,
        childNoteIds,
      });
      await fetchPins();
      return res;
    },
    [fetchPins]
  );

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      setActiveWorkspaceId,
      pins,
      pinsByNoteId,
      memberships,
      isLoading,
      isDockOpen,
      setIsDockOpen,
      isNoteInWorkspace,
      isNotePinnedInWorkspace,
      addToWorkspace,
      removeFromWorkspace,
      togglePinFocus,
      pinNote,
      unpinNote,
      updatePin,
      createTrack,
      createWorkspace,
      batchLinkNotes,
      refreshWorkspaces: fetchWorkspaces,
      refreshPins: fetchPins,
    }),
    [
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      setActiveWorkspaceId,
      pins,
      pinsByNoteId,
      memberships,
      isLoading,
      isDockOpen,
      isNoteInWorkspace,
      isNotePinnedInWorkspace,
      addToWorkspace,
      removeFromWorkspace,
      togglePinFocus,
      pinNote,
      unpinNote,
      updatePin,
      createTrack,
      createWorkspace,
      batchLinkNotes,
      fetchWorkspaces,
      fetchPins,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
