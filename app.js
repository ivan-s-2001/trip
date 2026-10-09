const CONTENT = window.TRIP_CONTENT;
const $ = (id) => document.getElementById(id);
function saveShared(key,value){if(window.TripSync) window.TripSync.save(key,value);else localStorage.setItem(key,value);}

const T = {
  tripStart: new Date("2026-10-10T00:00:00+03:00"),
  outDep: new Date("2026-10-10T23:00:00+03:00"),
  outArr: new Date("2026-10-11T03:45:00+05:00"),
  anniversary: new Date("2026-10-16T00:00:00+05:00"),
  backDep: new Date("2026-10-17T04:45:00+05:00"),
  backArr: new Date("2026-10-17T05:35:00+03:00"),
};

const FLIGHTS = {
  out: {
    number:"SU 1502", carrier:"Аэрофлот", aircraft:"Airbus A320",
    fromCode:"SVO", fromCity:"Москва", fromExtra:"Шереметьево · B",
    toCode:"TJM", toCity:"Тюмень", toExtra:"Рощино",
    dep:T.outDep, arr:T.outArr, depLabel:"23:00", arrLabel:"03:45", duration:"2 ч 45 мин"
  },
  back: {
    number:"SU 1503", carrier:"Аэрофлот", aircraft:"Airbus A320",
    fromCode:"TJM", fromCity:"Тюмень", fromExtra:"Рощино",
    toCode:"SVO", toCity:"Москва", toExtra:"Шереметьево · B",
    dep:T.backDep, arr:T.backArr, depLabel:"04:45", arrLabel:"05:35", duration:"2 ч 50 мин"
  }
};

const TYPE_LABELS = {
  letter:"для тебя", hug:"объятие", photo:"наше фото", care:"позаботиться",
  memory:"вспомнить", "photo-task":"сохранить", voice:"услышать",
  route:"дорога", question:"выбрать", reason:"одна причина", gift:"для нас",
  anniversary:"наш день", five:"пять лет", home:"домой"
};

let view = {day:null,index:0,forced:false};
let renderedMoment="";
let rememberedMode="day";
let holdingNow=false;
const reducedMotion=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

let swipeX = 0;
let swipeY = 0;
let foregroundZone = "";

const GEO_ZONES = [
  {id:"rybinsk",lat:58.0500,lon:38.8333,radius:15000},
  {id:"svo",lat:55.97264,lon:37.41459,radius:5000},
  {id:"tjm",lat:57.16833,lon:65.31611,radius:5000},
  {id:"kurgan",lat:55.4500,lon:65.3333,radius:15000}
];

function nativeZone(){
  try{
    return window.TripNative?.getZone?.() || "";
  }catch(_){
    return "";
  }
}

function nativeHome(){
  try{
    return !!window.TripNative?.isHomeArrived?.();
  }catch(_){
    return false;
  }
}

function activeZone(){
  const native=nativeZone();
  return native && native!=="between" ? native : foregroundZone;
}

function haversine(lat1,lon1,lat2,lon2){
  const R=6371000;
  const rad=x=>x*Math.PI/180;
  const dLat=rad(lat2-lat1);
  const dLon=rad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+
    Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

function zoneFromCoords(lat,lon){
  let best="";
  let bestDistance=Infinity;
  for(const zone of GEO_ZONES){
    const distance=haversine(lat,lon,zone.lat,zone.lon);
    if(distance<=zone.radius && distance<bestDistance){
      best=zone.id;
      bestDistance=distance;
    }
  }
  return best;
}

function refreshForegroundLocation(){
  if(qa())return;
  if(window.TripNative) return;
  if(!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos=>{
      foregroundZone=zoneFromCoords(pos.coords.latitude,pos.coords.longitude);
      if(!view.forced) sync();
    },
    ()=>{},
    {enableHighAccuracy:false,timeout:7000,maximumAge:300000}
  );
}

function qa(){
  return new URLSearchParams(location.search).get("qa")==="1";
}

function now(){
  if(qa()){
    const stored = Number(localStorage.getItem("trip-qa-now"));
    if(Number.isFinite(stored) && stored>0) return new Date(stored);
  }
  return new Date();
}

function between(date,a,b){
  const t=date.getTime();
  return t>=a.getTime() && t<b.getTime();
}

function duration(ms){
  if(ms<=0) return "сейчас";
  const mins=Math.ceil(ms/60000);
  if(mins<60) return `${mins} мин`;
  const h=Math.floor(mins/60), m=mins%60;
  if(h<24) return m ? `${h} ч ${m} мин` : `${h} ч`;
  return `${Math.floor(h/24)} д ${h%24} ч`;
}

function tripClock(date=now()){
  const zone=date<T.outArr || date>=T.backArr ? "Europe/Moscow" : "Asia/Yekaterinburg";
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date).map(p=>[p.type,p.value]));
  return {year:Number(parts.year),month:Number(parts.month)-1,day:Number(parts.day),minutes:Number(parts.hour)*60+Number(parts.minute)};
}

