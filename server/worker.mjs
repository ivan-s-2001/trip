const allowedKey=/^trip-(choice-\d+-\d+|care-\d+-\d+|keepsake-\d+-\d+|evening-coupon|hugs|hug-seconds|kiss-11|home-arrived|last-moment|audio-[a-z0-9.-]+|zone|message-[a-z0-9-]+)$/;
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
    const row=await env.DB.prepare('SELECT mime,data FROM media WHERE id=? AND room_id=?').bind(url.pathname.split('/').pop(),user.room_id).first();
    if(!row)return reply({error:'not-found'},404);
    return new Response(Uint8Array.from(atob(row.data),c=>c.charCodeAt(0)),{headers:{...cors,'Content-Type':row.mime}});
   }
   if(url.pathname==='/api/media' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>1450000)return reply({error:'too-large'},413);
    const b=JSON.parse(raw);
    if(!['image/jpeg','image/png','image/webp','audio/mp4','audio/mpeg','audio/ogg','audio/webm','audio/x-m4a'].includes(b.mime)||typeof b.data!=='string'||! /^[A-Za-z0-9+/]+={0,2}$/.test(b.data)||b.data.length>1400000)return reply({error:'invalid-media'},400);
    const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO media(id,mime,data,created,room_id) VALUES(?,?,?,?,?)').bind(id,b.mime,b.data,Date.now(),user.room_id).run();return reply({id,mime:b.mime});
   }
   if(url.pathname==='/api/messages' && request.method==='GET'){
    if(user.role==='wife'&&ctx)ctx.waitUntil(drainPush(env,user.room_id));
    const query=user.role==='husband'?'SELECT * FROM messages WHERE room_id=? ORDER BY due DESC LIMIT 200':'SELECT * FROM messages WHERE room_id=? AND cancelled=0 AND due<=? ORDER BY due DESC LIMIT 100';
    const q=env.DB.prepare(query);const rows=await (user.role==='husband'?q.bind(user.room_id):q.bind(user.room_id,Date.now())).all();return reply({messages:rows.results.map(x=>({...x,body:JSON.parse(x.body)}))});
   }
   if(url.pathname==='/api/messages' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>32000)return reply({error:'too-large'},413);const b=JSON.parse(raw);
    if(typeof b.title!=='string'||b.title.length>160||!b.title.trim()||typeof b.text!=='string'||b.text.length>20000||!Number.isSafeInteger(b.due)||b.due<0||!['none','letter','gift','hold','hug','choice'].includes(b.interactive)||!Array.isArray(b.media)||b.media.length>11||!Array.isArray(b.choices)||b.choices.length>6||b.choices.some(x=>typeof x!=='string'||x.length>200)||b.interactive==='choice'&&b.choices.length<2)return reply({error:'invalid-message'},400);
    let photos=0,audio=0;for(const m of b.media){if(!m||typeof m.id!=='string')return reply({error:'invalid-media'},400);const file=await env.DB.prepare('SELECT id,mime FROM media WHERE id=? AND room_id=?').bind(m.id,user.room_id).first();if(!file)return reply({error:'invalid-media'},400);m.mime=file.mime;if(file.mime.startsWith('image/'))photos++;else audio++;}if(photos>10||audio>1)return reply({error:'too-many-media'},400);
    const id=b.id||b.requestId||crypto.randomUUID();if(!/^[a-z0-9-]{36}$/.test(id))return reply({error:'invalid-id'},400);
    if(b.requestId&&!b.id){const duplicate=await env.DB.prepare('SELECT id FROM messages WHERE id=? AND room_id=?').bind(id,user.room_id).first();if(duplicate)return reply({id});}
    if(b.id){const old=await env.DB.prepare('SELECT due,cancelled FROM messages WHERE id=? AND room_id=?').bind(id,user.room_id).first();if(!old||old.cancelled||old.due<=Date.now())return reply({error:'already-delivered'},409);}
    const body=JSON.stringify({text:b.text,interactive:b.interactive,choices:b.choices,media:b.media});
    const result=await env.DB.batch([
     env.DB.prepare('INSERT INTO messages(id,title,body,due,created,room_id) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,due=excluded.due WHERE messages.due>? AND messages.cancelled=0 AND messages.room_id=excluded.room_id').bind(id,b.title.trim(),body,b.due,Date.now(),user.room_id,Date.now()),
     env.DB.prepare('INSERT INTO push_jobs(message_id,room_id,due) SELECT id,room_id,due FROM messages WHERE id=? AND room_id=? ON CONFLICT(message_id) DO UPDATE SET due=excluded.due,retry_at=0 WHERE push_jobs.sent=0').bind(id,user.room_id)
    ]);
    if(!result[0].meta.changes)return reply({error:'already-delivered'},409);
    if(b.due<=Date.now()&&ctx)ctx.waitUntil(drainPush(env,user.room_id));
    return reply({id});
   }
   if(url.pathname==='/api/messages/cancel' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);const b=await request.json();
    const result=await env.DB.prepare('UPDATE messages SET cancelled=1 WHERE id=? AND due>? AND room_id=?').bind(b.id,Date.now(),user.room_id).run();return reply({cancelled:result.meta.changes>0});
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
    for(const e of events){statements.push(env.DB.prepare('INSERT OR IGNORE INTO events(id,key,value,at,received,room_id) VALUES(?,?,?,?,?,?)').bind(e.id,e.key,e.value,e.at,now,user.room_id));statements.push(env.DB.prepare('INSERT INTO state(room_id,key,value,at) VALUES(?,?,?,?) ON CONFLICT(room_id,key) DO UPDATE SET value=excluded.value,at=excluded.at WHERE excluded.at>=state.at').bind(user.room_id,e.key,e.value,e.at));}
    await env.DB.batch(statements);return reply({accepted:events.map(e=>e.id)});
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
 async scheduled(controller,env,ctx){ctx.waitUntil(drainPush(env));}
};
// ASSET_HANDLER
