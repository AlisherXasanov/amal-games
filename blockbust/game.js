(() => {
  const SIZE = 8;
  const COLORS = {
    cyan: "#22d3ee",
    blue: "#3b82f6",
    orange: "#fb923c",
    yellow: "#facc15",
    green: "#4ade80",
    purple: "#a78bfa",
    pink: "#f472b6",
    red: "#f87171",
  };

  const PIECES = [
    { id: "dot", cells: [[1]], color: "cyan", w: 6 },
    { id: "h2", cells: [[1, 1]], color: "blue", w: 7 },
    { id: "v2", cells: [[1], [1]], color: "blue", w: 7 },
    { id: "h3", cells: [[1, 1, 1]], color: "orange", w: 8 },
    { id: "v3", cells: [[1], [1], [1]], color: "orange", w: 8 },
    { id: "h4", cells: [[1, 1, 1, 1]], color: "yellow", w: 5 },
    { id: "v4", cells: [[1], [1], [1], [1]], color: "yellow", w: 5 },
    { id: "sq2", cells: [[1, 1], [1, 1]], color: "purple", w: 8 },
    { id: "l2a", cells: [[1, 0], [1, 1]], color: "blue", w: 6 },
    { id: "l2b", cells: [[0, 1], [1, 1]], color: "blue", w: 6 },
    { id: "l2c", cells: [[1, 1], [1, 0]], color: "orange", w: 6 },
    { id: "l2d", cells: [[1, 1], [0, 1]], color: "orange", w: 6 },
    { id: "t1", cells: [[1, 1, 1], [0, 1, 0]], color: "purple", w: 4 },
    { id: "s1", cells: [[0, 1, 1], [1, 1, 0]], color: "green", w: 3 },
    { id: "rect23", cells: [[1, 1, 1], [1, 1, 1]], color: "red", w: 3 },
    { id: "plus", cells: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: "yellow", w: 2 },
    { id: "bigL", cells: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: "pink", w: 3 },
    { id: "u", cells: [[1, 0, 1], [1, 1, 1]], color: "cyan", w: 3 },
    { id: "diag", cells: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], color: "green", w: 2 },
  ];

  // Фон стола (вторично)
  const BG_SKINS = [
    {
      id: "sun",
      name: "Закат",
      icon: "☀️",
      bg: "radial-gradient(ellipse at top,#5b4305 0%,#211804 48%,#0e0b03 100%)",
      accent: "#facc15",
      glowL: "#f59e0b",
      glowR: "#fde047",
    },
    {
      id: "violet",
      name: "Ночь",
      icon: "🔮",
      bg: "radial-gradient(ellipse at top,#2a1f5e 0%,#0f1024 45%,#070712 100%)",
      accent: "#8b5cf6",
      glowL: "#7c3aed",
      glowR: "#06b6d4",
    },
    {
      id: "ocean",
      name: "Океан",
      icon: "🌊",
      bg: "radial-gradient(ellipse at top,#083c68 0%,#071b38 48%,#020817 100%)",
      accent: "#38bdf8",
      glowL: "#0284c7",
      glowR: "#22d3ee",
    },
    {
      id: "mint",
      name: "Мята",
      icon: "🍃",
      bg: "radial-gradient(ellipse at top,#14532d 0%,#08271a 48%,#03110b 100%)",
      accent: "#4ade80",
      glowL: "#22c55e",
      glowR: "#2dd4bf",
    },
    {
      id: "rainbow",
      name: "Радуга-фон",
      icon: "🌈",
      bg: "radial-gradient(ellipse at top,#4c1d95 0%,#9a3412 35%,#166534 65%,#0c4a6e 100%)",
      accent: "#f472b6",
      glowL: "#facc15",
      glowR: "#22d3ee",
    },
  ];

  // Скины САМИХ кубиков — обычные открыты всем с первого входа
  const CUBE_SKINS = [
    {
      id: "gloss",
      name: "Глянец",
      icon: "💎",
      free: true,
      paint: (hex) =>
        `linear-gradient(145deg, ${hex}ff 0%, ${hex}cc 42%, ${hex}88 100%), radial-gradient(circle at 28% 22%, #ffffffaa, transparent 42%)`,
      shadow: "inset 0 1px 0 #fff8, 0 2px 6px #0006",
    },
    {
      id: "candy",
      name: "Конфета",
      icon: "🍬",
      free: true,
      paint: (hex) =>
        `repeating-linear-gradient(135deg, ${hex} 0 6px, ${hex}cc 6px 12px), linear-gradient(180deg, #fff6, transparent)`,
      shadow: "inset 0 0 0 1px #fff4, 0 2px 5px #0005",
    },
    {
      id: "neon",
      name: "Неон",
      icon: "⚡",
      free: true,
      paint: (hex) => `linear-gradient(160deg, #0b0b12 10%, ${hex} 55%, #fff 120%)`,
      shadow: (hex) => `0 0 10px ${hex}, 0 0 18px ${hex}88, inset 0 0 8px #fff3`,
    },
    {
      id: "gem",
      name: "Кристалл",
      icon: "🔮",
      free: true,
      paint: (hex) =>
        `linear-gradient(125deg, #fff9 0%, ${hex}ee 28%, ${hex} 55%, #0006 100%), linear-gradient(320deg, transparent 40%, #fff5 70%, transparent)`,
      shadow: "inset 0 0 0 1px #fff5, 0 3px 8px #0007",
    },
    {
      id: "metal",
      name: "Металл",
      icon: "🪙",
      free: true,
      paint: (hex) =>
        `linear-gradient(180deg, #fff8 0%, ${hex} 35%, ${hex}99 70%, #0005 100%)`,
      shadow: "inset 0 2px 0 #fff5, inset 0 -2px 0 #0005, 0 2px 4px #0006",
    },
    {
      id: "pixel",
      name: "Пиксель",
      icon: "🟦",
      free: true,
      paint: (hex) =>
        `linear-gradient(90deg, ${hex} 50%, ${hex}bb 50%), linear-gradient(0deg, ${hex} 50%, ${hex}99 50%)`,
      shadow: "inset 0 0 0 1px #0004",
    },
    {
      id: "wood",
      name: "Дерево",
      icon: "🪵",
      free: true,
      paint: (hex) =>
        `repeating-linear-gradient(90deg, ${hex} 0 4px, ${hex}dd 4px 8px), linear-gradient(180deg, #fff3, transparent 40%, #0003)`,
      shadow: "inset 0 1px 0 #fff4, 0 2px 5px #0005",
    },
    {
      id: "ice",
      name: "Лёд",
      icon: "🧊",
      free: true,
      paint: (hex) =>
        `linear-gradient(160deg, #fff 0%, ${hex}cc 45%, #7dd3fc 100%), linear-gradient(40deg, transparent 30%, #fff8 50%, transparent 70%)`,
      shadow: "inset 0 0 0 1px #fff8, 0 0 10px #7dd3fc66",
    },
    {
      id: "lava",
      name: "Лава",
      icon: "🌋",
      free: true,
      paint: (hex) =>
        `radial-gradient(circle at 30% 30%, #fde047, ${hex} 45%, #7c2d12 100%)`,
      shadow: "0 0 12px #f9731688, inset 0 1px 0 #fff5",
    },
    {
      id: "soft",
      name: "Пастель",
      icon: "🎀",
      free: true,
      paint: (hex) => `linear-gradient(180deg, #fff 0%, ${hex}aa 55%, ${hex} 100%)`,
      shadow: "inset 0 2px 4px #fff8, 0 2px 6px #0003",
    },
    {
      id: "stripe",
      name: "Полоски",
      icon: "🦓",
      free: true,
      paint: (hex) =>
        `repeating-linear-gradient(45deg, ${hex} 0 5px, #1118 5px 10px)`,
      shadow: "inset 0 0 0 1px #fff3, 0 2px 5px #0005",
    },
    {
      id: "glass",
      name: "Стекло",
      icon: "🪟",
      free: true,
      paint: (hex) =>
        `linear-gradient(135deg, #fff9 0%, ${hex}66 40%, ${hex}99 100%)`,
      shadow: "inset 0 0 0 1px #fff6, 0 0 8px #fff3",
    },
    // TEMP exclusive: только владелец + гости ивента (не ставим при старте)
    {
      id: "starfire",
      name: "Звёздный огонь",
      icon: "🌟",
      exclusive: true,
      eventId: "visit",
      paint: (hex) =>
        `conic-gradient(from 20deg, #fff, #fde047, ${hex}, #f472b6, #38bdf8, #fff), radial-gradient(circle at 35% 30%, #fff9, transparent 50%)`,
      shadow: "0 0 16px #fde047aa, inset 0 1px 0 #fff8, 0 3px 10px #0007",
    },
  ];

  const FREE_CUBE_IDS = CUBE_SKINS.filter((c) => c.free).map((c) => c.id);
  const EXCLUSIVE_CUBE_ID = "starfire";

  const LEVELS = [
    { id: 1, title: "Первый шаг", desc: "Набери 40 очков", kind: "score", target: 40 },
    { id: 2, title: "Чистильщик", desc: "Очисти 3 линии", kind: "lines", target: 3 },
    { id: 3, title: "Комбо ×2", desc: "Собери комбо ×2", kind: "combo", target: 2 },
    { id: 4, title: "Сотня", desc: "Набери 100 очков", kind: "score", target: 100 },
    { id: 5, title: "Серия", desc: "Сделай 5 очисток", kind: "clears", target: 5 },
    { id: 6, title: "Двухсотка", desc: "Набери 200 очков", kind: "score", target: 200 },
    { id: 7, title: "Марафон", desc: "Набери 350 очков", kind: "score", target: 350 },
    { id: 8, title: "Комбо ×3", desc: "Собери комбо ×3", kind: "combo", target: 3 },
  ];

  const MINI_GAMES = [
    { id: "classic", name: "Классика", icon: "🧩", desc: "Обычная игра без таймера" },
    { id: "blitz", name: "Блиц 60с", icon: "⏱️", desc: "Успей набрать очки за минуту" },
    { id: "zen", name: "Дзен", icon: "🧘", desc: "Без проигрыша — только счёт" },
    { id: "color", name: "Цветолов", icon: "🎯", desc: "Очищай линии с целевым цветом" },
    { id: "tiny", name: "Мини-поле", icon: "🔳", desc: "Поле 6×6 — теснее и злее" },
    { id: "speed3", name: "Скорость III", icon: "⚡", desc: "Эксклюзив гостя и владельца", exclusive: true },
  ];

  const KEYS = {
    best: "bb-web-best",
    coins: "bb-web-coins",
    skin: "bb-web-skin",
    cube: "bb-web-cube",
    adventure: "bb-web-adv",
    surprise: "bb-web-temp-surprise-v2",
    ownedCubes: "bb-web-owned-cubes-v1",
    ownedSpeed: "bb-web-owned-speed-v1",
    visitClaim: "bb-web-visit-exclusive-v1",
    catalogGift: "bb-web-catalog-gift-v1",
    miniBest: "bb-web-mini-best-v1",
  };

  const INF = 999999999;
  const BUG_INF_FLOOR = 1_000_000;

  // Раздача гостям ВЫКЛЮЧЕНА. У кого уже записано в localStorage — остаётся.
  const TEMP_VISITOR_SURPRISE = false;
  const TEMP_VISIT_EXCLUSIVE = false;
  const SURPRISE_COINS = 99;

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

  function isOwner() {
    return typeof AmalOwner !== "undefined" && AmalOwner.isOwner();
  }

  function loadBest() {
    const v = Number(store.get(KEYS.best, 0)) || 0;
    if (isOwner()) return INF;
    if (v >= BUG_INF_FLOOR) {
      store.set(KEYS.best, 0);
      return 0;
    }
    return Math.max(0, Math.floor(v));
  }

  function loadCoins() {
    const v = Number(store.get(KEYS.coins, 0)) || 0;
    if (isOwner()) return INF;
    if (v >= BUG_INF_FLOOR) {
      store.set(KEYS.coins, 0);
      return 0;
    }
    return Math.max(0, Math.floor(v));
  }

  function loadOwnedCubes() {
    const list = store.get(KEYS.ownedCubes, []);
    return Array.isArray(list) ? list : [];
  }

  function migrateKeptRewards() {
    // Старые владельцы hour3 сохраняют новый эксклюзив
    const owned = new Set(loadOwnedCubes());
    let changed = false;
    if (owned.has("hour3") && !owned.has(EXCLUSIVE_CUBE_ID)) {
      owned.add(EXCLUSIVE_CUBE_ID);
      changed = true;
    }
    if (store.get(KEYS.visitClaim, false) && !owned.has(EXCLUSIVE_CUBE_ID)) {
      owned.add(EXCLUSIVE_CUBE_ID);
      changed = true;
    }
    if (changed) store.set(KEYS.ownedCubes, [...owned]);
    return [...owned];
  }

  function hasOwnedSpeed() {
    return !!store.get(KEYS.ownedSpeed, false) || isOwner();
  }

  function ownsCube(id) {
    if (isOwner()) return true;
    const def = CUBE_SKINS.find((c) => c.id === id);
    if (!def) return false;
    if (def.free) return true;
    return loadOwnedCubes().includes(id);
  }

  function canClaimVisitExclusive() {
    // Новым больше не выдаём
    return false;
  }

  function grantVisitExclusive(opts = {}) {
    // Оставлено для совместимости; новые выдачи отключены
    if (!TEMP_VISIT_EXCLUSIVE && !isOwner()) return;
    const owned = new Set(loadOwnedCubes());
    FREE_CUBE_IDS.forEach((id) => owned.add(id));
    owned.add(EXCLUSIVE_CUBE_ID);
    store.set(KEYS.ownedCubes, [...owned]);
    store.set(KEYS.ownedSpeed, true);
    store.set(KEYS.visitClaim, true);
    state.ownedCubes = [...owned];
    state.ownedSpeed = true;
    if (opts.equip) {
      state.cubeId = EXCLUSIVE_CUBE_ID;
      store.set(KEYS.cube, EXCLUSIVE_CUBE_ID);
    }
  }

  function surprisePending() {
    return false;
  }

  function claimSurprise() {
    state.modal = null;
    render();
  }

  function applyOwnerRewards() {
    if (!isOwner()) return;
    state.best = INF;
    state.coins = INF;
    store.set(KEYS.best, INF);
    store.set(KEYS.coins, INF);
    const owned = new Set(loadOwnedCubes());
    FREE_CUBE_IDS.forEach((id) => owned.add(id));
    owned.add(EXCLUSIVE_CUBE_ID);
    store.set(KEYS.ownedCubes, [...owned]);
    store.set(KEYS.ownedSpeed, true);
    state.ownedCubes = [...owned];
    state.ownedSpeed = true;
  }

  let uid = 0;
  const nextUid = () => `p-${Date.now()}-${++uid}`;

  function boardSize(mode) {
    const m = mode != null ? mode : typeof state !== "undefined" && state ? state.mode : "classic";
    return m === "tiny" ? 6 : SIZE;
  }

  function emptyBoard(mode) {
    const n = boardSize(mode);
    return Array.from({ length: n }, () => Array(n).fill(null));
  }

  function pieceSize(cells) {
    return {
      h: cells.length,
      w: cells.reduce((m, row) => Math.max(m, row.length), 0),
    };
  }

  function countCells(cells) {
    return cells.flat().filter(Boolean).length;
  }

  function pickPiece() {
    const total = PIECES.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    for (const p of PIECES) {
      r -= p.w;
      if (r <= 0) return { ...p, uid: nextUid() };
    }
    return { ...PIECES[0], uid: nextUid() };
  }

  function canPlace(board, cells, row, col) {
    const n = board.length;
    const { h, w } = pieceSize(cells);
    if (row < 0 || col < 0 || row + h > n || col + w > n) return false;
    if (isOwner()) return true;
    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < cells[r].length; c++) {
        if (cells[r][c] && board[row + r][col + c]) return false;
      }
    }
    return true;
  }

  function hasAny(board, cells) {
    const n = board.length;
    const { h, w } = pieceSize(cells);
    for (let r = 0; r <= n - h; r++) {
      for (let c = 0; c <= n - w; c++) {
        if (canPlace(board, cells, r, c)) return true;
      }
    }
    return false;
  }

  function makeHand(board) {
    for (let i = 0; i < 40; i++) {
      const hand = [pickPiece(), pickPiece(), pickPiece()];
      if (hand.some((p) => hasAny(board, p.cells))) return hand;
    }
    return [pickPiece(), pickPiece(), pickPiece()];
  }

  function findClears(board) {
    const n = board.length;
    const rows = [];
    const cols = [];
    for (let r = 0; r < n; r++) if (board[r].every(Boolean)) rows.push(r);
    for (let c = 0; c < n; c++) {
      let full = true;
      for (let r = 0; r < n; r++) if (!board[r][c]) full = false;
      if (full) cols.push(c);
    }
    return { rows, cols, lines: rows.length + cols.length };
  }

  function applyClears(board, clear) {
    if (!clear.lines) return board.map((row) => [...row]);
    const next = board.map((row) => [...row]);
    const rs = new Set(clear.rows);
    const cs = new Set(clear.cols);
    const n = board.length;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (rs.has(r) || cs.has(c)) next[r][c] = null;
      }
    }
    return next;
  }

  function scoreMove(placed, clear, comboBefore, boardBefore) {
    let points = placed;
    let combo = comboBefore;
    let colorHits = 0;
    if (clear.lines > 0) {
      combo += 1;
      points += clear.lines * 10 + (clear.lines > 1 ? clear.lines * clear.lines * 5 : 0) + (combo - 1) * 10;
      if (state.mode === "color" && state.targetColor && boardBefore) {
        const rs = new Set(clear.rows);
        const cs = new Set(clear.cols);
        const n = boardBefore.length;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if ((rs.has(r) || cs.has(c)) && boardBefore[r][c] === state.targetColor) colorHits += 1;
          }
        }
        points += colorHits * 3;
        state.stats.colorHits = (state.stats.colorHits || 0) + colorHits;
      }
      if (state.mode === "speed3") points = Math.round(points * 1.35);
    } else combo = 0;
    return { points, combo, colorHits };
  }

  function goalProgress(level, st, stats) {
    if (level.kind === "score") return st.score;
    if (level.kind === "lines") return stats.lines;
    if (level.kind === "combo") return Math.max(st.combo, stats.bestCombo);
    return stats.clears;
  }

  function goalLabel(level) {
    if (level.kind === "score") return `Набрать ${level.target} очков`;
    if (level.kind === "lines") return `Очистить ${level.target} линий`;
    if (level.kind === "combo") return `Комбо ×${level.target}`;
    return `Сделать ${level.target} очисток`;
  }

  const state = {
    mode: "classic",
    board: emptyBoard("classic"),
    hand: [null, null, null],
    score: 0,
    combo: 0,
    bestCombo: 0,
    gameOver: false,
    levelWon: false,
    best: 0,
    coins: 0,
    bgId: store.get(KEYS.skin, "sun"),
    cubeId: store.get(KEYS.cube, "gloss"),
    ownedCubes: loadOwnedCubes(),
    ownedSpeed: hasOwnedSpeed(),
    adventure: store.get(KEYS.adventure, { maxUnlocked: 1, completed: [] }),
    miniBest: store.get(KEYS.miniBest, {}),
    activeLevel: null,
    targetColor: null,
    timeLeft: null,
    timerId: null,
    stats: { lines: 0, clears: 0, bestCombo: 0, colorHits: 0 },
    modal: null,
    toast: null,
    selected: null,
    drag: null,
    aim: null,
    cell: 40,
  };

  state.ownedCubes = migrateKeptRewards();
  state.ownedSpeed = hasOwnedSpeed();
  if (isOwner()) applyOwnerRewards();
  // Если эксклюзив не заработан — не держим его выбранным
  if (!ownsCube(state.cubeId)) {
    state.cubeId = "gloss";
    store.set(KEYS.cube, "gloss");
  }
  state.best = loadBest();
  state.coins = loadCoins();
  if (isOwner()) applyOwnerRewards();

  const app = document.getElementById("app");

  function bgSkin() {
    return BG_SKINS.find((s) => s.id === state.bgId) || BG_SKINS[0];
  }

  function cubeSkin() {
    const id = ownsCube(state.cubeId) ? state.cubeId : "gloss";
    return CUBE_SKINS.find((c) => c.id === id) || CUBE_SKINS[0];
  }

  function cubePaint(colorKey) {
    const hex = COLORS[colorKey] || "#38bdf8";
    const sk = cubeSkin();
    let bgImg = "";
    try {
      bgImg = typeof sk.paint === "function" ? sk.paint(hex) : "";
    } catch {
      bgImg = "";
    }
    const sh =
      typeof sk.shadow === "function" ? sk.shadow(hex) : sk.shadow || "inset 0 1px 0 #fff6, 0 2px 4px #0005";
    return {
      color: hex,
      background: bgImg ? `${bgImg}` : hex,
      backgroundColor: hex,
      boxShadow: sh,
    };
  }

  function toast(msg) {
    state.toast = msg;
    render();
    setTimeout(() => {
      if (state.toast === msg) {
        state.toast = null;
        render();
      }
    }, 1600);
  }

  function clearTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    state.timeLeft = null;
  }

  function startTimer(sec) {
    clearTimer();
    state.timeLeft = sec;
    const tickMs = state.mode === "speed3" ? 700 : 1000;
    state.timerId = setInterval(() => {
      if (state.gameOver || state.levelWon) return;
      state.timeLeft -= 1;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.gameOver = true;
        clearTimer();
        saveMiniBest();
        toast("Время!");
      }
      render();
    }, tickMs);
  }

  function saveMiniBest() {
    if (state.mode === "adventure") return;
    const map = { ...state.miniBest };
    map[state.mode] = Math.max(map[state.mode] || 0, state.score);
    state.miniBest = map;
    store.set(KEYS.miniBest, map);
    if (state.mode === "classic") {
      if (isOwner()) {
        state.best = INF;
      } else {
        state.best = Math.max(state.best, state.score);
      }
      store.set(KEYS.best, state.best);
    }
  }

  function resetRoundFields() {
    state.board = emptyBoard(state.mode);
    state.hand = makeHand(state.board);
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.gameOver = false;
    state.levelWon = false;
    state.stats = { lines: 0, clears: 0, bestCombo: 0, colorHits: 0 };
    state.selected = null;
    state.drag = null;
    state.activeLevel = null;
    state.targetColor = null;
  }

  function startClassic() {
    clearTimer();
    state.mode = "classic";
    resetRoundFields();
    state.modal = null;
    render();
  }

  function startMini(id) {
    if (id === "speed3" && !hasOwnedSpeed()) {
      toast("Скорость III — только для гостей «Третьего часа»");
      return;
    }
    clearTimer();
    state.mode = id;
    resetRoundFields();
    state.modal = null;
    if (id === "color") {
      const keys = Object.keys(COLORS);
      state.targetColor = keys[Math.floor(Math.random() * keys.length)];
    }
    if (id === "blitz") startTimer(60);
    if (id === "speed3") startTimer(45);
    measure();
    render();
  }

  function startLevel(level) {
    clearTimer();
    state.mode = "adventure";
    resetRoundFields();
    state.activeLevel = level;
    state.modal = null;
    render();
  }

  function place(handIndex, row, col) {
    if (state.gameOver || state.levelWon) return;
    const piece = state.hand[handIndex];
    if (!piece || !canPlace(state.board, piece.cells, row, col)) return;

    const boardBefore = state.board.map((r) => [...r]);
    const board = state.board.map((r) => [...r]);
    for (let r = 0; r < piece.cells.length; r++) {
      for (let c = 0; c < piece.cells[r].length; c++) {
        if (piece.cells[r][c]) board[row + r][col + c] = piece.color;
      }
    }
    const clear = findClears(board);
    const nextBoard = applyClears(board, clear);
    const { points, combo } = scoreMove(countCells(piece.cells), clear, state.combo, boardBefore);

    let hand = state.hand.map((p, i) => (i === handIndex ? null : p));
    if (hand.every((p) => !p)) hand = makeHand(nextBoard);

    state.board = nextBoard;
    state.hand = hand;
    state.score += points;
    state.combo = combo;
    state.bestCombo = Math.max(state.bestCombo, combo);
    state.stats.lines += clear.lines;
    if (clear.lines) state.stats.clears += 1;
    state.stats.bestCombo = Math.max(state.stats.bestCombo, combo);
    state.selected = null;
    state.aim = null;

    if (state.mode !== "adventure") {
      if (isOwner()) {
        state.best = INF;
        state.coins = INF;
      } else {
        if (state.mode === "classic") state.best = Math.max(state.best, state.score);
        if (clear.lines > 0) {
          const mul = state.mode === "speed3" ? 2 : 1;
          state.coins += (clear.lines * 2 + (combo > 1 ? combo : 0)) * mul;
        }
      }
      store.set(KEYS.best, state.best);
      store.set(KEYS.coins, state.coins);
      saveMiniBest();
    }

    if (state.mode === "adventure" && state.activeLevel) {
      if (goalProgress(state.activeLevel, state, state.stats) >= state.activeLevel.target) {
        state.levelWon = true;
        const adv = { ...state.adventure };
        if (!adv.completed.includes(state.activeLevel.id)) adv.completed.push(state.activeLevel.id);
        adv.maxUnlocked = Math.max(adv.maxUnlocked, Math.min(LEVELS.length, state.activeLevel.id + 1));
        state.adventure = adv;
        store.set(KEYS.adventure, adv);
        toast("Уровень пройден!");
      }
    }

    const remaining = hand.filter(Boolean);
    const softFail = state.mode !== "zen";
    if (
      softFail &&
      !isOwner() &&
      !state.levelWon &&
      remaining.length &&
      remaining.every((p) => !hasAny(nextBoard, p.cells))
    ) {
      state.gameOver = true;
      clearTimer();
      saveMiniBest();
    }

    render();
  }

  function pieceHtml(piece, cellSize) {
    if (!piece) return "—";
    const { h, w } = pieceSize(piece.cells);
    let html = `<div class="piece" style="grid-template-columns:repeat(${w},${cellSize}px)">`;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const on = piece.cells[r]?.[c];
        if (!on) {
          html += `<div style="width:${cellSize}px;height:${cellSize}px"></div>`;
          continue;
        }
        const paint = cubePaint(piece.color);
        html += `<div class="cube" style="width:${cellSize}px;height:${cellSize}px;border-radius:22%;background-color:${paint.backgroundColor};background:${paint.background};box-shadow:${paint.boxShadow}"></div>`;
      }
    }
    html += "</div>";
    return html;
  }

  function boardHtml(preview) {
    const n = boardSize();
    const s = state.cell;
    let html = `<div class="board" id="board" style="grid-template-columns:repeat(${n},${s}px)">`;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const color = state.board[r][c];
        let cls = "cell";
        let style = `width:${s}px;height:${s}px;background:rgba(255,255,255,0.06)`;
        if (color) {
          cls += " filled cube";
          const paint = cubePaint(color);
          style = `width:${s}px;height:${s}px;background-color:${paint.backgroundColor};background:${paint.background};box-shadow:${paint.boxShadow}`;
        }
        if (preview?.[r]?.[c] === "ok") cls += " ok";
        if (preview?.[r]?.[c] === "bad") cls += " bad";
        html += `<div class="${cls}" data-r="${r}" data-c="${c}" style="${style}"></div>`;
      }
    }
    html += "</div>";
    return html;
  }

  function previewMask() {
    const n = boardSize();
    const mask = Array.from({ length: n }, () => Array(n).fill(null));
    const paint = (piece, row, col, valid) => {
      for (let r = 0; r < piece.cells.length; r++) {
        for (let c = 0; c < piece.cells[r].length; c++) {
          if (!piece.cells[r][c]) continue;
          const rr = row + r;
          const cc = col + c;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n) mask[rr][cc] = valid ? "ok" : "bad";
        }
      }
    };
    if (state.drag && state.drag.row != null) {
      paint(state.drag.piece, state.drag.row, state.drag.col, state.drag.valid);
    } else if (state.selected != null && state.aim && state.hand[state.selected]) {
      paint(state.hand[state.selected], state.aim.row, state.aim.col, state.aim.valid);
    }
    return mask;
  }

  function isCoarsePointer() {
    try {
      return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    } catch {
      return false;
    }
  }

  function dragLift() {
    return state.cell * (isCoarsePointer() ? 2.4 : 1.2);
  }

  function pointerToCell(clientX, clientY, piece) {
    const board = document.getElementById("board");
    if (!board) return { row: null, col: null, valid: false };
    const rect = board.getBoundingClientRect();
    const gap = 4;
    const step = state.cell + gap;
    const lift = dragLift();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top - lift;
    const { h, w } = pieceSize(piece.cells);
    const col = Math.round(localX / step - w / 2);
    const row = Math.round(localY / step - h / 2);
    return {
      row,
      col,
      valid: canPlace(state.board, piece.cells, row, col),
    };
  }

  function syncDragDom() {
    if (!state.drag) return;
    const lift = dragLift();
    let ghost = document.getElementById("drag-ghost");
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.id = "drag-ghost";
      ghost.className = "ghost";
      ghost.innerHTML = pieceHtml(state.drag.piece, Math.floor(state.cell * 0.92));
      document.body.appendChild(ghost);
    }
    ghost.style.left = `${state.drag.x}px`;
    ghost.style.top = `${state.drag.y - lift}px`;

    const preview = previewMask();
    const n = boardSize();
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const el = app.querySelector(`#board .cell[data-r="${r}"][data-c="${c}"]`);
        if (!el) continue;
        el.classList.toggle("ok", preview[r][c] === "ok");
        el.classList.toggle("bad", preview[r][c] === "bad");
      }
    }
  }

  function clearDragGhost() {
    document.getElementById("drag-ghost")?.remove();
  }

  function beginDrag(idx, clientX, clientY, pointerId) {
    const piece = state.hand[idx];
    if (!piece || state.gameOver || state.levelWon) return;
    state.selected = idx;
    state.drag = {
      index: idx,
      piece,
      pointerId,
      x: clientX,
      y: clientY,
      row: null,
      col: null,
      valid: false,
      moved: false,
    };
    document.body.classList.add("dragging");
    const hover = pointerToCell(clientX, clientY, piece);
    state.drag.row = hover.row;
    state.drag.col = hover.col;
    state.drag.valid = hover.valid;
    app.querySelectorAll("[data-pick]").forEach((el) => {
      el.classList.toggle("selected", Number(el.getAttribute("data-pick")) === idx);
    });
    syncDragDom();
  }

  function moveDrag(clientX, clientY) {
    if (!state.drag) return;
    const dx = clientX - state.drag.x;
    const dy = clientY - state.drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 8) state.drag.moved = true;
    const hover = pointerToCell(clientX, clientY, state.drag.piece);
    state.drag.x = clientX;
    state.drag.y = clientY;
    state.drag.row = hover.row;
    state.drag.col = hover.col;
    state.drag.valid = hover.valid;
    syncDragDom();
  }

  function endDrag(clientX, clientY) {
    if (!state.drag) return;
    const index = state.drag.index;
    const moved = state.drag.moved;
    const hover = pointerToCell(clientX, clientY, state.drag.piece);
    state.drag = null;
    document.body.classList.remove("dragging");
    clearDragGhost();
    if (hover.valid) {
      place(index, hover.row, hover.col);
      return;
    }
    // Короткий тап: на телефоне оставляем выбранным и ждём тап по полю;
    // если палец уже над полем но invalid — просто отмена
    if (!moved) {
      state.selected = index;
      state.aim = null;
      render();
      return;
    }
    render();
  }

  function selectHand(idx) {
    if (state.gameOver || state.levelWon || state.modal) return;
    const piece = state.hand[idx];
    if (!piece) {
      toast(`Слот ${idx + 1} пуст`);
      return;
    }
    state.selected = idx;
    state.drag = null;
    state.aim = null;
    document.body.classList.remove("dragging");
    clearDragGhost();
    toast(`Фигура ${idx + 1}`);
    render();
  }

  function updateAim(clientX, clientY) {
    if (state.selected == null || state.drag || state.gameOver || state.levelWon) return;
    const piece = state.hand[state.selected];
    if (!piece) return;
    const board = document.getElementById("board");
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const gap = 4;
    const step = state.cell + gap;
    const { h, w } = pieceSize(piece.cells);
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    if (localX < -20 || localY < -20 || localX > rect.width + 20 || localY > rect.height + 20) {
      if (state.aim) {
        state.aim = null;
        syncAimDom();
      }
      return;
    }
    const col = Math.round(localX / step - w / 2);
    const row = Math.round(localY / step - h / 2);
    const valid = canPlace(state.board, piece.cells, row, col);
    state.aim = { row, col, valid };
    syncAimDom();
  }

  function syncAimDom() {
    const preview = previewMask();
    const n = boardSize();
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const el = app.querySelector(`#board .cell[data-r="${r}"][data-c="${c}"]`);
        if (!el) continue;
        el.classList.toggle("ok", preview[r][c] === "ok");
        el.classList.toggle("bad", preview[r][c] === "bad");
      }
    }
  }

  function tryTapPlaceOnBoard(clientX, clientY) {
    if (state.selected == null || state.drag || state.gameOver || state.levelWon) return false;
    const piece = state.hand[state.selected];
    if (!piece) return false;
    const board = document.getElementById("board");
    if (!board) return false;
    const rect = board.getBoundingClientRect();
    if (
      clientX < rect.left - 4 ||
      clientX > rect.right + 4 ||
      clientY < rect.top - 4 ||
      clientY > rect.bottom + 4
    ) {
      return false;
    }
    updateAim(clientX, clientY);
    if (!state.aim || !state.aim.valid) {
      toast("Сюда нельзя");
      return true;
    }
    const idx = state.selected;
    const { row, col } = state.aim;
    state.aim = null;
    place(idx, row, col);
    return true;
  }

  function modeTitle() {
    if (state.mode === "adventure" && state.activeLevel) {
      return `Приключение · Ур. ${state.activeLevel.id}: ${state.activeLevel.title}`;
    }
    const g = MINI_GAMES.find((m) => m.id === state.mode);
    return g ? `${g.icon} ${g.name}` : "Веб-версия · Собирай линии";
  }

  function render() {
    clearDragGhost();
    const sk = bgSkin();
    const cube = cubeSkin();
    document.body.style.background = sk.bg;
    document.body.dataset.cube = cube.id;
    document.body.dataset.speed = state.mode === "speed3" ? "1" : "0";
    const goal = state.activeLevel ? goalProgress(state.activeLevel, state, state.stats) : 0;
    const target = state.activeLevel?.target || 1;
    const preview = previewMask();
    const colorName = state.targetColor || "";

    app.innerHTML = `
      <div class="glow left" style="background:${sk.glowL}"></div>
      <div class="glow right" style="background:${sk.glowR}"></div>
      <header class="hud">
        <div class="brand">
          <h1 style="text-shadow:0 2px 12px ${sk.accent}">Blockbust</h1>
          <p class="mode-line">${modeTitle()}</p>
        </div>
        <div class="actions">
          <button type="button" data-act="minis">🎮</button>
          <button type="button" data-act="adventure">🗺️</button>
          <button type="button" data-act="skins">${cube.icon === "neon" ? "⚡" : cube.icon}</button>
          <button type="button" class="primary" data-act="new" style="background:${sk.accent}">↺</button>
        </div>
      </header>
      <div class="stats">
        <div class="stat"><div class="label">Счёт</div><div class="value" style="color:${sk.accent}">${state.score}</div></div>
        <div class="stat"><div class="label">${
          state.timeLeft != null ? "Время" : state.mode === "adventure" ? "Цель" : "Рекорд"
        }</div><div class="value" style="color:#facc15">${
          state.timeLeft != null
            ? state.timeLeft
            : state.mode === "adventure"
              ? `${goal}/${target}`
              : state.mode === "classic"
                ? state.best
                : state.miniBest[state.mode] || 0
        }</div></div>
        <div class="stat"><div class="label">Монеты</div><div class="value" style="color:#fbbf24">${state.coins}</div></div>
      </div>
      ${
        state.mode === "color"
          ? `<div class="goal-bar"><div class="inner"><div class="row"><span>Цель: линии с цветом</span><span style="color:${COLORS[colorName]}">■ ${colorName}</span></div></div></div>`
          : ""
      }
      ${
        state.mode === "adventure" && state.activeLevel
          ? `<div class="goal-bar"><div class="inner"><div class="row"><span>${goalLabel(
              state.activeLevel,
            )}</span><span style="color:${sk.accent}">${goal}/${target}</span></div><div class="progress"><span style="width:${Math.min(
              100,
              (goal / target) * 100,
            )}%;background:${sk.accent}"></span></div></div></div>`
          : ""
      }
      ${""}
      ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
      <div class="board-wrap">${boardHtml(preview)}</div>
      <div class="hand">
        <div class="hint">${
          isCoarsePointer()
            ? "Тяни фигуру пальцем на поле · или кнопки 1–2–3"
            : state.selected != null
              ? `Выбрана фигура ${state.selected + 1} — наведи на поле и кликни`
              : "Клавиши 1 · 2 · 3 · или тяни мышкой"
        }${state.ownedSpeed && !isOwner() ? " · ⚡ Скорость III твоя" : ""}</div>
        <div class="pick-row">
          ${[0, 1, 2]
            .map((i) => {
              const piece = state.hand[i];
              const selected = state.selected === i;
              return `<button type="button" class="pick-btn ${selected ? "selected" : ""} ${
                piece ? "" : "empty"
              }" data-pick="${i}" ${!piece || state.gameOver || state.levelWon ? "disabled" : ""}>
              <span class="pick-num">${i + 1}</span>
              <span class="pick-piece">${pieceHtml(piece, Math.max(16, Math.min(28, Math.floor(state.cell * 0.55))))}</span>
            </button>`;
            })
            .join("")}
        </div>
      </div>
      ${
        state.modal === "surprise"
          ? `<div class="overlay surprise-overlay"><div class="modal surprise-modal" style="text-align:center" data-stop="1"><div class="surprise-burst" aria-hidden="true">✨🎁🌟</div><h2>Сюрприз!</h2><p class="sub">Добро пожаловать в Blockbust.</p><p class="surprise-gift">+${SURPRISE_COINS} монет<br/>весь каталог кубиков открыт<br/>🌟 «Звёздный огонь» + ⚡ Скорость III<br/><span style="opacity:.75;font-size:12px">Эксклюзив в коллекции — не на старте</span></p><button class="primary" data-act="claim-surprise" style="width:100%;margin-top:14px;background:${sk.accent}">Забрать подарок</button></div></div>`
          : ""
      }
      ${
        state.modal === "minis"
          ? `<div class="overlay" data-close="1"><div class="modal" data-stop="1"><div class="modal-head"><div><h2>Мини-игры</h2><p class="sub">Выбери режим</p></div><button data-act="close">✕</button></div><div class="grid-cards">${MINI_GAMES.map(
              (g) => {
                const locked = g.exclusive && !hasOwnedSpeed();
                const best = state.miniBest[g.id] || 0;
                return `<button class="card ${locked ? "locked" : ""}" data-mini="${g.id}" ${
                  locked ? "disabled" : ""
                }><div style="font-size:20px">${g.icon}</div><div style="font-weight:900;font-size:13px;margin-top:4px">${
                  locked ? `🔒 ${g.name}` : g.name
                }</div><div style="font-size:11px;opacity:.65;margin-top:4px">${g.desc}</div>${
                  best ? `<div style="font-size:10px;color:#facc15;margin-top:4px;font-weight:800">Рекорд ${best}</div>` : ""
                }</button>`;
              },
            ).join("")}</div></div></div>`
          : ""
      }
      ${
        state.modal === "skins"
          ? `<div class="overlay" data-close="1"><div class="modal" data-stop="1"><div class="modal-head"><div><h2>Кубики</h2><p class="sub">Скин на сами блоки · фон отдельно ниже</p></div><button data-act="close">✕</button></div>
            <div class="grid-cards three" style="margin-top:12px">${CUBE_SKINS.map((c) => {
              const have = ownsCube(c.id);
              const locked = !have;
              const sample = cubePaintPreview(c);
              return `<button class="card ${locked ? "locked" : ""}" data-cube="${c.id}" ${
                locked ? "disabled" : ""
              }><div class="cube-preview" style="background:${sample.background};box-shadow:${sample.boxShadow}"></div><div style="margin-top:8px;font-size:12px;font-weight:900">${
                c.icon === "neon" ? "⚡" : c.icon
              } ${c.name}</div><div style="font-size:10px;opacity:.7">${
                locked
                  ? c.exclusive
                    ? "Больше не выдаётся"
                    : "Закрыто"
                  : c.id === state.cubeId
                    ? "Выбран"
                    : c.exclusive
                      ? "Твой эксклюзив"
                      : "Открыт"
              }</div></button>`;
            }).join("")}</div>
            <h3 style="margin:16px 0 0;font-size:14px">Фон стола</h3>
            <div class="grid-cards three">${BG_SKINS.map(
              (s) =>
                `<button class="card" data-bg="${s.id}" style="background:${s.bg}"><div style="font-size:18px">${s.icon}</div><div style="margin-top:6px;font-size:11px;font-weight:900">${s.name}</div><div style="font-size:10px;opacity:.7">${
                  s.id === state.bgId ? "Выбран" : "Сменить"
                }</div></button>`,
            ).join("")}</div>
          </div></div>`
          : ""
      }
      ${
        state.modal === "adventure"
          ? `<div class="overlay" data-close="1"><div class="modal" data-stop="1"><div class="modal-head"><div><h2>Приключения</h2><p class="sub">Открыто до уровня ${
              state.adventure.maxUnlocked
            }</p></div><button data-act="close">✕</button></div><div class="grid-cards">${LEVELS.map((lv) => {
              const unlocked = lv.id <= state.adventure.maxUnlocked;
              const done = state.adventure.completed.includes(lv.id);
              return `<button class="card ${unlocked ? "" : "locked"}" data-level="${lv.id}" ${
                unlocked ? "" : "disabled"
              }><div style="font-weight:900;font-size:13px">${unlocked ? `${lv.id}. ${lv.title}` : `🔒 Уровень ${lv.id}`}</div><div style="font-size:11px;opacity:.65;margin-top:4px">${lv.desc}</div>${
                done ? `<div style="font-size:10px;color:#4ade80;margin-top:4px;font-weight:800">Пройден</div>` : ""
              }</button>`;
            }).join(
              "",
            )}</div><button data-act="classic" style="width:100%;margin-top:14px">Вернуться в классику</button></div></div>`
          : ""
      }
      ${
        state.levelWon
          ? `<div class="overlay"><div class="modal" style="text-align:center"><div style="font-size:40px">🏆</div><h2>Уровень пройден!</h2><p class="sub">${state.activeLevel.title}</p><button class="primary" data-act="next" style="width:100%;margin-top:14px;background:${sk.accent}">Дальше</button><button data-act="adventure" style="width:100%;margin-top:8px">Карта уровней</button></div></div>`
          : ""
      }
      ${
        state.gameOver && !state.levelWon
          ? `<div class="overlay"><div class="modal" style="text-align:center"><div style="font-size:40px">💥</div><h2>${
              state.timeLeft === 0 ? "Время вышло" : state.mode === "adventure" ? "Уровень не пройден" : "Игра окончена"
            }</h2><p class="sub">Счёт: ${state.score}</p><button class="primary" data-act="new" style="width:100%;margin-top:14px;background:${sk.accent}">Ещё раз</button>${
              state.mode === "adventure"
                ? `<button data-act="adventure" style="width:100%;margin-top:8px">Карта уровней</button>`
                : `<button data-act="minis" style="width:100%;margin-top:8px">Мини-игры</button>`
            }</div></div>`
          : ""
      }
    `;

    bind();
    const before = state.cell;
    measure();
    if (!state._fitPass && Math.abs(before - state.cell) >= 2) {
      state._fitPass = true;
      render();
      state._fitPass = false;
    }
  }

  function cubePaintPreview(def) {
    const hex = "#38bdf8";
    const background = typeof def.paint === "function" ? def.paint(hex) : hex;
    const boxShadow =
      typeof def.shadow === "function" ? def.shadow(hex) : def.shadow || "inset 0 1px 0 #fff6";
    return { background, boxShadow };
  }

  function bind() {
    app.querySelectorAll("[data-act]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const act = btn.getAttribute("data-act");
        if (act === "new") {
          if (state.mode === "adventure" && state.activeLevel) startLevel(state.activeLevel);
          else if (MINI_GAMES.some((m) => m.id === state.mode)) startMini(state.mode);
          else startClassic();
        }
        if (act === "skins") {
          state.modal = "skins";
          render();
        }
        if (act === "minis") {
          state.modal = "minis";
          render();
        }
        if (act === "adventure") {
          state.modal = "adventure";
          render();
        }
        if (act === "close") {
          state.modal = null;
          render();
        }
        if (act === "claim-surprise") claimSurprise();
        if (act === "claim-visit") {
          if (canClaimVisitExclusive()) {
            grantVisitExclusive({ equip: false });
            toast("🌟 «Звёздный огонь» и Скорость III — в коллекции");
            render();
          }
        }
        if (act === "classic") startClassic();
        if (act === "next") {
          const next = LEVELS.find((l) => l.id === (state.activeLevel?.id || 0) + 1);
          if (next && next.id <= state.adventure.maxUnlocked) startLevel(next);
          else {
            state.modal = "adventure";
            render();
          }
        }
      };
    });

    app.querySelectorAll("[data-cube]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-cube");
        if (!ownsCube(id)) return;
        state.cubeId = id;
        store.set(KEYS.cube, id);
        state.modal = null;
        toast(`Кубики: ${cubeSkin().name}`);
        render();
      };
    });

    app.querySelectorAll("[data-bg]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        state.bgId = btn.getAttribute("data-bg");
        store.set(KEYS.skin, state.bgId);
        toast(`Фон: ${bgSkin().name}`);
        render();
      };
    });

    app.querySelectorAll("[data-mini]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        startMini(btn.getAttribute("data-mini"));
      };
    });

    app.querySelectorAll("[data-level]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute("data-level"));
        const level = LEVELS.find((l) => l.id === id);
        if (level) startLevel(level);
      };
    });

    const overlay = app.querySelector(".overlay[data-close]");
    if (overlay) {
      overlay.onclick = () => {
        state.modal = null;
        render();
      };
      overlay.querySelector("[data-stop]")?.addEventListener("click", (e) => e.stopPropagation());
    }

    app.querySelectorAll("[data-pick]").forEach((btn) => {
      const idx = Number(btn.getAttribute("data-pick"));
      btn.addEventListener(
        "pointerdown",
        (e) => {
          const piece = state.hand[idx];
          if (!piece || state.gameOver || state.levelWon) return;
          if (e.button != null && e.button !== 0) return;
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          // На телефоне сразу тянем; на ПК тоже можно тянуть с кнопки
          beginDrag(idx, e.clientX, e.clientY, e.pointerId);
        },
        { passive: false },
      );
      btn.addEventListener("click", (e) => {
        // Клик без драга уже обработан endDrag; для клавиатуры/доступности
        e.preventDefault();
      });
    });

    const board = document.getElementById("board");
    if (board) {
      board.addEventListener(
        "pointermove",
        (e) => {
          if (state.drag) return;
          updateAim(e.clientX, e.clientY);
        },
        { passive: true },
      );
      board.addEventListener(
        "pointerdown",
        (e) => {
          if (state.drag) return;
          if (state.selected == null) {
            toast("Сначала нажми 1, 2 или 3");
            return;
          }
          if (tryTapPlaceOnBoard(e.clientX, e.clientY)) {
            if (e.cancelable) e.preventDefault();
          }
        },
        { passive: false },
      );
    }
  }

  window.addEventListener("keydown", (e) => {
    if (state.modal) return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === "1") {
      e.preventDefault();
      selectHand(0);
    } else if (e.key === "2") {
      e.preventDefault();
      selectHand(1);
    } else if (e.key === "3") {
      e.preventDefault();
      selectHand(2);
    } else if (e.key === "Escape") {
      state.selected = null;
      state.aim = null;
      render();
    }
  });

  window.addEventListener(
    "pointermove",
    (e) => {
      if (!state.drag || e.pointerId !== state.drag.pointerId) return;
      if (e.cancelable) e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    },
    { passive: false },
  );

  function onPointerEnd(e) {
    if (!state.drag || e.pointerId !== state.drag.pointerId) return;
    if (e.cancelable) e.preventDefault();
    endDrag(e.clientX, e.clientY);
  }

  window.addEventListener("pointerup", onPointerEnd, { passive: false });
  window.addEventListener("pointercancel", onPointerEnd, { passive: false });

  function measure() {
    const n = boardSize();
    const wrap = document.querySelector(".board-wrap");
    const availW = wrap ? wrap.clientWidth - 16 : Math.min(window.innerWidth - 24, 480);
    const availH = wrap ? wrap.clientHeight - 16 : Math.max(160, window.innerHeight - 320);
    const board = Math.min(Math.max(availW, 120), Math.max(availH, 120), 420);
    state.cell = Math.max(22, Math.min(48, Math.floor((board - 4 * (n - 1)) / n)));
  }

  window.addEventListener("resize", () => {
    measure();
    render();
  });

  measure();
  startClassic();

  window.addEventListener("amal-owner-changed", (e) => {
    if (e.detail) {
      applyOwnerRewards();
      toast("Режим владельца: ∞ и все эксклюзивы");
    } else {
      store.set(KEYS.best, 0);
      store.set(KEYS.coins, 0);
      state.best = 0;
      state.coins = 0;
      toast("Обычный режим");
    }
    render();
  });
})();
