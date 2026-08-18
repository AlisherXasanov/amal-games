(() => {
  "use strict";
  const game = document.body.getAttribute("data-game") || "fortune";
  const stage = document.getElementById("stage");
  const toastEl = document.getElementById("toast");
  const S = { god: false, freeze: false, slow: false, xray: false, scoreBoost: 1 };
  let loopId = 0, audioCtx = null;
  function dtMul() {
    if (S.freeze) return 0;
    if (S.slow) return 0.2;
    return 1;
  }
  function toast(t) {
    if (!toastEl) return;
    toastEl.textContent = t;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 1400);
  }
  function beep(f, ms) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = f; o.type = "square"; g.gain.value = 0.05;
      o.connect(g); g.connect(audioCtx.destination); o.start();
      setTimeout(() => { try { o.stop(); } catch (_) {} }, ms || 80);
    } catch (_) {}
  }
  function stop() { if (loopId) cancelAnimationFrame(loopId); loopId = 0; }

  function fortune() {
    const owls = ["🦉", "🦉💫", "🦉🔥", "🦉⚡"];
    const lines = [
      "Завтра все папки на рабочем столе объявят забастовку.",
      "Катушка Теслы шепнёт пароль от Wi‑Fi соседа.",
      "Жук станет менеджером и попросит отпуск.",
      "Соус будет таким острым, что спор выиграет сам.",
      "Дверь-папка откроется в параллельный вторник.",
      "Планета не взорвётся. Почти. На 87%.",
    ];
    stage.innerHTML = `<p class="sub">Жми карту — выпадет мем-предсказание.</p>
      <div class="cards"><div class="cardx" id="c1">?</div><div class="cardx" id="c2">?</div><div class="cardx" id="c3">?</div></div>
      <button type="button" class="act big" id="draw">Перемешать колоду</button>
      <div class="pred" id="pred">Нажми колоду…</div>`;
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

  function beetle() {
    const forms = ["микро-жук", "скарабей", "носорог", "геркулес", "космический жук-планета"];
    let energy = 0, form = 0, auto = 0;
    const need = [20, 80, 250, 900, 99999];
    stage.innerHTML = `<div style="text-align:center"><div id="bug" style="font-size:72px;cursor:pointer">🪲</div>
      <div class="hud"><span id="en">энергия 0</span><span id="fm"></span></div>
      <button type="button" class="act" id="buy">Купить автоклик</button></div>`;
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
    document.getElementById("bug").onclick = () => { energy += S.god ? 50 : 1; beep(300, 40); paint(); };
    document.getElementById("buy").onclick = () => { if (energy >= 30) { energy -= 30; auto += 1; toast("Автоклик +1"); } };
    loopId = requestAnimationFrame(tick);
  }

  function planet() {
    let heat = 0, holding = false, alive = true, t = 0, best = 0;
    stage.innerHTML = `<div style="text-align:center"><div style="font-size:64px">🌍⚡</div>
      <div class="hud"><span id="ht">жар 0%</span><span id="tm">0с</span></div>
      <div style="height:14px;background:#1e293b;border-radius:8px;overflow:hidden"><div id="bar" style="height:100%;width:0;background:#22d3ee"></div></div>
      <p class="sub">Зелёная зона 40–70%. Зажми CHARGE, отпусти вовремя.</p>
      <button type="button" class="act big" id="chg">CHARGE</button></div>`;
    document.getElementById("chg").onpointerdown = () => { holding = true; };
    window.onpointerup = () => { holding = false; };
    const tick = () => {
      const d = 0.016 * dtMul(); t += d;
      if (alive) {
        if (holding) heat += d * (S.god ? 8 : 28);
        else heat = Math.max(0, heat - d * 18);
        if (!S.god && heat > 100) { alive = false; toast("💥 Планета взорвалась"); }
        best = Math.max(best, t);
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

  function spice() {
    const c = document.createElement("canvas");
    c.width = 480; c.height = 320;
    stage.innerHTML = `<div class="hud"><span id="scv">Сковилл 0</span><span id="sc">очки 0</span></div><p class="sub">Води пальцем — лови 🌶️ и 🥛</p>`;
    stage.appendChild(c);
    const ctx = c.getContext("2d");
    let x = 240, burn = 20, score = 0, items = [], acc = 0;
    c.onpointermove = (e) => { const r = c.getBoundingClientRect(); x = ((e.clientX - r.left) / r.width) * 480; };
    const tick = () => {
      acc += dtMul();
      if (acc > 18) { acc = 0; items.push({ x: 30 + Math.random() * 420, y: -10, k: Math.random() < 0.7 ? "hot" : "milk" }); }
      ctx.fillStyle = "#081018"; ctx.fillRect(0, 0, 480, 320);
      ctx.fillStyle = "#fbbf24"; ctx.fillRect(x - 24, 292, 48, 18);
      ctx.font = "20px system-ui";
      items.forEach((it) => {
        it.y += 2.4 * dtMul();
        ctx.fillText(it.k === "hot" ? "🌶️" : "🥛", it.x, it.y);
        if (it.y > 286 && Math.abs(it.x - x) < 30) {
          it.dead = true;
          burn = Math.max(0, burn + (it.k === "hot" ? 12 : -18));
          score += 10 * S.scoreBoost;
          beep(it.k === "hot" ? 520 : 240, 40);
        }
      });
      items = items.filter((it) => !it.dead && it.y < 340);
      if (burn >= 100) { toast("🔥 Сгорел!"); burn = 20; score = Math.max(0, score - 30); }
      document.getElementById("scv").textContent = "Сковилл " + Math.floor(burn);
      document.getElementById("sc").textContent = "очки " + Math.floor(score);
      loopId = requestAnimationFrame(tick);
    };
    loopId = requestAnimationFrame(tick);
  }

  function doors() {
    let dist = 0, door = 18, fail = 0, run = true;
    stage.innerHTML = `<div style="text-align:center"><div style="font-size:64px">🏃📁</div>
      <div class="hud"><span id="hp">дверь 18</span><span id="fl">сбой 0%</span></div>
      <p class="sub">Жми быстро, пока системный сбой не догнал.</p>
      <button type="button" class="act big" id="kick">ВЫБИТЬ</button></div>`;
    document.getElementById("kick").onclick = () => {
      if (!run) return;
      door -= 1; beep(180, 30);
      if (door <= 0) { dist++; door = 14 + dist * 2; toast("Дверь " + dist); }
    };
    const tick = () => {
      if (run) { fail += 7 * 0.016 * dtMul(); if (fail >= 100) { run = false; toast("💀 Сбой догнал"); } }
      document.getElementById("hp").textContent = "дверь " + Math.max(0, Math.ceil(door));
      document.getElementById("fl").textContent = "сбой " + Math.floor(fail) + "% · папок " + dist;
      loopId = requestAnimationFrame(tick);
    };
    loopId = requestAnimationFrame(tick);
  }

  function audio() {
    const opts = [
      { id: "herc", name: "Жук-геркулес", f: 90 },
      { id: "mosq", name: "Комар", f: 480 },
      { id: "tesla", name: "Катушка Теслы", f: 140 },
    ];
    let cur = opts[0];
    stage.innerHTML = `<p class="sub">Слушай и выбирай.</p>
      <button type="button" class="act big" id="playS">▶ Звук</button>
      <div class="choices" id="chs"></div><div class="pred" id="fact"></div>`;
    const next = () => {
      cur = opts[Math.floor(Math.random() * opts.length)];
      document.getElementById("chs").innerHTML = opts.map((o) => `<button type="button" data-id="${o.id}">${o.name}</button>`).join("");
    };
    document.getElementById("chs").onclick = (e) => {
      const id = e.target && e.target.getAttribute("data-id");
      if (!id) return;
      if (id === cur.id) {
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

  function office() {
    let weapon = "hammer", smashed = 0;
    stage.innerHTML = `<div class="weapons">
      <button type="button" data-w="hammer">🔨 Молот</button>
      <button type="button" data-w="laser">🔴 Лазер</button>
      <button type="button" data-w="tesla">⚡ Тесла</button>
    </div><div class="desktop" id="desk"></div><div class="hud"><span id="sm">0 папок</span></div>`;
    stage.querySelectorAll("[data-w]").forEach((b) => { b.onclick = () => { weapon = b.getAttribute("data-w"); toast(b.textContent); }; });
    const desk = document.getElementById("desk");
    for (let i = 0; i < 10; i++) {
      const f = document.createElement("div");
      f.className = "folder";
      f.textContent = "📁\ncache";
      f.style.left = 8 + Math.random() * 72 + "%";
      f.style.top = 10 + Math.random() * 68 + "%";
      f.onclick = () => {
        f.remove(); smashed++;
        beep(weapon === "tesla" ? 90 : 200, 50);
        document.getElementById("sm").textContent = smashed + " папок в корзине";
      };
      desk.appendChild(f);
    }
  }

  function maze() {
    const c = document.createElement("canvas");
    c.width = 420; c.height = 420;
    stage.innerHTML = `<p class="sub">Стрелки / WASD. Свет только вокруг тебя.</p>`;
    stage.appendChild(c);
    const ctx = c.getContext("2d");
    const n = 11, maze = [];
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
      if (nx >= 0 && ny >= 0 && nx < n && ny < n && !maze[ny][nx]) { px = nx; py = ny; }
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 420, 420);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (Math.hypot(x - px, y - py) >= 1.7) continue;
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

  function debate() {
    const qs = [
      { q: "Почему катушка Теслы лучше лампы?", a: ["Даёт шоу и озон", "Потому что громче", "Просто так"] },
      { q: "Жук-геркулес силён, потому что…", a: ["Отношение силы к массе огромное", "Он злой", "Пьёт кофе"] },
      { q: "Острый перец жжёт из‑за…", a: ["Капсаицина", "Огня внутри", "Магии совы"] },
    ];
    let i = 0, heat = 1;
    stage.innerHTML = `<div class="msg bot" id="bq"></div><div class="choices" id="ba"></div><div class="hud"><span id="hs">острота ×1</span></div>`;
    const show = () => {
      if (i >= qs.length) { document.getElementById("bq").textContent = "Бот сдался. Соус победил."; return; }
      const t = qs[i];
      document.getElementById("bq").textContent = "Бот: " + t.q;
      document.getElementById("ba").innerHTML = t.a.map((x, k) => `<button type="button" data-k="${k}">${x}</button>`).join("");
    };
    document.getElementById("ba").onclick = (e) => {
      const k = e.target && e.target.getAttribute("data-k");
      if (k == null) return;
      if (k === "0") { heat++; toast("Соус жжёт логику бота"); i++; }
      else { heat = Math.max(1, heat - 1); toast("😢 Жжёт тебя"); }
      document.getElementById("hs").textContent = "острота ×" + heat;
      show();
    };
    show();
  }

  function grid() {
    const tiles = [];
    for (let i = 0; i < 25; i++) tiles.push(Math.floor(Math.random() * 4));
    tiles[0] = 1; tiles[24] = 1;
    stage.innerHTML = `<p class="sub">Кликай клетку — крутится провод. Соедини ⚡ с 🌀</p>
      <div id="grid" style="display:grid;grid-template-columns:repeat(5,48px);gap:6px;justify-content:center"></div>
      <div class="pred" id="ok"></div>`;
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
      if (tiles[0] === 1 && tiles[24] === 1 && tiles.slice(1, 24).filter((t) => t === 1).length >= 3) {
        document.getElementById("ok").textContent = "⚡ Катушка бьёт молнией — уровень пройден!";
        beep(80, 200);
      }
    };
    paint();
  }

  const map = { fortune, beetle, planet, spice, doors, audio, office, maze, debate, grid };
  stop();
  (map[game] || fortune)();
})();
