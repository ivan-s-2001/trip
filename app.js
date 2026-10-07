const CONTENT = window.TRIP_CONTENT;
const $ = (id) => document.getElementById(id);

const CONFIG = {
  departure: new Date("2026-10-10T00:00:00+03:00"),
  returnFlight: new Date("2026-10-17T04:45:00+05:00"),
};

const FLIGHTS = {
  outbound: {
    flight:"SU 1502", carrier:"Аэрофлот", aircraft:"Airbus A320",
    from:"SVO Шереметьево · терминал B", to:"TJM Рощино",
    departure:"10 октября · 23:00", arrival:"11 октября · 03:45",
    duration:"2 ч 45 мин"
  },
  back: {
    flight:"SU 1503", carrier:"Аэрофлот", aircraft:"Airbus A320",
    from:"TJM Рощино", to:"SVO Шереметьево · терминал B",
    departure:"17 октября · 04:45", arrival:"17 октября · 05:35",
    duration:"2 ч 50 мин"
  }
};

const ROUTE = {
  outbound: [
    {icon:"⌂", title:"Рыбинск → Москва", meta:"Транспорт и время ещё добавить", unknown:true},
    {icon:"→", title:"Москва → Шереметьево", meta:"Терминал B · время трансфера ещё добавить", unknown:true},
    {icon:"✈", title:"SU 1502 · Москва → Тюмень", meta:"Аэрофлот · SVO B · 10 окт 23:00 → TJM 11 окт 03:45 · 2 ч 45 мин · Airbus A320"},
    {icon:"→", title:"Тюмень → Курган", meta:"Транспорт и время ещё добавить", unknown:true},
  ],
  back: [
    {icon:"→", title:"Курган → Тюмень", meta:"Транспорт и время ещё добавить", unknown:true},
    {icon:"✈", title:"SU 1503 · Тюмень → Москва", meta:"Аэрофлот · TJM 17 окт 04:45 → SVO B 05:35 · 2 ч 50 мин · Airbus A320"},
    {icon:"⌂", title:"Москва → Рыбинск", meta:"Транспорт и время после прилёта ещё добавить", unknown:true},
  ]
};

const TYPE_LABELS = {
  letter:"письмо", hug:"объятие", photo:"фотография", care:"забота",
  memory:"воспоминание", "photo-task":"маленький кадр", voice:"голос",
  route:"дорога", question:"для тебя", reason:"одна причина", gift:"после возвращения",
  anniversary:"наш день", five:"пять лет", home:"домой"
};

let view = { day:null, index:0, forced:false };
let touchStartX = 0;
let touchStartY = 0;

function isQa(){
  return new URLSearchParams(location.search).get("qa") === "1";
}

function now(){
  if(isQa()){
    const qa = Number(localStorage.getItem("trip-qa-now"));
    if(Number.isFinite(qa) && qa > 0) return new Date(qa);
  }
  return new Date();
}

function dayNumber(date = now()){
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  if(y === 2026 && m === 9 && d >= 10 && d <= 17) return d;
  return null;
}

function minutesNow(date = now()){
  return date.getHours() * 60 + date.getMinutes();
}

function parseMinutes(value){
  const [h,m] = value.split(":").map(Number);
  return h * 60 + m;
}

function unlockedIndex(day, date = now()){
  const moments = CONTENT.days[day] || [];
  if(!moments.length) return 0;
  if(isQa() && localStorage.getItem("trip-qa-unlock-all") === "1") return moments.length - 1;
  const currentDay = dayNumber(date);
  if(currentDay > day) return moments.length - 1;
  if(currentDay < day) return -1;
  let last = -1;
  for(let i=0;i<moments.length;i++){
    if(parseMinutes(moments[i].time) <= minutesNow(date)) last = i;
  }
  return last;
}

