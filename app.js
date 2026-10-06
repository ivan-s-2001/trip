const CONFIG = {
  departure: new Date(2026, 9, 10, 0, 0, 0),
  returnDate: new Date(2026, 9, 17, 0, 0, 0),
  tripEnd: new Date(2026, 9, 18, 0, 0, 0),
};

const NOTES = [
  "Я уже скучаю, хотя ты ещё даже не уехала.",
  "Напоминаю: дома тебя очень сильно любят. Особенно один конкретный муж.",
  "Если сегодня было тяжело — считай, что я мысленно обнял тебя чуть крепче обычного.",
  "Я бы сейчас с удовольствием слушал даже то, как ты рассказываешь мне что-то, в чём я вообще ничего не понимаю.",
  "У нас с домом общее мнение: без тебя здесь как-то не так.",
  "Ты там, я здесь, а моё любимое место всё равно рядом с тобой.",
  "Пожалуйста, нормально поешь. Это официальное распоряжение мужа.",
  "Мне нравится мысль, что прямо сейчас время работает на нас и упрямо ведёт тебя обратно.",
  "Сегодняшнее напоминание: ты красивая. Даже если устала, не выспалась и споришь со мной.",
  "Я скучаю не только по большим вещам. Я скучаю по твоим обычным «ну Ива-а-ан».",
  "Если бы расстояние измерялось объятиями, я бы уже закрыл весь маршрут.",
  "Не забывай иногда останавливаться и отдыхать. Командировка закончится, а ты у меня одна.",
  "Я сохранил для тебя место рядом. Оно вообще-то всегда твоё.",
  "Сегодня до тебя уже ближе, чем было вчера. Этого достаточно, чтобы день стал хорошим.",
  "На всякий случай: я всё ещё очень тебя люблю. Проверка пройдена успешно.",
  "Пусть сегодня случится хотя бы одна маленькая вещь, которая заставит тебя улыбнуться.",
  "Я бы сейчас выбрал самый обычный вечер с тобой вместо любого очень интересного вечера без тебя.",
  "Не торопи время. Оно и так идёт в правильную сторону.",
  "Если тебе вдруг одиноко — открой любую нашу фотографию. Там мы всё ещё рядом.",
  "Представь, что это сообщение пришло вместе с чаем, пледом и моими объятиями.",
  "Я скучаю по тебе какой-то совершенно бытовой скукой. По голосу, шагам, вещам рядом. Значит, всё серьёзно.",
  "Тебя временно одолжил Барнаул. Но договор бессрочной аренды я не подписывал.",
  "Пусть командировка будет интересной. Только домой всё равно лучше.",
  "Я надеюсь, что ты сегодня хотя бы раз подумала обо мне. Я свою норму уже перевыполнил.",
  "Иногда неделя — это всего семь дней. А иногда — семь маленьких шагов обратно друг к другу.",
  "Я люблю, когда ты смеёшься так, что уже не можешь нормально говорить.",
  "Ничего важного: просто хотел снова сказать, что ты моя любимая женщина.",
  "Ты можешь открыть эту страницу хоть сто раз. На сто первый я всё равно буду тебя ждать.",
  "Здесь мог быть серьёзный текст, но вместо него: иди сюда, обниму. Да, через экран неудобно.",
  "По шкале от одного до десяти я скучаю примерно на «когда уже 17-е».",
  "Запомни сегодняшний день хотя бы ради того, что вечером до дома станет на сутки ближе.",
  "С тобой я понял, что самые хорошие воспоминания часто выглядят совсем обыкновенно.",
  "Я люблю тебя не праздничную. Я люблю тебя сонную, занятую, смешную, уставшую — всякую.",
  "Не знаю, что ты сейчас делаешь. Но надеюсь, в этот момент тебе тепло.",
  "Мысленно поправил тебе волосы и поцеловал в лоб. Продолжай заниматься своими делами.",
  "Ты обязательно вернёшься. А я обязательно сделаю вид, что не считал каждый день.",
  "Мне очень нравится наше «вместе». Даже когда между нами несколько тысяч километров.",
  "Сегодня я скучаю по твоему голосу чуть больше, чем вчера. Непорядок.",
  "Если ты сейчас улыбаешься экрану — всё, моя задача на сегодня выполнена.",
  "Возвращайся не быстрее. Возвращайся спокойно. Я всё равно буду ждать столько, сколько надо.",
  "Мне не нужно идеальное путешествие. Мне нужно, чтобы ты вернулась довольная и целая.",
  "Пусть у тебя там будет много хорошего, чтобы потом было что рассказывать мне дома.",
  "В доме сейчас временно отсутствует главный источник уюта. Просим вернуть 17 октября.",
  "Я не хочу, чтобы ты грустила. Но если будешь — грусти недолго, я уже иду тебе навстречу во времени.",
  "Если есть хоть одна вещь, которую ты сегодня сделала хорошо — пожалуйста, похвали себя за неё.",
  "Ты для меня всё ещё то самое «как же мне повезло», только уже привычное и родное.",
  "Смешно, но я заранее знаю, что после твоего возвращения буду ценить первые пять минут рядом особенно сильно.",
  "Возможно, это самое бесполезное приложение на свете. Зато оно целиком про тебя.",
  "Твоя задача на сегодня: вернуться в этот день вечером и заметить, что таймер стал меньше.",
  "Я тебя люблю. Без сложной формулировки. Просто так.",
  "Пусть этот сайт будет маленьким доказательством, что я думал о тебе ещё до того, как начал скучать.",
  "Ты не обязана скучать каждую минуту. Живи, смейся, работай. Я поскучаю за двоих.",
  "Если вдруг всё бесит — разрешаю официально закрыть всё, завернуться в одеяло и написать мужу.",
  "Каждая наша фотография здесь — маленькое «мы были, мы есть, мы ещё будем».",
  "Мне нравится, что у нас есть свои глупости, которые вообще никому больше не надо объяснять.",
  "Дома тебя ждут. Без дедлайнов, без задач, без командировок.",
  "Надеюсь, ты сегодня увидишь что-нибудь красивое и захочешь потом показать это мне.",
  "Ты — мой любимый человек. Иногда всё действительно помещается в одну фразу.",
  "Здесь нет кнопки «вернуть жену сейчас». Я проверял.",
  "Ещё одна записка означает ещё одну маленькую причину вернуться сюда завтра.",
  "Спойлер: в конце этой недели я всё равно получаю тебя обратно.",
];

