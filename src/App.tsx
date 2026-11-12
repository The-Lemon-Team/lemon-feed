import React, { useState, useCallback } from 'react';
import { useFeedTheme } from './hooks/useFeedTheme';
import { FeedBusView } from './feed-bus';
import { FeedStandardView } from './views/FeedStandardView';
import { isFeedBusEnvironment, setFeedBusProfile } from './utils/appMode';

/**
 * Root Application Component.
 * Acts as an orchestrator / profile router between:
 *  - Standard Feed View (`FeedStandardView`)
 *  - Lemon-Bus Moderation View (`FeedBusView`)
 */
export const App: React.FC = () => {
  // Global theme synchronization
  const { isDarkMode, toggleTheme } = useFeedTheme();

  // Feed-Bus Mode state (Dedicated Lemon-Bus moderation profile)
  const [isFeedBusMode, setIsFeedBusMode] = useState<boolean>(() => isFeedBusEnvironment());

  const handleToggleFeedBus = useCallback((active?: boolean) => {
    setIsFeedBusMode((prev) => {
      const next = typeof active === 'boolean' ? active : !prev;
      setFeedBusProfile(next);
      return next;
    });
  }, []);

  // Dedicated Feed-Bus Mode Profile (Moderation gateway for Lemon-Bus)
  if (isFeedBusMode) {
    return (
      <FeedBusView
        onExitFeedBus={() => handleToggleFeedBus(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Standard Feed Application Profile
  return (
    <FeedStandardView
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      onOpenFeedBus={() => handleToggleFeedBus(true)}
    />
  );
};
