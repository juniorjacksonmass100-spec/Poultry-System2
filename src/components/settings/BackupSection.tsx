import React, { useRef, useState } from 'react';
import { DatabaseBackup, Download, Upload, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { fmtDateTime, localizeMessage } from '../../lib/locale';
import {
  BackupFile,
  BackupError,
  RestoreMode,
  RestoreProgress,
  backupSummary,
  createAllUsersBackup,
  createBackup,
  describeBackupSaved,
  lastBackupAt,
  parseBackup,
  restoreBackup,
  saveBackupFile,
} from '../../services/backupService';

interface BackupSectionProps {
  /** Called after a restore so the screens reload the records */
  onRestored: () => void | Promise<void>;
}

/** Save a copy of all records to a file, and put them back from such a file. */
export const BackupSection: React.FC<BackupSectionProps> = ({ onRestored }) => {
  const { user, profile, isAdmin, viewAsUser, effectiveOwnerId } = useAuth();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const { notify } = useToast();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [busy, setBusy] = useState<null | 'save' | 'all' | 'read' | 'restore'>(null);
  const [lastAt, setLastAt] = useState<string | null>(() => lastBackupAt(effectiveOwnerId));
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [mode, setMode] = useState<RestoreMode>('add');
  const [understand, setUnderstand] = useState(false);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);
  const [done, setDone] = useState<Record<string, number> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Who the records belong to right now (an admin may be inside a farmer's account)
  const target = viewAsUser
    ? { email: viewAsUser.email, name: viewAsUser.full_name || viewAsUser.email }
    : { email: user.email || '', name: profile?.full_name || user.email || '' };

  const muted = isLight ? 'text-slate-500' : 'text-[#8fbdb8]';
  const strong = isLight ? 'text-slate-900' : 'text-white';
  const btn = `w-full min-h-[52px] rounded-2xl px-4 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60`;
  const primary = isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]';
  const outline = isLight ? 'border border-slate-300 text-slate-800 bg-white' : 'border border-[#00f5c4]/40 text-[#00f5c4] bg-transparent';

  const saveNow = async () => {
    setBusy('save');
    try {
      const backup = await createBackup(target);
      const saved = await saveBackupFile(backup);
      setLastAt(new Date().toISOString());
      notify('success', describeBackupSaved(saved));
    } catch (err: any) {
      notify('error', (err?.message ? localizeMessage(err.message) : '') || (isSw ? 'Imeshindwa kuhifadhi nakala ya akiba.' : 'Could not save the backup.'));
    } finally {
      setBusy(null);
    }
  };

  const saveAll = async () => {
    setBusy('all');
    try {
      const backup = await createAllUsersBackup({ id: user.id, email: user.email || '', name: profile?.full_name || user.email || '' });
      const saved = await saveBackupFile(backup);
      notify('success', describeBackupSaved(saved));
    } catch (err: any) {
      notify('error', (err?.message ? localizeMessage(err.message) : '') || (isSw ? 'Imeshindwa kuhifadhi nakala ya akiba.' : 'Could not save the backup.'));
    } finally {
      setBusy(null);
    }
  };

  const pickFile = async (file: File | null) => {
    if (!file) return;
    setBusy('read');
    setDone(null);
    try {
      const text = await file.text();
      const parsed = await parseBackup(text, file.size);
      setPending(parsed);
      setMode('add');
      setUnderstand(false);
    } catch (err: any) {
      setPending(null);
      notify('error', err instanceof BackupError ? err.message : isSw ? 'Faili hilo haliwezi kusomwa.' : 'That file cannot be read.');
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const cancelRestore = () => {
    setPending(null);
    setProgress(null);
    setUnderstand(false);
  };

  const runRestore = async () => {
    if (!pending) return;
    setBusy('restore');
    setProgress({ step: 0, total: 1, label: isSw ? 'Inaanza...' : 'Starting...' });
    try {
      const restored = await restoreBackup(pending, mode, setProgress);
      setDone(restored);
      setPending(null);
      notify('success', isSw ? 'Kumbukumbu zimerejeshwa.' : 'Your records were restored.');
      await onRestored();
    } catch (err: any) {
      notify(
        'error',
        `${isSw ? 'Kurejesha kumekwama.' : 'Restoring stopped.'} ${(err?.message ? localizeMessage(err.message) : '')} ${
          isSw ? 'Faili lako la akiba bado ni salama; unaweza kujaribu tena.' : 'Your backup file is still safe; you can try again.'
        }`.trim()
      );
      await onRestored();
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const days = lastAt ? Math.floor((Date.now() - new Date(lastAt).getTime()) / 86400000) : null;
  const stale = days === null || days >= 7;
  const ownerDiffers = pending && pending.account.id !== effectiveOwnerId;
  const summary = pending ? backupSummary(pending, isSw) : [];
  const canRestore = pending && busy !== 'restore' && (mode === 'add' || understand);

  return (
    <section className="space-y-3">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-80">
        <DatabaseBackup className="w-3.5 h-3.5" />
        {isSw ? 'Nakala ya akiba ya data' : 'Data backup'}
      </h4>

      <p className={`text-[11px] leading-relaxed ${muted}`}>
        {isSw
          ? `Hifadhi nakala ya kumbukumbu zote za ${target.name} kwenye faili lako mwenyewe: ndege, mayai, utotoleshaji, gharama na mauzo. Unaweza kuzirejesha wakati wowote.`
          : `Keep a copy of all of ${target.name}'s records in a file of your own: birds, eggs, hatching, expenses and sales. You can put them back any time.`}
      </p>

      <div className={`rounded-2xl border p-3 flex items-start gap-2.5 ${stale ? (isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-400/40 text-amber-200') : isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'}`}>
        {stale ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />}
        <div className="text-xs">
          <div className="font-bold">
            {lastAt
              ? isSw ? `Nakala ya mwisho: ${fmtDateTime(lastAt)}` : `Last backup: ${fmtDateTime(lastAt)}`
              : isSw ? 'Bado hujahifadhi nakala ya akiba' : 'You have not saved a backup yet'}
          </div>
          <div className="opacity-90">
            {stale
              ? isSw ? 'Inashauriwa kuhifadhi nakala angalau mara moja kwa wiki.' : 'We recommend saving one at least once a week.'
              : isSw ? 'Data yako ina nakala ya hivi karibuni.' : 'Your data has a recent copy.'}
          </div>
        </div>
      </div>

      <button type="button" onClick={saveNow} disabled={busy !== null} className={`${btn} ${primary}`}>
        {busy === 'save' ? <Loader2 className="w-4 h-4 kuku-spin" /> : <Download className="w-4 h-4" />}
        {busy === 'save' ? (isSw ? 'Inahifadhi...' : 'Saving...') : isSw ? 'Hifadhi nakala ya akiba sasa' : 'Save a backup now'}
      </button>

      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void pickFile(e.target.files?.[0] || null)} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy !== null} className={`${btn} ${outline}`}>
        {busy === 'read' ? <Loader2 className="w-4 h-4 kuku-spin" /> : <Upload className="w-4 h-4" />}
        {isSw ? 'Rejesha kutoka kwenye nakala ya akiba' : 'Restore from a backup file'}
      </button>

      {isAdmin && (
        <button type="button" onClick={saveAll} disabled={busy !== null} className={`${btn} ${outline}`}>
          {busy === 'all' ? <Loader2 className="w-4 h-4 kuku-spin" /> : <Users className="w-4 h-4" />}
          {isSw ? 'Hifadhi nakala ya watumiaji wote' : 'Save a backup of all users'}
        </button>
      )}

      {done && (
        <div className={`rounded-2xl border p-3 text-xs flex items-start gap-2 ${isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200'}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{isSw ? 'Imerejeshwa kikamilifu' : 'Restored successfully'}</div>
            <div>{Object.values(done).reduce((a, b) => a + b, 0).toLocaleString()} {isSw ? 'rekodi' : 'records'}</div>
          </div>
        </div>
      )}

      {pending && (
        <div className={`rounded-2xl border p-4 space-y-3 ${isLight ? 'bg-white border-teal-300' : 'bg-[#071a1c] border-[#00f5c4]/40'}`}>
          <div>
            <div className={`text-sm font-bold ${strong}`}>{isSw ? 'Nakala ya akiba imesomwa' : 'Backup file read'}</div>
            <div className={`text-[11px] ${muted}`}>
              {isSw ? 'Imehifadhiwa' : 'Saved'} {fmtDateTime(pending.created_at)} · {pending.account.name || pending.account.email}
            </div>
          </div>

          <ul className={`text-xs space-y-1 ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
            {summary.length === 0 && <li>{isSw ? 'Faili hili halina rekodi.' : 'This file has no records.'}</li>}
            {summary.map((s) => (
              <li key={s.label} className="flex justify-between gap-3">
                <span>{s.label}</span>
                <span className="font-mono font-bold">{s.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>

          {ownerDiffers && (
            <div className={`rounded-xl border p-2.5 text-[11px] ${isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-400/40 text-amber-200'}`}>
              {isSw
                ? `Nakala hii ni ya akaunti nyingine. Itarejeshwa kwenye akaunti uliyomo sasa: ${target.name}.`
                : `This backup belongs to another account. It will be restored into the account you are in now: ${target.name}.`}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {(['add', 'replace'] as RestoreMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setUnderstand(false);
                }}
                disabled={busy === 'restore'}
                className={`text-left rounded-xl border p-3 ${
                  mode === m
                    ? m === 'replace'
                      ? isLight ? 'border-rose-400 bg-rose-50' : 'border-rose-400/60 bg-rose-500/10'
                      : isLight ? 'border-teal-500 bg-teal-50' : 'border-[#00f5c4] bg-[#00f5c4]/10'
                    : isLight ? 'border-slate-200' : 'border-[#00f5c4]/15'
                }`}
              >
                <div className={`text-xs font-bold ${strong}`}>
                  {m === 'add' ? (isSw ? 'Ongeza kwenye kilichopo (inapendekezwa)' : 'Add to what is there (recommended)') : isSw ? 'Badilisha kila kitu' : 'Replace everything'}
                </div>
                <div className={`text-[11px] mt-0.5 ${muted}`}>
                  {m === 'add'
                    ? isSw ? 'Kumbukumbu zako za sasa zinabaki; za nakala zinaongezwa. Siku ya mayai yenye rekodi tayari haibadilishwi.' : 'Your current records stay; the backup\'s records are added. A day that already has an egg record is not changed.'
                    : isSw ? 'Kumbukumbu zote za sasa zinafutwa kwanza, kisha za nakala zinawekwa.' : 'All current records are deleted first, then the backup\'s records are put in.'}
                </div>
              </button>
            ))}
          </div>

          {mode === 'replace' && (
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={understand} onChange={(e) => setUnderstand(e.target.checked)} className="mt-0.5 w-5 h-5 accent-rose-600" />
              <span className={`text-xs ${isLight ? 'text-rose-800' : 'text-rose-200'}`}>
                {isSw ? `Naelewa kuwa kumbukumbu zote za sasa za ${target.name} zitafutwa.` : `I understand that all current records of ${target.name} will be deleted.`}
              </span>
            </label>
          )}

          {progress && (
            <div className="space-y-1.5">
              <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#0c2020]'}`}>
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.round((progress.step / progress.total) * 100)}%` }} />
              </div>
              <div className={`text-[11px] ${muted}`}>{progress.label}</div>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => void runRestore()}
              disabled={!canRestore}
              className={`flex-1 min-h-[52px] rounded-2xl text-sm font-bold disabled:opacity-50 ${mode === 'replace' ? 'bg-rose-600 text-white' : primary}`}
            >
              {busy === 'restore' ? (isSw ? 'Inarejesha...' : 'Restoring...') : isSw ? 'Rejesha sasa' : 'Restore now'}
            </button>
            <button type="button" onClick={cancelRestore} disabled={busy === 'restore'} className={`min-h-[52px] px-4 rounded-2xl text-sm font-bold ${outline}`}>
              {isSw ? 'Ghairi' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
