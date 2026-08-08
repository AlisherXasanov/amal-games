(() => {
  const W = 960;
  const H = 640;
  const STORAGE = "space-courier-v2";

  const store = {
    get(k, f) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? f : JSON.parse(v);
      } catch {
        return f;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
  };

  const LEVELS = [
    { id: 1, name: "Орбитальный пояс", hint: "Бомбы без лимита — круши камни", deliveries: 3, asteroidRate: 0.5, asteroidSpeed: 90, fuelDrain: 3.8, shields: 1 },
    { id: 2, name: "Шторм обломков", hint: "Больше камней — больше бомб", deliveries: 4, asteroidRate: 0.75, asteroidSpeed: 120, fuelDrain: 4.5, shields: 1 },
    { id: 3, name: "Красная туманность", hint: "Топливо тает быстрее", deliveries: 4, asteroidRate: 0.9, asteroidSpeed: 140, fuelDrain: 6, shields: 2 },
    { id: 4, name: "Ночной экспресс", hint: "Срочные посылки", deliveries: 5, asteroidRate: 1.05, asteroidSpeed: 160, fuelDrain: 5.5, shields: 2 },
    { id: 5, name: "Чёрный коридор", hint: "Плотный пояс", deliveries: 5, asteroidRate: 1.2, asteroidSpeed: 180, fuelDrain: 6.5, shields: 2 },
    { id: 6, name: "Ледяное кольцо", hint: "Быстрые глыбы", deliveries: 6, asteroidRate: 1.3, asteroidSpeed: 200, fuelDrain: 6.8, shields: 2 },
    { id: 7, name: "Пиратский сектор", hint: "Бомбы спасут в завале", deliveries: 6, asteroidRate: 1.4, asteroidSpeed: 210, fuelDrain: 7, shields: 3 },
    { id: 8, name: "Солнечный шквал", hint: "Жар и камни", deliveries: 7, asteroidRate: 1.5, asteroidSpeed: 220, fuelDrain: 7.5, shields: 3 },
    { id: 9, name: "Тёмный риф", hint: "Узкий путь", deliveries: 7, asteroidRate: 1.6, asteroidSpeed: 235, fuelDrain: 7.8, shields: 3 },
    { id: 10, name: "Пояс Хаоса", hint: "Середина кампании", deliveries: 8, asteroidRate: 1.7, asteroidSpeed: 250, fuelDrain: 8, shields: 3 },
    { id: 11, name: "Гравитационная яма", hint: "Камни летят быстрее", deliveries: 8, asteroidRate: 1.85, asteroidSpeed: 270, fuelDrain: 8.2, shields: 4 },
    { id: 12, name: "Квантовый шторм", hint: "Щит пригодится", deliveries: 9, asteroidRate: 2.0, asteroidSpeed: 285, fuelDrain: 8.5, shields: 4 },
    { id: 13, name: "Пустошь Титана", hint: "Долгая смена", deliveries: 9, asteroidRate: 2.15, asteroidSpeed: 300, fuelDrain: 9, shields: 4 },
    { id: 14, name: "Гиперкоридор", hint: "Почти финал", deliveries: 10, asteroidRate: 2.3, asteroidSpeed: 320, fuelDrain: 9.5, shields: 5 },
    { id: 15, name: "Сердце астероида", hint: "Последняя миссия курьера", deliveries: 12, asteroidRate: 2.5, asteroidSpeed: 340, fuelDrain: 10, shields: 5 },
  ];

  // Режим неуязвимости — только у хозяина Amal
  function amalGod() {
    try {
      if (window.__AMAL_GOD__ || window.__AMAL_OWNER__) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      if (new URLSearchParams(location.search).get("owner")) return true;
      if (window.AmalPowers && AmalPowers.god && AmalPowers.god()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      if (window.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner()) return true;
    } catch (_) {}
    return false;
  }
  const GOD = amalGod();
  const MAX_SCORE = 999999;

  const app = document.getElementById("app");
  let unlocked = LEVELS.length; // все уровни открыты
  let best = store.get(STORAGE + "-best", {});
  try { localStorage.removeItem(STORAGE + "-invuln"); } catch { /* ignore */ }

  const state = {
    screen: "menu",
    levelIdx: 0,
    running: false,
    ship: null,
    packages: [],
    station: null,
    asteroids: [],
    fuels: [],
    crates: [],
    bullets: [],
    blasts: [],
    stars: [],
    particles: [],
    carrying: false,
    delivered: 0,
    score: 0,
    fuel: 100,
    bombs: 0,
    shields: 0,
    shieldT: 0,
    bombCd: 0,
    time: 0,
    spawnAcc: 0,
    fuelAcc: 0,
    crateAcc: 0,
    msg: "",
    msgT: 0,
    keys: Object.create(null),
    pad: { up: false, down: false, left: false, right: false },
    queueBomb: false,
    queueShield: false,
    keyBomb: false,
    keyShield: false,
    wasAtStation: false,
    pointer: { x: W / 2, y: H / 2, down: false },
  };

  // ——— DOM ———
  const screen = document.createElement("div");
  screen.className = "screen";
  app.appendChild(screen);

  const canvas = document.createElement("canvas");
  canvas.id = "game";
  canvas.width = W;
  canvas.height = H;
  screen.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <div class="hud-block">
      <label>Уровень</label>
      <div class="value" id="h-level">—</div>
    </div>
    <div class="hud-block">
      <label>Доставки</label>
      <div class="value good" id="h-del">0 / 0</div>
    </div>
    <div class="hud-block">
      <label>Очки</label>
      <div class="value amber" id="h-score">0</div>
    </div>
    <div class="hud-block">
      <label>Оружие</label>
      <div class="value good" id="h-gear">💣∞ · Неуязвимость</div>
    </div>
    <div class="hud-block">
      <label>Топливо</label>
      <div class="value good" id="h-fuel">∞</div>
      <div class="fuel-bar"><div class="fuel-fill" id="h-fuel-bar" style="width:100%"></div></div>
    </div>
  `;
  screen.appendChild(hud);

  const controlsBar = document.createElement("div");
  controlsBar.className = "controls-bar";
  controlsBar.innerHTML = `
    <div class="dpad">
      <button type="button" class="pad-btn up" data-dir="up" aria-label="Вверх">▲</button>
      <button type="button" class="pad-btn left" data-dir="left" aria-label="Влево">◀</button>
      <button type="button" class="pad-btn right" data-dir="right" aria-label="Вправо">▶</button>
      <button type="button" class="pad-btn down" data-dir="down" aria-label="Вниз">▼</button>
    </div>
    <div class="action-wrap">
      <button type="button" class="act-btn bomb" data-act="bomb" aria-label="Бомба">💣</button>
    </div>
  `;
  screen.appendChild(controlsBar);

  function bindHoldButton(btn, onDown, onUp) {
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.setPointerCapture(e.pointerId);
      btn.classList.add("held");
      onDown();
    };
    const up = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove("held");
      onUp();
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", () => {
      btn.classList.remove("held");
      onUp();
    });
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // Движение — удержание
  controlsBar.querySelectorAll("[data-dir]").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    bindHoldButton(
      btn,
      () => { state.pad[dir] = true; },
      () => { state.pad[dir] = false; }
    );
  });

  // Бомба — одно нажатие = один взрыв (запас бесконечный)
  controlsBar.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("held");
      state.queueBomb = true;
    });
    const clearHeld = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove("held");
    };
    btn.addEventListener("pointerup", clearHeld);
    btn.addEventListener("pointercancel", clearHeld);
    btn.addEventListener("pointerleave", clearHeld);
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  });

  function setControlsVisible(on) {
    controlsBar.classList.toggle("visible", on);
  }

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  screen.appendChild(overlay);

  function showOverlay(html) {
    overlay.classList.remove("hidden");
    overlay.innerHTML = html;
    wireOverlay();
  }
  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
  }

  function wireOverlay() {
    overlay.querySelectorAll("[data-go]").forEach((el) => {
      el.addEventListener("click", () => go(el.getAttribute("data-go")));
    });
    overlay.querySelectorAll("[data-level]").forEach((el) => {
      el.addEventListener("click", () => {
        startLevel(Number(el.getAttribute("data-level")));
      });
    });
  }

  function go(name) {
    state.screen = name;
    state.running = false;
    setControlsVisible(false);
    if (name === "menu") renderMenu();
    else if (name === "levels") renderLevels();
    else if (name === "howto") renderHowto();
  }

  function renderMenu() {
    showOverlay(`
      <p class="brand">КОСМИЧЕСКИЙ КУРЬЕР</p>
      <p class="tagline">Лети на станцию — посылка не нужна. Очки всегда максимум. Бомбы ∞.</p>
      <ol class="steps">
        <li>Просто подлети к синей станции</li>
        <li>Очки всегда 999999 на любом уровне</li>
        <li>💣 справа — бесконечные бомбы</li>
      </ol>
      <div class="btn-row">
        <button class="btn btn-primary" data-go="levels">▶ Играть</button>
        <button class="btn btn-ghost" data-go="howto">Как играть</button>
      </div>
    `);
    hud.style.display = "none";
    setControlsVisible(false);
  }

  function renderHowto() {
    showOverlay(`
      <p class="brand">Управление</p>
      <ol class="steps">
        <li><b>↑ ↓ ← →</b> / WASD — полёт</li>
        <li><b>💣 / Пробел</b> — бомба (∞)</li>
        <li>Коробку брать не нужно — лети сразу на станцию</li>
        <li>Очки всегда максимальные</li>
      </ol>
      <div class="btn-row">
        <button class="btn btn-primary" data-go="levels">К уровням</button>
        <button class="btn btn-ghost" data-go="menu">Назад</button>
      </div>
    `);
    hud.style.display = "none";
    setControlsVisible(false);
  }

  function renderLevels() {
    const cards = LEVELS.map((lv, i) => {
      const locked = i + 1 > unlocked;
      const b = best[lv.id];
      return `
        <button class="level-card" data-level="${i}" ${locked ? "disabled" : ""}>
          <div class="num">МИССИЯ ${lv.id}</div>
          <div class="name">${lv.name}</div>
          <div class="meta">${locked ? "🔒 Закрыто" : b != null ? `Рекорд: ${b}` : lv.hint}</div>
        </button>`;
    }).join("");
    showOverlay(`
      <p class="brand">Выбери миссию</p>
      <p class="tagline">Открыто: ${unlocked} / ${LEVELS.length}</p>
      <div class="level-picks">${cards}</div>
      <div class="btn-row">
        <button class="btn btn-ghost" data-go="menu">Назад</button>
      </div>
    `);
    hud.style.display = "none";
    setControlsVisible(false);
  }

  function renderWin() {
    showOverlay(`
      <p class="brand">Доставлено!</p>
      <p class="tagline">${LEVELS[state.levelIdx].name} пройдена</p>
      <div class="result-score">${state.score}</div>
      <div class="btn-row">
        ${state.levelIdx + 1 < LEVELS.length
          ? `<button class="btn btn-amber" data-next>Следующая →</button>`
          : ""}
        <button class="btn btn-primary" data-go="levels">Миссии</button>
        <button class="btn btn-ghost" data-go="menu">Меню</button>
      </div>
    `);
    const next = overlay.querySelector("[data-next]");
    if (next) next.addEventListener("click", () => startLevel(state.levelIdx + 1));
    hud.style.display = "none";
    setControlsVisible(false);
  }

  function renderLose(reason) {
    showOverlay(`
      <p class="brand">Миссия провалена</p>
      <p class="tagline">${reason}</p>
      <div class="result-score">${state.score}</div>
      <div class="btn-row">
        <button class="btn btn-primary" data-retry>Ещё раз</button>
        <button class="btn btn-ghost" data-go="levels">Миссии</button>
      </div>
    `);
    overlay.querySelector("[data-retry]").addEventListener("click", () => startLevel(state.levelIdx));
    hud.style.display = "none";
    setControlsVisible(false);
  }

  // ——— Game ———
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function initStars() {
    state.stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: rand(0.3, 1.4),
      tw: Math.random() * Math.PI * 2,
    }));
  }

  function startLevel(idx) {
    const lv = LEVELS[idx];
    if (!lv || idx + 1 > unlocked) return;
    state.levelIdx = idx;
    state.screen = "play";
    state.running = true;
    state.carrying = false;
    state.delivered = 0;
    state.score = MAX_SCORE;
    state.fuel = 100;
    state.bombs = Infinity;
    state.shields = lv.shields;
    state.shieldT = 0;
    state.bombCd = 0;
    state.time = 0;
    state.spawnAcc = 0;
    state.fuelAcc = 0;
    state.crateAcc = 0;
    state.msg = "Лети на синюю станцию — коробка не нужна!";
    state.msgT = 3;
    state.ship = { x: W * 0.2, y: H * 0.5, vx: 0, vy: 0, angle: 0, r: 16, boost: 0 };
    state.packages = [];
    state.asteroids = [];
    state.fuels = [];
    state.crates = [];
    state.bullets = [];
    state.blasts = [];
    state.particles = [];
    state.station = { x: W * 0.82, y: H * 0.5, r: 42, pulse: 0 };
    state.pad = { up: false, down: false, left: false, right: false };
    state.queueBomb = false;
    state.queueShield = false;
    state.keyBomb = false;
    state.keyShield = false;
    state.wasAtStation = false;
    initStars();
    hideOverlay();
    hud.style.display = "flex";
    setControlsVisible(true);
    updateHud();
  }

  function spawnPackage() {
    let x, y, ok, tries = 0;
    do {
      x = rand(80, W - 80);
      y = rand(70, H - 70);
      ok = dist({ x, y }, state.ship) > 140 && dist({ x, y }, state.station) > 160;
      tries++;
    } while (!ok && tries < 40);
    state.packages = [{ x, y, r: 14, bob: Math.random() * 6 }];
    state.carrying = false;
    flash("Новая посылка на карте!");
  }

  function flash(text) {
    state.msg = text;
    state.msgT = 2.2;
  }

  function spawnAsteroid(lv) {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const sp = lv.asteroidSpeed * rand(0.7, 1.3);
    if (edge === 0) { x = -30; y = rand(0, H); vx = sp; vy = rand(-40, 40); }
    else if (edge === 1) { x = W + 30; y = rand(0, H); vx = -sp; vy = rand(-40, 40); }
    else if (edge === 2) { x = rand(0, W); y = -30; vx = rand(-40, 40); vy = sp; }
    else { x = rand(0, W); y = H + 30; vx = rand(-40, 40); vy = -sp; }
    state.asteroids.push({
      x, y, vx, vy,
      r: rand(14, 36),
      hp: 1,
      rot: Math.random() * Math.PI * 2,
      spin: rand(-2, 2),
      sides: 5 + Math.floor(Math.random() * 4),
    });
  }

  function spawnFuel() {
    state.fuels.push({ x: rand(60, W - 60), y: rand(60, H - 60), r: 12, life: 12 });
  }

  function spawnCrate() {
    state.crates.push({
      x: rand(70, W - 70),
      y: rand(70, H - 70),
      r: 14,
      life: 14,
      kind: "shield",
      bob: Math.random() * 6,
    });
  }

  function burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(40, 180);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(0.3, 0.9),
        color,
        size: rand(2, 5),
      });
    }
  }

  function destroyAsteroid(i, pts = 15) {
    const a = state.asteroids[i];
    if (!a) return;
    burst(a.x, a.y, "#c0c8d8", 12);
    state.score += pts;
    state.asteroids.splice(i, 1);
  }

  function dropBomb() {
    if (!state.ship) return;
    // без перезарядки и без лимита — только крошечная пауза, чтобы не спамить 60 раз в секунду
    if (state.bombCd > 0) return;
    state.bombCd = 0.12;
    const ship = state.ship;
    const radius = 130;
    state.blasts.push({ x: ship.x, y: ship.y, r: 20, maxR: radius, life: 0.45 });
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      if (dist(state.asteroids[i], ship) < radius) {
        destroyAsteroid(i, 25);
      }
    }
    burst(ship.x, ship.y, "#ff8a3d", 28);
    flash("Бомба! 💣");
    updateHud();
  }

  function activateShield() {
    /* щит не нужен — неуязвимость всегда */
  }

  function hasShield() {
    return GOD || state.shieldT > 0;
  }

  function updateHud() {
    const lv = LEVELS[state.levelIdx];
    state.score = MAX_SCORE;
    document.getElementById("h-level").textContent = `${lv.id}. ${lv.name}`;
    document.getElementById("h-del").textContent = `${state.delivered} / ${lv.deliveries}`;
    document.getElementById("h-score").textContent = String(MAX_SCORE);
    document.getElementById("h-gear").textContent = "💣∞ · Неуязвимость";
    document.getElementById("h-gear").className = "value good";
    const fEl = document.getElementById("h-fuel");
    fEl.textContent = "∞";
    fEl.className = "value good";
    document.getElementById("h-fuel-bar").style.width = "100%";
  }

  function update(dt) {
    if (!state.running) return;
    const lv = LEVELS[state.levelIdx];
    const ship = state.ship;
    state.time += dt;
    if (state.msgT > 0) state.msgT -= dt;
    if (state.bombCd > 0) state.bombCd -= dt;
    if (state.shieldT > 0) state.shieldT = Math.max(0, state.shieldT - dt);

    const k = state.keys;
    const pad = state.pad;
    const left = pad.left || k.ArrowLeft || k.a || k.A;
    const right = pad.right || k.ArrowRight || k.d || k.D;
    const up = pad.up || k.ArrowUp || k.w || k.W;
    const down = pad.down || k.ArrowDown || k.s || k.S;

    // Бомбы всегда доступны (∞)
    const bombKey = k[" "] || k.b || k.B || k.e || k.E;
    if (bombKey && !state.keyBomb) state.queueBomb = true;
    state.keyBomb = !!bombKey;

    if (state.queueBomb) {
      state.queueBomb = false;
      dropBomb();
    }

    let mx = 0;
    let my = 0;
    if (left) mx -= 1;
    if (right) mx += 1;
    if (up) my -= 1;
    if (down) my += 1;
    const usingPad = left || right || up || down;

    const speed = 360;
    if (usingPad) {
      const len = Math.hypot(mx, my) || 1;
      ship.vx = (mx / len) * speed;
      ship.vy = (my / len) * speed;
      if (mx || my) ship.angle = Math.atan2(ship.vy, ship.vx);
    } else {
      const dx = state.pointer.x - ship.x;
      const dy = state.pointer.y - ship.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 8) {
        ship.vx = (dx / d) * speed * 0.85;
        ship.vy = (dy / d) * speed * 0.85;
        ship.angle = Math.atan2(ship.vy, ship.vx);
      } else {
        ship.vx *= Math.pow(0.02, dt);
        ship.vy *= Math.pow(0.02, dt);
      }
    }

    ship.boost = 0.15;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.x = Math.max(20, Math.min(W - 20, ship.x));
    ship.y = Math.max(20, Math.min(H - 20, ship.y));

    // топливо
    if (GOD) {
      state.fuel = 100;
    } else {
      const spd = Math.hypot(ship.vx, ship.vy);
      state.fuel -= lv.fuelDrain * (0.35 + spd / 400) * dt;
    }

    state.station.pulse += dt * 3;

    state.spawnAcc += dt * lv.asteroidRate;
    while (state.spawnAcc >= 1) {
      state.spawnAcc -= 1;
      if (state.asteroids.length < 32) spawnAsteroid(lv);
    }

    if (!GOD) {
      state.fuelAcc += dt;
      if (state.fuelAcc > 6 && state.fuels.length < 2) {
        state.fuelAcc = 0;
        spawnFuel();
      }
      state.crateAcc += dt;
      if (state.crateAcc > 9 && state.crates.length < 2) {
        state.crateAcc = 0;
        spawnCrate();
      }
    }

    // Bullets removed — only bombs

    // Blast rings (visual)
    for (let i = state.blasts.length - 1; i >= 0; i--) {
      const bl = state.blasts[i];
      bl.life -= dt;
      bl.r = bl.maxR * (1 - bl.life / 0.45);
      if (bl.life <= 0) state.blasts.splice(i, 1);
    }

    // Asteroids
    const aura = GOD ? 95 : ship.r;
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.spin * dt;
      if (a.x < -60 || a.x > W + 60 || a.y < -60 || a.y > H + 60) {
        state.asteroids.splice(i, 1);
        continue;
      }
      if (dist(a, ship) < a.r + aura) {
        if (GOD || hasShield()) {
          destroyAsteroid(i, GOD ? 15 : 10);
          if (!GOD) flash("Щит отразил удар!");
          continue;
        }
        state.fuel -= 18;
        state.score = Math.max(0, state.score - 40);
        burst(ship.x, ship.y, "#ff5e8a", 14);
        const nx = (ship.x - a.x) / (dist(a, ship) || 1);
        const ny = (ship.y - a.y) / (dist(a, ship) || 1);
        ship.vx += nx * 280;
        ship.vy += ny * 280;
        flash("Удар астероида!");
        state.asteroids.splice(i, 1);
      }
    }

    // Без посылки: просто подлети к станции
    const atStation = dist(ship, state.station) < state.station.r + ship.r + 8;
    if (atStation && !state.wasAtStation) {
      state.delivered++;
      state.score = MAX_SCORE;
      burst(state.station.x, state.station.y, "#3de7ff", 18);
      flash(`Станция! +очки (${state.delivered}/${lv.deliveries})`);
      updateHud();
      if (state.delivered >= lv.deliveries) {
        state.wasAtStation = true;
        winLevel();
        return;
      }
    }
    state.wasAtStation = atStation;

    // Packages / fuel / crates не нужны в простом режиме
    state.packages = [];
    state.fuels = [];
    state.crates = [];

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    for (const s of state.stars) {
      s.x -= (20 + s.z * 40) * dt;
      if (s.x < 0) s.x += W;
      s.tw += dt * 2;
    }

    if (!GOD && state.fuel <= 0) {
      state.fuel = 0;
      loseLevel("Топливо закончилось. Корабль дрейфует в пустоте…");
      return;
    }

    updateHud();
  }

  function winLevel() {
    state.running = false;
    state.screen = "win";
    state.score = MAX_SCORE;
    setControlsVisible(false);
    const lv = LEVELS[state.levelIdx];
    best[lv.id] = MAX_SCORE;
    store.set(STORAGE + "-best", best);
    if (unlocked < state.levelIdx + 2) {
      unlocked = Math.min(LEVELS.length, state.levelIdx + 2);
      store.set(STORAGE + "-unlock", unlocked);
    }
    renderWin();
  }

  function loseLevel(reason) {
    state.running = false;
    state.screen = "lose";
    setControlsVisible(false);
    renderLose(reason);
  }

  // ——— Draw ———
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const g = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.5, H * 0.5, W * 0.7);
    g.addColorStop(0, "#1a1040");
    g.addColorStop(0.45, "#0a1228");
    g.addColorStop(1, "#03060f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const n = ctx.createRadialGradient(W * 0.75, H * 0.7, 0, W * 0.75, H * 0.7, 280);
    n.addColorStop(0, "rgba(20, 80, 90, 0.35)");
    n.addColorStop(1, "transparent");
    ctx.fillStyle = n;
    ctx.fillRect(0, 0, W, H);

    for (const s of state.stars) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.tw));
      ctx.fillStyle = `rgba(220, 235, 255, ${a * s.z})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.z * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.screen !== "play" && !state.running) return;

    const st = state.station;
    if (st) {
      const pulse = 1 + Math.sin(st.pulse) * 0.08;
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = "rgba(61, 231, 255, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, st.r + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(30, 90, 140, 0.55)";
      ctx.beginPath();
      ctx.arc(0, 0, st.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3de7ff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#e8f0ff";
      ctx.font = "700 11px 'Exo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("СТАНЦИЯ", 0, 4);
      ctx.restore();

      // всегда линия к станции
      if (state.ship) {
        ctx.strokeStyle = "rgba(61, 231, 255, 0.3)";
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.moveTo(state.ship.x, state.ship.y);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // посылки отключены — коробку брать не нужно

    for (const f of state.fuels) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life / 2);
      ctx.translate(f.x, f.y);
      ctx.fillStyle = "#5dffb1";
      ctx.shadowColor = "#5dffb1";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(10, 8); ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#041810";
      ctx.font = "800 9px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("F", 0, 5);
      ctx.restore();
    }

    for (const c of state.crates) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, c.life / 2);
      ctx.translate(c.x, c.y + Math.sin(c.bob) * 4);
      ctx.fillStyle = "#7ec8ff";
      ctx.shadowColor = "#7ec8ff";
      ctx.shadowBlur = 14;
      ctx.fillRect(-11, -11, 22, 22);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(-11, -11, 22, 22);
      ctx.fillStyle = "#0a1020";
      ctx.font = "800 12px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("S", 0, 5);
      ctx.restore();
    }

    for (const a of state.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.fillStyle = "#4a5568";
      ctx.strokeStyle = "#8a96a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < a.sides; i++) {
        const ang = (i / a.sides) * Math.PI * 2;
        const rr = a.r * (0.75 + ((i * 37) % 10) / 40);
        const px = Math.cos(ang) * rr;
        const py = Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Bullets removed

    // Blast rings
    for (const bl of state.blasts) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 138, 61, ${Math.max(0, bl.life * 2)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(bl.x, bl.y, bl.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const ship = state.ship;
    if (ship) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      if (hasShield()) {
        ctx.strokeStyle = GOD ? "rgba(93, 255, 177, 0.65)" : "rgba(126, 200, 255, 0.75)";
        ctx.lineWidth = 2.5;
        const auraR = GOD ? 90 + Math.sin(state.time * 4) * 4 : 28 + Math.sin(state.time * 6) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, auraR, 0, Math.PI * 2);
        ctx.stroke();
        if (GOD) {
          ctx.strokeStyle = "rgba(93, 255, 177, 0.25)";
          ctx.beginPath();
          ctx.arc(0, 0, auraR * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.rotate(ship.angle);
      if (Math.hypot(ship.vx, ship.vy) > 20 || ship.boost > 0) {
        ctx.fillStyle = "#ffb84d";
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-22 - Math.random() * 8, -5);
        ctx.lineTo(-22 - Math.random() * 8, 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#e8f0ff";
      ctx.strokeStyle = "#3de7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, 12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#1ec8e0";
      ctx.beginPath();
      ctx.arc(4, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      if (state.carrying) {
        ctx.fillStyle = "#ffb84d";
        ctx.fillRect(-4, -18, 10, 8);
      }
      ctx.restore();
    }

    if (state.msgT > 0 && state.msg) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, state.msgT);
      ctx.fillStyle = "rgba(5, 10, 24, 0.7)";
      ctx.font = "600 16px 'Exo 2', sans-serif";
      const tw = ctx.measureText(state.msg).width;
      const bx = W / 2 - tw / 2 - 14;
      const by = H - 118;
      roundRect(ctx, bx, by, tw + 28, 34, 8);
      ctx.fill();
      ctx.fillStyle = "#e8f0ff";
      ctx.textAlign = "center";
      ctx.fillText(state.msg, W / 2, by + 22);
      ctx.restore();
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPos(e);
    state.pointer.x = p.x;
    state.pointer.y = p.y;
  });
  canvas.addEventListener("pointerdown", (e) => {
    state.pointer.down = true;
    const p = canvasPos(e);
    state.pointer.x = p.x;
    state.pointer.y = p.y;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointerup", () => { state.pointer.down = false; });
  canvas.addEventListener("pointercancel", () => { state.pointer.down = false; });

  window.addEventListener("keydown", (e) => {
    state.keys[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    state.keys[e.key] = false;
  });
  window.addEventListener("blur", () => {
    state.pad.up = false;
    state.pad.down = false;
    state.pad.left = false;
    state.pad.right = false;
    state.keys = Object.create(null);
    state.keyBomb = false;
    state.keyShield = false;
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (state.running) update(dt);
    if (state.running || state.screen === "play") draw();
    else {
      if (!state.stars.length) initStars();
      for (const s of state.stars) {
        s.x -= (12 + s.z * 20) * dt;
        if (s.x < 0) s.x += W;
        s.tw += dt * 2;
      }
      drawMenuBg();
    }
    requestAnimationFrame(frame);
  }

  function drawMenuBg() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.5, H * 0.5, W * 0.7);
    g.addColorStop(0, "#1a1040");
    g.addColorStop(0.45, "#0a1228");
    g.addColorStop(1, "#03060f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (const s of state.stars) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.tw));
      ctx.fillStyle = `rgba(220, 235, 255, ${a * s.z})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.z * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  initStars();
  renderMenu();
  requestAnimationFrame(frame);

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (t === "heal" || t === "max") {
      state.fuel = 100;
      state.shieldT = Math.max(state.shieldT || 0, 8);
      state.dead = false;
      if (typeof flash === "function") flash("💚 Хилл · топливо и щит");
      if (typeof updateHud === "function") updateHud();
    }
    if (t === "sc-clear" || t === "max") {
      while (state.asteroids && state.asteroids.length) destroyAsteroid(0, 20);
      if (typeof flash === "function") flash("☄ Астероиды сбиты");
    }
    if (t === "sc-bombs" || t === "max") {
      state.bombs = Infinity;
    }
    if (t === "sc-score" || t === "max") {
      state.score = (state.score || 0) + 5000;
      if (typeof updateHud === "function") updateHud();
    }
    if (t === "speed" || t === "max") {
      if (state.ship) state.ship.boost = Math.max(state.ship.boost || 0, 6);
    }
    if (t === "god" || t === "max") {
      window.__AMAL_GOD__ = true;
      state.fuel = 100;
    }
    const amount = e.detail && Number(e.detail.amount);
    if ((t === "set-score" || t === "set-coins" || (t === "set-amount" && (e.detail.kind === "score" || e.detail.kind === "coins"))) && Number.isFinite(amount)) {
      state.score = amount;
      if (typeof updateHud === "function") updateHud();
    }
    if ((t === "set-cups" || (t === "set-amount" && e.detail.kind === "cups")) && Number.isFinite(amount)) {
      state.fuel = Math.min(100, amount);
      if (typeof updateHud === "function") updateHud();
    }
  });
})();
