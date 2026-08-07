(() => {
  const { Engine, World, Bodies, Body, Constraint } = Matter;

  const ROUND_SEC = 120;
  const ARENA_DIAM_M = 56;
  const METER = 11;
  const ARENA_R = (ARENA_DIAM_M / 2) * METER;
  const PLAYER_R = 26;
  const STUN_SEC = 2.2;
  const FLIP_SEC = 3.5;
  const STUN_CD = 2.8;
  const CUT_CD = 1.4;
  const GRAB_RANGE = 56;
  const DROP_EDGE = ARENA_R + 40;
  const THROW_POWER = 0.055;
  const WORLD_ITEMS = 50;
  const CARDS_EACH = 10;

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

  function isGodP(p) {
    return amalGod() && p && p.i === 0;
  }

  // Пластилиновые «леденцы» как Gang Beasts / Human Fall Flat
  const CHARACTERS = [
    { id: "lime", name: "Лайм", emoji: "🟢", color: "#7CFC00", shade: "#4cae00", blush: "#c8ff7a" },
    { id: "pink", name: "Розовый", emoji: "🩷", color: "#FF69B4", shade: "#d4488e", blush: "#ffb6d9" },
    { id: "cyan", name: "Бирюза", emoji: "🩵", color: "#22d3ee", shade: "#0891b2", blush: "#a5f3fc" },
    { id: "yellow", name: "Жёлтый", emoji: "🟡", color: "#fde047", shade: "#ca8a04", blush: "#fef9c3" },
    { id: "red", name: "Красный", emoji: "🔴", color: "#ef4444", shade: "#b91c1c", blush: "#fca5a5" },
    { id: "blue", name: "Синий", emoji: "🔵", color: "#3b82f6", shade: "#1d4ed8", blush: "#93c5fd" },
    { id: "orange", name: "Оранж", emoji: "🟠", color: "#fb923c", shade: "#c2410c", blush: "#fdba74" },
    { id: "purple", name: "Фиолет", emoji: "🟣", color: "#a855f7", shade: "#7e22ce", blush: "#d8b4fe" },
    { id: "mint", name: "Мята", emoji: "🟢", color: "#34d399", shade: "#059669", blush: "#a7f3d0" },
    { id: "coral", name: "Коралл", emoji: "🪸", color: "#fb7185", shade: "#e11d48", blush: "#fecdd3" },
    { id: "sky", name: "Небо", emoji: "💠", color: "#38bdf8", shade: "#0284c7", blush: "#bae6fd" },
    { id: "lemon", name: "Лимон", emoji: "🍋", color: "#facc15", shade: "#a16207", blush: "#fef08a" },
    { id: "grape", name: "Виноград", emoji: "🍇", color: "#8b5cf6", shade: "#5b21b6", blush: "#c4b5fd" },
    { id: "teal", name: "Тиль", emoji: "🦚", color: "#14b8a6", shade: "#0f766e", blush: "#99f6e4" },
    { id: "magenta", name: "Маджента", emoji: "💗", color: "#e879f9", shade: "#a21caf", blush: "#f5d0fe" },
    { id: "amber", name: "Янтарь", emoji: "🧡", color: "#f59e0b", shade: "#b45309", blush: "#fcd34d" },
    { id: "indigo", name: "Индиго", emoji: "🔵", color: "#6366f1", shade: "#3730a3", blush: "#a5b4fc" },
    { id: "jade", name: "Нефрит", emoji: "🟢", color: "#10b981", shade: "#047857", blush: "#6ee7b7" },
    { id: "salmon", name: "Лосось", emoji: "🩷", color: "#fdba74", shade: "#ea580c", blush: "#ffedd5" },
    { id: "ice", name: "Лёд", emoji: "❄️", color: "#e0f2fe", shade: "#7dd3fc", blush: "#ffffff" },
  ];

  const CARD_THEMES = [
    { id: "fire", name: "Огонь", emoji: "🔥", special: false },
    { id: "ice", name: "Лёд", emoji: "❄️", special: false },
    { id: "storm", name: "Шторм", emoji: "⛈️", special: false },
    { id: "earth", name: "Земля", emoji: "🌍", special: false },
    { id: "ocean", name: "Океан", emoji: "🌊", special: false },
    { id: "forest", name: "Лес", emoji: "🌲", special: false },
    { id: "desert", name: "Пустыня", emoji: "🏜️", special: false },
    { id: "mountain", name: "Горы", emoji: "⛰️", special: false },
    { id: "volcano", name: "Вулкан", emoji: "🌋", special: false },
    { id: "moon", name: "Луна", emoji: "🌙", special: false },
    { id: "sun", name: "Солнце", emoji: "☀️", special: false },
    { id: "star", name: "Звезда", emoji: "⭐", special: false },
    { id: "comet", name: "Комета", emoji: "☄️", special: false },
    { id: "crystal", name: "Кристалл", emoji: "💎", special: false },
    { id: "sword", name: "Меч", emoji: "⚔️", special: false },
    { id: "shield", name: "Щит", emoji: "🛡️", special: false },
    { id: "bow", name: "Лук", emoji: "🏹", special: false },
    { id: "hammer", name: "Молот", emoji: "🔨", special: false },
    { id: "key", name: "Ключ", emoji: "🔑", special: false },
    { id: "chest", name: "Сундук", emoji: "🧰", special: false },
    { id: "crown", name: "Корона", emoji: "👑", special: false },
    { id: "mask", name: "Маска", emoji: "🎭", special: false },
    { id: "clock", name: "Часы", emoji: "⏰", special: false },
    { id: "compass", name: "Компас", emoji: "🧭", special: false },
    { id: "map", name: "Карта", emoji: "🗺️", special: false },
    { id: "scroll", name: "Свиток", emoji: "📜", special: false },
    { id: "potion", name: "Зелье", emoji: "🧪", special: false },
    { id: "bomb", name: "Бомба", emoji: "💣", special: false },
    { id: "magnet", name: "Магнит", emoji: "🧲", special: false },
    { id: "robot", name: "Робот", emoji: "🤖", special: false },
    { id: "ghost", name: "Призрак", emoji: "👻", special: false },
    { id: "dragon", name: "Дракон", emoji: "🐉", special: false },
    { id: "wolf", name: "Волк", emoji: "🐺", special: false },
    { id: "eagle", name: "Орёл", emoji: "🦅", special: false },
    { id: "shark", name: "Акула", emoji: "🦈", special: false },
    { id: "bee", name: "Пчела", emoji: "🐝", special: false },
    { id: "fox", name: "Лиса", emoji: "🦊", special: false },
    { id: "owl", name: "Сова", emoji: "🦉", special: false },
    { id: "castle", name: "Замок", emoji: "🏰", special: false },
    { id: "bridge", name: "Мост", emoji: "🌉", special: false },
    { id: "train", name: "Поезд", emoji: "🚂", special: false },
    { id: "ship", name: "Корабль", emoji: "🚢", special: false },
    { id: "plane", name: "Самолёт", emoji: "✈️", special: false },
    { id: "bike", name: "Вело", emoji: "🚲", special: false },
    { id: "music", name: "Музыка", emoji: "🎵", special: false },
    { id: "paint", name: "Краска", emoji: "🎨", special: false },
    { id: "camera", name: "Камера", emoji: "📷", special: false },
    { id: "book", name: "Книга", emoji: "📚", special: false },
    { id: "candy", name: "Конфета", emoji: "🍬", special: false },
    { id: "coin", name: "Монета", emoji: "🪙", special: false },
  ];

  const SPECIAL_CARDS = [
    {
      id: "death",
      name: "Карта смерти",
      emoji: "💀",
      special: true,
      kind: "death",
      desc: "Переверни → разрежь → положи на карту — враг погибает",
    },
    {
      id: "steal",
      name: "Кража",
      emoji: "🃏",
      special: true,
      kind: "steal",
      desc: "При захвате сразу забираешь чужую карту",
    },
    {
      id: "shield_sp",
      name: "Защита",
      emoji: "🔰",
      special: true,
      kind: "shield",
      desc: "Один раз блокирует смерть",
    },
    {
      id: "rush",
      name: "Рывок",
      emoji: "⚡",
      special: true,
      kind: "rush",
      desc: "Сильный толчок при броске",
    },
  ];

  const ITEM_TYPES = [
    { id: "rock", name: "Камень", emoji: "🪨", throwMul: 1.1 },
    { id: "box", name: "Ящик", emoji: "📦", throwMul: 0.9 },
    { id: "barrel", name: "Бочка", emoji: "🛢️", throwMul: 1 },
    { id: "ball", name: "Мяч", emoji: "⚽", throwMul: 1.3 },
    { id: "anvil", name: "Наковальня", emoji: "⚒️", throwMul: 0.7 },
    { id: "log", name: "Бревно", emoji: "🪵", throwMul: 0.95 },
    { id: "pot", name: "Горшок", emoji: "🪴", throwMul: 1 },
    { id: "crate", name: "Коробка", emoji: "🧳", throwMul: 1 },
    { id: "torch", name: "Факел", emoji: "🔦", throwMul: 1.15 },
    { id: "bucket", name: "Ведро", emoji: "🪣", throwMul: 1.05 },
    { id: "chain", name: "Цепь", emoji: "⛓️", throwMul: 1 },
    { id: "spear", name: "Копьё", emoji: "🔱", throwMul: 1.25 },
    { id: "net", name: "Сеть", emoji: "🕸️", throwMul: 0.85 },
    { id: "apple", name: "Яблоко", emoji: "🍎", throwMul: 1.2 },
    { id: "bone", name: "Кость", emoji: "🦴", throwMul: 1.1 },
    { id: "gem", name: "Самоцвет", emoji: "💠", throwMul: 1 },
    { id: "lantern", name: "Фонарь", emoji: "🏮", throwMul: 1 },
    { id: "anchor", name: "Якорь", emoji: "⚓", throwMul: 0.65 },
    { id: "flag", name: "Флаг", emoji: "🚩", throwMul: 1.1 },
    { id: "drum", name: "Барабан", emoji: "🥁", throwMul: 0.95 },
  ];

  const SLOT_DEFS = [
    {
      name: "Игрок 1",
      color: "#ef4444",
      keys: {
        up: "KeyW",
        down: "KeyS",
        left: "KeyA",
        right: "KeyD",
        grab: "KeyE",
        flip: "KeyQ",
        cut: "KeyF",
        throw: "KeyR",
      },
      label: "WASD · E захват · Q переворот · F рез · R бросок",
    },
    {
      name: "Игрок 2",
      color: "#3b82f6",
      keys: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        grab: "Enter",
        flip: "ShiftLeft",
        cut: "Slash",
        throw: "Period",
      },
      label: "Стрелки · Enter захват · Shift переворот · / рез · . бросок",
    },
    {
      name: "Игрок 3",
      color: "#22c55e",
      keys: {
        up: "KeyI",
        down: "KeyK",
        left: "KeyJ",
        right: "KeyL",
        grab: "KeyU",
        flip: "KeyO",
        cut: "KeyP",
        throw: "KeyY",
      },
      label: "IJKL · U захват · O переворот · P рез · Y бросок",
    },
    {
      name: "Игрок 4",
      color: "#eab308",
      keys: {
        up: "Numpad8",
        down: "Numpad5",
        left: "Numpad4",
        right: "Numpad6",
        grab: "Numpad7",
        flip: "Numpad9",
        cut: "Numpad1",
        throw: "Numpad3",
      },
      label: "Num 8456 · 7 захват · 9 переворот · 1 рез · 3 бросок",
    },
  ];

  const app = document.getElementById("app");
  const keys = Object.create(null);
  let playerCount = 4;
  let selectedChars = [0, 1, 2, 3];
  let mode = "lobby";
  let engine = null;
  let world = null;
  let canvas = null;
  let ctx = null;
  let players = [];
  let looseCards = [];
  let looseItems = [];
  let raf = 0;
  let lastTs = 0;
  let timeLeft = ROUND_SEC;
  let cx = 0;
  let cy = 0;
  let ended = false;
  let toast = "";
  let toastT = 0;
  let matchAge = 0;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showToast(msg, sec = 2.2) {
    toast = msg;
    toastT = sec;
  }

  function dealCards(count) {
    const hands = Array.from({ length: count }, () => []);
    for (let i = 0; i < count; i++) {
      hands[i].push({
        ...SPECIAL_CARDS[0],
        uid: `death-start-${i}`,
      });
      const extras = shuffle([...CARD_THEMES, ...SPECIAL_CARDS.slice(1)]);
      for (let n = 0; n < CARDS_EACH - 1; n++) {
        const t = extras[n % extras.length];
        hands[i].push({ ...t, uid: `${t.id}-${i}-${n}` });
      }
    }
    return hands;
  }

  function showLobby() {
    mode = "lobby";
    stopLoop();
    clearWorld();
    app.innerHTML = `
      <div class="screen scrollable">
        <h1>Бой на глобусе</h1>
        <p class="lead">Арена <strong>${ARENA_DIAM_M}&nbsp;м</strong>. Пластилиновые леденцы (как Gang Beasts). До 4 игроков. 10 карт + 50 предметов. Спецкарта смерти: переверни → разрежь → положи на карту.</p>
        <div class="player-pick" id="pick">
          <button type="button" data-n="2">2 игрока</button>
          <button type="button" data-n="3">3 игрока</button>
          <button type="button" data-n="4" class="active">4 игрока</button>
        </div>
        <div class="char-setup" id="char-setup"></div>
        <div class="controls-hint" id="hints"></div>
        <button type="button" class="btn-start" id="start">Начать бой</button>
      </div>
    `;
    const pick = app.querySelector("#pick");
    const hints = app.querySelector("#hints");
    const setup = app.querySelector("#char-setup");

    const renderHints = () => {
      hints.innerHTML = SLOT_DEFS.slice(0, playerCount)
        .map((p, i) => `<div><strong>${i + 1}. ${p.name}:</strong> ${p.label}</div>`)
        .join("");
    };

    const renderChars = () => {
      setup.innerHTML = SLOT_DEFS.slice(0, playerCount)
        .map((slot, si) => {
          const cur = selectedChars[si] % CHARACTERS.length;
          const cards = CHARACTERS.map(
            (c, ci) =>
              `<button type="button" class="char-btn clay${ci === cur ? " active" : ""}" data-slot="${si}" data-char="${ci}" title="${c.name}" style="--c:${c.color};--s:${c.shade}">
                <span class="clay-preview" aria-hidden="true"></span>
              </button>`
          ).join("");
          return `<div class="char-row"><span class="char-slot" style="color:${slot.color}">${slot.name}</span><div class="char-grid">${cards}</div></div>`;
        })
        .join("");
    };

    renderHints();
    renderChars();

    pick.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-n]");
      if (!btn) return;
      playerCount = Number(btn.dataset.n);
      pick.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      renderHints();
      renderChars();
    });

    setup.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-char]");
      if (!btn) return;
      const slot = Number(btn.dataset.slot);
      const char = Number(btn.dataset.char);
      selectedChars[slot] = char;
      renderChars();
    });

    app.querySelector("#start").addEventListener("click", () => startMatch(playerCount));
  }

  function clearWorld() {
    if (engine) {
      Engine.clear(engine);
      engine = null;
      world = null;
    }
    players = [];
    looseCards = [];
    looseItems = [];
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function startMatch(count) {
    mode = "play";
    ended = false;
    timeLeft = ROUND_SEC;
    matchAge = 0;
    clearWorld();

    app.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <div class="hud">
        <div class="hud-top">
          <div class="hud-title">Бой на глобусе · ${ARENA_DIAM_M} м</div>
          <div class="hud-timer" id="timer">${ROUND_SEC}с</div>
        </div>
        <div class="score-row" id="scores"></div>
        <div class="toast" id="toast"></div>
        <div class="hud-actions">
          <button type="button" id="btn-restart">Заново</button>
          <button type="button" id="btn-menu">Меню</button>
        </div>
      </div>
      <div class="overlay hidden" id="end-overlay">
        <div class="overlay-card">
          <h2 id="end-title">Раунд окончен</h2>
          <p id="end-desc"></p>
          <div class="winners" id="end-winners"></div>
          <button type="button" id="end-again">Ещё раз</button>
          <button type="button" class="ghost" id="end-menu">В меню</button>
        </div>
      </div>
    `;

    canvas = app.querySelector("#game-canvas");
    ctx = canvas.getContext("2d");
    resize();

    engine = Engine.create({ gravity: { x: 0, y: 0 } });
    world = engine.world;

    const hands = dealCards(count);
    const angles = Array.from({ length: count }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / count);

    players = SLOT_DEFS.slice(0, count).map((slot, i) => {
      const ch = CHARACTERS[selectedChars[i] % CHARACTERS.length];
      const ang = angles[i];
      const dist = ARENA_R * 0.42;
      const x = cx + Math.cos(ang) * dist;
      const y = cy + Math.sin(ang) * dist;
      const body = Bodies.circle(x, y, PLAYER_R, {
        frictionAir: 0.11,
        restitution: 0.5,
        density: 0.004,
        label: `player-${i}`,
      });
      World.add(world, body);
      return {
        i,
        slot,
        char: ch,
        body,
        cards: hands[i],
        stunT: 0,
        flipT: 0,
        cutMarked: false,
        stunCd: 0,
        cutCd: 0,
        grabHeld: false,
        flipHeld: false,
        cutHeld: false,
        throwHeld: false,
        grabTarget: null,
        grabConstraint: null,
        alive: true,
        dead: false,
        fallFlash: 0,
        shieldCharges: hands[i].some((c) => c.kind === "shield") ? 1 : 0,
      };
    });

    spawnWorldCards(12);
    spawnWorldItems(WORLD_ITEMS);
    updateScores();
    showToast("Карта смерти у каждого. Переверни → разрежь → положи на 💀");

    app.querySelector("#btn-restart").addEventListener("click", () => startMatch(count));
    app.querySelector("#btn-menu").addEventListener("click", showLobby);
    app.querySelector("#end-again").addEventListener("click", () => startMatch(count));
    app.querySelector("#end-menu").addEventListener("click", showLobby);

    lastTs = performance.now();
    loop(lastTs);
  }

  function spawnWorldCards(n) {
    const pool = shuffle([...CARD_THEMES, ...SPECIAL_CARDS]);
    for (let k = 0; k < n; k++) {
      const theme = pool[k % pool.length];
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * (ARENA_R * 0.7);
      addLooseCard({ ...theme, uid: `world-card-${k}-${Date.now()}` }, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
    }
  }

  function spawnWorldItems(n) {
    for (let k = 0; k < n; k++) {
      const t = ITEM_TYPES[k % ITEM_TYPES.length];
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * (ARENA_R * 0.78);
      addLooseItem({ ...t, uid: `item-${k}` }, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
    }
  }

  function addLooseCard(card, x, y) {
    const body = Bodies.circle(x, y, card.special ? 16 : 13, {
      frictionAir: 0.08,
      restitution: 0.35,
      density: 0.0014,
      label: "card",
    });
    body.plugin = { card };
    World.add(world, body);
    looseCards.push({ body, card });
  }

  function addLooseItem(item, x, y) {
    const body = Bodies.circle(x, y, 12, {
      frictionAir: 0.06,
      restitution: 0.45,
      density: 0.002,
      label: "item",
    });
    body.plugin = { item };
    World.add(world, body);
    looseItems.push({ body, item });
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = app.clientWidth;
    const h = app.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2 + 8;
  }

  function hasDeathCard(p) {
    return p.cards.some((c) => c.kind === "death");
  }

  function consumeDeathCard(p) {
    const idx = p.cards.findIndex((c) => c.kind === "death");
    if (idx < 0) return false;
    p.cards.splice(idx, 1);
    return true;
  }

  function updateScores() {
    const el = app.querySelector("#scores");
    if (!el) return;
    el.innerHTML = players
      .map((p) => {
        let state = "";
        if (p.dead) state = " · мёртв";
        else if (!p.alive) state = " · вне";
        else if (p.flipT > 0) state = ` · перевёрнут ${p.flipT.toFixed(1)}с`;
        else if (p.stunT > 0) state = ` · оглуш. ${p.stunT.toFixed(1)}с`;
        if (p.cutMarked && !p.dead) state += " · разрезан";
        const death = hasDeathCard(p) ? " 💀" : "";
        return `<div class="score-pill${p.dead ? " dead" : ""}${p.flipT > 0 ? " flip" : ""}" style="border-color:${p.char.color}">
          <span class="dot" style="background:${p.char.color}"></span>
          ${p.char.emoji} ${p.char.name}: ${p.cards.length} карт${death}${state}
        </div>`;
      })
      .join("");
    const t = app.querySelector("#toast");
    if (t) {
      t.textContent = toastT > 0 ? toast : "";
      t.classList.toggle("show", toastT > 0);
    }
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function releaseGrab(p) {
    if (p.grabConstraint) {
      World.remove(world, p.grabConstraint);
      p.grabConstraint = null;
    }
    p.grabTarget = null;
  }

  function tryGrab(p) {
    if (!p.alive || p.dead || p.stunT > 0 || p.flipT > 0) return;
    const pos = p.body.position;
    let best = null;
    let bestD = GRAB_RANGE;

    for (const other of players) {
      if (other === p || !other.alive || other.dead) continue;
      const d = dist(pos, other.body.position);
      if (d < bestD) {
        bestD = d;
        best = { type: "player", ref: other };
      }
    }
    for (const lc of looseCards) {
      const d = dist(pos, lc.body.position);
      if (d < bestD) {
        bestD = d;
        best = { type: "card", ref: lc };
      }
    }
    for (const li of looseItems) {
      const d = dist(pos, li.body.position);
      if (d < bestD) {
        bestD = d;
        best = { type: "item", ref: li };
      }
    }
    if (!best) return;

    releaseGrab(p);
    const targetBody = best.ref.body;
    p.grabTarget = best;
    p.grabConstraint = Constraint.create({
      bodyA: p.body,
      bodyB: targetBody,
      length: best.type === "player" ? PLAYER_R * 2 + 8 : PLAYER_R + 16,
      stiffness: 0.09,
      damping: 0.05,
    });
    World.add(world, p.grabConstraint);

    if (best.type === "player" && best.ref.cards.length) {
      const stolen = best.ref.cards.pop();
      addLooseCard(stolen, best.ref.body.position.x, best.ref.body.position.y - 26);
      if (p.cards.some((c) => c.kind === "steal")) showToast(`${p.char.name} сорвал карту (кража)!`);
      updateScores();
    }
  }

  function tryThrow(p) {
    if (!p.grabTarget || !p.grabConstraint) return;
    const target = p.grabTarget;
    const k = p.slot.keys;
    let fx = 0;
    let fy = 0;
    if (keys[k.up]) fy -= 1;
    if (keys[k.down]) fy += 1;
    if (keys[k.left]) fx -= 1;
    if (keys[k.right]) fx += 1;
    if (!fx && !fy) {
      const ang = Math.atan2(target.ref.body.position.y - p.body.position.y, target.ref.body.position.x - p.body.position.x);
      fx = Math.cos(ang);
      fy = Math.sin(ang);
    }
    const len = Math.hypot(fx, fy) || 1;
    let mul = 1;
    if (target.type === "item") mul = target.ref.item.throwMul || 1;
    if (p.cards.some((c) => c.kind === "rush")) mul *= 1.45;
    releaseGrab(p);
    Body.applyForce(target.ref.body, target.ref.body.position, {
      x: (fx / len) * THROW_POWER * mul,
      y: (fy / len) * THROW_POWER * mul,
    });
    showToast(`${p.char.name} бросил!`);
  }

  function tryFlip(p) {
    if (matchAge < 0.6) return;
    if (!p.alive || p.dead || p.stunT > 0 || p.flipT > 0 || p.stunCd > 0) return;
    const pos = p.body.position;
    let hit = null;
    let bestD = (isGodP(p) ? GRAB_RANGE * 2.2 : GRAB_RANGE) + 10;
    for (const other of players) {
      if (other === p || !other.alive || other.dead || other.flipT > 0) continue;
      if (isGodP(other)) continue;
      const d = dist(pos, other.body.position);
      if (d < bestD) {
        bestD = d;
        hit = other;
      }
    }
    if (!hit) return;
    hit.flipT = FLIP_SEC;
    hit.stunT = Math.max(hit.stunT, 0.8);
    p.stunCd = STUN_CD;
    releaseGrab(hit);
    Body.setAngularVelocity(hit.body, 0.35);
    Body.setVelocity(hit.body, { x: 0, y: 0 });
    showToast(`${hit.char.name} перевёрнут! Разрежь (рез), потом карта смерти`);
    updateScores();
  }

  function tryCut(p) {
    if (!p.alive || p.dead || p.cutCd > 0) return;
    const pos = p.body.position;
    let hit = null;
    let bestD = (isGodP(p) ? GRAB_RANGE * 2.2 : GRAB_RANGE) + 6;
    for (const other of players) {
      if (other === p || !other.alive || other.dead) continue;
      if (isGodP(other)) continue;
      const d = dist(pos, other.body.position);
      if (d < bestD) {
        bestD = d;
        hit = other;
      }
    }
    if (!hit) return;
    p.cutCd = CUT_CD;
    if (hit.flipT > 0) {
      hit.cutMarked = true;
      showToast(`${hit.char.name} разрезан! Положи на карту смерти 💀`);
      tryPlaceOnDeathCard(p, hit);
    } else {
      hit.stunT = STUN_SEC;
      showToast(`${hit.char.name} ранен — сначала переверни`);
    }
    updateScores();
  }

  function tryPlaceOnDeathCard(attacker, victim) {
    if (!victim.cutMarked || victim.flipT <= 0 || victim.dead) return false;

    const nearDeathLoose = looseCards.find(
      (lc) => lc.card.kind === "death" && dist(victim.body.position, lc.body.position) < GRAB_RANGE + 20
    );
    const useHand = hasDeathCard(attacker);
    if (!nearDeathLoose && !useHand) {
      showToast("Нужна карта смерти рядом или в руке");
      return false;
    }

    if (victim.shieldCharges > 0 || victim.cards.some((c) => c.kind === "shield")) {
      victim.shieldCharges = 0;
      const si = victim.cards.findIndex((c) => c.kind === "shield");
      if (si >= 0) victim.cards.splice(si, 1);
      victim.cutMarked = false;
      victim.flipT = 0;
      showToast(`${victim.char.name} спасён защитой!`);
      updateScores();
      return false;
    }

    if (useHand) consumeDeathCard(attacker);
    if (nearDeathLoose) {
      World.remove(world, nearDeathLoose.body);
      looseCards = looseCards.filter((x) => x !== nearDeathLoose);
    }

    killPlayer(victim, attacker);
    return true;
  }

  function killPlayer(victim, killer) {
    if (victim.dead) return;
    if (isGodP(victim)) {
      victim.cutMarked = false;
      victim.flipT = 0;
      showToast(`${victim.char.name} бессмертен (хозяин)!`);
      return;
    }
    victim.dead = true;
    victim.alive = false;
    victim.cutMarked = false;
    victim.flipT = 0;
    releaseGrab(victim);
    for (const p of players) {
      if (p.grabTarget && p.grabTarget.type === "player" && p.grabTarget.ref === victim) releaseGrab(p);
    }
    while (victim.cards.length) {
      const c = victim.cards.pop();
      const ang = Math.random() * Math.PI * 2;
      addLooseCard(c, victim.body.position.x + Math.cos(ang) * 30, victim.body.position.y + Math.sin(ang) * 30);
    }
    World.remove(world, victim.body);
    showToast(`${killer.char.name} положил ${victim.char.name} на карту смерти!`);
    updateScores();
    checkAliveWin();
  }

  function pickUpNearbyCards(p) {
    if (!p.alive || p.dead || p.stunT > 0 || p.flipT > 0) return;
    const pos = p.body.position;
    for (let i = looseCards.length - 1; i >= 0; i--) {
      const lc = looseCards[i];
      if (dist(pos, lc.body.position) < PLAYER_R + 16) {
        if (p.grabTarget && p.grabTarget.type === "card" && p.grabTarget.ref === lc) releaseGrab(p);
        p.cards.push(lc.card);
        if (lc.card.kind === "shield") p.shieldCharges = 1;
        World.remove(world, lc.body);
        looseCards.splice(i, 1);
        updateScores();
      }
    }
  }

  function checkDeathPlacement(p) {
    if (!p.alive || p.dead) return;
    for (const other of players) {
      if (other === p || other.dead || !other.alive) continue;
      if (other.cutMarked && other.flipT > 0 && dist(p.body.position, other.body.position) < GRAB_RANGE) {
        tryPlaceOnDeathCard(p, other);
      }
    }
  }

  function handleFall(p) {
    if (!p.alive || p.dead) return;
    const d = dist(p.body.position, { x: cx, y: cy });
    if (d <= DROP_EDGE) return;
    if (isGodP(p)) {
      Body.setPosition(p.body, { x: cx, y: cy });
      Body.setVelocity(p.body, { x: 0, y: 0 });
      showToast("Хозяин вернулся на арену!");
      return;
    }
    p.alive = false;
    releaseGrab(p);
    if (p.cards.length) {
      const dropped = p.cards.pop();
      const ang = Math.atan2(p.body.position.y - cy, p.body.position.x - cx);
      addLooseCard(dropped, cx + Math.cos(ang) * ARENA_R * 0.5, cy + Math.sin(ang) * ARENA_R * 0.5);
    }
    World.remove(world, p.body);
    p.fallFlash = 1.2;
    updateScores();
    checkAliveWin();
  }

  function respawnFallen(p) {
    if (p.alive || p.dead) return;
    const ang = Math.random() * Math.PI * 2;
    const body = Bodies.circle(cx + Math.cos(ang) * ARENA_R * 0.3, cy + Math.sin(ang) * ARENA_R * 0.3, PLAYER_R, {
      frictionAir: 0.11,
      restitution: 0.5,
      density: 0.004,
      label: `player-${p.i}`,
    });
    World.add(world, body);
    p.body = body;
    p.alive = true;
    p.stunT = 0.5;
    updateScores();
  }

  function checkAliveWin() {
    const living = players.filter((p) => !p.dead);
    if (living.length === 1 && players.length > 1) {
      endRound(`Последний выживший: ${living[0].char.name}`, [living[0]]);
    }
  }

  function endRound(reason, forced) {
    if (ended) return;
    ended = true;
    stopLoop();
    let winners = forced;
    if (!winners) {
      const alive = players.filter((p) => !p.dead);
      const pool = alive.length ? alive : players;
      const max = Math.max(...pool.map((p) => p.cards.length));
      winners = pool.filter((p) => p.cards.length === max);
    }
    const overlay = app.querySelector("#end-overlay");
    app.querySelector("#end-title").textContent = "Раунд окончен";
    app.querySelector("#end-desc").textContent = reason;
    app.querySelector("#end-winners").textContent =
      winners.length === 1
        ? `Победитель: ${winners[0].char.emoji} ${winners[0].char.name} (${winners[0].cards.length} карт)`
        : `Ничья: ${winners.map((w) => `${w.char.emoji} ${w.char.name}`).join(", ")}`;
    overlay.classList.remove("hidden");
  }

  function keyDown(code) {
    return !!keys[code];
  }

  function applyInput(p, dt) {
    if (p.dead) return;
    if (!p.alive) {
      p.fallFlash = Math.max(0, p.fallFlash - dt);
      if (p.fallFlash <= 0) respawnFallen(p);
      return;
    }

    p.stunT = Math.max(0, p.stunT - dt);
    p.flipT = Math.max(0, p.flipT - dt);
    p.stunCd = Math.max(0, p.stunCd - dt);
    p.cutCd = Math.max(0, p.cutCd - dt);
    if (p.flipT <= 0) p.cutMarked = false;

    const k = p.slot.keys;
    const grabDown = keyDown(k.grab);
    const flipDown = keyDown(k.flip) || (k.flip === "ShiftLeft" && (keys.ShiftLeft || keys.ShiftRight));
    const cutDown = keyDown(k.cut);
    const throwDown = keyDown(k.throw);

    if (grabDown && !p.grabHeld) tryGrab(p);
    if (!grabDown && p.grabHeld) {
      if (p.grabTarget && (p.grabTarget.type === "item" || p.grabTarget.type === "card")) {
        /* keep hold until throw or release without throw — release drops */
        releaseGrab(p);
      } else if (p.grabTarget && p.grabTarget.type === "player") {
        releaseGrab(p);
      }
    }
    p.grabHeld = grabDown;

    if (throwDown && !p.throwHeld) tryThrow(p);
    p.throwHeld = throwDown;

    if (flipDown && !p.flipHeld) tryFlip(p);
    p.flipHeld = flipDown;

    if (cutDown && !p.cutHeld) tryCut(p);
    p.cutHeld = cutDown;

    checkDeathPlacement(p);

    if (p.stunT > 0 || p.flipT > 0) {
      Body.setVelocity(p.body, {
        x: p.body.velocity.x * 0.82,
        y: p.body.velocity.y * 0.82,
      });
      handleFall(p);
      return;
    }

    let fx = 0;
    let fy = 0;
    if (keys[k.up]) fy -= 1;
    if (keys[k.down]) fy += 1;
    if (keys[k.left]) fx -= 1;
    if (keys[k.right]) fx += 1;
    if (fx || fy) {
      const len = Math.hypot(fx, fy) || 1;
      Body.applyForce(p.body, p.body.position, {
        x: (fx / len) * 0.0029,
        y: (fy / len) * 0.0029,
      });
    }

    pickUpNearbyCards(p);
    handleFall(p);
  }

  function softPullToArena(p) {
    if (!p.alive || p.dead) return;
    const d = dist(p.body.position, { x: cx, y: cy });
    if (d > ARENA_R * 0.9) {
      const ang = Math.atan2(cy - p.body.position.y, cx - p.body.position.x);
      const edge = (d - ARENA_R * 0.82) / ARENA_R;
      Body.applyForce(p.body, p.body.position, {
        x: Math.cos(ang) * 0.0013 * edge,
        y: Math.sin(ang) * 0.0013 * edge,
      });
    }
  }

  function blob(ctx, x, y, rx, ry, fill, stroke) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawPlasticine(p, t) {
    const { x, y } = p.body.position;
    const vx = p.body.velocity.x;
    const vy = p.body.velocity.y;
    const speed = Math.hypot(vx, vy);
    const wobble = Math.sin(t * 8 + p.i * 1.7) * Math.min(4, speed * 0.35);
    const lean = Math.max(-0.35, Math.min(0.35, vx * 0.04));
    const ch = p.char;
    const flipped = p.flipT > 0;

    ctx.save();
    ctx.translate(x, y);
    if (flipped) ctx.rotate(Math.PI);
    ctx.rotate(lean);
    ctx.globalAlpha = p.stunT > 0 ? 0.55 : 1;

    // shadow
    ctx.beginPath();
    ctx.ellipse(0, 28, 18, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fill();

    // floppy legs
    blob(ctx, -9 + wobble * 0.3, 16, 7, 11, ch.shade, null);
    blob(ctx, 9 - wobble * 0.3, 17, 7, 11, ch.shade, null);
    blob(ctx, -9 + wobble * 0.3, 24, 8, 6, ch.color, null);
    blob(ctx, 9 - wobble * 0.3, 25, 8, 6, ch.color, null);

    // soft belly / torso
    blob(ctx, 0, 4, 16, 15, ch.color, null);
    blob(ctx, -3, 0, 10, 9, ch.blush, null);

    // arms (grab pose stretches toward target)
    let armL = -22;
    let armR = 22;
    let armY = 2;
    if (p.grabConstraint) {
      const bx = p.grabConstraint.bodyB.position.x - x;
      const by = p.grabConstraint.bodyB.position.y - y;
      const ang = Math.atan2(by, bx);
      armR = Math.cos(ang) * 28;
      armY = Math.sin(ang) * 18;
      armL = -14;
    }
    blob(ctx, armL + wobble, 4, 9, 7, ch.color, null);
    blob(ctx, armR, armY + 2, 9, 7, ch.color, null);
    blob(ctx, armL - 4 + wobble, 6, 6, 6, ch.shade, null);
    blob(ctx, armR + (p.grabConstraint ? 4 : 4), armY + 4, 6, 6, ch.shade, null);

    // big round head (lollipop)
    blob(ctx, 0, -16, 15, 14, ch.color, null);
    blob(ctx, -4, -20, 7, 5, ch.blush, null);

    // empty face / tiny dots like Gang Beasts (almost featureless)
    ctx.beginPath();
    ctx.arc(-5, -16, 2.2, 0, Math.PI * 2);
    ctx.arc(5, -16, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(30,20,40,0.35)";
    ctx.fill();

    if (p.cutMarked) {
      ctx.strokeStyle = "#7f1d1d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(8, -22);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    if (p.grabConstraint) {
      const b = p.grabConstraint.bodyB.position;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.fillStyle = "#fff";
    ctx.font = "800 10px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(p.cards.length), x, y + PLAYER_R + 14);

    if (p.flipT > 0) {
      ctx.fillStyle = "#fde68a";
      ctx.font = "700 10px Nunito, sans-serif";
      ctx.fillText(p.cutMarked ? "разрезан — на карту 💀" : "перевёрнут — режь", x, y - PLAYER_R - 18);
    } else if (p.stunT > 0) {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 10px Nunito, sans-serif";
      ctx.fillText("не могу двигаться", x, y - PLAYER_R - 18);
    }
  }

  function draw() {
    const w = app.clientWidth;
    const h = app.clientHeight;
    const t = performance.now() / 1000;
    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createRadialGradient(cx, cy, ARENA_R * 0.15, cx, cy, ARENA_R * 1.4);
    bg.addColorStop(0, "#1a4a6e");
    bg.addColorStop(0.55, "#0d2a3c");
    bg.addColorStop(1, "#071018");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, ARENA_R, 0, Math.PI * 2);
    const globe = ctx.createRadialGradient(cx - 50, cy - 60, 30, cx, cy, ARENA_R);
    globe.addColorStop(0, "#3d9b6e");
    globe.addColorStop(0.45, "#2a6b8a");
    globe.addColorStop(0.8, "#1e4a6e");
    globe.addColorStop(1, "#123048");
    ctx.fillStyle = globe;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(125, 211, 252, 0.5)";
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy, ARENA_R * 0.92, ARENA_R * 0.26, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(226,232,240,0.55)";
    ctx.font = "800 12px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${ARENA_DIAM_M} м`, cx, cy + ARENA_R + 22);

    for (const li of looseItems) {
      const { x, y } = li.body.position;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "13px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(li.item.emoji, x, y + 1);
    }

    for (const lc of looseCards) {
      const { x, y } = lc.body.position;
      const sp = lc.card.special;
      ctx.beginPath();
      ctx.arc(x, y, sp ? 16 : 13, 0, Math.PI * 2);
      ctx.fillStyle = sp ? "#3f1d1d" : "#0f172a";
      ctx.fill();
      ctx.strokeStyle = sp ? "#f87171" : "#fbbf24";
      ctx.lineWidth = sp ? 3 : 2;
      ctx.stroke();
      ctx.font = sp ? "16px serif" : "13px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lc.card.emoji, x, y + 1);
    }

    for (const p of players) {
      if (!p.alive || p.dead) continue;
      drawPlasticine(p, t);
    }

    ctx.fillStyle = "rgba(148,163,184,0.75)";
    ctx.font = "700 11px Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Пластилиновые леденцы. Бросай предметы. Смерть: переворот → рез → карта 💀.", 14, h - 46);
  }

  function loop(ts) {
    if (mode !== "play" || ended) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    timeLeft -= dt;
    matchAge += dt;
    toastT = Math.max(0, toastT - dt);
    const timerEl = app.querySelector("#timer");
    if (timerEl) timerEl.textContent = Math.max(0, Math.ceil(timeLeft)) + "с";
    if (timeLeft <= 0) {
      endRound("Время вышло — побеждает у кого больше карт (среди живых).");
      draw();
      return;
    }

    for (const p of players) {
      applyInput(p, dt);
      softPullToArena(p);
    }

    for (const lc of [...looseCards, ...looseItems]) {
      const d = dist(lc.body.position, { x: cx, y: cy });
      if (d > DROP_EDGE + 30) {
        Body.setPosition(lc.body, {
          x: cx + (Math.random() - 0.5) * 100,
          y: cy + (Math.random() - 0.5) * 100,
        });
        Body.setVelocity(lc.body, { x: 0, y: 0 });
      }
    }

    Engine.update(engine, dt * 1000);
    draw();
    if ((ts / 180) | 0 !== ((ts - dt * 1000) / 180) | 0) updateScores();
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Slash"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
  window.addEventListener("resize", () => {
    if (mode !== "play") return;
    const oldCx = cx;
    const oldCy = cy;
    resize();
    const dx = cx - oldCx;
    const dy = cy - oldCy;
    for (const p of players) {
      if (!p.alive || p.dead) continue;
      Body.setPosition(p.body, { x: p.body.position.x + dx, y: p.body.position.y + dy });
    }
    for (const lc of [...looseCards, ...looseItems]) {
      Body.setPosition(lc.body, { x: lc.body.position.x + dx, y: lc.body.position.y + dy });
    }
  });

  showLobby();

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    const p = players && players[0];
    if (!p) return;
    if (t === "heal" || t === "max") {
      p.stunT = 0;
      p.flipT = 0;
      p.cutMarked = false;
      p.dead = false;
      p.alive = true;
      if (p.body) {
        Body.setPosition(p.body, { x: cx, y: cy });
        Body.setVelocity(p.body, { x: 0, y: 0 });
      } else if (typeof respawnFallen === "function") {
        try { respawnFallen(p); } catch (_) {}
      }
      if (typeof showToast === "function") showToast("💚 Хилл хозяина");
      if (typeof updateScores === "function") updateScores();
    }
    if (t === "god" || t === "max") {
      p.shieldCharges = Math.max(p.shieldCharges || 0, 3);
    }
  });
})();
