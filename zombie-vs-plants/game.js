(() => {
  "use strict";

  const COLS = 9;
  const ROWS = 5;
  const CELL_W = 80;
  const CELL_H = 90;
  const LEFT = 90;
  const TOP = 30;

  /* ========== ЗВУК (Web Audio API) ========== */
  function amalGod() {
    try {
      if (window.__AMAL_GOD__ || window.__AMAL_OWNER__) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      if (new URLSearchParams(location.search).get("owner")) return true;
      if (window.AmalPowers && AmalPowers.god && AmalPowers.god()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      if (window.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner()) return true;
    } catch (_) {}
    return false;
  }

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
    giftbox: {
      id: "giftbox",
      name: "Подарок",
      icon: "🎁",
      cost: 100,
      hp: 250,
      unlock: 1,
      damage: 400,
      shootEvery: 2,
      giftPlant: true,
      giftGrowTime: 4,
    },
    lara: {
      id: "lara",
      name: "Лара",
      icon: "🌺🔥",
      cost: 150,
      hp: 350,
      unlock: 1,
      cherryAbsorber: true,
      absorbSun: 100,
    },
    cherryshooter: {
      id: "cherryshooter",
      name: "Вишнёвый бомбардир",
      icon: "🌟🍒",
      cost: 9999,
      hp: 300,
      unlock: 99,
      damage: 10,
      splash: 10,
      shootEvery: 1.4,
      cherryBombShooter: true,
      starBarrage: true,
      peaColor: "#ed2945",
      hybridTier: 2,
    },
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
      fusesInto: "repeater",
    },
    repeater: {
      id: "repeater",
      name: "Двойной горохострел",
      icon: "🌿🌱",
      cost: 200,
      hp: 200,
      unlock: 99,
      damage: 20,
      shootEvery: 1.4,
      doubleShot: true,
      peaColor: "#79cf3d",
    },
    threepeater: {
      id: "threepeater",
      name: "Тройной горохострел",
      icon: "🌱🌱🌱",
      cost: 275,
      hp: 300,
      unlock: 14,
      damage: 20,
      shootEvery: 1.4,
      threeLanePea: true,
      peaColor: "#8fd94f",
    },
    ultimatesakurashooter: {
      id: "ultimatesakurashooter",
      name: "Ultimate Sakura Shooter",
      icon: "🌸⚔️",
      cost: 9999,
      hp: 1200,
      unlock: 99,
      damage: 900,
      shootEvery: 2,
      sakuraShooter: true,
      sakuraShots: 4,
      screenFlames: true,
      cherryImmune: true,
      blastDamage: 500,
      peaColor: "#ff3a4a",
      hybridTier: 4,
    },
    gatlingturret: {
      id: "gatlingturret",
      name: "Гороховая турель Гатлинга",
      icon: "🌿🔫",
      cost: 9999,
      hp: 1000,
      unlock: 99,
      damage: 20,
      shootEvery: 0.5,
      gatlingTurret: true,
      peaColor: "#72cf37",
      hybridTier: 4,
    },
    calamityturret: {
      id: "calamityturret",
      name: "Турель Катаклизма",
      icon: "☠️🔫",
      cost: 9999,
      hp: 6000,
      unlock: 99,
      damage: 200,
      bonusVsGiant: 300,
      shootEvery: 0.4,
      calamityTurret: true,
      pierceCount: 3,
      curseChance: 0.005,
      ultraChance: 0.0001,
      durabilityDrain: 50,
      durabilityFloor: 1500,
      resistBelow: 1250,
      resistFactor: 0.25,
      peaColor: "#ff3a4a",
      hybridTier: 5,
    },
    jicamagicker: {
      id: "jicamagicker",
      name: "Хикамовый скрещиватель",
      icon: "🎩🥔",
      cost: 50,
      hp: 100,
      unlock: 1,
      recharge: 30,
      titanCatalyst: true,
    },
    snappea: {
      id: "snappea",
      name: "Гороховая хватка",
      icon: "🫛",
      cost: 200,
      hp: 300,
      unlock: 10,
      damage: 30,
      shootEvery: 10,
      snapPea: true,
      chewTime: 20,
      headDamage: 400,
      peaColor: "#8fd94f",
    },
    giantchomper: {
      id: "giantchomper",
      name: "Гигантский чомпер",
      icon: "🦷🟣",
      cost: 9999,
      hp: 1000,
      unlock: 99,
      snapPea: true,
      giantChomper: true,
      chewRange: 90,
      hybridTier: 4,
    },
    chomper: {
      id: "chomper",
      name: "Чомпер",
      icon: "🟣🦷",
      cost: 150,
      hp: 300,
      unlock: 6,
      damage: 40,
      shootEvery: 2,
      snapPea: true,
      chewTime: 25,
      headDamage: 300,
      peaColor: "#a75ac0",
    },
    cherrychomper: {
      id: "cherrychomper",
      name: "Вишнёвый чомпер",
      icon: "🍒🦷",
      cost: 9999,
      hp: 500,
      unlock: 99,
      damage: 60,
      shootEvery: 1.8,
      snapPea: true,
      chewTime: 40,
      headDamage: 400,
      biteBlast: 1800,
      biteBlastCells: 1.5,
      fusionBlast: 1800,
      peaColor: "#e0304f",
      hybridTier: 2,
    },
    nutchomper: {
      id: "nutchomper",
      name: "Ореховый чомпер",
      icon: "🥜🦷",
      cost: 9999,
      hp: 4000,
      unlock: 99,
      damage: 45,
      shootEvery: 2,
      snapPea: true,
      chewTime: 40,
      headDamage: 350,
      swallowHeal: 1000,
      peaColor: "#c9a262",
      hybridTier: 2,
    },
    sunchomper: {
      id: "sunchomper",
      name: "Солнечный чомпер",
      icon: "🌞🦷",
      cost: 9999,
      hp: 400,
      unlock: 99,
      damage: 50,
      shootEvery: 2,
      snapPea: true,
      chewTime: 40,
      headDamage: 350,
      swallowSun: 100,
      peaColor: "#ffd84d",
      hybridTier: 2,
    },
    chompshooter: {
      id: "chompshooter",
      name: "Чомп-стрелок",
      icon: "🌱🦷",
      cost: 9999,
      hp: 400,
      unlock: 99,
      damage: 50,
      shootEvery: 2,
      snapPea: true,
      chewTime: 30,
      headDamage: 350,
      spitWhileChewing: true,
      spitEvery: 3,
      spitDamage: 80,
      peaColor: "#8fd94f",
      hybridTier: 2,
    },
    chewzilla: {
      id: "chewzilla",
      name: "Жуйзилла",
      icon: "🦖🦷",
      cost: 9999,
      hp: 4000,
      unlock: 99,
      damage: 200,
      shootEvery: 1.2,
      snapPea: true,
      chewBite: true,
      chewBiteDamage: 200,
      chewBiteHeal: 200,
      spitWhileChewing: true,
      spitEvery: 2.5,
      spitDamage: 80,
      spitPierce: true,
      devourEvery: 40,
      devourHeal: 4000,
      overhealCap: 16000,
      overhealDrain: 200,
      damageCapRatio: 0.33,
      peaColor: "#6d35a8",
      hybridTier: 3,
    },
    cherrizilla: {
      id: "cherrizilla",
      name: "Черризилла",
      icon: "🍒🦖",
      cost: 9999,
      hp: 6000,
      unlock: 99,
      damage: 300,
      shootEvery: 1,
      snapPea: true,
      chewBite: true,
      chewBiteDamage: 300,
      chewBiteHeal: 300,
      spitWhileChewing: true,
      spitEvery: 2,
      spitDamage: 120,
      spitPierce: true,
      devourEvery: 30,
      devourHeal: 6000,
      overhealCap: 24000,
      overhealDrain: 250,
      damageCapRatio: 0.33,
      biteBlast: 1800,
      biteBlastCells: 1.5,
      peaColor: "#ff2a4a",
      hybridTier: 4,
    },
    chompermix: {
      id: "chompermix",
      name: "Чомпер-микс",
      icon: "🍒🥜🦷",
      cost: 9999,
      hp: 3200,
      unlock: 99,
      snapPea: true,
      giantChomper: true,
      chewRange: 100,
      chewFactor: 0.6,
      biteBlast: 900,
      biteBlastCells: 1.2,
      hybridTier: 3,
    },
    chompermess: {
      id: "chompermess",
      name: "Чомперовая мешанина",
      icon: "🌀🦷🦷",
      cost: 9999,
      hp: 5000,
      unlock: 99,
      snapPea: true,
      giantChomper: true,
      chewRange: 150,
      chewFactor: 0.35,
      biteBlast: 1500,
      biteBlastCells: 2,
      threeRowBite: true,
      hybridTier: 4,
    },
    shadowpea: {
      id: "shadowpea",
      name: "Теневой горохострел",
      icon: "🌑",
      cost: 125,
      hp: 300,
      unlock: 12,
      damage: 30,
      shootEvery: 1.4,
      shadowPea: true,
      pulls: 2,
      peaColor: "#7b3fc6",
    },
    dragonbruit: {
      id: "dragonbruit",
      name: "Дракон осеменитель",
      icon: "🐉",
      cost: 200,
      hp: 400,
      unlock: 14,
      damage: 100,
      splash: 40,
      shootEvery: 2.2,
      dragonBruit: true,
      threeLane: true,
      spawnBabiesOnDeath: true,
      peaColor: "#d94f9a",
    },
    babybruit: {
      id: "babybruit",
      name: "Детёныш дракона",
      icon: "🐲",
      cost: 9999,
      hp: 180,
      unlock: 99,
      damage: 70,
      splash: 20,
      shootEvery: 2.5,
      dragonBruit: true,
      threeLane: false,
      peaColor: "#e06ab0",
    },
    cornfetti: {
      id: "cornfetti",
      name: "Кукурузная хлопушка",
      icon: "🌽",
      cost: 175,
      hp: 225,
      unlock: 16,
      damage: 50,
      shootEvery: 2.9,
      piercing: true,
      cornShot: true,
      knockbackChance: 0.4,
      knockbackRange: CELL_W * 2,
      peaColor: "#f0c840",
    },
    laserbean: {
      id: "laserbean",
      name: "Лазерный боб",
      icon: "🫘💫",
      cost: 200,
      hp: 300,
      unlock: 18,
      damage: 40,
      shootEvery: 3,
      laserBean: true,
      piercing: true,
      peaColor: "#4ad4ff",
    },
    magiccatgirl: {
      id: "magiccatgirl",
      name: "Волшебная Кошкодевочка",
      icon: "🐱🪄",
      cost: 125,
      hp: 300,
      unlock: 18,
      recharge: 50,
      damage: 40,
      shootEvery: 1.5,
      magicCatgirl: true,
      waterWalking: true,
      homingDouble: true,
      peaColor: "#ff9fe4",
    },
    triplecatgirl: {
      id: "triplecatgirl",
      name: "Три на четыре",
      icon: "🐱🐱🐱🔥",
      cost: 9999,
      hp: 500,
      unlock: 99,
      damage: 90,
      shootEvery: 2,
      tripleCatgirl: true,
      waterWalking: true,
      breathCols: 4,
      peaColor: "#ff7a2a",
      hybridTier: 3,
    },
    barley: {
      id: "barley",
      name: "Ячмень",
      icon: "🌾",
      cost: 200,
      hp: 180,
      unlock: 18,
      damage: 35,
      shootEvery: 1.8,
      peaColor: "#d9b857",
    },
    gatlingpea: {
      id: "gatlingpea",
      name: "Горохомёт",
      icon: "🌿🔫",
      cost: 9999,
      hp: 350,
      unlock: 99,
      damage: 25,
      shootEvery: 0.45,
      doubleShot: true,
      peaColor: "#55b83a",
      hybridTier: 2,
    },
    cherrypea: {
      id: "cherrypea",
      name: "Вишнёвый стрелок",
      icon: "🍒🌱",
      cost: 9999,
      hp: 300,
      unlock: 99,
      damage: 80,
      splash: 80,
      shootEvery: 1.5,
      explosiveCherry: true,
      cherryShots: 1,
      cherryImmune: true,
      peaColor: "#ed2945",
      hybridTier: 2,
    },
    cherrybomber: {
      id: "cherrybomber",
      name: "Вишнёвый бомбильщик",
      icon: "🍒💥🌱",
      cost: 9999,
      hp: 300,
      unlock: 99,
      damage: 300,
      splash: 300,
      shootEvery: 3,
      explosiveCherry: true,
      cherryShots: 1,
      cherryImmune: true,
      fusionBlast: 1800,
      peaColor: "#ed2945",
      hybridTier: 3,
    },
    gatlingcherry: {
      id: "gatlingcherry",
      name: "Вишнёвый горохомёт",
      icon: "🍒🌿🔫",
      cost: 9999,
      hp: 350,
      unlock: 99,
      damage: 40,
      splash: 40,
      shootEvery: 1.5,
      explosiveCherry: true,
      cherryShots: 4,
      cherryImmune: true,
      peaColor: "#ff3a4a",
      hybridTier: 3,
    },
    blastlauncher: {
      id: "blastlauncher",
      name: "Взрывомёт",
      icon: "🪖🍒🔫",
      cost: 9999,
      hp: 400,
      unlock: 99,
      damage: 300,
      splash: 300,
      shootEvery: 2,
      explosiveCherry: true,
      cherryShots: 4,
      cherryImmune: true,
      peaColor: "#ff2a3a",
      hybridTier: 4,
    },
    sniper: {
      id: "sniper",
      name: "Снайпер",
      icon: "🎯🌿",
      cost: 9999,
      hp: 300,
      unlock: 99,
      damage: 500,
      shootEvery: 3,
      sniper: true,
      headshotEvery: 6,
      hybridTier: 3,
    },
    hurricanepea: {
      id: "hurricanepea",
      name: "Ураганный горохомёт",
      icon: "🌪️🔫",
      cost: 9999,
      hp: 600,
      unlock: 99,
      damage: 45,
      shootEvery: 0.35,
      doubleShot: true,
      piercing: true,
      peaColor: "#70e38b",
      hybridTier: 4,
    },
    firesniper: {
      id: "firesniper",
      name: "Огненный снайпер",
      icon: "🔥🎯",
      cost: 9999,
      hp: 400,
      unlock: 99,
      damage: 650,
      shootEvery: 3,
      sniper: true,
      headshotEvery: 6,
      fireSniper: true,
      hybridTier: 4,
    },
    pumpkin: {
      id: "pumpkin",
      name: "Тыква",
      icon: "🎃",
      cost: 125,
      hp: 4000,
      unlock: 17,
      pumpkinArmor: true,
    },
    jokerpumpkin: {
      id: "jokerpumpkin",
      name: "Тыква-джокер",
      icon: "🤡🎃",
      cost: 300,
      hp: 4000,
      unlock: 17,
      pumpkinArmor: true,
    },
    magnetshroom: {
      id: "magnetshroom",
      name: "Магнитогриб",
      icon: "🧲🍄",
      cost: 100,
      hp: 300,
      unlock: 17,
      recharge: 7.5,
      magnetShroom: true,
      magnetEvery: 15,
      magneticSystem: true,
    },
    lurepumpkin: {
      id: "lurepumpkin",
      name: "Магнитотыква",
      icon: "🧲🎃",
      cost: 9999,
      hp: 5000,
      unlock: 99,
      pumpkinArmor: true,
      magnetShroom: true,
      magnetEvery: 12,
      magneticSystem: true,
      metalRepair: 500,
      magnetPulseEvery: 6,
      magnetPulseDamage: 20,
      hybridTier: 2,
    },
    neodymiumpumpkin: {
      id: "neodymiumpumpkin",
      name: "Неодимовая Тыква",
      icon: "💠🎃",
      cost: 9999,
      hp: 8000,
      unlock: 99,
      pumpkinArmor: true,
      magnetShroom: true,
      magnetEvery: 10,
      magneticSystem: true,
      metalRepair: 500,
      magnetPulseEvery: 6,
      magnetPulseDamage: 35,
      blastResist: 0.35,
      hybridTier: 3,
    },
    cherrypumpkin: {
      id: "cherrypumpkin",
      name: "Вишнёвая тыква",
      icon: "🍒🎃",
      cost: 275,
      hp: 4000,
      unlock: 17,
      pumpkinArmor: true,
    },
    armorpumpkin: {
      id: "armorpumpkin",
      name: "Бронированная тыква",
      icon: "🛡️🎃",
      cost: 9999,
      hp: 12000,
      unlock: 99,
      pumpkinArmor: true,
      titanArmor: true,
      hybridTier: 4,
    },
    melonpult: {
      id: "melonpult",
      name: "Арбузомёт",
      icon: "🍉",
      cost: 300,
      hp: 300,
      unlock: 17,
      recharge: 7.5,
      damage: 80,
      splash: 27,
      shootEvery: 3,
      lobber: true,
      projectileKind: "melon",
    },
    kernelpult: {
      id: "kernelpult",
      name: "Кукурузомёт",
      icon: "🌽",
      cost: 100,
      hp: 300,
      unlock: 17,
      recharge: 7.5,
      damage: 20,
      shootEvery: 3,
      lobber: true,
      butterChance: 0.25,
      projectileKind: "kernel",
    },
    meloncannon: {
      id: "meloncannon",
      name: "Арбузная пушка",
      icon: "🍉💥",
      cost: 9999,
      hp: 1000,
      unlock: 99,
      damage: 200,
      splash: 200,
      shootEvery: 36,
      melonCannon: true,
      hybridTier: 4,
    },
    icecannon: {
      id: "icecannon",
      name: "Ледяная пушка",
      icon: "🧊🍉",
      cost: 9999,
      hp: 1000,
      unlock: 99,
      damage: 160,
      splash: 120,
      shootEvery: 30,
      melonCannon: true,
      iceCannon: true,
      slow: 0.45,
      slowTime: 4,
      peaColor: "#8de4ff",
      hybridTier: 4,
    },
    nullifier: {
      id: "nullifier",
      name: "Обнулитель",
      icon: "💠☠️",
      cost: 9999,
      hp: 1200,
      unlock: 99,
      damage: 360,
      shootEvery: 1.5,
      shotCount: 2,
      slow: 0.4,
      slowTime: 4,
      nullifier: true,
      nullifierBurst: 1800,
      nullifierPercent: 0.3,
      peaColor: "#5ee7ff",
      hybridTier: 5,
    },
    wallnut: {
      id: "wallnut",
      name: "Орех",
      icon: "🥜",
      cost: 50,
      hp: 400,
      unlock: 1,
      fusesInto: "bigwallnut",
    },
    bigwallnut: {
      id: "bigwallnut",
      name: "Большой орех",
      icon: "🌰",
      cost: 100,
      hp: 900,
      unlock: 99,
      fusesInto: "giantwallnut",
      hybridTier: 2,
    },
    giantwallnut: {
      id: "giantwallnut",
      name: "Гигантский орех",
      icon: "🗿",
      cost: 200,
      hp: 2200,
      unlock: 99,
      hybridTier: 3,
    },
    fatwallnut: {
      id: "fatwallnut",
      name: "Жирный орех",
      icon: "🟤🥜",
      cost: 9999,
      hp: 32000,
      unlock: 99,
      nutFortress: true,
      bonusHpPerNut: 4000,
      heavyHitDamage: 500,
      hybridTier: 4,
    },
    frostrepeater: {
      id: "frostrepeater",
      name: "Ледяной двойной горох",
      icon: "🧊",
      cost: 9999,
      hp: 180,
      unlock: 99,
      damage: 25,
      shootEvery: 1.3,
      doubleShot: true,
      slow: 0.4,
      slowTime: 4,
      peaColor: "#8de4ff",
      hybridTier: 2,
    },
    sunshooter: {
      id: "sunshooter",
      name: "Солнечный стрелок",
      icon: "🌞",
      cost: 9999,
      hp: 160,
      unlock: 99,
      damage: 22,
      shootEvery: 1.4,
      produce: 25,
      produceEvery: 7,
      peaColor: "#ffd84d",
      hybridTier: 2,
    },
    thornnut: {
      id: "thornnut",
      name: "Колючий орех",
      icon: "🌵🥜",
      cost: 9999,
      hp: 1100,
      unlock: 99,
      damage: 35,
      shootEvery: 1.7,
      peaColor: "#d8e85a",
      hybridTier: 2,
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
      fusesInto: "gatlingpea",
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
      balloonCounter: true,
      peaColor: "#d8e85a",
    },
    starfruit: {
      id: "starfruit",
      name: "Звездофрукт",
      icon: "⭐",
      cost: 125,
      hp: 300,
      unlock: 10,
      damage: 20,
      shootEvery: 1.5,
      starShooter: true,
      starShots: 5,
      peaColor: "#ffd84d",
    },
    magnetocactus: {
      id: "magnetocactus",
      name: "Магнитокактус",
      icon: "🧲🌵",
      cost: 9999,
      hp: 300,
      unlock: 99,
      damage: 40,
      shootEvery: 1.5,
      balloonCounter: true,
      magneticSystem: true,
      magnetDart: true,
      metalBonus: 40,
      peaColor: "#7cf0ff",
      hybridTier: 2,
    },
    meteofruit: {
      id: "meteofruit",
      name: "Метеофрукт",
      icon: "☄️⭐",
      cost: 9999,
      hp: 300,
      unlock: 99,
      damage: 20,
      shootEvery: 1.5,
      starShooter: true,
      starShots: 5,
      magneticSystem: true,
      starMeteorEvery: 12,
      starMeteorDamage: 400,
      peaColor: "#ff8a3d",
      hybridTier: 3,
    },
    astrofruit: {
      id: "astrofruit",
      name: "Астрофрукт",
      icon: "🌌⭐",
      cost: 9999,
      hp: 300,
      unlock: 99,
      damage: 25,
      shootEvery: 1.5,
      starShooter: true,
      starShots: 5,
      globalStars: true,
      magneticSystem: true,
      starMeteorEvery: 8,
      starMeteorDamage: 900,
      peaColor: "#5ee7ff",
      hybridTier: 4,
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
    doomshroom: {
      id: "doomshroom",
      name: "Гриб судьбы",
      icon: "💣🍄",
      cost: 125,
      hp: 300,
      unlock: 15,
      recharge: 50,
      fuse: 1.2,
      blastDamage: 1800,
      blastCells: 3.5,
      leavesCrater: true,
    },
    hypnoshroom: {
      id: "hypnoshroom",
      name: "Гипногриб",
      icon: "🌀🍄",
      cost: 75,
      hp: 300,
      unlock: 15,
      recharge: 30,
      hypnoShroom: true,
      fusesInto: "hypnolia",
    },
    hypnolia: {
      id: "hypnolia",
      name: "Гипнолия",
      icon: "👑🌀🍄",
      cost: 9999,
      hp: 600,
      unlock: 99,
      hypnoShroom: true,
      multiHypnoUses: 5,
      allySummoner: true,
      summonEvery: 30,
      summonPool: ["cone", "bucket", "tank", "giant"],
      hybridTier: 3,
    },
    chipnolia: {
      id: "chipnolia",
      name: "Вишнёвая Гипно-Императрица",
      icon: "🍒👑🍄",
      cost: 9999,
      hp: 800,
      unlock: 99,
      hypnoShroom: true,
      multiHypnoUses: 5,
      allySummoner: true,
      summonEvery: 30,
      summonPool: ["runner", "bucket", "zomboni", "knight"],
      explosiveSummons: true,
      hybridTier: 4,
    },
    curseshroom: {
      id: "curseshroom",
      name: "Проклятый гриб",
      icon: "💜🍄",
      cost: 9999,
      hp: 300,
      unlock: 99,
      hypnoShroom: true,
      curseExplode: true,
      hybridTier: 2,
    },
    doomsdayshroom: {
      id: "doomsdayshroom",
      name: "Гриб Конца Света",
      icon: "☠️🍄",
      cost: 9999,
      hp: 300,
      unlock: 99,
      fuse: 1.0,
      blastDamage: 1800,
      blastCells: 3.5,
      doomsdayShroom: true,
      hybridTier: 3,
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
    squash: {
      id: "squash",
      name: "Кабачок",
      icon: "🥒",
      cost: 50,
      hp: 300,
      unlock: 5,
      recharge: 20,
      squash: true,
      squashRange: 95,
    },
    tallnut: {
      id: "tallnut",
      name: "Высокий орех",
      icon: "🥜⬆️",
      cost: 125,
      hp: 8000,
      unlock: 8,
      tallNut: true,
    },
    mechanut: {
      id: "mechanut",
      name: "Меха-орех",
      icon: "🤖🥜",
      cost: 9999,
      hp: 4000,
      unlock: 99,
      magneticSystem: true,
      metalRepair: 500,
      mechaGuard: true,
      hybridTier: 2,
    },
    footballtallnut: {
      id: "footballtallnut",
      name: "Футбольный орех",
      icon: "🏈🥜",
      cost: 9999,
      hp: 16000,
      unlock: 99,
      tallNut: true,
      magneticSystem: true,
      metalRepair: 500,
      cherryResist: 0.5,
      hybridTier: 3,
    },
    footballgatling: {
      id: "footballgatling",
      name: "Футбольный гатлинг",
      icon: "🏈🔫",
      cost: 9999,
      hp: 3000,
      unlock: 99,
      damage: 80,
      shootEvery: 2,
      shotCount: 4,
      knockbackOnHit: 55,
      footballPeaEvery: 12,
      magneticSystem: true,
      metalRepair: 500,
      cherryResist: 0.5,
      peaColor: "#c45a2a",
      hybridTier: 3,
    },
    gatlingdoom: {
      id: "gatlingdoom",
      name: "Гатлинг Судьбы",
      icon: "☠️🔫",
      cost: 9999,
      hp: 400,
      unlock: 99,
      damage: 300,
      splash: 80,
      shootEvery: 1.5,
      shotCount: 4,
      doomVolleyUltimate: true,
      peaColor: "#3a2048",
      hybridTier: 4,
    },
    buckshotcommando: {
      id: "buckshotcommando",
      name: "Коммандо-дробовик",
      icon: "🪖🏈🔫",
      cost: 9999,
      hp: 4000,
      unlock: 99,
      damage: 80,
      shootEvery: 1.5,
      shotCount: 6,
      knockbackOnHit: 60,
      footballPeaEvery: 8,
      magneticSystem: true,
      metalRepair: 500,
      cherryResist: 0.5,
      commandoUltimate: 0.02,
      peaColor: "#8a9aaa",
      hybridTier: 4,
    },
    peafountain: {
      id: "peafountain",
      name: "Гороховый фонтан",
      icon: "⛲🌱",
      cost: 500,
      hp: 1500,
      unlock: 18,
      recharge: 30,
      damage: 20,
      shootEvery: 3,
      fountainShots: 36,
      peaFountain: true,
      peaColor: "#7ed957",
      hybridTier: 4,
    },
    infinut: {
      id: "infinut",
      name: "Вечно-орех",
      icon: "💠🥜",
      cost: 75,
      hp: 2000,
      unlock: 10,
      recharge: 20,
      holonut: true,
      regenIdle: 15,
      plantFoodShield: 10000,
    },
    peapod: {
      id: "peapod",
      name: "Стручок гороха",
      icon: "🫛",
      cost: 125,
      hp: 300,
      unlock: 9,
      recharge: 7.5,
      damage: 20,
      shootEvery: 1.4,
      stackable: true,
      maxHeads: 5,
      peaColor: "#6ecf3a",
      plantFoodGiantPeas: 5,
      plantFoodGiantDamage: 400,
    },
    snapdragon: {
      id: "snapdragon",
      name: "Драконолист",
      icon: "🐉🔥",
      cost: 150,
      hp: 300,
      unlock: 11,
      recharge: 7.5,
      damage: 30,
      shootEvery: 1.5,
      snapdragon: true,
      breathCols: 3,
      breathRows: 1,
      plantFoodBlast: 1800,
      peaColor: "#ff6a2a",
    },
    coldsnapdragon: {
      id: "coldsnapdragon",
      name: "Ледяной драконолист",
      icon: "🐉🧊",
      cost: 200,
      hp: 300,
      unlock: 12,
      recharge: 7.5,
      damage: 30,
      shootEvery: 1.5,
      snapdragon: true,
      coldSnap: true,
      breathCols: 2,
      breathRows: 1,
      slow: 0.5,
      slowTime: 3,
      plantFoodBlast: 1200,
      plantFoodFreeze: 10,
      peaColor: "#8de4ff",
      hybridTier: 2,
    },
    voltsnapdragon: {
      id: "voltsnapdragon",
      name: "Электрозев",
      icon: "🐉⚡",
      cost: 250,
      hp: 300,
      unlock: 14,
      recharge: 10,
      voltSnap: true,
      voltRange: 9,
      chainChance: 0.5,
      chainTargets: 3,
      plantFoodVoltBurst: 800,
      peaColor: "#7cf0ff",
    },
    bonkchoy: {
      id: "bonkchoy",
      name: "Бокс-чой",
      icon: "🥊🥬",
      cost: 150,
      hp: 300,
      unlock: 7,
      recharge: 5,
      damage: 15,
      shootEvery: 0.25,
      bonkChoy: true,
      plantFoodBonkTime: 3,
      plantFoodBonkDamage: 60,
    },
    sunnut: {
      id: "sunnut",
      name: "Солнцеорех",
      icon: "🌞🥜",
      cost: 9999,
      hp: 2000,
      unlock: 99,
      produce: 25,
      produceEvery: 24,
      hybridTier: 2,
    },
    doublesunnut: {
      id: "doublesunnut",
      name: "Двойной Солнцеорех",
      icon: "🌞🌞🥜",
      cost: 9999,
      hp: 4000,
      unlock: 99,
      twinSolar: true,
      damageCapFlat: 50,
      sunOnHit: 15,
      giantSunCost: 500,
      hybridTier: 3,
    },
    peamine: {
      id: "peamine",
      name: "Горохомина",
      icon: "🌱🥔",
      cost: 9999,
      hp: 120,
      unlock: 99,
      damage: 20,
      shootEvery: 1.4,
      armTime: 5,
      peaMine: true,
      blastDamage: 900,
      blastRadius: 55,
      peaColor: "#8fd94f",
      hybridTier: 2,
    },
    sunpuff: {
      id: "sunpuff",
      name: "Солнцегриб",
      icon: "🌻🍄",
      cost: 9999,
      hp: 100,
      unlock: 99,
      produce: 15,
      produceLarge: 35,
      produceEvery: 18,
      produceGrows: true,
      matureAfter: 50,
      hybridTier: 2,
    },
    obsidiandragon: {
      id: "obsidiandragon",
      name: "Обсидиановый дракон",
      icon: "🐉🖤",
      cost: 9999,
      hp: 450,
      unlock: 99,
      damage: 55,
      shootEvery: 1.35,
      snapdragon: true,
      obsidianDragon: true,
      breathCols: 4,
      breathRows: 2,
      peaColor: "#6b2db3",
      hybridTier: 3,
    },
    voidhole: {
      id: "voidhole",
      name: "Обсидиановая дыра",
      icon: "🕳️🖤",
      cost: 9999,
      hp: 500,
      unlock: 99,
      blackHole: true,
      pullStrength: 55,
      voidDamage: 35,
      voidEvery: 0.45,
      voidRange: 140,
      hybridTier: 3,
    },
    icefiregatling: {
      id: "icefiregatling",
      name: "Ледо-огненный гатлинг",
      icon: "❄️🔥🔫",
      cost: 9999,
      hp: 900,
      unlock: 99,
      damage: 28,
      shootEvery: 0.55,
      iceFireGatling: true,
      slow: 0.45,
      slowTime: 2.5,
      peaColor: "#ff8a3d",
      hybridTier: 3,
    },
    imperialgatling: {
      id: "imperialgatling",
      name: "Имперский пулемёт",
      icon: "🛡️🔫",
      cost: 9999,
      hp: 3500,
      unlock: 99,
      damage: 45,
      shootEvery: 0.7,
      shotCount: 5,
      piercing: true,
      knockbackOnHit: 18,
      peaColor: "#d62828",
      hybridTier: 3,
    },
    shadowchomper: {
      id: "shadowchomper",
      name: "Теневой чомпер",
      icon: "🌑🦷",
      cost: 9999,
      hp: 500,
      unlock: 99,
      damage: 30,
      shootEvery: 1.2,
      snapPea: true,
      chewTime: 14,
      headDamage: 500,
      shadowPea: true,
      pulls: 4,
      peaColor: "#7a45c2",
      hybridTier: 2,
    },
    meloncart: {
      id: "meloncart",
      name: "Арбузная тележка",
      icon: "🍉🛒",
      cost: 9999,
      hp: 800,
      unlock: 99,
      damage: 110,
      splash: 40,
      shootEvery: 2.2,
      lobber: true,
      projectileKind: "melon",
      melonCart: true,
      hybridTier: 2,
    },
    obsidiannut: {
      id: "obsidiannut",
      name: "Обсидианорех",
      icon: "💜🥜",
      cost: 9999,
      hp: 8000,
      unlock: 99,
      tallNut: false,
      obsidianNut: true,
      hybridTier: 2,
    },
    flametallnut: {
      id: "flametallnut",
      name: "Огненный высокий орех",
      icon: "🔥🥜⬆️",
      cost: 9999,
      hp: 8000,
      unlock: 99,
      tallNut: true,
      flameNut: true,
      thorns: true,
      thornDamage: 40,
      hybridTier: 2,
    },
    obsidiantallnut: {
      id: "obsidiantallnut",
      name: "Высокий Обсидианорех",
      icon: "💜🥜⬆️",
      cost: 9999,
      hp: 32000,
      unlock: 99,
      tallNut: true,
      obsidianNut: true,
      hybridTier: 3,
    },
    obsidianmine: {
      id: "obsidianmine",
      name: "Обсидиановая мина",
      icon: "💜🥔",
      cost: 9999,
      hp: 2500,
      unlock: 99,
      armTime: 4,
      peaMine: true,
      blastDamage: 2000,
      blastRadius: 75,
      obsidianNut: true,
      hybridTier: 4,
    },
  };

  const HYBRID_RECIPES = {
    "peashooter+snowpea": "frostrepeater",
    "peashooter+sunflower": "sunshooter",
    "cactus+wallnut": "thornnut",
    "doomshroom+hypnoshroom": "curseshroom",
    "curseshroom+doomshroom": "doomsdayshroom",
    "doomsdayshroom+gatlingturret": "calamityturret",
    "barley+gatlingpea": "sniper",
    "peashooter+sniper": "hurricanepea",
    "hurricanepea+peashooter": "sniper",
    "jalapeno+sniper": "firesniper",
    "cherrybomb+threepeater": "ultimatesakurashooter",
    "magiccatgirl+threepeater": "triplecatgirl",
    "cherrybomb+sunflower": "cherryshooter",
    "cherrybomb+hypnolia": "chipnolia",
    "magnetshroom+pumpkin": "lurepumpkin",
    "lurepumpkin+magnetshroom": "neodymiumpumpkin",
    "cherrybomb+chomper": "cherrychomper",
    "chomper+wallnut": "nutchomper",
    "chomper+sunflower": "sunchomper",
    "chomper+peashooter": "chompshooter",
    "chompshooter+wallnut": "chewzilla",
    "nutchomper+peashooter": "chewzilla",
    "chewzilla+cherrychomper": "cherrizilla",
    "cherrychomper+nutchomper": "chompermix",
    "chomper+chompermix": "chompermess",
    "cherrybomb+peashooter": "cherrypea",
    "cherrybomb+cherrypea": "cherrybomber",
    "cherrybomb+gatlingpea": "gatlingcherry",
    "cherrybomber+gatlingcherry": "blastlauncher",
    "cactus+magnetshroom": "magnetocactus",
    "magnetshroom+starfruit": "meteofruit",
    "magnetocactus+meteofruit": "astrofruit",
    "wallnut+magnetshroom": "mechanut",
    "tallnut+magnetshroom": "footballtallnut",
    "gatlingpea+magnetshroom": "footballgatling",
    "gatlingpea+doomshroom": "gatlingdoom",
    "footballgatling+peashooter": "buckshotcommando",
    "gatlingpea+threepeater": "peafountain",
    "snapdragon+snowpea": "coldsnapdragon",
    "snapdragon+laserbean": "voltsnapdragon",
    "meloncannon+snowpea": "icecannon",
    "icecannon+doomsdayshroom": "nullifier",
    "sunflower+wallnut": "sunnut",
    "sunnut+wallnut": "doublesunnut",
    "peashooter+potatomine": "peamine",
    "puffshroom+sunflower": "sunpuff",
    "doomshroom+snapdragon": "obsidiandragon",
    "doomshroom+magnetshroom": "voidhole",
    "frostrepeater+gatlingpea": "icefiregatling",
    "footballgatling+tallnut": "imperialgatling",
    "chomper+shadowpea": "shadowchomper",
    "melonpult+pumpkin": "meloncart",
    "doomshroom+wallnut": "obsidiannut",
    "jalapeno+tallnut": "flametallnut",
    "flametallnut+obsidiannut": "obsidiantallnut",
    "obsidiantallnut+potatomine": "obsidianmine",
  };

  const HYBRID_PLANT_ORDER = {
    curseshroom: ["hypnoshroom", "doomshroom"],
    doomsdayshroom: ["curseshroom", "doomshroom"],
    calamityturret: ["gatlingturret", "doomsdayshroom"],
    hurricanepea: ["sniper", "peashooter"],
    firesniper: ["sniper", "jalapeno"],
    ultimatesakurashooter: ["threepeater", "cherrybomb"],
    triplecatgirl: ["magiccatgirl", "threepeater"],
    cherryshooter: ["sunflower", "cherrybomb"],
    chipnolia: ["hypnolia", "cherrybomb"],
    lurepumpkin: ["pumpkin", "magnetshroom"],
    neodymiumpumpkin: ["lurepumpkin", "magnetshroom"],
    cherrychomper: ["chomper", "cherrybomb"],
    nutchomper: ["chomper", "wallnut"],
    sunchomper: ["chomper", "sunflower"],
    chompshooter: ["chomper", "peashooter"],
    chewzilla: ["chompshooter", "wallnut"],
    cherrizilla: ["chewzilla", "cherrychomper"],
    chompermix: ["nutchomper", "cherrychomper"],
    chompermess: ["chompermix", "chomper"],
    cherrypea: ["peashooter", "cherrybomb"],
    cherrybomber: ["cherrypea", "cherrybomb"],
    gatlingcherry: ["gatlingpea", "cherrybomb"],
    blastlauncher: ["gatlingcherry", "cherrybomber"],
    magnetocactus: ["cactus", "magnetshroom"],
    meteofruit: ["starfruit", "magnetshroom"],
    astrofruit: ["meteofruit", "magnetocactus"],
    mechanut: ["wallnut", "magnetshroom"],
    footballtallnut: ["tallnut", "magnetshroom"],
    footballgatling: ["gatlingpea", "magnetshroom"],
    gatlingdoom: ["gatlingpea", "doomshroom"],
    buckshotcommando: ["footballgatling", "peashooter"],
    peafountain: ["gatlingpea", "threepeater"],
    coldsnapdragon: ["snapdragon", "snowpea"],
    voltsnapdragon: ["snapdragon", "laserbean"],
    icecannon: ["meloncannon", "snowpea"],
    nullifier: ["icecannon", "doomsdayshroom"],
    sunnut: ["sunflower", "wallnut"],
    doublesunnut: ["sunnut", "wallnut"],
    peamine: ["peashooter", "potatomine"],
    sunpuff: ["sunflower", "puffshroom"],
    obsidiandragon: ["snapdragon", "doomshroom"],
    voidhole: ["doomshroom", "magnetshroom"],
    icefiregatling: ["frostrepeater", "gatlingpea"],
    imperialgatling: ["footballgatling", "tallnut"],
    shadowchomper: ["chomper", "shadowpea"],
    meloncart: ["melonpult", "pumpkin"],
    obsidiannut: ["wallnut", "doomshroom"],
    flametallnut: ["tallnut", "jalapeno"],
    obsidiantallnut: ["obsidiannut", "flametallnut"],
    obsidianmine: ["obsidiantallnut", "potatomine"],
  };

  const HYBRID_STEPS = {
    curseshroom: [
      "Посади 🌀🍄 Гипногриб на пустую клетку",
      "Выбери 💣🍄 Гриб судьбы и нажми прямо на Гипногриб",
      "Выйдет 💜🍄 Проклятый гриб: зомби, который его съест, переходит на твою сторону и взрывается после смерти",
    ],
    doomsdayshroom: [
      "Сначала собери 💜🍄 Проклятый гриб: Гипногриб, а сверху Гриб судьбы",
      "Выбери ещё один 💣🍄 Гриб судьбы и нажми на Проклятый гриб",
      "Через секунду гремит взрыв: 1800 урона в радиусе 3.5 клетки и кратер на 20 секунд",
      "Появляются 3 зачарованных 🛡️👹 Рыцаря-Гиганта, а рядом с каждым задетым зомби — 🧊🚚 Зомбони",
      "Зачарованные идут вправо и дерутся за тебя — косилки и снаряды их не трогают",
    ],
    calamityturret: [
      "Сначала собери 🌿🔫 Турель Гатлинга (Двойной — Тройной — Двойной + Хикамовый скрещиватель) и высади её",
      "Рядом собери ☠️🍄 Гриб Конца Света и перчаткой 🧤 перенеси его на турель до взрыва",
      "Урон 200 (ещё +300 по гигантам), снаряд пробивает до 3 зомби",
      "Каждый залп съедает 50 прочности, но не ниже 1500; ниже 1250 турель получает на 75% меньше урона",
      "0.5% — превратить зомби в проклятого (свой и взрывается); 0.01% — Грибы Конца Света под всеми зомби",
    ],
    gatlingpea: [
      "Посади два 🌿 Двойных гороха в одну клетку",
      "Получится 🌿🔫 Горохомёт с быстрыми двойными залпами",
    ],
    sniper: [
      "Сначала объедини два 🌿 Двойных гороха, чтобы получить 🌿🔫 Горохомёт",
      "Посади 🌾 Ячмень на Горохомёт или Горохомёт на Ячмень",
      "Другой рецепт: 🌪️ Ураганный горохомёт + обычный Горохострел",
      "🎯 Снайпер атакует любую цель на карте: 500 урона раз в 3 секунды",
      "Каждый шестой выстрел попадает в голову и мгновенно убивает зомби",
    ],
    hurricanepea: [
      "Собери 🎯 Снайпера: Ячмень + Горохомёт",
      "Посади обычный 🌱 Горохострел на Снайпера",
      "Получится 🌪️ Ураганный горохомёт с быстрыми пробивающими залпами",
      "Ураганный горохомёт + Горохострел снова создаёт Снайпера",
    ],
    firesniper: [
      "Собери 🎯 Снайпера",
      "Посади 🌶️ Халапеньо прямо на Снайпера",
      "🔥 Огненный снайпер наносит усиленный урон по всей карте",
    ],
    fatwallnut: [
      "Посади три обычных 🥜 Ореха подряд в одном ряду",
      "Поставь 🎩🥔 Хикамовый скрещиватель на средний орех",
      "Получится 🟤🥜 Жирный орех с 32000 здоровья",
      "Каждый дополнительный орех на поле добавляет ему ещё 4000 максимального здоровья",
      "Удары Гиганта, Рыцаря-Гиганта и Зомбони наносят ему ровно 500 урона",
    ],
    ultimatesakurashooter: [
      "Посади 🌱🌱🌱 Тройной горохострел",
      "Выбери 🍒 Вишню-бомбу и нажми прямо на Тройной горохострел",
      "🌸⚔️ Ultimate Sakura Shooter: 900 урона × 4 пули × 3 ряда каждые 2 сек",
      "При появлении и гибели охватывает всё поле огнём (вишня-взрыв)",
      "Сам иммунен к вишнёвым взрывам и стреляет красными пулями",
    ],
    triplecatgirl: [
      "Посади 🐱🪄 Волшебную Кошкодевочку",
      "Выбери 🌱🌱🌱 Тройной горохострел и нажми прямо на неё",
      "🐱🐱🐱🔥 Три на четыре: три головы дышат огнём по 3 рядам на 4 клетки вперёд",
      "Как и обычная Кошкодевочка, может стоять прямо на воде",
    ],
    cherryshooter: [
      "Посади 🌻 Подсолнух",
      "Выбери 🍒 Вишню-бомбу и нажми прямо на Подсолнух",
      "🌟🍒 Звезда стреляет сразу в 5 сторон: вперёд, по диагоналям и назад",
      "Вишня: 10 урона + взрыв и отбрасывание зомби назад",
      "Стальной шар: 40; лёд: 15 и замедление; семена: 25",
      "С шансом 25% вместо снаряда летит яйцо: 30 урона, брызги и сильное замедление",
      "Лара может поглотить каждый вишнёвый взрыв и дать +100 солнц",
    ],
    hypnolia: [
      "Посади 🌀🍄 Гипногриб и наложи на него второй Гипногриб",
      "👑🌀🍄 Гипнолия выдерживает 5 гипнозов вместо одного",
      "Каждые 30 секунд она призывает случайного союзного зомби",
    ],
    chipnolia: [
      "Сначала объедини два 🌀🍄 Гипногриба и получи Гипнолию",
      "Наложи 🍒 Вишню-бомбу на Гипнолию",
      "🍒👑🍄 Императрица каждые 30 секунд призывает союзного подрывника",
      "Призванный зомби взрывается после гибели; сама Императрица гипнотизирует до 5 врагов",
    ],
    lurepumpkin: [
      "Посади 🎃 Тыкву",
      "Наложи 🧲🍄 Магнитогриб прямо на Тыкву",
      "🧲🎃 Магнитотыква крадёт металл и чинит себе 500 прочности",
      "Каждые 6 сек бьёт металлических зомби сильнее, если рядом есть другие магниты",
    ],
    neodymiumpumpkin: [
      "Сначала собери 🧲🎃 Магнитотыкву: Тыква + Магнитогриб",
      "Наложи ещё один 🧲🍄 Магнитогриб на Магнитотыкву",
      "💠🎃 Неодимовая Тыква: 8000 HP, сильный магнитный импульс и ремонт на 500",
      "Получает лишь 35% урона от Гиганта, Рыцаря и Зомбони",
    ],
    cherrychomper: [
      "Посади 🟣🦷 Чомпера",
      "Наложи 🍒 Вишню-бомбу прямо на него",
      "🍒🦷 Вишнёвый чомпер при глотке взрывает клетку впереди на 1800",
      "При скрещивании тоже гремит взрыв 1800",
    ],
    nutchomper: [
      "Посади 🟣🦷 Чомпера",
      "Наложи 🥜 Орех прямо на него",
      "🥜🦷 Ореховый чомпер: 4000 HP и +1000 здоровья за каждого проглоченного",
    ],
    sunchomper: [
      "Посади 🟣🦷 Чомпера",
      "Наложи 🌻 Подсолнух на него",
      "🌞🦷 Солнечный чомпер даёт 100 солнц за каждого проглоченного зомби",
    ],
    chompshooter: [
      "Посади 🟣🦷 Чомпера",
      "Наложи 🌱 Горохострел на него",
      "🌱🦷 Чомп-стрелок во время жевания сплёвывает куски зомби каждые 3 сек (80 урона)",
    ],
    chewzilla: [
      "Собери 🌱🦷 Чомп-стрелка и наложи 🥜 Орех",
      "Или 🥜🦷 Ореховый чомпер + 🌱 Горохострел",
      "🦖🦷 Жуйзилла: укус 200 + лечение 200, сплёвывает пробивающие куски",
      "Раз в 40 сек пожирает зомби и лечится до 4000 (избыток до 16000)",
    ],
    cherrizilla: [
      "Собери 🦖🦷 Жуйзиллу",
      "Наложи 🍒🦷 Вишнёвого чомпера",
      "🍒🦖 Черризилла: укус 300, мега-лечение, вишнёвый взрыв 1800 и сплёвывание 120",
      "Лучший чомпер с превью Fusion — глотает и рвёт всё вокруг",
    ],
    chompermix: [
      "Собери 🍒🦷 Вишнёвого и 🥜🦷 Орехового чомперов",
      "Наложи Вишнёвого чомпера на Орехового",
      "🍒🥜🦷 Чомпер-микс глотает даже гигантов и взрывается на 900",
    ],
    chompermess: [
      "Собери 🍒🥜🦷 Чомпер-микс",
      "Наложи на него ещё одного 🟣🦷 Чомпера",
      "🌀🦷🦷 Мешанина глотает всех в трёх рядах на 150 пикселей вперёд",
      "Каждый глоток гремит взрывом на 1500 урона, а жуёт втрое быстрее",
    ],
    cherrypea: [
      "Посади 🌱 Горохострел",
      "Наложи 🍒 Вишню-бомбу на него",
      "🍒🌱 Вишнёвый стрелок пускает взрывную вишню на 80 урона в зоне 3×3",
    ],
    cherrybomber: [
      "Собери 🍒🌱 Вишнёвого стрелка",
      "Наложи ещё одну 🍒 Вишню-бомбу",
      "🍒💥🌱 Бомбильщик стреляет вишней на 300 урона / 3 сек в зоне 3×3",
      "При скрещивании сразу гремит взрыв на 1800",
    ],
    gatlingcherry: [
      "Собери 🌿🔫 Горохомёт (два Двойных гороха)",
      "Наложи 🍒 Вишню-бомбу на Горохомёт",
      "🍒🌿🔫 Вишнёвый горохомёт: 4 вишни по 40 урона каждые 1.5 сек",
    ],
    blastlauncher: [
      "Собери 🍒🌿🔫 Вишнёвый горохомёт и 🍒💥🌱 Бомбильщика",
      "Наложи Бомбильщика на Вишнёвый горохомёт",
      "🪖🍒🔫 Взрывомёт: 300×4 / 2 сек, взрыв 3×3 без ослабления",
      "Лучший стрелок на суше; иммунен к вишнёвым взрывам",
    ],
    magnetocactus: [
      "Посади 🌵 Кактус",
      "Наложи 🧲🍄 Магнитогриб на Кактус",
      "🧲🌵 Магнитокактус стреляет магнитными шипами на 40 урона и сбивает шары",
      "По металлическим зомби дополнительно +40 урона",
    ],
    meteofruit: [
      "Посади ⭐ Звездофрукт",
      "Наложи 🧲🍄 Магнитогриб на него",
      "☄️⭐ Метеофрукт стреляет пятью звёздами и раз в 12 сек роняет метеор на 400",
    ],
    astrofruit: [
      "Собери ☄️⭐ Метеофрукт и 🧲🌵 Магнитокактус",
      "Наложи Магнитокактус на Метеофрукт",
      "🌌⭐ Астрофрукт: 25×5 / 1.5 сек по любой цели на поле",
      "Магнитный звёздный метеор каждые 8 сек: 900 × число магнитов рядом",
    ],
    mechanut: [
      "Посади 🥜 Орех",
      "Наложи 🧲🍄 Магнитогриб на Орех",
      "🤖🥜 Меха-орех на гусеницах: 4000 HP, чинит 500 от металла",
      "Перехватывает урон соседних растений в радиусе 1 клетки (двойной)",
    ],
    footballtallnut: [
      "Посади 🧱🥜 Высокий орех (125 ☀️)",
      "Наложи 🧲🍄 Магнитогриб — получится 🏈🥜 Футбольный орех",
      "16000 HP, ремонт металла 500, половина урона от вишни",
    ],
    footballgatling: [
      "Собери 🌿🔫 Горохомёт (два Двойных гороха)",
      "Наложи 🧲🍄 Магнитогриб на Горохомёт",
      "🏈🔫 Футбольный гатлинг: 80×4 / 2 сек, отбрасывает зомби",
      "Каждый 12-й выстрел — футбольный горох: зомби разворачивается и бежит назад",
    ],
    gatlingdoom: [
      "Собери 🌿🔫 Горохомёт",
      "Наложи 💣🍄 Гриб судьбы на Горохомёт до взрыва",
      "☠️🔫 Гатлинг Судьбы: 300×4 / 1.5 сек",
      "Каждый 4-й залп — супер-снаряд на 1800 + взрыв 5×5, потом пауза 4.5 сек",
    ],
    buckshotcommando: [
      "Собери 🏈🔫 Футбольный гатлинг",
      "Наложи 🌱 Горохострел",
      "🪖🏈🔫 Коммандо: 80×6 / 1.5 сек, отбрасывание и футбольные горохи",
      "2% шанс ультимейта: полное лечение, 5 сек неуязвимости и шквал пуль",
    ],
    peafountain: [
      "Собери 🌿🔫 Горохомёт (два Двойных гороха)",
      "Наложи 🌱🌱🌱 Тройной горохострел на Горохомёт",
      "Или посади ⛲🌱 Гороховый фонтан напрямую за 500 ☀️ (с 18 уровня)",
      "Каждые 3 сек выпускает кольцо из 36 горошин во все стороны (20 урона каждая)",
      "Бьёт по всему полю — мёртвых зон нет",
    ],
    coldsnapdragon: [
      "Посади 🐉🔥 Драконолист",
      "Наложи ❄️ Снежный горох",
      "🐉🧊 Ледяной драконолист дышит холодом 3×2 и замедляет зомби на 50%",
      "Лечебный порошок: удар на 1200 и заморозка на 10 сек",
    ],
    voltsnapdragon: [
      "Посади 🐉🔥 Драконолист",
      "Наложи 🔵 Лазерный боб",
      "🐉⚡ Электрозев бьёт лучом до 9 клеток; урон растёт, если держит одну цель",
      "50% шанс цепной молнии по 3 соседям",
    ],
    icecannon: [
      "Собери 🍉💥 Арбузную пушку (Арбузомёт — Кукурузомёт — Арбузомёт + Хикамовый скрещиватель)",
      "Наложи ❄️ Снежный горох",
      "🧊🍉 Ледяная пушка стреляет ледяными арбузами и замедляет зомби",
    ],
    nullifier: [
      "Собери 🧊🍉 Ледяную пушку: Арбузная пушка + Снежный горох",
      "Собери ☠️🍄 Гриб Конца Света и перчаткой перенеси на Ледяную пушку до взрыва",
      "💠☠️ Обнулитель при появлении: взрыв 1800 в 3×3 и 1800+30% макс. HP по всему полю",
      "Потом стреляет двумя ледяными залпами 360×2 / 1.5 сек с замедлением",
    ],
    sunnut: [
      "Посади 🌻 Подсолнух",
      "Наложи 🥜 Орех",
      "🌞🥜 Солнцеорех: 2000 HP и производит солнце",
    ],
    doublesunnut: [
      "Собери 🌞🥜 Солнцеорех: Подсолнух + Орех",
      "Наложи ещё один 🥜 Орех",
      "🌞🌞🥜 Двойной Солнцеорех: 4000 HP, за удар теряет только 50 и даёт 15☀️",
      "Кликни по нему при 500☀️ — полное лечение и Гигантский Солнцеорех в ряду",
      "Повторные клики усиливают катящийся орех",
    ],
    peamine: [
      "Посади 🌱 Горохострел",
      "Наложи 🥔 Мину",
      "🌱🥔 Горохомина: через 5 сек вооружается, стреляет горохом",
      "Зомби, наступивший на неё, взрывается (900 урона вокруг)",
    ],
    sunpuff: [
      "Посади 🌻 Подсолнух",
      "Наложи 🍄 Гриб",
      "🌻🍄 Солнцегриб сначала даёт 15☀️, после 50 сек взрослеет и даёт 35☀️",
    ],
    obsidiandragon: [
      "Посади 🐉🔥 Драконолист",
      "Наложи 💣🍄 Гриб судьбы до взрыва",
      "🐉🖤 Обсидиановый дракон: тёмное дыхание 4×5 клеток, 55 урона",
    ],
    voidhole: [
      "Посади 💣🍄 Гриб судьбы",
      "Наложи 🧲 Магнитогриб до взрыва (или наоборот)",
      "🕳️🖤 Обсидиановая дыра затягивает зомби и жжёт их каждые 0.45 сек",
    ],
    icefiregatling: [
      "Собери 🧊 Ледяной двойной горох: Горохострел + Снежный горох",
      "Наложи 🌿🔫 Горохомёт",
      "❄️🔥🔫 Ледо-огненный гатлинг стреляет парой: лёд (замедление) и огонь",
    ],
    imperialgatling: [
      "Собери 🏈🔫 Футбольный гатлинг: Горохомёт + Магнитогриб",
      "Наложи 🥜⬆️ Высокий орех",
      "🛡️🔫 Имперский пулемёт: 3500 HP, 45×5 пробивающих пуль / 0.7 сек",
    ],
    shadowchomper: [
      "Посади 🦷 Чомпер",
      "Наложи 🌑 Теневой горохострел",
      "🌑🦷 Теневой чомпер глотает зомби и 4 раза утягивает близких под землю",
    ],
    meloncart: [
      "Посади 🍉 Арбузомёт",
      "Наложи 🎃 Тыкву",
      "🍉🛒 Арбузная тележка: крепкий арбузомёт на колёсах, 110 урона / 2.2 сек",
    ],
    obsidiannut: [
      "Посади 🥜 Орех",
      "Наложи 💣🍄 Гриб судьбы до взрыва",
      "💜🥜 Обсидианорех: кристаллический щит на 8000 HP",
    ],
    flametallnut: [
      "Посади 🥜⬆️ Высокий орех",
      "Наложи 🌶️ Халапеньо",
      "🔥🥜⬆️ Огненный высокий орех: 8000 HP и жжёт кусающих зомби",
    ],
    obsidiantallnut: [
      "Собери 💜🥜 Обсидианорех: Орех + Гриб судьбы",
      "Собери 🔥🥜⬆️ Огненный высокий орех: Высокий орех + Халапеньо",
      "Наложи один на другой",
      "💜🥜⬆️ Высокий Обсидианорех: 32000 HP — в 4 раза крепче Высокого ореха",
    ],
    obsidianmine: [
      "Собери 💜🥜⬆️ Высокий Обсидианорех",
      "Наложи 🥔 Мину",
      "💜🥔 Обсидиановая мина: 2500 HP, взрыв на 2000 в большом радиусе",
    ],
  };

  const TITAN_RECIPES = [
    {
      left: "repeater",
      middle: "threepeater",
      right: "repeater",
      result: "gatlingturret",
    },
    {
      left: "snappea",
      middle: "snappea",
      right: "snappea",
      result: "giantchomper",
    },
    {
      left: "jokerpumpkin",
      middle: "magnetshroom",
      right: "cherrypumpkin",
      result: "armorpumpkin",
    },
    {
      left: "melonpult",
      middle: "kernelpult",
      right: "melonpult",
      result: "meloncannon",
    },
    {
      left: "wallnut",
      middle: "wallnut",
      right: "wallnut",
      result: "fatwallnut",
    },
  ];

  function hybridRecipeKey(firstTypeId, secondTypeId) {
    return [firstTypeId, secondTypeId].sort().join("+");
  }

  function fusionResultType(firstTypeId, secondTypeId) {
    if (firstTypeId === secondTypeId) {
      return PLANT_TYPES[firstTypeId]?.fusesInto || null;
    }
    return HYBRID_RECIPES[hybridRecipeKey(firstTypeId, secondTypeId)] || null;
  }

  function hasHybridRecipe(typeId) {
    return Object.keys(HYBRID_RECIPES).some((key) =>
      key.split("+").includes(typeId)
    );
  }

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
    balloon: {
      id: "balloon",
      name: "Зомби с воздушным шаром",
      icon: "🎈🧟",
      cost: 250,
      hp: 600,
      speed: 16,
      damage: 20,
      biteEvery: 1,
      color: "#738b70",
      balloonZombie: true,
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
    knight: {
      id: "knight",
      name: "Рыцарь-гигант",
      icon: "🛡️👹",
      cost: 9999,
      hp: 2500,
      speed: 10,
      damage: 120,
      biteEvery: 1.2,
      color: "#6a7480",
      scale: 1.85,
      knight: true,
    },
    zomboni: {
      id: "zomboni",
      name: "Зомбони",
      icon: "🧊🚚",
      cost: 9999,
      hp: 900,
      speed: 28,
      damage: 180,
      biteEvery: 0.4,
      color: "#7ec8e8",
      scale: 1.35,
      zomboni: true,
    },
    obsidiangladiator: {
      id: "obsidiangladiator",
      name: "Обсидиановый гладиатор",
      icon: "⚔️🖤",
      cost: 9999,
      hp: 5000,
      speed: 6,
      damage: 180,
      biteEvery: 1.3,
      color: "#302943",
      scale: 2,
      boss: true,
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
          : id < 16
            ? ["normal", "runner", "cone", "tank", "bucket"]
            : id < 21
              ? ["normal", "runner", "cone", "tank", "bucket", "balloon"]
              : [
                  "normal",
                  "runner",
                  "cone",
                  "tank",
                  "bucket",
                  "balloon",
                  "giant",
                ];
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
      if (id === 30 && waveIndex === waveCount - 1) {
        zombies[0] = "obsidiangladiator";
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

  const WORLDS = [
    {
      id: "modern",
      name: "Современность",
      icon: "🏠",
      desc: "Дом и газон",
      skyTop: "#6db34a",
      skyBottom: "#3f8a32",
      zombieSkyTop: "#2a3a28",
      zombieSkyBottom: "#1a2818",
      house: "#6b3f24",
      houseDetail: "#8a5230",
      cellLight: "rgba(255,255,255,0.08)",
      cellDark: "rgba(0,0,0,0.08)",
    },
    {
      id: "egypt",
      name: "Древний Египет",
      icon: "🔺",
      desc: "Песок и сфинкс",
      skyTop: "#e8c878",
      skyBottom: "#c9953a",
      zombieSkyTop: "#5a3f1c",
      zombieSkyBottom: "#3a2810",
      house: "#a67c3a",
      houseDetail: "#d4b06a",
      cellLight: "rgba(255,230,150,0.18)",
      cellDark: "rgba(120,70,20,0.16)",
    },
    {
      id: "pirate",
      name: "Пиратские моря",
      icon: "🏴‍☠️",
      desc: "Доски и волны",
      skyTop: "#3aa0c8",
      skyBottom: "#1f6e8c",
      zombieSkyTop: "#1a3a48",
      zombieSkyBottom: "#0f2430",
      house: "#5a3a22",
      houseDetail: "#8a5a30",
      cellLight: "rgba(180,220,255,0.12)",
      cellDark: "rgba(20,50,70,0.18)",
    },
    {
      id: "west",
      name: "Дикий Запад",
      icon: "🌵",
      desc: "Пустыня и салун",
      skyTop: "#e0a45a",
      skyBottom: "#b86a2a",
      zombieSkyTop: "#4a3018",
      zombieSkyBottom: "#2a1a0c",
      house: "#7a4a22",
      houseDetail: "#a06a38",
      cellLight: "rgba(255,200,120,0.14)",
      cellDark: "rgba(90,40,10,0.16)",
    },
    {
      id: "frost",
      name: "Ледяные пещеры",
      icon: "❄️",
      desc: "Снег и лёд",
      skyTop: "#9ad8ff",
      skyBottom: "#4a8fc8",
      zombieSkyTop: "#1a3048",
      zombieSkyBottom: "#0e1c2e",
      house: "#5a7388",
      houseDetail: "#8aa8c0",
      cellLight: "rgba(220,240,255,0.2)",
      cellDark: "rgba(40,80,120,0.18)",
    },
    {
      id: "lostcity",
      name: "Затерянный город",
      icon: "🏛️",
      desc: "Джунгли и храм",
      skyTop: "#5db84a",
      skyBottom: "#2f7a28",
      zombieSkyTop: "#1a3018",
      zombieSkyBottom: "#0e1c0e",
      house: "#8a6a28",
      houseDetail: "#c9a227",
      cellLight: "rgba(180,255,140,0.12)",
      cellDark: "rgba(20,60,20,0.16)",
    },
    {
      id: "future",
      name: "Далёкое будущее",
      icon: "🛰️",
      desc: "Неон и металл",
      skyTop: "#5a8cff",
      skyBottom: "#2a4aa0",
      zombieSkyTop: "#1a2040",
      zombieSkyBottom: "#0c1028",
      house: "#3a4a68",
      houseDetail: "#6a90c8",
      cellLight: "rgba(140,180,255,0.16)",
      cellDark: "rgba(20,30,80,0.2)",
    },
    {
      id: "darkages",
      name: "Тёмные века",
      icon: "🏰",
      desc: "Замок и луна",
      skyTop: "#4a5a78",
      skyBottom: "#2a3048",
      zombieSkyTop: "#1a1e2e",
      zombieSkyBottom: "#0c0e18",
      house: "#3a3038",
      houseDetail: "#6a5868",
      cellLight: "rgba(160,150,190,0.12)",
      cellDark: "rgba(20,15,30,0.22)",
    },
    {
      id: "neon",
      name: "Неоновый тур",
      icon: "🎧",
      desc: "Диско и колонки",
      skyTop: "#c84ad8",
      skyBottom: "#4a2aa0",
      zombieSkyTop: "#2a1040",
      zombieSkyBottom: "#140820",
      house: "#4a2068",
      houseDetail: "#e85ad8",
      cellLight: "rgba(255,100,220,0.14)",
      cellDark: "rgba(60,20,120,0.2)",
    },
    {
      id: "jurassic",
      name: "Юрское болото",
      icon: "🌋",
      desc: "Вулкан и папоротники",
      skyTop: "#7a9840",
      skyBottom: "#3a5820",
      zombieSkyTop: "#2a3010",
      zombieSkyBottom: "#141808",
      house: "#5a4020",
      houseDetail: "#8a6030",
      cellLight: "rgba(180,220,80,0.14)",
      cellDark: "rgba(40,50,10,0.18)",
    },
    {
      id: "beach",
      name: "Большая волна",
      icon: "🏖️",
      desc: "Песок и пальмы",
      skyTop: "#4ec8e8",
      skyBottom: "#2a88b8",
      zombieSkyTop: "#1a4050",
      zombieSkyBottom: "#0e2430",
      house: "#c9a06a",
      houseDetail: "#e8c890",
      cellLight: "rgba(255,240,180,0.16)",
      cellDark: "rgba(40,120,140,0.14)",
    },
    {
      id: "china",
      name: "Китай",
      icon: "🏯",
      desc: "Кунг-фу мир",
      skyTop: "#d4543a",
      skyBottom: "#8a2818",
      zombieSkyTop: "#3a1810",
      zombieSkyBottom: "#1e0c08",
      house: "#6a2018",
      houseDetail: "#c9a227",
      cellLight: "rgba(255,180,120,0.14)",
      cellDark: "rgba(80,20,10,0.18)",
    },
  ];

  const state = {
    screen: "menu",
    side: null,
    worldId: "modern",
    levelIndex: 0,
    selectedUnit: null,
    resource: 0,
    time: 0,
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [],
    powderDrops: [],
    healingPowder: 0,
    fx: [],
    mowers: [],
    waveIndex: 0,
    wavesSpawned: 0,
    running: false,
    paused: false,
    timeFrozen: false,
    gameSpeed: 1,
    plantingMode: "single",
    won: false,
    lost: false,
    lastTs: 0,
    messageTimer: 0,
    aiTimer: 0,
    resourceTick: 0,
    zombieStarve: 0,
    helpSeen: false,
    movingPlant: null,
    unitReadyAt: {},
    freePlantCards: {},
    labMode: false,
    craters: [],
    forcefields: [],
    sunrollers: [],
  };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const els = {
    screens: {
      menu: document.getElementById("screen-menu"),
      howto: document.getElementById("screen-howto"),
      hybrids: document.getElementById("screen-hybrids"),
      side: document.getElementById("screen-side"),
      worlds: document.getElementById("screen-worlds"),
      levels: document.getElementById("screen-levels"),
      game: document.getElementById("screen-game"),
      result: document.getElementById("screen-result"),
    },
    sideLabel: document.getElementById("side-label"),
    worldList: document.getElementById("world-list"),
    hybridList: document.getElementById("hybrid-list"),
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
    btnTimeFreeze: document.getElementById("btn-time-freeze"),
    btnSpeed2: document.getElementById("btn-speed-2"),
    btnSpeed3: document.getElementById("btn-speed-3"),
    btnRowMode: document.getElementById("btn-row-mode"),
    labZombieControls: document.getElementById("lab-zombie-controls"),
    labZombieType: document.getElementById("lab-zombie-type"),
    labZombieRow: document.getElementById("lab-zombie-row"),
    btnLabSpawn: document.getElementById("btn-lab-spawn"),
    pauseOverlay: document.getElementById("pause-overlay"),
    btnResume: document.getElementById("btn-resume"),
    pauseMain: document.getElementById("pause-main"),
    pauseHybrids: document.getElementById("pause-hybrids"),
    pauseHybridList: document.getElementById("pause-hybrid-list"),
    btnPauseHybrids: document.getElementById("btn-pause-hybrids"),
    btnPauseHybridsBack: document.getElementById("btn-pause-hybrids-back"),
    btnPauseSound: document.getElementById("btn-pause-sound"),
    btnPauseMenu: document.getElementById("btn-pause-menu"),
    btnMute: document.getElementById("btn-mute"),
    btnMuteMenu: document.getElementById("btn-mute-menu"),
    btnVoiceHelp: document.getElementById("btn-voice-help"),
    btnSpeakHelp: document.getElementById("btn-speak-help"),
    btnLaboratory: document.getElementById("btn-laboratory"),
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
      hybrids:
        "Здесь показаны все гибриды. Объедини два указанных растения посадкой одного на другое или перчаткой.",
      side:
        "Выбери сторону. Нажми кнопку с подсолнухом, чтобы играть за растения. Или кнопку с зомби, чтобы играть за зомби.",
      worlds: "Выбери мир. Например, современность, Египет или Китай. Каждый мир меняет вид поля.",
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

  function currentWorld() {
    return (
      WORLDS.find((world) => world.id === state.worldId) || WORLDS[0]
    );
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

  const PIRATE_PLANK_ENDS = [4, 6, 3, 6, 4];

  function isPlantableCell(col, row, typeId = null) {
    if (currentWorld().id !== "pirate") return true;
    if (typeId && PLANT_TYPES[typeId]?.waterWalking) return true;
    const plankEnd = PIRATE_PLANK_ENDS[row] ?? 3;
    return col >= 0 && col <= plankEnd;
  }

  function unlockedPlants() {
    if (state.labMode || amalGod()) {
      return Object.values(PLANT_TYPES).filter(
        (p) => !p.titanArmor && p.id !== "giftbox"
      );
    }
    const lvl = currentLevel().id;
    return Object.values(PLANT_TYPES).filter((p) => p.unlock <= lvl);
  }

  function describeHybrid(type) {
    const abilities = [`${type.hp} здоровья`];
    if (type.doubleShot) abilities.push("двойной выстрел");
    else if (type.shotCount > 1)
      abilities.push(`${type.damage}×${type.shotCount} / ${type.shootEvery} сек`);
    else if (
      type.damage &&
      !type.calamityTurret &&
      !type.sniper &&
      !type.peaFountain &&
      !type.snapdragon &&
      !type.voltSnap &&
      !type.bonkChoy &&
      !type.stackable
    )
      abilities.push(`урон ${type.damage}`);
    if (type.slow) abilities.push("замедляет зомби");
    if (type.produce) abilities.push("производит солнце");
    if (type.id === "giantwallnut") abilities.push("самая крепкая скорлупа");
    if (type.nutFortress)
      abilities.push(
        "32000 здоровья · +4000 за каждый другой орех · тяжёлые удары наносят 500"
      );
    if (type.sakuraShooter)
      abilities.push(
        "900×4×3 / 2 сек · полноэкранный огонь при появлении и гибели · иммунитет к вишне"
      );
    if (type.cherryImmune && !type.sakuraShooter)
      abilities.push("иммунитет к вишнёвым взрывам");
    if (type.explosiveCherry)
      abilities.push(
        `${type.damage}${type.cherryShots > 1 ? `×${type.cherryShots}` : ""} / ${type.shootEvery} сек · взрыв 3×3`
      );
    if (type.starShooter)
      abilities.push(
        `${type.damage}×${type.starShots || 5} / ${type.shootEvery} сек${type.globalStars ? " · по всей карте" : " · 5 направлений"}${type.starMeteorEvery ? ` · метеор ${type.starMeteorDamage}` : ""}`
      );
    if (type.magnetDart)
      abilities.push("магнитные шипы · +урон по металлу · сбивает шары");
    if (type.tripleCatgirl)
      abilities.push(
        "огонь 3×4 клетки · 90 урона · стоит на воде"
      );
    if (type.giantChomper) abilities.push("глотает всех зомби рядом, даже гигантов");
    if (type.chewBite)
      abilities.push(
        `укус ${type.chewBiteDamage} · лечение ${type.chewBiteHeal} · пожирание каждые ${type.devourEvery}с`
      );
    if (type.spitWhileChewing)
      abilities.push(`сплёвывает куски по ${type.spitDamage} каждые ${type.spitEvery}с`);
    if (type.swallowSun) abilities.push(`+${type.swallowSun} солнц за глоток`);
    if (type.swallowHeal) abilities.push(`+${type.swallowHeal} HP за глоток`);
    if (type.biteBlast)
      abilities.push(`взрыв на ${type.biteBlast} при каждом глотке`);
    if (type.threeRowBite) abilities.push("хватает сразу из трёх рядов");
    if (type.chewFactor)
      abilities.push(`жуёт в ${Math.round(1 / type.chewFactor)} раза быстрее`);
    if (type.gatlingTurret && !type.calamityTurret)
      abilities.push("стреляет тройным залпом и разгоняется");
    if (type.calamityTurret)
      abilities.push(
        "урон 200(+300 к гигантам) · пробивает 3 · тает прочность · проклятие 0.5% · ультра 0.01%"
      );
    if (type.laserBean)
      abilities.push("синий лазер по всему ряду · 40 урона всем зомби · не блокируется");
    if (type.sniper)
      abilities.push(
        `${type.damage} урона по всей карте каждые 3 сек. · каждый 6-й выстрел убивает мгновенно`
      );
    if (type.id === "hurricanepea")
      abilities.push("быстрые двойные пробивающие залпы");
    if (type.titanArmor) abilities.push("титаническая броня");
    if (type.melonCannon) abilities.push("40 арбузов каждые 36 секунд");
    if (type.iceCannon) abilities.push("ледяные арбузы · замедление");
    if (type.nullifier)
      abilities.push(
        `при появлении: 1800 в 3×3 и 1800+${Math.round((type.nullifierPercent || 0.3) * 100)}% HP по всему полю · затем ${type.damage}×2 / ${type.shootEvery} сек с замедлением`
      );
    if (type.id === "sunnut")
      abilities.push("крепкий орех, даёт солнце");
    if (type.twinSolar)
      abilities.push(
        `удар ≤${type.damageCapFlat || 50} · +${type.sunOnHit || 15}☀️ за удар · клик за ${type.giantSunCost || 500}☀️ = Гигантский Солнцеорех`
      );
    if (type.id === "curseshroom")
      abilities.push("гипноз и взрыв после смерти зомби");
    if (type.allySummoner)
      abilities.push(
        `призывает союзника каждые ${type.summonEvery || 30} сек. · гипнотизирует до ${type.multiHypnoUses || 1} зомби${type.explosiveSummons ? " · союзники взрываются после гибели" : ""}`
      );
    if (type.id === "lurepumpkin")
      abilities.push("крадёт металл · чинит 500 · магнитный импульс");
    if (type.id === "neodymiumpumpkin")
      abilities.push(
        "8000 HP · сильный магнит · ремонт 500 · 35% урона от тяжёлых ударов"
      );
    if (type.id === "doomshroom")
      abilities.push("взрыв на 1800 урона · кратер на 20 сек");
    if (type.doomsdayShroom)
      abilities.push(
        "взрыв 1800 · 3 зачарованных рыцаря · зомбони у каждого зомби"
      );
    if (type.squash) abilities.push("прыгает и давит ближайшего зомби");
    if (type.tallNut) abilities.push("очень высокий и крепкий");
    if (type.mechaGuard)
      abilities.push("перехватывает урон соседей · ремонт металла 500");
    if (type.knockbackOnHit) abilities.push("отбрасывает зомби");
    if (type.footballPeaEvery)
      abilities.push(
        `каждый ${type.footballPeaEvery}-й выстрел разворачивает зомби`
      );
    if (type.doomVolleyUltimate)
      abilities.push("супер-залп 1800 каждые 4 очереди · пауза 4.5 сек");
    if (type.commandoUltimate)
      abilities.push("2% ультимейт: лечение, иммунитет и шквал");
    if (type.cherryResist)
      abilities.push(
        `получает ${Math.round(type.cherryResist * 100)}% урона от вишни`
      );
    if (type.peaFountain)
      abilities.push(
        `${type.damage}×${type.fountainShots || 36} / ${type.shootEvery} сек · 360° по всему полю`
      );
    if (type.holonut)
      abilities.push(
        `голограмма · полное восстановление через ${type.regenIdle || 15}с без урона · порошок = щит ${type.plantFoodShield}`
      );
    if (type.stackable)
      abilities.push(
        `сажай на себя до ${type.maxHeads || 5} головок · ${type.damage} урона × число головок`
      );
    if (type.snapdragon)
      abilities.push(
        type.coldSnap
          ? `ледяное дыхание ${type.breathCols || 2}×${(type.breathRows || 1) * 2 + 1} · замедление 50%`
          : `огненное дыхание ${type.breathCols || 3}×${(type.breathRows || 1) * 2 + 1}`
      );
    if (type.voltSnap)
      abilities.push(
        "электролуч до 9 клеток · урон растёт на одной цели · цепная молния"
      );
    if (type.bonkChoy)
      abilities.push(
        `${type.damage} урона кулаками каждые ${type.shootEvery}с · бьёт вперёд и назад`
      );
    if (type.peaMine)
      abilities.push(
        `вооружается ${type.armTime}с · стреляет · взрыв ${type.blastDamage} при наступании`
      );
    if (type.produceGrows)
      abilities.push(
        `${type.produce}☀️ → ${type.produceLarge}☀️ после ${type.matureAfter}с`
      );
    if (type.obsidianDragon)
      abilities.push(
        `обсидиановое дыхание ${type.breathCols}×${(type.breathRows || 1) * 2 + 1}`
      );
    if (type.blackHole)
      abilities.push(
        `затягивает зомби · ${type.voidDamage} урона / ${type.voidEvery}с`
      );
    if (type.iceFireGatling)
      abilities.push("парный залп: лёд (замедление) + огонь");
    if (type.melonCart)
      abilities.push(`арбузы ${type.damage} / ${type.shootEvery}с на тележке`);
    if (type.obsidianNut && type.tallNut)
      abilities.push("в 4 раза крепче Высокого ореха · 32000 HP");
    else if (type.obsidianNut && type.peaMine)
      abilities.push(
        `обсидиановая мина · взрыв ${type.blastDamage} · ${type.hp} HP`
      );
    else if (type.obsidianNut) abilities.push("кристаллический обсидиановый щит");
    if (type.flameNut) abilities.push(`жжёт кусающих (${type.thornDamage} урона)`);
    return abilities.join(" · ");
  }

  function describeIngredient(typeId) {
    const type = PLANT_TYPES[typeId];
    if (!type) return "";
    const how =
      type.cost >= 9999 || type.unlock >= 99
        ? "только скрещиванием"
        : `${type.cost} ☀️${type.unlock > 1 ? `, с ${type.unlock} уровня` : ""}`;
    return `${type.icon} ${type.name} (${how})`;
  }

  function buildHybridGuide() {
    if (!els.hybridList) return;
    const recipes = [];

    Object.values(PLANT_TYPES).forEach((source) => {
      if (source.fusesInto) {
        recipes.push({
          first: source.id,
          second: source.id,
          result: source.fusesInto,
        });
      }
    });

    Object.entries(HYBRID_RECIPES).forEach(([key, result]) => {
      // Порядок в карточке — как сажать: сначала первое, сверху второе
      const [first, second] = HYBRID_PLANT_ORDER[result] || key.split("+");
      recipes.push({ first, second, result });
    });

    TITAN_RECIPES.forEach(({ left, middle, right, result }) => {
      recipes.push({
        first: left,
        second: middle,
        third: right,
        catalyst: "jicamagicker",
        result,
      });
    });

    els.hybridList.innerHTML = recipes
      .map(({ first, second, third, catalyst, result }) => {
        const firstType = PLANT_TYPES[first];
        const secondType = PLANT_TYPES[second];
        const thirdType = third && PLANT_TYPES[third];
        const catalystType = catalyst && PLANT_TYPES[catalyst];
        const resultType = PLANT_TYPES[result];
        const ingredients = [first, second, third, catalyst]
          .filter(Boolean)
          .filter((id, index, all) => all.indexOf(id) === index)
          .map(describeIngredient)
          .join(" · ");
        const steps = HYBRID_STEPS[result];
        return `
          <article class="hybrid-card${
            result === "doomsdayshroom" ||
            result === "calamityturret" ||
            result === "peafountain" ||
            result === "nullifier"
              ? " hybrid-card-featured"
              : ""
          }">
            <div class="hybrid-formula">
              <span title="${firstType.name}">${firstType.icon}</span>
              <span>+</span>
              <span title="${secondType.name}">${secondType.icon}</span>
              ${
                thirdType
                  ? `<span>+</span><span title="${thirdType.name}">${thirdType.icon}</span>`
                  : ""
              }
              ${
                catalystType
                  ? `<span>+</span><span title="${catalystType.name}">${catalystType.icon}</span>`
                  : ""
              }
              <span>→</span>
              <span title="${resultType.name}">${resultType.icon}</span>
            </div>
            <h3>${resultType.name}</h3>
            <p>${
              thirdType
                ? `${firstType.name} + ${secondType.name} + ${thirdType.name} + ${catalystType.name}`
                : `${firstType.name} + ${secondType.name}`
            }</p>
            <p>${describeHybrid(resultType)}</p>
            <p class="hybrid-need">Нужно: ${ingredients}</p>
            ${
              steps
                ? `<ol class="hybrid-steps">${steps
                    .map((step) => `<li>${step}</li>`)
                    .join("")}</ol>`
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  function buildWorlds() {
    if (!els.worldList) return;
    els.worldList.innerHTML = "";
    WORLDS.forEach((world) => {
      const btn = document.createElement("button");
      btn.className = "world-btn";
      if (state.worldId === world.id) btn.classList.add("selected");
      btn.innerHTML = `
        <span class="world-icon">${world.icon}</span>
        <span class="world-name">${world.name}</span>
        <span class="world-desc">${world.desc}</span>
      `;
      btn.addEventListener("click", () => {
        AudioFX.unlock();
        AudioFX.click();
        state.worldId = world.id;
        buildLevels();
        showScreen("levels");
        speakInstruction("levels");
      });
      els.worldList.appendChild(btn);
    });
  }

  function buildLevels() {
    const world = currentWorld();
    els.sideLabel.textContent =
      (state.side === "plants"
        ? "Сторона: растения 🌱"
        : "Сторона: зомби 🧟") +
      ` · Мир: ${world.icon} ${world.name}`;

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
      state.side === "plants"
        ? unlockedPlants()
        : Object.values(ZOMBIE_TYPES).filter((z) =>
            amalGod() || state.labMode
              ? true
              : !z.knight && !z.zomboni && !z.boss
          );
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
        const cooldownLeft = state.labMode
          ? 0
          : Math.max(0, (state.unitReadyAt[unit.id] || 0) - state.time);
        if (cooldownLeft > 0) {
          toast(`Перезарядка: ${Math.ceil(cooldownLeft)} сек.`);
          return;
        }
        if (!state.labMode && state.resource < unit.cost) {
          toast("Не хватает ресурсов!");
          return;
        }
        AudioFX.click();
        state.selectedUnit = unit.id;
        [...els.unitBar.children].forEach((c) => c.classList.remove("selected"));
        btn.classList.add("selected");
        if (unit.fusesInto || hasHybridRecipe(unit.id)) {
          toast("Гибрид: посади подходящее растение на другое");
        } else if (unit.titanCatalyst) {
          toast("Поставь скрещиватель на среднее из трёх растений");
        }
      });
      els.unitBar.appendChild(btn);
    });

    if (state.side === "plants") {
      [
        {
          id: "__powder",
          icon: "✨",
          name: "Лечебный порошок",
          hint: "Многоразово восстанавливает здоровье без перезарядки",
          costText: state.labMode
            ? "∞"
            : state.healingPowder > 0
              ? "готов"
              : "нет",
        },
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
          <span class="cost">${tool.costText || "бесплатно"}</span>
        `;
        btn.addEventListener("click", () => {
          AudioFX.unlock();
          if (
            tool.id === "__powder" &&
            !state.labMode &&
            state.healingPowder <= 0
          ) {
            toast("Сначала подбери порошок, выпавший из зомби");
            return;
          }
          AudioFX.click();
          state.selectedUnit = tool.id;
          state.movingPlant = null;
          [...els.unitBar.children].forEach((c) =>
            c.classList.remove("selected")
          );
          btn.classList.add("selected");
          if (tool.id === "__glove") {
            toast("Нажми растение, затем новую клетку");
          } else if (tool.id === "__powder") {
            toast("Нажми на повреждённое растение, чтобы вылечить его");
          } else {
            toast("Нажми растение, которое нужно убрать");
          }
        });
        els.unitBar.appendChild(btn);
      });

      Object.entries(state.freePlantCards).forEach(([typeId, count]) => {
        const cardType = PLANT_TYPES[typeId];
        if (!cardType || count <= 0) return;
        const btn = document.createElement("button");
        btn.className = "unit-btn card-btn";
        btn.dataset.id = typeId;
        btn.dataset.card = "1";
        btn.title = `Готовая карточка: ${cardType.name}`;
        btn.innerHTML = `
          <span class="icon">${cardType.icon}</span>
          <span class="name">${cardType.name}</span>
          <span class="cost">карточка ×${count}</span>
        `;
        if (state.selectedUnit === typeId) btn.classList.add("selected");
        btn.addEventListener("click", () => {
          AudioFX.unlock();
          AudioFX.click();
          state.selectedUnit = typeId;
          state.movingPlant = null;
          [...els.unitBar.children].forEach((c) =>
            c.classList.remove("selected")
          );
          btn.classList.add("selected");
          toast("Поставь карточку на любую свободную клетку");
        });
        els.unitBar.appendChild(btn);
      });
    }
    updateUnitBar();
  }

  function updateUnitBar() {
    const types = state.side === "plants" ? PLANT_TYPES : ZOMBIE_TYPES;
    [...els.unitBar.children].forEach((btn) => {
      if (btn.dataset.card) return;
      if (btn.dataset.id === "__powder") {
        const available = state.labMode || state.healingPowder > 0;
        btn.classList.toggle("disabled", !available);
        const cost = btn.querySelector(".cost");
        if (cost) {
          cost.textContent = state.labMode
            ? "∞"
            : state.healingPowder > 0
              ? "готов"
              : "нет";
        }
        return;
      }
      const unit = types[btn.dataset.id];
      if (!unit) return;
      const cooldownLeft = state.labMode
        ? 0
        : Math.max(0, (state.unitReadyAt[unit.id] || 0) - state.time);
      btn.classList.toggle(
        "disabled",
        (!state.labMode && state.resource < unit.cost) || cooldownLeft > 0
      );
      const cost = btn.querySelector(".cost");
      if (cost) {
        cost.textContent =
          cooldownLeft > 0
            ? `⏳ ${Math.ceil(cooldownLeft)} сек.`
            : `${unit.cost} ${state.side === "plants" ? "☀️" : "🧠"}`;
      }
    });
  }

  function syncLabZombieControls() {
    if (!els.labZombieControls) return;
    els.labZombieControls.classList.toggle("hidden", !state.labMode);
    if (!state.labMode) return;

    if (els.labZombieType && !els.labZombieType.dataset.ready) {
      els.labZombieType.innerHTML = Object.values(ZOMBIE_TYPES)
        .map(
          (type) =>
            `<option value="${type.id}">${type.icon} ${type.name} — ${type.hp} HP</option>`
        )
        .join("");
      els.labZombieType.dataset.ready = "1";
    }

    if (els.labZombieRow) {
      const signature = `${rowOffset()}:${activeRows()}`;
      if (els.labZombieRow.dataset.signature !== signature) {
        els.labZombieRow.innerHTML = Array.from(
          { length: activeRows() },
          (_, index) => {
            const row = rowOffset() + index;
            return `<option value="${row}">${index + 1}</option>`;
          }
        ).join("");
        els.labZombieRow.dataset.signature = signature;
      }
    }
  }

  function spawnLabTestZombie() {
    if (!state.labMode || !state.running) return;
    const typeId = els.labZombieType?.value;
    const row = Number(els.labZombieRow?.value);
    const type = ZOMBIE_TYPES[typeId];
    if (!type || !Number.isInteger(row)) return;

    if (spawnZombie(typeId, row, false)) {
      AudioFX.unlock();
      AudioFX.zombie();
      toast(`${type.icon} ${type.name}: ${type.hp} HP, ряд ${row - rowOffset() + 1}`);
    }
  }

  function updateHud() {
    const level = currentLevel();
    syncLabZombieControls();
    els.hudLevel.textContent = state.labMode
      ? "🧪 Лаборатория гибридов"
      : `${currentWorld().icon} ${level.name}`;
    els.hudSide.textContent = state.labMode
      ? "Без зомби"
      : state.side === "plants"
        ? "Растения"
        : "Зомби";
    els.resourceIcon.textContent = state.side === "plants" ? "☀️" : "🧠";
    els.resourceValue.textContent = state.labMode
      ? "∞"
      : Math.floor(state.resource);
    if (state.labMode) {
      els.waveValue.parentElement.style.display = "none";
    } else if (state.side === "plants") {
      els.waveValue.textContent = Math.min(state.wavesSpawned + 1, level.waves.length);
      els.waveMax.textContent = String(level.waves.length);
      els.waveValue.parentElement.style.display = "";
    } else {
      els.waveValue.parentElement.style.display = "none";
    }
    els.gameTip.textContent = state.labMode
      ? "Все гибриды в панели сверху — сажай сразу. Справа можно выпускать зомби для тестов."
      : state.side === "plants"
        ? "Солнце (жёлтый круг) — кликни. Потом растение сверху → клетка на поле."
        : "Зомби сверху → клик по ряду справа. Цель: дойти до дома слева.";
    if (els.guideBar) {
      els.guideBar.textContent = state.labMode
        ? "🧪 Готовые гибриды уже на поле и в панели — сажай без скрещивания, тестируй на зомби"
        : state.side === "plants"
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
    state.powderDrops = [];
    state.healingPowder = 0;
    state.fx = [];
    state.mowers = [];
    state.craters = [];
    state.forcefields = [];
    state.sunrollers = [];
    state.waveIndex = 0;
    state.wavesSpawned = 0;
    state.time = 0;
    state.timeFrozen = false;
    state.gameSpeed = 1;
    state.plantingMode = "single";
    syncTimeFreezeButton();
    syncSpeedButtons();
    syncRowModeButton();
    state.resource =
      state.side === "zombies"
        ? level.zombieStartResource ?? level.startResource
        : 2000;
    if (amalGod()) state.resource = 999999;
    state.selectedUnit = null;
    state.running = true;
    state.paused = false;
    state.won = false;
    state.lost = false;
    state.aiTimer = 0;
    state.resourceTick = 0;
    state.zombieStarve = 0;
    state.movingPlant = null;
    state.unitReadyAt = {};
    state.freePlantCards = {};
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
      state.mowers.push(createMower(row));
    }
  }

  function createMower(row) {
    return {
      row,
      x: LEFT - 28,
      y: cellCenter(0, row).y,
      used: false,
      active: false,
      speed: 320,
    };
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
    if (!isPlantableCell(col, row, typeId)) return false;
    if (state.craters.some((c) => c.col === col && c.row === row && c.timer > 0))
      return false;
    if (state.plants.some((p) => p.col === col && p.row === row)) return false;
    if (!free && !state.labMode && !amalGod() && state.resource < type.cost) return false;

    if (!free) {
      if (!state.labMode && !amalGod()) state.resource -= type.cost;
      if (type.recharge && !state.labMode && !amalGod()) {
        state.unitReadyAt[typeId] = state.time + type.recharge;
      }
    }

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
      chewing: false,
      chewTimer: 0,
      pullsLeft: type.pulls || 0,
      submergeTimer: 0,
      gatlingCharge: 0,
      magnetTimer: 0,
      magnetPulseTimer: type.magnetPulseEvery || 0,
      armorHp: 0,
      maxArmorHp: 0,
      giftTimer: type.giftGrowTime || 0,
      summonTimer: type.summonEvery || 0,
      hypnoUsesLeft: type.multiHypnoUses || 1,
      meteorTimer: type.starMeteorEvery || 0,
      shotSerial: 0,
      volleyCount: 0,
      ultimateTimer: 0,
      invulnTimer: 0,
      heads: type.stackable ? 1 : 0,
      holoBroken: false,
      noDamageTimer: 0,
      voltCharge: 0,
      voltTargetId: null,
      bonkFrenzy: 0,
      dead: false,
    });
    if (!free) AudioFX.plant();
    if (type.screenFlames) {
      const planted = state.plants[state.plants.length - 1];
      triggerSakuraScreenFlames(planted, type.blastDamage || 500);
      toast("🌸 Полноэкранный огонь сакуры!");
    }
    return true;
  }

  function useJicamagicker(centerPlant) {
    const catalyst = PLANT_TYPES.jicamagicker;
    const cooldownLeft = state.labMode
      ? 0
      : Math.max(0, (state.unitReadyAt.jicamagicker || 0) - state.time);
    if (cooldownLeft > 0) {
      toast(`Скрещиватель заряжается ещё ${Math.ceil(cooldownLeft)} сек.`);
      return false;
    }
    if (!state.labMode && state.resource < catalyst.cost) {
      toast("Нужно 50 солнц для скрещивания");
      return false;
    }

    const leftPlant = state.plants.find(
      (p) => p.row === centerPlant.row && p.col === centerPlant.col - 1
    );
    const rightPlant = state.plants.find(
      (p) => p.row === centerPlant.row && p.col === centerPlant.col + 1
    );
    const recipe =
      leftPlant &&
      rightPlant &&
      TITAN_RECIPES.find(
        ({ left, middle, right }) =>
          leftPlant.typeId === left &&
          centerPlant.typeId === middle &&
          rightPlant.typeId === right
      );
    const resultTypeId = recipe ? recipe.result : null;
    const resultType = resultTypeId && PLANT_TYPES[resultTypeId];

    if (!resultType) {
      toast(
        "Нужна верная цепочка из трёх растений. Скрещиватель — только на центральное"
      );
      return false;
    }

    if (!state.labMode) state.resource -= catalyst.cost;
    if (!state.labMode) {
      state.unitReadyAt.jicamagicker = state.time + catalyst.recharge;
    }
    state.plants = state.plants.filter(
      (p) => p !== leftPlant && p !== centerPlant && p !== rightPlant
    );
    state.freePlantCards[resultTypeId] =
      (state.freePlantCards[resultTypeId] || 0) + 1;
    state.selectedUnit = resultTypeId;
    buildUnitBar();

    addExplosion(centerPlant.x, centerPlant.y, "#f4e59b", 0.8);
    AudioFX.plant();
    toast(
      `Карточка создана: ${resultType.name}! Теперь поставь её на поле бесплатно`
    );
    return true;
  }

  function fusePlants(target, sourceTypeId, sourcePlant = null) {
    if (!target) return false;
    const resultTypeId = fusionResultType(target.typeId, sourceTypeId);
    const resultType = resultTypeId && PLANT_TYPES[resultTypeId];
    if (!resultType) return false;
    if (sourcePlant && sourcePlant === target) return false;

    if (sourcePlant) {
      state.plants = state.plants.filter((p) => p !== sourcePlant);
    }

    target.typeId = resultType.id;
    target.hp = resultType.hp;
    target.maxHp = resultType.hp;
    target.timer = 0;
    target.shootTimer = 0.5;
    target.armed = !resultType.armTime;
    target.armTimer = resultType.armTime || 0;
    target.fuse = resultType.fuse || 0;
    target.lifeTimer = resultType.lifeTime || 0;
    target.gatlingCharge = 0;
    target.magnetTimer = 0;
    target.magnetPulseTimer = resultType.magnetPulseEvery || 0;
    target.armorHp = 0;
    target.maxArmorHp = 0;
    target.summonTimer = resultType.summonEvery || 0;
    target.hypnoUsesLeft = resultType.multiHypnoUses || 1;
    target.meteorTimer = resultType.starMeteorEvery || 0;
    target.dead = false;

    addExplosion(target.x, target.y, "#f5c842", 0.55);
    AudioFX.plant();
    toast(`Гибрид готов: ${resultType.name}!`);
    if (resultType.screenFlames) {
      triggerSakuraScreenFlames(target, resultType.blastDamage || 500);
      toast("🌸 Полноэкранный огонь сакуры!");
    }
    if (resultType.fusionBlast) {
      triggerDoomBlast(target.x, target.y, resultType.fusionBlast, 1.5, {
        cherryExplosion: true,
      });
    }
    if (resultType.nullifier) {
      triggerNullifierBurst(target, resultType);
    }
    return true;
  }

  function triggerNullifierBurst(plant, type) {
    const burst = type.nullifierBurst || 1800;
    const percent = type.nullifierPercent || 0.3;
    triggerDoomBlast(plant.x, plant.y, burst, 1.5, {});
    state.zombies.forEach((z) => {
      if (z.charmed || z.hp <= 0) return;
      z.hp -= burst + z.maxHp * percent;
      z.slowFactor = 0.35;
      z.slowTimer = Math.max(z.slowTimer || 0, 6);
      addExplosion(z.x, z.y, "#5ee7ff", 0.35);
    });
    addExplosion(plant.x, plant.y, "#1a2040", 1.1);
    addExplosion(plant.x, plant.y, "#5ee7ff", 0.7);
    AudioFX.explode();
    toast("Обнулитель: уничтожение всего поля!");
  }

  function trySummonGiantSunNut(plant) {
    const type = PLANT_TYPES[plant.typeId];
    if (!type?.twinSolar) return false;
    const cost = type.giantSunCost || 500;
    if (!state.labMode && state.resource < cost) {
      toast(`Нужно ${cost}☀️ для Гигантского Солнцеореха`);
      return false;
    }
    if (!state.labMode) state.resource -= cost;
    plant.hp = plant.maxHp;
    plant.holoBroken = false;

    const waiting = state.sunrollers.find(
      (r) => r.owner === plant && !r.rolling && r.row === plant.row
    );
    if (waiting) {
      waiting.taps = Math.min(10, (waiting.taps || 1) + 1);
      waiting.waitTimer = 1;
      waiting.scale = 1 + Math.min(3, waiting.taps - 1) * 0.22;
      toast(`Гигантский Солнцеорех усилен (×${waiting.taps})!`);
    } else {
      state.sunrollers.push({
        owner: plant,
        row: plant.row,
        x: plant.x + CELL_W * 0.85,
        y: plant.y,
        taps: 1,
        waitTimer: 1,
        rolling: false,
        speed: 110,
        scale: 1,
        hitIds: new Set(),
      });
      toast("Гигантский Солнцеорех готов катиться!");
    }
    addExplosion(plant.x, plant.y, "#ffe45c", 0.55);
    AudioFX.sun();
    updateHud();
    return true;
  }

  function giantSunDamage(taps) {
    if (taps >= 3) return 1200;
    if (taps === 2) return 800;
    return 400;
  }

  function updateSunrollers(dt) {
    state.sunrollers.forEach((roller) => {
      if (!roller.rolling) {
        roller.waitTimer -= dt;
        if (roller.waitTimer <= 0) roller.rolling = true;
        return;
      }
      roller.x += roller.speed * dt;
      const dps = giantSunDamage(roller.taps || 1);
      state.zombies.forEach((z) => {
        if (
          z.charmed ||
          z.ballooned ||
          z.hp <= 0 ||
          z.row !== roller.row ||
          Math.abs(z.x - roller.x) > 36 * (roller.scale || 1)
        ) {
          return;
        }
        z.hp -= dps * dt;
        if (!roller.hitIds.has(z)) {
          roller.hitIds.add(z);
          addExplosion(z.x, z.y, "#ffe45c", 0.25);
          AudioFX.hit();
        }
      });
    });
    state.sunrollers = state.sunrollers.filter(
      (r) => r.x < canvas.width + 80
    );
  }

  function drawSunrollers() {
    state.sunrollers.forEach((roller) => {
      const s = roller.scale || 1;
      ctx.save();
      ctx.translate(roller.x, roller.y);
      ctx.scale(s, s);
      if (!roller.rolling) {
        ctx.globalAlpha = 0.75 + Math.sin(state.time * 8) * 0.15;
      }
      const body = ctx.createRadialGradient(-6, -8, 4, 0, 0, 28);
      body.addColorStop(0, "#ffe98a");
      body.addColorStop(0.55, "#f0c840");
      body.addColorStop(1, "#b8861a");
      ctx.fillStyle = body;
      ctx.strokeStyle = "#7a5010";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5a3a10";
      ctx.beginPath();
      ctx.arc(-7, -4, 3, 0, Math.PI * 2);
      ctx.arc(7, -4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5a3a10";
      ctx.beginPath();
      ctx.arc(0, 6, 8, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.fillStyle = "#ffe45c";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + state.time;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 16);
        ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 25);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function spawnZombie(typeId, row, fromPlayer = false) {
    const type = ZOMBIE_TYPES[typeId];
    if (!type) return false;
    if (row < rowOffset() || row >= rowOffset() + activeRows()) return false;
    if (fromPlayer) {
      if (!amalGod() && state.resource < type.cost) return false;
      if (!amalGod()) state.resource -= type.cost;
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
      poisonTimer: 0,
      poisonDps: 0,
      stunTimer: 0,
      fleeTimer: 0,
      metalStripped: false,
      ballooned: !!type.balloonZombie,
      charmed: false,
      curseBomb: false,
    });
    if (fromPlayer) AudioFX.zombie();
    return true;
  }

  function spawnCharmedAlly(typeId, row, x) {
    const type = ZOMBIE_TYPES[typeId];
    if (!type) return null;
    const ally = {
      typeId,
      row,
      x,
      y: cellCenter(0, row).y,
      hp: type.hp,
      maxHp: type.hp,
      biteTimer: 0,
      eating: false,
      slowTimer: 0,
      slowFactor: 1,
      poisonTimer: 0,
      poisonDps: 0,
      stunTimer: 0,
      metalStripped: false,
      charmed: true,
      curseBomb: false,
    };
    state.zombies.push(ally);
    return ally;
  }

  function charmZombie(zombie, withCurseBomb = false) {
    if (!zombie || zombie.charmed || zombie.hp <= 0) return;
    zombie.charmed = true;
    zombie.curseBomb = !!withCurseBomb;
    zombie.eating = false;
    zombie.stunTimer = 0;
    addExplosion(zombie.x, zombie.y - 10, "#c48bff", 0.45);
  }

  function summonHypnoAlly(plant, type) {
    const pool = type.summonPool || ["normal"];
    const typeId = pool[Math.floor(Math.random() * pool.length)];
    const row = Math.max(
      rowOffset(),
      Math.min(rowOffset() + activeRows() - 1, plant.row)
    );
    const ally = spawnCharmedAlly(
      typeId,
      row,
      Math.max(LEFT - 25, plant.x - 35)
    );
    if (!ally) return;
    ally.curseBomb = !!type.explosiveSummons;
    addExplosion(
      plant.x,
      plant.y - 12,
      type.explosiveSummons ? "#ff4d6d" : "#c48bff",
      0.65
    );
    addExplosion(ally.x, ally.y - 10, "#a078ff", 0.45);
    AudioFX.zombie();
    toast(
      type.explosiveSummons
        ? `🍒 Императрица призвала союзного подрывника: ${ZOMBIE_TYPES[typeId].name}!`
        : `👑 Гипнолия призвала союзника: ${ZOMBIE_TYPES[typeId].name}!`
    );
  }

  function countMagneticSystem() {
    return state.plants.filter(
      (plant) =>
        !plant.dead &&
        plant.hp > 0 &&
        PLANT_TYPES[plant.typeId]?.magneticSystem
    ).length;
  }

  function repairPlantWithMetal(plant, type) {
    const heal = type.metalRepair || 0;
    if (!heal || plant.hp >= plant.maxHp) return false;
    plant.hp = Math.min(plant.maxHp, plant.hp + heal);
    addExplosion(plant.x, plant.y - 8, "#7cf0ff", 0.4);
    toast(`🧲 +${heal} прочности: ${type.name}`);
    return true;
  }

  function updateMagnetPulse(plant, type, dt) {
    if (!type.magnetPulseEvery) return;
    plant.magnetPulseTimer =
      (plant.magnetPulseTimer ?? type.magnetPulseEvery) - dt;
    if (plant.magnetPulseTimer > 0) return;
    plant.magnetPulseTimer = type.magnetPulseEvery;
    const magnets = Math.max(1, countMagneticSystem());
    const base = type.magnetPulseDamage || 20;
    let hits = 0;
    state.zombies.forEach((zombie) => {
      if (
        zombie.charmed ||
        zombie.ballooned ||
        zombie.hp <= 0 ||
        Math.abs(zombie.row - plant.row) > 1 ||
        Math.abs(zombie.x - plant.x) > CELL_W * 2.5
      ) {
        return;
      }
      const metal =
        !zombie.metalStripped &&
        (zombie.typeId === "bucket" ||
          zombie.typeId === "tank" ||
          zombie.typeId === "zomboni" ||
          zombie.typeId === "obsidiangladiator" ||
          zombie.typeId === "knight");
      if (!metal) return;
      const speed = ZOMBIE_TYPES[zombie.typeId]?.speed || 18;
      zombie.hp -= base * magnets * (speed / 18);
      hits += 1;
      addExplosion(zombie.x, zombie.y - 8, "#5ee7ff", 0.22);
    });
    if (hits) {
      addExplosion(plant.x, plant.y - 14, "#8af7ff", 0.35);
      AudioFX.hit();
    }
  }

  function absorbCherryExplosion(x, y) {
    const lara = state.plants
      .filter(
        (plant) =>
          !plant.dead &&
          plant.hp > 0 &&
          PLANT_TYPES[plant.typeId]?.cherryAbsorber
      )
      .sort(
        (first, second) =>
          Math.hypot(first.x - x, first.y - y) -
          Math.hypot(second.x - x, second.y - y)
      )[0];
    if (!lara) return false;
    const reward = PLANT_TYPES[lara.typeId].absorbSun || 100;
    if (!state.labMode) state.resource += reward;
    addExplosion(lara.x, lara.y - 12, "#fff2a3", 0.7);
    addExplosion(lara.x, lara.y - 12, "#ff5a3d", 0.45);
    updateHud();
    toast(
      state.labMode
        ? "🌺 Лара поглотила вишнёвый взрыв!"
        : `🌺 Лара поглотила взрыв: +${reward} солнц!`
    );
    return true;
  }

  function triggerDoomBlast(x, y, damage, radiusCells, options = {}) {
    const radius = radiusCells * CELL_W + 20;
    const victims = state.zombies.filter(
      (z) =>
        !z.charmed &&
        z.hp > 0 &&
        Math.abs(z.x - x) * Math.abs(z.x - x) +
          Math.abs(z.y - y) * Math.abs(z.y - y) <=
          radius * radius
    );

    if (options.doomsday) {
      const startRow = rowOffset();
      const endRow = startRow + activeRows() - 1;
      const centerRow =
        options.originRow != null
          ? options.originRow
          : Math.max(startRow, Math.min(endRow, Math.floor((y - TOP) / CELL_H)));
      for (let i = 0; i < 3; i++) {
        const knightRow = Math.max(
          startRow,
          Math.min(endRow, centerRow + (i - 1))
        );
        spawnCharmedAlly("knight", knightRow, x + 24 + i * 20);
      }
      victims.forEach((z) => {
        spawnCharmedAlly("zomboni", z.row, z.x + 20);
      });
      toast("Конец света: рыцари и зомбони на поле!");
    }

    if (options.charmVictims) {
      victims.forEach((z) => charmZombie(z, !!options.curseBomb));
    } else {
      victims.forEach((z) => {
        z.hp -= damage;
      });
    }

    addExplosion(x, y, "#2a1018", 0.85);
    addExplosion(x - 40, y - 20, "#ff2a2a", 0.55);
    addExplosion(x + 35, y + 15, "#ff6a2a", 0.5);
    if (options.cherryExplosion) {
      absorbCherryExplosion(x, y);
    }
    AudioFX.explode();
  }

  function addExplosion(x, y, color, life = 0.45) {
    state.fx.push({ x, y, color, life, maxLife: life, r: 20 });
  }

  function damageZombiesInRadius(x, y, radius, damage) {
    state.zombies.forEach((z) => {
      if (z.charmed || z.hp <= 0) return;
      const dx = z.x - x;
      const dy = z.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        z.hp -= damage;
      }
    });
  }

  function clearRow(row, damage) {
    state.zombies.forEach((z) => {
      if (!z.charmed && z.row === row) z.hp -= damage;
    });
  }

  function triggerSakuraScreenFlames(source = null, damage = 500) {
    const startRow = rowOffset();
    const endRow = startRow + activeRows();
    for (let r = startRow; r < endRow; r++) {
      clearRow(r, damage);
      for (let c = 0; c < COLS; c++) {
        const pos = cellCenter(c, r);
        addExplosion(pos.x, pos.y, "#ff2a2a", 0.5);
        addExplosion(pos.x + 10, pos.y - 12, "#ff8a2a", 0.35);
      }
    }
    if (source) {
      addExplosion(source.x, source.y - 8, "#ffd24d", 0.7);
      absorbCherryExplosion(source.x, source.y);
    }
    AudioFX.explode();
  }

  function fireSakuraVolley(plant, type) {
    const lanes = [plant.row - 1, plant.row, plant.row + 1].filter(
      (row) => row >= rowOffset() && row < rowOffset() + activeRows()
    );
    const shots = type.sakuraShots || 4;
    lanes.forEach((row, laneIndex) => {
      for (let shot = 0; shot < shots; shot++) {
        firePea(
          plant,
          type,
          laneIndex * 0.04 + shot * 0.07,
          row,
          (shot - (shots - 1) / 2) * 4
        );
      }
    });
  }

  function showPauseMain() {
    if (els.pauseMain) els.pauseMain.classList.remove("hidden");
    if (els.pauseHybrids) els.pauseHybrids.classList.add("hidden");
  }

  function showPauseHybridGuide() {
    buildHybridGuide();
    if (els.pauseHybridList && els.hybridList) {
      els.pauseHybridList.innerHTML = els.hybridList.innerHTML;
    }
    if (els.pauseMain) els.pauseMain.classList.add("hidden");
    if (els.pauseHybrids) els.pauseHybrids.classList.remove("hidden");
    AudioFX.click();
  }

  function pauseGame() {
    if (!state.running || state.screen !== "game") return;
    AudioFX.click();
    state.running = false;
    state.paused = true;
    AudioFX.stopMusic();
    syncMuteButtons();
    showPauseMain();
    els.pauseOverlay.classList.remove("hidden");
  }

  function syncTimeFreezeButton() {
    if (!els.btnTimeFreeze) return;
    els.btnTimeFreeze.classList.toggle("active", state.timeFrozen);
    els.btnTimeFreeze.setAttribute("aria-pressed", String(state.timeFrozen));
    els.btnTimeFreeze.textContent = state.timeFrozen
      ? "▶ Разморозить время"
      : "🧊 Заморозить время";
  }

  function toggleTimeFreeze() {
    if (!state.running || state.screen !== "game") return;
    state.timeFrozen = !state.timeFrozen;
    syncTimeFreezeButton();
    AudioFX.unlock();
    AudioFX.click();
    toast(
      state.timeFrozen
        ? "Время заморожено — можно спокойно расставлять растения"
        : "Время снова идёт!"
    );
  }

  function syncSpeedButtons() {
    [
      [els.btnSpeed2, 2],
      [els.btnSpeed3, 3],
    ].forEach(([button, speed]) => {
      if (!button) return;
      const active = state.gameSpeed === speed;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function toggleGameSpeed(speed) {
    if (!state.running || state.screen !== "game") return;
    state.gameSpeed = state.gameSpeed === speed ? 1 : speed;
    syncSpeedButtons();
    AudioFX.unlock();
    AudioFX.click();
    toast(`Скорость игры: ×${state.gameSpeed}`);
  }

  function syncRowModeButton() {
    if (!els.btnRowMode) return;
    els.btnRowMode.style.display = state.side === "plants" ? "" : "none";
    const mode = state.plantingMode;
    els.btnRowMode.classList.toggle("active", mode !== "single");
    els.btnRowMode.setAttribute("aria-pressed", String(mode !== "single"));
    els.btnRowMode.dataset.mode = mode;
    els.btnRowMode.textContent =
      mode === "row"
        ? "↔ Весь ряд"
        : mode === "column"
          ? "↕ Весь столбец"
          : "🌱 По одному";
  }

  function toggleRowPlanting() {
    if (!state.running || state.screen !== "game" || state.side !== "plants") {
      return;
    }
    state.plantingMode =
      state.plantingMode === "single"
        ? "row"
        : state.plantingMode === "row"
          ? "column"
          : "single";
    syncRowModeButton();
    AudioFX.unlock();
    AudioFX.click();
    const message =
      state.plantingMode === "row"
        ? "Режим «Весь ряд»: нажми на нужную строку"
        : state.plantingMode === "column"
          ? "Режим «Весь столбец»: нажми на нужную колонку"
          : "Режим «По одному»: обычная посадка";
    toast(message);
  }

  function resumeGame() {
    if (!state.paused) return;
    els.pauseOverlay.classList.add("hidden");
    showPauseMain();
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
    showPauseMain();
    showScreen("menu");
    if (!AudioFX.muted) AudioFX.startMusic();
  }

  function startLevel(index) {
    state.labMode = false;
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

  function startLaboratory() {
    state.labMode = true;
    state.side = "plants";
    state.worldId = "modern";
    state.levelIndex = LEVELS.length - 1;
    resetBattle();
    state.labMode = true;
    state.resource = 999999;
    state.unitReadyAt = {};
    state.zombies = [];
    state.projectiles = [];
    seedLaboratoryField();
    buildUnitBar();
    updateHud();
    showScreen("game");
    if (els.pauseOverlay) els.pauseOverlay.classList.add("hidden");
    state.running = true;
    state.paused = false;
    state.lastTs = 0;
    toast("Лаборатория: все гибриды уже в панели — сажай напрямую!");
    AudioFX.plant();
    requestAnimationFrame(loop);
  }

  function seedLaboratoryField() {
    const showcase = [
      ["sunflower", 0, 0],
      ["peashooter", 1, 0],
      ["wallnut", 2, 0],
      ["tallnut", 3, 0],
      ["infinut", 4, 0],
      ["doublesunnut", 5, 0],
      ["squash", 0, 1],
      ["bonkchoy", 1, 1],
      ["snapdragon", 2, 1],
      ["coldsnapdragon", 3, 1],
      ["voltsnapdragon", 4, 1],
      ["peapod", 5, 1],
      ["gatlingpea", 0, 2],
      ["icefiregatling", 1, 2],
      ["imperialgatling", 2, 2],
      ["obsidiandragon", 3, 2],
      ["voidhole", 4, 2],
      ["nullifier", 5, 2],
      ["chomper", 0, 3],
      ["shadowchomper", 1, 3],
      ["peamine", 2, 3],
      ["sunpuff", 3, 3],
      ["meloncart", 4, 3],
      ["obsidiantallnut", 5, 3],
      ["hypnolia", 0, 4],
      ["obsidiannut", 1, 4],
      ["flametallnut", 2, 4],
      ["obsidianmine", 3, 4],
      ["calamityturret", 4, 4],
      ["icecannon", 5, 4],
    ];
    const startRow = rowOffset();
    showcase.forEach(([typeId, col, rowOff]) => {
      if (!PLANT_TYPES[typeId]) return;
      placePlant(typeId, col, startRow + rowOff, true);
    });
    // Стручок с 5 головками для примера
    const pod = state.plants.find((p) => p.typeId === "peapod");
    if (pod) pod.heads = 5;
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

  function plantSelectedLine(typeId, row, col, mode) {
    const type = PLANT_TYPES[typeId];
    if (!type) {
      toast("Сначала выбери растение");
      return;
    }
    if (
      (type.cost >= 9999 || type.titanCatalyst || type.titanArmor) &&
      !state.labMode
    ) {
      toast("Особые гибриды и скрещиватель сажаются только по одному");
      return;
    }
    const rowValid =
      row >= rowOffset() && row < rowOffset() + activeRows();
    const colValid = col >= 0 && col < COLS - 1;
    if (!rowValid || !colValid) {
      toast(
        mode === "column"
          ? "Нажми на клетку нужного столбца"
          : "Нажми на активный ряд поля"
      );
      return;
    }

    const spots = [];
    const minRow = rowOffset();
    const maxRow = minRow + activeRows();
    const candidates =
      mode === "column"
        ? Array.from({ length: maxRow - minRow }, (_, index) => ({
            col,
            row: minRow + index,
          }))
        : Array.from({ length: COLS - 1 }, (_, c) => ({ col: c, row }));

    candidates.forEach((spot) => {
      const occupied = state.plants.some(
        (plant) =>
          plant.col === spot.col && plant.row === spot.row && !plant.dead
      );
      const crater = state.craters.some(
        (item) =>
          item.col === spot.col && item.row === spot.row && item.timer > 0
      );
      if (
        !occupied &&
        !crater &&
        isPlantableCell(spot.col, spot.row, typeId)
      ) {
        spots.push(spot);
      }
    });

    if (!spots.length) {
      toast(
        mode === "column"
          ? "В этом столбце нет свободных клеток"
          : "В этом ряду нет свободных клеток"
      );
      return;
    }

    const totalCost = spots.length * type.cost;
    if (!state.labMode && state.resource < totalCost) {
      toast(
        `Для полного ${
          mode === "column" ? "столбца" : "ряда"
        } «${type.name}» нужно ${totalCost} солнц`
      );
      return;
    }

    let planted = 0;
    spots.forEach((spot) => {
      if (placePlant(typeId, spot.col, spot.row, false)) planted += 1;
    });
    updateHud();
    toast(
      `${type.name}: посажено ${planted} ${
        mode === "column" ? "по столбцу" : "в ряду"
      }. Занятые клетки пропущены`
    );
  }

  function onCanvasClick(e) {
    if (!state.running) return;
    AudioFX.unlock();
    const { x, y, col, row } = pointerToCell(e.clientX, e.clientY);

    for (let i = state.powderDrops.length - 1; i >= 0; i--) {
      const powder = state.powderDrops[i];
      const dx = x - powder.x;
      const dy = y - powder.y;
      if (dx * dx + dy * dy < 30 * 30) {
        state.healingPowder += 1;
        state.powderDrops.splice(i, 1);
        AudioFX.sun();
        updateUnitBar();
        toast(`✨ Лечебный порошок подобран: ×${state.healingPowder}`);
        return;
      }
    }

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

      if (
        (!state.selectedUnit || state.selectedUnit === "__glove") &&
        validCell &&
        !state.movingPlant
      ) {
        const twin = state.plants.find(
          (p) =>
            p.col === col &&
            p.row === row &&
            !p.dead &&
            PLANT_TYPES[p.typeId]?.twinSolar
        );
        if (twin && !state.selectedUnit) {
          trySummonGiantSunNut(twin);
          return;
        }
      }

      if (state.selectedUnit === "__powder") {
        if (!validCell) {
          toast("Нажми на повреждённое растение");
          return;
        }
        const plant = state.plants.find(
          (item) => item.col === col && item.row === row && !item.dead
        );
        if (!plant) {
          toast("На этой клетке нет растения");
          return;
        }
        const hpMissing = plant.hp < plant.maxHp || plant.holoBroken;
        const armorMissing =
          plant.maxArmorHp > 0 && plant.armorHp < plant.maxArmorHp;
        const cooldownMissing =
          (state.unitReadyAt[plant.typeId] || 0) > state.time;
        const canPlantFood = !!(
          PLANT_TYPES[plant.typeId]?.holonut ||
          PLANT_TYPES[plant.typeId]?.stackable ||
          PLANT_TYPES[plant.typeId]?.snapdragon ||
          PLANT_TYPES[plant.typeId]?.voltSnap ||
          PLANT_TYPES[plant.typeId]?.bonkChoy
        );
        if (!hpMissing && !armorMissing && !cooldownMissing && !canPlantFood) {
          toast("Растение здорово, а его карточка уже готова");
          return;
        }
        if (!state.labMode && state.healingPowder <= 0) {
          toast("Лечебный порошок закончился");
          state.selectedUnit = null;
          updateUnitBar();
          return;
        }

        plant.hp = plant.maxHp;
        if (plant.maxArmorHp > 0) plant.armorHp = plant.maxArmorHp;
        state.unitReadyAt[plant.typeId] = state.time;
        const fed = triggerPlantFood(plant);
        addExplosion(plant.x, plant.y, "#f8f0b0", 0.55);
        AudioFX.sun();
        updateUnitBar();
        toast(
          fed
            ? "✨ Порошок активировал особую способность!"
            : state.labMode
              ? "✨ Растение вылечено, перезарядка карточки сброшена"
              : "✨ Здоровье восстановлено, карточка сразу готова снова"
        );
        return;
      }

      if (
        state.plantingMode !== "single" &&
        PLANT_TYPES[state.selectedUnit]
      ) {
        plantSelectedLine(
          state.selectedUnit,
          row,
          col,
          state.plantingMode
        );
        return;
      }

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
        plant.forceDestroy = true;
        destroyPlant(plant);
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

        const targetPlant = state.plants.find(
          (p) =>
            p !== state.movingPlant && p.col === col && p.row === row
        );
        if (targetPlant) {
          const movingPlant = state.movingPlant;
          if (fusePlants(targetPlant, movingPlant.typeId, movingPlant)) {
            state.movingPlant = null;
            return;
          }
          toast("Эта клетка занята");
          return;
        }
        if (!isPlantableCell(col, row, state.movingPlant.typeId)) {
          toast("В Пиратских морях ставь растения только на доски");
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
      if (!isPlantableCell(col, row, state.selectedUnit)) {
        toast("Растение утонет — выбери клетку с деревянным настилом");
        return;
      }

      const targetPlant = state.plants.find(
        (p) => p.col === col && p.row === row
      );
      const selectedType = PLANT_TYPES[state.selectedUnit];
      if (selectedType?.titanCatalyst) {
        if (!targetPlant) {
          toast("Поставь скрещиватель на среднее растение цепочки");
          return;
        }
        useJicamagicker(targetPlant);
        updateHud();
        return;
      }
      if (selectedType?.titanArmor) {
        const targetType = targetPlant && PLANT_TYPES[targetPlant.typeId];
        if (
          !targetPlant ||
          !targetType ||
          targetType.hybridTier !== 4 ||
          targetType.titanArmor
        ) {
          toast("Бронированную тыкву можно надеть только на титаническое растение");
          return;
        }
        if (targetPlant.armorHp > 0) {
          toast("На этом титане уже есть броня");
          return;
        }
        const armorCards = state.freePlantCards[state.selectedUnit] || 0;
        if (armorCards <= 0) {
          toast("Сначала создай карточку Бронированной тыквы");
          return;
        }
        targetPlant.armorHp = selectedType.hp;
        targetPlant.maxArmorHp = selectedType.hp;
        state.freePlantCards[state.selectedUnit] = armorCards - 1;
        if (state.freePlantCards[state.selectedUnit] <= 0) {
          delete state.freePlantCards[state.selectedUnit];
          state.selectedUnit = null;
        }
        AudioFX.plant();
        addExplosion(targetPlant.x, targetPlant.y, "#9fc3d1", 0.7);
        buildUnitBar();
        updateHud();
        toast("Титан защищён бронёй на 12000 здоровья!");
        return;
      }
      const fusionTypeId =
        targetPlant &&
        fusionResultType(targetPlant.typeId, state.selectedUnit);
      if (
        targetPlant &&
        selectedType?.stackable &&
        targetPlant.typeId === state.selectedUnit
      ) {
        const heads = targetPlant.heads || 1;
        if (heads >= (selectedType.maxHeads || 5)) {
          toast("У стручка уже максимум головок");
          return;
        }
        if (!state.labMode && state.resource < selectedType.cost) {
          toast("Не хватает солнца");
          return;
        }
        if (!state.labMode) state.resource -= selectedType.cost;
        if (selectedType.recharge && !state.labMode) {
          state.unitReadyAt[state.selectedUnit] =
            state.time + selectedType.recharge;
        }
        targetPlant.heads = heads + 1;
        addExplosion(targetPlant.x, targetPlant.y, "#8fd94f", 0.45);
        AudioFX.plant();
        toast(`Стручок: головок ${targetPlant.heads}!`);
        updateHud();
        buildUnitBar();
        return;
      }
      if (
        targetPlant &&
        selectedType &&
        fusionTypeId
      ) {
        if (!state.labMode && state.resource < selectedType.cost) {
          toast("Не хватает солнца для слияния");
          return;
        }
        if (!state.labMode) state.resource -= selectedType.cost;
        fusePlants(targetPlant, state.selectedUnit);
        updateHud();
        return;
      }

      const cardTypeId = state.selectedUnit;
      const freeCards = state.freePlantCards[cardTypeId] || 0;
      if (placePlant(cardTypeId, col, row, freeCards > 0)) {
        if (freeCards > 0) {
          state.freePlantCards[cardTypeId] = freeCards - 1;
          if (state.freePlantCards[cardTypeId] <= 0) {
            delete state.freePlantCards[cardTypeId];
            state.selectedUnit = null;
          }
          AudioFX.plant();
          buildUnitBar();
          toast("Большое растение высажено!");
        }
        updateHud();
      } else if (
        state.craters.some((c) => c.col === col && c.row === row && c.timer > 0)
      ) {
        toast("Здесь кратер — сажать нельзя");
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

  function firePea(
    plant,
    type,
    delay = 0,
    targetRow = plant.row,
    yOffset = 0,
    options = {}
  ) {
    const shoot = () => {
      if (!state.running || plant.dead) return;
      const targetPosition = cellCenter(0, targetRow);
      const isCalamity = !!type.calamityTurret;
      const isDoom = !!options.doomShell;
      state.projectiles.push({
        x: type.mowerShot ? LEFT - 20 : plant.x + 20,
        y:
          type.mowerShot || targetRow !== plant.row
            ? targetPosition.y - 8 + yOffset
            : plant.y - 8 + yOffset,
        row: targetRow,
        speed: type.mowerShot ? 280 : isCalamity ? 260 : isDoom ? 200 : 220,
        damage: options.damage ?? type.damage,
        splash: options.splash ?? (type.splash || 0),
        bonusVsGiant: type.bonusVsGiant || 0,
        slow: options.slow != null ? options.slow : type.slow || 0,
        slowTime: options.slowTime != null ? options.slowTime : type.slowTime || 0,
        color: options.color || type.peaColor || "#8fd94f",
        mowerShot: !!type.mowerShot,
        cornShot: !!type.cornShot,
        pierce: !!type.mowerShot || !!type.piercing || isCalamity || !!options.pierce,
        pierceLeft: isCalamity ? type.pierceCount || 3 : 0,
        calamityShot: isCalamity,
        curseChance: type.curseChance || 0,
        originX: plant.x,
        knockbackChance: type.knockbackChance || 0,
        knockbackRange: type.knockbackRange || 0,
        starKnockback: options.knockback || type.knockbackOnHit || 0,
        footballPea: !!options.footballPea,
        doomShell: isDoom,
        balloonDart: !!type.balloonCounter,
        cherryShot: false,
        hitIds: isCalamity ? new Set() : undefined,
      });
      if (type.mowerShot) AudioFX.mower();
      else AudioFX.shoot();
    };
    if (delay > 0) setTimeout(shoot, delay * 1000);
    else shoot();
  }

  function firePlantVolley(plant, type) {
    plant.shotSerial = (plant.shotSerial || 0) + 1;
    const count = type.shotCount || 1;
    const footballEvery = type.footballPeaEvery || 0;
    for (let i = 0; i < count; i++) {
      const serial = plant.shotSerial + i;
      const isFootball = footballEvery > 0 && serial % footballEvery === 0;
      const spread = count > 1 ? ((i - (count - 1) / 2) * 4) : 0;
      firePea(plant, type, i * 0.04, plant.row, spread, {
        footballPea: isFootball,
        knockback: isFootball
          ? (type.knockbackOnHit || 55) + 25
          : type.knockbackOnHit || 0,
        color: isFootball ? "#d62828" : type.peaColor,
        damage: isFootball ? type.damage + 20 : type.damage,
      });
    }
    plant.shotSerial += count - 1;
  }

  function firePeaFountain(plant, type) {
    if (!state.running || plant.dead) return;
    const shots = type.fountainShots || 36;
    const speed = 210;
    const damage = type.damage || 20;
    const color = type.peaColor || "#7ed957";
    for (let i = 0; i < shots; i++) {
      const angle = (i / shots) * Math.PI * 2 - Math.PI / 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      state.projectiles.push({
        x: plant.x + dx * 18,
        y: plant.y - 6 + dy * 14,
        row: plant.row,
        speed,
        vx: dx * speed,
        vy: dy * speed,
        freeMove: true,
        fountainPea: true,
        damage,
        color,
        originX: plant.x,
      });
    }
    AudioFX.shoot();
  }

  const STAR_BULLETS = [
    {
      kind: "cherry",
      damage: 10,
      splash: 10,
      color: "#ed2945",
      speed: 230,
      cherryShot: true,
      knockback: 70,
    },
    { kind: "metal", damage: 40, splash: 0, color: "#9aa3ab", speed: 200 },
    {
      kind: "ice",
      damage: 15,
      splash: 0,
      color: "#8de4ff",
      speed: 250,
      slow: 0.45,
      slowTime: 3,
    },
    { kind: "seed", damage: 25, splash: 8, color: "#3a2412", speed: 235 },
  ];

  const STAR_EGG_BULLET = {
    kind: "egg",
    damage: 30,
    splash: 12,
    color: "#fff6e2",
    speed: 215,
    slow: 0.6,
    slowTime: 2,
    knockback: 35,
  };

  const STAR_EGG_CHANCE = 0.25;

  const STAR_DIRECTIONS = [
    { dx: 1, dy: 0 },
    { dx: 0.55, dy: -0.85 },
    { dx: 0.55, dy: 0.85 },
    { dx: -0.75, dy: -0.65 },
    { dx: -0.75, dy: 0.65 },
  ];

  function fireStarfruitVolley(plant, type) {
    if (!state.running || plant.dead) return;
    const damage = type.damage;
    const color = type.peaColor || "#ffd84d";
    const speed = type.globalStars ? 260 : 220;

    if (type.globalStars) {
      const targets = state.zombies
        .filter((z) => !z.charmed && z.hp > 0)
        .sort((a, b) => a.x - b.x)
        .slice(0, type.starShots || 5);
      if (!targets.length) return;
      targets.forEach((target, index) => {
        const dx = target.x - plant.x;
        const dy = target.y - plant.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        state.projectiles.push({
          x: plant.x + (dx / len) * 16,
          y: plant.y - 8 + (dy / len) * 12,
          row: target.row,
          speed,
          vx: (dx / len) * speed,
          vy: (dy / len) * speed,
          freeMove: true,
          damage,
          color,
          starShot: true,
          magnetDart: !!type.magneticSystem,
          metalBonus: type.metalBonus || 0,
          originX: plant.x,
          delayVisual: index,
        });
      });
      // Добиваем до 5 направлений, если целей мало
      for (let i = targets.length; i < (type.starShots || 5); i++) {
        const dir = STAR_DIRECTIONS[i % STAR_DIRECTIONS.length];
        state.projectiles.push({
          x: plant.x + dir.dx * 16,
          y: plant.y - 8 + dir.dy * 14,
          row: plant.row,
          speed,
          vx: dir.dx * speed,
          vy: dir.dy * speed,
          freeMove: true,
          damage,
          color,
          starShot: true,
          magnetDart: !!type.magneticSystem,
          originX: plant.x,
        });
      }
      AudioFX.shoot();
      return;
    }

    STAR_DIRECTIONS.slice(0, type.starShots || 5).forEach((dir) => {
      state.projectiles.push({
        x: plant.x + dir.dx * 18,
        y: plant.y - 8 + dir.dy * 16,
        row: plant.row,
        speed,
        vx: dir.dx * speed,
        vy: dir.dy * speed,
        freeMove: true,
        damage,
        color,
        starShot: true,
        magnetDart: !!type.magneticSystem,
        metalBonus: type.metalBonus || 0,
        originX: plant.x,
      });
    });
    AudioFX.shoot();
  }

  function dropStarMeteor(plant, type) {
    if (!state.running || plant.dead) return;
    const enemies = state.zombies.filter((z) => !z.charmed && z.hp > 0);
    if (!enemies.length) return;
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    const magnets = Math.max(1, countMagneticSystem());
    const damage = (type.starMeteorDamage || 400) * magnets;
    const radius = CELL_W * (type.id === "astrofruit" ? 2.4 : 1.8);
    state.zombies.forEach((zombie) => {
      if (zombie.charmed || zombie.hp <= 0) return;
      const dx = zombie.x - target.x;
      const dy = zombie.y - target.y;
      if (dx * dx + dy * dy <= radius * radius) {
        zombie.hp -= damage;
        if (
          type.magneticSystem &&
          !zombie.metalStripped &&
          (zombie.typeId === "bucket" ||
            zombie.typeId === "tank" ||
            zombie.typeId === "zomboni")
        ) {
          zombie.metalStripped = true;
        }
      }
    });
    addExplosion(target.x, target.y - 40, "#5ee7ff", 0.9);
    addExplosion(target.x, target.y, "#ff8a3d", 0.7);
    addExplosion(target.x + 20, target.y - 20, "#fff4a8", 0.45);
    AudioFX.explode();
    toast(
      type.id === "astrofruit"
        ? `🌌 Магнитный звёздный метеор: ${Math.round(damage)} урона!`
        : `☄️ Метеор звезды: ${Math.round(damage)} урона!`
    );
  }

  function fireStarBarrage(plant, type) {
    if (!state.running || plant.dead) return;
    plant.starBulletIndex = (plant.starBulletIndex || 0) % STAR_BULLETS.length;
    STAR_DIRECTIONS.forEach((dir, index) => {
      const shot =
        Math.random() < STAR_EGG_CHANCE
          ? STAR_EGG_BULLET
          : STAR_BULLETS[
              (plant.starBulletIndex + index) % STAR_BULLETS.length
            ];
      state.projectiles.push({
        x: plant.x + dir.dx * 20,
        y: plant.y - 8 + dir.dy * 18,
        row: plant.row,
        speed: shot.speed,
        vx: dir.dx * shot.speed,
        vy: dir.dy * shot.speed,
        freeMove: true,
        damage: shot.damage,
        splash: shot.splash || 0,
        slow: shot.slow || 0,
        slowTime: shot.slowTime || 0,
        color: shot.color,
        cherryShot: !!shot.cherryShot,
        starBulletKind: shot.kind,
        starKnockback: shot.knockback || 0,
        originX: plant.x,
      });
    });
    plant.starBulletIndex += 1;
    AudioFX.shoot();
  }

  function drainCalamityDurability(plant, type) {
    if (!type.calamityTurret) return;
    const floor = type.durabilityFloor || 1500;
    if (plant.hp > floor) {
      plant.hp = Math.max(floor, plant.hp - (type.durabilityDrain || 50));
    }
  }

  function tryCalamityUltra(plant, type) {
    if (!type.calamityTurret) return;
    if (Math.random() >= (type.ultraChance || 0)) return;
    const enemies = state.zombies.filter((z) => !z.charmed && z.hp > 0);
    if (!enemies.length) return;
    let planted = 0;
    enemies.forEach((z) => {
      const col = Math.max(
        0,
        Math.min(COLS - 2, Math.floor((z.x - LEFT) / CELL_W))
      );
      if (placePlant("doomsdayshroom", col, z.row, true)) {
        planted += 1;
      } else {
        triggerDoomBlast(z.x, z.y, 1800, 3.5, {
          doomsday: true,
          originRow: z.row,
        });
      }
    });
    toast(
      planted
        ? "Катаклизм: Грибы Конца Света под ордой!"
        : "Катаклизм: конец света по всей орде!"
    );
    AudioFX.wave();
  }

  function applyCalamityHit(hit, p) {
    let dmg = p.damage;
    if (p.bonusVsGiant && (hit.typeId === "giant" || hit.typeId === "knight")) {
      dmg += p.bonusVsGiant;
    }
    hit.hp -= dmg;
    if (p.curseChance && Math.random() < p.curseChance) {
      charmZombie(hit, true);
      addExplosion(hit.x, hit.y - 8, "#c48bff", 0.4);
    }
  }

  function triggerBiteBlast(plant, type) {
    if (!type.biteBlast) return;
    triggerDoomBlast(
      plant.x + 20,
      plant.y,
      type.biteBlast,
      type.biteBlastCells || 1,
      { cherryExplosion: true }
    );
  }

  function fireExplosiveCherryVolley(plant, type) {
    if (!state.running || plant.dead) return;
    const shots = type.cherryShots || 1;
    for (let shot = 0; shot < shots; shot++) {
      const delay = shot * 0.08;
      const fire = () => {
        if (!state.running || plant.dead) return;
        state.projectiles.push({
          x: plant.x + 22,
          y: plant.y - 8 + (shot - (shots - 1) / 2) * 5,
          row: plant.row,
          speed: 210,
          damage: type.damage,
          splash: type.splash || type.damage,
          color: type.peaColor || "#ed2945",
          cherryShot: true,
          explosiveCherry: true,
          originX: plant.x,
        });
        AudioFX.shoot();
      };
      if (delay > 0) setTimeout(fire, delay * 1000);
      else fire();
    }
  }

  function fireChompSpit(plant, type) {
    if (!state.running || plant.dead) return;
    state.projectiles.push({
      x: plant.x + 24,
      y: plant.y - 4,
      row: plant.row,
      speed: 160,
      damage: type.spitDamage || 80,
      color: "#8a6a5a",
      chompSpit: true,
      pierce: !!type.spitPierce,
      pierceLeft: type.spitPierce ? 99 : 0,
      hitIds: type.spitPierce ? new Set() : undefined,
      originX: plant.x,
    });
    AudioFX.hit();
  }

  function applySwallowRewards(plant, type) {
    if (type.swallowHeal) {
      plant.hp = Math.min(
        type.overhealCap || plant.maxHp,
        plant.hp + type.swallowHeal
      );
      if (plant.hp > plant.maxHp) plant.overheal = true;
      addExplosion(plant.x, plant.y - 8, "#f0d09a", 0.35);
    }
    if (type.swallowSun && state.side === "plants") {
      state.suns.push({
        x: plant.x,
        y: plant.y - 24,
        vy: -28,
        value: type.swallowSun,
        life: 8,
      });
      AudioFX.sun();
    }
  }

  function fireSnapHead(plant, type) {
    if (!state.running || plant.dead) return;
    state.projectiles.push({
      x: plant.x + 22,
      y: plant.y - 10,
      row: plant.row,
      speed: 240,
      damage: type.headDamage,
      slow: 0,
      slowTime: 0,
      color: "#7fa66f",
      headShot: true,
    });
    AudioFX.zombie();
  }

  function fireLaserBean(plant, type) {
    if (!state.running || plant.dead) return;
    const originX = plant.x + 22;
    const originY = plant.y - 10;
    state.projectiles.push({
      x: originX,
      y: originY,
      row: plant.row,
      speed: 780,
      damage: type.damage,
      color: type.peaColor || "#4ad4ff",
      laserShot: true,
      originX,
      originY,
      hitIds: new Set(),
    });
    AudioFX.shoot();
  }

  function fireSniper(plant, type) {
    if (!state.running || plant.dead) return;
    const targets = state.zombies
      .filter(
        (zombie) =>
          !zombie.charmed && !zombie.ballooned && zombie.hp > 0
      )
      .sort((a, b) => a.x - b.x);
    const target = targets[0];
    if (!target) return;

    plant.sniperShots = (plant.sniperShots || 0) + 1;
    const headshot =
      plant.sniperShots % (type.headshotEvery || 6) === 0;
    if (headshot) {
      target.hp = 0;
    } else {
      target.hp -= type.damage;
    }

    if (type.fireSniper) {
      state.zombies.forEach((zombie) => {
        if (
          zombie !== target &&
          !zombie.charmed &&
          !zombie.ballooned &&
          zombie.hp > 0 &&
          Math.abs(zombie.x - target.x) < 70 &&
          Math.abs(zombie.row - target.row) <= 1
        ) {
          zombie.hp -= 180;
        }
      });
      addExplosion(target.x, target.y, "#ff6b2e", 0.42);
    } else {
      addExplosion(target.x, target.y - 8, "#8ce8a0", 0.24);
    }

    state.projectiles.push({
      sniperShot: true,
      x: plant.x + 18,
      y: plant.y - 13,
      endX: target.x,
      endY: target.y - 10,
      color: type.fireSniper ? "#ff783d" : "#b8ffd0",
      life: 0.16,
      headshot,
    });
    AudioFX.shoot();
    if (headshot) toast("🎯 Выстрел в голову!");
  }

  function fireMagicCatgirl(plant, type) {
    if (!state.running || plant.dead) return;
    const targets = state.zombies
      .filter(
        (zombie) =>
          !zombie.charmed && !zombie.ballooned && zombie.hp > 0
      )
      .sort((a, b) => a.x - b.x);
    if (!targets.length) return;

    for (let shot = 0; shot < 2; shot++) {
      const target = targets[shot % targets.length];
      state.projectiles.push({
        x: plant.x + (shot === 0 ? -8 : 8),
        y: plant.y - 25,
        row: plant.row,
        speed: 270,
        damage: type.damage,
        target,
        homingShot: true,
        color: shot === 0 ? "#ff9fe4" : "#b9a4ff",
        trail: [],
      });
    }
    AudioFX.shoot();
  }

  function fireTripleCatgirl(plant, type) {
    if (!state.running || plant.dead) return;
    const lanes = [plant.row - 1, plant.row, plant.row + 1].filter(
      (row) => row >= rowOffset() && row < rowOffset() + activeRows()
    );
    const cols = type.breathCols || 4;
    const maxX = plant.x + CELL_W * cols + 10;
    let hits = 0;
    state.zombies.forEach((zombie) => {
      if (
        zombie.charmed ||
        zombie.ballooned ||
        zombie.hp <= 0 ||
        !lanes.includes(zombie.row) ||
        zombie.x <= plant.x ||
        zombie.x > maxX
      ) {
        return;
      }
      zombie.hp -= type.damage;
      hits += 1;
    });
    lanes.forEach((row, laneIndex) => {
      for (let step = 1; step <= cols; step++) {
        const pos = cellCenter(
          Math.min(COLS - 1, plant.col + step),
          row
        );
        setTimeout(() => {
          if (!state.running) return;
          addExplosion(
            pos.x,
            pos.y - 8,
            step % 2 === 0 ? "#ff7a2a" : "#ffd84d",
            0.28 + laneIndex * 0.02
          );
        }, (step - 1) * 45 + laneIndex * 20);
      }
    });
    AudioFX.explode();
    if (hits) AudioFX.hit();
  }

  function isShadowPowered(plant) {
    return state.plants.some(
      (p) =>
        p !== plant &&
        !p.dead &&
        p.typeId === "shadowpea" &&
        Math.abs(p.col - plant.col) <= 1 &&
        Math.abs(p.row - plant.row) <= 1
    );
  }

  function fireDragonSeed(plant, type, targetRow, powered) {
    if (!state.running || plant.dead) return;
    const target = state.zombies
      .filter(
        (z) =>
          !z.charmed && z.row === targetRow && z.x > plant.x - 10 && z.hp > 0
      )
      .sort((a, b) => a.x - b.x)[0];
    const endX = target ? target.x : Math.min(plant.x + 320, canvas.width - 40);
    const endY = cellCenter(0, targetRow).y - 8;
    state.projectiles.push({
      x: plant.x + 8,
      y: plant.y - 12,
      startX: plant.x + 8,
      startY: plant.y - 12,
      endX,
      endY,
      progress: 0,
      row: targetRow,
      speed: 0.7,
      damage: powered ? type.damage + 20 : type.damage,
      splash: type.splash || 0,
      poison: powered,
      poisonDps: 25,
      poisonTime: 3,
      color: powered ? "#7b3fc6" : type.peaColor || "#d94f9a",
      lobShot: true,
    });
    AudioFX.shoot();
  }

  function fireLobbedPlantShot(plant, type, target, options = {}) {
    if (!state.running || plant.dead || !target) return;
    const targetRow = options.targetRow ?? target.row;
    const isButter =
      type.butterChance && Math.random() < type.butterChance;
    const endX = options.endX ?? target.x;
    const endY = cellCenter(0, targetRow).y - 8;
    state.projectiles.push({
      x: plant.x + 8,
      y: plant.y - 16,
      startX: plant.x + 8,
      startY: plant.y - 16,
      endX,
      endY,
      progress: 0,
      row: targetRow,
      speed: options.speed || 0.75,
      damage: isButter ? 40 : type.damage,
      splash: options.splash ?? type.splash ?? 0,
      stunTime: isButter ? 4 : 0,
      slow: options.slow ?? type.slow ?? 0,
      slowTime: options.slowTime ?? type.slowTime ?? 0,
      color: isButter
        ? "#ffd84d"
        : type.iceCannon
          ? "#8de4ff"
          : options.color || "#55a832",
      projectileKind:
        options.projectileKind ||
        (isButter ? "butter" : type.projectileKind || "kernel"),
      areaImpact: !!options.areaImpact,
      lobShot: true,
    });
    AudioFX.shoot();
  }

  function fireMelonCannonBarrage(plant, type) {
    const targets = state.zombies.filter(
      (z) => !z.charmed && z.hp > 0 && z.x > plant.x - 20
    );
    if (!targets.length) return;
    const focus = targets.sort((a, b) => a.x - b.x)[0];
    const minRow = rowOffset();
    const maxRow = minRow + activeRows() - 1;
    const ice = !!type.iceCannon;

    for (let shot = 0; shot < 40; shot++) {
      setTimeout(() => {
        if (!state.running || plant.dead) return;
        const targetRow = Math.max(
          minRow,
          Math.min(maxRow, focus.row + Math.floor(Math.random() * 3) - 1)
        );
        const endX = Math.max(
          LEFT + 30,
          Math.min(
            canvas.width - 25,
            focus.x + (Math.random() * 4 - 2) * CELL_W
          )
        );
        fireLobbedPlantShot(plant, type, focus, {
          targetRow,
          endX,
          speed: 1.15 + Math.random() * 0.35,
          splash: ice ? 120 : 200,
          projectileKind: ice ? "icemelon" : "melon",
          areaImpact: true,
          color: ice ? "#8de4ff" : undefined,
        });
      }, shot * 45);
    }
    AudioFX.wave();
    toast(
      ice
        ? "Ледяная пушка: залп из 40 ледяных арбузов!"
        : "Арбузная пушка: залп из 40 арбузов!"
    );
  }

  function spawnDragonBabies(parent) {
    const empties = [];
    const startRow = rowOffset();
    const endRow = startRow + activeRows();
    for (let r = startRow; r < endRow; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        if (
          isPlantableCell(c, r) &&
          !state.plants.some((p) => p.col === c && p.row === r && !p.dead)
        ) {
          empties.push({ col: c, row: r });
        }
      }
    }
    const preferred = empties.filter((e) => Math.abs(e.row - parent.row) <= 1);
    const pool = (preferred.length >= 3 ? preferred : empties).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool.slice(0, 3).forEach((spot) => placePlant("babybruit", spot.col, spot.row, true));
    if (pool.length) toast("Появились детёныши дракона!");
  }

  function destroyPlant(plant) {
    if (plant.dead) return;
    const type = PLANT_TYPES[plant.typeId];
    if (type?.holonut && !plant.forceDestroy) {
      plant.hp = 0;
      plant.holoBroken = true;
      plant.noDamageTimer = 0;
      addExplosion(plant.x, plant.y, "#9ad8ff", 0.4);
      toast("Голограмма разбита — проектор восстанавливает её");
      return;
    }
    plant.dead = true;
    if (state.movingPlant === plant) state.movingPlant = null;
    if (type && type.spawnBabiesOnDeath) {
      spawnDragonBabies(plant);
    }
    if (type && type.screenFlames) {
      triggerSakuraScreenFlames(plant, type.blastDamage || 500);
      toast("🌸 Сакура погибает в огне!");
    }
    state.plants = state.plants.filter((p) => p !== plant);
  }

  function triggerPlantFood(plant) {
    const type = PLANT_TYPES[plant.typeId];
    if (!type) return false;
    plant.hp = plant.maxHp;
    plant.holoBroken = false;
    plant.noDamageTimer = 0;

    if (type.holonut && type.plantFoodShield) {
      const shieldX = plant.x + CELL_W;
      state.forcefields.push({
        x: shieldX,
        col: plant.col + 1,
        hp: type.plantFoodShield,
        maxHp: type.plantFoodShield,
        life: 25,
        blocksBalloon: true,
      });
      addExplosion(shieldX, plant.y, "#7cf0ff", 0.8);
      toast("Вечно-орех: силовой щит на все ряды!");
      return true;
    }

    if (type.stackable && type.plantFoodGiantPeas) {
      for (let i = 0; i < type.plantFoodGiantPeas; i++) {
        firePea(plant, type, i * 0.08, plant.row, (i - 2) * 4, {
          damage: type.plantFoodGiantDamage || 400,
          color: "#c8ff6a",
          knockback: 40,
          pierce: true,
        });
      }
      toast("Стручок: гигантские горошины!");
      return true;
    }

    if (type.snapdragon && type.plantFoodBlast) {
      breathAttack(plant, type, {
        damage: type.plantFoodBlast,
        cols: 3,
        rows: 1,
        freeze: type.plantFoodFreeze || 0,
      });
      toast(
        type.coldSnap
          ? "Ледяной драконолист: ледяной удар!"
          : "Драконолист: огненный удар!"
      );
      return true;
    }

    if (type.voltSnap && type.plantFoodVoltBurst) {
      state.zombies.forEach((z) => {
        if (
          !z.charmed &&
          z.row === plant.row &&
          z.x > plant.x &&
          z.x < plant.x + CELL_W * (type.voltRange || 9) &&
          z.hp > 0
        ) {
          z.hp -= type.plantFoodVoltBurst;
          addExplosion(z.x, z.y, "#7cf0ff", 0.35);
        }
      });
      toast("Электрозев: электрический разряд!");
      return true;
    }

    if (type.bonkChoy && type.plantFoodBonkTime) {
      plant.bonkFrenzy = type.plantFoodBonkTime;
      toast("Бокс-чой: ярость кулаков!");
      return true;
    }

    return false;
  }

  function breathAttack(plant, type, options = {}) {
    const damage = options.damage ?? type.damage;
    const cols = options.cols ?? type.breathCols ?? 3;
    const rows = options.rows ?? type.breathRows ?? 1;
    const freeze = options.freeze || 0;
    state.zombies.forEach((z) => {
      if (z.charmed || z.hp <= 0 || z.ballooned) return;
      const rowDist = Math.abs(z.row - plant.row);
      if (rowDist > rows) return;
      if (z.x < plant.x - 10) return;
      if (z.x > plant.x + CELL_W * cols + 20) return;
      z.hp -= damage;
      if (type.coldSnap || freeze) {
        z.slowFactor = type.slow || 0.5;
        z.slowTimer = Math.max(z.slowTimer || 0, type.slowTime || 3);
      } else {
        z.slowFactor = 1;
        z.slowTimer = 0;
      }
      if (freeze > 0) {
        z.stunTimer = Math.max(z.stunTimer || 0, freeze);
      }
      addExplosion(
        z.x,
        z.y,
        type.obsidianDragon
          ? "#6b2db3"
          : type.coldSnap
            ? "#8de4ff"
            : "#ff6a2a",
        freeze ? 0.55 : 0.28
      );
    });
    addExplosion(
      plant.x + CELL_W * Math.max(1, cols / 2),
      plant.y,
      type.obsidianDragon
        ? "#2a1040"
        : type.coldSnap
          ? "#a8f0ff"
          : "#ff8a3d",
      0.45
    );
    AudioFX.explode();
  }

  function voltDps(charge) {
    if (charge >= 6) return 1012.5;
    if (charge >= 4) return 60;
    if (charge >= 2) return 33.75;
    return 30;
  }

  function isNutPlant(plant) {
    return [
      "wallnut",
      "bigwallnut",
      "giantwallnut",
      "thornnut",
      "fatwallnut",
      "tallnut",
      "mechanut",
      "footballtallnut",
      "sunnut",
      "doublesunnut",
      "obsidiannut",
      "flametallnut",
      "obsidiantallnut",
    ].includes(plant.typeId);
  }

  function updateNutFortressHealth(plant, type) {
    if (!type.nutFortress) return;
    const otherNuts = state.plants.filter(
      (other) => other !== plant && !other.dead && isNutPlant(other)
    ).length;
    const newMaxHp = type.hp + otherNuts * (type.bonusHpPerNut || 4000);
    const difference = newMaxHp - plant.maxHp;
    plant.maxHp = newMaxHp;
    if (difference > 0) {
      plant.hp += difference;
    } else {
      plant.hp = Math.min(plant.hp, newMaxHp);
    }
  }

  function growGiftIntoHybrid(plant) {
    const hybrids = Object.values(PLANT_TYPES).filter(
      (type) => type.hybridTier >= 2 && !type.giftPlant
    );
    if (!hybrids.length) return false;
    const result = hybrids[Math.floor(Math.random() * hybrids.length)];
    plant.typeId = result.id;
    plant.hp = result.hp;
    plant.maxHp = result.hp;
    plant.timer = 0;
    plant.shootTimer = 0.5;
    plant.armed = !result.armTime;
    plant.armTimer = result.armTime || 0;
    plant.fuse = result.fuse || 0;
    plant.lifeTimer = result.lifeTime || 0;
    plant.gatlingCharge = 0;
    plant.magnetTimer = 0;
    plant.magnetPulseTimer = result.magnetPulseEvery || 0;
    plant.armorHp = 0;
    plant.maxArmorHp = 0;
    plant.giftTimer = 0;
    plant.summonTimer = result.summonEvery || 0;
    plant.hypnoUsesLeft = result.multiHypnoUses || 1;
    plant.meteorTimer = result.starMeteorEvery || 0;
    addExplosion(plant.x, plant.y, "#fff0f5", 0.8);
    addExplosion(plant.x, plant.y - 12, "#ff5a73", 0.55);
    AudioFX.plant();
    toast(`🎁 Из подарка выросло: ${result.name}!`);
    if (result.screenFlames) {
      triggerSakuraScreenFlames(plant, result.blastDamage || 500);
    }
    return true;
  }

  function updatePlants(dt) {
    const toRemove = [];

    state.plants.forEach((plant) => {
      const type = PLANT_TYPES[plant.typeId];
      updateNutFortressHealth(plant, type);
      plant.timer += dt;

      if (type.allySummoner) {
        plant.summonTimer -= dt;
        if (plant.summonTimer <= 0) {
          plant.summonTimer = type.summonEvery || 30;
          summonHypnoAlly(plant, type);
        }
      }

      if (plant.ultimateTimer > 0) {
        plant.ultimateTimer -= dt;
        plant.shootTimer -= dt;
        if (plant.shootTimer <= 0) {
          plant.shootTimer = 0.02;
          firePea(plant, type, 0, plant.row, (Math.random() - 0.5) * 18, {
            footballPea: true,
            knockback: 70,
            color: "#d62828",
            damage: type.damage + 20,
          });
        }
        if (plant.invulnTimer > 0) plant.invulnTimer -= dt;
        return;
      }
      if (plant.invulnTimer > 0) plant.invulnTimer -= dt;

      if (type.squash) {
        const prey = state.zombies.find(
          (z) =>
            !z.charmed &&
            !z.ballooned &&
            z.row === plant.row &&
            z.x > plant.x - 10 &&
            z.x < plant.x + (type.squashRange || 95) &&
            z.hp > 0
        );
        if (prey) {
          prey.hp = 0;
          addExplosion(prey.x, prey.y, "#6aa83a", 0.65);
          AudioFX.explode();
          toast("Кабачок раздавил зомби!");
          plant.dead = true;
          if (state.movingPlant === plant) state.movingPlant = null;
          toRemove.push(plant);
        }
        return;
      }

      if (type.holonut) {
        if (plant.holoBroken || plant.hp < plant.maxHp) {
          plant.noDamageTimer = (plant.noDamageTimer || 0) + dt;
          if (plant.noDamageTimer >= (type.regenIdle || 15)) {
            plant.hp = plant.maxHp;
            plant.holoBroken = false;
            plant.noDamageTimer = 0;
            addExplosion(plant.x, plant.y, "#9ad8ff", 0.5);
            toast("Вечно-орех восстановил голограмму!");
          }
        }
        return;
      }

      if (plant.bonkFrenzy > 0) {
        plant.bonkFrenzy -= dt;
        plant.shootTimer -= dt;
        if (plant.shootTimer <= 0) {
          plant.shootTimer = 0.12;
          state.zombies.forEach((z) => {
            if (
              !z.charmed &&
              !z.ballooned &&
              z.hp > 0 &&
              Math.abs(z.row - plant.row) <= 1 &&
              Math.abs(z.x - plant.x) < CELL_W * 1.5
            ) {
              z.hp -= type.plantFoodBonkDamage || 60;
              addExplosion(z.x, z.y - 6, "#c8e87a", 0.2);
            }
          });
          AudioFX.hit();
        }
        return;
      }

      if (type.giftPlant) {
        plant.shootTimer -= dt;
        const enemyInLane = state.zombies.some(
          (zombie) =>
            !zombie.charmed &&
            !zombie.ballooned &&
            zombie.row === plant.row &&
            zombie.x > plant.x &&
            zombie.hp > 0
        );
        if (enemyInLane && plant.shootTimer <= 0) {
          plant.shootTimer = type.shootEvery;
          firePea(plant, type);
        }
        plant.giftTimer -= dt;
        if (plant.giftTimer <= 0) {
          growGiftIntoHybrid(plant);
        }
        return;
      }

      if (type.blackHole) {
        plant.voidTimer = (plant.voidTimer ?? type.voidEvery ?? 0.45) - dt;
        const range = type.voidRange || 140;
        state.zombies.forEach((z) => {
          if (z.charmed || z.hp <= 0 || z.ballooned) return;
          const rowDist = Math.abs(z.row - plant.row);
          if (rowDist > 2) return;
          const dist = Math.hypot(z.x - plant.x, rowDist * 40);
          if (dist < 12 || dist > range) return;
          const pull = (type.pullStrength || 55) * dt;
          z.x += ((plant.x - z.x) / dist) * pull;
          if (rowDist > 0 && Math.random() < 0.02) {
            z.row += z.row < plant.row ? 1 : -1;
            const pos = cellCenter(0, z.row);
            z.y = pos.y;
          }
        });
        if (plant.voidTimer <= 0) {
          plant.voidTimer = type.voidEvery || 0.45;
          state.zombies.forEach((z) => {
            if (z.charmed || z.hp <= 0 || z.ballooned) return;
            const rowDist = Math.abs(z.row - plant.row);
            if (rowDist > 2) return;
            const dist = Math.hypot(z.x - plant.x, rowDist * 40);
            if (dist <= range) {
              z.hp -= type.voidDamage || 35;
              addExplosion(z.x, z.y, "#3a1058", 0.2);
            }
          });
          addExplosion(plant.x, plant.y, "#1a0a28", 0.35);
          AudioFX.hit();
        }
        return;
      }

      // В лаборатории гибридов временные растения не исчезают — удобнее тестировать.
      if (type.lifeTime && !state.labMode) {
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
          toast(type.peaMine ? "Горохомина готова!" : "Мина готова!");
        }
      }

      if (type.peaMine && !plant.armed) return;

      if (type.fuse) {
        plant.fuse -= dt;
        if (plant.fuse <= 0) {
          if (type.doomsdayShroom) {
            triggerDoomBlast(
              plant.x,
              plant.y,
              type.blastDamage,
              type.blastCells || 3.5,
              { doomsday: true, originRow: plant.row }
            );
            state.craters.push({
              col: plant.col,
              row: plant.row,
              timer: 20,
            });
          } else if (type.rowClear) {
            clearRow(plant.row, type.blastDamage);
            for (let c = 0; c < COLS; c++) {
              const p = cellCenter(c, plant.row);
              addExplosion(p.x, p.y, "#ff6a2a", 0.5);
            }
            AudioFX.explode();
          } else {
            const radiusCells = type.blastCells || 1;
            triggerDoomBlast(
              plant.x,
              plant.y,
              type.blastDamage,
              radiusCells,
              { cherryExplosion: plant.typeId === "cherrybomb" }
            );
            if (type.leavesCrater) {
              state.craters.push({
                col: plant.col,
                row: plant.row,
                timer: 20,
              });
            }
          }
          plant.dead = true;
          toRemove.push(plant);
          return;
        }
      }

      if (type.produce && plant.timer >= type.produceEvery) {
        plant.timer = 0;
        if (state.side === "plants") {
          if (type.produceGrows) {
            plant.matureTimer = plant.matureTimer || 0;
          }
          const matured =
            type.produceGrows &&
            (plant.matureTimer || 0) >= (type.matureAfter || 50);
          const value = matured
            ? type.produceLarge || type.produce
            : type.produce;
          state.suns.push({
            x: plant.x + (Math.random() * 30 - 15),
            y: plant.y - 20,
            vy: -20,
            value,
            life: 8,
          });
        } else {
          state.aiTimer += 0.5;
        }
      }

      if (type.produceGrows) {
        plant.matureTimer = (plant.matureTimer || 0) + dt;
      }

      if (type.magnetShroom) {
        plant.magnetTimer -= dt;
        updateMagnetPulse(plant, type, dt);
        if (plant.magnetTimer <= 0) {
          const metalZombie = state.zombies
            .filter(
              (z) =>
                !z.charmed &&
                !z.metalStripped &&
                (z.typeId === "bucket" ||
                  z.typeId === "tank" ||
                  z.typeId === "zomboni") &&
                Math.abs(z.row - plant.row) <= 2 &&
                Math.abs(z.x - plant.x) <= CELL_W * 3 &&
                z.hp > 0
            )
            .sort((a, b) => Math.abs(a.x - plant.x) - Math.abs(b.x - plant.x))[0];
          if (metalZombie) {
            metalZombie.metalStripped = true;
            metalZombie.hp -= type.metalRepair ? 180 : 140;
            plant.magnetTimer = type.magnetEvery;
            repairPlantWithMetal(plant, type);
            addExplosion(metalZombie.x, metalZombie.y - 18, "#a7c4d1", 0.4);
            addExplosion(plant.x, plant.y - 10, "#cf4a69", 0.35);
            AudioFX.beep(280, 0.18, "sawtooth", 0.05, 120);
          }
        }
        if (!type.pumpkinArmor) return;
      }

      if (type.melonCannon) {
        plant.shootTimer -= dt;
        const hasTarget = state.zombies.some(
          (z) => !z.charmed && z.hp > 0 && z.x > plant.x - 20
        );
        if (hasTarget && plant.shootTimer <= 0) {
          plant.shootTimer = type.shootEvery;
          fireMelonCannonBarrage(plant, type);
        }
        return;
      }

      if (type.lobber) {
        plant.shootTimer -= dt;
        const target = state.zombies
          .filter((z) => !z.charmed && z.row === plant.row && z.x > plant.x && z.hp > 0)
          .sort((a, b) => a.x - b.x)[0];
        if (target && plant.shootTimer <= 0) {
          plant.shootTimer = type.shootEvery;
          fireLobbedPlantShot(plant, type, target);
        }
        return;
      }

      if (type.snapPea) {
        if (plant.hp > plant.maxHp && type.overhealDrain) {
          plant.hp = Math.max(plant.maxHp, plant.hp - type.overhealDrain * dt);
        }

        if (
          type.shadowPea &&
          (plant.pullsLeft || 0) > 0 &&
          !plant.chewing
        ) {
          const pullTarget = state.zombies.find(
            (z) =>
              !z.charmed &&
              z.typeId !== "giant" &&
              z.row === plant.row &&
              z.x > plant.x + 40 &&
              z.x < plant.x + 100 &&
              z.hp > 0
          );
          if (pullTarget) {
            maybeDropHealingPowder(pullTarget);
            state.zombies = state.zombies.filter((z) => z !== pullTarget);
            plant.pullsLeft -= 1;
            plant.submergeTimer = 0.65;
            addExplosion(plant.x, plant.y, "#61308f", 0.45);
            AudioFX.bite();
            if (plant.pullsLeft <= 0 && !type.snapPea) {
              plant.dead = true;
              if (state.movingPlant === plant) state.movingPlant = null;
              toRemove.push(plant);
            }
            return;
          }
        }

        if (plant.chewing) {
          plant.chewTimer -= dt;
          if (type.spitWhileChewing) {
            plant.spitTimer = (plant.spitTimer ?? type.spitEvery) - dt;
            if (plant.spitTimer <= 0) {
              plant.spitTimer = type.spitEvery || 3;
              fireChompSpit(plant, type);
            }
          }
          if (plant.chewTimer <= 0) {
            plant.chewing = false;
            plant.chewTimer = 0;
            plant.spitTimer = 0;
            if (!type.giantChomper && !type.chewBite) fireSnapHead(plant, type);
          }
          return;
        }

        if (type.giantChomper) {
          const biteRange = type.chewRange || 90;
          const rowSpan = type.threeRowBite ? 1 : 0;
          const prey = state.zombies.filter(
            (z) =>
              !z.charmed &&
              Math.abs(z.row - plant.row) <= rowSpan &&
              z.x > plant.x - 10 &&
              z.x < plant.x + biteRange &&
              z.hp > 0
          );
          if (prey.length) {
            const totalHp = prey.reduce((sum, z) => sum + Math.max(1, z.hp), 0);
            prey.forEach(maybeDropHealingPowder);
            state.zombies = state.zombies.filter((z) => !prey.includes(z));
            plant.chewing = true;
            plant.chewTimer =
              Math.min(42, Math.max(12, 8 + 3 * Math.log(totalHp))) *
              (type.chewFactor || 1);
            plant.spitTimer = type.spitEvery || 3;
            prey.forEach((z) =>
              addExplosion(z.x, z.y, "#9b4dff", 0.35)
            );
            addExplosion(plant.x + 24, plant.y, "#6a2db8", 0.55);
            AudioFX.bite();
            triggerBiteBlast(plant, type);
            applySwallowRewards(plant, type);
            toast(`Чомпер проглотил ${prey.length}!`);
          }
          return;
        }

        if (type.chewBite) {
          plant.devourTimer =
            (plant.devourTimer ?? (type.devourEvery || 40)) - dt;
          const closeZombie = state.zombies
            .filter(
              (z) =>
                !z.charmed &&
                !z.ballooned &&
                z.row === plant.row &&
                z.x > plant.x &&
                z.x < plant.x + CELL_W * 1.2 &&
                z.hp > 0
            )
            .sort((a, b) => a.x - b.x)[0];

          plant.shootTimer -= dt;
          if (closeZombie && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            if (plant.devourTimer <= 0) {
              maybeDropHealingPowder(closeZombie);
              state.zombies = state.zombies.filter((z) => z !== closeZombie);
              plant.chewing = true;
              plant.chewTimer = 8;
              plant.spitTimer = type.spitEvery || 2;
              plant.devourTimer = type.devourEvery || 40;
              plant.hp = Math.min(
                type.overhealCap || plant.maxHp * 4,
                Math.max(plant.maxHp, plant.hp) + (type.devourHeal || 4000)
              );
              triggerBiteBlast(plant, type);
              addExplosion(closeZombie.x, closeZombie.y, "#ff4d6d", 0.5);
              toast(`${type.name} пожрала зомби!`);
            } else {
              closeZombie.hp -= type.chewBiteDamage || 200;
              plant.hp = Math.min(
                type.overhealCap || plant.maxHp,
                plant.hp + (type.chewBiteHeal || 200)
              );
              fireChompSpit(plant, type);
              addExplosion(closeZombie.x, closeZombie.y - 6, "#c48bff", 0.28);
              AudioFX.bite();
              if (closeZombie.hp <= 0) maybeDropHealingPowder(closeZombie);
            }
          }
          return;
        }

        const edibleZombie = state.zombies
          .filter(
            (z) =>
              !z.charmed &&
              z.row === plant.row &&
              z.x > plant.x &&
              z.hp > 0 &&
              z.typeId !== "giant"
          )
          .sort((a, b) => a.x - b.x)[0];

        if (edibleZombie) {
          maybeDropHealingPowder(edibleZombie);
          state.zombies = state.zombies.filter((z) => z !== edibleZombie);
          plant.chewing = true;
          plant.chewTimer = type.chewTime;
          plant.spitTimer = type.spitEvery || 3;
          addExplosion(edibleZombie.x, edibleZombie.y, "#72b83e", 0.25);
          AudioFX.bite();
          triggerBiteBlast(plant, type);
          applySwallowRewards(plant, type);
          return;
        }

        const giantInLane = state.zombies.some(
          (z) =>
            !z.charmed &&
            z.typeId === "giant" &&
            z.row === plant.row &&
            z.x > plant.x &&
            z.hp > 0
        );
        plant.shootTimer -= dt;
        if (giantInLane && plant.shootTimer <= 0) {
          plant.shootTimer = type.shootEvery;
          firePea(plant, type);
          firePea(plant, type, 0.15);
          firePea(plant, type, 0.3);
        }
        return;
      }

      if (type.shadowPea) {
        if (plant.submergeTimer > 0) plant.submergeTimer -= dt;
        const closeZombie = state.zombies.find(
          (z) =>
            !z.charmed &&
            z.typeId !== "giant" &&
            z.row === plant.row &&
            Math.abs(z.x - plant.x) < 48 &&
            z.hp > 0
        );
        if (closeZombie) {
          maybeDropHealingPowder(closeZombie);
          state.zombies = state.zombies.filter((z) => z !== closeZombie);
          plant.pullsLeft -= 1;
          plant.submergeTimer = 0.65;
          addExplosion(plant.x, plant.y, "#61308f", 0.45);
          AudioFX.bite();
          if (plant.pullsLeft <= 0) {
            plant.dead = true;
            if (state.movingPlant === plant) state.movingPlant = null;
            toRemove.push(plant);
          }
          return;
        }
      }

      if (type.damage && !type.fuse) {
        plant.shootTimer -= dt;

        if (type.gatlingTurret) {
          const hasTarget = state.zombies.some(
            (z) =>
              !z.charmed && z.row === plant.row && z.x > plant.x && z.hp > 0
          );
          if (!hasTarget) {
            plant.gatlingCharge = 0;
            return;
          }

          plant.gatlingCharge += dt;
          const fireInterval =
            plant.gatlingCharge >= 10
              ? 0.16
              : plant.gatlingCharge >= 5
                ? 0.3
                : type.shootEvery;
          if (plant.shootTimer <= 0) {
            plant.shootTimer = fireInterval;
            [-9, 0, 9].forEach((offset, index) => {
              firePea(plant, type, index * 0.025, plant.row, offset);
            });
          }
          return;
        }

        if (type.calamityTurret) {
          const hasTarget = state.zombies.some(
            (z) =>
              z.row === plant.row &&
              z.x > plant.x &&
              z.hp > 0 &&
              (!z.charmed || !z.curseBomb)
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            firePea(plant, type);
            drainCalamityDurability(plant, type);
            tryCalamityUltra(plant, type);
          }
          return;
        }

        if (type.cherryBombShooter) {
          const hasTarget = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              !zombie.ballooned &&
              Math.abs(zombie.row - plant.row) <= 2 &&
              zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireStarBarrage(plant, type);
          }
          return;
        }

        if (type.explosiveCherry) {
          const hasTarget = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              !zombie.ballooned &&
              zombie.row === plant.row &&
              zombie.x > plant.x &&
              zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireExplosiveCherryVolley(plant, type);
          }
          return;
        }

        if (type.peaFountain) {
          const hasTarget = state.zombies.some(
            (zombie) => !zombie.charmed && zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            firePeaFountain(plant, type);
          }
          return;
        }

        if (type.snapdragon) {
          const cols = type.breathCols || 3;
          const rows = type.breathRows || 1;
          const hasTarget = state.zombies.some(
            (z) =>
              !z.charmed &&
              !z.ballooned &&
              z.hp > 0 &&
              Math.abs(z.row - plant.row) <= rows &&
              z.x > plant.x - 10 &&
              z.x < plant.x + CELL_W * cols + 20
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            breathAttack(plant, type);
          }
          return;
        }

        if (type.iceFireGatling) {
          const enemyInLane = state.zombies.some(
            (z) =>
              !z.charmed && z.row === plant.row && z.x > plant.x && z.hp > 0
          );
          if (enemyInLane && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            firePea(plant, type, 0, plant.row, -4, {
              color: "#8de4ff",
              damage: type.damage,
              slow: type.slow || 0.45,
              slowTime: type.slowTime || 2.5,
            });
            firePea(plant, type, 0.1, plant.row, 4, {
              color: "#ff6a2a",
              damage: type.damage + 10,
              slow: 0,
              slowTime: 0,
            });
          }
          return;
        }

        if (type.voltSnap) {
          const range = CELL_W * (type.voltRange || 9);
          const target = state.zombies
            .filter(
              (z) =>
                !z.charmed &&
                !z.ballooned &&
                z.row === plant.row &&
                z.x > plant.x &&
                z.x < plant.x + range &&
                z.hp > 0
            )
            .sort((a, b) => a.x - b.x)[0];
          if (!target) {
            plant.voltCharge = 0;
            plant.voltTargetId = null;
            return;
          }
          const targetKey = `${target.row}:${Math.round(target.x)}`;
          if (plant.voltTargetId !== targetKey) {
            plant.voltTargetId = targetKey;
            plant.voltCharge = 0;
          }
          plant.voltCharge += dt;
          const dps = voltDps(plant.voltCharge);
          target.hp -= dps * dt;
          if (Math.random() < (type.chainChance || 0.5) * dt * 2) {
            const chainDmg = dps * 0.5 * 0.35;
            state.zombies
              .filter(
                (z) =>
                  z !== target &&
                  !z.charmed &&
                  z.hp > 0 &&
                  Math.abs(z.row - target.row) <= 1 &&
                  Math.abs(z.x - target.x) < CELL_W * 2
              )
              .slice(0, type.chainTargets || 3)
              .forEach((z) => {
                z.hp -= chainDmg;
                addExplosion(z.x, z.y - 8, "#7cf0ff", 0.22);
              });
          }
          if (Math.floor(state.time * 8) !== Math.floor((state.time - dt) * 8)) {
            addExplosion(
              (plant.x + target.x) / 2,
              plant.y - 8,
              "#7cf0ff",
              0.12
            );
          }
          return;
        }

        if (type.bonkChoy) {
          const reach = CELL_W * 1.05;
          const target = state.zombies
            .filter(
              (z) =>
                !z.charmed &&
                !z.ballooned &&
                z.row === plant.row &&
                Math.abs(z.x - plant.x) < reach &&
                z.hp > 0
            )
            .sort(
              (a, b) => Math.abs(a.x - plant.x) - Math.abs(b.x - plant.x)
            )[0];
          if (target && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            target.hp -= type.damage;
            addExplosion(target.x, target.y - 10, "#b8d85a", 0.18);
            AudioFX.hit();
          }
          return;
        }

        if (type.starShooter) {
          if (type.starMeteorEvery) {
            plant.meteorTimer =
              (plant.meteorTimer ?? type.starMeteorEvery) - dt;
            if (plant.meteorTimer <= 0) {
              plant.meteorTimer = type.starMeteorEvery;
              dropStarMeteor(plant, type);
            }
          }
          const hasTarget = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              zombie.hp > 0 &&
              (type.globalStars ||
                (Math.abs(zombie.row - plant.row) <= 2 &&
                  Math.abs(zombie.x - plant.x) < CELL_W * 5))
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireStarfruitVolley(plant, type);
          }
          return;
        }

        if (type.magnetDart) {
          const balloonInLane = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              zombie.ballooned &&
              zombie.row === plant.row &&
              zombie.x > plant.x &&
              zombie.hp > 0
          );
          plant.cactusTall = balloonInLane;
          const hasTarget = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              zombie.row === plant.row &&
              zombie.x > plant.x &&
              zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            firePea(plant, type, 0, plant.row, balloonInLane ? -30 : 0);
            const last = state.projectiles[state.projectiles.length - 1];
            if (last) {
              last.magnetDart = true;
              last.metalBonus = type.metalBonus || 0;
              last.balloonDart = true;
              last.color = type.peaColor || "#7cf0ff";
            }
          }
          return;
        }

        if (type.balloonCounter) {
          const balloonInLane = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              zombie.ballooned &&
              zombie.row === plant.row &&
              zombie.x > plant.x &&
              zombie.hp > 0
          );
          plant.cactusTall = balloonInLane;
          const hasTarget = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              zombie.row === plant.row &&
              zombie.x > plant.x &&
              zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            firePea(plant, type, 0, plant.row, balloonInLane ? -30 : 0);
          }
          return;
        }

        if (type.magicCatgirl) {
          const hasTarget = state.zombies.some(
            (zombie) => !zombie.charmed && zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireMagicCatgirl(plant, type);
          }
          return;
        }

        if (type.tripleCatgirl) {
          const lanes = [plant.row - 1, plant.row, plant.row + 1].filter(
            (row) => row >= rowOffset() && row < rowOffset() + activeRows()
          );
          const maxX = plant.x + CELL_W * (type.breathCols || 4) + 10;
          const hasTarget = state.zombies.some(
            (zombie) =>
              !zombie.charmed &&
              !zombie.ballooned &&
              lanes.includes(zombie.row) &&
              zombie.x > plant.x &&
              zombie.x <= maxX &&
              zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireTripleCatgirl(plant, type);
          }
          return;
        }

        if (type.sniper) {
          const hasTarget = state.zombies.some(
            (zombie) => !zombie.charmed && zombie.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireSniper(plant, type);
          }
          return;
        }

        if (type.laserBean) {
          const hasTarget = state.zombies.some(
            (z) =>
              !z.charmed && z.row === plant.row && z.x > plant.x && z.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireLaserBean(plant, type);
          }
          return;
        }

        if (type.threeLanePea) {
          const lanes = [plant.row - 1, plant.row, plant.row + 1].filter(
            (r) => r >= rowOffset() && r < rowOffset() + activeRows()
          );
          const hasTarget = state.zombies.some(
            (z) =>
              !z.charmed &&
              lanes.includes(z.row) &&
              z.x > plant.x &&
              z.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            lanes.forEach((row, index) => {
              firePea(plant, type, index * 0.06, row);
            });
          }
          return;
        }

        if (type.sakuraShooter) {
          const lanes = [plant.row - 1, plant.row, plant.row + 1].filter(
            (r) => r >= rowOffset() && r < rowOffset() + activeRows()
          );
          const hasTarget = state.zombies.some(
            (z) =>
              !z.charmed &&
              lanes.includes(z.row) &&
              z.x > plant.x &&
              z.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            fireSakuraVolley(plant, type);
          }
          return;
        }

        if (type.dragonBruit) {
          const lanes = type.threeLane
            ? [plant.row - 1, plant.row, plant.row + 1].filter(
                (r) => r >= rowOffset() && r < rowOffset() + activeRows()
              )
            : [plant.row];
          const hasTarget = state.zombies.some(
            (z) =>
              !z.charmed &&
              lanes.includes(z.row) &&
              z.x > plant.x - 20 &&
              z.hp > 0
          );
          if (hasTarget && plant.shootTimer <= 0) {
            plant.shootTimer = type.shootEvery;
            const powered = isShadowPowered(plant);
            lanes.forEach((row, index) => {
              setTimeout(() => {
                if (state.running && !plant.dead) {
                  fireDragonSeed(plant, type, row, powered);
                }
              }, index * 80);
            });
          }
          return;
        }

        if (type.mowerShot) {
          const rowsUnderAttack = [
            ...new Set(
              state.zombies
                .filter((z) => !z.charmed && z.hp > 0)
                .map((z) => z.row)
            ),
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
          (z) =>
            !z.charmed && z.row === plant.row && z.x > plant.x && z.hp > 0
        );
        if (enemyInLane && plant.shootTimer <= 0) {
          if (type.commandoUltimate && plant.ultimateTimer <= 0) {
            if (Math.random() < type.commandoUltimate) {
              plant.ultimateTimer = 5;
              plant.invulnTimer = 5;
              plant.hp = plant.maxHp;
              addExplosion(plant.x, plant.y, "#ffe45c", 0.7);
              toast("Коммандо: стальной шторм!");
            }
          }

          if (type.doomVolleyUltimate) {
            plant.volleyCount = (plant.volleyCount || 0) + 1;
            if (plant.volleyCount % 4 === 0) {
              plant.shootTimer = 4.5;
              firePea(plant, type, 0, plant.row, 0, {
                doomShell: true,
                damage: 1800,
                splash: 1800,
                color: "#2a1038",
                knockback: 40,
              });
              addExplosion(plant.x + 30, plant.y, "#5a2080", 0.55);
              return;
            }
          }

          plant.shootTimer = type.shootEvery;
          if (type.stackable) {
            const heads = plant.heads || 1;
            for (let i = 0; i < heads; i++) {
              firePea(plant, type, i * 0.05, plant.row, (i - (heads - 1) / 2) * 5);
            }
          } else if (type.shotCount > 1) {
            firePlantVolley(plant, type);
          } else {
            firePea(plant, type);
            if (type.doubleShot) firePea(plant, type, 0.18);
          }
        }
      }
    });

    if (toRemove.length) {
      state.plants = state.plants.filter((p) => !toRemove.includes(p));
    }
  }

  function updateZombies(dt) {
    const doomedAllies = [];

    state.craters.forEach((c) => {
      c.timer -= dt;
    });
    state.craters = state.craters.filter((c) => c.timer > 0);

    state.zombies.forEach((zombie) => {
      const type = ZOMBIE_TYPES[zombie.typeId];

      if (zombie.slowTimer > 0) {
        zombie.slowTimer -= dt;
        if (zombie.slowTimer <= 0) zombie.slowFactor = 1;
      }
      if (zombie.stunTimer > 0) {
        zombie.stunTimer = Math.max(0, zombie.stunTimer - dt);
      }

      if (zombie.charmed) {
        if (zombie.stunTimer > 0) {
          zombie.eating = false;
          return;
        }
        const foe = state.zombies.find(
          (z) =>
            !z.charmed &&
            z.row === zombie.row &&
            Math.abs(z.x - zombie.x) < (type.zomboni ? 42 : 36) &&
            z.hp > 0
        );
        if (foe) {
          zombie.eating = true;
          zombie.biteTimer -= dt;
          if (zombie.biteTimer <= 0) {
            zombie.biteTimer = type.biteEvery;
            foe.hp -= type.damage;
            AudioFX.bite();
            if (type.zomboni) {
              foe.slowFactor = 0.45;
              foe.slowTimer = Math.max(foe.slowTimer || 0, 2.5);
              addExplosion(foe.x, foe.y + 8, "#9ad8ff", 0.2);
            }
          }
        } else {
          zombie.eating = false;
          zombie.x += type.speed * zombie.slowFactor * dt;
          if (zombie.x > canvas.width + 80) zombie.hp = 0;
        }
        if (zombie.hp <= 0 && zombie.curseBomb) doomedAllies.push(zombie);
        return;
      }

      if (zombie.ballooned) {
        zombie.eating = false;
        const balloonShield = state.forcefields.find(
          (f) =>
            f.blocksBalloon &&
            f.hp > 0 &&
            Math.abs(zombie.x - f.x) < 28
        );
        if (balloonShield) {
          balloonShield.hp -= type.damage * dt * 8;
          addExplosion(zombie.x, zombie.y, "#7cf0ff", 0.15);
          if (balloonShield.hp <= 0) zombie.x = balloonShield.x - 5;
          return;
        }
        zombie.x -= type.speed * zombie.slowFactor * dt;
        return;
      }

      const shield = state.forcefields.find(
        (f) => f.hp > 0 && Math.abs(zombie.x - f.x) < 28
      );
      if (shield) {
        zombie.eating = true;
        zombie.biteTimer -= dt;
        if (zombie.biteTimer <= 0) {
          zombie.biteTimer = type.biteEvery;
          shield.hp -= type.damage;
          AudioFX.bite();
          addExplosion(shield.x, zombie.y, "#7cf0ff", 0.2);
        }
        return;
      }

      // Картофельная мина / горохомина
      const mine = state.plants.find(
        (p) =>
          (p.typeId === "potatomine" || PLANT_TYPES[p.typeId]?.peaMine) &&
          p.armed &&
          p.row === zombie.row &&
          Math.abs(p.x - zombie.x) < 40 &&
          p.hp > 0
      );
      if (mine) {
        const mType = PLANT_TYPES[mine.typeId];
        damageZombiesInRadius(
          mine.x,
          mine.y,
          mType.blastRadius,
          mType.blastDamage
        );
        addExplosion(mine.x, mine.y, "#c9a227", 0.5);
        AudioFX.explode();
        state.plants = state.plants.filter((p) => p !== mine);
        return;
      }

      const plant = state.plants.find(
        (p) =>
          p.row === zombie.row &&
          Math.abs(p.x - zombie.x) < 36 &&
          p.hp > 0 &&
          !p.holoBroken
      );

      if (zombie.stunTimer > 0) {
        zombie.eating = false;
      } else if (zombie.fleeTimer > 0) {
        zombie.eating = false;
        zombie.fleeTimer -= dt;
        zombie.x += type.speed * zombie.slowFactor * dt * 1.35;
      } else if (plant) {
        const plantType = PLANT_TYPES[plant.typeId];
        if (plantType && plantType.hypnoShroom) {
          charmZombie(zombie, !!plantType.curseExplode);
          plant.hypnoUsesLeft =
            plant.hypnoUsesLeft ?? plantType.multiHypnoUses ?? 1;
          plant.hypnoUsesLeft -= 1;
          if (plant.hypnoUsesLeft <= 0) destroyPlant(plant);
          toast("Зомби загипнотизирован!");
          return;
        }
        zombie.eating = true;
        zombie.biteTimer -= dt;
        if (zombie.biteTimer <= 0) {
          zombie.biteTimer = type.biteEvery;
          if (plant.invulnTimer > 0) {
            addExplosion(plant.x, plant.y - 10, "#ffe45c", 0.2);
            return;
          }
          if (plantType?.holonut) plant.noDamageTimer = 0;
          const heavyAttacker = ["giant", "knight", "zomboni"].includes(
            zombie.typeId
          );
          let attackDamage =
            plantType?.nutFortress && heavyAttacker
              ? plantType.heavyHitDamage || 500
              : type.damage;
          if (plantType?.blastResist && heavyAttacker) {
            attackDamage *= plantType.blastResist;
          }
          const guard = state.plants.find(
            (p) =>
              p !== plant &&
              !p.dead &&
              PLANT_TYPES[p.typeId]?.mechaGuard &&
              Math.abs(p.col - plant.col) <= 1 &&
              Math.abs(p.row - plant.row) <= 1
          );
          if (guard) {
            guard.hp -= attackDamage * 2;
            addExplosion(guard.x, guard.y, "#7a8a98", 0.25);
            if (guard.hp <= 0) destroyPlant(guard);
            AudioFX.bite();
            return;
          }
          if (plant.armorHp > 0) {
            plant.armorHp = Math.max(0, plant.armorHp - attackDamage);
          } else {
            let bite = attackDamage;
            const plantType = PLANT_TYPES[plant.typeId];
            if (
              plantType &&
              plantType.calamityTurret &&
              plant.hp < (plantType.resistBelow || 1250)
            ) {
              bite *= plantType.resistFactor || 0.25;
            }
            if (plantType?.damageCapRatio) {
              bite = Math.min(bite, Math.max(1, plant.hp * plantType.damageCapRatio));
            }
            if (plantType?.damageCapFlat) {
              bite = Math.min(bite, plantType.damageCapFlat);
            }
            if (amalGod()) bite = Math.min(bite, 1);
            plant.hp -= bite;
            if (plantType?.thorns || plantType?.flameNut) {
              zombie.hp -= plantType.thornDamage || 25;
              addExplosion(
                zombie.x,
                zombie.y - 8,
                plantType.flameNut ? "#ff6a2a" : "#d8e85a",
                0.2
              );
            }
            if (plantType?.sunOnHit && state.side === "plants") {
              state.suns.push({
                x: plant.x + (Math.random() * 20 - 10),
                y: plant.y - 24,
                vy: -28,
                value: plantType.sunOnHit,
                life: 8,
              });
            }
          }
          AudioFX.bite();
          if (plant.hp <= 0) {
            destroyPlant(plant);
          }
        }
      } else {
        zombie.eating = false;
        zombie.x -= type.speed * zombie.slowFactor * dt;
      }

      if (zombie.poisonTimer > 0) {
        zombie.poisonTimer -= dt;
        zombie.hp -= (zombie.poisonDps || 20) * dt;
      }
    });

    doomedAllies.forEach((ally) => {
      triggerDoomBlast(ally.x, ally.y, 900, 2.5, {});
    });

    removeDeadZombies();
  }

  function maybeDropHealingPowder(zombie) {
    if (
      state.labMode ||
      state.side !== "plants" ||
      zombie.charmed ||
      zombie.powderChecked
    ) {
      return;
    }
    zombie.powderChecked = true;
    if (Math.random() >= 0.2) return;
    state.powderDrops.push({
      x: Math.max(LEFT + 15, Math.min(canvas.width - 25, zombie.x)),
      y: zombie.y - 18,
      vy: -28,
      life: 14,
    });
  }

  function removeDeadZombies() {
    state.zombies.forEach((zombie) => {
      if (zombie.hp <= 0) maybeDropHealingPowder(zombie);
    });
    state.zombies = state.zombies.filter((zombie) => zombie.hp > 0);
  }

  function updateForcefields(dt) {
    state.forcefields.forEach((f) => {
      f.life -= dt;
    });
    state.forcefields = state.forcefields.filter((f) => f.hp > 0 && f.life > 0);
  }

  function drawForcefields() {
    state.forcefields.forEach((f) => {
      const pulse = 0.45 + Math.sin(state.time * 5) * 0.12;
      ctx.save();
      ctx.strokeStyle = `rgba(100, 220, 255, ${0.55 + pulse})`;
      ctx.fillStyle = `rgba(80, 200, 255, ${0.12 + pulse * 0.1})`;
      ctx.lineWidth = 4;
      const top = TOP + rowOffset() * CELL_H;
      const h = activeRows() * CELL_H;
      ctx.fillRect(f.x - 8, top, 16, h);
      ctx.strokeRect(f.x - 8, top, 16, h);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(f.x - 20, top - 10, 40, 5);
      ctx.fillStyle = "#7cf0ff";
      ctx.fillRect(f.x - 20, top - 10, 40 * (f.hp / f.maxHp), 5);
      ctx.restore();
    });
  }

  function updateMowers(dt) {
    const triggerX = LEFT + 8;

    state.mowers.forEach((mower) => {
      if (!mower.used && !mower.active) {
        const touch = state.zombies.find(
          (z) =>
            !z.charmed &&
            !z.ballooned &&
            z.row === mower.row &&
            z.hp > 0 &&
            z.x <= triggerX
        );
        if (touch) {
          mower.active = true;
          mower.used = true;
          if (state.labMode) {
            state.mowers.push(createMower(mower.row));
          }
          AudioFX.mower();
          toast(
            state.labMode
              ? "Газонокосилка сработала и сразу восстановлена!"
              : "Газонокосилка!"
          );
        }
      }

      if (mower.active) {
        mower.x += mower.speed * dt;
        state.zombies.forEach((z) => {
          if (
            !z.charmed &&
            !z.ballooned &&
            z.row === mower.row &&
            z.hp > 0 &&
            Math.abs(z.x - mower.x) < 30
          ) {
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

    if (state.labMode) {
      state.mowers = state.mowers.filter((mower) => !mower.gone);
    }
    removeDeadZombies();
  }

  function popZombieBalloon(zombie) {
    if (!zombie?.ballooned) return;
    zombie.ballooned = false;
    zombie.stunTimer = Math.max(zombie.stunTimer || 0, 0.8);
    addExplosion(zombie.x, zombie.y - 55, "#ff3a4a", 0.55);
    addExplosion(zombie.x, zombie.y - 35, "#ffd84d", 0.3);
    AudioFX.explode();
    toast("🎈 Шар лопнул — теперь зомби можно атаковать!");
  }

  function updateProjectiles(dt) {
    state.projectiles.forEach((p) => {
      if (p.sniperShot) {
        p.life -= dt;
        if (p.life <= 0) p.dead = true;
        return;
      }

      if (p.homingShot) {
        if (
          !p.target ||
          p.target.hp <= 0 ||
          p.target.charmed ||
          p.target.ballooned
        ) {
          p.target = state.zombies
            .filter(
              (zombie) =>
                !zombie.charmed && !zombie.ballooned && zombie.hp > 0
            )
            .sort((a, b) => a.x - b.x)[0];
        }
        if (!p.target) {
          p.dead = true;
          return;
        }

        p.trail = p.trail || [];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 9) p.trail.shift();
        const targetY = p.target.y - 10;
        const dx = p.target.x - p.x;
        const dy = targetY - p.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const step = Math.min(distance, p.speed * dt);
        p.x += (dx / distance) * step;
        p.y += (dy / distance) * step;
        p.row = p.target.row;

        if (distance <= 18) {
          p.target.hp -= p.damage;
          addExplosion(p.target.x, targetY, p.color, 0.2);
          AudioFX.hit();
          p.dead = true;
        }
        return;
      }

      if (p.lobShot) {
        p.progress += p.speed * dt;
        const t = Math.min(1, p.progress);
        p.x = p.startX + (p.endX - p.startX) * t;
        p.y = p.startY + (p.endY - p.startY) * t - Math.sin(t * Math.PI) * 75;
        if (t >= 1) {
          if (p.areaImpact) {
            const victims = state.zombies.filter(
              (z) =>
                !z.charmed &&
                !z.ballooned &&
                z.hp > 0 &&
                Math.abs(z.row - p.row) <= 1 &&
                Math.abs(z.x - p.x) < 75
            );
            victims.forEach((z) => {
              z.hp -= p.damage;
              if (p.slow) {
                z.slowFactor = p.slow;
                z.slowTimer = Math.max(z.slowTimer || 0, p.slowTime || 3);
              }
            });
            addExplosion(p.x, p.y, p.color, 0.32);
            if (victims.length) AudioFX.hit();
            p.dead = true;
            return;
          }
          const hits = state.zombies.filter(
            (z) =>
              !z.charmed &&
              !z.ballooned &&
              z.row === p.row &&
              Math.abs(z.x - p.x) < 40 &&
              z.hp > 0
          );
          if (hits.length) {
            hits.forEach((hit) => {
              hit.hp -= p.damage;
              if (p.stunTime) {
                hit.stunTimer = Math.max(hit.stunTimer || 0, p.stunTime);
              }
              if (p.poison) {
                hit.poisonTimer = Math.max(hit.poisonTimer || 0, p.poisonTime);
                hit.poisonDps = p.poisonDps;
              }
            });
            if (p.splash) {
              state.zombies.forEach((z) => {
                if (
                  !z.charmed &&
                  !z.ballooned &&
                  z.hp > 0 &&
                  Math.abs(z.row - p.row) <= 1 &&
                  Math.abs(z.x - p.x) < 70 &&
                  !hits.includes(z)
                ) {
                  z.hp -= p.splash;
                  if (p.poison) {
                    z.poisonTimer = Math.max(z.poisonTimer || 0, p.poisonTime * 0.6);
                    z.poisonDps = p.poisonDps;
                  }
                }
              });
            }
            addExplosion(p.x, p.y, p.color, 0.28);
            AudioFX.hit();
          }
          p.dead = true;
        }
        return;
      }

      if (p.freeMove) {
        p.x += (p.vx || 0) * dt;
        p.y += (p.vy || 0) * dt;
        p.row = Math.max(
          0,
          Math.min(
            ROWS - 1,
            Math.round((p.y + 8 - TOP - CELL_H / 2) / CELL_H)
          )
        );
      } else {
        p.x += p.speed * dt;
      }
      if (p.calamityShot) {
        if (!p.hitIds) p.hitIds = new Set();
        const targets = state.zombies.filter(
          (z) =>
            z.row === p.row &&
            !z.ballooned &&
            Math.abs(z.x - p.x) < 28 &&
            z.hp > 0 &&
            !p.hitIds.has(z) &&
            (!z.charmed || !z.curseBomb)
        );
        targets.forEach((hit) => {
          if ((p.pierceLeft || 0) <= 0) return;
          p.hitIds.add(hit);
          p.pierceLeft -= 1;
          if (hit.charmed && !hit.curseBomb) {
            hit.curseBomb = true;
            addExplosion(hit.x, hit.y - 8, "#c48bff", 0.35);
          } else if (!hit.charmed) {
            applyCalamityHit(hit, p);
          }
          AudioFX.hit();
        });
        if ((p.pierceLeft || 0) <= 0 || p.x > canvas.width + 40) p.dead = true;
        return;
      }

      if (p.chompSpit) {
        if (!p.hitIds) p.hitIds = new Set();
        const pierced = state.zombies.filter(
          (z) =>
            !z.charmed &&
            !z.ballooned &&
            z.row === p.row &&
            Math.abs(z.x - p.x) < 26 &&
            z.hp > 0 &&
            !p.hitIds.has(z)
        );
        pierced.forEach((hit) => {
          hit.hp -= p.damage;
          p.hitIds.add(hit);
          if (p.pierce) {
            hit.x = Math.min(canvas.width + 20, hit.x + 18);
          } else {
            p.dead = true;
          }
          addExplosion(hit.x, hit.y, "#8a6a5a", 0.22);
          AudioFX.hit();
        });
        if (p.x > canvas.width + 40) p.dead = true;
        return;
      }

      if (p.cornShot) {
        if (!p.hitIds) p.hitIds = new Set();
        const pierced = state.zombies.filter(
          (z) =>
            !z.charmed &&
            !z.ballooned &&
            z.row === p.row &&
            Math.abs(z.x - p.x) < 26 &&
            z.hp > 0 &&
            !p.hitIds.has(z)
        );
        pierced.forEach((hit) => {
          hit.hp -= p.damage;
          p.hitIds.add(hit);
          if (
            hit.x - p.originX <= p.knockbackRange &&
            Math.random() < p.knockbackChance
          ) {
            hit.x = Math.min(canvas.width + 20, hit.x + 65);
            addExplosion(hit.x, hit.y, "#f5c842", 0.22);
          }
        });
        if (pierced.length) AudioFX.hit();
        if (p.x > canvas.width + 40) p.dead = true;
        return;
      }

      if (p.laserShot) {
        if (!p.hitIds) p.hitIds = new Set();
        const pierced = state.zombies.filter(
          (z) =>
            !z.charmed &&
            !z.ballooned &&
            z.row === p.row &&
            z.x >= p.originX - 10 &&
            z.x <= p.x + 18 &&
            z.hp > 0 &&
            !p.hitIds.has(z)
        );
        pierced.forEach((hit) => {
          hit.hp -= p.damage;
          p.hitIds.add(hit);
          addExplosion(hit.x, hit.y - 6, "#7ae8ff", 0.18);
        });
        if (pierced.length) AudioFX.hit();
        if (p.x > canvas.width + 40) p.dead = true;
        return;
      }

      const hit = state.zombies.find(
        (z) =>
          !z.charmed &&
          z.hp > 0 &&
          (p.balloonDart || !z.ballooned) &&
          (!p.hitIds || !p.hitIds.has(z)) &&
          (p.fountainPea
            ? Math.hypot(z.x - p.x, z.y - 8 - p.y) < 30
            : z.row === p.row &&
              Math.abs(z.x - p.x) < (p.mowerShot ? 44 : 24))
      );
      if (hit) {
        if (p.mowerShot) {
          hit.hp = 0;
          addExplosion(hit.x, hit.y, "#c0c8d0", 0.3);
          AudioFX.mower();
          if (!p.hitIds) p.hitIds = new Set();
          p.hitIds.add(hit);
        } else if (p.balloonDart && hit.ballooned) {
          popZombieBalloon(hit);
          hit.hp -= p.damage;
          p.dead = true;
        } else {
          let dmg = p.damage;
          if (
            p.magnetDart &&
            p.metalBonus &&
            !hit.metalStripped &&
            (hit.typeId === "bucket" ||
              hit.typeId === "tank" ||
              hit.typeId === "zomboni" ||
              hit.typeId === "knight")
          ) {
            dmg += p.metalBonus;
            hit.metalStripped = true;
            addExplosion(hit.x, hit.y - 10, "#7cf0ff", 0.3);
          }
          hit.hp -= dmg;
          if (p.starKnockback) {
            hit.x = Math.min(canvas.width + 20, hit.x + p.starKnockback);
            addExplosion(hit.x, hit.y - 4, "#ffd84d", 0.2);
          }
          if (p.footballPea) {
            hit.fleeTimer = Math.max(hit.fleeTimer || 0, 4);
            hit.eating = false;
            addExplosion(hit.x, hit.y - 8, "#d62828", 0.35);
          }
          if (p.doomShell) {
            const splashRange = CELL_W * 2.5;
            state.zombies.forEach((zombie) => {
              if (
                zombie !== hit &&
                !zombie.charmed &&
                !zombie.ballooned &&
                zombie.hp > 0 &&
                Math.abs(zombie.row - hit.row) <= 2 &&
                Math.abs(zombie.x - hit.x) < splashRange
              ) {
                zombie.hp -= p.splash || 1800;
              }
            });
            addExplosion(hit.x, hit.y, "#4a1870", 0.9);
            addExplosion(hit.x + 20, hit.y - 10, "#2a1038", 0.6);
            AudioFX.explode();
          }
          if (p.starBulletKind === "egg") {
            state.zombies.forEach((zombie) => {
              if (
                zombie !== hit &&
                !zombie.charmed &&
                !zombie.ballooned &&
                zombie.hp > 0 &&
                Math.abs(zombie.row - hit.row) <= 1 &&
                Math.abs(zombie.x - hit.x) < 50
              ) {
                zombie.hp -= p.splash || 12;
                zombie.slowFactor = p.slow;
                zombie.slowTimer = p.slowTime;
              }
            });
            addExplosion(hit.x, hit.y - 6, "#fff6e2", 0.32);
            addExplosion(hit.x + 6, hit.y - 10, "#ffcf3d", 0.26);
          }
          if (p.cherryShot || p.starBulletKind === "seed") {
            const splash = p.explosiveCherry
              ? p.splash || p.damage
              : p.splash || (p.cherryShot ? 10 : 8);
            const splashRange = p.explosiveCherry ? CELL_W * 1.45 : 45;
            state.zombies.forEach((zombie) => {
              if (
                zombie !== hit &&
                !zombie.charmed &&
                !zombie.ballooned &&
                zombie.hp > 0 &&
                Math.abs(zombie.row - hit.row) <= 1 &&
                Math.abs(zombie.x - hit.x) < splashRange
              ) {
                zombie.hp -= splash;
              }
            });
            addExplosion(
              hit.x,
              hit.y - 6,
              p.cherryShot ? "#ed2945" : "#f0c840",
              p.explosiveCherry ? 0.55 : 0.38
            );
            addExplosion(hit.x + 8, hit.y - 12, "#ffd84d", 0.24);
            if (p.explosiveCherry) {
              addExplosion(hit.x - 14, hit.y + 4, "#ff6a2a", 0.35);
            }
            if (p.cherryShot) absorbCherryExplosion(hit.x, hit.y);
          }
          if (p.slow) {
            hit.slowFactor = p.slow;
            hit.slowTimer = p.slowTime;
          }
          AudioFX.hit();
          p.dead = true;
        }
      }
      if (p.x > canvas.width + 40) p.dead = true;
      if (
        p.freeMove &&
        (p.x < LEFT - 90 ||
          p.y < TOP - 70 ||
          p.y > TOP + ROWS * CELL_H + 70)
      ) {
        p.dead = true;
      }
    });
    state.projectiles = state.projectiles.filter((p) => !p.dead);
    removeDeadZombies();
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

  function updatePowderDrops(dt) {
    state.powderDrops.forEach((powder) => {
      powder.life -= dt;
      powder.y += powder.vy * dt;
      powder.vy += 55 * dt;
      const floorY = TOP + ROWS * CELL_H - 24;
      if (powder.y > floorY) {
        powder.y = floorY;
        powder.vy = 0;
      }
    });
    state.powderDrops = state.powderDrops.filter((powder) => powder.life > 0);
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

      const threat = state.zombies.some(
        (z) => !z.charmed && z.row === row && z.x < 500
      );
      let typeId = shooters[Math.floor(Math.random() * shooters.length)];
      if (threat && level.id > 1 && Math.random() < 0.35) typeId = "wallnut";
      placePlant(typeId, col, row, true);
      break;
    }
  }

  function checkWinLose() {
    if (state.labMode) return;
    const pastHouse = LEFT - 35;
    if (state.side === "plants" && !state.labMode) {
      // Проигрыш, если зомби прошёл, а косилки в ряду уже нет
      const leaked = state.zombies.some((z) => {
        if (z.charmed) return false;
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
        state.zombies.filter((z) => !z.charmed).length === 0 &&
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
    const world = currentWorld();
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (state.side === "zombies") {
      g.addColorStop(0, world.zombieSkyTop);
      g.addColorStop(1, world.zombieSkyBottom);
    } else {
      g.addColorStop(0, world.skyTop);
      g.addColorStop(1, world.skyBottom);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (world.id === "frost") {
      // Ледяной замок вместо обычного дома
      const ice = ctx.createLinearGradient(0, 0, LEFT - 10, 0);
      ice.addColorStop(0, "#4d8fc2");
      ice.addColorStop(0.55, "#8ed8f5");
      ice.addColorStop(1, "#d8f6ff");
      ctx.fillStyle = ice;
      ctx.fillRect(0, 0, LEFT - 10, canvas.height);

      ctx.fillStyle = "#78c9ec";
      ctx.fillRect(12, 55, 56, canvas.height - 55);
      ctx.fillRect(3, 78, 20, canvas.height - 78);
      ctx.fillRect(57, 78, 20, canvas.height - 78);

      // Ледяные башни и острые шпили
      ctx.fillStyle = "#c9f4ff";
      ctx.beginPath();
      ctx.moveTo(3, 78);
      ctx.lineTo(13, 32);
      ctx.lineTo(23, 78);
      ctx.moveTo(57, 78);
      ctx.lineTo(67, 28);
      ctx.lineTo(77, 78);
      ctx.moveTo(20, 55);
      ctx.lineTo(28, 36);
      ctx.lineTo(36, 55);
      ctx.lineTo(44, 34);
      ctx.lineTo(52, 55);
      ctx.closePath();
      ctx.fill();

      // Светящиеся окна
      for (let i = 0; i < 5; i++) {
        const windowY = 92 + i * 82;
        ctx.fillStyle = "rgba(225, 250, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(29, windowY, 22, 30, 8);
        ctx.fill();
        ctx.strokeStyle = "#4c9dcc";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(40, windowY);
        ctx.lineTo(40, windowY + 30);
        ctx.moveTo(29, windowY + 15);
        ctx.lineTo(51, windowY + 15);
        ctx.stroke();
      }

      // Блики и трещины во льду
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(17, 95);
      ctx.lineTo(12, 130);
      ctx.lineTo(18, 145);
      ctx.moveTo(63, 185);
      ctx.lineTo(69, 215);
      ctx.lineTo(62, 235);
      ctx.moveTo(20, 330);
      ctx.lineTo(12, 360);
      ctx.lineTo(18, 380);
      ctx.stroke();
    } else {
      ctx.fillStyle = world.house;
      ctx.fillRect(0, 0, LEFT - 10, canvas.height);
      ctx.fillStyle = world.houseDetail;
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(8, 40 + i * 90, 50, 55);
        ctx.fillStyle = "#c9e8ff";
        ctx.fillRect(18, 50 + i * 90, 14, 14);
        ctx.fillRect(38, 50 + i * 90, 14, 14);
        ctx.fillStyle = world.houseDetail;
      }
    }

    // Маленькая иконка мира слева сверху
    ctx.font = "22px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(world.icon, 18, 28);

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
        if (world.id === "pirate") {
          // Вода под дорожками
          ctx.fillStyle = (r + c) % 2 === 0 ? "#2385a5" : "#1d7898";
          ctx.fillRect(x, y, CELL_W, CELL_H);
          ctx.strokeStyle = "rgba(170,235,255,0.35)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 25);
          ctx.quadraticCurveTo(x + 20, y + 18, x + 32, y + 25);
          ctx.quadraticCurveTo(x + 44, y + 32, x + 56, y + 25);
          ctx.stroke();

          if (isPlantableCell(c, r)) {
            // Деревянный настил, удерживающий растения над водой
            ctx.fillStyle = (r + c) % 2 === 0 ? "#9a6735" : "#87572d";
            ctx.fillRect(x + 2, y + 10, CELL_W - 4, CELL_H - 20);
            ctx.strokeStyle = "#5c381f";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 10, CELL_W - 4, CELL_H - 20);
            for (let board = 1; board < 4; board++) {
              ctx.beginPath();
              ctx.moveTo(x + 2, y + 10 + board * 17);
              ctx.lineTo(x + CELL_W - 2, y + 10 + board * 17);
              ctx.stroke();
            }
            ctx.fillStyle = "#d0a15f";
            ctx.beginPath();
            ctx.arc(x + 10, y + 18, 2, 0, Math.PI * 2);
            ctx.arc(x + CELL_W - 10, y + CELL_H - 18, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = (r + c) % 2 === 0 ? world.cellLight : world.cellDark;
          ctx.fillRect(x, y, CELL_W, CELL_H);
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.strokeRect(x, y, CELL_W, CELL_H);
        }
      }
    }

    if (world.id === "pirate") {
      // Бочки поддерживают концы настилов
      for (let r = startRow; r < startRow + activeRows(); r++) {
        const end = PIRATE_PLANK_ENDS[r] ?? 3;
        const pos = cellCenter(end, r);
        ctx.fillStyle = "#6b3f24";
        ctx.beginPath();
        ctx.ellipse(
          pos.x + CELL_W / 2 - 8,
          pos.y + CELL_H / 2 - 14,
          11,
          18,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.strokeStyle = "#c08a4c";
        ctx.lineWidth = 2;
        ctx.stroke();
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

    const standingOnWater =
      type.waterWalking &&
      currentWorld().id === "pirate" &&
      !isPlantableCell(plant.col, plant.row);
    if (standingOnWater) {
      ctx.strokeStyle = "rgba(133, 235, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 28, 30, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 28, 20, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(0, 28, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const id = plant.typeId;
    if (id === "giftbox") {
      const pulse = 1 + Math.sin(state.time * 5) * 0.04;
      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#d62f3f";
      ctx.strokeStyle = "#7e1725";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-25, -15, 50, 42, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f7f2e8";
      ctx.fillRect(-5, -15, 10, 42);
      ctx.fillRect(-25, -4, 50, 10);
      ctx.strokeStyle = "#d9d3ca";
      ctx.lineWidth = 2;
      ctx.strokeRect(-5, -15, 10, 42);
      ctx.strokeRect(-25, -4, 50, 10);

      // Большой белый бант
      ctx.fillStyle = "#fffaf4";
      ctx.strokeStyle = "#c9c3bd";
      ctx.beginPath();
      ctx.ellipse(-10, -20, 13, 8, -0.45, 0, Math.PI * 2);
      ctx.ellipse(10, -20, 13, 8, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -17, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const type = PLANT_TYPES.giftbox;
      const progress = Math.max(
        0,
        Math.min(1, 1 - plant.giftTimer / type.giftGrowTime)
      );
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-24, 34, 48, 5);
      ctx.fillStyle = "#ffe45c";
      ctx.fillRect(-24, 34, 48 * progress, 5);
    } else if (id === "lara") {
      // Изогнутый золотой стебель
      ctx.strokeStyle = "#9a6c18";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.bezierCurveTo(-8, 17, 7, 7, 0, -7);
      ctx.stroke();
      ctx.strokeStyle = "#f0c840";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 26);
      ctx.bezierCurveTo(-7, 16, 5, 7, -2, -7);
      ctx.stroke();

      // Красные лепестки поглотителя
      const petalColors = ["#ff4a2d", "#d9232f", "#a8142b"];
      for (let petal = 0; petal < 12; petal++) {
        const angle = (petal / 12) * Math.PI * 2 - Math.PI / 2;
        const radius = petal % 2 === 0 ? 20 : 16;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = petalColors[petal % petalColors.length];
        ctx.strokeStyle = "#74101e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -radius, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Бело-золотое сердце
      ctx.fillStyle = "#fff8dc";
      ctx.strokeStyle = "#c58b18";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -7, 8, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffe45c";
      ctx.beginPath();
      ctx.arc(0, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Капля накопленного солнца
      ctx.fillStyle = "#fff4b0";
      ctx.beginPath();
      ctx.moveTo(-15, 18);
      ctx.quadraticCurveTo(-22, 27, -15, 31);
      ctx.quadraticCurveTo(-8, 27, -15, 18);
      ctx.fill();
    } else if (id === "cherryshooter") {
      // Пятиконечная звезда без стебля, лучи смотрят в стороны выстрелов
      ctx.fillStyle = "#ffd93b";
      ctx.strokeStyle = "#c58f16";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let point = 0; point < 10; point++) {
        const radius = point % 2 === 0 ? 30 : 15;
        const angle = (point * Math.PI) / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffe98a";
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2b1e05";
      ctx.beginPath();
      ctx.arc(-5, -3, 3, 0, Math.PI * 2);
      ctx.arc(5, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2b1e05";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (
      id === "starfruit" ||
      id === "meteofruit" ||
      id === "astrofruit"
    ) {
      const fill =
        id === "astrofruit"
          ? "#c8253a"
          : id === "meteofruit"
            ? "#ff8a3d"
            : "#ffd84d";
      const edge =
        id === "astrofruit"
          ? "#5ee7ff"
          : id === "meteofruit"
            ? "#ff5a1a"
            : "#c58f16";
      if (id === "astrofruit") {
        ctx.shadowColor = "#5ee7ff";
        ctx.shadowBlur = 16;
      }
      ctx.fillStyle = fill;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let point = 0; point < 10; point++) {
        const radius = point % 2 === 0 ? 28 : 13;
        const angle = -Math.PI / 2 + (point * Math.PI) / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = id === "astrofruit" ? "#ffe45c" : "#2b1e05";
      ctx.beginPath();
      ctx.ellipse(-6, -4, 3, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(6, -4, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1010";
      ctx.beginPath();
      ctx.arc(-5, -3, 1.5, 0, Math.PI * 2);
      ctx.arc(7, -3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1010";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 4, 6, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(-3, 5);
      ctx.lineTo(-1, 9);
      ctx.lineTo(1, 5);
      ctx.closePath();
      ctx.moveTo(2, 5);
      ctx.lineTo(4, 9);
      ctx.lineTo(6, 5);
      ctx.closePath();
      ctx.fill();

      if (id === "meteofruit" || id === "astrofruit") {
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + i * ((Math.PI * 2) / 5) + state.time;
          const sx = Math.cos(a) * 34;
          const sy = Math.sin(a) * 34 - 4;
          ctx.fillStyle = id === "astrofruit" ? "#9af7ff" : "#fff4a8";
          ctx.beginPath();
          for (let point = 0; point < 10; point++) {
            const radius = point % 2 === 0 ? 5 : 2;
            const angle = -Math.PI / 2 + (point * Math.PI) / 5;
            const x = sx + Math.cos(angle) * radius;
            const y = sy + Math.sin(angle) * radius;
            if (point === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (id === "sunflower") {
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
    } else if (id === "peashooter" || id === "repeater") {
      // Листья у основания
      ctx.fillStyle = "#32951f";
      ctx.beginPath();
      ctx.ellipse(-11, 21, 15, 7, -0.28, 0, Math.PI * 2);
      ctx.ellipse(11, 21, 15, 7, 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#176b17";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Тонкий изогнутый стебель
      ctx.strokeStyle = "#2d8f25";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.bezierCurveTo(-5, 9, 5, 1, 0, -7);
      ctx.stroke();
      ctx.strokeStyle = "#76d638";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 16);
      ctx.bezierCurveTo(-5, 8, 2, 1, -2, -6);
      ctx.stroke();

      // Листок за головой
      ctx.fillStyle = "#45b92f";
      ctx.strokeStyle = "#176b17";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -19);
      ctx.bezierCurveTo(-31, -31, -33, -12, -25, -5);
      ctx.bezierCurveTo(-23, -17, -16, -20, -14, -19);
      ctx.fill();
      ctx.stroke();

      // Круглая голова
      const peaHead = ctx.createRadialGradient(-7, -23, 3, 0, -14, 23);
      peaHead.addColorStop(0, "#d9ff61");
      peaHead.addColorStop(0.55, "#91df35");
      peaHead.addColorStop(1, "#42aa27");
      ctx.fillStyle = peaHead;
      ctx.strokeStyle = "#267d1d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-1, -14, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Глаза
      ctx.fillStyle = "#17210e";
      ctx.beginPath();
      ctx.ellipse(-7, -22, 3.5, 5.5, 0, 0, Math.PI * 2);
      ctx.ellipse(2, -20, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-8, -24, 1.2, 0, Math.PI * 2);
      ctx.arc(1, -22, 1, 0, Math.PI * 2);
      ctx.fill();

      // Большой ствол
      ctx.fillStyle = "#69c92e";
      ctx.strokeStyle = "#267d1d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(18, -12, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#163d14";
      ctx.beginPath();
      ctx.ellipse(23, -12, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.ellipse(17, -18, 5, 2, -0.2, 0, Math.PI * 2);
      ctx.fill();
      if (id === "repeater") {
        ctx.fillStyle = "#2c8f23";
        ctx.strokeStyle = "#176b17";
        ctx.beginPath();
        ctx.ellipse(-13, -25, 11, 5, -0.55, 0, Math.PI * 2);
        ctx.ellipse(-10, -18, 10, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#d9f15b";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("×2", -1, 6);
      }
    } else if (id === "gatlingturret") {
      const charge = Math.min(1, (plant.gatlingCharge || 0) / 10);
      if (charge > 0) {
        ctx.strokeStyle = `rgba(180,255,70,${0.25 + charge * 0.45})`;
        ctx.lineWidth = 3 + charge * 3;
        ctx.beginPath();
        ctx.arc(0, -2, 34 + Math.sin(state.time * 9) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#267f20";
      ctx.strokeStyle = "#125615";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(-18, 21, 22, 8, -0.25, 0, Math.PI * 2);
      ctx.ellipse(13, 22, 23, 9, 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const bodyGradient = ctx.createRadialGradient(-8, -10, 3, 0, 0, 30);
      bodyGradient.addColorStop(0, "#c6f05d");
      bodyGradient.addColorStop(0.55, "#66be32");
      bodyGradient.addColorStop(1, "#247820");
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.ellipse(-4, -2, 27, 25, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#17270f";
      ctx.beginPath();
      ctx.ellipse(-8, -9, 4, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(1, -8, 3.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-9, -11, 1.3, 0, Math.PI * 2);
      ctx.arc(0, -10, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3f9e2c";
      ctx.strokeStyle = "#145b17";
      [-10, 0, 10].forEach((offset) => {
        ctx.beginPath();
        ctx.roundRect(10, -12 + offset, 35, 8, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#173d17";
        ctx.beginPath();
        ctx.ellipse(45, -8 + offset, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3f9e2c";
      });

      ctx.fillStyle = "#64715b";
      ctx.fillRect(-19, 15, 34, 5);
      ctx.fillStyle = "#222b22";
      [-13, 9].forEach((wheelX) => {
        ctx.beginPath();
        ctx.arc(wheelX, 22, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8da37e";
        ctx.beginPath();
        ctx.arc(wheelX, 22, 3, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else if (id === "calamityturret") {
      const pulse = 1 + Math.sin(state.time * 10) * 0.04;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "rgba(180,20,40,0.35)";
      ctx.beginPath();
      ctx.arc(0, -4, 36 + Math.sin(state.time * 7) * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4a1018";
      ctx.strokeStyle = "#1a060a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(-16, 22, 20, 8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(14, 22, 22, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const body = ctx.createRadialGradient(-6, -12, 4, 0, 0, 32);
      body.addColorStop(0, "#ff6a4a");
      body.addColorStop(0.45, "#a01828");
      body.addColorStop(1, "#2a0810");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(-2, -2, 28, 26, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ff2a2a";
      ctx.beginPath();
      ctx.arc(-8, -10, 3.5, 0, Math.PI * 2);
      ctx.arc(2, -9, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#5a1820";
      ctx.strokeStyle = "#1a0608";
      [-12, -2, 8].forEach((offset) => {
        ctx.beginPath();
        ctx.roundRect(12, -14 + offset, 38, 9, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ff3a3a";
        ctx.beginPath();
        ctx.ellipse(50, -9 + offset, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5a1820";
      });

      ctx.fillStyle = "#2a1018";
      ctx.fillRect(-20, 14, 36, 6);
      ctx.fillStyle = "#8a2030";
      [-14, 8].forEach((wheelX) => {
        ctx.beginPath();
        ctx.arc(wheelX, 22, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      const ratio = Math.max(0, plant.hp / plant.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(-28, -48, 56, 6);
      ctx.fillStyle = ratio > 0.25 ? "#e85a7a" : "#7bc44a";
      ctx.fillRect(-28, -48, 56 * ratio, 6);
    } else if (id === "threepeater") {
      // Общее основание и три стебля
      ctx.fillStyle = "#32951f";
      ctx.strokeStyle = "#176b17";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-12, 23, 16, 7, -0.25, 0, Math.PI * 2);
      ctx.ellipse(12, 23, 16, 7, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#3d9e2d";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.bezierCurveTo(-8, 8, -13, -8, -9, -24);
      ctx.moveTo(1, 20);
      ctx.bezierCurveTo(8, 11, 11, 3, 8, -8);
      ctx.moveTo(-1, 21);
      ctx.bezierCurveTo(-8, 18, -10, 12, -7, 5);
      ctx.stroke();

      const drawThreepeaterHead = (hx, hy, scale = 1) => {
        const headGradient = ctx.createRadialGradient(
          hx - 5 * scale,
          hy - 6 * scale,
          2,
          hx,
          hy,
          17 * scale
        );
        headGradient.addColorStop(0, "#d9ff61");
        headGradient.addColorStop(0.58, "#91df35");
        headGradient.addColorStop(1, "#42aa27");
        ctx.fillStyle = headGradient;
        ctx.strokeStyle = "#267d1d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hx, hy, 15 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#17210e";
        ctx.beginPath();
        ctx.ellipse(
          hx - 4 * scale,
          hy - 4 * scale,
          2.6 * scale,
          4 * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.ellipse(
          hx + 3 * scale,
          hy - 3 * scale,
          2.2 * scale,
          3.5 * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#69c92e";
        ctx.beginPath();
        ctx.ellipse(
          hx + 14 * scale,
          hy + 1 * scale,
          11 * scale,
          9 * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#163d14";
        ctx.beginPath();
        ctx.ellipse(
          hx + 18 * scale,
          hy + 1 * scale,
          5.5 * scale,
          5 * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      };

      drawThreepeaterHead(-8, -25, 0.9);
      drawThreepeaterHead(8, -9, 0.86);
      drawThreepeaterHead(-7, 5, 0.82);
    } else if (id === "ultimatesakurashooter") {
      // Механические ноги
      ctx.strokeStyle = "#7a5a18";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      [
        [-18, 8, -28, 26],
        [-6, 10, -10, 28],
        [8, 10, 12, 28],
        [18, 8, 28, 26],
      ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.fillStyle = "#c9a227";
      [
        [-28, 26],
        [-10, 28],
        [12, 28],
        [28, 26],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Бронекорпус вишни
      const body = ctx.createRadialGradient(-8, -10, 4, 0, 0, 30);
      body.addColorStop(0, "#ff7a8a");
      body.addColorStop(0.4, "#d4223a");
      body.addColorStop(1, "#6a1018");
      ctx.fillStyle = body;
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -2, 26, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Золотые пластины
      ctx.strokeStyle = "#f0d060";
      ctx.lineWidth = 2;
      [-12, 0, 12].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, -20);
        ctx.quadraticCurveTo(x * 1.3, 0, x, 18);
        ctx.stroke();
      });

      // Голова-сакура
      ctx.fillStyle = "#ffb7c5";
      ctx.beginPath();
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.ellipse(
          Math.cos(angle) * 10,
          -28 + Math.sin(angle) * 8,
          8,
          5,
          angle,
          0,
          Math.PI * 2
        );
      }
      ctx.fill();
      ctx.fillStyle = "#ffe45c";
      ctx.beginPath();
      ctx.arc(0, -28, 5, 0, Math.PI * 2);
      ctx.fill();

      // Оптика
      ctx.fillStyle = "#1a0508";
      ctx.beginPath();
      ctx.ellipse(-8, -6, 5, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -6, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6ad5";
      ctx.beginPath();
      ctx.arc(-7, -5, 2, 0, Math.PI * 2);
      ctx.arc(9, -5, 2, 0, Math.PI * 2);
      ctx.fill();

      // Дуло
      ctx.fillStyle = "#3a1018";
      ctx.fillRect(18, -6, 18, 10);
      ctx.fillStyle = "#ff3a4a";
      ctx.beginPath();
      ctx.ellipse(36, -1, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "snowpea") {
      // Холодное сияние
      const frostAura = ctx.createRadialGradient(0, -8, 6, 0, -8, 38);
      frostAura.addColorStop(0, "rgba(200,245,255,0.3)");
      frostAura.addColorStop(1, "rgba(100,190,240,0)");
      ctx.fillStyle = frostAura;
      ctx.beginPath();
      ctx.arc(0, -8, 38, 0, Math.PI * 2);
      ctx.fill();

      // Замёрзшие листья-«ботинки»
      ctx.fillStyle = "#70c9e8";
      ctx.strokeStyle = "#347fa8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-12, 22, 16, 7, -0.25, 0, Math.PI * 2);
      ctx.ellipse(12, 22, 16, 7, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d8f7ff";
      ctx.beginPath();
      ctx.moveTo(-23, 20);
      ctx.lineTo(-30, 27);
      ctx.lineTo(-18, 25);
      ctx.moveTo(23, 20);
      ctx.lineTo(30, 27);
      ctx.lineTo(18, 25);
      ctx.fill();

      // Тонкий ледяной стебель
      ctx.strokeStyle = "#3a91bd";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.bezierCurveTo(-4, 9, 5, 1, 0, -7);
      ctx.stroke();
      ctx.strokeStyle = "#bcefff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 16);
      ctx.bezierCurveTo(-4, 8, 2, 1, -2, -7);
      ctx.stroke();

      // Круглая замёрзшая голова
      const iceHead = ctx.createRadialGradient(-8, -23, 3, 0, -14, 24);
      iceHead.addColorStop(0, "#efffff");
      iceHead.addColorStop(0.48, "#9ee8ff");
      iceHead.addColorStop(1, "#3f9dce");
      ctx.fillStyle = iceHead;
      ctx.strokeStyle = "#2c75a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-1, -14, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ледяные кристаллы на макушке
      ctx.fillStyle = "#dffaff";
      ctx.strokeStyle = "#5bb8df";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, -29);
      ctx.lineTo(-12, -43);
      ctx.lineTo(-5, -31);
      ctx.lineTo(0, -46);
      ctx.lineTo(5, -31);
      ctx.lineTo(13, -41);
      ctx.lineTo(13, -27);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Глаз
      ctx.fillStyle = "#17344a";
      ctx.beginPath();
      ctx.ellipse(-7, -21, 3.5, 5.5, 0, 0, Math.PI * 2);
      ctx.ellipse(2, -19, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-8, -23, 1.2, 0, Math.PI * 2);
      ctx.arc(1, -21, 1, 0, Math.PI * 2);
      ctx.fill();

      // Морозный ствол
      ctx.fillStyle = "#72d2f1";
      ctx.strokeStyle = "#2c75a0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(18, -12, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#174f73";
      ctx.beginPath();
      ctx.ellipse(23, -12, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Сосульки под стволом
      ctx.fillStyle = "#dffaff";
      ctx.beginPath();
      ctx.moveTo(12, -2);
      ctx.lineTo(16, 8);
      ctx.lineTo(19, -2);
      ctx.moveTo(21, -3);
      ctx.lineTo(24, 5);
      ctx.lineTo(27, -4);
      ctx.fill();

      // Снежинки вокруг головы
      ctx.fillStyle = "rgba(240,255,255,0.9)";
      [
        [-25, -19, 2.5],
        [-20, 2, 2],
        [9, -35, 2.2],
        [30, -26, 1.8],
      ].forEach(([sx, sy, radius]) => {
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (id === "shadowpea") {
      const submerged = plant.submergeTimer > 0;

      // Фиолетовая тень и ноги
      ctx.fillStyle = "rgba(70, 18, 112, 0.72)";
      ctx.beginPath();
      ctx.ellipse(0, 25, submerged ? 27 : 20, submerged ? 7 : 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!submerged) {
        ctx.strokeStyle = "#34205f";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-7, 17);
        ctx.lineTo(-15, 25);
        ctx.moveTo(7, 17);
        ctx.lineTo(15, 25);
        ctx.stroke();

        // Грушевидное зелёное тело
        const shadowBody = ctx.createLinearGradient(0, -38, 0, 20);
        shadowBody.addColorStop(0, "#5e2b92");
        shadowBody.addColorStop(0.2, "#4d9b43");
        shadowBody.addColorStop(1, "#73c83e");
        ctx.fillStyle = shadowBody;
        ctx.strokeStyle = "#2a5e27";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, -37);
        ctx.bezierCurveTo(12, -28, 4, -19, 13, -9);
        ctx.bezierCurveTo(24, 5, 13, 19, 0, 20);
        ctx.bezierCurveTo(-16, 20, -24, 7, -15, -8);
        ctx.bezierCurveTo(-8, -19, -12, -29, -3, -37);
        ctx.fill();
        ctx.stroke();

        // Глаза
        ctx.fillStyle = "#f1f5d8";
        ctx.beginPath();
        ctx.ellipse(-5, -12, 5, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(5, -10, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#17151e";
        ctx.beginPath();
        ctx.arc(-4, -11, 2.5, 0, Math.PI * 2);
        ctx.arc(6, -9, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Фиолетово-зелёный ствол
        ctx.fillStyle = "#76cf44";
        ctx.strokeStyle = "#3a2868";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(16, 1, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#24163e";
        ctx.beginPath();
        ctx.ellipse(21, 1, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Во время затягивания над землёй остаются только глаза
        ctx.fillStyle = "#d9edbe";
        ctx.beginPath();
        ctx.arc(-5, 17, 3, 0, Math.PI * 2);
        ctx.arc(5, 17, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#17151e";
        ctx.beginPath();
        ctx.arc(-5, 18, 1.3, 0, Math.PI * 2);
        ctx.arc(5, 18, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Две точки показывают оставшиеся затягивания
      ctx.fillStyle = "#d6a8ff";
      for (let pull = 0; pull < plant.pullsLeft; pull++) {
        ctx.beginPath();
        ctx.arc(-5 + pull * 10, 35, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "dragonbruit" || id === "babybruit") {
      const baby = id === "babybruit";
      const powered = isShadowPowered(plant);
      const scale = baby ? 0.72 : 1;
      ctx.scale(scale, scale);

      // Зелёные листья у основания
      ctx.fillStyle = "#3f9f2d";
      ctx.beginPath();
      ctx.moveTo(-22, 22);
      ctx.quadraticCurveTo(-8, 4, 0, 18);
      ctx.quadraticCurveTo(8, 4, 22, 22);
      ctx.closePath();
      ctx.fill();

      const bodyColor = powered ? "#7a45c2" : "#d94f9a";
      const darkColor = powered ? "#3c1e6e" : "#7a1f55";
      const heads = baby ? [[0, -8]] : [[-14, -4], [0, -16], [14, -4]];

      heads.forEach(([hx, hy], index) => {
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(hx, hy, baby ? 16 : 13, baby ? 18 : 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Жёлтые шипы
        ctx.fillStyle = "#f0c840";
        ctx.beginPath();
        ctx.moveTo(hx - 7, hy - 12);
        ctx.lineTo(hx - 2, hy - 24);
        ctx.lineTo(hx + 2, hy - 12);
        ctx.moveTo(hx + 3, hy - 10);
        ctx.lineTo(hx + 10, hy - 22);
        ctx.lineTo(hx + 8, hy - 8);
        ctx.fill();

        // Пасть
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(hx + 8, hy + 2, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f5f1c8";
        ctx.beginPath();
        ctx.moveTo(hx + 3, hy - 1);
        ctx.lineTo(hx + 6, hy + 5);
        ctx.lineTo(hx + 9, hy - 1);
        ctx.moveTo(hx + 8, hy + 5);
        ctx.lineTo(hx + 11, hy + 10);
        ctx.lineTo(hx + 14, hy + 4);
        ctx.fill();

        // Глаз
        ctx.fillStyle = "#fff6b8";
        ctx.beginPath();
        ctx.arc(hx - 2, hy - 4, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#17151e";
        ctx.beginPath();
        ctx.arc(hx - 1, hy - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        if (!baby && index === 1) {
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.beginPath();
          ctx.ellipse(hx - 4, hy - 8, 4, 2, -0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (powered) {
        ctx.fillStyle = "rgba(140, 90, 220, 0.35)";
        ctx.beginPath();
        ctx.ellipse(0, 24, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "snappea") {
      const mouthOpen = plant.chewing ? 3 : 11;

      // Корни и вьющийся стебель
      ctx.fillStyle = "#3f9f2d";
      ctx.strokeStyle = "#23741e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-10, 22, 14, 6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(10, 22, 14, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#4bab32";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.bezierCurveTo(-9, 11, 8, 4, -2, -7);
      ctx.stroke();

      // Тёмная пасть
      ctx.fillStyle = "#163516";
      ctx.beginPath();
      ctx.ellipse(7, -12, 20, mouthOpen + 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Верхняя и нижняя зелёные челюсти
      const snapGreen = ctx.createLinearGradient(0, -35, 0, 8);
      snapGreen.addColorStop(0, "#c8ef48");
      snapGreen.addColorStop(1, "#54ad2e");
      ctx.fillStyle = snapGreen;
      ctx.strokeStyle = "#2b7a22";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -16);
      ctx.bezierCurveTo(-5, -35, 19, -34, 31, -20);
      ctx.bezierCurveTo(23, -12, 7, -10 - mouthOpen, -12, -16);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11, -8);
      ctx.bezierCurveTo(4, -8 + mouthOpen, 22, -7 + mouthOpen, 29, -15);
      ctx.bezierCurveTo(19, 5, -2, 9, -11, -8);
      ctx.fill();
      ctx.stroke();

      // Зубы
      if (!plant.chewing) {
        ctx.fillStyle = "#f5f1c8";
        for (let tooth = 0; tooth < 4; tooth++) {
          const tx = -2 + tooth * 8;
          ctx.beginPath();
          ctx.moveTo(tx, -13);
          ctx.lineTo(tx + 3, -5);
          ctx.lineTo(tx + 6, -13);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = "#a75ac0";
        ctx.beginPath();
        ctx.ellipse(8, 1, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Глаз и усики
      ctx.fillStyle = "#ecf7cb";
      ctx.beginPath();
      ctx.arc(-2, -25, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#17210e";
      ctx.beginPath();
      ctx.arc(0, -24, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#53ad31";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-9, -26);
      ctx.quadraticCurveTo(-20, -37, -23, -27);
      ctx.moveTo(-12, 4);
      ctx.quadraticCurveTo(-27, 7, -18, 17);
      ctx.stroke();

      if (plant.chewing) {
        ctx.font = "bold 11px Nunito, sans-serif";
        ctx.fillStyle = "#fff3a8";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.ceil(plant.chewTimer)}с`, 5, 42);
      }
    } else if (
      id === "giantchomper" ||
      id === "chomper" ||
      id === "cherrychomper" ||
      id === "nutchomper" ||
      id === "sunchomper" ||
      id === "chompshooter" ||
      id === "chewzilla" ||
      id === "cherrizilla" ||
      id === "chompermix" ||
      id === "chompermess"
    ) {
      const skin = {
        giantchomper: ["#5a2a8a", "#35155a", "#6d35a8", "#d9a0ff", "#8a45d0", "#4e2088"],
        chomper: ["#6d3a9c", "#3d1c66", "#7f45b4", "#d2a4f0", "#8f4fd0", "#54277f"],
        cherrychomper: ["#8f1a35", "#4d0a1c", "#b62442", "#ff9fb3", "#d8324f", "#7a1230"],
        nutchomper: ["#8a6330", "#4f3616", "#a97b3c", "#f0d09a", "#c79a52", "#6d4a20"],
        sunchomper: ["#d29428", "#7a4a10", "#f0c840", "#ffe9a0", "#e8b030", "#8a6018"],
        chompshooter: ["#3f9e3a", "#1f5c20", "#5cbf45", "#c8ef48", "#54ad2e", "#2b7a22"],
        chewzilla: ["#2a1848", "#100828", "#5a2a8a", "#e0b0ff", "#8a45d0", "#301060"],
        cherrizilla: ["#5a1020", "#2a0810", "#a02038", "#ff90b0", "#d03050", "#501018"],
        chompermix: ["#7a3050", "#3f1226", "#a53e5e", "#ffc48a", "#c95a6a", "#5f2038"],
        chompermess: ["#3f2a6d", "#180d33", "#5b3a99", "#a0ffe0", "#7a4fd0", "#301a55"],
      }[id];
      const scale =
        id === "chomper"
          ? 0.78
          : id === "cherrizilla" || id === "chewzilla"
            ? 1.15
            : id === "chompermess"
              ? 1.12
              : 1;
      ctx.scale(scale, scale);
      const mouthOpen = plant.chewing ? 4 : 16;

      ctx.fillStyle = skin[0];
      ctx.strokeStyle = skin[1];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(-18, 24, 22, 9, -0.28, 0, Math.PI * 2);
      ctx.ellipse(18, 24, 22, 9, 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = skin[2];
      ctx.beginPath();
      ctx.ellipse(-20, 8, 14, 18, -0.4, 0, Math.PI * 2);
      ctx.ellipse(8, 10, 16, 20, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1a0f28";
      ctx.beginPath();
      ctx.ellipse(8, -8, 30, mouthOpen + 8, 0, 0, Math.PI * 2);
      ctx.fill();

      const jaw = ctx.createLinearGradient(0, -45, 0, 18);
      jaw.addColorStop(0, skin[3]);
      jaw.addColorStop(0.55, skin[4]);
      jaw.addColorStop(1, skin[5]);
      ctx.fillStyle = jaw;
      ctx.strokeStyle = skin[1];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-22, -14);
      ctx.bezierCurveTo(-8, -48, 28, -46, 42, -22);
      ctx.bezierCurveTo(30, -10, 8, -8 - mouthOpen, -22, -14);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-20, -4);
      ctx.bezierCurveTo(6, -2 + mouthOpen, 28, 0 + mouthOpen, 40, -14);
      ctx.bezierCurveTo(24, 16, -4, 20, -20, -4);
      ctx.fill();
      ctx.stroke();

      if (!plant.chewing) {
        ctx.fillStyle = "#fff7d8";
        for (let tooth = 0; tooth < 6; tooth++) {
          const tx = -8 + tooth * 8;
          ctx.beginPath();
          ctx.moveTo(tx, -10);
          ctx.lineTo(tx + 3.5, 2);
          ctx.lineTo(tx + 7, -10);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.fillStyle = "#f4e8ff";
      ctx.beginPath();
      ctx.arc(-6, -30, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1024";
      ctx.beginPath();
      ctx.arc(-4, -29, 4, 0, Math.PI * 2);
      ctx.fill();

      if (id === "cherrychomper" || id === "chompermix" || id === "cherrizilla") {
        ctx.fillStyle = "#e2213f";
        ctx.strokeStyle = "#6d0f22";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-26, -34, 7, 0, Math.PI * 2);
        ctx.arc(-14, -40, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (id === "nutchomper" || id === "chompermix" || id === "chewzilla") {
        ctx.fillStyle = "#d8ab63";
        ctx.strokeStyle = "#7a5320";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(-24, 6, 13, 16, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (id === "sunchomper") {
        ctx.fillStyle = "#ffd84d";
        ctx.strokeStyle = "#c58f16";
        ctx.lineWidth = 2;
        for (let ray = 0; ray < 8; ray++) {
          const a = (ray / 8) * Math.PI * 2 + state.time;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 18, -28 + Math.sin(a) * 18);
          ctx.lineTo(Math.cos(a) * 28, -28 + Math.sin(a) * 28);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, -28, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      if (id === "chompshooter") {
        ctx.fillStyle = "#4caf50";
        ctx.beginPath();
        ctx.ellipse(28, -6, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b3d18";
        ctx.beginPath();
        ctx.arc(38, -6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (id === "chewzilla" || id === "cherrizilla") {
        ctx.strokeStyle = id === "cherrizilla" ? "#ff6a8a" : "#c48bff";
        ctx.lineWidth = 3;
        for (let spike = 0; spike < 5; spike++) {
          const a = -1.2 + spike * 0.55;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 20, -8 + Math.sin(a) * 16);
          ctx.lineTo(Math.cos(a) * 36, -18 + Math.sin(a) * 28);
          ctx.stroke();
        }
      }
      if (id === "chompermess") {
        ctx.strokeStyle = "#8affe0";
        ctx.lineWidth = 2;
        for (let ring = 0; ring < 3; ring++) {
          const r = 34 + ring * 9 + Math.sin(state.time * 4 + ring) * 3;
          ctx.beginPath();
          ctx.arc(4, -6, r, 0.4, Math.PI * 1.5);
          ctx.stroke();
        }
        ctx.fillStyle = "#c2f7e4";
        ctx.beginPath();
        ctx.arc(-20, -34, 6, 0, Math.PI * 2);
        ctx.arc(20, -36, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (plant.chewing) {
        ctx.font = "bold 12px Nunito, sans-serif";
        ctx.fillStyle = "#f0c8ff";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.ceil(plant.chewTimer)}с`, 4, 48);
      }
    } else if (id === "cornfetti") {
      // Широкие листья у основания
      ctx.fillStyle = "#3f8f2b";
      ctx.strokeStyle = "#225f20";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-25, 24);
      ctx.quadraticCurveTo(-16, 6, 0, 18);
      ctx.quadraticCurveTo(12, 3, 27, 21);
      ctx.quadraticCurveTo(7, 17, 0, 28);
      ctx.quadraticCurveTo(-10, 17, -25, 24);
      ctx.fill();
      ctx.stroke();

      // Завиток стебля
      ctx.strokeStyle = "#356f22";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-12, 8);
      ctx.bezierCurveTo(-31, 3, -31, -21, -16, -19);
      ctx.bezierCurveTo(-8, -18, -10, -9, -17, -10);
      ctx.stroke();

      // Корпус в кукурузной шелухе
      const cornBody = ctx.createLinearGradient(-15, -28, 18, 20);
      cornBody.addColorStop(0, "#b8d94a");
      cornBody.addColorStop(0.55, "#6ea82f");
      cornBody.addColorStop(1, "#346e25");
      ctx.fillStyle = cornBody;
      ctx.strokeStyle = "#315f20";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-13, 15);
      ctx.bezierCurveTo(-22, -4, -12, -27, 8, -28);
      ctx.bezierCurveTo(20, -22, 22, 1, 13, 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Верхний лист-козырёк
      ctx.fillStyle = "#91bf36";
      ctx.beginPath();
      ctx.moveTo(-11, -19);
      ctx.quadraticCurveTo(4, -38, 28, -33);
      ctx.quadraticCurveTo(16, -18, -7, -13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Глаз
      ctx.fillStyle = "#eef3c3";
      ctx.beginPath();
      ctx.ellipse(1, -12, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#17210e";
      ctx.beginPath();
      ctx.ellipse(3, -11, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(2, -14, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Разноцветный кукурузный ствол
      ctx.fillStyle = "#f0c840";
      ctx.strokeStyle = "#6b4a18";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(20, -5, 16, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const kernelColors = ["#f5d84d", "#e85a7a", "#8d5ab5", "#63c45a"];
      for (let kernel = 0; kernel < 12; kernel++) {
        const angle = (kernel / 12) * Math.PI * 2;
        ctx.fillStyle = kernelColors[kernel % kernelColors.length];
        ctx.beginPath();
        ctx.arc(
          20 + Math.cos(angle) * 9,
          -5 + Math.sin(angle) * 7,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.fillStyle = "#372719";
      ctx.beginPath();
      ctx.ellipse(27, -5, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "magiccatgirl") {
      // Платье и ноги
      ctx.fillStyle = "#f6f1ff";
      ctx.strokeStyle = "#8f5fa8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, 5);
      ctx.lineTo(-22, 28);
      ctx.lineTo(20, 28);
      ctx.lineTo(11, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ef8fca";
      ctx.fillRect(-17, 14, 33, 6);
      ctx.strokeStyle = "#70487e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-8, 27);
      ctx.lineTo(-12, 34);
      ctx.moveTo(8, 27);
      ctx.lineTo(12, 34);
      ctx.stroke();

      // Волосы
      ctx.fillStyle = "#f3a6d2";
      ctx.strokeStyle = "#9d5b91";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -10, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-19, 2, 9, 25, 0.22, 0, Math.PI * 2);
      ctx.ellipse(18, 3, 8, 24, -0.22, 0, Math.PI * 2);
      ctx.fill();

      // Кошачьи ушки
      ctx.fillStyle = "#f5b5d8";
      ctx.beginPath();
      ctx.moveTo(-18, -25);
      ctx.lineTo(-12, -42);
      ctx.lineTo(-3, -27);
      ctx.closePath();
      ctx.moveTo(6, -27);
      ctx.lineTo(15, -42);
      ctx.lineTo(20, -23);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff0f8";
      ctx.beginPath();
      ctx.moveTo(-13, -29);
      ctx.lineTo(-11, -36);
      ctx.lineTo(-7, -29);
      ctx.closePath();
      ctx.moveTo(10, -29);
      ctx.lineTo(14, -36);
      ctx.lineTo(16, -27);
      ctx.closePath();
      ctx.fill();

      // Лицо
      ctx.fillStyle = "#fff4ed";
      ctx.beginPath();
      ctx.ellipse(0, -10, 15, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7d3b80";
      ctx.beginPath();
      ctx.ellipse(-5, -12, 2.6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(5, -12, 2.6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#b34f79";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -5, 4, 0.15, Math.PI - 0.15);
      ctx.stroke();

      // Волшебная палочка
      ctx.strokeStyle = "#7e568d";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(15, 8);
      ctx.lineTo(30, -18);
      ctx.stroke();
      ctx.save();
      ctx.translate(31, -20);
      ctx.rotate(state.time * 2);
      ctx.fillStyle = "#ffe47e";
      ctx.shadowColor = "#fff2a3";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let point = 0; point < 10; point++) {
        const radius = point % 2 === 0 ? 8 : 3.5;
        const angle = -Math.PI / 2 + (point * Math.PI) / 5;
        const sx = Math.cos(angle) * radius;
        const sy = Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (id === "triplecatgirl") {
      // Три стебля
      ctx.strokeStyle = "#3d9e2d";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-14, 22);
      ctx.quadraticCurveTo(-22, 4, -18, -18);
      ctx.moveTo(0, 24);
      ctx.quadraticCurveTo(2, 4, 0, -28);
      ctx.moveTo(14, 22);
      ctx.quadraticCurveTo(22, 4, 18, -16);
      ctx.stroke();

      const drawCatHead = (hx, hy, scale = 1, hair = "#3a4a9a") => {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(scale, scale);
        ctx.fillStyle = hair;
        ctx.strokeStyle = "#1c2448";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14, -8);
        ctx.lineTo(-10, -24);
        ctx.lineTo(-2, -10);
        ctx.closePath();
        ctx.moveTo(2, -10);
        ctx.lineTo(10, -24);
        ctx.lineTo(14, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff0f8";
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(-9, -18);
        ctx.lineTo(-5, -12);
        ctx.closePath();
        ctx.moveTo(5, -12);
        ctx.lineTo(9, -18);
        ctx.lineTo(10, -12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff4ed";
        ctx.beginPath();
        ctx.ellipse(0, 1, 11, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2a1840";
        ctx.beginPath();
        ctx.ellipse(-4, 0, 2, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(4, 0, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff7a2a";
        ctx.beginPath();
        ctx.ellipse(12, 4, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawCatHead(-18, -16, 0.82, "#4455a8");
      drawCatHead(0, -26, 1, "#3a4a9a");
      drawCatHead(18, -14, 0.82, "#5566b8");
    } else if (
      id === "barley" ||
      id === "gatlingpea" ||
      id === "sniper" ||
      id === "hurricanepea" ||
      id === "firesniper"
    ) {
      const isFire = id === "firesniper";
      const isSniper = id === "sniper" || isFire;
      const isHurricane = id === "hurricanepea";
      const bodyColor =
        id === "barley"
          ? "#b79542"
          : isFire
            ? "#b93a24"
            : isHurricane
              ? "#176f47"
              : "#2c6d32";

      ctx.fillStyle = "#2d7d2c";
      ctx.beginPath();
      ctx.ellipse(-12, 20, 16, 7, -0.35, 0, Math.PI * 2);
      ctx.ellipse(12, 20, 16, 7, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(0, -4);
      ctx.stroke();

      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = "#173f20";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, -13, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Глаза и маска
      ctx.fillStyle = isFire ? "#ffe26b" : "#dfffd6";
      ctx.beginPath();
      ctx.ellipse(-8, -17, 4, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(2, -16, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#172018";
      ctx.beginPath();
      ctx.arc(-7, -16, 2, 0, Math.PI * 2);
      ctx.arc(3, -15, 2, 0, Math.PI * 2);
      ctx.fill();

      // Винтовка или скоростной ствол
      ctx.fillStyle = isFire ? "#6d241b" : "#31483c";
      ctx.fillRect(8, -13, isSniper ? 35 : 28, 8);
      ctx.fillStyle = isFire ? "#ff7a32" : "#9fb4a5";
      ctx.fillRect(isSniper ? 38 : 31, -11, isSniper ? 14 : 9, 4);
      if (isSniper) {
        ctx.fillStyle = "#18251e";
        ctx.fillRect(11, -22, 18, 6);
        ctx.strokeStyle = isFire ? "#ffb347" : "#8ee5a0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(25, -19, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (isHurricane) {
        ctx.strokeStyle = "#8dffc1";
        ctx.lineWidth = 2;
        for (let ring = 0; ring < 3; ring++) {
          ctx.beginPath();
          ctx.arc(2, -13, 24 + ring * 4, state.time + ring, state.time + 1.8 + ring);
          ctx.stroke();
        }
      }
      if (id === "barley") {
        ctx.strokeStyle = "#f0cf68";
        ctx.lineWidth = 3;
        for (let awn = -2; awn <= 2; awn++) {
          ctx.beginPath();
          ctx.moveTo(-5 + awn * 4, -28);
          ctx.lineTo(-10 + awn * 6, -39);
          ctx.stroke();
        }
      }
    } else if (
      id === "cherrypea" ||
      id === "cherrybomber" ||
      id === "gatlingcherry" ||
      id === "blastlauncher"
    ) {
      const multi = id === "gatlingcherry" || id === "blastlauncher";
      const heavy = id === "cherrybomber" || id === "blastlauncher";
      const body = heavy ? "#b01f35" : "#d63a4a";
      const stem = heavy ? "#5a8f2a" : "#3f9e35";

      ctx.fillStyle = stem;
      ctx.beginPath();
      ctx.ellipse(-13, 22, 16, 7, -0.3, 0, Math.PI * 2);
      ctx.ellipse(13, 22, 16, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2f6f20";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(0, -2);
      ctx.stroke();

      ctx.fillStyle = body;
      ctx.strokeStyle = "#6d1020";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-2, -12, multi ? 20 : 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Глаза
      ctx.fillStyle = heavy ? "#ffe45c" : "#fff4d8";
      ctx.beginPath();
      ctx.ellipse(-8, -16, 4, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(3, -15, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = heavy ? "#ff2a2a" : "#1a1010";
      ctx.beginPath();
      ctx.arc(-7, -15, 2, 0, Math.PI * 2);
      ctx.arc(4, -14, 2, 0, Math.PI * 2);
      ctx.fill();

      // Ствол / гатлинг
      if (multi) {
        ctx.fillStyle = "#8a1528";
        ctx.strokeStyle = "#3a0810";
        ctx.lineWidth = 2;
        for (let barrel = 0; barrel < 4; barrel++) {
          const by = -18 + barrel * 5;
          ctx.fillRect(12, by, 28, 4);
          ctx.strokeRect(12, by, 28, 4);
        }
        ctx.fillStyle = "#2a2a30";
        ctx.fillRect(8, -20, 8, 22);
      } else {
        ctx.fillStyle = "#8a1528";
        ctx.fillRect(10, -14, 24, 8);
        ctx.fillStyle = "#ff6a7a";
        ctx.beginPath();
        ctx.arc(36, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        if (id === "cherrybomber") {
          ctx.beginPath();
          ctx.arc(36, -4, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Шлем у Взрывомёта и горохомёта
      if (id === "blastlauncher" || id === "gatlingcherry") {
        ctx.fillStyle = "#1c1c22";
        ctx.strokeStyle = "#8a1528";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-2, -28, 18, 10, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(-16, -28, 28, 8);
        if (id === "blastlauncher") {
          ctx.fillStyle = "#ff2a3a";
          ctx.fillRect(-10, -32, 16, 4);
          ctx.strokeStyle = "#5ee7ff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-14, -20);
          ctx.lineTo(-20, -34);
          ctx.moveTo(10, -20);
          ctx.lineTo(16, -34);
          ctx.stroke();
        }
      }
    } else if (id === "laserbean") {
      // Стебель-хвостик
      ctx.strokeStyle = "#2f7a28";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-2, -26);
      ctx.quadraticCurveTo(4, -36, 10, -34);
      ctx.stroke();
      ctx.fillStyle = "#55b83a";
      ctx.beginPath();
      ctx.ellipse(12, -35, 7, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Тело-боб
      const bean = ctx.createRadialGradient(-8, -10, 4, 2, 2, 28);
      bean.addColorStop(0, "#e8ff8a");
      bean.addColorStop(0.45, "#b6e255");
      bean.addColorStop(1, "#5ea832");
      ctx.fillStyle = bean;
      ctx.strokeStyle = "#2f6b22";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 26, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Бороздка боба
      ctx.strokeStyle = "rgba(47,107,34,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, -18);
      ctx.quadraticCurveTo(8, 0, -4, 18);
      ctx.stroke();

      // Полуприкрытые красные глаза
      ctx.fillStyle = "#ff2a2a";
      ctx.shadowColor = "#ff5555";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(-8, -8, 5, 3.2, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -6, 5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1a0505";
      ctx.beginPath();
      ctx.ellipse(-8, -7.5, 2.2, 1.4, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -5.5, 2.2, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Рот-дуло
      ctx.fillStyle = "#1f3d18";
      ctx.beginPath();
      ctx.ellipse(16, 4, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6fe8ff";
      ctx.beginPath();
      ctx.ellipse(18, 4, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (
      id === "repeater" ||
      id === "cactus" ||
      id === "magnetocactus" ||
      id === "puffshroom" ||
      id === "frostrepeater" ||
      id === "sunshooter"
    ) {
      if ((id === "cactus" || id === "magnetocactus") && plant.cactusTall) {
        ctx.strokeStyle = "#558d2e";
        ctx.lineWidth = 13;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(0, -22);
        ctx.stroke();
        ctx.strokeStyle = "#d8e85a";
        ctx.lineWidth = 2;
        [-1, 1].forEach((side) => {
          ctx.beginPath();
          ctx.moveTo(side * 6, 12);
          ctx.lineTo(side * 15, 5);
          ctx.stroke();
        });
        ctx.translate(0, -30);
      }
      const body =
        id === "frostrepeater"
          ? "#398bb8"
          : id === "sunshooter"
            ? "#d29428"
            : id === "snowpea"
          ? "#6ec6e8"
          : id === "puffshroom"
            ? "#8d5ab5"
            : id === "cactus" || id === "magnetocactus"
              ? id === "magnetocactus"
                ? "#3a7a68"
                : "#739b32"
              : id === "repeater"
                ? "#3f9e3a"
                : "#3d8f3a";
      const head =
        id === "frostrepeater"
          ? "#9ceaff"
          : id === "sunshooter"
            ? "#ffd84d"
            : id === "snowpea"
          ? "#b8ecff"
          : id === "puffshroom"
            ? "#c989e8"
            : id === "cactus" || id === "magnetocactus"
              ? id === "magnetocactus"
                ? "#5ee7ff"
                : "#91b83f"
              : "#4caf50";
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.ellipse(14, -2, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      if (id === "repeater" || id === "frostrepeater") {
        ctx.beginPath();
        ctx.ellipse(10, 10, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (id === "sunshooter") {
        ctx.strokeStyle = "#ffe97a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let ray = 0; ray < 8; ray++) {
          const angle = (ray / 8) * Math.PI * 2;
          ctx.moveTo(14 + Math.cos(angle) * 14, -2 + Math.sin(angle) * 14);
          ctx.lineTo(14 + Math.cos(angle) * 22, -2 + Math.sin(angle) * 22);
        }
        ctx.stroke();
      }
      if (id === "cactus" || id === "magnetocactus") {
        ctx.strokeStyle = id === "magnetocactus" ? "#b8f7ff" : "#e8ef9a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 4);
        ctx.lineTo(-21, -1);
        ctx.moveTo(-9, 14);
        ctx.lineTo(-18, 18);
        ctx.stroke();
        if (id === "magnetocactus") {
          ctx.strokeStyle = "#d24c69";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(-2, -18, 12, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
          ctx.fillStyle = "#d7e4e8";
          ctx.fillRect(-16, -22, 6, 10);
          ctx.fillRect(8, -22, 6, 10);
        }
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
    } else if (
      id === "wallnut" ||
      id === "bigwallnut" ||
      id === "giantwallnut" ||
      id === "fatwallnut" ||
      id === "thornnut" ||
      id === "mechanut" ||
      id === "sunnut" ||
      id === "doublesunnut"
    ) {
      const tier =
        id === "fatwallnut"
          ? 4
          : id === "giantwallnut" || id === "doublesunnut"
          ? 3
          : id === "bigwallnut" || id === "thornnut" || id === "sunnut"
            ? 2
            : 1;
      const nutWidth =
        tier === 4 ? 43 : tier === 3 ? 36 : tier === 2 ? 27 : 20;
      const nutHeight =
        tier === 4 ? 40 : tier === 3 ? 43 : tier === 2 ? 33 : 24;
      ctx.fillStyle =
        id === "sunnut" || id === "doublesunnut"
          ? "#e8c86a"
          : id === "thornnut"
          ? "#758f3b"
          : tier === 4
            ? "#8b6a2f"
          : tier === 3
            ? "#806039"
            : tier === 2
              ? "#a87840"
              : "#b8894a";
      ctx.strokeStyle =
        id === "sunnut" || id === "doublesunnut"
          ? "#8a6018"
          : tier >= 3
            ? "#3b2b19"
            : "#6b451f";
      ctx.lineWidth = tier;
      ctx.beginPath();
      ctx.ellipse(0, 4, nutWidth, nutHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5a3a18";
      ctx.beginPath();
      ctx.arc(-7, -1, 3, 0, Math.PI * 2);
      ctx.arc(7, -1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5a3a18";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 10, 6, 0.1, Math.PI - 0.1);
      ctx.stroke();

      if (tier >= 2) {
        // Трещины показывают усиленную скорлупу гибрида
        ctx.strokeStyle = tier >= 3 ? "#d0a15f" : "#70481f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, -12);
        ctx.lineTo(-9, -6);
        ctx.lineTo(-14, 1);
        ctx.moveTo(16, 4);
        ctx.lineTo(10, 10);
        ctx.lineTo(15, 17);
        ctx.stroke();
      }
      if (tier === 3) {
        // Корона гигантского ореха
        ctx.fillStyle = "#f5c842";
        ctx.beginPath();
        ctx.moveTo(-19, -34);
        ctx.lineTo(-11, -49);
        ctx.lineTo(0, -36);
        ctx.lineTo(11, -49);
        ctx.lineTo(19, -34);
        ctx.closePath();
        ctx.fill();
      }
      if (tier === 4) {
        // Каменные сегменты огромной скорлупы
        ctx.strokeStyle = "rgba(70, 45, 18, 0.75)";
        ctx.lineWidth = 2;
        [
          [-30, -18, -12, -25, 1, -17],
          [5, -27, 25, -20, 31, -7],
          [-36, 3, -18, -2, -6, 7],
          [10, 4, 28, 0, 36, 12],
          [-26, 22, -8, 14, 5, 25],
          [8, 25, 22, 16, 31, 23],
        ].forEach(([x1, y1, x2, y2, x3, y3]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
        });
        ctx.fillStyle = "#4a3018";
        ctx.beginPath();
        ctx.ellipse(-9, -2, 4, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(10, -1, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (id === "thornnut") {
        ctx.strokeStyle = "#e8ef9a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        [
          [-24, -12, -34, -18],
          [-27, 3, -38, 3],
          [-22, 18, -32, 25],
          [24, -12, 34, -18],
          [27, 3, 38, 3],
          [22, 18, 32, 25],
        ].forEach(([x1, y1, x2, y2]) => {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        });
        ctx.stroke();
      }
      if (id === "mechanut") {
        ctx.fillStyle = "#4a5560";
        ctx.strokeStyle = "#1e252c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-28, 18, 56, 14, 3);
        ctx.fill();
        ctx.stroke();
        [-18, 0, 18].forEach((x) => {
          ctx.fillStyle = "#2a3138";
          ctx.beginPath();
          ctx.ellipse(x, 32, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = "#8a96a0";
        ctx.fillRect(-6, -28, 12, 8);
      }
      if (id === "sunnut" || id === "doublesunnut") {
        const heads = id === "doublesunnut" ? [-12, 12] : [0];
        heads.forEach((hx) => {
          ctx.strokeStyle = "#3d7a28";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hx * 0.3, -nutHeight + 4);
          ctx.lineTo(hx, -nutHeight - 10);
          ctx.stroke();
          ctx.fillStyle = "#ffe45c";
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
              hx + Math.cos(a) * 9,
              -nutHeight - 12 + Math.sin(a) * 9,
              4,
              2.5,
              a,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          ctx.fillStyle = "#d29428";
          ctx.beginPath();
          ctx.arc(hx, -nutHeight - 12, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else if (
      id === "tallnut" ||
      id === "footballtallnut" ||
      id === "squash" ||
      id === "peafountain" ||
      id === "infinut" ||
      id === "peapod" ||
      id === "snapdragon" ||
      id === "coldsnapdragon" ||
      id === "voltsnapdragon" ||
      id === "bonkchoy" ||
      id === "footballgatling" ||
      id === "gatlingdoom" ||
      id === "buckshotcommando"
    ) {
      if (id === "infinut") {
        ctx.fillStyle = "#4a5560";
        ctx.fillRect(-10, 14, 20, 10);
        ctx.fillStyle = "#2a9a4a";
        ctx.beginPath();
        ctx.ellipse(-12, 22, 8, 4, -0.4, 0, Math.PI * 2);
        ctx.ellipse(12, 22, 8, 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        if (!plant.holoBroken) {
          const glow = 0.55 + Math.sin(state.time * 4) * 0.2;
          ctx.fillStyle = `rgba(150, 220, 255, ${glow})`;
          ctx.strokeStyle = `rgba(220, 250, 255, ${glow + 0.2})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, -6, 20, 26, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(-6, -12, 3, 0, Math.PI * 2);
          ctx.arc(6, -12, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.beginPath();
          ctx.arc(0, 2, 7, 0.2, Math.PI - 0.2);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#3a4550";
          ctx.beginPath();
          ctx.arc(0, 8, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#7cf0ff";
          ctx.beginPath();
          ctx.arc(0, 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (id === "peapod") {
        const heads = plant.heads || 1;
        ctx.fillStyle = "#3d7a28";
        ctx.beginPath();
        ctx.ellipse(0, 18, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < heads; i++) {
          const t = heads === 1 ? 0 : (i / (heads - 1)) * 2 - 1;
          const x = t * 16;
          const y = -4 - Math.abs(t) * 6 - i * 2;
          ctx.fillStyle = "#6ecf3a";
          ctx.strokeStyle = "#2f7a28";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(x, y, 11, 9, t * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#dfffd0";
          ctx.beginPath();
          ctx.arc(x + 7, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1a3010";
          ctx.beginPath();
          ctx.arc(x - 2, y - 2, 1.5, 0, Math.PI * 2);
          ctx.arc(x + 3, y - 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (
        id === "snapdragon" ||
        id === "coldsnapdragon" ||
        id === "voltsnapdragon"
      ) {
        const cold = id === "coldsnapdragon";
        const volt = id === "voltsnapdragon";
        ctx.fillStyle = cold ? "#7ec8d8" : volt ? "#5a9a88" : "#c45a28";
        ctx.beginPath();
        ctx.ellipse(-10, 20, 12, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(10, 20, 12, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cold ? "#5aa0b0" : "#2f7a28";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.quadraticCurveTo(-4, 0, 2, -10);
        ctx.stroke();
        ctx.fillStyle = cold ? "#b8f0ff" : volt ? "#8af0ff" : "#5aaa3a";
        ctx.strokeStyle = cold ? "#4a90a8" : volt ? "#2a88a0" : "#2f6a20";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(4, -14, 18, 14, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cold ? "#fff" : volt ? "#fff" : "#ffe45c";
        ctx.beginPath();
        ctx.ellipse(-2, -18, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(8, -18, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1010";
        ctx.beginPath();
        ctx.arc(-1, -17, 1.5, 0, Math.PI * 2);
        ctx.arc(9, -17, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = cold ? "#e8ffff" : "#fff8d0";
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(0, -2);
        ctx.lineTo(4, -8);
        ctx.lineTo(10, -2);
        ctx.lineTo(14, -10);
        ctx.closePath();
        ctx.fill();
        if (volt) {
          ctx.strokeStyle = "#ffe45c";
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const a = state.time * 8 + i * 2;
            ctx.beginPath();
            ctx.moveTo(18, -14);
            ctx.lineTo(24 + Math.sin(a) * 4, -20 - i * 3);
            ctx.lineTo(30, -12 - i * 2);
            ctx.stroke();
          }
        }
        if (cold) {
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.moveTo(-4, -28);
          ctx.lineTo(0, -36);
          ctx.lineTo(4, -28);
          ctx.closePath();
          ctx.fill();
        }
      } else if (id === "bonkchoy") {
        ctx.fillStyle = "#6aaa3a";
        ctx.beginPath();
        ctx.ellipse(0, 8, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8fd94f";
        ctx.beginPath();
        ctx.ellipse(0, -8, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a3010";
        ctx.beginPath();
        ctx.arc(-5, -10, 2.5, 0, Math.PI * 2);
        ctx.arc(5, -10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1a3010";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        const punch = Math.sin(state.time * 12) * 3;
        [-1, 1].forEach((side) => {
          ctx.fillStyle = "#5a9a28";
          ctx.beginPath();
          ctx.ellipse(side * (18 + punch * side), -2, 9, 11, side * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#2f6010";
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      } else if (id === "peafountain") {
        // Листья у основания
        ctx.fillStyle = "#2f6b1e";
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            Math.cos(a) * 18,
            18 + Math.sin(a) * 6,
            16,
            7,
            a,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        // Голубая чаша фонтана
        ctx.fillStyle = "#7ec8ef";
        ctx.strokeStyle = "#3a8ab8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 10, 26, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(180, 235, 255, 0.85)";
        ctx.beginPath();
        ctx.ellipse(0, 8, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const drawPeaHead = (x, y, scale, angle) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.scale(scale, scale);
          ctx.fillStyle = "#7ed957";
          ctx.strokeStyle = "#3a8a28";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 11, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#5aaa30";
          ctx.beginPath();
          ctx.ellipse(8, 0, 6, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#dfffd0";
          ctx.beginPath();
          ctx.arc(9, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1a3010";
          ctx.beginPath();
          ctx.arc(-2, -3, 1.6, 0, Math.PI * 2);
          ctx.arc(2, -3, 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };

        // Нижний ярус — круг головами наружу
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          drawPeaHead(Math.cos(a) * 16, 2 + Math.sin(a) * 5, 0.85, a);
        }
        // Средний ярус
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          drawPeaHead(Math.cos(a) * 9, -12 + Math.sin(a) * 3, 0.9, a);
        }
        // Верхняя голова
        drawPeaHead(0, -28, 1.05, -Math.PI / 2);

        // Струи фонтана
        const pulse = (Math.sin(state.time * 4) + 1) * 0.5;
        ctx.strokeStyle = `rgba(140, 220, 255, ${0.55 + pulse * 0.35})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + state.time;
          ctx.beginPath();
          ctx.moveTo(0, -34);
          ctx.quadraticCurveTo(
            Math.cos(a) * 18,
            -40 - pulse * 8,
            Math.cos(a) * 14,
            -8
          );
          ctx.stroke();
        }
      } else if (
        id === "tallnut" ||
        id === "footballtallnut" ||
        id === "flametallnut"
      ) {
        const football = id === "footballtallnut";
        const flame = id === "flametallnut";
        // Высокий орех: вытянутая скорлупа
        const body = ctx.createLinearGradient(0, -48, 0, 28);
        body.addColorStop(0, flame ? "#ff8a3d" : football ? "#e07838" : "#d4a05a");
        body.addColorStop(0.45, flame ? "#e23d2a" : football ? "#c45a28" : "#b8894a");
        body.addColorStop(1, flame ? "#8a1a10" : football ? "#8a3a18" : "#8a6230");
        ctx.fillStyle = body;
        ctx.strokeStyle = flame ? "#4a0c08" : football ? "#4a1c0c" : "#5a3a18";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-22, 22);
        ctx.quadraticCurveTo(-28, 8, -24, -20);
        ctx.quadraticCurveTo(-18, -48, 0, -50);
        ctx.quadraticCurveTo(18, -48, 24, -20);
        ctx.quadraticCurveTo(28, 8, 22, 22);
        ctx.quadraticCurveTo(0, 30, -22, 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Трещины скорлупы
        ctx.strokeStyle = flame ? "#ffcc66" : football ? "#7a3010" : "#7a5020";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, -28);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-16, 6);
        ctx.moveTo(12, -22);
        ctx.lineTo(16, -4);
        ctx.lineTo(11, 12);
        ctx.stroke();

        // Лицо
        ctx.fillStyle = flame ? "#fff0c8" : "#3a2410";
        ctx.beginPath();
        ctx.ellipse(-8, -14, 3.5, 5, -0.15, 0, Math.PI * 2);
        ctx.ellipse(8, -14, 3.5, 5, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flame ? "#3a1008" : "#fff8e8";
        ctx.beginPath();
        ctx.arc(-7, -15, 1.4, 0, Math.PI * 2);
        ctx.arc(9, -15, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = flame ? "#fff0c8" : "#3a2410";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -2, 8, 0.15, Math.PI - 0.15);
        ctx.stroke();
        // Брови
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-13, -24);
        ctx.lineTo(-4, -22);
        ctx.moveTo(13, -24);
        ctx.lineTo(4, -22);
        ctx.stroke();

        if (flame) {
          ctx.fillStyle = "#ffcc44";
          ctx.beginPath();
          ctx.moveTo(-6, -52);
          ctx.quadraticCurveTo(0, -68, 6, -52);
          ctx.quadraticCurveTo(0, -58, -6, -52);
          ctx.fill();
          ctx.fillStyle = "#ff6a2a";
          ctx.beginPath();
          ctx.moveTo(-4, -50);
          ctx.quadraticCurveTo(0, -60, 4, -50);
          ctx.fill();
        }

        if (football) {
          ctx.fillStyle = "#1a1a1a";
          ctx.beginPath();
          ctx.ellipse(0, -46, 22, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#c45a28";
          ctx.fillRect(-18, -42, 36, 8);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-8, -38);
          ctx.lineTo(8, -38);
          ctx.stroke();
          ctx.fillStyle = "#222";
          ctx.fillRect(-14, 4, 28, 8);
        }
      } else if (id === "squash") {
        // Кабачок: грушевидный, сердитый
        ctx.fillStyle = "#6a9a28";
        ctx.beginPath();
        ctx.ellipse(-14, 22, 14, 7, -0.35, 0, Math.PI * 2);
        ctx.ellipse(14, 22, 14, 7, 0.35, 0, Math.PI * 2);
        ctx.fill();

        const squashGrad = ctx.createLinearGradient(0, -28, 0, 24);
        squashGrad.addColorStop(0, "#c8e868");
        squashGrad.addColorStop(0.4, "#9ccc3a");
        squashGrad.addColorStop(1, "#5a8a22");
        ctx.fillStyle = squashGrad;
        ctx.strokeStyle = "#3a6010";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.bezierCurveTo(22, -28, 28, -6, 24, 10);
        ctx.bezierCurveTo(22, 26, 10, 30, 0, 28);
        ctx.bezierCurveTo(-10, 30, -22, 26, -24, 10);
        ctx.bezierCurveTo(-28, -6, -22, -28, 0, -30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Лист сверху
        ctx.fillStyle = "#4a7a18";
        ctx.beginPath();
        ctx.ellipse(-8, -32, 10, 5, -0.5, 0, Math.PI * 2);
        ctx.ellipse(8, -32, 10, 5, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3a6010";
        ctx.beginPath();
        ctx.ellipse(0, -28, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Сердитые брови
        ctx.strokeStyle = "#2a4010";
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-14, -12);
        ctx.lineTo(-4, -6);
        ctx.moveTo(14, -12);
        ctx.lineTo(4, -6);
        ctx.stroke();
        // Глаза
        ctx.fillStyle = "#1a2808";
        ctx.beginPath();
        ctx.ellipse(-7, -2, 4, 5.5, 0, 0, Math.PI * 2);
        ctx.ellipse(7, -2, 4, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-6, -3, 1.5, 0, Math.PI * 2);
        ctx.arc(8, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Нахмуренный рот
        ctx.strokeStyle = "#1a2808";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-8, 12);
        ctx.quadraticCurveTo(0, 6, 8, 12);
        ctx.stroke();
      } else {
        const isDoom = id === "gatlingdoom";
        const isCommando = id === "buckshotcommando";
        if (isCommando) {
          ctx.fillStyle = "#c45a28";
          ctx.strokeStyle = "#5a2410";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, -4, 28, 42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#1a1a1a";
          ctx.beginPath();
          ctx.ellipse(0, -40, 24, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#222";
          ctx.fillRect(-16, -8, 32, 10);
          ctx.fillStyle = "#5a3a18";
          ctx.beginPath();
          ctx.arc(-8, -14, 3, 0, Math.PI * 2);
          ctx.arc(8, -14, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = isDoom ? "#2a2030" : "#3a4a38";
          ctx.strokeStyle = isDoom ? "#100818" : "#1a2818";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-22, 8, 44, 20, 4);
          ctx.fill();
          ctx.stroke();
          [-14, 14].forEach((x) => {
            ctx.fillStyle = "#1a1a1a";
            ctx.beginPath();
            ctx.ellipse(x, 28, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.fillStyle = isDoom ? "#4a2870" : "#c45a28";
          ctx.beginPath();
          ctx.arc(0, -8, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isDoom ? "#1a0830" : "#5a2410";
          ctx.lineWidth = 2;
          ctx.stroke();
          if (!isDoom) {
            ctx.fillStyle = "#1a1a1a";
            ctx.beginPath();
            ctx.ellipse(0, -22, 16, 9, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.fillStyle = isDoom ? "#1a1020" : "#2a3038";
        ctx.fillRect(10, isCommando ? -18 : -14, isCommando ? 36 : 30, 12);
        ctx.fillStyle = isDoom ? "#6a30a0" : "#8a9aaa";
        for (let i = 0; i < (isCommando ? 4 : 3); i++) {
          ctx.fillRect(14 + i * 7, isCommando ? -16 : -12, 5, 8);
        }
        ctx.fillStyle = "#c0c8d0";
        ctx.fillRect(isCommando ? 44 : 38, isCommando ? -15 : -11, 10, 6);
      }
    } else if (
      id === "pumpkin" ||
      id === "jokerpumpkin" ||
      id === "cherrypumpkin" ||
      id === "lurepumpkin" ||
      id === "neodymiumpumpkin" ||
      id === "armorpumpkin"
    ) {
      const armored = id === "armorpumpkin";
      const cherry = id === "cherrypumpkin";
      const lure = id === "lurepumpkin";
      const neo = id === "neodymiumpumpkin";
      ctx.fillStyle = neo
        ? "#7a2430"
        : lure
          ? "#6ea8c8"
          : armored
            ? "#7692a0"
            : cherry
              ? "#ba2837"
              : "#c84b34";
      ctx.strokeStyle = neo
        ? "#2d1016"
        : lure
          ? "#2f5f78"
          : armored
            ? "#334b58"
            : "#6b2026";
      ctx.lineWidth = armored || neo ? 4 : 2.5;
      ctx.beginPath();
      ctx.ellipse(
        0,
        3,
        armored || neo ? 34 : 29,
        armored || neo ? 29 : 25,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = neo
        ? "#3a8fa8"
        : lure
          ? "#b8e8ff"
          : armored
            ? "#b9d1d9"
            : "#e67848";
      ctx.lineWidth = 3;
      [-16, 0, 16].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, -20);
        ctx.quadraticCurveTo(x * 1.2, 4, x, 24);
        ctx.stroke();
      });
      if (neo || lure) {
        const glow = neo ? "#5ef0ff" : "#d7f4ff";
        ctx.fillStyle = glow;
        ctx.shadowColor = glow;
        ctx.shadowBlur = neo ? 12 : 6;
        ctx.beginPath();
        ctx.moveTo(-14, -4);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-13, 4);
        ctx.closePath();
        ctx.moveTo(14, -4);
        ctx.lineTo(4, 0);
        ctx.lineTo(13, 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-12, 8);
        ctx.lineTo(-4, 16);
        ctx.lineTo(0, 10);
        ctx.lineTo(4, 16);
        ctx.lineTo(12, 8);
        ctx.lineTo(6, 8);
        ctx.lineTo(0, 14);
        ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        if (neo) {
          ctx.fillStyle = "#2a3038";
          ctx.fillRect(-22, -28, 44, 8);
          ctx.fillRect(-28, -8, 10, 16);
          ctx.fillRect(18, -8, 10, 16);
          ctx.strokeStyle = "#8aa0b0";
          ctx.lineWidth = 2;
          ctx.strokeRect(-22, -28, 44, 8);
        }
      } else {
        ctx.fillStyle = "#1c1717";
        ctx.beginPath();
        ctx.moveTo(-18, -6);
        ctx.lineTo(-6, -1);
        ctx.lineTo(-17, 3);
        ctx.closePath();
        ctx.moveTo(18, -6);
        ctx.lineTo(6, -1);
        ctx.lineTo(17, 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 12, 10, 0, Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = "#3d8f2a";
      ctx.fillRect(-4, -31, 8, 11);
      if (cherry) {
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🍒", 16, -19);
      } else if (id === "jokerpumpkin") {
        ctx.fillStyle = "#303841";
        ctx.fillRect(-16, -31, 32, 6);
        ctx.fillStyle = "#be2633";
        ctx.fillRect(-8, -39, 16, 9);
      } else if (armored) {
        ctx.fillStyle = "#d5e1e6";
        ctx.fillRect(-27, -15, 54, 5);
        ctx.fillRect(-27, 18, 54, 5);
      }
    } else if (id === "magnetshroom") {
      ctx.fillStyle = "#88589d";
      ctx.strokeStyle = "#462a5a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 17, 14, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#d24c69";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, -8, 19, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = "#d7e4e8";
      ctx.fillRect(-24, -11, 10, 15);
      ctx.fillRect(14, -11, 10, 15);
      ctx.fillStyle = "#201527";
      ctx.beginPath();
      ctx.arc(-5, 15, 2, 0, Math.PI * 2);
      ctx.arc(5, 15, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "melonpult" || id === "kernelpult") {
      const melon = id === "melonpult";
      ctx.fillStyle = "#3f8f2b";
      ctx.strokeStyle = "#235c20";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-10, 22, 18, 7, -0.3, 0, Math.PI * 2);
      ctx.ellipse(12, 22, 18, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#75b442";
      ctx.beginPath();
      ctx.ellipse(-5, 4, 23, 18, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#5d7b32";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(4, 1);
      ctx.lineTo(23, -20);
      ctx.stroke();
      ctx.font = melon ? "28px sans-serif" : "30px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(melon ? "🍉" : "🌽", 22, -17);
      ctx.fillStyle = "#1d3218";
      ctx.beginPath();
      ctx.arc(-10, 1, 2.5, 0, Math.PI * 2);
      ctx.arc(-2, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "meloncannon" || id === "icecannon") {
      const ice = id === "icecannon";
      ctx.fillStyle = ice ? "#3a6a78" : "#315f28";
      ctx.strokeStyle = ice ? "#1a3040" : "#173d17";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(-12, 22, 30, 10, -0.2, 0, Math.PI * 2);
      ctx.ellipse(18, 22, 30, 10, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const cannon = ctx.createLinearGradient(-30, -20, 40, 15);
      cannon.addColorStop(0, ice ? "#8de4ff" : "#76bd3b");
      cannon.addColorStop(1, ice ? "#2a6088" : "#2f762c");
      ctx.fillStyle = cannon;
      ctx.beginPath();
      ctx.roundRect(-30, -18, 64, 34, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ice ? "#0a2030" : "#153c19";
      ctx.beginPath();
      ctx.ellipse(35, -1, 13, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = ice ? "#c8f4ff" : "#b3d76b";
      ctx.lineWidth = 3;
      [-16, -4, 8, 20].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, -15);
        ctx.lineTo(x + 8, 13);
        ctx.stroke();
      });
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ice ? "🧊" : "🍉", -13, -21);
    } else if (id === "nullifier") {
      const pulse = 0.5 + Math.sin(state.time * 5) * 0.2;
      ctx.fillStyle = "#0a1020";
      ctx.beginPath();
      ctx.ellipse(0, 16, 26, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      [-14, 0, 14].forEach((x, i) => {
        ctx.fillStyle = `rgba(60, 200, 255, ${0.35 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(x, 8, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#5ee7ff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ctx.fillStyle = "#1a2848";
      ctx.strokeStyle = "#5ee7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, 4);
      ctx.lineTo(-10, -28);
      ctx.lineTo(0, -18);
      ctx.lineTo(10, -32);
      ctx.lineTo(18, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(94, 231, 255, ${pulse})`;
      ctx.beginPath();
      ctx.arc(0, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9af0ff";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = state.time + i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8, -8 + Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a) * 22, -8 + Math.sin(a) * 22);
        ctx.stroke();
      }
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
    } else if (id === "peamine") {
      ctx.fillStyle = plant.armed ? "#d4a017" : "#8a6a30";
      ctx.beginPath();
      ctx.ellipse(0, 14, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d8f3a";
      ctx.beginPath();
      ctx.ellipse(8, -6, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.ellipse(18, -8, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!plant.armed) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "10px Nunito";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(plant.armTimer) + "с", 0, 18);
      }
    } else if (id === "sunpuff") {
      const grown =
        (plant.matureTimer || 0) >= (type.matureAfter || 50);
      const scale = grown ? 1.15 : 0.85;
      ctx.scale(scale, scale);
      ctx.fillStyle = "#8d5ab5";
      ctx.beginPath();
      ctx.ellipse(0, -8, grown ? 22 : 16, grown ? 14 : 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd84d";
      ctx.beginPath();
      ctx.arc(0, 6, grown ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d8f2a";
      ctx.fillRect(-3, 14, 6, 12);
    } else if (id === "obsidiandragon") {
      for (let h = 0; h < 6; h++) {
        const hy = 18 - h * 10;
        ctx.fillStyle = h % 2 ? "#3a1a58" : "#241038";
        ctx.beginPath();
        ctx.moveTo(-10, hy + 8);
        ctx.lineTo(0, hy - 10);
        ctx.lineTo(14, hy);
        ctx.lineTo(8, hy + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffe45c";
        ctx.beginPath();
        ctx.arc(4, hy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#6b2db3";
      ctx.fillRect(-6, 22, 14, 8);
    } else if (id === "voidhole") {
      const spin = state.time * 3;
      ctx.fillStyle = "#0a0612";
      ctx.beginPath();
      ctx.arc(0, 4, 22, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = spin + i * 1.2;
        ctx.strokeStyle = `rgba(120, 60, 180, ${0.4 + (i % 2) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 4, 8 + i * 3, a, a + 1.5);
        ctx.stroke();
      }
      ctx.fillStyle = "#1a0a28";
      ctx.beginPath();
      ctx.arc(0, 4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a2080";
      [-18, 16, -12, 14].forEach((x, i) => {
        ctx.beginPath();
        ctx.moveTo(x, 18);
        ctx.lineTo(x + 4, 4 + (i % 2) * 4);
        ctx.lineTo(x + 8, 18);
        ctx.fill();
      });
    } else if (id === "icefiregatling") {
      ctx.fillStyle = "#5a6a70";
      ctx.fillRect(-26, 8, 52, 16);
      ctx.fillStyle = "#8de4ff";
      ctx.beginPath();
      ctx.ellipse(-12, -2, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6a2a";
      ctx.beginPath();
      ctx.ellipse(12, -2, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c0d8e8";
      ctx.fillRect(-22, -8, 12, 6);
      ctx.fillStyle = "#e85020";
      ctx.fillRect(10, -8, 12, 6);
      ctx.fillStyle = "#343b40";
      ctx.beginPath();
      ctx.arc(-16, 26, 7, 0, Math.PI * 2);
      ctx.arc(16, 26, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "imperialgatling") {
      ctx.fillStyle = "#4a1a1a";
      ctx.fillRect(-28, 6, 56, 20);
      ctx.fillStyle = "#8a2020";
      ctx.beginPath();
      ctx.ellipse(0, -4, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d62828";
      ctx.fillRect(10, -10, 22, 8);
      ctx.fillRect(10, -2, 18, 6);
      ctx.fillRect(10, 6, 14, 5);
      ctx.strokeStyle = "#ffd84d";
      ctx.lineWidth = 2;
      ctx.strokeRect(-28, 6, 56, 20);
      ctx.fillStyle = "#2a1010";
      ctx.beginPath();
      ctx.arc(-18, 28, 8, 0, Math.PI * 2);
      ctx.arc(18, 28, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === "shadowchomper") {
      ctx.fillStyle = "#3a1a58";
      ctx.beginPath();
      ctx.ellipse(0, 10, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7a45c2";
      ctx.beginPath();
      ctx.ellipse(8, -8, 20, 16, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0a28";
      ctx.beginPath();
      ctx.ellipse(12, -8, 12, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff7ad9";
      ctx.fillRect(4, -12, 14, 3);
      ctx.fillRect(4, -4, 14, 3);
      if (plant.chewing) {
        ctx.fillStyle = "#fff";
        ctx.font = "10px Nunito";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(plant.chewTimer) + "с", 0, 28);
      }
      for (let pull = 0; pull < (plant.pullsLeft || 0); pull++) {
        ctx.fillStyle = "#c989e8";
        ctx.beginPath();
        ctx.arc(-10 + pull * 8, 30, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "meloncart") {
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(-28, 10, 56, 12);
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.arc(-18, 26, 8, 0, Math.PI * 2);
      ctx.arc(18, 26, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#55a832";
      ctx.beginPath();
      ctx.ellipse(0, -4, 20, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2d6b1e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -4, 20, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#3f8f2b";
      ctx.fillRect(-4, -22, 8, 10);
    } else if (id === "obsidiannut" || id === "obsidiantallnut") {
      const tall = id === "obsidiantallnut";
      const h = tall ? 52 : 34;
      const top = tall ? -48 : -28;
      const body = ctx.createLinearGradient(0, top, 0, 24);
      body.addColorStop(0, "#6b4cff");
      body.addColorStop(0.4, "#3a1a78");
      body.addColorStop(1, "#180830");
      ctx.fillStyle = body;
      ctx.strokeStyle = "#a890ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, 20);
      ctx.lineTo(-24, 4);
      ctx.lineTo(-20, top + 8);
      ctx.lineTo(-8, top);
      ctx.lineTo(0, top - 4);
      ctx.lineTo(8, top);
      ctx.lineTo(20, top + 8);
      ctx.lineTo(24, 4);
      ctx.lineTo(18, 20);
      ctx.lineTo(0, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Кристальные шипы
      ctx.fillStyle = "#8a6cff";
      [
        [-16, top + 6],
        [0, top - 2],
        [16, top + 6],
        [-22, 0],
        [22, 0],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.closePath();
        ctx.fill();
      });
      // Глаза
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-7, tall ? -12 : -4, 5, 0, Math.PI * 2);
      ctx.arc(7, tall ? -12 : -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0a28";
      ctx.beginPath();
      ctx.arc(-6, tall ? -12 : -4, 2, 0, Math.PI * 2);
      ctx.arc(8, tall ? -12 : -4, 2, 0, Math.PI * 2);
      ctx.fill();
      if (tall) {
        ctx.fillStyle = "rgba(180, 160, 255, 0.35)";
        ctx.fillRect(-10, -h + 8, 20, h - 16);
      }
    } else if (id === "obsidianmine") {
      ctx.fillStyle = plant.armed ? "#3a1a78" : "#2a1840";
      ctx.beginPath();
      ctx.ellipse(0, 12, 24, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b4cff";
      [-16, -4, 8, 18].forEach((x, i) => {
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.lineTo(x + 4, -6 - (i % 2) * 4);
        ctx.lineTo(x + 8, 8);
        ctx.fill();
      });
      if (plant.armed) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-6, 8, 4, 0, Math.PI * 2);
        ctx.arc(6, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a0a28";
        ctx.beginPath();
        ctx.arc(-5, 8, 1.5, 0, Math.PI * 2);
        ctx.arc(7, 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
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

      // Оставшееся время (в лаборатории стоит постоянно)
      if (!state.labMode && type.lifeTime) {
        ctx.font = "bold 11px Nunito, sans-serif";
        ctx.fillStyle = "#fff3a8";
        ctx.fillText(`${Math.max(0, Math.ceil(plant.lifeTimer))}с`, 0, 43);
      }
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
    } else if (
      id === "doomshroom" ||
      id === "hypnoshroom" ||
      id === "hypnolia" ||
      id === "chipnolia" ||
      id === "curseshroom" ||
      id === "doomsdayshroom"
    ) {
      const fusePulse =
        type.fuse && plant.fuse > 0
          ? 1 + Math.sin(state.time * 18) * 0.1
          : 1 + Math.sin(state.time * 5) * 0.03;
      ctx.scale(fusePulse, fusePulse);

      const stem =
        id === "chipnolia"
          ? "#f5d8e2"
          : id === "hypnolia"
            ? "#d8d5ff"
            : id === "hypnoshroom"
          ? "#6b4ca8"
          : id === "curseshroom"
            ? "#4a2f78"
            : "#2c2c34";
      const cap =
        id === "chipnolia"
          ? "#c8254f"
          : id === "hypnolia"
            ? "#8d79d8"
            : id === "hypnoshroom"
          ? "#8a62d4"
          : id === "curseshroom"
            ? "#5c3a9a"
            : id === "doomsdayshroom"
              ? "#1a1a22"
              : "#3a3a44";

      ctx.fillStyle = stem;
      ctx.beginPath();
      ctx.ellipse(0, 14, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -6,
        id === "hypnoshroom" ? 16 : id === "hypnolia" || id === "chipnolia" ? 25 : 22,
        id === "hypnolia" || id === "chipnolia" ? 20 : 16,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (id === "hypnoshroom") {
        ctx.strokeStyle = "#c9a0ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -8, 8, 0.2, Math.PI * 1.6);
        ctx.stroke();
        ctx.fillStyle = "#221530";
        ctx.beginPath();
        ctx.arc(-5, 8, 2.5, 0, Math.PI * 2);
        ctx.arc(5, 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (id === "curseshroom") {
        ctx.fillStyle = "#ff4d6d";
        ctx.beginPath();
        ctx.arc(-7, -10, 3, 0, Math.PI * 2);
        ctx.arc(7, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#a078ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -18);
        ctx.quadraticCurveTo(0, -28, 10, -18);
        ctx.stroke();
      }

      if (id === "hypnolia" || id === "chipnolia") {
        ctx.fillStyle = id === "chipnolia" ? "#ffb6c8" : "#d8ceff";
        ctx.beginPath();
        ctx.arc(-8, -9, 4, 0, Math.PI * 2);
        ctx.arc(8, -9, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#29183d";
        ctx.beginPath();
        ctx.arc(-8, -9, 2, 0, Math.PI * 2);
        ctx.arc(8, -9, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f4cf43";
        ctx.strokeStyle = "#9b6812";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-16, -23);
        ctx.lineTo(-10, -34);
        ctx.lineTo(-3, -25);
        ctx.lineTo(5, -35);
        ctx.lineTo(12, -24);
        ctx.lineTo(16, -34);
        ctx.lineTo(17, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (id === "chipnolia") {
          ctx.strokeStyle = "#7a1735";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-20, -18);
          ctx.quadraticCurveTo(-31, -26, -25, -34);
          ctx.moveTo(20, -18);
          ctx.quadraticCurveTo(31, -26, 25, -34);
          ctx.stroke();
          ctx.fillStyle = "#e22b50";
          ctx.beginPath();
          ctx.arc(-27, -35, 6, 0, Math.PI * 2);
          ctx.arc(27, -35, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (id === "doomshroom" || id === "doomsdayshroom") {
        ctx.fillStyle = "#ff2a2a";
        ctx.beginPath();
        ctx.arc(-8, -10, 3.5, 0, Math.PI * 2);
        ctx.arc(8, -10, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ff3a3a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-7, 8);
        ctx.lineTo(7, 18);
        ctx.moveTo(7, 8);
        ctx.lineTo(-7, 18);
        ctx.stroke();
        if (id === "doomsdayshroom") {
          ctx.strokeStyle = "#ff1a1a";
          ctx.lineWidth = 2.5;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, -6, 8 + i * 4, -0.8 + i * 0.2, 0.9 + i * 0.15);
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(255,40,40,0.35)";
          ctx.beginPath();
          ctx.arc(-12, -22, 3, 0, Math.PI * 2);
          ctx.arc(4, -26, 2.5, 0, Math.PI * 2);
          ctx.arc(14, -18, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (plant.armorHp > 0) {
      const armorRatio = plant.armorHp / plant.maxArmorHp;
      ctx.strokeStyle = "#91adba";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 1, 36, 0.2, Math.PI * 1.8);
      ctx.stroke();
      ctx.strokeStyle = "#d5e5eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 1, 32, 0.25, Math.PI * 1.75);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(-25, -65, 50, 6);
      ctx.fillStyle = "#87c5dc";
      ctx.fillRect(-25, -65, 50 * armorRatio, 6);
    }

    if (!type.fuse && id !== "calamityturret") {
      const ratio = Math.max(0, plant.hp / plant.maxHp);
      const healthBarY =
        id === "triplecatgirl"
          ? -50
          : id === "ultimatesakurashooter"
          ? -52
          : id === "fatwallnut"
          ? -52
          : id === "giantwallnut"
          ? -58
          : id === "tallnut" ||
              id === "footballtallnut" ||
              id === "flametallnut" ||
              id === "obsidiantallnut"
            ? -62
            : id === "peafountain"
              ? -55
            : id === "infinut" || id === "voltsnapdragon"
              ? -48
            : id === "squash" || id === "buckshotcommando" || id === "peapod"
              ? -48
          : id === "giantchomper"
            ? -56
            : id === "snowpea"
              ? -53
              : id === "threepeater"
                ? -47
                : id === "gatlingturret"
                  ? -44
                  : -40;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-20, healthBarY, 40, 5);
      ctx.fillStyle = ratio > 0.35 ? "#7bc44a" : "#d4543a";
      ctx.fillRect(-20, healthBarY, 40 * ratio, 5);
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

    if (zombie.typeId === "balloon" && zombie.ballooned) {
      // Воздушный шар держит зомби над растениями
      ctx.strokeStyle = "#5a2630";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, -3);
      ctx.quadraticCurveTo(20, -38, 8, -57);
      ctx.stroke();
      const balloon = ctx.createRadialGradient(0, -75, 3, 7, -68, 20);
      balloon.addColorStop(0, "#ff9a9a");
      balloon.addColorStop(0.45, "#e83e55");
      balloon.addColorStop(1, "#8e1328");
      ctx.fillStyle = balloon;
      ctx.strokeStyle = "#6f1021";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(7, -69, 18, 24, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8e1328";
      ctx.beginPath();
      ctx.moveTo(5, -45);
      ctx.lineTo(10, -45);
      ctx.lineTo(8, -39);
      ctx.closePath();
      ctx.fill();
    }

    if (zombie.typeId === "tank" && !zombie.metalStripped) {
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
    if (zombie.typeId === "bucket" && !zombie.metalStripped) {
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
    if (zombie.typeId === "knight") {
      ctx.fillStyle = "#5a6570";
      ctx.fillRect(-22, -10, 44, 32);
      ctx.fillStyle = "#8a949e";
      ctx.beginPath();
      ctx.moveTo(-18, -28);
      ctx.lineTo(0, -48);
      ctx.lineTo(18, -28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 3;
      ctx.strokeRect(-20, -8, 40, 10);
      ctx.fillStyle = "#d4543a";
      ctx.fillRect(14, -6, 18, 6);
      ctx.fillStyle = "#223018";
      ctx.beginPath();
      ctx.arc(-6, -16, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (zombie.typeId === "obsidiangladiator") {
      // Чёрные обсидиановые латы
      const armor = ctx.createLinearGradient(-24, -35, 24, 24);
      armor.addColorStop(0, "#77708e");
      armor.addColorStop(0.35, "#241d35");
      armor.addColorStop(0.75, "#090711");
      armor.addColorStop(1, "#5a244f");
      ctx.fillStyle = armor;
      ctx.strokeStyle = "#a45d9a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-24, -10);
      ctx.lineTo(-17, -30);
      ctx.lineTo(0, -39);
      ctx.lineTo(17, -30);
      ctx.lineTo(24, -10);
      ctx.lineTo(20, 24);
      ctx.lineTo(-20, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Шлем гладиатора
      ctx.fillStyle = "#12101c";
      ctx.beginPath();
      ctx.moveTo(-18, -25);
      ctx.lineTo(-12, -49);
      ctx.lineTo(0, -58);
      ctx.lineTo(12, -49);
      ctx.lineTo(18, -25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8d3d78";
      ctx.fillRect(-15, -35, 30, 5);
      ctx.fillStyle = "#ff6ad5";
      ctx.beginPath();
      ctx.arc(-6, -20, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -20, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Обсидиановый щит
      ctx.fillStyle = "#171321";
      ctx.strokeStyle = "#b05a9e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-35, -15);
      ctx.lineTo(-18, -22);
      ctx.lineTo(-15, 16);
      ctx.lineTo(-27, 30);
      ctx.lineTo(-39, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#6f2b67";
      ctx.beginPath();
      ctx.moveTo(-27, -12);
      ctx.lineTo(-21, 4);
      ctx.lineTo(-29, 20);
      ctx.lineTo(-34, 3);
      ctx.closePath();
      ctx.fill();

      // Меч
      ctx.strokeStyle = "#d2c9e5";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(19, 14);
      ctx.lineTo(38, -31);
      ctx.stroke();
      ctx.strokeStyle = "#8f4d91";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.lineTo(29, 10);
      ctx.stroke();

      ctx.font = "bold 11px Nunito, sans-serif";
      ctx.fillStyle = "#ff8fe1";
      ctx.textAlign = "center";
      ctx.fillText("БОСС 5000", 0, -65);
    }
    if (zombie.typeId === "zomboni") {
      ctx.fillStyle = "#6ab8d8";
      ctx.fillRect(-28, -6, 56, 28);
      ctx.fillStyle = "#dfeff8";
      ctx.fillRect(-22, -18, 30, 16);
      ctx.fillStyle = "#2a4050";
      ctx.beginPath();
      ctx.arc(-16, 24, 8, 0, Math.PI * 2);
      ctx.arc(16, 24, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9ec98a";
      ctx.beginPath();
      ctx.arc(-6, -12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(180,230,255,0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 30, 30, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (zombie.charmed) {
      ctx.strokeStyle = "rgba(196,139,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -4, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(196,139,255,0.35)";
      ctx.beginPath();
      ctx.arc(-10, -28, 3, 0, Math.PI * 2);
      ctx.arc(8, -32, 2.5, 0, Math.PI * 2);
      ctx.arc(14, -22, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (zombie.poisonTimer > 0) {
      ctx.fillStyle = "rgba(140, 70, 220, 0.55)";
      ctx.beginPath();
      ctx.arc(-8, -6, 3, 0, Math.PI * 2);
      ctx.arc(6, -18, 2.5, 0, Math.PI * 2);
      ctx.arc(0, 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (zombie.slowTimer > 0) {
      ctx.fillStyle = "rgba(180, 230, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(-10, -8, 3, 0, Math.PI * 2);
      ctx.arc(8, -20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const ratio = Math.max(0, zombie.hp / zombie.maxHp);
    const barY =
      zombie.typeId === "obsidiangladiator"
        ? -74
        : zombie.typeId === "giant" || zombie.typeId === "knight"
        ? -62
        : zombie.typeId === "zomboni"
          ? -48
          : -42;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(-20, barY, 40, 5);
    ctx.fillStyle = zombie.charmed
      ? ratio > 0.35
        ? "#b48bff"
        : "#7a4fd4"
      : ratio > 0.35
        ? "#e85a7a"
        : "#d4543a";
    ctx.fillRect(-20, barY, 40 * ratio, 5);

    ctx.restore();
  }

  function drawProjectiles() {
    state.projectiles.forEach((p) => {
      if (p.homingShot) {
        ctx.save();
        (p.trail || []).forEach((point, index, trail) => {
          ctx.fillStyle = hexToRgba(
            p.color,
            ((index + 1) / Math.max(1, trail.length)) * 0.45
          );
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2 + index * 0.25, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.translate(p.x, p.y);
        ctx.rotate(state.time * 8);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let point = 0; point < 10; point++) {
          const radius = point % 2 === 0 ? 8 : 3.5;
          const angle = -Math.PI / 2 + (point * Math.PI) / 5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
      }

      if (p.sniperShot) {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.headshot ? 6 : 3;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.headshot ? 18 : 10;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.endX, p.endY);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (p.lobShot) {
        if (p.projectileKind === "melon") {
          ctx.fillStyle = "#4da832";
          ctx.strokeStyle = "#174f21";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "#b4dc68";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, -1.2, 1.2);
          ctx.stroke();
          return;
        }
        if (p.projectileKind === "butter") {
          ctx.fillStyle = "#ffd84d";
          ctx.strokeStyle = "#b77a1a";
          ctx.lineWidth = 2;
          ctx.fillRect(p.x - 10, p.y - 7, 20, 14);
          ctx.strokeRect(p.x - 10, p.y - 7, 20, 14);
          return;
        }
        if (p.projectileKind === "kernel") {
          ctx.fillStyle = "#f0c840";
          ctx.strokeStyle = "#8a6418";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 7, 11, 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          return;
        }
        ctx.fillStyle = p.color || "#d94f9a";
        ctx.strokeStyle = "#5a1840";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 10, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f0c840";
        ctx.beginPath();
        ctx.moveTo(p.x - 4, p.y - 6);
        ctx.lineTo(p.x, p.y - 14);
        ctx.lineTo(p.x + 4, p.y - 6);
        ctx.fill();
        if (p.poison) {
          ctx.fillStyle = "rgba(140, 80, 220, 0.45)";
          ctx.beginPath();
          ctx.arc(p.x + 6, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      if (p.starBulletKind === "egg") {
        ctx.fillStyle = "#fff6e2";
        ctx.strokeStyle = "#d8c39a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 7, 9.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.ellipse(p.x - 2, p.y - 3, 2.5, 3.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (p.chompSpit) {
        ctx.fillStyle = "#8a6a5a";
        ctx.strokeStyle = "#4a3028";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 10, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#c48bff";
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (p.starShot) {
        ctx.fillStyle = p.color || "#ffd84d";
        ctx.strokeStyle = p.magnetDart ? "#5ee7ff" : "#c58f16";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let point = 0; point < 10; point++) {
          const radius = point % 2 === 0 ? 8 : 3.5;
          const angle = -Math.PI / 2 + (point * Math.PI) / 5 + state.time * 4;
          const x = p.x + Math.cos(angle) * radius;
          const y = p.y + Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (p.magnetDart) {
          ctx.strokeStyle = "rgba(94, 231, 255, 0.55)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        return;
      }
      if (p.starBulletKind === "metal") {
        const g = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, 11);
        g.addColorStop(0, "#d8dee4");
        g.addColorStop(0.55, "#8f99a3");
        g.addColorStop(1, "#4a535c");
        ctx.fillStyle = g;
        ctx.strokeStyle = "#2f363c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(200, 160, 255, 0.35)";
        ctx.beginPath();
        ctx.ellipse(p.x - 12, p.y, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (p.starBulletKind === "ice") {
        ctx.fillStyle = "#8de4ff";
        ctx.strokeStyle = "#3aa8d8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "rgba(180, 240, 255, 0.85)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a = state.time * 6 + i * ((Math.PI * 2) / 3);
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(a) * 5, p.y + Math.sin(a) * 4, 3, 0, Math.PI * 1.4);
          ctx.stroke();
        }
        return;
      }
      if (p.starBulletKind === "seed") {
        ctx.fillStyle = "#3a2412";
        ctx.strokeStyle = "#1a1008";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          const ox = ((i % 3) - 1) * 5;
          const oy = (Math.floor(i / 3) - 0.5) * 5;
          ctx.beginPath();
          ctx.ellipse(p.x + ox, p.y + oy, 3.2, 4.5, 0.2 * i, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        return;
      }
      if (p.cherryShot || p.starBulletKind === "cherry") {
        ctx.fillStyle = "#d61f36";
        ctx.strokeStyle = "#721122";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x - 4, p.y + 1, 7, 0, Math.PI * 2);
        ctx.arc(p.x + 5, p.y - 1, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#4f7f26";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 6);
        ctx.quadraticCurveTo(p.x + 2, p.y - 14, p.x + 8, p.y - 15);
        ctx.stroke();
        ctx.fillStyle = "#79b83f";
        ctx.beginPath();
        ctx.ellipse(p.x + 10, p.y - 15, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (p.balloonDart) {
        ctx.fillStyle = "#ed2945";
        ctx.strokeStyle = "#721122";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x + 11, p.y);
        ctx.lineTo(p.x - 8, p.y - 5);
        ctx.lineTo(p.x - 4, p.y);
        ctx.lineTo(p.x - 8, p.y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        return;
      }
      if (p.cornShot) {
        ctx.fillStyle = "#f0c840";
        ctx.strokeStyle = "#8a6418";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 13, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const confetti = ["#e85a7a", "#8d5ab5", "#63c45a", "#ff8a3d"];
        confetti.forEach((color, index) => {
          const angle = state.time * 8 + index * (Math.PI / 2);
          ctx.fillStyle = color;
          ctx.fillRect(
            p.x - 8 + Math.cos(angle) * 8,
            p.y + Math.sin(angle) * 7,
            4,
            3
          );
        });
        ctx.fillStyle = "#fff4a8";
        ctx.beginPath();
        ctx.arc(p.x + 4, p.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (p.laserShot) {
        const startX = p.originX ?? p.x - 40;
        const endX = p.x + 8;
        const y = p.y;
        const glow = ctx.createLinearGradient(startX, y, endX, y);
        glow.addColorStop(0, "rgba(80, 220, 255, 0.05)");
        glow.addColorStop(0.15, "rgba(80, 220, 255, 0.55)");
        glow.addColorStop(1, "rgba(180, 250, 255, 0.9)");
        ctx.strokeStyle = glow;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
        ctx.strokeStyle = "rgba(210, 250, 255, 0.95)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
        ctx.fillStyle = "#eaffff";
        ctx.beginPath();
        ctx.arc(endX, y, 5, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (p.calamityShot) {
        ctx.fillStyle = p.color || "#ff3a4a";
        ctx.strokeStyle = "#4a0810";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 11, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255,80,40,0.55)";
        ctx.beginPath();
        ctx.arc(p.x - 10, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (p.headShot) {
        ctx.fillStyle = "#82ae75";
        ctx.strokeStyle = "#405e3b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#21301e";
        ctx.beginPath();
        ctx.arc(p.x - 4, p.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(p.x + 4, p.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#d7e8cf";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 5, p.y + 5);
        ctx.lineTo(p.x + 5, p.y + 5);
        ctx.stroke();
        return;
      }
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

  function drawPowderDrops() {
    state.powderDrops.forEach((powder) => {
      const pulse = 1 + Math.sin(state.time * 7 + powder.x) * 0.12;
      ctx.save();
      ctx.translate(powder.x, powder.y);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#fff4a8";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(255, 250, 214, 0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#e9cf75";
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      ctx.lineTo(8, -9);
      ctx.lineTo(11, 10);
      ctx.lineTo(-11, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 17px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨", 0, 1);
      ctx.restore();
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

  function drawCraters() {
    state.craters.forEach((c) => {
      if (c.timer <= 0) return;
      const pos = cellCenter(c.col, c.row);
      const fade = Math.min(1, c.timer / 5);
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.fillStyle = `rgba(28, 18, 14, ${0.55 * fade})`;
      ctx.beginPath();
      ctx.ellipse(0, 8, 28, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(70, 40, 28, ${0.45 * fade})`;
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function draw() {
    drawBackground();
    drawCraters();
    drawForcefields();
    drawSunrollers();
    drawMowers();
    state.plants.forEach(drawPlant);
    state.zombies.forEach(drawZombie);
    drawProjectiles();
    drawSuns();
    drawPowderDrops();
    drawFx();
    if (state.timeFrozen) {
      ctx.save();
      ctx.fillStyle = "rgba(80, 210, 245, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(205, 250, 255, 0.75)";
      ctx.lineWidth = 4;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
      ctx.font = "bold 24px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#e2fbff";
      ctx.strokeStyle = "rgba(6, 40, 57, 0.85)";
      ctx.lineWidth = 5;
      ctx.strokeText("🧊 ВРЕМЯ ЗАМОРОЖЕНО", canvas.width / 2, 28);
      ctx.fillText("🧊 ВРЕМЯ ЗАМОРОЖЕНО", canvas.width / 2, 28);
      ctx.restore();
    }
  }

  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    let dt = (ts - state.lastTs) / 1000;
    state.lastTs = ts;
    dt = Math.min(0.05, dt * state.gameSpeed);

    if (state.timeFrozen) {
      updateHud();
      draw();
      requestAnimationFrame(loop);
      return;
    }

    state.time += dt;
    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) els.toast.classList.add("hidden");
    }

    if (state.side === "plants" && !state.labMode) {
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
    updateForcefields(dt);
    updateSunrollers(dt);
    updateMowers(dt);
    updateProjectiles(dt);
    updateSuns(dt);
    updatePowderDrops(dt);
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
      if (go === "hybrids") {
        buildHybridGuide();
      }
      if (go === "levels") {
        if (!state.side) {
          showScreen("side");
          speakInstruction("side");
          return;
        }
        if (!state.worldId) state.worldId = "modern";
        buildLevels();
      }
      if (go === "worlds") {
        if (!state.side) {
          showScreen("side");
          speakInstruction("side");
          return;
        }
        buildWorlds();
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
      buildWorlds();
      showScreen("worlds");
      speakInstruction("worlds");
    });
  });

  if (els.btnLaboratory) {
    els.btnLaboratory.addEventListener("click", () => {
      AudioFX.unlock();
      AudioFX.click();
      startLaboratory();
    });
  }

  if (els.btnPause) els.btnPause.addEventListener("click", pauseGame);
  if (els.btnTimeFreeze) {
    els.btnTimeFreeze.addEventListener("click", toggleTimeFreeze);
  }
  if (els.btnSpeed2) {
    els.btnSpeed2.addEventListener("click", () => toggleGameSpeed(2));
  }
  if (els.btnSpeed3) {
    els.btnSpeed3.addEventListener("click", () => toggleGameSpeed(3));
  }
  if (els.btnRowMode) {
    els.btnRowMode.addEventListener("click", toggleRowPlanting);
  }
  if (els.btnLabSpawn) {
    els.btnLabSpawn.addEventListener("click", spawnLabTestZombie);
  }
  if (els.btnResume) els.btnResume.addEventListener("click", resumeGame);
  if (els.btnPauseHybrids) {
    els.btnPauseHybrids.addEventListener("click", showPauseHybridGuide);
  }
  if (els.btnPauseHybridsBack) {
    els.btnPauseHybridsBack.addEventListener("click", () => {
      AudioFX.click();
      showPauseMain();
    });
  }
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
