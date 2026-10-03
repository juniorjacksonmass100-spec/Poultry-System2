import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NavigationTab } from './Sidebar';
import { Menu, Globe, FileSpreadsheet, Shield, LogOut, LogIn, Sun, Moon, RefreshCw } from 'lucide-react';
import { FontSizeSwitcher } from '../common/FontSizeSwitcher';
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
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onExportAll,
  isRealtimeActive,
  onOpenSignIn,
  onOpenDataManagement,
  onRefresh,
  isRefreshing = false,
}) => {
  const { lang, setLanguage, t } = useLanguage();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);

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
        className={`h-16 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors backdrop-blur-md ${
          isLight
            ? 'bg-white/90 border-b border-teal-200/80 shadow-[0_4px_20px_rgba(13,148,136,0.08)] text-slate-800'
            : 'bg-[#030e10]/95 border-b border-[#00f5c4]/25 shadow-[0_4px_25px_rgba(0,0,0,0.6)] text-white'
        }`}
      >
        {/* Zone 1: Mobile Hamburger & Context Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className={`md:hidden p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
                : 'text-neutral-300 hover:text-[#00f5c4] hover:bg-[#071d20]'
            }`}
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
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

        {/* Zone 3: Actions (Theme Toggle + Language + Excel Export + Sign In / Out) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Refresh: pulls the newest data from the database */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all cursor-pointer ${
                isLight
                  ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                  : 'bg-[#071c1f] hover:bg-[#0b282c] text-[#00f5c4] border-[#00f5c4]/25 shadow-[0_0_10px_rgba(0,245,196,0.15)]'
              }`}
              title={lang === 'sw' ? 'Onyesha upya data' : 'Refresh data'}
              aria-label={lang === 'sw' ? 'Onyesha upya data' : 'Refresh data'}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'kuku-spin' : ''}`} />
              <span className="hidden lg:inline font-mono text-[11px] font-semibold">
                {lang === 'sw' ? 'Onyesha upya' : 'Refresh'}
              </span>
            </button>
          )}

          {/* Text size */}
          <FontSizeSwitcher className="hidden sm:flex" />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all cursor-pointer ${
              isLight
                ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                : 'bg-[#071c1f] hover:bg-[#0b282c] text-[#00f5c4] border-[#00f5c4]/25 shadow-[0_0_10px_rgba(0,245,196,0.15)]'
            }`}
            title={isLight ? (lang === 'sw' ? 'Washa Hali ya Giza' : 'Switch to Dark Mode') : (lang === 'sw' ? 'Washa Hali ya Mwangaza' : 'Switch to Light Mode')}
          >
            {isLight ? <Moon className="w-4 h-4 text-teal-700" /> : <Sun className="w-4 h-4 text-[#00f5c4]" />}
            <span className="hidden md:inline font-mono text-[11px] font-semibold">
              {isLight ? (lang === 'sw' ? 'Giza' : 'Dark') : (lang === 'sw' ? 'Mwangaza' : 'Light')}
            </span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'text-[#c8eae6] hover:text-white bg-[#071c1f] hover:bg-[#0b282c] border-[#00f5c4]/25'
            }`}
            title="Switch language / Badili lugha"
          >
            <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
            <span className="uppercase font-mono text-[11px] font-bold">
              {lang === 'en' ? 'Swahili' : 'English'}
            </span>
          </button>

          {/* Global Export Excel button */}
          <button
            onClick={onExportAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isLight
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                : 'text-[#021f1a] bg-[#00f5c4] hover:bg-[#1effd5] shadow-[0_0_14px_rgba(0,245,196,0.35)]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.exportExcel}</span>
            <span className="sm:hidden">Excel</span>
          </button>

          {/* Sign In / Sign Out Option */}
          {user ? (
            <div className={`flex items-center gap-2 pl-2 border-l ${isLight ? 'border-slate-300' : 'border-[#00f5c4]/25'}`}>
              <button
                onClick={() => setShowProfileModal(true)}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all text-left cursor-pointer ${
                  isLight
                    ? 'hover:bg-teal-50 border-transparent hover:border-teal-200 text-slate-800'
                    : 'hover:bg-[#082225] border-transparent hover:border-[#00f5c4]/30 text-white'
                }`}
                title="View Account Profile"
              >
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold ${
                    isLight
                      ? 'bg-teal-100 text-teal-800 border-teal-300'
                      : 'bg-[#00f5c4]/20 text-[#00f5c4] border-[#00f5c4]/40 shadow-[0_0_8px_rgba(0,245,196,0.25)]'
                  }`}
                >
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden xl:flex flex-col">
                  <span className={`text-[11px] font-bold truncate max-w-[120px] leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className={`text-[10px] capitalize font-medium ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
                    {profile?.role === 'admin'
                      ? lang === 'sw' ? 'Msimamizi' : 'Admin'
                      : lang === 'sw' ? 'Mfanyakazi' : 'Staff'}
                  </span>
                </div>
              </button>

              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-300 hover:border-rose-500 rounded-lg transition-all cursor-pointer"
                title={t.signOut}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.signOut}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenSignIn}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isLight
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                  : 'text-[#021f1a] bg-[#00f5c4] hover:bg-[#1effd5] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.signIn}</span>
            </button>
          )}
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
