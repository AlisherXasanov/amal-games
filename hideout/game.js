(() => {
  const VW = 960;
  const VH = 640;
  const MW = 1800;
  const MH = 1200;

  const HIDE_SEC = 30;
  const SEEK_SEC = 100;
  const CATCH_R = 26;
  const PROP_CATCH_R = 18;
  const PROP_R = 38;
  const VISION_HIDER = 155;
  const VISION_SEEKER = 175;

  // Много красивых вещей дома
  const PROP_TYPES = [
    { id: "vase", name: "Ваза" },
    { id: "fireplace", name: "Камин" },
    { id: "chair", name: "Стул" },
    { id: "lamp", name: "Лампа" },
    { id: "plant", name: "Цветок" },
    { id: "sofa", name: "Диван" },
    { id: "table", name: "Стол" },
    { id: "clock", name: "Часы" },
    { id: "box", name: "Сундук" },
    { id: "mirror", name: "Зеркало" },
    { id: "tv", name: "ТВ" },
    { id: "book", name: "Книга" },
    { id: "piano", name: "Пианино" },
    { id: "bed", name: "Кровать" },
    { id: "fridge", name: "Холодильник" },
    { id: "sink", name: "Раковина" },
    { id: "toilet", name: "Унитаз" },
    { id: "bathtub", name: "Ванна" },
    { id: "wardrobe", name: "Шкаф" },
    { id: "painting", name: "Картина" },
    { id: "candle", name: "Свеча" },
    { id: "teapot", name: "Чайник" },
    { id: "radio", name: "Радио" },
    { id: "umbrella", name: "Зонт" },
  ];

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const toastEl = document.getElementById("toast");
  const touch = document.getElementById("touch");
  const menu = document.getElementById("menu");
  const endPanel = document.getElementById("endPanel");
  const stickEl = document.getElementById("stick");
  const actBtn = document.getElementById("actBtn");

  function showEl(el) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute("aria-hidden");
    if (el === touch) el.style.removeProperty("display");
    else el.style.setProperty("display", "flex", "important");
  }
  function hideEl(el) {
    if (!el) return;
    el.hidden = true;
    el.style.setProperty("display", "none", "important");
    el.setAttribute("aria-hidden", "true");
  }

  hideEl(endPanel);
  hideEl(hud);
  hideEl(touch);
  showEl(menu);

  let toastTimer = 0;
  function toast(msg, ms = 2400) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  const walls = [
    { x: 0, y: 0, w: MW, h: 32 },
    { x: 0, y: MH - 32, w: MW, h: 32 },
    { x: 0, y: 0, w: 32, h: MH },
    { x: MW - 32, y: 0, w: 32, h: MH },
    { x: 420, y: 32, w: 22, h: 340 },
    { x: 420, y: 450, w: 22, h: 320 },
    { x: 860, y: 32, w: 22, h: 280 },
    { x: 860, y: 400, w: 22, h: 380 },
    { x: 32, y: 440, w: 250, h: 22 },
    { x: 360, y: 440, w: 300, h: 22 },
    { x: 760, y: 560, w: 420, h: 22 },
    { x: 1240, y: 32, w: 22, h: 420 },
    { x: 1240, y: 560, w: 22, h: 300 },
    { x: 1360, y: 320, w: 300, h: 22 },
    { x: 560, y: 780, w: 22, h: 280 },
    { x: 1100, y: 780, w: 280, h: 22 },
  ];

  // Комнаты для патруля искателей (не читерят к хозяину)
  const ROOMS = [
    { name: "Гостиная", x: 60, y: 60, w: 340, h: 360 },
    { name: "Кухня", x: 460, y: 60, w: 380, h: 360 },
    { name: "Спальня", x: 900, y: 60, w: 320, h: 340 },
    { name: "Ванная", x: 1280, y: 60, w: 480, h: 240 },
    { name: "Коридор", x: 60, y: 480, w: 340, h: 280 },
    { name: "Кабинет", x: 460, y: 480, w: 380, h: 260 },
    { name: "Кладовая", x: 900, y: 600, w: 320, h: 280 },
    { name: "Чердак", x: 1280, y: 360, w: 480, h: 380 },
    { name: "Подвал", x: 60, y: 820, w: 480, h: 320 },
    { name: "Гараж", x: 600, y: 820, w: 460, h: 320 },
  ];

  function makeProps() {
    const spots = [
      // гостиная
      [120, 140], [200, 120], [280, 160], [150, 260], [260, 300], [180, 360],
      [320, 220], [100, 200],
      // кухня
      [500, 120], [580, 140], [680, 110], [760, 180], [520, 260], [640, 300],
      [720, 250], [560, 360], [780, 340],
      // спальня
      [940, 130], [1040, 150], [1140, 120], [980, 240], [1100, 280], [1000, 340],
      [1180, 220],
      // ванная
      [1340, 120], [1480, 140], [1600, 130], [1400, 220], [1550, 240],
      // коридор
      [120, 520], [220, 560], [300, 620], [160, 680],
      // кабинет
      [500, 520], [600, 540], [720, 510], [550, 620], [680, 660], [780, 600],
      // кладовая
      [940, 650], [1040, 680], [1140, 640], [980, 760], [1100, 800],
      // чердак
      [1340, 420], [1480, 460], [1620, 440], [1380, 560], [1550, 600], [1680, 540],
      [1450, 700],
      // подвал
      [120, 900], [240, 940], [360, 880], [180, 1040], [320, 1000], [450, 960],
      // гараж
      [680, 900], [800, 940], [920, 880], [700, 1040], [860, 1000], [980, 960],
    ];
    return spots.map((p, i) => {
      const t = PROP_TYPES[i % PROP_TYPES.length];
      return { x: p[0], y: p[1], type: t, taken: false, drift: Math.random() * 6 };
    });
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function circleRectHit(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }
  function resolveWalls(ent, r) {
    for (const w of walls) {
      if (!circleRectHit(ent.x, ent.y, r, w)) continue;
      const cx = w.x + w.w / 2;
      const cy = w.y + w.h / 2;
      const dx = ent.x - cx;
      const dy = ent.y - cy;
      const px = w.w / 2 + r;
      const py = w.h / 2 + r;
      if (Math.abs(dx) / px > Math.abs(dy) / py) ent.x = cx + Math.sign(dx || 1) * px;
      else ent.y = cy + Math.sign(dy || 1) * py;
    }
    ent.x = Math.max(r + 34, Math.min(MW - r - 34, ent.x));
    ent.y = Math.max(r + 34, Math.min(MH - r - 34, ent.y));
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function isBlocked(x, y, r = 16) {
    for (const w of walls) {
      if (circleRectHit(x, y, r, w)) return true;
    }
    return x < 40 || y < 40 || x > MW - 40 || y > MH - 40;
  }

  function pickInRoom(room) {
    for (let i = 0; i < 25; i++) {
      const p = {
        x: rand(room.x + 50, room.x + room.w - 50),
        y: rand(room.y + 50, room.y + room.h - 50),
      };
      if (!isBlocked(p.x, p.y, 18)) return p;
    }
    return { x: room.x + room.w / 2, y: room.y + room.h / 2 };
  }
  function pickFree() {
    for (let i = 0; i < 30; i++) {
      const room = ROOMS[(Math.random() * ROOMS.length) | 0];
      const p = pickInRoom(room);
      if (!isBlocked(p.x, p.y, 18)) return p;
    }
    return { x: 200, y: 200 };
  }

  const keys = Object.create(null);
  const stick = { x: 0, y: 0 };
  let actionPulse = false;

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE" || e.code === "Space") {
      e.preventDefault();
      actionPulse = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  let stickId = null;
  stickEl.addEventListener("pointerdown", (e) => {
    stickId = e.pointerId;
    stickEl.setPointerCapture(e.pointerId);
    updateStick(e);
  });
  stickEl.addEventListener("pointermove", (e) => {
    if (e.pointerId === stickId) updateStick(e);
  });
  function endStick(e) {
    if (e.pointerId !== stickId) return;
    stickId = null;
    stick.x = 0;
    stick.y = 0;
  }
  stickEl.addEventListener("pointerup", endStick);
  stickEl.addEventListener("pointercancel", endStick);
  function updateStick(e) {
    const rect = stickEl.getBoundingClientRect();
    let dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    let dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    stick.x = dx;
    stick.y = dy;
  }
  actBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    actionPulse = true;
  });

  let state = "menu";
  let g = null;
  let last = 0;
  let cam = { x: 0, y: 0 };

  menu.querySelectorAll("[data-role]").forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.dataset.role));
  });

  function makeActor(role, isPlayer, x, y, name) {
    return {
      role,
      isPlayer,
      name,
      x,
      y,
      r: role === "seeker" ? 15 : 13,
      speed: role === "seeker" ? 155 : 148,
      caught: false,
      prop: null,
      propLocked: false,
      moving: false,
      aiTimer: rand(0.6, 1.5),
      aiTx: x,
      aiTy: y,
      patrolRoom: (Math.random() * ROOMS.length) | 0,
      face: 1,
      bob: Math.random() * 6,
      stillTime: 0,
      stuckTime: 0,
      lastX: x,
      lastY: y,
    };
  }

  function startGame(playerRole) {
    const props = makeProps();
    const actors = [];
    const spawn = pickFree();
    const player = makeActor(playerRole, true, spawn.x, spawn.y, "Ты");
    actors.push(player);

    if (playerRole === "seeker") {
      const h = pickFree();
      actors.push(makeActor("hider", false, h.x, h.y, "Хозяин"));
    } else {
      const s = { x: 70, y: MH / 2 };
      actors.push(makeActor("seeker", false, s.x, s.y, "Искатель"));
    }

    g = {
      playerRole,
      player,
      actors,
      props,
      phase: "hide",
      hideLeft: HIDE_SEC,
      seekLeft: SEEK_SEC,
      win: null,
      msg: "",
    };

    cam.x = player.x - VW / 2;
    cam.y = player.y - VH / 2;
    hideEl(menu);
    hideEl(endPanel);
    showEl(hud);
    showEl(touch);
    state = "play";
    toast("Прячься! Стань вещью (E) и стой тихо");
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function inputDir() {
    let x = stick.x;
    let y = stick.y;
    if (keys.KeyA || keys.ArrowLeft) x -= 1;
    if (keys.KeyD || keys.ArrowRight) x += 1;
    if (keys.KeyW || keys.ArrowUp) y -= 1;
    if (keys.KeyS || keys.ArrowDown) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1e-6) {
      x /= len;
      y /= len;
    } else {
      x = 0;
      y = 0;
    }
    return { x, y };
  }

  function nearestProp(ent) {
    let best = null;
    let bd = PROP_R;
    for (const p of g.props) {
      if (p.taken && (!ent.prop || ent.prop !== p)) continue;
      const d = dist(ent, p);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  function becomeProp(ent) {
    if (ent.role !== "hider" || ent.caught) return;
    if (ent.prop) {
      ent.prop.taken = false;
      ent.prop = null;
      ent.propLocked = false;
      if (ent.isPlayer) toast("Снова человек — осторожно!");
      return;
    }
    const p = nearestProp(ent);
    if (!p) {
      if (ent.isPlayer) toast("Подойди ближе к вещи");
      return;
    }
    p.taken = true;
    ent.prop = p;
    ent.x = p.x;
    ent.y = p.y;
    ent.propLocked = true;
    ent.stillTime = 0;
    if (ent.isPlayer) toast(`Ты: ${p.type.name}. Стой тихо!`);
  }

  function tryCatch(seeker) {
    if (g.phase !== "seek") {
      if (seeker.isPlayer) toast("Ещё время прятаться");
      return;
    }
    let best = null;
    let bd = 99;
    for (const a of g.actors) {
      if (a.role !== "hider" || a.caught) continue;
      const d = dist(seeker, a);
      const need = a.prop ? PROP_CATCH_R : CATCH_R;
      // движущаяся вещь легче поймать
      const bonus = a.prop && a.moving ? 8 : 0;
      if (d < need + bonus && d < bd) {
        bd = d;
        best = a;
      }
    }
    if (!best) {
      if (seeker.isPlayer) toast("Пусто… осмотрись ещё");
      return;
    }
    best.caught = true;
    if (best.prop) {
      best.prop.taken = false;
      best.prop = null;
    }
    toast(best.isPlayer ? "Тебя нашли!" : "Хозяин пойман!");
  }

  function playerAction() {
    const p = g.player;
    if (p.caught) return;
    if (p.role === "hider") becomeProp(p);
    else tryCatch(p);
  }

  function moveEntity(ent, dx, dy, dt) {
    if (ent.caught) return;
    const moving = !!(dx || dy);

    if (ent.prop && ent.propLocked && !moving) {
      ent.x = ent.prop.x;
      ent.y = ent.prop.y;
      ent.moving = false;
      ent.stillTime += dt;
      return;
    }
    if (ent.prop && ent.propLocked && moving) {
      ent.propLocked = false;
    }
    if (g.phase === "hide" && ent.role === "seeker") return;

    const sp = ent.speed * (ent.prop ? 0.4 : 1);
    if (moving) {
      ent.x += dx * sp * dt;
      ent.y += dy * sp * dt;
      if (Math.abs(dx) > 0.1) ent.face = dx > 0 ? 1 : -1;
      resolveWalls(ent, ent.r);
      ent.moving = true;
      ent.stillTime = 0;
      if (ent.prop) {
        ent.prop.x = ent.x;
        ent.prop.y = ent.y;
      }
    } else {
      ent.moving = false;
      ent.stillTime += dt;
    }
  }

  // Искатель НЕ знает, где хозяин-вещь. Патрулирует комнаты.
  // Гонится только если видит человека (не вещь) в радиусе обзора.
  function updateAI(ent, dt) {
    if (ent.isPlayer || ent.caught) return;
    if (g.phase === "hide" && ent.role === "seeker") return;

    // если упёрся в стену — сразу новая цель
    const moved = Math.hypot(ent.x - ent.lastX, ent.y - ent.lastY);
    if (ent.moving && moved < 2 * dt * ent.speed * 0.15) ent.stuckTime += dt;
    else ent.stuckTime = 0;
    ent.lastX = ent.x;
    ent.lastY = ent.y;
    if (ent.stuckTime > 0.55) {
      ent.stuckTime = 0;
      ent.aiTimer = 0;
      ent.patrolRoom = (Math.random() * ROOMS.length) | 0;
      const spot = pickInRoom(ROOMS[ent.patrolRoom]);
      ent.aiTx = spot.x;
      ent.aiTy = spot.y;
    }

    ent.aiTimer -= dt;
    if (ent.aiTimer <= 0) {
      ent.aiTimer = rand(1.0, 2.2);

      if (ent.role === "hider") {
        if (!ent.prop) {
          let best = null;
          let bd = 1e9;
          for (const p of g.props) {
            if (p.taken) continue;
            const d = dist(ent, p);
            if (d < bd) {
              bd = d;
              best = p;
            }
          }
          if (best) {
            ent.aiTx = best.x;
            ent.aiTy = best.y;
          }
        } else {
          ent.aiTx = ent.x;
          ent.aiTy = ent.y;
          ent.propLocked = true;
        }
      } else {
        const hider = g.actors.find((a) => a.role === "hider" && !a.caught);
        let chase = false;
        if (hider && !hider.prop) {
          if (dist(ent, hider) < VISION_SEEKER * 0.95) chase = true;
        } else if (hider && hider.prop && hider.moving) {
          if (dist(ent, hider) < 90 && Math.random() < 0.35) chase = true;
        }

        if (chase && hider) {
          ent.aiTx = hider.x + rand(-20, 20);
          ent.aiTy = hider.y + rand(-20, 20);
          ent.aiTimer = rand(0.35, 0.7);
        } else {
          if (Math.random() < 0.5) {
            ent.patrolRoom = (ent.patrolRoom + 1) % ROOMS.length;
          } else if (Math.random() < 0.3) {
            ent.patrolRoom = (Math.random() * ROOMS.length) | 0;
          }
          const room = ROOMS[ent.patrolRoom];
          const spot = pickInRoom(room);
          ent.aiTx = spot.x;
          ent.aiTy = spot.y;
        }
      }
    }

    let dx = ent.aiTx - ent.x;
    let dy = ent.aiTy - ent.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len < 20) {
      dx = 0;
      dy = 0;
      if (ent.role === "hider" && !ent.prop && g.phase === "hide") becomeProp(ent);
      // подошёл близко — проверить (не врезаясь бесконечно)
      if (ent.role === "seeker" && g.phase === "seek") {
        tryCatch(ent);
        ent.aiTimer = 0.2;
        const room = ROOMS[(Math.random() * ROOMS.length) | 0];
        const spot = pickInRoom(room);
        ent.aiTx = spot.x;
        ent.aiTy = spot.y;
      }
    } else {
      dx /= len;
      dy /= len;
      // обход стены: если прямо заблокировано, шаг в сторону
      const lookX = ent.x + dx * 22;
      const lookY = ent.y + dy * 22;
      if (isBlocked(lookX, lookY, ent.r + 2)) {
        const left = { x: -dy, y: dx };
        const right = { x: dy, y: -dx };
        if (!isBlocked(ent.x + left.x * 22, ent.y + left.y * 22, ent.r + 2)) {
          dx = left.x;
          dy = left.y;
        } else if (!isBlocked(ent.x + right.x * 22, ent.y + right.y * 22, ent.r + 2)) {
          dx = right.x;
          dy = right.y;
        } else {
          ent.aiTimer = 0;
        }
      }
    }
    moveEntity(ent, dx, dy, dt);
  }

  function checkEnd() {
    const hider = g.actors.find((a) => a.role === "hider");
    if (hider && hider.caught) {
      g.win = "seeker";
      g.msg = "Искатели нашли хозяина дома!";
      return true;
    }
    if (g.phase === "seek" && g.seekLeft <= 0) {
      g.win = "hider";
      g.msg = "Время вышло — хозяин не найден!";
      return true;
    }
    return false;
  }

  function finish() {
    state = "end";
    g.phase = "end";
    hideEl(hud);
    hideEl(touch);
    const youWin =
      (g.playerRole === "seeker" && g.win === "seeker") ||
      (g.playerRole === "hider" && g.win === "hider");
    showEl(endPanel);
    endPanel.innerHTML = `
      <h1>${youWin ? "Победа!" : "Поражение"}</h1>
      <p class="sub">${g.msg}</p>
      <div class="roles">
        <button type="button" class="btn again" id="again">Ещё раз</button>
        <button type="button" class="btn ghost" id="tomenu">В меню</button>
      </div>
    `;
    endPanel.querySelector("#again").onclick = () => startGame(g.playerRole);
    endPanel.querySelector("#tomenu").onclick = () => {
      hideEl(endPanel);
      showEl(menu);
      state = "menu";
    };
  }

  function update(dt) {
    if (g.phase === "hide") {
      g.hideLeft = Math.max(0, g.hideLeft - dt);
      if (g.hideLeft <= 0) {
        g.phase = "seek";
        toast("Поиск! Искатели осматривают дом");
        for (const a of g.actors) {
          if (a.role === "seeker") {
            a.x = 70;
            a.y = MH / 2;
            a.patrolRoom = 0;
          }
        }
      }
    } else if (g.phase === "seek") {
      g.seekLeft = Math.max(0, g.seekLeft - dt);
    }

    if (actionPulse) {
      actionPulse = false;
      playerAction();
    }

    const dir = inputDir();
    if (!g.player.caught) {
      if (!(g.phase === "hide" && g.player.role === "seeker")) {
        moveEntity(g.player, dir.x, dir.y, dt);
      }
    }

    for (const a of g.actors) {
      a.bob += dt * 3.5;
      updateAI(a, dt);
    }

    const tx = g.player.x - VW / 2;
    const ty = g.player.y - VH / 2;
    cam.x += (tx - cam.x) * Math.min(1, dt * 6);
    cam.y += (ty - cam.y) * Math.min(1, dt * 6);
    cam.x = Math.max(0, Math.min(MW - VW, cam.x));
    cam.y = Math.max(0, Math.min(MH - VH, cam.y));

    if (checkEnd()) finish();
    updateHud();
  }

  function updateHud() {
    const role = g.playerRole === "seeker" ? "Искатель" : "Хозяин";
    const phaseTxt = g.phase === "hide" ? "ПРЯТКИ" : "ПОИСК";
    const timeTxt = Math.ceil(g.phase === "hide" ? g.hideLeft : g.seekLeft) + "с";
    const prop = g.player.prop ? g.player.prop.type.name : "человек";
    hud.innerHTML = `
      <span class="pill">${role}</span>
      <span class="pill">${phaseTxt} · ${timeTxt}</span>
      <span class="pill">${g.playerRole === "hider" ? prop : "Обыщи дом"}</span>
    `;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawProp(p) {
    const id = p.type.id;
    const x = p.x;
    const y = p.y;
    ctx.save();
    ctx.translate(x, y);

    if (id === "vase") {
      const g = ctx.createLinearGradient(-10, -18, 10, 16);
      g.addColorStop(0, "#e8a0c0");
      g.addColorStop(1, "#a03070");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-9, 14);
      ctx.bezierCurveTo(-12, 0, -8, -14, -5, -18);
      ctx.lineTo(5, -18);
      ctx.bezierCurveTo(8, -14, 12, 0, 9, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#5a1840";
      ctx.stroke();
      ctx.fillStyle = "#7ec87a";
      ctx.beginPath();
      ctx.ellipse(0, -20, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "fireplace") {
      ctx.fillStyle = "#5c3a28";
      roundRect(-28, -22, 56, 44, 4);
      ctx.fill();
      ctx.fillStyle = "#3a2418";
      roundRect(-18, -6, 36, 22, 3);
      ctx.fill();
      ctx.fillStyle = "#ff6a20";
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.quadraticCurveTo(-4, -8, 0, 10);
      ctx.quadraticCurveTo(4, -6, 10, 12);
      ctx.fill();
      ctx.fillStyle = "#ffd060";
      ctx.beginPath();
      ctx.moveTo(-4, 12);
      ctx.quadraticCurveTo(0, 0, 4, 12);
      ctx.fill();
    } else if (id === "chair") {
      ctx.fillStyle = "#8b5a2b";
      roundRect(-14, -4, 28, 16, 3);
      ctx.fill();
      ctx.fillStyle = "#6e4520";
      roundRect(-14, -20, 6, 18, 2);
      ctx.fill();
      roundRect(8, -20, 6, 18, 2);
      ctx.fill();
      ctx.fillStyle = "#c4a06a";
      roundRect(-12, -6, 24, 8, 2);
      ctx.fill();
    } else if (id === "lamp") {
      ctx.fillStyle = "#4a4038";
      ctx.fillRect(-3, 0, 6, 16);
      ctx.fillStyle = "#f5e6a0";
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(14, -4);
      ctx.lineTo(8, -20);
      ctx.lineTo(-8, -20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#c9a84a";
      ctx.stroke();
    } else if (id === "plant") {
      ctx.fillStyle = "#c47a4a";
      roundRect(-10, 4, 20, 14, 3);
      ctx.fill();
      ctx.fillStyle = "#2f8f4e";
      ctx.beginPath();
      ctx.ellipse(-6, -8, 9, 12, -0.4, 0, Math.PI * 2);
      ctx.ellipse(6, -8, 9, 12, 0.4, 0, Math.PI * 2);
      ctx.ellipse(0, -14, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0c0d0";
      ctx.beginPath();
      ctx.arc(0, -18, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "sofa") {
      ctx.fillStyle = "#4a6fa5";
      roundRect(-34, -10, 68, 28, 8);
      ctx.fill();
      ctx.fillStyle = "#3a5a8a";
      roundRect(-34, -22, 14, 20, 4);
      ctx.fill();
      roundRect(20, -22, 14, 20, 4);
      ctx.fill();
      ctx.fillStyle = "#6a8fc0";
      roundRect(-18, -14, 36, 12, 4);
      ctx.fill();
    } else if (id === "table") {
      ctx.fillStyle = "#a07040";
      roundRect(-26, -8, 52, 18, 3);
      ctx.fill();
      ctx.fillStyle = "#704828";
      ctx.fillRect(-22, 8, 5, 12);
      ctx.fillRect(17, 8, 5, 12);
    } else if (id === "clock") {
      ctx.fillStyle = "#e8dcc0";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8a7040";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -9);
      ctx.moveTo(0, 0);
      ctx.lineTo(7, 2);
      ctx.stroke();
    } else if (id === "box" || id === "wardrobe") {
      ctx.fillStyle = id === "wardrobe" ? "#6b4e32" : "#c49a5a";
      roundRect(-18, -24, 36, 48, 3);
      ctx.fill();
      ctx.strokeStyle = "#4a3220";
      ctx.stroke();
      if (id === "wardrobe") {
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, 22);
        ctx.stroke();
        ctx.fillStyle = "#d4b060";
        ctx.beginPath();
        ctx.arc(-6, 0, 2, 0, Math.PI * 2);
        ctx.arc(6, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "mirror") {
      ctx.fillStyle = "#d0e8f5";
      roundRect(-12, -22, 24, 40, 10);
      ctx.fill();
      ctx.strokeStyle = "#c0a050";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (id === "tv") {
      ctx.fillStyle = "#1a1a22";
      roundRect(-24, -16, 48, 32, 4);
      ctx.fill();
      ctx.fillStyle = "#3a80c0";
      roundRect(-20, -12, 40, 22, 2);
      ctx.fill();
    } else if (id === "book") {
      ctx.fillStyle = "#b03030";
      roundRect(-10, -14, 20, 28, 2);
      ctx.fill();
      ctx.fillStyle = "#f0e8d0";
      ctx.fillRect(-7, -10, 14, 20);
    } else if (id === "piano") {
      ctx.fillStyle = "#1a1a1a";
      roundRect(-30, -14, 60, 28, 3);
      ctx.fill();
      ctx.fillStyle = "#f5f5f0";
      for (let i = 0; i < 8; i++) ctx.fillRect(-26 + i * 7, -8, 5, 14);
    } else if (id === "bed") {
      ctx.fillStyle = "#8a6a4a";
      roundRect(-32, -12, 64, 30, 4);
      ctx.fill();
      ctx.fillStyle = "#e8e0f0";
      roundRect(-28, -18, 28, 16, 4);
      ctx.fill();
      ctx.fillStyle = "#6a90c0";
      roundRect(-28, -2, 56, 14, 3);
      ctx.fill();
    } else if (id === "fridge") {
      ctx.fillStyle = "#d0d8e0";
      roundRect(-16, -28, 32, 56, 4);
      ctx.fill();
      ctx.strokeStyle = "#8890a0";
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.stroke();
      ctx.fillStyle = "#a0a8b0";
      ctx.fillRect(10, -12, 3, 10);
    } else if (id === "sink") {
      ctx.fillStyle = "#c0c8d0";
      roundRect(-18, -8, 36, 20, 6);
      ctx.fill();
      ctx.fillStyle = "#8a9098";
      ctx.fillRect(-2, -16, 4, 10);
    } else if (id === "toilet") {
      ctx.fillStyle = "#f0f4f8";
      roundRect(-12, -4, 24, 20, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -14, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "bathtub") {
      ctx.fillStyle = "#e8eef5";
      roundRect(-28, -12, 56, 28, 12);
      ctx.fill();
      ctx.strokeStyle = "#a0a8b8";
      ctx.stroke();
    } else if (id === "painting") {
      ctx.fillStyle = "#5a3a20";
      roundRect(-18, -16, 36, 32, 2);
      ctx.fill();
      ctx.fillStyle = "#6a9ad0";
      roundRect(-14, -12, 28, 24, 1);
      ctx.fill();
      ctx.fillStyle = "#3d8a50";
      ctx.beginPath();
      ctx.moveTo(-14, 8);
      ctx.lineTo(-2, -2);
      ctx.lineTo(8, 6);
      ctx.lineTo(14, 0);
      ctx.lineTo(14, 12);
      ctx.lineTo(-14, 12);
      ctx.fill();
    } else if (id === "candle") {
      ctx.fillStyle = "#f5e6c0";
      ctx.fillRect(-4, -8, 8, 20);
      ctx.fillStyle = "#ff9020";
      ctx.beginPath();
      ctx.ellipse(0, -12, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "teapot") {
      ctx.fillStyle = "#d06050";
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3, -14, 6, 8);
      ctx.beginPath();
      ctx.arc(14, 0, 6, -1, 1);
      ctx.strokeStyle = "#d06050";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (id === "radio") {
      ctx.fillStyle = "#c08040";
      roundRect(-18, -10, 36, 22, 3);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-8, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eee";
      ctx.fillRect(2, -4, 12, 8);
    } else if (id === "umbrella") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.fillStyle = "#3060c0";
      ctx.beginPath();
      ctx.arc(0, -8, 16, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.fillStyle = "#a08060";
      roundRect(-14, -14, 28, 28, 4);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawSeeker(a) {
    const y = a.y + Math.sin(a.bob) * 1.5;
    // тень
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(a.x, a.y + 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // плащ
    const coat = ctx.createLinearGradient(a.x - 14, y - 10, a.x + 14, y + 18);
    coat.addColorStop(0, "#2a3548");
    coat.addColorStop(1, "#121820");
    ctx.fillStyle = coat;
    roundRect(a.x - 13, y - 6, 26, 24, 6);
    ctx.fill();

    // голова
    ctx.fillStyle = "#e8c4a0";
    ctx.beginPath();
    ctx.arc(a.x, y - 12, 9, 0, Math.PI * 2);
    ctx.fill();

    // шляпа
    ctx.fillStyle = "#1a2030";
    ctx.beginPath();
    ctx.ellipse(a.x, y - 18, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    roundRect(a.x - 7, y - 28, 14, 12, 3);
    ctx.fill();

    // фонарик
    ctx.save();
    ctx.translate(a.x + a.face * 10, y + 2);
    ctx.fillStyle = "#c0a050";
    roundRect(0, -3, 14, 6, 2);
    ctx.fill();
    ctx.fillStyle = "#fff3a0";
    ctx.beginPath();
    ctx.arc(14, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // луч фонаря (только в фазе поиска)
    if (g.phase === "seek") {
      ctx.save();
      const ang = a.face >= 0 ? 0 : Math.PI;
      const grd = ctx.createRadialGradient(a.x, y, 8, a.x + a.face * 70, y, 90);
      grd.addColorStop(0, "rgba(255,230,140,0.22)");
      grd.addColorStop(1, "rgba(255,230,140,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(a.x, y);
      ctx.arc(a.x, y, 95, ang - 0.45, ang + 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (a.isPlayer) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(a.x, y - 12, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawHiderPerson(a) {
    const y = a.y + Math.sin(a.bob) * 2;
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(a.x, a.y + 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a9a78";
    roundRect(a.x - 10, y - 4, 20, 20, 5);
    ctx.fill();
    ctx.fillStyle = "#f0c8a8";
    ctx.beginPath();
    ctx.arc(a.x, y - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    if (a.isPlayer) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(a.x, y - 12, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawActor(a) {
    if (a.caught) return;
    if (a.prop) {
      // Своя метка — еле заметная, только себе
      if (a.isPlayer) {
        ctx.fillStyle = "rgba(255, 210, 80, 0.35)";
        ctx.beginPath();
        ctx.arc(a.x, a.y + 22, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (a.role === "seeker") drawSeeker(a);
    else drawHiderPerson(a);
  }

  function drawHouse() {
    // базовый пол
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(0, 0, MW, MH);

    // комнаты с разным полом / обоями
    const floors = [
      ["#d4b896", ROOMS[0]],
      ["#c8b090", ROOMS[1]],
      ["#d0c0a8", ROOMS[2]],
      ["#b8c8d0", ROOMS[3]],
      ["#c0b098", ROOMS[4]],
      ["#cdb890", ROOMS[5]],
      ["#b8a080", ROOMS[6]],
      ["#a89070", ROOMS[7]],
      ["#8a7860", ROOMS[8]],
      ["#908070", ROOMS[9]],
    ];
    for (const [col, r] of floors) {
      ctx.fillStyle = col;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // паркет
      ctx.strokeStyle = "rgba(80,50,20,0.07)";
      ctx.lineWidth = 1;
      for (let yy = r.y; yy < r.y + r.h; yy += 18) {
        ctx.beginPath();
        ctx.moveTo(r.x, yy);
        ctx.lineTo(r.x + r.w, yy);
        ctx.stroke();
      }
    }

    // ковры
    ctx.fillStyle = "rgba(160,40,40,0.28)";
    roundRect(100, 160, 200, 140, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(40,70,140,0.22)";
    roundRect(980, 160, 180, 120, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(40,100,60,0.2)";
    roundRect(520, 180, 220, 130, 8);
    ctx.fill();

    // окна
    function windowAt(x, y) {
      ctx.fillStyle = "#7ec8e8";
      roundRect(x, y, 36, 44, 3);
      ctx.fill();
      ctx.strokeStyle = "#fff8e8";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, 32, 40);
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 2);
      ctx.lineTo(x + 18, y + 42);
      ctx.moveTo(x + 2, y + 22);
      ctx.lineTo(x + 34, y + 22);
      ctx.stroke();
      // свет от окна
      const wg = ctx.createLinearGradient(x, y + 44, x, y + 100);
      wg.addColorStop(0, "rgba(180,220,255,0.2)");
      wg.addColorStop(1, "rgba(180,220,255,0)");
      ctx.fillStyle = wg;
      ctx.fillRect(x - 10, y + 44, 56, 60);
    }
    windowAt(80, 70);
    windowAt(300, 70);
    windowAt(500, 70);
    windowAt(700, 70);
    windowAt(960, 70);
    windowAt(1400, 70);
    windowAt(1600, 70);

    // плинтуса / стены
    for (const w of walls) {
      const g = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
      g.addColorStop(0, "#8a6a4e");
      g.addColorStop(1, "#5c4432");
      ctx.fillStyle = g;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = "rgba(255,230,200,0.12)";
      ctx.fillRect(w.x, w.y, w.w, 3);
    }

    // подписи комнат (еле видно)
    ctx.fillStyle = "rgba(60,40,20,0.25)";
    ctx.font = "700 13px Outfit, sans-serif";
    ctx.textAlign = "left";
    for (const r of ROOMS) {
      ctx.fillText(r.name, r.x + 12, r.y + 22);
    }
  }

  function drawFog() {
    const p = g.player;
    const vision = p.role === "hider" ? VISION_HIDER : VISION_SEEKER;
    ctx.save();
    ctx.fillStyle = "rgba(8,6,12,0.88)";
    ctx.beginPath();
    ctx.rect(cam.x - 4, cam.y - 4, VW + 8, VH + 8);
    ctx.arc(p.x, p.y, vision, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    const grd = ctx.createRadialGradient(p.x, p.y, vision * 0.5, p.x, p.y, vision);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, vision, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPrompt() {
    const p = g.player;
    if (p.caught) return;
    let tip = "";
    if (g.phase === "hide" && p.role === "seeker") tip = "Жди у входа…";
    else if (p.role === "hider") {
      if (p.prop) tip = p.moving ? "Стой! Движение выдаёт" : "E — выйти из вещи";
      else if (nearestProp(p)) tip = "E — стать вещью";
      else tip = "Найди вещь в доме";
    } else if (g.phase === "seek") tip = "E — проверить вблизи";
    if (!tip) return;
    ctx.font = "700 13px Outfit, sans-serif";
    const tw = ctx.measureText(tip).width;
    ctx.fillStyle = "rgba(20,16,12,0.78)";
    roundRect(p.x - tw / 2 - 10, p.y - 48, tw + 20, 24, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(tip, p.x, p.y - 32);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, VW, VH);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawHouse();
    for (const p of g.props) drawProp(p);
    for (const a of g.actors) drawActor(a);
    drawFog();
    drawPrompt();
    ctx.restore();
  }

  function loop(now) {
    if (state !== "play") return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    if (state === "play") requestAnimationFrame(loop);
  }
})();
