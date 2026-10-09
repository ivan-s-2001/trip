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
    private static final int POINT_PERMISSION_REQUEST=2702;
    private WebView webView;
    private final java.util.concurrent.ExecutorService attachmentExecutor=java.util.concurrent.Executors.newSingleThreadExecutor();
    private final java.util.Set<String> openingAttachments=java.util.concurrent.ConcurrentHashMap.newKeySet();
    private android.webkit.ValueCallback<Uri[]> fileCallback;

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
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(Math.round(getResources().getConfiguration().fontScale * 100));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.addJavascriptInterface(new NativeBridge(), "TripNative");

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

        webView.setWebChromeClient(new android.webkit.WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view, android.webkit.ValueCallback<Uri[]> callback, FileChooserParams params){
                finishFileChooser(null);fileCallback=callback;
                java.util.LinkedHashSet<String> accepted=new java.util.LinkedHashSet<>();
                for(String entry:params.getAcceptTypes())for(String type:entry.split(",")){
                    type=type.trim();if(type.startsWith(".")){type=android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(type.substring(1).toLowerCase(java.util.Locale.ROOT));}
                    if(type!=null&&type.contains("/"))accepted.add(type);
                }
                Intent picker=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(accepted.size()==1?accepted.iterator().next():"*/*");
                if(accepted.size()>1)picker.putExtra(Intent.EXTRA_MIME_TYPES,accepted.toArray(new String[0]));
                picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                picker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                try{startActivityForResult(picker,2701);}catch(android.content.ActivityNotFoundException first){
                    try{picker.setAction(Intent.ACTION_GET_CONTENT);startActivityForResult(Intent.createChooser(picker,"Выбрать вложение"),2701);}catch(Exception error){finishFileChooser(null);android.widget.Toast.makeText(MainActivity.this,"Не удалось открыть выбор файлов",android.widget.Toast.LENGTH_LONG).show();}
                }catch(Exception error){finishFileChooser(null);android.widget.Toast.makeText(MainActivity.this,"Не удалось открыть выбор файлов",android.widget.Toast.LENGTH_LONG).show();}
                return true;
            }
        });
        MessageService.startIfReady(this);
        loadFromIntent(getIntent());
    }

    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==2701&&fileCallback!=null){
            java.util.LinkedHashSet<Uri> chosen=new java.util.LinkedHashSet<>();
            if(resultCode==RESULT_OK&&data!=null){
                if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)chosen.add(data.getClipData().getItemAt(i).getUri());
                if(data.getData()!=null)chosen.add(data.getData());
            }
            final android.webkit.ValueCallback<Uri[]> expected=fileCallback;
            attachmentExecutor.execute(()->{
            java.util.ArrayList<Uri> readable=new java.util.ArrayList<>();
            for(Uri uri:chosen){
                if(uri==null||!"content".equals(uri.getScheme())||getPackageName().equals(uri.getAuthority())||uri.getAuthority()!=null&&uri.getAuthority().startsWith(getPackageName()+"."))continue;
                try(android.content.res.AssetFileDescriptor file=getContentResolver().openAssetFileDescriptor(uri,"r")){
                    if(file==null)continue;readable.add(uri);
                    try{getContentResolver().takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(Exception ignored){}
                }catch(Exception ignored){}
            }
            runOnUiThread(()->{if(fileCallback!=expected)return;
            if(resultCode==RESULT_OK&&readable.isEmpty())android.widget.Toast.makeText(this,"Файл недоступен. Попробуй выбрать его через «Файлы».",android.widget.Toast.LENGTH_LONG).show();
            finishFileChooser(readable.isEmpty()?null:readable.toArray(new Uri[0]));
            });});
        }
    }

    private void finishFileChooser(Uri[] value){android.webkit.ValueCallback<Uri[]> callback=fileCallback;fileCallback=null;if(callback!=null)callback.onReceiveValue(value);}

    private void openReceivedAttachment(String id,String name,String mime){
        if(id==null||!id.matches("[a-f0-9-]{36}")||!openingAttachments.add(id))return;
        final String token=TripCloud.getAccess(this);if(token.isEmpty()){openingAttachments.remove(id);return;}
        attachmentExecutor.execute(()->{
            java.net.HttpURLConnection connection=null;java.io.File partial=null;
            try{
                String tokenHash=TripCloud.hash(token);
                String safeName=(name==null?"Вложение":name).replaceAll("[^\\p{L}\\p{N} ._()-]","_");
                if(safeName.isEmpty()||safeName.equals(".")||safeName.equals(".."))safeName="Вложение";if(safeName.length()>120)safeName=safeName.substring(0,120);
                java.io.File folder=new java.io.File(getCacheDir(),"received/"+tokenHash+"/"+id);folder.mkdirs();
                java.io.File target=new java.io.File(folder,safeName);
                if(!target.isFile()){
                    connection=(java.net.HttpURLConnection)new java.net.URL("https://trip-private.ivan-s-2001.workers.dev/api/media/"+id).openConnection();
                    connection.setRequestProperty("Authorization","Bearer "+token);connection.setConnectTimeout(10000);connection.setReadTimeout(20000);
                    if(connection.getResponseCode()!=200)throw new java.io.IOException("Unavailable");
                    partial=new java.io.File(folder,"download.part");
                    try(java.io.InputStream in=connection.getInputStream();java.io.FileOutputStream out=new java.io.FileOutputStream(partial)){
                        byte[] buffer=new byte[16384];int count,total=0;while((count=in.read(buffer))!=-1){total+=count;if(total>10485760)throw new java.io.IOException("Too large");out.write(buffer,0,count);}
                    }
                    if(!partial.renameTo(target))throw new java.io.IOException("Cannot save");
                }
                getSharedPreferences("trip_files",MODE_PRIVATE).edit().putString(tokenHash+"/"+id,mime).apply();
                Uri uri=new Uri.Builder().scheme("content").authority(getPackageName()+".attachments").appendPath(tokenHash).appendPath(id).appendPath(safeName).build();
                runOnUiThread(()->{if(isFinishing())return;Intent open=new Intent(Intent.ACTION_VIEW).setDataAndType(uri,mime).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);open.setClipData(android.content.ClipData.newRawUri("Вложение",uri));
                    try{startActivity(open);}catch(android.content.ActivityNotFoundException error){Intent share=new Intent(Intent.ACTION_SEND).setType(mime).putExtra(Intent.EXTRA_STREAM,uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);share.setClipData(android.content.ClipData.newRawUri("Вложение",uri));try{startActivity(Intent.createChooser(share,"Сохранить или открыть файл"));}catch(Exception unavailable){android.widget.Toast.makeText(this,"Нет приложения для этого файла",android.widget.Toast.LENGTH_LONG).show();}}
                });
            }catch(Exception error){if(partial!=null)partial.delete();runOnUiThread(()->android.widget.Toast.makeText(this,"Не удалось открыть файл. Проверь связь и попробуй ещё раз.",android.widget.Toast.LENGTH_LONG).show());}
            finally{if(connection!=null)connection.disconnect();openingAttachments.remove(id);}
        });
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
        url.append("?native=1&app=").append(BuildConfig.HUSBAND_APP ? "husband" : "wife");
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
        public void enableGeolocation(){runOnUiThread(()->requestLocationIfNeeded());}
        @JavascriptInterface
        public void useCurrentLocation(){runOnUiThread(()->{
            if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION},POINT_PERMISSION_REQUEST);}else readCurrentPoint();
        });}
        @JavascriptInterface
        public void openAttachment(String id,String name,String mime){if(mime==null||!mime.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+"))return;openReceivedAttachment(id,name,mime);}

        @JavascriptInterface
        public boolean hasMilestone(String id) { return getSharedPreferences(GeofenceManager.PREFS, MODE_PRIVATE).getBoolean("milestone-"+id,false); }

        @JavascriptInterface
        public String getAppRole() { return BuildConfig.HUSBAND_APP ? "husband" : "wife"; }
        @JavascriptInterface
        public String getSyncAccess() { return TripCloud.getAccess(MainActivity.this); }

        @JavascriptInterface
        public void setSyncAccess(String token, String role) { TripCloud.setAccess(MainActivity.this, token, role); }

        @JavascriptInterface
        public void setPushTopic(String topic) { TripCloud.setPushTopic(MainActivity.this, topic); }

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

    private void locationError(){if(webView!=null)webView.evaluateJavascript("window.dispatchEvent(new Event('trip-location-error'))",null);}
    private void readCurrentPoint(){
        if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){locationError();return;}
        java.util.concurrent.atomic.AtomicBoolean reported=new java.util.concurrent.atomic.AtomicBoolean();
        com.google.android.gms.tasks.CancellationTokenSource cancellation=new com.google.android.gms.tasks.CancellationTokenSource();
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(()->{if(reported.compareAndSet(false,true)){cancellation.cancel();locationError();}},15000);
        com.google.android.gms.location.LocationServices.getFusedLocationProviderClient(this).getCurrentLocation(com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY,cancellation.getToken()).addOnSuccessListener(location->{
            if(!reported.compareAndSet(false,true))return;if(location==null){locationError();return;}
            if(webView!=null)webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('trip-location',{detail:{lat:"+location.getLatitude()+",lon:"+location.getLongitude()+"}}))",null);
        }).addOnFailureListener(error->{if(reported.compareAndSet(false,true))locationError();});
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

        prefs.edit().putBoolean("background_location_prompted", true).apply();

        new AlertDialog.Builder(this)
                .setTitle("Письма по маршруту")
                .setMessage("Чтобы получать письма при приближении и отъезде, выбери для Trip «Разрешать всегда» и точную геолокацию. Телефон передаёт только событие входа или выхода из выбранного круга, без истории перемещений.")
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

        if(requestCode==POINT_PERMISSION_REQUEST){if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED)readCurrentPoint();else locationError();return;}
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
        if(!TripCloud.isHusband(this)&&!TripCloud.getAccess(this).isEmpty()){
            String ready=GeofenceManager.hasRequiredPermissions(this)?"1":"0";SharedPreferences prefs=getSharedPreferences("trip_permissions",MODE_PRIVATE);if(!ready.equals(prefs.getString("geo-ready",""))){prefs.edit().putString("geo-ready",ready).apply();TripCloud.record(this,"trip-geo-ready",ready);TripCloud.flush(this,null);}MessageService.reconnect(this);
        }
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
        if(webView==null){super.onBackPressed();return;}
        webView.evaluateJavascript("(()=>{const open=[...document.querySelectorAll('dialog[open]')].pop();if(open){open.close();return true;}return false;})()",closed->{if(!"true".equals(closed)){if(webView.canGoBack())webView.goBack();else finishActivityBack();}});
    }

    private void finishActivityBack(){super.onBackPressed();}

    @Override
    protected void onDestroy() {
        finishFileChooser(null);attachmentExecutor.shutdownNow();
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
