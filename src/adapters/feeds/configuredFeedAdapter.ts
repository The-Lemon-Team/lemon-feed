import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  extractNoteCoverUrl,
} from './types';
import { FeedModeOption } from '../../components/toolbar/types';
import {
  KNOWN_NOTEBOOKLM_SUBTOPICS,
  buildChangelogSubtopics,
  extractChangelogSubfolder,
  isChangelogsNote,
  isNotebooklmNote,
  extractNotebooklmSubtopic,
} from './devFeedSubtopics';

export function createConfiguredFeedAdapter(modeOption: FeedModeOption): FeedAdapter {
  const filterConfig = modeOption.filterConfig || {};
  const targetPrivacy = filterConfig.privacy || 'all';
  const targetSlugs =
    filterConfig.feedSlugs && filterConfig.feedSlugs.length > 0
      ? new Set(filterConfig.feedSlugs.map((s) => s.toLowerCase()))
      : null;
  const targetTags =
    filterConfig.tags && filterConfig.tags.length > 0
      ? filterConfig.tags.map((t) => t.toLowerCase().replace(/^#/, '').trim())
      : null;
  const targetFolders =
    filterConfig.folderPaths && filterConfig.folderPaths.length > 0
      ? filterConfig.folderPaths.map((f) => f.toLowerCase().trim())
      : null;

  const matchesPrivacy = (note: Note): boolean => {
    if (targetPrivacy === 'private') {
      const p = (note.folderPath || '').toLowerCase();
      const isPriv =
        note.privacy === 'private' ||
        note.feed?.privacy === 'private' ||
        p.startsWith('private/') ||
        p.includes('/private') ||
        p.includes('.private') ||
        p.includes('секрет');
      if (!isPriv) return false;
    } else if (targetPrivacy === 'public') {
      const isPub =
        (note.privacy === 'public' || !note.privacy) &&
        (!note.feed || note.feed.privacy === 'public');
      if (!isPub) return false;
    }
    return true;
  };

  const matchesSourceCriteria = (note: Note): boolean => {
    const hasSlugs = Boolean(targetSlugs && targetSlugs.size > 0);
    const hasTags = Boolean(targetTags && targetTags.length > 0);
    const hasFolders = Boolean(targetFolders && targetFolders.length > 0);

    // If no source criteria configured, match all notes that passed privacy
    if (!hasSlugs && !hasTags && !hasFolders) {
      return true;
    }

    // 1. Attached candidate feed slug match
    if (hasSlugs) {
      const slug = (note.feed?.slug || '').toLowerCase();
      if (slug && (targetSlugs!.has(slug) || Array.from(targetSlugs!).some((s) => slug.includes(s)))) {
        return true;
      }
    }

    // 2. Folder prefix match
    if (hasFolders) {
      const noteFolder = (note.folderPath || '').toLowerCase();
      if (targetFolders!.some((f) => noteFolder.includes(f))) {
        return true;
      }
    }

    // 3. Hashtag match
    if (hasTags) {
      const noteTags = (note.hashtags || []).map((h: any) =>
        (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim()
      );
      if (targetTags!.some((t) => noteTags.includes(t))) {
        return true;
      }
    }

    return false;
  };

  return {
    sourceType: modeOption.id,
    label: modeOption.label,
    shortLabel: modeOption.label,
    emoji: modeOption.emoji || '📁',
    description: modeOption.description || `Поток для раздела ${modeOption.label}`,

    getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
      const tabs: UnifiedFeedTab[] = [];

      // 1. Hashtag sub-chips (if multiple target tags configured)
      if (targetTags && targetTags.length > 1) {
        for (const tag of targetTags) {
          let tagCount = 0;
          for (const n of context.notes) {
            if (matchesPrivacy(n)) {
              const noteTags = (n.hashtags || []).map((h: any) =>
                (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim()
              );
              if (noteTags.includes(tag)) {
                tagCount++;
              }
            }
          }
          if (tagCount > 0) {
            tabs.push({
              id: `tab-tag-${tag}`,
              slug: `tag-${tag}`,
              title: `#${tag}`,
              shortTitle: `#${tag}`,
              emoji: '🏷️',
              category: modeOption.label,
              count: tagCount,
              accentColor: '#0ea5e9',
              badgeBgLight: 'rgba(14, 165, 233, 0.1)',
              badgeTextLight: '#0284c7',
              badgeBgDark: 'rgba(14, 165, 233, 0.25)',
              badgeTextDark: '#7dd3fc',
              description: `Заметки с хэштегом #${tag}`,
            });
          }
        }
      }

      // 2. Attached or candidate feeds
      const countsBySlug: Record<string, number> = {};
      const feedMetaBySlug: Record<
        string,
        { title: string; emoji: string; color: string; description?: string }
      > = {};

      for (const f of context.allFeeds) {
        if (targetPrivacy === 'private' && f.privacy !== 'private') continue;
        if (targetPrivacy === 'public' && f.privacy === 'private') continue;
        if (targetSlugs && !targetSlugs.has(f.slug.toLowerCase())) continue;

        countsBySlug[f.slug] = 0;
        feedMetaBySlug[f.slug] = {
          title: f.title,
          emoji: f.icon || modeOption.emoji || '📁',
          color: f.color || '#2481cc',
          description: f.description || undefined,
        };
      }

      // Count notes for each feed
      for (const n of context.notes) {
        if (matchesPrivacy(n) && matchesSourceCriteria(n)) {
          const slug = n.feed?.slug || (targetPrivacy === 'private' ? 'private-notes' : 'general-notes');
          if (targetSlugs && !targetSlugs.has(slug.toLowerCase())) {
            continue;
          }
          countsBySlug[slug] = (countsBySlug[slug] || 0) + 1;
          if (!feedMetaBySlug[slug]) {
            feedMetaBySlug[slug] = {
              title: n.feed?.title || (slug === 'private-notes' ? 'Личные заметки' : slug),
              emoji: n.feed?.icon || modeOption.emoji || '📁',
              color: n.feed?.color || '#2481cc',
              description: n.feed?.description || undefined,
            };
          }
        }
      }

      const feedTabs: UnifiedFeedTab[] = Object.entries(feedMetaBySlug)
        .filter(([slug]) => (countsBySlug[slug] || 0) > 0)
        .map(([slug, meta]) => {
          const tab: UnifiedFeedTab = {
            id: `tab-cfg-${slug}`,
            slug,
            title: meta.title,
            shortTitle: meta.title.length > 18 ? meta.title.slice(0, 18) + '...' : meta.title,
            emoji: meta.emoji,
            category: modeOption.label,
            count: countsBySlug[slug] || 0,
            accentColor: meta.color,
            badgeBgLight: 'rgba(36, 129, 204, 0.1)',
            badgeTextLight: '#1e6cb0',
            badgeBgDark: 'rgba(36, 129, 204, 0.25)',
            badgeTextDark: '#93c5fd',
            description: meta.description,
          };

          // Attach subtopics if applicable:
          if (slug.includes('changelog')) {
            const changelogCounts: Record<string, number> = {};
            for (const n of context.notes) {
              if (isChangelogsNote(n)) {
                const sub = extractChangelogSubfolder(n);
                if (sub) changelogCounts[sub] = (changelogCounts[sub] || 0) + 1;
              }
            }
            tab.subtopics = buildChangelogSubtopics(changelogCounts, context.allFeeds);
          } else if (slug.includes('notebooklm')) {
            const nbCounts: Record<'regular' | 'telegram', number> = { regular: 0, telegram: 0 };
            for (const n of context.notes) {
              if (isNotebooklmNote(n)) {
                const sub = extractNotebooklmSubtopic(n) || 'regular';
                nbCounts[sub] = (nbCounts[sub] || 0) + 1;
              }
            }
            tab.subtopics = KNOWN_NOTEBOOKLM_SUBTOPICS.map((s) => ({
              id: `sub-nb-${s.subfolder}`,
              slug: s.subfolder,
              subfolder: s.subfolder,
              title: s.title,
              emoji: s.emoji,
              accentColor: s.accentColor,
              count: nbCounts[s.subfolder as 'regular' | 'telegram'] || 0,
            }));
          }

          return tab;
        });

      return [...tabs, ...feedTabs];
    },

    adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
      const query = searchQuery?.toLowerCase().trim();

      return notes
        .filter((note) => {
          if (!matchesPrivacy(note)) return false;

          if (activeFeedSlug) {
            if (activeFeedSlug.startsWith('tag-')) {
              const activeTag = activeFeedSlug.replace('tag-', '').toLowerCase();
              const noteTags = (note.hashtags || []).map((h: any) =>
                (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim()
              );
              if (!noteTags.includes(activeTag)) return false;
            } else if (activeFeedSlug.includes('changelog') || activeFeedSlug.startsWith('spark-changelogsfeed-')) {
              if (!isChangelogsNote(note)) return false;
              const sub = activeFeedSlug.replace('spark-changelogsfeed-', '');
              if (sub && sub !== 'spark-changelogsfeed') {
                const noteSub = extractChangelogSubfolder(note);
                if (noteSub !== sub) return false;
              }
            } else if (activeFeedSlug === 'regular' || activeFeedSlug === 'telegram') {
              if (!isNotebooklmNote(note)) return false;
              const noteSub = extractNotebooklmSubtopic(note) || 'regular';
              if (noteSub !== activeFeedSlug) return false;
            } else {
              const slug = (note.feed?.slug || '').toLowerCase();
              const folder = (note.folderPath || '').toLowerCase();
              const target = activeFeedSlug.toLowerCase();
              const matchesCurrentFeed =
                slug === target ||
                slug.includes(target) ||
                target.includes(slug) ||
                folder.includes(target);
              if (!matchesCurrentFeed) return false;
            }
          } else {
            // Overview: must match source criteria (feed slugs, folders or tags)
            if (!matchesSourceCriteria(note)) return false;
          }

          if (query) {
            const matchTitle = note.title?.toLowerCase().includes(query);
            const matchDesc = note.description?.toLowerCase().includes(query);
            const matchAuthor = (note.author || note.curator)?.toLowerCase().includes(query);
            const matchTag = note.hashtags?.some((h: any) =>
              (typeof h === 'string' ? h : h.name)?.toLowerCase().includes(query)
            );
            if (!matchTitle && !matchDesc && !matchAuthor && !matchTag) return false;
          }

          return true;
        })
        .map((n) => {
          const cover = extractNoteCoverUrl(n);
          return {
            id: n.id,
            sourceType: modeOption.id,
            feedSlug: n.feed?.slug || 'general-notes',
            channelTitle: n.feed?.title || modeOption.label,
            channelHandle: `@${modeOption.id}/${n.feed?.slug || 'feed'}`,
            avatarIcon: n.feed?.icon || modeOption.emoji || '📁',
            category: {
              label: modeOption.label,
              emoji: modeOption.emoji || '📁',
              colorClass: 'border-blue-500/30 text-blue-500',
            },
            title: n.title,
            description: n.description || '',
            summary: n.description || null,
            publishedAt: n.startDate ? new Date(n.startDate).toISOString() : new Date().toISOString(),
            updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
            sourceLink: n.sourceLink,
            status: n.status,
            author: n.author || null,
            curator: n.curator || modeOption.label,
            hashtags: n.hashtags?.map((h: any) => (typeof h === 'string' ? h : h.name)) || [],
            coverUrl: cover,
            isHot: Boolean(n.metadata?.isHot || n.metadata?.priority === 'high'),
            rawPayload: n,
          };
        });
    },
  };
}
