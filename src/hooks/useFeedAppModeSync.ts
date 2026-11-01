import { useState, useEffect, useCallback } from 'react';
import { setFeedAppMode } from '../api/client';
import { resolveFeedAppMode, isPublicEnvironment, FeedAppRuntimeMode } from '../utils/appMode';

export function useFeedAppModeSync(isEmbed: boolean) {
  const isPublicMode = isPublicEnvironment();
  const [appMode, setAppMode] = useState<FeedAppRuntimeMode>(() => resolveFeedAppMode());

  const handleSetAppMode = useCallback(
    (newMode: FeedAppRuntimeMode) => {
      setAppMode(newMode);
      setFeedAppMode(newMode);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lenta_app_mode', newMode);
          const url = new URL(window.location.href);
          url.searchParams.set('appMode', newMode);
          window.history.replaceState({}, '', url.toString());
        } catch (err) {
          console.warn('Failed to update URL:', err);
        }
        if (isEmbed && window.parent) {
          window.parent.postMessage(
            {
              type: 'LENTA_APP_MODE_CHANGED',
              source: 'lenta-feed-app',
              payload: { appMode: newMode },
            },
            '*'
          );
        }
      }
    },
    [isEmbed]
  );

  // Synchronize mode incoming from host container via postMessage
  useEffect(() => {
    const handleModeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LENTA_SET_APP_MODE') {
        const incoming = event.data.payload?.appMode;
        if (incoming === 'dev' || incoming === 'staging' || incoming === 'public') {
          setAppMode(incoming);
          setFeedAppMode(incoming);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('lenta_app_mode', incoming);
              const url = new URL(window.location.href);
              url.searchParams.set('appMode', incoming);
              window.history.replaceState({}, '', url.toString());
            } catch {
              // ignore
            }
          }
        }
      }
    };
    window.addEventListener('message', handleModeMessage);
    return () => window.removeEventListener('message', handleModeMessage);
  }, []);

  // Edit Mode state (available in Dev mode)
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('editMode') === 'true' || sp.get('edit') === '1') return true;
      return localStorage.getItem('lenta_edit_mode') === 'true';
    }
    return false;
  });

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lenta_edit_mode', String(next));
        const url = new URL(window.location.href);
        if (next) {
          url.searchParams.set('editMode', 'true');
        } else {
          url.searchParams.delete('editMode');
          url.searchParams.delete('edit');
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return {
    appMode,
    isPublicMode,
    isEditMode: appMode === 'dev' && isEditMode,
    handleSetAppMode,
    handleToggleEditMode: appMode === 'dev' ? handleToggleEditMode : undefined,
  };
}
