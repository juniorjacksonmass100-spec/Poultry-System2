import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  isPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  isPositive = true,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group ${
        isLight
          ? 'bg-white border-teal-200 hover:border-teal-400 shadow-sm hover:shadow-md text-slate-800'
          : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 hover:border-[#00f5c4]/70 shadow-[0_0_18px_rgba(0,245,196,0.1)] hover:shadow-[0_0_25px_rgba(0,245,196,0.25)] text-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`text-xs font-bold transition-colors truncate tracking-wide ${
            isLight
              ? 'text-slate-600 group-hover:text-slate-900'
              : 'text-[#8fbdb8] group-hover:text-white'
          }`}
        >
          {label}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-all ${
              isLight
                ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-xs group-hover:bg-teal-100'
                : 'bg-[#00f5c4]/15 border-[#00f5c4]/35 text-[#00f5c4] group-hover:bg-[#00f5c4]/25 shadow-[0_0_10px_rgba(0,245,196,0.25)]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-1">
        <div
          className={`text-xl sm:text-2xl font-bold font-mono tabular-numbers tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {(subtitle || trend) && (
          <div
            className={`mt-1.5 flex items-center gap-1.5 text-xs ${
              isLight ? 'text-slate-500' : 'text-[#8fbdb8]'
            }`}
          >
            {trend && (
              <span
                className={
                  isPositive
                    ? isLight
                      ? 'text-emerald-700 font-bold'
                      : 'text-[#00f5c4] font-bold'
                    : 'text-rose-500 font-semibold'
                }
              >
                {trend}
              </span>
            )}
            {trend && subtitle && (
              <span className={isLight ? 'text-slate-300' : 'text-[#3a5755]'} aria-hidden="true">
                ·
              </span>
            )}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
