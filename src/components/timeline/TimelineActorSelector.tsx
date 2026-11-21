import React from 'react';
import {
  TimelineActor,
  TIMELINE_ACTORS,
  getTimelineWebUrl,
} from '../../utils/timelineFeeds';
import { Radio, ExternalLink, User, Check } from 'lucide-react';

export interface TimelineActorSelectorProps {
  selectedActorId?: string | null;
  onSelectActor: (actor: TimelineActor | null) => void;
  customAuthor?: string;
  onCustomAuthorChange?: (val: string) => void;
  boardSlug?: string;
  className?: string;
}

export const TimelineActorSelector: React.FC<TimelineActorSelectorProps> = ({
  selectedActorId,
  onSelectActor,
  customAuthor = '',
  onCustomAuthorChange,
  boardSlug,
  className = '',
}) => {
  const isCustomMode = selectedActorId === null || selectedActorId === 'custom';
  const boardUrl = getTimelineWebUrl(boardSlug);

  return (
    <div
      className={`rounded-xl border border-sky-500/25 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20 p-3 sm:p-3.5 space-y-3 transition-colors ${className}`}
      data-testid="timeline-actor-selector"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Персонаж TimeLine
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                TimeLine ⏱️
              </span>
            </div>
          </div>
        </div>

        {boardSlug && (
          <a
            href={boardUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition-colors"
            title={`Открыть доску ${boardSlug} в Lemon Universe`}
          >
            <span>В TimeLines ({boardSlug})</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Actors Grid */}
      <div
        role="radiogroup"
        aria-label="Выбор персонажа TimeLine"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        {TIMELINE_ACTORS.map((actor) => {
          const isSelected = selectedActorId === actor.id;
          return (
            <button
              key={actor.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectActor(actor)}
              className={`relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-[#1a2533] border-sky-500 ring-2 ring-sky-500/30 shadow-xs'
                  : 'bg-white/80 dark:bg-[#151e28]/80 border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#182330]'
              }`}
            >
              {/* Avatar circle with glow */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${actor.avatarBgClass}`}
              >
                <span>{actor.emoji}</span>
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {actor.name}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {actor.title}
                </p>
              </div>

              {/* Active Checkmark */}
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}

        {/* Custom / Admin Actor Choice */}
        <button
          type="button"
          role="radio"
          aria-checked={isCustomMode}
          onClick={() => onSelectActor(null)}
          className={`relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
            isCustomMode
              ? 'bg-white dark:bg-[#1a2533] border-sky-500 ring-2 ring-sky-500/30 shadow-xs'
              : 'bg-white/80 dark:bg-[#151e28]/80 border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#182330]'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs shrink-0 border border-slate-300 dark:border-white/10">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
              Свой автор / Admin
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
              Ввод произвольного имени
            </p>
          </div>
          {isCustomMode && (
            <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
        </button>
      </div>

      {/* If custom author mode is active, render the text input */}
      {isCustomMode && onCustomAuthorChange && (
        <div className="pt-1 animate-fade-in">
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Имя автора
          </label>
          <input
            type="text"
            value={customAuthor}
            onChange={(e) => onCustomAuthorChange(e.target.value)}
            placeholder="Введите имя автора..."
            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      )}
    </div>
  );
};
