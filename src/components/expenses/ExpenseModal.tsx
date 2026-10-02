import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Expense, ExpenseCategory } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  categories: ExpenseCategory[];
  initialData?: Expense | null;
  onOpenCategoryModal?: () => void;
  onOpenAddCategory?: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData,
  onOpenCategoryModal,
  onOpenAddCategory,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Feeds');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [personResponsible, setPersonResponsible] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.expense_date);
      setCategory(initialData.category);
      setDescription(initialData.description);
      setAmount(initialData.amount || 0);
      setPaymentMethod(initialData.payment_method || 'Cash');
      setPersonResponsible(initialData.person_responsible || '');
      setReceiptRef(initialData.receipt_reference || '');
      setNotes(initialData.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(categories[0]?.name || 'Feeds');
      setDescription('');
      setAmount(0);
      setPaymentMethod('Cash');
      setPersonResponsible('');
      setReceiptRef('');
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError(isSw ? 'Tafadhali weka maelezo ya matumizi.' : 'Please enter expense description.');
      return;
    }

    if (amount <= 0) {
      setError(isSw ? 'Kiasi cha matumizi lazima kiwe zaidi ya sifuri.' : 'Amount must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        expense_date: date,
        category,
        description: description.trim(),
        amount: Number(amount),
        payment_method: paymentMethod,
        person_responsible: personResponsible.trim() || null,
        receipt_reference: receiptRef.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isSw ? 'Imeshindikana kuhifadhi gharama.' : 'Failed to save expense.'));
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
            {initialData ? (isSw ? 'Hariri Gharama' : 'Edit Expense') : t.addExpense}
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
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>
                  {t.expenseCategory} *
                </label>
                {(onOpenAddCategory || onOpenCategoryModal) && (
                  <button
                    type="button"
                    onClick={onOpenAddCategory || onOpenCategoryModal}
                    className={`text-[11px] font-bold hover:underline cursor-pointer ${
                      isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                    }`}
                  >
                    + {t.addCategory}
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t.description} *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isSw ? 'mf. Mifuko 5 ya chakula cha kuanzia (Broiler Starter)' : 'e.g. 5 bags of Broiler Starter feed'}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                {t.amount} (TZS) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`${inputClass} font-mono tabular-numbers font-bold text-rose-500`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.paymentMethod} *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={inputClass}
              >
                <option value="Cash">{isSw ? 'Pesa Taslimu (Cash)' : 'Cash'}</option>
                <option value="M-Pesa">{isSw ? 'M-Pesa / TigoPesa / Airtel Money' : 'Mobile Money (M-Pesa)'}</option>
                <option value="Bank Transfer">{isSw ? 'Benki (Bank Transfer)' : 'Bank Transfer'}</option>
                <option value="Credit">{isSw ? 'Mkopo / Deni (Credit)' : 'Credit / Payable'}</option>
                <option value="Other">{isSw ? 'Nyingine' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                {t.personResponsible}
              </label>
              <input
                type="text"
                value={personResponsible}
                onChange={(e) => setPersonResponsible(e.target.value)}
                placeholder={isSw ? 'mf. Juma Hamisi' : 'e.g. John Doe'}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.receiptReference}
              </label>
              <input
                type="text"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder={isSw ? 'mf. Risiti #REC-883' : 'e.g. REC-8839'}
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
              placeholder={isSw ? 'mf. Ilinunuliwa kutoka Duka Kuu la Madawa' : 'e.g. Purchased from Agro-vet wholesale'}
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
