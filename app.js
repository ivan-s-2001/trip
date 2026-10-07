const CONTENT = window.TRIP_CONTENT;
const $ = (id) => document.getElementById(id);

const TIMES = {
  tripStart: new Date("2026-10-10T00:00:00+03:00"),
  su1502Dep: new Date("2026-10-10T23:00:00+03:00"),
  su1502Arr: new Date("2026-10-11T03:45:00+05:00"),
  anniversary: new Date("2026-10-16T00:00:00+05:00"),
  su1503Dep: new Date("2026-10-17T04:45:00+05:00"),
  su1503Arr: new Date("2026-10-17T05:35:00+03:00"),
};

const FLIGHTS = {
  SU1502: {
    number:"SU 1502", carrier:"Аэрофлот", aircraft:"Airbus A320",
    fromCode:"SVO", fromCity:"Москва", fromExtra:"Шереметьево · B",
    toCode:"TJM", toCity:"Тюмень", toExtra:"Рощино",
    departure:TIMES.su1502Dep, arrival:TIMES.su1502Arr,
    departureLabel:"23:00", arrivalLabel:"03:45", duration:"2 ч 45 мин"
  },
  SU1503: {
    number:"SU 1503", carrier:"Аэрофлот", aircraft:"Airbus A320",
    fromCode:"TJM", fromCity:"Тюмень", fromExtra:"Рощино",
    toCode:"SVO", toCity:"Москва", toExtra:"Шереметьево · B",
    departure:TIMES.su1503Dep, arrival:TIMES.su1503Arr,
    departureLabel:"04:45", arrivalLabel:"05:35", duration:"2 ч 50 мин"
  }
};

const TYPE_LABELS = {
  letter:"письмо", hug:"объятие", photo:"фото", care:"забота",
  memory:"воспоминание", "photo-task":"момент", voice:"голос",
  route:"дорога", question:"выбор", reason:"одна причина", gift:"для нас",
  anniversary:"наш день", five:"5 лет", home:"домой"
};

let state = {day:null,index:0,forced:false};
let startX = 0;
let startY = 0;

function isQa(){
  return new URLSearchParams(location.search).get("qa") === "1";
}

function now(){
  if(isQa()){
    const forced = Number(localStorage.getItem("trip-qa-now"));
    if(Number.isFinite(forced) && forced > 0) return new Date(forced);
  }
  return new Date();
}

function pad(n){ return String(n).padStart(2,"0"); }

function dayNumber(date=now()){
  const y=date.getFullYear(), m=date.getMonth(), d=date.getDate();
  return y===2026 && m===9 && d>=10 && d<=17 ? d : null;
}

function localMinutes(date=now()){
  return date.getHours()*60+date.getMinutes();
}

function minutesOf(value){
  const [h,m]=value.split(":").map(Number);
  return h*60+m;
}

function unlockedIndex(day,date=now()){
  const moments=CONTENT.days[day]||[];
  if(!moments.length) return -1;
  if(isQa() && localStorage.getItem("trip-qa-unlock-all")==="1") return moments.length-1;

  const currentDay=dayNumber(date);
  if(currentDay===null){
    if(date<TIMES.tripStart) return -1;
    return day===17 ? moments.length-1 : -1;
  }
  if(currentDay>day) return moments.length-1;
  if(currentDay<day) return -1;

  let last=-1;
  const mins=localMinutes(date);
  moments.forEach((m,i)=>{ if(minutesOf(m.time)<=mins) last=i; });

  if(day===17 && localStorage.getItem("trip-home-arrived")!=="1"){
    last=Math.min(last,6);
  }
  return last;
}

function duration(ms){
  if(ms<=0) return "сейчас";
  const min=Math.ceil(ms/60000);
  if(min<60) return `${min} мин`;
  const h=Math.floor(min/60);
  const rest=min%60;
  if(h<24) return rest ? `${h} ч ${rest} мин` : `${h} ч`;
  const d=Math.floor(h/24);
  return `${d} д ${h%24} ч`;
}

