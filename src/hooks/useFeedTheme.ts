import { useState, useEffect, useCallback } from 'react';

export function useFeedTheme() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return {
    isDarkMode,
    toggleTheme,
  };
}
