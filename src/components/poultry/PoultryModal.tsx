import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { PoultryStock } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface PoultryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: PoultryStock | null;
}

export const PoultryModal: React.FC<PoultryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [poultryType, setPoultryType] = useState('indigenous_chicken');
  const [customType, setCustomType] = useState('');
  const [breed, setBreed] = useState('');
  const [initialQty, setInitialQty] = useState<number>(0);
  const [maleQty, setMaleQty] = useState<number>(0);
  const [femaleQty, setFemaleQty] = useState<number>(0);
  const [youngBirds, setYoungBirds] = useState<number>(0);
  const [adultBirds, setAdultBirds] = useState<number>(0);
  const [dateAcquired, setDateAcquired] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      const isStandard = [
        'indigenous_chicken',
        'crossbred_chicken',
        'broiler',
        'layer',
        'duck',
        'turkey',
      ].includes(initialData.poultry_type);

      if (isStandard) {
        setPoultryType(initialData.poultry_type);
        setCustomType('');
      } else {
        setPoultryType('other');
        setCustomType(initialData.poultry_type);
      }

      setBreed(initialData.breed || '');
      setInitialQty(initialData.initial_quantity || 0);
      setMaleQty(initialData.male_quantity || 0);
      setFemaleQty(initialData.female_quantity || 0);
      setYoungBirds(initialData.young_birds || 0);
      setAdultBirds(initialData.adult_birds || 0);
      setDateAcquired(initialData.date_acquired || new Date().toISOString().split('T')[0]);
      setSource(initialData.source || '');
      setPurchaseCost(initialData.purchase_cost || 0);
      setNotes(initialData.notes || '');
    } else {
      setPoultryType('indigenous_chicken');
      setCustomType('');
      setBreed('');
      setInitialQty(0);
      setMaleQty(0);
      setFemaleQty(0);
      setYoungBirds(0);
      setAdultBirds(0);
      setDateAcquired(new Date().toISOString().split('T')[0]);
      setSource('');
      setPurchaseCost(0);
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalType = poultryType === 'other' ? customType.trim() : poultryType;
    if (!finalType) {
      setError(isSw ? 'Tafadhali taja aina ya kuku.' : 'Please specify poultry type.');
      return;
    }

    if (!breed.trim()) {
      setError(isSw ? 'Tafadhali weka aina au ukoo wa kuku.' : 'Please enter the breed name.');
      return;
    }

    if (initialQty <= 0) {
      setError(isSw ? 'Idadi ya awali lazima iwe zaidi ya sifuri.' : 'Initial quantity must be greater than zero.');
      return;
    }

    if (purchaseCost < 0 || maleQty < 0 || femaleQty < 0 || youngBirds < 0 || adultBirds < 0) {
      setError(isSw ? 'Idadi na gharama haziwezi kuwa hasi.' : 'Quantities and purchase cost cannot be negative.');
      return;
    }

    setLoading(true);

    try {
      await onSave({
        poultry_type: finalType,
        breed: breed.trim(),
        initial_quantity: Number(initialQty),
        male_quantity: Number(maleQty),
        female_quantity: Number(femaleQty),
        young_birds: Number(youngBirds),
        adult_birds: Number(adultBirds),
        date_acquired: dateAcquired,
        source: source.trim() || null,
        purchase_cost: Number(purchaseCost),
        mortality: initialData ? initialData.mortality : 0,
        sold_quantity: initialData ? initialData.sold_quantity : 0,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isSw ? 'Imeshindikana kuhifadhi kundi la kuku.' : 'Failed to save poultry batch.'));
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
            {initialData ? t.editPoultry : t.addPoultry}
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
                {t.poultryType} *
              </label>
              <select
                value={poultryType}
                onChange={(e) => setPoultryType(e.target.value)}
                className={inputClass}
              >
                <option value="indigenous_chicken">{t.indigenousChicken}</option>
                <option value="crossbred_chicken">{t.crossbredChicken}</option>
                <option value="broiler">{t.broiler}</option>
                <option value="layer">{t.layer}</option>
                <option value="duck">{t.duck}</option>
                <option value="turkey">{t.turkey}</option>
                <option value="other">{t.otherPoultry}</option>
              </select>
            </div>

            {poultryType === 'other' ? (
              <div>
                <label className={labelClass}>
                  {isSw ? 'Aina Maalum ya Ndege *' : 'Custom Poultry Type *'}
                </label>
                <input
                  type="text"
                  required
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder={isSw ? 'mf. Kware, Kanga' : 'e.g. Quail, Guinea Fowl'}
                  className={inputClass}
                />
              </div>
            ) : (
              <div>
                <label className={labelClass}>
                  {t.breed} *
                </label>
                <input
                  type="text"
                  required
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder={isSw ? 'mf. Kuroiler, Sasso, Kienyeji' : 'e.g. Kuroiler, Sasso, Cobb 500'}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {poultryType === 'other' && (
            <div>
              <label className={labelClass}>
                {t.breed} *
              </label>
              <input
                type="text"
                required
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder={isSw ? 'mf. Kware wa Japani, Kanga wa Kienyeji' : 'e.g. Japanese Quail, Crested Guinea Fowl'}
                className={inputClass}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                {t.initialQuantity} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={initialQty || ''}
                onChange={(e) => setInitialQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.maleQty}
              </label>
              <input
                type="number"
                min="0"
                value={maleQty || ''}
                onChange={(e) => setMaleQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.femaleQty}
              </label>
              <input
                type="number"
                min="0"
                value={femaleQty || ''}
                onChange={(e) => setFemaleQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {t.youngBirds}
              </label>
              <input
                type="number"
                min="0"
                value={youngBirds || ''}
                onChange={(e) => setYoungBirds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.adultBirds}
              </label>
              <input
                type="number"
                min="0"
                value={adultBirds || ''}
                onChange={(e) => setAdultBirds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                {t.dateAcquired} *
              </label>
              <input
                type="date"
                required
                value={dateAcquired}
                onChange={(e) => setDateAcquired(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.purchaseCost} (TZS)
              </label>
              <input
                type="number"
                min="0"
                value={purchaseCost || ''}
                onChange={(e) => setPurchaseCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.source}
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={isSw ? 'mf. Silverlands Hatchery' : 'e.g. Silverlands Hatchery'}
                className={inputClass}
              />
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
              placeholder={isSw ? 'mf. Wamepewa chanjo ya Gumboro wakati wa kuwasili' : 'e.g. Vaccinated for Gumboro on arrival'}
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
