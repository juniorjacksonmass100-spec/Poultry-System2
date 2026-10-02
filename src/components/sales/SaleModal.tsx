import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Sale, PoultryStock } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  poultryStocks: PoultryStock[];
  initialData?: Sale | null;
}

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  poultryStocks,
  initialData,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [product, setProduct] = useState('Live birds');
  const [stockId, setStockId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(15000);
  const [amountPaid, setAmountPaid] = useState<number>(15000);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.sale_date);
      setProduct(initialData.product || 'Live birds');
      setStockId(initialData.stock_id || '');
      setQuantity(initialData.quantity || 1);
      setUnitPrice(initialData.unit_price || 0);
      setAmountPaid(initialData.amount_paid || 0);
      setPaymentMethod(initialData.payment_method || 'Cash');
      setCustomerName(initialData.customer_name || '');
      setCustomerPhone(initialData.customer_phone || '');
      setNotes(initialData.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setProduct('Live birds');
      setStockId(poultryStocks[0]?.id || '');
      setQuantity(1);
      setUnitPrice(15000);
      setAmountPaid(15000);
      setPaymentMethod('Cash');
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen, poultryStocks]);

  if (!isOpen) return null;

  const totalAmount = quantity * unitPrice;
  const balance = Math.max(0, totalAmount - amountPaid);

  const handlePriceOrQtyChange = (qty: number, price: number) => {
    setQuantity(qty);
    setUnitPrice(price);
    const tot = qty * price;
    setAmountPaid(tot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError(isSw ? 'Idadi ya bidhaa lazima iwe zaidi ya sifuri.' : 'Quantity must be greater than zero.');
      return;
    }

    if (unitPrice < 0) {
      setError(isSw ? 'Bei ya kitengo haiwezi kuwa hasi.' : 'Unit price cannot be negative.');
      return;
    }

    if (amountPaid > totalAmount) {
      setError(isSw ? 'Kiasi kilicholipwa hakiwezi kuzidi jumla ya mauzo.' : 'Amount paid cannot exceed total amount.');
      return;
    }

    if (product === 'Live birds' && stockId) {
      const selectedStock = poultryStocks.find((s) => s.id === stockId);
      if (selectedStock && !initialData && quantity > selectedStock.current_quantity) {
        setError(
          isSw
            ? `Hauwezi kuuza kuku ${quantity}. Kuku waliopo kwenye kundi hili ni ${selectedStock.current_quantity} tu.`
            : `Cannot sell ${quantity} birds. Current stock has only ${selectedStock.current_quantity} birds available.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const selectedStock = poultryStocks.find((s) => s.id === stockId);
      await onSave({
        sale_date: date,
        product,
        poultry_type: product === 'Live birds' && selectedStock ? selectedStock.poultry_type : null,
        stock_id: product === 'Live birds' ? stockId || null : null,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        total_amount: Number(totalAmount),
        amount_paid: Number(amountPaid),
        balance: Number(balance),
        payment_method: paymentMethod,
        customer_name: customerName.trim() || (isSw ? 'Mteja wa Kawaida' : 'Walk-in Customer'),
        customer_phone: customerPhone.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isSw ? 'Imeshindikana kuhifadhi mauzo.' : 'Failed to record sale.'));
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
            {initialData ? (isSw ? 'Hariri Ankara ya Mauzo' : 'Edit Sale Invoice') : t.newSale}
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
                {t.saleDateCol} *
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
                {t.productSold} *
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className={inputClass}
              >
                <option value="Live birds">{isSw ? 'Kuku Walio Hai (Live Birds)' : 'Live Birds'}</option>
                <option value="Eggs">{isSw ? 'Mayai (Eggs)' : 'Eggs'}</option>
                <option value="Chicks">{isSw ? 'Vifaranga (Chicks)' : 'Day-old Chicks'}</option>
                <option value="Meat">{isSw ? 'Nyama ya Kuku (Meat)' : 'Poultry Meat'}</option>
                <option value="Manure">{isSw ? 'Mbolea ya Kuku (Manure)' : 'Manure'}</option>
                <option value="Other">{isSw ? 'Mengineyo (Other)' : 'Other'}</option>
              </select>
            </div>
          </div>

          {product === 'Live birds' && (
            <div>
              <label className={labelClass}>
                {t.selectStock} *
              </label>
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className={inputClass}
              >
                {poultryStocks.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.breed} ({stock.poultry_type}) — {isSw ? 'Waliopo' : 'Available'}: {stock.current_quantity}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                {t.quantity} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity || ''}
                onChange={(e) =>
                  handlePriceOrQtyChange(
                    Math.max(1, parseInt(e.target.value, 10) || 1),
                    unitPrice
                  )
                }
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.unitPrice} (TZS) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice || ''}
                onChange={(e) =>
                  handlePriceOrQtyChange(
                    quantity,
                    Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className={`${inputClass} font-mono tabular-numbers`}
              />
            </div>
          </div>

          {/* Quick Invoice Total Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isLight
                ? 'bg-teal-50/70 border-teal-200 text-slate-800'
                : 'bg-[#040e10] border-[#00f5c4]/20 text-[#c8eae6]'
            }`}
          >
            <span className="font-semibold">{t.totalAmount}:</span>
            <span className={`font-mono font-bold text-base ${isLight ? 'text-teal-800' : 'text-[#00f5c4]'}`}>
              TZS {totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                {t.amountPaid} (TZS) *
              </label>
              <input
                type="number"
                min="0"
                max={totalAmount}
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`${inputClass} font-mono tabular-numbers font-bold text-emerald-600 dark:text-emerald-400`}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.balanceDue} (TZS)
              </label>
              <input
                type="text"
                readOnly
                value={`TZS ${balance.toLocaleString()}`}
                className={`${inputClass} bg-slate-100/70 dark:bg-[#030808] font-mono text-rose-500 font-bold`}
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
                <option value="Credit">{isSw ? 'Mkopo / Deni (Credit)' : 'Credit'}</option>
                <option value="Other">{isSw ? 'Nyingine' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>
                {t.customerName}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={isSw ? 'mf. Hoteli ya Kilimani' : 'e.g. Hilltop Hotel'}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t.customerPhone}
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+255..."
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
              placeholder={isSw ? 'mf. Malipo ya awali 50%, salio litatolewa mwisho wa wiki' : 'e.g. Delivered to customer site'}
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