function between(date,a,b){
  const t=date.getTime();
  return t>=a.getTime() && t<b.getTime();
}

function flightProgress(date,flight){
  const total=flight.arrival-flight.departure;
  const elapsed=date-flight.departure;
  return Math.max(0,Math.min(1,elapsed/total));
}

function tripPhase(date=now()){
  if(date<TIMES.tripStart){
    return {
      kicker:"поездка",
      title:"Рыбинск → Курган",
      meta:`старт 10 октября · через Москву и Тюмень`,
      progress:0,
      points:["Рыбинск","Москва","Тюмень","Курган"],
      footerKicker:"до начала поездки",
      footerValue:duration(TIMES.tripStart-date)
    };
  }

  if(date<TIMES.su1502Dep){
    return {
      kicker:"дорога туда",
      title:"Рыбинск → Москва → SVO",
      meta:`SU1502 · терминал B · вылет через ${duration(TIMES.su1502Dep-date)}`,
      progress:.24,
      points:["Рыбинск","Москва","SVO","Тюмень","Курган"],
      footerKicker:"следующий известный этап",
      footerValue:"SU1502 · 23:00"
    };
  }

  if(between(date,TIMES.su1502Dep,TIMES.su1502Arr)){
    const p=flightProgress(date,FLIGHTS.SU1502);
    return {
      kicker:"в полёте · SU1502",
      title:"Москва → Тюмень",
      meta:`посадка 03:45 · осталось ${duration(TIMES.su1502Arr-date)}`,
      progress:.34 + p*.22,
      points:["SVO","✈","TJM"],
      flight:"SU1502",
      footerKicker:"до посадки",
      footerValue:duration(TIMES.su1502Arr-date)
    };
  }

  if(date<TIMES.anniversary){
    const day=dayNumber(date);
    return {
      kicker: day===11 ? "после рейса" : "командировка",
      title: day===11 ? "Тюмень → Курган" : "Курган",
      meta: day===11 ? "наземный участок · время пока не задано" : `домой 17 октября · SU1503 04:45`,
      progress: day===11 ? .61 : .66,
      points: day===11 ? ["Тюмень","Курган"] : ["Курган","17.10","домой"],
      footerKicker: day===11 ? "следующий этап" : "до дороги домой",
      footerValue: day===11 ? "Тюмень → Курган" : duration(TIMES.su1503Dep-date)
    };
  }

  if(date<TIMES.su1503Dep){
    return {
      kicker: dayNumber(date)===16 ? "наш день · 5 лет" : "дорога домой",
      title: dayNumber(date)===16 ? "Курган · завтра домой" : "Курган → Тюмень",
      meta:"SU1503 · Тюмень 04:45 → Москва 05:35",
      progress:.72,
      points:["Курган","Тюмень","Москва","Рыбинск"],
      footerKicker:"до SU1503",
      footerValue:duration(TIMES.su1503Dep-date)
    };
  }

  if(between(date,TIMES.su1503Dep,TIMES.su1503Arr)){
    const p=flightProgress(date,FLIGHTS.SU1503);
    return {
      kicker:"в полёте · SU1503",
      title:"Тюмень → Москва",
      meta:`посадка 05:35 · осталось ${duration(TIMES.su1503Arr-date)}`,
      progress:.78+p*.13,
      points:["TJM","✈","SVO"],
      flight:"SU1503",
      footerKicker:"до посадки",
      footerValue:duration(TIMES.su1503Arr-date)
    };
  }

  if(localStorage.getItem("trip-home-arrived")==="1"){
    return {
      kicker:"дома",
      title:"Рыбинск ♥",
      meta:"поездка закончилась",
      progress:1,
      points:["Курган","Тюмень","Москва","Рыбинск"],
      footerKicker:"маршрут",
      footerValue:"завершён"
    };
  }

  return {
    kicker:"последний участок",
    title:"Москва → Рыбинск",
    meta:"после SVO · точное время пока не задано",
    progress:.93,
    points:["SVO","Москва","Рыбинск"],
    footerKicker:"следующий этап",
    footerValue:"домой"
  };
}

