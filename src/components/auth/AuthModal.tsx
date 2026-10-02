import React, { useState } from 'react';
import { useAuth, isMasterAdmin } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AUTH_TRIGGER_FIX_SQL } from '../../lib/schemaSql';
import { Shield, Lock, Mail, User, Phone, AlertCircle, CheckCircle2, ArrowRight, X, UserCheck, Copy, Check, Terminal } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { refreshProfile, checkFirstRunStatus } = useAuth();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTriggerError, setIsTriggerError] = useState(false);
  const [copiedTriggerSql, setCopiedTriggerSql] = useState(false);

  if (!isOpen) return null;

  const isEnteredMasterAdmin = isMasterAdmin(email);

  const handleCopyTriggerSql = async () => {
    try {
      await navigator.clipboard.writeText(AUTH_TRIGGER_FIX_SQL);
      setCopiedTriggerSql(true);
      setTimeout(() => setCopiedTriggerSql(false), 3000);
    } catch {
      setCopiedTriggerSql(true);
      setTimeout(() => setCopiedTriggerSql(false), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsTriggerError(false);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage(
        isSw
          ? 'Hifadhidata ya Supabase haijaunganishwa bado. Tafadhali hakiki mipangilio yako.'
          : 'Supabase is not configured yet. Please configure your project environment variables.'
      );
      return;
    }

    if (!email || !password) {
      setErrorMessage(isSw ? 'Tafadhali weka barua pepe na nenosiri.' : 'Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage(isSw ? 'Nenosiri lazima liwe na angalau herufi 6.' : 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const assignedRole = isMasterAdmin(email.trim()) ? 'admin' : 'staff';

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
              phone: phone.trim() || undefined,
              role: assignedRole,
            },
          },
        });

        if (error) throw error;

        // Ensure profile exists in profiles table
        if (data.user) {
          try {
            await supabase.from('profiles').upsert([
              {
                id: data.user.id,
                email: email.trim(),
                full_name: fullName.trim() || email.trim().split('@')[0],
                phone: phone.trim() || null,
                role: assignedRole,
                is_active: true,
              },
            ]);
          } catch {
            // Handled by database trigger or silent failover
          }
        }

        setSuccessMessage(t.signUpSuccess);
        setTimeout(async () => {
          await refreshProfile();
          if (onClose) onClose();
        }, 1200);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        await refreshProfile();
        if (onClose) onClose();
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      const msg = err.message || '';

      if (msg.includes('Database error saving new user') || msg.includes('500') || msg.includes('trigger')) {
        setIsTriggerError(true);
        setErrorMessage(
          isSw
            ? 'Hitilafu ya kuhifadhi mtumiaji kwenye hifadhidata ya Supabase. Tumia kitufe hapo chini kusasisha trigger ya auth.'
            : 'Database error saving new user. Please update your Supabase Auth Trigger using the tool below.'
        );
      } else {
        setErrorMessage(err.message || t.authError);
      }
    } finally {
      setIsLoading(false);
      await checkFirstRunStatus();
    }
  };

  const inputClass = `w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-hidden transition-colors ${
    isLight
      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500'
      : 'bg-[#040c0c] border-[#00f5c4]/20 text-white placeholder:text-neutral-600 focus:border-[#00f5c4]'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className={`border rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative transition-colors ${
          isLight
            ? 'bg-white border-teal-300 text-slate-900'
            : 'bg-[#051315] border-[#00f5c4]/40 text-white shadow-[0_0_40px_rgba(0,245,196,0.22)]'
        }`}
      >
        {onClose && (
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                : 'text-neutral-400 hover:text-[#00f5c4] hover:bg-[#092224]'
            }`}
            title={isSw ? 'Funga' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Mode Selector Tabs */}
        <div
          className={`flex items-center gap-1 p-1 border rounded-xl mb-6 text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#020708] border-[#00f5c4]/20'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? isLight
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'bg-[#00f5c4] text-[#021f1a] font-bold shadow-[0_0_12px_rgba(0,245,196,0.4)]'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? isLight
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'bg-[#00f5c4] text-[#021f1a] font-bold shadow-[0_0_12px_rgba(0,245,196,0.4)]'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.registerAccountTab}
          </button>
        </div>

        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-3 shadow-md ${
              isLight
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-[#00f5c4]/15 border-[#00f5c4]/30 text-[#00f5c4] shadow-[0_0_15px_rgba(0,245,196,0.25)]'
            }`}
          >
            {isEnteredMasterAdmin ? <Shield className="w-6 h-6" /> : mode === 'signup' ? <UserCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className={`text-xl font-bold tracking-tight flex items-center justify-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <span>
              {mode === 'signup'
                ? isEnteredMasterAdmin
                  ? t.adminRegistrationTitle
                  : t.newUserRegistrationTitle
                : t.signInTitle}
            </span>
          </h2>
          <p className={`mt-1.5 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
            {mode === 'signup'
              ? isEnteredMasterAdmin
                ? t.adminRegistrationDesc
                : t.newUserRegistrationDesc
              : t.signInDesc}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2.5 text-rose-500 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>

            {isTriggerError && (
              <div
                className={`mt-1 p-2.5 rounded-lg border flex flex-col gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#030e10] border-[#00f5c4]/30'
                }`}
              >
                <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
                  <Terminal className="w-3.5 h-3.5" />
                  {isSw ? 'Ufumbuzi: Sasisha Trigger ya Auth ya Supabase' : 'Quick Fix: Update your Supabase Auth Trigger'}
                </span>
                <p className={`text-[10px] leading-normal ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
                  {isSw
                    ? 'Nakili hati ya SQL salama hapa chini, fungua SQL Editor ya mradi wako wa Supabase, bandika na bonyeza RUN.'
                    : "Copy the safe trigger SQL script below, open your Supabase project's SQL Editor, paste it, and click RUN."}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleCopyTriggerSql}
                    className={`flex-1 py-1.5 px-2 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isLight
                        ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                        : 'bg-[#00f5c4] hover:bg-[#15ffd1] text-[#021f1a] shadow-[0_0_10px_rgba(0,245,196,0.3)]'
                    }`}
                  >
                    {copiedTriggerSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>
                      {copiedTriggerSql
                        ? isSw ? 'SQL Imenakiliwa!' : 'Trigger SQL Copied!'
                        : isSw ? 'Nakili SQL ya Kurekebisha Trigger' : 'Copy Trigger Fix SQL'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                      setIsTriggerError(false);
                    }}
                    className={`py-1.5 px-2.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-[#0a2225] hover:bg-[#0e2c30] text-neutral-300 hover:text-white border-[#00f5c4]/20'
                    }`}
                  >
                    {isSw ? 'Jaribu Kuingia' : 'Try Sign In'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
                  {t.fullName}
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isSw ? 'mf. Jackson Mass' : 'e.g. Jackson Mass'}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
                  {t.phone}
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
              {t.email}
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@poultryfarm.co.tz"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-[#c4dedc]'}`}>
              {t.password}
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isLight
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                : 'bg-[#00f5c4] hover:bg-[#15ffd1] text-[#02211b] shadow-[0_0_18px_rgba(0,245,196,0.35)]'
            }`}
          >
            {isLoading ? (
              <span>{t.saving}</span>
            ) : (
              <>
                <span>{mode === 'signup' ? t.signUp : t.signIn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className={`mt-5 pt-4 border-t text-center ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/15'}`}>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setErrorMessage(null);
            }}
            className={`text-xs transition-colors cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-teal-700' : 'text-[#94b8b6] hover:text-[#00f5c4]'
            }`}
          >
            {mode === 'signin' ? t.dontHaveAccount : t.alreadyHaveAccount}
          </button>
        </div>
      </div>
    </div>
  );
};
