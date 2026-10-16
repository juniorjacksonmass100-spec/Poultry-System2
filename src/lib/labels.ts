import { getLocaleLanguage } from './locale';

/**
 * Display names for the values the database stores in English ("layer", "Live birds", "Feed", ...).
 * The stored value never changes (reports and totals depend on it); only what the person reads does.
 * Anything not in the list (a type or category the farmer typed themselves) is shown exactly as typed.
 */
type Pair = { en: string; sw: string };
const pick = (p: Pair): string => (getLocaleLanguage() === 'sw' ? p.sw : p.en);
const find = (table: Record<string, Pair>, value: string | null | undefined): Pair | null => {
  if (!value) return null;
  return table[value] || table[value.toLowerCase()] || table[value.replace(/\s+/g, '_').toLowerCase()] || null;
};
const tidy = (v: string) => v.replace(/_/g, ' ').trim();

// ---- kinds of birds (chickens are "kuku"; the others have their own names)
const POULTRY: Record<string, Pair> = {
  indigenous_chicken: { en: 'Indigenous Chicken', sw: 'Kuku wa Kienyeji' },
  crossbred_chicken: { en: 'Crossbred Chicken', sw: 'Kuku wa Chotara' },
  broiler: { en: 'Broiler Chicken', sw: 'Kuku wa Nyama' },
  layer: { en: 'Layer Chicken', sw: 'Kuku wa Mayai' },
  chicken: { en: 'Chicken', sw: 'Kuku' },
  duck: { en: 'Duck', sw: 'Bata' },
  turkey: { en: 'Turkey', sw: 'Bata Mzinga' },
  quail: { en: 'Quail', sw: 'Kware' },
  guinea_fowl: { en: 'Guinea Fowl', sw: 'Kanga' },
  goose: { en: 'Goose', sw: 'Bata Bukini' },
  other: { en: 'Other Birds', sw: 'Ndege Wengine' },
};
export const poultryTypeLabel = (v: string | null | undefined): string => {
  const hit = find(POULTRY, v);
  return hit ? pick(hit) : tidy(v || '');
};

// ---- what was sold
const PRODUCT: Record<string, Pair> = {
  'live birds': { en: 'Live Birds', sw: 'Ndege Hai' },
  eggs: { en: 'Eggs', sw: 'Mayai' },
  chicks: { en: 'Chicks', sw: 'Vifaranga' },
  meat: { en: 'Poultry Meat', sw: 'Nyama ya Ndege' },
  manure: { en: 'Manure', sw: 'Mbolea' },
  other: { en: 'Other', sw: 'Nyingine' },
};
export const productLabel = (v: string | null | undefined): string => {
  const hit = find(PRODUCT, v);
  return hit ? pick(hit) : v || '';
};

// ---- hatching batch status
const STATUS: Record<string, Pair> = {
  active: { en: 'In progress', sw: 'Inaendelea' },
  'due soon': { en: 'Due soon', sw: 'Inakaribia Kutotolewa' },
  hatched: { en: 'Hatched', sw: 'Imetotolewa' },
  failed: { en: 'Failed', sw: 'Haikufanikiwa' },
  completed: { en: 'Completed', sw: 'Imekamilika' },
};
export const statusLabel = (v: string | null | undefined): string => {
  const hit = find(STATUS, v);
  return hit ? pick(hit) : v || '';
};

// ---- how it was paid
const PAYMENT: Record<string, Pair> = {
  cash: { en: 'Cash', sw: 'Pesa Taslimu' },
  'm-pesa': { en: 'Mobile Money', sw: 'Pesa za Simu' },
  mobile_money: { en: 'Mobile Money', sw: 'Pesa za Simu' },
  'bank transfer': { en: 'Bank Transfer', sw: 'Uhamisho wa Benki' },
  bank_transfer: { en: 'Bank Transfer', sw: 'Uhamisho wa Benki' },
  credit: { en: 'Credit', sw: 'Mkopo / Deni' },
  other: { en: 'Other', sw: 'Nyingine' },
};
export const paymentLabel = (v: string | null | undefined): string => {
  const hit = find(PAYMENT, v);
  return hit ? pick(hit) : v || '';
};

