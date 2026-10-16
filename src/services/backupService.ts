import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveOwnerId, requireOwnerId } from '../lib/scope';
import { saveFileForUser, SaveResult } from '../lib/nativeFiles';
import { fmtDateTime, tr } from '../lib/locale';
import { clearAllUserData } from './dataCleanService';
import { logActivity } from './activityService';

/**
 * Backup and restore.
 *
 * A backup is one JSON file with every record of ONE account (flocks, deaths, eggs, hatching,
 * expenses, your own expense categories, sales and worth history). It is kept by the farmer, so a
 * copy exists outside the database too. Restoring puts the records back into the account on screen:
 *  - "Add"      keeps what is there and adds the backup's records
 *  - "Replace"  clears the account first, then restores (for starting over on a clean account)
 * Nothing in a backup can reach another account: every restored row is written as the account on screen.
 */
export const BACKUP_VERSION = 1;
const TABLES = [
  'poultry_stock',
  'poultry_movements',
  'egg_production',
  'brooding_records',
  'expenses',
  'expense_categories',
  'sales',
  'poultry_valuations',
] as const;
export type BackupTable = (typeof TABLES)[number];
export type BackupData = Record<BackupTable, any[]>;

export interface BackupFile {
  app: 'KukuTrack';
  version: number;
  kind: 'account' | 'all-users';
  created_at: string;
  account: { id: string; email: string; name: string };
  counts: Record<string, number>;
  checksum: string | null;
  data: BackupData;
  /** Only in an all-users backup: who the records belong to */
  profiles?: any[];
}

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const PAGE = 1000;

const db = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error(tr('Database not configured', 'Hifadhidata haijawekwa.'));
  return supabase;
};

// ---------------------------------------------------------------------------------------------
// reading
// ---------------------------------------------------------------------------------------------
/** Reads a whole table, page by page (the database returns at most 1000 rows per request). */
const readAll = async (table: string, ownerId: string | null): Promise<any[]> => {
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = db().from(table).select('*').order('id', { ascending: true }).range(from, from + PAGE - 1);
    if (ownerId) q = q.eq('owner_id', ownerId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return out;
};

export const sha256 = async (text: string): Promise<string | null> => {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
};

const countsOf = (data: BackupData): Record<string, number> =>
  Object.fromEntries(TABLES.map((t) => [t, data[t]?.length || 0]));

/** Everything in the account on screen. */
export const createBackup = async (account: { email: string; name: string }): Promise<BackupFile> => {
  const ownerId = getActiveOwnerId();
  if (!ownerId) throw new Error(tr('Please sign in first.', 'Tafadhali ingia kwanza.'));
  const data = {} as BackupData;
  for (const t of TABLES) {
    const rows = await readAll(t, ownerId);
    // Built-in expense categories belong to everyone; only the farmer's own are saved
    data[t] = t === 'expense_categories' ? rows.filter((r) => r.is_system === false) : rows;
  }
  return {
    app: 'KukuTrack',
    version: BACKUP_VERSION,
    kind: 'account',
    created_at: new Date().toISOString(),
    account: { id: ownerId, email: account.email, name: account.name },
    counts: countsOf(data),
    checksum: await sha256(JSON.stringify(data)),
    data,
  };
};

/** Admin: every account's records in one file, kept for safekeeping. */
export const createAllUsersBackup = async (account: { id: string; email: string; name: string }): Promise<BackupFile> => {
  const data = {} as BackupData;
  for (const t of TABLES) {
    const rows = await readAll(t, null);
    data[t] = t === 'expense_categories' ? rows.filter((r) => r.is_system === false) : rows;
  }
  const profiles: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: p, error } = await db()
      .from('profiles')
      .select('id, email, full_name, phone, role, is_active, created_at')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    profiles.push(...(p || []));
    if (!p || p.length < PAGE) break;
  }
  return {
    app: 'KukuTrack',
    version: BACKUP_VERSION,
    kind: 'all-users',
    created_at: new Date().toISOString(),
    account,
    counts: { ...countsOf(data), profiles: profiles.length },
    checksum: await sha256(JSON.stringify(data)),
    data,
    profiles,
  };
};

