(() => {
  "use strict";

  const COLS = 5;
  const ROWS = 7;
  const PW = 2;
  const PH = 2;
  const PIECES_PER_PIC = PW * PH;

  const THEMES = [
    {
      id: "nature",
      name: "Природа",
      pics: ["nature-1", "nature-2", "nature-3", "nature-4"],
    },
    {
      id: "city",
      name: "Город",
      pics: ["city-1", "city-2", "city-3", "city-4"],
    },
    {
      id: "animals",
      name: "Животные",
      pics: ["animals-1", "animals-2", "animals-3", "animals-4"],
    },
    {
      id: "food",
      name: "Еда",
      pics: ["food-1", "food-2", "food-3", "food-4"],
    },
    {
      id: "space",
      name: "Космос",
      pics: ["space-1", "space-2", "space-3", "space-4"],
    },
  ];

  const bootEl = document.getElementById("boot");
  const playEl = document.getElementById("play");
  const winEl = document.getElementById("win");
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const themeNameEl = document.getElementById("themeName");
  const roundLabelEl = document.getElementById("roundLabel");
  const deckLabelEl = document.getElementById("deckLabel");
  const statusEl = document.getElementById("status");
  const winTitleEl = document.getElementById("winTitle");
  const winTextEl = document.getElementById("winText");

  /** @type {Map<string, HTMLImageElement>} */
  const images = new Map();

  let roundIndex = 0;
  let cleared = 0;
  let totalPics = 0;
  /** @type {(null|{id:number,pic:string,px:number,py:number,gid:number})[]} */
  let grid = [];
  /** @type {{pic:string,px:number,py:number}[]} */
  let deck = [];
  let nextId = 1;
  let nextGid = 1;
  let hintCell = -1;
  let hintUntil = 0;
  let animT = 0;
  let won = false;

  /** Drag state */
  let drag = null;
  let pointerId = null;

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

  async function preloadTheme(theme) {
    await Promise.all(theme.pics.map(loadImage));
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
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]) out.push(i);
    }
    return out;
  }

  function dealFromDeck(count) {
    let placed = 0;
    while (placed < count && deck.length) {
      // Prefer dropping into lowest empty cell per random column (gravity feel)
      const cols = shuffle([...Array(COLS).keys()]);
      let put = false;
      for (const c of cols) {
        for (let r = ROWS - 1; r >= 0; r--) {
          if (!grid[cellIndex(c, r)]) {
            // Fall from top: find topmost empty in column? Actually place at bottom-most empty
            // Better: place at highest empty (will gravity later) — place at top empty
            let top = -1;
            for (let rr = 0; rr < ROWS; rr++) {
              if (!grid[cellIndex(c, rr)]) {
                top = rr;
                break;
              }
            }
            if (top < 0) break;
            const raw = deck.pop();
            placePiece(c, top, {
              id: nextId++,
              pic: raw.pic,
              px: raw.px,
              py: raw.py,
              gid: nextGid++,
            });
            placed++;
            put = true;
            break;
          }
        }
        if (put) break;
      }
      if (!put) break;
    }
    applyGravity();
    relinkAll();
    return placed;
  }

  function applyGravity() {
    // Connected groups fall as one unit so jigsaw links stay intact.
    let moved = true;
    let guard = 0;
    while (moved && guard++ < 40) {
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
    // Reset gids then BFS merge connectable components
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
    if (cells.length !== PIECES_PER_PIC) return false;
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
    // Also verify relative board geometry is contiguous 2x2
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
    for (const cell of grid) {
      if (cell) gids.add(cell.gid);
    }
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

  function settleBoard() {
    let clearedAny = false;
    let guard = 0;
    while (guard++ < 40) {
      relinkAll();
      const n = clearCompleted();
      if (n) {
        clearedAny = true;
        setStatus(n === 1 ? "Картинка собрана!" : `Собрано картинок: ${n}`);
        applyGravity();
        continue;
      }
      const before = grid.map((p) => (p ? p.id : 0)).join(",");
      applyGravity();
      relinkAll();
      const after = grid.map((p) => (p ? p.id : 0)).join(",");
      if (before !== after) continue;
      break;
    }
    return clearedAny;
  }

  function afterMove() {
    let any = settleBoard();
    const free = findEmptyCells().length;
    if (deck.length && free) {
      dealFromDeck(Math.min(3, free, deck.length));
      if (settleBoard()) any = true;
    }
    updateHud();
    if (cleared >= totalPics && deck.length === 0 && !grid.some(Boolean)) {
      winRound();
    } else if (!any) {
      setStatus("Соединяй соседние кусочки одной картинки");
    }
  }

  function startRound(index) {
    won = false;
    winEl.hidden = true;
    roundIndex = ((index % THEMES.length) + THEMES.length) % THEMES.length;
    const theme = THEMES[roundIndex];
    themeNameEl.textContent = theme.name;
    roundLabelEl.textContent = `Раунд ${roundIndex + 1}/${THEMES.length}`;
    cleared = 0;
    totalPics = theme.pics.length;
    emptyGrid();
    deck = [];
    for (const pic of theme.pics) {
      deck.push(...makePiecesForPic(pic));
    }
    shuffle(deck);
    // Leave some pieces in the deck so clears refill the board
    const keepInDeck = Math.min(6, Math.max(4, Math.floor(deck.length / 3)));
    const initial = Math.max(8, deck.length - keepInDeck);
    dealFromDeck(initial);
    relinkAll();
    // Clear accidental completes at start (rare)
    while (clearCompleted()) {
      applyGravity();
      if (deck.length) dealFromDeck(Math.min(2, deck.length));
      relinkAll();
    }
    updateHud();
    setStatus(`Тема: ${theme.name}. Собери все картинки.`);
    hintCell = -1;
  }

  function updateHud() {
    deckLabelEl.textContent = `Колода: ${deck.length}`;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function winRound() {
    if (won) return;
    won = true;
    const last = roundIndex >= THEMES.length - 1;
    winTitleEl.textContent = last ? "Все раунды пройдены!" : "Раунд пройден";
    winTextEl.textContent = last
      ? "Можно пройти круг тем заново — картинки снова в колоде."
      : `Тема «${THEMES[roundIndex].name}» собрана. Дальше — новая тема.`;
    document.getElementById("btnNext").textContent = last ? "Сначала" : "Дальше";
    winEl.hidden = false;
  }

  function layoutMetrics() {
    const pad = 10;
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
    const clientX = evt.clientX ?? (evt.touches && evt.touches[0]?.clientX);
    const clientY = evt.clientY ?? (evt.touches && evt.touches[0]?.clientY);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function drawPiece(piece, x, y, size, alpha, lift) {
    const img = images.get(piece.pic);
    ctx.save();
    ctx.globalAlpha = alpha;
    const s = size - 4;
    const px = x + 2;
    const py = y + 2 - (lift || 0);
    ctx.beginPath();
    roundRect(px, py, s, s, 8);
    ctx.clip();
    if (img && img.complete) {
      const sw = img.width / PW;
      const sh = img.height / PH;
      ctx.drawImage(img, piece.px * sw, piece.py * sh, sw, sh, px, py, s, s);
    } else {
      ctx.fillStyle = "#2a6";
      ctx.fillRect(px, py, s, s);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    roundRect(px, py, s, s, 8);
    ctx.stroke();
    // tiny corner mark for orientation (top-left fragment)
    ctx.fillStyle = "rgba(12,59,58,0.45)";
    if (piece.px === 0 && piece.py === 0) {
      ctx.beginPath();
      ctx.arc(px + 10, py + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function draw() {
    animT += 1;
    const { cell, ox, oy } = layoutMetrics();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // board cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        ctx.fillStyle =
          (c + r) % 2 === 0 ? "rgba(232,242,239,0.06)" : "rgba(232,242,239,0.03)";
        roundRect(x + 1, y + 1, cell - 2, cell - 2, 10);
        ctx.fill();
      }
    }

    const dragging = new Set();
    if (drag) {
      for (const p of drag.pieces) dragging.add(p.id);
    }

    // static pieces
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = grid[cellIndex(c, r)];
        if (!p || dragging.has(p.id)) continue;
        const x = ox + c * cell;
        const y = oy + r * cell;
        const glow = hintCell === cellIndex(c, r) && performance.now() < hintUntil;
        if (glow) {
          ctx.save();
          ctx.shadowColor = "rgba(226,160,58,0.9)";
          ctx.shadowBlur = 16;
          drawPiece(p, x, y, cell, 1, Math.sin(animT / 8) * 2);
          ctx.restore();
        } else {
          drawPiece(p, x, y, cell, 1, 0);
        }
      }
    }

    // drag ghost target
    if (drag) {
      const { dc, dr } = drag;
      const valid = canPlaceDrag(dc, dr);
      for (const item of drag.pieces) {
        const tc = item.originC + dc;
        const tr = item.originR + dr;
        if (inBounds(tc, tr)) {
          const x = ox + tc * cell;
          const y = oy + tr * cell;
          ctx.fillStyle = valid
            ? "rgba(31,122,85,0.28)"
            : "rgba(181,74,58,0.28)";
          roundRect(x + 2, y + 2, cell - 4, cell - 4, 10);
          ctx.fill();
        }
      }

      for (const item of drag.pieces) {
        const x = drag.x + item.ox;
        const y = drag.y + item.oy;
        drawPiece(item.piece, x, y, cell, 0.95, 6);
      }
    }

    requestAnimationFrame(draw);
  }

  function canPlaceDrag(dc, dr) {
    if (!drag) return false;
    const occupied = new Set();
    for (const item of drag.pieces) occupied.add(item.originI);
    for (const item of drag.pieces) {
      const tc = item.originC + dc;
      const tr = item.originR + dr;
      if (!inBounds(tc, tr)) return false;
      const ti = cellIndex(tc, tr);
      const there = grid[ti];
      if (there && !occupied.has(ti)) return false;
    }
    return true;
  }

  function beginDrag(evt) {
    if (won || pointerId !== null) return;
    const pt = canvasPoint(evt);
    const hit = cellAt(pt.x, pt.y);
    if (!hit || !grid[hit.i]) return;
    const piece = grid[hit.i];
    const cells = groupCells(piece.gid);
    const { cell, ox, oy } = layoutMetrics();
    const pieces = cells.map((i) => {
      const c = i % COLS;
      const r = (i / COLS) | 0;
      return {
        piece: grid[i],
        originI: i,
        originC: c,
        originR: r,
        ox: c * cell - hit.c * cell,
        oy: r * cell - hit.r * cell,
      };
    });
    // remove from grid while dragging
    for (const item of pieces) grid[item.originI] = null;

    drag = {
      pieces,
      anchorC: hit.c,
      anchorR: hit.r,
      startX: pt.x,
      startY: pt.y,
      x: ox + hit.c * cell,
      y: oy + hit.r * cell,
      dc: 0,
      dr: 0,
      baseX: ox + hit.c * cell,
      baseY: oy + hit.r * cell,
    };
    pointerId = evt.pointerId ?? "touch";
    try {
      canvas.setPointerCapture?.(evt.pointerId);
    } catch (_) {}
    setStatus(pieces.length > 1 ? "Двигаешь группу" : "Двигаешь кусочек");
  }

  function moveDrag(evt) {
    if (!drag) return;
    if (pointerId !== null && evt.pointerId != null && evt.pointerId !== pointerId) return;
    const pt = canvasPoint(evt);
    const { cell, ox, oy } = layoutMetrics();
    drag.x = drag.baseX + (pt.x - drag.startX);
    drag.y = drag.baseY + (pt.y - drag.startY);
    const hover = cellAt(
      Math.max(ox + cell * 0.5, Math.min(ox + (COLS - 0.5) * cell, pt.x)),
      Math.max(oy + cell * 0.5, Math.min(oy + (ROWS - 0.5) * cell, pt.y))
    );
    if (hover) {
      drag.dc = hover.c - drag.anchorC;
      drag.dr = hover.r - drag.anchorR;
    }
  }

  function endDrag(evt) {
    if (!drag) return;
    if (pointerId !== null && evt.pointerId != null && evt.pointerId !== pointerId) return;
    const { dc, dr } = drag;
    if (canPlaceDrag(dc, dr) && (dc !== 0 || dr !== 0)) {
      for (const item of drag.pieces) {
        const tc = item.originC + dc;
        const tr = item.originR + dr;
        placePiece(tc, tr, item.piece);
      }
      drag = null;
      pointerId = null;
      afterMove();
    } else {
      // return
      for (const item of drag.pieces) {
        placePiece(item.originC, item.originR, item.piece);
      }
      drag = null;
      pointerId = null;
      setStatus("Соединяй соседние кусочки одной картинки");
    }
  }

  function findHint() {
    // Find two disconnected matching neighbors that could connect if moved — simple: highlight a piece that has a matching partner on board not yet connected
    const list = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) list.push(i);
    }
    for (const i of list) {
      const a = grid[i];
      const ac = i % COLS;
      const ar = (i / COLS) | 0;
      for (const j of list) {
        if (i === j) continue;
        const b = grid[j];
        if (a.pic !== b.pic || a.gid === b.gid) continue;
        const bc = j % COLS;
        const br = (j / COLS) | 0;
        // if they are already adjacent and should connect — relink should have joined; skip
        // suggest piece A
        if (
          Math.abs(a.px - b.px) + Math.abs(a.py - b.py) === 1
        ) {
          hintCell = i;
          hintUntil = performance.now() + 2200;
          setStatus("Подсказка: соедини подсвеченный кусочек с парой");
          return;
        }
      }
    }
    // fallback: highlight any incomplete pic piece
    if (list.length) {
      hintCell = list[(Math.random() * list.length) | 0];
      hintUntil = performance.now() + 2200;
      setStatus("Подсказка: собери кусочки одной фотографии рядом");
    } else {
      setStatus("Поле пусто — новые кусочки скоро появятся");
    }
  }

  function showPlay() {
    bootEl.hidden = true;
    playEl.hidden = false;
  }

  function showBoot() {
    playEl.hidden = true;
    winEl.hidden = true;
    bootEl.hidden = false;
    drag = null;
    pointerId = null;
  }

  async function startGame() {
    showPlay();
    setStatus("Загрузка картинок…");
    try {
      await preloadTheme(THEMES[roundIndex] || THEMES[0]);
      // preload next theme softly
      const next = THEMES[(roundIndex + 1) % THEMES.length];
      preloadTheme(next).catch(() => {});
    } catch (e) {
      setStatus("Не удалось загрузить фото — проверь папку assets");
      return;
    }
    startRound(roundIndex);
  }

  // Events
  document.getElementById("btnStart").addEventListener("click", () => {
    roundIndex = 0;
    startGame();
  });
  document.getElementById("btnMenu").addEventListener("click", showBoot);
  document.getElementById("btnHint").addEventListener("click", findHint);
  document.getElementById("btnNext").addEventListener("click", async () => {
    winEl.hidden = true;
    roundIndex = (roundIndex + 1) % THEMES.length;
    setStatus("Загрузка…");
    await preloadTheme(THEMES[roundIndex]);
    startRound(roundIndex);
  });
  document.getElementById("btnAgain").addEventListener("click", async () => {
    winEl.hidden = true;
    await preloadTheme(THEMES[roundIndex]);
    startRound(roundIndex);
  });

  canvas.addEventListener("pointerdown", beginDrag);
  canvas.addEventListener("pointermove", moveDrag);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  // HiDPI canvas
  function resizeCanvas() {
    const wrap = document.getElementById("boardWrap");
    const cssW = Math.min(wrap.clientWidth || 360, 420);
    const cssH = Math.min(wrap.clientHeight || 504, 560);
    const ratio = COLS / ROWS;
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
  requestAnimationFrame(draw);
})();
