import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { X, AlertCircle, Plus } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (name: string) => Promise<void>;
  onAddCategory?: (name: string) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddCategory,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isSw ? 'Tafadhali weka jina la kundi la matumizi.' : 'Please enter category name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const handler = onAddCategory || onSave;
      if (handler) {
        await handler(name.trim());
      }
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || (isSw ? 'Imeshindikana kuongeza kundi.' : 'Failed to add category.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className={`border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white border-teal-300 text-slate-900'
            : 'bg-[#081515] border-[#00f5c4]/30 text-white shadow-[0_0_35px_rgba(0,0,0,0.6)]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-[#00f5c4]/15 text-[#00f5c4] border-[#00f5c4]/30'
              }`}
            >
              <Plus className="w-4 h-4" />
            </div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.addCategory}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
              {isSw ? 'Jina la Kundi la Matumizi' : 'Category Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isSw ? 'mf. Vifaa vya Banda, Usafiri' : 'e.g. Coop Maintenance, Transport'}
              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-white focus:border-[#00f5c4]'
              }`}
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