function routeState(date = now()){
  const t = date.getTime();
  const outDep = new Date("2026-10-10T23:00:00+03:00").getTime();
  const outArr = new Date("2026-10-11T03:45:00+05:00").getTime();
  const day12 = new Date("2026-10-12T00:00:00+05:00").getTime();
  const day16 = new Date("2026-10-16T00:00:00+05:00").getTime();
  const backDep = new Date("2026-10-17T04:45:00+05:00").getTime();
  const backArr = new Date("2026-10-17T05:35:00+03:00").getTime();

  if(t < new Date("2026-10-10T00:00:00+03:00").getTime())
    return {icon:"→", short:"Рыбинск → Курган", meta:"через Москву и Тюмень"};
  if(t < outDep)
    return {icon:"→", short:"Рыбинск → SVO", meta:"SU1502 · 23:00"};
  if(t < outArr)
    return {icon:"✈", short:"Москва → Тюмень", meta:"SU1502 · в пути"};
  if(t < day12)
    return {icon:"→", short:"Тюмень → Курган", meta:"наземный участок"};
  if(t < day16)
    return {icon:"♥", short:"Курган", meta:"командировка"};
  if(t < backDep)
    return {icon:"→", short:"Курган → Тюмень", meta:"к SU1503"};
  if(t < backArr)
    return {icon:"✈", short:"Тюмень → Москва", meta:"SU1503 · в пути"};
  if(localStorage.getItem("trip-home-arrived") === "1")
    return {icon:"♥", short:"Рыбинск", meta:"дома"};
  return {icon:"⌂", short:"Москва → Рыбинск", meta:"последний участок"};
}

function dayHeading(day){
  if(day === 10) return ["10 октября","Дорога начинается"];
  if(day === 11) return ["11 октября","Первый день далеко"];
  if(day === 12) return ["12 октября","Обычный день там"];
  if(day === 13) return ["13 октября","Уже не начало"];
  if(day === 14) return ["14 октября","Половина позади"];
  if(day === 15) return ["15 октября","Уже правда скоро"];
  if(day === 16) return ["16 октября · 5 лет","Наш день"];
  if(day === 17) return ["17 октября","Дорога домой"];
  return ["до поездки","Пока ты ещё дома"];
}