function renderJourney(date=now()){
  const phase=tripPhase(date);
  $("journey").dataset.flight=phase.flight?"true":"false";
  $("journeyKicker").textContent=phase.kicker;
  $("journeyTitle").textContent=phase.title;
  $("journeyMeta").textContent=phase.meta;
  $("journeyProgress").style.width=`${Math.round(phase.progress*100)}%`;
  $("journeyPoints").innerHTML=phase.points.map(p=>`<span>${p}</span>`).join("");
  $("footerKicker").textContent=phase.footerKicker;
  $("footerValue").textContent=phase.footerValue;
}

function heading(day){
  if(day===10) return "10 октября";
  if(day===11) return "11 октября";
  if(day===12) return "12 октября";
  if(day===13) return "13 октября";
  if(day===14) return "14 октября";
  if(day===15) return "15 октября";
  if(day===16) return "16 октября · 5 лет";
  if(day===17) return "17 октября";
  return "до поездки";
}

function showToast(text){
  const el=$("toast");
  el.textContent=text;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove("show"),1500);
}

function renderBefore(){
  $("momentCard").dataset.type="letter";
  $("momentKind").textContent="до поездки";
  $("momentPosition").textContent="—";
  $("momentTime").textContent="";
  $("momentDay").textContent="10 октября";
  $("momentTitle").textContent="Пока ты ещё дома";
  $("momentText").textContent="";
  $("qaPrompt").hidden=!isQa();
  $("qaPrompt").textContent="До 10 октября центральный экран остаётся спокойным. Здесь можно позже поставить одну короткую твою фразу перед поездкой.";
  $("momentMedia").hidden=true;
  $("momentAction").innerHTML="";
  $("swipeHint").hidden=true;
}

function setMoment(day,index,{forced=false}={}){
  const moments=CONTENT.days[day]||[];
  if(!moments.length) return;
  state={day,index:Math.max(0,Math.min(index,moments.length-1)),forced};
  renderMoment();
}

function renderMoment(){
  const moments=CONTENT.days[state.day]||[];
  const moment=moments[state.index];
  if(!moment) return;

  const unlocked=unlockedIndex(state.day);
  const locked=!state.forced && state.index>unlocked;

  $("momentCard").dataset.type=moment.type;
  $("momentKind").textContent=TYPE_LABELS[moment.type]||"для тебя";
  $("momentPosition").textContent=`${state.index+1} / 8`;
  $("momentTime").textContent=moment.time;
  $("momentDay").textContent=heading(state.day);
  $("momentTitle").textContent=locked?"Ещё не время":moment.title;

  renderMedia(moment,locked);
  renderCopy(moment,locked);
  renderAction(moment,locked);

  $("swipeHint").hidden=unlocked<=0;
}

function renderCopy(moment,locked){
  const text=$("momentText");
  const prompt=$("qaPrompt");

  if(locked){
    text.textContent="";
    prompt.hidden=false;
    prompt.textContent=`Откроется в ${moment.time}`;
    return;
  }

  const actual=Array.isArray(moment.text) ? moment.text.filter(Boolean).join(" · ") : (moment.text||"");
  text.textContent=actual;

  if(isQa()){
    prompt.hidden=false;
    prompt.textContent=moment.theme;
  }else{
    prompt.hidden=true;
    prompt.textContent="";
  }
}

function renderMedia(moment,locked){
  const mount=$("momentMedia");
  mount.innerHTML="";
  mount.hidden=true;
  if(locked || moment.type!=="photo") return;

  const file=Array.isArray(moment.media)?moment.media[0]:moment.media;
  if(!file) return;

  mount.hidden=false;
  mount.innerHTML=isQa()
    ? `<div class="media-placeholder"><strong>${moment.theme}</strong></div><img src="./assets/photos/${file}" alt="" onload="this.previousElementSibling.style.display='none'" onerror="this.remove()">`
    : `<img src="./assets/photos/${file}" alt="" onerror="this.parentElement.hidden=true;this.remove()">`;
}