function dayNumber(date=now()){
  const clock=tripClock(date);
  const y=clock.year,m=clock.month,d=clock.day;
  return y===2026 && m===9 && d>=10 && d<=17 ? d : null;
}

function dayLabel(day){
  if(day===16) return "16 октября · 5 лет";
  return day ? `${day} октября` : "10—17 октября";
}

function minutes(value){
  const [h,m]=value.split(":").map(Number);
  return h*60+m;
}

function unlocked(day,date=now()){
  const items=CONTENT.days[day]||[];
  if(!items.length) return -1;
  if(qa()) return items.length-1;

  const current=dayNumber(date);
  if(current===null){
    if(date<T.tripStart) return -1;
    if(date>T.backArr) return day===17 ? (localStorage.getItem("trip-home-arrived")==="1"?items.length-1:items.length-2) : items.length-1;
    return -1;
  }
  if(current>day) return items.length-1;
  if(current<day) return -1;

  const cur=tripClock(date).minutes;
  let last=-1;
  items.forEach((item,i)=>{if(item.trigger ? milestone(item.trigger) : (day!==11||milestone("kurgan"))&&minutes(item.time)<=cur) last=i;});
  if(day===17 && localStorage.getItem("trip-home-arrived")!=="1") last=Math.min(last,6);
  return last;
}

function milestone(id){
  try{if(window.TripNative?.hasMilestone?.(id))return true;}catch(_){}
  return localStorage.getItem(`trip-milestone-${id}`)==="1";
}

function phase(date=now()){
  const zone=activeZone();
  if(zone && localStorage.getItem("trip-zone")!==zone) saveShared("trip-zone",zone);
  if(date>=T.tripStart && date<T.backDep){
    if(["svo","tjm","kurgan"].includes(zone))localStorage.setItem("trip-milestone-departure","1");
    if(zone==="tjm"||zone==="kurgan")localStorage.setItem("trip-milestone-tjm","1");
    if(zone==="kurgan")localStorage.setItem("trip-milestone-kurgan","1");
  }

  if(nativeHome()){
    if(localStorage.getItem("trip-home-arrived")!=="1") saveShared("trip-home-arrived","1");
  }

  if(date<T.tripStart || (!qa() && !milestone("departure"))){
    return {
      mode:"before", date:"10—17 октября", status:"Рыбинск → Курган",
      from:"Рыбинск",to:"Курган",
      nextLabel:"до начала поездки",nextValue:duration(T.tripStart-date)
    };
  }

  // Пока самолёт по расписанию в воздухе, рейс важнее GPS/geofence.
  if(between(date,T.outDep,T.outArr)){
    return {
      mode:"flight",date:"SU 1502 · в полёте",status:"Москва → Тюмень",
      from:"SVO",to:"TJM",flight:FLIGHTS.out,
      nextLabel:"до посадки",nextValue:duration(T.outArr-date)
    };
  }

  if(between(date,T.backDep,T.backArr)){
    return {
      mode:"flight",date:"SU 1503 · в полёте",status:"Тюмень → Москва",
      from:"TJM",to:"SVO",flight:FLIGHTS.back,
      nextLabel:"до посадки",nextValue:duration(T.backArr-date)
    };
  }

  // Фактическая точка маршрута переопределяет предположение по времени.
  if(zone==="rybinsk"){
    if(date>=T.backArr || localStorage.getItem("trip-home-arrived")==="1"){
      return {
        mode:"home",date:"17 октября",status:"Рыбинск ♥",
        from:"Курган",to:"Рыбинск",
        nextLabel:"поездка",nextValue:"закончилась"
      };
    }
    return {
      mode:"road",date:dayLabel(dayNumber(date)),status:"Рыбинск",
      from:"Рыбинск",to:"Москва",
      nextLabel:"дальше",nextValue:"Москва → SVO"
    };
  }

  if(zone==="svo"){
    if(date<T.outDep){
      return {
        mode:"road",date:dayLabel(10),status:"Шереметьево · терминал B",
        from:"SVO",to:"TJM",
        nextLabel:"SU1502",nextValue:`23:00 · через ${duration(T.outDep-date)}`
      };
    }
    return {
      mode:"road",date:dayLabel(17),status:"Шереметьево ✓",
      from:"Москва",to:"Рыбинск",
      nextLabel:"последний участок",nextValue:"домой"
    };
  }

  if(zone==="tjm"){
    if(date<T.anniversary){
      return {
        mode:"road",date:dayLabel(11),status:"Тюмень",
        from:"Тюмень",to:"Курган",
        nextLabel:"дальше",nextValue:"Тюмень → Курган"
      };
    }
    return {
      mode:"road",date:dayLabel(dayNumber(date)||17),status:"Тюмень · дорога домой",
      from:"TJM",to:"SVO",
      nextLabel:"SU1503",nextValue:"04:45"
    };
  }

  if(zone==="kurgan" && date<T.backDep){
    const anniversary=dayNumber(date)===16;
    return {
      mode:anniversary?"anniversary":"day",
      date:anniversary?"16 октября · 5 лет":dayLabel(dayNumber(date)),
      status:anniversary?"наш день · Курган":"Курган",
      from:anniversary?"5 лет":"Курган",
      to:anniversary?"♥":"домой",
      nextLabel:anniversary?"до SU1503":"до дороги домой",
      nextValue:duration(T.backDep-date)
    };
  }

  // Fallback по расписанию, когда геолокация недоступна или между зонами.
  if(date<T.outDep){
    return {
      mode:"road",date:dayLabel(10),status:"дорога → Москва → SVO",
      from:"Рыбинск",to:"SVO",
      nextLabel:"рейс SU1502",nextValue:`23:00 · через ${duration(T.outDep-date)}`
    };
  }

  if(date<T.anniversary){
    const d=dayNumber(date);
    if(d===11){
      return {
        mode:"road",date:dayLabel(11),status:"Тюмень → Курган",
        from:"Тюмень",to:"Курган",
        nextLabel:"наземный участок",nextValue:"геолокация уточнит прибытие"
      };
    }
    return {
      mode:"day",date:dayLabel(d),status:"Курган",
      from:"Курган",to:"домой",
      nextLabel:"до дороги домой",nextValue:duration(T.backDep-date)
    };
  }

  if(date<T.backDep){
    const anniversary=dayNumber(date)===16;
    return {
      mode:anniversary?"anniversary":"road",
      date:anniversary?"16 октября · 5 лет":dayLabel(17),
      status:anniversary?"наш день · Курган":"Курган → Тюмень",
      from:anniversary?"5 лет":"Курган",to:anniversary?"♥":"Тюмень",
      nextLabel:"до SU1503",nextValue:duration(T.backDep-date)
    };
  }

  if(localStorage.getItem("trip-home-arrived")==="1"){
    return {
      mode:"home",date:"17 октября",status:"Рыбинск ♥",
      from:"Курган",to:"Рыбинск",
      nextLabel:"поездка",nextValue:"закончилась"
    };
  }

  return {
    mode:"road",date:"17 октября",status:"Москва → Рыбинск",
    from:"Москва",to:"Рыбинск",
    nextLabel:"последний участок",nextValue:"геолокация поймёт, когда дома"
  };
}

