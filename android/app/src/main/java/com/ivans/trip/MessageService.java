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
  TripCloud.flush(this,null);
  if(TripCloud.isHusband(this)||TripCloud.getAccess(this).isEmpty()){stopSelf();return;}
  HttpURLConnection connection=null;
  try{
   connection=(HttpURLConnection)new URL("https://trip-private.ivan-s-2001.workers.dev/api/messages").openConnection();connection.setConnectTimeout(8000);connection.setReadTimeout(8000);connection.setRequestProperty("Authorization"…17124 tokens truncated…stop;}else open.onclick=reveal;card.append(open);}else if(!localStorage.getItem(key))answer('Открыла');
if(m.body.interactive==='choice'){const group=document.createElement('div');group.className='letter-choices';const hint=document.createElement('p');hint.className='field-hint';hint.textContent='Твой ответ увидит Ваня';group.append(hint);for(const choice of m.body.choices){const button=document.createElement('button');button.textContent=choice;const selected=localStorage.getItem(key)===choice;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));button.onclick=()=>{answer(choice);group.querySelectorAll('button').forEach(x=>{x.classList.toggle('selected',x===button);x.setAttribute('aria-pressed',String(x===button));});};group.append(button);}card.append(group);}
if(m.body.interactive==='hug'){const button=document.createElement('button');button.className='letter-open';let count=Number(localStorage.getItem(key))||0;const label=()=>button.textContent=count?`Ещё секундочку · ${count} с`:'Обнимемся?';label();button.onclick=()=>{count++;label();answer(String(count));};card.append(button);}const signature=document.createElement('p');signature.className='letter-signature';signature.textContent='Твой Ваня';card.append(signature);card.id='received-'+m.id;root.append(card);}}

async function tick(){if(loading)return;loading=true;if($('inboxRefresh'))$('inboxRefresh').disabled=true;try{if(TripSync.getRole()==='husband'){mount();await list();}else if(TripSync.getRole()==='wife'){inboxMount();let received;try{const data=await TripSync.call('/api/messages');received=Array.isArray(data.messages)?data.messages:[];try{localStorage.setItem('trip-received-messages',JSON.stringify(received));}catch(_){}$('inboxConnection').textContent='На связи';}catch(_){try{received=JSON.parse(localStorage.getItem('trip-received-messages')||'[]');}catch(_){received=[];}$('inboxConnection').textContent='Без сети · сохранённые письма';}
const previous=messages[inboxIndex]?.id||localStorage.getItem('trip-inbox-current');messages=received;const index=messages.findIndex(m=>m.id===previous);inboxIndex=index>=0?index:0;
if(location.hash.startsWith('#message-')&&!openedFromNotification){openedFromNotification=true;const requested=messages.findIndex(m=>m.id===location.hash.slice(9));if(requested>=0)inboxIndex=requested;}
newestMessage=messages[0]?.id;const unreadNewest=newestMessage&&newestMessage!==messages[inboxIndex]?.id&&!localStorage.getItem('trip-message-'+newestMessage);$('inboxNew').hidden=!unreadNewest;
$('inboxCount').textContent=messages.length?`${inboxIndex+1} из ${messages.length}`:'Пока нет сообщений';$('inboxNext').disabled=inboxIndex>=messages.length-1;$('inboxPrev').disabled=inboxIndex===0;$('inboxList').disabled=!messages.length;
if(JSON.stringify(messages[inboxIndex])!==shownMessage||!$('inboxMessages').children.length||$('firstConnect'))drawInbox();}}catch(_){if($('inboxConnection'))$('inboxConnection').textContent='Не удалось обновить · попробуй снова';}finally{loading=false;if($('inboxRefresh'))$('inboxRefresh').disabled=false;}}

document.addEventListener('DOMContentLoaded',()=>{if((window.TripNative?.getAppRole?.()==='wife'||new URLSearchParams(location.search).get('app')==='wife')&&!TripSync.getRole()){inboxMount();$('inboxConnection').textContent='Ещё не подключено';$('inboxMessages').innerHTML='<article class="inbox-empty"><span class="bi-icon bi-house-heart-fill" aria-hidden="true"></span><h3>Даже когда<br>ты далеко</h3><p>Здесь будут письма, фотографии и голос Вани. Подключи приложение по его коду.</p><button id="firstConnect" class="primary" type="button">Подключиться к Ване</button></article>';$('firstConnect').onclick=()=>$('connectSheet').showModal();}setTimeout(tick,800);setInterval(()=>{if(!document.hidden)tick();},15000);window.addEventListener('online',tick);window.addEventListener('trip-connected',tick);window.addEventListener('trip-messages',tick);window.addEventListener('focus',tick);});
})();
