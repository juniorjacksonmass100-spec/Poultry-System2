import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { FinancialSummary, Sale, Expense, PoultryStock } from '../../types';
import { StatCard } from '../common/StatCard';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wheat,
  Syringe,
  Package,
  Layers,
  Wallet,
} from 'lucide-react';

interface FinancialOverviewProps {
  financials: FinancialSummary;
  sales: Sale[];
  expenses: Expense[];
  poultry: PoultryStock[];
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  financials,
  sales,
  expenses,
  poultry,
}) => {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  return (
    <div className={`space-y-6 transition-colors ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label={t.totalRevenue}
          value={`TZS ${financials.totalRevenue.toLocaleString()}`}
          subtitle={t.allProductSalesSub}
          icon={TrendingUp}
          trend={t.inflowTrend}
          isPositive={true}
        />
        <StatCard
          label={t.totalExpenses}
          value={`TZS ${financials.totalExpenses.toLocaleString()}`}
          subtitle={t.feedVaccinesLabourSub}
          icon={TrendingDown}
          trend={t.outflowTrend}
          isPositive={false}
        />
        <StatCard
          label={t.grossProfit}
          value={`TZS ${financials.grossProfit.toLocaleString()}`}
          subtitle={t.grossProfitSub}
          icon={DollarSign}
          trend={financials.grossProfit >= 0 ? '+ Positive' : '- Deficit'}
          isPositive={financials.grossProfit >= 0}
        />
        <StatCard
          label={t.netProfit}
          value={`TZS ${financials.netProfit.toLocaleString()}`}
          subtitle={t.netProfitSub}
          icon={DollarSign}
          trend={financials.netProfit >= 0 ? '+ Net Surplus' : '- Net Loss'}
          isPositive={financials.netProfit >= 0}
        />
      </div>

      {/* Secondary Cost Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`border rounded-2xl p-4 transition-all ${
            isLight
              ? 'bg-white border-amber-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_15px_rgba(0,245,196,0.1)]'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs mb-1 ${
              isLight ? 'text-slate-600' : 'text-[#94b8b6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.poultryPurchases}</span>
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            TZS {financials.poultryPurchaseCost.toLocaleString()}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-4 transition-all ${
            isLight
              ? 'bg-white border-amber-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_15px_rgba(0,245,196,0.1)]'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs mb-1 ${
              isLight ? 'text-slate-600' : 'text-[#94b8b6]'
            }`}
          >
            <Wheat className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.feedExpenses}</span>
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            TZS {financials.feedExpenses.toLocaleString()}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-4 transition-all ${
            isLight
              ? 'bg-white border-cyan-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_15px_rgba(0,245,196,0.1)]'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs mb-1 ${
              isLight ? 'text-slate-600' : 'text-[#94b8b6]'
            }`}
          >
            <Syringe className="w-3.5 h-3.5 text-cyan-500" />
            <span>{t.medicationExpenses}</span>
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            TZS {financials.medicationExpenses.toLocaleString()}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-4 transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_15px_rgba(0,245,196,0.1)]'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs mb-1 ${
              isLight ? 'text-slate-600' : 'text-[#94b8b6]'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.otherOperatingCosts}</span>
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-mono tabular-numbers ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            TZS {financials.otherExpenses.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Cash Flow vs Receivables Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`border rounded-2xl p-5 transition-all ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_18px_rgba(0,245,196,0.1)]'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Wallet className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
            <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.cashFlowRealization}
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <div
              className={`flex justify-between py-1.5 border-b ${
                isLight ? 'border-slate-100 text-slate-600' : 'border-[#00f5c4]/15 text-[#94b8b6]'
              }`}
            >
              <span>{t.totalBilledSales}</span>
              <span
                className={`font-mono tabular-numbers font-medium ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                TZS {financials.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div
              className={`flex justify-between py-1.5 border-b ${
                isLight ? 'border-slate-100 text-slate-600' : 'border-[#00f5c4]/15 text-[#94b8b6]'
              }`}
            >
              <span>{t.actualCashReceived}</span>
              <span
                className={`font-mono tabular-numbers font-bold ${
                  isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                }`}
              >
                TZS {financials.cashReceived.toLocaleString()}
              </span>
            </div>
            <div
              className={`flex justify-between py-1.5 ${
                isLight ? 'text-slate-600' : 'text-[#94b8b6]'
              }`}
            >
              <span>{t.totalDisbursements}</span>
              <span className="font-mono tabular-numbers text-rose-500 font-semibold">
                TZS {financials.totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`border rounded-2xl p-5 transition-all ${
            isLight
              ? 'bg-white border-amber-200 shadow-sm'
              : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_18px_rgba(0,245,196,0.1)]'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.outstandingReceivables}
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <div
              className={`flex justify-between py-1.5 border-b ${
                isLight ? 'border-slate-100 text-slate-600' : 'border-[#00f5c4]/15 text-[#94b8b6]'
              }`}
            >
              <span>{t.uncollectedDebt}</span>
              <span className="font-mono tabular-numbers text-amber-600 font-bold">
                TZS {financials.totalOutstandingBalance.toLocaleString()}
              </span>
            </div>
            <div
              className={`flex justify-between py-1.5 border-b ${
                isLight ? 'border-slate-100 text-slate-600' : 'border-[#00f5c4]/15 text-[#94b8b6]'
              }`}
            >
              <span>{t.collectionRate}</span>
              <span
                className={`font-mono tabular-numbers font-semibold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {financials.totalRevenue > 0
                  ? Math.round((financials.cashReceived / financials.totalRevenue) * 100)
                  : 100}
                %
              </span>
            </div>
            <div
              className={`flex justify-between py-1.5 ${
                isLight ? 'text-slate-600' : 'text-[#94b8b6]'
              }`}
            >
              <span>{t.liquidityStatus}</span>
              <span
                className={`font-semibold ${
                  financials.netProfit >= 0
                    ? isLight
                      ? 'text-teal-700'
                      : 'text-[#00f5c4]'
                    : 'text-rose-500'
                }`}
              >
                {financials.netProfit >= 0 ? t.healthyMargin : t.negativeMargin}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Financial Breakdown Ledger */}
      <div
        className={`border rounded-2xl p-5 transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_15px_rgba(0,0,0,0.3)]'
        }`}
      >
        <h3 className={`text-xs font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {t.monthlyBreakdown}
        </h3>

        {financials.monthlyBreakdown.length === 0 ? (
          <div
            className={`py-8 text-center text-xs ${
              isLight ? 'text-slate-400' : 'text-[#94b8b6]'
            }`}
          >
            {t.noDataYet}
          </div>
        ) : (
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
                  <th className="py-2.5 px-4">{t.periodMonthCol}</th>
                  <th
                    className={`py-2.5 px-4 text-right ${
                      isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                    }`}
                  >
                    {t.revenueCol}
                  </th>
                  <th className="py-2.5 px-4 text-right text-rose-500">{t.expensesCol}</th>
                  <th className="py-2.5 px-4 text-right font-bold">{t.netProfitCol}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y font-mono tabular-numbers ${
                  isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                }`}
              >
                {financials.monthlyBreakdown.map((item) => (
                  <tr
                    key={item.month}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                    }`}
                  >
                    <td
                      className={`py-2.5 px-4 font-sans font-medium ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {item.month}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-semibold ${
                        isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                      }`}
                    >
                      {item.revenue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-rose-500 font-semibold">
                      {item.expenses.toLocaleString()}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-bold ${
                        item.profit >= 0
                          ? isLight
                            ? 'text-teal-700'
                            : 'text-[#00f5c4]'
                          : 'text-rose-500'
                      }`}
                    >
                      {item.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
