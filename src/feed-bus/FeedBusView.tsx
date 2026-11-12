import React from 'react';
import { useFeedBusState } from './hooks/useFeedBusState';
import { FeedBusHeader } from './components/FeedBusHeader';
import { FeedBusSidebar } from './components/FeedBusSidebar';
import { FeedBusCard } from './components/FeedBusCard';
import { FeedBusRejectModal } from './components/FeedBusRejectModal';
import { FeedBusEditModal } from './components/FeedBusEditModal';
import { FeedBusBatchBar } from './components/FeedBusBatchBar';
import { Inbox, Loader2, Sparkles } from 'lucide-react';

interface FeedBusViewProps {
  onExitFeedBus: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const FeedBusView: React.FC<FeedBusViewProps> = ({
  onExitFeedBus,
  isDarkMode,
  toggleTheme,
}) => {
  const {
    items,
    total,
    stats,
    isLoading,
    hasMore,
    loadMore,
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedIds,
    toggleSelectId,
    selectAll,
    clearSelection,
    rejectingItem,
    setRejectingItem,
    editingItem,
    setEditingItem,
    handleApprove,
    handleReject,
    handleUpdate,
    handleBatchApprove,
    handleBatchReject,
    handleImportWatchers,
    refresh,
  } = useFeedBusState();

  const handleEditAndApprove = async (id: string, patch: any) => {
    await handleUpdate(id, patch);
    await handleApprove(id, patch);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* 1. Header with Stats, Search and Profile Exit */}
      <FeedBusHeader
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refresh}
        onImportWatchers={() => handleImportWatchers(50)}
        onExitFeedBus={onExitFeedBus}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isLoading={isLoading}
      />

      {/* 2. Main Workspace Layout: Sidebar + Card Stream */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* Left: Category & Status Sidebar */}
        <FeedBusSidebar
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          pendingCount={stats?.pendingCount}
        />

        {/* Center: Cards Feed Stream */}
        <main className="flex-1 min-w-0 space-y-3.5 pb-20">
          {/* Active section indicator */}
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium px-1">
            <div className="flex items-center gap-1.5">
              <span>Показано:</span>
              <span className="font-bold text-on-surface">{items.length}</span>
              <span>из</span>
              <span className="font-bold text-on-surface">{total}</span>
              <span>заметок</span>
            </div>

            {selectedStatus === 'PENDING' && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Одобрение отправляет заметку в боевой Postgres
              </span>
            )}
          </div>

          {/* Loading initial spinner */}
          {isLoading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3 text-outline">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Загрузка очереди модерации из Lemon-Bus...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center space-y-3 bg-surface-container/30">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-on-surface">
                {selectedStatus === 'PENDING'
                  ? 'Очередь модерации пуста'
                  : 'Заметок в этом разделе не найдено'}
              </h3>
              <p className="text-xs text-outline max-w-sm mx-auto">
                {selectedStatus === 'PENDING'
                  ? 'Все входящие новости от вотчеров уже проверены, либо новые публикации ещё не поступили в шину.'
                  : 'Попробуйте изменить категорию или фильтры статуса.'}
              </p>
              {selectedStatus === 'PENDING' && (
                <button
                  onClick={() => handleImportWatchers(50)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs hover:shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Импортировать 50 новостей вотчеров</span>
                </button>
              )}
            </div>
          ) : (
            /* Cards List */
            items.map((item) => (
              <FeedBusCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelectId}
                onApprove={handleApprove}
                onReject={setRejectingItem}
                onEdit={setEditingItem}
              />
            ))
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-6 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-variant text-xs font-semibold text-on-surface border border-outline-variant/30 transition-all shadow-xs"
              >
                {isLoading ? 'Загрузка...' : 'Загрузить ещё'}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 3. Floating Batch Action Bar */}
      <FeedBusBatchBar
        selectedCount={selectedIds.size}
        totalCount={items.length}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBatchApprove={handleBatchApprove}
        onBatchReject={() => handleBatchReject('Массовое отклонение модератором')}
      />

      {/* 4. Reject Modal */}
      <FeedBusRejectModal
        item={rejectingItem}
        onClose={() => setRejectingItem(null)}
        onConfirm={handleReject}
      />

      {/* 5. Edit Modal */}
      <FeedBusEditModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdate}
        onSaveAndApprove={handleEditAndApprove}
      />
    </div>
  );
};
