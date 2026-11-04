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
  KNOWN_CHANGELOG_SUBTOPICS,
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
      // Notes attached to public feeds are NEVER part of the private contour
      if (note.feed && note.feed.privacy === 'public') {
        return false;
      }
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

    // If explicit criteria are configured, match by them:
    if (hasSlugs || hasTags || hasFolders) {
      // 1. Attached candidate feed slug match
      if (hasSlugs) {
        const slug = (note.feed?.slug || '').toLowerCase();
        if (slug && (targetSlugs!.has(slug) || Array.from(targetSlugs!).some((s) => slug.includes(s)))) {
          return true;
        }
        if (
          isChangelogsNote(note) &&
          (targetSlugs!.has('spark-changelogsfeed') ||
            targetSlugs!.has('changelogs') ||
            targetSlugs!.has('changelog'))
        ) {
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
    }

    // Clean Slate by Default:
    // If NO criteria are configured, the tab is a clean workspace!
    // It only matches notes that were explicitly authored for or tagged with this tab:
    const normTabId = modeOption.id.toLowerCase().trim();
    const normLabel = modeOption.label.toLowerCase().trim();

    const noteFeedSlug = (note.feed?.slug || '').toLowerCase();
    if (noteFeedSlug && (noteFeedSlug === normTabId || noteFeedSlug.endsWith(`/${normTabId}`))) {
      return true;
    }

    const noteFolder = (note.folderPath || '').toLowerCase();
    if (
      noteFolder &&
      (noteFolder.includes(`/${normTabId}/`) ||
        noteFolder.startsWith(`${normTabId}/`) ||
        noteFolder.includes(`/${normLabel}/`) ||
        noteFolder.startsWith(`${normLabel}/`))
    ) {
      return true;
    }

    const noteTags = (note.hashtags || []).map((h: any) =>
      (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim()
    );
    if (noteTags.includes(normTabId) || noteTags.includes(normLabel)) {
      return true;
    }

    // Default: Clean empty tab (0 notes)
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
        { id?: string; title: string; emoji: string; color: string; description?: string }
      > = {};

      const hasSlugs = Boolean(targetSlugs && targetSlugs.size > 0);
      const hasFolders = Boolean(targetFolders && targetFolders.length > 0);
      const hasTags = Boolean(targetTags && targetTags.length > 0);

      const feedMatchesFilter = (f: { slug: string; folderPaths?: string[]; hashtags?: string[] }): boolean => {
        const slug = f.slug.toLowerCase();
        if (hasSlugs) {
          if (targetSlugs!.has(slug)) return true;
          if (Array.from(targetSlugs!).some((s) => slug.includes(s) || s.includes(slug))) return true;
        }
        if (hasFolders && f.folderPaths && f.folderPaths.length > 0) {
          const matched = f.folderPaths.some((fp) => {
            const p = fp.toLowerCase();
            return targetFolders!.some((tf) => p.includes(tf) || tf.includes(p));
          });
          if (matched) return true;
        }
        if (hasTags && f.hashtags && f.hashtags.length > 0) {
          const matched = f.hashtags.some((ht) => {
            const t = (typeof ht === 'string' ? ht : (ht as any)?.name || '').toLowerCase().replace(/^#/, '');
            return targetTags!.some((tt) => t === tt);
          });
          if (matched) return true;
        }
        return false;
      };

      for (const f of context.allFeeds) {
        if (targetPrivacy === 'private' && f.privacy !== 'private') continue;
        if (targetPrivacy !== 'private' && f.privacy === 'private') continue;

        // Child subtopics of changelogs/notebooklm roll up into their parent tabs
        if (f.slug.startsWith('spark-changelogsfeed-') || f.slug.startsWith('changelogs-')) continue;
        if (f.slug.startsWith('spark-notebooklmai-') || f.slug.startsWith('notebooklm-')) continue;

        if (!feedMatchesFilter(f)) continue;

        countsBySlug[f.slug] = 0;
        feedMetaBySlug[f.slug] = {
          id: f.id,
          title: f.title,
          emoji: f.icon || modeOption.emoji || '📁',
          color: f.color || '#2481cc',
          description: f.description || undefined,
        };
      }

      const allowsChangelogs =
        targetPrivacy !== 'private' &&
        Boolean(
          targetSlugs?.has('spark-changelogsfeed') ||
            targetSlugs?.has('changelogs') ||
            targetSlugs?.has('changelog')
        );

      if (allowsChangelogs && !feedMetaBySlug['spark-changelogsfeed']) {
        feedMetaBySlug['spark-changelogsfeed'] = {
          title: 'Changelogs & Релизы',
          emoji: '🚀',
          color: '#f97316',
          description: 'Официальные обновления и релизы вендоров: Google, OpenAI, Anthropic, DeepSeek',
        };
        countsBySlug['spark-changelogsfeed'] = 0;
      }

      const allowsNotebooklm =
        targetPrivacy !== 'private' &&
        Boolean(
          targetSlugs?.has('spark-notebooklmai') ||
            targetSlugs?.has('notebooklm')
        );

      if (allowsNotebooklm && !feedMetaBySlug['spark-notebooklmai']) {
        feedMetaBySlug['spark-notebooklmai'] = {
          title: 'NotebookLM AI',
          emoji: '🎙️',
          color: '#a855f7',
          description: 'Структурированные аудио-обзоры и аналитические синтезы от NotebookLM',
        };
        countsBySlug['spark-notebooklmai'] = 0;
      }

      // Count notes for each feed
      for (const n of context.notes) {
        if (matchesPrivacy(n) && matchesSourceCriteria(n)) {
          if (allowsChangelogs && isChangelogsNote(n)) {
            countsBySlug['spark-changelogsfeed'] = (countsBySlug['spark-changelogsfeed'] || 0) + 1;
            continue;
          }

          if (allowsNotebooklm && isNotebooklmNote(n)) {
            countsBySlug['spark-notebooklmai'] = (countsBySlug['spark-notebooklmai'] || 0) + 1;
            continue;
          }

          const slug = n.feed?.slug || (targetPrivacy === 'private' ? 'private-notes' : 'general-notes');
          const slugLower = slug.toLowerCase();
          if (
            targetSlugs &&
            !targetSlugs.has(slugLower) &&
            !Array.from(targetSlugs).some((s) => slugLower.includes(s) || s.includes(slugLower))
          ) {
            continue;
          }
          countsBySlug[slug] = (countsBySlug[slug] || 0) + 1;
          if (!feedMetaBySlug[slug]) {
            const matchedDbFeed = context.allFeeds.find((f) => f.slug === slug || f.id === n.feed?.id);
            feedMetaBySlug[slug] = {
              id: matchedDbFeed?.id || n.feed?.id,
              title: matchedDbFeed?.title || n.feed?.title || (slug === 'private-notes' ? 'Личные заметки' : slug),
              emoji: matchedDbFeed?.icon || n.feed?.icon || modeOption.emoji || '📁',
              color: matchedDbFeed?.color || n.feed?.color || '#2481cc',
              description: matchedDbFeed?.description || n.feed?.description || undefined,
            };
          }
        }
      }

      const feedTabs: UnifiedFeedTab[] = Object.entries(feedMetaBySlug)
        .filter(([slug, meta]) => (countsBySlug[slug] || 0) > 0 || Boolean(meta.id))
        .map(([slug, meta]) => {
          const tab: UnifiedFeedTab = {
            id: meta.id || `tab-cfg-${slug}`,
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
              if (matchesPrivacy(n) && matchesSourceCriteria(n) && isChangelogsNote(n)) {
                const sub = extractChangelogSubfolder(n);
                if (sub) changelogCounts[sub] = (changelogCounts[sub] || 0) + 1;
              }
            }
            tab.subtopics = buildChangelogSubtopics(changelogCounts, context.allFeeds);
          } else if (slug.includes('notebooklm')) {
            const nbCounts: Record<'regular' | 'telegram', number> = { regular: 0, telegram: 0 };
            for (const n of context.notes) {
              if (matchesPrivacy(n) && matchesSourceCriteria(n) && isNotebooklmNote(n)) {
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
            } else if (
              activeFeedSlug === 'spark-changelogsfeed' ||
              activeFeedSlug === 'changelogs' ||
              activeFeedSlug === 'changelog' ||
              activeFeedSlug.startsWith('spark-changelogsfeed-') ||
              activeFeedSlug.startsWith('changelogs-')
            ) {
              if (!isChangelogsNote(note)) return false;

              let sub: string | null = null;
              if (activeFeedSlug.startsWith('spark-changelogsfeed-')) {
                sub = activeFeedSlug.replace(/^spark-changelogsfeed-/, '').trim().toLowerCase();
              } else if (activeFeedSlug.startsWith('changelogs-')) {
                sub = activeFeedSlug.replace(/^changelogs-/, '').trim().toLowerCase();
              }

              if (sub && sub !== 'spark-changelogsfeed' && sub !== 'changelogs' && sub !== 'changelog') {
                const noteSub = extractChangelogSubfolder(note);
                const hasTag = (note.hashtags || []).some((h: any) => {
                  const name = (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim();
                  return name === sub;
                });
                if (noteSub !== sub && !hasTag) return false;
              }
            } else if (
              activeFeedSlug === 'spark-notebooklmai' ||
              activeFeedSlug === 'notebooklm' ||
              activeFeedSlug.startsWith('spark-notebooklmai-') ||
              activeFeedSlug.startsWith('notebooklm-') ||
              activeFeedSlug === 'regular' ||
              activeFeedSlug === 'telegram'
            ) {
              if (!isNotebooklmNote(note)) return false;
              let nbSub: string | null = null;
              if (activeFeedSlug.startsWith('spark-notebooklmai-')) {
                nbSub = activeFeedSlug.replace(/^spark-notebooklmai-/, '');
              } else if (activeFeedSlug.startsWith('notebooklm-')) {
                nbSub = activeFeedSlug.replace(/^notebooklm-/, '');
              } else if (activeFeedSlug === 'regular' || activeFeedSlug === 'telegram') {
                nbSub = activeFeedSlug;
              }
              if (nbSub && nbSub !== 'spark-notebooklmai' && nbSub !== 'notebooklm') {
                const noteSub = extractNotebooklmSubtopic(note) || 'regular';
                if (noteSub !== nbSub) return false;
              }
            } else {
              const slug = (note.feed?.slug || '').toLowerCase();
              const folder = (note.folderPath || '').toLowerCase();
              const target = activeFeedSlug.toLowerCase();
              const matchesCurrentFeed =
                Boolean(slug && (slug === target || slug.includes(target) || target.includes(slug))) ||
                Boolean(folder && folder.includes(target));
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
            const subfolder = extractChangelogSubfolder(note);
            const matchSubfolder = Boolean(subfolder && subfolder.includes(query));
            if (!matchTitle && !matchDesc && !matchAuthor && !matchTag && !matchSubfolder) return false;
          }

          return true;
        })
        .map((n) => {
          const cover = extractNoteCoverUrl(n);
          const changelogSub = extractChangelogSubfolder(n);
          const nbSub = extractNotebooklmSubtopic(n);

          let channelTitle = n.feed?.title || modeOption.label;
          let avatarIcon = n.feed?.icon || modeOption.emoji || '📁';
          let categoryBadge = {
            label: modeOption.label,
            emoji: modeOption.emoji || '📁',
            colorClass: 'border-blue-500/30 text-blue-500',
          };

          if (changelogSub) {
            const known = KNOWN_CHANGELOG_SUBTOPICS.find((k) => k.subfolder === changelogSub);
            const vendorName = known?.title || (changelogSub.charAt(0).toUpperCase() + changelogSub.slice(1));
            channelTitle = `${vendorName} Changelog`;
            avatarIcon = known?.emoji || '🚀';

            categoryBadge = {
              label: `Changelog / ${vendorName.toUpperCase()}`,
              emoji: known?.emoji || '🚀',
              colorClass: 'border-orange-500/30 text-orange-500',
            };
          } else if (isChangelogsNote(n)) {
            channelTitle = 'Changelogs & Релизы';
            avatarIcon = '🚀';
            categoryBadge = {
              label: 'Changelogs',
              emoji: '🚀',
              colorClass: 'border-orange-500/30 text-orange-500',
            };
          } else if (nbSub) {
            channelTitle = `NotebookLM (${nbSub === 'telegram' ? 'Telegram' : 'Аудио'})`;
            avatarIcon = nbSub === 'telegram' ? '✈️' : '🎙️';
            categoryBadge = {
              label: 'NotebookLM AI',
              emoji: '🎙️',
              colorClass: 'border-purple-500/30 text-purple-500',
            };
          }

          return {
            id: n.id,
            sourceType: modeOption.id,
            feedSlug: n.feed?.slug || (changelogSub ? `spark-changelogsfeed-${changelogSub}` : 'general-notes'),
            channelTitle,
            channelHandle: `@${modeOption.id}/${n.feed?.slug || (changelogSub ? `changelogs/${changelogSub}` : 'feed')}`,
            avatarIcon,
            category: categoryBadge,
            title: n.title,
            description: n.description || '',
            summary: (n as any).summary || null,
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
