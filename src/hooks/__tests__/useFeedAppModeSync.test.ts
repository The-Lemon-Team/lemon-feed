import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedAppModeSync } from '../useFeedAppModeSync';

describe('useFeedAppModeSync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('initializes default app mode and edit mode', () => {
    const { result } = renderHook(() => useFeedAppModeSync(false));
    expect(['dev', 'staging', 'public']).toContain(result.current.appMode);
    expect(result.current.isEditMode).toBe(false);
  });

  it('updates appMode and persists in localStorage and URL', () => {
    const { result } = renderHook(() => useFeedAppModeSync(false));

    act(() => {
      result.current.handleSetAppMode('staging');
    });

    expect(result.current.appMode).toBe('staging');
    expect(localStorage.getItem('lenta_app_mode')).toBe('staging');
    expect(window.location.search).toContain('appMode=staging');
  });

  it('toggles editMode in dev mode', () => {
    const { result } = renderHook(() => useFeedAppModeSync(false));

    // Ensure dev mode
    act(() => {
      result.current.handleSetAppMode('dev');
    });

    expect(result.current.handleToggleEditMode).toBeDefined();

    act(() => {
      result.current.handleToggleEditMode?.();
    });

    expect(result.current.isEditMode).toBe(true);
    expect(localStorage.getItem('lenta_edit_mode')).toBe('true');
  });

  it('syncs mode from host container message', () => {
    const { result } = renderHook(() => useFeedAppModeSync(true));

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'LENTA_SET_APP_MODE',
            payload: { appMode: 'public' },
          },
        })
      );
    });

    expect(result.current.appMode).toBe('public');
    expect(localStorage.getItem('lenta_app_mode')).toBe('public');
  });
});
