import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { requireOwnerId } from '../lib/scope';
import { saveFileForUser, SaveResult } from '../lib/nativeFiles';

const BACKUP_FORMAT = 'kukutrack-account-backup';
const BACKUP_VERSION = 1;
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

type BackupTable = (typeof BACKUP_TABLES)[number];
type BackupRows = Record<BackupTable, Record<string, unknown>[]>;

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

const parseBackup = (value: unknown): AccountBackup => {
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
    parsed = parseBackup(JSON.parse(await file.text()));
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
