import React from 'react';
import {
  FileText,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Rocket,
  Radio,
  Sparkles,
  Youtube,
  LayoutTemplate,
  Zap,
} from 'lucide-react';
import {
  NOTE_TEMPLATES_LIST,
  NOTE_TEMPLATE_YOUTUBE,
  NoteTemplateDefinition,
  QuickAddMacro,
} from '@lenta/shared';

export interface FeedNotePresetBarProps {
  activeTemplateId: string | null;
  activeMacroId: string | null;
  macros?: QuickAddMacro[];
  onSelectTemplate: (template: NoteTemplateDefinition) => void;
  onSelectMacro: (macro: QuickAddMacro | null) => void;
}

const TEMPLATE_ICON_MAP: Record<string, React.ReactNode> = {
  'file-text': <FileText className="w-3.5 h-3.5" />,
  'trending-up': <TrendingUp className="w-3.5 h-3.5" />,
  calendar: <Calendar className="w-3.5 h-3.5" />,
  'check-circle': <CheckCircle2 className="w-3.5 h-3.5" />,
  rocket: <Rocket className="w-3.5 h-3.5" />,
  radio: <Radio className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5 text-rose-500" />,
};

export const FeedNotePresetBar: React.FC<FeedNotePresetBarProps> = ({
  activeTemplateId,
  activeMacroId,
  macros = [],
  onSelectTemplate,
  onSelectMacro,
}) => {
  return (
    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#121923] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-[#2481cc]" />
          <span>Пресеты Note</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Тип, папка, теги и авторазбор ссылок
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {NOTE_TEMPLATES_LIST.map((tpl) => {
          const isSelected = activeTemplateId === tpl.id;
          const isYoutube = tpl.id === NOTE_TEMPLATE_YOUTUBE;
          const icon = TEMPLATE_ICON_MAP[tpl.icon] || <Sparkles className="w-3.5 h-3.5" />;

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl)}
              title={tpl.description || tpl.name}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                isSelected
                  ? isYoutube
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-300 font-semibold shadow-2xs'
                    : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs'
                  : isYoutube
                    ? 'bg-rose-500/5 border-rose-500/25 text-slate-700 dark:text-slate-200 hover:bg-rose-500/10 hover:border-rose-500/40'
                    : 'bg-white dark:bg-[#17212b] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#2481cc]/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {icon}
              <span>{tpl.name}</span>
            </button>
          );
        })}
      </div>

      {macros.length > 0 && (
        <div className="pt-1.5 border-t border-slate-200/70 dark:border-white/5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3" />
            <span>Макросы:</span>
          </span>
          {macros.map((macro) => {
            const isSelected = activeMacroId === macro.id;
            return (
              <button
                key={macro.id}
                type="button"
                onClick={() => onSelectMacro(isSelected ? null : macro)}
                title={macro.description || macro.name}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'bg-white dark:bg-[#17212b] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-amber-500/40'
                }`}
              >
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                <span>{macro.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