// ---------------------------------------------------------------------------------------------
// saving the file
// ---------------------------------------------------------------------------------------------
const toBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin);
};

const safeName = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'akaunti';

const LAST_KEY = 'kukutrack_last_backup:';
export const lastBackupAt = (ownerId: string | null): string | null => {
  if (!ownerId) return null;
  try {
    return localStorage.getItem(LAST_KEY + ownerId);
  } catch {
    return null;
  }
};
const rememberBackup = (ownerId: string) => {
  try {
    localStorage.setItem(LAST_KEY + ownerId, new Date().toISOString());
  } catch {
    // storage unavailable: the reminder may show again
  }
};

export interface BackupSaved {
  fileName: string;
  save: SaveResult;
  counts: Record<string, number>;
}

/** Saves a backup for the person: to Downloads on the phone, or a normal download in the browser. */
export const saveBackupFile = async (backup: BackupFile): Promise<BackupSaved> => {
  const json = JSON.stringify(backup);
  const d = new Date();
  const stamp = `${d.toISOString().slice(0, 10)}_${d.toTimeString().slice(0, 5).replace(':', '')}`;
  const who = backup.kind === 'all-users' ? tr('all_users', 'watumiaji_wote') : safeName(backup.account.name || backup.account.email);
  const fileName = `${tr('KukuTrack_Backup', 'KukuTrack_Nakala_ya_Akiba')}_${who}_${stamp}.json`;

  const save = await saveFileForUser(fileName, toBase64(json), 'application/json', () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  });

  if (backup.kind === 'account') rememberBackup(backup.account.id);
  await logActivity('Backup Exported', 'backup', backup.account.id, `${backup.kind}: ${Object.values(backup.counts).reduce((a, b) => a + b, 0)} records`);
  return { fileName, save, counts: backup.counts };
};

export const describeBackupSaved = (r: BackupSaved): string => {
  switch (r.save.status) {
    case 'downloaded':
      return tr(`Backup saved to your Downloads folder: ${r.fileName}`, `Nakala ya akiba imehifadhiwa kwenye folda ya Vipakuliwa: ${r.fileName}`);
    case 'shared':
      return tr('Choose where to keep the backup file.', 'Chagua mahali pa kuhifadhi faili la akiba.');
    default:
      return tr(`Backup downloaded: ${r.fileName}`, `Nakala ya akiba imepakuliwa: ${r.fileName}`);
  }
};

// ---------------------------------------------------------------------------------------------
// reading a backup file
// ---------------------------------------------------------------------------------------------
export class BackupError extends Error {}

export const parseBackup = async (text: string, sizeBytes: number): Promise<BackupFile> => {
  if (sizeBytes > MAX_FILE_BYTES) throw new BackupError(tr('That file is too large to be a KukuTrack backup.', 'Faili hilo ni kubwa mno kuwa nakala ya akiba ya KukuTrack.'));
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError(tr('That file is not a readable backup. Choose a .json file saved by KukuTrack.', 'Faili hilo si nakala ya akiba inayosomeka. Chagua faili la .json lililohifadhiwa na KukuTrack.'));
  }
  if (!parsed || parsed.app !== 'KukuTrack' || typeof parsed.data !== 'object' || parsed.data === null) {
    throw new BackupError(tr('That file was not made by KukuTrack.', 'Faili hilo halikutengenezwa na KukuTrack.'));
  }
  if (typeof parsed.version !== 'number' || parsed.version > BACKUP_VERSION) {
    throw new BackupError(tr('This backup was made by a newer version of the app. Please update the app first.', 'Nakala hii ya akiba ilitengenezwa na toleo jipya la programu. Tafadhali sasisha programu kwanza.'));
  }
  if (parsed.kind === 'all-users') {
    throw new BackupError(
      tr(
        'This is a full backup of all users, kept for safekeeping. To restore, open one user and restore that user\'s own backup file.',
        'Hii ni nakala ya akiba ya watumiaji wote, ya kuhifadhi tu. Kurejesha, fungua mtumiaji mmoja kisha urejeshe faili lake la akiba.'
      )
    );
  }
  for (const t of TABLES) {
    if (parsed.data[t] === undefined) parsed.data[t] = [];
    if (!Array.isArray(parsed.data[t])) throw new BackupError(tr('The backup file is damaged.', 'Faili la akiba limeharibika.'));
  }
  if (parsed.checksum) {
    const actual = await sha256(JSON.stringify(parsed.data));
    if (actual && actual !== parsed.checksum) {
      throw new BackupError(tr('The backup file is damaged or was changed after it was saved, so it cannot be restored.', 'Faili la akiba limeharibika au limebadilishwa baada ya kuhifadhiwa, hivyo haliwezi kurejeshwa.'));
    }
  }
  parsed.counts = countsOf(parsed.data);
  return parsed as BackupFile;
};

