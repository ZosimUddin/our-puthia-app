package com.ourputhia.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AppUpdateManager {

    private static final String TAG = "AppUpdateManager";
    public static final int REQUEST_INSTALL_PERMISSION_CODE = 9081;
    private static final String PREF_NAME = "puthia_update_prefs";
    private static final String KEY_SKIPPED_VERSION = "skipped_version_code";

    private static final String PRIMARY_MANIFEST_URL = "https://our-puthia-app.vercel.app/update-manifest.json";
    private static final String GITHUB_RELEASE_API_URL = "https://api.github.com/repos/ZosimUddin/our-puthia-app/releases/latest";

    private static File sPendingInstallFile = null;
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public static class UpdateInfo {
        public int versionCode;
        public String versionName;
        public String apkUrl;
        public String releaseNotes;
        public String sha256;
        public boolean forceUpdate;

        public UpdateInfo(int versionCode, String versionName, String apkUrl, String releaseNotes, String sha256, boolean forceUpdate) {
            this.versionCode = versionCode;
            this.versionName = versionName;
            this.apkUrl = apkUrl;
            this.releaseNotes = releaseNotes;
            this.sha256 = sha256;
            this.forceUpdate = forceUpdate;
        }
    }

    /**
     * Checks for available updates asynchronously.
     * @param activity current activity context
     * @param isManualCheck true if triggered manually by user, false if checked automatically on app start
     */
    public static void checkUpdate(final Activity activity, final boolean isManualCheck) {
        if (activity == null || activity.isFinishing()) return;

        executor.execute(() -> {
            UpdateInfo updateInfo = fetchManifestFromUrl(PRIMARY_MANIFEST_URL);

            if (updateInfo == null) {
                // Fallback to GitHub Release API
                updateInfo = fetchManifestFromGitHub();
            }

            final UpdateInfo finalInfo = updateInfo;
            mainHandler.post(() -> {
                if (activity.isFinishing()) return;

                if (finalInfo == null) {
                    if (isManualCheck) {
                        Toast.makeText(activity, "আপডেট তথ্য সংগ্রহ করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ দেখুন।", Toast.LENGTH_SHORT).show();
                    }
                    return;
                }

                int currentVersionCode = getCurrentVersionCode(activity);
                String currentVersionName = getCurrentVersionName(activity);

                Log.d(TAG, "Current VersionCode: " + currentVersionCode + " | Remote VersionCode: " + finalInfo.versionCode);

                if (finalInfo.versionCode > currentVersionCode) {
                    // Check if user skipped this specific version
                    SharedPreferences prefs = activity.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
                    int skippedVersion = prefs.getInt(KEY_SKIPPED_VERSION, -1);

                    if (!isManualCheck && !finalInfo.forceUpdate && skippedVersion == finalInfo.versionCode) {
                        Log.d(TAG, "User previously skipped version " + finalInfo.versionCode);
                        return;
                    }

                    showUpdatePromptDialog(activity, finalInfo);
                } else {
                    if (isManualCheck) {
                        Toast.makeText(activity, "আপনার অ্যাপটি সর্বশেষ সংস্করণে (v" + currentVersionName + ") চলছে।", Toast.LENGTH_LONG).show();
                    }
                }
            });
        });
    }

    private static UpdateInfo fetchManifestFromUrl(String manifestUrl) {
        try {
            URL url = new URL(manifestUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setRequestMethod("GET");

            if (connection.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONObject json = new JSONObject(sb.toString());
                int versionCode = json.optInt("versionCode", 0);
                String versionName = json.optString("versionName", "1.0.0");
                String apkUrl = json.optString("apkUrl", "");
                String releaseNotes = json.optString("releaseNotes", "নতুন আপডেট উপলব্ধ রয়েছে।");
                String sha256 = json.optString("sha256", "");
                boolean forceUpdate = json.optBoolean("forceUpdate", false);

                if (versionCode > 0 && !apkUrl.isEmpty()) {
                    return new UpdateInfo(versionCode, versionName, apkUrl, releaseNotes, sha256, forceUpdate);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error fetching manifest from primary URL", e);
        }
        return null;
    }

    private static UpdateInfo fetchManifestFromGitHub() {
        try {
            URL url = new URL(GITHUB_RELEASE_API_URL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", "OurPuthiaApp");

            if (connection.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONObject json = new JSONObject(sb.toString());
                String tagName = json.optString("tag_name", "v1.0.0");
                String body = json.optString("body", "নতুন ফিচার এবং বাগ ফিক্স।");

                String apkUrl = "";
                JSONArray assets = json.optJSONArray("assets");
                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject asset = assets.getJSONObject(i);
                        String name = asset.optString("name", "");
                        if (name.endsWith(".apk")) {
                            apkUrl = asset.optString("browser_download_url", "");
                            break;
                        }
                    }
                }

                int remoteVersionCode = parseVersionCodeFromTag(tagName);
                String remoteVersionName = tagName.replace("v", "").replace("V", "");

                if (remoteVersionCode > 0 && !apkUrl.isEmpty()) {
                    return new UpdateInfo(remoteVersionCode, remoteVersionName, apkUrl, body, "", false);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error fetching fallback release from GitHub", e);
        }
        return null;
    }

    private static int parseVersionCodeFromTag(String tagName) {
        try {
            String clean = tagName.replaceAll("[^0-9.]", "");
            String[] parts = clean.split("\\.");
            if (parts.length >= 3) {
                int major = Integer.parseInt(parts[0]);
                int minor = Integer.parseInt(parts[1]);
                int patch = Integer.parseInt(parts[2]);
                return major * 100 + minor * 10 + patch;
            } else if (parts.length == 2) {
                int major = Integer.parseInt(parts[0]);
                int minor = Integer.parseInt(parts[1]);
                return major * 100 + minor * 10;
            } else if (parts.length == 1 && !parts[0].isEmpty()) {
                return Integer.parseInt(parts[0]);
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private static void showUpdatePromptDialog(final Activity activity, final UpdateInfo info) {
        AlertDialog.Builder builder = new AlertDialog.Builder(activity);
        builder.setTitle("🚀 নতুন আপডেট উপলব্ধ (v" + info.versionName + ")");
        builder.setMessage(info.releaseNotes + "\n\nনতুন ফিচার ও সুরক্ষার সুবিধা পেতে এখনই আপডেট করুন।");
        builder.setCancelable(!info.forceUpdate);

        builder.setPositiveButton("এখনই আপডেট করুন", (dialog, which) -> {
            downloadAndInstallApk(activity, info);
        });

        if (!info.forceUpdate) {
            builder.setNegativeButton("পরে", (dialog, which) -> {
                SharedPreferences prefs = activity.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
                prefs.edit().putInt(KEY_SKIPPED_VERSION, info.versionCode).apply();
            });
        }

        builder.show();
    }

    private static void downloadAndInstallApk(final Activity activity, final UpdateInfo info) {
        AlertDialog.Builder dialogBuilder = new AlertDialog.Builder(activity);
        dialogBuilder.setTitle("ডাউনলোড করা হচ্ছে...");
        dialogBuilder.setCancelable(false);

        // Simple progress layout
        ProgressBar progressBar = new ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(false);
        progressBar.setMax(100);
        progressBar.setPadding(40, 20, 40, 20);

        dialogBuilder.setView(progressBar);
        final AlertDialog progressDialog = dialogBuilder.show();

        executor.execute(() -> {
            File apkFile = null;
            boolean downloadSuccess = false;

            try {
                URL url = new URL(info.apkUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);
                connection.setRequestMethod("GET");
                connection.connect();

                int fileLength = connection.getContentLength();
                File downloadDir = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (downloadDir == null) downloadDir = activity.getCacheDir();

                apkFile = new File(downloadDir, "OurPuthia_v" + info.versionCode + ".apk");

                InputStream input = connection.getInputStream();
                FileOutputStream output = new FileOutputStream(apkFile);

                byte[] data = new byte[8192];
                long total = 0;
                int count;

                while ((count = input.read(data)) != -1) {
                    total += count;
                    if (fileLength > 0) {
                        final int progress = (int) (total * 100 / fileLength);
                        mainHandler.post(() -> progressBar.setProgress(progress));
                    }
                    output.write(data, 0, count);
                }

                output.flush();
                output.close();
                input.close();
                downloadSuccess = true;

            } catch (Exception e) {
                Log.e(TAG, "Error downloading APK", e);
            }

            final File finalApkFile = apkFile;
            final boolean finalSuccess = downloadSuccess;

            mainHandler.post(() -> {
                if (progressDialog.isShowing()) {
                    progressDialog.dismiss();
                }

                if (!finalSuccess || finalApkFile == null || !finalApkFile.exists()) {
                    showDownloadErrorDialog(activity, info);
                    return;
                }

                // Verify SHA-256 if provided
                if (info.sha256 != null && !info.sha256.trim().isEmpty()) {
                    String actualSha256 = calculateSha256(finalApkFile);
                    if (!info.sha256.equalsIgnoreCase(actualSha256)) {
                        Log.e(TAG, "SHA256 Mismatch! Expected: " + info.sha256 + " | Actual: " + actualSha256);
                        finalApkFile.delete();
                        Toast.makeText(activity, "নিরাপত্তা চেক ব্যর্থ হয়েছে (SHA-256 Mismatch)।", Toast.LENGTH_LONG).show();
                        return;
                    }
                }

                promptAndInstallApk(activity, finalApkFile);
            });
        });
    }

    private static void showDownloadErrorDialog(final Activity activity, final UpdateInfo info) {
        new AlertDialog.Builder(activity)
                .setTitle("ডাউনলোড ব্যর্থ হয়েছে")
                .setMessage("নতুন সংস্করণ ডাউনলোড করতে সমস্যা হয়েছে। আপনার ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।")
                .setPositiveButton("পুনরায় চেষ্টা করুন", (dialog, which) -> downloadAndInstallApk(activity, info))
                .setNegativeButton("বাতিল", null)
                .show();
    }

    public static void promptAndInstallApk(Activity activity, File apkFile) {
        if (activity == null || apkFile == null || !apkFile.exists()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!activity.getPackageManager().canRequestPackageInstalls()) {
                sPendingInstallFile = apkFile;
                new AlertDialog.Builder(activity)
                        .setTitle("ইনস্টল অনুমতি প্রয়োজন")
                        .setMessage("নতুন আপডেটটি ইনস্টল করতে 'আমাদের পুঠিয়া' অ্যাপকে অজানা উৎস থেকে ফাইল ইনস্টলের অনুমতি প্রদান করুন।")
                        .setPositiveButton("সেটিংস খুলুন", (dialog, which) -> {
                            try {
                                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                        Uri.parse("package:" + activity.getPackageName()));
                                activity.startActivityForResult(intent, REQUEST_INSTALL_PERMISSION_CODE);
                            } catch (Exception e) {
                                Toast.makeText(activity, "সেটিংস খুলতে পাওয়া যায়নি", Toast.LENGTH_SHORT).show();
                            }
                        })
                        .setNegativeButton("বাতিল", null)
                        .show();
                return;
            }
        }

        executeInstall(activity, apkFile);
    }

    public static void executeInstall(Context context, File apkFile) {
        if (context == null || apkFile == null || !apkFile.exists()) return;

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Uri apkUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                apkUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", apkFile);
            } else {
                apkUri = Uri.fromFile(apkFile);
            }

            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            context.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error executing installation", e);
            Toast.makeText(context, "ইনস্টলার সেশন শুরু করতে সমস্যা হয়েছে: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    /**
     * Resumes install if permissions were granted after returning from Settings.
     */
    public static void resumePendingInstallIfGranted(Activity activity) {
        if (activity == null || sPendingInstallFile == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (activity.getPackageManager().canRequestPackageInstalls()) {
                File pendingFile = sPendingInstallFile;
                sPendingInstallFile = null;
                executeInstall(activity, pendingFile);
            }
        } else {
            File pendingFile = sPendingInstallFile;
            sPendingInstallFile = null;
            executeInstall(activity, pendingFile);
        }
    }

    public static int getCurrentVersionCode(Context context) {
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return (int) pInfo.getLongVersionCode();
            } else {
                return pInfo.versionCode;
            }
        } catch (Exception e) {
            return 1;
        }
    }

    public static String getCurrentVersionName(Context context) {
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            return pInfo.versionName;
        } catch (Exception e) {
            return "1.0.0";
        }
    }

    private static String calculateSha256(File file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            FileInputStream fis = new FileInputStream(file);
            byte[] byteArray = new byte[8192];
            int bytesCount;
            while ((bytesCount = fis.read(byteArray)) != -1) {
                digest.update(byteArray, 0, bytesCount);
            }
            fis.close();
            byte[] bytes = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
