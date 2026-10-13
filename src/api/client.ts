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
};
