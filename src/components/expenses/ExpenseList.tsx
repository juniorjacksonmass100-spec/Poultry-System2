import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Expense, ExpenseCategory } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { Plus, Edit3, Trash2, TrendingDown, Search, FolderPlus } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  onAddExpense: () => void;
  onAddCategory: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  categories,
  onAddExpense,
  onAddCategory,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredExpenses = expenses.filter((ex) => {
    const matchesSearch =
      ex.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.person_responsible && ex.person_responsible.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ex.receipt_reference && ex.receipt_reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const feedTotal = expenses
    .filter((e) => e.category.toLowerCase().includes('feed') || e.category.toLowerCase().includes('chakula'))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const medTotal = expenses
    .filter(
      (e) =>
        e.category.toLowerCase().includes('medication') ||
        e.category.toLowerCase().includes('vaccine') ||
        e.category.toLowerCase().includes('dawa') ||
        e.category.toLowerCase().includes('chanjo')
    )
    .reduce((s, e) => s + Number(e.amount || 0), 0);

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
      {/* Category Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-rose-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.totalExpenses}
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-500 tabular-numbers">
            TZS {totalExpenseAmount.toLocaleString()}
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
            {t.feedExpenses}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-amber-700' : 'text-amber-300'
            }`}
          >
            TZS {feedTotal.toLocaleString()}
          </span>
        </div>

        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-cyan-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.medicationExpenses}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-cyan-700' : 'text-cyan-300'
            }`}
          >
            TZS {medTotal.toLocaleString()}
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
              placeholder={t.search}
              className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-white placeholder:text-[#527472] focus:border-[#00f5c4]'
              }`}
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-[#c4dedc] focus:border-[#00f5c4]'
              }`}
            >
              <option value="all">{t.all}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onAddCategory}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'text-[#c4dedc] hover:text-white bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/25'
            }`}
          >
            <FolderPlus className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
            <span className="hidden sm:inline">{t.addCategory}</span>
          </button>

          <button
            onClick={onAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#02211b] bg-[#00f5c4] hover:bg-[#15ffd1] rounded-xl transition-all shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          title={expenses.length === 0 ? t.noDataYet : t.noExpensesFound}
          description={
            expenses.length === 0
              ? 'Log feed, vaccines, medication, transport, or farm labour costs to track business operational expenses.'
              : t.noExpensesDesc
          }
          actionLabel={expenses.length === 0 ? t.addExpense : undefined}
          onAction={expenses.length === 0 ? onAddExpense : undefined}
          icon={TrendingDown}
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
                  <th className="py-3 px-4">{t.expenseDateCol}</th>
                  <th className="py-3 px-3">{t.expenseCategoryCol}</th>
                  <th className="py-3 px-3">{t.expenseDescriptionCol}</th>
                  <th className="py-3 px-3 text-right font-semibold text-rose-500">
                    {t.expenseAmountCol}
                  </th>
                  <th className="py-3 px-3">{t.expenseMethodCol}</th>
                  <th className="py-3 px-3">{t.expenseResponsibleCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                }`}
              >
                {filteredExpenses.map((ex) => (
                  <tr
                    key={ex.id}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                    }`}
                  >
                    <td
                      className={`py-3 px-4 font-mono font-medium whitespace-nowrap ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {ex.expense_date}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-[#051c20] border-[#00f5c4]/20 text-[#00f5c4]'
                        }`}
                      >
                        {ex.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div
                        className={`font-medium ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {ex.description}
                      </div>
                      {ex.receipt_reference && (
                        <div
                          className={`text-[10px] font-mono ${
                            isLight ? 'text-slate-400' : 'text-[#729997]'
                          }`}
                        >
                          Ref: {ex.receipt_reference}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-numbers text-rose-500 font-bold text-sm">
                      {Number(ex.amount || 0).toLocaleString()}
                    </td>

                    <td
                      className={`py-3 px-3 font-medium ${
                        isLight ? 'text-slate-600' : 'text-[#94b8b6]'
                      }`}
                    >
                      {ex.payment_method}
                    </td>

                    <td
                      className={`py-3 px-3 ${
                        isLight ? 'text-slate-600' : 'text-[#94b8b6]'
                      }`}
                    >
                      {ex.person_responsible || '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(ex)}
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
                          onClick={() => setDeleteTargetId(ex.id)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title={t.deleteExpenseTitle}
        message={t.deleteExpenseConfirm}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
