import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Workspace,
  WorkspaceTrack,
  WorkspacePin,
  PinStatus,
  CreateWorkspaceInput,
  UpdatePinInput,
  ReorderPinItemInput,
} from '@lenta/shared';
import { workspacesApi } from '../api/workspaces';
import { sortPinsDeterministically } from './workspaceContext.utils';
import { useWorkspacePinActions } from './useWorkspacePinActions';

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
  batchToggleFocus: (pinIds: string[], isPinned: boolean) => Promise<void>;
  pinNote: (
    noteId: string,
    trackId?: string | null,
    status?: PinStatus,
    comment?: string
  ) => Promise<WorkspacePin>;
  unpinNote: (pinIdOrNoteId: string) => Promise<void>;
  updatePin: (pinId: string, updates: UpdatePinInput) => Promise<WorkspacePin>;
  commitPinsLayout: (updates: ReorderPinItemInput[]) => Promise<void>;
  movePinToTrack: (
    pinId: string,
    targetTrackId: string | null,
    targetOrder?: number
  ) => Promise<void>;
  movePinsToTrack: (
    pinIds: string[],
    targetTrackId: string | null,
    baseOrder?: number
  ) => Promise<void>;
  reorderPinsInTrack: (
    trackId: string | null,
    orderedPinIds: string[]
  ) => Promise<void>;
  createTrack: (
    title: string,
    color?: string,
    icon?: string,
    targetWorkspaceId?: string
  ) => Promise<WorkspaceTrack>;
  deleteTrack: (trackId: string, targetWorkspaceId?: string) => Promise<void>;
  createWorkspace: (data: CreateWorkspaceInput) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  batchLinkNotes: (
    parentNoteId: string,
    childNoteIds: string[]
  ) => Promise<{ success: boolean; linkedCount: number }>;
  refreshWorkspaces: () => Promise<void>;
  refreshPins: () => Promise<void>;
}

export interface WorkspaceMembershipContextType {
  workspaces: Workspace[];
  memberships: NoteMembership[];
  membershipsByNoteId: Map<string, NoteMembership[]>;
  isNoteInWorkspace: (workspaceId: string, noteId: string) => boolean;
  isNotePinnedInWorkspace: (workspaceId: string, noteId: string) => boolean;
  addToWorkspace: WorkspaceContextType['addToWorkspace'];
  removeFromWorkspace: WorkspaceContextType['removeFromWorkspace'];
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);
const WorkspaceMembershipContext = createContext<WorkspaceMembershipContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY) || null;
  });
  const [pins, setPins] = useState<WorkspacePin[]>([]);
  const [memberships, setMemberships] = useState<NoteMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);

  // Ref for reading latest pins inside stable action callbacks without triggering dependency churn
  const pinsRef = useRef<WorkspacePin[]>(pins);
  pinsRef.current = pins;

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
      setPins(sortPinsDeterministically(data));
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

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );

  const pinsByNoteId = useMemo(() => {
    const map = new Map<string, WorkspacePin>();
    for (const pin of pins) {
      map.set(pin.noteId, pin);
    }
    return map;
  }, [pins]);

  // O(1) membership indexes for fast NotePinButton rendering across large feeds
  const { membershipByKey, membershipsByNoteId } = useMemo(() => {
    const byKey = new Map<string, NoteMembership>();
    const byNote = new Map<string, NoteMembership[]>();
    for (const m of memberships) {
      byKey.set(`${m.workspaceId}:${m.noteId}`, m);
      const list = byNote.get(m.noteId);
      if (list) list.push(m);
      else byNote.set(m.noteId, [m]);
    }
    return { membershipByKey: byKey, membershipsByNoteId: byNote };
  }, [memberships]);

  const isNoteInWorkspace = useCallback(
    (workspaceId: string, noteId: string): boolean => {
      return membershipByKey.has(`${workspaceId}:${noteId}`);
    },
    [membershipByKey]
  );

  const isNotePinnedInWorkspace = useCallback(
    (workspaceId: string, noteId: string): boolean => {
      return Boolean(membershipByKey.get(`${workspaceId}:${noteId}`)?.isPinned);
    },
    [membershipByKey]
  );

  const pinActions = useWorkspacePinActions({
    activeWorkspaceId,
    pinsRef,
    membershipByKey,
    setPins,
    setMemberships,
    setWorkspaces,
    fetchPins,
    fetchWorkspaces,
  });

  const createWorkspace = useCallback(
    async (data: CreateWorkspaceInput) => {
      const created = await workspacesApi.createWorkspace(data);
      await fetchWorkspaces();
      setActiveWorkspaceId(created.id);
      return created;
    },
    [fetchWorkspaces, setActiveWorkspaceId]
  );

  const deleteWorkspace = useCallback(
    async (id: string) => {
      await workspacesApi.deleteWorkspace(id);
      const remaining = workspaces.filter((w) => w.id !== id);
      if (activeWorkspaceId === id) {
        const nextWs = remaining.find((w) => w.isDefault) || remaining[0] || null;
        if (nextWs) {
          setActiveWorkspaceId(nextWs.id);
        } else {
          setActiveWorkspaceIdState(null);
          localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
        }
      }
      await fetchWorkspaces();
      await fetchMemberships();
    },
    [workspaces, activeWorkspaceId, setActiveWorkspaceId, fetchWorkspaces, fetchMemberships]
  );

  // Isolated membership slice so reordering `pins` or toggling `isDockOpen`
  // causes zero re-renders across NotePinButton instances on the main feed page.
  const membershipValue = useMemo<WorkspaceMembershipContextType>(
    () => ({
      workspaces,
      memberships,
      membershipsByNoteId,
      isNoteInWorkspace,
      isNotePinnedInWorkspace,
      addToWorkspace: pinActions.addToWorkspace,
      removeFromWorkspace: pinActions.removeFromWorkspace,
    }),
    [
      workspaces,
      memberships,
      membershipsByNoteId,
      isNoteInWorkspace,
      isNotePinnedInWorkspace,
      pinActions.addToWorkspace,
      pinActions.removeFromWorkspace,
    ]
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
      ...pinActions,
      createWorkspace,
      deleteWorkspace,
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
      pinActions,
      createWorkspace,
      deleteWorkspace,
      fetchWorkspaces,
      fetchPins,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      <WorkspaceMembershipContext.Provider value={membershipValue}>
        {children}
      </WorkspaceMembershipContext.Provider>
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const useWorkspaceMembership = (): WorkspaceMembershipContextType => {
  const context = useContext(WorkspaceMembershipContext);
  if (!context) {
    throw new Error('useWorkspaceMembership must be used within a WorkspaceProvider');
  }
  return context;
};
