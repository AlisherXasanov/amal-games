(() => {
  "use strict";

  const COLS = 9;
  const ROWS = 5;
  const CELL_W = 80;
  const CELL_H = 90;
  const LEFT = 90;
  const TOP = 30;

  /* ========== ЗВУК (Web Audio API) ========== */
  function readMuted() {
    try {
      return localStorage.getItem("zvp-muted") === "1";
    } catch (_) {
      return false;
    }
  }

  function writeMuted(value) {
    try {
      localStorage.setItem("zvp-muted", value ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
  }

  const AudioFX = {
    ctx: null,
    muted: readMuted(),
    musicNodes: null,
    musicTimer: null,
    musicStep: 0,
    unlock() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.startMusic();
      } catch (_) {
        /* ignore */
      }
    },
    beep(freq, dur, type = "square", vol = 0.08, slide = 0) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    noise(dur, vol = 0.05) {
      if (this.muted || !this.ctx) return;
      const t0 = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      src.buffer = buf;
      gain.gain.value = vol;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t0);
    },
    startMusic() {
      if (!this.ctx || this.muted || this.musicTimer) return;
      // Мелодия в стиле «садовая тревога»: бас + простая тема
      const melody = [262, 311, 349, 392, 349, 311, 262, 233, 262, 311, 349, 415, 392, 349, 311, 262];
      const bass = [131, 131, 155, 155, 175, 175, 147, 147];
      const stepMs = 320;
      this.musicTimer = setInterval(() => {
        if (this.muted || !this.ctx) return;
        const i = this.musicStep % melody.length;
        const m = melody[i];
        const b = bass[this.musicStep % bass.length];
        this.beep(b, 0.28, "triangle", 0.035);
        this.beep(m, 0.22, "square", 0.028);
        if (i % 4 === 0) this.beep(m * 1.5, 0.12, "sine", 0.018);
        this.musicStep += 1;
      }, stepMs);
    },
    stopMusic() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },
    plant() { this.beep(220, 0.08, "triangle", 0.07); this.beep(330, 0.1, "triangle", 0.05); },
    shoot() { this.beep(480, 0.05, "square", 0.04, -120); },
    sun() { this.beep(660, 0.08, "sine", 0.06); this.beep(880, 0.1, "sine", 0.05); },
    hit() { this.beep(180, 0.06, "sawtooth", 0.04); },
    bite() { this.beep(90, 0.1, "sawtooth", 0.05); },
    explode() { this.noise(0.35, 0.12); this.beep(120, 0.25, "sawtooth", 0.08, -80); },
    mower() {
      this.noise(0.25, 0.08);
      this.beep(90, 0.35, "sawtooth", 0.06, 80);
      this.beep(140, 0.2, "square", 0.04, 40);
    },
    wave() { this.beep(200, 0.15, "triangle", 0.07, 200); },
    win() { this.beep(523, 0.12, "sine", 0.07); setTimeout(() => this.beep(659, 0.12, "sine", 0.07), 120); setTimeout(() => this.beep(784, 0.2, "sine", 0.08), 240); },
    lose() { this.beep(300, 0.2, "sawtooth", 0.07, -150); setTimeout(() => this.beep(160, 0.3, "sawtooth", 0.08), 180); },
    click() { this.beep(500, 0.04, "square", 0.03); },
    zombie() { this.beep(110, 0.12, "sawtooth", 0.06, -30); },
  };

  const PLANT_TYPES = {
    sunflower: {
      id: "sunflower",
      name: "Подсолнух",
      icon: "🌻",
      cost: 50,
      hp: 80,
      unlock: 1,
      produce: 25,
      produceEvery: 7,
    },
    peashooter: {
      id: "peashooter",
      name: "Горохострел",
      icon: "🌱",
      cost: 100,
      hp: 100,
      unlock: 1,
      damage: 20,
      shootEvery: 1.4,
      peaColor: "#8fd94f",
    },
    wallnut: {
      id: "wallnut",
      name: "Орех",
      icon: "🥜",
      cost: 50,
      hp: 400,
      unlock: 1,
    },
    potatomine: {
      id: "potatomine",
      name: "Мина",
      icon: "🥔",
      cost: 25,
      hp: 60,
      unlock: 2,
      armTime: 7,
      blastDamage: 900,
      blastRadius: 50,
    },
    snowpea: {
      id: "snowpea",
      name: "Снежный горох",
      icon: "❄️",
      cost: 175,
      hp: 100,
      unlock: 2,
      damage: 18,
      shootEvery: 1.5,
      slow: 0.45,
      slowTime: 3,
      peaColor: "#9ad8ff",
    },
    repeater: {
      id: "repeater",
      name: "Двойной горох",
      icon: "🌿",
      cost: 200,
      hp: 120,
      unlock: 3,
      damage: 20,
      shootEvery: 1.5,
      doubleShot: true,
      peaColor: "#7ed957",
    },
    cherrybomb: {
      id: "cherrybomb",
      name: "Вишня-бомба",
      icon: "🍒",
      cost: 150,
      hp: 80,
      unlock: 3,
      fuse: 1.1,
      blastDamage: 500,
      blastCells: 1,
    },
    jalapeno: {
      id: "jalapeno",
      name: "Халапеньо",
      icon: "🌶️",
      cost: 125,
      hp: 80,
      unlock: 4,
      fuse: 0.9,
      rowClear: true,
      blastDamage: 999,
    },
    cactus: {
      id: "cactus",
      name: "Кактус",
      icon: "🌵",
      cost: 125,
      hp: 140,
      unlock: 2,
      damage: 35,
      shootEvery: 1.8,
      peaColor: "#d8e85a",
    },
    puffshroom: {
      id: "puffshroom",
      name: "Гриб",
      icon: "🍄",
      cost: 25,
      hp: 70,
      unlock: 3,
      damage: 12,
      shootEvery: 0.9,
      peaColor: "#d59cff",
    },
    mowerthrower: {
      id: "mowerthrower",
      name: "Кот-мышь-косилка",
      icon: "🐱🐭",
      cost: 400,
      hp: 300,
      unlock: 19,
      damage: 9999,
      shootEvery: 3,
      lifeTime: 20,
      mowerShot: true,
      peaColor: "#c0c8d0",
    },
  };

  const ZOMBIE_TYPES = {
    normal: {
      id: "normal",
      name: "Обычный",
      icon: "🧟",
      cost: 50,
      hp: 120,
      speed: 18,
      damage: 18,
      biteEvery: 1,
      color: "#8fbc7a",
    },
    runner: {
      id: "runner",
      name: "Быстрый",
      icon: "🏃",
      cost: 75,
      hp: 80,
      speed: 34,
      damage: 12,
      biteEvery: 0.8,
      color: "#c9d46a",
    },
    tank: {
      id: "tank",
      name: "Тяжёлый",
      icon: "🧱",
      cost: 125,
      hp: 320,
      speed: 11,
      damage: 28,
      biteEvery: 1.2,
      color: "#6a8f6a",
    },
    cone: {
      id: "cone",
      name: "С конусом",
      icon: "🔶",
      cost: 90,
      hp: 210,
      speed: 16,
      damage: 20,
      biteEvery: 1,
      color: "#86a976",
    },
    bucket: {
      id: "bucket",
      name: "С ведром",
      icon: "🪣",
      cost: 160,
      hp: 430,
      speed: 10,
      damage: 30,
      biteEvery: 1.1,
      color: "#66865f",
    },
    giant: {
      id: "giant",
      name: "Гигант",
      icon: "👹",
      cost: 400,
      hp: 2000,
      speed: 7,
      damage: 90,
      biteEvery: 1.4,
      color: "#4f6b4a",
      scale: 1.9,
    },
  };

  const ADVANCED_LEVEL_DESCRIPTIONS = [
    "Ускорение",
    "Конусная атака",
    "Крепкая оборона",
    "Быстрая орда",
    "Десятая волна",
    "Тяжёлый марш",
    "Вёдра наступают",
    "Опасный сад",
    "Большая орда",
    "Испытание",
    "Непрерывный натиск",
    "Стальная колонна",
    "Последний рубеж",
    "Кот-мышь-косилка",
    "Ночь гигантов",
    "Первый гигант",
    "Два гиганта",
    "Гиганты и вёдра",
    "Толпа гигантов",
    "Стена из гигантов",
    "Гигантская осада",
    "Перед финалом",
    "Финал: косилкомёт",
  ];

  function createAdvancedLevel(id) {
    const tier = id - 6;
    const waveCount = 5 + Math.floor(tier / 5);
    const zombiePool =
      id < 8
        ? ["normal", "runner", "cone"]
        : id < 12
          ? ["normal", "runner", "cone", "tank"]
          : id < 21
            ? ["normal", "runner", "cone", "tank", "bucket"]
            : ["normal", "runner", "cone", "tank", "bucket", "giant"];
    const waves = Array.from({ length: waveCount }, (_, waveIndex) => {
      const zombieCount = Math.min(
        5 + Math.floor((id - 6) / 3) + waveIndex,
        13
      );
      const zombies = Array.from(
        { length: zombieCount },
        (_, zombieIndex) =>
          zombiePool[(id + waveIndex * 2 + zombieIndex) % zombiePool.length]
      );
      if (id >= 21 && waveIndex >= Math.max(0, waveCount - 2)) {
        zombies[0] = "giant";
        if (id >= 22 && zombies.length > 2) zombies[2] = "giant";
        if (id >= 25 && zombies.length > 4) zombies[4] = "giant";
      }
      return {
        delay: 5 + waveIndex * 10,
        zombies,
      };
    });

    const defensePool = [
      "sunflower",
      "peashooter",
      "wallnut",
      "snowpea",
      "repeater",
      "cactus",
    ];
    const defenseCount = Math.min(5 + Math.floor((id - 5) / 3), 10);
    const plantDefense = Array.from(
      { length: defenseCount },
      (_, index) => defensePool[(id + index) % defensePool.length]
    );

    return {
      id,
      name: `Уровень ${id}`,
      desc: ADVANCED_LEVEL_DESCRIPTIONS[tier],
      rows: 5,
      startResource: 250 + (id - 5) * 10 + (id >= 28 ? 200 : 0),
      zombieStartResource: 260 + id * 10 + (id >= 21 ? 150 : 0),
      waves,
      plantDefense,
      zombiePlantDefense: plantDefense,
      zombieAiInterval: Math.max(1.4, 3.2 - tier * 0.08),
      zombieBrainEvery: 1,
      zombieBrainAmount: 12 + (id >= 21 ? 4 : 0),
      zombieMaxPerRow: id >= 21 ? 5 : 4,
      zombieAiPlants: ["peashooter", "snowpea", "repeater", "cactus"],
    };
  }

  const LEVELS = [
    {
      id: 1,
      name: "Уровень 1",
      desc: "Разминка",
      rows: 3,
      startResource: 150,
      zombieStartResource: 300,
      waves: [
        { delay: 8, zombies: ["normal", "normal"] },
        { delay: 18, zombies: ["normal", "normal", "runner"] },
        { delay: 30, zombies: ["normal", "normal", "normal", "runner"] },
      ],
      plantDefense: ["peashooter", "sunflower", "peashooter"],
      // Для зомби уровень 1 очень лёгкий: мало защиты, медленный ИИ
      zombiePlantDefense: ["peashooter"],
      zombieSunflowers: false,
      zombieAiInterval: 7,
      zombieBrainEvery: 0.7,
      zombieBrainAmount: 15,
      zombieMaxPerRow: 2,
      zombieAiPlants: ["peashooter"],
    },
    {
      id: 2,
      name: "Уровень 2",
      desc: "Мина и лёд",
      rows: 4,
      startResource: 175,
      zombieStartResource: 220,
      waves: [
        { delay: 7, zombies: ["normal", "normal", "runner"] },
        { delay: 16, zombies: ["normal", "runner", "runner", "normal"] },
        { delay: 26, zombies: ["tank", "normal", "runner", "normal"] },
        { delay: 38, zombies: ["normal", "tank", "runner", "normal", "runner"] },
      ],
      plantDefense: ["sunflower", "peashooter", "wallnut", "snowpea"],
      zombiePlantDefense: ["peashooter", "sunflower"],
      zombieAiInterval: 4,
      zombieBrainEvery: 1,
      zombieBrainAmount: 12,
      zombieMaxPerRow: 3,
      zombieAiPlants: ["peashooter"],
    },
    {
      id: 3,
      name: "Уровень 3",
      desc: "Взрывы",
      rows: 5,
      startResource: 200,
      waves: [
        { delay: 6, zombies: ["normal", "runner", "normal"] },
        { delay: 14, zombies: ["runner", "tank", "normal", "runner"] },
        { delay: 24, zombies: ["cone", "normal", "runner", "tank", "normal"] },
        { delay: 36, zombies: ["runner", "runner", "cone", "normal", "tank", "runner"] },
        { delay: 48, zombies: ["tank", "tank", "runner", "normal", "runner", "normal", "tank"] },
      ],
      plantDefense: ["sunflower", "repeater", "wallnut", "peashooter", "snowpea"],
    },
    {
      id: 4,
      name: "Уровень 4",
      desc: "Ночной натиск",
      rows: 5,
      startResource: 225,
      waves: [
        { delay: 5, zombies: ["runner", "runner", "normal", "normal"] },
        { delay: 12, zombies: ["tank", "runner", "normal", "runner", "normal"] },
        { delay: 22, zombies: ["tank", "cone", "runner", "runner", "normal", "bucket"] },
        { delay: 34, zombies: ["runner", "tank", "tank", "runner", "normal", "tank"] },
        { delay: 46, zombies: ["tank", "runner", "tank", "runner", "tank", "normal", "runner", "normal"] },
      ],
      plantDefense: ["sunflower", "repeater", "wallnut", "snowpea", "wallnut"],
    },
    {
      id: 5,
      name: "Уровень 5",
      desc: "Первая большая битва",
      rows: 5,
      startResource: 250,
      waves: [
        { delay: 4, zombies: ["runner", "normal", "runner", "normal"] },
        { delay: 10, zombies: ["tank", "runner", "tank", "normal", "runner"] },
        { delay: 18, zombies: ["tank", "bucket", "runner", "runner", "normal", "cone"] },
        { delay: 28, zombies: ["runner", "tank", "runner", "tank", "normal", "runner", "tank"] },
        { delay: 40, zombies: ["tank", "tank", "runner", "tank", "runner", "normal", "tank", "runner", "normal"] },
        { delay: 55, zombies: ["tank", "tank", "tank", "runner", "runner", "runner", "normal", "normal", "tank"] },
      ],
      plantDefense: ["sunflower", "repeater", "wallnut", "snowpea", "repeater"],
    },
    ...Array.from({ length: 23 }, (_, index) =>
      createAdvancedLevel(index + 6)
    ),
  ];

  const state = {
    screen: "menu",
    side: null,
    levelIndex: 0,
    selectedUnit: null,
    resource: 0,
    time: 0,
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [],
    fx: [],
    mowers: [],
    waveIndex: 0,
    wavesSpawned: 0,
    running: false,
    paused: false,
    won: false,
    lost: false,
    lastTs: 0,
    messageTimer: 0,
    aiTimer: 0,
    resourceTick: 0,
    zombieStarve: 0,
    helpSeen: false,
    movingPlant: null,
  };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const els = {
    screens: {
      menu: document.getElementById("screen-menu"),
      howto: document.getElementById("screen-howto"),
      side: document.getElementById("screen-side"),
      levels: document.getElementById("screen-levels"),
      game: document.getElementById("screen-game"),
      result: document.getElementById("screen-result"),
    },
    sideLabel: document.getElementById("side-label"),
    levelList: document.getElementById("level-list"),
    unitBar: document.getElementById("unit-bar"),
    hudLevel: document.getElementById("hud-level"),
    hudSide: document.getElementById("hud-side"),
    resourceIcon: document.getElementById("resource-icon"),
    resourceValue: document.getElementById("resource-value"),
    waveValue: document.getElementById("wave-value"),
    waveMax: document.getElementById("wave-max"),
    gameTip: document.getElementById("game-tip"),
    guideBar: document.getElementById("guide-bar"),
    helpOverlay: document.getElementById("help-overlay"),
    helpTitle: document.getElementById("help-title"),
    helpList: document.getElementById("help-list"),
    btnHelpOk: document.getElementById("btn-help-ok"),
    toast: document.getElementById("toast"),
    resultTitle: document.getElementById("result-title"),
    resultText: document.getElementById("result-text"),
    resultPanel: document.querySelector(".result-panel"),
    btnNext: document.getElementById("btn-next"),
    btnRetry: document.getElementById("btn-retry"),
    btnPause: document.getElementById("btn-pause"),
    pauseOverlay: document.getElementById("pause-overlay"),
    btnResume: document.getElementById("btn-resume"),
    btnPauseSound: document.getElementById("btn-pause-sound"),
    btnPauseMenu: document.getElementById("btn-pause-menu"),
    btnMute: document.getElementById("btn-mute"),
    btnMuteMenu: document.getElementById("btn-mute-menu"),
    btnVoiceHelp: document.getElementById("btn-voice-help"),
    btnSpeakHelp: document.getElementById("btn-speak-help"),
  };

  function syncMuteButtons() {
    const label = AudioFX.muted ? "🔇 Звук выкл" : "🔊 Звук вкл";
    const icon = AudioFX.muted ? "🔇" : "🔊";
    if (els.btnMute) els.btnMute.textContent = icon;
    if (els.btnMuteMenu) els.btnMuteMenu.textContent = label;
    if (els.btnPauseSound) els.btnPauseSound.textContent = label;
  }

  function toggleMute() {
    AudioFX.unlock();
    AudioFX.muted = !AudioFX.muted;
    writeMuted(AudioFX.muted);
    syncMuteButtons();
    if (AudioFX.muted) {
      AudioFX.stopMusic();
    } else {
      AudioFX.click();
      if (!state.paused) AudioFX.startMusic();
    }
  }

  function speakInstruction(screenName = state.screen) {
    if (!("speechSynthesis" in window)) {
      toast("Голосовые подсказки не поддерживаются");
      return;
    }

    const messages = {
      menu: "Нажми большую зелёную кнопку Играть.",
      howto:
        "За растения: нажми растение сверху, затем нажми зелёную клетку. За зомби: нажми зомби сверху, затем нажми на ряд справа.",
      side:
        "Выбери сторону. Нажми кнопку с подсолнухом, чтобы играть за растения. Или кнопку с зомби, чтобы играть за зомби.",
      levels: "Нажми первую кнопку с цифрой один. Это первый и самый простой уровень.",
      game:
        state.side === "plants"
          ? "Нажми растение в верхней панели. Потом нажми зелёную клетку. Собирай жёлтое солнце."
          : "Нажми зомби в верхней панели. Потом нажми на нужный ряд справа.",
      result: state.won
        ? "Победа! Нажми следующий уровень или сыграть ещё раз."
        : "Поражение. Нажми кнопку ещё раз.",
    };

    window.speechSynthesis.cancel();
    AudioFX.stopMusic();
    const utterance = new SpeechSynthesisUtterance(
      messages[screenName] || messages.menu
    );
    utterance.lang = "ru-RU";
    utterance.rate = 0.85;
    utterance.volume = 1;
    const russianVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("ru"));
    if (russianVoice) utterance.voice = russianVoice;
    utterance.onend = () => {
      if (!AudioFX.muted && !state.paused) AudioFX.startMusic();
    };
    window.speechSynthesis.speak(utterance);
  }

  function showScreen(name) {
    state.screen = name;
    Object.entries(els.screens).forEach(([key, el]) => {
      el.classList.toggle("active", key === name);
    });
  }

  function toast(text, seconds = 2) {
    els.toast.textContent = text;
    els.toast.classList.remove("hidden");
    state.messageTimer = seconds;
  }

  function currentLevel() {
    return LEVELS[state.levelIndex];
  }

  function activeRows() {
    return currentLevel().rows;
  }

  function rowOffset() {
    return Math.floor((ROWS - activeRows()) / 2);
  }

  function cellCenter(col, row) {
    return {
      x: LEFT + col * CELL_W + CELL_W / 2,
      y: TOP + row * CELL_H + CELL_H / 2,
    };
  }

  function unlockedPlants() {
    const lvl = currentLevel().id;
    return Object.values(PLANT_TYPES).filter((p) => p.unlock <= lvl);
  }

  function buildLevels() {
    els.sideLabel.textContent =
      state.side === "plants"
        ? "Сторона: растения 🌱"
        : "Сторона: зомби 🧟";

    els.levelList.innerHTML = "";
    LEVELS.forEach((level, index) => {
      const btn = document.createElement("button");
      btn.className = "level-btn";
      btn.innerHTML = `
        <span class="num">${level.id}</span>
        <span class="meta">${level.name}</span>
        <span class="meta">${level.desc} · ${level.rows} ряд(а)</span>
      `;
      btn.addEventListener("click", () => {
        AudioFX.unlock();
        AudioFX.click();
        startLevel(index);
      });
      els.levelList.appendChild(btn);
    });
  }

  function buildUnitBar() {
    els.unitBar.innerHTML = "";
    const types =
      state.side === "plants" ? unlockedPlants() : Object.values(ZOMBIE_TYPES);
    types.forEach((unit) => {
      const btn = document.createElement("button");
      btn.className = "unit-btn";
      btn.dataset.id = unit.id;
      btn.title = unit.unlock
        ? `Открыто с уровня ${unit.unlock}`
        : unit.name;
      btn.innerHTML = `
        <span class="icon">${unit.icon}</span>
        <span class="name">${unit.name}</span>
        <span class="cost">${unit.cost} ${state.side === "plants" ? "☀️" : "🧠"}</span>
      `;
      btn.addEventListener("click", () => {
        AudioFX.unlock();
        if (state.resource < unit.cost) {
          toast("Не хватает ресурсов!");
          return;
        }
        AudioFX.click();
        state.selectedUnit = unit.id;
        [...els.unitBar.children].forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
      });
      els.unitBar.appendChild(btn);
    });

    if (state.side === "plants") {
      [
        {
          id: "__glove",
          icon: "🧤",
          name: "Перенести",
          hint: "Переставляет растение",
        },
        {
          id: "__shovel",
          icon: "🪏",
          name: "Убрать",
          hint: "Удаляет растение",
        },
      ].forEach((tool) => {
        const btn = document.createElement("button");
        btn.className = "unit-btn tool-btn";
        btn.dataset.id = tool.id;
        btn.title = tool.hint;
        btn.innerHTML = `
          <span class="icon">${tool.icon}</span>
          <span class="name">${tool.name}</span>
          <span class="cost">бесплатно</span>
        `;
        btn.addEventListener("click", () => {
          AudioFX.unlock();
          AudioFX.click();
          state.selectedUnit = tool.id;
          state.movingPlant = null;
          [...els.unitBar.children].forEach((c) =>
            c.classList.remove("selected")
          );
          btn.classList.add("selected");
          toast(
            tool.id === "__glove"
              ? "Нажми растение, затем новую клетку"
              : "Нажми растение, которое нужно убрать"
          );
        });
        els.unitBar.appendChild(btn);
      });
    }
    updateUnitBar();
  }

  function updateUnitBar() {
    const types = state.side === "plants" ? PLANT_TYPES : ZOMBIE_TYPES;
    [...els.unitBar.children].forEach((btn) => {
      const unit = types[btn.dataset.id];
      if (!unit) return;
      btn.classList.toggle("disabled", state.resource < unit.cost);
    });
  }

  function updateHud() {
    const level = currentLevel();
    els.hudLevel.textContent = level.name;
    els.hudSide.textContent = state.side === "plants" ? "Растения" : "Зомби";
    els.resourceIcon.textContent = state.side === "plants" ? "☀️" : "🧠";
    els.resourceValue.textContent = Math.floor(state.resource);
    if (state.side === "plants") {
      els.waveValue.textContent = Math.min(state.wavesSpawned + 1, level.waves.length);
      els.waveMax.textContent = String(level.waves.length);
      els.waveValue.parentElement.style.display = "";
    } else {
      els.waveValue.parentElement.style.display = "none";
    }
    els.gameTip.textContent =
      state.side === "plants"
        ? "Солнце (жёлтый круг) — кликни. Потом растение сверху → клетка на поле."
        : "Зомби сверху → клик по ряду справа. Цель: дойти до дома слева.";
    if (els.guideBar) {
      els.guideBar.textContent =
        state.side === "plants"
          ? "① Нажми растение сверху  →  ② Кликни по клетке на поле  →  ③ Кликай по жёлтому солнцу"
          : "① Нажми зомби сверху  →  ② Кликни по ряду справа  →  ③ Доберись до дома слева";
    }
    updateUnitBar();
  }

  function showHelpOverlay() {
    if (!els.helpOverlay) return;
    els.helpTitle.textContent =
      state.side === "plants" ? "Играешь за РАСТЕНИЯ" : "Играешь за ЗОМБИ";
    const steps =
      state.side === "plants"
        ? [
            "Сверху нажми на растение (например «Горохострел»).",
            "Потом кликни по зелёной клетке — растение посадится.",
            "Кликай по жёлтым кругам солнца, чтобы получать ☀️.",
            "У дома слева стоят газонокосилки — они один раз спасают ряд.",
            "Если косилки нет, и зомби дошёл до дома — поражение.",
          ]
        : [
            "Сверху нажми на зомби (например «Обычный»).",
            "Потом кликни по ряду справа — зомби выйдет.",
            "Мозги 🧠 появляются сами.",
            "Первый зомби включит газонокосилку и погибнет.",
            "Отправь ещё одного в тот же ряд — он пройдёт к дому.",
          ];
    els.helpList.innerHTML = steps.map((s) => `<li>${s}</li>`).join("");
    els.helpOverlay.classList.remove("hidden");
    state.running = false;
    speakInstruction("game");
  }

  function resetBattle() {
    const level = currentLevel();
    state.plants = [];
    state.zombies = [];
    state.projectiles = [];
    state.suns = [];
    state.fx = [];
    state.mowers = [];
    state.waveIndex = 0;
    state.wavesSpawned = 0;
    state.time = 0;
    state.resource =
      state.side === "zombies" && level.zombieStartResource != null
        ? level.zombieStartResource
        : level.startResource;
    state.selectedUnit = null;
    state.running = true;
    state.paused = false;
    state.won = false;
    state.lost = false;
    state.aiTimer = 0;
    state.resourceTick = 0;
    state.zombieStarve = 0;
    state.movingPlant = null;
    state.lastTs = 0;

    setupMowers();

    if (state.side === "zombies") {
      setupPlantDefense();
    }
  }

  function setupMowers() {
    const startRow = rowOffset();
    for (let r = 0; r < activeRows(); r++) {
      const row = startRow + r;
      state.mowers.push({
        row,
        x: LEFT - 28,
        y: cellCenter(0, row).y,
        used: false,
        active: false,
        speed: 320,
      });
    }
  }

  function setupPlantDefense() {
    const level = currentLevel();
    const startRow = rowOffset();
    const defense = level.zombiePlantDefense || level.plantDefense;
    defense.forEach((typeId, i) => {
      const row = startRow + (i % activeRows());
      const col = 1 + (Math.floor(i / activeRows()) % 3);
      placePlant(typeId, col, row, true);
    });

    const wantSuns = level.zombieSunflowers !== false;
    if (wantSuns) {
      for (let r = 0; r < activeRows(); r++) {
        placePlant("sunflower", 0, startRow + r, true);
      }
    }
  }

  function placePlant(typeId, col, row, free = false) {
    const type = PLANT_TYPES[typeId];
    if (!type) return false;
    if (row < rowOffset() || row >= rowOffset() + activeRows()) return false;
    if (col < 0 || col >= COLS - 1) return false;
    if (state.plants.some((p) => p.col === col && p.row === row)) return false;
    if (!free && state.resource < type.cost) return false;

    if (!free) state.resource -= type.cost;

    const pos = cellCenter(col, row);
    state.plants.push({
      typeId,
      col,
      row,
      x: pos.x,
      y: pos.y,
      hp: type.hp,
      maxHp: type.hp,
      timer: Math.random() * 2,
      shootTimer: 0.5 + Math.random(),
      armed: !type.armTime,
      armTimer: type.armTime || 0,
      fuse: type.fuse || 0,
      lifeTimer: type.lifeTime || 0,
      dead: false,
    });
    if (!free) AudioFX.plant();
    return true;
  }

  function spawnZombie(typeId, row, fromPlayer = false) {
    const type = ZOMBIE_TYPES[typeId];
    if (!type) return false;
    if (row < rowOffset() || row >= rowOffset() + activeRows()) return false;
    if (fromPlayer) {
      if (state.resource < type.cost) return false;
      state.resource -= type.cost;
    }

    const y = cellCenter(COLS - 1, row).y;
    state.zombies.push({
      typeId,
      row,
      x: canvas.width + 20 + Math.random() * 40,
      y,
      hp: type.hp,
      maxHp: type.hp,
      biteTimer: 0,
      eating: false,
      slowTimer: 0,
      slowFactor: 1,
    });
    if (fromPlayer) AudioFX.zombie();
    return true;
  }

  function addExplosion(x, y, color, life = 0.45) {
    state.fx.push({ x, y, color, life, maxLife: life, r: 20 });
  }

  function damageZombiesInRadius(x, y, radius, damage) {
    state.zombies.forEach((z) => {
      const dx = z.x - x;
      const dy = z.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        z.hp -= damage;
      }
    });
  }

  function clearRow(row, damage) {
    state.zombies.forEach((z) => {
      if (z.row === row) z.hp -= damage;
    });
  }

  function pauseGame() {
    if (!state.running || state.screen !== "game") return;
    AudioFX.click();
    state.running = false;
    state.paused = true;
    AudioFX.stopMusic();
    syncMuteButtons();
    els.pauseOverlay.classList.remove("hidden");
  }

  function resumeGame() {
    if (!state.paused) return;
    els.pauseOverlay.classList.add("hidden");
    state.paused = false;
    state.running = true;
    state.lastTs = 0;
    AudioFX.unlock();
    AudioFX.click();
    requestAnimationFrame(loop);
  }

  function leavePausedGame() {
    state.running = false;
    state.paused = false;
    els.pauseOverlay.classList.add("hidden");
    showScreen("menu");
    if (!AudioFX.muted) AudioFX.startMusic();
  }

  function startLevel(index) {
    state.levelIndex = index;
    resetBattle();
    buildUnitBar();
    updateHud();
    showScreen("game");
    if (els.pauseOverlay) els.pauseOverlay.classList.add("hidden");
    state.running = true;
    state.paused = false;
    state.lastTs = 0;
    toast(currentLevel().name + " — вперёд!");
    AudioFX.wave();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    state.running = false;
    state.paused = false;
    state.won = won;
    state.lost = !won;
    els.resultPanel.classList.toggle("lose", !won);
    if (won) AudioFX.win();
    else AudioFX.lose();

    if (state.side === "plants") {
      els.resultTitle.textContent = won ? "Победа!" : "Поражение";
      els.resultText.textContent = won
        ? "Зомби разбиты! Сад в безопасности."
        : "Зомби добрались до дома... Попробуй ещё раз.";
    } else {
      els.resultTitle.textContent = won ? "Победа!" : "Поражение";
      els.resultText.textContent = won
        ? "Зомби прорвались к дому! Мозги ваши."
        : "Растения остановили орду. Нужно больше зомби!";
    }

    const hasNext = won && state.levelIndex < LEVELS.length - 1;
    els.btnNext.style.display = hasNext ? "inline-block" : "none";
    showScreen("result");
  }

  function pointerToCell(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const col = Math.floor((x - LEFT) / CELL_W);
    const row = Math.floor((y - TOP) / CELL_H);
    return { x, y, col, row };
  }

  function onCanvasClick(e) {
    if (!state.running) return;
    AudioFX.unlock();
    const { x, y, col, row } = pointerToCell(e.clientX, e.clientY);

    for (let i = state.suns.length - 1; i >= 0; i--) {
      const s = state.suns[i];
      const dx = x - s.x;
      const dy = y - s.y;
      if (dx * dx + dy * dy < 28 * 28) {
        state.resource += s.value;
        state.suns.splice(i, 1);
        AudioFX.sun();
        updateHud();
        return;
      }
    }

    if (state.side === "plants") {
      const validCell =
        col >= 0 &&
        col < COLS - 1 &&
        row >= rowOffset() &&
        row < rowOffset() + activeRows();

      if (state.selectedUnit === "__shovel") {
        if (!validCell) {
          toast("Нажми на клетку с растением");
          return;
        }
        const plant = state.plants.find(
          (p) => p.col === col && p.row === row
        );
        if (!plant) {
          toast("Здесь нет растения");
          return;
        }
        state.plants = state.plants.filter((p) => p !== plant);
        AudioFX.beep(150, 0.12, "triangle", 0.06, 80);
        toast("Растение убрано");
        return;
      }

      if (state.selectedUnit === "__glove") {
        if (!validCell) {
          toast("Нажми на клетку поля");
          return;
        }

        if (!state.movingPlant) {
          const plant = state.plants.find(
            (p) => p.col === col && p.row === row
          );
          if (!plant) {
            toast("Сначала нажми на растение");
            return;
          }
          state.movingPlant = plant;
          toast("Теперь нажми на пустую клетку");
          return;
        }

        const occupied = state.plants.some(
          (p) =>
            p !== state.movingPlant && p.col === col && p.row === row
        );
        if (occupied) {
          toast("Эта клетка занята");
          return;
        }

        const pos = cellCenter(col, row);
        state.movingPlant.col = col;
        state.movingPlant.row = row;
        state.movingPlant.x = pos.x;
        state.movingPlant.y = pos.y;
        state.movingPlant = null;
        AudioFX.plant();
        toast("Растение перенесено");
        return;
      }

      if (!state.selectedUnit) {
        toast("Сначала выбери растение сверху");
        return;
      }
      if (!validCell) {
        toast("Сажай только на активных клетках");
        return;
      }
      if (placePlant(state.selectedUnit, col, row)) {
        updateHud();
      } else {
        toast("Клетка занята или мало солнца");
      }
      return;
    }

    if (state.side === "zombies") {
      if (!state.selectedUnit) {
        toast("Сначала выбери зомби сверху");
        return;
      }
      if (row < rowOffset() || row >= rowOffset() + activeRows()) {
        toast("Кликни по активному ряду");
        return;
      }
      if (spawnZombie(state.selectedUnit, row, true)) {
        updateHud();
        toast("Зомби выпущен!");
      } else {
        toast("Не хватает мозгов");
      }
    }
  }

  function spawnWaveIfNeeded() {
    const level = currentLevel();
    if (state.waveIndex >= level.waves.length) return;

    const wave = level.waves[state.waveIndex];
    if (state.time >= wave.delay) {
      const startRow = rowOffset();
      wave.zombies.forEach((typeId, i) => {
        const row = startRow + ((i + Math.floor(Math.random() * activeRows())) % activeRows());
        setTimeout(() => {
          if (state.running && state.side === "plants") {
            spawnZombie(typeId, row, false);
          }
        }, i * 400);
      });
      state.wavesSpawned += 1;
      state.waveIndex += 1;
      toast(`Волна ${state.wavesSpawned}!`);
      AudioFX.wave();
      updateHud();
    }
  }

  function firePea(plant, type, delay = 0, targetRow = plant.row) {
    const shoot = () => {
      if (!state.running || plant.dead) return;
      const mowerPosition = cellCenter(0, targetRow);
      state.projectiles.push({
        x: type.mowerShot ? LEFT - 20 : plant.x + 20,
        y: type.mowerShot ? mowerPosition.y - 8 : plant.y - 8,
        row: type.mowerShot ? targetRow : plant.row,
        speed: type.mowerShot ? 280 : 220,
        damage: type.damage,
        slow: type.slow || 0,
        slowTime: type.slowTime || 0,
        color: type.peaColor || "#8fd94f",
        mowerShot: !!type.mowerShot,
        pierce: !!type.mowerShot,
      });
      if (type.mowerShot) AudioFX.mower();
      else AudioFX.shoot();
    };
    if (delay > 0) setTimeout(shoot, delay * 1000);
    else shoot();
  }

  function updatePlants(dt) {
    const toRemove = [];

    state.plants.forEach((plant) => {
      const type = PLANT_TYPES[plant.typeId];
      plant.timer += dt;

      if (type.lifeTime) {
        plant.lifeTimer -= dt;
        if (plant.lifeTimer <= 0) {
          plant.dead = true;
          if (state.movingPlant === plant) state.movingPlant = null;
          addExplosion(plant.x, plant.y, "#c0c8d0", 0.35);
          toRemove.push(plant);
          return;
        }
      }

      if (type.armTime && !plant.armed) {
        plant.armTimer -= dt;
        if (plant.armTimer <= 0) {
          plant.armed = true;
          toast("Мина готова!");
        }
      }

      if (type.fuse) {
        plant.fuse -= dt;
        if (plant.fuse <= 0) {
          if (type.rowClear) {
            clearRow(plant.row, type.blastDamage);
            for (let c = 0; c < COLS; c++) {
              const p = cellCenter(c, plant.row);
              addExplosion(p.x, p.y, "#ff6a2a", 0.5);
            }
          } else {
            const radius = (type.blastCells || 1) * CELL_W + 20;
            damageZombiesInRadius(plant.x, plant.y, radius, type.blastDamage);
            addExplosion(plant.x, plant.y, "#ff4d4d", 0.55);
            addExplosion(plant.x - 30, plant.y - 10, "#ffaa33", 0.4);
            addExplosion(plant.x + 25, plant.y + 10, "#ff7744", 0.4);
          }
          AudioFX.explode();
          plant.dead = true;
          toRemove.push(plant);
          return;
        }
      }

      if (type.produce && plant.timer >= type.produceEvery) {
        plant.timer = 0;
        if (state.side === "plants") {
          state.suns.push({
            x: plant.x + (Math.random() * 30 - 15),
            y: plant.y - 20,
            vy: -20,
            value: type.produce,
            life: 8,
          });
        } else {
          state.aiTimer += 0.5;
        }
      }

      if (type.damage && !type.fuse) {
        plant.shootTimer -= dt;

        if (type.mowerShot) {
          const rowsUnderAttack = [
            ...new Set(state.zombies.filter((z) => z.hp > 0).map((z) => z.row)),
          ];
          if (rowsUnderAttack.length && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            rowsUnderAttack.forEach((row, index) => {
              firePea(plant, type, index * 0.12, row);
            });
          }
          return;
        }

        const enemyInLane = state.zombies.some(
          (z) => z.row === plant.row && z.x > plant.x && z.hp > 0
        );
        if (enemyInLane && plant.shootTimer <= 0) {
          plant.shootTimer = type.shootEvery;
          firePea(plant, type);
          if (type.doubleShot) firePea(plant, type, 0.18);
        }
      }
    });

    if (toRemove.length) {
      state.plants = state.plants.filter((p) => !toRemove.includes(p));
    }
  }

  function updateZombies(dt) {
    state.zombies.forEach((zombie) => {
      const type = ZOMBIE_TYPES[zombie.typeId];

      if (zombie.slowTimer > 0) {
        zombie.slowTimer -= dt;
        if (zombie.slowTimer <= 0) zombie.slowFactor = 1;
      }

      // Картофельная мина
      const mine = state.plants.find(
        (p) =>
          p.typeId === "potatomine" &&
          p.armed &&
          p.row === zombie.row &&
          Math.abs(p.x - zombie.x) < 40 &&
          p.hp > 0
      );
      if (mine) {
        const mType = PLANT_TYPES.potatomine;
        damageZombiesInRadius(mine.x, mine.y, mType.blastRadius, mType.blastDamage);
        addExplosion(mine.x, mine.y, "#c9a227", 0.5);
        AudioFX.explode();
        state.plants = state.plants.filter((p) => p !== mine);
        return;
      }

      const plant = state.plants.find(
        (p) => p.row === zombie.row && Math.abs(p.x - zombie.x) < 36 && p.hp > 0
      );

      if (plant) {
        zombie.eating = true;
        zombie.biteTimer -= dt;
        if (zombie.biteTimer <= 0) {
          zombie.biteTimer = type.biteEvery;
          plant.hp -= type.damage;
          AudioFX.bite();
          if (plant.hp <= 0) {
            state.plants = state.plants.filter((p) => p !== plant);
          }
        }
      } else {
        zombie.eating = false;
        zombie.x -= type.speed * zombie.slowFactor * dt;
      }
    });

    state.zombies = state.zombies.filter((z) => z.hp > 0);
  }

  function updateMowers(dt) {
    const triggerX = LEFT + 8;

    state.mowers.forEach((mower) => {
      if (!mower.used && !mower.active) {
        const touch = state.zombies.find(
          (z) => z.row === mower.row && z.hp > 0 && z.x <= triggerX
        );
        if (touch) {
          mower.active = true;
          mower.used = true;
          AudioFX.mower();
          toast("Газонокосилка!");
        }
      }

      if (mower.active) {
        mower.x += mower.speed * dt;
        state.zombies.forEach((z) => {
          if (z.row === mower.row && z.hp > 0 && Math.abs(z.x - mower.x) < 30) {
            z.hp = 0;
            addExplosion(z.x, z.y, "#c0c8d0", 0.25);
          }
        });
        if (mower.x > canvas.width + 60) {
          mower.active = false;
          mower.gone = true;
        }
      }
    });

    state.zombies = state.zombies.filter((z) => z.hp > 0);
  }

  function updateProjectiles(dt) {
    state.projectiles.forEach((p) => {
      p.x += p.speed * dt;
      const hit = state.zombies.find(
        (z) =>
          z.row === p.row &&
          Math.abs(z.x - p.x) < (p.mowerShot ? 44 : 24) &&
          z.hp > 0 &&
          (!p.hitIds || !p.hitIds.has(z))
      );
      if (hit) {
        if (p.mowerShot) {
          hit.hp = 0;
          addExplosion(hit.x, hit.y, "#c0c8d0", 0.3);
          AudioFX.mower();
          if (!p.hitIds) p.hitIds = new Set();
          p.hitIds.add(hit);
        } else {
          hit.hp -= p.damage;
          if (p.slow) {
            hit.slowFactor = p.slow;
            hit.slowTimer = p.slowTime;
          }
          AudioFX.hit();
          p.dead = true;
        }
      }
      if (p.x > canvas.width + 40) p.dead = true;
    });
    state.projectiles = state.projectiles.filter((p) => !p.dead);
    state.zombies = state.zombies.filter((z) => z.hp > 0);
  }

  function updateSuns(dt) {
    state.suns.forEach((s) => {
      s.life -= dt;
      s.y += s.vy * dt;
      s.vy += 40 * dt;
      if (s.vy > 40) s.vy = 40;
      if (s.y > TOP + ROWS * CELL_H - 20) {
        s.y = TOP + ROWS * CELL_H - 20;
        s.vy = 0;
      }
    });
    state.suns = state.suns.filter((s) => s.life > 0);
  }

  function updateFx(dt) {
    state.fx.forEach((f) => {
      f.life -= dt;
      f.r += 80 * dt;
    });
    state.fx = state.fx.filter((f) => f.life > 0);
  }

  function updateAI(dt) {
    if (state.side !== "zombies") return;
    const level = currentLevel();
    state.aiTimer += dt;
    state.resourceTick += dt;

    const brainEvery = level.zombieBrainEvery || 1.2;
    const brainAmount = level.zombieBrainAmount || 10;
    if (state.resourceTick >= brainEvery) {
      state.resourceTick = 0;
      state.resource += brainAmount;
      updateHud();
    }

    const aiInterval = level.zombieAiInterval || 2.5;
    if (state.aiTimer < aiInterval) return;
    state.aiTimer = 0;

    // На лёгких уровнях ИИ иногда пропускает ход
    if (level.id === 1 && Math.random() < 0.45) return;

    const startRow = rowOffset();
    const shooters = level.zombieAiPlants || ["peashooter", "snowpea", "repeater"];
    const maxPerRow = level.zombieMaxPerRow || 4;
    for (let attempt = 0; attempt < 4; attempt++) {
      const row = startRow + Math.floor(Math.random() * activeRows());
      const filled = state.plants.filter((p) => p.row === row).length;
      if (filled >= maxPerRow) continue;

      let col = 1;
      while (col < 5 && state.plants.some((p) => p.col === col && p.row === row)) col++;
      if (col >= 5) continue;

      const threat = state.zombies.some((z) => z.row === row && z.x < 500);
      let typeId = shooters[Math.floor(Math.random() * shooters.length)];
      if (threat && level.id > 1 && Math.random() < 0.35) typeId = "wallnut";
      placePlant(typeId, col, row, true);
      break;
    }
  }

  function checkWinLose() {
    const pastHouse = LEFT - 35;
    if (state.side === "plants") {
      // Проигрыш, если зомби прошёл, а косилки в ряду уже нет
      const leaked = state.zombies.some((z) => {
        if (z.x >= pastHouse) return false;
        const mower = state.mowers.find((m) => m.row === z.row);
        return !mower || mower.gone;
      });
      if (leaked) {
        endGame(false);
        return;
      }
      const level = currentLevel();
      const allWavesDone = state.waveIndex >= level.waves.length;
      if (
        allWavesDone &&
        state.zombies.length === 0 &&
        state.time > level.waves[level.waves.length - 1].delay + 1
      ) {
        endGame(true);
      }
    } else {
      // За зомби: нужна «вторая волна» в ряду — после того как косилка уже уехала
      const breached = state.zombies.some((z) => {
        if (z.x >= pastHouse) return false;
        const mower = state.mowers.find((m) => m.row === z.row);
        return mower && mower.gone;
      });
      if (breached) {
        endGame(true);
        return;
      }
      const canAfford = state.resource >= 50;
      if (state.zombies.length === 0 && !canAfford) {
        state.zombieStarve += 1 / 60;
        if (state.zombieStarve > 12) endGame(false);
      } else {
        state.zombieStarve = 0;
      }
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (state.side === "zombies") {
      g.addColorStop(0, "#2a3a28");
      g.addColorStop(1, "#1a2818");
    } else {
      g.addColorStop(0, "#6db34a");
      g.addColorStop(1, "#3f8a32");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#6b3f24";
    ctx.fillRect(0, 0, LEFT - 10, canvas.height);
    ctx.fillStyle = "#8a5230";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(8, 40 + i * 90, 50, 55);
      ctx.fillStyle = "#c9e8ff";
      ctx.fillRect(18, 50 + i * 90, 14, 14);
      ctx.fillRect(38, 50 + i * 90, 14, 14);
      ctx.fillStyle = "#8a5230";
    }

    const startRow = rowOffset();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const active = r >= startRow && r < startRow + activeRows();
        const x = LEFT + c * CELL_W;
        const y = TOP + r * CELL_H;
        if (!active) {
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(x, y, CELL_W, CELL_H);
          continue;
        }
        ctx.fillStyle = (r + c) % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
        ctx.fillRect(x, y, CELL_W, CELL_H);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.strokeRect(x, y, CELL_W, CELL_H);
      }
    }

    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(LEFT + (COLS - 1) * CELL_W, TOP, CELL_W, ROWS * CELL_H);
  }

  function drawPlant(plant) {
    const type = PLANT_TYPES[plant.typeId];
    ctx.save();
    ctx.translate(plant.x, plant.y);

    if (state.movingPlant === plant) {
      ctx.strokeStyle = "#ffe45c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const id = plant.typeId;
    if (id === "sunflower") {
      ctx.fillStyle = "#3d7a28";
      ctx.fillRect(-4, 0, 8, 28);
      ctx.fillStyle = "#f0c040";
      ctx.beginPath();
      ctx.arc(0, -8, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b3f10";
      ctx.beginPath();
      ctx.arc(0, -8, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (
      id === "peashooter" ||
      id === "repeater" ||
      id === "snowpea" ||
      id === "cactus" ||
      id === "puffshroom"
    ) {
      const body =
        id === "snowpea"
          ? "#6ec6e8"
          : id === "puffshroom"
            ? "#8d5ab5"
            : id === "cactus"
              ? "#739b32"
              : id === "repeater"
                ? "#3f9e3a"
                : "#3d8f3a";
      const head =
        id === "snowpea"
          ? "#b8ecff"
          : id === "puffshroom"
            ? "#c989e8"
            : id === "cactus"
              ? "#91b83f"
              : "#4caf50";
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.ellipse(14, -2, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      if (id === "repeater") {
        ctx.beginPath();
        ctx.ellipse(10, 10, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (id === "cactus") {
        ctx.strokeStyle = "#e8ef9a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 4);
        ctx.lineTo(-21, -1);
        ctx.moveTo(-9, 14);
        ctx.lineTo(-18, 18);
        ctx.stroke();
      }
      if (id === "puffshroom") {
        ctx.fillStyle = "#eee0ff";
        ctx.beginPath();
        ctx.arc(5, -7, 3, 0, Math.PI * 2);
        ctx.arc(14, -10, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#1b3d18";
      ctx.beginPath();
      ctx.arc(22, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      if (id === "snowpea") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-6, -18, 4, 0, Math.PI * 2);
        ctx.arc(2, -22, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "wallnut") {
      ctx.fillStyle = "#b8894a";
      ctx.beginPath();
      ctx.ellipse(0, 4, 20, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a3a18";
      ctx.beginPath();
      ctx.arc(-6, 0, 3, 0, Math.PI * 2);
      ctx.arc(6, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5a3a18";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 10, 6, 0.1, Math.PI - 0.1);
      ctx.stroke();
    } else if (id === "potatomine") {
      ctx.fillStyle = plant.armed ? "#d4a017" : "#8a6a30";
      ctx.beginPath();
      ctx.ellipse(0, 12, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      if (plant.armed) {
        ctx.fillStyle = "#2d8f2a";
        ctx.beginPath();
        ctx.arc(-6, 6, 4, 0, Math.PI * 2);
        ctx.arc(6, 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-6, 6, 1.5, 0, Math.PI * 2);
        ctx.arc(6, 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "10px Nunito";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(plant.armTimer) + "с", 0, 16);
      }
    } else if (id === "mowerthrower") {
      // Корпус газонокосилки
      ctx.fillStyle = "#aeb8bf";
      ctx.fillRect(-27, 3, 54, 19);
      ctx.fillStyle = "#dce3e7";
      ctx.fillRect(-20, 7, 40, 9);
      ctx.strokeStyle = "#59636a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, 4);
      ctx.lineTo(-27, -23);
      ctx.lineTo(-18, -23);
      ctx.stroke();

      // Колёса
      ctx.fillStyle = "#343b40";
      ctx.beginPath();
      ctx.arc(-18, 24, 8, 0, Math.PI * 2);
      ctx.arc(18, 24, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9aa3ab";
      ctx.beginPath();
      ctx.arc(-18, 24, 3, 0, Math.PI * 2);
      ctx.arc(18, 24, 3, 0, Math.PI * 2);
      ctx.fill();

      // Кот и мышь в корзине
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(-19, -19, 38, 19);
      ctx.strokeStyle = "#d4a66a";
      ctx.lineWidth = 2;
      ctx.strokeRect(-19, -19, 38, 19);
      ctx.font = "21px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🐱", -8, -10);
      ctx.font = "16px sans-serif";
      ctx.fillText("🐭", 10, -8);

      // Оставшееся время
      ctx.font = "bold 11px Nunito, sans-serif";
      ctx.fillStyle = "#fff3a8";
      ctx.fillText(`${Math.max(0, Math.ceil(plant.lifeTimer))}с`, 0, 43);
    } else if (id === "cherrybomb") {
      const pulse = 1 + Math.sin(state.time * 14) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#d62828";
      ctx.beginPath();
      ctx.arc(-8, 0, 14, 0, Math.PI * 2);
      ctx.arc(10, 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3d7a28";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.quadraticCurveTo(0, -28, 10, -10);
      ctx.stroke();
    } else if (id === "jalapeno") {
      const pulse = 1 + Math.sin(state.time * 16) * 0.1;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#e23d2a";
      ctx.beginPath();
      ctx.ellipse(0, 4, 10, 24, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d8f2a";
      ctx.beginPath();
      ctx.ellipse(0, -20, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!type.fuse) {
      const ratio = Math.max(0, plant.hp / plant.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-20, -40, 40, 5);
      ctx.fillStyle = ratio > 0.35 ? "#7bc44a" : "#d4543a";
      ctx.fillRect(-20, -40, 40 * ratio, 5);
    }

    ctx.restore();
  }

  function drawZombie(zombie) {
    const type = ZOMBIE_TYPES[zombie.typeId];
    const scale = type.scale || 1;
    ctx.save();
    ctx.translate(zombie.x, zombie.y);
    ctx.scale(scale, scale);
    const bob = zombie.eating ? Math.sin(state.time * 12) * 2 : Math.sin(state.time * 6 + zombie.x) * 3;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 30, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.ellipse(0, 8, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = zombie.slowTimer > 0 ? "#b8ecff" : "#9ec98a";
    ctx.beginPath();
    ctx.arc(0, -14, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#223018";
    ctx.beginPath();
    ctx.arc(-5, -16, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -16, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (zombie.typeId === "tank") {
      ctx.fillStyle = "#5a6a58";
      ctx.fillRect(-16, -28, 32, 10);
    }
    if (zombie.typeId === "cone") {
      ctx.fillStyle = "#ef8b2c";
      ctx.beginPath();
      ctx.moveTo(-13, -26);
      ctx.lineTo(0, -55);
      ctx.lineTo(13, -26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffd08a";
      ctx.fillRect(-10, -34, 20, 4);
    }
    if (zombie.typeId === "bucket") {
      ctx.fillStyle = "#9ba6ad";
      ctx.fillRect(-15, -43, 30, 19);
      ctx.strokeStyle = "#d9e0e4";
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -43, 30, 19);
      ctx.beginPath();
      ctx.arc(0, -42, 18, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    if (zombie.typeId === "runner") {
      ctx.strokeStyle = "#e8f07a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(-18, 32);
      ctx.moveTo(10, 20);
      ctx.lineTo(18, 32);
      ctx.stroke();
    }
    if (zombie.typeId === "giant") {
      ctx.fillStyle = "#3a4f38";
      ctx.fillRect(-20, -8, 40, 28);
      ctx.fillStyle = "#c9a227";
      ctx.beginPath();
      ctx.arc(-7, -18, 3, 0, Math.PI * 2);
      ctx.arc(7, -18, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#223018";
      ctx.fillRect(-8, -8, 16, 5);
      ctx.font = "bold 12px Nunito, sans-serif";
      ctx.fillStyle = "#ffe45c";
      ctx.textAlign = "center";
      ctx.fillText("2000", 0, -52);
    }

    if (zombie.slowTimer > 0) {
      ctx.fillStyle = "rgba(180, 230, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(-10, -8, 3, 0, Math.PI * 2);
      ctx.arc(8, -20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const ratio = Math.max(0, zombie.hp / zombie.maxHp);
    const barY = zombie.typeId === "giant" ? -62 : -42;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(-20, barY, 40, 5);
    ctx.fillStyle = ratio > 0.35 ? "#e85a7a" : "#d4543a";
    ctx.fillRect(-20, barY, 40 * ratio, 5);

    ctx.restore();
  }

  function drawProjectiles() {
    state.projectiles.forEach((p) => {
      if (p.mowerShot) {
        ctx.fillStyle = "#9aa3ab";
        ctx.fillRect(p.x - 18, p.y - 8, 36, 16);
        ctx.fillStyle = "#d7dee3";
        ctx.fillRect(p.x - 14, p.y - 4, 28, 8);
        ctx.fillStyle = "#5a636a";
        ctx.beginPath();
        ctx.arc(p.x - 10, p.y + 10, 6, 0, Math.PI * 2);
        ctx.arc(p.x + 10, p.y + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 12, p.y);
        ctx.lineTo(p.x + 12, p.y);
        ctx.stroke();
        return;
      }
      ctx.fillStyle = p.color || "#8fd94f";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffffaa";
      ctx.beginPath();
      ctx.arc(p.x - 2, p.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawSuns() {
    state.suns.forEach((s) => {
      ctx.fillStyle = "rgba(245, 200, 66, 0.35)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5c842";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff3a8";
      ctx.beginPath();
      ctx.arc(s.x - 3, s.y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawFx() {
    state.fx.forEach((f) => {
      const a = Math.max(0, f.life / f.maxLife);
      ctx.fillStyle = f.color.replace(")", `,${a})`).includes("rgba")
        ? f.color
        : hexToRgba(f.color, a * 0.7);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function hexToRgba(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function drawMowers() {
    state.mowers.forEach((mower) => {
      if (mower.gone) return;
      ctx.save();
      ctx.translate(mower.x, mower.y);

      // Тень
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 22, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Корпус
      ctx.fillStyle = mower.active ? "#e8f0f5" : "#c5d0d8";
      ctx.fillRect(-22, -10, 44, 20);
      ctx.fillStyle = "#4a90c8";
      ctx.fillRect(-18, -14, 28, 8);

      // Колёса
      ctx.fillStyle = "#2a2a2a";
      ctx.beginPath();
      ctx.arc(-14, 12, 7, 0, Math.PI * 2);
      ctx.arc(14, 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.arc(-14, 12, 3, 0, Math.PI * 2);
      ctx.arc(14, 12, 3, 0, Math.PI * 2);
      ctx.fill();

      // Ножи / искры при езде
      if (mower.active) {
        ctx.strokeStyle = "#ffe566";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a = state.time * 20 + i * 2;
          ctx.beginPath();
          ctx.moveTo(20, Math.sin(a) * 6);
          ctx.lineTo(32, Math.sin(a + 1) * 10);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }

  function draw() {
    drawBackground();
    drawMowers();
    state.plants.forEach(drawPlant);
    state.zombies.forEach(drawZombie);
    drawProjectiles();
    drawSuns();
    drawFx();
  }

  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    let dt = (ts - state.lastTs) / 1000;
    state.lastTs = ts;
    if (dt > 0.05) dt = 0.05;

    state.time += dt;
    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) els.toast.classList.add("hidden");
    }

    if (state.side === "plants") {
      state.resourceTick += dt;
      if (state.resourceTick >= 2.5) {
        state.resourceTick = 0;
        state.suns.push({
          x: 120 + Math.random() * 600,
          y: 40,
          vy: 10,
          value: 25,
          life: 12,
        });
      }
      spawnWaveIfNeeded();
    }

    updatePlants(dt);
    updateZombies(dt);
    updateMowers(dt);
    updateProjectiles(dt);
    updateSuns(dt);
    updateFx(dt);
    updateAI(dt);
    checkWinLose();
    updateHud();
    draw();

    if (state.running) requestAnimationFrame(loop);
  }

  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      AudioFX.unlock();
      AudioFX.click();
      const go = btn.getAttribute("data-go");
      if (go === "levels") {
        if (!state.side) {
          showScreen("side");
          speakInstruction("side");
          return;
        }
        buildLevels();
      }
      if (go === "side" || go === "menu") state.running = false;
      showScreen(go);
      speakInstruction(go);
    });
  });

  document.querySelectorAll("[data-side]").forEach((btn) => {
    btn.addEventListener("click", () => {
      AudioFX.unlock();
      AudioFX.click();
      state.side = btn.getAttribute("data-side");
      buildLevels();
      showScreen("levels");
      speakInstruction("levels");
    });
  });

  if (els.btnPause) els.btnPause.addEventListener("click", pauseGame);
  if (els.btnResume) els.btnResume.addEventListener("click", resumeGame);
  if (els.btnPauseSound) {
    els.btnPauseSound.addEventListener("click", toggleMute);
  }
  if (els.btnPauseMenu) {
    els.btnPauseMenu.addEventListener("click", leavePausedGame);
  }

  els.btnRetry.addEventListener("click", () => {
    AudioFX.unlock();
    AudioFX.click();
    startLevel(state.levelIndex);
  });

  els.btnNext.addEventListener("click", () => {
    AudioFX.unlock();
    AudioFX.click();
    if (state.levelIndex < LEVELS.length - 1) {
      startLevel(state.levelIndex + 1);
    }
  });

  if (els.btnMute) els.btnMute.addEventListener("click", toggleMute);
  if (els.btnMuteMenu) els.btnMuteMenu.addEventListener("click", toggleMute);
  if (els.btnVoiceHelp) {
    els.btnVoiceHelp.addEventListener("click", () => speakInstruction());
  }
  if (els.btnSpeakHelp) {
    els.btnSpeakHelp.addEventListener("click", () => speakInstruction("game"));
  }

  if (els.btnHelpOk) {
    els.btnHelpOk.addEventListener("click", () => {
      AudioFX.unlock();
      AudioFX.click();
      els.helpOverlay.classList.add("hidden");
      state.helpSeen = true;
      state.running = true;
      state.lastTs = 0;
      toast(currentLevel().name + " — вперёд!");
      AudioFX.wave();
      requestAnimationFrame(loop);
    });
  }

  if (canvas) canvas.addEventListener("click", onCanvasClick);
  document.body.addEventListener(
    "pointerdown",
    () => {
      AudioFX.unlock();
    },
    { once: true }
  );

  /* ========== Фоновые зомби ========== */
  const bgCanvas = document.getElementById("bg-zombies");
  const bgCtx = bgCanvas ? bgCanvas.getContext("2d") : null;
  const bgZombies = [];

  function resizeBg() {
    if (!bgCanvas) return;
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }

  function spawnBgZombie() {
    const scale = 0.55 + Math.random() * 0.7;
    const lane = Math.floor(Math.random() * 4);
    bgZombies.push({
      x: bgCanvas.width + 40 + Math.random() * 120,
      y: bgCanvas.height * (0.45 + lane * 0.12),
      speed: 12 + Math.random() * 22,
      scale,
      bob: Math.random() * Math.PI * 2,
      kind: Math.random() < 0.25 ? "tank" : Math.random() < 0.4 ? "runner" : "normal",
      alpha: 0.18 + Math.random() * 0.28,
    });
  }

  function drawBgZombie(z, t) {
    const bob = Math.sin(t * 4 + z.bob) * 4 * z.scale;
    bgCtx.save();
    bgCtx.globalAlpha = z.alpha;
    bgCtx.translate(z.x, z.y + bob);
    bgCtx.scale(z.scale, z.scale);

    bgCtx.fillStyle = "rgba(0,0,0,0.35)";
    bgCtx.beginPath();
    bgCtx.ellipse(0, 38, 18, 7, 0, 0, Math.PI * 2);
    bgCtx.fill();

    const body =
      z.kind === "tank" ? "#5a7358" : z.kind === "runner" ? "#9aaa5a" : "#6f8f62";
    bgCtx.fillStyle = body;
    bgCtx.beginPath();
    bgCtx.ellipse(0, 10, 16, 24, 0, 0, Math.PI * 2);
    bgCtx.fill();

    bgCtx.fillStyle = "#8fb882";
    bgCtx.beginPath();
    bgCtx.arc(0, -16, 15, 0, Math.PI * 2);
    bgCtx.fill();

    bgCtx.fillStyle = "#1a2814";
    bgCtx.beginPath();
    bgCtx.arc(-5, -18, 2.5, 0, Math.PI * 2);
    bgCtx.arc(5, -18, 2.5, 0, Math.PI * 2);
    bgCtx.fill();

    // Руки вперёд
    bgCtx.strokeStyle = body;
    bgCtx.lineWidth = 5;
    bgCtx.lineCap = "round";
    bgCtx.beginPath();
    bgCtx.moveTo(-14, 4);
    bgCtx.lineTo(-28, 2 + Math.sin(t * 5 + z.bob) * 3);
    bgCtx.moveTo(14, 4);
    bgCtx.lineTo(28, 0 + Math.cos(t * 5 + z.bob) * 3);
    bgCtx.stroke();

    if (z.kind === "tank") {
      bgCtx.fillStyle = "#4a5548";
      bgCtx.fillRect(-16, -30, 32, 10);
    }

    bgCtx.restore();
  }

  let bgLast = 0;
  function bgLoop(ts) {
    if (!bgCtx || !bgCanvas) return;
    if (!bgLast) bgLast = ts;
    const dt = Math.min(0.05, (ts - bgLast) / 1000);
    bgLast = ts;
    const t = ts / 1000;

    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    // Лёгкий туман снизу
    const fog = bgCtx.createLinearGradient(0, bgCanvas.height * 0.4, 0, bgCanvas.height);
    fog.addColorStop(0, "rgba(15, 24, 18, 0)");
    fog.addColorStop(1, "rgba(10, 16, 12, 0.45)");
    bgCtx.fillStyle = fog;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    if (bgZombies.length < 8 && Math.random() < 0.02) spawnBgZombie();

    bgZombies.forEach((z) => {
      z.x -= z.speed * dt;
      drawBgZombie(z, t);
    });

    for (let i = bgZombies.length - 1; i >= 0; i--) {
      if (bgZombies[i].x < -80) bgZombies.splice(i, 1);
    }

    requestAnimationFrame(bgLoop);
  }

  resizeBg();
  window.addEventListener("resize", resizeBg);
  for (let i = 0; i < 5; i++) {
    if (bgCanvas) {
      spawnBgZombie();
      bgZombies[bgZombies.length - 1].x = Math.random() * bgCanvas.width;
    }
  }
  requestAnimationFrame(bgLoop);

  syncMuteButtons();
  showScreen("menu");
})();
