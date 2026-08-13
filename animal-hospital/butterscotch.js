(() => {
  "use strict";

  const VW = 960;
  const VH = 500;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const play = document.getElementById("play");
  const bubble = document.getElementById("bubble");
  const funEl = document.getElementById("fun");

  const COL = {
    light: "#fff6a8",
    mid: "#f5e06a",
    deep: "#e0c838",
    shade: "#c8a820",
    blue: "#1e3a6e",
    cream: "#fffef5",
  };

  // Fun only goes UP — never drains. No hunger/energy bars.
  let fun = 0;
  let bubbleT = 0;
  let playing = false;
  let last = performance.now();
  let t = 0;
  let particles = [];
  let audioCtx = null;
  let keys = Object.create(null);
  let ball = null;
  let meetFlash = 0;

  const FRIENDS = [
    { kind: "dog", name: "Рекс", color: "#8a6040", accent: "#c8a878" },
    { kind: "dog", name: "Луна", color: "#d0d0d8", accent: "#f0f0f4" },
    { kind: "dog", name: "Тима", color: "#405060", accent: "#708090" },
    { kind: "cat", name: "Мурка", color: "#e8a060", accent: "#f5d0a0" },
    { kind: "cat", name: "Снежок", color: "#f0f0f0", accent: "#ffffff" },
    { kind: "cat", name: "Барсик", color: "#605040", accent: "#a08060" },
  ];

  const pet = {
    x: 200,
    y: VH * 0.62,
    vx: 0,
    facing: 1,
    squish: 0,
    wag: 0,
    mode: "idle", // idle | walk | run | chill | play
    modeT: 0,
    bob: 0,
  };

  let friends = [];
  let mollyX = 140;

  function say(text, sec) {
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleT = sec || 2.4;
  }

  function beep(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.09;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function addFun(n, why) {
    fun += n;
    funEl.textContent = "✨ веселье " + fun;
    if (why) say(why, 2.2);
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 10); i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: -50 - Math.random() * 140,
        life: 0.35 + Math.random() * 0.5,
        color,
        r: 3 + Math.random() * 3,
      });
    }
  }

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      this.moveTo(x + rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.arcTo(x, y + h, x, y, rr);
      this.arcTo(x, y, x + w, y, rr);
      this.closePath();
      return this;
    };
  }

  function spawnFriend() {
    const tpl = FRIENDS[(Math.random() * FRIENDS.length) | 0];
    const fromRight = Math.random() > 0.5;
    friends.push({
      ...tpl,
      x: fromRight ? VW + 40 : -40,
      y: VH * 0.62 + (Math.random() - 0.5) * 30,
      vx: fromRight ? -40 - Math.random() * 35 : 40 + Math.random() * 35,
      bob: Math.random() * 10,
      playing: false,
      playT: 0,
      met: false,
    });
  }

  function start() {
    fun = 0;
    funEl.textContent = "✨ веселье 0";
    pet.x = 220;
    pet.y = VH * 0.62;
    pet.vx = 0;
    pet.mode = "idle";
    pet.squish = 0;
    pet.wag = 0;
    friends = [];
    ball = null;
    particles = [];
    mollyX = 150;
    playing = true;
    menu.hidden = true;
    play.hidden = false;
    spawnFriend();
    spawnFriend();
    say("Молли: «Пойдём в парк, Butterscotch! Никого кормить не надо — только веселье.»", 3.5);
    canvas.focus();
  }

  function showMenu() {
    playing = false;
    menu.hidden = false;
    play.hidden = true;
  }

  function doAct(act) {
    if (!playing) return;
    if (act === "walk") {
      pet.mode = "walk";
      pet.modeT = 4;
      pet.vx = pet.facing * 70;
      addFun(2, "Гуляем с Молли по парку…");
      beep(440, 0.06);
    } else if (act === "ball") {
      throwBall();
    } else if (act === "squish") {
      pet.squish = 1;
      pet.wag = 1.5;
      addFun(4, "Squish… slow rise… Buttersquish счастлив!");
      beep(280, 0.12);
      burst(pet.x, pet.y - 20, COL.light, 12);
    } else if (act === "run") {
      pet.mode = "run";
      pet.modeT = 2.5;
      pet.vx = pet.facing * 160;
      pet.wag = 2;
      addFun(3, "Бежим!");
      beep(620, 0.05);
    } else if (act === "chill") {
      pet.mode = "chill";
      pet.modeT = 5;
      pet.vx = 0;
      addFun(2, "Лежим на травке. Можно всё, что хочется.");
      beep(320, 0.1);
    } else if (act === "call") {
      spawnFriend();
      addFun(1, "Молли: «Смотри — кто-то идёт!»");
      beep(500, 0.07);
    }
  }

  function throwBall() {
    ball = {
      x: pet.x + pet.facing * 40,
      y: pet.y - 30,
      vx: pet.facing * (180 + Math.random() * 60),
      vy: -120,
    };
    pet.mode = "play";
    pet.modeT = 2;
    pet.wag = 2;
    addFun(3, "Мячик!");
    beep(700, 0.05);
  }

  function tryMeet(f) {
    if (f.met && f.playT > 0) return;
    const dx = f.x - pet.x;
    if (Math.abs(dx) > 70) return;
    f.met = true;
    f.playing = true;
    f.playT = 3.5;
    pet.mode = "play";
    pet.modeT = 3.5;
    pet.wag = 2;
    meetFlash = 1;
    const same =
      f.kind === "dog"
        ? "Пёс " + f.name + " и Butterscotch играют вместе!"
        : "Кот " + f.name + " и Butterscotch веселятся (коты тоже могут)!";
    addFun(f.kind === "dog" ? 8 : 7, same);
    beep(880, 0.08);
    burst((f.x + pet.x) / 2, pet.y - 40, "#ffb0d0", 16);
  }

  function drawPark() {
    const sky = ctx.createLinearGradient(0, 0, 0, VH * 0.45);
    sky.addColorStop(0, "#a8d8f8");
    sky.addColorStop(1, "#d8f0c8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);

    // sun
    ctx.fillStyle = "#ffe090";
    ctx.beginPath();
    ctx.arc(VW - 90, 70, 36, 0, Math.PI * 2);
    ctx.fill();

    // trees
    for (let i = 0; i < 5; i++) {
      const tx = 80 + i * 200 + Math.sin(t * 0.3 + i) * 4;
      ctx.fillStyle = "#6a5030";
      ctx.fillRect(tx - 8, VH * 0.42, 16, 70);
      ctx.fillStyle = i % 2 ? "#4a9840" : "#3a8838";
      ctx.beginPath();
      ctx.arc(tx, VH * 0.4, 42 + (i % 3) * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // path
    ctx.fillStyle = "#90c878";
    ctx.fillRect(0, VH * 0.52, VW, VH * 0.48);
    ctx.fillStyle = "#c8b898";
    ctx.beginPath();
    ctx.ellipse(VW / 2, VH * 0.78, VW * 0.55, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // bench
    ctx.fillStyle = "#8a6040";
    ctx.fillRect(VW - 200, VH * 0.58, 90, 8);
    ctx.fillRect(VW - 195, VH * 0.58, 6, 28);
    ctx.fillRect(VW - 125, VH * 0.58, 6, 28);

    ctx.fillStyle = COL.blue;
    ctx.font = "700 14px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Парк · без шкал голода · только веселье", 20, 28);
  }

  function drawMolly(x, y) {
    // simple walker companion
    ctx.fillStyle = "#f0c8a8";
    ctx.beginPath();
    ctx.arc(x, y - 48, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07090";
    ctx.beginPath();
    ctx.roundRect(x - 12, y - 36, 24, 32, 6);
    ctx.fill();
    ctx.fillStyle = "#405080";
    ctx.fillRect(x - 10, y - 6, 8, 22);
    ctx.fillRect(x + 2, y - 6, 8, 22);
    ctx.fillStyle = "#1e3a6e";
    ctx.font = "700 11px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Молли", x, y - 64);
  }

  function drawButtersquish(g, cx, cy, scale, opts) {
    opts = opts || {};
    const s = scale || 1;
    const sq = opts.squish || 0;
    const wagAng = opts.wagAng || 0;
    const bob = opts.bob || 0;
    const face = opts.facing || 1;

    g.save();
    g.translate(cx, cy + bob);
    g.scale(s * face, s);
    const sy = 1 - sq * 0.38;
    const sx = 1 + sq * 0.28;
    g.scale(sx, sy);

    g.fillStyle = "rgba(0,0,0,0.12)";
    g.beginPath();
    g.ellipse(0, 58, 55, 10, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = COL.deep;
    [[-28, 0], [-8, 0], [12, 0], [30, 0]].forEach(([lx]) => {
      g.beginPath();
      g.roundRect(lx - 7, 38, 14, 20, 5);
      g.fill();
    });

    const bw = 96;
    const bh = 64;
    const grad = g.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
    grad.addColorStop(0, COL.light);
    grad.addColorStop(0.45, COL.mid);
    grad.addColorStop(1, COL.deep);
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(-bw / 2, -bh / 2 + 6, bw, bh, 12);
    g.fill();

    g.fillStyle = "rgba(255,255,255,0.35)";
    g.beginPath();
    g.roundRect(-bw / 2 + 8, -bh / 2 + 12, bw * 0.35, bh * 0.4, 8);
    g.fill();

    g.fillStyle = "rgba(255,254,245,0.92)";
    g.fillRect(-bw / 2 + 6, 0, bw - 12, 22);
    g.strokeStyle = COL.blue;
    g.lineWidth = 2;
    g.strokeRect(-bw / 2 + 6, 0, bw - 12, 22);
    g.fillStyle = COL.blue;
    g.font = "800 13px Fredoka, Nunito, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("BUTTER", 0, 11);

    g.fillStyle = COL.deep;
    g.beginPath();
    g.ellipse(-34, -bh / 2 + 2, 12, 22, 0.2, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(34, -bh / 2 + 2, 12, 22, -0.2, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = COL.cream;
    g.beginPath();
    g.ellipse(0, -16, 22, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#2a2010";
    g.beginPath();
    g.arc(-8, -18, 3.5, 0, Math.PI * 2);
    g.arc(8, -18, 3.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#3a2818";
    g.beginPath();
    g.ellipse(0, -10, 4, 3, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#5a4030";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, -5, 6, 0.15, Math.PI - 0.15);
    g.stroke();

    g.save();
    g.translate(bw / 2 - 4, 8);
    g.rotate(wagAng);
    g.fillStyle = COL.mid;
    g.beginPath();
    g.ellipse(16, -4, 16, 9, -0.5, 0, Math.PI * 2);
    g.fill();
    g.restore();

    g.restore();

    g.fillStyle = COL.blue;
    g.font = "800 12px Fredoka, Nunito, sans-serif";
    g.textAlign = "center";
    g.fillText("Butterscotch", cx, cy - 52 * s);
  }

  function drawFriend(f) {
    const bob = Math.sin(t * 4 + f.bob) * (f.playing ? 6 : 2);
    ctx.save();
    ctx.translate(f.x, f.y + bob);
    ctx.scale(f.vx >= 0 ? 1 : -1, 1);

    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (f.kind === "dog") {
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(0, 4, 28, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-22, -8, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.accent;
      ctx.beginPath();
      ctx.ellipse(-30, -4, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-26, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // ear
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(-18, -18, 6, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // legs
      ctx.fillRect(-16, 16, 8, 14);
      ctx.fillRect(4, 16, 8, 14);
      // tail wag
      ctx.save();
      ctx.translate(24, 0);
      ctx.rotate(Math.sin(t * 10) * 0.5);
      ctx.beginPath();
      ctx.ellipse(10, -4, 12, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // cat
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(0, 6, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-18, -6, 12, 0, Math.PI * 2);
      ctx.fill();
      // ears triangles
      ctx.beginPath();
      ctx.moveTo(-28, -14);
      ctx.lineTo(-22, -28);
      ctx.lineTo(-14, -14);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(-8, -26);
      ctx.lineTo(-2, -12);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-22, -8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.accent;
      ctx.beginPath();
      ctx.ellipse(-26, -2, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.color;
      ctx.fillRect(-12, 16, 6, 12);
      ctx.fillRect(4, 16, 6, 12);
      // tail
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(20, 4);
      ctx.quadraticCurveTo(36, -10 + Math.sin(t * 6) * 8, 28, -22);
      ctx.stroke();
    }

    ctx.restore();
    ctx.fillStyle = "#405040";
    ctx.font = "700 11px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(f.name + (f.kind === "dog" ? " 🐕" : " 🐈"), f.x, f.y - 36);
    if (f.playing) {
      ctx.fillText("♥ играем", f.x, f.y - 50);
    }
  }

  function draw() {
    drawPark();

    // Molly follows a bit behind
    drawMolly(mollyX, pet.y + 8);

    for (const f of friends) drawFriend(f);

    if (ball) {
      ctx.fillStyle = "#40c060";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ball.x - 3, ball.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const wagAng = Math.sin(t * (7 + pet.wag * 8)) * (0.25 + pet.wag * 0.4);
    drawButtersquish(ctx, pet.x, pet.y, 1, {
      squish: pet.squish,
      wagAng,
      bob: pet.mode === "chill" ? 4 : Math.sin(pet.bob) * 3,
      facing: pet.facing,
    });

    if (meetFlash > 0) {
      ctx.fillStyle = `rgba(255, 220, 120, ${meetFlash * 0.25})`;
      ctx.fillRect(0, 0, VW, VH);
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(dt) {
    pet.bob += dt * 3;
    if (pet.squish > 0) pet.squish = Math.max(0, pet.squish - dt * 0.35);
    pet.wag = Math.max(0, pet.wag - dt);
    meetFlash = Math.max(0, meetFlash - dt);

    // keyboard move — free pet life
    let want = 0;
    if (keys.ArrowLeft || keys.a || keys.A || keys.ф || keys.Ф) want -= 1;
    if (keys.ArrowRight || keys.d || keys.D || keys.в || keys.В) want += 1;

    if (want !== 0) {
      pet.facing = want > 0 ? 1 : -1;
      const spd = pet.mode === "run" || keys.Shift ? 160 : 90;
      pet.vx = want * spd;
      if (pet.mode === "idle" || pet.mode === "chill") {
        pet.mode = "walk";
        pet.modeT = 0.5;
      }
    } else if (pet.mode === "walk" && pet.modeT <= 0) {
      pet.vx *= 0.85;
      if (Math.abs(pet.vx) < 5) {
        pet.vx = 0;
        pet.mode = "idle";
      }
    }

    if (pet.modeT > 0) {
      pet.modeT -= dt;
      if (pet.modeT <= 0 && (pet.mode === "run" || pet.mode === "play")) {
        pet.mode = "idle";
        pet.vx = 0;
      }
    }

    if (pet.mode === "walk" && want === 0 && pet.modeT > 0) {
      // auto stroll from button
      pet.x += pet.vx * dt;
      if (pet.x < 60 || pet.x > VW - 60) {
        pet.facing *= -1;
        pet.vx *= -1;
      }
    } else {
      pet.x += pet.vx * dt;
    }
    pet.x = Math.max(50, Math.min(VW - 50, pet.x));

    // Molly soft-follow
    const targetMolly = pet.x - pet.facing * 70;
    mollyX += (targetMolly - mollyX) * Math.min(1, dt * 2.2);

    if (ball) {
      ball.vy += 380 * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.y > pet.y + 10) {
        ball.y = pet.y + 10;
        ball.vy *= -0.45;
        ball.vx *= 0.9;
      }
      if (Math.hypot(ball.x - pet.x, ball.y - pet.y) < 45) {
        burst(ball.x, ball.y, "#40c060", 8);
        addFun(2, "Поймал!");
        beep(760, 0.05);
        ball = null;
        pet.wag = 1.5;
      } else if (ball.x < -20 || ball.x > VW + 20) {
        ball = null;
      }
    }

    for (const f of friends) {
      if (f.playing) {
        f.playT -= dt;
        f.x += Math.sin(t * 6) * 20 * dt;
        if (f.playT <= 0) {
          f.playing = false;
          f.vx = (Math.random() > 0.5 ? 1 : -1) * (35 + Math.random() * 30);
        }
      } else {
        f.x += f.vx * dt;
      }
      tryMeet(f);
    }
    friends = friends.filter((f) => f.x > -80 && f.x < VW + 80);
    if (friends.length < 2 && Math.random() < dt * 0.25) spawnFriend();

    for (const p of particles) {
      p.life -= dt;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (playing) {
      tick(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    const sx = VW / r.width;
    const sy = VH / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!playing) return;
    const p = canvasPos(e);
    for (const f of friends) {
      if (Math.hypot(f.x - p.x, f.y - p.y) < 55) {
        f.met = false;
        tryMeet(f);
        return;
      }
    }
    // tap near pet = squish play
    if (Math.hypot(pet.x - p.x, pet.y - p.y) < 70) {
      doAct("squish");
    }
  });

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!playing) return;
    if (e.code === "Space") {
      e.preventDefault();
      throwBall();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  document.getElementById("btnStart").onclick = start;
  document.getElementById("btnMenu").onclick = showMenu;
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.dataset.act));
  });

  requestAnimationFrame(frame);
})();
