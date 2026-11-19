import React, { useState, useMemo, useCallback } from 'react';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import { FeedAppRuntimeMode } from '../utils/appMode';
import { StagingCardModerationBar } from './StagingCardModerationBar';
import { resolveMediaUrl } from '../api/client';
import { cleanNoteMarkdown, extractCleanSnippet } from '@lenta/shared';
import { PeriodItem } from '../utils/periods';
// Workspaces UI temporarily disabled on UI — kept intact for upcoming redesign
// import { NotePinButton } from './workspace/NotePinButton';
import { NoteMediaPlayer } from './media/NoteMediaPlayer';
import {
import {
  extractNoteMediaTracks,
  stripExtractedMediaFromMarkdown,
  isMediaUrl,
} from '../utils/noteMedia';
import { Sparkles, Folder, Edit3, Users } from 'lucide-react';
import { FeedNoteDeleteButton } from './FeedNoteDeleteButton';
import {
  CoreFeedCard,
  FeedCardSlots,
  FeedEntry,
  NoteFeedEntryMeta,
  unifiedItemToFeedEntry,
} from '../core';

export interface FeedPostCardProps {
  item: UnifiedFeedItem;
  onOpenDetail?: (item: UnifiedFeedItem) => void;
  onSelectTag?: (tag: string) => void;
  onEditNote?: (item: UnifiedFeedItem) => void;
  onDeleteNote?: (item: UnifiedFeedItem) => void;
  onAiCover?: (item: UnifiedFeedItem) => void;
  appMode?: FeedAppRuntimeMode;
  onApprovePublish?: (item: UnifiedFeedItem) => void;
  onUnpublishToStaging?: (item: UnifiedFeedItem) => void;
  onReturnToPrivate?: (item: UnifiedFeedItem) => void;
  isMutating?: boolean;
  allPeriods?: PeriodItem[];
  selectedPeriodId?: string;
  onSelectPeriod?: (periodId: string) => void;
}

export const FeedPostCard = React.memo<FeedPostCardProps>(({
  item,
  onOpenDetail,
  onSelectTag,
  onEditNote,
  onDeleteNote,
  onAiCover,
  appMode = 'staging',
  onApprovePublish,
  onUnpublishToStaging,
  onReturnToPrivate,
  isMutating,
}) => {
  const [requestedTrackUrl, setRequestedTrackUrl] = useState<string | null>(null);

  const mediaTracks = useMemo(() => extractNoteMediaTracks(item), [item]);
  const markdownWithoutMediaLinks = useMemo(
    () => stripExtractedMediaFromMarkdown(item.description, mediaTracks),
    [item.description, mediaTracks]
  );

  const entry = useMemo<FeedEntry<NoteFeedEntryMeta>>(() => {
    const base = unifiedItemToFeedEntry(item, appMode);
    return {
      ...base,
      bodyMarkdown: markdownWithoutMediaLinks,
    };
  }, [item, appMode, markdownWithoutMediaLinks]);

  const formatSnippet = useCallback(
    (md: string, currentEntry: FeedEntry<NoteFeedEntryMeta>) =>
      extractCleanSnippet(md, 240, {
        summary: currentEntry.excerpt,
        title: currentEntry.title,
      }),
    []
  );

  const formatMarkdown = useCallback(
    (md: string, currentEntry: FeedEntry<NoteFeedEntryMeta>) =>
      cleanNoteMarkdown(md, { title: currentEntry.title }),
    []
  );

  const handleMarkdownLinkClick = useCallback((href: string) => {
    if (isMediaUrl(href)) {
      setRequestedTrackUrl(href);
      return true;
    }
    return false;
  }, []);

  const slots = useMemo<FeedCardSlots<FeedEntry<NoteFeedEntryMeta>>>(
    () => ({
      renderTopBar: () =>
        appMode === 'staging' ? (
          <StagingCardModerationBar
            item={item}
            onApprovePublish={onApprovePublish}
            onUnpublishToStaging={onUnpublishToStaging}
            onReturnToPrivate={onReturnToPrivate}
            isMutating={isMutating}
          />
        ) : null,

      /* Workspaces UI temporarily disabled on UI — kept intact for upcoming redesign
      renderHeaderActions: () => <NotePinButton noteId={item.id} />,
      */

      renderBodyExtras: () =>
        mediaTracks.length > 0 || item.feedSlug === 'notebooklm-ai' ? (
          <NoteMediaPlayer
            item={item}
            tracks={mediaTracks}
            variant="card"
            requestedTrackUrl={requestedTrackUrl}
          />
        ) : null,

      renderFooterLeft: (currentEntry) => {
        const folderPath = currentEntry.meta?.folderPath;
        const isShared = Array.isArray((item.rawPayload as any)?.shares) && (item.rawPayload as any).shares.length > 0;
        if ((appMode !== 'staging' || !folderPath) && !isShared) return null;
        return (
          <div className="flex items-center gap-1.5">
            {isShared && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                <Users className="w-2.5 h-2.5" />
                <span>Shared</span>
              </span>
            )}
            {appMode === 'staging' && folderPath && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-white/5">
                <Folder className="w-3 h-3 text-[#2481cc]" />
                <span>{folderPath}</span>
              </span>
            )}
          </div>
        );
      },

      renderFooterActions: () => (
        <>
          {onAiCover && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAiCover(item);
              }}
              className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
              title="Создать обложку (AI)"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {onEditNote && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditNote(item);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#2481cc] dark:hover:text-[#64b5f6] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Редактировать запись"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDeleteNote && (
            <FeedNoteDeleteButton
              noteId={item.id}
              noteTitle={item.title}
              variant="icon"
              confirmPlacement="top"
              onDeleted={() => onDeleteNote(item)}
            />
          )}
        </>
      ),
    }),
    [
      appMode,
      item,
      onApprovePublish,
      onUnpublishToStaging,
      onReturnToPrivate,
      isMutating,
      mediaTracks,
      requestedTrackUrl,
      onAiCover,
      onEditNote,
      onDeleteNote,
    ]
  );

  return (
    <CoreFeedCard
      entry={entry}
      slots={slots}
      onOpenDetail={onOpenDetail ? () => onOpenDetail(item) : undefined}
      onSelectTag={onSelectTag}
      resolveImageUrl={resolveMediaUrl}
      formatSnippet={formatSnippet}
      formatMarkdown={formatMarkdown}
      onMarkdownLinkClick={handleMarkdownLinkClick}
    />
  );
});