function renderAction(moment,locked){
  const mount=$("momentAction");
  mount.innerHTML="";
  if(locked) return;

  if(moment.type==="hug"){
    mount.innerHTML=`
      <button class="hold-button" type="button">
        <span class="hold-ring"><span>♥</span></span>
        <span><strong>обнять</strong><br><small>удерживай</small></span>
      </button>`;
    setupHold(mount.querySelector(".hold-button"),mount.querySelector(".hold-ring"));
    return;
  }

  if(moment.type==="voice"){
    mount.innerHTML=`<div class="voice-box"><audio controls preload="metadata" src="./assets/audio/${moment.media}"></audio></div>`;
    return;
  }

  if(moment.type==="question"){
    const key=`trip-choice-${state.day}-${state.index}`;
    const selected=localStorage.getItem(key);
    mount.innerHTML=`<div class="choice-grid">${moment.choices.map(c=>`<button type="button" data-choice="${c}" class="${selected===c?"is-selected":""}">${c}</button>`).join("")}</div>`;
    mount.querySelectorAll("[data-choice]").forEach(btn=>btn.addEventListener("click",()=>{
      localStorage.setItem(key,btn.dataset.choice);
      renderAction(moment,false);
      showToast("сохранил ♥");
    }));
    return;
  }

  if(moment.type==="five"){
    const items=Array.isArray(moment.text)?moment.text:["","","","",""];
    mount.innerHTML=`<div class="five-list">${items.map((item,i)=>`<div class="five-item">${item||(isQa()?`${i+1}. твой пункт`:`${i+1}`)}</div>`).join("")}</div>`;
    return;
  }

  if(moment.type==="route"){
    const flight=state.day===10?FLIGHTS.SU1502:state.day===17?FLIGHTS.SU1503:null;
    if(flight){
      mount.innerHTML=flightCard(flight);
    }else if(isQa()){
      mount.innerHTML=`<div class="route-card"><strong>Наземный участок</strong><span>${moment.theme}</span></div>`;
    }
    return;
  }

  if(moment.type==="home"){
    const home=localStorage.getItem("trip-home-arrived")==="1";
    if(!home){
      mount.innerHTML=`<button class="primary" id="homeButton" type="button">я уже дома</button>`;
      $("homeButton")?.addEventListener("click",markHome);
    }
  }
}

function flightCard(flight){
  return `
    <div class="route-card">
      <div class="route-airports">
        <div><small>${flight.fromCity}</small><b>${flight.fromCode}</b><small>${flight.departureLabel}</small></div>
        <span class="route-plane">✈</span>
        <div style="text-align:right"><small>${flight.toCity}</small><b>${flight.toCode}</b><small>${flight.arrivalLabel}</small></div>
      </div>
      <strong>${flight.number}</strong>
      <span>${flight.carrier} · ${flight.aircraft} · ${flight.duration}<br>${flight.fromExtra} → ${flight.toExtra}</span>
    </div>`;
}

function markHome(){
  localStorage.setItem("trip-home-arrived","1");
  renderJourney();
  if(state.day===17){state.index=7;state.forced=true;renderMoment();}
  showToast("дома ♥");
}

