import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import { resolveMediaUrl } from '../api/client';
import { cleanNoteMarkdown } from '@lenta/shared';
import { Sparkles, Edit3, ArrowRight, CornerDownRight } from 'lucide-react';
import { FeedNoteDeleteButton } from './FeedNoteDeleteButton';
import { NoteMediaPlayer } from './media/NoteMediaPlayer';
import { FeedDetailRelatedNotes } from './detail/FeedDetailRelatedNotes';
import {
  extractNoteMediaTracks,
  stripExtractedMediaFromMarkdown,
  isMediaUrl,
} from '../utils/noteMedia';
import {
  CoreFeedDetailModal,
  FeedDetailSlots,
  FeedEntry,
  NoteFeedEntryMeta,
  unifiedItemToFeedEntry,
} from '../core';

export interface FeedDetailModalProps {
  item: UnifiedFeedItem | null;
  onClose: () => void;
  onSelectTag?: (tag: string) => void;
  onEditNote?: (item: UnifiedFeedItem) => void;
  onAiCover?: (item: UnifiedFeedItem) => void;
  onDeleteNote?: (item: UnifiedFeedItem) => void;
  onOpenNoteById?: (noteId: string) => void;
  disableEscClose?: boolean;
}

export const FeedDetailModal: React.FC<FeedDetailModalProps> = ({
  item,
  onClose,
  onSelectTag,
  onEditNote,
  onAiCover,
  onDeleteNote,
  onOpenNoteById,
  disableEscClose = false,
}) => {
  const [direction, setDirection] = useState<'forward' | 'backward' | 'none'>('none');
  const [requestedTrackUrl, setRequestedTrackUrl] = useState<string | null>(null);

  useEffect(() => {
    setRequestedTrackUrl(null);
  }, [item?.id]);

  const entry = useMemo<FeedEntry<NoteFeedEntryMeta> | null>(() => {
    if (!item) return null;
    const mediaTracks = extractNoteMediaTracks(item);
    const stripped = stripExtractedMediaFromMarkdown(item.description, mediaTracks);
    const mapped = unifiedItemToFeedEntry(item);
    return {
      ...mapped,
      bodyMarkdown: stripped,
    };
  }, [item]);

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

  const slots = useMemo<FeedDetailSlots<FeedEntry<NoteFeedEntryMeta>>>(
    () => ({
      renderBreadcrumb: (currentEntry) => {
        const raw = currentEntry.meta?.unifiedItem?.rawPayload;
        const related = raw?.metadata?.relatedNotes;
        let parentMilestone: any = null;
        if (Array.isArray(related)) {
          parentMilestone = related.find((r: any) => r.isParent && r.resolved && r.targetNoteId);
        } else if (raw?.parentNoteId) {
          parentMilestone = {
            targetNoteId: raw.parentNoteId,
            targetTitle: 'Родительский дайджест',
            isParent: true,
          };
        }
        if (!parentMilestone) return null;

        return (
          <div className="px-4 py-2 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent dark:from-violet-500/15 dark:via-indigo-500/10 border-b border-violet-500/20 flex items-center justify-between text-xs select-none shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <CornerDownRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 font-bold shrink-0">
                Входит в сюжет:
              </span>
              <button
                type="button"
                onClick={() => {
                  setDirection('backward');
                  onOpenNoteById?.(parentMilestone.targetNoteId);
                }}
                className="font-semibold text-slate-800 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-300 truncate underline decoration-violet-500/30 hover:decoration-violet-500 transition-colors cursor-pointer text-left"
                title="Перейти к родительской заметке"
              >
                {parentMilestone.targetTitle || parentMilestone.cleanTitle}
              </button>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0 ml-2" />
          </div>
        );
      },

      renderBodyExtras: (currentEntry) => {
        const unified = currentEntry.meta?.unifiedItem;
        if (!unified) return null;
        return (
          <NoteMediaPlayer
            item={unified}
            variant="modal"
            requestedTrackUrl={requestedTrackUrl}
          />
        );
      },

      renderAfterMarkdown: (currentEntry) => {
        const related = currentEntry.meta?.unifiedItem?.rawPayload?.metadata?.relatedNotes;
        return (
          <FeedDetailRelatedNotes
            relatedNotes={related}
            onNavigateRelated={(targetNoteId) => {
              if (onOpenNoteById) {
                setDirection('forward');
                onOpenNoteById(targetNoteId);
              }
            }}
          />
        );
      },

      renderFooterLeft: (currentEntry) => {
        const unified = currentEntry.meta?.unifiedItem;
        if (!unified) return null;
        return (
          <>
            {onAiCover && (
              <button
                type="button"
                onClick={() => onAiCover(unified)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Обложка</span>
              </button>
            )}

            {onEditNote && (
              <button
                type="button"
                onClick={() => onEditNote(unified)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Редактировать</span>
              </button>
            )}

            {onDeleteNote && (
              <FeedNoteDeleteButton
                noteId={unified.id}
                noteTitle={unified.title}
                variant="button"
                confirmPlacement="top"
                onDeleted={() => {
                  onClose();
                  onDeleteNote(unified);
                }}
              />
            )}
          </>
        );
      },
    }),
    [onOpenNoteById, requestedTrackUrl, onAiCover, onEditNote, onDeleteNote, onClose]
  );

  return (
    <CoreFeedDetailModal
      entry={entry}
      onClose={onClose}
      slots={slots}
      onSelectTag={onSelectTag}
      onNavigateHistoryBack={(target) => {
        setDirection('backward');
        onOpenNoteById?.(target.id);
      }}
      resolveImageUrl={resolveMediaUrl}
      formatMarkdown={formatMarkdown}
      onMarkdownLinkClick={handleMarkdownLinkClick}
      disableEscClose={disableEscClose}
      externalDirection={direction}
    />
  );
};
