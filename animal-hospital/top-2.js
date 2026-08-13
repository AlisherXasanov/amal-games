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
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  const GAMES = [
    {
      id: "neon",
      rank: "№1",
      ico: "🐍",
      title: "Неон-змейка",
      desc: "Классика топа. WASD · яблоки · не врежься",
      cls: "gold",
    },
    {
      id: "sky",
      rank: "№2",
      ico: "🐦",
      title: "Небо-прыжок",
      desc: "Пробел — взмах. Лети между трубами",
      cls: "blue",
    },
  ];

  const keys = Object.create(null);
  let g = null;
  let gameId = null;
  let last = performance.now();
  let bubbleT = 0;
  let audioCtx = null;

  function say(t, sec) {
    bubble.textContent = t;
    bubble.hidden = false;
    bubbleT = sec || 2.4;
  }

  function beep(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const gn = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      gn.gain.value = 0.1;
      o.connect(gn);
      gn.connect(audioCtx.destination);
      o.start();
      gn.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function showHub() {
    g = null;
    gameId = null;
    hub.hidden = false;
    play.hidden = true;
    win.hidden = true;
    bubble.hidden = true;
  }

  function finish(text) {
    if (!g || g.done) return;
    g.done = true;
    winText.textContent = text;
    winCode.textContent = "ТОП-2 · " + String(((Date.now() / 1000) | 0) % 100000);
    win.hidden = false;
  }

  function bg(c1, c2) {
    const grd = ctx.createLinearGradient(0, 0, 0, VH);
    grd.addColorStop(0, c1);
    grd.addColorStop(1, c2);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);
  }

  // --- №1 NEON SNAKE ---
  function startNeon() {
    g = {
      done: false,
      t: 0,
      cell: 24,
      snake: [{ x: 10, y: 8 }],
      dir: { x: 1, y: 0 },
      next: { x: 1, y: 0 },
      food: { x: 18, y: 8 },
      score: 0,
      tick: 0,
      trail: [],
    };
    playStat.textContent = "счёт 0";
    say("№1 · Неон-змейка. WASD.", 2.5);
  }

  function updateNeon(dt) {
    g.tick += dt;
    if (g.tick < 0.1) return;
    g.tick = 0;
    if (keys.ArrowUp || keys.w || keys.W) g.next = { x: 0, y: -1 };
    if (keys.ArrowDown || keys.s || keys.S) g.next = { x: 0, y: 1 };
    if (keys.ArrowLeft || keys.a || keys.A) g.next = { x: -1, y: 0 };
    if (keys.ArrowRight || keys.d || keys.D) g.next = { x: 1, y: 0 };
    if (g.next.x !== -g.dir.x || g.next.y !== -g.dir.y) g.dir = g.next;
    const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
    const cols = Math.floor(VW / g.cell);
    const rows = Math.floor(VH / g.cell);
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= cols ||
      head.y >= rows ||
      g.snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      finish("Неон-змейка · счёт " + g.score);
      return;
    }
    g.snake.unshift(head);
    g.trail.push({ x: head.x, y: head.y, life: 0.4 });
    if (head.x === g.food.x && head.y === g.food.y) {
      g.score++;
      playStat.textContent = "счёт " + g.score;
      beep(440 + g.score * 18, 0.07);
      do {
        g.food = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
      } while (g.snake.some((s) => s.x === g.food.x && s.y === g.food.y));
    } else {
      g.snake.pop();
    }
  }

  function drawNeon() {
    bg("#050818", "#101830");
    ctx.strokeStyle = "rgba(126,200,255,0.06)";
    for (let x = 0; x < VW; x += g.cell) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VH);
      ctx.stroke();
    }
    for (let y = 0; y < VH; y += g.cell) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VW, y);
      ctx.stroke();
    }
    const pulse = 0.6 + Math.sin(g.t * 6) * 0.2;
    ctx.fillStyle = `rgba(255, 64, 96, ${pulse})`;
    ctx.shadowColor = "#ff4060";
    ctx.shadowBlur = 16;
    ctx.fillRect(g.food.x * g.cell + 3, g.food.y * g.cell + 3, g.cell - 6, g.cell - 6);
    ctx.shadowBlur = 0;
    g.snake.forEach((s, i) => {
      const t = i / Math.max(1, g.snake.length);
      ctx.fillStyle = i === 0 ? "#7ef0c0" : `rgba(64, 200, 160, ${1 - t * 0.5})`;
      if (i === 0) {
        ctx.shadowColor = "#7ef0c0";
        ctx.shadowBlur = 12;
      }
      ctx.fillRect(s.x * g.cell + 1, s.y * g.cell + 1, g.cell - 2, g.cell - 2);
      ctx.shadowBlur = 0;
    });
  }

  // --- №2 SKY JUMP (flappy) ---
  function startSky() {
    g = {
      done: false,
      t: 0,
      bird: { y: VH / 2, vy: 0 },
      pipes: [{ x: VW + 80, gap: 155, top: rand(70, 230) }],
      score: 0,
    };
    playStat.textContent = "пробел · счёт 0";
    say("№2 · Небо-прыжок. Пробел — взмах!", 2.5);
  }

  function updateSky(dt) {
    if (keys[" "] || keys.ArrowUp || keys.w || keys.W) {
      g.bird.vy = -290;
      keys[" "] = false;
      keys.ArrowUp = false;
      keys.w = false;
      keys.W = false;
      beep(520, 0.04);
    }
    g.bird.vy += 540 * dt;
    g.bird.y += g.bird.vy * dt;
    for (const p of g.pipes) p.x -= 190 * dt;
    if (g.pipes[0].x < -70) {
      g.pipes.shift();
      g.score++;
      playStat.textContent = "счёт " + g.score;
      beep(380 + g.score * 25, 0.05);
      g.pipes.push({ x: VW + 40, gap: 150 - Math.min(30, g.score), top: rand(50, 250) });
    }
    const p = g.pipes[0];
    const bx = 140;
    if (p.x < bx + 18 && p.x + 58 > bx - 18) {
      if (g.bird.y < p.top + 12 || g.bird.y > p.top + p.gap - 12) {
        finish("Небо-прыжок · счёт " + g.score);
        return;
      }
    }
    if (g.bird.y < 16 || g.bird.y > VH - 16) finish("Небо-прыжок · счёт " + g.score);
  }

  function drawSky() {
    bg("#6ab8f0", "#3a78b0");
    ctx.fillStyle = "#e8f4ff";
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 220 + g.t * 30) % (VW + 100)) - 50;
      ctx.beginPath();
      ctx.ellipse(cx, 80 + i * 20, 50, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of g.pipes) {
      ctx.fillStyle = "#3a9858";
      ctx.fillRect(p.x, 0, 58, p.top);
      ctx.fillRect(p.x, p.top + p.gap, 58, VH);
      ctx.fillStyle = "#4cb86a";
      ctx.fillRect(p.x - 4, p.top - 18, 66, 18);
      ctx.fillRect(p.x - 4, p.top + p.gap, 66, 18);
    }
    ctx.save();
    ctx.translate(140, g.bird.y);
    ctx.rotate(Math.min(0.6, Math.max(-0.5, g.bird.vy / 400)));
    ctx.fillStyle = "#ffd040";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(7, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff7040";
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(24, 3);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const BOOT = { neon: startNeon, sky: startSky };
  const UPDATE = { neon: updateNeon, sky: updateSky };
  const DRAW = { neon: drawNeon, sky: drawSky };

  function startGame(id) {
    gameId = id;
    const meta = GAMES.find((x) => x.id === id);
    playTitle.textContent = meta.rank + " · " + meta.title;
    hub.hidden = true;
    play.hidden = false;
    win.hidden = true;
    BOOT[id]();
  }

  function update(dt) {
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (!g || g.done || !gameId) return;
    g.t += dt;
    UPDATE[gameId](dt);
  }

  function draw() {
    ctx.clearRect(0, 0, VW, VH);
    if (!g || !gameId) {
      bg("#101624", "#080610");
      return;
    }
    DRAW[gameId]();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  cards.innerHTML = GAMES.map(
    (g) =>
      `<button type="button" class="card ${g.cls}" data-id="${g.id}"><span class="rank">${g.rank}</span><span class="ico">${g.ico}</span><strong>${g.title}</strong><small>${g.desc}</small></button>`
  ).join("");
  cards.querySelectorAll(".card").forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.getAttribute("data-id")));
  });

  document.getElementById("btnHub").onclick = showHub;
  document.getElementById("btnWinHub").onclick = showHub;
  document.getElementById("btnAgain").onclick = () => {
    if (gameId) startGame(gameId);
  };

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " ") e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  requestAnimationFrame(frame);
})();
