/**
 * Bridge to the Tauri Rust layer. The Tauri API is imported lazily so the plain web build
 * never loads it and keeps working in a browser.
 */

export const isTauriRuntime = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function invokeNative<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error(`Native command "${command}" is unavailable outside Tauri`);
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}
