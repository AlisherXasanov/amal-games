(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const NEED = 12;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const play = document.getElementById("play");
  const win = document.getElementById("win");
  const bubble = document.getElementById("bubble");
  const heatEl = document.getElementById("heat");
  const bitsEl = document.getElementById("bits");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  let g = null;
  let last = performance.now();
  let bubbleT = 0;
  let audioCtx = null;
  let drag = false;

  function say(t, sec) {
    bubble.textContent = t;
    bubble.hidden = false;
    bubbleT = sec || 2.4;
  }

  function beep(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const gn = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.value = freq;
      gn.gain.value = 0.1;
      o.connect(gn);
      gn.connect(audioCtx.destination);
      o.start();
      gn.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VW,
      y: ((e.clientY - r.top) / r.height) * VH,
    };
  }

  function spawnBit() {
    return {
      x: rand(80, VW - 80),
      y: rand(80, VH - 80),
      r: 14 + Math.random() * 8,
      bob: Math.random() * 6,
      got: false,
    };
  }

  function start() {
    g = {
      done: false,
      t: 0,
      candy: { x: VW / 2, y: VH / 2, r: 70, stretch: 1, wobble: 0 },
      heat: 100,
      bits: Array.from({ length: 8 }, spawnBit),
      got: 0,
      crumbs: [],
      steam: [],
    };
    menu.hidden = true;
    play.hidden = false;
    win.hidden = true;
    bitsEl.textContent = "🍬 0 / " + NEED;
    heatEl.textContent = "🔥 тепло 100";
    say("Butterscotch! Тяни ириску к кусочкам. E — откусить.", 3);
  }

  function finish(ok) {
    if (!g || g.done) return;
    g.done = true;
    play.hidden = true;
    win.hidden = false;
    if (ok) {
      winText.textContent = "Собрали всю ириску. Butterscotch победил!";
      winCode.textContent = "BUTTER · " + String(((Date.now() / 1000) | 0) % 100000);
    } else {
      winText.textContent = "Ириска остыла… Разогрей и попробуй снова.";
      winCode.textContent = "COLD · " + String(((Date.now() / 1000) | 0) % 100000);
    }
  }

  function bite() {
    if (!g || g.done) return;
    const c = g.candy;
    c.r = Math.max(40, c.r - 6);
    c.wobble = 1;
    g.heat = Math.min(100, g.heat + 12);
    for (let i = 0; i < 8; i++) {
      g.crumbs.push({
        x: c.x,
        y: c.y,
        vx: rand(-160, 160),
        vy: rand(-180, -40),
        life: rand(0.4, 0.9),
        r: rand(3, 7),
      });
    }
    beep(280, 0.08);
    say("Ням! Butterscotch…", 1.5);
  }

  function update(dt) {
    if (!g || g.done) return;
    g.t += dt;
    g.heat -= dt * (drag ? 2 : 6);
    if (g.heat <= 0) {
      g.heat = 0;
      finish(false);
      return;
    }
    heatEl.textContent = "🔥 тепло " + Math.ceil(g.heat);

    g.candy.wobble = Math.max(0, g.candy.wobble - dt * 2);
    g.candy.stretch += ((drag ? 1.15 : 1) - g.candy.stretch) * Math.min(1, dt * 8);

    if (Math.random() < dt * 2) {
      g.steam.push({
        x: g.candy.x + rand(-30, 30),
        y: g.candy.y - g.candy.r,
        life: 0.8,
        vy: -40 - Math.random() * 30,
      });
    }

    for (const b of g.bits) {
      if (b.got) continue;
      b.bob += dt * 4;
      const d = Math.hypot(b.x - g.candy.x, b.y - g.candy.y);
      if (d < g.candy.r * g.candy.stretch * 0.7 + b.r) {
        b.got = true;
        g.got++;
        g.heat = Math.min(100, g.heat + 8);
        g.candy.r = Math.min(95, g.candy.r + 3);
        bitsEl.textContent = "🍬 " + g.got + " / " + NEED;
        beep(440 + g.got * 20, 0.06);
        say("Кусочек +" + g.got + "!", 1.2);
        if (g.got >= NEED) {
          setTimeout(() => finish(true), 600);
        } else if (g.bits.filter((x) => !x.got).length < 3) {
          g.bits.push(spawnBit(), spawnBit());
        }
      }
    }

    for (const c of g.crumbs) {
      c.life -= dt;
      c.vy += 280 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
    }
    g.crumbs = g.crumbs.filter((c) => c.life > 0);
    for (const s of g.steam) {
      s.life -= dt;
      s.y += s.vy * dt;
    }
    g.steam = g.steam.filter((s) => s.life > 0);
  }

  function draw() {
    if (!g) return;
    const sky = ctx.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, "#fff0d0");
    sky.addColorStop(1, "#f0c070");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);

    // sugar sparkles
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 20; i++) {
      const x = (i * 97 + g.t * 20) % VW;
      const y = (i * 53) % VH;
      ctx.fillRect(x, y, 3, 3);
    }

    for (const b of g.bits) {
      if (b.got) continue;
      const bob = Math.sin(b.bob) * 4;
      ctx.fillStyle = "#f0b040";
      ctx.beginPath();
      ctx.arc(b.x, b.y + bob, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 240, 180, 0.7)";
      ctx.beginPath();
      ctx.arc(b.x - 4, b.y + bob - 4, b.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a06020";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const s of g.steam) {
      ctx.fillStyle = `rgba(255,255,255,${s.life * 0.4})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8 * s.life, 0, Math.PI * 2);
      ctx.fill();
    }

    const c = g.candy;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.stretch, 1 / Math.sqrt(c.stretch));
    ctx.rotate(Math.sin(g.t * 3) * c.wobble * 0.15);

    ctx.fillStyle = "rgba(120, 60, 10, 0.15)";
    ctx.beginPath();
    ctx.ellipse(4, c.r * 0.7, c.r * 0.9, c.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    const grd = ctx.createRadialGradient(-c.r * 0.3, -c.r * 0.3, 8, 0, 0, c.r);
    grd.addColorStop(0, "#ffe0a0");
    grd.addColorStop(0.5, "#e89030");
    grd.addColorStop(1, "#a05010");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();

    // wrap twist ends
    ctx.fillStyle = "#f0c060";
    ctx.beginPath();
    ctx.moveTo(-c.r, -8);
    ctx.lineTo(-c.r - 28, -22);
    ctx.lineTo(-c.r - 28, 22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(c.r, -8);
    ctx.lineTo(c.r + 28, -22);
    ctx.lineTo(c.r + 28, 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#5a3010";
    ctx.beginPath();
    ctx.arc(-14, -8, 5, 0, Math.PI * 2);
    ctx.arc(14, -8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a3010";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 6, 12, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "800 14px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BUTTER", 0, 4);

    ctx.restore();

    for (const cr of g.crumbs) {
      ctx.globalAlpha = Math.max(0, cr.life);
      ctx.fillStyle = "#d08030";
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (!play.hidden) {
      update(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!g || g.done) return;
    const p = canvasPos(e);
    if (Math.hypot(p.x - g.candy.x, p.y - g.candy.y) < g.candy.r + 30) {
      drag = true;
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || !g) return;
    const p = canvasPos(e);
    g.candy.x = Math.max(60, Math.min(VW - 60, p.x));
    g.candy.y = Math.max(60, Math.min(VH - 60, p.y));
    g.heat = Math.min(100, g.heat + 0.15);
  });
  canvas.addEventListener("pointerup", () => {
    drag = false;
  });
  canvas.addEventListener("pointercancel", () => {
    drag = false;
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "e" || e.key === "E" || e.key === " ") {
      e.preventDefault();
      bite();
    }
  });

  document.getElementById("btnStart").onclick = start;
  document.getElementById("btnAgain").onclick = start;
  document.getElementById("btnMenu").onclick = () => {
    g = null;
    menu.hidden = false;
    play.hidden = true;
    win.hidden = true;
  };
  document.getElementById("btnWinMenu").onclick = () => {
    g = null;
    menu.hidden = false;
    play.hidden = true;
    win.hidden = true;
  };

  requestAnimationFrame(frame);
})();
