(() => {
  "use strict";

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const VW = 960;
  const VH = 560;
  const NEED = 7;

  const menu = document.getElementById("menu");
  const win = document.getElementById("win");
  const hud = document.getElementById("hud");
  const bubble = document.getElementById("bubble");
  const modeLabel = document.getElementById("modeLabel");
  const starCount = document.getElementById("starCount");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");
  const touch = document.getElementById("touch");

  const keys = Object.create(null);
  const stick = { x: 0, y: 0, active: false };
  let wantAct = false;
  let mode = "duo";
  let g = null;
  let last = performance.now();
  let bubbleT = 0;

  const SAY = {
    duo: [
      "Я рядом. Не торопись.",
      "Вон та звезда — давай вместе.",
      "Только ты и я. Тихо, правда?",
      "Если заблудишься — я тут.",
      "Ещё чуть-чуть. Мы почти.",
    ],
    solo: [
      "Тишина. Только ты.",
      "Комната слушает.",
      "Звёзды ждут.",
    ],
    mirror: [
      "Второе «ты» повторяет.",
      "Зеркало не врёт.",
      "Два шага — один путь.",
    ],
  };

  function say(text, sec) {
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleT = sec || 3.2;
  }

  function makePlayer(x, y, color, name, tag) {
    return { x, y, color, name, tag, bob: 0 };
  }

  function placeStars() {
    const spots = [
      [180, 160], [480, 120], [780, 170],
      [220, 380], [500, 320], [740, 400],
      [480, 460],
    ];
    return spots.map(([x, y], i) => ({
      x, y, id: i, taken: false, pulse: Math.random() * Math.PI * 2,
    }));
  }

  function start(m) {
    mode = m;
    g = {
      t: 0,
      stars: placeStars(),
      got: 0,
      you: makePlayer(420, 300, "#ffd76a", "Ты", "you"),
      other: null,
      particles: [],
      done: false,
      sayCd: 4,
    };
    if (mode === "duo") {
      g.other = makePlayer(520, 310, "#7ec8ff", "Я", "me");
      modeLabel.textContent = "✦ Только ты и я";
      say("Привет. Я рядом — только мы.", 3.5);
    } else if (mode === "mirror") {
      g.other = makePlayer(540, 300, "#ffe08a", "Ты²", "mirror");
      modeLabel.textContent = "✦ Только ты и ты";
      say("Зеркало включено. Ходи — второе «ты» за тобой.", 3.5);
    } else {
      modeLabel.textContent = "✦ Только ты";
      say("Тихо. Только ты.", 2.8);
    }
    starCount.textContent = "★ 0 / " + NEED;
    menu.hidden = true;
    win.hidden = true;
    hud.hidden = false;
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) {
      touch.hidden = false;
    }
  }

  function finish() {
    if (!g || g.done) return;
    g.done = true;
    const code = "U" + String(((Date.now() / 1000) | 0) % 10000).padStart(4, "0");
    winCode.textContent = code;
    if (mode === "duo") winText.textContent = "Только ты и я. Все звёзды — наши.";
    else if (mode === "mirror") winText.textContent = "Только ты и ты. Зеркало довольно.";
    else winText.textContent = "Только ты. И этого хватило.";
    win.hidden = false;
    say(mode === "duo" ? "Мы здесь." : "Готово.", 2.5);
  }

  function moveEntity(p, mx, my, dt, speed) {
    const len = Math.hypot(mx, my) || 1;
    p.x += (mx / len) * speed * dt;
    p.y += (my / len) * speed * dt;
    p.x = Math.max(60, Math.min(VW - 60, p.x));
    p.y = Math.max(80, Math.min(VH - 50, p.y));
    if (mx || my) p.bob += dt * 10;
  }

  function tryAct() {
    if (!g || g.done) return;
    let nearest = null;
    let best = 52;
    for (const s of g.stars) {
      if (s.taken) continue;
      const d = Math.hypot(g.you.x - s.x, g.you.y - s.y);
      if (d < best) {
        best = d;
        nearest = s;
      }
    }
    if (!nearest) {
      say("Здесь пусто. Ищи дальше.", 2);
      return;
    }
    if (mode === "duo" && g.other) {
      const d2 = Math.hypot(g.other.x - nearest.x, g.other.y - nearest.y);
      if (d2 > 70) {
        say("Подойди ближе… и я тоже. Вместе.", 2.6);
        return;
      }
    }
    nearest.taken = true;
    g.got += 1;
    starCount.textContent = "★ " + g.got + " / " + NEED;
    for (let i = 0; i < 14; i++) {
      g.particles.push({
        x: nearest.x,
        y: nearest.y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        life: 0.5 + Math.random() * 0.4,
        color: mode === "duo" ? (i % 2 ? "#7ec8ff" : "#ffd76a") : "#ffe08a",
      });
    }
    const lines = SAY[mode] || SAY.solo;
    say(lines[(Math.random() * lines.length) | 0], 2.8);
    if (g.got >= NEED) finish();
  }

  function update(dt) {
    if (!g || g.done) {
      if (bubbleT > 0) {
        bubbleT -= dt;
        if (bubbleT <= 0) bubble.hidden = true;
      }
      return;
    }
    g.t += dt;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }

    let mx = 0;
    let my = 0;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (stick.active) {
      mx += stick.x;
      my += stick.y;
    }
    moveEntity(g.you, mx, my, dt, 210);

    if (mode === "duo" && g.other) {
      const tx = g.you.x - 48;
      const ty = g.you.y + 8;
      const dx = tx - g.other.x;
      const dy = ty - g.other.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        moveEntity(g.other, dx, dy, dt, Math.min(200, 40 + dist * 1.2));
      }
      g.other.bob += dt * 8;
      g.sayCd -= dt;
      if (g.sayCd <= 0 && Math.random() < 0.01) {
        say(SAY.duo[(Math.random() * SAY.duo.length) | 0], 2.4);
        g.sayCd = 6 + Math.random() * 5;
      }
    } else if (mode === "mirror" && g.other) {
      const tx = VW - g.you.x;
      const ty = g.you.y;
      g.other.x += (tx - g.other.x) * Math.min(1, dt * 8);
      g.other.y += (ty - g.other.y) * Math.min(1, dt * 8);
      g.other.bob = g.you.bob;
    }

    if (wantAct) {
      wantAct = false;
      tryAct();
    }

    for (const s of g.stars) s.pulse += dt * 3;
    for (const p of g.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    g.particles = g.particles.filter((p) => p.life > 0);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawActor(p) {
    const bounce = Math.sin(p.bob) * 2;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.color;
    roundRect(p.x - 12, p.y - 20 + bounce, 24, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#e8b890";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 26 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();
    if (p.tag === "me") {
      ctx.strokeStyle = "rgba(126, 200, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8 + bounce, 28 + Math.sin(g.t * 2) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.tag === "mirror") {
      ctx.globalAlpha = 0.85;
    }
    ctx.fillStyle = "#fff";
    ctx.font = "800 12px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.name, p.x, p.y - 44 + bounce);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, VW, VH);
    const grd = ctx.createLinearGradient(0, 0, 0, VH);
    grd.addColorStop(0, "#1a2440");
    grd.addColorStop(1, "#0c101c");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);

    // floor
    ctx.fillStyle = "#182030";
    roundRect(50, 70, VW - 100, VH - 110, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(126, 200, 255, 0.2)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // soft lights
    for (let i = 0; i < 18; i++) {
      const x = 80 + ((i * 97 + (g ? g.t * 8 : 0)) % (VW - 160));
      const y = 90 + ((i * 53) % (VH - 140));
      ctx.fillStyle = `rgba(255,255,255,${0.05 + (i % 3) * 0.03})`;
      ctx.fillRect(x, y, 2, 2);
    }

    if (!g) return;

    for (const s of g.stars) {
      if (s.taken) continue;
      const r = 7 + Math.sin(s.pulse) * 2;
      ctx.fillStyle = "rgba(255, 215, 106, 0.25)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, r + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - r);
      ctx.lineTo(s.x + r * 0.35, s.y - r * 0.2);
      ctx.lineTo(s.x + r, s.y);
      ctx.lineTo(s.x + r * 0.35, s.y + r * 0.2);
      ctx.lineTo(s.x, s.y + r);
      ctx.lineTo(s.x - r * 0.35, s.y + r * 0.2);
      ctx.lineTo(s.x - r, s.y);
      ctx.lineTo(s.x - r * 0.35, s.y - r * 0.2);
      ctx.closePath();
      ctx.fill();
    }

    for (const p of g.particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (g.other) drawActor(g.other);
    drawActor(g.you);

    // near hint
    for (const s of g.stars) {
      if (s.taken) continue;
      if (Math.hypot(g.you.x - s.x, g.you.y - s.y) < 52) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "700 12px Nunito";
        ctx.textAlign = "center";
        ctx.fillText("E", s.x, s.y - 22);
        ctx.textAlign = "left";
      }
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE" || e.code === "Space") {
      e.preventDefault();
      wantAct = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  document.querySelectorAll(".mode").forEach((btn) => {
    btn.addEventListener("click", () => start(btn.getAttribute("data-mode")));
  });
  document.getElementById("btnAgain").addEventListener("click", () => {
    win.hidden = true;
    menu.hidden = false;
    hud.hidden = true;
    touch.hidden = true;
    g = null;
  });

  // touch pad
  const pad = document.getElementById("pad");
  const btnE = document.getElementById("btnE");
  function padAt(clientX, clientY) {
    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let x = (clientX - cx) / (r.width / 2);
    let y = (clientY - cy) / (r.height / 2);
    const len = Math.hypot(x, y) || 1;
    if (len > 1) {
      x /= len;
      y /= len;
    }
    stick.x = x;
    stick.y = y;
    stick.active = true;
  }
  pad.addEventListener("pointerdown", (e) => {
    pad.setPointerCapture(e.pointerId);
    padAt(e.clientX, e.clientY);
  });
  pad.addEventListener("pointermove", (e) => {
    if (!stick.active) return;
    padAt(e.clientX, e.clientY);
  });
  pad.addEventListener("pointerup", () => {
    stick.active = false;
    stick.x = 0;
    stick.y = 0;
  });
  btnE.addEventListener("click", () => {
    wantAct = true;
  });

  requestAnimationFrame(frame);
})();
