import React, { useState } from 'react';
import { Check, X, UserCog } from 'lucide-react';
import { ProfileChangeRequest, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { reviewChangeRequest } from '../../services/requestService';

interface ChangeRequestsPanelProps {
  requests: ProfileChangeRequest[];
  users: UserProfile[];
  onDecided: () => void;
}

/** Admin: pending requests from farmers to change their details. */
export const ChangeRequestsPanel: React.FC<ChangeRequestsPanelProps> = ({ requests, users, onDecided }) => {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const { notify } = useToast();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === 'pending');
  const recent = requests.filter((r) => r.status !== 'pending').slice(0, 5);
  const nameOf = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u?.full_name || u?.email || (isSw ? 'Mtumiaji' : 'User');
  };
  const fieldLabel = (f: string) =>
    f === 'email' ? (isSw ? 'Barua pepe' : 'Email') : f === 'phone' ? (isSw ? 'Namba ya simu' : 'Phone') : isSw ? 'Jina' : 'Name';

  const decide = async (r: ProfileChangeRequest, approve: boolean) => {
    setBusyId(r.id);
    try {
      await reviewChangeRequest(r.id, approve, notes[r.id] || '');
      notify('success', approve ? (isSw ? 'Imekubaliwa. Mkulima ameambiwa.' : 'Approved. The farmer was told.') : isSw ? 'Imekataliwa. Mkulima ameambiwa.' : 'Declined. The farmer was told.');
      onDecided();
    } catch (err: any) {
      notify('error', err?.message || (isSw ? 'Imeshindwa.' : 'Could not save the decision.'));
      onDecided();
    } finally {
      setBusyId(null);
    }
  };

  if (pending.length === 0 && recent.length === 0) return null;

  const muted = isLight ? 'text-slate-500' : 'text-[#8fbdb8]';

  return (
    <div className={`border rounded-2xl p-4 space-y-3 ${isLight ? 'bg-white border-amber-200 shadow-sm' : 'bg-[#071a1c] border-amber-400/30'}`}>
      <div className={`flex items-center gap-2 text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
        <UserCog className="w-4 h-4 text-amber-500" />
        {isSw ? 'Maombi ya kubadilisha taarifa' : 'Change requests'}
        {pending.length > 0 && (
          <span className="ml-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-amber-950 text-xs font-bold flex items-center justify-center">
            {pending.length}
          </span>
        )}
      </div>

      {pending.map((r) => (
        <div key={r.id} className={`rounded-xl border p-3 space-y-2.5 ${isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-500/5 border-amber-400/25'}`}>
          <div>
            <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{nameOf(r.user_id)}</div>
            <div className={`text-xs ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
              {fieldLabel(r.field)}: <span className="line-through opacity-70">{r.old_value || '—'}</span> → <strong>{r.new_value}</strong>
            </div>
            <div className={`text-[11px] ${muted}`}>{new Date(r.created_at).toLocaleString()}</div>
          </div>
          <input
            value={notes[r.id] || ''}
            onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
            placeholder={isSw ? 'Maelezo kwa mkulima (hiari)' : 'Note to the farmer (optional)'}
            className={`w-full h-11 rounded-xl border px-3 text-sm focus:outline-hidden ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#040c0c] border-[#00f5c4]/25 text-white'
            }`}
          />
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => void decide(r, true)}
              className="flex-1 h-12 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSw ? 'Kubali' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={busyId === r.id}
              onClick={() => void decide(r, false)}
              className={`flex-1 h-12 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 ${
                isLight ? 'border-rose-300 text-rose-700 bg-white' : 'border-rose-400/50 text-rose-300'
              }`}
            >
              <X className="w-4 h-4" />
              {isSw ? 'Kataa' : 'Decline'}
            </button>
          </div>
        </div>
      ))}

      {pending.length === 0 && (
        <div className={`text-xs ${muted}`}>{isSw ? 'Hakuna maombi yanayosubiri.' : 'No requests waiting for review.'}</div>
      )}

      {recent.length > 0 && (
        <div className="space-y-1">
          <div className={`text-[11px] font-semibold ${muted}`}>{isSw ? 'Yaliyoamuliwa hivi karibuni' : 'Recently decided'}</div>
          {recent.map((r) => (
            <div key={r.id} className={`text-xs ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
              {r.status === 'approved' ? '✓' : '✗'} {nameOf(r.user_id)} · {fieldLabel(r.field)} → {r.new_value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
