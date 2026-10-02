import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { BroodingRecord, BroodingStatus } from '../../types';
import { calculateExpectedHatchDate } from '../../services/broodingService';
import { X, AlertCircle } from 'lucide-react';

interface BroodingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: BroodingRecord | null;
}

export const BroodingModal: React.FC<BroodingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [motherTag, setMotherTag] = useState('');
  const [poultryType, setPoultryType] = useState('Chicken');
  const [numberOfEggs, setNumberOfEggs] = useState<number>(10);
  const [incubationDays, setIncubationDays] = useState<number>(21);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualHatchDate, setActualHatchDate] = useState('');
  const [eggsHatched, setEggsHatched] = useState<number>(0);
  const [eggsFailed, setEggsFailed] = useState<number>(0);
  const [chicksProduced, setChicksProduced] = useState<number>(0);
  const [status, setStatus] = useState<BroodingStatus>('Active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (newType: string) => {
    setPoultryType(newType);
    if (!initialData) {
      if (newType.toLowerCase().includes('duck') || newType.toLowerCase().includes('bata')) {
        setIncubationDays(40);
      } else {
        setIncubationDays(21);
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      setMotherTag(initialData.mother_bird_tag || '');
      setPoultryType(initialData.poultry_type);
      setNumberOfEggs(initialData.number_of_eggs || 0);
      setIncubationDays(initialData.incubation_days || 21);
      setStartDate(initialData.start_date);
      setActualHatchDate(initialData.actual_hatch_date || '');
      setEggsHatched(initialData.eggs_hatched || 0);
      setEggsFailed(initialData.eggs_failed || 0);
      setChicksProduced(initialData.chicks_produced || 0);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    } else {
      setMotherTag('');
      setPoultryType('Chicken');
      setNumberOfEggs(10);
      setIncubationDays(21);
      setStartDate(new Date().toISOString().split('T')[0]);
      setActualHatchDate('');
      setEggsHatched(0);
      setEggsFailed(0);
      setChicksProduced(0);
      setStatus('Active');
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const expectedHatchDate = calculateExpectedHatchDate(startDate, incubationDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numberOfEggs <= 0) {
      setError(isSw ? 'Idadi ya mayai yaliyowekwa lazima iwe zaidi ya sifuri.' : 'Number of eggs must be greater than zero.');
      return;
    }

    if (eggsHatched + eggsFailed > numberOfEggs) {
      setError(
        isSw
          ? 'Jumla ya mayai yaliyototolewa na yaliyoharibika haiwezi kuzidi mayai yaliyotagwa/yaliyowekwa.'
          : 'Total of hatched and failed eggs cannot exceed eggs set.'
      );
      return;
    }

    setLoading(true);
    try {
      await onSave({
        mother_bird_tag: motherTag.trim() || null,
        poultry_type: poultryType.trim(),
        number_of_eggs: Number(numberOfEggs),
        incubation_days: Number(incubationDays),
        start_date: startDate,
        expected_hatch_date: expectedHatchDate,
        actual_hatch_date: actualHatchDate || null,
        eggs_hatched: Number(eggsHatched),
        eggs_failed: Number(eggsFailed),
        chicks_produced: Number(chicksProduced),
        status,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isSw ? 'Imeshindikana kuhifadhi rekodi ya kutotolesha.' : 'Failed to save brooding record.'));
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
            {initialData ? (isSw ? 'Hariri Kundi la Kutotolesha' : 'Edit Brooding Batch') : t.newBroodingBatch}
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
                {t.poultryTagCol || (isSw ? 'Kitambulisho / Tag ya Kuku' : 'Poultry Tag')}
              </label>
              <input
                type="text"
                value={motherTag}
                onChange={(e) => setMotherTag(e.target.value)}
                placeholder={isSw ? 'mf. KUKU-042 au Mashine-A' : 'e.g. HEN-042 or Incubator-A'}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.poultryType} *
              </label>
              <select
                value={poultryType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className={inputClass}
              >
                <option value="Chicken">{isSw ? 'Kuku (Siku 21)' : 'Chicken (21 days)'}</option>
                <option value="Duck">{isSw ? 'Bata (Siku 40)' : 'Duck (40 days)'}</option>
                <option value="Turkey">{isSw ? 'Uturuki (Siku 28)' : 'Turkey (28 days)'}</option>
                <option value="Quail">{isSw ? 'Kware (Siku 17)' : 'Quail (17 days)'}</option>
                <option value="Other">{t.otherPoultry}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                {isSw ? 'Idadi ya Mayai Yaliyowekwa *' : 'Number of Eggs Set *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={numberOfEggs || ''}
                onChange={(e) => setNumberOfEggs(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers font-bold text-teal-700 dark:text-[#00f5c4]`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.incubationDays} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={incubationDays || ''}
                onChange={(e) => setIncubationDays(Math.max(1, parseInt(e.target.value, 10) || 21))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                {t.startDate} *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.expectedHatchDate}
              </label>
              <input
                type="text"
                readOnly
                value={expectedHatchDate}
                className={`${inputClass} bg-slate-100/70 dark:bg-[#030808] font-mono text-teal-700 dark:text-[#00f5c4] font-bold`}
              />
            </div>
          </div>

          {/* Outcome Fields */}
          <div
            className={`p-3.5 rounded-xl border space-y-3 ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#030d0d] border-[#00f5c4]/15'
            }`}
          >
            <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {isSw ? 'Matokeo ya Utotoleshaji' : 'Hatching Outcomes'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  {t.actualHatchDate}
                </label>
                <input
                  type="date"
                  value={actualHatchDate}
                  onChange={(e) => setActualHatchDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t.status}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BroodingStatus)}
                  className={inputClass}
                >
                  <option value="Active">{isSw ? 'Inaendelea (Active)' : 'Active'}</option>
                  <option value="Due soon">{isSw ? 'Inakaribia Kutotolewa (Due soon)' : 'Due soon'}</option>
                  <option value="Hatched">{isSw ? 'Imetotolewa (Hatched)' : 'Hatched'}</option>
                  <option value="Failed">{isSw ? 'Imefeli (Failed)' : 'Failed'}</option>
                  <option value="Completed">{isSw ? 'Imekamilika (Completed)' : 'Completed'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className={labelClass}>
                  {t.eggsHatched}
                </label>
                <input
                  type="number"
                  min="0"
                  value={eggsHatched || ''}
                  onChange={(e) => setEggsHatched(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={`${inputClass} font-mono tabular-numbers text-emerald-600 dark:text-emerald-400 font-bold`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t.eggsFailed}
                </label>
                <input
                  type="number"
                  min="0"
                  value={eggsFailed || ''}
                  onChange={(e) => setEggsFailed(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={`${inputClass} font-mono tabular-numbers text-rose-500`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t.chicksProduced}
                </label>
                <input
                  type="number"
                  min="0"
                  value={chicksProduced || ''}
                  onChange={(e) => setChicksProduced(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className={`${inputClass} font-mono tabular-numbers text-teal-700 dark:text-[#00f5c4] font-bold`}
                />
              </div>
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
              placeholder={isSw ? 'mf. Joto lilihifadhiwa nyuzi 37.5°C' : 'e.g. Maintained temperature at 37.5°C'}
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
