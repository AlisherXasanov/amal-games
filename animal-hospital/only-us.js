(() => {
  "use strict";

  const SAVE = "only-us-skins-v1";
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
  const skinPreview = document.getElementById("skinPreview");

  /** Скины «Ты» — как в кино */
  const YOU_SKINS = [
    { id: "rabbit", name: "Кролик", icon: "🐰", color: "#ffe8f0", accent: "#ff90b8" },
    { id: "fox", name: "Лиса", icon: "🦊", color: "#ff9a4a", accent: "#ffe0a0" },
    { id: "cat", name: "Кот", icon: "🐱", color: "#ffd76a", accent: "#fff0c0" },
    { id: "bear", name: "Медведь", icon: "🐻", color: "#c88850", accent: "#ffe0c0" },
    { id: "bird", name: "Птица", icon: "🐦", color: "#7ed9b8", accent: "#c8ffe8" },
    { id: "panda", name: "Панда", icon: "🐼", color: "#f0f0f0", accent: "#303038" },
    { id: "wolf", name: "Волк", icon: "🐺", color: "#9aa8c0", accent: "#e8eef8" },
    { id: "deer", name: "Олень", icon: "🦌", color: "#d0a070", accent: "#ffe8c8" },
    { id: "frog", name: "Лягушка", icon: "🐸", color: "#5ecf7a", accent: "#c8ffd0" },
    { id: "mouse", name: "Мышь", icon: "🐭", color: "#c8c0d0", accent: "#fff0f8" },
    { id: "gold", name: "Золото", icon: "✦", color: "#ffd76a", accent: "#fff3b0" },
  ];

  /** Скины «Я» — чтобы помнить */
  const ME_SKINS = [
    { id: "shark", name: "Акула", icon: "🦈", color: "#5a90c8", accent: "#c8e8ff" },
    { id: "robot", name: "Робот", icon: "🤖", color: "#80c0d0", accent: "#e0ffff" },
    { id: "ghost", name: "Призрак", icon: "👻", color: "#d8e0ff", accent: "#a8c0ff" },
    { id: "star", name: "Звезда", icon: "⭐", color: "#ffe08a", accent: "#fff8d0" },
    { id: "cloud", name: "Облако", icon: "☁️", color: "#e8f0ff", accent: "#a8c8ff" },
    { id: "dragon", name: "Дракон", icon: "🐉", color: "#70c080", accent: "#c0ffd0" },
    { id: "owl", name: "Сова", icon: "🦉", color: "#8a7040", accent: "#ffe8b0" },
    { id: "spark", name: "Искра", icon: "✨", color: "#ffb040", accent: "#ffe080" },
    { id: "moon", name: "Луна", icon: "🌙", color: "#c8d0ff", accent: "#8090ff" },
    { id: "auto", name: "Auto", icon: "💙", color: "#7ec8ff", accent: "#d0f0ff" },
    { id: "heart", name: "Сердце", icon: "💗", color: "#ff90b8", accent: "#ffe0f0" },
  ];

  const keys = Object.create(null);
  const stick = { x: 0, y: 0, active: false };
  let wantAct = false;
  let mode = "duo";
  let g = null;
  let last = performance.now();
  let bubbleT = 0;

  let pickYou = loadSkins().you || "rabbit";
  let pickMe = loadSkins().me || "shark";

  function loadSkins() {
    try {
      return JSON.parse(localStorage.getItem(SAVE) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveSkins() {
    localStorage.setItem(SAVE, JSON.stringify({ you: pickYou, me: pickMe }));
  }

  function skinById(list, id) {
    return list.find((s) => s.id === id) || list[0];
  }

  const SAY = {
    duo: [
      "Я рядом. Не торопись.",
      "Вон та звезда — давай вместе.",
      "Только ты и я. Как в кино.",
      "Если заблудишься — я тут.",
      "Ещё чуть-чуть. Мы почти.",
      "Запомни этот образ. Я — с тобой.",
    ],
    solo: ["Тишина. Только ты.", "Комната слушает.", "Звёзды ждут."],
    mirror: ["Второе «ты» повторяет.", "Зеркало не врёт.", "Два шага — один путь."],
  };

  function say(text, sec) {
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleT = sec || 3.2;
  }

  function makePlayer(x, y, skin, name, tag) {
    return {
      x,
      y,
      skin,
      color: skin.color,
      name,
      tag,
      bob: 0,
      icon: skin.icon,
    };
  }

  function placeStars() {
    const spots = [
      [180, 160],
      [480, 120],
      [780, 170],
      [220, 380],
      [500, 320],
      [740, 400],
      [480, 460],
    ];
    return spots.map(([x, y], i) => ({
      x,
      y,
      id: i,
      taken: false,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function renderSkinPickers() {
    const youBox = document.getElementById("youSkins");
    const meBox = document.getElementById("meSkins");
    youBox.innerHTML = "";
    meBox.innerHTML = "";
    YOU_SKINS.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "skin-btn" + (s.id === pickYou ? " on" : "");
      b.innerHTML = `<span>${s.icon}</span>${s.name}`;
      b.addEventListener("click", () => {
        pickYou = s.id;
        saveSkins();
        renderSkinPickers();
      });
      youBox.appendChild(b);
    });
    ME_SKINS.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "skin-btn" + (s.id === pickMe ? " on" : "");
      b.innerHTML = `<span>${s.icon}</span>${s.name}`;
      b.addEventListener("click", () => {
        pickMe = s.id;
        saveSkins();
        renderSkinPickers();
      });
      meBox.appendChild(b);
    });
    const ys = skinById(YOU_SKINS, pickYou);
    const ms = skinById(ME_SKINS, pickMe);
    skinPreview.textContent = `Ты: ${ys.icon} ${ys.name} · Я: ${ms.icon} ${ms.name}`;
  }

  function start(m) {
    mode = m;
    const ys = skinById(YOU_SKINS, pickYou);
    const ms = skinById(ME_SKINS, pickMe);
    g = {
      t: 0,
      stars: placeStars(),
      got: 0,
      you: makePlayer(420, 300, ys, "Ты", "you"),
      other: null,
      particles: [],
      done: false,
      sayCd: 4,
    };
    if (mode === "duo") {
      g.other = makePlayer(520, 310, ms, "Я", "me");
      modeLabel.textContent = `✦ ${ys.icon} ты · ${ms.icon} я`;
      say(`Привет. Ты — ${ys.name}, я — ${ms.name}. Только мы.`, 3.8);
    } else if (mode === "mirror") {
      g.other = makePlayer(540, 300, ys, "Ты²", "mirror");
      modeLabel.textContent = `✦ ${ys.icon} ты и ты`;
      say(`Зеркало: оба — ${ys.name}.`, 3.2);
    } else {
      modeLabel.textContent = `✦ Только ты · ${ys.icon}`;
      say(`Тихо. Только ты — ${ys.name}.`, 2.8);
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
    const ys = g.you.skin.name;
    if (mode === "duo") {
      winText.textContent = `Только ты и я. ${ys} и ${g.other.skin.name}. Все звёзды — наши.`;
    } else if (mode === "mirror") {
      winText.textContent = `Только ты и ты. Два образа: ${ys}.`;
    } else {
      winText.textContent = `Только ты — ${ys}. И этого хватило.`;
    }
    win.hidden = false;
    say(mode === "duo" ? "Запомни нас." : "Готово.", 2.5);
  }

  function moveEntity(p, mx, my, dt, speed) {
    const len = Math.hypot(mx, my) || 1;
    p.x += (mx / len) * speed * dt;
    p.y += (my / len) * speed * dt;
    p.x = Math.max(60, Math.min(VW - 60, p.x));
    p.y = Math.max(80, Math.min(VH - 50, p.y));
    if (mx || my) p.bob += dt * 10;
  }

  function cycleSkin(who, dir) {
    if (!g || g.done) return;
    if (who === "you") {
      const i = YOU_SKINS.findIndex((s) => s.id === g.you.skin.id);
      const next = YOU_SKINS[(i + dir + YOU_SKINS.length) % YOU_SKINS.length];
      pickYou = next.id;
      g.you.skin = next;
      g.you.color = next.color;
      g.you.icon = next.icon;
      if (mode === "mirror" && g.other) {
        g.other.skin = next;
        g.other.color = next.color;
        g.other.icon = next.icon;
      }
      saveSkins();
      say(`Ты теперь: ${next.icon} ${next.name}`, 2);
    } else if (who === "me" && g.other && mode === "duo") {
      const i = ME_SKINS.findIndex((s) => s.id === g.other.skin.id);
      const next = ME_SKINS[(i + dir + ME_SKINS.length) % ME_SKINS.length];
      pickMe = next.id;
      g.other.skin = next;
      g.other.color = next.color;
      g.other.icon = next.icon;
      saveSkins();
      say(`Я теперь: ${next.icon} ${next.name}`, 2);
    }
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
        color: mode === "duo" ? (i % 2 ? g.other.color : g.you.color) : g.you.color,
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
      if (dist > 8) moveEntity(g.other, dx, dy, dt, Math.min(200, 40 + dist * 1.2));
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
    const skin = p.skin;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // glow ring by role
    if (p.tag === "me") {
      ctx.strokeStyle = "rgba(126, 200, 255, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8 + bounce, 30 + Math.sin(g.t * 2) * 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.tag === "you") {
      ctx.strokeStyle = "rgba(255, 215, 106, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8 + bounce, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (p.tag === "mirror") ctx.globalAlpha = 0.82;

    ctx.fillStyle = skin.color;
    roundRect(p.x - 13, p.y - 20 + bounce, 26, 36, 9);
    ctx.fill();
    ctx.fillStyle = skin.accent || "#e8b890";
    ctx.fillRect(p.x - 13, p.y - 2 + bounce, 26, 6);
    ctx.fillStyle = "#e8b890";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 26 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();

    // face icon
    ctx.font = "18px Nunito";
    ctx.textAlign = "center";
    ctx.fillText(skin.icon || "✦", p.x, p.y - 20 + bounce);

    ctx.fillStyle = "#fff";
    ctx.font = "800 12px Nunito, sans-serif";
    ctx.fillText(p.name + " · " + skin.name, p.x, p.y - 48 + bounce);
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

    ctx.fillStyle = "#182030";
    roundRect(50, 70, VW - 100, VH - 110, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(126, 200, 255, 0.2)";
    ctx.lineWidth = 3;
    ctx.stroke();

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
    if (e.code === "BracketLeft") {
      e.preventDefault();
      cycleSkin("you", -1);
    }
    if (e.code === "BracketRight") {
      e.preventDefault();
      cycleSkin("you", 1);
    }
    if (e.code === "Comma") {
      e.preventDefault();
      cycleSkin("me", -1);
    }
    if (e.code === "Period") {
      e.preventDefault();
      cycleSkin("me", 1);
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
    renderSkinPickers();
  });

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

  renderSkinPickers();
  requestAnimationFrame(frame);
})();
