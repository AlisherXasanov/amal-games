(() => {
  const W = 960;
  const H = 640;
  const STORAGE = "kick-buddy-v4";
  const FLOOR = H - 52;
  const GRAVITY = 2200;

  const store = {
    get(k, f) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? f : JSON.parse(v);
      } catch {
        return f;
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

  const PHRASES = [
    "Привет!",
    "Поиграй со мной!",
    "Мне это нравится!",
    "Давай ещё разок!",
    "Я Бади!",
    "Подбрось меня повыше!",
    "Как круто!",
    "Я умею прыгать!",
    "Может, новую одёжку?",
    "Ты самый лучший!",
    "Смотри, я хожу!",
    "Кидай меня в сторону!",
    "Ай, щекотно!",
    "Сильнее оружие — больше монет!",
    "Не скучай!",
    "Я всё ещё тут!",
    "Расскажу ещё что-нибудь!",
    "Хочешь поговорить?",
    "Я могу болтать без остановки!",
    "Слушай, это весело!",
    "Ещё фразу!",
    "Админ крутой!",
    "Шериф на месте!",
    "Купи бомбу — будет бабах!",
    "Огонь горячий!",
    "Лёд холодный!",
    "Я не замолкаю!",
  ];

  // Strength ladder: more dmg + coinMul → more coins per hit
  // ranged: click anywhere — projectile flies to that point
  const WEAPONS = [
    { id: "hand", name: "Рука", cost: 0, dmg: 0, coinMul: 0, knock: 0, element: "none", color: "#c4a060", desc: "Только двигать и кидать" },
    { id: "slap", name: "Пощёчина", cost: 30, dmg: 8, coinMul: 1, knock: 280, element: "none", color: "#e8a060", desc: "Слабый удар, мало монет" },
    { id: "bat", name: "Бита", cost: 90, dmg: 18, coinMul: 1.4, knock: 520, element: "none", color: "#8a5a28", desc: "Сильнее пощёчины" },
    { id: "sling", name: "Рогатка", cost: 130, dmg: 26, coinMul: 1.6, knock: 480, element: "none", color: "#6a8a40", ranged: true, proj: "pebble", speed: 920, size: 5, cd: 0.28, desc: "Кликни куда угодно — камень летит туда" },
    { id: "fire", name: "Огонь", cost: 180, dmg: 36, coinMul: 1.8, knock: 400, element: "fire", color: "#e05030", desc: "Стихия огня · поджог" },
    { id: "ice", name: "Лёд", cost: 220, dmg: 40, coinMul: 2, knock: 360, element: "ice", color: "#5ec8e8", desc: "Стихия льда · заморозка" },
    { id: "poison", name: "Яд", cost: 260, dmg: 28, coinMul: 2.1, knock: 300, element: "poison", color: "#6aaa3a", desc: "Яд · урон со временем" },
    { id: "shock", name: "Молния", cost: 320, dmg: 55, coinMul: 2.4, knock: 600, element: "shock", color: "#f1c40f", desc: "Электричество · сильный отброс" },
    { id: "wind", name: "Ветер", cost: 360, dmg: 48, coinMul: 2.5, knock: 1100, element: "wind", color: "#a8d8ff", desc: "Сносит Бади далеко" },
    { id: "lasso", name: "Лассо шерифа", cost: 400, dmg: 60, coinMul: 2.7, knock: 200, element: "lasso", color: "#c4a060", desc: "Шерифское · тянет и бьёт" },
    { id: "revolver", name: "Револьвер", cost: 450, dmg: 75, coinMul: 2.9, knock: 700, element: "none", color: "#4a4a50", ranged: true, proj: "bullet", speed: 1400, size: 4, cd: 0.16, desc: "Кликни в стену/Бади — пуля летит" },
    { id: "shotgun", name: "Дробовик", cost: 520, dmg: 28, coinMul: 2.6, knock: 650, element: "none", color: "#6a5040", ranged: true, exclusive: true, proj: "pellet", speed: 1100, size: 3, cd: 0.45, pellets: 6, spread: 0.22, desc: "Эксклюзив · дробь веером" },
    { id: "uzi", name: "Пистолет-пулемёт", cost: 580, dmg: 22, coinMul: 2.5, knock: 420, element: "none", color: "#5a5a60", ranged: true, exclusive: true, proj: "bullet", speed: 1250, size: 3, cd: 0.07, auto: true, spread: 0.08, desc: "Эксклюзив · зажми и строй очередь" },
    { id: "machinegun", name: "Пулемёт", cost: 720, dmg: 30, coinMul: 2.8, knock: 520, element: "none", color: "#3a4a3a", ranged: true, exclusive: true, proj: "bullet", speed: 1350, size: 4, cd: 0.05, auto: true, spread: 0.12, desc: "Эксклюзив · зажми ЛКМ — очередь" },
    { id: "sniper", name: "Снайперка", cost: 800, dmg: 140, coinMul: 3.4, knock: 900, element: "none", color: "#2a4a2a", ranged: true, exclusive: true, proj: "bullet", speed: 2200, size: 3, cd: 0.7, desc: "Эксклюзив · точный дальний выстрел" },
    { id: "bazooka", name: "Базука", cost: 950, dmg: 160, coinMul: 3.8, knock: 1200, element: "bomb", color: "#5a6a40", ranged: true, exclusive: true, proj: "rocket", speed: 620, size: 10, cd: 0.85, explode: true, explodeR: 95, desc: "Эксклюзив · кликни в стену — ракета летит и бахает" },
    { id: "flamethrower", name: "Огнемёт", cost: 880, dmg: 18, coinMul: 2.7, knock: 280, element: "fire", color: "#e05030", ranged: true, exclusive: true, proj: "flame", speed: 480, size: 14, cd: 0.04, auto: true, spread: 0.18, life: 0.55, desc: "Эксклюзив · зажми — струя огня" },
    { id: "minigun", name: "Миниган", cost: 1400, dmg: 38, coinMul: 3.2, knock: 580, element: "none", color: "#2a2a30", ranged: true, exclusive: true, proj: "bullet", speed: 1500, size: 4, cd: 0.03, auto: true, spread: 0.16, desc: "Эксклюзив · бешеный темп огня" },
    { id: "railgun", name: "Рельсотрон", cost: 1600, dmg: 220, coinMul: 4.2, knock: 1500, element: "shock", color: "#3de7ff", ranged: true, exclusive: true, proj: "laser", speed: 2800, size: 6, cd: 0.9, desc: "Эксклюзив · луч сквозь комнату" },
    // Минская серия — ТОЛЬКО хозяин Amal (не гости, не выданные админы)
    { id: "minsk_potato", name: "Картофелемёт Минск", cost: 0, dmg: 45, coinMul: 2.8, knock: 580, element: "none", color: "#c4a050", ranged: true, exclusive: true, minsk: true, ownerOnly: true, proj: "pebble", speed: 780, size: 8, cd: 0.32, desc: "🇧🇾 Только хозяин · из Минска · картошка" },
    { id: "minsk_tractor", name: "Трактор Минск", cost: 0, dmg: 95, coinMul: 3.3, knock: 1300, element: "none", color: "#3a7a30", minsk: true, exclusive: true, ownerOnly: true, desc: "🇧🇾 Только хозяин · мощный удар Беларусью" },
    { id: "minsk_mg", name: "Пулемёт Минск", cost: 0, dmg: 42, coinMul: 3.1, knock: 560, element: "none", color: "#c8102e", ranged: true, exclusive: true, minsk: true, ownerOnly: true, proj: "bullet", speed: 1450, size: 4, cd: 0.04, auto: true, spread: 0.1, desc: "🇧🇾 Только хозяин · зажми — очередь" },
    { id: "minsk_rpg", name: "Базука Минск", cost: 0, dmg: 180, coinMul: 3.9, knock: 1250, element: "bomb", color: "#009639", ranged: true, exclusive: true, minsk: true, ownerOnly: true, proj: "rocket", speed: 580, size: 11, cd: 0.8, explode: true, explodeR: 100, desc: "🇧🇾 Только хозяин · ракета в стену/Бади" },
    { id: "minsk_sniper", name: "Снайперка Минск", cost: 0, dmg: 170, coinMul: 3.7, knock: 950, element: "none", color: "#ffffff", ranged: true, exclusive: true, minsk: true, ownerOnly: true, proj: "bullet", speed: 2400, size: 3, cd: 0.65, desc: "🇧🇾 Только хозяин · точный выстрел" },
    { id: "bomb", name: "Бомба", cost: 480, dmg: 90, coinMul: 3, knock: 900, element: "bomb", color: "#3a3a3a", desc: "Взрыв · много монет" },
    { id: "meteor", name: "Метеор", cost: 750, dmg: 130, coinMul: 3.6, knock: 1000, element: "fire", color: "#c44a10", desc: "Огненный удар с неба" },
    // Админ / ∞ из Минска — тоже только хозяин
    { id: "admin", name: "Молот админа", cost: 0, dmg: 250, coinMul: 5, knock: 1500, element: "shock", color: "#a78bfa", adminOnly: true, desc: "🔒 Только админ · игроки видят, но взять нельзя" },
    { id: "minsk_inf_mg", name: "∞ Пулемёт Минск", cost: 0, dmg: 99999, coinMul: 12, knock: 900, element: "none", color: "#c8102e", ranged: true, adminOnly: true, minsk: true, ownerOnly: true, infHit: true, proj: "bullet", speed: 1600, size: 5, cd: 0.03, auto: true, spread: 0.14, desc: "🇧🇾🔒 Минск · ∞ урон · ТОЛЬКО хозяин" },
    { id: "minsk_inf_rpg", name: "∞ Базука Минск", cost: 0, dmg: 99999, coinMul: 12, knock: 1600, element: "bomb", color: "#009639", ranged: true, adminOnly: true, minsk: true, ownerOnly: true, infHit: true, proj: "rocket", speed: 700, size: 12, cd: 0.5, explode: true, explodeR: 140, desc: "🇧🇾🔒 Минск · ∞ урон · ТОЛЬКО хозяин" },
    { id: "minsk_inf_rail", name: "∞ Рельса Минск", cost: 0, dmg: 99999, coinMul: 15, knock: 1800, element: "shock", color: "#fce300", ranged: true, adminOnly: true, minsk: true, ownerOnly: true, infHit: true, proj: "laser", speed: 3200, size: 7, cd: 0.35, desc: "🇧🇾🔒 Минск · ∞ урон · ТОЛЬКО хозяин" },
    { id: "admin_chaos", name: "Хаос-молот", cost: 0, dmg: 99999, coinMul: 14, knock: 1700, element: "nuke", color: "#7c3aed", adminOnly: true, desc: "🔒 Только админ · хаотичный удар" },
    { id: "admin_starfall", name: "Звездопад", cost: 0, dmg: 99999, coinMul: 14, knock: 1500, element: "shock", color: "#f0abfc", ranged: true, adminOnly: true, infHit: true, proj: "laser", speed: 2600, size: 8, cd: 0.2, auto: true, spread: 0.2, desc: "🔒 Только админ · звёздный ливень" },
    { id: "vip_saber", name: "VIP-сабля", cost: 18000, dmg: 110, coinMul: 3.5, knock: 980, element: "shock", color: "#22d3ee", exclusive: true, vipOnly: true, desc: "💎 VIP · сильный ближний удар" },
    { id: "vip_pulse", name: "VIP-пульс", cost: 24000, dmg: 95, coinMul: 3.6, knock: 860, element: "shock", color: "#a78bfa", ranged: true, exclusive: true, vipOnly: true, proj: "laser", speed: 1800, size: 6, cd: 0.22, auto: true, spread: 0.06, desc: "💎 VIP · импульсная очередь" },
    { id: "vip_comet", name: "VIP-комета", cost: 32000, dmg: 175, coinMul: 4.1, knock: 1350, element: "fire", color: "#f472b6", ranged: true, exclusive: true, vipOnly: true, proj: "rocket", speed: 640, size: 11, cd: 0.7, explode: true, explodeR: 110, desc: "💎 VIP · комета с взрывом" },
    // Админ-пушки из магазина (очень сильные, почти как админ)
    { id: "rare_phoenix", name: "Админ · Феникс", cost: 750000, dmg: 12000, coinMul: 9.5, knock: 1900, element: "fire", color: "#fb7185", ranged: true, exclusive: true, rareStore: true, adminShop: true, proj: "flame", speed: 1100, size: 18, cd: 0.035, auto: true, spread: 0.1, life: 0.75, desc: "👑 Админ-пушка · огненный шквал · очень сильная" },
    { id: "rare_thunder", name: "Админ · Гроза", cost: 820000, dmg: 15000, coinMul: 10, knock: 2000, element: "shock", color: "#facc15", ranged: true, exclusive: true, rareStore: true, adminShop: true, proj: "laser", speed: 2800, size: 8, cd: 0.18, desc: "👑 Админ-пушка · грозовой луч · очень сильная" },
    { id: "rare_voidcannon", name: "Админ · Пустота", cost: 880000, dmg: 18000, coinMul: 10.5, knock: 2100, element: "nuke", color: "#6366f1", ranged: true, exclusive: true, rareStore: true, adminShop: true, proj: "rocket", speed: 780, size: 16, cd: 0.45, explode: true, explodeR: 160, desc: "👑 Админ-пушка · ядерный разрыв · очень сильная" },
    { id: "rare_glacier", name: "Админ · Ледник", cost: 700000, dmg: 10000, coinMul: 9, knock: 1600, element: "ice", color: "#67e8f9", exclusive: true, rareStore: true, adminShop: true, desc: "👑 Админ-пушка · ледяной удар · очень сильная" },
    { id: "rare_dragon", name: "Админ · Дракон", cost: 950000, dmg: 22000, coinMul: 11, knock: 2200, element: "fire", color: "#ef4444", exclusive: true, rareStore: true, adminShop: true, desc: "👑 Админ-пушка · драконий клинок · почти ∞" },
    { id: "nuke", name: "Супербомба", cost: 1200, dmg: 200, coinMul: 4.5, knock: 1400, element: "nuke", color: "#3a9a4a", desc: "Максимум силы и монет" },
  ];

  const CLOTHES = [
    { id: "none", name: "Без одежды", cost: 0, kind: "shirt", draw: null, desc: "Снять футболку · просто мешок" },
    { id: "tee_red", name: "Красная футболка", cost: 40, kind: "shirt", color: "#e05030", desc: "Яркая классика" },
    { id: "tee_blue", name: "Синяя футболка", cost: 40, kind: "shirt", color: "#3a7abd", desc: "Спокойный стиль" },
    { id: "tee_target", name: "Футболка-мишень", cost: 80, kind: "shirt", color: "#fff8f0", target: true, desc: "Как в ролике" },
    { id: "hoodie", name: "Толстовка", cost: 120, kind: "shirt", color: "#5a3a8a", hoodie: true, desc: "Уютно" },
    { id: "cap", name: "Кепка", cost: 60, kind: "hat", color: "#2a6a3a", desc: "На голову" },
    { id: "crown", name: "Корона", cost: 200, kind: "hat", color: "#e8a820", crown: true, desc: "Царь Бади" },
    { id: "scarf", name: "Шарф", cost: 70, kind: "extra", color: "#e05030", desc: "На шею" },
    { id: "glasses", name: "Очки", cost: 90, kind: "extra", glasses: true, desc: "Умный вид" },
  ];

  const BUDDIES = [
    {
      id: "SkinAdminBuffer",
      name: "SkinAdminBuffer",
      cost: 0,
      cloth: "#d4b8ff",
      dark: "#6d28d9",
      eye: "#fde68a",
      exclusive: true,
      premium: true,
      adminOnly: true,
      desc: "🔒 Только твой админ-скин · никто купить не может",
    },
    {
      id: "SkinLimitAdmin",
      name: "Админ (лимит)",
      cost: 100000,
      cloth: "#e8b060",
      dark: "#8a4010",
      eye: "#fff3c4",
      exclusive: true,
      limited: true,
      crown: true,
      desc: "👑 Покупной админ-скин с короной · не твой SkinAdminBuffer",
    },
    {
      id: "SkinAdminVoid",
      name: "Админ · Пустота",
      cost: 0,
      cloth: "#1e1b4b",
      dark: "#0f0a1a",
      eye: "#c4b5fd",
      exclusive: true,
      premium: true,
      adminOnly: true,
      desc: "🔒 Только админ · тёмный пустотный скин",
    },
    {
      id: "SkinAdminCrystal",
      name: "Админ · Кристалл",
      cost: 0,
      cloth: "#67e8f9",
      dark: "#0e7490",
      eye: "#ecfeff",
      exclusive: true,
      premium: true,
      adminOnly: true,
      desc: "🔒 Только админ · кристальный скин",
    },
    {
      id: "SkinAdminEmber",
      name: "Админ · Уголь",
      cost: 0,
      cloth: "#fb923c",
      dark: "#7c2d12",
      eye: "#fef08a",
      exclusive: true,
      premium: true,
      adminOnly: true,
      desc: "🔒 Только админ · огненный уголь",
    },
    {
      id: "SkinAdminFrost",
      name: "Админ · Мороз",
      cost: 0,
      cloth: "#bae6fd",
      dark: "#0369a1",
      eye: "#e0f2fe",
      exclusive: true,
      premium: true,
      adminOnly: true,
      desc: "🔒 Только админ · ледяной скин",
    },
    {
      id: "SkinAdminToxic",
      name: "Админ · Токсик",
      cost: 0,
      cloth: "#a3e635",
      dark: "#3f6212",
      eye: "#ecfccb",
      exclusive: true,
      premium: true,
      adminOnly: true,
      desc: "🔒 Только админ · ядовитый скин",
    },
    {
      id: "SkinAdminGold",
      name: "Админ · Золото",
      cost: 0,
      cloth: "#fbbf24",
      dark: "#92400e",
      eye: "#fffbeb",
      exclusive: true,
      premium: true,
      adminOnly: true,
      desc: "🔒 Только админ · золотой премиум",
    },
    {
      id: "SkinAdminRainbow",
      name: "Super Rainbow",
      cost: 1000000,
      cloth: "#ff6b6b",
      dark: "#4c1d95",
      eye: "#ffffff",
      exclusive: true,
      premium: true,
      rainbow: true,
      buyAdmin: true,
      desc: "🌈 Super Rainbow · радужный админ · в пакете за 1 000 000",
    },
    {
      id: "SkinAdminStorm",
      name: "Админ · Шторм",
      cost: 1000000,
      cloth: "#818cf8",
      dark: "#312e81",
      eye: "#c7d2fe",
      exclusive: true,
      premium: true,
      buyAdmin: true,
      desc: "⚡ Покупной админ-скин · в пакете Админ 1 000 000",
    },
    {
      id: "SkinAdminNova",
      name: "Админ · Нова",
      cost: 1000000,
      cloth: "#f472b6",
      dark: "#831843",
      eye: "#fce7f3",
      exclusive: true,
      premium: true,
      buyAdmin: true,
      desc: "✨ Покупной админ-скин · в пакете Админ 1 000 000",
    },
    {
      id: "SkinVipNeon",
      name: "VIP Неон",
      cost: 15000,
      cloth: "#4ade80",
      dark: "#166534",
      eye: "#f0abfc",
      exclusive: true,
      vip: true,
      vipOnly: true,
      desc: "💎 VIP-скин · неоновое свечение",
    },
    {
      id: "SkinVipRoyal",
      name: "VIP Рояль",
      cost: 22000,
      cloth: "#60a5fa",
      dark: "#1e3a8a",
      eye: "#fde68a",
      exclusive: true,
      vip: true,
      vipOnly: true,
      desc: "💎 VIP-скин · королевский синий",
    },
    {
      id: "SkinVipChrome",
      name: "VIP Хром",
      cost: 28000,
      cloth: "#e2e8f0",
      dark: "#64748b",
      eye: "#38bdf8",
      exclusive: true,
      vip: true,
      vipOnly: true,
      desc: "💎 VIP-скин · хромированный Бади",
    },
    {
      id: "SkinStoreAurora",
      name: "Аврора",
      cost: 12000,
      cloth: "#fda4af",
      dark: "#9f1239",
      eye: "#fef08a",
      exclusive: true,
      storeSkin: true,
      desc: "Магазин · закатный скин",
    },
    {
      id: "SkinStoreForest",
      name: "Лесной",
      cost: 14000,
      cloth: "#86efac",
      dark: "#14532d",
      eye: "#fef3c7",
      exclusive: true,
      storeSkin: true,
      desc: "Магазин · зелёный лесной скин",
    },
    {
      id: "SkinStoreOcean",
      name: "Океан",
      cost: 16000,
      cloth: "#7dd3fc",
      dark: "#075985",
      eye: "#fff7ed",
      exclusive: true,
      storeSkin: true,
      desc: "Магазин · морской скин",
    },
    {
      id: "SkinVipPlusAmethyst",
      name: "VIP+ Аметист",
      cost: 45000,
      cloth: "#c084fc",
      dark: "#581c87",
      eye: "#f5d0fe",
      exclusive: true,
      vipPlus: true,
      vipPlusOnly: true,
      desc: "VIP+ · фиолетовый премиум-скин",
    },
    {
      id: "SkinVipPlusObsidian",
      name: "VIP+ Обсидиан",
      cost: 52000,
      cloth: "#2e1065",
      dark: "#0c0219",
      eye: "#e9d5ff",
      exclusive: true,
      vipPlus: true,
      vipPlusOnly: true,
      desc: "VIP+ · тёмный обсидиановый скин",
    },
    {
      id: "SkinVipPlusAurora",
      name: "VIP+ Полярное",
      cost: 60000,
      cloth: "#a78bfa",
      dark: "#4c1d95",
      eye: "#fce7f3",
      exclusive: true,
      vipPlus: true,
      vipPlusOnly: true,
      desc: "VIP+ · полярное сияние",
    },
    {
      id: "SkinRareNebula",
      name: "Админ · Туманность",
      cost: 720000,
      cloth: "#c084fc",
      dark: "#4c1d95",
      eye: "#fef08a",
      exclusive: true,
      premium: true,
      crown: true,
      rareStore: true,
      adminShop: true,
      desc: "👑 Админ-скин · космос · плащ и корона",
    },
    {
      id: "SkinRareInferno",
      name: "Админ · Инферно",
      cost: 780000,
      cloth: "#f97316",
      dark: "#7c2d12",
      eye: "#fde68a",
      exclusive: true,
      premium: true,
      crown: true,
      rareStore: true,
      adminShop: true,
      desc: "👑 Админ-скин · огонь · плащ и корона",
    },
    {
      id: "SkinRareAbyss",
      name: "Админ · Бездна",
      cost: 850000,
      cloth: "#312e81",
      dark: "#020617",
      eye: "#a5b4fc",
      exclusive: true,
      premium: true,
      crown: true,
      rareStore: true,
      adminShop: true,
      desc: "👑 Админ-скин · бездна · плащ и корона",
    },
    {
      id: "SkinRareSolar",
      name: "Админ · Солнце",
      cost: 900000,
      cloth: "#fbbf24",
      dark: "#92400e",
      eye: "#fffbeb",
      exclusive: true,
      premium: true,
      crown: true,
      rareStore: true,
      adminShop: true,
      desc: "👑 Админ-скин · золотое солнце · плащ и корона",
    },
    {
      id: "SkinRareMythic",
      name: "Админ · Мифик",
      cost: 980000,
      cloth: "#e879f9",
      dark: "#701a75",
      eye: "#fdf4ff",
      exclusive: true,
      premium: true,
      crown: true,
      rareStore: true,
      adminShop: true,
      desc: "👑 Админ-скин · мифик · плащ и корона",
    },
    { id: "classic", name: "Классика", cost: 0, cloth: "#c4a060", dark: "#a88848", eye: "#1a1410", desc: "Обычный тряпичный Бади" },
    { id: "snow", name: "Снежный", cost: 120, cloth: "#e8f0f8", dark: "#b8c8d8", eye: "#3a5080", desc: "Белый зимний Бади" },
    { id: "mint", name: "Мятный", cost: 150, cloth: "#7dcea0", dark: "#54996f", eye: "#1a4030", desc: "Зелёный скин" },
    { id: "berry", name: "Ягодный", cost: 150, cloth: "#e07090", dark: "#a04060", eye: "#401020", desc: "Розовый скин" },
    { id: "robot", name: "Робот", cost: 280, cloth: "#8a94a8", dark: "#5a6478", eye: "#3de7ff", desc: "Металлический тип" },
    { id: "shadow", name: "Тень", cost: 320, cloth: "#3a3548", dark: "#1a1528", eye: "#a78bfa", desc: "Тёмный тип Бади" },
    { id: "sheriff", name: "Шериф", cost: 400, cloth: "#d4b070", dark: "#8a6830", eye: "#2a1c08", star: true, desc: "Шерифский Бади" },
    { id: "zombie", name: "Зомби", cost: 450, cloth: "#6a9a58", dark: "#3a6030", eye: "#c0ff40", desc: "Гнилой тип Бади" },
    { id: "fire", name: "Огненный", cost: 550, cloth: "#e07040", dark: "#902010", eye: "#ffe080", desc: "Горячий скин" },
    { id: "gold", name: "Золотой", cost: 800, cloth: "#f0d060", dark: "#c09020", eye: "#5a3800", desc: "Легендарный скин" },
  ];

  const old = store.get("kick-buddy-v3", null) || store.get("kick-buddy-v2", null);
  const save = store.get(STORAGE, old ? {
    coins: Math.max(300000, old.coins || 0),
    owned: old.owned || ["none"],
    shirt: old.shirt || "none",
    hat: old.hat || null,
    extra: old.extra || null,
    ownedWeapons: old.ownedWeapons || ["hand"],
    weapon: old.weapon || "hand",
    mute: !!old.mute,
    buddyType: old.buddyType || "classic",
    ownedBuddies: old.ownedBuddies || ["classic"],
    infDmg: !!old.infDmg,
    infCoins: !!old.infCoins,
    godMode: !!old.godMode,
    giant: !!old.giant,
    limitedAdmin: !!old.limitedAdmin,
    halfDmg: !!old.halfDmg,
    vip: !!old.vip,
    vipPlus: !!old.vipPlus,
    boughtAdmin: !!old.boughtAdmin,
    coinBoost: Math.max(1, Math.min(4, Number(old.coinBoost) || 1)),
    gotSite300k: true,
  } : {
    coins: 300000,
    owned: ["none"],
    shirt: "none",
    hat: null,
    extra: null,
    ownedWeapons: ["hand"],
    weapon: "hand",
    mute: false,
    buddyType: "classic",
    ownedBuddies: ["classic"],
    infDmg: false,
    infCoins: false,
    godMode: false,
    giant: false,
    limitedAdmin: false,
    halfDmg: false,
    vip: false,
    vipPlus: false,
    boughtAdmin: false,
    coinBoost: 1,
    gotSite300k: true,
  });
  if (!save.owned) save.owned = ["none"];
  if (!save.owned.includes("none")) save.owned.push("none");
  if (!save.ownedWeapons) save.ownedWeapons = ["hand"];
  if (!save.ownedWeapons.includes("hand")) save.ownedWeapons.push("hand");
  if (!save.ownedBuddies) save.ownedBuddies = ["classic"];
  if (!save.ownedBuddies.includes("classic")) save.ownedBuddies.push("classic");
  if (typeof save.limitedAdmin !== "boolean") save.limitedAdmin = false;
  if (typeof save.halfDmg !== "boolean") save.halfDmg = false;
  if (typeof save.vip !== "boolean") save.vip = false;
  if (typeof save.vipPlus !== "boolean") save.vipPlus = false;
  if (typeof save.boughtAdmin !== "boolean") save.boughtAdmin = false;
  if (typeof save.coinBoost !== "number" || save.coinBoost < 1) save.coinBoost = 1;
  save.coinBoost = Math.max(1, Math.min(4, Math.floor(save.coinBoost)));
  if (save.vipPlus) save.vip = true;
  if (save.boughtAdmin) {
    save.vip = true;
    save.vipPlus = true;
    save.limitedAdmin = true;
  }
  // migrate: старый id admin → SkinAdminBuffer; чужой лимит-скин не трогаем
  if (save.buddyType === "admin") save.buddyType = "SkinAdminBuffer";
  save.ownedBuddies = [...new Set(save.ownedBuddies.map((id) => (id === "admin" ? "SkinAdminBuffer" : id)))];
  if (!BUDDIES.find((b) => b.id === save.buddyType)) save.buddyType = "classic";
  if (!WEAPONS.find((w) => w.id === save.weapon)) save.weapon = "hand";
  if (typeof save.mute !== "boolean") save.mute = true;
  save.mute = true;
  if (typeof save.infDmg !== "boolean") save.infDmg = false;
  if (typeof save.infCoins !== "boolean") save.infCoins = false;
  if (typeof save.godMode !== "boolean") save.godMode = false;
  if (typeof save.giant !== "boolean") save.giant = false;
  // practice=1 / checkcode=1: обычный Бади + кнопка кода (без админ-команды в начале)
  const playerTest = /(?:\?|&)playertest=1(?:&|$)/.test(String(location.search || ""));
  const practiceStart = playerTest || /(?:\?|&)(?:checkcode|practice)=1(?:&|$)/.test(String(location.search || ""));
  let practiceGate = practiceStart; // пока true — isAdmin ложь, Бади обычный
  if (practiceStart) {
    try {
      localStorage.removeItem("kick-buddy-admin");
      if (window.AmalOwner && window.AmalOwner.lock) window.AmalOwner.lock();
    } catch { /* ignore */ }
    save.coins = 300000;
    save.limitedAdmin = false;
    save.halfDmg = false;
    save.infDmg = false;
    save.infCoins = false;
    save.godMode = false;
    save.ownedBuddies = (save.ownedBuddies || []).filter((id) => id !== "SkinAdminBuffer" && id !== "SkinLimitAdmin");
    if (!save.ownedBuddies.includes("classic")) save.ownedBuddies.unshift("classic");
    if (save.buddyType === "SkinAdminBuffer" || save.buddyType === "SkinLimitAdmin") save.buddyType = "classic";
    save.gotBuyTest300k = true;
    save.gotSite300k = true;
  } else if (!save.gotBuyTest300k) {
    save.coins = Math.max(save.coins || 0, 300000);
    save.gotBuyTest300k = true;
    save.gotSite300k = true;
  }

  // Infinite-damage admin weapon (visible in shop, unlock only for хозяин Минск)
  if (!WEAPONS.find((w) => w.id === "infdmg")) {
    WEAPONS.push({
      id: "infdmg",
      name: "∞ Урон Минск",
      cost: 0,
      dmg: 99999,
      coinMul: 12,
      knock: 1600,
      element: "nuke",
      color: "#c8102e",
      desc: "🇧🇾🔒 Минск · ∞ урон · ТОЛЬКО хозяин Amal",
      cheat: true,
      adminOnly: true,
      minsk: true,
      ownerOnly: true,
      infHit: true,
    });
  } else {
    const inf = WEAPONS.find((w) => w.id === "infdmg");
    inf.adminOnly = true;
    inf.cheat = true;
    inf.minsk = true;
    inf.ownerOnly = true;
    inf.infHit = true;
    inf.name = "∞ Урон Минск";
    inf.desc = "🇧🇾🔒 Минск · ∞ урон · ТОЛЬКО хозяин Amal";
    inf.color = "#c8102e";
  }

  function isAdmin() {
    try {
      // Практика: сначала обычный Бади, пока не введён верный личный код
      if (practiceGate) return false;
      if (window.__AMAL_GOD__ || window.__AMAL_OWNER__) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      if (new URLSearchParams(location.search).get("owner")) return true;
      if (window.AmalPowers && AmalPowers.isOwner && AmalPowers.isOwner()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      if (window.AmalOwner && window.AmalOwner.isOwner && window.AmalOwner.isOwner()) return true;
      const host = String(location.hostname || "");
      if (host === "127.0.0.1" || host === "localhost" || host === "::1") return true;
      return false;
    } catch {
      return false;
    }
  }

  /** Права Минск — только настоящий хозяин Amal (не localhost «просто так», не гости) */
  function isMinskOwner() {
    try {
      if (practiceGate) return false;
      if (window.__AMAL_OWNER__ === true) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      if (window.AmalPowers && AmalPowers.isOwner && AmalPowers.isOwner()) return true;
      if (window.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner()) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      const code = new URLSearchParams(location.search).get("owner");
      if (code === "AmalOwner2026" || code === "amal" || code === "1234" || code === "buddy") return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function canUseWeapon(w) {
    if (!w) return false;
    if ((w.minsk || w.ownerOnly) && !isMinskOwner()) return false;
    if (w.adminOnly && !isAdmin()) return false;
    if (w.vipOnly && !isVip()) return false;
    return true;
  }

  const VIP_PASS_COST = 80000;
  const VIP_PLUS_COST = 180000;
  const BUY_ADMIN_COST = 1000000;
  const COIN_BOOST_OFFERS = [
    { mul: 2, cost: 35000, name: "×2 монеты" },
    { mul: 3, cost: 75000, name: "×3 монеты" },
    { mul: 4, cost: 140000, name: "×4 монеты" },
  ];
  function isVipPlus() {
    return !!save.vipPlus || isAdmin();
  }
  function isVip() {
    return !!save.vip || isVipPlus() || isAdmin();
  }
  function hasBoughtAdmin() {
    return !!save.boughtAdmin || isAdmin();
  }
  function canUseBuddy(b) {
    if (!b) return false;
    if (b.adminOnly && !b.buyAdmin && !isAdmin()) return false;
    if (b.buyAdmin && !hasBoughtAdmin()) return false;
    if (b.vipPlusOnly && !isVipPlus()) return false;
    if (b.vipOnly && !isVip()) return false;
    return true;
  }
  function grantBoughtAdminPack() {
    save.boughtAdmin = true;
    save.limitedAdmin = true;
    save.halfDmg = true;
    save.vip = true;
    save.vipPlus = true;
    save.coinBoost = Math.max(coinBoostMul(), 3);
    BUDDIES.filter((b) => b.buyAdmin).forEach((b) => {
      if (!save.ownedBuddies.includes(b.id)) save.ownedBuddies.push(b.id);
    });
    save.buddyType = "SkinAdminRainbow";
  }
  function coinBoostMul() {
    return Math.max(1, Math.min(4, Number(save.coinBoost) || 1));
  }
  function addCoins(amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (!n) return 0;
    if (save.infCoins) {
      save.coins = Math.max(save.coins, 999999);
      return n;
    }
    const gained = Math.max(1, Math.floor(n * coinBoostMul()));
    save.coins += gained;
    return gained;
  }

  function redeemOwnerCode(code) {
    // Убираем пробелы/запятые: «1, 2, 3, 4» и «1 2 3 4» = 1234
    const c = String(code || "").trim().toLowerCase().replace(/[\s,.\-_/]+/g, "");
    if (!c) return false;
    const easy = ["amal", "1234", "buddy"];
    let ok = false;
    try {
      if (window.AmalOwner && window.AmalOwner.unlock && window.AmalOwner.unlock(c)) ok = true;
    } catch { /* ignore */ }
    // Если Pages отдаёт старый owner-cheats.js — короткие коды всё равно принимаем здесь
    if (!ok && easy.includes(c)) {
      try {
        localStorage.setItem("amal-owner-v3", "1");
        localStorage.removeItem("kick-buddy-admin");
        window.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: true }));
        ok = true;
      } catch { /* ignore */ }
    }
    if (!ok) return false;
    practiceGate = false;
    grantAdminLoot();
    persist();
    syncHud();
    if (typeof syncAdminUi === "function") syncAdminUi();
    return true;
  }

  // Снести только старый командный флаг (ключи хозяина НЕ трогаем)
  try {
    localStorage.removeItem("kick-buddy-admin");
  } catch { /* ignore */ }

  function markAdminLocal() {
    /* командный kick-buddy-admin больше не используем */
  }

  function grantMinskLoot() {
    if (!isMinskOwner()) return false;
    WEAPONS.filter((w) => w.minsk || w.ownerOnly).forEach((w) => {
      if (!save.ownedWeapons.includes(w.id)) save.ownedWeapons.push(w.id);
    });
    if (save.infDmg) save.weapon = "minsk_inf_mg";
    return true;
  }

  function grantAdminLoot() {
    if (!isAdmin()) return false;
    markAdminLocal();
    // Обычный админ-лут БЕЗ Минска (Минск — только хозяину)
    WEAPONS.forEach((w) => {
      if (w.minsk || w.ownerOnly) return;
      if (!save.ownedWeapons.includes(w.id)) save.ownedWeapons.push(w.id);
    });
    BUDDIES.forEach((b) => {
      if (!save.ownedBuddies.includes(b.id)) save.ownedBuddies.push(b.id);
    });
    CLOTHES.forEach((c) => {
      if (!save.owned.includes(c.id)) save.owned.push(c.id);
    });
    save.buddyType = "SkinAdminBuffer";
    if (!save.weapon || save.weapon === "hand") save.weapon = "admin";
    save.infDmg = true;
    save.infCoins = true;
    save.godMode = true;
    save.vip = true;
    save.vipPlus = true;
    save.boughtAdmin = true;
    save.coinBoost = 4;
    save.coins = Math.max(save.coins, 999999);
    grantMinskLoot();
    if (isMinskOwner() && (!save.weapon || !canUseWeapon(weaponById(save.weapon)))) {
      save.weapon = "minsk_inf_mg";
    }
    return true;
  }

  function stripAdminLootIfNeeded() {
    if (isAdmin()) {
      grantAdminLoot();
      // на всякий случай снять Минск, если это не хозяин (localhost без кода)
      if (!isMinskOwner()) {
        save.ownedWeapons = (save.ownedWeapons || []).filter((id) => {
          const w = WEAPONS.find((x) => x.id === id);
          return !(w && (w.minsk || w.ownerOnly));
        });
        const cur = weaponById(save.weapon);
        if (cur && (cur.minsk || cur.ownerOnly)) save.weapon = "admin";
      }
      return;
    }
    save.ownedWeapons = (save.ownedWeapons || []).filter((id) => {
      const w = WEAPONS.find((x) => x.id === id);
      if (!w) return true;
      if (w.minsk || w.ownerOnly) return false;
      if (w.adminOnly) return false;
      if (w.vipOnly && !save.vip) return false;
      return true;
    });
    if (!save.ownedWeapons.includes("hand")) save.ownedWeapons.unshift("hand");
    save.ownedBuddies = (save.ownedBuddies || []).filter((id) => {
      const b = BUDDIES.find((x) => x.id === id);
      if (!b) return true;
      if (b.adminOnly && !b.buyAdmin) return false;
      if (b.buyAdmin && !save.boughtAdmin) return false;
      if (b.vipPlusOnly && !save.vipPlus) return false;
      if (b.vipOnly && !save.vip && !save.vipPlus) return false;
      return true;
    });
    if (!save.ownedBuddies.includes("classic")) save.ownedBuddies.unshift("classic");
    const curW = weaponById(save.weapon);
    if (curW.adminOnly || curW.minsk || curW.ownerOnly || (curW.vipOnly && !save.vip && !save.vipPlus)) save.weapon = "hand";
    const curB = buddyById(save.buddyType);
    if (!canUseBuddy(curB)) save.buddyType = "classic";
    // полный админ-лут сбрасываем, лимит-админ (покупка) оставляем
    save.infDmg = false;
    save.infCoins = false;
    save.godMode = false;
    if (!save.limitedAdmin) save.halfDmg = false;
  }

  // Жёстко: SkinAdminBuffer только у настоящего админа
  if (!isAdmin()) {
    save.ownedBuddies = (save.ownedBuddies || []).filter((id) => id !== "SkinAdminBuffer");
    if (save.buddyType === "SkinAdminBuffer") save.buddyType = "classic";
  }

  stripAdminLootIfNeeded();
  persist();

  function persist() {
    store.set(STORAGE, {
      coins: save.coins,
      owned: save.owned,
      shirt: save.shirt,
      hat: save.hat,
      extra: save.extra,
      ownedWeapons: save.ownedWeapons,
      weapon: save.weapon,
      mute: save.mute,
      buddyType: save.buddyType,
      ownedBuddies: save.ownedBuddies,
      infDmg: save.infDmg,
      infCoins: save.infCoins,
      godMode: save.godMode,
      giant: save.giant,
      limitedAdmin: !!save.limitedAdmin,
      halfDmg: !!save.halfDmg,
      vip: !!save.vip,
      vipPlus: !!save.vipPlus,
      boughtAdmin: !!save.boughtAdmin,
      coinBoost: coinBoostMul(),
      gotSite300k: !!save.gotSite300k,
      gotBuyTest300k: !!save.gotBuyTest300k,
    });
  }

  function itemById(id) {
    return CLOTHES.find((c) => c.id === id) || CLOTHES[0];
  }

  function weaponById(id) {
    return WEAPONS.find((w) => w.id === id) || WEAPONS[0];
  }

  function buddyById(id) {
    return BUDDIES.find((b) => b.id === id) || BUDDIES[0];
  }

  function effectiveWeapon() {
    let w = weaponById(save.weapon);
    if ((w.minsk || w.ownerOnly) && !isMinskOwner()) {
      save.weapon = "hand";
      w = weaponById("hand");
    }
    if (w.infHit || (save.infDmg && w.id !== "hand")) {
      return { ...w, dmg: Math.max(w.dmg, 99999), coinMul: Math.max(w.coinMul, 10), knock: Math.max(w.knock, 1400) };
    }
    // лимит-админ: половина силы — ×2 урон, не ∞
    if (save.halfDmg && save.limitedAdmin && w.id !== "hand") {
      return { ...w, dmg: Math.round(w.dmg * 2), coinMul: w.coinMul * 1.5, knock: Math.round(w.knock * 1.25) };
    }
    return w;
  }

  const app = document.getElementById("app");
  const screen = document.createElement("div");
  screen.className = "screen";
  app.appendChild(screen);

  const canvas = document.createElement("canvas");
  canvas.id = "game";
  canvas.width = W;
  canvas.height = H;
  screen.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <div class="pill hp"><span class="label">Бади</span><span class="value" id="h-hp">100</span></div>
    <div class="pill coins"><span class="label">Монеты</span><span class="value" id="h-coins">0</span></div>
    <div class="pill weapon"><span class="label">Оружие</span><span class="value" id="h-weapon">Рука</span></div>
  `;
  screen.appendChild(hud);

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Рука — таскай · Ближний — удар по Бади · Стрельба — клик в стену/пол";
  screen.appendChild(hint);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  // build 37shopfix — Магазин: лимит/VIP/VIP+/×монеты/скины
  toolbar.innerHTML = `
    <button class="btn ghost" id="btn-shop">Одежда</button>
    <button class="btn ghost" id="btn-buddies">Типы Бади</button>
    <button class="btn danger" id="btn-weapons">Оружие</button>
    <button class="btn market-btn" id="btn-market">МАГАЗИН ★</button>
    <button class="btn" id="btn-jump">Прыг!</button>
    <button class="btn danger" id="btn-admin">Админ</button>
    <button class="btn danger" id="btn-revive" hidden>Оживить Бади</button>
  `;
  screen.appendChild(toolbar);

  const overlay = document.createElement("div");
  overlay.className = "overlay hidden";
  screen.appendChild(overlay);

  const el = {
    hp: hud.querySelector("#h-hp"),
    coins: hud.querySelector("#h-coins"),
    weapon: hud.querySelector("#h-weapon"),
  };

  const buddy = {
    x: W / 2,
    y: FLOOR - 70,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 1,
    squat: 0,
    armPhase: 0,
    blink: 0,
    smile: 1,
    phrase: "",
    phraseT: 0,
    jumpCd: 0.35 + Math.random() * 0.7,
    sayCd: 0.8,
    walkCd: 0.5,
    walkDir: 1,
    coinAcc: 0,
    bob: 0,
    spin: 0,
    hp: 100,
    maxHp: 100,
    hurtT: 0,
    faceAuraT: 0,
    faceAuraColor: "#ffd76a",
    frozenT: 0,
    burnT: 0,
    poisonT: 0,
    rebuildT: 0,
    dead: false,
  };

  const particles = [];
  const floats = [];
  const blasts = [];
  const wallMarks = [];
  const projectiles = [];
  let drag = null;
  let listening = false;
  let recognition = null;
  let attackCd = 0;
  let aim = { x: W * 0.7, y: H * 0.4, down: false };
  let muzzleFlash = 0;

  function isRanged(w) {
    return !!(w && w.ranged);
  }

  function muzzlePos(tx, ty) {
    // Gun sits near bottom-left; flips if aiming left
    const left = tx < W * 0.45;
    return {
      x: left ? W - 70 : 70,
      y: FLOOR - 28,
    };
  }

  // ГОЛОС УБИТ НАВСЕГДА — даже старый кэш/браузер не сможет говорить
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak = function () {};
      window.speechSynthesis.resume = function () {};
      window.speechSynthesis.pause = function () {};
    }
  } catch { /* ignore */ }

  // Голос (TTS) отключён навсегда — только тишина
  let speaking = false;
  let speechBusy = false;
  let voiceLockUntil = 0;

  function killVoiceForever() {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak = function () {};
    } catch { /* ignore */ }
  }

  function stopAllSpeech() {
    speaking = false;
    speechBusy = false;
    buddy.phrase = "";
    buddy.phraseT = 0;
    voiceLockUntil = 0;
    killVoiceForever();
  }

  function syncMuteButtons() {
    // кнопки речи убраны
  }

  function syncHud() {
    el.hp.textContent = String(Math.max(0, Math.ceil(buddy.hp)));
    const boost = coinBoostMul();
    el.coins.textContent = save.infCoins ? "∞" : (String(save.coins) + (boost > 1 ? " ×" + boost : ""));
    const wName = weaponById(save.weapon).name;
    let mark = "";
    if ((save.infDmg && save.weapon !== "hand") || weaponById(save.weapon).infHit) mark = " ∞";
    else if (save.halfDmg && save.limitedAdmin && save.weapon !== "hand") mark = " ×2";
    el.weapon.textContent = wName + mark;
  }

  function floatText(x, y, text, color) {
    floats.push({ x, y, text, color, life: 1 });
  }

  function burst(x, y, color, n = 12, speed = 220) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.3 + Math.random());
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0.4 + Math.random() * 0.5,
        s: 2 + Math.random() * 5,
        color,
      });
    }
  }

  function setDeadUI(dead) {
    const rev = toolbar.querySelector("#btn-revive");
    if (rev) rev.hidden = !dead;
    if (dead) {
      hint.textContent = "Бади погиб (0 HP). Нажми «Оживить Бади»";
    } else if (save.mute) {
      hint.textContent = "Бади молчит. Одежда · оружие · прыжки";
    } else {
      const w = effectiveWeapon();
      hint.textContent = isRanged(w)
        ? (w.auto ? "Зажми ЛКМ — очередь летит куда целишься (стена, пол, Бади)" : "Кликни куда угодно — снаряд летит в эту точку")
        : "Ближнее оружие — удар по Бади · Рука — таскай";
    }
  }

  function rebuildBuddy() {
    buddy.hp = buddy.maxHp;
    buddy.dead = false;
    buddy.rebuildT = 0;
    buddy.frozenT = 0;
    buddy.burnT = 0;
    buddy.poisonT = 0;
    buddy.x = W / 2;
    buddy.y = FLOOR - 70;
    buddy.vx = 0;
    buddy.vy = 0;
    setDeadUI(false);
    syncHud();
    say("Я снова цел!", { voice: true });
  }

  function killBuddy(wpn) {
    if (buddy.dead) return;
    buddy.hp = 0;
    buddy.dead = true;
    buddy.rebuildT = 0; // no auto-revive — wait for admin button
    buddy.burnT = 0;
    buddy.poisonT = 0;
    buddy.frozenT = 0;
    buddy.vx *= 0.3;
    buddy.vy = -200;
    const mul = wpn && wpn.coinMul ? wpn.coinMul : 1;
    const bonus = addCoins(25 * mul);
    persist();
    syncHud();
    setDeadUI(true);
    floatText(buddy.x, buddy.y - 120, "ПОГИБ · +" + bonus + "◎", "#e05030");
    burst(buddy.x, buddy.y, "#c4a060", 40, 450);
    say("Я погиб… Оживи меня!", { voice: true });
  }

  function attackBuddy(wpnIn, fromX, fromY, opts = {}) {
    const wpn = save.infDmg && wpnIn.id !== "hand" ? { ...effectiveWeapon(), ...wpnIn, dmg: wpnIn.dmg } : wpnIn;
    if (buddy.dead || wpn.id === "hand" || wpn.dmg <= 0) return;
    if (!opts.skipCd && attackCd > 0) return;
    if (!opts.skipCd) {
      const heavy = ["bomb", "nuke", "meteor", "admin", "infdmg", "bazooka"].includes(wpn.id) || wpn.element === "bomb" || wpn.element === "nuke";
      attackCd = wpn.cd != null ? wpn.cd : heavy ? 0.55 : 0.2;
    }

    let dmg = wpn.dmg;
    if (buddy.frozenT > 0 && (wpn.element === "fire" || wpn.id === "meteor")) dmg = Math.floor(dmg * 1.35);
    if (buddy.burnT > 0 && wpn.element === "ice") dmg = Math.floor(dmg * 1.2);
    if (wpn.element === "lasso") dmg = Math.floor(dmg * 1.1);

    if (save.godMode) {
      floatText(buddy.x, buddy.y - 100, "БОГ · 0", "#7c3aed");
    } else {
      buddy.hp -= dmg;
    }
    buddy.hurtT = 0.35;
    buddy.smile = 0.7;

    const coins = addCoins(Math.max(1, Math.floor(dmg * wpn.coinMul * 0.42)));
    persist();
    syncHud();

    buddy.faceAuraT = Math.max(buddy.faceAuraT, 0.45 + Math.min(1.4, (dmg * wpn.coinMul) / 180));
    buddy.faceAuraColor = wpn.color || "#ffd76a";

    let ang = Math.atan2(buddy.y - fromY, buddy.x - fromX);
    if (!Number.isFinite(ang)) ang = buddy.facing >= 0 ? 0.2 : Math.PI - 0.2;
    if (wpn.element === "lasso") {
      // pull toward click then bounce
      buddy.vx = (fromX - buddy.x) * 4;
      buddy.vy = (fromY - buddy.y) * 2 - 200;
    } else if (wpn.element === "wind") {
      buddy.vx += Math.cos(ang) * wpn.knock;
      buddy.vy += -Math.abs(wpn.knock) * 0.35;
    } else {
      buddy.vx += Math.cos(ang) * wpn.knock * 0.9;
      buddy.vy += Math.sin(ang) * wpn.knock * 0.35 - wpn.knock * 0.25;
    }
    buddy.onGround = false;
    buddy.spin += (buddy.vx > 0 ? 1 : -1) * (8 + wpn.dmg * 0.05);

    floatText(buddy.x, buddy.y - 80, "-" + dmg, wpn.color);
    floatText(buddy.x + 24, buddy.y - 100, "+" + coins + "◎", "#e8a820");
    burst(buddy.x, buddy.y - 20, wpn.color, 10 + Math.min(30, dmg / 4), 160 + wpn.knock * 0.15);

    const quiet = opts.skipCd && Math.random() > 0.14;

    if (wpn.element === "fire" || wpn.id === "meteor") {
      buddy.burnT = Math.max(buddy.burnT, wpn.id === "meteor" ? 3.2 : wpn.proj === "flame" ? 1.4 : 2.2);
      buddy.frozenT = 0;
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.35, r: wpn.id === "meteor" ? 70 : 40, color: "#e05030" });
      if (!quiet) say("Жарко!");
    } else if (wpn.element === "ice") {
      buddy.frozenT = 1.8;
      buddy.burnT = 0;
      buddy.vx *= 0.2;
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.4, r: 36, color: "#5ec8e8" });
      if (!quiet) say("Холодно!");
    } else if (wpn.element === "poison") {
      buddy.poisonT = 3.5;
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.4, r: 38, color: "#6aaa3a" });
      if (!quiet) say("Фу, яд!");
    } else if (wpn.element === "shock") {
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 30, life: 0.25, r: 50, color: wpn.color });
      if (!quiet) say("Бзззт!");
    } else if (wpn.element === "wind") {
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.3, r: 55, color: "#a8d8ff" });
      if (!quiet) say("Уносит!");
    } else if (wpn.element === "lasso") {
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.3, r: 45, color: "#c4a060" });
      if (!quiet) say("Шериф поймал!");
    } else if (wpn.element === "bomb" || wpn.element === "nuke") {
      if (!opts.skipCd) {
        blasts.push({
          x: buddy.x,
          y: buddy.y - 10,
          life: 0.5,
          r: wpn.element === "nuke" ? 120 : 70,
          color: wpn.color,
        });
        burst(buddy.x, buddy.y, "#ffe08a", wpn.element === "nuke" ? 40 : 22, 500);
      }
      if (!quiet) say(wpn.element === "nuke" ? "Какой взрыв!" : "Бабах!");
    } else if (!quiet) {
      say(["Ай!", "Ой!", "Больно!", "Ещё!"][Math.floor(Math.random() * 4)]);
    }

    if (buddy.hp <= 0 && !save.godMode) killBuddy(wpn);
  }

  function spawnProjectile(wpn, tx, ty, angOffset = 0) {
    const m = muzzlePos(tx, ty);
    let ang = Math.atan2(ty - m.y, tx - m.x) + angOffset;
    const spd = wpn.speed || 1000;
    const life = wpn.life || Math.hypot(tx - m.x, ty - m.y) / spd + 0.15;
    projectiles.push({
      x: m.x,
      y: m.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life,
      maxLife: life,
      r: wpn.size || 4,
      color: wpn.color,
      kind: wpn.proj || "bullet",
      wpnId: wpn.id,
      targetX: tx,
      targetY: ty,
      explode: !!wpn.explode,
      explodeR: wpn.explodeR || 70,
      hit: false,
    });
    muzzleFlash = 0.08;
  }

  function fireRangedAt(tx, ty) {
    const wpn = effectiveWeapon();
    if (!isRanged(wpn) || buddy.dead) return false;
    if (attackCd > 0) return false;

    attackCd = wpn.cd != null ? wpn.cd : 0.2;
    const pellets = wpn.pellets || 1;
    const spread = wpn.spread || 0;

    for (let i = 0; i < pellets; i++) {
      let off = 0;
      if (pellets > 1) off = (i - (pellets - 1) / 2) * (spread || 0.12);
      else if (spread) off = (Math.random() - 0.5) * spread * 2;
      spawnProjectile(wpn, tx, ty, off);
    }

    // muzzle sparks
    const m = muzzlePos(tx, ty);
    burst(m.x, m.y, wpn.color, pellets > 1 ? 8 : 4, 180);
    return true;
  }

  function resolveProjWeapon(proj) {
    const base = weaponById(proj.wpnId);
    let wpn = { ...base };
    if (base.infHit || (save.infDmg && base.id !== "hand")) {
      wpn = { ...base, dmg: Math.max(base.dmg, 99999), coinMul: Math.max(base.coinMul, 10), knock: Math.max(base.knock, 1400) };
    } else if (save.halfDmg && save.limitedAdmin && base.id !== "hand") {
      wpn = { ...base, dmg: Math.round(base.dmg * 2), coinMul: base.coinMul * 1.5, knock: Math.round(base.knock * 1.25) };
    }
    return wpn;
  }

  function grantCoinsFromWeapon(wpn, scale, x, y) {
    const power = Math.max(1, (wpn.dmg || 1) * (wpn.coinMul || 1));
    const raw = Math.max(1, Math.floor(power * scale * (save.infCoins ? 0.05 : 1)));
    const coins = addCoins(raw);
    persist();
    syncHud();
    floatText(x, y - 18, "+" + coins + "◎", "#e8a820");
    return coins;
  }

  /** Попадание в стену/пол: метка с аурой + аура на лице Бади + монеты по силе */
  function impactWall(x, y, proj) {
    const wpn = resolveProjWeapon(proj);
    const power = Math.max(1, wpn.dmg * wpn.coinMul);
    const r = 16 + Math.min(90, Math.sqrt(power) * 2.2);
    wallMarks.push({
      x,
      y,
      life: 1.1 + Math.min(2.4, power / 220),
      maxLife: 1.1 + Math.min(2.4, power / 220),
      r,
      color: wpn.color || proj.color || "#ffd76a",
      power,
    });
    blasts.push({ x, y, life: 0.28 + Math.min(0.5, power / 400), r: r * 0.7, color: wpn.color || proj.color });
    burst(x, y, wpn.color || proj.color, 6 + Math.min(24, power / 40), 140 + Math.min(360, power * 0.4));

    buddy.faceAuraT = Math.max(buddy.faceAuraT, 0.55 + Math.min(1.8, power / 160));
    buddy.faceAuraColor = wpn.color || "#ffd76a";
    // в стену тоже дают монеты — чем сильнее пушка, тем больше (авто-очередь слабее за тик)
    grantCoinsFromWeapon(wpn, wpn.auto ? 0.04 : 0.15, x, y);
  }

  function applyProjectileHit(proj, fromX, fromY, splashScale = 1) {
    let wpn = resolveProjWeapon(proj);
    wpn.dmg = Math.max(1, Math.floor(wpn.dmg * splashScale));
    if (buddy.dead || wpn.dmg <= 0) return;
    attackBuddy(wpn, fromX, fromY, { skipCd: true });
  }

  function explodeAt(x, y, proj) {
    const r = proj.explodeR || 80;
    blasts.push({ x, y, life: 0.55, r, color: proj.color });
    burst(x, y, "#ffe08a", 28, 520);
    burst(x, y, proj.color, 18, 400);

    const dx = buddy.x - x;
    const dy = (buddy.y - 20) - y;
    const dist = Math.hypot(dx, dy);
    if (dist < r + 40 && !buddy.dead) {
      const falloff = Math.max(0.35, 1 - dist / (r + 40));
      applyProjectileHit(proj, x, y, falloff);
    } else {
      impactWall(x, y, proj);
    }
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const ox = p.x;
      const oy = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.kind === "rocket") {
        // slight smoke trail
        if (Math.random() < 0.6) {
          particles.push({
            x: p.x - p.vx * 0.01,
            y: p.y - p.vy * 0.01,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 0.25,
            s: 3 + Math.random() * 4,
            color: "rgba(80,80,80,0.45)",
          });
        }
      } else if (p.kind === "flame") {
        p.r += 40 * dt;
        particles.push({
          x: p.x + (Math.random() - 0.5) * 10,
          y: p.y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 30,
          vy: -40 - Math.random() * 40,
          life: 0.2,
          s: 4 + Math.random() * 6,
          color: Math.random() < 0.5 ? "#e05030" : "#ffcc40",
        });
      } else if (p.kind === "laser") {
        particles.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0.12,
          s: p.r,
          color: p.color,
        });
      }

      // reached aim point (for rockets / precise shots)
      const toTarget = Math.hypot(p.targetX - p.x, p.targetY - p.y);
      const passed =
        (p.targetX - ox) * (p.targetX - p.x) + (p.targetY - oy) * (p.targetY - p.y) <= 0;

      // buddy collision along segment
      const bx = buddy.x;
      const by = buddy.y - 20;
      const hitR = 55 + p.r;
      const nearBuddy = Math.hypot(p.x - bx, p.y - by) < hitR;

      if (!p.hit && nearBuddy && !buddy.dead) {
        p.hit = true;
        if (p.explode) {
          explodeAt(p.x, p.y, p);
        } else {
          applyProjectileHit(p, ox, oy, 1);
          burst(p.x, p.y, p.color, 8, 220);
        }
        projectiles.splice(i, 1);
        continue;
      }

      const out =
        p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40 || p.life <= 0 || (passed && toTarget < 22);

      if (out) {
        const ix = Math.max(8, Math.min(W - 8, passed && toTarget < 40 ? p.targetX : p.x));
        const iy = Math.max(8, Math.min(H - 8, passed && toTarget < 40 ? p.targetY : p.y));
        if (p.explode && !p.hit) {
          explodeAt(ix, iy, p);
        } else if (!p.hit && (p.kind === "bullet" || p.kind === "pellet" || p.kind === "pebble" || p.kind === "laser" || p.kind === "flame" || p.kind === "rocket")) {
          impactWall(ix, iy, p);
        }
        projectiles.splice(i, 1);
      }
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      if (p.kind === "rocket") {
        ctx.fillStyle = p.color;
        roundRectPath(-12, -5, 22, 10, 3);
        ctx.fill();
        ctx.fillStyle = "#e05030";
        ctx.beginPath();
        ctx.moveTo(-12, -5);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-12, 5);
        ctx.fill();
        ctx.fillStyle = "#ffcc40";
        ctx.beginPath();
        ctx.arc(10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "flame") {
        ctx.globalAlpha = Math.max(0.25, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.kind === "laser") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.r;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.kind === "pebble") {
        ctx.fillStyle = "#6a5630";
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#f5f0c8";
        ctx.fillRect(-6, -1.5, 12, 3);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(6, 0, p.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /** Draws weapon art facing +X around origin. Works with any canvas 2d context. */
  function paintWeaponArt(g, wpn, scale = 1) {
    if (!wpn || wpn.id === "hand") return;
    g.save();
    g.scale(scale, scale);
    const c = wpn.color || "#888";
    const id = wpn.id;
    const rr = (x, y, w, h, r) => {
      const rad = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + rad, y);
      g.arcTo(x + w, y, x + w, y + h, rad);
      g.arcTo(x + w, y + h, x, y + h, rad);
      g.arcTo(x, y + h, x, y, rad);
      g.arcTo(x, y, x + w, y, rad);
      g.closePath();
    };

    if (id === "slap") {
      g.fillStyle = c;
      g.beginPath();
      g.ellipse(8, 0, 16, 12, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#e8c090";
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(18 + i * 3, -8 + i * 5, 4, 7, 0.2, 0, Math.PI * 2);
        g.fill();
      }
    } else if (id === "bat" || id.includes("tractor")) {
      g.fillStyle = "#5a3a18";
      rr(-18, -4, 22, 8, 2);
      g.fill();
      g.fillStyle = c;
      rr(2, -7, 38, 14, 6);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.2)";
      rr(8, -5, 18, 4, 2);
      g.fill();
    } else if (id === "sling" || id === "minsk_potato") {
      g.strokeStyle = "#5a3a18";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(-6, 10);
      g.quadraticCurveTo(-2, -16, 14, -12);
      g.stroke();
      g.beginPath();
      g.moveTo(-6, 10);
      g.quadraticCurveTo(-2, 16, 14, 12);
      g.stroke();
      g.strokeStyle = "#c4a060";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(14, -12);
      g.lineTo(14, 12);
      g.stroke();
      g.fillStyle = id === "minsk_potato" ? "#c4a050" : "#6a5630";
      g.beginPath();
      g.arc(22, 0, id === "minsk_potato" ? 8 : 5, 0, Math.PI * 2);
      g.fill();
    } else if (id === "lasso") {
      g.strokeStyle = c;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(10, 0, 16, 0, Math.PI * 1.7);
      g.stroke();
      g.beginPath();
      g.moveTo(-10, 8);
      g.quadraticCurveTo(0, 18, 10, 16);
      g.stroke();
    } else if (wpn.element === "fire" && !wpn.ranged) {
      g.fillStyle = c;
      g.beginPath();
      g.moveTo(0, 14);
      g.quadraticCurveTo(-14, -4, 0, -18);
      g.quadraticCurveTo(14, -4, 0, 14);
      g.fill();
      g.fillStyle = "#ffe08a";
      g.beginPath();
      g.moveTo(0, 8);
      g.quadraticCurveTo(-6, -2, 0, -10);
      g.quadraticCurveTo(6, -2, 0, 8);
      g.fill();
    } else if (wpn.element === "ice" && !wpn.ranged) {
      g.strokeStyle = c;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(0, -18);
      g.lineTo(0, 18);
      g.moveTo(-12, -6);
      g.lineTo(12, 6);
      g.moveTo(12, -6);
      g.lineTo(-12, 6);
      g.stroke();
      g.fillStyle = "rgba(94,200,232,0.45)";
      g.beginPath();
      g.arc(0, 0, 10, 0, Math.PI * 2);
      g.fill();
    } else if (wpn.element === "poison" && !wpn.ranged) {
      g.fillStyle = c;
      g.beginPath();
      g.arc(0, 2, 12, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#9ccc5a";
      g.beginPath();
      g.ellipse(0, -10, 6, 10, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(-4, 0, 2, 0, Math.PI * 2);
      g.arc(4, 4, 2, 0, Math.PI * 2);
      g.fill();
    } else if ((wpn.element === "shock" || wpn.element === "wind") && !wpn.ranged && !id.includes("saber") && !id.includes("chaos") && id !== "admin") {
      g.strokeStyle = c;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-4, -18);
      g.lineTo(6, -4);
      g.lineTo(-2, -2);
      g.lineTo(8, 18);
      g.lineTo(-2, 4);
      g.lineTo(4, 2);
      g.closePath();
      g.stroke();
      g.fillStyle = c;
      g.globalAlpha = 0.35;
      g.fill();
      g.globalAlpha = 1;
    } else if (id.includes("saber") || id === "rare_dragon" || id === "rare_glacier") {
      g.fillStyle = "#888";
      rr(-8, -3, 14, 6, 1);
      g.fill();
      g.fillStyle = c;
      g.beginPath();
      g.moveTo(4, -5);
      g.lineTo(42, 0);
      g.lineTo(4, 5);
      g.closePath();
      g.fill();
      g.fillStyle = "#ffe08a";
      g.fillRect(-2, -8, 4, 16);
    } else if (id === "admin" || id.includes("chaos") || id.includes("hammer")) {
      g.fillStyle = "#5a4a3a";
      rr(-6, -4, 28, 8, 2);
      g.fill();
      g.fillStyle = c;
      rr(18, -14, 22, 28, 3);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.25)";
      rr(22, -10, 8, 8, 2);
      g.fill();
    } else if (wpn.element === "bomb" || wpn.element === "nuke" || id === "bomb" || id === "nuke" || id === "meteor") {
      g.fillStyle = c;
      g.beginPath();
      g.arc(6, 4, id === "nuke" ? 16 : 13, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#2a2a28";
      rr(0, -10, 10, 8, 2);
      g.fill();
      g.strokeStyle = "#ffcc40";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(5, -10);
      g.quadraticCurveTo(14, -22, 18, -14);
      g.stroke();
      if (id === "meteor") {
        g.fillStyle = "#e05030";
        g.beginPath();
        g.moveTo(-10, -8);
        g.lineTo(0, 0);
        g.lineTo(-6, 6);
        g.closePath();
        g.fill();
      }
    } else if (wpn.proj === "rocket" || id.includes("bazooka") || id.includes("rpg") || id.includes("comet") || id.includes("voidcannon")) {
      g.fillStyle = c;
      rr(-10, -11, 46, 22, 5);
      g.fill();
      g.fillStyle = "#2a2a28";
      rr(28, -5, 22, 10, 2);
      g.fill();
      g.fillStyle = "#ff6a3a";
      g.beginPath();
      g.moveTo(-10, -8);
      g.lineTo(-22, 0);
      g.lineTo(-10, 8);
      g.closePath();
      g.fill();
      if (wpn.minsk) {
        g.fillStyle = "#fff";
        g.font = "bold 9px sans-serif";
        g.textAlign = "center";
        g.fillText("BY", 12, 3);
      }
    } else if (wpn.proj === "flame" || id.includes("flamethrower") || id.includes("phoenix")) {
      g.fillStyle = "#4a4a50";
      rr(-16, -8, 28, 16, 4);
      g.fill();
      g.fillStyle = c;
      rr(8, -5, 30, 10, 3);
      g.fill();
      g.fillStyle = "#ffcc40";
      g.beginPath();
      g.moveTo(36, 0);
      g.lineTo(52, -10);
      g.lineTo(48, 0);
      g.lineTo(52, 10);
      g.closePath();
      g.fill();
      g.fillStyle = "#e05030";
      g.beginPath();
      g.arc(-8, 0, 7, 0, Math.PI * 2);
      g.fill();
    } else if (wpn.proj === "laser" || id.includes("rail") || id.includes("pulse") || id.includes("starfall") || id.includes("thunder")) {
      g.fillStyle = "#2a2a35";
      rr(-8, -8, 24, 16, 3);
      g.fill();
      g.fillStyle = c;
      rr(12, -3, 36, 6, 2);
      g.fill();
      g.fillStyle = "#fff";
      g.globalAlpha = 0.7;
      g.beginPath();
      g.arc(10, 0, 5, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.strokeStyle = c;
      g.lineWidth = 2;
      g.shadowColor = c;
      g.shadowBlur = 8;
      g.beginPath();
      g.moveTo(48, 0);
      g.lineTo(58, 0);
      g.stroke();
      g.shadowBlur = 0;
    } else if (id.includes("sniper")) {
      g.fillStyle = c;
      rr(-6, -5, 22, 10, 2);
      g.fill();
      g.fillStyle = "#1a1a1a";
      rr(12, -2, 40, 4, 1);
      g.fill();
      g.fillStyle = "#3a3a40";
      rr(4, -12, 14, 6, 1);
      g.fill();
      g.fillStyle = "#6a8aff";
      g.beginPath();
      g.arc(11, -9, 3, 0, Math.PI * 2);
      g.fill();
    } else if (id.includes("shotgun")) {
      g.fillStyle = c;
      rr(-8, -8, 30, 16, 3);
      g.fill();
      g.fillStyle = "#2a2a28";
      rr(18, -6, 28, 5, 1);
      g.fill();
      rr(18, 1, 28, 5, 1);
      g.fill();
      g.fillStyle = "#5a4030";
      rr(-4, 6, 14, 10, 2);
      g.fill();
    } else if (wpn.auto || id.includes("minigun") || id.includes("machine") || id.includes("uzi") || id.includes("_mg")) {
      g.fillStyle = c;
      rr(-10, -9, 40, 18, 3);
      g.fill();
      g.fillStyle = "#1a1a1a";
      rr(22, -4, 28, 8, 1);
      g.fill();
      g.fillStyle = "#333";
      rr(0, 6, 16, 12, 2);
      g.fill();
      if (id.includes("minigun")) {
        g.fillStyle = "#555";
        for (let i = 0; i < 3; i++) {
          rr(26, -7 + i * 5, 20, 3, 1);
          g.fill();
        }
      }
      if (wpn.minsk) {
        g.fillStyle = "#fce300";
        g.fillRect(-6, -6, 10, 4);
      }
    } else if (id.includes("revolver")) {
      g.fillStyle = c;
      rr(-4, -6, 26, 12, 3);
      g.fill();
      g.fillStyle = "#2a2a28";
      rr(18, -3, 18, 6, 1);
      g.fill();
      g.fillStyle = "#3a3a40";
      g.beginPath();
      g.arc(6, 10, 8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#5a5a60";
      rr(-2, 4, 10, 14, 2);
      g.fill();
    } else {
      // generic gun / melee stick
      g.fillStyle = c;
      rr(-6, -7, 34, 14, 3);
      g.fill();
      g.fillStyle = "#1a1a1a";
      rr(20, -3, 20, 6, 1);
      g.fill();
      g.fillStyle = "#444";
      rr(-2, 4, 10, 12, 2);
      g.fill();
    }
    g.restore();
  }

  const weaponPreviewCache = Object.create(null);
  function weaponPreviewImg(wpn) {
    if (!wpn || wpn.id === "hand") {
      return `<div class="wpn-art hand" title="Рука">✋</div>`;
    }
    let url = weaponPreviewCache[wpn.id];
    if (!url) {
      const c = document.createElement("canvas");
      c.width = 112;
      c.height = 64;
      const g = c.getContext("2d");
      g.clearRect(0, 0, 112, 64);
      g.fillStyle = "rgba(0,0,0,0.12)";
      g.beginPath();
      g.moveTo(14, 4);
      g.arcTo(108, 4, 108, 60, 10);
      g.arcTo(108, 60, 4, 60, 10);
      g.arcTo(4, 60, 4, 4, 10);
      g.arcTo(4, 4, 108, 4, 10);
      g.closePath();
      g.fill();
      g.translate(36, 32);
      paintWeaponArt(g, wpn, 0.95);
      url = c.toDataURL("image/png");
      weaponPreviewCache[wpn.id] = url;
    }
    return `<img class="wpn-art" src="${url}" alt="${wpn.name}" width="112" height="64" />`;
  }

  function drawEquippedWeapon() {
    const wpn = effectiveWeapon();
    if (!wpn || wpn.id === "hand") return;

    if (isRanged(wpn)) {
      const m = muzzlePos(aim.x, aim.y);
      const ang = Math.atan2(aim.y - m.y, aim.x - m.x);
      const faceLeft = Math.cos(ang) < 0;

      // aim laser / dotted line
      ctx.save();
      ctx.strokeStyle = "rgba(224, 80, 48, 0.35)";
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(aim.x, aim.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(224, 80, 48, 0.55)";
      ctx.beginPath();
      ctx.arc(aim.x, aim.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff8f0";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // full weapon picture at bottom — visible before shooting
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(ang);
      if (faceLeft) ctx.scale(1, -1);
      paintWeaponArt(ctx, wpn, 1.35);
      if (muzzleFlash > 0) {
        ctx.fillStyle = "#ffe08a";
        ctx.beginPath();
        ctx.moveTo(48, 0);
        ctx.lineTo(68, -12);
        ctx.lineTo(60, 0);
        ctx.lineTo(68, 12);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else {
      // melee: show weapon near cursor so you see it before the hit
      const ang = Math.atan2(buddy.y - 40 - aim.y, buddy.x - aim.x);
      ctx.save();
      ctx.translate(aim.x, aim.y);
      ctx.rotate(ang);
      if (Math.cos(ang) < 0) ctx.scale(1, -1);
      ctx.globalAlpha = 0.95;
      paintWeaponArt(ctx, wpn, 1.25);
      ctx.restore();
    }

    // corner preview card — always shows how current weapon looks
    ctx.save();
    const bx = W - 128;
    const by = H - 98;
    ctx.fillStyle = "rgba(30, 22, 14, 0.72)";
    roundRectPath(bx, by, 116, 86, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 215, 106, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(bx + 58, by + 40);
    paintWeaponArt(ctx, wpn, 0.9);
    ctx.restore();
    ctx.fillStyle = "#fff8e8";
    ctx.font = "800 11px Nunito, system-ui";
    ctx.textAlign = "center";
    const label = wpn.name.length > 16 ? wpn.name.slice(0, 15) + "…" : wpn.name;
    ctx.fillText(label, bx + 58, by + 76);
    ctx.restore();
  }

  function say() {
    // Полная тишина: ни голоса, ни пузырей
    return;
  }

  function speak() {
    // TTS вырезан
  }

  function jump(power = 680, opts = {}) {
    if (drag || buddy.dead) return;
    if (!buddy.onGround && Math.abs(buddy.vy) > 40) return;
    buddy.vy = -power;
    buddy.onGround = false;
    buddy.squat = 0.15;
    if (opts.quiet) {
      // тихие прыжки без речи
    } else if (!buddy.dead && !save.mute) {
      say(["Уиии!", "Прыгаю!", "Выше!", "Лечу!"][Math.floor(Math.random() * 4)]);
    }
    for (let i = 0; i < (opts.quiet ? 4 : 8); i++) {
      particles.push({
        x: buddy.x + (Math.random() - 0.5) * 30,
        y: FLOOR - 4,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 60,
        life: 0.4,
        s: 2 + Math.random() * 3,
        color: "rgba(120,90,40,0.35)",
      });
    }
  }

  function openShop() {
    overlay.classList.remove("hidden");
    const cards = CLOTHES.map((c) => {
      const owned = save.owned.includes(c.id);
      let equipped = false;
      if (c.kind === "shirt") equipped = save.shirt === c.id;
      if (c.kind === "hat") equipped = save.hat === c.id;
      if (c.kind === "extra") equipped = save.extra === c.id;

      let action;
      if (equipped) {
        if (c.id === "none") action = `<button class="btn" disabled>Уже без одежды</button>`;
        else action = `<button class="btn danger" data-uneq="${c.id}">Снять</button>`;
      } else if (owned) {
        action = `<button class="btn" data-eq="${c.id}">${c.id === "none" ? "Раздеть тело" : "Надеть"}</button>`;
      } else {
        const can = save.infCoins || save.coins >= c.cost;
        action = `<button class="btn" data-buy="${c.id}" ${can ? "" : "disabled"}>${c.cost} ◎</button>`;
      }
      return `
        <div class="shop-card${owned ? " owned" : ""}${equipped ? " equipped" : ""}">
          <h4>${c.name}</h4>
          <p>${c.desc}<br><span style="opacity:.7">${c.kind === "shirt" ? "тело" : c.kind === "hat" ? "голова" : "аксессуар"}</span></p>
          ${action}
        </div>`;
    }).join("");

    const wearingSomething = (save.shirt && save.shirt !== "none") || save.hat || save.extra;

    overlay.innerHTML = `
      <div class="brand">ОДЕЖДА</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b> · можно снять любую вещь</p>
      <div class="shop-grid">${cards}</div>
      <button class="btn danger" id="btn-undress-all" ${wearingSomething ? "" : "disabled"} style="width:min(320px,100%)">Раздеть всё</button>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelector("#btn-undress-all").onclick = () => {
      save.shirt = "none";
      save.hat = null;
      save.extra = null;
      persist();
      syncHud();
      say("Я снова без одежды!");
      openShop();
    };
    overlay.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-buy");
        const item = itemById(id);
        if (save.owned.includes(id)) return;
        if (!save.infCoins) {
          if (save.coins < item.cost) return;
          save.coins -= item.cost;
        }
        save.owned.push(id);
        equipClothes(id);
        persist();
        syncHud();
        say("Спасибо за одёжку!");
        openShop();
      };
    });
    overlay.querySelectorAll("[data-eq]").forEach((btn) => {
      btn.onclick = () => {
        equipClothes(btn.getAttribute("data-eq"));
        persist();
        syncHud();
        say(save.shirt === "none" && !save.hat && !save.extra ? "Без одежды!" : "Мне идёт?");
        openShop();
      };
    });
    overlay.querySelectorAll("[data-uneq]").forEach((btn) => {
      btn.onclick = () => {
        unequipClothes(btn.getAttribute("data-uneq"));
        persist();
        syncHud();
        say("Снял!");
        openShop();
      };
    });
  }

  function openWeaponShop() {
    overlay.classList.remove("hidden");
    const admin = isAdmin();
    const vip = isVip();
    const minsk = isMinskOwner();
    const cards = WEAPONS.filter((w) => {
      if (w.cheat && !w.adminOnly && !save.ownedWeapons.includes(w.id) && !admin) return false;
      return true;
    }).map((w) => {
      const owned = save.ownedWeapons.includes(w.id);
      const equipped = save.weapon === w.id;
      const lockedMinsk = (w.minsk || w.ownerOnly) && !minsk;
      const lockedAdmin = w.adminOnly && !admin && !lockedMinsk;
      const lockedVip = w.vipOnly && !vip;
      const locked = lockedMinsk || lockedAdmin || lockedVip;
      let action;
      if (lockedMinsk) {
        action = `<button class="btn" disabled>🇧🇾 Только хозяин</button>`;
      } else if (lockedAdmin) {
        action = `<button class="btn" disabled>Только админ</button>`;
      } else if (lockedVip) {
        action = `<button class="btn" disabled>Нужен VIP</button>`;
      } else if (equipped) {
        action = `<button class="btn" disabled>Выбрано</button>`;
      } else if (owned || (w.adminOnly && admin) || ((w.minsk || w.ownerOnly) && minsk)) {
        if (((w.adminOnly && admin) || ((w.minsk || w.ownerOnly) && minsk)) && !owned) {
          action = `<button class="btn" data-wclaim="${w.id}">Взять (Минск)</button>`;
        } else {
          action = `<button class="btn" data-weq="${w.id}">Взять</button>`;
        }
      } else {
        const can = save.infCoins || save.coins >= w.cost;
        action = `<button class="btn" data-wbuy="${w.id}" ${can ? "" : "disabled"}>${w.cost} ◎</button>`;
      }
      const power = w.dmg > 0
        ? `<span class="dmg">${w.infHit ? "∞" : w.dmg} урона · ×${w.coinMul} монет${w.ranged ? " · стрельба" : ""}${w.minsk ? " · МИНСК" : ""}${w.exclusive ? " · EX" : ""}${w.adminOnly ? " · АДМИН" : ""}${w.vipOnly ? " · VIP" : ""}</span>`
        : `<span class="dmg">без урона</span>`;
      return `
        <div class="shop-card${owned ? " owned" : ""}${equipped ? " equipped" : ""}${w.exclusive ? " exclusive" : ""}${w.minsk ? " minsk" : ""}${w.adminOnly ? " admin-only" : ""}${w.vipOnly ? " vip-item" : ""}${locked ? " locked" : ""}">
          ${weaponPreviewImg(w)}
          <h4>${w.ownerOnly || w.minsk ? "🇧🇾 " : ""}${w.adminOnly && !w.minsk ? "🔒 " : ""}${w.vipOnly ? "💎 " : ""}${!w.minsk && !w.adminOnly && !w.vipOnly && w.exclusive ? "★ " : ""}${w.name}</h4>
          <p>${power}<br>${w.desc}</p>
          ${action}
        </div>`;
    }).join("");

    overlay.innerHTML = `
      <div class="brand">ОРУЖИЕ</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b> · 🇧🇾 Минск только хозяину · 🔒 админ · 💎 VIP</p>
      <div class="shop-grid">${cards}</div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelectorAll("[data-wbuy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-wbuy");
        const w = weaponById(id);
        if (!canUseWeapon(w)) return;
        if (w.minsk || w.ownerOnly) return;
        if (save.ownedWeapons.includes(id)) return;
        if (!save.infCoins) {
          if (save.coins < w.cost) return;
          save.coins -= w.cost;
        }
        save.ownedWeapons.push(id);
        save.weapon = id;
        persist();
        syncHud();
        setDeadUI(buddy.dead);
        canvas.style.cursor = isRanged(w) ? "crosshair" : "grab";
        say(isRanged(w) ? "Кликай куда угодно — стреляю!" : "Новая пушка!");
        openWeaponShop();
      };
    });
    overlay.querySelectorAll("[data-wclaim]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-wclaim");
        const w = weaponById(id);
        if (!canUseWeapon(w)) return;
        if (!save.ownedWeapons.includes(id)) save.ownedWeapons.push(id);
        save.weapon = id;
        persist();
        syncHud();
        setDeadUI(buddy.dead);
        canvas.style.cursor = isRanged(w) ? "crosshair" : "grab";
        say(w.minsk ? "🇧🇾 Минск твоя!" : "Админ-пушка!");
        openWeaponShop();
      };
    });
    overlay.querySelectorAll("[data-weq]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-weq");
        const w = weaponById(id);
        if (!canUseWeapon(w)) return;
        if (!save.ownedWeapons.includes(id)) return;
        save.weapon = id;
        persist();
        syncHud();
        setDeadUI(buddy.dead);
        canvas.style.cursor = isRanged(w) ? "crosshair" : "grab";
        openWeaponShop();
      };
    });
  }

  function openLimitShop(page = 1) {
    overlay.classList.remove("hidden");
    const skin = buddyById("SkinLimitAdmin");
    const ownedSkin = save.ownedBuddies.includes("SkinLimitAdmin");
    const equipped = save.buddyType === "SkinLimitAdmin";
    const canSkin = save.infCoins || save.coins >= skin.cost;
    const canCmds = save.infCoins || save.coins >= 200000;

    let body = "";
    if (page === 1) {
      let action;
      if (equipped) action = `<button class="btn" disabled>Надет · корона</button>`;
      else if (ownedSkin) action = `<button class="btn" id="lim-eq-skin">Надеть с короной</button>`;
      else action = `<button class="btn danger" id="lim-buy-skin" ${canSkin ? "" : "disabled"}>Купить Админ 👑 · 100 000</button>`;
      body = `
        <div class="shop-card exclusive limited-skin${ownedSkin ? " owned" : ""}${equipped ? " equipped" : ""}">
          <h4>👑 АДМИН (лимит)</h4>
          <p><span class="dmg" style="color:${skin.cloth}">██</span> Другой админ-скин <b>с короной</b> — для покупки здесь.</p>
          <p class="tagline">Твой <b>SkinAdminBuffer</b> (фиолетовый) купить нельзя · только у тебя</p>
          <p class="tagline">Страница 1 · 100 000 ◎</p>
          ${action}
        </div>`;
    } else {
      if (save.limitedAdmin) {
        body = `
          <div class="shop-card equipped">
            <h4>✓ Команды лимит-админа куплено</h4>
            <p>Это <b>половина</b> админки — не полный доступ. Твой полный админ сильнее.</p>
          </div>
          <div class="shop-card ${save.halfDmg ? "equipped" : ""}">
            <h4>×2 Урон</h4>
            <p>Не ∞ · только удвоение</p>
            <button class="btn" id="lim-halfdmg">${save.halfDmg ? "Выкл" : "Вкл"}</button>
          </div>
          <div class="shop-card">
            <h4>+25 000 монет</h4>
            <button class="btn" id="lim-coins">Выдать</button>
          </div>
          <div class="shop-card">
            <h4>Оживить Бади</h4>
            <button class="btn" id="lim-revive">Оживить</button>
          </div>
          <div class="shop-card">
            <h4>Хил до 100 HP</h4>
            <button class="btn" id="lim-heal">Вылечить</button>
          </div>`;
      } else {
        body = `
          <div class="shop-card exclusive">
            <h4>⚡ Команды лимит-админа</h4>
            <p>×2 урон, +25 000 монет, хил, оживить. <b>Без</b> ∞, без SkinAdminBuffer, без полного лута.</p>
            <p class="tagline">Страница 2 из 2 · цена 200 000</p>
            <button class="btn danger" id="lim-buy-cmds" ${canCmds ? "" : "disabled"}>Купить · 200 000 ◎</button>
          </div>`;
      }
    }

    overlay.innerHTML = `
      <div class="brand">ЛИМИТ ★</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b></p>
      <div style="display:flex;gap:8px;justify-content:center;margin:8px 0 12px;flex-wrap:wrap">
        <button class="btn ${page === 1 ? "danger" : "ghost"}" id="lim-p1">1 · 👑 Админ-скин</button>
        <button class="btn ${page === 2 ? "danger" : "ghost"}" id="lim-p2">2 · Команды 200 000</button>
      </div>
      <div class="shop-grid">${body}</div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;

    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelector("#lim-p1").onclick = () => openLimitShop(1);
    overlay.querySelector("#lim-p2").onclick = () => openLimitShop(2);

    const buySkin = overlay.querySelector("#lim-buy-skin");
    if (buySkin) {
      buySkin.onclick = () => {
        if (save.ownedBuddies.includes("SkinLimitAdmin")) return;
        if (!save.infCoins) {
          if (save.coins < 100000) return;
          save.coins -= 100000;
        }
        save.ownedBuddies.push("SkinLimitAdmin");
        save.buddyType = "SkinLimitAdmin";
        persist();
        syncHud();
        openLimitShop(1);
      };
    }
    const eqSkin = overlay.querySelector("#lim-eq-skin");
    if (eqSkin) {
      eqSkin.onclick = () => {
        save.buddyType = "SkinLimitAdmin";
        persist();
        openLimitShop(1);
      };
    }
    const buyCmds = overlay.querySelector("#lim-buy-cmds");
    if (buyCmds) {
      buyCmds.onclick = () => {
        if (save.limitedAdmin) return;
        if (!save.infCoins) {
          if (save.coins < 200000) return;
          save.coins -= 200000;
        }
        save.limitedAdmin = true;
        persist();
        syncHud();
        openLimitShop(2);
      };
    }
    const halfBtn = overlay.querySelector("#lim-halfdmg");
    if (halfBtn) {
      halfBtn.onclick = () => {
        if (!save.limitedAdmin) return;
        save.halfDmg = !save.halfDmg;
        persist();
        syncHud();
        openLimitShop(2);
      };
    }
    const coinsBtn = overlay.querySelector("#lim-coins");
    if (coinsBtn) {
      coinsBtn.onclick = () => {
        if (!save.limitedAdmin) return;
        save.coins += 25000;
        persist();
        syncHud();
        openLimitShop(2);
      };
    }
    const revBtn = overlay.querySelector("#lim-revive");
    if (revBtn) {
      revBtn.onclick = () => {
        if (!save.limitedAdmin) return;
        overlay.classList.add("hidden");
        rebuildBuddy();
      };
    }
    const healBtn = overlay.querySelector("#lim-heal");
    if (healBtn) {
      healBtn.onclick = () => {
        if (!save.limitedAdmin) return;
        buddy.hp = Math.max(buddy.hp, 100);
        buddy.dead = false;
        persist();
        syncHud();
        setDeadUI(false);
        openLimitShop(2);
      };
    }
  }

  function openBuddyShop(tab = "normal") {
    overlay.classList.remove("hidden");
    const admin = isAdmin();
    const bought = hasBoughtAdmin();
    const all = BUDDIES.filter((b) => canUseBuddy(b) || (b.buyAdmin && !bought) || (b.adminOnly && !admin));
    const groups = {
      normal: all.filter((b) => !b.adminOnly && !b.buyAdmin && !b.vipOnly && !b.vipPlusOnly && !b.storeSkin && !b.limited && !b.rareStore),
      shop: all.filter((b) => b.storeSkin || b.limited),
      rare: all.filter((b) => b.rareStore),
      vip: all.filter((b) => b.vipOnly),
      vipplus: all.filter((b) => b.vipPlusOnly),
      buyadmin: all.filter((b) => b.buyAdmin),
      admin: all.filter((b) => b.adminOnly && !b.buyAdmin),
    };
    if (!groups[tab] || (tab === "admin" && !admin)) tab = "normal";
    const list = groups[tab] || groups.normal;
    const cards = list.map((b) => {
      const owned = save.ownedBuddies.includes(b.id);
      const equipped = save.buddyType === b.id;
      const locked = !canUseBuddy(b);
      let action;
      if (locked) {
        if (b.buyAdmin) action = `<button class="btn" disabled>Нужен Админ 1 000 000</button>`;
        else if (b.adminOnly) action = `<button class="btn" disabled>Только админ</button>`;
        else if (b.vipPlusOnly) action = `<button class="btn" disabled>Нужен VIP+</button>`;
        else if (b.vipOnly) action = `<button class="btn" disabled>Нужен VIP</button>`;
        else action = `<button class="btn" disabled>Закрыто</button>`;
      } else if (equipped) {
        action = `<button class="btn" disabled>Выбран</button>`;
      } else if (owned || (b.adminOnly && admin)) {
        if (b.adminOnly && !b.buyAdmin && admin && !owned) {
          action = `<button class="btn" data-bclaim="${b.id}">Взять (админ)</button>`;
        } else {
          action = `<button class="btn" data-beq="${b.id}">Выбрать</button>`;
        }
      } else {
        const canBuy = save.coins >= b.cost || save.infCoins;
        action = `<button class="btn" data-bbuy="${b.id}" ${canBuy ? "" : "disabled"}>${b.cost} ◎</button>`;
      }
      const badge = b.rainbow
        ? `<span class="ex-badge rainbow-badge">🌈</span>`
        : b.rareStore
          ? `<span class="ex-badge">АДМИН★</span>`
          : b.buyAdmin
            ? `<span class="ex-badge">АДМИН$</span>`
            : b.adminOnly
              ? `<span class="ex-badge">АДМИН</span>`
              : b.vipPlus
                ? `<span class="ex-badge vip-plus-badge">VIP+</span>`
                : b.vip
                  ? `<span class="ex-badge vip-badge">VIP</span>`
                  : b.limited
                    ? `<span class="ex-badge">ЛИМИТ</span>`
                    : b.storeSkin
                      ? `<span class="ex-badge">SHOP</span>`
                      : b.exclusive
                        ? `<span class="ex-badge">EX</span>`
                        : "";
      return `
        <div class="shop-card${owned ? " owned" : ""}${equipped ? " equipped" : ""}${b.exclusive ? " exclusive premium-skin" : ""}${b.limited ? " limited-skin" : ""}${b.vip ? " vip-skin" : ""}${b.vipPlus ? " vip-plus-card" : ""}${b.adminOnly || b.buyAdmin || b.rareStore ? " admin-only" : ""}${b.rareStore ? " rare-card" : ""}${b.rainbow ? " rainbow-skin" : ""}${locked ? " locked" : ""}">
          <h4>${b.rainbow ? "🌈 " : b.rareStore ? "👑 " : b.adminOnly && !b.buyAdmin ? "🔒 " : b.buyAdmin ? "👑 " : b.vipPlus ? "" : b.vip ? "💎 " : b.limited ? "★ " : b.exclusive ? "★ " : ""}${b.name} ${badge}</h4>
          <p><span class="dmg" style="color:${b.cloth}">██</span> ${b.desc}</p>
          ${action}
        </div>`;
    }).join("") || `<div class="shop-card"><h4>Пусто</h4><p>В этой вкладке пока нет скинов.</p></div>`;

    const tabBtn = (id, label) => `<button class="btn ${tab === id ? "danger" : "ghost"}" data-btab="${id}">${label}</button>`;

    overlay.innerHTML = `
      <div class="brand">ТИПЫ БАДИ</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b> · вкладки · Super Rainbow в Админ$</p>
      <div class="shop-tabs">
        ${tabBtn("normal", "Обычные")}
        ${tabBtn("shop", "Магазин")}
        ${tabBtn("rare", "Админ★")}
        ${tabBtn("vip", "VIP")}
        ${tabBtn("vipplus", "VIP+")}
        ${tabBtn("buyadmin", "Админ$")}
        ${admin ? tabBtn("admin", "Админ🔒") : ""}
      </div>
      <div class="shop-grid">${cards}</div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelectorAll("[data-btab]").forEach((btn) => {
      btn.onclick = () => openBuddyShop(btn.getAttribute("data-btab"));
    });
    overlay.querySelectorAll("[data-bbuy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-bbuy");
        const b = buddyById(id);
        if (!canUseBuddy(b)) return;
        if (save.ownedBuddies.includes(id)) return;
        if (!save.infCoins) {
          if (save.coins < b.cost) return;
          save.coins -= b.cost;
        }
        save.ownedBuddies.push(id);
        save.buddyType = id;
        persist();
        syncHud();
        say("Новый я!");
        openBuddyShop(tab);
      };
    });
    overlay.querySelectorAll("[data-bclaim]").forEach((btn) => {
      btn.onclick = () => {
        if (!isAdmin()) return;
        const id = btn.getAttribute("data-bclaim");
        if (!save.ownedBuddies.includes(id)) save.ownedBuddies.push(id);
        save.buddyType = id;
        persist();
        syncHud();
        say("Админ-скин активирован!");
        openBuddyShop(tab);
      };
    });
    overlay.querySelectorAll("[data-beq]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-beq");
        const b = buddyById(id);
        if (!canUseBuddy(b)) return;
        save.buddyType = id;
        persist();
        say(b.rainbow ? "Super Rainbow!" : id === "SkinAdminBuffer" ? "Админ-скин на месте!" : b.vipPlus ? "VIP+!" : b.vip ? "VIP-стиль!" : "Это я!");
        openBuddyShop(tab);
      };
    });
  }

  function openMarketShop(page = 1, skinTab = "shop") {
    overlay.classList.remove("hidden");
    const vip = isVip();
    const vipP = isVipPlus();
    const boost = coinBoostMul();
    const can = (cost) => save.infCoins || save.coins >= cost;
    let body = "";

    if (page === 1) {
      const limSkinOwned = save.ownedBuddies.includes("SkinLimitAdmin");
      const limSkinEq = save.buddyType === "SkinLimitAdmin";
      let limSkinBtn;
      if (limSkinEq) limSkinBtn = `<button class="btn" disabled>Надет</button>`;
      else if (limSkinOwned) limSkinBtn = `<button class="btn" id="mkt-lim-eq">Надеть</button>`;
      else limSkinBtn = `<button class="btn danger" id="mkt-lim-skin" ${can(100000) ? "" : "disabled"}>Купить · 100 000</button>`;

      let limCmdBtn;
      if (save.limitedAdmin) limCmdBtn = `<button class="btn" disabled>Куплено ✓</button>`;
      else limCmdBtn = `<button class="btn danger" id="mkt-lim-cmds" ${can(200000) ? "" : "disabled"}>Купить · 200 000</button>`;

      let vipBtn;
      if (vip) vipBtn = `<button class="btn" disabled>VIP ✓</button>`;
      else vipBtn = `<button class="btn danger" id="mkt-vip" ${can(VIP_PASS_COST) ? "" : "disabled"}>Купить · ${VIP_PASS_COST.toLocaleString("ru-RU")}</button>`;

      let vipPlusBtn;
      if (vipP) vipPlusBtn = `<button class="btn" disabled>VIP+ ✓</button>`;
      else vipPlusBtn = `<button class="btn danger" id="mkt-vipplus" ${can(VIP_PLUS_COST) ? "" : "disabled"}>Купить · ${VIP_PLUS_COST.toLocaleString("ru-RU")}</button>`;

      let adminBuyBtn;
      if (hasBoughtAdmin()) adminBuyBtn = `<button class="btn" disabled>Админ ✓ · Super Rainbow</button>`;
      else adminBuyBtn = `<button class="btn danger" id="mkt-buy-admin" ${can(BUY_ADMIN_COST) ? "" : "disabled"}>Купить · 1 000 000</button>`;

      body = `
        <div class="shop-card exclusive limited-skin">
          <h4>★ Лимит-скин</h4>
          <p>Покупной админ-скин с короной (не полный админ).</p>
          ${limSkinBtn}
        </div>
        <div class="shop-card exclusive">
          <h4>★ Лимит-команды</h4>
          <p>×2 урон, +25 000, хил, оживить.</p>
          ${limCmdBtn}
          <button class="btn ghost" id="mkt-lim-open" style="margin-top:6px">Открыть лимит-панель</button>
        </div>
        <div class="shop-card vip-skin">
          <h4>💎 VIP</h4>
          <p>VIP-скины здесь · VIP-оружие — только в магазине оружия.</p>
          ${vipBtn}
        </div>
        <div class="shop-card vip-plus-card">
          <h4><span class="vip-plus-label">VIP+</span></h4>
          <p>Дороже VIP · больше скинов. Фиолетовый статус. Включает обычный VIP.</p>
          ${vipPlusBtn}
        </div>
        <div class="shop-card admin-only rainbow-skin">
          <h4>👑 Купить Админ · 🌈 Super Rainbow</h4>
          <p>За <b>1 000 000</b>: статус Админ$, Super Rainbow, Шторм, Нова, VIP+, ×3 монеты, ×2 урон.</p>
          <p class="tagline">SkinAdminBuffer и ∞-оружие по-прежнему только у настоящего админа.</p>
          ${adminBuyBtn}
        </div>`;
    } else if (page === 2) {
      body = COIN_BOOST_OFFERS.map((o) => {
        const have = boost >= o.mul;
        const action = have
          ? `<button class="btn" disabled>Активно ×${boost}</button>`
          : `<button class="btn danger" data-mkt-boost="${o.mul}" ${can(o.cost) ? "" : "disabled"}>${o.cost.toLocaleString("ru-RU")} ◎</button>`;
        return `
          <div class="shop-card${have ? " equipped" : ""}">
            <h4>${o.name}</h4>
            <p>Все монеты с ударов и стен умножаются на <b>${o.mul}</b>. Постоянно.</p>
            ${action}
          </div>`;
      }).join("");
      body = `
        <div class="shop-card equipped">
          <h4>Сейчас: ×${boost}</h4>
          <p>Множитель действует на заработанные монеты (не на цены покупок).</p>
        </div>` + body;
    } else if (page === 3) {
      if (!["shop", "vip", "vipplus", "buyadmin", "rare"].includes(skinTab)) skinTab = "shop";
      const skins = BUDDIES.filter((b) => {
        if (skinTab === "shop") return !!b.storeSkin;
        if (skinTab === "vip") return !!b.vipOnly;
        if (skinTab === "vipplus") return !!b.vipPlusOnly;
        if (skinTab === "buyadmin") return !!b.buyAdmin;
        return !!b.rareStore;
      });
      body = skins.map((b) => {
        const owned = save.ownedBuddies.includes(b.id);
        const equipped = save.buddyType === b.id;
        const needVip = b.vipOnly && !vip;
        const needPlus = b.vipPlusOnly && !vipP;
        const needBuyAdm = b.buyAdmin && !hasBoughtAdmin();
        const locked = needVip || needPlus || needBuyAdm;
        let action;
        if (locked) {
          action = `<button class="btn" disabled>${needBuyAdm ? "Купи Админ 1 000 000" : needPlus ? "Нужен VIP+" : "Нужен VIP"}</button>`;
        } else if (equipped) {
          action = `<button class="btn" disabled>Надет</button>`;
        } else if (owned) {
          action = `<button class="btn" data-mkt-beq="${b.id}">Надеть</button>`;
        } else {
          action = `<button class="btn" data-mkt-bbuy="${b.id}" ${can(b.cost) ? "" : "disabled"}>${b.cost.toLocaleString("ru-RU")} ◎</button>`;
        }
        const klass = b.rareStore ? "admin-only rare-card premium-skin" : b.rainbow ? "rainbow-skin admin-only" : b.buyAdmin ? "admin-only" : b.vipPlusOnly ? "vip-plus-card" : b.vipOnly ? "vip-skin" : "exclusive";
        const title = b.rareStore ? `👑 ${b.name}` : b.rainbow ? `🌈 ${b.name}` : b.buyAdmin ? `👑 ${b.name}` : b.vipPlusOnly ? `<span class="vip-plus-label">VIP+</span> ${b.name}` : b.vipOnly ? `💎 ${b.name}` : b.name;
        return `
          <div class="shop-card ${klass}${owned ? " owned" : ""}${equipped ? " equipped" : ""}${locked ? " locked" : ""}">
            <h4>${title}</h4>
            <p><span class="dmg" style="color:${b.cloth}">██</span> ${b.desc}</p>
            ${action}
          </div>`;
      }).join("") || `<div class="shop-card"><h4>Пусто</h4><p>В этой вкладке нет скинов.</p></div>`;
    } else {
      // page 4 — редкое оружие
      body = WEAPONS.filter((w) => w.rareStore).map((w) => {
        const owned = save.ownedWeapons.includes(w.id);
        const equipped = save.weapon === w.id;
        let action;
        if (equipped) action = `<button class="btn" disabled>Выбрано</button>`;
        else if (owned) action = `<button class="btn" data-mkt-weq="${w.id}">Взять</button>`;
        else action = `<button class="btn" data-mkt-wbuy="${w.id}" ${can(w.cost) ? "" : "disabled"}>${w.cost.toLocaleString("ru-RU")} ◎</button>`;
        return `
          <div class="shop-card exclusive rare-card admin-only${owned ? " owned" : ""}${equipped ? " equipped" : ""}">
            ${weaponPreviewImg(w)}
            <h4>👑 ${w.name}</h4>
            <p><span class="dmg">${w.dmg >= 10000 ? Math.round(w.dmg / 1000) + "k" : w.dmg} урона · ×${w.coinMul}${w.ranged ? " · стрельба" : ""}</span><br>${w.desc}</p>
            ${action}
          </div>`;
      }).join("");
    }

    const skinTabsHtml = page === 3 ? `
      <div class="shop-tabs">
        <button class="btn ${skinTab === "shop" ? "danger" : "ghost"}" id="mkt-stab-shop">SHOP</button>
        <button class="btn ${skinTab === "vip" ? "danger" : "ghost"}" id="mkt-stab-vip">VIP</button>
        <button class="btn ${skinTab === "vipplus" ? "danger" : "ghost"}" id="mkt-stab-vipplus">VIP+</button>
        <button class="btn ${skinTab === "buyadmin" ? "danger" : "ghost"}" id="mkt-stab-admin">Админ$</button>
        <button class="btn ${skinTab === "rare" ? "danger" : "ghost"}" id="mkt-stab-rare">👑 Админ-скины</button>
      </div>` : "";

    overlay.innerHTML = `
      <div class="brand">МАГАЗИН</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b>${boost > 1 ? " · буст ×" + boost : ""}${vipP ? ' · <span class="vip-plus-label">VIP+</span>' : vip ? " · VIP" : ""}</p>
      <div class="shop-pager">
        <button class="btn ${page === 1 ? "danger" : "ghost"}" id="mkt-p1">1 · Пропуска</button>
        <button class="btn ${page === 2 ? "danger" : "ghost"}" id="mkt-p2">2 · ×Монеты</button>
        <button class="btn ${page === 3 ? "danger" : "ghost"}" id="mkt-p3">3 · Скины</button>
        <button class="btn ${page === 4 ? "danger" : "ghost"}" id="mkt-p4">4 · 👑 Пушки</button>
      </div>
      ${skinTabsHtml}
      <div class="shop-grid">${body}</div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;

    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelector("#mkt-p1").onclick = () => openMarketShop(1, skinTab);
    overlay.querySelector("#mkt-p2").onclick = () => openMarketShop(2, skinTab);
    overlay.querySelector("#mkt-p3").onclick = () => openMarketShop(3, "rare");
    const p4 = overlay.querySelector("#mkt-p4");
    if (p4) p4.onclick = () => openMarketShop(4);
    const stabShop = overlay.querySelector("#mkt-stab-shop");
    if (stabShop) stabShop.onclick = () => openMarketShop(3, "shop");
    const stabVip = overlay.querySelector("#mkt-stab-vip");
    if (stabVip) stabVip.onclick = () => openMarketShop(3, "vip");
    const stabPlus = overlay.querySelector("#mkt-stab-vipplus");
    if (stabPlus) stabPlus.onclick = () => openMarketShop(3, "vipplus");
    const stabAdm = overlay.querySelector("#mkt-stab-admin");
    if (stabAdm) stabAdm.onclick = () => openMarketShop(3, "buyadmin");
    const stabRare = overlay.querySelector("#mkt-stab-rare");
    if (stabRare) stabRare.onclick = () => openMarketShop(3, "rare");

    const spend = (cost) => {
      if (save.infCoins) return true;
      if (save.coins < cost) return false;
      save.coins -= cost;
      return true;
    };

    const limSkin = overlay.querySelector("#mkt-lim-skin");
    if (limSkin) {
      limSkin.onclick = () => {
        if (save.ownedBuddies.includes("SkinLimitAdmin")) return;
        if (!spend(100000)) return;
        save.ownedBuddies.push("SkinLimitAdmin");
        save.buddyType = "SkinLimitAdmin";
        persist();
        syncHud();
        openMarketShop(1, skinTab);
      };
    }
    const limEq = overlay.querySelector("#mkt-lim-eq");
    if (limEq) {
      limEq.onclick = () => {
        save.buddyType = "SkinLimitAdmin";
        persist();
        openMarketShop(1, skinTab);
      };
    }
    const limCmds = overlay.querySelector("#mkt-lim-cmds");
    if (limCmds) {
      limCmds.onclick = () => {
        if (save.limitedAdmin) return;
        if (!spend(200000)) return;
        save.limitedAdmin = true;
        persist();
        syncHud();
        openMarketShop(1, skinTab);
      };
    }
    const limOpen = overlay.querySelector("#mkt-lim-open");
    if (limOpen) limOpen.onclick = () => openLimitShop(save.limitedAdmin ? 2 : 1);

    const vipBuy = overlay.querySelector("#mkt-vip");
    if (vipBuy) {
      vipBuy.onclick = () => {
        if (save.vip) return;
        if (!spend(VIP_PASS_COST)) return;
        save.vip = true;
        persist();
        syncHud();
        say("VIP!");
        openMarketShop(3, "vip");
      };
    }
    const vipPlusBuy = overlay.querySelector("#mkt-vipplus");
    if (vipPlusBuy) {
      vipPlusBuy.onclick = () => {
        if (save.vipPlus) return;
        if (!spend(VIP_PLUS_COST)) return;
        save.vipPlus = true;
        save.vip = true;
        persist();
        syncHud();
        say("VIP+!");
        openMarketShop(3, "vipplus");
      };
    }
    const buyAdminBtn = overlay.querySelector("#mkt-buy-admin");
    if (buyAdminBtn) {
      buyAdminBtn.onclick = () => {
        if (save.boughtAdmin) return;
        if (!spend(BUY_ADMIN_COST)) return;
        grantBoughtAdminPack();
        persist();
        syncHud();
        say("Super Rainbow!");
        openMarketShop(3, "buyadmin");
      };
    }

    overlay.querySelectorAll("[data-mkt-boost]").forEach((btn) => {
      btn.onclick = () => {
        const mul = Number(btn.getAttribute("data-mkt-boost"));
        const offer = COIN_BOOST_OFFERS.find((o) => o.mul === mul);
        if (!offer || coinBoostMul() >= mul) return;
        if (!spend(offer.cost)) return;
        save.coinBoost = mul;
        persist();
        syncHud();
        say("×" + mul + " монеты!");
        openMarketShop(2, skinTab);
      };
    });
    overlay.querySelectorAll("[data-mkt-bbuy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-mkt-bbuy");
        const b = buddyById(id);
        if (!b || save.ownedBuddies.includes(id)) return;
        if (!canUseBuddy(b)) return;
        if (!spend(b.cost)) return;
        save.ownedBuddies.push(id);
        save.buddyType = id;
        persist();
        syncHud();
        say(b.rainbow ? "Super Rainbow!" : "Новый скин!");
        openMarketShop(3, skinTab);
      };
    });
    overlay.querySelectorAll("[data-mkt-beq]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-mkt-beq");
        const b = buddyById(id);
        if (!canUseBuddy(b)) return;
        save.buddyType = id;
        persist();
        openMarketShop(3, skinTab);
      };
    });
    overlay.querySelectorAll("[data-mkt-wbuy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-mkt-wbuy");
        const w = weaponById(id);
        if (!w.rareStore || save.ownedWeapons.includes(id)) return;
        if (!spend(w.cost)) return;
        save.ownedWeapons.push(id);
        save.weapon = id;
        persist();
        syncHud();
        setDeadUI(buddy.dead);
        canvas.style.cursor = isRanged(w) ? "crosshair" : "grab";
        say("Редкая пушка!");
        openMarketShop(4);
      };
    });
    overlay.querySelectorAll("[data-mkt-weq]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-mkt-weq");
        const w = weaponById(id);
        if (!w.rareStore) return;
        save.weapon = id;
        persist();
        syncHud();
        setDeadUI(buddy.dead);
        canvas.style.cursor = isRanged(w) ? "crosshair" : "grab";
        openMarketShop(4);
      };
    });
  }

  function openVipShop() {
    openMarketShop(1);
  }

  function openCodePanel() {
    overlay.classList.remove("hidden");
    if (isAdmin()) {
      overlay.innerHTML = `
        <div class="brand">КОД</div>
        <p class="tagline">Ты уже полный админ.</p>
        <button class="btn danger" id="adm-open-panel">Админ-панель</button>
        <button class="btn" id="close-shop">Закрыть</button>
      `;
      overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
      overlay.querySelector("#adm-open-panel").onclick = () => openAdminPanel();
      return;
    }
    overlay.innerHTML = `
      <div class="brand">КОД</div>
      <p class="tagline">Обычный Бади. Введи <b>личный</b> код владельца (не код команды).</p>
      <input id="practice-code" type="text" inputmode="text" autocomplete="off" placeholder="напиши слитно: 1234" style="width:min(340px,92%);padding:12px 14px;border-radius:12px;border:0;font:800 1.05rem Nunito;margin:10px 0" />
      <button class="btn danger" id="practice-code-go">Проверить</button>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    const input = overlay.querySelector("#practice-code");
    const go = () => {
      if (redeemOwnerCode(input && input.value)) {
        openAdminPanel();
      } else {
        alert("Неверный код. Пиши слитно без пробелов и запятых: 1234");
      }
    };
    overlay.querySelector("#practice-code-go").onclick = go;
    if (input) {
      input.focus();
      input.onkeydown = (ev) => { if (ev.key === "Enter") go(); };
    }
  }

  function openAdminPanel() {
    if (!isAdmin()) {
      // Код скрыт от Миши — вход только ?owner=1234 или долгий тап по Админ
      if (save.limitedAdmin || save.boughtAdmin) {
        openLimitShop(2);
        return;
      }
      openMarketShop(1);
      return;
    }

    grantAdminLoot();
    persist();
    syncHud();

    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="brand">АДМИН</div>
      <p class="tagline">Тебе выдано ВСЁ: оружие, ∞ Минск, SkinAdminBuffer, Молот</p>
      <div class="shop-grid">
        <div class="shop-card equipped">
          <h4>Выдать всё снова</h4>
          <p>Все пушки + админ-скин + ∞ монеты</p>
          <button class="btn danger" id="adm-grant-all">Выдать мне всё</button>
        </div>
        <div class="shop-card ${save.infDmg ? "equipped" : ""}">
          <h4>∞ Урон</h4>
          <p>Любое оружие бьёт на 99999</p>
          <button class="btn" id="adm-infdmg">${save.infDmg ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card ${save.infCoins ? "equipped" : ""}">
          <h4>∞ Монеты</h4>
          <p>Монеты не тратятся · в HUD ∞</p>
          <button class="btn" id="adm-infcoins">${save.infCoins ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card">
          <h4>+99999 монет</h4>
          <button class="btn" id="adm-addcoins">Выдать</button>
        </div>
        <div class="shop-card">
          <h4>Молот + SkinAdminBuffer</h4>
          <button class="btn" id="adm-equip">Экипировать сейчас</button>
        </div>
        <div class="shop-card ${save.godMode ? "equipped" : ""}">
          <h4>Режим бога</h4>
          <button class="btn" id="adm-god">${save.godMode ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card ${save.giant ? "equipped" : ""}">
          <h4>Гигант-Бади</h4>
          <button class="btn" id="adm-giant">${save.giant ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card">
          <h4>Убить / Оживить</h4>
          <button class="btn" id="adm-kill">Убить</button>
          <button class="btn" id="adm-revive" style="margin-top:6px">Оживить</button>
        </div>
      </div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelector("#adm-grant-all").onclick = () => {
      grantAdminLoot();
      persist();
      syncHud();
      say("Всё выдано!", { force: true });
      openAdminPanel();
    };
    overlay.querySelector("#adm-equip").onclick = () => {
      save.weapon = "admin";
      save.buddyType = "SkinAdminBuffer";
      if (!save.ownedWeapons.includes("admin")) save.ownedWeapons.push("admin");
      if (!save.ownedBuddies.includes("SkinAdminBuffer")) save.ownedBuddies.push("SkinAdminBuffer");
      persist();
      syncHud();
      say("Молот и SkinAdminBuffer на месте!", { force: true });
      openAdminPanel();
    };
    overlay.querySelector("#adm-infdmg").onclick = () => {
      save.infDmg = !save.infDmg;
      if (save.infDmg && !save.ownedWeapons.includes("infdmg")) save.ownedWeapons.push("infdmg");
      if (save.infDmg && !save.ownedWeapons.includes("admin")) save.ownedWeapons.push("admin");
      if (save.infDmg) save.weapon = "minsk_inf_mg";
      persist();
      syncHud();
      openAdminPanel();
    };
    overlay.querySelector("#adm-infcoins").onclick = () => {
      save.infCoins = !save.infCoins;
      if (save.infCoins) save.coins = Math.max(save.coins, 999999);
      persist();
      syncHud();
      openAdminPanel();
    };
    overlay.querySelector("#adm-addcoins").onclick = () => {
      save.coins += 99999;
      persist();
      syncHud();
      openAdminPanel();
    };
    overlay.querySelector("#adm-god").onclick = () => {
      save.godMode = !save.godMode;
      persist();
      openAdminPanel();
    };
    overlay.querySelector("#adm-giant").onclick = () => {
      save.giant = !save.giant;
      persist();
      openAdminPanel();
    };
    overlay.querySelector("#adm-kill").onclick = () => {
      overlay.classList.add("hidden");
      save.godMode = false;
      killBuddy(effectiveWeapon());
    };
    overlay.querySelector("#adm-revive").onclick = () => {
      overlay.classList.add("hidden");
      rebuildBuddy();
    };
  }

  function syncAdminUi() {
    const btn = toolbar.querySelector("#btn-admin");
    if (btn) {
      btn.hidden = false;
      btn.title = isAdmin() ? "Админ-панель · лут выдан" : "Войти как админ";
    }
    if (isAdmin()) {
      grantAdminLoot();
      persist();
      if (typeof syncHud === "function" && el && el.hp) syncHud();
      if (typeof setDeadUI === "function") setDeadUI(buddy.dead);
      if (canvas) canvas.style.cursor = isRanged(effectiveWeapon()) ? "crosshair" : "grab";
      if (hint) hint.textContent = "Админ: всё оружие + SkinAdminBuffer + ∞ Минск уже твои";
    } else {
      stripAdminLootIfNeeded();
      persist();
      if (typeof syncHud === "function" && el && el.hp) syncHud();
    }
  }
  function equipClothes(id) {
    const item = itemById(id);
    if (item.kind === "shirt") save.shirt = id;
    if (item.kind === "hat") save.hat = id;
    if (item.kind === "extra") save.extra = id;
  }

  function unequipClothes(id) {
    const item = itemById(id);
    if (item.kind === "shirt") save.shirt = "none";
    if (item.kind === "hat" && save.hat === id) save.hat = null;
    if (item.kind === "extra" && save.extra === id) save.extra = null;
  }

  toolbar.querySelector("#btn-shop").onclick = () => openShop();
  toolbar.querySelector("#btn-buddies").onclick = () => openBuddyShop();
  toolbar.querySelector("#btn-weapons").onclick = () => openWeaponShop();
  toolbar.querySelector("#btn-market").onclick = () => openMarketShop(1);
  const adminBtn = toolbar.querySelector("#btn-admin");
  let adminHoldTimer = null;
  let adminOpenedCode = false;
  adminBtn.onclick = () => {
    if (adminOpenedCode) {
      adminOpenedCode = false;
      return;
    }
    openAdminPanel();
  };
  adminBtn.addEventListener("pointerdown", () => {
    adminOpenedCode = false;
    adminHoldTimer = setTimeout(() => {
      adminHoldTimer = null;
      adminOpenedCode = true;
      openCodePanel(); // скрытый вход (долгое нажатие) — Миша не увидит кнопку Код
    }, 900);
  });
  const clearAdminHold = () => {
    if (adminHoldTimer) {
      clearTimeout(adminHoldTimer);
      adminHoldTimer = null;
    }
  };
  adminBtn.addEventListener("pointerup", clearAdminHold);
  adminBtn.addEventListener("pointerleave", clearAdminHold);
  adminBtn.addEventListener("pointercancel", clearAdminHold);
  window.addEventListener("amal-owner-changed", () => syncAdminUi());
  syncAdminUi();
  toolbar.querySelector("#btn-revive").onclick = () => {
    if (buddy.dead) rebuildBuddy();
  };
  toolbar.querySelector("#btn-jump").onclick = () => jump(720);

  function hitTest(x, y) {
    const dx = x - buddy.x;
    const dy = y - (buddy.y - 20);
    return dx * dx + dy * dy < 85 * 85;
  }

  function canvasPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * W,
      y: ((ev.clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!overlay.classList.contains("hidden")) return;
    const p = canvasPos(e);
    aim.x = p.x;
    aim.y = p.y;
    const wpn = effectiveWeapon();

    // Ranged: click anywhere (wall / floor / buddy) to shoot toward that point
    if (isRanged(wpn) && !buddy.dead) {
      e.preventDefault();
      aim.down = true;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      fireRangedAt(p.x, p.y);
      canvas.style.cursor = "crosshair";
      return;
    }

    if (buddy.dead) return;
    if (!hitTest(p.x, p.y)) return;
    e.preventDefault();
    const now = performance.now();
    drag = {
      ox: p.x - buddy.x,
      oy: p.y - buddy.y,
      samples: [{ t: now, x: buddy.x, y: buddy.y }],
      startX: p.x,
      startY: p.y,
      moved: 0,
    };
    buddy.vx = 0;
    buddy.vy = 0;
    buddy.onGround = false;
    buddy.spin = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPos(e);
    aim.x = p.x;
    aim.y = p.y;

    if (aim.down && isRanged(effectiveWeapon())) {
      canvas.style.cursor = "crosshair";
      return;
    }

    if (!drag) return;
    const now = performance.now();
    const nx = Math.max(40, Math.min(W - 40, p.x - drag.ox));
    const ny = Math.max(60, Math.min(FLOOR - 30, p.y - drag.oy));
    drag.moved += Math.hypot(nx - buddy.x, ny - buddy.y);
    if (nx > buddy.x + 2) buddy.facing = 1;
    if (nx < buddy.x - 2) buddy.facing = -1;
    buddy.x = nx;
    buddy.y = ny;
    drag.samples.push({ t: now, x: nx, y: ny });
    while (drag.samples.length > 8) drag.samples.shift();
    while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift();
    if (drag.moved > 6) buddy.coinAcc += 0.02;
  });

  function endDrag(e) {
    if (aim.down) {
      aim.down = false;
      if (e) {
        const p = canvasPos(e);
        aim.x = p.x;
        aim.y = p.y;
      }
      canvas.style.cursor = isRanged(effectiveWeapon()) ? "crosshair" : "grab";
    }

    if (!drag) return;
    const samples = drag.samples;
    const moved = drag.moved;
    const startX = drag.startX;
    const startY = drag.startY;
    drag = null;
    canvas.style.cursor = isRanged(effectiveWeapon()) ? "crosshair" : "grab";

    const wpn = effectiveWeapon();
    if (moved < 18 && wpn.id !== "hand" && !isRanged(wpn) && !buddy.dead) {
      attackBuddy(wpn, startX, startY);
      return;
    }

    let tvx = 0;
    let tvy = 0;
    if (samples.length >= 2) {
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = Math.max(0.016, (b.t - a.t) / 1000);
      tvx = (b.x - a.x) / dt;
      tvy = (b.y - a.y) / dt;
    }
    buddy.vx = Math.max(-1400, Math.min(1400, tvx * 1.15));
    buddy.vy = Math.max(-1600, Math.min(900, tvy * 1.15));
    buddy.onGround = false;
    buddy.spin = buddy.vx * 0.008;

    const speed = Math.hypot(buddy.vx, buddy.vy);
    if (speed > 400) {
      say(["Лечууу!", "Уиии, высоко!", "Крылья нашлись!", "Полёт!"][Math.floor(Math.random() * 4)]);
    }

    if (buddy.coinAcc >= 1) {
      const add = addCoins(Math.floor(buddy.coinAcc));
      buddy.coinAcc = 0;
      persist();
      syncHud();
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  function update(dt) {
    if (attackCd > 0) attackCd -= dt;
    if (muzzleFlash > 0) muzzleFlash -= dt;

    // Hold-to-fire for auto ranged weapons (machine gun, uzi, flamethrower…)
    if (aim.down && !buddy.dead && overlay.classList.contains("hidden")) {
      const wpn = effectiveWeapon();
      if (isRanged(wpn) && wpn.auto) fireRangedAt(aim.x, aim.y);
    }

    updateProjectiles(dt);

    buddy.armPhase += dt * (Math.abs(buddy.vx) > 40 || !buddy.onGround ? 12 : 6);
    buddy.bob += dt * 3;
    if (buddy.blink > 0) buddy.blink -= dt;
    else if (Math.random() < dt * 0.4) buddy.blink = 0.12;
    if (buddy.smile > 1) buddy.smile -= dt * 0.5;
    else if (buddy.smile < 1) buddy.smile = Math.min(1, buddy.smile + dt);
    if (buddy.phraseT > 0) buddy.phraseT -= dt;
    buddy.phrase = "";
    buddy.phraseT = 0;
    killVoiceForever();
    if (buddy.hurtT > 0) buddy.hurtT -= dt;
    if (buddy.faceAuraT > 0) buddy.faceAuraT -= dt;
    if (buddy.frozenT > 0) buddy.frozenT -= dt;
    if (buddy.burnT > 0) {
      buddy.burnT -= dt;
      if (!buddy.dead && !save.godMode && Math.floor(buddy.burnT * 5) !== Math.floor((buddy.burnT + dt) * 5)) {
        buddy.hp -= 2;
        addCoins(1);
        persist();
        syncHud();
        burst(buddy.x, buddy.y - 30, "#e05030", 3, 80);
        floatText(buddy.x, buddy.y - 70, "-2", "#e05030");
        if (buddy.hp <= 0) killBuddy(weaponById("fire"));
      }
    }
    if (buddy.poisonT > 0) {
      buddy.poisonT -= dt;
      if (!buddy.dead && !save.godMode && Math.floor(buddy.poisonT * 4) !== Math.floor((buddy.poisonT + dt) * 4)) {
        buddy.hp -= 3;
        addCoins(2);
        persist();
        syncHud();
        burst(buddy.x, buddy.y - 30, "#6aaa3a", 4, 70);
        floatText(buddy.x, buddy.y - 70, "-3", "#6aaa3a");
        if (buddy.hp <= 0) killBuddy(weaponById("poison"));
      }
    }
    if (Math.abs(buddy.spin) > 0.01) {
      buddy.spin *= Math.max(0, 1 - 2.5 * dt);
    } else {
      buddy.spin = 0;
    }

    // Dead: stay down until revive (no auto-rebuild)
    if (buddy.dead) {
      if (save.mute) {
        buddy.phrase = "";
        buddy.phraseT = 0;
      } else {
        buddy.phraseT = Math.max(buddy.phraseT, 0.1);
      }
    }

    if (!drag && !buddy.dead) {
      buddy.jumpCd -= dt;
      buddy.sayCd -= dt;
      buddy.walkCd -= dt;

      const canWalk = buddy.frozenT <= 0;
      if (buddy.onGround && canWalk) {
        if (buddy.walkCd <= 0) {
          buddy.walkDir = Math.random() < 0.5 ? -1 : 1;
          buddy.walkCd = 0.45 + Math.random() * 1.1;
        }
        const targetSpeed = buddy.walkDir * (95 + Math.random() * 55);
        buddy.vx += (targetSpeed - buddy.vx) * Math.min(1, 5.5 * dt);
        buddy.facing = buddy.vx >= 0 ? 1 : -1;

        if (buddy.jumpCd <= 0) {
          const big = Math.random() < 0.42;
          jump(big ? 520 + Math.random() * 160 : 280 + Math.random() * 100, { quiet: !big });
          buddy.jumpCd = big ? 0.85 + Math.random() * 1.1 : 0.28 + Math.random() * 0.55;
        }
      } else if (buddy.frozenT > 0) {
        buddy.vx *= 0.9;
      }

      if (buddy.sayCd <= 0 && !listening && !save.mute) {
        buddy.sayCd = 99;
      }
    }

    if (!drag) {
      buddy.vy += GRAVITY * dt;
      buddy.x += buddy.vx * dt;
      buddy.y += buddy.vy * dt;
      if (!buddy.onGround) {
        buddy.vx *= Math.max(0, 1 - 0.35 * dt);
      } else {
        buddy.vx *= Math.max(0, 1 - 1.2 * dt);
      }

      if (buddy.x < 50) {
        buddy.x = 50;
        buddy.vx = Math.abs(buddy.vx) * 0.55;
        buddy.facing = 1;
        buddy.walkDir = 1;
      }
      if (buddy.x > W - 50) {
        buddy.x = W - 50;
        buddy.vx = -Math.abs(buddy.vx) * 0.55;
        buddy.facing = -1;
        buddy.walkDir = -1;
      }

      const groundY = FLOOR - 70;
      if (buddy.y >= groundY) {
        buddy.y = groundY;
        if (buddy.vy > 200) {
          buddy.squat = Math.min(0.3, buddy.vy * 0.00025);
          if (buddy.vy > 500) {
            buddy.vy = -buddy.vy * 0.35;
            buddy.onGround = false;
            if (!buddy.dead && !save.mute) say(["Бух!", "Ой!", "Мягкая посадка!"][Math.floor(Math.random() * 3)]);
          } else {
            buddy.vy = 0;
            buddy.onGround = true;
          }
        } else {
          buddy.vy = 0;
          buddy.onGround = true;
        }
        if (buddy.onGround) buddy.spin *= 0.5;
      } else {
        buddy.onGround = false;
      }
    }

    if (buddy.squat > 0) buddy.squat -= dt;

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    for (const f of floats) {
      f.y -= 50 * dt;
      f.life -= dt;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      if (floats[i].life <= 0) floats.splice(i, 1);
    }
    for (const b of blasts) b.life -= dt;
    for (let i = blasts.length - 1; i >= 0; i--) {
      if (blasts[i].life <= 0) blasts.splice(i, 1);
    }
    for (const m of wallMarks) m.life -= dt;
    for (let i = wallMarks.length - 1; i >= 0; i--) {
      if (wallMarks[i].life <= 0) wallMarks.splice(i, 1);
    }
  }

  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f3e7c0");
    g.addColorStop(1, "#d8c48a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(120, 90, 40, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + 4);
      ctx.stroke();
    }
    ctx.fillStyle = "#b89a58";
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, FLOOR, W, 8);
  }

  function drawClothes(hx, hy, torsoY, facing) {
    const shirt = itemById(save.shirt);
    if (shirt && shirt.id !== "none") {
      ctx.fillStyle = shirt.color || "#e05030";
      if (shirt.hoodie) {
        roundRectPath(hx - 36, torsoY - 38, 72, 78, 16);
        ctx.fill();
        // hood
        ctx.beginPath();
        ctx.arc(hx, hy + 8, 30, Math.PI, 0);
        ctx.fill();
      } else {
        roundRectPath(hx - 34, torsoY - 36, 68, 72, 14);
        ctx.fill();
      }
      if (shirt.target) {
        ctx.fillStyle = "#e05030";
        ctx.beginPath();
        ctx.arc(hx, torsoY + 4, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff8f0";
        ctx.beginPath();
        ctx.arc(hx, torsoY + 4, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e05030";
        ctx.beginPath();
        ctx.arc(hx, torsoY + 4, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (save.extra) {
      const ex = itemById(save.extra);
      if (ex.glasses) {
        ctx.strokeStyle = "#1a1410";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx - 10 * facing, hy - 2, 8, 0, Math.PI * 2);
        ctx.arc(hx + 10 * facing, hy - 2, 8, 0, Math.PI * 2);
        ctx.moveTo(hx - 2 * facing, hy - 2);
        ctx.lineTo(hx + 2 * facing, hy - 2);
        ctx.stroke();
      } else if (ex.color) {
        // scarf
        ctx.fillStyle = ex.color;
        roundRectPath(hx - 28, hy + 18, 56, 14, 6);
        ctx.fill();
        ctx.fillRect(hx + 10 * facing, hy + 28, 12, 36);
      }
    }

    if (save.hat) {
      const hat = itemById(save.hat);
      if (hat.crown) {
        ctx.fillStyle = hat.color;
        ctx.beginPath();
        ctx.moveTo(hx - 22, hy - 22);
        ctx.lineTo(hx - 14, hy - 42);
        ctx.lineTo(hx - 4, hy - 26);
        ctx.lineTo(hx, hy - 48);
        ctx.lineTo(hx + 4, hy - 26);
        ctx.lineTo(hx + 14, hy - 42);
        ctx.lineTo(hx + 22, hy - 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff8f0";
        ctx.beginPath();
        ctx.arc(hx, hy - 48, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = hat.color;
        roundRectPath(hx - 26, hy - 34, 52, 14, 4);
        ctx.fill();
        roundRectPath(hx - 18, hy - 48, 36, 18, 4);
        ctx.fill();
      }
    }
  }

  function drawBuddy() {
    const squat = buddy.squat * 40;
    const bob = buddy.onGround && !drag ? Math.sin(buddy.bob) * 2 : 0;
    const hx = buddy.x;
    const hy = buddy.y - 55 + squat * 0.4 + bob;
    const torsoY = buddy.y - 10 + squat * 0.5 + bob;
    const facing = buddy.facing;
    const skin = buddyById(save.buddyType);
    const hue = (buddy.bob * 90) % 360;
    const cloth = skin.rainbow ? `hsl(${hue}, 85%, 58%)` : skin.cloth;
    const clothDark = skin.rainbow ? `hsl(${(hue + 40) % 360}, 75%, 32%)` : skin.dark;
    const eyeColor = skin.rainbow ? `hsl(${(hue + 180) % 360}, 90%, 75%)` : skin.eye;
    const swing = Math.sin(buddy.armPhase) * (Math.abs(buddy.vx) > 50 || !buddy.onGround ? 14 : 8);
    const scale = save.giant ? 1.55 : 1;

    ctx.save();
    if (scale !== 1) {
      ctx.translate(buddy.x, FLOOR);
      ctx.scale(scale, scale);
      ctx.translate(-buddy.x, -FLOOR);
    }

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(buddy.x, FLOOR - 4, 36 - squat * 0.2, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(buddy.x, buddy.y);
    ctx.rotate(buddy.spin * 0.015);
    ctx.translate(-buddy.x, -buddy.y);

    // Super Rainbow aura
    if (skin.rainbow) {
      const pulse = 0.6 + Math.sin(buddy.bob * 3) * 0.25;
      const g = ctx.createRadialGradient(hx, torsoY, 8, hx, torsoY, 88);
      g.addColorStop(0, `hsla(${hue}, 90%, 60%, ${0.5 * pulse})`);
      g.addColorStop(0.35, `hsla(${(hue + 120) % 360}, 90%, 55%, ${0.35 * pulse})`);
      g.addColorStop(0.7, `hsla(${(hue + 240) % 360}, 90%, 50%, ${0.22 * pulse})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 88, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 10; i++) {
        const a = buddy.bob * 2 + i * (Math.PI / 5);
        const rr = 52 + Math.sin(buddy.bob * 2 + i) * 10;
        ctx.fillStyle = `hsl(${(hue + i * 36) % 360}, 95%, 65%)`;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(hx + Math.cos(a) * rr, torsoY + Math.sin(a) * rr * 0.65 - 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = `hsl(${hue}, 80%, 40%)`;
      ctx.beginPath();
      ctx.moveTo(hx - 30, torsoY - 28);
      ctx.quadraticCurveTo(hx - 62, torsoY + 12, hx - 38, buddy.y + 50 - squat);
      ctx.quadraticCurveTo(hx, torsoY + 42, hx + 38, buddy.y + 50 - squat);
      ctx.quadraticCurveTo(hx + 62, torsoY + 12, hx + 30, torsoY - 28);
      ctx.closePath();
      ctx.fill();
      const band = ctx.createLinearGradient(hx - 28, 0, hx + 28, 0);
      band.addColorStop(0, `hsl(${hue}, 95%, 55%)`);
      band.addColorStop(0.33, `hsl(${(hue + 120) % 360}, 95%, 55%)`);
      band.addColorStop(0.66, `hsl(${(hue + 240) % 360}, 95%, 55%)`);
      band.addColorStop(1, `hsl(${hue}, 95%, 55%)`);
      ctx.fillStyle = band;
      ctx.fillRect(hx - 28, torsoY - 32, 56, 6);
    } else if (skin.premium) {
      const pulse = 0.55 + Math.sin(buddy.bob * 2.2) * 0.2;
      const g = ctx.createRadialGradient(hx, torsoY, 10, hx, torsoY, 78);
      g.addColorStop(0, `rgba(253, 224, 71, ${0.35 * pulse})`);
      g.addColorStop(0.45, `rgba(167, 139, 250, ${0.28 * pulse})`);
      g.addColorStop(1, "rgba(109, 40, 217, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 78, 0, Math.PI * 2);
      ctx.fill();

      // floating sparkles
      for (let i = 0; i < 6; i++) {
        const a = buddy.bob * 1.4 + i * (Math.PI / 3);
        const rr = 48 + Math.sin(buddy.bob + i) * 6;
        const sx = hx + Math.cos(a) * rr;
        const sy = torsoY + Math.sin(a) * rr * 0.7 - 8;
        ctx.fillStyle = i % 2 ? "#fde68a" : "#fff";
        ctx.globalAlpha = 0.55 + Math.sin(buddy.bob * 3 + i) * 0.35;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // velvet cape
      ctx.fillStyle = "#4c1d95";
      ctx.beginPath();
      ctx.moveTo(hx - 28, torsoY - 28);
      ctx.quadraticCurveTo(hx - 58, torsoY + 10, hx - 36, buddy.y + 48 - squat);
      ctx.quadraticCurveTo(hx, torsoY + 40, hx + 36, buddy.y + 48 - squat);
      ctx.quadraticCurveTo(hx + 58, torsoY + 10, hx + 28, torsoY - 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(hx - 26, torsoY - 30, 52, 5);
    } else if (skin.limited) {
      // Покупной админ — янтарная аура + плащ (не фиолетовый)
      const pulse = 0.5 + Math.sin(buddy.bob * 2) * 0.18;
      const g = ctx.createRadialGradient(hx, torsoY, 8, hx, torsoY, 70);
      g.addColorStop(0, `rgba(255, 200, 80, ${0.42 * pulse})`);
      g.addColorStop(0.5, `rgba(200, 80, 20, ${0.22 * pulse})`);
      g.addColorStop(1, "rgba(120, 30, 10, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9a3412";
      ctx.beginPath();
      ctx.moveTo(hx - 26, torsoY - 26);
      ctx.quadraticCurveTo(hx - 52, torsoY + 8, hx - 32, buddy.y + 46 - squat);
      ctx.quadraticCurveTo(hx, torsoY + 36, hx + 32, buddy.y + 46 - squat);
      ctx.quadraticCurveTo(hx + 52, torsoY + 8, hx + 26, torsoY - 26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(hx - 24, torsoY - 28, 48, 4);
    } else if (skin.vip) {
      const pulse = 0.5 + Math.sin(buddy.bob * 2.4) * 0.2;
      const g = ctx.createRadialGradient(hx, torsoY, 8, hx, torsoY, 72);
      g.addColorStop(0, `rgba(34, 211, 238, ${0.4 * pulse})`);
      g.addColorStop(0.45, `rgba(244, 114, 182, ${0.28 * pulse})`);
      g.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(hx - 24, torsoY - 24);
      ctx.quadraticCurveTo(hx - 50, torsoY + 6, hx - 30, buddy.y + 44 - squat);
      ctx.quadraticCurveTo(hx, torsoY + 34, hx + 30, buddy.y + 44 - squat);
      ctx.quadraticCurveTo(hx + 50, torsoY + 6, hx + 24, torsoY - 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(hx - 22, torsoY - 26, 44, 4);
    } else if (skin.vipPlus) {
      const pulse = 0.55 + Math.sin(buddy.bob * 2.1) * 0.2;
      const g = ctx.createRadialGradient(hx, torsoY, 8, hx, torsoY, 76);
      g.addColorStop(0, `rgba(168, 85, 247, ${0.45 * pulse})`);
      g.addColorStop(0.5, `rgba(124, 58, 237, ${0.28 * pulse})`);
      g.addColorStop(1, "rgba(46, 16, 101, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 76, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e1065";
      ctx.beginPath();
      ctx.moveTo(hx - 24, torsoY - 24);
      ctx.quadraticCurveTo(hx - 52, torsoY + 8, hx - 30, buddy.y + 44 - squat);
      ctx.quadraticCurveTo(hx, torsoY + 34, hx + 30, buddy.y + 44 - squat);
      ctx.quadraticCurveTo(hx + 52, torsoY + 8, hx + 24, torsoY - 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c084fc";
      ctx.fillRect(hx - 22, torsoY - 26, 44, 4);
    }

    // legs
    ctx.strokeStyle = clothDark;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    const legSwing = drag || !buddy.onGround ? swing * 0.4 : Math.sin(buddy.armPhase) * 14;
    ctx.beginPath();
    ctx.moveTo(hx - 10, torsoY + 28);
    ctx.lineTo(hx - 16 - legSwing, buddy.y + 55 - squat);
    ctx.moveTo(hx + 10, torsoY + 28);
    ctx.lineTo(hx + 16 + legSwing, buddy.y + 55 - squat);
    ctx.stroke();

    // arms
    ctx.strokeStyle = cloth;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(hx - 22, torsoY - 18);
    ctx.lineTo(hx - 40, torsoY + 10 + swing);
    ctx.moveTo(hx + 22, torsoY - 18);
    ctx.lineTo(hx + 40, torsoY + 10 - swing);
    ctx.stroke();

    // torso (plain burlap unless shirt)
    if (skin.premium) {
      const tg = ctx.createLinearGradient(hx - 32, torsoY - 36, hx + 32, torsoY + 34);
      tg.addColorStop(0, "#f5e1ff");
      tg.addColorStop(0.4, cloth);
      tg.addColorStop(1, clothDark);
      ctx.fillStyle = tg;
    } else if (skin.limited) {
      const tg = ctx.createLinearGradient(hx - 32, torsoY - 36, hx + 32, torsoY + 34);
      tg.addColorStop(0, "#ffe8c8");
      tg.addColorStop(0.45, cloth);
      tg.addColorStop(1, clothDark);
      ctx.fillStyle = tg;
    } else if (skin.vip) {
      const tg = ctx.createLinearGradient(hx - 32, torsoY - 36, hx + 32, torsoY + 34);
      tg.addColorStop(0, "#ecfeff");
      tg.addColorStop(0.4, cloth);
      tg.addColorStop(1, clothDark);
      ctx.fillStyle = tg;
    } else {
      ctx.fillStyle = cloth;
    }
    roundRectPath(hx - 32, torsoY - 36, 64, 70 - squat * 0.3, 18);
    ctx.fill();
    if (skin.premium || skin.rainbow) {
      ctx.strokeStyle = skin.rainbow ? `hsl(${hue}, 95%, 60%)` : "#fbbf24";
      ctx.lineWidth = 2.5;
      roundRectPath(hx - 32, torsoY - 36, 64, 70 - squat * 0.3, 18);
      ctx.stroke();
      // ADMIN / RAINBOW badge
      ctx.fillStyle = skin.rainbow ? `hsl(${hue}, 90%, 55%)` : "#fbbf24";
      roundRectPath(hx - 26, torsoY - 6, 52, 16, 6);
      ctx.fill();
      ctx.fillStyle = skin.rainbow ? "#111827" : "#4c1d95";
      ctx.font = "900 9px Nunito, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(skin.rainbow ? "RAINBOW" : "ADMIN", hx, torsoY + 2);
    } else if (skin.limited) {
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      roundRectPath(hx - 32, torsoY - 36, 64, 70 - squat * 0.3, 18);
      ctx.stroke();
      // АДМИН badge — покупной лимит (другой)
      ctx.fillStyle = "#f59e0b";
      roundRectPath(hx - 26, torsoY - 6, 52, 16, 6);
      ctx.fill();
      ctx.fillStyle = "#431407";
      ctx.font = "900 9px Nunito, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("АДМИН", hx, torsoY + 2);
    } else if (skin.vip) {
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2.5;
      roundRectPath(hx - 32, torsoY - 36, 64, 70 - squat * 0.3, 18);
      ctx.stroke();
      ctx.fillStyle = "#22d3ee";
      roundRectPath(hx - 18, torsoY - 6, 36, 16, 6);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 10px Nunito, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VIP", hx, torsoY + 2);
    } else if (skin.vipPlus) {
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2.5;
      roundRectPath(hx - 32, torsoY - 36, 64, 70 - squat * 0.3, 18);
      ctx.stroke();
      ctx.fillStyle = "#7c3aed";
      roundRectPath(hx - 22, torsoY - 6, 44, 16, 6);
      ctx.fill();
      ctx.fillStyle = "#f3e8ff";
      ctx.font = "900 10px Nunito, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VIP+", hx, torsoY + 2);
    }
    // shoulder patches
    ctx.fillStyle = clothDark;
    ctx.beginPath();
    ctx.arc(hx - 26, torsoY - 22, 9, 0, Math.PI * 2);
    ctx.arc(hx + 26, torsoY - 22, 9, 0, Math.PI * 2);
    ctx.fill();
    if (skin.premium) {
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(hx - 26, torsoY - 22, 3.5, 0, Math.PI * 2);
      ctx.arc(hx + 26, torsoY - 22, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    drawClothes(hx, hy, torsoY, facing);

    // sheriff star badge
    if (skin.star) {
      const cx = hx;
      const cy = torsoY + 2;
      ctx.fillStyle = "#e8a820";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const a2 = a + Math.PI / 5;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
        else ctx.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
        ctx.lineTo(cx + Math.cos(a2) * 4, cy + Math.sin(a2) * 4);
      }
      ctx.closePath();
      ctx.fill();
    }

    // head
    if (skin.premium) {
      const hg = ctx.createRadialGradient(hx - 6, hy - 8, 4, hx, hy, 28);
      hg.addColorStop(0, "#fff7ff");
      hg.addColorStop(0.55, cloth);
      hg.addColorStop(1, clothDark);
      ctx.fillStyle = hg;
    } else {
      ctx.fillStyle = cloth;
    }
    ctx.beginPath();
    ctx.arc(hx, hy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skin.premium ? "#fbbf24" : "rgba(60,40,20,0.25)";
    ctx.lineWidth = skin.premium ? 2.5 : 2;
    ctx.stroke();

    // SkinAdminBuffer crown / limited crown
    if (skin.premium) {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(hx - 22, hy - 22);
      ctx.lineTo(hx - 16, hy - 44);
      ctx.lineTo(hx - 6, hy - 28);
      ctx.lineTo(hx, hy - 50);
      ctx.lineTo(hx + 6, hy - 28);
      ctx.lineTo(hx + 16, hy - 44);
      ctx.lineTo(hx + 22, hy - 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath();
      ctx.arc(hx, hy - 50, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(hx - 16, hy - 44, 2.2, 0, Math.PI * 2);
      ctx.arc(hx + 16, hy - 44, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.limited || skin.crown) {
      // Другая корона (медная) — покупной админ
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.moveTo(hx - 20, hy - 20);
      ctx.lineTo(hx - 14, hy - 40);
      ctx.lineTo(hx - 5, hy - 26);
      ctx.lineTo(hx, hy - 46);
      ctx.lineTo(hx + 5, hy - 26);
      ctx.lineTo(hx + 14, hy - 40);
      ctx.lineTo(hx + 20, hy - 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.arc(hx, hy - 46, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.vip) {
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.moveTo(hx - 18, hy - 18);
      ctx.lineTo(hx - 10, hy - 36);
      ctx.lineTo(hx, hy - 24);
      ctx.lineTo(hx + 10, hy - 36);
      ctx.lineTo(hx + 18, hy - 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f0abfc";
      ctx.beginPath();
      ctx.arc(hx, hy - 36, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // eyes
    const eyeY = hy - 2;
    // Dead X eyes
    if (buddy.dead) {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx - 14, eyeY - 4);
      ctx.lineTo(hx - 6, eyeY + 4);
      ctx.moveTo(hx - 14, eyeY + 4);
      ctx.lineTo(hx - 6, eyeY - 4);
      ctx.moveTo(hx + 6, eyeY - 4);
      ctx.lineTo(hx + 14, eyeY + 4);
      ctx.moveTo(hx + 6, eyeY + 4);
      ctx.lineTo(hx + 14, eyeY - 4);
      ctx.stroke();
    } else if (buddy.blink > 0) {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx - 14, eyeY);
      ctx.lineTo(hx - 6, eyeY);
      ctx.moveTo(hx + 6, eyeY);
      ctx.lineTo(hx + 14, eyeY);
      ctx.stroke();
    } else if (skin.premium) {
      // gem eyes
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(hx - 10, eyeY, 6.2, 0, Math.PI * 2);
      ctx.arc(hx + 10, eyeY, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6d28d9";
      ctx.beginPath();
      ctx.arc(hx - 10, eyeY, 3.2, 0, Math.PI * 2);
      ctx.arc(hx + 10, eyeY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(hx - 11.5, eyeY - 1.5, 1.4, 0, Math.PI * 2);
      ctx.arc(hx + 8.5, eyeY - 1.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(hx - 10, eyeY, 5.5, 0, Math.PI * 2);
      ctx.arc(hx + 10, eyeY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cloth;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx - 12, eyeY - 2);
      ctx.lineTo(hx - 8, eyeY + 2);
      ctx.moveTo(hx - 12, eyeY + 2);
      ctx.lineTo(hx - 8, eyeY - 2);
      ctx.moveTo(hx + 8, eyeY - 2);
      ctx.lineTo(hx + 12, eyeY + 2);
      ctx.moveTo(hx + 8, eyeY + 2);
      ctx.lineTo(hx + 12, eyeY - 2);
      ctx.stroke();
    }

    // smile
    ctx.strokeStyle = skin.premium ? "#6d28d9" : eyeColor;
    ctx.lineWidth = skin.premium ? 2.5 : 2;
    ctx.setLineDash(skin.premium ? [] : [3, 3]);
    ctx.beginPath();
    ctx.arc(hx, hy + 6, 11 * Math.min(1.2, buddy.smile), 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    // аура на лице (от удара / выстрела в стену) — сильнее удар → ярче и дольше
    if (buddy.faceAuraT > 0) {
      const a = Math.min(1, buddy.faceAuraT);
      const pulse = 0.55 + Math.sin(buddy.bob * 8) * 0.2;
      const gr = ctx.createRadialGradient(hx, hy, 6, hx, hy, 38 + a * 12);
      const col = buddy.faceAuraColor || "#ffd76a";
      gr.addColorStop(0, col);
      gr.addColorStop(0.45, col);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.25 * a * pulse;
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(hx, hy, 40 + a * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55 * a;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(hx, hy, 30 + a * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // elemental aura
    if (buddy.frozenT > 0) {
      ctx.fillStyle = "rgba(94,200,232,0.28)";
      ctx.beginPath();
      ctx.arc(hx, torsoY, 48, 0, Math.PI * 2);
      ctx.fill();
    }
    if (buddy.burnT > 0) {
      ctx.fillStyle = "rgba(224,80,48,0.22)";
      ctx.beginPath();
      ctx.arc(hx, torsoY - 10, 42, 0, Math.PI * 2);
      ctx.fill();
    }
    if (buddy.poisonT > 0) {
      ctx.fillStyle = "rgba(106,170,58,0.25)";
      ctx.beginPath();
      ctx.arc(hx, torsoY, 44, 0, Math.PI * 2);
      ctx.fill();
    }
    if (buddy.hurtT > 0) {
      ctx.strokeStyle = `rgba(224,80,48,${buddy.hurtT})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 55, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HP bar
    const bw = 72;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(hx - bw / 2, hy - 48, bw, 7);
    ctx.fillStyle = buddy.hp / buddy.maxHp > 0.3 ? "#3a9a4a" : "#e05030";
    ctx.fillRect(hx - bw / 2, hy - 48, bw * Math.max(0, buddy.hp / buddy.maxHp), 7);

    // speech bubble (not rotated) — в режиме молчания никогда не рисуем
    if (!save.mute && buddy.phraseT > 0 && buddy.phrase) {
      const text = buddy.phrase;
      ctx.font = "800 16px Nunito, system-ui";
      const tw = Math.min(280, ctx.measureText(text).width);
      const bx = Math.min(W - tw - 40, Math.max(12, hx + 36));
      const by = hy - 58;
      const bblW = tw + 24;
      const bh = 34;
      ctx.fillStyle = "#fffdf5";
      roundRectPath(bx, by, bblW, bh, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(80,50,10,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + 8, by + bh);
      ctx.lineTo(bx + 4, by + bh + 12);
      ctx.lineTo(bx + 22, by + bh);
      ctx.fill();
      ctx.fillStyle = "#2a1c08";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + 12, by + bh / 2);
    }

    ctx.restore(); // giant scale
  }

  function render() {
    drawBackground();
    drawBuddy();
    drawProjectiles();
    drawEquippedWeapon();

    // метки на стене с аурой — чем сильнее выстрел, тем больше кольцо
    for (const m of wallMarks) {
      const t = Math.max(0, m.life / (m.maxLife || 1));
      const pulse = 0.75 + Math.sin(performance.now() * 0.012 + m.x) * 0.2;
      ctx.globalAlpha = 0.35 * t * pulse;
      const g = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, m.r);
      g.addColorStop(0, m.color);
      g.addColorStop(0.55, m.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.7 * t;
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2 + Math.min(6, m.power / 80);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * (0.55 + (1 - t) * 0.35), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const b of blasts) {
      const t = Math.max(0, b.life);
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1.2 - t), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.globalAlpha = Math.min(0.25, t);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1.1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.s, p.s);
      ctx.globalAlpha = 1;
    }

    ctx.font = "900 18px Nunito, system-ui";
    ctx.textAlign = "center";
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  syncHud();
  setDeadUI(false);
  killVoiceForever();
  stopAllSpeech();
  persist(); // сохранить mute=true
  canvas.style.cursor = isRanged(effectiveWeapon()) ? "crosshair" : "grab";

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (t === "heal" || t === "max" || t === "kb-revive") {
      buddy.hp = buddy.maxHp;
      buddy.dead = false;
      buddy.burnT = 0;
      buddy.poisonT = 0;
      syncHud();
      setDeadUI(false);
    }
    if (t === "kb-oneshot") {
      buddy.hp = 0;
      if (typeof killBuddy === "function") killBuddy(effectiveWeapon());
      syncHud();
    }
    if (t === "kb-minsk" || t === "max") {
      if (isMinskOwner()) {
        grantMinskLoot();
        save.infDmg = true;
        save.weapon = "minsk_inf_mg";
        persist();
        syncHud();
        say("🇧🇾 Минск только тебе!");
      }
    }
    if (t === "god" || t === "max" || t === "kb-loot" || t === "kb-vip") {
      save.godMode = true;
      save.vip = true;
      save.vipPlus = true;
      grantAdminLoot();
      persist();
      syncHud();
    }
    if (t === "coins" || t === "max") {
      save.infCoins = true;
      save.coins = Math.max(save.coins, 999999);
      persist();
      syncHud();
    }
    if (t === "dmg" || t === "max") {
      save.infDmg = true;
      persist();
    }
  });
})();
