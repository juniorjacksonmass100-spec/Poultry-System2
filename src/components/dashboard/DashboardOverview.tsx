import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { StatCard } from '../common/StatCard';
import { DashboardCharts } from './DashboardCharts';
import { PoultryStock, EggProduction, Sale, Expense, BroodingRecord, FinancialSummary } from '../../types';
import {
  Bird,
  Egg,
  Flame,
  Receipt,
  TrendingDown,
  DollarSign,
  AlertCircle,
  PlusCircle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface DashboardOverviewProps {
  poultry: PoultryStock[];
  eggs: EggProduction[];
  sales: Sale[];
  expenses: Expense[];
  brooding: BroodingRecord[];
  financials: FinancialSummary;
  onNavigate: (tab: NavigationTab) => void;
  onAddPoultry: () => void;
  onAddSale: () => void;
  onAddExpense: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  poultry,
  eggs,
  sales,
  expenses,
  brooding,
  financials,
  onNavigate,
  onAddPoultry,
  onAddSale,
  onAddExpense,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const totalPoultry = poultry.reduce((sum, p) => sum + p.current_quantity, 0);
  const femalePoultry = poultry.reduce((sum, p) => sum + p.female_quantity, 0);
  const malePoultry = poultry.reduce((sum, p) => sum + p.male_quantity, 0);

  const totalEggsCollected = eggs.reduce((sum, e) => sum + e.eggs_collected, 0);
  const totalEggsSold = eggs.reduce((sum, e) => sum + e.eggs_sold, 0);
  const totalEggsRemaining = eggs.reduce((sum, e) => sum + e.remaining_eggs, 0);

  const upcomingHatchings = brooding.filter(
    (b) => b.status === 'Active' || b.status === 'Due soon'
  ).length;

  return (
    <div className="space-y-6">
      {/* Quick Action Ribbon */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
          isLight
            ? 'bg-gradient-to-r from-teal-50 via-emerald-50 to-white border-teal-200 shadow-sm'
            : 'bg-gradient-to-r from-[#031518] via-[#051c20] to-[#08262a] border-[#00f5c4]/35 shadow-[0_0_25px_rgba(0,245,196,0.16)] text-white'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`text-sm font-bold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {t.appName} {t.operationalCockpit}
            </h2>
            <span
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'text-teal-800 bg-teal-100 border-teal-300'
                  : 'text-[#00f5c4] bg-[#00f5c4]/15 border-[#00f5c4]/35 shadow-[0_0_10px_rgba(0,245,196,0.25)]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {t.liveNeonGrid}
            </span>
          </div>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-[#8fbdb8]'
            }`}
          >
            {t.cockpitSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAddPoultry}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#021f1a] bg-[#00f5c4] hover:bg-[#1effd5] rounded-xl transition-all whitespace-nowrap shadow-[0_0_15px_rgba(0,245,196,0.4)] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t.addPoultry}</span>
          </button>
          <button
            onClick={onAddSale}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'text-white hover:text-[#00f5c4] bg-[#072023] hover:bg-[#0c2e32] border border-[#00f5c4]/30 hover:border-[#00f5c4]/70 shadow-xs'
            }`}
          >
            <ShoppingBag
              className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`}
            />
            <span>{t.newSale}</span>
          </button>
          <button
            onClick={onAddExpense}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'text-white hover:text-rose-300 bg-[#072023] hover:bg-[#0c2e32] border border-rose-500/35 hover:border-rose-500/70 shadow-xs'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (10 Core Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          label={t.totalFlock}
          value={totalPoultry}
          subtitle={`${poultry.length} ${t.batchesRegistered}`}
          icon={Bird}
        />
        <StatCard
          label={t.femalePoultryLabel}
          value={femalePoultry}
          subtitle={t.femalePoultrySubtitle}
          icon={Bird}
        />
        <StatCard
          label={t.malePoultryLabel}
          value={malePoultry}
          subtitle={t.malePoultrySubtitle}
          icon={Bird}
        />
        <StatCard
          label={t.eggsCollected}
          value={totalEggsCollected}
          subtitle={`${totalEggsRemaining} ${t.inReserve}`}
          icon={Egg}
        />
        <StatCard
          label={t.eggsSold}
          value={totalEggsSold}
          subtitle={t.soldToCustomers}
          icon={Egg}
        />
        <StatCard
          label={t.upcomingHatchingsLabel}
          value={upcomingHatchings}
          subtitle={t.batchesInIncubation}
          icon={Flame}
        />
        <StatCard
          label={t.totalSales}
          value={`TZS ${financials.totalRevenue.toLocaleString()}`}
          subtitle={`${sales.length} ${t.transactionsCount}`}
          icon={Receipt}
          trend={t.revenueTrend}
          isPositive={true}
        />
        <StatCard
          label={t.totalExpenses}
          value={`TZS ${financials.totalExpenses.toLocaleString()}`}
          subtitle={`${expenses.length} ${t.operatingCostsCount}`}
          icon={TrendingDown}
          trend={t.costsTrend}
          isPositive={false}
        />
        <StatCard
          label={t.netProfit}
          value={`TZS ${financials.netProfit.toLocaleString()}`}
          subtitle={financials.netProfit >= 0 ? t.profitableLabel : t.deficitLabel}
          icon={DollarSign}
          trend={financials.netProfit >= 0 ? '+ Surplus' : '- Deficit'}
          isPositive={financials.netProfit >= 0}
        />
        <StatCard
          label={t.outstandingBalancesLabel}
          value={`TZS ${financials.totalOutstandingBalance.toLocaleString()}`}
          subtitle={t.uncollectedReceivables}
          icon={AlertCircle}
          trend={financials.totalOutstandingBalance > 0 ? t.receivablesStatus : t.clearStatus}
          isPositive={financials.totalOutstandingBalance === 0}
        />
      </div>

      {/* Visual Analytics Charts using real records */}
      <div>
        <DashboardCharts
          sales={sales}
          expenses={expenses}
          poultry={poultry}
          eggs={eggs}
        />
      </div>
    </div>
  );
};
