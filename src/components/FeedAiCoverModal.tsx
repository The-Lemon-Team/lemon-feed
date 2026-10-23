import React, { useState, useEffect, useMemo } from 'react';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import {
  useGenerateNoteCover,
  useGenerateAiBatch,
  useAttachCoverToNote,
} from '../api/queries';
import { resolveMediaUrl, AiMediaAsset } from '../api/client';
import {
  X,
  Sparkles,
  Wand2,
  Check,
  RefreshCw,
  Layers,
} from 'lucide-react';
import {
  FeedCoverAspectRatio,
  FEED_ASPECT_RATIOS,
} from './cover-studio/feedCoverStudio.constants';
import {
  buildFeedTemplatePrompt,
  detectFeedItStyleRecommendation,
} from './cover-studio/feedCoverStudio.utils';
import { FeedCoverStudioItControls } from './cover-studio/FeedCoverStudioItControls';

export interface FeedAiCoverModalProps {
  item: UnifiedFeedItem | null;
  initialTemplateId?: string;
  onClose: () => void;
  onCoverApplied?: (imageUrl: string) => void;
}

export const FeedAiCoverModal: React.FC<FeedAiCoverModalProps> = ({
  item,
  initialTemplateId,
  onClose,
  onCoverApplied,
}) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('ai-neural');
  const [aspectRatio, setAspectRatio] = useState<FeedCoverAspectRatio>('16:9');
  const [batchCount, setBatchCount] = useState<2 | 4>(2);
  const [candidates, setCandidates] = useState<AiMediaAsset[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const generateCoverMutation = useGenerateNoteCover();
  const generateBatchMutation = useGenerateAiBatch();
  const attachCoverMutation = useAttachCoverToNote();

  const recommendation = useMemo(
    () =>
      item
        ? detectFeedItStyleRecommendation(
            item.title,
            item.description,
            item.hashtags,
            item.feedSlug,
          )
        : null,
    [item],
  );

  useEffect(() => {
    if (item) {
      setCandidates([]);
      setStatusMessage(null);

      if (initialTemplateId) {
        const built = buildFeedTemplatePrompt(initialTemplateId, item.title);
        if (built) {
          setPrompt(built.prompt);
          setStyle(built.styleId);
          setAspectRatio(built.aspectRatio);
          return;
        }
      }

      setPrompt(item.title);
      if (recommendation) {
        setStyle(recommendation.styleId);
        setAspectRatio(recommendation.aspectRatio);
      } else {
        setStyle('ai-neural');
        setAspectRatio('16:9');
      }
    }
  }, [item, initialTemplateId, recommendation]);

  if (!item) return null;

  const isGenerating =
    generateCoverMutation.isPending ||
    generateBatchMutation.isPending ||
    attachCoverMutation.isPending;

  const handleQuickGenerate = async () => {
    if (!prompt.trim()) {
      setStatusMessage({ text: 'Укажите тему или промпт для генерации', type: 'error' });
      return;
    }
    setStatusMessage({
      text: `Нейросеть Flux / Imagen генерирует IT-обложку в стиле «${style}» (10–20 сек)...`,
      type: 'info',
    });

    try {
      const res = await generateCoverMutation.mutateAsync({
        noteId: item.id,
        data: {
          style,
          aspectRatio,
          customPrompt: prompt.trim(),
          setAsMain: true,
        },
      });

      const coverUrl = res.image?.url || res.meta?.url;
      setStatusMessage({ text: 'Обложка успешно создана и установлена!', type: 'success' });
      if (coverUrl && onCoverApplied) {
        onCoverApplied(coverUrl);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ошибка генерации обложки';
      setStatusMessage({ text: String(msg), type: 'error' });
    }
  };

  const handleBatchGenerate = async () => {
    if (!prompt.trim()) {
      setStatusMessage({ text: 'Укажите тему для генерации', type: 'error' });
      return;
    }
    setStatusMessage({
      text: `Генерация ${batchCount} вариантов в стиле «${style}» (15–25 сек)...`,
      type: 'info',
    });

    try {
      const res = await generateBatchMutation.mutateAsync({
        prompt: prompt.trim(),
        style,
        aspectRatio,
        context: item.description ? item.description.slice(0, 350) : undefined,
        count: batchCount,
        noteId: item.id,
      });

      setCandidates(res.candidates || []);
      setStatusMessage({
        text: `Сгенерировано вариантов: ${res.candidates?.length || 0}. Нажмите на нужный для применения.`,
        type: 'success',
      });
    } catch (err: any) {
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const msg = isTimeout
        ? 'Генерация заняла больше времени, чем обычно. Попробуйте еще раз или проверьте статус сети.'
        : err?.response?.data?.message || err?.message || 'Ошибка генерации вариантов';
      setStatusMessage({ text: String(msg), type: 'error' });
    }
  };

  const handleSelectCandidate = async (asset: AiMediaAsset) => {
    setStatusMessage({ text: 'Прикрепление выбранной обложки...', type: 'info' });
    try {
      await attachCoverMutation.mutateAsync({
        noteId: item.id,
        assetUrl: asset.url,
        caption: asset.prompt,
        setAsMain: true,
      });

      setStatusMessage({ text: 'Обложка сохранена!', type: 'success' });
      if (onCoverApplied) {
        onCoverApplied(asset.url);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ошибка прикрепления обложки';
      setStatusMessage({ text: String(msg), type: 'error' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#17212b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  AI Cover Studio (IT & Tech Обложки)
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  Podcasts • Changelogs • Security • AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-lg">
                Запись: {item.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 touch-scroll text-xs sm:text-sm">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                  : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Тема или промпт для иллюстрации
              </label>
              {prompt !== item.title && (
                <button
                  type="button"
                  onClick={() => setPrompt(item.title)}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Сбросить к заголовку</span>
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите тему подкаста, релиза, уязвимости или новости..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#10171f] text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none"
            />
          </div>

          {/* IT Scenarios, Visual Style Filter Tabs & Scene Modifiers */}
          <FeedCoverStudioItControls
            prompt={prompt}
            style={style}
            baseTopic={item.title}
            recommendation={recommendation}
            onPromptChange={setPrompt}
            onStyleChange={setStyle}
            onAspectRatioChange={setAspectRatio}
          />

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Формат / Пропорции</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FEED_ASPECT_RATIOS.map((ar) => {
                const isSelected = aspectRatio === ar.id;
                return (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-[10px]">{ar.icon}</span>
                    <span>{ar.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidates Grid */}
          {candidates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Сгенерированные варианты ({candidates.length}) — нажмите на нужный для применения
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {candidates.map((c, idx) => (
                  <div
                    key={c.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20"
                  >
                    <img
                      src={resolveMediaUrl(c.url)}
                      alt={c.prompt}
                      className="w-full h-40 object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                      #{idx + 1} • {c.style || style}
                    </span>
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <button
                        type="button"
                        onClick={() => handleSelectCandidate(c)}
                        disabled={isGenerating}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Выбрать эту обложку</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#131b24] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Закрыть
            </button>

            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-[#10171f] rounded-lg p-0.5 border border-slate-300/60 dark:border-white/10 text-[11px] font-mono">
              {([2, 4] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setBatchCount(cnt)}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    batchCount === cnt
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cnt} шт
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>Варианты ({batchCount} шт)</span>
            </button>

            <button
              type="button"
              onClick={handleQuickGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Создать и применить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
