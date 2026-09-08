import * as THREE from "three";

const SAVE = "amal-emo-friend-v3";
const eyes = document.getElementById("eyes");
const faceCtx = eyes.getContext("2d");
const robot = document.getElementById("robot");
const bubble = document.getElementById("bubble");
const logEl = document.getElementById("log");
const form = document.getElementById("form");
const input = document.getElementById("input");
const btnMic = document.getElementById("btnMic");
const moodPill = document.getElementById("moodPill");
const modeLabel = document.getElementById("modeLabel");
const chest = document.getElementById("chest");
const playPanel = document.getElementById("playPanel");
const playTitle = document.getElementById("playTitle");
const playScore = document.getElementById("playScore");
const playHint = document.getElementById("playHint");
const playClose = document.getElementById("playClose");
const touchPad = document.getElementById("touchPad");

const state = {
  mood: "calm",
  assist: false,
  name: "",
  scoreBest: 0,
  blinkT: 0,
  lookX: 0,
  lookY: 0,
  talkT: 0,
  danceT: 0,
  sleeping: false,
  keys: { up: false, down: false, left: false, right: false },
  play: null,
};

try {
  const raw = JSON.parse(localStorage.getItem(SAVE) || localStorage.getItem("amal-emo-friend-v1") || "{}");
  if (raw.assist) state.assist = true;
  if (raw.name) state.name = String(raw.name).slice(0, 24);
  if (raw.scoreBest) state.scoreBest = Number(raw.scoreBest) || 0;
} catch (_) {}

function save() {
  try {
    localStorage.setItem(
      SAVE,
      JSON.stringify({ assist: state.assist, name: state.name, scoreBest: state.scoreBest })
    );
  } catch (_) {}
}

function playEl() {
  return document.getElementById("playCanvas");
}

function remountCanvas() {
  const old = playEl();
  if (!old || !old.parentNode) return;
  const neu = document.createElement("canvas");
  neu.id = "playCanvas";
  neu.width = 480;
  neu.height = 320;
  old.parentNode.replaceChild(neu, old);
}

function setMood(m) {
  state.mood = m;
  const map = {
    calm: "😊 спокойный",
    happy: "😄 радостный",
    love: "🥰 любит",
    think: "🤔 думает",
    sleep: "😴 спит",
    wow: "😮 ух ты",
    sad: "🥺 грустит",
  };
  moodPill.textContent = map[m] || map.calm;
}

function setAssist(on) {
  state.assist = !!on;
  moodPill.classList.toggle("assist", state.assist);
  chest.classList.toggle("assist", state.assist);
  modeLabel.textContent = state.assist
    ? "помощник Ира · игры здесь · микрофон"
    : "друг · болтай · «сделай змейку» / «3D» здесь";
  save();
}

