(() => {
  "use strict";
  const app = document.getElementById("app");
  const owlFx = document.getElementById("owlFx");
  const toastEl = document.getElementById("tenToast");
  const GAMES = [
    { id: "fortune", emoji: "🦉", title: "Генератор Катастроф", blurb: "Колода карт: сова + абсурдное предсказание. Можно хвастаться." },
    { id: "beetle", emoji: "🪲", title: "Эволюция жука", blurb: "Кликер: от микро-жука до космического жука размером с планету." },
    { id: "planet", emoji: "⚡", title: "Не взорви планету", blurb: "Держи CHARGE, отпусти вовремя — катушка Теслы не должна сжечь Землю." },
    { id: "spice", emoji: "🌶️", title: "Шкала остроты", blurb: "Лови перец и молоко ртом. Не дай шкале Сковилла взорваться." },
    { id: "doors", emoji: "🚪", title: "Выбивание дверей", blurb: "Коридор из папок. Кликай, пока сбой системы не догнал." },
    { id: "audio", emoji: "🎧", title: "Угадай жука по звуку", blurb: "Жужжание, треск или Тесла? Выбери, кто это был." },
    { id: "office", emoji: "💥", title: "Разрушитель офиса", blurb: "Антистресс: молот, лазер, молния — круши папки на рабочем столе." },
    { id: "maze", emoji: "🌑", title: "Слепая зона", blurb: "Чёрный лабиринт. Светлячок освещает пару сантиметров. Найди выход." },
    { id: "debate", emoji: "🔥", title: "Острый спор", blurb: "Текстовая дуэль с ботом. Верный аргумент жжёт соус, ошибка — слёзы." },
    { id: "grid", emoji: "🔌", title: "Электросеть", blurb: "Крути провода, соедини генератор с катушкой Теслы." },
  ];

  const S = {
    god: false, freeze: false, slow: false, xray: false, lag: false, archive: false,
    scoreBoost: 1, rewindAt: 0,
  };
  let current = "hub";
  let loopId = 0;
  let audioCtx = null;
  function dtMul() {
    if (S.freeze) return 0;
    if (S.lag) return 0.05;
    if (S.slow) return 0.2;
    return 1;
  }

  function toast(t) {
    toastEl.textContent = t;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 1600);
  }
  function beep(f, ms) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = f;
      o.type = "square";
      g.gain.value = 0.05;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      setTimeout(() => { try { o.stop(); } catch (_) {} }, ms || 80);
    } catch (_) {}
  }
  function showOwl() {
    owlFx.classList.add("show");
    setTimeout(() => owlFx.classList.remove("show"), 900);
  }
  function stopLoop() {
    if (loopId) cancelAnimationFrame(loopId);
    loopId = 0;
  }
  function go(id) {
    stopLoop();
    current = id;
    if (id === "hub") renderHub();
    else if (id === "fortune") startFortune();
    else if (id === "beetle") startBeetle();
    else if (id === "planet") startPlanet();
    else if (id === "spice") startSpice();
    else if (id === "doors") startDoors();
    else if (id === "audio") startAudio();
    else if (id === "office") startOffice();
    else if (id === "maze") startMaze();
    else if (id === "debate") startDebate();
    else if (id === "grid") startGrid();
  }
  function bar(title) {
    return `<div class="topbar"><button class="back" type="button" data-hub>← К 10 играм</button><b>${title}</b></div>`;
  }
  function bindHub() {
    app.querySelector("[data-hub]")?.addEventListener("click", () => go("hub"));
  }
  function renderHub() {
    app.innerHTML = `<h1>10 игр Амаля</h1><p class="sub">Мини-пак с сайта. Хозяину — панель способностей справа снизу. Новые картинки со способностями можно прислать — добавим.</p>
      <div class="grid">${GAMES.map((g) => `<button class="gcard" type="button" data-g="${g.id}"><b>${g.emoji} ${g.title}</b><span>${g.blurb}</span></button>`).join("")}</div>
      <div class="console" id="devCon"><input id="devCmd" placeholder="консоль: MONEY / WIN / GOD / OWL" /><button type="button" id="devGo">↵</button></div>`;
    app.querySelectorAll("[data-g]").forEach((b) => b.onclick = () => go(b.getAttribute("data-g")));
    const goBtn = document.getElementById("devGo");
    if (goBtn) goBtn.onclick = runConsole;
  }
  function runConsole() {
    const inp = document.getElementById("devCmd");
    const cmd = String(inp && inp.value || "").trim().toUpperCase();
    if (cmd === "MONEY" || cmd === "COINS") { S.scoreBoost = 1000000; toast("💰 MONEY"); }
    else if (cmd === "GOD") { S.god = true; toast("🛡 GOD"); }
    else if (cmd === "WIN") { window.dispatchEvent(new CustomEvent("ten-win")); toast("🏁 WIN"); }
    else if (cmd === "OWL") { showOwl(); toast("🦉 OWL"); }
    else toast("Команды: MONEY, GOD, WIN, OWL");
  }

  /* 1 Fortune */
  function startFortune() {
    const owls = ["🦉", "🦉💫", "🦉🔥", "🦉⚡"];
    const lines = [
      "Завтра все папки на рабочем столе объявят забастовку.",
      "Катушка Теслы шепнёт тебе пароль от Wi‑Fi соседа.",
      "Жук эволюционирует в менеджера и попросит отпуск.",
      "Соус станет настолько острым, что спор выиграет сам.",
      "Дверь-папка откроется в параллельный вторник.",
      "Планета не взорвётся. Почти. На 87%.",
    ];
    app.innerHTML = bar("Генератор Катастроф") + `<div class="stage"><p class="sub">Жми колоду — перемешается и выпадет мем-предсказание.</p>
      <div class="cards"><div class="cardx" id="c1">?</div><div class="cardx" id="c2">?</div><div class="cardx" id="c3">?</div></div>
      <button type="button" id="draw" style="display:block;margin:14px auto">Перемешать колоду</button>
      <div class="pred" id="pred">Нажми колоду…</div></div>`;
    bindHub();
    const draw = () => {
      beep(220, 40); beep(440, 80);
      document.getElementById("c1").textContent = owls[Math.floor(Math.random() * owls.length)];
      document.getElementById("c2").textContent = ["🔥", "⚡", "📁", "🌶️"][Math.floor(Math.random() * 4)];
      document.getElementById("c3").textContent = ["💥", "🌍", "🪲", "🪄"][Math.floor(Math.random() * 4)];
      document.getElementById("pred").textContent = lines[Math.floor(Math.random() * lines.length)];
    };
    document.getElementById("draw").onclick = draw;
    app.querySelectorAll(".cardx").forEach((c) => c.onclick = draw);
  }

  /* 2 Beetle clicker */
  function startBeetle() {
    const forms = ["микро-жук", "скарабей", "носорог", "геркулес", "космический жук-планета"];
    let energy = 0, form = 0, auto = 0;
    const need = [20, 80, 250, 900, 99999];
    app.innerHTML = bar("Эволюция жука") + `<div class="stage" style="text-align:center">
      <div id="bug" style="font-size:72px;cursor:pointer">🪲</div>
      <div class="hud"><span id="en">0</span><span id="fm"></span></div>
      <button type="button" id="buy">Купить автоклик</button>
    </div>`;
    bindHub();
    const paint = () => {
      document.getElementById("en").textContent = "энергия: " + Math.floor(energy * S.scoreBoost);
      document.getElementById("fm").textContent = forms[form];
      document.getElementById("bug").textContent = ["🪲", "🐞", "🦗", "🦂", "🪐"][form];
    };
    const tick = (now) => {
      energy += auto * 0.04 * dtMul();
      while (form < 4 && energy >= need[form]) form++;
      paint();
      loopId = requestAnimationFrame(tick);
    };
    document.getElementById("bug").onclick = () => { energy += (S.god ? 50 : 1); beep(300 + form * 40, 40); paint(); };
    document.getElementById("buy").onclick = () => { if (energy >= 30) { energy -= 30; auto += 1; toast("Автоклик +1"); } };
    loopId = requestAnimationFrame(tick);
  }

  /* 3 Planet tesla */
  function startPlanet() {
    let heat = 0, holding = false, alive = true, time = 0, best = 0;
    app.innerHTML = bar("Не взорви планету") + `<div class="stage" style="text-align:center">
      <div id="coil" style="font-size:64px">🌍⚡</div>
      <div class="hud"><span id="ht">жар 0%</span><span id="tm">0с</span></div>
      <div style="height:14px;background:#1e293b;border-radius:8px;overflow:hidden"><div id="bar" style="height:100%;width:0;background:#22d3ee"></div></div>
      <p class="sub">Зелёная зона 40–70%. Зажми CHARGE, отпусти вовремя.</p>
      <button type="button" id="chg">CHARGE</button>
    </div>`;
    bindHub();
    const chg = document.getElementById("chg");
    chg.onpointerdown = () => { holding = true; };
    window.onpointerup = () => { holding = false; };
    const tick = (now) => {
      const d = 0.016 * dtMul();
      time += d;
      if (alive) {
        if (holding) heat += d * (S.god ? 8 : 28);
        else heat = Math.max(0, heat - d * 18);
        if (!S.god && heat > 100) { alive = false; toast("💥 Планета взорвалась"); beep(80, 300); }
        best = Math.max(best, time);
      }
      const h = Math.min(100, heat);
      document.getElementById("bar").style.width = h + "%";
      document.getElementById("bar").style.background = h > 70 ? "#fb7185" : h >= 40 ? "#34d399" : "#22d3ee";
      document.getElementById("ht").textContent = "жар " + Math.floor(h) + "%";
      document.getElementById("tm").textContent = Math.floor(best) + "с";
      loopId = requestAnimationFrame(tick);
    };
    loopId = requestAnimationFrame(tick);
  }

  /* 4 Spice */
  function startSpice() {
    const c = document.createElement("canvas");
    c.width = 480; c.height = 320;
    app.innerHTML = bar("Шкала остроты");
    bindHub();
    const stage = document.createElement("div");
    stage.className = "stage";
    stage.innerHTML = `<div class="hud"><span id="scv">Сковилл 0</span><span id="sc">очки 0</span></div>`;
    stage.appendChild(c);
    app.appendChild(stage);
    const ctx = c.getContext("2d");
    let x = 240, burn = 20, score = 0, items = [];
    const spawn = () => items.push({ x: 30 + Math.random() * 420, y: -10, k: Math.random() < 0.7 ? "hot" : "milk" });
    let acc = 0;
    c.onpointermove = (e) => {
      const r = c.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 480;
    };
    const tick = () => {
      acc += dtMul();
      if (acc > 18) { acc = 0; spawn(); }
      ctx.fillStyle = S.xray ? "#122" : "#081018";
      ctx.fillRect(0, 0, 480, 320);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(x - 24, 292, 48, 18);
      ctx.font = "20px system-ui";
      items.forEach((it) => {
        it.y += (S.god ? 1.2 : 2.4) * dtMul();
        ctx.fillText(it.k === "hot" ? "🌶️" : "🥛", it.x, it.y);
        if (it.y > 286 && Math.abs(it.x - x) < 30) {
          it.dead = true;
          if (it.k === "hot") burn += S.god ? 2 : 12;
          else burn = Math.max(0, burn - 18);
          score += 10 * S.scoreBoost;
          beep(it.k === "hot" ? 520 : 240, 40);
        }
      });
      items = items.filter((it) => !it.dead && it.y < 340);
      if (!S.god && burn >= 100) { toast("🔥 Сгорел!"); burn = 20; score = Math.max(0, score - 30); }
      document.getElementById("scv").textContent = "Сковилл " + Math.floor(burn);
      document.getElementById("sc").textContent = "очки " + Math.floor(score);
      loopId = requestAnimationFrame(tick);
    };
    loopId = requestAnimationFrame(tick);
  }

  /* 5 Doors */
  function startDoors() {
    let dist = 0, door = 18, fail = 0, run = true;
    app.innerHTML = bar("Выбивание дверей") + `<div class="stage" style="text-align:center">
      <div id="cor" style="font-size:64px">🏃📁</div>
      <div class="hud"><span id="hp">дверь 18</span><span id="fl">сбой 0%</span></div>
      <p class="sub">Жми быстро, пока системный сбой не догнал.</p>
      <button type="button" id="kick">ВЫБИТЬ</button>
    </div>`;
    bindHub();
    document.getElementById("kick").onclick = () => {
      if (!run) return;
      door -= S.god ? 6 : 1;
      beep(180, 30);
      if (door <= 0) { dist++; door = 14 + dist * 2; toast("Дверь " + dist + " выбита"); }
    };
    const tick = (now) => {
      if (run) {
        fail += (S.god ? 0 : 7) * 0.016 * dtMul();
        if (fail >= 100) { run = false; toast("💀 Системный сбой догнал"); }
      }
      document.getElementById("hp").textContent = "дверь " + Math.max(0, Math.ceil(door));
      document.getElementById("fl").textContent = "сбой " + Math.floor(fail) + "% · папок " + dist;
      loopId = requestAnimationFrame(tick);
    };
    loopId = requestAnimationFrame(tick);
  }

  /* 6 Audio quiz */
  function startAudio() {
    const opts = [
      { id: "herc", name: "Жук-геркулес", f: 90 },
      { id: "mosq", name: "Комар", f: 480 },
      { id: "tesla", name: "Катушка Теслы", f: 140 },
    ];
    let cur = opts[0], ok = 0;
    app.innerHTML = bar("Угадай жука по звуку") + `<div class="stage">
      <p class="sub">Слушай и выбирай. В конце — факт.</p>
      <button type="button" id="playS">▶ Звук</button>
      <div class="choices" id="chs"></div>
      <div class="pred" id="fact"></div>
    </div>`;
    bindHub();
    const next = () => {
      cur = opts[Math.floor(Math.random() * opts.length)];
      document.getElementById("chs").innerHTML = opts.map((o) => `<button type="button" data-id="${o.id}">${o.name}</button>`).join("");
      document.getElementById("chs").onclick = (e) => {
        const id = e.target && e.target.getAttribute("data-id");
        if (!id) return;
        const good = S.xray || S.god || id === cur.id;
        if (good) { ok++; toast("Верно"); document.getElementById("fact").textContent = cur.id === "tesla" ? "Тесла трещит на высоких гармониках — не жук." : "Насекомые «поют» крыльями: частота выдаёт вид."; next(); }
        else toast("Мимо");
      };
    };
    document.getElementById("playS").onclick = () => {
      for (let i = 0; i < 6; i++) setTimeout(() => beep(cur.f + (i % 2 ? 40 : 0), 70), i * 90);
    };
    next();
  }

  /* 7 Office */
  function startOffice() {
    let weapon = "hammer", smashed = 0;
    app.innerHTML = bar("Разрушитель офиса") + `<div class="weapons" style="margin-bottom:8px">
      <button type="button" data-w="hammer">🔨 Молот</button>
      <button type="button" data-w="laser">🔴 Лазер</button>
      <button type="button" data-w="tesla">⚡ Тесла</button>
    </div><div class="desktop" id="desk"></div><div class="hud"><span id="sm">0 папок</span></div>`;
    bindHub();
    app.querySelectorAll("[data-w]").forEach((b) => b.onclick = () => { weapon = b.getAttribute("data-w"); toast(b.textContent); });
    const desk = document.getElementById("desk");
    const spawn = (n) => {
      for (let i = 0; i < n; i++) {
        const f = document.createElement("div");
        f.className = "folder";
        f.textContent = "📁\ncache";
        f.style.left = 10 + Math.random() * 78 + "%";
        f.style.top = 10 + Math.random() * 70 + "%";
        f.onclick = () => {
          if (S.archive) { f.remove(); smashed++; }
          else { f.style.transform = "rotate(" + (weapon === "hammer" ? 20 : 8) + "deg) scale(.2)"; setTimeout(() => f.remove(), 180); smashed++; }
          beep(weapon === "tesla" ? 90 : 200, 50);
          document.getElementById("sm").textContent = smashed + " папок в корзине";
        };
        desk.appendChild(f);
      }
    };
    spawn(10);
    document.getElementById("sm").insertAdjacentHTML("afterend", "");
  }

  /* 8 Maze */
  function startMaze() {
    const c = document.createElement("canvas");
    c.width = 420; c.height = 420;
    app.innerHTML = bar("Слепая зона");
    bindHub();
    const st = document.createElement("div");
    st.className = "stage";
    st.appendChild(c);
    app.appendChild(st);
    const ctx = c.getContext("2d");
    const n = 11;
    const maze = [];
    for (let y = 0; y < n; y++) {
      maze[y] = [];
      for (let x = 0; x < n; x++) maze[y][x] = x % 2 && y % 2 ? 1 : (Math.random() < 0.22 ? 1 : 0);
    }
    maze[1][1] = 0; maze[n - 2][n - 2] = 0;
    let px = 1, py = 1, keys = {};
    window.onkeydown = (e) => { keys[e.key] = true; };
    window.onkeyup = (e) => { keys[e.key] = false; };
    const cell = 420 / n;
    const tick = () => {
      let dx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
      let dy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
      const nx = px + dx, ny = py + dy;
      if (nx >= 0 && ny >= 0 && nx < n && ny < n && (S.god || !maze[ny][nx] || S.archive)) { px = nx; py = ny; }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 420, 420);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const dist = Math.hypot(x - px, y - py);
        const vis = S.xray || S.god || dist < 1.7;
        if (!vis) continue;
        ctx.fillStyle = maze[y][x] ? "#334155" : "#0f172a";
        ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
      }
      ctx.fillStyle = "#fde68a";
      ctx.beginPath(); ctx.arc(px * cell + cell / 2, py * cell + cell / 2, 8, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect((n - 2) * cell + 8, (n - 2) * cell + 8, cell - 16, cell - 16);
      if (px === n - 2 && py === n - 2) toast("✨ Выход найден");
      keys.ArrowRight = keys.ArrowLeft = keys.ArrowUp = keys.ArrowDown = keys.a = keys.d = keys.w = keys.s = false;
      loopId = requestAnimationFrame(tick);
    };
    loopId = requestAnimationFrame(tick);
  }

  /* 9 Debate */
  function startDebate() {
    const qs = [
      { q: "Почему катушка Теслы лучше обычной лампы?", a: ["Даёт шоу и озон", "Потому что громче", "Просто так"] },
      { q: "Жук-геркулес силён, потому что…", a: ["Отношение силы к массе огромное", "Он злой", "Пьет кофе"] },
      { q: "Острый перец жжёт из‑за…", a: ["Капсаицина", "Огня внутри", "Магии совы"] },
    ];
    let i = 0, heat = 1;
    app.innerHTML = bar("Острый спор") + `<div class="stage debate">
      <div class="msg bot" id="bq"></div>
      <div class="choices" id="ba"></div>
      <div class="hud"><span id="hs">острота соуса ×1</span></div>
    </div>`;
    bindHub();
    const show = () => {
      if (i >= qs.length) { document.getElementById("bq").textContent = "Бот сдался. Соус победил."; return; }
      const t = qs[i];
      document.getElementById("bq").textContent = "Бот: " + t.q;
      document.getElementById("ba").innerHTML = t.a.map((x, k) => `<button type="button" data-k="${k}">${x}</button>`).join("");
    };
    document.getElementById("ba").onclick = (e) => {
      const k = e.target && e.target.getAttribute("data-k");
      if (k == null) return;
      if (S.xray || S.god || k === "0") { heat++; toast("Соус жжёт логику бота"); i++; }
      else { heat = Math.max(1, heat - 1); toast("😢 Жжёт тебя"); }
      document.getElementById("hs").textContent = "острота соуса ×" + heat;
      show();
    };
    show();
  }

  /* 10 Grid */
  function startGrid() {
    const n = 5;
    const tiles = [];
    for (let i = 0; i < n * n; i++) tiles.push(Math.floor(Math.random() * 4));
    tiles[0] = 1; tiles[n * n - 1] = 1;
    app.innerHTML = bar("Электросеть") + `<div class="stage"><p class="sub">Кликай клетку — крутится провод. Соедини ⚡ слева с катушкой справа.</p>
      <div id="grid" style="display:grid;grid-template-columns:repeat(5,48px);gap:6px;justify-content:center"></div>
      <div class="pred" id="ok"></div></div>`;
    bindHub();
    const glyph = ["│", "─", "┐", "┘"];
    const box = document.getElementById("grid");
    const paint = () => {
      box.innerHTML = tiles.map((t, i) => `<button type="button" data-i="${i}" style="width:48px;height:48px;font-size:22px">${i === 0 ? "⚡" : i === 24 ? "🌀" : glyph[t % 4]}</button>`).join("");
    };
    const connected = () => {
      if (S.god) return true;
      return tiles[0] === 1 && tiles[24] === 1 && tiles.slice(1, 24).filter((t) => t === 1).length >= 3;
    };
    box.onclick = (e) => {
      const i = e.target && e.target.getAttribute("data-i");
      if (i == null) return;
      tiles[+i] = (tiles[+i] + 1) % 4;
      paint();
      if (connected()) { document.getElementById("ok").textContent = "⚡ Катушка бьёт молнией — уровень пройден!"; beep(80, 200); }
    };
    paint();
  }

  window.addEventListener("amal-power", (e) => {
    const t = (e.detail && e.detail.type) || "";
    if (t === "god" || t === "tp-god") S.god = true;
    if (t === "tp-freeze" || t === "timestop") S.freeze = !(e.detail && e.detail.on === false);
    if (t === "tp-slow") S.slow = true;
    if (t === "tp-rewind") { S.rewindAt = Date.now(); toast("⏪ −10 секунд (локально)"); }
    if (t === "tp-xray") { S.xray = true; app.classList.add("xray"); toast("🩻 Рентген"); }
    if (t === "tp-archive") { S.archive = true; toast("🗂 Архиватор: клик удаляет"); }
    if (t === "tp-owl") { showOwl(); S.freeze = true; setTimeout(() => { S.freeze = false; }, 2000); toast("🦉 Сова на скакалке"); }
    if (t === "tp-tesla") { S.scoreBoost = 1000000; toast("⚡ Перегрузка Теслы · +1 000 000"); }
    if (t === "tp-console") {
      const el = document.getElementById("devCon") || app.querySelector(".console");
      if (el) { el.classList.add("open"); el.style.display = "flex"; }
      toast("💻 Консоль: MONEY / GOD / WIN / OWL");
    }
    if (t === "tp-hammer") { toast("🔨 Бан-хаммер: цель стёрта"); S.archive = true; }
    if (t === "tp-spawn") { toast("✨ Спавнер: бонус создан"); S.scoreBoost = Math.max(S.scoreBoost, 10); }
    if (t === "tp-lag") { S.lag = true; toast("🐢 Лаг-гравитация: враги зависли"); }
    if (t === "max") { S.god = true; S.xray = true; S.scoreBoost = 1000; }
    if (t === "coins") S.scoreBoost = 1000000;
  });
  window.addEventListener("ten-win", () => toast("Победа хозяина"));

  go("hub");
})();