// ---- expense categories that come with the app
const CATEGORY: Record<string, Pair> = {
  feed: { en: 'Feed', sw: 'Chakula' },
  vaccines: { en: 'Vaccines', sw: 'Chanjo' },
  medication: { en: 'Medication', sw: 'Dawa' },
  labour: { en: 'Labour', sw: 'Vibarua' },
  labor: { en: 'Labour', sw: 'Vibarua' },
  transport: { en: 'Transport', sw: 'Usafiri' },
  housing: { en: 'Housing', sw: 'Banda' },
  equipment: { en: 'Equipment', sw: 'Vifaa' },
  electricity: { en: 'Electricity', sw: 'Umeme' },
  water: { en: 'Water', sw: 'Maji' },
  packaging: { en: 'Packaging', sw: 'Vifungashio' },
  'poultry purchase': { en: 'Bird purchase', sw: 'Ununuzi wa Ndege' },
  repairs: { en: 'Repairs', sw: 'Matengenezo' },
  other: { en: 'Other', sw: 'Mengineyo' },
};
export const categoryLabel = (v: string | null | undefined): string => {
  const hit = find(CATEGORY, v);
  return hit ? pick(hit) : v || '';
};

// ---- who can do what
const ROLE: Record<string, Pair> = {
  admin: { en: 'Admin', sw: 'Msimamizi' },
  staff: { en: 'Staff', sw: 'Mfanyakazi' },
};
export const roleLabel = (v: string | null | undefined): string => {
  const hit = find(ROLE, v);
  return hit ? pick(hit) : v || '';
};

