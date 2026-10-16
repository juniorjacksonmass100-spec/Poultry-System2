import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BroodingRecord } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { Plus, Edit3, Trash2, Flame, CalendarClock } from 'lucide-react';
import {
  hatchCountdown,
  upcomingHatches,
  nextMilestone,
  milestoneText,
  countdownLabel,
} from '../../lib/brooding';
import { poultryTypeLabel } from '../../lib/poultryLabels';

import { poultryTypeLabel, statusLabel } from '../../lib/labels';
interface BroodingListProps {
  records: BroodingRecord[];
  onAdd: () => void;
  onEdit: (record: BroodingRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

export const BroodingList: React.FC<BroodingListProps> = ({
  records,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeBatches = records.filter(
    (r) => r.status === 'Active' || r.status === 'Due soon'
  );
  const upcoming = upcomingHatches(records);
  const totalEggsInIncubation = activeBatches.reduce((s, r) => s + r.number_of_eggs, 0);
  const totalChicksProduced = records.reduce((s, r) => s + r.chicks_produced, 0);

  const completedBatches = records.filter(
    (r) => r.status === 'Hatched' || r.status === 'Completed'
  );
  const totalHatchedEggs = completedBatches.reduce((s, r) => s + r.eggs_hatched, 0);
  const totalCompletedEggSet = completedBatches.reduce((s, r) => s + r.number_of_eggs, 0);
  const overallHatchRate =
    totalCompletedEggSet > 0
      ? Math.round((totalHatchedEggs / totalCompletedEggSet) * 100)
      : 0;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return isLight ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
            {statusLabel('Active')}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00f5c4]/15 text-[#00f5c4] border border-[#00f5c4]/30">
            {statusLabel('Active')}
          </span>
        );
      case 'Due soon':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/35">
            {statusLabel('Due soon')}
          </span>
        );
      case 'Hatched':
      case 'Completed':
        return isLight ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {statusLabel('Hatched')}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
            {statusLabel('Hatched')}
          </span>
        );
      case 'Failed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/35">
            {statusLabel('Failed')}
          </span>
        );
      default:
        return <span className="text-[11px]">{status}</span>;
    }
  };

  return (
    <div className={`space-y-4 transition-colors ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`p-3.5 border rounded-2xl transition-all ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_12px_rgba(0,0,0,0.2)]'
          }`}
        >
          <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {isSw ? 'Makundi Yanayolaliwa' : 'Active Incubation Batches'}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-amber-700' : 'text-amber-300'
            }`}
          >
            {activeBatches.length.toLocaleString()}
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
            {isSw ? 'Mayai Yanayolaliwa Sasa' : 'Eggs Currently Setting'}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {totalEggsInIncubation.toLocaleString()}
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
            {t.chicksProduced}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-teal-700' : 'text-[#00f5c4]'
            }`}
          >
            {totalChicksProduced.toLocaleString()}
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
            {t.hatchRate}
          </span>
          <span
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-cyan-700' : 'text-cyan-300'
            }`}
          >
            {overallHatchRate}%
          </span>
        </div>
      </div>

      {/* Control Banner */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border rounded-2xl p-4 transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#081515] border-[#00f5c4]/25 shadow-[0_0_15px_rgba(0,0,0,0.3)]'
        }`}
      >
        <div>
          <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t.broodingTitle}
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
            {t.incubationNotice}
          </p>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#02211b] bg-[#00f5c4] hover:bg-[#15ffd1] rounded-xl transition-all shadow-[0_0_12px_rgba(0,245,196,0.35)] cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.newBroodingBatch}</span>
        </button>
      </div>

      {/* Next hatches: countdown for every batch still in the incubator */}
      {upcoming.length > 0 && (
        <div
          className={`border rounded-2xl p-4 space-y-3 ${
            isLight ? 'bg-white border-teal-200 shadow-sm' : 'bg-[#071a1c] border-[#00f5c4]/25'
          }`}
        >
          <div className={`flex items-center gap-2 text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <CalendarClock className={`w-4 h-4 ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`} />
            {isSw ? 'Kutotoa kunakokuja' : 'Upcoming hatches'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcoming.slice(0, 6).map(({ rec, c }) => {
              const hot = c.phase !== 'upcoming' || c.daysLeft <= 3;
              const ms = nextMilestone(rec, c);
              return (
                <div
                  key={rec.id}
                  className={`rounded-xl border p-3 ${
                    hot
                      ? isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-400/40'
                      : isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#04100f] border-[#00f5c4]/15'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {poultryTypeLabel(rec.poultry_type, isSw)}
                      <span className={`ml-1.5 text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
                        {rec.number_of_eggs.toLocaleString()} {isSw ? 'mayai' : 'eggs'}
                      </span>
                    </div>
                  </div>
                  <div className={`mt-1 text-2xl font-bold font-mono tabular-numbers ${hot ? 'text-amber-500' : isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
                    {c.phase === 'upcoming' ? c.daysLeft : c.phase === 'today' ? '0' : `-${Math.abs(c.daysLeft)}`}
                    <span className={`ml-1 text-xs font-sans font-semibold ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
                      {isSw ? 'siku' : c.daysLeft === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
                    {countdownLabel(c, isSw)} · {rec.expected_hatch_date}
                  </div>
                  <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#0c2020]'}`}>
                    <div className={`h-full rounded-full ${hot ? 'bg-amber-500' : isLight ? 'bg-teal-500' : 'bg-[#00f5c4]'}`} style={{ width: `${c.percent}%` }} />
                  </div>
                  {ms && (
                    <div className={`mt-1.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-[#a2ccc8]'}`}>
                      {milestoneText(ms.code, ms.inDays, isSw)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {records.length === 0 ? (
        <EmptyState
          title={t.noDataYet}
          description={
            isSw
              ? 'Sajili kundi la kwanza la mayai yanayolaliwa au mashine ya kutotolesha. Tarehe ya kutotoa itakokotolewa kiotomatiki.'
              : 'Register your first brooding batch or incubator run. Expected hatch dates will be calculated automatically.'
          }
          actionLabel={t.newBroodingBatch}
          onAction={onAdd}
          icon={Flame}
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
                  <th className="py-3 px-4">{t.poultryTagCol}</th>
                  <th className="py-3 px-3 text-right">{t.eggsSetCol}</th>
                  <th className="py-3 px-3">{t.settingDateCol}</th>
                  <th
                    className={`py-3 px-3 font-semibold ${
                      isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                    }`}
                  >
                    {t.expectedHatchCol}
                  </th>
                  <th className="py-3 px-3 min-w-[150px]">{isSw ? 'Siku zilizobaki' : 'Days left'}</th>
                  <th className="py-3 px-3 text-right">{t.hatchedCol}</th>
                  <th className="py-3 px-3 text-right">{t.chicksCol}</th>
                  <th className="py-3 px-3">{t.statusCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                }`}
              >
                {records.map((rec) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isPastDue = rec.expected_hatch_date <= today && rec.status === 'Active';
                  return (
                    <tr
                      key={rec.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div
                          className={`font-bold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {poultryTypeLabel(rec.poultry_type, isSw)}
                        </div>
                        <div
                          className={`text-[11px] font-mono ${
                            isLight ? 'text-slate-500' : 'text-[#729997]'
                          }`}
                        >
                          {rec.mother_bird_tag || t.standardBatchTag} · {rec.incubation_days}{' '}
                          {isSw ? 'siku' : 'days'}
                        </div>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-medium ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {rec.number_of_eggs.toLocaleString()}
                      </td>
                      <td
                        className={`py-3 px-3 font-mono text-[11px] ${
                          isLight ? 'text-slate-600' : 'text-[#94b8b6]'
                        }`}
                      >
                        {rec.start_date}
                      </td>
                      <td
                        className={`py-3 px-3 font-mono font-medium text-[11px] ${
                          isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                        }`}
                      >
                        {rec.expected_hatch_date}
                        {isPastDue && (
                          <span className="text-amber-500 ml-1.5 text-[10px] font-sans font-bold">
                            ({t.dueBadge})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {(() => {
                          const c = hatchCountdown(rec);
                          const tone =
                            c.phase === 'overdue' || c.phase === 'today'
                              ? 'text-amber-500'
                              : c.phase === 'done'
                              ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                              : c.phase === 'failed'
                              ? 'text-rose-500'
                              : c.daysLeft <= 3
                              ? 'text-amber-500'
                              : isLight ? 'text-teal-700' : 'text-[#00f5c4]';
                          const bar =
                            c.phase === 'overdue' || c.phase === 'today' || (c.phase === 'upcoming' && c.daysLeft <= 3)
                              ? 'bg-amber-500'
                              : c.phase === 'failed'
                              ? 'bg-rose-500'
                              : isLight ? 'bg-teal-500' : 'bg-[#00f5c4]';
                          return (
                            <div>
                              <div className={`text-xs font-bold ${tone}`}>{countdownLabel(c, isSw)}</div>
                              {(c.phase === 'upcoming' || c.phase === 'today' || c.phase === 'overdue') && (
                                <>
                                  <div className={`mt-1 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#0c2020]'}`}>
                                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${c.percent}%` }} />
                                  </div>
                                  <div className={`mt-0.5 text-[10px] ${isLight ? 'text-slate-500' : 'text-[#729997]'}`}>
                                    {isSw ? 'Siku' : 'Day'} {c.dayNumber} / {c.totalDays}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-medium ${
                          isLight ? 'text-cyan-700' : 'text-cyan-300'
                        }`}
                      >
                        {rec.eggs_hatched > 0 ? rec.eggs_hatched.toLocaleString() : '—'}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-numbers font-bold ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {rec.chicks_produced > 0 ? rec.chicks_produced.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {getStatusBadge(rec.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 md:gap-1">
                          <button
                            onClick={() => onEdit(rec)}
                            title={t.edit}
                            className={`p-3 md:p-1.5 rounded-lg transition-colors ${
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
                            className={`p-3 md:p-1.5 rounded-lg transition-colors ${
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
        title={t.deleteBroodingTitle}
        message={t.deleteBroodingConfirm}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
