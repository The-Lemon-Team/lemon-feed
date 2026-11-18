import React, { Suspense, lazy, useState, useCallback } from 'react';
import { useFeedTheme } from './hooks/useFeedTheme';
import { FeedBusView } from './feed-bus';
import { FeedStandardView } from './views/FeedStandardView';
import {
  FeedAppEnvironment,
  isFeedBusEnvironment,
  resolveFeedEnvironment,
  setFeedBusProfile,
  setFeedEnvironment,
} from './utils/appMode';

const FeedWatchersView = lazy(() =>
  import('@feed-watchers/FeedWatchersView').then((m) => ({ default: m.FeedWatchersView }))
);

/**
 * Root Application Component.
 * Routes between isolated environments & profiles:
 *  - `watchers` environment -> `FeedWatchersView` (lightweight SSE pre-moderation feed)
 *  - `notes` environment:
 *      - Standard Notes Feed View (`FeedStandardView`)
 *      - Lemon-Bus Moderation View (`FeedBusView`)
 */
export const App: React.FC = () => {
  const { isDarkMode, toggleTheme } = useFeedTheme();

  const [feedEnv, setFeedEnv] = useState<FeedAppEnvironment>(() => resolveFeedEnvironment());
  const [isFeedBusMode, setIsFeedBusMode] = useState<boolean>(() => isFeedBusEnvironment());

  const handleToggleFeedBus = useCallback((active?: boolean) => {
    setIsFeedBusMode((prev) => {
      const next = typeof active === 'boolean' ? active : !prev;
      setFeedBusProfile(next);
      return next;
    });
  }, []);

  const handleSwitchEnvironment = useCallback((target: FeedAppEnvironment) => {
    setFeedEnvironment(target);
    setFeedEnv(target);
  }, []);

  if (feedEnv === 'watchers') {
    const isDedicatedWatchersBuild =
      (import.meta.env.VITE_FEED_ENV || import.meta.env.MODE || '').toLowerCase() === 'watchers';

    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0e1621] text-slate-500 text-xs font-mono">
            Загрузка ленты Lemon Watchers...
          </div>
        }
      >
        <FeedWatchersView
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onSwitchToNotesEnv={
            isDedicatedWatchersBuild ? undefined : () => handleSwitchEnvironment('notes')
          }
        />
      </Suspense>
    );
  }

  if (isFeedBusMode) {
    return (
      <FeedBusView
        onExitFeedBus={() => handleToggleFeedBus(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <FeedStandardView
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      onOpenFeedBus={() => handleToggleFeedBus(true)}
    />
  );
};
