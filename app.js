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
  {date:"16 октября", title:"5 лет с того дня", text:"Сегодня отдельная глава. Пять лет со дня нашего знакомства. [ТВОЙ ТЕКСТ ДЛЯ ГЛАВЫ ГОДОВЩИНЫ]"},
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
    const isAnniversary = current.getFullYear() === 2026 && current.getMonth() === 9 && current.getDate() === 16;
    if (isAnniversary) {
      $("heroEyebrow").textContent = "16 октября · наш день";
      $("heroTitle").innerHTML = "5 лет<br><em>с того дня</em>";
      $("heroLead").textContent = "Сегодня здесь не просто ещё один день поездки. Сегодня — наша отдельная глава.";
      $("countdownKicker").textContent = "а завтра ты уже дома";
      document.title = "5 лет с того дня ♥";
    } else {
      $("heroEyebrow").textContent = "10—17 октября · Барнаул";
      $("heroTitle").innerHTML = "До твоего<br><em>возвращения</em>";
      $("heroLead").textContent = "Барнаул временно забрал тебя у меня. Но теперь таймер идёт в правильную сторону.";
      $("countdownKicker").textContent = "осталось до дома";
      document.title = "Возвращайся скорее ♥";
    }
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
  if (!$("contentModal").open) {
    try { history.pushState({tripModal:true}, ""); } catch (_) {}
    $("contentModal").showModal();
  }
}

