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
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public final class MessageService extends Service {
 private ScheduledExecutorService executor;
 public static void startIfReady(Context context){
  if(TripCloud.isHusband(context)||TripCloud.getAccess(context).isEmpty())return;
  try{Intent intent=new Intent(context,MessageService.class);if(Build.VERSION.SDK_INT>=26)context.startForegroundService(intent);else context.startService(intent);}catch(Exception ignored){}
 }
 @Override public void onCreate(){super.onCreate();NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);String channel="trip_connection";if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(new NotificationChannel(channel,"Связь с Ваней",NotificationManager.IMPORTANCE_MIN));
  PendingIntent open=PendingIntent.getActivity(this,9510,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
  Notification.Builder builder=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,channel):new Notification.Builder(this);
  startForeground(9510,builder.setSmallIcon(R.drawable.ic_heart_notification).setContentTitle("Наше место").setContentText("Получение сообщений от Вани").setContentIntent(open).setOngoing(true).build());
  executor=Executors.newSingleThreadScheduledExecutor();executor.scheduleWithFixedDelay(this::check,0,20,TimeUnit.SECONDS);
 }
 private void check(){
  if(TripCloud.isHusband(this)||TripCloud.getAccess(this).isEmpty()){stopSelf();return;}
  HttpURLConnection connection=null;
  try{connection=(HttpURLConnection)new URL("https://trip-private.ivan-s-2001.workers.dev/api/messages").openConnection();connection.setConnectTimeout(8000);connection.setReadTimeout(8000);connection.setRequestProperty("Authorization","Bearer "+TripCloud.getAccess(this));if(connection.getResponseCode()!=200)return;
   String json;try(java.io.InputStream stream=connection.getInputStream()){java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();byte[] buffer=new byte[4096];int read;while((read=stream.read(buffer))!=-1)out.write(buffer,0,read);json=out.toString("UTF-8");}
   JSONArray messages=new JSONObject(json).getJSONArray("messages");android.content.SharedPreferences prefs=getSharedPreferences("trip_messages",MODE_PRIVATE);
   for(int i=messages.length()-1;i>=0;i--){JSONObject message=messages.getJSONObject(i);String id=message.getString("id");if(prefs.getBoolean(id,false))continue;
    if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)continue;
    Intent open=new Intent(this,MainActivity.class);open.putExtra("screen","message-"+id);open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    int notificationId=10000+Math.abs(id.hashCode()%100000);PendingIntent content=PendingIntent.getActivity(this,notificationId,open,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
    Notification.Builder n=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,NotificationScheduler.CHANNEL_LOVE):new Notification.Builder(this);
    n.setSmallIcon(R.drawable.ic_heart_notification).setContentTitle("От Вани ♥").setContentText(message.getString("title")).setContentIntent(content).setAutoCancel(true);
    ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(notificationId,n.build());prefs.edit().putBoolean(id,true).commit();
   }
  }catch(Exception ignored){}finally{if(connection!=null)connection.disconnect();}
 }
 @Override public int onStartCommand(Intent intent,int flags,int startId){return START_STICKY;}
 @Override public void onDestroy(){if(executor!=null)executor.shutdownNow();super.onDestroy();}
 @Override public IBinder onBind(Intent intent){return null;}
}
