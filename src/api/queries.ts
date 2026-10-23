import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  feedApi,
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
    placeholderData: (previousData) => previousData,
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
