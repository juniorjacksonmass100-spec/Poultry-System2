import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Bell, Egg, X } from 'lucide-react';

export type BannerKind = 'message' | 'hatch' | 'info';

export interface BannerInput {
  title: string;
  body: string;
  kind?: BannerKind;
  /** Called when the banner is tapped */
  onOpen?: () => void;
}

interface Banner extends BannerInput {
  id: number;
}

interface BannerContextType {
  pushBanner: (b: BannerInput) => void;
}

const BannerContext = createContext<BannerContextType>({ pushBanner: () => {} });

const AUTO_DISMISS_MS = 7000;
const MAX_VISIBLE = 3;

/**
 * WhatsApp-style notification banner: slides down from the top, shows who/what and the first
 * lines of the message, opens on tap, swipe up (or X) to dismiss.
 */
export const BannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isSw, setIsSw] = useState(() => localStorage.getItem('kukutrack_lang') === 'sw');
  const counter = useRef(0);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const updateLanguage = (event: Event) => {
      setIsSw((event as CustomEvent<string>).detail === 'sw');
      setBanners([]);
    };
    window.addEventListener('kukutrack:language-changed', updateLanguage);
    return () => window.removeEventListener('kukutrack:language-changed', updateLanguage);
  }, []);

  const dismiss = useCallback((id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const pushBanner = useCallback(
    (input: BannerInput) => {
      const id = ++counter.current;
      setBanners((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...input, id }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      // Short vibration like a message tick, where the device supports it
      try {
        navigator.vibrate?.(60);
      } catch {
        // not supported
      }
    },
    [dismiss]
  );

  return (
    <BannerContext.Provider value={{ pushBanner }}>
      {children}
      <div
        className="fixed left-0 right-0 z-[130] flex flex-col items-center gap-2 px-3 pointer-events-none"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        aria-live="assertive"
      >
        {banners.map((b) => (
          <div
            key={b.id}
            role="alert"
            onPointerDown={(e) => {
              touchStartY.current = e.clientY;
            }}
            onPointerUp={(e) => {
              const start = touchStartY.current;
              touchStartY.current = null;
              if (start !== null && e.clientY - start < -24) dismiss(b.id); // swipe up
            }}
            className="kuku-banner pointer-events-auto w-full max-w-md flex items-start gap-3 rounded-2xl border border-white/10 bg-[#101c1b]/95 text-white shadow-2xl backdrop-blur-md px-3.5 py-3"
          >
            <button
              type="button"
              data-no-ripple
              onClick={() => {
                b.onOpen?.();
                dismiss(b.id);
              }}
              className="flex flex-1 min-w-0 items-start gap-3 text-left"
            >
              <span
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  b.kind === 'hatch' ? 'bg-amber-400 text-amber-950' : 'bg-[#00f5c4] text-[#02211b]'
                }`}
              >
                {b.kind === 'hatch' ? <Egg className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold truncate">{b.title}</span>
                  <span className="text-[10px] text-white/60 shrink-0">{isSw ? 'sasa hivi' : 'now'}</span>
                </span>
                <span className="block text-xs text-white/85 leading-snug line-clamp-2 break-words">{b.body}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => dismiss(b.id)}
              className="shrink-0 w-8 h-8 -mr-1 flex items-center justify-center rounded-full text-white/60 hover:text-white"
              aria-label={isSw ? 'Funga' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </BannerContext.Provider>
  );
};

export const useBanner = (): BannerContextType => useContext(BannerContext);
