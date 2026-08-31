(() => {
  "use strict";

  const STORAGE = "milashki-save-v3";

  const WORLDS = [
    { id: 1, name: "Милашки 1", sub: "Fluvsies · пушистики", bg: ["#e9d5ff", "#fbcfe8"] },
    { id: 2, name: "Милашки 2", sub: "Smolsies · малыши", bg: ["#bae6fd", "#fef08a"] },
    { id: 3, name: "Милашки 3", sub: "Kpopsies · звёзды", bg: ["#f0abfc", "#fef08a"] },
    { id: 4, name: "Милашки 4", sub: "Pandalings · панды", bg: ["#bbf7d0", "#fde68a"] },
    { id: 5, name: "Милашки 5", sub: "Munchies · сладкие", bg: ["#fecdd3", "#fed7aa"] },
    { id: 6, name: "Милашки 6", sub: "Lil Babies · крошки", bg: ["#ddd6fe", "#fbcfe8"] },
  ];

  const SPECIES = [
    { id: "bunny", world: 1, name: "Зайчик", emoji: "🐰", color: "#fbcfe8", rare: "common", body: "fluff4" },
    { id: "cat", world: 1, name: "Котик", emoji: "🐱", color: "#fde68a", rare: "common", body: "fluff4" },
    { id: "fox", world: 1, name: "Лисичка", emoji: "🦊", color: "#fdba74", rare: "common", body: "fluff4" },
    { id: "bear", world: 1, name: "Мишка", emoji: "🐻", color: "#d6d3d1", rare: "rare", body: "fluff4" },
    { id: "uni", world: 1, name: "Единорог", emoji: "🦄", color: "#e9d5ff", rare: "rare", body: "fluff4" },
    { id: "dragon", world: 1, name: "Дракончик", emoji: "🐉", color: "#a5f3fc", rare: "epic", body: "fly" },
    { id: "phoenix", world: 1, name: "Феникс", emoji: "🔥", color: "#fcd34d", rare: "legendary", body: "fly" },

    { id: "chick", world: 2, name: "Цыплёнок", emoji: "🐥", color: "#fef08a", rare: "common", body: "hop" },
    { id: "hamster", world: 2, name: "Хомячок", emoji: "🐹", color: "#fed7aa", rare: "common", body: "blob" },
    { id: "panda", world: 2, name: "Панда", emoji: "🐼", color: "#e5e7eb", rare: "common", body: "blob" },
    { id: "koala", world: 2, name: "Коала", emoji: "🐨", color: "#d1d5db", rare: "rare", body: "blob" },
    { id: "owl", world: 2, name: "Совёнок", emoji: "🦉", color: "#c4b5fd", rare: "rare", body: "fly" },
    { id: "star", world: 2, name: "Звёздочка", emoji: "⭐", color: "#fef9c3", rare: "epic", body: "mini" },
    { id: "rainbow", world: 2, name: "Радуга", emoji: "🌈", color: "#fda4af", rare: "legendary", body: "mini" },

    { id: "pup", world: 3, name: "Щенок", emoji: "🐶", color: "#fde68a", rare: "common", body: "fluff4" },
    { id: "duck", world: 3, name: "Утёнок", emoji: "🦆", color: "#bae6fd", rare: "common", body: "hop" },
    { id: "frog", world: 3, name: "Лягушонок", emoji: "🐸", color: "#86efac", rare: "common", body: "hop" },
    { id: "penguin", world: 3, name: "Пингвин", emoji: "🐧", color: "#e5e7eb", rare: "rare", body: "hop" },
    { id: "butterfly", world: 3, name: "Бабочка", emoji: "🦋", color: "#f0abfc", rare: "rare", body: "fly" },
    { id: "fairy", world: 3, name: "Фея", emoji: "🧚", color: "#c4b5fd", rare: "epic", body: "fly" },
    { id: "crystal", world: 3, name: "Кристалл", emoji: "💎", color: "#67e8f9", rare: "legendary", body: "mini" },

    { id: "bamboo", world: 4, name: "Бамбук", emoji: "🎋", color: "#86efac", rare: "common", body: "hop" },
    { id: "redpanda", world: 4, name: "Красная панда", emoji: "🦊", color: "#fca5a5", rare: "common", body: "blob" },
    { id: "pandalil", world: 4, name: "Пандёнок", emoji: "🐼", color: "#f3f4f6", rare: "common", body: "blob" },
    { id: "leaf", world: 4, name: "Листочек", emoji: "🍃", color: "#bbf7d0", rare: "rare", body: "fly" },
    { id: "moon", world: 4, name: "Лунный", emoji: "🌙", color: "#e9d5ff", rare: "rare", body: "mini" },
    { id: "spirit", world: 4, name: "Дух леса", emoji: "🌿", color: "#6ee7b7", rare: "epic", body: "fly" },
    { id: "goldpanda", world: 4, name: "Золотая панда", emoji: "✨", color: "#fde047", rare: "legendary", body: "blob" },

    { id: "donut", world: 5, name: "Пончик", emoji: "🍩", color: "#fbcfe8", rare: "common", body: "blob" },
    { id: "cookie", world: 5, name: "Печенька", emoji: "🍪", color: "#d97706", rare: "common", body: "blob" },
    { id: "candy", world: 5, name: "Конфетка", emoji: "🍬", color: "#f472b6", rare: "common", body: "mini" },
    { id: "cupcake", world: 5, name: "Кексик", emoji: "🧁", color: "#fda4af", rare: "rare", body: "blob" },
    { id: "jelly", world: 5, name: "Желейка", emoji: "🟣", color: "#c4b5fd", rare: "rare", body: "blob" },
    { id: "icecream", world: 5, name: "Мороженое", emoji: "🍦", color: "#bae6fd", rare: "epic", body: "hop" },
    { id: "cake", world: 5, name: "Тортик", emoji: "🎂", color: "#fef08a", rare: "legendary", body: "blob" },

    { id: "baby1", world: 6, name: "Крошка", emoji: "👶", color: "#fecdd3", rare: "common", body: "mini" },
    { id: "baby2", world: 6, name: "Малыш", emoji: "🍼", color: "#bae6fd", rare: "common", body: "mini" },
    { id: "teddy", world: 6, name: "Плюшик", emoji: "🧸", color: "#d6d3d1", rare: "common", body: "blob" },
    { id: "cloud", world: 6, name: "Облачко", emoji: "☁️", color: "#f3f4f6", rare: "rare", body: "fly" },
    { id: "heart", world: 6, name: "Сердечко", emoji: "💗", color: "#fda4af", rare: "rare", body: "mini" },
    { id: "angel", world: 6, name: "Ангелочек", emoji: "😇", color: "#fef9c3", rare: "epic", body: "fly" },
    { id: "dream", world: 6, name: "Соня", emoji: "💤", color: "#ddd6fe", rare: "legendary", body: "mini" },
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

  const DECOR = [
    { id: "bed", icon: "🛏️", name: "Кроватка" },
    { id: "bowl", icon: "🍽️", name: "Миска" },
    { id: "toy", icon: "🧸", name: "Игрушка" },
    { id: "plant", icon: "🪴", name: "Цветок" },
    { id: "lamp", icon: "💡", name: "Лампа" },
    { id: "rug", icon: "🟣", name: "Коврик" },
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
    rooms: {},
  };

  const $ = (id) => document.getElementById(id);
  const canvas = $("stage");
  const ctx = canvas.getContext("2d");
  const roomCanvas = $("room");
  const roomCtx = roomCanvas ? roomCanvas.getContext("2d") : null;
  let bounce = 0;
  let animT = 0;
  let roomAnimT = 0;
  let drag = null;
  let activeTab = "home";

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function speciesList() { return SPECIES.filter((s) => s.world === state.world); }

  function getSpecies(id) {
    return SPECIES.find((s) => s.id === id) || speciesList()[0];
  }

  function worldInfo() { return WORLDS.find((w) => w.id === state.world) || WORLDS[0]; }

  function defaultRoom() {
    return {
      pet: { x: 0.5, y: 0.62 },
      items: [
        { id: "bed", x: 0.18, y: 0.72 },
        { id: "bowl", x: 0.72, y: 0.78 },
        { id: "toy", x: 0.42, y: 0.82 },
        { id: "plant", x: 0.88, y: 0.55 },
      ],
    };
  }

  function roomData() {
    const key = String(state.world);
    if (!state.rooms[key]) state.rooms[key] = defaultRoom();
    return state.rooms[key];
  }

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE) || localStorage.getItem("milashki-save-v2");
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (_) {}
    if (!state.rooms) state.rooms = {};
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
    const worldPets = state.pets.filter((p) => (p.world || state.world) === state.world);
    if (!worldPets.length) return null;
    const ap = state.pets[state.active];
    if (ap && (ap.world || state.world) === state.world) return ap;
    return worldPets[0];
  }

  function updateUI() {
    $("coins").textContent = state.coins;
    const worldPets = state.pets.filter((p) => (p.world || 1) === state.world);
    $("pet-n").textContent = worldPets.length;
    const ap = activePet();
    $("happy").textContent = ap ? Math.round(ap.happy) : 100;
    renderEggs();
    renderCollection();
    renderDecorPalette();
  }

  function showHatch(pet) {
    const sp = getSpecies(pet.speciesId);
    $("hatch-emoji").textContent = sp.emoji;
    $("hatch-name").textContent = sp.name + "!";
    $("hatch-rare").textContent = { common: "обычный", rare: "редкий", epic: "эпик", legendary: "легенда!" }[sp.rare];
    $("hatch-pop").classList.add("on");
  }

  function drawEyes(c, cx, cy, scale) {
    c.fillStyle = "#1e1b4b";
    [[-16, -6], [16, -6]].forEach(([dx, dy]) => {
      c.beginPath();
      c.arc(cx + dx, cy + dy, 9 * scale, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(cx + dx + 3, cy + dy - 3, 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#1e1b4b";
    });
    c.fillStyle = "#ec4899";
    c.beginPath();
    c.arc(cx, cy + 10, 6, 0, Math.PI);
    c.fill();
  }

  function drawPetBody(c, cx, cy, sp, scale, t) {
    const bob = Math.sin(t * 3) * 4;
    cy += bob;
    c.fillStyle = sp.color;

    if (sp.body === "fluff4") {
      c.beginPath();
      c.ellipse(cx, cy, 52 * scale, 48 * scale, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#4a044e";
      [[-28, 28], [28, 28], [-14, 32], [14, 32]].forEach(([dx, dy]) => {
        c.beginPath();
        c.ellipse(cx + dx, cy + dy, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
        c.fill();
      });
      c.fillStyle = "rgba(255,255,255,.35)";
      c.beginPath();
      c.ellipse(cx - 18, cy - 12, 14, 10, -0.3, 0, Math.PI * 2);
      c.fill();
      drawEyes.call({ fillStyle: c.fillStyle }, cx, cy, scale);
    } else if (sp.body === "hop") {
      c.beginPath();
      c.ellipse(cx, cy - 8, 44 * scale, 40 * scale, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = sp.color;
      [[-18, 22], [18, 22]].forEach(([dx, dy]) => {
        c.beginPath();
        c.ellipse(cx + dx, cy + dy, 14 * scale, 10 * scale, 0, 0, Math.PI * 2);
        c.fill();
      });
      drawEyes.call(null, cx, cy - 8, scale * 0.95);
    } else if (sp.body === "fly") {
      const float = Math.sin(t * 2) * 6;
      c.globalAlpha = 0.5;
      c.fillStyle = "#fff";
      [[-40, -10], [40, -10]].forEach(([dx, dy]) => {
        c.beginPath();
        c.ellipse(cx + dx, cy + dy + float, 18 * scale, 10 * scale, dx < 0 ? -0.4 : 0.4, 0, Math.PI * 2);
        c.fill();
      });
      c.globalAlpha = 1;
      c.fillStyle = sp.color;
      c.beginPath();
      c.ellipse(cx, cy + float, 40 * scale, 36 * scale, 0, 0, Math.PI * 2);
      c.fill();
      drawEyes.call(null, cx, cy + float, scale * 0.9);
    } else if (sp.body === "blob") {
      c.beginPath();
      c.ellipse(cx, cy, 50 * scale, 44 * scale, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255,255,255,.25)";
      c.beginPath();
      c.ellipse(cx - 12, cy - 14, 20, 14, -0.2, 0, Math.PI * 2);
      c.fill();
      drawEyes.call(null, cx, cy, scale * 0.85);
    } else {
      c.beginPath();
      c.ellipse(cx, cy, 36 * scale, 34 * scale, 0, 0, Math.PI * 2);
      c.fill();
      drawEyes.call(null, cx, cy, scale * 0.7);
    }

    c.font = `${(sp.body === "mini" ? 30 : 36) * scale}px serif`;
    c.textAlign = "center";
    c.fillText(sp.emoji, cx, cy - (sp.body === "mini" ? 30 : 38) * scale);
    return cy;
  }

  function drawScene() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const bg = worldInfo().bg;
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, bg[0]);
    grd.addColorStop(1, bg[1]);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, H - 50, W, 8);

    const ap = activePet();
    if (!ap) { requestAnimationFrame(drawScene); return; }
    const sp = getSpecies(ap.speciesId);
    const cx = W * 0.5;
    const scale = state.world === 2 || state.world === 6 ? 0.85 : state.world === 5 ? 0.95 : 1;
    const cy = drawPetBody(ctx, cx, H * 0.55 - bounce * 18, sp, scale, animT);

    if (ap.happy < 40) {
      ctx.font = "20px serif";
      ctx.fillText("😢", cx + 50, cy - 50);
    } else if (ap.happy > 85) {
      ctx.font = "18px serif";
      ctx.fillText("💕", cx - 50, cy - 48);
    }
    animT += 0.016;
    if (bounce > 0) bounce = Math.max(0, bounce - 0.06);
    requestAnimationFrame(drawScene);
  }

  function roomPointerPos(e) {
    const rect = roomCanvas.getBoundingClientRect();
    const sx = roomCanvas.width / rect.width;
    const sy = roomCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
      nx: (e.clientX - rect.left) / rect.width,
      ny: (e.clientY - rect.top) / rect.height,
    };
  }

  function hitRoomTarget(nx, ny) {
    const room = roomData();
    const pet = room.pet;
    if (Math.hypot(nx - pet.x, ny - pet.y) < 0.12) return { kind: "pet" };
    for (let i = room.items.length - 1; i >= 0; i--) {
      const it = room.items[i];
      if (Math.hypot(nx - it.x, ny - it.y) < 0.09) return { kind: "item", index: i };
    }
    return null;
  }

  function drawRoom() {
    if (!roomCtx) return;
    const W = roomCanvas.width;
    const H = roomCanvas.height;
    roomCtx.clearRect(0, 0, W, H);

    const bg = worldInfo().bg;
    const wall = roomCtx.createLinearGradient(0, 0, 0, H * 0.65);
    wall.addColorStop(0, bg[0]);
    wall.addColorStop(1, bg[1]);
    roomCtx.fillStyle = wall;
    roomCtx.fillRect(0, 0, W, H * 0.65);
    roomCtx.fillStyle = "#fde68a";
    roomCtx.fillRect(0, H * 0.65, W, H * 0.35);
    roomCtx.fillStyle = "#fbbf24";
    roomCtx.fillRect(0, H * 0.65, W, 6);

    roomCtx.fillStyle = "rgba(255,255,255,.5)";
    roomCtx.fillRect(W * 0.08, H * 0.12, W * 0.35, H * 0.22);
    roomCtx.strokeStyle = "#fff";
    roomCtx.lineWidth = 4;
    roomCtx.strokeRect(W * 0.08, H * 0.12, W * 0.35, H * 0.22);

    const room = roomData();
    room.items.forEach((it) => {
      const dec = DECOR.find((d) => d.id === it.id) || DECOR[0];
      const x = it.x * W;
      const y = it.y * H;
      const sel = drag && drag.kind === "item" && drag.index === room.items.indexOf(it);
      roomCtx.font = sel ? "42px serif" : "36px serif";
      roomCtx.textAlign = "center";
      roomCtx.textBaseline = "middle";
      roomCtx.fillText(dec.icon, x, y);
    });

    const ap = activePet();
    if (ap) {
      const sp = getSpecies(ap.speciesId);
      const px = room.pet.x * W;
      const py = room.pet.y * H;
      const sel = drag && drag.kind === "pet";
      drawPetBody(roomCtx, px, py, sp, sel ? 0.55 : 0.5, roomAnimT);
    }

    roomAnimT += 0.016;
    if (activeTab === "room") requestAnimationFrame(drawRoom);
  }

  function setupRoomDrag() {
    if (!roomCanvas) return;

    roomCanvas.addEventListener("pointerdown", (e) => {
      roomCanvas.setPointerCapture(e.pointerId);
      const p = roomPointerPos(e);
      const hit = hitRoomTarget(p.nx, p.ny);
      if (hit) {
        drag = hit;
        drag.offsetX = p.nx - (hit.kind === "pet" ? roomData().pet.x : roomData().items[hit.index].x);
        drag.offsetY = p.ny - (hit.kind === "pet" ? roomData().pet.y : roomData().items[hit.index].y);
      }
    });

    roomCanvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = roomPointerPos(e);
      const nx = Math.max(0.06, Math.min(0.94, p.nx - (drag.offsetX || 0)));
      const ny = Math.max(0.2, Math.min(0.92, p.ny - (drag.offsetY || 0)));
      const room = roomData();
      if (drag.kind === "pet") {
        room.pet.x = nx;
        room.pet.y = ny;
      } else if (drag.kind === "item") {
        room.items[drag.index].x = nx;
        room.items[drag.index].y = ny;
      }
    });

    const endDrag = () => {
      if (drag) { save(); drag = null; }
    };
    roomCanvas.addEventListener("pointerup", endDrag);
    roomCanvas.addEventListener("pointercancel", endDrag);
  }

  function renderDecorPalette() {
    const g = $("decor-palette");
    if (!g) return;
    g.innerHTML = "";
    DECOR.forEach((dec) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "decor-btn";
      btn.textContent = dec.icon;
      btn.title = dec.name;
      btn.onclick = () => {
        const room = roomData();
        room.items.push({ id: dec.id, x: 0.3 + Math.random() * 0.4, y: 0.5 + Math.random() * 0.25 });
        save();
        toast(dec.name + " в комнате — тяни пальцем!");
        drawRoom();
      };
      g.appendChild(btn);
    });
  }

  function care(kind) {
    const ap = activePet();
    if (!ap) return;
    if (kind === "feed") { ap.fed = Math.min(100, ap.fed + 25); ap.happy = Math.min(100, ap.happy + 8); state.coins += 2; toast("Ням-ням! +2 монеты"); }
    if (kind === "wash") { ap.happy = Math.min(100, ap.happy + 15); toast("Блестит! ✨"); }
    if (kind === "play") { ap.happy = Math.min(100, ap.happy + 20); state.coins += 5; bounce = 1; toast("Играем! +5 монет"); }
    if (kind === "pet") { ap.happy = Math.min(100, ap.happy + 10); bounce = 0.6; toast("Мур-мур…"); }
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
      el.innerHTML = `${ok ? sp.emoji : "?"}<span>${sp.name}</span>`;
      el.title = ok ? sp.name : "ещё не открыт";
      if (ok) el.onclick = () => {
        const i = state.pets.findIndex((p) => p.speciesId === sp.id && (p.world || state.world) === state.world);
        if (i >= 0) { state.active = i; toast("Выбран: " + sp.name); save(); }
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
      btn.dataset.world = w.id;
      btn.innerHTML = `<strong>${w.name}</strong><small>${w.sub}</small>`;
      btn.onclick = () => {
        document.querySelectorAll(".world-btn").forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        state.world = w.id;
        const hasPet = state.pets.some((p) => (p.world || 1) === state.world);
        if (!hasPet) state.pets.push(hatchRandom(0));
        save();
        updateUI();
        toast(w.name + "!");
        if (activeTab === "room") drawRoom();
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
      if (activeTab === "room") drawRoom();
    };
  });

  $("act-feed").onclick = () => care("feed");
  $("act-wash").onclick = () => care("wash");
  $("act-play").onclick = () => care("play");
  $("act-pet").onclick = () => care("pet");
  $("btn-merge").onclick = doMerge;
  $("hatch-ok").onclick = () => $("hatch-pop").classList.remove("on");

  $("slot-a").onclick = () => {
    const ap = activePet();
    if (ap) setMergeSlot("a", ap.uid);
  };
  $("slot-b").onclick = () => {
    const ap = activePet();
    if (ap) setMergeSlot("b", ap.uid);
  };

  canvas.onclick = () => { bounce = 1; care("pet"); };

  setInterval(() => {
    state.pets.forEach((p) => {
      p.fed = Math.max(0, p.fed - 0.3);
      if (p.fed < 30) p.happy = Math.max(0, p.happy - 0.5);
    });
    save();
    updateUI();
  }, 8000);

  renderWorlds();
  setupRoomDrag();
  load();
  updateUI();
  drawScene();
})();
