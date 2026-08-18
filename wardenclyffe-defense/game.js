(() => {
  "use strict";
  const SAVE = "amal-wardenclyffe-v1";
  const W = 960, H = 540;
  const app = document.getElementById("app");
  app.innerHTML =
    '<canvas id="c" width="960" height="540"></canvas>' +
    '<div class="hud"><span class="chip" id="wave">Волна 1/8</span><span class="chip" id="coins">⚡ 120</span><span class="chip" id="lives">❤️ 12</span><span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="bar-wrap"><div class="bar"><i id="baseHp"></i></div></div>' +
    '<div class="shop">' +
    '<button type="button" data-buy="coil">⚡ Катушка (40)</button>' +
    '<button type="button" data-buy="upgrade">⬆ Улучшить (55)</button>' +
    '<button type="button" id="btnMute">🔊</button>' +
    '<button type="button" id="btnPause">⏸</button></div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>⚡ Защита Базы Ворденклиф</h1>' +
    '<p>Строй катушки Теслы вдоль дороги. Кликай по слотам рядом с путём. Молнии бьют роботов и перекупщиков. Продержись 8 волн и победи босса!</p>' +
    '<button type="button" class="btn" id="btnStart">НАЧАТЬ</button></div></div>' +
    '<div class="overlay hidden" id="end"><div class="panel"><h1 id="endTitle">Победа!</h1><p id="endText"></p>' +
    '<button type="button" class="btn" id="btnAgain">Ещё раз</button></div></div>' +
    '<div class="toast" id="toast"></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  let muted = false, paused = false, state = "menu";
  let coins = 120, lives = 12, wave = 0, best = 0, placeMode = false;
  let enemies = [], towers = [], bolts = [], spawnQ = [], spawnT = 0, t = 0;
  let timeStop = false, invincible = false, coinMult = 1;

  try { best = parseInt(localStorage.getItem(SAVE), 10) || 0; } catch (_) {}
  el("best").textContent = "Рекорд: " + best;

  const PATH = [
    [40, 270], [180, 270], [180, 120], [420, 120], [420, 400],
    [680, 400], [680, 200], [900, 200],
  ];
  const SLOTS = [
    [120, 200], [120, 340], [260, 180], [260, 60], [340, 200],
    [500, 180], [500, 340], [580, 460], [760, 340], [760, 140], [840, 280],
  ];

  function toast(msg) {
    const n = el("toast");
    n.textContent = msg;
    n.classList.add("show");
    clearTimeout(n._t);
    n._t = setTimeout(() => n.classList.remove("show"), 1800);
  }
  function beep(f, d) {
    if (muted) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = f; g.gain.value = 0.05;
      o.connect(g); g.connect(a.destination); o.start();
      setTimeout(() => { o.stop(); a.close(); }, d || 80);
    } catch (_) {}
  }
  function dist(a, b) {
    const dx = a[0] - b[0], dy = a[1] - b[1];
    return Math.hypot(dx, dy);
  }
  function pathPos(p) {
    let rem = p;
    for (let i = 0; i < PATH.length - 1; i++) {
      const a = PATH[i], b = PATH[i + 1];
      const len = dist(a, b);
      if (rem <= len) {
        const k = rem / len;
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      }
      rem -= len;
    }
    return PATH[PATH.length - 1].slice();
  }
  function pathLen() {
    let s = 0;
    for (let i = 0; i < PATH.length - 1; i++) s += dist(PATH[i], PATH[i + 1]);
    return s;
  }
  const PLEN = pathLen();

  function fit() {
    const r = Math.min(innerWidth / W, innerHeight / H);
    canvas.style.width = W * r + "px";
    canvas.style.height = H * r + "px";
    canvas.style.margin = "auto";
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
  }
  addEventListener("resize", fit); fit();

  function start() {
    coins = 120; lives = 12; wave = 0;
    enemies = []; towers = []; bolts = []; spawnQ = [];
    placeMode = false; state = "play"; timeStop = false;
    el("menu").classList.add("hidden");
    el("end").classList.add("hidden");
    nextWave();
    toast("Волна 1 · строй катушки!");
  }

  function nextWave() {
    wave++;
    if (wave > 8) { win(); return; }
    const n = 6 + wave * 2;
    spawnQ = [];
    for (let i = 0; i < n; i++) {
      const kind = wave >= 8 && i === n - 1 ? "boss" :
        (Math.random() < 0.25 ? "reseller" : "robot");
      spawnQ.push(kind);
    }
    spawnT = 0.6;
    el("wave").textContent = "Волна " + wave + "/8";
    toast(wave === 8 ? "⚠️ Босс волны!" : "Волна " + wave);
  }

  function spawn(kind) {
    const stats = {
      robot: { hp: 28 + wave * 8, spd: 55 + wave * 3, reward: "🤖", r: 14 },
      reseller: { hp: 18 + wave * 5, spd: 80 + wave * 4, icon: "🛒", r: 12 },
      boss: { hp: 420, spd: 38, icon: "👾", r: 28 },
    }[kind];
    enemies.push({
      kind, hp: stats.hp, max: stats.hp, spd: stats.spd,
      icon: stats.icon, r: stats.r, p: 0, slow: 1,
    });
  }

  function kill(e) {
    enemies = enemies.filter((x) => x !== e);
    const gain = Math.round((e.kind === "boss" ? 80 : e.kind === "reseller" ? 12 : 8) * coinMult);
    coins += gain;
    beep(660, 60);
    if (!enemies.length && !spawnQ.length) {
      coins += 25;
      setTimeout(nextWave, 900);
    }
  }

  function fireTower(tw, now) {
    if (now - tw.last < tw.cd) return;
    let bestE = null, bestD = 1e9;
    for (const e of enemies) {
      const pos = pathPos(e.p);
      const d = dist([tw.x, tw.y], pos);
      if (d < tw.range && d < bestD) { bestD = d; bestE = e; }
    }
    if (!bestE) return;
    tw.last = now;
    const pos = pathPos(bestE.p);
    bolts.push({ x1: tw.x, y1: tw.y, x2: pos[0], y2: pos[1], life: 0.18, chain: tw.lvl });
    bestE.hp -= tw.dmg;
    if (tw.lvl >= 2) bestE.slow = 0.55;
    beep(920, 40);
    if (bestE.hp <= 0) kill(bestE);
    // chain
    if (tw.lvl >= 3) {
      let chained = 0;
      for (const e of enemies) {
        if (e === bestE || chained >= 2) continue;
        const p2 = pathPos(e.p);
        if (dist(pos, p2) < 110) {
          e.hp -= tw.dmg * 0.55;
          bolts.push({ x1: pos[0], y1: pos[1], x2: p2[0], y2: p2[1], life: 0.14, chain: 1 });
          chained++;
          if (e.hp <= 0) kill(e);
        }
      }
    }
  }

  function update(dt) {
    if (state !== "play" || paused) return;
    if (timeStop) dt *= 0.08;
    t += dt;
    spawnT -= dt;
    if (spawnT <= 0 && spawnQ.length) {
      spawn(spawnQ.shift());
      spawnT = Math.max(0.35, 1.1 - wave * 0.06);
    }
    for (const e of enemies.slice()) {
      e.p += e.spd * (e.slow || 1) * dt;
      e.slow = Math.min(1, (e.slow || 1) + dt * 0.4);
      if (e.p >= PLEN) {
        enemies = enemies.filter((x) => x !== e);
        if (!invincible) lives -= e.kind === "boss" ? 5 : 1;
        beep(180, 120);
        if (lives <= 0) lose();
        else if (!enemies.length && !spawnQ.length) setTimeout(nextWave, 700);
      }
    }
    const now = performance.now() / 1000;
    for (const tw of towers) fireTower(tw, now);
    bolts = bolts.filter((b) => { b.life -= dt; return b.life > 0; });
    el("coins").textContent = "⚡ " + coins;
    el("lives").textContent = "❤️ " + lives;
    el("baseHp").style.width = Math.max(0, (lives / 12) * 100) + "%";
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // ground
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1e3a5f"); g.addColorStop(1, "#0b1220");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // path
    ctx.strokeStyle = "#64748b"; ctx.lineWidth = 36; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    PATH.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke();
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 22;
    ctx.beginPath();
    PATH.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke();
    // base
    ctx.font = "28px system-ui";
    ctx.fillText("🏛️", 880, 210);
    // slots
    for (let i = 0; i < SLOTS.length; i++) {
      const s = SLOTS[i];
      const used = towers.find((tw) => tw.slot === i);
      ctx.beginPath();
      ctx.arc(s[0], s[1], 16, 0, Math.PI * 2);
      ctx.fillStyle = used ? "rgba(56,189,248,.25)" : (placeMode ? "rgba(253,230,138,.35)" : "rgba(148,163,184,.18)");
      ctx.fill();
      ctx.strokeStyle = placeMode && !used ? "#fde68a" : "#475569";
      ctx.lineWidth = 2; ctx.stroke();
    }
    // towers
    for (const tw of towers) {
      ctx.beginPath();
      ctx.arc(tw.x, tw.y, tw.range, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56,189,248,.12)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = (18 + tw.lvl * 2) + "px system-ui";
      ctx.fillText("⚡", tw.x - 10, tw.y + 6);
      ctx.fillStyle = "#7dd3fc"; ctx.font = "10px system-ui";
      ctx.fillText("L" + tw.lvl, tw.x - 8, tw.y + 22);
      ctx.fillStyle = "#fff";
    }
    // enemies
    for (const e of enemies) {
      const pos = pathPos(e.p);
      ctx.font = e.r * 1.6 + "px system-ui";
      ctx.fillText(e.icon, pos[0] - e.r, pos[1] + e.r * 0.4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(pos[0] - 14, pos[1] - e.r - 10, 28 * (e.hp / e.max), 4);
      ctx.fillStyle = "#fff";
    }
    // bolts
    for (const b of bolts) {
      ctx.strokeStyle = b.chain > 1 ? "#e0f2fe" : "#38bdf8";
      ctx.lineWidth = 2 + b.chain;
      ctx.shadowColor = "#7dd3fc"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (timeStop) {
      ctx.fillStyle = "rgba(56,189,248,.12)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function win() {
    state = "end";
    if (wave > best) { best = wave; try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
    el("best").textContent = "Рекорд: " + best;
    el("endTitle").textContent = "🏆 Лаборатория спасена!";
    el("endText").textContent = "Все 8 волн отбиты. Монеты: " + coins;
    el("end").classList.remove("hidden");
    beep(880, 200);
  }
  function lose() {
    state = "end";
    if (wave > best) { best = wave; try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
    el("best").textContent = "Рекорд: " + best;
    el("endTitle").textContent = "💀 База захвачена";
    el("endText").textContent = "Дошли до волны " + wave + ". Попробуй ещё!";
    el("end").classList.remove("hidden");
  }

  function canvasPos(ev) {
    const r = canvas.getBoundingClientRect();
    const x = ((ev.clientX || (ev.touches && ev.touches[0].clientX)) - r.left) * (W / r.width);
    const y = ((ev.clientY || (ev.touches && ev.touches[0].clientY)) - r.top) * (H / r.height);
    return [x, y];
  }
  function onTap(ev) {
    if (state !== "play") return;
    const [x, y] = canvasPos(ev);
    if (!placeMode) return;
    let nearest = -1, nd = 28;
    for (let i = 0; i < SLOTS.length; i++) {
      if (towers.some((tw) => tw.slot === i)) continue;
      const d = dist([x, y], SLOTS[i]);
      if (d < nd) { nd = d; nearest = i; }
    }
    if (nearest < 0) return;
    if (coins < 40) { toast("Мало энергии"); return; }
    coins -= 40;
    const s = SLOTS[nearest];
    towers.push({ slot: nearest, x: s[0], y: s[1], lvl: 1, dmg: 14, range: 130, cd: 0.7, last: 0 });
    placeMode = false;
    toast("Катушка установлена!");
    beep(520, 80);
  }
  canvas.addEventListener("pointerdown", onTap);

  document.querySelector('[data-buy="coil"]').onclick = () => {
    if (state !== "play") return;
    placeMode = !placeMode;
    toast(placeMode ? "Выбери слот у дороги" : "Отмена");
  };
  document.querySelector('[data-buy="upgrade"]').onclick = () => {
    if (state !== "play") return;
    if (coins < 55) { toast("Мало энергии"); return; }
    const tw = towers.filter((t) => t.lvl < 3).sort((a, b) => a.lvl - b.lvl)[0];
    if (!tw) { toast("Нечего улучшать"); return; }
    coins -= 55;
    tw.lvl++; tw.dmg += 10; tw.range += 18; tw.cd = Math.max(0.35, tw.cd - 0.1);
    toast("Катушка L" + tw.lvl + "!");
    beep(700, 70);
  };
  el("btnMute").onclick = () => { muted = !muted; el("btnMute").textContent = muted ? "🔇" : "🔊"; };
  el("btnPause").onclick = () => { if (state === "play") { paused = !paused; toast(paused ? "Пауза" : "Продолжаем"); } };
  el("btnStart").onclick = start;
  el("btnAgain").onclick = start;

  window.addEventListener("amal-power", (e) => {
    const d = (e && e.detail) || {};
    if (d.type === "wd-tesla" || d.type === "wd-hammer" || d.type === "wd-archive") {
      enemies.forEach((en) => { coins += 10; }); enemies = []; spawnQ = []; toast("⚡ Ворденклиф зачищен"); if (state === "play") setTimeout(nextWave, 500);
    }
    if (d.type === "wd-lag") { timeStop = true; toast("🐢 Роботы заморожены"); }
    if (d.type === "wd-spawn") { coins += 500; toast("✨ Запас катушек"); }
    if (d.type === "god") invincible = true;
    if (d.type === "killAll") { enemies.forEach((en) => { coins += 10; }); enemies = []; spawnQ = []; toast("💥 BZZZ! Враги уничтожены"); if (state === "play") setTimeout(nextWave, 500); }
    if (d.type === "timestop") timeStop = !!d.on;
    if (d.type === "invincible") invincible = !!d.on;
    if (d.type === "coinMult") { coinMult = Number(d.factor) || 1; coins = Math.max(coins * Math.min(coinMult, 1000), coins); toast("🪙 Энергия умножена"); }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
