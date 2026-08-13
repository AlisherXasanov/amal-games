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
  let skyLevel = 0; // 0 room → 1 full sky
  let skyTriggered = false;
  let skyStars = [];
  let t = 0;

  const LINES = {
    cat: {
      feed: ["Мррр! Сила растёт.", "Ням. Я очень сильный.", "Ещё! Я кот-чемпион."],
      wash: ["Брызг! Чистый и сильный.", "Мяу… ладно, вода ок.", "Шерсть блестит. Сила +1."],
      play: ["Хватай мышку!", "Я прыгнул выше всех!", "Играю как чемпион."],
      sleep: ["Zzz… мышцы отдыхают.", "Сон сильного кота.", "Мррр… спокойной."],
      low: ["Я голоден…", "Я грязный!", "Мне скучно…", "Я устал…"],
      full: ["Всё на максимуме! Я лечу в небо!", "Сила + счастье = небо!", "Мррр… я как на облаке."],
      sad: ["Мяу… мне плохо.", "Без заботы я слабею.", "Хочу внимания…"],
    },
    dog: {
      feed: ["Гав! Корги сыт.", "Taxi dog одобряет.", "Ням-ням, короткие лапки счастливы."],
      wash: ["Шампунь! Корги блестит.", "Такси-собака чистая.", "Брызг-гав!"],
      play: ["Мячик! Гав-гав!", "Бегу на коротких лапках!", "Taxi dog на службе веселья."],
      sleep: ["Корги спит…", "Такси закрыто на ночь.", "Zzz… гав…"],
      low: ["Гав… голодно.", "Я грязный корги.", "Поиграем?", "Хочу спать…"],
      full: ["Taxi to the sky! Всё отлично!", "Корги на облаке!", "Гав! Небесный рейс!"],
      sad: ["Гав… грустно.", "Такси сломалось без заботы.", "Мне нужна помощь…"],
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
    const baseY = kind === "cat" ? VH * 0.62 : VH * 0.68;
    const baseX = mode === "both" ? (kind === "cat" ? VW * 0.32 : VW * 0.68) : VW * 0.5;
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
        x: baseX,
        y: baseY,
        baseY,
        float: 0,
        sky: false,
        glow: 0,
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
      x: baseX,
      y: baseY,
      baseY,
      float: 0,
      sky: false,
      glow: 0,
    };
  }

  function isFull(p) {
    return p.hunger >= 88 && p.clean >= 88 && p.happy >= 88 && p.energy >= 88 && p.power >= 60;
  }

  function isSad(p) {
    return p.hunger < 25 || p.clean < 25 || p.happy < 25 || p.energy < 20;
  }

  function avgCare(p) {
    return (p.hunger + p.clean + p.happy + p.energy) / 4;
  }

  function makeSkyStars() {
    skyStars = [];
    for (let i = 0; i < 40; i++) {
      skyStars.push({
        x: Math.random() * VW,
        y: Math.random() * VH * 0.7,
        s: 1 + Math.random() * 2.5,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function showMenu() {
    done = false;
    pets = [];
    skyLevel = 0;
    skyTriggered = false;
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
    skyLevel = 0;
    skyTriggered = false;
    particles = [];
    pets = [];
    makeSkyStars();
    if (m === "cat" || m === "both") pets.push(makePet("cat"));
    if (m === "dog" || m === "both") pets.push(makePet("dog"));
    active = 0;
    menu.hidden = true;
    play.hidden = false;
    win.hidden = true;
    dayLabel.textContent = "День 1";
    loveLabel.textContent = "❤ 0";
    renderPanel();
    say(
      m === "both"
        ? "Два питомца. Если всё на максимуме — они взлетят в небо!"
        : "Если всё на максимуме — питомец взлетит в небо!",
      3.5
    );
    draw();
  }

  function finish(skyWin) {
    if (done) return;
    done = true;
    if (skyWin) {
      winText.textContent =
        "Всё на максимуме! Питомцы улетели в небо. День " + day + " · ❤ " + love;
      winCode.textContent = "SKY · " + String(((Date.now() / 1000) | 0) % 100000);
    } else {
      winText.textContent =
        "Ты заботился " + day + " дн. · любовь " + love + ". Питомцы счастливы.";
      winCode.textContent = "PET · " + String(((Date.now() / 1000) | 0) % 100000);
    }
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
      if (p.id === "cat") p.power = clamp(p.power + 10);
      else p.power = clamp(p.power + 6);
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
      p.power = clamp(p.power + (p.id === "cat" ? 5 : 4));
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
      if (p.id === "dog") p.power = clamp(p.power + 8);
      if (p.id === "cat") p.power = clamp(p.power + 5);
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
    checkSkyState();
    if (love >= 50 && day >= 3 && !pets.every(isFull)) finish(false);
  }

  function checkSkyState() {
    for (const p of pets) {
      if (isFull(p) && !p.sky) {
        p.sky = true;
        p.glow = 1;
        love += 8;
        loveLabel.textContent = "❤ " + love;
        burst(p.x, p.y - 40, "#ffe080", 22);
        burst(p.x, p.y - 20, "#a0d0ff", 16);
        beep(523, 0.08);
        setTimeout(() => beep(659, 0.1), 80);
        setTimeout(() => beep(784, 0.14), 160);
        say(line(p.id, "full"), 3.5);
      } else if (!isFull(p) && p.sky) {
        p.sky = false;
      }
    }
    if (pets.length && pets.every(isFull) && !skyTriggered) {
      skyTriggered = true;
      say("✦ Всё на максимуме! Небо открывается…", 4);
      setTimeout(() => {
        if (!done && pets.every(isFull)) finish(true);
      }, 4500);
    }
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
      // when in sky bliss, stats drain slower
      const slow = p.sky ? 0.35 : 1;
      p.hunger = clamp(p.hunger - dt * 2.2 * slow);
      p.clean = clamp(p.clean - dt * 1.6 * slow);
      p.happy = clamp(p.happy - dt * 1.4 * slow);
      p.energy = clamp(p.energy - dt * 1.1 * slow);
      p.bob += dt * (p.sky ? 5 : 3);
      if (p.anim > 0) p.anim -= dt;
      else p.effect = null;

      const wantFloat = isFull(p) ? 1 : isSad(p) ? -0.15 : 0;
      p.float += (wantFloat - p.float) * Math.min(1, dt * 1.8);
      p.glow += ((isFull(p) ? 1 : 0) - p.glow) * Math.min(1, dt * 3);
      // float toward sky
      const targetY = p.baseY - p.float * (p.baseY - 110);
      p.y += (targetY - p.y) * Math.min(1, dt * 2.5);
    }

    // sky fills when pets are full
    const fullN = pets.filter(isFull).length;
    const targetSky = pets.length ? fullN / pets.length : 0;
    skyLevel += (targetSky - skyLevel) * Math.min(1, dt * 1.2);
  }

  function maybeComplain(dt) {
    if (Math.random() > dt * 0.35) return;
    const p = pets[(Math.random() * pets.length) | 0];
    if (isFull(p)) {
      say(line(p.id, "full"), 2.2);
      return;
    }
    if (isSad(p)) {
      say(line(p.id, "sad"), 2.2);
      return;
    }
    const lows = [
      p.hunger < 28 ? LINES[p.id].low[0] : null,
      p.clean < 28 ? LINES[p.id].low[1] : null,
      p.happy < 28 ? LINES[p.id].low[2] : null,
      p.energy < 28 ? LINES[p.id].low[3] : null,
    ].filter(Boolean);
    if (lows.length) say(lows[0], 2.2);
  }

  function drawRoom() {
    const s = skyLevel;
    const sky = ctx.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, lerpColor("#b8e0ff", "#2040a0", s));
    sky.addColorStop(0.45, lerpColor("#e8f4ff", "#6090e0", s));
    sky.addColorStop(1, lerpColor("#e8f4ff", "#c8e8ff", s));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);

    // stars appear as sky opens
    if (s > 0.15) {
      for (const st of skyStars) {
        const a = (0.3 + Math.sin(t * 3 + st.tw) * 0.3) * s;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // clouds when sky
    if (s > 0.2) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 * s})`;
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 200 + t * 18) % (VW + 120)) - 60;
        const cy = 60 + i * 28;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 50, 16, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 30, cy + 4, 40, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // floor fades when sky
    const floorA = 1 - s * 0.85;
    ctx.globalAlpha = floorA;
    ctx.fillStyle = "#f0e0c8";
    ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
    ctx.fillStyle = "#e0d0b0";
    for (let x = 0; x < VW; x += 40) {
      ctx.fillRect(x, VH * 0.72, 2, VH * 0.28);
    }

    // window
    ctx.fillStyle = s > 0.5 ? "#fff8c0" : "#dff0ff";
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

    ctx.fillStyle = "#ffe080";
    ctx.beginPath();
    ctx.arc(140, 75, 18 + s * 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffb0c8";
    ctx.beginPath();
    ctx.ellipse(VW * 0.28, VH * 0.78, 70, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d0b090";
    ctx.beginPath();
    ctx.ellipse(VW * 0.72, VH * 0.8, 75, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c09060";
    ctx.fillRect(VW * 0.72 - 55, VH * 0.72, 110, 18);
    ctx.globalAlpha = 1;

    // rainbow when full sky
    if (s > 0.55) {
      const cx = VW / 2;
      const cy = VH * 0.95;
      const cols = ["#ff6080", "#ff9040", "#ffe060", "#60e080", "#60b0ff", "#a070ff"];
      cols.forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.globalAlpha = (s - 0.55) * 1.5 * 0.45;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 220 - i * 12, Math.PI, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // sad tint when pets are neglected
    const sadN = pets.filter(isSad).length;
    if (sadN && s < 0.3) {
      ctx.fillStyle = `rgba(40, 30, 60, ${0.12 * sadN})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function lerpColor(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ar = (pa >> 16) & 255,
      ag = (pa >> 8) & 255,
      ab = pa & 255;
    const br = (pb >> 16) & 255,
      bg = (pb >> 8) & 255,
      bb = pb & 255;
    const r = (ar + (br - ar) * t) | 0;
    const g = (ag + (bg - ag) * t) | 0;
    const bl = (ab + (bb - ab) * t) | 0;
    return `rgb(${r},${g},${bl})`;
  }

  function drawCat(p) {
    const bob = Math.sin(p.bob) * 4;
    const powerScale = 1 + p.power * 0.004;
    const sad = isSad(p);
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(powerScale, powerScale);

    if (p.glow > 0.05) {
      ctx.fillStyle = `rgba(255, 220, 120, ${0.25 * p.glow})`;
      ctx.beginPath();
      ctx.arc(0, 0, 70 + Math.sin(t * 4) * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(160, 200, 255, ${0.2 * p.glow})`;
      ctx.beginPath();
      ctx.arc(0, -10, 50, 0, Math.PI * 2);
      ctx.fill();
    }

    // shadow fades when floating
    ctx.fillStyle = `rgba(0,0,0,${0.12 * (1 - p.float)})`;
    ctx.beginPath();
    ctx.ellipse(0, 28, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // body — muscular
    ctx.fillStyle = sad ? "#c08060" : "#ff9a4a";
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
    if (sad) {
      ctx.strokeStyle = "#203040";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-8, -18, 4, 0.2, Math.PI - 0.2, true);
      ctx.stroke();
    }

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

    // wings when sky
    if (p.float > 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${0.55 * p.float})`;
      const flap = Math.sin(t * 8) * 8;
      ctx.beginPath();
      ctx.ellipse(-40, -5 + flap, 22, 10, -0.4, 0, Math.PI * 2);
      ctx.ellipse(40, -5 - flap, 22, 10, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

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
    if (p.sky) {
      ctx.font = "18px serif";
      ctx.fillText("☁", -8, -70 - Math.sin(t * 3) * 4);
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
    const sad = isSad(p);
    ctx.save();
    ctx.translate(p.x, p.y + bob);

    if (p.glow > 0.05) {
      ctx.fillStyle = `rgba(255, 220, 100, ${0.25 * p.glow})`;
      ctx.beginPath();
      ctx.arc(0, 0, 65 + Math.sin(t * 4) * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(0,0,0,${0.12 * (1 - p.float)})`;
    ctx.beginPath();
    ctx.ellipse(0, 22, 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // body — low corgi
    ctx.fillStyle = sad ? "#a08060" : "#e0a060";
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

    // taxi badge — becomes SKY when full
    ctx.fillStyle = p.sky ? "#a0d0ff" : "#ffd040";
    ctx.fillRect(8, -8, 28, 14);
    ctx.strokeStyle = "#302010";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, -8, 28, 14);
    ctx.fillStyle = "#302010";
    ctx.font = "800 9px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.sky ? "SKY" : "TAXI", 22, 2);

    // float propeller / wings
    if (p.float > 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * p.float})`;
      const flap = Math.sin(t * 10) * 10;
      ctx.beginPath();
      ctx.ellipse(-10, -28 + flap * 0.3, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd040";
      ctx.fillRect(-2, -40, 4, 14);
    }

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
    if (p.sky) {
      ctx.font = "18px serif";
      ctx.fillText("☁", 0, -55 - Math.sin(t * 3) * 4);
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
    t += dt;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (done || !pets.length) return;

    tickNeeds(dt);
    maybeComplain(dt);
    // keep sky flag in sync while draining
    for (const p of pets) {
      if (p.sky && !isFull(p)) p.sky = false;
    }

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
      checkSkyState();
      if (love >= 50 && day >= 3 && !pets.every(isFull)) finish(false);
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
