import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Clock,
  Flame,
  ExternalLink,
  Share2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';
import { FeedBadgeTone, FeedCardSlots, FeedEntry } from '../types';
import { SymbolIcon } from '../../components/common/SymbolIcon';

const BADGE_TONE_CLASSES: Record<FeedBadgeTone, string> = {
  neutral:
    'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-white/10',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  success:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  warning:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  purple:
    'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  amber:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300/70 dark:border-amber-800/40',
};

function defaultSnippet(text: string, maxLen = 240): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen - 1).trimEnd()}…`;
}

export interface CoreFeedCardProps<TEntry extends FeedEntry<any> = FeedEntry> {
  entry: TEntry;
  slots?: FeedCardSlots<TEntry>;
  onOpenDetail?: (entry: TEntry) => void;
  onSelectTag?: (tag: string) => void;
  resolveImageUrl?: (url: string) => string;
  formatSnippet?: (markdown: string, entry: TEntry) => string;
  formatMarkdown?: (markdown: string, entry: TEntry) => string;
  onMarkdownLinkClick?: (href: string, e: React.MouseEvent) => boolean | void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  hideShareButton?: boolean;
}

function CoreFeedCardInner<TEntry extends FeedEntry<any> = FeedEntry>({
  entry,
  slots,
  onOpenDetail,
  onSelectTag,
  resolveImageUrl = (u) => u,
  formatSnippet,
  formatMarkdown,
  onMarkdownLinkClick,
  selectable = false,
  isSelected = false,
  onToggleSelect,
  hideShareButton = false,
}: CoreFeedCardProps<TEntry>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const coverUrl =
    entry.coverUrl ||
    entry.images?.find((img) => img.isMain)?.url ||
    entry.images?.[0]?.url ||
    null;

  useEffect(() => {
    setImageError(false);
  }, [coverUrl]);

  const formattedDate = useMemo(() => {
    return new Date(entry.publishedAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [entry.publishedAt]);

  const isUpdated = Boolean(
    entry.updatedAt &&
      entry.publishedAt &&
      Math.abs(new Date(entry.updatedAt).getTime() - new Date(entry.publishedAt).getTime()) >
        60000
  );

  const rawText = entry.bodyMarkdown || entry.excerpt || '';

  const cleanPreview = useMemo(() => {
    if (formatSnippet) return formatSnippet(rawText, entry);
    return entry.excerpt?.trim() || defaultSnippet(rawText, 240);
  }, [formatSnippet, rawText, entry]);

  const isLongText = useMemo(() => {
    if (!rawText || rawText.length <= 220) return false;
    if (rawText.length > 450) return true;
    const cleaned = formatMarkdown ? formatMarkdown(rawText, entry) : rawText;
    return cleaned.length > 220;
  }, [rawText, formatMarkdown, entry]);

  const cleanedFullMarkdown = useMemo(() => {
    if (!isExpanded) return '';
    return formatMarkdown ? formatMarkdown(rawText, entry) : rawText;
  }, [isExpanded, rawText, formatMarkdown, entry]);

  const isHighResonance = typeof entry.score === 'number' && entry.score >= 80;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = entry.url || window.location.href;
    const shareData = { title: entry.title, text: entry.title, url: shareUrl };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${entry.title}\n${shareUrl}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  return (
    <article
      onClick={() => onOpenDetail?.(entry)}
      className={`relative rounded-2xl border bg-white dark:bg-[#17212b] shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.04)] hover:shadow-md p-4 sm:p-5 select-none cursor-pointer transition-[border-color,box-shadow] duration-150 animate-fade-in group max-w-full z-0 ${
        isSelected
          ? 'border-[#2481cc] ring-2 ring-[#2481cc]/25 dark:border-[#3390ec]'
          : 'border-slate-200 dark:border-white/[0.08] hover:border-[#2481cc]/50 dark:hover:border-[#3390ec]/50'
      }`}
    >
      {/* Optional scenario top bar (e.g. staging moderation or watchers status) */}
      {slots?.renderTopBar?.(entry)}

      {/* 1. Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {selectable && onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(entry.id)}
              className="w-4 h-4 rounded accent-[#2481cc] border-slate-300 dark:border-white/20 text-[#2481cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2481cc]/50 cursor-pointer shrink-0"
              aria-label={`Выбрать ${entry.title}`}
            />
          )}

          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-blue-500/10 via-sky-500/15 to-indigo-500/20 border border-slate-200 dark:border-white/10 flex items-center justify-center text-sm font-bold text-[#2481cc] dark:text-[#64b5f6] overflow-hidden">
            {entry.source.avatarUrl ? (
              <img
                src={resolveImageUrl(entry.source.avatarUrl)}
                alt={entry.source.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <SymbolIcon
                icon={entry.source.avatarIcon || '✨'}
                fallback="✨"
                className="text-base"
              />
            )}
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs sm:text-[13px] text-slate-900 dark:text-white truncate">
                {entry.source.title}
              </span>
              {entry.source.handle && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  @{entry.source.handle.replace(/^@+/, '')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-[#8292a2] flex-wrap">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3 opacity-75 shrink-0" />
                <span>{formattedDate}</span>
              </span>
              {isUpdated && (
                <span
                  className="text-[10px] text-slate-400 dark:text-slate-500 font-mono"
                  title={`Обновлено: ${new Date(entry.updatedAt!).toLocaleString('ru-RU')}`}
                >
                  (ред.)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category badge, generic entry badges, scenario header actions & external link */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {entry.category.label.trim().toLowerCase() !== 'private' &&
            entry.category.label.trim().toLowerCase() !== 'public' && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${entry.category.colorClass}`}
              >
                {entry.category.emoji} {entry.category.label}
              </span>
            )}

          {entry.badges?.map((badge) => (
            <span
              key={badge.id}
              data-testid={badge.testId}
              title={badge.title}
              className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full border inline-flex items-center gap-1 shrink-0 ${
                BADGE_TONE_CLASSES[badge.tone || 'neutral']
              }`}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </span>
          ))}

          {slots?.renderHeaderBadges?.(entry)}
          {slots?.renderHeaderActions?.(entry)}

          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
              title="Открыть источник"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* 2. Title */}
      <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug tracking-[-0.01em] mb-2 group-hover:text-[#2481cc] dark:group-hover:text-[#64b5f6] transition-colors break-words">
        {entry.title}
      </h3>

      {/* 2.5 Cover image banner */}
      {coverUrl && !imageError && (
        <div className="relative w-full h-52 sm:h-64 overflow-hidden rounded-xl mb-3 bg-slate-900/40 dark:bg-black/60 border border-slate-200/60 dark:border-white/10 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-125 opacity-35 dark:opacity-45 pointer-events-none"
            style={{ backgroundImage: `url("${resolveImageUrl(coverUrl)}")` }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-black/15 dark:bg-black/35 pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={resolveImageUrl(coverUrl)}
            alt={entry.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain drop-shadow-md group-hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      )}

      {/* 3. Markdown / Teaser Body */}
      {rawText && (
        <div className="text-[13.5px] sm:text-[14px] text-slate-700 dark:text-slate-200 leading-relaxed mb-3 break-words">
          {isExpanded ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p className="mb-2 last:mb-0 text-slate-700 dark:text-slate-200" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-slate-900 dark:text-white" {...props} />
                ),
                a: ({ node, href, ...props }) => (
                  <a
                    href={href}
                    className="text-[#2481cc] dark:text-[#64b5f6] hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (href && onMarkdownLinkClick?.(href, e)) {
                        e.preventDefault();
                      }
                    }}
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc pl-4 mb-2 space-y-1 text-slate-700 dark:text-slate-200"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="list-decimal pl-4 mb-2 space-y-1 text-slate-700 dark:text-slate-200"
                    {...props}
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-2 border-[#2481cc]/40 pl-3 my-2 text-slate-600 dark:text-slate-300 italic text-[12.5px]"
                    {...props}
                  />
                ),
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[11.5px] text-slate-800 dark:text-slate-200 font-medium"
                      {...props}
                    />
                  ) : (
                    <code
                      className="block p-2 rounded-lg bg-slate-100 dark:bg-black/30 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto my-1 border border-slate-200/50 dark:border-white/10"
                      {...props}
                    />
                  ),
              }}
            >
              {cleanedFullMarkdown}
            </ReactMarkdown>
          ) : (
            <p className="line-clamp-4 leading-relaxed text-slate-700 dark:text-slate-200">
              {cleanPreview}
            </p>
          )}

          {isLongText && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-[#2481cc] dark:text-[#64b5f6] hover:underline"
            >
              <span>{isExpanded ? 'Свернуть' : 'Читать далее'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Optional scenario body extras (e.g. audio player in Notes) */}
      {slots?.renderBodyExtras?.(entry)}

      {/* 4. Footer */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#708499] flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isHighResonance && (
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold text-[10px] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300/70 dark:border-amber-800/40">
              <Flame className="w-3 h-3 fill-current" />
              <span>Резонанс {entry.score}%</span>
            </div>
          )}

          {entry.author && entry.author !== 'auto' && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <Sparkles className="w-3 h-3 text-[#2481cc]" />
              <span>{entry.author}</span>
            </div>
          )}

          {slots?.renderFooterLeft?.(entry)}

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {entry.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 transition-colors"
                >
                  #{tag.replace(/^#/, '')}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {slots?.renderFooterActions?.(entry)}

          {!hideShareButton && (
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Поделиться"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {onOpenDetail && (
            <span className="hidden sm:inline-flex text-[11px] font-semibold text-[#2481cc] dark:text-[#64b5f6] opacity-0 group-hover:opacity-100 transition-opacity items-center gap-0.5">
              <span>Читать</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export const CoreFeedCard = React.memo(CoreFeedCardInner) as typeof CoreFeedCardInner;
