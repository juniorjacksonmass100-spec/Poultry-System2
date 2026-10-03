import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; message: string }

interface ToastContextType {
  notify: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ notify: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="fixed z-[100] left-1/2 -translate-x-1/2 bottom-4 w-[min(94vw,28rem)] flex flex-col gap-2 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto kuku-toast flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md ${
              t.kind === 'success'
                ? 'bg-emerald-950/95 border-emerald-400/50 text-emerald-100'
                : t.kind === 'error'
                ? 'bg-rose-950/95 border-rose-400/50 text-rose-100'
                : 'bg-slate-900/95 border-cyan-400/40 text-cyan-100'
            }`}
            role={t.kind === 'error' ? 'alert' : 'status'}
          >
            {t.kind === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : t.kind === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="flex-1 leading-relaxed">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => useContext(ToastContext);
