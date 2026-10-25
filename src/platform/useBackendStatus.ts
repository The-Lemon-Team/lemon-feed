import { useCallback, useEffect, useState } from 'react';
import { discoverBackend } from './backendDiscovery';
import { getRuntime } from './runtime';
import { DiscoveryResult, RuntimeInfo } from './types';

const POLL_MS = 15000;

/** Runtime info (web vs Tauri mobile) plus capability flags. `null` until detected. */
export function useRuntime(): RuntimeInfo | null {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  useEffect(() => {
    let alive = true;
    getRuntime().then((r) => alive && setRuntime(r));
    return () => {
      alive = false;
    };
  }, []);
  return runtime;
}

export interface BackendStatus {
  /** Paired LAN backend reachable on Wi-Fi. Always false where `lanSync` is unavailable. */
  online: boolean;
  discovery: DiscoveryResult | null;
  refresh: () => Promise<void>;
}

/** Re-runs discovery on mount, on a timer, on focus and when the browser reports a network change. */
export function useBackendStatus(): BackendStatus {
  const runtime = useRuntime();
  const lanSync = runtime?.capabilities.lanSync ?? false;
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);

  const refresh = useCallback(async () => {
    if (!lanSync) return;
    try {
      setDiscovery(await discoverBackend());
    } catch {
      setDiscovery(null);
    }
  }, [lanSync]);

  useEffect(() => {
    if (!lanSync) return;
    void refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    const onChange = () => void refresh();
    window.addEventListener('online', onChange);
    window.addEventListener('offline', onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', onChange);
      window.removeEventListener('offline', onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [lanSync, refresh]);

  return { online: discovery?.online ?? false, discovery, refresh };
}
