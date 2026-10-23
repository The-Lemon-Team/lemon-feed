import React, { useState } from 'react';
import { Sliders, Cpu, Sparkles, Plus, Check, Zap } from 'lucide-react';
import {
  FeedCoverAspectRatio,
  FEED_IT_SCENE_MODIFIERS,
  FEED_IT_WORKFLOW_TEMPLATES,
  FEED_STYLE_PRESETS,
} from './feedCoverStudio.constants';
import {
  buildFeedTemplatePrompt,
  FeedItStyleRecommendation,
  toggleFeedModifierInPrompt,
} from './feedCoverStudio.utils';

interface FeedCoverStudioItControlsProps {
  prompt: string;
  style: string;
  baseTopic: string;
  recommendation: FeedItStyleRecommendation | null;
  onPromptChange: (newPrompt: string) => void;
  onStyleChange: (newStyle: string) => void;
  onAspectRatioChange: (newRatio: FeedCoverAspectRatio) => void;
}

export const FeedCoverStudioItControls: React.FC<FeedCoverStudioItControlsProps> = ({
  prompt,
  style,
  baseTopic,
  recommendation,
  onPromptChange,
  onStyleChange,
  onAspectRatioChange,
}) => {
  const [styleFilter, setStyleFilter] = useState<'all' | 'it' | 'general'>('all');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const filteredStyles = FEED_STYLE_PRESETS.filter((preset) =>
    styleFilter === 'all' ? true : preset.category === styleFilter,
  );

  const handleApplyTemplate = (templateId: string) => {
    const built = buildFeedTemplatePrompt(templateId, baseTopic || prompt);
    if (!built) return;
    setActiveTemplateId(templateId);
    onPromptChange(built.prompt);
    onStyleChange(built.styleId);
    onAspectRatioChange(built.aspectRatio);
  };

  const handleApplyRecommendation = () => {
    if (!recommendation) return;
    if (recommendation.templateId) {
      handleApplyTemplate(recommendation.templateId);
    } else {
      onStyleChange(recommendation.styleId);
      onAspectRatioChange(recommendation.aspectRatio);
    }
  };

  const selectedStyleObj = FEED_STYLE_PRESETS.find((s) => s.id === style);

  return (
    <div className="space-y-3.5">
      {/* AI IT-Detector Recommendation Banner */}
      {recommendation && (
        <div className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200 truncate">
              <strong className="text-purple-600 dark:text-purple-300 font-mono">
                AI IT-Детектор:
              </strong>{' '}
              {recommendation.reason}
            </span>
          </div>
          <button
            type="button"
            onClick={handleApplyRecommendation}
            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] transition-colors shrink-0 cursor-pointer"
          >
            Применить шаблон
          </button>
        </div>
      )}

      {/* IT Workflow Scenarios (Podcasts, Changelogs, Security, AI, Cloud, Hardware) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
            <span>IT-Сценарии (Подкасты, Changelogs, Security, AI)</span>
          </label>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Авто-промпт + стиль + пропорции
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {FEED_IT_WORKFLOW_TEMPLATES.map((tpl) => {
            const isSelected = activeTemplateId === tpl.id && style === tpl.styleId;
            return (
              <button
                key={tpl.id}
                type="button"
                title={tpl.description}
                onClick={() => handleApplyTemplate(tpl.id)}
                className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] hover:border-purple-400/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{tpl.icon}</span>
                  <span className="truncate">{tpl.label}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-black/40 text-slate-500 dark:text-slate-400 shrink-0">
                  {tpl.aspectRatio}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Style Presets with Filter Tabs */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-500" />
            <span>Визуальный стиль</span>
          </label>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#10171f] rounded-lg p-0.5 border border-slate-200 dark:border-white/10 text-[10px] font-mono">
            {(
              [
                { id: 'all', label: 'Все (14)' },
                { id: 'it', label: '⚡ IT & Tech (8)' },
                { id: 'general', label: 'Базовые (6)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStyleFilter(tab.id)}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  styleFilter === tab.id
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {selectedStyleObj && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            {selectedStyleObj.icon} <strong>{selectedStyleObj.label}:</strong>{' '}
            {selectedStyleObj.description}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {filteredStyles.map((p) => {
            const isSelected = style === p.id;
            return (
              <button
                key={p.id}
                type="button"
                title={p.description}
                onClick={() => onStyleChange(p.id)}
                className={`flex items-center justify-between gap-1.5 p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                </div>
                {p.badge && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase shrink-0 ${
                      isSelected
                        ? 'bg-purple-500/30 text-purple-300 font-bold'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                    }`}
                  >
                    {p.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scene Detail Modifiers */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span>IT-Модификаторы сцены (клик добавляет деталь в промпт)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FEED_IT_SCENE_MODIFIERS.map((mod) => {
            const isIncluded = prompt.includes(mod.snippet);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onPromptChange(toggleFeedModifierInPrompt(prompt, mod.snippet))}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 border transition-all cursor-pointer ${
                  isIncluded
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-semibold'
                    : 'bg-slate-50 dark:bg-[#10171f] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-purple-400/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{mod.icon}</span>
                <span>{mod.label}</span>
                {isIncluded ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Plus className="w-3 h-3 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
