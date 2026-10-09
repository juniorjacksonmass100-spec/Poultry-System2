import { Capacitor, registerPlugin } from '@capacitor/core';

interface SecureScreenPlugin {
  setEnabled(options: { enabled: boolean }): Promise<void>;
}
const SecureScreen = registerPlugin<SecureScreenPlugin>('SecureScreen');

/**
 * Android app: turns Android's screenshot / screen-recording block on or off.
 * Website: not possible (browsers cannot block the device's screenshot), so this does nothing there.
 * Never throws: an older app version without the plugin simply keeps working without the block.
 */
export const setSecureScreen = async (enabled: boolean): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await SecureScreen.setEnabled({ enabled });
    return true;
  } catch {
    return false;
  }
};
