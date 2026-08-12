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
        tag: t.tag,
        color: t.color,
        special: t.special || null,
        secret: false,
      });
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

  function visibleShifts() {
    // один и тот же список «СМЕНА»: обычные + секреты хозяину сразу
    if (!canUseSecretShifts()) return SHIFTS.filter((s) => !s.secret);
    return SHIFTS.slice().sort((a, b) => a.id - b.id);
  }

  function applySecretDeathCode(raw) {
    if (!canUseSecretShifts()) return false;
    const code = String(raw || "").trim();
    if (code !== "67" && code !== "52" && code !== "7") return false;
    meta.secretShifts67 = true;
    meta.secretShift7 = true;
    storeSet(SAVE, meta);
    const pick = SHIFTS.find((s) => s.id === Number(code));
    if (pick) selectedShift = pick;
    refreshLobbyUI();
    persistLobby();
    return true;
  }

  function unlockSecretShifts67() {
    return applySecretDeathCode("67");
  }

  function isVipShift(shift) {
    return !!(shift && (shift.vipKit || shift.noAnomalies || shift.lesha || shift.diamondNight || shift.lucky7));
  }

  function applyThemeClass(theme) {
    document.body.classList.remove("theme-gold", "theme-diamond", "theme-lucky7");
    const screen = document.getElementById("screen");
    if (screen) screen.classList.remove("theme-gold", "theme-diamond", "theme-lucky7");
    if (!theme) return;
    const cls = "theme-" + theme;
    document.body.classList.add(cls);
    if (screen) screen.classList.add(cls);
  }

  function giveVipKit(player, shift) {
    if (!player || !shift || !shift.vipKit) return;
    const meds = Object.keys(ITEMS).filter((id) => id !== "coffee_cup");
    player.inv = meds.slice();
    player.coffeeLeft = shift.coffeeGift || 0;
    player.infiniteItems = true;
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
    { id: "break", name: "Отдых / бар", x: 720, y: 660, w: 400, h: 280, color: "#2a3840" },
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
    { id: "barman", x: 960, y: 800, label: "Бармен", kind: "barman" },
  ];
  const STATION_COFFEE2 = { id: "coffee2", x: 980, y: 740, label: "Кофемашина 2", kind: "coffee" };

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

  refreshLobbyUI();

  function rand(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function makeVisitor(forceAnomaly) {
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
    };
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

  function makePlayer(cls, x, y, isAi, name, color) {
    return {
      x,
      y,
      cls,
      inv: [],
      isAi: !!isAi,
      name: name || cls.name,
      color: color || "#f0f4ff",
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
      if (w.ammo <= 0) {
        toast("Пусто — R перезарядка");
        return;
      }
      w.ammo -= 1;
      w.cool = 0.25;
      g.firePatient = null;
      healSanity(6);
      toast("🧯 Пожар потушен!");
      hideEl(eventBanner);
      if (w.ammo <= 0) w.reloadCd = w.reloadTime;
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
    if (w.ammo <= 0) {
      toast("Нет патронов — нажми R");
      return;
    }

    const tx = m ? m.x : qAnom.x;
    const ty = m ? m.y : qAnom.y;
    w.ammo -= 1;
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
      if (w.ammo <= 0 && w.type === "gun") toast("Магазин пуст — R перезарядка");
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
    if (w.ammo <= 0 && w.type === "gun") {
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
    const players = [p1];
    if (mode === "pair") {
      const bCls = CLASSES.find((c) => c.id === selectedBuddy.classId) || CLASSES[1];
      players.push(makePlayer(bCls, 360, 220, true, selectedBuddy.name, "#ffb48a"));
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
      wrongReject: 0,
      sanity: selectedClass.sanity,
      maxSanity: selectedClass.sanity,
      immortal: true,
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
        x: 960,
        y: 800,
        coffees: 0,
        state: "idle", // idle | hint | waitOffice | hiding | gone
        questCd: 25,
        hideTimer: 0,
      },
      policeman: null, // { x, y, t, answered }
      requests: [], // бесконечная лента заявок (имена в очереди)
      theme: shift.theme || null,
      noAnomalies: !!(shift.noAnomalies || shift.anomaly <= 0),
    };

    coffeeCd = { coffee: 0, coffee2: 0 };

    // бесконечная очередь: стартовая пачка + постоянный спавн дальше
    const group = 5 + (shift.id >= 2 ? 2 : 0) + (shift.special === "mass" ? 4 : 0);
    const forceWeird = shift.noAnomalies || shift.anomaly <= 0 ? false : null;
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
    if (matchMedia("(pointer: coarse)").matches || "ontouchstart" in window) showEl(touch);
    toast(`Ресепшен · ∞ время · очередь ∞` + (g.players[0].weapon ? " · F по аномалии сразу" : ""));
    applyThemeClass(shift.theme || null);
    giveVipKit(g.players[0], shift);
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
    updateNeedUI();
    renderInv();
  }

  function refreshRequestsStrip() {
    if (!g) return;
    g.requests = g.queue.map((v) => ({
      name: v.species.name,
      cond: v.condition.name,
      weird: v.isAnomaly,
    }));
  }

  function layoutQueue() {
    g.queue.forEach((v, i) => {
      v.x = 460 + (i % 6) * 42;
      v.y = 260 + Math.floor(i / 6) * 36;
    });
    refreshRequestsStrip();
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
      `${g.shift.name}<br>Вылечено: ${g.treated} · Аномалий: ${g.blocked} · Пропущено: ${g.leaked}<br>` +
      `Монеты: ∞`;
    showEl(endPanel);
  }

  function goMenu() {
    state = "menu";
    g = null;
    deskPatient = null;
    focusPatient = null;
    applyThemeClass(null);
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
    if (player && player.infiniteItems) return Math.max(24, (player.inv && player.inv.length) || 24);
    return player.cls.inv || INV_MAX;
  }

  function renderInv() {
    if (!g) return;
    const p = g.players[0];
    const slots = [];
    if (p.weapon) {
      const w = p.weapon;
      const reload = w.reloadCd > 0 ? ` ⏳${w.reloadCd.toFixed(1)}` : "";
      slots.push(
        `<div class="inv-slot" style="border-color:#ffd36a">${w.icon}<br>${w.ammo}/${w.maxAmmo}${reload}</div>`
      );
    }
    if (p.infiniteItems) {
      const icons = p.inv.map((id) => (ITEMS[id] ? ITEMS[id].icon : "?")).join("");
      slots.push(
        `<div class="inv-slot" style="border-color:#7ed9b8;min-width:7rem">∞ все<br><span style="font-size:0.85rem">${icons}</span></div>`
      );
      if (p.coffeeLeft > 0) {
        slots.push(
          `<div class="inv-slot" style="border-color:#c4a574">☕ ×${p.coffeeLeft}<br>кофе</div>`
        );
      }
    } else {
      for (let i = 0; i < invMax(p); i++) {
        const it = p.inv[i];
        if (it) {
          const def = ITEMS[it];
          slots.push(`<div class="inv-slot">${def.icon}<br>${def.name}</div>`);
        } else slots.push(`<div class="inv-slot empty">пусто</div>`);
      }
    }
    invSlots.innerHTML = slots.join("");
  }

  function updateNeedUI() {
    if (!g || !focusPatient || !focusPatient.diagnosed) {
      hideEl(needPanel);
      return;
    }
    const v = focusPatient;
    needTitle.textContent = `${v.condition.icon} ${v.species.name}: ${v.condition.name}`;
    needList.innerHTML = v.needs
      .map((id) => {
        const def = ITEMS[id];
        const done = v.delivered.includes(id);
        const mach = MACHINES.find((m) => m.gives.includes(id));
        const room = mach ? mach.room : "?";
        const short = mach ? mach.short : "?";
        return `<div class="need-card ${done ? "done" : "todo"}">
          <div class="need-ico">${def.icon}</div>
          <div class="need-txt">
            <strong>${def.name}</strong>
            <small>${done ? "готово ✓" : "📍 ИДИ В: " + room}</small>
            <small class="need-mach">${done ? "" : "автомат «" + short + "» · жёлтая стрелка на карте"}</small>
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
    c.save();
    c.translate(x, y + Math.sin(opts.bob || 0) * 2);
    c.scale(scale, scale);
    if (!opts.noShadow) {
      c.fillStyle = "rgba(0,0,0,0.25)";
      c.beginPath();
      c.ellipse(0, 22, 16, 6, 0, 0, Math.PI * 2);
      c.fill();
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
      // странная поза — уши вниз
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
    clear(ctxP);
    drawCritter(ctxP, 80, 78, {
      species: v.species,
      hollow: v.hollow,
      noShadow: v.noShadow,
      bob: performance.now() / 200,
      scale: 1.1,
    });
    if (v.twitch) {
      ctxP.fillStyle = "#ffd36a";
      ctxP.font = "bold 11px Nunito";
      ctxP.fillText("дёргается…", 42, 130);
    }
    if (v.voice) {
      ctxP.fillStyle = "#ef4d5a";
      ctxP.font = "bold 11px Nunito";
      ctxP.fillText("«хррр…»", 55, 18);
    }
    if (v.noShadow) {
      ctxP.fillStyle = "#ffd36a";
      ctxP.font = "bold 10px Nunito";
      ctxP.fillText("нет тени", 50, 130);
    }

    clear(ctxPh);
    drawCritter(ctxPh, 80, 78, {
      species: v.photoSpecies,
      distort: v.distort,
      wrongPose: v.wrongPose,
      bob: 0,
      scale: 1.05,
    });
    ctxPh.fillStyle = "#9aa8c0";
    ctxPh.font = "bold 10px Nunito";
    ctxPh.fillText("УДОСТОВЕРЕНИЕ", 8, 14);

    clear(ctxC, "#0a2818");
    drawCritter(ctxC, 80, 78, {
      species: v.cctvSpecies,
      teeth: v.teeth,
      bob: performance.now() / 350,
      scale: 1.0,
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
    ctxC.fillText("КАМЕРА", 10, 14);
  }

  function openDesk() {
    if (!g.queue.length) {
      toast("Очередь пуста");
      return;
    }
    deskPatient = g.queue[0];
    deskName.textContent = `${deskPatient.species.name} у окна`;
    deskQueueNote.textContent = `В группе / очереди ещё: ${Math.max(0, g.queue.length - 1)}`;
    deskClue.textContent = g.players[0].weapon
      ? "Аномалия? F — сразу убрать (принимать не нужно). Или шторка / впустить."
      : "Сравни клиента, удостоверение и камеру. Подозрительно — шторка.";
    renderInspectViews(deskPatient);
    state = "desk";
    showEl(deskPanel);
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
      const beds = getStations().filter((s) => s.kind === "treat");
      const taken = new Set(g.inside.map((p) => p.bed));
      const free = beds.find((b) => !taken.has(b.id));
      v.phase = "treating";
      v.diagnosed = false;
      v.delivered = [];
      if (free) {
        v.bed = free.id;
        v.x = free.x;
        v.y = free.y;
      } else {
        v.x = 700;
        v.y = 560;
      }
      g.inside.push(v);
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
    for (const needId of still.slice()) {
      if (player.infiniteItems) {
        patient.delivered.push(needId);
        applied += 1;
        continue;
      }
      const idx = player.inv.indexOf(needId);
      if (idx >= 0) {
        player.inv.splice(idx, 1);
        patient.delivered.push(needId);
        applied += 1;
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
      g.coins += 22 + patient.needs.length * 4;
      healSanity(player.cls.treatSanity);
      toast(`Пациент вылечен! (${patient.condition.name})`);
      for (let i = 0; i < 10; i++) {
        g.particles.push({
          x: patient.x,
          y: patient.y,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          life: 0.55,
          color: "#7ed9b8",
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

    const bar = near(player.x, player.y, stations.filter((s) => s.kind === "barman"));
    if (bar && g.barman && g.barman.state !== "gone") {
      talkToBarman(player);
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
    toast("Окно / кофе / бармен / автомат / стол · F — оружие");
  }

  function takeCoffee(player, station) {
    const id = station.id;
    const endless = g && g.shift && g.shift.endlessCoffee;
    const cd = endless ? 0 : coffeeCd[id] || 0;
    if (cd > 0) {
      toast(`Кофемашина перезаряжается… ${Math.ceil(cd)}с`);
      return;
    }
    // стакан в инвентарь; если полон — выпить сразу
    if (player.inv.length >= invMax(player)) {
      healSanity(18);
      if (!endless) coffeeCd[id] = 14;
      toast(endless ? "☕ ∞ кофе · выпил сразу" : "☕ Выпил на месте (инвентарь полон) · перезарядка");
      return;
    }
    player.inv.push("coffee_cup");
    if (!endless) coffeeCd[id] = 14;
    toast(endless ? "☕ ∞ кофе · стакан готов сразу" : "☕ Взял стакан кофе · отнеси бармену или выпей (E у кофе ещё раз с пустым слотом…)");
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

  function talkToBarman(player) {
    const b = g.barman;
    if (b.state === "gone") {
      toast("Бармен уже ушёл");
      return;
    }
    const cup = player.inv.indexOf("coffee_cup");
    if (cup >= 0) {
      player.inv.splice(cup, 1);
      b.coffees += 1;
      healSanity(4);
      renderInv();
      toast(`Бармен: «Спасибо за кофе» (${b.coffees})`);
      if (b.coffees >= 2 && b.state === "idle" && b.questCd <= 0 && !meta.coffee2) {
        b.state = "hint";
        showEvent("Бармен: «Подожди меня в кабинете (офис)…»", 4);
        toast("Иди в кабинет (офис) у зоны отдыха");
      }
      return;
    }
    if (b.state === "hint" || b.state === "waitOffice") {
      toast("Бармен: «Жди в кабинете. Полиция может спросить…»");
      return;
    }
    if (b.state === "hiding") {
      toast("Бармен прячется и молчит…");
      return;
    }
    toast("Бармен: «Принеси кофе с кофемашины»");
  }

  function waitInOffice(player) {
    const b = g.barman;
    if (!b || b.state === "gone") {
      toast("Пустой кабинет");
      return;
    }
    if (b.state === "hint" || b.state === "idle") {
      if (b.coffees < 2) {
        toast("Сначала угости бармена кофе (хотя бы 2 раза)");
        return;
      }
      b.state = "waitOffice";
      toast("Ждёшь в кабинете…");
      showEvent("Ты ждёшь в офисе. Скоро придёт полицейский…", 3.5);
      // полицейский ищет хитмана-бармена
      setTimeout(() => {
        if (!g || g.barman.state === "gone") return;
        g.barman.state = "hiding";
        g.barman.hideTimer = 18;
        g.policeman = { x: 620, y: 200, t: 20, answered: false };
        showEvent("👮 Полицейский: «Где хитман? Где бармен?!»", 4);
        toast("Полицейский у ресепшена. Если бармен не ответит — награда");
      }, 1600);
      return;
    }
    if (b.state === "hiding") {
      toast("Сидишь тихо. Бармен не отвечает полиции…");
      return;
    }
    toast("Кабинет для ожидания бармена");
  }

  function talkToPoliceman(player) {
    const p = g.policeman;
    if (!p || p.answered) {
      toast("Полицейский занят");
      return;
    }
    const giveAway = window.confirm(
      "Полицейский: «Это бармен — хитман? Сдать его?»\n\nOK = сдать\nОтмена = «Не знаю» (бармен не отвечает)"
    );
    p.answered = true;
    if (giveAway) {
      hurtSanity(12);
      g.barman.state = "gone";
      g.policeman = null;
      showEvent("Бармена увели. Второй кофемашины не будет…", 3.5);
      toast("Ты сдал бармена");
    } else {
      // бармен не отвечает → уходит и дарит 2-ю кофемашину
      g.barman.state = "gone";
      g.policeman = null;
      if (!meta.coffee2) {
        meta.coffee2 = true;
        storeSet(SAVE, meta);
        showEvent("Бармен молчал, ушёл и оставил 2-ю кофемашину! (тоже с перезарядкой)", 4.5);
        toast("☕☕ Открыта кофемашина 2");
        g.coins += 40;
      } else {
        showEvent("Бармен снова ушёл. Кофемашина 2 уже есть.", 3);
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
            showEvent("Бот сказал «не знаю». Бармен молчал и оставил 2-ю кофемашину!", 4);
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

      // носить кофе бармену (в одной линии задач с игроком)
      if (b.coffees < 2 && coffeeSt && barSt) {
        if (!buddy.inv.includes("coffee_cup")) {
          moveToward(buddy, coffeeSt.x, coffeeSt.y, dt);
          if (Math.hypot(buddy.x - coffeeSt.x, buddy.y - coffeeSt.y) < 55) takeCoffee(buddy, coffeeSt);
          return;
        }
        moveToward(buddy, barSt.x, barSt.y, dt);
        if (Math.hypot(buddy.x - barSt.x, buddy.y - barSt.y) < 55) talkToBarman(buddy);
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
      for (let i = 0; i < 3; i++) g.queue.push(makeVisitor());
      layoutQueue();
      showEvent("🚑 Массовое поступление!", 3);
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
    if (!g.endless) g.left -= dt;
    for (const k of Object.keys(coffeeCd)) {
      if (coffeeCd[k] > 0) coffeeCd[k] -= dt;
    }
    if (g.shutterFlash > 0) g.shutterFlash -= dt;
    if (g.lookUpWarn > 0) g.lookUpWarn -= dt;

    // бармен / полиция
    if (g.barman && g.barman.state !== "gone") {
      g.barman.questCd -= dt;
      if (g.barman.state === "hiding") {
        g.barman.hideTimer -= dt;
        // если полицейский ушёл, а бармен так и не ответил — награда
        if (g.barman.hideTimer <= 0 && g.policeman && !g.policeman.answered) {
          g.policeman = null;
          g.barman.state = "gone";
          if (!meta.coffee2) {
            meta.coffee2 = true;
            storeSet(SAVE, meta);
            showEvent("Полиция ушла. Бармен молчал и оставил 2-ю кофемашину!", 4);
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
            showEvent("Полиция ушла без ответа. Бармен подарил 2-ю кофемашину!", 4);
            g.coins += 40;
          }
        }
        g.policeman = null;
      }
    }

    hurtSanity(
      g.shift && g.shift.noDayDrain
        ? 0
        : dt * (0.55 + g.shift.id * 0.12 + (g.monsters.length ? 1.2 + g.monsters.length * 0.35 : 0))
    );
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
      if (g.queue.length < qMax) {
        g.queue.push(makeVisitor());
        layoutQueue();
      }
      g.spawnCd = Math.max(2.2, 5.5 - g.shift.id * 0.35);
    }

    g.eventCd -= dt;
    if (g.eventCd <= 0 && g.shift.eventRate > 0) {
      if (Math.random() < g.shift.eventRate + 0.15) spawnEvent();
      g.eventCd = 14 - g.shift.id;
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
    }
    g.particles = g.particles.filter((p) => p.life > 0);

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
      `<br>❤️ ${g.treated} · 🚫 ${g.blocked} · ⚠ ${g.leaked} · 👾 ${g.monsters.length} · ∞очередь ${g.queue.length}` +
      (eHint ? `<br><span style="color:#7ed9b8">${eHint}</span>` : "") +
      (g.players[0].weapon
        ? `<br><span style="color:#ffd36a">${g.players[0].weapon.icon} F — аномалию сразу · R зарядка · C кофе</span>`
        : `<br><span style="color:#ffd36a">C — выпить кофе из инвентаря</span>`) +
      `<br><span style="color:#9aa8c0">Ход: WASD или стрелки</span>`;

    sanityFill.style.width = (g.sanity / g.maxSanity) * 100 + "%";
    sanityText.textContent = `🧠 ${Math.ceil(g.sanity)}`;
    const req = g.requests && g.requests.length
      ? g.requests.slice(0, 8).map((r) => r.name + (r.weird ? "?" : "")).join(" · ")
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

  function drawActor(pl, label) {
    const theme = g && g.theme;
    const body =
      theme === "gold" ? "#ffd76a" : theme === "diamond" ? "#c8f4ff" : pl.color;
    const sash =
      theme === "gold" ? "#fff3b0" : theme === "diamond" ? "#7ad7ff" : "#7ed9b8";
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(pl.x, pl.y + 18, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = body;
    roundRect(pl.x - 12, pl.y - 20, 24, 34, 8);
    ctx.fill();
    ctx.fillStyle = sash;
    ctx.fillRect(pl.x - 12, pl.y - 2, 24, 6);
    ctx.fillStyle = "#e8b890";
    ctx.beginPath();
    ctx.arc(pl.x, pl.y - 26, 11, 0, Math.PI * 2);
    ctx.fill();
    if (theme === "gold" || theme === "diamond") {
      ctx.fillStyle = theme === "gold" ? "rgba(255,215,100,0.9)" : "rgba(180,240,255,0.95)";
      ctx.beginPath();
      ctx.arc(pl.x + 8, pl.y - 30, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "700 11px Nunito";
    ctx.textAlign = "center";
    ctx.fillText(label || pl.name, pl.x, pl.y - 42);
    ctx.textAlign = "left";
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
    ctx.fillStyle = theme === "gold" ? "#3a2808" : theme === "diamond" ? "#062030" : "#101624";
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
            : "rgba(255,255,255,0.1)";
      ctx.lineWidth = theme ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle =
        theme === "gold" ? "#ffe08a" : theme === "diamond" ? "#d8f6ff" : "rgba(255,255,255,0.7)";
      ctx.font = "800 15px Fredoka, Nunito, sans-serif";
      ctx.fillText(room.name, room.x + 12, room.y + 24);
    }

    // machines — крупные иконки + стрелки к нужным
    const needIds =
      focusPatient && focusPatient.diagnosed
        ? focusPatient.needs.filter((id) => !focusPatient.delivered.includes(id))
        : [];
    const wantedMachines = MACHINES.filter((m) => m.gives.some((id) => needIds.includes(id)));
    const guideFrom = g.players[0];
    for (const m of wantedMachines) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 211, 106, 0.85)";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(guideFrom.x, guideFrom.y);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // стрелка у автомата
      const ang = Math.atan2(m.y - guideFrom.y, m.x - guideFrom.x);
      ctx.fillStyle = "#ffd36a";
      ctx.translate(m.x, m.y - 55);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (const m of MACHINES) {
      const wanted = m.gives.some((id) => needIds.includes(id));
      const pulse = wanted ? 6 + Math.sin(g.t * 7) * 4 : 0;
      ctx.fillStyle = m.color || "#5a4a38";
      roundRect(m.x - 50 - pulse / 2, m.y - 40 - pulse / 2, 100 + pulse, 80 + pulse, 12);
      ctx.fill();
      if (wanted) {
        ctx.strokeStyle = "#ffd36a";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 211, 106, 0.92)";
        ctx.font = "900 16px Nunito";
        ctx.textAlign = "center";
        ctx.fillText("⬇ СЮДА ⬇", m.x, m.y - 52 - pulse);
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
        "#70a8c8";
      roundRect(s.x - 32, s.y - 18, 64, 36, 8);
      ctx.fill();
      // перезарядка кофе
      if (s.kind === "coffee" && coffeeCd[s.id] > 0) {
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
        ctx.fillText(s.label.split(" ")[0], s.x, s.y + 4);
        ctx.textAlign = "left";
      }
    }

    // бармен спрайт
    if (g.barman && g.barman.state !== "gone") {
      const b = g.barman;
      const bx = b.state === "hiding" ? 1280 : b.x;
      const by = b.state === "hiding" ? 820 : b.y;
      ctx.fillStyle = "#c45a7a";
      roundRect(bx - 12, by - 22, 24, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#f0c8a0";
      ctx.beginPath();
      ctx.arc(bx, by - 28, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "700 10px Nunito";
      ctx.fillText(b.state === "hiding" ? "…молчит" : "Бармен", bx - 18, by - 42);
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
      });
      if (v.isAnomaly && isOwner()) {
        ctx.fillStyle = "#ef4d5a";
        ctx.font = "900 11px Nunito";
        ctx.textAlign = "center";
        ctx.fillText("АНОМАЛИЯ", v.x, v.y - 44);
        ctx.textAlign = "left";
      }
    }
    for (const v of g.inside) {
      drawCritter(ctx, v.x, v.y, { species: v.species, bob: v.bob });
      if (v.isAnomaly && isOwner()) {
        ctx.fillStyle = "#ef4d5a";
        ctx.font = "900 11px Nunito";
        ctx.textAlign = "center";
        ctx.fillText("АНОМАЛИЯ", v.x, v.y - 48);
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
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
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
  document.getElementById("btnMenu").addEventListener("click", goMenu);
  document.getElementById("btnAdmit").addEventListener("click", admit);
  document.getElementById("btnReject").addEventListener("click", reject);
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
  showEl(menu);
  showEl(secretDeathWrap);
  requestAnimationFrame(frame);

  try {
    if (window.AmalHub && AmalHub.setPresence) AmalHub.setPresence("animal-hospital");
  } catch {}
})();
