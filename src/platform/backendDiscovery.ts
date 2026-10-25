import { invokeNative } from './native';
import { BackendEndpoint, DiscoveryResult } from './types';

const KV_ENDPOINTS = 'backend.endpoints';
const KV_INSTANCE_ID = 'backend.instanceId';

/** Ordered by priority: the first healthy, paired endpoint wins. */
export const DEFAULT_ENDPOINTS: BackendEndpoint[] = [
  { name: 'Home LAN', url: 'http://192.168.1.10:3001', lan: true },
];

export async function loadEndpoints(): Promise<BackendEndpoint[]> {
  const raw = await invokeNative<string | null>('store_kv_get', { key: KV_ENDPOINTS });
  if (!raw) return DEFAULT_ENDPOINTS;
  try {
    const parsed = JSON.parse(raw) as BackendEndpoint[];
    return parsed.length ? parsed : DEFAULT_ENDPOINTS;
  } catch {
    return DEFAULT_ENDPOINTS;
  }
}

export const saveEndpoints = (endpoints: BackendEndpoint[]) =>
  invokeNative<void>('store_kv_set', { key: KV_ENDPOINTS, value: JSON.stringify(endpoints) });

export const getPairedInstanceId = () =>
  invokeNative<string | null>('store_kv_get', { key: KV_INSTANCE_ID });

export const clearPairing = () => invokeNative<void>('store_kv_set', { key: KV_INSTANCE_ID, value: '' });

/**
 * Asks the Rust layer whether we are online: on Wi-Fi with a paired backend reachable.
 * On first contact (no paired instance) the first healthy server is accepted and remembered.
 */
export async function discoverBackend(timeoutMs = 1500): Promise<DiscoveryResult> {
  const [endpoints, paired] = await Promise.all([loadEndpoints(), getPairedInstanceId()]);
  const expected = paired || null;
  const result = await invokeNative<DiscoveryResult>('discover_backend', {
    endpoints,
    expectedInstanceId: expected,
    timeoutMs,
  });
  if (!expected && result.selected?.instanceId) {
    await invokeNative<void>('store_kv_set', { key: KV_INSTANCE_ID, value: result.selected.instanceId });
  }
  return result;
}
