import { UnifiedFeedItem } from '../adapters/feeds/types';

export interface NoteMediaTrack {
  id: string;
  url: string;
  title: string;
  kind: 'audio' | 'video';
  duration?: number | null;
  extension: string;
}

const AUDIO_EXTENSIONS = new Set(['m4a', 'mp3', 'wav', 'ogg', 'aac', 'flac', 'opus', 'weba']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'm4v']);

export function getMediaExtension(url?: string | null): string {
  if (!url) return '';
  const cleanUrl = url.split(/[?#]/)[0].trim();
  const lastDot = cleanUrl.lastIndexOf('.');
  if (lastDot === -1 || lastDot === cleanUrl.length - 1) return '';
  return cleanUrl.slice(lastDot + 1).toLowerCase();
}

export function detectMediaKind(url?: string | null, mimeType?: string | null): 'audio' | 'video' | null {
  if (mimeType) {
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime.startsWith('audio/')) return 'audio';
    if (lowerMime.startsWith('video/')) return 'video';
  }
  const ext = getMediaExtension(url);
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

export function isMediaUrl(url?: string | null): boolean {
  return detectMediaKind(url) !== null;
}

function normalizeUrlKey(url: string): string {
  return url.trim().replace(/^https?:\/\/[^/]+/i, '');
}

function cleanTrackTitle(rawTitle?: string | null): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/^[🎧🎙️🎵🎶🎬📹▶️\s\-•*]+/u, '')
    .trim();
}

/**
 * Extracts all attached audio and video media files from a note or UnifiedFeedItem,
 * combining metadata.audios, metadata.audioUrl, metadata.videos, and markdown media links.
 */
export function extractNoteMediaTracks(item?: UnifiedFeedItem | any | null): NoteMediaTrack[] {
  if (!item) return [];

  const raw = item.rawPayload || item;
  const meta = (raw?.metadata as any) || {};
  const tracksByKey = new Map<string, NoteMediaTrack>();

  const defaultDuration =
    item.audioDuration ??
    meta.audioDuration ??
    meta.podcast?.duration ??
    null;

  const upsertTrack = (
    url: string | undefined | null,
    title?: string | null,
    forcedKind?: 'audio' | 'video',
    duration?: number | null
  ) => {
    if (!url || typeof url !== 'string' || !url.trim()) return;
    const trimmedUrl = url.trim();
    const key = normalizeUrlKey(trimmedUrl);
    const kind = forcedKind || detectMediaKind(trimmedUrl) || 'audio';
    const ext = (getMediaExtension(trimmedUrl) || (kind === 'video' ? 'mp4' : 'mp3')).toUpperCase();
    const cleanedTitle = cleanTrackTitle(title);

    const existing = tracksByKey.get(key);
    if (existing) {
      if (
        cleanedTitle &&
        (!existing.title || existing.title === 'NotebookLM AI Podcast' || existing.title.startsWith('Аудиозапись'))
      ) {
        existing.title = cleanedTitle;
      }
      if (duration && !existing.duration) {
        existing.duration = duration;
      }
      return;
    }

    tracksByKey.set(key, {
      id: `track-${tracksByKey.size + 1}-${key.slice(-16)}`,
      url: trimmedUrl,
      title: cleanedTitle || 'NotebookLM AI Podcast',
      kind,
      duration: duration ?? (tracksByKey.size === 0 ? defaultDuration : null),
      extension: ext,
    });
  };

  // 1. Structured metadata.audios or item.audios
  const rawAudios = Array.isArray(item.audios)
    ? item.audios
    : Array.isArray(meta.audios)
    ? meta.audios
    : [];
  for (const aud of rawAudios) {
    if (aud && typeof aud.url === 'string') {
      upsertTrack(aud.url, aud.title, 'audio', aud.duration ?? null);
    }
  }

  // 2. Primary audioUrl
  const primaryAudioUrl =
    item.audioUrl ||
    meta.audioUrl ||
    meta.podcast?.audioUrl ||
    raw?.audioUrl ||
    null;
  if (primaryAudioUrl) {
    upsertTrack(primaryAudioUrl, meta.audioTitle || meta.podcast?.title || null, 'audio', defaultDuration);
  }

  // 3. Structured metadata.videos / videoUrl
  const rawVideos = Array.isArray(meta.videos) ? meta.videos : [];
  for (const vid of rawVideos) {
    if (vid && typeof vid.url === 'string') {
      upsertTrack(vid.url, vid.title || 'Видеозапись', 'video', vid.duration ?? null);
    }
  }
  if (meta.videoUrl && typeof meta.videoUrl === 'string') {
    upsertTrack(meta.videoUrl, meta.videoTitle || 'Видеозапись', 'video', null);
  }

  // 4. Scan markdown description for [Title](/uploads/media/....m4a|.mp3|.mp4)
  const description = item.description || raw?.description || '';
  if (typeof description === 'string' && description.includes('](')) {
    const linkRegex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(description)) !== null) {
      const [, linkLabel, linkHref] = match;
      const detectedKind = detectMediaKind(linkHref);
      if (detectedKind) {
        upsertTrack(linkHref, linkLabel, detectedKind, null);
      }
    }
  }

  return Array.from(tracksByKey.values());
}

/**
 * Strips redundant media link lists (e.g. "## 🎙️ Подкасты NotebookLM" and bullet links
 * that are already displayed in NoteMediaPlayer) so card snippets and detail text stay clean.
 */
export function stripExtractedMediaFromMarkdown(
  markdown: string | undefined | null,
  tracks: NoteMediaTrack[]
): string {
  if (!markdown) return '';
  if (!tracks || tracks.length === 0) return markdown;

  const trackKeys = new Set(tracks.map((t) => normalizeUrlKey(t.url)));
  let cleaned = markdown;

  // Remove bullet lines that consist solely of an emoji + link to an extracted media track
  cleaned = cleaned.replace(
    /^[ \t]*[-*+]\s*(?:[🎧🎙️🎵🎶🎬📹▶️]\s*)?\[[^\]]+\]\(([^)\s]+)\)[ \t]*\r?\n?/gmu,
    (fullLine, href) => {
      if (trackKeys.has(normalizeUrlKey(href)) || isMediaUrl(href)) {
        return '';
      }
      return fullLine;
    }
  );

  // Remove section headers like "## 🎙️ Подкасты NotebookLM" if they are now empty or followed by another heading/divider/blockquote
  cleaned = cleaned.replace(
    /^#{1,4}\s*(?:[🎙️🎧🎵🎶]\s*)?(?:Подкасты(?:\s+NotebookLM)?|Аудио(?:-обзор|-выпуск|записи)?|Медиафайлы)[ \t]*\r?\n+(?=\s*(?:$|^#{1,6}\s|^>|^---))/gmiu,
    ''
  );

  return cleaned.trim();
}

export function formatMediaTime(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
  if (hrs > 0) {
    const padMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${padMins}:${padSecs}`;
  }
  return `${mins}:${padSecs}`;
}
