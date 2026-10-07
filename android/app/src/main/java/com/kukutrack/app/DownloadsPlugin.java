package com.kukutrack.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

/**
 * Saves a file straight into the phone's public "Downloads" folder so the user can find
 * it in the Files / Downloads app. Android 10+ uses MediaStore (no permission needed).
 * Older Android versions write to the Downloads folder directly.
 */
@CapacitorPlugin(name = "Downloads")
public class DownloadsPlugin extends Plugin {

    @PluginMethod
    public void saveFile(PluginCall call) {
        String fileName = call.getString("fileName");
        String data = call.getString("data");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (fileName == null || fileName.trim().isEmpty() || data == null || data.isEmpty()) {
            call.reject("fileName and data are required");
            return;
        }

        // Keep only a plain file name (no folders)
        fileName = fileName.replace("/", "_").replace("\\", "_").trim();

        byte[] bytes;
        try {
            bytes = Base64.decode(data, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            call.reject("The file data is not valid", e);
            return;
        }

        try {
            JSObject result = new JSObject();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();

                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Could not create the file in Downloads");
                    return;
                }

                OutputStream out = resolver.openOutputStream(uri);
                if (out == null) {
                    resolver.delete(uri, null, null);
                    call.reject("Could not open the file in Downloads");
                    return;
                }
                try {
                    out.write(bytes);
                    out.flush();
                } finally {
                    out.close();
                }

                ContentValues done = new ContentValues();
                done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(uri, done, null, null);

                result.put("uri", uri.toString());
                result.put("path", Environment.DIRECTORY_DOWNLOADS + "/" + fileName);
            } else {
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Could not open the Downloads folder");
                    return;
                }
                File target = new File(dir, fileName);
                int counter = 1;
                while (target.exists()) {
                    int dot = fileName.lastIndexOf('.');
                    String base = dot > 0 ? fileName.substring(0, dot) : fileName;
                    String ext = dot > 0 ? fileName.substring(dot) : "";
                    target = new File(dir, base + " (" + counter + ")" + ext);
                    counter++;
                }
                FileOutputStream out = new FileOutputStream(target);
                try {
                    out.write(bytes);
                    out.flush();
                } finally {
                    out.close();
                }
                result.put("uri", Uri.fromFile(target).toString());
                result.put("path", Environment.DIRECTORY_DOWNLOADS + "/" + target.getName());
            }

            call.resolve(result);
        } catch (IOException e) {
            call.reject("Could not save the file: " + e.getMessage(), e);
        } catch (SecurityException e) {
            call.reject("Storage permission was denied", e);
        }
    }
}
