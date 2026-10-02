import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Sale, Expense, PoultryStock, EggProduction } from '../../types';

interface DashboardChartsProps {
  sales: Sale[];
  expenses: Expense[];
  poultry: PoultryStock[];
  eggs: EggProduction[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  sales,
  expenses,
  poultry,
  eggs,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const monthlyTimelineMap = new Map<string, { month: string; sales: number; expenses: number }>();

  sales.forEach((s) => {
    if (!s.sale_date) return;
    const m = s.sale_date.substring(0, 7);
    const existing = monthlyTimelineMap.get(m) || { month: m, sales: 0, expenses: 0 };
    existing.sales += Number(s.total_amount || 0);
    monthlyTimelineMap.set(m, existing);
  });

  expenses.forEach((e) => {
    if (!e.expense_date) return;
    const m = e.expense_date.substring(0, 7);
    const existing = monthlyTimelineMap.get(m) || { month: m, sales: 0, expenses: 0 };
    existing.expenses += Number(e.amount || 0);
    monthlyTimelineMap.set(m, existing);
  });

  poultry.forEach((p) => {
    if (!p.date_acquired) return;
    const m = p.date_acquired.substring(0, 7);
    const existing = monthlyTimelineMap.get(m) || { month: m, sales: 0, expenses: 0 };
    existing.expenses += Number(p.purchase_cost || 0);
    monthlyTimelineMap.set(m, existing);
  });

  const sortedMonths = Array.from(monthlyTimelineMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const productSalesMap = new Map<string, number>();
  sales.forEach((s) => {
    const prod = s.product || 'Other';
    productSalesMap.set(prod, (productSalesMap.get(prod) || 0) + Number(s.total_amount || 0));
  });
  const productSales = Array.from(productSalesMap.entries()).map(([product, total]) => ({
    product,
    total,
  }));

  const flockTypesMap = new Map<string, number>();
  poultry.forEach((p) => {
    const type = p.poultry_type || 'Other';
    flockTypesMap.set(type, (flockTypesMap.get(type) || 0) + p.current_quantity);
  });
  const flockComposition = Array.from(flockTypesMap.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  const recentEggs = [...eggs]
    .sort((a, b) => a.production_date.localeCompare(b.production_date))
    .slice(-7);

  const maxFinanceValue = Math.max(
    ...sortedMonths.map((m) => Math.max(m.sales, m.expenses)),
    1000
  );

  const maxEggCount = Math.max(...recentEggs.map((e) => e.eggs_collected), 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Revenue vs Expenses Timeline */}
      <div
        className={`border rounded-2xl p-5 transition-all ${
          isLight
            ? 'bg-white border-teal-200 shadow-sm text-slate-800'
            : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_20px_rgba(0,245,196,0.1)] text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t.monthlyBreakdown} ({t.salesVsExpenses})
          </h3>
          <div className="flex items-center gap-3 text-[11px]">
            <span
              className={`flex items-center gap-1.5 font-semibold ${
                isLight ? 'text-teal-700' : 'text-[#00f5c4]'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-xs ${
                  isLight ? 'bg-teal-600' : 'bg-[#00f5c4] shadow-[0_0_6px_#00f5c4]'
                }`}
              />
              {t.totalSales}
            </span>
            <span
              className={`flex items-center gap-1.5 font-semibold ${
                isLight ? 'text-rose-600' : 'text-rose-400'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-xs ${
                  isLight ? 'bg-rose-500' : 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                }`}
              />
              {t.totalExpenses}
            </span>
          </div>
        </div>

        {sortedMonths.length === 0 ? (
          <div
            className={`h-44 flex items-center justify-center text-xs ${
              isLight ? 'text-slate-400' : 'text-[#94b8b6]'
            }`}
          >
            {t.noDataYet}
          </div>
        ) : (
          <div className="h-48 flex items-end gap-3 pt-6 pb-2 px-2 overflow-x-auto">
            {sortedMonths.map((item) => {
              const salesH = Math.max(4, (item.sales / maxFinanceValue) * 100);
              const expH = Math.max(4, (item.expenses / maxFinanceValue) * 100);
              return (
                <div
                  key={item.month}
                  className="flex-1 min-w-[48px] flex flex-col items-center gap-1.5"
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    <div
                      style={{ height: `${salesH}%` }}
                      className={`w-3.5 rounded-t-xs transition-all ${
                        isLight
                          ? 'bg-teal-500 hover:bg-teal-600 shadow-xs'
                          : 'bg-[#00f5c4] shadow-[0_0_8px_rgba(0,245,196,0.5)]'
                      }`}
                      title={`${t.totalSales}: TZS ${item.sales.toLocaleString()}`}
                    />
                    <div
                      style={{ height: `${expH}%` }}
                      className={`w-3.5 rounded-t-xs transition-all ${
                        isLight
                          ? 'bg-rose-500 hover:bg-rose-600 shadow-xs'
                          : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      }`}
                      title={`${t.totalExpenses}: TZS ${item.expenses.toLocaleString()}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      isLight ? 'text-slate-500' : 'text-[#94b8b6]'
                    }`}
                  >
                    {item.month.substring(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Flock Composition by Type */}
      <div
        className={`border rounded-2xl p-5 transition-all ${
          isLight
            ? 'bg-white border-teal-200 shadow-sm text-slate-800'
            : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_20px_rgba(0,245,196,0.1)] text-white'
        }`}
      >
        <h3 className={`text-xs font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {t.flockByCategory}
        </h3>
        {flockComposition.length === 0 ? (
          <div
            className={`h-44 flex items-center justify-center text-xs ${
              isLight ? 'text-slate-400' : 'text-[#94b8b6]'
            }`}
          >
            {t.noDataYet}
          </div>
        ) : (
          <div className="space-y-3.5">
            {flockComposition.map((item) => {
              const totalFlock = flockComposition.reduce((sum, f) => sum + f.count, 0) || 1;
              const pct = Math.round((item.count / totalFlock) * 100);
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={`capitalize font-medium ${
                        isLight ? 'text-slate-800' : 'text-white'
                      }`}
                    >
                      {item.type.replace('_', ' ')}
                    </span>
                    <span
                      className={`font-mono tabular-numbers font-semibold ${
                        isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                      }`}
                    >
                      {item.count.toLocaleString()} {t.birds} ({pct}%)
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-2.5 overflow-hidden ${
                      isLight
                        ? 'bg-slate-100 border border-slate-200'
                        : 'bg-[#050e0e] border border-[#00f5c4]/15'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLight
                          ? 'bg-teal-500 shadow-xs'
                          : 'bg-[#00f5c4] shadow-[0_0_10px_rgba(0,245,196,0.6)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Recent Egg Production Trend */}
      <div
        className={`border rounded-2xl p-5 transition-all ${
          isLight
            ? 'bg-white border-teal-200 shadow-sm text-slate-800'
            : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_20px_rgba(0,245,196,0.1)] text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t.eggTitle} ({t.recentDays})
          </h3>
          <span
            className={`text-[11px] font-semibold flex items-center gap-1.5 ${
              isLight ? 'text-amber-700' : 'text-amber-300'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-xs ${
                isLight ? 'bg-amber-500' : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
              }`}
            />
            {t.eggsCollected}
          </span>
        </div>

        {recentEggs.length === 0 ? (
          <div
            className={`h-44 flex items-center justify-center text-xs ${
              isLight ? 'text-slate-400' : 'text-[#94b8b6]'
            }`}
          >
            {t.noDataYet}
          </div>
        ) : (
          <div className="h-44 flex items-end gap-2 pt-4 px-2">
            {recentEggs.map((egg) => {
              const heightPct = Math.max(8, (egg.eggs_collected / maxEggCount) * 100);
              return (
                <div key={egg.id} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center h-28">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-5 rounded-t-xs transition-all ${
                        isLight
                          ? 'bg-amber-500 hover:bg-amber-400 shadow-xs'
                          : 'bg-amber-400 rounded-t-xs hover:bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                      }`}
                      title={`${egg.production_date}: ${egg.eggs_collected} eggs`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      isLight ? 'text-slate-500' : 'text-[#94b8b6]'
                    }`}
                  >
                    {egg.production_date.substring(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Sales by Product Revenue */}
      <div
        className={`border rounded-2xl p-5 transition-all ${
          isLight
            ? 'bg-white border-teal-200 shadow-sm text-slate-800'
            : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_20px_rgba(0,245,196,0.1)] text-white'
        }`}
      >
        <h3 className={`text-xs font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {t.salesRevenueByProduct}
        </h3>

        {productSales.length === 0 ? (
          <div
            className={`h-44 flex items-center justify-center text-xs ${
              isLight ? 'text-slate-400' : 'text-[#94b8b6]'
            }`}
          >
            {t.noDataYet}
          </div>
        ) : (
          <div className="space-y-3.5">
            {productSales.map((item) => {
              const totalRevenue = productSales.reduce((s, p) => s + p.total, 0) || 1;
              const pct = Math.round((item.total / totalRevenue) * 100);
              return (
                <div key={item.product}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={`font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}
                    >
                      {item.product}
                    </span>
                    <span
                      className={`font-mono tabular-numbers font-semibold ${
                        isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                      }`}
                    >
                      TZS {item.total.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-2.5 overflow-hidden ${
                      isLight
                        ? 'bg-slate-100 border border-slate-200'
                        : 'bg-[#050e0e] border border-[#00f5c4]/15'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLight
                          ? 'bg-cyan-500 shadow-xs'
                          : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
