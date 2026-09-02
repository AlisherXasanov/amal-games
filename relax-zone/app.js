(() => {
  "use strict";

  const STORAGE = "relax-zone-v1";
  const $ = (id) => document.getElementById(id);

  /* ── Secret companion names (promocodes) ── */
  const SECRETS = [
    { keys: ["валера", "valera"], emoji: "🦸", name: "Валера", msg: "Привет! Я Валера. Отдыхай — после тяжёлого дня ты заслужила тишину.", surprise: "🎁 Сюрприз: Валера принёс тёплый чай (воображаемый). Пей медленно." },
    { keys: ["баттерсквиш", "butterscotch", "баттер", "butter", "buttersquish"], emoji: "🧈", name: "Баттерсквиш", msg: "Squish… slow rise… ммм, приятно. Я сам баттерсквиш!", surprise: "🧈 Ты назвала меня правильно — slow-rise навсегда!" },
    { keys: ["аут", "out", "auto", "авто"], emoji: "🚗", name: "Аут", msg: "В честь Auto — тихая поездка без спешки. Просто дыши.", surprise: "🚗 Auto-mode: никаких задач, только отдых." },
    { keys: ["молли", "molly"], emoji: "🐕", name: "Молли", msg: "Молли гуляет с тобой в парке. Тишина и солнце.", surprise: "🐾 Молли принесла мячик — можно просто смотреть." },
    { keys: ["needoh", "нидо", "nidoh", "nee doh"], emoji: "🟢", name: "Nee Doh", msg: "Желейный антистресс. Жми — успокаивает.", surprise: "🟢 Желейный режим включён!" },
    { keys: ["познаватель", "poznavatel", "медведь"], emoji: "🐻", name: "Познаватель", msg: "Эксперименты потом. Сейчас — отдых и ASMR.", surprise: "🔬 Лаборатория закрыта на ночь. Спи спокойно." },
    { keys: ["ушастик", "ushastik", "уши"], emoji: "👂", name: "Ушастик", msg: "Я рядом. Можешь молчать — я всё равно слышу, как ты устала.", surprise: "👂 Ушастик накрыл тебя пледом." },
    { keys: ["лёд", "лед", "ice"], emoji: "🧊", name: "Лёдик", msg: "Прохладно и спокойно. Треск льда — чистый ASMR.", surprise: "❄️ Ледяной режим: прохладное дыхание." },
    { keys: ["амал", "amal", "amaya"], emoji: "💚", name: "Амал", msg: "Amaya Games шлёт тебе тихий вечер.", surprise: "💚 Секрет Amal: ты молодец, что отдыхаешь." },
    { keys: ["пельмень", "dumpling", "пельмешек"], emoji: "🥟", name: "Пельмешек", msg: "Тёплый пельмень-антистресс. Никто не голодный.", surprise: "🥟 Пельменная терапия активирована!" },
  ];

  let buddy = { emoji: "🌟", name: "Дружок", msg: "Ты устала? Давай тихо посидим.", skin: "default" };
  let audioCtx = null;
  let masterGain = null;
  let activeLoops = new Map();
  let loopGains = new Map();
  let audioReady = false;
  let stretchTimer = null;
  let breakTimer = null;

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2800);
  }

  async function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") await audioCtx.resume();
    masterGain.gain.value = vol();
    if (!audioReady) {
      audioReady = true;
      const hint = $("audio-hint");
      if (hint) { hint.textContent = "🔊 Звук включён — жми кнопки!"; hint.classList.add("ok"); }
      const buf = audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
      const s = audioCtx.createBufferSource();
      s.buffer = buf;
      s.connect(masterGain);
      s.start();
    }
  }

  function vol() { return Math.max(0.05, ($("vol").value / 100) * 0.95); }

  function setLoopVol(id, v) {
    const g = loopGains.get(id);
    if (g) g.gain.value = v;
  }

  /* ── ASMR sound synth (как squish/pop в видео) ── */
  function playTone(freq, dur, type, gain) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain * vol()), t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(masterGain);
    o.start(t0);
    o.stop(t0 + dur + 0.06);
  }

  function noiseBurst(dur, filterFreq, gain, type) {
    if (!audioCtx) return;
    const len = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * (1 - t * 0.85);
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filt = audioCtx.createBiquadFilter();
    filt.type = type || "lowpass";
    filt.frequency.value = filterFreq;
    const g = audioCtx.createGain();
    g.gain.value = gain * vol();
    src.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    src.start();
  }

  function squishSound() {
    ensureAudio();
    playTone(95 + Math.random() * 15, 0.18, "sine", 0.22);
    setTimeout(() => playTone(68 + Math.random() * 12, 0.24, "sine", 0.16), 40);
    setTimeout(() => noiseBurst(0.05, 380, 0.1, "lowpass"), 25);
  }

  function iceCrack() {
    ensureAudio();
    noiseBurst(0.05, 750, 0.14, "bandpass");
    playTone(260 + Math.random() * 60, 0.035, "sine", 0.06);
    setTimeout(() => noiseBurst(0.03, 520, 0.08, "lowpass"), 50);
  }

  function popSound() {
    ensureAudio();
    playTone(280 + Math.random() * 180, 0.06, "sine", 0.4);
    noiseBurst(0.04, 2200, 0.25, "bandpass");
  }

  function tapSound() {
    ensureAudio();
    playTone(800 + Math.random() * 400, 0.05, "triangle", 0.25);
  }

  function bellSound() {
    ensureAudio();
    [660, 880, 660].forEach((f, i) => setTimeout(() => playTone(f, 0.35, "sine", 0.35 - i * 0.05), i * 180));
  }

  function sliceSound() {
    ensureAudio();
    noiseBurst(0.15, 3500, 0.4, "bandpass");
    setTimeout(() => playTone(200, 0.08, "sawtooth", 0.12), 50);
  }

  /** Настоящий «мур» — постоянный низкий rumble + дрожь */
  function startPurrLoop() {
    const g = audioCtx.createGain();
    g.gain.value = 0.42 * vol();
    loopGains.set("purrs", g);
    g.connect(masterGain);

    const len = audioCtx.sampleRate * 3;
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const pulse = 0.35 + 0.65 * Math.abs(Math.sin(i / 45));
      d[i] = (Math.random() * 2 - 1) * pulse;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const nf = audioCtx.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.value = 180;
    src.connect(nf);
    nf.connect(g);
    src.start();

    const o1 = audioCtx.createOscillator();
    o1.type = "triangle";
    o1.frequency.value = 24;
    const og = audioCtx.createGain();
    og.gain.value = 0.3 * vol();
    o1.connect(og);
    og.connect(g);
    o1.start();

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 3.5;
    const lfoG = audioCtx.createGain();
    lfoG.gain.value = 6;
    lfo.connect(lfoG);
    lfoG.connect(o1.frequency);
    lfo.start();

    const o2 = audioCtx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 48;
    const og2 = audioCtx.createGain();
    og2.gain.value = 0.15 * vol();
    o2.connect(og2);
    og2.connect(g);
    o2.start();

    return {
      stop: () => {
        try {
          src.stop();
          o1.stop();
          o2.stop();
          lfo.stop();
          loopGains.delete("purrs");
        } catch (_) {}
      },
    };
  }

  const SOUNDS = [
    { id: "rain", icon: "🌧", label: "Дождь", loop: true, start() {
      const len = audioCtx.sampleRate * 3;
      const buf = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.55;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = audioCtx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 900;
      f.Q.value = 0.35;
      const g = audioCtx.createGain();
      g.gain.value = 0.22 * vol();
      loopGains.set("rain", g);
      src.connect(f);
      f.connect(g);
      g.connect(masterGain);
      src.start();
      return { stop: () => { try { src.stop(); loopGains.delete("rain"); } catch (_) {} } };
    }},
    { id: "wind", icon: "🍃", label: "Ветер", loop: true, start() {
      const len = audioCtx.sampleRate * 4;
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = audioCtx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 450;
      const g = audioCtx.createGain();
      g.gain.value = 0.18 * vol();
      loopGains.set("wind", g);
      src.connect(f);
      f.connect(g);
      g.connect(masterGain);
      src.start();
      return { stop: () => { try { src.stop(); loopGains.delete("wind"); } catch (_) {} } };
    }},
    { id: "fire", icon: "🔥", label: "Костёр", loop: true, start() {
      const id = setInterval(() => {
        ensureAudio();
        noiseBurst(0.18, 700, 0.14 + Math.random() * 0.08);
        if (Math.random() < 0.3) playTone(180 + Math.random() * 80, 0.08, "triangle", 0.08);
      }, 160 + Math.random() * 100);
      return { stop: () => clearInterval(id) };
    }},
    { id: "heart", icon: "💓", label: "Сердце", loop: true, start() {
      const id = setInterval(() => { ensureAudio(); playTone(58, 0.14, "sine", 0.35); }, 850);
      return { stop: () => clearInterval(id) };
    }},
    { id: "purrs", icon: "🐱", label: "Мур", loop: true, start() { return startPurrLoop(); }},
    { id: "typing", icon: "⌨", label: "Клавиши", loop: false, play() {
      [0, 70, 140, 90, 200, 260].forEach((d) => setTimeout(tapSound, d));
    }},
    { id: "bubble", icon: "🫧", label: "Пузыри", loop: false, play() {
      for (let i = 0; i < 6; i++) setTimeout(() => popSound(), i * 200);
    }},
    { id: "water", icon: "💧", label: "Вода", loop: true, start() {
      const id = setInterval(() => { ensureAudio(); noiseBurst(0.3, 1400, 0.12, "bandpass"); }, 280);
      return { stop: () => clearInterval(id) };
    }},
    { id: "night", icon: "🌙", label: "Ночь", loop: true, start() {
      const o = audioCtx.createOscillator();
      o.type = "sine";
      o.frequency.value = 98;
      const g = audioCtx.createGain();
      g.gain.value = 0.12 * vol();
      loopGains.set("night", g);
      o.connect(g);
      g.connect(masterGain);
      o.start();
      return { stop: () => { try { o.stop(); loopGains.delete("night"); } catch (_) {} } };
    }},
    { id: "scratch", icon: "✨", label: "Скраб", loop: false, play() {
      noiseBurst(0.5, 2800, 0.35, "bandpass");
      setTimeout(() => noiseBurst(0.3, 3200, 0.2, "highpass"), 120);
    }},
    { id: "squish", icon: "🧈", label: "Squish", loop: false, play() {
      squishSound();
      setTimeout(squishSound, 350);
      setTimeout(squishSound, 700);
    }},
  ];

  async function toggleSound(id) {
    await ensureAudio();
    if (activeLoops.has(id)) {
      activeLoops.get(id).stop();
      activeLoops.delete(id);
      document.querySelector(`[data-sound="${id}"]`)?.classList.remove("on");
      return;
    }
    const def = SOUNDS.find((s) => s.id === id);
    if (!def) return;
    if (def.loop && def.start) {
      activeLoops.set(id, def.start());
      document.querySelector(`[data-sound="${id}"]`)?.classList.add("on");
    } else if (def.play) {
      def.play();
      document.querySelector(`[data-sound="${id}"]`)?.classList.add("on");
      setTimeout(() => document.querySelector(`[data-sound="${id}"]`)?.classList.remove("on"), 600);
    }
  }

  function stopAllSounds() {
    activeLoops.forEach((h) => h.stop());
    activeLoops.clear();
    document.querySelectorAll(".sound-btn.on").forEach((b) => b.classList.remove("on"));
  }

  function renderSounds() {
    const grid = $("sound-grid");
    grid.innerHTML = "";
    SOUNDS.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sound-btn";
      btn.dataset.sound = s.id;
      btn.innerHTML = `<span class="ico">${s.icon}</span><span class="lbl">${s.label}</span>`;
      btn.onclick = () => { toggleSound(s.id); };
      grid.appendChild(btn);
    });
  }

  async function startBreak() {
    await ensureAudio();
    stopAllSounds();
    if (breakTimer) clearTimeout(breakTimer);
    bellSound();
    toast("🔔 Перемена! 5 минут тишины — дыши");
    $("buddy-msg").textContent = "Перемена. Можно просто сидеть. Никто не торопит.";
    await toggleSound("rain");
    setTimeout(() => toggleSound("wind"), 400);
    breakTimer = setTimeout(() => {
      bellSound();
      toast("🔔 Перемена кончилась — молодец!");
      $("buddy-msg").textContent = "Хочешь потянуться? Вкладка 🙆";
    }, 5 * 60 * 1000);
  }

  /* ── Companion ── */
  function applyBuddy() {
    $("buddy").textContent = buddy.emoji;
    $("buddy-name").textContent = buddy.name;
    $("buddy-msg").textContent = buddy.msg;
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ name: buddy.name, skin: buddy.skin }));
    } catch (_) {}
  }

  function matchSecret(raw) {
    const q = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!q) return null;
    return SECRETS.find((s) => s.keys.some((k) => k.replace(/\s+/g, "") === q));
  }

  function renameBuddy() {
    const raw = $("name-in").value;
    const secret = matchSecret(raw);
    if (secret) {
      buddy = { emoji: secret.emoji, name: secret.name, msg: secret.msg, skin: secret.keys[0] };
      applyBuddy();
      toast(secret.surprise || "✨ Секретное имя!");
      $("name-in").value = "";
      return;
    }
    if (raw.trim()) {
      buddy = { emoji: "💫", name: raw.trim(), msg: `Привет, я ${raw.trim()}! Буду рядом, пока ты отдыхаешь.`, skin: "custom" };
      applyBuddy();
      toast("Компаньон переименован");
      $("name-in").value = "";
    }
  }

  function petBuddy() {
    const el = $("buddy");
    el.classList.add("pet");
    squishSound();
    setTimeout(() => el.classList.remove("pet"), 280);
    const msgs = [
      "Ммм… приятно.",
      "Ты молодец, что отдыхаешь.",
      "Тише… всё хорошо.",
      "Я здесь.",
    ];
    $("buddy-msg").textContent = msgs[Math.floor(Math.random() * msgs.length)];
  }

  /* ── Toys ── */
  function initSquish() {
    const el = $("squish");
    async function down() { await ensureAudio(); el.classList.add("squished"); squishSound(); }
    async function up() { el.classList.remove("squished"); setTimeout(squishSound, 120); }
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); down(); });
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
  }

  function initIce() {
    const board = $("ice-board");
    board.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const cube = document.createElement("button");
      cube.type = "button";
      cube.className = "ice-cube";
      cube.setAttribute("aria-label", "Ледяной кубик");
      cube.onclick = async () => {
        await ensureAudio();
        if (cube.classList.contains("cracked")) return;
        cube.classList.add("cracked");
        iceCrack();
      };
      board.appendChild(cube);
    }
  }

  function initPop() {
    const grid = $("pop-grid");
    grid.innerHTML = "";
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("button");
      p.type = "button";
      p.className = "pop";
      p.onclick = async () => {
        await ensureAudio();
        if (p.classList.contains("popped")) p.classList.remove("popped");
        else { p.classList.add("popped"); popSound(); }
      };
      grid.appendChild(p);
    }
  }

  /* ── Stretch ── */
  const STRETCHES = [
    { icon: "🙆", title: "Руки вверх", hint: "Медленно подними руки. Вдох… выдох…", sec: 15 },
    { icon: "🤸", title: "Наклон в сторону", hint: "Наклонись влево, потом вправо. Не торопись.", sec: 20 },
    { icon: "🧘", title: "Плечи", hint: "Круги плечами — назад, медленно.", sec: 15 },
    { icon: "🦒", title: "Шея", hint: "Голова влево… вправо… очень плавно.", sec: 18 },
    { icon: "🐱", title: "Спина", hint: "Кошка: округли спину, потом прогнись.", sec: 20 },
    { icon: "🌸", title: "Готово", hint: "Глубокий вдох. Ты молодец. Можно снова в ASMR.", sec: 10 },
  ];

  function renderStretch() {
    const list = $("stretch-list");
    list.innerHTML = "";
    STRETCHES.forEach((s, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "stretch-item";
      el.innerHTML = `<h3>${s.icon} ${s.title}</h3><p>${s.hint} · ${s.sec} сек</p>`;
      el.onclick = () => startStretch(i, el);
      list.appendChild(el);
    });
  }

  function startStretch(i, el) {
    if (stretchTimer) clearInterval(stretchTimer);
    stopAllSounds();
    document.querySelectorAll(".stretch-item").forEach((x) => x.classList.remove("active"));
    el.classList.add("active");
    const s = STRETCHES[i];
    let left = s.sec;
    $("stretch-timer").classList.add("on");
    $("stretch-anim").textContent = s.icon;
    $("stretch-sec").textContent = String(left);
    $("stretch-hint").textContent = s.hint;
    toast("Потянись: " + s.title);
    stretchTimer = setInterval(() => {
      left--;
      $("stretch-sec").textContent = String(Math.max(0, left));
      if (left <= 0) {
        clearInterval(stretchTimer);
        stretchTimer = null;
        playTone(440, 0.3, "sine", 0.15);
        toast("✨ Отлично! Можно отдохнуть дальше.");
        $("stretch-hint").textContent = "Готово! Выбери звук или антистресс.";
      }
    }, 1000);
  }

  async function startSick() {
    await ensureAudio();
    stopAllSounds();
    toast("🤒 Лежи спокойно — включила мур");
    $("buddy-msg").textContent = "Болеешь? Ничего страшного. Мур-мур… отдыхай.";
    if (!$("buddy").textContent.includes("🐱")) $("buddy").textContent = "🐱";
    await toggleSound("purrs");
    setTimeout(() => toggleSound("night"), 300);
  }

  /* ── «Что внутри» — каждый предмет открывается по-своему (inside-scenes.js) ── */
  let insideAnim = null;

  function drawInsideScene(ex, p) {
    const c = $("cut-canvas");
    if (!c || !window.RelaxInside) return;
    RelaxInside.draw(c.getContext("2d"), c.width, c.height, ex, p);
  }

  function playInsideSound(ex, sounds) {
    const t = ex.type;
    if (t === "kinderSurprise" || t === "kinderMaxi" || t === "kinderJoy") {
      sounds.tapSound();
      setTimeout(sounds.tapSound, 280);
    } else if (t === "kinderChoco") {
      sounds.sliceSound();
    } else if (t === "neeDoh" || t === "slime") {
      sounds.squishSound();
    } else if (t === "ice") {
      sounds.iceCrack();
    } else if (t === "popIt") {
      for (let i = 0; i < 4; i++) setTimeout(sounds.popSound, i * 110);
    } else if (t === "balloon") {
      setTimeout(() => { sounds.noiseBurst(0.18, 800, 0.18, "lowpass"); sounds.popSound(); }, 480);
    } else {
      sounds.tapSound();
    }
  }

  function animateInside(ex) {
    if (insideAnim) cancelAnimationFrame(insideAnim);
    let p = 0;
    const step = () => {
      p = Math.min(1, p + 0.013);
      drawInsideScene(ex, p);
      if (p < 1) insideAnim = requestAnimationFrame(step);
      else insideAnim = null;
    };
    step();
  }

  function renderExperiments() {
    const list = window.RelaxInside ? RelaxInside.EXPERIMENTS : [];
    const grid = $("exp-grid");
    grid.innerHTML = "";
    list.forEach((ex) => {
      const box = document.createElement("button");
      box.type = "button";
      box.className = "exp-box";
      box.innerHTML = `<div class="ico">${ex.icon}</div><div class="lbl">${ex.label}</div>`;
      box.onclick = async () => {
        await ensureAudio();
        document.querySelectorAll(".exp-box").forEach((b) => b.classList.remove("open"));
        box.classList.add("open");
        $("exp-reveal").textContent = ex.reveal;
        animateInside(ex);
        playInsideSound(ex, { tapSound, sliceSound, squishSound, iceCrack, popSound, noiseBurst });
      };
      grid.appendChild(box);
    });
    if (list[0]) drawInsideScene(list[0], 0);
  }

  function initFreeze() {
    const el = $("freeze");
    if (!el) return;
    el.onclick = async () => {
      await ensureAudio();
      if (el.classList.contains("melt")) {
        el.classList.remove("melt");
        toast("Снова заморозили ❄️");
        return;
      }
      iceCrack();
      setTimeout(iceCrack, 200);
      el.classList.add("melt");
      toast("Тает… медленно…");
    };
  }

  /* ── Tabs ── */
  function initTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.onclick = () => {
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
        document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
        tab.classList.add("on");
        $("panel-" + tab.dataset.tab).classList.add("on");
      };
    });
  }

  /* ── Init ── */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const d = JSON.parse(raw);
        const secret = SECRETS.find((s) => s.name === d.name || s.keys.includes(d.skin));
        if (secret) buddy = { emoji: secret.emoji, name: secret.name, msg: secret.msg, skin: secret.keys[0] };
        else if (d.name) buddy = { emoji: "💫", name: d.name, msg: `Снова привет, ${d.name}!`, skin: "custom" };
      }
    } catch (_) {}
  }

  $("vol").oninput = () => {
    if (masterGain) masterGain.gain.value = vol();
    loopGains.forEach((g, id) => {
      const bases = { rain: 0.22, wind: 0.18, night: 0.12, purrs: 0.42 };
      g.gain.value = (bases[id] || 0.12) * vol();
    });
  };
  $("name-btn").onclick = renameBuddy;
  $("name-in").onkeydown = (e) => { if (e.key === "Enter") renameBuddy(); };
  $("buddy").onclick = async () => { await ensureAudio(); petBuddy(); };
  $("btn-break").onclick = () => startBreak();
  $("btn-sick").onclick = () => startSick();

  load();
  applyBuddy();
  renderSounds();
  initSquish();
  initIce();
  initPop();
  initFreeze();
  renderStretch();
  renderExperiments();
  initTabs();
})();
