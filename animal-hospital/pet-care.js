(() => {
  "use strict";

  const VW = 960;
  const VH = 480;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const play = document.getElementById("play");
  const win = document.getElementById("win");
  const panel = document.getElementById("panel");
  const bubble = document.getElementById("bubble");
  const dayLabel = document.getElementById("dayLabel");
  const loveLabel = document.getElementById("loveLabel");
  const winText = document.getElementById("winText");
  const winCode = document.getElementById("winCode");

  let mode = "both";
  let pets = [];
  let active = 0;
  let love = 0;
  let day = 1;
  let dayT = 0;
  let bubbleT = 0;
  let particles = [];
  let last = performance.now();
  let done = false;
  let audioCtx = null;

  const LINES = {
    cat: {
      feed: ["Мррр! Сила растёт.", "Ням. Я очень сильный.", "Ещё! Я кот-чемпион."],
      wash: ["Брызг! Чистый и сильный.", "Мяу… ладно, вода ок.", "Шерсть блестит. Сила +1."],
      play: ["Хватай мышку!", "Я прыгнул выше всех!", "Играю как чемпион."],
      sleep: ["Zzz… мышцы отдыхают.", "Сон сильного кота.", "Мррр… спокойной."],
      low: ["Я голоден…", "Я грязный!", "Мне скучно…", "Я устал…"],
    },
    dog: {
      feed: ["Гав! Корги сыт.", "Taxi dog одобряет.", "Ням-ням, короткие лапки счастливы."],
      wash: ["Шампунь! Корги блестит.", "Такси-собака чистая.", "Брызг-гав!"],
      play: ["Мячик! Гав-гав!", "Бегу на коротких лапках!", "Taxi dog на службе веселья."],
      sleep: ["Корги спит…", "Такси закрыто на ночь.", "Zzz… гав…"],
      low: ["Гав… голодно.", "Я грязный корги.", "Поиграем?", "Хочу спать…"],
    },
  };

  function say(t, sec) {
    bubble.textContent = t;
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

  function makePet(kind) {
    if (kind === "cat") {
      return {
        id: "cat",
        name: "Сильный кот",
        emoji: "🐱",
        hunger: 70,
        clean: 80,
        happy: 75,
        energy: 80,
        power: 40,
        bob: 0,
        anim: 0,
        effect: null,
        x: mode === "both" ? VW * 0.32 : VW * 0.5,
        y: VH * 0.62,
      };
    }
    return {
      id: "dog",
      name: "Корги · Taxi dog",
      emoji: "🐕",
      hunger: 65,
      clean: 75,
      happy: 80,
      energy: 85,
      power: 25,
      bob: 0,
      anim: 0,
      effect: null,
      x: mode === "both" ? VW * 0.68 : VW * 0.5,
      y: VH * 0.68,
    };
  }

  function showMenu() {
    done = false;
    pets = [];
    menu.hidden = false;
    play.hidden = true;
    win.hidden = true;
    bubble.hidden = true;
  }

  function start(m) {
    mode = m;
    love = 0;
    day = 1;
    dayT = 0;
    done = false;
    particles = [];
    pets = [];
    if (m === "cat" || m === "both") pets.push(makePet("cat"));
    if (m === "dog" || m === "both") pets.push(makePet("dog"));
    active = 0;
    menu.hidden = true;
    play.hidden = false;
    win.hidden = true;
    dayLabel.textContent = "День 1";
    loveLabel.textContent = "❤ 0";
    renderPanel();
    say(m === "both" ? "Два питомца. Выбери кого ухаживать — карточка сверху." : "Забота начинается!", 3);
  }

  function finish() {
    if (done) return;
    done = true;
    winText.textContent =
      "Ты заботился " + day + " дн. · любовь " + love + ". Питомцы счастливы.";
    winCode.textContent = "PET · " + String(((Date.now() / 1000) | 0) % 100000);
    win.hidden = false;
  }

  function cur() {
    return pets[active];
  }

  function line(kind, act) {
    const arr = LINES[kind][act];
    return arr[(Math.random() * arr.length) | 0];
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 10); i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 220,
        vy: -80 - Math.random() * 160,
        life: 0.5 + Math.random() * 0.5,
        color,
        r: 3 + Math.random() * 4,
      });
    }
  }

  function doAct(act) {
    if (done) return;
    const p = cur();
    if (!p) return;

    if (act === "feed") {
      if (p.hunger > 92) {
        say(p.id === "cat" ? "Кот уже сыт." : "Корги сыт по самые уши.", 2);
        return;
      }
      p.hunger = clamp(p.hunger + 28);
      p.happy = clamp(p.happy + 8);
      if (p.id === "cat") p.power = clamp(p.power + 6);
      p.anim = 0.8;
      p.effect = "feed";
      burst(p.x, p.y - 40, "#ffb040", 12);
      beep(320, 0.08);
      love += 2;
      say(line(p.id, "feed"), 2.5);
    } else if (act === "wash") {
      if (p.clean > 92) {
        say("Уже чистый!", 2);
        return;
      }
      p.clean = clamp(p.clean + 32);
      p.happy = clamp(p.happy + 5);
      if (p.id === "cat") p.power = clamp(p.power + 3);
      p.anim = 0.9;
      p.effect = "wash";
      burst(p.x, p.y - 20, "#7ec8ff", 14);
      beep(480, 0.07);
      love += 2;
      say(line(p.id, "wash"), 2.5);
    } else if (act === "play") {
      if (p.energy < 15) {
        say("Слишком устал. Сначала сон.", 2);
        return;
      }
      p.happy = clamp(p.happy + 26);
      p.energy = clamp(p.energy - 18);
      p.hunger = clamp(p.hunger - 8);
      if (p.id === "dog") p.power = clamp(p.power + 4);
      if (p.id === "cat") p.power = clamp(p.power + 2);
      p.anim = 0.7;
      p.effect = "play";
      burst(p.x, p.y - 50, "#ff90b8", 12);
      beep(520, 0.06);
      love += 3;
      say(line(p.id, "play"), 2.5);
    } else if (act === "sleep") {
      p.energy = clamp(p.energy + 40);
      p.happy = clamp(p.happy + 4);
      p.anim = 1.2;
      p.effect = "sleep";
      burst(p.x, p.y - 60, "#c0a0ff", 8);
      beep(200, 0.1);
      love += 1;
      say(line(p.id, "sleep"), 2.5);
    }

    loveLabel.textContent = "❤ " + love;
    renderPanel();
    if (love >= 50 && day >= 3) finish();
  }

  function renderPanel() {
    panel.innerHTML = pets
      .map((p, i) => {
        const bars = [
          ["Голод", "hunger", p.hunger],
          ["Чистота", "clean", p.clean],
          ["Радость", "happy", p.happy],
          ["Сила", "energy", p.energy],
          ["Мощь", "power", p.power],
        ];
        return `<div class="pet-card ${i === active ? "active" : ""}" data-i="${i}">
          <h3><span>${p.emoji} ${p.name}</span><span>${Math.round((p.hunger + p.clean + p.happy + p.energy) / 4)}%</span></h3>
          ${bars
            .map(
              ([lab, cls, v]) =>
                `<div class="bar"><span>${lab}</span><div class="track"><div class="fill ${cls}" style="width:${v}%"></div></div><span>${Math.round(v)}</span></div>`
            )
            .join("")}
        </div>`;
      })
      .join("");
    panel.querySelectorAll(".pet-card").forEach((el) => {
      el.onclick = () => {
        active = +el.dataset.i;
        renderPanel();
        say("Ухаживаем за: " + pets[active].name, 1.8);
      };
    });
  }

  function tickNeeds(dt) {
    for (const p of pets) {
      p.hunger = clamp(p.hunger - dt * 2.2);
      p.clean = clamp(p.clean - dt * 1.6);
      p.happy = clamp(p.happy - dt * 1.4);
      p.energy = clamp(p.energy - dt * 1.1);
      p.bob += dt * 3;
      if (p.anim > 0) p.anim -= dt;
      else p.effect = null;
    }
  }

  function maybeComplain(dt) {
    if (Math.random() > dt * 0.35) return;
    const p = pets[(Math.random() * pets.length) | 0];
    const lows = [
      p.hunger < 28 ? LINES[p.id].low[0] : null,
      p.clean < 28 ? LINES[p.id].low[1] : null,
      p.happy < 28 ? LINES[p.id].low[2] : null,
      p.energy < 28 ? LINES[p.id].low[3] : null,
    ].filter(Boolean);
    if (lows.length) say(lows[0], 2.2);
  }

  function drawRoom() {
    const sky = ctx.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, "#b8e0ff");
    sky.addColorStop(1, "#e8f4ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);

    ctx.fillStyle = "#f0e0c8";
    ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
    ctx.fillStyle = "#e0d0b0";
    for (let x = 0; x < VW; x += 40) {
      ctx.fillRect(x, VH * 0.72, 2, VH * 0.28);
    }

    // window
    ctx.fillStyle = "#dff0ff";
    ctx.fillRect(40, 40, 160, 110);
    ctx.strokeStyle = "#c0a880";
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 160, 110);
    ctx.beginPath();
    ctx.moveTo(120, 40);
    ctx.lineTo(120, 150);
    ctx.moveTo(40, 95);
    ctx.lineTo(200, 95);
    ctx.stroke();

    // sun
    ctx.fillStyle = "#ffe080";
    ctx.beginPath();
    ctx.arc(140, 75, 18, 0, Math.PI * 2);
    ctx.fill();

    // cushion
    ctx.fillStyle = "#ffb0c8";
    ctx.beginPath();
    ctx.ellipse(VW * 0.28, VH * 0.78, 70, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // dog bed
    ctx.fillStyle = "#d0b090";
    ctx.beginPath();
    ctx.ellipse(VW * 0.72, VH * 0.8, 75, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c09060";
    ctx.fillRect(VW * 0.72 - 55, VH * 0.72, 110, 18);
  }

  function drawCat(p) {
    const bob = Math.sin(p.bob) * 4;
    const powerScale = 1 + p.power * 0.004;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(powerScale, powerScale);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // body — muscular
    ctx.fillStyle = "#ff9a4a";
    ctx.beginPath();
    ctx.ellipse(0, 8, 34 + p.power * 0.08, 26 + p.power * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.beginPath();
    ctx.arc(0, -22, 22, 0, Math.PI * 2);
    ctx.fill();

    // ears
    ctx.beginPath();
    ctx.moveTo(-18, -34);
    ctx.lineTo(-26, -52);
    ctx.lineTo(-6, -38);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, -34);
    ctx.lineTo(26, -52);
    ctx.lineTo(6, -38);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-8, -24, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -24, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#203040";
    ctx.beginPath();
    ctx.arc(-7, -24, 2.2, 0, Math.PI * 2);
    ctx.arc(9, -24, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // nose / mouth
    ctx.fillStyle = "#ff6080";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-4, -14);
    ctx.lineTo(4, -14);
    ctx.fill();

    // biceps mark
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-22, 6, 10, -0.5, 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(22, 6, 10, Math.PI - 1.2, Math.PI + 0.5);
    ctx.stroke();

    // legs
    ctx.fillStyle = "#ff8a30";
    ctx.fillRect(-22, 24, 14, 18);
    ctx.fillRect(8, 24, 14, 18);

    // tail
    ctx.strokeStyle = "#ff9a4a";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.quadraticCurveTo(50, -20 + Math.sin(p.bob * 2) * 8, 58, -8);
    ctx.stroke();

    if (p.effect === "wash") {
      ctx.fillStyle = "rgba(126,200,255,0.5)";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(-20 + i * 10, -40 - (p.anim * 20) % 20, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (p.effect === "feed") {
      ctx.font = "20px serif";
      ctx.fillText("🐟", -10, -55 - (1 - p.anim) * 10);
    }
    if (p.effect === "sleep") {
      ctx.fillStyle = "#8060c0";
      ctx.font = "700 16px Fredoka, sans-serif";
      ctx.fillText("Zzz", 20, -50);
    }

    // power badge
    ctx.fillStyle = "rgba(160, 80, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(28, -30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "800 11px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(p.power), 28, -26);

    ctx.restore();
  }

  function drawDog(p) {
    const bob = Math.sin(p.bob * 1.2) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // body — low corgi
    ctx.fillStyle = "#e0a060";
    ctx.beginPath();
    ctx.ellipse(0, 4, 42, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // white chest
    ctx.fillStyle = "#fff5e8";
    ctx.beginPath();
    ctx.ellipse(-8, 8, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.fillStyle = "#d09050";
    ctx.beginPath();
    ctx.ellipse(-28, -8, 20, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // snout
    ctx.fillStyle = "#fff0e0";
    ctx.beginPath();
    ctx.ellipse(-42, -2, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#302028";
    ctx.beginPath();
    ctx.arc(-48, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ears — big
    ctx.fillStyle = "#c07040";
    ctx.beginPath();
    ctx.ellipse(-34, -24, 8, 14, -0.3, 0, Math.PI * 2);
    ctx.ellipse(-18, -24, 8, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#203040";
    ctx.beginPath();
    ctx.arc(-34, -10, 2.5, 0, Math.PI * 2);
    ctx.arc(-24, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // short legs
    ctx.fillStyle = "#c08040";
    ctx.fillRect(-28, 18, 12, 12);
    ctx.fillRect(-8, 18, 12, 12);
    ctx.fillRect(12, 18, 12, 12);
    ctx.fillRect(28, 18, 10, 12);

    // fluffy butt / tail
    ctx.fillStyle = "#e8b070";
    ctx.beginPath();
    ctx.arc(36, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d09050";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(44, -4);
    ctx.quadraticCurveTo(56, -18 + Math.sin(p.bob * 3) * 6, 50, -6);
    ctx.stroke();

    // taxi badge
    ctx.fillStyle = "#ffd040";
    ctx.fillRect(8, -8, 28, 14);
    ctx.strokeStyle = "#302010";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, -8, 28, 14);
    ctx.fillStyle = "#302010";
    ctx.font = "800 9px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TAXI", 22, 2);

    if (p.effect === "wash") {
      ctx.fillStyle = "rgba(126,200,255,0.5)";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(-20 + i * 12, -30 - (p.anim * 18) % 18, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (p.effect === "feed") {
      ctx.font = "20px serif";
      ctx.fillText("🦴", -10, -40);
    }
    if (p.effect === "play") {
      ctx.font = "18px serif";
      ctx.fillText("🎾", 20, -36 - Math.sin(p.anim * 10) * 8);
    }
    if (p.effect === "sleep") {
      ctx.fillStyle = "#8060c0";
      ctx.font = "700 16px Fredoka, sans-serif";
      ctx.fillText("Zzz", 30, -36);
    }

    ctx.restore();
  }

  function draw() {
    drawRoom();
    for (const p of pets) {
      if (p.id === "cat") drawCat(p);
      else drawDog(p);

      // select ring
      if (pets[active] === p) {
        ctx.strokeStyle = "rgba(255, 154, 74, 0.55)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 30, 48, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function update(dt) {
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (done || !pets.length) return;

    tickNeeds(dt);
    maybeComplain(dt);

    dayT += dt;
    if (dayT >= 28) {
      dayT = 0;
      day++;
      dayLabel.textContent = "День " + day;
      say("Наступил день " + day + "!", 2);
      for (const p of pets) {
        if (p.hunger > 50 && p.clean > 50 && p.happy > 50) {
          p.power = clamp(p.power + 5);
          love += 2;
        }
      }
      loveLabel.textContent = "❤ " + love;
      renderPanel();
      if (love >= 50 && day >= 3) finish();
    }

    for (const pt of particles) {
      pt.life -= dt;
      pt.vy += 280 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    particles = particles.filter((pt) => pt.life > 0);

    // soft refresh bars every ~0.5s
    gBarT = (gBarT || 0) + dt;
    if (gBarT > 0.5) {
      gBarT = 0;
      renderPanel();
    }
  }

  let gBarT = 0;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    if (!play.hidden) draw();
    requestAnimationFrame(frame);
  }

  document.querySelectorAll(".pick-card").forEach((btn) => {
    btn.addEventListener("click", () => start(btn.dataset.mode));
  });
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnWinMenu").onclick = showMenu;
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.dataset.act));
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (done || pets.length < 2) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * VW;
    const y = ((e.clientY - r.top) / r.height) * VH;
    let best = -1;
    let bestD = 80;
    pets.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) {
      active = best;
      renderPanel();
      say("Ухаживаем за: " + pets[active].name, 1.6);
    }
  });

  requestAnimationFrame(frame);
})();