function toast(text){
  const el=$("toast");
  el.textContent=text;
  el.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>el.classList.remove("show"),1500);
}

function hug(){
  const count=Number(localStorage.getItem("trip-hugs")||0)+1;
  saveShared("trip-hugs",String(count));
  navigator.vibrate?.([18,24,34]);
  $("quickHug").animate?.(
    [{transform:"scale(1)"},{transform:"scale(1.18)"},{transform:"scale(1)"}],
    {duration:300,easing:"ease-out"}
  );
  toast("обнял ♥");
}

function renderPhase(date=now()){
  const p=phase(date);
  $("scene").dataset.mode=p.mode;
  $("scene").dataset.night=String(tripClock(date).minutes>=22*60 || tripClock(date).minutes<7*60);
  const progress=Math.max(0,Math.min(1,(date-T.tripStart)/(T.backArr-T.tripStart)));
  $("journeyProgress").style.width=`${Math.round(progress*100)}%`;
  $("sceneDate").textContent=p.date;
  $("sceneStatus").textContent=p.status;
  $("nextLabel").textContent=p.nextLabel;
  $("nextValue").textContent=p.nextValue;
  $("routeFrom").textContent=p.from;
  $("routeTo").textContent=p.to;
  return p;
}

function renderBefore(){
  $("momentNav").hidden=true;
  $("newMoment").hidden=true;
  $("scene").dataset.mode="before";
  $("media").hidden=true;
  $("media").innerHTML="";
  $("kicker").textContent="до поездки";
  $("title").textContent="Пока ты ещё дома";
  $("title").textContent="До встречи";
  $("text").textContent="";
  $("action").innerHTML="";
  $("qaPrompt").hidden=!qa();
  $("qaPrompt").textContent="До 10 октября здесь должна быть одна короткая твоя фраза. Без отдельного экрана подготовки.";
}