const MEMORIES = [
  {src:"01.jpg", title:"Тот самый хороший день", caption:"Добавь сюда историю, которую понимаете только вы двое."},
  {src:"02.jpg", title:"Здесь ты очень красивая", caption:"Да, даже если сама с этим не согласна."},
  {src:"03.jpg", title:"Обычный вечер", caption:"Именно по таким вещам потом скучаешь сильнее всего."},
  {src:"04.jpg", title:"А тут было смешно", caption:"Место для вашего внутреннего прикола."},
  {src:"05.jpg", title:"Моё любимое «мы»", caption:"Без постановки. Без идеальности. Просто мы."},
  {src:"06.jpg", title:"Вот этот кадр", caption:"Который я почему-то могу пересматривать бесконечно."},
  {src:"07.jpg", title:"Дом — это ты", caption:"Пускай фотография сама объяснит почему."},
  {src:"08.jpg", title:"Ещё один день в копилку", caption:"Из тех, которые сначала обычные, а потом становятся важными."},
  {src:"09.jpg", title:"Твоё лицо, когда…", caption:"Здесь особенно нужна ваша настоящая подпись."},
  {src:"10.jpg", title:"Никуда не торопимся", caption:"Хочу ещё много таких спокойных дней рядом."},
  {src:"11.jpg", title:"Смешные — тоже любимые", caption:"Особенно смешные, если честно."},
  {src:"12.jpg", title:"Тот момент", caption:"Который невозможно нормально объяснить другим людям."},
  {src:"13.jpg", title:"И снова ты", caption:"Я предупреждал, что это сайт про тебя."},
  {src:"14.jpg", title:"Наш маленький архив", caption:"Чтобы не потерять ощущение того дня."},
  {src:"15.jpg", title:"До следующей фотографии", caption:"Которую мы сделаем уже после твоего возвращения."},
  {src:"16.jpg", title:"Продолжение следует", caption:"Самое важное здесь ещё не случилось."},
];

