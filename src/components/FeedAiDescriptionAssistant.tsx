import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { feedApi } from '../api/client';
import { extractCleanSnippet } from '@lenta/shared';

export interface FeedAiDescriptionAssistantProps {
  title: string;
  eventDate?: string;
  noteType?: string;
  category?: string;
  currentDescription: string;
  onDescriptionGenerated: (newDescription: string) => void;
  onSummaryGenerated?: (newSummary: string) => void;
  onHashtagsSuggested?: (hashtags: string[]) => void;
}

export const FeedAiDescriptionAssistant: React.FC<FeedAiDescriptionAssistantProps> = ({
  title,
  eventDate,
  noteType,
  category,
  currentDescription,
  onDescriptionGenerated,
  onSummaryGenerated,
  onHashtagsSuggested,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptContext, setPromptContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isCinema =
    noteType === 'FILM_RELEASE' ||
    /кино|фильм|cinema|movie|film|премьер/i.test(category || '') ||
    /фильм|\(\d{4}\)/i.test(title);

  const placeholderText = isCinema
    ? 'Пара строк для ИИ (например: режиссер, завязка сюжета, каст, ожидания релиза)...'
    : 'Пара строк для ИИ (например: ключевые тезисы новости, таймкоды, детали релиза или выводы)...';

  const handleGenerate = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setStatusMessage({ text: 'Сначала укажите заголовок записи в поле выше', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const enrichment = await feedApi.generateAiContent({
        title: cleanTitle,
        category: category || (isCinema ? 'Кино / Релиз' : 'IT & Новости'),
        dateStr: eventDate || new Date().toISOString().split('T')[0],
        context: promptContext.trim() || undefined,
        noteType: noteType || (isCinema ? 'FILM_RELEASE' : 'SINGLE'),
      });

      if (enrichment.description) {
        onDescriptionGenerated(enrichment.description);

        // Auto-generate clean summary if callback provided
        if (onSummaryGenerated) {
          const autoSummary =
            enrichment.keyQuote?.trim() ||
            extractCleanSnippet(enrichment.description, 260, { title: cleanTitle });
          if (autoSummary) {
            onSummaryGenerated(autoSummary);
          }
        }
      }

      if (enrichment.hashtags && enrichment.hashtags.length > 0 && onHashtagsSuggested) {
        onHashtagsSuggested(enrichment.hashtags);
      }

      setStatusMessage({ text: '✨ Описание успешно сгенерировано ИИ!', type: 'success' });
      setTimeout(() => {
        setStatusMessage(null);
        setIsOpen(false);
      }, 2500);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Ошибка генерации описания';
      setStatusMessage({ text: `Не удалось сгенерировать: ${errMsg}`, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full mb-2">
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all bg-[#2481cc]/15 hover:bg-[#2481cc]/25 text-[#2481cc] dark:text-[#52a5e8] border border-[#2481cc]/30 hover:border-[#2481cc]/50 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Скрыть ИИ-помощник' : '✨ Сгенерировать описание (AI)'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>

        {statusMessage && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-lg ${
              statusMessage.type === 'success'
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="bg-slate-50 dark:bg-[#121922] border border-slate-200 dark:border-white/10 rounded-2xl p-3 space-y-2.5 shadow-xs transition-all">
          <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5 text-[#2481cc] dark:text-[#52a5e8] font-semibold">
              <Wand2 className="w-3.5 h-3.5" />
              Генерация Markdown-описания через ИИ
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Gemini 2.5 Flash</span>
          </div>

          <textarea
            rows={2}
            value={promptContext}
            onChange={(e) => setPromptContext(e.target.value)}
            placeholder={placeholderText}
            className="w-full bg-white dark:bg-[#10171f] border border-slate-200 dark:border-white/15 focus:border-[#2481cc] rounded-xl text-xs p-2.5 text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none"
          />

          <div className="flex items-center justify-between pt-0.5 gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Укажите 1-2 строки или оставьте пустым для генерации по заголовку и дате
            </span>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isGenerating
                  ? 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                  : 'bg-[#2481cc] hover:bg-[#1e6cb0] text-white active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Генерация...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentDescription.trim() ? 'Перегенерировать' : 'Сгенерировать'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
