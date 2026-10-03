import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Shown after someone opens the "reset password" link from their email.
 * Supabase signs them in temporarily; they choose a new password here.
 */
export const ResetPasswordModal: React.FC = () => {
  const { isRecoveringPassword, finishPasswordRecovery } = useAuth();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isRecoveringPassword) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(isSw ? 'Nenosiri lazima liwe na angalau herufi 6.' : 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError(isSw ? 'Manenosiri hayafanani.' : 'The two passwords do not match.');
      return;
    }
    if (!supabase) return;
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => {
        finishPasswordRecovery();
        // Clean the recovery tokens out of the address bar
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || (isSw ? 'Imeshindwa kubadili nenosiri.' : 'Could not change the password.'));
    } finally {
      setSaving(false);
    }
  };

  const input = `w-full border rounded-lg pl-9 pr-10 py-2.5 text-xs focus:outline-hidden ${
    isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500' : 'bg-[#040c0c] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
  }`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <form
        onSubmit={submit}
        className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 ${
          isLight ? 'bg-white border-teal-300 text-slate-900' : 'bg-[#051315] border-[#00f5c4]/40 text-white'
        }`}
      >
        <h2 className="text-lg font-bold mb-1">{isSw ? 'Weka nenosiri jipya' : 'Choose a new password'}</h2>
        <p className={`text-xs mb-4 ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
          {isSw ? 'Andika nenosiri jipya utakalotumia kuingia.' : 'Type the new password you will use to sign in.'}
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
        {done && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-500 text-xs flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{isSw ? 'Nenosiri limebadilishwa!' : 'Password changed! You are signed in.'}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-[#00f5c4]" />
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSw ? 'Nenosiri jipya' : 'New password'} autoComplete="new-password" className={input} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2.5 top-2.5 text-[#6fa5a0]" aria-label="Toggle password visibility">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-[#00f5c4]" />
            <input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={isSw ? 'Rudia nenosiri' : 'Repeat new password'} autoComplete="new-password" className={input} />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || done}
          className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold ${
            isLight ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-[#00f5c4] hover:bg-[#15ffd1] text-[#02211b]'
          } disabled:opacity-60`}
        >
          {saving ? (isSw ? 'Inahifadhi...' : 'Saving...') : isSw ? 'Hifadhi nenosiri' : 'Save new password'}
        </button>
      </form>
    </div>
  );
};
