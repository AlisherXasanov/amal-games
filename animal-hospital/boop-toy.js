(() => {
  "use strict";

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const counterEl = document.getElementById("counter");
  const singEl = document.getElementById("sing");

  const SING = ["boop!", "dee!", "doo!", "boop-a!", "dee-doo!", "boop-a-dee!", "doo-doo!", "boop-a-dee-doop!"];
  const MELODY = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659];

  let W = 960;
  let H = 540;
  let audioCtx = null;
  let boops = 0;
  let singIdx = 0;
  let singT = 0;
  let last = performance.now();

  const toy = {
    x: W / 2,
    y: H / 2,
    vx: 0,
    vy: 0,
    r: 72,
    squash: 1,
    stretch: 1,
    wobble: 0,
    blink: 0,
    mood: 0,
    drag: false,
    dragOffX: 0,
    dragOffY: 0,
    face: "owo",
  };

  const pops = [];
  const stars = [];

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    if (!boops) {
      toy.x = W / 2;
      toy.y = H / 2;
    }
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function beep(freq, dur, type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 1.08, audioCtx.currentTime + dur * 0.15);
      o.frequency.exponentialRampToValueAtTime(freq * 0.92, audioCtx.currentTime + dur);
      g.gain.setValueAtTime(0.16, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function boopMelody() {
    const n = boops % MELODY.length;
    beep(MELODY[n], 0.12, "triangle");
    setTimeout(() => beep(MELODY[(n + 2) % MELODY.length], 0.1, "sine"), 60);
    setTimeout(() => beep(MELODY[(n + 4) % MELODY.length], 0.14, "triangle"), 120);
  }

  function showSing(text) {
    singEl.textContent = text;
    singEl.classList.add("show");
    singT = 1.1;
  }

  function doBoop(x, y, power) {
    boops++;
    counterEl.textContent = "boop · " + boops;

    const word = SING[singIdx % SING.length];
    singIdx++;
    showSing(word);

    if (boops % 4 === 0) boopMelody();
    else beep(180 + (boops % 8) * 40, 0.09, boops % 2 ? "square" : "sine");

    const dx = toy.x - x;
    const dy = toy.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    const push = (power || 1) * 420;
    toy.vx += (dx / dist) * push * 0.35;
    toy.vy += (dy / dist) * push * 0.35 - 120;
    toy.squash = 0.65;
    toy.stretch = 1.25;
    toy.wobble = 1;
    toy.mood = 1;
    toy.blink = 0.15;
    toy.face = boops % 3 === 0 ? "uwu" : boops % 5 === 0 ? "xd" : "owo";

    for (let i = 0; i < 8; i++) {
      pops.push({
        x,
        y,
        vx: rand(-180, 180),
        vy: rand(-220, -40),
        life: rand(0.4, 0.9),
        r: rand(4, 10),
        hue: rand(300, 360),
      });
    }
    for (let i = 0; i < 3; i++) {
      stars.push({
        x: toy.x + rand(-30, 30),
        y: toy.y + rand(-40, 20),
        life: 0.8,
        rot: rand(0, 6),
        txt: ["✦", "♪", "boop", "dee", "doo"][(Math.random() * 5) | 0],
      });
    }
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  }

  function hitToy(x, y) {
    return Math.hypot(x - toy.x, y - toy.y) < toy.r * toy.squash + 10;
  }

  let pid = null;

  canvas.addEventListener("pointerdown", (e) => {
    const p = canvasPos(e);
    pid = e.pointerId;
    canvas.setPointerCapture(pid);
    if (hitToy(p.x, p.y)) {
      toy.drag = true;
      toy.dragOffX = toy.x - p.x;
      toy.dragOffY = toy.y - p.y;
      toy.squash = 0.85;
      beep(220, 0.05, "sine");
    } else {
      doBoop(p.x, p.y, 1.2);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!toy.drag || e.pointerId !== pid) return;
    const p = canvasPos(e);
    toy.x = p.x + toy.dragOffX;
    toy.y = p.y + toy.dragOffY;
    toy.vx = e.movementX * 8;
    toy.vy = e.movementY * 8;
    toy.wobble = 0.6;
  });

  function endDrag(e) {
    if (toy.drag && e) {
      const p = canvasPos(e);
      if (Math.hypot(toy.vx, toy.vy) < 80) doBoop(p.x, p.y, 0.6);
    }
    toy.drag = false;
    pid = null;
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  function update(dt) {
    if (singT > 0) {
      singT -= dt;
      if (singT <= 0) singEl.classList.remove("show");
    }

    if (!toy.drag) {
      toy.vy += 680 * dt;
      toy.x += toy.vx * dt;
      toy.y += toy.vy * dt;
      toy.vx *= 0.985;
      toy.vy *= 0.985;
    }

    const floor = H - toy.r - 24;
    const wallL = toy.r + 12;
    const wallR = W - toy.r - 12;
    const ceil = toy.r + 60;

    if (toy.y > floor) {
      toy.y = floor;
      toy.vy *= -0.62;
      toy.vx *= 0.92;
      if (Math.abs(toy.vy) > 80) {
        toy.squash = 1.2;
        toy.stretch = 0.8;
        beep(140 + Math.abs(toy.vy) * 0.2, 0.06, "sine");
      }
    }
    if (toy.y < ceil) {
      toy.y = ceil;
      toy.vy *= -0.5;
    }
    if (toy.x < wallL) {
      toy.x = wallL;
      toy.vx *= -0.65;
      toy.wobble = 1;
    }
    if (toy.x > wallR) {
      toy.x = wallR;
      toy.vx *= -0.65;
      toy.wobble = 1;
    }

    toy.squash += (1 - toy.squash) * Math.min(1, dt * 10);
    toy.stretch += (1 - toy.stretch) * Math.min(1, dt * 10);
    toy.wobble = Math.max(0, toy.wobble - dt * 2.5);
    toy.mood = Math.max(0, toy.mood - dt * 1.5);
    toy.blink = Math.max(0, toy.blink - dt);

    for (const p of pops) {
      p.life -= dt;
      p.vy += 320 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const s of stars) {
      s.life -= dt;
      s.y -= 40 * dt;
    }
    for (let i = pops.length - 1; i >= 0; i--) if (pops[i].life <= 0) pops.splice(i, 1);
    for (let i = stars.length - 1; i >= 0; i--) if (stars[i].life <= 0) stars.splice(i, 1);

    if (Math.random() < dt * 0.15 && toy.blink <= 0) toy.blink = 0.12;
  }

  function drawToy() {
    ctx.save();
    ctx.translate(toy.x, toy.y);
    const wob = Math.sin(performance.now() * 0.012) * toy.wobble * 8;
    ctx.rotate(wob * 0.02);

    const rx = toy.r * toy.stretch;
    const ry = toy.r * toy.squash;

    ctx.fillStyle = "rgba(255, 120, 160, 0.25)";
    ctx.beginPath();
    ctx.ellipse(4, ry + 8, rx * 0.85, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(-rx * 0.25, -ry * 0.3, rx * 0.1, 0, 0, rx);
    grad.addColorStop(0, "#ffb8d8");
    grad.addColorStop(0.55, "#ff80b0");
    grad.addColorStop(1, "#e86098");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (toy.blink <= 0) {
      ctx.fillStyle = "#402040";
      ctx.beginPath();
      ctx.ellipse(-rx * 0.28, -ry * 0.08, 9, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(rx * 0.28, -ry * 0.08, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-rx * 0.25, -ry * 0.12, 3, 0, Math.PI * 2);
      ctx.arc(rx * 0.31, -ry * 0.12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#402040";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-rx * 0.38, -ry * 0.06);
      ctx.lineTo(-rx * 0.18, -ry * 0.06);
      ctx.moveTo(rx * 0.18, -ry * 0.06);
      ctx.lineTo(rx * 0.38, -ry * 0.06);
      ctx.stroke();
    }

    ctx.strokeStyle = "#402040";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (toy.face === "uwu") {
      ctx.arc(0, ry * 0.18, 8, 0.2, Math.PI - 0.2);
    } else if (toy.face === "xd") {
      ctx.moveTo(-12, ry * 0.2);
      ctx.lineTo(12, ry * 0.32);
      ctx.moveTo(12, ry * 0.2);
      ctx.lineTo(-12, ry * 0.32);
    } else {
      ctx.arc(0, ry * 0.15, 10, 0.15, Math.PI - 0.15);
    }
    ctx.stroke();

    if (toy.mood > 0) {
      ctx.fillStyle = `rgba(255, 180, 220, ${toy.mood * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(-rx * 0.45, ry * 0.1, 12, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(rx * 0.45, ry * 0.1, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 6; i++) {
      const x = (i * 173 + performance.now() * 0.02) % (W + 100) - 50;
      const y = 80 + i * 45;
      ctx.beginPath();
      ctx.ellipse(x, y, 36, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 220, 180, 0.45)";
    ctx.fillRect(0, H - 24, W, 24);

    for (const p of pops) {
      ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of stars) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot + performance.now() * 0.003);
      ctx.globalAlpha = s.life;
      ctx.fillStyle = "#8060a0";
      ctx.font = "700 16px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(s.txt, 0, 0);
      ctx.restore();
    }

    drawToy();
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  showSing("boop-a-dee-doop!");
  requestAnimationFrame(frame);
})();