function showToast(text){
  const toast = $("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => toast.classList.remove("show"), 1600);
}

function openSheet(html){
  $("sheetContent").innerHTML = html;
  if(!$("sheet").open){
    try{ history.pushState({tripSheet:true},""); }catch(_){}
    $("sheet").showModal();
  }
}

function closeSheet(){
  if(!$("sheet").open) return;
  if(history.state?.tripSheet) history.back();
  else $("sheet").close();
}

function updateRouteUI(date = now()){
  const state = routeState(date);
  $("routeDot").textContent = state.icon;
  $("routeShort").textContent = state.short;
  $("routeDockMeta").textContent = state.meta;
}

function beforeTrip(date = now()){
  return date < CONFIG.departure;
}

function formatDuration(ms){
  if(ms <= 0) return "скоро";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if(days) return `${days} д ${hours} ч`;
  if(hours) return `${hours} ч ${mins} мин`;
  return `${Math.max(1,mins)} мин`;
}

function updateBefore(date = now()){
  const before = beforeTrip(date);
  $("beforeCard").hidden = !before;
  $("momentCard").hidden = before;
  $("momentNav").hidden = before;
  if(!before) return;
  const [eye,title] = dayHeading(null);
  $("dayEyebrow").textContent = eye;
  $("dayTitle").textContent = title;
  $("momentCounter").textContent = "—";
  $("nextKnown").textContent = "10 октября";
  $("beforeCountdown").textContent = formatDuration(CONFIG.departure - date);
}

function currentOrLatestIndex(day, date = now()){
  const last = unlockedIndex(day,date);
  return Math.max(0,last);
}

function setView(day,index,{forced=false}={}){
  const moments = CONTENT.days[day] || [];
  if(!moments.length) return;
  view.day = day;
  view.index = Math.max(0,Math.min(index,moments.length-1));
  view.forced = forced;
  renderDay();
}

function renderDay(){
  const day = view.day;
  if(!day) return;
  const moments = CONTENT.days[day];
  const moment = moments[view.index];
  const date = now();
  const unlocked = unlockedIndex(day,date);
  const locked = !view.forced && view.index > unlocked;
  const [eye,title] = dayHeading(day);

  $("dayEyebrow").textContent = eye;
  $("dayTitle").textContent = title;
  $("momentCounter").textContent = `${view.index+1}/8`;
  $("nextKnown").textContent = moment.time;
  $("momentCard").dataset.type = moment.type;
  $("momentType").textContent = TYPE_LABELS[moment.type] || "для тебя";
  $("momentTime").textContent = moment.time;
  $("momentTitle").textContent = locked ? "Ещё не время" : moment.title;

  renderMedia(moment,locked);
  renderCopy(moment,locked);
  renderAction(moment,locked);
  renderDots(day,unlocked);

  $("prevMoment").disabled = view.index <= 0;
  $("nextMoment").disabled = view.index >= moments.length-1 || (!isQa() && view.index >= unlocked);
}

function renderCopy(moment,locked){
  const text = $("momentText");
  const prompt = $("momentPrompt");

  if(locked){
    text.textContent = "";
    prompt.hidden = false;
    prompt.textContent = "Этот момент откроется позже сегодня.";
    return;
  }

  const actual = Array.isArray(moment.text) ? moment.text.filter(Boolean).join(" · ") : moment.text;
  text.textContent = actual || "";

  if(isQa() || !actual){
    prompt.hidden = false;
    prompt.textContent = moment.theme;
  }else{
    prompt.hidden = true;
    prompt.textContent = "";
  }
}

function renderMedia(moment,locked){
  const media = $("momentMedia");
  media.innerHTML = "";
  media.hidden = true;
  if(locked) return;

  if(moment.type === "photo"){
    media.hidden = false;
    const files = Array.isArray(moment.media) ? moment.media : [moment.media];
    const file = files[0];
    media.innerHTML = `
      <div class="media-placeholder"><strong>${isQa() ? moment.theme : "наша фотография"}</strong></div>
      ${file ? `<img src="./assets/photos/${file}" alt="" onerror="this.style.display='none'">` : ""}
    `;
  }
}

function renderAction(moment,locked){
  const mount = $("momentAction");
  mount.innerHTML = "";
  if(locked) return;

  if(moment.type === "hug"){
    mount.innerHTML = `
      <button class="hold-button" type="button">
        <span class="hold-ring"><span>♥</span></span>
        <span><strong>обнять</strong><br><small>удерживай</small></span>
      </button>`;
    setupHold(mount.querySelector(".hold-button"), mount.querySelector(".hold-ring"));
    return;
  }

  if(moment.type === "voice"){
    mount.innerHTML = `
      <div class="voice-box">
        ${isQa() ? `<p class="moment-prompt">Файл: ${moment.media}</p>` : ""}
        <audio controls preload="metadata" src="./assets/audio/${moment.media}"></audio>
      </div>`;
    return;
  }

  if(moment.type === "question"){
    const selected = localStorage.getItem(`trip-choice-${view.day}-${view.index}`);
    mount.innerHTML = `<div class="choice-grid">${moment.choices.map(choice =>
      `<button type="button" data-choice="${choice}" class="${selected===choice?"is-selected":""}">${choice}</button>`
    ).join("")}</div>`;
    mount.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click",()=>{
      localStorage.setItem(`trip-choice-${view.day}-${view.index}`,btn.dataset.choice);
      renderAction(moment,false);
      showToast("сохранил ♥");
    }));
    return;
  }

  if(moment.type === "five"){
    const items = Array.isArray(moment.text) ? moment.text : ["","","","",""];
    mount.innerHTML = `<div class="five-list">${items.map((item,i)=>
      `<div class="five-item">${item || (isQa() ? `${i+1}. твой пункт` : `${i+1}`)}</div>`
    ).join("")}</div>`;
    return;
  }

  if(moment.type === "route"){
    const flight = view.day === 10 ? FLIGHTS.outbound : view.day === 17 ? FLIGHTS.back : null;
    if(flight){
      mount.innerHTML = `
        <div class="route-mini">
          <strong>${flight.flight} · ${flight.carrier}</strong>
          <span>${flight.from} → ${flight.to}<br>${flight.departure} → ${flight.arrival} · ${flight.duration}<br>${flight.aircraft}</span>
        </div>`;
    }else{
      mount.innerHTML = `<button class="primary" type="button" id="momentRouteButton">посмотреть путь</button>`;
      mount.querySelector("#momentRouteButton")?.addEventListener("click",openRoute);
    }
    return;
  }

  if(moment.type === "home"){
    const home = localStorage.getItem("trip-home-arrived") === "1";
    if(!home){
      mount.innerHTML = `<button class="primary" type="button" id="markHomeButton">я уже дома</button>`;
      mount.querySelector("#markHomeButton")?.addEventListener("click",()=>{
        localStorage.setItem("trip-home-arrived","1");
        updateRouteUI();
        renderDay();
        showToast("домой ♥");
      });
    }
  }
}