function flightMarkup(flight,date=now()){
  const total=flight.arr-flight.dep;
  const pct=Math.max(0,Math.min(1,(date-flight.dep)/total));
  return `
    <div class="flight">
      <div class="flight-head">
        <span>${flight.carrier} · ${flight.aircraft}</span>
        <strong>${flight.number}</strong>
      </div>
      <div class="flight-airports">
        <div class="airport">
          <small>${flight.fromCity}</small>
          <b>${flight.fromCode}</b>
          <small>${flight.fromExtra}</small>
        </div>
        <div class="flight-plane"><span class="bi-icon bi-airplane-fill" aria-hidden="true"></span></div>
        <div class="airport">
          <small>${flight.toCity}</small>
          <b>${flight.toCode}</b>
          <small>${flight.toExtra}</small>
        </div>
      </div>
      <div class="flight-times">
        <div><small>вылет · местное время</small><strong>${flight.depLabel}</strong></div>
        <div style="text-align:right"><small>прилёт · местное время</small><strong>${flight.arrLabel}</strong></div>
      </div>
      <div class="flight-progress"><span style="width:${Math.round(pct*100)}%"></span></div>
      <div class="flight-meta"><span>${flight.duration}</span><span>без пересадок</span></div>
    </div>`;
}

function renderFlight(p,date=now()){
  $("media").hidden=true;
  $("media").innerHTML="";
  $("kicker").textContent="сейчас";
  $("title").textContent="";
  $("text").textContent="";
  $("qaPrompt").hidden=true;
  $("momentNav").hidden=true;
  $("newMoment").hidden=true;
  $("action").innerHTML=flightMarkup(p.flight,date);
}

function setMoment(day,index,{forced=false}={}){
  const items=CONTENT.days[day]||[];
  if(!items[index]) return;
  view={day,index,forced};
  renderMoment();
}

function rememberMoment(){
  if(!qa() && view.day) saveShared("trip-last-moment",JSON.stringify({day:view.day,index:view.index}));
}

function renderMoment(){
  const item=CONTENT.days[view.day]?.[view.index];
  if(!item) return;
  $("sceneDate").textContent=dayLabel(view.day);
  $("sceneStatus").textContent=qa()?"Предпросмотр поездки":phase().status;

  const key=`${view.day}-${view.index}`;
  if(renderedMoment===key){$("scene").dataset.mode=rememberedMode;renderNavigation();renderNextMoment(view.day,view.index);return;}
  renderedMoment=key;
  rememberMoment();
  if(!reducedMotion()) $("sceneMain").animate?.([{opacity:.35,transform:"translateY(8px)"},{opacity:1,transform:"translateY(0)"}],{duration:320,easing:"ease-out"});
  const last=unlocked(view.day);
  const locked=!view.forced && view.index>last;
  const mode=item.type==="photo"?"photo":
             item.type==="hug"?"hug":
             item.type==="anniversary"||view.day===16?"anniversary":
             item.type==="route"?"road":"day";
  rememberedMode=mode;
  $("scene").dataset.mode=mode;

  $("kicker").textContent=locked?"позже":(TYPE_LABELS[item.type]||"для тебя");
  $("title").textContent=locked?"Ещё не время":item.title;

  const actual=Array.isArray(item.text)?item.text.filter(Boolean).join(" · "):(item.text||"");
  $("text").textContent=locked||item.type==="five"?"":actual;

  $("qaPrompt").hidden=!qa();
  $("qaPrompt").textContent=locked
    ? `Откроется в ${item.time}`
    : item.theme;

  renderMedia(item,locked);
  renderAction(item,locked);
  renderNextMoment(view.day,view.index);
  renderNavigation();
  const image=$("media").querySelector("img");
  if(image){image.tabIndex=0;image.setAttribute("role","button");image.setAttribute("aria-label","Рассмотреть фотографию");image.addEventListener("click",()=>openPhoto(image));image.addEventListener("keydown",e=>{if(e.key==="Enter") openPhoto(image);});}
}

function openPhoto(image){
  if(!image.complete || !image.naturalWidth) return;
  $("fullPhoto").src=image.src;$("fullPhoto").alt=image.alt;
  $("photoViewer").showModal();
}

function renderMedia(item,locked){
  const mount=$("media");
  mount.innerHTML="";
  mount.hidden=true;
  if(locked||!["photo","gift-photo"].includes(item.type)) return;
  if(item.type==="gift-photo" && localStorage.getItem(`trip-opened-${item.id}`)!=="1") return;

  if(Array.isArray(item.media)){
    mount.hidden=false;mount.classList.add("gallery-media");
    mount.innerHTML=`<div class="photo-gallery">${item.media.map(file=>`<img src="./assets/photos/${file}" alt="Фотография" tabindex="0">`).join("")}</div>`;
    mount.querySelectorAll("img").forEach(image=>image.addEventListener("click",()=>openPhoto(image)));return;
  }
  mount.classList.remove("gallery-media");
  const file=item.media;
  if(!file) return;

  mount.hidden=false;
  mount.innerHTML=qa()
    ? `<div class="media-placeholder"><strong>${item.theme}</strong></div><img src="./assets/photos/${file}" alt="" onload="this.previousElementSibling.style.display='none'" onerror="this.remove()">`
    : `<div class="photo-keepsake" aria-hidden="true"><span class="bi-icon bi-heart-fill"></span><span>наше маленькое место</span></div><img src="./assets/photos/${file}" alt="${item.title}" onload="this.previousElementSibling.hidden=true" onerror="this.remove()">`;
}

