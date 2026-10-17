import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, RotateCcw, Check } from 'lucide-react';

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель',
  'Май', 'Июнь', 'Июль', 'Август',
  'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export interface FeedMonthPickerProps {
  currentDate: dayjs.Dayjs;
  isFilterActive: boolean;
  onSelectMonth: (year: number, monthIndex: number) => void;
  onResetAllDates: () => void;
  onClose: () => void;
}

export const FeedMonthPicker: React.FC<FeedMonthPickerProps> = ({
  currentDate,
  isFilterActive,
  onSelectMonth,
  onResetAllDates,
  onClose,
}) => {
  const [pickerYear, setPickerYear] = useState(currentDate.year());

  return (
    <div className="p-3.5 w-64 bg-white dark:bg-[#18222d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl space-y-3 select-none text-xs">
      {/* Year Selector */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setPickerYear((y) => y - 1)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
          title="Предыдущий год"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
          {pickerYear}
        </span>

        <button
          type="button"
          onClick={() => setPickerYear((y) => y + 1)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
          title="Следующий год"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS_RU.map((monthName, idx) => {
          const isSelected = isFilterActive && currentDate.year() === pickerYear && currentDate.month() === idx;
          const isCurrentRealMonth = dayjs().year() === pickerYear && dayjs().month() === idx;

          return (
            <button
              key={monthName}
              type="button"
              onClick={() => {
                onSelectMonth(pickerYear, idx);
                onClose();
              }}
              className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-medium transition-all ${
                isSelected
                  ? 'bg-[#2481cc] text-white font-bold shadow-xs'
                  : isCurrentRealMonth
                  ? 'bg-slate-100 dark:bg-white/10 text-[#2481cc] dark:text-[#64b5f6] font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              {monthName.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Footer Actions: Show All Dates / Current Month */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={() => {
            onResetAllDates();
            onClose();
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
            !isFilterActive
              ? 'bg-[#2481cc]/15 text-[#2481cc] dark:text-[#64b5f6] font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Все даты</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const now = dayjs();
            onSelectMonth(now.year(), now.month());
            onClose();
          }}
          className="text-[#2481cc] dark:text-[#64b5f6] hover:underline font-semibold"
        >
          Текущий
        </button>
      </div>
    </div>
  );
};
