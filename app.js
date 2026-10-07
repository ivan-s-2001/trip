const CONTENT = window.TRIP_CONTENT;
const $ = (id) => document.getElementById(id);

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
let swipeX = 0;
let swipeY = 0;

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

function dayNumber(date=now()){
  const y=date.getFullYear(),m=date.getMonth(),d=date.getDate();
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
  if(qa() && localStorage.getItem("trip-qa-unlock-all")==="1") return 7;

  const current=dayNumber(date);
  if(current===null){
    if(date<T.tripStart) return -1;
    if(date>T.backArr) return day===17 ? (localStorage.getItem("trip-home-arrived")==="1"?7:6) : 7;
    return -1;
  }
  if(current>day) return 7;
  if(current<day) return -1;

  const cur=date.getHours()*60+date.getMinutes();
  let last=-1;
  items.forEach((item,i)=>{if(minutes(item.time)<=cur) last=i;});
  if(day===17 && localStorage.getItem("trip-home-arrived")!=="1") last=Math.min(last,6);
  return last;
}

function phase(date=now()){
  if(date<T.tripStart){
    return {
      mode:"before", date:"10—17 октября", status:"Рыбинск → Курган",
      from:"Рыбинск",to:"Курган",
      nextLabel:"до начала поездки",nextValue:duration(T.tripStart-date)
    };
  }

  if(date<T.outDep){
    return {
      mode:"road",date:dayLabel(10),status:"дорога → Москва → SVO",
      from:"Рыбинск",to:"SVO",
      nextLabel:"рейс SU1502",nextValue:`23:00 · через ${duration(T.outDep-date)}`
    };
  }

  if(between(date,T.outDep,T.outArr)){
    return {
      mode:"flight",date:"SU 1502 · в полёте",status:"Москва → Тюмень",
      from:"SVO",to:"TJM",flight:FLIGHTS.out,
      nextLabel:"до посадки",nextValue:duration(T.outArr-date)
    };
  }

  if(date<T.anniversary){
    const d=dayNumber(date);
    if(d===11){
      return {
        mode:"road",date:dayLabel(11),status:"Тюмень → Курган",
        from:"Тюмень",to:"Курган",
        nextLabel:"наземный участок",nextValue:"время ещё не задано"
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

  if(between(date,T.backDep,T.backArr)){
    return {
      mode:"flight",date:"SU 1503 · в полёте",status:"Тюмень → Москва",
      from:"TJM",to:"SVO",flight:FLIGHTS.back,
      nextLabel:"до посадки",nextValue:duration(T.backArr-date)
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
    nextLabel:"последний участок",nextValue:"домой"
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
  localStorage.setItem("trip-hugs",String(count));
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
  $("sceneDate").textContent=p.date;
  $("sceneStatus").textContent=p.status;
  $("nextLabel").textContent=p.nextLabel;
  $("nextValue").textContent=p.nextValue;
  $("routeFrom").textContent=p.from;
  $("routeTo").textContent=p.to;
  return p;
}

function renderBefore(){
  $("scene").dataset.mode="before";
  $("media").hidden=true;
  $("media").innerHTML="";
  $("kicker").textContent="до поездки";
  $("title").textContent="Пока ты ещё дома";
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
        <div class="flight-plane">✈</div>
        <div class="airport">
          <small>${flight.toCity}</small>
          <b>${flight.toCode}</b>
          <small>${flight.toExtra}</small>
        </div>
      </div>
      <div class="flight-times">
        <div><small>вылет</small><strong>${flight.depLabel}</strong></div>
        <div style="text-align:right"><small>прилёт</small><strong>${flight.arrLabel}</strong></div>
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
  $("action").innerHTML=flightMarkup(p.flight,date);
}

function setMoment(day,index,{forced=false}={}){
  const items=CONTENT.days[day]||[];
  if(!items[index]) return;
  view={day,index,forced};
  renderMoment();
}

function renderMoment(){
  const item=CONTENT.days[view.day]?.[view.index];
  if(!item) return;

  const last=unlocked(view.day);
  const locked=!view.forced && view.index>last;
  const mode=item.type==="photo"?"photo":
             item.type==="hug"?"hug":
             item.type==="anniversary"||view.day===16?"anniversary":
             item.type==="route"?"road":"day";
  $("scene").dataset.mode=mode;

  $("kicker").textContent=locked?"позже":(TYPE_LABELS[item.type]||"для тебя");
  $("title").textContent=locked?"Ещё не время":item.title;

  const actual=Array.isArray(item.text)?item.text.filter(Boolean).join(" · "):(item.text||"");
  $("text").textContent=locked?"":actual;

  $("qaPrompt").hidden=!qa();
  $("qaPrompt").textContent=locked
    ? `Откроется в ${item.time}`
    : item.theme;

  renderMedia(item,locked);
  renderAction(item,locked);
  renderNextMoment(view.day,view.index);
}

function renderMedia(item,locked){
  const mount=$("media");
  mount.innerHTML="";
  mount.hidden=true;
  if(locked||item.type!=="photo") return;

  const file=Array.isArray(item.media)?item.media[0]:item.media;
  if(!file) return;

  mount.hidden=false;
  mount.innerHTML=qa()
    ? `<div class="media-placeholder"><strong>${item.theme}</strong></div><img src="./assets/photos/${file}" alt="" onload="this.previousElementSibling.style.display='none'" onerror="this.remove()">`
    : `<img src="./assets/photos/${file}" alt="" onerror="this.parentElement.hidden=true;this.remove()">`;
}

function renderAction(item,locked){
  const mount=$("action");
  mount.innerHTML="";
  if(locked) return;

  if(item.type==="hug"){
    mount.innerHTML=`<button class="primary" id="momentHug" type="button">обнять меня ♥</button>`;
    $("momentHug").addEventListener("click",hug);
    return;
  }

  if(item.type==="voice"){
    mount.innerHTML=`<div class="voice-box"><audio controls preload="metadata" src="./assets/audio/${item.media}"></audio></div>`;
    return;
  }

  if(item.type==="question"){
    const key=`trip-choice-${view.day}-${view.index}`;
    const selected=localStorage.getItem(key);
    mount.innerHTML=`<div class="choice-grid">${item.choices.map(choice=>
      `<button type="button" data-choice="${choice}" class="${selected===choice?"is-selected":""}">${choice}</button>`
    ).join("")}</div>`;
    mount.querySelectorAll("[data-choice]").forEach(btn=>btn.addEventListener("click",()=>{
      localStorage.setItem(key,btn.dataset.choice);
      renderAction(item,false);
      toast("сохранил ♥");
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
    if(f){
      mount.innerHTML=flightMarkup(f);
    }else if(qa()){
      mount.innerHTML=`<div class="qa-note">${item.theme}</div>`;
    }
    return;
  }

  if(item.type==="home" && localStorage.getItem("trip-home-arrived")!=="1"){
    mount.innerHTML=`<button class="primary" id="homeBtn" type="button">я уже дома</button>`;
    $("homeBtn").addEventListener("click",()=>{
      localStorage.setItem("trip-home-arrived","1");
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
    renderBefore();
    return;
  }

  if(p.mode==="flight"){
    view={day:null,index:0,forced:false};
    renderFlight(p,date);
    return;
  }

  const day=dayNumber(date)||17;
  if(view.forced && view.day===day){
    renderMoment();
    return;
  }

  const idx=Math.max(0,unlocked(day,date));
  view={day,index:idx,forced:false};
  renderMoment();
}

function move(delta){
  if(!view.day) return;
  const target=view.index+delta;
  if(target<0||target>7) return;
  const last=unlocked(view.day);
  if(!qa() && target>last) return;
  setMoment(view.day,target,{forced:qa()&&view.forced});
}

function setupSwipe(){
  $("sceneMain").addEventListener("touchstart",e=>{
    const t=e.changedTouches[0];
    swipeX=t.clientX;swipeY=t.clientY;
  },{passive:true});
  $("sceneMain").addEventListener("touchend",e=>{
    const t=e.changedTouches[0];
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
    <div class="qa-note">Сейчас: <strong>${now().toLocaleString("ru-RU")}</strong><br>${day}.10 · ${index+1}/8</div>
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
    else localStorage.setItem("trip-home-arrived","1");
    sync();openQa();
  });
  root.querySelector("#qaReal").addEventListener("click",()=>{
    localStorage.removeItem("trip-qa-now");
    view={day:null,index:0,forced:false};sync();openQa();
  });
}

function setup(){
  $("quickHug").addEventListener("click",hug);
  setupSwipe();
  setupQa();

  if(!handleIncoming()) sync();

  setInterval(()=>{
    if(!view.forced) sync();
    else renderPhase();
  },30000);

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
}

document.addEventListener("DOMContentLoaded",setup);
