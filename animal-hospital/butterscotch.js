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
  const loveEl = document.getElementById("love");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  let love = 0;
  let bubbleT = 0;
  let playing = false;
  let done = false;
  let last = performance.now();
  let t = 0;
  let particles = [];
  let audioCtx = null;
  let wag = 0;

  // Butterscotch = golden / caramel-coated dog (retriever-like)
  const dog = {
    x: VW * 0.48,
    y: VH * 0.62,
    hunger: 55,
    water: 60,
    clean: 70,
    happy: 65,
    energy: 70,
    coat: 75,
    bob: 0,
    anim: 0,
    effect: null,
    sit: false,
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

  function showMenu() {
    playing = false;
    done = false;
    menu.hidden = false;
    play.hidden = true;
    win.hidden = true;
    bubble.hidden = true;
  }

  function start() {
    love = 0;
    done = false;
    Object.assign(dog, {
      hunger: 55,
      water: 60,
      clean: 70,
      happy: 65,
      energy: 70,
      coat: 75,
      bob: 0,
      anim: 0,
      effect: null,
      sit: false,
      x: VW * 0.48,
      y: VH * 0.62,
    });
    particles = [];
    playing = true;
    menu.hidden = true;
    play.hidden = false;
    win.hidden = true;
    loveEl.textContent = "❤ 0";
    renderStats();
    say("Вот Butterscotch — пёс с карамельной шерстью. Ухаживай за ним!", 3);
    beep(320, 0.08);
  }

  function renderStats() {
    stats.innerHTML = `
      <h3>🐕 Butterscotch · пёс</h3>
      голод <div class="bar"><i style="width:${dog.hunger}%;background:#ff9040"></i></div>
      вода <div class="bar"><i style="width:${dog.water}%;background:#60b0ff"></i></div>
      чистота <div class="bar"><i style="width:${dog.clean}%;background:#70c0e0"></i></div>
      радость <div class="bar"><i style="width:${dog.happy}%;background:#ff80b0"></i></div>
      шерсть <div class="bar"><i style="width:${dog.coat}%;background:#d4a060"></i></div>
      энергия <div class="bar"><i style="width:${dog.energy}%;background:#80c060"></i></div>`;
  }

  function doAct(act) {
    if (!playing || done) return;

    if (act === "feed") {
      dog.hunger = clamp(dog.hunger + 28);
      dog.happy = clamp(dog.happy + 8);
      say("Butterscotch ест из миски. Хвост виляет!", 2.3);
      burst(dog.x - 50, dog.y + 10, "#ffb040", 10);
    } else if (act === "water") {
      dog.water = clamp(dog.water + 30);
      dog.happy = clamp(dog.happy + 4);
      say("Пьёт водичку. Хороший пёс.", 2.2);
    } else if (act === "pet") {
      dog.happy = clamp(dog.happy + 24);
      dog.coat = clamp(dog.coat + 4);
      wag = 1;
      say("Гладим Butterscotch. Он прижимается.", 2.3);
      burst(dog.x, dog.y - 30, "#ff90b8", 10);
    } else if (act === "walk") {
      dog.energy = clamp(dog.energy - 12);
      dog.happy = clamp(dog.happy + 22);
      dog.hunger = clamp(dog.hunger - 8);
      dog.clean = clamp(dog.clean - 6);
      say("Прогулка! Butterscotch бежит рядом.", 2.4);
    } else if (act === "brush") {
      dog.coat = clamp(dog.coat + 30);
      dog.clean = clamp(dog.clean + 12);
      dog.happy = clamp(dog.happy + 10);
      say("Расчёсываем золотую шерсть. Блестит!", 2.3);
      burst(dog.x, dog.y - 10, "#e8c080", 14);
    } else if (act === "sleep") {
      dog.energy = clamp(dog.energy + 35);
      dog.sit = true;
      say("Butterscotch спит на лежанке. Zzz…", 2.3);
      setTimeout(() => {
        dog.sit = false;
      }, 2000);
    } else if (act === "ball") {
      dog.happy = clamp(dog.happy + 26);
      dog.energy = clamp(dog.energy - 14);
      wag = 1.2;
      say("Мячик! Апорт! Butterscotch счастлив.", 2.3);
      burst(dog.x + 40, dog.y - 40, "#40c060", 8);
    }

    dog.anim = 0.85;
    dog.effect = act;
    love += 3;
    loveEl.textContent = "❤ " + love;
    beep(380, 0.06);
    renderStats();

    if (love >= 40 && dog.hunger > 65 && dog.happy > 70 && dog.coat > 65) {
      finish();
    }
  }

  function finish() {
    if (done) return;
    done = true;
    playing = false;
    play.hidden = true;
    win.hidden = false;
    winText.textContent = "Butterscotch счастлив. Ты хороший хозяин для этого пса.";
    winCode.textContent = "DOG · ❤ " + love;
  }

  function tick(dt) {
    dog.bob += dt * 3;
    wag = Math.max(0, wag - dt);
    if (dog.anim > 0) dog.anim -= dt;
    else dog.effect = null;

    dog.hunger = clamp(dog.hunger - dt * 1.5);
    dog.water = clamp(dog.water - dt * 1.3);
    dog.clean = clamp(dog.clean - dt * 1.0);
    dog.happy = clamp(dog.happy - dt * 1.15);
    dog.coat = clamp(dog.coat - dt * 0.85);
    dog.energy = clamp(dog.energy - dt * 0.95);

    for (const p of particles) {
      p.life -= dt;
      p.vy += 250 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    if (((t * 2) | 0) !== (((t - dt) * 2) | 0)) renderStats();
  }

  function fur(c) {
    // butterscotch / golden coat shades
    return c || "#d4a060";
  }

  function drawRoom() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#b8d0e8");
    g.addColorStop(0.55, "#d8e4f0");
    g.addColorStop(1, "#c8b898");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // floor
    ctx.fillStyle = "#c8a878";
    ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
    ctx.fillStyle = "#b89868";
    for (let x = 0; x < VW; x += 48) ctx.fillRect(x, VH * 0.72, 2, VH * 0.28);

    // window
    ctx.fillStyle = "#a8d8f8";
    ctx.fillRect(50, 50, 170, 120);
    ctx.strokeStyle = "#8a7048";
    ctx.lineWidth = 8;
    ctx.strokeRect(50, 50, 170, 120);
    ctx.beginPath();
    ctx.moveTo(135, 50);
    ctx.lineTo(135, 170);
    ctx.moveTo(50, 110);
    ctx.lineTo(220, 110);
    ctx.stroke();

    // sun
    ctx.fillStyle = "#ffe080";
    ctx.beginPath();
    ctx.arc(160, 90, 22, 0, Math.PI * 2);
    ctx.fill();

    // dog bed
    ctx.fillStyle = "#e8b878";
    ctx.beginPath();
    ctx.ellipse(dog.x + 90, dog.y + 28, 55, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d4a060";
    ctx.beginPath();
    ctx.ellipse(dog.x + 90, dog.y + 22, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // bowls
    ctx.fillStyle = "#9098a0";
    ctx.beginPath();
    ctx.ellipse(dog.x - 85, dog.y + 32, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#70a0d0";
    ctx.beginPath();
    ctx.ellipse(dog.x - 85, dog.y + 30, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a0a8b0";
    ctx.beginPath();
    ctx.ellipse(dog.x - 125, dog.y + 32, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // ball
    ctx.fillStyle = "#40c060";
    ctx.beginPath();
    ctx.arc(VW - 120, VH * 0.78, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#605040";
    ctx.font = "700 14px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Butterscotch · золотистый пёс", 24, 36);
  }

  function drawDog() {
    const bob = dog.sit ? 8 : Math.sin(dog.bob) * 3;
    const wagAng = Math.sin(t * (8 + wag * 10)) * (0.35 + wag * 0.5);
    ctx.save();
    ctx.translate(dog.x, dog.y + bob);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.beginPath();
    ctx.ellipse(0, 42, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // hind / body — fluffy golden retriever shape
    const coatShine = 0.15 + (dog.coat / 100) * 0.2;
    const body = ctx.createRadialGradient(-10, -5, 8, 0, 5, 55);
    body.addColorStop(0, "#f0d080");
    body.addColorStop(0.45, "#d4a060");
    body.addColorStop(1, "#b87838");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(5, 5, 52, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // chest fluff lighter
    ctx.fillStyle = `rgba(245, 230, 190, ${0.55 + coatShine})`;
    ctx.beginPath();
    ctx.ellipse(-8, 12, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // feathering on belly
    ctx.fillStyle = "#e8c070";
    ctx.beginPath();
    ctx.ellipse(10, 28, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    const head = ctx.createRadialGradient(-35, -18, 5, -38, -10, 36);
    head.addColorStop(0, "#f0d090");
    head.addColorStop(0.6, "#d4a060");
    head.addColorStop(1, "#c08040");
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.ellipse(-38, -8, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // muzzle
    ctx.fillStyle = "#f5e6c8";
    ctx.beginPath();
    ctx.ellipse(-58, 0, 16, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a2818";
    ctx.beginPath();
    ctx.ellipse(-68, -1, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // floppy ears (retriever)
    ctx.fillStyle = "#c88840";
    ctx.beginPath();
    ctx.ellipse(-48, -8, 12, 26, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-22, -6, 12, 26, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8b870";
    ctx.beginPath();
    ctx.ellipse(-48, -6, 7, 16, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-22, -4, 7, 16, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // eyes — kind
    ctx.fillStyle = "#2a2018";
    ctx.beginPath();
    ctx.arc(-46, -12, 4, 0, Math.PI * 2);
    ctx.arc(-32, -12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-45, -13, 1.4, 0, Math.PI * 2);
    ctx.arc(-31, -13, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // smile
    ctx.strokeStyle = "#5a4030";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-58, 4, 7, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // tongue if happy
    if (dog.happy > 55) {
      ctx.fillStyle = "#e07080";
      ctx.beginPath();
      ctx.ellipse(-58, 12, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // front legs
    ctx.fillStyle = "#d4a060";
    if (dog.sit) {
      ctx.fillRect(-30, 20, 16, 28);
      ctx.fillRect(-8, 20, 16, 28);
    } else {
      ctx.fillRect(-34, 28, 15, 30);
      ctx.fillRect(-12, 28, 15, 30);
      ctx.fillRect(12, 28, 15, 30);
      ctx.fillRect(32, 28, 14, 30);
    }
    // paws
    ctx.fillStyle = "#c09050";
    ctx.beginPath();
    ctx.ellipse(-26, 58, 10, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(-4, 58, 10, 5, 0, 0, Math.PI * 2);
    if (!dog.sit) {
      ctx.ellipse(20, 58, 10, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(40, 58, 9, 5, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // fluffy tail — wagging
    ctx.save();
    ctx.translate(48, -2);
    ctx.rotate(wagAng);
    ctx.fillStyle = "#d4a060";
    ctx.beginPath();
    ctx.ellipse(18, -8, 22, 10, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8c080";
    ctx.beginPath();
    ctx.ellipse(28, -12, 12, 6, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // name
    ctx.fillStyle = "#705030";
    ctx.font = "800 13px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Butterscotch", 0, -48);

    if (dog.effect === "pet" || dog.effect === "ball") {
      ctx.font = "18px serif";
      ctx.fillText("♥", 30, -30);
    }

    ctx.restore();
  }

  function draw() {
    drawRoom();
    drawDog();
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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

  document.getElementById("btnStart").onclick = start;
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnWinMenu").onclick = showMenu;
  document.getElementById("btnAgain").onclick = start;
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.dataset.act));
  });

  requestAnimationFrame(frame);
})();