export const backupSummary = (b: BackupFile, isSw: boolean): { label: string; count: number }[] => {
  const names: Record<BackupTable, [string, string]> = {
    poultry_stock: ['Bird batches', 'Makundi ya ndege'],
    poultry_movements: ['Death and movement records', 'Rekodi za vifo na mabadiliko'],
    egg_production: ['Egg records', 'Rekodi za mayai'],
    brooding_records: ['Hatching batches', 'Makundi ya utotoleshaji'],
    expenses: ['Expenses', 'Gharama'],
    expense_categories: ['Your expense categories', 'Aina zako za gharama'],
    sales: ['Sales', 'Mauzo'],
    poultry_valuations: ['Worth history entries', 'Rekodi za historia ya thamani'],
  };
  return TABLES.map((t) => ({ label: names[t][isSw ? 1 : 0], count: b.counts[t] || 0 })).filter((x) => x.count > 0);
};

// ---------------------------------------------------------------------------------------------
// restoring
// ---------------------------------------------------------------------------------------------
export type RestoreMode = 'add' | 'replace';

const OWNED_STRIP = ['id', 'owner_id', 'created_at', 'updated_at', 'created_by', 'recorded_by'];
const strip = (row: any, extra: string[] = []) => {
  const out: any = { ...row };
  for (const k of [...OWNED_STRIP, ...extra]) delete out[k];
  return out;
};

const insertBatches = async (table: string, rows: any[], size = 100) => {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await db().from(table).insert(rows.slice(i, i + size));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
};

export interface RestoreProgress {
  step: number;
  total: number;
  label: string;
}

/**
 * Puts a backup's records into the account on screen.
 * Counters kept by the database (birds sold, current birds) are recalculated by it and then set back
 * to the exact numbers in the backup, so nothing is counted twice.
 */
