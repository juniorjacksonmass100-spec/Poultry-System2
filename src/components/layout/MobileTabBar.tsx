import React from 'react';
import { Home, Bird, Egg, ShoppingBag, Grid2x2 } from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface MobileTabBarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  /** Opens the full menu (the "More" tab) */
  onOpenMenu: () => void;
  /** Number shown on "More" (unread messages, requests waiting) */
  moreBadge?: number;
}

/**
 * The tab bar at the bottom of the screen on phones, like an iPhone app:
 * the four screens used every day, and "More" for everything else.
 */
export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentTab, onSelectTab, onOpenMenu, moreBadge = 0 }) => {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isLight = theme === 'light';
  const sw = lang === 'sw';

  const items: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: sw ? 'Nyumbani' : 'Home', icon: Home },
    { id: 'poultry', label: sw ? 'Ndege' : 'Birds', icon: Bird },
    { id: 'eggs', label: sw ? 'Mayai' : 'Eggs', icon: Egg },
    { id: 'sales', label: sw ? 'Mauzo' : 'Sales', icon: ShoppingBag },
  ];
  const inMore = !items.some((i) => i.id === currentTab);

  const active = isLight ? 'text-teal-700' : 'text-[#00f5c4]';
  const idle = isLight ? 'text-slate-500' : 'text-[#7fa6a2]';

  const Tab: React.FC<{ selected: boolean; label: string; icon: React.ElementType; onClick: () => void; badge?: number }> = ({
    selected,
    label,
    icon: Icon,
    onClick,
    badge = 0,
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      className={`kuku-tab relative flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 ${selected ? active : idle}`}
    >
      <span className={`kuku-tab-pill relative flex items-center justify-center w-14 h-8 rounded-full ${selected ? (isLight ? 'bg-teal-600/12' : 'bg-[#00f5c4]/15') : ''}`}>
        <Icon className="w-[22px] h-[22px]" strokeWidth={selected ? 2.4 : 1.9} />
        {badge > 0 && (
          <span className="absolute -top-0.5 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className={`text-[10px] leading-none ${selected ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t kuku-glass ${
        isLight ? 'bg-white/80 border-slate-200/80' : 'bg-[#040e10]/80 border-white/10'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={sw ? 'Menyu kuu' : 'Main menu'}
    >
      {items.map((i) => (
        <Tab key={i.id} selected={currentTab === i.id} label={i.label} icon={i.icon} onClick={() => onSelectTab(i.id)} />
      ))}
      <Tab selected={inMore} label={sw ? 'Zaidi' : 'More'} icon={Grid2x2} onClick={onOpenMenu} badge={moreBadge} />
    </nav>
  );
};
