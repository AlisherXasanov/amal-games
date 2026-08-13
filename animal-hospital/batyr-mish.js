(() => {
  "use strict";

  const VW = 960;
  const VH = 500;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const play = document.getElementById("play");
  const bubble = document.getElementById("bubble");
  const stats = document.getElementById("stats");
  const actions = document.getElementById("actions");
  const emotions = document.getElementById("emotions");
  const placeLabel = document.getElementById("placeLabel");
  const loveEl = document.getElementById("love");

  // Infinite emotions — always available, never run out
  const EMOTIONS = [
    { id: "joy", icon: "😄", name: "Радость", line: "Миш сияет! Батыр смеётся." },
    { id: "calm", icon: "😌", name: "Спокойствие", line: "Тихо… Миш и пёс дышат лесом." },
    { id: "brave", icon: "💪", name: "Смелость", line: "Батырский дух! Миш готов ко всему." },
    { id: "love", icon: "🥰", name: "Любовь", line: "Миш обнимает пса. Тепло." },
    { id: "funny", icon: "🤪", name: "Смех", line: "Ха-ха! Пёс виляет, Миш хохочет." },
    { id: "think", icon: "🤔", name: "Думать", line: "Школьная мысль… Миш в уме." },
    { id: "wow", icon: "🤩", name: "Вау", line: "Ого! Лес и школа — огонь." },
    { id: "sleep", icon: "😴", name: "Сон", line: "Zzz… пёс под Мишем тоже спит." },
    { id: "angry", icon: "😤", name: "Злость", line: "Миш дуется. Пёс рядом — успокоит." },
    { id: "shy", icon: "😳", name: "Стыд", line: "Миш покраснел. Батыр тоже бывает стесняется." },
    { id: "party", icon: "🥳", name: "Праздник", line: "∞ эмоций! Празднуем бесконечно." },
    { id: "focus", icon: "🧐", name: "Учёба", line: "Миш учится. Оценка растёт." },
  ];

  const FOREST_ACTS = [
    { id: "feed", label: "🍖 Кормить" },
    { id: "pet", label: "🐾 Гладить пса" },
    { id: "walk", label: "🚶 Гулять" },
    { id: "wash", label: "💧 Мыть" },
    { id: "play", label: "🎾 Играть" },
  ];

  const SCHOOL_ACTS = [
    { id: "lesson", label: "📘 Урок" },
    { id: "draw", label: "🎨 Рисовать" },
    { id: "break", label: "🔔 Перемена" },
    { id: "homework", label: "✏️ Домашка" },
    { id: "friend", label: "👋 Друг" },
  ];

  let mode = "forest"; // forest | school | both
  let place = "forest"; // current scene when both
  let love = 0;
  let bubbleT = 0;
  let last = performance.now();
  let t = 0;
  let particles = [];
  let audioCtx = null;
  let playing = false;

  const mish = {
    x: VW * 0.48,
    y: VH * 0.52,
    hunger: 70,
    clean: 75,
    happy: 70,
    energy: 80,
    brave: 60,
    grade: 50,
    emo: "joy",
    bob: 0,
    anim: 0,
    effect: null,
  };

  const dog = {
    x: VW * 0.48,
    y: VH * 0.72,
    hunger: 65,
    clean: 70,
    happy: 80,
    energy: 85,
    bob: 0,
    anim: 0,
    effect: null,
    name: "Пёс",
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
      g.gain.value = 0.09;
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
        vy: -50 - Math.random() * 140,
        life: 0.4 + Math.random() * 0.5,
        color,
        r: 3 + Math.random() * 4,
      });
    }
  }

  function showMenu() {
    playing = false;
    menu.hidden = false;
    play.hidden = true;
    bubble.hidden = true;
  }

  function start(m) {
    mode = m;
    place = m === "school" ? "school" : "forest";
    love = 0;
    Object.assign(mish, {
      hunger: 70,
      clean: 75,
      happy: 70,
      energy: 80,
      brave: 60,
      grade: 50,
      emo: "joy",
      anim: 0,
      effect: null,
    });
    Object.assign(dog, {
      hunger: 65,
      clean: 70,
      happy: 80,
      energy: 85,
      anim: 0,
      effect: null,
    });
    particles = [];
    playing = true;
    menu.hidden = true;
    play.hidden = false;
    loveEl.textContent = "❤ 0";
    buildUI();
    updatePlaceLabel();
    say(
      m === "school"
        ? "Школа Батырского Миша. Эмоции ∞ — жми любые."
        : m === "both"
          ? "Лес и школа. Под Мишем — пёс. Ухаживай!"
          : "Лес. Батырский Миш и его пёс. Ухаживай за ними.",
      3.2
    );
  }

  function updatePlaceLabel() {
    if (mode === "both") {
      placeLabel.textContent = place === "forest" ? "🌲 Лес (жми S — школа)" : "🏫 Школа (жми F — лес)";
    } else {
      placeLabel.textContent = place === "forest" ? "🌲 Лес" : "🏫 Школа";
    }
  }

  function buildUI() {
    const acts = place === "forest" ? FOREST_ACTS : SCHOOL_ACTS;
    if (mode === "both") {
      actions.innerHTML =
        `<button type="button" class="act" data-act="goto">${place === "forest" ? "🏫 В школу" : "🌲 В лес"}</button>` +
        acts.map((a) => `<button type="button" class="act" data-act="${a.id}">${a.label}</button>`).join("");
    } else {
      actions.innerHTML = acts.map((a) => `<button type="button" class="act" data-act="${a.id}">${a.label}</button>`).join("");
    }
    actions.querySelectorAll(".act").forEach((btn) => {
      btn.onclick = () => doAct(btn.dataset.act);
    });

    // emotions — infinite, never deplete
    emotions.innerHTML = EMOTIONS.map(
      (e) => `<button type="button" class="emo" data-emo="${e.id}" title="∞">${e.icon} ${e.name}</button>`
    ).join("");
    emotions.querySelectorAll(".emo").forEach((btn) => {
      btn.onclick = () => setEmotion(btn.dataset.emo);
    });

    renderStats();
  }

  function renderStats() {
    stats.innerHTML = `
      <div class="stat-card">
        <h3>🗡️ Батырский Миш</h3>
        голод <div class="bar"><i style="width:${mish.hunger}%;background:#ff9040"></i></div>
        чистота <div class="bar"><i style="width:${mish.clean}%;background:#60a0ff"></i></div>
        радость <div class="bar"><i style="width:${mish.happy}%;background:#ff80b0"></i></div>
        сила/храбрость <div class="bar"><i style="width:${mish.brave}%;background:#e8b050"></i></div>
        учёба <div class="bar"><i style="width:${mish.grade}%;background:#a070ff"></i></div>
      </div>
      <div class="stat-card">
        <h3>🐕 Пёс · под Мишем</h3>
        голод <div class="bar"><i style="width:${dog.hunger}%;background:#ff9040"></i></div>
        чистота <div class="bar"><i style="width:${dog.clean}%;background:#60a0ff"></i></div>
        радость <div class="bar"><i style="width:${dog.happy}%;background:#ff80b0"></i></div>
        энергия <div class="bar"><i style="width:${dog.energy}%;background:#60c080"></i></div>
        <span>всегда рядом · в лесу</span>
      </div>`;
  }

  function setEmotion(id) {
    const e = EMOTIONS.find((x) => x.id === id);
    if (!e) return;
    mish.emo = id;
    mish.anim = 0.9;
    mish.effect = "emo";
    mish.happy = clamp(mish.happy + 8);
    dog.happy = clamp(dog.happy + 5);
    love += 1;
    loveEl.textContent = "❤ " + love;
    burst(mish.x, mish.y - 40, "#c0a0ff", 12);
    beep(480 + EMOTIONS.indexOf(e) * 15, 0.07);
    say(e.icon + " " + e.line + " (эмоции ∞)", 2.6);
    renderStats();
  }

  function doAct(act) {
    if (!playing) return;
    if (act === "goto") {
      place = place === "forest" ? "school" : "forest";
      buildUI();
      updatePlaceLabel();
      say(place === "forest" ? "Снова в лес. Пёс рад!" : "Миш идёт в школу. Пёс ждёт у двери.", 2.5);
      return;
    }

    if (place === "forest") {
      if (act === "feed") {
        mish.hunger = clamp(mish.hunger + 25);
        dog.hunger = clamp(dog.hunger + 28);
        mish.brave = clamp(mish.brave + 4);
        say("Кормим Миша и пса. Оба сыты!", 2.3);
        burst(dog.x, dog.y - 20, "#ffb040", 12);
      } else if (act === "pet") {
        dog.happy = clamp(dog.happy + 30);
        dog.clean = clamp(dog.clean + 5);
        mish.happy = clamp(mish.happy + 12);
        say("Гладим пса под Мишем. Виляет хвостом!", 2.3);
        burst(dog.x, dog.y - 10, "#ff90b8", 10);
      } else if (act === "walk") {
        mish.energy = clamp(mish.energy - 10);
        dog.energy = clamp(dog.energy - 12);
        mish.happy = clamp(mish.happy + 18);
        dog.happy = clamp(dog.happy + 22);
        mish.brave = clamp(mish.brave + 6);
        say("Прогулка по лесу. Батыр и пёс вместе.", 2.4);
      } else if (act === "wash") {
        mish.clean = clamp(mish.clean + 30);
        dog.clean = clamp(dog.clean + 32);
        say("Чистый Миш, чистый пёс!", 2.2);
        burst(mish.x, mish.y, "#80c0ff", 14);
      } else if (act === "play") {
        mish.happy = clamp(mish.happy + 22);
        dog.happy = clamp(dog.happy + 26);
        dog.energy = clamp(dog.energy - 15);
        say("Играют в лесу! Мячик и храбрость.", 2.3);
      }
      mish.effect = act;
      dog.effect = act;
    } else {
      if (act === "lesson") {
        mish.grade = clamp(mish.grade + 14);
        mish.energy = clamp(mish.energy - 8);
        mish.brave = clamp(mish.brave + 3);
        say("Урок! Батырский Миш умнеет.", 2.3);
      } else if (act === "draw") {
        mish.happy = clamp(mish.happy + 16);
        mish.grade = clamp(mish.grade + 6);
        say("Рисует пса и лес на доске.", 2.3);
      } else if (act === "break") {
        mish.energy = clamp(mish.energy + 20);
        mish.happy = clamp(mish.happy + 10);
        say("Перемена! Можно выглянуть к псу.", 2.3);
      } else if (act === "homework") {
        mish.grade = clamp(mish.grade + 18);
        mish.hunger = clamp(mish.hunger - 8);
        say("Домашка сдана. Оценка растёт.", 2.3);
      } else if (act === "friend") {
        mish.happy = clamp(mish.happy + 20);
        mish.brave = clamp(mish.brave + 8);
        say("Новый друг в школе. Миш не один.", 2.3);
      }
      mish.effect = act;
    }

    mish.anim = 0.85;
    dog.anim = 0.85;
    love += 3;
    loveEl.textContent = "❤ " + love;
    beep(360, 0.07);
    renderStats();
  }

  function tick(dt) {
    mish.bob += dt * 3;
    dog.bob += dt * 3.5;
    if (mish.anim > 0) mish.anim -= dt;
    else mish.effect = null;
    if (dog.anim > 0) dog.anim -= dt;
    else dog.effect = null;

    const slow = place === "school" ? 0.7 : 1;
    mish.hunger = clamp(mish.hunger - dt * 1.4 * slow);
    mish.clean = clamp(mish.clean - dt * 1.0 * slow);
    mish.happy = clamp(mish.happy - dt * 1.1 * slow);
    mish.energy = clamp(mish.energy - dt * 0.9 * slow);
    dog.hunger = clamp(dog.hunger - dt * 1.6);
    dog.clean = clamp(dog.clean - dt * 1.2);
    dog.happy = clamp(dog.happy - dt * 1.2);
    dog.energy = clamp(dog.energy - dt * 1.0);

    // dog always under mish
    dog.x += (mish.x - dog.x) * Math.min(1, dt * 4);
    dog.y = mish.y + 78;

    for (const p of particles) {
      p.life -= dt;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    if (((t * 2) | 0) !== (((t - dt) * 2) | 0)) renderStats();
  }

  function drawForest() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#7eb8e0");
    g.addColorStop(0.45, "#a8d0a0");
    g.addColorStop(1, "#4a7850");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // trees
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 110;
      const h = 90 + (i % 3) * 30;
      ctx.fillStyle = "#5a3a20";
      ctx.fillRect(x + 18, VH * 0.55, 16, h);
      ctx.fillStyle = i % 2 ? "#2a6040" : "#347048";
      ctx.beginPath();
      ctx.moveTo(x - 10, VH * 0.58);
      ctx.lineTo(x + 26, VH * 0.58 - h * 0.55);
      ctx.lineTo(x + 62, VH * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 2, VH * 0.48);
      ctx.lineTo(x + 26, VH * 0.48 - h * 0.4);
      ctx.lineTo(x + 54, VH * 0.48);
      ctx.closePath();
      ctx.fill();
    }

    // ground
    ctx.fillStyle = "#5a8a58";
    ctx.fillRect(0, VH * 0.78, VW, VH * 0.22);
  }

  function drawSchool() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#c8e0f0");
    g.addColorStop(1, "#e8e0d0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // building
    ctx.fillStyle = "#e8d8b0";
    ctx.fillRect(180, 80, 600, 280);
    ctx.fillStyle = "#c05040";
    ctx.beginPath();
    ctx.moveTo(160, 90);
    ctx.lineTo(480, 20);
    ctx.lineTo(800, 90);
    ctx.closePath();
    ctx.fill();

    // windows
    ctx.fillStyle = "#80c0e8";
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillRect(230 + c * 130, 130 + r * 90, 70, 55);
      }
    }
    // door
    ctx.fillStyle = "#8a5030";
    ctx.fillRect(450, 260, 70, 100);

    // board hint
    ctx.fillStyle = "#2a5040";
    ctx.fillRect(300, 140, 160, 50);
    ctx.fillStyle = "#e8f0e0";
    ctx.font = "700 14px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Батыр · урок", 380, 170);

    ctx.fillStyle = "#c8b898";
    ctx.fillRect(0, VH * 0.78, VW, VH * 0.22);

    // dog waiting outside school when in school mode
  }

  function drawDog() {
    const bob = Math.sin(dog.bob) * 3;
    ctx.save();
    ctx.translate(dog.x, dog.y + bob);

    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 36, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // body under mish
    ctx.fillStyle = "#c89050";
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8c890";
    ctx.beginPath();
    ctx.ellipse(-8, 4, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.fillStyle = "#b87840";
    ctx.beginPath();
    ctx.ellipse(-30, -6, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0e0c8";
    ctx.beginPath();
    ctx.ellipse(-40, -2, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#302018";
    ctx.beginPath();
    ctx.arc(-45, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    // ears
    ctx.fillStyle = "#a06830";
    ctx.beginPath();
    ctx.ellipse(-36, -20, 7, 12, -0.3, 0, Math.PI * 2);
    ctx.ellipse(-22, -18, 7, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#203040";
    ctx.beginPath();
    ctx.arc(-34, -8, 2.5, 0, Math.PI * 2);
    ctx.arc(-26, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // short legs
    ctx.fillStyle = "#a07040";
    ctx.fillRect(-24, 12, 11, 12);
    ctx.fillRect(-6, 12, 11, 12);
    ctx.fillRect(10, 12, 11, 12);
    ctx.fillRect(24, 12, 10, 12);

    // tail
    ctx.strokeStyle = "#b87840";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(34, -2);
    ctx.quadraticCurveTo(48, -16 + Math.sin(dog.bob * 4) * 8, 42, -4);
    ctx.stroke();

    ctx.fillStyle = "#506040";
    ctx.font = "700 11px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("пёс", 0, 36);

    if (dog.effect === "pet" || dog.effect === "feed") {
      ctx.font = "16px serif";
      ctx.fillText("♥", 20, -24);
    }

    ctx.restore();
  }

  function drawMish() {
    const bob = Math.sin(mish.bob) * 3;
    ctx.save();
    ctx.translate(mish.x, mish.y + bob);

    // UNIQUE look: Batyr — gold trim chapan, tall hat, different face
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 48, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // boots
    ctx.fillStyle = "#3a2818";
    ctx.fillRect(-16, 38, 12, 16);
    ctx.fillRect(4, 38, 12, 16);

    // chapan / robe — deep teal + gold (not generic hoodie)
    ctx.fillStyle = "#1a6058";
    ctx.beginPath();
    ctx.moveTo(-26, 8);
    ctx.lineTo(-30, 42);
    ctx.lineTo(30, 42);
    ctx.lineTo(26, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#e8b050";
    ctx.lineWidth = 3;
    ctx.strokeRect(-22, 12, 44, 26);
    // belt
    ctx.fillStyle = "#c05030";
    ctx.fillRect(-24, 28, 48, 7);
    ctx.fillStyle = "#e8b050";
    ctx.fillRect(-4, 27, 8, 9);

    // arms
    ctx.fillStyle = "#e8b090";
    ctx.beginPath();
    ctx.arc(-28, 18, 8, 0, Math.PI * 2);
    ctx.arc(28, 18, 8, 0, Math.PI * 2);
    ctx.fill();

    // head
    ctx.fillStyle = "#f0c8a0";
    ctx.beginPath();
    ctx.arc(0, -8, 22, 0, Math.PI * 2);
    ctx.fill();

    // Batyr hat — tall felt with crest (unique)
    ctx.fillStyle = "#2a3848";
    ctx.beginPath();
    ctx.moveTo(-24, -18);
    ctx.lineTo(-18, -48);
    ctx.lineTo(0, -56);
    ctx.lineTo(18, -48);
    ctx.lineTo(24, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e8b050";
    ctx.fillRect(-20, -22, 40, 6);
    ctx.beginPath();
    ctx.arc(0, -56, 6, 0, Math.PI * 2);
    ctx.fill();
    // side flaps
    ctx.fillStyle = "#c05030";
    ctx.beginPath();
    ctx.ellipse(-26, -10, 6, 12, -0.2, 0, Math.PI * 2);
    ctx.ellipse(26, -10, 6, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // eyes by emotion
    ctx.fillStyle = "#1e2830";
    const emo = mish.emo;
    if (emo === "sleep") {
      ctx.strokeStyle = "#1e2830";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(-4, -10);
      ctx.moveTo(4, -10);
      ctx.lineTo(10, -10);
      ctx.stroke();
    } else if (emo === "angry") {
      ctx.beginPath();
      ctx.moveTo(-12, -14);
      ctx.lineTo(-4, -10);
      ctx.lineTo(-12, -8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, -14);
      ctx.lineTo(4, -10);
      ctx.lineTo(12, -8);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-8, -10, 3.2, 0, Math.PI * 2);
      ctx.arc(8, -10, 3.2, 0, Math.PI * 2);
      ctx.fill();
      if (emo === "wow" || emo === "joy") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-7, -11, 1.2, 0, Math.PI * 2);
        ctx.arc(9, -11, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // mouth
    ctx.strokeStyle = "#1e2830";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (emo === "funny" || emo === "party" || emo === "joy") {
      ctx.arc(0, -2, 8, 0.15, Math.PI - 0.15);
    } else if (emo === "shy" || emo === "think") {
      ctx.arc(0, 2, 5, 0.1, Math.PI - 0.1);
    } else if (emo === "angry") {
      ctx.moveTo(-6, 2);
      ctx.lineTo(6, 2);
    } else {
      ctx.arc(0, 0, 6, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // cheek marks (batyr style)
    ctx.fillStyle = "rgba(192, 80, 48, 0.35)";
    ctx.beginPath();
    ctx.ellipse(-14, -2, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(14, -2, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // nameplate
    ctx.fillStyle = "#e8b050";
    ctx.font = "800 12px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Батырский Миш", 0, -66);

    if (mish.effect === "emo") {
      const e = EMOTIONS.find((x) => x.id === mish.emo);
      if (e) {
        ctx.font = "22px serif";
        ctx.fillText(e.icon, 28, -40);
      }
    }

    ctx.restore();
  }

  function draw() {
    if (place === "school") drawSchool();
    else drawForest();

    // dog under mish first (behind/under)
    drawDog();
    drawMish();

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // infinite emotions badge
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(VW - 150, 12, 130, 28);
    ctx.fillStyle = "#8060c0";
    ctx.font = "700 12px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("эмоции ∞", VW - 85, 31);
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

  document.querySelectorAll(".mode").forEach((btn) => {
    btn.addEventListener("click", () => start(btn.dataset.mode));
  });
  document.getElementById("btnMenu").onclick = showMenu;

  window.addEventListener("keydown", (e) => {
    if (!playing || mode !== "both") return;
    if (e.key === "s" || e.key === "S") {
      place = "school";
      buildUI();
      updatePlaceLabel();
    }
    if (e.key === "f" || e.key === "F") {
      place = "forest";
      buildUI();
      updatePlaceLabel();
    }
  });

  requestAnimationFrame(frame);
})();
