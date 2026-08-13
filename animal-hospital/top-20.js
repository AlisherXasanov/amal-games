(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const hub = document.getElementById("hub");
  const play = document.getElementById("play");
  const win = document.getElementById("win");
  const cards = document.getElementById("cards");
  const playTitle = document.getElementById("playTitle");
  const playStat = document.getElementById("playStat");
  const bubble = document.getElementById("bubble");
  const uiExtra = document.getElementById("uiExtra");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  const APPS = [
    { id: "snake", ico: "🐍", title: "1 · Неон-змейка", desc: "Классика · WASD · яблоки" },
    { id: "fire", ico: "🎆", title: "2 · Фейерверк", desc: "Клик — запуск салюта" },
    { id: "beat", ico: "🥁", title: "3 · Бит-pad", desc: "8 ударов · звук" },
    { id: "draw", ico: "🎨", title: "4 · Рисовалка", desc: "Мышь · цвета · стирка" },
    { id: "oracle", ico: "🔮", title: "5 · Оракул", desc: "Предсказание на день" },
    { id: "timer", ico: "⏱", title: "6 · Таймер", desc: "Секундомер · пробел" },
    { id: "react", ico: "⚡", title: "7 · Реакция", desc: "Клик когда зелёный" },
    { id: "bubble", ico: "🫧", title: "8 · Пузыри", desc: "Лопай · счёт" },
    { id: "gravity", ico: "🪐", title: "9 · Гравитация", desc: "Шарики · клик" },
    { id: "warp", ico: "🚀", title: "10 · Звёздный полёт", desc: "Гиперпространство" },
    { id: "memory", ico: "🧠", title: "11 · Память", desc: "Найди пары" },
    { id: "flappy", ico: "🐦", title: "12 · Flappy", desc: "Пробел · трубы" },
    { id: "merge", ico: "🔢", title: "13 · Merge 2048", desc: "Стрелки · сливай" },
    { id: "mood", ico: "🌈", title: "14 · Настроение", desc: "Цвет комнаты" },
    { id: "echo", ico: "💬", title: "15 · Эхо-бот", desc: "Напиши — отвечу" },
    { id: "jump", ico: "🏃", title: "16 · Платформер", desc: "A D · пробел прыжок" },
    { id: "kaleido", ico: "✨", title: "17 · Kaleidoscope", desc: "Мышь · узоры" },
    { id: "rain", ico: "🌧", title: "18 · Matrix Rain", desc: "Кибер-дождь" },
    { id: "orbit", ico: "🌍", title: "19 · Орбиты", desc: "Планеты · клик" },
    { id: "cipher", ico: "🔐", title: "20 · Шифр", desc: "Секретный код" },
  ];

  const keys = Object.create(null);
  let g = null;
  let appId = null;
  let last = performance.now();
  let bubbleT = 0;
  let pointer = { x: VW / 2, y: VH / 2, down: false };
  let audioCtx = null;

  const ORACLE = [
    "Сегодня будет удачный день.",
    "Кто-то думает о тебе прямо сейчас.",
    "Смелый шаг принесёт сюрприз.",
    "Отдых — тоже победа.",
    "Звезда смотрит в твою сторону.",
    "Не бойся ошибиться — бойся не попробовать.",
    "Скоро хорошая новость.",
    "Ты сильнее, чем кажется.",
  ];

  const ECHO = [
    "Слышу тебя.",
    "Интересная мысль.",
    "Продолжай — я рядом.",
    "Запомню это.",
    "Хм… а если наоборот?",
    "Ты молодец, что написал.",
    "Это звучит как начало истории.",
  ];

  const MOODS = [
    { name: "Счастье", c1: "#ffd76a", c2: "#ff9040" },
    { name: "Спокойствие", c1: "#7ec8ff", c2: "#4080c0" },
    { name: "Тайна", c1: "#a070ff", c2: "#402060" },
    { name: "Лес", c1: "#5ecf7a", c2: "#286040" },
    { name: "Ночь", c1: "#304060", c2: "#080810" },
  ];

  function say(t, sec) {
    bubble.textContent = t;
    bubble.hidden = false;
    bubbleT = sec || 2.5;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function beep(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const gN = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      gN.gain.value = 0.12;
      o.connect(gN);
      gN.connect(audioCtx.destination);
      o.start();
      gN.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VW,
      y: ((e.clientY - r.top) / r.height) * VH,
    };
  }

  function showHub() {
    g = null;
    appId = null;
    hub.hidden = false;
    play.hidden = true;
    win.hidden = true;
    uiExtra.innerHTML = "";
    bubble.hidden = true;
  }

  function finish(text) {
    if (!g || g.done) return;
    g.done = true;
    winText.textContent = text;
    winCode.textContent = "BEST CONSOLE · " + String(((Date.now() / 1000) | 0) % 100000);
    win.hidden = false;
  }

  function bg(c1, c2) {
    const grd = ctx.createLinearGradient(0, 0, 0, VH);
    grd.addColorStop(0, c1 || "#101624");
    grd.addColorStop(1, c2 || "#080610");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);
  }

  // --- 1 SNAKE ---
  function initSnake() {
    g = { t: 0, cell: 24, snake: [{ x: 10, y: 8 }], dir: { x: 1, y: 0 }, next: { x: 1, y: 0 }, food: { x: 18, y: 8 }, score: 0, tick: 0, done: false };
    playStat.textContent = "WASD · счёт 0";
    say("Неон-змейка. Не врежься в стену.", 2.5);
  }
  function updateSnake(dt) {
    g.tick += dt;
    if (g.tick < 0.11) return;
    g.tick = 0;
    if (keys.ArrowUp || keys.w || keys.W) g.next = { x: 0, y: -1 };
    if (keys.ArrowDown || keys.s || keys.S) g.next = { x: 0, y: 1 };
    if (keys.ArrowLeft || keys.a || keys.A) g.next = { x: -1, y: 0 };
    if (keys.ArrowRight || keys.d || keys.D) g.next = { x: 1, y: 0 };
    if (g.next.x !== -g.dir.x || g.next.y !== -g.dir.y) g.dir = g.next;
    const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
    const cols = Math.floor(VW / g.cell);
    const rows = Math.floor(VH / g.cell);
    if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || g.snake.some((s) => s.x === head.x && s.y === head.y)) {
      finish("Змейка · конец. Счёт " + g.score);
      return;
    }
    g.snake.unshift(head);
    if (head.x === g.food.x && head.y === g.food.y) {
      g.score++;
      playStat.textContent = "счёт " + g.score;
      beep(440 + g.score * 20, 0.08);
      do {
        g.food = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
      } while (g.snake.some((s) => s.x === g.food.x && s.y === g.food.y));
    } else g.snake.pop();
  }
  function drawSnake() {
    bg("#081018", "#101830");
    ctx.strokeStyle = "rgba(126,200,255,0.08)";
    for (let x = 0; x < VW; x += g.cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VH); ctx.stroke(); }
    for (let y = 0; y < VH; y += g.cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); }
    ctx.fillStyle = "#ff4060";
    ctx.fillRect(g.food.x * g.cell + 2, g.food.y * g.cell + 2, g.cell - 4, g.cell - 4);
    g.snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#7ef0c0" : "#40c090";
      ctx.fillRect(s.x * g.cell + 1, s.y * g.cell + 1, g.cell - 2, g.cell - 2);
    });
  }

  // --- 2 FIREWORKS ---
  function initFire() {
    g = { t: 0, parts: [], done: false };
    playStat.textContent = "клик — салют · " + 0;
    say("Жми по экрану — фейерверк!", 2);
  }
  function updateFire(dt) {
    if (pointer.down) {
      g.parts.push({ x: pointer.x, y: VH, vx: rand(-40, 40), vy: rand(-520, -380), life: rand(0.8, 1.2), hue: rand(0, 360), trail: true });
      pointer.down = false;
      beep(rand(200, 400), 0.05);
    }
    for (const p of g.parts) {
      p.life -= dt;
      p.vy += 180 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.trail && p.vy > 0) {
        p.trail = false;
        for (let i = 0; i < 40; i++) {
          g.parts.push({ x: p.x, y: p.y, vx: rand(-200, 200), vy: rand(-200, 200), life: rand(0.4, 1), hue: p.hue + rand(-30, 30), trail: false });
        }
        beep(rand(300, 600), 0.1);
      }
    }
    g.parts = g.parts.filter((p) => p.life > 0);
    playStat.textContent = "частиц " + g.parts.length;
  }
  function drawFire() {
    bg("#050510", "#101028");
    for (const p of g.parts) {
      ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + p.life * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- 3 BEAT ---
  const BEAT_FREQ = [261, 294, 330, 349, 392, 440, 494, 523];
  function initBeat() {
    g = { t: 0, hits: 0, done: false };
    playStat.textContent = "8 pads";
    uiExtra.innerHTML = BEAT_FREQ.map((f, i) => `<button type="button" class="pad-btn" data-i="${i}">${i + 1}</button>`).join("");
    uiExtra.querySelectorAll(".pad-btn").forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.i;
        beep(BEAT_FREQ[i], 0.15);
        g.hits++;
        playStat.textContent = "ударов " + g.hits;
        btn.style.background = "rgba(255,144,64,0.5)";
        setTimeout(() => { btn.style.background = ""; }, 80);
      };
    });
    say("Бит-pad. Жми цифры.", 2);
  }
  function updateBeat() {}
  function drawBeat() {
    bg("#180818", "#281030");
    ctx.fillStyle = "#fff";
    ctx.font = "700 24px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🥁 Бит-pad", VW / 2, VH / 2 - 20);
    ctx.font = "600 14px Nunito, sans-serif";
    ctx.fillStyle = "#9aa8c0";
    ctx.fillText("Жми кнопки снизу", VW / 2, VH / 2 + 16);
  }

  // --- 4 DRAW ---
  const DRAW_COLORS = ["#ff4060", "#ffd76a", "#7ec8ff", "#7ef0c0", "#fff", "#a070ff"];
  function initDraw() {
    g = { t: 0, strokes: [], cur: null, color: DRAW_COLORS[0], done: false };
    playStat.textContent = "рисуй";
    uiExtra.innerHTML = DRAW_COLORS.map((c, i) => `<button type="button" class="pad-btn" data-c="${c}" style="background:${c}33;border-color:${c}">${i + 1}</button>`).join("") + `<button type="button" class="btn ghost" id="btnClear">Стереть</button>`;
    uiExtra.querySelectorAll("[data-c]").forEach((btn) => { btn.onclick = () => { g.color = btn.dataset.c; }; });
    document.getElementById("btnClear").onclick = () => { g.strokes = []; };
    say("Рисовалка. Тяни мышью.", 2);
  }
  function updateDraw(dt) {
    if (pointer.down) {
      if (!g.cur) g.cur = { color: g.color, pts: [] };
      g.cur.pts.push({ x: pointer.x, y: pointer.y });
    } else if (g.cur) {
      g.strokes.push(g.cur);
      g.cur = null;
    }
  }
  function drawDraw() {
    bg("#f0ece0", "#d8d0c0");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of g.strokes) {
      if (s.pts.length < 2) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
      ctx.stroke();
    }
    if (g.cur && g.cur.pts.length > 1) {
      ctx.strokeStyle = g.cur.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(g.cur.pts[0].x, g.cur.pts[0].y);
      for (let i = 1; i < g.cur.pts.length; i++) ctx.lineTo(g.cur.pts[i].x, g.cur.pts[i].y);
      ctx.stroke();
    }
  }

  // --- 5 ORACLE ---
  function initOracle() {
    g = { t: 0, done: false };
    uiExtra.innerHTML = `<button type="button" class="btn" id="btnOracle">Узнать судьбу</button>`;
    document.getElementById("btnOracle").onclick = () => say(ORACLE[(Math.random() * ORACLE.length) | 0], 5);
    say("Оракул ждёт вопроса.", 2);
  }
  function updateOracle() {}
  function drawOracle() {
    bg("#201040", "#100820");
    ctx.font = "80px serif";
    ctx.textAlign = "center";
    ctx.fillText("🔮", VW / 2, VH / 2 + 20);
  }

  // --- 6 TIMER ---
  function initTimer() {
    g = { t: 0, time: 0, running: false, done: false };
    playStat.textContent = "0.00с · пробел старт/стоп · R сброс";
    say("Секундомер. Пробел — старт.", 2);
  }
  function updateTimer(dt) {
    if (keys.r || keys.R) { g.time = 0; g.running = false; }
    if (keys[" "]) {
      keys[" "] = false;
      g.running = !g.running;
    }
    if (g.running) g.time += dt;
    playStat.textContent = g.time.toFixed(2) + "с · " + (g.running ? "идёт" : "пауза");
  }
  function drawTimer() {
    bg("#102028", "#081018");
    ctx.fillStyle = "#7ec8ff";
    ctx.font = "700 72px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(g.time.toFixed(2), VW / 2, VH / 2 + 24);
    ctx.font = "600 16px Nunito, sans-serif";
    ctx.fillStyle = "#9aa8c0";
    ctx.fillText("секунд", VW / 2, VH / 2 + 60);
  }

  // --- 7 REACT ---
  function initReact() {
    g = { t: 0, phase: "wait", wait: rand(1.5, 4), goT: 0, best: 999, done: false };
    playStat.textContent = "клик когда ЗЕЛЁНЫЙ";
    say("Реакция. Жди зелёный — потом клик.", 2.5);
  }
  function updateReact(dt) {
    if (g.phase === "wait") {
      g.wait -= dt;
      if (g.wait <= 0) { g.phase = "go"; g.goT = performance.now(); }
    }
    if (g.phase === "early" || g.phase === "result") {
      g.resultT = (g.resultT || 0) - dt;
      if (g.resultT <= 0) initReact();
    }
  }
  function onClickReact() {
    if (g.phase === "wait") { g.phase = "early"; g.resultT = 1.5; say("Рано! Подожди зелёный.", 1.5); }
    else if (g.phase === "go") {
      const ms = performance.now() - g.goT;
      g.best = Math.min(g.best, ms);
      g.phase = "result";
      g.resultT = 2;
      say(ms.toFixed(0) + " мс! Лучший: " + (g.best < 999 ? g.best.toFixed(0) : "—"), 2);
      playStat.textContent = ms.toFixed(0) + " мс";
    }
  }
  function drawReact() {
    const col = g.phase === "wait" ? "#c04040" : g.phase === "go" ? "#40c060" : g.phase === "early" ? "#c08040" : "#4080c0";
    bg(col, "#101018");
    ctx.fillStyle = "#fff";
    ctx.font = "700 28px Nunito, sans-serif";
    ctx.textAlign = "center";
    const txt = g.phase === "wait" ? "Жди…" : g.phase === "go" ? "ЖМИ!" : g.phase === "early" ? "Рано!" : "Ещё раз…";
    ctx.fillText(txt, VW / 2, VH / 2);
  }

  // --- 8 BUBBLE ---
  function initBubble() {
    g = { t: 0, bubbles: [], score: 0, spawn: 0, done: false };
    playStat.textContent = "счёт 0";
    say("Лопай пузыри!", 2);
  }
  function spawnBubble() {
    g.bubbles.push({ x: rand(40, VW - 40), y: VH + 20, r: rand(14, 32), vy: rand(-80, -40), pop: 0 });
  }
  function updateBubble(dt) {
    g.spawn += dt;
    if (g.spawn > 0.5) { g.spawn = 0; spawnBubble(); }
    for (const b of g.bubbles) {
      if (b.pop > 0) b.pop -= dt;
      else { b.y += b.vy * dt; b.x += Math.sin(g.t * 2 + b.r) * 20 * dt; }
    }
    g.bubbles = g.bubbles.filter((b) => b.y > -50 && b.pop <= 0 || b.pop > 0);
    if (pointer.down) {
      for (const b of g.bubbles) {
        if (b.pop > 0) continue;
        if (Math.hypot(b.x - pointer.x, b.y - pointer.y) < b.r) {
          b.pop = 0.3;
          g.score++;
          beep(500 + g.score * 10, 0.06);
          playStat.textContent = "счёт " + g.score;
        }
      }
      pointer.down = false;
    }
  }
  function drawBubble() {
    bg("#204060", "#102040");
    for (const b of g.bubbles) {
      if (b.pop > 0) continue;
      ctx.strokeStyle = "rgba(200,240,255,0.7)";
      ctx.fillStyle = "rgba(126,200,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // --- 9 GRAVITY ---
  function initGravity() {
    g = { t: 0, balls: [{ x: VW / 2, y: 100, vx: 100, vy: 0, r: 18, hue: 200 }], done: false };
    say("Клик — новый шар. Физика!", 2);
  }
  function updateGravity(dt) {
    if (pointer.down) {
      g.balls.push({ x: pointer.x, y: pointer.y, vx: rand(-120, 120), vy: rand(-80, 80), r: rand(10, 22), hue: rand(0, 360) });
      pointer.down = false;
    }
    for (const b of g.balls) {
      b.vy += 420 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x - b.r < 0) { b.x = b.r; b.vx *= -0.75; }
      if (b.x + b.r > VW) { b.x = VW - b.r; b.vx *= -0.75; }
      if (b.y + b.r > VH) { b.y = VH - b.r; b.vy *= -0.72; b.vx *= 0.98; }
      if (b.y - b.r < 0) { b.y = b.r; b.vy *= -0.6; }
    }
    playStat.textContent = "шаров " + g.balls.length;
  }
  function drawGravity() {
    bg("#181820", "#0a0a10");
    for (const b of g.balls) {
      ctx.fillStyle = `hsl(${b.hue}, 70%, 55%)`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- 10 WARP ---
  function initWarp() {
    g = { t: 0, stars: Array.from({ length: 120 }, () => ({ x: rand(0, VW), y: rand(0, VH), z: rand(0.2, 1) })), done: false };
    say("Звёздный полёт. Держись!", 2);
  }
  function updateWarp(dt) {
    const spd = 300 + g.t * 40;
    for (const s of g.stars) {
      s.z -= dt * 0.4;
      if (s.z <= 0) { s.x = rand(0, VW); s.y = rand(0, VH); s.z = 1; }
    }
    playStat.textContent = "скорость " + (spd | 0);
  }
  function drawWarp() {
    bg("#000008", "#000010");
    const cx = VW / 2;
    const cy = VH / 2;
    for (const s of g.stars) {
      const px = cx + (s.x - cx) / s.z;
      const py = cy + (s.y - cy) / s.z;
      const len = (1 - s.z) * 40;
      ctx.strokeStyle = `rgba(180,220,255,${1 - s.z})`;
      ctx.lineWidth = 1 + (1 - s.z) * 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + (px - cx) * 0.05 * len, py + (py - cy) * 0.05 * len);
      ctx.stroke();
    }
  }

  // --- 11 MEMORY ---
  const MEM_EMOJI = ["🐱", "🐶", "🦊", "🐸", "🌙", "⭐", "🔥", "💎"];
  function initMemory() {
    const deck = [...MEM_EMOJI, ...MEM_EMOJI].sort(() => Math.random() - 0.5);
    g = { t: 0, deck, open: [], matched: new Set(), lock: false, moves: 0, done: false };
    playStat.textContent = "ходов 0";
    say("Найди все пары.", 2);
  }
  function memCardAt(x, y) {
    const cols = 4;
    const w = 180;
    const h = 110;
    const ox = (VW - cols * w) / 2 + 20;
    const oy = 60;
    const col = ((x - ox) / w) | 0;
    const row = ((y - oy) / h) | 0;
    if (col < 0 || col >= 4 || row < 0 || row > 3) return -1;
    return row * 4 + col;
  }
  function updateMemory() {
    if (pointer.down && !g.lock) {
      const i = memCardAt(pointer.x, pointer.y);
      pointer.down = false;
      if (i < 0 || g.matched.has(i) || g.open.includes(i)) return;
      g.open.push(i);
      if (g.open.length === 2) {
        g.moves++;
        playStat.textContent = "ходов " + g.moves;
        const [a, b] = g.open;
        if (g.deck[a] === g.deck[b]) {
          g.matched.add(a);
          g.matched.add(b);
          g.open = [];
          beep(520, 0.1);
          if (g.matched.size === 16) finish("Память · все пары за " + g.moves + " ходов!");
        } else {
          g.lock = true;
          setTimeout(() => { g.open = []; g.lock = false; }, 700);
        }
      }
    }
  }
  function drawMemory() {
    bg("#1a2030", "#0a1020");
    const cols = 4;
    const w = 180;
    const h = 110;
    const ox = (VW - cols * w) / 2 + 20;
    const oy = 60;
    for (let i = 0; i < 16; i++) {
      const col = i % 4;
      const row = (i / 4) | 0;
      const x = ox + col * w;
      const y = oy + row * h;
      const show = g.matched.has(i) || g.open.includes(i);
      ctx.fillStyle = show ? "#304060" : "#4080c0";
      ctx.fillRect(x + 4, y + 4, w - 12, h - 12);
      if (show) {
        ctx.font = "48px serif";
        ctx.textAlign = "center";
        ctx.fillText(g.deck[i], x + w / 2, y + h / 2 + 16);
      }
    }
  }

  // --- 12 FLAPPY ---
  function initFlappy() {
    g = { t: 0, bird: { y: VH / 2, vy: 0 }, pipes: [{ x: VW + 100, gap: 160, top: rand(80, 220) }], score: 0, done: false };
    playStat.textContent = "пробел · счёт 0";
    say("Flappy. Пробел — взмах.", 2);
  }
  function updateFlappy(dt) {
    if (keys[" "]) { g.bird.vy = -280; keys[" "] = false; }
    g.bird.vy += 520 * dt;
    g.bird.y += g.bird.vy * dt;
    for (const p of g.pipes) p.x -= 180 * dt;
    if (g.pipes[0].x < -80) {
      g.pipes.shift();
      g.score++;
      playStat.textContent = "счёт " + g.score;
      g.pipes.push({ x: VW + 60, gap: 150, top: rand(60, 240) });
      beep(400 + g.score * 30, 0.05);
    }
    const p = g.pipes[0];
    const bx = 120;
    if (p.x < bx + 20 && p.x + 60 > bx - 20) {
      if (g.bird.y < p.top || g.bird.y > p.top + p.gap) finish("Flappy · счёт " + g.score);
    }
    if (g.bird.y < 20 || g.bird.y > VH - 20) finish("Flappy · счёт " + g.score);
  }
  function drawFlappy() {
    bg("#78c8f0", "#4890c0");
    for (const p of g.pipes) {
      ctx.fillStyle = "#40a060";
      ctx.fillRect(p.x, 0, 60, p.top);
      ctx.fillRect(p.x, p.top + p.gap, 60, VH);
    }
    ctx.fillStyle = "#ffd040";
    ctx.beginPath();
    ctx.arc(120, g.bird.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.fillRect(128, g.bird.y - 4, 6, 6);
  }

  // --- 13 MERGE ---
  function initMerge() {
    const grid = Array.from({ length: 16 }, () => 0);
    grid[(Math.random() * 16) | 0] = 2;
    g = { t: 0, grid, done: false, lock: false };
    playStat.textContent = "стрелки · 2048";
    say("Merge 2048. Стрелки.", 2);
  }
  function mergeSlide(row) {
    const a = row.filter((v) => v);
    const out = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] === a[i + 1]) { out.push(a[i] * 2); i++; beep(300 + a[i], 0.06); }
      else out.push(a[i]);
    }
    while (out.length < 4) out.push(0);
    return out;
  }
  function mergeMove(dir) {
    if (g.lock) return;
    let moved = false;
    const get = (r, c) => g.grid[r * 4 + c];
    const set = (r, c, v) => { g.grid[r * 4 + c] = v; };
    if (dir === "left" || dir === "right") {
      for (let r = 0; r < 4; r++) {
        let row = [0, 1, 2, 3].map((c) => get(r, c));
        if (dir === "right") row.reverse();
        const n = mergeSlide(row);
        if (dir === "right") n.reverse();
        for (let c = 0; c < 4; c++) if (get(r, c) !== n[c]) moved = true;
        for (let c = 0; c < 4; c++) set(r, c, n[c]);
      }
    } else {
      for (let c = 0; c < 4; c++) {
        let col = [0, 1, 2, 3].map((r) => get(r, c));
        if (dir === "down") col.reverse();
        const n = mergeSlide(col);
        if (dir === "down") n.reverse();
        for (let r = 0; r < 4; r++) if (get(r, c) !== n[r]) moved = true;
        for (let r = 0; r < 4; r++) set(r, c, n[r]);
      }
    }
    if (moved) {
      const empty = g.grid.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (empty.length) g.grid[empty[(Math.random() * empty.length) | 0]] = Math.random() < 0.85 ? 2 : 4;
      if (g.grid.some((v) => v >= 2048)) finish("Merge · 2048!");
    }
  }
  function updateMerge() {
    if (keys.ArrowLeft) { mergeMove("left"); keys.ArrowLeft = false; }
    if (keys.ArrowRight) { mergeMove("right"); keys.ArrowRight = false; }
    if (keys.ArrowUp) { mergeMove("up"); keys.ArrowUp = false; }
    if (keys.ArrowDown) { mergeMove("down"); keys.ArrowDown = false; }
  }
  function drawMerge() {
    bg("#faf0e0", "#e8d8c0");
    const s = 100;
    const ox = (VW - s * 4) / 2;
    const oy = (VH - s * 4) / 2;
    for (let i = 0; i < 16; i++) {
      const r = (i / 4) | 0;
      const c = i % 4;
      const v = g.grid[i];
      ctx.fillStyle = v ? `hsl(${30 + Math.log2(v) * 20}, 60%, ${70 - Math.log2(v) * 3}%)` : "#c8b8a8";
      ctx.fillRect(ox + c * s + 4, oy + r * s + 4, s - 8, s - 8);
      if (v) {
        ctx.fillStyle = "#333";
        ctx.font = "700 " + (v >= 1000 ? 24 : 32) + "px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(v), ox + c * s + s / 2, oy + r * s + s / 2 + 10);
      }
    }
  }

  // --- 14 MOOD ---
  function initMood() {
    g = { t: 0, mood: MOODS[0], done: false };
    uiExtra.innerHTML = MOODS.map((m, i) => `<button type="button" class="btn ghost" data-i="${i}">${m.name}</button>`).join("");
    uiExtra.querySelectorAll("[data-i]").forEach((btn) => {
      btn.onclick = () => { g.mood = MOODS[+btn.dataset.i]; say(g.mood.name, 2); };
    });
    say("Выбери настроение.", 2);
  }
  function updateMood(dt) { g.t += dt; }
  function drawMood() {
    bg(g.mood.c1, g.mood.c2);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let i = 0; i < 6; i++) {
      const x = VW / 2 + Math.cos(g.t * 0.5 + i) * 120;
      const y = VH / 2 + Math.sin(g.t * 0.7 + i * 1.2) * 80;
      ctx.beginPath();
      ctx.arc(x, y, 40 + i * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "700 32px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(g.mood.name, VW / 2, VH / 2);
  }

  // --- 15 ECHO ---
  function initEcho() {
    g = { t: 0, msgs: [{ who: "bot", text: "Привет. Напиши что-нибудь." }], done: false };
    uiExtra.innerHTML = `<input id="echoIn" placeholder="Сообщение…" maxlength="80" /><button type="button" class="btn" id="echoSend">→</button>`;
    const send = () => {
      const inp = document.getElementById("echoIn");
      const t = inp.value.trim();
      if (!t) return;
      g.msgs.push({ who: "you", text: t });
      g.msgs.push({ who: "bot", text: ECHO[(Math.random() * ECHO.length) | 0] });
      inp.value = "";
      if (g.msgs.length > 8) g.msgs = g.msgs.slice(-8);
    };
    document.getElementById("echoSend").onclick = send;
    document.getElementById("echoIn").onkeydown = (e) => { if (e.key === "Enter") send(); };
  }
  function updateEcho() {}
  function drawEcho() {
    bg("#182028", "#0a1018");
    ctx.font = "600 15px Nunito, sans-serif";
    ctx.textAlign = "left";
    let y = 50;
    for (const m of g.msgs) {
      ctx.fillStyle = m.who === "you" ? "#ffd76a" : "#7ec8ff";
      ctx.fillText((m.who === "you" ? "Ты: " : "Бот: ") + m.text, 40, y);
      y += 36;
    }
  }

  // --- 16 JUMP ---
  function initJump() {
    g = {
      t: 0,
      you: { x: 80, y: 400, vy: 0, on: false },
      plats: [
        { x: 0, y: 460, w: VW },
        { x: 200, y: 380, w: 120 },
        { x: 420, y: 300, w: 100 },
        { x: 620, y: 220, w: 120 },
        { x: 800, y: 160, w: 100 },
      ],
      star: { x: 850, y: 120, got: false },
      done: false,
    };
    say("A D · пробел прыжок · доберись до звезды", 2.5);
  }
  function updateJump(dt) {
    const p = g.you;
    if (keys.a || keys.A || keys.ArrowLeft) p.x -= 220 * dt;
    if (keys.d || keys.D || keys.ArrowRight) p.x += 220 * dt;
    if ((keys[" "] || keys.w || keys.W) && p.on) { p.vy = -320; p.on = false; keys[" "] = false; }
    p.vy += 680 * dt;
    p.y += p.vy * dt;
    p.on = false;
    for (const pl of g.plats) {
      if (p.x > pl.x && p.x < pl.x + pl.w && p.y >= pl.y - 8 && p.y <= pl.y + 12 && p.vy >= 0) {
        p.y = pl.y;
        p.vy = 0;
        p.on = true;
      }
    }
    p.x = clamp(p.x, 20, VW - 20);
    if (p.y > VH + 40) { p.x = 80; p.y = 400; p.vy = 0; }
    if (!g.star.got && Math.hypot(p.x - g.star.x, p.y - g.star.y) < 30) {
      g.star.got = true;
      finish("Платформер · звезда поймана!");
    }
  }
  function drawJump() {
    bg("#304878", "#182840");
    for (const pl of g.plats) {
      ctx.fillStyle = "#5a9858";
      ctx.fillRect(pl.x, pl.y, pl.w, 16);
    }
    if (!g.star.got) {
      ctx.fillStyle = "#ffe08a";
      ctx.font = "28px serif";
      ctx.fillText("⭐", g.star.x - 14, g.star.y + 10);
    }
    ctx.fillStyle = "#ffd76a";
    ctx.fillRect(g.you.x - 12, g.you.y - 24, 24, 28);
    ctx.fillStyle = "#000";
    ctx.fillRect(g.you.x + 2, g.you.y - 18, 4, 4);
  }

  // --- 17 KALEIDO ---
  function initKaleido() {
    g = { t: 0, pts: [], done: false };
    say("Двигай мышью — kaleidoscope.", 2);
  }
  function updateKaleido(dt) {
    g.t += dt;
    if (Math.hypot(pointer.x - VW / 2, pointer.y - VH / 2) > 20) {
      g.pts.push({ x: pointer.x, y: pointer.y, hue: (g.t * 80) % 360, life: 1 });
    }
    for (const p of g.pts) p.life -= dt * 0.35;
    g.pts = g.pts.filter((p) => p.life > 0);
    if (g.pts.length > 200) g.pts = g.pts.slice(-200);
  }
  function drawKaleido() {
    bg("#080810", "#101020");
    const cx = VW / 2;
    const cy = VH / 2;
    for (let seg = 0; seg < 8; seg++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((seg * Math.PI) / 4);
      if (seg % 2) ctx.scale(1, -1);
      for (const p of g.pts) {
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.life * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x - cx, p.y - cy, 8 * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- 18 RAIN ---
  const RAIN_CHARS = "アイウエオカキ0123456789";
  function initRain() {
    g = {
      t: 0,
      cols: Array.from({ length: 40 }, (_, i) => ({
        x: i * (VW / 40),
        y: rand(0, VH),
        spd: rand(120, 280),
        ch: RAIN_CHARS[(Math.random() * RAIN_CHARS.length) | 0],
      })),
      done: false,
    };
  }
  function updateRain(dt) {
    for (const c of g.cols) {
      c.y += c.spd * dt;
      if (c.y > VH) {
        c.y = -20;
        c.ch = RAIN_CHARS[(Math.random() * RAIN_CHARS.length) | 0];
      }
    }
  }
  function drawRain() {
    bg("#000804", "#001008");
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    for (const c of g.cols) {
      ctx.fillStyle = "#0f0";
      ctx.globalAlpha = 0.35 + Math.random() * 0.4;
      ctx.fillText(c.ch, c.x, c.y);
    }
    ctx.globalAlpha = 1;
  }

  // --- 19 ORBIT ---
  function initOrbit() {
    g = {
      t: 0,
      planets: [
        { r: 50, spd: 0.8, size: 10, hue: 200 },
        { r: 90, spd: 0.5, size: 14, hue: 40 },
        { r: 140, spd: 0.35, size: 8, hue: 120 },
      ],
      done: false,
    };
    say("Клик — новая планета.", 2);
  }
  function updateOrbit(dt) {
    g.t += dt;
    if (pointer.down) {
      g.planets.push({ r: rand(40, 160), spd: rand(0.2, 1), size: rand(6, 16), hue: rand(0, 360), phase: rand(0, 6) });
      pointer.down = false;
    }
  }
  function drawOrbit() {
    bg("#020208", "#0a0820");
    ctx.fillStyle = "#ffd040";
    ctx.beginPath();
    ctx.arc(VW / 2, VH / 2, 24, 0, Math.PI * 2);
    ctx.fill();
    for (const p of g.planets) {
      const ang = g.t * p.spd + (p.phase || 0);
      const x = VW / 2 + Math.cos(ang) * p.r;
      const y = VH / 2 + Math.sin(ang) * p.r * 0.55;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.ellipse(VW / 2, VH / 2, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `hsl(${p.hue}, 70%, 55%)`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- 20 CIPHER ---
  function genCipher() {
    const a = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const p = () => a[(Math.random() * a.length) | 0] + ((Math.random() * 9) | 0);
    return p() + p() + "-" + p() + p() + "-" + p() + p() + p();
  }
  function initCipher() {
    g = { t: 0, code: genCipher(), done: false };
    uiExtra.innerHTML = `<button type="button" class="btn" id="btnNewCode">Новый код</button>`;
    document.getElementById("btnNewCode").onclick = () => { g.code = genCipher(); say("Новый: " + g.code, 3); };
    say("Твой секретный код: " + g.code, 4);
  }
  function updateCipher() {}
  function drawCipher() {
    bg("#201818", "#100808");
    ctx.fillStyle = "#ffd76a";
    ctx.font = "700 42px Fredoka, monospace";
    ctx.textAlign = "center";
    ctx.fillText(g.code, VW / 2, VH / 2 + 10);
    ctx.font = "600 14px Nunito, sans-serif";
    ctx.fillStyle = "#9aa8c0";
    ctx.fillText("🔐 секретный шифр", VW / 2, VH / 2 - 50);
  }

  const BOOT = {
    snake: initSnake, fire: initFire, beat: initBeat, draw: initDraw, oracle: initOracle,
    timer: initTimer, react: initReact, bubble: initBubble, gravity: initGravity, warp: initWarp,
    memory: initMemory, flappy: initFlappy, merge: initMerge, mood: initMood, echo: initEcho,
    jump: initJump, kaleido: initKaleido, rain: initRain, orbit: initOrbit, cipher: initCipher,
  };
  const UPDATE = {
    snake: updateSnake, fire: updateFire, beat: updateBeat, draw: updateDraw, oracle: updateOracle,
    timer: updateTimer, react: updateReact, bubble: updateBubble, gravity: updateGravity, warp: updateWarp,
    memory: updateMemory, flappy: updateFlappy, merge: updateMerge, mood: updateMood, echo: updateEcho,
    jump: updateJump, kaleido: updateKaleido, rain: updateRain, orbit: updateOrbit, cipher: updateCipher,
  };
  const DRAW = {
    snake: drawSnake, fire: drawFire, beat: drawBeat, draw: drawDraw, oracle: drawOracle,
    timer: drawTimer, react: drawReact, bubble: drawBubble, gravity: drawGravity, warp: drawWarp,
    memory: drawMemory, flappy: drawFlappy, merge: drawMerge, mood: drawMood, echo: drawEcho,
    jump: drawJump, kaleido: drawKaleido, rain: drawRain, orbit: drawOrbit, cipher: drawCipher,
  };
  const CLICK = { react: onClickReact };

  function startApp(id) {
    appId = id;
    const meta = APPS.find((x) => x.id === id);
    playTitle.textContent = meta.title;
    hub.hidden = true;
    play.hidden = false;
    win.hidden = true;
    uiExtra.innerHTML = "";
    BOOT[id]();
  }

  function update(dt) {
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (!g || g.done || !appId) return;
    g.t = (g.t || 0) + dt;
    UPDATE[appId](dt);
    if (CLICK[appId] && pointer.down) {
      CLICK[appId]();
      if (appId !== "bubble" && appId !== "memory") pointer.down = false;
    }
  }

  function render() {
    ctx.clearRect(0, 0, VW, VH);
    if (!g || !appId) {
      bg("#101624", "#080610");
      return;
    }
    DRAW[appId]();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  cards.innerHTML = APPS.map(
    (a) => `<button type="button" class="card" data-id="${a.id}"><span class="ico">${a.ico}</span><strong>${a.title}</strong><small>${a.desc}</small></button>`
  ).join("");
  cards.querySelectorAll(".card").forEach((btn) => {
    btn.addEventListener("click", () => startApp(btn.getAttribute("data-id")));
  });

  document.getElementById("btnHub").onclick = showHub;
  document.getElementById("btnWinHub").onclick = showHub;

  window.addEventListener("keydown", (e) => { keys[e.key] = true; });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  canvas.addEventListener("pointerdown", (e) => {
    const p = canvasPos(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = true;
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPos(e);
    pointer.x = p.x;
    pointer.y = p.y;
  });
  canvas.addEventListener("pointerup", () => { pointer.down = false; });
  canvas.addEventListener("pointerleave", () => { pointer.down = false; });

  requestAnimationFrame(frame);
})();
