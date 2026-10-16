import { Sale, Expense, PoultryStock, EggProduction, FinancialSummary } from '../types';

export const calculateFinancials = (
  sales: Sale[],
  expenses: Expense[],
  poultryStocks: PoultryStock[],
  eggProductions: EggProduction[]
): FinancialSummary => {
  // Sales Revenue
  const salesRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  
  // Total cash received from sales
  const cashReceived = sales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);

  // Outstanding balances owed by customers
  const totalOutstandingBalance = sales.reduce((sum, s) => sum + Number(s.balance || 0), 0);

  // Total expenses
  const directExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  
  // Poultry stock purchase costs
  const poultryPurchaseCost = poultryStocks.reduce((sum, p) => sum + Number(p.purchase_cost || 0), 0);

  // Breakdown by category
  let feedExpenses = 0;
  let medicationExpenses = 0;
  let otherExpenses = 0;

  expenses.forEach((e) => {
    const cat = (e.category || '').toLowerCase();
    const amt = Number(e.amount || 0);
    if (cat.includes('feed') || cat.includes('chakula')) {
      feedExpenses += amt;
    } else if (cat.includes('medication') || cat.includes('vaccine') || cat.includes('chanjo') || cat.includes('dawa')) {
      medicationExpenses += amt;
    } else {
      otherExpenses += amt;
    }
  });

  const totalExpenses = directExpenses + poultryPurchaseCost;
  const totalRevenue = salesRevenue;
  const grossProfit = totalRevenue - poultryPurchaseCost;
  const netProfit = totalRevenue - totalExpenses;

  // Monthly breakdown
  const monthlyMap = new Map<string, { revenue: number; expenses: number }>();

  sales.forEach((s) => {
    if (!s.sale_date) return;
    const monthKey = s.sale_date.substring(0, 7); // YYYY-MM
    const current = monthlyMap.get(monthKey) || { revenue: 0, expenses: 0 };
    current.revenue += Number(s.total_amount || 0);
    monthlyMap.set(monthKey, current);
  });

  expenses.forEach((e) => {
    if (!e.expense_date) return;
    const monthKey = e.expense_date.substring(0, 7);
    const current = monthlyMap.get(monthKey) || { revenue: 0, expenses: 0 };
    current.expenses += Number(e.amount || 0);
    monthlyMap.set(monthKey, current);
  });

  poultryStocks.forEach((p) => {
    if (!p.date_acquired) return;
    const monthKey = p.date_acquired.substring(0, 7);
    const current = monthlyMap.get(monthKey) || { revenue: 0, expenses: 0 };
    current.expenses += Number(p.purchase_cost || 0);
    monthlyMap.set(monthKey, current);
  });

  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  const monthlyBreakdown = sortedMonths.map((m) => {
    const item = monthlyMap.get(m)!;
    return {
      month: m,
      revenue: item.revenue,
      expenses: item.expenses,
      profit: item.revenue - item.expenses,
    };
  });

  return {
    totalRevenue,
    totalExpenses,
    grossProfit,
    netProfit,
    poultryPurchaseCost,
    feedExpenses,
    medicationExpenses,
    otherExpenses,
    totalOutstandingBalance,
    cashReceived,
    monthlyBreakdown,
  };
};
