(() => {
  if (typeof Matter === "undefined") {
    document.getElementById("app").innerHTML =
      '<div class="overlay"><div class="panel"><h1>Ошибка</h1><p>Не загрузился файл matter.min.js. Открой игру из папки melon-playground.</p></div></div>';
    return;
  }

  const { Engine, World, Bodies, Body, Composite, Constraint, Mouse, MouseConstraint, Events, Query, Vector } = Matter;

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

  const SKINS = [
    {
      id: "classic",
      name: "Классика",
      icon: "🍉",
      light: "#7bed9f",
      mid: "#2ed573",
      dark: "#145a32",
      stripe: "rgba(20, 60, 30, 0.45)",
      hurtLight: "#c0392b",
      hurtMid: "#96281b",
      juice: "#2ecc71",
    },
    {
      id: "gold",
      name: "Золото",
      icon: "👑",
      light: "#ffeaa7",
      mid: "#f1c40f",
      dark: "#b7950b",
      stripe: "rgba(120, 90, 20, 0.45)",
      hurtLight: "#e67e22",
      hurtMid: "#d35400",
      juice: "#f7dc6f",
    },
    {
      id: "ice",
      name: "Лёд",
      icon: "❄️",
      light: "#d6eaf8",
      mid: "#5dade2",
      dark: "#1a5276",
      stripe: "rgba(40, 90, 140, 0.45)",
      hurtLight: "#85c1e9",
      hurtMid: "#3498db",
      juice: "#aed6f1",
    },
    {
      id: "night",
      name: "Ночь",
      icon: "🌙",
      light: "#bb8fce",
      mid: "#6c3483",
      dark: "#1b0a2a",
      stripe: "rgba(180, 140, 220, 0.35)",
      hurtLight: "#af7ac5",
      hurtMid: "#5b2c6f",
      juice: "#d2b4de",
    },
    {
      id: "lava",
      name: "Лава",
      icon: "🌋",
      light: "#f5b041",
      mid: "#e74c3c",
      dark: "#641e16",
      stripe: "rgba(80, 20, 10, 0.5)",
      hurtLight: "#f39c12",
      hurtMid: "#922b21",
      juice: "#e67e22",
    },
    {
      id: "ski",
      name: "Лыжник",
      icon: "🎿",
      light: "#ebf5fb",
      mid: "#85c1e9",
      dark: "#1e8449",
      stripe: "rgba(30, 100, 60, 0.4)",
      hurtLight: "#f1948a",
      hurtMid: "#c0392b",
      juice: "#58d68d",
    },
  ];

  const SKIN_KEY = "mp-melon-skin";
  const store = {
    get(k, fallback) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
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

  let currentSkinId = store.get(SKIN_KEY, "classic");
  function currentSkin() {
    return SKINS.find((s) => s.id === currentSkinId) || SKINS[0];
  }

  const TOOLS = [
    { id: "grab", icon: "✋", name: "Захват", hint: "Перетаскивай объекты" },
    { id: "melon", icon: "🍉", name: "Дыня", hint: "Клик — поставить дыню (игрока)" },
    { id: "pool", icon: "🏊", name: "Бассейн", hint: "Клик — поставить бассейн с грушами" },
    { id: "slope", icon: "🏔", name: "Склон", hint: "Клик — поставить лыжный склон" },
    { id: "toy", icon: "🧸", name: "Игрушка", hint: "Клик — игрушка (утка, мяч, лодка)" },
    { id: "ski", icon: "🎿", name: "Лыжи", hint: "Надеть лыжи на дыню или спустить лыжника со склона" },
    { id: "throw", icon: "🗡", name: "Метание", hint: "Кидай оружие только в свой бассейн" },
    { id: "pear", icon: "🍐", name: "Груша", hint: "Добавить грушу (лучше в бассейн)" },
    { id: "box", icon: "📦", name: "Ящик", hint: "Клик — поставить ящик" },
    { id: "barrel", icon: "🛢", name: "Бочка", hint: "Клик — взрывоопасная бочка" },
    { id: "platform", icon: "🧱", name: "Платформа", hint: "Клик — статичная платформа" },
    { id: "pistol", icon: "🔫", name: "Пистолет", hint: "Стреляй в объекты" },
    { id: "sword", icon: "⚔", name: "Меч", hint: "Руби ближних" },
    { id: "bomb", icon: "💣", name: "Бомба", hint: "Клик — заложить бомбу" },
    { id: "fire", icon: "🔥", name: "Огонь", hint: "Поджигай объекты" },
    { id: "heal", icon: "💚", name: "Лечение", hint: "Восстанови HP дыни" },
    { id: "pin", icon: "📌", name: "Пин", hint: "Закрепи объект на месте" },
    { id: "delete", icon: "🗑", name: "Удалить", hint: "Убери объект" },
    { id: "clear", icon: "🧹", name: "Очистить", hint: "Пустая арена — всё убрать" },
  ];

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="top-bar">
      <div class="brand">Melon Playground</div>
      <div class="stats">
        <button class="stat skin-btn" id="skin-btn" type="button">🍉 Скин</button>
        <div class="stat" id="stat-melons">Дыни: 0</div>
        <div class="stat" id="stat-pears">Груши: 0</div>
        <div class="stat" id="stat-juice">Сок: 0</div>
        <div class="stat" id="stat-tool">Инструмент: Захват</div>
      </div>
    </div>
    <div class="stage-wrap">
      <canvas id="stage"></canvas>
      <div class="hint" id="hint">Выбери инструмент внизу и устраивай хаос</div>
      <div class="overlay" id="intro">
        <div class="panel">
          <h1>Melon Playground</h1>
          <p>Пустая арена: сам ставь <b>дыню</b>, <b>бассейн</b>, <b>склон</b> и <b>игрушки</b>. Ничего не появляется само.</p>
          <div class="actions">
            <button class="btn primary" id="start-btn">Войти в игру</button>
            <button class="btn ghost" id="help-btn">Как играть</button>
            <button class="btn ghost" id="intro-skins">Скины</button>
          </div>
          <p class="enter-hint">Или подожди секунду — вход автоматический</p>
        </div>
      </div>
      <div class="overlay hidden" id="skin-modal">
        <div class="panel skin-panel">
          <h1>Скины дыни</h1>
          <p>Выбери внешний вид новых дынь. Выбор сохраняется.</p>
          <div class="skin-grid" id="skin-grid"></div>
          <div class="actions">
            <button class="btn primary" id="skin-close">Готово</button>
          </div>
        </div>
      </div>
    </div>
    <div class="toolbar" id="toolbar"></div>
  `;

  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const toolbar = document.getElementById("toolbar");
  const hintEl = document.getElementById("hint");
  const intro = document.getElementById("intro");
  const statMelons = document.getElementById("stat-melons");
  const statPears = document.getElementById("stat-pears");
  const statJuice = document.getElementById("stat-juice");
  const statTool = document.getElementById("stat-tool");
  const skinBtn = document.getElementById("skin-btn");
  const skinModal = document.getElementById("skin-modal");
  const skinGrid = document.getElementById("skin-grid");

  function refreshSkinBtn() {
    const s = currentSkin();
    skinBtn.textContent = `${s.icon} ${s.name}`;
  }

  function renderSkinGrid() {
    skinGrid.innerHTML = SKINS.map(
      (s) => `
      <button type="button" class="skin-card${s.id === currentSkinId ? " active" : ""}" data-skin="${s.id}" style="--s1:${s.light};--s2:${s.mid};--s3:${s.dark}">
        <span class="skin-preview" aria-hidden="true"></span>
        <span class="skin-icon">${s.icon}</span>
        <span class="skin-name">${s.name}</span>
      </button>`
    ).join("");
  }

  function openSkins() {
    renderSkinGrid();
    skinModal.classList.remove("hidden");
  }

  function closeSkins() {
    skinModal.classList.add("hidden");
  }

  function setSkin(id) {
    if (!SKINS.some((s) => s.id === id)) return;
    currentSkinId = id;
    store.set(SKIN_KEY, id);
    refreshSkinBtn();
    renderSkinGrid();
    // recolor living melons that use default/current-era skins: apply to all melons
    for (const meta of entityMeta.values()) {
      if (meta.kind === "melon") meta.skinId = id;
    }
    hintEl.textContent = "Скин: " + currentSkin().name;
  }

  TOOLS.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "tool" + (t.id === "grab" ? " active" : "");
    btn.dataset.tool = t.id;
    btn.innerHTML = `<span class="icon">${t.icon}</span>${t.name}`;
    toolbar.appendChild(btn);
  });

  let tool = "grab";
  let juiceSpilled = 0;
  let started = false;
  const particles = [];
  const flames = [];
  const bullets = [];
  const thrownWeapons = [];
  const entityMeta = new Map();
  let nextId = 1;
  let swordCooldown = 0;
  let fireCooldown = 0;
  let shootCooldown = 0;
  let throwAim = null;
  let pearPool = { x: 0, y: 0, w: 220, h: 110 };
  let poolRipple = 0;
  let poolBuilt = false;
  let skiSlope = { x: 0, y: 0, w: 280, h: 200 };
  let skiRampBodies = [];
  let skiBuilt = false;
  const snowflakes = [];

  const engine = Engine.create({ gravity: { x: 0, y: 1.05 } });
  const world = engine.world;

  let W = 800;
  let H = 600;
  let walls = [];
  let mouseConstraint = null;
  let pointer = { x: 0, y: 0, down: false };

  function resize() {
    const wrap = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth;
    H = wrap.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildWalls();
    if (poolBuilt) refreshPoolSize();
    if (skiBuilt) rebuildSkiRamp();
  }

  function refreshPoolSize() {
    pearPool.w = Math.min(260, Math.max(180, W * 0.28));
    pearPool.h = Math.min(130, Math.max(90, H * 0.18));
    // keep center roughly in place when resizing
    pearPool.x = Math.max(12, Math.min(pearPool.x, W - pearPool.w - 12));
    pearPool.y = Math.max(12, Math.min(pearPool.y, H - pearPool.h - 12));
  }

  function placePool(x, y) {
    pearPool.w = Math.min(260, Math.max(180, W * 0.28));
    pearPool.h = Math.min(130, Math.max(90, H * 0.18));
    pearPool.x = Math.max(12, Math.min(x - pearPool.w / 2, W - pearPool.w - 12));
    pearPool.y = Math.max(12, Math.min(y - pearPool.h / 2, H - pearPool.h - 12));
    poolBuilt = true;
    poolRipple = 12;
    hintEl.textContent = "Бассейн поставлен! Добавь груши и игрушки.";
  }

  function removeSkiRamp() {
    skiRampBodies.forEach((b) => Composite.remove(world, b));
    skiRampBodies = [];
  }

  function rebuildSkiRamp() {
    removeSkiRamp();
    if (!skiBuilt) return;
    const cx = skiSlope.x + skiSlope.w * 0.52;
    const cy = skiSlope.y + skiSlope.h * 0.55;
    const ramp = Bodies.rectangle(cx, cy, skiSlope.w * 1.15, 22, {
      isStatic: true,
      angle: 0.42,
      friction: 0.02,
      frictionStatic: 0.01,
      restitution: 0.05,
      label: "ski-ramp",
      chamfer: { radius: 4 },
    });
    const ledge = Bodies.rectangle(
      skiSlope.x + skiSlope.w * 0.78,
      skiSlope.y + 18,
      90,
      14,
      {
        isStatic: true,
        friction: 0.05,
        label: "ski-ledge",
        chamfer: { radius: 3 },
      }
    );
    skiRampBodies = [ramp, ledge];
    Composite.add(world, skiRampBodies);
  }

  function placeSkiSlope(x, y) {
    skiSlope.w = Math.min(320, Math.max(220, W * 0.34));
    skiSlope.h = Math.min(240, Math.max(160, H * 0.38));
    skiSlope.x = Math.max(12, Math.min(x - skiSlope.w / 2, W - skiSlope.w - 12));
    skiSlope.y = Math.max(12, Math.min(y - skiSlope.h / 2, H - skiSlope.h - 12));
    skiBuilt = true;
    rebuildSkiRamp();
    hintEl.textContent = "Склон готов! Инструмент «Лыжи» — спусти дыню.";
  }

  function inSkiSlope(x, y) {
    if (!skiBuilt) return false;
    return (
      x >= skiSlope.x &&
      x <= skiSlope.x + skiSlope.w &&
      y >= skiSlope.y &&
      y <= skiSlope.y + skiSlope.h
    );
  }

  function inPearPool(x, y) {
    if (!poolBuilt) return false;
    return (
      x >= pearPool.x &&
      x <= pearPool.x + pearPool.w &&
      y >= pearPool.y &&
      y <= pearPool.y + pearPool.h
    );
  }

  function rebuildWalls() {
    walls.forEach((w) => Composite.remove(world, w));
    const t = 80;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W + 400, t, { isStatic: true, label: "wall", friction: 0.9 }),
      Bodies.rectangle(W / 2, -t / 2, W + 400, t, { isStatic: true, label: "wall" }),
      Bodies.rectangle(-t / 2, H / 2, t, H + 400, { isStatic: true, label: "wall" }),
      Bodies.rectangle(W + t / 2, H / 2, t, H + 400, { isStatic: true, label: "wall" }),
    ];
    Composite.add(world, walls);
  }

  function setTool(id) {
    if (id === "clear") {
      clearArena();
      return;
    }
    tool = id;
    document.querySelectorAll(".tool").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === id);
    });
    const meta = TOOLS.find((t) => t.id === id);
    statTool.textContent = "Инструмент: " + (meta ? meta.name : id);
    hintEl.textContent = meta ? meta.hint : "";
    if (mouseConstraint) {
      mouseConstraint.constraint.stiffness = id === "grab" ? 0.2 : 0;
      mouseConstraint.collisionFilter.mask = id === "grab" ? 0xffffffff : 0;
    }
  }

  function spawnJuice(x, y, count = 10, speed = 4) {
    juiceSpilled += count;
    const juice = currentSkin().juice;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random());
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 1,
        life: 40 + Math.random() * 30,
        r: 2 + Math.random() * 4,
        color: Math.random() > 0.3 ? juice : "#ff6b7a",
      });
    }
    updateStats();
  }

  function updateStats() {
    const melons = [...entityMeta.values()].filter((m) => m.kind === "melon" && m.hp > 0).length;
    const pears = [...entityMeta.values()].filter((m) => m.kind === "pear" && m.hp > 0).length;
    statMelons.textContent = "Дыни: " + melons;
    statPears.textContent = "Груши: " + pears;
    statJuice.textContent = "Сок: " + juiceSpilled;
  }

  function makeMelon(x, y) {
    const head = Bodies.circle(x, y - 18, 16, {
      restitution: 0.35,
      friction: 0.5,
      density: 0.002,
      label: "melon-head",
    });
    const torso = Bodies.circle(x, y + 10, 20, {
      restitution: 0.25,
      friction: 0.6,
      density: 0.003,
      label: "melon-body",
    });
    const leftArm = Bodies.circle(x - 26, y + 4, 8, { density: 0.001, restitution: 0.2, label: "melon-limb" });
    const rightArm = Bodies.circle(x + 26, y + 4, 8, { density: 0.001, restitution: 0.2, label: "melon-limb" });
    const leftLeg = Bodies.circle(x - 12, y + 38, 9, { density: 0.0015, restitution: 0.2, label: "melon-limb" });
    const rightLeg = Bodies.circle(x + 12, y + 38, 9, { density: 0.0015, restitution: 0.2, label: "melon-limb" });

    const parts = [head, torso, leftArm, rightArm, leftLeg, rightLeg];
    const constraints = [
      Constraint.create({ bodyA: head, bodyB: torso, length: 28, stiffness: 0.7, damping: 0.1 }),
      Constraint.create({ bodyA: torso, bodyB: leftArm, length: 24, stiffness: 0.5, damping: 0.05 }),
      Constraint.create({ bodyA: torso, bodyB: rightArm, length: 24, stiffness: 0.5, damping: 0.05 }),
      Constraint.create({ bodyA: torso, bodyB: leftLeg, length: 28, stiffness: 0.55, damping: 0.08 }),
      Constraint.create({ bodyA: torso, bodyB: rightLeg, length: 28, stiffness: 0.55, damping: 0.08 }),
    ];

    const id = nextId++;
    const face = Math.floor(Math.random() * 4);
    parts.forEach((p) => {
      p.plugin = { entityId: id };
      Composite.add(world, p);
    });
    constraints.forEach((c) => Composite.add(world, c));

    entityMeta.set(id, {
      kind: "melon",
      parts,
      constraints,
      hp: 100,
      maxHp: 100,
      face,
      onFire: 0,
      pinned: [],
      skiing: false,
      skiBoost: 0,
      skinId: currentSkinId,
    });
    updateStats();
    return id;
  }

  function equipSkis(id) {
    const meta = entityMeta.get(id);
    if (!meta || meta.kind !== "melon") return false;
    meta.skiing = true;
    meta.skiBoost = 180;
    meta.parts.forEach((p) => {
      p.friction = 0.03;
      p.frictionAir = 0.01;
    });
    // kick downslope
    const torso = meta.parts[1] || meta.parts[0];
    Body.applyForce(torso, torso.position, { x: 0.05, y: 0.02 });
    hintEl.textContent = "Лыжи надеты — катись со склона!";
    spawnSnow(torso.position.x, torso.position.y, 12);
    return true;
  }

  function spawnSkier(x, y) {
    const sx = x || skiSlope.x + skiSlope.w * 0.78;
    const sy = y || skiSlope.y + 8;
    const id = makeMelon(sx, sy);
    equipSkis(id);
    return id;
  }

  function spawnSnow(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      snowflakes.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        life: 25 + Math.random() * 20,
        r: 1.5 + Math.random() * 2.5,
      });
    }
  }

  function makePear(x, y) {
    let px = x;
    let py = y;
    if (poolBuilt && !inPearPool(x, y)) {
      px = pearPool.x + pearPool.w * (0.2 + Math.random() * 0.6);
      py = pearPool.y + pearPool.h * (0.25 + Math.random() * 0.5);
    }
    const body = Bodies.circle(px, py, 14, {
      restitution: 0.45,
      friction: 0.15,
      frictionAir: 0.04,
      density: 0.0012,
      label: "pear",
    });
    const id = nextId++;
    body.plugin = { entityId: id };
    Composite.add(world, body);
    entityMeta.set(id, {
      kind: "pear",
      parts: [body],
      hp: 45,
      maxHp: 45,
      onFire: 0,
      pinned: [],
      bob: Math.random() * Math.PI * 2,
    });
    updateStats();
    return id;
  }

  const TOY_TYPES = [
    { id: "duck", icon: "🦆", color: "#f4d03f", r: 13 },
    { id: "ball", icon: "⚽", color: "#e74c3c", r: 11 },
    { id: "boat", icon: "⛵", color: "#5dade2", r: 14 },
    { id: "bear", icon: "🧸", color: "#c9956a", r: 12 },
  ];

  function makeToy(x, y) {
    const type = TOY_TYPES[Math.floor(Math.random() * TOY_TYPES.length)];
    let px = x;
    let py = y;
    if (poolBuilt && !inPearPool(x, y)) {
      px = pearPool.x + pearPool.w * (0.25 + Math.random() * 0.5);
      py = pearPool.y + pearPool.h * (0.3 + Math.random() * 0.4);
      hintEl.textContent = "Игрушка в бассейне: " + type.icon;
    } else {
      hintEl.textContent = "Игрушка: " + type.icon;
    }
    const body = Bodies.circle(px, py, type.r, {
      restitution: 0.55,
      friction: 0.2,
      frictionAir: 0.03,
      density: 0.001,
      label: "toy",
    });
    const id = nextId++;
    body.plugin = { entityId: id };
    Composite.add(world, body);
    entityMeta.set(id, {
      kind: "toy",
      toyType: type.id,
      icon: type.icon,
      color: type.color,
      parts: [body],
      hp: 30,
      maxHp: 30,
      onFire: 0,
      pinned: [],
      bob: Math.random() * Math.PI * 2,
    });
    return id;
  }

  function makeBox(x, y) {
    const body = Bodies.rectangle(x, y, 44, 44, {
      restitution: 0.15,
      friction: 0.8,
      density: 0.004,
      label: "box",
      chamfer: { radius: 4 },
    });
    const id = nextId++;
    body.plugin = { entityId: id };
    Composite.add(world, body);
    entityMeta.set(id, { kind: "box", parts: [body], hp: 60, maxHp: 60, onFire: 0, pinned: [] });
    return id;
  }

  function makeBarrel(x, y) {
    const body = Bodies.circle(x, y, 22, {
      restitution: 0.2,
      friction: 0.7,
      density: 0.005,
      label: "barrel",
    });
    const id = nextId++;
    body.plugin = { entityId: id };
    Composite.add(world, body);
    entityMeta.set(id, { kind: "barrel", parts: [body], hp: 40, maxHp: 40, onFire: 0, pinned: [], armed: true });
    return id;
  }

  function makePlatform(x, y) {
    const body = Bodies.rectangle(x, y, 120, 18, {
      isStatic: true,
      friction: 0.95,
      label: "platform",
      chamfer: { radius: 3 },
    });
    const id = nextId++;
    body.plugin = { entityId: id };
    Composite.add(world, body);
    entityMeta.set(id, { kind: "platform", parts: [body], hp: 999, maxHp: 999, onFire: 0, pinned: [] });
    return id;
  }

  function makeBomb(x, y) {
    const body = Bodies.circle(x, y, 14, {
      restitution: 0.3,
      friction: 0.5,
      density: 0.003,
      label: "bomb",
    });
    const id = nextId++;
    body.plugin = { entityId: id };
    Composite.add(world, body);
    entityMeta.set(id, {
      kind: "bomb",
      parts: [body],
      hp: 20,
      maxHp: 20,
      onFire: 0,
      pinned: [],
      fuse: 90,
    });
    return id;
  }

  function removeEntity(id) {
    const meta = entityMeta.get(id);
    if (!meta) return;
    meta.pinned.forEach((c) => Composite.remove(world, c));
    (meta.constraints || []).forEach((c) => Composite.remove(world, c));
    meta.parts.forEach((p) => Composite.remove(world, p));
    entityMeta.delete(id);
    updateStats();
  }

  function clearArena() {
    [...entityMeta.keys()].forEach(removeEntity);
    particles.length = 0;
    flames.length = 0;
    bullets.length = 0;
    thrownWeapons.length = 0;
    snowflakes.length = 0;
    juiceSpilled = 0;
    poolBuilt = false;
    skiBuilt = false;
    removeSkiRamp();
    updateStats();
    hintEl.textContent = "Пустая арена — ставь дыню, бассейн, склон и игрушки сам";
  }

  function damageEntity(id, amount, point) {
    const meta = entityMeta.get(id);
    if (!meta || meta.kind === "platform") return;
    if (amalGod() && meta.kind === "melon") return;
    const dmg = amalGod() ? amount * 8 : amount;
    meta.hp -= dmg;
    if (point) {
      const juiceColor = meta.kind === "pear";
      if (juiceColor) {
        for (let i = 0; i < Math.ceil(dmg / 3); i++) {
          const a = Math.random() * Math.PI * 2;
          particles.push({
            x: point.x,
            y: point.y,
            vx: Math.cos(a) * 3,
            vy: Math.sin(a) * 3 - 1,
            life: 35,
            r: 2 + Math.random() * 3,
            color: Math.random() > 0.4 ? "#f4d03f" : "#58d68d",
          });
        }
        juiceSpilled += Math.ceil(dmg / 4);
        updateStats();
      } else {
        spawnJuice(point.x, point.y, Math.ceil(dmg / 4), 3 + dmg / 8);
      }
    }
    if (meta.kind === "barrel" && meta.hp <= 0) {
      const p = meta.parts[0].position;
      explode(p.x, p.y, 18);
      removeEntity(id);
      return;
    }
    if (meta.hp <= 0) {
      const p = meta.parts[0].position;
      if (meta.kind === "pear") {
        poolRipple = 18;
        for (let i = 0; i < 16; i++) {
          const a = Math.random() * Math.PI * 2;
          particles.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * 4,
            vy: Math.sin(a) * 4 - 2,
            life: 40,
            r: 3,
            color: "#f7dc6f",
          });
        }
        juiceSpilled += 12;
        updateStats();
      } else {
        spawnJuice(p.x, p.y, meta.kind === "melon" ? 28 : 12, 6);
      }
      removeEntity(id);
    }
  }

  function explode(x, y, power = 16) {
    spawnJuice(x, y, 35, 8);
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      flames.push({
        x: x + Math.cos(a) * 10,
        y: y + Math.sin(a) * 10,
        vx: Math.cos(a) * 3,
        vy: Math.sin(a) * 3,
        life: 25 + Math.random() * 20,
        r: 8 + Math.random() * 10,
      });
    }
    for (const [id, meta] of entityMeta) {
      for (const part of meta.parts) {
        const dx = part.position.x - x;
        const dy = part.position.y - y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < power * 18) {
          const force = ((power * 18 - dist) / (power * 18)) * 0.08 * power;
          Body.applyForce(part, part.position, {
            x: (dx / dist) * force,
            y: (dy / dist) * force,
          });
          damageEntity(id, power * (1 - dist / (power * 18)) * 2.5, part.position);
          if (meta.kind === "melon" || meta.kind === "box" || meta.kind === "barrel") {
            meta.onFire = Math.max(meta.onFire, 60);
          }
        }
      }
    }
  }

  function bodyAt(x, y) {
    const bodies = Composite.allBodies(world).filter((b) => b.label !== "wall");
    return Query.point(bodies, { x, y })[0] || null;
  }

  function entityIdOf(body) {
    return body && body.plugin ? body.plugin.entityId : null;
  }

  function pinBody(body) {
    const id = entityIdOf(body);
    if (!id) return;
    const meta = entityMeta.get(id);
    if (!meta || meta.kind === "platform") return;
    const c = Constraint.create({
      pointA: { x: body.position.x, y: body.position.y },
      bodyB: body,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0,
    });
    Composite.add(world, c);
    meta.pinned.push(c);
    hintEl.textContent = "Объект закреплён";
  }

  function healAt(x, y) {
    const body = bodyAt(x, y);
    const id = entityIdOf(body);
    if (!id) return;
    const meta = entityMeta.get(id);
    if (!meta || meta.kind !== "melon") return;
    meta.hp = meta.maxHp;
    meta.onFire = 0;
    spawnJuice(x, y, 6, 2);
    hintEl.textContent = "Дыня вылечена";
  }

  function shoot(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    bullets.push({
      x: fromX,
      y: fromY,
      vx: (dx / len) * 18,
      vy: (dy / len) * 18,
      life: 45,
    });
  }

  function swordSlash(x, y) {
    for (const [id, meta] of entityMeta) {
      for (const part of meta.parts) {
        if (Math.hypot(part.position.x - x, part.position.y - y) < 55) {
          Body.applyForce(part, part.position, {
            x: (part.position.x - x) * 0.0015,
            y: -0.04,
          });
          damageEntity(id, 22, part.position);
          break;
        }
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * 5,
        vy: Math.sin(a) * 5,
        life: 18,
        r: 3,
        color: "#dfe6e9",
      });
    }
  }

  function igniteAt(x, y) {
    flames.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 2,
      life: 30,
      r: 10 + Math.random() * 8,
    });
    const body = bodyAt(x, y);
    const id = entityIdOf(body);
    if (!id) return;
    const meta = entityMeta.get(id);
    if (!meta) return;
    meta.onFire = Math.max(meta.onFire, 120);
    damageEntity(id, 4, { x, y });
  }

  function tryThrowWeapon(fromX, fromY, toX, toY) {
    if (!poolBuilt) {
      hintEl.textContent = "Сначала поставь бассейн инструментом «Бассейн»!";
      return false;
    }
    if (!inPearPool(toX, toY)) {
      hintEl.textContent = "Оружие можно кидать только в бассейн с грушами!";
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: toX,
          y: toY,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 20,
          r: 2,
          color: "#e74c3c",
        });
      }
      return false;
    }
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const speed = Math.min(22, 8 + len * 0.045);
    thrownWeapons.push({
      x: fromX,
      y: fromY,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      angle: Math.atan2(dy, dx),
      life: 90,
      stuck: false,
      tx: toX,
      ty: toY,
    });
    hintEl.textContent = "Оружие летит в бассейн с грушами!";
    return true;
  }

  function onPointerDown(e) {
    if (!started) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    pointer = { x, y, down: true };

    if (tool === "throw") {
      throwAim = { x0: x, y0: y, x1: x, y1: y };
      return;
    }

    if (tool === "ski") {
      const b = bodyAt(x, y);
      const id = entityIdOf(b);
      if (id && entityMeta.get(id)?.kind === "melon") {
        if (!skiBuilt) {
          hintEl.textContent = "Сначала поставь склон («Склон»), потом надень лыжи";
        }
        equipSkis(id);
      } else if (!skiBuilt) {
        placeSkiSlope(x, y);
      } else {
        const sx = inSkiSlope(x, y) ? Math.min(x, skiSlope.x + skiSlope.w * 0.85) : skiSlope.x + skiSlope.w * 0.78;
        const sy = inSkiSlope(x, y) ? Math.min(y, skiSlope.y + 40) : skiSlope.y + 8;
        spawnSkier(sx, sy);
      }
      return;
    }

    if (tool === "melon") makeMelon(x, y);
    else if (tool === "pool") placePool(x, y);
    else if (tool === "slope") placeSkiSlope(x, y);
    else if (tool === "toy") makeToy(x, y);
    else if (tool === "pear") makePear(x, y);
    else if (tool === "box") makeBox(x, y);
    else if (tool === "barrel") makeBarrel(x, y);
    else if (tool === "platform") makePlatform(x, y);
    else if (tool === "bomb") makeBomb(x, y);
    else if (tool === "pistol") {
      shoot(x, y - 8, x + 1, y - 8);
      shootCooldown = 8;
    } else if (tool === "sword") {
      swordSlash(x, y);
      swordCooldown = 12;
    } else if (tool === "fire") {
      igniteAt(x, y);
      fireCooldown = 4;
    } else if (tool === "heal") healAt(x, y);
    else if (tool === "pin") {
      const b = bodyAt(x, y);
      if (b) pinBody(b);
    } else if (tool === "delete") {
      const b = bodyAt(x, y);
      const id = entityIdOf(b);
      if (id) {
        const p = b.position;
        spawnJuice(p.x, p.y, 8, 3);
        removeEntity(id);
      }
    }
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    pointer.x = x;
    pointer.y = y;
    if (tool === "throw" && throwAim) {
      throwAim.x1 = x;
      throwAim.y1 = y;
      return;
    }
    if (!pointer.down || !started) return;
    if (tool === "fire" && fireCooldown <= 0) {
      igniteAt(x, y);
      fireCooldown = 3;
    } else if (tool === "sword" && swordCooldown <= 0) {
      swordSlash(x, y);
      swordCooldown = 10;
    } else if (tool === "pistol" && shootCooldown <= 0) {
      shoot(x, y, x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40);
      shootCooldown = 7;
    }
  }

  function onPointerUp() {
    if (tool === "throw" && throwAim && started) {
      tryThrowWeapon(throwAim.x0, throwAim.y0, throwAim.x1, throwAim.y1);
      throwAim = null;
    }
    pointer.down = false;
  }

  function setupMouse() {
    const mouse = Mouse.create(canvas);
    mouse.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    Composite.add(world, mouseConstraint);
    Events.on(mouseConstraint, "startdrag", () => {
      if (tool !== "grab") mouseConstraint.constraint.bodyB = null;
    });
  }

  function drawMelonPart(part, meta, isHead) {
    const { x, y } = part.position;
    const r = part.circleRadius;
    const skin = SKINS.find((s) => s.id === meta.skinId) || currentSkin();
    const hurt = meta.hp < 30;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(part.angle);

    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, hurt ? skin.hurtLight : skin.light);
    g.addColorStop(0.55, hurt ? skin.hurtMid : skin.mid);
    g.addColorStop(1, skin.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = skin.stripe;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.35, -r * 0.85);
      ctx.quadraticCurveTo(i * r * 0.45, 0, i * r * 0.2, r * 0.85);
      ctx.stroke();
    }

    // ski goggles for ski skin
    if (isHead && skin.id === "ski") {
      ctx.fillStyle = "rgba(40, 80, 120, 0.55)";
      ctx.fillRect(-10, -6, 20, 7);
      ctx.strokeStyle = "#2c3e50";
      ctx.strokeRect(-10, -6, 20, 7);
    }

    if (isHead) {
      ctx.fillStyle = "#111";
      const eyeY = -2;
      if (meta.face === 0) {
        ctx.beginPath();
        ctx.arc(-5, eyeY, 2.2, 0, Math.PI * 2);
        ctx.arc(5, eyeY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 5, 4, 0, Math.PI);
        ctx.stroke();
      } else if (meta.face === 1) {
        ctx.fillRect(-7, eyeY - 1, 4, 2);
        ctx.fillRect(3, eyeY - 1, 4, 2);
        ctx.beginPath();
        ctx.moveTo(-4, 6);
        ctx.lineTo(4, 6);
        ctx.stroke();
      } else if (meta.face === 2) {
        ctx.beginPath();
        ctx.arc(-5, eyeY, 2.5, 0, Math.PI * 2);
        ctx.arc(5, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 7, 4, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(-5, eyeY, 2.8, 0, Math.PI * 2);
        ctx.arc(5, eyeY, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-4, eyeY - 1, 1, 0, Math.PI * 2);
        ctx.arc(6, eyeY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#111";
        ctx.beginPath();
        ctx.ellipse(0, 6, 3, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (meta.hp < meta.maxHp) {
        const ratio = Math.max(0, meta.hp / meta.maxHp);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(-12, -r - 10, 24, 4);
        ctx.fillStyle = ratio > 0.4 ? skin.mid : "#ff6b7a";
        ctx.fillRect(-12, -r - 10, 24 * ratio, 4);
      }
    }

    if (meta.onFire > 0) {
      ctx.fillStyle = `rgba(255, ${120 + Math.random() * 80}, 40, 0.7)`;
      ctx.beginPath();
      ctx.arc((Math.random() - 0.5) * r, -r * 0.6, 4 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawSkisUnderMelon(meta) {
    if (!meta.skiing) return;
    const leftLeg = meta.parts[4];
    const rightLeg = meta.parts[5];
    const torso = meta.parts[1];
    if (!leftLeg || !rightLeg || !torso) return;
    const angle = torso.angle * 0.35 + 0.38;
    [[leftLeg, -2], [rightLeg, 2]].forEach(([leg, side]) => {
      ctx.save();
      ctx.translate(leg.position.x, leg.position.y + 7);
      ctx.rotate(angle);
      ctx.fillStyle = "#ecf0f1";
      ctx.strokeStyle = "#636e72";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-24, side - 2);
      ctx.lineTo(20, side - 2);
      ctx.lineTo(28, side);
      ctx.lineTo(20, side + 2);
      ctx.lineTo(-24, side + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e17055";
      ctx.fillRect(-6, side - 3, 5, 6);
      ctx.restore();
    });
  }

  function drawSkiSlope() {
    if (!skiBuilt) return;
    const { x, y, w, h } = skiSlope;
    ctx.save();
    // snow bank background
    const snow = ctx.createLinearGradient(x, y, x + w, y + h);
    snow.addColorStop(0, "rgba(236, 240, 255, 0.55)");
    snow.addColorStop(0.5, "rgba(200, 220, 245, 0.4)");
    snow.addColorStop(1, "rgba(174, 198, 230, 0.35)");
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h);
    ctx.lineTo(x + w * 0.55, y + 8);
    ctx.lineTo(x + w, y + 8);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // trail lines
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const t = 0.25 + i * 0.15;
      ctx.beginPath();
      ctx.moveTo(x + w * (0.5 + t * 0.3), y + 20);
      ctx.lineTo(x + w * (0.2 + t * 0.2), y + h - 10);
      ctx.stroke();
    }

    // icy ramp visual
    ctx.save();
    ctx.translate(x + w * 0.52, y + h * 0.55);
    ctx.rotate(0.42);
    ctx.fillStyle = "rgba(180, 220, 255, 0.75)";
    ctx.strokeStyle = "rgba(120, 170, 210, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-w * 0.55, -11, w * 1.1, 22);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(230, 245, 255, 0.95)";
    ctx.font = "800 12px Nunito";
    ctx.textAlign = "center";
    ctx.fillText("Лыжный склон", x + w * 0.7, y - 8);

    if (tool === "ski") {
      ctx.strokeStyle = "rgba(116, 185, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawBox(body, meta) {
    const { x, y } = body.position;
    const verts = body.vertices;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
    ctx.closePath();
    ctx.fillStyle = meta.onFire > 0 ? "#c0392b" : "#c4a574";
    ctx.fill();
    ctx.strokeStyle = "#6d4c2f";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawBarrel(body, meta) {
    const { x, y } = body.position;
    const r = body.circleRadius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);
    ctx.fillStyle = meta.onFire > 0 ? "#e74c3c" : "#d35400";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 14px Nunito";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", 0, 1);
    ctx.restore();
  }

  function drawPlatform(body) {
    const verts = body.vertices;
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
    ctx.closePath();
    ctx.fillStyle = "#4a6741";
    ctx.fill();
    ctx.strokeStyle = "#2d3f28";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawBomb(body, meta) {
    const { x, y } = body.position;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(0, 0, body.circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = meta.fuse < 30 ? "#e74c3c" : "#f39c12";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -body.circleRadius);
    ctx.quadraticCurveTo(8, -body.circleRadius - 10, 4, -body.circleRadius - 16);
    ctx.stroke();
    if (meta.fuse % 10 < 5) {
      ctx.fillStyle = "#ff7675";
      ctx.beginPath();
      ctx.arc(4, -body.circleRadius - 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPear(body, meta) {
    const { x, y } = body.position;
    const r = body.circleRadius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.2, 2, 0, 0, r * 1.2);
    g.addColorStop(0, meta.hp < 15 ? "#b7950b" : "#f7dc6f");
    g.addColorStop(0.6, "#58d68d");
    g.addColorStop(1, "#1e8449");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 2, r * 0.85, r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6e2c00";
    ctx.fillRect(-1.5, -r - 2, 3, 6);
    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    ctx.ellipse(5, -r, 5, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-4, 0, 1.8, 0, Math.PI * 2);
    ctx.arc(4, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (meta.hp < meta.maxHp) {
      const ratio = Math.max(0, meta.hp / meta.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(-10, -r - 12, 20, 3);
      ctx.fillStyle = "#f4d03f";
      ctx.fillRect(-10, -r - 12, 20 * ratio, 3);
    }
    ctx.restore();
  }

  function drawToy(body, meta) {
    const { x, y } = body.position;
    const r = body.circleRadius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);
    ctx.fillStyle = meta.color || "#f4d03f";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `${Math.floor(r * 1.2)}px Nunito`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta.icon || "🧸", 0, 1);
    ctx.restore();
  }

  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawPearPool() {
    if (!poolBuilt) return;
    const { x, y, w, h } = pearPool;
    ctx.save();
    // basin rim
    ctx.fillStyle = "#5d4037";
    roundRectPath(x - 8, y - 8, w + 16, h + 16, 18);
    ctx.fill();
    // water
    const water = ctx.createLinearGradient(x, y, x, y + h);
    water.addColorStop(0, "rgba(100, 200, 220, 0.55)");
    water.addColorStop(0.5, "rgba(52, 152, 219, 0.65)");
    water.addColorStop(1, "rgba(30, 100, 160, 0.8)");
    ctx.fillStyle = water;
    roundRectPath(x, y, w, h, 14);
    ctx.fill();
    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.35, y + h * 0.28, w * 0.28, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    if (poolRipple > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${poolRipple / 30})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, 20 + (18 - poolRipple) * 2, 10 + (18 - poolRipple), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 248, 220, 0.9)";
    ctx.font = "800 12px Nunito";
    ctx.textAlign = "center";
    ctx.fillText("Бассейн с грушами", x + w / 2, y - 14);
    // aim zone outline when throw tool active
    if (tool === "throw") {
      ctx.strokeStyle = "rgba(241, 196, 15, 0.85)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawThrownWeapon(wpn) {
    ctx.save();
    ctx.translate(wpn.x, wpn.y);
    ctx.rotate(wpn.angle);
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(-18, -2.5, 28, 5);
    ctx.fillStyle = "#7f8c8d";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(22, -5);
    ctx.lineTo(22, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6e2c00";
    ctx.fillRect(-22, -3, 6, 6);
    ctx.restore();
  }

  function drawPins(meta) {
    meta.pinned.forEach((c) => {
      ctx.fillStyle = "#fd79a8";
      ctx.beginPath();
      ctx.arc(c.pointA.x, c.pointA.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(120, 200, 140, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // floor tint
    ctx.fillStyle = "rgba(30, 60, 40, 0.35)";
    ctx.fillRect(0, H - 8, W, 8);

    drawPearPool();
    drawSkiSlope();

    for (const [id, meta] of entityMeta) {
      if (meta.kind === "melon") {
        drawSkisUnderMelon(meta);
        meta.parts.forEach((p, i) => drawMelonPart(p, meta, i === 0));
        // joints
        ctx.strokeStyle = "rgba(20,80,40,0.35)";
        ctx.lineWidth = 3;
        (meta.constraints || []).forEach((c) => {
          if (!c.bodyA || !c.bodyB) return;
          ctx.beginPath();
          ctx.moveTo(c.bodyA.position.x, c.bodyA.position.y);
          ctx.lineTo(c.bodyB.position.x, c.bodyB.position.y);
          ctx.stroke();
        });
      } else if (meta.kind === "pear") drawPear(meta.parts[0], meta);
      else if (meta.kind === "toy") drawToy(meta.parts[0], meta);
      else if (meta.kind === "box") drawBox(meta.parts[0], meta);
      else if (meta.kind === "barrel") drawBarrel(meta.parts[0], meta);
      else if (meta.kind === "platform") drawPlatform(meta.parts[0]);
      else if (meta.kind === "bomb") drawBomb(meta.parts[0], meta);
      drawPins(meta);
    }

    thrownWeapons.forEach(drawThrownWeapon);

    // bullets
    ctx.fillStyle = "#ffeaa7";
    bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // particles
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 50);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    flames.forEach((f) => {
      ctx.globalAlpha = Math.max(0, f.life / 40);
      const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grd.addColorStop(0, "#fff3a0");
      grd.addColorStop(0.4, "#ff9f43");
      grd.addColorStop(1, "rgba(231,76,60,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    snowflakes.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.life / 40);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (tool === "throw" && throwAim) {
      const ok = inPearPool(throwAim.x1, throwAim.y1);
      ctx.strokeStyle = ok ? "rgba(46, 204, 113, 0.9)" : "rgba(231, 76, 60, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(throwAim.x0, throwAim.y0);
      ctx.lineTo(throwAim.x1, throwAim.y1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(throwAim.x1, throwAim.y1, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ok ? "rgba(46, 204, 113, 0.85)" : "rgba(231, 76, 60, 0.85)";
      ctx.font = "800 12px Nunito";
      ctx.textAlign = "center";
      ctx.fillText(ok ? "Можно!" : "Только в бассейн!", throwAim.x1, throwAim.y1 - 14);
    }

    if (tool === "sword" && pointer.down) {
      ctx.strokeStyle = "rgba(220,230,240,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 50, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function update() {
    if (!started) {
      render();
      requestAnimationFrame(update);
      return;
    }

    Engine.update(engine, 1000 / 60);
    if (swordCooldown > 0) swordCooldown--;
    if (fireCooldown > 0) fireCooldown--;
    if (shootCooldown > 0) shootCooldown--;
    if (poolRipple > 0) poolRipple--;

    // thrown weapons — only valid targets are in the pear pool
    for (let i = thrownWeapons.length - 1; i >= 0; i--) {
      const wpn = thrownWeapons[i];
      if (!wpn.stuck) {
        wpn.x += wpn.vx;
        wpn.y += wpn.vy;
        wpn.vy += 0.28;
        wpn.angle = Math.atan2(wpn.vy, wpn.vx);
        wpn.life--;

        const nearTarget = Math.hypot(wpn.x - wpn.tx, wpn.y - wpn.ty) < 16;
        const inPool = inPearPool(wpn.x, wpn.y);

        if (nearTarget || inPool) {
          // snap into pool if slightly off due to gravity
          if (!inPool) {
            wpn.x = wpn.tx;
            wpn.y = wpn.ty;
          }
          poolRipple = 16;
          // splash
          for (let s = 0; s < 10; s++) {
            particles.push({
              x: wpn.x,
              y: wpn.y,
              vx: (Math.random() - 0.5) * 4,
              vy: -2 - Math.random() * 3,
              life: 28,
              r: 2 + Math.random() * 3,
              color: "rgba(174, 214, 241, 0.9)",
            });
          }
          // damage pears in pool
          let hitPear = false;
          for (const [id, meta] of entityMeta) {
            if (meta.kind !== "pear") continue;
            const p = meta.parts[0].position;
            if (Math.hypot(p.x - wpn.x, p.y - wpn.y) < 28) {
              Body.applyForce(meta.parts[0], p, {
                x: wpn.vx * 0.0015,
                y: wpn.vy * 0.0015,
              });
              damageEntity(id, 28, p);
              hitPear = true;
            }
          }
          if (!hitPear) {
            // still counts as a valid throw into the pool
            juiceSpilled += 2;
            updateStats();
          }
          wpn.stuck = true;
          wpn.life = 35;
          wpn.vx = 0;
          wpn.vy = 0;
          continue;
        }

        // left the map without hitting pool — remove (shouldn't happen if aim was valid)
        if (wpn.life <= 0 || wpn.x < -40 || wpn.x > W + 40 || wpn.y > H + 40) {
          thrownWeapons.splice(i, 1);
        }
      } else {
        wpn.life--;
        if (wpn.life <= 0) thrownWeapons.splice(i, 1);
      }
    }

    // bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      const hit = bodyAt(b.x, b.y);
      if (hit && hit.label !== "wall") {
        const id = entityIdOf(hit);
        if (id) {
          Body.applyForce(hit, hit.position, { x: b.vx * 0.0012, y: b.vy * 0.0012 });
          damageEntity(id, 18, { x: b.x, y: b.y });
        }
        bullets.splice(i, 1);
        continue;
      }
      if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) bullets.splice(i, 1);
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = flames.length - 1; i >= 0; i--) {
      const f = flames[i];
      f.x += f.vx;
      f.y += f.vy;
      f.life--;
      f.r *= 0.98;
      if (f.life <= 0) flames.splice(i, 1);
    }

    for (let i = snowflakes.length - 1; i >= 0; i--) {
      const s = snowflakes[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.08;
      s.life--;
      if (s.life <= 0) snowflakes.splice(i, 1);
    }

    // ambient snow on slope
    if (skiBuilt && Math.random() < 0.25) {
      snowflakes.push({
        x: skiSlope.x + Math.random() * skiSlope.w,
        y: skiSlope.y + Math.random() * 40,
        vx: -0.4 - Math.random() * 0.6,
        vy: 0.5 + Math.random(),
        life: 50 + Math.random() * 30,
        r: 1 + Math.random() * 2,
      });
    }

    // entity ticks + pear/toy buoyancy + skiing
    for (const [id, meta] of [...entityMeta.entries()]) {
      if (meta.kind === "melon" && meta.skiing) {
        const torso = meta.parts[1] || meta.parts[0];
        const p = torso.position;
        if (meta.skiBoost > 0) meta.skiBoost--;
        if (skiBuilt && (inSkiSlope(p.x, p.y) || meta.skiBoost > 0)) {
          Body.applyForce(torso, p, { x: 0.0018, y: 0.0009 });
          if (Math.random() < 0.35) spawnSnow(p.x, p.y + 20, 2);
        }
      }
      if ((meta.kind === "pear" || meta.kind === "toy") && poolBuilt) {
        const body = meta.parts[0];
        const p = body.position;
        meta.bob += 0.05;
        if (inPearPool(p.x, p.y)) {
          const surface = pearPool.y + pearPool.h * 0.35;
          const depth = p.y - surface;
          Body.applyForce(body, p, {
            x: Math.sin(meta.bob) * 0.000015,
            y: -0.00005 - depth * 0.000004,
          });
          if (p.x < pearPool.x + 16) Body.applyForce(body, p, { x: 0.00008, y: 0 });
          if (p.x > pearPool.x + pearPool.w - 16) Body.applyForce(body, p, { x: -0.00008, y: 0 });
        }
      }
      if (meta.kind === "bomb") {
        meta.fuse--;
        if (meta.fuse <= 0) {
          const p = meta.parts[0].position;
          removeEntity(id);
          explode(p.x, p.y, 20);
          continue;
        }
      }
      if (meta.onFire > 0) {
        meta.onFire--;
        if (meta.onFire % 12 === 0) {
          const p = meta.parts[0].position;
          damageEntity(id, 3, p);
          flames.push({
            x: p.x + (Math.random() - 0.5) * 20,
            y: p.y - 10,
            vx: (Math.random() - 0.5),
            vy: -1.5,
            life: 20,
            r: 8,
          });
        }
      }
    }

    render();
    requestAnimationFrame(update);
  }

  toolbar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tool");
    if (!btn) return;
    setTool(btn.dataset.tool);
  });

  function enterGame() {
    if (started) return;
    intro.classList.add("hidden");
    skinModal.classList.add("hidden");
    started = true;
    hintEl.textContent = "Пустая арена: поставь дыню, бассейн, склон и игрушки сам.";
  }

  document.getElementById("start-btn").addEventListener("click", enterGame);

  document.getElementById("help-btn").addEventListener("click", () => {
    hintEl.textContent = "Дыня 🍉 = игрок. Бассейн 🏊, склон 🏔, игрушки 🧸 — ставишь сам. Ничего нет сразу.";
  });

  document.getElementById("intro-skins").addEventListener("click", openSkins);
  skinBtn.addEventListener("click", openSkins);
  document.getElementById("skin-close").addEventListener("click", closeSkins);
  skinGrid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-skin]");
    if (!card) return;
    setSkin(card.getAttribute("data-skin"));
  });
  skinModal.addEventListener("click", (e) => {
    if (e.target === skinModal) closeSkins();
  });

  // Enter on Enter / Space from intro
  window.addEventListener("keydown", (e) => {
    if (!started && (e.code === "Enter" || e.code === "Space")) {
      e.preventDefault();
      enterGame();
    }
  });

  // Auto-enter so the player always gets into the game
  setTimeout(enterGame, 900);

  canvas.addEventListener("mousedown", onPointerDown);
  canvas.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    onPointerDown(e);
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    onPointerMove(e);
  }, { passive: false });
  window.addEventListener("touchend", onPointerUp);

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (e) => {
    const map = {
      Digit1: "grab",
      Digit2: "melon",
      Digit3: "pool",
      Digit4: "slope",
      Digit5: "toy",
      Digit6: "ski",
      Digit7: "throw",
      Digit8: "pear",
      Digit9: "delete",
      KeyC: "clear",
    };
    if (map[e.code]) setTool(map[e.code]);
  });

  resize();
  setupMouse();
  updateStats();
  refreshSkinBtn();
  setTool("grab");
  update();

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (t === "heal" || t === "max") {
      for (const meta of entityMeta.values()) {
        if (meta.kind === "melon" || meta.kind === "pear") {
          meta.hp = meta.maxHp || meta.hp;
          meta.onFire = 0;
        }
      }
      if (typeof updateStats === "function") updateStats();
    }
    if (t === "mp-smash" || t === "dmg" || t === "max") {
      window.__AMAL_DMG__ = true;
      for (const [id, meta] of [...entityMeta.entries()]) {
        if (meta.kind === "platform" || meta.kind === "melon") continue;
        meta.hp = 0;
        if (typeof removeEntity === "function") removeEntity(id);
      }
    }
    if (t === "mp-spawn" || t === "max") {
      if (typeof makeMelon === "function") makeMelon(0, -100);
    }
    if (t === "mp-clear") {
      for (const id of [...entityMeta.keys()]) {
        const meta = entityMeta.get(id);
        if (meta && meta.kind !== "platform" && typeof removeEntity === "function") removeEntity(id);
      }
      if (typeof updateStats === "function") updateStats();
    }
  });
})();