function renderAction(item,locked){
  const mount=$("action");
  mount.innerHTML="";
  if(locked) return;

  if(item.type==="gift-photo" || (item.type==="gift" && item.id===4)){
    if(localStorage.getItem(`trip-opened-${item.id}`)==="1")return;
    $("text").textContent="";
    mount.innerHTML='<button class="hold-button gift-hold" id="openGift" type="button"><span class="hold-ring"><span class="bi-icon bi-heart-fill" aria-hidden="true"></span></span><span><strong>Открыть подарок</strong><br><small>удерживай две секунды</small></span></button>';
    setupHold($("openGift"),()=>{localStorage.setItem(`trip-opened-${item.id}`,"1");renderedMoment="";renderMoment();});return;
  }
  if(item.type==="hug-seconds"){
    const key="trip-hug-seconds";
    const label=()=>{const t=Number(localStorage.getItem(key)||0);return t<60?`Обнимемся на ${t} сек.`:`Обнимемся на ${Math.floor(t/60)} мин ${t%60} сек.`};
    mount.innerHTML=`<button class="primary" id="hugSecond" type="button">Ещё секундочку ♥</button><p id="hugDuration" class="hug-duration"></p>`;
    $("hugDuration").textContent=label();$("hugSecond").addEventListener("click",()=>{saveShared(key,Number(localStorage.getItem(key)||0)+1);$("hugDuration").textContent=label();navigator.vibrate?.(15);});return;
  }
  if(item.type==="letter-kiss"){
    mount.innerHTML='<button class="primary" id="kissReply" type="button">Целую в ответ ♥</button>';
    $("kissReply").addEventListener("click",()=>{saveShared("trip-kiss-11",String(Number(localStorage.getItem("trip-kiss-11")||0)+1));toast("Целую ♥");});return;
  }
  if(item.type==="hug"){
    mount.innerHTML=`<button class="hold-button" id="momentHug" type="button"><span class="hold-ring"><span class="bi-icon bi-heart-fill" aria-hidden="true"></span></span><span><strong>Обнять меня</strong><br><small>удерживай две секунды</small></span></button>`;
    setupHold($("momentHug"));
    return;
  }

  if(item.type==="care"){
    const options=view.day===10?["Вода с собой","Телефон заряжен","Документы рядом"]:["Попить воды","Дать плечам отдохнуть","Минуту ничего не делать"];
    const key=`trip-care-${view.day}-${view.index}`;
    let checked=[];try{checked=JSON.parse(localStorage.getItem(key))||[];}catch(_){}
    mount.innerHTML=`<div class="care-list">${options.map((label,i)=>`<button type="button" aria-pressed="${checked.includes(i)}" data-care="${i}"><span class="bi-icon bi-check-circle-fill" aria-hidden="true"></span>${label}</button>`).join("")}</div>`;
    mount.querySelectorAll("[data-care]").forEach(button=>button.addEventListener("click",()=>{
      const i=Number(button.dataset.care);checked=checked.includes(i)?checked.filter(x=>x!==i):[...checked,i];
      saveShared(key,JSON.stringify(checked));button.setAttribute("aria-pressed",String(checked.includes(i)));
    }));return;
  }
  if(item.type==="photo-task" || (item.type==="memory" && view.day===17)){
    const key=`trip-keepsake-${view.day}-${view.index}`;
    mount.innerHTML=`<div class="keepsake"><label for="keepsakeInput">Одна деталь, которую хочется запомнить</label><textarea id="keepsakeInput" rows="2" maxlength="280" placeholder="Можно оставить здесь…"></textarea></div>`;
    const input=$("keepsakeInput");input.value=localStorage.getItem(key)||"";
    input.addEventListener("input",()=>saveShared(key,input.value));return;
  }
  if(item.type==="gift"){
    const key="trip-evening-coupon";
    mount.innerHTML=`<button class="coupon" id="coupon" type="button"><span class="bi-icon bi-house-heart-fill" aria-hidden="true"></span><strong>Один вечер для нас</strong><span>Без спешки · выберем вместе</span><small>${localStorage.getItem(key)?"Сохранён":"Нажми, чтобы сохранить"}</small></button>`;
    $("coupon").addEventListener("click",()=>{saveShared(key,"1");$("coupon").querySelector("small").textContent="Сохранён";});return;
  }
  if(item.type==="voice"){
    mount.innerHTML=`<div class="voice-box"><audio controls preload="metadata" src="./assets/audio/${item.media}"></audio></div>`;
    const audio=mount.querySelector("audio");
    const audioKey=`trip-audio-${item.media}`;
    audio.addEventListener("loadedmetadata",()=>{const position=Number(localStorage.getItem(audioKey));if(position>0 && position<audio.duration) audio.currentTime=position;});
    let lastSaved=0;
    audio.addEventListener("timeupdate",()=>{const t=audio.currentTime;localStorage.setItem(audioKey,String(t));if(Math.abs(t-lastSaved)>=10){lastSaved=t;window.TripSync?.record(audioKey,String(t));}});
    audio.addEventListener("pause",()=>window.TripSync?.record(audioKey,String(audio.currentTime)));
    audio.addEventListener("ended",()=>localStorage.removeItem(audioKey));
    audio.addEventListener("error",()=>{mount.innerHTML="";},{once:true});
    return;
  }

  if(item.type==="question"){
    const key=`trip-choice-${view.day}-${view.index}`;
    const selected=localStorage.getItem(key);
    mount.innerHTML=`<div class="choice-grid">${item.choices.map(choice=>
      `<button type="button" data-choice="${choice}" class="${selected===choice?"is-selected":""}">${choice}</button>`
    ).join("")}</div>`;
    mount.querySelectorAll("[data-choice]").forEach(btn=>btn.addEventListener("click",()=>{
      saveShared(key,btn.dataset.choice);
      renderAction(item,false);
      const responses={"поддержка":"Не нужно справляться идеально. Я на твоей стороне.","немного дома":"Мы с котами здесь. Твоё место ждёт тебя.","тишина":"Хорошо. Можно просто побыть здесь.","еда и кино":"План сохранён: спокойный вечер с едой и кино.","разговаривать":"План сохранён: вечер для наших разговоров.","лежать рядом":"План сохранён: просто быть рядом.","есть":"Сначала поесть. Остальное подождёт.","обниматься":"Сначала обниматься. Очень понятный план.","ничего не делать":"Ничего не делать вместе — тоже план."};
      toast(responses[btn.dataset.choice]||"Сохранено ♥");
    }));
    return;
  }

  if(item.type==="five"){
    const list=Array.isArray(item.text)?item.text:["","","","",""];
    mount.innerHTML=`<div class="five-list">${list.map((x,i)=>
      `<div class="five-item">${x||(qa()?`${i+1}. твой пункт`:`${i+1}`)}</div>`
    ).join("")}</div>`;
    return;
  }

  if(item.type==="route"){
    const f=view.day===10?FLIGHTS.out:view.day===17?FLIGHTS.back:null;
    if(f && (view.day===10 || view.index===0)){
      mount.innerHTML=flightMarkup(f);
    }else if(qa()){
      mount.innerHTML=`<div class="qa-note">${item.theme}</div>`;
    }
    return;
  }

  if(item.type==="home" && localStorage.getItem("trip-home-arrived")!=="1"){
    mount.innerHTML=`<button class="primary" id="homeBtn" type="button">я уже дома</button>`;
    $("homeBtn").addEventListener("click",()=>{
      saveShared("trip-home-arrived","1");
      view={day:17,index:7,forced:true};
      renderPhase();
      renderMoment();
      toast("дома ♥");
    });
  }
}

