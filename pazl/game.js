(() => {
  "use strict";

  // Slightly roomier board so fingers can aim
  const COLS = 4;
  const ROWS = 6;
  const PW = 2;
  const PH = 2;
  const PIECES_PER_PIC = PW * PH;
  const FINGER_LIFT_CELLS = 1.15; // aim point above the finger

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
  const helpEl = document.getElementById("help");
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
  /** Move whole connected group when true; otherwise only the touched piece */
  let moveGroup = false;

  /** @type {null|{
   *  pieces: {piece:any,originI:number,originC:number,originR:number,ox:number,oy:number}[],
   *  anchorC:number, anchorR:number,
   *  startX:number, startY:number,
   *  x:number, y:number, baseX:number, baseY:number,
   *  dc:number, dr:number,
   *  aimX:number, aimY:number,
   *  moved:boolean,
   *  pointerKind:string
   * }} */
  let drag = null;
  let pointerId = null;
  /** Selected cell index for tap-to-move (no drag) */
  let selectedI = -1;

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
      const cols = shuffle([...Array(COLS).keys()]);
      let put = false;
      for (const c of cols) {
        let top = -1;
        for (let rr = 0; rr < ROWS; rr++) {
          if (!grid[cellIndex(c, rr)]) {
            top = rr;
            break;
          }
        }
        if (top < 0) continue;
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

  /**
   * Gravity only after a picture clears (or when dealing).
   * After a normal move, pieces stay exactly where you put them.
   */
  function settleBoard(opts) {
    const { withGravity } = opts || { withGravity: false };
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
      if (withGravity) {
        const before = grid.map((p) => (p ? p.id : 0)).join(",");
        applyGravity();
        relinkAll();
        const after = grid.map((p) => (p ? p.id : 0)).join(",");
        if (before !== after) continue;
      }
      break;
    }
    return clearedAny;
  }

  function afterMove() {
    selectedI = -1;
    // Pieces keep their placed cells; gravity runs only if something cleared.
    let any = settleBoard({ withGravity: false });
    const free = findEmptyCells().length;
    if (deck.length && free && any) {
      dealFromDeck(Math.min(2, free, deck.length));
      if (settleBoard({ withGravity: false })) any = true;
    }
    updateHud();
    if (cleared >= totalPics && deck.length === 0 && !grid.some(Boolean)) {
      winRound();
    } else if (!any) {
      setStatus(
        moveGroup
          ? "Режим группы · поставь на зелёную клетку или поменяй местами"
          : "Поставь рядом кусочки одной фото · можно менять местами"
      );
    }
  }

  function picsForRound(index) {
    const theme = THEMES[index];
    // First round: only 2 photos so the board stays readable on a phone
    if (index === 0) return theme.pics.slice(0, 2);
    if (index === 1) return theme.pics.slice(0, 3);
    return theme.pics.slice();
  }

  function startRound(index) {
    won = false;
    winEl.hidden = true;
    selectedI = -1;
    drag = null;
    pointerId = null;
    roundIndex = ((index % THEMES.length) + THEMES.length) % THEMES.length;
    const theme = THEMES[roundIndex];
    const pics = picsForRound(roundIndex);
    themeNameEl.textContent = theme.name;
    roundLabelEl.textContent = `Раунд ${roundIndex + 1}/${THEMES.length}`;
    cleared = 0;
    totalPics = pics.length;
    emptyGrid();
    deck = [];
    for (const pic of pics) deck.push(...makePiecesForPic(pic));
    shuffle(deck);
    const keepInDeck = Math.min(4, Math.max(2, Math.floor(deck.length / 3)));
    const initial = Math.max(6, deck.length - keepInDeck);
    dealFromDeck(initial);
    relinkAll();
    while (clearCompleted()) {
      applyGravity();
      if (deck.length) dealFromDeck(Math.min(2, deck.length));
      relinkAll();
    }
    updateHud();
    setStatus(`Тема: ${theme.name}. Собери ${totalPics} фото (по 4 кусочка).`);
    hintCell = -1;
  }

  function updateHud() {
    deckLabelEl.textContent = `Колода: ${deck.length}`;
    const btn = document.getElementById("btnGroup");
    if (btn) {
      btn.classList.toggle("on", moveGroup);
      btn.textContent = moveGroup ? "Группа: вкл" : "Группа: выкл";
    }
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
    const pad = 8;
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
      kind: evt.pointerType || "mouse",
    };
  }

  /** Aim above the finger so the target cell is visible. */
  function aimFromPointer(pt, kind) {
    const { cell } = layoutMetrics();
    const lift = kind === "touch" || kind === "pen" ? cell * FINGER_LIFT_CELLS : 0;
    return { x: pt.x, y: pt.y - lift };
  }

  function drawPiece(piece, x, y, size, alpha, lift, selected) {
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
    ctx.strokeStyle = selected
      ? "rgba(226,160,58,0.95)"
      : "rgba(255,255,255,0.4)";
    ctx.lineWidth = selected ? 3.5 : 1.5;
    roundRect(px, py, s, s, 8);
    ctx.stroke();
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

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        ctx.fillStyle =
          (c + r) % 2 === 0 ? "rgba(232,242,239,0.07)" : "rgba(232,242,239,0.03)";
        roundRect(x + 1, y + 1, cell - 2, cell - 2, 10);
        ctx.fill();
      }
    }

    const dragging = new Set();
    if (drag) {
      for (const p of drag.pieces) dragging.add(p.id);
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = cellIndex(c, r);
        const p = grid[i];
        if (!p || dragging.has(p.id)) continue;
        const x = ox + c * cell;
        const y = oy + r * cell;
        const glow = hintCell === i && performance.now() < hintUntil;
        const sel = selectedI === i;
        if (glow) {
          ctx.save();
          ctx.shadowColor = "rgba(226,160,58,0.9)";
          ctx.shadowBlur = 16;
          drawPiece(p, x, y, cell, 1, Math.sin(animT / 8) * 2, sel);
          ctx.restore();
        } else {
          drawPiece(p, x, y, cell, 1, 0, sel);
        }
      }
    }

    if (drag) {
      const { dc, dr } = drag;
      const place = evaluatePlace(dc, dr);
      for (const item of drag.pieces) {
        const tc = item.originC + dc;
        const tr = item.originR + dr;
        if (inBounds(tc, tr)) {
          const x = ox + tc * cell;
          const y = oy + tr * cell;
          ctx.fillStyle = place.ok
            ? place.swap
              ? "rgba(226,160,58,0.35)"
              : "rgba(31,122,85,0.4)"
            : "rgba(181,74,58,0.35)";
          roundRect(x + 2, y + 2, cell - 4, cell - 4, 10);
          ctx.fill();
          ctx.strokeStyle = place.ok
            ? place.swap
              ? "rgba(226,160,58,0.95)"
              : "rgba(120,220,170,0.95)"
            : "rgba(255,140,120,0.9)";
          ctx.lineWidth = 3;
          roundRect(x + 3, y + 3, cell - 6, cell - 6, 9);
          ctx.stroke();
        }
      }

      // Aim reticle (where the piece will land)
      const ax = drag.aimX;
      const ay = drag.aimY;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.arc(ax, ay, Math.max(6, cell * 0.12), 0, Math.PI * 2);
      ctx.stroke();

      for (const item of drag.pieces) {
        const x = drag.x + item.ox;
        const y = drag.y + item.oy;
        drawPiece(item.piece, x, y, cell, 0.96, 8, false);
      }
    }

    requestAnimationFrame(draw);
  }

  /**
   * Empty cells → place. One piece onto one occupied cell → swap.
   * Moving set is already lifted off the board, so any piece on a target is foreign.
   */
  function evaluatePlace(dc, dr) {
    if (!drag) return { ok: false, swap: false };
    if (dc === 0 && dr === 0) return { ok: false, swap: false };

    const targets = [];
    for (const item of drag.pieces) {
      const tc = item.originC + dc;
      const tr = item.originR + dr;
      if (!inBounds(tc, tr)) return { ok: false, swap: false };
      targets.push({ item, tc, tr, ti: cellIndex(tc, tr) });
    }

    const blockers = targets.filter((t) => grid[t.ti]);
    if (blockers.length === 0) return { ok: true, swap: false, targets };
    if (drag.pieces.length === 1 && blockers.length === 1) {
      return { ok: true, swap: true, targets };
    }
    // Groups only land on fully empty footprints
    return { ok: false, swap: false };
  }

  function applyPlace(dc, dr) {
    const place = evaluatePlace(dc, dr);
    if (!place.ok) return false;

    // Origins were cleared when the drag started, so the board only holds
    // pieces that are not in the moving set.
    if (place.swap) {
      const item = drag.pieces[0];
      const tc = item.originC + dc;
      const tr = item.originR + dr;
      const ti = cellIndex(tc, tr);
      const other = grid[ti];
      grid[ti] = item.piece;
      item.piece.gid = nextGid++;
      if (other) {
        placePiece(item.originC, item.originR, other);
        other.gid = nextGid++;
      }
      return true;
    }

    for (const item of drag.pieces) {
      placePiece(item.originC + dc, item.originR + dr, item.piece);
      item.piece.gid = nextGid++;
    }
    return true;
  }

  function restoreDrag() {
    if (!drag) return;
    for (const item of drag.pieces) {
      placePiece(item.originC, item.originR, item.piece);
    }
  }

  function piecesForPickup(hit) {
    const piece = grid[hit.i];
    if (!piece) return [];
    const cells =
      moveGroup && groupCells(piece.gid).length > 1
        ? groupCells(piece.gid)
        : [hit.i];
    const { cell } = layoutMetrics();
    return cells.map((i) => {
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
  }

  function beginDrag(evt) {
    if (won || pointerId !== null) return;
    if (evt.cancelable) evt.preventDefault();
    const pt = canvasPoint(evt);
    const hit = cellAt(pt.x, pt.y);

    // Tap-to-place: already selected → second tap chooses destination
    if (selectedI >= 0 && hit) {
      if (hit.i === selectedI) {
        selectedI = -1;
        setStatus("Отмена выбора");
        return;
      }
      const selPiece = grid[selectedI];
      if (!selPiece) {
        selectedI = -1;
      } else {
        const sc = selectedI % COLS;
        const sr = (selectedI / COLS) | 0;
        const pieces = moveGroup
          ? groupCells(selPiece.gid).map((i) => {
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
            })
          : [
              {
                piece: selPiece,
                originI: selectedI,
                originC: sc,
                originR: sr,
                ox: 0,
                oy: 0,
              },
            ];
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
        const ok = applyPlace(drag.dc, drag.dr);
        if (!ok) {
          restoreDrag();
          setStatus("Сюда нельзя — выбери пустую клетку или один кусочек для обмена");
        } else {
          drag = null;
          afterMove();
          return;
        }
        drag = null;
        selectedI = -1;
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
      dc: 0,
      dr: 0,
      baseX: ox + hit.c * cell,
      baseY: oy + hit.r * cell,
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
        ? "Тяни группу · зелёная клетка = сюда встанет"
        : "Тяни выше пальца · жёлтая = обмен местами"
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
    // Keep the grabbed piece under the aim point (above finger)
    drag.x = drag.baseX + (aim.x - drag.startX);
    drag.y = drag.baseY + (aim.y - drag.startY);
    if (
      Math.hypot(aim.x - drag.startX, aim.y - drag.startY) >
      cell * 0.35
    ) {
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

    // Tap without moving = select for two-tap place
    if (!drag.moved && drag.pieces.length >= 1) {
      const origin = drag.pieces[0];
      restoreDrag();
      selectedI = origin.originI;
      drag = null;
      pointerId = null;
      setStatus("Выбрано · нажми клетку, куда поставить (или другой кусочек = обмен)");
      return;
    }

    const { dc, dr } = drag;
    const ok = applyPlace(dc, dr);
    if (!ok) {
      restoreDrag();
      drag = null;
      pointerId = null;
      setStatus("Не встало · нужна пустая клетка или обмен с одним кусочком");
      return;
    }
    drag = null;
    pointerId = null;
    afterMove();
  }

  function findHint() {
    const list = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) list.push(i);
    }
    for (const i of list) {
      const a = grid[i];
      for (const j of list) {
        if (i === j) continue;
        const b = grid[j];
        if (a.pic !== b.pic || a.gid === b.gid) continue;
        if (Math.abs(a.px - b.px) + Math.abs(a.py - b.py) === 1) {
          hintCell = i;
          hintUntil = performance.now() + 2500;
          setStatus("Подсказка: этот кусочек должен стоять рядом с парой той же фото");
          return;
        }
      }
    }
    if (list.length) {
      hintCell = list[(Math.random() * list.length) | 0];
      hintUntil = performance.now() + 2500;
      setStatus("Подсказка: собери 4 кусочка одной фото в квадрат 2×2");
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
    drag = null;
    pointerId = null;
    selectedI = -1;
  }

  async function startGame() {
    showPlay();
    setStatus("Загрузка картинок…");
    try {
      await preloadTheme(THEMES[roundIndex] || THEMES[0]);
      const next = THEMES[(roundIndex + 1) % THEMES.length];
      preloadTheme(next).catch(() => {});
    } catch (e) {
      setStatus("Не удалось загрузить фото");
      return;
    }
    startRound(roundIndex);
    const seen = localStorage.getItem("pazl-help-v2");
    if (!seen && helpEl) {
      helpEl.hidden = false;
    }
  }

  document.getElementById("btnStart").addEventListener("click", () => {
    roundIndex = 0;
    startGame();
  });
  document.getElementById("btnMenu").addEventListener("click", showBoot);
  document.getElementById("btnHint").addEventListener("click", findHint);
  document.getElementById("btnHow").addEventListener("click", () => {
    if (helpEl) helpEl.hidden = false;
  });
  document.getElementById("btnGroup").addEventListener("click", () => {
    moveGroup = !moveGroup;
    updateHud();
    setStatus(
      moveGroup
        ? "Режим группы: соединённые кусочки едут вместе"
        : "Режим одного кусочка: удобнее на телефоне"
    );
  });
  document.getElementById("btnHelpOk").addEventListener("click", () => {
    if (helpEl) helpEl.hidden = true;
    try {
      localStorage.setItem("pazl-help-v2", "1");
    } catch (_) {}
  });
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
  // Stop Safari page scroll while playing on the board
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (drag && e.cancelable) e.preventDefault();
    },
    { passive: false }
  );

  function resizeCanvas() {
    const wrap = document.getElementById("boardWrap");
    const cssW = Math.min(wrap.clientWidth || 360, 420);
    const cssH = Math.min(wrap.clientHeight || 504, 620);
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
  updateHud();
  requestAnimationFrame(draw);
})();
