import { useState, useRef, useCallback, useEffect } from 'react';
import {
  DEFAULT_NOTE_TEMPLATES,
  NOTE_TEMPLATE_YOUTUBE,
  NoteTemplateDefinition,
  ParsedLinkMetadata,
  PendingPosterItem,
  QuickAddMacro,
  extractFirstYouTubeUrl,
  isYouTubeUrl,
} from '@lenta/shared';
import { useParseLinkMetadata, useQuickAddMacros } from '../api/queries';

export type NoteFormType = 'SINGLE' | 'PERIOD' | 'EVENT' | 'FILM_RELEASE' | 'MENTION' | 'DONE';

const VALID_NOTE_TYPES = new Set<NoteFormType>([
  'SINGLE',
  'PERIOD',
  'EVENT',
  'FILM_RELEASE',
  'MENTION',
  'DONE',
]);

export function mergeHashtagsString(current: string, additions: string[]): string {
  if (!additions || additions.length === 0) return current;
  const existing = current
    .split(/[,\s]+/)
    .map((h) => h.trim().replace(/^#/, ''))
    .filter(Boolean);
  const existingLower = new Set(existing.map((h) => h.toLowerCase()));
  const merged = [...existing];
  for (const tag of additions) {
    const clean = tag.trim().replace(/^#/, '');
    if (clean && !existingLower.has(clean.toLowerCase())) {
      existingLower.add(clean.toLowerCase());
      merged.push(clean);
    }
  }
  return merged.map((h) => `#${h}`).join(' ');
}

interface UseNotePresetAndLinkParserOptions {
  isOpen: boolean;
  initialSourceLink?: string | null;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  summary: string;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
  author: string;
  setAuthor: React.Dispatch<React.SetStateAction<string>>;
  sourceLink: string;
  setSourceLink: React.Dispatch<React.SetStateAction<string>>;
  setHashtagsStr: React.Dispatch<React.SetStateAction<string>>;
  setType: React.Dispatch<React.SetStateAction<NoteFormType>>;
  setFeedId: React.Dispatch<React.SetStateAction<string>>;
  setPendingPosters: React.Dispatch<React.SetStateAction<PendingPosterItem[]>>;
}

export function useNotePresetAndLinkParser({
  isOpen,
  initialSourceLink,
  title,
  setTitle,
  description,
  setDescription,
  summary,
  setSummary,
  author,
  setAuthor,
  sourceLink,
  setSourceLink,
  setHashtagsStr,
  setType,
  setFeedId,
  setPendingPosters,
}: UseNotePresetAndLinkParserOptions) {
  const { data: macros = [] } = useQuickAddMacros(isOpen);
  const parseLinkMutation = useParseLinkMetadata();

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeMacroId, setActiveMacroId] = useState<string | null>(null);
  const [presetFolderPath, setPresetFolderPath] = useState<string | undefined>(undefined);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedLinkMetadata | null>(null);
  const [linkParseError, setLinkParseError] = useState<string | null>(null);

  const lastParsedUrlRef = useRef<string | null>(null);
  const lastAutoFilledRef = useRef<{
    title?: string;
    summary?: string;
    description?: string;
    author?: string;
  }>({});

  const applyTemplate = useCallback(
    (tpl: NoteTemplateDefinition) => {
      setActiveTemplateId(tpl.id);
      setActiveMacroId(null);

      if (VALID_NOTE_TYPES.has(tpl.defaultType as NoteFormType)) {
        setType(tpl.defaultType as NoteFormType);
      }
      if (tpl.defaultFolder) {
        setPresetFolderPath(tpl.defaultFolder);
      }
      if (tpl.defaultHashtags?.length) {
        setHashtagsStr((prev) => mergeHashtagsString(prev, tpl.defaultHashtags));
      }
      if (tpl.defaultMarkdown) {
        setDescription((prev) => (prev.trim() ? prev : tpl.defaultMarkdown!));
      }
    },
    [setType, setHashtagsStr, setDescription],
  );

  const applyMacro = useCallback(
    (macro: QuickAddMacro | null) => {
      if (!macro) {
        setActiveMacroId(null);
        return;
      }
      setActiveMacroId(macro.id);
      setActiveTemplateId(null);

      if (macro.feedId) {
        setFeedId(macro.feedId);
      }
      const macroFolder = macro.folderPaths?.[0] || macro.folderPath || undefined;
      if (macroFolder) {
        setPresetFolderPath(macroFolder);
      }
      if (macro.noteType && VALID_NOTE_TYPES.has(macro.noteType as NoteFormType)) {
        setType(macro.noteType as NoteFormType);
      }
      if (macro.hashtags?.length) {
        setHashtagsStr((prev) => mergeHashtagsString(prev, macro.hashtags!));
      }
    },
    [setFeedId, setType, setHashtagsStr],
  );

  const parseAndApplyLink = useCallback(
    async (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) return;

      const ytMatch = extractFirstYouTubeUrl(trimmed);
      const targetUrl = ytMatch ? ytMatch.canonicalUrl : trimmed;

      if (ytMatch) {
        const ytPreset = DEFAULT_NOTE_TEMPLATES[NOTE_TEMPLATE_YOUTUBE];
        if (ytPreset) {
          setActiveTemplateId(ytPreset.id);
          setActiveMacroId(null);
          setPresetFolderPath((prev) => prev || ytPreset.defaultFolder);
          setHashtagsStr((prev) => mergeHashtagsString(prev, ytPreset.defaultHashtags));
        }
        setYoutubeUrlInput(targetUrl);
      }

      setSourceLink(targetUrl);
      setLinkParseError(null);
      lastParsedUrlRef.current = targetUrl;

      try {
        const parsed = await parseLinkMutation.mutateAsync(targetUrl);
        setParsedPreview(parsed);
        setSourceLink(parsed.canonicalUrl || targetUrl);
        if (parsed.kind === 'youtube') {
          setYoutubeUrlInput(parsed.canonicalUrl || targetUrl);
        }

        const prevAuto = lastAutoFilledRef.current;

        if (parsed.title) {
          setTitle((curr) => {
            const c = curr.trim();
            if (!c || c === prevAuto.title || isYouTubeUrl(c)) {
              return parsed.title;
            }
            return curr;
          });
        }

        if (parsed.shortDescription) {
          setSummary((curr) => {
            const c = curr.trim();
            if (!c || c === prevAuto.summary) {
              return parsed.shortDescription!;
            }
            return curr;
          });
        }

        const descValue = parsed.description || parsed.shortDescription;
        if (descValue) {
          setDescription((curr) => {
            const c = curr.trim();
            if (!c || c === prevAuto.description) {
              return descValue;
            }
            return curr;
          });
        }

        if (parsed.author) {
          setAuthor((curr) => {
            const c = curr.trim();
            if (!c || c === 'Admin' || c === prevAuto.author) {
              return parsed.author!;
            }
            return curr;
          });
        }

        if (parsed.suggestedHashtags?.length) {
          setHashtagsStr((prev) => mergeHashtagsString(prev, parsed.suggestedHashtags!));
        }

        if (parsed.thumbnailUrl) {
          setPendingPosters((prev) => {
            const withoutAuto = prev.filter((p) => !p.id.startsWith('parsed-link-'));
            const hasUserMain = withoutAuto.some((p) => p.isMain);
            const autoPoster: PendingPosterItem = {
              id: `parsed-link-${parsed.videoId || Date.now()}`,
              url: parsed.thumbnailUrl!,
              thumbnailUrl: parsed.previewUrl || parsed.thumbnailUrl!,
              title: parsed.title || 'YouTube Preview',
              isMain: !hasUserMain,
              source: parsed.kind === 'youtube' ? 'YouTube' : 'Link Preview',
            };
            return [autoPoster, ...withoutAuto];
          });
        }

        lastAutoFilledRef.current = {
          title: parsed.title,
          summary: parsed.shortDescription,
          description: descValue,
          author: parsed.author,
        };
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Не удалось распарсить ссылку';
        setLinkParseError(String(msg));
      }
    },
    [
      parseLinkMutation,
      setSourceLink,
      setTitle,
      setSummary,
      setDescription,
      setAuthor,
      setHashtagsStr,
      setPendingPosters,
    ],
  );

  // Reset state on modal open and trigger initial parse if opened from a pasted YouTube link
  useEffect(() => {
    if (!isOpen) return;

    setActiveTemplateId(null);
    setActiveMacroId(null);
    setPresetFolderPath(undefined);
    setYoutubeUrlInput('');
    setParsedPreview(null);
    setLinkParseError(null);
    lastParsedUrlRef.current = null;
    lastAutoFilledRef.current = {};

    if (initialSourceLink && isYouTubeUrl(initialSourceLink)) {
      void parseAndApplyLink(initialSourceLink);
    } else if (initialSourceLink) {
      setSourceLink(initialSourceLink);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSourceLink]);

  // Debounced auto-detection if user types/edits a YouTube URL directly in sourceLink
  useEffect(() => {
    if (!isOpen) return;
    const ytMatch = extractFirstYouTubeUrl(sourceLink);
    if (!ytMatch) return;
    if (lastParsedUrlRef.current === ytMatch.canonicalUrl) return;

    const timer = setTimeout(() => {
      void parseAndApplyLink(ytMatch.canonicalUrl);
    }, 350);
    return () => clearTimeout(timer);
  }, [isOpen, sourceLink, parseAndApplyLink]);

  const handleTitlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData?.getData('text/plain');
      const ytMatch = extractFirstYouTubeUrl(pasted);
      if (ytMatch && !title.trim()) {
        e.preventDefault();
        void parseAndApplyLink(ytMatch.canonicalUrl);
      }
    },
    [title, parseAndApplyLink],
  );

  const handleSourceLinkPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData?.getData('text/plain');
      const ytMatch = extractFirstYouTubeUrl(pasted);
      if (ytMatch) {
        e.preventDefault();
        void parseAndApplyLink(ytMatch.canonicalUrl);
      }
    },
    [parseAndApplyLink],
  );

  return {
    macros,
    activeTemplateId,
    activeMacroId,
    presetFolderPath,
    youtubeUrlInput,
    setYoutubeUrlInput,
    parsedPreview,
    isParsingLink: parseLinkMutation.isPending,
    linkParseError,
    applyTemplate,
    applyMacro,
    parseAndApplyLink,
    handleTitlePaste,
    handleSourceLinkPaste,
    isYouTubeMode:
      activeTemplateId === NOTE_TEMPLATE_YOUTUBE ||
      Boolean(parsedPreview?.kind === 'youtube') ||
      isYouTubeUrl(sourceLink),
  };
}
