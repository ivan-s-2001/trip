const allowedKey=/^trip-(choice-\d+-\d+|care-\d+-\d+|keepsake-\d+-\d+|evening-coupon|hugs|hug-seconds|kiss-11|home-arrived|last-moment|audio-[a-z0-9.-]+|zone|message-[a-z0-9-]+)$/;
export default {
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  const cors={'Access-Control-Allow-Origin':origin==='https://ivan-s-2001.github.io'||origin===url.origin||origin==='null'?origin:'https://ivan-s-2001.github.io','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
  if(request.method==='OPTIONS')return new Response(null,{headers:cors});
  if(!url.pathname.startsWith('/api/'))return serveAsset(url.pathname);
  try{
   const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';
   if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'unauthorized'},401);
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const user=await env.DB.prepare('SELECT role FROM access WHERE hash=?').bind(hash).first();
   if(!user)return reply({error:'unauthorized'},401);
   if(url.pathname==='/api/access' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))].map(x=>x.toString(16).padStart(2,'0')).join('');
    await env.DB.prepare('INSERT INTO access(hash,role) VALUES(?,?)').bind(hash,'wife').run();
    return reply({token,role:'wife'});
   }
   if(url.pathname.startsWith('/api/media/') && request.method==='GET'){
    const row=await env.DB.prepare('SELECT mime,data FROM media WHERE id=?').bind(url.pathname.split('/').pop()).first();
    if(!row)return reply({error:'not-found'},404);
    return new Response(Uint8Array.from(atob(row.data),c=>c.charCodeAt(0)),{headers:{...cors,'Content-Type':row.mime}});
   }
   if(url.pathname==='/api/media' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>1450000)return reply({error:'too-large'},413);
    const b=JSON.parse(raw);
    if(!['image/jpeg','image/png','image/webp','audio/mp4','audio/mpeg','audio/ogg','audio/webm','audio/x-m4a'].includes(b.mime)||typeof b.data!=='string'||! /^[A-Za-z0-9+/]+={0,2}$/.test(b.data)||b.data.length>1400000)return reply({error:'invalid-media'},400);
    const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO media VALUES(?,?,?,?)').bind(id,b.mime,b.data,Date.now()).run();return reply({id,mime:b.mime});
   }
   if(url.pathname==='/api/messages' && request.method==='GET'){
    const query=user.role==='husband'?'SELECT * FROM messages ORDER BY due DESC LIMIT 200':'SELECT * FROM messages WHERE cancelled=0 AND due<=? ORDER BY due DESC LIMIT 100';
    const q=env.DB.prepare(query);const rows=await (user.role==='husband'?q:q.bind(Date.now())).all();return reply({messages:rows.results.map(x=>({...x,body:JSON.parse(x.body)}))});
   }
   if(url.pathname==='/api/messages' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);
    const raw=await request.text();if(raw.length>32000)return reply({error:'too-large'},413);const b=JSON.parse(raw);
    if(typeof b.title!=='string'||b.title.length>160||!b.title.trim()||typeof b.text!=='string'||b.text.length>20000||!Number.isSafeInteger(b.due)||b.due<0||!['none','letter','gift','hold','hug','choice'].includes(b.interactive)||!Array.isArray(b.media)||b.media.length>11||!Array.isArray(b.choices)||b.choices.length>6||b.choices.some(x=>typeof x!=='string'||x.length>200)||b.interactive==='choice'&&b.choices.length<2)return reply({error:'invalid-message'},400);
    let photos=0,audio=0;for(const m of b.media){if(!m||typeof m.id!=='string')return reply({error:'invalid-media'},400);const file=await env.DB.prepare('SELECT id,mime FROM media WHERE id=?').bind(m.id).first();if(!file)return reply({error:'invalid-media'},400);m.mime=file.mime;if(file.mime.startsWith('image/'))photos++;else audio++;}if(photos>10||audio>1)return reply({error:'too-many-media'},400);
    const id=b.id||b.requestId||crypto.randomUUID();if(!/^[a-z0-9-]{36}$/.test(id))return reply({error:'invalid-id'},400);
    if(b.requestId&&!b.id){const duplicate=await env.DB.prepare('SELECT id FROM messages WHERE id=?').bind(id).first();if(duplicate)return reply({id});}
    if(b.id){const old=await env.DB.prepare('SELECT due,cancelled FROM messages WHERE id=?').bind(id).first();if(!old||old.cancelled||old.due<=Date.now())return reply({error:'already-delivered'},409);}
    const body=JSON.stringify({text:b.text,interactive:b.interactive,choices:b.choices,media:b.media});
    await env.DB.prepare('INSERT INTO messages(id,title,body,due,created) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,due=excluded.due WHERE messages.due>? AND messages.cancelled=0').bind(id,b.title.trim(),body,b.due,Date.now(),Date.now()).run();return reply({id});
   }
   if(url.pathname==='/api/messages/cancel' && request.method==='POST'){
    if(user.role!=='husband')return reply({error:'forbidden'},403);const b=await request.json();
    const result=await env.DB.prepare('UPDATE messages SET cancelled=1 WHERE id=? AND due>?').bind(b.id,Date.now()).run();return reply({cancelled:result.meta.changes>0});
   }
   if(url.pathname==='/api/me')return reply({role:user.role});
   if(url.pathname==='/api/events'&&request.method==='POST'){
    if(user.role!=='wife')return reply({error:'forbidden'},403);
    if(Number(request.headers.get('content-length'))>64000)return reply({error:'too-large'},413);
    const raw=await request.text();if(raw.length>64000)return reply({error:'too-large'},413);
    const body=JSON.parse(raw),events=body.events;
    if(!Array.isArray(events)||!events.length||events.length>40)return reply({error:'invalid-batch'},400);
    const now=Date.now();
    for(const e of events)if(!e||typeof e.id!=='string'||! /^[a-zA-Z0-9-]{16,80}$/.test(e.id)||!allowedKey.test(e.key)||typeof e.value!=='string'||e.value.length>2000||!Number.isSafeInteger(e.at)||e.at<0||e.at>now+300000)return reply({error:'invalid-event'},400);
    const statements=[];
    for(const e of events){statements.push(env.DB.prepare('INSERT OR IGNORE INTO events(id,key,value,at,received) VALUES(?,?,?,?,?)').bind(e.id,e.key,e.value,e.at,now));statements.push(env.DB.prepare('INSERT INTO state(key,value,at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,at=excluded.at WHERE excluded.at>=state.at').bind(e.key,e.value,e.at));}
    await env.DB.batch(statements);return reply({accepted:events.map(e=>e.id)});
   }
   if(url.pathname==='/api/state'&&request.method==='GET'){
    const state=await env.DB.prepare('SELECT key,value,at FROM state ORDER BY at DESC').all();
    const cursor=Number(url.searchParams.get('before'))||Number.MAX_SAFE_INTEGER;
    const events=await env.DB.prepare('SELECT rowid AS cursor,id,key,value,at,received FROM events WHERE rowid<? ORDER BY rowid DESC LIMIT 100').bind(cursor).all();
    return reply({state:state.results,events:events.results});
   }
   return reply({error:'not-found'},404);
  }catch(e){return reply({error:'server-error'},500)}
 }
};
// ASSET_HANDLER
