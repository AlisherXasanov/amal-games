(() => {
  "use strict";
  const UNLOCK_KEY = "amal-secret-dream-unlock-v1";
  const MIN_WAIT = 2 * 60 * 1000;
  const MAX_WAIT = 18 * 60 * 1000;

  function getUnlockAt() {
    let at = 0;
    try { at = Number(localStorage.getItem(UNLOCK_KEY)) || 0; } catch (_) {}
    if (!at) {
      at = Date.now() + MIN_WAIT + Math.floor(Math.random() * (MAX_WAIT - MIN_WAIT));
      try { localStorage.setItem(UNLOCK_KEY, String(at)); } catch (_) {}
    }
    return at;
  }

  const unlockAt = getUnlockAt();
  if (Date.now() < unlockAt) {
    document.body.innerHTML =
      '<a class="back" href="../" style="position:fixed;z-index:20;left:10px;top:10px;padding:8px 12px;border:1px solid #ffffff30;border-radius:10px;background:#080514cc;color:#fff;text-decoration:none;font-weight:800">← Все игры</a>' +
      '<div style="min-height:100vh;display:grid;place-items:center;background:#05030d;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">' +
      '<div style="max-width:420px;padding:28px;border:1px solid #ffffff33;border-radius:24px;background:#0b061ce8;box-shadow:0 0 60px #7c3aed55">' +
      '<div style="font-size:64px">◈🔒</div>' +
      "<h1 style=\"margin:12px 0\">Ещё рано</h1>" +
      "<p style=\"color:#d8b4fe;line-height:1.55\">Эта игра сама решит, когда открыться. Вернись на главную — там будет таймер.</p>" +
      '<a href="../" style="display:inline-block;margin-top:14px;padding:11px 22px;border-radius:999px;background:linear-gradient(135deg,#22d3ee,#8b5cf6);color:#fff;text-decoration:none;font-weight:900">На главную</a>' +
      "</div></div>";
    return;
  }

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const stageEl = document.getElementById("stage");
  const fragmentsEl = document.getElementById("fragments");
  const livesEl = document.getElementById("lives");
  const messageEl = document.getElementById("message");
  const screen = document.getElementById("screen");
  const keys = Object.create(null);
  const rooms = [
    { name: "Обычная?", hue: 265, rule: "normal" },
    { name: "Зеркало", hue: 190, rule: "mirror" },
    { name: "Лёд", hue: 220, rule: "ice" },
    { name: "Пульс", hue: 335, rule: "pulse" },
    { name: "Тень", hue: 45, rule: "dark" },
    { name: "Невозможная", hue: 125, rule: "chaos" },
  ];
  let W = 0, H = 0, playing = false, room = 0, got = 0, lives = 3, time = 0;
  let target = null, sparks = [], shards = [], dangers = [], stars = [];
  const player = { x: 0, y: 0, vx: 0, vy: 0, r: 15, shield: 0 };

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    stars = Array.from({ length: Math.max(50, (W * H / 10000) | 0) }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .3, p: Math.random() * 8,
    }));
    if (!playing) { player.x = W / 2; player.y = H * .75; }
  }
  addEventListener("resize", resize);
  resize();

  function say(text) {
    messageEl.textContent = text;
    messageEl.classList.add("show");
    clearTimeout(messageEl._t);
    messageEl._t = setTimeout(() => messageEl.classList.remove("show"), 1800);
  }
  function updateHud() {
    stageEl.textContent = "Комната " + (room + 1);
    fragmentsEl.textContent = "✦ " + got + "/3";
    livesEl.textContent = "♥".repeat(lives) + "♡".repeat(Math.max(0, 3 - lives));
  }
  function spawnRoom() {
    got = 0;
    player.x = W / 2; player.y = H * .78; player.vx = player.vy = 0; player.shield = 1.2;
    shards = Array.from({ length: 3 }, (_, i) => ({
      x: 70 + Math.random() * Math.max(80, W - 140),
      y: 100 + Math.random() * Math.max(80, H - 220),
      r: 13, phase: i * 2,
    }));
    dangers = Array.from({ length: 3 + room }, () => ({
      x: Math.random() * W, y: 80 + Math.random() * (H - 160),
      vx: (Math.random() - .5) * (90 + room * 12),
      vy: (Math.random() - .5) * (90 + room * 12),
      r: 12 + Math.random() * 9,
    }));
    updateHud();
    say("Правило комнаты: «" + rooms[room].name + "»");
  }
  function start() {
    playing = true; room = 0; lives = 3; time = 0;
    screen.classList.add("hidden");
    spawnRoom();
  }
  document.getElementById("start").onclick = start;

  addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  });
  addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
  canvas.addEventListener("pointerdown", e => { target = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointermove", e => { if (e.buttons) target = { x: e.clientX, y: e.clientY }; });

  function burst(x, y, color, n = 18) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 190;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5 + Math.random() * .7, color });
    }
  }
  function hurt() {
    if (player.shield > 0) return;
    lives--; player.shield = 1.7; burst(player.x, player.y, "#fb7185", 30); updateHud();
    if (lives <= 0) {
      playing = false;
      screen.classList.remove("hidden");
      screen.querySelector("h1").textContent = "Сон пересобрался";
      screen.querySelector("p").textContent = "Комнаты уже стали другими. Можно войти ещё раз.";
      document.getElementById("start").textContent = "ЕЩЁ РАЗ";
    }
  }
  function finishRoom() {
    if (room < rooms.length - 1) {
      room++;
      burst(W / 2, H / 2, "#a5f3fc", 60);
      spawnRoom();
    } else {
      playing = false;
      localStorage.setItem("amal-secret-dream-finished-v1", "1");
      screen.classList.remove("hidden");
      screen.querySelector(".sigil").textContent = "♛";
      screen.querySelector("h1").textContent = "Невозможное стало твоим";
      screen.querySelector("p").textContent = "Ты прошёл все изменяющиеся комнаты. При следующем входе их расположение будет другим.";
      document.getElementById("start").textContent = "ПЕРЕСОБРАТЬ МИР";
      window.dispatchEvent(new CustomEvent("amal-power", { detail: { type: "secretDreamWin", reward: 777 } }));
    }
  }

  function update(dt) {
    if (!playing) return;
    time += dt;
    const info = rooms[room], mirror = info.rule === "mirror" ? -1 : 1;
    let dx = 0, dy = 0;
    if (keys.a || keys.arrowleft) dx--;
    if (keys.d || keys.arrowright) dx++;
    if (keys.w || keys.arrowup) dy--;
    if (keys.s || keys.arrowdown) dy++;
    dx *= mirror;
    if (target) {
      const tx = target.x - player.x, ty = target.y - player.y, d = Math.hypot(tx, ty);
      if (d > 12) { dx += tx / d; dy += ty / d; } else target = null;
    }
    const len = Math.hypot(dx, dy) || 1;
    const accel = info.rule === "ice" ? 260 : 780;
    const drag = info.rule === "ice" ? .985 : .83;
    player.vx = player.vx * drag + (dx / len) * accel * dt;
    player.vy = player.vy * drag + (dy / len) * accel * dt;
    if (info.rule === "pulse") {
      player.vx += Math.sin(time * 3) * 30 * dt;
      player.vy += Math.cos(time * 2) * 30 * dt;
    }
    player.x = Math.max(22, Math.min(W - 22, player.x + player.vx * dt));
    player.y = Math.max(70, Math.min(H - 22, player.y + player.vy * dt));
    player.shield = Math.max(0, player.shield - dt);

    dangers.forEach((d, i) => {
      const chaos = info.rule === "chaos" ? 1.8 : 1;
      d.x += d.vx * dt * chaos; d.y += d.vy * dt * chaos;
      if (d.x < d.r || d.x > W - d.r) d.vx *= -1;
      if (d.y < 70 + d.r || d.y > H - d.r) d.vy *= -1;
      if (info.rule === "pulse") d.r = 13 + Math.sin(time * 4 + i) * 7;
      if (Math.hypot(player.x - d.x, player.y - d.y) < player.r + d.r) hurt();
    });
    shards = shards.filter(s => {
      s.phase += dt * 2;
      if (Math.hypot(player.x - s.x, player.y - s.y) < player.r + s.r + 5) {
        got++; burst(s.x, s.y, "#fde68a"); updateHud();
        if (got === 3) say("Дверь проснулась — войди в неё");
        return false;
      }
      return true;
    });
    if (got === 3 && Math.hypot(player.x - W / 2, player.y - 94) < 42) finishRoom();
    sparks = sparks.filter(p => {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97;
      return p.life > 0;
    });
  }

  function draw(now) {
    const info = rooms[room] || rooms[0];
    const bg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .7);
    bg.addColorStop(0, `hsl(${info.hue + Math.sin(now / 1800) * 18} 60% 15%)`);
    bg.addColorStop(1, "#020108");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    stars.forEach(s => {
      const a = .2 + Math.abs(Math.sin(now / 900 + s.p)) * .55;
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    if (playing && info.rule === "dark") {
      ctx.save(); ctx.globalAlpha = .15;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(player.x, player.y, 140, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    dangers.forEach((d, i) => {
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(time * (i % 2 ? -1 : 1));
      ctx.shadowColor = "#fb7185"; ctx.shadowBlur = 15; ctx.fillStyle = "#7f1d1d";
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const a = k * Math.PI / 6, r = k % 2 ? d.r * .55 : d.r;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    });
    shards.forEach(s => {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.phase);
      ctx.shadowColor = "#fde68a"; ctx.shadowBlur = 22; ctx.fillStyle = "#fff7ae";
      ctx.beginPath(); ctx.moveTo(0, -s.r); ctx.lineTo(s.r * .7, 0); ctx.lineTo(0, s.r); ctx.lineTo(-s.r * .7, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    if (playing && got === 3) {
      const x = W / 2, y = 94, pulse = 1 + Math.sin(time * 4) * .08;
      ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
      ctx.shadowColor = "#67e8f9"; ctx.shadowBlur = 28; ctx.strokeStyle = "#a5f3fc"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, 0, 27, 39, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#4c1d9566"; ctx.fill(); ctx.restore();
    }
    if (playing) {
      ctx.save(); ctx.translate(player.x, player.y);
      ctx.globalAlpha = player.shield > 0 && Math.floor(time * 10) % 2 ? .45 : 1;
      const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, 29);
      aura.addColorStop(0, "#fff"); aura.addColorStop(.35, "#67e8f9"); aura.addColorStop(1, "#7c3aed00");
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 29, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, player.r * .48, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    sparks.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;
  }
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.04, (now - last) / 1000); last = now;
    update(dt); draw(now); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  addEventListener("amal-power", e => {
    const type = e.detail && e.detail.type;
    if (type === "heal" || type === "superheal" || type === "max") {
      lives = 3; player.shield = 5; updateHud(); say("Королевская защита!");
    }
    if (type === "boom" || type === "zap") {
      dangers.forEach(d => burst(d.x, d.y, "#67e8f9")); dangers = []; say("Опасности рассыпались!");
    }
  });
})();
