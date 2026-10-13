import React, { useState, useMemo } from 'react';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import { cleanNoteMarkdown, extractCleanSnippet } from '@lenta/shared';
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
} from 'lucide-react';

export interface FeedPostCardProps {
  item: UnifiedFeedItem;
  onOpenDetail?: (item: UnifiedFeedItem) => void;
  onSelectTag?: (tag: string) => void;
}

export const FeedPostCard = React.memo<FeedPostCardProps>(({
  item,
  onOpenDetail,
  onSelectTag,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formattedDate = new Date(item.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const summaryText = item.summary || (item.rawPayload as any)?.summary;

  const cleanedFullMarkdown = useMemo(() => {
    return cleanNoteMarkdown(item.description, { title: item.title });
  }, [item.description, item.title]);

  const cleanPreview = useMemo(() => {
    return extractCleanSnippet(item.description, 240, {
      summary: summaryText,
      title: item.title,
    });
  }, [item.description, summaryText, item.title]);

  const isLongText = cleanedFullMarkdown.length > 220;
  const displayText = isExpanded ? cleanedFullMarkdown : cleanPreview;
  const isHighResonance = typeof item.resonanceScore === 'number' && item.resonanceScore >= 80;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = item.sourceLink || window.location.href;
    const shareData = {
      title: item.title,
      text: item.title,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${item.title}\n${shareUrl}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  return (
    <article
      onClick={() => onOpenDetail?.(item)}
      className="rounded-2xl border bg-white dark:bg-[#17212b] border-slate-200 dark:border-white/[0.08] hover:border-[#2481cc]/50 dark:hover:border-[#3390ec]/50 shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.04)] hover:shadow-md p-4 sm:p-5 select-none cursor-pointer transition-all duration-200 animate-fade-in group max-w-full overflow-hidden"
    >
      {/* 1. Card Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-blue-500/10 via-sky-500/15 to-indigo-500/20 border border-slate-200 dark:border-white/10 flex items-center justify-center text-sm font-bold text-[#2481cc] dark:text-[#64b5f6]">
            {item.avatarIcon}
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs sm:text-[13px] text-slate-900 dark:text-white truncate">
                {item.channelTitle}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                @{item.channelHandle}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-[#8292a2]">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3 opacity-75 shrink-0" />
                <span>{formattedDate}</span>
              </span>
              {item.timeSlot && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 font-mono">
                  {item.timeSlot === 'MORNING' ? 'Утро' : item.timeSlot === 'AFTERNOON' ? 'День' : 'Вечер'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category badge */}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${item.category.colorClass}`}>
          {item.category.emoji} {item.category.label}
        </span>
      </div>

      {/* 2. Title */}
      <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug tracking-[-0.01em] mb-2 group-hover:text-[#2481cc] dark:group-hover:text-[#64b5f6] transition-colors break-words">
        {item.title}
      </h3>

      {/* 3. Markdown snippet body */}
      {item.description && (
        <div className="text-[13.5px] sm:text-[14px] text-slate-700 dark:text-slate-200 leading-relaxed mb-3 break-words">
          {isExpanded ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-slate-700 dark:text-slate-200" {...props} />,
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-slate-900 dark:text-white" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-[#2481cc] dark:text-[#64b5f6] hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-slate-700 dark:text-slate-200" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-slate-700 dark:text-slate-200" {...props} />,
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
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* 4. Footer: Metrics, Share, Tags */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#708499]">
        {/* Left: Resonance, Curator */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHighResonance && (
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold text-[10px] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300/70 dark:border-amber-800/40">
              <Flame className="w-3 h-3 fill-current" />
              <span>Резонанс {item.resonanceScore}%</span>
            </div>
          )}

          {item.curator && item.curator !== 'auto' && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <Sparkles className="w-3 h-3 text-[#2481cc]" />
              <span>{item.curator}</span>
            </div>
          )}

          {/* Hashtags */}
          {item.hashtags && item.hashtags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {item.hashtags.slice(0, 3).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(h);
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 transition-colors"
                >
                  #{h.replace(/^#/, '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions (Share, External Source Link) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Поделиться"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          {item.sourceLink && (
            <a
              href={item.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#2481cc] dark:hover:text-[#64b5f6] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Открыть источник"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
});