function closeModal() {
  if (!$("contentModal").open) return;
  if (history.state && history.state.tripModal) {
    history.back();
  } else {
    $("contentModal").close();
  }
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
  $("modalClose").addEventListener("click", closeModal);
  $("contentModal").addEventListener("click", e => { if (e.target === $("contentModal")) closeModal(); });
  window.addEventListener("popstate", () => { if ($("contentModal").open) $("contentModal").close(); });
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


/* Notification-driven surprises: a shared random pool + date-specific pools. */
const SURPRISE_RANDOM = [
  {type:"envelope", title:"Маленькое письмо", text:"Ничего срочного. Просто хотел, чтобы посреди твоего дня внезапно появилось моё «я тебя люблю».", action:"оставить себе"},
  {type:"heart", title:"Один поцелуй через интернет", text:"Технически это невозможно. Поэтому я просто зарезервировал настоящий на твоё возвращение.", action:"забрать поцелуй"},
  {type:"mission", title:"Квест от мужа", text:"Найди сегодня что-нибудь красивое или смешное, сфотографируй и потом покажи мне. Хочу увидеть кусочек твоего дня.", action:"выполню"},
  {type:"envelope", title:"Проверка связи", text:"Если ты это читаешь — значит я снова сумел немного пробраться в твой день. Отлично.", action:"обнять мужа мысленно"},
  {type:"heart", title:"Ещё одно объятие", text:"Я положил его сюда заранее. Действительно выдать смогу только лично.", action:"забрать объятие"},
  {type:"choice", title:"Выбери одну", text:"Сегодня без сложных решений. Просто ткни в одну карточку.", choices:["поцелуй в лоб","долгое объятие","вечер вдвоём"]},
  {type:"mission", title:"Минутка для себя", text:"Остановись на минуту. Вода, еда, вдох-выдох. А потом продолжай спасать мир.", action:"сделано"},
  {type:"envelope", title:"Секрет", text:"Я скучаю не по «событиям». Я скучаю по самым обычным вещам рядом с тобой.", action:"закрыть и улыбнуться"},
  {type:"heart", title:"Семейная бухгалтерия", text:"Твой счёт снова пополнен. Проценты начисляются объятиями.", action:"+1 к долгу мужа"},
  {type:"choice", title:"Что забираешь сегодня?", text:"Можно выбрать только одно. Остальное — при встрече.", choices:["чай вместе","обнимашки","ничего не делать вдвоём"]},
  {type:"envelope", title:"Очень важное сообщение", text:"Ты красивая. Даже если устала. Даже если сейчас сама с этим споришь.", action:"ладно, принимаю"},
  {type:"mission", title:"Небольшое задание", text:"Улыбнись прямо сейчас. Совсем чуть-чуть. Да, я серьёзно.", action:"улыбнулась"},
  {type:"heart", title:"Из дома прилетело ♥", text:"Я сохранил для тебя место рядом. Оно вообще-то всегда твоё.", action:"забрать"},
  {type:"envelope", title:"На всякий случай", text:"Если сегодня всё немного не так — день всё равно закончится. И станет ещё одним днём ближе к дому.", action:"запомню"},
  {type:"choice", title:"Три маленьких обещания", text:"Выбирай, что получить первым после возвращения.", choices:["объятие","поцелуй","рассказ обо всём"]},
  {type:"mission", title:"Сфоткай мне это", text:"Покажи мне сегодня одну обычную вещь из Барнаула, которую я бы сам точно не заметил.", action:"договорились"},
  {type:"envelope", title:"Просто потому что", text:"Мне очень нравится наше «вместе». Даже когда несколько дней оно выглядит как два разных города.", action:"мне тоже"},
  {type:"heart", title:"Скучаю", text:"Не драматично. По-семейному. По голосу, шагам, вещам рядом и твоему «ну Ива-а-ан».", action:"♥"},
  {type:"choice", title:"Вечер после возвращения", text:"Какой первый спокойный вечер тебе сейчас хочется больше?", choices:["кино и еда","долго болтать","просто лежать рядом"]},
  {type:"envelope", title:"Тук-тук", text:"Это муж напоминает: домой можно не спешить. Возвращайся спокойно. Я подожду сколько нужно.", action:"хорошо"},
  {type:"mission", title:"Сохрани момент", text:"Если сегодня случится что-то хорошее — запомни одну деталь. Потом расскажешь мне её первой.", action:"сохраню"},
  {type:"heart", title:"Ещё немного нас", text:"Каждый раз, когда ты сюда заходишь, расстояние не становится меньше. Но почему-то ощущается именно так.", action:"обнять"},
  {type:"envelope", title:"Сообщение без причины", text:"Ты мой любимый человек. Вот и весь сложный смысл.", action:"прочитано ♥"},
  {type:"choice", title:"Выбирай приз", text:"Все варианты настоящие и будут выданы после возвращения.", choices:["10 минут объятий","поцелуй без причины","завтрак/ужин от мужа"]}
];

const SURPRISE_BY_DAY = {
  10:[
    {type:"envelope",title:"На дорожку",text:"Ну вот, тот самый день. Береги себя в дороге и просто дай мне знать, когда нормально доберёшься. Всё остальное подождёт.",action:"обещаю"},
    {type:"heart",title:"Первый долг",text:"Командировка только началась, а я уже должен тебе одно длинное объятие.",action:"записать в долг"},
    {type:"mission",title:"Первый квест",text:"Когда устроишься, сфотографируй первое, что покажется тебе «вот теперь я точно в Барнауле». Потом покажешь мне.",action:"сделаю"},
    {type:"choice",title:"Что взять с собой мысленно?",text:"Выбери одно. Я отправляю следом.",choices:["объятие","поцелуй в лоб","моё «всё будет хорошо»"]}
  ],
  11:[
    {type:"envelope",title:"Первое утро далеко",text:"Наверное, сегодня расстояние ощущается сильнее всего. Но теперь таймер уже идёт в правильную сторону.",action:"идём дальше"},
    {type:"mission",title:"Доброе утро от мужа",text:"Нормально позавтракай. Да, я специально сделал для этого интерактив на сайте.",action:"поем"},
    {type:"heart",title:"Дом сообщает",text:"Без тебя здесь непривычно. Но твоё место никто не занимал.",action:"забрать сердечко"},
    {type:"choice",title:"Сегодня тебе нужнее…",text:"Выбирай честно.",choices:["поддержка","смешинка","немного дома"]}
  ],
  12:[
    {type:"envelope",title:"Уже не первый день",text:"Самое странное уже позади. Теперь это просто несколько дней, которые надо спокойно прожить.",action:"спокойно"},
    {type:"heart",title:"Сегодняшняя норма",text:"Одно напоминание, что тебя очень ждут. И ещё одно, что тебя очень любят.",action:"принято"},
    {type:"mission",title:"Покажи мне день",text:"Сделай одну фотографию не достопримечательности, а обычного сегодняшнего момента.",action:"сфоткаю"},
    {type:"choice",title:"Когда вернёшься…",text:"Что делаем первым?",choices:["едим что-нибудь вкусное","долго обнимаемся","болтаем до ночи"]}
  ],
  13:[
    {type:"envelope",title:"Почти середина",text:"Мы уже почти в той точке, где правильнее говорить не «ты недавно уехала», а «ты скоро вернёшься».",action:"так лучше"},
    {type:"heart",title:"+1 день к дому",text:"Сегодняшний день автоматически конвертируется в один день ближе ко мне.",action:"зачислить"},
    {type:"mission",title:"Внутренний прикол дня",text:"Если сегодня произойдёт что-то абсурдное — запомни. Нам нужен новый семейный мем.",action:"буду следить"},
    {type:"choice",title:"Мини-награда",text:"За половину пути полагается бонус.",choices:["2 объятия","2 поцелуя","право ворчать 10 минут"]}
  ],
  14:[
    {type:"envelope",title:"Половина позади",text:"Всё. Теперь возвращение ближе, чем отъезд. Очень приятная математика.",action:"люблю такую математику"},
    {type:"heart",title:"Точка перелома ♥",text:"С этого момента каждый взгляд на таймер должен радовать чуть сильнее.",action:"проверить таймер"},
    {type:"mission",title:"Одна вещь про сегодня",text:"Запомни одну вещь, которую захочется рассказать мне первой, когда увидимся.",action:"есть такая"},
    {type:"choice",title:"Что я должен приготовить к встрече?",text:"Выбирай.",choices:["объятия","вкусную еду","полный вечер без дел"]}
  ],
  15:[
    {type:"envelope",title:"Уже можно говорить «скоро»",text:"Осталось так мало, что я начинаю мысленно планировать наш первый обычный вечер после твоего возвращения.",action:"я тоже"},
    {type:"heart",title:"Скоро домой",text:"Кажется, слово «скоро» наконец перестало быть враньём.",action:"♥"},
    {type:"mission",title:"Маленькая просьба",text:"Не пытайся впихнуть в последние дни всё сразу. Вернись ко мне не героем, а просто собой.",action:"договорились"},
    {type:"choice",title:"Первый вечер",text:"Какой режим?",choices:["ничего не делать","всё обсудить","смотреть что-нибудь в обнимку"]}
  ],
  16:[
    {type:"envelope",title:"5 лет с того дня",text:"[ТВОЙ ТЕКСТ: утреннее поздравление с годовщиной знакомства]",action:"открыть наш день"},
    {type:"memory",title:"Как всё начиналось",text:"[ТВОЙ ТЕКСТ: первое знакомство / первое впечатление]",action:"вспомнить"},
    {type:"photo",title:"Мы тогда",text:"[ТВОЙ ТЕКСТ К ФОТО: ранняя совместная фотография]",photo:"anniversary-01.jpg",action:"перевернуть фото"},
    {type:"memory",title:"Один момент из этих пяти лет",text:"[ТВОЙ ТЕКСТ: конкретное важное воспоминание]",action:"оставить здесь"},
    {type:"choice",title:"Пять лет — пять вещей",text:"[ТВОЙ ТЕКСТ: короткое вступление]",choices:["[вещь 1]","[вещь 2]","[вещь 3]"]},
    {type:"heart",title:"Объятие на годовщину",text:"[ТВОЙ ТЕКСТ: короткая подпись к особому объятию]",action:"забрать объятие"},
    {type:"voice",title:"Сегодня лучше услышать меня",text:"[ТВОЯ КОРОТКАЯ ПОДВОДКА К ГОЛОСОВОМУ]",audio:"voice-16.mp3",action:"включить голос"},
    {type:"envelope",title:"Перед сном",text:"[ТВОЙ ТЕКСТ: 5 лет знакомства + завтра возвращение домой]",action:"до завтра ♥"}
  ],
  17:[
    {type:"envelope",title:"Сегодня домой",text:"Семь дней закончились. Теперь не надо ничего считать — просто возвращайся ко мне.",action:"еду домой"},
    {type:"heart",title:"Финальный долг",text:"Все накопленные объятия сегодня подлежат немедленному погашению.",action:"взыскать всё"},
    {type:"mission",title:"Последний квест",text:"Добраться спокойно. Всё остальное сегодня сделаю я.",action:"договорились"},
    {type:"choice",title:"Финальный выбор",text:"Хотя мы оба знаем правильный ответ.",choices:["домой","домой","домой ♥"]}
  ]
};

function currentTripDay(date = now()){
  if(date < CONFIG.departure || date >= CONFIG.tripEnd) return null;
  return Math.min(17, Math.max(10, 10 + Math.floor((date - CONFIG.departure) / 86400000)));
}

function surpriseFromKey(key){
  if(!key) return null;
  if(key.startsWith("random-")){
    const index = Number(key.split("-")[1]);
    return SURPRISE_RANDOM[index % SURPRISE_RANDOM.length];
  }
  const match = key.match(/^day-(\d+)-(\d+)$/);
  if(match){
    const day = Number(match[1]), index = Number(match[2]);
    const pool = SURPRISE_BY_DAY[day] || [];
    return pool[index % Math.max(pool.length,1)] || null;
  }
  return null;
}

function surpriseShell(item, key){
  const typeLabel =
    item.type === "mission" ? "маленькое задание" :
    item.type === "choice" ? "выбери сердцем" :
    item.type === "heart" ? "для тебя кое-что есть" :
    item.type === "photo" ? "одна наша фотография" :
    item.type === "memory" ? "одна глава из нас" :
    item.type === "voice" ? "сегодня лучше услышать" :
    "письмо от мужа";
  return `
    <div class="surprise" data-surprise-key="${key}">
      <div class="surprise-seal">♥</div>
      <p class="eyebrow">${typeLabel}</p>
      <h3>${item.title}</h3>
      <p class="surprise-teaser">Я специально не написал всё в уведомлении.</p>
      <button class="primary-button surprise-open" type="button">открыть</button>
      <div class="surprise-reveal" hidden></div>
    </div>`;
}

function renderSurpriseReveal(item){
  if(item.type === "choice"){
    return `<p class="surprise-text">${item.text}</p><div class="surprise-choices">${item.choices.map((choice,i)=>`<button type="button" data-choice="${i}">${choice}</button>`).join("")}</div><p class="surprise-result" aria-live="polite"></p>`;
  }
  if(item.type === "photo"){
    const src = `./assets/photos/${item.photo || "anniversary-01.jpg"}`;
    return `<div class="anniversary-photo"><div class="memory-fallback"><strong>сюда вашу фотографию</strong></div><img src="${src}" alt="" onerror="this.style.display='none'"></div><p class="surprise-text">${item.text}</p><button class="surprise-action" type="button">${item.action || "оставить здесь"}</button>`;
  }
  if(item.type === "voice"){
    const src = `./assets/audio/${item.audio || "voice-16.mp3"}`;
    return `<p class="surprise-text">${item.text}</p><audio controls preload="metadata" src="${src}" style="width:100%"></audio>`;
  }
  const label = item.type === "heart" ? "♥" : item.type === "mission" ? "✓" : item.type === "memory" ? "∞" : "от мужа";
  return `<div class="surprise-mark">${label}</div><p class="surprise-text">${item.text}</p><button class="surprise-action" type="button">${item.action || "забрать с собой"}</button>`;
}

function openSurprise(key){
  const item = surpriseFromKey(key);
  if(!item) return;
  openModal(surpriseShell(item,key));
  const modal = $("contentModal");
  const open = modal.querySelector(".surprise-open");
  open.addEventListener("click",()=>{
    const reveal = modal.querySelector(".surprise-reveal");
    reveal.innerHTML = renderSurpriseReveal(item);
    reveal.hidden = false;
    open.hidden = true;
    modal.querySelector(".surprise").classList.add("is-open");
    if(navigator.vibrate) navigator.vibrate(35);

    reveal.querySelectorAll("[data-choice]").forEach(button=>button.addEventListener("click",()=>{
      reveal.querySelectorAll("[data-choice]").forEach(b=>b.classList.remove("is-picked"));
      button.classList.add("is-picked");
      reveal.querySelector(".surprise-result").textContent = `Выбрано: ${button.textContent}. Запомнил ♥`;
      localStorage.setItem("trip-last-choice",button.textContent);
    }));

    const action = reveal.querySelector(".surprise-action");
    if(action) action.addEventListener("click",()=>{
      const count = Number(localStorage.getItem("trip-surprises-kept") || 0) + 1;
      localStorage.setItem("trip-surprises-kept",count);
      action.textContent = "сохранено ♥";
      action.disabled = true;
      showToast("Забрала с собой ♥");
    });
  });
}

function openIncomingSurprise(){
  const params = new URLSearchParams(location.search);
  const key = params.get("surprise");
  if(!key) return;
  setTimeout(()=>openSurprise(key),180);
  params.delete("surprise");
  const rest = params.toString();
  try{ history.replaceState(null,"",location.pathname + (rest ? "?" + rest : "") + location.hash); }catch(_){}
}

function pickNote(){
  const day = currentTripDay();
  const source = day && SURPRISE_BY_DAY[day]?.length
    ? SURPRISE_BY_DAY[day].map(item=>item.text)
    : NOTES;
  let history = JSON.parse(localStorage.getItem("trip-note-history") || "[]");
  const signature = day ? `day-${day}` : "random";
  if(localStorage.getItem("trip-note-source") !== signature){
    history = [];
    localStorage.setItem("trip-note-source",signature);
  }
  const available = source.map((_,i)=>i).filter(i=>!history.includes(i));
  const pool = available.length ? available : source.map((_,i)=>i);
  const index = pool[Math.floor(Math.random()*pool.length)];
  history = [index,...history.filter(i=>i!==index)].slice(0,Math.min(8,source.length));
  localStorage.setItem("trip-note-history",JSON.stringify(history));
  $("dailyNote").textContent = source[index];
}

document.addEventListener("DOMContentLoaded", openIncomingSurprise);


function openDailySurpriseOnce(){
  const params = new URLSearchParams(location.search);
  if(params.has("surprise")) return;
  const day = currentTripDay();
  const status = $("surpriseStatus");
  const label = $("surpriseButtonLabel");
  if(!day || !SURPRISE_BY_DAY[day]?.length){
    if(status) status.textContent = "маленькая случайность";
    if(label) label.textContent = "открыть сюрприз";
    return;
  }
  const seenKey = `trip-daily-surprise-${day}`;
  const unread = !localStorage.getItem(seenKey);
  if(status) status.textContent = unread ? "новое на сегодня" : "ещё кое-что для тебя";
  if(label) label.textContent = unread ? "открыть сюрприз дня" : "ещё один сюрприз";
}

document.addEventListener("DOMContentLoaded", openDailySurpriseOnce);


function openRandomSurprise(){
  let history = JSON.parse(localStorage.getItem("trip-surprise-history") || "[]");
  const available = SURPRISE_RANDOM.map((_,i)=>i).filter(i=>!history.includes(i));
  const pool = available.length ? available : SURPRISE_RANDOM.map((_,i)=>i);
  const index = pool[Math.floor(Math.random()*pool.length)];
  history = [index,...history.filter(i=>i!==index)].slice(0,12);
  localStorage.setItem("trip-surprise-history",JSON.stringify(history));
  openSurprise(`random-${index}`);
}

function openBestSurprise(){
  const day = currentTripDay();
  if(day && SURPRISE_BY_DAY[day]?.length){
    const seenKey = `trip-daily-surprise-${day}`;
    if(!localStorage.getItem(seenKey)){
      const index = (day * 7 + 3) % SURPRISE_BY_DAY[day].length;
      localStorage.setItem(seenKey,"1");
      openDailySurpriseOnce();
      openSurprise(`day-${day}-${index}`);
      return;
    }
  }
  openRandomSurprise();
}

document.addEventListener("DOMContentLoaded",()=>{
  const button = $("surpriseButton");
  if(button) button.addEventListener("click",openBestSurprise);
});


const VOICE_BY_DAY = {
  10:"voice-10.mp3",
  11:"voice-11.mp3",
  14:"voice-14.mp3",
  16:"voice-16.mp3",
  17:"voice-17.mp3"
};

async function setupVoiceNotes(){
  const day = currentTripDay();
  const file = day ? VOICE_BY_DAY[day] : null;
  if(!file) return;
  const src = `./assets/audio/${file}`;
  try{
    const response = await fetch(src, {method:"HEAD", cache:"no-store"});
    if(!response.ok) return;
  }catch(_){ return; }

  const home = $("homeVoiceButton");
  const card = $("voiceCard");
  if(home) home.hidden = false;
  if(card) card.hidden = false;

  const play = () => {
    openModal(`
      <div class="voice-modal">
        <p class="eyebrow">голосовое от мужа</p>
        <h3>Хочешь услышать меня?</h3>
        <audio controls preload="metadata" src="${src}" style="width:100%"></audio>
      </div>`);
  };
  home?.addEventListener("click", play);
  $("voiceCardButton")?.addEventListener("click", play);
}

function setupNativeMode(){
  const params = new URLSearchParams(location.search);
  if(params.get("native") !== "1") return;
  document.documentElement.classList.add("is-native");
  document.querySelector(".android-card")?.remove();
  if($("installButton")) $("installButton").hidden = true;
}

document.addEventListener("DOMContentLoaded",()=>{
  setupNativeMode();
  setupVoiceNotes();
});
