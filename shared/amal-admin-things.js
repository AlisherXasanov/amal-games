/**
 * Эксклюзивные ВЕЩИ админ-команды (не кнопки команд) — уникальный лут на каждую игру.
 */
(function (global) {
  "use strict";

  const STORAGE = "amal-admin-things-v1";

  /** @type {Record<string, Array<{id:string,label:string,emoji:string}>>} */
  const LOOT = {
    blockbust: [
      { id: "bb-prism", label: "Призма хозяина", emoji: "💠" },
      { id: "bb-goldrow", label: "Золотой ряд", emoji: "🟨" },
      { id: "bb-starcube", label: "Звёздный куб", emoji: "⭐" },
    ],
    "kick-buddy": [
      { id: "kb-boot", label: "Бутс Amal", emoji: "🥾" },
      { id: "kb-flag", label: "Флаг Минска", emoji: "🇧🇾" },
      { id: "kb-glove", label: "Перчатка удара", emoji: "🥊" },
    ],
    hideout: [
      { id: "ho-cloak", label: "Плащ невидимости", emoji: "🧥" },
      { id: "ho-radar", label: "Радар искателя", emoji: "📡" },
      { id: "ho-mask", label: "Маска укрытия", emoji: "🎭" },
    ],
    minecraft: [
      { id: "mc-pick", label: "Кирка Amal", emoji: "⛏" },
      { id: "mc-elytra", label: "Элитры хозяина", emoji: "🪽" },
      { id: "mc-nether", label: "Адский маяк", emoji: "🔥" },
    ],
    "coin-arsenal": [
      { id: "ca-clip", label: "Золотой магазин", emoji: "🪙" },
      { id: "ca-scope", label: "Прицел волны", emoji: "🎯" },
      { id: "ca-vest", label: "Жилет арсенала", emoji: "🦺" },
    ],
    "x-buggy": [
      { id: "xb-wheel", label: "Неоновые диски", emoji: "💿" },
      { id: "xb-nitro", label: "Нитро Amal", emoji: "⛽" },
      { id: "xb-plate", label: "Номер «AMAL»", emoji: "🪪" },
    ],
    "melon-playground": [
      { id: "mp-slice", label: "Корона из дыни", emoji: "🍉" },
      { id: "mp-hammer", label: "Молот кранча", emoji: "🔨" },
      { id: "mp-seed", label: "Золотое семечко", emoji: "🌱" },
    ],
    "space-courier": [
      { id: "sc-fuel", label: "Канистра ∞", emoji: "🧪" },
      { id: "sc-suit", label: "Скафандр курьера", emoji: "🧑‍🚀" },
      { id: "sc-comet", label: "Хвост кометы", emoji: "☄" },
    ],
    "bravol-stars": [
      { id: "bs-badge", label: "Значок звезды", emoji: "🌟" },
      { id: "bs-gaunt", label: "Перчатка браво", emoji: "✊" },
      { id: "bs-cape", label: "Плащ файтера", emoji: "🦸" },
    ],
    "snake-game": [
      { id: "sg-skin", label: "Змея Amal", emoji: "🐍" },
      { id: "sg-apple", label: "Золотое яблоко", emoji: "🍎" },
      { id: "sg-shield", label: "Щит чешуи", emoji: "🛡" },
    ],
    "ladder-climb": [
      { id: "lc-step", label: "Золотая ступень", emoji: "🪜" },
      { id: "lc-boots", label: "Ботинки альпиниста", emoji: "👟" },
      { id: "lc-flag", label: "Флаг вершины", emoji: "🏔" },
    ],
    terraverse: [
      { id: "tv-shovel", label: "Лопата творца", emoji: "🗺" },
      { id: "tv-pixel", label: "Пиксель-корона", emoji: "👑" },
      { id: "tv-biome", label: "Биом Amal", emoji: "🌿" },
    ],
    "zombie-vs-plants": [
      { id: "zvp-sunhat", label: "Шляпа солнца", emoji: "☀️" },
      { id: "zvp-seedbag", label: "Мешок семян", emoji: "🌱" },
      { id: "zvp-brain", label: "Антимозг", emoji: "🧠" },
    ],
    "zombie-vs-plants-2": [
      { id: "zvp2-hybrid", label: "Гибрид Amal", emoji: "🧬" },
      { id: "zvp2-syringe", label: "Сыворотка спасения", emoji: "💉" },
      { id: "zvp2-nut", label: "Орех-легенда", emoji: "🥜" },
    ],
    "globe-battle": [
      { id: "gb-orb", label: "Орб арены", emoji: "🌍" },
      { id: "gb-card", label: "Карта смерти Amal", emoji: "🃏" },
      { id: "gb-belt", label: "Пояс чемпиона", emoji: "🥋" },
    ],
    "animal-hospital": [
      { id: "ah-steth", label: "Стетоскоп Amal", emoji: "🩺" },
      { id: "ah-badge", label: "Бейдж главврача", emoji: "🏷" },
      { id: "ah-paw", label: "Золотая лапка", emoji: "🐾" },
    ],
    "ghost-lesson": [
      { id: "gl-chalk", label: "Мел призрака", emoji: "👻" },
      { id: "gl-bell", label: "Звонок без урока", emoji: "🔔" },
      { id: "gl-note", label: "Тетрадь эха", emoji: "📓" },
    ],
    "lift-void": [
      { id: "lv-btn", label: "Кнопка без цифр", emoji: "🛗" },
      { id: "lv-key", label: "Ключ шахты", emoji: "🔑" },
      { id: "lv-mirror", label: "Зеркало лифта", emoji: "🪞" },
    ],
    "roof-house": [
      { id: "rh-tile", label: "Черепица Amal", emoji: "🏠" },
      { id: "rh-lantern", label: "Фонарь крыши", emoji: "🏮" },
      { id: "rh-key", label: "Ключ от всех этажей", emoji: "🗝" },
    ],
    "echo-postman": [
      { id: "ep-bag", label: "Сумка эха", emoji: "📨" },
      { id: "ep-stamp", label: "Марка Amal", emoji: "📮" },
      { id: "ep-whistle", label: "Свисток почтальона", emoji: "🎐" },
    ],
    "night-stitch": [
      { id: "ns-needle", label: "Игла сна", emoji: "🪡" },
      { id: "ns-thread", label: "Золотая нить", emoji: "🧵" },
      { id: "ns-moon", label: "Лунная катушка", emoji: "🌙" },
    ],
    "create-lab": [
      { id: "cl-gear", label: "Шестерня Amal", emoji: "⚙" },
      { id: "cl-flask", label: "Колба творения", emoji: "⚗" },
      { id: "cl-blueprint", label: "Чертёж хозяина", emoji: "📐" },
    ],
    "old-pc": [
      { id: "op-crt", label: "ЭЛТ Amal", emoji: "🖥" },
      { id: "op-disk", label: "Дискета 👑", emoji: "💾" },
      { id: "op-cursor", label: "Курсор хозяина", emoji: "🖱" },
    ],
    obby: [
      { id: "ob-cape", label: "Плащ паркура", emoji: "🪂" },
      { id: "ob-checkpoint", label: "Чекпоинт Amal", emoji: "🚩" },
      { id: "ob-trail", label: "След скорости", emoji: "✨" },
    ],
    "tower-defense": [
      { id: "td-turret", label: "Турель Amal", emoji: "🏰" },
      { id: "td-blueprint", label: "Чертёж башни", emoji: "📜" },
      { id: "td-medal", label: "Медаль волны", emoji: "🏅" },
    ],
    tycoon: [
      { id: "ty-crown", label: "Корона Amal", emoji: "👑" },
      { id: "ty-neon", label: "Неон AMAL", emoji: "💡" },
      { id: "ty-vault", label: "Золотой сейф", emoji: "🔐" },
    ],
    "murder-mystery": [
      { id: "mm-badge", label: "Значок шерифа Amal", emoji: "⭐" },
      { id: "mm-knife", label: "Кинжал тайны", emoji: "🗡" },
      { id: "mm-hat", label: "Шляпа детектива", emoji: "🎩" },
    ],
    "pet-simulator": [
      { id: "ps-egg", label: "Яйцо Amal", emoji: "🥚" },
      { id: "ps-collar", label: "Ошейник легенды", emoji: "🦴" },
      { id: "ps-aura", label: "Аура питомца", emoji: "🌈" },
    ],
    "flee-facility": [
      { id: "ff-chip", label: "Чип взлома", emoji: "💻" },
      { id: "ff-keycard", label: "Ключ-карта Amal", emoji: "💳" },
      { id: "ff-cloak", label: "Плащ побега", emoji: "🏃" },
    ],
    "build-boat": [
      { id: "bb-sail", label: "Парус Amal", emoji: "⛵" },
      { id: "bb-block", label: "Золотой блок", emoji: "🧱" },
      { id: "bb-anchor", label: "Якорь хозяина", emoji: "⚓" },
    ],
  };

  function gameId() {
    try {
      if (global.AmalPowers && typeof AmalPowers.gameId === "function") return AmalPowers.gameId();
    } catch (_) {}
    try {
      if (global.AmalHub && typeof AmalHub.gameId === "function") return AmalHub.gameId();
    } catch (_) {}
    const parts = location.pathname.replace(/\\/g, "/").split("/").filter(Boolean);
    const cleaned = parts.filter((p) => !/\.(html?|js|css)$/i.test(p));
    const idx = cleaned.indexOf("amal-games");
    if (idx >= 0) return cleaned[idx + 1] || "portal";
    return cleaned[cleaned.length - 1] || "portal";
  }

  function isAdmin() {
    try {
      if (global.__AMAL_OWNER__ === true || global.__AMAL_GOD__ === true) return true;
    } catch (_) {}
    try {
      if (global.AmalPowers && typeof AmalPowers.isOwner === "function" && AmalPowers.isOwner()) return true;
    } catch (_) {}
    try {
      if (global.AmalHub && typeof AmalHub.isGameAdmin === "function" && AmalHub.isGameAdmin(gameId())) {
        return true;
      }
    } catch (_) {}
    return false;
  }

  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch (_) {
      return {};
    }
  }

  function writeStore(data) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data || {}));
    } catch (_) {}
  }

  function lootFor(id) {
    const gid = id || gameId();
    return (LOOT[gid] || []).slice();
  }

  function owned(itemId, id) {
    const gid = id || gameId();
    const store = readStore();
    const bag = store[gid];
    if (!bag || typeof bag !== "object") return false;
    return !!bag[itemId];
  }

  function toast(text) {
    let el = document.getElementById("amal-powers-toast");
    if (!el) {
      el = document.getElementById("amal-admin-things-toast");
    }
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-admin-things-toast";
      el.style.cssText =
        "position:fixed;left:50%;bottom:28%;transform:translateX(-50%) translateY(8px);z-index:13050;" +
        "padding:10px 16px;border-radius:12px;background:rgba(20,14,6,.92);color:#fde68a;" +
        "font:800 13px/1.2 system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;" +
        "border:1px solid rgba(251,191,36,.45);box-shadow:0 10px 30px rgba(0,0,0,.35)";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.classList.remove("show");
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(8px)";
    }, 1700);
  }

  function ensureStyles() {
    if (document.getElementById("amal-admin-things-css")) return;
    const css = document.createElement("style");
    css.id = "amal-admin-things-css";
    css.textContent =
      "#amal-admin-things{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:10950;" +
      "display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;max-width:96vw;" +
      "padding:10px 12px;border-radius:14px;background:linear-gradient(160deg,rgba(120,53,15,.92),rgba(69,26,3,.94));" +
      "border:1px solid rgba(251,191,36,.55);box-shadow:0 12px 36px rgba(0,0,0,.35);font-family:system-ui,sans-serif}" +
      "#amal-admin-things .aat-label{width:100%;text-align:center;color:#fde68a;font:800 11px/1.2 system-ui,sans-serif;margin:0 0 2px}" +
      "#amal-admin-things button{padding:8px 12px;border:none;border-radius:8px;font-size:12px;cursor:pointer;color:#111;" +
      "background:linear-gradient(135deg,#fde68a,#f59e0b);font-weight:800}" +
      "#amal-admin-things button.owned{background:linear-gradient(135deg,#86efac,#22c55e)}" +
      "#amal-admin-things button:disabled{opacity:.55;cursor:default}" +
      "#amal-admin-stickers{position:fixed;left:10px;top:28%;z-index:10940;display:flex;flex-direction:column;gap:8px;pointer-events:none}" +
      "#amal-admin-stickers .aat-chip{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;" +
      "background:rgba(120,53,15,.88);border:1px solid rgba(251,191,36,.5);color:#fef3c7;font:800 12px/1 system-ui,sans-serif;" +
      "box-shadow:0 6px 18px rgba(0,0,0,.28);animation:aatFloat 3.2s ease-in-out infinite}" +
      "#amal-admin-stickers .aat-chip span{font-size:16px}" +
      "@keyframes aatFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}";
    document.head.appendChild(css);
  }

  function ensureStickerRack() {
    let rack = document.getElementById("amal-admin-stickers");
    if (!rack) {
      rack = document.createElement("div");
      rack.id = "amal-admin-stickers";
      document.body.appendChild(rack);
    }
    return rack;
  }

  function addSticker(item) {
    if (!item) return;
    ensureStyles();
    const rack = ensureStickerRack();
    const sid = "aat-sticker-" + (item.id || "x");
    if (document.getElementById(sid)) return;
    const chip = document.createElement("div");
    chip.className = "aat-chip";
    chip.id = sid;
    chip.innerHTML = "<span>" + (item.emoji || "✨") + "</span>" + (item.label || item.id);
    rack.appendChild(chip);
  }

  function restoreStickers(gid) {
    const items = lootFor(gid);
    items.forEach((it) => {
      if (owned(it.id, gid)) addSticker(it);
    });
  }

  function claim(itemId) {
    if (!isAdmin()) return false;
    const gid = gameId();
    const items = lootFor(gid);
    const item = items.find((x) => x.id === itemId);
    if (!item) return false;
    const store = readStore();
    if (!store[gid] || typeof store[gid] !== "object") store[gid] = {};
    store[gid][itemId] = true;
    writeStore(store);
    toast("✓ " + item.emoji + " " + item.label);
    try {
      global.dispatchEvent(
        new CustomEvent("amal-admin-thing", {
          detail: { game: gid, id: item.id, label: item.label },
        })
      );
    } catch (_) {}
    addSticker(item);
    syncBar();
    return true;
  }

  function syncBar() {
    const bar = document.getElementById("amal-admin-things");
    if (!bar) return;
    const gid = gameId();
    bar.querySelectorAll("[data-aat]").forEach((btn) => {
      const id = btn.getAttribute("data-aat");
      const has = owned(id, gid);
      btn.classList.toggle("owned", has);
      if (has) {
        btn.disabled = true;
        if (!btn.textContent.includes("✓")) btn.textContent = "✓ " + btn.textContent.replace(/^✓\s*/, "");
      }
    });
  }

  function ensureUi() {
    if (!isAdmin()) {
      const existing = document.getElementById("amal-admin-things");
      if (existing) existing.remove();
      return;
    }
    const gid = gameId();
    if (gid === "portal") return;
    // Не дублируем бар, если игра уже имеет свой admin-shop (напр. tycoon)
    if (document.getElementById("admin-shop")) {
      restoreStickers(gid);
      return;
    }
    const loot = lootFor(gid);
    if (!loot.length) return;

    // Один «посох»: вещи только в кубе, нижнюю полоску не рисуем.
    const leftover = document.getElementById("amal-admin-things");
    if (leftover) leftover.remove();
    restoreStickers(gid);
    return;

    ensureStyles();
    let bar = document.getElementById("amal-admin-things");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "amal-admin-things";
      document.body.appendChild(bar);
    }
    bar.innerHTML =
      '<div class="aat-label">👑 Эксклюзив админа · вещи</div>' +
      loot
        .map((it) => {
          const has = owned(it.id, gid);
          return (
            '<button type="button" data-aat="' +
            it.id +
            '"' +
            (has ? ' class="owned" disabled' : "") +
            ">" +
            (has ? "✓ " : "") +
            it.emoji +
            " " +
            it.label +
            "</button>"
          );
        })
        .join("");
    bar.querySelectorAll("[data-aat]").forEach((btn) => {
      btn.onclick = () => claim(btn.getAttribute("data-aat"));
    });
    restoreStickers(gid);
  }

  function boot() {
    const go = () => ensureUi();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
    else go();
    global.addEventListener("amal-owner-changed", go);
    global.addEventListener("amal-powers-applied", go);
    // Hub грузится после — повторно показать вещи админ-команде
    setTimeout(go, 400);
    setTimeout(go, 1200);
  }

  global.AmalAdminThings = {
    isAdmin,
    claim,
    owned,
    lootFor,
  };

  boot();
})(typeof window !== "undefined" ? window : globalThis);
