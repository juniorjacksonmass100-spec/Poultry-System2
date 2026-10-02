import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { EggProduction } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface EggProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: EggProduction | null;
}

export const EggProductionModal: React.FC<EggProductionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [henCount, setHenCount] = useState<number>(0);
  const [collected, setCollected] = useState<number>(0);
  const [broken, setBroken] = useState<number>(0);
  const [spoiled, setSpoiled] = useState<number>(0);
  const [sold, setSold] = useState<number>(0);
  const [usedInternally, setUsedInternally] = useState<number>(0);
  const [pricePerEgg, setPricePerEgg] = useState<number>(400);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.production_date);
      setHenCount(initialData.hen_count || 0);
      setCollected(initialData.eggs_collected || 0);
      setBroken(initialData.broken_eggs || 0);
      setSpoiled(initialData.spoiled_eggs || 0);
      setSold(initialData.eggs_sold || 0);
      setUsedInternally(initialData.eggs_used_internally || 0);
      setPricePerEgg(initialData.selling_price_per_egg || 400);
      setNotes(initialData.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setHenCount(0);
      setCollected(0);
      setBroken(0);
      setSpoiled(0);
      setSold(0);
      setUsedInternally(0);
      setPricePerEgg(400);
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const remaining = Math.max(0, collected - broken - spoiled - sold - usedInternally);
  const totalRevenue = sold * pricePerEgg;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (collected <= 0) {
      setError(isSw ? 'Idadi ya mayai yaliyokusanywa lazima iwe zaidi ya sifuri.' : 'Eggs collected must be greater than zero.');
      return;
    }

    if (broken + spoiled + sold + usedInternally > collected) {
      setError(
        isSw
          ? 'Jumla ya mayai yaliyovunjika, kuharibika, kuuzwa, na kutumika shambani haiwezi kuzidi mayai yaliyokusanywa.'
          : 'Total of broken, spoiled, sold, and internally used eggs cannot exceed collected eggs.'
      );
      return;
    }

    setLoading(true);
    try {
      await onSave({
        production_date: date,
        hen_count: Number(henCount),
        eggs_collected: Number(collected),
        broken_eggs: Number(broken),
        spoiled_eggs: Number(spoiled),
        eggs_sold: Number(sold),
        eggs_used_internally: Number(usedInternally),
        remaining_eggs: remaining,
        selling_price_per_egg: Number(pricePerEgg),
        total_egg_revenue: totalRevenue,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isSw ? 'Imeshindikana kuhifadhi uzalishaji wa mayai.' : 'Failed to save egg production.'));
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
        className={`border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white border-teal-300 text-slate-900'
            : 'bg-[#081515] border-[#00f5c4]/30 text-white shadow-[0_0_35px_rgba(0,0,0,0.6)]'
        }`}
      >
        <div
          className={`flex items-center justify-between p-5 border-b shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#00f5c4]/20 bg-[#061212]/50'
          }`}
        >
          <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {initialData ? (isSw ? 'Hariri Rekodi ya Mayai' : 'Edit Egg Record') : (isSw ? 'Rekodi Uzalishaji wa Mayai' : 'Record Egg Production')}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                {t.layingHensCol}
              </label>
              <input
                type="number"
                min="0"
                value={henCount || ''}
                onChange={(e) => setHenCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                {t.eggsCollected} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={collected || ''}
                onChange={(e) => setCollected(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers font-bold text-teal-700 dark:text-[#00f5c4]`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.brokenEggs}
              </label>
              <input
                type="number"
                min="0"
                value={broken || ''}
                onChange={(e) => setBroken(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.spoiledEggs}
              </label>
              <input
                type="number"
                min="0"
                value={spoiled || ''}
                onChange={(e) => setSpoiled(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                {t.eggsSold}
              </label>
              <input
                type="number"
                min="0"
                value={sold || ''}
                onChange={(e) => setSold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {isSw ? 'Bei ya Yai Moja (TZS)' : 'Price per Egg (TZS)'}
              </label>
              <input
                type="number"
                min="0"
                value={pricePerEgg || ''}
                onChange={(e) => setPricePerEgg(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.eggsUsedInternally}
              </label>
              <input
                type="number"
                min="0"
                value={usedInternally || ''}
                onChange={(e) => setUsedInternally(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>
          </div>

          {/* Quick Real-Time Summary */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isLight
                ? 'bg-teal-50/70 border-teal-200 text-slate-800'
                : 'bg-[#040e10] border-[#00f5c4]/20 text-[#c8eae6]'
            }`}
          >
            <div>
              <span className="font-semibold">{t.remainingEggs}:</span>{' '}
              <span className={`font-mono font-bold text-sm ${isLight ? 'text-teal-800' : 'text-[#00f5c4]'}`}>
                {remaining.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-semibold">{t.eggRevenue}:</span>{' '}
              <span className={`font-mono font-bold text-sm ${isLight ? 'text-teal-800' : 'text-[#00f5c4]'}`}>
                TZS {totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t.notes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isSw ? 'mf. Mayai makubwa ya daraja la kwanza' : 'e.g. Grade A large size eggs'}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/20'}`}>
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
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isLight
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                  : 'text-[#02211b] bg-[#00f5c4] hover:bg-[#15ffd1] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
              }`}
            >
              {loading ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
