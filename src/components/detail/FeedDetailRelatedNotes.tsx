import React from 'react';
import { Link2, ArrowRight } from 'lucide-react';

export interface FeedDetailRelatedNotesProps {
  relatedNotes?: any[] | null;
  onNavigateRelated: (targetNoteId: string) => void;
}

export const FeedDetailRelatedNotes: React.FC<FeedDetailRelatedNotesProps> = ({
  relatedNotes,
  onNavigateRelated,
}) => {
  if (!Array.isArray(relatedNotes) || relatedNotes.length === 0) {
    return null;
  }

  return (
    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-violet-500" />
          Связанные записи ({relatedNotes.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {relatedNotes.map((rel: any, idx: number) => {
          const isResolved = rel.resolved && rel.targetNoteId;
          return (
            <div
              key={`${rel.targetNoteId || rel.cleanTitle}-${idx}`}
              onClick={() => {
                if (isResolved) {
                  onNavigateRelated(rel.targetNoteId);
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isResolved
                  ? 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer group shadow-2xs hover:shadow-xs'
                  : 'bg-slate-50/50 dark:bg-white/[0.01] border-slate-200/40 dark:border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-sm shrink-0">{rel.targetIcon || '📄'}</span>
                {rel.role === 'podcast' ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                    🎧 Подкаст
                  </span>
                ) : rel.relation ? (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold truncate max-w-[120px]"
                    title={rel.relation}
                  >
                    {rel.relation}
                  </span>
                ) : rel.targetType && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold">
                    {rel.targetType}
                  </span>
                )}
                {isResolved && (
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-transform ml-auto" />
                )}
              </div>
              <h6 className="font-medium text-xs text-slate-900 dark:text-white truncate mt-1">
                {rel.targetTitle || rel.cleanTitle}
              </h6>
              {rel.targetDate && (
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                  {new Date(rel.targetDate).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
