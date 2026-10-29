(() => {
  "use strict";

  const FINGER_LIFT_CELLS = 1.2;

  /** Easy = big cells; Hard = small cells / denser board */
  const DIFFS = {
    easy: { id: "easy", name: "Легко", cols: 3, rows: 4, picW: 2, picH: 2, pics: 2 },
    medium: { id: "medium", name: "Средне", cols: 4, rows: 5, picW: 2, picH: 2, pics: 3 },
    hard: { id: "hard", name: "Сложно", cols: 5, rows: 6, picW: 2, picH: 2, pics: 5 },
  };

  const LIBRARY = [
    {
      id: "nature",
      name: "Природа",
      pics: [
        "nature-1",
        "nature-2",
        "nature-3",
        "nature-4",
        "nature-5",
        "nature-6",
        "nature-7",
      ],
    },
    {
      id: "city",
      name: "Город",
      pics: ["city-1", "city-2", "city-3", "city-4", "city-5", "city-6", "city-7"],
    },
    {
      id: "animals",
      name: "Животные",
      pics: [
        "animals-1",
        "animals-2",
        "animals-3",
        "animals-4",
        "animals-5",
        "animals-6",
        "animals-7",
      ],
    },
    {
      id: "food",
      name: "Еда",
      pics: ["food-1", "food-2", "food-3", "food-4", "food-5", "food-6", "food-7"],
    },
    {
      id: "space",
      name: "Космос",
      pics: [
        "space-1",
        "space-2",
        "space-3",
        "space-4",
        "space-5",
        "space-6",
        "space-7",
      ],
    },
    {
      id: "travel",
      name: "Путешествия",
      pics: ["travel-1", "travel-2", "travel-3", "travel-4"],
    },
    {
      id: "art",
      name: "Арт",
      pics: ["art-1", "art-2", "art-3", "art-4"],
    },
  ];

  const bootEl = document.getElementById("boot");
  const playEl = document.getElementById("play");
  const winEl = document.getElementById("win");
  const helpEl = document.getElementById("help");
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const themeNameEl = document.getElementById("themeName");
  const roundLabelEl = document.getElementById("roundLabel");
  const deckLabelEl = document.getElementById("deckLabel");
  const scoreLabelEl = document.getElementById("scoreLabel");
  const timeLabelEl = document.getElementById("timeLabel");
  const statusEl = document.getElementById("status");
  const winTitleEl = document.getElementById("winTitle");
  const winTextEl = document.getElementById("winText");

  /** @type {Map<string, HTMLImageElement>} */
  const images = new Map();

  let diff = DIFFS.easy;
  let COLS = diff.cols;
  let ROWS = diff.rows;
  let PW = diff.picW;
  let PH = diff.picH;

  let roundIndex = 0;
  let cleared = 0;
  let totalPics = 0;
  let score = 0;
  let combo = 0;
  let startedAt = 0;
  let elapsedMs = 0;
  let timerOn = false;
  let won = false;

  /** @type {(null|{id:number,pic:string,px:number,py:number,gid:number})[]} */
  let grid = [];
  /** @type {{pic:string,px:number,py:number}[]} */
  let deck = [];
  let nextId = 1;
  let nextGid = 1;
  let hintCell = -1;
  let hintUntil = 0;
  let animT = 0;

  let drag = null;
  let pointerId = null;
  let selectedI = -1;

  function piecesPerPic() {
    return PW * PH;
  }

  function cellIndex(c, r) {
    return r * COLS + c;
  }

  function inBounds(c, r) {
    return c >= 0 && c < COLS && r >= 0 && r < ROWS;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function loadImage(name) {
    return new Promise((resolve, reject) => {
      if (images.has(name)) {
        resolve(images.get(name));
        return;
      }
      const img = new Image();
      img.onload = () => {
        images.set(name, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(name));
      img.src = `./assets/${name}.jpg`;
    });
  }

  async function preloadPics(pics) {
    const results = await Promise.allSettled(pics.map(loadImage));
    const ok = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") ok.push(pics[i]);
    });
    if (!ok.length) throw new Error("no-images");
    return ok;
  }

  function makePiecesForPic(pic) {
    const parts = [];
    for (let py = 0; py < PH; py++) {
      for (let px = 0; px < PW; px++) {
        parts.push({ pic, px, py });
      }
    }
    return parts;
  }

  function emptyGrid() {
    grid = Array(COLS * ROWS).fill(null);
  }

  function placePiece(c, r, piece) {
    grid[cellIndex(c, r)] = piece;
  }

  function findEmptyCells() {
    const out = [];
    for (let i = 0; i < grid.length; i++) if (!grid[i]) out.push(i);
    return out;
  }

  function fillBoardFromDeck() {
    // Pack the board completely (swap-based play needs no permanent empty cells).
    const empties = findEmptyCells();
    shuffle(empties);
    let n = 0;
    for (const i of empties) {
      if (!deck.length) break;
      const raw = deck.pop();
      grid[i] = {
        id: nextId++,
        pic: raw.pic,
        px: raw.px,
        py: raw.py,
        gid: nextGid++,
      };
      n++;
    }
    relinkAll();
    return n;
  }

  function applyGravity() {
    let moved = true;
    let guard = 0;
    while (moved && guard++ < 50) {
      moved = false;
      relinkAll();
      const gids = [...new Set(grid.filter(Boolean).map((p) => p.gid))];
      gids.sort((a, b) => {
        const maxRow = (gid) =>
          Math.max(...groupCells(gid).map((i) => (i / COLS) | 0));
        return maxRow(b) - maxRow(a);
      });
      for (const gid of gids) {
        const cells = groupCells(gid);
        if (!cells.length) continue;
        let canFall = true;
        for (const i of cells) {
          const c = i % COLS;
          const r = (i / COLS) | 0;
          if (r + 1 >= ROWS) {
            canFall = false;
            break;
          }
          const below = grid[cellIndex(c, r + 1)];
          if (below && below.gid !== gid) {
            canFall = false;
            break;
          }
        }
        if (!canFall) continue;
        const payload = cells
          .map((i) => ({ i, p: grid[i] }))
          .sort((a, b) => b.i - a.i);
        for (const { i } of payload) grid[i] = null;
        for (const { i, p } of payload) {
          const c = i % COLS;
          const r = (i / COLS) | 0;
          grid[cellIndex(c, r + 1)] = p;
        }
        moved = true;
      }
    }
  }

  function shouldConnect(a, ac, ar, b, bc, br) {
    if (!a || !b || a.pic !== b.pic) return false;
    const dc = bc - ac;
    const dr = br - ar;
    return a.px + dc === b.px && a.py + dr === b.py;
  }

  function neighborsOf(c, r) {
    return [
      [c - 1, r],
      [c + 1, r],
      [c, r - 1],
      [c, r + 1],
    ].filter(([x, y]) => inBounds(x, y));
  }

  function relinkAll() {
    const seen = new Set();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const start = grid[cellIndex(c, r)];
        if (!start || seen.has(start.id)) continue;
        const gid = nextGid++;
        const q = [[c, r]];
        seen.add(start.id);
        start.gid = gid;
        while (q.length) {
          const [xc, xr] = q.pop();
          const cur = grid[cellIndex(xc, xr)];
          for (const [nc, nr] of neighborsOf(xc, xr)) {
            const other = grid[cellIndex(nc, nr)];
            if (!other || seen.has(other.id)) continue;
            if (shouldConnect(cur, xc, xr, other, nc, nr)) {
              other.gid = gid;
              seen.add(other.id);
              q.push([nc, nr]);
            }
          }
        }
      }
    }
  }

  function groupCells(gid) {
    const cells = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] && grid[i].gid === gid) cells.push(i);
    }
    return cells;
  }

  function isPictureComplete(gid) {
    const cells = groupCells(gid);
    if (cells.length !== piecesPerPic()) return false;
    const first = grid[cells[0]];
    const pic = first.pic;
    const positions = new Set();
    for (const i of cells) {
      const p = grid[i];
      if (p.pic !== pic) return false;
      positions.add(`${p.px},${p.py}`);
    }
    for (let py = 0; py < PH; py++) {
      for (let px = 0; px < PW; px++) {
        if (!positions.has(`${px},${py}`)) return false;
      }
    }
    let minC = COLS;
    let minR = ROWS;
    for (const i of cells) {
      minC = Math.min(minC, i % COLS);
      minR = Math.min(minR, (i / COLS) | 0);
    }
    for (const i of cells) {
      const c = i % COLS;
      const r = (i / COLS) | 0;
      const p = grid[i];
      if (c !== minC + p.px || r !== minR + p.py) return false;
    }
    return true;
  }

  function clearCompleted() {
    const gids = new Set();
    for (const cell of grid) if (cell) gids.add(cell.gid);
    let clearedNow = 0;
    for (const gid of gids) {
      if (!isPictureComplete(gid)) continue;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] && grid[i].gid === gid) grid[i] = null;
      }
      clearedNow++;
      cleared++;
    }
    return clearedNow;
  }

  function addScoreForClears(n) {
    if (n <= 0) return;
    combo += n;
    const base = 100 * n * (diff.id === "hard" ? 2 : diff.id === "medium" ? 1.5 : 1);
    const comboBonus = Math.max(0, (combo - 1) * 40);
    const gain = Math.round(base + comboBonus);
    score += gain;
    setStatus(
      n === 1
        ? `Картинка собрана! +${gain}`
        : `Собрано ${n}! +${gain} · комбо ×${combo}`
    );
  }

  function settleAfterClear() {
    let any = false;
    let guard = 0;
    while (guard++ < 40) {
      relinkAll();
      const n = clearCompleted();
      if (!n) break;
      any = true;
      addScoreForClears(n);
      applyGravity();
      fillBoardFromDeck();
    }
    if (!any) combo = 0;
    return any;
  }

  function afterMove() {
    selectedI = -1;
    relinkAll();
    const glued = settleAfterClear();
    if (!glued) {
      // Check if the move itself created new links (no clear yet)
      setStatus("Меняй местами · склейка, когда кусочки одной фото встают верно");
    }
    updateHud();
    checkWin();
  }

  function checkWin() {
    if (cleared >= totalPics && deck.length === 0 && !grid.some(Boolean)) {
      winRound();
    }
  }

  function themeForRound(index) {
    return LIBRARY[index % LIBRARY.length];
  }

  function pickPics(theme, count, available) {
    const allow = new Set(available || theme.pics);
    const pool = shuffle(theme.pics.filter((p) => allow.has(p) && images.has(p)));
    return pool.slice(0, Math.min(count, pool.length));
  }

  function startRound(index) {
    won = false;
    winEl.hidden = true;
    selectedI = -1;
    drag = null;
    pointerId = null;
    combo = 0;

    COLS = diff.cols;
    ROWS = diff.rows;
    PW = diff.picW;
    PH = diff.picH;

    roundIndex = ((index % LIBRARY.length) + LIBRARY.length) % LIBRARY.length;
    const theme = themeForRound(roundIndex);
    const cells = COLS * ROWS;
    const needPics = Math.max(diff.pics, Math.ceil(cells / piecesPerPic()));
    // Prefer current theme; top up from the whole library so the board packs full
    let pics = pickPics(theme, needPics);
    if (pics.length < needPics) {
      const extraPool = shuffle(
        LIBRARY.flatMap((t) => t.pics).filter((p) => images.has(p) && !pics.includes(p))
      );
      while (pics.length < needPics && extraPool.length) pics.push(extraPool.pop());
    }
    if (!pics.length) {
      setStatus("Нет загруженных фото для этой темы");
      return;
    }

    themeNameEl.textContent = `${theme.name} · ${diff.name}`;
    roundLabelEl.textContent = `Раунд ${roundIndex + 1}/${LIBRARY.length}`;
    cleared = 0;
    totalPics = pics.length;
    emptyGrid();
    deck = [];
    for (const pic of pics) deck.push(...makePiecesForPic(pic));
    shuffle(deck);

    // Pack every cell; leftovers stay in deck for after clears
    fillBoardFromDeck();
    // Rare accidental completes at start — recount remaining photos
    while (clearCompleted()) {
      applyGravity();
      fillBoardFromDeck();
    }
    cleared = 0;
    const remain = new Set();
    for (const p of grid) if (p) remain.add(p.pic);
    for (const p of deck) remain.add(p.pic);
    totalPics = remain.size || totalPics;
    score = 0;
    startedAt = performance.now();
    elapsedMs = 0;
    timerOn = true;
    updateHud();
    resizeCanvas();
    setStatus(
      `Поле полное · меняй кусочки местами · склей ${totalPics} фото (${PW}×${PH})`
    );
    hintCell = -1;
  }

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function updateHud() {
    deckLabelEl.textContent = `Колода: ${deck.length}`;
    if (scoreLabelEl) scoreLabelEl.textContent = `Очки: ${score}`;
    if (timeLabelEl) timeLabelEl.textContent = formatTime(elapsedMs);
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function winRound() {
    if (won) return;
    won = true;
    timerOn = false;
    elapsedMs = performance.now() - startedAt;
    // Time bonus
    const seconds = Math.max(1, Math.floor(elapsedMs / 1000));
    const timeBonus = Math.max(0, Math.round(8000 / seconds) * 10);
    score += timeBonus;
    updateHud();
    const last = roundIndex >= LIBRARY.length - 1;
    winTitleEl.textContent = last ? "Все темы пройдены!" : "Раунд пройден";
    winTextEl.textContent = `Очки: ${score} · время ${formatTime(elapsedMs)} · бонус за скорость +${timeBonus}`;
    document.getElementById("btnNext").textContent = last ? "Сначала" : "Дальше";
    winEl.hidden = false;
  }

  function layoutMetrics() {
    const pad = 6;
    const w = canvas.width;
    const h = canvas.height;
    const cell = Math.min((w - pad * 2) / COLS, (h - pad * 2) / ROWS);
    const ox = (w - cell * COLS) / 2;
    const oy = (h - cell * ROWS) / 2;
    return { pad, cell, ox, oy };
  }

  function cellAt(x, y) {
    const { cell, ox, oy } = layoutMetrics();
    const c = Math.floor((x - ox) / cell);
    const r = Math.floor((y - oy) / cell);
    if (!inBounds(c, r)) return null;
    return { c, r, i: cellIndex(c, r) };
  }

  function canvasPoint(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = evt.clientX ?? evt.touches?.[0]?.clientX;
    const clientY = evt.clientY ?? evt.touches?.[0]?.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      kind: evt.pointerType || "mouse",
    };
  }

  function aimFromPointer(pt, kind) {
    const { cell } = layoutMetrics();
    const lift =
      kind === "touch" || kind === "pen" ? cell * FINGER_LIFT_CELLS : 0;
    return { x: pt.x, y: pt.y - lift };
  }

  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function edgeSharedWithGroup(c, r, piece, dir) {
    // dir: 0L 1R 2U 3D — true if neighbor is same glued group
    let nc = c;
    let nr = r;
    if (dir === 0) nc--;
    if (dir === 1) nc++;
    if (dir === 2) nr--;
    if (dir === 3) nr++;
    if (!inBounds(nc, nr)) return false;
    const other = grid[cellIndex(nc, nr)];
    return !!(other && other.gid === piece.gid && other.id !== piece.id);
  }

  function drawFragment(piece, x, y, size, alpha, lift, opts) {
    const img = images.get(piece.pic);
    const gapHide = opts?.glue || false;
    const selected = opts?.selected || false;
    const s = size;
    const inset = gapHide ? 0 : 2;
    const px = x + inset;
    const py = y + inset - (lift || 0);
    const pw = s - inset * 2;
    const ph = s - inset * 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (!gapHide) {
      roundRectPath(px, py, pw, ph, 8);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
    }
    if (img && img.complete) {
      const sw = img.width / PW;
      const sh = img.height / PH;
      // Slight overlap when glued to kill seams
      const bleed = gapHide ? 1.1 : 0;
      ctx.drawImage(
        img,
        piece.px * sw,
        piece.py * sh,
        sw,
        sh,
        px - bleed,
        py - bleed,
        pw + bleed * 2,
        ph + bleed * 2
      );
    } else {
      ctx.fillStyle = "#2a6";
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.restore();

    if (!gapHide) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = selected
        ? "rgba(226,160,58,0.95)"
        : "rgba(255,255,255,0.4)";
      ctx.lineWidth = selected ? 3.5 : 1.5;
      roundRectPath(px, py, pw, ph, 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawGluedGroup(gid, cell, ox, oy, draggingIds) {
    const cells = groupCells(gid).filter((i) => {
      const p = grid[i];
      return p && !draggingIds.has(p.id);
    });
    if (!cells.length) return;

    // Draw each fragment without internal gaps; stroke only outer edges
    for (const i of cells) {
      const c = i % COLS;
      const r = (i / COLS) | 0;
      const p = grid[i];
      const x = ox + c * cell;
      const y = oy + r * cell;
      const glow = hintCell === i && performance.now() < hintUntil;
      const sel = selectedI === i;
      if (glow) {
        ctx.save();
        ctx.shadowColor = "rgba(226,160,58,0.85)";
        ctx.shadowBlur = 14;
      }
      drawFragment(p, x, y, cell, 1, glow ? Math.sin(animT / 8) * 2 : 0, {
        glue: cells.length > 1,
        selected: sel && cells.length === 1,
      });
      if (glow) ctx.restore();
    }

    if (cells.length === 1) return;

    // Outer border path for the whole group
    ctx.save();
    ctx.strokeStyle = selectedI >= 0 && cells.includes(selectedI)
      ? "rgba(226,160,58,0.95)"
      : "rgba(255,255,255,0.55)";
    ctx.lineWidth = selectedI >= 0 && cells.includes(selectedI) ? 3.5 : 2.2;
    ctx.lineJoin = "round";
    for (const i of cells) {
      const c = i % COLS;
      const r = (i / COLS) | 0;
      const p = grid[i];
      const x = ox + c * cell;
      const y = oy + r * cell;
      // draw only sides that are not shared
      ctx.beginPath();
      if (!edgeSharedWithGroup(c, r, p, 2)) {
        ctx.moveTo(x + 1, y + 1);
        ctx.lineTo(x + cell - 1, y + 1);
      }
      if (!edgeSharedWithGroup(c, r, p, 3)) {
        ctx.moveTo(x + 1, y + cell - 1);
        ctx.lineTo(x + cell - 1, y + cell - 1);
      }
      if (!edgeSharedWithGroup(c, r, p, 0)) {
        ctx.moveTo(x + 1, y + 1);
        ctx.lineTo(x + 1, y + cell - 1);
      }
      if (!edgeSharedWithGroup(c, r, p, 1)) {
        ctx.moveTo(x + cell - 1, y + 1);
        ctx.lineTo(x + cell - 1, y + cell - 1);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    animT += 1;
    if (timerOn && !won) {
      elapsedMs = performance.now() - startedAt;
      if (animT % 15 === 0) updateHud();
    }

    const { cell, ox, oy } = layoutMetrics();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        ctx.fillStyle =
          (c + r) % 2 === 0 ? "rgba(232,242,239,0.07)" : "rgba(232,242,239,0.03)";
        roundRectPath(x + 1, y + 1, cell - 2, cell - 2, 8);
        ctx.fill();
      }
    }

    const dragging = new Set();
    if (drag) for (const p of drag.pieces) dragging.add(p.piece.id);

    const drawn = new Set();
    for (let i = 0; i < grid.length; i++) {
      const p = grid[i];
      if (!p || dragging.has(p.id) || drawn.has(p.gid)) continue;
      drawn.add(p.gid);
      drawGluedGroup(p.gid, cell, ox, oy, dragging);
    }

    if (drag) {
      const place = evaluateMove(drag.dc, drag.dr);
      for (const item of drag.pieces) {
        const tc = item.originC + drag.dc;
        const tr = item.originR + drag.dr;
        if (!inBounds(tc, tr)) continue;
        const x = ox + tc * cell;
        const y = oy + tr * cell;
        ctx.fillStyle = place.ok
          ? place.swap
            ? "rgba(226,160,58,0.4)"
            : "rgba(31,122,85,0.4)"
          : "rgba(181,74,58,0.35)";
        roundRectPath(x + 2, y + 2, cell - 4, cell - 4, 8);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 2;
      ctx.arc(drag.aimX, drag.aimY, Math.max(6, cell * 0.12), 0, Math.PI * 2);
      ctx.stroke();

      for (const item of drag.pieces) {
        drawFragment(
          item.piece,
          drag.x + item.ox,
          drag.y + item.oy,
          cell,
          0.96,
          6,
          { glue: drag.pieces.length > 1 }
        );
      }
    }

    requestAnimationFrame(draw);
  }

  /**
   * Swap-first movement on a packed board.
   * Lifted pieces are already removed from `grid`.
   */
  function evaluateMove(dc, dr) {
    if (!drag) return { ok: false, swap: false };
    if (dc === 0 && dr === 0) return { ok: false, swap: false };

    const from = drag.pieces.map((p) => cellIndex(p.originC, p.originR));
    const to = drag.pieces.map((p) =>
      cellIndex(p.originC + dc, p.originR + dr)
    );
    for (let k = 0; k < to.length; k++) {
      const c = drag.pieces[k].originC + dc;
      const r = drag.pieces[k].originR + dr;
      if (!inBounds(c, r)) return { ok: false, swap: false };
    }
    if (new Set(to).size !== to.length) return { ok: false, swap: false };

    const fromSet = new Set(from);
    const toSet = new Set(to);
    const covered = [...toSet].filter((i) => !fromSet.has(i));
    const vacated = [...fromSet].filter((i) => !toSet.has(i));
    const under = covered.map((i) => grid[i]);

    if (under.every((p) => !p)) {
      return { ok: true, swap: false, from, to, covered, vacated, under };
    }
    if (under.every((p) => p) && under.length === vacated.length) {
      return { ok: true, swap: true, from, to, covered, vacated, under };
    }
    // Single piece onto one piece (always swap) — covered/vacated length 1
    if (drag.pieces.length === 1 && under.length === 1 && under[0]) {
      return { ok: true, swap: true, from, to, covered, vacated, under };
    }
    return { ok: false, swap: false };
  }

  function applyMove(dc, dr) {
    const place = evaluateMove(dc, dr);
    if (!place.ok) return false;

    const { from, to, covered, vacated, under, swap } = place;

    if (swap) {
      for (const i of covered) grid[i] = null;
      vacated.forEach((i, k) => {
        grid[i] = under[k];
        if (under[k]) under[k].gid = nextGid++;
      });
    }

    drag.pieces.forEach((item, k) => {
      grid[to[k]] = item.piece;
      item.piece.gid = nextGid++;
    });
    return true;
  }

  function restoreDrag() {
    if (!drag) return;
    for (const item of drag.pieces) {
      placePiece(item.originC, item.originR, item.piece);
    }
  }

  /** Glued groups always move together (one visual piece). */
  function piecesForPickup(hit) {
    const piece = grid[hit.i];
    if (!piece) return [];
    const cells = groupCells(piece.gid);
    const { cell } = layoutMetrics();
    return cells.map((i) => {
      const c = i % COLS;
      const r = (i / COLS) | 0;
      return {
        piece: grid[i],
        originI: i,
        originC: c,
        originR: r,
        ox: (c - hit.c) * cell,
        oy: (r - hit.r) * cell,
      };
    });
  }

  function beginDrag(evt) {
    if (won || pointerId !== null) return;
    if (evt.cancelable) evt.preventDefault();
    const pt = canvasPoint(evt);
    const hit = cellAt(pt.x, pt.y);

    // Two-tap: selected → destination (empty or swap)
    if (selectedI >= 0 && hit) {
      if (hit.i === selectedI) {
        selectedI = -1;
        setStatus("Отмена");
        return;
      }
      const sel = grid[selectedI];
      if (!sel) {
        selectedI = -1;
      } else {
        const sc = selectedI % COLS;
        const sr = (selectedI / COLS) | 0;
        const cells = groupCells(sel.gid);
        const pieces = cells.map((i) => {
          const c = i % COLS;
          const r = (i / COLS) | 0;
          return {
            piece: grid[i],
            originI: i,
            originC: c,
            originR: r,
            ox: 0,
            oy: 0,
          };
        });
        for (const item of pieces) grid[item.originI] = null;
        drag = {
          pieces,
          anchorC: sc,
          anchorR: sr,
          startX: 0,
          startY: 0,
          x: 0,
          y: 0,
          baseX: 0,
          baseY: 0,
          dc: hit.c - sc,
          dr: hit.r - sr,
          aimX: 0,
          aimY: 0,
          moved: true,
          pointerKind: "tap",
        };
        // For multi-cell groups, destination tap means move so that the
        // touched origin cell lands on `hit` — already encoded as dc/dr from sc,sr
        // which is the selected cell (may be any cell of group). Good.
        const ok = applyMove(drag.dc, drag.dr);
        if (!ok) {
          restoreDrag();
          setStatus("Сюда нельзя — выбери другой кусочек для обмена");
          drag = null;
          selectedI = -1;
          return;
        }
        drag = null;
        afterMove();
        return;
      }
    }

    if (!hit || !grid[hit.i]) {
      selectedI = -1;
      return;
    }

    const { cell, ox, oy } = layoutMetrics();
    const pieces = piecesForPickup(hit);
    for (const item of pieces) grid[item.originI] = null;

    const aim = aimFromPointer(pt, pt.kind);
    drag = {
      pieces,
      anchorC: hit.c,
      anchorR: hit.r,
      startX: aim.x,
      startY: aim.y,
      x: ox + hit.c * cell,
      y: oy + hit.r * cell,
      baseX: ox + hit.c * cell,
      baseY: oy + hit.r * cell,
      dc: 0,
      dr: 0,
      aimX: aim.x,
      aimY: aim.y,
      moved: false,
      pointerKind: pt.kind,
    };
    pointerId = evt.pointerId ?? "touch";
    selectedI = -1;
    try {
      canvas.setPointerCapture?.(evt.pointerId);
    } catch (_) {}
    setStatus(
      pieces.length > 1
        ? "Склеенный блок · жёлтая клетка = обмен местами"
        : "Тяни на другой кусочек — они поменяются местами"
    );
  }

  function moveDrag(evt) {
    if (!drag) return;
    if (pointerId !== null && evt.pointerId != null && evt.pointerId !== pointerId)
      return;
    if (evt.cancelable) evt.preventDefault();
    const pt = canvasPoint(evt);
    const aim = aimFromPointer(pt, drag.pointerKind || pt.kind);
    const { cell, ox, oy } = layoutMetrics();
    drag.aimX = aim.x;
    drag.aimY = aim.y;
    drag.x = drag.baseX + (aim.x - drag.startX);
    drag.y = drag.baseY + (aim.y - drag.startY);
    if (Math.hypot(aim.x - drag.startX, aim.y - drag.startY) > cell * 0.3) {
      drag.moved = true;
    }
    const hover = cellAt(
      Math.max(ox + cell * 0.05, Math.min(ox + (COLS - 0.05) * cell, aim.x)),
      Math.max(oy + cell * 0.05, Math.min(oy + (ROWS - 0.05) * cell, aim.y))
    );
    if (hover) {
      drag.dc = hover.c - drag.anchorC;
      drag.dr = hover.r - drag.anchorR;
    }
  }

  function endDrag(evt) {
    if (!drag) return;
    if (pointerId !== null && evt.pointerId != null && evt.pointerId !== pointerId)
      return;
    if (evt.cancelable) evt.preventDefault();

    if (!drag.moved) {
      const origin = drag.pieces[0];
      restoreDrag();
      selectedI = origin.originI;
      drag = null;
      pointerId = null;
      setStatus("Выбрано · нажми другой кусочек = обмен, или пустую клетку");
      return;
    }

    const ok = applyMove(drag.dc, drag.dr);
    if (!ok) {
      restoreDrag();
      drag = null;
      pointerId = null;
      setStatus("Не вышло · на полном поле клади кусочек НА другой (обмен)");
      return;
    }
    drag = null;
    pointerId = null;
    afterMove();
  }

  function findHint() {
    const list = [];
    for (let i = 0; i < grid.length; i++) if (grid[i]) list.push(i);
    for (const i of list) {
      const a = grid[i];
      for (const j of list) {
        if (i === j) continue;
        const b = grid[j];
        if (a.pic !== b.pic || a.gid === b.gid) continue;
        if (Math.abs(a.px - b.px) + Math.abs(a.py - b.py) === 1) {
          hintCell = i;
          hintUntil = performance.now() + 2600;
          setStatus("Подсказка: поменяй так, чтобы эти кусочки одной фото стали соседями");
          return;
        }
      }
    }
    if (list.length) {
      hintCell = list[(Math.random() * list.length) | 0];
      hintUntil = performance.now() + 2600;
      setStatus(`Собери квадрат ${PW}×${PH} одной фотографии`);
    }
  }

  function showPlay() {
    bootEl.hidden = true;
    playEl.hidden = false;
  }

  function showBoot() {
    playEl.hidden = true;
    winEl.hidden = true;
    if (helpEl) helpEl.hidden = true;
    bootEl.hidden = false;
    timerOn = false;
    drag = null;
    pointerId = null;
    selectedI = -1;
  }

  function readDiffFromUI() {
    const el = document.querySelector('input[name="diff"]:checked');
    const id = el?.value || "easy";
    diff = DIFFS[id] || DIFFS.easy;
  }

  async function startGame() {
    readDiffFromUI();
    showPlay();
    setStatus("Загрузка картинок…");
    const theme = themeForRound(roundIndex);
    try {
      await preloadPics(theme.pics);
      const next = themeForRound(roundIndex + 1);
      preloadPics(next.pics).catch(() => {});
    } catch (e) {
      setStatus("Не удалось загрузить фото");
      return;
    }
    startRound(roundIndex);
    try {
      if (!localStorage.getItem("pazl-help-v3") && helpEl) helpEl.hidden = false;
    } catch (_) {}
  }

  document.getElementById("btnStart").addEventListener("click", () => {
    roundIndex = 0;
    score = 0;
    startGame();
  });
  document.getElementById("btnMenu").addEventListener("click", showBoot);
  document.getElementById("btnHint").addEventListener("click", findHint);
  document.getElementById("btnHow").addEventListener("click", () => {
    if (helpEl) helpEl.hidden = false;
  });
  document.getElementById("btnHelpOk").addEventListener("click", () => {
    if (helpEl) helpEl.hidden = true;
    try {
      localStorage.setItem("pazl-help-v3", "1");
    } catch (_) {}
  });
  document.getElementById("btnNext").addEventListener("click", async () => {
    winEl.hidden = true;
    roundIndex = (roundIndex + 1) % LIBRARY.length;
    const theme = themeForRound(roundIndex);
    try {
      await preloadPics(theme.pics);
    } catch (_) {}
    startRound(roundIndex);
  });
  document.getElementById("btnAgain").addEventListener("click", async () => {
    winEl.hidden = true;
    const theme = themeForRound(roundIndex);
    try {
      await preloadPics(theme.pics);
    } catch (_) {}
    startRound(roundIndex);
  });

  canvas.addEventListener("pointerdown", beginDrag);
  canvas.addEventListener("pointermove", moveDrag);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (drag && e.cancelable) e.preventDefault();
    },
    { passive: false }
  );

  function resizeCanvas() {
    const wrap = document.getElementById("boardWrap");
    const cssW = Math.min(wrap.clientWidth || 360, 440);
    const cssH = Math.min(wrap.clientHeight || 520, 640);
    const ratio = COLS / Math.max(ROWS, 1);
    let w = cssW;
    let h = w / ratio;
    if (h > cssH) {
      h = cssH;
      w = h * ratio;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  updateHud();
  requestAnimationFrame(draw);
})();
