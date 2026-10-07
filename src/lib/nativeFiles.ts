import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Custom Android plugin (android/.../DownloadsPlugin.java) that writes into the public Downloads folder. */
interface DownloadsPlugin {
  saveFile(options: { fileName: string; data: string; mimeType: string }): Promise<{ uri: string; path: string }>;
}
const Downloads = registerPlugin<DownloadsPlugin>('Downloads');

export type SaveResult =
  | { status: 'downloaded'; where: string }   // saved into the Downloads folder
  | { status: 'shared' }                      // the Share sheet was opened ("Save to Files" etc.)
  | { status: 'browser' };                    // a normal browser download was started

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/**
 * Saves a file for the user.
 *  - In the Android app: straight into the Downloads folder.
 *    If that is blocked (very old Android), the Share sheet opens so the file can still be saved.
 *  - In a browser: the usual download.
 * Throws only if every option failed.
 */
export const saveFileForUser = async (
  fileName: string,
  base64Data: string,
  mimeType: string,
  browserFallback: () => void
): Promise<SaveResult> => {
  if (!isNativeApp()) {
    browserFallback();
    return { status: 'browser' };
  }

  try {
    const res = await Downloads.saveFile({ fileName, data: base64Data, mimeType });
    return { status: 'downloaded', where: res.path || `Downloads/${fileName}` };
  } catch (primaryError) {
    // Fallback: write to the app cache, then let the user choose where to save it
    try {
      const written = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({
        title: fileName,
        text: fileName,
        url: written.uri,
        dialogTitle: fileName,
      });
      return { status: 'shared' };
    } catch (secondaryError) {
      const msg = (primaryError as Error)?.message || (secondaryError as Error)?.message || 'Could not save the file';
      throw new Error(msg);
    }
  }
};
