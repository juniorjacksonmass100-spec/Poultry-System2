import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Initializes native Android configuration when running as an APK.
 * Degrades gracefully on desktop web.
 */
export const initializeNativeAndroid = async (isDark: boolean = true) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Configure status bar color and icon style
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
    await StatusBar.setBackgroundColor({
      color: isDark ? '#020708' : '#ffffff',
    });
  } catch {
    // Silent failover on platforms where status bar is unavailable
  }
};

/**
 * Trigger subtle haptic feedback for user taps/confirmations on native Android
 */
export const triggerNativeHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Ignore
  }
};

export const isNativeAndroidApp = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};
