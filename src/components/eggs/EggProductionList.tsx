import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { EggProduction } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { Plus, Edit3, Trash2, Egg, Calendar } from 'lucide-react';

interface EggProductionListProps {
  records: EggProduction[];
  onAdd: () => void;
  onEdit: (record: EggProduction) => void;
  onDelete: (id: string) => Promise<void>;
}

export const EggProductionList: React.FC<EggProductionListProps> = ({
  records,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [dateFilter, setDateFilter] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRecords = records.filter((rec) => {
    if (!dateFilter) return true;
    return rec.production_date.includes(dateFilter);
  });

  const totalCollected = records.reduce((s, r) => s + r.eggs_collected, 0);
  const totalSold = records.reduce((s, r) => s + r.eggs_sold, 0);
  const totalDamaged = records.reduce((s, r) => s + r.broken_eggs + r.spoiled_eggs, 0);
  const totalRemaining = records.reduce((s, r) => s + r.remaining_eggs, 0);
  const totalRevenue = records.reduce((s, r) => s + Number(r.total_egg_revenue || 0), 0);

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_15px_rgba(0,245,196,0.1)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {t.eggsCollected}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-teal-700' : 'text-[#00f5c4]'
            }`}
          >
            {totalCollected.toLocaleString()}
          </span>
        </div>

        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_15px_rgba(0,245,196,0.1)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {t.eggsSold}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {totalSold.toLocaleString()}
          </span>
        </div>

        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-rose-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.damagedSpoiled}
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-500 tabular-numbers">
            {totalDamaged.toLocaleString()}
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
            {t.remainingEggs}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {totalRemaining.toLocaleString()}
          </span>
        </div>

        <div
          className={`p-3.5 border rounded-2xl col-span-2 sm:col-span-1 transition-all ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.eggRevenue}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-teal-700' : 'text-[#00f5c4]'
            }`}
          >
            TZS {totalRevenue.toLocaleString()}
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar
              className={`w-4 h-4 absolute left-3 top-2.5 ${
                isLight ? 'text-teal-600' : 'text-[#00f5c4]/60'
              }`}
            />
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder={t.filterByDate}
              className={`border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-hidden transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500'
                  : 'bg-[#040c0c] border-[#00f5c4]/20 text-white placeholder:text-[#527472] focus:border-[#00f5c4]'
              }`}
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className={`text-xs ${
                isLight ? 'text-slate-500 hover:text-teal-700' : 'text-[#94b8b6] hover:text-[#00f5c4]'
              }`}
            >
              {t.clearFilter}
            </button>
          )}
        </div>

        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#02211b] bg-[#00f5c4] hover:bg-[#15ffd1] rounded-xl transition-all shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.logEggProduction}</span>
        </button>
      </div>

      {/* Table or Empty State */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          title={records.length === 0 ? t.noDataYet : t.noEggsFound}
          description={
            records.length === 0
              ? 'Log daily collections to track laying rates, damaged eggs, direct egg sales, and reserve stocks.'
              : t.noEggsDesc
          }
          actionLabel={records.length === 0 ? t.logEggProduction : undefined}
          onAction={records.length === 0 ? onAdd : undefined}
          icon={Egg}
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
                  <th className="py-3 px-4">{t.date}</th>
                  <th className="py-3 px-3 text-right">{t.layingHensCol}</th>
                  <th className="py-3 px-3 text-right">{t.collectedCol}</th>
                  <th className="py-3 px-3 text-right">{t.damagedCol}</th>
                  <th className="py-3 px-3 text-right">{t.soldCol}</th>
                  <th className="py-3 px-3 text-right">{t.usedFarmCol}</th>
                  <th
                    className={`py-3 px-3 text-right font-bold ${
                      isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                    }`}
                  >
                    {t.remainingCol}
                  </th>
                  <th className="py-3 px-3 text-right">{t.ratePctCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                }`}
              >
                {filteredRecords.map((rec) => {
                  const hens = rec.hen_count || 0;
                  const layingRate =
                    hens > 0
                      ? Math.round((rec.eggs_collected / hens) * 100)
                      : 0;

                  return (
                    <tr
                      key={rec.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                      }`}
                    >
                      <td
                        className={`py-3 px-4 font-mono font-medium whitespace-nowrap ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {rec.production_date}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-numbers">
                        {hens.toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-bold text-sm ${
                          isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                        }`}
                      >
                        {rec.eggs_collected.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-numbers text-rose-500 font-semibold">
                        {(rec.broken_eggs + rec.spoiled_eggs).toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-medium ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {rec.eggs_sold.toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers ${
                          isLight ? 'text-slate-500' : 'text-[#94b8b6]'
                        }`}
                      >
                        {rec.eggs_used_internally.toLocaleString()}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-bold ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {rec.remaining_eggs.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-numbers text-amber-500 font-semibold">
                        {layingRate}%
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(rec)}
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
                            onClick={() => setDeleteTargetId(rec.id)}
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
        title={t.deleteEggTitle}
        message={t.deleteEggConfirm}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
