(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const hud = document.getElementById("hud");
  const controls = document.getElementById("controls");
  const stitchesEl = document.getElementById("stitches");
  const msgEl = document.getElementById("msg");
  const startBtn = document.getElementById("start-btn");
  const dashBtn = document.getElementById("dash-btn");
  const menuBtn = document.getElementById("menu-btn");
  const titleEl = document.getElementById("title");
  const blurbEl = document.getElementById("blurb");

  const DEFAULT_BLURB =
    "<strong>Ты ходишь сам</strong> — стрелки внизу, WASD или клик по карте.<br />" +
    "Собери фиолетовые нити, потом коснись зелёного <strong>УТРО</strong>.<br />" +
    "От тени — кнопка <strong>РЫВОК</strong>.";

  const W = canvas.width;
  const H = canvas.height;
  const NEED = 5;
  const R = 12;

  const keys = Object.create(null);
  const hold = Object.create(null);

  let running = false;
  let time = 0;
  let collected = 0;
  let dashCd = 0;
  let dashT = 0;
  let invuln = 0;
  let pointerTarget = null;
  let admin = {
    god: false,
    speed: false,
    infDash: false,
    freezeShadow: false,
    noShadow: false,
  };
  let player = { x: 120, y: 270, dx: 0, dy: 0 };
  let shadow = { x: 800, y: 270 };
  let threads = [];
  let morning = { x: 880, y: 270 };
  let walls = [];
  let particles = [];

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
    admin.speed = true;
    admin.infDash = true;
    if (msgEl) msgEl.textContent = "Админ · тень не берёт · ∞ рывок · ходишь сам";
  }

  function resetLevel() {
    collected = 0;
    dashCd = 0;
    dashT = 0;
    invuln = 0;
    pointerTarget = null;
    player = { x: 100, y: H / 2, dx: 0, dy: 0 };
    shadow = { x: W - 80, y: H / 2 };
    morning = { x: W - 70, y: 80 + Math.random() * (H - 160) };
    walls = [];
    for (let i = 0; i < 7; i++) {
      walls.push({
        x: 160 + Math.random() * (W - 320),
        y: 60 + Math.random() * (H - 140),
        w: 36 + Math.random() * 60,
        h: 36 + Math.random() * 60,
      });
    }
    threads = [];
    for (let i = 0; i < NEED; i++) {
      threads.push({
        x: 180 + Math.random() * (W - 320),
        y: 80 + Math.random() * (H - 160),
        taken: false,
        hue: 250 + Math.random() * 80,
      });
    }
    particles = [];
  }

  function blocked(x, y) {
    if (x < R || y < R || x > W - R || y > H - R) return true;
    for (const w of walls) {
      if (x > w.x - R && x < w.x + w.w + R && y > w.y - R && y < w.y + w.h + R) return true;
    }
    return false;
  }

  function moveEntity(ent, vx, vy) {
    if (!vx && !vy) return;
    const nx = ent.x + vx;
    const ny = ent.y + vy;
    if (!blocked(nx, ent.y)) ent.x = nx;
    if (!blocked(ent.x, ny)) ent.y = ny;
  }

  function moveTowards(ent, tx, ty, speed, dt) {
    const dx = tx - ent.x;
    const dy = ty - ent.y;
    const d = Math.hypot(dx, dy) || 1;
    moveEntity(ent, (dx / d) * speed * dt, (dy / d) * speed * dt);
    return d;
  }

  function inputDir() {
    let mx = 0;
    let my = 0;
    if (keys.ArrowLeft || keys.KeyA || hold.left) mx -= 1;
    if (keys.ArrowRight || keys.KeyD || hold.right) mx += 1;
    if (keys.ArrowUp || keys.KeyW || hold.up) my -= 1;
    if (keys.ArrowDown || keys.KeyS || hold.down) my += 1;

    if (mx || my) {
      pointerTarget = null;
      const len = Math.hypot(mx, my) || 1;
      return { x: mx / len, y: my / len };
    }

    if (pointerTarget) {
      const dx = pointerTarget.x - player.x;
      const dy = pointerTarget.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        pointerTarget = null;
        return { x: 0, y: 0 };
      }
      return { x: dx / dist, y: dy / dist };
    }

    return { x: 0, y: 0 };
  }

  function targetThread() {
    return threads.find((t) => !t.taken) || null;
  }

  function doDash() {
    if (!running || (dashCd > 0 && !admin.infDash)) return;
    let dir = inputDir();
    if (!dir.x && !dir.y) {
      const awayX = player.x - shadow.x;
      const awayY = player.y - shadow.y;
      const ad = Math.hypot(awayX, awayY) || 1;
      dir = { x: awayX / ad, y: awayY / ad };
    }
    player.x = Math.max(R, Math.min(W - R, player.x + dir.x * 90));
    player.y = Math.max(R, Math.min(H - R, player.y + dir.y * 90));
    if (!admin.infDash) dashCd = 1.2;
    else dashCd = 0;
    dashT = 0.18;
    invuln = admin.god ? 2 : 0.55;
    msgEl.textContent = "Рывок!";
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.4,
      });
    }
    updateDash();
  }

  function updateDash() {
    dashBtn.disabled = dashCd > 0 && !admin.infDash;
    dashBtn.textContent = admin.infDash ? "РЫВОК ∞" : dashCd > 0 ? `РЫВОК ${dashCd.toFixed(1)}с` : "РЫВОК";
  }

  function collectAllThreads() {
    threads.forEach((th) => {
      th.taken = true;
    });
    collected = NEED;
    stitchesEl.textContent = `Нити: ${collected}/${NEED}`;
    msgEl.textContent = "Админ: все нити · иди к УТРО";
  }

  function handlePower(detail) {
    const type = detail && detail.type;
    if (!type) return;
    if (type === "god" || type === "owner-legend") {
      admin.god = true;
      invuln = 999;
      msgEl.textContent = "🛡 Бессмертие: тень не берёт";
    }
    if (type === "heal") {
      invuln = Math.max(invuln, 1.5);
      msgEl.textContent = "💚 Ясность полная";
    }
    if (type === "speed") {
      admin.speed = true;
      msgEl.textContent = "⚡ Супер-бег";
    }
    if (type === "ns-dash" || type === "unlock") {
      admin.infDash = true;
      dashCd = 0;
      updateDash();
    }
    if (type === "ns-banish") {
      admin.noShadow = true;
      shadow.x = -200;
      shadow.y = -200;
      msgEl.textContent = "👻 Тень убрана";
    }
    if (type === "ns-freeze") {
      admin.freezeShadow = true;
      msgEl.textContent = "❄️ Тень заморожена";
    }
    if (type === "ns-threads") {
      if (!running) start();
      collectAllThreads();
    }
    if (type === "ns-win" || type === "max") {
      if (!running) start();
      if (type === "max") {
        admin.god = true;
        admin.speed = true;
        admin.infDash = true;
        admin.freezeShadow = true;
      }
      collectAllThreads();
      if (type === "ns-win") {
        end("Победа (админ)", "Мгновенное утро. Хозяин решил, что сон закончен.");
      } else {
        msgEl.textContent = "⚡ ВСЁ НА МАКС";
      }
    }
  }

  function start() {
    resetLevel();
    running = true;
    time = 0;
    overlay.classList.add("hidden");
    hud.classList.remove("hidden");
    controls.classList.remove("hidden");
    msgEl.textContent = "Ходи стрелками / WASD / кликом";
    stitchesEl.textContent = `Нити: 0/${NEED}`;
    applyOwnerDefaults();
    updateDash();
    canvas.focus({ preventScroll: true });
  }

  function showMenu(title, text, btnLabel) {
    running = false;
    controls.classList.add("hidden");
    hud.classList.add("hidden");
    overlay.classList.remove("hidden");
    titleEl.textContent = title;
    blurbEl.innerHTML = text;
    startBtn.textContent = btnLabel || "НАЧАТЬ";
  }

  function end(title, text) {
    showMenu(title, text, "ЕЩЁ РАЗ");
  }

  function goToMenu() {
    showMenu(
      "Нить сна",
      DEFAULT_BLURB + "<br /><br />Ты в меню игры. Нажми <strong>НАЧАТЬ</strong>.",
      "НАЧАТЬ"
    );
  }

  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * W,
      y: ((ev.clientY - rect.top) / rect.height) * H,
    };
  }

  function frame(now) {
    const dt = Math.min(0.033, (frame.p ? now - frame.p : 16) / 1000);
    frame.p = now;

    if (running) {
      time += dt;
      dashCd = Math.max(0, dashCd - dt);
      dashT = Math.max(0, dashT - dt);
      invuln = Math.max(0, invuln - dt);
      updateDash();

      const dir = inputDir();
      const base = admin.speed ? 260 : 175;
      const spd = dashT > 0 ? 480 : base;
      moveEntity(player, dir.x * spd * dt, dir.y * spd * dt);

      if (time > 1.5 && !admin.noShadow && !admin.freezeShadow) {
        const sp = 90 + collected * 8;
        moveTowards(shadow, player.x, player.y, sp, dt);
        const god = admin.god || window.__AMAL_GOD__ || window.__AMAL_LEGEND__;
        if (!god && invuln <= 0 && Math.hypot(player.x - shadow.x, player.y - shadow.y) < 22) {
          end("Тень поймала", "Нажми <strong>ЕЩЁ РАЗ</strong>. Ходи сам и жми <strong>РЫВОК</strong>, когда тень близко.");
        }
      }

      for (const th of threads) {
        if (!th.taken && Math.hypot(th.x - player.x, th.y - player.y) < 26) {
          th.taken = true;
          collected += 1;
          stitchesEl.textContent = `Нити: ${collected}/${NEED}`;
          msgEl.textContent = collected >= NEED ? "Иди к зелёному УТРО!" : "Нить собрана!";
        }
      }

      if (collected >= NEED && Math.hypot(morning.x - player.x, morning.y - player.y) < 30) {
        end("Победа!", "Сон сшит. Можно сыграть ещё.");
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    ctx.fillStyle = "#120a22";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(140,100,200,0.08)";
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    for (const w of walls) {
      ctx.fillStyle = "#2b1b4d";
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    ctx.beginPath();
    ctx.arc(morning.x, morning.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = collected >= NEED ? "#7dffa8" : "#5a4a78";
    ctx.fill();
    ctx.fillStyle = "#12081c";
    ctx.font = "800 11px Manrope";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(collected >= NEED ? "УТРО" : "…", morning.x, morning.y);

    for (const th of threads) {
      if (th.taken) continue;
      ctx.beginPath();
      ctx.arc(th.x, th.y + Math.sin(time * 3 + th.x) * 4, 10, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${th.hue} 85% 68%)`;
      ctx.fill();
    }

    if (!admin.noShadow) {
      ctx.beginPath();
      ctx.arc(shadow.x, shadow.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#1a0a18";
      ctx.fill();
      ctx.strokeStyle = admin.freezeShadow ? "#7ec8ff" : "#ff6a9a";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // soft guide to nearest thread (does NOT pull you)
    const guide = targetThread();
    if (running && guide) {
      ctx.strokeStyle = "rgba(201,160,255,0.25)";
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(guide.x, guide.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (pointerTarget && running) {
      ctx.beginPath();
      ctx.arc(pointerTarget.x, pointerTarget.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201,160,255,0.8)";
      ctx.stroke();
    }

    try {
      const r = canvas.getBoundingClientRect();
      window.__AMAL_NATIVE_PLAYER__ = {
        x: r.left + player.x * (r.width / W),
        y: r.top + player.y * (r.height / H),
        face: hold.left ? -1 : hold.right ? 1 : 0,
        t: Date.now(),
      };
      window.__AMAL_HIDE_NATIVE__ = true;
    } catch (_) {}
    if (!window.AmalWorld) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = invuln > 0 ? "#ffe08a" : "#dcc8ff";
      ctx.fill();
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(p.x, p.y, 3, 3);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  }
  frame.p = 0;

  startBtn.addEventListener("click", start);
  dashBtn.addEventListener("click", doDash);
  menuBtn.addEventListener("click", goToMenu);

  canvas.addEventListener("pointerdown", (ev) => {
    if (!running) return;
    canvas.focus({ preventScroll: true });
    pointerTarget = canvasPoint(ev);
  });

  document.querySelectorAll(".pad button").forEach((btn) => {
    const dir = btn.dataset.dir;
    const down = (ev) => {
      ev.preventDefault();
      hold[dir] = true;
      btn.classList.add("held");
      pointerTarget = null;
    };
    const up = (ev) => {
      ev.preventDefault();
      hold[dir] = false;
      btn.classList.remove("held");
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
  });

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (e.code === "Space") {
      if (!running) start();
      else doDash();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  window.addEventListener("amal-power", (e) => handlePower(e.detail || {}));
  window.addEventListener("amal-powers-applied", () => applyOwnerDefaults());
  window.addEventListener("amal-owner-changed", () => applyOwnerDefaults());

  requestAnimationFrame(frame);
})();
