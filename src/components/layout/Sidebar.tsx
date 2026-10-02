import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Layers,
  Egg,
  Flame,
  TrendingDown,
  Receipt,
  DollarSign,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  X,
  Bird,
  Newspaper,
  Sun,
  Moon,
} from 'lucide-react';

export type NavigationTab = 
  | 'dashboard'
  | 'poultry'
  | 'eggs'
  | 'brooding'
  | 'expenses'
  | 'sales'
  | 'financials'
  | 'reports'
  | 'news'
  | 'admin';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSignIn: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenSignIn,
}) => {
  const { t, lang } = useLanguage();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === 'light';

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'poultry', label: t.flockStock, icon: Layers },
    { id: 'eggs', label: t.eggProduction, icon: Egg },
    { id: 'brooding', label: t.broodingHatching, icon: Flame },
    { id: 'expenses', label: t.expenses, icon: TrendingDown },
    { id: 'sales', label: t.sales, icon: Receipt },
    { id: 'financials', label: t.financials, icon: DollarSign },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'news', label: t.newsAdvisory, icon: Newspaper },
    ...(isAdmin ? [{ id: 'admin', label: t.adminPanel, icon: ShieldCheck }] : []),
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div
      className={`flex flex-col h-full border-r transition-colors duration-200 ${
        isLight
          ? 'bg-slate-50 border-teal-200/80 text-slate-800'
          : 'bg-[#030d0f] border-[#00f5c4]/25 text-white'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center justify-between px-4 border-b shrink-0 transition-colors ${
          isLight
            ? 'bg-white border-teal-200/80'
            : 'bg-[#02090b] border-[#00f5c4]/25'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
              isLight
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-[#00f5c4]/20 border-[#00f5c4]/45 text-[#00f5c4] shadow-[0_0_14px_rgba(0,245,196,0.35)]'
            }`}
          >
            <Bird className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="truncate">
              <h1 className={`text-sm font-bold tracking-tight flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>{t.appName}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLight
                      ? 'bg-teal-500 shadow-[0_0_8px_#14b8a6]'
                      : 'bg-[#00f5c4] shadow-[0_0_8px_#00f5c4]'
                  }`}
                />
              </h1>
              <p className={`text-[11px] truncate leading-none mt-0.5 ${isLight ? 'text-teal-700' : 'text-[#86b5b1]'}`}>
                {t.tagline}
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Button */}
        {!isMobileOpen && (
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-500 hover:text-teal-700 hover:bg-teal-100/60'
                : 'text-neutral-400 hover:text-[#00f5c4] hover:bg-[#071c1f]'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as NavigationTab)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? isLight
                    ? 'bg-teal-600 text-white font-bold shadow-md'
                    : 'bg-[#00f5c4] text-[#021f1a] font-bold shadow-[0_0_20px_rgba(0,245,196,0.35)]'
                  : isLight
                  ? 'text-slate-700 hover:text-teal-900 hover:bg-teal-50 border border-transparent hover:border-teal-200'
                  : 'text-[#9ec4c0] hover:text-white hover:bg-[#071c1f] border border-transparent hover:border-[#00f5c4]/20'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? isLight ? 'text-white' : 'text-[#021f1a]'
                    : isLight ? 'text-teal-600 group-hover:text-teal-800' : 'text-[#00f5c4] group-hover:text-[#38ffd9]'
                }`}
              />
              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* User profile footer & Sign In/Out Option */}
      <div
        className={`p-3 border-t shrink-0 transition-colors ${
          isLight
            ? 'bg-white border-teal-200/80'
            : 'bg-[#02090b] border-[#00f5c4]/25'
        }`}
      >
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${
                  isLight
                    ? 'bg-teal-100 text-teal-800 border-teal-300'
                    : 'bg-[#00f5c4]/20 border-[#00f5c4]/40 text-[#00f5c4] shadow-[0_0_10px_rgba(0,245,196,0.25)]'
                }`}
              >
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="truncate text-left">
                  <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {profile?.full_name || user.email}
                  </div>
                  <div className={`text-[10px] capitalize flex items-center gap-1 font-semibold ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
                    <span>
                      {profile?.role === 'admin'
                        ? lang === 'sw' ? 'Msimamizi' : 'Admin'
                        : lang === 'sw' ? 'Mfanyakazi' : 'Staff'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <button
                onClick={signOut}
                title={t.signOut}
                className="text-rose-500 hover:text-white p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 border border-rose-300 hover:border-rose-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenSignIn}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 font-bold rounded-xl text-xs transition-all cursor-pointer ${
              isLight
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                : 'bg-[#00f5c4] hover:bg-[#1effd5] text-[#021f1a] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            {(!isCollapsed || isMobileOpen) && <span>{t.signIn}</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:block h-screen transition-all duration-200 shrink-0 sticky top-0 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full z-10 animate-in slide-in-from-left duration-200 ${
              isLight ? 'bg-slate-50' : 'bg-[#050e0e]'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
