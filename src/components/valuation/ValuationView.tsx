import React, { useMemo, useState } from 'react';
import { Scale, TrendingUp, TrendingDown, Pencil, Info, Wallet, Bird, Landmark, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Expense, PoultryStock, PoultryValuation, Sale } from '../../types';
import {
  calculateNetWorth,
  calculatePricing,
  DEFAULT_MARGIN_PERCENT,
  FlockPricing,
} from '../../lib/valuation';

import { poultryTypeLabel } from '../../lib/labels';
import { currencyLabel, tr } from '../../lib/locale';
interface ValuationViewProps {
  poultry: PoultryStock[];
  sales: Sale[];
  expenses: Expense[];
  valuations: PoultryValuation[];
  onEditFlock: (stock: PoultryStock) => void;
  onAddFlock: () => void;
}

const MARGIN_KEY = 'kukutrack_margin_percent';
const tzs = (n: number) => `${currencyLabel()} ${Math.round(n).toLocaleString()}`;

const readMargin = (): number => {
  try {
    const v = Number(localStorage.getItem(MARGIN_KEY));
    return Number.isFinite(v) && v >= 0 && v <= 500 && localStorage.getItem(MARGIN_KEY) !== null ? v : DEFAULT_MARGIN_PERCENT;
  } catch {
    return DEFAULT_MARGIN_PERCENT;
  }
};

/** Tiny line chart of one flock's worth history (no chart library needed). */
const Sparkline: React.FC<{ points: { t: number; v: number }[]; isLight: boolean }> = ({ points, isLight }) => {
  if (points.length < 2) return null;
  const w = 220;
  const h = 48;
  const minV = Math.min(...points.map((p) => p.v));
  const maxV = Math.max(...points.map((p) => p.v));
  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  const x = (t: number) => (maxT === minT ? w / 2 : ((t - minT) / (maxT - minT)) * (w - 8) + 4);
  const y = (v: number) => (maxV === minV ? h / 2 : h - 6 - ((v - minV) / (maxV - minV)) * (h - 12));
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const stroke = isLight ? '#0f766e' : '#00f5c4';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[220px] h-12" role="img" aria-label={tr('Worth history', 'Historia ya thamani')}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.t)} cy={y(p.v)} r="2.5" fill={stroke} />
      ))}
    </svg>
  );
};