function setupHold(button,ring){
  if(!button||!ring) return;

  let startedAt=0;
  let raf=0;
  let activePointer=null;
  let completed=false;
  const holdMs=950;

  const paint=(progress)=>{
    ring.style.setProperty("--hold",String(Math.max(0,Math.min(1,progress))));
  };

  const cleanup=()=>{
    cancelAnimationFrame(raf);
    raf=0;
    startedAt=0;
    button.classList.remove("is-holding");
    paint(0);
    if(activePointer!==null){
      try{ button.releasePointerCapture?.(activePointer); }catch(_){}
    }
    activePointer=null;
  };

  const finish=()=>{
    if(completed) return;
    completed=true;
    localStorage.setItem("trip-hugs",String(Number(localStorage.getItem("trip-hugs")||0)+1));
    paint(1);
    navigator.vibrate?.([22,32,46]);
    showToast("обнял ♥");
    button.classList.add("is-complete");
    setTimeout(()=>{
      button.classList.remove("is-complete");
      cleanup();
      completed=false;
    },240);
  };

  const frame=(time)=>{
    if(!startedAt || completed) return;
    const progress=(time-startedAt)/holdMs;
    paint(progress);
    if(progress>=1){
      finish();
      return;
    }
    raf=requestAnimationFrame(frame);
  };

  button.addEventListener("pointerdown",e=>{
    if(activePointer!==null) return;
    e.preventDefault();
    completed=false;
    activePointer=e.pointerId;
    try{ button.setPointerCapture?.(e.pointerId); }catch(_){}
    button.classList.add("is-holding");
    startedAt=performance.now();
    paint(0);
    raf=requestAnimationFrame(frame);
  });

  button.addEventListener("pointerup",e=>{
    if(activePointer!==e.pointerId) return;
    e.preventDefault();
    if(!completed) cleanup();
  });

  button.addEventListener("pointercancel",e=>{
    if(activePointer!==e.pointerId) return;
    if(!completed) cleanup();
  });

  button.addEventListener("lostpointercapture",()=>{
    if(!completed && startedAt) cleanup();
  });

  button.addEventListener("contextmenu",e=>e.preventDefault());

  button.addEventListener("keydown",e=>{
    if((e.key==="Enter"||e.key===" ") && !completed){
      e.preventDefault();
      finish();
    }
  });
}

function sync(){
  const date=now();
  renderJourney(date);

  if(date<TIMES.tripStart){
    state={day:null,index:0,forced:false};
    renderBefore();
    return;
  }

  // Во время реального перелёта рейс становится центральным состоянием всего экрана,
  // даже если полёт пересёк полночь или телефон ещё не сменил часовой пояс.
  if(between(date,TIMES.su1502Dep,TIMES.su1502Arr)){
    state={day:10,index:7,forced:true};
    renderMoment();
    return;
  }
  if(between(date,TIMES.su1503Dep,TIMES.su1503Arr)){
    state={day:17,index:0,forced:true};
    renderMoment();
    return;
  }

  const day=dayNumber(date)||17;
  if(state.forced && state.day===day){
    renderMoment();
    return;
  }

  const unlocked=unlockedIndex(day,date);
  state={day,index:Math.max(0,unlocked),forced:false};
  renderMoment();
}

function move(delta){
  if(!state.day) return;
  const unlocked=unlockedIndex(state.day);
  const next=state.index+delta;
  if(next<0 || next>7) return;
  if(!isQa() && next>unlocked) return;
  setMoment(state.day,next,{forced:isQa()&&state.forced});
}

function setupSwipe(){
  const card=$("momentCard");
  card.addEventListener("touchstart",e=>{
    const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY;
  },{passive:true});
  card.addEventListener("touchend",e=>{
    const t=e.changedTouches[0];
    const dx=t.clientX-startX,dy=t.clientY-startY;
    if(Math.abs(dx)<50 || Math.abs(dx)<Math.abs(dy)*1.25) return;
    move(dx<0?1:-1);
  },{passive:true});
}

function handleIncoming(){
  const params=new URLSearchParams(location.search);
  const raw=params.get("surprise");
  const match=raw?.match(/^day-(\d+)-(\d+)$/);
  if(!match) return false;

  const day=Number(match[1]),index=Number(match[2]);
  if(!CONTENT.days[day]?.[index]) return false;

  state={day,index,forced:true};
  params.delete("surprise");
  const rest=params.toString();
  try{history.replaceState(null,"",location.pathname+(rest?"?"+rest:""));}catch(_){}
  renderJourney();
  renderMoment();
  return true;
}