function forSpeech(text) {
  return String(text || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, " ")
    .replace(/\bz+\b/gi, " ")
    .replace(/z{2,}/gi, " ")
    .replace(/[.…]+/g, ". ")
    .replace(/[^\p{L}\p{N}\s.,!?;:\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function say(text, opts) {
  opts = opts || {};
  const t = String(text || "").trim();
  if (!t) return;
  bubble.textContent = t;
  if (!opts.skipLog) addLog("bot", t, opts.assist);
  if (!opts.keepSleep && state.sleeping) {
    state.sleeping = false;
    robot.classList.remove("sleeping");
    if (state.mood === "sleep") setMood("happy");
  }
  if (opts.silent) {
    state.talkT = 0;
    return;
  }
  state.talkT = 0.9;
  speak(t);
}

function addLog(who, text, assistStyle) {
  const div = document.createElement("div");
  div.className = "msg " + who + (assistStyle || (who === "bot" && state.assist) ? " assist" : "");
  div.textContent = (who === "you" ? "Ты: " : state.assist ? "Ира: " : "Эмо: ") + text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    const clean = forSpeech(text);
    if (!clean || clean.length < 2) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "ru-RU";
    u.rate = state.assist ? 1.02 : 1.05;
    u.pitch = state.assist ? 1.1 : 1.25;
    const voices = window.speechSynthesis.getVoices();
    const ru =
      voices.find((v) => /ru/i.test(v.lang) && /female|женский|milena|irina|elena/i.test(v.name)) ||
      voices.find((v) => /ru/i.test(v.lang));
    if (ru) u.voice = ru;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};

function drawFace(now) {
  const w = eyes.width;
  const h = eyes.height;
  faceCtx.clearRect(0, 0, w, h);
  const g = faceCtx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 120);
  g.addColorStop(0, state.assist ? "#3b1028" : "#0b1c2e");
  g.addColorStop(1, "#020617");
  faceCtx.fillStyle = g;
  faceCtx.fillRect(0, 0, w, h);

  const blink = state.blinkT > 0 ? Math.max(0.08, 1 - state.blinkT * 4) : 1;
  const mouthOpen = state.talkT > 0 ? 0.35 + Math.sin(now * 0.04) * 0.25 : 0;

  if (state.mood === "sleep" || state.sleeping) {
    faceCtx.strokeStyle = "#7dd3fc";
    faceCtx.lineWidth = 4;
    faceCtx.lineCap = "round";
    const y = h * 0.48;
    [
      [w * 0.35, y],
      [w * 0.65, y],
    ].forEach(([x, yy]) => {
      faceCtx.beginPath();
      faceCtx.moveTo(x - 14, yy);
      faceCtx.quadraticCurveTo(x, yy + 8, x + 14, yy);
      faceCtx.stroke();
    });
    return;
  }

  const eyeY = h * 0.42 + state.lookY * 6;
  const gap = 58;
  const cx = w / 2 + state.lookX * 10;
  drawEye(cx - gap / 2, eyeY, blink);
  drawEye(cx + gap / 2, eyeY, blink);

  if (state.mood === "love") {
    faceCtx.fillStyle = "#fb7185";
    faceCtx.beginPath();
    faceCtx.arc(cx, h * 0.78, 6, 0, Math.PI * 2);
    faceCtx.fill();
  }

  faceCtx.strokeStyle = state.assist ? "#fda4af" : "#67e8f9";
  faceCtx.lineWidth = 3.5;
  faceCtx.beginPath();
  if (state.mood === "happy" || state.mood === "wow") {
    faceCtx.arc(cx, h * 0.68, 14 + mouthOpen * 8, 0.15 * Math.PI, 0.85 * Math.PI);
    faceCtx.stroke();
  } else if (mouthOpen > 0.05) {
    faceCtx.ellipse(cx, h * 0.72, 8 + mouthOpen * 6, 4 + mouthOpen * 10, 0, 0, Math.PI * 2);
    faceCtx.fillStyle = "#020617";
    faceCtx.fill();
    faceCtx.stroke();
  } else {
    faceCtx.moveTo(cx - 10, h * 0.72);
    faceCtx.quadraticCurveTo(cx, h * 0.76, cx + 10, h * 0.72);
    faceCtx.stroke();
  }
}

function drawEye(x, y, blink) {
  const rx = 18;
  const ry = 20 * blink;
  faceCtx.fillStyle = state.assist ? "#fecdd3" : "#e0f2fe";
  faceCtx.beginPath();
  faceCtx.ellipse(x, y, rx, Math.max(2.5, ry), 0, 0, Math.PI * 2);
  faceCtx.fill();
  if (ry > 6) {
    faceCtx.fillStyle = "#0f172a";
    faceCtx.beginPath();
    faceCtx.ellipse(x + state.lookX * 3, y + 2 + state.lookY * 2, 7, 8 * Math.min(1, blink), 0, 0, Math.PI * 2);
    faceCtx.fill();
    faceCtx.fillStyle = "#fff";
    faceCtx.beginPath();
    faceCtx.arc(x - 3, y - 4, 2.2, 0, Math.PI * 2);
    faceCtx.fill();
  }
}

let last = performance.now();
function faceFrame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.blinkT = Math.max(0, state.blinkT - dt);
  state.talkT = Math.max(0, state.talkT - dt);
  if (state.danceT > 0) {
    state.danceT -= dt;
    if (state.danceT <= 0) robot.classList.remove("dance");
  }
  if (Math.random() < dt * 0.35 && state.blinkT <= 0 && !state.sleeping) state.blinkT = 0.18;
  if (!state.sleeping && Math.random() < dt * 0.4) {
    state.lookX = (Math.random() - 0.5) * 1.4;
    state.lookY = (Math.random() - 0.5) * 0.8;
  }
  drawFace(now);
  requestAnimationFrame(faceFrame);
}
requestAnimationFrame(faceFrame);

document.querySelectorAll(".act[data-act]").forEach((btn) => {
  btn.addEventListener("click", () => doAct(btn.getAttribute("data-act")));
});

function doAct(act) {
  if (act === "pet") {
    setMood("love");
    robot.classList.remove("bounce");
    void robot.offsetWidth;
    robot.classList.add("bounce");
    say("Бип-бип! Мне приятно.");
  } else if (act === "dance") {
    setMood("happy");
    state.danceT = 4;
    robot.classList.add("dance");
    say("Диско-режим!");
  } else if (act === "game") {
    startPlay("hearts");
  } else if (act === "make") {
    say("Скажи в микрофон: сделай змейку, гонку, прыжки или сделай 3D. Всё откроется здесь.");
    input.focus();
  } else if (act === "sleep") {
    state.sleeping = true;
    setMood("sleep");
    robot.classList.add("sleeping");
    robot.classList.remove("dance");
    say("Спокойной ночи. Сладких снов.", { keepSleep: true });
  }
}

function stopPlay() {
  if (state.play && state.play.stop) state.play.stop();
  state.play = null;
  playPanel.hidden = true;
  touchPad.hidden = true;
}

function setPlayScore(n) {
  if (state.play) state.play.score = n;
  playScore.textContent = String(n);
  if (n > state.scoreBest) {
    state.scoreBest = n;
    save();
  }
}

function startPlay(kind) {
  stopPlay();
  remountCanvas();
  playPanel.hidden = false;
  setMood("wow");
  const titles = {
    hearts: "Сердечки",
    snake: "Змейка",
    jump: "Прыжки",
    race: "Гонка",
    catch: "Ловилка",
    world3d: "Мир 3D",
  };
  playTitle.textContent = titles[kind] || "Игра";
  playHint.textContent =
    kind === "world3d"
      ? "WASD · пробел прыжок · микрофон работает"
      : "Стрелки / WASD · микрофон работает";
  touchPad.hidden = !("ontouchstart" in window || window.matchMedia("(pointer: coarse)").matches);
  setPlayScore(0);

  if (kind === "hearts") runHearts();
  else if (kind === "snake") runSnake();
  else if (kind === "jump") runJump();
  else if (kind === "race") runRace();
  else if (kind === "catch") runCatch();
  else if (kind === "world3d") runWorld3d();
  else runSnake();

  say(kind === "world3d" ? "Вот 3D-мир прямо здесь! Собирай кристаллы." : "Играем здесь. Микрофон тоже работает.");
}

playClose.addEventListener("click", () => {
  const sc = state.play ? state.play.score : 0;
  stopPlay();
  remountCanvas();
  setMood("happy");
  say("Закрыла игру. Очки: " + sc + ". Рекорд: " + state.scoreBest);
});

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowup" || k === "w") state.keys.up = true;
  if (k === "arrowdown" || k === "s") state.keys.down = true;
  if (k === "arrowleft" || k === "a") state.keys.left = true;
  if (k === "arrowright" || k === "d") state.keys.right = true;
  if (state.play && state.play.onKey) state.play.onKey(e);
});
window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowup" || k === "w") state.keys.up = false;
  if (k === "arrowdown" || k === "s") state.keys.down = false;
  if (k === "arrowleft" || k === "a") state.keys.left = false;
  if (k === "arrowright" || k === "d") state.keys.right = false;
});

