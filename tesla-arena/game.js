(() => {
  "use strict";
  const SAVE = "amal-tesla-arena-v1";
  const app = document.getElementById("app");
  app.innerHTML =
    '<canvas id="c"></canvas>' +
    '<div class="hud"><span class="chip" id="wave">Волна 1</span><span class="chip" id="score">💰 0</span>' +
    '<span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="gen-wrap"><div class="lbl">🔋 Генератор</div><div class="bar"><i id="genBar"></i></div></div>' +
    '<div class="abils">' +
    '<button type="button" class="q ready" data-ab="q">Q 🛡<small>Скин-эффект</small><span class="cd" id="cd-q"></span></button>' +
    '<button type="button" class="e ready" data-ab="e">E 🌀<small>Спиннер</small><span class="cd" id="cd-e"></span></button>' +
    '<button type="button" class="r ready" data-ab="r">R 🧭<small>Компас</small><span class="cd" id="cd-r"></span></button>' +
    '<button type="button" class="f ready" data-ab="f">F 🎵<small>Шок</small><span class="cd" id="cd-f"></span></button>' +
    '<button type="button" class="space ready" data-ab="space">⎵ ⚡<small>Перегруз</small><span class="cd" id="cd-space"></span></button>' +
    '</div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>⚡ Тесла-Арена: Битва за Энергию</h1>' +
    '<p>Чёрные роботы-вирусы хотят украсть всё электричество! Ты — Админ Амаль на летающей катушке «Сокол». Катушка сама бьёт молнией. Защити генератор в центре.</p>' +
    '<div class="keys"><b>Мышь / WASD</b> — лететь<br><b>Q</b> — щит (бессмертие 5с)<br><b>E</b> — плазменный спиннер<br><b>R</b> — неон-компас (батареи сквозь стены)<br><b>F</b> — музыкальный шок (заморозка 7с)<br><b>Пробел</b> — перегруз 100 000 В (−50% боссу)</div><br>' +
    '<button type="button" class="btn" id="btnStart">В БОЙ</button></div></div>' +
    '<div class="overlay hidden" id="end"><div class="panel"><h1 id="endTitle"></h1><p id="endText"></p>' +
    '<button type="button" class="btn" id="btnAgain">Ещё раз</button></div></div>' +
    '<div class="toast" id="toast"></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  let muted = false, state = "menu", best = 0;
  let W = 0, H = 0, cx = 0, cy = 0;
  let coil, gen, enemies, batteries, bolts, particles, wave, score, spawnQ, spawnT;
  let shieldT, freezeT, compassT, spinnerT;
  let timeStop = false, invincibleAdmin = false;
  const keys = {};
  const mouse = { x: 0, y: 0, active: false };
  const CD = { q: 12, e: 9, r: 14, f: 16, space: 20 };
  const cd = { q: 0, e: 0, r: 0, f: 0, space: 0 };

  try { best = parseInt(localStorage.getItem(SAVE), 10) || 0; } catch (_) {}
  el("best").textContent = "Рекорд: " + best;

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    cx = W / 2; cy = H / 2;
  }
  addEventListener("resize", resize); resize();

  function toast(m) {
    const n = el("toast"); n.textContent = m; n.classList.add("show");
    clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("show"), 1800);
  }
  function beep(f, d, type) {
    if (muted) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || "sine";
      o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(a.destination); o.start();
      setTimeout(() => { o.stop(); a.close(); }, d || 70);
    } catch (_) {}
  }

  function start() {
    state = "play";
    coil = { x: cx - 140, y: cy, r: 20 };
    gen = { hp: 100, max: 100 };
    enemies = []; batteries = []; bolts = []; particles = [];
    wave = 0; score = 0;
    shieldT = 0; freezeT = 0; compassT = 0; spinnerT = 0;
    cd.q = cd.e = cd.r = cd.f = cd.space = 0;
    mouse.x = coil.x; mouse.y = coil.y; mouse.active = false;
    el("menu").classList.add("hidden");
    el("end").classList.add("hidden");
    nextWave();
  }

  function nextWave() {
    wave++;
    const n = 5 + wave * 2;
    spawnQ = [];
    for (let i = 0; i < n; i++) {
      const boss = wave % 4 === 0 && i === n - 1;
      spawnQ.push(boss ? "boss" : (Math.random() < 0.3 ? "fast" : "robot"));
    }
    spawnT = 0.5;
    // hidden batteries revealed by compass
    if (batteries.length < 3) {
      for (let i = 0; i < 2; i++) {
        batteries.push({
          x: 60 + Math.random() * (W - 120),
          y: 90 + Math.random() * (H - 200),
          got: false,
        });
      }
    }
    el("wave").textContent = "Волна " + wave;
    toast(wave % 4 === 0 ? "⚠️ Робот-босс!" : "Волна " + wave);
  }

  function spawnEnemy(kind) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = -30; }
    else if (edge === 1) { x = W + 30; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H + 30; }
    else { x = -30; y = Math.random() * H; }
    const conf = {
      robot: { hp: 20 + wave * 6, spd: 42 + wave * 2, r: 15, icon: "🤖", dmg: 8 },
      fast: { hp: 12 + wave * 4, spd: 78 + wave * 3, r: 12, icon: "👾", dmg: 6 },
      boss: { hp: 260 + wave * 30, spd: 26, r: 34, icon: "🦾", dmg: 25 },
    }[kind];
    enemies.push({ kind, x, y, hp: conf.hp, max: conf.hp, spd: conf.spd, r: conf.r, icon: conf.icon, dmg: conf.dmg, froze: 0 });
  }

  function addParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, color });
    }
  }

  function hurtEnemy(e, dmg, color) {
    e.hp -= dmg;
    if (e.hp <= 0) {
      enemies = enemies.filter((x) => x !== e);
      score += e.kind === "boss" ? 500 : e.kind === "fast" ? 30 : 20;
      addParticles(e.x, e.y, color || "#a78bfa", e.kind === "boss" ? 30 : 12);
      beep(e.kind === "boss" ? 200 : 660, 80, "sawtooth");
      if (!enemies.length && !spawnQ.length) { score += 50; setTimeout(nextWave, 900); }
    }
  }

  function autoZap(dt) {
    coil._zapT = (coil._zapT || 0) - dt;
    if (coil._zapT > 0) return;
    let target = null, bd = 190 * 190;
    for (const e of enemies) {
      const d = (e.x - coil.x) ** 2 + (e.y - coil.y) ** 2;
      if (d < bd) { bd = d; target = e; }
    }
    if (target) {
      coil._zapT = 0.22;
      bolts.push({ x1: coil.x, y1: coil.y, x2: target.x, y2: target.y, life: 0.14 });
      hurtEnemy(target, 10 + wave, "#c4b5fd");
      beep(880, 30, "square");
    }
  }

  function fire(ab) {
    if (state !== "play" || cd[ab] > 0) return;
    cd[ab] = CD[ab];
    if (ab === "q") { shieldT = 5; toast("🛡 Скин-эффект: бессмертие 5с"); beep(500, 120); }
    if (ab === "e") {
      spinnerT = 1.2;
      enemies.slice().forEach((e) => {
        if ((e.x - coil.x) ** 2 + (e.y - coil.y) ** 2 < 170 * 170) hurtEnemy(e, 40, "#f472b6");
      });
      addParticles(coil.x, coil.y, "#f472b6", 24);
      toast("🌀 Ионный спиннер!"); beep(300, 200, "sawtooth");
    }
    if (ab === "r") { compassT = 3; toast("🧭 Квантовый компас: видно батареи"); beep(700, 120, "triangle"); }
    if (ab === "f") {
      freezeT = 7;
      enemies.forEach((e) => { e.froze = 7; });
      toast("🎵 Музыкальный шок! Роботы застыли 7с"); beep(140, 400, "square");
    }
    if (ab === "space") {
      const boss = enemies.find((e) => e.kind === "boss");
      bolts.push({ x1: cx, y1: -20, x2: cx, y2: H + 20, life: 0.4, big: true });
      enemies.slice().forEach((e) => {
        if (e.kind === "boss") hurtEnemy(e, e.max * 0.5, "#fde68a");
        else hurtEnemy(e, 999, "#fde68a");
      });
      addParticles(cx, cy, "#fde68a", 40);
      toast(boss ? "⚡ ПЕРЕГРУЗ! Боссу −50%" : "⚡ ПЕРЕГРУЗ 100 000 В!");
      beep(90, 500, "sawtooth");
    }
    paintCd();
  }

  function paintCd() {
    ["q", "e", "r", "f", "space"].forEach((ab) => {
      const bar = el("cd-" + ab);
      const pct = Math.max(0, cd[ab] / CD[ab]) * 100;
      bar.style.height = pct + "%";
      const btn = document.querySelector('.abils button[data-ab="' + ab + '"]');
      if (btn) btn.classList.toggle("ready", cd[ab] <= 0);
    });
  }

  function gameOver() {
    state = "end";
    if (score > best) { best = score; try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
    el("best").textContent = "Рекорд: " + best;
    el("endTitle").textContent = "🔌 Генератор захвачен";
    el("endText").textContent = "Ты дошёл до волны " + wave + " · счёт " + score;
    el("end").classList.remove("hidden");
    beep(120, 300, "sawtooth");
  }

  function update(dt) {
    if (state !== "play") return;
    if (timeStop) dt *= 0.1;
    // cooldowns / timers
    ["q", "e", "r", "f", "space"].forEach((ab) => { if (cd[ab] > 0) cd[ab] = Math.max(0, cd[ab] - dt); });
    shieldT = Math.max(0, shieldT - dt);
    freezeT = Math.max(0, freezeT - dt);
    compassT = Math.max(0, compassT - dt);
    spinnerT = Math.max(0, spinnerT - dt);
    paintCd();

    // move coil toward mouse or by keys
    let tx = coil.x, ty = coil.y;
    if (mouse.active) { tx = mouse.x; ty = mouse.y; }
    let kx = 0, ky = 0;
    if (keys.KeyW || keys.ArrowUp) ky -= 1;
    if (keys.KeyS || keys.ArrowDown) ky += 1;
    if (keys.KeyA || keys.ArrowLeft) kx -= 1;
    if (keys.KeyD || keys.ArrowRight) kx += 1;
    if (kx || ky) { tx = coil.x + kx * 300; ty = coil.y + ky * 300; mouse.active = false; }
    coil.x += (tx - coil.x) * Math.min(1, dt * 8);
    coil.y += (ty - coil.y) * Math.min(1, dt * 8);
    coil.x = Math.max(20, Math.min(W - 20, coil.x));
    coil.y = Math.max(60, Math.min(H - 80, coil.y));

    // spawns
    spawnT -= dt;
    if (spawnT <= 0 && spawnQ.length) {
      spawnEnemy(spawnQ.shift());
      spawnT = Math.max(0.3, 1 - wave * 0.04);
    }

    // enemies move to generator
    for (const e of enemies.slice()) {
      if (e.froze > 0) { e.froze -= dt; continue; }
      const dx = cx - e.x, dy = cy - e.y;
      const L = Math.hypot(dx, dy) || 1;
      e.x += (dx / L) * e.spd * dt;
      e.y += (dy / L) * e.spd * dt;
      if (L < 46 + e.r) {
        if (!invincibleAdmin) gen.hp -= e.dmg;
        enemies = enemies.filter((x) => x !== e);
        addParticles(e.x, e.y, "#ef4444", 10);
        beep(180, 100, "square");
        if (gen.hp <= 0) { gen.hp = 0; gameOver(); return; }
        if (!enemies.length && !spawnQ.length) setTimeout(nextWave, 700);
      }
    }

    // spinner blades damage while active
    if (spinnerT > 0) {
      enemies.slice().forEach((e) => {
        if ((e.x - coil.x) ** 2 + (e.y - coil.y) ** 2 < 150 * 150) hurtEnemy(e, 60 * dt, "#f472b6");
      });
    }

    // shield reflects: enemies near coil get pushed
    if (shieldT > 0) {
      enemies.forEach((e) => {
        const dx = e.x - coil.x, dy = e.y - coil.y, d = Math.hypot(dx, dy);
        if (d < 60) { e.x += (dx / (d || 1)) * 6; e.y += (dy / (d || 1)) * 6; }
      });
    }

    // battery pickup
    for (const b of batteries) {
      if (b.got) continue;
      if (Math.hypot(b.x - coil.x, b.y - coil.y) < 30) {
        b.got = true; score += 40; gen.hp = Math.min(gen.max, gen.hp + 8);
        toast("🔋 Батарея! +40 · генератор подлатан");
        beep(760, 90, "triangle");
      }
    }
    batteries = batteries.filter((b) => !b.got);

    autoZap(dt);

    bolts = bolts.filter((b) => { b.life -= dt; return b.life > 0; });
    particles = particles.filter((p) => {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
      return p.life > 0;
    });

    el("score").textContent = "💰 " + score;
    el("genBar").style.width = (gen.hp / gen.max * 100) + "%";
    if (score > best) { best = score; el("best").textContent = "Рекорд: " + best; try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (compassT > 0) {
      ctx.fillStyle = "rgba(16,185,129,.10)";
      ctx.fillRect(0, 0, W, H);
    }
    // generator
    ctx.save();
    ctx.translate(cx, cy);
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.05;
    ctx.beginPath(); ctx.arc(0, 0, 42 * pulse, 0, Math.PI * 2);
    const gg = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
    gg.addColorStop(0, "#22d3ee"); gg.addColorStop(1, "rgba(124,58,237,.2)");
    ctx.fillStyle = gg; ctx.fill();
    ctx.font = "34px system-ui"; ctx.fillText("🔋", -18, 12);
    ctx.restore();

    // batteries (visible only with compass)
    for (const b of batteries) {
      if (compassT > 0) {
        ctx.globalAlpha = 1; ctx.font = "22px system-ui";
        ctx.fillText("🔋", b.x - 11, b.y + 8);
        ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, 18, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.globalAlpha = 0.12; ctx.font = "18px system-ui";
        ctx.fillText("❔", b.x - 8, b.y + 6);
      }
    }
    ctx.globalAlpha = 1;

    // enemies
    for (const e of enemies) {
      ctx.font = e.r * 1.7 + "px system-ui";
      ctx.globalAlpha = e.froze > 0 ? 0.6 : 1;
      ctx.fillText(e.icon, e.x - e.r, e.y + e.r * 0.4);
      ctx.globalAlpha = 1;
      if (e.froze > 0) { ctx.font = "14px system-ui"; ctx.fillText("❄️", e.x + e.r - 4, e.y - e.r); }
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2 * (e.hp / e.max), 3);
      ctx.fillStyle = "#fff";
    }

    // bolts
    for (const b of bolts) {
      ctx.strokeStyle = b.big ? "#fde68a" : "#a78bfa";
      ctx.lineWidth = b.big ? 8 : 3;
      ctx.shadowColor = b.big ? "#fbbf24" : "#c4b5fd"; ctx.shadowBlur = 16;
      ctx.beginPath();
      // jagged line
      const seg = b.big ? 10 : 4;
      ctx.moveTo(b.x1, b.y1);
      for (let i = 1; i < seg; i++) {
        const k = i / seg;
        const jx = (Math.random() - 0.5) * (b.big ? 40 : 16);
        const jy = (Math.random() - 0.5) * (b.big ? 40 : 16);
        ctx.lineTo(b.x1 + (b.x2 - b.x1) * k + jx, b.y1 + (b.y2 - b.y1) * k + jy);
      }
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // coil (player)
    if (coil) {
      if (spinnerT > 0) {
        ctx.save(); ctx.translate(coil.x, coil.y);
        const rot = performance.now() / 40;
        ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
          const a = rot + i * Math.PI / 2;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); ctx.stroke();
        }
        ctx.restore();
      }
      if (shieldT > 0) {
        ctx.strokeStyle = "rgba(167,139,250," + (0.5 + Math.sin(performance.now() / 80) * 0.4) + ")";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(coil.x, coil.y, 40, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.font = "34px system-ui";
      ctx.fillText("🦅", coil.x - 17, coil.y + 12);
      ctx.font = "16px system-ui";
      ctx.fillText("⚡", coil.x - 8, coil.y - 20);
    }
  }

  // input
  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyQ") fire("q");
    if (e.code === "KeyE") fire("e");
    if (e.code === "KeyR") fire("r");
    if (e.code === "KeyF") fire("f");
    if (e.code === "Space") { e.preventDefault(); fire("space"); }
  });
  addEventListener("keyup", (e) => { keys[e.code] = false; });
  canvas.addEventListener("pointerdown", (e) => { mouse.active = true; mouse.x = e.clientX; mouse.y = e.clientY; });
  canvas.addEventListener("pointermove", (e) => { if (mouse.active || e.pressure > 0 || e.buttons) { mouse.active = true; mouse.x = e.clientX; mouse.y = e.clientY; } });
  document.querySelectorAll(".abils button").forEach((b) => {
    b.addEventListener("click", () => fire(b.getAttribute("data-ab")));
  });
  el("btnStart").onclick = start;
  el("btnAgain").onclick = start;

  window.addEventListener("amal-power", (e) => {
    const d = (e && e.detail) || {};
    if (d.type === "killAll") { enemies.slice().forEach((en) => hurtEnemy(en, 9999, "#fde68a")); spawnQ = []; toast("💥 BZZZ! Экран очищен"); if (state === "play") setTimeout(nextWave, 500); }
    if (d.type === "timestop") timeStop = !!d.on;
    if (d.type === "invincible") invincibleAdmin = !!d.on;
    if (d.type === "coinMult") { score = Math.max(score, score * Math.min(Number(d.factor) || 1, 1000)); if (gen) gen.hp = gen.max; toast("🪙 Счёт умножен · генератор цел"); }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
