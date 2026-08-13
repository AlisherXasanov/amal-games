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
      title: "2 · Кино · Океан",
      desc: "Короткий фильм: ты в лодке · я акула · я должен тебя съесть",
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

  // ——— 2 CINEMA · OCEAN MOVIE ———
  function startCinema() {
    g = {
      done: false,
      t: 0,
      phase: "intro", // intro | play | eat | escape
      introT: 3.2,
      you: { x: 200, y: 300, bob: 0 }, // boat
      me: { x: 780, y: 380, bob: 0, angle: Math.PI }, // shark
      bubbles: [],
      waves: 0,
      survive: 0,
      needSurvive: 45,
      role: "prey", // prey = you boat, me shark; swap = reverse
    };
    playStat.textContent = "Фильм · Океан";
    uiExtra.innerHTML = `
      <button type="button" class="btn me" id="btnRole">Сменить роли</button>
      <span class="sub" style="margin:0" id="roleHint">Ты — лодка · я — акула</span>`;
    document.getElementById("btnRole").onclick = () => {
      if (g.done || g.phase !== "play") return;
      g.role = g.role === "prey" ? "hunter" : "prey";
      const hint = document.getElementById("roleHint");
      if (g.role === "prey") {
        hint.textContent = "Ты — лодка · я — акула";
        say("Снова: ты плывёшь, я охочусь.", 2.4);
      } else {
        hint.textContent = "Ты — акула · я — в лодке";
        say("Теперь ты акула. Догони меня!", 2.4);
      }
      // swap positions roughly
      const tx = g.you.x;
      const ty = g.you.y;
      g.you.x = g.me.x;
      g.you.y = g.me.y;
      g.me.x = tx;
      g.me.y = ty;
    };
    say("✦ Фильм «Океан». Ты в лодке. Я — акула. Я должен тебя съесть.", 3.5);
  }

  function cinemaPrey() {
    return g.role === "prey" ? g.you : g.me;
  }
  function cinemaHunter() {
    return g.role === "prey" ? g.me : g.you;
  }

  function updateCinema(dt) {
    g.waves += dt;
    if (g.phase === "intro") {
      g.introT -= dt;
      if (g.introT <= 0) {
        g.phase = "play";
        say("Плыви! WASD. Не дай акуле…", 2.5);
      }
      return;
    }
    if (g.phase !== "play") return;

    // player always controls "you"
    move(g.you, dt, g.role === "hunter" ? 230 : 185);
    clamp(g.you, 70, 100, 890, 480);

    // AI controls "me"
    const prey = cinemaPrey();
    const hunter = cinemaHunter();
    if (g.role === "prey") {
      // me = shark chases you
      const dx = prey.x - hunter.x;
      const dy = prey.y - hunter.y;
      const dist = Math.hypot(dx, dy) || 1;
      const spd = 155 + Math.min(80, g.survive * 1.2);
      hunter.x += (dx / dist) * spd * dt;
      hunter.y += (dy / dist) * spd * dt;
      hunter.angle = Math.atan2(dy, dx);
      hunter.bob += dt * 10;
      g.survive += dt;
      playStat.textContent = "⏱ " + Math.ceil(g.needSurvive - g.survive) + "с · акула близко";
    } else {
      // me = boat flees from you (shark)
      const dx = hunter.x - prey.x;
      const dy = hunter.y - prey.y;
      const dist = Math.hypot(dx, dy) || 1;
      const spd = 170;
      // flee opposite
      prey.x -= (dx / dist) * spd * dt;
      prey.y -= (dy / dist) * spd * dt;
      clamp(prey, 70, 100, 890, 480);
      prey.bob += dt * 8;
      g.survive += dt;
      playStat.textContent = "Ты акула · догони лодку";
    }

    clamp(g.me, 70, 100, 890, 480);

    // bubbles
    if (Math.random() < 0.35) {
      g.bubbles.push({
        x: g.me.x + (Math.random() - 0.5) * 20,
        y: g.me.y + (Math.random() - 0.5) * 10,
        life: 0.6 + Math.random() * 0.4,
        vy: -30 - Math.random() * 40,
      });
    }
    for (const b of g.bubbles) {
      b.life -= dt;
      b.y += b.vy * dt;
    }
    g.bubbles = g.bubbles.filter((b) => b.life > 0);

    const d = Math.hypot(g.you.x - g.me.x, g.you.y - g.me.y);
    if (d < 38) {
      g.phase = "eat";
      if (g.role === "prey") {
        say("Хрусть. Фильм окончен. Акула победила.", 3);
        setTimeout(() => finish("Океан · конец. Я съел тебя. Это кино."), 900);
      } else {
        say("Хрусть! Ты съел лодку. Ты — акула.", 3);
        setTimeout(() => finish("Океан · конец. Ты съел меня. Жуткий фильм."), 900);
      }
      return;
    }

    // survive ending only when you're the boat
    if (g.role === "prey" && g.survive >= g.needSurvive) {
      g.phase = "escape";
      say("Ты уплыл к берегу. Акула осталась голодной.", 3);
      setTimeout(() => finish("Океан · хэппи-энд. Лодка спаслась."), 900);
    }
  }

  function drawBoat(p, label) {
    const b = Math.sin(p.bob || g.waves * 3) * 2;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 14, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // hull
    ctx.fillStyle = "#c08040";
    ctx.beginPath();
    ctx.moveTo(p.x - 22, p.y + 4 + b);
    ctx.lineTo(p.x + 22, p.y + 4 + b);
    ctx.lineTo(p.x + 14, p.y + 14 + b);
    ctx.lineTo(p.x - 14, p.y + 14 + b);
    ctx.closePath();
    ctx.fill();
    // little person
    ctx.fillStyle = "#ffd76a";
    roundRect(p.x - 6, p.y - 14 + b, 12, 16, 4);
    ctx.fill();
    ctx.fillStyle = "#e8b890";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 18 + b, 6, 0, Math.PI * 2);
    ctx.fill();
    // oar
    ctx.strokeStyle = "#a07040";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y - 4 + b);
    ctx.lineTo(p.x + 26, p.y + 10 + b);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "800 11px Nunito";
    ctx.textAlign = "center";
    ctx.fillText(label, p.x, p.y - 32 + b);
    ctx.textAlign = "left";
  }

  function drawShark(p, label) {
    const ang = p.angle || 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    // body
    ctx.fillStyle = "#4a7aa8";
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // fin
    ctx.beginPath();
    ctx.moveTo(-2, -10);
    ctx.lineTo(6, -26);
    ctx.lineTo(12, -8);
    ctx.fill();
    // tail
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(-40, -12);
    ctx.lineTo(-34, 0);
    ctx.lineTo(-40, 12);
    ctx.closePath();
    ctx.fill();
    // belly
    ctx.fillStyle = "#b8d8f0";
    ctx.beginPath();
    ctx.ellipse(4, 4, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(16, -3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#102030";
    ctx.beginPath();
    ctx.arc(17, -3, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // teeth hint
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(24, 2);
    ctx.lineTo(28, 6);
    ctx.lineTo(22, 6);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.font = "800 11px Nunito";
    ctx.textAlign = "center";
    ctx.fillText(label, p.x, p.y - 36);
    ctx.textAlign = "left";
  }

  function drawCinema() {
    // ocean
    const grd = ctx.createLinearGradient(0, 0, 0, VH);
    grd.addColorStop(0, "#1a5080");
    grd.addColorStop(0.45, "#0a3860");
    grd.addColorStop(1, "#041828");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);

    // waves
    for (let i = 0; i < 6; i++) {
      const y = 80 + i * 70;
      ctx.strokeStyle = `rgba(120, 200, 255, ${0.12 + (i % 2) * 0.06})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= VW; x += 30) {
        ctx.lineTo(x, y + Math.sin(g.waves * 2 + x * 0.02 + i) * 8);
      }
      ctx.stroke();
    }

    // title card
    if (g.phase === "intro") {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#e8f4ff";
      ctx.font = "900 42px Fredoka, Nunito";
      ctx.textAlign = "center";
      ctx.fillText("ОКЕАН", VW / 2, VH / 2 - 10);
      ctx.font = "700 16px Nunito";
      ctx.fillStyle = "rgba(200,230,255,0.85)";
      ctx.fillText("короткий фильм · акула и лодка", VW / 2, VH / 2 + 28);
      ctx.textAlign = "left";
      return;
    }

    // bubbles
    for (const b of g.bubbles) {
      ctx.strokeStyle = `rgba(180, 230, 255, ${b.life})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // shore hint right
    ctx.fillStyle = "rgba(255, 220, 140, 0.15)";
    ctx.fillRect(VW - 40, 0, 40, VH);
    ctx.fillStyle = "rgba(255, 230, 160, 0.5)";
    ctx.font = "700 11px Nunito";
    ctx.fillText("берег", VW - 36, 30);

    if (g.role === "prey") {
      drawShark(g.me, "Я · акула");
      drawBoat(g.you, "Ты · лодка");
    } else {
      drawBoat(g.me, "Я · лодка");
      drawShark(g.you, "Ты · акула");
    }

    if (g.phase === "eat") {
      ctx.fillStyle = "rgba(80,0,20,0.35)";
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#ffb0b0";
      ctx.font = "900 36px Fredoka, Nunito";
      ctx.textAlign = "center";
      ctx.fillText("СЪЕЛ", VW / 2, VH / 2);
      ctx.textAlign = "left";
    }
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