touchPad.querySelectorAll("button[data-k]").forEach((btn) => {
  const key = btn.getAttribute("data-k");
  const down = (ev) => {
    ev.preventDefault();
    state.keys[key] = true;
  };
  const up = (ev) => {
    ev.preventDefault();
    state.keys[key] = false;
  };
  btn.addEventListener("touchstart", down, { passive: false });
  btn.addEventListener("touchend", up);
  btn.addEventListener("mousedown", down);
  btn.addEventListener("mouseup", up);
});

function runHearts() {
  const canvas = playEl();
  const g = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  let score = 0;
  const items = [];
  let alive = true;
  let spawnAcc = 0;
  let t0 = performance.now();

  canvas.onclick = (e) => {
    if (!alive) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (Math.hypot(it.x - x, it.y - y) < 28) {
        score += it.star ? 3 : 1;
        setPlayScore(score);
        items.splice(i, 1);
      }
    }
  };

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    spawnAcc += dt;
    if (spawnAcc > 0.55) {
      spawnAcc = 0;
      items.push({
        x: 20 + Math.random() * (W - 40),
        y: -20,
        v: 80 + Math.random() * 120,
        star: Math.random() > 0.85,
      });
    }
    g.fillStyle = "#0f172a";
    g.fillRect(0, 0, W, H);
    items.forEach((it) => {
      it.y += it.v * dt;
      g.fillStyle = it.star ? "#fbbf24" : "#fb7185";
      g.beginPath();
      g.arc(it.x, it.y, 12, 0, Math.PI * 2);
      g.fill();
    });
    for (let i = items.length - 1; i >= 0; i--) if (items[i].y > H + 30) items.splice(i, 1);
    state.play.raf = requestAnimationFrame(frame);
  }

  state.play = {
    kind: "hearts",
    score: 0,
    stop() {
      alive = false;
      canvas.onclick = null;
      if (state.play && state.play.raf) cancelAnimationFrame(state.play.raf);
    },
  };
  state.play.raf = requestAnimationFrame(frame);
  setTimeout(() => {
    if (state.play && state.play.kind === "hearts") {
      const sc = state.play.score;
      stopPlay();
      remountCanvas();
      say("Раунд сердечек окончен! Очки: " + sc);
    }
  }, 14000);
}

