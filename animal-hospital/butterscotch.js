(() => {
  "use strict";

  const VW = 960;
  const VH = 460;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const cChoice = document.getElementById("cChoice");
  const ctxC = cChoice.getContext("2d");

  const menu = document.getElementById("menu");
  const choice = document.getElementById("choice");
  const play = document.getElementById("play");
  const win = document.getElementById("win");
  const bubble = document.getElementById("bubble");
  const stats = document.getElementById("stats");
  const loveEl = document.getElementById("love");
  const placeLabel = document.getElementById("placeLabel");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  // Butter Squishy palette (viral salted-butter stick)
  const COL = {
    light: "#fff6a8",
    mid: "#f5e06a",
    deep: "#e0c838",
    shade: "#c8a820",
    blue: "#1e3a6e",
    cream: "#fffef5",
  };

  let love = 0;
  let bubbleT = 0;
  let playing = false;
  let done = false;
  let atHome = true;
  let last = performance.now();
  let t = 0;
  let particles = [];
  let audioCtx = null;
  let wag = 0;
  let squish = 0; // 0..1 compressed, then slow-rise

  const pet = {
    x: VW * 0.48,
    y: VH * 0.58,
    hunger: 50,
    water: 55,
    soft: 80,
    happy: 45,
    warm: 50,
    energy: 60,
    bob: 0,
    anim: 0,
    effect: null,
  };

  function say(text, sec) {
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleT = sec || 2.5;
  }

  function beep(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.1;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function clamp(v) {
    return Math.max(0, Math.min(100, v));
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 10); i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: -40 - Math.random() * 120,
        life: 0.4 + Math.random() * 0.5,
        color,
        r: 3 + Math.random() * 3,
      });
    }
  }

  function showOnly(el) {
    menu.hidden = el !== menu;
    choice.hidden = el !== choice;
    play.hidden = el !== play;
    win.hidden = el !== win;
  }

  function showMenu() {
    playing = false;
    done = false;
    showOnly(menu);
  }

  function startChoice() {
    playing = false;
    done = false;
    love = 0;
    loveEl.textContent = "❤ 0";
    showOnly(choice);
    drawChoicePreview();
  }

  function beginPlay(home) {
    atHome = home;
    placeLabel.textContent = home ? "дома" : "на улице";
    Object.assign(pet, {
      hunger: 50,
      water: 55,
      soft: 80,
      happy: home ? 55 : 35,
      warm: home ? 70 : 30,
      energy: 60,
      bob: 0,
      anim: 0,
      effect: null,
    });
    love = 0;
    squish = 0;
    particles = [];
    done = false;
    playing = true;
    loveEl.textContent = "❤ 0";
    showOnly(play);
    say(
      home
        ? "Молли: «Butterscotch дома! Он как Buttersquish — мягкий.»"
        : "Молли: «Не берём… но он один на улице. Ухаживай.»",
      3.2
    );
    renderStats();
    draw();
  }

  function renderStats() {
    const rows = [
      ["Голод", pet.hunger, "#e07040"],
      ["Вода", pet.water, "#5090d0"],
      ["Мягкость", pet.soft, "#e8c83a"],
      ["Радость", pet.happy, "#e070a0"],
      ["Тепло", pet.warm, "#d08050"],
      ["Силы", pet.energy, "#70a060"],
    ];
    stats.innerHTML =
      "<h3>Butterscotch · Buttersquish</h3>" +
      rows
        .map(
          ([n, v, c]) =>
            `<div>${n} ${Math.round(v)}</div><div class="bar"><i style="width:${v}%;background:${c}"></i></div>`
        )
        .join("");
  }

  function doAct(act) {
    if (!playing || done) return;
    pet.anim = 0.9;
    pet.effect = act;
    wag = 1.2;

    if (act === "feed") {
      pet.hunger = clamp(pet.hunger + 28);
      pet.happy = clamp(pet.happy + 8);
      love += 4;
      say("Ням… Buttersquish доволен.");
      beep(420, 0.08);
      burst(pet.x, pet.y - 20, "#f5e06a", 8);
    } else if (act === "water") {
      pet.water = clamp(pet.water + 30);
      love += 3;
      say("Глоток…");
      beep(520, 0.07);
    } else if (act === "pet") {
      pet.happy = clamp(pet.happy + 18);
      pet.soft = clamp(pet.soft + 6);
      love += 5;
      say("Молли гладит Butterscotch…");
      beep(640, 0.06);
      burst(pet.x, pet.y - 30, "#ffb0c0", 10);
    } else if (act === "squish") {
      squish = 1;
      pet.soft = clamp(pet.soft + 20);
      pet.happy = clamp(pet.happy + 14);
      love += 6;
      say("Squish… slow rise… как Butter Squishy!");
      beep(280, 0.12);
      burst(pet.x, pet.y, "#fff6a8", 14);
    } else if (act === "blanket") {
      pet.warm = clamp(pet.warm + 32);
      pet.happy = clamp(pet.happy + 10);
      love += 5;
      say(atHome ? "Плед на диване." : "Плед на улице — теплее.");
      beep(360, 0.08);
    } else if (act === "sleep") {
      pet.energy = clamp(pet.energy + 35);
      pet.happy = clamp(pet.happy + 6);
      love += 4;
      say("Zzz… мягкий как масло.");
      beep(220, 0.15);
    } else if (act === "ball") {
      pet.happy = clamp(pet.happy + 20);
      pet.energy = clamp(pet.energy - 8);
      love += 5;
      wag = 2;
      say("Мячик! Buttersquish прыгает.");
      beep(700, 0.05);
      burst(pet.x + 40, pet.y - 10, "#40c060", 8);
    }

    loveEl.textContent = "❤ " + love;
    renderStats();
    if (love >= 67 && !done) finish();
  }

  function finish() {
    done = true;
    playing = false;
    winText.textContent = atHome
      ? "Butterscotch дома. Молли права — он настоящий Buttersquish."
      : "Ты не взял домой, но не бросил. Buttersquish знает добро.";
    winCode.textContent = "код · SQUISH-" + (atHome ? "HOME" : "STREET");
    showOnly(win);
  }

  function tick(dt) {
    pet.bob += dt * 2.2;
    if (squish > 0) {
      // slow-rise like Butter Squishy
      squish = Math.max(0, squish - dt * 0.35);
    }
    wag = Math.max(0, wag - dt);
    if (pet.anim > 0) pet.anim -= dt;
    else pet.effect = null;

    const cold = atHome ? 1 : 1.35;
    pet.hunger = clamp(pet.hunger - dt * 1.4);
    pet.water = clamp(pet.water - dt * 1.25);
    pet.soft = clamp(pet.soft - dt * 0.9);
    pet.happy = clamp(pet.happy - dt * 1.1 * cold);
    pet.warm = clamp(pet.warm - dt * 0.95 * cold);
    pet.energy = clamp(pet.energy - dt * 0.85);

    for (const p of particles) {
      p.life -= dt;
      p.vy += 250 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    if (((t * 2) | 0) !== (((t - dt) * 2) | 0)) renderStats();
  }

  /** Draw Butter Squishy–style dog: pale butter stick body + dog face/ears/legs */
  function drawButtersquish(g, cx, cy, scale, opts) {
    opts = opts || {};
    const s = scale || 1;
    const sq = opts.squish || 0;
    const wagAng = opts.wagAng || 0;
    const bob = opts.bob || 0;
    const happy = opts.happy !== false;

    g.save();
    g.translate(cx, cy + bob);
    g.scale(s, s);

    // squash vertically when squished (slow-rise recover)
    const sy = 1 - sq * 0.38;
    const sx = 1 + sq * 0.28;
    g.scale(sx, sy);

    // soft shadow
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.beginPath();
    g.ellipse(0, 78, 70, 14, 0, 0, Math.PI * 2);
    g.fill();

    // stubby dog legs (under butter body)
    g.fillStyle = COL.deep;
    const legY = 52;
    [[-38, 0], [-12, 0], [14, 0], [38, 0]].forEach(([lx], i) => {
      g.beginPath();
      g.roundRect(lx - 9, legY, 18, 28, 6);
      g.fill();
      g.fillStyle = COL.shade;
      g.beginPath();
      g.ellipse(lx, legY + 28, 11, 5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = COL.deep;
    });

    // main butter stick body — rounded rectangle like the toy
    const bw = 118;
    const bh = 78;
    const grad = g.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
    grad.addColorStop(0, COL.light);
    grad.addColorStop(0.45, COL.mid);
    grad.addColorStop(1, COL.deep);
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(-bw / 2, -bh / 2 + 8, bw, bh, 14);
    g.fill();

    // soft foam highlight (matte squishy look)
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.beginPath();
    g.roundRect(-bw / 2 + 10, -bh / 2 + 16, bw * 0.35, bh * 0.45, 10);
    g.fill();

    // "BUTTER" label band — like Butter Squishy packaging
    g.fillStyle = "rgba(255,254,245,0.92)";
    g.fillRect(-bw / 2 + 8, 2, bw - 16, 28);
    g.strokeStyle = COL.blue;
    g.lineWidth = 2;
    g.strokeRect(-bw / 2 + 8, 2, bw - 16, 28);
    g.fillStyle = COL.blue;
    g.font = "800 16px Fredoka, Nunito, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("BUTTER", 0, 16);
    g.font = "700 8px Nunito, sans-serif";
    g.fillText("4 oz · salted", 0, 26);

    // dog ears on top of butter stick
    g.fillStyle = COL.deep;
    g.beginPath();
    g.ellipse(-42, -bh / 2 + 4, 16, 28, 0.25, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(42, -bh / 2 + 4, 16, 28, -0.25, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COL.light;
    g.beginPath();
    g.ellipse(-42, -bh / 2 + 6, 8, 16, 0.25, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(42, -bh / 2 + 6, 8, 16, -0.25, 0, Math.PI * 2);
    g.fill();

    // face on upper butter face
    g.fillStyle = COL.cream;
    g.beginPath();
    g.ellipse(0, -18, 28, 22, 0, 0, Math.PI * 2);
    g.fill();

    // eyes
    g.fillStyle = "#2a2010";
    g.beginPath();
    g.arc(-10, -22, 4.5, 0, Math.PI * 2);
    g.arc(10, -22, 4.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(-9, -23, 1.5, 0, Math.PI * 2);
    g.arc(11, -23, 1.5, 0, Math.PI * 2);
    g.fill();

    // nose + smile
    g.fillStyle = "#3a2818";
    g.beginPath();
    g.ellipse(0, -12, 5, 4, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#5a4030";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, -6, 8, 0.15, Math.PI - 0.15);
    g.stroke();

    if (happy) {
      g.fillStyle = "#e07080";
      g.beginPath();
      g.ellipse(0, 2, 5, 6, 0, 0, Math.PI * 2);
      g.fill();
    }

    // fluffy butter tail
    g.save();
    g.translate(bw / 2 - 4, 10);
    g.rotate(wagAng);
    g.fillStyle = COL.mid;
    g.beginPath();
    g.ellipse(22, -6, 20, 11, -0.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COL.light;
    g.beginPath();
    g.ellipse(30, -10, 10, 6, -0.5, 0, Math.PI * 2);
    g.fill();
    g.restore();

    if (opts.hearts) {
      g.font = "18px serif";
      g.fillStyle = "#e07080";
      g.fillText("♥", 40, -50);
    }

    g.restore();
  }

  function drawRoom() {
    if (atHome) {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, "#c8dcf0");
      g.addColorStop(0.55, "#e8eef4");
      g.addColorStop(1, "#d8c8a8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#c8a878";
      ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
      // window
      ctx.fillStyle = "#a8d8f8";
      ctx.fillRect(50, 50, 170, 120);
      ctx.strokeStyle = "#8a7048";
      ctx.lineWidth = 8;
      ctx.strokeRect(50, 50, 170, 120);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, "#6a8098");
      g.addColorStop(0.5, "#90a0b0");
      g.addColorStop(1, "#687068");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#505858";
      ctx.fillRect(0, VH * 0.7, VW, VH * 0.3);
      // rain
      ctx.strokeStyle = "rgba(200,220,240,0.35)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const rx = ((t * 80 + i * 37) % VW);
        const ry = ((t * 140 + i * 53) % (VH * 0.7));
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 2, ry + 12);
        ctx.stroke();
      }
      // cardboard box
      ctx.fillStyle = "#c8a878";
      ctx.fillRect(pet.x + 70, pet.y + 20, 70, 40);
      ctx.fillStyle = "#a88858";
      ctx.fillRect(pet.x + 70, pet.y + 10, 70, 14);
    }

    ctx.fillStyle = COL.blue;
    ctx.font = "700 14px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Buttersquish · не ириска · Butter Squishy пёс", 24, 36);
  }

  function draw() {
    drawRoom();
    const wagAng = Math.sin(t * (8 + wag * 10)) * (0.3 + wag * 0.45);
    drawButtersquish(ctx, pet.x, pet.y, 1.15, {
      squish,
      wagAng,
      bob: Math.sin(pet.bob) * 3,
      happy: pet.happy > 40,
      hearts: pet.effect === "pet" || pet.effect === "squish",
    });
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawChoicePreview() {
    ctxC.clearRect(0, 0, 420, 220);
    const bg = ctxC.createLinearGradient(0, 0, 0, 220);
    bg.addColorStop(0, "#b8d0e8");
    bg.addColorStop(1, "#c8b898");
    ctxC.fillStyle = bg;
    ctxC.fillRect(0, 0, 420, 220);
    ctxC.fillStyle = "#b89868";
    ctxC.fillRect(0, 160, 420, 60);
    drawButtersquish(ctxC, 210, 100, 0.85, { squish: 0.15, wagAng: 0.2, happy: true });
    ctxC.fillStyle = COL.blue;
    ctxC.font = "700 13px Nunito, sans-serif";
    ctxC.textAlign = "center";
    ctxC.fillText("Молли нашла Buttersquish…", 210, 200);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (playing && !done) {
      tick(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  // roundRect polyfill
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

  document.getElementById("btnStart").onclick = startChoice;
  document.getElementById("btnHome").onclick = () => beginPlay(true);
  document.getElementById("btnStreet").onclick = () => beginPlay(false);
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnWinMenu").onclick = showMenu;
  document.getElementById("btnAgain").onclick = startChoice;
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.dataset.act));
  });

  requestAnimationFrame(frame);
})();
