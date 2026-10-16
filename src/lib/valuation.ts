import { PoultryStock, PoultryValuation, Sale, Expense } from '../types';

/**
 * Net worth and selling-price maths for the farm. Pure functions (no database,
 * no screen code) so the numbers can be tested and always come out the same.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_MARGIN_PERCENT = 20;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toTime = (iso: string | null | undefined): number => {
  if (!iso) return NaN;
  const t = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).getTime();
  return t;
};

/** Whole days between two timestamps, never less than 1. */
const daysBetween = (fromMs: number, toMs: number): number =>
  Math.max(1, Math.floor((toMs - fromMs) / DAY_MS));

// ------------------------------------------------------------------------------
// FARM NET WORTH
// ------------------------------------------------------------------------------
export interface FarmNetWorth {
  /** Birds still on the farm x the worth entered for each flock */
  livestockValue: number;
  /** Cash received from customers minus everything spent (can be negative) */
  cashPosition: number;
  /** Money customers still owe you */
  receivables: number;
  totalInvested: number;
  netWorth: number;
  /** Net worth as a percentage of what was invested. null if nothing invested yet. */
  returnPercent: number | null;
  flocksValued: number;
  flocksWithoutValue: number;
  /** Live birds that have no worth entered (so they count as 0 in livestockValue) */
  birdsWithoutValue: number;
  totalLiveBirds: number;
}

export const calculateNetWorth = (
  stocks: PoultryStock[],
  sales: Sale[],
  expenses: Expense[]
): FarmNetWorth => {
  let livestockValue = 0;
  let flocksValued = 0;
  let flocksWithoutValue = 0;
  let birdsWithoutValue = 0;
  let totalLiveBirds = 0;

  for (const s of stocks) {
    const live = Math.max(0, num(s.current_quantity));
    if (live <= 0) continue;
    totalLiveBirds += live;
    const unit = num(s.unit_value);
    if (unit > 0) {
      livestockValue += live * unit;
      flocksValued += 1;
    } else {
      flocksWithoutValue += 1;
      birdsWithoutValue += live;
    }
  }

  const cashReceived = sales.reduce((sum, x) => sum + num(x.amount_paid), 0);
  const receivables = sales.reduce((sum, x) => sum + num(x.balance), 0);
  const directExpenses = expenses.reduce((sum, x) => sum + num(x.amount), 0);
  const purchaseCost = stocks.reduce((sum, x) => sum + num(x.purchase_cost), 0);

  const totalInvested = directExpenses + purchaseCost;
  const cashPosition = cashReceived - totalInvested;
  const netWorth = livestockValue + cashPosition + receivables;

  return {
    livestockValue,
    cashPosition,
    receivables,
    totalInvested,
    netWorth,
    returnPercent: totalInvested > 0 ? (netWorth / totalInvested) * 100 : null,
    flocksValued,
    flocksWithoutValue,
    birdsWithoutValue,
    totalLiveBirds,
  };
};

// ------------------------------------------------------------------------------
// EXPENSE SHARING BETWEEN FLOCKS
// ------------------------------------------------------------------------------
interface FlockLife {
  id: string;
  start: number;
  /** null = still on the farm */
  end: number | null;
  weight: number;
}

const buildLives = (stocks: PoultryStock[], sales: Sale[]): FlockLife[] =>
  stocks.map((s) => {
    const start = toTime(s.date_acquired);
    let end: number | null = null;
    if (num(s.current_quantity) <= 0) {
      // Flock is gone: its life ended at its last sale (or last edit if no sale is linked)
      const lastSale = sales
        .filter((x) => x.stock_id === s.id)
        .map((x) => toTime(x.sale_date))
        .filter((t) => Number.isFinite(t));
      end = lastSale.length > 0 ? Math.max(...lastSale) : toTime(s.updated_at);
      if (!Number.isFinite(end as number)) end = start;
    }
    return { id: s.id, start: Number.isFinite(start) ? start : 0, end, weight: Math.max(1, num(s.initial_quantity)) };
  });