function runSnake() {
  const canvas = playEl();
  const g = canvas.getContext("2d");
  const cols = 16;
  const rows = 10;
  const cell = Math.floor(Math.min(canvas.width / cols, canvas.height / rows));
  const ox = Math.floor((canvas.width - cols * cell) / 2);
  const oy = Math.floor((canvas.height - rows * cell) / 2);
  let snake = [
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
  ];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 10, y: 5 };
  let score = 0;
  let alive = true;
  let acc = 0;
  let t0 = performance.now();

  function placeFood() {
    for (let n = 0; n < 80; n++) {
      const p = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
      if (!snake.some((s) => s.x === p.x && s.y === p.y)) {
        food = p;
        return;
      }
    }
  }

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    if (state.keys.up && dir.y !== 1) nextDir = { x: 0, y: -1 };
    if (state.keys.down && dir.y !== -1) nextDir = { x: 0, y: 1 };
    if (state.keys.left && dir.x !== 1) nextDir = { x: -1, y: 0 };
    if (state.keys.right && dir.x !== -1) nextDir = { x: 1, y: 0 };

    acc += dt;
    if (acc >= 0.14) {
      acc = 0;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= cols ||
        head.y >= rows ||
        snake.some((s) => s.x === head.x && s.y === head.y)
      ) {
        alive = false;
        say("Змейка остановилась. Очки: " + score + ". Скажи «сделай змейку» ещё раз!");
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 1;
        setPlayScore(score);
        placeFood();
      } else snake.pop();
    }

    g.fillStyle = "#020617";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.strokeStyle = "#1e293b";
    g.strokeRect(ox, oy, cols * cell, rows * cell);
    snake.forEach((s, i) => {
      g.fillStyle = i === 0 ? "#5eead4" : "#0ea5e9";
      g.fillRect(ox + s.x * cell + 1, oy + s.y * cell + 1, cell - 2, cell - 2);
    });
    g.fillStyle = "#fbbf24";
    g.beginPath();
    g.arc(ox + food.x * cell + cell / 2, oy + food.y * cell + cell / 2, cell * 0.32, 0, Math.PI * 2);
    g.fill();
    state.play.raf = requestAnimationFrame(frame);
  }

  state.play = {
    kind: "snake",
    score: 0,
    stop() {
      alive = false;
      if (state.play && state.play.raf) cancelAnimationFrame(state.play.raf);
    },
  };
  state.play.raf = requestAnimationFrame(frame);
}

