(() => {
  // Экран камеры (половина мира видно)
  const VW = 960;
  const VH = 640;
  // Большой дом
  const MW = 1600;
  const MH = 1100;

  const HIDE_SEC = 25;
  const SEEK_SEC = 90;
  const CATCH_R = 32;
  const PROP_R = 40;
  const VISION_HIDER = 160;
  const VISION_SEEKER = 200;

  const PROP_TYPES = [
    { id: "vase", name: "Ваза", color: "#c45a8a", w: 22, h: 34 },
    { id: "fireplace", name: "Камин", color: "#8b4513", w: 48, h: 40 },
    { id: "chair", name: "Стул", color: "#a67c52", w: 28, h: 30 },
    { id: "lamp", name: "Лампа", color: "#f0d060", w: 18, h: 36 },
    { id: "plant", name: "Цветок", color: "#3d9a5f", w: 26, h: 32 },
    { id: "sofa", name: "Диван", color: "#5a6ea8", w: 56, h: 28 },
    { id: "table", name: "Стол", color: "#6b4a2e", w: 44, h: 28 },
    { id: "clock", name: "Часы", color: "#d4c4a0", w: 24, h: 24 },
    { id: "box", name: "Ящик", color: "#b8894a", w: 30, h: 26 },
    { id: "mirror", name: "Зеркало", color: "#9ec8e0", w: 22, h: 36 },
    { id: "tv", name: "ТВ", color: "#2a2a32", w: 40, h: 28 },
    { id: "book", name: "Книга", color: "#c04040", w: 20, h: 26 },
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

  // Стены дома + комнаты
  const walls = [
    { x: 0, y: 0, w: MW, h: 28 },
    { x: 0, y: MH - 28, w: MW, h: 28 },
    { x: 0, y: 0, w: 28, h: MH },
    { x: MW - 28, y: 0, w: 28, h: MH },
    // перегородки
    { x: 380, y: 28, w: 24, h: 320 },
    { x: 380, y: 420, w: 24, h: 280 },
    { x: 780, y: 28, w: 24, h: 260 },
    { x: 780, y: 380, w: 24, h: 340 },
    { x: 28, y: 400, w: 220, h: 24 },
    { x: 320, y: 400, w: 280, h: 24 },
    { x: 700, y: 520, w: 400, h: 24 },
    { x: 1100, y: 28, w: 24, h: 400 },
    { x: 1100, y: 520, w: 24, h: 280 },
    { x: 1200, y: 300, w: 280, h: 24 },
  ];

  function makeProps() {
    const spots = [
      [120, 120], [220, 180], [300, 100], [160, 300],
      [500, 120], [600, 200], [700, 140], [520, 320],
      [900, 120], [1000, 200], [920, 320], [1050, 400],
      [200, 520], [320, 600], [480, 560], [640, 640],
      [880, 620], [1000, 700], [1200, 160], [1300, 240],
      [1400, 180], [1250, 420], [1380, 480], [1280, 650],
      [150, 750], [400, 780], [700, 800], [950, 850],
      [1200, 820], [1400, 780], [550, 480], [850, 450],
    ];
    return spots.map((p, i) => {
      const t = PROP_TYPES[i % PROP_TYPES.length];
      return {
        x: p[0],
        y: p[1],
        type: t,
        taken: false,
      };
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
      if (Math.abs(dx) / px > Math.abs(dy) / py) {
        ent.x = cx + Math.sign(dx || 1) * px;
      } else {
        ent.y = cy + Math.sign(dy || 1) * py;
      }
    }
    ent.x = Math.max(r + 30, Math.min(MW - r - 30, ent.x));
    ent.y = Math.max(r + 30, Math.min(MH - r - 30, ent.y));
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pickFree() {
    for (let i = 0; i < 50; i++) {
      const p = { x: rand(80, MW - 80), y: rand(80, MH - 80) };
      let ok = true;
      for (const w of walls) {
        if (circleRectHit(p.x, p.y, 20, w)) {
          ok = false;
          break;
        }
      }
      if (ok) return p;
    }
    return { x: MW / 2, y: MH / 2 };
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
      r: 14,
      speed: role === "seeker" ? 170 : 150,
      caught: false,
      prop: null,
      propLocked: false,
      aiTimer: rand(0.5, 1.4),
      aiTx: x,
      aiTy: y,
      face: 1,
      bob: Math.random() * 6,
    };
  }

  function startGame(playerRole) {
    const props = makeProps();
    const actors = [];

    const spawn = pickFree();
    const player = makeActor(playerRole, true, spawn.x, spawn.y, "Ты");
    actors.push(player);

    // Мало людей: 1 искатель + 1 хозяин (игрок занимает одну роль)
    if (playerRole === "seeker") {
      const h = pickFree();
      actors.push(makeActor("hider", false, h.x, h.y, "Хозяин"));
    } else {
      const s = pickFree();
      actors.push(makeActor("seeker", false, s.x, s.y, "Искатель"));
    }

    g = {
      playerRole,
      player,
      actors,
      props,
      phase: "hide", // hide | seek | end
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
    toast("Время прятаться! Стань вещью (E у вазы, камина…)");
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
      toast("Снова человек");
      return;
    }
    const p = nearestProp(ent);
    if (!p) {
      toast("Подойди ближе к вещи");
      return;
    }
    p.taken = true;
    ent.prop = p;
    ent.x = p.x;
    ent.y = p.y;
    ent.propLocked = true;
    toast(`Ты стал: ${p.type.name}!`);
  }

  function tryCatch(seeker) {
    if (g.phase !== "seek") {
      if (seeker.isPlayer) toast("Подожди — ещё время прятаться");
      return;
    }
    let best = null;
    let bd = CATCH_R;
    for (const a of g.actors) {
      if (a.role !== "hider" || a.caught) continue;
      const d = dist(seeker, a);
      // в виде вещи ловить чуть сложнее — нужно ближе
      const need = a.prop ? CATCH_R * 0.75 : CATCH_R;
      if (d < need && d < bd) {
        bd = d;
        best = a;
      }
    }
    if (!best) {
      if (seeker.isPlayer) toast("Рядом никого нет");
      return;
    }
    best.caught = true;
    if (best.prop) {
      best.prop.taken = false;
      best.prop = null;
    }
    toast(best.isPlayer ? "Хозяина нашли!" : "Хозяин пойман!");
  }

  function playerAction() {
    const p = g.player;
    if (p.caught) return;
    if (p.role === "hider") becomeProp(p);
    else tryCatch(p);
  }

  function moveEntity(ent, dx, dy, dt) {
    if (ent.caught) return;
    if (ent.prop && ent.propLocked) {
      // как вещь можно чуть шевелиться, но медленно — или стоять
      if (ent.isPlayer && (dx || dy)) {
        // выход из полной блокировки при движении — остаёмся вещью, но двигаемся медленно
        ent.propLocked = false;
      } else {
        ent.x = ent.prop.x;
        ent.y = ent.prop.y;
        return;
      }
    }
    if (g.phase === "hide" && ent.role === "seeker") {
      // искатели ждут в углу во время пряток
      return;
    }
    const sp = ent.speed * (ent.prop ? 0.55 : 1);
    ent.x += dx * sp * dt;
    ent.y += dy * sp * dt;
    if (Math.abs(dx) > 0.1) ent.face = dx > 0 ? 1 : -1;
    resolveWalls(ent, ent.r);
    if (ent.prop && !ent.propLocked) {
      ent.prop.x = ent.x;
      ent.prop.y = ent.y;
    }
  }

  function updateAI(ent, dt) {
    if (ent.isPlayer || ent.caught) return;

    if (g.phase === "hide" && ent.role === "seeker") return;

    ent.aiTimer -= dt;
    if (ent.aiTimer <= 0) {
      ent.aiTimer = rand(0.7, 1.8);
      if (ent.role === "hider") {
        if (!ent.prop) {
          // идём к ближайшей вещи
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
        } else if (g.phase === "seek" && Math.random() < 0.3) {
          const p = pickFree();
          ent.aiTx = p.x;
          ent.aiTy = p.y;
        }
      } else {
        // искатель ищет хозяина или бродит
        const hider = g.actors.find((a) => a.role === "hider" && !a.caught);
        if (hider && Math.random() < 0.55) {
          ent.aiTx = hider.x + rand(-80, 80);
          ent.aiTy = hider.y + rand(-80, 80);
        } else {
          const p = pickFree();
          ent.aiTx = p.x;
          ent.aiTy = p.y;
        }
      }
    }

    let dx = ent.aiTx - ent.x;
    let dy = ent.aiTy - ent.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len < 18) {
      dx = 0;
      dy = 0;
      if (ent.role === "hider" && !ent.prop && g.phase === "hide") {
        becomeProp(ent);
      }
      if (ent.role === "seeker" && g.phase === "seek" && Math.random() < 0.05) {
        tryCatch(ent);
      }
    } else {
      dx /= len;
      dy /= len;
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
        toast("Поиск начался! Искатели ищут хозяина");
        // искателей ставим у входа
        for (const a of g.actors) {
          if (a.role === "seeker") {
            a.x = 80;
            a.y = MH / 2;
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
      if (g.phase === "hide" && g.player.role === "seeker") {
        // ждём
      } else {
        moveEntity(g.player, dir.x, dir.y, dt);
      }
    }

    for (const a of g.actors) {
      a.bob += dt * 4;
      updateAI(a, dt);
    }

    // камера следует за игроком
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
    let phaseTxt;
    let timeTxt;
    if (g.phase === "hide") {
      phaseTxt = "ПРЯТКИ";
      timeTxt = Math.ceil(g.hideLeft) + "с";
    } else {
      phaseTxt = "ПОИСК";
      timeTxt = Math.ceil(g.seekLeft) + "с";
    }
    const prop = g.player.prop ? g.player.prop.type.name : "—";
    hud.innerHTML = `
      <span class="pill">${role}</span>
      <span class="pill">${phaseTxt} · ${timeTxt}</span>
      <span class="pill">${g.playerRole === "hider" ? "Вещь: " + prop : "Найди хозяина"}</span>
    `;
  }

  function drawProp(p, asDecoy) {
    const t = p.type;
    const x = p.x;
    const y = p.y;
    ctx.fillStyle = t.color;
    ctx.strokeStyle = "#1a1208";
    ctx.lineWidth = 2;

    if (t.id === "vase") {
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 14);
      ctx.lineTo(x - 10, y - 6);
      ctx.lineTo(x - 6, y - 16);
      ctx.lineTo(x + 6, y - 16);
      ctx.lineTo(x + 10, y - 6);
      ctx.lineTo(x + 8, y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (t.id === "fireplace") {
      ctx.fillRect(x - t.w / 2, y - t.h / 2, t.w, t.h);
      ctx.strokeRect(x - t.w / 2, y - t.h / 2, t.w, t.h);
      ctx.fillStyle = "#e85a20";
      ctx.fillRect(x - 12, y - 4, 24, 16);
    } else if (t.id === "lamp") {
      ctx.fillRect(x - 3, y - 4, 6, 18);
      ctx.beginPath();
      ctx.arc(x, y - 14, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe08a";
      ctx.fill();
      ctx.stroke();
    } else if (t.id === "plant") {
      ctx.fillStyle = "#6b4a2e";
      ctx.fillRect(x - 8, y + 4, 16, 12);
      ctx.fillStyle = "#3d9a5f";
      ctx.beginPath();
      ctx.arc(x, y - 8, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.id === "clock") {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 8);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 6, y);
      ctx.stroke();
    } else {
      ctx.fillRect(x - t.w / 2, y - t.h / 2, t.w, t.h);
      ctx.strokeRect(x - t.w / 2, y - t.h / 2, t.w, t.h);
    }

    if (!asDecoy) {
      ctx.fillStyle = "rgba(20,30,20,0.7)";
      ctx.font = "700 10px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t.name, x, y + t.h / 2 + 12);
    }
  }

  function drawActor(a) {
    if (a.caught) return;
    if (a.prop) {
      // рисуется как вещь через props; лёгкая метка только себе
      if (a.isPlayer) {
        ctx.strokeStyle = "rgba(255,220,80,0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(a.x - 20, a.y - 22, 40, 44);
        ctx.setLineDash([]);
      }
      return;
    }

    const bounce = Math.sin(a.bob) * 2;
    ctx.beginPath();
    ctx.arc(a.x, a.y + bounce, a.r, 0, Math.PI * 2);
    ctx.fillStyle = a.role === "seeker" ? "#e23d1e" : "#0f9f82";
    ctx.fill();
    if (a.isPlayer) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "800 11px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(a.role === "seeker" ? "И" : "Х", a.x, a.y + bounce + 4);
  }

  function drawWorld() {
    // пол
    ctx.fillStyle = "#e8d9c0";
    ctx.fillRect(0, 0, MW, MH);

    // плитка
    ctx.strokeStyle = "rgba(80,50,20,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < MW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MH);
      ctx.stroke();
    }
    for (let y = 0; y < MH; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MW, y);
      ctx.stroke();
    }

    // ковры комнат
    ctx.fillStyle = "rgba(180,60,60,0.12)";
    ctx.fillRect(40, 40, 320, 340);
    ctx.fillStyle = "rgba(60,100,160,0.10)";
    ctx.fillRect(420, 40, 340, 340);
    ctx.fillStyle = "rgba(60,140,80,0.10)";
    ctx.fillRect(820, 40, 260, 450);
    ctx.fillStyle = "rgba(140,100,60,0.10)";
    ctx.fillRect(1140, 40, 420, 240);

    // стены
    for (const w of walls) {
      ctx.fillStyle = "#6a5340";
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = "#3d2e22";
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }

    // вещи (декор + занятые хозяевами)
    for (const p of g.props) {
      drawProp(p, false);
    }

    for (const a of g.actors) drawActor(a);
  }

  function drawFog() {
    const p = g.player;
    const vision = p.role === "hider" ? VISION_HIDER : VISION_SEEKER;
    // тёмный слой с круглой «дыркой» обзора
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.82)";
    ctx.beginPath();
    ctx.rect(cam.x - 2, cam.y - 2, VW + 4, VH + 4);
    ctx.arc(p.x, p.y, vision, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    // мягкий край
    const grd = ctx.createRadialGradient(p.x, p.y, vision * 0.55, p.x, p.y, vision);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.35)");
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
    if (g.phase === "hide" && p.role === "seeker") {
      tip = "Жди… прячущиеся прячутся";
    } else if (p.role === "hider") {
      if (p.prop) tip = "E — снова стать человеком";
      else if (nearestProp(p)) tip = "E — стать этой вещью";
      else tip = "Подойди к вазе, камину…";
    } else if (g.phase === "seek") {
      tip = "E — поймать хозяина";
    }
    if (!tip) return;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.font = "700 14px Outfit, sans-serif";
    const tw = ctx.measureText(tip).width;
    const x = p.x;
    const y = p.y - 36;
    ctx.fillRect(x - tw / 2 - 10, y - 16, tw + 20, 24);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(tip, x, y);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, VW, VH);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawWorld();
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
