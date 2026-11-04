import axios from 'axios';
import {
  Note,
  Feed,
  NotesResponse,
  QueryNotesParams,
  GenerateNoteAiInput,
  GeneratedNoteEnrichment,
  WebImageResult,
  ExternalImageItem,
  NoteImage,
  Stream,
  CreateStreamPayload,
  UpdateStreamPayload,
} from '@lenta/shared';
import { FeedAppRuntimeMode, resolveFeedAppMode } from '../utils/appMode';

function resolveApiBaseUrl(): string {
  // When running in a browser accessed remotely (Tailscale LAN, Funnel, Magic URL),
  // always use relative URL ('') so Vite's proxy forwards requests to backend seamlessly,
  // preventing mobile "localhost" resolution errors and HTTPS mixed-content blocks.
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return '';
  }

  if (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '') {
    return import.meta.env.VITE_API_URL;
  }

  return import.meta.env.PROD ? '' : 'http://localhost:3002';
}

const API_BASE_URL = resolveApiBaseUrl();

export const DEFAULT_ADMIN_TOKEN =
  import.meta.env.VITE_ADMIN_TOKEN || 'lenta_adm_master_permanent_7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let currentFeedAuthToken: string | null = null;
let currentFeedUserKey: string | null = null;
let currentFeedAppMode: FeedAppRuntimeMode = resolveFeedAppMode();

export const setFeedAuthToken = (token: string | null, userKey?: string | null) => {
  currentFeedAuthToken = token;
  currentFeedUserKey = userKey || null;
};

export const setFeedAppMode = (mode: FeedAppRuntimeMode) => {
  currentFeedAppMode = mode;
};

export const getFeedAppMode = (): FeedAppRuntimeMode => currentFeedAppMode;

export const getFeedAuthToken = () => currentFeedAuthToken || DEFAULT_ADMIN_TOKEN;
export const getFeedUserKey = () => currentFeedUserKey;

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    if (url.includes('localhost:') || url.includes('127.0.0.1:')) {
      const uploadIdx = url.indexOf('/uploads/');
      if (uploadIdx !== -1) {
        return url.slice(uploadIdx);
      }
    }
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002');
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
};