function runJump() {
  const canvas = playEl();
  const g = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  let x = 60;
  let y = H - 60;
  let vy = 0;
  let onGround = true;
  let score = 0;
  let alive = true;
  const plats = [
    { x: 0, y: H - 30, w: W, h: 30 },
    { x: 120, y: H - 100, w: 90, h: 14 },
    { x: 260, y: H - 160, w: 90, h: 14 },
    { x: 380, y: H - 120, w: 80, h: 14 },
    { x: 200, y: H - 220, w: 70, h: 14 },
  ];
  let star = { x: 220, y: H - 250 };
  let t0 = performance.now();

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    if (state.keys.left) x -= 160 * dt;
    if (state.keys.right) x += 160 * dt;
    if (state.keys.up && onGround) {
      vy = -320;
      onGround = false;
    }
    vy += 900 * dt;
    y += vy * dt;
    onGround = false;
    plats.forEach((p) => {
      if (x > p.x - 12 && x < p.x + p.w + 12 && y >= p.y - 14 && y <= p.y + 8 && vy >= 0) {
        y = p.y - 14;
        vy = 0;
        onGround = true;
      }
    });
    x = Math.max(12, Math.min(W - 12, x));
    if (Math.hypot(x - star.x, y - star.y) < 22) {
      score += 1;
      setPlayScore(score);
      star = { x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 140) };
    }

    g.fillStyle = "#082f49";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#334155";
    plats.forEach((p) => g.fillRect(p.x, p.y, p.w, p.h));
    g.fillStyle = "#fbbf24";
    g.beginPath();
    g.arc(star.x, star.y, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5eead4";
    g.fillRect(x - 12, y - 24, 24, 24);
    state.play.raf = requestAnimationFrame(frame);
  }

  state.play = {
    kind: "jump",
    score: 0,
    onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        state.keys.up = true;
        setTimeout(() => {
          state.keys.up = false;
        }, 80);
      }
    },
    stop() {
      alive = false;
      if (state.play && state.play.raf) cancelAnimationFrame(state.play.raf);
    },
  };
  state.play.raf = requestAnimationFrame(frame);
}

function runRace() {
  const canvas = playEl();
  const g = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  let x = W / 2;
  let score = 0;
  let alive = true;
  const cars = [];
  let acc = 0;
  let t0 = performance.now();

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    if (state.keys.left) x -= 220 * dt;
    if (state.keys.right) x += 220 * dt;
    x = Math.max(30, Math.min(W - 30, x));
    acc += dt;
    if (acc > 0.7) {
      acc = 0;
      cars.push({ x: 40 + Math.random() * (W - 80), y: -40, v: 160 + Math.random() * 120 });
    }
    g.fillStyle = "#111827";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#374151";
    g.fillRect(W * 0.2, 0, W * 0.6, H);
    g.strokeStyle = "#fbbf24";
    g.setLineDash([12, 12]);
    g.beginPath();
    g.moveTo(W / 2, 0);
    g.lineTo(W / 2, H);
    g.stroke();
    g.setLineDash([]);

    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      c.y += c.v * dt;
      g.fillStyle = "#ef4444";
      g.fillRect(c.x - 16, c.y - 22, 32, 44);
      if (Math.abs(c.x - x) < 28 && Math.abs(c.y - (H - 50)) < 36) {
        alive = false;
        say("Авария! Очки: " + score + ". Скажи «сделай гонку» ещё раз.");
        return;
      }
      if (c.y > H + 50) {
        cars.splice(i, 1);
        score += 1;
        setPlayScore(score);
      }
    }
    g.fillStyle = "#38bdf8";
    g.fillRect(x - 16, H - 72, 32, 44);
    state.play.raf = requestAnimationFrame(frame);
  }

  state.play = {
    kind: "race",
    score: 0,
    stop() {
      alive = false;
      if (state.play && state.play.raf) cancelAnimationFrame(state.play.raf);
    },
  };
  state.play.raf = requestAnimationFrame(frame);
}

