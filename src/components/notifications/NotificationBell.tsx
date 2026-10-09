import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Egg, CheckCheck, Megaphone, MessageSquare, UserCog } from 'lucide-react';
import { PoultryNews } from '../../types';
import { HatchAlert } from '../../hooks/useHatchReminders';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  PermissionState,
  getNotificationPermission,
  requestNotificationPermission,
} from '../../lib/notifications';

interface NotificationBellProps {
  messages: PoultryNews[];
  unreadIds: Set<string>;
  hatchAlerts: HatchAlert[];
  onOpenMessages: () => void;
  onOpenBrooding: () => void;
  onMarkAllRead: () => void;
  /** Unread direct messages */
  chatUnread?: number;
  onOpenChat?: () => void;
  /** Admin: change requests waiting for review */
  pendingRequests?: number;
  onOpenRequests?: () => void;
}

const timeAgo = (iso: string, isSw: boolean): string => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return isSw ? 'sasa hivi' : 'just now';
  if (mins < 60) return isSw ? `dak ${mins}` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return isSw ? `saa ${hrs}` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return isSw ? `siku ${days}` : `${days}d ago`;
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  messages,
  unreadIds,
  hatchAlerts,
  onOpenMessages,
  onOpenBrooding,
  onMarkAllRead,
  chatUnread = 0,
  onOpenChat,
  pendingRequests = 0,
  onOpenRequests,
}) => {
  const { theme } = useTheme();
  const { lang } = useLanguage();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('default');
  const wrapRef = useRef<HTMLDivElement>(null);

  const count = unreadIds.size + hatchAlerts.length + chatUnread + pendingRequests;

  useEffect(() => {
    void getNotificationPermission().then(setPermission);
  }, [open]);

  // Close when tapping outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const shown = messages.slice(0, 15);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative w-11 h-11 rounded-xl border flex items-center justify-center ${
          isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#071c1f] border-[#00f5c4]/25 text-[#c4dedc]'
        }`}
        aria-label={isSw ? 'Arifa' : 'Notifications'}
        aria-expanded={open}
      >
        {count > 0 ? <BellRing className="w-5 h-5 text-amber-500" /> : <Bell className="w-5 h-5" />}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#030e10]">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[72px] sm:top-[52px] sm:w-[22rem] max-h-[70vh] flex flex-col rounded-2xl border shadow-2xl z-[60] kuku-banner ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#081515] border-[#00f5c4]/30 text-white'
          }`}
          role="dialog"
          aria-label={isSw ? 'Arifa' : 'Notifications'}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/20'}`}>
            <div className="text-sm font-bold">{isSw ? 'Arifa' : 'Notifications'}</div>
            {unreadIds.size > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-bold ${
                  isLight ? 'text-teal-700 bg-teal-50' : 'text-[#00f5c4] bg-[#00f5c4]/10'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {isSw ? 'Weka zote zimesomwa' : 'Mark all read'}
              </button>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-slate-200/20">
            {chatUnread > 0 && onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenChat();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold">
                    {isSw ? `Ujumbe ${chatUnread} mpya` : `${chatUnread} new message${chatUnread === 1 ? '' : 's'}`}
                  </span>
                  <span className={`block text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-[#a2ccc8]'}`}>{isSw ? 'Gusa kusoma' : 'Tap to read'}</span>
                </span>
              </button>
            )}
            {pendingRequests > 0 && onOpenRequests && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenRequests();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="shrink-0 w-9 h-9 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center">
                  <UserCog className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold">
                    {isSw ? `Maombi ${pendingRequests} yanasubiri ukaguzi` : `${pendingRequests} change request${pendingRequests === 1 ? '' : 's'} to review`}
                  </span>
                  <span className={`block text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-[#a2ccc8]'}`}>{isSw ? 'Gusa kukagua' : 'Tap to review'}</span>
                </span>
              </button>
            )}
            {hatchAlerts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenBrooding();
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left"
              >
                <span className="shrink-0 w-9 h-9 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center">
                  <Egg className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold">{a.title}</span>
                  <span className={`block text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-[#a2ccc8]'}`}>{a.body}</span>
                </span>
              </button>
            ))}

            {shown.map((n) => {
              const isUnread = unreadIds.has(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenMessages();
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left"
                >
                  <span className="shrink-0 w-9 h-9 rounded-full bg-[#00f5c4] text-[#02211b] flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`text-xs truncate ${isUnread ? 'font-bold' : 'font-semibold opacity-80'}`}>{n.title}</span>
                      <span className="text-[10px] opacity-60 shrink-0">{timeAgo(n.created_at, isSw)}</span>
                    </span>
                    <span className={`block text-xs mt-0.5 line-clamp-2 ${isLight ? 'text-slate-600' : 'text-[#a2ccc8]'}`}>{n.content}</span>
                  </span>
                  {isUnread && <span className="shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500" aria-label="unread" />}
                </button>
              );
            })}

            {shown.length === 0 && hatchAlerts.length === 0 && chatUnread === 0 && pendingRequests === 0 && (
              <div className="px-4 py-8 text-center text-xs opacity-70">{isSw ? 'Hakuna arifa bado.' : 'No notifications yet.'}</div>
            )}
          </div>

          {permission !== 'granted' && permission !== 'unsupported' && (
            <div className={`px-4 py-3 border-t text-xs ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#00f5c4]/20 bg-[#061212]'}`}>
              {permission === 'denied' ? (
                <span className="opacity-80">
                  {isSw
                    ? 'Arifa za simu zimezuiwa. Ziruhusu kwenye mipangilio ya simu au kivinjari.'
                    : 'Phone alerts are blocked. Allow them in your phone or browser settings.'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => setPermission(await requestNotificationPermission())}
                  className={`w-full py-3 rounded-xl font-bold ${isLight ? 'bg-teal-600 text-white' : 'bg-[#00f5c4] text-[#02211b]'}`}
                >
                  {isSw ? 'Washa arifa za simu' : 'Turn on phone alerts'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