function renderDots(day,unlocked){
  const moments = CONTENT.days[day];
  $("momentDots").innerHTML = moments.map((_,i)=>
    `<button class="moment-dot ${i===view.index?"is-active":""} ${i>unlocked&&!isQa()?"is-locked":""}" data-index="${i}" type="button" aria-label="Момент ${i+1}"></button>`
  ).join("");
  $("momentDots").querySelectorAll("[data-index]").forEach(dot => dot.addEventListener("click",()=>{
    const i = Number(dot.dataset.index);
    if(i > unlocked && !isQa()) return;
    setView(day,i);
  }));
}

function setupHold(button,ring){
  if(!button || !ring) return;
  let start = 0, raf = 0, complete = false;
  const duration = 1150;

  const reset = ()=>{
    cancelAnimationFrame(raf);
    ring.style.setProperty("--hold","0");
    start = 0;
    button.classList.remove("is-holding");
  };

  const tick = t =>{
    if(!start) return;
    const p = Math.min(1,(t-start)/duration);
    ring.style.setProperty("--hold",String(p));
    if(p >= 1){
      complete = true;
      localStorage.setItem("trip-hugs",String(Number(localStorage.getItem("trip-hugs")||0)+1));
      navigator.vibrate?.([25,35,45]);
      showToast("обнял ♥");
      reset();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  button.addEventListener("pointerdown",e=>{
    e.preventDefault();
    complete = false;
    button.classList.add("is-holding");
    start = performance.now();
    raf = requestAnimationFrame(tick);
  });
  ["pointerup","pointercancel","pointerleave"].forEach(type=>button.addEventListener(type,reset));
  button.addEventListener("click",e=>{
    if(e.detail===0 && !complete){
      localStorage.setItem("trip-hugs",String(Number(localStorage.getItem("trip-hugs")||0)+1));
      showToast("обнял ♥");
    }
    complete = false;
  });
}

function openArchive(){
  const a = CONTENT.archive;
  openSheet(`
    <p class="eyebrow">не разделы · просто наше</p>
    <h3>Мы</h3>

    <section class="sheet-section">
      <h4>12 фотографий</h4>
      <div class="archive-grid">
        ${a.photos.map((p,i)=>`
          <button class="archive-card" data-photo="${i}" type="button">
            <span>фото ${String(i+1).padStart(2,"0")}</span>
            <strong>${p.theme}</strong>
          </button>`).join("")}
      </div>
    </section>

    <section class="sheet-section">
      <h4>Открой, когда…</h4>
      <div class="archive-grid">
        ${a.letters.map((l,i)=>`
          <button class="archive-card" data-letter="${i}" type="button">
            <span>письмо</span><strong>${l.title}</strong>
          </button>`).join("")}
      </div>
    </section>

    <section class="sheet-section">
      <h4>Голос</h4>
      <div class="archive-grid">
        ${a.voices.map(v=>`
          <button class="archive-card" data-voice="${v.file}" data-theme="${v.theme}" type="button">
            <span>${v.day} октября</span><strong>${v.theme}</strong>
          </button>`).join("")}
      </div>
    </section>
  `);

  const root = $("sheetContent");
  root.querySelectorAll("[data-photo]").forEach(btn=>btn.addEventListener("click",()=>{
    const p = a.photos[Number(btn.dataset.photo)];
    openSheet(`
      <p class="eyebrow">фотография</p><h3>${p.theme}</h3>
      <div class="media-placeholder" style="min-height:260px"><strong>${isQa()?p.file:"наша фотография"}</strong></div>
      ${isQa()? `<p>${p.theme}</p>` : ""}
    `);
  }));
  root.querySelectorAll("[data-letter]").forEach(btn=>btn.addEventListener("click",()=>{
    const l = a.letters[Number(btn.dataset.letter)];
    openSheet(`<p class="eyebrow">открой, когда…</p><h3>${l.title.replace("Когда ","")}</h3><p>${isQa()?l.theme:""}</p>`);
  }));
  root.querySelectorAll("[data-voice]").forEach(btn=>btn.addEventListener("click",()=>{
    const file = btn.dataset.voice;
    openSheet(`<p class="eyebrow">голосовое</p><h3>${btn.dataset.theme}</h3><audio controls preload="metadata" src="./assets/audio/${file}" style="width:100%"></audio>`);
  }));
}

function routeLeg(leg){
  return `<article class="trip-leg">
    <span class="trip-leg-icon">${leg.icon}</span>
    <span class="trip-leg-copy">
      <strong>${leg.title}</strong>
      <span>${leg.meta}</span>
      ${leg.unknown?'<small>нужно дополнить</small>':""}
    </span>
  </article>`;
}

function openRoute(){
  const canMarkHome = dayNumber() === 17 && localStorage.getItem("trip-home-arrived") !== "1";
  openSheet(`
    <p class="eyebrow">вся дорога</p>
    <h3>Рыбинск → Курган → Рыбинск</h3>
    <h4>Туда</h4>
    ${ROUTE.outbound.map(routeLeg).join("")}
    <h4>Обратно</h4>
    ${ROUTE.back.map(routeLeg).join("")}
    ${canMarkHome ? '<button class="primary" id="sheetHomeButton" type="button">я уже дома</button>' : ""}
  `);
  $("sheetContent").querySelector("#sheetHomeButton")?.addEventListener("click",()=>{
    localStorage.setItem("trip-home-arrived","1");
    updateRouteUI();
    closeSheet();
    if(view.day===17){ view.index=7; view.forced=true; renderDay(); }
    showToast("домой ♥");
  });
}

function setupQa(){
  if(!isQa()) return;
  document.documentElement.classList.add("is-qa");
  $("qaButton").hidden = false;
  $("qaButton").addEventListener("click",openQa);
}

function setQaDate(day,hour=14,minute=0){
  const offset = day === 10 ? "+03:00" : day === 17 && hour >= 6 ? "+03:00" : "+05:00";
  const iso = `2026-10-${String(day).padStart(2,"0")}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00${offset}`;
  localStorage.setItem("trip-qa-now",String(new Date(iso).getTime()));
  view.forced = false;
  syncFromTime();
  openQa();
}

function sendQaPush(day,index){
  const key = `day-${day}-${index}`;
  if(window.TripQA?.notify){
    window.TripQA.notify(key);
    showToast("push отправлен");
  }else{
    showToast("нужен QA APK");
  }
}

function openQa(){
  const day = view.day || dayNumber() || 10;
  const moments = CONTENT.days[day];
  openSheet(`
    <div class="qa-panel">
      <span class="qa-badge">QA ONLY</span>
      <h3>Проверка Trip</h3>
      <div class="qa-status">Симуляция: <strong>${now().toLocaleString("ru-RU")}</strong><br>Текущий слот: <strong>${day} октября · ${view.index+1}/8</strong></div>
      <div class="qa-grid">
        ${[10,11,12,13,14,15,16,17].map(d=>`<button data-qa-day="${d}" class="${d===day?"is-active":""}" type="button">${d}.10</button>`).join("")}
      </div>
      <div class="qa-actions">
        ${moments.map((m,i)=>`<button data-qa-slot="${i}" type="button">${i+1}. ${m.title}</button>`).join("")}
      </div>
      <div class="qa-actions">
        <button id="qaPush" type="button">push этого слота</button>
        <button id="qaUnlock" type="button">${localStorage.getItem("trip-qa-unlock-all")==="1"?"закрыть будущие":"открыть все"}</button>
        <button id="qaRoute" type="button">маршрут</button>
        <button id="qaHome" type="button">переключить «дома»</button>
        <button id="qaReal" type="button">реальное время</button>
      </div>
    </div>
  `);
  const root = $("sheetContent");
  root.querySelectorAll("[data-qa-day]").forEach(btn=>btn.addEventListener("click",()=>setQaDate(Number(btn.dataset.qaDay))));
  root.querySelectorAll("[data-qa-slot]").forEach(btn=>btn.addEventListener("click",()=>{
    view.day=day;view.index=Number(btn.dataset.qaSlot);view.forced=true;renderDay();openQa();
  }));
  root.querySelector("#qaPush")?.addEventListener("click",()=>sendQaPush(day,view.index));
  root.querySelector("#qaUnlock")?.addEventListener("click",()=>{
    if(localStorage.getItem("trip-qa-unlock-all")==="1") localStorage.removeItem("trip-qa-unlock-all");
    else localStorage.setItem("trip-qa-unlock-all","1");
    renderDay();openQa();
  });
  root.querySelector("#qaRoute")?.addEventListener("click",openRoute);
  root.querySelector("#qaHome")?.addEventListener("click",()=>{
    if(localStorage.getItem("trip-home-arrived")==="1") localStorage.removeItem("trip-home-arrived");
    else localStorage.setItem("trip-home-arrived","1");
    updateRouteUI();renderDay();openQa();
  });
  root.querySelector("#qaReal")?.addEventListener("click",()=>{
    localStorage.removeItem("trip-qa-now");view.forced=false;syncFromTime();openQa();
  });
}

function handleIncomingMoment(){
  const params = new URLSearchParams(location.search);
  const key = params.get("surprise");
  const match = key?.match(/^day-(\d+)-(\d+)$/);
  if(!match) return false;
  const day = Number(match[1]);
  const index = Number(match[2]);
  if(CONTENT.days[day]?.[index]){
    view={day,index,forced:true};
    params.delete("surprise");
    const rest=params.toString();
    try{history.replaceState(null,"",location.pathname+(rest?"?"+rest:""));}catch(_){}
    return true;
  }
  return false;
}

function syncFromTime(){
  const date = now();
  updateRouteUI(date);
  updateBefore(date);
  if(beforeTrip(date)) return;

  const day = dayNumber(date) || 17;
  const last = currentOrLatestIndex(day,date);
  if(!view.forced || view.day !== day){
    view={day,index:last,forced:false};
  }
  renderDay();
}

function setupSwipe(){
  const card = $("momentCard");
  card.addEventListener("touchstart",e=>{
    const t=e.changedTouches[0];touchStartX=t.clientX;touchStartY=t.clientY;
  },{passive:true});
  card.addEventListener("touchend",e=>{
    const t=e.changedTouches[0];
    const dx=t.clientX-touchStartX,dy=t.clientY-touchStartY;
    if(Math.abs(dx)<55 || Math.abs(dx)<Math.abs(dy)*1.3) return;
    const unlocked=unlockedIndex(view.day);
    if(dx<0 && (isQa() || view.index<unlocked) && view.index<7) setView(view.day,view.index+1);
    if(dx>0 && view.index>0) setView(view.day,view.index-1);
  },{passive:true});
}

function setup(){
  $("sheetClose").addEventListener("click",closeSheet);
  $("sheet").addEventListener("click",e=>{if(e.target===$("sheet")) closeSheet();});
  window.addEventListener("popstate",()=>{if($("sheet").open) $("sheet").close();});

  $("archiveButton").addEventListener("click",openArchive);
  $("routeButton").addEventListener("click",openRoute);
  $("routeChip").addEventListener("click",openRoute);
  $("prevMoment").addEventListener("click",()=>setView(view.day,view.index-1));
  $("nextMoment").addEventListener("click",()=>setView(view.day,view.index+1));

  setupHold($("globalHugButton"),$("dockHeart"));
  setupSwipe();
  setupQa();

  const incoming=handleIncomingMoment();
  if(incoming){
    updateBefore(now());
    updateRouteUI(now());
    renderDay();
  }else{
    syncFromTime();
  }

  setInterval(()=>{
    if(!view.forced) syncFromTime();
    else updateRouteUI(now());
    if(beforeTrip()) updateBefore();
  },30000);

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
}

document.addEventListener("DOMContentLoaded",setup);
