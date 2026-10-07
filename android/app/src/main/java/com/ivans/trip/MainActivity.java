package com.ivans.trip;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String SITE_URL = "https://ivan-s-2001.github.io/trip/";
    private static final int NOTIFICATION_PERMISSION_REQUEST = 2601;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(247, 240, 232));
        getWindow().setNavigationBarColor(Color.rgb(247, 240, 232));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        NotificationScheduler.ensureChannels(this);
        NotificationScheduler.scheduleAll(this);
        requestNotificationsIfNeeded();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(247, 240, 232));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

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
        });

        loadFromIntent(getIntent());
    }

    private void loadFromIntent(Intent intent) {
        String screen = intent.getStringExtra("screen");
        String surprise = intent.getStringExtra("surprise");
        webView.loadUrl(urlFor(screen, surprise));
    }

    private boolean handleUrl(Uri uri) {
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
