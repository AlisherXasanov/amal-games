(() => {
  const COLS = 9;
  const ROWS = 5;
  const LEFT = 70;
  const TOP = 36;
  const CELL_W = 86;
  const CELL_H = 88;
  const ALLERGY_CHANCE = 0.1;
  const START_SUN = 200;
  const MAX_WAVES = 8;
  const MUTE_KEY = "pvz2-mute-v1";

  function readMuted() {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function writeMuted(v) {
    try {
      localStorage.setItem(MUTE_KEY, v ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
  }

  const AudioFX = {
    ctx: null,
    muted: readMuted(),
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
      const melody = [262, 311, 349, 392, 349, 311, 262, 233, 262, 311, 349, 415, 392, 349, 311, 262];
      const bass = [131, 131, 155, 155, 175, 175, 147, 147];
      this.musicTimer = setInterval(() => {
        if (this.muted || !this.ctx) return;
        const i = this.musicStep % melody.length;
        const m = melody[i];
        const b = bass[this.musicStep % bass.length];
        this.beep(b, 0.28, "triangle", 0.03);
        this.beep(m, 0.2, "square", 0.022);
        if (i % 4 === 0) this.beep(m * 1.5, 0.1, "sine", 0.014);
        this.musicStep += 1;
      }, 340);
    },
    stopMusic() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },
    plant() {
      this.beep(220, 0.08, "triangle", 0.07);
      this.beep(330, 0.1, "triangle", 0.05);
    },
    shoot() {
      this.beep(480, 0.05, "square", 0.04, -120);
    },
    sun() {
      this.beep(660, 0.08, "sine", 0.06);
      this.beep(880, 0.1, "sine", 0.05);
    },
    hit() {
      this.beep(180, 0.06, "sawtooth", 0.04);
    },
    bite() {
      this.beep(90, 0.1, "sawtooth", 0.05);
    },
    explode() {
      this.noise(0.35, 0.12);
      this.beep(120, 0.25, "sawtooth", 0.08, -80);
    },
    mower() {
      this.noise(0.25, 0.08);
      this.beep(90, 0.35, "sawtooth", 0.06, 80);
    },
    wave() {
      this.beep(200, 0.15, "triangle", 0.07, 200);
    },
    win() {
      this.beep(523, 0.12, "sine", 0.07);
      setTimeout(() => this.beep(659, 0.12, "sine", 0.07), 120);
      setTimeout(() => this.beep(784, 0.2, "sine", 0.08), 240);
    },
    lose() {
      this.beep(300, 0.2, "sawtooth", 0.07, -150);
      setTimeout(() => this.beep(160, 0.3, "sawtooth", 0.08), 180);
    },
    click() {
      this.beep(500, 0.04, "square", 0.03);
    },
    zombie() {
      this.beep(110, 0.12, "sawtooth", 0.06, -30);
    },
    ability() {
      this.beep(440, 0.08, "sine", 0.06);
      this.beep(660, 0.12, "triangle", 0.05);
      this.beep(880, 0.1, "sine", 0.04);
    },
    screech() {
      this.beep(900, 0.08, "square", 0.05, -400);
      this.beep(1200, 0.12, "sawtooth", 0.04, -600);
    },
  };

  function syncMuteButtons() {
    const label = AudioFX.muted ? "🔇 Звук выкл" : "🔊 Звук";
    const icon = AudioFX.muted ? "🔇" : "🔊";
    const menu = document.getElementById("btnMuteMenu");
    const play = document.getElementById("btnMute");
    if (menu) menu.textContent = label;
    if (play) play.textContent = icon;
  }

  function toggleMute() {
    AudioFX.unlock();
    AudioFX.muted = !AudioFX.muted;
    writeMuted(AudioFX.muted);
    syncMuteButtons();
    if (AudioFX.muted) AudioFX.stopMusic();
    else {
      AudioFX.click();
      if (state.running && !state.paused) AudioFX.startMusic();
    }
  }

  const ALLERGY_TYPES = {
    nut: { id: "nut", label: "орехи", short: "орех", color: "#ffd27a" },
    fire: { id: "fire", label: "огонь", short: "огонь", color: "#ff7a2a" },
    ice: { id: "ice", label: "лёд", short: "лёд", color: "#9fdfff" },
    electric: { id: "electric", label: "электро", short: "электро", color: "#ffe566" },
    pea: { id: "pea", label: "горох", short: "горох", color: "#9dff7a" },
    sun: { id: "sun", label: "подсолнух", short: "солнце", color: "#ffd84a" },
    bomb: { id: "bomb", label: "бомбы", short: "бомба", color: "#ff6a6a" },
    melee: { id: "melee", label: "рукопашные", short: "удар", color: "#c8ff9a" },
  };
  const ALLERGY_POOL = Object.keys(ALLERGY_TYPES);

  const ZOMBIE_KINDS = {
    normal: { hp: 120, speed: 22, damage: 20, color: "#8fbc7a", name: "Обычный", hats: [] },
    runner: { hp: 80, speed: 38, damage: 14, color: "#c9d46a", name: "Быстрый", hats: [] },
    cone: { hp: 220, speed: 20, damage: 20, color: "#86a976", name: "С конусом", hats: ["cone"] },
    bucket: { hp: 420, speed: 14, damage: 28, color: "#66865f", name: "С ведром", hats: ["bucket"] },
    "cone-runner": {
      hp: 200,
      speed: 34,
      damage: 18,
      color: "#a8c96a",
      name: "Конус-быстрый",
      hats: ["cone"],
      hybrid: true,
    },
    "bucket-runner": {
      hp: 380,
      speed: 28,
      damage: 24,
      color: "#7a9a68",
      name: "Ведро-быстрый",
      hats: ["bucket"],
      hybrid: true,
    },
    "double-hat": {
      hp: 520,
      speed: 16,
      damage: 30,
      color: "#5a7a52",
      name: "Конус+ведро",
      hats: ["cone", "bucket"],
      hybrid: true,
    },
    "tank-hybrid": {
      hp: 700,
      speed: 11,
      damage: 32,
      color: "#4a6a48",
      name: "Танк-гибрид",
      hats: ["bucket"],
      scale: 1.18,
      hybrid: true,
    },
    "spark-hybrid": {
      hp: 260,
      speed: 26,
      damage: 22,
      color: "#8ab87a",
      name: "Искровой",
      hats: ["cone"],
      spark: true,
      hybrid: true,
    },
  };

  const plantsCatalog = window.PVZ2_PLANTS || [];
  const typesMeta = window.PVZ2_TYPES || [];
  const typeName = Object.fromEntries(typesMeta.map((t) => [t.id, t.name]));
  const plantById = Object.fromEntries(plantsCatalog.map((p) => [p.id, p]));

  const els = {
    screenMenu: document.getElementById("screenMenu"),
    screenAlmanac: document.getElementById("screenAlmanac"),
    screenPlay: document.getElementById("screenPlay"),
    screenEnd: document.getElementById("screenEnd"),
    plantCount: document.getElementById("plantCount"),
    modeSelect: document.getElementById("modeSelect"),
    testMode: document.getElementById("testMode"),
    typeFilters: document.getElementById("typeFilters"),
    plantGrid: document.getElementById("plantGrid"),
    plantSearch: document.getElementById("plantSearch"),
    almanacSub: document.getElementById("almanacSub"),
    seedBar: document.getElementById("seedBar"),
    sunText: document.getElementById("sunText"),
    waveText: document.getElementById("waveText"),
    modeText: document.getElementById("modeText"),
    coopHint: document.getElementById("coopHint"),
    playHint: document.getElementById("playHint"),
    endTitle: document.getElementById("endTitle"),
    endSub: document.getElementById("endSub"),
    toast: document.getElementById("toast"),
    canvas: document.getElementById("gameCanvas"),
  };

  const ctx = els.canvas.getContext("2d");
  let activeType = "all";
  let toastTimer = 0;
  let lastTs = 0;
  let animId = 0;
  let shovel = false;
  let nutTool = false;
  let zombieTool = null; // kill | cure | spawn | null
  const NUT_EFFECTS = {
    normal: { id: "normal", label: "Обычный", short: "обычн." },
    poison: { id: "poison", label: "Яд", short: "яд" },
    kill: { id: "kill", label: "Смерть", short: "смерть" },
  };

  const state = {
    mode: "solo",
    test: true,
    running: false,
    sun: START_SUN,
    wave: 1,
    waveTimer: 0,
    spawnTimer: 2,
    zombiesLeft: 0,
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [],
    mowers: [],
    fx: [],
    selectedP1: "peashooter",
    selectedP2: "sunflower",
    cooldown: {},
    lost: false,
    won: false,
    fallen: 0,
    time: 0,
    nutEffect: "normal",
    ownerNoReload: false,
    spawnKind: "normal",
    spawnRow: 0,
    spawnAllergy: "random",
    paused: false,
    timeScale: 1,
    freezeOn: false,
    slowmoOn: false,
    shieldLeft: 0,
    abilityCd: {},
  };

  function showToast(text) {
    els.toast.textContent = text;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2600);
  }

  function promoUnlocked() {
    return !!(window.PVZ2Promo && PVZ2Promo.hasAnyPromo());
  }

  /** Только промокод ПОПУГАЙ — хозяин сюда не подмешивается */
  function promoAbilityDefs() {
    const all = (window.PVZ2Promo && PVZ2Promo.ABILITIES) || [];
    if (!window.PVZ2Promo) return [];
    const ids = new Set(PVZ2Promo.unlockedAbilityIds());
    return all.filter((a) => ids.has(a.id));
  }

  function refreshPromoUi() {
    const list = document.getElementById("abilityList");
    const hint = document.getElementById("promoHint");
    const codeHint = document.getElementById("promoCodeHint");
    if (codeHint) {
      codeHint.innerHTML = amalOwner()
        ? 'Друзьям скажи код: <strong>ПОПУГАЙ</strong> (или PARROT)'
        : 'Введи код, если тебе его дали';
    }
    if (!list) return;
    const abs = promoAbilityDefs();
    if (!abs.length) {
      list.hidden = true;
      list.innerHTML = "";
      if (hint) {
        hint.textContent = amalOwner()
          ? "Попугай — не твоя админка. У тебя в бою кнопка ❄ Стоп (время стоит совсем)."
          : "Код на русском или другом языке — только для тех, кому хозяин дал.";
      }
      return;
    }
    list.hidden = false;
    list.innerHTML = abs
      .map(
        (a) =>
          `<li><strong>${a.name}</strong> <em style="opacity:.7">(${a.word})</em><span>${a.desc}</span></li>`
      )
      .join("");
    if (hint) {
      hint.textContent = "Промо открыто: это замедление и сюрпризы для друзей (не полный стоп).";
    }
    refreshSurpriseJournal();
  }

  function refreshSurpriseJournal() {
    const wrap = document.getElementById("surpriseJournal");
    const body = document.getElementById("surpriseJournalBody");
    if (!wrap || !body) return;
    if (!amalOwner() || !window.AmalSurprises) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    body.innerHTML = AmalSurprises.historyHtml("zombie-vs-plants-2");
  }

  function placeGiftPlant(typeId) {
    const type = COMBAT[typeId];
    if (!type || type.instant) return false;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (plantAt(r, c)) continue;
        state.plants.push({
          id: Math.random().toString(36).slice(2),
          typeId,
          row: r,
          col: c,
          hp: type.hp,
          maxHp: type.hp,
          cd: 0.2,
          sunCd: type.sunEvery || 0,
          armed: type.role !== "mine",
          dead: false,
          owner: "Сюрприз",
          nutEffect: type.nut ? "normal" : null,
        });
        addFx("✦", cellRect(r, c).x + 24, cellRect(r, c).y + 24, "#ffe7a8");
        return true;
      }
    }
    return false;
  }

  function applyLittleSurprise(kind) {
    if (!state.running) {
      showToast("Сюрприз сработает в бою — нажми Играть");
      return;
    }
    AudioFX.unlock();
    AudioFX.ability();
    if (kind === "sun-kiss" || kind === "sparkle") {
      const n = kind === "sparkle" ? 3 : 1;
      for (let i = 0; i < n; i++) {
        state.suns.push({
          x: LEFT + 40 + Math.random() * (COLS * CELL_W - 80),
          y: 12 + Math.random() * 30,
          value: kind === "sun-kiss" ? 75 : 25,
          life: 10,
          falling: true,
        });
      }
      if (kind === "sun-kiss") state.sun += 75;
      AudioFX.sun();
    } else if (kind === "nut-hug") {
      placeGiftPlant("wall-nut") || placeGiftPlant("tall-nut");
      AudioFX.plant();
    } else if (kind === "soft-pause") {
      state.zombies.forEach((z) => {
        if (!z.dead) z.slow = Math.max(z.slow || 0, 4);
      });
      AudioFX.screech();
    } else if (kind === "green-heal") {
      state.plants.forEach((p) => {
        if (!p.dead) p.hp = p.maxHp;
      });
      AudioFX.plant();
    } else if (kind === "lucky-seed") {
      const pool = ["threepeater", "winter-melon", "snapdragon", "spikerock", "repeater"].filter(
        (id) => COMBAT[id] && !COMBAT[id].instant
      );
      placeGiftPlant(pool[Math.floor(Math.random() * pool.length)] || "wall-nut");
      AudioFX.plant();
    }
    updateHud();
  }

  function applyOwnerSecretSurprise() {
    if (!amalOwner()) return;
    if (!state.running) {
      showToast("✦ — сначала Играть");
      return;
    }
    AudioFX.unlock();
    AudioFX.win();
    state.zombies.forEach((z) => {
      z.hp = 0;
      z.dead = true;
      z.dyingAllergy = 0;
    });
    state.zombies = [];
    state.sun += 500;
    state.plants.forEach((p) => {
      if (!p.dead) p.hp = p.maxHp;
    });
    for (let i = 0; i < 12; i++) {
      state.suns.push({
        x: LEFT + 20 + Math.random() * (COLS * CELL_W - 40),
        y: 6 + Math.random() * 50,
        value: 50,
        life: 12,
        falling: true,
      });
    }
    state.ownerNoReload = true;
    Object.keys(state.cooldown).forEach((id) => {
      state.cooldown[id] = 0;
    });
    placeGiftPlant("winter-melon");
    placeGiftPlant("tall-nut");
    placeGiftPlant("threepeater");
    addFx("✦", LEFT + COLS * CELL_W * 0.4, TOP + 40, "#ffe7a8");
    updateHud();
    renderSeedBar();
    syncZombieOwnerUi();
  }

  function syncFreezeButton() {
    const btn = document.getElementById("btnFreeze");
    if (!btn) return;
    const mine = amalOwner();
    btn.hidden = !mine;
    btn.classList.toggle("on", !!(mine && state.freezeOn));
    btn.textContent = state.freezeOn ? "❄ Стоп ВКЛ" : "❄ Стоп";
  }

  function toggleFreeze() {
    if (!amalOwner() || !state.running) return;
    state.freezeOn = !state.freezeOn;
    if (state.freezeOn) {
      state.slowmoOn = false;
      state.timeScale = 0;
      showToast("❄ Время СТОИТ — пока сам не выключишь");
    } else {
      state.timeScale = 1;
      showToast("❄ Время снова идёт");
    }
    AudioFX.unlock();
    AudioFX.ability();
    syncFreezeButton();
    renderAbilityBar();
  }

  function tryRedeemPromo() {
    AudioFX.unlock();
    AudioFX.click();
    const input = document.getElementById("promoInput");
    const raw = input ? input.value : "";
    if (!window.PVZ2Promo) {
      showToast("Промокоды не загрузились");
      return;
    }
    const result = PVZ2Promo.redeem(raw);
    showToast(result.message);
    if (result.ok) {
      AudioFX.ability();
      if (input) input.value = "";
      refreshPromoUi();
      renderAbilityBar();
      if (result.abilities && result.abilities.length) {
        const names = result.abilities.map((a) => a.name).join(" · ");
        setTimeout(() => showToast(`Способности: ${names}`), 900);
      }
    } else {
      AudioFX.hit();
    }
  }

  function renderAbilityBar() {
    const bar = document.getElementById("abilityBar");
    if (!bar) return;
    const abs = promoAbilityDefs();
    if (!abs.length || !state.running) {
      bar.hidden = true;
      bar.innerHTML = "";
      return;
    }
    bar.hidden = false;
    bar.innerHTML = "";
    abs.forEach((a, i) => {
      const cd = state.abilityCd[a.id] || 0;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ability-btn" + (a.id === "slowmo" && state.slowmoOn ? " on" : "");
      btn.disabled = cd > 0 || state.paused;
      btn.title = a.desc;
      if (a.id === "slowmo" && state.slowmoOn) {
        btn.textContent = "⏱ Замедление ВКЛ";
      } else {
        btn.textContent = cd > 0 ? `${a.name} ${Math.ceil(cd)}с` : `${i + 1}. ${a.name}`;
      }
      btn.addEventListener("click", () => useAbility(a.id));
      bar.appendChild(btn);
    });
  }

  function useAbility(id) {
    if (!state.running || state.paused) return;
    const def = promoAbilityDefs().find((a) => a.id === id);
    if (!def) {
      showToast("Сначала введи промокод в меню");
      return;
    }
    if ((state.abilityCd[id] || 0) > 0) {
      showToast("Ещё перезарядка способности");
      return;
    }
    AudioFX.unlock();
    let ok = false;
    if (id === "slowmo") {
      state.slowmoOn = !state.slowmoOn;
      if (state.slowmoOn) state.freezeOn = false;
      state.timeScale = state.slowmoOn ? 0.35 : 1;
      ok = true;
      showToast(state.slowmoOn ? "⏱ Замедление ВКЛ (промо)" : "⏱ Замедление ВЫКЛ");
      AudioFX.ability();
      syncFreezeButton();
    } else if (id === "screech") {
      state.zombies.forEach((z) => {
        if (!z.dead) z.slow = Math.max(z.slow || 0, 2.2);
      });
      ok = true;
      showToast("🦜 Крик попугая — зомби замерли!");
      AudioFX.screech();
    } else if (id === "sunrain") {
      for (let i = 0; i < 8; i++) {
        state.suns.push({
          x: LEFT + 30 + Math.random() * (COLS * CELL_W - 60),
          y: 8 + Math.random() * 40,
          value: 25,
          life: 10,
          falling: true,
        });
      }
      ok = true;
      showToast("☀️ Дождь солнца!");
      AudioFX.sun();
    } else if (id === "homeshield") {
      state.shieldLeft = 8;
      ok = true;
      showToast("🛡 Щит дома на 8 сек!");
      AudioFX.ability();
    } else if (id === "giftplant") {
      const gifts = ["winter-melon", "tall-nut", "threepeater", "snapdragon", "spikerock", "repeater", "bonk-choy"].filter(
        (pid) => COMBAT[pid] && !COMBAT[pid].instant
      );
      const typeId = gifts[Math.floor(Math.random() * gifts.length)] || "wall-nut";
      let placed = false;
      for (let c = 0; c < COLS && !placed; c++) {
        for (let r = 0; r < ROWS && !placed; r++) {
          if (!plantAt(r, c)) {
            const type = COMBAT[typeId];
            state.plants.push({
              id: Math.random().toString(36).slice(2),
              typeId,
              row: r,
              col: c,
              hp: type.hp,
              maxHp: type.hp,
              cd: 0.2,
              sunCd: type.sunEvery || 0,
              armed: type.role !== "mine",
              dead: false,
              owner: "Сюрприз",
              nutEffect: type.nut ? "normal" : null,
            });
            placed = true;
            addFx("🎁", cellRect(r, c).x + 24, cellRect(r, c).y + 24, "#ffe7a8");
            showToast(`🎁 Сюрприз: ${type.name}`);
          }
        }
      }
      ok = placed;
      if (!placed) showToast("Нет свободной клетки для подарка");
      else AudioFX.plant();
    }
    if (ok && def.cd > 0) {
      state.abilityCd[id] = def.cd;
    }
    if (ok) renderAbilityBar();
  }

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;
    AudioFX.unlock();
    AudioFX.click();
    const btn = document.getElementById("btnPause");
    if (btn) btn.textContent = state.paused ? "▶" : "⏸";
    if (state.paused) {
      AudioFX.stopMusic();
      showToast("⏸ Время остановлено");
    } else {
      AudioFX.startMusic();
      showToast("▶ Время снова идёт");
    }
    renderAbilityBar();
  }

  function showScreen(name) {
    els.screenMenu.hidden = name !== "menu";
    els.screenAlmanac.hidden = name !== "almanac";
    els.screenPlay.hidden = name !== "play";
    els.screenEnd.hidden = name !== "end";
  }

  function parseSun(value) {
    const n = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 100;
  }

  function amalOwner() {
    try {
      if (window.AmalPowers && AmalPowers.isOwner && AmalPowers.isOwner()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      if (window.__AMAL_OWNER__ || window.__AMAL_GOD__) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      const code = new URLSearchParams(location.search).get("owner");
      if (code === "AmalOwner2026" || code === "amal" || code === "1234") return true;
    } catch (_) {}
    return false;
  }

  function syncNutOwnerUi() {
    const mine = amalOwner();
    const nutBar = document.getElementById("nutBar");
    const btnNut = document.getElementById("btnNutTool");
    const zombieBar = document.getElementById("zombieBar");
    if (nutBar) nutBar.hidden = !mine;
    if (btnNut) btnNut.hidden = !mine;
    if (zombieBar) zombieBar.hidden = !mine;
    if (!mine) {
      nutTool = false;
      zombieTool = null;
      state.nutEffect = "normal";
    }
    document.querySelectorAll(".nut-mode").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-nut") === state.nutEffect);
    });
    if (btnNut) btnNut.classList.toggle("on", !!(nutTool && mine));
    syncZombieOwnerUi();
  }

  function syncZombieOwnerUi() {
    const mine = amalOwner();
    document.querySelectorAll(".z-tool").forEach((btn) => {
      const id = btn.getAttribute("data-ztool");
      if (id === "noreload") {
        btn.classList.toggle("on", !!(mine && state.ownerNoReload));
      } else {
        btn.classList.toggle("on", !!(mine && zombieTool === id));
      }
    });
    document.querySelectorAll("#zombieKinds .z-chip").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-kind") === state.spawnKind);
    });
    document.querySelectorAll("#zombieRows .z-chip").forEach((btn) => {
      const row = Number(btn.getAttribute("data-row"));
      btn.classList.toggle("active", row === state.spawnRow);
    });
    document.querySelectorAll("#zombieAllergies .z-chip").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-allergy") === state.spawnAllergy);
    });
  }

  function buildZombieOwnerPickers() {
    const kindsEl = document.getElementById("zombieKinds");
    const rowsEl = document.getElementById("zombieRows");
    const allEl = document.getElementById("zombieAllergies");
    if (!kindsEl || !rowsEl || !allEl) return;

    kindsEl.innerHTML = "";
    Object.entries(ZOMBIE_KINDS).forEach(([id, def]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "z-chip" + (def.hybrid ? " hybrid" : "");
      btn.setAttribute("data-kind", id);
      btn.textContent = def.hybrid ? `✧ ${def.name}` : def.name;
      btn.addEventListener("click", () => {
        if (!amalOwner()) return;
        state.spawnKind = id;
        zombieTool = "spawn";
        nutTool = false;
        shovel = false;
        syncNutOwnerUi();
        showToast(`Спавн: ${def.name}. Клик у ДОМА слева = зомби, по грядке = растение`);
      });
      kindsEl.appendChild(btn);
    });

    rowsEl.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "z-chip";
      btn.setAttribute("data-row", String(r));
      btn.textContent = String(r + 1);
      btn.addEventListener("click", () => {
        if (!amalOwner()) return;
        state.spawnRow = r;
        zombieTool = "spawn";
        syncZombieOwnerUi();
        showToast(`Ряд ${r + 1} выбран`);
      });
      rowsEl.appendChild(btn);
    }
    const rndRow = document.createElement("button");
    rndRow.type = "button";
    rndRow.className = "z-chip";
    rndRow.setAttribute("data-row", "-1");
    rndRow.textContent = "?";
    rndRow.title = "Случайный ряд";
    rndRow.addEventListener("click", () => {
      if (!amalOwner()) return;
      state.spawnRow = -1;
      syncZombieOwnerUi();
      showToast("Ряд: случайный");
    });
    rowsEl.appendChild(rndRow);

    allEl.innerHTML = "";
    [
      { id: "none", label: "нет" },
      { id: "random", label: "случ." },
      ...ALLERGY_POOL.map((id) => ({ id, label: ALLERGY_TYPES[id].short })),
    ].forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "z-chip allergy";
      btn.setAttribute("data-allergy", opt.id);
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        if (!amalOwner()) return;
        state.spawnAllergy = opt.id;
        syncZombieOwnerUi();
        showToast(`Аллергия при спавне: ${opt.label}`);
      });
      allEl.appendChild(btn);
    });
  }

  function setNutEffect(effectId) {
    if (!amalOwner()) return;
    if (!NUT_EFFECTS[effectId]) return;
    state.nutEffect = effectId;
    syncNutOwnerUi();
    showToast(`Эффект ореха (только ты): ${NUT_EFFECTS[effectId].label}`);
  }

  function applyNutEffectToPlant(plant) {
    if (!amalOwner()) return false;
    const type = COMBAT[plant.typeId];
    if (!type?.nut) {
      showToast("Это не орех");
      return false;
    }
    plant.nutEffect = state.nutEffect || "normal";
    const fx = NUT_EFFECTS[plant.nutEffect];
    addFx(fx.short, cellRect(plant.row, plant.col).x + 20, cellRect(plant.row, plant.col).y + 20, "#ffe7a8");
    showToast(`Орех: «${fx.label}»`);
    return true;
  }

  function plantTriggersAllergy(plantType, allergyId) {
    if (!allergyId || !plantType) return false;
    const types = plantType.types || [];
    if (allergyId === "nut") return !!plantType.nut;
    if (allergyId === "fire") {
      return types.includes("fire") || plantType.burn > 0 || plantType.role === "breath" || plantType.role === "rowbomb";
    }
    if (allergyId === "ice") {
      return types.includes("ice") || !!plantType.slow || plantType.role === "freeze";
    }
    if (allergyId === "electric") {
      return types.includes("electric") || plantType.role === "electric";
    }
    if (allergyId === "pea") return types.includes("pea");
    if (allergyId === "sun") return types.includes("sun") || plantType.role === "sun";
    if (allergyId === "bomb") {
      return (
        types.includes("bomb") ||
        plantType.role === "bomb" ||
        plantType.role === "mine" ||
        plantType.role === "rowbomb"
      );
    }
    if (allergyId === "melee") return types.includes("melee") || plantType.role === "melee";
    return false;
  }

  function allergyLabel(allergyId) {
    return ALLERGY_TYPES[allergyId]?.label || allergyId || "";
  }

  function triggerAllergyDeath(z, plantName) {
    const meta = ALLERGY_TYPES[z.allergyType];
    z.dyingAllergy = 0.9;
    z.allergyFlash = 1;
    z.eating = false;
    const label = meta ? meta.short.toUpperCase() : "АЛЛЕРГИЯ";
    addFx(label + "!", z.x - 10, cellRect(z.row, 0).y + 18, meta?.color || "#ffd27a");
    showToast(
      `Зомби умер от аллергии на ${allergyLabel(z.allergyType)}${plantName ? ` (${plantName})` : ""}!`
    );
  }

  function findZombieNear(x, y) {
    let best = null;
    let bestD = 48;
    state.zombies.forEach((z) => {
      if (z.dead) return;
      const groundY = cellRect(z.row, 0).y + CELL_H * 0.55;
      const d = Math.hypot(z.x - x, groundY - y);
      if (d < bestD) {
        bestD = d;
        best = z;
      }
    });
    return best;
  }

  function killZombieOwner(z) {
    if (!z || z.dead) return;
    z.hp = 0;
    z.dead = true;
    z.dyingAllergy = 0;
    state.fallen += 1;
    addFx("☠", z.x - 6, cellRect(z.row, 0).y + 24, "#ff8866");
    showToast(`Убит: ${z.name}`);
    state.zombies = state.zombies.filter((o) => !o.dead);
  }

  function cureZombieAllergy(z) {
    if (!z || z.dead) return;
    if (!z.allergyType) {
      showToast("У этого зомби нет аллергии");
      return;
    }
    const was = allergyLabel(z.allergyType);
    z.allergyType = null;
    z.nutAllergy = false;
    z.allergyFlash = 0.5;
    z.name = (ZOMBIE_KINDS[z.kind]?.name || z.name).replace(/\s*\(.*\)$/, "");
    addFx("💉", z.x - 4, cellRect(z.row, 0).y + 20, "#9dffc8");
    showToast(`Спасён от аллергии на ${was}`);
  }

  function resolveSpawnAllergy(mode) {
    if (mode === "none") return null;
    if (mode && mode !== "random" && ALLERGY_TYPES[mode]) return mode;
    // mode random / wave: 10% шанс любой аллергии
    if (Math.random() < ALLERGY_CHANCE) {
      return ALLERGY_POOL[Math.floor(Math.random() * ALLERGY_POOL.length)];
    }
    return null;
  }

  function pickAllergyForced(mode) {
    if (mode === "none" || mode == null) return null;
    if (mode === "random") {
      return ALLERGY_POOL[Math.floor(Math.random() * ALLERGY_POOL.length)];
    }
    return ALLERGY_TYPES[mode] ? mode : null;
  }

  function parseRecharge(value) {
    const n = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? Math.max(1, n) : 5;
  }

  function isNutPlant(p) {
    const id = (p.id || "").toLowerCase();
    const en = (p.en || "").toLowerCase();
    return (
      (p.types || []).includes("defense") &&
      (id.includes("nut") ||
        en.includes("nut") ||
        en.includes("endurian") ||
        en.includes("gumnut") ||
        en.includes("blockoli") ||
        en.includes("pumpkin"))
    );
  }

  function combatStats(raw) {
    const types = raw.types || ["other"];
    const sun = parseSun(raw.sun);
    const recharge = parseRecharge(raw.recharge);
    const primary = types[0] || "other";
    let hp = 300;
    let damage = 20;
    let shootEvery = 1.45;
    let role = "shooter";
    let pierce = 1;
    let aoe = 0;
    let slow = 0;
    let burn = 0;
    let instant = false;
    let generateSun = 0;
    let sunEvery = 0;
    let ground = false;
    let melee = false;
    let lob = false;
    let chain = 0;

    if (types.includes("defense")) {
      role = "wall";
      hp = 1200 + Math.min(sun, 300) * 4;
      damage = 0;
    }
    if (types.includes("sun")) {
      role = "sun";
      hp = 300;
      generateSun = types.includes("sun") && sun >= 100 ? 50 : 25;
      sunEvery = 7.5;
      if (raw.id.includes("twin") || raw.id.includes("primal-sun")) generateSun = 50;
    }
    if (types.includes("bomb")) {
      role = "bomb";
      hp = 200;
      damage = 900 + sun * 2;
      aoe = 1;
      instant = true;
      if (raw.id.includes("mine") || raw.en.toLowerCase().includes("mine")) {
        role = "mine";
        instant = false;
        damage = 900;
      }
    }
    if (types.includes("spike")) {
      role = "spike";
      hp = 99999;
      damage = 18 + Math.floor(sun / 20);
      ground = true;
    }
    if (types.includes("melee")) {
      role = "melee";
      melee = true;
      damage = 28 + Math.floor(sun / 15);
      shootEvery = 0.55;
      hp = 450;
    }
    if (types.includes("pea") || types.includes("shadow") || primary === "other") {
      if (role === "shooter" || types.includes("pea") || types.includes("shadow")) {
        role = "shooter";
        damage = 20 + Math.floor(sun / 25);
        if (raw.id.includes("repeater") || raw.id.includes("split")) damage = 20;
        if (raw.id.includes("threepeater") || raw.id.includes("gatling")) {
          damage = 20;
          shootEvery = 1.2;
        }
        if (types.includes("shadow")) damage += 5;
      }
    }
    if (types.includes("lobber")) {
      role = "lobber";
      lob = true;
      damage = 35 + Math.floor(sun / 20);
      shootEvery = 2.1;
      aoe = types.includes("ice") || types.includes("fire") ? 0.5 : 0;
    }
    if (types.includes("fire")) {
      if (role === "shooter" || role === "lobber") burn = 1;
      if (raw.id.includes("snapdragon") || raw.id.includes("pyre") || raw.id.includes("inferno")) {
        role = "breath";
        damage = 35;
        shootEvery = 1.2;
        aoe = 1;
      }
      if (raw.id.includes("jalapeno") || raw.en.toLowerCase().includes("jalapeno")) {
        role = "rowbomb";
        instant = true;
        damage = 1400;
      }
    }
    if (types.includes("ice")) {
      slow = 0.45;
      if (raw.id.includes("iceberg") || raw.id.includes("ice-bloom") || raw.id.includes("stunion")) {
        role = "freeze";
        instant = true;
        damage = 0;
        aoe = raw.id.includes("ice-bloom") ? 9 : 0;
      }
      if (role === "shooter" || role === "lobber") damage = Math.max(15, damage - 5);
    }
    if (types.includes("electric")) {
      role = "electric";
      damage = 22 + Math.floor(sun / 20);
      chain = 2;
      pierce = 3;
      shootEvery = 1.3;
    }
    if (types.includes("poison")) {
      role = "fume";
      damage = 22;
      pierce = 99;
      shootEvery = 1.4;
    }
    if (types.includes("water") && (raw.id.includes("kelp") || raw.id.includes("guac"))) {
      role = "trap";
      instant = false;
      damage = 9999;
      hp = 300;
    }
    if (types.includes("support")) {
      if (role === "shooter" && !types.includes("pea")) {
        role = "support";
        damage = 0;
        hp = 300;
      }
    }
    if (types.includes("mint")) {
      role = "mint";
      instant = true;
      damage = 400;
      aoe = 2;
    }
    if (raw.id === "cherry-bomb" || raw.en === "Cherry Bomb") {
      role = "bomb";
      instant = true;
      damage = 1800;
      aoe = 1;
    }

    return {
      ...raw,
      sunCost: sun,
      recharge,
      hp,
      damage,
      shootEvery,
      role,
      pierce,
      aoe,
      slow,
      burn,
      instant,
      generateSun,
      sunEvery,
      ground,
      melee,
      lob,
      chain,
      nut: isNutPlant(raw),
    };
  }

  const COMBAT = Object.fromEntries(
    plantsCatalog.map((p) => [p.id, combatStats(p)])
  );

  const STARTER_LOADOUT = [
    "peashooter",
    "sunflower",
    "wall-nut",
    "potato-mine",
    "cabbage-pult",
    "bloomerang",
    "iceberg-lettuce",
    "bonk-choy",
    "snapdragon",
    "lightning-reed",
    "spikeweed",
    "cherry-bomb",
    "snow-pea",
    "fire-peashooter",
    "electric-blueberry",
    "repeater",
    "tall-nut",
    "kernel-pult",
    "threepeater",
    "winter-melon",
  ].filter((id) => COMBAT[id]);

  function cellRect(row, col) {
    return {
      x: LEFT + col * CELL_W,
      y: TOP + row * CELL_H,
      w: CELL_W,
      h: CELL_H,
    };
  }

  function plantAt(row, col) {
    return state.plants.find((p) => p.row === row && p.col === col && !p.dead);
  }

  function showMenu() {
    cancelAnimationFrame(animId);
    state.running = false;
    state.paused = false;
    AudioFX.stopMusic();
    showScreen("menu");
    refreshPromoUi();
  }

  function endGame(won, reason) {
    state.running = false;
    state.paused = false;
    state.won = won;
    state.lost = !won;
    cancelAnimationFrame(animId);
    AudioFX.stopMusic();
    if (won) AudioFX.win();
    else AudioFX.lose();
    showScreen("end");
    els.endTitle.textContent = won ? "Победа!" : "Зомби дошли до дома";
    els.endSub.textContent = reason || (won ? "Все волны отражены." : "Попробуй ещё раз.");
  }

  function startGame() {
    state.mode = els.modeSelect.value === "coop" ? "coop" : "solo";
    state.test = !!(els.testMode && els.testMode.checked);
    state.running = true;
    state.sun = state.test ? 99999 : START_SUN;
    state.wave = 1;
    state.waveTimer = 0;
    state.spawnTimer = 1.5;
    state.zombiesLeft = 6;
    state.plants = [];
    state.zombies = [];
    state.projectiles = [];
    state.suns = [];
    state.fx = [];
    state.cooldown = {};
    state.lost = false;
    state.won = false;
    state.fallen = 0;
    state.selectedP1 = STARTER_LOADOUT[0];
    state.selectedP2 = STARTER_LOADOUT[1] || STARTER_LOADOUT[0];
    shovel = false;
    nutTool = false;
    zombieTool = null;
    state.paused = false;
    state.timeScale = 1;
    state.freezeOn = false;
    state.slowmoOn = false;
    state.shieldLeft = 0;
    state.abilityCd = {};
    if (!amalOwner()) {
      state.nutEffect = "normal";
      state.ownerNoReload = false;
    }
    state.mowers = Array.from({ length: ROWS }, (_, row) => ({
      row,
      used: false,
      x: 34,
      y: TOP + row * CELL_H + CELL_H * 0.62,
      active: false,
      speed: 320,
      gone: false,
    }));
    showScreen("play");
    syncNutOwnerUi();
    buildZombieOwnerPickers();
    syncZombieOwnerUi();
    renderAbilityBar();
    syncFreezeButton();
    const pauseBtn = document.getElementById("btnPause");
    if (pauseBtn) pauseBtn.textContent = "⏸";
    AudioFX.unlock();
    AudioFX.startMusic();
    AudioFX.wave();
    els.modeText.textContent =
      (state.mode === "coop" ? "Вдвоём" : "Соло") + (state.test ? " · ТЕСТ ∞" : "");
    els.coopHint.hidden = state.mode !== "coop";
    els.playHint.textContent = state.test
      ? "Тест: ∞ косилки и солнце. " +
        (state.mode === "coop"
          ? "Игрок 1: клик · Игрок 2: Shift+клик"
          : "Выбери растение и кликни по клетке")
      : state.mode === "coop"
        ? "Игрок 1: клик · Игрок 2: Shift+клик · лопата снимает растение"
        : "Выбери растение сверху и кликни по клетке";
    renderSeedBar();
    updateHud();
    lastTs = performance.now();
    animId = requestAnimationFrame(frame);
    showToast(
      state.test
        ? "Тест включён: ∞ косилки и солнце"
        : state.mode === "coop"
          ? "Кооп: сажайте вместе!"
          : "Защищай грядки!"
    );
  }

  function updateHud() {
    els.sunText.textContent = state.test ? "∞" : String(Math.floor(state.sun));
    els.waveText.textContent = `Волна ${state.wave}/${MAX_WAVES}`;
  }

  function renderSeedBar() {
    els.seedBar.innerHTML = "";
    STARTER_LOADOUT.forEach((id) => {
      const p = COMBAT[id];
      if (!p) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seed";
      const cd = state.cooldown[id] || 0;
      if (cd > 0) btn.classList.add("cd");
      if (state.selectedP1 === id) btn.classList.add("active-p1");
      if (state.mode === "coop" && state.selectedP2 === id) btn.classList.add("active-p2");
      btn.innerHTML = `<span class="ic">${p.icon}</span>${p.name}<span class="cost">☀️${p.sunCost}</span>${
        state.mode === "coop"
          ? `<span class="who">${state.selectedP1 === id ? "P1" : ""}${
              state.selectedP2 === id ? (state.selectedP1 === id ? "+P2" : "P2") : ""
            }</span>`
          : ""
      }`;
      btn.title = `${p.name} · ${(p.types || []).map((t) => typeName[t] || t).join(", ")}`;
      btn.addEventListener("click", (e) => {
        shovel = false;
        nutTool = false;
        if (zombieTool) {
          zombieTool = null;
          syncZombieOwnerUi();
          showToast(`Сажаем: ${p.name}`);
        }
        if (state.mode === "coop" && (e.shiftKey || e.button === 2)) {
          state.selectedP2 = id;
        } else if (state.mode === "coop" && e.altKey) {
          state.selectedP2 = id;
        } else {
          state.selectedP1 = id;
        }
        renderSeedBar();
        syncNutOwnerUi();
      });
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (state.mode === "coop") {
          state.selectedP2 = id;
          shovel = false;
          zombieTool = null;
          renderSeedBar();
          syncNutOwnerUi();
        }
      });
      els.seedBar.appendChild(btn);
    });
  }

  function spawnZombie(forcedType, forcedRow, forcedAllergy) {
    const wavePool = ["normal", "normal", "cone", "runner", "bucket"];
    const hybridPool = ["cone-runner", "bucket-runner", "double-hat", "tank-hybrid", "spark-hybrid"];
    const kind =
      forcedType ||
      (Math.random() < 0.12
        ? hybridPool[Math.floor(Math.random() * hybridPool.length)]
        : wavePool[Math.floor(Math.random() * wavePool.length)]);
    const base = ZOMBIE_KINDS[kind] || ZOMBIE_KINDS.normal;
    const finalRow =
      forcedRow == null ? Math.floor(Math.random() * ROWS) : forcedRow < 0 ? Math.floor(Math.random() * ROWS) : forcedRow;

    let allergyType = null;
    if (forcedAllergy === undefined) {
      allergyType = resolveSpawnAllergy("random");
    } else {
      allergyType = pickAllergyForced(forcedAllergy);
    }

    const z = {
      id: Math.random().toString(36).slice(2),
      kind,
      row: finalRow,
      x: LEFT + COLS * CELL_W + 20,
      hp: base.hp + state.wave * 18,
      maxHp: base.hp + state.wave * 18,
      speed: base.speed,
      damage: base.damage,
      color: base.color,
      name: allergyType ? `${base.name} (аллергия: ${allergyLabel(allergyType)})` : base.name,
      biteCd: 0,
      slow: 0,
      burn: 0,
      allergyType,
      nutAllergy: allergyType === "nut",
      eating: false,
      walkPhase: Math.random() * Math.PI * 2,
      chomp: 0,
      allergyFlash: 0,
      dyingAllergy: 0,
      poison: 0,
      dead: false,
      hats: base.hats || [],
      spark: !!base.spark,
      drawScale: base.scale || 1,
    };
    state.zombies.push(z);
    if (allergyType) {
      showToast(`Зомби с аллергией на ${allergyLabel(allergyType)}!`);
      AudioFX.zombie();
    }
    return z;
  }

  function spawnZombieOwner(rowOverride) {
    if (!amalOwner()) return null;
    const row =
      rowOverride != null
        ? rowOverride
        : state.spawnRow < 0
          ? Math.floor(Math.random() * ROWS)
          : state.spawnRow;
    const z = spawnZombie(state.spawnKind, row, state.spawnAllergy);
    showToast(`＋ ${z.name} → ряд ${row + 1}`);
    return z;
  }

  function drawAnimatedZombie(z) {
    const groundY = cellRect(z.row, 0).y + CELL_H - 18;
    const dying = z.dyingAllergy > 0;
    const eatBob = z.eating ? Math.sin(state.time * 14) * 2.5 : Math.sin(state.time * 5.5 + z.walkPhase) * 3;
    const armSwing = z.eating
      ? Math.sin(state.time * 16) * 0.55
      : Math.sin(state.time * 6 + z.walkPhase) * 0.35;
    const legSwing = z.eating ? 0.08 : Math.sin(state.time * 6 + z.walkPhase) * 0.45;
    const scale =
      z.drawScale ||
      (z.kind === "bucket" || z.kind === "double-hat" || z.kind === "tank-hybrid"
        ? 1.08
        : z.kind === "runner" || z.kind === "cone-runner"
          ? 0.92
          : 1);
    const alpha = dying ? Math.max(0, z.dyingAllergy / 0.9) : 1;
    const hats = z.hats || (z.kind === "cone" ? ["cone"] : z.kind === "bucket" ? ["bucket"] : []);
    const allergyMeta = z.allergyType ? ALLERGY_TYPES[z.allergyType] : null;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(z.x, groundY + (dying ? (0.9 - z.dyingAllergy) * 20 : 0));
    ctx.scale(scale * (dying ? 1 + (0.9 - z.dyingAllergy) * 0.2 : 1), scale);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, eatBob - 28);

    ctx.strokeStyle = "#4a6a40";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5, 28);
    ctx.lineTo(-5 - Math.sin(legSwing) * 8, 42);
    ctx.moveTo(5, 28);
    ctx.lineTo(5 + Math.sin(legSwing) * 8, 42);
    ctx.stroke();

    ctx.fillStyle = z.color;
    ctx.beginPath();
    ctx.ellipse(0, 14, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = z.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.lineTo(-18 - Math.cos(armSwing) * 10, 4 + Math.sin(armSwing) * 12);
    ctx.moveTo(12, 6);
    ctx.lineTo(20 + Math.cos(armSwing) * 6, 2 + Math.sin(armSwing + 0.4) * (z.eating ? 14 : 8));
    ctx.stroke();

    const headColor = z.slow > 0 ? "#b8ecff" : z.poison > 0 ? "#b89ad8" : allergyMeta ? "#b8d490" : "#9ec98a";
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(0, -12, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff8d8";
    ctx.beginPath();
    ctx.ellipse(-5, -14, 3.2, 4, -0.15, 0, Math.PI * 2);
    ctx.ellipse(5, -14, 3.2, 4, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2810";
    ctx.beginPath();
    ctx.arc(-4, -14, 1.5, 0, Math.PI * 2);
    ctx.arc(6, -14, 1.5, 0, Math.PI * 2);
    ctx.fill();

    const chompOpen = z.eating ? 4 + Math.abs(Math.sin(state.time * 16)) * 5 : 2;
    ctx.fillStyle = "#3a2018";
    ctx.beginPath();
    ctx.ellipse(0, -5, 5, chompOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    if (z.eating) {
      ctx.fillStyle = "#d4543a";
      ctx.fillRect(-3, -6, 6, 2);
    }

    if (hats.includes("cone")) {
      const cy = hats.includes("bucket") ? -48 : -24;
      ctx.fillStyle = "#ef8b2c";
      ctx.beginPath();
      ctx.moveTo(-12, cy);
      ctx.lineTo(0, cy - 28);
      ctx.lineTo(12, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffd08a";
      ctx.fillRect(-9, cy - 8, 18, 3);
    }
    if (hats.includes("bucket")) {
      ctx.fillStyle = "#9ba6ad";
      ctx.fillRect(-14, -40, 28, 17);
      ctx.strokeStyle = "#d9e0e4";
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -40, 28, 17);
      ctx.beginPath();
      ctx.arc(0, -39, 16, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    if (z.kind === "runner" || z.kind === "cone-runner" || z.kind === "bucket-runner") {
      ctx.strokeStyle = "#e8f07a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, 24);
      ctx.lineTo(-16, 36);
      ctx.moveTo(8, 24);
      ctx.lineTo(16, 36);
      ctx.stroke();
    }
    if (z.spark) {
      ctx.fillStyle = "#ffe566";
      for (let i = 0; i < 4; i++) {
        const a = state.time * 10 + i * 1.7;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 16, -8 + Math.sin(a * 1.3) * 10, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (allergyMeta) {
      ctx.fillStyle = allergyMeta.color;
      [[-10, -8], [9, -10], [-2, -18], [7, -4]].forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(x, y + Math.sin(state.time * 8 + i) * 0.8, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      if (z.allergyFlash > 0 || dying) {
        ctx.fillStyle = `rgba(255, 210, 120, ${0.35 + Math.sin(state.time * 20) * 0.2})`;
        ctx.beginPath();
        ctx.arc(0, -8, 28, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (z.burn > 0) {
      ctx.fillStyle = "rgba(255, 100, 40, 0.35)";
      ctx.beginPath();
      ctx.arc(0, 8, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    if (z.poison > 0) {
      ctx.fillStyle = "rgba(160, 80, 220, 0.3)";
      ctx.beginPath();
      ctx.arc(0, 4, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const pct = Math.max(0, z.hp / z.maxHp);
    const barY = groundY - 62 + eatBob;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(z.x - 18, barY, 36, 5);
    ctx.fillStyle = allergyMeta ? allergyMeta.color : "#e85a3a";
    ctx.fillRect(z.x - 18, barY, 36 * pct, 5);
    if (allergyMeta) {
      ctx.fillStyle = allergyMeta.color;
      ctx.font = "800 9px Nunito";
      ctx.fillText(allergyMeta.short, z.x - 14, barY - 2);
    }
  }

  function drawPlantSprite(plant, type, rect) {
    const cx = rect.x + rect.w * 0.5;
    const cy = rect.y + rect.h * 0.58;
    const bob = Math.sin(state.time * 3 + plant.col * 0.7 + plant.row) * 1.2;
    const types = type.types || [];

    ctx.save();
    ctx.translate(cx, cy + bob);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type.nut || type.role === "wall") {
      // ordinary nut / wall
      const g = ctx.createRadialGradient(-4, -6, 2, 0, 0, 22);
      g.addColorStop(0, "#e8c878");
      g.addColorStop(0.55, "#c49a45");
      g.addColorStop(1, "#7a5a22");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 4, type.id.includes("tall") ? 16 : 18, type.id.includes("tall") ? 28 : 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5a4018";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, 0, 10, 0.2, 2.2);
      ctx.stroke();
      ctx.fillStyle = "#3a2810";
      ctx.beginPath();
      ctx.arc(-5, -2, 2, 0, Math.PI * 2);
      ctx.arc(5, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      if (plant.nutEffect === "poison") {
        ctx.fillStyle = "rgba(160,80,220,0.35)";
        ctx.beginPath();
        ctx.arc(0, 4, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      if (plant.nutEffect === "kill") {
        ctx.fillStyle = "rgba(220,60,40,0.3)";
        ctx.beginPath();
        ctx.arc(0, 4, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type.role === "sun" || types.includes("sun")) {
      ctx.fillStyle = "#2f7a28";
      ctx.fillRect(-3, 8, 6, 14);
      ctx.fillStyle = "#f0c430";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + state.time * 0.4;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 14, Math.sin(a) * 14 - 4, 5, 9, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#c47a18";
      ctx.beginPath();
      ctx.arc(0, -4, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (type.role === "bomb" || type.role === "mine" || types.includes("bomb")) {
      if (type.role === "mine" && !plant.armed) {
        ctx.fillStyle = "#6b4a2e";
        ctx.beginPath();
        ctx.ellipse(0, 10, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#d62828";
        ctx.beginPath();
        ctx.arc(-7, 0, 11, 0, Math.PI * 2);
        ctx.arc(8, 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#3d7a28";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-7, -10);
        ctx.quadraticCurveTo(0, -22, 8, -8);
        ctx.stroke();
      }
    } else if (type.role === "spike" || types.includes("spike")) {
      ctx.fillStyle = "#4a8f3a";
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7 - 3, 16);
        ctx.lineTo(i * 7, -2);
        ctx.lineTo(i * 7 + 3, 16);
        ctx.fill();
      }
    } else if (type.role === "melee" || types.includes("melee")) {
      ctx.fillStyle = "#3d8f2a";
      ctx.fillRect(-4, 6, 8, 16);
      ctx.fillStyle = "#6bbb48";
      ctx.beginPath();
      ctx.ellipse(0, -2, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a5a1a";
      ctx.fillRect(-16, -6, 10, 5);
      ctx.fillRect(6, -6, 10, 5);
    } else if (types.includes("fire") || type.role === "breath") {
      ctx.fillStyle = "#3d7a28";
      ctx.fillRect(-3, 6, 6, 14);
      const flame = ctx.createRadialGradient(0, -6, 2, 0, -6, 16);
      flame.addColorStop(0, "#ffe566");
      flame.addColorStop(0.5, "#ff7a2a");
      flame.addColorStop(1, "#c02010");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(-12, 4);
      ctx.quadraticCurveTo(-14, -18, 0, -22);
      ctx.quadraticCurveTo(14, -18, 12, 4);
      ctx.closePath();
      ctx.fill();
    } else if (types.includes("ice") || type.role === "freeze") {
      ctx.fillStyle = "#9fdfff";
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(12, 2);
      ctx.lineTo(0, 16);
      ctx.lineTo(-12, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#5aa0d0";
      ctx.stroke();
    } else if (types.includes("electric") || type.role === "electric") {
      ctx.fillStyle = "#3d8f2a";
      ctx.fillRect(-3, 4, 6, 16);
      ctx.fillStyle = "#ffe566";
      ctx.beginPath();
      ctx.moveTo(-2, -18);
      ctx.lineTo(6, -4);
      ctx.lineTo(1, -4);
      ctx.lineTo(8, 12);
      ctx.lineTo(-6, -2);
      ctx.lineTo(0, -2);
      ctx.closePath();
      ctx.fill();
    } else if (type.role === "lobber" || types.includes("lobber")) {
      ctx.fillStyle = "#3d7a28";
      ctx.fillRect(-3, 4, 6, 16);
      ctx.fillStyle = types.includes("ice") ? "#9fdfff" : "#6bbb48";
      ctx.beginPath();
      ctx.ellipse(0, -4, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c45a28";
      ctx.beginPath();
      ctx.arc(10, -10, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ordinary peashooter-style plant
      ctx.fillStyle = "#3d8f2a";
      ctx.fillRect(-3, 6, 6, 16);
      ctx.fillStyle = "#6bbb48";
      ctx.beginPath();
      ctx.ellipse(-2, 2, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      const head = types.includes("shadow") ? "#6b4ca8" : "#7ed957";
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(4, -6, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a2810";
      ctx.beginPath();
      ctx.arc(8, -8, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2f6a28";
      ctx.beginPath();
      ctx.ellipse(14, -4, 6, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function addFx(text, x, y, color) {
    state.fx.push({ text, x, y, color: color || "#fff", life: 1 });
  }

  function explodeAt(row, col, radius, damage) {
    for (let r = row - radius; r <= row + radius; r++) {
      for (let c = col - radius; c <= col + radius; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        const rect = cellRect(r, c);
        state.zombies.forEach((z) => {
          if (z.dead || z.row !== r) return;
          if (z.x >= rect.x - 10 && z.x <= rect.x + rect.w + 10) {
            z.hp -= damage;
          }
        });
      }
    }
    addFx("БУМ", cellRect(row, col).x + 30, cellRect(row, col).y + 30, "#ff8866");
  }

  function freezeZombies(row, all) {
    state.zombies.forEach((z) => {
      if (z.dead) return;
      if (!all && z.row !== row) return;
      z.slow = Math.max(z.slow, 3.5);
      z.speed *= 0.2;
    });
    addFx("❄", LEFT + 200, cellRect(row, 4).y + 40, "#9fdfff");
  }

  function placePlant(typeId, row, col, player) {
    const type = COMBAT[typeId];
    if (!type) return;
    if ((state.cooldown[typeId] || 0) > 0 && !(amalOwner() && state.ownerNoReload)) {
      showToast("Ещё перезарядка");
      return;
    }
    if (!state.test && state.sun < type.sunCost) {
      showToast("Мало солнца");
      return;
    }
    if (plantAt(row, col)) {
      showToast("Клетка занята");
      return;
    }

    if (!state.test) state.sun -= type.sunCost;
    if (amalOwner() && state.ownerNoReload) {
      state.cooldown[typeId] = 0;
    } else {
      state.cooldown[typeId] = state.test ? Math.min(1.2, type.recharge * 0.25) : type.recharge;
    }
    AudioFX.plant();

    if (type.instant) {
      if (type.role === "bomb" || type.role === "mint") {
        explodeAt(row, col, type.aoe || 1, type.damage);
      } else if (type.role === "rowbomb") {
        state.zombies.forEach((z) => {
          if (!z.dead && z.row === row) z.hp -= type.damage;
        });
        addFx("🔥РЯД", cellRect(row, 4).x, cellRect(row, 4).y + 20, "#ff6633");
      } else if (type.role === "freeze") {
        freezeZombies(row, type.aoe >= 9);
      }
      updateHud();
      renderSeedBar();
      showToast(`${player}: ${type.name}`);
      return;
    }

    const plant = {
      id: Math.random().toString(36).slice(2),
      typeId,
      row,
      col,
      hp: type.hp,
      maxHp: type.hp,
      cd: type.role === "mine" ? 8 : 0.4,
      sunCd: type.sunEvery || 0,
      armed: type.role !== "mine",
      dead: false,
      owner: player,
      nutEffect: type.nut
        ? amalOwner()
          ? state.nutEffect || "normal"
          : "normal"
        : null,
    };
    state.plants.push(plant);
    updateHud();
    renderSeedBar();
    if (type.nut) {
      const fx = NUT_EFFECTS[plant.nutEffect] || NUT_EFFECTS.normal;
      showToast(`${player}: ${type.name} · эффект «${fx.label}»`);
    } else {
      showToast(`${player}: ${type.name}`);
    }
  }

  function tryShovel(row, col) {
    const p = plantAt(row, col);
    if (!p) return;
    p.dead = true;
    state.plants = state.plants.filter((x) => !x.dead);
    showToast("Растение убрано");
  }

  function canvasToCell(clientX, clientY) {
    const rect = els.canvas.getBoundingClientRect();
    const sx = els.canvas.width / rect.width;
    const sy = els.canvas.height / rect.height;
    const x = (clientX - rect.left) * sx;
    const y = (clientY - rect.top) * sy;
    const col = Math.floor((x - LEFT) / CELL_W);
    const row = Math.floor((y - TOP) / CELL_H);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return { row, col };
  }

  function shootFrom(plant, type) {
    const rect = cellRect(plant.row, plant.col);
    const mk = (row, extra = {}) => {
      const lane = cellRect(row, plant.col);
      return {
        row,
        x: rect.x + rect.w * 0.7,
        y: lane.y + lane.h * 0.45,
        speed: type.lob ? 160 : 220,
        damage: type.damage,
        pierce: type.pierce || 1,
        slow: type.slow || 0,
        burn: type.burn || 0,
        chain: type.chain || 0,
        lob: !!type.lob,
        plantTypeId: type.id,
        color:
          type.types.includes("fire")
            ? "#ff6a2a"
            : type.types.includes("ice")
              ? "#7ecbff"
              : type.types.includes("electric")
                ? "#ffe566"
                : type.types.includes("shadow")
                  ? "#a56bff"
                  : "#7dff6a",
        hit: new Set(),
        ...extra,
      };
    };

    const applyHitAllergy = (z) => {
      if (z.allergyType && plantTriggersAllergy(type, z.allergyType)) {
        triggerAllergyDeath(z, type.name);
        return true;
      }
      return false;
    };

    if (type.role === "breath") {
      state.zombies.forEach((z) => {
        if (z.dead || z.row < plant.row - 1 || z.row > plant.row + 1) return;
        if (z.x < rect.x || z.x > rect.x + CELL_W * 3.2) return;
        if (applyHitAllergy(z)) return;
        z.hp -= type.damage;
        z.burn = Math.max(z.burn, 2);
      });
      addFx("🔥", rect.x + 50, rect.y + 30, "#ff7744");
      return;
    }

    if (type.melee || type.role === "melee") {
      let hit = false;
      state.zombies.forEach((z) => {
        if (z.dead || z.row !== plant.row) return;
        if (z.x > rect.x - 10 && z.x < rect.x + CELL_W * 1.6) {
          if (applyHitAllergy(z)) return;
          z.hp -= type.damage;
          hit = true;
        }
      });
      if (hit) addFx("👊", rect.x + 40, rect.y + 30, "#ffe0a0");
      return;
    }

    if (type.role === "fume" || type.role === "electric") {
      const sorted = state.zombies
        .filter((z) => !z.dead && z.row === plant.row && z.x >= rect.x)
        .sort((a, b) => a.x - b.x);
      let left = type.pierce || 3;
      for (const z of sorted) {
        if (left <= 0) break;
        if (applyHitAllergy(z)) {
          left -= 1;
          continue;
        }
        z.hp -= type.damage;
        if (type.slow) z.slow = Math.max(z.slow, type.slow * 4);
        if (type.burn) z.burn = Math.max(z.burn, 2);
        left -= 1;
      }
      if (type.role === "electric") addFx("⚡", rect.x + 60, rect.y + 25, "#ffe566");
      return;
    }

    // Тройной горохострел — по 1 горошине в свой ряд и соседние
    const isThree = type.id === "threepeater" || type.id.includes("threepeater");
    const rows = isThree
      ? [plant.row - 1, plant.row, plant.row + 1].filter((r) => r >= 0 && r < ROWS)
      : [plant.row];
    rows.forEach((r) => state.projectiles.push(mk(r)));
    if (isThree) {
      addFx("3×", rect.x + 36, rect.y + 22, "#c8ff9a");
    }
    AudioFX.shoot();
    if (type.id.includes("repeater") || type.id.includes("split-pea")) {
      state.projectiles.push(mk(plant.row, { x: rect.x + rect.w * 0.55 }));
    }
    // Разрезной горох — ещё и назад
    if (type.id.includes("split-pea")) {
      state.projectiles.push(
        mk(plant.row, {
          x: rect.x + rect.w * 0.3,
          speed: -220,
          color: "#9dff7a",
        })
      );
    }
  }

  function updatePlants(dt) {
    state.plants.forEach((plant) => {
      const type = COMBAT[plant.typeId];
      if (!type || plant.dead) return;
      plant.cd -= dt;
      if (!plant.armed) {
        plant.cd -= dt;
        if (plant.cd <= 0) {
          plant.armed = true;
          addFx("✓", cellRect(plant.row, plant.col).x + 30, cellRect(plant.row, plant.col).y + 20, "#c6ff9a");
        }
      }

      if (type.role === "sun" && type.generateSun) {
        plant.sunCd -= dt;
        if (plant.sunCd <= 0) {
          plant.sunCd = type.sunEvery;
          const rect = cellRect(plant.row, plant.col);
          state.suns.push({
            x: rect.x + 30 + Math.random() * 20,
            y: rect.y + 20,
            value: type.generateSun,
            life: 8,
          });
        }
      }

      if (type.role === "spike" || type.ground) {
        const rect = cellRect(plant.row, plant.col);
        state.zombies.forEach((z) => {
          if (z.dead || z.row !== plant.row) return;
          if (z.x > rect.x && z.x < rect.x + rect.w) z.hp -= type.damage * dt;
        });
      }

      if (type.role === "mine" && plant.armed) {
        const rect = cellRect(plant.row, plant.col);
        const victim = state.zombies.find(
          (z) => !z.dead && z.row === plant.row && z.x > rect.x && z.x < rect.x + rect.w
        );
        if (victim) {
          explodeAt(plant.row, plant.col, 1, type.damage);
          plant.dead = true;
        }
      }

      if (type.role === "trap") {
        const rect = cellRect(plant.row, plant.col);
        const victim = state.zombies.find(
          (z) => !z.dead && z.row === plant.row && z.x > rect.x && z.x < rect.x + rect.w
        );
        if (victim) {
          victim.hp = 0;
          plant.dead = true;
          addFx("🌊", rect.x + 30, rect.y + 30, "#7ecbff");
        }
      }

      const canShoot = ["shooter", "lobber", "breath", "melee", "fume", "electric"].includes(type.role);
      if (canShoot && plant.cd <= 0) {
        const hasTarget = state.zombies.some(
          (z) =>
            !z.dead &&
            (type.role === "breath"
              ? Math.abs(z.row - plant.row) <= 1
              : type.id.includes("threepeater")
                ? Math.abs(z.row - plant.row) <= 1
                : z.row === plant.row) &&
            z.x >= cellRect(plant.row, plant.col).x
        );
        if (hasTarget || type.role === "melee") {
          shootFrom(plant, type);
          plant.cd = type.shootEvery;
        }
      }
    });
    state.plants = state.plants.filter((p) => !p.dead && p.hp > 0);
  }

  function updateZombies(dt) {
    state.zombies.forEach((z) => {
      if (z.dead) return;

      if (z.dyingAllergy > 0) {
        z.dyingAllergy -= dt;
        z.allergyFlash = 1;
        if (z.dyingAllergy <= 0) {
          z.dead = true;
          state.fallen += 1;
        }
        return;
      }

      if (z.burn > 0) {
        z.burn -= dt;
        z.hp -= 12 * dt;
      }
      if (z.poison > 0) {
        z.poison -= dt;
        z.hp -= 28 * dt;
      }
      if (z.slow > 0) z.slow -= dt;
      if (z.allergyFlash > 0) z.allergyFlash -= dt;
      z.walkPhase += dt * (z.kind === "runner" ? 10 : 6);

      const speedMul = z.slow > 0 ? 0.45 : 1;
      const plant = state.plants
        .filter((p) => !p.dead && p.row === z.row && !COMBAT[p.typeId]?.ground)
        .find((p) => {
          const rect = cellRect(p.row, p.col);
          return z.x <= rect.x + rect.w * 0.75 && z.x >= rect.x - 8;
        });

      if (plant) {
        const type = COMBAT[plant.typeId];
        z.eating = true;
        z.biteCd -= dt;
        if (z.biteCd <= 0) {
          z.biteCd = 1;
          const nutFx = type?.nut ? plant.nutEffect || "normal" : null;

          // Хозяин настроил орех на «смерть» — любой зомби умирает от укуса
          if (nutFx === "kill") {
            z.dyingAllergy = 0.9;
            z.allergyFlash = 1;
            z.eating = false;
            addFx("СМЕРТЬ!", cellRect(plant.row, plant.col).x, cellRect(plant.row, plant.col).y, "#ff8866");
            addFx("🥜💀", z.x - 8, cellRect(z.row, 0).y + 20, "#ffe7a8");
            showToast("Орех хозяина: зомби умер!");
            return;
          }

          // Хозяин настроил орех на «яд»
          if (nutFx === "poison") {
            z.poison = Math.max(z.poison || 0, 4.5);
            z.allergyFlash = 0.4;
            addFx("ЯД", z.x - 4, cellRect(z.row, 0).y + 18, "#c08cff");
          }

          // Случайная аллергия — на орехи и другие типы растений
          if (z.allergyType && plantTriggersAllergy(type, z.allergyType) && nutFx !== "poison") {
            triggerAllergyDeath(z, type.name);
            return;
          }

          plant.hp -= z.damage;
          AudioFX.bite();
          if (plant.hp <= 0) plant.dead = true;
        }
      } else {
        z.eating = false;
        z.x -= z.speed * speedMul * dt;
      }

      if (z.x < LEFT - 20) {
        if (state.shieldLeft > 0) {
          z.x = LEFT - 10;
          z.slow = Math.max(z.slow || 0, 0.8);
        } else {
        const mower = state.mowers[z.row];
        if (mower && !mower.gone && (!mower.used || state.test) && !mower.active) {
          if (!state.test) mower.used = true;
          mower.active = true;
          mower.x = 34;
          AudioFX.mower();
          showToast(
            state.test
              ? `∞ Косилка снова спасла ряд ${z.row + 1}`
              : `Косилка спасла ряд ${z.row + 1}`
          );
        } else if (!mower || mower.gone || (mower.used && !mower.active && !state.test)) {
          endGame(false, "Зомби прорвались. Косилки больше нет.");
        }
        }
      }
      if (z.hp <= 0 && z.dyingAllergy <= 0) {
        z.dead = true;
        state.fallen += 1;
        if (Math.random() < 0.18) {
          state.suns.push({ x: z.x, y: cellRect(z.row, 0).y + 30, value: 25, life: 7 });
        }
      }
    });
    state.zombies = state.zombies.filter((z) => !z.dead);
  }

  function updateProjectiles(dt) {
    state.projectiles.forEach((pr) => {
      pr.x += pr.speed * dt;
      for (const z of state.zombies) {
        if (z.dead || z.row !== pr.row || pr.hit.has(z.id)) continue;
        if (Math.abs(z.x - pr.x) < 28) {
          const src = pr.plantTypeId ? COMBAT[pr.plantTypeId] : null;
          if (z.allergyType && src && plantTriggersAllergy(src, z.allergyType)) {
            triggerAllergyDeath(z, src.name);
            pr.hit.add(z.id);
            pr.pierce -= 1;
            if (pr.pierce <= 0) pr.dead = true;
            break;
          }
          z.hp -= pr.damage;
          if (pr.slow) z.slow = Math.max(z.slow, pr.slow * 5);
          if (pr.burn) z.burn = Math.max(z.burn, 2.2);
          pr.hit.add(z.id);
          pr.pierce -= 1;
          AudioFX.hit();
          if (pr.chain > 0) {
            const next = state.zombies.find(
              (o) => !o.dead && o.row === z.row && o.x > z.x && !pr.hit.has(o.id)
            );
            if (next) {
              if (next.allergyType && src && plantTriggersAllergy(src, next.allergyType)) {
                triggerAllergyDeath(next, src.name);
              } else {
                next.hp -= pr.damage * 0.7;
              }
              pr.hit.add(next.id);
            }
            pr.chain -= 1;
          }
          if (pr.pierce <= 0) pr.dead = true;
          break;
        }
      }
      if (pr.speed >= 0 && pr.x > LEFT + COLS * CELL_W + 40) pr.dead = true;
      if (pr.speed < 0 && pr.x < LEFT - 40) pr.dead = true;
    });
    state.projectiles = state.projectiles.filter((p) => !p.dead);
  }

  function updateSuns(dt) {
    state.suns.forEach((s) => {
      s.life -= dt;
      s.y += 8 * dt;
    });
    state.suns = state.suns.filter((s) => s.life > 0);
  }

  function updateWaves(dt) {
    Object.keys(state.cooldown).forEach((id) => {
      state.cooldown[id] = Math.max(0, state.cooldown[id] - dt);
    });
    if (amalOwner() && state.ownerNoReload) {
      Object.keys(state.cooldown).forEach((id) => {
        state.cooldown[id] = 0;
      });
    }

    if (state.zombiesLeft > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnZombie();
        state.zombiesLeft -= 1;
        state.spawnTimer = Math.max(0.8, 2.4 - state.wave * 0.15);
      }
    } else if (state.zombies.length === 0) {
      state.waveTimer += dt;
      if (state.waveTimer > 1.6) {
        state.waveTimer = 0;
        if (state.wave >= MAX_WAVES) {
          endGame(true, `Победа! Побеждено зомби: ${state.fallen}`);
          return;
        }
        state.wave += 1;
        state.zombiesLeft = 5 + state.wave * 2;
        showToast(`Волна ${state.wave}!`);
        AudioFX.wave();
        updateHud();
      }
    }

    // passive sky sun
    state._sky = (state._sky || 0) + dt;
    if (state._sky > 9) {
      state._sky = 0;
      state.suns.push({
        x: LEFT + 40 + Math.random() * (COLS * CELL_W - 80),
        y: 10,
        value: 25,
        life: 9,
        falling: true,
      });
    }
  }

  function updateMowers(dt) {
    state.mowers.forEach((m) => {
      if (!m.active) return;
      m.x += m.speed * dt;
      state.zombies.forEach((z) => {
        if (z.dead || z.row !== m.row) return;
        if (Math.abs(z.x - m.x) < 36) {
          z.hp = 0;
          z.dead = true;
          z.dyingAllergy = 0;
          state.fallen += 1;
        }
      });
      if (m.x > LEFT + COLS * CELL_W + 50) {
        m.active = false;
        if (state.test) {
          m.used = false;
          m.gone = false;
          m.x = 34;
        } else {
          m.gone = true;
        }
      }
    });
  }

  function updateFx(dt) {
    state.fx.forEach((f) => {
      f.life -= dt;
      f.y -= 18 * dt;
    });
    state.fx = state.fx.filter((f) => f.life > 0);
  }

  function drawLawnmower(m) {
    if (m.gone && !m.active) return;
    if (m.used && !m.active && !state.test) return;

    ctx.save();
    ctx.translate(m.x, m.y);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // body — газонокосилка, не трактор
    ctx.fillStyle = m.active ? "#e8f0f5" : "#c5d0d8";
    ctx.fillRect(-20, -8, 40, 16);
    ctx.fillStyle = "#3d7eb8";
    ctx.fillRect(-16, -14, 24, 8);
    ctx.fillStyle = "#2a5f8f";
    ctx.fillRect(6, -18, 6, 10);

    // blade housing
    ctx.fillStyle = "#6a7278";
    ctx.beginPath();
    ctx.ellipse(0, 6, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // wheels
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-12, 10, 6, 0, Math.PI * 2);
    ctx.arc(12, 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#999";
    ctx.beginPath();
    ctx.arc(-12, 10, 2.5, 0, Math.PI * 2);
    ctx.arc(12, 10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (m.active) {
      ctx.strokeStyle = "#ffe566";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = state.time * 22 + i * 2.1;
        ctx.beginPath();
        ctx.moveTo(18, Math.sin(a) * 5);
        ctx.lineTo(30, Math.sin(a + 1) * 9);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function draw() {
    const w = els.canvas.width;
    const h = els.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // lawn
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const rect = cellRect(r, c);
        ctx.fillStyle = (r + c) % 2 === 0 ? "#4f9a3c" : "#3f8532";
        ctx.fillRect(rect.x, rect.y, rect.w - 2, rect.h - 2);
      }
    }

    // house strip
    ctx.fillStyle = "#6b4a2e";
    ctx.fillRect(0, TOP, LEFT - 8, ROWS * CELL_H);
    ctx.fillStyle = "#f0e2c0";
    ctx.font = "800 12px Nunito";
    ctx.fillText("ДОМ", 16, TOP + ROWS * CELL_H * 0.5);

    state.mowers.forEach((m) => drawLawnmower(m));

    state.plants.forEach((p) => {
      const type = COMBAT[p.typeId];
      const rect = cellRect(p.row, p.col);
      drawPlantSprite(p, type, rect);
      if (type.nut) {
        const fx = NUT_EFFECTS[p.nutEffect || "normal"] || NUT_EFFECTS.normal;
        ctx.font = "800 10px Nunito";
        ctx.fillStyle =
          p.nutEffect === "poison" ? "#d9b3ff" : p.nutEffect === "kill" ? "#ff9a8a" : "#ffe7a8";
        ctx.fillText(fx.short, rect.x + 18, rect.y + 78);
      }
      const pct = Math.max(0, p.hp / p.maxHp);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(rect.x + 10, rect.y + 8, rect.w - 24, 5);
      ctx.fillStyle = pct > 0.35 ? "#8fd35a" : "#e85a3a";
      ctx.fillRect(rect.x + 10, rect.y + 8, (rect.w - 24) * pct, 5);
      if (!p.armed) {
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.fillRect(rect.x + 18, rect.y + 40, 50, 12);
        ctx.fillStyle = "#fff";
        ctx.font = "800 10px Nunito";
        ctx.fillText("заряд…", rect.x + 22, rect.y + 50);
      }
    });

    state.zombies.forEach((z) => drawAnimatedZombie(z));

    state.projectiles.forEach((pr) => {
      ctx.beginPath();
      ctx.fillStyle = pr.color;
      ctx.arc(pr.x, pr.y, pr.lob ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
    });

    state.suns.forEach((s) => {
      ctx.font = "28px sans-serif";
      ctx.fillText("☀️", s.x, s.y + 20);
    });

    state.fx.forEach((f) => {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = "800 16px Nunito";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });
  }

  function frame(ts) {
    if (!state.running) return;
    const rawDt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    if (state.paused) {
      draw();
      // баннер паузы
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
      ctx.fillStyle = "#ffe7a8";
      ctx.font = "900 36px Rubik Dirt, Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ПАУЗА", els.canvas.width / 2, els.canvas.height / 2);
      ctx.textAlign = "start";
      animId = requestAnimationFrame(frame);
      return;
    }

    if (state.freezeOn && amalOwner()) {
      state.timeScale = 0;
    } else if (state.slowmoOn) {
      state.timeScale = 0.35;
    } else {
      state.timeScale = 1;
    }
    if (state.shieldLeft > 0) {
      state.shieldLeft -= rawDt;
      if (state.shieldLeft <= 0) {
        state.shieldLeft = 0;
        showToast("Щит дома закончился");
      }
    }
    Object.keys(state.abilityCd).forEach((id) => {
      state.abilityCd[id] = Math.max(0, (state.abilityCd[id] || 0) - rawDt);
    });

    const dt = rawDt * state.timeScale;
    state.time += dt;
    // при полном стопе (хозяин) логика не тикает, только рисуем
    if (state.timeScale > 0) {
      updateWaves(dt);
      if (!state.running) return;
      updatePlants(dt);
      updateZombies(dt);
      updateMowers(dt);
      updateProjectiles(dt);
      updateSuns(dt);
      updateFx(dt);
    }
    if (Math.floor(ts / 250) !== Math.floor((ts - rawDt * 1000) / 250)) {
      renderSeedBar();
      renderAbilityBar();
    }
    updateHud();
    draw();
    if (state.shieldLeft > 0) {
      ctx.fillStyle = "rgba(120, 200, 255, 0.18)";
      ctx.fillRect(0, TOP, LEFT - 4, ROWS * CELL_H);
      ctx.strokeStyle = "rgba(180, 230, 255, 0.7)";
      ctx.lineWidth = 3;
      ctx.strokeRect(2, TOP + 2, LEFT - 10, ROWS * CELL_H - 4);
    }
    if (state.freezeOn) {
      ctx.fillStyle = "rgba(140, 200, 255, 0.16)";
      ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
      ctx.fillStyle = "#c8e8ff";
      ctx.font = "900 28px Rubik Dirt, Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ВРЕМЯ СТОИТ", els.canvas.width / 2, 28);
      ctx.textAlign = "start";
    } else if (state.slowmoOn) {
      ctx.fillStyle = "rgba(180, 220, 255, 0.08)";
      ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
    }
    animId = requestAnimationFrame(frame);
  }

  // Almanac
  function renderFilters() {
    els.typeFilters.innerHTML = "";
    typesMeta.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "type-btn" + (t.id === activeType ? " active" : "");
      const count =
        t.id === "all"
          ? plantsCatalog.length
          : plantsCatalog.filter((p) => (p.types || []).includes(t.id)).length;
      btn.textContent = `${t.icon} ${t.name} (${count})`;
      btn.addEventListener("click", () => {
        activeType = t.id;
        renderFilters();
        renderAlmanacGrid();
      });
      els.typeFilters.appendChild(btn);
    });
  }

  function renderAlmanacGrid() {
    const q = (els.plantSearch.value || "").trim().toLowerCase();
    const list = plantsCatalog.filter((p) => {
      if (activeType !== "all" && !(p.types || []).includes(activeType)) return false;
      if (!q) return true;
      return `${p.name} ${p.en} ${p.worldRu} ${(p.types || []).join(" ")}`
        .toLowerCase()
        .includes(q);
    });
    els.almanacSub.textContent = `Показано ${list.length} из ${plantsCatalog.length}`;
    els.plantGrid.innerHTML = "";
    if (!list.length) {
      els.plantGrid.innerHTML = `<div class="empty">Ничего не найдено</div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((p) => {
      const card = document.createElement("article");
      card.className = "plant-card";
      const tags = (p.types || [])
        .map((t) => `<span class="tag ${t}">${typeName[t] || t}</span>`)
        .join("");
      card.innerHTML = `
        <div class="emoji">${p.icon || "🌱"}</div>
        <h3>${p.name}</h3>
        <div class="en">${p.en}</div>
        <div class="meta">☀️ ${parseSun(p.sun)} · ⏱ ${p.recharge}с · ${p.worldRu}</div>
        <div class="tags">${tags}</div>
      `;
      card.addEventListener("click", () => showToast(`${p.name}: ${(p.types || []).map((t) => typeName[t] || t).join(", ")}`));
      frag.appendChild(card);
    });
    els.plantGrid.appendChild(frag);
  }

  // Events
  document.getElementById("btnPlay").addEventListener("click", () => {
    AudioFX.unlock();
    AudioFX.click();
    startGame();
  });
  document.getElementById("btnAlmanac").addEventListener("click", () => {
    AudioFX.unlock();
    AudioFX.click();
    showScreen("almanac");
    renderFilters();
    renderAlmanacGrid();
  });
  document.getElementById("btnBackMenu").addEventListener("click", showMenu);
  document.getElementById("btnAgain").addEventListener("click", () => {
    AudioFX.unlock();
    startGame();
  });
  document.getElementById("btnEndMenu").addEventListener("click", showMenu);
  document.getElementById("btnQuit").addEventListener("click", showMenu);
  document.getElementById("btnPause")?.addEventListener("click", togglePause);
  document.getElementById("btnFreeze")?.addEventListener("click", toggleFreeze);
  document.getElementById("btnMute")?.addEventListener("click", toggleMute);
  document.getElementById("btnMuteMenu")?.addEventListener("click", toggleMute);
  document.getElementById("btnPromo")?.addEventListener("click", tryRedeemPromo);
  document.getElementById("promoInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryRedeemPromo();
  });
  window.addEventListener("keydown", (e) => {
    if (!state.running) return;
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      e.preventDefault();
      togglePause();
      return;
    }
    if (state.paused) return;
    const abs = promoAbilityDefs();
    const idx = Number(e.key) - 1;
    if (idx >= 0 && idx < abs.length) {
      e.preventDefault();
      useAbility(abs[idx].id);
    }
  });
  document.getElementById("btnShovel").addEventListener("click", () => {
    shovel = !shovel;
    if (shovel) {
      nutTool = false;
      zombieTool = null;
    }
    syncNutOwnerUi();
    showToast(shovel ? "Лопата включена" : "Лопата выключена");
  });
  document.getElementById("btnNutTool")?.addEventListener("click", () => {
    if (!amalOwner()) {
      showToast("Выбор эффекта ореха только у хозяина");
      return;
    }
    nutTool = !nutTool;
    if (nutTool) {
      shovel = false;
      zombieTool = null;
    }
    syncNutOwnerUi();
    showToast(
      nutTool
        ? "Режим ореха: кликни по ореху на поле, чтобы дать ему эффект"
        : "Режим ореха выключен"
    );
  });
  document.querySelectorAll(".nut-mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!amalOwner()) {
        showToast("Только хозяин выбирает эффект ореха");
        return;
      }
      setNutEffect(btn.getAttribute("data-nut"));
    });
  });
  document.querySelectorAll(".z-tool").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!amalOwner()) {
        showToast("Только хозяин");
        return;
      }
      const id = btn.getAttribute("data-ztool");
      if (id === "noreload") {
        state.ownerNoReload = !state.ownerNoReload;
        if (state.ownerNoReload) {
          Object.keys(state.cooldown).forEach((k) => {
            state.cooldown[k] = 0;
          });
          renderSeedBar();
          showToast("⏳ Без перезарядки: можно сажать снова сразу");
        } else {
          showToast("Перезарядка снова обычная");
        }
        syncZombieOwnerUi();
        return;
      }
      zombieTool = zombieTool === id ? null : id;
      if (zombieTool) {
        shovel = false;
        nutTool = false;
      }
      syncNutOwnerUi();
      if (zombieTool === "kill") showToast("☠ Кликни по зомби, чтобы убить его");
      else if (zombieTool === "cure") showToast("💉 Кликни по зомби, чтобы снять аллергию");
      else if (zombieTool === "spawn") showToast("＋ Зомби: клик у ДОМА слева · Орех/растение: клик по грядке");
      else showToast("Инструмент зомби выключен");
    });
  });
  els.plantSearch.addEventListener("input", renderAlmanacGrid);

  els.canvas.addEventListener("click", (e) => {
    if (!state.running) return;
    if (state.paused) {
      togglePause();
      return;
    }
    AudioFX.unlock();
    if (!AudioFX.musicTimer && !AudioFX.muted) AudioFX.startMusic();
    const rect = els.canvas.getBoundingClientRect();
    const sx = els.canvas.width / rect.width;
    const sy = els.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    const sun = state.suns.find((s) => Math.hypot(s.x + 10 - x, s.y + 10 - y) < 40);
    if (sun) {
      state.sun += sun.value;
      sun.life = 0;
      AudioFX.sun();
      updateHud();
      return;
    }

    if (amalOwner() && (zombieTool === "kill" || zombieTool === "cure")) {
      const z = findZombieNear(x, y);
      if (!z) {
        showToast(zombieTool === "kill" ? "Кликни по зомби" : "Кликни по зомби с аллергией");
        return;
      }
      if (zombieTool === "kill") killZombieOwner(z);
      else cureZombieAllergy(z);
      return;
    }

    // Спавн зомби только у дома слева — по грядке можно сажать орехи и растения
    if (amalOwner() && zombieTool === "spawn" && x < LEFT) {
      const row = Math.floor((y - TOP) / CELL_H);
      if (row >= 0 && row < ROWS) {
        state.spawnRow = row;
        syncZombieOwnerUi();
        spawnZombieOwner(row);
      } else {
        showToast("Кликни у дома слева, в нужном ряду");
      }
      return;
    }

    const cell = canvasToCell(e.clientX, e.clientY);
    if (!cell) {
      if (amalOwner() && zombieTool === "spawn") {
        showToast("Зомби: клик у ДОМА слева · Растение: выбери семя и кликни по грядке");
      }
      return;
    }
    if (shovel) {
      tryShovel(cell.row, cell.col);
      return;
    }
    if (nutTool && amalOwner()) {
      const p = plantAt(cell.row, cell.col);
      if (p) applyNutEffectToPlant(p);
      else showToast("Кликни по ореху на поле");
      return;
    }
    // Если режим спавна включён, но клик по грядке — сажаем растение (и выходим из спавна)
    if (zombieTool === "spawn") {
      zombieTool = null;
      syncZombieOwnerUi();
    }
    const player2 = state.mode === "coop" && e.shiftKey;
    const typeId = player2 ? state.selectedP2 : state.selectedP1;
    placePlant(typeId, cell.row, cell.col, player2 ? "Игрок 2" : "Игрок 1");
  });

  if (els.plantCount) {
    els.plantCount.textContent = `Растений в альманахе: ${plantsCatalog.length}`;
  }
  buildZombieOwnerPickers();
  syncNutOwnerUi();
  syncMuteButtons();
  refreshPromoUi();
  syncFreezeButton();
  refreshSurpriseJournal();
  renderFilters();

  window.addEventListener("amal-surprise", (e) => {
    const d = e.detail || {};
    if (d.type === "little" && d.pick) applyLittleSurprise(d.pick.id);
    if (d.type === "owner-secret") applyOwnerSecretSurprise();
    refreshSurpriseJournal();
  });

  window.addEventListener("amal-power", (e) => {
    if (!amalOwner()) return;
    const t = e.detail && e.detail.type;
    if (!t) return;
    if (t === "zvp2-kill" || t === "max") {
      state.zombies.forEach((z) => {
        z.hp = 0;
        z.dead = true;
      });
      state.zombies = [];
      showToast("☠ Все зомби убиты (только ты)");
    }
    if (t === "zvp2-kill-one") {
      zombieTool = "kill";
      shovel = false;
      nutTool = false;
      syncNutOwnerUi();
      showToast("☠ Кликни по зомби на поле");
    }
    if (t === "zvp2-spawn") {
      spawnZombieOwner();
    }
    if (t === "zvp2-spawn-pick") {
      zombieTool = "spawn";
      shovel = false;
      nutTool = false;
      syncNutOwnerUi();
      showToast("＋ Выбери тип и кликни по ряду");
    }
    if (t === "zvp2-cure") {
      zombieTool = "cure";
      shovel = false;
      nutTool = false;
      syncNutOwnerUi();
      showToast("💉 Кликни по зомби, чтобы снять аллергию");
    }
    if (t === "zvp2-cure-all") {
      let n = 0;
      state.zombies.forEach((z) => {
        if (z.allergyType) {
          z.allergyType = null;
          z.nutAllergy = false;
          z.name = (ZOMBIE_KINDS[z.kind]?.name || z.name).replace(/\s*\(.*\)$/, "");
          n += 1;
        }
      });
      showToast(n ? `💉 Снята аллергия у ${n} зомби` : "Аллергичных зомби нет");
    }
    if (t === "zvp2-noreload" || t === "max") {
      state.ownerNoReload = true;
      Object.keys(state.cooldown).forEach((id) => {
        state.cooldown[id] = 0;
      });
      showToast("⏳ Без перезарядки (только ты)");
      renderSeedBar();
      syncZombieOwnerUi();
    }
    if (t === "zvp2-nut-normal") setNutEffect("normal");
    if (t === "zvp2-nut-poison") setNutEffect("poison");
    if (t === "zvp2-nut-kill") setNutEffect("kill");
    if (t === "zvp2-freeze") toggleFreeze();
    if (t === "owner-legend") {
      state.test = true;
      state.sun = 99999;
      state.ownerNoReload = true;
      updateHud();
      syncZombieOwnerUi();
      syncFreezeButton();
      showToast("👑 Легенда: ∞ солнце · без перезарядки");
    }
    if (t === "abuse-gift") {
      state.sun += 250;
      state.zombies.forEach((z) => {
        if (!z.dead) z.slow = Math.max(z.slow || 0, 3);
      });
      for (let i = 0; i < 6; i++) {
        state.suns.push({
          x: LEFT + 30 + Math.random() * (COLS * CELL_W - 60),
          y: 10 + Math.random() * 40,
          value: 50,
          life: 10,
          falling: true,
        });
      }
      updateHud();
      showToast("🎁 Admin Abuse: солнце и замедление зомби!");
    }
    if (t === "max") {
      state.test = true;
      state.sun = 99999;
      state.ownerNoReload = true;
      updateHud();
      syncZombieOwnerUi();
      syncFreezeButton();
      renderAbilityBar();
    }
  });

  window.addEventListener("amal-owner-changed", () => {
    syncNutOwnerUi();
    buildZombieOwnerPickers();
    refreshPromoUi();
    syncFreezeButton();
    refreshSurpriseJournal();
    renderAbilityBar();
  });
})();
