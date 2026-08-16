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
    '<div class="hud"><span class="chip" id="score">Сияние: 0</span><span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="message" id="message"></div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>🎁 Время пришло</h1>' +
    '<p>Лови всё, что начинает сиять. Каждый найденный подарок меняет игру. Здесь нет проигрыша — только открытия.</p>' +
    '<button type="button" class="btn" id="start">ОТКРЫТЬ</button></div></div>' +
    '<div class="overlay hidden" id="ending"><div class="panel"><h1 id="endingTitle"></h1><p id="endingText"></p>' +
    '<button type="button" class="btn" id="again">Ещё одно чудо</button></div></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const messageEl = document.getElementById("message");
  let W = 0, H = 0, state = "menu", score = 0, best = 0, found = 0;
  let stars = [], gifts = [], particles = [], hue = Math.random() * 360;
  const icons = ["🌟", "🎈", "🦄", "🌈", "🍰", "🎵", "💎", "🪄", "☀️", "🎨", "🚀", "🧸"];
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
    gifts.push({
      x: 60 + Math.random() * Math.max(40, W - 120),
      y: 90 + Math.random() * Math.max(40, H - 190),
      size,
      icon: icons[Math.floor(Math.random() * icons.length)],
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

  function start() {
    state = "play";
    score = 0;
    found = 0;
    gifts = [];
    particles = [];
    hue = Math.random() * 360;
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("ending").classList.add("hidden");
    for (let i = 0; i < 3; i++) spawnGift();
    say("Первое сияние уже рядом…");
  }

  function collect(g) {
    gifts = gifts.filter((x) => x !== g);
    found++;
    const gain = 10 + found * 3 + Math.floor(Math.random() * 12);
    score += gain;
    hue = (hue + 47 + Math.random() * 90) % 360;
    burst(g);
    say(words[Math.floor(Math.random() * words.length)]);
    scoreEl.textContent = "Сияние: " + score;
    if (score > best) {
      best = score;
      bestEl.textContent = "Рекорд: " + best;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
    }
    if (found >= 9) {
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

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === "play") {
      gifts.forEach((g) => { g.life -= dt; g.phase += dt * 2; });
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
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
