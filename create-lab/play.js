(() => {
  const id = new URLSearchParams(location.search).get("id");
  const games = CreateLabStore.listGames();
  const game = CreateLabStore.getGame(id) || games[0];

  const title = document.getElementById("title");
  const desc = document.getElementById("desc");
  const help = document.getElementById("help");
  const scoreEl = document.getElementById("score");
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const pad = document.getElementById("pad");

  if (!game) {
    title.textContent = "Игра не найдена";
    desc.textContent = "Сначала создай игру у Ушастика.";
    return;
  }

  title.textContent = game.name;
  document.title = `${game.name} — Create Lab`;
  desc.textContent = game.prompt || "";
  const color = game.color || "#0d6e5f";
  const kind = game.kind || "catch";

  const keys = { up: false, down: false, left: false, right: false, jump: false, action: false };
  let score = 0;
  let over = false;
  let state = null;
  let spawnMode = "circle";
  let drag = null;
  let pointer = { x: 240, y: 240, down: false };

  function setScore(n) {
    score = n;
    if (kind === "playground") scoreEl.textContent = `Фигур: ${score}`;
    else if (kind === "basketball" || kind === "soccer") scoreEl.textContent = `Голы: ${score}`;
    else scoreEl.textContent = `Очки: ${score}`;
  }

  function reset() {
    over = false;
    setScore(0);
    drag = null;

    if (kind === "basketball") {
      state = {
        px: 80,
        py: 380,
        ball: { x: 110, y: 360, vx: 0, vy: 0, r: 14, held: true },
        hoop: { x: 400, y: 140, w: 50, rimY: 155 },
        scored: false,
      };
      help.textContent = "Баскетбол: ← → ходить, пробел / клик — бросок в кольцо.";
      if (pad) {
        pad.innerHTML = `
          <span class="spacer"></span>
          <button type="button" data-dir="up">Бросок</button>
          <span class="spacer"></span>
          <button type="button" data-dir="left">◀</button>
          <button type="button" data-dir="action">⚽</button>
          <button type="button" data-dir="right">▶</button>
        `;
        bindPad();
      }
    } else if (kind === "soccer") {
      state = {
        px: 100,
        py: 400,
        ball: { x: 160, y: 400, vx: 0, vy: 0, r: 12 },
        goal: { x: 420, y: 300, w: 40, h: 120 },
      };
      help.textContent = "Футбол: ← → беги к мячу, пробел — удар в ворота.";
      if (pad) {
        pad.innerHTML = `
          <span class="spacer"></span><span class="spacer"></span><span class="spacer"></span>
          <button type="button" data-dir="left">◀</button>
          <button type="button" data-dir="action">Удар</button>
          <button type="button" data-dir="right">▶</button>
        `;
        bindPad();
      }
    } else if (kind === "playground") {
      state = {
        bodies: [
          { type: "person", x: 90, y: 360, w: 24, h: 50, vx: 0, vy: 0, color: "#1a5c4a" },
          { type: "circle", x: 180, y: 100, r: 22, vx: 30, vy: 0, color: "#7ec94a" },
          { type: "box", x: 280, y: 60, w: 24, h: 24, vx: -10, vy: 0, color: "#e25a3c" },
          { type: "box", x: 340, y: 40, w: 22, h: 22, vx: 0, vy: 0, color: "#f0b429" },
        ],
      };
      setScore(state.bodies.length);
      help.textContent = "Площадка: клик — спавн. Тащи фигуры. Есть человечек, дыня и кубы.";
      if (pad) {
        pad.innerHTML = `
          <button type="button" data-spawn="person">Человек</button>
          <button type="button" data-spawn="circle">Дыня</button>
          <button type="button" data-spawn="box">Куб</button>
          <button type="button" data-spawn="clear">Очистить</button>
        `;
        pad.querySelectorAll("[data-spawn]").forEach((btn) => {
          btn.onclick = () => {
            const m = btn.dataset.spawn;
            if (m === "clear") {
              state.bodies = [];
              setScore(0);
              return;
            }
            spawnMode = m;
          };
        });
      }
    } else if (kind === "zombie") {
      state = {
        plants: [{ x: 80, y: 200 }, { x: 80, y: 300 }, { x: 80, y: 400 }],
        zombies: [],
        t: 0,
        selected: 0,
      };
      help.textContent = "Зомби: кликай слева — сажай. Не дай дойти до грядки.";
      if (pad) pad.innerHTML = `<button type="button" id="plant-btn">Посадить</button>`;
    } else if (kind === "shooter") {
      state = { x: 240, y: 420, bullets: [], foes: [], t: 0 };
      help.textContent = "Тир: ← → целься, пробел / клик — стреляй.";
      if (pad) {
        pad.innerHTML = `
          <button type="button" data-dir="left">◀</button>
          <button type="button" data-dir="action">Огонь</button>
          <button type="button" data-dir="right">▶</button>
        `;
        bindPad();
      }
    } else if (kind === "hide") {
      state = { x: 240, y: 240, hidden: false, seeker: { x: 40, y: 40, t: 0 }, spots: [
        { x: 100, y: 350, label: "ваза" },
        { x: 350, y: 120, label: "шкаф" },
      ] };
      help.textContent = "Прятки: добеги до укрытия и нажми E / пробел.";
      if (pad) {
        pad.innerHTML = `
          <button type="button" data-dir="up">▲</button>
          <span class="spacer"></span><span class="spacer"></span>
          <button type="button" data-dir="left">◀</button>
          <button type="button" data-dir="action">Спрятаться</button>
          <button type="button" data-dir="right">▶</button>
          <span class="spacer"></span>
          <button type="button" data-dir="down">▼</button>
        `;
        bindPad();
      }
    } else if (kind === "snake") {
      state = {
        body: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        dir: { x: 1, y: 0 },
        next: { x: 1, y: 0 },
        food: { x: 15, y: 12 },
        tick: 0,
      };
      help.textContent = "Змейка: стрелки / WASD.";
      if (pad) restoreArrowPad();
    } else if (kind === "jump") {
      state = {
        x: 60, y: 380, vy: 0, grounded: true,
        platforms: [
          { x: 0, y: 440, w: 480, h: 40 },
          { x: 160, y: 340, w: 100, h: 16 },
          { x: 300, y: 260, w: 100, h: 16 },
          { x: 80, y: 180, w: 100, h: 16 },
        ],
        coin: { x: 120, y: 140 },
      };
      help.textContent = "Прыжки: ← → и пробел.";
      if (pad) restoreArrowPad();
    } else if (kind === "race") {
      state = { x: 40, y: 220, obstacles: [], t: 0 };
      help.textContent = "Гонка: ↑↓ объезжай.";
      if (pad) restoreArrowPad();
    } else {
      state = { x: 240, y: 400, items: [], t: 0 };
      help.textContent = "Ловилка: ← → лови кубики.";
      if (pad) restoreArrowPad();
    }
  }

  function restoreArrowPad() {
    pad.innerHTML = `
      <span class="spacer"></span>
      <button type="button" data-dir="up">▲</button>
      <span class="spacer"></span>
      <button type="button" data-dir="left">◀</button>
      <button type="button" data-dir="down">▼</button>
      <button type="button" data-dir="right">▶</button>
    `;
    bindPad();
  }

  function bindPad() {
    pad.querySelectorAll("[data-dir]").forEach((btn) => {
      const dir = btn.dataset.dir;
      const down = (e) => {
        e.preventDefault();
        if (dir === "action" || dir === "up") {
          keys.action = true;
          keys.jump = true;
          if (kind === "basketball") throwBall();
          if (kind === "soccer") kickBall();
          if (kind === "shooter") shoot();
          if (kind === "hide") tryHide();
        } else {
          keys[dir] = true;
        }
      };
      const up = () => {
        if (dir === "action" || dir === "up") {
          keys.action = false;
          keys.jump = false;
        } else keys[dir] = false;
      };
      btn.onmousedown = down;
      btn.onmouseup = up;
      btn.onmouseleave = up;
      btn.ontouchstart = down;
      btn.ontouchend = up;
    });
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: ((src.clientX - r.left) / r.width) * canvas.width,
      y: ((src.clientY - r.top) / r.height) * canvas.height,
    };
  }

  function throwBall() {
    const b = state.ball;
    if (!b || !b.held) return;
    b.held = false;
    b.vx = 320 + Math.random() * 40;
    b.vy = -420 - Math.random() * 40;
    state.scored = false;
  }

  function kickBall() {
    const b = state.ball;
    const dx = b.x - state.px;
    const dy = b.y - state.py;
    if (dx * dx + dy * dy < 55 * 55) {
      b.vx = 280;
      b.vy = -120;
    }
  }

  function shoot() {
    state.bullets.push({ x: state.x, y: state.y - 10, vy: -420 });
  }

  function tryHide() {
    for (const s of state.spots) {
      if (Math.hypot(state.x - s.x, state.y - s.y) < 40) {
        state.hidden = true;
        setScore(score + 1);
        return;
      }
    }
  }

  function hitBody(p) {
    for (let i = state.bodies.length - 1; i >= 0; i--) {
      const b = state.bodies[i];
      if (b.type === "circle") {
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        if (dx * dx + dy * dy <= b.r * b.r) return b;
      } else {
        const w = b.w || 24;
        const h = b.h || 50;
        const pad = b.type === "box" ? 8 : 0;
        if (p.x >= b.x - pad && p.x <= b.x + w + pad && p.y >= b.y - pad && p.y <= b.y + h + pad) return b;
      }
    }
    return null;
  }

  function spawnAt(p) {
    if (spawnMode === "person") {
      state.bodies.push({ type: "person", x: p.x - 12, y: p.y - 25, w: 24, h: 50, vx: 0, vy: 0, color: "#1a5c4a" });
    } else if (spawnMode === "box") {
      state.bodies.push({ type: "box", x: p.x - 11, y: p.y - 11, w: 22, h: 22, vx: (Math.random() - 0.5) * 60, vy: 0, color: Math.random() > 0.5 ? color : "#e25a3c" });
    } else {
      state.bodies.push({ type: "circle", x: p.x, y: p.y, r: 18 + Math.random() * 10, vx: (Math.random() - 0.5) * 80, vy: 0, color: "#7ec94a" });
    }
    setScore(state.bodies.length);
  }

  if (kind === "playground") {
    canvas.style.cursor = "crosshair";
    canvas.addEventListener("mousedown", (e) => {
      const p = canvasPos(e);
      const b = hitBody(p);
      if (b) { drag = b; b.vx = 0; b.vy = 0; }
      else spawnAt(p);
    });
    canvas.addEventListener("mousemove", (e) => {
      const p = canvasPos(e);
      if (!drag) return;
      if (drag.type === "circle") { drag.x = p.x; drag.y = p.y; }
      else { drag.x = p.x - (drag.w || 24) / 2; drag.y = p.y - (drag.h || 40) / 2; }
    });
    window.addEventListener("mouseup", () => { drag = null; });
  }

  if (kind === "basketball" || kind === "soccer" || kind === "shooter") {
    canvas.addEventListener("mousedown", (e) => {
      pointer = { ...canvasPos(e), down: true };
      if (kind === "basketball") throwBall();
      if (kind === "soccer") kickBall();
      if (kind === "shooter") shoot();
    });
  }

  if (kind === "zombie") {
    canvas.addEventListener("mousedown", (e) => {
      const p = canvasPos(e);
      if (p.x < 140) state.plants.push({ x: 80, y: p.y });
    });
  }

  function updatePlayground(dt) {
    const g = 980;
    const floor = 450;
    for (const b of state.bodies) {
      if (b === drag) continue;
      b.vy += g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= 0.995;
      const w = b.type === "circle" ? b.r * 2 : (b.w || 24);
      const h = b.type === "circle" ? b.r * 2 : (b.h || 50);
      if (b.type === "circle") {
        if (b.x < b.r) { b.x = b.r; b.vx *= -0.55; }
        if (b.x > 480 - b.r) { b.x = 480 - b.r; b.vx *= -0.55; }
        if (b.y > floor - b.r) { b.y = floor - b.r; b.vy *= -0.4; b.vx *= 0.9; if (Math.abs(b.vy) < 28) b.vy = 0; }
      } else {
        if (b.x < 0) { b.x = 0; b.vx *= -0.55; }
        if (b.x + w > 480) { b.x = 480 - w; b.vx *= -0.55; }
        if (b.y + h > floor) { b.y = floor - h; b.vy *= -0.35; b.vx *= 0.9; if (Math.abs(b.vy) < 28) b.vy = 0; }
      }
    }
  }

  function updateBasketball(dt) {
    const speed = 220;
    if (keys.left) state.px -= speed * dt;
    if (keys.right) state.px += speed * dt;
    state.px = Math.max(20, Math.min(200, state.px));
    state.py = 380;

    const b = state.ball;
    if (b.held) {
      b.x = state.px + 28;
      b.y = state.py - 10;
      b.vx = 0;
      b.vy = 0;
    } else {
      b.vy += 1100 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < b.r || b.x > 480 - b.r) b.vx *= -0.7;
      if (b.y > 450 - b.r) {
        b.y = 450 - b.r;
        b.vy *= -0.35;
        b.vx *= 0.85;
        if (Math.abs(b.vy) < 40) {
          b.held = true;
          state.scored = false;
        }
      }
      // кольцо: проход сверху вниз через обод
      const h = state.hoop;
      if (!state.scored && b.vy > 0 && b.x > h.x && b.x < h.x + h.w && b.y > h.rimY && b.y < h.rimY + 18) {
        state.scored = true;
        setScore(score + 1);
      }
      // отскок от щита
      if (b.x > h.x + h.w + 8 && b.x < h.x + h.w + 20 && b.y > h.y && b.y < h.y + 70) {
        b.vx = -Math.abs(b.vx) * 0.8;
      }
    }
    if (keys.action || keys.jump) {
      keys.action = false;
      keys.jump = false;
      throwBall();
    }
  }

  function updateSoccer(dt) {
    if (keys.left) state.px -= 240 * dt;
    if (keys.right) state.px += 240 * dt;
    state.px = Math.max(20, Math.min(400, state.px));
    const b = state.ball;
    b.vy += 900 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= 0.99;
    if (b.y > 420 - b.r) { b.y = 420 - b.r; b.vy *= -0.35; b.vx *= 0.9; }
    if (b.x < b.r) { b.x = b.r; b.vx *= -0.6; }
    if (b.x > 480 - b.r) { b.x = 480 - b.r; b.vx *= -0.6; }
    const g = state.goal;
    if (b.x > g.x && b.y > g.y && b.y < g.y + g.h) {
      setScore(score + 1);
      b.x = 160; b.y = 400; b.vx = 0; b.vy = 0;
    }
    if (keys.action) { keys.action = false; kickBall(); }
  }

  function update(dt) {
    if (over) return;
    if (kind === "playground") return updatePlayground(dt);
    if (kind === "basketball") return updateBasketball(dt);
    if (kind === "soccer") return updateSoccer(dt);

    if (kind === "zombie") {
      state.t += dt;
      if (state.t > 1.2) {
        state.t = 0;
        state.zombies.push({ x: 460, y: 120 + Math.random() * 280, hp: 2 });
      }
      for (const z of state.zombies) {
        z.x -= 40 * dt;
        for (const p of state.plants) {
          if (Math.hypot(z.x - p.x, z.y - p.y) < 28) z.hp -= dt;
        }
        if (z.x < 40) endGame();
      }
      state.zombies = state.zombies.filter((z) => z.hp > 0);
      setScore(Math.max(score, state.plants.length));
      return;
    }

    if (kind === "shooter") {
      if (keys.left) state.x -= 260 * dt;
      if (keys.right) state.x += 260 * dt;
      state.x = Math.max(20, Math.min(460, state.x));
      state.t += dt;
      if (state.t > 0.8) {
        state.t = 0;
        state.foes.push({ x: 40 + Math.random() * 400, y: -20, vy: 80 + Math.random() * 60 });
      }
      for (const b of state.bullets) b.y += b.vy * dt;
      for (const f of state.foes) {
        f.y += f.vy * dt;
        for (const b of state.bullets) {
          if (Math.hypot(f.x - b.x, f.y - b.y) < 18) { f.dead = true; b.dead = true; setScore(score + 1); }
        }
        if (f.y > 460) endGame();
      }
      state.bullets = state.bullets.filter((b) => !b.dead && b.y > -20);
      state.foes = state.foes.filter((f) => !f.dead);
      if (keys.action) { keys.action = false; shoot(); }
      return;
    }

    if (kind === "hide") {
      if (!state.hidden) {
        if (keys.left) state.x -= 200 * dt;
        if (keys.right) state.x += 200 * dt;
        if (keys.up) state.y -= 200 * dt;
        if (keys.down) state.y += 200 * dt;
        state.x = Math.max(20, Math.min(460, state.x));
        state.y = Math.max(20, Math.min(460, state.y));
      }
      state.seeker.t += dt;
      state.seeker.x = 240 + Math.sin(state.seeker.t) * 180;
      state.seeker.y = 240 + Math.cos(state.seeker.t * 0.7) * 140;
      if (!state.hidden && Math.hypot(state.x - state.seeker.x, state.y - state.seeker.y) < 28) endGame();
      if (keys.action) { keys.action = false; tryHide(); }
      return;
    }

    if (kind === "snake") {
      if (keys.up && state.dir.y !== 1) state.next = { x: 0, y: -1 };
      if (keys.down && state.dir.y !== -1) state.next = { x: 0, y: 1 };
      if (keys.left && state.dir.x !== 1) state.next = { x: -1, y: 0 };
      if (keys.right && state.dir.x !== -1) state.next = { x: 1, y: 0 };
      state.tick += dt;
      if (state.tick < 0.14) return;
      state.tick = 0;
      state.dir = state.next;
      const head = { x: state.body[0].x + state.dir.x, y: state.body[0].y + state.dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= 24 || head.y >= 24) return endGame();
      if (state.body.some((p) => p.x === head.x && p.y === head.y)) return endGame();
      state.body.unshift(head);
      if (head.x === state.food.x && head.y === state.food.y) {
        setScore(score + 1);
        state.food = { x: 1 + Math.floor(Math.random() * 22), y: 1 + Math.floor(Math.random() * 22) };
      } else state.body.pop();
      return;
    }

    if (kind === "jump") {
      if (keys.left) state.x -= 180 * dt;
      if (keys.right) state.x += 180 * dt;
      state.x = Math.max(0, Math.min(452, state.x));
      state.vy += 1400 * dt;
      state.y += state.vy * dt;
      state.grounded = false;
      for (const p of state.platforms) {
        if (state.vy >= 0 && state.x + 28 > p.x && state.x < p.x + p.w && state.y + 28 > p.y && state.y + 28 < p.y + p.h + 18) {
          state.y = p.y - 28; state.vy = 0; state.grounded = true;
        }
      }
      if ((keys.up || keys.jump) && state.grounded) { state.vy = -520; state.grounded = false; }
      if (state.x < state.coin.x + 18 && state.x + 28 > state.coin.x && state.y < state.coin.y + 18 && state.y + 28 > state.coin.y) {
        setScore(score + 1);
        state.coin = { x: 40 + Math.random() * 400, y: 80 + Math.random() * 280 };
      }
      if (state.y > 520) endGame();
      return;
    }

    if (kind === "race") {
      if (keys.up) state.y -= 220 * dt;
      if (keys.down) state.y += 220 * dt;
      state.y = Math.max(150, Math.min(300, state.y));
      state.t += dt;
      if (state.t > 0.7) {
        state.t = 0;
        state.obstacles.push({ x: 500, y: 150 + Math.random() * 150, w: 28, h: 28 });
        setScore(score + 1);
      }
      for (const o of state.obstacles) o.x -= 260 * dt;
      state.obstacles = state.obstacles.filter((o) => o.x > -40);
      for (const o of state.obstacles) {
        if (state.x < o.x + o.w && state.x + 40 > o.x && state.y < o.y + o.h && state.y + 22 > o.y) endGame();
      }
      return;
    }

    // catch
    if (keys.left) state.x -= 260 * dt;
    if (keys.right) state.x += 260 * dt;
    state.x = Math.max(16, Math.min(464, state.x));
    state.t += dt;
    if (state.t > 0.55) {
      state.t = 0;
      state.items.push({ x: 20 + Math.random() * 440, y: -20, v: 120 + Math.random() * 120 });
    }
    for (const it of state.items) {
      it.y += it.v * dt;
      if (Math.abs(it.x - state.x) < 28 && Math.abs(it.y - state.y) < 28) {
        it.dead = true;
        setScore(score + 1);
      }
    }
    state.items = state.items.filter((it) => !it.dead && it.y < 520);
  }

  function endGame() { over = true; }

  function drawPerson(x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x + w * 0.25, y + h * 0.35, w * 0.5, h * 0.45);
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.22, w * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x, y + h * 0.4, w * 0.22, h * 0.12);
    ctx.fillRect(x + w * 0.78, y + h * 0.4, w * 0.22, h * 0.12);
    ctx.fillRect(x + w * 0.28, y + h * 0.75, w * 0.18, h * 0.25);
    ctx.fillRect(x + w * 0.54, y + h * 0.75, w * 0.18, h * 0.25);
  }

  function draw() {
    ctx.fillStyle = "#10241f";
    ctx.fillRect(0, 0, 480, 480);

    if (kind === "basketball") {
      // пол
      ctx.fillStyle = "#c4a574";
      ctx.fillRect(0, 430, 480, 50);
      // щит и кольцо
      const h = state.hoop;
      ctx.fillStyle = "#ddd";
      ctx.fillRect(h.x + h.w + 4, h.y, 10, 80);
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 4;
      ctx.strokeRect(h.x, h.rimY, h.w, 10);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(h.x, h.rimY + 10, h.w, 40);
      // игрок
      drawPerson(state.px - 12, state.py - 40, 28, 55, "#1a5c4a");
      // мяч
      const b = state.ball;
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.7, 0.2, 2.5);
      ctx.stroke();
    } else if (kind === "soccer") {
      ctx.fillStyle = "#1a7a3c";
      ctx.fillRect(0, 0, 480, 480);
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(20, 40, 440, 400);
      ctx.fillStyle = "#fff";
      ctx.fillRect(state.goal.x, state.goal.y, 8, state.goal.h);
      drawPerson(state.px - 12, state.py - 40, 28, 50, "#0b3d2e");
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "playground") {
      ctx.fillStyle = "#2a4038";
      ctx.fillRect(0, 450, 480, 30);
      for (const b of state.bodies) {
        if (b.type === "person") drawPerson(b.x, b.y, b.w, b.h, b.color);
        else if (b.type === "circle") {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }
      }
    } else if (kind === "zombie") {
      ctx.fillStyle = "#3d5c2e";
      ctx.fillRect(0, 0, 120, 480);
      for (const p of state.plants) {
        ctx.fillStyle = "#4ade80";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const z of state.zombies) {
        ctx.fillStyle = "#a3e635";
        ctx.fillRect(z.x, z.y, 28, 40);
      }
    } else if (kind === "shooter") {
      ctx.fillStyle = color;
      ctx.fillRect(state.x - 14, state.y - 10, 28, 20);
      ctx.fillStyle = "#f0b429";
      for (const b of state.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      ctx.fillStyle = "#e25a3c";
      for (const f of state.foes) ctx.fillRect(f.x - 12, f.y - 12, 24, 24);
    } else if (kind === "hide") {
      for (const s of state.spots) {
        ctx.fillStyle = "#5b4636";
        ctx.fillRect(s.x - 20, s.y - 20, 40, 40);
        ctx.fillStyle = "#fff";
        ctx.font = "12px Manrope,sans-serif";
        ctx.fillText(s.label, s.x - 16, s.y + 4);
      }
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(state.seeker.x, state.seeker.y, 14, 0, Math.PI * 2);
      ctx.fill();
      if (!state.hidden) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(state.x, state.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === "snake") {
      ctx.fillStyle = "#1a332c";
      for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) if ((i + j) % 2 === 0) ctx.fillRect(i * 20, j * 20, 20, 20);
      ctx.fillStyle = "#e25a3c";
      ctx.fillRect(state.food.x * 20 + 3, state.food.y * 20 + 3, 14, 14);
      state.body.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? color : shade(color, 0.85);
        ctx.fillRect(p.x * 20 + 1, p.y * 20 + 1, 18, 18);
      });
    } else if (kind === "jump") {
      ctx.fillStyle = "#243832";
      for (const p of state.platforms) ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#f0b429";
      ctx.fillRect(state.coin.x, state.coin.y, 18, 18);
      ctx.fillStyle = color;
      ctx.fillRect(state.x, state.y, 28, 28);
    } else if (kind === "race") {
      ctx.fillStyle = "#2a3531";
      ctx.fillRect(0, 140, 480, 200);
      ctx.strokeStyle = "#f0b429";
      ctx.setLineDash([16, 14]);
      ctx.beginPath();
      ctx.moveTo(0, 240);
      ctx.lineTo(480, 240);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.fillRect(state.x, state.y, 40, 22);
      ctx.fillStyle = "#e25a3c";
      for (const o of state.obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(state.x, state.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0b429";
      for (const it of state.items) ctx.fillRect(it.x - 10, it.y - 10, 20, 20);
    }

    if (over) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, 480, 480);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px Syne, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Конец", 240, 230);
      ctx.font = "600 18px Manrope, sans-serif";
      ctx.fillText(`Очки: ${score}`, 240, 265);
    }
  }

  function shade(hex, f) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * f);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * f);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * f);
    return `rgb(${r},${g},${b})`;
  }

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "w"].includes(k)) keys.up = true;
    if (["arrowdown", "s"].includes(k)) keys.down = true;
    if (["arrowleft", "a"].includes(k)) keys.left = true;
    if (["arrowright", "d"].includes(k)) keys.right = true;
    if (k === " " || k === "e") {
      keys.jump = true;
      keys.action = true;
      if (kind === "basketball") throwBall();
      if (kind === "soccer") kickBall();
      if (kind === "shooter") shoot();
      if (kind === "hide") tryHide();
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "w"].includes(k)) { keys.up = false; keys.jump = false; }
    if (["arrowdown", "s"].includes(k)) keys.down = false;
    if (["arrowleft", "a"].includes(k)) keys.left = false;
    if (["arrowright", "d"].includes(k)) keys.right = false;
    if (k === " " || k === "e") { keys.jump = false; keys.action = false; }
  });

  document.getElementById("restart").onclick = reset;

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  reset();
  requestAnimationFrame(loop);
})();