function renderNextMoment(day,index){
  const items=CONTENT.days[day]||[];
  const last=unlocked(day);
  const next=items[index+1];

  if(next && index<last){
    $("nextLabel").textContent="следующий открытый";
    $("nextValue").textContent=next.title;
    return;
  }

  if(next?.conditional==="home-arrived"){
    $("nextLabel").textContent="последний момент";
    $("nextValue").textContent="когда будешь дома";
    return;
  }

  if(next){
    $("nextLabel").textContent="следующее";
    $("nextValue").textContent=next.time;
    return;
  }

  if(day<17){
    $("nextLabel").textContent="на сегодня всё";
    $("nextValue").textContent=`${day+1} октября`;
  }
}

function sync(){
  const date=now();
  const p=renderPhase(date);

  if(p.mode==="before"){
    view={day:null,index:0,forced:false};
    renderedMoment="";renderBefore();
    return;
  }

  if(p.mode==="flight"){
    view={day:null,index:0,forced:false};
    renderedMoment="";renderFlight(p,date);
    return;
  }

  const day=dayNumber(date)||17;
  if(p.mode==="home"){
    view={day:17,index:7,forced:false};renderMoment();return;
  }
  if(view.day===day && (view.forced || renderedMoment)){
    renderMoment();return;
  }
  let idx=Math.max(0,unlocked(day,date));
  if(!qa()){
    try{const saved=JSON.parse(localStorage.getItem("trip-last-moment"));if(saved?.day===day && Number.isInteger(saved.index) && saved.index>=0 && saved.index<=idx) idx=saved.index;}catch(_){}
  }
  view={day,index:idx,forced:false};
  renderMoment();
}

