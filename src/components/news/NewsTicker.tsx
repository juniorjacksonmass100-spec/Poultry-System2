import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, AlertTriangle } from 'lucide-react';
import { PoultryNews } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFontSize } from '../../context/FontSizeContext';

/**
 * Scrolling news bar shown at the top of every account (web and Android app).
 *
 * Speed is a fixed number of pixels per second, so every message moves at the
 * same readable pace no matter how long the text is. Hover or press and hold
 * to pause, which makes long messages easy to read.
 */
const SPEED_PX_PER_SECOND = 55;

interface NewsTickerProps {
  items: PoultryNews[];
  onOpenNews?: () => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ items, onOpenNews }) => {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const { fontSize } = useFontSize();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [metrics, setMetrics] = useState({ container: 0, track: 0 });

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Re-measure when the messages, the screen size or the font size change
  const signature = items.map((n) => `${n.id}:${n.title}:${n.content}`).join('|');
  useLayoutEffect(() => {
    const measure = () => {
      if (!containerRef.current || !trackRef.current) return;
      setMetrics({
        container: containerRef.current.clientWidth,
        track: trackRef.current.scrollWidth,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [signature, fontSize]);

  if (items.length === 0) return null;

  const distance = metrics.container + metrics.track;
  const duration = distance > 0 ? distance / SPEED_PX_PER_SECOND : 30;
  const hasUrgent = items.some((n) => n.priority === 'urgent');

  return (
    <div
      className={`relative z-20 flex items-stretch border-b select-none ${
        hasUrgent
          ? isLight
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-[#2a0d14] border-rose-500/40 text-rose-100'
          : isLight
          ? 'bg-teal-50 border-teal-200 text-teal-900'
          : 'bg-[#04181a] border-[#00f5c4]/25 text-[#d6fff6]'
      }`}
      role="region"
      aria-label={isSw ? 'Habari kutoka kwa msimamizi' : 'News from administrator'}
    >
      <button
        type="button"
        onClick={onOpenNews}
        className={`shrink-0 flex items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-wide z-10 ${
          hasUrgent
            ? 'bg-rose-600 text-white'
            : isLight
            ? 'bg-teal-600 text-white'
            : 'bg-[#00f5c4] text-[#02211b]'
        }`}
        title={isSw ? 'Fungua habari zote' : 'Open all news'}
      >
        {hasUrgent ? <AlertTriangle className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
        <span>{isSw ? 'Habari' : 'News'}</span>
      </button>

      <div
        ref={containerRef}
        className={`relative flex-1 overflow-hidden h-9 ${reducedMotion ? 'overflow-x-auto' : ''}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className={`absolute left-0 top-0 h-full flex items-center whitespace-nowrap text-xs font-medium ${reducedMotion ? 'relative' : 'kuku-ticker-track'}`}
          style={
            reducedMotion
              ? undefined
              : ({
                  '--ticker-from': `${metrics.container}px`,
                  '--ticker-to': `-${metrics.track}px`,
                  animationDuration: `${duration}s`,
                  animationPlayState: paused ? 'paused' : 'running',
                } as React.CSSProperties)
          }
        >
          {items.map((n, index) => (
            <span key={n.id} className="inline-flex items-center">
              {index > 0 && <span className="mx-6 opacity-50" aria-hidden="true">●</span>}
              {n.priority === 'urgent' && (
                <span className="mr-2 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                  {isSw ? 'HARAKA' : 'URGENT'}
                </span>
              )}
              <strong className="mr-2 font-bold">{n.title}:</strong>
              <span>{n.content}</span>
            </span>
          ))}
          <span className="inline-block w-12" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
