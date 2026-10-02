import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed rounded-2xl my-4 transition-colors ${
        isLight
          ? 'border-teal-300/80 bg-white/70 text-slate-800'
          : 'border-[#00f5c4]/25 bg-[#061212]/80 text-white'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-md ${
          isLight
            ? 'bg-teal-100 text-teal-700 border-teal-300'
            : 'bg-[#00f5c4]/10 border-[#00f5c4]/30 text-[#00f5c4] shadow-[0_0_15px_rgba(0,245,196,0.2)]'
        }`}
      >
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
        {title || t.noDataYet}
      </h3>
      {description && (
        <p className={`mt-1.5 text-xs max-w-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`mt-4 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            isLight
              ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
              : 'text-[#02211b] bg-[#00f5c4] hover:bg-[#15ffd1] shadow-[0_0_12px_rgba(0,245,196,0.35)]'
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
