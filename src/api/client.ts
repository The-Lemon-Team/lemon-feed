import axios from 'axios';
import { Note, Feed, NotesResponse, QueryNotesParams } from '@lenta/shared';

const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : import.meta.env.PROD
    ? ''
    : 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let currentFeedAuthToken: string | null = null;
let currentFeedUserKey: string | null = null;

export const setFeedAuthToken = (token: string | null, userKey?: string | null) => {
  currentFeedAuthToken = token;
  currentFeedUserKey = userKey || null;
};

export const getFeedAuthToken = () => currentFeedAuthToken;
export const getFeedUserKey = () => currentFeedUserKey;

apiClient.interceptors.request.use((config) => {
  if (currentFeedAuthToken) {
    config.headers.Authorization = `Bearer ${currentFeedAuthToken}`;
  }
  if (currentFeedUserKey) {
    config.headers['x-user-key'] = currentFeedUserKey;
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

export const feedApi = {
  getNotes: async (params?: QueryNotesParams): Promise<NotesResponse> => {
    const res = await apiClient.get<NotesResponse>('/notes', { params });
    return res.data;
  },

  getFeeds: async (): Promise<Feed[]> => {
    const res = await apiClient.get<Feed[]>('/feeds');
    return res.data;
  },

  getNoteById: async (id: string): Promise<Note> => {
    const res = await apiClient.get<Note>(`/notes/${id}`);
    return res.data;
  },

  syncWikiToday: async (dateStr?: string): Promise<{ success: boolean; result: any }> => {
    const res = await apiClient.post('/ingestion/wiki/sync', {}, {
      params: dateStr ? { date: dateStr } : undefined,
    });
    return res.data;
  },
};