const DAYS = [
  {date:"10 октября", title:"На дорожку", text:"Ну вот. Ты уехала. Я официально начинаю скучать и одновременно считать в обратную сторону. Не думай обо мне слишком много — лучше нормально доберись, поешь, устройся и напиши, что всё хорошо. А я здесь. Я никуда не делся."},
  {date:"11 октября", title:"Первое утро далеко", text:"Первое утро — обычно самое странное. Вроде всего один день, а привычного «мы рядом» уже не хватает. Пусть сегодня у тебя будет спокойный день. И пожалуйста, найди что-нибудь вкусное."},
  {date:"12 октября", title:"Просто напомнить", text:"Ты справляешься. И даже если командировка окажется утомительной, дома никто не ждёт от тебя подвигов. Мне нужна просто ты — довольная, живая, немного уставшая и снова рядом."},
  {date:"13 октября", title:"Почти середина", text:"Смотри: часть дороги уже позади. Мы почти дошли до той точки, где правильнее говорить не «ты недавно уехала», а «ты уже скоро вернёшься». Мне нравится второй вариант гораздо больше."},
  {date:"14 октября", title:"Мы уже ближе", text:"Сегодня расстояние ощущается немного иначе. Потому что впереди осталось меньше, чем позади. Я приготовил тебе дома запас разговоров, объятий и бытовых мелочей, по которым неожиданно успел соскучиться."},
  {date:"15 октября", title:"Осталось совсем чуть-чуть", text:"Если сегодня будет длинный день — просто не торопи его. Пусть закончится сам. Завтра будет последний полноценный день этой поездки, а потом — домой."},
  {date:"16 октября", title:"Последняя ночь", text:"Завтра. Вот и весь текст, который здесь действительно нужен. Завтра ты возвращаешься. Спокойно собирай вещи, ничего не забудь и оставь Барнаулу только хорошие воспоминания."},
  {date:"17 октября", title:"Сегодня", text:"Семь дней закончились. Возвращайся ко мне. Я очень по тебе скучал и больше ничего умного сейчас писать не хочу."},
];

const LETTERS = [
  {title:"…соскучишься по мне", text:"Я тоже скучаю. Скорее всего, в этот самый момент. Поэтому считай, что мы просто синхронно думаем друг о друге. Закрой глаза на несколько секунд и представь, что я рядом. Этого пока недостаточно, но до 17 октября хватит."},
  {title:"…будет тяжёлый день", text:"Не нужно быть сильной каждую минуту. Сделай паузу, выдохни, поешь, попей воды, пожалуйся мне, если хочется. Плохой день не делает плохой всю поездку. Завтра будет другой."},
  {title:"…не сможешь уснуть", text:"Представь самый обычный вечер дома. Никакого праздника. Просто мы рядом, можно никуда не спешить и уже не нужно считать километры. Скоро именно так и будет."},
  {title:"…будет скучно", text:"Задание: найди сегодня одну вещь, которую ты раньше никогда не замечала, сфотографируй её и потом покажи мне. Всё. Теперь у тебя маленький квест от мужа."},
  {title:"…захочется домой", text:"Дом никуда не делся. Твои вещи на месте, твоё место рядом со мной тоже. Просто сейчас между вами несколько дней пути. И с каждым вечером их становится меньше."},
  {title:"…захочется улыбнуться", text:"Вспомни самую глупую нашу фотографию. Да, именно ту. А теперь представь, что я всерьёз хотел поставить её на первый экран этого сайта. Возможно, ещё поставлю."},
  {title:"…останется один день", text:"Ты почти дома. Не спеши прожить последние часы командировки — просто знай, что здесь уже очень ждут завтрашний день."},
  {title:"…будешь ехать обратно", text:"Вот теперь можно. Ты действительно возвращаешься. Спасибо времени, самолётам, дорогам и вообще всему, что везёт тебя в мою сторону. До встречи, любимая."},
];

const REASONS = [
  "За то, как ты смеёшься, когда уже невозможно остановиться.",
  "За ощущение дома, которое появляется просто потому, что ты рядом.",
  "За твою заботу — даже когда она маскируется под ворчание.",
  "За все наши глупые фразы, которые никому больше не нужно понимать.",
  "За то, что с тобой обычный день не кажется потраченным зря.",
  "За твою красоту — особенно в моменты, когда ты сама о ней не думаешь.",
  "За способность быть серьёзной и совершенно несерьёзной почти одновременно.",
  "За то, что мне хочется рассказывать тебе вещи первым.",
  "За наши планы, даже самые маленькие и бытовые.",
  "За то, что после любого «далеко» всё равно есть наше «домой».",
  "За тебя настоящую, а не только удобную, весёлую или праздничную.",
  "И ещё за тысячу вещей, которые невозможно аккуратно разложить по карточкам.",
];

