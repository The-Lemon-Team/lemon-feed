import React, { useState } from 'react';
import { TelegramFeedPost } from '../api/telegramReaderApi';
import { TelegramMediaGallery } from './TelegramMediaGallery';
import {
  Clock,
  Eye,
  ExternalLink,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface TelegramPostCardProps {
  post: TelegramFeedPost;
  folderName?: string;
}

export const TelegramPostCard: React.FC<TelegramPostCardProps> = React.memo(({
  post,
  folderName,
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const postText = post.text || '';
  const isLongText = postText.length > 280;
  const displayText = isLongText && !isExpanded
    ? postText.slice(0, 260) + '...'
    : postText;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = post.postUrl;
    const shareData = {
      title: post.channelTitle,
      text: post.text?.slice(0, 100) || post.channelTitle,
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
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  return (
    <article className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#17212b] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 space-y-3 animate-fade-in overflow-hidden">
      {/* 1. Channel Header */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#2481cc] text-white flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-slate-200/80 dark:ring-white/10 shadow-xs">
            {post.channelAvatarUrl && !avatarError ? (
              <img
                src={post.channelAvatarUrl}
                alt={post.channelTitle}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{post.channelTitle ? post.channelTitle[0] : '✈️'}</span>
            )}
          </div>

          {/* Titles & Time */}
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs sm:text-[13px] text-slate-900 dark:text-white truncate">
                {post.channelTitle}
              </span>
              {post.channelUsername && (
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  @{post.channelUsername}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 opacity-60 shrink-0" />
              <span>{formattedDate}</span>
            </span>
          </div>
        </div>

        {/* Right Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {post.isUnread && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#2481cc] text-white shadow-xs">
              Новое
            </span>
          )}
          {folderName && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-200/70 dark:border-blue-900/60 text-[#2481cc] dark:text-[#64b5f6] bg-blue-50/50 dark:bg-blue-950/20">
              {folderName}
            </span>
          )}
        </div>
      </div>

      {/* 2. Media Gallery (Photos, Albums, Videos, Audio, Documents) */}
      {post.media && post.media.length > 0 && (
        <TelegramMediaGallery
          media={post.media}
          mediaType={post.mediaType}
          postUrl={post.postUrl}
        />
      )}

      {/* 3. Text Content */}
      {postText && (
        <div className="text-[13px] sm:text-sm text-slate-700 dark:text-[#c4d1de] whitespace-pre-wrap leading-relaxed break-words">
          <p>{displayText}</p>
          {isLongText && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-[#2481cc] dark:text-[#64b5f6] hover:underline cursor-pointer"
            >
              <span>{isExpanded ? 'Свернуть' : 'Читать далее'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}

      {/* 4. Footer Link, Views & Share */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-400 dark:text-[#708499]">
        <span className="flex items-center gap-1 text-[11px]">
          <Eye className="w-3 h-3 opacity-70" />
          <span>{post.views || 0} просмотров</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
            title="Поделиться ссылкой"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={post.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-slate-400 hover:text-[#2481cc] dark:hover:text-[#64b5f6] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-mono text-[11px]"
            title="Открыть в Telegram"
          >
            <span>t.me</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
});