export const restoreBackup = async (
  backup: BackupFile,
  mode: RestoreMode,
  onProgress: (p: RestoreProgress) => void = () => {}
): Promise<Record<string, number>> => {
  const ownerId = await requireOwnerId();
  const d = backup.data;
  const total = 7 + (mode === 'replace' ? 1 : 0);
  let step = 0;
  const tick = (label: string) => onProgress({ step: ++step, total, label });
  const restored: Record<string, number> = {};

  if (mode === 'replace') {
    tick(tr('Clearing the current records...', 'Inafuta kumbukumbu za sasa...'));
    await clearAllUserData();
  }

  // 1. your own expense categories (never duplicates a name that already exists)
  tick(tr('Restoring expense categories...', 'Inarejesha aina za gharama...'));
  const { data: existingCats } = await db().from('expense_categories').select('name').or(`owner_id.is.null,owner_id.eq.${ownerId}`);
  const have = new Set((existingCats || []).map((c: any) => String(c.name).toLowerCase()));
  const newCats = d.expense_categories
    .filter((c) => c?.name && !have.has(String(c.name).toLowerCase()))
    .map((c) => ({ name: c.name, is_system: false, owner_id: ownerId }));
  await insertBatches('expense_categories', newCats);
  restored.expense_categories = newCats.length;

  // 2. bird batches, one by one so every old id is matched to its new id
  tick(tr('Restoring bird batches...', 'Inarejesha makundi ya ndege...'));
  const idMap = new Map<string, string>();
  const originalSold = new Map<string, number>();
  for (const s of d.poultry_stock) {
    const payload = { ...strip(s, ['valuation_updated_at', 'current_quantity']), owner_id: ownerId };
    const { data, error } = await db().from('poultry_stock').insert([payload]).select('id').single();
    if (error) throw new Error(`poultry_stock: ${error.message}`);
    idMap.set(s.id, data.id);
    originalSold.set(data.id, Number(s.sold_quantity) || 0);
  }
  restored.poultry_stock = idMap.size;

  // 3. movements (deaths etc.)
  tick(tr('Restoring death and movement records...', 'Inarejesha rekodi za vifo na mabadiliko...'));
  const movements = d.poultry_movements
    .filter((m) => idMap.has(m.stock_id))
    .map((m) => ({ ...strip(m), stock_id: idMap.get(m.stock_id), owner_id: ownerId }));
  await insertBatches('poultry_movements', movements, 200);
  restored.poultry_movements = movements.length;

  // 4. eggs: a day that already has a record is kept as it is
  tick(tr('Restoring egg records...', 'Inarejesha rekodi za mayai...'));
  const eggs = d.egg_production.map((e) => ({ ...strip(e, ['remaining_eggs', 'total_egg_revenue']), owner_id: ownerId }));
  for (let i = 0; i < eggs.length; i += 100) {
    const { error } = await db()
      .from('egg_production')
      .upsert(eggs.slice(i, i + 100), { onConflict: 'owner_id,production_date', ignoreDuplicates: true });
    if (error) throw new Error(`egg_production: ${error.message}`);
  }
  restored.egg_production = eggs.length;

  // 5. hatching batches + expenses
  tick(tr('Restoring hatching batches and expenses...', 'Inarejesha utotoleshaji na gharama...'));
  const brooding = d.brooding_records.map((b) => ({ ...strip(b), owner_id: ownerId }));
  await insertBatches('brooding_records', brooding);
  restored.brooding_records = brooding.length;
  const expenses = d.expenses.map((e) => ({ ...strip(e), owner_id: ownerId }));
  await insertBatches('expenses', expenses);
  restored.expenses = expenses.length;

  // 6. sales (the database takes birds out of stock again for each one...)
  tick(tr('Restoring sales...', 'Inarejesha mauzo...'));
  const sales = d.sales.map((s) => ({
    ...strip(s, ['total_amount', 'balance', 'customer_id']),
    stock_id: s.stock_id && idMap.has(s.stock_id) ? idMap.get(s.stock_id) : null,
    owner_id: ownerId,
  }));
  await insertBatches('sales', sales);
  restored.sales = sales.length;

  // 7. ...so the birds-sold counters are set back to the backup's exact numbers; then the worth history
  tick(tr('Finishing up...', 'Inamalizia...'));
  for (const [newId, sold] of originalSold) {
    const { error } = await db().from('poultry_stock').update({ sold_quantity: sold }).eq('id', newId);
    if (error) throw new Error(`poultry_stock: ${error.message}`);
  }
  const newIds = Array.from(idMap.values());
  if (newIds.length > 0) {
    // the database wrote one starting entry per batch; replace them with the real history
    const { error: delErr } = await db().from('poultry_valuations').delete().in('stock_id', newIds);
    if (delErr) throw new Error(`poultry_valuations: ${delErr.message}`);
  }
  const history = d.poultry_valuations
    .filter((v) => idMap.has(v.stock_id))
    .map((v) => ({
      owner_id: ownerId,
      stock_id: idMap.get(v.stock_id),
      unit_value: v.unit_value,
      quantity: v.quantity,
      recorded_at: v.recorded_at,
    }));
  await insertBatches('poultry_valuations', history, 200);
  restored.poultry_valuations = history.length;

  await logActivity('Data Restored', 'backup', ownerId, `${mode}: ${Object.values(restored).reduce((a, b) => a + b, 0)} records from ${fmtDateTime(backup.created_at)}`);
  return restored;
};

