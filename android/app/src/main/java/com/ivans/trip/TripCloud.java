package com.ivans.trip;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.BroadcastReceiver;
import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

public final class TripCloud {
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static final Object LOCK = new Object();
    private static SharedPreferences prefs(Context context) { return context.getSharedPreferences("trip_cloud", Context.MODE_PRIVATE); }
    public static boolean isHusband(Context context) { return BuildConfig.HUSBAND_APP || "husband".equals(prefs(context).getString("role", "")); }
    public static String getAccess(Context context) { return prefs(context).getString("token", ""); }
    public static String getPushTopic(Context context) { return prefs(context).getString("push_topic", ""); }
    public static void setPushTopic(Context context, String topic) {
        if (!topic.matches("(up[A-Za-z0-9_-]{12}|(trip_|up_)[a-f0-9]{48})")) return;
        if (topic.equals(getPushTopic(context))) return;
        prefs(context).edit().putString("push_topic", topic).apply();
        MessageService.reconnect(context);
    }
    public static void setAccess(Context context, String token, String role) {
        if(!token.equals(getAccess(context))) prefs(context).edit().remove("push_topic").apply();
        prefs(context).edit().putString("token", token).putString("role", role).apply();
        if("husband".equals(role)) GeofenceManager.unregister(context);
        MessageService.startIfReady(context);
        if("husband".equals(role)||token.isEmpty())context.stopService(new android.content.Intent(context,MessageService.class));
        flush(context, null);
    }
    public static void record(Context context, String key, String value) {
        synchronized (LOCK) {
            SharedPreferences state = prefs(context);
            if (!"wife".equals(state.getString("role", ""))) return;
            try {
                JSONArray queue = new JSONArray(state.getString("queue", "[]"));
                JSONObject event = new JSONObject();
                event.put("id", UUID.randomUUID().toString()); event.put("key", key);
                event.put("value", value); event.put("at", System.currentTimeMillis());
                queue.put(event); state.edit().putString("queue", queue.toString()).commit();
            } catch (Exception ignored) {}
        }
    }
    public static void flush(Context context, BroadcastReceiver.PendingResult pending) {
        Context app = context.getApplicationContext();
        EXECUTOR.execute(() -> {
            try {
                SharedPreferences state = prefs(app);
                if (!"wife".equals(state.getString("role", ""))) return;
                JSONArray batch;
                synchronized (LOCK) {
                    JSONArray queue = new JSONArray(state.getString("queue", "[]"));
                    batch = new JSONArray(); for(int i=0;i<Math.min(queue.length(),40);i++) batch.put(queue.get(i));
                }
                if(batch.length()==0) return;
                HttpURLConnection connection = (HttpURLConnection) new URL("https://trip-private.ivan-s-2001.workers.dev/api/events").openConnection();
                connection.setRequestMethod("POST"); connection.setConnectTimeout(2500); connection.setReadTimeout(2500);
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Authorization", "Bearer " + state.getString("token", ""));
                connection.setDoOutput(true);
                JSONObject body=new JSONObject();body.put("events",batch);
                try(java.io.OutputStream output=connection.getOutputStream()){output.write(body.toString().getBytes(StandardCharsets.UTF_8));}
                int status=connection.getResponseCode();connection.disconnect();
                if(status>=200 && status<300){
                    synchronized(LOCK){
                        JSONArray queue=new JSONArray(state.getString("queue","[]")), remaining=new JSONArray();
                        java.util.HashSet<String> sent=new java.util.HashSet<>();
                        for(int i=0;i<batch.length();i++)sent.add(batch.getJSONObject(i).getString("id"));
                        for(int i=0;i<queue.length();i++)if(!sent.contains(queue.getJSONObject(i).getString("id")))remaining.put(queue.get(i));
                        state.edit().putString("queue",remaining.toString()).commit();
                    }
                }
            } catch(Exception ignored) {} finally {if(pending!=null) pending.finish();}
        });
    }
}
