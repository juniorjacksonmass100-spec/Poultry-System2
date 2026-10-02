import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { X, User, Mail, Shield, Phone, Calendar, LogOut, CheckCircle2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDataManagement?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenDataManagement,
}) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  if (!isOpen || !user) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl relative transition-colors ${
          isLight
            ? 'bg-white border-teal-300 text-slate-900 shadow-xl'
            : 'bg-[#051315] border-[#00f5c4]/45 text-white shadow-[0_0_40px_rgba(0,245,196,0.22)]'
        }`}
      >
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

        <div className="flex items-center gap-3.5 mb-6">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center text-lg font-bold shadow-md ${
              isLight
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-[#00f5c4]/20 border-[#00f5c4]/45 text-[#00f5c4] shadow-[0_0_15px_rgba(0,245,196,0.3)]'
            }`}
          >
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className={`text-base font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {profile?.full_name || (isSw ? 'Mtumiaji wa Shamba' : 'Farm User')}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isAdmin
                    ? isLight
                      ? 'text-teal-800 bg-teal-100 border-teal-300'
                      : 'text-[#00f5c4] bg-[#00f5c4]/15 border-[#00f5c4]/40 shadow-[0_0_10px_rgba(0,245,196,0.25)]'
                    : isLight
                    ? 'text-cyan-800 bg-cyan-100 border-cyan-300'
                    : 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span className="capitalize">
                  {profile?.role === 'admin'
                    ? isSw ? 'Msimamizi Mkuu' : 'Admin'
                    : isSw ? 'Mfanyakazi' : 'Staff'}
                </span>
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                {isSw ? 'Inatumika' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`space-y-3 p-4 rounded-xl border text-xs mb-4 ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-[#030b0d] border-[#00f5c4]/20'
          }`}
        >
          <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/10'}`}>
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-[#8baaa8]'}`}>
              <Mail className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              {t.emailLabel}
            </span>
            <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>{user.email}</span>
          </div>

          <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/10'}`}>
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-[#8baaa8]'}`}>
              <User className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              {t.fullNameLabel}
            </span>
            <span className={`font-medium ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>{profile?.full_name || '—'}</span>
          </div>

          {profile?.phone && (
            <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/10'}`}>
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-[#8baaa8]'}`}>
                <Phone className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                {t.phoneLabel}
              </span>
              <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>{profile.phone}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-[#8baaa8]'}`}>
              <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              {t.memberSinceLabel}
            </span>
            <span className={`font-mono ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : (isSw ? 'Inatumika' : 'Active')}
            </span>
          </div>
        </div>

        {/* User Data Management Option */}
        {onOpenDataManagement && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDataManagement();
              }}
              className={`w-full py-2.5 px-3.5 border rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-700'
                  : 'bg-gradient-to-r from-rose-500/10 via-[#0a1e20] to-[#041416] hover:from-rose-500/20 border-rose-500/30 text-rose-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                <span>{t.deleteErroneousDataBtn}</span>
              </div>
              <span className="text-[10px] text-rose-500 font-mono">
                {isSw ? 'Simamia →' : 'Manage →'}
              </span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                : 'text-neutral-300 hover:text-white bg-[#0a1e20] hover:bg-[#0f2d30] border-[#00f5c4]/20'
            }`}
          >
            {t.cancel}
          </button>

          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
