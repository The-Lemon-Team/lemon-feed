import { FeedModeOption, resolveStreamPrivacy } from '../components/toolbar/types';

function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim().replace(/-/g, '_');
}

/**
 * Checks whether attaching `candidateChildSlug` under `parentSlug` would create a cycle.
 */
export function wouldCreateStreamCycle(
  parentSlug: string | undefined,
  candidateChildSlug: string,
  allModes: FeedModeOption[],
): boolean {
  if (!parentSlug) return false;
  const normParent = normalizeSlug(parentSlug);
  const normCandidate = normalizeSlug(candidateChildSlug);
  if (normParent === normCandidate) return true;

  const bySlug = new Map<string, FeedModeOption>();
  for (const m of allModes) {
    bySlug.set(normalizeSlug(m.id), m);
  }

  const visited = new Set<string>();
  const queue: string[] = [normCandidate];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);

    const node = bySlug.get(cur);
    if (!node) continue;

    for (const child of node.filterConfig?.childStreamSlugs || []) {
      const normChild = normalizeSlug(child);
      if (normChild === normParent) return true;
      if (!visited.has(normChild)) {
        queue.push(normChild);
      }
    }
  }

  return false;
}

/**
 * Recursively aggregates feedSlugs, tags, folderPaths, and implicit child stream targets
 * across nested child streams with cycle & privacy protection.
 */
export function resolveEffectiveStreamMode(
  rootMode: FeedModeOption,
  allModes: FeedModeOption[],
): FeedModeOption {
  const childSlugs = rootMode.filterConfig?.childStreamSlugs;
  if (!childSlugs || childSlugs.length === 0) {
    return rootMode;
  }

  const bySlug = new Map<string, FeedModeOption>();
  for (const m of allModes) {
    bySlug.set(normalizeSlug(m.id), m);
  }

  const rootPrivacy = resolveStreamPrivacy(rootMode);
  const allowPrivateDescendants = rootPrivacy === 'private';

  const visited = new Set<string>();
  const queue: FeedModeOption[] = [rootMode];

  const feedSlugsSet = new Set<string>();
  const tagsSet = new Set<string>();
  const folderPathsSet = new Set<string>();
  const fallbackStreams: Array<{ slug: string; title: string }> = [];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const normId = normalizeSlug(cur.id);
    if (visited.has(normId)) continue;

    if (cur !== rootMode && !allowPrivateDescendants && resolveStreamPrivacy(cur) === 'private') {
      continue;
    }

    visited.add(normId);
    const cfg = cur.filterConfig || {};
    const ownFeeds = cfg.feedSlugs || [];
    const ownTags = cfg.tags || [];
    const ownFolders = cfg.folderPaths || [];
    const ownChildren = cfg.childStreamSlugs || [];

    for (const f of ownFeeds) if (f) feedSlugsSet.add(f);
    for (const t of ownTags) if (t) tagsSet.add(t);
    for (const fp of ownFolders) if (fp) folderPathsSet.add(fp);

    if (
      cur !== rootMode &&
      ownFeeds.length === 0 &&
      ownTags.length === 0 &&
      ownFolders.length === 0 &&
      ownChildren.length === 0
    ) {
      fallbackStreams.push({ slug: cur.id, title: cur.label });
    }

    for (const cid of ownChildren) {
      const normChild = normalizeSlug(cid);
      if (!visited.has(normChild)) {
        const childMode = bySlug.get(normChild);
        if (childMode) queue.push(childMode);
      }
    }
  }

  return {
    ...rootMode,
    filterConfig: {
      ...rootMode.filterConfig,
      feedSlugs: feedSlugsSet.size > 0 ? Array.from(feedSlugsSet) : undefined,
      tags: tagsSet.size > 0 ? Array.from(tagsSet) : undefined,
      folderPaths: folderPathsSet.size > 0 ? Array.from(folderPathsSet) : undefined,
      fallbackStreams: fallbackStreams.length > 0 ? fallbackStreams : undefined,
    },
  };
}
