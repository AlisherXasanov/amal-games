(() => {
  const ARENA = 1200;
  const ROOM_PREFIX = "bravol";

  const MODES = {
    duel: { id: "duel", label: "1 на 1", max: 2, teamSize: 1 },
    twovtwo: { id: "twovtwo", label: "2 на 2", max: 4, teamSize: 2 },
    threevthree: { id: "threevthree", label: "3 на 3", max: 6, teamSize: 3 },
  };

  const STARTER_IDS = ["blaze", "nox", "tanko", "bolt", "hexa", "spike"];
  const CHEST_COST = 120;
  const COIN_NAME = "Браволы";

  const BRAWLERS = [
    {
      id: "blaze",
      name: "Блейз",
      emoji: "💥",
      role: "Штурмовик",
      desc: "Дробь вблизи — высокая мощь",
      ability: "Залп дроби",
      color: "#ff6b35",
      hp: 3600,
      speed: 265,
      range: 420,
      reload: 0.85,
      bullets: 5,
      spread: 0.35,
      damage: 280,
      bulletSpeed: 520,
      bulletLife: 0.55,
      radius: 22,
      unlock: 0,
    },
    {
      id: "nox",
      name: "Нокс",
      emoji: "🎯",
      role: "Снайпер",
      desc: "Дальний точный выстрел",
      ability: "Точечный выстрел",
      color: "#4cc9f0",
      hp: 2800,
      speed: 240,
      range: 720,
      reload: 1.05,
      bullets: 1,
      spread: 0.02,
      damage: 920,
      bulletSpeed: 780,
      bulletLife: 1.05,
      radius: 20,
      unlock: 0,
    },
    {
      id: "tanko",
      name: "Танко",
      emoji: "🛡️",
      role: "Танк",
      desc: "Много HP, ближний удар",
      ability: "Тяжёлый удар",
      color: "#90be6d",
      hp: 5600,
      speed: 210,
      range: 280,
      reload: 0.7,
      bullets: 1,
      spread: 0.05,
      damage: 700,
      bulletSpeed: 420,
      bulletLife: 0.45,
      radius: 26,
      knockback: 90,
      unlock: 0,
    },
    {
      id: "bolt",
      name: "Болт",
      emoji: "⚡",
      role: "Ассасин",
      desc: "Скорость и рывок к цели",
      ability: "Рывок",
      color: "#f72585",
      hp: 3000,
      speed: 320,
      range: 220,
      reload: 0.55,
      bullets: 1,
      spread: 0.08,
      damage: 620,
      bulletSpeed: 640,
      bulletLife: 0.28,
      radius: 19,
      dash: true,
      unlock: 0,
    },
    {
      id: "hexa",
      name: "Гекса",
      emoji: "☠️",
      role: "Контроль",
      desc: "Ядовитые снаряды",
      ability: "Яд",
      color: "#9b5de5",
      hp: 3200,
      speed: 255,
      range: 500,
      reload: 0.75,
      bullets: 3,
      spread: 0.22,
      damage: 180,
      bulletSpeed: 480,
      bulletLife: 0.85,
      radius: 21,
      poison: 90,
      unlock: 0,
    },
    {
      id: "spike",
      name: "Спайк",
      emoji: "💣",
      role: "Артиллерия",
      desc: "Взрывные гранаты",
      ability: "Взрыв",
      color: "#f4a261",
      hp: 3400,
      speed: 235,
      range: 560,
      reload: 1.15,
      bullets: 1,
      spread: 0.04,
      damage: 1100,
      bulletSpeed: 360,
      bulletLife: 1.2,
      radius: 22,
      explosive: 110,
      unlock: 0,
    },
    {
      id: "frost",
      name: "Фрост",
      emoji: "❄️",
      role: "Контроль",
      desc: "Замораживает врагов",
      ability: "Лёд: замедление",
      color: "#90e0ef",
      hp: 3100,
      speed: 250,
      range: 520,
      reload: 0.8,
      bullets: 2,
      spread: 0.12,
      damage: 320,
      bulletSpeed: 500,
      bulletLife: 1,
      radius: 21,
      freeze: 2.2,
      unlock: 1,
    },
    {
      id: "viper",
      name: "Вайпер",
      emoji: "🐍",
      role: "Ассасин",
      desc: "Яд и вампиризм",
      ability: "Укус: яд + вампиризм",
      color: "#2d6a4f",
      hp: 2900,
      speed: 300,
      range: 380,
      reload: 0.65,
      bullets: 1,
      spread: 0.05,
      damage: 480,
      bulletSpeed: 560,
      bulletLife: 0.7,
      radius: 20,
      poison: 120,
      lifesteal: 0.35,
      unlock: 1,
    },
    {
      id: "comet",
      name: "Комета",
      emoji: "☄️",
      role: "Снайпер",
      desc: "Самонаводящиеся снаряды",
      ability: "Наведение",
      color: "#ff9e00",
      hp: 3000,
      speed: 245,
      range: 640,
      reload: 0.95,
      bullets: 1,
      spread: 0.02,
      damage: 700,
      bulletSpeed: 420,
      bulletLife: 1.4,
      radius: 20,
      homing: true,
      unlock: 1,
    },
    {
      id: "needle",
      name: "Игла",
      emoji: "🪡",
      role: "Снайпер",
      desc: "Пробивает нескольких врагов",
      ability: "Пробитие ×3",
      color: "#adb5bd",
      hp: 2700,
      speed: 255,
      range: 700,
      reload: 1.0,
      bullets: 1,
      spread: 0.01,
      damage: 560,
      bulletSpeed: 820,
      bulletLife: 1.1,
      radius: 18,
      pierce: 3,
      unlock: 1,
    },
    {
      id: "magma",
      name: "Магма",
      emoji: "🌋",
      role: "Артиллерия",
      desc: "Огненный взрыв и ожог",
      ability: "Извержение",
      color: "#d00000",
      hp: 3600,
      speed: 220,
      range: 500,
      reload: 1.2,
      bullets: 1,
      spread: 0.04,
      damage: 900,
      bulletSpeed: 340,
      bulletLife: 1.3,
      radius: 24,
      explosive: 140,
      poison: 80,
      unlock: 1,
    },
    {
      id: "ghost",
      name: "Гоуст",
      emoji: "👻",
      role: "Ассасин",
      desc: "Длинный рывок сквозь врагов",
      ability: "Фантомный рывок",
      color: "#c77dff",
      hp: 2800,
      speed: 310,
      range: 260,
      reload: 0.6,
      bullets: 1,
      spread: 0.06,
      damage: 580,
      bulletSpeed: 600,
      bulletLife: 0.3,
      radius: 19,
      dash: true,
      dashDist: 260,
      unlock: 1,
    },
    {
      id: "medic",
      name: "Медик",
      emoji: "💉",
      role: "Поддержка",
      desc: "Выстрел лечит тебя",
      ability: "Аптечка",
      color: "#80ed99",
      hp: 3300,
      speed: 250,
      range: 460,
      reload: 0.7,
      bullets: 2,
      spread: 0.15,
      damage: 220,
      bulletSpeed: 500,
      bulletLife: 0.8,
      radius: 21,
      healShot: 220,
      unlock: 1,
    },
    {
      id: "titan",
      name: "Титан",
      emoji: "🗿",
      role: "Танк",
      desc: "Гигант с отбрасыванием",
      ability: "Сейсмический удар",
      color: "#6c757d",
      hp: 7200,
      speed: 185,
      range: 260,
      reload: 0.85,
      bullets: 1,
      spread: 0.05,
      damage: 850,
      bulletSpeed: 380,
      bulletLife: 0.4,
      radius: 30,
      knockback: 160,
      unlock: 1,
    },
    {
      id: "spark",
      name: "Спарк",
      emoji: "⚡",
      role: "Контроль",
      desc: "Цепная молния по врагам",
      ability: "Цепь молний",
      color: "#fee440",
      hp: 3000,
      speed: 270,
      range: 480,
      reload: 0.9,
      bullets: 1,
      spread: 0.02,
      damage: 400,
      bulletSpeed: 700,
      bulletLife: 0.6,
      radius: 20,
      chain: 3,
      unlock: 1,
    },
    {
      id: "trapper",
      name: "Траппер",
      emoji: "🪤",
      role: "Контроль",
      desc: "Ставит мины на поле",
      ability: "Мина",
      color: "#bc6c25",
      hp: 3200,
      speed: 240,
      range: 400,
      reload: 1.0,
      bullets: 1,
      spread: 0.04,
      damage: 500,
      bulletSpeed: 450,
      bulletLife: 0.7,
      radius: 21,
      mine: true,
      unlock: 1,
    },
    {
      id: "orbit",
      name: "Орбит",
      emoji: "🌀",
      role: "Штурмовик",
      desc: "Кольцо снарядов вокруг",
      ability: "Орбитальный залп",
      color: "#4ea8de",
      hp: 3400,
      speed: 245,
      range: 360,
      reload: 1.1,
      bullets: 8,
      spread: 6.28,
      damage: 200,
      bulletSpeed: 380,
      bulletLife: 0.9,
      radius: 22,
      ring: true,
      unlock: 1,
    },
    {
      id: "raven",
      name: "Рейвен",
      emoji: "🦅",
      role: "Ассасин",
      desc: "Стеклянная пушка — огромный урон",
      ability: "Смертельный пике",
      color: "#212529",
      hp: 2400,
      speed: 335,
      range: 500,
      reload: 0.5,
      bullets: 1,
      spread: 0.03,
      damage: 1100,
      bulletSpeed: 720,
      bulletLife: 0.75,
      radius: 18,
      unlock: 1,
    },
    {
      id: "nova",
      name: "Нова",
      emoji: "🌟",
      role: "Артиллерия",
      desc: "Метеор в точку прицела",
      ability: "Метеорит",
      color: "#ff6d00",
      hp: 3100,
      speed: 230,
      range: 700,
      reload: 1.35,
      bullets: 1,
      spread: 0,
      damage: 1300,
      bulletSpeed: 1,
      bulletLife: 0.1,
      radius: 22,
      meteor: 150,
      unlock: 1,
    },
    {
      id: "echo",
      name: "Эхо",
      emoji: "🔊",
      role: "Штурмовик",
      desc: "При рикошете снаряд делится",
      ability: "Эхо-рикошет",
      color: "#7b2cbf",
      hp: 3200,
      speed: 260,
      range: 480,
      reload: 0.75,
      bullets: 1,
      spread: 0.04,
      damage: 360,
      bulletSpeed: 540,
      bulletLife: 1,
      radius: 20,
      split: true,
      unlock: 1,
    },
    {
      id: "beam",
      name: "Бим",
      emoji: "📡",
      role: "Снайпер",
      desc: "Мгновенный лазер через карту",
      ability: "Лазерный луч",
      color: "#00f5d4",
      hp: 2900,
      speed: 235,
      range: 900,
      reload: 1.15,
      bullets: 1,
      spread: 0,
      damage: 780,
      bulletSpeed: 2000,
      bulletLife: 0.05,
      radius: 20,
      laser: true,
      unlock: 1,
    },
    {
      id: "boulder",
      name: "Болдер",
      emoji: "🪨",
      role: "Танк",
      desc: "Медленный, но сокрушительный",
      ability: "Каменный таран",
      color: "#8d6e63",
      hp: 6800,
      speed: 175,
      range: 300,
      reload: 0.95,
      bullets: 1,
      spread: 0.05,
      damage: 950,
      bulletSpeed: 320,
      bulletLife: 0.5,
      radius: 28,
      knockback: 200,
      dash: true,
      dashDist: 140,
      unlock: 1,
    },
    /* —— Сильные бойцы (по возрастанию мощи) —— */
    {
      id: "storm",
      name: "Шторм",
      emoji: "🌪️",
      role: "Штурмовик",
      desc: "Ураганный залп с отбрасыванием",
      ability: "Вихрь",
      color: "#48cae4",
      hp: 4200,
      speed: 280,
      range: 480,
      reload: 0.7,
      bullets: 7,
      spread: 0.42,
      damage: 320,
      bulletSpeed: 560,
      bulletLife: 0.7,
      radius: 22,
      knockback: 70,
      unlock: 1,
    },
    {
      id: "reaper",
      name: "Жнец",
      emoji: "☠️",
      role: "Ассасин",
      desc: "Яд, вампиризм и рывок",
      ability: "Жатва",
      color: "#1b4332",
      hp: 3800,
      speed: 340,
      range: 340,
      reload: 0.48,
      bullets: 1,
      spread: 0.04,
      damage: 980,
      bulletSpeed: 680,
      bulletLife: 0.45,
      radius: 20,
      poison: 160,
      lifesteal: 0.45,
      dash: true,
      dashDist: 220,
      unlock: 1,
    },
    {
      id: "plasma",
      name: "Плазма",
      emoji: "🔮",
      role: "Снайпер",
      desc: "Пробивающий самонаводящийся луч",
      ability: "Плазменный луч",
      color: "#b5179e",
      hp: 4000,
      speed: 255,
      range: 780,
      reload: 0.85,
      bullets: 1,
      spread: 0.01,
      damage: 1100,
      bulletSpeed: 640,
      bulletLife: 1.2,
      radius: 21,
      homing: true,
      pierce: 4,
      unlock: 1,
    },
    {
      id: "quake",
      name: "Квейк",
      emoji: "🌋",
      role: "Танк",
      desc: "Огромный HP и сейсмический удар",
      ability: "Землетрясение",
      color: "#9c6644",
      hp: 9000,
      speed: 195,
      range: 320,
      reload: 0.8,
      bullets: 1,
      spread: 0.05,
      damage: 1200,
      bulletSpeed: 360,
      bulletLife: 0.5,
      radius: 32,
      knockback: 240,
      explosive: 130,
      unlock: 1,
    },
    {
      id: "hydra",
      name: "Гидра",
      emoji: "🐲",
      role: "Артиллерия",
      desc: "Разрывные снаряды и цепь молний",
      ability: "Дыхание гидры",
      color: "#2a9d8f",
      hp: 4800,
      speed: 250,
      range: 620,
      reload: 0.95,
      bullets: 3,
      spread: 0.18,
      damage: 720,
      bulletSpeed: 440,
      bulletLife: 1.1,
      radius: 24,
      explosive: 100,
      chain: 4,
      poison: 100,
      unlock: 1,
    },
    {
      id: "phantom",
      name: "Фантом",
      emoji: "🌑",
      role: "Ассасин",
      desc: "Сверхбыстрый фантомный убийца",
      ability: "Теневой удар",
      color: "#240046",
      hp: 4500,
      speed: 380,
      range: 400,
      reload: 0.4,
      bullets: 2,
      spread: 0.1,
      damage: 1400,
      bulletSpeed: 760,
      bulletLife: 0.5,
      radius: 19,
      dash: true,
      dashDist: 300,
      lifesteal: 0.3,
      pierce: 2,
      unlock: 1,
    },
    {
      id: "solaris",
      name: "Солярис",
      emoji: "☀️",
      role: "Артиллерия",
      desc: "Солнечный метеор и ожог",
      ability: "Солнечный удар",
      color: "#ffba08",
      hp: 5200,
      speed: 240,
      range: 800,
      reload: 1.1,
      bullets: 1,
      spread: 0,
      damage: 1800,
      bulletSpeed: 1,
      bulletLife: 0.1,
      radius: 24,
      meteor: 190,
      freeze: 1.2,
      unlock: 1,
    },
    {
      id: "aegis",
      name: "Эгида",
      emoji: "🛡️",
      role: "Танк",
      desc: "Живая крепость с лечением",
      ability: "Щит эгиды",
      color: "#4cc9f0",
      hp: 11000,
      speed: 200,
      range: 360,
      reload: 0.75,
      bullets: 1,
      spread: 0.04,
      damage: 1100,
      bulletSpeed: 400,
      bulletLife: 0.55,
      radius: 30,
      knockback: 180,
      healShot: 400,
      unlock: 1,
    },
    {
      id: "oblivion",
      name: "Обливион",
      emoji: "🕳️",
      role: "Легенда",
      desc: "Почти неубиваемый разрушитель",
      ability: "Обнуление",
      color: "#10002b",
      hp: 14000,
      speed: 270,
      range: 700,
      reload: 0.55,
      bullets: 5,
      spread: 0.28,
      damage: 1600,
      bulletSpeed: 580,
      bulletLife: 1,
      radius: 26,
      explosive: 150,
      pierce: 3,
      chain: 5,
      knockback: 120,
      unlock: 1,
    },
    {
      id: "apex",
      name: "Апекс",
      emoji: "👑",
      role: "Легенда",
      desc: "Самый сильный боец арены",
      ability: "Абсолютная мощь",
      color: "#ffd60a",
      hp: 18000,
      speed: 310,
      range: 900,
      reload: 0.45,
      bullets: 1,
      spread: 0,
      damage: 2500,
      bulletSpeed: 1,
      bulletLife: 0.1,
      radius: 28,
      meteor: 220,
      lifesteal: 0.4,
      healShot: 500,
      freeze: 2.5,
      unlock: 1,
    },
  ];

  const NAMES = [
    "Рико", "Шелли", "Кольт", "Булл", "Брок", "Джесси",
    "Нита", "Эль Примо", "Барли", "Поко", "Роза", "Мортис",
  ];

  const store = {
    get(k, fb) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? fb : JSON.parse(v);
      } catch {
        return fb;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
  };

  const app = document.getElementById("app");
  let selectedId = store.get("bravol-brawler", "blaze");
  let best = store.get("bravol-best", 0);
  let wins = store.get("bravol-wins", 0);
  let nickname = store.get("bravol-nick", "Герой");
  let coins = store.get("bravol-coins", 200);
  let unlocked = new Set(store.get("bravol-unlocked", STARTER_IDS));

  /** Owner-only godmode (guests play fair). */
  const CHEATS = {
    invincible: false,
    infiniteDamage: false,
    infiniteAmmo: false,
    noclip: false,
    fly: false,
    panelOpen: false,
  };

  function isOwnerNow() {
    return typeof AmalOwner !== "undefined" && AmalOwner.isOwner();
  }

  function refreshOwnerCheats() {
    const on = isOwnerNow();
    CHEATS.invincible = on;
    CHEATS.infiniteDamage = on;
    CHEATS.infiniteAmmo = on;
    CHEATS.noclip = on;
    CHEATS.fly = on;
    if (on) {
      BRAWLERS.forEach((b) => unlocked.add(b.id));
      if (coins < 999999) {
        coins = 999999;
        store.set("bravol-coins", coins);
      }
      saveUnlocksSafe();
    }
  }

  function saveUnlocksSafe() {
    try {
      store.set("bravol-unlocked", [...unlocked]);
    } catch (_) {
      /* ignore */
    }
  }

  refreshOwnerCheats();
  window.addEventListener("amal-owner-changed", () => {
    refreshOwnerCheats();
    if (document.getElementById("screen-menu")) renderMenu();
  });

  function saveUnlocks() {
    store.set("bravol-unlocked", [...unlocked]);
  }
  function saveCoins() {
    store.set("bravol-coins", coins);
  }
  function isUnlocked(id) {
    return unlocked.has(id);
  }
  function addCoins(n) {
    coins = Math.max(0, coins + (n | 0));
    saveCoins();
  }
  function killEveryone(g) {
    const local = g.fighters.find((f) => f.isLocal);
    if (!local || !local.alive) return;
    for (const f of g.fighters) {
      if (!f.alive || f === local || sameTeam(g, local, f)) continue;
      f.invuln = 0;
      hurt(g, f, 1e12, local);
    }
  }
  function lockedPool() {
    return BRAWLERS.filter((b) => b.unlock && !unlocked.has(b.id));
  }
  function ensureSelectedValid() {
    if (!isUnlocked(selectedId)) {
      selectedId = STARTER_IDS[0];
      store.set("bravol-brawler", selectedId);
    }
  }
  ensureSelectedValid();

  let game = null;
  let raf = 0;
  let inputCleanup = null;
  let net = null;
  let lobby = null;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function ang(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }
  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += chars[(Math.random() * chars.length) | 0];
    return s;
  }
  function peerIdFromCode(code) {
    return `${ROOM_PREFIX}-${String(code).toUpperCase()}`;
  }
  function brawlerById(id) {
    return BRAWLERS.find((b) => b.id === id) || BRAWLERS[0];
  }

  function circleRectHit(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }

  function resolveWalls(ent, walls) {
    const localGod = !!(ent.isLocal && CHEATS.noclip);
    if (!localGod) {
      for (const w of walls) {
        if (!circleRectHit(ent.x, ent.y, ent.r, w.x, w.y, w.w, w.h)) continue;
        const left = Math.abs(ent.x - w.x);
        const right = Math.abs(ent.x - (w.x + w.w));
        const top = Math.abs(ent.y - w.y);
        const bottom = Math.abs(ent.y - (w.y + w.h));
        const m = Math.min(left, right, top, bottom);
        if (m === left) ent.x = w.x - ent.r;
        else if (m === right) ent.x = w.x + w.w + ent.r;
        else if (m === top) ent.y = w.y - ent.r;
        else ent.y = w.y + w.h + ent.r;
      }
    }
    if (!(ent.isLocal && CHEATS.fly)) {
      ent.x = clamp(ent.x, ent.r, ARENA - ent.r);
      ent.y = clamp(ent.y, ent.r, ARENA - ent.r);
    }
  }

  function makeArena(rng = Math.random) {
    const walls = [
      { x: 220, y: 180, w: 160, h: 40 },
      { x: 820, y: 180, w: 160, h: 40 },
      { x: 220, y: 980, w: 160, h: 40 },
      { x: 820, y: 980, w: 160, h: 40 },
      { x: 540, y: 360, w: 120, h: 120 },
      { x: 180, y: 520, w: 40, h: 180 },
      { x: 980, y: 520, w: 40, h: 180 },
      { x: 420, y: 720, w: 180, h: 40 },
      { x: 600, y: 720, w: 180, h: 40 },
      { x: 360, y: 80, w: 40, h: 140 },
      { x: 800, y: 980, w: 40, h: 140 },
    ];
    const bushes = [];
    for (let i = 0; i < 18; i++) {
      bushes.push({
        x: 80 + rng() * (ARENA - 160),
        y: 80 + rng() * (ARENA - 160),
        r: 38 + rng() * 20,
      });
    }
    const boxes = [];
    for (let i = 0; i < 8; i++) {
      boxes.push({
        x: 120 + rng() * (ARENA - 240),
        y: 120 + rng() * (ARENA - 240),
        hp: 1,
        open: false,
      });
    }
    return { walls, bushes, boxes };
  }

  function spawnPoints() {
    return [
      { x: 140, y: 140, team: 0 },
      { x: 140, y: ARENA - 140, team: 0 },
      { x: 140, y: ARENA / 2, team: 0 },
      { x: ARENA - 140, y: 140, team: 1 },
      { x: ARENA - 140, y: ARENA - 140, team: 1 },
      { x: ARENA - 140, y: ARENA / 2, team: 1 },
      { x: ARENA / 2, y: 120, team: 0 },
      { x: ARENA / 2, y: ARENA - 120, team: 1 },
    ];
  }

  function createFighter(def, name, x, y, opts = {}) {
    return {
      id: opts.id || Math.random().toString(36).slice(2, 9),
      netId: opts.netId || null,
      def,
      defId: def.id,
      name,
      x,
      y,
      r: def.radius,
      hp: def.hp,
      maxHp: def.hp,
      angle: 0,
      reload: 0,
      power: 0,
      alive: true,
      isLocal: !!opts.isLocal,
      isBot: !!opts.isBot,
      team: opts.team ?? 0,
      poisonT: 0,
      slowT: 0,
      dashT: 0,
      invuln: 2.2,
      ai: {
        roamAngle: rand(0, Math.PI * 2),
        changeT: rand(0.5, 2),
        aggression: rand(0.55, 1),
      },
      kills: 0,
      flash: 0,
      input: { mx: 0, my: 0, aimX: x, aimY: y, shoot: false },
    };
  }

  function createSoloGame(brawlerId) {
    const def = brawlerById(brawlerId);
    const arena = makeArena();
    const points = spawnPoints().sort(() => Math.random() - 0.5);
    const fighters = [];
    fighters.push(
      createFighter(def, nickname || "Ты", points[0].x, points[0].y, {
        isLocal: true,
        team: 0,
        netId: "local",
      })
    );
    const used = new Set([def.id]);
    for (let i = 0; i < 5; i++) {
      let botDef = pick(BRAWLERS);
      let tries = 0;
      while (used.has(botDef.id) && tries++ < 10) botDef = pick(BRAWLERS);
      used.add(botDef.id);
      const p = points[i + 1];
      fighters.push(
        createFighter(botDef, pick(NAMES), p.x, p.y, {
          isBot: true,
          team: i + 1,
          netId: `bot-${i}`,
        })
      );
    }
    return baseGame(arena, fighters, { mode: "solo", teamMode: false });
  }

  function createOnlineGame(players, modeId, fillBots) {
    const mode = MODES[modeId] || MODES.duel;
    const arena = makeArena();
    const byTeam = { 0: spawnPoints().filter((p) => p.team === 0), 1: spawnPoints().filter((p) => p.team === 1) };
    const ti = { 0: 0, 1: 0 };
    const fighters = [];
    const myId = net && net.peer ? net.peer.id : "local";

    for (const p of players) {
      const team = p.team;
      const sp = byTeam[team][ti[team]++] || { x: ARENA / 2, y: ARENA / 2 };
      const def = brawlerById(p.brawlerId);
      fighters.push(
        createFighter(def, p.name, sp.x, sp.y, {
          id: p.id,
          netId: p.id,
          isLocal: p.id === myId || (net && net.isHost && p.id === net.hostPlayerId),
          team,
        })
      );
    }

    if (fillBots) {
      for (let team = 0; team <= 1; team++) {
        while (fighters.filter((f) => f.team === team).length < mode.teamSize) {
          const sp = byTeam[team][ti[team]++] || { x: 200 + team * 800, y: ARENA / 2 };
          const def = pick(BRAWLERS);
          fighters.push(
            createFighter(def, `Бот ${pick(NAMES)}`, sp.x, sp.y, {
              isBot: true,
              team,
              netId: `bot-${team}-${ti[team]}`,
            })
          );
        }
      }
    }

    // Fix local flag: host's own player slot
    if (net) {
      const selfId = net.localPlayerId;
      for (const f of fighters) {
        f.isLocal = f.netId === selfId;
      }
    }

    return baseGame(arena, fighters, { mode: modeId, teamMode: true });
  }

  function baseGame(arena, fighters, meta) {
    const local = fighters.find((f) => f.isLocal) || fighters[0];
    return {
      arena,
      fighters,
      bullets: [],
      particles: [],
      cubes: [],
      mines: [],
      time: 0,
      ended: false,
      place: null,
      winTeam: null,
      mode: meta.mode,
      teamMode: meta.teamMode,
      keys: Object.create(null),
      mouse: { down: false, worldX: local.x, worldY: local.y },
      touchMove: { active: false, dx: 0, dy: 0 },
      touchFire: false,
      cam: { x: local.x, y: local.y },
      shake: 0,
      isHost: !net || net.isHost,
      online: !!net,
    };
  }

  function powerMul(f) {
    return 1 + f.power * 0.12;
  }

  function sameTeam(g, a, b) {
    return !!(g && g.teamMode && a && b && a.team === b.team);
  }

  function shoot(g, f) {
    if (!f.alive || f.reload > 0) return;
    const d = f.def;
    if (f.isLocal && CHEATS.infiniteAmmo) f.reload = 0.02;
    else f.reload = d.reload;
    const base = f.angle;
    const dmg =
      d.damage * powerMul(f) * (f.isLocal && CHEATS.infiniteDamage ? 1e9 : 1);

    if (d.healShot) {
      f.hp = Math.min(f.maxHp, f.hp + d.healShot * powerMul(f));
      spawnBurst(g, f.x, f.y, "#80ed99", 8);
    }

    if (d.meteor) {
      const ax = f.isLocal ? g.mouse.worldX : f.input.aimX;
      const ay = f.isLocal ? g.mouse.worldY : f.input.aimY;
      const mx = clamp(ax, 40, ARENA - 40);
      const my = clamp(ay, 40, ARENA - 40);
      spawnBurst(g, mx, my, d.color, 28);
      if (f.isLocal) g.shake = Math.max(g.shake, 12);
      for (const other of g.fighters) {
        if (!other.alive || other === f || sameTeam(g, f, other)) continue;
        if (dist(other, { x: mx, y: my }) < d.meteor) {
          hurt(g, other, dmg, f);
          if (d.freeze) other.slowT = Math.max(other.slowT, d.freeze);
        }
      }
      return;
    }

    if (d.laser) {
      const len = 1400;
      const x2 = f.x + Math.cos(base) * len;
      const y2 = f.y + Math.sin(base) * len;
      g.particles.push({
        x: f.x,
        y: f.y,
        vx: 0,
        vy: 0,
        life: 0.12,
        color: d.color,
        size: 2,
        laser: { x2, y2 },
      });
      for (const other of g.fighters) {
        if (!other.alive || other === f || sameTeam(g, f, other)) continue;
        if (pointNearSegment(other.x, other.y, f.x, f.y, x2, y2, other.r + 10)) {
          hurt(g, other, dmg, f);
          if (d.chain) chainLightning(g, f, other, dmg * 0.7, d.chain);
        }
      }
      return;
    }

    if (d.mine) {
      g.mines.push({
        x: f.x + Math.cos(base) * 40,
        y: f.y + Math.sin(base) * 40,
        r: 28,
        dmg,
        owner: f,
        life: 18,
        arm: 0.45,
        color: d.color,
      });
    }

    if (d.dash) {
      f.dashT = 0.22;
      f.invuln = 0.2;
      const distDash = d.dashDist || 170;
      const tx = f.x + Math.cos(base) * distDash;
      const ty = f.y + Math.sin(base) * distDash;
      spawnTrail(g, f.x, f.y, d.color);
      f.x = clamp(tx, f.r, ARENA - f.r);
      f.y = clamp(ty, f.r, ARENA - f.r);
      resolveWalls(f, g.arena.walls);
      for (const other of g.fighters) {
        if (!other.alive || other === f || sameTeam(g, f, other)) continue;
        if (dist(f, other) < f.r + other.r + 18) {
          hurt(g, other, dmg, f);
          applyKnock(g, other, f, d.knockback);
        }
      }
      if (!d.mine && d.bullets <= 1 && !d.ring) return;
    }

    const count = d.bullets;
    for (let i = 0; i < count; i++) {
      let a;
      if (d.ring) a = base + (i / count) * Math.PI * 2;
      else {
        const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * d.spread;
        a = base + offset;
      }
      g.bullets.push(makeBullet(f, d, a, dmg));
    }
  }

  function makeBullet(f, d, a, dmg) {
    return {
      x: f.x + Math.cos(a) * (f.r + 8),
      y: f.y + Math.sin(a) * (f.r + 8),
      vx: Math.cos(a) * d.bulletSpeed,
      vy: Math.sin(a) * d.bulletSpeed,
      life: 90,
      maxLife: 90,
      dmg,
      r: d.explosive ? 10 : 7,
      owner: f,
      ownerId: f.id,
      color: d.color,
      poison: d.poison || 0,
      explosive: d.explosive || 0,
      freeze: d.freeze || 0,
      pierce: d.pierce || 0,
      homing: !!d.homing,
      split: !!d.split,
      chain: d.chain || 0,
      knockback: d.knockback || 0,
      lifesteal: d.lifesteal || 0,
      bounces: 0,
      hitIds: [],
    };
  }

  function pointNearSegment(px, py, x1, y1, x2, y2, rad) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = clamp(t, 0, 1);
    const qx = x1 + t * dx;
    const qy = y1 + t * dy;
    return Math.hypot(px - qx, py - qy) <= rad;
  }

  function chainLightning(g, attacker, first, dmg, jumps) {
    let current = first;
    const hit = new Set([first.id]);
    for (let j = 0; j < jumps; j++) {
      let next = null;
      let bestD = 260;
      for (const other of g.fighters) {
        if (!other.alive || hit.has(other.id) || other === attacker || sameTeam(g, attacker, other)) continue;
        const d = dist(current, other);
        if (d < bestD) {
          bestD = d;
          next = other;
        }
      }
      if (!next) break;
      hit.add(next.id);
      spawnBurst(g, next.x, next.y, "#fee440", 6);
      hurt(g, next, dmg, attacker);
      current = next;
    }
  }

  function applyKnock(g, target, from, amount) {
    if (!amount || !target.alive) return;
    const a = ang(from, target);
    target.x += Math.cos(a) * amount * 0.35;
    target.y += Math.sin(a) * amount * 0.35;
    resolveWalls(target, g.arena.walls);
  }

  function ricochetBullet(g, b) {
    let bounced = false;

    if (b.x < b.r) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
      bounced = true;
    } else if (b.x > ARENA - b.r) {
      b.x = ARENA - b.r;
      b.vx = -Math.abs(b.vx);
      bounced = true;
    }
    if (b.y < b.r) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
      bounced = true;
    } else if (b.y > ARENA - b.r) {
      b.y = ARENA - b.r;
      b.vy = -Math.abs(b.vy);
      bounced = true;
    }

    for (const w of g.arena.walls) {
      if (!circleRectHit(b.x, b.y, b.r, w.x, w.y, w.w, w.h)) continue;
      const nx = clamp(b.x, w.x, w.x + w.w);
      const ny = clamp(b.y, w.y, w.y + w.h);
      const dx = b.x - nx;
      const dy = b.y - ny;
      if (Math.abs(dx) > Math.abs(dy)) {
        b.vx *= -1;
        b.x = dx >= 0 ? w.x + w.w + b.r + 0.5 : w.x - b.r - 0.5;
      } else {
        b.vy *= -1;
        b.y = dy >= 0 ? w.y + w.h + b.r + 0.5 : w.y - b.r - 0.5;
      }
      bounced = true;
    }

    if (bounced) {
      b.bounces = (b.bounces || 0) + 1;
      const speed = Math.hypot(b.vx, b.vy) || 1;
      const a = Math.atan2(b.vy, b.vx) + rand(-0.12, 0.12);
      b.vx = Math.cos(a) * speed;
      b.vy = Math.sin(a) * speed;
      spawnBurst(g, b.x, b.y, "#fff8e7", 4);
      if (b.split && b.bounces <= 3 && g.bullets.length < 80) {
        const a2 = a + 0.45;
        const a3 = a - 0.45;
        const child = (ang) => ({
          ...b,
          vx: Math.cos(ang) * speed * 0.92,
          vy: Math.sin(ang) * speed * 0.92,
          dmg: b.dmg * 0.7,
          split: false,
          pierce: 0,
          hitIds: [],
          life: Math.min(b.life, 40),
        });
        g.bullets.push(child(a2), child(a3));
      }
    }
  }

  function spawnTrail(g, x, y, color) {
    for (let i = 0; i < 10; i++) {
      g.particles.push({
        x,
        y,
        vx: rand(-80, 80),
        vy: rand(-80, 80),
        life: rand(0.2, 0.45),
        color,
        size: rand(3, 7),
      });
    }
  }

  function spawnBurst(g, x, y, color, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(60, 280);
      g.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.25, 0.6),
        color,
        size: rand(3, 8),
      });
    }
  }

  function hurt(g, target, amount, attacker, meta = {}) {
    if (!target.alive || target.invuln > 0) return;
    if (attacker && sameTeam(g, attacker, target)) return;
    if (target.isLocal && CHEATS.invincible) {
      target.hp = target.maxHp;
      return;
    }
    target.hp -= amount;
    target.flash = 0.12;
    if (meta.freeze) target.slowT = Math.max(target.slowT || 0, meta.freeze);
    if (attacker && meta.knockback) applyKnock(g, target, attacker, meta.knockback);
    if (attacker && meta.lifesteal && attacker.alive) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + amount * meta.lifesteal);
    }
    if (attacker && attacker.isLocal) g.shake = Math.max(g.shake, 5);
    spawnBurst(g, target.x, target.y, "#ff6b6b", 6);
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      spawnBurst(g, target.x, target.y, target.def.color, 24);
      if (attacker && attacker.alive) {
        attacker.kills += 1;
        dropCube(g, target.x, target.y, 1);
        if (attacker.isLocal) addCoins(20);
      }
      checkEnd(g);
    }
  }

  function dropCube(g, x, y, n) {
    for (let i = 0; i < n; i++) {
      g.cubes.push({
        x: x + rand(-20, 20),
        y: y + rand(-20, 20),
        life: 18,
        bob: rand(0, Math.PI * 2),
      });
    }
  }

  function checkEnd(g) {
    if (g.ended) return;
    if (g.teamMode) {
      const aliveTeams = new Set(g.fighters.filter((f) => f.alive).map((f) => f.team));
      if (aliveTeams.size <= 1) {
        g.ended = true;
        g.winTeam = aliveTeams.size ? [...aliveTeams][0] : null;
        const local = g.fighters.find((f) => f.isLocal);
        if (local && local.team === g.winTeam) {
          wins += 1;
          store.set("bravol-wins", wins);
          addCoins(80 + (local.kills || 0) * 15);
          if (local.kills > best) {
            best = local.kills;
            store.set("bravol-best", best);
          }
        } else if (local) {
          addCoins(20 + (local.kills || 0) * 10);
        }
      }
      return;
    }

    const alive = g.fighters.filter((f) => f.alive);
    const player = g.fighters.find((f) => f.isLocal);
    if (!player) return;
    if (!player.alive) {
      g.ended = true;
      g.place = g.fighters.filter((f) => f.alive).length + 1;
      addCoins(15 + player.kills * 10);
      return;
    }
    if (alive.length === 1 && alive[0].isLocal) {
      g.ended = true;
      g.place = 1;
      wins += 1;
      store.set("bravol-wins", wins);
      addCoins(60 + player.kills * 15);
      if (player.kills > best) {
        best = player.kills;
        store.set("bravol-best", best);
      }
    }
  }

  function lineBlocked(g, a, b) {
    const steps = 12;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      for (const w of g.arena.walls) {
        if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
      }
    }
    return false;
  }

  function inBush(g, f) {
    return g.arena.bushes.some((b) => dist(f, b) < b.r - 4);
  }

  function updateAI(g, f, dt) {
    const ai = f.ai;
    ai.changeT -= dt;
    let tx = f.x + Math.cos(ai.roamAngle) * 100;
    let ty = f.y + Math.sin(ai.roamAngle) * 100;
    let target = null;
    let bestD = Infinity;

    for (const other of g.fighters) {
      if (!other.alive || other === f || sameTeam(g, f, other)) continue;
      if (inBush(g, other) && dist(f, other) > 160) continue;
      const d = dist(f, other);
      if (d < bestD && !lineBlocked(g, f, other)) {
        bestD = d;
        target = other;
      }
    }

    const nearCube = g.cubes.find((c) => dist(f, c) < 280);
    if (nearCube && (!target || bestD > 320)) {
      tx = nearCube.x;
      ty = nearCube.y;
    } else if (target) {
      const preferred = f.def.range * 0.65;
      if (bestD > preferred) {
        tx = target.x;
        ty = target.y;
      } else if (bestD < preferred * 0.45) {
        tx = f.x - (target.x - f.x);
        ty = f.y - (target.y - f.y);
      } else {
        tx = target.x + Math.cos(ai.roamAngle) * 80;
        ty = target.y + Math.sin(ai.roamAngle) * 80;
      }
      f.angle = ang(f, target);
      if (bestD < f.def.range * 1.05 && g.time > 1.5 && Math.random() < 0.035 * ai.aggression) {
        shoot(g, f);
      }
    } else if (ai.changeT <= 0) {
      ai.roamAngle = rand(0, Math.PI * 2);
      ai.changeT = rand(0.6, 2.2);
    }

    const dx = tx - f.x;
    const dy = ty - f.y;
    const len = Math.hypot(dx, dy) || 1;
    const slow = f.slowT > 0 ? 0.45 : 1;
    const spd = f.def.speed * (0.85 + f.power * 0.04) * slow;
    f.x += (dx / len) * spd * dt;
    f.y += (dy / len) * spd * dt;
    if (!target) f.angle = Math.atan2(dy, dx);
  }

  function applyInputToFighter(g, f, dt) {
    const inp = f.input;
    let mx = inp.mx;
    let my = inp.my;
    const len = Math.hypot(mx, my);
    if (len > 0) {
      const slow = f.slowT > 0 ? 0.45 : 1;
      const flyMul = f.isLocal && CHEATS.fly ? 3.2 : 1;
      const spd = f.def.speed * (1 + f.power * 0.05) * slow * flyMul;
      f.x += (mx / len) * spd * dt;
      f.y += (my / len) * spd * dt;
    }
    f.angle = Math.atan2(inp.aimY - f.y, inp.aimX - f.x);
    if (inp.shoot) shoot(g, f);
  }

  function collectLocalInput(g) {
    const f = g.fighters.find((x) => x.isLocal);
    if (!f || !f.alive) return null;
    let mx = 0;
    let my = 0;
    if (g.keys["KeyW"] || g.keys["ArrowUp"]) my -= 1;
    if (g.keys["KeyS"] || g.keys["ArrowDown"]) my += 1;
    if (g.keys["KeyA"] || g.keys["ArrowLeft"]) mx -= 1;
    if (g.keys["KeyD"] || g.keys["ArrowRight"]) mx += 1;
    if (g.touchMove.active) {
      mx += g.touchMove.dx;
      my += g.touchMove.dy;
    }
    return {
      mx,
      my,
      aimX: g.mouse.worldX,
      aimY: g.mouse.worldY,
      shoot: !!(g.mouse.down || g.keys["Space"] || g.touchFire),
    };
  }

  function update(g, dt) {
    if (g.ended) {
      g.particles.forEach((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });
      g.particles = g.particles.filter((p) => p.life > 0);
      return;
    }

    // Non-host online clients only interpolate camera / wait for snapshots
    if (g.online && !g.isHost) {
      const localInp = collectLocalInput(g);
      if (localInp && net) net.sendInput(localInp);
      const local = g.fighters.find((f) => f.isLocal);
      const camTarget = local && local.alive ? local : g.fighters.find((f) => f.alive && f.team === (local && local.team));
      if (camTarget) {
        g.cam.x += (camTarget.x - g.cam.x) * Math.min(1, 8 * dt);
        g.cam.y += (camTarget.y - g.cam.y) * Math.min(1, 8 * dt);
      }
      g.particles.forEach((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });
      g.particles = g.particles.filter((p) => p.life > 0);
      return;
    }

    g.time += dt;
    g.shake = Math.max(0, g.shake - dt * 18);

    const localInp = collectLocalInput(g);
    if (localInp) {
      const local = g.fighters.find((f) => f.isLocal);
      if (local) local.input = localInp;
    }

    for (const f of g.fighters) {
      if (!f.alive) continue;
      f.reload = Math.max(0, f.reload - dt);
      f.flash = Math.max(0, f.flash - dt);
      f.invuln = Math.max(0, f.invuln - dt);
      f.dashT = Math.max(0, f.dashT - dt);
      f.slowT = Math.max(0, f.slowT - dt);
      if (f.poisonT > 0) {
        f.poisonT -= dt;
        if (f.isLocal && CHEATS.invincible) {
          f.hp = f.maxHp;
        } else {
          f.hp -= 35 * dt;
          if (f.hp <= 0) {
            f.hp = 0;
            f.alive = false;
            spawnBurst(g, f.x, f.y, f.def.color, 24);
            checkEnd(g);
            continue;
          }
        }
      }
      if (f.isBot) updateAI(g, f, dt);
      else applyInputToFighter(g, f, dt);
      resolveWalls(f, g.arena.walls);

      for (const other of g.fighters) {
        if (!other.alive || other === f) continue;
        const d = dist(f, other);
        const min = f.r + other.r;
        if (d < min && d > 0) {
          const push = (min - d) / 2;
          const nx = (f.x - other.x) / d;
          const ny = (f.y - other.y) / d;
          f.x += nx * push;
          f.y += ny * push;
          other.x -= nx * push;
          other.y -= ny * push;
        }
      }
    }

    for (const b of g.bullets) {
      if (b.homing) {
        let target = null;
        let bestD = 520;
        for (const f of g.fighters) {
          if (!f.alive || f === b.owner || (b.owner && sameTeam(g, b.owner, f))) continue;
          if (b.hitIds && b.hitIds.includes(f.id)) continue;
          const d = dist(b, f);
          if (d < bestD) {
            bestD = d;
            target = f;
          }
        }
        if (target) {
          const desired = ang(b, target);
          const cur = Math.atan2(b.vy, b.vx);
          let diff = desired - cur;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turn = clamp(diff, -4 * dt, 4 * dt);
          const speed = Math.hypot(b.vx, b.vy) || 400;
          const na = cur + turn;
          b.vx = Math.cos(na) * speed;
          b.vy = Math.sin(na) * speed;
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      const touchingWall =
        b.x < b.r ||
        b.y < b.r ||
        b.x > ARENA - b.r ||
        b.y > ARENA - b.r ||
        g.arena.walls.some((w) => circleRectHit(b.x, b.y, b.r, w.x, w.y, w.w, w.h));
      if (touchingWall) ricochetBullet(g, b);

      let hitSomeone = false;
      for (const f of g.fighters) {
        if (!f.alive || f === b.owner || (b.owner && sameTeam(g, b.owner, f))) continue;
        if (b.hitIds && b.hitIds.includes(f.id)) continue;
        if (dist(b, f) < f.r + b.r) {
          hurt(g, f, b.dmg, b.owner, {
            freeze: b.freeze,
            knockback: b.knockback,
            lifesteal: b.lifesteal,
          });
          if (b.poison) f.poisonT = Math.max(f.poisonT, 2.2);
          if (b.chain && b.owner) chainLightning(g, b.owner, f, b.dmg * 0.65, b.chain);
          if (b.explosive) explode(g, b);
          if (b.pierce > 0) {
            b.pierce -= 1;
            if (!b.hitIds) b.hitIds = [];
            b.hitIds.push(f.id);
          } else {
            b.life = 0;
            hitSomeone = true;
          }
          break;
        }
      }
      if (hitSomeone || b.life <= 0) continue;

      for (const box of g.arena.boxes) {
        if (box.open) continue;
        if (dist(b, box) < 28) {
          box.open = true;
          dropCube(g, box.x, box.y, 1);
          spawnBurst(g, box.x, box.y, "#ffd23f", 10);
          break;
        }
      }
    }
    g.bullets = g.bullets.filter((b) => b.life > 0);

    for (const m of g.mines) {
      m.life -= dt;
      m.arm = Math.max(0, m.arm - dt);
      if (m.arm > 0 || m.life <= 0) continue;
      for (const f of g.fighters) {
        if (!f.alive || f === m.owner || sameTeam(g, m.owner, f)) continue;
        if (dist(f, m) < m.r + f.r) {
          hurt(g, f, m.dmg, m.owner);
          spawnBurst(g, m.x, m.y, m.color, 16);
          m.life = 0;
          break;
        }
      }
    }
    g.mines = g.mines.filter((m) => m.life > 0);

    for (const c of g.cubes) {
      c.bob += dt * 4;
      c.life -= dt;
      for (const f of g.fighters) {
        if (!f.alive) continue;
        if (dist(f, c) < f.r + 18) {
          f.power = Math.min(8, f.power + 1);
          f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.08);
          c.life = 0;
          spawnBurst(g, c.x, c.y, "#7dffb0", 8);
          break;
        }
      }
    }
    g.cubes = g.cubes.filter((c) => c.life > 0);

    for (const p of g.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    g.particles = g.particles.filter((p) => p.life > 0);

    const local = g.fighters.find((f) => f.isLocal);
    const camTarget = local && local.alive ? local : g.fighters.find((f) => f.alive);
    if (camTarget) {
      g.cam.x += (camTarget.x - g.cam.x) * Math.min(1, 8 * dt);
      g.cam.y += (camTarget.y - g.cam.y) * Math.min(1, 8 * dt);
    }

    if (g.online && g.isHost && net) net.broadcastState(serializeState(g));
  }

  function explode(g, b) {
    spawnBurst(g, b.x, b.y, b.color, 20);
    if (b.owner && b.owner.isLocal) g.shake = Math.max(g.shake, 10);
    for (const f of g.fighters) {
      if (!f.alive || f === b.owner || (b.owner && sameTeam(g, b.owner, f))) continue;
      const d = dist(b, f);
      if (d < b.explosive) {
        hurt(g, f, b.dmg * 0.55 * (1 - d / b.explosive), b.owner);
      }
    }
  }

  function serializeState(g) {
    return {
      t: g.time,
      ended: g.ended,
      place: g.place,
      winTeam: g.winTeam,
      F: g.fighters.map((f) => [
        f.id,
        Math.round(f.x),
        Math.round(f.y),
        Math.round(f.hp),
        +f.angle.toFixed(2),
        f.alive ? 1 : 0,
        f.power,
        f.kills,
        f.defId,
        f.team,
        f.name,
      ]),
      B: g.bullets.map((b) => [
        Math.round(b.x),
        Math.round(b.y),
        Math.round(b.vx),
        Math.round(b.vy),
        +b.life.toFixed(2),
        b.color,
        b.r,
      ]),
      C: g.cubes.map((c) => [Math.round(c.x), Math.round(c.y)]),
      X: g.arena.boxes.map((b) => (b.open ? 1 : 0)),
    };
  }

  function applyState(g, s) {
    g.time = s.t;
    g.ended = s.ended;
    g.place = s.place;
    g.winTeam = s.winTeam;
    const byId = new Map(g.fighters.map((f) => [f.id, f]));
    for (const row of s.F) {
      let f = byId.get(row[0]);
      if (!f) {
        const def = brawlerById(row[8]);
        f = createFighter(def, row[10], row[1], row[2], {
          id: row[0],
          netId: row[0],
          team: row[9],
          isLocal: net && row[0] === net.localPlayerId,
        });
        g.fighters.push(f);
        byId.set(f.id, f);
      }
      f.x = row[1];
      f.y = row[2];
      f.hp = row[3];
      f.angle = row[4];
      f.alive = !!row[5];
      f.power = row[6];
      f.kills = row[7];
      f.isLocal = net && f.id === net.localPlayerId;
    }
    g.bullets = (s.B || []).map((b) => ({
      x: b[0],
      y: b[1],
      vx: b[2],
      vy: b[3],
      life: b[4],
      color: b[5],
      r: b[6],
      owner: null,
      dmg: 0,
      poison: 0,
      explosive: 0,
    }));
    g.cubes = (s.C || []).map((c) => ({ x: c[0], y: c[1], life: 10, bob: 0 }));
    if (s.X) {
      s.X.forEach((open, i) => {
        if (g.arena.boxes[i]) g.arena.boxes[i].open = !!open;
      });
    }
    const local = g.fighters.find((f) => f.isLocal);
    if (local) {
      local.hp = local.maxHp;
      local.alive = true;
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function draw(g, canvas, ctx) {
    const w = canvas.width;
    const h = canvas.height;
    const s = Math.min(w, h) / 900;
    const shakeX = g.shake ? rand(-g.shake, g.shake) : 0;
    const shakeY = g.shake ? rand(-g.shake, g.shake) : 0;
    const ox = w / 2 - g.cam.x * s + shakeX;
    const oy = h / 2 - g.cam.y * s + shakeY;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a1620";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);

    const grd = ctx.createLinearGradient(0, 0, ARENA, ARENA);
    grd.addColorStop(0, "#1a6b45");
    grd.addColorStop(0.5, "#218c58");
    grd.addColorStop(1, "#176340");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, ARENA, ARENA);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= ARENA; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, ARENA);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(ARENA, i);
      ctx.stroke();
    }

    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, ARENA - 8, ARENA - 8);

    for (const wll of g.arena.walls) {
      ctx.fillStyle = "#3d2c1e";
      roundRect(ctx, wll.x, wll.y, wll.w, wll.h, 8);
      ctx.fill();
      ctx.fillStyle = "#5c4330";
      roundRect(ctx, wll.x + 4, wll.y + 4, wll.w - 8, Math.max(8, wll.h * 0.35), 6);
      ctx.fill();
    }

    for (const box of g.arena.boxes) {
      if (box.open) continue;
      ctx.fillStyle = "#c47a00";
      roundRect(ctx, box.x - 18, box.y - 18, 36, 36, 6);
      ctx.fill();
      ctx.fillStyle = "#ffd23f";
      ctx.font = "900 18px Nunito";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("■", box.x, box.y);
    }

    for (const c of g.cubes) {
      const bob = Math.sin(c.bob) * 4;
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#7dffb0";
      ctx.shadowColor = "#7dffb0";
      ctx.shadowBlur = 12;
      ctx.fillRect(-10, -10, 20, 20);
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    for (const m of g.mines || []) {
      ctx.beginPath();
      ctx.fillStyle = m.arm > 0 ? "#888" : m.color;
      ctx.arc(m.x, m.y, m.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const b of g.bullets) {
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const local = g.fighters.find((f) => f.isLocal);
    for (const f of g.fighters) {
      if (!f.alive) continue;
      const hidden =
        inBush(g, f) &&
        local &&
        !f.isLocal &&
        !(g.teamMode && f.team === local.team) &&
        dist(local, f) > 150;
      if (hidden) continue;

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(f.x, f.y + f.r * 0.7, f.r * 0.9, f.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = f.flash > 0 ? "#fff" : f.def.color;
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      const ring = f.isLocal ? "#ffd23f" : g.teamMode ? (f.team === 0 ? "#ffd23f" : "#1ec8b0") : "rgba(0,0,0,0.35)";
      ctx.strokeStyle = ring;
      ctx.lineWidth = f.isLocal ? 4 : 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 4;
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + Math.cos(f.angle) * (f.r + 14), f.y + Math.sin(f.angle) * (f.r + 14));
      ctx.stroke();

      ctx.font = `${f.r * 1.35}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(f.def.emoji, f.x, f.y + 1);

      const bw = 48;
      const ratio = f.hp / f.maxHp;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundRect(ctx, f.x - bw / 2, f.y - f.r - 16, bw, 7, 4);
      ctx.fill();
      ctx.fillStyle = ratio < 0.3 ? "#ff4d4d" : f.isLocal ? "#1ec8b0" : g.teamMode && f.team === 1 ? "#1ec8b0" : "#ffd23f";
      roundRect(ctx, f.x - bw / 2, f.y - f.r - 16, bw * ratio, 7, 4);
      ctx.fill();

      if (f.power > 0) {
        ctx.fillStyle = "#7dffb0";
        ctx.font = "900 12px Nunito";
        ctx.fillText(`×${f.power}`, f.x, f.y - f.r - 24);
      }

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.font = "800 11px Nunito";
      ctx.fillText(f.name, f.x, f.y + f.r + 14);
    }

    for (const bush of g.arena.bushes) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(20, 110, 55, 0.72)";
      ctx.arc(bush.x, bush.y, bush.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "rgba(40, 160, 80, 0.45)";
      ctx.arc(bush.x - 10, bush.y - 8, bush.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of g.particles) {
      if (p.laser) {
        ctx.globalAlpha = clamp(p.life * 8, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 6;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.laser.x2, p.laser.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function screenToWorld(g, canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const s = Math.min(canvas.width, canvas.height) / 900;
    const ox = canvas.width / 2 - g.cam.x * s;
    const oy = canvas.height / 2 - g.cam.y * s;
    return { x: (x - ox) / s, y: (y - oy) / s };
  }

  /* ===================== NETWORK ===================== */

  function destroyNet() {
    if (net) {
      net.destroy();
      net = null;
    }
  }

  function createNetHost(code, modeId) {
    return new Promise((resolve, reject) => {
      if (typeof Peer === "undefined") {
        reject(new Error("PeerJS не загрузился. Проверь интернет."));
        return;
      }
      const peer = new Peer(peerIdFromCode(code), { debug: 0 });
      const connections = new Map();
      const api = {
        isHost: true,
        peer,
        code,
        localPlayerId: null,
        connections,
        destroy() {
          connections.forEach((c) => c.close());
          peer.destroy();
        },
        broadcast(msg) {
          const data = JSON.stringify(msg);
          connections.forEach((c) => {
            if (c.open) c.send(data);
          });
        },
        broadcastState(state) {
          api.broadcast({ type: "state", state });
        },
        sendInput() {},
        sendTo(id, msg) {
          const c = connections.get(id);
          if (c && c.open) c.send(JSON.stringify(msg));
        },
      };

      peer.on("open", (id) => {
        api.localPlayerId = id;
        resolve(api);
      });
      peer.on("error", (err) => reject(err));
      peer.on("connection", (conn) => {
        conn.on("open", () => {
          connections.set(conn.peer, conn);
          if (lobby) {
            api.sendTo(conn.peer, { type: "lobby", lobby: publicLobby() });
          }
        });
        conn.on("data", (raw) => handleHostMessage(conn.peer, raw));
        conn.on("close", () => {
          connections.delete(conn.peer);
          if (lobby) {
            lobby.players = lobby.players.filter((p) => p.id !== conn.peer);
            syncLobby();
          }
        });
      });

      net = api;
    });
  }

  function createNetClient(code) {
    return new Promise((resolve, reject) => {
      if (typeof Peer === "undefined") {
        reject(new Error("PeerJS не загрузился. Проверь интернет."));
        return;
      }
      const peer = new Peer({ debug: 0 });
      let hostConn = null;
      const api = {
        isHost: false,
        peer,
        code,
        localPlayerId: null,
        destroy() {
          if (hostConn) hostConn.close();
          peer.destroy();
        },
        broadcast() {},
        broadcastState() {},
        sendInput(inp) {
          if (hostConn && hostConn.open) {
            hostConn.send(JSON.stringify({ type: "input", input: inp }));
          }
        },
        send(msg) {
          if (hostConn && hostConn.open) hostConn.send(JSON.stringify(msg));
        },
      };

      peer.on("open", (id) => {
        api.localPlayerId = id;
        hostConn = peer.connect(peerIdFromCode(code), { reliable: true });
        hostConn.on("open", () => {
          api.send({
            type: "join",
            name: nickname,
            brawlerId: selectedId,
            team: null,
          });
          resolve(api);
        });
        hostConn.on("data", (raw) => handleClientMessage(raw));
        hostConn.on("close", () => {
          setLobbyStatus("Хост отключился", true);
        });
        hostConn.on("error", (err) => reject(err));
      });
      peer.on("error", (err) => reject(err));
      net = api;
    });
  }

  function handleHostMessage(peerId, raw) {
    let msg;
    try {
      msg = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return;
    }
    if (!lobby) return;

    if (msg.type === "join") {
      const mode = MODES[lobby.mode];
      if (lobby.players.length >= mode.max) {
        net.sendTo(peerId, { type: "err", text: "Комната полна" });
        return;
      }
      if (lobby.players.some((p) => p.id === peerId)) return;
      const team = pickTeam(lobby);
      lobby.players.push({
        id: peerId,
        name: sanitizeName(msg.name),
        brawlerId: msg.brawlerId || "blaze",
        team,
        ready: false,
      });
      syncLobby();
    }

    if (msg.type === "update") {
      const p = lobby.players.find((x) => x.id === peerId);
      if (!p) return;
      if (msg.name) p.name = sanitizeName(msg.name);
      if (msg.brawlerId) p.brawlerId = msg.brawlerId;
      if (msg.team === 0 || msg.team === 1) {
        const mode = MODES[lobby.mode];
        const count = lobby.players.filter((x) => x.team === msg.team && x.id !== peerId).length;
        if (count < mode.teamSize) p.team = msg.team;
      }
      if (typeof msg.ready === "boolean") p.ready = msg.ready;
      syncLobby();
    }

    if (msg.type === "input" && game && game.isHost) {
      const f = game.fighters.find((x) => x.netId === peerId || x.id === peerId);
      if (f && msg.input) f.input = msg.input;
    }
  }

  function handleClientMessage(raw) {
    let msg;
    try {
      msg = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return;
    }
    if (msg.type === "lobby") {
      lobby = msg.lobby;
      renderLobby();
    }
    if (msg.type === "err") setLobbyStatus(msg.text, true);
    if (msg.type === "start") {
      beginOnlineMatch(msg.players, msg.mode, msg.fillBots);
    }
    if (msg.type === "state" && game && !game.isHost) {
      applyState(game, msg.state);
    }
  }

  function sanitizeName(n) {
    return String(n || "Герой").slice(0, 14).trim() || "Герой";
  }

  function pickTeam(lob) {
    const mode = MODES[lob.mode];
    const c0 = lob.players.filter((p) => p.team === 0).length;
    const c1 = lob.players.filter((p) => p.team === 1).length;
    if (c0 < mode.teamSize && c0 <= c1) return 0;
    if (c1 < mode.teamSize) return 1;
    return c0 <= c1 ? 0 : 1;
  }

  function publicLobby() {
    return {
      code: lobby.code,
      mode: lobby.mode,
      fillBots: lobby.fillBots,
      players: lobby.players.map((p) => ({ ...p })),
      hostId: lobby.hostId,
    };
  }

  function syncLobby() {
    if (!lobby) return;
    if (net && net.isHost) net.broadcast({ type: "lobby", lobby: publicLobby() });
    renderLobby();
  }

  /* ===================== UI ===================== */

  function renderMenu() {
    destroyNet();
    lobby = null;
    ensureSelectedValid();
    const unlockedCount = unlocked.size;
    app.innerHTML = `
      <section class="screen active" id="screen-menu">
        <div class="menu-bg"></div>
        <div class="menu-panel">
          <h1 class="brand">BRAVOL STARS</h1>
          <p class="tagline">Соло, комнаты по коду и командные бои из любой точки</p>
          <div class="coin-bar">
            <span class="coin-pill">✦ ${coins} ${COIN_NAME}</span>
            <span class="coin-pill soft">Бойцы: ${unlockedCount}/${BRAWLERS.length}</span>
          </div>
          <div class="brawler-grid scroll-grid">
            ${BRAWLERS.map((b) => {
              const open = isUnlocked(b.id);
              return `
              <button class="brawler-card ${b.id === selectedId ? "selected" : ""} ${open ? "" : "locked"}" data-id="${b.id}" type="button" ${open ? "" : "title=\"Открой сундук\""}>
                <div class="brawler-emoji">${open ? b.emoji : "🔒"}</div>
                <h3>${open ? b.name : "???"}</h3>
                <p>${open ? b.desc : "Закрыт — открой сундук"}</p>
                <span class="role-tag">${open ? b.ability || b.role : "Сундук"}</span>
              </button>`;
            }).join("")}
          </div>
          <div class="field-row">
            <input id="nick-input" maxlength="14" value="${escapeAttr(nickname)}" placeholder="Твой ник" />
          </div>
          <div class="menu-actions">
            <button class="btn" id="btn-solo" type="button">▶ Соло vs боты</button>
            <button class="btn secondary" id="btn-online" type="button">Онлайн-комната</button>
            <button class="btn ghost" id="btn-chest" type="button">🎁 Сундук (${CHEST_COST}✦)</button>
            <button class="btn ghost" id="btn-howto" type="button">Как играть</button>
          </div>
          <p class="tagline" style="margin-top:18px;opacity:.75">Побед: ${wins} · Лучшие убийства: ${best}</p>
          ${
            isOwnerNow()
              ? `<p class="tagline" style="margin-top:8px;color:#7dffb0">Твой режим: все бойцы · ✦999999 · читы в бою</p>`
              : ""
          }
        </div>
      </section>
    `;

    app.querySelectorAll(".brawler-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (!isUnlocked(id)) {
          renderChest("Сначала открой сундук, чтобы получить этого бойца");
          return;
        }
        selectedId = id;
        store.set("bravol-brawler", selectedId);
        renderMenu();
      });
    });
    const nick = app.querySelector("#nick-input");
    nick.addEventListener("change", () => {
      nickname = sanitizeName(nick.value);
      store.set("bravol-nick", nickname);
    });
    app.querySelector("#btn-solo").addEventListener("click", () => {
      nickname = sanitizeName(nick.value);
      store.set("bravol-nick", nickname);
      startSoloMatch();
    });
    app.querySelector("#btn-online").addEventListener("click", () => {
      nickname = sanitizeName(nick.value);
      store.set("bravol-nick", nickname);
      renderOnlineSetup();
    });
    app.querySelector("#btn-chest").addEventListener("click", () => renderChest());
    app.querySelector("#btn-howto").addEventListener("click", renderHowto);
  }

  function renderChest(notice) {
    const pool = lockedPool();
    app.innerHTML = `
      <section class="screen active">
        <div class="menu-bg"></div>
        <div class="online-panel chest-panel">
          <h2>Сундук бойцов</h2>
          <p class="room-hint">Трать <b>${COIN_NAME}</b> за победы и убийства. Сундук открывает случайного закрытого бойца с уникальной способностью.</p>
          <div class="coin-bar" style="justify-content:center;margin-bottom:12px">
            <span class="coin-pill">✦ ${coins} ${COIN_NAME}</span>
            <span class="coin-pill soft">Закрыто: ${pool.length}</span>
          </div>
          <div class="chest-visual" id="chest-visual">🎁</div>
          <p class="status-line ${notice ? "error" : ""}" id="chest-status">${notice || `Стоимость: ${CHEST_COST} ✦`}</p>
          <div class="menu-actions">
            <button class="btn" id="btn-open" type="button" ${coins < CHEST_COST && pool.length ? "disabled" : ""}>
              ${pool.length ? `Открыть за ${CHEST_COST}✦` : "Все бойцы открыты"}
            </button>
            <button class="btn ghost" id="btn-back" type="button">Назад</button>
          </div>
        </div>
      </section>
    `;

    app.querySelector("#btn-back").addEventListener("click", renderMenu);
    const openBtn = app.querySelector("#btn-open");
    openBtn.addEventListener("click", () => {
      if (!pool.length) {
        addCoins(40);
        renderChest("Все уже открыты — получено 40✦ утешительных");
        return;
      }
      if (coins < CHEST_COST) {
        renderChest("Не хватает Браволов. Побеждай в боях!");
        return;
      }
      addCoins(-CHEST_COST);
      const reward = pick(pool);
      unlocked.add(reward.id);
      saveUnlocks();
      selectedId = reward.id;
      store.set("bravol-brawler", selectedId);
      const vis = app.querySelector("#chest-visual");
      const st = app.querySelector("#chest-status");
      vis.textContent = reward.emoji;
      vis.classList.add("reveal");
      st.classList.remove("error");
      st.innerHTML = `Выпал <b>${reward.name}</b> — ${reward.ability || reward.desc}`;
      openBtn.textContent = "Ещё сундук";
      openBtn.disabled = coins < CHEST_COST && lockedPool().length > 0;
    });
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function renderHowto() {
    app.innerHTML = `
      <section class="screen active">
        <div class="menu-bg"></div>
        <div class="howto">
          <h2>Как играть</h2>
          <ol>
            <li><b>WASD</b> — движение, <b>мышь + ЛКМ</b> — прицел и выстрел</li>
            <li><b>${COIN_NAME} (✦)</b> — валюта: +за убийства и победы</li>
            <li><b>Сундук</b> за ${CHEST_COST}✦ открывает случайного бойца со своей способностью</li>
            <li><b>Онлайн</b>: создай комнату, скинь код друзьям (1v1 / 2v2 / 3v3)</li>
            <li>В лобби выбери сторону и открытого бойца, нажми «Готов»</li>
            <li>Своих не атакуешь — побеждает команда, которая осталась</li>
          </ol>
          <div class="menu-actions">
            <button class="btn" id="btn-back" type="button">Назад</button>
          </div>
        </div>
      </section>
    `;
    app.querySelector("#btn-back").addEventListener("click", renderMenu);
  }

  function renderOnlineSetup() {
    destroyNet();
    lobby = null;
    let mode = "twovtwo";
    app.innerHTML = `
      <section class="screen active">
        <div class="menu-bg"></div>
        <div class="online-panel">
          <h2>Онлайн-комната</h2>
          <p class="room-hint">Создай комнату или войди по коду из любой точки мира</p>
          <div class="mode-row" id="mode-row">
            ${Object.values(MODES)
              .map(
                (m) =>
                  `<button type="button" class="mode-btn ${m.id === mode ? "active" : ""}" data-mode="${m.id}">${m.label}</button>`
              )
              .join("")}
          </div>
          <div class="field-row">
            <input id="join-code" maxlength="6" placeholder="Код комнаты" style="text-transform:uppercase;letter-spacing:.12em;text-align:center" />
          </div>
          <p class="status-line" id="net-status"></p>
          <div class="menu-actions">
            <button class="btn" id="btn-create" type="button">Создать комнату</button>
            <button class="btn secondary" id="btn-join" type="button">Войти по коду</button>
            <button class="btn ghost" id="btn-back" type="button">Назад</button>
          </div>
        </div>
      </section>
    `;

    const status = app.querySelector("#net-status");
    app.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        app.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
      });
    });
    app.querySelector("#btn-back").addEventListener("click", renderMenu);
    app.querySelector("#btn-create").addEventListener("click", async () => {
      const code = makeCode();
      status.textContent = "Создаём комнату…";
      status.classList.remove("error");
      try {
        await createNetHost(code, mode);
        lobby = {
          code,
          mode,
          fillBots: true,
          hostId: net.localPlayerId,
          players: [
            {
              id: net.localPlayerId,
              name: nickname,
              brawlerId: selectedId,
              team: 0,
              ready: true,
            },
          ],
        };
        renderLobby();
      } catch (e) {
        status.textContent = e.message || "Не удалось создать комнату";
        status.classList.add("error");
        destroyNet();
      }
    });
    app.querySelector("#btn-join").addEventListener("click", async () => {
      const code = app.querySelector("#join-code").value.trim().toUpperCase();
      if (code.length < 4) {
        status.textContent = "Введи код комнаты";
        status.classList.add("error");
        return;
      }
      status.textContent = "Подключаемся…";
      status.classList.remove("error");
      try {
        await createNetClient(code);
        lobby = { code, mode: "duel", fillBots: true, hostId: null, players: [] };
        setLobbyStatus("Ждём данные лобби…");
        renderLobby();
      } catch (e) {
        status.textContent = e.message || "Комната не найдена";
        status.classList.add("error");
        destroyNet();
      }
    });
  }

  function setLobbyStatus(text, isError) {
    const el = document.getElementById("lobby-status");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("error", !!isError);
  }

  function renderLobby() {
    if (!lobby) return;
    const mode = MODES[lobby.mode] || MODES.duel;
    const isHost = net && net.isHost;
    const me = lobby.players.find((p) => net && p.id === net.localPlayerId);

    app.innerHTML = `
      <section class="screen active">
        <div class="menu-bg"></div>
        <div class="online-panel">
          <h2>Комната</h2>
          <div class="room-code" id="room-code">${lobby.code}</div>
          <p class="room-hint">${mode.label} · скинь код друзьям
            <button type="button" class="btn ghost" id="btn-copy" style="padding:6px 10px;font-size:.75rem;margin-left:8px">Копировать</button>
            <span class="copy-ok" id="copy-ok"></span>
          </p>
          <div class="teams">
            <div class="team-col alpha">
              <h3>Альфа (жёлтые)</h3>
              ${teamSlots(0, mode.teamSize)}
            </div>
            <div class="team-col bravo">
              <h3>Браво (бирюза)</h3>
              ${teamSlots(1, mode.teamSize)}
            </div>
          </div>
          <div class="brawler-grid" style="margin-bottom:12px">
            ${BRAWLERS.filter((b) => isUnlocked(b.id))
              .map(
                (b) => `
              <button class="brawler-card ${me && me.brawlerId === b.id ? "selected" : ""}" data-id="${b.id}" type="button">
                <div class="brawler-emoji">${b.emoji}</div>
                <h3>${b.name}</h3>
                <p style="font-size:.65rem">${b.ability || b.role}</p>
              </button>`
              )
              .join("")}
          </div>
          <p class="status-line" id="lobby-status"></p>
          <div class="menu-actions">
            <button class="btn ghost" id="btn-team0" type="button">В Альфу</button>
            <button class="btn ghost" id="btn-team1" type="button">В Браво</button>
            <button class="btn secondary" id="btn-ready" type="button">${me && me.ready ? "Не готов" : "Готов"}</button>
            ${
              isHost
                ? `<label style="display:flex;align-items:center;gap:6px;font-weight:800;font-size:.85rem">
                    <input type="checkbox" id="fill-bots" ${lobby.fillBots ? "checked" : ""}/> Добить ботами
                   </label>
                   <button class="btn" id="btn-start" type="button">Старт</button>`
                : ""
            }
            <button class="btn ghost" id="btn-leave" type="button">Выйти</button>
          </div>
        </div>
      </section>
    `;

    function teamSlots(team, size) {
      const list = lobby.players.filter((p) => p.team === team);
      let html = "";
      for (let i = 0; i < size; i++) {
        const p = list[i];
        if (!p) {
          html += `<div class="slot empty">Свободно</div>`;
        } else {
          const b = brawlerById(p.brawlerId);
          const hostMark = p.id === lobby.hostId ? " ★" : "";
          html += `<div class="slot ${p.ready ? "ready" : ""}">${b.emoji} ${escapeAttr(p.name)}${hostMark}<span class="ready-dot"></span></div>`;
        }
      }
      return html;
    }

    app.querySelector("#btn-copy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(lobby.code);
        app.querySelector("#copy-ok").textContent = "скопировано";
      } catch {
        app.querySelector("#copy-ok").textContent = lobby.code;
      }
    });

    app.querySelectorAll(".brawler-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedId = btn.dataset.id;
        store.set("bravol-brawler", selectedId);
        updateMe({ brawlerId: selectedId });
      });
    });

    app.querySelector("#btn-team0").addEventListener("click", () => updateMe({ team: 0 }));
    app.querySelector("#btn-team1").addEventListener("click", () => updateMe({ team: 1 }));
    app.querySelector("#btn-ready").addEventListener("click", () => {
      if (!me) return;
      updateMe({ ready: !me.ready });
    });
    app.querySelector("#btn-leave").addEventListener("click", () => {
      destroyNet();
      lobby = null;
      renderMenu();
    });

    if (isHost) {
      app.querySelector("#fill-bots").addEventListener("change", (e) => {
        lobby.fillBots = e.target.checked;
        syncLobby();
      });
      app.querySelector("#btn-start").addEventListener("click", () => {
        const modeCfg = MODES[lobby.mode];
        const humans = lobby.players.length;
        if (humans < 1) return;
        if (!lobby.fillBots) {
          const c0 = lobby.players.filter((p) => p.team === 0).length;
          const c1 = lobby.players.filter((p) => p.team === 1).length;
          if (c0 < 1 || c1 < 1) {
            setLobbyStatus("Нужен хотя бы 1 игрок в каждой команде", true);
            return;
          }
          if (humans < 2) {
            setLobbyStatus("Нужен ещё хотя бы один игрок или включи ботов", true);
            return;
          }
        }
        const notReady = lobby.players.filter((p) => !p.ready);
        if (notReady.length) {
          setLobbyStatus("Не все готовы", true);
          return;
        }
        // Soft cap: don't exceed mode without bots filling correctly
        void modeCfg;
        net.broadcast({
          type: "start",
          players: lobby.players,
          mode: lobby.mode,
          fillBots: lobby.fillBots,
        });
        beginOnlineMatch(lobby.players, lobby.mode, lobby.fillBots);
      });
    }
  }

  function updateMe(patch) {
    if (!lobby || !net) return;
    const me = lobby.players.find((p) => p.id === net.localPlayerId);
    if (!me) return;
    if (patch.brawlerId) me.brawlerId = patch.brawlerId;
    if (patch.team === 0 || patch.team === 1) {
      const mode = MODES[lobby.mode];
      const count = lobby.players.filter((x) => x.team === patch.team && x.id !== me.id).length;
      if (count < mode.teamSize) me.team = patch.team;
      else setLobbyStatus("Команда заполнена", true);
    }
    if (typeof patch.ready === "boolean") me.ready = patch.ready;
    if (net.isHost) syncLobby();
    else {
      net.send({ type: "update", ...patch, name: nickname });
      renderLobby();
    }
  }

  function beginOnlineMatch(players, mode, fillBots) {
    cancelAnimationFrame(raf);
    if (inputCleanup) {
      inputCleanup();
      inputCleanup = null;
    }
    game = createOnlineGame(players, mode, fillBots);
    mountMatch(game, true);
  }

  function startSoloMatch() {
    destroyNet();
    cancelAnimationFrame(raf);
    if (inputCleanup) {
      inputCleanup();
      inputCleanup = null;
    }
    game = createSoloGame(selectedId);
    mountMatch(game, false);
  }

  function updateHud(g) {
    const player = g.fighters.find((f) => f.isLocal);
    const alive = g.fighters.filter((f) => f.alive).length;
    const hpEl = document.getElementById("hp-fill");
    const hpMeta = document.getElementById("hp-meta");
    const aliveEl = document.getElementById("stat-alive");
    const killsEl = document.getElementById("stat-kills");
    const timeEl = document.getElementById("stat-time");
    const list = document.getElementById("alive-list");
    if (!player || !hpEl) return;

    const ratio = player.alive ? player.hp / player.maxHp : 0;
    hpEl.style.width = `${ratio * 100}%`;
    hpEl.classList.toggle("low", ratio < 0.3);
    hpMeta.textContent = `${player.def.emoji} ${player.def.name} · сила ×${player.power}`;
    aliveEl.textContent = String(alive);
    killsEl.textContent = String(player.kills);
    const t = Math.floor(g.time);
    timeEl.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

    list.innerHTML = g.fighters
      .slice()
      .sort((a, b) => Number(b.alive) - Number(a.alive) || b.kills - a.kills)
      .map((f) => {
        const teamCls = g.teamMode ? (f.team === 0 ? "team-a" : "team-b") : "";
        return `<div class="alive-chip ${f.isLocal ? "you" : ""} ${teamCls} ${f.alive ? "" : "dead"}">${f.def.emoji} ${f.name}${f.kills ? ` · ${f.kills}` : ""}</div>`;
      })
      .join("");
  }

  function showEnd(g) {
    const overlay = document.getElementById("end-overlay");
    const title = document.getElementById("end-title");
    const desc = document.getElementById("end-desc");
    if (!overlay) return;
    const player = g.fighters.find((f) => f.isLocal);
    let win = false;
    if (g.teamMode) {
      win = player && player.team === g.winTeam;
      title.textContent = win ? "ПОБЕДА КОМАНДЫ!" : "ПОРАЖЕНИЕ";
      desc.textContent = win
        ? `Команда ${g.winTeam === 0 ? "Альфа" : "Браво"} победила! Убийства: ${player ? player.kills : 0} · ✦ ${coins}`
        : `Победили ${g.winTeam === 0 ? "Альфа" : "Браво"}. Убийства: ${player ? player.kills : 0} · ✦ ${coins}`;
    } else {
      win = g.place === 1;
      title.textContent = win ? "ПОБЕДА!" : "ПОРАЖЕНИЕ";
      desc.textContent = win
        ? `Ты последний герой арены! Убийства: ${player.kills} · ✦ ${coins}`
        : `Место: #${g.place} · Убийства: ${player.kills} · ✦ ${coins}`;
    }
    title.style.color = win ? "#ffd23f" : "#ff6b6b";
    overlay.classList.add("active");
  }

  function mountMatch(g, online) {
    app.innerHTML = `
      <div id="game-wrap">
        <canvas id="game-canvas"></canvas>
        <div class="hud">
          <div class="hud-top">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <div class="hud-pill"><span>Живы</span><strong id="stat-alive">0</strong></div>
              <div class="hud-pill"><span>Убийства</span><strong id="stat-kills">0</strong></div>
              <div class="hud-pill"><span>Время</span><strong id="stat-time">0:00</strong></div>
              ${
                isOwnerNow()
                  ? `<button class="hud-pill cheat-toggle" id="btn-cheats" type="button" title="Читы (~\`)">Читы</button>`
                  : ""
              }
            </div>
            <div class="alive-list" id="alive-list"></div>
          </div>
          ${
            isOwnerNow()
              ? `<div class="cheat-panel ${CHEATS.panelOpen ? "open" : ""}" id="cheat-panel">
            <div class="cheat-title">Читы <span>~</span></div>
            <label class="cheat-row"><input type="checkbox" data-cheat="invincible" ${CHEATS.invincible ? "checked" : ""}/> Бессмертие</label>
            <label class="cheat-row"><input type="checkbox" data-cheat="infiniteDamage" ${CHEATS.infiniteDamage ? "checked" : ""}/> Бесконечный урон</label>
            <label class="cheat-row"><input type="checkbox" data-cheat="infiniteAmmo" ${CHEATS.infiniteAmmo ? "checked" : ""}/> Бесконечные патроны</label>
            <label class="cheat-row"><input type="checkbox" data-cheat="noclip" ${CHEATS.noclip ? "checked" : ""}/> Сквозь стены</label>
            <label class="cheat-row"><input type="checkbox" data-cheat="fly" ${CHEATS.fly ? "checked" : ""}/> Улететь с карты</label>
            <button class="btn cheat-kill" id="btn-kill-all" type="button">Убить всех</button>
          </div>`
              : ""
          }
          <div class="hud-bottom">
            <div class="player-card">
              <div>
                <div class="hp-bar"><div class="hp-fill" id="hp-fill"></div></div>
                <div class="player-meta" id="hp-meta"></div>
              </div>
            </div>
            <div class="touch-controls">
              <div class="touch-zone" id="joy">
                <div class="touch-knob" id="joy-knob"></div>
              </div>
              <button class="fire-btn" id="fire-btn" type="button">ОГОНЬ</button>
            </div>
          </div>
        </div>
        <div class="overlay" id="end-overlay">
          <div class="overlay-card">
            <h2 id="end-title">ПОБЕДА!</h2>
            <p id="end-desc"></p>
            <div class="menu-actions">
              <button class="btn" id="btn-again" type="button">${online ? "В лобби" : "Ещё раз"}</button>
              <button class="btn ghost" id="btn-menu" type="button">В меню</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");
    const cheatPanel = document.getElementById("cheat-panel");
    const ownerMode = isOwnerNow();

    function syncCheatPanel() {
      if (cheatPanel) cheatPanel.classList.toggle("open", CHEATS.panelOpen);
    }

    if (ownerMode && cheatPanel) {
      const cheatBtn = document.getElementById("btn-cheats");
      if (cheatBtn) {
        cheatBtn.addEventListener("click", () => {
          CHEATS.panelOpen = !CHEATS.panelOpen;
          syncCheatPanel();
        });
      }
      cheatPanel.querySelectorAll("input[data-cheat]").forEach((el) => {
        el.addEventListener("change", () => {
          const key = el.dataset.cheat;
          if (key in CHEATS) CHEATS[key] = !!el.checked;
        });
      });
      const killBtn = document.getElementById("btn-kill-all");
      if (killBtn) killBtn.addEventListener("click", () => killEveryone(g));
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    }
    resize();

    const onKeyDown = (e) => {
      if (ownerMode && e.code === "Backquote") {
        CHEATS.panelOpen = !CHEATS.panelOpen;
        syncCheatPanel();
        e.preventDefault();
        return;
      }
      if (ownerMode && e.code === "KeyK" && (e.ctrlKey || e.altKey)) {
        killEveryone(g);
        e.preventDefault();
        return;
      }
      g.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const onKeyUp = (e) => {
      g.keys[e.code] = false;
    };
    const onPointerDown = (e) => {
      g.mouse.down = true;
      const wpos = screenToWorld(g, canvas, e.clientX, e.clientY);
      g.mouse.worldX = wpos.x;
      g.mouse.worldY = wpos.y;
    };
    const onPointerUp = () => {
      g.mouse.down = false;
    };
    const onPointerMove = (e) => {
      const wpos = screenToWorld(g, canvas, e.clientX, e.clientY);
      g.mouse.worldX = wpos.x;
      g.mouse.worldY = wpos.y;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);

    inputCleanup = () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerup", onPointerUp);
    };

    setupTouch(g);

    document.getElementById("btn-again").addEventListener("click", () => {
      cancelAnimationFrame(raf);
      if (inputCleanup) {
        inputCleanup();
        inputCleanup = null;
      }
      if (online && lobby && net) {
        // reset ready except host stays
        lobby.players.forEach((p) => {
          p.ready = net.isHost && p.id === net.localPlayerId;
        });
        if (net.isHost) syncLobby();
        else renderLobby();
      } else startSoloMatch();
    });
    document.getElementById("btn-menu").addEventListener("click", () => {
      cancelAnimationFrame(raf);
      if (inputCleanup) {
        inputCleanup();
        inputCleanup = null;
      }
      destroyNet();
      lobby = null;
      game = null;
      renderMenu();
    });

    let last = performance.now();
    let endedShown = false;
    let snapAcc = 0;
    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      update(g, dt);
      // throttle host broadcasts a bit inside update already each frame — ok for small lobbies
      snapAcc += dt;
      draw(g, canvas, ctx);
      updateHud(g);
      if (g.ended && !endedShown) {
        endedShown = true;
        showEnd(g);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function setupTouch(g) {
    const joy = document.getElementById("joy");
    const knob = document.getElementById("joy-knob");
    const fire = document.getElementById("fire-btn");
    if (!joy || !knob || !fire) return;

    const setKnob = (dx, dy) => {
      const max = 36;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (dx / len) * Math.min(len, max);
      const ny = (dy / len) * Math.min(len, max);
      knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    };

    const joyPointer = (e) => {
      const rect = joy.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const max = 40;
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      g.touchMove.active = true;
      g.touchMove.dx = dx / max;
      g.touchMove.dy = dy / max;
      setKnob(dx, dy);
    };

    joy.addEventListener("pointerdown", (e) => {
      joy.setPointerCapture(e.pointerId);
      joyPointer(e);
    });
    joy.addEventListener("pointermove", (e) => {
      if (!g.touchMove.active) return;
      joyPointer(e);
    });
    const endJoy = () => {
      g.touchMove.active = false;
      g.touchMove.dx = 0;
      g.touchMove.dy = 0;
      setKnob(0, 0);
    };
    joy.addEventListener("pointerup", endJoy);
    joy.addEventListener("pointercancel", endJoy);

    fire.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      g.touchFire = true;
    });
    fire.addEventListener("pointerup", () => {
      g.touchFire = false;
    });
    fire.addEventListener("pointercancel", () => {
      g.touchFire = false;
    });
  }

  renderMenu();
})();
