import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PoultryStock } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { Search, Plus, Skull, Edit3, Trash2, Bird } from 'lucide-react';

interface PoultryStockListProps {
  stocks: PoultryStock[];
  onAdd: () => void;
  onEdit: (stock: PoultryStock) => void;
  onRecordMortality: (stock: PoultryStock) => void;
  onDelete: (id: string) => Promise<void>;
}

export const PoultryStockList: React.FC<PoultryStockListProps> = ({
  stocks,
  onAdd,
  onEdit,
  onRecordMortality,
  onDelete,
}) => {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.poultry_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.source && stock.source.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || stock.poultry_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTargetId);
      setDeleteTargetId(null);
    } catch {
      // Quiet error handling
    } finally {
      setIsDeleting(false);
    }
  };

  const totalCurrentStock = stocks.reduce((sum, s) => sum + s.current_quantity, 0);

  return (
    <div className={`space-y-4 transition-colors ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* Header Controls */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border rounded-2xl p-4 transition-all ${
          isLight
            ? 'bg-white border-teal-200 shadow-sm'
            : 'bg-gradient-to-r from-[#031518] to-[#072428] border-[#00f5c4]/30 shadow-[0_0_20px_rgba(0,245,196,0.12)]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className={`w-4 h-4 absolute left-3 top-2.5 ${
                isLight ? 'text-teal-600' : 'text-[#00f5c4]/60'
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-white placeholder:text-[#527472] focus:border-[#00f5c4] focus:shadow-[0_0_10px_rgba(0,245,196,0.25)]'
              }`}
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-[#c4dedc] focus:border-[#00f5c4]'
              }`}
            >
              <option value="all">{t.allTypes}</option>
              <option value="indigenous_chicken">{t.indigenousChicken}</option>
              <option value="crossbred_chicken">{t.crossbredChicken}</option>
              <option value="broiler">{t.broiler}</option>
              <option value="layer">{t.layer}</option>
              <option value="duck">{t.duck}</option>
              <option value="turkey">{t.turkey}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
            {t.totalCurrentFlock}:{' '}
            <span
              className={`font-mono tabular-numbers font-bold text-sm ${
                isLight ? 'text-teal-700' : 'text-[#00f5c4]'
              }`}
            >
              {totalCurrentStock.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#02211b] bg-[#00f5c4] hover:bg-[#15ffd1] rounded-xl transition-all shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addPoultry}</span>
          </button>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredStocks.length === 0 ? (
        <EmptyState
          title={stocks.length === 0 ? t.noDataYet : t.noPoultryFound}
          description={
            stocks.length === 0
              ? isSw
                ? 'Anza kwa kusajili kundi lako la kwanza la kuku. Idadi, vifo na mauzo vitajisasisha kiotomatiki.'
                : 'Start by registering your first flock batch. Quantities, mortality and sales will automatically synchronize in real time.'
              : t.noPoultryDesc
          }
          actionLabel={stocks.length === 0 ? t.addPoultry : undefined}
          onAction={stocks.length === 0 ? onAdd : undefined}
          icon={Bird}
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
                  <th className="py-3 px-4">{t.batchVariety}</th>
                  <th className="py-3 px-3">{t.dateAcquiredCol}</th>
                  <th className="py-3 px-3 text-right">{t.initialCol}</th>
                  <th className="py-3 px-3 text-right">{t.mortalityCol}</th>
                  <th className="py-3 px-3 text-right">{t.soldCol}</th>
                  <th
                    className={`py-3 px-3 text-right font-bold ${
                      isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                    }`}
                  >
                    {t.currentStockCol}
                  </th>
                  <th className="py-3 px-3 text-right">{t.genderCol}</th>
                  <th className="py-3 px-3 text-right">{t.costCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                }`}
              >
                {filteredStocks.map((stock) => {
                  return (
                    <tr
                      key={stock.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div
                          className={`font-bold capitalize ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {stock.poultry_type.replace('_', ' ')}
                        </div>
                        <div
                          className={`text-[11px] font-mono ${
                            isLight ? 'text-slate-500' : 'text-[#729997]'
                          }`}
                        >
                          {stock.breed} {stock.source ? `· ${stock.source}` : ''}
                        </div>
                      </td>

                      <td
                        className={`py-3 px-3 font-mono text-[11px] whitespace-nowrap ${
                          isLight ? 'text-slate-600' : 'text-[#94b8b6]'
                        }`}
                      >
                        {stock.date_acquired}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-medium ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {stock.initial_quantity.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-numbers text-rose-500 font-semibold">
                        {stock.mortality > 0 ? `-${stock.mortality.toLocaleString()}` : '0'}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-semibold ${
                          isLight ? 'text-cyan-700' : 'text-cyan-300'
                        }`}
                      >
                        {stock.sold_quantity > 0 ? `-${stock.sold_quantity.toLocaleString()}` : '0'}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-bold text-sm ${
                          isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                        }`}
                      >
                        {stock.current_quantity.toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers ${
                          isLight ? 'text-slate-600' : 'text-[#94b8b6]'
                        }`}
                      >
                        {stock.male_quantity}m / {stock.female_quantity}f
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers ${
                          isLight ? 'text-slate-900 font-medium' : 'text-white'
                        }`}
                      >
                        {Number(stock.purchase_cost || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onRecordMortality(stock)}
                            disabled={stock.current_quantity <= 0}
                            title={t.recordMortality}
                            className={`p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors ${
                              isLight
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-[#94b8b6] hover:text-rose-400 hover:bg-[#0c1f1f]'
                            }`}
                          >
                            <Skull className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onEdit(stock)}
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
                            onClick={() => setDeleteTargetId(stock.id)}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title={t.deletePoultryTitle}
        message={t.deletePoultryConfirm}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
