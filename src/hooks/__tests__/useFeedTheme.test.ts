import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedTheme } from '../useFeedTheme';

describe('useFeedTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('initializes with dark mode false if document has no dark class', () => {
    const { result } = renderHook(() => useFeedTheme());
    expect(result.current.isDarkMode).toBe(false);
  });

  it('initializes with dark mode true if document has dark class', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useFeedTheme());
    expect(result.current.isDarkMode).toBe(true);
  });

  it('toggles theme correctly and updates document element class', () => {
    const { result } = renderHook(() => useFeedTheme());
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
