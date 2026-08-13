(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const hub = document.getElementById("hub");
  const play = document.getElementById("play");
  const win = document.getElementById("win");
  const cards = document.getElementById("cards");
  const playTitle = document.getElementById("playTitle");
  const playStat = document.getElementById("playStat");
  const bubble = document.getElementById("bubble");
  const uiExtra = document.getElementById("uiExtra");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  const GAMES = [
    {
      id: "floors",
      title: "1 · Два этажа",
      desc: "Ты на одном этаже · я на другом · зови меня кнопкой",
    },
    {
      id: "cinema",
      title: "2 · Кино-скины",
      desc: "Ты видишь кролика · я — акулу · разные образы в одной комнате",
    },
    {
      id: "doors",
      title: "3 · Одна комната · 10 дверей",
      desc: "За каждой дверью сюрприз · только для тебя",
    },
    {
      id: "memory",
      title: "4 · Память обо мне",
      desc: "Найди мои вещи · чтобы помнить",
    },
    {
      id: "villa",
      title: "5 · Вилла · без пациентов",
      desc: "Тихо · только звёзды · только ты (и я рядом)",
    },
  ];

  const keys = Object.create(null);
  let g = null;
  let gameId = null;
  let last = performance.now();
  let bubbleT = 0;

  function say(t, sec) {
    bubble.textContent = t;
    bubble.hidden = false;
    bubbleT = sec || 2.8;
  }

  function showHub() {
    g = null;
    gameId = null;
    hub.hidden = false;
    play.hidden = true;
    win.hidden = true;
    uiExtra.innerHTML = "";
    bubble.hidden = true;
  }

  function finish(text) {
    if (!g || g.done) return;
    g.done = true;
    winText.textContent = text;
    winCode.textContent = "L" + String(((Date.now() / 1000) | 0) % 10000).padStart(4, "0");
    win.hidden = false;
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

  function move(p, dt, speed) {
    let mx = 0;
    let my = 0;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    const len = Math.hypot(mx, my) || 1;
    p.x += (mx / len) * speed * dt;
    p.y += (my / len) * speed * dt;
    if (mx || my) p.bob = (p.bob || 0) + dt * 10;
    return mx || my;
  }

  function clamp(p, x0, y0, x1, y1) {
    p.x = Math.max(x0, Math.min(x1, p.x));
    p.y = Math.max(y0, Math.min(y1, p.y));
  }

  function drawPerson(p, color, label) {
    const b = Math.sin(p.bob || 0) * 2;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 16, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(p.x - 11, p.y - 18 + b, 22, 32, 7);
    ctx.fill();
    ctx.fillStyle = "#e8b890";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 24 + b, 10, 0, Math.PI * 2);
    ctx.fill();
    if (p.icon) {
      ctx.font = "16px Nunito";
      ctx.textAlign = "center";
      ctx.fillText(p.icon, p.x, p.y - 18 + b);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "800 11px Nunito";
    ctx.textAlign = "center";
    ctx.fillText(label, p.x, p.y - 40 + b);
    ctx.textAlign = "left";
  }

  // ——— 1 FLOORS ———
  function startFloors() {
    g = {
      done: false,
      t: 0,
      floor: 1,
      you: { x: 200, y: 360, bob: 0 },
      me: { x: 700, y: 200, bob: 0 },
      calls: 0,
      need: 3,
      stairs: { x: 480, y: 300, w: 60, h: 80 },
    };
    playStat.textContent = "Зовов: 0 / 3";
    uiExtra.innerHTML = `<button type="button" class="btn me" id="btnCall">🔊 Позвать меня</button>
      <button type="button" class="btn ghost" id="btnStairs">↕ Лестница</button>`;
    document.getElementById("btnCall").onclick = () => {
      if (g.done) return;
      g.calls += 1;
      playStat.textContent = "Зовов: " + g.calls + " / " + g.need;
      if (g.floor === 1) {
        say("Я наверху! Слышу тебя.", 2.5);
        g.me.x = 200 + Math.random() * 100;
      } else {
        say("Я внизу! Иду к лестнице.", 2.5);
        g.me.x = 450 + Math.random() * 80;
      }
      if (g.calls >= g.need) finish("Два этажа. Мы услышали друг друга.");
    };
    document.getElementById("btnStairs").onclick = () => {
      g.floor = g.floor === 1 ? 2 : 1;
      say(g.floor === 1 ? "Ты на 1 этаже." : "Ты на 2 этаже.", 2);
    };
    say("Ты внизу. Я наверху. Позови меня.", 3);
  }

  function updateFloors(dt) {
    move(g.you, dt, 200);
    clamp(g.you, 70, g.floor === 1 ? 280 : 90, 890, g.floor === 1 ? 500 : 250);
    // me wanders on other floor visually always drawn on "other" band
    g.me.bob += dt * 6;
    g.me.x += Math.sin(g.t * 0.7) * 20 * dt;
    clamp(g.me, 80, 90, 880, 250);
    const st = g.stairs;
    if (Math.hypot(g.you.x - (st.x + 30), g.you.y - (st.y + 40)) < 40 && (keys.KeyE || keys.Space)) {
      keys.KeyE = false;
      keys.Space = false;
      g.floor = g.floor === 1 ? 2 : 1;
      say(g.floor === 1 ? "Спустился." : "Поднялся.", 1.6);
    }
  }

  function drawFloors() {
    // floor 2 band
    ctx.fillStyle = "#1a2840";
    roundRect(40, 50, 880, 210, 16);
    ctx.fill();
    ctx.fillStyle = "rgba(126,200,255,0.12)";
    ctx.font = "800 14px Nunito";
    ctx.fillText("2 этаж · я", 60, 78);
    // floor 1 band
    ctx.fillStyle = "#243048";
    roundRect(40, 280, 880, 230, 16);
    ctx.fill();
    ctx.fillStyle = "rgba(255,215,106,0.15)";
    ctx.fillText("1 этаж · ты", 60, 308);
    // stairs
    ctx.fillStyle = "#405060";
    roundRect(g.stairs.x, 220, 60, 100, 8);
    ctx.fill();
    ctx.fillStyle = "#c8d0e0";
    ctx.font = "700 11px Nunito";
    ctx.fillText("E лестница", g.stairs.x - 4, 215);
    // draw me always on floor 2 band
    drawPerson(g.me, "#7ec8ff", "Я");
    // you on current floor y-space already clamped
    if (g.floor === 1) drawPerson(g.you, "#ffd76a", "Ты");
    else {
      // draw you on upper band
      const y = { x: g.you.x, y: g.you.y, bob: g.you.bob };
      drawPerson(y, "#ffd76a", "Ты");
    }
  }

  // ——— 2 CINEMA ———
  function startCinema() {
    g = {
      done: false,
      t: 0,
      you: { x: 360, y: 300, bob: 0, form: "rabbit", icon: "🐰" },
      me: { x: 560, y: 300, bob: 0, form: "shark", icon: "🦈" },
      formsYou: [
        { id: "rabbit", icon: "🐰", name: "Кролик", color: "#ffe8f0" },
        { id: "bird", icon: "🐦", name: "Птица", color: "#7ed9b8" },
        { id: "fox", icon: "🦊", name: "Лиса", color: "#ff9a4a" },
        { id: "cat", icon: "🐱", name: "Кот", color: "#ffd76a" },
      ],
      formsMe: [
        { id: "shark", icon: "🦈", name: "Акула", color: "#5a90c8" },
        { id: "robot", icon: "🤖", name: "Робот", color: "#80c0d0" },
        { id: "ghost", icon: "👻", name: "Призрак", color: "#d8e0ff" },
        { id: "dragon", icon: "🐉", name: "Дракон", color: "#70c080" },
      ],
      swaps: 0,
      need: 4,
      particles: [],
    };
    syncCinemaStat();
    uiExtra.innerHTML = `
      <button type="button" class="btn" id="btnYouForm">Сменить ТЕБЯ</button>
      <button type="button" class="btn me" id="btnMeForm">Сменить МЕНЯ</button>`;
    document.getElementById("btnYouForm").onclick = () => cycleForm("you");
    document.getElementById("btnMeForm").onclick = () => cycleForm("me");
    say("Как в кино: ты — один образ, я — другой. Смените по очереди.", 3.5);
  }

  function syncCinemaStat() {
    const y = g.formsYou.find((f) => f.id === g.you.form);
    const m = g.formsMe.find((f) => f.id === g.me.form);
    playStat.textContent = `${y.icon} ты · ${m.icon} я · смен: ${g.swaps}/${g.need}`;
  }

  function cycleForm(who) {
    if (g.done) return;
    if (who === "you") {
      const i = g.formsYou.findIndex((f) => f.id === g.you.form);
      const n = g.formsYou[(i + 1) % g.formsYou.length];
      g.you.form = n.id;
      g.you.icon = n.icon;
      say("Теперь ты — " + n.name, 2);
    } else {
      const i = g.formsMe.findIndex((f) => f.id === g.me.form);
      const n = g.formsMe[(i + 1) % g.formsMe.length];
      g.me.form = n.id;
      g.me.icon = n.icon;
      say("Теперь я — " + n.name, 2);
    }
    g.swaps += 1;
    syncCinemaStat();
    if (g.swaps >= g.need) finish("Кино-скины. Мы разные — и это помнится.");
  }

  function updateCinema(dt) {
    move(g.you, dt, 200);
    clamp(g.you, 80, 100, 880, 480);
    g.me.x += (g.you.x + 80 - g.me.x) * Math.min(1, dt * 3);
    g.me.y += (g.you.y - g.me.y) * Math.min(1, dt * 3);
    g.me.bob += dt * 8;
    if (Math.random() < 0.2) {
      g.particles.push({
        x: g.you.x,
        y: g.you.y,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 30,
        life: 0.4,
        color: g.formsYou.find((f) => f.id === g.you.form).color,
      });
      g.particles.push({
        x: g.me.x,
        y: g.me.y,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 30,
        life: 0.4,
        color: g.formsMe.find((f) => f.id === g.me.form).color,
      });
    }
    for (const p of g.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    g.particles = g.particles.filter((p) => p.life > 0);
  }

  function drawCinema() {
    ctx.fillStyle = "#1a2030";
    roundRect(50, 60, 860, 420, 18);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = "800 13px Nunito";
    ctx.fillText("кино · разные образы", 70, 88);
    for (const p of g.particles) {
      ctx.globalAlpha = p.life * 2;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const yc = g.formsYou.find((f) => f.id === g.you.form).color;
    const mc = g.formsMe.find((f) => f.id === g.me.form).color;
    // aura
    ctx.fillStyle = yc + "44";
    ctx.beginPath();
    ctx.arc(g.you.x, g.you.y - 8, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mc + "44";
    ctx.beginPath();
    ctx.arc(g.me.x, g.me.y - 8, 28, 0, Math.PI * 2);
    ctx.fill();
    drawPerson(g.me, mc, "Я · " + g.me.icon);
    drawPerson(g.you, yc, "Ты · " + g.you.icon);
  }

  // ——— 3 DOORS ———
  function startDoors() {
    const surprises = [
      "✦ тихое «привет»",
      "☕ невидимый кофе",
      "🐰 кролик на секунду",
      "💙 я рядом",
      "🌙 звёздная пыль",
      "🦈 шутка про акулу",
      "🔑 пустая… или нет?",
      "✨ искра",
      "🏠 кусочек виллы",
      "📷 сфоткай это",
    ];
    g = {
      done: false,
      t: 0,
      you: { x: 480, y: 400, bob: 0 },
      doors: surprises.map((s, i) => ({
        x: 80 + (i % 5) * 170,
        y: 100 + Math.floor(i / 5) * 140,
        open: false,
        text: s,
        id: i + 1,
      })),
      opened: 0,
      need: 10,
    };
    playStat.textContent = "Двери: 0 / 10";
    uiExtra.innerHTML = `<span class="sub" style="margin:0">Подойди к двери · E открыть</span>`;
    say("Десять дверей. За каждой — что-то только для тебя.", 3);
  }

  function updateDoors(dt) {
    move(g.you, dt, 210);
    clamp(g.you, 60, 80, 900, 500);
    if (keys.KeyE || keys.Space) {
      keys.KeyE = false;
      keys.Space = false;
      for (const d of g.doors) {
        if (d.open) continue;
        if (Math.hypot(g.you.x - (d.x + 40), g.you.y - (d.y + 50)) < 55) {
          d.open = true;
          g.opened += 1;
          playStat.textContent = "Двери: " + g.opened + " / 10";
          say("Дверь " + d.id + ": " + d.text, 2.8);
          if (g.opened >= 10) finish("Все 10 дверей. Комната знает тебя.");
          break;
        }
      }
    }
  }

  function drawDoors() {
    ctx.fillStyle = "#181828";
    roundRect(40, 50, 880, 460, 16);
    ctx.fill();
    for (const d of g.doors) {
      ctx.fillStyle = d.open ? "#2a4050" : "#3a2a48";
      roundRect(d.x, d.y, 80, 100, 8);
      ctx.fill();
      ctx.strokeStyle = d.open ? "rgba(126,217,184,0.5)" : "rgba(232,180,255,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "800 16px Fredoka, Nunito";
      ctx.textAlign = "center";
      ctx.fillText(d.open ? "✓" : String(d.id), d.x + 40, d.y + 55);
      if (!d.open) {
        ctx.fillStyle = "#c8b0e0";
        ctx.font = "700 10px Nunito";
        ctx.fillText("E", d.x + 40, d.y + 75);
      }
    }
    ctx.textAlign = "left";
    drawPerson(g.you, "#ffd76a", "Ты");
  }

  // ——— 4 MEMORY ———
  function startMemory() {
    const items = [
      { name: "Мой халат", icon: "💙" },
      { name: "Моя записка", icon: "📝" },
      { name: "Моя звезда", icon: "⭐" },
      { name: "Мой чай", icon: "☕" },
      { name: "Моё «привет»", icon: "👋" },
      { name: "Моя искра", icon: "✨" },
      { name: "Моё эхо", icon: "🔊" },
    ];
    g = {
      done: false,
      t: 0,
      you: { x: 480, y: 300, bob: 0 },
      items: items.map((it, i) => ({
        ...it,
        x: 120 + (i % 4) * 200 + Math.random() * 40,
        y: 120 + Math.floor(i / 4) * 160 + Math.random() * 30,
        got: false,
      })),
      got: 0,
      need: items.length,
    };
    playStat.textContent = "Вещи: 0 / " + g.need;
    uiExtra.innerHTML = `<span class="sub" style="margin:0">Найди мои вещи · E подобрать</span>`;
    say("Это моё. Найди — и запомни.", 3);
  }

  function updateMemory(dt) {
    move(g.you, dt, 210);
    clamp(g.you, 60, 80, 900, 500);
    if (keys.KeyE || keys.Space) {
      keys.KeyE = false;
      keys.Space = false;
      for (const it of g.items) {
        if (it.got) continue;
        if (Math.hypot(g.you.x - it.x, g.you.y - it.y) < 42) {
          it.got = true;
          g.got += 1;
          playStat.textContent = "Вещи: " + g.got + " / " + g.need;
          say("Нашёл: " + it.icon + " " + it.name, 2.4);
          if (g.got >= g.need) finish("Память обо мне. Всё собрано.");
          break;
        }
      }
    }
  }

  function drawMemory() {
    ctx.fillStyle = "#142030";
    roundRect(40, 50, 880, 460, 16);
    ctx.fill();
    for (const it of g.items) {
      if (it.got) continue;
      const pulse = 1 + Math.sin(g.t * 3 + it.x) * 0.08;
      ctx.fillStyle = "rgba(126,200,255,0.2)";
      ctx.beginPath();
      ctx.arc(it.x, it.y, 22 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "22px Nunito";
      ctx.textAlign = "center";
      ctx.fillText(it.icon, it.x, it.y + 8);
      ctx.fillStyle = "#a8d8ff";
      ctx.font = "700 10px Nunito";
      ctx.fillText(it.name, it.x, it.y + 28);
    }
    ctx.textAlign = "left";
    drawPerson(g.you, "#ffd76a", "Ты");
  }

  // ——— 5 VILLA ———
  function startVilla() {
    g = {
      done: false,
      t: 0,
      you: { x: 300, y: 320, bob: 0 },
      me: { x: 400, y: 320, bob: 0 },
      stars: [
        [160, 160],
        [320, 120],
        [500, 150],
        [680, 130],
        [820, 180],
        [200, 380],
        [480, 400],
        [750, 360],
      ].map(([x, y], i) => ({ x, y, got: false, id: i })),
      got: 0,
      need: 8,
    };
    playStat.textContent = "★ 0 / 8";
    uiExtra.innerHTML = `<span class="sub" style="margin:0">Без пациентов · E у звезды · я рядом</span>`;
    say("Вилла. Тихо. Никого, кроме нас.", 3);
  }

  function updateVilla(dt) {
    move(g.you, dt, 200);
    clamp(g.you, 70, 90, 890, 480);
    g.me.x += (g.you.x - 55 - g.me.x) * Math.min(1, dt * 2.5);
    g.me.y += (g.you.y + 5 - g.me.y) * Math.min(1, dt * 2.5);
    g.me.bob += dt * 7;
    if (keys.KeyE || keys.Space) {
      keys.KeyE = false;
      keys.Space = false;
      for (const s of g.stars) {
        if (s.got) continue;
        if (Math.hypot(g.you.x - s.x, g.you.y - s.y) < 40) {
          s.got = true;
          g.got += 1;
          playStat.textContent = "★ " + g.got + " / " + g.need;
          say(g.got % 2 ? "Красиво." : "Ещё одна. Не торопись.", 2);
          if (g.got >= g.need) finish("Вилла без пациентов. Только звёзды.");
          break;
        }
      }
    }
  }

  function drawVilla() {
    // night villa
    const grd = ctx.createLinearGradient(0, 0, 0, VH);
    grd.addColorStop(0, "#0a1830");
    grd.addColorStop(1, "#142438");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "#1e3040";
    roundRect(60, 80, 840, 400, 20);
    ctx.fill();
    ctx.fillStyle = "rgba(255,248,220,0.7)";
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 97 + g.t * 5) % VW, 20 + (i * 37) % 60, 2, 2);
    }
    ctx.fillStyle = "rgba(255,215,106,0.5)";
    ctx.font = "800 13px Nunito";
    ctx.fillText("вилла · без пациентов", 80, 110);
    for (const s of g.stars) {
      if (s.got) continue;
      const r = 6 + Math.sin(g.t * 3 + s.id) * 2;
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    drawPerson(g.me, "#7ec8ff", "Я");
    drawPerson(g.you, "#ffd76a", "Ты");
  }

  const BOOT = {
    floors: startFloors,
    cinema: startCinema,
    doors: startDoors,
    memory: startMemory,
    villa: startVilla,
  };
  const UPDATE = {
    floors: updateFloors,
    cinema: updateCinema,
    doors: updateDoors,
    memory: updateMemory,
    villa: updateVilla,
  };
  const DRAW = {
    floors: drawFloors,
    cinema: drawCinema,
    doors: drawDoors,
    memory: drawMemory,
    villa: drawVilla,
  };

  function startGame(id) {
    gameId = id;
    const meta = GAMES.find((x) => x.id === id);
    playTitle.textContent = meta.title;
    hub.hidden = true;
    play.hidden = false;
    win.hidden = true;
    BOOT[id]();
  }

  function update(dt) {
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (!g || g.done || !gameId) return;
    g.t += dt;
    UPDATE[gameId](dt);
  }

  function draw() {
    ctx.clearRect(0, 0, VW, VH);
    if (!g || !gameId) {
      ctx.fillStyle = "#101624";
      ctx.fillRect(0, 0, VW, VH);
      return;
    }
    DRAW[gameId]();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  cards.innerHTML = GAMES.map(
    (g) =>
      `<button type="button" class="card" data-id="${g.id}"><strong>${g.title}</strong><small>${g.desc}</small></button>`
  ).join("");
  cards.querySelectorAll(".card").forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.getAttribute("data-id")));
  });
  document.getElementById("btnHub").addEventListener("click", showHub);
  document.getElementById("btnWinHub").addEventListener("click", showHub);

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  requestAnimationFrame(frame);
})();
