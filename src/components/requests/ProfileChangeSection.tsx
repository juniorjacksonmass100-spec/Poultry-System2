import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { ChangeField, ProfileChangeRequest } from '../../types';
import { cancelChangeRequest, fetchChangeRequests, submitChangeRequest } from '../../services/requestService';
import { normalizePhone } from '../../lib/whatsapp';

import { localizeMessage } from '../../lib/locale';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Lets a farmer ask for a new name / email / phone. Nothing changes until the admin approves. */
export const ProfileChangeSection: React.FC = () => {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const { notify } = useToast();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [editing, setEditing] = useState<ChangeField | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRequests(await fetchChangeRequests(user.id));
  }, [user]);

  // Live: the admin's decision shows up here without reopening
  useEffect(() => {
    void load();
    if (!isSupabaseConfigured || !supabase || !user) return;
    const db = supabase;
    const ch = db
      .channel(`pcr-mine:${user.id}:${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_change_requests' }, () => void load())
      .subscribe();
    return () => {
      db.removeChannel(ch);
    };
  }, [user, load]);

  if (!user) return null;

  const rows: { field: ChangeField; label: string; current: string; type: string; placeholder: string }[] = [
    { field: 'full_name', label: isSw ? 'Jina' : 'Name', current: profile?.full_name || '', type: 'text', placeholder: isSw ? 'Jina jipya' : 'New name' },
    { field: 'email', label: isSw ? 'Barua pepe' : 'Email', current: user.email || '', type: 'email', placeholder: 'new@email.com' },
    { field: 'phone', label: isSw ? 'Namba ya simu' : 'Phone', current: profile?.phone || '', type: 'tel', placeholder: '0712 345 678' },
  ];

  const pendingFor = (f: ChangeField) => requests.find((r) => r.field === f && r.status === 'pending');

  const submit = async () => {
    if (!editing) return;
    const v = value.trim();
    if (!v) return;
    if (editing === 'email' && !EMAIL_RE.test(v)) {
      notify('error', isSw ? 'Barua pepe si sahihi.' : 'That does not look like a valid email.');
      return;
    }
    if (editing === 'phone' && !normalizePhone(v)) {
      notify('error', isSw ? 'Namba ya simu si sahihi.' : 'That does not look like a valid phone number.');
      return;
    }
    setBusy(true);
    try {
      await submitChangeRequest(editing, v);
      notify('success', isSw ? 'Ombi limetumwa kwa msimamizi kwa ukaguzi.' : 'Request sent to the admin for review.');
      setEditing(null);
      setValue('');
      await load();
    } catch (err: any) {
      notify('error', (err?.message ? localizeMessage(err?.message) : '') || (isSw ? 'Imeshindwa kutuma ombi.' : 'Could not send the request.'));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      await cancelChangeRequest(id);
      notify('info', isSw ? 'Ombi limeghairiwa.' : 'Request cancelled.');
      await load();
    } catch (err: any) {
      notify('error', (err?.message ? localizeMessage(err?.message) : '') || (isSw ? 'Imeshindwa kughairi.' : 'Could not cancel.'));
    }
  };

  const fieldLabel = (f: ChangeField) => rows.find((r) => r.field === f)!.label;
  const history = requests.filter((r) => r.status !== 'pending').slice(0, 5);

  const muted = isLight ? 'text-slate-500' : 'text-[#8baaa8]';

  return (
    <div className="mb-5 space-y-3">
      <div className={`text-xs font-bold uppercase tracking-wide ${muted}`}>
        {isSw ? 'Badilisha taarifa zangu' : 'Change my details'}
      </div>
      <p className={`text-[11px] leading-relaxed ${muted}`}>
        {isSw
          ? 'Mabadiliko yanahitaji idhini ya msimamizi. Hadi akubali, taarifa zako za sasa zinabaki kama zilivyo.'
          : 'Changes need the admin\'s approval. Until they approve, your current details stay as they are.'}
      </p>

      {rows.map((r) => {
        const pend = pendingFor(r.field);
        const isEditing = editing === r.field;
        return (
          <div key={r.field} className={`rounded-xl border p-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#040c0c] border-[#00f5c4]/20'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className={`text-[11px] ${muted}`}>{r.label}</div>
                <div className={`text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{r.current || '—'}</div>
              </div>
              {!pend && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(r.field);
                    setValue('');
                  }}
                  className={`shrink-0 h-11 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                    isLight ? 'border-teal-300 text-teal-800 bg-teal-50' : 'border-[#00f5c4]/40 text-[#00f5c4] bg-[#00f5c4]/10'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isSw ? 'Badilisha' : 'Change'}
                </button>
              )}
            </div>

            {pend && (
              <div className={`mt-2 rounded-lg border p-2.5 text-xs flex items-start gap-2 ${isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-400/40 text-amber-200'}`}>
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{isSw ? 'Inasubiri idhini ya msimamizi' : 'Pending admin review'}</div>
                  <div className="truncate">→ {pend.new_value}</div>
                </div>
                <button
                  type="button"
                  onClick={() => cancel(pend.id)}
                  className="shrink-0 h-9 px-2.5 rounded-lg border border-current text-[11px] font-bold"
                >
                  {isSw ? 'Ghairi' : 'Cancel'}
                </button>
              </div>
            )}

            {isEditing && (
              <div className="mt-2 space-y-2">
                <input
                  type={r.type}
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={r.placeholder}
                  className={`w-full h-11 rounded-xl border px-3 text-sm focus:outline-hidden ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-[#071a1c] border-[#00f5c4]/30 text-white focus:border-[#00f5c4]'
                  }`}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !value.trim()}
                    onClick={() => void submit()}
                    className={`flex-1 h-11 rounded-xl text-xs font-bold ${isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'}`}
                  >
                    {busy ? (isSw ? 'Inatuma...' : 'Sending...') : isSw ? 'Tuma kwa ukaguzi' : 'Send for review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center ${isLight ? 'border-slate-300 text-slate-600' : 'border-[#00f5c4]/30 text-[#c4dedc]'}`}
                    aria-label={isSw ? 'Funga' : 'Close'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {history.length > 0 && (
        <div className="space-y-1.5">
          <div className={`text-[11px] font-semibold ${muted}`}>{isSw ? 'Maombi ya hivi karibuni' : 'Recent requests'}</div>
          {history.map((h) => (
            <div key={h.id} className={`flex items-start gap-2 text-xs rounded-lg px-2.5 py-2 ${isLight ? 'bg-slate-50' : 'bg-[#040c0c]'}`}>
              {h.status === 'approved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className={isLight ? 'text-slate-800' : 'text-white'}>
                  {fieldLabel(h.field)} → <span className="font-semibold">{h.new_value}</span>
                </div>
                <div className={muted}>
                  {h.status === 'approved' ? (isSw ? 'Imekubaliwa' : 'Approved') : isSw ? 'Haikukubaliwa' : 'Not approved'}
                  {h.admin_note ? ` · ${h.admin_note}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