const RANDOM_MEMORIES = [
  "Вспомни наш день, когда мы вообще ничего особенного не планировали, а получилось хорошо. Я люблю такие дни больше громких событий.",
  "Открой в телефоне фотографии и долистай до случайного месяца. Первая наша фотография, которую увидишь, — сегодняшнее воспоминание.",
  "Помнишь момент, когда мы смеялись над чем-то совершенно несмешным для остальных? Вот именно ради таких вещей я люблю наше «мы».",
  "Сегодняшнее воспоминание — не фотография. Это момент, когда ты заходишь домой, и я понимаю по звуку двери, что это ты.",
  "Вспомни первое блюдо, которое мы вместе обсуждали дольше, чем оно того заслуживало. Да, это тоже часть семейной истории.",
  "Вспомни одну нашу поездку, где что-то пошло не по плану. Почему-то именно такие моменты потом рассказываются лучше всего.",
  "Выбери одну фотографию, где мы оба неидеальные. Скорее всего, она живее большинства идеальных кадров.",
  "Сегодня я хочу сохранить простую вещь: как хорошо просто молчать рядом с тобой и не чувствовать, что тишину надо чем-то заполнять.",
  "Вспомни нашу самую нелепую переписку. Я уверен, там уже есть материал для семейного архива.",
  "Представь первый обычный вечер после твоего возвращения. Не встречу, не праздник — просто вечер. Я уже его жду.",
];

const $ = (id) => document.getElementById(id);
const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
const now = () => new Date();

function stateFor(date = now()) {
  if (date < CONFIG.departure) return "before";
  if (date < CONFIG.returnDate) return "away";
  if (date < CONFIG.tripEnd) return "return";
  return "after";
}

function updateCountdown() {
  const current = now();
  const state = stateFor(current);
  const target = state === "before" ? CONFIG.departure : CONFIG.returnDate;
  let diff = Math.max(0, target - current);
  if (state === "after") diff = 0;
  const seconds = Math.floor(diff / 1000);
  $("days").textContent = pad(seconds / 86400);
  $("hours").textContent = pad((seconds % 86400) / 3600);
  $("minutes").textContent = pad((seconds % 3600) / 60);
  $("seconds").textContent = pad(seconds % 60);

  const title = document.title;
  if (state === "before") {
    $("heroEyebrow").textContent = "До 10 октября";
    $("heroTitle").innerHTML = "До грустного<br><em>момента</em>";
    $("heroLead").textContent = "Но это всего на неделю. А потом каждый день будет вести тебя обратно домой.";
    $("countdownKicker").textContent = "осталось до поездки";
    document.title = "До грустного момента";
    $("tripProgressWrap").hidden = true;
  } else if (state === "away") {
    $("heroEyebrow").textContent = "10—17 октября · Барнаул";
    $("heroTitle").innerHTML = "До твоего<br><em>возвращения</em>";
    $("heroLead").textContent = "Барнаул временно забрал тебя у меня. Но теперь таймер идёт в правильную сторону.";
    $("countdownKicker").textContent = "осталось до дома";
    document.title = "Возвращайся скорее ♥";
    $("tripProgressWrap").hidden = false;
  } else if (state === "return") {
    $("heroEyebrow").textContent = "17 октября · сегодня";
    $("heroTitle").innerHTML = "Сегодня ты<br><em>возвращаешься</em>";
    $("heroLead").textContent = "Семь дней закончились. Осталось просто добраться домой.";
    $("countdownKicker").textContent = "сегодня";
    document.title = "Сегодня ♥";
    $("tripProgressWrap").hidden = false;
  } else {
    $("heroEyebrow").textContent = "10—17 октября 2026";
    $("heroTitle").innerHTML = "Ты уже<br><em>дома</em>";
    $("heroLead").textContent = "Эта маленькая страница остаётся здесь как память о семи днях, когда расстояние каждый день становилось короче.";
    $("countdownKicker").textContent = "мы пережили эту командировку";
    document.title = "Ты дома ♥";
    $("tripProgressWrap").hidden = false;
  }
  if (title !== document.title) document.documentElement.dataset.state = state;
  updateProgress(current, state);
  updateFinale(state);
}

