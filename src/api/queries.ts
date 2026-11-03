import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  feedApi,
  CreateFeedPayload,
  UpdateFeedPayload,
  CreateNotePayload,
  UpdateNotePayload,
  GenerateAiCoverPayload,
  GenerateAiBatchPayload,
} from './client';
import { QueryNotesParams } from '@lenta/shared';

export const queryKeys = {
  allNotes: (params?: QueryNotesParams) => ['feed', 'notes', params] as const,
  feeds: ['feed', 'sources'] as const,
  noteDetail: (id: string) => ['feed', 'note', id] as const,
};

export function useFeedNotes(params?: QueryNotesParams) {
  return useQuery({
    queryKey: queryKeys.allNotes(params),
    staleTime: 1000 * 60 * 3, // 3 minutes cache keeps client navigation instant
    placeholderData: (previousData, previousQuery) => {
      const prevParams = previousQuery?.queryKey?.[2] as QueryNotesParams | undefined;
      if (prevParams?.appMode !== params?.appMode) {
        return undefined;
      }
      return previousData;
    },
    queryFn: async () => {
      const data = await feedApi.getNotes({
        limit: 500,
        ...params,
      });
      return data.items || [];
    },
  });
}

export function useFeedSources() {
  return useQuery({
    queryKey: queryKeys.feeds,
    queryFn: async () => {
      return await feedApi.getFeeds();
    },
  });
}

export function useCreateFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFeedPayload) => {
      return await feedApi.createFeed(data);
    },
    onSuccess: (newFeed) => {
      if (newFeed) {
        queryClient.setQueryData(queryKeys.feeds, (old: any) => {
          if (!old || !Array.isArray(old)) return [newFeed];
          return [...old.filter((f: any) => f.id !== newFeed.id && f.slug !== newFeed.slug), newFeed];
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds });
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
    },
  });
}

export function useUpdateFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFeedPayload }) => {
      return await feedApi.updateFeed(id, data);
    },
    onSuccess: (updatedFeed) => {
      if (updatedFeed) {
        queryClient.setQueryData(queryKeys.feeds, (old: any) => {
          if (!old || !Array.isArray(old)) return [updatedFeed];
          return old.map((f: any) => (f.id === updatedFeed.id || f.slug === updatedFeed.slug ? updatedFeed : f));
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds });
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
    },
  });
}

export function useDeleteFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await feedApi.deleteFeed(id);
    },
    onSuccess: (_data, deletedId) => {
      if (deletedId) {
        queryClient.setQueryData(queryKeys.feeds, (old: any) => {
          if (!old || !Array.isArray(old)) return [];
          return old.filter((f: any) => f.id !== deletedId && f.slug !== deletedId);
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds });
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateNotePayload) => {
      return await feedApi.createNote(data);
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNotePayload }) => {
      return await feedApi.updateNote(id, data);
    },
    onSuccess: (updatedNote) => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.noteDetail(updatedNote.id) });
    },
  });
}

export function useGenerateNoteCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      data,
    }: {
      noteId: string;
      data?: GenerateAiCoverPayload;
    }) => {
      return await feedApi.generateNoteCover(noteId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.noteDetail(variables.noteId) });
    },
  });
}

export function useGenerateAiBatch() {
  return useMutation({
    mutationFn: async (data: GenerateAiBatchPayload) => {
      return await feedApi.generateAiBatch(data);
    },
  });
}

export function useAttachCoverToNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      assetUrl,
      caption,
      setAsMain = true,
    }: {
      noteId: string;
      assetUrl: string;
      caption?: string;
      setAsMain?: boolean;
    }) => {
      return await feedApi.attachCoverToNote(noteId, { assetUrl, caption, setAsMain });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.noteDetail(variables.noteId) });
    },
  });
}
