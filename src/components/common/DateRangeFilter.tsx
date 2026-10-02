import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { DateFilterRange } from '../../types';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  range: DateFilterRange;
  onChangeRange: (range: DateFilterRange) => void;
  startDate?: string;
  endDate?: string;
  onChangeStartDate?: (date: string) => void;
  onChangeEndDate?: (date: string) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  range,
  onChangeRange,
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`flex flex-wrap items-center gap-2 border rounded-2xl p-2.5 text-xs transition-colors ${
        isLight
          ? 'bg-white border-teal-200 text-slate-800 shadow-xs'
          : 'bg-[#050e0e] border-[#00f5c4]/20 text-white'
      }`}
    >
      <div className={`flex items-center gap-1.5 px-2 py-1 ${isLight ? 'text-teal-700' : 'text-[#94b8b6]'}`}>
        <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
        <span className="font-semibold">{t.period}:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {(['all', 'today', 'week', 'month', 'year', 'custom'] as DateFilterRange[]).map((r) => {
          const label =
            r === 'all'
              ? t.all
              : r === 'today'
              ? t.today
              : r === 'week'
              ? t.thisWeek
              : r === 'month'
              ? t.thisMonth
              : r === 'year'
              ? t.thisYear
              : t.customRange;

          const isActive = range === r;
          return (
            <button
              key={r}
              onClick={() => onChangeRange(r)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap font-bold text-xs cursor-pointer ${
                isActive
                  ? isLight
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-[#00f5c4] text-[#02211b] shadow-[0_0_10px_rgba(0,245,196,0.3)]'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-[#94b8b6] hover:text-white hover:bg-[#0c2020]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {range === 'custom' && (
        <div className={`flex items-center gap-2 pl-2 border-l ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/20'}`}>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onChangeStartDate && onChangeStartDate(e.target.value)}
            className={`border rounded-lg px-2 py-1 text-xs focus:outline-hidden ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-teal-500'
                : 'bg-[#020708] border-[#00f5c4]/30 text-white focus:border-[#00f5c4]'
            }`}
          />
          <span className={isLight ? 'text-slate-400' : 'text-[#94b8b6]'}>-</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onChangeEndDate && onChangeEndDate(e.target.value)}
            className={`border rounded-lg px-2 py-1 text-xs focus:outline-hidden ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-teal-500'
                : 'bg-[#020708] border-[#00f5c4]/30 text-white focus:border-[#00f5c4]'
            }`}
          />
        </div>
      )}
    </div>
  );
};
