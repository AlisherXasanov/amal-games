(() => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const comboEl = document.getElementById("combo");
  const hint = document.getElementById("hint");
  const startOv = document.getElementById("start");
  const endOv = document.getElementById("end");
  const endTitle = document.getElementById("endTitle");
  const endText = document.getElementById("endText");

  const BEST_KEY = "amal-siyanie-best-v2";
  let W = 0,
    H = 0,
    dpr = 1;
  let running = false;
  let t = 0;
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
  let magnet = 0;
  let shield = 0;
  let shake = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  bestEl.textContent = "рекорд " + best;

  const pointer = { x: 0, y: 0, active: false };
  const player = { x: 0, y: 0, r: 16, px: 0, py: 0, angle: 0 };
  let sparks = [];
  let shards = [];
  let orbs = [];
  let ribbons = [];
  let particles = [];
  let floats = [];
  let stars = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!stars.length) initStars();
    if (!running) {
      player.x = W * 0.5;
      player.y = H * 0.64;
    }
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.75,
        z: Math.random(),
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function reset() {
    score = 0;
    combo = 0;
    comboTimer = 0;
    magnet = 0;
    shield = 0;
    shake = 0;
    t = 0;
    sparks = [];
    shards = [];
    orbs = [];
    particles = [];
    floats = [];
    ribbons = [];
    for (let i = 0; i < 7; i++) {
      ribbons.push({
        y: (H / 6) * i + rand(-30, 30),
        amp: rand(22, 55),
        speed: rand(0.35, 1.1),
        hue: rand(145, 210),
        phase: rand(0, Math.PI * 2),
        thick: rand(10, 22),
      });
    }
    player.x = W * 0.5;
    player.y = H * 0.64;
    player.px = player.x;
    player.py = player.y;
    scoreEl.textContent = "0";
    comboEl.textContent = "";
    for (let i = 0; i < 12; i++) spawnSpark(true);
    for (let i = 0; i < 2; i++) spawnShard(true);
  }

  function spawnSpark(anywhere) {
    const rare = Math.random() < 0.08;
    sparks.push({
      x: rand(28, W - 28),
      y: anywhere ? rand(50, H * 0.5) : -rand(20, 140),
      r: rare ? rand(8, 11) : rand(5, 8),
      vy: rand(35, 85),
      wob: rand(0, Math.PI * 2),
      hue: rare ? rand(40, 55) : rand(160, 210),
      rare,
      pulse: rand(0, Math.PI * 2),
    });
  }

  function spawnShard(anywhere) {
    shards.push({
      x: rand(36, W - 36),
      y: anywhere ? rand(0, H * 0.35) : -rand(50, 180),
      r: rand(14, 22),
      vy: rand(75, 150) + score * 0.45,
      rot: rand(0, Math.PI),
      spin: rand(-2.5, 2.5),
      sides: 3 + (Math.random() < 0.35 ? 1 : 0),
    });
  }

  function spawnOrb() {
    orbs.push({
      x: rand(40, W - 40),
      y: -30,
      r: 11,
      vy: rand(50, 80),
      kind: Math.random() < 0.5 ? "magnet" : "shield",
      pulse: 0,
    });
  }

  function burst(x, y, hue, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(30, speed || 220);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.4, 1),
        hue,
        r: rand(1.2, 4),
      });
    }
  }

  function floatText(x, y, text, color) {
    floats.push({ x, y, text, color, life: 0.9, vy: -40 });
  }

  function addScore(n, x, y) {
    const mul = Math.max(1, combo);
    const got = n * mul;
    score += got;
    scoreEl.textContent = String(score);
    if (x != null) floatText(x, y, mul > 1 ? "+" + got + " ×" + mul : "+" + got, "#7ef0ff");
  }

  function bumpCombo() {
    combo += 1;
    comboTimer = 2.2;
    comboEl.textContent = combo > 1 ? "комбо ×" + combo : "";
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#03050f");
    g.addColorStop(0.4, "#071433");
    g.addColorStop(0.75, "#0a1f3d");
    g.addColorStop(1, "#050d1c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const a = 0.15 + s.z * 0.55 + Math.sin(t * 2.5 + s.tw) * 0.15;
      ctx.globalAlpha = Math.max(0.05, a);
      ctx.fillStyle = "#eaf6ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 0.6 + s.z * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = "lighter";
    for (const rb of ribbons) {
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 6) {
        const y =
          rb.y +
          Math.sin(x * 0.007 + t * rb.speed + rb.phase) * rb.amp +
          Math.sin(x * 0.018 - t * 0.7 + rb.phase) * (rb.amp * 0.35) +
          Math.sin(t * 0.4 + rb.phase) * 10;
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${rb.hue}, 95%, 62%, 0.14)`;
      ctx.lineWidth = rb.thick * 1.8;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.strokeStyle = `hsla(${rb.hue + 25}, 100%, 72%, 0.28)`;
      ctx.lineWidth = rb.thick * 0.45;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    // soft vignette
    const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.15, W / 2, H * 0.5, H * 0.85);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function drawPlayer() {
    const vx = player.x - player.px;
    const vy = player.y - player.py;
    player.angle = Math.atan2(vy, vx || 0.001) * 0.35;

    for (let i = 10; i >= 0; i--) {
      const k = i / 10;
      const x = player.x - vx * k * 1.2;
      const y = player.y - vy * k * 1.2;
      ctx.beginPath();
      ctx.arc(x, y, player.r * (1 - k * 0.55), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(126,240,255,${0.04 + (1 - k) * 0.2})`;
      ctx.fill();
    }

    if (shield > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 10 + Math.sin(t * 8) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(167,139,250,${0.35 + Math.sin(t * 10) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (magnet > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, 70 + Math.sin(t * 6) * 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(250,204,21,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, player.r * 3.2);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.25, "rgba(126,240,255,0.9)");
    glow.addColorStop(0.55, "rgba(34,211,238,0.35)");
    glow.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, player.r * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.fillStyle = "#f0fdff";
    ctx.fill();
    ctx.strokeStyle = "rgba(126,240,255,0.95)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawSpark(s) {
    s.pulse += 0.12;
    const pr = s.r * (1 + Math.sin(s.pulse) * 0.12);
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, pr * 3.5);
    g.addColorStop(0, `hsla(${s.hue}, 100%, 90%, 1)`);
    g.addColorStop(0.4, `hsla(${s.hue}, 95%, 60%, 0.55)`);
    g.addColorStop(1, `hsla(${s.hue}, 90%, 50%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, pr * 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, pr * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShard(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.beginPath();
    const n = s.sides;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = Math.cos(a) * s.r;
      const y = Math.sin(a) * s.r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -s.r, 0, s.r);
    g.addColorStop(0, "#3b1d6e");
    g.addColorStop(1, "#12061f");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(192,132,252,0.65)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  function drawOrb(o) {
    o.pulse += 0.15;
    const col = o.kind === "magnet" ? [250, 204, 21] : [167, 139, 250];
    const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2.8);
    g.addColorStop(0, `rgba(255,255,255,0.95)`);
    g.addColorStop(0.4, `rgba(${col[0]},${col[1]},${col[2]},0.7)`);
    g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * (2.2 + Math.sin(o.pulse) * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }

  function update(dt) {
    t += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 4);
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) {
        combo = 0;
        comboEl.textContent = "";
      }
    }
    if (magnet > 0) magnet = Math.max(0, magnet - dt);
    if (shield > 0) shield = Math.max(0, shield - dt);

    player.px = player.x;
    player.py = player.y;
    if (pointer.active) {
      player.x += (pointer.x - player.x) * Math.min(1, dt * 12);
      player.y += (pointer.y - player.y) * Math.min(1, dt * 12);
    }
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r + 48, Math.min(H - player.r - 24, player.y));

    const sparkCap = 14 + Math.floor(score / 30);
    const shardCap = 2 + Math.floor(score / 35);
    if (sparks.length < sparkCap) spawnSpark(false);
    if (shards.length < shardCap) spawnShard(false);
    if (orbs.length < 1 && Math.random() < dt * 0.12) spawnOrb();

    for (const s of sparks) {
      s.wob += dt * 3.2;
      s.y += s.vy * dt;
      s.x += Math.sin(s.wob) * 32 * dt;
      if (magnet > 0) {
        const dx = player.x - s.x;
        const dy = player.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 130) {
          s.x += (dx / d) * 220 * dt;
          s.y += (dy / d) * 220 * dt;
        }
      }
    }
    sparks = sparks.filter((s) => {
      const dx = s.x - player.x;
      const dy = s.y - player.y;
      if (dx * dx + dy * dy < (player.r + s.r) * (player.r + s.r)) {
        bumpCombo();
        addScore(s.rare ? 5 : 1, s.x, s.y);
        burst(s.x, s.y, s.hue, s.rare ? 18 : 12, s.rare ? 280 : 200);
        return false;
      }
      return s.y < H + 50;
    });

    for (const s of shards) {
      s.y += s.vy * dt;
      s.rot += s.spin * dt;
      // near miss
      const dx = s.x - player.x;
      const dy = s.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < player.r + s.r * 0.72) {
        if (shield > 0) {
          shield = 0;
          shake = 0.35;
          burst(s.x, s.y, 280, 20, 260);
          floatText(player.x, player.y - 24, "щит!", "#c4b5fd");
          s.y = H + 100;
        } else {
          gameOver();
          return;
        }
      } else if (dist < player.r + s.r + 18 && s.y > player.y - 40) {
        if (!s._near) {
          s._near = true;
          bumpCombo();
          addScore(2, s.x, s.y);
          floatText(s.x, s.y, "близко!", "#fde68a");
        }
      }
    }
    shards = shards.filter((s) => s.y < H + 70);

    for (const o of orbs) {
      o.y += o.vy * dt;
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      if (dx * dx + dy * dy < (player.r + o.r) * (player.r + o.r)) {
        if (o.kind === "magnet") {
          magnet = 5;
          floatText(o.x, o.y, "магнит", "#facc15");
        } else {
          shield = 6;
          floatText(o.x, o.y, "щит", "#c4b5fd");
        }
        burst(o.x, o.y, o.kind === "magnet" ? 45 : 270, 16, 240);
        o.y = H + 99;
      }
    }
    orbs = orbs.filter((o) => o.y < H + 40);

    particles = particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      return p.life > 0;
    });
    floats = floats.filter((f) => {
      f.life -= dt;
      f.y += f.vy * dt;
      return f.life > 0;
    });
  }

  function draw() {
    ctx.save();
    if (shake > 0) {
      ctx.translate(rand(-4, 4) * shake, rand(-4, 4) * shake);
    }
    drawBg();
    for (const s of sparks) drawSpark(s);
    for (const o of orbs) drawOrb(o);
    for (const s of shards) drawShard(s);
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = `hsl(${p.hue}, 95%, 70%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawPlayer();
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = "900 14px Nunito,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  let last = 0;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function startGame() {
    reset();
    running = true;
    startOv.classList.add("hidden");
    endOv.classList.add("hidden");
    setTimeout(() => hint.classList.add("fade"), 2500);
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    shake = 0.6;
    burst(player.x, player.y, 190, 36, 320);
    draw();
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
      bestEl.textContent = "рекорд " + best;
      endTitle.textContent = "Новый рекорд!";
    } else {
      endTitle.textContent = "Полёт окончен";
    }
    endText.textContent = "Очки: " + score + " · Рекорд: " + best + (combo > 1 ? " · комбо было ×" + combo : "");
    endOv.classList.remove("hidden");
    hint.classList.remove("fade");
  }

  function setPointer(clientX, clientY, on) {
    pointer.active = on;
    pointer.x = clientX;
    pointer.y = clientY;
  }

  window.addEventListener("resize", resize);
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    setPointer(e.clientX, e.clientY, true);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (pointer.active) setPointer(e.clientX, e.clientY, true);
  });
  window.addEventListener("pointerup", () => {
    pointer.active = false;
  });

  document.getElementById("play").onclick = startGame;
  document.getElementById("again").onclick = startGame;

  resize();
  reset();
  draw();
})();
