import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { exportToExcel } from '../../services/exportService';
import {
  PoultryStock,
  EggProduction,
  Sale,
  Expense,
  BroodingRecord,
  ActivityLog,
  FinancialSummary,
  DateFilterRange,
} from '../../types';
import {
  FileSpreadsheet,
  Layers,
  Egg,
  Flame,
  TrendingDown,
  Receipt,
  Download,
} from 'lucide-react';

interface ReportsViewProps {
  poultry: PoultryStock[];
  eggs: EggProduction[];
  sales: Sale[];
  expenses: Expense[];
  brooding: BroodingRecord[];
  activityLogs: ActivityLog[];
  financials: FinancialSummary;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  poultry,
  eggs,
  sales,
  expenses,
  brooding,
  activityLogs,
  financials,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [range, setRange] = useState<DateFilterRange>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isDateInRange = (dateStr?: string | null) => {
    if (!dateStr || range === 'all') return true;

    const target = new Date(dateStr);
    const now = new Date();

    if (range === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return dateStr.startsWith(todayStr);
    }

    if (range === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return target >= oneWeekAgo && target <= now;
    }

    if (range === 'month') {
      const currentMonth = now.toISOString().substring(0, 7);
      return dateStr.startsWith(currentMonth);
    }

    if (range === 'year') {
      const currentYear = now.getFullYear().toString();
      return dateStr.startsWith(currentYear);
    }

    if (range === 'custom') {
      if (startDate && target < new Date(startDate)) return false;
      if (endDate && target > new Date(endDate)) return false;
      return true;
    }

    return true;
  };

  const filteredSales = sales.filter((s) => isDateInRange(s.sale_date));
  const filteredExpenses = expenses.filter((ex) => isDateInRange(ex.expense_date));
  const filteredEggs = eggs.filter((e) => isDateInRange(e.production_date));
  const filteredBrooding = brooding.filter((b) => isDateInRange(b.start_date));
  const filteredPoultry = poultry.filter((p) => isDateInRange(p.date_acquired));

  const handleExport = (type: 'all' | 'poultry' | 'eggs' | 'sales' | 'expenses' | 'brooding' | 'financials') => {
    exportToExcel(
      type,
      {
        poultry: filteredPoultry,
        eggs: filteredEggs,
        sales: filteredSales,
        expenses: filteredExpenses,
        brooding: filteredBrooding,
        activityLogs,
        financials,
      },
      lang
    );
  };

  const statCardClass = `p-3.5 border rounded-2xl transition-colors ${
    isLight
      ? 'bg-white border-teal-200/80 shadow-xs'
      : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_15px_rgba(0,245,196,0.1)]'
  }`;

