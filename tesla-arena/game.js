(() => {
  "use strict";
  const SAVE = "amal-tesla-arena-progress-v2";
  const OLD_SAVE = "amal-tesla-arena-v1";
  const COILS = [
    { name: "Искра", icon: "🔌", cost: 0, need: 0, damage: 8, range: 155, speed: 6.5, color: "#93c5fd", desc: "Первая учебная катушка" },
    { name: "Сокол", icon: "🦅", cost: 700, need: 1, damage: 12, range: 190, speed: 8, color: "#c4b5fd", desc: "Быстрая летающая катушка" },
    { name: "Гроза", icon: "🌩️", cost: 1800, need: 3, damage: 18, range: 225, speed: 9, color: "#67e8f9", desc: "Цепная молния по роботам" },
    { name: "Титан", icon: "🗿", cost: 4200, need: 6, damage: 27, range: 255, speed: 10, color: "#f0abfc", desc: "Броня и мощный разряд" },
    { name: "Сердце Мира", icon: "🌐", cost: 9000, need: 10, damage: 42, range: 310, speed: 11, color: "#fde68a", desc: "Сильнейшая катушка в мире" },
  ];
  const FRIENDS = [
    { name: "Никита", icon: "🔵", need: 1 },
    { name: "Витана", icon: "🟣", need: 3 },
    { name: "Ушастик", icon: "🐰", need: 6 },
  ];
  const app = document.getElementById("app");
  app.innerHTML =
    '<canvas id="c"></canvas>' +
    '<div class="hud"><span class="chip" id="wave">Волна 1</span><span class="chip" id="score">💰 0</span>' +
    '<span class="chip" id="best">Рекорд: 0</span><span class="chip" id="coilName">🔌 Искра</span></div>' +
    '<div class="gen-wrap"><div class="lbl">🔋 Генератор</div><div class="bar"><i id="genBar"></i></div></div>' +
    '<div class="friends" id="friends">Друзья: пока нет</div>' +
    '<div class="abils">' +
    '<button type="button" class="q ready" data-ab="q">Q 🛡<small>Скин-эффект</small><span class="cd" id="cd-q"></span></button>' +
    '<button type="button" class="e ready" data-ab="e">E 🌀<small>Спиннер</small><span class="cd" id="cd-e"></span></button>' +
    '<button type="button" class="r ready" data-ab="r">R 🧭<small>Компас</small><span class="cd" id="cd-r"></span></button>' +
    '<button type="button" class="f ready" data-ab="f">F 🎵<small>Шок</small><span class="cd" id="cd-f"></span></button>' +
    '<button type="button" class="space ready" data-ab="space">⎵ ⚡<small>Перегруз</small><span class="cd" id="cd-space"></span></button>' +
    '</div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>⚡ Тесла-Арена: Битва за Энергию</h1>' +
    '<p>Чёрные роботы-вирусы хотят украсть всё электричество! Ты — Админ Амаль на летающей катушке «Сокол». Катушка сама бьёт молнией. Защити генератор в центре.</p>' +
    '<div class="keys"><b>Мышь / WASD</b> — лететь<br><b>Q</b> — щит (бессмертие 5с)<br><b>E</b> — плазменный спиннер<br><b>R</b> — неон-компас (батареи сквозь стены)<br><b>F</b> — музыкальный шок (заморозка 7с)<br><b>Пробел</b> — перегруз 100 000 В (−50% боссу)</div><br>' +
    '<button type="button" class="btn" id="btnStart">В МАГАЗИН КАТУШЕК</button></div></div>' +
    '<div class="overlay hidden" id="shop"><div class="panel shop-panel"><h1>⚡ Магазин катушек Теслы</h1>' +
    '<div class="story-box" id="storyText"></div><div class="progress-line"><span id="winsText">Победы: 0</span><span id="creditsText">Энергия: 0</span></div>' +
    '<div class="coil-shop" id="coilShop"></div><button type="button" class="btn" id="btnBattle">НАЧАТЬ ГЛАВУ</button></div></div>' +
    '<div class="overlay hidden" id="end"><div class="panel"><h1 id="endTitle"></h1><p id="endText"></p>' +
    '<button type="button" class="btn" id="btnAgain">В магазин</button></div></div>' +
    '<div class="toast" id="toast"></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  let muted = false, state = "menu", best = 0;
  let progress = { wins: 0, credits: 0, owned: [0], selected: 0 };
  let W = 0, H = 0, cx = 0, cy = 0;
  let coil = null, gen = { hp: 100, max: 100 };
  let enemies = [], batteries = [], bolts = [], particles = [], wave = 0, score = 0, spawnQ = [], spawnT = 0;
  let shieldT = 0, freezeT = 0, compassT = 0, spinnerT = 0;
  let timeStop = false, invincibleAdmin = false;
  const keys = {};
  const mouse = { x: 0, y: 0, active: false };
  const CD = { q: 12, e: 9, r: 14, f: 16, space: 20 };
  const cd = { q: 0, e: 0, r: 0, f: 0, space: 0 };

  try {
    const saved = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (saved && typeof saved === "object") {
      progress.wins = Math.max(0, Number(saved.wins) || 0);
      progress.credits = Math.max(0, Number(saved.credits) || 0);
      progress.owned = Array.isArray(saved.owned) && saved.owned.length ? saved.owned : [0];
      progress.selected = progress.owned.includes(Number(saved.selected)) ? Number(saved.selected) : 0;
      best = Math.max(0, Number(saved.best) || 0);
    } else {
      best = parseInt(localStorage.getItem(OLD_SAVE), 10) || 0;
    }
  } catch (_) {}
  el("best").textContent = "Рекорд: " + best;

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    cx = W / 2; cy = H / 2;
  }
  addEventListener("resize", resize); resize();

  function toast(m) {
    const n = el("toast"); n.textContent = m; n.classList.add("show");
    clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("show"), 1800);
  }
  function beep(f, d, type) {
    if (muted) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || "sine";
      o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(a.destination); o.start();
      setTimeout(() => { o.stop(); a.close(); }, d || 70);
    } catch (_) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({
        wins: progress.wins,
        credits: Math.floor(progress.credits),
        owned: progress.owned,
        selected: progress.selected,
        best,
      }));
    } catch (_) {}
  }

  function activeCoil() {
    return COILS[progress.selected] || COILS[0];
  }

  function friendCount() {
    return FRIENDS.filter((f) => progress.wins >= f.need).length;
  }

  function storyForProgress() {
    if (progress.wins === 0) {
      return "Глава 1. Амаль приходит в магазин без катушки. Первая «Искра» бесплатна: выбери её и защити городской генератор.";
    }
    if (progress.wins < 3) {
      return "После первой победы Амаль встретил друга Никиту. Теперь они вместе защищают энергию города и копят на катушку «Сокол».";
    }
    if (progress.wins < 6) {
      return "К команде присоединилась Витана. Роботы сражаются за главный кристалл энергии — побеждай и покупай «Грозу».";
    }
    if (progress.wins < 10) {
      return "Ушастик нашёл завод древних катушек. Команда идёт за «Титаном», пока вирусы собирают армию.";
    }
    return progress.owned.includes(4)
      ? "Финал. Друзья победили армию вирусов, а Амаль получил «Сердце Мира» — сильнейшую катушку Теслы на планете!"
      : "Финальная глава. Осталась последняя цель: накопить энергию и купить «Сердце Мира», сильнейшую катушку в мире.";
  }

  function renderShop() {
    el("storyText").textContent = storyForProgress();
    el("winsText").textContent = "🏆 Победы: " + progress.wins;
    el("creditsText").textContent = "⚡ Энергия: " + Math.floor(progress.credits);
    el("friends").textContent = friendCount()
      ? "Друзья: " + FRIENDS.filter((f) => progress.wins >= f.need).map((f) => f.icon + " " + f.name).join(" · ")
      : "Друзья: пока нет";
    el("coilShop").innerHTML = COILS.map((c, i) => {
      const owned = progress.owned.includes(i);
      const selected = progress.selected === i;
      const winsOk = progress.wins >= c.need;
      let label = selected ? "Выбрана" : owned ? "Выбрать" : winsOk ? "Купить · " + c.cost : "Нужно побед: " + c.need;
      return '<div class="coil-card ' + (selected ? "selected " : "") + (!winsOk && !owned ? "locked" : "") + '">' +
        '<span class="coil-icon">' + c.icon + '</span><b>' + c.name + '</b>' +
        '<small>' + c.desc + '<br>Урон ' + c.damage + ' · Радиус ' + c.range + '</small>' +
        '<button type="button" data-coil="' + i + '"' + (selected || (!owned && !winsOk) ? " disabled" : "") + ">" + label + "</button></div>";
    }).join("");
    el("coilShop").querySelectorAll("[data-coil]").forEach((button) => {
      button.addEventListener("click", () => {
        const i = Number(button.getAttribute("data-coil"));
        const c = COILS[i];
        if (!c || progress.wins < c.need) return;
        if (!progress.owned.includes(i)) {
          if (progress.credits < c.cost) { toast("Нужно ещё " + (c.cost - progress.credits) + " энергии"); return; }
          progress.credits -= c.cost;
          progress.owned.push(i);
          toast("Куплена катушка «" + c.name + "»!");
        }
        progress.selected = i;
        saveProgress();
        renderShop();
      });
    });
  }

  function showShop() {
    state = "shop";
    el("menu").classList.add("hidden");
    el("end").classList.add("hidden");
    el("shop").classList.remove("hidden");
    renderShop();
  }

  function start() {
    state = "play";
    const model = activeCoil();
    coil = { x: cx - 140, y: cy, r: 20, model, friendT: 0 };
    gen = { hp: 100 + progress.selected * 12, max: 100 + progress.selected * 12 };
    enemies = []; batteries = []; bolts = []; particles = [];
    wave = 0; score = 0;
    shieldT = 0; freezeT = 0; compassT = 0; spinnerT = 0;
    cd.q = cd.e = cd.r = cd.f = cd.space = 0;
    mouse.x = coil.x; mouse.y = coil.y; mouse.active = false;
    el("menu").classList.add("hidden");
    el("shop").classList.add("hidden");
    el("end").classList.add("hidden");
    el("coilName").textContent = model.icon + " " + model.name;
    nextWave();
  }

  function nextWave() {
    wave++;
    const n = 5 + wave * 2;
    spawnQ = [];
    for (let i = 0; i < n; i++) {
      const boss = wave % 4 === 0 && i === n - 1;
      spawnQ.push(boss ? "boss" : (Math.random() < 0.3 ? "fast" : "robot"));
    }
    spawnT = 0.5;
    // hidden batteries revealed by compass
    if (batteries.length < 3) {
      for (let i = 0; i < 2; i++) {
        batteries.push({
          x: 60 + Math.random() * (W - 120),
          y: 90 + Math.random() * (H - 200),
          got: false,
        });
      }
    }
    el("wave").textContent = "Волна " + wave;
    toast(wave % 4 === 0 ? "⚠️ Робот-босс!" : "Волна " + wave);
  }

  function spawnEnemy(kind) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = -30; }
    else if (edge === 1) { x = W + 30; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H + 30; }
    else { x = -30; y = Math.random() * H; }
    const conf = {
      robot: { hp: 20 + wave * 6, spd: 42 + wave * 2, r: 15, icon: "🤖", dmg: 8 },
      fast: { hp: 12 + wave * 4, spd: 78 + wave * 3, r: 12, icon: "👾", dmg: 6 },
      boss: { hp: 260 + wave * 30, spd: 26, r: 34, icon: "🦾", dmg: 25 },
    }[kind];
    enemies.push({ kind, x, y, hp: conf.hp, max: conf.hp, spd: conf.spd, r: conf.r, icon: conf.icon, dmg: conf.dmg, froze: 0 });
  }

  function finishWave() {
    if (state !== "play" || enemies.length || spawnQ.length) return;
    if (wave % 4 !== 0) {
      score += 50;
      setTimeout(() => { if (state === "play") nextWave(); }, 800);
      return;
    }
    state = "chapter-win";
    const reward = 500 + wave * 45 + progress.selected * 80;
    progress.wins++;
    progress.credits += reward + score;
    if (score > best) best = score;
    saveProgress();
    const newFriend = FRIENDS.find((f) => f.need === progress.wins);
    el("best").textContent = "Рекорд: " + best;
    el("endTitle").textContent = progress.wins >= 10 && progress.owned.includes(4)
      ? "🌐 Сильнейшая катушка в мире!"
      : "🏆 Глава выиграна!";
    el("endText").textContent =
      "Команда защитила энергию. Награда: " + (reward + score) + " ⚡." +
      (newFriend ? " К вам присоединился друг: " + newFriend.name + " " + newFriend.icon + "!" : " Теперь можно выбрать или купить более сильную катушку.");
    el("end").classList.remove("hidden");
    beep(920, 250, "triangle");
  }

  function addParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, color });
    }
  }

  function hurtEnemy(e, dmg, color) {
    e.hp -= dmg;
    if (e.hp <= 0) {
      enemies = enemies.filter((x) => x !== e);
      score += e.kind === "boss" ? 500 : e.kind === "fast" ? 30 : 20;
      addParticles(e.x, e.y, color || "#a78bfa", e.kind === "boss" ? 30 : 12);
      beep(e.kind === "boss" ? 200 : 660, 80, "sawtooth");
      if (!enemies.length && !spawnQ.length) finishWave();
    }
  }

  function autoZap(dt) {
    coil._zapT = (coil._zapT || 0) - dt;
    if (coil._zapT > 0) return;
    let target = null, bd = coil.model.range * coil.model.range;
    for (const e of enemies) {
      const d = (e.x - coil.x) ** 2 + (e.y - coil.y) ** 2;
      if (d < bd) { bd = d; target = e; }
    }
    if (target) {
      coil._zapT = Math.max(0.1, 0.27 - progress.selected * 0.035);
      bolts.push({ x1: coil.x, y1: coil.y, x2: target.x, y2: target.y, life: 0.14 });
      hurtEnemy(target, coil.model.damage + wave, coil.model.color);
      if (progress.selected >= 2) {
        const nearby = enemies.find((e) => e !== target && (e.x - target.x) ** 2 + (e.y - target.y) ** 2 < 120 * 120);
        if (nearby) {
          bolts.push({ x1: target.x, y1: target.y, x2: nearby.x, y2: nearby.y, life: 0.11 });
          hurtEnemy(nearby, coil.model.damage * 0.55, coil.model.color);
        }
      }
      beep(880, 30, "square");
    }
  }

  function updateFriends(dt) {
    const count = friendCount();
    if (!count || !enemies.length) return;
    coil.friendT -= dt;
    if (coil.friendT > 0) return;
    coil.friendT = Math.max(0.3, 0.9 - count * 0.12);
    for (let i = 0; i < count; i++) {
      const friend = FRIENDS[i];
      const a = performance.now() / 700 + (i / count) * Math.PI * 2;
      const fx = coil.x + Math.cos(a) * (48 + i * 8);
      const fy = coil.y + Math.sin(a) * (48 + i * 8);
      let target = null, bestD = 260 * 260;
      for (const e of enemies) {
        const d = (e.x - fx) ** 2 + (e.y - fy) ** 2;
        if (d < bestD) { bestD = d; target = e; }
      }
      if (target) {
        bolts.push({ x1: fx, y1: fy, x2: target.x, y2: target.y, life: 0.12 });
        hurtEnemy(target, 4 + i * 2 + progress.selected, "#67e8f9");
      }
    }
  }

  function fire(ab) {
    if (state !== "play" || cd[ab] > 0) return;
    cd[ab] = CD[ab];
    if (ab === "q") { shieldT = 5; toast("🛡 Скин-эффект: бессмертие 5с"); beep(500, 120); }
    if (ab === "e") {
      spinnerT = 1.2;
      enemies.slice().forEach((e) => {
        if ((e.x - coil.x) ** 2 + (e.y - coil.y) ** 2 < 170 * 170) hurtEnemy(e, 40, "#f472b6");
      });
      addParticles(coil.x, coil.y, "#f472b6", 24);
      toast("🌀 Ионный спиннер!"); beep(300, 200, "sawtooth");
    }
    if (ab === "r") { compassT = 3; toast("🧭 Квантовый компас: видно батареи"); beep(700, 120, "triangle"); }
    if (ab === "f") {
      freezeT = 7;
      enemies.forEach((e) => { e.froze = 7; });
      toast("🎵 Музыкальный шок! Роботы застыли 7с"); beep(140, 400, "square");
    }
    if (ab === "space") {
      const boss = enemies.find((e) => e.kind === "boss");
      bolts.push({ x1: cx, y1: -20, x2: cx, y2: H + 20, life: 0.4, big: true });
      enemies.slice().forEach((e) => {
        if (e.kind === "boss") hurtEnemy(e, e.max * 0.5, "#fde68a");
        else hurtEnemy(e, 999, "#fde68a");
      });
      addParticles(cx, cy, "#fde68a", 40);
      toast(boss ? "⚡ ПЕРЕГРУЗ! Боссу −50%" : "⚡ ПЕРЕГРУЗ 100 000 В!");
      beep(90, 500, "sawtooth");
    }
    paintCd();
  }

  function paintCd() {
    ["q", "e", "r", "f", "space"].forEach((ab) => {
      const bar = el("cd-" + ab);
      const pct = Math.max(0, cd[ab] / CD[ab]) * 100;
      bar.style.height = pct + "%";
      const btn = document.querySelector('.abils button[data-ab="' + ab + '"]');
      if (btn) btn.classList.toggle("ready", cd[ab] <= 0);
    });
  }

  function gameOver() {
    state = "end";
    if (score > best) best = score;
    progress.credits += Math.floor(score * 0.25);
    saveProgress();
    el("best").textContent = "Рекорд: " + best;
    el("endTitle").textContent = "🔌 Генератор захвачен";
    el("endText").textContent = "Ты дошёл до волны " + wave + " · счёт " + score;
    el("end").classList.remove("hidden");
    beep(120, 300, "sawtooth");
  }

  function update(dt) {
    if (state !== "play") return;
    if (timeStop) dt *= 0.1;
    // cooldowns / timers
    ["q", "e", "r", "f", "space"].forEach((ab) => { if (cd[ab] > 0) cd[ab] = Math.max(0, cd[ab] - dt); });
    shieldT = Math.max(0, shieldT - dt);
    freezeT = Math.max(0, freezeT - dt);
    compassT = Math.max(0, compassT - dt);
    spinnerT = Math.max(0, spinnerT - dt);
    paintCd();

    // move coil toward mouse or by keys
    let tx = coil.x, ty = coil.y;
    if (mouse.active) { tx = mouse.x; ty = mouse.y; }
    let kx = 0, ky = 0;
    if (keys.KeyW || keys.ArrowUp) ky -= 1;
    if (keys.KeyS || keys.ArrowDown) ky += 1;
    if (keys.KeyA || keys.ArrowLeft) kx -= 1;
    if (keys.KeyD || keys.ArrowRight) kx += 1;
    if (kx || ky) { tx = coil.x + kx * 300; ty = coil.y + ky * 300; mouse.active = false; }
    coil.x += (tx - coil.x) * Math.min(1, dt * coil.model.speed);
    coil.y += (ty - coil.y) * Math.min(1, dt * coil.model.speed);
    coil.x = Math.max(20, Math.min(W - 20, coil.x));
    coil.y = Math.max(60, Math.min(H - 80, coil.y));

    // spawns
    spawnT -= dt;
    if (spawnT <= 0 && spawnQ.length) {
      spawnEnemy(spawnQ.shift());
      spawnT = Math.max(0.3, 1 - wave * 0.04);
    }

    // enemies move to generator
    for (const e of enemies.slice()) {
      if (e.froze > 0) { e.froze -= dt; continue; }
      const dx = cx - e.x, dy = cy - e.y;
      const L = Math.hypot(dx, dy) || 1;
      e.x += (dx / L) * e.spd * dt;
      e.y += (dy / L) * e.spd * dt;
      if (L < 46 + e.r) {
        if (!invincibleAdmin) gen.hp -= e.dmg;
        enemies = enemies.filter((x) => x !== e);
        addParticles(e.x, e.y, "#ef4444", 10);
        beep(180, 100, "square");
        if (gen.hp <= 0) { gen.hp = 0; gameOver(); return; }
        if (!enemies.length && !spawnQ.length) finishWave();
      }
    }

    // spinner blades damage while active
    if (spinnerT > 0) {
      enemies.slice().forEach((e) => {
        if ((e.x - coil.x) ** 2 + (e.y - coil.y) ** 2 < 150 * 150) hurtEnemy(e, 60 * dt, "#f472b6");
      });
    }

    // shield reflects: enemies near coil get pushed
    if (shieldT > 0) {
      enemies.forEach((e) => {
        const dx = e.x - coil.x, dy = e.y - coil.y, d = Math.hypot(dx, dy);
        if (d < 60) { e.x += (dx / (d || 1)) * 6; e.y += (dy / (d || 1)) * 6; }
      });
    }

    // battery pickup
    for (const b of batteries) {
      if (b.got) continue;
      if (Math.hypot(b.x - coil.x, b.y - coil.y) < 30) {
        b.got = true; score += 40; gen.hp = Math.min(gen.max, gen.hp + 8);
        toast("🔋 Батарея! +40 · генератор подлатан");
        beep(760, 90, "triangle");
      }
    }
    batteries = batteries.filter((b) => !b.got);

    autoZap(dt);
    updateFriends(dt);

    bolts = bolts.filter((b) => { b.life -= dt; return b.life > 0; });
    particles = particles.filter((p) => {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
      return p.life > 0;
    });

    el("score").textContent = "💰 " + score;
    el("genBar").style.width = (gen.hp / gen.max * 100) + "%";
    if (score > best) { best = score; el("best").textContent = "Рекорд: " + best; saveProgress(); }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (compassT > 0) {
      ctx.fillStyle = "rgba(16,185,129,.10)";
      ctx.fillRect(0, 0, W, H);
    }
    // generator
    ctx.save();
    ctx.translate(cx, cy);
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.05;
    ctx.beginPath(); ctx.arc(0, 0, 42 * pulse, 0, Math.PI * 2);
    const gg = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
    gg.addColorStop(0, "#22d3ee"); gg.addColorStop(1, "rgba(124,58,237,.2)");
    ctx.fillStyle = gg; ctx.fill();
    ctx.font = "34px system-ui"; ctx.fillText("🔋", -18, 12);
    ctx.restore();

    // batteries (visible only with compass)
    for (const b of batteries) {
      if (compassT > 0) {
        ctx.globalAlpha = 1; ctx.font = "22px system-ui";
        ctx.fillText("🔋", b.x - 11, b.y + 8);
        ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, 18, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.globalAlpha = 0.12; ctx.font = "18px system-ui";
        ctx.fillText("❔", b.x - 8, b.y + 6);
      }
    }
    ctx.globalAlpha = 1;

    // enemies
    for (const e of enemies) {
      ctx.font = e.r * 1.7 + "px system-ui";
      ctx.globalAlpha = e.froze > 0 ? 0.6 : 1;
      ctx.fillText(e.icon, e.x - e.r, e.y + e.r * 0.4);
      ctx.globalAlpha = 1;
      if (e.froze > 0) { ctx.font = "14px system-ui"; ctx.fillText("❄️", e.x + e.r - 4, e.y - e.r); }
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2 * (e.hp / e.max), 3);
      ctx.fillStyle = "#fff";
    }

    // bolts
    for (const b of bolts) {
      ctx.strokeStyle = b.big ? "#fde68a" : "#a78bfa";
      ctx.lineWidth = b.big ? 8 : 3;
      ctx.shadowColor = b.big ? "#fbbf24" : "#c4b5fd"; ctx.shadowBlur = 16;
      ctx.beginPath();
      // jagged line
      const seg = b.big ? 10 : 4;
      ctx.moveTo(b.x1, b.y1);
      for (let i = 1; i < seg; i++) {
        const k = i / seg;
        const jx = (Math.random() - 0.5) * (b.big ? 40 : 16);
        const jy = (Math.random() - 0.5) * (b.big ? 40 : 16);
        ctx.lineTo(b.x1 + (b.x2 - b.x1) * k + jx, b.y1 + (b.y2 - b.y1) * k + jy);
      }
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // coil (player)
    if (coil) {
      if (spinnerT > 0) {
        ctx.save(); ctx.translate(coil.x, coil.y);
        const rot = performance.now() / 40;
        ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
          const a = rot + i * Math.PI / 2;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); ctx.stroke();
        }
        ctx.restore();
      }
      if (shieldT > 0) {
        ctx.strokeStyle = "rgba(167,139,250," + (0.5 + Math.sin(performance.now() / 80) * 0.4) + ")";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(coil.x, coil.y, 40, 0, Math.PI * 2); ctx.stroke();
      }
      const count = friendCount();
      for (let i = 0; i < count; i++) {
        const a = performance.now() / 700 + (i / count) * Math.PI * 2;
        const fx = coil.x + Math.cos(a) * (48 + i * 8);
        const fy = coil.y + Math.sin(a) * (48 + i * 8);
        ctx.font = "18px system-ui";
        ctx.fillText(FRIENDS[i].icon, fx - 9, fy + 6);
      }
      ctx.font = "34px system-ui";
      ctx.fillText(coil.model.icon, coil.x - 17, coil.y + 12);
      ctx.font = "16px system-ui";
      ctx.fillStyle = coil.model.color;
      ctx.fillText("⚡", coil.x - 8, coil.y - 20);
    }
  }

  // input
  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyQ") fire("q");
    if (e.code === "KeyE") fire("e");
    if (e.code === "KeyR") fire("r");
    if (e.code === "KeyF") fire("f");
    if (e.code === "Space") { e.preventDefault(); fire("space"); }
  });
  addEventListener("keyup", (e) => { keys[e.code] = false; });
  canvas.addEventListener("pointerdown", (e) => { mouse.active = true; mouse.x = e.clientX; mouse.y = e.clientY; });
  canvas.addEventListener("pointermove", (e) => { if (mouse.active || e.pressure > 0 || e.buttons) { mouse.active = true; mouse.x = e.clientX; mouse.y = e.clientY; } });
  document.querySelectorAll(".abils button").forEach((b) => {
    b.addEventListener("click", () => fire(b.getAttribute("data-ab")));
  });
  el("btnStart").onclick = showShop;
  el("btnBattle").onclick = start;
  el("btnAgain").onclick = showShop;

  window.addEventListener("amal-power", (e) => {
    const d = (e && e.detail) || {};
    if ((d.type === "ta-owl" || d.type === "ta-hammer" || d.type === "ta-tesla") && state === "play") {
      spawnQ = [];
      enemies.slice().forEach((en) => hurtEnemy(en, 9999, "#fde68a"));
      toast(d.type === "ta-owl" ? "🦉 Сова глушит роботов" : "⚡ Волна зачищена");
      finishWave();
    }
    if (d.type === "ta-lag") { timeStop = true; toast("🐢 Роботы зависли"); }
    if (d.type === "ta-xray") toast("🩻 Пути роботов видны хозяину");
    if (d.type === "ta-spawn" || d.type === "ta-rewind") {
      progress.credits = Math.max(progress.credits, 999999);
      if (gen) gen.hp = gen.max;
      saveProgress();
      toast("✨ Энергия и генератор на максимум");
    }
    if (d.type === "god") invincibleAdmin = true;
    if (d.type === "killAll" && state === "play") {
      spawnQ = [];
      enemies.slice().forEach((en) => hurtEnemy(en, 9999, "#fde68a"));
      toast("💥 BZZZ! Экран очищен");
      finishWave();
    }
    if (d.type === "timestop") timeStop = !!d.on;
    if (d.type === "invincible") invincibleAdmin = !!d.on;
    if (d.type === "coinMult") {
      score = Math.max(score, score * Math.min(Number(d.factor) || 1, 1000));
      progress.credits = Math.max(progress.credits, progress.credits * Math.min(Number(d.factor) || 1, 1000));
      if (gen) gen.hp = gen.max;
      saveProgress();
      toast("🪙 Энергия умножена · генератор цел");
    }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