function move(delta){
  if(!view.day) return;
  const target=view.index+delta;
  if(qa()){
    const days=Object.keys(CONTENT.days).map(Number),pos=days.indexOf(view.day);
    let day=view.day,index=target;
    if(target<0){if(pos===0)return;day=days[pos-1];index=CONTENT.days[day].length-1;}
    if(target>=CONTENT.days[day].length){if(pos===days.length-1)return;day=days[pos+1];index=0;}
    setMoment(day,index,{forced:true});return;
  }
  if(target<0||target>=CONTENT.days[view.day].length) return;
  const last=unlocked(view.day);
  if(!qa() && target>last) return;
  setMoment(view.day,target,{forced:true});
}

function setupHold(button,onComplete=hug){
  let frame=0,start=0,holding=false;
  const ring=button.querySelector(".hold-ring");
  function cancel(){holding=false;holdingNow=false;cancelAnimationFrame(frame);ring.style.setProperty("--hold",0);$("scene").style.setProperty("--embrace",0);button.classList.remove("is-holding");}
  function tick(time){
    if(!holding) return;
    const progress=Math.min(1,(time-start)/2000);
    ring.style.setProperty("--hold",progress);
    $("scene").style.setProperty("--embrace",progress);
    if(progress===1){cancel();onComplete();const hint=button.querySelector("small");if(hint)hint.textContent="Я рядом. Можно обнять ещё раз";}
    else frame=requestAnimationFrame(tick);
  }
  function begin(){if(holding) return;holding=true;holdingNow=true;button.classList.add("is-holding");start=performance.now();frame=requestAnimationFrame(tick);}
  button.addEventListener("pointerdown",e=>{if(e.button!==0) return;button.setPointerCapture(e.pointerId);begin();});
  for(const event of ["pointerup","pointercancel","lostpointercapture","blur"]) button.addEventListener(event,cancel);
  button.addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="Enter"){e.preventDefault();if(!e.repeat) begin();}});
  button.addEventListener("keyup",cancel);
}

function renderNavigation(){
  const nav=$("momentNav");
  nav.hidden=!view.day;
  $("prevMoment").disabled=qa()?view.day===10&&view.index===0:view.index===0;
  $("nextMoment").disabled=qa()?view.day===17&&view.index===CONTENT.days[17].length-1:view.index>=unlocked(view.day);
  $("newMoment").hidden=view.index>=unlocked(view.day);
  $("momentPosition").textContent=`${view.index+1} / ${CONTENT.days[view.day].length}`;
  $("homeConfirm").hidden=now()<T.backArr || localStorage.getItem("trip-home-arrived")==="1";
}

function setupSwipe(){
  $("sceneMain").addEventListener("touchstart",e=>{
    if(e.target.closest("button,audio,textarea,input,.photo-gallery")){swipeX=null;return;}
    const t=e.changedTouches[0];
    swipeX=t.clientX;swipeY=t.clientY;
  },{passive:true});
  $("sceneMain").addEventListener("touchmove",e=>{
    if(swipeX===null || reducedMotion()) return;
    const t=e.changedTouches[0],dx=t.clientX-swipeX,dy=t.clientY-swipeY;
    if(Math.abs(dx)<Math.abs(dy)*1.25) return;
    const canMove=dx>0?view.index>0:view.index<unlocked(view.day);
    document.querySelector(".copy").style.transform=`translateX(${Math.max(-45,Math.min(45,dx*(canMove?.25:.08)))}px)`;
  },{passive:true});
  $("sceneMain").addEventListener("touchcancel",()=>{document.querySelector(".copy").style.transform="";swipeX=null;},{passive:true});
  $("sceneMain").addEventListener("touchend",e=>{
    document.querySelector(".copy").style.transform="";
    const t=e.changedTouches[0];
    if(swipeX===null) return;
    const dx=t.clientX-swipeX,dy=t.clientY-swipeY;
    if(Math.abs(dx)<52||Math.abs(dx)<Math.abs(dy)*1.25) return;
    move(dx<0?1:-1);
  },{passive:true});
}

function handleIncoming(){
  const params=new URLSearchParams(location.search);
  const raw=params.get("surprise");
  const m=raw?.match(/^day-(\d+)-(\d+)$/);
  if(!m) return false;

  const day=Number(m[1]),index=Number(m[2]);
  if(!CONTENT.days[day]?.[index]) return false;

  view={day,index,forced:true};
  params.delete("surprise");
  const rest=params.toString();
  try{history.replaceState(null,"",location.pathname+(rest?"?"+rest:""));}catch(_){}
  renderPhase();
  renderMoment();
  return true;
}

