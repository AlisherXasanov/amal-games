(() => {
  "use strict";

  const SAVE_KEY = "amal-steal-egg-v2";
  const VW = 960;
  const VH = 640;
  const MW = 1500;
  const MH = 1050;
  const DAY_SEC = 90;

  const EGG_TYPES = [
    { id: "basic", name: "Обычное", emoji: "🥚", color: "#f8fafc", price: 0, rate: 1, weight: 600 },
    { id: "gold", name: "Золотое", emoji: "🐣", color: "#fbbf24", price: 80, rate: 4, weight: 250 },
    { id: "rare", name: "Редкое", emoji: "💎", color: "#a855f7", price: 350, rate: 12, weight: 120 },
    { id: "epic", name: "Эпик", emoji: "🔮", color: "#6366f1", price: 1200, rate: 28, weight: 25 },
    { id: "dragon", name: "Дракон", emoji: "🐉", color: "#ef4444", price: 8000, rate: 70, weight: 4 },
    { id: "final", name: "ФИНАЛ", emoji: "👑", color: "#fde68a", price: 0, rate: 200, weight: 1 },
  ];

  /** Честные цены: после 500M идёт 1T, не 50T */
  const TRAILS = [
    { id: "none", name: "Без следа", mult: 1, price: 0, color: null },
    { id: "white", name: "Белый", mult: 1.5, price: 150, color: "#f8fafc" },
    { id: "gold", name: "Золотой", mult: 2, price: 900, color: "#fbbf24" },
    { id: "fire", name: "Огонь", mult: 3, price: 6000, color: "#f97316" },
    { id: "rain", name: "Радуга", mult: 5, price: 45000, color: "#a855f7" },
    { id: "cosmo", name: "Космо", mult: 8, price: 320000, color: "#38bdf8" },
    { id: "legend", name: "Легенда", mult: 12, price: 2.5e6, color: "#22d3ee" },
    { id: "myth", name: "Миф", mult: 20, price: 45e6, color: "#ec4899" },
    { id: "star", name: "Звезда", mult: 35, price: 500e6, color: "#fde68a" },
    { id: "final", name: "ФИНАЛЬНЫЙ", mult: 50, price: 1e12, color: "#fff" },
  ];

  const TREADMILL_LEVELS = [
    { price: 0, gain: 3, label: "Старт" },
    { price: 400, gain: 8, label: "Быстрая" },
    { price: 2200, gain: 22, label: "Спринт" },
    { price: 12000, gain: 65, label: "Мощная" },
    { price: 65000, gain: 200, label: "Тurbo" },
    { price: 380000, gain: 700, label: "Мега" },
    { price: 2.2e6, gain: 2500, label: "Гiga" },
    { price: 15e6, gain: 9000, label: "Ultra" },
    { price: 120e6, gain: 35000, label: "Hyper" },
    { price: 500e6, gain: 120000, label: "Max" },
    { price: 1e12, gain: 500000, label: "ФИНАЛ" },
  ];

  const LUCKY_PRICE = 250;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const coinsEl = document.getElementById("coins");
  const incomeEl = document.getElementById("income");
  const speedEl = document.getElementById("speedStat");
  const rankEl = document.getElementById("rankLabel");
  const carryEl = document.getElementById("carry");
  const statusEl = document.getElementById("status");
  const timeEl = document.getElementById("timeLabel");
  const indexList = document.getElementById("indexList");
  const toastEl = document.getElementById("toast");
  const promptEl = document.getElementById("prompt");
  const btnLock = document.getElementById("btnLock");
  const stickEl = document.getElementById("stick");
  const actBtn = document.getElementById("actBtn");

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
  let toastTimer = 0;
  let incomeTimer = 0;
  let npcTimer = 0;
  let gameTime = 0;
  let onTreadmill = false;
  let trailDots = [];

  const keys = {};
  const stick = { active: false, dx: 0, dy: 0, ox: 0, oy: 0, pid: null };

  const player = { x: 240, y: 860, r: 16, carry: null, color: "#38bdf8" };

  const bases = [
    { id: "mine", name: "Твоя база", x: 240, y: 860, r: 95, color: "#22c55e", border: "#86efac" },
    { id: "red", name: "Сосед", x: 1220, y: 180, r: 78, color: "#ef4444", border: "#fca5a5" },
    { id: "blue", name: "Рик", x: 240, y: 180, r: 78, color: "#3b82f6", border: "#93c5fd" },
    { id: "orange", name: "Катя", x: 1220, y: 820, r: 78, color: "#f97316", border: "#fdba74" },
  ];

  const shop = { x: MW / 2, y: MH / 2 - 30, r: 72 };
  const treadmill = { x: 420, y: 860, w: 140, h: 55 };
  const signs = [
    { x: shop.x, y: shop.y - 95, title: "🛒 МАГАЗИН", lines: ["Яйца · Lucky · Следы"] },
    { x: treadmill.x, y: treadmill.y - 72, title: "🏃 ДОРОЖКА", lines: ["Стань сюда — качай ⚡"] },
    { x: 240, y: 720, title: "📊 ИНДЕКС", lines: ["Кто сильнее — тот босс"] },
  ];

  const pedestals = [];

  const rivals = [
    { name: "Сосед-бот", speed: 800000, color: "#fca5a5", x: 1220, y: 180, carry: null },
    { name: "Рик-бот", speed: 150000000, color: "#93c5fd", x: 240, y: 180, carry: null },
    { name: "Катя-бот", speed: 2000000, color: "#fdba74", x: 1220, y: 820, carry: null },
  ];

  function formatNum(n) {
    n = Number(n) || 0;
    if (n >= 1e12) return (n / 1e12).toFixed(n >= 10e12 ? 0 : 1).replace(/\.0$/, "") + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(n >= 10e9 ? 0 : 1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 10e6 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return (n / 1e3).toFixed(0) + "K";
    return Math.floor(n).toLocaleString("ru-RU");
  }

  function trailMult() {
    const t = TRAILS.find((x) => x.id === trailId);
    return t ? t.mult : 1;
  }

  function treadmillGain() {
    return (TREADMILL_LEVELS[treadmillLv] || TREADMILL_LEVELS[0]).gain * trailMult();
  }

  function moveSpeed() {
    const base = 2.8 + Math.log10(Math.max(10, speedStat)) * 1.6;
    return base * (player.carry ? 0.62 : 1);
  }

  function powerScore(speed, mult, inc) {
    return speed * mult * (1 + inc / 50);
  }

  function playerPower() {
    return powerScore(speedStat, trailMult(), incomePerSec());
  }

  function isNight() {
    return (gameTime % (DAY_SEC * 2)) >= DAY_SEC;
  }

  function eggFromType(typeId) {
    const t = EGG_TYPES.find((e) => e.id === typeId) || EGG_TYPES[0];
    return { typeId: t.id, name: t.name, emoji: t.emoji, color: t.color, rate: t.rate };
  }

  function rollEggLucky() {
    const pool = EGG_TYPES.filter((e) => e.id !== "final" || speedStat >= 1e6);
    let total = 0;
    pool.forEach((e) => {
      total += e.weight;
    });
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) return eggFromType(pool[i].id);
    }
    return eggFromType("basic");
  }

  function rollEnemyEgg() {
    return rollEggLucky();
  }

  function initPedestals() {
    pedestals.length = 0;
    bases.forEach((base) => {
      const slots = base.id === "mine" ? baseSlots : 2;
      for (let i = 0; i < slots; i++) {
        const ang = (i / slots) * Math.PI * 2 - Math.PI / 2;
        const dist = base.id === "mine" ? 58 : 48;
        pedestals.push({
          x: base.x + Math.cos(ang) * dist,
          y: base.y + Math.sin(ang) * dist,
          baseId: base.id,
          egg: null,
        });
      }
    });
    pedestals.forEach((p) => {
      if (p.baseId !== "mine") p.egg = rollEnemyEgg();
    });
  }

  function rebuildMySlots() {
    const mineEggs = pedestals.filter((p) => p.baseId === "mine").map((p) => p.egg);
    for (let i = pedestals.length - 1; i >= 0; i--) {
      if (pedestals[i].baseId === "mine") pedestals.splice(i, 1);
    }
    const mine = bases[0];
    for (let i = 0; i < baseSlots; i++) {
      const ang = (i / baseSlots) * Math.PI * 2 - Math.PI / 2;
      pedestals.push({
        x: mine.x + Math.cos(ang) * 58,
        y: mine.y + Math.sin(ang) * 58,
        baseId: "mine",
        egg: mineEggs[i] || null,
      });
    }
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
          gameTime,
          eggs: pedestals.filter((p) => p.baseId === "mine").map((p) => (p.egg ? p.egg.typeId : null)),
        })
      );
    } catch (_) {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.coins != null) coins = d.coins;
      if (d.speedStat != null) speedStat = d.speedStat;
      if (d.treadmillLv != null) treadmillLv = d.treadmillLv;
      if (d.trailId != null) trailId = d.trailId;
      if (d.baseSlots != null) baseSlots = d.baseSlots;
      if (d.lockBonus != null) lockBonus = d.lockBonus;
      if (d.gameTime != null) gameTime = d.gameTime;
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

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    toastTimer = 2.4;
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function myPedestals() {
    return pedestals.filter((p) => p.baseId === "mine");
  }

  function incomePerSec() {
    const mult = isNight() ? 1.12 : 1;
    return myPedestals().reduce((s, p) => s + (p.egg ? p.egg.rate : 0), 0) * mult;
  }

  function getIndex() {
    const rows = [
      { name: "ТЫ", speed: speedStat, power: playerPower(), me: true },
      ...rivals.map((r) => ({
        name: r.name,
        speed: r.speed * (isNight() ? 0.85 : 1),
        power: powerScore(r.speed, 1, 0),
        me: false,
      })),
    ];
    rows.sort((a, b) => b.power - a.power);
    return rows;
  }

  function updateIndexUi() {
    const rows = getIndex();
    indexList.innerHTML = "";
    rows.forEach((row, i) => {
      const li = document.createElement("li");
      li.textContent = i + 1 + ". " + row.name + " · " + formatNum(row.speed);
      if (row.me) li.className = "me";
      indexList.appendChild(li);
    });
    const myRank = rows.findIndex((r) => r.me) + 1;
    if (myRank === 1) {
      rankEl.textContent = "👑 ФИНАЛЬНЫЙ БОСС";
      rankEl.className = "rank final";
    } else {
      rankEl.textContent = "Индекс: #" + myRank;
      rankEl.className = "rank";
    }
  }

  function updateHud() {
    coinsEl.textContent = formatNum(coins);
    incomeEl.textContent = formatNum(incomePerSec());
    speedEl.textContent = formatNum(speedStat);
    carryEl.textContent = player.carry
      ? "В руках: " + player.carry.emoji + " " + player.carry.name
      : "В руках: пусто";
    timeEl.textContent = isNight() ? "🌙 Ночь (+12% доход)" : "☀️ День";
    const lockLeft = Math.max(0, lockUntil - performance.now());
    btnLock.disabled = lockLeft > 0;
    btnLock.textContent = lockLeft > 0 ? "🔒 " + Math.ceil(lockLeft / 1000) + "с" : "🔒 База";
    updateIndexUi();
  }

  function nearestPedestal(x, y, filter) {
    let best = null;
    let bestD = 999;
    pedestals.forEach((p) => {
      if (filter && !filter(p)) return;
      const d = dist(x, y, p.x, p.y);
      if (d < 44 && d < bestD) {
        bestD = d;
        best = p;
      }
    });
    return best;
  }

  function buyEgg(typeId) {
    const t = EGG_TYPES.find((e) => e.id === typeId);
    if (!t || t.id === "final") return;
    if (player.carry) {
      showToast("Сначала поставь яйцо (E)");
      return;
    }
    if (coins < t.price) {
      showToast("Мало монет 🪙");
      return;
    }
    coins -= t.price;
    player.carry = eggFromType(typeId);
    showToast("Купил: " + t.emoji + " " + t.name);
    saveGame();
    refreshShop();
    updateHud();
  }

  function buyLucky() {
    if (player.carry) {
      showToast("Руки заняты");
      return;
    }
    if (coins < LUCKY_PRICE) {
      showToast("Нужно " + LUCKY_PRICE + " 🪙");
      return;
    }
    coins -= LUCKY_PRICE;
    const egg = rollEggLucky();
    player.carry = egg;
    showToast(egg.emoji + " Lucky: " + egg.name + "!");
    saveGame();
    refreshShop();
    updateHud();
  }

  function buyTrail(id) {
    const t = TRAILS.find((x) => x.id === id);
    if (!t || trailId === id) return;
    if (coins < t.price) {
      showToast("Нужно " + formatNum(t.price) + " 🪙");
      return;
    }
    coins -= t.price;
    trailId = id;
    showToast("След: " + t.name + " x" + t.mult);
    saveGame();
    refreshShop();
    updateHud();
  }

  function upgradeTreadmill() {
    const next = treadmillLv + 1;
    if (next >= TREADMILL_LEVELS.length) return;
    const cost = TREADMILL_LEVELS[next].price;
    if (coins < cost) {
      showToast("Нужно " + formatNum(cost) + " 🪙");
      return;
    }
    coins -= cost;
    treadmillLv = next;
    showToast("Дорожка: " + TREADMILL_LEVELS[next].label);
    saveGame();
    refreshShop();
    updateHud();
  }

  function buyBaseSlot() {
    if (baseSlots >= 8) return;
    const cost = 180 + baseSlots * 120;
    if (coins < cost) {
      showToast("Нужно " + formatNum(cost) + " 🪙");
      return;
    }
    coins -= cost;
    baseSlots++;
    rebuildMySlots();
    showToast("Слот +" + baseSlots);
    saveGame();
    refreshShop();
    updateHud();
  }

  function buyLockUpgrade() {
    if (lockBonus >= 3) return;
    const cost = 220 * (lockBonus + 1);
    if (coins < cost) return;
    coins -= cost;
    lockBonus++;
    showToast("Замок +" + (5 * lockBonus) + " сек");
    saveGame();
    refreshShop();
  }

  function tryPlace() {
    if (!player.carry) return false;
    const slot = nearestPedestal(player.x, player.y, (p) => p.baseId === "mine" && !p.egg);
    if (!slot) return false;
    slot.egg = player.carry;
    player.carry = null;
    showToast("На базе! +" + slot.egg.rate + "/с");
    saveGame();
    return true;
  }

  function trySteal() {
    if (player.carry) return false;
    const slot = nearestPedestal(player.x, player.y, (p) => p.baseId !== "mine" && p.egg);
    if (!slot) return false;
    player.carry = slot.egg;
    slot.egg = null;
    showToast("Украл " + player.carry.emoji + "! Домой!");
    return true;
  }

  function tryPickupOwn() {
    if (player.carry) return false;
    const slot = nearestPedestal(player.x, player.y, (p) => p.baseId === "mine" && p.egg);
    if (!slot) return false;
    player.carry = slot.egg;
    slot.egg = null;
    showToast("Взял яйцо");
    saveGame();
    return true;
  }

  function doAction() {
    if (tryPlace()) return;
    if (trySteal()) return;
    if (tryPickupOwn()) return;
    showToast("Подойди к яйцу или слоту (E)");
  }

  function lockBase() {
    if (lockUntil > performance.now()) return;
    lockUntil = performance.now() + (12000 + lockBonus * 5000);
    showToast("База закрыта 🔒");
    updateHud();
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
        (t.price ? formatNum(t.price) + " 🪙" : "бесплатно") +
        " · +" +
        t.rate +
        "/с</span></button>";
    });
    eggs += "</div>";
    paneHtml("eggs", eggs);
    panes.eggs.querySelectorAll("[data-egg]").forEach((btn) => {
      btn.addEventListener("click", () => buyEgg(btn.dataset.egg));
    });

    const lv = TREADMILL_LEVELS[treadmillLv];
    const next = TREADMILL_LEVELS[treadmillLv + 1];
    paneHtml(
      "lucky",
      '<div class="shop-row">' +
        '<button type="button"' +
        (coins < LUCKY_PRICE || player.carry ? " disabled" : "") +
        ' id="btnLucky">🎰 Lucky яйцо<span class="price">' +
        LUCKY_PRICE +
        " 🪙 · редкое почти не падает</span></button>" +
        (next
          ? '<button type="button"' +
            (coins < next.price ? " disabled" : "") +
            ' id="btnTmill">🏃 Дорожка → ' +
            next.label +
            '<span class="price">' +
            formatNum(next.price) +
            " 🪙 · +" +
            formatNum(next.gain) +
            "/с на дорожке</span></button>"
          : '<button type="button" disabled>Дорожка MAX</button>') +
        "</div>" +
        '<p class="shop-hint">Сейчас на дорожке: +' +
        formatNum(treadmillGain()) +
        " ⚡/сек · уровень «" +
        lv.label +
        "»</p>" +
        '<p class="shop-hint">Lucky: обычное 60% · золото 25% · редкое 12% · эпик 2.5% · дракон 0.4% · ФИНАЛ 0.1%</p>"
    );
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
        '">' +
        (t.id === "none" ? "—" : "👣") +
        " " +
        t.name +
        '<span class="price">x' +
        t.mult +
        " · " +
        (t.price ? formatNum(t.price) + " 🪙" : "бесплатно") +
        "</span></button>";
    });
    tr += "</div>";
    paneHtml("trail", tr);
    panes.trail.querySelectorAll("[data-tr]").forEach((btn) => {
      btn.addEventListener("click", () => buyTrail(btn.dataset.tr));
    });

    const slotCost = 180 + baseSlots * 120;
    paneHtml(
      "base",
      '<div class="shop-row">' +
        '<button type="button"' +
        (baseSlots >= 8 || coins < slotCost ? " disabled" : "") +
        ' id="btnSlot">+ слот (' +
        baseSlots +
        "/8)<span class=\"price\">" +
        formatNum(slotCost) +
        " 🪙</span></button>" +
        '<button type="button"' +
        (lockBonus >= 3 || coins < 220 * (lockBonus + 1) ? " disabled" : "") +
        ' id="btnLockUp">Замок дольше<span class="price">' +
        formatNum(220 * (lockBonus + 1)) +
        " 🪙</span></button>" +
        "</div>" +
        '<p class="shop-hint">База дешевле чем в Roblox — качай постепенно</p>'
    );
    document.getElementById("btnSlot").onclick = buyBaseSlot;
    document.getElementById("btnLockUp").onclick = buyLockUpgrade;
  }

  document.querySelectorAll(".shop-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".shop-tabs .tab").forEach((t) => t.classList.remove("on"));
      document.querySelectorAll(".shop-pane").forEach((p) => p.classList.remove("on"));
      tab.classList.add("on");
      panes[tab.dataset.tab].classList.add("on");
    });
  });

  function updatePrompt() {
    let text = "";
    if (onTreadmill) text = "🏃 Качаешь скорость +" + formatNum(treadmillGain()) + "/с";
    else if (player.carry) {
      if (nearestPedestal(player.x, player.y, (p) => p.baseId === "mine" && !p.egg)) text = "E — на базу";
    } else {
      const steal = nearestPedestal(player.x, player.y, (p) => p.baseId !== "mine" && p.egg);
      if (steal) text = "E — украсть " + steal.egg.emoji;
    }
    promptEl.style.display = text ? "block" : "none";
    promptEl.textContent = text;
  }

  function movePlayer(dt) {
    let mx = 0;
    let my = 0;
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
      const sp = moveSpeed() * dt * 60;
      player.x += (mx / len) * sp;
      player.y += (my / len) * sp;
      const tr = TRAILS.find((t) => t.id === trailId);
      if (tr && tr.color) {
        trailDots.push({ x: player.x, y: player.y, life: 1, color: tr.color });
        if (trailDots.length > 40) trailDots.shift();
      }
    }
    player.x = Math.max(24, Math.min(MW - 24, player.x));
    player.y = Math.max(24, Math.min(MH - 24, player.y));

    onTreadmill =
      player.x > treadmill.x - treadmill.w / 2 &&
      player.x < treadmill.x + treadmill.w / 2 &&
      player.y > treadmill.y - treadmill.h / 2 &&
      player.y < treadmill.y + treadmill.h / 2;
    if (onTreadmill) speedStat += treadmillGain() * dt;
  }

  function updateRivals(dt) {
    npcTimer -= dt;
    if (npcTimer > 0) return;
    npcTimer = 3 + Math.random() * 2;
    if (lockUntil > performance.now()) return;

    rivals.forEach((npc) => {
      if (npc.carry) {
        const home = bases[1];
        const d = dist(npc.x, npc.y, home.x, home.y);
        if (d > 40) {
          const dx = home.x - npc.x;
          const dy = home.y - npc.y;
          const l = Math.hypot(dx, dy) || 1;
          npc.x += (dx / l) * 2 * dt * 60;
          npc.y += (dy / l) * 2 * dt * 60;
        } else {
          npc.carry = null;
          showToast(npc.name + " унёс яйцо!");
        }
        return;
      }
      const slots = myPedestals().filter((p) => p.egg);
      if (!slots.length || Math.random() > 0.35) return;
      const target = slots[Math.floor(Math.random() * slots.length)];
      const d = dist(npc.x, npc.y, target.x, target.y);
      if (d > 45) {
        const dx = target.x - npc.x;
        const dy = target.y - npc.y;
        const l = Math.hypot(dx, dy) || 1;
        npc.x += (dx / l) * 2.2 * dt * 60;
        npc.y += (dy / l) * 2.2 * dt * 60;
      } else {
        npc.carry = target.egg;
        target.egg = null;
        showToast("⚠️ " + npc.name + " украл!");
      }
    });
  }

  function respawnEnemyEggs(dt) {
    pedestals.forEach((p) => {
      if (p.baseId === "mine" || p.egg) return;
      p.respawn = (p.respawn || 0) + dt;
      if (p.respawn > 8) {
        p.egg = rollEnemyEgg();
        p.respawn = 0;
      }
    });
  }

  function update(dt) {
    gameTime += dt;
    movePlayer(dt);
    updateRivals(dt);
    respawnEnemyEggs(dt);

    incomeTimer += dt;
    if (incomeTimer >= 1) {
      incomeTimer -= 1;
      coins += incomePerSec();
      saveGame();
      refreshShop();
    }
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toastEl.classList.remove("show");
    }
    trailDots.forEach((d) => {
      d.life -= dt * 2;
    });
    trailDots = trailDots.filter((d) => d.life > 0);

    updateHud();
    updatePrompt();
  }

  const cam = { x: 0, y: 0 };

  function drawEgg(x, y, egg, scale) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = egg.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(egg.emoji, 0, 1);
    ctx.restore();
  }

  function drawSign(s) {
    ctx.fillStyle = "rgba(15,23,42,0.88)";
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 2;
    const w = 150;
    const h = 52 + s.lines.length * 14;
    ctx.fillRect(s.x - w / 2, s.y - h / 2, w, h);
    ctx.strokeRect(s.x - w / 2, s.y - h / 2, w, h);
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(s.title, s.x, s.y - h / 2 + 16);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "10px system-ui";
    s.lines.forEach((line, i) => {
      ctx.fillText(line, s.x, s.y - h / 2 + 32 + i * 14);
    });
  }

  function draw() {
    cam.x = Math.max(0, Math.min(MW - VW, player.x - VW / 2));
    cam.y = Math.max(0, Math.min(MH - VH, player.y - VH / 2));
    const night = isNight();

    ctx.fillStyle = night ? "#1e293b" : "#4ade80";
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    if (night) ctx.globalAlpha = 0.72;

    for (let gx = 0; gx < MW; gx += 40) {
      for (let gy = 0; gy < MH; gy += 40) {
        ctx.fillStyle = night
          ? (gx + gy) % 80 === 0
            ? "#14532d"
            : "#166534"
          : (gx + gy) % 80 === 0
            ? "#22c55e"
            : "#4ade80";
        ctx.fillRect(gx, gy, 40, 40);
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = night ? "rgba(30,58,95,0.5)" : "rgba(168,85,247,0.22)";
    ctx.beginPath();
    ctx.arc(shop.x, shop.y, shop.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.fillRect(treadmill.x - treadmill.w / 2, treadmill.y - treadmill.h / 2, treadmill.w, treadmill.h);
    ctx.strokeStyle = onTreadmill ? "#fde68a" : "#94a3b8";
    ctx.lineWidth = onTreadmill ? 4 : 2;
    ctx.strokeRect(treadmill.x - treadmill.w / 2, treadmill.y - treadmill.h / 2, treadmill.w, treadmill.h);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🏃 ДОРОЖКА", treadmill.x, treadmill.y + 4);

    signs.forEach(drawSign);

    bases.forEach((base) => {
      const locked = base.id === "mine" && lockUntil > performance.now();
      ctx.fillStyle = base.color + (night ? "44" : "55");
      ctx.beginPath();
      ctx.arc(base.x, base.y, base.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = locked ? "#fde68a" : base.border;
      ctx.lineWidth = locked ? 5 : 3;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(base.name + (locked ? " 🔒" : ""), base.x, base.y - base.r - 10);
    });

    pedestals.forEach((p) => {
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();
      if (p.egg) drawEgg(p.x, p.y - 18, p.egg);
    });

    trailDots.forEach((d) => {
      ctx.globalAlpha = d.life * 0.6;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    rivals.forEach((npc) => {
      ctx.fillStyle = npc.color;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, 14, 0, Math.PI * 2);
      ctx.fill();
      if (npc.carry) drawEgg(npc.x, npc.y - 28, npc.carry, 0.85);
    });

    const rows = getIndex();
    if (rows[0] && rows[0].me) {
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    if (player.carry) drawEgg(player.x, player.y - 32, player.carry);

    if (night) {
      ctx.fillStyle = "rgba(15,23,42,0.35)";
      ctx.fillRect(cam.x, cam.y, VW, VH);
    }

    ctx.restore();
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE" || e.code === "Space") {
      e.preventDefault();
      doAction();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  btnLock.addEventListener("click", lockBase);
  actBtn.addEventListener("click", (e) => {
    e.preventDefault();
    doAction();
  });

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
      const max = 42;
      const len = Math.hypot(dx, dy);
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

  initPedestals();
  loadGame();
  refreshShop();
  updateHud();
  statusEl.textContent = "Дорожка у базы · индекс справа · стань ФИНАЛЬНЫМ";
  setInterval(saveGame, 15000);

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
