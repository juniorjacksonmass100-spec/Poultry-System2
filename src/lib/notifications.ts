import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getLocaleLanguage, tr } from './locale';

/**
 * Phone / computer notifications (the banner you see in WhatsApp).
 *  - Android app: Android notifications through Capacitor Local Notifications.
 *  - Website: the browser Notification API.
 *
 * Honest limit: notifications appear while the app is open or was used recently, and
 * hatch-day reminders are scheduled on the phone so they ring even if the app is closed.
 * Messages that arrive while the app is completely closed are shown the next time it opens.
 * (Instant alerts to a fully closed app need Firebase Cloud Messaging, which needs your own
 * Firebase project.)
 */

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const isNative = () => Capacitor.isNativePlatform();

/** Stable positive integer id from text (Android notification ids are 32-bit ints). */
export const hashId = (text: string): number => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2147483000 || 1;
};

export const getNotificationPermission = async (): Promise<PermissionState> => {
  try {
    if (isNative()) {
      const r = await LocalNotifications.checkPermissions();
      return r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'default';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission as PermissionState;
  } catch {
    return 'unsupported';
  }
};

export const requestNotificationPermission = async (isSw = false): Promise<PermissionState> => {
  try {
    if (isNative()) {
      const r = await LocalNotifications.requestPermissions();
      if (r.display === 'granted') {
        await ensureChannels();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('kukutrack:notification-permission-changed'));
      }
      return r.display === 'granted' ? 'granted' : 'denied';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    if (result === 'granted' && typeof window !== 'undefined') window.dispatchEvent(new Event('kukutrack:notification-permission-changed'));
    return result as PermissionState;
  } catch {
    return 'unsupported';
  }
};

let channelsLang: string | null = null;
/** Android 8+ needs channels; "messages" is loud and pops up like WhatsApp, "hatch" is for reminders. */
export const ensureChannels = async (): Promise<void> => {
  const lang = getLocaleLanguage();
  if (!isNative() || channelsLang === lang) return;
  try {
    await LocalNotifications.createChannel({
      id: 'messages',
      name: tr('Messages from administrator', 'Ujumbe kutoka kwa msimamizi'),
      description: tr('Advisories and announcements', 'Ushauri na matangazo'),
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#00F5C4',
    });
    await LocalNotifications.createChannel({
      id: 'hatch',
      name: tr('Hatch reminders', 'Vikumbusho vya kutotolewa'),
      description: tr('Reminders when eggs are about to hatch', 'Vikumbusho mayai yanapokaribia kutotolewa'),
      importance: 4,
      visibility: 1,
      vibration: true,
    });
    channelsLang = lang;
  } catch {
    // Channels are an Android nicety; notifications still work with defaults
  }
};

export interface SystemNotification {
  id?: string;
  title: string;
  body: string;
  channel?: 'messages' | 'hatch';
  isSw?: boolean;
}

/** Shows a notification right now (only if permission was granted). */
export const showSystemNotification = async (n: SystemNotification): Promise<boolean> => {
  try {
    if ((await getNotificationPermission()) !== 'granted') return false;
    if (isNative()) {
      await ensureChannels();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: hashId(n.id || `${n.title}:${Date.now()}`),
            title: n.title,
            body: n.body,
            channelId: n.channel || 'messages',
            smallIcon: 'ic_stat_kukutrack',
            iconColor: '#00F5C4',
          },
        ],
      });
      return true;
    }
    new Notification(n.title, { body: n.body, tag: n.id, icon: '/icon.svg' });
    return true;
  } catch {
    return false;
  }
};

export interface ScheduledReminder {
  key: string;
  title: string;
  body: string;
  at: Date;
}

const SCHEDULED_KEY = 'kukutrack_scheduled_reminders';

/**
 * Android app only: puts hatch reminders on the phone's alarm clock so they ring even when
 * the app is closed. Previous reminders from this app are replaced each time, so edits and
 * deletes are always reflected.
 */
export const syncScheduledReminders = async (reminders: ScheduledReminder[], isSw = false): Promise<number> => {
  if (!isNative()) return 0;
  try {
    // Remove what we scheduled before
    let previous: number[] = [];
    try {
      previous = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || '[]');
    } catch {
      previous = [];
    }
    if (previous.length > 0) {
      await LocalNotifications.cancel({ notifications: previous.map((id) => ({ id })) });
    }

    const now = Date.now();
    const future = reminders.filter((r) => r.at.getTime() > now + 30_000);
    if (future.length === 0 || (await getNotificationPermission()) !== 'granted') {
      localStorage.setItem(SCHEDULED_KEY, '[]');
      return 0;
    }

    await ensureChannels(isSw);
    const items = future.map((r) => ({
      id: hashId(r.key),
      title: r.title,
      body: r.body,
      channelId: 'hatch',
      smallIcon: 'ic_stat_kukutrack',
      iconColor: '#00F5C4',
      schedule: { at: r.at, allowWhileIdle: true },
    }));
    await LocalNotifications.schedule({ notifications: items });
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(items.map((i) => i.id)));
    return items.length;
  } catch {
    return 0;
  }
};

/** Forget every reminder (used on sign out so one farmer's alerts never reach the next). */
export const clearScheduledReminders = async (): Promise<void> => {
  await syncScheduledReminders([]);
};