apiClient.interceptors.request.use((config) => {
  const token = currentFeedAuthToken || DEFAULT_ADMIN_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (currentFeedUserKey) {
    config.headers['x-user-key'] = currentFeedUserKey;
  }
  if (currentFeedAppMode) {
    config.headers['x-app-mode'] = currentFeedAppMode;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[FeedApp API Error]', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface CreateFeedPayload {
  title: string;
  description?: string;
  slug?: string;
  folderPaths?: string[];
  icon?: string;
  color?: string;
  privacy?: 'public' | 'private';
  hashtags?: string[];
}

export type UpdateFeedPayload = Partial<CreateFeedPayload>;

export interface CreateNotePayload {
  title: string;
  description?: string;
  summary?: string;
  type?: 'SINGLE' | 'PERIOD' | 'EVENT' | 'FILM_RELEASE' | 'MENTION' | 'DONE';
  startDate?: string;
  endDate?: string | null;
  feedId?: string | null;
  publicFeedId?: string | null;
  folderPath?: string;
  author?: string;
  curator?: string;
  sourceLink?: string;
  hashtags?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  privacy?: 'private' | 'public';
  publishAt?: string | null;
}

export interface UpdateNotePayload {
  title?: string;
  description?: string;
  summary?: string;
  author?: string;
  curator?: string;
  sourceLink?: string;
  hashtags?: string[];
  status?: string;
  privacy?: 'private' | 'public';
  publicFeedId?: string | null;
  publishAt?: string | null;
  startDate?: string;
  endDate?: string | null;
}

export interface GenerateAiCoverPayload {
  style?: string;
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:3' | '3:4';
  customPrompt?: string;
  setAsMain?: boolean;
}

export interface GenerateAiBatchPayload {
  prompt: string;
  style?: string;
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:3' | '3:4';
  context?: string;
  count?: number;
  noteId?: string;
}

export interface AiMediaAsset {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  prompt: string;
  style?: string;
  aspectRatio: string;
  model: string;
}

export interface GeneratedBatchResult {
  synthesizedPrompt: string;
  model: string;
  isFallback: boolean;
  candidates: AiMediaAsset[];
}

export const feedApi = {
  getNotes: async (params?: QueryNotesParams): Promise<NotesResponse> => {
    const res = await apiClient.get<NotesResponse>('/notes', {
      params: {
        appMode: currentFeedAppMode,
        ...params,
      },
    });
    return res.data;
  },

  getFeeds: async (): Promise<Feed[]> => {
    const res = await apiClient.get<Feed[]>('/feeds');
    return res.data;
  },

  createFeed: async (data: CreateFeedPayload): Promise<Feed> => {
    const res = await apiClient.post<Feed>('/feeds', data);
    return res.data;
  },

  updateFeed: async (id: string, data: UpdateFeedPayload): Promise<Feed> => {
    const res = await apiClient.patch<Feed>(`/feeds/${id}`, data);
    return res.data;
  },

  deleteFeed: async (id: string): Promise<void> => {
    await apiClient.delete(`/feeds/${id}`);
  },

  getNoteById: async (id: string): Promise<Note> => {
    const res = await apiClient.get<Note>(`/notes/${id}`);
    return res.data;
  },

  createNote: async (data: CreateNotePayload): Promise<Note> => {
    const res = await apiClient.post<Note>('/notes', data);
    return res.data;
  },

  updateNote: async (id: string, data: UpdateNotePayload): Promise<Note> => {
    // We intentionally omit startDate so the original publication/timeline date is preserved,
    // and Prisma automatically sets updatedAt to the current timestamp.
    const res = await apiClient.patch<Note>(`/notes/${id}`, data);
    return res.data;
  },

  deleteNote: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/notes/${id}`);
    return res.data;
  },

  generateAiContent: async (data: GenerateNoteAiInput): Promise<GeneratedNoteEnrichment> => {
    const res = await apiClient.post<GeneratedNoteEnrichment>('/ingestion/ai/generate-content', data);
    return res.data;
  },

  generateNoteCover: async (noteId: string, data?: GenerateAiCoverPayload): Promise<{ image: any; meta: any }> => {
    const res = await apiClient.post(`/ingestion/ai/notes/${noteId}/generate-cover`, data || {}, {
      timeout: 120000,
    });
    return res.data;
  },

  generateAiBatch: async (data: GenerateAiBatchPayload): Promise<GeneratedBatchResult> => {
    const res = await apiClient.post<GeneratedBatchResult>('/ingestion/ai/generate-batch', data, {
      timeout: 120000,
    });
    return res.data;
  },

  attachCoverToNote: async (
    noteId: string,
    data: { assetUrl: string; caption?: string; setAsMain?: boolean }
  ): Promise<{ success: boolean; image: any }> => {
    const res = await apiClient.post(`/ingestion/ai/notes/${noteId}/attach-cover`, data);
    return res.data;
  },

  syncWikiToday: async (dateStr?: string): Promise<{ success: boolean; result: any }> => {
    const res = await apiClient.post('/ingestion/wiki/sync', {}, {
      params: dateStr ? { date: dateStr } : undefined,
    });
    return res.data;
  },

  // Posters & Web Media
  searchWebImages: async (
    query: string,
    options?: { gl?: string; hl?: string; num?: number }
  ): Promise<WebImageResult[]> => {
    const res = await apiClient.get<WebImageResult[]>('/notes/media/search-images', {
      params: { q: query, ...options },
    });
    return res.data;
  },

  attachImagesFromUrls: async (
    noteId: string,
    items: ExternalImageItem[]
  ): Promise<NoteImage[]> => {
    const res = await apiClient.post<NoteImage[]>(`/notes/${noteId}/images/from-urls`, { items });
    return res.data;
  },

  uploadImages: async (id: string, files: File[]): Promise<NoteImage[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await apiClient.post<NoteImage[]>(`/notes/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  setMainImage: async (noteId: string, imageId: string): Promise<NoteImage> => {
    const res = await apiClient.patch<NoteImage>(`/notes/${noteId}/images/${imageId}/main`);
    return res.data;
  },

  deleteImage: async (noteId: string, imageId: string): Promise<{ success: boolean; newMainId?: string }> => {
    const res = await apiClient.delete<{ success: boolean; newMainId?: string }>(
      `/notes/${noteId}/images/${imageId}`
    );
    return res.data;
  },

  // Streams API
  getStreams: async (includePrivate = false): Promise<Stream[]> => {
    const res = await apiClient.get<Stream[]>('/streams', {
      params: includePrivate ? { includePrivate: 'true' } : undefined,
    });
    return res.data;
  },

  getStream: async (slug: string): Promise<Stream> => {
    const res = await apiClient.get<Stream>(`/streams/${slug}`);
    return res.data;
  },

  createStream: async (data: CreateStreamPayload): Promise<Stream> => {
    const res = await apiClient.post<Stream>('/streams', data);
    return res.data;
  },

  updateStream: async (id: string, data: UpdateStreamPayload): Promise<Stream> => {
    const res = await apiClient.patch<Stream>(`/streams/${id}`, data);
    return res.data;
  },

  deleteStream: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/streams/${id}`);
    return res.data;
  },

  attachFeedToStream: async (streamId: string, feedId: string): Promise<Stream> => {
    const res = await apiClient.post<Stream>(`/streams/${streamId}/feeds/${feedId}`);
    return res.data;
  },

  detachFeedFromStream: async (streamId: string, feedId: string): Promise<Stream> => {
    const res = await apiClient.delete<Stream>(`/streams/${streamId}/feeds/${feedId}`);
    return res.data;
  },
};

