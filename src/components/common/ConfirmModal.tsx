import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className={`border rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white border-teal-200 text-slate-900 shadow-2xl'
            : 'bg-[#081515] border-[#00f5c4]/30 text-white shadow-[0_0_35px_rgba(0,0,0,0.6)]'
        }`}
      >
        <button
          onClick={onCancel}
          disabled={isLoading}
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
            isLight
              ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          {isDestructive && (
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 pr-4">
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {title}
            </h3>
            <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                : 'text-[#c4dedc] hover:text-white bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/20'
            }`}
          >
            {cancelLabel || t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                : isLight
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                : 'bg-[#00f5c4] hover:bg-[#15ffd1] text-[#02211b] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
            }`}
          >
            {confirmLabel || t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
