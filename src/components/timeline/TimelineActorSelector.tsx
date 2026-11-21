import React from 'react';
import {
  TimelineActor,
  TIMELINE_ACTORS,
  getTimelineWebUrl,
} from '../../utils/timelineFeeds';
import { Radio, ExternalLink } from 'lucide-react';

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
  const selectedActor = TIMELINE_ACTORS.find((a) => a.id === selectedActorId);
  const boardUrl = getTimelineWebUrl(boardSlug);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      onSelectActor(null);
    } else {
      const actor = TIMELINE_ACTORS.find((a) => a.id === val);
      if (actor) {
        onSelectActor(actor);
      }
    }
  };

  const selectValue = isCustomMode ? 'custom' : selectedActorId || TIMELINE_ACTORS[0].id;

  return (
    <div
      className={`rounded-xl border border-sky-500/25 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20 p-3 sm:p-3.5 space-y-2.5 transition-colors ${className}`}
      data-testid="timeline-actor-selector"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label
          htmlFor="timeline-actor-select"
          className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
        >
          <Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
          <span>Персонаж TimeLine</span>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            TimeLine ⏱️
          </span>
        </label>

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

      {/* Select Dropdown */}
      <div>
        <select
          id="timeline-actor-select"
          aria-label="Выбор персонажа TimeLine"
          value={selectValue}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
        >
          {TIMELINE_ACTORS.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.emoji} {actor.name} — {actor.title}
            </option>
          ))}
          <option value="custom">👤 Свой автор / Admin (произвольный ввод)</option>
        </select>
      </div>

      {/* Character preview badge when a predefined actor is selected */}
      {selectedActor && !isCustomMode && (
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/80 dark:bg-[#151e28]/80 border border-slate-200/80 dark:border-white/10 animate-fade-in">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${selectedActor.avatarBgClass}`}
          >
            <span>{selectedActor.emoji}</span>
          </div>
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {selectedActor.name}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {selectedActor.title}
            </span>
          </div>
        </div>
      )}

      {/* If custom author mode is active, render the text input */}
      {isCustomMode && onCustomAuthorChange && (
        <div className="pt-0.5 animate-fade-in">
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
