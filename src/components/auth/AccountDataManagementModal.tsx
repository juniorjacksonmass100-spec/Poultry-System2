import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Layers,
  Egg,
  Flame,
  TrendingDown,
  Receipt,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Database,
} from 'lucide-react';
import {
  clearPoultryStocks,
  clearEggProductions,
  clearBroodingRecords,
  clearExpenses,
  clearSales,
  clearAllUserData,
} from '../../services/dataCleanService';

interface AccountDataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  counts: {
    poultry: number;
    eggs: number;
    brooding: number;
    expenses: number;
    sales: number;
  };
  onDataCleared: () => Promise<void>;
}

export const AccountDataManagementModal: React.FC<AccountDataManagementModalProps> = ({
  isOpen,
  onClose,
  counts,
  onDataCleared,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [targetLabel, setTargetLabel] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  if (!isOpen) return null;

  const requestDelete = (key: string, label: string) => {
    setConfirmTarget(key);
    setTargetLabel(label);
  };

  const executeDelete = async () => {
    if (!confirmTarget) return;
    setIsDeleting(true);
    try {
      if (confirmTarget === 'poultry') {
        await clearPoultryStocks();
      } else if (confirmTarget === 'eggs') {
        await clearEggProductions();
      } else if (confirmTarget === 'brooding') {
        await clearBroodingRecords();
      } else if (confirmTarget === 'expenses') {
        await clearExpenses();
      } else if (confirmTarget === 'sales') {
        await clearSales();
      } else if (confirmTarget === 'all') {
        await clearAllUserData();
      }

      await onDataCleared();
      setSuccessMsg(isSw ? `Umefanikiwa kufuta ${targetLabel}!` : `Successfully cleared ${targetLabel}!`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setConfirmTarget(null);
    } catch {
      // Quiet failover
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    {
      key: 'poultry',
      label: isSw ? 'Hesabu ya Kuku & Makundi' : 'Flock & Batch Records',
      icon: Layers,
      count: counts.poultry,
      desc: isSw ? 'Makundi yote ya kienyeji, nyama (broiler), mayai (layer) na bata.' : 'All registered chicken, broiler, layer, and duck batches.',
    },
    {
      key: 'eggs',
      label: isSw ? 'Kumbukumbu za Mayai' : 'Egg Production Logs',
      icon: Egg,
      count: counts.eggs,
      desc: isSw ? 'Kumbukumbu zote za kila siku za mayai yaliyokusanywa na kuharibika.' : 'All daily egg collection and damage logs.',
    },
    {
      key: 'brooding',
      label: isSw ? 'Utotoleshaji & Vifaranga' : 'Brooding & Incubation Batches',
      icon: Flame,
      count: counts.brooding,
      desc: isSw ? 'Kumbukumbu za mayai yaliyoingizwa kwenye mashine au kulaliwa na kuku.' : 'All active and completed hatching incubation records.',
    },
    {
      key: 'expenses',
      label: isSw ? 'Gharama & Matumizi' : 'Expense Records',
      icon: TrendingDown,
      count: counts.expenses,
      desc: isSw ? 'Gharama zote za chakula, madawa, chanjo na uendeshaji.' : 'All feed, medication, and operational expense entries.',
    },
    {
      key: 'sales',
      label: isSw ? 'Mauzo & Malipo' : 'Sales & Receipts',
      icon: Receipt,
      count: counts.sales,
      desc: isSw ? 'Mauzo yote ya kuku, mayai na madeni ya wateja.' : 'All bird, egg, and customer sales transactions.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className={`border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ${
          isLight
            ? 'bg-white border-teal-200 text-slate-800'
            : 'bg-[#051315] border-[#00f5c4]/45 shadow-[0_0_40px_rgba(0,245,196,0.25)] text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#040e10] border-[#00f5c4]/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t.accountDataManagement}
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
                {t.accountDataManagementDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#0d2729] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-400/40 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div
            className={`p-3 border rounded-xl text-xs leading-relaxed ${
              isLight
                ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                : 'bg-[#030d0f] border-[#00f5c4]/20 text-[#8fbdb8]'
            }`}
          >
            {isSw
              ? 'Ulifanya makosa wakati wa kuweka data au wakati wa majaribio? Unaweza kufuta salama data zenye makosa kutoka sehemu maalum hapa chini bila kuathiri akaunti yako ya kuingilia.'
              : 'Made a mistake during data entry or testing? You can safely remove erroneous records from specific modules below without affecting your login credentials.'}
          </div>

          <div className="space-y-2.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.key}
                  className={`flex items-center justify-between gap-3 p-3.5 border rounded-xl transition-colors ${
                    isLight
                      ? 'bg-slate-50 hover:bg-teal-50/60 border-slate-200 hover:border-teal-300'
                      : 'bg-[#030e10] hover:bg-[#06181b] border-[#00f5c4]/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        isLight
                          ? 'bg-teal-100 border-teal-300 text-teal-800'
                          : 'bg-[#00f5c4]/15 border-[#00f5c4]/30 text-[#00f5c4]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {cat.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isLight
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-[#051c20] text-[#00f5c4] border-[#00f5c4]/30'
                          }`}
                        >
                          {cat.count} {isSw ? 'rekodi' : `record${cat.count !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#719c98]'}`}>{cat.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => requestDelete(cat.key, cat.label)}
                    disabled={cat.count === 0}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500 border border-rose-300 dark:border-rose-500/35 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearDataBtn}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Master Reset Button */}
          <div className="mt-6 pt-4 border-t border-rose-500/20">
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>{t.fullAccountReset}</span>
                </h4>
                <p className="text-[11px] text-rose-800/80 dark:text-rose-200/80 mt-0.5">
                  {t.fullAccountResetDesc}
                </p>
              </div>

              <button
                onClick={() => requestDelete('all', isSw ? 'Data Zote za Shamba' : 'All Farm Records')}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all shrink-0 cursor-pointer whitespace-nowrap"
              >
                {t.resetAllDataBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#040e10] border-[#00f5c4]/20'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-[#092225] hover:bg-slate-300 dark:hover:bg-[#0e2e33] text-slate-700 dark:text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Confirmation Sub-Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-rose-300 text-slate-900' : 'bg-[#081517] border-rose-500/50 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  {t.confirmDataDeletion}
                </h4>
                <p className="text-xs text-rose-500">
                  {isSw ? 'Kipengele:' : 'Target:'} {targetLabel}
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#9bbdb9]'}`}>
              {t.confirmDataDeletionDesc}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#163439] rounded-xl transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.saving}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.yesDeleteData}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
