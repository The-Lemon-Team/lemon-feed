import {
  LemonModerationItem,
  ModerationApprovalResult,
  ModerationBatchResult,
  ModerationQueryOptions,
  ModerationRejectResult,
  ModerationStats,
  PaginatedModerationItems,
} from '@lenta/lemon-bus';
import { ModerationApiClient } from '@lenta/seasons-neurons';

/**
 * Resolves the Lemon-Bus API base URL.
 * In development / browser with proxy, defaults to '' (using Vite /moderation proxy).
 * Can be overridden via VITE_LEMON_BUS_URL.
 */
function resolveBusBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = (import.meta as any).env?.VITE_LEMON_BUS_URL;
    if (custom) return custom.replace(/\/+$/, '');
    return '';
  }
  return 'http://127.0.0.1:3030';
}

export const feedBusClient = new ModerationApiClient({
  baseUrl: resolveBusBaseUrl(),
});

export const feedBusApi = {
  getStats: async (): Promise<ModerationStats> => {
    return feedBusClient.getStats();
  },

  queryItems: async (options: ModerationQueryOptions = {}): Promise<PaginatedModerationItems> => {
    return feedBusClient.queryItems(options);
  },

  getItem: async (id: string): Promise<LemonModerationItem> => {
    return feedBusClient.getItem(id);
  },

  proposeItem: async (
    item: Partial<LemonModerationItem> & { title: string }
  ): Promise<{ ok: boolean; item: LemonModerationItem }> => {
    return feedBusClient.proposeItem(item);
  },

  approveItem: async (
    id: string,
    overrides?: Partial<LemonModerationItem>,
    moderatorId?: string
  ): Promise<ModerationApprovalResult> => {
    return feedBusClient.approveItem(id, overrides, moderatorId);
  },

  rejectItem: async (
    id: string,
    reason?: string,
    moderatorId?: string
  ): Promise<ModerationRejectResult> => {
    return feedBusClient.rejectItem(id, reason, moderatorId);
  },

  updateItem: async (
    id: string,
    patch: Partial<LemonModerationItem>
  ): Promise<{ ok: boolean; item: LemonModerationItem }> => {
    return feedBusClient.updateItem(id, patch);
  },

  batchApprove: async (ids: string[], moderatorId?: string): Promise<ModerationBatchResult> => {
    return feedBusClient.batchApprove(ids, moderatorId);
  },

  batchReject: async (
    ids: string[],
    reason?: string,
    moderatorId?: string
  ): Promise<ModerationBatchResult> => {
    return feedBusClient.batchReject(ids, reason, moderatorId);
  },

  importWatcherItems: async (limit = 100): Promise<{ ok: boolean; imported: number; skipped: number }> => {
    return feedBusClient.importWatcherItems(limit);
  },
};
