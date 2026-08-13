(() => {
  "use strict";

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const W = 960;
  const H = 540;
  const NEED = 8;

  const menu = document.getElementById("menu");
  const win = document.getElementById("win");
  const hud = document.getElementById("hud");
  const bubble = document.getElementById("bubble");
  const hudCoins = document.getElementById("hudCoins");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");
  const touch = document.getElementById("touch");
  const pad = document.getElementById("pad");

  const keys = Object.create(null);
  const stick = { x: 0, y: 0, active: false };
  let wantRoar = false;
  let g = null;
  let last = performance.now();
  let bubbleT = 0;
  let playing = false;

  function say(text, sec) {
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleT = sec || 3;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function makeBuildings() {
    const list = [];
    const cols = 6;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bw = rand(110, 150);
        const bh = rand(70, 180);
        list.push({
          x: c * 160 + rand(-10, 10),
          y: H - 40 - bh + r * 8,
          w: bw,
          h: bh,
          color: `hsl(${rand(200, 240)} ${rand(35, 55)}% ${rand(38, 52)}%)`,
          roof: `hsl(${rand(0, 30)} ${rand(50, 70)}% ${rand(45, 58)}%)`,
        });
      }
    }
    return list;
  }

  function spawnFeathers(count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push({
        x: rand(80, W - 80),
        y: rand(80, H - 120),
        bob: rand(0, Math.PI * 2),
        taken: false,
      });
    }
    return out;
  }

  function spawnCats() {
    return [
      { x: 220, y: 280, vx: 40, vy: 20, scared: 0 },
      { x: 520, y: 200, vx: -35, vy: 30, scared: 0 },
      { x: 720, y: 340, vx: 25, vy: -25, scared: 0 },
    ];
  }

  function spawnCrates() {
    return [
      { x: 360, y: 380, open: false },
      { x: 640, y: 160, open: false },
      { x: 820, y: 300, open: false },
    ];
  }

  function resetGame() {
    g = {
      t: 0,
      crow: { x: 120, y: 220, vx: 0, vy: 0, flap: 0, angle: 0 },
      feathers: spawnFeathers(NEED + 3),
      cats: spawnCats(),
      crates: spawnCrates(),
      buildings: makeBuildings(),
      coins: 0,
      roar: 0,
      roarCd: 0,
      shock: [],
      sparkles: [],
      done: false,
      nest: { x: W - 90, y: 90, glow: 0 },
    };
    playing = true;
    hud.hidden = false;
    win.hidden = true;
    menu.hidden = true;
    hudCoins.textContent = "🪶 0 / " + NEED;
    say("Crow's Roar · лети на крыши. E — рык!", 3.2);
    if ("ontouchstart" in window) touch.hidden = false;
  }

  function finishWin() {
    g.done = true;
    playing = false;
    hud.hidden = true;
    win.hidden = false;
    winText.textContent = "Ты собрал перья и долетел до гнезда. Это твоя первая игра Crow's Roar.";
    winCode.textContent = "CROW · ROAR · #" + (1 + Math.floor(Math.random() * 9));
  }

  function tryRoar() {
    if (!playing || g.done || g.roarCd > 0) return;
    g.roar = 0.55;
    g.roarCd = 0.85;
    g.shock.push({ r: 18, life: 0.55 });
    say("КААА!", 0.8);

    for (const cat of g.cats) {
      const d = Math.hypot(cat.x - g.crow.x, cat.y - g.crow.y);
      if (d < 130) {
        cat.scared = 1.4;
        const ang = Math.atan2(cat.y - g.crow.y, cat.x - g.crow.x);
        cat.vx = Math.cos(ang) * 220;
        cat.vy = Math.sin(ang) * 220;
      }
    }

    for (const crate of g.crates) {
      if (crate.open) continue;
      const d = Math.hypot(crate.x - g.crow.x, crate.y - g.crow.y);
      if (d < 95) {
        crate.open = true;
        for (let i = 0; i < 4; i++) {
          g.sparkles.push({
            x: crate.x,
            y: crate.y,
            vx: rand(-120, 120),
            vy: rand(-140, -40),
            life: rand(0.5, 1),
          });
        }
        const free = g.feathers.find((f) => !f.taken);
        if (free) {
          free.x = crate.x + rand(-20, 20);
          free.y = crate.y - 30;
        }
      }
    }
  }

  function inputDir() {
    let dx = 0;
    let dy = 0;
    if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
    if (keys.ArrowRight || keys.d || keys.D) dx += 1;
    if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
    if (keys.ArrowDown || keys.s || keys.S) dy += 1;
    if (stick.active) {
      dx = stick.x;
      dy = stick.y;
    }
    const len = Math.hypot(dx, dy) || 1;
    if (dx || dy) return { x: dx / len, y: dy / len };
    return { x: 0, y: 0 };
  }

  function update(dt) {
    if (!playing || g.done) return;
    g.t += dt;
    g.roarCd = Math.max(0, g.roarCd - dt);
    if (g.roar > 0) g.roar -= dt;

    if (wantRoar) {
      tryRoar();
      wantRoar = false;
    }

    const dir = inputDir();
    const spd = 260;
    g.crow.vx += dir.x * spd * dt * 4;
    g.crow.vy += dir.y * spd * dt * 4;
    g.crow.vx *= 0.92;
    g.crow.vy *= 0.92;
    g.crow.x += g.crow.vx * dt;
    g.crow.y += g.crow.vy * dt;
    g.crow.x = clamp(g.crow.x, 40, W - 40);
    g.crow.y = clamp(g.crow.y, 50, H - 50);
    g.crow.flap += dt * (8 + Math.hypot(g.crow.vx, g.crow.vy) * 0.02);
    if (dir.x || dir.y) g.crow.angle = Math.atan2(g.crow.vy, g.crow.vx);

    for (const cat of g.cats) {
      if (cat.scared > 0) {
        cat.scared -= dt;
        cat.x += cat.vx * dt;
        cat.y += cat.vy * dt;
        cat.vx *= 0.96;
        cat.vy *= 0.96;
      } else {
        const dx = g.crow.x - cat.x;
        const dy = g.crow.y - cat.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 180) {
          cat.x -= (dx / dist) * 55 * dt;
          cat.y -= (dy / dist) * 55 * dt;
        } else {
          cat.x += cat.vx * dt;
          cat.y += cat.vy * dt;
          if (cat.x < 60 || cat.x > W - 60) cat.vx *= -1;
          if (cat.y < 80 || cat.y > H - 80) cat.vy *= -1;
        }
      }
      cat.x = clamp(cat.x, 50, W - 50);
      cat.y = clamp(cat.y, 70, H - 70);
    }

    for (const f of g.feathers) {
      if (f.taken) continue;
      f.bob += dt * 4;
      const d = Math.hypot(f.x - g.crow.x, f.y - g.crow.y);
      if (d < 34) {
        f.taken = true;
        g.coins++;
        hudCoins.textContent = "🪶 " + g.coins + " / " + NEED;
        say("Перо +" + g.coins, 1.2);
        for (let i = 0; i < 6; i++) {
          g.sparkles.push({
            x: f.x,
            y: f.y,
            vx: rand(-80, 80),
            vy: rand(-100, 20),
            life: rand(0.4, 0.8),
          });
        }
      }
    }

    g.shock = g.shock.filter((s) => {
      s.life -= dt;
      s.r += 280 * dt;
      return s.life > 0;
    });

    g.sparkles = g.sparkles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      return p.life > 0;
    });

    g.nest.glow += dt;

    if (g.coins >= NEED) {
      const d = Math.hypot(g.nest.x - g.crow.x, g.nest.y - g.crow.y);
      if (d < 50) finishWin();
      else if (Math.sin(g.t * 2) > 0.95) say("Все перья! Лети к золотому гнезду.", 2);
    }
  }

  function drawStud(x, y, s, color) {
    ctx.fillStyle = color || "rgba(0,0,0,0.12)";
    ctx.fillRect(x, y, s, s);
  }

  function drawBuilding(b) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x - 4, b.y - 10, b.w + 8, 12);
    const stud = 12;
    for (let yy = b.y + 8; yy < b.y + b.h - 8; yy += stud) {
      for (let xx = b.x + 8; xx < b.x + b.w - 8; xx += stud) {
        drawStud(xx, yy, 4, "rgba(255,255,255,0.08)");
      }
    }
    ctx.fillStyle = "rgba(120,200,255,0.35)";
    ctx.fillRect(b.x + b.w * 0.25, b.y + b.h * 0.35, b.w * 0.2, b.h * 0.25);
    ctx.fillRect(b.x + b.w * 0.55, b.y + b.h * 0.35, b.w * 0.2, b.h * 0.25);
  }

  function drawCrow(p, roaring) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle + Math.PI * 0.5);
    const flap = Math.sin(p.flap) * 6;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1828";
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#101018";
    ctx.beginPath();
    ctx.moveTo(-18 - flap, -4);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-18 + flap, 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18 + flap, -4);
    ctx.lineTo(8, 0);
    ctx.lineTo(18 - flap, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffd040";
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(8, 18);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-5, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-4, -4, 1.2, 0, Math.PI * 2);
    ctx.fill();

    if (roaring) {
      ctx.strokeStyle = "rgba(255,112,64,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 8, 10 + Math.sin(g.t * 30) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCat(c) {
    const sc = c.scared > 0 ? 0.85 + Math.sin(g.t * 20) * 0.08 : 1;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(sc, sc);
    ctx.fillStyle = "#c06040";
    ctx.fillRect(-12, -8, 24, 18);
    ctx.fillStyle = "#ffb080";
    ctx.fillRect(-10, 4, 8, 10);
    ctx.fillRect(2, 4, 8, 10);
    ctx.fillStyle = "#c06040";
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-14, -16);
    ctx.lineTo(-4, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(14, -16);
    ctx.lineTo(4, -8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-6, -4, 4, 4);
    ctx.fillRect(2, -4, 4, 4);
    ctx.restore();
  }

  function drawCrate(c) {
    ctx.fillStyle = c.open ? "#8a6040" : "#a07040";
    ctx.fillRect(c.x - 18, c.y - 14, 36, 28);
    ctx.strokeStyle = "#604020";
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x - 18, c.y - 14, 36, 28);
    if (!c.open) {
      ctx.fillStyle = "#ffd76a";
      ctx.font = "bold 14px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("?", c.x, c.y + 5);
    }
  }

  function drawFeather(f) {
    const bob = Math.sin(f.bob) * 4;
    ctx.save();
    ctx.translate(f.x, f.y + bob);
    ctx.fillStyle = "rgba(255,215,106,0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe080";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(8, 0, 0, 12);
    ctx.quadraticCurveTo(-8, 0, 0, -12);
    ctx.fill();
    ctx.restore();
  }

  function drawNest(n) {
    const pulse = 0.6 + Math.sin(n.glow * 3) * 0.2;
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.fillStyle = `rgba(255, 215, 106, ${0.15 * pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 34 + pulse * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6a5030";
    ctx.beginPath();
    ctx.arc(0, 4, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd76a";
    ctx.font = "bold 16px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏠", 0, 8);
    ctx.restore();
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#78b8f0");
    sky.addColorStop(1, "#4a78a8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#3a9858";
    ctx.fillRect(0, H - 36, W, 36);
    for (let x = 0; x < W; x += 16) drawStud(x + 4, H - 28, 6, "rgba(0,176,111,0.35)");

    if (!g) return;

    for (const b of g.buildings) drawBuilding(b);

    drawNest(g.nest);
    for (const c of g.crates) drawCrate(c);
    for (const f of g.feathers) if (!f.taken) drawFeather(f);
    for (const c of g.cats) drawCat(c);

    for (const s of g.shock) {
      ctx.strokeStyle = `rgba(255, 120, 60, ${s.life * 1.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.crow.x, g.crow.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of g.sparkles) {
      ctx.fillStyle = `rgba(255, 220, 120, ${p.life})`;
      ctx.fillRect(p.x, p.y, 4, 4);
    }

    drawCrow(g.crow, g.roar > 0);

    if (g.coins >= NEED) {
      ctx.fillStyle = "rgba(255,215,106,0.9)";
      ctx.font = "700 14px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("→ к гнезду", g.nest.x, g.nest.y - 44);
    }

    if (g.roarCd > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(W - 120, 14, 100, 8);
      ctx.fillStyle = "#ff7040";
      ctx.fillRect(W - 120, 14, 100 * (1 - g.roarCd / 0.85), 8);
    }
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " " || e.key === "e" || e.key === "E") {
      e.preventDefault();
      wantRoar = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  document.getElementById("btnPlay").onclick = resetGame;
  document.getElementById("btnAgain").onclick = resetGame;
  document.getElementById("btnRoar").onclick = () => {
    wantRoar = true;
  };

  let pid = null;
  pad.addEventListener("pointerdown", (e) => {
    pid = e.pointerId;
    pad.setPointerCapture(pid);
    stick.active = true;
  });
  pad.addEventListener("pointermove", (e) => {
    if (!stick.active || e.pointerId !== pid) return;
    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = 42;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    stick.x = dx / max;
    stick.y = dy / max;
    pad.style.setProperty("--sx", dx + "px");
    pad.style.setProperty("--sy", dy + "px");
  });
  function endStick() {
    stick.active = false;
    stick.x = stick.y = 0;
    pad.style.setProperty("--sx", "0px");
    pad.style.setProperty("--sy", "0px");
    pid = null;
  }
  pad.addEventListener("pointerup", endStick);
  pad.addEventListener("pointercancel", endStick);

  requestAnimationFrame(frame);
})();