function setupQa(){
  if(!isQa()) return;
  $("qaButton").hidden=false;
  $("qaButton").addEventListener("click",openQa);
  $("qaClose").addEventListener("click",()=>$("qaSheet").close());
}

function qaSet(day,index=0){
  const moment=CONTENT.days[day][index];
  const zone=day===10?"+03:00":day===17&&index>0?"+03:00":"+05:00";
  const iso=`2026-10-${pad(day)}T${moment.time}:00${zone}`;
  localStorage.setItem("trip-qa-now",String(new Date(iso).getTime()));
  state={day,index,forced:true};
  renderJourney();renderMoment();openQa();
}

function openQa(){
  const day=state.day||dayNumber()||10;
  const idx=state.index||0;
  const moments=CONTENT.days[day];

  $("qaContent").innerHTML=`
    <span class="qa-badge">QA ONLY</span>
    <h2>Один экран</h2>
    <div class="qa-note">Симуляция: <strong>${now().toLocaleString("ru-RU")}</strong><br>Слот: <strong>${day}.10 · ${idx+1}/8</strong></div>
    <div class="qa-grid">
      ${[10,11,12,13,14,15,16,17].map(d=>`<button data-day="${d}" class="${d===day?"is-active":""}" type="button">${d}.10</button>`).join("")}
    </div>
    <div class="qa-actions">
      ${moments.map((m,i)=>`<button data-slot="${i}" type="button">${i+1}. ${m.title}</button>`).join("")}
    </div>
    <div class="qa-actions">
      <button id="qaFlightOut" type="button">SU1502 · в полёте</button>
      <button id="qaFlightBack" type="button">SU1503 · в полёте</button>
      <button id="qaPush" type="button">push этого слота</button>
      <button id="qaHome" type="button">домой / не дома</button>
      <button id="qaReal" type="button">реальное время</button>
    </div>`;

  if(!$("qaSheet").open) $("qaSheet").showModal();
  const root=$("qaContent");

  root.querySelectorAll("[data-day]").forEach(b=>b.addEventListener("click",()=>qaSet(Number(b.dataset.day),0)));
  root.querySelectorAll("[data-slot]").forEach(b=>b.addEventListener("click",()=>qaSet(day,Number(b.dataset.slot))));
  root.querySelector("#qaFlightOut")?.addEventListener("click",()=>{
    localStorage.setItem("trip-qa-now",String(new Date("2026-10-10T23:50:00+03:00").getTime()));
    state={day:10,index:7,forced:true};renderJourney();renderMoment();openQa();
  });
  root.querySelector("#qaFlightBack")?.addEventListener("click",()=>{
    localStorage.setItem("trip-qa-now",String(new Date("2026-10-17T05:00:00+05:00").getTime()));
    state={day:17,index:0,forced:true};renderJourney();renderMoment();openQa();
  });
  root.querySelector("#qaPush")?.addEventListener("click",()=>{
    if(window.TripQA?.notify){window.TripQA.notify(`day-${day}-${idx}`);showToast("push отправлен");}
    else showToast("нужен QA APK");
  });
  root.querySelector("#qaHome")?.addEventListener("click",()=>{
    if(localStorage.getItem("trip-home-arrived")==="1") localStorage.removeItem("trip-home-arrived");
    else localStorage.setItem("trip-home-arrived","1");
    renderJourney();openQa();
  });
  root.querySelector("#qaReal")?.addEventListener("click",()=>{
    localStorage.removeItem("trip-qa-now");
    state.forced=false;sync();openQa();
  });
}

function setup(){
  setupHold($("globalHugButton"),$("heartProgress"));
  setupSwipe();
  setupQa();

  if(!handleIncoming()) sync();

  setInterval(()=>{
    if(!state.forced) sync();
    else renderJourney();
  },30000);

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
}

document.addEventListener("DOMContentLoaded",setup);