  const reportCardClass = `border rounded-2xl p-5 flex flex-col justify-between transition-all ${
    isLight
      ? 'bg-white border-teal-200 hover:border-teal-400 shadow-sm'
      : 'bg-[#081515] border-[#00f5c4]/20 hover:border-[#00f5c4]/50 shadow-[0_0_15px_rgba(0,0,0,0.2)]'
  }`;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t.reports}
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {isSw
              ? 'Ripoti rasmi za biashara na faili zilizoidhinishwa za Excel (.xlsx) kwa ajili ya uhasibu na ukaguzi wa shamba.'
              : 'Export audited business ledgers, flock performance records, and financial accounting workbooks.'}
          </p>
        </div>

        <DateRangeFilter
          range={range}
          onChangeRange={setRange}
          startDate={startDate}
          endDate={endDate}
          onChangeStartDate={setStartDate}
          onChangeEndDate={setEndDate}
        />
      </div>

      {/* Filtered Summary Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={statCardClass}>
          <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {t.filteredSalesVol}
          </span>
          <span className={`text-base font-bold font-mono tabular-numbers ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
            TZS {filteredSales.reduce((s, x) => s + Number(x.total_amount || 0), 0).toLocaleString()}
          </span>
          <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-[#729997]'}`}>
            {filteredSales.length} {isSw ? 'miamala ya mauzo' : 'transactions'}
          </span>
        </div>

        <div className={statCardClass}>
          <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {t.filteredExpensesVol}
          </span>
          <span className="text-base font-bold font-mono text-rose-500 tabular-numbers">
            TZS {filteredExpenses.reduce((s, x) => s + Number(x.amount || 0), 0).toLocaleString()}
          </span>
          <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-[#729997]'}`}>
            {filteredExpenses.length} {isSw ? 'rekodi za matumizi' : 'expense entries'}
          </span>
        </div>

        <div className={statCardClass}>
          <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {t.filteredEggsVol}
          </span>
          <span className={`text-base font-bold font-mono tabular-numbers ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
            {filteredEggs.reduce((s, x) => s + x.eggs_collected, 0).toLocaleString()}
          </span>
          <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-[#729997]'}`}>
            {filteredEggs.length} {isSw ? 'kumbukumbu za siku' : 'daily logs'}
          </span>
        </div>

        <div className={statCardClass}>
          <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
            {t.filteredBroodingVol}
          </span>
          <span className={`text-base font-bold font-mono tabular-numbers ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {filteredBrooding.length} {isSw ? 'makundi' : 'batches'}
          </span>
          <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-400' : 'text-[#729997]'}`}>
            {filteredBrooding.reduce((s, x) => s + x.chicks_produced, 0)} {isSw ? 'vifaranga' : 'chicks'}
          </span>
        </div>
      </div>

      {/* Excel Export Hub Cards */}
      <div>
        <h3 className={`text-xs font-bold mb-3 ${isLight ? 'text-slate-800' : 'text-white'}`}>
          {t.downloadExcelTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Master Report */}
          <div
            className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
              isLight
                ? 'bg-teal-50/50 border-teal-300 hover:border-teal-500 shadow-md'
                : 'bg-[#081515] border-[#00f5c4]/40 hover:border-[#00f5c4] shadow-[0_0_20px_rgba(0,245,196,0.15)]'
            }`}
          >
            <div>
              <div className={`flex items-center gap-2 mb-2 font-bold text-xs ${isLight ? 'text-teal-800' : 'text-[#00f5c4]'}`}>
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t.completeBusinessReport}</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {isSw
                  ? 'Faili kamili la Excel lenye karatasi (sheets) zote: Kuku, Mayai, Mauzo, Matumizi, Utotoleshaji, na Mchanganuo wa Faida/Hasara.'
                  : 'Multi-sheet Excel workbook bundling Flock Stock, Egg Production, Sales, Expenses, Brooding, and P&L financial breakdown.'}
              </p>
            </div>
            <button
              onClick={() => handleExport('all')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                isLight
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                  : 'bg-[#00f5c4] hover:bg-[#15ffd1] text-[#02211b] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportMasterBtn}</span>
            </button>
          </div>

          {/* Sales Report */}
          <div className={reportCardClass}>
            <div>
              <div className={`flex items-center gap-2 mb-2 font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Receipt className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                <span>{t.salesLedgerExport}</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {t.salesLedgerDesc}
              </p>
            </div>
            <button
              onClick={() => handleExport('sales')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/20 text-white'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              <span>{t.exportSalesBtn}</span>
            </button>
          </div>

          {/* Expenses Report */}
          <div className={reportCardClass}>
            <div>
              <div className={`flex items-center gap-2 mb-2 font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span>{t.expensesLedgerExport}</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {t.expensesLedgerDesc}
              </p>
            </div>
            <button
              onClick={() => handleExport('expenses')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/20 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-rose-500" />
              <span>{t.exportExpensesBtn}</span>
            </button>
          </div>

          {/* Egg Production Report */}
          <div className={reportCardClass}>
            <div>
              <div className={`flex items-center gap-2 mb-2 font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Egg className="w-4 h-4 text-amber-500" />
                <span>{t.eggLedgerExport}</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {t.eggLedgerDesc}
              </p>
            </div>
            <button
              onClick={() => handleExport('eggs')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/20 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.exportEggsBtn}</span>
            </button>
          </div>

          {/* Flock Inventory Report */}
          <div className={reportCardClass}>
            <div>
              <div className={`flex items-center gap-2 mb-2 font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Layers className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                <span>{t.flockLedgerExport}</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {t.flockLedgerDesc}
              </p>
            </div>
            <button
              onClick={() => handleExport('poultry')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/20 text-white'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              <span>{t.exportFlockBtn}</span>
            </button>
          </div>

          {/* Brooding & Hatching Report */}
          <div className={reportCardClass}>
            <div>
              <div className={`flex items-center gap-2 mb-2 font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Flame className="w-4 h-4 text-cyan-500" />
                <span>{t.broodingLedgerExport}</span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {t.broodingLedgerDesc}
              </p>
            </div>
            <button
              onClick={() => handleExport('brooding')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/20 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>{t.exportBroodingBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
