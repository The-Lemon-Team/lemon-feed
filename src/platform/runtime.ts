import { invokeNative, isTauriRuntime } from './native';
import { RuntimeCapabilities, RuntimeInfo } from './types';

const WEB_CAPABILITIES: RuntimeCapabilities = { localDb: false, lanSync: false, driveSync: false };

let cached: Promise<RuntimeInfo> | null = null;

async function detect(): Promise<RuntimeInfo> {
  if (!isTauriRuntime()) {
    return { kind: 'web', os: 'web', capabilities: WEB_CAPABILITIES };
  }
  const { os, mobile } = await invokeNative<{ os: string; mobile: boolean }>('runtime_info');
  return {
    kind: mobile ? 'tauri-mobile' : 'tauri-desktop',
    os,
    // The UI checks capabilities, never the platform name.
    capabilities: { localDb: true, lanSync: true, driveSync: mobile },
  };
}

/** Resolved once per session; safe to call from anywhere. */
export const getRuntime = (): Promise<RuntimeInfo> => (cached ??= detect());
