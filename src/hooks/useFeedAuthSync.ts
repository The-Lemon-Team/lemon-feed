import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  MicrofrontendMessage,
  MicrofrontendAuthSyncPayload,
  MicrofrontendAuthUser,
} from '@lenta/shared';
import { setFeedAuthToken } from '../api/client';

export interface FeedAuthState {
  token: string | null;
  user: MicrofrontendAuthUser | null;
  userKey: string | null;
  isSynced: boolean;
}

export function useFeedAuthSync(isEmbed: boolean) {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<FeedAuthState>(() => {
    let initialToken: string | null = null;
    let initialUserKey: string | null = null;
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      initialToken =
        sp.get('token') ||
        sp.get('adminToken') ||
        localStorage.getItem('lemon_lenta_auth_token_v1') ||
        null;
      initialUserKey = sp.get('userKey') || localStorage.getItem('lenta_user_key') || null;
    }
    if (initialToken || initialUserKey) {
      setFeedAuthToken(initialToken, initialUserKey);
    }
    return {
      token: initialToken,
      user: null,
      userKey: initialUserKey,
      isSynced: Boolean(initialToken),
    };
  });

  // Request auth handshake from parent if running inside an iframe or embed mode
  const requestParentAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: 'LENTA_AUTH_REQUEST', source: 'lenta-feed-app' },
        '*'
      );
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as MicrofrontendMessage<MicrofrontendAuthSyncPayload>;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'LENTA_AUTH_SYNC') {
        const payload = data.payload;
        const nextToken = payload?.token || null;
        const nextUser = payload?.user || null;
        const nextKey = payload?.userKey || null;

        setFeedAuthToken(nextToken, nextKey);
        setAuthState({
          token: nextToken,
          user: nextUser,
          userKey: nextKey,
          isSynced: true,
        });

        // Invalidate feed notes and feeds list so they re-fetch with active credentials
        queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
        queryClient.invalidateQueries({ queryKey: ['feed', 'sources'] });
      } else if (data.type === 'LENTA_AUTH_LOGOUT') {
        setFeedAuthToken(null, null);
        setAuthState({
          token: null,
          user: null,
          userKey: null,
          isSynced: true,
        });
        queryClient.invalidateQueries({ queryKey: ['feed', 'notes'] });
        queryClient.invalidateQueries({ queryKey: ['feed', 'sources'] });
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial handshake request
    if (isEmbed || (typeof window !== 'undefined' && window.parent !== window)) {
      requestParentAuth();
      // Safety retry after brief delay to catch any late parent mount
      const timer = setTimeout(requestParentAuth, 300);
      return () => {
        window.removeEventListener('message', handleMessage);
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isEmbed, queryClient, requestParentAuth]);

  return {
    ...authState,
    requestParentAuth,
  };
}