// Compatibility API used by the account data management screen.

const BACKUP_FORMAT = 'kukutrack-account-backup';
const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
const BATCH_SIZE = 250;

/** Only account-owned tables are included. Authentication credentials and shared system categories are never exported. */
const BACKUP_TABLES = [
  'poultry_stock',
  'customers',
  'expense_categories',
  'poultry_movements',
  'egg_production',
  'brooding_records',
  'expenses',
  'sales',
] as const;

type AccountBackupTable = (typeof BACKUP_TABLES)[number];
type BackupRows = Record<AccountBackupTable, Record<string, unknown>[]>;

interface AccountBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  createdAt: string;
  tables: Partial<BackupRows>;
}

export interface BackupExportResult {
  fileName: string;
  save: SaveResult;
  recordCount: number;
}

export interface BackupRestoreResult {
  recordCount: number;
}

const ensureDatabase = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error('Database is not configured.');
};

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const browserDownload = (fileName: string, content: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const createAccountBackup = async (isSw = false): Promise<BackupExportResult> => {
  ensureDatabase();
  const ownerId = await requireOwnerId();
  const tables = {} as BackupRows;

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select('*').eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
    tables[table] = (data || []) as Record<string, unknown>[];
  }

  const backup: AccountBackup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    tables,
  };
  const content = JSON.stringify(backup, null, 2);
  const bytes = new TextEncoder().encode(content);
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `KukuTrack_${isSw ? 'Nakala' : 'Backup'}_${date}.json`;
  const save = await saveFileForUser(
    fileName,
    encodeBase64(bytes),
    'application/json',
    () => browserDownload(fileName, content)
  );

  return {
    fileName,
    save,
    recordCount: Object.values(tables).reduce((total, rows) => total + rows.length, 0),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseAccountBackupPayload = (value: unknown): AccountBackup => {
  if (!isRecord(value) || value.format !== BACKUP_FORMAT || value.version !== BACKUP_VERSION || !isRecord(value.tables)) {
    throw new Error('This file is not a supported KukuTrack backup.');
  }

  const tables: Partial<BackupRows> = {};
  for (const table of BACKUP_TABLES) {
    const rows = value.tables[table];
    if (rows === undefined) continue;
    if (!Array.isArray(rows) || rows.some((row) => !isRecord(row) || typeof row.id !== 'string')) {
      throw new Error('The backup contains invalid records.');
    }
    tables[table] = rows as Record<string, unknown>[];
  }

  if (Object.keys(tables).length === 0) throw new Error('The backup does not contain any farm records.');
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: String(value.createdAt || ''), tables };
};

/** Restore is an upsert: missing records are added and matching IDs are updated. Other records are left alone. */
export const restoreAccountBackup = async (file: File): Promise<BackupRestoreResult> => {
  ensureDatabase();
  if (file.size > MAX_BACKUP_BYTES) throw new Error('The backup file is larger than 25 MB.');

  let parsed: AccountBackup;
  try {
    parsed = parseAccountBackupPayload(JSON.parse(await file.text()));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The backup file could not be read.');
    throw error;
  }

  const ownerId = await requireOwnerId();
  let recordCount = 0;
  for (const table of BACKUP_TABLES) {
    const sourceRows = parsed.tables[table] || [];
    for (let offset = 0; offset < sourceRows.length; offset += BATCH_SIZE) {
      const rows = sourceRows.slice(offset, offset + BATCH_SIZE).map((row) => {
        const safeRow = { ...row, owner_id: ownerId };
        if ('recorded_by' in safeRow) safeRow.recorded_by = ownerId;
        if ('created_by' in safeRow) safeRow.created_by = ownerId;
        return safeRow;
      });
      const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      recordCount += rows.length;
    }
  }
  return { recordCount };
};
