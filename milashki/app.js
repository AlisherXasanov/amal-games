(() => {
  "use strict";

  const STORAGE = "milashki-save-v7";

  const WORLDS = [
    { id: 1, name: "Милашки 1", sub: "Fluvsies" },
    { id: 2, name: "Милашки 2", sub: "Smolsies" },
    { id: 3, name: "Милашки 3", sub: "Kpopsies" },
    { id: 4, name: "Милашки 4", sub: "Pandalings" },
    { id: 5, name: "Милашки 5", sub: "Munchies" },
    { id: 6, name: "Милашки 6", sub: "Lil Babies" },
  ];

  const STARTER = { 1: "bunny", 2: "chick", 3: "pup", 4: "pandalil", 5: "donut", 6: "baby1" };

  const ZONES = [
    { id: "living", name: "Гостиная", icon: "🛋️", wall: "#fef08a", floor: "#fde68a", decor: ["🛋️", "📺", "🪴", "🖼️"] },
    { id: "bed", name: "Спальня", icon: "🛏️", wall: "#e9d5ff", floor: "#fce7f3", decor: ["🛏️", "🪞", "💡", "🧸"] },
    { id: "kitchen", name: "Кухня", icon: "🍳", wall: "#fda4af", floor: "#fecdd3", decor: ["🍳", "🧊", "🍽️", "🥛"] },
    { id: "bath", name: "Ванная", icon: "🛁", wall: "#7dd3fc", floor: "#bae6fd", decor: ["🛁", "🧼", "🪥", "🫧"] },
    { id: "play", name: "Игровая", icon: "🎾", wall: "#c4b5fd", floor: "#ddd6fe", decor: ["🎾", "🧸", "🎮", "🎨"] },
    { id: "garden", name: "Сад", icon: "🌳", wall: "#4ade80", floor: "#86efac", decor: ["🌳", "🌸", "🦋", "⛲"] },
  ];

  const UNLOCK = {
    living: { free: true },
    bed: { free: true },
    kitchen: { coins: 20, hint: "нужно 20 🪙" },
    bath: { care: 2, hint: "покорми 2 раза" },
    play: { eggs: 1, hint: "открой бесплатное яйцо 🥚" },
    garden: { coins: 55, hint: "нужно 55 🪙" },
  };

  function sp(id, world, name, emoji, color, rare, shape, extra) {
    return Object.assign({ id, world, name, emoji, color, rare, shape }, extra || {});
  }

  const SPECIES = [
    sp("bunny", 1, "Пушок", "🐰", "#fbcfe8", "common", "bunny", { belly: "#fff", cheek: "#f9a8d4", starter: true }),
    sp("cat", 1, "Мурка", "🐱", "#fde68a", "common", "cat", { belly: "#fff", cheek: "#fcd34d" }),
    sp("fox", 1, "Рыжик", "🦊", "#fdba74", "common", "fox", { belly: "#fff", cheek: "#fb923c" }),
    sp("bear", 1, "Топтыжка", "🐻", "#d6d3d1", "rare", "bear", { belly: "#f5f5f4" }),
    sp("uni", 1, "Звёздочка", "🦄", "#e9d5ff", "rare", "fly", { horn: true, belly: "#fff", glow: "#e9d5ff" }),
    sp("dragon", 1, "Дракоша", "🐉", "#a5f3fc", "epic", "fly", { belly: "#ecfeff", spots: "#0ea5e9" }),
    sp("phoenix", 1, "Солнышко", "🔥", "#fcd34d", "legendary", "fly", { glow: "#fbbf24", cheek: "#fde047" }),
    sp("chick", 2, "Цыпа", "🐥", "#fef08a", "common", "hop", { beak: true, belly: "#fff", starter: true }),
    sp("hamster", 2, "Шустрик", "🐹", "#fed7aa", "common", "blob", { cheek: "#fdba74" }),
    sp("panda", 2, "Панди", "🐼", "#e5e7eb", "common", "blob", { eyePatch: "#1e1b4b", belly: "#fff" }),
    sp("koala", 2, "Кокос", "🐨", "#d1d5db", "rare", "blob", { belly: "#f3f4f6" }),
    sp("owl", 2, "Совуня", "🦉", "#c4b5fd", "rare", "fly", { belly: "#ede9fe" }),
    sp("star", 2, "Звездочка", "⭐", "#fef9c3", "epic", "mini", { glow: "#fde047" }),
    sp("rainbow", 2, "Радуга", "🌈", "#fda4af", "legendary", "mini", { glow: "#f472b6" }),
    sp("pup", 3, "Бобик", "🐶", "#fde68a", "common", "bunny", { belly: "#fff", cheek: "#fcd34d", starter: true }),
    sp("duck", 3, "Кряква", "🦆", "#bae6fd", "common", "hop", { beak: true, belly: "#fff" }),
    sp("frog", 3, "Квакша", "🐸", "#86efac", "common", "hop", { cheek: "#4ade80", spots: "#16a34a" }),
    sp("penguin", 3, "Пингви", "🐧", "#e5e7eb", "rare", "hop", { belly: "#fff", eyePatch: "#1e1b4b" }),
    sp("butterfly", 3, "Мотя", "🦋", "#f0abfc", "rare", "fly", { glow: "#e879f9" }),
    sp("fairy", 3, "Феечка", "🧚", "#c4b5fd", "epic", "fly", { horn: true, glow: "#a78bfa" }),
    sp("crystal", 3, "Кристаллик", "💎", "#67e8f9", "legendary", "mini", { glow: "#22d3ee" }),
    sp("bamboo", 4, "Бамбуш", "🎋", "#86efac", "common", "hop", { spots: "#16a34a" }),
    sp("redpanda", 4, "Рыжик-Панда", "🦊", "#fca5a5", "common", "fox", { belly: "#fff", cheek: "#f87171" }),
    sp("pandalil", 4, "Пандёнок", "🐼", "#f3f4f6", "common", "blob", { eyePatch: "#1e1b4b", belly: "#fff", starter: true }),
    sp("leaf", 4, "Листик", "🍃", "#bbf7d0", "rare", "fly", { glow: "#4ade80" }),
    sp("moon", 4, "Лунтик", "🌙", "#e9d5ff", "rare", "mini", { glow: "#c4b5fd" }),
    sp("spirit", 4, "Лесник", "🌿", "#6ee7b7", "epic", "fly", { glow: "#34d399" }),
    sp("goldpanda", 4, "Золотой", "✨", "#fde047", "legendary", "blob", { glow: "#fbbf24", eyePatch: "#1e1b4b" }),
    sp("donut", 5, "Пончик", "🍩", "#fbcfe8", "common", "blob", { topping: "🍓", cheek: "#f9a8d4", starter: true }),
    sp("cookie", 5, "Печенька", "🍪", "#d97706", "common", "blob", { spots: "#92400e" }),
    sp("candy", 5, "Конфетка", "🍬", "#f472b6", "common", "mini", { glow: "#ec4899" }),
    sp("cupcake", 5, "Кексик", "🧁", "#fda4af", "rare", "blob", { topping: "🍒" }),
    sp("jelly", 5, "Желейка", "🟣", "#c4b5fd", "rare", "blob", { glow: "#a78bfa" }),
    sp("icecream", 5, "Морожка", "🍦", "#bae6fd", "epic", "hop", { topping: "🍫" }),
    sp("cake", 5, "Тортик", "🎂", "#fef08a", "legendary", "blob", { topping: "🕯️", glow: "#fbbf24" }),
    sp("baby1", 6, "Крошка", "👶", "#fecdd3", "common", "mini", { cheek: "#fda4af", starter: true }),
    sp("baby2", 6, "Малыш", "🍼", "#bae6fd", "common", "mini", { cheek: "#7dd3fc" }),
    sp("teddy", 6, "Плюшик", "🧸", "#d6d3d1", "common", "bear", { belly: "#f5f5f4" }),
    sp("cloud", 6, "Облачко", "☁️", "#f3f4f6", "rare", "fly", { glow: "#e5e7eb" }),
    sp("heart", 6, "Сердечко", "💗", "#fda4af", "rare", "mini", { glow: "#f472b6" }),
    sp("angel", 6, "Ангелочек", "😇", "#fef9c3", "epic", "fly", { horn: true, glow: "#fde047" }),
    sp("dream", 6, "Соня", "💤", "#ddd6fe", "legendary", "mini", { glow: "#a78bfa" }),
  ];

  const MERGE_NEXT = {
    bunny: "fox", cat: "bear", fox: "uni", bear: "dragon", uni: "phoenix",
    chick: "panda", hamster: "koala", panda: "owl", koala: "star", owl: "rainbow",
    pup: "frog", duck: "penguin", frog: "butterfly", penguin: "fairy", butterfly: "crystal",
    bamboo: "redpanda", redpanda: "pandalil", pandalil: "leaf", leaf: "moon", moon: "spirit", spirit: "goldpanda",
    donut: "cookie", cookie: "candy", candy: "cupcake", cupcake: "jelly", jelly: "icecream", icecream: "cake",
    baby1: "baby2", baby2: "teddy", teddy: "cloud", cloud: "heart", heart: "angel", angel: "dream",
  };

  const EGGS = [
    { id: "basic", icon: "🥚", name: "Обычное", cost: 0, rareBoost: 0 },
    { id: "pink", icon: "🩷", name: "Розовое", cost: 30, rareBoost: 0.1 },
    { id: "gold", icon: "✨", name: "Золотое", cost: 80, rareBoost: 0.25 },
    { id: "rainbow", icon: "🌈", name: "Радужное", cost: 150, rareBoost: 0.4 },
  ];

  const RARITY_W = { common: 0.55, rare: 0.28, epic: 0.12, legendary: 0.05 };

  let state = {
    world: 1, coins: 50, pets: [], active: 0, discovered: [],
    mergeA: null, mergeB: null, unlocked: {}, progress: {},
    map: { zone: "living", petX: 0.5, petY: 0.72 },
  };

  const $ = (id) => document.getElementById(id);
  const mapCanvas = $("map");
  const mctx = mapCanvas.getContext("2d");
  let animT = 0, drag = null, walkTarget = null, activeTab = "home";
  let swipe = null, slideX = 0, transitioning = false;

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function speciesList() { return SPECIES.filter((s) => s.world === state.world); }
  function getSpecies(id) { return SPECIES.find((s) => s.id === id) || speciesList()[0]; }
  function prog() {
    const k = String(state.world);
    if (!state.progress[k]) state.progress[k] = { care: 0, merged: 0, eggs: 0 };
    return state.progress[k];
  }
  function unlockedList() {
    const k = String(state.world);
    if (!state.unlocked[k]) state.unlocked[k] = ["living", "bed"];
    return state.unlocked[k];
  }
  function isUnlocked(id) { return unlockedList().includes(id); }

  function checkUnlocks() {
    const list = unlockedList();
    let added = false;
    ZONES.forEach((z) => {
      if (list.includes(z.id)) return;
      const u = UNLOCK[z.id];
      if (!u) return;
      let ok = false;
      if (u.free) ok = true;
      if (u.coins && state.coins >= u.coins) ok = true;
      if (u.care && prog().care >= u.care) ok = true;
      if (u.eggs && prog().eggs >= u.eggs) ok = true;
      if (ok) { list.push(z.id); added = true; toast("Открыта комната: " + z.name + "! 🎉"); }
    });
    if (added) save();
  }

  function tryBuyUnlock(id) {
    if (isUnlocked(id)) return true;
    const u = UNLOCK[id];
    if (u.coins && state.coins >= u.coins) {
      state.coins -= u.coins;
      unlockedList().push(id);
      save();
      toast("Комната открыта!");
      return true;
    }
    toast("🔒 " + (u.hint || "ещё закрыто"));
    return false;
  }

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE) || localStorage.getItem("milashki-save-v4");
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (_) {}
    if (!state.unlocked) state.unlocked = {};
    if (!state.progress) state.progress = {};
    if (!state.discovered) state.discovered = [];
    SPECIES.forEach((sp) => {
      const nk = sp.world + ":" + sp.id;
      if (state.discovered && state.discovered.includes(sp.id) && !state.discovered.includes(nk)) state.discovered.push(nk);
    });
    state.pets.forEach((p) => {
      if (!p.world) p.world = (SPECIES.find((s) => s.id === p.speciesId) || { world: 1 }).world;
    });
    if (!state.pets.length) state.pets.push(hatchStarter());
    if (!state.map) state.map = { zone: "living", petX: 0.5, petY: 0.72 };
    const wp = state.pets.filter((p) => (p.world || 1) === state.world);
    if (wp.length >= 2 && prog().eggs < 1) prog().eggs = 1;
  }

  function hatchStarter() {
    const id = STARTER[state.world] || "bunny";
    const sp = getSpecies(id);
    const pet = { uid: Date.now(), speciesId: id, world: state.world, happy: 90, fed: 80 };
    const dk = state.world + ":" + id;
    if (!state.discovered.includes(dk)) state.discovered.push(dk);
    return pet;
  }

  function hatchRandom(boost) {
    const want = pickRarity(boost);
    const pool = speciesList().filter((s) => s.rare === want && !s.starter);
    const pick = pool[Math.floor(Math.random() * pool.length)] || speciesList().find((s) => !s.starter) || speciesList()[0];
    const pet = { uid: Date.now() + Math.random(), speciesId: pick.id, world: state.world, happy: 80, fed: 70 };
    const dk = state.world + ":" + pick.id;
    if (!state.discovered.includes(dk)) state.discovered.push(dk);
    return pet;
  }

  function pickRarity(boost) {
    const r = Math.random() - (boost || 0);
    if (r < RARITY_W.legendary) return "legendary";
    if (r < RARITY_W.legendary + RARITY_W.epic) return "epic";
    if (r < RARITY_W.legendary + RARITY_W.epic + RARITY_W.rare) return "rare";
    return "common";
  }

  function worldPets() {
    return state.pets.filter((p) => (p.world || 1) === state.world);
  }

  function fixActivePet() {
    const list = worldPets();
    if (!list.length) return;
    const cur = state.pets[state.active];
    if (!cur || (cur.world || 1) !== state.world) {
      state.active = state.pets.indexOf(list[0]);
    }
  }

  function activePet() {
    fixActivePet();
    const ap = state.pets[state.active];
    if (ap && (ap.world || state.world) === state.world) return ap;
    return worldPets()[0] || null;
  }

  function resizeCanvas() {
    const wrap = mapCanvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = Math.max(320, Math.min(window.innerHeight * 0.58, 520));
    mapCanvas.style.height = h + "px";
    mapCanvas.width = Math.floor(w * dpr);
    mapCanvas.height = Math.floor(h * dpr);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateUI() {
    checkUnlocks();
    $("coins").textContent = state.coins;
    $("pet-n").textContent = state.pets.filter((p) => (p.world || 1) === state.world).length;
    const ap = activePet();
    $("happy").textContent = ap ? Math.round(ap.happy) : 100;
    const sp = ap ? getSpecies(ap.speciesId) : null;
    if ($("pet-label")) $("pet-label").textContent = sp ? sp.emoji + " " + sp.name : "—";
    const z = ZONES.find((z) => z.id === state.map.zone);
    if ($("zone-label")) $("zone-label").textContent = z ? z.icon + " " + z.name : "";
    renderEggs();
    renderCollection();
    renderZoneNav();
  }

  function showHatch(pet) {
    const sp = getSpecies(pet.speciesId);
    $("hatch-emoji").textContent = sp.emoji;
    $("hatch-name").textContent = sp.name + "!";
    $("hatch-rare").textContent = { common: "обычный", rare: "редкий", epic: "эпик", legendary: "легенда!" }[sp.rare];
    $("hatch-pop").classList.add("on");
  }

  function drawRoom(c, w, h, z, locked) {
    const grd = c.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, z.wall);
    grd.addColorStop(0.45, z.floor);
    grd.addColorStop(1, z.floor);
    c.fillStyle = grd;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,.45)";
    c.fillRect(w * 0.06, h * 0.06, w * 0.38, h * 0.22);
    c.strokeStyle = "#fff";
    c.lineWidth = 3;
    c.strokeRect(w * 0.06, h * 0.06, w * 0.38, h * 0.22);
    z.decor.forEach((ico, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      c.font = `${Math.min(w, h) * 0.11}px serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(ico, w * (0.22 + col * 0.38), h * (0.42 + row * 0.18));
    });
    /* название комнаты только в полоске сверху — не дублируем */
    if (locked) {
      c.fillStyle = "rgba(74,4,78,.72)";
      c.fillRect(0, 0, w, h);
      c.font = `bold ${w * 0.08}px serif`;
      c.textAlign = "center";
      c.fillText("🔒", w / 2, h * 0.38);
      c.font = `bold 14px Nunito,sans-serif`;
      c.fillStyle = "#fff";
      c.fillText("Комната закрыта", w / 2, h * 0.48);
      c.font = "12px Nunito,sans-serif";
      c.fillText(UNLOCK[z.id]?.hint || "", w / 2, h * 0.55);
    }
  }

  function drawMap() {
    const w = mapCanvas.clientWidth;
    const h = mapCanvas.clientHeight;
    mctx.clearRect(0, 0, w, h);
    const z = ZONES.find((z) => z.id === state.map.zone) || ZONES[0];
    const locked = !isUnlocked(z.id);
    mctx.save();
    mctx.translate(slideX, 0);
    drawRoom(mctx, w, h, z, false);
    if (locked) {
      mctx.fillStyle = "rgba(74,4,78,.55)";
      mctx.fillRect(0, 0, w, h * 0.35);
      mctx.font = "bold 15px Nunito,sans-serif";
      mctx.fillStyle = "#fff";
      mctx.textAlign = "center";
      mctx.fillText("🔒 " + z.name + " закрыта", w / 2, h * 0.12);
      mctx.font = "12px Nunito,sans-serif";
      mctx.fillText(UNLOCK[z.id]?.hint || "", w / 2, h * 0.2);
    }
    const ap = activePet();
    if (ap) {
      const sp = getSpecies(ap.speciesId);
      const px = state.map.petX * w;
      let py = state.map.petY * h;
      if (walkTarget && !locked) {
        const dx = walkTarget.x - px, dy = walkTarget.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) walkTarget = null;
        else {
          px += (dx / dist) * 4;
          py += (dy / dist) * 4;
          state.map.petX = px / w;
          state.map.petY = py / h;
        }
      }
      const mood = ap.happy < 40 ? "sad" : "happy";
      if (window.MilashkiDraw) {
        window.MilashkiDraw.draw(mctx, px, py - 10, sp, animT, Math.min(w, h) / 400, mood);
      }
    }
    if (walkTarget && !activePet()) walkTarget = null;
    mctx.restore();
    animT += 0.016;
    if (activeTab === "home") requestAnimationFrame(drawMap);
  }

  function goZone(id, dir) {
    if (state.map.zone === id) return;
    walkTarget = null;
    drag = null;
    swipe = null;
    if (!isUnlocked(id)) {
      checkUnlocks();
      if (!isUnlocked(id)) {
        const u = UNLOCK[id] || {};
        if (u.coins && state.coins >= u.coins) {
          state.coins -= u.coins;
          unlockedList().push(id);
          toast("Комната открыта! 🎉");
        } else {
          toast("🔒 " + (u.hint || "ещё закрыто"));
          return;
        }
      }
    }
    const w = mapCanvas.clientWidth;
    transitioning = true;
    slideX = dir > 0 ? -w : w;
    const start = slideX;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / 220);
      slideX = start * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else { slideX = 0; transitioning = false; }
    };
    state.map.zone = id;
    save();
    updateUI();
    requestAnimationFrame(tick);
  }

  function swipeZone(dir) {
    const idx = ZONES.findIndex((z) => z.id === state.map.zone);
    let ni = idx + dir;
    while (ni >= 0 && ni < ZONES.length) {
      const zid = ZONES[ni].id;
      if (!isUnlocked(zid)) {
        toast("🔒 " + (UNLOCK[zid]?.hint || "комната закрыта"));
        return;
      }
      goZone(zid, dir);
      return;
    }
    toast(dir > 0 ? "Это последняя комната →" : "← Это первая комната");
  }

  function pointerPos(e) {
    const r = mapCanvas.getBoundingClientRect();
    return {
      sx: e.clientX - r.left,
      sy: e.clientY - r.top,
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
  }

  function setupInput() {
    mapCanvas.addEventListener("pointerdown", (e) => {
      if (transitioning) return;
      if (!isUnlocked(state.map.zone)) { toast("🔒 Сначала открой эту комнату"); return; }
      mapCanvas.setPointerCapture(e.pointerId);
      const p = pointerPos(e);
      swipe = { x0: e.clientX, y0: e.clientY, sx: p.sx, sy: p.sy, t: Date.now() };
      const w = mapCanvas.clientWidth, h = mapCanvas.clientHeight;
      const px = state.map.petX * w, py = state.map.petY * h;
      if (Math.hypot(p.sx - px, p.sy - py + 20) < 55) {
        drag = { kind: "pet", ox: p.sx - px, oy: p.sy - py };
        walkTarget = null;
      } else drag = { kind: "map" };
    });
    mapCanvas.addEventListener("pointermove", (e) => {
      if (!drag || drag.kind !== "pet") return;
      const p = pointerPos(e);
      const w = mapCanvas.clientWidth, h = mapCanvas.clientHeight;
      state.map.petX = Math.max(0.12, Math.min(0.88, (p.sx - drag.ox) / w));
      state.map.petY = Math.max(0.45, Math.min(0.88, (p.sy - drag.oy) / h));
    });
    const end = (e) => {
      if (!swipe) return;
      const dx = e.clientX - swipe.x0;
      const dy = e.clientY - swipe.y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swipeZone(dx < 0 ? 1 : -1);
      } else if (drag?.kind === "map" && Math.hypot(dx, dy) < 10 && isUnlocked(state.map.zone)) {
        const p = pointerPos(e);
        walkTarget = { x: p.sx, y: p.sy };
      } else if (drag?.kind === "pet") save();
      drag = null;
      swipe = null;
    };
    mapCanvas.addEventListener("pointerup", end);
    mapCanvas.addEventListener("pointercancel", end);
  }

  function care(kind, quiet) {
    const ap = activePet();
    if (!ap) return;
    if (kind === "feed") {
      ap.fed = Math.min(100, ap.fed + 25);
      ap.happy = Math.min(100, ap.happy + 8);
      state.coins += 2;
      prog().care++;
      if (!quiet) toast("Ням-ням! +2 🪙");
      if (isUnlocked("kitchen")) goZone("kitchen", 1);
    }
    if (kind === "wash") {
      ap.happy = Math.min(100, ap.happy + 15);
      if (!quiet) toast("Блестит! ✨");
      if (isUnlocked("bath")) goZone("bath", 1);
    }
    if (kind === "play") {
      ap.happy = Math.min(100, ap.happy + 20);
      state.coins += 5;
      if (!quiet) toast("Играем! +5 🪙");
      if (isUnlocked("play")) goZone("play", 1);
      else if (!quiet) toast("Подсказка: вкладка 🥚 → бесплатное яйцо = 2-й питомец!");
    }
    if (kind === "pet") { ap.happy = Math.min(100, ap.happy + 10); if (!quiet) toast("Мур-мур…"); }
    checkUnlocks();
    save();
    updateUI();
  }

  function goWalk() {
    if (!isUnlocked("garden")) { toast("Сначала открой сад 🌳"); return; }
    goZone("garden", 1);
    const w = mapCanvas.clientWidth, h = mapCanvas.clientHeight;
    walkTarget = { x: w * (0.3 + Math.random() * 0.4), y: h * (0.55 + Math.random() * 0.2) };
    care("play", true);
  }

  function renderZoneNav() {
    const g = $("zone-nav");
    if (!g) return;
    g.innerHTML = "";
    ZONES.forEach((z) => {
      const btn = document.createElement("button");
      const ok = isUnlocked(z.id);
      btn.type = "button";
      btn.className = "zone-btn" + (state.map.zone === z.id ? " on" : "") + (ok ? "" : " locked");
      btn.innerHTML = `<span>${ok ? z.icon : "🔒"}</span><small>${z.name}</small>`;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const zi = ZONES.findIndex((x) => x.id === z.id);
        const cur = ZONES.findIndex((x) => x.id === state.map.zone);
        if (zi === cur) return;
        goZone(z.id, zi > cur ? 1 : -1);
      };
      g.appendChild(btn);
    });
  }

  function openEgg(egg) {
    if (state.coins < egg.cost) { toast("Нужно " + egg.cost + " монет"); return; }
    state.coins -= egg.cost;
    const pet = hatchRandom(egg.rareBoost);
    state.pets.push(pet);
    state.active = state.pets.length - 1;
    prog().eggs++;
    checkUnlocks();
    save();
    updateUI();
    showHatch(pet);
    if (prog().eggs === 1) toast("Ура! Теперь можно открыть игровую 🎾");
  }

  function renderEggs() {
    $("egg-grid").innerHTML = "";
    EGGS.forEach((egg) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "egg-card";
      el.innerHTML = `<div class="ico">${egg.icon}</div><div class="lbl">${egg.name}</div><div class="cost">${egg.cost ? egg.cost + " 🪙" : "бесплатно"}</div>`;
      el.onclick = () => openEgg(egg);
      $("egg-grid").appendChild(el);
    });
  }

  function renderCollection() {
    $("collection").innerHTML = "";
    speciesList().forEach((sp) => {
      const ok = state.discovered.includes(state.world + ":" + sp.id);
      const el = document.createElement("div");
      el.className = "col-item" + (ok ? "" : " locked");
      el.innerHTML = `<div class="col-emoji">${ok ? sp.emoji : "?"}</div><span>${sp.name}</span>`;
      if (ok) el.onclick = () => {
        const i = state.pets.findIndex((p) => p.speciesId === sp.id && (p.world || state.world) === state.world);
        if (i >= 0) { state.active = i; toast(sp.name); save(); updateUI(); }
      };
      $("collection").appendChild(el);
    });
  }

  function setMergeSlot(slot, uid) {
    if (slot === "a") state.mergeA = uid; else state.mergeB = uid;
    const pa = state.pets.find((p) => p.uid === state.mergeA);
    const pb = state.pets.find((p) => p.uid === state.mergeB);
    $("slot-a").textContent = pa ? getSpecies(pa.speciesId).emoji : "+";
    $("slot-b").textContent = pb ? getSpecies(pb.speciesId).emoji : "+";
    save();
  }

  function doMerge() {
    const list = worldPets();
    if (list.length < 2) {
      toast("Нужны 2 питомца! Вкладка 🥚 → бесплатное яйцо");
      return;
    }
    const pa = state.pets.find((p) => p.uid === state.mergeA);
    const pb = state.pets.find((p) => p.uid === state.mergeB);
    if (!pa || !pb) { toast("Нажми слот + и выбери 2 питомцев"); return; }
    if (pa.uid === pb.uid) { toast("Это один и тот же! Нужны 2 одинаковых вида"); return; }
    if (pa.speciesId !== pb.speciesId) { toast("Нужны 2 одинаковых вида (например 2 зайчика)"); return; }
    const nextId = MERGE_NEXT[pa.speciesId];
    if (!nextId) { toast("Это уже максимальная форма!"); return; }
    state.pets = state.pets.filter((p) => p.uid !== pa.uid && p.uid !== pb.uid);
    const np = { uid: Date.now(), speciesId: nextId, world: state.world, happy: 100, fed: 100 };
    state.pets.push(np);
    const dk = state.world + ":" + nextId;
    if (!state.discovered.includes(dk)) state.discovered.push(dk);
    prog().merged++;
    state.mergeA = state.mergeB = null;
    $("slot-a").textContent = "+";
    $("slot-b").textContent = "+";
    state.active = state.pets.indexOf(np);
    fixActivePet();
    checkUnlocks();
    save();
    updateUI();
    showHatch(np);
    toast("✨ Слияние! Питомец эволюционировал");
  }

  function renderWorlds() {
    $("world-pick").innerHTML = "";
    WORLDS.forEach((w) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "world-btn" + (state.world === w.id ? " on" : "");
      btn.innerHTML = `<strong>${w.name}</strong><small>${w.sub}</small>`;
      btn.onclick = () => {
        document.querySelectorAll(".world-btn").forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        state.world = w.id;
        if (!state.pets.some((p) => (p.world || 1) === state.world)) state.pets.push(hatchStarter());
        state.map.zone = "living";
        save();
        updateUI();
        toast(w.name);
      };
      $("world-pick").appendChild(btn);
    });
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
      tab.classList.add("on");
      activeTab = tab.dataset.tab;
      $("panel-" + activeTab).classList.add("on");
      if (activeTab === "home") { resizeCanvas(); drawMap(); }
    };
  });

  $("act-feed").onclick = () => care("feed");
  $("act-wash").onclick = () => care("wash");
  $("act-play").onclick = () => care("play");
  $("act-pet").onclick = () => care("pet");
  $("act-walk").onclick = () => goWalk();
  $("btn-merge").onclick = doMerge;
  $("hatch-ok").onclick = () => $("hatch-pop").classList.remove("on");
  $("slot-a").onclick = () => {
    const ap = activePet();
    if (ap) { setMergeSlot("a", ap.uid); toast("Слот 1: " + getSpecies(ap.speciesId).name); }
  };
  $("slot-b").onclick = () => {
    const list = worldPets();
    if (list.length < 2) { toast("Сначала открой 🥚 бесплатное яйцо!"); return; }
    const other = list.find((p) => p.uid !== state.mergeA) || list[1];
    setMergeSlot("b", other.uid);
    toast("Слот 2: " + getSpecies(other.speciesId).name);
  };

  window.addEventListener("resize", () => { resizeCanvas(); });
  setInterval(() => {
    state.pets.forEach((p) => {
      p.fed = Math.max(0, p.fed - 0.3);
      if (p.fed < 30) p.happy = Math.max(0, p.happy - 0.5);
    });
    save();
    updateUI();
  }, 8000);

  renderWorlds();
  setupInput();
  load();
  fixActivePet();
  resizeCanvas();
  updateUI();
  drawMap();
  if (worldPets().length < 2) {
    setTimeout(() => toast("🥚 Второй питомец: вкладка Яйца → бесплатное яйцо"), 1200);
  }
})();