export const ValuationView: React.FC<ValuationViewProps> = ({
  poultry,
  sales,
  expenses,
  valuations,
  onEditFlock,
  onAddFlock,
}) => {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [margin, setMargin] = useState<number>(readMargin);
  const updateMargin = (v: number) => {
    const clean = Math.max(0, Math.min(500, v));
    setMargin(clean);
    try {
      localStorage.setItem(MARGIN_KEY, String(clean));
    } catch {
      // setting still applies for this session
    }
  };

  const netWorth = useMemo(() => calculateNetWorth(poultry, sales, expenses), [poultry, sales, expenses]);
  const pricing = useMemo(
    () => calculatePricing(poultry, sales, expenses, valuations, margin),
    [poultry, sales, expenses, valuations, margin]
  );

  const card = `border rounded-2xl p-4 ${
    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#071a1c] border-[#00f5c4]/20'
  }`;
  const muted = isLight ? 'text-slate-500' : 'text-[#8fbdb8]';
  const strong = isLight ? 'text-slate-900' : 'text-white';

  const adviceText = (p: FlockPricing): { tone: 'good' | 'warn' | 'bad' | 'info'; text: string } => {
    const weekly = p.dailyRunningCostPerBird * 7;
    const weeklyTxt = weekly > 0 ? (isSw ? ` Kila wiki ya ziada inagharimu takriban ${tzs(weekly)} kwa ndege.` : ` Each extra week of feeding costs about ${tzs(weekly)} per bird.`) : '';
    switch (p.advice) {
      case 'no_valuation':
        return {
          tone: 'info',
          text: isSw
            ? 'Hujaweka thamani ya sasa. Bei hii inatokana na gharama pamoja na faida unayolenga tu. Weka thamani ili ipate usahihi zaidi.'
            : 'No current worth entered yet, so this price is based on cost plus your target profit only. Enter a worth for a more accurate price.',
        };
      case 'no_survivors':
        return { tone: 'bad', text: isSw ? 'Ndege wote wa kundi hili walikufa, hakuna bei ya kupendekeza.' : 'Every bird in this flock is recorded as dead, so no price can be recommended.' };
      case 'below_cost':
        return {
          tone: 'bad',
          text:
            (isSw
              ? `Thamani yako ya sasa (${tzs(p.stats.latest)}) iko chini ya gharama (${tzs(p.costPerBird)} kwa ndege). Kuuza chini ya ${tzs(p.minPrice)} ni hasara. Subiri bei nzuri au punguza gharama.`
              : `Your current worth (${tzs(p.stats.latest)}) is below what each bird cost (${tzs(p.costPerBird)}). Selling under ${tzs(p.minPrice)} is a loss. Hold for a better buyer or cut costs.`) + weeklyTxt,
        };
      case 'below_target':
        return {
          tone: 'warn',
          text:
            (isSw
              ? `Faida ipo lakini chini ya lengo la ${margin}%. Unaweza kuuza kwa bei iliyopendekezwa au kusubiri ongezeko la thamani.`
              : `You would profit, but below your ${margin}% target. Sell at the recommended price, or wait for the worth to rise.`) + weeklyTxt,
        };
      default:
        return {
          tone: 'good',
          text:
            (isSw
              ? 'Thamani iko juu ya gharama pamoja na faida unayolenga. Ni wakati mzuri wa kuuza.'
              : 'Worth is above cost plus your target profit. This is a good time to sell.') + weeklyTxt,
        };
    }
  };

  const toneClass = (tone: 'good' | 'warn' | 'bad' | 'info') =>
    tone === 'good'
      ? isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'
      : tone === 'warn'
      ? isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-400/40 text-amber-200'
      : tone === 'bad'
      ? isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-500/10 border-rose-400/40 text-rose-200'
      : isLight ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-sky-500/10 border-sky-400/40 text-sky-200';

  const nwPositive = netWorth.netWorth >= 0;

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* ------------------------------ NET WORTH ------------------------------ */}
      <section className={`${card} space-y-4`}>
        <div className="flex items-center gap-2">
          <Landmark className={`w-5 h-5 ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`} />
          <h2 className={`text-base font-bold ${strong}`}>{isSw ? 'Thamani Halisi ya Shamba' : 'Farm Net Worth'}</h2>
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
          <div>
            <div className={`text-3xl font-bold font-mono tabular-numbers ${nwPositive ? (isLight ? 'text-teal-700' : 'text-[#00f5c4]') : 'text-rose-500'}`}>
              {netWorth.netWorth < 0 ? '-' : ''}{tzs(Math.abs(netWorth.netWorth))}
            </div>
            <div className={`text-xs ${muted}`}>
              {isSw ? 'Mali zote ukiondoa kila ulichowekeza' : 'Everything the farm has, after everything spent'}
            </div>
          </div>
          {netWorth.returnPercent !== null && (
            <div className={`text-sm font-semibold ${nwPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netWorth.returnPercent >= 0 ? '+' : ''}
              {netWorth.returnPercent.toFixed(1)}% {isSw ? 'ya uwekezaji' : 'return on money invested'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Bird, label: isSw ? 'Thamani ya ndege' : 'Birds on the farm', value: netWorth.livestockValue, sub: `${netWorth.totalLiveBirds.toLocaleString()} ${isSw ? 'ndege' : 'birds'}`, sign: '' },
            { icon: Wallet, label: isSw ? 'Pesa mkononi' : 'Cash (received − spent)', value: netWorth.cashPosition, sub: isSw ? 'Mapato yaliyopokelewa ukiondoa matumizi' : 'Money in, minus all spending', sign: '' },
            { icon: TrendingUp, label: isSw ? 'Wateja wanakudai' : 'Customers owe you', value: netWorth.receivables, sub: isSw ? 'Madeni ya mauzo' : 'Unpaid sale balances', sign: '' },
            { icon: TrendingDown, label: isSw ? 'Jumla iliyowekezwa' : 'Total spent so far', value: netWorth.totalInvested, sub: isSw ? 'Ndege + gharama zote' : 'Birds bought + all expenses', sign: '' },
          ].map((c, i) => (
            <div key={i} className={`rounded-xl border p-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#04100f] border-[#00f5c4]/15'}`}>
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${muted}`}>
                <c.icon className="w-3.5 h-3.5" /> {c.label}
              </div>
              <div className={`mt-1 text-sm font-bold font-mono tabular-numbers ${c.value < 0 ? 'text-rose-500' : strong}`}>
                {c.value < 0 ? '-' : ''}{tzs(Math.abs(c.value))}
              </div>
              <div className={`text-[10px] ${muted}`}>{c.sub}</div>
            </div>
          ))}
        </div>

        {netWorth.flocksWithoutValue > 0 && (
          <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${toneClass('warn')}`}>
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {isSw
                ? `Makundi ${netWorth.flocksWithoutValue} (ndege ${netWorth.birdsWithoutValue.toLocaleString()}) hayana thamani. Yanahesabiwa kama sifuri hadi uweke thamani kwenye Kuku.`
                : `${netWorth.flocksWithoutValue} flock(s) (${netWorth.birdsWithoutValue.toLocaleString()} birds) have no worth entered, so they count as zero. Add a worth under Flock Inventory for a true figure.`}
            </span>
          </div>
        )}

        <p className={`text-[11px] leading-relaxed ${muted}`}>
          {isSw
            ? 'Thamani halisi = thamani ya ndege waliopo + pesa taslimu zilizopokelewa + madeni ya wateja − matumizi yote na gharama ya kununua ndege. Inalingana na faida halisi kwenye ukurasa wa Fedha pamoja na thamani ya ndege.'
            : 'Net worth = value of birds on the farm + cash received + customer balances − all expenses and the cost of buying birds. It equals the net profit on the Financials page plus the value of your birds.'}
        </p>
      </section>

      {/* ------------------------------ PRICING ------------------------------ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className={`w-5 h-5 ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`} />
            <h2 className={`text-base font-bold ${strong}`}>{isSw ? 'Bei Inayopendekezwa ya Kuuza' : 'Recommended Selling Price'}</h2>
          </div>
          <label className={`flex items-center gap-2 text-xs font-semibold ${muted}`}>
            {isSw ? 'Faida unayolenga' : 'Target profit'}
            <input
              type="number"
              min="0"
              max="500"
              inputMode="decimal"
              value={margin}
              onChange={(e) => updateMargin(parseFloat(e.target.value) || 0)}
              className={`w-16 border rounded-lg px-2 py-1 text-xs font-mono text-right ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#040c0c] border-[#00f5c4]/25 text-white'}`}
            />
            %
          </label>
        </div>

        <p className={`text-[11px] leading-relaxed ${muted}`}>
          {isSw
            ? 'Bei hutokana na gharama halisi ya kila ndege (ununuzi + sehemu ya matumizi ya shamba kulingana na muda waliokaa na ukubwa wa kundi, ndege waliokufa wakihesabiwa), pamoja na thamani uliyoweka sasa na wastani wa thamani zote tangu waingie shambani.'
            : 'The price comes from the real cost of each bird (purchase + a fair share of farm expenses based on how long and how big the flock was, with deaths counted), combined with the worth you entered now and the average of every worth you entered since they arrived.'}
        </p>

        {pricing.length === 0 ? (
          <div className={`${card} text-center py-10 space-y-3`}>
            <Sparkles className={`w-8 h-8 mx-auto ${muted}`} />
            <p className={`text-sm ${muted}`}>{isSw ? 'Hakuna ndege shambani bado.' : 'There are no birds on the farm yet.'}</p>
            <button
              onClick={onAddFlock}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'}`}
            >
              {isSw ? 'Ongeza kundi' : 'Add a flock'}
            </button>
          </div>
        ) : (
          pricing.map((p) => {
            const advice = adviceText(p);
            const histPts = valuations
              .filter((v) => v.stock_id === p.stock.id)
              .map((v) => ({ t: new Date(v.recorded_at).getTime(), v: Number(v.unit_value) }))
              .sort((a, b) => a.t - b.t);
            const valuedDaysAgo = p.stock.valuation_updated_at
              ? Math.floor((Date.now() - new Date(p.stock.valuation_updated_at).getTime()) / 86400000)
              : null;

            return (
              <div key={p.stock.id} className={`${card} space-y-3.5`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className={`text-sm font-bold ${strong}`}>
                      {p.stock.breed} <span className={`font-medium ${muted}`}>· {poultryTypeLabel(p.stock.poultry_type)}</span>
                    </div>
                    <div className={`text-[11px] ${muted}`}>
                      {p.liveBirds.toLocaleString()} {isSw ? 'ndege' : 'birds'} · {p.ageDays} {isSw ? 'siku shambani' : 'days on the farm'}
                      {valuedDaysAgo !== null && (
                        <> · {isSw ? 'thamani iliwekwa' : 'worth set'} {valuedDaysAgo === 0 ? (isSw ? 'leo' : 'today') : `${valuedDaysAgo} ${isSw ? 'siku zilizopita' : 'days ago'}`}</>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onEditFlock(p.stock)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold ${
                      isLight ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-[#00f5c4]/10 border-[#00f5c4]/40 text-[#00f5c4]'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {isSw ? 'Badilisha thamani' : 'Update worth'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: isSw ? 'Bei ya chini (bila hasara)' : 'Lowest price (no loss)', value: p.minPrice, tone: isLight ? 'text-slate-700' : 'text-[#c4dedc]' },
                    { label: isSw ? 'Bei inayopendekezwa' : 'Recommended price', value: p.recommendedPrice, tone: isLight ? 'text-teal-700' : 'text-[#00f5c4]', big: true },
                    { label: isSw ? 'Bei ya juu (kusubiri)' : 'Best price (if you can wait)', value: p.premiumPrice, tone: isLight ? 'text-amber-700' : 'text-amber-300' },
                  ].map((x, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-3 ${x.big ? (isLight ? 'bg-teal-50 border-teal-300' : 'bg-[#00f5c4]/10 border-[#00f5c4]/40') : isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#04100f] border-[#00f5c4]/15'}`}
                    >
                      <div className={`text-[11px] font-semibold ${muted}`}>{x.label}</div>
                      <div className={`font-bold font-mono tabular-numbers ${x.big ? 'text-xl' : 'text-base'} ${x.tone}`}>
                        {p.advice === 'no_survivors' ? '—' : tzs(x.value)}
                      </div>
                      <div className={`text-[10px] ${muted}`}>{isSw ? 'kwa ndege mmoja' : 'per bird'}</div>
                    </div>
                  ))}
                </div>

                <div className={`rounded-xl border p-3 text-xs leading-relaxed ${toneClass(advice.tone)}`}>{advice.text}</div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 text-[11px]">
                  <div>
                    <div className={muted}>{isSw ? 'Gharama kwa ndege' : 'Cost per surviving bird'}</div>
                    <div className={`font-mono font-semibold ${strong}`}>{tzs(p.costPerBird)}</div>
                  </div>
                  <div>
                    <div className={muted}>{isSw ? 'Ununuzi + matumizi' : 'Purchase + share of expenses'}</div>
                    <div className={`font-mono font-semibold ${strong}`}>{tzs(p.purchaseCost)} + {tzs(p.allocatedExpenses)}</div>
                  </div>
                  <div>
                    <div className={muted}>{isSw ? 'Wastani wa thamani (muda wote)' : 'Average worth (all time)'}</div>
                    <div className={`font-mono font-semibold ${strong}`}>{p.stats.average > 0 ? tzs(p.stats.average) : '—'}</div>
                  </div>
                  <div>
                    <div className={muted}>{isSw ? 'Faida ikiuzwa kwa bei hii' : 'Profit if all sold at this price'}</div>
                    <div className={`font-mono font-semibold ${p.expectedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {p.expectedProfit < 0 ? '-' : ''}{tzs(Math.abs(p.expectedProfit))}
                    </div>
                  </div>
                  <div>
                    <div className={muted}>{isSw ? 'Gharama ya kila siku kwa ndege' : 'Running cost per bird / day'}</div>
                    <div className={`font-mono font-semibold ${strong}`}>{p.dailyRunningCostPerBird > 0 ? tzs(p.dailyRunningCostPerBird) : '—'}</div>
                  </div>
                  {p.stats.trendPercent !== null && (
                    <div>
                      <div className={muted}>{isSw ? 'Mabadiliko ya thamani' : 'Worth change (last update)'}</div>
                      <div className={`font-mono font-semibold ${p.stats.trendPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {p.stats.trendPercent >= 0 ? '+' : ''}{p.stats.trendPercent.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {p.paidOff && (
                    <div className="col-span-2">
                      <div className="font-semibold text-emerald-500">
                        {isSw ? 'Kundi hili tayari limelipa gharama zake kupitia mauzo.' : 'This flock has already paid back its cost through sales.'}
                      </div>
                    </div>
                  )}
                </div>

                {histPts.length >= 2 && (
                  <div className="flex items-center gap-3">
                    <Sparkline points={histPts} isLight={isLight} />
                    <div className={`text-[10px] ${muted}`}>
                      {isSw ? 'Historia ya thamani' : 'Worth history'} ({histPts.length} {isSw ? 'rekodi' : 'entries'})
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
