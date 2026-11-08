import { Note } from '@lenta/shared';

export const KNOWN_CHANGELOG_SUBTOPICS: Array<{
  subfolder: string;
  title: string;
  emoji: string;
  accentColor: string;
}> = [
  { subfolder: 'google', title: 'Google', emoji: '🌐', accentColor: '#4285f4' },
  { subfolder: 'openai', title: 'OpenAI', emoji: '🧠', accentColor: '#10a37f' },
  { subfolder: 'anthropic', title: 'Anthropic', emoji: '⚡', accentColor: '#d97706' },
  { subfolder: 'deepseek', title: 'DeepSeek', emoji: '🐋', accentColor: '#0ea5e9' },
];

export function buildChangelogSubtopics(
  changelogSubCounts: Record<string, number>,
  allFeeds: Array<{ slug: string; _count?: { notes: number } }> = [],
): Array<{
  id: string;
  slug: string;
  subfolder: string;
  title: string;
  emoji: string;
  count: number;
  accentColor: string;
}> {
  const mergedCounts: Record<string, number> = { ...changelogSubCounts };

  for (const f of allFeeds) {
    if (f.slug && (f.slug.startsWith('spark-changelogsfeed-') || f.slug.startsWith('changelogs-'))) {
      const sub = f.slug.replace(/^spark-changelogsfeed-|^changelogs-/, '').toLowerCase();
      if (sub && (f as any)._count?.notes) {
        mergedCounts[sub] = Math.max(mergedCounts[sub] || 0, (f as any)._count.notes);
      }
    }
  }

  const discovered = new Set<string>();
  const subtopics: Array<{
    id: string;
    slug: string;
    subfolder: string;
    title: string;
    emoji: string;
    count: number;
    accentColor: string;
  }> = [];

  for (const known of KNOWN_CHANGELOG_SUBTOPICS) {
    discovered.add(known.subfolder);
    const count = mergedCounts[known.subfolder] || 0;
    if (count > 0) {
      subtopics.push({
        id: `sub-${known.subfolder}`,
        slug: `spark-changelogsfeed-${known.subfolder}`,
        subfolder: known.subfolder,
        title: known.title,
        emoji: known.emoji,
        count,
        accentColor: known.accentColor,
      });
    }
  }

  for (const [sub, count] of Object.entries(mergedCounts)) {
    if (sub !== 'other' && !discovered.has(sub) && count > 0) {
      const cap = sub.charAt(0).toUpperCase() + sub.slice(1);
      subtopics.push({
        id: `sub-${sub}`,
        slug: `spark-changelogsfeed-${sub}`,
        subfolder: sub,
        title: cap,
        emoji: '📦',
        count,
        accentColor: '#f97316',
      });
      discovered.add(sub);
    }
  }

  return subtopics;
}

export const KNOWN_NOTEBOOKLM_SUBTOPICS: Array<{
  subfolder: 'regular' | 'telegram';
  title: string;
  emoji: string;
  accentColor: string;
}> = [
  { subfolder: 'regular', title: 'Обычные', emoji: '🎙️', accentColor: '#a855f7' },
  { subfolder: 'telegram', title: 'Telegram', emoji: '✈️', accentColor: '#2481cc' },
];

/**
 * Extracts the changelog subfolder/vendor from a note (e.g. 'google', 'openai', 'anthropic', 'deepseek').
 * Inspects folder path, folder relations, slug, metadata, and hashtags.
 */
