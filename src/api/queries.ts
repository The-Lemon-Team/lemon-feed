import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  feedApi,
  CreateFeedPayload,
  UpdateFeedPayload,
  CreateNotePayload,
  UpdateNotePayload,
  GenerateAiCoverPayload,
  GenerateAiBatchPayload,
} from './client';
import { QueryNotesParams, NotesResponse, ExternalImageItem, Stream, CreateStreamPayload, UpdateStreamPayload } from '@lenta/shared';
import { extractPeriodItems, PeriodItem } from '../utils/periods';
import { FeedAppRuntimeMode } from '../utils/appMode';

export const queryKeys = {
  allNotes: (params?: QueryNotesParams) => ['feed', 'notes', params] as const,
  feedStream: (params?: QueryNotesParams & { streamSource?: string; selectedFeedSlug?: string }) =>
    ['feed', 'stream', params] as const,
  periods: (appMode?: string) => ['feed', 'periods', appMode] as const,
  feeds: ['feed', 'sources'] as const,
  streams: (includePrivate?: boolean) => ['streams', { includePrivate }] as const,
  streamDetail: (slug: string) => ['streams', slug] as const,
  noteDetail: (id: string) => ['feed', 'note', id] as const,
};

export function useFeedPeriods(appMode: FeedAppRuntimeMode = 'dev') {
  return useQuery<PeriodItem[]>({
    queryKey: queryKeys.periods(appMode),
    staleTime: 1000 * 60 * 5, // 5 minutes cache ensures periods rail stays full and fast
    queryFn: async () => {
      const data = await feedApi.getNotes({
        limit: 100,
        type: 'PERIOD',
        appMode,
        privacy: appMode === 'dev' ? 'all' : 'public',
        status: appMode === 'public' ? 'PUBLISHED' : undefined,
      });
      return extractPeriodItems(data.items || []);
    },
  });
}

export function useInfiniteFeedNotes(
  params: QueryNotesParams & { streamSource?: string; selectedFeedSlug?: string }
) {
  return useInfiniteQuery<NotesResponse>({
    queryKey: queryKeys.feedStream(params),
    staleTime: 1000 * 60 * 3, // 3 minutes cache keeps client navigation instant
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = (lastPage.offset || 0) + (lastPage.limit || 30);
      if (nextOffset < lastPage.total) {
        return nextOffset;
      }
      return undefined;
    },
    queryFn: async ({ pageParam = 0 }) => {
      return await feedApi.getNotes({
        limit: 30,
        offset: pageParam as number,
        ...params,
      });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
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
      // Pinpoint in-place update in active stream cache
      queryClient.setQueriesData<any>({ queryKey: ['feed', 'stream'] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.pages)) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: (page.items || []).map((item: any) =>
              item.id === updatedNote.id ? { ...item, ...updatedNote } : item
            ),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.noteDetail(updatedNote.id) });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await feedApi.deleteNote(id);
    },
    onSuccess: (_data, deletedId) => {
      // In-place remove from active stream cache pages
      queryClient.setQueriesData<any>({ queryKey: ['feed', 'stream'] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.pages)) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: (page.items || []).filter((item: any) => item.id !== deletedId),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.noteDetail(deletedId) });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
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

export function useAttachImagesFromUrls() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, items }: { noteId: string; items: ExternalImageItem[] }) => {
      return await feedApi.attachImagesFromUrls(noteId, items);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.noteDetail(variables.noteId) });
    },
  });
}

// ==========================================
// Streams API Hooks
// ==========================================

export function useStreams(includePrivate = false) {
  return useQuery<Stream[]>({
    queryKey: queryKeys.streams(includePrivate),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      return await feedApi.getStreams(includePrivate);
    },
  });
}

export function useStream(slug: string) {
  return useQuery<Stream>({
    queryKey: queryKeys.streamDetail(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      return await feedApi.getStream(slug);
    },
  });
}

export function useCreateStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStreamPayload) => {
      return await feedApi.createStream(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });
}

export function useUpdateStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStreamPayload }) => {
      return await feedApi.updateStream(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
    },
  });
}

export function useDeleteStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await feedApi.deleteStream(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
    },
  });
}

export function useAttachFeedToStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ streamId, feedId }: { streamId: string; feedId: string }) => {
      return await feedApi.attachFeedToStream(streamId, feedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
    },
  });
}

export function useDetachFeedFromStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ streamId, feedId }: { streamId: string; feedId: string }) => {
      return await feedApi.detachFeedFromStream(streamId, feedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['feed', 'stream'] });
    },
  });
}
