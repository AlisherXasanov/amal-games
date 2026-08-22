(() => {
  "use strict";
  const stage = document.getElementById("stage");
  const owlFx = document.getElementById("owlFx");
  const toastEl = document.getElementById("tenToast");
  const sub = document.getElementById("arcSub");
  const navHome = document.getElementById("navHome");
  const pwrBtn = document.getElementById("pwrBtn");
  const pwrSheet = document.getElementById("pwrSheet");

  const GAMES = [
    { id: "fortune", n: "01", ico: "🦉", title: "Генератор катастроф", blurb: "Колода: сова + абсурдное предсказание", bg: "linear-gradient(160deg,#7c3aed,#db2777)" },
    { id: "beetle", n: "02", ico: "🪲", title: "Эволюция жука", blurb: "Кликер до жука размером с планету", bg: "linear-gradient(160deg,#15803d,#65a30d)" },
    { id: "planet", n: "03", ico: "⚡", title: "Не взорви планету", blurb: "Заряжай катушку Теслы и не спали Землю", bg: "linear-gradient(160deg,#0e7490,#2563eb)" },
    { id: "spice", n: "04", ico: "🌶️", title: "Шкала остроты", blurb: "Лови перец и молоко. Не сгори", bg: "linear-gradient(160deg,#b91c1c,#f97316)" },
    { id: "doors", n: "05", ico: "🚪", title: "Выбивание дверей", blurb: "Коридор из папок. Кликай до сбоя", bg: "linear-gradient(160deg,#92400e,#f59e0b)" },
    { id: "audio", n: "06", ico: "🎧", title: "Жук по звуку", blurb: "Жужжание, треск или Тесла?", bg: "linear-gradient(160deg,#9d174d,#e879f9)" },
    { id: "office", n: "07", ico: "💥", title: "Разрушитель офиса", blurb: "Молот, лазер, молния — круши папки", bg: "linear-gradient(160deg,#1d4ed8,#38bdf8)" },
    { id: "maze", n: "08", ico: "🌑", title: "Слепая зона", blurb: "Тёмный лабиринт со светлячком", bg: "linear-gradient(160deg,#111827,#4c1d95)" },
    { id: "debate", n: "09", ico: "🔥", title: "Острый спор", blurb: "Дуэль с ботом. Соус жжёт логику", bg: "linear-gradient(160deg,#c2410c,#fbbf24)" },
    { id: "grid", n: "10", ico: "🔌", title: "Электросеть", blurb: "Крути провода к катушке Теслы", bg: "linear-gradient(160deg,#0f766e,#22d3ee)" },
  ];

  const S = { god: false, freeze: false, slow: false, xray: false, lag: false, archive: false, scoreBoost: 1 };
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
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 1500);
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
  function titleOf(id) {
    const g = GAMES.find((x) => x.id === id);
    return g ? g.ico + " " + g.title : "AMAL ARCADE";
  }
  function go(id) {
    stopLoop();
    current = id;
    navHome.classList.toggle("on", id === "hub");
    sub.textContent = id === "hub" ? "10 игр · одно приложение" : titleOf(id);
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

  function renderHub() {
    stage.innerHTML =
      `<div class="home-title">Все игры внутри приложения<small>Нажми плитку — игра открывается здесь же, без ухода со страницы</small></div>` +
      `<div class="apps">${GAMES.map((g) =>
        `<button class="app" type="button" data-g="${g.id}" style="background:${g.bg}"><span class="n">${g.n}</span><span class="ico">${g.ico}</span><b>${g.title}</b><span>${g.blurb}</span></button>`
      ).join("")}</div>`;
    stage.querySelectorAll("[data-g]").forEach((b) => {
      b.onclick = () => go(b.getAttribute("data-g"));
    });
  }

  function startFortune() {
    const owls = ["🦉", "🦉💫", "🦉🔥", "🦉⚡"];
    const lines = [
      "Завтра все папки на рабочем столе объявят забастовку.",
      "Катушка Теслы шепнёт пароль от Wi‑Fi соседа.",
      "Жук станет менеджером и попросит отпуск.",
      "Соус будет таким острым, что спор выиграет сам.",
      "Дверь-папка откроется в параллельный вторник.",
      "Планета не взорвётся. Почти. На 87%.",
    ];
    stage.innerHTML = `<div class="stage"><p class="sub">Жми карту — выпадет мем-предсказание.</p>
      <div class="cards"><div class="cardx" id="c1">?</div><div class="cardx" id="c2">?</div><div class="cardx" id="c3">?</div></div>
      <button type="button" class="act big" id="draw">Перемешать колоду</button>
      <div class="pred" id="pred">Нажми колоду…</div></div>`;
    const draw = () => {
      beep(220, 40);
      document.getElementById("c1").textContent = owls[Math.floor(Math.random() * owls.length)];
      document.getElementById("c2").textContent = ["🔥", "⚡", "📁", "🌶️"][Math.floor(Math.random() * 4)];
      document.getElementById("c3").textContent = ["💥", "🌍", "🪲", "🪄"][Math.floor(Math.random() * 4)];
      document.getElementById("pred").textContent = lines[Math.floor(Math.random() * lines.length)];
    };
    document.getElementById("draw").onclick = draw;
    stage.querySelectorAll(".cardx").forEach((c) => { c.onclick = draw; });
  }

  function startBeetle() {
    const forms = ["микро-жук", "скарабей", "носорог", "геркулес", "космический жук-планета"];
    let energy = 0, form = 0, auto = 0;
    const need = [20, 80, 250, 900, 99999];
    stage.innerHTML = `<div class="stage" style="text-align:center">
      <div id="bug" style="font-size:72px;cursor:pointer">🪲</div>
      <div class="hud"><span id="en">энергия 0</span><span id="fm"></span></div>
      <button type="button" class="act" id="buy">Купить автоклик</button>
    </div>`;
    const paint = () => {
      document.getElementById("en").textContent = "энергия: " + Math.floor(energy * S.scoreBoost);
      document.getElementById("fm").textContent = forms[form];
      document.getElementById("bug").textContent = ["🪲", "🐞", "🦗", "🦂", "🪐"][form];
    };
    const tick = () => {
      energy += auto * 0.04 * dtMul();
      while (form < 4 && energy >= need[form]) form++;
      paint();
      loopId = requestAnimationFrame(tick);
    };
    document.getElementById("bug").onclick = () => { energy += S.god ? 50 : 1; beep(300 + form * 40, 40); paint(); };
    document.getElementById("buy").onclick = () => { if (energy >= 30) { energy -= 30; auto += 1; toast("Автоклик +1"); } };
    loopId = requestAnimationFrame(tick);
  }

  function startPlanet() {
    let heat = 0, holding = false, alive = true, time = 0, best = 0;
    stage.innerHTML = `<div class="stage" style="text-align:center">
      <div style="font-size:64px">🌍⚡</div>
      <div class="hud"><span id="ht">жар 0%</span><span id="tm">0с</span></div>
      <div style="height:14px;background:#1e293b;border-radius:8px;overflow:hidden"><div id="bar" style="height:100%;width:0;background:#22d3ee"></div></div>
      <p class="sub">Зелёная зона 40–70%. Зажми CHARGE, отпусти вовремя.</p>
      <button type="button" class="act big" id="chg">CHARGE</button>
    </div>`;
    const chg = document.getElementById("chg");
    chg.onpointerdown = () => { holding = true; };
    window.onpointerup = () => { holding = false; };
    const tick = () => {
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

  function startSpice() {
    const c = document.createElement("canvas");
    c.width = 480; c.height = 320;
    stage.innerHTML = `<div class="stage"><div class="hud"><span id="scv">Сковилл 0</span><span id="sc">очки 0</span></div><p class="sub">Води пальцем / мышью — лови 🌶️ и 🥛</p></div>`;
    stage.querySelector(".stage").appendChild(c);
    const ctx = c.getContext("2d");
    let x = 240, burn = 20, score = 0, items = [], acc = 0;
    c.onpointermove = (e) => {
      const r = c.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 480;
    };
    const tick = () => {
      acc += dtMul();
      if (acc > 18) { acc = 0; items.push({ x: 30 + Math.random() * 420, y: -10, k: Math.random() < 0.7 ? "hot" : "milk" }); }
      ctx.fillStyle = "#081018";
      ctx.fillRect(0, 0, 480, 320);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(x - 24, 292, 48, 18);
      ctx.font = "20px system-ui";
      items.forEach((it) => {
        it.y += (S.god ? 1.2 : 2.4) * dtMul();
        ctx.fillText(it.k === "hot" ? "🌶️" : "🥛", it.x, it.y);
        if (it.y > 286 && Math.abs(it.x - x) < 30) {
          it.dead = true;
          burn += it.k === "hot" ? (S.god ? 2 : 12) : -18;
          burn = Math.max(0, burn);
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

  function startDoors() {
    let dist = 0, door = 18, fail = 0, run = true;
    stage.innerHTML = `<div class="stage" style="text-align:center">
      <div style="font-size:64px">🏃📁</div>
      <div class="hud"><span id="hp">дверь 18</span><span id="fl">сбой 0%</span></div>
      <p class="sub">Жми быстро, пока системный сбой не догнал.</p>
      <button type="button" class="act big" id="kick">ВЫБИТЬ</button>
    </div>`;
    document.getElementById("kick").onclick = () => {
      if (!run) return;
      door -= S.god ? 6 : 1;
      beep(180, 30);
      if (door <= 0) { dist++; door = 14 + dist * 2; toast("Дверь " + dist + " выбита"); }
    };
    const tick = () => {
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

  function startAudio() {
    const opts = [
      { id: "herc", name: "Жук-геркулес", f: 90 },
      { id: "mosq", name: "Комар", f: 480 },
      { id: "tesla", name: "Катушка Теслы", f: 140 },
    ];
    let cur = opts[0];
    stage.innerHTML = `<div class="stage">
      <p class="sub">Слушай и выбирай.</p>
      <button type="button" class="act big" id="playS">▶ Звук</button>
      <div class="choices" id="chs"></div>
      <div class="pred" id="fact"></div>
    </div>`;
    const next = () => {
      cur = opts[Math.floor(Math.random() * opts.length)];
      document.getElementById("chs").innerHTML = opts.map((o) => `<button type="button" data-id="${o.id}">${o.name}</button>`).join("");
    };
    document.getElementById("chs").onclick = (e) => {
      const id = e.target && e.target.getAttribute("data-id");
      if (!id) return;
      if (S.xray || S.god || id === cur.id) {
        toast("Верно");
        document.getElementById("fact").textContent = cur.id === "tesla" ? "Тесла трещит на высоких гармониках — это не жук." : "Насекомые «поют» крыльями: частота выдаёт вид.";
        next();
      } else toast("Мимо");
    };
    document.getElementById("playS").onclick = () => {
      for (let i = 0; i < 6; i++) setTimeout(() => beep(cur.f + (i % 2 ? 40 : 0), 70), i * 90);
    };
    next();
  }

  function startOffice() {
    let weapon = "hammer", smashed = 0;
    stage.innerHTML = `<div class="weapons">
      <button type="button" data-w="hammer">🔨 Молот</button>
      <button type="button" data-w="laser">🔴 Лазер</button>
      <button type="button" data-w="tesla">⚡ Тесла</button>
    </div><div class="desktop" id="desk"></div><div class="hud"><span id="sm">0 папок</span></div>`;
    stage.querySelectorAll("[data-w]").forEach((b) => {
      b.onclick = () => { weapon = b.getAttribute("data-w"); toast(b.textContent); };
    });
    const desk = document.getElementById("desk");
    for (let i = 0; i < 10; i++) {
      const f = document.createElement("div");
      f.className = "folder";
      f.textContent = "📁\ncache";
      f.style.left = 8 + Math.random() * 72 + "%";
      f.style.top = 10 + Math.random() * 68 + "%";
      f.onclick = () => {
        f.remove();
        smashed++;
        beep(weapon === "tesla" ? 90 : 200, 50);
        document.getElementById("sm").textContent = smashed + " папок в корзине";
      };
      desk.appendChild(f);
    }
  }

  function startMaze() {
    const c = document.createElement("canvas");
    c.width = 420; c.height = 420;
    stage.innerHTML = `<div class="stage"><p class="sub">Стрелки / WASD. Свет только вокруг тебя.</p></div>`;
    stage.querySelector(".stage").appendChild(c);
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
      const dx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
      const dy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
      const nx = px + dx, ny = py + dy;
      if (nx >= 0 && ny >= 0 && nx < n && ny < n && (S.god || !maze[ny][nx] || S.archive)) { px = nx; py = ny; }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 420, 420);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const vis = S.xray || S.god || Math.hypot(x - px, y - py) < 1.7;
        if (!vis) continue;
        ctx.fillStyle = maze[y][x] ? "#334155" : "#0f172a";
        ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
      }
      ctx.fillStyle = "#fde68a";
      ctx.beginPath(); ctx.arc(px * cell + cell / 2, py * cell + cell / 2, 8, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect((n - 2) * cell + 8, (n - 2) * cell + 8, cell - 16, cell - 16);
      if (px === n - 2 && py === n - 2) toast("✨ Выход найден");
      keys = {};
      loopId = requestAnimationFrame(tick);
    };
    loopId = requestAnimationFrame(tick);
  }

  function startDebate() {
    const qs = [
      { q: "Почему катушка Теслы лучше лампы?", a: ["Даёт шоу и озон", "Потому что громче", "Просто так"] },
      { q: "Жук-геркулес силён, потому что…", a: ["Отношение силы к массе огромное", "Он злой", "Пьёт кофе"] },
      { q: "Острый перец жжёт из‑за…", a: ["Капсаицина", "Огня внутри", "Магии совы"] },
    ];
    let i = 0, heat = 1;
    stage.innerHTML = `<div class="stage"><div class="msg bot" id="bq"></div><div class="choices" id="ba"></div><div class="hud"><span id="hs">острота ×1</span></div></div>`;
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
      document.getElementById("hs").textContent = "острота ×" + heat;
      show();
    };
    show();
  }

  function startGrid() {
    const tiles = [];
    for (let i = 0; i < 25; i++) tiles.push(Math.floor(Math.random() * 4));
    tiles[0] = 1; tiles[24] = 1;
    stage.innerHTML = `<div class="stage"><p class="sub">Кликай клетку — крутится провод. Соедини ⚡ с 🌀</p>
      <div id="grid" style="display:grid;grid-template-columns:repeat(5,48px);gap:6px;justify-content:center"></div>
      <div class="pred" id="ok"></div></div>`;
    const glyph = ["│", "─", "┐", "┘"];
    const box = document.getElementById("grid");
    const paint = () => {
      box.innerHTML = tiles.map((t, i) => `<button type="button" class="act" data-i="${i}" style="width:48px;height:48px;padding:0;font-size:22px">${i === 0 ? "⚡" : i === 24 ? "🌀" : glyph[t % 4]}</button>`).join("");
    };
    box.onclick = (e) => {
      const i = e.target && e.target.getAttribute("data-i");
      if (i == null) return;
      tiles[+i] = (tiles[+i] + 1) % 4;
      paint();
      if (S.god || (tiles[0] === 1 && tiles[24] === 1 && tiles.slice(1, 24).filter((t) => t === 1).length >= 3)) {
        document.getElementById("ok").textContent = "⚡ Катушка бьёт молнией — уровень пройден!";
        beep(80, 200);
      }
    };
    paint();
  }

  navHome.onclick = () => go("hub");

  function isOwner() {
    try {
      if (window.AmalPowers && typeof AmalPowers.isOwner === "function" && AmalPowers.isOwner()) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (new URLSearchParams(location.search).get("owner")) return true;
    } catch (_) {}
    return false;
  }
  if (isOwner()) {
    pwrBtn.hidden = false;
    const ids = [
      ["tp-rewind", "⏪ −10с"], ["tp-freeze", "⏸ стоп"], ["tp-god", "🛡 бог"],
      ["tp-owl", "🦉 сова"], ["tp-tesla", "⚡ тесла"], ["tp-xray", "🩻 рентген"],
      ["tp-hammer", "🔨 бан"], ["tp-lag", "🐢 лаг"],
    ];
    document.getElementById("pwrGrid").innerHTML = ids.map(([id, l]) => `<button type="button" data-p="${id}">${l}</button>`).join("");
    pwrBtn.onclick = () => { pwrSheet.hidden = !pwrSheet.hidden; };
    document.getElementById("pwrGrid").onclick = (e) => {
      const id = e.target && e.target.getAttribute("data-p");
      if (!id) return;
      window.dispatchEvent(new CustomEvent("amal-power", { detail: { type: id } }));
    };
    document.getElementById("devGo").onclick = () => {
      const cmd = String(document.getElementById("devCmd").value || "").trim().toUpperCase();
      if (cmd === "MONEY") { S.scoreBoost = 1000000; toast("💰"); }
      else if (cmd === "GOD") { S.god = true; toast("🛡"); }
      else if (cmd === "OWL") showOwl();
      else if (cmd === "WIN") toast("🏁");
    };
  }

  window.addEventListener("amal-power", (e) => {
    const t = (e.detail && e.detail.type) || "";
    if (t === "god" || t === "tp-god") S.god = true;
    if (t === "tp-freeze") S.freeze = !S.freeze;
    if (t === "tp-slow") S.slow = true;
    if (t === "tp-xray") S.xray = true;
    if (t === "tp-archive" || t === "tp-hammer") S.archive = true;
    if (t === "tp-owl") { showOwl(); S.freeze = true; setTimeout(() => { S.freeze = false; }, 1800); }
    if (t === "tp-tesla") S.scoreBoost = 1000000;
    if (t === "tp-lag") S.lag = true;
    if (t === "max" || t === "coins") { S.god = true; S.scoreBoost = 1000; }
    toast("⚡ " + t);
  });

  go("hub");
})();
