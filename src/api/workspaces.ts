import { apiClient } from './client';
import {
  Workspace,
  WorkspaceTrack,
  WorkspacePin,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateTrackInput,
  UpdateTrackInput,
  CreatePinInput,
  UpdatePinInput,
  ReorderPinsInput,
  BatchLinkNotesInput,
} from '@lenta/shared';

export const workspacesApi = {
  getMemberships: async (): Promise<
    Array<{
      workspaceId: string;
      noteId: string;
      isPinned: boolean;
      status: string;
      trackId: string | null;
    }>
  > => {
    const res = await apiClient.get('/workspaces/memberships');
    return res.data;
  },

  getWorkspaces: async (includeDeleted = false): Promise<Workspace[]> => {
    const res = await apiClient.get<Workspace[]>('/workspaces', {
      params: includeDeleted ? { includeDeleted: true } : undefined,
    });
    return res.data;
  },

  getWorkspace: async (id: string): Promise<Workspace> => {
    const res = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return res.data;
  },

  createWorkspace: async (data: CreateWorkspaceInput): Promise<Workspace> => {
    const res = await apiClient.post<Workspace>('/workspaces', data);
    return res.data;
  },

  updateWorkspace: async (id: string, data: UpdateWorkspaceInput): Promise<Workspace> => {
    const res = await apiClient.patch<Workspace>(`/workspaces/${id}`, data);
    return res.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  createTrack: async (workspaceId: string, data: CreateTrackInput): Promise<WorkspaceTrack> => {
    const res = await apiClient.post<WorkspaceTrack>(`/workspaces/${workspaceId}/tracks`, data);
    return res.data;
  },

  updateTrack: async (
    workspaceId: string,
    trackId: string,
    data: UpdateTrackInput
  ): Promise<WorkspaceTrack> => {
    const res = await apiClient.patch<WorkspaceTrack>(
      `/workspaces/${workspaceId}/tracks/${trackId}`,
      data
    );
    return res.data;
  },

  deleteTrack: async (workspaceId: string, trackId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/tracks/${trackId}`);
  },

  getPins: async (
    workspaceId: string,
    params?: { trackId?: string; status?: string }
  ): Promise<WorkspacePin[]> => {
    const res = await apiClient.get<WorkspacePin[]>(`/workspaces/${workspaceId}/pins`, {
      params,
    });
    return res.data;
  },

  pinNote: async (workspaceId: string, data: CreatePinInput): Promise<WorkspacePin> => {
    const res = await apiClient.post<WorkspacePin>(`/workspaces/${workspaceId}/pins`, data);
    return res.data;
  },

  updatePin: async (
    workspaceId: string,
    pinId: string,
    data: UpdatePinInput
  ): Promise<WorkspacePin> => {
    const res = await apiClient.patch<WorkspacePin>(
      `/workspaces/${workspaceId}/pins/${pinId}`,
      data
    );
    return res.data;
  },

  reorderPins: async (
    workspaceId: string,
    data: ReorderPinsInput
  ): Promise<{ success: boolean; updatedCount: number }> => {
    if (!data.items.length) {
      return { success: true, updatedCount: 0 };
    }
    try {
      const res = await apiClient.patch<{ success: boolean; updatedCount: number }>(
        `/workspaces/${workspaceId}/pins/reorder`,
        data
      );
      return res.data;
    } catch (err: any) {
      // Graceful fallback if connected to an older backend instance before restart
      if (err?.response?.status === 404) {
        await Promise.all(
          data.items.map((item) =>
            apiClient.patch(`/workspaces/${workspaceId}/pins/${item.id}`, {
              ...(item.trackId !== undefined ? { trackId: item.trackId } : {}),
              order: item.order,
            })
          )
        );
        return { success: true, updatedCount: data.items.length };
      }
      throw err;
    }
  },

  unpinNote: async (workspaceId: string, pinIdOrNoteId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/pins/${pinIdOrNoteId}`);
  },

  batchLink: async (
    data: BatchLinkNotesInput
  ): Promise<{ success: boolean; parentNote: any; linkedCount: number }> => {
    const res = await apiClient.post('/workspaces/batch-link', data);
    return res.data;
  },
};
