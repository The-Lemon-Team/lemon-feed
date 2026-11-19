import { describe, it, expect } from 'vitest';
import { FeedModeOption } from '../../components/toolbar/types';
import { resolveEffectiveStreamMode, wouldCreateStreamCycle } from '../streamHierarchy';

describe('streamHierarchy', () => {
  const modes: FeedModeOption[] = [
    {
      id: 'leaf_ai',
      label: 'Leaf AI',
      emoji: '🤖',
      privacy: 'public',
      filterConfig: {
        privacy: 'public',
        feedSlugs: ['spark-ai'],
        tags: ['ai'],
        folderPaths: ['spark/ai/'],
      },
    },
    {
      id: 'leaf_clean',
      label: 'Leaf Clean',
      emoji: '✨',
      privacy: 'public',
      filterConfig: {
        privacy: 'public',
      },
    },
    {
      id: 'leaf_priv',
      label: 'Leaf Private',
      emoji: '🔒',
      privacy: 'private',
      filterConfig: {
        privacy: 'private',
        feedSlugs: ['secret-feed'],
      },
    },
    {
      id: 'mid_tech',
      label: 'Mid Tech',
      emoji: '💻',
      privacy: 'public',
      filterConfig: {
        privacy: 'public',
        feedSlugs: ['spark-habr'],
        childStreamSlugs: ['leaf_ai', 'leaf_clean', 'leaf_priv'],
        tags: ['dev'],
      },
    },
    {
      id: 'root_radar',
      label: 'Root Radar',
      emoji: '📡',
      privacy: 'public',
      filterConfig: {
        privacy: 'public',
        childStreamSlugs: ['mid_tech'],
      },
    },
  ];

  it('recursively resolves nested streams while blocking private descendants in public streams', () => {
    const resolved = resolveEffectiveStreamMode(modes[4], modes);
    expect(resolved.filterConfig?.feedSlugs).toEqual(['spark-habr', 'spark-ai']);
    expect(resolved.filterConfig?.tags).toEqual(['dev', 'ai']);
    expect(resolved.filterConfig?.folderPaths).toEqual(['spark/ai/']);
    expect(resolved.filterConfig?.fallbackStreams).toEqual([
      { slug: 'leaf_clean', title: 'Leaf Clean' },
    ]);
  });

  it('detects direct and transitive cycles', () => {
    expect(wouldCreateStreamCycle('leaf_ai', 'leaf_ai', modes)).toBe(true);
    expect(wouldCreateStreamCycle('leaf_ai', 'root_radar', modes)).toBe(true);
    expect(wouldCreateStreamCycle('leaf_ai', 'leaf_clean', modes)).toBe(false);
  });
});
