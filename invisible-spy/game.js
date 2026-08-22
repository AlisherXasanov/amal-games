(() => {
  "use strict";
  const SAVE = "amal-invisible-spy-v1";
  const TW = 24, TH = 16, TS = 36;
  const app = document.getElementById("app");
  app.innerHTML =
    '<canvas id="c"></canvas>' +
    '<div class="hud"><span class="chip" id="lvl">Уровень 1</span><span class="chip" id="file">📁 нет</span><span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="energy"><div class="bar"><i id="cloakBar"></i></div></div>' +
    '<div class="pad"><button type="button" data-d="0,-1">↑</button><div class="row">' +
    '<button type="button" data-d="-1,0">←</button><button type="button" data-d="0,1">↓</button><button type="button" data-d="1,0">→</button></div></div>' +
    '<div class="actions"><button type="button" id="btnCloak">👻 Плащ</button><button type="button" id="btnDistract">🍭 Приманка</button><button type="button" id="btnMute">🔊</button></div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>🕵️ Плащ-Невидимка</h1>' +
    '<p>Проберись на фабрику конфет. Стой — почти невидим. Беги — искры заметят. Возьми секретный файл 📁 и выйди к двери 🚪. WASD / стрелки / кнопки.</p>' +
    '<button type="button" class="btn" id="btnStart">НАЧАТЬ</button></div></div>' +
    '<div class="overlay hidden" id="end"><div class="panel"><h1 id="endTitle"></h1><p id="endText"></p>' +
    '<button type="button" class="btn" id="btnAgain">Дальше</button></div></div>' +
    '<div class="toast" id="toast"></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  let muted = false, state = "menu", level = 1, best = 0;
  let map = [], player, guards = [], cameras = [], filePos, exitPos, hasFile = false;
  let cloak = 100, cloakOn = false, spark = 0, distract = null, keys = {};
  let timeStop = false, invincible = false;

  try { best = parseInt(localStorage.getItem(SAVE), 10) || 0; } catch (_) {}
  el("best").textContent = "Рекорд: " + best;

  function toast(m) {
    const n = el("toast"); n.textContent = m; n.classList.add("show");
    clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("show"), 1600);
  }
  function beep(f, d) {
    if (muted) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(a.destination); o.start();
      setTimeout(() => { o.stop(); a.close(); }, d || 70);
    } catch (_) {}
  }

  const LEVELS = [
    // 0 wall, 1 floor, 2 start, 3 file, 4 exit
    [
      "########################",
      "#2....#......#........#",
      "#.###.#.####.#.##.###.#",
      "#.#...#....#.#....#...#",
      "#.#.#####..#.######.#.#",
      "#.#.......#........#..#",
      "#.#########.######.##.#",
      "#.........#.#....#....#",
      "#####.###.#.#.##.####.#",
      "#...#...#.#.#.#.....#.#",
      "#.#.###.#.#.#.#.###.#.#",
      "#.#.....#...#.#.#3#...#",
      "#.#############.#.####",
      "#...............#....4#",
      "########################",
      "########################",
    ],
    [
      "########################",
      "#2.#........#.........#",
      "#..#.######.#.#######.#",
      "##.#......#.#.......#.#",
      "#..######.#.#######.#.#",
      "#.........#.......#...#",
      "#.#########.#####.###.#",
      "#.#.......#.#...#.....#",
      "#.#.#####.#.#.#.#####.#",
      "#.#.#...#.#.#.#.....#.#",
      "#.#.#.#.#.#.#.#####.#.#",
      "#...#.#.#...#...3#..#.#",
      "#####.#.#########.#.#.#",
      "#.....#...........#..4#",
      "########################",
      "########################",
    ],
    [
      "########################",
      "#2.....................#",
      "#.####################.#",
      "#.#..................#.#",
      "#.#.################.#.#",
      "#.#.#..............#.#.#",
      "#.#.#.############.#.#.#",
      "#.#.#.#..........#.#.#.#",
      "#.#.#.#.########.#.#.#.#",
      "#.#.#.#.#......#.#.#.#.#",
      "#.#.#.#.#.####.#.#.#.#.#",
      "#.#...#.#.#3...#.#...#.#",
      "#.#####.#.######.#####.#",
      "#.......#........#....4#",
      "########################",
      "########################",
    ],
  ];

  function buildLevel(n) {
    const raw = LEVELS[(n - 1) % LEVELS.length];
    map = [];
    guards = [];
    cameras = [];
    hasFile = false;
    cloak = 100;
    cloakOn = false;
    spark = 0;
    distract = null;
    for (let y = 0; y < TH; y++) {
      map[y] = [];
      const row = raw[y] || "#".repeat(TW);
      for (let x = 0; x < TW; x++) {
        const ch = row[x] || "#";
        if (ch === "#") map[y][x] = 0;
        else {
          map[y][x] = 1;
          if (ch === "2") player = { x: x + 0.5, y: y + 0.5, vx: 0, vy: 0 };
          if (ch === "3") filePos = { x: x + 0.5, y: y + 0.5 };
          if (ch === "4") exitPos = { x: x + 0.5, y: y + 0.5 };
        }
      }
    }
    // guards patrol
    const patrols = n === 1
      ? [[[5, 5], [10, 5], [10, 10], [5, 10]], [[14, 3], [18, 3], [18, 8], [14, 8]]]
      : n === 2
        ? [[[6, 4], [12, 4], [12, 9]], [[16, 6], [16, 11], [10, 11]], [[4, 10], [8, 10]]]
        : [[[3, 3], [20, 3]], [[3, 8], [20, 8]], [[8, 5], [8, 12]], [[15, 5], [15, 12]]];
    for (const path of patrols) {
      guards.push({ path, i: 0, t: 0, x: path[0][0] + 0.5, y: path[0][1] + 0.5, alert: 0 });
    }
    cameras = n === 1
      ? [{ x: 11.5, y: 2.5, a: 0, sweep: 1.2 }, { x: 17.5, y: 7.5, a: Math.PI, sweep: -1 }]
      : [{ x: 9.5, y: 2.5, a: 0, sweep: 1.4 }, { x: 19.5, y: 5.5, a: 2, sweep: -1.1 }, { x: 5.5, y: 12.5, a: -1, sweep: 0.9 }];
    el("lvl").textContent = "Уровень " + level;
    el("file").textContent = "📁 нет";
  }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener("resize", resize); resize();

  function blocked(x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) return true;
    return map[ty][tx] === 0;
  }

  function start() {
    state = "play";
    buildLevel(level);
    el("menu").classList.add("hidden");
    el("end").classList.add("hidden");
    toast("Уровень " + level + " · найди файл");
  }

  function caught(reason) {
    if (invincible) return;
    state = "end";
    el("endTitle").textContent = "🚨 Обнаружен!";
    el("endText").textContent = reason + " Попробуй ещё раз.";
    el("btnAgain").textContent = "Заново";
    el("end").classList.remove("hidden");
    beep(160, 200);
  }

  function winLevel() {
    state = "end";
    if (level > best) { best = level; try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
    el("best").textContent = "Рекорд: " + best;
    if (level >= 3) {
      el("endTitle").textContent = "🏆 Миссия выполнена!";
      el("endText").textContent = "Все секреты украдены. Ты супер-агент!";
      el("btnAgain").textContent = "С начала";
      level = 1;
    } else {
      el("endTitle").textContent = "✅ Файл добыт!";
      el("endText").textContent = "Переходи на уровень " + (level + 1);
      el("btnAgain").textContent = "Дальше";
      level++;
    }
    el("end").classList.remove("hidden");
    beep(880, 150);
  }

  function visibleTo(g, px, py) {
    const dx = px - g.x, dy = py - g.y;
    const d = Math.hypot(dx, dy);
    if (d > 4.2) return false;
    // line of sight
    const steps = Math.ceil(d * 4);
    for (let i = 1; i < steps; i++) {
      const x = g.x + (dx * i) / steps, y = g.y + (dy * i) / steps;
      if (blocked(x, y)) return false;
    }
    return true;
  }

  function update(dt) {
    if (state !== "play") return;
    if (timeStop) dt *= 0.05;
    let mx = 0, my = 0;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    const moving = mx || my;
    const speed = cloakOn ? 1.6 : (moving ? 2.8 : 0);
    if (moving) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len; my /= len;
      const nx = player.x + mx * speed * dt;
      const ny = player.y + my * speed * dt;
      if (!blocked(nx, player.y)) player.x = nx;
      if (!blocked(player.x, ny)) player.y = ny;
      if (!cloakOn) spark = Math.min(1, spark + dt * 1.6);
      else spark = Math.max(0, spark - dt);
    } else {
      spark = Math.max(0, spark - dt * 2);
    }
    if (cloakOn) {
      cloak = Math.max(0, cloak - dt * 18);
      if (cloak <= 0) { cloakOn = false; toast("Плащ разряжен"); }
    } else cloak = Math.min(100, cloak + dt * 10);
    el("cloakBar").style.width = cloak + "%";

    // file pickup
    if (!hasFile && filePos && Math.hypot(player.x - filePos.x, player.y - filePos.y) < 0.7) {
      hasFile = true; filePos = null;
      el("file").textContent = "📁 есть!";
      toast("Файл взят! Беги к двери");
      beep(700, 80);
    }
    if (hasFile && exitPos && Math.hypot(player.x - exitPos.x, player.y - exitPos.y) < 0.8) {
      winLevel(); return;
    }

    // distract
    if (distract) {
      distract.t -= dt;
      if (distract.t <= 0) distract = null;
    }

    for (const g of guards) {
      const target = distract || null;
      if (target && Math.hypot(g.x - target.x, g.y - target.y) < 6) {
        const dx = target.x - g.x, dy = target.y - g.y;
        const L = Math.hypot(dx, dy) || 1;
        g.x += (dx / L) * 1.8 * dt;
        g.y += (dy / L) * 1.8 * dt;
      } else {
        const goal = g.path[g.i];
        const gx = goal[0] + 0.5, gy = goal[1] + 0.5;
        const dx = gx - g.x, dy = gy - g.y;
        const L = Math.hypot(dx, dy);
        if (L < 0.15) g.i = (g.i + 1) % g.path.length;
        else { g.x += (dx / L) * 1.5 * dt; g.y += (dy / L) * 1.5 * dt; }
      }
      const stealth = cloakOn || (!moving && spark < 0.2);
      if (!stealth && visibleTo(g, player.x, player.y)) {
        g.alert += dt;
        if (g.alert > 0.45) { caught("Охранник заметил искры!"); return; }
      } else g.alert = Math.max(0, g.alert - dt);
    }
    for (const cam of cameras) {
      cam.a += cam.sweep * dt;
      const dx = player.x - cam.x, dy = player.y - cam.y;
      const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      let da = Math.abs(((ang - cam.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const stealth = cloakOn || (!moving && spark < 0.15);
      if (!stealth && d < 5 && da < 0.55 && !blocked((cam.x + player.x) / 2, (cam.y + player.y) / 2)) {
        caught("Камера поймала тебя!"); return;
      }
    }
  }

  function draw() {
    const scale = Math.min(canvas.width / (TW * TS), canvas.height / (TH * TS));
    const ox = (canvas.width - TW * TS * scale) / 2;
    const oy = (canvas.height - TH * TS * scale) / 2;
    ctx.fillStyle = "#071018"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(ox, oy); ctx.scale(scale, scale);
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      if (map[y] && map[y][x] === 0) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x * TS, y * TS, TS, TS);
      } else {
        ctx.fillStyle = (x + y) % 2 ? "#0f3d36" : "#0c332d";
        ctx.fillRect(x * TS, y * TS, TS, TS);
      }
    }
    if (filePos) { ctx.font = "22px system-ui"; ctx.fillText("📁", filePos.x * TS - 12, filePos.y * TS + 8); }
    if (exitPos) { ctx.font = "22px system-ui"; ctx.fillText("🚪", exitPos.x * TS - 12, exitPos.y * TS + 8); }
    if (distract) { ctx.font = "20px system-ui"; ctx.fillText("🍭", distract.x * TS - 10, distract.y * TS + 8); }
    for (const cam of cameras) {
      ctx.fillStyle = "#f87171";
      ctx.beginPath(); ctx.arc(cam.x * TS, cam.y * TS, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(248,113,113,.25)";
      ctx.beginPath(); ctx.moveTo(cam.x * TS, cam.y * TS);
      ctx.arc(cam.x * TS, cam.y * TS, 5 * TS, cam.a - 0.55, cam.a + 0.55);
      ctx.closePath(); ctx.fillStyle = "rgba(248,113,113,.12)"; ctx.fill();
    }
    for (const g of guards) {
      ctx.font = "22px system-ui";
      ctx.fillText(g.alert > 0.1 ? "😠" : "🤖", g.x * TS - 12, g.y * TS + 8);
    }
    const alpha = cloakOn ? 0.25 : (spark > 0.3 ? 1 : 0.55 + spark);
    ctx.globalAlpha = alpha;
    ctx.font = "24px system-ui";
    ctx.fillText("🕵️", player.x * TS - 12, player.y * TS + 8);
    if (!cloakOn && spark > 0.35) {
      ctx.globalAlpha = spark;
      ctx.fillStyle = "#fde68a";
      ctx.beginPath(); ctx.arc(player.x * TS, player.y * TS, 10 + spark * 8, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") { e.preventDefault(); el("btnCloak").click(); }
    if (e.code === "KeyE") el("btnDistract").click();
  });
  addEventListener("keyup", (e) => { keys[e.code] = false; });
  document.querySelectorAll(".pad button").forEach((b) => {
    const [dx, dy] = b.getAttribute("data-d").split(",").map(Number);
    const press = () => {
      keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false;
      if (dx < 0) keys.ArrowLeft = true;
      if (dx > 0) keys.ArrowRight = true;
      if (dy < 0) keys.ArrowUp = true;
      if (dy > 0) keys.ArrowDown = true;
    };
    const release = () => { keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false; };
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); press(); });
    b.addEventListener("pointerup", release);
    b.addEventListener("pointerleave", release);
  });
  el("btnCloak").onclick = () => {
    if (state !== "play") return;
    if (!cloakOn && cloak < 15) { toast("Мало энергии плаща"); return; }
    cloakOn = !cloakOn;
    toast(cloakOn ? "Плащ включён" : "Плащ выключен");
    beep(cloakOn ? 500 : 300, 60);
  };
  el("btnDistract").onclick = () => {
    if (state !== "play") return;
    distract = { x: player.x + 1.2, y: player.y, t: 4 };
    toast("Приманка брошена!");
    beep(420, 80);
  };
  el("btnMute").onclick = () => { muted = !muted; el("btnMute").textContent = muted ? "🔇" : "🔊"; };
  el("btnStart").onclick = start;
  el("btnAgain").onclick = start;

  window.addEventListener("amal-power", (e) => {
    const d = (e && e.detail) || {};
    if (d.type === "is-xray") toast("🩻 Все камеры подсвечены");
    if (d.type === "is-lag") { timeStop = true; toast("🐢 Охрана зависла"); }
    if (d.type === "is-archive" || d.type === "is-owl" || d.type === "killAll") { guards = []; cameras = []; toast("🦉 Камеры и охрана сняты"); }
    if (d.type === "god") invincible = true;
    if (d.type === "killAll") { guards = []; cameras = []; toast("💥 Камеры и охрана отключены"); }
    if (d.type === "timestop") timeStop = !!d.on;
    if (d.type === "invincible") invincible = !!d.on;
    if (d.type === "coinMult") { cloak = 100; toast("🪙 Плащ полностью заряжен"); }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
