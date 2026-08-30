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
  let stretchTimer = null;

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2800);
  }

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    masterGain.gain.value = ($("vol").value / 100) * 0.85;
  }

  function vol() { return ($("vol").value / 100) * 0.85; }

  /* ── ASMR sound synth ── */
  function playTone(freq, dur, type, gain) {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain * vol(), audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g);
    g.connect(masterGain);
    o.start();
    o.stop(audioCtx.currentTime + dur + 0.05);
  }

  function noiseBurst(dur, filterFreq, gain) {
    ensureAudio();
    const len = audioCtx.sampleRate * dur;
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filt = audioCtx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = filterFreq;
    const g = audioCtx.createGain();
    g.gain.value = gain * vol();
    src.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    src.start();
  }

  function squishSound() {
    playTone(120 + Math.random() * 40, 0.15, "sine", 0.25);
    setTimeout(() => playTone(80, 0.2, "triangle", 0.15), 40);
  }

  function iceCrack() {
    noiseBurst(0.08, 4000, 0.35);
    playTone(800 + Math.random() * 400, 0.06, "square", 0.08);
  }

  function popSound() {
    playTone(300 + Math.random() * 200, 0.05, "sine", 0.2);
  }

  function tapSound() {
    playTone(900 + Math.random() * 300, 0.04, "triangle", 0.12);
  }

  const SOUNDS = [
    { id: "rain", icon: "🌧", label: "Дождь", loop: true, start() {
      ensureAudio();
      const len = audioCtx.sampleRate * 2;
      const buf = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = audioCtx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 800;
      f.Q.value = 0.4;
      const g = audioCtx.createGain();
      g.gain.value = 0.12 * vol();
      src.connect(f);
      f.connect(g);
      g.connect(masterGain);
      src.start();
      return { stop: () => { try { src.stop(); } catch (_) {} } };
    }},
    { id: "wind", icon: "🍃", label: "Ветер", loop: true, start() {
      ensureAudio();
      const o = audioCtx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 55;
      const g = audioCtx.createGain();
      g.gain.value = 0.04 * vol();
      const f = audioCtx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 400;
      o.connect(f);
      f.connect(g);
      g.connect(masterGain);
      o.start();
      return { stop: () => { try { o.stop(); } catch (_) {} } };
    }},
    { id: "fire", icon: "🔥", label: "Костёр", loop: true, start() {
      ensureAudio();
      const id = setInterval(() => noiseBurst(0.15, 600, 0.08 + Math.random() * 0.06), 180 + Math.random() * 120);
      return { stop: () => clearInterval(id) };
    }},
    { id: "heart", icon: "💓", label: "Сердце", loop: true, start() {
      const id = setInterval(() => playTone(52, 0.12, "sine", 0.18), 900);
      return { stop: () => clearInterval(id) };
    }},
    { id: "purrs", icon: "🐱", label: "Мур", loop: true, start() {
      const id = setInterval(() => {
        playTone(25 + Math.random() * 8, 0.3, "sine", 0.12);
        noiseBurst(0.2, 200, 0.06);
      }, 1400);
      return { stop: () => clearInterval(id) };
    }},
    { id: "typing", icon: "⌨", label: "Клавиши", loop: false, play() {
      const keys = [0, 80, 160, 100, 200];
      keys.forEach((d, i) => setTimeout(() => tapSound(), d));
    }},
    { id: "bubble", icon: "🫧", label: "Пузыри", loop: false, play() {
      for (let i = 0; i < 5; i++) setTimeout(() => { playTone(400 + i * 80, 0.08, "sine", 0.1); popSound(); }, i * 220);
    }},
    { id: "water", icon: "💧", label: "Вода", loop: true, start() {
      const id = setInterval(() => noiseBurst(0.25, 1200, 0.07), 350);
      return { stop: () => clearInterval(id) };
    }},
    { id: "night", icon: "🌙", label: "Ночь", loop: true, start() {
      ensureAudio();
      const o = audioCtx.createOscillator();
      o.type = "sine";
      o.frequency.value = 110;
      const g = audioCtx.createGain();
      g.gain.value = 0.06 * vol();
      o.connect(g);
      g.connect(masterGain);
      o.start();
      return { stop: () => { try { o.stop(); } catch (_) {} } };
    }},
    { id: "scratch", icon: "✨", label: "Скраб", loop: false, play() {
      noiseBurst(0.4, 2500, 0.15);
    }},
  ];

  function toggleSound(id) {
    ensureAudio();
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
      btn.onclick = () => toggleSound(s.id);
      grid.appendChild(btn);
    });
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
    function down() { el.classList.add("squished"); squishSound(); }
    function up() { el.classList.remove("squished"); setTimeout(squishSound, 120); }
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
      cube.onclick = () => {
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
      p.onclick = () => {
        if (p.classList.contains("popped")) {
          p.classList.remove("popped");
        } else {
          p.classList.add("popped");
          popSound();
        }
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

  /* ── Experiments «что внутри» ── */
  const EXPERIMENTS = [
    { icon: "🍫", label: "Kinder", reveal: "Внутри — мягкий крем и хруст. ASMR: *тик* — крышка открылась. Пахнет шоколадом и спокойствием." },
    { icon: "🟢", label: "Nee Doh", reveal: "Желейный шар! Жми — он возвращается. Внутри воздух и satisfaction. Валера бы одобрил." },
    { icon: "🫧", label: "Pop-it", reveal: "Слой силикона с пузырями. Каждый *pop* — минус одна тревога." },
    { icon: "🧊", label: "Лёд", reveal: "Вода замёрзла. Треск — чистый звук. Холодно, но приятно." },
    { icon: "🥟", label: "Пельмень", reveal: "Тесто + начинка. Антистресс-пельмень: мягкий, тёплый, смешной." },
    { icon: "🎁", label: "Сюрприз", reveal: "Внутри — ничего страшного. Просто напоминание: ты заслужила отдых." },
  ];

  function renderExperiments() {
    const grid = $("exp-grid");
    grid.innerHTML = "";
    EXPERIMENTS.forEach((ex, i) => {
      const box = document.createElement("button");
      box.type = "button";
      box.className = "exp-box";
      box.innerHTML = `<div class="ico">${ex.icon}</div><div class="lbl">${ex.label}</div>`;
      box.onclick = () => {
        document.querySelectorAll(".exp-box").forEach((b) => b.classList.remove("open"));
        box.classList.add("open");
        $("exp-reveal").textContent = ex.reveal;
        tapSound();
        noiseBurst(0.12, 2000, 0.1);
        if (i === 1) squishSound();
        if (i === 3) iceCrack();
      };
      grid.appendChild(box);
    });
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
  };
  $("name-btn").onclick = renameBuddy;
  $("name-in").onkeydown = (e) => { if (e.key === "Enter") renameBuddy(); };
  $("buddy").onclick = petBuddy;

  load();
  applyBuddy();
  renderSounds();
  initSquish();
  initIce();
  initPop();
  renderStretch();
  renderExperiments();
  initTabs();

  document.body.addEventListener("pointerdown", ensureAudio, { once: true });
})();
