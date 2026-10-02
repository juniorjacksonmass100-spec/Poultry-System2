import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { executeDatabaseReset } from '../../services/adminService';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DangerZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => Promise<void>;
}

export const DangerZoneModal: React.FC<DangerZoneModalProps> = ({
  isOpen,
  onClose,
  onResetComplete,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [confirmationInput, setConfirmationInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (confirmationInput !== 'DELETE EVERYTHING') {
      setError(
        isSw
          ? 'Maneno ya uthibitisho hayalingani! Lazima uandike herufi kubwa kamili: "DELETE EVERYTHING".'
          : 'Confirmation phrase does not match! You must type exactly "DELETE EVERYTHING".'
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await executeDatabaseReset(confirmationInput);
      setSuccess(res.message || t.resetSuccessText);
      await onResetComplete();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(
        err.message ||
          (isSw
            ? 'Kuweka upya hifadhidata kumeshindikana. Hakikisha umeingia kama Msimamizi Mkuu mwenye mamlaka.'
            : 'Database reset failed. Ensure you are logged in as an active Administrator.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 transition-colors ${
          isLight
            ? 'bg-white border-rose-300 text-slate-900 shadow-xl'
            : 'bg-[#051315] border-rose-500/40 text-white shadow-[0_0_40px_rgba(244,63,94,0.25)]'
        }`}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
              {t.resetDatabase}
            </h3>
            <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
              {t.resetWarningText}
            </p>
          </div>
        </div>

        <div
          className={`my-5 p-3.5 border rounded-xl text-xs space-y-1.5 ${
            isLight ? 'bg-rose-50 border-rose-200 text-slate-800' : 'bg-rose-950/20 border-rose-900/40 text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{isSw ? 'Ufutaji wa Kudumu Usioweza Kurejeshwa' : 'Permanent Irreversible Deletion'}</span>
          </div>
          <p className={isLight ? 'text-slate-600' : 'text-neutral-400'}>
            {isSw
              ? 'Hesabu yote ya kuku, mayai, utotoleshaji, ankara za mauzo, na matumizi zitafutwa kabisa kutoka kwenye hifadhidata ya Supabase PostgreSQL.'
              : 'All flock inventory, egg collections, incubation batches, sales receipts, and operational expenses will be permanently purged from the live Supabase PostgreSQL database.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
              {t.resetConfirmPrompt}
            </label>
            <input
              type="text"
              required
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="DELETE EVERYTHING"
              className={`w-full border rounded-xl px-3 py-2 text-xs font-mono tracking-wider focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                  : 'bg-[#020708] border-rose-500/30 text-white focus:border-rose-500'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                  : 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
              }`}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading || confirmationInput !== 'DELETE EVERYTHING'}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_0_12px_rgba(244,63,94,0.35)] cursor-pointer"
            >
              {isLoading ? t.saving : t.resetDatabase}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
