const TripSync=(()=>{
 const API='https://trip-private.ivan-s-2001.workers.dev';
 let token=localStorage.getItem('trip-access')||window.TripNative?.getSyncAccess?.()||'',role=localStorage.getItem('trip-role')||(token?window.TripNative?.getAppRole?.():'')||'',busy=false;
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
 function key(){return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');}
 let push=null;
 function watchPush(topic){
  push?.close();push=null;
  window.TripNative?.setPushTopic?.(topic||'');
  if(role!=='wife'||!topic||!window.EventSource)return;
  push=new EventSource('https://ntfy.sh/'+topic+'/sse');
  const refresh=()=>window.dispatchEvent(new Event('trip-messages'));
  push.onmessage=refresh;push.addEventListener('open',refresh);
 }
 async function login(value){
  const previous=token,candidate=value.trim();
  try{
   const params=candidate.includes('#')?new URLSearchParams(candidate.split('#')[1]):null;
   const code=params?.get('pair')||candidate;
   if(/^[A-Fa-f0-9]{5}-?[A-Fa-f0-9]{5}$/.test(code.replace(/\s/g,''))){
    if(window.TripNative?.getAppRole?.()==='husband')throw Error('wrong-role');
    let pending;try{pending=JSON.parse(localStorage.getItem('trip-pair-key'))}catch(_){}
    if(!pending||pending.code!==code)pending={code,token:key()};localStorage.setItem('trip-pair-key',JSON.stringify(pending));
    await call('/api/pair',{method:'POST',body:JSON.stringify({code,token:pending.token})});token=pending.token;
   }else token=params?.get('access')||candidate;
   const result=await call('/api/me'),expected=window.TripNative?.getAppRole?.();
   if(expected&&result.role!==expected)throw Error('wrong-role');
   const oldRoom=localStorage.getItem('trip-room');
   if(oldRoom&&oldRoom!==result.roomId){for(const name of ['trip-outbox','trip-received-messages','trip-composer-draft'])localStorage.removeItem(name);}
   role=result.role;localStorage.setItem('trip-role',role);localStorage.setItem('trip-access',token);localStorage.setItem('trip-room',result.roomId||'legacy');
   window.TripNative?.setSyncAccess?.(token,role);watchPush(result.pushTopic);
   document.getElementById('connectSheet').close();
   if(role==='husband')openDashboard();else{await restore();flush();}
   document.getElementById('connectionBadge').textContent='Подключено';document.getElementById('ownerSetup').hidden=true;
   window.dispatchEvent(new Event('trip-connected'));
  }catch(error){token=previous;throw error;}
 }
 async function createRoom(){
  const ownerKey=localStorage.getItem('trip-setup-key')||key();localStorage.setItem('trip-setup-key',ownerKey);
  await call('/api/setup',{method:'POST',body:JSON.stringify({token:ownerKey})});
  await login(ownerKey);document.getElementById('deviceConnection').open=true;localStorage.removeItem('trip-setup-key');
 }
 async function restore(){
  try{const result=await call('/api/state');const pending=new Set(queue().map(e=>e.key));for(const item of result.state)if(!pending.has(item.key))localStorage.setItem(item.key,item.value);}catch(_){}
 }
 const labels={'trip-hug-seconds':'Секунд объятия при встрече','trip-kiss-11':'Поцелуй в ответ','trip-hugs':'Объятия','trip-evening-coupon':'Вечер вместе','trip-home-arrived':'Дома','trip-last-moment':'Открытая записка','trip-zone':'Этап маршрута','trip-geo-ready':'Геолокация','trip-geo':'Переход маршрута'};
 function describe(item){
  const m=item.key.match(/^trip-(choice|care|keepsake)-(\d+)-(\d+)$/);
  let title=labels[item.key]||'Прослушивание',value=item.value;
  if(m){const moment=window.TRIP_CONTENT.days[m[2]]?.[m[3]];title=moment?.title||'Момент';if(m[1]==='care'){const opts=Number(m[2])===10?['Вода с собой','Телефон заряжен','Документы рядом']:['Попить воды','Дать плечам отдохнуть','Минуту ничего не делать'];try{value=JSON.parse(value).map(i=>opts[i]).filter(Boolean).join(', ')||'Отметки сняты';}catch(_){}}}
  if(item.key.startsWith('trip-message-'))title='Ответ на твоё сообщение';
  if(item.key==='trip-last-moment'){try{const v=JSON.parse(value);value=window.TRIP_CONTENT.days[v.day]?.[v.index]?.title||value;}catch(_){}}
  if(item.key==='trip-zone')value=({rybinsk:'Рыбинск',svo:'Шереметьево',tjm:'Рощино',kurgan:'Курган',between:'В дороге'})[value]||value;
  if(item.key==='trip-geo-ready')value=value==='1'?'Разрешена в фоне':'Нужно разрешение на телефоне';
  if(item.key==='trip-geo'){try{const g=JSON.parse(value);value=g.transition==='enter'?'Приезд в точку':'Отъезд от точки';}catch(_){}}
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
  if(new URLSearchParams(location.search).get('qa')==='1')return;
  const $=id=>document.getElementById(id),expected=window.TripNative?.getAppRole?.()||new URLSearchParams(location.search).get('app');
  $('ownerSetup').hidden=expected==='wife'||Boolean(role);$('connectForm').hidden=expected==='husband'||role==='husband';
  $('connectButton').addEventListener('click',()=>$('connectSheet').showModal());
  const geoUI=()=>{if(!$('geoSettings'))return;$('geoSettings').hidden=!(role==='wife'&&window.TripNative?.enableGeolocation);if($('geoSettings').hidden)return;const permissions=window.TripNative.hasBackgroundLocation?.(),location=window.TripNative.isLocationEnabled?.(),notifications=window.TripNative.notificationsEnabled?.();$('geoStatus').textContent=!permissions?'Геолокация: разреши точное местоположение «Всегда».':location===false?'Местоположение телефона выключено.':'Геолокация: готово.';$('notificationStatus').textContent=notifications===false?'Уведомления выключены — письма будут в приложении, но телефон не сообщит о них.':notifications===true?'Уведомления: включены.':'Проверь, что уведомления Trip разрешены.';$('enableDeviceLocation').hidden=location!==false;$('enableNotifications').hidden=notifications===true;};geoUI();for(const event of ['trip-connected','trip-permissions','focus'])window.addEventListener(event,geoUI);$('enableGeo')?.addEventListener('click',()=>window.TripNative.enableGeolocation());$('enableNotifications')?.addEventListener('click',()=>window.TripNative.openNotificationSettings?.());$('enableDeviceLocation')?.addEventListener('click',()=>window.TripNative.openLocationSettings?.());

  $('connectClose').addEventListener('click',()=>$('connectSheet').close());
  $('createRoom').addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await createRoom();$('connectError').textContent='';}catch(_){$('connectError').textContent='Не удалось создать наше место. Проверь интернет и попробуй ещё раз.';}finally{e.currentTarget.disabled=false;}});
  $('connectForm').addEventListener('submit',async e=>{e.preventDefault();try{await login($('accessCode').value);$('connectError').textContent='';}catch(error){$('connectError').textContent=error.message==='wrong-role'?'Это подключение для другого приложения.':'Не удалось подключиться. Код действует 15 минут — создай новый в редакторе и проверь интернет.';}});
  $('createConnection').addEventListener('click',async e=>{const button=e.currentTarget;button.disabled=true;try{
   const result=await call('/api/access',{method:'POST'});
   $('connectionCode').value=result.code;
   $('connectionLink').value=`https://ivan-s-2001.github.io/trip/#pair=${result.code}`;
   $('connectionResult').hidden=false;
   $('connectionStatus').textContent='Введи этот код в приложении Наташи. Он действует 15 минут и подходит для одного телефона.';
  }catch(_){$('connectionStatus').textContent='Не удалось создать код. Проверь интернет и попробуй ещё раз.';}finally{button.disabled=false;}});
  for(const [button,field]of [['copyConnection','connectionCode'],['copyConnectionLink','connectionLink']])$(button).addEventListener('click',async()=>{const input=$(field);try{await navigator.clipboard.writeText(input.value);$('connectionStatus').textContent='Скопировано.';}catch(_){input.focus();input.select();$('connectionStatus').textContent='Выделено — скопируй текст.';}});
  $('dashboardRefresh').addEventListener('click',()=>{refreshDashboard();window.dispatchEvent(new Event('trip-messages'));});
  for(const link of document.querySelectorAll?.('.editor-nav a')||[])link.addEventListener('click',()=>{for(const other of document.querySelectorAll('.editor-nav a'))other.removeAttribute('aria-current');link.setAttribute('aria-current','location');});
  $('dashboardLogout').textContent='Подключение';
  $('dashboardLogout').addEventListener('click',()=>{const connection=$('deviceConnection');connection.open=true;connection.scrollIntoView({block:'start',behavior:'smooth'});});
  const params=new URLSearchParams(location.hash.slice(1)),incoming=params.get('pair')||params.get('access');
  if(incoming)history.replaceState(null,'',location.pathname+location.search);
  if(role==='husband')openDashboard();
  if(token||incoming){try{await login(incoming||token)}catch(_){$('connectionBadge').textContent='Нет связи';}}
  if(!role&&expected==='husband')$('connectSheet').showModal();
  if(role==='wife')window.dispatchEvent(new Event('trip-connected'));
  window.addEventListener('online',()=>{if(token)login(token).catch(()=>{});flush();});
  setInterval(()=>{if(role==='husband'&&!document.hidden)refreshDashboard();else flush()},30000);
 }
 document.addEventListener('DOMContentLoaded',setup);
 return {save,record,flush,call,getRole:()=>role};
})();

window.TripSync=TripSync;
