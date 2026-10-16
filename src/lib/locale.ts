import type { Language } from './i18n';

/**
 * The language the app is showing right now, readable from anywhere (services, hooks, helpers)
 * without needing React. LanguageProvider keeps it up to date.
 */
let current: Language = 'en';

export const setLocaleLanguage = (lang: Language): void => {
  current = lang;
};
export const getLocaleLanguage = (): Language => current;
export const isSwahili = (): boolean => current === 'sw';

/** Picks the text for the language on screen: tr('Save', 'Hifadhi') */
export const tr = (en: string, sw: string): string => (current === 'sw' ? sw : en);

/** Tanzanian shilling: "TZS" in English, "TSh" in Swahili */
export const currencyLabel = (): string => (current === 'sw' ? 'TSh' : 'TZS');

const tag = (): string => (current === 'sw' ? 'sw-TZ' : 'en-GB');

const toDate = (value: string | number | Date | null | undefined): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** 07 Oct 2026 / 7 Okt 2026, in the language on screen */
export const fmtDate = (value: string | number | Date | null | undefined): string => {
  const d = toDate(value);
  return d ? d.toLocaleDateString(tag(), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

export const fmtDateTime = (value: string | number | Date | null | undefined): string => {
  const d = toDate(value);
  return d
    ? d.toLocaleString(tag(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
};

export const fmtTime = (value: string | number | Date | null | undefined): string => {
  const d = toDate(value);
  return d ? d.toLocaleTimeString(tag(), { hour: '2-digit', minute: '2-digit' }) : '';
};

export const fmtMonthYear = (value: string | number | Date | null | undefined): string => {
  const d = toDate(value);
  return d ? d.toLocaleDateString(tag(), { month: 'short', year: 'numeric' }) : '';
};

// ---------------------------------------------------------------------------
// Error messages that come from the database or the network are in English.
// In Swahili mode they are replaced by a clear Swahili sentence.
// ---------------------------------------------------------------------------
const ENGLISH_HINT =
  /\b(the|is|are|was|were|not|could|couldn't|please|failed|error|cannot|can't|must|already|invalid|permission|denied|violates|row|policy|database|table|constraint|network|fetch|request|sign|password|email|user|duplicate|null|value|key|found|missing|required|exceeded|expired|token|session|jwt|bucket|object|storage|function|schema|cache|relation|column|syntax|timeout|unauthorized|forbidden|access|your|you|this|that|with|from|have|has|been|only|can|will|there|run|file|upload|limit)\b/i;

const KNOWN_SW: [RegExp, string][] = [
  [/row-level security|not allowed|permission denied|access denied|unauthorized|forbidden/i, 'Huna ruhusa ya kufanya kitendo hiki.'],
  [/failed to fetch|network|load failed|timeout|offline/i, 'Hakuna mtandao. Hakiki intaneti yako kisha ujaribu tena.'],
  [/duplicate key|already exists|already registered/i, 'Taarifa hizi tayari zipo.'],
  [/invalid login credentials/i, 'Barua pepe au nenosiri si sahihi.'],
  [/email not confirmed/i, 'Barua pepe yako haijathibitishwa bado.'],
  [/jwt|session|token|expired|not authenticated|sign in required/i, 'Muda wa kuingia umeisha. Tafadhali ingia tena.'],
  [/rate limit|too many/i, 'Majaribio mengi sana. Subiri kidogo kisha ujaribu tena.'],
  [/violates check constraint|violates foreign key|not-null|null value/i, 'Taarifa ulizoweka si sahihi au hazijakamilika.'],
  [/schema cache|could not find the (function|table)|does not exist|relation/i, 'Hifadhidata haijawekwa kikamilifu. Tafadhali endesha SQL ya hivi karibuni kwenye Supabase.'],
];

/**
 * Turns any message into the language on screen. Messages written by this app already come in
 * the right language (via tr); only raw English from the database/network is converted.
 */
export const localizeMessage = (message: unknown, fallbackSw = 'Imeshindikana. Tafadhali jaribu tena.'): string => {
  const text = typeof message === 'string' ? message : (message as { message?: string })?.message || '';
  if (!text) return current === 'sw' ? fallbackSw : 'Something went wrong. Please try again.';
  if (current !== 'sw') return text;
  for (const [re, sw] of KNOWN_SW) if (re.test(text)) return sw;
  return ENGLISH_HINT.test(text) ? fallbackSw : text;
};