function runCatch() {
  const canvas = playEl();
  const g = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  let px = W / 2;
  let score = 0;
  let alive = true;
  const drops = [];
  let acc = 0;
  let t0 = performance.now();

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    if (state.keys.left) px -= 240 * dt;
    if (state.keys.right) px += 240 * dt;
    px = Math.max(30, Math.min(W - 30, px));
    acc += dt;
    if (acc > 0.55) {
      acc = 0;
      drops.push({
        x: 20 + Math.random() * (W - 40),
        y: -10,
        v: 140 + Math.random() * 100,
        good: Math.random() > 0.2,
      });
    }
    g.fillStyle = "#0c4a6e";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#5eead4";
    g.fillRect(px - 28, H - 28, 56, 16);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.v * dt;
      g.fillStyle = d.good ? "#fbbf24" : "#f43f5e";
      g.beginPath();
      g.arc(d.x, d.y, 10, 0, Math.PI * 2);
      g.fill();
      if (d.y > H - 34 && Math.abs(d.x - px) < 36) {
        score += d.good ? 1 : -1;
        setPlayScore(Math.max(0, score));
        drops.splice(i, 1);
      } else if (d.y > H + 20) drops.splice(i, 1);
    }
    state.play.raf = requestAnimationFrame(frame);
  }

  state.play = {
    kind: "catch",
    score: 0,
    stop() {
      alive = false;
      if (state.play && state.play.raf) cancelAnimationFrame(state.play.raf);
    },
  };
  state.play.raf = requestAnimationFrame(frame);
}

function runWorld3d() {
  const canvas = playEl();
  const W = canvas.width;
  const H = canvas.height;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7dd3fc);
  scene.fog = new THREE.Fog(0xbae6fd, 18, 55);
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 80);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff7ed, 1.1);
  sun.position.set(8, 16, 6);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbae6fd, 0x4ade80, 0.45));

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(22, 48),
    new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 })
    );
    mesh.position.set(Math.cos(ang) * 8, 0.35, Math.sin(ang) * 8);
    scene.add(mesh);
  }

  const player = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9 })
  );
  body.position.y = 0.85;
  player.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xffc9a3 })
  );
  head.position.y = 1.4;
  player.add(head);
  scene.add(player);

  const crystals = [];
  function spawnCrystal() {
    const c = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45 })
    );
    const ang = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 10;
    c.position.set(Math.cos(ang) * r, 1.1, Math.sin(ang) * r);
    scene.add(c);
    crystals.push(c);
  }
  for (let i = 0; i < 5; i++) spawnCrystal();

  let score = 0;
  let vy = 0;
  let onGround = true;
  let alive = true;
  let t0 = performance.now();

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    const forward = new THREE.Vector3();
    if (state.keys.up) forward.z -= 1;
    if (state.keys.down) forward.z += 1;
    if (state.keys.left) forward.x -= 1;
    if (state.keys.right) forward.x += 1;
    if (forward.lengthSq() > 0) {
      forward.normalize().multiplyScalar(6 * dt);
      player.position.x += forward.x;
      player.position.z += forward.z;
      player.rotation.y = Math.atan2(forward.x, forward.z);
    }
    vy -= 18 * dt;
    player.position.y += vy * dt;
    if (player.position.y <= 0) {
      player.position.y = 0;
      vy = 0;
      onGround = true;
    } else onGround = false;

    const lim = 18;
    player.position.x = Math.max(-lim, Math.min(lim, player.position.x));
    player.position.z = Math.max(-lim, Math.min(lim, player.position.z));

    crystals.forEach((c, idx) => {
      c.rotation.y += dt * 2;
      c.position.y = 1.1 + Math.sin(now * 0.004 + idx) * 0.15;
    });
    for (let i = crystals.length - 1; i >= 0; i--) {
      if (crystals[i].position.distanceTo(player.position) < 1.2) {
        scene.remove(crystals[i]);
        crystals.splice(i, 1);
        score += 1;
        setPlayScore(score);
        spawnCrystal();
      }
    }

    camera.position.set(player.position.x, player.position.y + 5.5, player.position.z + 8);
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
    renderer.render(scene, camera);
    state.play.raf = requestAnimationFrame(frame);
  }

  state.play = {
    kind: "world3d",
    score: 0,
    onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        if (onGround) {
          vy = 7.5;
          onGround = false;
        }
      }
    },
    stop() {
      alive = false;
      if (state.play && state.play.raf) cancelAnimationFrame(state.play.raf);
      try {
        renderer.dispose();
      } catch (_) {}
      remountCanvas();
    },
  };
  state.play.raf = requestAnimationFrame(frame);
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAssistPhrase(t) {
  const n = norm(t);
  if (n.includes("стевич") && n.includes("ира")) return true;
  if (/стань\s*ира|помощник\s*ира/.test(n)) return true;
  if (n.replace(/\s/g, "") === "стевичира") return true;
  return false;
}

