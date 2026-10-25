/** Shapes shared between the webview and the Rust layer (mirror of src-tauri discovery.rs). */

export interface RuntimeCapabilities {
  /** Local SQLite store is available (Rust layer). */
  localDb: boolean;
  /** LAN backend discovery + sync is available. */
  lanSync: boolean;
  /** Google Drive Bus sync is available (OAuth + file transfer). */
  driveSync: boolean;
}

export type RuntimeKind = 'web' | 'tauri-mobile' | 'tauri-desktop';

export interface RuntimeInfo {
  kind: RuntimeKind;
  os: string;
  capabilities: RuntimeCapabilities;
}

export interface BackendEndpoint {
  name: string;
  url: string;
  /** LAN endpoints only count as "online" while on Wi-Fi. */
  lan: boolean;
}

export interface NetIface {
  name: string;
  ip: string;
  private: boolean;
  wifiLike: boolean;
}

export interface ProbeResult {
  name: string;
  url: string;
  lan: boolean;
  ok: boolean;
  instanceId: string | null;
  latencyMs: number | null;
  error: string | null;
}

export interface DiscoveryResult {
  wifi: boolean | null;
  interfaces: NetIface[];
  probes: ProbeResult[];
  selected: ProbeResult | null;
  /** True when a paired LAN backend is reachable on Wi-Fi. */
  online: boolean;
}
