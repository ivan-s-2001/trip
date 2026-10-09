import defaultPlans from './plans.mjs';
const mediaTypes=new Set(['image/jpeg','image/png','image/webp','audio/mp4','audio/mpeg','audio/ogg','audio/webm','audio/x-m4a','audio/aac','audio/wav','audio/flac','application/pdf','text/plain','application/zip','application/octet-stream','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation']);
const GEO_DUE=4102444800000;
const MEDIA_CHUNK=524288,MEDIA_MAX=10485760;
const allowedKey=/^trip-(choice-\d+-\d+|care-\d+-\d+|keepsake-\d+-\d+|evening-coupon|hugs|hug-seconds|kiss-11|home-arrived|last-moment|audio-[a-z0-9.-]+|zone|geo|geo-ready|message-[a-z0-9-]+)$/;
const hex=bytes=>[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
const digest=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
const secret=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
async function drainPush(env,roomId=null){
 const now=Date.now();
 const jobs=await env.DB.prepare('SELECT p.message_id,p.attempts,r.topic FROM push_jobs p JOIN rooms r ON r.id=p.room_id JOIN messages m ON m.id=p.message_id WHERE p.sent=0 AND p.due<=? AND p.retry_at<=? AND m.cancelled=0 AND m.due<=? AND (? IS NULL OR p.room_id=?) LIMIT 30').bind(now,now,now,roomId,roomId).all();
 await Promise.all(jobs.results.map(async job=>{
  try{
   const response=await fetch('https://ntfy.sh/'+job.topic,{method:'POST',headers:{'Content-Type':'text/plain','Cache':'no','Firebase':'no','UnifiedPush':'1'},body:'sync',signal:AbortSignal.timeout(8000)});
   await response.body?.cancel();
   if(!response.ok)throw Error('push-'+response.status);
   await env.DB.prepare('UPDATE push_jobs SET sent=1 WHERE message_id=?').bind(job.message_id).run();
  }catch(_){await env.DB.prepare('UPDATE push_jobs SET attempts=attempts+1,retry_at=? WHERE message_id=?').bind(now+Math.min(3600000,60000*2**Math.min(job.attempts,6)),job.message_id).run();}
 }));
}
const presetPoints={rybinsk:[58.05,38.8333,'Рыбинск'],svo:[55.97264,37.41459,'Шереметьево'],tjm:[57.16833,65.31611,'Рощино · Тюмень'],kurgan:[55.45,65.3333,'Курган']};
async function planMessageId(room,id){const h=await digest(room+':trip-plan-v25:'+id);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;}
async function seedPlans(env,room){
 const count=await env.DB.prepare('SELECT count(*) AS n FROM plans WHERE room_id=? AND message_id IS NOT NULL').bind(room).first();if(count.n>=defaultPlans.length)return;
 const statements=[];for(const p of defaultPlans){const id=await planMessageId(room,p.id);let trigger=null,due;
 if(p.when==='later')due=Date.parse(p.date+':00'+(p.timeZone==='moscow'?'+03:00':'+05:00'));
 else{const [lat,lon,label]=presetPoints[p.point];const radius=p.radius*1000;trigger={zone:'geo_'+(await digest(JSON.stringify([lat,lon,radius]))).slice(0,20),transition:p.when,lat,lon,radius,label:p.pointName||label,notBefore:Date.parse(p.notBefore),notAfter:Date.parse(p.notAfter),afterMessage:p.afterPlan?await planMessageId(room,p.afterPlan):null};due=GEO_DUE;}
 const body=JSON.stringify({text:p.text,interactive:p.interactive,choices:p.choices,media:[],timeZone:p.timeZone,trigger});
 statements.push(env.DB.prepare('INSERT OR IGNORE INTO plans(room_id,id,body) VALUES(?,?,?)').bind(room,p.id,JSON.stringify(p)),env.DB.prepare('INSERT OR IGNORE INTO messages(id,title,body,due,created,room_id) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM plans WHERE room_id=? AND id=? AND message_id IS NULL)').bind(id,p.title,body,due,Date.now(),room,room,p.id),env.DB.prepare('INSERT OR IGNORE INTO push_jobs(message_id,room_id,due) SELECT id,room_id,due FROM messages WHERE id=? AND room_id=?').bind(id,room),env.DB.prepare('UPDATE plans SET message_id=? WHERE room_id=? AND id=? AND message_id IS NULL').bind(id,room,p.id));
 }await env.DB.batch(statements);
}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  const cors={'Access-Control-Allow-Origin':origin==='https://ivan-s-2001.github.io'||origin===url.origin||origin==='null'?origin:'https://ivan-s-2001.github.io','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
  if(request.method==='OPTIONS')return new Response(null,{headers:cors});
  if(!url.pathname.startsWith('/api/'))return serveAsset(url.pathname);
  try{
   if(url.pathname==='/api/setup'&&request.method==='POST'){
    const raw=await request.text();if(raw.length>300)return reply({error:'too-large'},413);
    const b=JSON.parse(raw);if(!/^[a-f0-9]{64}$/.test(b.token||''))return reply({error:'invalid-key'},400);
    const hash=await digest(b.token),roomId=hash.slice(0,32);
    const existing=await env.DB.prepare('SELECT role,room_id FROM access WHERE hash=?').bind(hash).first();
    if(existing&&existing.role!=='husband')return reply({error:'forbidden'},403);
    if(!existing)await env.DB.batch([
     env.DB.prepare('INSERT OR IGNORE INTO rooms(id,topic,created) VALUES(?,?,?)').bind(roomId,'up'+btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(9)))).replace(/\+/g,'-').replace(/\//g,'_'),Date.now()),
     env.DB.prepare('INSERT OR IGNORE INTO access(hash,role,room_id) VALUES(?,?,?)').bind(hash,'husband',roomId)
    ]);
    return reply({role:'husband'});
   }
   if(url.pathname==='/api/pair'&&request.method==='POST'){
    const raw=await request.text();if(raw.length>500)return reply({error:'too-large'},413);
    const b=JSON.parse(raw),code=String(b.code||'').replace(/[\s-]/g,'').toUpperCase();
    if(!/^[A-F0-9]{10}$/.test(code)||!/^[a-f0-9]{64}$/.test(b.token||''))return reply({error:'invalid-code'},400);
    const hash=await digest(code),tokenHash=await digest(b.token);
    const existing=await env.DB.prepare('SELECT role,room_id FROM access WHERE hash=?').bind(tokenHash).first();
    if(existing&&existing.role!=='wife')return reply({error:'forbidden'},403);
    const pairing=await env.DB.prepare('UPDATE pairings SET used_hash=? WHERE hash=? AND expires>? AND (used_hash IS NULL OR used_hash=?) RETURNING room_id').bind(tokenHash,hash,Date.now(),tokenHash).first();
    if(!pairing)return reply({error:'invalid-or-expired-code'},400);
    await env.DB.prepare('INSERT OR IGNORE INTO access(hash,role,room_id) VALUES(?,?,?)').bind(tokenHash,'wife',pairing.room_id).run();
    return reply({role:'wife'});
   }
   const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
   if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'unauthorized'},401);
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const user=await env.DB.prepare('SELECT role,room_id FROM access WHERE hash=?').bind(hash).first();
   if(!user)return reply({error:'unauthorized'},401);
   if(url.pathname==='/api/push/test'&&request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const room=await env.DB.prepare('SELECT topic FROM rooms WHERE id=?').bind(user.room_id).first();
    try{
     const response=await fetch('https://ntfy.sh/'+room.topic,{method:'POST',headers:{'Content-Type':'text/plain','Cache':'no','Firebase':'no','UnifiedPush':'1'},body:'sync',signal:AbortSignal.timeout(15000)});
     await response.body?.cancel();
     return reply({ok:response.ok,status:response.status},response.ok?200:502);
    }catch(error){return reply({ok:false,error:error.name},503);}
   }
   if(url.pathname==='/api/access' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const code=hex(crypto.getRandomValues(new Uint8Array(5))).toUpperCase(),expires=Date.now()+15*60000;
    await env.DB.prepare('DELETE FROM pairings WHERE expires<?').bind(Date.now()).run();
    await env.DB.prepare('INSERT INTO pairings(hash,room_id,expires) VALUES(?,?,?)').bind(await digest(code),user.room_id,expires).run();
    return reply({code:code.slice(0,5)+'-'+code.slice(5),expires,role:'wife'});
   }
   if(url.pathname.startsWith('/api/media/') && request.method==='GET'){
    const row=await env.DB.prepare('SELECT mime,data,bytes,parts,complete FROM media WHERE id=? AND room_id=?').bind(url.pathname.split('/').pop(),user.room_id).first();
    if(!row||!row.complete)return reply({error:'not-found'},404);
    const headers={...cors,'Content-Type':row.mime,'X-Content-Type-Options':'nosniff'};
    if(!row.mime.startsWith('image/')&&!row.mime.startsWith('audio/'))headers['Content-Disposition']='attachment';
    if(!row.parts)return new Response(Uint8Array.from(atob(row.data),c=>c.charCodeAt(0)),{headers});
    headers['Content-Length']=String(row.bytes);let part=0;const id=url.pathname.split('/').pop();
    return new Response(new ReadableStream({async pull(controller){try{if(part>=row.parts){controller.close();return;}const chunk=await env.DB.prepare('SELECT data FROM media_chunks WHERE media_id=? AND part=?').bind(id,part++).first();if(!chunk)throw Error('missing-chunk');controller.enqueue(Uint8Array.from(atob(chunk.data),c=>c.charCodeAt(0)));}catch(error){controller.error(error);}}}),{headers});
   }
   if(url.pathname==='/api/media/start'&&request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>500)return reply({error:'too-large'},413);const b=JSON.parse(raw);
    if(!mediaTypes.has(b.mime)||!Number.isSafeInteger(b.bytes)||b.bytes<1||b.bytes>MEDIA_MAX)return reply({error:'invalid-media'},400);
    const id=crypto.randomUUID(),parts=Math.ceil(b.bytes/MEDIA_CHUNK);
    await env.DB.batch([env.DB.prepare('DELETE FROM media_chunks WHERE media_id IN (SELECT id FROM media WHERE complete=0 AND created<? AND room_id=?)').bind(Date.now()-86400000,user.room_id),env.DB.prepare('DELETE FROM media WHERE complete=0 AND created<? AND room_id=?').bind(Date.now()-86400000,user.room_id),env.DB.prepare('INSERT INTO media(id,mime,data,created,room_id,bytes,parts,complete) VALUES(?,?,?,?,?,?,?,0)').bind(id,b.mime,'',Date.now(),user.room_id,b.bytes,parts)]);
    return reply({id,mime:b.mime,parts,chunkBytes:MEDIA_CHUNK});
   }
   if(url.pathname==='/api/media/chunk'&&request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>710000)return reply({error:'too-large'},413);const b=JSON.parse(raw);
    const row=await env.DB.prepare('SELECT bytes,parts,complete FROM media WHERE id=? AND room_id=?').bind(b.id||'',user.room_id).first();
    if(!row||row.complete)return reply({error:'invalid-upload'},409);
    if(!Number.isInteger(b.part)||b.part<0||b.part>=row.parts||typeof b.data!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(b.data))return reply({error:'invalid-chunk'},400);
    const expected=b.part===row.parts-1?row.bytes-MEDIA_CHUNK*b.part:MEDIA_CHUNK;
    let bytes;try{bytes=atob(b.data).length;}catch(_){return reply({error:'invalid-chunk'},400);}if(bytes!==expected)return reply({error:'invalid-chunk-size'},400);
    const result=await env.DB.prepare('INSERT INTO media_chunks(media_id,part,data) SELECT id,?,? FROM media WHERE id=? AND room_id=? AND complete=0 ON CONFLICT(media_id,part) DO UPDATE SET data=excluded.data WHERE EXISTS(SELECT 1 FROM media WHERE id=excluded.media_id AND complete=0)').bind(b.part,b.data,b.id,user.room_id).run();
    return reply({ok:Boolean(result.meta.changes)});
   }
   if(url.pathname==='/api/media/complete'&&request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>200)return reply({error:'too-large'},413);const b=JSON.parse(raw);
    const row=await env.DB.prepare('SELECT id,mime,bytes,parts,complete FROM media WHERE id=? AND room_id=?').bind(b.id||'',user.room_id).first();if(!row)return reply({error:'not-found'},404);
    if(!row.complete){const result=await env.DB.prepare('UPDATE media SET complete=1 WHERE id=? AND room_id=? AND parts=(SELECT count(*) FROM media_chunks WHERE media_id=?)').bind(b.id,user.room_id,b.id).run();if(!result.meta.changes)return reply({error:'upload-incomplete'},409);}
    return reply({id:row.id,mime:row.mime,bytes:row.bytes});
   }
   if(url.pathname==='/api/media' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>1450000)return reply({error:'too-large'},413);
    const b=JSON.parse(raw);
    if(!mediaTypes.has(b.mime)||typeof b.data!=='string'||! /^[A-Za-z0-9+/]+={0,2}$/.test(b.data)||b.data.length>1400000)return reply({error:'invalid-media'},400);
    const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO media(id,mime,data,created,room_id) VALUES(?,?,?,?,?)').bind(id,b.mime,b.data,Date.now(),user.room_id).run();return reply({id,mime:b.mime});
   }
   if(url.pathname==='/api/plans'&&request.method==='GET'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    await seedPlans(env,user.room_id);
    const rows=await env.DB.prepare('SELECT id,body,message_id FROM plans WHERE room_id=? ORDER BY rowid').bind(user.room_id).all();return reply({plans:rows.results.map(p=>({...JSON.parse(p.body),id:p.id,messageId:p.message_id}))});
   }
   if(url.pathname==='/api/plans'&&request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>32000)return reply({error:'too-large'},413);const p=JSON.parse(raw);
    if(typeof p.id!=='string'||!defaultPlans.some(x=>x.id===p.id)||typeof p.title!=='string'||!p.title.trim()||p.title.length>160||typeof p.text!=='string'||p.text.length>20000||!Array.isArray(p.media)||p.media.length>16||!Array.isArray(p.choices)||p.choices.length>6||!['none','letter','gift','hold','hug','choice'].includes(p.interactive)||!['later','enter','exit'].includes(p.when)||!['moscow','kurgan','tyumen'].includes(p.timeZone))return reply({error:'invalid-plan'},400);
    const old=await env.DB.prepare('SELECT message_id FROM plans WHERE room_id=? AND id=?').bind(user.room_id,p.id).first();if(!old||old.message_id)return reply({error:'plan-active'},409);
    await env.DB.prepare('UPDATE plans SET body=? WHERE room_id=? AND id=? AND message_id IS NULL').bind(JSON.stringify(p),user.room_id,p.id).run();return reply({ok:true});
   }
   if(url.pathname==='/api/messages' && request.method==='GET'){
    await seedPlans(env,user.room_id);
    if(user.role==='wife'&&ctx)ctx.waitUntil(drainPush(env,user.room_id));
    const query=user.role==='husband'?'SELECT * FROM messages WHERE room_id=? ORDER BY due DESC LIMIT 200':'SELECT * FROM messages WHERE room_id=? AND cancelled=0 AND due<=? ORDER BY due DESC LIMIT 100';
    const q=env.DB.prepare(query);const rows=await (user.role==='husband'?q.bind(user.room_id):q.bind(user.room_id,Date.now())).all();return reply({messages:rows.results.map(x=>({...x,body:JSON.parse(x.body)}))});
   }
   if(url.pathname==='/api/messages' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>32000)return reply({error:'too-large'},413);const b=JSON.parse(raw);
    if(typeof b.title!=='string'||b.title.length>160||!b.title.trim()||typeof b.text!=='string'||b.text.length>20000||!Number.isSafeInteger(b.due)||b.due<0||!['none','letter','gift','hold','hug','choice'].includes(b.interactive)||!Array.isArray(b.media)||b.media.length>16||!Array.isArray(b.choices)||b.choices.length>6||b.choices.some(x=>typeof x!=='string'||x.length>200)||b.interactive==='choice'&&b.choices.length<2)return reply({error:'invalid-message'},400);
    if(b.timeZone!==undefined&&!['moscow','kurgan','tyumen'].includes(b.timeZone))return reply({error:'invalid-time-zone'},400);
    let trigger=null;
    if(b.trigger){const point=b.trigger;if(!['enter','exit'].includes(point.transition)||!Number.isFinite(point.lat)||point.lat<-90||point.lat>90||!Number.isFinite(point.lon)||point.lon<-180||point.lon>180||!Number.isFinite(point.radius)||point.radius<100||point.radius>500000||typeof point.label!=='string'||!point.label.trim()||point.label.length>120)return reply({error:'invalid-location'},400);
     trigger={zone:'geo_'+(await digest(JSON.stringify([point.lat,point.lon,point.radius]))).slice(0,20),transition:point.transition,lat:point.lat,lon:point.lon,radius:point.radius,label:point.label.trim(),notBefore:Number.isSafeInteger(point.notBefore)?point.notBefore:0,notAfter:Number.isSafeInteger(point.notAfter)?point.notAfter:GEO_DUE,afterMessage:null};if(point.afterMessage){const prior=await env.DB.prepare('SELECT id FROM messages WHERE id=? AND room_id=?').bind(point.afterMessage,user.room_id).first();if(!prior)return reply({error:'invalid-prerequisite'},400);trigger.afterMessage=point.afterMessage;}b.due=GEO_DUE;
     const count=await env.DB.prepare("SELECT count(DISTINCT json_extract(body,'$.trigger.zone')) AS n FROM messages WHERE room_id=? AND due>? AND cancelled=0").bind(user.room_id,Date.now()).first();
     if(count.n>=90){const known=await env.DB.prepare("SELECT id FROM messages WHERE room_id=? AND due>? AND cancelled=0 AND json_extract(body,'$.trigger.zone')=? LIMIT 1").bind(user.room_id,Date.now(),trigger.zone).first();if(!known)return reply({error:'too-many-locations'},409);}
    }
    let photos=0,audio=0,files=0;for(const m of b.media){if(!m||typeof m.id!=='string')return reply({error:'invalid-media'},400);const file=await env.DB.prepare('SELECT id,mime,complete FROM media WHERE id=? AND room_id=?').bind(m.id,user.room_id).first();if(!file||!file.complete)return reply({error:'invalid-media'},400);m.mime=file.mime;if(file.mime.startsWith('image/'))photos++;else if(file.mime.startsWith('audio/'))audio++;else files++;}if(photos>10||audio>1||files>5)return reply({error:'too-many-media'},400);
    if(b.planId){const plan=await env.DB.prepare('SELECT message_id FROM plans WHERE room_id=? AND id=?').bind(user.room_id,b.planId).first();if(!plan||plan.message_id&&plan.message_id!==(b.id||b.requestId))return reply({error:'plan-active'},409);}
    const id=b.id||b.requestId||crypto.randomUUID();if(!/^[a-z0-9-]{36}$/.test(id))return reply({error:'invalid-id'},400);
    if(b.requestId&&!b.id){const duplicate=await env.DB.prepare('SELECT id FROM messages WHERE id=? AND room_id=?').bind(id,user.room_id).first();if(duplicate)return reply({id});}
    if(b.id){const old=await env.DB.prepare('SELECT due,cancelled FROM messages WHERE id=? AND room_id=?').bind(id,user.room_id).first();if(!old||old.cancelled||old.due<=Date.now())return reply({error:'already-delivered'},409);}
    const body=JSON.stringify({text:b.text,interactive:b.interactive,choices:b.choices,media:b.media,timeZone:b.timeZone||'moscow',trigger});
    const result=await env.DB.batch([
     env.DB.prepare('INSERT INTO messages(id,title,body,due,created,room_id) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,due=excluded.due WHERE messages.due>? AND messages.cancelled=0 AND messages.room_id=excluded.room_id').bind(id,b.title.trim(),body,b.due,Date.now(),user.room_id,Date.now()),
     env.DB.prepare('INSERT INTO push_jobs(message_id,room_id,due) SELECT id,room_id,due FROM messages WHERE id=? AND room_id=? ON CONFLICT(message_id) DO UPDATE SET due=excluded.due,retry_at=0 WHERE push_jobs.sent=0').bind(id,user.room_id),
     env.DB.prepare('UPDATE plans SET message_id=? WHERE room_id=? AND id=? AND (message_id IS NULL OR message_id=?)').bind(id,user.room_id,b.planId||'',id)
    ]);
    if(!result[0].meta.changes)return reply({error:'already-delivered'},409);
    if(b.due<=Date.now()&&ctx)ctx.waitUntil(drainPush(env,user.room_id));
    if(trigger&&ctx)ctx.waitUntil((async()=>{try{const room=await env.DB.prepare('SELECT topic FROM rooms WHERE id=?').bind(user.room_id).first();if(room?.topic){const res=await fetch('https://ntfy.sh/'+room.topic,{method:'POST',headers:{'Cache':'no','Firebase':'no','UnifiedPush':'1'},body:'sync',signal:AbortSignal.timeout(8000)});await res.body?.cancel();}}catch(_){}})());
    return reply({id});
   }
   if(url.pathname==='/api/messages/cancel' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);const b=await request.json();
    const result=await env.DB.prepare('UPDATE messages SET cancelled=1 WHERE id=? AND due>? AND room_id=?').bind(b.id,Date.now(),user.room_id).run();return reply({cancelled:result.meta.changes>0});
   }
   if(url.pathname==='/api/geofences'&&request.method==='GET'){
    await seedPlans(env,user.room_id);
    const pending=await env.DB.prepare("SELECT body FROM messages WHERE room_id=? AND due>? AND cancelled=0 AND json_extract(body,'$.trigger.zone') IS NOT NULL ORDER BY created").bind(user.room_id,Date.now()).all();
    const points=new Map();for(const row of pending.results){const trigger=JSON.parse(row.body).trigger;points.set(trigger.zone,{id:trigger.zone,lat:trigger.lat,lon:trigger.lon,radius:trigger.radius,label:trigger.label});}
    return reply({points:[...points.values()]});
   }
   if(url.pathname==='/api/me'){const room=await env.DB.prepare('SELECT topic FROM rooms WHERE id=?').bind(user.room_id).first();return reply({role:user.role,pushTopic:room?.topic||'',roomId:user.room_id});}
   if(url.pathname==='/api/connection'){const room=await env.DB.prepare('SELECT topic FROM rooms WHERE id=?').bind(user.room_id).first();return reply({pushTopic:room?.topic||''});}
   if(url.pathname==='/api/events'&&request.method==='POST'){
    if(user.role!=='wife')return reply({error:'forbidden'},403);
    if(Number(request.headers.get('content-length'))>64000)return reply({error:'too-large'},413);
    const raw=await request.text();if(raw.length>64000)return reply({error:'too-large'},413);
    const body=JSON.parse(raw),events=body.events;
    if(!Array.isArray(events)||!events.length||events.length>40)return reply({error:'invalid-batch'},400);
    const now=Date.now();
    for(const e of events)if(!e||typeof e.id!=='string'||! /^[a-zA-Z0-9-]{16,80}$/.test(e.id)||!allowedKey.test(e.key)||typeof e.value!=='string'||e.value.length>2000||!Number.isSafeInteger(e.at)||e.at<0||e.at>now+300000)return reply({error:'invalid-event'},400);
    const statements=[];
    for(const e of events){
     statements.push(env.DB.prepare('INSERT OR IGNORE INTO events(id,key,value,at,received,room_id) VALUES(?,?,?,?,?,?)').bind(e.id,e.key,e.value,e.at,now,user.room_id));
     statements.push(env.DB.prepare('INSERT INTO state(room_id,key,value,at) VALUES(?,?,?,?) ON CONFLICT(room_id,key) DO UPDATE SET value=excluded.value,at=excluded.at WHERE excluded.at>=state.at').bind(user.room_id,e.key,e.value,e.at));
     if(e.key==='trip-geo'){
      let geo;try{geo=JSON.parse(e.value);}catch(_){return reply({error:'invalid-geofence-event'},400);}if(!/^geo_[a-f0-9]{20}$/.test(geo.zone||'')||!['enter','exit'].includes(geo.transition))return reply({error:'invalid-geofence-event'},400);
      statements.push(env.DB.prepare("UPDATE messages SET due=? WHERE room_id=? AND cancelled=0 AND due>? AND created<=? AND COALESCE(json_extract(body,'$.trigger.notBefore'),0)<=? AND COALESCE(json_extract(body,'$.trigger.notAfter'),4102444800000)>=? AND (json_extract(body,'$.trigger.afterMessage') IS NULL OR EXISTS(SELECT 1 FROM messages prior WHERE prior.id=json_extract(messages.body,'$.trigger.afterMessage') AND prior.room_id=messages.room_id AND prior.due<? AND prior.cancelled=0)) AND json_extract(body,'$.trigger.zone')=? AND json_extract(body,'$.trigger.transition')=? AND NOT EXISTS(SELECT 1 FROM geo_receipts WHERE event_id=? AND room_id=?) AND EXISTS(SELECT 1 FROM events WHERE id=? AND room_id=? AND received=?)").bind(now,user.room_id,now,e.at,e.at,e.at,now,geo.zone,geo.transition,e.id,user.room_id,e.id,user.room_id,now));
      statements.push(env.DB.prepare('UPDATE push_jobs SET due=?,retry_at=0 WHERE room_id=? AND sent=0 AND message_id IN(SELECT id FROM messages WHERE room_id=? AND due=?)').bind(now,user.room_id,user.room_id,now));
      statements.push(env.DB.prepare('INSERT OR IGNORE INTO geo_receipts(room_id,event_id) VALUES(?,?)').bind(user.room_id,e.id));
     }
    }
    await env.DB.batch(statements);if(ctx&&events.some(e=>e.key==='trip-geo'))ctx.waitUntil(drainPush(env,user.room_id));return reply({accepted:events.map(e=>e.id)});
   }
   if(url.pathname==='/api/state'&&request.method==='GET'){
    const state=await env.DB.prepare('SELECT key,value,at FROM state WHERE room_id=? ORDER BY at DESC').bind(user.room_id).all();
    const cursor=Number(url.searchParams.get('before'))||Number.MAX_SAFE_INTEGER;
    const events=await env.DB.prepare('SELECT rowid AS cursor,id,key,value,at,received FROM events WHERE rowid<? AND room_id=? ORDER BY rowid DESC LIMIT 100').bind(cursor,user.room_id).all();
    return reply({state:state.results,events:events.results});
   }
   return reply({error:'not-found'},404);
  }catch(e){return reply({error:'server-error'},500)}
 },
 async scheduled(controller,env,ctx){ctx.waitUntil((async()=>{const rooms=await env.DB.prepare('SELECT id FROM rooms').all();for(const room of rooms.results)await seedPlans(env,room.id);await drainPush(env);})());}
};
// ASSET_HANDLER
