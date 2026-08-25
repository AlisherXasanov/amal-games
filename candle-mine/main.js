/**
 * Свеча в шахте — тёмный лабиринт со свечой.
 * Воск тает, сквозняк гасит пламя, стены твёрдые (без проваливания).
 */
(function () {
  window.__AMAL_NO_WORLD__ = true;

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const waxEl = document.getElementById("waxFill");
  const flameEl = document.getElementById("flameFill");
  const toastEl = document.getElementById("toast");
  const winEl = document.getElementById("win");
  const winTitle = document.getElementById("winTitle");
  const winText = document.getElementById("winText");

  const TILE = 40;
  const PLAYER_R = 12;

  // 0 пусто, 1 стена, 2 воск, 3 сквозняк, 4 лестница, 5 старт
  const LEVELS = [
    [
      "####################",
      "#S....#......#....E#",
      "#.###.#.####.#.#####",
      "#.#W..#....#...W#..#",
      "#.#.######.#.#####.#",
      "#.#......#.#.......#",
      "#.######.#.#####.#.#",
      "#....W...#...G...#.#",
      "#.##########.###.#.#",
      "#............D.....#",
      "####################",
    ],
    [
      "######################",
      "#S.#....W....#......E#",
      "#.#.########.#.####.##",
      "#.#......#...#.#W....#",
      "#.######.#.###.#.#####",
      "#....D...#.....#.....#",
      "####.###########.##.##",
      "#W...#....D....#..W..#",
      "#.####.#######.##.##.#",
      "#......#....G.......##",
      "######################",
    ],
    [
      "########################",
      "#S........D........#..E#",
      "######.#########.#.#.###",
      "#W...#.#....W....#.#..W#",
      "#.##.#.#.#########.##.##",
      "#.#..#.#....D......#...#",
      "#.#.##.###########.#.#.#",
      "#.#W........G......#.#.#",
      "#.##############.###.#.#",
      "#................D...W.#",
      "########################",
    ],
  ];

  let levelIndex = 0;
  let grid = [];
  let cols = 0;
  let rows = 0;
  let player = { x: 0, y: 0, vx: 0, vy: 0 };
  let wax = 1;
  let flame = 1;
  let drops = [];
  let drafts = [];
  let exit = { x: 0, y: 0 };
  let won = false;
  let dead = false;
  let keys = Object.create(null);
  let toastTimer = 0;
  let time = 0;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    toastTimer = 2.2;
  }

  function parseLevel(lines) {
    grid = lines.map((row) => row.split(""));
    rows = grid.length;
    cols = grid[0].length;
    drops = [];
    drafts = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = grid[y][x];
        if (c === "S") {
          player.x = x * TILE + TILE / 2;
          player.y = y * TILE + TILE / 2;
          grid[y][x] = ".";
        } else if (c === "E") {
          exit.x = x * TILE + TILE / 2;
          exit.y = y * TILE + TILE / 2;
          grid[y][x] = ".";
        } else if (c === "W") {
          drops.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, taken: false });
          grid[y][x] = ".";
        } else if (c === "D") {
          drafts.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, r: TILE * 1.1 });
          grid[y][x] = ".";
        } else if (c === "G") {
          // масляная лужа — чуть воска
          drops.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, taken: false, big: true });
          grid[y][x] = ".";
        }
      }
    }
  }

  function solidAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return true;
    return grid[ty][tx] === "#";
  }

  /** Круг vs тайлы — без проваливания сквозь стены */
  function resolvePlayer(nx, ny) {
    let x = nx;
    let y = ny;
    const r = PLAYER_R;
    for (let pass = 0; pass < 4; pass++) {
      const minTX = Math.floor((x - r) / TILE);
      const maxTX = Math.floor((x + r) / TILE);
      const minTY = Math.floor((y - r) / TILE);
      const maxTY = Math.floor((y + r) / TILE);
      let moved = false;
      for (let ty = minTY; ty <= maxTY; ty++) {
        for (let tx = minTX; tx <= maxTX; tx++) {
          if (!solidAt(tx, ty)) continue;
          const left = tx * TILE;
          const right = left + TILE;
          const top = ty * TILE;
          const bottom = top + TILE;
          const cx = Math.max(left, Math.min(right, x));
          const cy = Math.max(top, Math.min(bottom, y));
          let dx = x - cx;
          let dy = y - cy;
          let d = Math.hypot(dx, dy);
          if (d < 1e-6) {
            // центр внутри тайла — вытолкнуть к ближайшей грани
            const toL = x - left;
            const toR = right - x;
            const toT = y - top;
            const toB = bottom - y;
            const m = Math.min(toL, toR, toT, toB);
            if (m === toL) x = left - r - 0.01;
            else if (m === toR) x = right + r + 0.01;
            else if (m === toT) y = top - r - 0.01;
            else y = bottom + r + 0.01;
            moved = true;
            continue;
          }
          if (d < r) {
            const push = (r - d) / d;
            x += dx * push;
            y += dy * push;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    return { x, y };
  }

  function loadLevel(i) {
    levelIndex = i;
    wax = 1;
    flame = 1;
    won = false;
    dead = false;
    player.vx = 0;
    player.vy = 0;
    winEl.classList.remove("show");
    parseLevel(LEVELS[i]);
    showToast("Шахта " + (i + 1) + " из " + LEVELS.length);
  }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  // тач: виртуальный стик по клику/драгу
  let stick = null;
  canvas.addEventListener("pointerdown", (e) => {
    stick = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, id: e.pointerId };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  canvas.addEventListener("pointermove", (e) => {
    if (stick && stick.id === e.pointerId) {
      stick.x = e.clientX;
      stick.y = e.clientY;
    }
  });
  function endStick(e) {
    if (stick && stick.id === e.pointerId) stick = null;
  }
  canvas.addEventListener("pointerup", endStick);
  canvas.addEventListener("pointercancel", endStick);

  document.getElementById("again").addEventListener("click", () => loadLevel(0));
  document.getElementById("next").addEventListener("click", () => {
    if (levelIndex + 1 < LEVELS.length) loadLevel(levelIndex + 1);
    else loadLevel(0);
  });

  function inputDir() {
    let ix = 0;
    let iy = 0;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1;
    if (keys.KeyW || keys.ArrowUp) iy -= 1;
    if (keys.KeyS || keys.ArrowDown) iy += 1;
    if (stick) {
      const dx = stick.x - stick.x0;
      const dy = stick.y - stick.y0;
      const len = Math.hypot(dx, dy);
      if (len > 12) {
        ix += dx / len;
        iy += dy / len;
      }
    }
    const l = Math.hypot(ix, iy) || 1;
    return { x: ix / l, y: iy / l };
  }

  let last = performance.now();

  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    time += dt;

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toastEl.classList.remove("show");
    }

    if (!won && !dead) {
      const dir = inputDir();
      const speed = 118;
      player.vx = dir.x * speed;
      player.vy = dir.y * speed;

      // субшаги — не проскочить стену
      const steps = 4;
      const h = dt / steps;
      for (let s = 0; s < steps; s++) {
        const nx = player.x + player.vx * h;
        const ny = player.y + player.vy * h;
        // сначала по X
        let r = resolvePlayer(nx, player.y);
        player.x = r.x;
        r = resolvePlayer(player.x, ny);
        player.y = r.y;
      }

      // воск тает
      wax = Math.max(0, wax - dt * 0.028);
      // пламя зависит от воска + сквозняки
      let inDraft = false;
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        if (Math.hypot(player.x - d.x, player.y - d.y) < d.r) {
          inDraft = true;
          break;
        }
      }
      if (inDraft) flame = Math.max(0, flame - dt * 0.55);
      else flame = Math.min(1, flame + dt * 0.12);

      if (wax <= 0.001) flame = Math.max(0, flame - dt * 0.8);

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        if (d.taken) continue;
        if (Math.hypot(player.x - d.x, player.y - d.y) < PLAYER_R + 10) {
          d.taken = true;
          wax = Math.min(1, wax + (d.big ? 0.45 : 0.22));
          flame = Math.min(1, flame + 0.25);
          showToast(d.big ? "Масляная лужа — воск пополнился" : "Капля воска");
        }
      }

      if (Math.hypot(player.x - exit.x, player.y - exit.y) < TILE * 0.55) {
        won = true;
        if (levelIndex + 1 >= LEVELS.length) {
          winTitle.textContent = "Свет наверху";
          winText.textContent = "Ты выбрался из всех шахт. Свеча ещё тлеет.";
          document.getElementById("next").textContent = "Заново";
        } else {
          winTitle.textContent = "Лестница!";
          winText.textContent = "Ещё глубже — или выше. Держи пламя.";
          document.getElementById("next").textContent = "Дальше";
        }
        winEl.classList.add("show");
      }

      if (flame <= 0.02) {
        dead = true;
        showToast("Пламя погасло…");
        setTimeout(() => loadLevel(levelIndex), 1200);
      }
    }

    waxEl.style.transform = "scaleX(" + wax.toFixed(3) + ")";
    flameEl.style.transform = "scaleX(" + flame.toFixed(3) + ")";

    draw();
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#050403";
    ctx.fillRect(0, 0, w, h);

    const camX = player.x - w / 2;
    const camY = player.y - h / 2;

    const lightR = 70 + flame * 140 * (0.55 + wax * 0.45);

    // мир в светлом проходе
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, lightR, 0, Math.PI * 2);
    ctx.clip();

    ctx.translate(-camX, -camY);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] !== "#") continue;
        const px = x * TILE;
        const py = y * TILE;
        ctx.fillStyle = "#3a2a1c";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = "rgba(0,0,0,.35)";
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        ctx.fillStyle = "rgba(80,55,35,.35)";
        ctx.fillRect(px + 4, py + 4, TILE - 8, 6);
      }
    }

    // пол
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === "#") continue;
        ctx.fillStyle = (x + y) % 2 === 0 ? "#1a1410" : "#16110e";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }

    // сквозняки
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const pulse = 0.5 + 0.5 * Math.sin(time * 6 + i);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (0.85 + pulse * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(140,190,220," + (0.08 + pulse * 0.06) + ")";
      ctx.fill();
      ctx.fillStyle = "rgba(200,230,255,.35)";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("сквозняк", d.x, d.y + 4);
    }

    // капли воска
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.taken) continue;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.big ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = d.big ? "#c9a227" : "#e8b44c";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,240,180,.5)";
      ctx.stroke();
    }

    // выход
    ctx.fillStyle = "#2f6b3a";
    ctx.fillRect(exit.x - 14, exit.y - 18, 28, 36);
    ctx.strokeStyle = "#8fd99a";
    ctx.lineWidth = 2;
    ctx.strokeRect(exit.x - 14, exit.y - 18, 28, 36);
    ctx.fillStyle = "#b8f0c0";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("выход", exit.x, exit.y + 28);

    // игрок + свеча
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
    ctx.fillStyle = "#c4a574";
    ctx.fill();
    ctx.strokeStyle = "#5c4030";
    ctx.lineWidth = 2;
    ctx.stroke();

    // свеча в руке
    ctx.fillStyle = "#f5e6c8";
    ctx.fillRect(player.x + 6, player.y - 18, 5, 14);
    if (flame > 0.05) {
      const flick = 1 + Math.sin(time * 18) * 0.12;
      const fr = 5 * flame * flick;
      const grd = ctx.createRadialGradient(player.x + 8, player.y - 22, 0, player.x + 8, player.y - 22, fr * 2);
      grd.addColorStop(0, "rgba(255,240,160,.95)");
      grd.addColorStop(0.45, "rgba(255,140,40,.7)");
      grd.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(player.x + 8, player.y - 22, fr * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // тьма вокруг света
    const g = ctx.createRadialGradient(w / 2, h / 2, lightR * 0.35, w / 2, h / 2, lightR * 1.15);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.55, "rgba(0,0,0,.25)");
    g.addColorStop(1, "rgba(0,0,0,.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(0,0,0,.88)";
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.arc(w / 2, h / 2, lightR, 0, Math.PI * 2, true);
    ctx.fill();
  }

  loadLevel(0);
  requestAnimationFrame(tick);
})();
