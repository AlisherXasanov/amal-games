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
  ];

  const SKINS = [
    {
      id: "sun",
      name: "Жёлтый",
      icon: "☀️",
      bg: "radial-gradient(ellipse at top,#5b4305 0%,#211804 48%,#0e0b03 100%)",
      accent: "#facc15",
      glowL: "#f59e0b",
      glowR: "#fde047",
    },
    {
      id: "violet",
      name: "Фиолетовый",
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
      name: "Радуга",
      icon: "🌈",
      bg: "radial-gradient(ellipse at top,#4c1d95 0%,#9a3412 35%,#166534 65%,#0c4a6e 100%)",
      accent: "#f472b6",
      glowL: "#facc15",
      glowR: "#22d3ee",
    },
  ];

  const LEVELS = [
    { id: 1, title: "Первый шаг", desc: "Набери 40 очков", kind: "score", target: 40 },
    { id: 2, title: "Чистильщик", desc: "Очисти 3 линии", kind: "lines", target: 3 },
    { id: 3, title: "Комбо ×2", desc: "Собери комбо ×2", kind: "combo", target: 2 },
    { id: 4, title: "Сотня", desc: "Набери 100 очков", kind: "score", target: 100 },
    { id: 5, title: "Серия", desc: "Сделай 5 очисток", kind: "clears", target: 5 },
    { id: 6, title: "Двухсотка", desc: "Набери 200 очков", kind: "score", target: 200 },
  ];

  const KEYS = {
    best: "bb-web-best",
    coins: "bb-web-coins",
    skin: "bb-web-skin",
    adventure: "bb-web-adv",
  };

  const INF = 999999999;

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

  let uid = 0;
  const nextUid = () => `p-${Date.now()}-${++uid}`;

  function emptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
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
    const owner =
      typeof AmalOwner !== "undefined" && AmalOwner.isOwner();
    const { h, w } = pieceSize(cells);
    if (row < 0 || col < 0 || row + h > SIZE || col + w > SIZE) return false;
    if (owner) return true;
    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < cells[r].length; c++) {
        if (cells[r][c] && board[row + r][col + c]) return false;
      }
    }
    return true;
  }

  function hasAny(board, cells) {
    const { h, w } = pieceSize(cells);
    for (let r = 0; r <= SIZE - h; r++) {
      for (let c = 0; c <= SIZE - w; c++) {
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
    const rows = [];
    const cols = [];
    for (let r = 0; r < SIZE; r++) if (board[r].every(Boolean)) rows.push(r);
    for (let c = 0; c < SIZE; c++) {
      let full = true;
      for (let r = 0; r < SIZE; r++) if (!board[r][c]) full = false;
      if (full) cols.push(c);
    }
    return { rows, cols, lines: rows.length + cols.length };
  }

  function applyClears(board, clear) {
    if (!clear.lines) return board.map((row) => [...row]);
    const next = board.map((row) => [...row]);
    const rs = new Set(clear.rows);
    const cs = new Set(clear.cols);
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (rs.has(r) || cs.has(c)) next[r][c] = null;
      }
    }
    return next;
  }

  function scoreMove(placed, clear, comboBefore) {
    let points = placed;
    let combo = comboBefore;
    if (clear.lines > 0) {
      combo += 1;
      points += clear.lines * 10 + (clear.lines > 1 ? clear.lines * clear.lines * 5 : 0) + (combo - 1) * 10;
    } else combo = 0;
    return { points, combo };
  }

  function goalProgress(level, state, stats) {
    if (level.kind === "score") return state.score;
    if (level.kind === "lines") return stats.lines;
    if (level.kind === "combo") return Math.max(state.combo, stats.bestCombo);
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
    board: emptyBoard(),
    hand: [null, null, null],
    score: 0,
    combo: 0,
    bestCombo: 0,
    gameOver: false,
    levelWon: false,
    best: INF,
    coins: INF,
    skinId: store.get(KEYS.skin, "sun"),
    adventure: store.get(KEYS.adventure, { maxUnlocked: 1, completed: [] }),
    activeLevel: null,
    stats: { lines: 0, clears: 0, bestCombo: 0 },
    modal: null,
    toast: null,
    selected: null,
    drag: null,
    cell: 40,
  };

  // infinite rewards as requested earlier
  store.set(KEYS.best, INF);
  store.set(KEYS.coins, INF);

  const app = document.getElementById("app");

  function skin() {
    return SKINS.find((s) => s.id === state.skinId) || SKINS[0];
  }

  function toast(msg) {
    state.toast = msg;
    render();
    setTimeout(() => {
      if (state.toast === msg) {
        state.toast = null;
        render();
      }
    }, 1400);
  }

  function startClassic() {
    state.mode = "classic";
    state.activeLevel = null;
    state.board = emptyBoard();
    state.hand = makeHand(state.board);
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.gameOver = false;
    state.levelWon = false;
    state.stats = { lines: 0, clears: 0, bestCombo: 0 };
    state.modal = null;
    state.selected = null;
    state.drag = null;
    render();
  }

  function startLevel(level) {
    state.mode = "adventure";
    state.activeLevel = level;
    state.board = emptyBoard();
    state.hand = makeHand(state.board);
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.gameOver = false;
    state.levelWon = false;
    state.stats = { lines: 0, clears: 0, bestCombo: 0 };
    state.modal = null;
    state.selected = null;
    state.drag = null;
    render();
  }

  function place(handIndex, row, col) {
    if (state.gameOver || state.levelWon) return;
    const piece = state.hand[handIndex];
    if (!piece || !canPlace(state.board, piece.cells, row, col)) return;

    const board = state.board.map((r) => [...r]);
    for (let r = 0; r < piece.cells.length; r++) {
      for (let c = 0; c < piece.cells[r].length; c++) {
        if (piece.cells[r][c]) board[row + r][col + c] = piece.color;
      }
    }
    const clear = findClears(board);
    const nextBoard = applyClears(board, clear);
    const { points, combo } = scoreMove(countCells(piece.cells), clear, state.combo);

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

    if (state.mode === "classic") {
      state.best = Math.max(state.best, state.score, INF);
      store.set(KEYS.best, state.best);
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
    if (
      !(typeof AmalOwner !== "undefined" && AmalOwner.isOwner()) &&
      !state.levelWon &&
      remaining.length &&
      remaining.every((p) => !hasAny(nextBoard, p.cells))
    ) {
      state.gameOver = true;
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
        html += `<div style="width:${cellSize}px;height:${cellSize}px;border-radius:22%;background:${
          on ? COLORS[piece.color] : "transparent"
        }"></div>`;
      }
    }
    html += "</div>";
    return html;
  }

  function boardHtml(preview) {
    const s = state.cell;
    let html = `<div class="board" id="board" style="grid-template-columns:repeat(${SIZE},${s}px)">`;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const color = state.board[r][c];
        let cls = "cell";
        let bg = "rgba(255,255,255,0.06)";
        if (color) {
          cls += " filled";
          bg = `linear-gradient(145deg, ${COLORS[color]}, ${COLORS[color]}b8)`;
        }
        if (preview?.[r]?.[c] === "ok") cls += " ok";
        if (preview?.[r]?.[c] === "bad") cls += " bad";
        html += `<div class="${cls}" style="width:${s}px;height:${s}px;background:${bg}"></div>`;
      }
    }
    html += "</div>";
    return html;
  }

  function previewMask() {
    const mask = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    const paint = (piece, row, col, valid) => {
      for (let r = 0; r < piece.cells.length; r++) {
        for (let c = 0; c < piece.cells[r].length; c++) {
          if (!piece.cells[r][c]) continue;
          const rr = row + r;
          const cc = col + c;
          if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) mask[rr][cc] = valid ? "ok" : "bad";
        }
      }
    };
    if (state.drag && state.drag.row != null) {
      paint(state.drag.piece, state.drag.row, state.drag.col, state.drag.valid);
    }
    return mask;
  }

  function pointerToCell(clientX, clientY, piece) {
    const board = document.getElementById("board");
    if (!board) return { row: null, col: null, valid: false };
    const rect = board.getBoundingClientRect();
    const gap = 4;
    const step = state.cell + gap;
    const lift = state.cell * 1.2;
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

  function render() {
    const sk = skin();
    document.body.style.background = sk.bg;
    const goal = state.activeLevel
      ? goalProgress(state.activeLevel, state, state.stats)
      : 0;
    const target = state.activeLevel?.target || 1;
    const preview = previewMask();

    app.innerHTML = `
      <div class="glow left" style="background:${sk.glowL}"></div>
      <div class="glow right" style="background:${sk.glowR}"></div>
      <header class="hud">
        <div class="brand">
          <h1 style="text-shadow:0 2px 12px ${sk.accent}">Blockbust</h1>
          <p>${
            state.mode === "adventure" && state.activeLevel
              ? `Приключение · Ур. ${state.activeLevel.id}: ${state.activeLevel.title}`
              : "Веб-версия · Собирай линии"
          }</p>
        </div>
        <div class="actions">
          <button data-act="adventure">🗺️ Приключения</button>
          <button data-act="skins">${sk.icon} Скины</button>
          <button class="primary" data-act="new" style="background:${sk.accent}">${
            state.mode === "adventure" ? "Заново" : "Новая игра"
          }</button>
        </div>
      </header>
      <div class="stats">
        <div class="stat"><div class="label">Счёт</div><div class="value" style="color:${sk.accent}">${state.score}</div></div>
        <div class="stat"><div class="label">${state.mode === "adventure" ? "Цель" : "Рекорд"}</div><div class="value" style="color:#facc15">${
          state.mode === "adventure" ? `${goal}/${target}` : state.best
        }</div></div>
        <div class="stat"><div class="label">Монеты</div><div class="value" style="color:#fbbf24">${state.coins}</div></div>
      </div>
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
      ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
      <div class="board-wrap">${boardHtml(preview)}</div>
      <div class="hand">
        <div class="hint">Перетащи фигуру на поле</div>
        <div class="slots">
          ${state.hand
            .map((piece, i) => {
              const selected = state.selected === i;
              return `<button class="slot ${piece ? "" : "empty"} ${selected ? "selected" : ""}" data-hand="${i}" ${
                !piece || state.gameOver || state.levelWon ? "disabled" : ""
              } style="${selected ? `background:${sk.accent}40;border-color:#fff` : ""}">${pieceHtml(
                piece,
                Math.max(14, Math.floor(state.cell * 0.5)),
              )}</button>`;
            })
            .join("")}
        </div>
      </div>
      ${
        state.drag
          ? `<div class="ghost" style="left:${state.drag.x}px;top:${state.drag.y - state.cell * 1.2}px">${pieceHtml(
              state.drag.piece,
              Math.floor(state.cell * 0.92),
            )}</div>`
          : ""
      }
      ${
        state.modal === "skins"
          ? `<div class="overlay" data-close="1"><div class="modal" data-stop="1"><div class="modal-head"><div><h2>Скины</h2><p class="sub">Все открыты · жёлтый старт · радуга в коллекции</p></div><button data-act="close">✕</button></div><div class="grid-cards three">${SKINS.map(
              (s) =>
                `<button class="card" data-skin="${s.id}" style="background:${s.bg}"><div style="font-size:22px">${s.icon}</div><div style="margin-top:6px;font-size:12px;font-weight:900">${s.name}</div><div style="font-size:10px;opacity:.7">${
                  s.id === state.skinId ? "Выбран" : "Открыт"
                }</div></button>`,
            ).join("")}</div></div></div>`
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
              state.mode === "adventure" ? "Уровень не пройден" : "Игра окончена"
            }</h2><p class="sub">Нет места для фигур</p><button class="primary" data-act="new" style="width:100%;margin-top:14px;background:${sk.accent}">Ещё раз</button>${
              state.mode === "adventure"
                ? `<button data-act="adventure" style="width:100%;margin-top:8px">Карта уровней</button>`
                : ""
            }</div></div>`
          : ""
      }
    `;

    bind();
  }

  function bind() {
    app.querySelectorAll("[data-act]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const act = btn.getAttribute("data-act");
        if (act === "new") {
          if (state.mode === "adventure" && state.activeLevel) startLevel(state.activeLevel);
          else startClassic();
        }
        if (act === "skins") {
          state.modal = "skins";
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

    app.querySelectorAll("[data-skin]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        state.skinId = btn.getAttribute("data-skin");
        store.set(KEYS.skin, state.skinId);
        state.modal = null;
        toast(`Скин: ${skin().name}`);
        render();
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

    app.querySelectorAll("[data-hand]").forEach((slot) => {
      const idx = Number(slot.getAttribute("data-hand"));
      slot.onpointerdown = (e) => {
        const piece = state.hand[idx];
        if (!piece || state.gameOver || state.levelWon) return;
        e.preventDefault();
        slot.setPointerCapture(e.pointerId);
        state.selected = idx;
        state.drag = {
          index: idx,
          piece,
          pointerId: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          row: null,
          col: null,
          valid: false,
        };
        render();
      };
    });
  }

  window.addEventListener("pointermove", (e) => {
    if (!state.drag || e.pointerId !== state.drag.pointerId) return;
    const hover = pointerToCell(e.clientX, e.clientY, state.drag.piece);
    state.drag = {
      ...state.drag,
      x: e.clientX,
      y: e.clientY,
      row: hover.row,
      col: hover.col,
      valid: hover.valid,
    };
    render();
  });

  window.addEventListener("pointerup", (e) => {
    if (!state.drag || e.pointerId !== state.drag.pointerId) return;
    const hover = pointerToCell(e.clientX, e.clientY, state.drag.piece);
    const index = state.drag.index;
    state.drag = null;
    if (hover.valid) place(index, hover.row, hover.col);
    else render();
  });

  function measure() {
    const w = Math.min(window.innerWidth - 32, 480);
    const h = window.innerHeight - 280;
    const board = Math.min(w, h, 420);
    state.cell = Math.max(28, Math.min(52, Math.floor((board - 4 * 7) / SIZE)));
  }

  window.addEventListener("resize", () => {
    measure();
    render();
  });

  measure();
  startClassic();
})();
