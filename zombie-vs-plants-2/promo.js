/**
 * Дружеские промокоды PVZ-2 (не для всех, для своих).
 * Коды на разных языках открывают один сюрприз-пакет «ПОПУГАЙ».
 * Хозяин (Amal) и так имеет всё — это отдельный доступ для близких.
 */
(function (global) {
  "use strict";

  const STORAGE = "pvz2-friend-promo-v1";

  /** Сюрприз-способности — короткие русские названия + что делают */
  const ABILITIES = [
    {
      id: "slowmo",
      name: "Замедление",
      word: "время",
      desc: "Замедляет поле (не стоп). Включается и держится, пока не выключишь.",
      cd: 0,
      toggle: true,
    },
    {
      id: "screech",
      name: "Крик попугая",
      word: "крик",
      desc: "Все зомби замирают на 2 секунды.",
      cd: 16,
    },
    {
      id: "sunrain",
      name: "Дождь солнца",
      word: "солнце",
      desc: "С неба падает пачка солнышек.",
      cd: 20,
    },
    {
      id: "homeshield",
      name: "Щит дома",
      word: "щит",
      desc: "8 секунд зомби не могут пройти к дому (косилки отдыхают).",
      cd: 28,
    },
    {
      id: "giftplant",
      name: "Сюрприз-растение",
      word: "подарок",
      desc: "Случайное сильное растение сажается бесплатно в свободную клетку.",
      cd: 22,
    },
  ];

  /**
   * Нормализация: регистр, пробелы, латиница/кириллица.
   * «PARROT» и «ПОПУГАЙ» — главный код-слово.
   */
  function normalize(code) {
    return String(code || "")
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/á|à|ä|â/g, "a")
      .replace(/é|è|ë|ê/g, "e")
      .replace(/í|ì|ï|î/g, "i")
      .replace(/ó|ò|ö|ô/g, "o")
      .replace(/ú|ù|ü|û/g, "u")
      .replace(/ñ/g, "n")
      .replace(/[\s,.\-_/'"«»]+/g, "");
  }

  /** Коды для своих: разные языки → один пакет parrot */
  const CODE_TO_PACK = {
    // русский
    попугай: "parrot",
    парольпопугай: "parrot",
    кодпопугай: "parrot",
    сюрпризпопугай: "parrot",
    // английский
    parrot: "parrot",
    // испанский
    loro: "parrot",
    // турецкий
    papagan: "parrot",
    // казахский (тоты құс)
    тоты: "parrot",
    тотыкус: "parrot",
    тотыкусы: "parrot",
    // французский
    perroquet: "parrot",
    // немецкий
    papagei: "parrot",
    // итальянский
    pappagallo: "parrot",
    // португальский
    papagaio: "parrot",
    // польский
    papuga: "parrot",
    // узбекский (приближ.)
    totiqush: "parrot",
  };

  const PACKS = {
    parrot: {
      id: "parrot",
      title: "Пакет «Попугай»",
      blurb: "Сюрприз для своих. Не для всех игроков сайта.",
      abilities: ABILITIES.map((a) => a.id),
    },
  };

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return { packs: {} };
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : { packs: {} };
    } catch (_) {
      return { packs: {} };
    }
  }

  function writeState(st) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(st));
    } catch (_) {
      /* ignore */
    }
  }

  function hasPack(packId) {
    const st = readState();
    return !!(st.packs && st.packs[packId]);
  }

  function unlockedAbilityIds() {
    const st = readState();
    const ids = new Set();
    Object.keys(st.packs || {}).forEach((packId) => {
      const pack = PACKS[packId];
      if (pack) pack.abilities.forEach((id) => ids.add(id));
    });
    return [...ids];
  }

  function hasAnyPromo() {
    return unlockedAbilityIds().length > 0;
  }

  function redeem(rawCode) {
    const key = normalize(rawCode);
    if (!key) {
      return { ok: false, reason: "empty", message: "Введи промокод" };
    }
    const packId = CODE_TO_PACK[key];
    if (!packId || !PACKS[packId]) {
      return { ok: false, reason: "invalid", message: "Промокод не подходит" };
    }
    const st = readState();
    if (!st.packs) st.packs = {};
    const already = !!st.packs[packId];
    st.packs[packId] = {
      at: Date.now(),
      code: key,
    };
    writeState(st);
    const pack = PACKS[packId];
    const abilities = ABILITIES.filter((a) => pack.abilities.includes(a.id));
    return {
      ok: true,
      already,
      pack,
      abilities,
      message: already
        ? `Уже активировано: ${pack.title}`
        : `Промокод принят! ${pack.title}`,
    };
  }

  /** Быстрая самопроверка кодов (для тебя в консоли: PVZ2Promo.selfTest()) */
  function selfTest() {
    const samples = [
      "PARROT",
      "попугай",
      "Попугай",
      "loro",
      "PAPAGAN",
      "perroquet",
      "тоты",
      "badcode",
      "",
    ];
    const report = samples.map((c) => {
      const r = redeem(c);
      // не оставляем badcode в storage — redeem writes only on ok
      return { code: c, ok: r.ok, pack: r.pack && r.pack.id, message: r.message };
    });
    return report;
  }

  global.PVZ2Promo = {
    STORAGE,
    ABILITIES,
    PACKS,
    CODE_TO_PACK,
    normalize,
    redeem,
    hasPack,
    hasAnyPromo,
    unlockedAbilityIds,
    selfTest,
  };
})(typeof window !== "undefined" ? window : globalThis);
