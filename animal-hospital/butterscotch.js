(() => {
  "use strict";

  const VW = 960;
  const VH = 460;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const play = document.getElementById("play");
  const win = document.getElementById("win");
  const bubble = document.getElementById("bubble");
  const stats = document.getElementById("stats");
  const who = document.getElementById("who");
  const loveEl = document.getElementById("love");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  let kind = "dog"; // dog | cat — butterscotch candy-pet look
  let love = 0;
  let bubbleT = 0;
  let playing = false;
  let done = false;
  let last = performance.now();
  let t = 0;
  let particles = [];
  let drips = [];
  let audioCtx = null;

  const pet = {
    x: VW * 0.5,
    y: VH * 0.58,
    hunger: 60,
    clean: 70,
    happy: 65,
    sweet: 50, // candy gloss / butterscotch-ness
    energy: 75,
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
      o.type = "triangle";
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
        vx: (Math.random() - 0.5) * 180,
        vy: -50 - Math.random() * 130,
        life: 0.4 + Math.random() * 0.5,
        color,
        r: 3 + Math.random() * 4,
      });
    }
  }

  function showMenu() {
    playing = false;
    done = false;
    menu.hidden = false;
    play.hidden = true;
    win.hidden = true;
    bubble.hidden = true;
  }

  function start(k) {
    kind = k;
    love = 0;
    done = false;
    Object.assign(pet, {
      hunger: 60,
      clean: 70,
      happy: 65,
      sweet: 50,
      energy: 75,
      bob: 0,
      anim: 0,
      effect: null,
      x: VW * 0.5,
      y: VH * 0.58,
    });
    particles = [];
    drips = [];
    playing = true;
    menu.hidden = true;
    play.hidden = false;
    win.hidden = true;
    who.textContent = kind === "dog" ? "🐕🍬 Butterscotch · пёс-ириска" : "🐱🍬 Butterscotch · кот-ириска";
    loveEl.textContent = "❤ 0";
    renderStats();
    say(
      kind === "dog"
        ? "Это Butterscotch: пёс из ириски. Ухаживай за ним!"
        : "Это Butterscotch: кот из ириски. Ухаживай за ним!",
      3
    );
    beep(360, 0.08);
  }

  function renderStats() {
    stats.innerHTML = `
      <h3>Butterscotch · ${kind === "dog" ? "пёс" : "кот"}-ириска</h3>
      голод <div class="bar"><i style="width:${pet.hunger}%;background:#ff9040"></i></div>
      чистота <div class="bar"><i style="width:${pet.clean}%;background:#70b0ff"></i></div>
      радость <div class="bar"><i style="width:${pet.happy}%;background:#ff80b0"></i></div>
      сладость <div class="bar"><i style="width:${pet.sweet}%;background:#e89830"></i></div>
      энергия <div class="bar"><i style="width:${pet.energy}%;background:#80c060"></i></div>`;
  }

  function doAct(act) {
    if (!playing || done) return;

    if (act === "feed") {
      pet.hunger = clamp(pet.hunger + 28);
      pet.happy = clamp(pet.happy + 8);
      pet.sweet = clamp(pet.sweet + 4);
      say("Ням! Butterscotch ест. Карамелька внутри довольна.", 2.3);
      burst(pet.x, pet.y - 30, "#ffb040", 12);
    } else if (act === "wash") {
      pet.clean = clamp(pet.clean + 30);
      // washing candy pet slightly reduces sweet gloss then restores
      pet.sweet = clamp(pet.sweet - 5);
      pet.happy = clamp(pet.happy + 5);
      say("Моем ириску осторожно. Блеск чистый!", 2.3);
      burst(pet.x, pet.y - 20, "#80c0ff", 14);
    } else if (act === "pet") {
      pet.happy = clamp(pet.happy + 24);
      pet.trust = true;
      say(kind === "dog" ? "Гладим пса-ириску. Липкий, но милый." : "Гладим кота-ириску. Муррр… сладко.", 2.3);
      burst(pet.x, pet.y - 35, "#ff90b8", 10);
    } else if (act === "play") {
      pet.happy = clamp(pet.happy + 22);
      pet.energy = clamp(pet.energy - 14);
      pet.hunger = clamp(pet.hunger - 6);
      say("Игра! Butterscotch прыгает, как живая конфета.", 2.3);
    } else if (act === "sweet") {
      pet.sweet = clamp(pet.sweet + 32);
      pet.happy = clamp(pet.happy + 14);
      pet.hunger = clamp(pet.hunger + 6);
      say("🍬 Добавили ириски! Butterscotch стал ещё более butterscotch.", 2.5);
      for (let i = 0; i < 6; i++) {
        drips.push({
          x: pet.x + (Math.random() - 0.5) * 40,
          y: pet.y - 20,
          vy: 40 + Math.random() * 40,
          life: 0.8,
        });
      }
      burst(pet.x, pet.y - 25, "#e89830", 16);
    } else if (act === "sleep") {
      pet.energy = clamp(pet.energy + 35);
      pet.happy = clamp(pet.happy + 6);
      say("Zzz… сладкий сон Butterscotch.", 2.3);
    }

    pet.anim = 0.9;
    pet.effect = act;
    love += 3;
    loveEl.textContent = "❤ " + love;
    beep(400 + love, 0.06);
    renderStats();

    if (love >= 40 && pet.hunger > 70 && pet.happy > 70 && pet.sweet > 70) {
      finish();
    }
  }

  function finish() {
    if (done) return;
    done = true;
    playing = false;
    play.hidden = true;
    win.hidden = false;
    winText.textContent =
      "Butterscotch счастлив! Ты ухаживал за " +
      (kind === "dog" ? "псом" : "котом") +
      "-ириской.";
    winCode.textContent = "SWEET · ❤ " + love;
  }

  function tick(dt) {
    pet.bob += dt * 3.2;
    if (pet.anim > 0) pet.anim -= dt;
    else pet.effect = null;

    pet.hunger = clamp(pet.hunger - dt * 1.5);
    pet.clean = clamp(pet.clean - dt * 1.1);
    pet.happy = clamp(pet.happy - dt * 1.2);
    pet.sweet = clamp(pet.sweet - dt * 0.9);
    pet.energy = clamp(pet.energy - dt * 1.0);

    for (const p of particles) {
      p.life -= dt;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    for (const d of drips) {
      d.life -= dt;
      d.y += d.vy * dt;
    }
    drips = drips.filter((d) => d.life > 0);

    if (((t * 2) | 0) !== (((t - dt) * 2) | 0)) renderStats();
  }

  function candyGradient(c, r) {
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, 4, 0, 0, r);
    g.addColorStop(0, "#fff0c0");
    g.addColorStop(0.35, "#f0b040");
    g.addColorStop(0.7, "#e07020");
    g.addColorStop(1, "#a04810");
    return g;
  }

  function drawWrapperTwist(c, x, dir) {
    c.fillStyle = "#f0c860";
    c.beginPath();
    c.moveTo(x, -12);
    c.lineTo(x + dir * 34, -28);
    c.lineTo(x + dir * 34, 28);
    c.closePath();
    c.fill();
    c.strokeStyle = "#c08020";
    c.lineWidth = 2;
    c.stroke();
  }

  function drawButterscotchDog() {
    const bob = Math.sin(pet.bob) * 4;
    const sweet = pet.sweet / 100;
    ctx.save();
    ctx.translate(pet.x, pet.y + bob);

    // glow
    ctx.fillStyle = `rgba(255, 200, 80, ${0.2 + sweet * 0.25})`;
    ctx.beginPath();
    ctx.arc(0, 0, 78 + Math.sin(t * 3) * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(120, 60, 10, 0.15)";
    ctx.beginPath();
    ctx.ellipse(0, 48, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // candy body shaped like dog
    ctx.fillStyle = candyGradient(ctx, 55);
    ctx.beginPath();
    ctx.ellipse(0, 8, 52, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // shiny stripe like hard candy
    ctx.strokeStyle = "rgba(255, 255, 220, 0.55)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 8, 40, 18, -0.2, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // head candy
    ctx.fillStyle = candyGradient(ctx, 36);
    ctx.beginPath();
    ctx.arc(-40, -8, 30, 0, Math.PI * 2);
    ctx.fill();

    // wrapper twists on sides of body (UNIQUE butterscotch look)
    drawWrapperTwist(ctx, -52, -1);
    drawWrapperTwist(ctx, 52, 1);

    // ears — candy triangles
    ctx.fillStyle = "#e07020";
    ctx.beginPath();
    ctx.moveTo(-55, -22);
    ctx.lineTo(-62, -48);
    ctx.lineTo(-38, -30);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-28, -28);
    ctx.lineTo(-18, -50);
    ctx.lineTo(-10, -26);
    ctx.fill();

    // snout
    ctx.fillStyle = "#fff0d0";
    ctx.beginPath();
    ctx.ellipse(-58, -2, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5a3010";
    ctx.beginPath();
    ctx.arc(-66, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#3a2010";
    ctx.beginPath();
    ctx.arc(-48, -12, 4, 0, Math.PI * 2);
    ctx.arc(-34, -12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-47, -13, 1.5, 0, Math.PI * 2);
    ctx.arc(-33, -13, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // legs
    ctx.fillStyle = "#d08028";
    ctx.fillRect(-28, 32, 14, 22);
    ctx.fillRect(-6, 32, 14, 22);
    ctx.fillRect(14, 32, 14, 22);
    ctx.fillRect(32, 32, 12, 22);

    // tail swirl candy
    ctx.strokeStyle = "#e89830";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.quadraticCurveTo(70, -20 + Math.sin(pet.bob * 3) * 8, 62, 8);
    ctx.stroke();

    // label
    ctx.fillStyle = "#fff8e0";
    ctx.fillRect(-28, 0, 56, 16);
    ctx.strokeStyle = "#a05010";
    ctx.lineWidth = 2;
    ctx.strokeRect(-28, 0, 56, 16);
    ctx.fillStyle = "#a05010";
    ctx.font = "800 10px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BUTTER", 0, 12);

    ctx.restore();
  }

  function drawButterscotchCat() {
    const bob = Math.sin(pet.bob) * 4;
    const sweet = pet.sweet / 100;
    ctx.save();
    ctx.translate(pet.x, pet.y + bob);

    ctx.fillStyle = `rgba(255, 200, 80, ${0.2 + sweet * 0.25})`;
    ctx.beginPath();
    ctx.arc(0, 0, 74 + Math.sin(t * 3) * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(120, 60, 10, 0.15)";
    ctx.beginPath();
    ctx.ellipse(0, 46, 44, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // round candy body (cat)
    ctx.fillStyle = candyGradient(ctx, 50);
    ctx.beginPath();
    ctx.ellipse(0, 10, 46, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 220, 0.5)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-8, 0, 22, -0.5, 1.2);
    ctx.stroke();

    // wrapper bow on back
    drawWrapperTwist(ctx, -48, -1);
    drawWrapperTwist(ctx, 48, 1);

    // head
    ctx.fillStyle = candyGradient(ctx, 34);
    ctx.beginPath();
    ctx.arc(0, -28, 32, 0, Math.PI * 2);
    ctx.fill();

    // pointed candy ears
    ctx.fillStyle = "#e07020";
    ctx.beginPath();
    ctx.moveTo(-22, -42);
    ctx.lineTo(-30, -72);
    ctx.lineTo(-4, -50);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, -42);
    ctx.lineTo(30, -72);
    ctx.lineTo(4, -50);
    ctx.fill();
    ctx.fillStyle = "#fff0c0";
    ctx.beginPath();
    ctx.moveTo(-20, -46);
    ctx.lineTo(-26, -64);
    ctx.lineTo(-10, -50);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, -46);
    ctx.lineTo(26, -64);
    ctx.lineTo(10, -50);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#3a2010";
    ctx.beginPath();
    ctx.ellipse(-12, -30, 4, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(12, -30, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // nose / mouth
    ctx.fillStyle = "#c05030";
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-5, -16);
    ctx.lineTo(5, -16);
    ctx.fill();
    ctx.strokeStyle = "#5a3010";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -10);
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(-8, -4, -14, -8);
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(8, -4, 14, -8);
    ctx.stroke();

    // legs
    ctx.fillStyle = "#d08028";
    ctx.fillRect(-26, 36, 14, 18);
    ctx.fillRect(-6, 36, 14, 18);
    ctx.fillRect(8, 36, 14, 18);
    ctx.fillRect(24, 36, 12, 18);

    // curly candy tail
    ctx.strokeStyle = "#e89830";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(40, 8);
    ctx.bezierCurveTo(70, -10, 55, 40, 78, 20 + Math.sin(pet.bob * 4) * 6);
    ctx.stroke();

    ctx.fillStyle = "#fff8e0";
    ctx.fillRect(-30, 4, 60, 16);
    ctx.strokeStyle = "#a05010";
    ctx.lineWidth = 2;
    ctx.strokeRect(-30, 4, 60, 16);
    ctx.fillStyle = "#a05010";
    ctx.font = "800 10px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCOTCH", 0, 16);

    ctx.restore();
  }

  function drawRoom() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#fff0d0");
    g.addColorStop(1, "#f0c878");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // candy floor tiles
    ctx.fillStyle = "#e8b860";
    ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
    ctx.strokeStyle = "rgba(160, 90, 20, 0.2)";
    for (let x = 0; x < VW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, VH * 0.72);
      ctx.lineTo(x, VH);
      ctx.stroke();
    }

    // shelf of candies
    ctx.fillStyle = "#c89050";
    ctx.fillRect(40, 80, 160, 12);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = candyGradient(ctx, 12);
      ctx.beginPath();
      ctx.arc(70 + i * 35, 70, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#a06020";
    ctx.font = "700 14px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Butterscotch · уход за ириской", 24, 36);
  }

  function draw() {
    drawRoom();
    if (kind === "dog") drawButterscotchDog();
    else drawButterscotchCat();

    for (const d of drips) {
      ctx.fillStyle = `rgba(232, 152, 48, ${d.life})`;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (pet.effect === "sweet") {
      ctx.font = "28px serif";
      ctx.fillText("🍬", pet.x + 40, pet.y - 60);
    }
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

  document.querySelectorAll(".pick-card").forEach((btn) => {
    btn.addEventListener("click", () => start(btn.dataset.kind));
  });
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnWinMenu").onclick = showMenu;
  document.getElementById("btnAgain").onclick = () => start(kind);
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.dataset.act));
  });

  requestAnimationFrame(frame);
})();
