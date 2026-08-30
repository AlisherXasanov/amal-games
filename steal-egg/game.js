(() => {
  "use strict";

  const SAVE_KEY = "amal-steal-egg-v8";
  const VW = 960;
  const VH = 640;
  const MW = 3920;
  const MH = 2000;

  const EGG_TYPES = [
    { id: "basic", name: "Обычное яйцо", emoji: "🥚", color: "#fff", price: 0, rate: 1, weight: 620 },
    { id: "gold", name: "Золотое яйцо", emoji: "🐣", color: "#fbbf24", price: 80, rate: 4, weight: 240 },
    { id: "rare", name: "Редкое яйцо", emoji: "💎", color: "#a855f7", price: 350, rate: 12, weight: 110 },
    { id: "epic", name: "Эпик яйцо", emoji: "🔮", color: "#6366f1", price: 1200, rate: 28, weight: 24 },
    { id: "dragon", name: "Дракон яйцо", emoji: "🐉", color: "#ef4444", price: 8000, rate: 70, weight: 5 },
    { id: "final", name: "ФИНАЛ яйцо", emoji: "👑", color: "#fde68a", price: 0, rate: 200, weight: 1 },
  ];

  /** Яйцо вылупляется в питомца — как в Roblox */
  const PETS = {
    basic: { name: "Цыпа", emoji: "🐤" },
    gold: { name: "Золотуша", emoji: "🐥" },
    rare: { name: "Кристаллик", emoji: "🦊" },
    epic: { name: "Единорог", emoji: "🦄" },
    dragon: { name: "Дракоша", emoji: "🐲" },
    final: { name: "Король", emoji: "👑" },
  };

  const PLAYER_SKINS = [
    { id: "cool", emoji: "😎", body: "#38bdf8", outline: "#0ea5e9", name: "Крутой" },
    { id: "boy", emoji: "🧒", body: "#22c55e", outline: "#16a34a", name: "Мальчик" },
    { id: "girl", emoji: "👧", body: "#f472b6", outline: "#db2777", name: "Девочка" },
    { id: "cat", emoji: "🐱", body: "#fbbf24", outline: "#d97706", name: "Котик" },
    { id: "robot", emoji: "🤖", body: "#94a3b8", outline: "#64748b", name: "Робот" },
    { id: "alien", emoji: "👽", body: "#a855f7", outline: "#7e22ce", name: "Пришелец" },
  ];

  const TRAILS = [
    { id: "none", name: "Нет", mult: 1, price: 0, color: null },
    { id: "white", name: "Белый", mult: 1.5, price: 150, color: "#fff" },
    { id: "gold", name: "Золото", mult: 2, price: 900, color: "#fbbf24" },
    { id: "fire", name: "Огонь", mult: 3, price: 6000, color: "#f97316" },
    { id: "rain", name: "Радуга", mult: 5, price: 45000, color: "#a855f7" },
    { id: "cosmo", name: "Космо", mult: 8, price: 320000, color: "#38bdf8" },
    { id: "legend", name: "Легенда", mult: 12, price: 2.5e6, color: "#22d3ee" },
    { id: "myth", name: "Миф", mult: 20, price: 45e6, color: "#ec4899" },
    { id: "star", name: "Звезда", mult: 35, price: 500e6, color: "#fde68a" },
    { id: "final", name: "ФИНАЛ", mult: 50, price: 1e12, color: "#fff" },
  ];

  const TREADMILL_LEVELS = [
    { price: 0, gain: 4, label: "Старт" },
    { price: 400, gain: 10, label: "Быстрая" },
    { price: 2200, gain: 28, label: "Спринт" },
    { price: 12000, gain: 80, label: "Мощная" },
    { price: 65000, gain: 250, label: "Turbo" },
    { price: 380000, gain: 900, label: "Мега" },
    { price: 2.2e6, gain: 3200, label: "Giga" },
    { price: 15e6, gain: 12000, label: "Ultra" },
    { price: 120e6, gain: 45000, label: "Hyper" },
    { price: 500e6, gain: 150000, label: "Max" },
    { price: 1e12, gain: 600000, label: "ФИНАЛ" },
  ];

  const LUCKY_PRICE = 250;
  const DAY_SEC = 60;
  const NIGHT_SEC = 60;
  const BLINK_EVERY = 180;
  const BLINK_DUR = 35;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const coinsEl = document.getElementById("coins");
  const incomeEl = document.getElementById("income");
  const speedEl = document.getElementById("speedStat");
  const rankEl = document.getElementById("rankLabel");
  const zoneEl = document.getElementById("zoneLabel");
  const carryEl = document.getElementById("carry");
  const timeEl = document.getElementById("timeLabel");
  const indexList = document.getElementById("indexList");
  const toastEl = document.getElementById("toast");
  const promptEl = document.getElementById("prompt");
  const btnLock = document.getElementById("btnLock");
  const stickEl = document.getElementById("stick");
  const actBtn = document.getElementById("actBtn");
  const tutorial = document.getElementById("tutorial");
  const btnStart = document.getElementById("btnStart");
  const adminPanel = document.getElementById("adminPanel");
  const eventBanner = document.getElementById("eventBanner");
  const alarmEl = document.getElementById("alarm");

  const panes = {
    eggs: document.getElementById("pane-eggs"),
    lucky: document.getElementById("pane-lucky"),
    trail: document.getElementById("pane-trail"),
    base: document.getElementById("pane-base"),
  };

  let coins = 100;
  let speedStat = 1;
  let treadmillLv = 0;
  let trailId = "none";
  let baseSlots = 4;
  let lockBonus = 0;
  let lockUntil = 0;
  let gameTime = 0;
  let onTreadmill = false;
  let toastTimer = 0;
  let incomeTimer = 0;
  let trailDots = [];
  let paused = true;
  let gateToast = 0;
  let wasNight = false;
  let blinkLeft = 0;
  let blinkTimer = BLINK_EVERY;
  let hitFlash = 0;
  let audioCtx = null;
  let hudAcc = 0;
  let lastCoins = -1;
  let lastIncome = -1;
  let lastSpeed = -1;
  let lastRankKey = "";
  let grassTexDay = null;
  let grassTexNight = null;
  let playerSkinId = "cool";
  let treadmillRun = false;
  let treadmillScroll = 0;

  const keys = {};
  const stick = { active: false, dx: 0, dy: 0, ox: 0, oy: 0, pid: null };

  const player = {
    x: 280,
    y: 1700,
    r: 16,
    carry: null,
    color: "#38bdf8",
    emoji: "😎",
    stunned: 0,
    hitCd: 0,
  };
  const cam = { x: 0, y: 0 };

  const CHAR_LOOK = {
    player: { emoji: "😎", body: "#38bdf8", outline: "#0ea5e9" },
    nub: { emoji: "😐", body: "#94a3b8", outline: "#64748b" },
    neighbor: { emoji: "😠", body: "#ef4444", outline: "#b91c1c" },
    katya: { emoji: "😤", body: "#f97316", outline: "#c2410c" },
    rick: { emoji: "😏", body: "#3b82f6", outline: "#1d4ed8" },
    erox: { emoji: "👿", body: "#a855f7", outline: "#7e22ce" },
    dragon: { emoji: "🐲", body: "#dc2626", outline: "#991b1b" },
    legend: { emoji: "🧊", body: "#0891b2", outline: "#0e7490" },
    final: { emoji: "👑", body: "#eab308", outline: "#ca8a04" },
  };

  /** Зоны с вольерами — чем дальше, тем сильнее босс и круче яйца */
  const ZONE_DEFS = [
    {
      id: "home",
      name: "🏠 ТВОЯ ЗОНА",
      x: 60,
      y: 1480,
      w: 440,
      h: 340,
      fill: "#14532d",
      stroke: "#86efac",
      isHome: true,
      pens: [
        { x: 120, y: 1580, w: 88, h: 68 },
        { x: 230, y: 1580, w: 88, h: 68 },
        { x: 120, y: 1670, w: 88, h: 68 },
        { x: 230, y: 1670, w: 88, h: 68 },
      ],
    },
    {
      id: "z1",
      name: "Зона 1 · Нубик",
      x: 560,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#334155",
      stroke: "#94a3b8",
      needSpeed: 0,
      boss: { id: "nub", name: "НУБ", speed: 600, color: "#cbd5e1" },
      pens: [
        { x: 610, y: 1580, w: 82, h: 62 },
        { x: 720, y: 1580, w: 82, h: 62 },
        { x: 665, y: 1670, w: 82, h: 62 },
      ],
      eggs: [620, 340, 40, 0, 0, 0],
    },
    {
      id: "z2",
      name: "Зона 2 · Сосед",
      x: 980,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#450a0a",
      stroke: "#fca5a5",
      needSpeed: 600,
      boss: { id: "neighbor", name: "СОСЕД", speed: 6000, color: "#fca5a5" },
      pens: [
        { x: 1030, y: 1580, w: 82, h: 62 },
        { x: 1140, y: 1580, w: 82, h: 62 },
        { x: 1085, y: 1670, w: 82, h: 62 },
      ],
      eggs: [380, 420, 180, 20, 0, 0],
    },
    {
      id: "z3",
      name: "Зона 3 · Катя",
      x: 1400,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#431407",
      stroke: "#fdba74",
      needSpeed: 6000,
      boss: { id: "katya", name: "КАТЯ", speed: 60000, color: "#fdba74" },
      pens: [
        { x: 1450, y: 1580, w: 82, h: 62 },
        { x: 1560, y: 1580, w: 82, h: 62 },
        { x: 1505, y: 1670, w: 82, h: 62 },
      ],
      eggs: [180, 320, 360, 130, 10, 0],
    },
    {
      id: "z4",
      name: "Зона 4 · Рик",
      x: 1820,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#1e3a8a",
      stroke: "#93c5fd",
      needSpeed: 60000,
      boss: { id: "rick", name: "РИК", speed: 600000, color: "#93c5fd" },
      pens: [
        { x: 1870, y: 1580, w: 82, h: 62 },
        { x: 1980, y: 1580, w: 82, h: 62 },
        { x: 1925, y: 1670, w: 82, h: 62 },
      ],
      eggs: [60, 140, 320, 380, 100, 0],
    },
    {
      id: "z5",
      name: "Зона 5 · Ерокс",
      x: 2240,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#581c87",
      stroke: "#d8b4fe",
      needSpeed: 600000,
      boss: { id: "erox", name: "ЕРОКС", speed: 6000000, color: "#d8b4fe" },
      pens: [
        { x: 2290, y: 1580, w: 82, h: 62 },
        { x: 2400, y: 1580, w: 82, h: 62 },
        { x: 2345, y: 1670, w: 82, h: 62 },
        { x: 2290, y: 1740, w: 82, h: 62 },
      ],
      eggs: [20, 70, 200, 350, 320, 40],
    },
    {
      id: "z6",
      name: "Зона 6 · Дракон",
      x: 2660,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#7f1d1d",
      stroke: "#fca5a5",
      needSpeed: 6000000,
      boss: { id: "dragon", name: "ДРАКОН", speed: 60000000, color: "#fca5a5" },
      pens: [
        { x: 2710, y: 1580, w: 82, h: 62 },
        { x: 2820, y: 1580, w: 82, h: 62 },
        { x: 2765, y: 1670, w: 82, h: 62 },
        { x: 2710, y: 1740, w: 82, h: 62 },
      ],
      eggs: [5, 30, 90, 250, 450, 175],
    },
    {
      id: "z7",
      name: "Зона 7 · Легенда",
      x: 3080,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#164e63",
      stroke: "#67e8f9",
      needSpeed: 60000000,
      boss: { id: "legend", name: "ЛЕГЕНДА", speed: 600000000, color: "#67e8f9" },
      pens: [
        { x: 3130, y: 1580, w: 82, h: 62 },
        { x: 3240, y: 1580, w: 82, h: 62 },
        { x: 3185, y: 1670, w: 82, h: 62 },
        { x: 3130, y: 1740, w: 82, h: 62 },
      ],
      eggs: [0, 15, 70, 180, 400, 335],
    },
    {
      id: "z8",
      name: "👑 Зона 8 · ФИНАЛ",
      x: 3500,
      y: 1480,
      w: 360,
      h: 340,
      fill: "#713f12",
      stroke: "#fde68a",
      needSpeed: 600000000,
      boss: { id: "final", name: "👑 ФИНАЛ", speed: 6000000000, color: "#fde68a", boss: true },
      pens: [
        { x: 3540, y: 1570, w: 90, h: 70 },
        { x: 3660, y: 1570, w: 90, h: 70 },
        { x: 3540, y: 1660, w: 90, h: 70 },
        { x: 3660, y: 1660, w: 90, h: 70 },
      ],
      eggs: [0, 0, 20, 80, 350, 550],
    },
  ];

  const GATES = [
    { x: 505, y: 1460, w: 32, h: 380, need: 0 },
    { x: 925, y: 1460, w: 32, h: 380, need: 600 },
    { x: 1345, y: 1460, w: 32, h: 380, need: 6000 },
    { x: 1765, y: 1460, w: 32, h: 380, need: 60000 },
    { x: 2185, y: 1460, w: 32, h: 380, need: 600000 },
    { x: 2605, y: 1460, w: 32, h: 380, need: 6000000 },
    { x: 3025, y: 1460, w: 32, h: 380, need: 60000000 },
    { x: 3445, y: 1460, w: 32, h: 380, need: 600000000 },
  ];

  const shop = { x: 340, y: 1520, r: 52, label: "МАГАЗИН" };
  /** Большая дорожка внизу своей зоны — беги W чтобы качать ⚡ */
  const treadmill = { x: 280, y: 1745, w: 360, h: 72, label: "ДОРОЖКА" };

  const rivals = ZONE_DEFS.filter(function (z) {
    return z.boss;
  }).map(function (z) {
    const look = CHAR_LOOK[z.boss.id] || CHAR_LOOK.nub;
    return {
      name: z.boss.name,
      speed: z.boss.speed,
      color: z.boss.color,
      look: look,
      x: z.x + z.w / 2,
      y: z.y + 120,
      homeX: z.x + z.w / 2,
      homeY: z.y + 120,
      zoneId: z.id,
      bossId: z.boss.id,
      carry: null,
      boss: !!z.boss.boss,
      angry: false,
      aiTimer: Math.random() * 2,
    };
  });

  const pedestals = [];

  function initTextures() {
    function makeGrass(night) {
      const tile = document.createElement("canvas");
      tile.width = 40;
      tile.height = 40;
      const t = tile.getContext("2d");
      t.fillStyle = night ? "#14532d" : "#4ade80";
      t.fillRect(0, 0, 40, 40);
      t.fillStyle = night ? "#166534" : "#22c55e";
      t.fillRect(0, 0, 20, 20);
      t.fillRect(20, 20, 20, 20);
      return ctx.createPattern(tile, "repeat");
    }
    grassTexDay = makeGrass(false);
    grassTexNight = makeGrass(true);
  }

  function inView(x, y, w, h, pad) {
    pad = pad || 48;
    return x + (w || 0) >= cam.x - pad && x <= cam.x + VW + pad && y + (h || 0) >= cam.y - pad && y <= cam.y + VH + pad;
  }

  function isChased() {
    if (!player.carry || !player.carry.fromZoneId || player.carry.fromZoneId === "shop" || player.carry.fromZoneId === "admin") {
      return false;
    }
    return rivals.some(function (r) {
      return r.angry && r.zoneId === player.carry.fromZoneId;
    });
  }
  function formatNum(n) {
    n = Number(n) || 0;
    if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return Math.round(n / 1000) + "K";
    return Math.floor(n).toString();
  }

  function trailMult() {
    const t = TRAILS.find((x) => x.id === trailId);
    return t ? t.mult : 1;
  }

  function treadmillGain() {
    return (TREADMILL_LEVELS[treadmillLv] || TREADMILL_LEVELS[0]).gain * trailMult();
  }

  function moveSpeed() {
    const base = 150;
    const boost = Math.min(70, Math.log10(Math.max(10, speedStat)) * 22);
    let sp = base + boost;
    if (player.carry) sp *= 0.75;
    if (player.stunned > 0) sp *= 0.35;
    return sp;
  }

  function isNight() {
    const cycle = DAY_SEC + NIGHT_SEC;
    const t = gameTime % cycle;
    return t >= DAY_SEC;
  }

  function cycleLeft() {
    const cycle = DAY_SEC + NIGHT_SEC;
    const t = gameTime % cycle;
    if (isNight()) return cycle - t;
    return DAY_SEC - t;
  }

  function playTone(freq, dur, type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function playNightSound() {
    playTone(220, 0.35, "triangle");
    setTimeout(function () {
      playTone(165, 0.5, "triangle");
    }, 200);
  }

  function playHitSound() {
    playTone(120, 0.15, "square");
  }

  function playBlinkSound() {
    playTone(880, 0.12, "sine");
    setTimeout(function () {
      playTone(1100, 0.15, "sine");
    }, 100);
  }

  function wrapCarry(egg, zoneId) {
    return {
      typeId: egg.typeId,
      name: egg.name,
      emoji: egg.emoji,
      color: egg.color,
      rate: egg.rate,
      fromZoneId: zoneId,
    };
  }

  function eggFromType(typeId) {
    return hatchPet(typeId);
  }

  function hatchPet(typeId) {
    const t = EGG_TYPES.find(function (e) {
      return e.id === typeId;
    }) || EGG_TYPES[0];
    const p = PETS[t.id] || { name: t.name, emoji: t.emoji };
    return {
      typeId: t.id,
      name: p.name,
      emoji: p.emoji,
      eggEmoji: t.emoji,
      color: t.color,
      rate: t.rate,
      isPet: true,
    };
  }

  function applyPlayerSkin(id) {
    const s = PLAYER_SKINS.find(function (x) {
      return x.id === id;
    }) || PLAYER_SKINS[0];
    playerSkinId = s.id;
    player.emoji = s.emoji;
    player.color = s.body;
    CHAR_LOOK.player = { emoji: s.emoji, body: s.body, outline: s.outline };
  }

  function petSleeping(p) {
    return isNight() && p && p.egg;
  }

  function returnEggToZone(zoneId, eggData) {
    const empty = pedestals.filter(function (p) {
      return p.zoneId === zoneId && !p.egg;
    });
    const egg = eggFromType(eggData.typeId);
    if (empty.length) empty[0].egg = egg;
    else {
      const any = pedestals.find(function (p) {
        return p.zoneId === zoneId;
      });
      if (any) any.egg = egg;
    }
  }

  function setBossAngry(zoneId, on) {
    rivals.forEach(function (r) {
      if (r.zoneId === zoneId) r.angry = on;
    });
  }

  function checkCrossZoneSafe() {
    if (!player.carry || !player.carry.fromZoneId) return;
    const here = zoneAt(player.x, player.y);
    if (here && here.isHome) {
      setBossAngry(player.carry.fromZoneId, false);
      return;
    }
    if (!here || here.isHome) return;
    if (here.id !== player.carry.fromZoneId && here.boss) {
      setBossAngry(player.carry.fromZoneId, false);
    }
  }

  function bossHitPlayer(npc) {
    if (player.hitCd > 0 || !player.carry) return;
    player.hitCd = 1.2;
    player.stunned = 0.9;
    hitFlash = 0.35;
    const egg = player.carry;
    player.carry = null;
    returnEggToZone(egg.fromZoneId, egg);
    npc.angry = false;
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const len = Math.hypot(dx, dy) || 1;
    player.x += (dx / len) * 55;
    player.y += (dy / len) * 55;
    showToast("💥 " + npc.name + " вернул яйцо!");
    playHitSound();
  }

  function refreshAllBossEggs() {
    pedestals.forEach(function (p) {
      if (p.baseId === "mine") return;
      p.egg = rollEggForZone(p.zoneId, true);
      p.respawn = 0;
    });
  }

  function triggerNightEvent() {
    refreshAllBossEggs();
    rivals.forEach(function (r) {
      r.angry = false;
      r.x = r.homeX;
      r.y = r.homeY;
      r.carry = null;
    });
    playNightSound();
    if (eventBanner) {
      eventBanner.textContent = "🌙 Ночь! Яйца обновились · животные проснулись";
      eventBanner.classList.add("show");
      setTimeout(function () {
        eventBanner.classList.remove("show");
      }, 3500);
    }
    showToast("🌙 Сон — питомцы спят · яйца обновились!");
  }

  function triggerBlinkEvent() {
    blinkLeft = BLINK_DUR;
    playBlinkSound();
    if (eventBanner) {
      eventBanner.textContent = "✨ BLINK ивент! Крутые яйца во всех зонах!";
      eventBanner.classList.add("blink");
      eventBanner.classList.add("show");
    }
    refreshAllBossEggs();
    showToast("✨ BLINK — лови редкие яйца!");
  }

  function rollEggLucky() {
    return rollEggForZone("z1");
  }

  function rollEggForZone(zoneId, forceCool) {
    const z = ZONE_DEFS.find(function (x) {
      return x.id === zoneId;
    });
    let weights = (z && z.eggs ? z.eggs.slice() : [620, 240, 110, 24, 5, 1]);
    if (blinkLeft > 0 || forceCool) {
      weights = weights.map(function (w, i) {
        return i >= 2 ? w * 2.2 : w * 0.7;
      });
    }
    const ids = ["basic", "gold", "rare", "epic", "dragon", "final"];
    let total = 0;
    weights.forEach(function (w) {
      total += w;
    });
    if (total <= 0) return eggFromType("basic");
    let r = Math.random() * total;
    for (let i = 0; i < ids.length; i++) {
      r -= weights[i];
      if (r <= 0) return eggFromType(ids[i]);
    }
    return eggFromType("basic");
  }

  function zoneAt(x, y) {
    for (let i = 0; i < ZONE_DEFS.length; i++) {
      const z = ZONE_DEFS[i];
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
    }
    return null;
  }

  function zoneUnlocked(z) {
    return !z || z.isHome || speedStat >= (z.needSpeed || 0);
  }

  function initPedestals() {
    pedestals.length = 0;
    ZONE_DEFS.forEach(function (zone) {
      if (zone.isHome) {
        zone.pens.slice(0, baseSlots).forEach(function (pen) {
          pedestals.push({
            x: pen.x + pen.w / 2,
            y: pen.y + pen.h / 2,
            baseId: "mine",
            zoneId: "home",
            pen: pen,
            egg: null,
            respawn: 0,
          });
        });
        return;
      }
      zone.pens.forEach(function (pen) {
        pedestals.push({
          x: pen.x + pen.w / 2,
          y: pen.y + pen.h / 2,
          baseId: zone.boss.id,
          zoneId: zone.id,
          pen: pen,
          egg: rollEggForZone(zone.id),
          respawn: 0,
        });
      });
    });
  }

  function rebuildMySlots() {
    const eggs = pedestals.filter(function (p) {
      return p.baseId === "mine";
    }).map(function (p) {
      return p.egg;
    });
    for (let i = pedestals.length - 1; i >= 0; i--) {
      if (pedestals[i].baseId === "mine") pedestals.splice(i, 1);
    }
    const home = ZONE_DEFS[0];
    home.pens.slice(0, baseSlots).forEach(function (pen, i) {
      pedestals.push({
        x: pen.x + pen.w / 2,
        y: pen.y + pen.h / 2,
        baseId: "mine",
        zoneId: "home",
        pen: pen,
        egg: eggs[i] || null,
        respawn: 0,
      });
    });
  }

  function saveGame() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          coins,
          speedStat,
          treadmillLv,
          trailId,
          baseSlots,
          lockBonus,
          tut: tutorial.hidden,
          skin: playerSkinId,
          eggs: pedestals.filter((p) => p.baseId === "mine").map((p) => (p.egg ? p.egg.typeId : null)),
        })
      );
    } catch (_) {}
  }

  function loadGame() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!d) return;
      if (d.coins != null) coins = d.coins;
      if (d.speedStat != null) speedStat = d.speedStat;
      if (d.treadmillLv != null) treadmillLv = d.treadmillLv;
      if (d.trailId != null) trailId = d.trailId;
      if (d.baseSlots != null) baseSlots = d.baseSlots;
      if (d.lockBonus != null) lockBonus = d.lockBonus;
      if (d.skin) applyPlayerSkin(d.skin);
      if (d.tut) {
        tutorial.hidden = true;
        paused = false;
      }
      initPedestals();
      rebuildMySlots();
      if (Array.isArray(d.eggs)) {
        const mine = pedestals.filter((p) => p.baseId === "mine");
        d.eggs.forEach((id, i) => {
          if (id && mine[i]) mine[i].egg = eggFromType(id);
        });
      }
    } catch (_) {}
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function myPedestals() {
    return pedestals.filter((p) => p.baseId === "mine");
  }

  function incomePerSec() {
    if (isNight()) return 0;
    return myPedestals().reduce(function (s, p) {
      return s + (p.egg && !petSleeping(p) ? p.egg.rate : 0);
    }, 0);
  }

  function playerPower() {
    return speedStat * trailMult() * (1 + incomePerSec() / 50);
  }

  function getIndex() {
    const rows = [
      { name: "ТЫ", speed: speedStat, me: true },
      ...rivals.map((r) => ({
        name: r.name,
        speed: r.speed * (isNight() ? 0.85 : 1),
        me: false,
      })),
    ];
    rows.sort((a, b) => b.speed * (b.me ? trailMult() : 1) - a.speed * (a.me ? trailMult() : 1));
    return rows;
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    toastTimer = 2.2;
  }

  function updateHud(force) {
    const inc = incomePerSec();
    if (force || coins !== lastCoins) {
      lastCoins = coins;
      coinsEl.textContent = formatNum(coins);
    }
    if (force || inc !== lastIncome || speedStat !== lastSpeed) {
      lastIncome = inc;
      lastSpeed = speedStat;
      const spEl = document.getElementById("speedStat");
      if (spEl) spEl.textContent = formatNum(speedStat);
      const incNum = document.getElementById("income");
      if (incNum) incNum.textContent = formatNum(inc);
    }
    const carryTxt = player.carry
      ? "Несёшь: " + player.carry.emoji + " " + player.carry.name
      : "В руках: пусто";
    if (force || carryEl.textContent !== carryTxt) carryEl.textContent = carryTxt;

    timeEl.textContent = isNight()
      ? "🌙 Сон · питомцы спят · +" + Math.ceil(cycleLeft()) + "с"
      : "☀️ День · ночь через " + Math.ceil(cycleLeft()) + "с";

    const rows = getIndex();
    const rankKey = rows.map(function (r, i) {
      return i + ":" + r.name;
    }).join("|");
    if (force || rankKey !== lastRankKey) {
      lastRankKey = rankKey;
      indexList.innerHTML = "";
      rows.forEach(function (row, i) {
        const li = document.createElement("li");
        li.textContent = i + 1 + ". " + row.name + " " + formatNum(row.speed);
        if (row.me) li.className = "me";
        indexList.appendChild(li);
      });
    }
    const myRank = rows.findIndex(function (r) {
      return r.me;
    }) + 1;
    if (myRank === 1) {
      rankEl.textContent = "👑 ФИНАЛЬНЫЙ БОСС";
      rankEl.className = "rank final";
    } else {
      rankEl.textContent = "Индекс: #" + myRank;
      rankEl.className = "rank";
    }

    const z = zoneAt(player.x, player.y);
    if (zoneEl) {
      if (!z) zoneEl.textContent = "🗺️ Карта";
      else if (z.isHome) zoneEl.textContent = z.name;
      else if (zoneUnlocked(z)) zoneEl.textContent = z.name + " · " + z.boss.name;
      else zoneEl.textContent = "🔒 " + z.name + " · нужно ⚡" + formatNum(z.needSpeed);
    }

    if (alarmEl) alarmEl.hidden = !isChased();

    const lockLeft = Math.max(0, lockUntil - performance.now());
    btnLock.disabled = lockLeft > 0;
    btnLock.textContent = lockLeft > 0 ? "🔒 " + Math.ceil(lockLeft / 1000) + "с" : "🔒 База";
  }

  function nearestPedestal(filter) {
    let best = null;
    let bestD = 999;
    pedestals.forEach((p) => {
      if (filter && !filter(p)) return;
      const d = dist(player.x, player.y, p.x, p.y);
      if (d < 40 && d < bestD) {
        bestD = d;
        best = p;
      }
    });
    return best;
  }

  function buyEgg(typeId) {
    const t = EGG_TYPES.find((e) => e.id === typeId);
    if (!t || t.id === "final" || player.carry || coins < t.price) {
      if (player.carry) showToast("Поставь яйцо на базу (E)");
      else showToast("Мало монет");
      return;
    }
    coins -= t.price;
    player.carry = wrapCarry(eggFromType(typeId), "shop");
    showToast("🐣 " + player.carry.emoji + " " + player.carry.name + " вылупился!");
    saveGame();
    refreshShop();
    updateHud(true);
  }

  function buyLucky() {
    if (player.carry || coins < LUCKY_PRICE) return;
    coins -= LUCKY_PRICE;
    player.carry = wrapCarry(rollEggLucky(), "shop");
    showToast("Lucky: " + player.carry.emoji + " " + player.carry.name);
    saveGame();
    refreshShop();
    updateHud(true);
  }

  function buyTrail(id) {
    const t = TRAILS.find((x) => x.id === id);
    if (!t || trailId === id || coins < t.price) return;
    coins -= t.price;
    trailId = id;
    showToast("След: " + t.name);
    saveGame();
    refreshShop();
    updateHud(true);
  }

  function upgradeTreadmill() {
    const next = treadmillLv + 1;
    if (next >= TREADMILL_LEVELS.length) return;
    const cost = TREADMILL_LEVELS[next].price;
    if (coins < cost) {
      showToast("Нужно " + formatNum(cost));
      return;
    }
    coins -= cost;
    treadmillLv = next;
    showToast("Дорожка: " + TREADMILL_LEVELS[next].label);
    saveGame();
    refreshShop();
    updateHud(true);
  }

  function buyBaseSlot() {
    const cost = 150 + baseSlots * 100;
    if (baseSlots >= 8 || coins < cost) return;
    coins -= cost;
    baseSlots++;
    rebuildMySlots();
    showToast("Вольер " + baseSlots + "/8");
    saveGame();
    refreshShop();
    updateHud(true);
  }

  function tryPlace() {
    if (!player.carry) return false;
    const slot = nearestPedestal((p) => p.baseId === "mine" && !p.egg);
    if (!slot) return false;
    slot.egg = eggFromType(player.carry.typeId);
    player.carry = null;
    rivals.forEach(function (r) {
      r.angry = false;
    });
    showToast("В вольер! " + slot.egg.emoji + " " + slot.egg.name);
    saveGame();
    return true;
  }

  function trySteal() {
    if (player.carry) return false;
    const slot = nearestPedestal(function (p) {
      if (p.baseId === "mine" || !p.egg) return false;
      const z = ZONE_DEFS.find(function (x) {
        return x.id === p.zoneId;
      });
      return zoneUnlocked(z);
    });
    if (!slot) return false;
    player.carry = wrapCarry(slot.egg, slot.zoneId);
    slot.egg = null;
    setBossAngry(slot.zoneId, true);
    showToast("Украл " + player.carry.emoji + "! Беги домой!");
    return true;
  }

  function doAction() {
    if (paused) return;
    if (tryPlace() || trySteal()) return;
    showToast("Подойди к яйцу или слоту");
  }

  function lockBase() {
    if (lockUntil > performance.now()) return;
    lockUntil = performance.now() + 12000 + lockBonus * 5000;
    showToast("База закрыта 🔒");
    updateHud(true);
  }

  function paneHtml(name, html) {
    panes[name].innerHTML = html;
  }

  function refreshShop() {
    let eggs = '<div class="shop-row">';
    EGG_TYPES.forEach((t) => {
      if (t.id === "final") return;
      eggs +=
        '<button type="button"' +
        (coins < t.price || player.carry ? " disabled" : "") +
        ' data-egg="' +
        t.id +
        '">' +
        t.emoji +
        " " +
        t.name +
        '<span class="price">' +
        (t.price ? formatNum(t.price) : "0") +
        " · +" +
        t.rate +
        "</span></button>";
    });
    eggs += "</div>";
    paneHtml("eggs", eggs);
    panes.eggs.querySelectorAll("[data-egg]").forEach((btn) => {
      btn.onclick = () => buyEgg(btn.dataset.egg);
    });

    const lv = TREADMILL_LEVELS[treadmillLv];
    const next = TREADMILL_LEVELS[treadmillLv + 1];
    let lucky =
      '<div class="shop-row">' +
      '<button type="button" id="btnLucky"' +
      (coins < LUCKY_PRICE || player.carry ? " disabled" : "") +
      ">🎰 Lucky " +
      LUCKY_PRICE +
      "</button>";
    if (next) {
      lucky +=
        '<button type="button" id="btnTmill"' +
        (coins < next.price ? " disabled" : "") +
        ">🏃 " +
        next.label +
        " " +
        formatNum(next.price) +
        "</button>";
    }
    lucky += "</div>";
    lucky +=
      '<p class="shop-hint">Дорожка: +' +
      formatNum(treadmillGain()) +
      "/с · " +
      lv.label +
      "</p>";
    lucky += '<p class="shop-hint">Lucky — яйца как в зоне 1. Дальние зоны = круче яйца!</p>';
    paneHtml("lucky", lucky);
    document.getElementById("btnLucky").onclick = buyLucky;
    const bt = document.getElementById("btnTmill");
    if (bt) bt.onclick = upgradeTreadmill;

    let tr = '<div class="shop-row">';
    TRAILS.forEach((t) => {
      tr +=
        '<button type="button"' +
        (trailId === t.id ? ' class="owned"' : "") +
        (trailId === t.id || coins < t.price ? " disabled" : "") +
        ' data-tr="' +
        t.id +
        '">x' +
        t.mult +
        " " +
        t.name +
        '<span class="price">' +
        formatNum(t.price) +
        "</span></button>";
    });
    tr += "</div>";
    paneHtml("trail", tr);
    panes.trail.querySelectorAll("[data-tr]").forEach((btn) => {
      btn.onclick = () => buyTrail(btn.dataset.tr);
    });

    const slotCost = 150 + baseSlots * 100;
    paneHtml(
      "base",
      '<div class="shop-row">' +
        '<button type="button" id="btnSlot"' +
        (baseSlots >= 8 || coins < slotCost ? " disabled" : "") +
        ">+ вольер " +
        formatNum(slotCost) +
        "</button></div>"
    );
    document.getElementById("btnSlot").onclick = buyBaseSlot;
  }

  document.querySelectorAll(".shop-tabs .tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".shop-tabs .tab").forEach((t) => t.classList.remove("on"));
      document.querySelectorAll(".shop-pane").forEach((p) => p.classList.remove("on"));
      tab.classList.add("on");
      panes[tab.dataset.tab].classList.add("on");
    };
  });

  btnStart.onclick = () => {
    tutorial.hidden = true;
    paused = false;
    player.x = 280;
    player.y = 1700;
    saveGame();
    showToast("Встань на 🏃 дорожку и жми W!");
  };

  document.querySelectorAll(".char-btn").forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll(".char-btn").forEach(function (b) {
        b.classList.remove("on");
      });
      btn.classList.add("on");
      applyPlayerSkin(btn.dataset.skin);
    };
  });
  const defaultChar = document.querySelector('.char-btn[data-skin="cool"]');
  if (defaultChar) defaultChar.classList.add("on");

  function updatePrompt() {
    let t = "";
    if (onTreadmill) {
      if (treadmillRun) t = "🏃 БЕГИ! +" + formatNum(treadmillGain()) + "/с ⚡";
      else t = "👟 Встань на дорожку и жми W — бег!";
    } else if (isNight()) t = "💤 Ночь — питомцы спят";
    else if (player.carry && nearestPedestal((p) => p.baseId === "mine" && !p.egg)) t = "E — в вольер";
    else if (!player.carry && nearestPedestal((p) => p.baseId !== "mine" && p.egg)) t = "E — украсть!";
    else if (player.carry && player.carry.fromZoneId) {
      rivals.forEach(function (r) {
        if (r.angry && r.zoneId === player.carry.fromZoneId && dist(player.x, player.y, r.x, r.y) < 120) {
          t = "😡 " + r.name + " гонится!";
        }
      });
    }
    else {
      GATES.forEach(function (g) {
        if (t || g.need <= 0 || speedStat >= g.need) return;
        if (dist(player.x, player.y, g.x + g.w / 2, g.y + g.h / 2) < 70) {
          t = "🔒 Нужно ⚡ " + formatNum(g.need);
        }
      });
    }
    promptEl.style.display = t ? "block" : "none";
    promptEl.textContent = t;
  }

  function applyGates() {
    GATES.forEach(function (g) {
      if (speedStat >= g.need) return;
      if (
        player.x + player.r > g.x &&
        player.x - player.r < g.x + g.w &&
        player.y + player.r > g.y &&
        player.y - player.r < g.y + g.h
      ) {
        if (player.x < g.x + g.w / 2) player.x = g.x - player.r - 2;
        else player.x = g.x + g.w + player.r + 2;
        gateToast -= 1;
        if (gateToast <= 0) {
          gateToast = 90;
          showToast("🔒 Зона закрыта! Качай ⚡ на дорожке — нужно " + formatNum(g.need));
        }
      }
    });
  }

  function movePlayer(dt) {
    if (player.stunned > 0) player.stunned -= dt;
    if (player.hitCd > 0) player.hitCd -= dt;

    let mx = 0;
    let my = 0;
    const panMode = keys.ShiftLeft || keys.ShiftRight;
    if (panMode) {
      if (keys.ArrowUp || keys.KeyW) cam.y -= 320 * dt;
      if (keys.ArrowDown || keys.KeyS) cam.y += 320 * dt;
      if (keys.ArrowLeft || keys.KeyA) cam.x -= 320 * dt;
      if (keys.ArrowRight || keys.KeyD) cam.x += 320 * dt;
      cam.x = Math.max(0, Math.min(MW - VW, cam.x));
      cam.y = Math.max(0, Math.min(MH - VH, cam.y));
      onTreadmill = false;
      return;
    }

    if (keys.ArrowUp || keys.KeyW) my -= 1;
    if (keys.ArrowDown || keys.KeyS) my += 1;
    if (keys.ArrowLeft || keys.KeyA) mx -= 1;
    if (keys.ArrowRight || keys.KeyD) mx += 1;
    if (stick.active) {
      mx = stick.dx;
      my = stick.dy;
    }
    const len = Math.hypot(mx, my);
    if (len > 0.01) {
      const sp = moveSpeed() * dt;
      player.x += (mx / len) * sp;
      player.y += (my / len) * sp;
      const tr = TRAILS.find((t) => t.id === trailId);
      if (tr && tr.color) {
        trailDots.push({ x: player.x, y: player.y, life: 1, color: tr.color });
        if (trailDots.length > 30) trailDots.shift();
      }
    }
    player.x = Math.max(24, Math.min(MW - 24, player.x));
    player.y = Math.max(24, Math.min(MH - 24, player.y));
    applyGates();
    checkCrossZoneSafe();

    onTreadmill =
      player.x > treadmill.x - treadmill.w / 2 &&
      player.x < treadmill.x + treadmill.w / 2 &&
      player.y > treadmill.y - treadmill.h / 2 &&
      player.y < treadmill.y + treadmill.h / 2;

    const runInput = keys.KeyW || keys.ArrowUp || stick.dy < -0.25;
    treadmillRun = onTreadmill && runInput;
    if (onTreadmill) treadmillScroll += dt * (treadmillRun ? 140 : 35);
    if (treadmillRun && !paused) speedStat += treadmillGain() * dt;
  }

  function npcMoveToward(npc, tx, ty, spd, dt) {
    const d = dist(npc.x, npc.y, tx, ty);
    if (d < 8) return false;
    const step = spd * dt;
    npc.x += ((tx - npc.x) / d) * step;
    npc.y += ((ty - npc.y) / d) * step;
    return true;
  }

  function placeNpcEgg(npc) {
    const pens = pedestals.filter(function (p) {
      return p.zoneId === npc.zoneId && !p.egg;
    });
    if (pens.length && npc.carry) {
      pens[0].egg = eggFromType(npc.carry.typeId || npc.carry);
      npc.carry = null;
      return true;
    }
    npc.carry = null;
    return false;
  }

  function updateNpcs(dt) {
    if (lockUntil > performance.now()) return;

    rivals.forEach(function (npc) {
      const chaseSpd = npc.boss ? 210 : 175;

      if (npc.carry) {
        if (npcMoveToward(npc, npc.homeX, npc.homeY, 160, dt)) return;
        placeNpcEgg(npc);
        return;
      }

      if (
        npc.angry &&
        player.carry &&
        player.carry.fromZoneId === npc.zoneId &&
        player.carry.fromZoneId !== "shop"
      ) {
        const here = zoneAt(player.x, player.y);
        if (here && here.boss && here.id !== npc.zoneId) {
          npc.angry = false;
        } else {
          if (dist(npc.x, npc.y, player.x, player.y) < 28) {
            bossHitPlayer(npc);
          } else {
            npcMoveToward(npc, player.x, player.y, chaseSpd, dt);
          }
          return;
        }
      }

      npc.aiTimer -= dt;
      if (npc.aiTimer > 0) {
        if (Math.random() < 0.02) {
          npcMoveToward(npc, npc.homeX + (Math.random() - 0.5) * 80, npc.homeY + (Math.random() - 0.5) * 40, 90, dt);
        }
        return;
      }
      npc.aiTimer = 1.4 + Math.random() * 2;

      if (Math.random() < 0.45) {
        const myEggs = myPedestals().filter(function (p) {
          return p.egg;
        });
        if (myEggs.length) {
          const target = myEggs[Math.floor(Math.random() * myEggs.length)];
          if (npcMoveToward(npc, target.x, target.y, 130, dt)) return;
          npc.carry = target.egg.typeId;
          target.egg = null;
          showToast("😡 " + npc.name + " украл у тебя!");
          return;
        }
      }

      const otherZones = ZONE_DEFS.filter(function (z) {
        return z.boss && z.id !== npc.zoneId && zoneUnlocked(z);
      });
      if (otherZones.length && Math.random() < 0.6) {
        const zt = otherZones[Math.floor(Math.random() * otherZones.length)];
        const slots = pedestals.filter(function (p) {
          return p.zoneId === zt.id && p.egg;
        });
        if (slots.length) {
          const target = slots[Math.floor(Math.random() * slots.length)];
          if (npcMoveToward(npc, target.x, target.y, 120, dt)) return;
          const stolen = target.egg;
          target.egg = null;
          npc.carry = stolen.typeId;
          if (Math.random() < 0.35) showToast(npc.name + " ↔ " + zt.boss.name);
          return;
        }
      }

      npcMoveToward(npc, npc.homeX, npc.homeY, 100, dt);
    });
  }

  function update(dt) {
    if (paused) return;
    gameTime += dt;

    const nightNow = isNight();
    if (nightNow && !wasNight) triggerNightEvent();
    wasNight = nightNow;

    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      blinkTimer = BLINK_EVERY;
      triggerBlinkEvent();
    }
    if (blinkLeft > 0) {
      blinkLeft -= dt;
      if (blinkLeft <= 0 && eventBanner) {
        eventBanner.classList.remove("blink");
        eventBanner.classList.remove("show");
      }
    }
    if (hitFlash > 0) hitFlash -= dt;

    movePlayer(dt);
    updateNpcs(dt);
    pedestals.forEach((p) => {
      if (p.baseId === "mine" || p.egg) return;
      p.respawn += dt;
      if (p.respawn > 10) {
        p.egg = rollEggForZone(p.zoneId);
        p.respawn = 0;
      }
    });
    incomeTimer += dt;
    if (incomeTimer >= 1) {
      incomeTimer = 0;
      coins += incomePerSec();
      saveGame();
      refreshShop();
    }
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toastEl.classList.remove("show");
    }
    trailDots.forEach((d) => {
      d.life -= dt * 2.5;
    });
    trailDots = trailDots.filter((d) => d.life > 0);

    hudAcc += dt;
    if (hudAcc >= 0.15) {
      hudAcc = 0;
      updateHud(false);
      updatePrompt();
    }
  }

  function drawRoad(x1, y1, x2, y2) {
    if (!inView(Math.min(x1, x2) - 20, Math.min(y1, y2) - 20, Math.abs(x2 - x1) + 40, Math.abs(y2 - y1) + 40)) return;
    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 28;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = "#e8c9a0";
    ctx.lineWidth = 18;
    ctx.stroke();
  }

  function drawPetInPen(x, y, pet, sleeping) {
    if (!inView(x - 24, y - 24, 48, 48)) return;
    ctx.save();
    ctx.translate(x, y);
    if (sleeping) {
      ctx.globalAlpha = 0.5;
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("💤", 0, -20);
    }
    ctx.fillStyle = (pet.color || "#fff") + "55";
    ctx.fillRect(-16, -10, 32, 26);
    ctx.strokeStyle = pet.color || "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -10, 32, 26);
    ctx.globalAlpha = 1;
    ctx.font = "22px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(pet.emoji, 0, 8);
    ctx.font = "bold 8px system-ui";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeText(pet.name, 0, 22);
    ctx.fillText(pet.name, 0, 22);
    ctx.restore();
  }

  function drawTreadmill() {
    if (!inView(treadmill.x - treadmill.w / 2, treadmill.y - treadmill.h / 2, treadmill.w, treadmill.h)) return;
    const tx = treadmill.x - treadmill.w / 2;
    const ty = treadmill.y - treadmill.h / 2;
    ctx.fillStyle = treadmillRun ? "#fde68a" : onTreadmill ? "#e2e8f0" : "#94a3b8";
    ctx.fillRect(tx, ty, treadmill.w, treadmill.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(tx, ty, treadmill.w, treadmill.h);
    ctx.clip();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 4;
    for (let s = -30; s < treadmill.w + 30; s += 28) {
      const off = (s + treadmillScroll) % 28;
      ctx.beginPath();
      ctx.moveTo(tx + off, ty);
      ctx.lineTo(tx + off - 14, ty + treadmill.h);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = treadmillRun ? "#f59e0b" : onTreadmill ? "#fbbf24" : "#475569";
    ctx.lineWidth = treadmillRun ? 5 : 3;
    ctx.strokeRect(tx, ty, treadmill.w, treadmill.h);
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(treadmillRun ? "⚡ БЕЖИМ!" : "🏃 ДОРОЖКА — жми W", treadmill.x, treadmill.y + 5);
  }

  function drawEgg(x, y, egg, big) {
    if (!inView(x - 20, y - 20, 40, 40)) return;
    const sc = big ? 1.15 : 1;
    ctx.save();
    ctx.translate(x, y);
    if (egg.typeId === "dragon" || egg.typeId === "final" || egg.typeId === "epic") {
      ctx.shadowColor = egg.color;
      ctx.shadowBlur = 12;
    }
    ctx.scale(sc, sc);
    ctx.fillStyle = egg.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00000055";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = "15px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(egg.emoji, 0, 2);
    ctx.restore();
  }

  function drawCarriedPet(x, y, pet) {
    if (!inView(x - 20, y - 30, 40, 40)) return;
    ctx.font = (pet.typeId === "final" || pet.typeId === "dragon" ? "26" : "22") + "px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(pet.emoji, x, y);
    ctx.font = "bold 9px system-ui";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeText(pet.name, x, y + 14);
    ctx.fillText(pet.name, x, y + 14);
  }

  function drawCharacter(x, y, look, angry, isBoss, carryEgg) {
    if (!inView(x - 30, y - 30, 60, 60)) return;
    const w = 22;
    const h = 28;
    ctx.save();
    ctx.translate(x, y);
    if (angry) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = look.body;
    ctx.strokeStyle = look.outline;
    ctx.lineWidth = 2;
    ctx.fillRect(-w / 2, -4, w, h);
    ctx.strokeRect(-w / 2, -4, w, h);
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(0, -12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = look.outline;
    ctx.stroke();
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(angry ? "😡" : look.emoji, 0, -8);
    if (isBoss) {
      ctx.font = "11px system-ui";
      ctx.fillText("👑", 0, -26);
    }
    ctx.restore();
    if (carryEgg) {
      const eg = typeof carryEgg === "string" ? eggFromType(carryEgg) : carryEgg;
      drawCarriedPet(x, y - 32, eg);
    }
  }

  function drawPen(pen, mine, locked) {
    ctx.fillStyle = mine ? "rgba(34,197,94,0.18)" : "rgba(248,113,113,0.12)";
    ctx.fillRect(pen.x, pen.y, pen.w, pen.h);
    ctx.strokeStyle = mine ? (locked ? "#fde68a" : "#86efac") : "#fca5a5";
    ctx.lineWidth = mine && locked ? 4 : 3;
    ctx.strokeRect(pen.x, pen.y, pen.w, pen.h);
    ctx.fillStyle = mine ? "#86efac" : "#fecaca";
    [[pen.x, pen.y], [pen.x + pen.w, pen.y], [pen.x, pen.y + pen.h], [pen.x + pen.w, pen.y + pen.h]].forEach(function (c) {
      ctx.fillRect(c[0] - 3, c[1] - 3, 6, 6);
    });
    if (mine) {
      ctx.fillStyle = "#bbf7d0";
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("ВОЛЬЕР", pen.x + pen.w / 2, pen.y + pen.h - 4);
    }
  }

  function drawGate(g) {
    if (!inView(g.x, g.y, g.w, g.h)) return;
    const open = speedStat >= g.need;
    ctx.fillStyle = open ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.55)";
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = open ? "#86efac" : "#fca5a5";
    ctx.lineWidth = 3;
    ctx.strokeRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(open ? "✓" : "🔒", g.x + g.w / 2, g.y + g.h / 2 - 6);
    if (!open) {
      ctx.font = "9px system-ui";
      ctx.fillText("⚡" + formatNum(g.need), g.x + g.w / 2, g.y + g.h / 2 + 10);
    }
  }

  function drawZoneArea(zone) {
    if (!inView(zone.x, zone.y, zone.w, zone.h)) return;
    const locked = zone.isHome && lockUntil > performance.now();
    const closed = !zone.isHome && !zoneUnlocked(zone);
    ctx.fillStyle = (closed ? "#0f172a" : zone.fill) + (closed ? "cc" : "aa");
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = locked ? "#fde68a" : zone.boss && zone.boss.boss ? "#fde68a" : zone.stroke;
    ctx.lineWidth = zone.boss && zone.boss.boss ? 5 : 3;
    if (zone.boss && zone.boss.boss) {
      ctx.setLineDash([10, 6]);
    }
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.setLineDash([]);

    ctx.fillStyle = closed ? "#94a3b8" : "#fff";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText(zone.name, zone.x + zone.w / 2, zone.y + 22);
    ctx.fillText(zone.name, zone.x + zone.w / 2, zone.y + 22);

    if (zone.boss && !closed) {
      ctx.font = "bold 11px system-ui";
      ctx.fillStyle = zone.boss.color;
      ctx.fillText("👑 " + zone.boss.name + " · ⚡" + formatNum(zone.boss.speed), zone.x + zone.w / 2, zone.y + 42);
    }
    if (closed) {
      ctx.font = "10px system-ui";
      ctx.fillStyle = "#fca5a5";
      ctx.fillText("🔒 Нужно ⚡ " + formatNum(zone.needSpeed), zone.x + zone.w / 2, zone.y + 42);
    }

    zone.pens.forEach(function (pen) {
      const isMine = !!zone.isHome;
      if (isMine) {
        const idx = zone.pens.indexOf(pen);
        if (idx >= baseSlots) return;
      }
      drawPen(pen, isMine, locked);
    });
  }

  function drawMinimap() {
    const mx = VW - 130;
    const my = 72;
    const mw = 118;
    const mh = 78;
    ctx.fillStyle = "rgba(15,23,42,0.85)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("КАРТА", mx + 6, my + 12);

    function dot(wx, wy, col, sz) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(mx + (wx / MW) * mw, my + 14 + (wy / MH) * (mh - 18), sz || 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ZONE_DEFS.forEach(function (z) {
      dot(z.x + z.w / 2, z.y + z.h / 2, z.isHome ? "#22c55e" : z.boss && z.boss.boss ? "#fde68a" : z.stroke, z.boss && z.boss.boss ? 4 : 3);
    });
    dot(shop.x, shop.y, "#c084fc", 4);
    dot(player.x, player.y, "#38bdf8", 4);

    const vw = (VW / MW) * mw;
    const vh = (VH / MH) * (mh - 18);
    const vx = mx + (cam.x / MW) * mw;
    const vy = my + 14 + (cam.y / MH) * (mh - 18);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);
  }

  function draw() {
    if (!(keys.ShiftLeft || keys.ShiftRight)) {
      cam.x = Math.max(0, Math.min(MW - VW, player.x - VW / 2));
      cam.y = Math.max(0, Math.min(MH - VH, player.y - VH / 2));
    }

    const night = isNight();
    const vx = cam.x;
    const vy = cam.y;

    ctx.fillStyle = night ? "#0f172a" : "#1e293b";
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.translate(-vx, -vy);

    const sky = ctx.createLinearGradient(0, vy, 0, vy + VH);
    if (night) {
      sky.addColorStop(0, "#1e1b4b");
      sky.addColorStop(0.45, "#312e81");
      sky.addColorStop(1, "#166534");
    } else {
      sky.addColorStop(0, "#7dd3fc");
      sky.addColorStop(0.4, "#86efac");
      sky.addColorStop(1, "#22c55e");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(vx, vy, VW, VH);

    const grass = night ? grassTexNight : grassTexDay;
    if (grass) {
      ctx.fillStyle = grass;
      const x0 = Math.max(0, Math.floor(vx / 80) * 80);
      const x1 = Math.min(MW, vx + VW + 80);
      const y0 = Math.max(1400, Math.floor(vy / 80) * 80);
      const y1 = Math.min(MH, vy + VH + 80);
      for (let gx = x0; gx < x1; gx += 80) {
        for (let gy = y0; gy < y1; gy += 80) {
          ctx.fillRect(gx, gy, 80, 80);
        }
      }
    }

    if (vy < 1500) {
      ctx.fillStyle = night ? "#0c4a6e" : "#38bdf8";
      ctx.globalAlpha = 0.25;
      ctx.fillRect(vx, vy, VW, Math.min(1500 - vy, VH));
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < ZONE_DEFS.length - 1; i++) {
      const a = ZONE_DEFS[i];
      const b = ZONE_DEFS[i + 1];
      drawRoad(a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2);
    }

    GATES.forEach(drawGate);
    ZONE_DEFS.forEach(drawZoneArea);

    drawTreadmill();

    ctx.fillStyle = "rgba(168,85,247,0.4)";
    ctx.beginPath();
    ctx.arc(shop.x, shop.y, shop.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px system-ui";
    ctx.fillText("🛒 " + shop.label, shop.x, shop.y + 5);

    pedestals.forEach(function (p) {
      if (p.egg) drawPetInPen(p.x, p.y, p.egg, petSleeping(p));
    });

    trailDots.forEach(function (d) {
      ctx.globalAlpha = d.life * 0.7;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    rivals.forEach(function (npc) {
      drawCharacter(npc.x, npc.y, npc.look, npc.angry, npc.boss, npc.carry);
    });

    const rows = getIndex();
    if (rows[0] && rows[0].me) {
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawCharacter(player.x, player.y, CHAR_LOOK.player, false, false, null);
    if (player.carry) drawCarriedPet(player.x, player.y - 34, player.carry);

    if (hitFlash > 0) {
      ctx.fillStyle = "rgba(239,68,68," + hitFlash + ")";
      ctx.fillRect(vx, vy, VW, VH);
    }

    if (night) {
      ctx.fillStyle = "rgba(15,23,42,0.32)";
      ctx.fillRect(vx, vy, VW, VH);
    }

    if (blinkLeft > 0) {
      ctx.fillStyle = "rgba(251,191,36,0.08)";
      ctx.fillRect(vx, vy, VW, VH);
    }

    ctx.restore();
    drawMinimap();

    if (keys.ShiftLeft || keys.ShiftRight) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(VW / 2 - 90, 4, 180, 22);
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Shift+WASD — камера", VW / 2, 18);
    }
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE" || e.code === "Space") {
      e.preventDefault();
      doAction();
    }
    if (e.code === "F2") {
      e.preventDefault();
      if (adminPanel) adminPanel.hidden = !adminPanel.hidden;
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  btnLock.onclick = lockBase;
  actBtn.onclick = (e) => {
    e.preventDefault();
    doAction();
  };

  function bindStick(el) {
    el.addEventListener("pointerdown", (e) => {
      stick.active = true;
      stick.pid = e.pointerId;
      stick.ox = e.clientX;
      stick.oy = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!stick.active || e.pointerId !== stick.pid) return;
      let dx = e.clientX - stick.ox;
      let dy = e.clientY - stick.oy;
      const max = 40;
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      stick.dx = dx / max;
      stick.dy = dy / max;
    });
    function end(e) {
      if (e.pointerId !== stick.pid) return;
      stick.active = false;
      stick.dx = 0;
      stick.dy = 0;
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }
  bindStick(stickEl);

  function bindAdmin() {
    if (!adminPanel) return;
    const map = {
      admCoins: function () {
        coins += 10000;
        showToast("+10K монет");
        refreshShop();
      },
      admSpeed: function () {
        speedStat += 100000;
        showToast("+100K скорости");
        refreshShop();
      },
      admUnlock: function () {
        speedStat = Math.max(speedStat, 1e12);
        showToast("Все зоны открыты");
      },
      admNight: function () {
        triggerNightEvent();
      },
      admBlink: function () {
        triggerBlinkEvent();
      },
      admDragon: function () {
        if (!player.carry) player.carry = wrapCarry(eggFromType("dragon"), "admin");
        showToast("🐉 дракон в руках");
      },
      admHeal: function () {
        player.stunned = 0;
        player.hitCd = 0;
        rivals.forEach(function (r) {
          r.angry = false;
        });
        showToast("Ок!");
      },
    };
    Object.keys(map).forEach(function (id) {
      const btn = document.getElementById(id);
      if (btn) btn.onclick = map[id];
    });
  }
  bindAdmin();

  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (VW / rect.width);
    const sy = (e.clientY - rect.top) * (VH / rect.height);
    const mx = VW - 130;
    const my = 72;
    const mw = 118;
    const mh = 78;
    if (sx >= mx && sx <= mx + mw && sy >= my && sy <= my + mh) {
      const wx = ((sx - mx) / mw) * MW;
      const wy = ((sy - my - 14) / (mh - 18)) * MH;
      cam.x = Math.max(0, Math.min(MW - VW, wx - VW / 2));
      cam.y = Math.max(0, Math.min(MH - VH, wy - VH / 2));
    }
  });

  initTextures();
  initPedestals();
  loadGame();
  refreshShop();
  updateHud(true);
  setInterval(saveGame, 12000);

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
