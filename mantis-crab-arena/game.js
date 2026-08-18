(() => {
  "use strict";
  const SAVE = "amal-mantis-arena-v1";
  const W = 960, H = 540;
  const app = document.getElementById("app");
  app.innerHTML =
    '<canvas id="c" width="960" height="540"></canvas>' +
    '<div class="hud"><span class="chip" id="round">Бой 1/4</span><span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="hp-bars"><div class="row"><span>Ты 🦐</span><span id="youHpT">100</span></div><div class="bar you"><i id="youHp"></i></div>' +
    '<div class="row"><span id="foeName">Враг</span><span id="foeHpT">100</span></div><div class="bar"><i id="foeHp"></i></div></div>' +
    '<div class="charge-meter"><i id="chargeFill"></i></div>' +
    '<div class="pad"><button type="button" data-d="-1">←</button><div class="row"><button type="button" data-d="0">·</button><button type="button" data-d="1">→</button></div></div>' +
    '<div class="actions"><button type="button" id="btnHit">👊 Удар</button><button type="button" class="charge" id="btnCharge">💥 Заряд</button><button type="button" class="block" id="btnBlock">🛡️ Блок</button></div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>🦐 Атака Рака-Богомола</h1>' +
    '<p>Заряжай пружинные клешни и бей соперников силой пули. A/D или стрелки — двигаться. J — удар, K — заряд (удерживай), L — блок.</p>' +
    '<button type="button" class="btn" id="btnStart">В АРЕНУ</button></div></div>' +
    '<div class="overlay hidden" id="end"><div class="panel"><h1 id="endTitle"></h1><p id="endText"></p>' +
    '<button type="button" class="btn" id="btnAgain">Дальше</button></div></div>' +
    '<div class="toast" id="toast"></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  let muted = false, state = "menu", round = 1, best = 0;
  let you, foe, charge = 0, charging = false, blockT = 0, hitFx = 0, keys = {};
  let timeStop = false, invincible = false;
  const FOES = [
    { name: "Краб-камень", icon: "🦀", hp: 90, atk: 8, spd: 90 },
    { name: "Осьминог", icon: "🐙", hp: 110, atk: 10, spd: 110 },
    { name: "Акула-боксёр", icon: "🦈", hp: 140, atk: 12, spd: 100 },
    { name: "Чемпион Бездны", icon: "🦞", hp: 200, atk: 15, spd: 120 },
  ];

  try { best = parseInt(localStorage.getItem(SAVE), 10) || 0; } catch (_) {}
  el("best").textContent = "Рекорд: " + best;

  function toast(m) {
    const n = el("toast"); n.textContent = m; n.classList.add("show");
    clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("show"), 1400);
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
  function fit() {
    const r = Math.min(innerWidth / W, innerHeight / H);
    canvas.style.width = W * r + "px"; canvas.style.height = H * r + "px";
    canvas.style.margin = "auto"; canvas.style.position = "absolute"; canvas.style.inset = "0";
  }
  addEventListener("resize", fit); fit();

  function makeFighter(side, conf) {
    return {
      x: side === "you" ? 280 : 680, y: 360, vx: 0,
      hp: conf.hp, max: conf.hp, atk: conf.atk, spd: conf.spd,
      icon: conf.icon || "🦐", name: conf.name || "Ты",
      cd: 0, stun: 0, facing: side === "you" ? 1 : -1,
    };
  }

  function startRound() {
    state = "play";
    const f = FOES[Math.min(round - 1, FOES.length - 1)];
    you = makeFighter("you", { name: "Рак-богомол", icon: "🦐", hp: 100 + (round - 1) * 10, atk: 12, spd: 140 });
    foe = makeFighter("foe", f);
    charge = 0; charging = false; blockT = 0; hitFx = 0;
    el("menu").classList.add("hidden");
    el("end").classList.add("hidden");
    el("round").textContent = "Бой " + round + "/4";
    el("foeName").textContent = f.name + " " + f.icon;
    toast(f.name + " выходит!");
  }

  function start() { round = 1; startRound(); }

  function damage(target, amt, blocked) {
    if (target === you && invincible) return;
    if (blocked) { amt *= 0.25; beep(300, 40); }
    target.hp = Math.max(0, target.hp - amt);
    target.stun = 0.15;
    hitFx = 0.2;
    if (target.hp <= 0) {
      if (target === foe) winRound();
      else lose();
    }
  }

  function winRound() {
    state = "end";
    if (round > best) { best = round; try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
    el("best").textContent = "Рекорд: " + best;
    if (round >= 4) {
      el("endTitle").textContent = "🏆 Чемпион арены!";
      el("endText").textContent = "Все соперники повержены клешнями-пулями!";
      el("btnAgain").textContent = "Снова";
      round = 1;
    } else {
      el("endTitle").textContent = "✅ Победа!";
      el("endText").textContent = "Следующий бой: " + FOES[round].name;
      el("btnAgain").textContent = "Дальше";
      round++;
    }
    el("end").classList.remove("hidden");
    beep(880, 160);
  }
  function lose() {
    state = "end";
    el("endTitle").textContent = "💀 Поражение";
    el("endText").textContent = "Клешни не успели. Попробуй заряжать удар!";
    el("btnAgain").textContent = "Заново";
    round = 1;
    el("end").classList.remove("hidden");
    beep(140, 200);
  }

  function doHit(power) {
    if (state !== "play" || you.cd > 0 || you.stun > 0) return;
    you.cd = 0.35;
    const reach = 70 + power * 20;
    if (Math.abs(you.x - foe.x) < reach && Math.abs(you.y - foe.y) < 50) {
      const dmg = you.atk * (0.8 + power * 2.2);
      damage(foe, dmg, false);
      foe.x += you.facing * (12 + power * 30);
      foe.vx = you.facing * (80 + power * 200);
      toast(power > 0.7 ? "💥 ПУЛЕВОЙ УДАР!" : "👊 Хит!");
      beep(200 + power * 600, 50 + power * 80);
    } else toast("Мимо");
  }

  function update(dt) {
    if (state !== "play") return;
    if (timeStop) dt *= 0.08;
    let mx = 0;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (you.stun <= 0) {
      you.vx = mx * you.spd;
      if (mx) you.facing = mx > 0 ? 1 : -1;
    }
    you.x += you.vx * dt;
    foe.x += foe.vx * dt;
    foe.vx *= 0.9;
    you.x = Math.max(60, Math.min(W - 60, you.x));
    foe.x = Math.max(60, Math.min(W - 60, foe.x));
    you.cd = Math.max(0, you.cd - dt);
    you.stun = Math.max(0, you.stun - dt);
    foe.cd = Math.max(0, foe.cd - dt);
    foe.stun = Math.max(0, foe.stun - dt);
    blockT = Math.max(0, blockT - dt);
    hitFx = Math.max(0, hitFx - dt);

    if (charging) {
      charge = Math.min(1, charge + dt * 0.85);
      el("chargeFill").style.height = (charge * 100) + "%";
    }

    // AI
    if (foe.stun <= 0) {
      const dx = you.x - foe.x;
      if (Math.abs(dx) > 65) foe.x += Math.sign(dx) * foe.spd * 0.55 * dt;
      foe.facing = dx > 0 ? 1 : -1;
      foe.cd -= 0; // already
      if (Math.abs(dx) < 70 && foe.cd <= 0) {
        foe.cd = 0.9 + Math.random() * 0.4;
        const blocked = blockT > 0;
        damage(you, foe.atk, blocked);
        you.vx = -you.facing * 100;
        beep(180, 50);
      }
    }

    el("youHp").style.width = (you.hp / you.max * 100) + "%";
    el("foeHp").style.width = (foe.hp / foe.max * 100) + "%";
    el("youHpT").textContent = Math.ceil(you.hp);
    el("foeHpT").textContent = Math.ceil(foe.hp);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#3b0a1a"); g.addColorStop(1, "#12060c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // arena
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(40, 380, W - 80, 80);
    ctx.strokeStyle = "#fb7185"; ctx.lineWidth = 3;
    ctx.strokeRect(40, 380, W - 80, 80);
    ctx.fillStyle = "rgba(251,113,133,.15)";
    ctx.fillRect(W / 2 - 40, 380, 80, 80);
    if (hitFx > 0) {
      ctx.fillStyle = "rgba(255,255,255," + hitFx + ")";
      ctx.fillRect(0, 0, W, H);
    }
    function drawF(f, flip) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(flip || f.facing, 1);
      ctx.font = "48px system-ui";
      ctx.fillText(f.icon, -24, 0);
      ctx.restore();
    }
    if (you) drawF(you, you.facing);
    if (foe) drawF(foe, foe.facing);
    if (blockT > 0 && you) {
      ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(you.x, you.y - 10, 36, 0, Math.PI * 2); ctx.stroke();
    }
    if (charging && you) {
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(you.x, you.y - 10, 30 + charge * 20, 0, Math.PI * 2); ctx.stroke();
    }
  }

  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyJ") doHit(0.15);
    if (e.code === "KeyK") { charging = true; }
    if (e.code === "KeyL") { blockT = 0.45; }
  });
  addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "KeyK" && charging) {
      charging = false;
      const p = charge; charge = 0; el("chargeFill").style.height = "0%";
      doHit(p);
    }
  });
  document.querySelectorAll(".pad button").forEach((b) => {
    const d = Number(b.getAttribute("data-d"));
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      keys.ArrowLeft = keys.ArrowRight = false;
      if (d < 0) keys.ArrowLeft = true;
      if (d > 0) keys.ArrowRight = true;
    });
    b.addEventListener("pointerup", () => { keys.ArrowLeft = keys.ArrowRight = false; });
    b.addEventListener("pointerleave", () => { keys.ArrowLeft = keys.ArrowRight = false; });
  });
  el("btnHit").onclick = () => doHit(0.15);
  el("btnCharge").onpointerdown = (e) => { e.preventDefault(); charging = true; };
  el("btnCharge").onpointerup = () => {
    if (!charging) return;
    charging = false; const p = charge; charge = 0;
    el("chargeFill").style.height = "0%"; doHit(p);
  };
  el("btnBlock").onclick = () => { blockT = 0.5; beep(350, 40); };
  el("btnStart").onclick = start;
  el("btnAgain").onclick = () => { if (el("btnAgain").textContent === "Заново" || el("btnAgain").textContent === "Снова") start(); else startRound(); };

  window.addEventListener("amal-power", (e) => {
    const d = (e && e.detail) || {};
    if ((d.type === "mc-hammer" || d.type === "mc-owl" || d.type === "mc-tesla" || d.type === "killAll") && foe) { foe.hp = 0; winRound(); toast("🔨 Соперник забанен"); }
    if (d.type === "mc-lag") { timeStop = true; toast("🐢 Враг завис"); }
    if (d.type === "god") invincible = true;
    if (d.type === "killAll" && foe) { foe.hp = 0; winRound(); toast("💥 BZZZ!"); }
    if (d.type === "timestop") timeStop = !!d.on;
    if (d.type === "invincible") invincible = !!d.on;
    if (d.type === "coinMult" && you) { you.hp = you.max; toast("🪙 Полное HP"); }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