function setupQa(){
  if(!qa()) return;
  $("qaButton").hidden=false;
  $("qaButton").addEventListener("click",openQa);
  $("qaClose").addEventListener("click",()=>$("qaSheet").close());
}

function qaMoment(day,index){
  const item=CONTENT.days[day][index];
  const zone=day===10?"+03:00":day===17&&index>0?"+03:00":"+05:00";
  localStorage.setItem("trip-qa-now",String(new Date(`2026-10-${String(day).padStart(2,"0")}T${item.time}:00${zone}`).getTime()));
  view={day,index,forced:true};
  renderPhase();renderMoment();openQa();
}

function openQa(){
  const day=view.day||dayNumber()||10;
  const index=view.index||0;
  const items=CONTENT.days[day];

  $("qaContent").innerHTML=`
    <span class="qa-badge">QA ONLY</span>
    <h2>Сцена</h2>
    <div class="qa-note">Сейчас: <strong>${now().toLocaleString("ru-RU")}</strong><br>${day}.10 · ${index+1}/${CONTENT.days[day].length}</div>
    <div class="qa-grid">
      ${[10,11,12,13,14,15,16,17].map(d=>`<button data-day="${d}" class="${d===day?"is-active":""}">${d}.10</button>`).join("")}
    </div>
    <div class="qa-actions">
      ${items.map((item,i)=>`<button data-slot="${i}">${i+1}. ${item.title}</button>`).join("")}
    </div>
    <div class="qa-actions">
      <button id="qaOut">SU1502 · полёт</button>
      <button id="qaBack">SU1503 · полёт</button>
      <button id="qaPush">push текущего</button>
      <button id="qaHome">дом / не дома</button>
      <button id="qaReal">реальное время</button>
    </div>`;

  if(!$("qaSheet").open) $("qaSheet").showModal();
  const root=$("qaContent");
  root.querySelectorAll("[data-day]").forEach(b=>b.addEventListener("click",()=>qaMoment(Number(b.dataset.day),0)));
  root.querySelectorAll("[data-slot]").forEach(b=>b.addEventListener("click",()=>qaMoment(day,Number(b.dataset.slot))));
  root.querySelector("#qaOut").addEventListener("click",()=>{
    localStorage.setItem("trip-qa-now",String(new Date("2026-10-10T23:50:00+03:00").getTime()));
    view={day:null,index:0,forced:false};sync();openQa();
  });
  root.querySelector("#qaBack").addEventListener("click",()=>{
    localStorage.setItem("trip-qa-now",String(new Date("2026-10-17T05:00:00+05:00").getTime()));
    view={day:null,index:0,forced:false};sync();openQa();
  });
  root.querySelector("#qaPush").addEventListener("click",()=>{
    if(window.TripQA?.notify && view.day){
      window.TripQA.notify(`day-${view.day}-${view.index}`);
      toast("push отправлен");
    }else toast("выбери момент");
  });
  root.querySelector("#qaHome").addEventListener("click",()=>{
    if(localStorage.getItem("trip-home-arrived")==="1") localStorage.removeItem("trip-home-arrived");
    else saveShared("trip-home-arrived","1");
    sync();openQa();
  });
  root.querySelector("#qaReal").addEventListener("click",()=>{
    localStorage.removeItem("trip-qa-now");
    view={day:null,index:0,forced:false};sync();openQa();
  });
}

function setup(){
  $("quickHug").addEventListener("click",()=>{
    if(!reducedMotion()) $("sceneMain").animate?.([{opacity:1},{opacity:.7},{opacity:1}],{duration:650});
    hug();
  });
  $("newMoment").addEventListener("click",()=>{if(view.day) setMoment(view.day,unlocked(view.day),{forced:true});});
  $("closePhoto").addEventListener("click",()=>$("photoViewer").close());
  $("photoViewer").addEventListener("click",e=>{if(e.target===$("photoViewer")) $("photoViewer").close();});
  setupSwipe();
  $("prevMoment").addEventListener("click",()=>move(-1));
  $("nextMoment").addEventListener("click",()=>move(1));
  $("homeConfirm").addEventListener("click",()=>{
    saveShared("trip-home-arrived","1");
    view={day:null,index:0,forced:false};sync();toast("Мы снова вместе ♥");
  });
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){sync();refreshForegroundLocation();}});
  setupQa();

  if(!handleIncoming()){if(qa())setMoment(10,0,{forced:true});else sync();}
  refreshForegroundLocation();

  setInterval(()=>{
    if(holdingNow) return;
    if(!view.forced || (!qa() && view.day!==dayNumber())) sync();
    else {renderPhase();if(view.day) renderMoment();}
  },30000);

  setInterval(refreshForegroundLocation,300000);

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
}

document.addEventListener("DOMContentLoaded",setup);