/**
 * Shares every expense between the flocks that were on the farm on the day it was
 * paid, in proportion to flock size. Expenses from a day with no flock on the farm
 * (e.g. building a coop first) are shared between all flocks.
 */
export const allocateExpenses = (
  stocks: PoultryStock[],
  sales: Sale[],
  expenses: Expense[]
): Record<string, number> => {
  const lives = buildLives(stocks, sales);
  const result: Record<string, number> = {};
  for (const l of lives) result[l.id] = 0;
  if (lives.length === 0) return result;

  for (const e of expenses) {
    const amount = num(e.amount);
    if (amount <= 0) continue;
    const when = toTime(e.expense_date);

    let present = Number.isFinite(when)
      ? lives.filter((l) => l.start <= when && (l.end === null || when <= l.end))
      : [];
    if (present.length === 0) present = lives;

    const totalWeight = present.reduce((sum, l) => sum + l.weight, 0);
    for (const l of present) {
      result[l.id] += amount * (l.weight / totalWeight);
    }
  }
  return result;
};

// ------------------------------------------------------------------------------
// VALUATION HISTORY
// ------------------------------------------------------------------------------
export interface ValuationStats {
  latest: number;
  /** Average worth over the whole time on the farm (each value counts for as long as it stood) */
  average: number;
  /** Change from the previous estimate to the latest, in percent. null if only one estimate. */
  trendPercent: number | null;
  points: number;
}

