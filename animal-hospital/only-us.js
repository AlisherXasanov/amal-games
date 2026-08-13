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
      moving: false,
      trail: [],
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
    const ox = p.x;
    const oy = p.y;
    p.x += (mx / len) * speed * dt;
    p.y += (my / len) * speed * dt;
    p.x = Math.max(60, Math.min(VW - 60, p.x));
    p.y = Math.max(80, Math.min(VH - 50, p.y));
    p.moving = Math.hypot(p.x - ox, p.y - oy) > 0.4;
    if (mx || my) p.bob += dt * 10;
  }

  function emitAura(p, dt) {
    if (!g || !p || !p.skin) return;
    const id = p.skin.id;
    const rate =
      id === "bird" || id === "cloud" || id === "spark" || id === "ghost"
        ? 0.55
        : id === "shark" || id === "dragon"
          ? 0.35
          : 0.28;
    if (Math.random() > rate * (p.moving ? 1.6 : 1)) return;
    const col = p.skin.accent || p.skin.color;
    if (id === "bird") {
      g.particles.push({
        x: p.x + (Math.random() - 0.5) * 18,
        y: p.y - 8 + (Math.random() - 0.5) * 10,
        vx: -40 - Math.random() * 50,
        vy: -20 - Math.random() * 40,
        life: 0.55 + Math.random() * 0.45,
        color: Math.random() < 0.5 ? "#7ed9b8" : "#c8ffe8",
        feather: true,
        rot: Math.random() * Math.PI,
        spin: -2 + Math.random() * 4,
      });
    } else if (id === "rabbit") {
      g.particles.push({
        x: p.x + (Math.random() - 0.5) * 16,
        y: p.y + 8,
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 20,
        life: 0.4,
        color: "#ffe8f0",
        soft: true,
      });
    } else if (id === "shark") {
      g.particles.push({
        x: p.x - 10 + Math.random() * 8,
        y: p.y + (Math.random() - 0.5) * 12,
        vx: -30 - Math.random() * 40,
        vy: (Math.random() - 0.5) * 20,
        life: 0.45,
        color: "rgba(160, 220, 255, 0.7)",
        bubble: true,
      });
    } else if (id === "robot") {
      g.particles.push({
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y - 6,
        vx: (Math.random() - 0.5) * 30,
        vy: -40 - Math.random() * 30,
        life: 0.35,
        color: "#80ffff",
        spark: true,
      });
    } else if (id === "ghost") {
      g.particles.push({
        x: p.x + (Math.random() - 0.5) * 14,
        y: p.y + 10,
        vx: (Math.random() - 0.5) * 15,
        vy: -25 - Math.random() * 25,
        life: 0.7,
        color: "rgba(200, 210, 255, 0.5)",
        soft: true,
      });
    } else if (id === "spark" || id === "star" || id === "gold") {
      g.particles.push({
        x: p.x + (Math.random() - 0.5) * 22,
        y: p.y - 10 + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 40,
        vy: -30 - Math.random() * 50,
        life: 0.4,
        color: col,
        spark: true,
      });
    } else if (id === "dragon") {
      g.particles.push({
        x: p.x + 8,
        y: p.y - 4,
        vx: 20 + Math.random() * 30,
        vy: -10 - Math.random() * 20,
        life: 0.35,
        color: Math.random() < 0.5 ? "#ff8040" : "#ffe080",
        spark: true,
      });
    } else if (id === "cloud" || id === "moon") {
      g.particles.push({
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y - 16,
        vx: (Math.random() - 0.5) * 12,
        vy: -8 - Math.random() * 12,
        life: 0.8,
        color: col,
        soft: true,
      });
    } else {
      g.particles.push({
        x: p.x + (Math.random() - 0.5) * 12,
        y: p.y + 6,
        vx: (Math.random() - 0.5) * 25,
        vy: -15 - Math.random() * 25,
        life: 0.35,
        color: col,
        soft: true,
      });
    }
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
    emitAura(g.you, dt);

    if (mode === "duo" && g.other) {
      const tx = g.you.x - 48;
      const ty = g.you.y + 8;
      const dx = tx - g.other.x;
      const dy = ty - g.other.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) moveEntity(g.other, dx, dy, dt, Math.min(200, 40 + dist * 1.2));
      else g.other.moving = false;
      g.other.bob += dt * 8;
      emitAura(g.other, dt);
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
      g.other.moving = g.you.moving;
      emitAura(g.other, dt);
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
      if (p.spin) p.rot = (p.rot || 0) + p.spin * dt;
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

  function drawAuraRing(p, bounce, rgba, radius) {
    ctx.strokeStyle = rgba;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8 + bounce, radius + Math.sin(g.t * 2.4) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawBodyBird(p, bounce) {
    const flap = Math.sin(g.t * 10 + p.bob) * 10;
    // aura
    ctx.fillStyle = "rgba(126, 217, 184, 0.18)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 6 + bounce, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    drawAuraRing(p, bounce, "rgba(126, 217, 184, 0.55)", 32);
    // wings
    ctx.fillStyle = "#5ec89a";
    ctx.beginPath();
    ctx.ellipse(p.x - 20, p.y - 4 + bounce, 16, 7, -0.5 - flap * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + 20, p.y - 4 + bounce, 16, 7, 0.5 + flap * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // body oval
    ctx.fillStyle = "#7ed9b8";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 2 + bounce, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // belly
    ctx.fillStyle = "#c8ffe8";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 4 + bounce, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.fillStyle = "#9aecc8";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = "#ffb040";
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y - 22 + bounce);
    ctx.lineTo(p.x + 18, p.y - 20 + bounce);
    ctx.lineTo(p.x + 8, p.y - 18 + bounce);
    ctx.fill();
    // eye
    ctx.fillStyle = "#1a2030";
    ctx.beginPath();
    ctx.arc(p.x + 3, p.y - 24 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyRabbit(p, bounce) {
    ctx.fillStyle = "rgba(255, 180, 210, 0.2)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 6 + bounce, 30, 0, Math.PI * 2);
    ctx.fill();
    drawAuraRing(p, bounce, "rgba(255, 160, 200, 0.5)", 30);
    // ears
    ctx.fillStyle = "#ffe8f0";
    ctx.beginPath();
    ctx.ellipse(p.x - 7, p.y - 38 + bounce, 4, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + 7, p.y - 38 + bounce, 4, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff90b8";
    ctx.beginPath();
    ctx.ellipse(p.x - 7, p.y - 38 + bounce, 2, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + 7, p.y - 38 + bounce, 2, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillStyle = "#ffe8f0";
    roundRect(p.x - 12, p.y - 14 + bounce, 24, 30, 10);
    ctx.fill();
    ctx.fillStyle = "#fff5fa";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2 + bounce, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.fillStyle = "#ffe8f0";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2030";
    ctx.beginPath();
    ctx.arc(p.x - 4, p.y - 24 + bounce, 1.8, 0, Math.PI * 2);
    ctx.arc(p.x + 4, p.y - 24 + bounce, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff90b8";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 19 + bounce, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyShark(p, bounce) {
    ctx.fillStyle = "rgba(80, 160, 220, 0.2)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 4 + bounce, 36, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    drawAuraRing(p, bounce, "rgba(120, 200, 255, 0.55)", 34);
    // body
    ctx.fillStyle = "#5a90c8";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 2 + bounce, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // fin top
    ctx.beginPath();
    ctx.moveTo(p.x - 2, p.y - 12 + bounce);
    ctx.lineTo(p.x + 4, p.y - 30 + bounce);
    ctx.lineTo(p.x + 10, p.y - 10 + bounce);
    ctx.fill();
    // tail
    ctx.beginPath();
    ctx.moveTo(p.x - 20, p.y - 2 + bounce);
    ctx.lineTo(p.x - 34, p.y - 14 + bounce);
    ctx.lineTo(p.x - 28, p.y - 2 + bounce);
    ctx.lineTo(p.x - 34, p.y + 10 + bounce);
    ctx.closePath();
    ctx.fill();
    // belly
    ctx.fillStyle = "#c8e8ff";
    ctx.beginPath();
    ctx.ellipse(p.x + 2, p.y + 2 + bounce, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(p.x + 12, p.y - 4 + bounce, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#102030";
    ctx.beginPath();
    ctx.arc(p.x + 13, p.y - 4 + bounce, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyRobot(p, bounce) {
    ctx.fillStyle = "rgba(100, 220, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8 + bounce, 32, 0, Math.PI * 2);
    ctx.fill();
    drawAuraRing(p, bounce, "rgba(100, 255, 255, 0.55)", 30);
    // antenna
    ctx.strokeStyle = "#a0e8f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 34 + bounce);
    ctx.lineTo(p.x, p.y - 44 + bounce);
    ctx.stroke();
    ctx.fillStyle = "#ff6060";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 46 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();
    // head box
    ctx.fillStyle = "#80c0d0";
    roundRect(p.x - 14, p.y - 32 + bounce, 28, 22, 4);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#40ffc0";
    roundRect(p.x - 9, p.y - 26 + bounce, 7, 5, 2);
    ctx.fill();
    roundRect(p.x + 2, p.y - 26 + bounce, 7, 5, 2);
    ctx.fill();
    // body box
    ctx.fillStyle = "#70a8b8";
    roundRect(p.x - 12, p.y - 8 + bounce, 24, 26, 3);
    ctx.fill();
    ctx.fillStyle = "#e0ffff";
    roundRect(p.x - 6, p.y - 2 + bounce, 12, 8, 2);
    ctx.fill();
    // arms
    ctx.fillStyle = "#80c0d0";
    roundRect(p.x - 20, p.y - 4 + bounce, 7, 16, 2);
    ctx.fill();
    roundRect(p.x + 13, p.y - 4 + bounce, 7, 16, 2);
    ctx.fill();
  }

  function drawBodyFox(p, bounce) {
    drawAuraRing(p, bounce, "rgba(255, 150, 60, 0.45)", 28);
    // tail
    ctx.fillStyle = "#ff9a4a";
    ctx.beginPath();
    ctx.ellipse(p.x - 20, p.y + 2 + bounce, 14, 7, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe0a0";
    ctx.beginPath();
    ctx.ellipse(p.x - 28, p.y + bounce, 5, 4, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff9a4a";
    roundRect(p.x - 11, p.y - 14 + bounce, 22, 28, 8);
    ctx.fill();
    // ears
    ctx.beginPath();
    ctx.moveTo(p.x - 10, p.y - 24 + bounce);
    ctx.lineTo(p.x - 4, p.y - 40 + bounce);
    ctx.lineTo(p.x + 2, p.y - 24 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + 10, p.y - 24 + bounce);
    ctx.lineTo(p.x + 4, p.y - 40 + bounce);
    ctx.lineTo(p.x - 2, p.y - 24 + bounce);
    ctx.fill();
    ctx.fillStyle = "#ffe0a0";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2030";
    ctx.beginPath();
    ctx.arc(p.x - 3, p.y - 24 + bounce, 1.6, 0, Math.PI * 2);
    ctx.arc(p.x + 4, p.y - 24 + bounce, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyCat(p, bounce) {
    drawAuraRing(p, bounce, "rgba(255, 215, 106, 0.45)", 28);
    ctx.fillStyle = "#ffd76a";
    roundRect(p.x - 11, p.y - 14 + bounce, 22, 28, 9);
    ctx.fill();
    // ears
    ctx.beginPath();
    ctx.moveTo(p.x - 10, p.y - 22 + bounce);
    ctx.lineTo(p.x - 6, p.y - 38 + bounce);
    ctx.lineTo(p.x, p.y - 22 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + 10, p.y - 22 + bounce);
    ctx.lineTo(p.x + 6, p.y - 38 + bounce);
    ctx.lineTo(p.x, p.y - 22 + bounce);
    ctx.fill();
    // tail curl
    ctx.strokeStyle = "#ffd76a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(p.x + 16, p.y + 2 + bounce, 10, -0.4, 1.8);
    ctx.stroke();
    ctx.fillStyle = "#fff0c0";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2030";
    ctx.beginPath();
    ctx.arc(p.x - 3, p.y - 24 + bounce, 1.7, 0, Math.PI * 2);
    ctx.arc(p.x + 4, p.y - 24 + bounce, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyBear(p, bounce) {
    drawAuraRing(p, bounce, "rgba(200, 140, 80, 0.4)", 30);
    ctx.fillStyle = "#c88850";
    roundRect(p.x - 14, p.y - 14 + bounce, 28, 32, 10);
    ctx.fill();
    // ears circles
    ctx.beginPath();
    ctx.arc(p.x - 12, p.y - 28 + bounce, 6, 0, Math.PI * 2);
    ctx.arc(p.x + 12, p.y - 28 + bounce, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe0c0";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 20 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c88850";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 16 + bounce, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyPanda(p, bounce) {
    drawAuraRing(p, bounce, "rgba(240, 240, 255, 0.4)", 28);
    ctx.fillStyle = "#f0f0f0";
    roundRect(p.x - 12, p.y - 14 + bounce, 24, 30, 9);
    ctx.fill();
    ctx.fillStyle = "#303038";
    ctx.beginPath();
    ctx.arc(p.x - 11, p.y - 28 + bounce, 6, 0, Math.PI * 2);
    ctx.arc(p.x + 11, p.y - 28 + bounce, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f8f8f8";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#303038";
    ctx.beginPath();
    ctx.ellipse(p.x - 5, p.y - 24 + bounce, 4, 5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(p.x + 5, p.y - 24 + bounce, 4, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyWolf(p, bounce) {
    drawAuraRing(p, bounce, "rgba(160, 180, 220, 0.45)", 28);
    ctx.fillStyle = "#9aa8c0";
    roundRect(p.x - 12, p.y - 14 + bounce, 24, 30, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x - 10, p.y - 24 + bounce);
    ctx.lineTo(p.x - 4, p.y - 40 + bounce);
    ctx.lineTo(p.x + 2, p.y - 24 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + 10, p.y - 24 + bounce);
    ctx.lineTo(p.x + 4, p.y - 40 + bounce);
    ctx.lineTo(p.x - 2, p.y - 24 + bounce);
    ctx.fill();
    ctx.fillStyle = "#e8eef8";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
    // snout
    ctx.fillStyle = "#c8d0e0";
    ctx.beginPath();
    ctx.ellipse(p.x + 6, p.y - 18 + bounce, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyDeer(p, bounce) {
    drawAuraRing(p, bounce, "rgba(210, 170, 110, 0.4)", 28);
    // antlers
    ctx.strokeStyle = "#a07040";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x - 4, p.y - 28 + bounce);
    ctx.lineTo(p.x - 14, p.y - 44 + bounce);
    ctx.moveTo(p.x - 10, p.y - 38 + bounce);
    ctx.lineTo(p.x - 18, p.y - 36 + bounce);
    ctx.moveTo(p.x + 4, p.y - 28 + bounce);
    ctx.lineTo(p.x + 14, p.y - 44 + bounce);
    ctx.moveTo(p.x + 10, p.y - 38 + bounce);
    ctx.lineTo(p.x + 18, p.y - 36 + bounce);
    ctx.stroke();
    ctx.fillStyle = "#d0a070";
    roundRect(p.x - 11, p.y - 14 + bounce, 22, 28, 8);
    ctx.fill();
    ctx.fillStyle = "#ffe8c8";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyFrog(p, bounce) {
    drawAuraRing(p, bounce, "rgba(80, 220, 120, 0.4)", 28);
    ctx.fillStyle = "#5ecf7a";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + bounce, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes bumps
    ctx.beginPath();
    ctx.arc(p.x - 8, p.y - 14 + bounce, 7, 0, Math.PI * 2);
    ctx.arc(p.x + 8, p.y - 14 + bounce, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(p.x - 8, p.y - 14 + bounce, 3.5, 0, Math.PI * 2);
    ctx.arc(p.x + 8, p.y - 14 + bounce, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#102010";
    ctx.beginPath();
    ctx.arc(p.x - 7, p.y - 14 + bounce, 1.8, 0, Math.PI * 2);
    ctx.arc(p.x + 9, p.y - 14 + bounce, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyMouse(p, bounce) {
    drawAuraRing(p, bounce, "rgba(200, 180, 210, 0.4)", 26);
    // ears
    ctx.fillStyle = "#c8c0d0";
    ctx.beginPath();
    ctx.arc(p.x - 12, p.y - 24 + bounce, 8, 0, Math.PI * 2);
    ctx.arc(p.x + 12, p.y - 24 + bounce, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff0f8";
    ctx.beginPath();
    ctx.arc(p.x - 12, p.y - 24 + bounce, 4, 0, Math.PI * 2);
    ctx.arc(p.x + 12, p.y - 24 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c8c0d0";
    roundRect(p.x - 10, p.y - 12 + bounce, 20, 24, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y - 20 + bounce, 9, 0, Math.PI * 2);
    ctx.fill();
    // tail
    ctx.strokeStyle = "#c8c0d0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y + 10 + bounce);
    ctx.quadraticCurveTo(p.x - 24, p.y + 4 + bounce, p.x - 28, p.y - 6 + bounce);
    ctx.stroke();
  }

  function drawBodyGold(p, bounce) {
    ctx.fillStyle = "rgba(255, 215, 106, 0.22)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8 + bounce, 34 + Math.sin(g.t * 3) * 2, 0, Math.PI * 2);
    ctx.fill();
    drawAuraRing(p, bounce, "rgba(255, 215, 106, 0.7)", 32);
    ctx.fillStyle = "#ffd76a";
    roundRect(p.x - 12, p.y - 18 + bounce, 24, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#fff3b0";
    ctx.fillRect(p.x - 12, p.y - 2 + bounce, 24, 6);
    ctx.fillStyle = "#e8b890";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 26 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyGhost(p, bounce) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(200, 210, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8 + bounce, 32, 0, Math.PI * 2);
    ctx.fill();
    drawAuraRing(p, bounce, "rgba(180, 200, 255, 0.5)", 30);
    ctx.fillStyle = "#d8e0ff";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 14 + bounce, 14, Math.PI, 0);
    ctx.lineTo(p.x + 14, p.y + 12 + bounce);
    ctx.lineTo(p.x + 7, p.y + 6 + bounce);
    ctx.lineTo(p.x, p.y + 14 + bounce);
    ctx.lineTo(p.x - 7, p.y + 6 + bounce);
    ctx.lineTo(p.x - 14, p.y + 12 + bounce);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#405080";
    ctx.beginPath();
    ctx.arc(p.x - 5, p.y - 16 + bounce, 2.5, 0, Math.PI * 2);
    ctx.arc(p.x + 5, p.y - 16 + bounce, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawBodyStar(p, bounce) {
    drawAuraRing(p, bounce, "rgba(255, 230, 120, 0.65)", 34);
    ctx.fillStyle = "#ffe08a";
    const r = 18 + Math.sin(g.t * 4) * 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const a2 = a + Math.PI / 5;
      const ox = p.x;
      const oy = p.y - 6 + bounce;
      if (i === 0) ctx.moveTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
      else ctx.lineTo(ox + Math.cos(a) * r, oy + Math.sin(a) * r);
      ctx.lineTo(ox + Math.cos(a2) * r * 0.45, oy + Math.sin(a2) * r * 0.45);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawBodyCloud(p, bounce) {
    drawAuraRing(p, bounce, "rgba(200, 220, 255, 0.45)", 32);
    ctx.fillStyle = "#e8f0ff";
    ctx.beginPath();
    ctx.arc(p.x - 10, p.y - 4 + bounce, 12, 0, Math.PI * 2);
    ctx.arc(p.x + 10, p.y - 2 + bounce, 13, 0, Math.PI * 2);
    ctx.arc(p.x, p.y - 12 + bounce, 14, 0, Math.PI * 2);
    ctx.arc(p.x + 2, p.y + 4 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyDragon(p, bounce) {
    drawAuraRing(p, bounce, "rgba(80, 220, 120, 0.45)", 32);
    // wings
    ctx.fillStyle = "#50a060";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 6 + bounce);
    ctx.lineTo(p.x - 28, p.y - 20 + bounce);
    ctx.lineTo(p.x - 10, p.y + 2 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 6 + bounce);
    ctx.lineTo(p.x + 28, p.y - 20 + bounce);
    ctx.lineTo(p.x + 10, p.y + 2 + bounce);
    ctx.fill();
    ctx.fillStyle = "#70c080";
    roundRect(p.x - 12, p.y - 14 + bounce, 24, 28, 8);
    ctx.fill();
    // horns
    ctx.fillStyle = "#ffe080";
    ctx.beginPath();
    ctx.moveTo(p.x - 6, p.y - 24 + bounce);
    ctx.lineTo(p.x - 10, p.y - 40 + bounce);
    ctx.lineTo(p.x - 2, p.y - 26 + bounce);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + 6, p.y - 24 + bounce);
    ctx.lineTo(p.x + 10, p.y - 40 + bounce);
    ctx.lineTo(p.x + 2, p.y - 26 + bounce);
    ctx.fill();
    ctx.fillStyle = "#c0ffd0";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyOwl(p, bounce) {
    drawAuraRing(p, bounce, "rgba(180, 140, 60, 0.4)", 28);
    ctx.fillStyle = "#8a7040";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 2 + bounce, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // wings
    ctx.beginPath();
    ctx.ellipse(p.x - 16, p.y + bounce, 8, 14, 0.3, 0, Math.PI * 2);
    ctx.ellipse(p.x + 16, p.y + bounce, 8, 14, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe8b0";
    ctx.beginPath();
    ctx.arc(p.x - 5, p.y - 18 + bounce, 6, 0, Math.PI * 2);
    ctx.arc(p.x + 5, p.y - 18 + bounce, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#102010";
    ctx.beginPath();
    ctx.arc(p.x - 5, p.y - 18 + bounce, 2.5, 0, Math.PI * 2);
    ctx.arc(p.x + 5, p.y - 18 + bounce, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb040";
    ctx.beginPath();
    ctx.moveTo(p.x - 3, p.y - 10 + bounce);
    ctx.lineTo(p.x, p.y - 4 + bounce);
    ctx.lineTo(p.x + 3, p.y - 10 + bounce);
    ctx.fill();
  }

  function drawBodySpark(p, bounce) {
    drawAuraRing(p, bounce, "rgba(255, 160, 40, 0.7)", 34);
    ctx.fillStyle = "rgba(255, 180, 60, 0.25)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8 + bounce, 28 + Math.sin(g.t * 6) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb040";
    roundRect(p.x - 11, p.y - 16 + bounce, 22, 30, 8);
    ctx.fill();
    ctx.fillStyle = "#ffe080";
    ctx.fillRect(p.x - 11, p.y - 2 + bounce, 22, 5);
    ctx.beginPath();
    ctx.arc(p.x, p.y - 24 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyMoon(p, bounce) {
    drawAuraRing(p, bounce, "rgba(160, 180, 255, 0.55)", 32);
    ctx.fillStyle = "#c8d0ff";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 6 + bounce, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0c101c";
    ctx.beginPath();
    ctx.arc(p.x + 8, p.y - 10 + bounce, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyAuto(p, bounce) {
    ctx.fillStyle = "rgba(126, 200, 255, 0.22)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8 + bounce, 32 + Math.sin(g.t * 2) * 2, 0, Math.PI * 2);
    ctx.fill();
    drawAuraRing(p, bounce, "rgba(126, 200, 255, 0.7)", 30);
    ctx.fillStyle = "#7ec8ff";
    roundRect(p.x - 12, p.y - 18 + bounce, 24, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#d0f0ff";
    ctx.fillRect(p.x - 12, p.y - 2 + bounce, 24, 6);
    ctx.fillStyle = "#e8b890";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 26 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();
    // heart accent
    ctx.fillStyle = "#ff90b8";
    ctx.beginPath();
    ctx.arc(p.x - 3, p.y - 2 + bounce, 3, 0, Math.PI * 2);
    ctx.arc(p.x + 3, p.y - 2 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBodyHeart(p, bounce) {
    drawAuraRing(p, bounce, "rgba(255, 120, 180, 0.55)", 30);
    ctx.fillStyle = "#ff90b8";
    const ox = p.x;
    const oy = p.y - 4 + bounce;
    ctx.beginPath();
    ctx.moveTo(ox, oy + 12);
    ctx.bezierCurveTo(ox, oy + 4, ox - 18, oy - 2, ox - 18, oy - 10);
    ctx.bezierCurveTo(ox - 18, oy - 20, ox, oy - 18, ox, oy - 8);
    ctx.bezierCurveTo(ox, oy - 18, ox + 18, oy - 20, ox + 18, oy - 10);
    ctx.bezierCurveTo(ox + 18, oy - 2, ox, oy + 4, ox, oy + 12);
    ctx.fill();
  }

  const BODY_DRAW = {
    bird: drawBodyBird,
    rabbit: drawBodyRabbit,
    shark: drawBodyShark,
    robot: drawBodyRobot,
    fox: drawBodyFox,
    cat: drawBodyCat,
    bear: drawBodyBear,
    panda: drawBodyPanda,
    wolf: drawBodyWolf,
    deer: drawBodyDeer,
    frog: drawBodyFrog,
    mouse: drawBodyMouse,
    gold: drawBodyGold,
    ghost: drawBodyGhost,
    star: drawBodyStar,
    cloud: drawBodyCloud,
    dragon: drawBodyDragon,
    owl: drawBodyOwl,
    spark: drawBodySpark,
    moon: drawBodyMoon,
    auto: drawBodyAuto,
    heart: drawBodyHeart,
  };

  function drawActor(p) {
    const bounce = Math.sin(p.bob) * 2;
    const skin = p.skin;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (p.tag === "mirror") ctx.globalAlpha = 0.82;

    const drawer = BODY_DRAW[skin.id];
    if (drawer) drawer(p, bounce);
    else drawBodyGold(p, bounce);

    ctx.fillStyle = "#fff";
    ctx.font = "800 11px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.name + " · " + skin.name, p.x, p.y - 52 + bounce);
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
      if (p.feather) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.bubble) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + (1 - p.life) * 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.soft) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.spark) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
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
