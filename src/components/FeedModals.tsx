import React, { Suspense, lazy } from 'react';
import { UnifiedFeedItem, UnifiedFeedTab } from '../adapters/feeds';
import { FeedModeOption } from './FeedToolbar';
import { FeedAppRuntimeMode } from '../utils/appMode';

const FeedDetailModal = lazy(() => import('./FeedDetailModal').then((m) => ({ default: m.FeedDetailModal })));
const FeedCreateNoteModal = lazy(() => import('./FeedCreateNoteModal').then((m) => ({ default: m.FeedCreateNoteModal })));
const FeedEditNoteModal = lazy(() => import('./FeedEditNoteModal').then((m) => ({ default: m.FeedEditNoteModal })));
const FeedAiCoverModal = lazy(() => import('./FeedAiCoverModal').then((m) => ({ default: m.FeedAiCoverModal })));
const LemonSeasonsModal = lazy(() => import('./LemonSeasonsModal').then((m) => ({ default: m.LemonSeasonsModal })));
const FeedEntityModal = lazy(() => import('./FeedEntityModal').then((m) => ({ default: m.FeedEntityModal })));
const FeedSourceTabModal = lazy(() => import('./FeedSourceTabModal').then((m) => ({ default: m.FeedSourceTabModal })));

export interface FeedModalsProps {
  // Detail Modal
  selectedDetailItem: UnifiedFeedItem | null;
  onCloseDetail: () => void;
  onSelectTag: (tag: string) => void;
  onOpenNoteById?: (noteId: string) => void;
  // Edit Note Modal
  editingItem: UnifiedFeedItem | null;
  onOpenEdit: (item: UnifiedFeedItem) => void;
  onCloseEdit: () => void;
  // Create Note Modal
  isCreateNoteOpen: boolean;
  onCloseCreateNote: () => void;
  selectedFeedSlug?: string;
  defaultDate: string;
  appMode: FeedAppRuntimeMode;
  isPublicMode: boolean;
  // AI Cover Modal
  aiCoverItem: UnifiedFeedItem | null;
  aiCoverTemplateId?: string;
  onOpenAiCover: (item: UnifiedFeedItem, templateId?: string) => void;
  onCloseAiCover: () => void;
  onAiCoverApplied: (newCoverUrl: string) => void;
  // Lemon Seasons Modal
  isLemonSeasonsModalOpen: boolean;
  onCloseLemonSeasons: () => void;
  // Feed Entity Modal
  editingFeedTab: UnifiedFeedTab | null;
  editingDbFeed: any | null;
  isFeedEntityModalOpen: boolean;
  onCloseFeedEntityModal: () => void;
  // Source Tab Modal
  editingSourceTab: FeedModeOption | null;
  isSourceTabModalOpen: boolean;
  onCloseSourceTabModal: () => void;
  onSaveSourceTab: (tab: FeedModeOption) => void;
  onDeleteSourceTab: (tabId: string) => void;
  allAvailableFeeds: any[];
  allAvailableHashtags: { name: string; count: number }[];
  // Refetch
  onRefetch: () => void;
}

export const FeedModals: React.FC<FeedModalsProps> = ({
  selectedDetailItem,
  onCloseDetail,
  onSelectTag,
  onOpenNoteById,
  editingItem,
  onOpenEdit,
  onCloseEdit,
  isCreateNoteOpen,
  onCloseCreateNote,
  selectedFeedSlug,
  defaultDate,
  appMode,
  isPublicMode,
  aiCoverItem,
  aiCoverTemplateId,
  onOpenAiCover,
  onCloseAiCover,
  onAiCoverApplied,
  isLemonSeasonsModalOpen,
  onCloseLemonSeasons,
  editingFeedTab,
  editingDbFeed,
  isFeedEntityModalOpen,
  onCloseFeedEntityModal,
  editingSourceTab,
  isSourceTabModalOpen,
  onCloseSourceTabModal,
  onSaveSourceTab,
  onDeleteSourceTab,
  allAvailableFeeds,
  allAvailableHashtags,
  onRefetch,
}) => {
  const isPublicOnly = isPublicMode || appMode === 'public';

  return (
    <Suspense fallback={null}>
      {selectedDetailItem && (
        <FeedDetailModal
          item={selectedDetailItem}
          onClose={onCloseDetail}
          disableEscClose={Boolean(aiCoverItem || editingItem)}
          onSelectTag={onSelectTag}
          onOpenNoteById={onOpenNoteById}
          onEditNote={
            !isPublicOnly
              ? (item) => {
                  onCloseDetail();
                  onOpenEdit(item);
                }
              : undefined
          }
          onAiCover={
            !isPublicOnly
              ? (item) => {
                  onOpenAiCover(item);
                }
              : undefined
          }
        />
      )}

      {editingItem && (
        <FeedEditNoteModal
          item={editingItem}
          onClose={onCloseEdit}
          disableEscClose={Boolean(aiCoverItem)}
          onOpenAiCover={(item, templateId) => onOpenAiCover(item, templateId)}
          onSaved={onRefetch}
        />
      )}

      {isCreateNoteOpen && (
        <FeedCreateNoteModal
          isOpen={isCreateNoteOpen}
          onClose={onCloseCreateNote}
          defaultFeedSlug={selectedFeedSlug}
          defaultDate={defaultDate}
          appMode={appMode}
          onCreated={onRefetch}
        />
      )}

      {aiCoverItem && (
        <FeedAiCoverModal
          item={aiCoverItem}
          initialTemplateId={aiCoverTemplateId}
          onClose={onCloseAiCover}
          onCoverApplied={onAiCoverApplied}
        />
      )}

      {isLemonSeasonsModalOpen && (
        <LemonSeasonsModal
          isOpen={isLemonSeasonsModalOpen}
          onClose={onCloseLemonSeasons}
        />
      )}

      {isFeedEntityModalOpen && (
        <FeedEntityModal
          feedTab={editingFeedTab}
          feedData={editingDbFeed}
          isOpen={isFeedEntityModalOpen}
          onClose={onCloseFeedEntityModal}
          onSaved={onRefetch}
        />
      )}

      {isSourceTabModalOpen && (
        <FeedSourceTabModal
          tab={editingSourceTab}
          isOpen={isSourceTabModalOpen}
          onClose={onCloseSourceTabModal}
          onSave={onSaveSourceTab}
          onDelete={onDeleteSourceTab}
          allFeeds={allAvailableFeeds}
          availableHashtags={allAvailableHashtags}
        />
      )}
    </Suspense>
  );
};