function updateProgress(current, state) {
  if (state === "before") return;
  const total = CONFIG.returnDate - CONFIG.departure;
  const elapsed = Math.min(Math.max(current - CONFIG.departure, 0), total);
  const pct = total ? Math.round((elapsed / total) * 100) : 100;
  const day = Math.min(7, Math.max(1, Math.floor(elapsed / 86400000) + 1));
  $("progressBar").style.width = `${pct}%`;
  $("progressPercent").textContent = `${pct}%`;
  $("progressLabel").textContent = state === "after" ? "Все 7 дней позади" : state === "return" ? "Сегодня домой" : `День ${day} из 7`;
}

function pickNote() {
  let history = JSON.parse(localStorage.getItem("trip-note-history") || "[]");
  const available = NOTES.map((_, i) => i).filter(i => !history.includes(i));
  const pool = available.length ? available : NOTES.map((_, i) => i);
  const index = pool[Math.floor(Math.random() * pool.length)];
  history = [index, ...history.filter(i => i !== index)].slice(0, 8);
  localStorage.setItem("trip-note-history", JSON.stringify(history));
  $("dailyNote").textContent = NOTES[index];
}

function registerVisit() {
  const key = "trip-visits";
  const visits = Number(localStorage.getItem(key) || 0) + 1;
  localStorage.setItem(key, visits);
  $("visitNumber").textContent = `№${visits}`;
}

function renderMemories() {
  $("memoryGrid").innerHTML = MEMORIES.map((m,i) => `
    <button class="memory-card reveal" data-memory="${i}" aria-label="Открыть воспоминание: ${m.title}">
      <div class="memory-fallback"><strong>ваша фотография ${String(i+1).padStart(2,"0")}</strong></div>
      <img src="./assets/photos/${m.src}" alt="${m.title}" loading="lazy" onerror="this.style.display='none'" />
      <div class="memory-caption"><strong>${m.title}</strong><span>${m.caption}</span></div>
    </button>`).join("");
}

function availableDayIndex(date = now()) {
  if (date < CONFIG.departure) return -1;
  const raw = Math.floor((date - CONFIG.departure) / 86400000);
  return Math.min(DAYS.length - 1, Math.max(0, raw));
}

function renderDays() {
  const openUntil = availableDayIndex();
  $("daysGrid").innerHTML = DAYS.map((d,i) => {
    const locked = i > openUntil;
    const isToday = i === openUntil && stateFor() !== "after";
    return `<button class="day-card reveal ${locked ? "is-locked" : ""} ${isToday ? "is-today" : ""}" data-day="${i}" ${locked ? "disabled" : ""}>
      <div><small>${locked ? "пока закрыто" : d.date}</small><div class="day-number">${10+i}</div></div>
      <h3>${locked ? "Ещё рано" : d.title}</h3>
    </button>`;
  }).join("");
}

function renderLetters() {
  const openUntil = availableDayIndex();
  $("lettersGrid").innerHTML = LETTERS.map((l,i) => {
    const locked = (i === 6 && openUntil < 6) || (i === 7 && openUntil < 7);
    return `<button class="letter-card reveal ${locked ? "is-locked" : ""}" data-letter="${i}" ${locked ? "disabled" : ""}>
      <span>${locked ? "конверт запечатан" : "письмо от мужа"}</span>
      <strong>${l.title}</strong>
    </button>`;
  }).join("");
}

function renderReasons() {
  $("reasonsList").innerHTML = REASONS.map((r,i) => `<article class="reason reveal"><span>${String(i+1).padStart(2,"0")}</span><p>${r}</p></article>`).join("");
}

function openModal(html) {
  $("modalContent").innerHTML = `<div class="modal-inner">${html}</div>`;
  $("contentModal").showModal();
}

function bindCards() {
  $("memoryGrid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-memory]"); if (!card) return;
    const m = MEMORIES[Number(card.dataset.memory)];
    openModal(`<p class="eyebrow">воспоминание</p><h3>${m.title}</h3><img src="./assets/photos/${m.src}" alt="${m.title}" onerror="this.style.display='none'"/><p>${m.caption}</p><p>Замените подпись в <code>app.js</code> на вашу настоящую историю — именно такие детали делают альбом личным.</p>`);
  });
  $("daysGrid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-day]"); if (!card || card.disabled) return;
    const d = DAYS[Number(card.dataset.day)];
    openModal(`<p class="eyebrow">${d.date} · записка на день</p><h3>${d.title}</h3><p>${d.text}</p>`);
  });
  $("lettersGrid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-letter]"); if (!card || card.disabled) return;
    const l = LETTERS[Number(card.dataset.letter)];
    openModal(`<p class="eyebrow">открой, когда…</p><h3>${l.title.replace("…","")}</h3><p>${l.text}</p>`);
  });
}

