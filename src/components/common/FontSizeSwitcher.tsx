import React from 'react';
import { useFontSize, FontSize } from '../../context/FontSizeContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

/** Small / Medium / Large text selector. Works the same on web and in the Android app. */
export const FontSizeSwitcher: React.FC<{ className?: string; showLabel?: boolean }> = ({ className = '', showLabel = false }) => {
  const { fontSize, setFontSize } = useFontSize();
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const options: { id: FontSize; label: string; title: string; size: string }[] = [
    { id: 'small', label: 'A', title: isSw ? 'Maandishi madogo' : 'Small text', size: 'text-[11px]' },
    { id: 'medium', label: 'A', title: isSw ? 'Maandishi ya kati' : 'Medium text', size: 'text-sm' },
    { id: 'large', label: 'A', title: isSw ? 'Maandishi makubwa' : 'Large text', size: 'text-lg' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
          {isSw ? 'Ukubwa wa maandishi' : 'Text size'}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={isSw ? 'Ukubwa wa maandishi' : 'Text size'}
        className={`flex items-center rounded-lg border p-0.5 ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#071c1f] border-[#00f5c4]/25'
        }`}
      >
        {options.map((o) => {
          const active = fontSize === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.title}
              onClick={() => setFontSize(o.id)}
              className={`w-7 h-7 rounded-md font-bold leading-none flex items-center justify-center ${o.size} ${
                active
                  ? isLight
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-[#00f5c4] text-[#02211b] shadow-[0_0_10px_rgba(0,245,196,0.35)]'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-[#9fc9c4] hover:text-white'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
