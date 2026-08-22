(() => {
  "use strict";

  const cv = document.getElementById("c");
  const ctx = cv.getContext("2d");
  const menu = document.getElementById("menu");
  const upgradeEl = document.getElementById("upgrade");
  const gameover = document.getElementById("gameover");
  const hud = document.getElementById("hud");
  const abilitiesEl = document.getElementById("abilities");
  const comboFlash = document.getElementById("comboFlash");

  const keys = {};
  let W = 800, H = 600, mx = 400, my = 300;
  let running = false, paused = false;
  let last = 0, score = 0, wave = 1, combo = 0, comboTimer = 0;
  let lastAbility = null, lastAbilityAt = 0;

  const player = {
    x: 0, y: 0, r: 16, hp: 100, maxHp: 100,
    spd: 220, dmg: 14, fire: 0.14, cd: 0,
    ab: { pulse: 0, chain: 0, blink: 0, bubble: 0 },
    abCd: { pulse: 2.2, chain: 3.5, blink: 4, bubble: 8 },
    mods: { pulseR: 1, chainJ: 1, blinkD: 1, bubbleT: 1, dmg: 1 },
    bubbleUntil: 0,
  };

  let enemies = [];
  let bullets = [];
  let fx = [];
  let rifts = [];

  function owner() {
    try {
      if (window.AmalPowers && AmalPowers.isOwner && AmalPowers.isOwner()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      return ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"].some((k) => localStorage.getItem(k) === "1");
    } catch (_) {
      return false;
    }
  }

  function ownerMult() {
    return owner() ? 100 : 1;
  }

  function noCd() {
    return owner();
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W;
    cv.height = H;
  }

  window.addEventListener("resize", resize);
  resize();

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["Space", "KeyQ", "KeyE", "KeyR"].includes(e.code)) e.preventDefault();
    if (!running || paused) return;
    if (e.code === "Space") useAbility("pulse");
    if (e.code === "KeyE") useAbility("chain");
    if (e.code === "KeyQ") useAbility("blink");
    if (e.code === "KeyR") useAbility("bubble");
  });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });
  cv.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
  cv.addEventListener("touchmove", (e) => {
    if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
  }, { passive: true });

  abilitiesEl.querySelectorAll(".ab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!running || paused) return;
      useAbility(btn.getAttribute("data-ab"));
    });
  });

  function resetRun() {
    score = 0;
    wave = 1;
    combo = 0;
    enemies = [];
    bullets = [];
    fx = [];
    rifts = [];
    player.x = W / 2;
    player.y = H / 2;
    player.hp = player.maxHp;
    player.ab = { pulse: 0, chain: 0, blink: 0, bubble: 0 };
    player.mods = { pulseR: 1, chainJ: 1, blinkD: 1, bubbleT: 1, dmg: 1 };
    player.bubbleUntil = 0;
    spawnWave();
  }

  function spawnWave() {
    const n = 4 + wave * 2;
    for (let i = 0; i < n; i++) {
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = Math.random() * W; y = -30; }
      else if (side === 1) { x = W + 30; y = Math.random() * H; }
      else if (side === 2) { x = Math.random() * W; y = H + 30; }
      else { x = -30; y = Math.random() * H; }
      enemies.push(makeEnemy(x, y));
    }
    rifts.push({ x: W / 2, y: H / 2, r: 0, max: 40 + wave * 4, life: 2 });
  }

  function makeEnemy(x, y) {
    const kinds = ["shard", "orb", "runner"];
    const k = kinds[Math.min(kinds.length - 1, Math.floor(Math.random() * (1 + wave / 3)))];
    const hp = (k === "runner" ? 28 : k === "orb" ? 55 : 40) + wave * 6;
    return {
      x, y, k, hp, maxHp: hp,
      r: k === "orb" ? 22 : k === "runner" ? 12 : 16,
      spd: k === "runner" ? 95 + wave * 4 : 55 + wave * 2,
      dmg: 8 + wave,
    };
  }

  function useAbility(id) {
    if (player.ab[id] > 0 && !noCd()) return;

    const prevAbility = lastAbility;
    const prevAt = lastAbilityAt;

    player.ab[id] = player.abCd[id];
    lastAbility = id;
    lastAbilityAt = performance.now();

    if (
      ((prevAbility === "chain" && id === "pulse") || (prevAbility === "pulse" && id === "chain")) &&
      lastAbilityAt - prevAt < 1200
    ) {
      setTimeout(megaCombo, 80);
    }

    if (id === "pulse") {
      const R = 110 * player.mods.pulseR;
      burst(player.x, player.y, R, "#fbbf24");
      enemies.forEach((e) => {
        const d = dist(player, e);
        if (d < R + e.r) {
          const push = (R + e.r - d) * 4;
          const a = Math.atan2(e.y - player.y, e.x - player.x);
          e.x += Math.cos(a) * push * 0.04;
          e.y += Math.sin(a) * push * 0.04;
          hurtEnemy(e, 22 * player.mods.dmg * ownerMult(), "pulse");
        }
      });
    }

    if (id === "chain") {
      let targets = enemies.slice().sort((a, b) => dist(player, a) - dist(player, b));
      let from = { x: player.x, y: player.y };
      let jumps = Math.floor(4 * player.mods.chainJ);
      for (let i = 0; i < jumps && targets.length; i++) {
        const e = targets.shift();
        if (!e || e.hp <= 0) continue;
        fx.push({ t: "bolt", x1: from.x, y1: from.y, x2: e.x, y2: e.y, life: 0.25 });
        hurtEnemy(e, 18 * player.mods.dmg * ownerMult(), "chain");
        from = e;
      }
    }

    if (id === "blink") {
      const ox = player.x, oy = player.y;
      const a = Math.atan2(my - player.y, mx - player.x);
      player.x += Math.cos(a) * 140;
      player.y += Math.sin(a) * 140;
      player.x = Math.max(20, Math.min(W - 20, player.x));
      player.y = Math.max(20, Math.min(H - 20, player.y));
      burst(ox, oy, 70, "#a78bfa");
      enemies.forEach((e) => {
        if (dist({ x: ox, y: oy }, e) < 70 + e.r) {
          hurtEnemy(e, 30 * player.mods.blinkD * player.mods.dmg * ownerMult(), "blink");
        }
      });
      fx.push({ t: "ring", x: player.x, y: player.y, r: 8, life: 0.35, col: "#c4b5fd" });
    }

    if (id === "bubble") {
      player.bubbleUntil = performance.now() + 3500 * player.mods.bubbleT;
      fx.push({ t: "bubble", x: player.x, y: player.y, r: 10, life: 3.5 * player.mods.bubbleT, max: 160 });
    }
  }

  function megaCombo() {
    combo += 1;
    comboTimer = 2;
    burst(player.x, player.y, 180, "#fde68a");
    enemies.forEach((e) => {
      if (dist(player, e) < 200) hurtEnemy(e, 55 * player.mods.dmg * ownerMult(), "combo");
    });
    flashCombo("⚡💥 ПЕРЕГРУЗКА!");
    score += 50;
  }

  function flashCombo(t) {
    comboFlash.textContent = t;
    comboFlash.classList.add("show");
    setTimeout(() => comboFlash.classList.remove("show"), 700);
  }

  function hurtEnemy(e, dmg, tag) {
    if (e.hp <= 0) return;
    e.hp -= dmg;
    e.hit = 0.12;
    fx.push({ t: "dmg", x: e.x, y: e.y - e.r, txt: Math.round(dmg), life: 0.5, col: tag === "combo" ? "#fde68a" : "#7ed9b8" });
    if (e.hp <= 0) {
      score += e.k === "orb" ? 25 : e.k === "runner" ? 12 : 18;
      comboTimer = 1.5;
      combo += 1;
    }
  }

  function burst(x, y, R, col) {
    fx.push({ t: "burst", x, y, r: 8, max: R, life: 0.35, col });
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  setInterval(() => {
    if (!running || paused) return;
    player.cd -= 0.05;
    if (player.cd <= 0) {
      player.cd = player.fire;
      const a = Math.atan2(my - player.y, mx - player.x);
      bullets.push({
        x: player.x, y: player.y,
        vx: Math.cos(a) * 520, vy: Math.sin(a) * 520,
        r: 5, dmg: player.dmg * player.mods.dmg * ownerMult(), life: 1.2,
      });
    }
  }, 50);

  function update(dt) {
    if (!running || paused) return;

    let vx = 0, vy = 0;
    if (keys["KeyW"] || keys["ArrowUp"]) vy -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) vy += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) vx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) vx += 1;
    const len = Math.hypot(vx, vy) || 1;
    player.x += (vx / len) * player.spd * dt;
    player.y += (vy / len) * player.spd * dt;
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));

    Object.keys(player.ab).forEach((k) => {
      if (player.ab[k] > 0 && !noCd()) player.ab[k] = Math.max(0, player.ab[k] - dt);
      else if (noCd()) player.ab[k] = 0;
    });

    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;

    bullets = bullets.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) return false;
      for (const e of enemies) {
        if (e.hp > 0 && dist(b, e) < b.r + e.r) {
          hurtEnemy(e, b.dmg, "shot");
          return false;
        }
      }
      return b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20;
    });

    const slow = performance.now() < player.bubbleUntil ? 0.35 : 1;
    enemies.forEach((e) => {
      if (e.hp <= 0) return;
      const a = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(a) * e.spd * slow * dt;
      e.y += Math.sin(a) * e.spd * slow * dt;
      if (e.hit > 0) e.hit -= dt;
      if (dist(player, e) < player.r + e.r - 4) {
        player.hp -= e.dmg * dt * (owner() ? 0 : 1);
      }
    });
    enemies = enemies.filter((e) => e.hp > 0);

    fx = fx.filter((f) => {
      f.life -= dt;
      if (f.t === "bubble") f.r = Math.min(f.max, f.r + 200 * dt);
      if (f.t === "burst") f.r = Math.min(f.max, f.r + f.max * 2.5 * dt);
      return f.life > 0;
    });

    rifts = rifts.filter((r) => {
      r.life -= dt;
      r.r = Math.min(r.max, r.r + 80 * dt);
      return r.life > 0;
    });

    if (enemies.length === 0) {
      paused = true;
      showUpgrade();
    }

    if (player.hp <= 0) endGame();

    updateHud();
    updateAbilityButtons();
  }

  function updateHud() {
    document.getElementById("hpPill").textContent = "❤️ " + Math.max(0, Math.ceil(player.hp));
    document.getElementById("wavePill").textContent = "🌊 Волна " + wave;
    document.getElementById("scorePill").textContent = "⚡ " + score;
    document.getElementById("comboPill").textContent = "Комбо ×" + combo;
  }

  function updateAbilityButtons() {
    abilitiesEl.querySelectorAll(".ab").forEach((btn) => {
      const id = btn.getAttribute("data-ab");
      const left = player.ab[id];
      let cdEl = btn.querySelector(".cd");
      if (left > 0 && !noCd()) {
        btn.classList.add("off");
        if (!cdEl) {
          cdEl = document.createElement("span");
          cdEl.className = "cd";
          btn.appendChild(cdEl);
        }
        cdEl.textContent = left.toFixed(1);
      } else {
        btn.classList.remove("off");
        if (cdEl) cdEl.remove();
      }
    });
  }

  const UPGRADES = [
    { id: "dmg", label: "⚔ Урон +25%", apply: () => { player.mods.dmg *= 1.25; } },
    { id: "hp", label: "❤️ +30 HP", apply: () => { player.maxHp += 30; player.hp += 30; } },
    { id: "pulseR", label: "💥 Импульс шире", apply: () => { player.mods.pulseR *= 1.3; } },
    { id: "chainJ", label: "⚡ Цепь +2 прыжка", apply: () => { player.mods.chainJ += 0.5; } },
    { id: "blinkD", label: "🌀 Шаг сильнее", apply: () => { player.mods.blinkD *= 1.35; } },
    { id: "bubbleT", label: "🫧 Пузырь дольше", apply: () => { player.mods.bubbleT *= 1.4; } },
    { id: "spd", label: "🏃 Быстрее бег", apply: () => { player.spd *= 1.15; } },
  ];

  function showUpgrade() {
    const row = document.getElementById("upgradeRow");
    const picks = UPGRADES.sort(() => Math.random() - 0.5).slice(0, 3);
    row.innerHTML = picks.map((u) =>
      '<button type="button" data-up="' + u.id + '">' + u.label + "</button>"
    ).join("");
    row.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const u = picks.find((x) => x.id === btn.getAttribute("data-up"));
        if (u) u.apply();
        wave += 1;
        upgradeEl.classList.add("hidden");
        paused = false;
        spawnWave();
      }, { once: true });
    });
    upgradeEl.classList.remove("hidden");
  }

  function draw() {
    ctx.fillStyle = "#070812";
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(126,217,184,.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    rifts.forEach((r) => {
      const g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r);
      g.addColorStop(0, "rgba(124,58,237,.45)");
      g.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.fill();
    });

    fx.forEach((f) => {
      if (f.t === "burst" || f.t === "ring") {
        ctx.strokeStyle = f.col;
        ctx.lineWidth = 3;
        ctx.globalAlpha = f.life * 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (f.t === "bubble") {
        ctx.strokeStyle = "rgba(52,211,153,.5)";
        ctx.fillStyle = "rgba(52,211,153,.08)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      if (f.t === "bolt") {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.globalAlpha = f.life * 3;
        ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (f.t === "dmg") {
        ctx.fillStyle = f.col;
        ctx.font = "900 14px Nunito,sans-serif";
        ctx.globalAlpha = f.life * 2;
        ctx.fillText(f.txt, f.x, f.y);
        ctx.globalAlpha = 1;
      }
    });

    bullets.forEach((b) => {
      ctx.fillStyle = "#7ed9b8";
      ctx.shadowColor = "#7ed9b8";
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    enemies.forEach((e) => {
      const col = e.k === "orb" ? "#fb7185" : e.k === "runner" ? "#fbbf24" : "#a78bfa";
      ctx.fillStyle = col;
      ctx.globalAlpha = e.hit > 0 ? 0.6 : 1;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (e.maxHp > 40) {
        ctx.fillStyle = "rgba(0,0,0,.4)";
        ctx.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2, 4);
        ctx.fillStyle = "#7ed9b8";
        ctx.fillRect(e.x - e.r, e.y - e.r - 8, (e.hp / e.maxHp) * e.r * 2, 4);
      }
    });

    // player
    const pg = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, player.r + 8);
    pg.addColorStop(0, "#fff");
    pg.addColorStop(0.4, "#7ed9b8");
    pg.addColorStop(1, "rgba(13,110,95,0)");
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r + 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0d6e5f";
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.beginPath(); ctx.arc(player.x + 5, player.y - 4, 4, 0, Math.PI * 2); ctx.fill();

    // aim line
    ctx.strokeStyle = "rgba(126,217,184,.25)";
    ctx.setLineDash([4, 8]);
    ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(mx, my); ctx.stroke();
    ctx.setLineDash([]);
  }

  function loop(t) {
    const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function startGame() {
    menu.classList.add("hidden");
    gameover.classList.add("hidden");
    upgradeEl.classList.add("hidden");
    hud.hidden = false;
    abilitiesEl.hidden = false;
    running = true;
    paused = false;
    resetRun();
    const hint = document.getElementById("playHint");
    if (hint) {
      hint.classList.remove("hide");
      setTimeout(() => hint.classList.add("hide"), 9000);
    }
  }

  function endGame() {
    running = false;
    document.getElementById("goText").textContent = "Счёт: " + score + " · Волна: " + wave;
    gameover.classList.remove("hidden");
  }

  document.getElementById("btnStart").addEventListener("click", startGame);
  document.getElementById("btnRetry").addEventListener("click", startGame);
  document.getElementById("btnMenu").addEventListener("click", () => {
    gameover.classList.add("hidden");
    menu.classList.remove("hidden");
    hud.hidden = true;
    abilitiesEl.hidden = true;
    running = false;
  });

  requestAnimationFrame(loop);
})();