export function extractChangelogSubfolder(note: Note): string | null {
  const checkString = (str?: string | null): string | null => {
    if (!str) return null;
    const normalized = str.replace(/\\/g, '/').toLowerCase();
    const match = normalized.match(/changelogs?(?:feed)?\/([^/]+)/);
    if (match && match[1]) {
      const clean = match[1].trim().toLowerCase();
      return clean === 'antropic' ? 'anthropic' : clean;
    }
    return null;
  };

  const fromFolderPath = checkString(note.folderPath);
  if (fromFolderPath) return fromFolderPath;

  if (note.folders && Array.isArray(note.folders)) {
    for (const f of note.folders) {
      const p = f.folder?.path || f.folder?.name || '';
      const res = checkString(p);
      if (res) return res;
    }
  }

  const slug = (note.feed?.slug || '').toLowerCase();
  if (slug.startsWith('spark-changelogsfeed-')) {
    const sub = slug.replace(/^spark-changelogsfeed-/, '').trim();
    return sub === 'antropic' ? 'anthropic' : sub;
  }
  if (slug.startsWith('changelogs-')) {
    const sub = slug.replace(/^changelogs-/, '').trim();
    return sub === 'antropic' ? 'anthropic' : sub;
  }

  // Check metadata vendor/subtopic
  const meta = (note.metadata || {}) as Record<string, any>;
  if (meta.vendor && typeof meta.vendor === 'string') {
    const v = meta.vendor.trim().toLowerCase();
    return v === 'antropic' ? 'anthropic' : v;
  }
  if (meta.subtopic && typeof meta.subtopic === 'string') {
    const s = meta.subtopic.trim().toLowerCase();
    return s === 'antropic' ? 'anthropic' : s;
  }

  // Check hashtags for known vendors or custom tags
  if (note.hashtags && Array.isArray(note.hashtags)) {
    const tagNames = note.hashtags.map((h: any) =>
      (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim()
    );
    for (const known of KNOWN_CHANGELOG_SUBTOPICS) {
      if (tagNames.includes(known.subfolder)) {
        return known.subfolder;
      }
    }
  }

  return null;
}

export function isChangelogsNote(note: Note): boolean {
  if (extractChangelogSubfolder(note)) return true;
  const slug = (note.feed?.slug || '').toLowerCase();
  if (
    slug.startsWith('spark-changelogsfeed') ||
    slug === 'changelogsfeed' ||
    slug === 'changelogs' ||
    slug.startsWith('changelogs-')
  ) {
    return true;
  }
  const fp = (note.folderPath || '').replace(/\\/g, '/').toLowerCase();
  if (fp.includes('changelogsfeed') || fp.includes('changelogs')) return true;
  if (note.folders && Array.isArray(note.folders)) {
    const inFolder = note.folders.some((f) => {
      const p = (f.folder?.path || f.folder?.name || '').replace(/\\/g, '/').toLowerCase();
      return p.includes('changelogsfeed') || p.includes('changelogs');
    });
    if (inFolder) return true;
  }
  if (note.hashtags && Array.isArray(note.hashtags)) {
    return note.hashtags.some((h) => {
      const name = (typeof h === 'string' ? h : h?.name || '').toLowerCase().replace(/^#/, '').trim();
      return name === 'changelog' || name === 'changelogs' || name === 'релиз' || name === 'релизы';
    });
  }
  return false;
}

export function isNotebooklmNote(note: Note): boolean {
  const slug = (note.feed?.slug || '').toLowerCase();
  if (
    slug === 'spark-notebooklmai' ||
    slug.startsWith('spark-notebooklmai-') ||
    slug === 'notebooklm-ai' ||
    slug === 'notebooklm-podcasts'
  ) {
    return true;
  }
  const fp = (note.folderPath || '').replace(/\\/g, '/').toLowerCase();
  if (fp.includes('notebooklm') || fp.includes('podcasts/ai')) return true;
  if (note.folders && Array.isArray(note.folders)) {
    return note.folders.some((f) => {
      const p = (f.folder?.path || f.folder?.name || '').replace(/\\/g, '/').toLowerCase();
      return p.includes('notebooklm') || p.includes('podcasts/ai');
    });
  }
  return false;
}

/**
 * Classifies a NotebookLM note into 'telegram' or 'regular' subtopic.
 */
export function extractNotebooklmSubtopic(note: Note): 'telegram' | 'regular' | null {
  if (!isNotebooklmNote(note)) return null;

  const slug = (note.feed?.slug || '').toLowerCase();
  if (slug === 'spark-notebooklmai-telegram') return 'telegram';
  if (slug === 'spark-notebooklmai-regular') return 'regular';

  const checkPath = (str?: string | null): 'telegram' | 'regular' | null => {
    if (!str) return null;
    const normalized = str.replace(/\\/g, '/').toLowerCase();
    if (normalized.includes('notebooklmai/telegram') || normalized.includes('notebooklm/telegram')) {
      return 'telegram';
    }
    if (normalized.includes('notebooklmai/regular') || normalized.includes('notebooklm/regular')) {
      return 'regular';
    }
    return null;
  };

  const fromFolderPath = checkPath(note.folderPath);
  if (fromFolderPath) return fromFolderPath;

  if (note.folders && Array.isArray(note.folders)) {
    for (const f of note.folders) {
      const res = checkPath(f.folder?.path || f.folder?.name);
      if (res) return res;
    }
  }

  const meta = (note.metadata || {}) as Record<string, any>;
  const subtype = String(meta.subtype || '').toLowerCase();
  if (subtype.includes('telegram')) return 'telegram';

  const fileName = String(meta.fileName || meta.filePath || note.externalId || '').toLowerCase();
  if (fileName.includes('telegram')) return 'telegram';

  const title = (note.title || '').toLowerCase();
  if (title.includes('telegram')) return 'telegram';

  if (note.hashtags && Array.isArray(note.hashtags)) {
    const hasTgTag = note.hashtags.some((h) => (h.name || '').toLowerCase() === 'telegram');
    if (hasTgTag) return 'telegram';
  }

  return 'regular';
}
