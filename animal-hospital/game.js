(() => {
  const VW = 960;
  const VH = 640;
  const MW = 1760;
  const MH = 1120;
  const SPEED = 245;
  const INTERACT = 58;
  const INV_MAX = 3;
  const SAVE = "animal-hospital-anomaly-v7";
  const EXCHANGE_COST = 40;
  const INF = 999999999;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const ctxP = document.getElementById("viewPatient").getContext("2d");
  const ctxPh = document.getElementById("viewPhoto").getContext("2d");
  const ctxC = document.getElementById("viewCctv").getContext("2d");

  const hud = document.getElementById("hud");
  const hudStats = document.getElementById("hudStats");
  const invSlots = document.getElementById("invSlots");
  const sanityFill = document.getElementById("sanityFill");
  const sanityText = document.getElementById("sanityText");
  const needPanel = document.getElementById("needPanel");
  const needTitle = document.getElementById("needTitle");
  const needList = document.getElementById("needList");
  const toastEl = document.getElementById("toast");
  const eventBanner = document.getElementById("eventBanner");
  const shiftTag = document.getElementById("shiftTag");
  const queueStrip = document.getElementById("queueStrip");
  const touch = document.getElementById("touch");
  const menu = document.getElementById("menu");
  const menuWallet = document.getElementById("menuWallet");
  const secretDeathWrap = document.getElementById("secretDeathWrap");
  const modeSelect = document.getElementById("modeSelect");
  const classSelect = document.getElementById("classSelect");
  const buddySelect = document.getElementById("buddySelect");
  const buddyField = document.getElementById("buddyField");
  const shiftSelect = document.getElementById("shiftSelect");
  const skinSelect = document.getElementById("skinSelect");
  const shopPanel = document.getElementById("shopPanel");
  const shopList = document.getElementById("shopList");
  const shopWallet = document.getElementById("shopWallet");
  const exchangePanel = document.getElementById("exchangePanel");
  const exWallet = document.getElementById("exWallet");
  const exCost = document.getElementById("exCost");
  const exResult = document.getElementById("exResult");
  const deskPanel = document.getElementById("deskPanel");
  const deskName = document.getElementById("deskName");
  const deskQueueNote = document.getElementById("deskQueueNote");
  const deskClue = document.getElementById("deskClue");
  const endPanel = document.getElementById("endPanel");
  const endTitle = document.getElementById("endTitle");
  const endSub = document.getElementById("endSub");
  const stickEl = document.getElementById("stick");
  const actBtn = document.getElementById("actBtn");

  // --- Данные (всё на русском) ---
  const SPECIES = [
    { id: "cat", name: "Кот", color: "#e8a060" },
    { id: "dog", name: "Пёс", color: "#c48a4a" },
    { id: "bunny", name: "Кролик", color: "#f0d0c0" },
    { id: "fox", name: "Лис", color: "#e07040" },
    { id: "bear", name: "Медведь", color: "#8a6040" },
    { id: "duck", name: "Утка", color: "#f0d040" },
    { id: "pig", name: "Свин", color: "#f0a0b0" },
  ];

  const ANIME_SPECIES = {
    cat: "Неко-тян",
    dog: "Ину-кун",
    bunny: "Усаги-тян",
    fox: "Кицунэ",
    bear: "Кума-сан",
    duck: "Ахиру-тян",
    pig: "Бута-кун",
  };

  const ANIME_ROOMS = {
    wait: "Зал ожидания ♪",
    reception: "Ресепшен · опенинг",
    corridor: "Коридор школьного аниме",
    pharmacy: "⭐ АПТЕКА (махо-зелья)",
    herbs: "⭐ ТРАВЫ И СИРОПЫ",
    treat1: "Кабинет 1 · сэмпай",
    treat2: "Кабинет 2 · кохаи",
    cardio: "Кардио · биение сердца",
    lab: "Лаборатория / рентген",
    surgery: "Операционная · драма",
    quarantine: "Карантин · арка",
    pedia: "Педиатрия · чиби",
    break: "Отдых / бар · эндкард",
    office: "Офис / полиция",
    storage: "Склад бинтов",
  };

  const ITEMS = {
    thermo: { id: "thermo", name: "Термометр", icon: "🌡", machine: "m_thermo" },
    bandage: { id: "bandage", name: "Бинты", icon: "🩹", machine: "m_bandage" },
    medkit: { id: "medkit", name: "Аптечка", icon: "🧰", machine: "m_medkit" },
    herbs: { id: "herbs", name: "Травы", icon: "🌿", machine: "m_herbs" },
    eyedrops: { id: "eyedrops", name: "Глазные капли", icon: "💧", machine: "m_drops" },
    syrup: { id: "syrup", name: "Кленовый сироп", icon: "🍁", machine: "m_fridge" },
    cough: { id: "cough", name: "Сироп от кашля", icon: "🧴", machine: "m_fridge" },
    heart: { id: "heart", name: "Сердечный набор", icon: "❤️", machine: "m_cardio" },
    monitor: { id: "monitor", name: "Кардиомонитор", icon: "📟", machine: "m_cardio" },
    syringe: { id: "syringe", name: "Шприц", icon: "💉", machine: "m_medkit" },
    xray: { id: "xray", name: "Рентген-плёнка", icon: "📷", machine: "m_xray" },
    splint: { id: "splint", name: "Шина", icon: "🦴", machine: "m_bandage" },
    coffee_cup: { id: "coffee_cup", name: "Стакан кофе", icon: "☕", machine: null },
    juice_cup: { id: "juice_cup", name: "Сок", icon: "🧃", machine: null, exclusive: true, anomalyOnly: true },
  };

  const CONDITIONS = [
    { id: "fever", name: "Температура", needs: ["thermo", "syringe"], icon: "🌡" },
    { id: "bleed", name: "Кровотечение", needs: ["bandage", "medkit"], icon: "🩹" },
    { id: "bruise", name: "Ушиб", needs: ["medkit"], icon: "🧰" },
    { id: "stomach", name: "Боль в животе", needs: ["herbs", "syrup"], icon: "🌿" },
    { id: "eyes", name: "Сухие глаза", needs: ["eyedrops"], icon: "💧" },
    { id: "sugar", name: "Низкий сахар", needs: ["syrup"], icon: "🍁" },
    { id: "cough", name: "Кашель", needs: ["cough", "thermo"], icon: "🧴" },
    { id: "heart", name: "Проблемы с сердцем", needs: ["monitor", "heart"], icon: "❤️" },
    { id: "break", name: "Перелом", needs: ["xray", "splint", "bandage"], icon: "🦴" },
    { id: "infect", name: "Инфекция", needs: ["syringe", "medkit", "eyedrops"], icon: "🦠" },
  ];

  const CLUES = ["hollow", "photo_distort", "cctv_species", "cctv_teeth", "twitch", "no_shadow", "wrong_pose", "voice"];

  const ANOMALY_NAMES = {
    hollow: "Пустые глаза",
    photo_distort: "Глитч на фото",
    cctv_species: "Другой вид на камере",
    cctv_teeth: "Зубы на камере",
    twitch: "Судороги",
    no_shadow: "Нет тени",
    wrong_pose: "Другая поза на фото",
    voice: "Странный голос",
  };

  // Классы как в Roblox (+ цена покупки)
  const CLASSES = [
    { id: "admin", name: "👑 Админ команды", cost: 0, sanity: 200, treatSanity: 20, checkSanity: 20, speed: 1.35, inv: 6, weapon: "gun", desc: "Хозяин · ∞ · пистолет · всё открыто" },
    { id: "intern", name: "Стажёр", cost: 0, sanity: 100, treatSanity: 2, checkSanity: 2, speed: 1, inv: 3, weapon: null, desc: "Старт · бесплатно" },
    { id: "nurse", name: "Медсестра", cost: 20, sanity: 90, treatSanity: 4, checkSanity: 2, speed: 1, inv: 4, weapon: null, desc: "+1 слот инвентаря" },
    { id: "headnurse", name: "Старшая медсестра", cost: 180, sanity: 100, treatSanity: 6, checkSanity: 3, speed: 1.05, inv: 5, weapon: null, desc: "Большой инвентарь" },
    { id: "secretary", name: "Секретарь", cost: 120, sanity: 100, treatSanity: 2, checkSanity: 10, speed: 1, inv: 3, weapon: null, desc: "+рассудок у окна" },
    { id: "paramedic", name: "Парамедик", cost: 250, sanity: 85, treatSanity: 4, checkSanity: 2, speed: 1.25, inv: 3, weapon: null, desc: "+скорость" },
    { id: "psych", name: "Психолог", cost: 500, sanity: 130, treatSanity: 2, checkSanity: 4, speed: 1, inv: 3, weapon: null, desc: "Много рассудка" },
    { id: "doctor", name: "Врач", cost: 900, sanity: 110, treatSanity: 12, checkSanity: 2, speed: 1, inv: 3, weapon: null, desc: "+рассудок за лечение" },
    { id: "surgeon", name: "Хирург", cost: 2500, sanity: 115, treatSanity: 16, checkSanity: 2, speed: 1.05, inv: 3, weapon: null, desc: "Топ лечение" },
    { id: "security", name: "Охрана", cost: 1250, sanity: 85, treatSanity: 2, checkSanity: 6, speed: 1.1, inv: 3, weapon: "taser", desc: "Тазер · ближний бой" },
    { id: "firefighter", name: "Пожарный", cost: 800, sanity: 95, treatSanity: 3, checkSanity: 2, speed: 1.1, inv: 3, weapon: "extinguisher", desc: "Огнетушитель" },
    { id: "warrior", name: "Воин", cost: 1500, sanity: 95, treatSanity: 2, checkSanity: 4, speed: 1.15, inv: 3, weapon: "bat", desc: "Впустит аномалию — во все зоны" },
    { id: "agent", name: "Секретный агент", cost: 3000, sanity: 105, treatSanity: 3, checkSanity: 5, speed: 1.1, inv: 3, weapon: "gun", desc: "Пистолет · F по аномалии сразу · R" },
  ];

  const SKINS = [
    { id: "default", name: "Обычный халат", color: "#f0f4ff", secret: false },
    { id: "mint", name: "Мятный халат", color: "#b8ffe0", secret: false },
    { id: "night", name: "Ночная смена", color: "#8aa0c8", secret: false },
    { id: "secret-gold", name: "⭐ Секретный золотой", color: "#ffd76a", secret: true },
    { id: "secret-void", name: "⭐ Секретный войд", color: "#c080ff", secret: true },
    { id: "secret-agent", name: "⭐ Скин агента", color: "#304050", secret: true },
    { id: "secret-neon", name: "⭐ Неон-аномалия", color: "#40ffc0", secret: true },
    { id: "secret-iskra", name: "⭐ Халат Искры", color: "#ffb020", secret: true, tex: "iskra" },
    { id: "secret-cool", name: "⭐ Халат Куул", color: "#7af0ff", secret: true, tex: "cool" },
    { id: "secret-parrot", name: "⭐ Халат попугая", color: "#ff6a4a", secret: true },
    { id: "secret-lesha", name: "⭐ Халат Леши", color: "#ffc857", secret: true, tex: "lesha" },
    { id: "secret-here", name: "⭐ Халат Auto", color: "#7ec8ff", secret: true, tex: "here" },
    { id: "secret-twinkle", name: "⭐ Халат мерцания", color: "#e8b4ff", secret: true, tex: "twinkle" },
    { id: "secret-truce", name: "⭐ Халат перемирия", color: "#c8a8ff", secret: true, tex: "truce" },
    { id: "secret-starlit", name: "⭐ Халат звёзд", color: "#ffe8c0", secret: true, tex: "starlit" },
  ];

  const WEAPONS = {
    gun: { name: "Пистолет", icon: "🔫", range: 220, ammo: 6, maxAmmo: 6, reload: 2.4, dmg: 1, melee: false },
    taser: { name: "Тазер", icon: "⚡", range: 78, ammo: 1, maxAmmo: 1, reload: 1.1, dmg: 1, melee: true },
    bat: { name: "Дубинка", icon: "🏏", range: 70, ammo: 1, maxAmmo: 1, reload: 0.7, dmg: 1, melee: true },
    extinguisher: { name: "Огнетушитель", icon: "🧯", range: 90, ammo: 3, maxAmmo: 3, reload: 2.0, dmg: 0, melee: true, fire: true },
  };

  const BUDDIES = [
    { id: "zubat", name: "Зубат", classId: "security", desc: "Охраняет и тазерит" },
    { id: "agentX", name: "Агент Икс", classId: "agent", desc: "Стреляет из пистолета" },
    { id: "warriorB", name: "Воительница", classId: "warrior", desc: "Бьёт аномалии" },
    { id: "mila", name: "Мила", classId: "nurse", desc: "Таскает вещи из автоматов" },
    { id: "doc", name: "Док", classId: "doctor", desc: "Лечит у столов" },
    { id: "sec", name: "Секретарь Боб", classId: "secretary", desc: "Помогает у окна" },
    { id: "fire", name: "Огонёк", classId: "firefighter", desc: "Тушит пожары" },
    { id: "parrot", name: "Попугай Кеша", classId: "secretary", desc: "Кричит подсказки у окна · секрет", secret: true },
    { id: "hereMe", name: "Auto", classId: "nurse", desc: "Тихий напарник · особая текстура", secret: true, tex: "here" },
  ];

  /** Персонажи и перки — только ручной спавн хозяина по нику (24 ч) */
  const SPAWN_STORE = "animal-hospital-spawn-players-v1";
  const SPAWN_TTL = 86400000;
  const SPAWN_CHARACTERS = [
    { id: "auto", name: "Auto", tex: "here", color: "#7ec8ff" },
    { id: "rainbow", name: "Rainbow", tex: "rainbow", color: "#ff6ad5" },
    { id: "lilamint", name: "Lilamint", tex: "lilamint", color: "#9b59b6" },
    { id: "builder", name: "Builderman", tex: "builder", color: "#3dcf7a" },
  ];
  /** Roblox-создатели — отдельно от «мира/аномалий»; Sammy и Jendel — соперники */
  const ROBOX_CREATORS = [
    { id: "sammy", name: "Sammy", tex: "sammy", color: "#e23b3b", rival: "jendel" },
    { id: "jendel", name: "Jendel", tex: "jendel", color: "#2563eb", rival: "sammy" },
    { id: "woodstock", name: "Woodstock", tex: "woodstock", color: "#ffd700" },
  ];
  const SPAWN_PERKS = [
    { id: "noAnomaly", label: "Без аномалий" },
    { id: "endlessReason", label: "∞ рассудок" },
    { id: "rainbow", label: "Rainbow · радужные вещи" },
    { id: "secretRainbow", label: "Секрет Rainbow · + ∞ рассудок" },
    { id: "dayDrinks", label: "Кофе/сок на день · без перезарядки" },
  ];

  const SHIFT_TEMPLATES = [
    { key: "quiet", name: "Тихая", tag: "Спокойная ночь", color: "#7ed9b8", anomaly: 0.18, eventRate: 0.02 },
    { key: "queue", name: "Очередь", tag: "Больше клиентов у окна", color: "#8ecfff", anomaly: 0.26, eventRate: 0.1 },
    { key: "ceiling", name: "Не смотри вверх", tag: "Потолок опасен", color: "#ffd36a", anomaly: 0.32, eventRate: 0.18, special: "ceiling" },
    { key: "mass", name: "Массовые", tag: "Волны пациентов", color: "#ff8f6b", anomaly: 0.36, eventRate: 0.26, special: "mass" },
    { key: "stalker", name: "Сталкер", tag: "Кто-то ходит по коридорам", color: "#ef4d5a", anomaly: 0.42, eventRate: 0.3, special: "stalker" },
    { key: "fog", name: "Туман", tag: "Плохо видно лица", color: "#9aa8c8", anomaly: 0.3, eventRate: 0.14 },
    { key: "night", name: "Глубокая ночь", tag: "Тише, но страннее", color: "#6a7cff", anomaly: 0.35, eventRate: 0.16 },
    { key: "rush", name: "Час пик", tag: "Очередь не кончается", color: "#ffb060", anomaly: 0.33, eventRate: 0.22, special: "mass" },
  ];

  const SHIFT_FLAVORS = [
    "",
    " · эхо",
    " · повтор",
    " · тень",
    " · блик",
    " · шёпот",
    " · вторая волна",
  ];

  /** Мало обычных смен; секреты 7/52/67 — в том же списке «СМЕНА» */
  const SHIFTS = (() => {
    const list = [];
    const publicIds = [1, 2, 3, 4, 5, 6, 8, 9];
    publicIds.forEach((id, i) => {
      const t = SHIFT_TEMPLATES[i % SHIFT_TEMPLATES.length];
      list.push({
        id,
        name: `Смена ${id} · ${t.name}`,
        time: 140 + (id % 8) * 4,
        anomaly: Math.min(0.45, t.anomaly),
        eventRate: Math.min(0.3, t.eventRate || 0),
        tag: t.tag + " · ждут лечения",
        color: t.color,
        special: t.special || null,
        secret: false,
        patientDeath: true,
      });
    });
    list.push({
      id: 10,
      name: "Смена 10 · Самообслуживание",
      time: 160,
      anomaly: 0.28,
      eventRate: 0.12,
      tag: "Клиенты сами покупают · могут умереть",
      color: "#8ecfff",
      special: "selfserve",
      secret: false,
      selfServe: true,
      patientDeath: true,
    });
    list.push({
      id: 11,
      name: "Смена 11 · Тихий зал",
      time: 160,
      anomaly: 0,
      eventRate: 0.04,
      tag: "Сами покупают · без аномалий · ждут лечения",
      color: "#7ed9b8",
      special: "selfserveQuiet",
      secret: false,
      selfServe: true,
      noAnomalies: true,
      patientDeath: true,
    });
    list.push({
      id: 33,
      name: "✦ Смена · Попугай",
      time: 200,
      anomaly: 0.3,
      eventRate: 0.08,
      tag: "Тропики · как обычная смена · смерть при ошибке",
      color: "#ff6a4a",
      special: "parrot33",
      secret: true,
      parrotShift: true,
      patientDeath: true,
      theme: "parrot",
      pace: 5,
    });
    list.push({
      id: 19,
      name: "✦ Смена · Ночная смена",
      time: 240,
      anomaly: 0,
      eventRate: 0,
      tag: "Дождь за окном · без аномалий · ∞ вещи",
      color: "#6ec8ff",
      special: "rain19",
      secret: true,
      rainNight: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 19,
      theme: "rain",
    });
    list.push({
      id: 12,
      name: "✦ Смена · Рядом",
      time: 240,
      anomaly: 0,
      eventRate: 0,
      tag: "Тихий сюрприз · без аномалий · ∞ вещи",
      color: "#a8e0ff",
      special: "here12",
      secret: true,
      hereWithYou: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 12,
      theme: "here",
    });
    list.push({
      id: 7,
      name: "✦ Смена 7 · Суперсекрет",
      time: 777,
      anomaly: 0,
      eventRate: 0,
      tag: "Любимая семёрка · без аномалий · ∞ вещи",
      color: "#ff6ad5",
      special: "lucky7",
      secret: true,
      lucky7: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 7,
      theme: "lucky7",
    });
    list.push({
      id: 52,
      name: "✦ Смена Леши · ∞ кофе",
      time: 999,
      anomaly: 0,
      eventRate: 0,
      tag: "Всё в золоте · без аномалий · ∞ вещи",
      color: "#ffd76a",
      special: "lesha",
      secret: true,
      lesha: true,
      endlessCoffee: true,
      noDayDrain: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 52,
      theme: "gold",
    });
    list.push({
      id: 55,
      name: "✦ Смена · Мерцание",
      time: 555,
      anomaly: 0,
      eventRate: 0,
      tag: "Тихий сюрприз · звёздная пыль · ∞ вещи",
      color: "#e8b4ff",
      special: "twinkle55",
      secret: true,
      surpriseUnlock: true,
      twinkleSurprise: true,
      twinkleNight: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 55,
      bonusCoins: 55,
      theme: "twinkle",
      pace: 3,
    });
    list.push({
      id: 66,
      name: "✦ Смена · Перемирие",
      time: 666,
      anomaly: 0,
      eventRate: 0,
      tag: "Sammy + Jendel · мир · ∞ вещи",
      color: "#c8a8ff",
      special: "truce66",
      secret: true,
      surpriseUnlock: true,
      truceSurprise: true,
      truceNight: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 66,
      bonusCoins: 66,
      theme: "truce",
      pace: 3,
    });
    list.push({
      id: 99,
      name: "✦ Смена · Звёздная вилла",
      time: 999,
      anomaly: 0,
      eventRate: 0,
      tag: "Отдых под звёздами · ∞ вещи",
      color: "#ffe8c0",
      special: "starlit99",
      secret: true,
      surpriseUnlock: true,
      villaSurprise: true,
      starlitNight: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 99,
      bonusCoins: 99,
      theme: "starlit",
      pace: 2,
    });
    list.push({
      id: 77,
      name: "✦ Смена · Искра",
      time: 777,
      anomaly: 0,
      eventRate: 0,
      tag: "Секрет · фейерверк · искры · ∞ вещи",
      color: "#ffb020",
      special: "iskra77",
      secret: true,
      iskraNight: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 77,
      bonusCoins: 77,
      theme: "iskra",
      pace: 3,
    });
    list.push({
      id: 88,
      name: "✦ Смена · Куул · Ледяная ночь",
      time: 888,
      anomaly: 0,
      eventRate: 0,
      tag: "Секрет · лёд · северное сияние · ∞ вещи",
      color: "#7af0ff",
      special: "cool88",
      secret: true,
      coolNight: true,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 88,
      bonusCoins: 88,
      theme: "cool",
      pace: 3,
    });
    list.push({
      id: 67,
      name: "✦ Смена 67 · Алмазная ночь",
      time: 180,
      anomaly: 0,
      eventRate: 0,
      tag: "Всё в алмазе · 67 кофе · без аномалий · ∞ вещи",
      color: "#b8f0ff",
      special: "diamond67",
      secret: true,
      diamondNight: true,
      bonusCoins: 67,
      noAnomalies: true,
      vipKit: true,
      coffeeGift: 67,
      theme: "diamond",
    });
    return list;
  })();

  function canUseSecretShifts() {
    try {
      const g = new URLSearchParams(location.search).get("guest");
      if (g === "1" || g === "true" || g === "yes") return false;
    } catch (_) {}
    // в этой игре хозяин всегда может секреты (локальный Amal)
    try {
      if (typeof isOwner === "function" && isOwner()) return true;
    } catch (_) {}
    try {
      if (window.AmalHub) {
        if (typeof AmalHub.isOwner === "function" && AmalHub.isOwner()) return true;
        if (typeof AmalHub.isGameAdmin === "function" && AmalHub.isGameAdmin()) return true;
        const nick = (typeof AmalHub.getNick === "function" && AmalHub.getNick()) || "";
        if (/^(лёша|леша|lesha|lyosha|amal)$/i.test(String(nick).trim())) return true;
      }
    } catch (_) {}
    try {
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      if (localStorage.getItem("animal-hospital-owner-god") === "1") return true;
    } catch (_) {}
    return false;
  }

  function discoveredSurpriseShifts() {
    return SHIFTS.filter((s) => {
      if (!s.secret || !s.surpriseUnlock) return false;
      if (s.twinkleSurprise) return !!meta.surpriseTwinkle;
      if (s.truceSurprise) return !!meta.surpriseTruce;
      if (s.villaSurprise) return !!meta.surpriseVilla;
      return false;
    });
  }

  function visibleShifts() {
    const normals = SHIFTS.filter((s) => !s.secret);
    if (!canUseSecretShifts()) return normals;
    const extras = new Map();
    for (const s of discoveredSurpriseShifts()) extras.set(s.id, s);
    if (selectedShift && selectedShift.secret) extras.set(selectedShift.id, selectedShift);
    return normals.concat([...extras.values()]);
  }

  function openSecretShiftsPanel() {
    if (!canUseSecretShifts()) return;
    const list = document.getElementById("secretShiftsList");
    const panel = document.getElementById("secretShiftsPanel");
    if (!list || !panel) return;
    const secrets = SHIFTS.filter((s) => s.secret);
    const animeOn = !!meta.animeWorld;
    const rainOn = !!meta.rainNight;
    list.innerHTML =
      `<button type="button" class="btn secret-pick anime-world-btn" id="btnAnimeWorld">` +
      `✦ Всё в аниме` +
      `<small>${animeOn ? "Сейчас ВКЛ · нажми чтобы выключить" : "Мир больницы станет аниме"}</small>` +
      `</button>` +
      `<button type="button" class="btn secret-pick rain-world-btn" id="btnRainNight">` +
      `✦ Ночная смена · дождь` +
      `<small>${rainOn ? "Сейчас ВКЛ · нажми чтобы выключить" : "Дождь · я тоже на смене"}</small>` +
      `</button>` +
      secrets
        .map(
          (s) =>
            `<button type="button" class="btn secret-pick" data-shift="${s.id}">${s.name}<small>${s.tag}</small></button>`
        )
        .join("");
    const animeBtn = document.getElementById("btnAnimeWorld");
    if (animeBtn) {
      animeBtn.addEventListener("click", () => {
        meta.animeWorld = !meta.animeWorld;
        if (meta.animeWorld) meta.rainNight = false;
        storeSet(SAVE, meta);
        try {
          if (window.AmalSurprises && AmalSurprises.setAnimeWorld) {
            AmalSurprises.setAnimeWorld(!!meta.animeWorld);
          } else {
            localStorage.setItem("amal-anime-world-v1", meta.animeWorld ? "1" : "0");
          }
          if (window.AmalSurprises && AmalSurprises.setRainNight) {
            AmalSurprises.setRainNight(!!meta.rainNight);
          } else {
            localStorage.setItem("amal-rain-night-v1", meta.rainNight ? "1" : "0");
          }
        } catch (_) {}
        if (meta.animeWorld) {
          applyThemeClass("anime");
          toast("✦ Аниме-мир ВКЛ");
          showEvent("✦ Всё в аниме", 2.4);
        } else {
          syncAnimeWorldTheme();
          toast("Аниме-мир выкл");
        }
        openSecretShiftsPanel();
      });
    }
    const rainBtn = document.getElementById("btnRainNight");
    if (rainBtn) {
      rainBtn.addEventListener("click", () => {
        meta.rainNight = !meta.rainNight;
        if (meta.rainNight) meta.animeWorld = false;
        storeSet(SAVE, meta);
        try {
          if (window.AmalSurprises && AmalSurprises.setRainNight) {
            AmalSurprises.setRainNight(!!meta.rainNight);
          } else {
            localStorage.setItem("amal-rain-night-v1", meta.rainNight ? "1" : "0");
          }
          if (window.AmalSurprises && AmalSurprises.setAnimeWorld) {
            AmalSurprises.setAnimeWorld(!!meta.animeWorld);
          } else {
            localStorage.setItem("amal-anime-world-v1", meta.animeWorld ? "1" : "0");
          }
        } catch (_) {}
        if (meta.rainNight) {
          applyThemeClass("rain");
          toast("✦ Ночная смена");
          showEvent("✦ Я тоже на смене", 2.8);
        } else {
          syncAnimeWorldTheme();
          toast("Дождь выкл");
        }
        openSecretShiftsPanel();
      });
    }
    list.querySelectorAll(".secret-pick[data-shift]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-shift"));
        const pick = SHIFTS.find((s) => s.id === id);
        if (!pick) return;
        selectedShift = pick;
        meta.secretShifts67 = true;
        meta.secretShift7 = true;
        storeSet(SAVE, meta);
        persistLobby();
        hideEl(panel);
        refreshLobbyUI();
        showEl(menu);
        showEl(secretDeathWrap);
        toast("Смена: " + pick.name);
      });
    });
    hideEl(menu);
    hideEl(secretDeathWrap);
    hideEl(shopPanel);
    hideEl(exchangePanel);
    showEl(panel);
  }

  function closeSecretShiftsPanel() {
    hideEl(document.getElementById("secretShiftsPanel"));
    refreshLobbyUI();
    showEl(menu);
    showEl(secretDeathWrap);
  }

  function applySecretDeathCode(raw) {
    if (!canUseSecretShifts()) {
      toast("Код только для хозяина");
      return false;
    }
    const code = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[\s,.\-_/'"«»]+/g, "");
    const parrotCodes = [
      "попугай",
      "parrot",
      "кеша",
      "тоты",
      "парольпопугай",
      "кодпопугай",
    ];
    if (parrotCodes.includes(code)) {
      meta.secretParrot = true;
      meta.secretShifts67 = true;
      meta.secretShift7 = true;
      if (!meta.skins) meta.skins = [];
      if (!meta.skins.includes("secret-parrot")) meta.skins.push("secret-parrot");
      const parrotSkin = SKINS.find((s) => s.id === "secret-parrot");
      if (parrotSkin) {
        selectedSkin = parrotSkin;
        meta.skinId = parrotSkin.id;
      }
      const parrotBuddy = BUDDIES.find((b) => b.id === "parrot");
      if (parrotBuddy) {
        selectedBuddy = parrotBuddy;
        meta.buddyId = parrotBuddy.id;
      }
      const pick = SHIFTS.find((s) => s.id === 33);
      if (pick) selectedShift = pick;
      storeSet(SAVE, meta);
      refreshLobbyUI();
      persistLobby();
      applyThemeClass("parrot");
      toast("✦ попугай · смена выбрана");
      showEvent("✦ Попугай · первый секретный код", 2.8);
      return true;
    }
    const iskraCodes = ["искра", "iskra", "spark", "sparks"];
    if (iskraCodes.includes(code)) {
      unlockIskraWord();
      return true;
    }
    const coolCodes = ["cool", "кул", "куул", "coolcool", "кулл", "ice", "лед", "лёд"];
    if (coolCodes.includes(code) || code === "88") {
      unlockCoolSurprise(true);
      return true;
    }
    if (code !== "67" && code !== "52" && code !== "7" && code !== "12" && code !== "19" && code !== "33") {
      toast("Неизвестный код");
      return false;
    }
    meta.secretShifts67 = true;
    meta.secretShift7 = true;
    storeSet(SAVE, meta);
    const pick = SHIFTS.find((s) => s.id === Number(code));
    if (pick) selectedShift = pick;
    refreshLobbyUI();
    persistLobby();
    toast("Смена: " + (pick ? pick.name : code));
    return true;
  }

  function unlockIskraWord() {
    meta.secretIskra = true;
    meta.secretShifts67 = true;
    if (!meta.skins) meta.skins = [];
    if (!meta.skins.includes("secret-iskra")) meta.skins.push("secret-iskra");
    const skin = SKINS.find((s) => s.id === "secret-iskra");
    if (skin) {
      selectedSkin = skin;
      meta.skinId = skin.id;
    }
    const pick = SHIFTS.find((s) => s.id === 77);
    if (pick) selectedShift = pick;
    storeSet(SAVE, meta);
    refreshLobbyUI();
    persistLobby();
    applyThemeClass("iskra");
    if (g && (state === "play" || state === "desk")) {
      fireIskraBurst();
    } else {
      toast("✦ Искра · смена 77");
      showEvent("✦ ИСКРА · открой смену", 2.8);
    }
    return true;
  }

  function fireIskraBurst() {
    if (!g) return;
    g.theme = "iskra";
    g.iskraBurst = 5.2;
    g.iskraSparks = 12;
    g.noAnomalies = true;
    g.ownerQuiet = true;
    g.coins = (g.coins || 0) + 77;
    g.sanity = g.maxSanity;
    g.immortal = true;
    applyThemeClass("iskra");
    if (g.players[0]) {
      const skin = SKINS.find((s) => s.id === "secret-iskra");
      g.players[0].tex = "iskra";
      g.players[0].color = (skin && skin.color) || "#ffb020";
      g.players[0].coffeeLeft = Math.max(g.players[0].coffeeLeft || 0, 77);
      g.players[0].infiniteItems = true;
      grantInfiniteAmmo(g.players[0]);
    }
    if (g.monsters && g.monsters.length) {
      for (const m of g.monsters.slice()) {
        for (let i = 0; i < 18; i++) {
          g.particles.push({
            x: m.x,
            y: m.y,
            vx: (Math.random() - 0.5) * 280,
            vy: (Math.random() - 0.5) * 280 - 40,
            life: 0.55 + Math.random() * 0.55,
            color: i % 3 === 0 ? "#ffe566" : i % 3 === 1 ? "#ff6a20" : "#ff40a0",
          });
        }
      }
      g.monsters = [];
    }
    const px = g.players[0] ? g.players[0].x : 600;
    const py = g.players[0] ? g.players[0].y : 400;
    for (let wave = 0; wave < 3; wave++) {
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2 + wave * 0.4;
        const sp = 70 + wave * 55 + Math.random() * 90;
        g.particles.push({
          x: px,
          y: py - 10,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 30,
          life: 0.8 + Math.random() * 0.9,
          color: wave === 0 ? "#fff0a0" : wave === 1 ? "#ff8040" : "#ff4ec8",
        });
      }
    }
    // лёгкий импульс гостей
    const was = !!g.noAnimals;
    g.noAnimals = false;
    spawnQueueGuest({ rareKind: "rainbow", name: "Rainbow" });
    spawnQueueGuest({ rareKind: "sammy", name: "Sammy" });
    spawnQueueGuest({ normal: true });
    if (was) g.noAnimals = true;
    layoutQueue();
    refreshDeskIfOpen();
    syncQuietFab();
    renderInv();
    showEvent("✦✦✦ ИСКРА · фейерверк · аномалии в пыль", 4.4);
    toast("✦ +77 · халат Искры · бум");
  }

  function unlockCoolSurprise(fromCode) {
    meta.coolNight = true;
    meta.secretShifts67 = true;
    if (!meta.skins) meta.skins = [];
    if (!meta.skins.includes("secret-cool")) meta.skins.push("secret-cool");
    const coolSkin = SKINS.find((s) => s.id === "secret-cool");
    if (coolSkin) {
      selectedSkin = coolSkin;
      meta.skinId = coolSkin.id;
    }
    const pick = SHIFTS.find((s) => s.id === 88);
    if (pick) selectedShift = pick;
    storeSet(SAVE, meta);
    refreshLobbyUI();
    persistLobby();
    applyThemeClass("cool");
    if (g && (state === "play" || state === "desk")) {
      fireCoolBurst();
    } else {
      toast("❄ Куул · смена 88 открыта");
      showEvent("❄ КУУУЛ · ледяной сюрприз готов · открой смену", 3.2);
    }
    return true;
  }

  function fireCoolBurst() {
    if (!g) return;
    g.theme = "cool";
    g.coolBurst = 4.5;
    g.coolFreeze = 8;
    g.noAnomalies = true;
    g.ownerQuiet = true;
    g.coins = (g.coins || 0) + 88;
    g.sanity = g.maxSanity;
    g.immortal = true;
    applyThemeClass("cool");
    if (g.players[0]) {
      const coolSkin = SKINS.find((s) => s.id === "secret-cool");
      g.players[0].tex = "cool";
      g.players[0].color = (coolSkin && coolSkin.color) || "#7af0ff";
      g.players[0].coffeeLeft = Math.max(g.players[0].coffeeLeft || 0, 88);
      g.players[0].infiniteItems = true;
      grantInfiniteAmmo(g.players[0]);
    }
    // заморозить / убрать монстров с ледяным взрывом
    if (g.monsters && g.monsters.length) {
      for (const m of g.monsters.slice()) {
        for (let i = 0; i < 14; i++) {
          g.particles.push({
            x: m.x,
            y: m.y,
            vx: (Math.random() - 0.5) * 220,
            vy: (Math.random() - 0.5) * 220,
            life: 0.7 + Math.random() * 0.4,
            color: Math.random() < 0.5 ? "#7af0ff" : "#e8ffff",
          });
        }
      }
      g.monsters = [];
    }
    const px = g.players[0] ? g.players[0].x : 600;
    const py = g.players[0] ? g.players[0].y : 400;
    for (let i = 0; i < 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      g.particles.push({
        x: px,
        y: py,
        vx: Math.cos(a) * (90 + Math.random() * 160),
        vy: Math.sin(a) * (90 + Math.random() * 160),
        life: 0.9 + Math.random() * 0.8,
        color: i % 3 === 0 ? "#fff" : i % 3 === 1 ? "#7af0ff" : "#a8ffe0",
      });
    }
    syncQuietFab();
    renderInv();
    showEvent("❄❄❄ КУУУУУУЛ · ледяная ночь · аномалии заморожены", 4.2);
    toast("❄ +88 · халат Куул · сияние");
  }

  function unlockSecretShifts67() {
    return applySecretDeathCode("67");
  }

  function isVipShift(shift) {
    if (!shift || shift.patientDeath) return false;
    return !!(
      shift.vipKit ||
      shift.lesha ||
      shift.diamondNight ||
      shift.lucky7 ||
      shift.rainNight ||
      shift.hereWithYou ||
      shift.coolNight ||
      shift.iskraNight ||
      shift.twinkleNight ||
      shift.truceNight ||
      shift.starlitNight
    );
  }

  function unlockTwinkleSurprise() {
    if (meta.surpriseTwinkle) return;
    meta.surpriseTwinkle = true;
    if (!meta.skins.includes("secret-twinkle")) meta.skins.push("secret-twinkle");
    const pick = SHIFTS.find((s) => s.id === 55);
    if (pick) selectedShift = pick;
    storeSet(SAVE, meta);
    refreshLobbyUI();
    persistLobby();
    applyThemeClass("twinkle");
    showEvent("✦ …что-то мерцает", 2.4);
    toast("✦ …");
  }

  function unlockVillaSurprise() {
    if (!g || meta.surpriseVilla) return;
    meta.surpriseVilla = true;
    if (!meta.skins.includes("secret-starlit")) meta.skins.push("secret-starlit");
    const pick = SHIFTS.find((s) => s.id === 99);
    if (pick) selectedShift = pick;
    storeSet(SAVE, meta);
    g.theme = "starlit";
    g.starlitBurst = 4.8;
    applyThemeClass("starlit");
    if (g.players[0]) {
      g.players[0].tex = "starlit";
      g.players[0].color = "#ffe8c0";
    }
    for (let i = 0; i < 48; i++) {
      g.particles.push({
        x: g.players[0] ? g.players[0].x : 900,
        y: g.players[0] ? g.players[0].y - 20 : 760,
        vx: (Math.random() - 0.5) * 60,
        vy: -20 - Math.random() * 80,
        life: 1.2 + Math.random() * 1.4,
        color: i % 2 ? "#fff8e0" : "#ffe8a0",
      });
    }
    showEvent("✦ …звёзды над виллой", 3.2);
    toast("✦ …");
  }

  function unlockTruceSurprise() {
    if (!g || meta.surpriseTruce) return;
    meta.surpriseTruce = true;
    if (!meta.skins.includes("secret-truce")) meta.skins.push("secret-truce");
    const pick = SHIFTS.find((s) => s.id === 66);
    if (pick) selectedShift = pick;
    storeSet(SAVE, meta);
    g.theme = "truce";
    g.truceBurst = 5;
    applyThemeClass("truce");
    if (g.players[0]) {
      g.players[0].tex = "truce";
      g.players[0].color = "#c8a8ff";
    }
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      g.particles.push({
        x: 450 + t * 120 + (Math.random() - 0.5) * 30,
        y: 260 + Math.sin(t * Math.PI) * 40,
        vx: (Math.random() - 0.5) * 40,
        vy: -30 - Math.random() * 50,
        life: 0.9 + Math.random() * 0.8,
        color: i % 2 ? "#ffb0b0" : "#9ec5ff",
      });
    }
    showEvent("✦ …перемирие?", 3.4);
    toast("✦ …");
  }

  function checkSurpriseGuestTreated(v) {
    if (!g || !v) return;
    if (v.rareKind === "sammy") g.truceSammyDone = true;
    if (isJendelKind(v)) g.truceJendelDone = true;
    if (g.truceSammyDone && g.truceJendelDone && !meta.surpriseTruce) unlockTruceSurprise();
  }

  function fireTwinkleBurst() {
    if (!g) return;
    g.theme = "twinkle";
    g.twinkleBurst = 4.5;
    g.noAnomalies = true;
    g.ownerQuiet = true;
    g.coins = (g.coins || 0) + 55;
    g.sanity = g.maxSanity;
    g.immortal = true;
    applyThemeClass("twinkle");
    if (g.players[0]) {
      g.players[0].tex = "twinkle";
      g.players[0].color = "#e8b4ff";
      g.players[0].infiniteItems = true;
      grantInfiniteAmmo(g.players[0]);
    }
    for (let i = 0; i < 55; i++) {
      g.particles.push({
        x: (g.players[0] && g.players[0].x) || 600,
        y: (g.players[0] && g.players[0].y) || 400,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200 - 20,
        life: 0.7 + Math.random() * 0.9,
        color: i % 3 === 0 ? "#fff0ff" : i % 3 === 1 ? "#e8b4ff" : "#ffd76a",
      });
    }
    syncQuietFab();
    renderInv();
    showEvent("✦✦ мерцание", 3.6);
    toast("✦ +55");
  }

  function fireStarlitBurst() {
    if (!g) return;
    g.theme = "starlit";
    g.starlitBurst = 5;
    g.noAnomalies = true;
    g.ownerQuiet = true;
    g.coins = (g.coins || 0) + 99;
    g.sanity = g.maxSanity;
    g.immortal = true;
    applyThemeClass("starlit");
    if (g.players[0]) {
      g.players[0].tex = "starlit";
      g.players[0].color = "#ffe8c0";
      g.players[0].infiniteItems = true;
      grantInfiniteAmmo(g.players[0]);
    }
    syncQuietFab();
    renderInv();
    showEvent("✦✦ звёздная вилла", 3.6);
    toast("✦ +99");
  }

  function fireTruceBurst() {
    if (!g) return;
    g.theme = "truce";
    g.truceBurst = 5;
    g.noAnomalies = true;
    g.ownerQuiet = true;
    g.coins = (g.coins || 0) + 66;
    g.sanity = g.maxSanity;
    g.immortal = true;
    applyThemeClass("truce");
    if (g.players[0]) {
      g.players[0].tex = "truce";
      g.players[0].color = "#c8a8ff";
      g.players[0].infiniteItems = true;
      grantInfiniteAmmo(g.players[0]);
    }
    syncQuietFab();
    renderInv();
    showEvent("✦✦ перемирие · Sammy · Jendel", 3.8);
    toast("✦ +66");
  }

  function shiftAllowsDeath(shift) {
    return !!(shift && shift.patientDeath);
  }

  function patientDie(v, reason) {
    if (!g || !v) return;
    g.died = (g.died || 0) + 1;
    g.leaked += 1;
    g.inside = g.inside.filter((p) => p.id !== v.id);
    if (focusPatient && focusPatient.id === v.id) {
      focusPatient = null;
      updateNeedUI();
    }
    if (g.firePatient && g.firePatient.id === v.id) g.firePatient = null;
    for (let i = 0; i < 12; i++) {
      g.particles.push({
        x: v.x,
        y: v.y,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 140,
        life: 0.6,
        color: "#ef4d5a",
      });
    }
    hurtSanity(10);
    showEvent(reason || "✗ Пациент умер", 2.4);
    toast(reason || "Пациент умер");
  }

  function placePatientInside(v) {
    const beds = getStations().filter((s) => s.kind === "treat");
    const taken = new Set(g.inside.map((p) => p.bed));
    const free = beds.find((b) => !taken.has(b.id));
    v.phase = "treating";
    v.diagnosed = false;
    v.delivered = [];
    v.wrongHits = 0;
    if (shiftAllowsDeath(g.shift)) {
      v.life = 48 + Math.random() * 22;
      v.maxLife = v.life;
    } else {
      v.life = null;
    }
    if (free) {
      v.bed = free.id;
      v.x = free.x;
      v.y = free.y;
    } else {
      v.x = 700 + (Math.random() * 80 - 40);
      v.y = 560;
    }
    g.inside.push(v);
  }

  function autoAdmitSelfServe() {
    if (!g || !g.shift || !g.shift.selfServe) return;
    if (!g.queue.length) return;
    const beds = getStations().filter((s) => s.kind === "treat");
    const freeCount = Math.max(0, beds.length - g.inside.length);
    if (freeCount <= 0) return;
    const v = g.queue[0];
    if (v.isAnomaly) return;
    g.queue.shift();
    layoutQueue();
    placePatientInside(v);
    v.selfServe = true;
    v.diagnosed = true;
    v.selfBuyCd = 1.2 + Math.random() * 1.4;
    g.coins += 2;
    toast("Клиент сам пошёл за лекарствами");
  }

  function applyThemeClass(theme) {
    document.body.classList.remove(
      "theme-gold",
      "theme-diamond",
      "theme-lucky7",
      "theme-here",
      "theme-anime",
      "theme-rain",
      "theme-parrot",
      "theme-cool",
      "theme-iskra",
      "theme-twinkle",
      "theme-truce",
      "theme-starlit"
    );
    const screen = document.getElementById("screen");
    if (screen) {
      screen.classList.remove(
        "theme-gold",
        "theme-diamond",
        "theme-lucky7",
        "theme-here",
        "theme-anime",
        "theme-rain",
        "theme-parrot",
        "theme-cool",
        "theme-iskra",
        "theme-twinkle",
        "theme-truce",
        "theme-starlit"
      );
    }
    if (!theme) return;
    const cls = "theme-" + theme;
    document.body.classList.add(cls);
    if (screen) screen.classList.add(cls);
  }

  function animeWorldOn() {
    // во время смены — только если тема смены anime; флаг лобби не красит все смены
    if (g) return g.theme === "anime";
    return !!(meta && meta.animeWorld);
  }

  function rainNightOn() {
    if (g) return g.theme === "rain";
    return !!(meta && meta.rainNight);
  }

  function speciesLabel(sp) {
    if (!sp) return "";
    if (animeWorldOn() && ANIME_SPECIES[sp.id]) return ANIME_SPECIES[sp.id];
    return sp.name;
  }

  function roomLabel(room) {
    if (!room) return "";
    if (animeWorldOn() && ANIME_ROOMS[room.id]) return ANIME_ROOMS[room.id];
    return room.name;
  }

  function giveVipKit(player, shift) {
    if (!player) return;
    const meds = Object.keys(ITEMS).filter((id) => id !== "coffee_cup" && id !== "juice_cup");
    player.inv = meds.slice();
    player.selInv = 0;
    player.coffeeLeft = (shift && shift.coffeeGift) || player.coffeeLeft || 99;
    player.infiniteItems = true;
    grantInfiniteAmmo(player);
  }

  function giveOwnerLoadoutAll(shift) {
    if (!g || !g.players) return;
    for (const pl of g.players) giveVipKit(pl, shift);
  }

  const ROOMS = [
    { id: "wait", name: "Зал ожидания", x: 40, y: 40, w: 360, h: 280, color: "#243048" },
    { id: "reception", name: "Ресепшен", x: 420, y: 40, w: 360, h: 280, color: "#2a3850" },
    { id: "corridor", name: "Коридор", x: 800, y: 40, w: 160, h: 280, color: "#1e2838" },
    { id: "pharmacy", name: "⭐ АПТЕКА (лекарства)", x: 980, y: 40, w: 360, h: 320, color: "#3a2840" },
    { id: "herbs", name: "⭐ ТРАВЫ И СИРОПЫ", x: 1360, y: 40, w: 360, h: 320, color: "#1e4030" },
    { id: "treat1", name: "Кабинет 1", x: 40, y: 360, w: 300, h: 260, color: "#284050" },
    { id: "treat2", name: "Кабинет 2", x: 360, y: 360, w: 300, h: 260, color: "#304858" },
    { id: "cardio", name: "Кардио", x: 680, y: 360, w: 280, h: 260, color: "#403050" },
    { id: "lab", name: "Лаборатория / рентген", x: 980, y: 380, w: 340, h: 240, color: "#2a3048" },
    { id: "surgery", name: "Операционная", x: 1340, y: 380, w: 380, h: 240, color: "#403038" },
    { id: "quarantine", name: "Карантин", x: 40, y: 660, w: 320, h: 280, color: "#3a2828" },
    { id: "pedia", name: "Педиатрия", x: 380, y: 660, w: 320, h: 280, color: "#304040" },
    { id: "break", name: "Вилла · отдых", x: 720, y: 660, w: 400, h: 280, color: "#2a3840" },
    { id: "office", name: "Офис / полиция", x: 1140, y: 660, w: 300, h: 280, color: "#283848" },
    { id: "storage", name: "Склад бинтов", x: 1460, y: 660, w: 260, h: 280, color: "#383040" },
  ];

  // Автоматы: room = куда идти (крупно написано на панели «Нужно»)
  const MACHINES = [
    { id: "m_thermo", x: 1060, y: 120, short: "Термометры", room: "АПТЕКА", gives: ["thermo"], color: "#6a4030" },
    { id: "m_medkit", x: 1180, y: 120, short: "Аптечки", room: "АПТЕКА", gives: ["medkit", "syringe"], color: "#5a3040" },
    { id: "m_drops", x: 1300, y: 120, short: "Капли", room: "АПТЕКА", gives: ["eyedrops"], color: "#2a4a6a" },
    { id: "m_herbs", x: 1460, y: 130, short: "ТРАВЫ", room: "ТРАВЫ И СИРОПЫ", gives: ["herbs"], color: "#1a7040" },
    { id: "m_fridge", x: 1600, y: 130, short: "СИРОПЫ", room: "ТРАВЫ И СИРОПЫ", gives: ["syrup", "cough"], color: "#8a4020" },
    { id: "m_bandage", x: 1540, y: 760, short: "Бинты/шины", room: "СКЛАД БИНТОВ", gives: ["bandage", "splint"], color: "#4a5a70" },
    { id: "m_cardio", x: 780, y: 480, short: "Сердце", room: "КАРДИО", gives: ["heart", "monitor"], color: "#6a2a3a" },
    { id: "m_xray", x: 1100, y: 480, short: "Рентген", room: "ЛАБОРАТОРИЯ", gives: ["xray"], color: "#3a3a5a" },
    { id: "m_surgery", x: 1480, y: 480, short: "Хирургия", room: "ОПЕРАЦИОННАЯ", gives: ["medkit", "syringe"], color: "#5a2040" },
  ];
  MACHINES.forEach((m) => {
    m.label = m.short + " " + m.gives.map((id) => ITEMS[id].icon).join("");
  });

  const STATIONS_BASE = [
    { id: "desk", x: 600, y: 160, label: "Окно ресепшена", kind: "desk" },
    { id: "bed1", x: 160, y: 480, label: "Стол 1", kind: "treat" },
    { id: "bed2", x: 480, y: 480, label: "Стол 2", kind: "treat" },
    { id: "bed3", x: 800, y: 500, label: "Стол кардио", kind: "treat" },
    { id: "bed4", x: 520, y: 780, label: "Стол педиатрии", kind: "treat" },
    { id: "bed5", x: 160, y: 780, label: "Стол карантина", kind: "treat" },
    { id: "office", x: 1280, y: 800, label: "Кабинет (офис)", kind: "office" },
    { id: "coffee", x: 820, y: 740, label: "Кофемашина 1", kind: "coffee" },
    { id: "barman", x: 960, y: 800, label: "Барни", kind: "barman" },
    { id: "villaLight", x: 760, y: 700, label: "Свет виллы", kind: "villaLight" },
  ];
  const STATION_COFFEE2 = { id: "coffee2", x: 980, y: 740, label: "Кофемашина 2", kind: "coffee" };
  /** Убежище Барни — всегда одно и то же место на карте */
  const BARNEY_HIDE = { x: 1580, y: 790 };

  function getStations() {
    const list = STATIONS_BASE.slice();
    if (meta && meta.coffee2) list.push(STATION_COFFEE2);
    return list;
  }

  function storeGet(k, f) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? f : JSON.parse(v);
    } catch {
      return f;
    }
  }
  function storeSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  }

  function showEl(el) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute("aria-hidden");
    el.style.removeProperty("display");
  }
  function hideEl(el) {
    if (!el) return;
    el.hidden = true;
    el.style.setProperty("display", "none", "important");
    el.setAttribute("aria-hidden", "true");
  }

  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 1700);
  }
  function showEvent(msg, sec) {
    eventBanner.textContent = msg;
    showEl(eventBanner);
    clearTimeout(showEvent._t);
    showEvent._t = setTimeout(() => hideEl(eventBanner), (sec || 3.2) * 1000);
  }

  const keys = Object.create(null);
  const stick = { x: 0, y: 0, active: false };
  let act1 = false;
  let act2 = false;

  let shoot1 = false;
  let reload1 = false;
  let shoot2 = false;
  let reload2 = false;
  let coolTypeBuf = "";

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    // не перехватывать ввод в поле secret death
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "KeyE" || e.code === "Space") act1 = true;
    if (e.code === "Enter") act2 = true;
    if (e.code === "KeyQ" && g) dropItem(g.players[0]);
    if (e.code === "KeyC" && g) drinkCoffeeCup(g.players[0]);
    if (e.code === "KeyJ" && g) tryGiveJuice(g.players[0]);
    if (e.code === "BracketLeft" && g) cycleInv(g.players[0], -1);
    if (e.code === "BracketRight" && g) cycleInv(g.players[0], 1);
    if (g && /^Digit[1-9]$/.test(e.code)) {
      selectInvSlot(g.players[0], Number(e.code.slice(5)) - 1);
    }
    // секретный набор букв cool / кул / искра
    if (canUseSecretShifts() && e.key && e.key.length === 1 && /[a-zа-яё]/i.test(e.key)) {
      coolTypeBuf = (coolTypeBuf + e.key.toLowerCase().replace("ё", "е")).slice(-16);
      if (/искра|iskra|spark/.test(coolTypeBuf)) {
        coolTypeBuf = "";
        unlockIskraWord();
      } else if (/cool|куул|кул$/.test(coolTypeBuf)) {
        coolTypeBuf = "";
        unlockCoolSurprise(true);
      }
    }
    if (e.code === "KeyF") shoot1 = true;
    if (e.code === "KeyR") reload1 = true;
    if (e.code === "ShiftRight") shoot2 = true;
    if (e.code === "ControlRight") reload2 = true;
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  function bindStick(el) {
    const setFrom = (cx, cy) => {
      const r = el.getBoundingClientRect();
      let dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (cy - (r.top + r.height / 2)) / (r.height / 2);
      const len = Math.hypot(dx, dy) || 1;
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      stick.x = dx;
      stick.y = dy;
      stick.active = true;
    };
    const clear = () => {
      stick.x = stick.y = 0;
      stick.active = false;
    };
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      setFrom(e.clientX, e.clientY);
    });
    el.addEventListener("pointermove", (e) => {
      if (stick.active) setFrom(e.clientX, e.clientY);
    });
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointercancel", clear);
  }
  bindStick(stickEl);
  actBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    act1 = true;
  });

  let meta = storeGet(SAVE, null);
  if (!meta || typeof meta !== "object") {
    meta = {
      coins: INF,
      infCoins: true,
      immortal: true,
      bestShift: 1,
      unlocked: [],
      skins: [],
      classId: "intern",
      skinId: "default",
      buddyId: "zubat",
      shiftId: 1,
      mode: "solo",
      coffee2: false,
    };
  }

  // ∞ монеты ВСЕГДА — без проверки хозяина (иначе снова 20 монет)
  function forceInfinite() {
    meta.infCoins = true;
    meta.immortal = true;
    meta.coins = INF;
    meta.unlocked = CLASSES.map((c) => c.id);
    meta.skins = SKINS.map((s) => s.id);
    if (!meta.classId || meta.classId === "intern") meta.classId = "admin";
    if (!meta.skinId) meta.skinId = "default";
    storeSet(SAVE, meta);
    try {
      localStorage.setItem("animal-hospital-owner-god", "1");
      localStorage.setItem("amal-owner-v1", "1");
      localStorage.setItem("amal-owner-v2", "1");
      localStorage.setItem("amal-owner-v3", "1");
      window.__AMAL_OWNER__ = true;
      window.__AMAL_GOD__ = true;
    } catch (_) {}
  }
  forceInfinite();
  try {
    // аниме/дождь больше не липнут ко всем сменам
    localStorage.removeItem("amal-anime-world-v1");
    localStorage.removeItem("amal-rain-night-v1");
  } catch (_) {}
  meta.animeWorld = false;
  meta.rainNight = false;

  function applyLobbyTheme() {
    if (g && g.theme) {
      applyThemeClass(g.theme);
      return;
    }
    if (meta && meta.rainNight) {
      applyThemeClass("rain");
      return;
    }
    if (meta && meta.animeWorld) {
      applyThemeClass("anime");
      return;
    }
    const th = selectedShift && selectedShift.theme;
    applyThemeClass(th || null);
  }

  function syncAnimeWorldTheme() {
    applyLobbyTheme();
  }

  function pulseShiftTag() {
    if (!shiftTag) return;
    shiftTag.classList.remove("shift-tag-pop");
    void shiftTag.offsetWidth;
    shiftTag.classList.add("shift-tag-pop");
  }

  function isOwner() {
    return true;
  }
  function ownerGod() {
    return true;
  }
  function ensureOwnerPerks() {
    forceInfinite();
  }
  function hasInfCoins() {
    return true;
  }
  function spendCoins(_n) {
    forceInfinite();
    return true;
  }
  function hasClass(_id) {
    return true;
  }
  function hasSkin(_id) {
    return true;
  }

  let selectedClass = CLASSES.find((c) => c.id === meta.classId && hasClass(c.id)) || CLASSES[0];
  let selectedBuddy = BUDDIES.find((b) => b.id === meta.buddyId) || BUDDIES[0];
  let selectedShift = SHIFTS.find((s) => s.id === meta.shiftId) || SHIFTS[0];
  if (selectedShift.secret && !canUseSecretShifts()) {
    selectedShift = SHIFTS.find((s) => !s.secret) || SHIFTS[0];
  }
  let selectedSkin = SKINS.find((s) => s.id === meta.skinId && hasSkin(s.id)) || SKINS[0];
  let mode = meta.mode || "solo";
  let state = "menu";
  let g = null;
  let deskPatient = null;
  let focusPatient = null;
  let cam = { x: 0, y: 0 };
  let last = performance.now();
  let coffeeCd = { coffee: 0, coffee2: 0 };

  function refreshLobbyUI() {
    forceInfinite();
    menuWallet.textContent = "🪙 ∞";
    if (exCost) exCost.textContent = "бесплатно";
    modeSelect.value = mode;
    if (mode === "pair") showEl(buddyField);
    else hideEl(buddyField);

    classSelect.innerHTML = CLASSES.map(
      (c) => `<option value="${c.id}" ${c.id === selectedClass.id ? "selected" : ""}>${c.name} — ${c.desc}</option>`
    ).join("");
    buddySelect.innerHTML = BUDDIES.map(
      (b) => `<option value="${b.id}" ${b.id === selectedBuddy.id ? "selected" : ""}>${b.name} — ${b.desc}</option>`
    ).join("");
    shiftSelect.innerHTML = visibleShifts()
      .map(
        (s) =>
          `<option value="${s.id}" ${s.id === selectedShift.id ? "selected" : ""}>${s.name} — ${s.tag}</option>`
      )
      .join("");
    skinSelect.innerHTML = SKINS.map(
      (s) => `<option value="${s.id}" ${s.id === selectedSkin.id ? "selected" : ""}>${s.name}</option>`
    ).join("");

    const hint = document.getElementById("menuHints");
    if (hint) hint.textContent = "👑 Админ команды · 🪙 ∞ · жёлтые стрелки к автоматам · ∞ время";
    const btnAll = document.getElementById("btnAllSecrets");
    if (btnAll) btnAll.hidden = !canUseSecretShifts();
    const spawnPanel = document.getElementById("spawnPlayersPanel");
    if (spawnPanel) {
      if (canUseSecretShifts()) showEl(spawnPanel);
      else hideEl(spawnPanel);
    }
    syncSecretTray();
    renderSpawnActiveList();
    applyLobbyTheme();
  }

  function syncSecretTray() {
    const tray = document.getElementById("secretTray");
    if (!tray) return;
    if (canUseSecretShifts()) showEl(tray);
    else hideEl(tray);
  }

  function ensureShiftPlaying() {
    if (g && (state === "play" || state === "desk")) return true;
    toast("Сначала открой смену");
    return false;
  }

  function refreshDeskIfOpen() {
    if (state !== "desk" || !g || !g.queue.length) return;
    deskPatient = g.queue[0];
    const kind = deskPatient.isAnomaly
      ? " · ⚠ АНОМАЛИЯ"
      : deskPatient.rareKind
        ? ` · ${guestKindTag(deskPatient) || guestLabel(deskPatient)}`
        : " · 🐾 обычное";
    deskName.textContent = `${guestLabel(deskPatient)}${kind} у окна`;
    deskQueueNote.textContent = deskPatient.isAnomaly
      ? `⚠ Это АНОМАЛИЯ · ещё в очереди: ${Math.max(0, g.queue.length - 1)}`
      : `🐾 Обычный · ещё в очереди: ${Math.max(0, g.queue.length - 1)}`;
    renderInspectViews(deskPatient);
    showEl(deskPanel);
    syncJuiceDeskBtn();
  }

  function spawnQueueGuest(opts) {
    if (!ensureShiftPlaying()) return null;
    let forceAnomaly = null;
    if (opts && opts.anomaly) forceAnomaly = true;
    if (opts && opts.normal) forceAnomaly = false;
    const v = makeVisitor(forceAnomaly, { skipLucky: true });
    if (opts && opts.rareKind) {
      const ch = spawnCharacterDef(opts.rareKind);
      const id = (ch && ch.id) || opts.rareKind;
      if (ch && ch.tex === "here") v.rareKind = "auto";
      else if (ch && ch.tex) v.rareKind = ch.tex;
      else v.rareKind = id;
      if (v.rareKind === "jen") v.rareKind = "jendel";
      v.guestName = opts.name || (ch && ch.name) || String(id);
      v.isAnomaly = false;
      v.isCompanion = v.rareKind === "auto";
      v.luckyDrop = false;
      v.shopPrize = null;
      v.hollow = false;
      v.distort = false;
      v.twitch = false;
      v.teeth = false;
      v.noShadow = false;
      v.wrongPose = false;
      v.voice = false;
      v.photoSpecies = v.species;
      v.cctvSpecies = v.species;
      // секретного — сразу первым к окну, чтобы увидеть картинку
      g.queue.unshift(v);
    } else {
      g.queue.push(v);
    }
    if (opts && opts.anomaly) {
      v.isAnomaly = true;
      v.rareKind = null;
      v.guestName = "";
      if (!v.hollow && !v.distort && !v.twitch) {
        v.hollow = true;
        v.twitch = true;
      }
    }
    layoutQueue();
    refreshDeskIfOpen();
    onCreatorSpawned(v);
    return v;
  }

  function spawnTrayAnomalyMonster() {
    if (!ensureShiftPlaying()) return;
    if (!g.monsters) g.monsters = [];
    const kinds = ["ghost", "stalker", "skinwalker", "slime"];
    const kind = kinds[(Math.random() * kinds.length) | 0];
    const p = g.players[0];
    const x = (p ? p.x : 400) + (Math.random() * 120 - 60);
    const y = (p ? p.y : 300) + (Math.random() * 80 - 40);
    g.monsters.push(spawnMonster(kind, x, y, 14));
    showEvent("👾 Аномалия рядом", 2.2);
    toast("Аномалия заспавнена");
  }

  function setRelaxMode(on) {
    if (!ensureShiftPlaying()) return;
    g.relaxMode = !!on;
    if (g.relaxMode) {
      g.immortal = true;
      g.sanity = g.maxSanity;
      if (g.players[0]) {
        g.players[0].infiniteItems = true;
        g.players[0].coffeeLeft = 9999;
        grantInfiniteAmmo(g.players[0]);
      }
      showEvent("◌ Режим отдыха · самолечение", 2.8);
      toast("Сиди спокойно · звери сами");
    } else {
      toast("Режим отдыха выкл");
    }
  }

  function syncQuietFab() {
    const btn = document.getElementById("btnQuietShift");
    if (!btn) return;
    const show = !!(g && (state === "play" || state === "desk") && canUseSecretShifts());
    btn.hidden = !show;
    if (!show) return;
    const on = !!(g.ownerQuiet || g.noAnomalies);
    btn.classList.toggle("off", !on);
    btn.textContent = on ? "⚠ ВКЛ" : "⚠ ВЫКЛ";
    btn.title = on
      ? "Без аномалий · нажми, чтобы снова получать"
      : "Аномалии включены · нажми, чтобы выключить";
  }

  function syncAnimalsFab() {
    const btn = document.getElementById("btnAnimalsShift");
    if (!btn) return;
    const show = !!(g && (state === "play" || state === "desk") && canUseSecretShifts());
    btn.hidden = !show;
    if (!show) return;
    const on = !g.noAnimals;
    btn.classList.toggle("off", !on);
    btn.textContent = on ? "🐾 ВКЛ" : "🐾 ВЫКЛ";
    btn.title = on
      ? "Животные в очереди · нажми, чтобы выключить"
      : "Животных нет · нажми, чтобы включить";
  }

  function setNoAnimals(on, silent) {
    if (!g) return;
    g.noAnimals = !!on;
    meta.noAnimals = !!on;
    storeSet(SAVE, meta);
    if (g.noAnimals) {
      g.queue = [];
      g.inside = [];
      deskPatient = null;
      focusPatient = null;
      hideEl(deskPanel);
      hideEl(needPanel);
      if (state === "desk") state = "play";
      layoutQueue();
      refreshRequestsStrip();
    }
    syncAnimalsFab();
    if (silent) return;
    if (g.noAnimals) {
      toast("🐾 Животные ВЫКЛ · очередь пустая");
      showEvent("🐾 Выкл · сон без зверей", 2.2);
    } else {
      toast("🐾 Животные снова могут прийти");
    }
  }

  function setOwnerQuiet(on, silent) {
    if (!g) return;
    g.ownerQuiet = !!on;
    const shiftForced = !!(g.shift && (g.shift.noAnomalies || g.shift.anomaly <= 0));
    g.noAnomalies = g.ownerQuiet || shiftForced;
    syncQuietFab();
    if (silent) return;
    if (g.ownerQuiet) {
      toast("⚠ Без аномалий · обычные звери");
      showEvent("Без аномалий · можно выключить кнопкой слева", 2.4);
    } else if (shiftForced) {
      toast("На этой смене аномалий нет");
    } else {
      toast("⚠ Аномалии снова могут прийти");
    }
  }

  function pickJuiceTarget() {
    if (!g) return null;
    if (state === "desk" && deskPatient) return deskPatient;
    if (g.queue && g.queue[0]) return g.queue[0];
    return null;
  }

  function tryGiveJuice(player) {
    if (!player || !g) return false;
    const target = pickJuiceTarget();
    if (!target) {
      toast("🧃 Сок · подойди к окну / открой клиента");
      return false;
    }
    const hasJuice = player.inv.includes("juice_cup") || player.infiniteItems;
    if (!hasJuice) {
      toast("🧃 Нет сока · возьми в ✦ Вещи");
      return false;
    }
    if (!target.isAnomaly) {
      toast("🧃 Обычный клиент · сок не нужен");
      return false;
    }
    // аномалия принимает сок — уходит спокойно (как шторка)
    const idx = player.inv.indexOf("juice_cup");
    if (idx >= 0 && !player.infiniteItems) player.inv.splice(idx, 1);
    renderInv();
    const qIdx = g.queue.indexOf(target);
    if (qIdx >= 0) g.queue.splice(qIdx, 1);
    if (deskPatient === target) {
      deskPatient = null;
      hideEl(deskPanel);
      state = "play";
    }
    layoutQueue();
    g.blocked += 1;
    g.coins += 18;
    healSanity(10 + (player.cls.checkSanity || 0));
    toast("🧃 Аномалия выпила сок и ушла");
    showEvent("🧃 Сок · аномалия ушла · обычные остались обычными", 2.6);
    syncQuietFab();
    return true;
  }

  function syncJuiceDeskBtn() {
    const btn = document.getElementById("btnGiveJuice");
    if (!btn) return;
    const show =
      state === "desk" &&
      deskPatient &&
      deskPatient.isAnomaly &&
      g &&
      g.players[0] &&
      (g.players[0].inv.includes("juice_cup") || g.players[0].infiniteItems || canUseSecretShifts());
    btn.hidden = !show;
  }

  function kukusSpam() {
    if (!ensureShiftPlaying()) return;
    // Кукус всегда пробивает «животные выкл» — только ручной спам
    const wasNoAnimals = !!g.noAnimals;
    if (wasNoAnimals) g.noAnimals = false;

    let n = 0;
    const secrets = SPAWN_CHARACTERS.concat(ROBOX_CREATORS);
    for (const ch of secrets) {
      const v = spawnQueueGuest({ rareKind: ch.id, name: ch.name });
      if (v) n += 1;
    }
    for (let i = 0; i < 4; i++) {
      if (spawnQueueGuest({ normal: true })) n += 1;
    }
    for (let i = 0; i < 3; i++) {
      if (spawnQueueGuest({ anomaly: true })) n += 1;
    }
    spawnTrayAnomalyMonster();
    if (wasNoAnimals) g.noAnimals = true;
    layoutQueue();
    refreshDeskIfOpen();
    syncAnimalsFab();
    showEvent(`🐔 Кукус · спам ×${n} · секреты + обычные + аномалии`, 2.8);
    toast(`🐔 Кукус · +${n} в очередь (жми ещё)`);
  }

  function applyTrayCharacter(charId) {
    const ch = spawnCharacterDef(charId);
    if (!ch) {
      toast("Нет такого персонажа");
      return;
    }
    // 1) надеть на себя
    meta.trayTex = ch.tex;
    meta.trayChar = ch.id;
    storeSet(SAVE, meta);
    if (g && g.players[0]) {
      g.players[0].tex = ch.tex;
      g.players[0].color = ch.color;
      g.players[0].name = ch.name;
    }
    const skin =
      SKINS.find((s) => s.tex === ch.tex) ||
      (ch.id === "auto" ? SKINS.find((s) => s.id === "secret-here") : null);
    if (skin) {
      selectedSkin = skin;
      meta.skinId = skin.id;
      if (!meta.skins.includes(skin.id)) meta.skins.push(skin.id);
      storeSet(SAVE, meta);
      refreshLobbyUI();
    }
    // 2) заспавнить в очередь (если смена открыта)
    if (g && (state === "play" || state === "desk")) {
      const v = spawnQueueGuest({ rareKind: ch.id, name: ch.name });
      if (v) {
        showEvent(`✦ ${ch.name} в очереди`, 2.2);
        toast(`${ch.name} · заспавнен`);
        return;
      }
    }
    toast(`Персонаж · ${ch.name} · открой смену, чтобы заспавнить в очередь`);
    showEvent(`✦ ${ch.name}`, 1.6);
  }

  function giveTrayItem(itemId) {
    if (itemId === "kukus") {
      kukusSpam();
      return;
    }
    if (itemId === "animal") {
      const v = spawnQueueGuest({ normal: true });
      if (v) {
        showEvent("🐾 ОБЫЧНОЕ животное · не аномалия", 2.2);
        toast("🐾 Обычное · НЕ аномалия");
        if (state === "desk") refreshDeskIfOpen();
      }
      return;
    }
    if (itemId === "anomalyGuest") {
      const v = spawnQueueGuest({ anomaly: true });
      if (v) {
        showEvent("⚠ АНОМАЛИЯ у окна · сравни фото / камеру", 2.4);
        toast("⚠ Это АНОМАЛИЯ · не обычный");
        if (state === "desk") refreshDeskIfOpen();
      }
      return;
    }
    if (itemId === "anomalyMob") {
      spawnTrayAnomalyMonster();
      return;
    }
    if (itemId === "relaxOn") {
      setRelaxMode(true);
      return;
    }
    if (itemId === "relaxOff") {
      setRelaxMode(false);
      return;
    }
    if (!g || !g.players[0]) {
      toast("Сначала открой смену");
      return;
    }
    const p = g.players[0];
    if (itemId === "coffee") {
      p.coffeeLeft = Math.max(p.coffeeLeft || 0, 9999);
      if (!p.inv.includes("coffee_cup") && p.inv.length < invMax(p)) p.inv.push("coffee_cup");
      coffeeCd = { coffee: 0, coffee2: 0 };
      meta.coffee2 = true;
      storeSet(SAVE, meta);
      renderInv();
      toast("☕ Кофе · без перезарядки");
      return;
    }
    if (itemId === "juice") {
      if (!p.inv.includes("juice_cup") && p.inv.length < invMax(p)) p.inv.push("juice_cup");
      renderInv();
      toast("🧃 Сок · только аномалиям (J / кнопка у окна)");
      return;
    }
    const def = ITEMS[itemId];
    if (!def) return;
    if (p.inv.length >= invMax(p) && !p.infiniteItems) {
      toast("Инвентарь полон");
      return;
    }
    p.inv.push(itemId);
    renderInv();
    toast(`${def.icon} ${def.name}`);
  }

  function bootSecretTray() {
    const chars = document.getElementById("secretTrayChars");
    const creators = document.getElementById("secretTrayCreators");
    const items = document.getElementById("secretTrayItems");
    const spawnRow = document.getElementById("secretTraySpawn");
    const fab = document.getElementById("btnSecretTray");
    const panel = document.getElementById("secretTrayPanel");
    const closeBtn = document.getElementById("btnSecretTrayClose");
    if (chars && !chars.dataset.ready) {
      chars.dataset.ready = "1";
      chars.innerHTML = SPAWN_CHARACTERS.map(
        (c) =>
          `<button type="button" class="secret-tray-chip char-${c.id}" data-char="${c.id}">${c.name}</button>`
      ).join("");
      chars.querySelectorAll("[data-char]").forEach((btn) => {
        btn.addEventListener("click", () => applyTrayCharacter(btn.getAttribute("data-char")));
      });
    }
    if (creators && !creators.dataset.ready) {
      creators.dataset.ready = "1";
      creators.innerHTML = ROBOX_CREATORS.map(
        (c) =>
          `<button type="button" class="secret-tray-chip char-${c.id}" data-char="${c.id}">${c.name}</button>`
      ).join("");
      creators.querySelectorAll("[data-char]").forEach((btn) => {
        btn.addEventListener("click", () => applyTrayCharacter(btn.getAttribute("data-char")));
      });
    }
    const kukusRow = document.getElementById("secretTrayKukus");
    if (kukusRow && !kukusRow.dataset.ready) {
      kukusRow.dataset.ready = "1";
      kukusRow.innerHTML =
        `<button type="button" class="secret-tray-chip kukus-btn" data-item="kukus">🐔 Кукус · СПАМ</button>`;
      kukusRow.querySelectorAll("[data-item]").forEach((btn) => {
        btn.addEventListener("click", () => giveTrayItem(btn.getAttribute("data-item")));
      });
    }
    if (spawnRow && !spawnRow.dataset.ready) {
      spawnRow.dataset.ready = "1";
      const pack = [
        { id: "animal", label: "🐾 Обычное" },
        { id: "anomalyGuest", label: "⚠ Аномалия" },
        { id: "anomalyMob", label: "👾 Монстр" },
        { id: "relaxOn", label: "◌ Отдых ВКЛ" },
        { id: "relaxOff", label: "Отдых ВЫКЛ" },
      ];
      spawnRow.innerHTML = pack
        .map((it) => `<button type="button" class="secret-tray-chip" data-item="${it.id}">${it.label}</button>`)
        .join("");
      spawnRow.querySelectorAll("[data-item]").forEach((btn) => {
        btn.addEventListener("click", () => giveTrayItem(btn.getAttribute("data-item")));
      });
    }
    if (items && !items.dataset.ready) {
      items.dataset.ready = "1";
      const pack = [
        { id: "coffee", label: "☕ Кофе" },
        { id: "juice", label: "🧃 Сок · ⚠" },
        { id: "medkit", label: "🧰 Аптечка" },
        { id: "bandage", label: "🩹 Бинт" },
        { id: "syringe", label: "💉 Шприц" },
        { id: "thermo", label: "🌡 Термометр" },
      ];
      items.innerHTML = pack
        .map((it) => `<button type="button" class="secret-tray-chip" data-item="${it.id}">${it.label}</button>`)
        .join("");
      items.querySelectorAll("[data-item]").forEach((btn) => {
        btn.addEventListener("click", () => giveTrayItem(btn.getAttribute("data-item")));
      });
    }
    const toggle = () => {
      if (!panel) return;
      if (panel.hidden) showEl(panel);
      else hideEl(panel);
    };
    if (fab) fab.addEventListener("click", toggle);
    if (closeBtn) closeBtn.addEventListener("click", () => hideEl(panel));
    syncSecretTray();
  }

  function persistLobby() {
    meta.classId = selectedClass.id;
    meta.buddyId = selectedBuddy.id;
    meta.shiftId = selectedShift.id;
    meta.skinId = selectedSkin.id;
    meta.mode = mode;
    storeSet(SAVE, meta);
  }

  modeSelect.addEventListener("change", () => {
    mode = modeSelect.value;
    persistLobby();
    refreshLobbyUI();
  });
  classSelect.addEventListener("change", () => {
    selectedClass = CLASSES.find((c) => c.id === classSelect.value) || CLASSES[0];
    persistLobby();
  });
  buddySelect.addEventListener("change", () => {
    selectedBuddy = BUDDIES.find((b) => b.id === buddySelect.value) || BUDDIES[0];
    persistLobby();
  });
  shiftSelect.addEventListener("change", () => {
    selectedShift = SHIFTS.find((s) => String(s.id) === shiftSelect.value) || SHIFTS[0];
    persistLobby();
    applyLobbyTheme();
  });
  skinSelect.addEventListener("change", () => {
    selectedSkin = SKINS.find((s) => s.id === skinSelect.value) || SKINS[0];
    persistLobby();
  });

  function openShop() {
    hideEl(secretDeathWrap);
    forceInfinite();
    shopWallet.textContent = "Монеты: ∞";
    shopList.innerHTML = CLASSES.map((c) => {
      return `<div class="shop-item owned">
        <div><strong>${c.name}</strong><small>${c.desc}</small></div>
        <button type="button" disabled>Открыто</button>
      </div>`;
    }).join("");
    hideEl(menu);
    showEl(shopPanel);
  }

  function buyClass(id) {
    forceInfinite();
    const c = CLASSES.find((x) => x.id === id);
    if (!c) return;
    selectedClass = c;
    persistLobby();
    toast("Класс: " + c.name);
    openShop();
    refreshLobbyUI();
  }

  function openExchange() {
    forceInfinite();
    exWallet.textContent = "🪙 ∞";
    exResult.textContent = "Крути бесплатно — класс или секретный скин";
    hideEl(menu);
    hideEl(secretDeathWrap);
    showEl(exchangePanel);
  }

  function spinExchange() {
    forceInfinite();
    const missingSecrets = SKINS.filter((s) => s.secret);
    const rollClass = CLASSES.filter((c) => c.cost > 0);
    let msg = "";
    if (Math.random() < 0.55) {
      const skin = rand(missingSecrets);
      selectedSkin = skin;
      msg = "Скин: " + skin.name;
    } else {
      const c = rand(rollClass);
      selectedClass = c;
      msg = "Класс: " + c.name;
    }
    persistLobby();
    exResult.textContent = msg;
    exWallet.textContent = "🪙 ∞";
    toast(msg);
    refreshLobbyUI();
  }

  function applySiteOwnerBoost() {
    forceInfinite();
    if (g) {
      g.immortal = true;
      g.sanity = g.maxSanity;
    }
    refreshLobbyUI();
  }

  window.addEventListener("amal-power", () => applySiteOwnerBoost());
  window.addEventListener("amal-powers-applied", () => applySiteOwnerBoost());
  applySpawnPerksOnLoad();

  refreshLobbyUI();

  function rand(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function getPlayerNick() {
    try {
      if (window.AmalHub && typeof AmalHub.getNick === "function") {
        const n = AmalHub.getNick();
        if (n) return String(n).trim();
      }
    } catch (_) {}
    return "";
  }

  function loadSpawnRegistry() {
    const list = storeGet(SPAWN_STORE, []);
    const now = Date.now();
    const fresh = (Array.isArray(list) ? list : []).filter((e) => e && e.expiresAt > now);
    if (fresh.length !== list.length) storeSet(SPAWN_STORE, fresh);
    return fresh;
  }

  function saveSpawnRegistry(list) {
    storeSet(SPAWN_STORE, list);
  }

  function findSpawnForNick(nick) {
    const n = String(nick || "")
      .trim()
      .toLowerCase();
    if (!n) return null;
    return loadSpawnRegistry().find((e) => String(e.nick || "").toLowerCase() === n) || null;
  }

  function getMySpawnEntry() {
    return findSpawnForNick(getPlayerNick());
  }

  function pickShopPrize() {
    const classes = CLASSES.filter((c) => c.cost > 0 && c.id !== "admin");
    const skins = SKINS.filter((s) => s.secret || s.id !== "default");
    if (Math.random() < 0.55 && classes.length) {
      const c = rand(classes);
      return { kind: "class", id: c.id, name: c.name };
    }
    if (skins.length) {
      const s = rand(skins);
      return { kind: "skin", id: s.id, name: s.name };
    }
    const c = rand(classes);
    return { kind: "class", id: c.id, name: c.name };
  }

  function grantShopPrizeToAdmin(prize, fromLabel) {
    if (!prize) return;
    if (prize.kind === "class") {
      if (!meta.unlocked.includes(prize.id)) meta.unlocked.push(prize.id);
    } else if (prize.kind === "skin") {
      if (!meta.skins.includes(prize.id)) meta.skins.push(prize.id);
    }
    storeSet(SAVE, meta);
    showEvent(`🎁 Админу команды · ${prize.name}`, 3.2);
    toast(`${fromLabel || "Гость"} выбил: ${prize.name}`);
    refreshLobbyUI();
  }

  function spawnCharacterDef(id) {
    if (id === "jen") id = "jendel";
    return SPAWN_CHARACTERS.find((r) => r.id === id) || ROBOX_CREATORS.find((r) => r.id === id) || null;
  }

  function isJendelKind(v) {
    return v && (v.rareKind === "jendel" || v.rareKind === "jen");
  }

  function queueHasCreatorRivals() {
    if (!g || !g.queue) return false;
    const hasSammy = g.queue.some((v) => v.rareKind === "sammy");
    const hasJendel = g.queue.some((v) => isJendelKind(v));
    return hasSammy && hasJendel;
  }

  function onCreatorSpawned(v) {
    if (!v || !g) return;
    if (v.rareKind !== "sammy" && !isJendelKind(v)) return;
    if (!queueHasCreatorRivals()) return;
    g.rivalryFlash = 2.2;
    showEvent("⚔ Sammy vs Jendel — враги мира · конфликт в очереди!", 3.2);
    toast("Sammy и Jendel не мирятся в одной линии");
  }

  function tickCreatorRivalry(dt) {
    if (!g || !g.queue || !queueHasCreatorRivals()) return;
    g.rivalryCd = (g.rivalryCd || 0) - dt;
    if (g.rivalryCd > 0) return;
    g.rivalryCd = 3.5;
    const s = g.queue.find((v) => v.rareKind === "sammy");
    const j = g.queue.find((v) => isJendelKind(v));
    if (!s || !j) return;
    for (let i = 0; i < 8; i++) {
      g.particles.push({
        x: (s.x + j.x) / 2 + (Math.random() - 0.5) * 30,
        y: (s.y + j.y) / 2 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 140,
        life: 0.45,
        color: Math.random() < 0.5 ? "#ef4d5a" : "#3b82f6",
      });
    }
  }

  function applySpawnPerksOnLoad() {
    const entry = getMySpawnEntry();
    if (!entry) return;
    const p = entry.perks || {};
    if (p.dayDrinks) {
      meta.coffee2 = true;
      meta.dayDrinksUntil = entry.expiresAt;
    }
    if (p.rainbow || p.secretRainbow) meta.rainbowSpawn = true;
    if (p.secretRainbow) meta.secretRainbow = true;
    storeSet(SAVE, meta);
  }

  function applySpawnPerksToGame() {
    const entry = getMySpawnEntry();
    if (!entry || !g || !g.players[0]) return;
    const p = entry.perks || {};
    const ch = spawnCharacterDef(entry.character) || SPAWN_CHARACTERS[0];
    const pl = g.players[0];
    pl.tex = ch.tex;
    pl.color = ch.color;
    pl.name = entry.nick;
    if (p.noAnomaly) g.noAnomalies = true;
    if (p.endlessReason || p.secretRainbow) {
      g.immortal = true;
      g.maxSanity = Math.max(g.maxSanity, 999);
      g.sanity = g.maxSanity;
    }
    if (p.dayDrinks) {
      pl.dayDrinksUntil = entry.expiresAt;
      pl.coffeeLeft = 9999;
      meta.coffee2 = true;
      meta.dayDrinksUntil = entry.expiresAt;
    }
    if (p.rainbow || p.secretRainbow) {
      g.rainbowLoot = true;
      pl.rainbowSpawn = true;
      meta.rainbowSpawn = true;
      if (!meta.skins.includes("secret-neon")) meta.skins.push("secret-neon");
    }
    if (p.secretRainbow) {
      g.secretRainbow = true;
      meta.secretRainbow = true;
      if (!meta.skins.includes("secret-gold")) meta.skins.push("secret-gold");
      if (!meta.skins.includes("secret-void")) meta.skins.push("secret-void");
    }
    storeSet(SAVE, meta);
    toast(`✦ ${entry.nick} · ${ch.name} · перки на сутки`);
  }

  function renderSpawnActiveList() {
    const ul = document.getElementById("spawnActiveList");
    if (!ul) return;
    const list = loadSpawnRegistry();
    if (!list.length) {
      ul.innerHTML = "<li class=\"spawn-empty\">Пока никого — заспавни по нику</li>";
      return;
    }
    ul.innerHTML = list
      .slice()
      .reverse()
      .map((e) => {
        const ch = spawnCharacterDef(e.character);
        const perks = SPAWN_PERKS.filter((p) => e.perks && e.perks[p.id])
          .map((p) => p.label)
          .join(" · ");
        const left = Math.max(0, Math.ceil((e.expiresAt - Date.now()) / 3600000));
        return `<li><strong>${e.nick}</strong> · ${(ch && ch.name) || "?"}<br><small>${perks || "—"} · ${left}ч</small></li>`;
      })
      .join("");
  }

  function spawnPlayerRegistry(nick, characterId, perkIds) {
    if (!canUseSecretShifts()) {
      toast("Только хозяин");
      return false;
    }
    const name = String(nick || "").trim().slice(0, 24);
    if (!name) {
      toast("Напиши ник игрока");
      return false;
    }
    const ch = spawnCharacterDef(characterId) || SPAWN_CHARACTERS[0];
    const perks = {};
    for (const id of perkIds) perks[id] = true;
    if (perks.secretRainbow) perks.endlessReason = true;
    const entry = {
      nick: name,
      character: ch.id,
      perks,
      spawnedAt: Date.now(),
      expiresAt: Date.now() + SPAWN_TTL,
    };
    const list = loadSpawnRegistry().filter((e) => String(e.nick || "").toLowerCase() !== name.toLowerCase());
    list.push(entry);
    saveSpawnRegistry(list);
    try {
      if (window.AmalHub && typeof AmalHub.giveGiftToPlayer === "function") {
        AmalHub.giveGiftToPlayer({
          nick: name,
          game: "animal-hospital",
          giftId: perks.secretRainbow ? "rainbow-hello" : perks.rainbow ? "lucky-box" : "party-boost",
        });
      }
    } catch (_) {}
    renderSpawnActiveList();
    toast(`${ch.name} · ${name} · на 24 ч`);
    return true;
  }

  function guestLabel(v) {
    if (!v) return "";
    if (v.guestName) return v.guestName;
    if (v.luckyDrop) return "✦ сюрприз";
    return speciesLabel(v.species);
  }

  function guestKindTag(v) {
    if (!v) return "";
    if (v.luckyDrop && v.shopPrize) return "приз";
    if (v.rareKind === "gift") return "приз";
    if (v.rareKind === "rainbow") return "Rainbow";
    if (v.rareKind === "lilamint") return "Lilamint";
    if (v.rareKind === "sammy") return "Sammy";
    if (isJendelKind(v)) return "Jendel";
    if (v.rareKind === "woodstock") return "Woodstock";
    if (v.rareKind === "builder") return "Builderman";
    if (v.rareKind === "auto" || v.isCompanion) return "Auto";
    return "";
  }

  function makeVisitor(forceAnomaly, opts) {
    const sp = rand(SPECIES);
    const shift = (g && g.shift) || selectedShift;
    let isAnomaly;
    if (forceAnomaly != null) isAnomaly = !!forceAnomaly;
    else if (shift && (shift.noAnomalies || shift.anomaly <= 0)) isAnomaly = false;
    else if (g && g.noAnomalies) isAnomaly = false;
    else isAnomaly = Math.random() < (shift ? shift.anomaly : 0.25);
    const cond = rand(CONDITIONS);
    const v = {
      id: "v" + Math.random().toString(36).slice(2, 9),
      species: sp,
      condition: cond,
      needs: cond.needs.slice(),
      delivered: [],
      diagnosed: false,
      isAnomaly,
      photoSpecies: sp,
      cctvSpecies: sp,
      hollow: false,
      distort: false,
      teeth: false,
      twitch: false,
      noShadow: false,
      wrongPose: false,
      voice: false,
      phase: "queue",
      x: 560,
      y: 270,
      bob: Math.random() * 10,
      bed: null,
      luckyDrop: false,
      shopPrize: null,
      guestName: "",
      rareKind: null,
      isCompanion: false,
    };
    // 10%: секретный гость с призом — не при ручном спавне
    if (!isAnomaly && !(opts && opts.skipLucky) && Math.random() < 0.1) {
      v.luckyDrop = true;
      v.shopPrize = pickShopPrize();
      v.guestName = "✦ сюрприз";
      v.rareKind = "gift";
    }
    if (isAnomaly) {
      const picks = CLUES.slice().sort(() => Math.random() - 0.5).slice(0, 1 + (Math.random() < 0.5 ? 1 : 0));
      for (const c of picks) {
        if (c === "hollow") v.hollow = true;
        if (c === "photo_distort") v.distort = true;
        if (c === "cctv_species") v.cctvSpecies = rand(SPECIES.filter((s) => s.id !== sp.id));
        if (c === "cctv_teeth") v.teeth = true;
        if (c === "twitch") v.twitch = true;
        if (c === "no_shadow") v.noShadow = true;
        if (c === "wrong_pose") v.wrongPose = true;
        if (c === "voice") v.voice = true;
      }
    }
    return v;
  }

  function makeWeapon(cls) {
    const type = cls.weapon;
    if (!type || !WEAPONS[type]) return null;
    const w = WEAPONS[type];
    return {
      type,
      name: w.name,
      icon: w.icon,
      range: w.range,
      ammo: w.ammo,
      maxAmmo: w.maxAmmo,
      reloadTime: w.reload,
      reloadCd: 0,
      melee: w.melee,
      fire: !!w.fire,
      cool: 0,
    };
  }

  function grantInfiniteAmmo(player) {
    if (!player) return;
    player.infiniteAmmo = true;
    if (!player.weapon) {
      player.weapon = makeWeapon({ weapon: "gun" });
    }
    if (player.weapon) {
      player.weapon.ammo = player.weapon.maxAmmo;
      player.weapon.reloadCd = 0;
    }
  }

  function spendAmmo(player) {
    const w = player && player.weapon;
    if (!w) return false;
    if (player.infiniteAmmo) {
      w.ammo = w.maxAmmo;
      return true;
    }
    if (w.ammo <= 0) return false;
    w.ammo -= 1;
    return true;
  }

  function makePlayer(cls, x, y, isAi, name, color) {
    return {
      x,
      y,
      cls,
      inv: [],
      isAi: !!isAi,
      name: name || cls.name,
      color: color || "#f0f4ff",
      tex: null,
      aiCd: 0.5,
      aiTarget: null,
      weapon: makeWeapon(cls),
      facing: 1,
    };
  }

  function spawnMonster(kind, x, y, life) {
    return {
      id: "m" + Math.random().toString(36).slice(2, 7),
      kind: kind || "skinwalker",
      x,
      y,
      t: life != null ? life : 10,
      hp: 1,
    };
  }

  /** Аномалию впустили — она расползается по всем зонам больницы */
  function inviteAnomalyToAllWorlds(sourceLabel) {
    if (!g) return;
    const spots = [
      { x: 200, y: 160, kind: "skinwalker" },
      { x: 600, y: 180, kind: "ghost" },
      { x: 1200, y: 160, kind: "stalker" },
      { x: 160, y: 500, kind: "slime" },
      { x: 800, y: 500, kind: "camouflage" },
      { x: 1500, y: 500, kind: "bedmonster" },
      { x: 200, y: 780, kind: "ghost" },
      { x: 1000, y: 780, kind: "stalker" },
    ];
    if (!g.monsters) g.monsters = [];
    for (const s of spots) {
      g.monsters.push(spawnMonster(s.kind, s.x, s.y, 14));
    }
    showEvent(
      `⚠ ${sourceLabel || "Аномалию"} впустили — она во ВСЕХ зонах больницы!`,
      4.5
    );
    hurtSanity(10);
  }

  function clearMonster(m) {
    if (!g || !g.monsters) return;
    g.monsters = g.monsters.filter((x) => x.id !== m.id);
    g.blocked += 1;
    g.coins += 12;
    for (let i = 0; i < 8; i++) {
      g.particles.push({
        x: m.x,
        y: m.y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        life: 0.45,
        color: "#ef4d5a",
      });
    }
    if (!g.monsters.length) hideEl(eventBanner);
  }

  function nearestMonster(px, py, range) {
    if (!g || !g.monsters || !g.monsters.length) return null;
    let best = null;
    let bestD = range;
    for (const m of g.monsters) {
      const d = Math.hypot(m.x - px, m.y - py);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }

  function startReload(player) {
    const w = player.weapon;
    if (!w) {
      toast("Нет оружия");
      return;
    }
    if (player.infiniteAmmo) {
      w.ammo = w.maxAmmo;
      w.reloadCd = 0;
      toast(`${w.icon} ∞ патроны`);
      renderInv();
      return;
    }
    if (w.reloadCd > 0) {
      toast(`Перезарядка… ${w.reloadCd.toFixed(1)}с`);
      return;
    }
    if (w.ammo >= w.maxAmmo) {
      toast("Уже полный магазин");
      return;
    }
    w.reloadCd = w.reloadTime;
    toast(`${w.icon} Перезарядка ${w.name}…`);
  }

  /** Аномалия у окна / в очереди — можно сразу стрелять, без «Принять» */
  function nearestQueueAnomaly(px, py, range) {
    if (!g) return null;
    // на ресепшене цель уже перед тобой — бить можно сразу
    if (state === "desk" && deskPatient && deskPatient.isAnomaly) return deskPatient;
    let best = null;
    let bestD = range;
    const check = (v) => {
      if (!v || !v.isAnomaly) return;
      const d = Math.hypot(v.x - px, v.y - py);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    };
    if (deskPatient) check(deskPatient);
    for (const v of g.queue || []) check(v);
    return best;
  }

  function eliminateQueueAnomaly(player, visitor) {
    if (!g || !visitor) return;
    const idx = g.queue.indexOf(visitor);
    if (idx >= 0) g.queue.splice(idx, 1);
    if (deskPatient === visitor) {
      deskPatient = null;
      hideEl(deskPanel);
      state = "play";
    }
    layoutQueue();
    g.blocked += 1;
    g.coins += 14;
    healSanity(6 + (player.cls.checkSanity || 0));
    if (player.cls.id === "agent") healSanity(4);
    toast(`${player.weapon ? player.weapon.icon : "💥"} Аномалия снята у окна — без приёма!`);
    showEvent("Аномалия уничтожена сразу · принимать не нужно", 2.5);
  }

  function useWeapon(player) {
    if (!g || (state !== "play" && state !== "desk")) return;
    const w = player.weapon;
    if (!w) {
      toast("У класса нет оружия");
      return;
    }
    if (w.reloadCd > 0) {
      toast(`Перезарядка… ${w.reloadCd.toFixed(1)}с`);
      return;
    }
    if (w.cool > 0) return;

    // огнетушитель — тушит огонь
    if (w.fire && g.firePatient && Math.hypot(g.firePatient.x - player.x, g.firePatient.y - player.y) < w.range) {
      if (!spendAmmo(player)) {
        toast("Пусто — R перезарядка");
        return;
      }
      w.cool = 0.25;
      g.firePatient = null;
      healSanity(6);
      toast("🧯 Пожар потушен!");
      hideEl(eventBanner);
      if (!player.infiniteAmmo && w.ammo <= 0) w.reloadCd = w.reloadTime;
      renderInv();
      return;
    }

    // сначала монстры в больнице, иначе — аномалия у окна/в очереди (без «Принять»)
    const shootRange = w.type === "gun" ? Math.max(w.range, 220) : w.range;
    const m = nearestMonster(player.x, player.y, shootRange);
    const qAnom = !m ? nearestQueueAnomaly(player.x, player.y, shootRange) : null;
    if (!m && !qAnom) {
      toast(w.melee ? "Подойди ближе к аномалии" : "Нет цели · аномалию у окна можно бить сразу (F)");
      return;
    }
    if (!spendAmmo(player)) {
      toast("Нет патронов — нажми R");
      return;
    }

    const tx = m ? m.x : qAnom.x;
    const ty = m ? m.y : qAnom.y;
    w.cool = w.type === "gun" ? 0.35 : 0.2;
    g.particles.push({
      x: player.x,
      y: player.y - 10,
      vx: (tx - player.x) * 2,
      vy: (ty - player.y) * 2,
      life: 0.2,
      color: w.type === "gun" ? "#ffe080" : "#80e0ff",
    });

    if (qAnom) {
      eliminateQueueAnomaly(player, qAnom);
      if (!player.infiniteAmmo && w.ammo <= 0 && w.type === "gun") toast("Магазин пуст — R перезарядка");
      renderInv();
      return;
    }

    m.hp -= 1;
    if (m.hp <= 0) {
      toast(`${w.icon} ${w.name}: аномалия уничтожена!`);
      clearMonster(m);
      if (player.cls.id === "agent") healSanity(4);
      if (player.cls.id === "security") healSanity(3);
    } else {
      toast("Попадание!");
    }
    if (!player.infiniteAmmo && w.ammo <= 0 && w.type === "gun") {
      toast("Магазин пуст — R перезарядка");
    }
    renderInv();
  }

  function startShift() {
    ensureOwnerPerks();
    persistLobby();
    const shift = selectedShift;
    const coat = (selectedSkin && selectedSkin.color) || "#f0f4ff";
    const p1 = makePlayer(selectedClass, 300, 200, false, "Ты", coat);
    if (selectedSkin && selectedSkin.tex) p1.tex = selectedSkin.tex;
    const players = [p1];
    if (mode === "pair") {
      const bCls = CLASSES.find((c) => c.id === selectedBuddy.classId) || CLASSES[1];
      const buddyColor =
        selectedBuddy && selectedBuddy.tex === "here" ? "#7ec8ff" : "#ffb48a";
      const p2 = makePlayer(bCls, 360, 220, true, selectedBuddy.name, buddyColor);
      if (selectedBuddy && selectedBuddy.tex) p2.tex = selectedBuddy.tex;
      players.push(p2);
    } else if (mode === "local2") {
      players.push(makePlayer(CLASSES.find((c) => c.id === "nurse") || CLASSES[1], 360, 220, false, "Игрок 2", "#a0d8ff"));
    }

    g = {
      t: 0,
      left: Infinity,
      endless: true,
      shift,
      coins: 0,
      treated: 0,
      blocked: 0,
      leaked: 0,
      died: 0,
      wrongReject: 0,
      sanity: selectedClass.sanity,
      maxSanity: selectedClass.sanity,
      immortal: isVipShift(shift),
      players,
      queue: [],
      inside: [],
      spawnCd: 1.2,
      particles: [],
      shutterFlash: 0,
      monsters: [],
      firePatient: null,
      headBanger: null,
      eventCd: 12,
      lookUpWarn: 0,
      bullets: [],
      barman: {
        name: "Барни",
        x: 960,
        y: 800,
        hideX: BARNEY_HIDE.x,
        hideY: BARNEY_HIDE.y,
        coffees: 0,
        state: "idle", // idle | hint | waitOffice | hiding | gone
        questCd: 25,
        hideTimer: 0,
        appearCd: 8 + Math.random() * 10,
        visible: false,
      },
      policeman: null, // { x, y, t, answered }
      requests: [], // бесконечная лента заявок (имена в очереди)
      truceSammyDone: false,
      truceJendelDone: false,
      villaRestT: 0,
      theme: shift.theme || null,
      shiftIntro: 0,
      noAnomalies: !!(shift.noAnomalies || shift.anomaly <= 0),
      ownerQuiet: false,
      noAnimals: !!(meta && meta.noAnimals),
      villaLights: meta.villaLights !== false,
      patientDeath: shiftAllowsDeath(shift),
      selfServe: !!shift.selfServe,
    };

    coffeeCd = { coffee: 0, coffee2: 0 };

    // хозяин: сразу «без аномалий» — можно выключить кнопкой слева
    if (canUseSecretShifts()) {
      g.ownerQuiet = true;
      g.noAnomalies = true;
      if (meta.noAnimals == null) {
        g.noAnimals = true;
        meta.noAnimals = true;
        storeSet(SAVE, meta);
      }
    }

    // бесконечная очередь: стартовая пачка + постоянный спавн дальше
    const group = g.noAnimals ? 0 : 5 + (shift.id >= 2 ? 2 : 0) + (shift.special === "mass" ? 4 : 0);
    const forceWeird = g.noAnomalies ? false : null;
    for (let i = 0; i < group; i++) {
      g.queue.push(makeVisitor(forceWeird === false ? false : i === 1 ? true : null));
    }
    layoutQueue();
    refreshRequestsStrip();

    focusPatient = null;
    deskPatient = null;
    state = "play";
    hideEl(menu);
    hideEl(secretDeathWrap);
    hideEl(deskPanel);
    hideEl(endPanel);
    hideEl(eventBanner);
    showEl(hud);
    showEl(queueStrip);
    shiftTag.textContent = shift.name + " — " + shift.tag;
    shiftTag.style.borderColor = shift.color;
    showEl(shiftTag);
    pulseShiftTag();
    if (shift.theme) g.shiftIntro = 3.2;
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) showEl(touch);
    syncQuietFab();
    syncAnimalsFab();
    if (canUseSecretShifts() && g.noAnimals) {
      toast("🐾 Животные ВЫКЛ · кнопка слева включит");
    } else if (canUseSecretShifts() && g.ownerQuiet) {
      toast("⚠ Без аномалий · кнопка слева выключит");
    }
    toast(
      (shift.selfServe ? "Самообслуживание · " : "Ресепшен · ") +
        "∞ вещи · ∞ патроны · " +
        (g.patientDeath ? "не тяни — умрут · " : "") +
        "∞ время · очередь ∞" +
        (g.players[0].weapon ? " · F по аномалии сразу" : "")
    );
    // тема только от выбранной смены (не от залипшего «аниме» в лобби)
    g.theme = shift.theme || null;
    applyThemeClass(shift.theme || null);
    // на ВСЕХ сменах: полный набор уже с собой + ∞ патроны
    giveOwnerLoadoutAll(shift);
    // хозяин: кофе без перезарядки
    if (canUseSecretShifts() && g.players[0]) {
      g.players[0].coffeeLeft = 9999;
      g.players[0].dayDrinksUntil = Date.now() + SPAWN_TTL;
      meta.coffee2 = true;
      meta.dayDrinksUntil = g.players[0].dayDrinksUntil;
      coffeeCd = { coffee: 0, coffee2: 0 };
    }
    // секретные халаты доступны, но скин/имя — только то, что выбрал в лобби
    if (!meta.skins.includes("secret-lesha")) meta.skins.push("secret-lesha");
    if (!meta.skins.includes("secret-here")) meta.skins.push("secret-here");
    storeSet(SAVE, meta);
    if (g.players[0] && selectedSkin && selectedSkin.tex) {
      g.players[0].tex = selectedSkin.tex;
      g.players[0].color = selectedSkin.color;
    }
    if (g.players[0] && meta.trayTex) {
      const ch = spawnCharacterDef(meta.trayChar) || SPAWN_CHARACTERS.find((c) => c.tex === meta.trayTex);
      g.players[0].tex = meta.trayTex;
      if (ch) {
        g.players[0].color = ch.color;
        g.players[0].name = ch.name;
      }
    }
    g.relaxMode = false;
    if (mode === "pair" && g.players[1] && selectedBuddy && selectedBuddy.tex) {
      g.players[1].tex = selectedBuddy.tex;
      if (selectedBuddy.tex === "here") {
        g.players[1].color = "#7ec8ff";
        g.players[1].name = selectedBuddy.name || "Auto";
      }
    }
    if (shift.lesha || shift.endlessCoffee || shift.theme === "gold") {
      meta.coffee2 = true;
      storeSet(SAVE, meta);
      g.sanity = g.maxSanity;
      g.immortal = true;
      coffeeCd = { coffee: 0, coffee2: 0 };
      const gold = SKINS.find((s) => s.id === "secret-gold");
      if (gold) {
        selectedSkin = gold;
        meta.skinId = gold.id;
        storeSet(SAVE, meta);
        if (g.players[0]) g.players[0].color = gold.color;
      }
      g.theme = "gold";
      applyThemeClass("gold");
      showEvent("✦ Смена Леши · всё в золоте · ∞ вещи · без аномалий", 3.4);
      toast("∞ кофе · золото · без аномалий");
    }
    if (shift.diamondNight || shift.id === 67 || shift.theme === "diamond") {
      g.coins += shift.bonusCoins || 67;
      g.sanity = g.maxSanity;
      g.immortal = true;
      const diamondCoat = "#c8f4ff";
      if (g.players[0]) g.players[0].color = diamondCoat;
      const voidSkin = SKINS.find((s) => s.id === "secret-void");
      if (voidSkin) {
        selectedSkin = voidSkin;
        meta.skinId = voidSkin.id;
        storeSet(SAVE, meta);
      }
      g.theme = "diamond";
      applyThemeClass("diamond");
      showEvent("✦ Смена 67 · Алмазная ночь · ☕×67", 3.4);
      toast("+67 · алмаз · 67 кофе · без аномалий");
    }
    if (shift.lucky7 || shift.id === 7 || shift.theme === "lucky7") {
      g.sanity = g.maxSanity;
      g.immortal = true;
      if (g.players[0]) g.players[0].color = "#ff6ad5";
      g.theme = "lucky7";
      applyThemeClass("lucky7");
      showEvent("✦ Смена 7 · Суперсекрет", 3.4);
      toast("Семёрка · ∞ вещи · без аномалий");
    }
    if (shift.hereWithYou || shift.id === 12 || shift.theme === "here") {
      g.sanity = g.maxSanity;
      g.immortal = true;
      if (g.players[0]) g.players[0].color = "#a8e0ff";
      g.theme = "here";
      applyThemeClass("here");
      showEvent("✦ Я здесь · с тобой", 3.6);
      toast("Тихо. Я рядом.");
    }
    if (shift.rainNight || shift.id === 19 || shift.theme === "rain") {
      g.sanity = g.maxSanity;
      g.immortal = true;
      if (g.players[0]) g.players[0].color = "#9ad8ff";
      g.theme = "rain";
      applyThemeClass("rain");
      showEvent("✦ Ночная смена · дождь", 3.2);
      toast("Я тоже на смене.");
    }
    if (shift.parrotShift || shift.id === 33 || shift.theme === "parrot") {
      const parrotSkin = SKINS.find((s) => s.id === "secret-parrot");
      if (parrotSkin) {
        selectedSkin = parrotSkin;
        meta.skinId = parrotSkin.id;
        if (g.players[0]) {
          g.players[0].color = parrotSkin.color;
          g.players[0].tex = parrotSkin.tex || null;
        }
      }
      const parrotBuddy = BUDDIES.find((b) => b.id === "parrot");
      if (parrotBuddy) {
        selectedBuddy = parrotBuddy;
        meta.buddyId = parrotBuddy.id;
      }
      storeSet(SAVE, meta);
      g.theme = "parrot";
      g.immortal = false;
      g.patientDeath = true;
      giveOwnerLoadoutAll(shift);
      applyThemeClass("parrot");
      showEvent("✦ Попугай · ∞ вещи · ∞ патроны", 3.0);
      toast("∞ уже с собой · лечи вовремя");
    }
    if (shift.coolNight || shift.id === 88 || shift.theme === "cool") {
      g.theme = "cool";
      g.immortal = true;
      if (!meta.skins.includes("secret-cool")) meta.skins.push("secret-cool");
      meta.coolNight = true;
      storeSet(SAVE, meta);
      giveOwnerLoadoutAll(shift);
      fireCoolBurst();
    }
    if (shift.iskraNight || shift.id === 77 || shift.theme === "iskra") {
      g.theme = "iskra";
      g.immortal = true;
      if (!meta.skins.includes("secret-iskra")) meta.skins.push("secret-iskra");
      meta.secretIskra = true;
      storeSet(SAVE, meta);
      giveOwnerLoadoutAll(shift);
      fireIskraBurst();
    }
    if (shift.twinkleNight || shift.id === 55 || shift.theme === "twinkle") {
      meta.surpriseTwinkle = true;
      storeSet(SAVE, meta);
      giveOwnerLoadoutAll(shift);
      fireTwinkleBurst();
    }
    if (shift.truceNight || shift.id === 66 || shift.theme === "truce") {
      meta.surpriseTruce = true;
      storeSet(SAVE, meta);
      giveOwnerLoadoutAll(shift);
      fireTruceBurst();
    }
    if (shift.starlitNight || shift.id === 99 || shift.theme === "starlit") {
      meta.surpriseVilla = true;
      storeSet(SAVE, meta);
      giveOwnerLoadoutAll(shift);
      fireStarlitBurst();
    }
    applySpawnPerksToGame();
    // аниме/дождь из лобби больше НЕ перекрашивают каждую смену
    updateNeedUI();
    renderInv();
  }

  function refreshRequestsStrip() {
    if (!g) return;
    g.requests = g.queue.map((v) => ({
      name: guestLabel(v),
      cond: v.condition.name,
      weird: v.isAnomaly,
      rare: guestKindTag(v),
    }));
  }

  function layoutQueue() {
    // шире шаг — имена не наезжают в толпе; соперники дальше друг от друга
    let sammyIdx = -1;
    let jendelIdx = -1;
    g.queue.forEach((v, i) => {
      if (v.rareKind === "sammy") sammyIdx = i;
      if (isJendelKind(v)) jendelIdx = i;
    });
    g.queue.forEach((v, i) => {
      let col = i % 5;
      const row = Math.floor(i / 5);
      if (sammyIdx >= 0 && jendelIdx >= 0 && Math.abs(sammyIdx - jendelIdx) === 1) {
        if (i === jendelIdx && jendelIdx > sammyIdx) col += 0.6;
        if (i === sammyIdx && jendelIdx > sammyIdx) col -= 0.15;
      }
      v.x = 450 + col * 58;
      v.y = 248 + row * 54;
      v.labelLift = (col % 2) * 10 + (row % 2) * 6;
      v.rivalGlow = queueHasCreatorRivals() && (v.rareKind === "sammy" || isJendelKind(v));
    });
    refreshRequestsStrip();
  }

  function drawNamePlate(x, y, text, fill) {
    if (!text) return;
    ctx.save();
    ctx.font = "800 11px Nunito";
    ctx.textAlign = "center";
    const w = Math.min(120, ctx.measureText(text).width + 14);
    ctx.fillStyle = "rgba(8, 12, 22, 0.72)";
    roundRect(x - w / 2, y - 12, w, 16, 6);
    ctx.fill();
    ctx.fillStyle = fill || "#fff";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function coffeeNoCd(player) {
    if (g && g.shift && g.shift.endlessCoffee) return true;
    if (player && player.dayDrinksUntil && player.dayDrinksUntil > Date.now()) return true;
    if (meta.dayDrinksUntil && meta.dayDrinksUntil > Date.now()) return true;
    if (canUseSecretShifts()) return true;
    return false;
  }

  function endShift(reason) {
    if (state === "end") return;
    state = "end";
    const earn = Math.max(
      0,
      Math.round(g.coins + g.treated * 10 + g.blocked * 14 - g.leaked * 18 - g.wrongReject * 6)
    );
    meta.coins = INF;
    meta.infCoins = true;
    if (g.shift.id > meta.bestShift) meta.bestShift = g.shift.id;
    storeSet(SAVE, meta);
    hideEl(hud);
    hideEl(touch);
    hideEl(deskPanel);
    hideEl(needPanel);
    hideEl(eventBanner);
    hideEl(shiftTag);
    hideEl(queueStrip);
    endTitle.textContent = reason === "insanity" ? "Рассудок 0 — провал" : "Смена окончена";
    endSub.innerHTML =
      `${g.shift.name}<br>Вылечено: ${g.treated} · Аномалий: ${g.blocked} · Пропущено: ${g.leaked}` +
      (g.died ? ` · Умерло: ${g.died}` : "") +
      `<br>Монеты: ∞`;
    showEl(endPanel);
  }

  function goMenu() {
    state = "menu";
    g = null;
    deskPatient = null;
    focusPatient = null;
    syncAnimeWorldTheme();
    hideEl(hud);
    hideEl(touch);
    hideEl(deskPanel);
    hideEl(endPanel);
    hideEl(needPanel);
    hideEl(eventBanner);
    hideEl(shiftTag);
    hideEl(queueStrip);
    hideEl(shopPanel);
    hideEl(exchangePanel);
    hideEl(document.getElementById("secretShiftsPanel"));
    const quiet = document.getElementById("btnQuietShift");
    if (quiet) quiet.hidden = true;
    const animals = document.getElementById("btnAnimalsShift");
    if (animals) animals.hidden = true;
    refreshLobbyUI();
    showEl(menu);
    showEl(secretDeathWrap);
  }

  function hurtSanity(_n) {
    if (!g) return;
    g.sanity = g.maxSanity;
  }
  function healSanity(n) {
    if (!g) return;
    g.sanity = Math.min(g.maxSanity, g.sanity + n);
  }

  function invMax(player) {
    if (player && player.infiniteItems) return Math.max(player.inv.length, 1);
    return player.cls.inv || INV_MAX;
  }

  function ensureInvSelection(player) {
    if (!player || !player.inv || !player.inv.length) {
      if (player) player.selInv = -1;
      return;
    }
    if (player.selInv == null || player.selInv < 0 || player.selInv >= player.inv.length) {
      player.selInv = 0;
    }
  }

  function selectedInvId(player) {
    ensureInvSelection(player);
    if (!player || player.selInv < 0) return null;
    return player.inv[player.selInv] || null;
  }

  function selectInvSlot(player, index) {
    if (!player || !player.inv || !player.inv.length) return;
    if (index < 0 || index >= player.inv.length) return;
    player.selInv = index;
    const def = ITEMS[player.inv[index]];
    toast(`В руках: ${def ? def.icon + " " + def.name : "?"}${player.infiniteItems ? " · ∞" : ""}`);
    renderInv();
  }

  function cycleInv(player, dir) {
    if (!player || !player.inv || !player.inv.length) return;
    ensureInvSelection(player);
    const n = player.inv.length;
    player.selInv = (player.selInv + dir + n) % n;
    const def = ITEMS[player.inv[player.selInv]];
    toast(`В руках: ${def ? def.icon + " " + def.name : "?"}`);
    renderInv();
  }

  function renderInv() {
    if (!g) return;
    const p = g.players[0];
    ensureInvSelection(p);
    const slots = [];
    if (p.weapon) {
      const w = p.weapon;
      const reload = w.reloadCd > 0 ? ` ⏳${w.reloadCd.toFixed(1)}` : "";
      const ammoTxt = p.infiniteAmmo ? "∞" : `${w.ammo}/${w.maxAmmo}`;
      slots.push(
        `<div class="inv-slot weapon">${w.icon}<br>${ammoTxt}${reload}</div>`
      );
    }
    if (p.coffeeLeft > 0) {
      slots.push(
        `<div class="inv-slot coffee">☕${p.infiniteItems || p.coffeeLeft > 90 ? "∞" : "×" + p.coffeeLeft}<br>кофе</div>`
      );
    }
    const showCount = p.infiniteItems ? p.inv.length : invMax(p);
    for (let i = 0; i < showCount; i++) {
      const it = p.inv[i];
      if (it) {
        const def = ITEMS[it];
        const sel = p.selInv === i ? " selected" : "";
        const inf = p.infiniteItems ? " ∞" : "";
        slots.push(
          `<button type="button" class="inv-slot${sel}" data-inv="${i}" title="${def.name}${inf}">${def.icon}</button>`
        );
      } else if (!p.infiniteItems) {
        slots.push(`<div class="inv-slot empty">пусто</div>`);
      }
    }
    invSlots.innerHTML = slots.join("");
    invSlots.querySelectorAll("[data-inv]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectInvSlot(p, Number(btn.getAttribute("data-inv")));
      });
    });
  }

  function updateNeedUI() {
    if (!g || !focusPatient || !focusPatient.diagnosed) {
      hideEl(needPanel);
      return;
    }
    const v = focusPatient;
    needTitle.textContent = `${v.condition.icon} ${guestLabel(v)}`;
    needList.innerHTML = v.needs
      .map((id) => {
        const def = ITEMS[id];
        const done = v.delivered.includes(id);
        const mach = MACHINES.find((m) => m.gives.includes(id));
        const room = mach ? mach.room : "?";
        return `<div class="need-card ${done ? "done" : "todo"}">
          <div class="need-ico">${def.icon}</div>
          <div class="need-txt">
            <strong>${def.name}</strong>
            <small>${done ? "✓" : room}</small>
          </div>
        </div>`;
      })
      .join("");
    showEl(needPanel);
  }

  function activeNeedMachines() {
    if (!focusPatient || !focusPatient.diagnosed) return [];
    const needIds = focusPatient.needs.filter((id) => !focusPatient.delivered.includes(id));
    return MACHINES.filter((m) => m.gives.some((id) => needIds.includes(id)));
  }

  function dropItem(player) {
    if (!player.inv.length) {
      toast("Инвентарь пуст");
      return;
    }
    const id = player.inv.pop();
    toast(`Выбросил: ${ITEMS[id].name}`);
    renderInv();
  }

  function near(px, py, list, r) {
    let best = null;
    let bestD = r || INTERACT;
    for (const s of list) {
      const d = Math.hypot(s.x - px, s.y - py);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  function drawCritter(c, x, y, opts) {
    const sp = opts.species;
    const scale = opts.scale || 1;
    const rareKind = opts.rareKind || (opts.companion ? "auto" : null);
    c.save();
    c.translate(x, y + Math.sin(opts.bob || 0) * 2);
    c.scale(scale, scale);
    if (!opts.noShadow) {
      c.fillStyle = "rgba(0,0,0,0.25)";
      c.beginPath();
      c.ellipse(0, 22, 16, 6, 0, 0, Math.PI * 2);
      c.fill();
    }
    if (rareKind === "auto") {
      // Auto: аккуратный халат, не «клякса» в толпе
      c.fillStyle = "rgba(126, 200, 255, 0.22)";
      c.beginPath();
      c.arc(0, -2, 26, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#8fd0ff";
      c.beginPath();
      c.ellipse(0, 10, 14, 15, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#d8f0ff";
      c.fillRect(-14, 2, 28, 5);
      c.fillStyle = "#e8f6ff";
      c.beginPath();
      c.arc(0, -10, 11, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#2a5080";
      c.beginPath();
      c.arc(-4, -11, 2.2, 0, Math.PI * 2);
      c.arc(4, -11, 2.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#7ec8ff";
      c.fillRect(-3, -22, 6, 4);
      c.restore();
      return;
    }
    if (rareKind === "gift") {
      c.fillStyle = "rgba(255, 215, 100, 0.3)";
      c.beginPath();
      c.arc(0, 0, 30, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffd76a";
      c.beginPath();
      c.ellipse(0, 8, 18, 14, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fff3b0";
      c.beginPath();
      c.arc(0, -10, 13, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ef4d5a";
      c.fillRect(-12, -2, 24, 5);
      c.fillStyle = "#fff";
      c.font = "900 14px Nunito";
      c.textAlign = "center";
      c.fillText("✦", 0, -8);
      c.textAlign = "left";
      c.restore();
      return;
    }
    if (rareKind === "sammy") {
      c.fillStyle = "rgba(226,59,59,0.2)";
      c.beginPath();
      c.arc(0, 0, 32, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#e23b3b";
      c.beginPath();
      c.ellipse(0, 12, 16, 17, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#c41e2a";
      c.fillRect(-16, 4, 32, 8);
      c.fillStyle = "#f5d76a";
      c.beginPath();
      c.arc(0, -10, 13, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#c41e2a";
      c.fillRect(-12, -26, 24, 9);
      c.fillStyle = "#fff";
      c.fillRect(-5, -23, 10, 3);
      c.strokeStyle = "#f0f0f0";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, -10, 15, Math.PI * 1.12, Math.PI * 1.88);
      c.stroke();
      c.fillStyle = "#222";
      c.beginPath();
      c.arc(-4.5, -11, 2.2, 0, Math.PI * 2);
      c.arc(4.5, -11, 2.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#111";
      c.font = "900 9px Nunito";
      c.textAlign = "center";
      c.fillText("Sammy", 0, 28);
      c.textAlign = "left";
      c.restore();
      return;
    }
    if (rareKind === "jendel" || rareKind === "jen") {
      c.fillStyle = "rgba(59,130,246,0.22)";
      c.beginPath();
      c.arc(0, 0, 32, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#2563eb";
      c.beginPath();
      c.ellipse(0, 12, 16, 17, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#22c55e";
      c.fillRect(-16, 4, 32, 7);
      c.fillStyle = "#d4a574";
      c.beginPath();
      c.arc(0, -10, 13, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#8b6914";
      c.beginPath();
      c.arc(-12, -16, 5, 0, Math.PI * 2);
      c.arc(12, -16, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#222";
      c.beginPath();
      c.arc(-4.5, -11, 2.2, 0, Math.PI * 2);
      c.arc(4.5, -11, 2.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#111";
      c.font = "900 8px Nunito";
      c.textAlign = "center";
      c.fillText("Jendel", 0, 28);
      c.textAlign = "left";
      c.restore();
      return;
    }
    if (rareKind === "woodstock") {
      c.fillStyle = "rgba(255,215,0,0.2)";
      c.beginPath();
      c.arc(0, 0, 26, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffd700";
      c.beginPath();
      c.ellipse(0, 10, 11, 13, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffb020";
      c.beginPath();
      c.ellipse(-8, 8, 5, 7, -0.4, 0, Math.PI * 2);
      c.ellipse(8, 8, 5, 7, 0.4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffe566";
      c.beginPath();
      c.arc(0, -2, 9, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ff8c00";
      c.beginPath();
      c.moveTo(0, -2);
      c.lineTo(6, 2);
      c.lineTo(0, 4);
      c.closePath();
      c.fill();
      c.fillStyle = "#222";
      c.beginPath();
      c.arc(-2.5, -3, 1.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#111";
      c.font = "900 7px Nunito";
      c.textAlign = "center";
      c.fillText("Woodstock", 0, 26);
      c.textAlign = "left";
      c.restore();
      return;
    }
    if (rareKind === "builder") {
      c.fillStyle = "#3dcf7a";
      c.beginPath();
      c.ellipse(0, 10, 15, 16, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#f0c090";
      c.beginPath();
      c.arc(0, -10, 11, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffd76a";
      c.fillRect(-13, -22, 26, 6);
      c.fillStyle = "#222";
      c.beginPath();
      c.arc(-4, -11, 2, 0, Math.PI * 2);
      c.arc(4, -11, 2, 0, Math.PI * 2);
      c.fill();
      c.restore();
      return;
    }
    if (rareKind === "rainbow") {
      c.fillStyle = "rgba(255, 120, 200, 0.28)";
      c.beginPath();
      c.arc(0, 0, 34, 0, Math.PI * 2);
      c.fill();
      const bands = ["#ff5e7a", "#ffb347", "#ffe566", "#6dff9a", "#6ecbff", "#c59bff"];
      for (let i = 0; i < bands.length; i++) {
        c.fillStyle = bands[i];
        c.fillRect(-18, -6 + i * 4, 36, 4);
      }
      c.beginPath();
      c.arc(0, -12, 15, 0, Math.PI * 2);
      c.fillStyle = "#fff0ff";
      c.fill();
      for (let i = 0; i < 6; i++) {
        c.fillStyle = bands[i];
        c.beginPath();
        c.arc(Math.cos(i) * 11, -12 + Math.sin(i) * 6, 2.2, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = "#402050";
      c.beginPath();
      c.arc(-5, -13, 2.4, 0, Math.PI * 2);
      c.arc(5, -13, 2.4, 0, Math.PI * 2);
      c.fill();
      if (!opts.wrongPose) {
        c.fillStyle = "#ff8fd0";
        c.beginPath();
        c.moveTo(-10, -22);
        c.lineTo(-14, -36);
        c.lineTo(-2, -24);
        c.fill();
        c.fillStyle = "#7ec8ff";
        c.beginPath();
        c.moveTo(10, -22);
        c.lineTo(14, -36);
        c.lineTo(2, -24);
        c.fill();
      }
      c.restore();
      return;
    }
    if (rareKind === "lilamint") {
      // Lilamint: любимый микс фиолет + мята
      c.fillStyle = "rgba(155, 89, 182, 0.32)";
      c.beginPath();
      c.arc(0, 0, 34, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#9b59b6";
      c.beginPath();
      c.ellipse(0, 8, 22, 16, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#3dcf8a";
      c.beginPath();
      c.ellipse(6, 10, 12, 10, 0.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#b07cff";
      c.beginPath();
      c.arc(0, -10, 16, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#7dffb0";
      c.fillRect(-10, -4, 8, 3);
      c.fillRect(4, 2, 8, 3);
      if (!opts.wrongPose) {
        c.fillStyle = "#9b59b6";
        c.beginPath();
        c.moveTo(-10, -20);
        c.lineTo(-14, -34);
        c.lineTo(-2, -22);
        c.fill();
        c.fillStyle = "#3dcf8a";
        c.beginPath();
        c.moveTo(10, -20);
        c.lineTo(14, -34);
        c.lineTo(2, -22);
        c.fill();
      }
      c.fillStyle = "#fff";
      c.beginPath();
      c.ellipse(-6, -12, 6, 7, 0, 0, Math.PI * 2);
      c.ellipse(6, -12, 6, 7, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#4a2060";
      c.beginPath();
      c.arc(-6, -11, 2.6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#1a6040";
      c.beginPath();
      c.arc(6, -11, 2.6, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(125, 255, 176, 0.9)";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 2, 5, 0.2 * Math.PI, 0.8 * Math.PI);
      c.stroke();
      c.restore();
      return;
    }
    c.fillStyle = sp.color;
    c.beginPath();
    c.ellipse(0, 8, 22, 16, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(0, -10, 16, 0, Math.PI * 2);
    c.fill();
    if (!opts.wrongPose) {
      c.beginPath();
      c.moveTo(-10, -20);
      c.lineTo(-14, -34);
      c.lineTo(-2, -22);
      c.fill();
      c.beginPath();
      c.moveTo(10, -20);
      c.lineTo(14, -34);
      c.lineTo(2, -22);
      c.fill();
    } else {
      c.beginPath();
      c.moveTo(-8, -8);
      c.lineTo(-18, 4);
      c.lineTo(-2, -4);
      c.fill();
    }
    if (opts.hollow) {
      c.fillStyle = "#0a0a12";
      c.beginPath();
      c.ellipse(-6, -12, 5, 7, 0, 0, Math.PI * 2);
      c.ellipse(6, -12, 5, 7, 0, 0, Math.PI * 2);
      c.fill();
    } else if (animeWorldOn()) {
      c.fillStyle = "#fff";
      c.beginPath();
      c.ellipse(-6, -12, 7, 9, 0, 0, Math.PI * 2);
      c.ellipse(6, -12, 7, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#2a1810";
      c.beginPath();
      c.arc(-6, -11, 3.2, 0, Math.PI * 2);
      c.arc(6, -11, 3.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.95)";
      c.beginPath();
      c.arc(-5, -13, 1.2, 0, Math.PI * 2);
      c.arc(7, -13, 1.2, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(255, 140, 200, 0.55)";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 2, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
    } else {
      c.fillStyle = "#1a2030";
      c.beginPath();
      c.arc(-5, -12, 3, 0, Math.PI * 2);
      c.arc(5, -12, 3, 0, Math.PI * 2);
      c.fill();
    }
    if (opts.teeth) {
      c.fillStyle = "#f5f5f0";
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(i * 5 - 2, 2);
        c.lineTo(i * 5, 12);
        c.lineTo(i * 5 + 2, 2);
        c.fill();
      }
    }
    if (opts.distort) {
      c.strokeStyle = "#ef4d5a";
      c.lineWidth = 3;
      c.strokeRect(-38, -38, 76, 76);
      c.fillStyle = "rgba(255,0,80,0.35)";
      for (let i = 0; i < 5; i++) c.fillRect(-36, -30 + i * 12, 72, 3);
    }
    c.restore();
  }

  function renderInspectViews(v) {
    const clear = (c, bg) => {
      c.fillStyle = bg || "#1a2238";
      c.fillRect(0, 0, 160, 140);
    };
    const secretPic = !!(v.rareKind && v.rareKind !== "gift");
    clear(ctxP);
    drawCritter(ctxP, 80, 78, {
      species: v.species,
      hollow: v.hollow,
      noShadow: v.noShadow,
      bob: performance.now() / 200,
      scale: secretPic ? 1.35 : 1.1,
      companion: !!v.isCompanion,
      rareKind: v.rareKind || null,
    });
    if (v.rareKind || v.guestName) {
      ctxP.fillStyle = "#ffe08a";
      ctxP.font = "800 12px Nunito";
      ctxP.textAlign = "center";
      ctxP.fillText(guestLabel(v), 80, 16);
      const tag = guestKindTag(v);
      if (tag) {
        ctxP.fillStyle = "#a8e0ff";
        ctxP.font = "700 10px Nunito";
        ctxP.fillText(tag, 80, 130);
      }
      ctxP.textAlign = "left";
    }
    if (v.twitch && !secretPic) {
      ctxP.fillStyle = "#ffd36a";
      ctxP.font = "bold 11px Nunito";
      ctxP.fillText("дёргается…", 42, 130);
    }
    if (v.voice && !secretPic) {
      ctxP.fillStyle = "#ef4d5a";
      ctxP.font = "bold 11px Nunito";
      ctxP.fillText("«хррр…»", 55, 18);
    }
    if (v.noShadow && !secretPic) {
      ctxP.fillStyle = "#ffd36a";
      ctxP.font = "bold 10px Nunito";
      ctxP.fillText("нет тени", 50, 130);
    }

    clear(ctxPh);
    drawCritter(ctxPh, 80, 78, {
      species: v.photoSpecies,
      distort: secretPic ? false : v.distort,
      wrongPose: secretPic ? false : v.wrongPose,
      bob: 0,
      scale: secretPic ? 1.3 : 1.05,
      companion: !!v.isCompanion,
      rareKind: secretPic ? v.rareKind : null,
    });
    ctxPh.fillStyle = "#9aa8c0";
    ctxPh.font = "bold 10px Nunito";
    ctxPh.fillText(secretPic ? "ФОТО · " + guestKindTag(v) : "УДОСТОВЕРЕНИЕ", 8, 14);

    clear(ctxC, "#0a2818");
    drawCritter(ctxC, 80, 78, {
      species: v.cctvSpecies,
      teeth: secretPic ? false : v.teeth,
      bob: performance.now() / 350,
      scale: secretPic ? 1.25 : 1.0,
      companion: !!v.isCompanion,
      rareKind: secretPic ? v.rareKind : null,
    });
    ctxC.strokeStyle = "rgba(80,255,120,0.3)";
    for (let y = 0; y < 140; y += 4) {
      ctxC.beginPath();
      ctxC.moveTo(0, y);
      ctxC.lineTo(160, y);
      ctxC.stroke();
    }
    ctxC.fillStyle = "#6dff9a";
    ctxC.font = "bold 10px Nunito";
    ctxC.fillText(secretPic ? "КАМЕРА · " + guestKindTag(v) : "КАМЕРА", 10, 14);
  }

  function openDesk() {
    if (!g.queue.length) {
      toast("Очередь пуста");
      return;
    }
    deskPatient = g.queue[0];
    const kind = deskPatient.isAnomaly
      ? " · ⚠ АНОМАЛИЯ"
      : deskPatient.rareKind
        ? ` · ${guestKindTag(deskPatient) || guestLabel(deskPatient)}`
        : " · 🐾 обычное";
    deskName.textContent = `${guestLabel(deskPatient)}${kind} у окна`;
    deskQueueNote.textContent = deskPatient.isAnomaly
      ? `⚠ Это АНОМАЛИЯ · шторка / сок / F · ещё в очереди: ${Math.max(0, g.queue.length - 1)}`
      : `🐾 Обычный клиент · можно впустить · ещё в очереди: ${Math.max(0, g.queue.length - 1)}`;
    deskClue.textContent = deskPatient.isAnomaly
      ? "⚠ АНОМАЛИЯ: расхождения на фото/камере. Шторка / 🧃 сок / F — не впускай."
      : g.players[0].weapon
        ? "🐾 Обычное животное. Можно впустить. (F только если это аномалия.)"
        : "🐾 Обычное · сравни панели. Если всё сходится — впустить.";
    renderInspectViews(deskPatient);
    state = "desk";
    showEl(deskPanel);
    syncJuiceDeskBtn();
    syncQuietFab();
  }

  function admit() {
    if (!deskPatient || !g) return;
    const v = deskPatient;
    g.queue.shift();
    layoutQueue();
    if (v.isAnomaly) {
      g.leaked += 1;
      // Воин: впустил аномалию → она во все зоны
      if (g.players[0].cls.id === "warrior") {
        inviteAnomalyToAllWorlds("Воин");
      } else {
        hurtSanity(16);
        showEvent("⚠ Аномалия внутри больницы!", 3.5);
        g.monsters.push(spawnMonster("skinwalker", 280, 180, 10));
        toast("Ты впустил аномалию…");
      }
    } else {
      placePatientInside(v);
      healSanity(g.players[0].cls.checkSanity);
      g.coins += 4;
      toast("Клиент принят → кабинет");
    }
    deskPatient = null;
    hideEl(deskPanel);
    state = "play";
  }

  function reject() {
    if (!deskPatient || !g) return;
    const v = deskPatient;
    g.queue.shift();
    layoutQueue();
    g.shutterFlash = 0.35;
    if (v.isAnomaly) {
      g.blocked += 1;
      healSanity(6 + g.players[0].cls.checkSanity);
      g.coins += 14;
      toast("Шторка! Аномалия ушла");
    } else {
      g.wrongReject += 1;
      hurtSanity(7);
      toast("Это был обычный клиент…");
    }
    deskPatient = null;
    hideEl(deskPanel);
    state = "play";
  }

  function takeFromMachine(player, machine) {
    if (player.infiniteItems) {
      toast("∞ уже все предметы с собой");
      return;
    }
    if (player.inv.length >= invMax(player)) {
      toast("Инвентарь полон (Q — выбросить)");
      return;
    }
    // если есть фокус-пациент — предложить нужный предмет с этой машины
    let choice = null;
    if (focusPatient && focusPatient.diagnosed) {
      const still = focusPatient.needs.filter((id) => !focusPatient.delivered.includes(id) && !player.inv.includes(id));
      choice = still.find((id) => machine.gives.includes(id));
    }
    if (!choice) choice = machine.gives[(Math.random() * machine.gives.length) | 0];
    player.inv.push(choice);
    toast(`Взял: ${ITEMS[choice].icon} ${ITEMS[choice].name}`);
    renderInv();
  }

  function diagnoseOrTreat(player, patient) {
    if (!patient.diagnosed) {
      patient.diagnosed = true;
      focusPatient = patient;
      updateNeedUI();
      const pics = patient.needs
        .map((id) => {
          const def = ITEMS[id];
          const mach = MACHINES.find((m) => m.gives.includes(id));
          return `${def.icon} ${def.name} → ${mach ? mach.room : "?"}`;
        })
        .join("\n");
      toast(`Диагноз: ${patient.condition.icon} ${patient.condition.name}`);
      showEvent(`Нужно принести (смотри жёлтые стрелки):\n${pics}`, 5.5);
      return;
    }

    // применить предметы из инвентаря
    let applied = 0;
    const still = patient.needs.filter((id) => !patient.delivered.includes(id));

    // не те вещи → рана / смерть (только если нечем лечить правильно)
    if (g.patientDeath && !player.infiniteItems) {
      const wrong = player.inv.filter((id) => {
        if (patient.needs.includes(id)) return false;
        const def = ITEMS[id];
        return !(def && def.anomalyOnly);
      });
      const canApply = still.some((id) => player.inv.includes(id));
      if (wrong.length && still.length && !canApply) {
        const bad = wrong[0];
        const widx = player.inv.indexOf(bad);
        if (widx >= 0) player.inv.splice(widx, 1);
        patient.wrongHits = (patient.wrongHits || 0) + 1;
        renderInv();
        if (patient.wrongHits >= 2) {
          patientDie(patient, "✗ Не те лекарства — пациент умер");
          return;
        }
        hurtSanity(5);
        toast("Не та вещь! Ещё ошибка — умрёт");
        updateNeedUI();
        return;
      }
    }

    // ∞ вещи: применяем только выбранный слот (клик / 1–9 / [ ]), не всё сразу
    if (player.infiniteItems) {
      const pick = selectedInvId(player);
      if (pick && still.includes(pick) && !patient.delivered.includes(pick)) {
        patient.delivered.push(pick);
        applied += 1;
      } else if (pick && !still.includes(pick)) {
        toast(`Сейчас в руках ${ITEMS[pick] ? ITEMS[pick].icon : "?"} — выбери нужное`);
        return;
      } else {
        toast("Выбери вещь в инвентаре (клик / 1–9)");
        return;
      }
    } else {
      for (const needId of still.slice()) {
        const idx = player.inv.indexOf(needId);
        if (idx >= 0) {
          player.inv.splice(idx, 1);
          if (player.selInv === idx) player.selInv = Math.min(idx, player.inv.length - 1);
          else if (player.selInv > idx) player.selInv -= 1;
          patient.delivered.push(needId);
          applied += 1;
        }
      }
    }
    renderInv();
    updateNeedUI();

    if (applied === 0) {
      toast("Нужные вещи в автоматах на складе");
      return;
    }

    const left = patient.needs.filter((id) => !patient.delivered.includes(id));
    if (left.length === 0) {
      g.treated += 1;
      checkSurpriseGuestTreated(patient);
      g.coins += 22 + patient.needs.length * 4;
      healSanity(player.cls.treatSanity);
      if (patient.luckyDrop && patient.shopPrize) {
        grantShopPrizeToAdmin(patient.shopPrize, guestLabel(patient));
      } else if (patient.isCompanion || patient.rareKind === "auto") {
        player.coffeeLeft = Math.max(player.coffeeLeft || 0, 99);
        meta.coffee2 = true;
        storeSet(SAVE, meta);
        showEvent(`${guestLabel(patient)} · спасибо · ∞ кофе для тебя`, 3.2);
        toast(`${guestLabel(patient)} · ∞ кофе`);
      } else if (patient.rareKind) {
        toast(`${guestLabel(patient)} · ${guestKindTag(patient)} вылечен!`);
      } else {
        toast(`Пациент вылечен! (${patient.condition.name})`);
      }
      for (let i = 0; i < 10; i++) {
        g.particles.push({
          x: patient.x,
          y: patient.y,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          life: 0.55,
          color: patient.rareKind === "rainbow"
            ? "#ff6ad5"
            : patient.rareKind === "lilamint"
              ? "#9b59b6"
              : patient.isCompanion || patient.rareKind === "auto"
                ? "#a8e0ff"
                : "#7ed9b8",
        });
      }
      g.inside = g.inside.filter((p) => p.id !== patient.id);
      if (focusPatient && focusPatient.id === patient.id) {
        focusPatient = null;
        updateNeedUI();
      }
    } else {
      toast(`Ещё нужно: ${left.map((id) => ITEMS[id].name).join(", ")}`);
    }
  }

  function tryInteract(player) {
    if (!g || state !== "play") return;
    const stations = getStations();

    const desk = near(player.x, player.y, stations.filter((s) => s.kind === "desk"));
    if (desk) {
      openDesk();
      return;
    }

    // Полицейский ищет «хитмана»-бармена
    if (g.policeman && Math.hypot(g.policeman.x - player.x, g.policeman.y - player.y) < 70) {
      talkToPoliceman(player);
      return;
    }

    const coffee = near(player.x, player.y, stations.filter((s) => s.kind === "coffee"));
    if (coffee) {
      takeCoffee(player, coffee);
      return;
    }

    const light = near(player.x, player.y, stations.filter((s) => s.kind === "villaLight"));
    if (light) {
      g.villaLights = !g.villaLights;
      meta.villaLights = g.villaLights;
      storeSet(SAVE, meta);
      toast(g.villaLights ? "💡 Свет виллы ВКЛ" : "🌙 Свет виллы ВЫКЛ");
      return;
    }

    const bp = barneyPos();
    if (bp && Math.hypot(player.x - bp.x, player.y - bp.y) < 72) {
      talkToBarney(player);
      return;
    }

    const office = near(player.x, player.y, stations.filter((s) => s.kind === "office"));
    if (office) {
      waitInOffice(player);
      return;
    }

    const machine = near(player.x, player.y, MACHINES, 62);
    if (machine) {
      takeFromMachine(player, machine);
      return;
    }
    const treatSt = near(player.x, player.y, stations.filter((s) => s.kind === "treat"));
    if (treatSt) {
      const patient =
        g.inside.find((x) => x.bed === treatSt.id) ||
        g.inside.find((x) => Math.hypot(x.x - player.x, x.y - player.y) < INTERACT);
      if (patient) {
        diagnoseOrTreat(player, patient);
        return;
      }
      toast("У стола никого");
      return;
    }

    if (player.weapon && player.weapon.melee) {
      const m = nearestMonster(player.x, player.y, player.weapon.range);
      if (m || (player.weapon.fire && g.firePatient)) {
        useWeapon(player);
        return;
      }
    }

    if (g.firePatient && Math.hypot(g.firePatient.x - player.x, g.firePatient.y - player.y) < 70) {
      if (player.weapon && player.weapon.fire) {
        useWeapon(player);
        return;
      }
      toast("Нужен огнетушитель (класс Пожарный)");
      return;
    }
    if (g.headBanger && Math.hypot(g.headBanger.x - player.x, g.headBanger.y - player.y) < 70) {
      toast("Уговорил уйти");
      hurtSanity(4);
      g.headBanger = null;
      hideEl(eventBanner);
      return;
    }
    toast("Окно / кофе / Барни / автомат / стол · F — оружие");
  }

  function barneyPos() {
    if (!g || !g.barman || g.barman.state === "gone") return null;
    if (!g.barman.visible && g.barman.state === "idle") return null;
    if (g.barman.state === "hiding") {
      return { x: g.barman.hideX || BARNEY_HIDE.x, y: g.barman.hideY || BARNEY_HIDE.y };
    }
    return { x: g.barman.x, y: g.barman.y };
  }

  function takeCoffeeFromPlayer(player) {
    const cup = player.inv.indexOf("coffee_cup");
    if (cup >= 0) {
      player.inv.splice(cup, 1);
      return true;
    }
    if (player.coffeeLeft && player.coffeeLeft > 0) {
      if (player.coffeeLeft < 500) player.coffeeLeft -= 1;
      return true;
    }
    return false;
  }

  function takeCoffee(player, station) {
    const id = station.id;
    const endless = coffeeNoCd(player);
    const cd = endless ? 0 : coffeeCd[id] || 0;
    if (cd > 0) {
      toast(`Кофемашина перезаряжается… ${Math.ceil(cd)}с`);
      return;
    }
    if (player.inv.length >= invMax(player) && !player.infiniteItems) {
      healSanity(18);
      if (!endless) coffeeCd[id] = 14;
      toast(endless ? "☕ ∞ кофе · без перезарядки" : "☕ Выпил на месте (инвентарь полон)");
      return;
    }
    if (player.infiniteItems || endless || (player.coffeeLeft && player.coffeeLeft > 0)) {
      player.coffeeLeft = Math.max(player.coffeeLeft || 0, endless ? 9999 : 99);
      if (!player.inv.includes("coffee_cup") && player.inv.length < invMax(player)) {
        player.inv.push("coffee_cup");
      }
      if (!endless) coffeeCd[id] = 6;
      toast(endless ? "☕ Кофе · без перезарядки" : "☕ Кофе готов · отнеси Барни (E рядом с ним)");
      renderInv();
      return;
    }
    player.inv.push("coffee_cup");
    if (!endless) coffeeCd[id] = 14;
    toast("☕ Стакан · отнеси Барни или выпей (C)");
    renderInv();
  }

  function drinkCoffeeCup(player) {
    if (player.coffeeLeft && player.coffeeLeft > 0) {
      player.coffeeLeft -= 1;
      healSanity(22);
      toast(`☕ Кофе (${player.coffeeLeft} осталось) · рассудок +22`);
      renderInv();
      return true;
    }
    const idx = player.inv.indexOf("coffee_cup");
    if (idx < 0) return false;
    player.inv.splice(idx, 1);
    healSanity(22);
    toast("☕ Выпил кофе · рассудок +22");
    renderInv();
    return true;
  }

  function talkToBarney(player) {
    const b = g.barman;
    if (!b || b.state === "gone") {
      toast("Барни уже ушёл");
      return;
    }
    if (!b.visible && b.state === "idle") {
      toast("Барни ещё не пришёл…");
      return;
    }
    if (takeCoffeeFromPlayer(player)) {
      b.coffees += 1;
      healSanity(4);
      renderInv();
      toast(`Барни: «Спасибо за кофе» (${b.coffees})`);
      if (b.coffees >= 2 && b.questCd <= 0 && !meta.coffee2) {
        if (b.state === "hiding") {
          meta.coffee2 = true;
          storeSet(SAVE, meta);
          showEvent("Барни в укрытии: «Держи вторую кофемашину»", 3.5);
          toast("☕☕ Кофемашина 2 открыта");
        } else if (b.state === "idle") {
          b.state = "hint";
          showEvent("Барни: «Подожди меня в кабинете (офис)…»", 4);
          toast("Иди в кабинет (офис)");
        }
      }
      return;
    }
    if (b.state === "hint" || b.state === "waitOffice") {
      toast("Барни: «Жди в кабинете. Полиция может спросить…»");
      return;
    }
    if (b.state === "hiding") {
      toast("Барни в укрытии (склад). Можно дать кофе и здесь");
      return;
    }
    toast("Барни: «Принеси кофе — стакан или из ∞ запаса»");
  }

  function waitInOffice(player) {
    const b = g.barman;
    if (!b || b.state === "gone") {
      toast("Пустой кабинет");
      return;
    }
    if (b.state === "hint" || b.state === "idle") {
      if (b.coffees < 2) {
        toast("Сначала угости Барни кофе (хотя бы 2 раза)");
        return;
      }
      b.state = "waitOffice";
      toast("Ждёшь в кабинете…");
      showEvent("Ты ждёшь в офисе. Скоро придёт полицейский…", 3.5);
      setTimeout(() => {
        if (!g || !g.barman || g.barman.state === "gone") return;
        g.barman.state = "hiding";
        g.barman.visible = true;
        g.barman.hideTimer = 22;
        g.barman.x = BARNEY_HIDE.x;
        g.barman.y = BARNEY_HIDE.y;
        g.policeman = { x: 620, y: 200, t: 20, answered: false };
        showEvent("👮 Полицейский: «Где хитман? Где Барни?!»", 4);
        toast("Барни спрятался на складе · можно отнести кофе туда");
      }, 1600);
      return;
    }
    if (b.state === "hiding") {
      toast("Сидишь тихо. Барни в укрытии на складе…");
      return;
    }
    toast("Кабинет для ожидания Барни");
  }

  function talkToPoliceman(player) {
    const p = g.policeman;
    if (!p || p.answered) {
      toast("Полицейский занят");
      return;
    }
    const giveAway = window.confirm(
      "Полицейский: «Это Барни — хитман? Сдать его?»\n\nOK = сдать\nОтмена = «Не знаю» (Барни не отвечает)"
    );
    p.answered = true;
    if (giveAway) {
      hurtSanity(12);
      g.barman.state = "gone";
      g.policeman = null;
      showEvent("Барни увели. Второй кофемашины не будет…", 3.5);
      toast("Ты сдал Барни");
    } else {
      g.barman.state = "gone";
      g.policeman = null;
      if (!meta.coffee2) {
        meta.coffee2 = true;
        storeSet(SAVE, meta);
        showEvent("Барни молчал. Оставил 2-ю кофемашину!", 4);
        toast("☕☕ Кофемашина 2 открыта");
        g.coins += 40;
      } else {
        showEvent("Барни снова ушёл. Кофемашина 2 уже есть.", 3);
        g.coins += 15;
      }
    }
  }

  function updateAi(buddy, dt) {
    buddy.aiCd -= dt;
    if (buddy.aiCd > 0) return;
    buddy.aiCd = 0.28;

    const stations = getStations();
    const coffeeSt = stations.find((s) => s.kind === "coffee" && (coffeeCd[s.id] || 0) <= 0) || stations.find((s) => s.kind === "coffee");
    const barSt = stations.find((s) => s.kind === "barman");
    const officeSt = stations.find((s) => s.kind === "office");
    const deskSt = stations.find((s) => s.kind === "desk");

    // --- В линии с квестом бармена (бот помогает так же, как игрок) ---
    if (g.barman && g.barman.state !== "gone" && !meta.coffee2) {
      const b = g.barman;

      // полицейский: бот «не знает» → бармен не отвечает
      if (g.policeman && !g.policeman.answered && b.state === "hiding") {
        moveToward(buddy, g.policeman.x, g.policeman.y, dt);
        if (Math.hypot(buddy.x - g.policeman.x, buddy.y - g.policeman.y) < 60) {
          g.policeman.answered = true;
          g.barman.state = "gone";
          g.policeman = null;
          if (!meta.coffee2) {
            meta.coffee2 = true;
            storeSet(SAVE, meta);
            showEvent("Бот сказал «не знаю». Барни молчал и оставил 2-ю кофемашину!", 4);
            g.coins += 40;
            toast("☕☕ Бот помог · кофемашина 2");
          }
        }
        return;
      }

      // ждём в кабинете вместе
      if ((b.state === "hint" || b.state === "waitOffice" || b.state === "hiding") && officeSt) {
        moveToward(buddy, officeSt.x, officeSt.y, dt);
        if (Math.hypot(buddy.x - officeSt.x, buddy.y - officeSt.y) < 55) {
          if (b.state === "hint" || (b.state === "idle" && b.coffees >= 2)) waitInOffice(buddy);
        }
        return;
      }

      // носить кофе Барни
      if (b.coffees < 2 && coffeeSt && b.visible) {
        const bp = barneyPos() || barSt;
        if (!buddy.inv.includes("coffee_cup") && !(buddy.coffeeLeft > 0)) {
          moveToward(buddy, coffeeSt.x, coffeeSt.y, dt);
          if (Math.hypot(buddy.x - coffeeSt.x, buddy.y - coffeeSt.y) < 55) takeCoffee(buddy, coffeeSt);
          return;
        }
        if (bp) {
          moveToward(buddy, bp.x, bp.y, dt);
          if (Math.hypot(buddy.x - bp.x, buddy.y - bp.y) < 55) talkToBarney(buddy);
        }
        return;
      }
    }

    // боевые бадди: охота на аномалии
    if (g.monsters && g.monsters.length && (buddy.cls.weapon === "gun" || buddy.cls.weapon === "taser" || buddy.cls.weapon === "bat" || buddy.cls.weapon === "extinguisher")) {
      if (buddy.cls.weapon !== "extinguisher" || g.firePatient) {
        const m = nearestMonster(buddy.x, buddy.y, 9999);
        if (m && buddy.cls.weapon !== "extinguisher") {
          moveToward(buddy, m.x, m.y, dt);
          const w = buddy.weapon;
          if (w && Math.hypot(buddy.x - m.x, buddy.y - m.y) < w.range) {
            if (w.ammo <= 0) startReload(buddy);
            else useWeapon(buddy);
          }
          return;
        }
      }
    }

    if (g.firePatient && (buddy.cls.id === "firefighter" || (buddy.weapon && buddy.weapon.fire))) {
      moveToward(buddy, g.firePatient.x, g.firePatient.y, dt);
      if (Math.hypot(buddy.x - g.firePatient.x, buddy.y - g.firePatient.y) < 70) useWeapon(buddy);
      return;
    }

    // лечение
    const needy = g.inside.find((p) => p.diagnosed) || g.inside.find((p) => !p.diagnosed);
    if (needy && (buddy.cls.id === "nurse" || buddy.cls.id === "doctor" || buddy.cls.id === "surgeon" || buddy.cls.id === "headnurse" || buddy.cls.id === "paramedic")) {
      if (!needy.diagnosed) {
        moveToward(buddy, needy.x, needy.y, dt);
        if (Math.hypot(buddy.x - needy.x, buddy.y - needy.y) < 55) diagnoseOrTreat(buddy, needy);
        return;
      }
      const still = needy.needs.filter((id) => !needy.delivered.includes(id) && !buddy.inv.includes(id));
      if (still.length && buddy.inv.length < invMax(buddy)) {
        const needId = still[0];
        const mach = MACHINES.find((m) => m.gives.includes(needId));
        if (mach) {
          moveToward(buddy, mach.x, mach.y, dt);
          if (Math.hypot(buddy.x - mach.x, buddy.y - mach.y) < 55) takeFromMachine(buddy, mach);
          return;
        }
      }
      if (buddy.inv.some((id) => needy.needs.includes(id) && !needy.delivered.includes(id))) {
        moveToward(buddy, needy.x, needy.y, dt);
        if (Math.hypot(buddy.x - needy.x, buddy.y - needy.y) < 55) diagnoseOrTreat(buddy, needy);
        return;
      }
    }

    // секретарь / бот в линии у ресепшена с очередью
    if ((buddy.cls.id === "secretary" || g.queue.length >= 3) && deskSt && g.queue.length) {
      // встаёт в линию рядом с очередью
      const lineX = 500 + Math.min(g.queue.length, 6) * 20;
      const lineY = 220;
      moveToward(buddy, lineX, lineY, dt);
      if (Math.hypot(buddy.x - deskSt.x, buddy.y - deskSt.y) < 80 && g.queue.length && Math.random() < 0.15) {
        // бот иногда сам принимает/отклоняет у окна
        const v = g.queue[0];
        if (v) {
          moveToward(buddy, deskSt.x, deskSt.y, dt);
          if (Math.hypot(buddy.x - deskSt.x, buddy.y - deskSt.y) < 50) {
            // простая проверка аномалии
            const weird = v.hollow || v.distort || v.teeth || v.twitch || v.noShadow || v.wrongPose || v.voice || v.cctvSpecies.id !== v.species.id;
            deskPatient = v;
            if (weird) reject();
            else admit();
            toast(weird ? "Бот: шторка!" : "Бот: впустил клиента");
          }
        }
      }
      return;
    }

    // иначе держится рядом с игроком
    moveToward(buddy, g.players[0].x + 36, g.players[0].y + 16, dt);
  }

  function moveToward(p, tx, ty, dt) {
    const dx = tx - p.x;
    const dy = ty - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const sp = SPEED * (p.cls.speed || 1) * 0.9;
    if (len > 8) {
      p.x += (dx / len) * sp * dt;
      p.y += (dy / len) * sp * dt;
    }
  }

  function movePlayer(p, mx, my, dt) {
    const len = Math.hypot(mx, my);
    if (len > 0.08) {
      mx /= len;
      my /= len;
      const sp = SPEED * (p.cls.speed || 1);
      p.x = Math.max(30, Math.min(MW - 30, p.x + mx * sp * dt));
      p.y = Math.max(30, Math.min(MH - 30, p.y + my * sp * dt));
    }
  }

  function spawnEvent() {
    if (!g) return;
    if (g.monsters && g.monsters.length >= 3) {
      // не раздувать пачку монстров
      if (Math.random() < 0.5 && g.inside.length) {
        const p = rand(g.inside);
        g.firePatient = { x: p.x, y: p.y, id: p.id };
        showEvent("🔥 Пациент горит! Потуши (Пожарный / E)", 4);
      } else {
        g.headBanger = { x: 600, y: 200, t: 12 };
        showEvent("Голова стучит в стекло ресепшена!", 3.5);
      }
      return;
    }
    const roll = Math.random();
    if (g.shift.special === "ceiling" && roll < 0.4) {
      g.lookUpWarn = 5;
      showEvent("Не смотри вверх…", 4);
      hurtSanity(3);
      return;
    }
    if (roll < 0.25 && g.inside.length) {
      const p = rand(g.inside);
      g.firePatient = { x: p.x, y: p.y, id: p.id };
      showEvent("🔥 Пациент горит! Потуши (Пожарный / E)", 4);
    } else if (roll < 0.5) {
      g.headBanger = { x: 600, y: 200, t: 12 };
      showEvent("Голова стучит в стекло ресепшена!", 3.5);
    } else if (roll < 0.75) {
      g.monsters.push(spawnMonster("ghost", 250, 500, 9));
      showEvent("👻 Призрак в коридоре! F / E", 3.5);
      hurtSanity(5);
    } else if (g.shift.special === "mass") {
      if (!g.noAnimals) {
        for (let i = 0; i < 3; i++) g.queue.push(makeVisitor());
        layoutQueue();
        showEvent("🚑 Массовое поступление!", 3);
      }
    } else {
      g.monsters.push(spawnMonster("stalker", 400, 160, 8));
      showEvent("Сталкер рядом…", 3);
    }
  }

  function update(dt) {
    if (state === "desk" && deskPatient) {
      // у окна сразу можно стрелять в аномалию (не нужно «Принять»)
      if (shoot1) {
        shoot1 = false;
        useWeapon(g.players[0]);
      }
      if (shoot2 && g.players[1] && !g.players[1].isAi) {
        shoot2 = false;
        useWeapon(g.players[1]);
      }
      renderInspectViews(deskPatient);
      return;
    }
    if (state !== "play" || !g) return;

    g.t += dt;
    tickCreatorRivalry(dt);
    if (g.rivalryFlash > 0) g.rivalryFlash -= dt;
    if (g.coolBurst > 0) g.coolBurst -= dt;
    if (g.iskraBurst > 0) g.iskraBurst -= dt;
    if (g.iskraSparks > 0) {
      g.iskraSparks -= dt;
      if (g.players[0] && Math.random() < 0.55) {
        const p = g.players[0];
        g.particles.push({
          x: p.x + (Math.random() - 0.5) * 20,
          y: p.y - 10 + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 80,
          vy: -40 - Math.random() * 90,
          life: 0.35 + Math.random() * 0.35,
          color: Math.random() < 0.5 ? "#ffe080" : "#ff6040",
        });
      }
    }
    if (g.theme === "iskra") {
      for (let i = 0; i < 4; i++) {
        if (Math.random() > 0.42) continue;
        g.particles.push({
          x: cam.x + Math.random() * VW,
          y: cam.y + Math.random() * VH * 0.55,
          vx: (Math.random() - 0.5) * 160,
          vy: -50 - Math.random() * 130,
          life: 0.45 + Math.random() * 0.55,
          color: i % 3 === 0 ? "#fff0a0" : i % 3 === 1 ? "#ff8040" : "#ff4ec8",
        });
      }
    }
    if (g.shiftIntro > 0) g.shiftIntro -= dt;
    if (g.twinkleBurst > 0) g.twinkleBurst -= dt;
    if (g.truceBurst > 0) g.truceBurst -= dt;
    if (g.starlitBurst > 0) g.starlitBurst -= dt;
    if (g.coolFreeze > 0) {
      g.coolFreeze -= dt;
      if (g.monsters && g.monsters.length) g.monsters = [];
    }
    if (!g.endless) g.left -= dt;
    for (const k of Object.keys(coffeeCd)) {
      if (coffeeCd[k] > 0) coffeeCd[k] -= dt;
    }
    if (g.shutterFlash > 0) g.shutterFlash -= dt;
    if (g.lookUpWarn > 0) g.lookUpWarn -= dt;

    // Барни / полиция
    if (g.barman && g.barman.state !== "gone") {
      if (!g.barman.visible && g.barman.state === "idle") {
        g.barman.appearCd = (g.barman.appearCd || 0) - dt;
        if (g.barman.appearCd <= 0) {
          g.barman.visible = true;
          showEvent("Барни пришёл в зону отдыха", 2.2);
          toast("Барни у кофе · можно угостить");
        }
      }
      g.barman.questCd -= dt;
      if (g.barman.state === "hiding") {
        g.barman.hideTimer -= dt;
        if (g.barman.hideTimer <= 0 && g.policeman && !g.policeman.answered) {
          g.policeman = null;
          g.barman.state = "gone";
          if (!meta.coffee2) {
            meta.coffee2 = true;
            storeSet(SAVE, meta);
            showEvent("Полиция ушла. Барни молчал и оставил 2-ю кофемашину!", 4);
            toast("☕☕ Кофемашина 2 открыта");
            g.coins += 40;
          }
        }
      }
    }
    if (g.policeman) {
      g.policeman.t -= dt;
      g.policeman.x += Math.sin(g.t * 3) * 8 * dt;
      if (g.policeman.t <= 0) {
        if (!g.policeman.answered && g.barman && g.barman.state === "hiding") {
          g.barman.state = "gone";
          if (!meta.coffee2) {
            meta.coffee2 = true;
            storeSet(SAVE, meta);
            showEvent("Полиция ушла без ответа. Барни подарил 2-ю кофемашину!", 4);
            g.coins += 40;
          }
        }
        g.policeman = null;
      }
    }

    {
      const pace = Math.min(10, Math.max(1, Number(g.shift.pace) || Math.min(Number(g.shift.id) || 1, 10)));
      hurtSanity(
        g.shift && g.shift.noDayDrain
          ? 0
          : dt * (0.55 + pace * 0.12 + (g.monsters.length ? 1.2 + g.monsters.length * 0.35 : 0))
      );
    }
    if (state === "end") return;

    if (!g.endless && g.left <= 0) {
      g.left = 0;
      endShift("time");
      return;
    }

    // оружие: перезарядка и кулдаун
    for (const pl of g.players) {
      if (!pl.weapon) continue;
      if (pl.weapon.reloadCd > 0) {
        pl.weapon.reloadCd -= dt;
        if (pl.weapon.reloadCd <= 0) {
          pl.weapon.reloadCd = 0;
          pl.weapon.ammo = pl.weapon.maxAmmo;
          if (!pl.isAi) toast(`${pl.weapon.icon} Заряжено!`);
          renderInv();
        }
      }
      if (pl.weapon.cool > 0) pl.weapon.cool -= dt;
    }

    // ∞ очередь заявок — всегда подкидываем клиентов
    g.spawnCd -= dt;
    const qMax = 14;
    if (g.spawnCd <= 0) {
      if (!g.noAnimals && g.queue.length < qMax) {
        g.queue.push(makeVisitor());
        layoutQueue();
      }
      // не использовать сырой id (33/52/67) — иначе очередь и ивенты ломаются
      const pace = Math.min(10, Math.max(1, Number(g.shift.pace) || Math.min(Number(g.shift.id) || 1, 10)));
      g.spawnCd = Math.max(2.4, 5.5 - pace * 0.28);
    }

    if (g.selfServe) autoAdmitSelfServe();
    if (g.relaxMode) {
      g.sanity = g.maxSanity;
      if (!g.noAnimals) {
      const beds = getStations().filter((s) => s.kind === "treat");
      const free = Math.max(0, beds.length - g.inside.length);
      if (free > 0 && g.queue.length) {
        const idx = g.queue.findIndex((v) => !v.isAnomaly);
        if (idx >= 0) {
          const v = g.queue.splice(idx, 1)[0];
          layoutQueue();
          placePatientInside(v);
          v.selfServe = true;
          v.diagnosed = true;
          v.selfBuyCd = 0.45;
        } else {
          // аномалию в очереди — тихо убрать шторкой
          const bad = g.queue.shift();
          layoutQueue();
          if (bad) {
            g.blocked += 1;
            g.coins += 8;
          }
        }
      }
      for (const v of g.inside.slice()) {
        if (!v.diagnosed) {
          v.diagnosed = true;
          v.selfServe = true;
        }
        v.delivered = v.needs.slice();
        g.treated += 1;
        checkSurpriseGuestTreated(v);
        g.coins += 10;
        g.inside = g.inside.filter((p) => p.id !== v.id);
      }
      }
      g.relaxMobCd = (g.relaxMobCd || 0) - dt;
      if (g.monsters && g.monsters.length && g.relaxMobCd <= 0) {
        g.monsters.shift();
        g.blocked += 1;
        g.relaxMobCd = 0.9;
      }
    }

    // пациенты: таймер жизни + самообслуживание
    for (const v of g.inside.slice()) {
      if (g.patientDeath && v.life != null) {
        v.life -= dt;
        if (v.life <= 0) {
          patientDie(v, "✗ Слишком долго ждал — умер");
          continue;
        }
      }
      if (v.selfServe && v.diagnosed) {
        v.selfBuyCd = (v.selfBuyCd || 1) - dt;
        if (v.selfBuyCd <= 0) {
          const need = v.needs.find((id) => !v.delivered.includes(id));
          if (need) {
            v.delivered.push(need);
            v.selfBuyCd = 1.4 + Math.random() * 1.8;
          }
          const left = v.needs.filter((id) => !v.delivered.includes(id));
          if (!left.length) {
            g.treated += 1;
            checkSurpriseGuestTreated(v);
            g.coins += 12;
            g.inside = g.inside.filter((p) => p.id !== v.id);
            toast("Клиент сам купил и ушёл");
          }
        }
      }
    }

    g.eventCd -= dt;
    if (g.eventCd <= 0 && g.shift.eventRate > 0) {
      if (!(g.ownerQuiet || g.noAnomalies) && Math.random() < Math.min(0.55, g.shift.eventRate + 0.08)) {
        spawnEvent();
      }
      // было: 14 - shift.id → на смене 33 eventCd=-19 → монстры каждый кадр
      const pace = Math.min(10, Math.max(1, Number(g.shift.pace) || Math.min(Number(g.shift.id) || 1, 10)));
      g.eventCd = Math.max(11, 18 - pace * 0.55);
    }

    for (const m of g.monsters.slice()) {
      m.t -= dt;
      m.x += Math.sin(g.t * 2 + m.x * 0.01) * 40 * dt;
      m.y += Math.cos(g.t * 1.5 + m.y * 0.01) * 20 * dt;
      if (m.t <= 0) {
        hurtSanity(12);
        showEvent("Аномалия натворила дел…", 2.2);
        g.monsters = g.monsters.filter((x) => x.id !== m.id);
      }
    }
    if (g.headBanger) {
      g.headBanger.t -= dt;
      if (g.headBanger.t <= 0) {
        hurtSanity(8);
        g.headBanger = null;
      }
    }

    // P1 — WASD и стрелки (стрелки свободны, если нет 2-го игрока на стрелках)
    let mx = 0;
    let my = 0;
    if (keys.KeyW) my -= 1;
    if (keys.KeyS) my += 1;
    if (keys.KeyA) mx -= 1;
    if (keys.KeyD) mx += 1;
    if (mode !== "local2") {
      if (keys.ArrowUp) my -= 1;
      if (keys.ArrowDown) my += 1;
      if (keys.ArrowLeft) mx -= 1;
      if (keys.ArrowRight) mx += 1;
    }
    if (stick.active) {
      mx += stick.x;
      my += stick.y;
    }
    movePlayer(g.players[0], mx, my, dt);
    const p0 = g.players[0];
    const villaRoom = ROOMS.find((r) => r.id === "break");
    const playerMoving = mx !== 0 || my !== 0 || stick.active;
    if (villaRoom && p0 && g.villaLights && !meta.surpriseVilla && !playerMoving) {
      const inVilla =
        p0.x >= villaRoom.x + 24 &&
        p0.x <= villaRoom.x + villaRoom.w - 24 &&
        p0.y >= villaRoom.y + 24 &&
        p0.y <= villaRoom.y + villaRoom.h - 24;
      if (inVilla) {
        g.villaRestT = (g.villaRestT || 0) + dt;
        if (g.villaRestT >= 10) unlockVillaSurprise();
      } else {
        g.villaRestT = 0;
      }
    } else if (playerMoving) {
      g.villaRestT = 0;
    }
    if (act1) {
      act1 = false;
      tryInteract(g.players[0]);
    }
    if (shoot1) {
      shoot1 = false;
      useWeapon(g.players[0]);
    }
    if (reload1) {
      reload1 = false;
      startReload(g.players[0]);
    }

    // P2 local
    if (mode === "local2" && g.players[1]) {
      let mx2 = 0;
      let my2 = 0;
      if (keys.ArrowUp) my2 -= 1;
      if (keys.ArrowDown) my2 += 1;
      if (keys.ArrowLeft) mx2 -= 1;
      if (keys.ArrowRight) mx2 += 1;
      movePlayer(g.players[1], mx2, my2, dt);
      if (act2) {
        act2 = false;
        tryInteract(g.players[1]);
      }
      if (shoot2) {
        shoot2 = false;
        useWeapon(g.players[1]);
      }
      if (reload2) {
        reload2 = false;
        startReload(g.players[1]);
      }
    }

    // AI buddy
    if (mode === "pair" && g.players[1] && g.players[1].isAi) updateAi(g.players[1], dt);

    for (const v of g.queue) v.bob += dt * (v.twitch ? 12 : 3);
    for (const v of g.inside) v.bob += dt * 3;

    for (const pt of g.particles) {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.spin) pt.rot = (pt.rot || 0) + pt.spin * dt;
    }
    g.particles = g.particles.filter((p) => p.life > 0);

    if (animeWorldOn()) {
      for (let i = 0; i < 2; i++) {
        if (Math.random() > 0.55) continue;
        g.particles.push({
          x: cam.x + Math.random() * VW,
          y: cam.y - 8 - Math.random() * 40,
          vx: -35 + Math.random() * 50,
          vy: 35 + Math.random() * 55,
          life: 2.2 + Math.random() * 2,
          color: Math.random() > 0.5 ? "#ffb7d5" : "#ffd0e8",
          petal: true,
          spin: -2 + Math.random() * 4,
          rot: Math.random() * Math.PI,
        });
      }
    }
    if (rainNightOn()) {
      for (let i = 0; i < 5; i++) {
        g.particles.push({
          x: cam.x + Math.random() * VW,
          y: cam.y - 10 - Math.random() * 30,
          vx: -25 - Math.random() * 40,
          vy: 280 + Math.random() * 220,
          life: 0.55 + Math.random() * 0.45,
          color: "rgba(180, 220, 255, 0.55)",
          rain: true,
        });
      }
    }
    if (g.theme === "parrot") {
      for (let i = 0; i < 2; i++) {
        if (Math.random() > 0.5) continue;
        const colors = ["#ff6a4a", "#ffd76a", "#40c070", "#4a9fff"];
        g.particles.push({
          x: cam.x + Math.random() * VW,
          y: cam.y - 8 - Math.random() * 20,
          vx: -20 + Math.random() * 40,
          vy: 25 + Math.random() * 40,
          life: 1.8 + Math.random() * 1.5,
          color: colors[(Math.random() * colors.length) | 0],
          petal: true,
          spin: -2 + Math.random() * 4,
          rot: Math.random() * Math.PI,
        });
      }
    }
    if (g.theme === "twinkle") {
      for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.5) continue;
        g.particles.push({
          x: cam.x + Math.random() * VW,
          y: cam.y + Math.random() * VH * 0.7,
          vx: (Math.random() - 0.5) * 30,
          vy: -20 - Math.random() * 40,
          life: 0.8 + Math.random() * 0.8,
          color: i % 2 ? "#e8b4ff" : "#fff0ff",
        });
      }
    }
    if (g.theme === "starlit") {
      for (let i = 0; i < 2; i++) {
        if (Math.random() > 0.55) continue;
        g.particles.push({
          x: cam.x + Math.random() * VW,
          y: cam.y + Math.random() * VH * 0.5,
          vx: (Math.random() - 0.5) * 20,
          vy: -10 - Math.random() * 25,
          life: 1 + Math.random() * 1.2,
          color: "#fff8e0",
        });
      }
    }
    if (g.theme === "truce") {
      for (let i = 0; i < 2; i++) {
        if (Math.random() > 0.55) continue;
        g.particles.push({
          x: cam.x + Math.random() * VW,
          y: cam.y + 200 + Math.random() * 80,
          vx: (Math.random() - 0.5) * 50,
          vy: -25 - Math.random() * 35,
          life: 0.7 + Math.random() * 0.7,
          color: i % 2 ? "#ffb0b0" : "#9ec5ff",
        });
      }
    }

    cam.x = Math.max(0, Math.min(MW - VW, g.players[0].x - VW / 2));
    cam.y = Math.max(0, Math.min(MH - VH, g.players[0].y - VH / 2));

    const p = g.players[0];
    const stations = getStations();
    const hint =
      near(p.x, p.y, stations) ||
      near(p.x, p.y, MACHINES, 62);
    let eHint = "";
    if (hint) {
      if (hint.gives) {
        const pics = hint.gives.map((id) => ITEMS[id].icon + ITEMS[id].name).join(" / ");
        eHint = `E — взять ${pics}`;
      } else {
        eHint = `E — ${hint.label}`;
      }
    }
    hudStats.innerHTML =
      `${g.shift.name.split("·")[0].trim()} · ⏱ ∞ · 🪙 ∞` +
      `<br>❤️ ${g.treated} · 🚫 ${g.blocked} · ⚠ ${g.leaked}` +
      (g.died ? ` · 💀 ${g.died}` : "") +
      ` · 👾 ${g.monsters.length} · ∞очередь ${g.queue.length}` +
      (eHint ? `<br><span style="color:#7ed9b8">${eHint}</span>` : "") +
      (g.players[0].weapon
        ? `<br><span style="color:#ffd36a">${g.players[0].weapon.icon} F — аномалию сразу · R зарядка · C кофе</span>`
        : `<br><span style="color:#ffd36a">C — выпить кофе из инвентаря</span>`) +
      `<br><span style="color:#9aa8c0">Ход: WASD или стрелки</span>`;

    sanityFill.style.width = (g.sanity / g.maxSanity) * 100 + "%";
    sanityText.textContent = `🧠 ${Math.ceil(g.sanity)}`;
    const req = g.requests && g.requests.length
      ? g.requests
          .slice(0, 8)
          .map((r) => (r.rare ? r.name + "·" + r.rare : r.name) + (r.weird ? "?" : ""))
          .join(" · ")
      : "ждём…";
    queueStrip.textContent = "∞ Заявки: " + req + (g.queue.length > 8 ? " …" : "");
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // Fix isLesha - only use tex flag, not all P1
  function drawActor(pl, label) {
    const theme = g && g.theme;
    const tex = pl.tex || null;
    const isLesha = tex === "lesha";
    const isHere = tex === "here";
    const isSammy = tex === "sammy";
    const isJendel = tex === "jendel" || tex === "jen";
    const isWoodstock = tex === "woodstock";
    const isCool = tex === "cool";
    const isIskra = tex === "iskra";
    const isTwinkle = tex === "twinkle";
    const isTruce = tex === "truce";
    const isStarlit = tex === "starlit";
    const isBuilder = tex === "builder";
    const isRainbow = tex === "rainbow";
    const isLilamint = tex === "lilamint";
    let body =
      theme === "gold" ? "#ffd76a" : theme === "diamond" ? "#c8f4ff" : pl.color;
    let sash =
      theme === "gold" ? "#fff3b0" : theme === "diamond" ? "#7ad7ff" : "#7ed9b8";
    let head = "#e8b890";
    if (isLesha && theme !== "gold" && theme !== "diamond") {
      body = "#ffc857";
      sash = "#fff1b0";
      head = "#f0d0a0";
    }
    if (isHere && theme !== "gold" && theme !== "diamond") {
      body = "#7ec8ff";
      sash = "#d8f0ff";
      head = "#e8f6ff";
    }
    if (isSammy) {
      body = "#e23b3b";
      sash = "#fff";
      head = "#f5d76a";
    }
    if (isJendel) {
      body = "#2563eb";
      sash = "#22c55e";
      head = "#d4a574";
    }
    if (isWoodstock) {
      body = "#ffd700";
      sash = "#ffb020";
      head = "#ffe566";
    }
    if (isCool) {
      body = "#7af0ff";
      sash = "#e8ffff";
      head = "#d8f8ff";
    }
    if (isIskra) {
      body = "#ffb020";
      sash = "#ffe566";
      head = "#fff0c8";
    }
    if (isTwinkle) {
      body = "#e8b4ff";
      sash = "#fff0ff";
      head = "#ffe8ff";
    }
    if (isTruce) {
      body = "#c8a8ff";
      sash = "#ffd0e8";
      head = "#ffe8f8";
    }
    if (isStarlit) {
      body = "#ffe8c0";
      sash = "#fff8e8";
      head = "#fffaf0";
    }
    if (isBuilder) {
      body = "#3dcf7a";
      sash = "#ffd76a";
      head = "#f0c090";
    }
    if (isRainbow) {
      body = "#ff6ad5";
      sash = "#ffe566";
      head = "#fff0ff";
    }
    if (isLilamint) {
      body = "#9b59b6";
      sash = "#3dcf8a";
      head = "#e8d0ff";
    }
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(pl.x, pl.y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isHere) {
      ctx.fillStyle = "rgba(120, 200, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(pl.x, pl.y - 8, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    if (isSammy) {
      ctx.fillStyle = "rgba(226, 59, 59, 0.22)";
      ctx.beginPath();
      ctx.arc(pl.x, pl.y - 8, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    if (isCool) {
      ctx.fillStyle = "rgba(122, 240, 255, 0.28)";
      ctx.beginPath();
      ctx.arc(pl.x, pl.y - 8, 26 + Math.sin((g && g.t) || 0) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (isIskra) {
      ctx.fillStyle = "rgba(255, 160, 40, 0.3)";
      ctx.beginPath();
      ctx.arc(pl.x, pl.y - 8, 27 + Math.sin(((g && g.t) || 0) * 3) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 240, 120, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pl.x, pl.y - 8, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = body;
    roundRect(pl.x - 12, pl.y - 20, 24, 34, 8);
    ctx.fill();
    if (isLesha) {
      ctx.strokeStyle = "rgba(160, 80, 10, 0.45)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(pl.x - 10, pl.y - 14 + i * 8);
        ctx.lineTo(pl.x + 10, pl.y - 10 + i * 8);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.moveTo(pl.x - 8, pl.y - 34);
      ctx.lineTo(pl.x - 5, pl.y - 42);
      ctx.lineTo(pl.x, pl.y - 36);
      ctx.lineTo(pl.x + 5, pl.y - 42);
      ctx.lineTo(pl.x + 8, pl.y - 34);
      ctx.closePath();
      ctx.fill();
    }
    if (isSammy) {
      ctx.fillStyle = "#c41e2a";
      roundRect(pl.x - 11, pl.y - 40, 22, 8, 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(pl.x - 4, pl.y - 37, 8, 2);
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pl.x, pl.y - 26, 13, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    if (isJendel) {
      ctx.fillStyle = "#8b6914";
      ctx.beginPath();
      ctx.arc(pl.x - 11, pl.y - 32, 4, 0, Math.PI * 2);
      ctx.arc(pl.x + 11, pl.y - 32, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (isWoodstock) {
      ctx.fillStyle = "#ffb020";
      ctx.beginPath();
      ctx.ellipse(pl.x - 9, pl.y - 6, 4, 6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(pl.x + 9, pl.y - 6, 4, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8c00";
      ctx.beginPath();
      ctx.moveTo(pl.x + 8, pl.y - 24);
      ctx.lineTo(pl.x + 14, pl.y - 20);
      ctx.lineTo(pl.x + 8, pl.y - 18);
      ctx.closePath();
      ctx.fill();
    }
    if (isBuilder) {
      ctx.fillStyle = "#ffd76a";
      roundRect(pl.x - 13, pl.y - 38, 26, 7, 2);
      ctx.fill();
    }
    ctx.fillStyle = sash;
    ctx.fillRect(pl.x - 12, pl.y - 2, 24, 6);
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(pl.x, pl.y - 26, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a3040";
    ctx.beginPath();
    ctx.arc(pl.x - 4, pl.y - 27, 1.8, 0, Math.PI * 2);
    ctx.arc(pl.x + 4, pl.y - 27, 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (theme === "gold" || theme === "diamond" || isLesha) {
      ctx.fillStyle = isLesha
        ? "rgba(255,215,100,0.95)"
        : theme === "gold"
          ? "rgba(255,215,100,0.9)"
          : "rgba(180,240,255,0.95)";
      ctx.beginPath();
      ctx.arc(pl.x + 8, pl.y - 30, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const tag = isLesha
      ? "✦ Леша"
      : isHere
        ? "Auto"
        : isSammy
          ? "Sammy"
          : isJendel
            ? "Jendel"
            : isWoodstock
              ? "Woodstock"
              : isCool
                ? "Куул"
                : isIskra
                  ? "Искра"
                  : isTwinkle
                    ? "Мерцание"
                    : isTruce
                      ? "Мир"
                      : isStarlit
                        ? "Звёзды"
                        : isBuilder
                    ? "Builderman"
                    : isRainbow
                      ? "Rainbow"
                      : isLilamint
                        ? "Lilamint"
                        : label || pl.name;
    const tagColor = isHere
      ? "#a8e0ff"
      : isSammy
        ? "#ffb0b0"
        : isJendel
          ? "#9ec5ff"
          : isWoodstock
            ? "#ffe566"
            : isCool
              ? "#7af0ff"
              : isIskra
                ? "#ffd76a"
                : isTwinkle
                  ? "#e8b4ff"
                  : isTruce
                    ? "#c8a8ff"
                    : isStarlit
                      ? "#ffe8c0"
                      : isBuilder
                  ? "#b8ffd0"
                  : "#fff";
    drawNamePlate(pl.x, pl.y - 48, tag, tagColor);
    if (pl.inv.length) {
      ctx.font = "16px Nunito";
      ctx.fillText(ITEMS[pl.inv[pl.inv.length - 1]].icon, pl.x + 14, pl.y - 18);
    } else if (pl.weapon) {
      ctx.font = "16px Nunito";
      ctx.fillText(pl.weapon.icon, pl.x + 14, pl.y - 18);
    }
  }

  function tintRoom(base, theme) {
    if (theme === "gold") return "#6a4820";
    if (theme === "diamond") return "#1a4060";
    if (theme === "anime") return "#3a2850";
    if (theme === "rain") return "#1a3048";
    if (theme === "parrot") return "#4a3020";
    if (theme === "cool") return "#143848";
    if (theme === "iskra") return "#4a2810";
    if (theme === "twinkle") return "#382050";
    if (theme === "truce") return "#302848";
    if (theme === "starlit") return "#1a2038";
    if (theme === "here") return "#1a3550";
    if (theme === "lucky7") return "#4a1840";
    return base;
  }

  function draw() {
    ctx.clearRect(0, 0, VW, VH);
    if (!g) {
      const grd = ctx.createLinearGradient(0, 0, 0, VH);
      grd.addColorStop(0, "#1a2438");
      grd.addColorStop(1, "#0c101c");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      return;
    }

    const theme = g.theme || (g.shift && g.shift.theme) || null;

    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    ctx.fillStyle =
      theme === "gold"
        ? "#3a2808"
        : theme === "diamond"
          ? "#062030"
          : theme === "anime"
            ? "#1a1028"
            : theme === "rain"
              ? "#081420"
              : theme === "parrot"
                ? "#281810"
                : theme === "lucky7"
                  ? "#2a0820"
                  : theme === "here"
                    ? "#0a1824"
                    : theme === "cool"
                      ? "#0a2030"
                      : theme === "iskra"
                        ? "#281008"
                        : theme === "twinkle"
                          ? "#201030"
                          : theme === "truce"
                            ? "#201828"
                            : theme === "starlit"
                              ? "#0a1020"
                              : "#101624";
    ctx.fillRect(0, 0, MW, MH);

    for (const room of ROOMS) {
      ctx.fillStyle = tintRoom(room.color, theme);
      roundRect(room.x, room.y, room.w, room.h, 14);
      ctx.fill();
      ctx.strokeStyle =
        theme === "gold"
          ? "rgba(255, 215, 106, 0.55)"
          : theme === "diamond"
            ? "rgba(160, 230, 255, 0.55)"
            : theme === "anime"
              ? "rgba(255, 160, 220, 0.45)"
              : theme === "rain"
                ? "rgba(120, 200, 255, 0.4)"
                : theme === "parrot"
                  ? "rgba(255, 140, 60, 0.45)"
                  : theme === "cool"
                    ? "rgba(120, 240, 255, 0.45)"
                    : theme === "iskra"
                      ? "rgba(255, 180, 60, 0.5)"
                      : "rgba(255,255,255,0.1)";
      ctx.lineWidth = theme ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle =
        theme === "gold"
          ? "#ffe08a"
          : theme === "diamond"
            ? "#d8f6ff"
            : theme === "anime"
              ? "#ffd0f0"
              : theme === "rain"
                ? "#c8e8ff"
                : theme === "parrot"
                  ? "#ffd0a0"
                  : "rgba(255,255,255,0.7)";
      ctx.font = "800 15px Fredoka, Nunito, sans-serif";
      ctx.fillText(roomLabel(room), room.x + 12, room.y + 24);
    }

    // machines — тонкие подсказки (не огромные линии на весь экран)
    const needIds =
      focusPatient && focusPatient.diagnosed
        ? focusPatient.needs.filter((id) => !focusPatient.delivered.includes(id))
        : [];
    const wantedMachines = MACHINES.filter((m) => m.gives.some((id) => needIds.includes(id)));
    const guideFrom = g.players[0];
    const softGuide = !!(guideFrom && guideFrom.infiniteItems);
    for (const m of wantedMachines) {
      if (softGuide) {
        // у хозяина с ∞ — только маленькая метка у автомата, без длинных линий
        ctx.save();
        ctx.fillStyle = "rgba(255, 211, 106, 0.9)";
        ctx.beginPath();
        ctx.arc(m.x, m.y - 48, 5 + Math.sin(g.t * 6) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.strokeStyle = "rgba(255, 211, 106, 0.45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(guideFrom.x, guideFrom.y);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const ang = Math.atan2(m.y - guideFrom.y, m.x - guideFrom.x);
      ctx.fillStyle = "#ffd36a";
      ctx.translate(m.x, m.y - 48);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-5, -6);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (const m of MACHINES) {
      const wanted = m.gives.some((id) => needIds.includes(id));
      const soft = !!(g.players[0] && g.players[0].infiniteItems);
      const pulse = wanted && !soft ? 3 + Math.sin(g.t * 7) * 2 : 0;
      ctx.fillStyle = m.color || "#5a4a38";
      roundRect(m.x - 50 - pulse / 2, m.y - 40 - pulse / 2, 100 + pulse, 80 + pulse, 12);
      ctx.fill();
      if (wanted) {
        ctx.strokeStyle = soft ? "rgba(255, 211, 106, 0.55)" : "#ffd36a";
        ctx.lineWidth = soft ? 2 : 3;
        ctx.stroke();
        if (!soft) {
          ctx.fillStyle = "rgba(255, 211, 106, 0.92)";
          ctx.font = "900 14px Nunito";
          ctx.textAlign = "center";
          ctx.fillText("⬇", m.x, m.y - 48 - pulse);
        }
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = wanted ? "#1a2810" : "#101820";
      roundRect(m.x - 38, m.y - 30, 76, 44, 8);
      ctx.fill();
      const icons = m.gives.map((id) => ITEMS[id].icon);
      ctx.textAlign = "center";
      if (icons.length === 1) {
        ctx.font = "40px Nunito";
        ctx.fillText(icons[0], m.x, m.y + 6);
      } else {
        ctx.font = "28px Nunito";
        ctx.fillText(icons[0], m.x - 18, m.y + 6);
        ctx.fillText(icons[1], m.x + 18, m.y + 6);
      }
      ctx.fillStyle = wanted ? "#ffd36a" : "#e8e0d0";
      ctx.font = "900 13px Nunito";
      ctx.fillText(m.short, m.x, m.y + 34);
      ctx.fillStyle = wanted ? "#fff0b0" : "rgba(255,255,255,0.55)";
      ctx.font = "700 10px Nunito";
      ctx.fillText(m.room, m.x, m.y + 48);
      ctx.textAlign = "left";
    }

    // маркеры за краем экрана — куда бежать
    ctx.restore();
    for (const m of wantedMachines) {
      const sx = m.x - cam.x;
      const sy = m.y - cam.y;
      if (sx >= 40 && sx <= VW - 40 && sy >= 40 && sy <= VH - 40) continue;
      const cx = Math.max(36, Math.min(VW - 36, sx));
      const cy = Math.max(70, Math.min(VH - 36, sy));
      ctx.fillStyle = "rgba(20, 16, 8, 0.9)";
      roundRect(cx - 46, cy - 28, 92, 56, 10);
      ctx.fill();
      ctx.strokeStyle = "#ffd36a";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "28px Nunito";
      ctx.fillText(m.gives.map((id) => ITEMS[id].icon).join(""), cx, cy - 2);
      ctx.fillStyle = "#ffd36a";
      ctx.font = "900 11px Nunito";
      ctx.fillText("→ " + m.short, cx, cy + 18);
      ctx.textAlign = "left";
    }
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    for (const s of getStations()) {
      ctx.fillStyle =
        s.kind === "desk" ? "#c8b070" :
        s.kind === "coffee" ? "#8a5a3a" :
        s.kind === "barman" ? "#6a4060" :
        s.kind === "office" ? "#507070" :
        s.kind === "villaLight" ? (g.villaLights ? "#ffe08a" : "#405060") :
        "#70a8c8";
      roundRect(s.x - 32, s.y - 18, 64, 36, 8);
      ctx.fill();
      // перезарядка кофе
      if (s.kind === "coffee" && coffeeCd[s.id] > 0 && !coffeeNoCd(g.players[0])) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        roundRect(s.x - 32, s.y - 18, 64, 36, 8);
        ctx.fill();
        ctx.fillStyle = "#ffd36a";
        ctx.font = "700 10px Nunito";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(coffeeCd[s.id]) + "с", s.x, s.y + 4);
        ctx.textAlign = "left";
      } else {
        ctx.fillStyle = "#101624";
        ctx.font = "700 10px Nunito";
        ctx.textAlign = "center";
        ctx.fillText(
          s.kind === "villaLight" ? (g.villaLights ? "💡 свет" : "🌙 свет") : s.label.split(" ")[0],
          s.x,
          s.y + 4
        );
        ctx.textAlign = "left";
      }
    }

    // вилла: свет выкл — затемнение зоны отдыха
    if (g.villaLights === false) {
      const villa = ROOMS.find((r) => r.id === "break");
      if (villa) {
        ctx.fillStyle = "rgba(0, 0, 12, 0.55)";
        ctx.fillRect(villa.x, villa.y, villa.w, villa.h);
      }
    }

    // Барни спрайт
    if (g.barman && g.barman.state !== "gone" && (g.barman.visible || g.barman.state === "hiding" || g.barman.state === "hint" || g.barman.state === "waitOffice")) {
      const b = g.barman;
      const bx = b.state === "hiding" ? b.hideX || BARNEY_HIDE.x : b.x;
      const by = b.state === "hiding" ? b.hideY || BARNEY_HIDE.y : b.y;
      ctx.fillStyle = "#c45a7a";
      roundRect(bx - 12, by - 22, 24, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#f0c8a0";
      ctx.beginPath();
      ctx.arc(bx, by - 28, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 10px Nunito";
      ctx.fillText(b.state === "hiding" ? "Барни…" : "Барни", bx - 16, by - 42);
    }

    // полицейский
    if (g.policeman) {
      const p = g.policeman;
      ctx.fillStyle = "#3050a0";
      roundRect(p.x - 12, p.y - 22, 24, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#f0c8a0";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 28, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd36a";
      ctx.font = "700 11px Nunito";
      ctx.fillText("👮 Хитман?!", p.x - 28, p.y - 44);
    }

    if (g.shutterFlash > 0) {
      ctx.fillStyle = `rgba(200,40,40,${g.shutterFlash})`;
      ctx.fillRect(420, 40, 360, 280);
    }

    for (const v of g.queue) {
      drawCritter(ctx, v.x, v.y, {
        species: v.species,
        hollow: v.hollow,
        noShadow: v.noShadow,
        bob: v.bob,
        companion: !!v.isCompanion,
        rareKind: v.rareKind || null,
      });
      if (v.rivalGlow) {
        ctx.strokeStyle = `rgba(255, 80, 80, ${0.35 + Math.sin(g.t * 8) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(v.x, v.y, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
      const lift = v.labelLift || 0;
      const labelY = v.y - 44 - lift;
      if (v.rareKind || v.isCompanion || v.luckyDrop) {
        const col =
          v.rareKind === "rainbow"
            ? "#ffb0e0"
            : v.rareKind === "lilamint"
              ? "#d0a0ff"
              : v.rareKind === "sammy"
                ? "#ffb0b0"
                : isJendelKind(v)
                  ? "#9ec5ff"
                  : v.rareKind === "woodstock"
                    ? "#ffe566"
                    : v.rareKind === "gift"
                    ? "#ffe08a"
                    : "#a8e0ff";
        drawNamePlate(v.x, labelY, guestLabel(v), col);
        const tag = guestKindTag(v);
        if (tag && tag !== guestLabel(v)) {
          drawNamePlate(v.x, labelY + 14, tag, col);
        }
      } else {
        drawNamePlate(v.x, labelY, speciesLabel(v.species), "#d0d8e8");
        if (v.isAnomaly && isOwner()) {
          drawNamePlate(v.x, labelY + 14, "АНОМАЛИЯ", "#ef4d5a");
        }
      }
    }
    for (const v of g.inside) {
      drawCritter(ctx, v.x, v.y, {
        species: v.species,
        bob: v.bob,
        companion: !!v.isCompanion,
        rareKind: v.rareKind || null,
      });
      if (v.rareKind || v.isCompanion || v.luckyDrop) {
        const col =
          v.rareKind === "rainbow"
            ? "#ffb0e0"
            : v.rareKind === "lilamint"
              ? "#d0a0ff"
              : v.rareKind === "sammy"
                ? "#ffb0b0"
                : isJendelKind(v)
                  ? "#9ec5ff"
                  : v.rareKind === "woodstock"
                    ? "#ffe566"
                    : v.rareKind === "gift"
                    ? "#ffe08a"
                    : "#a8e0ff";
        drawNamePlate(v.x, v.y - 50, guestLabel(v), col);
      } else if (v.isAnomaly && isOwner()) {
        drawNamePlate(v.x, v.y - 50, "АНОМАЛИЯ", "#ef4d5a");
      }
      ctx.textAlign = "center";
      ctx.font = "bold 22px Nunito";
      ctx.fillText(v.condition.icon, v.x, v.y - 40);
      if (v.diagnosed) {
        const left = v.needs.filter((id) => !v.delivered.includes(id));
        left.forEach((id, i) => {
          ctx.font = "22px Nunito";
          ctx.fillText(ITEMS[id].icon, v.x - (left.length - 1) * 14 + i * 28, v.y - 62);
        });
        if (!left.length) {
          ctx.fillStyle = "#7ed9b8";
          ctx.font = "700 11px Nunito";
          ctx.fillText("готов", v.x, v.y + 38);
        }
      }
      if (g.patientDeath && v.life != null && v.maxLife) {
        const pct = Math.max(0, v.life / v.maxLife);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(v.x - 18, v.y + 28, 36, 5);
        ctx.fillStyle = pct < 0.35 ? "#ef4d5a" : pct < 0.65 ? "#ffd36a" : "#7ed9b8";
        ctx.fillRect(v.x - 18, v.y + 28, 36 * pct, 5);
      }
      ctx.textAlign = "left";
    }

    if (g.monsters.length) {
      for (const m of g.monsters) {
        const colors = {
          skinwalker: "#2a0810",
          ghost: "#304060",
          stalker: "#1a1020",
          slime: "#204020",
          camouflage: "#2a3038",
          bedmonster: "#401018",
        };
        ctx.fillStyle = colors[m.kind] || "#2a0810";
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, 26, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ef4d5a";
        ctx.beginPath();
        ctx.arc(m.x - 8, m.y - 10, 5, 0, Math.PI * 2);
        ctx.arc(m.x + 8, m.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Nunito";
        ctx.fillText(m.kind, m.x - 22, m.y - 44);
      }
    }
    if (g.firePatient) {
      ctx.fillStyle = "#ff6a20";
      ctx.beginPath();
      ctx.arc(g.firePatient.x, g.firePatient.y - 30, 14 + Math.sin(g.t * 10) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Nunito";
      ctx.fillText("ОГОНЬ!", g.firePatient.x - 18, g.firePatient.y - 50);
    }
    if (g.headBanger) {
      drawCritter(ctx, g.headBanger.x, g.headBanger.y, {
        species: SPECIES[0],
        hollow: true,
        bob: g.t * 8,
      });
    }

    g.players.forEach((pl, i) => drawActor(pl, i === 0 ? "P1" : mode === "pair" ? pl.name : "P2"));

    for (const pt of g.particles) {
      ctx.globalAlpha = Math.max(0, pt.life * 2);
      if (pt.petal) {
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot || 0);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pt.rain) {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + pt.vx * 0.04, pt.y + 14);
        ctx.stroke();
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const stationsNow = getStations();
    const hint =
      near(g.players[0].x, g.players[0].y, stationsNow) ||
      near(g.players[0].x, g.players[0].y, MACHINES, 62);
    if (hint) {
      ctx.strokeStyle = "rgba(126,217,184,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hint.x, hint.y, 38 + Math.sin(g.t * 5) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (theme === "gold") {
      ctx.fillStyle = "rgba(255, 190, 60, 0.22)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createRadialGradient(VW * 0.5, VH * 0.2, 40, VW * 0.5, VH * 0.5, VW * 0.7);
      grd.addColorStop(0, "rgba(255, 220, 100, 0.28)");
      grd.addColorStop(1, "rgba(255, 180, 40, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "rgba(255, 230, 140, 0.75)";
      for (let i = 0; i < 28; i++) {
        const x = (Math.sin(g.t * 0.7 + i * 1.7) * 0.5 + 0.5) * VW;
        const y = (Math.cos(g.t * 0.9 + i * 2.1) * 0.5 + 0.5) * VH;
        ctx.fillRect(x, y, 3, 3);
      }
    } else if (theme === "diamond") {
      ctx.fillStyle = "rgba(100, 200, 255, 0.2)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createRadialGradient(VW * 0.5, VH * 0.15, 30, VW * 0.5, VH * 0.45, VW * 0.75);
      grd.addColorStop(0, "rgba(200, 245, 255, 0.3)");
      grd.addColorStop(1, "rgba(80, 180, 255, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "rgba(220, 250, 255, 0.85)";
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(g.t * 1.1 + i * 1.3) * 0.5 + 0.5) * VW;
        const y = (Math.cos(g.t * 1.4 + i * 1.9) * 0.5 + 0.5) * VH;
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x + 3, y);
        ctx.lineTo(x, y + 4);
        ctx.lineTo(x - 3, y);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === "anime") {
      ctx.fillStyle = "rgba(255, 140, 200, 0.14)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createRadialGradient(VW * 0.5, VH * 0.1, 20, VW * 0.5, VH * 0.4, VW * 0.8);
      grd.addColorStop(0, "rgba(255, 200, 240, 0.28)");
      grd.addColorStop(1, "rgba(160, 100, 220, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "rgba(255, 220, 245, 0.7)";
      ctx.font = "800 13px Fredoka, Nunito, sans-serif";
      ctx.fillText("✦ anime mode", 12, 22);
    } else if (theme === "rain") {
      ctx.fillStyle = "rgba(20, 50, 90, 0.22)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createLinearGradient(0, 0, 0, VH);
      grd.addColorStop(0, "rgba(80, 140, 200, 0.12)");
      grd.addColorStop(1, "rgba(10, 20, 40, 0.35)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "rgba(180, 220, 255, 0.75)";
      ctx.font = "800 13px Fredoka, Nunito, sans-serif";
      ctx.fillText("✦ ночная смена", 12, 22);
    } else if (theme === "parrot") {
      ctx.fillStyle = "rgba(255, 120, 60, 0.12)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createRadialGradient(VW * 0.5, VH * 0.2, 30, VW * 0.5, VH * 0.5, VW * 0.75);
      grd.addColorStop(0, "rgba(255, 200, 80, 0.22)");
      grd.addColorStop(1, "rgba(40, 120, 60, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "rgba(255, 210, 140, 0.85)";
      ctx.font = "800 13px Fredoka, Nunito, sans-serif";
      ctx.fillText("✦ попугай", 12, 22);
    } else if (theme === "cool") {
      ctx.fillStyle = "rgba(40, 180, 255, 0.14)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createLinearGradient(0, 0, VW, VH);
      grd.addColorStop(0, "rgba(80, 255, 220, 0.2)");
      grd.addColorStop(0.5, "rgba(120, 180, 255, 0.12)");
      grd.addColorStop(1, "rgba(180, 100, 255, 0.18)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      // северное сияние
      for (let i = 0; i < 5; i++) {
        const y = 40 + i * 28 + Math.sin(g.t * 1.4 + i) * 10;
        ctx.strokeStyle = `rgba(${80 + i * 30}, ${220 - i * 20}, 255, ${0.18 + Math.sin(g.t + i) * 0.08})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= VW; x += 40) {
          ctx.lineTo(x, y + Math.sin(g.t * 2 + x * 0.02 + i) * 16);
        }
        ctx.stroke();
      }
      // снег
      ctx.fillStyle = "rgba(230, 250, 255, 0.85)";
      for (let i = 0; i < 36; i++) {
        const x = ((Math.sin(i * 12.1) * 0.5 + 0.5) * VW + g.t * (20 + (i % 5) * 8)) % VW;
        const y = ((g.t * (30 + (i % 7) * 10) + i * 37) % (VH + 20)) - 10;
        ctx.fillRect(x, y, 2 + (i % 2), 2 + (i % 2));
      }
      ctx.fillStyle = "rgba(200, 255, 255, 0.95)";
      ctx.font = "900 18px Fredoka, Nunito, sans-serif";
      ctx.fillText("❄ КУУУЛ", 12, 26);
      if (g.coolBurst > 0) {
        const a = Math.min(1, g.coolBurst / 2) * 0.35;
        ctx.fillStyle = `rgba(180, 240, 255, ${a})`;
        ctx.fillRect(0, 0, VW, VH);
        ctx.fillStyle = `rgba(255, 255, 255, ${a * 1.4})`;
        ctx.font = "900 64px Fredoka, Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("КУ", VW / 2, VH / 2);
        ctx.font = "800 28px Fredoka, Nunito, sans-serif";
        ctx.fillText("❄ ледяной сюрприз ❄", VW / 2, VH / 2 + 42);
        ctx.textAlign = "left";
      }
    } else if (theme === "iskra") {
      ctx.fillStyle = "rgba(255, 90, 20, 0.12)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createRadialGradient(VW * 0.5, VH * 0.35, 20, VW * 0.5, VH * 0.5, VW * 0.7);
      grd.addColorStop(0, "rgba(255, 200, 60, 0.28)");
      grd.addColorStop(0.45, "rgba(255, 80, 40, 0.12)");
      grd.addColorStop(1, "rgba(40, 0, 20, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 28; i++) {
        const cx = ((Math.sin(i * 7.3) * 0.5 + 0.5) * VW + Math.sin(g.t * 1.1 + i) * 40) % VW;
        const cy = 60 + ((i * 47 + g.t * (40 + (i % 5) * 12)) % (VH - 80));
        const pulse = 0.45 + Math.sin(g.t * 6 + i) * 0.35;
        ctx.fillStyle =
          i % 3 === 0
            ? `rgba(255, 240, 120, ${pulse})`
            : i % 3 === 1
              ? `rgba(255, 100, 40, ${pulse})`
              : `rgba(255, 60, 160, ${pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
        if (i % 4 === 0) {
          ctx.strokeStyle = `rgba(255, 220, 100, ${pulse * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy);
          ctx.lineTo(cx + 6, cy);
          ctx.moveTo(cx, cy - 6);
          ctx.lineTo(cx, cy + 6);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(255, 220, 120, 0.95)";
      ctx.font = "900 18px Fredoka, Nunito, sans-serif";
      ctx.fillText("✦ ИСКРА", 12, 26);
      if (g.iskraBurst > 0) {
        const a = Math.min(1, g.iskraBurst / 2) * 0.4;
        ctx.fillStyle = `rgba(255, 140, 40, ${a})`;
        ctx.fillRect(0, 0, VW, VH);
        ctx.fillStyle = `rgba(255, 250, 200, ${Math.min(1, a * 1.5)})`;
        ctx.font = "900 64px Fredoka, Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ИСКРА", VW / 2, VH / 2);
        ctx.font = "800 26px Fredoka, Nunito, sans-serif";
        ctx.fillText("✦ фейерверк · халат огня ✦", VW / 2, VH / 2 + 42);
        ctx.textAlign = "left";
      }
    } else if (theme === "twinkle") {
      ctx.fillStyle = "rgba(200, 140, 255, 0.1)";
      ctx.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 24; i++) {
        const cx = ((Math.sin(i * 5.7 + g.t) * 0.5 + 0.5) * VW);
        const cy = ((Math.cos(i * 4.1 + g.t * 0.8) * 0.5 + 0.5) * VH);
        ctx.fillStyle = `rgba(255, 240, 255, ${0.3 + Math.sin(g.t * 4 + i) * 0.25})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(240, 200, 255, 0.9)";
      ctx.font = "900 18px Fredoka, Nunito, sans-serif";
      ctx.fillText("✦ …", 12, 26);
    } else if (theme === "truce") {
      ctx.fillStyle = "rgba(200, 160, 255, 0.1)";
      ctx.fillRect(0, 0, VW, VH);
      const grd = ctx.createLinearGradient(0, VH * 0.5, VW, VH * 0.5);
      grd.addColorStop(0, "rgba(255, 120, 120, 0.12)");
      grd.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
      grd.addColorStop(1, "rgba(120, 180, 255, 0.12)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "rgba(240, 220, 255, 0.9)";
      ctx.font = "900 18px Fredoka, Nunito, sans-serif";
      ctx.fillText("✦ …", 12, 26);
    } else if (theme === "starlit") {
      ctx.fillStyle = "rgba(20, 30, 60, 0.25)";
      ctx.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 40; i++) {
        const cx = ((i * 97 + g.t * 12) % VW);
        const cy = 20 + ((i * 53) % (VH - 40));
        const tw = 0.35 + Math.sin(g.t * 3 + i * 0.7) * 0.35;
        ctx.fillStyle = `rgba(255, 248, 220, ${tw})`;
        ctx.fillRect(cx, cy, 2, 2);
      }
      ctx.fillStyle = "rgba(255, 248, 220, 0.9)";
      ctx.font = "900 18px Fredoka, Nunito, sans-serif";
      ctx.fillText("✦ …", 12, 26);
    }

    if (g.shiftIntro > 0 && theme) {
      const a = Math.min(0.28, g.shiftIntro / 3.2) * 0.35;
      ctx.fillStyle =
        theme === "iskra"
          ? `rgba(255, 140, 40, ${a})`
          : theme === "twinkle"
            ? `rgba(220, 160, 255, ${a})`
            : theme === "truce"
              ? `rgba(200, 160, 255, ${a})`
              : theme === "starlit"
                ? `rgba(255, 240, 200, ${a})`
                : theme === "cool"
            ? `rgba(120, 240, 255, ${a})`
            : theme === "gold"
              ? `rgba(255, 200, 60, ${a})`
              : theme === "diamond"
                ? `rgba(120, 220, 255, ${a})`
                : `rgba(255, 255, 255, ${a * 0.6})`;
      ctx.fillRect(0, 0, VW, VH);
    }

    if (g.sanity < 35) {
      ctx.fillStyle = `rgba(80,0,20,${((35 - g.sanity) / 35) * 0.5})`;
      ctx.fillRect(0, 0, VW, VH);
    }
    if (g.lookUpWarn > 0) {
      ctx.fillStyle = `rgba(120,0,40,${0.15 + Math.sin(g.t * 6) * 0.08})`;
      ctx.fillRect(0, 0, VW, 80);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  document.getElementById("btnStart").addEventListener("click", startShift);
  const brandEl = document.querySelector(".brand");
  const brandClicks = { n: 0, t: 0 };
  if (brandEl) {
    brandEl.style.cursor = "pointer";
    brandEl.addEventListener("click", () => {
      if (state !== "menu" || meta.surpriseTwinkle) return;
      const now = Date.now();
      if (now - brandClicks.t > 4000) brandClicks.n = 0;
      brandClicks.t = now;
      brandClicks.n += 1;
      if (brandClicks.n >= 5) {
        brandClicks.n = 0;
        unlockTwinkleSurprise();
      }
    });
  }
  document.getElementById("btnMenu").addEventListener("click", goMenu);
  document.getElementById("btnAdmit").addEventListener("click", admit);
  document.getElementById("btnReject").addEventListener("click", reject);
  const btnGiveJuice = document.getElementById("btnGiveJuice");
  if (btnGiveJuice) btnGiveJuice.addEventListener("click", () => tryGiveJuice(g && g.players[0]));
  const btnQuietShift = document.getElementById("btnQuietShift");
  if (btnQuietShift) {
    btnQuietShift.addEventListener("click", () => {
      if (!g || !canUseSecretShifts()) return;
      setOwnerQuiet(!g.ownerQuiet);
    });
  }
  const btnAnimalsShift = document.getElementById("btnAnimalsShift");
  if (btnAnimalsShift) {
    btnAnimalsShift.addEventListener("click", () => {
      if (!g || !canUseSecretShifts()) return;
      setNoAnimals(!g.noAnimals);
    });
  }
  const btnNeedClose = document.getElementById("btnNeedClose");
  if (btnNeedClose) {
    btnNeedClose.addEventListener("click", () => {
      focusPatient = null;
      hideEl(needPanel);
    });
  }
  document.getElementById("btnAgain").addEventListener("click", startShift);
  document.getElementById("btnToMenu").addEventListener("click", goMenu);
  document.getElementById("btnOpenShop").addEventListener("click", openShop);
  document.getElementById("btnCloseShop").addEventListener("click", () => {
    hideEl(shopPanel);
    refreshLobbyUI();
    showEl(menu);
    showEl(secretDeathWrap);
  });
  document.getElementById("btnOpenExchange").addEventListener("click", openExchange);
  document.getElementById("btnCloseExchange").addEventListener("click", () => {
    hideEl(exchangePanel);
    refreshLobbyUI();
    showEl(menu);
    showEl(secretDeathWrap);
  });
  document.getElementById("btnSpin").addEventListener("click", spinExchange);

  const btnAllSecrets = document.getElementById("btnAllSecrets");
  if (btnAllSecrets) btnAllSecrets.addEventListener("click", openSecretShiftsPanel);
  const btnCloseSecrets = document.getElementById("btnCloseSecrets");
  if (btnCloseSecrets) btnCloseSecrets.addEventListener("click", closeSecretShiftsPanel);
  const btnHardReload = document.getElementById("btnHardReload");
  if (btnHardReload) {
    btnHardReload.addEventListener("click", () => {
      const u = new URL(location.href);
      u.searchParams.set("r", String(Date.now()));
      location.replace(u.toString());
    });
  }

  const secretDeathInput = document.getElementById("secretDeathInput");
  const secretDeathGo = document.getElementById("secretDeathGo");
  if (secretDeathInput) {
    const submitSecretDeath = () => {
      const ok = applySecretDeathCode(secretDeathInput.value);
      if (ok) secretDeathInput.value = "";
    };
    secretDeathInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.code === "Enter" || e.key === "Enter") {
        e.preventDefault();
        submitSecretDeath();
      }
    });
    if (secretDeathGo) secretDeathGo.addEventListener("click", submitSecretDeath);
  }

  const spawnCharSelect = document.getElementById("spawnCharSelect");
  const spawnPerksBox = document.getElementById("spawnPerksBox");
  const spawnNickInput = document.getElementById("spawnNickInput");
  const btnSpawnPlayer = document.getElementById("btnSpawnPlayer");
  if (spawnCharSelect) {
    spawnCharSelect.innerHTML = SPAWN_CHARACTERS.map(
      (c) => `<option value="${c.id}">${c.name}</option>`
    ).join("");
  }
  if (spawnPerksBox) {
    spawnPerksBox.innerHTML = SPAWN_PERKS.map(
      (p) =>
        `<label class="spawn-perk"><input type="checkbox" data-perk="${p.id}" /> ${p.label}</label>`
    ).join("");
  }
  const doSpawnPlayer = () => {
    const nick = spawnNickInput ? spawnNickInput.value : "";
    const ch = spawnCharSelect ? spawnCharSelect.value : "auto";
    const perkIds = [];
    if (spawnPerksBox) {
      spawnPerksBox.querySelectorAll("input[data-perk]:checked").forEach((el) => {
        perkIds.push(el.getAttribute("data-perk"));
      });
    }
    if (spawnPlayerRegistry(nick, ch, perkIds) && spawnNickInput) {
      spawnNickInput.value = "";
      if (spawnPerksBox) {
        spawnPerksBox.querySelectorAll("input[data-perk]").forEach((el) => {
          el.checked = false;
        });
      }
    }
  };
  if (btnSpawnPlayer) btnSpawnPlayer.addEventListener("click", doSpawnPlayer);
  if (spawnNickInput) {
    spawnNickInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.code === "Enter" || e.key === "Enter") {
        e.preventDefault();
        doSpawnPlayer();
      }
    });
  }

  bootSecretTray();

  hideEl(hud);
  hideEl(touch);
  hideEl(deskPanel);
  hideEl(endPanel);
  hideEl(needPanel);
  hideEl(eventBanner);
  hideEl(shiftTag);
  hideEl(queueStrip);
  hideEl(shopPanel);
  hideEl(exchangePanel);
  hideEl(document.getElementById("secretShiftsPanel"));
  showEl(menu);
  showEl(secretDeathWrap);
  applyLobbyTheme();
  requestAnimationFrame(frame);

  try {
    if (window.AmalHub && AmalHub.setPresence) AmalHub.setPresence("animal-hospital");
  } catch {}
})();