// ---- the activity log (what happened in the farm records)
const NOUN: Record<string, Pair> = {
  'poultry batch': { en: 'Bird batch', sw: 'Kundi la ndege' },
  poultry: { en: 'Bird batch', sw: 'Kundi la ndege' },
  'egg production record': { en: 'Egg record', sw: 'Rekodi ya mayai' },
  'egg collection': { en: 'Egg collection', sw: 'Mkusanyiko wa mayai' },
  'egg production': { en: 'Egg record', sw: 'Rekodi ya mayai' },
  'brooding batch': { en: 'Hatching batch', sw: 'Kundi la utotoleshaji' },
  'brooding record': { en: 'Hatching record', sw: 'Rekodi ya utotoleshaji' },
  expense: { en: 'Expense', sw: 'Gharama' },
  'expense category': { en: 'Expense category', sw: 'Aina ya gharama' },
  sale: { en: 'Sale', sw: 'Mauzo' },
  news: { en: 'News', sw: 'Habari' },
  profile: { en: 'Profile', sw: 'Wasifu' },
  user: { en: 'User', sw: 'Mtumiaji' },
  'user role': { en: 'User role', sw: 'Wadhifa wa mtumiaji' },
  'user status': { en: 'User status', sw: 'Hali ya mtumiaji' },
  mortality: { en: 'Deaths', sw: 'Vifo' },
  data: { en: 'Data', sw: 'Data' },
  'account data': { en: 'Account data', sw: 'Data ya akaunti' },
  change: { en: 'Change', sw: 'Mabadiliko' },
  book: { en: 'Book', sw: 'Kitabu' },
  backup: { en: 'Backup', sw: 'Nakala ya akiba' },
};
const VERB: Record<string, Pair> = {
  created: { en: 'created', sw: 'imeundwa' },
  added: { en: 'added', sw: 'imeongezwa' },
  started: { en: 'started', sw: 'imeanzishwa' },
  logged: { en: 'recorded', sw: 'imerekodiwa' },
  updated: { en: 'updated', sw: 'imesasishwa' },
  deleted: { en: 'deleted', sw: 'imefutwa' },
  recorded: { en: 'recorded', sw: 'imerekodiwa' },
  changed: { en: 'changed', sw: 'imebadilishwa' },
  approved: { en: 'approved', sw: 'imekubaliwa' },
  rejected: { en: 'declined', sw: 'imekataliwa' },
  dispatched: { en: 'sent', sw: 'imetumwa' },
  cleared: { en: 'cleared', sw: 'imefutwa' },
  reset: { en: 'reset', sw: 'imeanzishwa upya' },
  restored: { en: 'restored', sw: 'imerejeshwa' },
  exported: { en: 'exported', sw: 'imehamishwa' },
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const actionLabel = (action: string | null | undefined): string => {
  if (!action) return '';
  const sw = getLocaleLanguage() === 'sw';
  const key = action.trim().toLowerCase();
  // "Sale Deleted", "Poultry Batch Updated", "News Dispatched", "User Role Changed" ...
  const m = /^(.*?)\s+(created|added|started|logged|updated|deleted|recorded|changed|approved|rejected|dispatched|cleared|reset|restored|exported)$/.exec(key);
  if (m) {
    const noun = NOUN[m[1]];
    const verb = VERB[m[2]];
    if (noun && verb) return cap(`${noun[sw ? 'sw' : 'en']} ${verb[sw ? 'sw' : 'en']}`);
  }
  const special: Record<string, Pair> = {
    'data reset': { en: 'Data cleared', sw: 'Data imefutwa' },
    'account data cleared': { en: 'Account data cleared', sw: 'Data ya akaunti imefutwa' },
    'user deleted': { en: 'User deleted', sw: 'Mtumiaji amefutwa' },
    'change approved': { en: 'Change approved', sw: 'Mabadiliko yamekubaliwa' },
    'change rejected': { en: 'Change declined', sw: 'Mabadiliko yamekataliwa' },
    'sign in': { en: 'Signed in', sw: 'Ameingia' },
    'sign out': { en: 'Signed out', sw: 'Ametoka' },
  };
  const s = special[key];
  return s ? pick(s) : action;
};

/** Older log entries were saved in English; the common sentence starts are translated for reading. */
const DETAIL_PARTS: [RegExp, string][] = [
  [/Changed role to:/gi, 'Wadhifa umebadilishwa kuwa:'],
  [/Account status changed to:/gi, 'Hali ya akaunti imebadilishwa kuwa:'],
  [/Recorded deaths\.\s*Reason:/gi, 'Vifo vimerekodiwa. Sababu:'],
  [/Initial Qty:/gi, 'Idadi ya awali:'],
  [/Collected:/gi, 'Zilizokusanywa:'],
  [/Remaining:/gi, 'Zilizobaki:'],
  [/Expected:/gi, 'Inatarajiwa:'],
  [/Eggs:/gi, 'Mayai:'],
  [/Date:/gi, 'Tarehe:'],
  [/Title:/gi, 'Kichwa:'],
  [/Target:/gi, 'Mlengwa:'],
  [/Everyone/g, 'Wote'],
  [/Sold to/gi, 'Imeuzwa kwa'],
  [/Sale ID:/gi, 'Namba ya mauzo:'],
  [/Total:/gi, 'Jumla:'],
  [/Cleared (\w+) records/gi, 'Kumbukumbu zimefutwa: $1'],
  [/Account and all data removed:/gi, 'Akaunti na data zote zimeondolewa:'],
  [/All business records removed for this account/gi, 'Kumbukumbu zote za biashara za akaunti hii zimeondolewa'],
  [/Active/g, 'Inaendelea'],
  [/Inactive/g, 'Imezimwa'],
  [/\bTZS\b/g, 'TSh'],
  [/\badmin\b/gi, 'msimamizi'],
  [/\bstaff\b/gi, 'mfanyakazi'],
];
export const detailsLabel = (details: string | null | undefined): string => {
  if (!details) return '';
  if (getLocaleLanguage() !== 'sw') return details;
  return DETAIL_PARTS.reduce((acc, [re, to]) => acc.replace(re, to), details);
};
