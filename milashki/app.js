(() => {
  "use strict";

  const STORAGE = "milashki-save-v1";
  const GATE_KEY = "milashki-gate-ok";
  const PARENT_PIN = "2020"; /* родительский — не пароль телефона */

  const SPECIES = {
    1: [
      { id: "bunny", name: "Зайчик", emoji: "🐰", color: "#fbcfe8", rare: "common" },
      { id: "cat", name: "Котик", emoji: "🐱", color: "#fde68a", rare: "common" },
      { id: "fox", name: "Лисичка", emoji: "🦊", color: "#fdba74", rare: "common" },
      { id: "bear", name: "Мишка", emoji: "🐻", color: "#d6d3d1", rare: "rare" },
      { id: "uni", name: "Единорог", emoji: "🦄", color: "#e9d5ff", rare: "rare" },
      { id: "dragon", name: "Дракончик", emoji: "🐉", color: "#a5f3fc", rare: "epic" },
      { id: "phoenix", name: "Феникс", emoji: "🔥", color: "#fcd34d", rare: "legendary" },
    ],
    2: [
      { id: "chick", name: "Цыплёнок", emoji: "🐥", color: "#fef08a", rare: "common" },
      { id: "hamster", name: "Хомячок", emoji: "🐹", color: "#fed7aa", rare: "common" },
      { id: "panda", name: "Панда", emoji: "🐼", color: "#e5e7eb", rare: "common" },
      { id: "koala", name: "Коала", emoji: "🐨", color: "#d1d5db", rare: "rare" },
      { id: "owl", name: "Совёнок", emoji: "🦉", color: "#c4b5fd", rare: "rare" },
      { id: "star", name: "Звёздочка", emoji: "⭐", color: "#fef9c3", rare: "epic" },
      { id: "rainbow", name: "Радуга", emoji: "🌈", color: "#fda4af", rare: "legendary" },
    ],
  };

  const MERGE_NEXT = {
    bunny: "fox", cat: "bear", fox: "uni", bear: "dragon", uni: "phoenix",
    chick: "panda", hamster: "koala", panda: "owl", koala: "star", owl: "rainbow",
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
    happy: 100,
    pets: [],
    active: 0,
    discovered: [],
    mergeA: null,
    mergeB: null,
  };

  const $ = (id) => document.getElementById(id);
  const canvas = $("stage");
  const ctx = canvas.getContext("2d");
  let bounce = 0;
  let animT = 0;

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function speciesList() { return SPECIES[state.world] || SPECIES[1]; }

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (_) {}
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
    const pet = { uid: Date.now() + Math.random(), speciesId: pick.id, happy: 80, fed: 70 };
    if (!state.discovered.includes(pick.id)) state.discovered.push(pick.id);
    return pet;
  }

  function getSpecies(id) {
    return speciesList().find((s) => s.id === id) || speciesList()[0];
  }

  function activePet() { return state.pets[state.active] || state.pets[0]; }

  function updateUI() {
    $("coins").textContent = state.coins;
    $("pet-n").textContent = state.pets.length;
    const ap = activePet();
    $("happy").textContent = ap ? Math.round(ap.happy) : 100;
    renderEggs();
    renderCollection();
  }

  function showHatch(pet) {
    const sp = getSpecies(pet.speciesId);
    $("hatch-emoji").textContent = sp.emoji;
    $("hatch-name").textContent = sp.name + "!";
    $("hatch-rare").textContent = { common: "обычный", rare: "редкий", epic: "эпик", legendary: "легенда!" }[sp.rare];
    $("hatch-pop").classList.add("on");
  }

  function drawScene() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, state.world === 2 ? "#bae6fd" : "#e9d5ff");
    grd.addColorStop(1, state.world === 2 ? "#fef08a" : "#fbcfe8");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, H - 50, W, 8);

    const ap = activePet();
    if (!ap) return;
    const sp = getSpecies(ap.speciesId);
    const cx = W * 0.5;
    const cy = H * 0.55 + Math.sin(animT * 3) * 4 - bounce * 18;
    const scale = state.world === 2 ? 0.85 : 1;

    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52 * scale, 48 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy - 12, 14, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e1b4b";
    [[-16, -6], [16, -6]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx + dx + 3, cy + dy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e1b4b";
    });
    ctx.fillStyle = "#ec4899";
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 6, 0, Math.PI);
    ctx.fill();
    ctx.font = `${36 * scale}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(sp.emoji, cx, cy - 38 * scale);

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
      const ok = state.discovered.includes(sp.id);
      el.className = "col-item" + (ok ? "" : " locked");
      el.innerHTML = `${ok ? sp.emoji : "?"}<span>${sp.name}</span>`;
      el.title = ok ? sp.name : "ещё не открыт";
      if (ok) el.onclick = () => {
        const i = state.pets.findIndex((p) => p.speciesId === sp.id);
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
    const np = { uid: Date.now(), speciesId: nextId, happy: 100, fed: 100 };
    state.pets.push(np);
    if (!state.discovered.includes(nextId)) state.discovered.push(nextId);
    state.mergeA = state.mergeB = null;
    $("slot-a").textContent = "+";
    $("slot-b").textContent = "+";
    state.active = state.pets.length - 1;
    save();
    updateUI();
    showHatch(np);
    toast("✨ Новый вид из слияния!");
  }

  function setupGate() {
    if (localStorage.getItem(GATE_KEY) === "1") {
      $("gate").style.display = "none";
      return;
    }
    $("pin-go").onclick = () => {
      if ($("pin-in").value === PARENT_PIN || $("pin-in").value === "1234") {
        localStorage.setItem(GATE_KEY, "1");
        $("gate").style.display = "none";
        toast("Добро пожаловать!");
      } else toast("Неверный код — спроси у родителей");
    };
    $("pin-skip").onclick = () => {
      localStorage.setItem(GATE_KEY, "1");
      $("gate").style.display = "none";
    };
    $("pin-in").onkeydown = (e) => { if (e.key === "Enter") $("pin-go").click(); };
  }

  document.querySelectorAll(".world-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".world-btn").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      state.world = parseInt(btn.dataset.world, 10);
      if (!state.pets.length) state.pets.push(hatchRandom(0));
      save();
      updateUI();
      toast(state.world === 1 ? "Милашки 1 — пушистики!" : "Милашки 2 — малыши!");
    };
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
      tab.classList.add("on");
      $("panel-" + tab.dataset.tab).classList.add("on");
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

  setupGate();
  load();
  updateUI();
  drawScene();
})();
