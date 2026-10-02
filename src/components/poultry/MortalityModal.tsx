import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { PoultryStock } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface MortalityModalProps {
  isOpen: boolean;
  stock: PoultryStock | null;
  onClose: () => void;
  onRecord: (stockId: string, deadCount: number, reason: string, date: string) => Promise<void>;
}

export const MortalityModal: React.FC<MortalityModalProps> = ({
  isOpen,
  stock,
  onClose,
  onRecord,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [deadCount, setDeadCount] = useState<number>(1);
  const [reason, setReason] = useState(isSw ? 'Shinikizo la Joto / Ugonjwa' : 'Heat stress / Disease');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !stock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (deadCount <= 0) {
      setError(isSw ? 'Idadi ya vifo lazima iwe zaidi ya sifuri.' : 'Number of dead birds must be greater than zero.');
      return;
    }

    if (deadCount > stock.current_quantity) {
      setError(
        isSw
          ? `Hauwezi kurekodi vifo ${deadCount}. Kuku waliopo ni ${stock.current_quantity} tu.`
          : `Cannot record ${deadCount} deaths. Current available stock is only ${stock.current_quantity} birds.`
      );
      return;
    }

    setLoading(true);
    try {
      await onRecord(stock.id, deadCount, reason, date);
      onClose();
    } catch (err: any) {
      setError(err.message || (isSw ? 'Imeshindikana kurekodi vifo.' : 'Failed to record mortality.'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden transition-colors ${
    isLight
      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
      : 'bg-[#040c0c] border-[#00f5c4]/20 text-white focus:border-[#00f5c4]'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 ${
    isLight ? 'text-slate-700' : 'text-[#c4dedc]'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white border-teal-300 text-slate-900'
            : 'bg-[#081515] border-[#00f5c4]/30 text-white shadow-[0_0_35px_rgba(0,0,0,0.6)]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.recordMortality}
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
              {stock.breed} ({stock.poultry_type}) — {isSw ? 'Waliopo' : 'Available'}: {stock.current_quantity}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className={labelClass}>
              {t.date} *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {t.deadBirdsCount} *
            </label>
            <input
              type="number"
              min="1"
              max={stock.current_quantity}
              required
              value={deadCount}
              onChange={(e) => setDeadCount(parseInt(e.target.value, 10) || 1)}
              className={`${inputClass} font-mono tabular-numbers`}
            />
          </div>

          <div>
            <label className={labelClass}>
              {isSw ? 'Sababu au Dalili ya Vifo *' : 'Cause / Reason *'}
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isSw ? 'mf. Kideri, Gumboro, Baridi kali' : 'e.g. Newcastle, Gumboro, Heat stress'}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#00f5c4]/20">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                  : 'text-[#c4dedc] hover:text-white bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/20'
              }`}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-[0_0_12px_rgba(244,63,94,0.35)] cursor-pointer"
            >
              {loading ? t.saving : t.recordMortality}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