export const valuationStats = (
  stock: PoultryStock,
  history: PoultryValuation[],
  nowMs: number = Date.now()
): ValuationStats => {
  const pts = history
    .filter((h) => h.stock_id === stock.id && num(h.unit_value) > 0)
    .map((h) => ({ t: toTime(h.recorded_at), v: num(h.unit_value) }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);

  const current = num(stock.unit_value);

  if (pts.length === 0) {
    return { latest: current, average: current, trendPercent: null, points: current > 0 ? 1 : 0 };
  }

  const latest = current > 0 ? current : pts[pts.length - 1].v;

  let weighted = 0;
  let span = 0;
  for (let i = 0; i < pts.length; i++) {
    const to = i + 1 < pts.length ? pts[i + 1].t : Math.max(nowMs, pts[i].t);
    const dur = Math.max(0, to - pts[i].t);
    weighted += pts[i].v * dur;
    span += dur;
  }
  const average =
    span >= DAY_MS
      ? weighted / span
      : pts.reduce((sum, p) => sum + p.v, 0) / pts.length; // everything entered within a day: plain average

  let trendPercent: number | null = null;
  if (pts.length >= 2) {
    const prev = pts[pts.length - 2].v;
    trendPercent = prev > 0 ? ((pts[pts.length - 1].v - prev) / prev) * 100 : null;
  }

  return { latest, average, trendPercent, points: pts.length };
};

// ------------------------------------------------------------------------------
// RECOMMENDED SELLING PRICE
// ------------------------------------------------------------------------------
export type AdviceCode =
  | 'no_valuation'
  | 'below_cost'
  | 'below_target'
  | 'good_time'
  | 'no_survivors';

export interface FlockPricing {
  stock: PoultryStock;
  ageDays: number;
  liveBirds: number;
  /** Birds that did not die: the ones the whole cost has to be recovered from */
  survivingBirds: number;
  purchaseCost: number;
  allocatedExpenses: number;
  totalCost: number;
  /** Cost of raising one surviving bird so far. Selling below this loses money. */
  costPerBird: number;
  revenueFromFlock: number;
  paidOff: boolean;
  stats: ValuationStats;
  /** Latest worth blended with the average worth over its time on the farm */
  marketReference: number;
  /** Lowest price with no loss */
  minPrice: number;
  /** Suggested price */
  recommendedPrice: number;
  /** Optimistic price for a patient sale */
  premiumPrice: number;
  /** Feed and other running cost for one bird per day, from the last 30 days */
  dailyRunningCostPerBird: number;
  /** Profit on the remaining birds if sold at the recommended price */
  expectedProfit: number;
  livestockValue: number;
  advice: AdviceCode;
}

const roundTo100 = (n: number) => Math.round(n / 100) * 100;
const ceilTo100 = (n: number) => Math.ceil(n / 100) * 100;

export const calculatePricing = (
  stocks: PoultryStock[],
  sales: Sale[],
  expenses: Expense[],
  history: PoultryValuation[],
  marginPercent: number = DEFAULT_MARGIN_PERCENT,
  nowMs: number = Date.now()
): FlockPricing[] => {
  const margin = Math.max(0, num(marginPercent)) / 100;
  const allocated = allocateExpenses(stocks, sales, expenses);

  // Running cost over the last 30 days, shared the same way
  const cutoff = nowMs - 30 * DAY_MS;
  const recentExpenses = expenses.filter((e) => {
    const t = toTime(e.expense_date);
    return Number.isFinite(t) && t >= cutoff;
  });
  const allocatedRecent = allocateExpenses(stocks, sales, recentExpenses);

  return stocks
    .filter((s) => num(s.current_quantity) > 0)
    .map((stock): FlockPricing => {
      const start = toTime(stock.date_acquired);
      const ageDays = Number.isFinite(start) ? daysBetween(start, nowMs) : 1;
      const liveBirds = Math.max(0, num(stock.current_quantity));
      const survivingBirds = Math.max(0, num(stock.initial_quantity) - num(stock.mortality));

      const purchaseCost = num(stock.purchase_cost);
      const allocatedExpenses = allocated[stock.id] || 0;
      const totalCost = purchaseCost + allocatedExpenses;

      const revenueFromFlock = sales
        .filter((x) => x.stock_id === stock.id)
        .reduce((sum, x) => sum + num(x.total_amount), 0);

      const stats = valuationStats(stock, history, nowMs);
      const marketReference =
        stats.latest > 0 ? 0.6 * stats.latest + 0.4 * (stats.average > 0 ? stats.average : stats.latest) : 0;

      const costPerBird = survivingBirds > 0 ? totalCost / survivingBirds : 0;
      const minPrice = ceilTo100(costPerBird);
      const target = costPerBird * (1 + margin);
      const halfTarget = costPerBird * (1 + margin / 2);

      let recommended: number;
      if (marketReference <= 0) {
        recommended = target;
      } else if (marketReference >= target) {
        recommended = marketReference;
      } else {
        recommended = Math.max(marketReference, halfTarget);
      }
      // Never recommend selling below cost
      recommended = Math.max(roundTo100(recommended), minPrice);
      const premium = Math.max(roundTo100(Math.max(recommended * 1.15, target)), recommended);

      const windowDays = Math.min(30, ageDays);
      const dailyRunningCostPerBird =
        liveBirds > 0 ? (allocatedRecent[stock.id] || 0) / (liveBirds * windowDays) : 0;

      let advice: AdviceCode;
      if (survivingBirds <= 0) advice = 'no_survivors';
      else if (stats.latest <= 0) advice = 'no_valuation';
      else if (stats.latest < minPrice) advice = 'below_cost';
      else if (stats.latest < roundTo100(target)) advice = 'below_target';
      else advice = 'good_time';

      return {
        stock,
        ageDays,
        liveBirds,
        survivingBirds,
        purchaseCost,
        allocatedExpenses,
        totalCost,
        costPerBird,
        revenueFromFlock,
        paidOff: totalCost > 0 && revenueFromFlock >= totalCost,
        stats,
        marketReference,
        minPrice,
        recommendedPrice: recommended,
        premiumPrice: premium,
        dailyRunningCostPerBird,
        expectedProfit: (recommended - costPerBird) * liveBirds,
        livestockValue: stats.latest > 0 ? stats.latest * liveBirds : 0,
        advice,
      };
    });
};

/** Turns "total worth of the whole flock" into worth per bird, for the entry form. */
export const perBirdFromTotal = (total: number, birds: number): number =>
  birds > 0 ? Math.round((num(total) / birds) * 100) / 100 : 0;
