import { useQuery } from '@tanstack/react-query';
import { feedApi } from './client';
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
