package com.ivans.trip;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String SITE_URL = "https://ivan-s-2001.github.io/trip/";
    private static final int NOTIFICATION_PERMISSION_REQUEST = 2601;
    private static final int LOCATION_PERMISSION_REQUEST = 2602;
    private static final int BACKGROUND_LOCATION_PERMISSION_REQUEST = 2603;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(247, 240, 232));
        getWindow().setNavigationBarColor(Color.rgb(247, 240, 232));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        NotificationScheduler.ensureChannels(this);
        if(!TripCloud.isHusband(this)) {
            NotificationScheduler.scheduleAll(this);
            requestNotificationsIfNeeded();
            requestLocationIfNeeded();
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(247, 240, 232));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.addJavascriptInterface(new NativeBridge(), "TripNative");

        if ("qa".equals(BuildConfig.BUILD_TYPE)) {
            webView.addJavascriptInterface(new QaBridge(), "TripQA");
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error
            ) {
                super.onReceivedError(view, request, error);

                if (request.isForMainFrame() &&
                        !request.getUrl().toString().startsWith("file:///android_asset/")) {
                    String screen = getIntent().getStringExtra("screen");
                    String surprise = getIntent().getStringExtra("surprise");
                    view.loadUrl(offlineUrlFor(screen, surprise));
                }
            }
        });

        loadFromIntent(getIntent());
    }

    private void loadFromIntent(Intent intent) {
        String screen = intent.getStringExtra("screen");
        String surprise = intent.getStringExtra("surprise");
        webView.loadUrl(urlFor(screen, surprise));
    }

    private boolean handleUrl(Uri uri) {
        if ("file".equals(uri.getScheme())) {
            return false;
        }

        String host = uri.getHost();
        String path = uri.getPath();
        if ("ivan-s-2001.github.io".equals(host) && path != null && path.startsWith("/trip")) {
            return false;
        }

        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception ignored) {
        }
        return true;
    }

    private String urlFor(String screen, String surprise) {
        StringBuilder url = new StringBuilder(SITE_URL);
        url.append("?native=1");
        if ("qa".equals(BuildConfig.BUILD_TYPE)) {
            url.append("&qa=1");
        }
        if (surprise != null && !surprise.isEmpty()) {
            url.append("&surprise=").append(Uri.encode(surprise));
        }
        if (screen != null && !screen.isEmpty()) {
            url.append("#").append(screen);
        }
        return url.toString();
    }

    private String offlineUrlFor(String screen, String surprise) {
        StringBuilder url = new StringBuilder("file:///android_asset/www/index.html?native=1&offline=1");
        if ("qa".equals(BuildConfig.BUILD_TYPE)) {
            url.append("&qa=1");
        }
        if (surprise != null && !surprise.isEmpty()) {
            url.append("&surprise=").append(Uri.encode(surprise));
        }
        if (screen != null && !screen.isEmpty()) {
            url.append("#").append(screen);
        }
        return url.toString();
    }

    private final class NativeBridge {
        @JavascriptInterface
        public boolean hasMilestone(String id) { return getSharedPreferences(GeofenceManager.PREFS, MODE_PRIVATE).getBoolean("milestone-"+id,false); }

        @JavascriptInterface
        public String getSyncAccess() { return TripCloud.getAccess(MainActivity.this); }

        @JavascriptInterface
        public void setSyncAccess(String token, String role) { TripCloud.setAccess(MainActivity.this, token, role); }

        @JavascriptInterface
        public String getZone() {
            return GeofenceManager.getLastZone(MainActivity.this);
        }

        @JavascriptInterface
        public boolean isHomeArrived() {
            return GeofenceManager.isHomeArrived(MainActivity.this);
        }

        @JavascriptInterface
        public boolean hasBackgroundLocation() {
            return GeofenceManager.hasRequiredPermissions(MainActivity.this);
        }
    }

    private final class QaBridge {
        @JavascriptInterface
        public void notify(String surprise) {
            Intent test = new Intent(MainActivity.this, NotificationReceiver.class);
            test.putExtra("notification_id", 9900 + Math.abs((surprise == null ? "qa" : surprise).hashCode() % 500));
            test.putExtra("channel", NotificationScheduler.CHANNEL_TRIP);
            test.putExtra("title", "QA · тест уведомления");
            test.putExtra("text", "Нажми — проверим deep link и сюрприз.");
            test.putExtra("screen", "home");
            test.putExtra("surprise", surprise == null || surprise.isEmpty() ? "random-0" : surprise);
            sendBroadcast(test);
        }
    }

    private void requestLocationIfNeeded() {
        boolean fine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;

        if (!fine) {
            requestPermissions(
                    new String[]{
                            Manifest.permission.ACCESS_COARSE_LOCATION,
                            Manifest.permission.ACCESS_FINE_LOCATION
                    },
                    LOCATION_PERMISSION_REQUEST
            );
            return;
        }

        requestBackgroundLocationIfNeeded();
    }

    private void requestBackgroundLocationIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            GeofenceManager.registerAll(this);
            return;
        }

        if (checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                == PackageManager.PERMISSION_GRANTED) {
            GeofenceManager.registerAll(this);
            return;
        }

        if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
            requestPermissions(
                    new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION},
                    BACKGROUND_LOCATION_PERMISSION_REQUEST
            );
            return;
        }

        SharedPreferences prefs = getSharedPreferences("trip_permissions", MODE_PRIVATE);
        if (prefs.getBoolean("background_location_prompted", false)) return;
        prefs.edit().putBoolean("background_location_prompted", true).apply();

        new AlertDialog.Builder(this)
                .setTitle("Чтобы поездка жила сама")
                .setMessage("Trip может замечать только ключевые точки маршрута в фоне — Рыбинск, Шереметьево, Тюмень и Курган — и присылать локальные уведомления. Координаты никуда не отправляются. В настройках геолокации выбери «Разрешать всегда».")
                .setNegativeButton("Не сейчас", null)
                .setPositiveButton("Открыть настройки", (dialog, which) -> {
                    Intent settings = new Intent(
                            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                            Uri.parse("package:" + getPackageName())
                    );
                    startActivity(settings);
                })
                .show();
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == LOCATION_PERMISSION_REQUEST) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                    == PackageManager.PERMISSION_GRANTED) {
                requestBackgroundLocationIfNeeded();
            }
        } else if (requestCode == BACKGROUND_LOCATION_PERMISSION_REQUEST) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
                    checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                            == PackageManager.PERMISSION_GRANTED) {
                GeofenceManager.registerAll(this);
            }
        }
    }

    private void requestNotificationsIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIFICATION_PERMISSION_REQUEST
            );
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (GeofenceManager.hasRequiredPermissions(this)) {
            GeofenceManager.registerAll(this);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (webView != null) loadFromIntent(intent);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
