(() => {
  "use strict";

  const STORAGE = "milashki-save-v4";
  const MAP_W = 720;
  const MAP_H = 520;

  const WORLDS = [
    { id: 1, name: "Милашки 1", sub: "Fluvsies · пушистики" },
    { id: 2, name: "Милашки 2", sub: "Smolsies · малыши" },
    { id: 3, name: "Милашки 3", sub: "Kpopsies · звёзды" },
    { id: 4, name: "Милашки 4", sub: "Pandalings · панды" },
    { id: 5, name: "Милашки 5", sub: "Munchies · сладкие" },
    { id: 6, name: "Милашки 6", sub: "Lil Babies · крошки" },
  ];

  const ZONES = [
    { id: "bed", name: "Спальня", icon: "🛏️", x: 0, y: 0, w: 240, h: 260, floor: "#fce7f3", wall: "#e9d5ff", decor: ["🛏️", "🪞", "💡"] },
    { id: "living", name: "Гостиная", icon: "🛋️", x: 240, y: 0, w: 240, h: 260, floor: "#fde68a", wall: "#fef08a", decor: ["🛋️", "📺", "🪴"] },
    { id: "kitchen", name: "Кухня", icon: "🍳", x: 480, y: 0, w: 240, h: 260, floor: "#fecdd3", wall: "#fda4af", decor: ["🍳", "🧊", "🍽️"] },
    { id: "bath", name: "Ванная", icon: "🛁", x: 0, y: 260, w: 240, h: 260, floor: "#bae6fd", wall: "#7dd3fc", decor: ["🛁", "🧼", "🪥"] },
    { id: "play", name: "Игровая", icon: "🎾", x: 240, y: 260, w: 240, h: 260, floor: "#ddd6fe", wall: "#c4b5fd", decor: ["🎾", "🧸", "🎮"] },
    { id: "garden", name: "Сад", icon: "🌳", x: 480, y: 260, w: 240, h: 260, floor: "#86efac", wall: "#4ade80", decor: ["🌳", "🌸", "🦋"] },
  ];

  const SPECIES = [
    { id: "bunny", world: 1, name: "Зайчик", emoji: "🐰", color: "#fbcfe8", rare: "common" },
    { id: "cat", world: 1, name: "Котик", emoji: "🐱", color: "#fde68a", rare: "common" },
    { id: "fox", world: 1, name: "Лисичка", emoji: "🦊", color: "#fdba74", rare: "common" },
    { id: "bear", world: 1, name: "Мишка", emoji: "🐻", color: "#d6d3d1", rare: "rare" },
    { id: "uni", world: 1, name: "Единорог", emoji: "🦄", color: "#e9d5ff", rare: "rare" },
    { id: "dragon", world: 1, name: "Дракончик", emoji: "🐉", color: "#a5f3fc", rare: "epic" },
    { id: "phoenix", world: 1, name: "Феникс", emoji: "🔥", color: "#fcd34d", rare: "legendary" },
    { id: "chick", world: 2, name: "Цыплёнок", emoji: "🐥", color: "#fef08a", rare: "common" },
    { id: "hamster", world: 2, name: "Хомячок", emoji: "🐹", color: "#fed7aa", rare: "common" },
    { id: "panda", world: 2, name: "Панда", emoji: "🐼", color: "#e5e7eb", rare: "common" },
    { id: "koala", world: 2, name: "Коала", emoji: "🐨", color: "#d1d5db", rare: "rare" },
    { id: "owl", world: 2, name: "Совёнок", emoji: "🦉", color: "#c4b5fd", rare: "rare" },
    { id: "star", world: 2, name: "Звёздочка", emoji: "⭐", color: "#fef9c3", rare: "epic" },
    { id: "rainbow", world: 2, name: "Радуга", emoji: "🌈", color: "#fda4af", rare: "legendary" },
    { id: "pup", world: 3, name: "Щенок", emoji: "🐶", color: "#fde68a", rare: "common" },
    { id: "duck", world: 3, name: "Утёнок", emoji: "🦆", color: "#bae6fd", rare: "common" },
    { id: "frog", world: 3, name: "Лягушонок", emoji: "🐸", color: "#86efac", rare: "common" },
    { id: "penguin", world: 3, name: "Пингвин", emoji: "🐧", color: "#e5e7eb", rare: "rare" },
    { id: "butterfly", world: 3, name: "Бабочка", emoji: "🦋", color: "#f0abfc", rare: "rare" },
    { id: "fairy", world: 3, name: "Фея", emoji: "🧚", color: "#c4b5fd", rare: "epic" },
    { id: "crystal", world: 3, name: "Кристалл", emoji: "💎", color: "#67e8f9", rare: "legendary" },
    { id: "bamboo", world: 4, name: "Бамбук", emoji: "🎋", color: "#86efac", rare: "common" },
    { id: "redpanda", world: 4, name: "Красная панда", emoji: "🦊", color: "#fca5a5", rare: "common" },
    { id: "pandalil", world: 4, name: "Пандёнок", emoji: "🐼", color: "#f3f4f6", rare: "common" },
    { id: "leaf", world: 4, name: "Листочек", emoji: "🍃", color: "#bbf7d0", rare: "rare" },
    { id: "moon", world: 4, name: "Лунный", emoji: "🌙", color: "#e9d5ff", rare: "rare" },
    { id: "spirit", world: 4, name: "Дух леса", emoji: "🌿", color: "#6ee7b7", rare: "epic" },
    { id: "goldpanda", world: 4, name: "Золотая панда", emoji: "✨", color: "#fde047", rare: "legendary" },
    { id: "donut", world: 5, name: "Пончик", emoji: "🍩", color: "#fbcfe8", rare: "common" },
    { id: "cookie", world: 5, name: "Печенька", emoji: "🍪", color: "#d97706", rare: "common" },
    { id: "candy", world: 5, name: "Конфетка", emoji: "🍬", color: "#f472b6", rare: "common" },
    { id: "cupcake", world: 5, name: "Кексик", emoji: "🧁", color: "#fda4af", rare: "rare" },
    { id: "jelly", world: 5, name: "Желейка", emoji: "🟣", color: "#c4b5fd", rare: "rare" },
    { id: "icecream", world: 5, name: "Мороженое", emoji: "🍦", color: "#bae6fd", rare: "epic" },
    { id: "cake", world: 5, name: "Тортик", emoji: "🎂", color: "#fef08a", rare: "legendary" },
    { id: "baby1", world: 6, name: "Крошка", emoji: "👶", color: "#fecdd3", rare: "common" },
    { id: "baby2", world: 6, name: "Малыш", emoji: "🍼", color: "#bae6fd", rare: "common" },
    { id: "teddy", world: 6, name: "Плюшик", emoji: "🧸", color: "#d6d3d1", rare: "common" },
    { id: "cloud", world: 6, name: "Облачко", emoji: "☁️", color: "#f3f4f6", rare: "rare" },
    { id: "heart", world: 6, name: "Сердечко", emoji: "💗", color: "#fda4af", rare: "rare" },
    { id: "angel", world: 6, name: "Ангелочек", emoji: "😇", color: "#fef9c3", rare: "epic" },
    { id: "dream", world: 6, name: "Соня", emoji: "💤", color: "#ddd6fe", rare: "legendary" },
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
    world: 1,
    coins: 50,
    pets: [],
    active: 0,
    discovered: [],
    mergeA: null,
    mergeB: null,
    maps: {},
  };

  const $ = (id) => document.getElementById(id);
  const mapCanvas = $("map");
  const mctx = mapCanvas.getContext("2d");
  let animT = 0;
  let drag = null;
  let walkTarget = null;
  let activeTab = "home";

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function speciesList() { return SPECIES.filter((s) => s.world === state.world); }
  function getSpecies(id) { return SPECIES.find((s) => s.id === id) || speciesList()[0]; }

  function defaultMap() {
    const z = ZONES.find((z) => z.id === "living");
    return { petX: z.x + z.w / 2, petY: z.y + z.h * 0.65, zone: "living", camX: 0, camY: 0 };
  }

  function mapData() {
    const key = String(state.world);
    if (!state.maps[key]) state.maps[key] = defaultMap();
    return state.maps[key];
  }

  function zoneAt(wx, wy) {
    return ZONES.find((z) => wx >= z.x && wx < z.x + z.w && wy >= z.y && wy < z.y + z.h);
  }

  function zoneCenter(id) {
    const z = ZONES.find((z) => z.id === id) || ZONES[1];
    return { x: z.x + z.w / 2, y: z.y + z.h * 0.68, zone: z.id };
  }

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE)
        || localStorage.getItem("milashki-save-v3")
        || localStorage.getItem("milashki-save-v2");
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (_) {}
    if (!state.maps) state.maps = {};
    if (state.rooms) {
      Object.keys(state.rooms).forEach((k) => {
        if (!state.maps[k]) {
          const r = state.rooms[k];
          state.maps[k] = {
            petX: r.pet.x * MAP_W,
            petY: r.pet.y * MAP_H,
            zone: "living",
            camX: 0,
            camY: 0,
          };
        }
      });
    }
    SPECIES.forEach((sp) => {
      const nk = sp.world + ":" + sp.id;
      if (state.discovered.includes(sp.id) && !state.discovered.includes(nk)) state.discovered.push(nk);
    });
    state.pets.forEach((p) => {
      if (!p.world) {
        const sp = SPECIES.find((s) => s.id === p.speciesId);
        p.world = sp ? sp.world : 1;
      }
    });
    if (!state.pets.length) state.pets.push(hatchRandom(0));
  }

  function pickRarity(boost) {
    const r = Math.random() - (boost || 0);
    if (r < RARITY_W.legendary) return "legendary";
    if (r < RARITY_W.legendary + RARITY_W.epic) return "epic";
    if (r < RARITY_W.legendary + RARITY_W.epic + RARITY_W.rare) return "rare";
    return "common";
  }

  function hatchRandom(boost) {
    const want = pickRarity(boost);
    const pool = speciesList().filter((s) => s.rare === want);
    const pick = pool[Math.floor(Math.random() * pool.length)] || speciesList()[0];
    const pet = { uid: Date.now() + Math.random(), speciesId: pick.id, world: state.world, happy: 80, fed: 70 };
    const discKey = state.world + ":" + pick.id;
    if (!state.discovered.includes(discKey)) state.discovered.push(discKey);
    return pet;
  }

  function activePet() {
    const ap = state.pets[state.active];
    if (ap && (ap.world || state.world) === state.world) return ap;
    return state.pets.find((p) => (p.world || 1) === state.world) || null;
  }

  function updateUI() {
    $("coins").textContent = state.coins;
    const worldPets = state.pets.filter((p) => (p.world || 1) === state.world);
    $("pet-n").textContent = worldPets.length;
    const ap = activePet();
    $("happy").textContent = ap ? Math.round(ap.happy) : 100;
    const sp = ap ? getSpecies(ap.speciesId) : null;
    const lbl = $("pet-label");
    if (lbl) lbl.textContent = sp ? sp.emoji + " " + sp.name : "—";
    const zl = $("zone-label");
    if (zl) {
      const z = ZONES.find((z) => z.id === mapData().zone);
      zl.textContent = z ? z.icon + " " + z.name : "";
    }
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

  function drawClearPet(c, x, y, sp, t, big) {
    const bob = Math.sin(t * 4) * (big ? 5 : 3);
    const r = big ? 38 : 32;
    c.fillStyle = "rgba(0,0,0,.12)";
    c.beginPath();
    c.ellipse(x, y + r + 6, r * 0.9, r * 0.25, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = sp.color;
    c.strokeStyle = "#fff";
    c.lineWidth = 4;
    c.beginPath();
    c.arc(x, y + bob, r, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.font = `${big ? 52 : 44}px "Segoe UI Emoji", "Apple Color Emoji", serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(sp.emoji, x, y + bob - 2);
    c.font = `bold ${big ? 13 : 11}px Nunito, sans-serif`;
    c.fillStyle = "#4a044e";
    const tw = c.measureText(sp.name).width;
    c.fillStyle = "#fff";
    c.beginPath();
    c.roundRect(x - tw / 2 - 8, y + bob + r + 4, tw + 16, 20, 10);
    c.fill();
    c.strokeStyle = sp.color;
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "#4a044e";
    c.fillText(sp.name, x, y + bob + r + 16);
    return y + bob;
  }

  function drawHouse(c) {
    c.fillStyle = "#f3e8ff";
    c.fillRect(0, 0, MAP_W, MAP_H);
    ZONES.forEach((z) => {
      c.fillStyle = z.wall;
      c.fillRect(z.x + 4, z.y + 4, z.w - 8, z.h * 0.42);
      c.fillStyle = z.floor;
      c.fillRect(z.x + 4, z.y + z.h * 0.42, z.w - 8, z.h * 0.58 - 4);
      c.strokeStyle = "rgba(255,255,255,.8)";
      c.lineWidth = 3;
      c.strokeRect(z.x + 4, z.y + 4, z.w - 8, z.h - 8);
      c.font = "bold 14px Nunito, sans-serif";
      c.fillStyle = "#4a044e";
      c.textAlign = "left";
      c.fillText(z.icon + " " + z.name, z.x + 14, z.y + 24);
      z.decor.forEach((ico, i) => {
        c.font = "32px serif";
        c.textAlign = "center";
        c.fillText(ico, z.x + 50 + i * 70, z.y + z.h * 0.55);
      });
      const portalX = z.x + z.w - 28;
      const portalY = z.y + 28;
      c.fillStyle = mapData().zone === z.id ? "#ec4899" : "rgba(255,255,255,.7)";
      c.beginPath();
      c.arc(portalX, portalY, 16, 0, Math.PI * 2);
      c.fill();
      c.font = "16px serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("➡️", portalX, portalY);
    });
  }

  function clampCam(m) {
    const vw = mapCanvas.width;
    const vh = mapCanvas.height;
    m.camX = Math.max(0, Math.min(MAP_W - vw, m.camX));
    m.camY = Math.max(0, Math.min(MAP_H - vh, m.camY));
  }

  function centerCamOnPet(smooth) {
    const m = mapData();
    const vw = mapCanvas.width;
    const vh = mapCanvas.height;
    const tx = m.petX - vw / 2;
    const ty = m.petY - vh / 2;
    if (smooth) {
      m.camX += (tx - m.camX) * 0.08;
      m.camY += (ty - m.camY) * 0.08;
    } else {
      m.camX = tx;
      m.camY = ty;
    }
    clampCam(m);
  }

  function drawMap() {
    const m = mapData();
    const vw = mapCanvas.width;
    const vh = mapCanvas.height;
    mctx.clearRect(0, 0, vw, vh);
    mctx.save();
    mctx.translate(-m.camX, -m.camY);
    drawHouse(mctx);

    if (walkTarget) {
      mctx.strokeStyle = "#ec4899";
      mctx.lineWidth = 2;
      mctx.setLineDash([6, 6]);
      mctx.beginPath();
      mctx.moveTo(m.petX, m.petY);
      mctx.lineTo(walkTarget.x, walkTarget.y);
      mctx.stroke();
      mctx.setLineDash([]);
      mctx.font = "24px serif";
      mctx.textAlign = "center";
      mctx.fillText("👣", walkTarget.x, walkTarget.y);
    }

    const ap = activePet();
    if (ap) {
      const sp = getSpecies(ap.speciesId);
      drawClearPet(mctx, m.petX, m.petY, sp, animT, true);
    }
    mctx.restore();

    mctx.fillStyle = "rgba(74,4,78,.75)";
    mctx.font = "bold 11px Nunito, sans-serif";
    mctx.textAlign = "left";
    mctx.fillText("🖐 Тяни карту · тяни питомца · тапни куда идти", 8, vh - 8);

    if (!drag || drag.kind !== "pan") centerCamOnPet(true);

    if (walkTarget) {
      const dx = walkTarget.x - m.petX;
      const dy = walkTarget.y - m.petY;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        walkTarget = null;
        const z = zoneAt(m.petX, m.petY);
        if (z) { m.zone = z.id; updateUI(); }
        save();
      } else {
        const spd = 3.2;
        m.petX += (dx / dist) * spd;
        m.petY += (dy / dist) * spd;
        const z = zoneAt(m.petX, m.petY);
        if (z) m.zone = z.id;
      }
    }

    animT += 0.016;
    if (activeTab === "home") requestAnimationFrame(drawMap);
  }

  function screenToWorld(sx, sy) {
    const m = mapData();
    return { x: sx + m.camX, y: sy + m.camY };
  }

  function pointerOnCanvas(e) {
    const rect = mapCanvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (mapCanvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (mapCanvas.height / rect.height);
    return { sx, sy, ...screenToWorld(sx, sy) };
  }

  function hitPet(wx, wy) {
    const m = mapData();
    return Math.hypot(wx - m.petX, wy - m.petY) < 42;
  }

  function hitPortal(wx, wy) {
    for (const z of ZONES) {
      const px = z.x + z.w - 28;
      const py = z.y + 28;
      if (Math.hypot(wx - px, wy - py) < 22) return z.id;
    }
    return null;
  }

  function teleportToZone(id) {
    const c = zoneCenter(id);
    const m = mapData();
    m.petX = c.x;
    m.petY = c.y;
    m.zone = id;
    walkTarget = null;
    centerCamOnPet(false);
    save();
    updateUI();
    const z = ZONES.find((z) => z.id === id);
    toast("Телепорт: " + (z ? z.name : ""));
  }

  function setupMapInput() {
    mapCanvas.addEventListener("pointerdown", (e) => {
      mapCanvas.setPointerCapture(e.pointerId);
      const p = pointerOnCanvas(e);
      const portal = hitPortal(p.x, p.y);
      if (portal) {
        teleportToZone(portal);
        return;
      }
      if (hitPet(p.x, p.y)) {
        drag = { kind: "pet", ox: p.x - mapData().petX, oy: p.y - mapData().petY };
        walkTarget = null;
      } else {
        drag = { kind: "pan", sx: p.sx, sy: p.sy, camX: mapData().camX, camY: mapData().camY };
      }
    });

    mapCanvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = pointerOnCanvas(e);
      const m = mapData();
      if (drag.kind === "pet") {
        m.petX = Math.max(20, Math.min(MAP_W - 20, p.x - drag.ox));
        m.petY = Math.max(20, Math.min(MAP_H - 20, p.y - drag.oy));
        const z = zoneAt(m.petX, m.petY);
        if (z) m.zone = z.id;
      } else if (drag.kind === "pan") {
        m.camX = drag.camX - (p.sx - drag.sx);
        m.camY = drag.camY - (p.sy - drag.sy);
        clampCam(m);
      }
    });

    const end = (e) => {
      if (!drag) return;
      if (drag.kind === "pet") {
        save();
        updateUI();
      } else if (drag.kind === "pan") {
        const p = pointerOnCanvas(e);
        const moved = Math.hypot(p.sx - drag.sx, p.sy - drag.sy);
        if (moved < 8) {
          walkTarget = { x: p.x, y: p.y };
          const z = zoneAt(p.x, p.y);
          if (z) mapData().zone = z.id;
          toast("Идём сюда!");
        }
        save();
      }
      drag = null;
    };
    mapCanvas.addEventListener("pointerup", end);
    mapCanvas.addEventListener("pointercancel", end);
  }

  function goWalk() {
    const m = mapData();
    const z = ZONES.find((z) => z.id === m.zone) || ZONES[1];
    walkTarget = {
      x: z.x + 40 + Math.random() * (z.w - 80),
      y: z.y + z.h * 0.5 + Math.random() * (z.h * 0.35),
    };
    toast("Гуляем! 🚶");
    care("play", true);
  }

  function renderZoneNav() {
    const g = $("zone-nav");
    if (!g) return;
    g.innerHTML = "";
    ZONES.forEach((z) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zone-btn" + (mapData().zone === z.id ? " on" : "");
      btn.innerHTML = `<span>${z.icon}</span><small>${z.name}</small>`;
      btn.onclick = () => teleportToZone(z.id);
      g.appendChild(btn);
    });
  }

  function care(kind, quiet) {
    const ap = activePet();
    if (!ap) return;
    if (kind === "feed") { ap.fed = Math.min(100, ap.fed + 25); ap.happy = Math.min(100, ap.happy + 8); state.coins += 2; if (!quiet) toast("Ням-ням! +2 монеты"); }
    if (kind === "wash") { ap.happy = Math.min(100, ap.happy + 15); if (!quiet) toast("Блестит! ✨"); teleportToZone("bath"); }
    if (kind === "play") { ap.happy = Math.min(100, ap.happy + 20); state.coins += 5; if (!quiet) toast("Играем! +5 монет"); }
    if (kind === "pet") { ap.happy = Math.min(100, ap.happy + 10); if (!quiet) toast("Мур-мур…"); }
    save();
    updateUI();
  }

  function openEgg(egg) {
    if (state.coins < egg.cost) { toast("Нужно " + egg.cost + " монет"); return; }
    state.coins -= egg.cost;
    const pet = hatchRandom(egg.rareBoost);
    state.pets.push(pet);
    state.active = state.pets.length - 1;
    save();
    updateUI();
    showHatch(pet);
  }

  function renderEggs() {
    const g = $("egg-grid");
    g.innerHTML = "";
    EGGS.forEach((egg) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "egg-card";
      el.innerHTML = `<div class="ico">${egg.icon}</div><div class="lbl">${egg.name}</div><div class="cost">${egg.cost ? egg.cost + " 🪙" : "бесплатно"}</div>`;
      el.onclick = () => openEgg(egg);
      g.appendChild(el);
    });
  }

  function renderCollection() {
    const g = $("collection");
    g.innerHTML = "";
    speciesList().forEach((sp) => {
      const el = document.createElement("div");
      const ok = state.discovered.includes(state.world + ":" + sp.id);
      el.className = "col-item" + (ok ? "" : " locked");
      el.innerHTML = `<div class="col-emoji">${ok ? sp.emoji : "?"}</div><span>${sp.name}</span>`;
      el.title = ok ? sp.name : "ещё не открыт";
      if (ok) el.onclick = () => {
        const i = state.pets.findIndex((p) => p.speciesId === sp.id && (p.world || state.world) === state.world);
        if (i >= 0) { state.active = i; toast("Выбран: " + sp.name); save(); updateUI(); }
      };
      g.appendChild(el);
    });
  }

  function setMergeSlot(slot, petUid) {
    if (slot === "a") state.mergeA = petUid;
    else state.mergeB = petUid;
    const pa = state.pets.find((p) => p.uid === state.mergeA);
    const pb = state.pets.find((p) => p.uid === state.mergeB);
    $("slot-a").textContent = pa ? getSpecies(pa.speciesId).emoji : "+";
    $("slot-b").textContent = pb ? getSpecies(pb.speciesId).emoji : "+";
    save();
  }

  function doMerge() {
    const pa = state.pets.find((p) => p.uid === state.mergeA);
    const pb = state.pets.find((p) => p.uid === state.mergeB);
    if (!pa || !pb) { toast("Положи 2 питомцев"); return; }
    if (pa.speciesId !== pb.speciesId) { toast("Нужны одинаковые!"); return; }
    const nextId = MERGE_NEXT[pa.speciesId];
    if (!nextId) { toast("Это уже максимум!"); return; }
    state.pets = state.pets.filter((p) => p.uid !== pa.uid && p.uid !== pb.uid);
    const np = { uid: Date.now(), speciesId: nextId, world: state.world, happy: 100, fed: 100 };
    state.pets.push(np);
    const discKey = state.world + ":" + nextId;
    if (!state.discovered.includes(discKey)) state.discovered.push(discKey);
    state.mergeA = state.mergeB = null;
    $("slot-a").textContent = "+";
    $("slot-b").textContent = "+";
    state.active = state.pets.length - 1;
    save();
    updateUI();
    showHatch(np);
    toast("✨ Новый вид из слияния!");
  }

  function renderWorlds() {
    const g = $("world-pick");
    g.innerHTML = "";
    WORLDS.forEach((w) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "world-btn" + (state.world === w.id ? " on" : "");
      btn.innerHTML = `<strong>${w.name}</strong><small>${w.sub}</small>`;
      btn.onclick = () => {
        document.querySelectorAll(".world-btn").forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        state.world = w.id;
        if (!state.pets.some((p) => (p.world || 1) === state.world)) state.pets.push(hatchRandom(0));
        save();
        updateUI();
        toast(w.name + "!");
      };
      g.appendChild(btn);
    });
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
      tab.classList.add("on");
      activeTab = tab.dataset.tab;
      $("panel-" + activeTab).classList.add("on");
      if (activeTab === "home") drawMap();
    };
  });

  $("act-feed").onclick = () => { care("feed"); teleportToZone("kitchen"); };
  $("act-wash").onclick = () => care("wash");
  $("act-play").onclick = () => { care("play"); teleportToZone("play"); };
  $("act-pet").onclick = () => care("pet");
  $("act-walk").onclick = () => goWalk();
  $("btn-merge").onclick = doMerge;
  $("hatch-ok").onclick = () => $("hatch-pop").classList.remove("on");
  $("slot-a").onclick = () => { const ap = activePet(); if (ap) setMergeSlot("a", ap.uid); };
  $("slot-b").onclick = () => { const ap = activePet(); if (ap) setMergeSlot("b", ap.uid); };

  setInterval(() => {
    state.pets.forEach((p) => {
      p.fed = Math.max(0, p.fed - 0.3);
      if (p.fed < 30) p.happy = Math.max(0, p.happy - 0.5);
    });
    save();
    updateUI();
  }, 8000);

  renderWorlds();
  setupMapInput();
  load();
  centerCamOnPet(false);
  updateUI();
  drawMap();
})();
