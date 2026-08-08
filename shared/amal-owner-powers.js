/**
 * Супер-силы хозяина — СВОЙ набор кнопок под каждую игру.
 */
(function (global) {
  "use strict";

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const SECRET = "AmalOwner2026";
  const INF = 999999999;

  const flags = { god: true, healPulse: 0, speed: true, dmg: true, coins: true };

  const GAME_PACKS = {
    blockbust: {
      title: "Blockbust",
      subtitle: "Любая фигура · ∞ · супер-админ",
      quick: [
        { id: "bb-pick", label: "🧩 Фигура", toast: "Выбери фигуру в игре" },
        { id: "bb-clear", label: "🧹 Поле", toast: "Поле очищено" },
        { id: "bb-score", label: "🏆 +очки", toast: "Мега-счёт" },
      ],
      buttons: [
        { id: "bb-pick", label: "🧩 Выбрать любую фигуру", cls: "primary" },
        { id: "bb-clear", label: "🧹 Очистить поле" },
        { id: "bb-refill", label: "🎲 Три новые фигуры" },
        { id: "bb-score", label: "🏆 +100000 очков" },
        { id: "bb-combo", label: "🔥 Комбо ×99" },
        { id: "bb-revive", label: "♻️ Нельзя проиграть" },
        { id: "bb-cinema", label: "🎬 Фон Кинозал" },
        { id: "bb-cubes", label: "💎 Все кубы" },
        { id: "bb-adv", label: "🗺 Вся кампания" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "kick-buddy": {
      title: "Kick Buddy",
      subtitle: "Беларусь · Минск только тебе",
      quick: [
        { id: "kb-minsk", label: "🇧🇾 Минск", toast: "Минск твой" },
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "kb-oneshot", label: "💥 Убить", toast: "Одним ударом" },
      ],
      buttons: [
        { id: "kb-minsk", label: "🇧🇾 Весь Минск (только ты)", cls: "primary" },
        { id: "heal", label: "💚 Полный хилл" },
        { id: "god", label: "🛡️ God mode" },
        { id: "kb-oneshot", label: "💥 Убить бади" },
        { id: "kb-revive", label: "♻️ Оживить бади" },
        { id: "coins", label: "💰 ∞ монеты" },
        { id: "dmg", label: "⚔ ∞ урон" },
        { id: "kb-loot", label: "🎁 Всё оружие/скины" },
        { id: "kb-vip", label: "💎 VIP+" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "coin-arsenal": {
      title: "Coin Arsenal",
      subtitle: "Волны · оружие · HP",
      quick: [
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "ca-clear", label: "☠ Чистка", toast: "Волна очищена" },
        { id: "ca-doomsday", label: "☢ Судный", toast: "Судный день" },
      ],
      buttons: [
        { id: "heal", label: "💚 Полный хилл", cls: "primary" },
        { id: "god", label: "🛡️ Бессмертие" },
        { id: "ca-clear", label: "☠ Убить всех врагов" },
        { id: "ca-doomsday", label: "☢ Судный день" },
        { id: "coins", label: "💰 ∞ монеты" },
        { id: "unlock", label: "🔓 Всё оружие" },
        { id: "ca-wave", label: "🌊 +5 волн" },
        { id: "speed", label: "⚡ Скорость" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "x-buggy": {
      title: "X-Buggy",
      subtitle: "Без аварий · ∞ время · турбо",
      quick: [
        { id: "xb-goddrive", label: "🛡 ∞ езда", toast: "Без аварий · ∞ время" },
        { id: "xb-turbo", label: "🚀 Турбо", toast: "Турбо" },
        { id: "xb-finish", label: "🏁 Финиш", toast: "Финиш!" },
      ],
      buttons: [
        { id: "xb-goddrive", label: "🛡 Без аварий + ∞ время", cls: "primary" },
        { id: "heal", label: "💚 Починить багги" },
        { id: "god", label: "🛡️ Режим хозяина" },
        { id: "xb-turbo", label: "🚀 Турбо ×3" },
        { id: "xb-time", label: "⏱ ∞ время" },
        { id: "xb-finish", label: "🏁 Мгновенный финиш" },
        { id: "xb-fix", label: "✨ Сброс аварии" },
        { id: "speed", label: "⚡ Макс скорость" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "ladder-climb": {
      title: "Лестница",
      subtitle: "Ступени · HP · уровни",
      quick: [
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "lc-skip", label: "⏭ Уровень", toast: "Следующий уровень" },
        { id: "unlock", label: "🔓 Все", toast: "Все уровни" },
      ],
      buttons: [
        { id: "heal", label: "💚 Полный хилл", cls: "primary" },
        { id: "god", label: "🛡️ Бессмертие" },
        { id: "lc-skip", label: "⏭ Пройти уровень" },
        { id: "unlock", label: "🔓 Все уровни" },
        { id: "lc-top", label: "🏔 На верх" },
        { id: "speed", label: "⚡ Прыжки" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "bravol-stars": {
      title: "Bravol Stars",
      subtitle: "Файтеры · урон · полёт",
      quick: [
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "dmg", label: "💥 Урон", toast: "∞ урон" },
        { id: "bs-kill", label: "☠ Всех", toast: "Враги уничтожены" },
      ],
      buttons: [
        { id: "heal", label: "💚 Полный хилл", cls: "primary" },
        { id: "god", label: "🛡️ Бессмертие" },
        { id: "dmg", label: "💥 ∞ урон" },
        { id: "bs-kill", label: "☠ Убить всех врагов" },
        { id: "bs-fly", label: "🕊 Полёт / noclip" },
        { id: "coins", label: "💰 ∞ монеты" },
        { id: "unlock", label: "🔓 Все бойцы" },
        { id: "speed", label: "⚡ Супер-скорость" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    terraverse: {
      title: "Пиксель-Террариум",
      subtitle: "Creative · бессмертие · хост",
      quick: [
        { id: "god", label: "🛡 ∞ HP", toast: "Creative + бессмертие" },
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "max", label: "⚡ Макс", toast: "Макс" },
      ],
      buttons: [
        { id: "god", label: "🛡️ Creative + бессмертие", cls: "primary" },
        { id: "heal", label: "💚 Полный хилл" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "snake-game": {
      title: "Snake Game",
      subtitle: "Бессмертие · щиты · сердца",
      quick: [
        { id: "god", label: "🛡 ∞ жизнь", toast: "Бессмертие змейки" },
        { id: "heal", label: "💚 Хилл", toast: "Сердца и щиты" },
        { id: "max", label: "⚡ Макс", toast: "Макс" },
      ],
      buttons: [
        { id: "god", label: "🛡️ Бессмертие (стены/хвост)", cls: "primary" },
        { id: "heal", label: "💚 +сердца и щиты" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    hideout: {
      title: "Укрытие",
      subtitle: "Прятки · стрелки · пропуск",
      quick: [
        { id: "ho-arrows", label: "➡ Стрелки", toast: "Стрелки к прячущимся" },
        { id: "ho-skip", label: "⏭ Поиск", toast: "Поиск начался" },
        { id: "ho-catch", label: "👁 Ловля", toast: "Супер-ловля" },
      ],
      buttons: [
        { id: "ho-arrows", label: "➡ Стрелки: где все прячутся", cls: "primary" },
        { id: "ho-skip", label: "⏭ Пропустить прятки → поиск" },
        { id: "heal", label: "💚 Сброс / хилл" },
        { id: "god", label: "👻 Неуловим" },
        { id: "ho-catch", label: "👁 Супер-ловля" },
        { id: "ho-time", label: "⏱ +60 сек" },
        { id: "speed", label: "⚡ Супер-скорость" },
        { id: "ho-seeker", label: "🔍 Стать искателем" },
        { id: "ho-hider", label: "📦 Стать прячущимся" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "globe-battle": {
      title: "Globe Battle",
      subtitle: "Арена · карты · удары",
      quick: [
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "gb-shield", label: "🛡 Щит", toast: "Щит ×5" },
        { id: "gb-center", label: "🎯 Центр", toast: "В центре" },
      ],
      buttons: [
        { id: "heal", label: "💚 Хилл / центр", cls: "primary" },
        { id: "god", label: "🛡️ Бессмертие" },
        { id: "gb-shield", label: "🛡 Щиты ×5" },
        { id: "gb-center", label: "🎯 В центр арены" },
        { id: "gb-stun", label: "💫 Снять стан" },
        { id: "gb-cards", label: "🃏 Карты смерти" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "space-courier": {
      title: "Space Courier",
      subtitle: "Топливо · астероиды · бомбы",
      quick: [
        { id: "heal", label: "💚 Топливо", toast: "Топливо" },
        { id: "sc-clear", label: "☄ Чистка", toast: "Астероиды сбиты" },
        { id: "sc-bombs", label: "💣 Бомбы", toast: "∞ бомбы" },
      ],
      buttons: [
        { id: "heal", label: "💚 Топливо + щит", cls: "primary" },
        { id: "god", label: "🛡️ God mode" },
        { id: "sc-clear", label: "☄ Уничтожить астероиды" },
        { id: "sc-bombs", label: "💣 ∞ бомбы" },
        { id: "sc-score", label: "🏆 +5000 очков" },
        { id: "speed", label: "⚡ Буст" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "melon-playground": {
      title: "Дыня",
      subtitle: "Песочница · ломать · чинить",
      quick: [
        { id: "heal", label: "💚 Хилл", toast: "Дыни целы" },
        { id: "mp-smash", label: "🔨 Кранч", toast: "Кранч!" },
        { id: "mp-spawn", label: "🍉 Дыня", toast: "Новая дыня" },
      ],
      buttons: [
        { id: "heal", label: "💚 Починить дыни", cls: "primary" },
        { id: "mp-smash", label: "🔨 Кранч всего" },
        { id: "mp-spawn", label: "🍉 Заспавнить дыню" },
        { id: "dmg", label: "💥 Мега-урон" },
        { id: "mp-clear", label: "🧹 Очистить арену" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    "zombie-vs-plants": {
      title: "Зомби vs Растения",
      subtitle: "Солнце · растения · зомби",
      quick: [
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "zvp-kill", label: "☠ Зомби", toast: "Зомби убиты" },
        { id: "zvp-sun", label: "☀️ Солнце", toast: "∞ солнце" },
      ],
      buttons: [
        { id: "heal", label: "💚 Хилл растений", cls: "primary" },
        { id: "zvp-sun", label: "☀️ ∞ солнце" },
        { id: "zvp-kill", label: "☠ Убить всех зомби" },
        { id: "unlock", label: "🔓 Все растения" },
        { id: "zvp-win", label: "🏆 Победа" },
        { id: "zvp-boss", label: "👑 Боссы зомби" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
    minecraft: {
      title: "Minecraft",
      subtitle: "Креатив · полёт · хилл",
      quick: [
        { id: "heal", label: "💚 Хилл", toast: "Хилл" },
        { id: "mc-fly", label: "🕊 Полёт", toast: "Полёт" },
        { id: "mc-creative", label: "✨ Креатив", toast: "Креатив" },
      ],
      buttons: [
        { id: "heal", label: "💚 Полный хилл", cls: "primary" },
        { id: "god", label: "🛡️ Админ" },
        { id: "mc-fly", label: "🕊 Полёт" },
        { id: "mc-creative", label: "✨ Креатив + noclip" },
        { id: "mc-food", label: "🍖 Еда max" },
        { id: "speed", label: "⚡ Быстрее" },
        { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
      ],
    },
  };

  const DEFAULT_PACK = {
    title: "Игра",
    subtitle: "Общие силы хозяина",
    quick: [
      { id: "heal", label: "💚 Хилл", toast: "Хилл" },
      { id: "god", label: "🛡️", toast: "Бессмертие" },
      { id: "max", label: "⚡ Макс", toast: "Макс" },
    ],
    buttons: [
      { id: "heal", label: "💚 Хилл", cls: "primary" },
      { id: "god", label: "🛡️ Бессмертие" },
      { id: "coins", label: "💰 ∞ монеты" },
      { id: "dmg", label: "💥 ∞ урон" },
      { id: "unlock", label: "🔓 Всё открыто" },
      { id: "speed", label: "⚡ Скорость" },
      { id: "max", label: "⚡ ВСЁ НА МАКС", cls: "max" },
    ],
  };

  function gameId() {
    try {
      if (global.AmalHub && typeof AmalHub.gameId === "function") return AmalHub.gameId();
    } catch (_) {}
    const parts = location.pathname.replace(/\\/g, "/").split("/").filter(Boolean);
    const cleaned = parts.filter((p) => !/\.(html?|js|css)$/i.test(p));
    const idx = cleaned.indexOf("amal-games");
    if (idx >= 0) return cleaned[idx + 1] || "portal";
    return cleaned[cleaned.length - 1] || "portal";
  }

  function packFor(id) {
    return GAME_PACKS[id] || DEFAULT_PACK;
  }

  function isOwner() {
    if (global.__AMAL_OWNER__ === true || global.__AMAL_GOD__ === true) return true;
    try {
      if (global.AmalOwner && AmalOwner.isOwner()) return true;
    } catch (_) {}
    try {
      if (global.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      if (global.AmalHub && AmalHub.isGameAdmin && AmalHub.isGameAdmin(gameId())) return true;
    } catch (_) {}
    try {
      const code = new URLSearchParams(location.search).get("owner");
      if (code === SECRET || code === "amal" || code === "1234" || code === "buddy") {
        unlockAll();
        return true;
      }
    } catch (_) {}
    try {
      return OWNER_KEYS.some((k) => localStorage.getItem(k) === "1");
    } catch (_) {
      return false;
    }
  }

  function jget(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? fallback : JSON.parse(v);
    } catch (_) {
      return fallback;
    }
  }

  function jset(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (_) {}
  }

  function fire(type, extra) {
    const detail = Object.assign({ type: type, game: gameId(), at: Date.now() }, extra || {});
    try {
      global.dispatchEvent(new CustomEvent("amal-power", { detail: detail }));
    } catch (_) {}
    return detail;
  }

  function toast(text) {
    let el = document.getElementById("amal-powers-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-powers-toast";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1700);
  }

  function unlockAll() {
    global.__AMAL_OWNER__ = true;
    global.__AMAL_GOD__ = true;
    flags.god = true;
    try {
      OWNER_KEYS.forEach((k) => localStorage.setItem(k, "1"));
    } catch (_) {}
    try {
      if (global.AmalOwner && AmalOwner.unlock) {
        AmalOwner.unlock(SECRET);
        AmalOwner.unlock("amal");
        AmalOwner.unlock("1234");
      }
    } catch (_) {}
    applyBoosts();
    try {
      global.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: true }));
    } catch (_) {}
  }

  function applyBoosts() {
    if (!isOwner()) return;
    global.__AMAL_GOD__ = !!flags.god;
    jset("bb-web-coins", INF);
    jset("bb-web-best", INF);
    jset("bb-web-owned-speed-v1", true);
    const cubes = jget("bb-web-owned-cubes-v1", []);
    if (Array.isArray(cubes) && !cubes.includes("starfire")) {
      cubes.push("starfire");
      jset("bb-web-owned-cubes-v1", cubes);
    }
    const adv = jget("bb-web-adv", { maxUnlocked: 1, completed: [] });
    if (adv && typeof adv === "object") {
      adv.maxUnlocked = 99;
      jset("bb-web-adv", adv);
    }
    const kb = jget("kick-buddy-v4", null);
    if (kb && typeof kb === "object") {
      kb.infCoins = true;
      kb.infDmg = true;
      kb.godMode = !!flags.god;
      kb.coins = INF;
      kb.vip = true;
      kb.vipPlus = true;
      jset("kick-buddy-v4", kb);
    }
    const ca = jget("coin-arsenal-v1", { coins: 0, owned: ["pipe"], equipped: "pipe", bestWave: 0, bestKills: 0 });
    if (ca && typeof ca === "object") {
      ca.coins = INF;
      ca.owned = Array.from(
        new Set([...(ca.owned || []), "pipe", "pistol", "smg", "shotgun", "railgun", "doomsday"]),
      );
      ca.equipped = "doomsday";
      jset("coin-arsenal-v1", ca);
    }
    jset("bravol-coins", INF);
    jset("stair-steps-v1-unlock", 99);
    jset("space-courier-v2-unlock", 99);
    jset("mp-owner-god", true);
    jset("hideout-owner-god", true);
    jset("globe-owner-god", true);
    jset("zvp-owner-god", true);
    jset("minecraft-owner-god", true);
    try {
      localStorage.setItem("pixel-terrarium-host-v1", "1");
    } catch (_) {}
    global.dispatchEvent(new CustomEvent("amal-powers-applied", { detail: { game: gameId() } }));
  }

  function runAbility(id) {
    if (!isOwner()) return;
    const map = {
      heal() {
        flags.healPulse = Date.now();
        global.__AMAL_HEAL__ = flags.healPulse;
        fire("heal");
        toast("💚 Хилл");
      },
      god() {
        flags.god = true;
        global.__AMAL_GOD__ = true;
        applyBoosts();
        fire("god", { on: true });
        toast("🛡️ Бессмертие ВКЛ");
        syncUi();
      },
      coins() {
        flags.coins = true;
        applyBoosts();
        fire("coins");
        toast("💰 ∞ монеты");
      },
      dmg() {
        flags.dmg = true;
        global.__AMAL_DMG__ = true;
        applyBoosts();
        fire("dmg");
        toast("💥 ∞ урон");
      },
      unlock() {
        applyBoosts();
        fire("unlock");
        toast("🔓 Всё открыто");
      },
      speed() {
        flags.speed = true;
        global.__AMAL_SPEED__ = true;
        fire("speed");
        toast("⚡ Скорость");
      },
      max() {
        flags.god = true;
        flags.speed = true;
        flags.dmg = true;
        flags.coins = true;
        global.__AMAL_GOD__ = true;
        global.__AMAL_DMG__ = true;
        global.__AMAL_SPEED__ = true;
        applyBoosts();
        ["heal", "god", "coins", "dmg", "unlock", "speed", "max"].forEach((t) =>
          fire(t, t === "god" ? { on: true } : undefined),
        );
        // game-specific crunch burst
        const pack = packFor(gameId());
        (pack.buttons || []).forEach((b) => {
          if (b.id !== "max" && !["heal", "god", "coins", "dmg", "unlock", "speed"].includes(b.id)) {
            fire(b.id);
          }
        });
        toast("⚡ ВСЕ СИЛЫ · " + (pack.title || gameId()));
        syncUi();
      },
    };
    if (map[id]) map[id]();
    else {
      fire(id);
      const pack = packFor(gameId());
      const btn = (pack.buttons || []).concat(pack.quick || []).find((b) => b.id === id);
      toast((btn && (btn.toast || btn.label)) || "⚡ " + id);
    }
  }

  function syncUi() {
    const fab = document.getElementById("amal-powers-fab");
    const pack = packFor(gameId());
    if (fab) fab.textContent = "⚡ " + (pack.title || "Силы");
  }

  function readGiveAmount() {
    const input = document.getElementById("amal-powers-amount");
    const raw = input ? String(input.value || "").trim() : "";
    if (!raw) return null;
    if (/^(inf|∞|max|макс)$/i.test(raw)) return 999999999;
    const n = Number(String(raw).replace(/\s+/g, "").replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  }

  function giveAmount(kind) {
    if (!isOwner()) return;
    const amount = readGiveAmount();
    if (amount == null) {
      toast("Напиши число или выбери готовую цифру");
      return;
    }
    const labels = { coins: "монет", score: "очков", cups: "кубков" };
    fire("set-" + kind, { amount: amount, kind: kind });
    fire("set-amount", { amount: amount, kind: kind });
    toast((kind === "coins" ? "💰 " : kind === "score" ? "🏆 " : "🏅 ") + amount.toLocaleString("ru-RU") + " " + (labels[kind] || kind));
  }

  function ensureUi() {
    if (!isOwner()) return;
    if (gameId() === "portal") return;
    const pack = packFor(gameId());

    if (!document.getElementById("amal-powers-css")) {
      const css = document.createElement("style");
      css.id = "amal-powers-css";
      css.textContent = `
#amal-powers-fab{position:fixed;right:12px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:2147482990;border:0;border-radius:16px;padding:10px 12px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#111;font:800 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(245,158,11,.35);max-width:46vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#amal-powers-panel{position:fixed;right:12px;bottom:calc(138px + env(safe-area-inset-bottom,0px));z-index:2147482990;width:min(94vw,340px);max-height:min(70vh,520px);overflow:auto;padding:12px;border-radius:18px;border:1px solid rgba(251,191,36,.45);background:rgba(12,10,6,.97);color:#fff7ed;font:700 12px/1.35 system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.5);display:none}
#amal-powers-panel.open{display:block}
#amal-powers-panel h3{margin:0 0 4px;font-size:15px}
#amal-powers-panel .sub{opacity:.78;font-size:11px;margin-bottom:10px}
#amal-powers-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#amal-powers-panel button{border:0;border-radius:12px;padding:11px 8px;background:rgba(255,255,255,.1);color:#fff;font:800 12px/1.2 system-ui,sans-serif;cursor:pointer;text-align:left}
#amal-powers-panel button.primary{background:linear-gradient(135deg,#34d399,#059669);color:#052e1c;grid-column:1/-1;text-align:center}
#amal-powers-panel button.max{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111;grid-column:1/-1;text-align:center}
#amal-powers-panel button.wide{grid-column:1/-1;background:rgba(255,255,255,.08);text-align:center}
#amal-powers-toast{position:fixed;left:50%;top:16%;transform:translateX(-50%) translateY(-8px);z-index:2147483000;padding:10px 16px;border-radius:14px;background:rgba(0,0,0,.85);color:#fff;font:800 14px/1 system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;max-width:90vw}
#amal-powers-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#amal-powers-quick{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482985;display:flex;gap:7px;padding:8px;border-radius:18px;background:rgba(8,6,4,.82);backdrop-filter:blur(8px);box-shadow:0 10px 28px rgba(0,0,0,.4);max-width:96vw}
#amal-powers-quick button{border:0;border-radius:14px;padding:10px 11px;font:800 12px/1 system-ui,sans-serif;cursor:pointer;color:#111;background:linear-gradient(135deg,#fde68a,#f59e0b);white-space:nowrap}
#amal-powers-quick button:nth-child(1){background:linear-gradient(135deg,#6ee7b7,#10b981)}
#amal-powers-quick button:nth-child(2){background:linear-gradient(135deg,#93c5fd,#3b82f6);color:#eff6ff}
#amal-powers-tag{display:inline-block;margin-left:6px;padding:2px 7px;border-radius:999px;background:rgba(251,191,36,.2);color:#fde68a;font-size:10px}
#amal-powers-give{grid-column:1/-1;margin:4px 0 8px;padding:10px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
#amal-powers-give .give-title{font-size:12px;margin-bottom:6px;opacity:.9}
#amal-powers-give input{width:100%;box-sizing:border-box;border:0;border-radius:10px;padding:10px;font:800 14px/1 system-ui,sans-serif;background:#111;color:#fff7ed;margin-bottom:6px}
#amal-powers-presets{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
#amal-powers-presets button{flex:0 0 auto;padding:7px 9px;border-radius:999px;background:rgba(251,191,36,.15);color:#fde68a;font:800 11px/1 system-ui,sans-serif}
#amal-powers-give-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}
#amal-powers-give-actions button{padding:9px 6px;text-align:center;background:rgba(52,211,153,.18);color:#bbf7d0}
`;
      document.head.appendChild(css);
    }

    let fab = document.getElementById("amal-powers-fab");
    let panel = document.getElementById("amal-powers-panel");
    if (!fab) {
      fab = document.createElement("button");
      fab.id = "amal-powers-fab";
      fab.type = "button";
      document.body.appendChild(fab);
      panel = document.createElement("div");
      panel.id = "amal-powers-panel";
      document.body.appendChild(panel);
      fab.onclick = () => panel.classList.toggle("open");
    }

    const giveBlock = `
      <div id="amal-powers-give">
        <div class="give-title">Выдать себе число · монеты / очки / кубки</div>
        <input id="amal-powers-amount" type="text" inputmode="numeric" placeholder="Напиши цифру, напр. 50000" value="100000" />
        <div id="amal-powers-presets">
          <button type="button" data-preset="1000">1 000</button>
          <button type="button" data-preset="10000">10 000</button>
          <button type="button" data-preset="100000">100 000</button>
          <button type="button" data-preset="1000000">1 000 000</button>
          <button type="button" data-preset="999999999">∞</button>
        </div>
        <div id="amal-powers-give-actions">
          <button type="button" data-give="coins">💰 Монеты</button>
          <button type="button" data-give="score">🏆 Очки</button>
          <button type="button" data-give="cups">🏅 Кубки</button>
        </div>
      </div>`;

    panel.innerHTML =
      `<h3>⚡ ${pack.title} <span class="amal-powers-tag">эта игра</span></h3>` +
      `<div class="sub">${pack.subtitle}</div>` +
      `<div id="amal-powers-grid">` +
      giveBlock +
      (pack.buttons || [])
        .map(
          (b) =>
            `<button type="button" class="${b.cls || ""}" data-ap="${b.id}">${b.label}</button>`,
        )
        .join("") +
      `<button type="button" class="wide" data-ap="__reload">↻ Обновить игру</button>` +
      `<button type="button" class="wide" data-ap="__hub">👑 Меню хозяина</button>` +
      `</div>`;

    panel.querySelectorAll("[data-ap]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-ap");
        if (id === "__reload") {
          applyBoosts();
          location.reload();
          return;
        }
        if (id === "__hub") {
          try {
            if (global.AmalHub) AmalHub.open("admin");
          } catch (_) {}
          panel.classList.remove("open");
          return;
        }
        runAbility(id);
      };
    });
    panel.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.onclick = () => {
        const input = document.getElementById("amal-powers-amount");
        if (input) input.value = btn.getAttribute("data-preset");
      };
    });
    panel.querySelectorAll("[data-give]").forEach((btn) => {
      btn.onclick = () => giveAmount(btn.getAttribute("data-give"));
    });

    let quick = document.getElementById("amal-powers-quick");
    if (!quick) {
      quick = document.createElement("div");
      quick.id = "amal-powers-quick";
      document.body.appendChild(quick);
    }
    quick.innerHTML = (pack.quick || [])
      .map((q) => `<button type="button" data-aq="${q.id}">${q.label}</button>`)
      .join("");
    quick.querySelectorAll("[data-aq]").forEach((btn) => {
      btn.onclick = () => runAbility(btn.getAttribute("data-aq"));
    });

    syncUi();
  }

  function boot() {
    try {
      if (new URLSearchParams(location.search).get("owner")) unlockAll();
    } catch (_) {}
    if (isOwner()) {
      global.__AMAL_GOD__ = true;
      global.__AMAL_DMG__ = true;
      global.__AMAL_SPEED__ = true;
      applyBoosts();
      const go = () => ensureUi();
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
      else go();
    }
    global.addEventListener("amal-owner-changed", (e) => {
      if (e.detail) {
        unlockAll();
        ensureUi();
      }
    });
  }

  global.AmalPowers = {
    isOwner,
    unlockAll,
    applyBoosts,
    gameId,
    god: () => !!(global.__AMAL_GOD__ || (isOwner() && flags.god)),
    runAbility,
    giveAmount,
    packFor,
    flags,
  };
  boot();
})(typeof window !== "undefined" ? window : globalThis);
