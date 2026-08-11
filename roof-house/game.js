(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("title");
  const blurbEl = document.getElementById("blurb");
  const startBtn = document.getElementById("start-btn");
  const hud = document.getElementById("hud");
  const floorEl = document.getElementById("floor");
  const foundEl = document.getElementById("found");
  const roofEl = document.getElementById("roof");
  const hintEl = document.getElementById("hint");
  const touch = document.getElementById("touch");
  const menuBtn = document.getElementById("menu-btn");

  const W = canvas.width;
  const H = canvas.height;
  const FLOOR_H = 48;
  const BUILD_X = 520;
  const BUILD_W = 360;
  const STAIR_X = 480;
  const SPEED = 210;

  const FLOORS = [
    {
      id: "basement",
      name: "Подвал",
      color: "#3a3040",
      accent: "#8a7080",
      icon: "🕯",
      prop: "коробка",
      px: 680,
      line: "Коробка шепчет: «я — этаж 0, меня забыли».",
      done: "Коробка довольна. Подвал больше не скучает.",
    },
    {
      id: "leaves",
      name: "Листья",
      color: "#2a4030",
      accent: "#6cb85a",
      icon: "🍂",
      prop: "куча листьев",
      px: 720,
      line: "Листья на полу… в комнате… зимой. Классика.",
      done: "Ты прыгнул в листья. Хруст — как в Roblox, только 2D.",
    },
    {
      id: "upside",
      name: "Вверх ногами",
      color: "#403050",
      accent: "#c47aff",
      icon: "🙃",
      prop: "диван",
      px: 640,
      line: "Диван на потолке. Логично. Absolutely.",
      done: "Ты лёг на «потолок». Гравитация обиделась.",
    },
    {
      id: "rain",
      name: "Дождь",
      color: "#2a3858",
      accent: "#6a9ec0",
      icon: "🌧",
      prop: "окно",
      px: 700,
      line: "Дождь идёт внутри. Зонтик на стуле молчит.",
      done: "Окно извинилось. Дождь остался — он живёт здесь.",
    },
    {
      id: "talk",
      name: "Мебель",
      color: "#4a3828",
      accent: "#e8a060",
      icon: "🪑",
      prop: "стул",
      px: 660,
      line: "Стул: «Садись». Стол: «Не садись на меня».",
      done: "Мебель устроила совет. Ты не в курсе решений.",
    },
    {
      id: "mirror",
      name: "Зеркала",
      color: "#304050",
      accent: "#a0d0e8",
      icon: "🪞",
      prop: "зеркало",
      px: 740,
      line: "Отражение машет раньше тебя.",
      done: "Зеркало подмигнуло. Ты — нет (или наоборот).",
    },
    {
      id: "coffee",
      name: "Кофе",
      color: "#483020",
      accent: "#c87840",
      icon: "☕",
      prop: "чашка",
      px: 690,
      line: "Чашка размером с комнату. Эспрессо-здание.",
      done: "Глоток воздуха. Кофеин через кожу. Ускорение +∞.",
    },
    {
      id: "party",
      name: "Вечеринка",
      color: "#502848",
      accent: "#ff6b9a",
      icon: "🎈",
      prop: "шарики",
      px: 710,
      line: "Музыка громкая. Гостей нет. Шарики танцуют сами.",
      done: "Ты потанцевал с шариком. Он выиграл.",
    },
    {
      id: "library",
      name: "Библиотека",
      color: "#283848",
      accent: "#d8c8a0",
      icon: "📚",
      prop: "книга",
      px: 650,
      line: "Книга читает тебя вслух.",
      done: "Глава закончилась. Ты — побочный персонаж.",
    },
    {
      id: "void",
      name: "Пустота",
      color: "#181420",
      accent: "#8060c0",
      icon: "∅",
      prop: "ничего",
      px: 700,
      line: "Комната пустая. Очень. Даже воздух стесняется.",
      done: "Ты помахал пустоте. Пустота помахала в ответ.",
    },
  ];

  const ROOF = {
    name: "Крыша",
    line: "Звёзды, ветер и чайник, который кипит без огня.",
    done: "Ты на крыше! Дом снизу выглядит ещё страннее.",
  };

  /** @type {'menu'|'play'|'win'} */
  let mode = "menu";
  let time = 0;
  let floorIdx = 0;
  let onRoof = false;
  /** @type {Record<string, boolean>} */
  let opened = {};
  let message = "";
  let messageT = 0;
  let invertFloor = -1;
  let invertT = 0;
  let rainDrops = [];
  let particles = [];
  let stairCd = 0;
  const admin = { god: false };

  function isSiteOwner() {
    try {
      if (window.__AMAL_OWNER__ || window.__AMAL_GOD__ || window.__AMAL_LEGEND__) return true;
      if (window.AmalPowers && AmalPowers.isOwner && AmalPowers.isOwner()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
    } catch (_) {}
    return false;
  }

  function applyOwnerDefaults() {
    if (!isSiteOwner()) return;
    admin.god = true;
  }

  function handlePower(detail) {
    const type = detail && detail.type;
    if (!type) return;
    if (type === "god" || type === "owner-legend" || type === "max") {
      admin.god = true;
      FLOORS.forEach((f) => {
        opened[f.id] = true;
      });
      updateHud();
      showMsg("Админ: все этажи открыты", 2);
    }
    if (type === "rh-all" || type === "unlock" || type === "max") {
      FLOORS.forEach((f) => {
        opened[f.id] = true;
      });
      updateHud();
      showMsg("🔓 Все этажи открыты", 2);
    }
    if (type === "rh-roof" || type === "max") {
      FLOORS.forEach((f) => {
        opened[f.id] = true;
      });
      onRoof = true;
      player.x = BUILD_X + BUILD_W / 2;
      syncPlayerY();
      mode = "play";
      overlay.classList.add("hidden");
      hud.classList.remove("hidden");
      updateHud();
      showMsg("🏠 Ты на крыше (админ)", 2);
    }
    if (type === "rh-next") {
      if (onRoof) return;
      if (floorIdx < FLOORS.length - 1) {
        floorIdx += 1;
        syncPlayerY();
        player.x = STAIR_X;
        updateHud();
      } else if (allOpened() || admin.god) {
        onRoof = true;
        player.x = BUILD_X + BUILD_W / 2;
        syncPlayerY();
        updateHud();
      }
    }
  }

  window.addEventListener("amal-power", (e) => handlePower(e.detail || {}));
  window.addEventListener("amal-powers-applied", applyOwnerDefaults);
  window.addEventListener("amal-owner-changed", applyOwnerDefaults);
  setTimeout(applyOwnerDefaults, 400);

  const player = { x: 600, y: 0, w: 22, h: 32, vx: 0, facing: 1 };
  const keys = Object.create(null);
  const touchHeld = Object.create(null);

  function resetOpened() {
    opened = {};
    FLOORS.forEach((f) => {
      opened[f.id] = false;
    });
  }

  function countOpened() {
    return FLOORS.filter((f) => opened[f.id]).length;
  }

  function allOpened() {
    return countOpened() >= FLOORS.length;
  }

  function showMsg(text, sec) {
    message = text;
    messageT = sec || 2.8;
  }

  function floorScreenY(i) {
    return H - 80 - (i + 1) * FLOOR_H;
  }

  function syncPlayerY() {
    if (onRoof) {
      player.y = 36;
      return;
    }
    player.y = floorScreenY(floorIdx) + FLOOR_H - player.h - 6;
  }

  function startGame() {
    floorIdx = 0;
    onRoof = false;
    resetOpened();
    rainDrops = [];
    particles = [];
    invertFloor = -1;
    invertT = 0;
    player.x = 600;
    syncPlayerY();
    mode = "play";
    overlay.classList.add("hidden");
    hud.classList.remove("hidden");
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) {
      touch.classList.remove("hidden");
    }
    showMsg("Поднимись по лестнице (↑↓ слева). На каждом этаже жми E у странности.", 3.5);
    updateHud();
    canvas.focus();
  }

  function goMenu(won) {
    mode = won ? "win" : "menu";
    hud.classList.add("hidden");
    touch.classList.add("hidden");
    overlay.classList.remove("hidden");
    if (won) {
      titleEl.textContent = "Крыша твоя";
      blurbEl.textContent =
        "Ты открыл все странные этажи и вышел на крышу. Дом запомнит тебя (может быть).";
      startBtn.textContent = "Снова в дом";
    } else {
      titleEl.textContent = "Крыша есть — этажей слишком много";
      blurbEl.textContent =
        "Разрез дома: поднимайся по лестнице, заходи в комнаты. На каждом этаже — что-то смешное и странное. Открой все десять — и доберись до крыши.";
      startBtn.textContent = "Войти в дом";
    }
  }

  function updateHud() {
    const n = countOpened();
    foundEl.textContent = `Открыто: ${n}/${FLOORS.length}`;
    if (onRoof) {
      floorEl.textContent = `Этаж: ${ROOF.name} 🏠`;
      roofEl.textContent = "Крыша: открыта ✓";
    } else {
      floorEl.textContent = `Этаж: ${FLOORS[floorIdx].name} ${FLOORS[floorIdx].icon}`;
      roofEl.textContent = allOpened() ? "Крыша: можно идти ↑" : "Крыша: закрыта";
    }
    hintEl.textContent = allOpened() && !onRoof
      ? "Все этажи открыты! Иди на лестнице вверх — на крышу."
      : "←→ — ходьба · ↑↓ у лестницы — этаж · E — странность";
  }

  function nearStairs() {
    return Math.abs(player.x - STAIR_X) < 36;
  }

  function nearProp() {
    if (onRoof) return player.x > BUILD_X + 80 && player.x < BUILD_X + BUILD_W - 40;
    const f = FLOORS[floorIdx];
    return Math.abs(player.x - f.px) < 50;
  }

  function tryUse() {
    if (mode !== "play") return;

    if (onRoof) {
      if (!opened.roof) {
        opened.roof = true;
        spawnBurst(W / 2, 80, "#f0c36a");
        showMsg(ROOF.done, 3);
        setTimeout(() => {
          mode = "win";
          goMenu(true);
        }, 1200);
      }
      return;
    }

    const f = FLOORS[floorIdx];
    if (!nearProp()) {
      showMsg(`Подойди к ${f.prop} (${f.icon})`, 1.4);
      return;
    }

    if (!opened[f.id]) {
      opened[f.id] = true;
      spawnBurst(f.px, player.y, f.accent);
      showMsg(f.line, 2.8);
      setTimeout(() => showMsg(f.done, 2.5), 2200);
      if (f.id === "upside") {
        invertFloor = floorIdx;
        invertT = 3;
      }
      if (f.id === "rain") {
        for (let i = 0; i < 30; i++) {
          rainDrops.push({ x: Math.random() * BUILD_W + BUILD_X, y: Math.random() * H, vy: 80 + Math.random() * 60 });
        }
      }
      updateHud();
      return;
    }
    showMsg(f.done, 2);
  }

  function spawnBurst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 120,
        life: 0.45 + Math.random() * 0.35,
        color,
      });
    }
  }

  function tryChangeFloor(dir) {
    if (stairCd > 0) return;
    if (!nearStairs() && !(admin.god && isSiteOwner())) return;
    stairCd = 0.28;
    if (onRoof) {
      if (dir < 0) {
        onRoof = false;
        floorIdx = FLOORS.length - 1;
        syncPlayerY();
        showMsg("Спуск с крыши", 1.2);
      }
      return;
    }
    if (dir > 0 && floorIdx >= FLOORS.length - 1) {
      if (allOpened() || admin.god) {
        onRoof = true;
        player.x = BUILD_X + BUILD_W / 2;
        syncPlayerY();
        showMsg(ROOF.line, 3);
      } else {
        showMsg(`Крыша закрыта. Открой ещё ${FLOORS.length - countOpened()} этаж(ей).`, 2.2);
      }
      return;
    }
    const next = floorIdx + dir;
    if (next < 0 || next >= FLOORS.length) return;
    floorIdx = next;
    syncPlayerY();
    player.x = STAIR_X;
  }

  function update(dt) {
    if (mode !== "play") return;
    time += dt;
    if (stairCd > 0) stairCd -= dt;
    if (messageT > 0) messageT -= dt;
    if (invertT > 0) {
      invertT -= dt;
      if (invertT <= 0) invertFloor = -1;
    }

    let mx = 0;
    if (keys.ArrowLeft || keys.KeyA || touchHeld.left) mx -= 1;
    if (keys.ArrowRight || keys.KeyD || touchHeld.right) mx += 1;
    if (mx) {
      player.vx = mx * SPEED;
      player.facing = mx;
      player.x = Math.max(BUILD_X + 20, Math.min(BUILD_X + BUILD_W - 30, player.x + player.vx * dt));
    }

    if (keys.ArrowUp || keys.KeyW || touchHeld.up) tryChangeFloor(1);
    if (keys.ArrowDown || keys.KeyS || touchHeld.down) tryChangeFloor(-1);

    for (const d of rainDrops) {
      d.y += d.vy * dt;
      if (d.y > H) d.y = floorScreenY(3);
    }

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

  function drawBuilding() {
    ctx.fillStyle = "#0c0810";
    ctx.fillRect(0, 0, W, H);

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, onRoof ? "#1a2040" : "#2a3048");
    sky.addColorStop(1, "#100c14");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    if (onRoof) {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 3) * 0.15})`;
        ctx.fillRect((i * 97) % W, (i * 53) % 120, 2, 2);
      }
    }

    // roof cap
    ctx.fillStyle = "#5a4030";
    ctx.beginPath();
    ctx.moveTo(BUILD_X - 20, onRoof ? 70 : floorScreenY(FLOORS.length - 1) - 8);
    ctx.lineTo(BUILD_X + BUILD_W / 2, onRoof ? 20 : floorScreenY(FLOORS.length - 1) - 38);
    ctx.lineTo(BUILD_X + BUILD_W + 20, onRoof ? 70 : floorScreenY(FLOORS.length - 1) - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7ed9b8";
    ctx.font = "800 11px Manrope";
    ctx.fillText("КРЫША", BUILD_X + BUILD_W / 2 - 24, onRoof ? 52 : floorScreenY(FLOORS.length - 1) - 12);

    if (onRoof) {
      ctx.fillStyle = "#3a5040";
      roundRect(BUILD_X + 40, 90, BUILD_W - 80, 50, 8);
      ctx.fill();
      ctx.font = "48px Manrope";
      ctx.fillText("🫖", BUILD_X + BUILD_W / 2 - 20, 130);
      ctx.fillStyle = "#fff";
      ctx.font = "700 12px Manrope";
      ctx.textAlign = "center";
      ctx.fillText("чайник без огня · E", BUILD_X + BUILD_W / 2, 160);
      ctx.textAlign = "left";
    }

    // floors stack
    for (let i = FLOORS.length - 1; i >= 0; i--) {
      const f = FLOORS[i];
      const fy = floorScreenY(i);
      const active = !onRoof && i === floorIdx;
      ctx.fillStyle = f.color;
      roundRect(BUILD_X, fy, BUILD_W, FLOOR_H - 4, 6);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = "#f0c36a";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const flipped = invertFloor === i && invertT > 0;
      ctx.save();
      if (flipped) {
        ctx.translate(BUILD_X + BUILD_W / 2, fy + FLOOR_H / 2);
        ctx.scale(1, -1);
        ctx.translate(-(BUILD_X + BUILD_W / 2), -(fy + FLOOR_H / 2));
      }

      // prop
      ctx.font = "28px Manrope";
      ctx.fillText(f.icon, f.px - BUILD_X + BUILD_X - 14, fy + 34);
      if (opened[f.id]) {
        ctx.fillStyle = "#7ed9b8";
        ctx.font = "800 14px Manrope";
        ctx.fillText("✓", f.px + 12, fy + 22);
      }

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "700 11px Manrope";
      ctx.fillText(f.name, BUILD_X + 12, fy + 18);
      ctx.restore();

      if (f.id === "rain" && opened.rain) {
        ctx.fillStyle = "rgba(100,160,220,0.35)";
        for (const d of rainDrops) {
          ctx.fillRect(d.x, d.y, 2, 8);
        }
      }
    }

    // stairs
    ctx.fillStyle = "#4a4048";
    for (let i = 0; i <= FLOORS.length; i++) {
      const sy = onRoof && i === FLOORS.length ? 70 : floorScreenY(Math.min(i, FLOORS.length - 1)) + (i < FLOORS.length ? FLOOR_H : 0);
      if (onRoof && i < FLOORS.length) continue;
      ctx.fillRect(STAIR_X - 18, sy - 6, 36, 8);
    }
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "700 10px Manrope";
    ctx.textAlign = "center";
    ctx.fillText("лестница", STAIR_X, H - 24);
    ctx.textAlign = "left";

    // player
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(player.x + 11, player.y + player.h + 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8e0d4";
    roundRect(player.x, player.y, player.w, player.h, 7);
    ctx.fill();
    ctx.fillStyle = "#5a4080";
    ctx.fillRect(player.x, player.y + 16, player.w, 8);
    ctx.fillStyle = "#f0c8a0";
    ctx.beginPath();
    ctx.arc(player.x + 11, player.y - 6, 9, 0, Math.PI * 2);
    ctx.fill();

    if (nearProp() && !onRoof && !opened[FLOORS[floorIdx].id]) {
      ctx.strokeStyle = "#7ed9b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(FLOORS[floorIdx].px, player.y + 10, 36 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#7ed9b8";
      ctx.font = "800 12px Manrope";
      ctx.textAlign = "center";
      ctx.fillText("E", FLOORS[floorIdx].px, player.y - 16);
      ctx.textAlign = "left";
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (messageT > 0) {
      ctx.fillStyle = `rgba(12,10,18,${Math.min(0.92, messageT * 0.7)})`;
      roundRect(40, H - 86, W - 80, 52, 10);
      ctx.fill();
      ctx.fillStyle = "#f4efe8";
      ctx.font = "700 13px Manrope";
      ctx.textAlign = "center";
      ctx.fillText(message, W / 2, H - 54);
      ctx.textAlign = "left";
    }
  }

  function draw() {
    if (mode === "play" || mode === "win") drawBuilding();
    else {
      ctx.fillStyle = "#100c14";
      ctx.fillRect(0, 0, W, H);
      ctx.font = "700 56px Manrope";
      ctx.textAlign = "center";
      ctx.fillText("🏠", W / 2, H / 2);
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
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyE") tryUse();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  function bindTouch(btn, key) {
    const on = (e) => {
      e.preventDefault();
      touchHeld[key] = true;
    };
    const off = (e) => {
      e.preventDefault();
      touchHeld[key] = false;
    };
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointercancel", off);
    btn.addEventListener("pointerleave", off);
  }

  touch.querySelectorAll("[data-dir]").forEach((btn) => {
    bindTouch(btn, btn.getAttribute("data-dir"));
  });
  document.getElementById("use-btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tryUse();
  });

  startBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", () => goMenu(false));

  requestAnimationFrame(frame);

  try {
    if (window.AmalHub && AmalHub.setPresence) AmalHub.setPresence("roof-house");
  } catch (_) {}
})();
