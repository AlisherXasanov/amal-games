(() => {
  "use strict";
  const SAVE = "amal-forest-network-v1";
  const app = document.getElementById("app");
  app.innerHTML =
    '<canvas id="c"></canvas>' +
    '<div class="hud"><span class="chip" id="lvl">Уровень 1/5</span><span class="chip" id="signal">📶 Сигнал 0%</span>' +
    '<span class="chip" id="sap">💧 Сок: 30</span><span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="hint" id="hint">Кликни дерево → кликни соседа, чтобы протянуть корень</div>' +
    '<div class="shop">' +
    '<button type="button" id="btnWater">💧 Полить (8)</button>' +
    '<button type="button" id="btnAlarm">🚨 Тревога (12)</button>' +
    '<button type="button" id="btnMute">🔊</button>' +
    '<button type="button" id="btnReset">↺ Сброс</button></div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>🌲 Лесной Интернет</h1>' +
    '<p>Ты — админ леса. Соединяй деревья корнями-мицелием, передай сигнал тревоги от главного дерева ко всем, поливай и отбивай жуков.</p>' +
    '<button type="button" class="btn" id="btnStart">НАЧАТЬ</button></div></div>' +
    '<div class="overlay hidden" id="end"><div class="panel"><h1 id="endTitle"></h1><p id="endText"></p>' +
    '<button type="button" class="btn" id="btnAgain">Дальше</button></div></div>' +
    '<div class="toast" id="toast"></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  let muted = false, state = "menu", level = 1, best = 0;
  let trees = [], edges = [], bugs = [], sap = 30, selected = -1;
  let timeStop = false, invincible = false, coinMult = 1;

  try { best = parseInt(localStorage.getItem(SAVE), 10) || 0; } catch (_) {}
  el("best").textContent = "Рекорд: " + best;

  function toast(m) {
    const n = el("toast"); n.textContent = m; n.classList.add("show");
    clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("show"), 1500);
  }
  function beep(f, d) {
    if (muted) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(a.destination); o.start();
      setTimeout(() => { o.stop(); a.close(); }, d || 60);
    } catch (_) {}
  }
  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener("resize", resize); resize();

  function layout(n) {
    const layouts = [
      [{ x: 0.2, y: 0.5, root: true }, { x: 0.45, y: 0.3 }, { x: 0.45, y: 0.7 }, { x: 0.75, y: 0.5 }],
      [{ x: 0.15, y: 0.5, root: true }, { x: 0.35, y: 0.25 }, { x: 0.35, y: 0.75 }, { x: 0.55, y: 0.5 }, { x: 0.8, y: 0.3 }, { x: 0.8, y: 0.7 }],
      [{ x: 0.12, y: 0.5, root: true }, { x: 0.32, y: 0.2 }, { x: 0.32, y: 0.5 }, { x: 0.32, y: 0.8 }, { x: 0.55, y: 0.35 }, { x: 0.55, y: 0.65 }, { x: 0.8, y: 0.5 }],
      [{ x: 0.1, y: 0.5, root: true }, { x: 0.28, y: 0.2 }, { x: 0.28, y: 0.8 }, { x: 0.45, y: 0.35 }, { x: 0.45, y: 0.65 }, { x: 0.62, y: 0.2 }, { x: 0.62, y: 0.8 }, { x: 0.85, y: 0.5 }],
      [{ x: 0.1, y: 0.5, root: true }, { x: 0.25, y: 0.2 }, { x: 0.25, y: 0.5 }, { x: 0.25, y: 0.8 }, { x: 0.45, y: 0.3 }, { x: 0.45, y: 0.7 }, { x: 0.65, y: 0.15 }, { x: 0.65, y: 0.5 }, { x: 0.65, y: 0.85 }, { x: 0.88, y: 0.5 }],
    ];
    return layouts[Math.min(n - 1, layouts.length - 1)];
  }

  function build() {
    const L = layout(level);
    trees = L.map((t, i) => ({
      id: i, x: t.x, y: t.y, root: !!t.root,
      hp: 100, linked: !!t.root, alarm: !!t.root, poison: 0,
    }));
    edges = [];
    bugs = [];
    sap = 30 + level * 5;
    selected = -1;
    el("lvl").textContent = "Уровень " + level + "/5";
    // spawn bugs soon
    for (let i = 0; i < level; i++) {
      bugs.push({
        x: 0.92, y: 0.15 + i * (0.7 / Math.max(1, level)),
        target: trees.length - 1 - (i % 3),
        hp: 20 + level * 6, spd: 0.04 + level * 0.008,
      });
    }
  }

  function start() {
    state = "play";
    build();
    el("menu").classList.add("hidden");
    el("end").classList.add("hidden");
    toast("Соедини все деревья!");
  }

  function connected(a, b) {
    return edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  }

  function recompute() {
    // BFS from root
    trees.forEach((t) => { t.linked = false; t.alarm = false; });
    const root = trees.find((t) => t.root);
    if (!root) return;
    const q = [root.id];
    root.linked = true; root.alarm = true;
    while (q.length) {
      const id = q.shift();
      for (const e of edges) {
        const other = e.a === id ? e.b : e.b === id ? e.a : -1;
        if (other < 0) continue;
        if (!trees[other].linked) {
          trees[other].linked = true;
          trees[other].alarm = true;
          q.push(other);
        }
      }
    }
    const pct = Math.round(trees.filter((t) => t.linked).length / trees.length * 100);
    el("signal").textContent = "📶 Сигнал " + pct + "%";
    el("sap").textContent = "💧 Сок: " + sap;
    if (pct >= 100) {
      // полная сеть включает ядовитую защиту — жуки гибнут
      bugs.forEach((b) => { b.hp = 0; });
      winLevel();
    }
  }

  function winLevel() {
    if (state !== "play") return;
    state = "end";
    if (level > best) { best = level; try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
    el("best").textContent = "Рекорд: " + best;
    if (level >= 5) {
      el("endTitle").textContent = "🏆 Лес онлайн!";
      el("endText").textContent = "Сеть корней спасла весь лес.";
      el("btnAgain").textContent = "С начала";
      level = 1;
    } else {
      el("endTitle").textContent = "✅ Уровень пройден";
      el("endText").textContent = "Сигнал дошёл до всех деревьев!";
      el("btnAgain").textContent = "Дальше";
      level++;
    }
    el("end").classList.remove("hidden");
    beep(860, 160);
  }

  function lose() {
    state = "end";
    el("endTitle").textContent = "🪲 Лес пал";
    el("endText").textContent = "Жуки сгрызли слишком много деревьев.";
    el("btnAgain").textContent = "Заново";
    el("end").classList.remove("hidden");
    beep(150, 200);
  }

  function tryLink(a, b) {
    if (a === b || connected(a, b)) return;
    const cost = 6;
    if (sap < cost) { toast("Мало сока"); return; }
    const ta = trees[a], tb = trees[b];
    const d = Math.hypot(ta.x - tb.x, ta.y - tb.y);
    if (d > 0.42) { toast("Слишком далеко"); return; }
    sap -= cost;
    edges.push({ a, b });
    beep(520, 70);
    toast("Корень протянут");
    recompute();
  }

  function update(dt) {
    if (state !== "play") return;
    if (timeStop) dt *= 0.08;
    for (const b of bugs) {
      if (b.hp <= 0) continue;
      const t = trees[b.target];
      if (!t || t.hp <= 0) {
        b.target = trees.findIndex((x) => x.hp > 0);
        continue;
      }
      const dx = t.x - b.x, dy = t.y - b.y;
      const L = Math.hypot(dx, dy) || 1;
      if (L < 0.04) {
        if (t.poison > 0 || (t.alarm && Math.random() < 0.4)) {
          b.hp -= 30 * dt;
        } else if (!invincible) {
          t.hp -= 18 * dt;
          if (t.hp <= 0) {
            toast("Дерево сгрызено!");
            edges = edges.filter((e) => e.a !== t.id && e.b !== t.id);
            recompute();
            if (trees.filter((x) => x.hp > 0).length < 2) lose();
          }
        }
      } else {
        b.x += (dx / L) * b.spd * dt;
        b.y += (dy / L) * b.spd * dt;
      }
    }
    trees.forEach((t) => { t.poison = Math.max(0, t.poison - dt); });
    sap = Math.min(99, sap + dt * 0.8 * coinMult);
    el("sap").textContent = "💧 Сок: " + Math.floor(sap);
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = "#07140c"; ctx.fillRect(0, 0, w, h);
    // ground texture
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = "rgba(34,197,94," + (0.03 + (i % 5) * 0.01) + ")";
      ctx.beginPath();
      ctx.arc((i * 97) % w, (i * 53) % h, 40 + (i % 7) * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    // edges
    for (const e of edges) {
      const a = trees[e.a], b = trees[e.b];
      if (!a || !b || a.hp <= 0 || b.hp <= 0) continue;
      ctx.strokeStyle = a.alarm && b.alarm ? "#86efac" : "#4d7c0f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }
    // trees
    trees.forEach((t, i) => {
      if (t.hp <= 0) return;
      const x = t.x * w, y = t.y * h;
      if (selected === i) {
        ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.font = t.root ? "40px system-ui" : "32px system-ui";
      ctx.globalAlpha = 0.45 + 0.55 * (t.hp / 100);
      ctx.fillText(t.root ? "🌳" : (t.alarm ? "🌲" : "🌴"), x - 18, y + 10);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x - 18, y + 20, 36 * (t.hp / 100), 4);
      if (t.poison > 0) { ctx.font = "14px system-ui"; ctx.fillText("☠️", x + 12, y - 12); }
    });
    // bugs
    for (const b of bugs) {
      if (b.hp <= 0) continue;
      ctx.font = "22px system-ui";
      ctx.fillText("🪲", b.x * w - 10, b.y * h + 8);
    }
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (state !== "play") return;
    const r = canvas.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width;
    const y = (ev.clientY - r.top) / r.height;
    let hit = -1, bestD = 0.06;
    trees.forEach((t, i) => {
      if (t.hp <= 0) return;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < bestD) { bestD = d; hit = i; }
    });
    if (hit < 0) { selected = -1; return; }
    if (selected < 0) { selected = hit; toast("Выбрано дерево · кликни соседа"); return; }
    tryLink(selected, hit);
    selected = -1;
  });

  el("btnWater").onclick = () => {
    if (state !== "play" || selected < 0) { toast("Сначала выбери дерево"); return; }
    if (sap < 8) { toast("Мало сока"); return; }
    sap -= 8;
    trees[selected].hp = Math.min(100, trees[selected].hp + 35);
    toast("Полито!");
    beep(480, 50);
  };
  el("btnAlarm").onclick = () => {
    if (state !== "play" || selected < 0) { toast("Сначала выбери дерево"); return; }
    if (sap < 12) { toast("Мало сока"); return; }
    if (!trees[selected].linked) { toast("Нужен корень к сети"); return; }
    sap -= 12;
    trees[selected].poison = 6;
    toast("Ядовитая защита!");
    beep(700, 70);
  };
  el("btnMute").onclick = () => { muted = !muted; el("btnMute").textContent = muted ? "🔇" : "🔊"; };
  el("btnReset").onclick = () => { if (state === "play") { build(); recompute(); toast("Сеть сброшена"); } };
  el("btnStart").onclick = () => { level = 1; start(); recompute(); };
  el("btnAgain").onclick = () => { if (el("btnAgain").textContent === "Заново" || el("btnAgain").textContent === "С начала") { level = 1; } start(); recompute(); };

  window.addEventListener("amal-power", (e) => {
    const d = (e && e.detail) || {};
    if (d.type === "killAll") { bugs.forEach((b) => { b.hp = 0; }); toast("💥 Жуки уничтожены"); recompute(); }
    if (d.type === "timestop") timeStop = !!d.on;
    if (d.type === "invincible") invincible = !!d.on;
    if (d.type === "coinMult") { coinMult = Number(d.factor) || 1; sap = Math.max(sap, 999); toast("🪙 Сок ×миллион"); }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