function setupHugs() {
  const base = 24;
  let hugs = Number(localStorage.getItem("trip-hugs") || base);
  $("hugCount").textContent = hugs;
  $("hugButton").addEventListener("click", () => {
    hugs += 1; localStorage.setItem("trip-hugs", hugs); $("hugCount").textContent = hugs;
    $("hugStatus").textContent = hugs % 10 === 0 ? "Круглая сумма. Придётся погашать лично." : "+1 объятие зарезервировано на возвращение.";
    showToast("Объятие отложено ♥");
  });
}

function updateFinale(state) {
  const show = state === "return" || state === "after";
  $("finaleSecret").hidden = !show;
  $("finaleText").textContent = show ? "Тот самый день наконец наступил." : "Этот блок пока тихо ждёт своего дня.";
}

function setupReveal() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible")); return;
  }
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
  }), {threshold:.08, rootMargin:"0px 0px -30px"});
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}

function showToast(text) {
  const toast = $("toast"); toast.textContent = text; toast.classList.add("show");
  clearTimeout(window.__toast); window.__toast = setTimeout(() => toast.classList.remove("show"), 1800);
}

function setupPhotos() {
  document.querySelectorAll(".photo-frame img").forEach(img => img.addEventListener("error", () => img.classList.add("is-missing")));
}

function setupInstall() {
  let prompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); prompt = e; $("installButton").hidden = false;
  });
  $("installButton").addEventListener("click", async () => {
    if (!prompt) return; prompt.prompt(); await prompt.userChoice; prompt = null; $("installButton").hidden = true;
  });
}

function setupServiceWorker() {
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

function init() {
  renderMemories(); renderDays(); renderLetters(); renderReasons();
  registerVisit(); pickNote(); updateCountdown(); setupHugs(); bindCards(); setupPhotos(); setupInstall(); setupServiceWorker();
  $("anotherNote").addEventListener("click", () => { pickNote(); showToast("Новая записка ♥"); });
  $("randomMemoryButton").addEventListener("click", () => { $("randomMemory").textContent = RANDOM_MEMORIES[Math.floor(Math.random()*RANDOM_MEMORIES.length)]; });
  $("modalClose").addEventListener("click", () => $("contentModal").close());
  $("contentModal").addEventListener("click", e => { if (e.target === $("contentModal")) $("contentModal").close(); });
  setupReveal(); setInterval(updateCountdown, 1000);
}

document.addEventListener("DOMContentLoaded", init);

function setupSingleScreenNavigation() {
  const screens = [...document.querySelectorAll(".screen")];
  const items = [...document.querySelectorAll(".nav-item")];
  const order = items.map(item => item.dataset.target);
  let active = "home";

  const show = (name) => {
    if (!order.includes(name) || name === active) return;
    active = name;
    screens.forEach(screen => screen.classList.toggle("is-active", screen.dataset.screen === name));
    items.forEach(item => {
      const selected = item.dataset.target === name;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-current", selected ? "page" : "false");
    });
    const current = document.querySelector(`.screen[data-screen="${name}"] .screen-scroll`);
    if (current) current.scrollTop = 0;
    try { history.replaceState(null, "", `#${name}`); } catch (_) {}
  };

  items.forEach(item => item.addEventListener("click", () => show(item.dataset.target)));

  const initial = location.hash.replace("#", "");
  if (order.includes(initial) && initial !== "home") show(initial);

  let startX = 0, startY = 0;
  const stack = $("screenStack");
  stack.addEventListener("touchstart", e => {
    const t = e.changedTouches[0]; startX = t.clientX; startY = t.clientY;
  }, {passive:true});
  stack.addEventListener("touchend", e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    const index = order.indexOf(active);
    const next = dx < 0 ? Math.min(order.length - 1, index + 1) : Math.max(0, index - 1);
    if (next !== index) show(order[next]);
  }, {passive:true});
}

document.addEventListener("DOMContentLoaded", setupSingleScreenNavigation);
