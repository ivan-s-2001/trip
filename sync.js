const TripSync=(()=>{
 const API='https://trip-private.ivan-s-2001.workers.dev';
 let token=localStorage.getItem('trip-access')||window.TripNative?.getSyncAccess?.()||'',role=localStorage.getItem('trip-role')||'',busy=false;
 const queue=()=>{try{return JSON.parse(localStorage.getItem('trip-outbox'))||[]}catch(_){return []}};
 const id=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
 async function call(path,options={}){const r=await fetch(API+path,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});if(!r.ok)throw Error(String(r.status));return r.json()}
 function record(key,value){
  if(role!=='wife'||new URLSearchParams(location.search).get('qa')==='1')return;
  const events=queue();events.push({id:id(),key,value:String(value),at:Date.now()});localStorage.setItem('trip-outbox',JSON.stringify(events));flush();
 }
 async function flush(){
  if(busy||!token||role!=='wife'||!navigator.onLine)return;
  busy=true;
  try{while(queue().length){const batch=queue().slice(0,40);const result=await call('/api/events',{method:'POST',body:JSON.stringify({events:batch})});const accepted=new Set(result.accepted);localStorage.setItem('trip-outbox',JSON.stringify(queue().filter(e=>!accepted.has(e.id))));}}
  catch(_){}finally{busy=false}
 }
 function save(key,value){localStorage.setItem(key,String(value));record(key,value)}
 async function login(value){token=value.trim();const result=await call('/api/me');role=result.role;localStorage.setItem('trip-role',role);localStorage.setItem('trip-access',token);window.TripNative?.setSyncAccess?.(token,role);document.getElementById('connectSheet').close();if(role==='husband')openDashboard();else{await restore();flush();}}
 async function restore(){
  try{const result=await call('/api/state');const pending=new Set(queue().map(e=>e.key));for(const item of result.state)if(!pending.has(item.key))localStorage.setItem(item.key,item.value);}catch(_){}
 }
 const labels={'trip-hug-seconds':'Секунд объятия при встрече','trip-kiss-11':'Поцелуй в ответ','trip-hugs':'Объятия','trip-evening-coupon':'Вечер вместе','trip-home-arrived':'Дома','trip-last-moment':'Открытая записка','trip-zone':'Этап маршрута'};
 function describe(item){
  const m=item.key.match(/^trip-(choice|care|keepsake)-(\d+)-(\d+)$/);
  let title=labels[item.key]||'Прослушивание',value=item.value;
  if(m){const moment=window.TRIP_CONTENT.days[m[2]]?.[m[3]];title=moment?.title||'Момент';if(m[1]==='care'){const opts=Number(m[2])===10?['Вода с собой','Телефон заряжен','Документы рядом']:['Попить воды','Дать плечам отдохнуть','Минуту ничего не делать'];try{value=JSON.parse(value).map(i=>opts[i]).filter(Boolean).join(', ')||'Отметки сняты';}catch(_){}}}
  if(item.key==='trip-last-moment'){try{const v=JSON.parse(value);value=window.TRIP_CONTENT.days[v.day]?.[v.index]?.title||value;}catch(_){}}
  if(item.key==='trip-zone')value=({rybinsk:'Рыбинск',svo:'Шереметьево',tjm:'Рощино',kurgan:'Курган',between:'В дороге'})[value]||value;
  if(item.key==='trip-home-arrived'||item.key==='trip-evening-coupon')value=value==='1'?'Да':value;
  if(item.key.startsWith('trip-audio-'))value=`${Math.floor(Number(value)||0)} секунд`;
  return {title,value};
 }
 function cards(items){const root=document.createElement('div');for(const item of items){const data=describe(item);const card=document.createElement('article'),title=document.createElement('strong'),value=document.createElement('p'),time=document.createElement('small');title.textContent=data.title;value.textContent=data.value;time.textContent=new Date(item.at).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});card.append(title,value,time);root.append(card)}return root}
 async function refreshDashboard(){
  const status=document.getElementById('dashboardStatus');
  try{const data=await call('/api/state');status.textContent=`Обновлено ${new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}`;document.getElementById('dashboardState').replaceChildren(cards(data.state));document.getElementById('dashboardEvents').replaceChildren(cards(data.events));document.getElementById('dashboardEmpty').hidden=data.state.length>0;}
  catch(_){status.textContent='Не удалось обновить. Показываем последние полученные данные.'}
 }
 function openDashboard(){document.getElementById('husbandDashboard').hidden=false;document.getElementById('scene').hidden=true;refreshDashboard()}
 async function setup(){
  if(new URLSearchParams(location.search).get("qa")==="1")return;
  document.getElementById('connectButton').addEventListener('click',()=>document.getElementById('connectSheet').showModal());
  document.getElementById('connectClose').addEventListener('click',()=>document.getElementById('connectSheet').close());
  document.getElementById('connectForm').addEventListener('submit',async e=>{e.preventDefault();try{await login(document.getElementById('accessCode').value);document.getElementById('connectError').textContent='';}catch(_){document.getElementById('connectError').textContent='Не удалось подключиться. Проверь код и интернет.'}});
  document.getElementById('dashboardRefresh').addEventListener('click',refreshDashboard);
  document.getElementById('dashboardLogout').addEventListener('click',()=>{localStorage.removeItem('trip-access');localStorage.removeItem('trip-role');window.TripNative?.setSyncAccess?.('','');location.hash='';location.reload()});
  const params=new URLSearchParams(location.hash.slice(1));const incoming=params.get('access');if(incoming){history.replaceState(null,'',location.pathname+location.search);token=incoming;}
  if(token){try{await login(token)}catch(_){document.getElementById('connectSheet').showModal()}}
  window.addEventListener('online',flush);setInterval(()=>{if(role==='husband'&&!document.hidden)refreshDashboard();else flush()},15000);
 }
 document.addEventListener('DOMContentLoaded',setup);
 return {save,record,flush};
})();

window.TripSync=TripSync;
