import React from 'react';
import {
  Youtube,
  ClipboardPaste,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import {
  ParsedLinkMetadata,
  formatYouTubeDuration,
  extractFirstYouTubeUrl,
} from '@lenta/shared';
import { resolveMediaUrl } from '../../api/client';

export interface YouTubeQuickImportBarProps {
  urlValue: string;
  onUrlChange: (value: string) => void;
  onParseUrl: (url: string) => void;
  isParsing: boolean;
  parseError: string | null;
  parsedPreview: ParsedLinkMetadata | null;
}

export const YouTubeQuickImportBar: React.FC<YouTubeQuickImportBarProps> = ({
  urlValue,
  onUrlChange,
  onParseUrl,
  isParsing,
  parseError,
  parsedPreview,
}) => {
  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) return;
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const match = extractFirstYouTubeUrl(text);
      const nextUrl = match ? match.canonicalUrl : text.trim();
      onUrlChange(nextUrl);
      if (nextUrl) {
        onParseUrl(nextUrl);
      }
    } catch {
      // Clipboard read may be denied; user can still paste manually with Ctrl+V
    }
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;
    const match = extractFirstYouTubeUrl(text);
    if (match) {
      e.preventDefault();
      onUrlChange(match.canonicalUrl);
      onParseUrl(match.canonicalUrl);
    }
  };

  const durationText = formatYouTubeDuration(parsedPreview?.durationSeconds);

  return (
    <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.04] dark:bg-rose-500/[0.07] space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <Youtube className="w-4 h-4 text-rose-500" />
          <span>Быстрый импорт YouTube видео</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          Вставьте ссылку — заголовок, описание и превью заполнятся сами
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="url"
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          onPaste={handleInputPaste}
          placeholder="https://www.youtube.com/watch?v=... или https://youtu.be/..."
          aria-label="Ссылка на YouTube видео"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121922] border border-rose-500/30 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
        />

        {typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.readText) && (
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            disabled={isParsing}
            title="Вставить ссылку из буфера обмена и распарсить"
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#17212b] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Из буфера</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => urlValue.trim() && onParseUrl(urlValue.trim())}
          disabled={isParsing || !urlValue.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Парсим...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Распарсить</span>
            </>
          )}
        </button>
      </div>

      {parseError && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {parsedPreview && !isParsing && (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/90 dark:bg-[#17212b] border border-slate-200/80 dark:border-white/10">
          {(parsedPreview.previewUrl || parsedPreview.thumbnailUrl) && (
            <img
              src={resolveMediaUrl(parsedPreview.previewUrl || parsedPreview.thumbnailUrl)}
              alt={parsedPreview.title || 'YouTube Preview'}
              onError={(e) => {
                const img = e.currentTarget;
                if (parsedPreview.thumbnailUrl && img.src !== parsedPreview.thumbnailUrl && !img.dataset.triedDirect) {
                  img.dataset.triedDirect = '1';
                  img.src = parsedPreview.thumbnailUrl;
                } else if (parsedPreview.videoId && !img.dataset.triedWsrv) {
                  img.dataset.triedWsrv = '1';
                  img.src = `https://wsrv.nl/?url=i.ytimg.com/vi/${parsedPreview.videoId}/hqdefault.jpg`;
                }
              }}
              className="w-24 h-14 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {parsedPreview.title ? 'Распознано и заполнено в форму' : 'Превью загружено (укажите заголовок вручную)'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {parsedPreview.title || parsedPreview.canonicalUrl}
            </p>
            <div className="flex items-center gap-2.5 text-[10px] text-slate-500 dark:text-slate-400">
              {parsedPreview.author && (
                <span className="inline-flex items-center gap-1 truncate">
                  <User className="w-3 h-3" />
                  <span>{parsedPreview.author}</span>
                </span>
              )}
              {durationText && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{durationText}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