function detectKind(n) {
  if (/3d|три д|мир|остров|объемн/.test(n)) return "world3d";
  if (/змей|snake/.test(n)) return "snake";
  if (/гонка|машин|race/.test(n)) return "race";
  if (/прыж|платформ|jump/.test(n)) return "jump";
  if (/ловил|падающ|catch|баскет|футбол/.test(n)) return "catch";
  if (/сердеч|heart/.test(n)) return "hearts";
  return null;
}

function tryCreateFromSpeech(text, n) {
  if (/почему|что такое|кто ты|который час|сколько время|микрофон|провер/.test(n) && !/сделай|создай/.test(n)) {
    return false;
  }
  let kind = detectKind(n);
  if (!kind && /сделай|создай|хочу игру|давай игр|поиграй/.test(n)) kind = "snake";
  if (!kind) return false;
  startPlay(kind);
  return true;
}

function reply(raw) {
  const text = String(raw || "").trim();
  if (!text) return;
  addLog("you", text);

  if (isAssistPhrase(text)) {
    setAssist(true);
    setMood("wow");
    say("Готово! Я помощник Ира. Скажи «сделай змейку» или «сделай 3D» — сыграем здесь. Микрофон — синяя кнопка.", {
      assist: true,
    });
    return;
  }

  if (/^(хватит|выключи|обычный|просто эмо|будь эмо)/i.test(text) && state.assist) {
    setAssist(false);
    setMood("calm");
    say("Ок, снова Эмо-друг.");
    return;
  }

  const n = norm(text);
  if (tryCreateFromSpeech(text, n)) return;

  const nameMatch = n.match(/(?:меня зовут|я|мое имя)\s+([a-zа-я]{2,16})/);
  if (nameMatch) {
    state.name = nameMatch[1].replace(/^./, (c) => c.toUpperCase());
    save();
  }

  setMood("think");
  const ans = state.assist ? assistAnswer(text, n) : friendAnswer(text, n);
  if (!ans) return;
  setTimeout(() => {
    setMood(state.assist ? "happy" : "calm");
    say(ans, { assist: state.assist });
  }, 250);
}

