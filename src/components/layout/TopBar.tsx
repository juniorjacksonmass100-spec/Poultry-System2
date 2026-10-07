import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NavigationTab } from './Sidebar';
import { Menu, Globe, FileSpreadsheet, Shield, LogOut, LogIn, Sun, Moon, RefreshCw, Settings, MoreVertical, ChevronRight } from 'lucide-react';
import { UserProfileModal } from '../auth/UserProfileModal';

interface TopBarProps {
  currentTab: NavigationTab;
  onOpenMobileMenu: () => void;
  onExportAll: () => void;
  isRealtimeActive: boolean;
  onOpenSignIn: () => void;
  onOpenDataManagement?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenSettings?: () => void;
  /** The notification bell (rendered by the parent so it can own the data) */
  bellSlot?: React.ReactNode;
}


const MenuGroup: React.FC<{ isLight: boolean; title: string; children: React.ReactNode }> = ({ isLight, title, children }) => (
  <div className={`p-2 border-b ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/15'}`}>
    <div className={`px-3 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-[#729997]'}`}>
      {title}
    </div>
    <div className="space-y-1">{children}</div>
  </div>
);

const MenuRow: React.FC<{
  isLight: boolean;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}> = ({ isLight, icon, label, sub, trailing, danger, onClick }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`w-full min-h-[52px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
      danger
        ? 'text-rose-500 hover:bg-rose-500/10'
        : isLight
        ? 'hover:bg-slate-100 text-slate-900'
        : 'hover:bg-[#0c2020] text-white'
    }`}
  >
    <span className="shrink-0 w-9 h-9 flex items-center justify-center">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-semibold truncate">{label}</span>
      {sub && <span className={`block text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>{sub}</span>}
    </span>
    {trailing}
  </button>
);

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onExportAll,
  isRealtimeActive,
  onOpenSignIn,
  onOpenDataManagement,
  onRefresh,
  isRefreshing = false,
  onOpenSettings,
  bellSlot,
}) => {
  const { lang, setLanguage, t } = useLanguage();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when tapping anywhere else
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return t.dashboard;
      case 'poultry':
        return t.flockStock;
      case 'eggs':
        return t.eggProduction;
      case 'brooding':
        return t.broodingHatching;
      case 'expenses':
        return t.expenses;
      case 'sales':
        return t.sales;
      case 'financials':
        return t.financials;
      case 'valuation':
        return lang === 'sw' ? 'Thamani na Bei' : 'Net Worth & Pricing';
      case 'reports':
        return t.reports;
      case 'news':
        return t.newsAdvisory;
      case 'admin':
        return t.adminPanel;
      default:
        return t.dashboard;
    }
  };

  const toggleLanguage = () => {
    setLanguage(lang === 'en' ? 'sw' : 'en');
  };

  const isLight = theme === 'light';

  return (
    <>
      <header
        className={`h-[68px] px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 transition-colors backdrop-blur-md ${
          isLight
            ? 'bg-white/90 border-b border-teal-200/80 shadow-[0_4px_20px_rgba(13,148,136,0.08)] text-slate-800'
            : 'bg-[#030e10]/95 border-b border-[#00f5c4]/25 shadow-[0_4px_25px_rgba(0,0,0,0.6)] text-white'
        }`}
      >
        {/* Zone 1: Mobile Hamburger & Context Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className={`md:hidden w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${
              isLight
                ? 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
                : 'text-neutral-300 hover:text-[#00f5c4] hover:bg-[#071d20]'
            }`}
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold truncate">
            <span className={`font-normal hidden sm:inline ${isLight ? 'text-teal-700' : 'text-[#598582]'}`}>
              {t.appName}
            </span>
            <span className={`hidden sm:inline ${isLight ? 'text-slate-300' : 'text-[#1a3d3c]'}`}>/</span>
            <span className={`truncate font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {getTabTitle(currentTab)}
            </span>
            {isAdmin && (
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm ${
                  isLight
                    ? 'text-teal-800 bg-teal-100 border border-teal-300'
                    : 'text-[#00f5c4] bg-[#00f5c4]/15 border border-[#00f5c4]/35 shadow-[0_0_10px_rgba(0,245,196,0.25)]'
                }`}
              >
                <Shield className="w-3 h-3" />
                {lang === 'sw' ? 'Msimamizi' : 'Admin'}
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Realtime Live Sync Status */}
        <div className={`hidden lg:flex items-center gap-2 text-xs ${isLight ? 'text-slate-600' : 'text-[#a2ccc8]'}`}>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRealtimeActive
                ? isLight
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse'
                  : 'bg-[#00f5c4] shadow-[0_0_12px_#00f5c4] animate-pulse'
                : 'bg-neutral-400'
            }`}
          />
          <span className="font-mono text-[11px]">{isRealtimeActive ? t.connected : t.disconnected}</span>
        </div>

        {/* Zone 3: three big, well-spaced buttons. Everything else lives in the "More" menu. */}
        <div className="flex items-center gap-3 shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                isLight
                  ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                  : 'bg-[#071c1f] hover:bg-[#0b282c] text-[#00f5c4] border-[#00f5c4]/25'
              }`}
              title={lang === 'sw' ? 'Onyesha upya data' : 'Refresh data'}
              aria-label={lang === 'sw' ? 'Onyesha upya data' : 'Refresh data'}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'kuku-spin' : ''}`} />
            </button>
          )}

          {user && bellSlot}

          {!user && (
            <button
              onClick={onOpenSignIn}
              className={`h-11 px-4 flex items-center gap-2 text-sm font-bold rounded-xl ${
                isLight ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm' : 'text-[#021f1a] bg-[#00f5c4] hover:bg-[#1effd5]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{t.signIn}</span>
            </button>
          )}

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                menuOpen
                  ? isLight ? 'bg-teal-600 text-white border-teal-600' : 'bg-[#00f5c4] text-[#02211b] border-[#00f5c4]'
                  : isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#071c1f] text-[#c4dedc] border-[#00f5c4]/25'
              }`}
              aria-label={lang === 'sw' ? 'Zaidi' : 'More'}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className={`fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[72px] sm:top-[52px] sm:w-80 max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl z-[60] kuku-banner ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#081515] border-[#00f5c4]/30 text-white'
                }`}
              >
                {/* Account */}
                {user && (
                  <div className={`p-2 border-b ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/15'}`}>
                    <MenuRow
                      isLight={isLight}
                      onClick={() => {
                        setMenuOpen(false);
                        setShowProfileModal(true);
                      }}
                      icon={
                        <span
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-bold ${
                            isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-[#00f5c4]/20 text-[#00f5c4] border-[#00f5c4]/40'
                          }`}
                        >
                          {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      }
                      label={profile?.full_name || user.email?.split('@')[0] || ''}
                      sub={`${profile?.role === 'admin' ? (lang === 'sw' ? 'Msimamizi' : 'Admin') : lang === 'sw' ? 'Mfanyakazi' : 'Staff'} · ${lang === 'sw' ? 'Wasifu' : 'My profile'}`}
                      trailing={<ChevronRight className="w-4 h-4 opacity-50" />}
                    />
                  </div>
                )}

                {/* Data */}
                <MenuGroup isLight={isLight} title={lang === 'sw' ? 'Data' : 'Data'}>
                  <MenuRow
                    isLight={isLight}
                    onClick={() => {
                      setMenuOpen(false);
                      onExportAll();
                    }}
                    icon={<FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
                    label={t.exportExcel}
                    sub={lang === 'sw' ? 'Huhifadhiwa kwenye Downloads' : 'Saved to your Downloads folder'}
                  />
                </MenuGroup>

                {/* Appearance */}
                <MenuGroup isLight={isLight} title={lang === 'sw' ? 'Mwonekano' : 'Appearance'}>
                  <MenuRow
                    isLight={isLight}
                    onClick={toggleTheme}
                    icon={isLight ? <Moon className="w-5 h-5 text-teal-700" /> : <Sun className="w-5 h-5 text-[#00f5c4]" />}
                    label={isLight ? (lang === 'sw' ? 'Hali ya Giza' : 'Dark mode') : lang === 'sw' ? 'Hali ya Mwangaza' : 'Light mode'}
                  />
                  <MenuRow
                    isLight={isLight}
                    onClick={toggleLanguage}
                    icon={<Globe className={`w-5 h-5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />}
                    label={lang === 'en' ? 'Kiswahili' : 'English'}
                    sub={lang === 'en' ? 'Badili lugha' : 'Change language'}
                  />
                  {onOpenSettings && (
                    <MenuRow
                      isLight={isLight}
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSettings();
                      }}
                      icon={<Settings className={`w-5 h-5 ${isLight ? 'text-slate-600' : 'text-[#c4dedc]'}`} />}
                      label={lang === 'sw' ? 'Mipangilio' : 'Settings'}
                      sub={lang === 'sw' ? 'Herufi, ukubwa wa maandishi, arifa' : 'Fonts, text size, notifications'}
                      trailing={<ChevronRight className="w-4 h-4 opacity-50" />}
                    />
                  )}
                </MenuGroup>

                {/* Connection + sign out */}
                <div className={`p-2 border-t ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/15'}`}>
                  <div className={`flex items-center gap-2 px-3 py-2 text-xs ${isLight ? 'text-slate-600' : 'text-[#a2ccc8]'}`}>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isRealtimeActive ? (isLight ? 'bg-emerald-500' : 'bg-[#00f5c4]') : 'bg-neutral-400'
                      }`}
                    />
                    <span className="font-mono text-[11px]">{isRealtimeActive ? t.connected : t.disconnected}</span>
                  </div>
                  {user && (
                    <MenuRow
                      isLight={isLight}
                      danger
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      icon={<LogOut className="w-5 h-5" />}
                      label={t.signOut}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenDataManagement={onOpenDataManagement}
      />
    </>
  );
};
