(() => {
  "use strict";

  const SAVE_KEY = "amal-steal-egg-v4";
  const VW = 960;
  const VH = 640;
  const MW = 2400;
  const MH = 1800;

  const EGG_TYPES = [
    { id: "basic", name: "Обычное", emoji: "🥚", color: "#fff", price: 0, rate: 1, weight: 620 },
    { id: "gold", name: "Золотое", emoji: "🐣", color: "#fbbf24", price: 80, rate: 4, weight: 240 },
    { id: "rare", name: "Редкое", emoji: "💎", color: "#a855f7", price: 350, rate: 12, weight: 110 },
    { id: "epic", name: "Эпик", emoji: "🔮", color: "#6366f1", price: 1200, rate: 28, weight: 24 },
    { id: "dragon", name: "Дракон", emoji: "🐉", color: "#ef4444", price: 8000, rate: 70, weight: 5 },
    { id: "final", name: "ФИНАЛ", emoji: "👑", color: "#fde68a", price: 0, rate: 200, weight: 1 },
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
  const DAY_SEC = 90;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const coinsEl = document.getElementById("coins");
  const incomeEl = document.getElementById("income");
  const speedEl = document.getElementById("speedStat");
  const rankEl = document.getElementById("rankLabel");
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
  let npcTimer = 0;
  let trailDots = [];
  let paused = true;

  const keys = {};
  const stick = { active: false, dx: 0, dy: 0, ox: 0, oy: 0, pid: null };

  const player = { x: 280, y: 1550, r: 14, carry: null, color: "#38bdf8" };
  const cam = { x: 0, y: 0 };

  /** 8 боссов + твоя база — большая карта как в Roblox */
  const BOSS_DEFS = [
    { id: "nub", name: "НУБ", speed: 5000, fill: "#94a3b8", stroke: "#cbd5e1", x: 700, y: 1300, r: 52, slots: 2 },
    { id: "neighbor", name: "СОСЕД", speed: 800000, fill: "#ef4444", stroke: "#fca5a5", x: 1950, y: 1400, r: 58, slots: 2 },
    { id: "katya", name: "КАТЯ", speed: 2000000, fill: "#f97316", stroke: "#fdba74", x: 1950, y: 450, r: 58, slots: 2 },
    { id: "rick", name: "РИК", speed: 150000000, fill: "#3b82f6", stroke: "#93c5fd", x: 450, y: 450, r: 58, slots: 2 },
    { id: "erox", name: "ЕРОКС", speed: 500000000, fill: "#a855f7", stroke: "#d8b4fe", x: 350, y: 1450, r: 62, slots: 3 },
    { id: "dragon", name: "ДРАКОН", speed: 2000000000, fill: "#b91c1c", stroke: "#fca5a5", x: 2100, y: 900, r: 65, slots: 3 },
    { id: "legend", name: "ЛЕГЕНДА", speed: 8000000000, fill: "#0891b2", stroke: "#67e8f9", x: 1200, y: 1650, r: 60, slots: 2 },
    { id: "final", name: "👑 ФИНАЛ", speed: 50000000000, fill: "#eab308", stroke: "#fde68a", x: 1200, y: 220, r: 78, slots: 3, boss: true },
  ];

  const bases = [
    { id: "mine", name: "ТВОЯ БАЗА", x: 280, y: 1550, r: 76, fill: "#22c55e", stroke: "#86efac", slots: 0 },
  ].concat(
    BOSS_DEFS.map(function (b) {
      return {
        id: b.id,
        name: b.name,
        x: b.x,
        y: b.y,
        r: b.r,
        fill: b.fill,
        stroke: b.stroke,
        slots: b.slots,
        boss: !!b.boss,
      };
    })
  );

  const shop = { x: 1200, y: 900, r: 62, label: "МАГАЗИН" };
  const treadmill = { x: 480, y: 1550, w: 120, h: 52, label: "ДОРОЖКА" };

  const rivals = BOSS_DEFS.map(function (b) {
    return {
      name: b.name,
      speed: b.speed,
      color: b.stroke,
      x: b.x,
      y: b.y,
      homeX: b.x,
      homeY: b.y,
      carry: null,
      boss: !!b.boss,
    };
  });

  const pedestals = [];

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
    return (2.6 + Math.log10(Math.max(10, speedStat)) * 1.4) * (player.carry ? 0.65 : 1);
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

  function initPedestals() {
    pedestals.length = 0;
    bases.forEach(function (base) {
      const slots = base.id === "mine" ? baseSlots : base.slots || 2;
      for (let i = 0; i < slots; i++) {
        const ang = (i / slots) * Math.PI * 2 - Math.PI / 2;
        const dist = base.id === "mine" ? 48 : base.r * 0.55;
        pedestals.push({
          x: base.x + Math.cos(ang) * dist,
          y: base.y + Math.sin(ang) * dist,
          baseId: base.id,
          egg: null,
          respawn: 0,
        });
      }
    });
    pedestals.forEach(function (p) {
      if (p.baseId === "mine") return;
      p.egg = p.baseId === "final" ? eggFromType("dragon") : rollEggLucky();
    });
  }

  function rebuildMySlots() {
    const eggs = pedestals.filter((p) => p.baseId === "mine").map((p) => p.egg);
    for (let i = pedestals.length - 1; i >= 0; i--) {
      if (pedestals[i].baseId === "mine") pedestals.splice(i, 1);
    }
    const mine = bases[0];
    for (let i = 0; i < baseSlots; i++) {
      const ang = (i / baseSlots) * Math.PI * 2 - Math.PI / 2;
      pedestals.push({
        x: mine.x + Math.cos(ang) * 46,
        y: mine.y + Math.sin(ang) * 46,
        baseId: "mine",
        egg: eggs[i] || null,
        respawn: 0,
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
          tut: tutorial.hidden,
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
    const m = isNight() ? 1.12 : 1;
    return myPedestals().reduce((s, p) => s + (p.egg ? p.egg.rate : 0), 0) * m;
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

  function updateHud() {
    coinsEl.textContent = formatNum(coins);
    incomeEl.innerHTML = "+" + formatNum(incomePerSec()) + '/сек · ⚡ <span id="speedStat">' + formatNum(speedStat) + "</span>";
    carryEl.textContent = player.carry
      ? "В руках: " + player.carry.emoji + " " + player.carry.name
      : "В руках: пусто";
    timeEl.textContent = isNight() ? "🌙 Ночь +12%" : "☀️ День";

    const rows = getIndex();
    indexList.innerHTML = "";
    rows.forEach((row, i) => {
      const li = document.createElement("li");
      li.textContent = i + 1 + ". " + row.name + " " + formatNum(row.speed);
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
    player.carry = eggFromType(typeId);
    showToast("Купил " + t.emoji);
    saveGame();
    refreshShop();
    updateHud();
  }

  function buyLucky() {
    if (player.carry || coins < LUCKY_PRICE) return;
    coins -= LUCKY_PRICE;
    player.carry = rollEggLucky();
    showToast("Lucky: " + player.carry.emoji + " " + player.carry.name);
    saveGame();
    refreshShop();
    updateHud();
  }

  function buyTrail(id) {
    const t = TRAILS.find((x) => x.id === id);
    if (!t || trailId === id || coins < t.price) return;
    coins -= t.price;
    trailId = id;
    showToast("След: " + t.name);
    saveGame();
    refreshShop();
    updateHud();
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
    updateHud();
  }

  function buyBaseSlot() {
    const cost = 150 + baseSlots * 100;
    if (baseSlots >= 8 || coins < cost) return;
    coins -= cost;
    baseSlots++;
    rebuildMySlots();
    showToast("Слот " + baseSlots + "/8");
    saveGame();
    refreshShop();
    updateHud();
  }

  function tryPlace() {
    if (!player.carry) return false;
    const slot = nearestPedestal((p) => p.baseId === "mine" && !p.egg);
    if (!slot) return false;
    slot.egg = player.carry;
    player.carry = null;
    showToast("На базе! +" + slot.egg.rate + "/с");
    saveGame();
    return true;
  }

  function trySteal() {
    if (player.carry) return false;
    const slot = nearestPedestal((p) => p.baseId !== "mine" && p.egg);
    if (!slot) return false;
    player.carry = slot.egg;
    slot.egg = null;
    showToast("Украл! Беги домой!");
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
    lucky += '<p class="shop-hint">Lucky: обыч 62% · золото 24% · редк 11% · эпик 2% · дракон 0.8%</p>';
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
        ">+ слот " +
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
    saveGame();
  };

  function updatePrompt() {
    let t = "";
    if (onTreadmill) t = "🏃 Качаешь +" + formatNum(treadmillGain()) + "/с";
    else if (player.carry && nearestPedestal((p) => p.baseId === "mine" && !p.egg)) t = "E — на базу";
    else if (!player.carry && nearestPedestal((p) => p.baseId !== "mine" && p.egg)) t = "E — украсть!";
    promptEl.style.display = t ? "block" : "none";
    promptEl.textContent = t;
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
        if (trailDots.length > 30) trailDots.shift();
      }
    }
    player.x = Math.max(24, Math.min(MW - 24, player.x));
    player.y = Math.max(24, Math.min(MH - 24, player.y));

    onTreadmill =
      player.x > treadmill.x - treadmill.w / 2 &&
      player.x < treadmill.x + treadmill.w / 2 &&
      player.y > treadmill.y - treadmill.h / 2 &&
      player.y < treadmill.y + treadmill.h / 2;
    if (onTreadmill && !paused) speedStat += treadmillGain() * dt;
  }

  function updateNpcs(dt) {
    npcTimer -= dt;
    if (npcTimer > 0 || lockUntil > performance.now()) return;
    npcTimer = 2.2;
    rivals.forEach(function (npc) {
      if (npc.carry) {
        const d = dist(npc.x, npc.y, npc.homeX, npc.homeY);
        if (d > 36) {
          npc.x += ((npc.homeX - npc.x) / d) * (npc.boss ? 2.8 : 2) * dt * 60;
          npc.y += ((npc.homeY - npc.y) / d) * (npc.boss ? 2.8 : 2) * dt * 60;
        } else {
          npc.carry = null;
        }
        return;
      }
      const slots = myPedestals().filter(function (p) {
        return p.egg;
      });
      if (!slots.length) return;
      const chance = npc.boss ? 0.55 : 0.32;
      if (Math.random() > chance) return;
      const target = slots[Math.floor(Math.random() * slots.length)];
      const d = dist(npc.x, npc.y, target.x, target.y);
      const spd = npc.boss ? 2.6 : 2;
      if (d > 40) {
        npc.x += ((target.x - npc.x) / d) * spd * dt * 60;
        npc.y += ((target.y - npc.y) / d) * spd * dt * 60;
      } else {
        npc.carry = target.egg;
        target.egg = null;
        showToast((npc.boss ? "👑 " : "") + npc.name + " украл!");
      }
    });
  }

  function update(dt) {
    if (paused) return;
    gameTime += dt;
    movePlayer(dt);
    updateNpcs(dt);
    pedestals.forEach((p) => {
      if (p.baseId === "mine" || p.egg) return;
      p.respawn += dt;
      if (p.respawn > 10) {
        p.egg = rollEggLucky();
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
    updateHud();
    updatePrompt();
  }

  function drawRoad(x1, y1, x2, y2) {
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

  function drawEgg(x, y, egg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = egg.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00000044";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(egg.emoji, 0, 1);
    ctx.restore();
  }

  function drawZone(base) {
    const locked = base.id === "mine" && lockUntil > performance.now();
    if (base.boss) {
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(base.x, base.y, base.r + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = base.fill + "77";
    ctx.beginPath();
    ctx.arc(base.x, base.y, base.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = locked ? "#fde68a" : base.stroke;
    ctx.lineWidth = locked ? 4 : 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold " + (base.boss ? 13 : 11) + "px system-ui";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText(base.name, base.x, base.y - base.r - 10);
    ctx.fillText(base.name, base.x, base.y - base.r - 10);
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

    bases.forEach(function (b) {
      dot(b.x, b.y, b.id === "mine" ? "#22c55e" : b.boss ? "#fde68a" : b.fill, b.boss ? 4 : 3);
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
    cam.x = Math.max(0, Math.min(MW - VW, player.x - VW / 2));
    cam.y = Math.max(0, Math.min(MH - VH, player.y - VH / 2));

    const night = isNight();
    ctx.fillStyle = night ? "#0f172a" : "#1e293b";
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    const sky = ctx.createLinearGradient(0, 0, 0, MH);
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
    ctx.fillRect(0, 0, MW, MH);

    for (let gx = 0; gx < MW; gx += 80) {
      for (let gy = 0; gy < MH; gy += 80) {
        ctx.fillStyle = (gx + gy) % 160 === 0 ? (night ? "#14532d" : "#22c55e") : night ? "#166534" : "#4ade80";
        ctx.globalAlpha = 0.35;
        ctx.fillRect(gx, gy, 80, 80);
        ctx.globalAlpha = 1;
      }
    }

    drawRoad(280, 1550, shop.x, shop.y);
    bases.forEach(function (b) {
      if (b.id !== "mine") drawRoad(shop.x, shop.y, b.x, b.y);
    });
    drawRoad(280, 1550, treadmill.x, treadmill.y);

    ctx.fillStyle = onTreadmill ? "#fde68a" : "#94a3b8";
    ctx.fillRect(treadmill.x - treadmill.w / 2, treadmill.y - treadmill.h / 2, treadmill.w, treadmill.h);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(treadmill.x - treadmill.w / 2, treadmill.y - treadmill.h / 2, treadmill.w, treadmill.h);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🏃 " + treadmill.label, treadmill.x, treadmill.y + 4);

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

    bases.forEach(drawZone);

    pedestals.forEach(function (p) {
      ctx.fillStyle = "#64748b";
      ctx.fillRect(p.x - 10, p.y - 4, 20, 8);
      if (p.egg) drawEgg(p.x, p.y - 16, p.egg);
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
      ctx.fillStyle = npc.color;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.boss ? 15 : 12, 0, Math.PI * 2);
      ctx.fill();
      if (npc.boss) {
        ctx.font = "12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("👑", npc.x, npc.y - 18);
      }
      if (npc.carry) drawEgg(npc.x, npc.y - 22, npc.carry);
    });

    const rows = getIndex();
    if (rows[0] && rows[0].me) {
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (player.carry) drawEgg(player.x, player.y - 26, player.carry);

    if (night) {
      ctx.fillStyle = "rgba(15,23,42,0.25)";
      ctx.fillRect(cam.x, cam.y, VW, VH);
    }

    ctx.restore();
    drawMinimap();
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

  initPedestals();
  loadGame();
  refreshShop();
  updateHud();
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