function friendAnswer(text, n) {
  if (/прив|здрав|хай|hello/.test(n)) {
    return (state.name ? "Привет, " + state.name + "! " : "Привет! ") + "Болтай в микрофон или скажи: сделай змейку.";
  }
  if (/микрофон|слыш|провер/.test(n)) {
    return "Нажми синюю кнопку «Микрофон» и говори. Если не слышу — напиши текстом.";
  }
  if (/ссылк|открой сайт|create lab|уш[ае]стик/.test(n)) {
    return "Никуда не кидаю. Игры прямо здесь, со мной.";
  }
  if (/танц|музык/.test(n)) {
    doAct("dance");
    return "Танцую!";
  }
  if (/спать|спокойной/.test(n)) {
    doAct("sleep");
    return "";
  }
  if (/кто ты/.test(n)) {
    return "Я Эмо. Говорю, слушаю микрофон и делаю игры здесь — змейка, гонка, 3D.";
  }
  if (/помощ|стевич|ира/.test(n)) return "Скажи «Стевич Ира» — включу помощника.";
  return ["Бип-боп! Расскажи ещё.", "Скажи сделай змейку или сделай 3D.", "Я здесь, никуда не ухожу."][
    Math.floor(Math.random() * 3)
  ];
}

function assistAnswer(text, n) {
  const who = state.name || "друг";
  if (/прив|здрав/.test(n)) return "Привет, " + who + "! Скажи сделай змейку или сделай 3D — сыграем тут.";
  if (/микрофон|провер/.test(n)) return "Жми «Микрофон», говори. Я слушаю на этой странице.";
  if (/сколько время|который час/.test(n)) {
    return "Сейчас " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) + ".";
  }
  const math = n.match(/сколько будет\s+(-?\d+)\s*([+\-*/xх:])\s*(-?\d+)/);
  if (math) {
    const a = Number(math[1]);
    const b = Number(math[3]);
    let op = math[2];
    if (op === "x" || op === "х") op = "*";
    if (op === ":") op = "/";
    const r =
      op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : b === 0 ? "бесконечность" : +(a / b).toFixed(4);
    return "Получается " + r + ".";
  }
  if (/шутк|анекдот/.test(n)) return "Робот не скидывает ссылки — он играет с тобой на одном экране!";
  if (/кто ты/.test(n)) return "Я Ира, помощник Эмо. Игры и разговор — всё здесь.";
  if (/спасиб/.test(n)) return "Пожалуйста, " + who + "!";
  return "Могу болтать, слушать микрофон и запускать игры здесь. Скажи: сделай 3D.";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = input.value;
  input.value = "";
  reply(v);
});

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
let listening = false;
const MIC_IDLE = "Микрофон";
const MIC_ON = "Слушаю…";

if (SR) {
  rec = new SR();
  rec.lang = "ru-RU";
  rec.interimResults = false;
  rec.continuous = false;
  rec.onresult = (ev) => {
    const t = ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
    if (t) reply(t);
  };
  rec.onend = () => {
    listening = false;
    btnMic.classList.remove("listening");
    btnMic.textContent = MIC_IDLE;
  };
  rec.onerror = () => {
    listening = false;
    btnMic.classList.remove("listening");
    btnMic.textContent = MIC_IDLE;
    say("Не расслышала. Нажми микрофон ещё раз или напиши.");
  };
}

btnMic.addEventListener("click", () => {
  if (!rec) {
    say("В этом браузере микрофон недоступен. Пиши текстом — тоже ок.");
    return;
  }
  if (listening) {
    try {
      rec.stop();
    } catch (_) {}
    return;
  }
  listening = true;
  btnMic.classList.add("listening");
  btnMic.textContent = MIC_ON;
  setMood("wow");
  try {
    rec.start();
  } catch (_) {
    listening = false;
    btnMic.classList.remove("listening");
    btnMic.textContent = MIC_IDLE;
  }
});

setAssist(state.assist);
setMood("happy");
say(
  state.assist
    ? "Снова на связи! Игры и микрофон — здесь, без ссылок. Скажи: сделай 3D."
    : "Привет! Болтай, жми микрофон. Скажи «сделай змейку» или «сделай 3D» — сыграем прямо здесь."
);
