(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("title");
  const blurbEl = document.getElementById("blurb");
  const startBtn = document.getElementById("start-btn");
  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score");
  const floorEl = document.getElementById("floor");
  const passengerEl = document.getElementById("passenger");
  const hintEl = document.getElementById("hint");
  const touch = document.getElementById("touch");
  const menuBtn = document.getElementById("menu-btn");

  const W = canvas.width;
  const H = canvas.height;
  const GOAL = 5;
  const LIFT_SPEED = 180;
  const FLOOR_H = 72;

  const MOODS = [
    { id: "rain", name: "Дождь", icon: "🌧", color: "#5a8ec0", vibe: "Пахнет мокрым асфальтом и далёкой грозой." },
    { id: "music", name: "Музыка", icon: "🎵", color: "#c47aff", vibe: "Из-за двери тянет несыгранной мелодией." },
    { id: "silence", name: "Тишина", icon: "🤫", color: "#6a7080", vibe: "Здесь даже воздух не шевелится." },
    { id: "warm", name: "Тепло", icon: "☕", color: "#e8a060", vibe: "Тёплый свет, как у бабушки на кухне." },
    { id: "mirror", name: "Зеркало", icon: "🪞", color: "#a0c8e8", vibe: "Отражение смотрит на секунду раньше тебя." },
    { id: "garden", name: "Сад", icon: "🌿", color: "#5cb878", vibe: "Запах мокрой травы и ночных цветов." },
    { id: "paper", name: "Бумага", icon: "📜", color: "#d8c8a0", vibe: "Пахнет старыми книгами и чернилами." },
    { id: "night", name: "Ночь", icon: "🌙", color: "#3040a0", vibe: "За порогом — звёзды без неба." },
  ];

  const WISHES = [
    { mood: "rain", text: "«Мне нужен этаж, где пахнет дождём»", who: "Женщина с зонтом" },
    { mood: "music", text: "«Где песня ещё не кончилась…»", who: "Мальчик с наушниками" },
    { mood: "silence", text: "«Тишина. Просто тишина»", who: "Старик без слов" },
    { mood: "warm", text: "«Туда, где тепло, как дома»", who: "Курьер с термосом" },
    { mood: "mirror", text: "«Где отражение не врёт»", who: "Девочка с лентой" },
    { mood: "garden", text: "«Этаж с запахом сада»", who: "Садовник" },
    { mood: "paper", text: "«Куда уходят недописанные письма»", who: "Почтальон" },
    { mood: "night", text: "«Туда, где луна ближе»", who: "Астроном" },
  ];

  /** @type {'menu'|'play'|'end'} */
  let mode = "menu";
  let time = 0;
  let score = 0;
  let level = 0;
  let message = "";
  let messageT = 0;
  let doorsOpen = false;
  let doorAnim = 0;
  let liftY = 0;
  let targetY = 0;
  let floorIndex = 0;
  /** @type {typeof MOODS[0][]} */
  let floorMap = [];
  /** @type {typeof WISHES[0] | null} */
  let passenger = null;
  let hasPassenger = false;
  let particles = [];

  const keys = Object.create(null);
  const touchHeld = Object.create(null);

  function moodById(id) {
    return MOODS.find((m) => m.id === id) || MOODS[0];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildFloors() {
    const stack = shuffle(MOODS);
    floorMap = [];
    for (let i = 0; i < 24; i++) {
      floorMap.push(stack[i % stack.length]);
    }
  }

  function nextPassenger() {
    const pool = WISHES.filter((w) => floorMap.some((f) => f.id === w.mood));
    passenger = pool[(Math.random() * pool.length) | 0];
    hasPassenger = true;
    showMsg(`${passenger.who}: ${passenger.text}`, 3.5);
  }

  function showMsg(text, sec) {
    message = text;
    messageT = sec || 2.5;
  }

  function currentMood() {
    return floorMap[floorIndex] || MOODS[0];
  }

  function startGame() {
    score = 0;
    level = 0;
    liftY = 0;
    targetY = 0;
    floorIndex = 0;
    doorsOpen = false;
    doorAnim = 0;
    hasPassenger = false;
    passenger = null;
    particles = [];
    buildFloors();
    mode = "play";
    overlay.classList.add("hidden");
    hud.classList.remove("hidden");
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) {
      touch.classList.remove("hidden");
    }
    nextPassenger();
    updateHud();
    canvas.focus();
  }

  function goMenu(won) {
    mode = won ? "end" : "menu";
    hud.classList.add("hidden");
    touch.classList.add("hidden");
    overlay.classList.remove("hidden");
    if (won) {
      titleEl.textContent = "Дом запомнил тебя";
      blurbEl.textContent = `Ты довёз ${GOAL} пассажиров на этажи без цифр. Лифт снова ждёт — если захочешь.`;
      startBtn.textContent = "Ещё раз";
    } else {
      titleEl.textContent = "Дом, которого нет на плане";
      blurbEl.textContent =
        "Кнопки без цифр. Пассажиры просят «туда, где пахнет дождём» или «где песня ещё не кончилась». Остановись, открой двери и угадай этаж по чувству.";
      startBtn.textContent = "Войти в шахту";
    }
  }

  function updateHud() {
    scoreEl.textContent = `Доставлено: ${score}/${GOAL}`;
    const m = currentMood();
    floorEl.textContent = doorsOpen ? `Этаж: ${m.icon} ${m.name}` : "Этаж: ?";
    passengerEl.textContent = hasPassenger && passenger
      ? `Пассажир: ${passenger.who}`
      : "Пассажир: нет";
    hintEl.textContent = doorsOpen
      ? m.vibe
      : "↑↓ — лифт · E — двери · угадай этаж по настроению";
  }

  function spawnBurst(color) {
    for (let i = 0; i < 16; i++) {
      particles.push({
        x: W / 2 + (Math.random() - 0.5) * 80,
        y: H / 2 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 140,
        life: 0.5 + Math.random() * 0.3,
        color,
      });
    }
  }

  function toggleDoors() {
    if (mode !== "play") return;
    doorsOpen = !doorsOpen;
    if (doorsOpen) {
      showMsg(currentMood().vibe, 2);
    } else if (hasPassenger && passenger) {
      const here = currentMood().id;
      if (here === passenger.mood) {
        score += 1;
        hasPassenger = false;
        spawnBurst(moodById(here).color);
        showMsg("Верный этаж! Пассажир ушёл с улыбкой.", 2.2);
        if (score >= GOAL) {
          mode = "end";
          setTimeout(() => goMenu(true), 600);
        } else {
          setTimeout(nextPassenger, 800);
        }
      } else {
        showMsg("Не тот этаж… пассажир вздыхает и ждёт снова.", 2.2);
      }
    }
    updateHud();
  }

  function moveLift(dir, dt) {
    if (doorsOpen) return;
    targetY += dir * LIFT_SPEED * dt;
    const maxY = (floorMap.length - 1) * FLOOR_H;
    targetY = Math.max(0, Math.min(maxY, targetY));
    floorIndex = Math.round(targetY / FLOOR_H);
  }

  function update(dt) {
    if (mode !== "play") return;
    time += dt;
    if (messageT > 0) messageT -= dt;

    liftY += (targetY - liftY) * Math.min(1, dt * 8);

    let dir = 0;
    if (keys.ArrowUp || keys.KeyW || touchHeld.up) dir -= 1;
    if (keys.ArrowDown || keys.KeyS || touchHeld.down) dir += 1;
    if (dir) moveLift(dir, dt);

    doorAnim += ((doorsOpen ? 1 : 0) - doorAnim) * Math.min(1, dt * 10);

    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);
    updateHud();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawShaft() {
    ctx.fillStyle = "#0e0c14";
    ctx.fillRect(0, 0, W, H);

    const shaftX = W * 0.38;
    const shaftW = 200;
    ctx.fillStyle = "#1a1624";
    roundRect(shaftX - 20, 30, shaftW + 40, H - 60, 12);
    ctx.fill();

    const camY = liftY;
    for (let i = 0; i < floorMap.length; i++) {
      const fy = 80 + i * FLOOR_H - camY * 0.85 + H * 0.35;
      if (fy < -40 || fy > H + 40) continue;
      const m = floorMap[i];
      const active = i === floorIndex;
      ctx.fillStyle = active ? m.color + "55" : "#242030";
      roundRect(shaftX + 8, fy, shaftW - 16, FLOOR_H - 8, 8);
      ctx.fill();
      ctx.fillStyle = active ? "#fff" : "rgba(255,255,255,0.35)";
      ctx.font = active ? "800 22px Manrope" : "700 18px Manrope";
      ctx.textAlign = "center";
      ctx.fillText(m.icon, shaftX + shaftW / 2, fy + 38);
      if (active && doorsOpen) {
        ctx.font = "700 11px Manrope";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(m.name, shaftX + shaftW / 2, fy + 58);
      }
    }

    const carY = H * 0.42;
    ctx.fillStyle = "#3a3448";
    roundRect(shaftX + 4, carY - 50, shaftW - 8, 100, 10);
    ctx.fill();
    ctx.strokeStyle = "#e8c468";
    ctx.lineWidth = 3;
    ctx.stroke();

    const gap = 38 * doorAnim;
    ctx.fillStyle = "#2a2438";
    roundRect(shaftX + 12, carY - 42, shaftW / 2 - 14 - gap / 2, 84, 6);
    ctx.fill();
    roundRect(shaftX + shaftW / 2 + gap / 2, carY - 42, shaftW / 2 - 14 - gap / 2, 84, 6);
    ctx.fill();

    if (hasPassenger && passenger) {
      ctx.fillStyle = "#f0c8a0";
      ctx.beginPath();
      ctx.arc(shaftX + shaftW / 2 - 20, carY - 10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6ee7b7";
      ctx.beginPath();
      ctx.arc(shaftX + shaftW / 2 + 20, carY - 8, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "700 12px Manrope";
    ctx.fillText("↑ ↓", shaftX + shaftW + 30, carY);
    ctx.fillText("без цифр", shaftX + shaftW + 30, carY + 20);

    if (hasPassenger && passenger) {
      ctx.fillStyle = "rgba(12,10,18,0.88)";
      roundRect(40, H - 120, W - 80, 72, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(232,196,104,0.4)";
      ctx.stroke();
      ctx.fillStyle = "#f0ebe4";
      ctx.font = "700 14px Manrope";
      ctx.fillText(passenger.who, 56, H - 92);
      ctx.fillStyle = "#9a9088";
      ctx.font = "600 13px Literata, Georgia, serif";
      ctx.fillText(passenger.text, 56, H - 68);
    }

    if (messageT > 0) {
      ctx.fillStyle = `rgba(20,16,28,${Math.min(0.9, messageT * 0.8)})`;
      roundRect(W / 2 - 200, 50, 400, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 13px Manrope";
      ctx.textAlign = "center";
      ctx.fillText(message, W / 2, 73);
      ctx.textAlign = "left";
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    if (mode === "play") drawShaft();
    else {
      ctx.fillStyle = "#0e0c14";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(232,196,104,0.2)";
      ctx.font = "700 64px Manrope";
      ctx.textAlign = "center";
      ctx.fillText("↑", W / 2, H / 2);
      ctx.font = "700 48px Literata, Georgia, serif";
      ctx.fillText("?", W / 2, H / 2 + 50);
      ctx.textAlign = "left";
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyE") toggleDoors();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  function bindHold(el, key) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      touchHeld[key] = true;
    });
    const off = (e) => {
      e.preventDefault();
      touchHeld[key] = false;
    };
    el.addEventListener("pointerup", off);
    el.addEventListener("pointercancel", off);
    el.addEventListener("pointerleave", off);
  }

  bindHold(document.getElementById("up-btn"), "up");
  bindHold(document.getElementById("down-btn"), "down");
  document.getElementById("door-btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    toggleDoors();
  });

  startBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", () => goMenu(false));

  requestAnimationFrame(frame);

  try {
    if (window.AmalHub && AmalHub.setPresence) AmalHub.setPresence("lift-void");
  } catch (_) {}
})();
