(() => {
  "use strict";

  const UNLOCK_KEY = "amal-joy-surprise-unlock-v1";
  const BEST_KEY = "amal-joy-surprise-best-v1";
  const MIN_WAIT = 3 * 60 * 1000;
  const MAX_WAIT = 45 * 60 * 1000;
  const app = document.getElementById("app");

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
    app.innerHTML =
      '<div class="overlay"><div class="panel"><div class="locked-mark">🎁🔒</div>' +
      "<h1>Сюрприз ещё спит</h1><p>Он сам выбрал момент, когда открыться. Не подглядывай — возвращайся позже.</p>" +
      '<a class="btn" href="../" style="display:inline-block;text-decoration:none">Вернуться к играм</a></div></div>';
    const timer = setInterval(() => {
      if (Date.now() >= unlockAt) {
        clearInterval(timer);
        location.reload();
      }
    }, 15000);
    return;
  }

  app.innerHTML =
    '<canvas id="c"></canvas>' +
    '<div class="hud"><span class="chip" id="score">Сияние: 0</span><span class="chip" id="energy">⚡ 0%</span><span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="powers" id="powers">' +
    '<button type="button" data-power="zap"><b>Q</b> Молния <small>35⚡</small></button>' +
    '<button type="button" data-power="magnet"><b>E</b> Магнит радости <small>45⚡</small></button>' +
    '<button type="button" data-power="rainbow"><b>R</b> Радуга <small>70⚡</small></button>' +
    '<button type="button" data-power="slow"><b>G</b> Замедлить <small>40⚡</small></button>' +
    '<button type="button" data-power="star"><b>T</b> Звездопад <small>55⚡</small></button>' +
    '<button type="button" data-power="nova"><b>␣</b> Нова <small>90⚡</small></button>' +
    '<button type="button" class="mystery" data-power="mystery"><b>F</b> ??? <small>100⚡</small></button>' +
    '<button type="button" class="admin" data-power="admin"><b>H</b> 🤝 Амаль+я <small>120⚡</small></button></div>' +
    '<div class="message" id="message"></div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>🎁 Время пришло</h1>' +
    '<p>Собирай кусочки радости и заряжай необычную катушку Теслы. Каждая её сила меняет игру, а некоторые сюрпризы нигде не написаны.</p>' +
    '<button type="button" class="btn" id="start">ОТКРЫТЬ</button></div></div>' +
    '<div class="overlay hidden" id="ending"><div class="panel"><h1 id="endingTitle"></h1><p id="endingText"></p>' +
    '<button type="button" class="btn" id="again">Ещё одно чудо</button></div></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const energyEl = document.getElementById("energy");
  const bestEl = document.getElementById("best");
  const messageEl = document.getElementById("message");
  let W = 0, H = 0, state = "menu", score = 0, best = 0, found = 0, energy = 0;
  let magnetTime = 0, rainbowTime = 0, magnetTick = 0, surpriseLevel = 0, slowTime = 0;
  let stars = [], gifts = [], particles = [], bolts = [], hue = Math.random() * 360;
  const icons = ["🌟", "🎈", "🦄", "🌈", "🍰", "🎵", "💎", "🪄", "☀️", "🎨", "🚀", "🧸", "💖", "⚡"];
  const words = [
    "Ты нашёл кусочек радуги!",
    "Этот свет выбрал именно тебя.",
    "Секретная радость разблокирована.",
    "Команда друзей прислала тебе силу.",
    "Сегодня игра улыбается тебе.",
    "Внутри оказался маленький праздник!",
    "Найден редкий кристалл хорошего дня.",
  ];

  try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) {}
  bestEl.textContent = "Рекорд: " + best;

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    stars = Array.from({ length: Math.max(40, Math.floor(W * H / 12000)) }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: 0.5 + Math.random() * 2, t: Math.random() * 9,
    }));
  }
  addEventListener("resize", resize);
  resize();

  function say(text) {
    messageEl.textContent = text;
    messageEl.classList.add("show");
    clearTimeout(messageEl._hide);
    messageEl._hide = setTimeout(() => messageEl.classList.remove("show"), 1900);
  }

  function spawnGift() {
    const size = 34 + Math.random() * 24;
    const rare = Math.random() < 0.13;
    gifts.push({
      x: 60 + Math.random() * Math.max(40, W - 120),
      y: 90 + Math.random() * Math.max(40, H - 190),
      size,
      icon: rare ? "💠" : icons[Math.floor(Math.random() * icons.length)],
      rare,
      phase: Math.random() * Math.PI * 2,
      life: 8 + Math.random() * 5,
    });
  }

  function burst(g) {
    const colors = ["#fde68a", "#fb7185", "#67e8f9", "#c4b5fd", "#86efac"];
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 180;
      particles.push({
        x: g.x, y: g.y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 0.7 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  function updateHud() {
    scoreEl.textContent = "Сияние: " + score;
    energyEl.textContent = "⚡ " + Math.floor(energy) + "%";
    energyEl.classList.toggle("full", energy >= 100);
  }

  function lightning(fromX, fromY, toX, toY, color) {
    const points = [{ x: fromX, y: fromY }];
    const steps = 7;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      points.push({
        x: fromX + (toX - fromX) * t + (Math.random() - 0.5) * 28,
        y: fromY + (toY - fromY) * t + (Math.random() - 0.5) * 22,
      });
    }
    points.push({ x: toX, y: toY });
    bolts.push({ points, life: 0.32, color: color || "#67e8f9" });
  }

  function spend(cost) {
    if (state !== "play") return false;
    if (energy < cost) {
      say("Катушке не хватает заряда: нужно " + cost + "⚡");
      return false;
    }
    energy -= cost;
    updateHud();
    return true;
  }

  function usePower(type) {
    if (type === "zap") {
      if (!spend(35)) return;
      const targets = gifts.slice(0, 3);
      if (!targets.length) { energy += 35; updateHud(); return; }
      targets.forEach((g, i) => {
        lightning(W / 2, H - 88, g.x, g.y, i === 2 ? "#f0abfc" : "#67e8f9");
        setTimeout(() => { if (gifts.includes(g)) collect(g); }, i * 110);
      });
      say("⚡ Цепная молния радости!");
    } else if (type === "magnet") {
      if (!spend(45)) return;
      magnetTime = 6;
      magnetTick = 0;
      say("🧲 Катушка притягивает радость!");
    } else if (type === "rainbow") {
      if (!spend(70)) return;
      rainbowTime = 7;
      for (let i = 0; i < 7; i++) spawnGift();
      say("🌈 Радужная гроза началась!");
    } else if (type === "slow") {
      if (!spend(40)) return;
      slowTime = 6;
      say("⏳ Время замедлилось — лови спокойно!");
    } else if (type === "star") {
      if (!spend(55)) return;
      for (let i = 0; i < 10; i++) {
        const g = { x: 40 + Math.random() * Math.max(40, W - 80), y: -20 - Math.random() * 200,
          size: 32 + Math.random() * 26, icon: "⭐", rare: Math.random() < 0.4,
          phase: Math.random() * Math.PI * 2, life: 9, fall: 120 + Math.random() * 120 };
        gifts.push(g);
      }
      say("🌠 Звездопад радости!");
    } else if (type === "nova") {
      if (!spend(90)) return;
      const all = gifts.slice();
      if (!all.length) { energy += 90; updateHud(); return; }
      all.forEach((g, i) => {
        lightning(W / 2, H - 88, g.x, g.y, "#f0abfc");
        setTimeout(() => { if (gifts.includes(g)) collect(g); }, i * 45);
      });
      for (let i = 0; i < 16; i++) burst({ x: Math.random() * W, y: Math.random() * H });
      say("💥 ТЕСЛА-НОВА собрала всё!");
    } else if (type === "admin") {
      if (!spend(120)) return;
      adminMove();
    } else if (type === "mystery") {
      if (!spend(100)) return;
      mysterySurprise();
    }
  }

  function adminMove() {
    rainbowTime = 10;
    magnetTime = 10;
    slowTime = 10;
    score += 200;
    energy = 100;
    for (let i = 0; i < 8; i++) spawnGift();
    for (let i = 0; i < 18; i++) burst({ x: Math.random() * W, y: Math.random() * H });
    say("🤝 Амаль и его правый админ — все силы разом!");
    updateHud();
  }

  function mysterySurprise() {
    const roll = Math.floor(Math.random() * 4);
    if (roll === 0) {
      score += 150;
      for (let i = 0; i < 12; i++) burst({ x: Math.random() * W, y: Math.random() * H });
      say("🎉 Небо устроило праздник!");
    } else if (roll === 1) {
      gifts.forEach((g) => { g.rare = true; g.icon = "💠"; g.size *= 1.25; });
      for (let i = 0; i < 5; i++) spawnGift();
      say("💎 Все подарки стали редкими!");
    } else if (roll === 2) {
      rainbowTime = 12;
      magnetTime = 12;
      say("🦄 Секретный режим: ДВОЙНОЕ ЧУДО!");
    } else {
      hue = Math.random() * 360;
      energy = 100;
      score += 67;
      say("🌀 Катушка вернула заряд и нашла 67 сияния!");
    }
    updateHud();
  }

  function checkHiddenSurprises() {
    const level = found >= 9 ? 3 : found >= 6 ? 2 : found >= 3 ? 1 : 0;
    if (level <= surpriseLevel) return;
    surpriseLevel = level;
    if (level === 1) {
      energy = Math.min(100, energy + 30);
      say("✨ Катушка проснулась и подарила заряд!");
    } else if (level === 2) {
      for (let i = 0; i < 4; i++) spawnGift();
      say("🌠 Открылся тайный дождь радости!");
    } else {
      gifts.push({ x: W / 2, y: H / 2, size: 92, icon: "🎁", rare: true, phase: 0, life: 20 });
      say("👑 Появился королевский подарок!");
    }
    updateHud();
  }

  function start() {
    state = "play";
    score = 0;
    found = 0;
    gifts = [];
    particles = [];
    bolts = [];
    energy = 0;
    magnetTime = 0;
    rainbowTime = 0;
    slowTime = 0;
    surpriseLevel = 0;
    hue = Math.random() * 360;
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("ending").classList.add("hidden");
    for (let i = 0; i < 3; i++) spawnGift();
    say("Первое сияние уже рядом…");
    updateHud();
  }

  function collect(g) {
    gifts = gifts.filter((x) => x !== g);
    found++;
    const gain = (g.rare ? 35 : 10) + found * 3 + Math.floor(Math.random() * 12);
    score += gain;
    energy = Math.min(100, energy + (g.rare ? 30 : 14));
    hue = (hue + 47 + Math.random() * 90) % 360;
    burst(g);
    say(words[Math.floor(Math.random() * words.length)]);
    updateHud();
    checkHiddenSurprises();
    if (score > best) {
      best = score;
      bestEl.textContent = "Рекорд: " + best;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
    }
    if (found >= 12) {
      state = "ending";
      document.getElementById("endingTitle").textContent = icons[Math.floor(Math.random() * icons.length)] + " Сюрприз найден!";
      document.getElementById("endingText").textContent =
        "Ты собрал " + score + " сияния. Игра запомнила этот счастливый результат — в следующий раз чудо будет другим.";
      document.getElementById("ending").classList.remove("hidden");
    } else {
      spawnGift();
      if (Math.random() < 0.45) spawnGift();
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (state !== "play") return;
    let hit = null;
    let bestD = 1e9;
    for (const g of gifts) {
      const d = Math.hypot(e.clientX - g.x, e.clientY - g.y);
      if (d < g.size * 0.75 && d < bestD) { bestD = d; hit = g; }
    }
    if (hit) collect(hit);
  });

  document.getElementById("start").onclick = start;
  document.getElementById("again").onclick = start;
  document.getElementById("powers").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-power]");
    if (btn) usePower(btn.dataset.power);
  });
  addEventListener("keydown", (e) => {
    const key = e.key === " " ? "space" : e.key.toLowerCase();
    const map = { q: "zap", e: "magnet", r: "rainbow", g: "slow", t: "star", space: "nova", f: "mystery", h: "admin" };
    if (map[key]) { e.preventDefault(); usePower(map[key]); }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === "play") {
      if (slowTime > 0) slowTime -= dt;
      const lifeRate = slowTime > 0 ? 0.35 : 1;
      gifts.forEach((g) => {
        g.life -= dt * lifeRate;
        g.phase += dt * 2;
        if (g.fall) g.y += g.fall * dt * (slowTime > 0 ? 0.4 : 1);
      });
      gifts = gifts.filter((g) => {
        if (g.life > 0) return true;
        spawnGift();
        return false;
      });
      particles = particles.filter((p) => {
        p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 50 * dt; p.vx *= 0.985;
        return p.life > 0;
      });
      bolts = bolts.filter((b) => (b.life -= dt) > 0);
      if (magnetTime > 0) {
        magnetTime -= dt;
        magnetTick -= dt;
        if (magnetTick <= 0 && gifts.length) {
          magnetTick = 0.55;
          const g = gifts.reduce((a, b) =>
            Math.hypot(a.x - W / 2, a.y - (H - 88)) < Math.hypot(b.x - W / 2, b.y - (H - 88)) ? a : b);
          lightning(W / 2, H - 88, g.x, g.y, "#fde68a");
          collect(g);
        }
      }
      if (rainbowTime > 0) {
        rainbowTime -= dt;
        hue = (hue + dt * 90) % 360;
      }
    }

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "hsl(" + hue + " 60% 16%)");
    bg.addColorStop(1, "hsl(" + ((hue + 100) % 360) + " 70% 9%)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const alpha = 0.3 + Math.sin(now / 700 + s.t) * 0.25;
      ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const g of gifts) {
      const scale = 1 + Math.sin(g.phase) * 0.12;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.scale(scale, scale);
      ctx.shadowColor = "#fde68a";
      ctx.shadowBlur = 22;
      ctx.font = g.size + "px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(g.icon, 0, 0);
      ctx.restore();
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life * 1.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;

    if (state === "play") {
      const cx = W / 2, cy = H - 70;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = energy >= 100 ? "#f0abfc" : "#67e8f9";
      ctx.shadowBlur = 24 + energy * 0.18;
      ctx.strokeStyle = "#a5f3fc";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(0, 0, 31, 12, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      for (let y = -42; y <= 5; y += 8) {
        ctx.moveTo(-22, y); ctx.bezierCurveTo(-7, y - 7, 7, y + 7, 22, y);
      }
      ctx.strokeStyle = "hsl(" + ((hue + 170) % 360) + " 95% 70%)";
      ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "23px system-ui"; ctx.textAlign = "center"; ctx.fillText("⚡", 0, -55);
      ctx.restore();
    }
    for (const b of bolts) {
      ctx.globalAlpha = Math.min(1, b.life * 5);
      ctx.strokeStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3;
      ctx.beginPath();
      b.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
