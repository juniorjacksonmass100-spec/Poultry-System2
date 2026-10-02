import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sale } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { Plus, Edit3, Trash2, Receipt, Search } from 'lucide-react';

interface SalesListProps {
  sales: Sale[];
  onAddSale: () => void;
  onEdit: (sale: Sale) => void;
  onDelete: (id: string) => Promise<void>;
}

export const SalesList: React.FC<SalesListProps> = ({
  sales,
  onAddSale,
  onEdit,
  onDelete,
}) => {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customer_phone && s.customer_phone.includes(searchTerm)) ||
      s.product.toLowerCase().includes(searchTerm.toLowerCase());

    const isPaid = s.balance <= 0;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && isPaid) ||
      (statusFilter === 'unpaid' && !isPaid);

    return matchesSearch && matchesStatus;
  });

  const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const totalCashCollected = sales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
  const totalOutstandingBalance = sales.reduce((sum, s) => sum + Number(s.balance || 0), 0);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTargetId);
      setDeleteTargetId(null);
    } catch {
      // Quiet failover
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`space-y-4 transition-colors ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.totalSales}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-teal-700' : 'text-[#00f5c4]'
            }`}
          >
            TZS {totalSalesRevenue.toLocaleString()}
          </span>
        </div>

        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.cashReceived}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            TZS {totalCashCollected.toLocaleString()}
          </span>
        </div>

        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-amber-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.balanceDue}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-amber-700' : 'text-amber-400'
            }`}
          >
            TZS {totalOutstandingBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Control bar */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border rounded-2xl p-4 transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#081515] border-[#00f5c4]/25 shadow-[0_0_15px_rgba(0,0,0,0.3)]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[180px]">
            <Search
              className={`w-4 h-4 absolute left-3 top-2.5 ${
                isLight ? 'text-teal-600' : 'text-[#00f5c4]/60'
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isSw ? 'Tafuta mteja, simu, bidhaa...' : 'Search customer, phone, product...'}
              className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-white placeholder:text-[#527472] focus:border-[#00f5c4]'
              }`}
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-[#c4dedc] focus:border-[#00f5c4]'
              }`}
            >
              <option value="all">{t.all}</option>
              <option value="paid">{t.fullyPaid}</option>
              <option value="unpaid">{isSw ? 'Inadaiwa Baki' : 'Has Balance Due'}</option>
            </select>
          </div>
        </div>

        <button
          onClick={onAddSale}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#02211b] bg-[#00f5c4] hover:bg-[#15ffd1] rounded-xl transition-all shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.newSale}</span>
        </button>
      </div>

      {/* Table or Empty State */}
      {filteredSales.length === 0 ? (
        <EmptyState
          title={sales.length === 0 ? t.noDataYet : t.noSalesFound}
          description={
            sales.length === 0
              ? isSw
                ? 'Rekodi mauzo ya kuku walio hai, trei za mayai, mbolea, au bidhaa nyingine za shamba.'
                : 'Log customer orders for live birds, egg trays, manure, or other farm produce.'
              : t.noSalesDesc
          }
          actionLabel={sales.length === 0 ? t.newSale : undefined}
          onAction={sales.length === 0 ? onAddSale : undefined}
          icon={Receipt}
        />
      ) : (
        <div
          className={`border rounded-2xl overflow-hidden transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_20px_rgba(0,0,0,0.3)]'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-semibold ${
                    isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700'
                      : 'border-[#00f5c4]/20 bg-[#040c0c] text-[#94b8b6]'
                  }`}
                >
                  <th className="py-3 px-4">{t.saleDateCol}</th>
                  <th className="py-3 px-3">{t.saleCustomerCol}</th>
                  <th className="py-3 px-3">{t.saleProductCol}</th>
                  <th className="py-3 px-3 text-right">{t.saleQtyCol}</th>
                  <th className="py-3 px-3 text-right">{t.salePriceCol}</th>
                  <th
                    className={`py-3 px-3 text-right font-bold ${
                      isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                    }`}
                  >
                    {t.saleTotalCol}
                  </th>
                  <th className="py-3 px-3 text-right">{t.salePaidCol}</th>
                  <th className="py-3 px-3 text-right">{t.saleBalanceCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                }`}
              >
                {filteredSales.map((sale) => {
                  const hasBalance = sale.balance > 0;
                  return (
                    <tr
                      key={sale.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                      }`}
                    >
                      <td
                        className={`py-3 px-4 font-mono font-medium whitespace-nowrap ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {sale.sale_date}
                      </td>

                      <td className="py-3 px-3">
                        <div
                          className={`font-bold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {sale.customer_name}
                        </div>
                        {sale.customer_phone && (
                          <div
                            className={`text-[11px] font-mono ${
                              isLight ? 'text-slate-500' : 'text-[#729997]'
                            }`}
                          >
                            {sale.customer_phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-medium ${
                            isLight ? 'text-slate-800' : 'text-white'
                          }`}
                        >
                          {sale.product}
                        </span>
                        {sale.poultry_type && (
                          <span
                            className={`text-[11px] block capitalize ${
                              isLight ? 'text-slate-500' : 'text-[#729997]'
                            }`}
                          >
                            ({sale.poultry_type.replace('_', ' ')})
                          </span>
                        )}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-medium ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {sale.quantity.toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers ${
                          isLight ? 'text-slate-600' : 'text-[#94b8b6]'
                        }`}
                      >
                        {Number(sale.unit_price || 0).toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-bold text-sm whitespace-nowrap ${
                          isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                        }`}
                      >
                        {Number(sale.total_amount || 0).toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers whitespace-nowrap ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {Number(sale.amount_paid || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-numbers whitespace-nowrap">
                        {hasBalance ? (
                          <span className="text-amber-500 font-semibold">
                            TZS {Number(sale.balance || 0).toLocaleString()}
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-semibold ${
                              isLight ? 'text-emerald-700' : 'text-emerald-400'
                            }`}
                          >
                            {t.fullyPaid}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(sale)}
                            title={t.edit}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isLight
                                ? 'text-slate-400 hover:text-teal-700 hover:bg-teal-50'
                                : 'text-[#94b8b6] hover:text-[#00f5c4] hover:bg-[#0c1f1f]'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(sale.id)}
                            title={t.delete}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isLight
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-[#94b8b6] hover:text-rose-400 hover:bg-[#0c1f1f]'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title={t.deleteSaleTitle}
        message={t.deleteSaleConfirm}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
