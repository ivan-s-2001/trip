const allowedKey=/^trip-(choice-\d+-\d+|care-\d+-\d+|keepsake-\d+-\d+|evening-coupon|hugs|hug-seconds|kiss-11|home-arrived|last-moment|audio-[a-z0-9.-]+|zone)$/;
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
