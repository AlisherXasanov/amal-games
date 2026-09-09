(() => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const hint = document.getElementById("hint");
  const startOv = document.getElementById("start");
  const endOv = document.getElementById("end");
  const endTitle = document.getElementById("endTitle");
  const endText = document.getElementById("endText");

  const BEST_KEY = "amal-siyanie-best-v1";
  let W = 0;
  let H = 0;
  let dpr = 1;
  let running = false;
  let t = 0;
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  bestEl.textContent = "рекорд " + best;

  const pointer = { x: 0, y: 0, active: false };
  const player = { x: 0, y: 0, r: 14, px: 0, py: 0 };
  let sparks = [];
  let shards = [];
  let ribbons = [];
  let particles = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) {
      player.x = W * 0.5;
      player.y = H * 0.62;
    }
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function reset() {
    score = 0;
    t = 0;
    sparks = [];
    shards = [];
    particles = [];
    ribbons = [];
    for (let i = 0; i < 5; i++) {
      ribbons.push({
        y: (H / 5) * i + rand(-20, 20),
        amp: rand(18, 40),
        speed: rand(0.4, 0.9),
        hue: rand(150, 200),
        phase: rand(0, Math.PI * 2),
      });
    }
    player.x = W * 0.5;
    player.y = H * 0.62;
    player.px = player.x;
    player.py = player.y;
    scoreEl.textContent = "0";
    for (let i = 0; i < 8; i++) spawnSpark(true);
    for (let i = 0; i < 3; i++) spawnShard(true);
  }

  function spawnSpark(anywhere) {
    sparks.push({
      x: rand(24, W - 24),
      y: anywhere ? rand(40, H * 0.55) : -rand(20, 120),
      r: rand(5, 9),
      vy: rand(40, 90),
      wob: rand(0, Math.PI * 2),
      hue: rand(165, 210),
    });
  }

  function spawnShard(anywhere) {
    shards.push({
      x: rand(30, W - 30),
      y: anywhere ? rand(0, H * 0.4) : -rand(40, 160),
      r: rand(12, 20),
      vy: rand(70, 140) + score * 0.35,
      rot: rand(0, Math.PI),
      spin: rand(-2, 2),
    });
  }

  function burst(x, y, hue, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(40, 180);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.35, 0.8),
        hue,
        r: rand(1.5, 3.5),
      });
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050714");
    g.addColorStop(0.45, "#0b1a3a");
    g.addColorStop(1, "#06101f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 97) % W) + Math.sin(t * 0.1 + i) * 2;
      const sy = ((i * 53) % (H * 0.7));
      const a = 0.25 + (Math.sin(t * 2 + i) + 1) * 0.2;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 7 === 0 ? 1.6 : 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // aurora ribbons
    for (const rb of ribbons) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y =
          rb.y +
          Math.sin(x * 0.008 + t * rb.speed + rb.phase) * rb.amp +
          Math.sin(x * 0.02 - t * 0.6) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${rb.hue}, 90%, 65%, 0.22)`;
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.strokeStyle = `hsla(${rb.hue + 20}, 95%, 75%, 0.35)`;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }

  function drawPlayer() {
    const trail = 6;
    for (let i = trail; i >= 0; i--) {
      const k = i / trail;
      const x = player.x + (player.px - player.x) * k * 0.35;
      const y = player.y + (player.py - player.y) * k * 0.35;
      ctx.beginPath();
      ctx.arc(x, y, player.r * (1 - k * 0.45), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(126, 240, 255, ${0.08 + (1 - k) * 0.25})`;
      ctx.fill();
    }
    const glow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, player.r * 2.8);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(0.35, "rgba(126,240,255,0.85)");
    glow.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = "#e8fbff";
    ctx.fill();
    ctx.strokeStyle = "rgba(126,240,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawSpark(s) {
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
    g.addColorStop(0, `hsla(${s.hue}, 100%, 85%, 1)`);
    g.addColorStop(0.5, `hsla(${s.hue}, 90%, 60%, 0.55)`);
    g.addColorStop(1, `hsla(${s.hue}, 90%, 50%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShard(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.beginPath();
    ctx.moveTo(0, -s.r);
    ctx.lineTo(s.r * 0.75, s.r * 0.55);
    ctx.lineTo(-s.r * 0.75, s.r * 0.55);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -s.r, 0, s.r);
    g.addColorStop(0, "#2a1848");
    g.addColorStop(1, "#0f0618");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(167,139,250,0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function update(dt) {
    t += dt;
    player.px = player.x;
    player.py = player.y;
    if (pointer.active) {
      player.x += (pointer.x - player.x) * Math.min(1, dt * 10);
      player.y += (pointer.y - player.y) * Math.min(1, dt * 10);
    }
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r + 40, Math.min(H - player.r - 20, player.y));

    if (sparks.length < 10 + Math.floor(score / 40)) spawnSpark(false);
    if (shards.length < 2 + Math.floor(score / 25)) spawnShard(false);

    for (const s of sparks) {
      s.wob += dt * 3;
      s.y += s.vy * dt;
      s.x += Math.sin(s.wob) * 28 * dt;
    }
    sparks = sparks.filter((s) => {
      const dx = s.x - player.x;
      const dy = s.y - player.y;
      if (dx * dx + dy * dy < (player.r + s.r) * (player.r + s.r)) {
        score += 1;
        scoreEl.textContent = String(score);
        burst(s.x, s.y, s.hue, 10);
        return false;
      }
      return s.y < H + 40;
    });

    for (const s of shards) {
      s.y += s.vy * dt;
      s.rot += s.spin * dt;
    }
    for (const s of shards) {
      const dx = s.x - player.x;
      const dy = s.y - player.y;
      if (dx * dx + dy * dy < (player.r + s.r * 0.7) * (player.r + s.r * 0.7)) {
        gameOver();
        return;
      }
    }
    shards = shards.filter((s) => s.y < H + 60);

    particles = particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      return p.life > 0;
    });
  }

  function draw() {
    drawBg();
    for (const s of sparks) drawSpark(s);
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
    setTimeout(() => hint.classList.add("fade"), 2800);
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    burst(player.x, player.y, 190, 24);
    draw();
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
      bestEl.textContent = "рекорд " + best;
      endTitle.textContent = "Новый рекорд!";
    } else {
      endTitle.textContent = "Полёт окончен";
    }
    endText.textContent = "Искры: " + score + " · Рекорд: " + best;
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
  canvas.addEventListener("pointerup", () => {
    pointer.active = false;
  });
  canvas.addEventListener("pointercancel", () => {
    pointer.active = false;
  });

  document.getElementById("play").onclick = startGame;
  document.getElementById("again").onclick = startGame;

  resize();
  reset();
  draw();
})();
