(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("title");
  const blurbEl = document.getElementById("blurb");
  const startBtn = document.getElementById("start-btn");
  const hud = document.getElementById("hud");
  const answersEl = document.getElementById("answers");
  const bellEl = document.getElementById("bell");
  const heldEl = document.getElementById("held");
  const hintEl = document.getElementById("hint");
  const touch = document.getElementById("touch");
  const menuBtn = document.getElementById("menu-btn");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND = 460;
  const WORLD_W = 2800;
  const GRAVITY = 0.62;
  const MOVE = 1.35;
  const MAX_SPEED = 11;
  const JUMP = -18.5;
  const GOAL = 5;

  const SUBJECTS = [
    { id: "dream", name: "Сны", color: "#c4a1ff", glyph: "◇", ask: "Сколько весит чужой сон?" },
    { id: "echo", name: "Эхо", color: "#7ec8ff", glyph: "∿", ask: "Куда уходит ответ без вопроса?" },
    { id: "ink", name: "Чернила", color: "#ff7a6e", glyph: "✦", ask: "Чей почерк пишет стену?" },
    { id: "clock", name: "Часы", color: "#f0c36a", glyph: "◎", ask: "Который час в пустой клетке?" },
    { id: "door", name: "Двери", color: "#7ed9b8", glyph: "⌂", ask: "Какая дверь ведёт в «здесь»?" },
  ];

  /** @type {'menu'|'play'|'end'} */
  let mode = "menu";
  let time = 0;
  let score = 0;
  let bell = 100;
  let flipT = 0;
  let message = "";
  let messageT = 0;
  let camX = 0;
  let invert = false;

  const keys = Object.create(null);
  const touchHeld = Object.create(null);

  const player = {
    x: 120,
    y: 200,
    w: 24,
    h: 36,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    held: null,
  };

  /** @type {{x:number,y:number,w:number,h:number}[]} */
  let platforms = [];
  /** @type {{id:string,x:number,y:number,subject:typeof SUBJECTS[0],taken:boolean,bob:number}[]} */
  let chalks = [];
  /** @type {{id:string,x:number,y:number,subject:typeof SUBJECTS[0],done:boolean,bob:number,pulse:number}[]} */
  let students = [];
  /** @type {{x:number,y:number,vx:number,life:number,color:string}[]} */
  let particles = [];
  let hunter = { x: 2200, y: GROUND - 40, vx: -1.6, t: 0 };

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function showMsg(text, sec) {
    message = text;
    messageT = sec || 2.4;
  }

  function buildWorld() {
    platforms = [
      { x: 0, y: GROUND, w: WORLD_W, h: 80 },
      { x: 280, y: 360, w: 160, h: 18 },
      { x: 560, y: 300, w: 140, h: 18 },
      { x: 860, y: 340, w: 180, h: 18 },
      { x: 1180, y: 280, w: 150, h: 18 },
      { x: 1480, y: 350, w: 170, h: 18 },
      { x: 1800, y: 300, w: 160, h: 18 },
      { x: 2100, y: 360, w: 190, h: 18 },
      { x: 2400, y: 290, w: 140, h: 18 },
    ];

    const order = SUBJECTS.slice().sort(() => Math.random() - 0.5);
    chalks = order.map((sub, i) => ({
      id: "c" + i,
      x: 220 + i * 480 + rand(-40, 60),
      y: [320, 260, 300, 250, 310][i] - 28,
      subject: sub,
      taken: false,
      bob: Math.random() * Math.PI * 2,
    }));

    const deskXs = [420, 920, 1420, 1920, 2420];
    students = order
      .slice()
      .sort(() => Math.random() - 0.5)
      .map((sub, i) => ({
        id: "s" + i,
        x: deskXs[i],
        y: GROUND - 8,
        subject: sub,
        done: false,
        bob: Math.random() * 10,
        pulse: 0,
      }));

    hunter = { x: WORLD_W - 200, y: GROUND - 40, vx: -1.8, t: 0 };
    particles = [];
  }

  function resetPlayer() {
    player.x = 120;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    player.held = null;
    player.facing = 1;
  }

  function startGame() {
    score = 0;
    bell = 100;
    time = 0;
    flipT = 0;
    invert = false;
    buildWorld();
    resetPlayer();
    mode = "play";
    overlay.classList.add("hidden");
    hud.classList.remove("hidden");
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) {
      touch.classList.remove("hidden");
    }
    showMsg("Мел лежит на партах в воздухе. Отнеси правильный ответ ученику.", 3.2);
    canvas.focus();
    updateHud();
  }

  function goMenu(endTitle, endBlurb) {
    mode = endTitle ? "end" : "menu";
    hud.classList.add("hidden");
    touch.classList.add("hidden");
    overlay.classList.remove("hidden");
    if (endTitle) {
      titleEl.textContent = endTitle;
      blurbEl.textContent = endBlurb;
      startBtn.textContent = "Ещё один урок";
    } else {
      titleEl.textContent = "В расписании — пустая клетка";
      blurbEl.textContent =
        "Школа открывается только в щели между звонками. Призраки-ученики ждут ответы, которых никто не писал. Собери мел с пола, отдай нужный ответ — и урок станет настоящим.";
      startBtn.textContent = "Открыть класс";
    }
  }

  function updateHud() {
    answersEl.textContent = `Ответы: ${score}/${GOAL}`;
    bellEl.textContent = "Звонок: выкл";
    heldEl.textContent = player.held
      ? `В руках: ${player.held.glyph} ${player.held.name}`
      : "В руках: —";
    if (invert) hintEl.textContent = "⚠ Пустой учитель перевернул мир — ищи выход!";
    else hintEl.textContent = "WASD / стрелки · E — взять / отдать · пробел — прыжок";
  }

  function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function tryUse() {
    if (mode !== "play") return;

    if (!player.held) {
      for (const c of chalks) {
        if (c.taken) continue;
        if (Math.hypot(c.x - (player.x + player.w / 2), c.y - (player.y + player.h / 2)) < 46) {
          c.taken = true;
          player.held = c.subject;
          showMsg(`Взял ответ: ${c.subject.glyph} ${c.subject.name}`, 1.8);
          spawnBurst(c.x, c.y, c.subject.color);
          updateHud();
          return;
        }
      }
      showMsg("Подойди к парящему мелу", 1.2);
      return;
    }

    for (const s of students) {
      if (s.done) continue;
      if (Math.abs(s.x - (player.x + player.w / 2)) < 55 && Math.abs(s.y - player.y - player.h) < 70) {
        if (s.subject.id === player.held.id) {
          s.done = true;
          s.pulse = 1;
          score += 1;
          spawnBurst(s.x, s.y - 40, s.subject.color);
          showMsg(`Верно! «${s.subject.ask}» — закрыто.`, 2.5);
          bell = Math.min(100, bell + 8);
          player.held = null;
          updateHud();
          if (score >= GOAL) {
            mode = "end";
            setTimeout(() => {
              goMenu(
                "Урок стал настоящим",
                `Ты закрыл ${GOAL} ответов. Пустая клетка в расписании больше не пустая — пока.`
              );
            }, 700);
          }
        } else {
          invert = true;
          flipT = 4.5;
          bell -= 12;
          showMsg("Не тот ответ… мир перевернулся!", 2.2);
          player.held = null;
          spawnBurst(s.x, s.y - 30, "#ff7a6e");
          updateHud();
        }
        return;
      }
    }
    showMsg("Отнеси мел ученику с тем же знаком", 1.5);
  }

  function spawnBurst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      particles.push({
        x,
        y,
        vx: rand(-120, 120),
        life: rand(0.35, 0.7),
        color,
      });
    }
  }

  function movePlayer(dt) {
    let mx = 0;
    if (keys.KeyA || keys.ArrowLeft || touchHeld.left) mx -= 1;
    if (keys.KeyD || keys.ArrowRight || touchHeld.right) mx += 1;
    if (invert) mx *= -1;

    if (mx !== 0) {
      player.vx += mx * MOVE * 60 * dt;
      player.facing = mx > 0 ? 1 : -1;
    } else {
      player.vx *= Math.pow(0.82, dt * 60);
    }
    player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));

    const wantJump = keys.Space || keys.KeyW || keys.ArrowUp || touchHeld.up || touchHeld.jump;
    if (wantJump && player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
    }

    player.vy += GRAVITY * 60 * dt;
    player.vy = Math.min(14, player.vy);

    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;

    for (const p of platforms) {
      if (!rectHit(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) continue;
      const prevBottom = player.y + player.h - player.vy;
      if (player.vy >= 0 && prevBottom <= p.y + 8) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && player.y > p.y) {
        player.y = p.y + p.h;
        player.vy = 0;
      } else if (player.vx > 0) {
        player.x = p.x - player.w;
        player.vx = 0;
      } else if (player.vx < 0) {
        player.x = p.x + p.w;
        player.vx = 0;
      }
    }

    player.x = Math.max(8, Math.min(WORLD_W - player.w - 8, player.x));
    if (player.y > H + 80) {
      player.x = 120;
      player.y = 200;
      player.vx = 0;
      player.vy = 0;
      bell -= 6;
      showMsg("Упал в чернила расписания…", 1.6);
      updateHud();
    }
  }

  function update(dt) {
    if (mode !== "play") return;
    time += dt;
    if (messageT > 0) messageT -= dt;

    // звонок выключен — играй спокойно, без таймера
    bell = 100;

    if (flipT > 0) {
      flipT -= dt;
      if (flipT <= 0) invert = false;
    }

    movePlayer(dt);

    for (const c of chalks) {
      if (!c.taken) c.bob += dt * 3;
    }
    for (const s of students) {
      s.bob += dt * 2;
      if (s.pulse > 0) s.pulse -= dt;
    }

    hunter.t += dt;
    hunter.x += hunter.vx;
    if (hunter.x < 80 || hunter.x > WORLD_W - 80) hunter.vx *= -1;
    hunter.y = GROUND - 40 + Math.sin(hunter.t * 3) * 6;
    if (
      Math.hypot(hunter.x - (player.x + 12), hunter.y - (player.y + 18)) < 42 &&
      flipT <= 0
    ) {
      invert = true;
      flipT = 3.2;
      bell -= 8;
      showMsg("Пустой учитель коснулся тебя — мир вверх ногами!", 2.2);
      updateHud();
    }

    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y -= 40 * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    camX = Math.max(0, Math.min(WORLD_W - W, player.x - W * 0.35));
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

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, invert ? "#2a0810" : "#1a1228");
    g.addColorStop(0.55, invert ? "#120818" : "#100c18");
    g.addColorStop(1, "#08060c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-camX * 0.25, 0);
    for (let i = 0; i < 18; i++) {
      const x = (i * 220 + 40) % (WORLD_W * 0.5);
      const h = 120 + (i % 5) * 28;
      ctx.fillStyle = invert ? "rgba(80,20,40,0.35)" : "rgba(40,28,60,0.45)";
      ctx.fillRect(x, GROUND - h - 40, 70 + (i % 3) * 20, h);
    }
    ctx.restore();

    // chalkboard strip
    ctx.save();
    ctx.translate(-camX, 0);
    ctx.fillStyle = invert ? "#3a1820" : "#1e3a32";
    roundRect(40, 70, 320, 110, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(232,240,255,0.75)";
    ctx.font = "700 16px Literata, Georgia, serif";
    ctx.fillText("Доска: урок №∅", 58, 100);
    ctx.font = "600 13px Manrope, sans-serif";
    ctx.fillStyle = "rgba(232,240,255,0.55)";
    ctx.fillText("Тема: то, чего нет в журнале", 58, 128);
    ctx.fillText("Домашнее: вернуть ответы", 58, 150);
    ctx.restore();
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-camX, 0);
    if (invert) {
      ctx.translate(0, H);
      ctx.scale(1, -1);
    }

    for (const p of platforms) {
      if (p.y >= GROUND) {
        ctx.fillStyle = invert ? "#2a1820" : "#2a2438";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = invert ? "rgba(255,100,90,0.25)" : "rgba(240,195,106,0.18)";
        ctx.fillRect(p.x, p.y, p.w, 4);
      } else {
        ctx.fillStyle = "#3a3048";
        roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.stroke();
      }
    }

    // lockers vibe
    for (let i = 0; i < 12; i++) {
      const x = 500 + i * 180;
      ctx.fillStyle = i % 2 ? "#241c30" : "#1c1828";
      roundRect(x, GROUND - 120, 48, 120, 4);
      ctx.fill();
      ctx.fillStyle = "#f0c36a";
      ctx.beginPath();
      ctx.arc(x + 38, GROUND - 60, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of students) {
      const bob = Math.sin(s.bob) * 3;
      ctx.globalAlpha = s.done ? 0.35 : 0.95;
      // desk
      ctx.fillStyle = "#4a3a28";
      roundRect(s.x - 36, s.y - 18, 72, 22, 4);
      ctx.fill();
      // ghost body
      ctx.fillStyle = s.subject.color;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 48 + bob, 16, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#120e18";
      ctx.beginPath();
      ctx.arc(s.x - 5, s.y - 52 + bob, 3, 0, Math.PI * 2);
      ctx.arc(s.x + 5, s.y - 52 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "800 18px Manrope";
      ctx.textAlign = "center";
      ctx.fillText(s.subject.glyph, s.x, s.y - 78 + bob);
      if (!s.done) {
        ctx.font = "700 11px Manrope";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(s.subject.name, s.x, s.y + 18);
      }
      if (s.pulse > 0) {
        ctx.strokeStyle = `rgba(126,217,184,${s.pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y - 48, 30 + (1 - s.pulse) * 20, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }

    for (const c of chalks) {
      if (c.taken) continue;
      const y = c.y + Math.sin(c.bob) * 6;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(c.x, y + 18, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.subject.color;
      roundRect(c.x - 10, y - 18, 20, 28, 5);
      ctx.fill();
      ctx.fillStyle = "#120e18";
      ctx.font = "800 14px Manrope";
      ctx.textAlign = "center";
      ctx.fillText(c.subject.glyph, c.x, y + 2);
      ctx.fillStyle = "#fff";
      ctx.font = "700 10px Manrope";
      ctx.fillText(c.subject.name, c.x, y - 26);
      ctx.textAlign = "left";
    }

    // hunter
    ctx.fillStyle = "rgba(20,8,12,0.9)";
    roundRect(hunter.x - 14, hunter.y - 28, 28, 44, 10);
    ctx.fill();
    ctx.fillStyle = "#ef4d5a";
    ctx.beginPath();
    ctx.arc(hunter.x - 5, hunter.y - 18, 3, 0, Math.PI * 2);
    ctx.arc(hunter.x + 5, hunter.y - 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "700 10px Manrope";
    ctx.fillText("пустой", hunter.x - 18, hunter.y - 40);

    // player
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(player.x + 12, player.y + player.h + 2, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8e0d4";
    roundRect(player.x, player.y, player.w, player.h, 8);
    ctx.fill();
    ctx.fillStyle = "#3a2a58";
    ctx.fillRect(player.x, player.y + 18, player.w, 8);
    ctx.fillStyle = "#f0c8a0";
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    if (player.held) {
      ctx.fillStyle = player.held.color;
      roundRect(player.x + (player.facing > 0 ? 22 : -14), player.y + 8, 14, 18, 3);
      ctx.fill();
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawHudFx() {
    // bell bar
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(W / 2 - 140, 16, 280, 10, 5);
    ctx.fill();
    const bw = (280 * bell) / 100;
    ctx.fillStyle = bell < 30 ? "#ff7a6e" : "#f0c36a";
    roundRect(W / 2 - 140, 16, bw, 10, 5);
    ctx.fill();

    if (messageT > 0) {
      ctx.fillStyle = `rgba(12,8,18,${Math.min(0.85, messageT)})`;
      roundRect(W / 2 - 220, H - 70, 440, 42, 10);
      ctx.fill();
      ctx.fillStyle = "#f3ebe0";
      ctx.font = "700 14px Manrope";
      ctx.textAlign = "center";
      ctx.fillText(message, W / 2, H - 44);
      ctx.textAlign = "left";
    }

    // near prompt
    if (mode === "play") {
      let near = null;
      if (!player.held) {
        near = chalks.find(
          (c) =>
            !c.taken &&
            Math.hypot(c.x - (player.x + 12), c.y - (player.y + 18)) < 46
        );
        if (near) {
          ctx.fillStyle = "#7ed9b8";
          ctx.font = "800 13px Manrope";
          ctx.textAlign = "center";
          ctx.fillText("E — взять ответ", near.x - camX, near.y - 48);
          ctx.textAlign = "left";
        }
      } else {
        near = students.find(
          (s) =>
            !s.done &&
            Math.abs(s.x - (player.x + 12)) < 55 &&
            Math.abs(s.y - player.y - player.h) < 70
        );
        if (near) {
          ctx.fillStyle = near.subject.id === player.held.id ? "#7ed9b8" : "#ff7a6e";
          ctx.font = "800 13px Manrope";
          ctx.textAlign = "center";
          ctx.fillText(
            near.subject.id === player.held.id ? "E — отдать" : "E — чужой ответ!",
            near.x - camX,
            near.y - 100
          );
          ctx.textAlign = "left";
        }
      }
    }
  }

  function draw() {
    drawBackground();
    if (mode === "play") {
      drawWorld();
      drawHudFx();
      return;
    }
    ctx.fillStyle = "rgba(240,195,106,0.18)";
    ctx.font = "700 48px Literata, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("№ ∅", W / 2, H / 2 + 20);
    ctx.textAlign = "left";
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
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
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
  bindTouch(document.getElementById("jump-btn"), "jump");
  document.getElementById("use-btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tryUse();
  });

  startBtn.addEventListener("click", startGame);
  menuBtn.addEventListener("click", () => goMenu());

  requestAnimationFrame(frame);

  try {
    if (window.AmalHub && AmalHub.setPresence) AmalHub.setPresence("ghost-lesson");
  } catch (_) {}
})();
