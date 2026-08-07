(() => {
  const VW = 960;
  const VH = 640;
  // Один этаж — одинаковый на всех 5 этажах
  const MW = 1400;
  const MH = 900;
  const FLOORS = 5;

  const HIDE_SEC = 35;
  const SEEK_SEC = 120;
  const CATCH_R = 26;
  const PROP_CATCH_R = 18;
  const PROP_R = 38;
  const VISION_HIDER = 155;
  const VISION_SEEKER = 175;
  const HIDER_COUNT = 10;
  const SEEKER_COUNT = 2;

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
    // новые
    { id: "guitar", name: "Гитара" },
    { id: "computer", name: "Компьютер" },
    { id: "microscope", name: "Микроскоп" },
    { id: "trophy", name: "Кубок" },
    { id: "fishbowl", name: "Аквариум" },
    { id: "bike", name: "Велосипед" },
    { id: "safe", name: "Сейф" },
    { id: "cactus", name: "Кактус" },
    { id: "globe", name: "Глобус" },
    { id: "fan", name: "Вентилятор" },
  ];

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const hudInfo = document.getElementById("hudInfo");
  const toastEl = document.getElementById("toast");
  const touch = document.getElementById("touch");
  const menu = document.getElementById("menu");
  const mapSelect = document.getElementById("mapSelect");
  const mapGrid = document.getElementById("mapGrid");
  const endPanel = document.getElementById("endPanel");
  const stickEl = document.getElementById("stick");
  const actBtn = document.getElementById("actBtn");
  const btnMenu = document.getElementById("btnMenu");
  const btnBackRole = document.getElementById("btnBackRole");

  const MAPS = [
    { id: "house", name: "Дом", icon: "🏠", floors: 5, theme: "house" },
    { id: "street", name: "Улица", icon: "🛣️", floors: 1, theme: "street" },
    { id: "carousel", name: "Карусель", icon: "🎠", floors: 1, theme: "carousel" },
    { id: "playground", name: "Площадка", icon: "🛝", floors: 1, theme: "playground" },
    { id: "park", name: "Парк", icon: "🌳", floors: 1, theme: "park" },
    { id: "school", name: "Школа", icon: "🏫", floors: 1, theme: "school" },
    { id: "shop", name: "Магазин", icon: "🛒", floors: 1, theme: "shop" },
    { id: "museum", name: "Музей", icon: "🏛️", floors: 1, theme: "museum" },
    { id: "farm", name: "Ферма", icon: "🌾", floors: 1, theme: "farm" },
    { id: "beach", name: "Пляж", icon: "🏖️", floors: 1, theme: "beach" },
  ];

  let pendingRole = null;
  let selectedMap = MAPS[0];

  function showEl(el) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute("aria-hidden");
    if (el === touch) el.style.removeProperty("display");
    else if (el === hud) el.style.setProperty("display", "flex", "important");
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
  hideEl(mapSelect);
  showEl(menu);

  mapGrid.innerHTML = MAPS.map(
    (m) =>
      `<button type="button" class="map-card" data-map="${m.id}"><span class="ico">${m.icon}</span><span class="ttl">${m.name}</span></button>`
  ).join("");

  mapGrid.querySelectorAll("[data-map]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMap = MAPS.find((m) => m.id === btn.dataset.map) || MAPS[0];
      startGame(pendingRole, selectedMap);
    });
  });

  btnBackRole.addEventListener("click", () => {
    hideEl(mapSelect);
    showEl(menu);
    state = "menu";
  });

  btnMenu.addEventListener("click", () => goToMenu());

  function goToMenu() {
    state = "menu";
    g = null;
    hideEl(hud);
    hideEl(touch);
    hideEl(endPanel);
    hideEl(mapSelect);
    showEl(menu);
  }

  let toastTimer = 0;
  function toast(msg, ms = 2400) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  // Базовые стены дома
  const HOUSE_WALLS = [
    { x: 0, y: 0, w: MW, h: 28 },
    { x: 0, y: MH - 28, w: MW, h: 28 },
    { x: 0, y: 0, w: 28, h: MH },
    { x: MW - 28, y: 0, w: 28, h: MH },
    { x: 360, y: 28, w: 20, h: 280 },
    { x: 360, y: 380, w: 20, h: 300 },
    { x: 720, y: 28, w: 20, h: 250 },
    { x: 720, y: 360, w: 20, h: 340 },
    { x: 28, y: 380, w: 200, h: 20 },
    { x: 300, y: 380, w: 280, h: 20 },
    { x: 640, y: 480, w: 360, h: 20 },
    { x: 1040, y: 28, w: 20, h: 360 },
    { x: 1040, y: 480, w: 20, h: 250 },
    { x: 1120, y: 280, w: 220, h: 20 },
  ];
  const OPEN_WALLS = [
    { x: 0, y: 0, w: MW, h: 20 },
    { x: 0, y: MH - 20, w: MW, h: 20 },
    { x: 0, y: 0, w: 20, h: MH },
    { x: MW - 20, y: 0, w: 20, h: MH },
  ];

  function wallsFor(map) {
    if (!map || map.theme === "house" || map.theme === "school" || map.theme === "shop" || map.theme === "museum") {
      return HOUSE_WALLS;
    }
    return OPEN_WALLS;
  }

  let walls = HOUSE_WALLS;

  const ROOMS = [
    { name: "Гостиная", x: 40, y: 40, w: 300, h: 320 },
    { name: "Кухня", x: 400, y: 40, w: 300, h: 320 },
    { name: "Спальня", x: 760, y: 40, w: 260, h: 300 },
    { name: "Кабинет", x: 1080, y: 40, w: 280, h: 220 },
    { name: "Коридор", x: 40, y: 420, w: 300, h: 240 },
    { name: "Зал", x: 400, y: 420, w: 300, h: 220 },
    { name: "Кладовая", x: 760, y: 520, w: 260, h: 220 },
    { name: "Балкон", x: 1080, y: 320, w: 280, h: 320 },
  ];

  // Лестницы: вверх и вниз на каждом этаже
  const STAIRS = [
    { x: 180, y: 820, w: 70, h: 50, dir: "up", label: "↑ вверх" },
    { x: 280, y: 820, w: 70, h: 50, dir: "down", label: "↓ вниз" },
    { x: 1180, y: 820, w: 70, h: 50, dir: "up", label: "↑ вверх" },
    { x: 1280, y: 820, w: 70, h: 50, dir: "down", label: "↓ вниз" },
  ];

  const PROP_SPOTS = [
    [100, 120], [180, 100], [260, 150], [120, 240], [220, 280], [300, 200],
    [450, 110], [540, 140], [640, 100], [480, 240], [580, 280], [660, 220],
    [800, 120], [900, 150], [980, 110], [840, 240], [940, 280],
    [1140, 100], [1240, 140], [1320, 120], [1180, 200],
    [100, 500], [200, 540], [280, 600], [140, 640],
    [450, 500], [550, 540], [650, 500], [500, 600], [600, 640],
    [800, 580], [900, 620], [980, 560], [860, 700],
    [1140, 400], [1240, 460], [1320, 520], [1180, 600], [1280, 680],
    [160, 360], [500, 360], [880, 340], [1200, 260],
  ];

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
    ent.x = Math.max(r + 30, Math.min(MW - r - 30, ent.x));
    ent.y = Math.max(r + 30, Math.min(MH - r - 30, ent.y));
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function isBlocked(x, y, r = 16) {
    for (const w of walls) if (circleRectHit(x, y, r, w)) return true;
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
  function pickFree(floor) {
    const room = ROOMS[(Math.random() * ROOMS.length) | 0];
    const p = pickInRoom(room);
    const maxF = g && g.floorMax ? g.floorMax : selectedMap.floors || 1;
    return {
      x: p.x,
      y: p.y,
      floor: floor == null ? ((Math.random() * maxF) | 0) : floor,
    };
  }

  function makePropsForFloor(floor) {
    return PROP_SPOTS.map((p, i) => {
      const t = PROP_TYPES[(i + floor * 3) % PROP_TYPES.length];
      return { x: p[0], y: p[1], floor, type: t, taken: false };
    });
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
    btn.addEventListener("click", () => {
      pendingRole = btn.dataset.role;
      hideEl(menu);
      showEl(mapSelect);
      state = "maps";
    });
  });

  function makeActor(role, isPlayer, x, y, floor, name) {
    return {
      role,
      isPlayer,
      name,
      x,
      y,
      floor,
      r: role === "seeker" ? 15 : 13,
      speed: role === "seeker" ? 155 : 148,
      caught: false,
      prop: null,
      propLocked: false,
      moving: false,
      aiTimer: rand(0.5, 1.4),
      aiTx: x,
      aiTy: y,
      patrolRoom: (Math.random() * ROOMS.length) | 0,
      face: 1,
      bob: Math.random() * 6,
      stillTime: 0,
      stuckTime: 0,
      lastX: x,
      lastY: y,
      stairCd: 0,
    };
  }

  function startGame(playerRole, map) {
    selectedMap = map || selectedMap || MAPS[0];
    walls = wallsFor(selectedMap);
    const floorMax = selectedMap.floors || 1;

    const props = [];
    for (let f = 0; f < floorMax; f++) props.push(...makePropsForFloor(f));

    const actors = [];
    const pSpawn = pickFree(selectedMap.theme === "house" ? 0 : 0);
    pSpawn.floor = Math.min(pSpawn.floor, floorMax - 1);
    const player = makeActor(playerRole, true, pSpawn.x, pSpawn.y, 0, "Ты");
    actors.push(player);

    let hiders = playerRole === "hider" ? 1 : 0;
    let seekers = playerRole === "seeker" ? 1 : 0;

    while (hiders < HIDER_COUNT) {
      const s = pickFree();
      s.floor = s.floor % floorMax;
      actors.push(makeActor("hider", false, s.x, s.y, s.floor, "Прячущийся " + (hiders + 1)));
      hiders++;
    }
    while (seekers < SEEKER_COUNT) {
      actors.push(makeActor("seeker", false, 80 + seekers * 40, MH / 2, 0, "Искатель " + seekers));
      seekers++;
    }

    g = {
      playerRole,
      player,
      actors,
      props,
      map: selectedMap,
      floorMax,
      phase: "hide",
      hideLeft: HIDE_SEC,
      seekLeft: SEEK_SEC,
      win: null,
      msg: "",
    };

    cam.x = player.x - VW / 2;
    cam.y = player.y - VH / 2;
    hideEl(menu);
    hideEl(mapSelect);
    hideEl(endPanel);
    showEl(hud);
    showEl(touch);
    state = "play";
    toast(selectedMap.name + ": прячься! Искатели пока ничего не видят");
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

  function propsOnFloor(floor) {
    return g.props.filter((p) => p.floor === floor);
  }

  function nearestProp(ent) {
    let best = null;
    let bd = PROP_R;
    for (const p of propsOnFloor(ent.floor)) {
      if (p.taken && (!ent.prop || ent.prop !== p)) continue;
      const d = dist(ent, p);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  function stairAt(ent) {
    for (const s of STAIRS) {
      if (
        ent.x > s.x &&
        ent.x < s.x + s.w &&
        ent.y > s.y &&
        ent.y < s.y + s.h
      ) {
        return s;
      }
    }
    return null;
  }

  function useStairs(ent, stair) {
    if (ent.stairCd > 0) return false;
    let next = ent.floor;
    if (stair.dir === "up") next = Math.min(g.floorMax - 1, ent.floor + 1);
    else next = Math.max(0, ent.floor - 1);
    if (next === ent.floor) {
      if (ent.isPlayer) toast(stair.dir === "up" ? "Уже самый верхний этаж" : "Уже первый этаж");
      return false;
    }
    if (ent.prop) {
      ent.prop.floor = next;
      ent.prop.x = stair.x + stair.w / 2 + (stair.dir === "up" ? 50 : -50);
      ent.prop.y = stair.y - 40;
      ent.x = ent.prop.x;
      ent.y = ent.prop.y;
    } else {
      ent.x = stair.x + stair.w / 2;
      ent.y = stair.y - 40;
    }
    ent.floor = next;
    ent.stairCd = 1.1;
    if (ent.isPlayer) toast("Этаж " + (next + 1) + " / " + g.floorMax);
    return true;
  }

  function becomeProp(ent) {
    if (ent.role !== "hider" || ent.caught) return;
    if (ent.prop) {
      ent.prop.taken = false;
      ent.prop = null;
      ent.propLocked = false;
      if (ent.isPlayer) toast("Снова человек");
      return;
    }
    const p = nearestProp(ent);
    if (!p) {
      if (ent.isPlayer) toast("Подойди к вещи");
      return;
    }
    p.taken = true;
    ent.prop = p;
    ent.x = p.x;
    ent.y = p.y;
    ent.propLocked = true;
    if (ent.isPlayer) toast("Ты: " + p.type.name + ". Стой тихо!");
  }

  function tryCatch(seeker) {
    if (g.phase !== "seek") {
      if (seeker.isPlayer) toast("Ещё время прятаться");
      return;
    }
    let best = null;
    let bd = 99;
    for (const a of g.actors) {
      if (a.role !== "hider" || a.floor !== seeker.floor) continue;
      const d = dist(seeker, a);
      const need = a.prop ? PROP_CATCH_R : CATCH_R;
      const bonus = a.prop && a.moving ? 8 : 0;
      if (d < need + bonus && d < bd) {
        bd = d;
        best = a;
      }
    }
    if (!best) {
      if (seeker.isPlayer) toast("Пусто на этом месте");
      return;
    }
    // Пойманный становится искателем
    if (best.prop) {
      best.prop.taken = false;
      best.prop = null;
    }
    best.propLocked = false;
    best.role = "seeker";
    best.r = 15;
    best.speed = 155;
    best.caught = false;
    if (best.isPlayer) {
      g.playerRole = "seeker";
      toast("Тебя нашли! Теперь ты искатель — ищи остальных!");
    } else {
      const left = g.actors.filter((a) => a.role === "hider").length;
      toast("Пойман → стал искателем! Прячущихся: " + left);
    }
  }

  function playerAction() {
    const p = g.player;
    const st = stairAt(p);
    if (st && g.floorMax > 1) {
      useStairs(p, st);
      return;
    }
    if (p.role === "hider") becomeProp(p);
    else tryCatch(p);
  }

  function moveEntity(ent, dx, dy, dt) {
    if (ent.caught) return;
    if (ent.stairCd > 0) ent.stairCd -= dt;
    const moving = !!(dx || dy);

    if (ent.prop && ent.propLocked && !moving) {
      ent.x = ent.prop.x;
      ent.y = ent.prop.y;
      ent.moving = false;
      ent.stillTime += dt;
      return;
    }
    if (ent.prop && ent.propLocked && moving) ent.propLocked = false;
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
        ent.prop.floor = ent.floor;
      }
    } else {
      ent.moving = false;
      ent.stillTime += dt;
    }

    // авто-лестница при наступании
    if (ent.stairCd <= 0) {
      const st = stairAt(ent);
      if (st && (ent.isPlayer ? false : Math.random() < 0.02 || !ent.isPlayer)) {
        // player uses E; bots auto sometimes
        if (!ent.isPlayer && Math.random() < 0.015) useStairs(ent, st);
      }
    }
  }

  function updateAI(ent, dt) {
    if (ent.isPlayer || ent.caught) return;
    if (g.phase === "hide" && ent.role === "seeker") return;

    const moved = Math.hypot(ent.x - ent.lastX, ent.y - ent.lastY);
    if (ent.moving && moved < 2 * dt * ent.speed * 0.15) ent.stuckTime += dt;
    else ent.stuckTime = 0;
    ent.lastX = ent.x;
    ent.lastY = ent.y;
    if (ent.stuckTime > 0.55) {
      ent.stuckTime = 0;
      ent.aiTimer = 0;
      const spot = pickInRoom(ROOMS[(Math.random() * ROOMS.length) | 0]);
      ent.aiTx = spot.x;
      ent.aiTy = spot.y;
    }

    // боты иногда меняют этаж
    if (ent.stairCd <= 0 && Math.random() < 0.004) {
      const st = STAIRS[(Math.random() * STAIRS.length) | 0];
      ent.aiTx = st.x + st.w / 2;
      ent.aiTy = st.y + st.h / 2;
      ent.aiTimer = 2;
    }
    const stNear = stairAt(ent);
    if (stNear && !ent.isPlayer && ent.stairCd <= 0 && Math.random() < 0.04) {
      useStairs(ent, stNear);
    }

    ent.aiTimer -= dt;
    if (ent.aiTimer <= 0) {
      ent.aiTimer = rand(1.0, 2.2);
      if (ent.role === "hider") {
        if (!ent.prop) {
          let best = null;
          let bd = 1e9;
          for (const p of propsOnFloor(ent.floor)) {
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
        const visibleHider = g.actors.find(
          (a) =>
            a.role === "hider" &&
            a.floor === ent.floor &&
            ((!a.prop && dist(ent, a) < VISION_SEEKER * 0.95) ||
              (a.prop && a.moving && dist(ent, a) < 90 && Math.random() < 0.35))
        );
        if (visibleHider) {
          ent.aiTx = visibleHider.x + rand(-20, 20);
          ent.aiTy = visibleHider.y + rand(-20, 20);
          ent.aiTimer = rand(0.35, 0.7);
        } else {
          if (Math.random() < 0.5) ent.patrolRoom = (ent.patrolRoom + 1) % ROOMS.length;
          else if (Math.random() < 0.25) ent.patrolRoom = (Math.random() * ROOMS.length) | 0;
          const spot = pickInRoom(ROOMS[ent.patrolRoom]);
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
      if (ent.role === "seeker" && g.phase === "seek") {
        tryCatch(ent);
        ent.aiTimer = 0.25;
        const spot = pickInRoom(ROOMS[(Math.random() * ROOMS.length) | 0]);
        ent.aiTx = spot.x;
        ent.aiTy = spot.y;
      }
    } else {
      dx /= len;
      dy /= len;
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
        } else ent.aiTimer = 0;
      }
    }
    moveEntity(ent, dx, dy, dt);
  }

  function checkEnd() {
    const hidersLeft = g.actors.filter((a) => a.role === "hider").length;
    if (hidersLeft === 0) {
      g.win = "seeker";
      g.msg = "Все прячущиеся пойманы и стали искателями!";
      return true;
    }
    if (g.phase === "seek" && g.seekLeft <= 0) {
      g.win = "hider";
      g.msg = "Время вышло! Ещё прячутся: " + hidersLeft;
      return true;
    }
    return false;
  }

  function finish() {
    state = "end";
    g.phase = "end";
    hideEl(hud);
    hideEl(touch);
    // Победа по текущей роли в конце
    const win =
      g.win === "seeker"
        ? g.player.role === "seeker"
        : g.player.role === "hider";
    showEl(endPanel);
    endPanel.innerHTML = `
      <h1>${win ? "Победа!" : "Поражение"}</h1>
      <p class="sub">${g.msg}</p>
      <div class="roles">
        <button type="button" class="btn again" id="again">Ещё раз</button>
        <button type="button" class="btn ghost" id="tomenu">В меню</button>
      </div>
    `;
    endPanel.querySelector("#again").onclick = () => startGame(g.playerRole, g.map);
    endPanel.querySelector("#tomenu").onclick = () => goToMenu();
  }

  function update(dt) {
    if (g.phase === "hide") {
      g.hideLeft = Math.max(0, g.hideLeft - dt);
      if (g.hideLeft <= 0) {
        g.phase = "seek";
        toast("Поиск! Пойманный становится искателем");
        let i = 0;
        for (const a of g.actors) {
          if (a.role === "seeker") {
            a.floor = 0;
            a.x = 80 + i * 50;
            a.y = MH / 2;
            i++;
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
    if (!hudInfo) return;
    const role = g.player.role === "seeker" ? "Искатель" : "Прячущийся";
    const phaseTxt = g.phase === "hide" ? "ПРЯТКИ" : "ПОИСК";
    const timeTxt = Math.ceil(g.phase === "hide" ? g.hideLeft : g.seekLeft) + "с";
    const floor =
      g.floorMax > 1 ? `Этаж ${g.player.floor + 1}/${g.floorMax}` : g.map.name;
    const left = g.actors.filter((a) => a.role === "hider").length;
    const seekers = g.actors.filter((a) => a.role === "seeker").length;
    hudInfo.innerHTML = `
      <span class="pill">${role}</span>
      <span class="pill">${floor}</span>
      <span class="pill">${phaseTxt} · ${timeTxt}</span>
      <span class="pill">Пряч. ${left} · Иск. ${seekers}</span>
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
    } else if (id === "fireplace") {
      ctx.fillStyle = "#5c3a28";
      roundRect(-28, -22, 56, 44, 4);
      ctx.fill();
      ctx.fillStyle = "#ff6a20";
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.quadraticCurveTo(0, -10, 10, 12);
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
    } else if (id === "plant" || id === "cactus") {
      ctx.fillStyle = "#c47a4a";
      roundRect(-10, 4, 20, 14, 3);
      ctx.fill();
      ctx.fillStyle = id === "cactus" ? "#3d9a5a" : "#2f8f4e";
      if (id === "cactus") {
        roundRect(-6, -18, 12, 24, 4);
        ctx.fill();
        roundRect(-14, -8, 10, 8, 3);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, -10, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "sofa") {
      ctx.fillStyle = "#4a6fa5";
      roundRect(-34, -10, 68, 28, 8);
      ctx.fill();
    } else if (id === "table") {
      ctx.fillStyle = "#a07040";
      roundRect(-26, -8, 52, 18, 3);
      ctx.fill();
    } else if (id === "clock" || id === "globe") {
      ctx.fillStyle = id === "globe" ? "#3a7ec0" : "#e8dcc0";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8a7040";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (id === "box" || id === "wardrobe" || id === "safe") {
      ctx.fillStyle = id === "safe" ? "#555" : id === "wardrobe" ? "#6b4e32" : "#c49a5a";
      roundRect(-18, -24, 36, 48, 3);
      ctx.fill();
      if (id === "safe") {
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "mirror") {
      ctx.fillStyle = "#d0e8f5";
      roundRect(-12, -22, 24, 40, 10);
      ctx.fill();
      ctx.strokeStyle = "#c0a050";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (id === "tv" || id === "computer") {
      ctx.fillStyle = "#1a1a22";
      roundRect(-24, -16, 48, 32, 4);
      ctx.fill();
      ctx.fillStyle = id === "computer" ? "#40c070" : "#3a80c0";
      roundRect(-20, -12, 40, 22, 2);
      ctx.fill();
    } else if (id === "book") {
      ctx.fillStyle = "#b03030";
      roundRect(-10, -14, 20, 28, 2);
      ctx.fill();
    } else if (id === "piano") {
      ctx.fillStyle = "#1a1a1a";
      roundRect(-30, -14, 60, 28, 3);
      ctx.fill();
    } else if (id === "bed") {
      ctx.fillStyle = "#8a6a4a";
      roundRect(-32, -12, 64, 30, 4);
      ctx.fill();
      ctx.fillStyle = "#6a90c0";
      roundRect(-28, -2, 56, 14, 3);
      ctx.fill();
    } else if (id === "fridge") {
      ctx.fillStyle = "#d0d8e0";
      roundRect(-16, -28, 32, 56, 4);
      ctx.fill();
    } else if (id === "sink" || id === "toilet" || id === "bathtub") {
      ctx.fillStyle = "#e8eef5";
      roundRect(-20, -12, 40, 24, 8);
      ctx.fill();
    } else if (id === "painting") {
      ctx.fillStyle = "#5a3a20";
      roundRect(-18, -16, 36, 32, 2);
      ctx.fill();
      ctx.fillStyle = "#6a9ad0";
      roundRect(-14, -12, 28, 24, 1);
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
    } else if (id === "radio") {
      ctx.fillStyle = "#c08040";
      roundRect(-18, -10, 36, 22, 3);
      ctx.fill();
    } else if (id === "umbrella") {
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.fillStyle = "#3060c0";
      ctx.beginPath();
      ctx.arc(0, -8, 16, Math.PI, 0);
      ctx.fill();
    } else if (id === "guitar") {
      ctx.fillStyle = "#c48a40";
      ctx.beginPath();
      ctx.ellipse(0, 6, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3, -22, 6, 20);
    } else if (id === "microscope") {
      ctx.fillStyle = "#666";
      ctx.fillRect(-4, -8, 8, 20);
      ctx.beginPath();
      ctx.arc(0, -14, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "trophy") {
      ctx.fillStyle = "#e8c040";
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(10, -8);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-4, 8, 8, 8);
    } else if (id === "fishbowl") {
      ctx.fillStyle = "rgba(120,200,230,0.7)";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8040";
      ctx.beginPath();
      ctx.ellipse(2, 2, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "bike") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-12, 8, 10, 0, Math.PI * 2);
      ctx.arc(12, 8, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-12, 8);
      ctx.lineTo(0, -8);
      ctx.lineTo(12, 8);
      ctx.stroke();
    } else if (id === "fan") {
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ccc";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 4, (i * Math.PI) / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#a08060";
      roundRect(-14, -14, 28, 28, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSeeker(a) {
    const y = a.y + Math.sin(a.bob) * 1.5;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(a.x, a.y + 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2030";
    roundRect(a.x - 13, y - 6, 26, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#e8c4a0";
    ctx.beginPath();
    ctx.arc(a.x, y - 12, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#121820";
    ctx.beginPath();
    ctx.ellipse(a.x, y - 18, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    roundRect(a.x - 7, y - 28, 14, 12, 3);
    ctx.fill();
    if (g.phase === "seek") {
      const grd = ctx.createRadialGradient(a.x, y, 8, a.x + a.face * 70, y, 90);
      grd.addColorStop(0, "rgba(255,230,140,0.2)");
      grd.addColorStop(1, "rgba(255,230,140,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(a.x, y);
      ctx.arc(a.x, y, 90, (a.face >= 0 ? 0 : Math.PI) - 0.4, (a.face >= 0 ? 0 : Math.PI) + 0.4);
      ctx.closePath();
      ctx.fill();
    }
    if (a.isPlayer) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(a.x, y - 12, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawHiderPerson(a) {
    const y = a.y + Math.sin(a.bob) * 2;
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
    if (a.floor !== g.player.floor) return;
    if (a.prop) {
      if (a.isPlayer) {
        ctx.fillStyle = "rgba(255,210,80,0.4)";
        ctx.beginPath();
        ctx.arc(a.x, a.y + 22, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (a.role === "seeker") drawSeeker(a);
    else drawHiderPerson(a);
  }

  function drawStairs() {
    for (const s of STAIRS) {
      const can =
        (s.dir === "up" && g.player.floor < g.floorMax - 1) ||
        (s.dir === "down" && g.player.floor > 0);
      ctx.fillStyle = can ? "#c9a24a" : "#8a8070";
      roundRect(s.x, s.y, s.w, s.h, 6);
      ctx.fill();
      ctx.strokeStyle = "#5a4018";
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
      // ступеньки
      ctx.strokeStyle = "rgba(60,40,10,0.35)";
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(s.x + 4, s.y + (s.h / 4) * i);
        ctx.lineTo(s.x + s.w - 4, s.y + (s.h / 4) * i);
        ctx.stroke();
      }
      ctx.fillStyle = "#2a1a08";
      ctx.font = "800 12px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(s.label, s.x + s.w / 2, s.y + s.h / 2 + 4);
    }
  }

  function drawHouse() {
    // одинаковый пол как на 1 этаже
    ctx.fillStyle = "#d4b896";
    ctx.fillRect(0, 0, MW, MH);
    ctx.strokeStyle = "rgba(80,50,20,0.08)";
    ctx.lineWidth = 1;
    for (let y = 0; y < MH; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MW, y);
      ctx.stroke();
    }
    for (let x = 0; x < MW; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MH);
      ctx.stroke();
    }

    // ковры
    ctx.fillStyle = "rgba(160,40,40,0.22)";
    roundRect(80, 120, 200, 140, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(40,70,140,0.18)";
    roundRect(800, 120, 180, 120, 8);
    ctx.fill();

    // окна
    function windowAt(x, y) {
      ctx.fillStyle = "#7ec8e8";
      roundRect(x, y, 36, 44, 3);
      ctx.fill();
      ctx.strokeStyle = "#fff8e8";
      ctx.strokeRect(x + 2, y + 2, 32, 40);
    }
    windowAt(70, 60);
    windowAt(250, 60);
    windowAt(450, 60);
    windowAt(620, 60);
    windowAt(820, 60);
    windowAt(1160, 60);
    windowAt(1300, 60);

    for (const w of walls) {
      const gr = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
      gr.addColorStop(0, "#8a6a4e");
      gr.addColorStop(1, "#5c4432");
      ctx.fillStyle = gr;
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    ctx.fillStyle = "rgba(60,40,20,0.28)";
    ctx.font = "700 13px Outfit, sans-serif";
    ctx.textAlign = "left";
    for (const r of ROOMS) ctx.fillText(r.name, r.x + 10, r.y + 20);

    // номер этажа / название карты
    ctx.fillStyle = "rgba(80,50,20,0.15)";
    ctx.font = "800 48px Outfit, sans-serif";
    ctx.textAlign = "center";
    const label =
      g.floorMax > 1
        ? g.player.floor + 1 + " ЭТАЖ"
        : g.map.name.toUpperCase();
    ctx.fillText(label, MW / 2, MH / 2);

    if (g.floorMax > 1) drawStairs();

    // декорации по теме карты
    drawThemeDecor();
  }

  function drawThemeDecor() {
    const t = g.map.theme;
    if (t === "street" || t === "park" || t === "beach" || t === "carousel" || t === "playground" || t === "farm") {
      // открытый пол другого цвета
      // (поверх паркета лёгкий оттенок)
      ctx.fillStyle =
        t === "beach"
          ? "rgba(240,220,160,0.35)"
          : t === "park"
            ? "rgba(80,160,80,0.2)"
            : t === "farm"
              ? "rgba(180,150,80,0.25)"
              : "rgba(90,90,90,0.12)";
      ctx.fillRect(40, 40, MW - 80, MH - 80);
    }
    if (t === "carousel") {
      ctx.strokeStyle = "#e05080";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(MW / 2, MH / 2 - 40, 120, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.fillStyle = i % 2 ? "#ff80a0" : "#80c0ff";
        ctx.beginPath();
        ctx.arc(MW / 2 + Math.cos(a) * 90, MH / 2 - 40 + Math.sin(a) * 90, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (t === "playground") {
      ctx.fillStyle = "#d0d0d0";
      roundRect(200, 200, 160, 20, 4);
      ctx.fill();
      ctx.fillStyle = "#e8a020";
      roundRect(500, 180, 40, 100, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(540, 180);
      ctx.lineTo(620, 280);
      ctx.lineTo(540, 280);
      ctx.fill();
    }
    if (t === "park") {
      for (const [x, y] of [[120, 160], [400, 200], [700, 150], [1000, 220], [300, 500], [800, 560]]) {
        ctx.fillStyle = "#4a7a30";
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6b4a2e";
        ctx.fillRect(x - 4, y, 8, 30);
      }
    }
    if (t === "beach") {
      ctx.fillStyle = "#3a90c0";
      ctx.fillRect(40, MH - 200, MW - 80, 160);
      ctx.fillStyle = "#f0e0a0";
      ctx.fillRect(40, MH - 220, MW - 80, 40);
    }
  }

  function drawFog() {
    const p = g.player;
    // Во время пряток искатели не видят НИЧЕГО
    if (g.phase === "hide" && p.role === "seeker") {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#eee";
      ctx.font = "800 28px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Темно… Жди", VW / 2, VH / 2 - 10);
      ctx.font = "700 16px Outfit, sans-serif";
      ctx.fillStyle = "#aaa";
      ctx.fillText("Прячущиеся прячутся. Ты ничего не видишь.", VW / 2, VH / 2 + 24);
      ctx.fillText(Math.ceil(g.hideLeft) + "с", VW / 2, VH / 2 + 52);
      ctx.restore();
      return;
    }
    const vision = p.role === "hider" ? VISION_HIDER : VISION_SEEKER;
    ctx.save();
    ctx.fillStyle = "rgba(8,6,12,0.88)";
    ctx.beginPath();
    ctx.rect(cam.x - 4, cam.y - 4, VW + 8, VH + 8);
    ctx.arc(p.x, p.y, vision, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();
  }

  function drawPrompt() {
    const p = g.player;
    if (p.caught) return;
    let tip = "";
    const st = stairAt(p);
    if (st) tip = "E — " + st.label + " (этаж)";
    else if (g.phase === "hide" && p.role === "seeker") tip = "Жди у входа…";
    else if (p.role === "hider") {
      if (p.prop) tip = p.moving ? "Стой! Движение выдаёт" : "E — выйти из вещи";
      else if (nearestProp(p)) tip = "E — стать вещью";
      else tip = "Вещь или лестница";
    } else if (g.phase === "seek") tip = "E — проверить";
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
    // Искатель в фазе пряток — только чёрный экран
    if (g.phase === "hide" && g.player.role === "seeker") {
      drawFog();
      return;
    }
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawHouse();
    for (const p of propsOnFloor(g.player.floor)) drawProp(p);
    for (const a of g.actors) drawActor(a);
    drawFog();
    drawPrompt();
    ctx.restore();
  }

  function loop(now) {
    if (state !== "play" || !g) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    if (state === "play" && g) {
      draw();
      requestAnimationFrame(loop);
    }
  }
})();
