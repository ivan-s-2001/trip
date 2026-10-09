package com.ivans.trip;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/** Receives ntfy wake signals; private messages are always fetched from Trip with authorization. */
public final class MessageService extends Service {
 private ScheduledExecutorService executor;
 private volatile boolean running;
 private volatile HttpURLConnection pushConnection;
 public static void startIfReady(Context context){
  if(TripCloud.isHusband(context)||TripCloud.getAccess(context).isEmpty())return;
  try{Intent intent=new Intent(context,MessageService.class);if(Build.VERSION.SDK_INT>=26)context.startForegroundService(intent);else context.startService(intent);}catch(Exception ignored){}
 }
 public static void reconnect(Context context){
  if(TripCloud.isHusband(context)||TripCloud.getAccess(context).isEmpty())return;
  try{Intent intent=new Intent(context,MessageService.class).setAction("reconnect");if(Build.VERSION.SDK_INT>=26)context.startForegroundService(intent);else context.startService(intent);}catch(Exception ignored){}
 }
 @Override public void onCreate(){
  super.onCreate();NotificationScheduler.ensureChannels(this);
  NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);String channel="trip_connection";
  if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(new NotificationChannel(channel,"Связь с Ваней",NotificationManager.IMPORTANCE_MIN));
  PendingIntent open=PendingIntent.getActivity(this,9510,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
  Notification.Builder builder=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,channel):new Notification.Builder(this);
  startForeground(9510,builder.setSmallIcon(R.drawable.ic_heart_notification).setContentTitle("Наше место").setContentText("Получение сообщений от Вани").setContentIntent(open).setOngoing(true).build());
  running=true;executor=Executors.newScheduledThreadPool(2);
  executor.scheduleWithFixedDelay(this::check,0,5,TimeUnit.MINUTES);
  executor.execute(this::subscribe);
 }
 private String readJson(HttpURLConnection connection) throws Exception {
  try(java.io.InputStream stream=connection.getInputStream()){
   java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();byte[] buffer=new byte[4096];int read;
   while((read=stream.read(buffer))!=-1){if(out.size()+read>4*1024*1024)throw new java.io.IOException("Response too large");out.write(buffer,0,read);}
   return out.toString("UTF-8");
  }
 }
 private void subscribe(){
  int failures=0;
  while(running&&!Thread.currentThread().isInterrupted()){
   if(TripCloud.isHusband(this)||TripCloud.getAccess(this).isEmpty()){stopSelf();return;}
   HttpURLConnection connection=null;
   try{
    String topic=TripCloud.getPushTopic(this);
    if(topic.isEmpty()){
     HttpURLConnection config=(HttpURLConnection)new URL("https://trip-private.ivan-s-2001.workers.dev/api/connection").openConnection();
     try{config.setConnectTimeout(8000);config.setReadTimeout(8000);config.setRequestProperty("Authorization","Bearer "+TripCloud.getAccess(this));
      if(config.getResponseCode()!=200)throw new java.io.IOException("Not connected");
      topic=new JSONObject(readJson(config)).getString("pushTopic");TripCloud.setPushTopic(this,topic);
     }finally{config.disconnect();}
    }
    if(!topic.matches("(up[A-Za-z0-9_-]{12}|(trip_|up_)[a-f0-9]{48})"))throw new java.io.IOException("Invalid topic");
    connection=(HttpURLConnection)new URL("https://ntfy.sh/"+topic+"/json").openConnection();pushConnection=connection;
    connection.setConnectTimeout(10000);connection.setReadTimeout(75000);
    if(connection.getResponseCode()!=200)throw new java.io.IOException("Push unavailable");
    failures=0;check();
    try(BufferedReader reader=new BufferedReader(new InputStreamReader(connection.getInputStream(),"UTF-8"))){
     String line;while(running&&(line=reader.readLine())!=null){
      if(line.length()>16000)continue;
      JSONObject event=new JSONObject(line);
      if("message".equals(event.optString("event")))check();
     }
    }
   }catch(Exception ignored){}finally{if(connection!=null)connection.disconnect();pushConnection=null;}
   if(!running)return;
   try{Thread.sleep(Math.min(30000,1000L<<Math.min(failures++,5)));}catch(InterruptedException e){Thread.currentThread().interrupt();return;}
  }
 }
 private void syncGeofences(){
  HttpURLConnection config=null;try{config=(HttpURLConnection)new URL("https://trip-private.ivan-s-2001.workers.dev/api/geofences").openConnection();config.setConnectTimeout(8000);config.setReadTimeout(8000);config.setRequestProperty("Authorization","Bearer "+TripCloud.getAccess(this));if(config.getResponseCode()==200)GeofenceManager.configure(this,new JSONObject(readJson(config)).getJSONArray("points").toString());}catch(Exception ignored){}finally{if(config!=null)config.disconnect();}
 }
 private synchronized void check(){
  if(TripCloud.isHusband(this)||TripCloud.getAccess(this).isEmpty()){stopSelf();return;}
  HttpURLConnection connection=null;
  try{
   connection=(HttpURLConnection)new URL("https://trip-private.ivan-s-2001.workers.dev/api/messages").openConnection();connection.setConnectTimeout(8000);connection.setReadTimeout(8000);connection.setRequestProperty("Authorization","Bearer "+TripCloud.getAccess(this));
   if(connection.getResponseCode()!=200)return;
   JSONArray messages=new JSONObject(readJson(connection)).getJSONArray("messages");android.content.SharedPreferences prefs=getSharedPreferences("trip_messages",MODE_PRIVATE);
   for(int i=messages.length()-1;i>=0;i--){
    JSONObject message=messages.getJSONObject(i);String id=message.getString("id");if(prefs.getBoolean(id,false))continue;
    if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)continue;
    Intent open=new Intent(this,MainActivity.class);open.putExtra("screen","message-"+id);open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    int notificationId=10000+Math.abs(id.hashCode()%100000);PendingIntent content=PendingIntent.getActivity(this,notificationId,open,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
    Notification.Builder n=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,NotificationScheduler.CHANNEL_LOVE):new Notification.Builder(this);
    n.setSmallIcon(R.drawable.ic_heart_notification).setContentTitle("От Вани ♥").setContentText(message.getString("title")).setContentIntent(content).setAutoCancel(true);
    ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(notificationId,n.build());prefs.edit().putBoolean(id,true).commit();
   }
   syncGeofences();
  }catch(Exception ignored){}finally{if(connection!=null)connection.disconnect();}
 }
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  if(intent!=null&&"reconnect".equals(intent.getAction())){HttpURLConnection connection=pushConnection;if(connection!=null)connection.disconnect();executor.execute(this::check);}
  return START_STICKY;
 }
 @Override public void onDestroy(){running=false;HttpURLConnection connection=pushConnection;if(connection!=null)connection.disconnect();if(executor!=null)executor.shutdownNow();super.onDestroy();}
 @Override public IBinder onBind(Intent intent){return null;}
}
