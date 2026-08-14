/**
 * Amal Hub — общий ник, заметки и админ-инбокс для всех игр Amal's Games.
 * Один origin (GitHub Pages) → один localStorage на все игры.
 */
(function (global) {
  "use strict";

  const KEYS = {
    nick: "amal-hub-nick-v1",
    notes: "amal-hub-notes-v1",
    presence: "amal-hub-presence-v1",
    adminNotes: "amal-hub-admin-notes-v1",
    changelogSeen: "amal-hub-changelog-seen-v1",
    issuedGrants: "amal-hub-issued-grants-v1",
    myPowers: "amal-hub-my-powers-v1",
    revokedGrants: "amal-hub-revoked-grants-v1",
    registry: "amal-hub-registry-v1",
    abuse: "amal-hub-abuse-v1",
    pendingGifts: "amal-hub-pending-gifts-v1",
    faceSeeds: "amal-hub-face-seeds-v1",
    ownerGiftQueue: "amal-hub-owner-gift-queue-v1",
    lastGiftByNick: "amal-hub-last-gift-by-nick-v1",
    nickGuest: "amal-hub-nick-guest-v1",
  };

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const GRANT_SECRET = "AmalGrant2026";
  const MAX_NOTES = 200;
  const NICK_MIN = 2;
  const NICK_MAX = 16;

  const GRANTABLE_GAMES = [
    { id: "blockbust", name: "Blockbust" },
    { id: "kick-buddy", name: "Kick Buddy" },
    { id: "hideout", name: "Укрытие" },
    { id: "minecraft", name: "CraftWorld" },
    { id: "coin-arsenal", name: "Coin Arsenal" },
    { id: "x-buggy", name: "X-Buggy" },
    { id: "melon-playground", name: "Melon Playground" },
    { id: "space-courier", name: "Космический курьер" },
    { id: "bravol-stars", name: "Brawl Stars" },
    { id: "snake-game", name: "Snake" },
    { id: "ladder-climb", name: "Ступеньки вверх" },
    { id: "terraverse", name: "Пиксель-Террариум" },
    { id: "zombie-vs-plants", name: "Зомби vs растения" },
    { id: "zombie-vs-plants-2", name: "Зомби vs растения 2" },
    { id: "globe-battle", name: "Globe Battle" },
    { id: "animal-hospital", name: "Animal Hospital" },
    { id: "ghost-lesson", name: "Несуществующий урок" },
    { id: "lift-void", name: "Лифт без цифр" },
    { id: "roof-house", name: "Дом под крышей" },
    { id: "echo-postman", name: "Эхо-почтальон" },
    { id: "night-stitch", name: "Нить сна" },
    { id: "create-lab", name: "Create Lab" },
    { id: "old-pc", name: "Старый компьютер" },
    { id: "obby", name: "Obby" },
    { id: "tower-defense", name: "Tower Defense" },
    { id: "tycoon", name: "Pizza Tycoon" },
    { id: "murder-mystery", name: "Murder Mystery" },
    { id: "pet-simulator", name: "Pet Simulator" },
    { id: "flee-facility", name: "Flee the Facility" },
    { id: "build-boat", name: "Build a Boat" },
  ];

  const CHANGELOG = [
    {
      id: "2026-08-12-owner-wave",
      title: "Сюрпризы хозяина · волна по играм",
      body: "Больше сюрпризов для хозяина и команды. Обновление отмечается во многих играх хаба — зайди в игру и увидишь приветствие.",
    },
    {
      id: "2026-08-12-utf8-team-pack",
      title: "Русский текст · сюрпризы команды",
      body: "Починена кодировка меню больницы. Сюрпризы команды теперь не только в одной игре — сразу пак на несколько игр.",
    },
    {
      id: "2026-08-12-dm-fix",
      title: "Написать игроку — починка",
      body: "Личные сообщения реально доходят (не только сохраняются). Можно нажать «Себе (тест)» и сразу увидеть сообщение.",
    },
    {
      id: "2026-08-12-presence-fix",
      title: "Кто играет — починка",
      body: "Гость больше не скрывается из‑за ника хозяина. Подарки и админка доходят надёжнее. Есть кнопка теста гостя.",
    },
    {
      id: "2026-08-12-player-profile",
      title: "Профиль игрока у хозяина",
      body: "В «Кто играет» и на живой карте жми игрока: видно профиль, можно обновить лицо и выдать другой подарок.",
    },
    {
      id: "2026-08-11-no-black-admin-things",
      title: "Без чёрного экрана · эксклюзивы админам",
      body: "Опубликованы old-pc, lift-void, ghost-lesson, night-stitch, create-lab. Во всех играх у админ-команды свои уникальные вещи (не команды). В 3D-играх — свои предметы на карте.",
    },
    {
      id: "2026-08-11-admin-team-all",
      title: "Админ-команда · все игры сайта",
      body: "Выдача админки теперь покрывает Obby, Tycoon, Tower Defense, Murder Mystery, Pet Simulator, Flee и Build a Boat. В Pizza Tycoon у админов — свои эксклюзивные вещи в магазине (не команды).",
    },
    {
      id: "2026-08-11-old-pc",
      title: "Старый компьютер",
      body: "Рабочий стол Windows 95: игры, проигрыватель, сапёр, блокнот, рисовалка и чат с Амалем по-русски.",
    },
    {
      id: "2026-08-11-ghost-lesson",
      title: "Несуществующий урок",
      body: "Новая игра: ночная школа без расписания. Собери мел-ответы, отдай призракам-ученикам, успей до звонка-фантома.",
    },
    {
      id: "2026-08-10-owner-gifts",
      title: "Подарки от хозяина",
      body: "Только Амаль выдаёт подарок: сразу, одному игроку (по нику) и только в выбранной игре. На экране написано, что именно ты получил.",
    },
    {
      id: "2026-08-10-admin-abuse",
      title: "Admin Abuse во всех играх",
      body: "Хозяин запускает Abuse — радуга на весь экран, большой смотрит на поле, справа человечек: «Забрать всё».",
    },
    {
      id: "2026-08-10-register-all",
      title: "Одна регистрация — все игры",
      body: "Сохранил ник в одной игре — ты уже во всех. Хозяину приходит сообщение: кто, когда и из какой игры.",
    },
    {
      id: "2026-08-08-hospital",
      title: "Animal Hospital",
      body: "Новая 2D ветклиника: пациенты, лечение инструментами, улучшения и смена на время.",
    },
    {
      id: "2026-08-07-grants",
      title: "Админка по играм",
      body: "Амаль может выдать админку выбранному нику в одной или нескольких играх и потом отменить.",
    },
    {
      id: "2026-08-07-hub",
      title: "Ник и заметки во всех играх",
      body: "Перед игрой пишешь ник. Можно отправить заметку Амалю. Админ видит, кто во что играет.",
    },
    {
      id: "2026-08-07-blockbust",
      title: "Blockbust: аниме-скины и Кинозал",
      body: "Новые аниме-кубики, админ-фон «Кинозал», удобнее тянуть фигуры на телефоне.",
    },
    {
      id: "2026-08-07-catalog",
      title: "Каталог обновлён",
      body: "Счётчик игр на главной и метки «Новое / Обновлено».",
    },
  ];

  function storeGet(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  function storeSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }

  function isGuestMode() {
    try {
      if (global.__AMAL_GUEST__ === true) return true;
      const g = new URLSearchParams(location.search).get("guest");
      if (g === "1" || g === "true" || g === "yes") {
        global.__AMAL_GUEST__ = true;
        global.__AMAL_OWNER__ = false;
        global.__AMAL_GOD__ = false;
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function isOwner() {
    if (isGuestMode()) return false;
    if (global.__AMAL_OWNER__ === true) return true;
    try {
      if (global.AmalOwner && typeof global.AmalOwner.isOwner === "function" && global.AmalOwner.isOwner()) {
        return true;
      }
    } catch {
      /* ignore */
    }
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("owner") === "AmalOwner2026") {
        localStorage.setItem("amal-owner-v1", "1");
        global.__AMAL_OWNER__ = true;
        return true;
      }
    } catch {
      /* ignore */
    }
    try {
      return OWNER_KEYS.some((k) => localStorage.getItem(k) === "1");
    } catch {
      return false;
    }
  }

  function loadFaceSeeds() {
    const map = storeGet(KEYS.faceSeeds, {});
    return map && typeof map === "object" ? map : {};
  }

  function saveFaceSeeds(map) {
    storeSet(KEYS.faceSeeds, map);
  }

  function faceSeedFor(nick) {
    const key = String(nick || "player").trim().slice(0, NICK_MAX);
    const map = loadFaceSeeds();
    return map[key] || key || "player";
  }

  function faceUrl(nick, bust) {
    const seed = encodeURIComponent(String(faceSeedFor(nick)).slice(0, 48));
    let url = "https://api.dicebear.com/7.x/adventurer/svg?seed=" + seed + "&size=128";
    if (bust) url += "&t=" + encodeURIComponent(String(bust));
    return url;
  }

  function applyFaceSeed(nick, seed) {
    const key = String(nick || "").trim().slice(0, NICK_MAX);
    if (key.length < NICK_MIN) return;
    const map = loadFaceSeeds();
    map[key] = String(seed || key).slice(0, 48);
    saveFaceSeeds(map);
  }

  function refreshPlayerProfile(nick) {
    if (!isOwner()) return { ok: false, error: "Только хозяин" };
    const key = String(nick || "").trim().slice(0, NICK_MAX);
    if (key.length < NICK_MIN) return { ok: false, error: "Нет ника" };
    const seed = key + "-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
    applyFaceSeed(key, seed);
    const payload = { type: "face-refresh", nick: key, seed, at: Date.now() };
    hostConnections.forEach((conn) => {
      try {
        if (conn.open) conn.send(payload);
      } catch {
        /* ignore */
      }
    });
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
    showHubToast("🔄 Профиль обновлён: " + key);
    return { ok: true, seed, nick: key };
  }

  function findPlayerByNick(nick) {
    const key = String(nick || "").trim().toLowerCase();
    if (!key) return null;
    return (
      recentPlayers(1000 * 60 * 60 * 24).find((p) => String(p.nick || "").toLowerCase() === key) ||
      Object.values(livePlayers).find((p) => String(p.nick || "").toLowerCase() === key) ||
      null
    );
  }

  function loadOwnerGiftQueue() {
    const list = storeGet(KEYS.ownerGiftQueue, []);
    return Array.isArray(list) ? list : [];
  }

  function saveOwnerGiftQueue(list) {
    storeSet(KEYS.ownerGiftQueue, list.slice(0, 60));
  }

  function queueOwnerGift(payload) {
    if (!payload || !payload.toNick) return;
    const list = loadOwnerGiftQueue().filter(
      (g) => !(g && g.toNick === payload.toNick && g.game === payload.game && g.at === payload.at)
    );
    list.unshift(payload);
    saveOwnerGiftQueue(list);
  }

  function deliverQueuedGiftsForNick(nick) {
    if (!isOwner() || !nick) return;
    const want = String(nick).toLowerCase();
    const list = loadOwnerGiftQueue();
    const keep = [];
    list.forEach((g) => {
      if (!g || String(g.toNick || "").toLowerCase() !== want) {
        keep.push(g);
        return;
      }
      let sent = 0;
      hostConnections.forEach((conn) => {
        try {
          if (conn.open) {
            conn.send(g);
            sent += 1;
          }
        } catch {
          /* ignore */
        }
      });
      try {
        if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(g);
      } catch {
        /* ignore */
      }
      // оставляем в очереди коротко, если никто не подключён
      if (!sent && Date.now() - (g.at || 0) < 1000 * 60 * 60 * 6) keep.push(g);
    });
    saveOwnerGiftQueue(keep);
  }

  function lastGiftIdFor(nick) {
    const map = storeGet(KEYS.lastGiftByNick, {}) || {};
    return map[String(nick || "").toLowerCase()] || "";
  }

  function rememberLastGift(nick, giftId) {
    const map = storeGet(KEYS.lastGiftByNick, {}) || {};
    map[String(nick || "").toLowerCase()] = giftId;
    storeSet(KEYS.lastGiftByNick, map);
  }

  function canGrantAdmin() {
    return isOwner();
  }

  function simpleHash(str) {
    let h = 5381;
    const s = String(str);
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
    return (h >>> 0).toString(36);
  }

  function loadIssuedGrants() {
    const list = storeGet(KEYS.issuedGrants, []);
    return Array.isArray(list) ? list : [];
  }

  function saveIssuedGrants(list) {
    storeSet(KEYS.issuedGrants, list.slice(-100));
  }

  function loadRevoked() {
    const list = storeGet(KEYS.revokedGrants, []);
    return Array.isArray(list) ? list : [];
  }

  function isGrantRevoked(id) {
    return loadRevoked().includes(id);
  }

  function loadMyPowers() {
    const map = storeGet(KEYS.myPowers, {});
    return map && typeof map === "object" ? map : {};
  }

  function saveMyPowers(map) {
    storeSet(KEYS.myPowers, map);
  }

  function pruneMyPowers() {
    const map = loadMyPowers();
    let changed = false;
    Object.keys(map).forEach((game) => {
      const g = map[game];
      if (!g) return;
      if (g.exp && g.exp < Date.now()) {
        delete map[game];
        changed = true;
        return;
      }
      if (g.id && isGrantRevoked(g.id)) {
        delete map[game];
        changed = true;
      }
    });
    if (changed) saveMyPowers(map);
    return map;
  }

  function isLuckyAdmin() {
    if (isGuestMode() || isOwner()) return false;
    try {
      return localStorage.getItem("amal-lucky-admin-v1") === "1";
    } catch {
      return false;
    }
  }

  function grantLuckyAdmin() {
    if (isGuestMode()) return { ok: false, error: "Гость" };
    if (isOwner()) return { ok: true, already: true, owner: true };
    if (isLuckyAdmin()) return { ok: true, already: true };
    try {
      localStorage.setItem("amal-lucky-admin-v1", "1");
    } catch {
      return { ok: false, error: "storage" };
    }
    try {
      const map = pruneMyPowers();
      GRANTABLE_GAMES.forEach((g) => {
        map[g.id] = { on: true, lucky: true, at: Date.now() };
      });
      saveMyPowers(map);
    } catch {
      /* ignore */
    }
    try {
      global.dispatchEvent(new CustomEvent("amal-lucky-admin", { detail: { at: Date.now() } }));
    } catch {
      /* ignore */
    }
    try {
      if (global.AmalPowers && typeof AmalPowers.applyBoosts === "function") AmalPowers.applyBoosts();
    } catch {
      /* ignore */
    }
    showHubToast("👑 Админка удачи (5%) · во всех играх · без выдачи другим");
    return { ok: true, granted: true };
  }

  /** Шанс по умолчанию 5% (не 10%). */
  function tryRollLuckyAdmin(chance) {
    const rate = chance == null ? 0.05 : Number(chance);
    if (isGuestMode() || isOwner()) return { ok: false, rolled: false };
    if (isLuckyAdmin()) return { ok: true, already: true, rolled: false };
    if (!(rate > 0) || Math.random() >= rate) return { ok: false, rolled: true, won: false };
    const res = grantLuckyAdmin();
    return Object.assign({ rolled: true, won: !!res.granted }, res);
  }

  function isGameAdmin(gameId) {
    const id = gameId || gameIdFromPath();
    if (isOwner()) return true;
    if (isLuckyAdmin()) return true;
    const map = pruneMyPowers();
    return !!(map[id] && map[id].on);
  }

  function canGiveToPlayers() {
    return isOwner();
  }

  function myAdminGames() {
    const map = pruneMyPowers();
    return Object.keys(map).filter((k) => map[k] && map[k].on);
  }

  function encodeGrantPayload(obj) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    } catch {
      return "";
    }
  }

  function decodeGrantPayload(raw) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(raw))));
    } catch {
      try {
        return JSON.parse(atob(raw));
      } catch {
        return null;
      }
    }
  }

  function signGrant(raw) {
    return simpleHash(raw + "|" + GRANT_SECRET);
  }

  function issueGrants(nickRaw, gameIds) {
    if (!canGrantAdmin()) return { ok: false, error: "Только главный админ может выдавать" };
    const nick = String(nickRaw || "").trim();
    if (nick.length < NICK_MIN) return { ok: false, error: "Укажи ник игрока" };
    const games = (gameIds || []).filter((id) => GRANTABLE_GAMES.some((g) => g.id === id));
    if (!games.length) return { ok: false, error: "Выбери хотя бы одну игру" };

    const issued = loadIssuedGrants();
    const links = [];
    const now = Date.now();
    const exp = now + 1000 * 60 * 60 * 24 * 30;

    games.forEach((game) => {
      const id = "g-" + now + "-" + game + "-" + Math.random().toString(36).slice(2, 6);
      const payload = { v: 1, id, nick: nick.toLowerCase(), game, exp };
      const raw = encodeGrantPayload(payload);
      const sig = signGrant(raw);
      const pathBase = location.href.split("?")[0].replace(/\/[^/]*$/, "/");
      // Prefer game folder link when granting for a game
      const origin = location.origin;
      let baseUrl = origin + location.pathname;
      try {
        const parts = location.pathname.split("/").filter(Boolean);
        const ag = parts.indexOf("amal-games");
        if (ag >= 0) {
          baseUrl = origin + "/" + parts.slice(0, ag + 1).join("/") + "/" + game + "/";
        } else if (parts[0] === "games") {
          baseUrl = origin + "/games/" + game + "/";
        } else {
          baseUrl = origin + "/" + game + "/";
        }
      } catch {
        /* keep */
      }
      const link =
        baseUrl +
        "?nick=" +
        encodeURIComponent(nick) +
        "&grant=" +
        encodeURIComponent(raw) +
        "&gsig=" +
        encodeURIComponent(sig);
      issued.push({
        id,
        nick,
        game,
        at: now,
        exp,
        active: true,
        link,
      });
      links.push({ id, game, name: gameTitle(game), link });

      // If the nick is already on this device, apply immediately
      if (getNick().toLowerCase() === nick.toLowerCase()) {
        applyPower(game, id, exp);
      }
    });

    saveIssuedGrants(issued);
    return { ok: true, nick, links };
  }

  function applyPower(game, id, exp) {
    const map = loadMyPowers();
    map[game] = { on: true, id, exp: exp || null, at: Date.now() };
    saveMyPowers(map);
  }

  function redeemGrantFromUrl() {
    try {
      const params = new URLSearchParams(location.search);
      const raw = params.get("grant");
      const sig = params.get("gsig");
      const revokeId = params.get("revokegrant");
      const rsig = params.get("rsig");

      if (revokeId && rsig) {
        if (signGrant(revokeId) === rsig) {
          const revoked = loadRevoked();
          if (!revoked.includes(revokeId)) {
            revoked.push(revokeId);
            storeSet(KEYS.revokedGrants, revoked);
          }
          const map = loadMyPowers();
          Object.keys(map).forEach((game) => {
            if (map[game] && map[game].id === revokeId) delete map[game];
          });
          saveMyPowers(map);
          return { ok: true, kind: "revoke", message: "Админка в этой выдаче снята" };
        }
        return { ok: false, kind: "revoke", message: "Код отмены неверный" };
      }

      if (!raw || !sig) return null;
      if (signGrant(raw) !== sig) return { ok: false, message: "Ссылка на админку повреждена" };
      const payload = decodeGrantPayload(raw);
      if (!payload || !payload.nick || !payload.game || !payload.id) {
        return { ok: false, message: "Ссылка на админку неверная" };
      }
      if (payload.exp && payload.exp < Date.now()) {
        return { ok: false, message: "Срок ссылки истёк — попроси новую" };
      }
      if (isGrantRevoked(payload.id)) {
        return { ok: false, message: "Эту админку уже отменили" };
      }
      // Ссылка для друга: если ты хозяин без guest — не забирай чужую админку себе
      if (isOwner() && !isGuestMode()) {
        return {
          ok: false,
          message: "Это ссылка для игрока «" + payload.nick + "». Открой её в режиме гостя или на другом устройстве.",
        };
      }
      const want = String(payload.nick || "").trim();
      const urlNick = (params.get("nick") || want).trim();
      if (urlNick) setNick(urlNick);
      applyPower(payload.game, payload.id, payload.exp);
      bumpPresence();
      flushPendingGifts();
      return {
        ok: true,
        message: "Админка включена в игре: " + gameTitle(payload.game) + " · ник «" + getNick() + "»",
        game: payload.game,
      };
    } catch {
      return { ok: false, message: "Не удалось применить ссылку" };
    }
  }

  function revokeGrant(id) {
    if (!canGrantAdmin()) return { ok: false, error: "Нельзя" };
    const revoked = loadRevoked();
    if (!revoked.includes(id)) {
      revoked.push(id);
      storeSet(KEYS.revokedGrants, revoked);
    }
    const issued = loadIssuedGrants().map((g) => (g.id === id ? { ...g, active: false } : g));
    saveIssuedGrants(issued);
    // clear on this device too
    const map = loadMyPowers();
    Object.keys(map).forEach((game) => {
      if (map[game] && map[game].id === id) delete map[game];
    });
    saveMyPowers(map);
    const grant = issued.find((g) => g.id === id);
    let revokeLink = "";
    if (grant) {
      try {
        const origin = location.origin;
        const parts = location.pathname.split("/").filter(Boolean);
        const ag = parts.indexOf("amal-games");
        let baseUrl = origin + "/";
        if (ag >= 0) baseUrl = origin + "/" + parts.slice(0, ag + 1).join("/") + "/" + grant.game + "/";
        revokeLink =
          baseUrl +
          "?revokegrant=" +
          encodeURIComponent(id) +
          "&rsig=" +
          encodeURIComponent(signGrant(id));
      } catch {
        /* ignore */
      }
    }
    return { ok: true, revokeLink, grant };
  }

  function activeIssuedGrants() {
    return loadIssuedGrants()
      .filter((g) => g.active !== false && !isGrantRevoked(g.id))
      .slice()
      .reverse();
  }

  function gameIdFromPath() {
    const parts = location.pathname.replace(/\\/g, "/").split("/").filter(Boolean);
    const cleaned = parts.filter((p) => !/\.(html?|js|css)$/i.test(p));
    const idx = cleaned.indexOf("amal-games");
    if (idx >= 0) return cleaned[idx + 1] || "portal";
    const g = cleaned.indexOf("games");
    if (g >= 0) return cleaned[g + 1] || "portal";
    if (cleaned.length === 0) return "portal";
    return cleaned[cleaned.length - 1] || "portal";
  }

  function gameTitle(id) {
    const map = {
      portal: "Каталог",
      blockbust: "Blockbust",
      hideout: "Укрытие",
      minecraft: "CraftWorld",
      "kick-buddy": "Kick Buddy",
      "zombie-vs-plants": "Зомби vs растения",
      "zombie-vs-plants-2": "Зомби vs растения 2",
      "coin-arsenal": "Coin Arsenal",
      "x-buggy": "X-Buggy",
      "melon-playground": "Melon Playground",
      "space-courier": "Космический курьер",
      "bravol-stars": "Brawl Stars",
      "snake-game": "Snake",
      "ladder-climb": "Ступеньки вверх",
      terraverse: "Пиксель-Террариум",
      "globe-battle": "Globe Battle",
      "animal-hospital": "Animal Hospital",
      "ghost-lesson": "Несуществующий урок",
      "lift-void": "Лифт без цифр",
      "roof-house": "Дом под крышей",
      "echo-postman": "Эхо-почтальон",
      "night-stitch": "Нить сна",
      "create-lab": "Create Lab",
    };
    return map[id] || id;
  }

  function formatRegDay(ts) {
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(ts));
    } catch (_) {
      return new Date(ts).toLocaleString("ru-RU");
    }
  }

  function loadRegistry() {
    const map = storeGet(KEYS.registry, {});
    return map && typeof map === "object" ? map : {};
  }

  function saveRegistry(map) {
    storeSet(KEYS.registry, map);
  }

  function listRegistry() {
    return Object.values(loadRegistry()).sort((a, b) => (b.firstAt || 0) - (a.firstAt || 0));
  }

  /**
   * Одна регистрация на весь портал.
   * isNew=true → первый раз; хозяин должен узнать.
   */
  function registerEverywhere(nickRaw, gameId) {
    const nick = String(nickRaw || "").trim().slice(0, NICK_MAX);
    if (nick.length < NICK_MIN) return { ok: false, isNew: false };
    const key = nick.toLowerCase();
    const game = gameId || gameIdFromPath();
    const map = loadRegistry();
    const prev = map[key];
    const now = Date.now();
    const isNew = !prev;
    const games = prev && Array.isArray(prev.games) ? prev.games.slice() : [];
    if (!games.includes(game)) games.push(game);
    const entry = {
      nick,
      firstAt: prev && prev.firstAt ? prev.firstAt : now,
      firstGame: prev && prev.firstGame ? prev.firstGame : game,
      lastAt: now,
      lastGame: game,
      games,
    };
    map[key] = entry;
    saveRegistry(map);
    return { ok: true, isNew, entry };
  }

  function notifyOwnerAboutRegistration(entry) {
    if (!entry || !entry.nick) return;
    const when = formatRegDay(entry.firstAt || Date.now());
    const fromGame = gameTitle(entry.firstGame || entry.lastGame || "portal");
    const text =
      "🆕 РЕГИСТРАЦИЯ ВО ВСЕХ ИГРАХ\n" +
      "Ник: " +
      entry.nick +
      "\nДень: " +
      when +
      "\nОткуда: " +
      fromGame +
      "\nТеперь этот человек есть во всём Amal Games.";
    // Локальный инбокс (если хозяин на этом же устройстве / синхрон через заметки)
    const list = loadNotes();
    list.push({
      id: "reg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      nick: entry.nick,
      game: entry.firstGame || entry.lastGame || gameIdFromPath(),
      text,
      at: entry.firstAt || Date.now(),
      fromAdmin: false,
      toNick: null,
      status: "new",
      kind: "registration",
    });
    saveNotes(list);
    showHubToast("🆕 Зарегистрировался: " + entry.nick + " · " + when);
  }

  function broadcastRegistration(entry) {
    if (!entry) return;
    const payload = {
      type: "register",
      nick: entry.nick,
      game: entry.firstGame || entry.lastGame || gameIdFromPath(),
      gameTitle: gameTitle(entry.firstGame || entry.lastGame || gameIdFromPath()),
      at: entry.firstAt || Date.now(),
      firstAt: entry.firstAt || Date.now(),
      live: true,
    };
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
    sendPresenceToHost(payload);
  }

  function getNick() {
    if (isGuestMode()) {
      const g = storeGet(KEYS.nickGuest, "");
      if (typeof g === "string" && g.trim()) return g.trim();
    }
    const n = storeGet(KEYS.nick, "");
    return typeof n === "string" ? n.trim() : "";
  }

  function ensureOwnerNick() {
    if (!isOwner()) return getNick();
    if (getNick()) return getNick();
    const res = setNick("Amal");
    return res.ok ? res.nick : "Amal";
  }

  function setNick(raw) {
    const nick = String(raw || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, NICK_MAX);
    if (nick.length < NICK_MIN) return { ok: false, error: "Минимум " + NICK_MIN + " символа" };
    if (/[<>]/.test(nick)) return { ok: false, error: "Без < >" };
    const prev = getNick();
    if (isGuestMode()) storeSet(KEYS.nickGuest, nick);
    else storeSet(KEYS.nick, nick);
    const reg = registerEverywhere(nick, gameIdFromPath());
    if (!isOwner()) bumpPresence();
    else removeSelfFromPresence();
    if (reg.isNew && !isOwner()) {
      broadcastRegistration(reg.entry);
    } else if (!reg.isNew && prev.toLowerCase() === nick.toLowerCase()) {
      bumpPresence();
    }
    flushPendingGifts();
    return { ok: true, nick, isNew: !!reg.isNew, registeredAt: reg.entry && reg.entry.firstAt };
  }

  function loadNotes() {
    const list = storeGet(KEYS.notes, []);
    return Array.isArray(list) ? list : [];
  }

  function saveNotes(list) {
    storeSet(KEYS.notes, list.slice(-MAX_NOTES));
  }

  function addNote(text, meta) {
    const body = String(text || "").trim().slice(0, 500);
    if (!body) return { ok: false, error: "Пустая заметка" };
    const nick = getNick() || "Без ника";
    const note = {
      id: "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      nick,
      game: meta && meta.game ? meta.game : gameIdFromPath(),
      text: body,
      at: Date.now(),
      fromAdmin: !!(meta && meta.fromAdmin),
      toNick: (meta && meta.toNick) || null,
      status: "new",
    };
    const list = loadNotes();
    list.push(note);
    saveNotes(list);
    if (!isOwner()) bumpPresence();
    return { ok: true, note };
  }

  function loadPresence() {
    const map = storeGet(KEYS.presence, {});
    return map && typeof map === "object" ? map : {};
  }

  // Игроки с других устройств (пока хозяин онлайн)
  const livePlayers = {};
  const hostConnections = new Set();
  let presencePeer = null;
  let presenceConn = null;
  let presenceReady = false;
  let presenceStatus = "off";
  let lastPlayersPaint = 0;
  let hubToast = "";
  let hubToastTimer = null;

  const PRESENCE_HOST_ID = "amalhub" + simpleHash(GRANT_SECRET + "|presence-host-v1");

  function upsertLivePlayer(data) {
    if (!data || !data.nick) return;
    // Хозяин сам себя в список не пишет; чужих с тем же ником — пишет
    if (
      isOwner() &&
      data.role !== "guest" &&
      !data.liveGuest &&
      String(data.nick).toLowerCase() === (getNick() || "").toLowerCase()
    ) {
      return;
    }
    const nick = String(data.nick).trim().slice(0, NICK_MAX);
    if (nick.length < NICK_MIN) return;
    livePlayers[nick] = {
      nick,
      game: data.game || "portal",
      gameTitle: gameTitle(data.game || "portal"),
      at: data.at || Date.now(),
      live: true,
      role: data.role || "guest",
    };
    // Дублируем в localStorage хозяина, чтобы список не пустел сразу
    if (isOwner()) {
      const map = loadPresence();
      map[nick] = { ...livePlayers[nick], live: true };
      storeSet(KEYS.presence, map);
    }
    maybeRepaintPlayers();
  }

  function showHubToast(text) {
    hubToast = String(text || "").slice(0, 160);
    paint();
    if (hubToastTimer) clearTimeout(hubToastTimer);
    hubToastTimer = setTimeout(() => {
      hubToast = "";
      paint();
    }, 4200);
  }

  function playersInThisGame(maxAgeMs) {
    const gid = gameIdFromPath();
    return recentPlayers(maxAgeMs).filter((p) => p && p.game === gid);
  }

  function activeAbuse() {
    const a = storeGet(KEYS.abuse, null);
    if (!a || !a.until || a.until < Date.now()) return null;
    return a;
  }

  /** Что именно можно выдать — коротко и понятно */
  const OWNER_GIFTS = [
    {
      id: "mega-sun",
      label: "Мега-солнце",
      detail: "Сразу много солнца / ресурсов в этой игре",
    },
    {
      id: "lucky-box",
      label: "Коробка удачи",
      detail: "Сюрприз-подарок прямо сейчас",
    },
    {
      id: "soft-shield",
      label: "Мягкий щит",
      detail: "Защита / подлечивание на короткое время",
    },
    {
      id: "party-boost",
      label: "Пати-буст",
      detail: "Усиление: быстрее и сильнее на время",
    },
    {
      id: "rainbow-hello",
      label: "Радужный привет",
      detail: "Радуга на экране + поздравление от хозяина",
    },
  ];

  function giftById(id) {
    return OWNER_GIFTS.find((g) => g.id === id) || OWNER_GIFTS[0];
  }

  function pickOtherGiftId(nick) {
    const last = lastGiftIdFor(nick);
    const pool = OWNER_GIFTS.filter((g) => g.id !== last);
    const list = pool.length ? pool : OWNER_GIFTS;
    return list[Math.floor(Math.random() * list.length)].id;
  }

  function loadPendingGifts() {
    const list = storeGet(KEYS.pendingGifts, []);
    return Array.isArray(list) ? list : [];
  }

  function savePendingGifts(list) {
    storeSet(KEYS.pendingGifts, list.slice(-40));
  }

  function ensureAbuseStyles() {
    const old = document.getElementById("amal-abuse-css");
    if (old) old.remove();
    const old2 = document.getElementById("amal-abuse-css-v2");
    if (old2) old2.remove();
    const css = document.createElement("style");
    css.id = "amal-abuse-css-v2";
    css.textContent =
      "#amal-abuse-fx{position:fixed;inset:0;z-index:2147483600;pointer-events:none;display:none;overflow:hidden}" +
      "#amal-abuse-fx.on{display:block}" +
      "#amal-abuse-fx .ab-rainbow{position:absolute;inset:0;opacity:.38;background:linear-gradient(120deg,#ff004c,#ff8a00,#ffe600,#00e676,#00b0ff,#7c4dff,#ff004c);background-size:280% 280%;animation:abRain 2s linear infinite;mix-blend-mode:soft-light}" +
      "#amal-abuse-fx .ab-veil{position:absolute;inset:0;background:radial-gradient(circle at 50% 70%,rgba(255,255,255,.05),rgba(0,0,0,.18));pointer-events:none}" +
      "#amal-abuse-fx .ab-watcher{position:absolute;left:max(8px,env(safe-area-inset-left));bottom:calc(72px + env(safe-area-inset-bottom,0px));width:min(28vw,140px);height:min(42vh,220px);pointer-events:none;opacity:.78;filter:drop-shadow(0 10px 18px rgba(0,0,0,.4));animation:abWatch 3.2s ease-in-out infinite;z-index:1}" +
      "#amal-abuse-fx .ab-watcher svg{width:100%;height:100%;display:block}" +
      "#amal-abuse-fx .ab-banner{position:absolute;left:50%;top:10%;transform:translateX(-50%);padding:12px 20px;border-radius:999px;background:rgba(0,0,0,.78);border:1px solid rgba(255,230,120,.65);color:#fff7ed;font:900 16px/1.2 system-ui,sans-serif;text-align:center;max-width:92vw;pointer-events:none;box-shadow:0 12px 40px rgba(0,0,0,.45);z-index:3}" +
      "#amal-abuse-fx .ab-banner small{display:block;margin-top:4px;opacity:.85;font-size:12px;font-weight:700}" +
      "#amal-abuse-fx .ab-happy{position:absolute;left:max(8px,env(safe-area-inset-left));bottom:calc(12px + env(safe-area-inset-bottom,0px));padding:10px 12px;border-radius:14px;background:rgba(16,24,12,.88);border:1px solid rgba(125,255,154,.4);color:#d8ffe0;font:800 12px/1.35 system-ui,sans-serif;max-width:42vw;pointer-events:none;z-index:3}" +
      "#amal-abuse-fx .ab-buddy{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:calc(96px + env(safe-area-inset-bottom,0px));width:110px;pointer-events:auto;cursor:pointer;text-align:center;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45));animation:abBob 1.1s ease-in-out infinite;border:0;background:transparent;padding:0;z-index:4}" +
      "#amal-abuse-fx .ab-buddy img{width:84px;height:84px;border-radius:50%;border:3px solid #ffe566;background:#111;display:block;margin:0 auto}" +
      "#amal-abuse-fx .ab-buddy .ab-label{margin-top:6px;padding:8px 10px;border-radius:12px;background:linear-gradient(135deg,#fde68a,#f59e0b);color:#111;font:900 12px/1.15 system-ui,sans-serif}" +
      "#amal-gift-fx{position:fixed;inset:0;z-index:2147483601;display:none;place-items:center;pointer-events:none}" +
      "#amal-gift-fx.on{display:grid}" +
      "#amal-gift-fx .gf-card{pointer-events:none;min-width:min(90vw,340px);padding:1.2rem 1.35rem;border-radius:1.2rem;background:linear-gradient(160deg,rgba(40,28,8,.96),rgba(12,14,22,.96));border:1px solid rgba(251,191,36,.55);box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center;color:#fff7ed;font-family:system-ui,sans-serif}" +
      "#amal-gift-fx .gf-kicker{font:900 11px/1 system-ui;letter-spacing:.1em;color:#fde68a;margin:0 0 .4rem}" +
      "#amal-gift-fx .gf-title{font:900 1.35rem/1.2 system-ui;margin:0 0 .35rem}" +
      "#amal-gift-fx .gf-detail{font:700 .88rem/1.35 system-ui;color:#d6d3d1;margin:0 0 .45rem}" +
      "#amal-gift-fx .gf-meta{font:700 .72rem/1.3 system-ui;color:#a8a29e;margin:0}" +
      "#amal-same-game{pointer-events:none;position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147483500;display:flex;gap:6px;align-items:center;padding:6px 10px;border-radius:999px;background:rgba(8,12,18,.82);border:1px solid rgba(255,255,255,.14);color:#e8eef8;font:800 11px/1 system-ui,sans-serif;max-width:94vw;overflow:hidden;white-space:nowrap}" +
      "#amal-same-game .sg-faces{display:flex;gap:4px;align-items:center}" +
      "#amal-same-game img{width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:#222}" +
      ".amal-gift-pick{display:grid;gap:6px;margin:8px 0}" +
      ".amal-gift-pick button{display:block;width:100%;text-align:left;padding:10px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#e7e5e4;cursor:pointer;font:700 12px/1.35 system-ui}" +
      ".amal-gift-pick button.on{border-color:rgba(251,191,36,.65);background:rgba(251,191,36,.12)}" +
      ".amal-gift-pick strong{display:block;color:#fde68a;margin-bottom:2px}" +
      "@keyframes abRain{0%{background-position:0% 50%}100%{background-position:100% 50%}}" +
      "@keyframes abBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}" +
      "@keyframes abWatch{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}";
    document.head.appendChild(css);
  }

  function abuseWatcherSvg() {
    return (
      '<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="100" cy="268" rx="58" ry="10" fill="rgba(0,0,0,.35)"/>' +
      '<path d="M70 250c8-42 14-78 14-118h32c0 40 6 76 14 118z" fill="#1f2937"/>' +
      '<path d="M62 132c0-38 17-68 38-68s38 30 38 68c0 8-4 14-10 18H72c-6-4-10-10-10-18z" fill="#fbbf24"/>' +
      '<circle cx="100" cy="78" r="36" fill="#fde68a"/>' +
      '<circle cx="88" cy="74" r="5" fill="#111"/><circle cx="112" cy="74" r="5" fill="#111"/>' +
      '<path d="M90 92c6 6 14 6 20 0" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M48 150c22 10 40 12 52 12s30-2 52-12l-8 54c-14 8-30 12-44 12s-30-4-44-12z" fill="#f59e0b"/>' +
      '<path d="M42 148c-18 22-22 48-18 70" stroke="#fbbf24" stroke-width="14" fill="none" stroke-linecap="round"/>' +
      '<path d="M158 148c18 22 22 48 18 70" stroke="#fbbf24" stroke-width="14" fill="none" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  function showAdminAbuseFx(payload) {
    ensureAbuseStyles();
    let el = document.getElementById("amal-abuse-fx");
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-abuse-fx";
      document.body.appendChild(el);
    }
    const text = (payload && payload.text) || "Admin Abuse начинается!";
    const from = (payload && payload.fromNick) || "Амаль";
    const face = faceUrl("abuse-" + from);
    el.innerHTML =
      '<div class="ab-rainbow"></div><div class="ab-veil"></div>' +
      '<div class="ab-watcher">' +
      abuseWatcherSvg() +
      "</div>" +
      '<div class="ab-banner">🔥 ' +
      escapeHtml(text) +
      "<small>от " +
      escapeHtml(from) +
      " · радуга · смотрит сбоку · можно забрать всё</small></div>" +
      '<div class="ab-happy">Раздача открыта ✨<br/>Жми человечка справа · поле свободно</div>' +
      '<button type="button" class="ab-buddy" id="amal-abuse-buddy" title="Забрать всё">' +
      '<img src="' +
      face +
      '" alt="" />' +
      '<div class="ab-label">🎁 Забрать всё</div></button>';
    el.classList.add("on");
    const buddy = el.querySelector("#amal-abuse-buddy");
    if (buddy) {
      buddy.onclick = () => claimAbuseGift(payload);
    }
    clearTimeout(showAdminAbuseFx._t);
    const left = Math.max(8000, (payload && payload.until ? payload.until - Date.now() : 45000));
    showAdminAbuseFx._t = setTimeout(() => {
      el.classList.remove("on");
    }, Math.min(left, 90000));
  }

  function claimAbuseGift(payload) {
    try {
      const key = "amal-abuse-claim-" + String((payload && payload.at) || 0);
      if (sessionStorage.getItem(key) === "1") {
        showHubToast("Ты уже забрал подарок");
        return;
      }
      sessionStorage.setItem(key, "1");
    } catch (_) {
      /* ignore */
    }
    showHubToast("🎁 Получено от Admin Abuse!");
    try {
      if (global.AmalSurprises && AmalSurprises.giveLittle) {
        AmalSurprises.giveLittle({ game: gameIdFromPath(), to: getNick() || "игроку" });
      }
    } catch (_) {
      /* ignore */
    }
    try {
      if ((isOwner() || isGameAdmin()) && global.AmalPowers && AmalPowers.runAbility) {
        AmalPowers.runAbility("max");
      }
    } catch (_) {
      /* ignore */
    }
    global.dispatchEvent(
      new CustomEvent("amal-admin-abuse-claim", {
        detail: { payload: payload || activeAbuse(), nick: getNick(), at: Date.now() },
      })
    );
    global.dispatchEvent(
      new CustomEvent("amal-power", {
        detail: { type: "abuse-gift", abuse: true },
      })
    );
  }

  function showGiftReceived(payload) {
    ensureAbuseStyles();
    let el = document.getElementById("amal-gift-fx");
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-gift-fx";
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<div class="gf-card">' +
      '<p class="gf-kicker">ПОДАРОК ОТ ХОЗЯИНА</p>' +
      '<p class="gf-title">🎁 ' +
      escapeHtml((payload && payload.label) || "Подарок") +
      "</p>" +
      '<p class="gf-detail">' +
      escapeHtml((payload && payload.detail) || "") +
      "</p>" +
      '<p class="gf-meta">Игра: ' +
      escapeHtml(gameTitle((payload && payload.game) || gameIdFromPath())) +
      " · от " +
      escapeHtml((payload && payload.fromNick) || "Амаль") +
      "</p></div>";
    el.classList.add("on");
    if (payload && payload.giftId === "rainbow-hello") {
      showAdminAbuseFx({
        text: (payload && payload.label) || "Радужный привет!",
        fromNick: payload.fromNick,
        until: Date.now() + 12000,
      });
    }
    clearTimeout(showGiftReceived._t);
    showGiftReceived._t = setTimeout(() => el.classList.remove("on"), 4200);
  }

  function applyOwnerGiftLocally(payload) {
    if (!payload) return;
    showGiftReceived(payload);
    global.dispatchEvent(
      new CustomEvent("amal-owner-gift", {
        detail: payload,
      })
    );
    global.dispatchEvent(
      new CustomEvent("amal-power", {
        detail: {
          type: "owner-gift",
          giftId: payload.giftId,
          label: payload.label,
          detail: payload.detail,
          abuse: false,
        },
      })
    );
    try {
      if (payload.giftId === "lucky-box" && global.AmalSurprises && AmalSurprises.giveLittle) {
        AmalSurprises.giveLittle({
          game: payload.game || gameIdFromPath(),
          to: getNick() || "игроку",
        });
      }
    } catch (_) {
      /* ignore */
    }
  }

  function receiveOwnerGift(payload) {
    if (!payload || !payload.toNick) return;
    const me = (getNick() || "").toLowerCase();
    if (!me || me !== String(payload.toNick).toLowerCase()) return;
    const game = payload.game || gameIdFromPath();
    if (gameIdFromPath() !== game) {
      const list = loadPendingGifts().filter(
        (g) => !(g.toNick === payload.toNick && g.game === game && g.at === payload.at)
      );
      list.unshift(payload);
      savePendingGifts(list);
      showHubToast("🎁 Тебе подарок в игре «" + gameTitle(game) + "» — зайди туда");
      return;
    }
    applyOwnerGiftLocally(payload);
    savePendingGifts(
      loadPendingGifts().filter(
        (g) => !(g && String(g.toNick || "").toLowerCase() === me && g.game === game && g.at === payload.at)
      )
    );
    showHubToast("🎁 Получено: " + (payload.label || "подарок"));
  }

  function flushPendingGifts() {
    const me = (getNick() || "").toLowerCase();
    if (!me) return;
    const gid = gameIdFromPath();
    const list = loadPendingGifts();
    const keep = [];
    list.forEach((g) => {
      if (!g) return;
      if (String(g.toNick || "").toLowerCase() === me && g.game === gid) {
        applyOwnerGiftLocally(g);
      } else {
        keep.push(g);
      }
    });
    savePendingGifts(keep);
  }

  /**
   * Хозяин выдаёт подарок СРАЗУ конкретному игроку в КОНКРЕТНОЙ игре.
   */
  function giveGiftToPlayer(opts) {
    if (!isOwner()) return { ok: false, error: "Только хозяин" };
    const nick = String((opts && opts.nick) || "").trim().slice(0, NICK_MAX);
    if (nick.length < NICK_MIN) return { ok: false, error: "Укажи ник игрока" };
    const game = (opts && opts.game) || gameIdFromPath();
    if (!game || game === "portal") return { ok: false, error: "Выбери игру" };
    const gift = giftById((opts && opts.giftId) || "mega-sun");
    const payload = {
      type: "owner-gift",
      toNick: nick,
      game,
      giftId: gift.id,
      label: gift.label,
      detail: gift.detail,
      at: Date.now(),
      fromNick: getNick() || "Amal",
    };
    let n = 0;
    hostConnections.forEach((conn) => {
      try {
        if (conn.open) {
          conn.send(payload);
          n += 1;
        }
      } catch {
        /* ignore */
      }
    });
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
    // если цель — ты сам в этой игре (тест)
    if ((getNick() || "").toLowerCase() === nick.toLowerCase() && gameIdFromPath() === game) {
      applyOwnerGiftLocally(payload);
    }
    // всегда кладём в pending — гость заберёт при входе / смене ника (тот же браузер или после peer)
    try {
      const pending = loadPendingGifts().filter(
        (g) => !(g && g.toNick === payload.toNick && g.game === payload.game && g.at === payload.at)
      );
      pending.unshift(payload);
      savePendingGifts(pending);
    } catch {
      /* ignore */
    }
    addNote(
      "🎁 Выдал «" + gift.label + "» → " + nick + " · " + gameTitle(game) + "\n" + gift.detail,
      { fromAdmin: true, toNick: nick, game }
    );
    try {
      if (global.AmalSurprises && AmalSurprises.record) {
        /* optional */
      }
    } catch (_) {}
    showHubToast("🎁 Выдано " + nick + ": " + gift.label + " · " + gameTitle(game));
    rememberLastGift(nick, gift.id);
    queueOwnerGift(payload);
    return { ok: true, count: n, payload, gift };
  }

  function startAdminAbuse(rawText) {
    if (!isOwner()) return { ok: false, error: "Только хозяин" };
    const text = String(rawText || "Admin Abuse начинается!").trim().slice(0, 120);
    const onlyGame = gameIdFromPath();
    const payload = {
      type: "admin-abuse",
      text: text || "Admin Abuse начинается!",
      at: Date.now(),
      until: Date.now() + 45000,
      fromGame: onlyGame,
      game: onlyGame,
      fromNick: getNick() || "Amal",
    };
    storeSet(KEYS.abuse, payload);
    let n = 0;
    hostConnections.forEach((conn) => {
      try {
        if (conn.open) {
          conn.send(payload);
          n += 1;
        }
      } catch {
        /* ignore */
      }
    });
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
    showAdminAbuseFx(payload);
    addNote("🔥 " + payload.text + " · только " + gameTitle(onlyGame), {
      fromAdmin: true,
      toNick: "*всем*",
      game: onlyGame,
    });
    showHubToast("🔥 Abuse только в «" + gameTitle(onlyGame) + "»");
    return { ok: true, count: n, payload };
  }

  function broadcastToPlayers(text) {
    const body = String(text || "").trim().slice(0, 240);
    if (!body) return { ok: false, error: "Напиши текст" };
    // если в тексте abuse — запускаем полный режим
    if (/admin\s*abuse|админ\s*абуз|abuse/i.test(body)) {
      return startAdminAbuse(body);
    }
    const payload = {
      type: "admin-msg",
      text: body,
      toNick: "*всем*",
      at: Date.now(),
      fromNick: getNick() || "Amal",
      fromGame: gameIdFromPath(),
    };
    let n = 0;
    hostConnections.forEach((conn) => {
      try {
        if (conn.open) {
          conn.send(payload);
          n += 1;
        }
      } catch {
        /* ignore */
      }
    });
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
    showHubToast("📢 " + body);
    addNote(body, { fromAdmin: true, toNick: "*всем*", game: gameIdFromPath() });
    return { ok: true, count: n };
  }

  function receiveAdminMessage(payload) {
    if (!payload || !payload.text) return;
    const me = (getNick() || "").toLowerCase();
    const to = String(payload.toNick || "").trim().toLowerCase();
    if (to && to !== "*всем*" && me && to !== me) return;
    if (!me && to && to !== "*всем*") return;

    const list = loadNotes();
    const note = {
      id: "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      nick: payload.fromNick || "Amal",
      game: payload.fromGame || gameIdFromPath(),
      text: String(payload.text).slice(0, 500),
      at: payload.at || Date.now(),
      fromAdmin: true,
      toNick: getNick() || payload.toNick || null,
      status: "new",
    };
    // не дублируем одну и ту же доставку
    if (
      list.some(
        (n) =>
          n &&
          n.fromAdmin &&
          n.text === note.text &&
          Math.abs((n.at || 0) - (note.at || 0)) < 2000 &&
          String(n.toNick || "").toLowerCase() === String(note.toNick || "").toLowerCase()
      )
    ) {
      showHubToast("👑 " + (payload.fromNick || "Амаль") + ": " + note.text);
      return;
    }
    list.push(note);
    saveNotes(list);
    showHubToast("👑 " + (payload.fromNick || "Амаль") + ": " + note.text);
    if (open && (view === "note" || adminPage === "write" || adminPage === "inbox")) paint();
  }

  function sendAdminDm(toRaw, textRaw) {
    if (!isOwner()) return { ok: false, error: "Только хозяин" };
    const nick = String(toRaw || "").trim().slice(0, NICK_MAX);
    if (nick.length < NICK_MIN) return { ok: false, error: "Укажи ник игрока" };
    const body = String(textRaw || "").trim().slice(0, 500);
    if (!body) return { ok: false, error: "Напиши текст" };

    const payload = {
      type: "admin-msg",
      text: body,
      toNick: nick,
      at: Date.now(),
      fromNick: getNick() || "Amal",
      fromGame: gameIdFromPath(),
    };

    let n = 0;
    hostConnections.forEach((conn) => {
      try {
        if (conn.open) {
          conn.send(payload);
          n += 1;
        }
      } catch {
        /* ignore */
      }
    });
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }

    addNote(body, { fromAdmin: true, toNick: nick, game: gameIdFromPath() });

    // проверка «написать себе» — сразу видно всплывашку
    if ((getNick() || "").toLowerCase() === nick.toLowerCase()) {
      showHubToast("👑 Себе: " + body);
    } else {
      showHubToast("✉️ Отправлено → " + nick);
    }
    return { ok: true, count: n, nick, text: body };
  }

  function updateSameGameStrip() {
    ensureAbuseStyles();
    const gid = gameIdFromPath();
    const old = document.getElementById("amal-same-game");
    if (!gid || gid === "portal") {
      if (old) old.remove();
      return;
    }
    const peers = playersInThisGame();
    // Сверху не шумим, если ты один — полоска только когда есть другие
    if (!peers.length) {
      if (old) old.remove();
      return;
    }
    let el = old;
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-same-game";
      document.body.appendChild(el);
    }
    const faces = peers
      .slice(0, 6)
      .map((p) => '<img src="' + faceUrl(p.nick) + '" title="' + escapeHtml(p.nick) + '" alt="" />')
      .join("");
    el.innerHTML =
      '<span class="sg-faces">' +
      faces +
      "</span><span>С тобой в игре: <b>" +
      peers.map((p) => escapeHtml(p.nick)).join(", ") +
      "</b> · " +
      peers.length +
      "</span>";
  }

  function clearIncomingNotes() {
    const kept = loadNotes().filter((n) => n.fromAdmin);
    saveNotes(kept);
  }

  function maybeRepaintPlayers() {
    updateSameGameStrip();
    if (!open || (adminPage !== "players" && adminPage !== "live" && adminPage !== "profile")) return;
    const now = Date.now();
    if (now - lastPlayersPaint < 800) return;
    lastPlayersPaint = now;
    paint();
  }

  function clearPresenceList() {
    Object.keys(livePlayers).forEach((k) => delete livePlayers[k]);
    storeSet(KEYS.presence, {});
  }

  function quickGrantThisGame(nick) {
    const game = gameIdFromPath();
    if (!game || game === "portal") {
      return issueGrants(nick, ["blockbust"]);
    }
    return issueGrants(nick, [game]);
  }

  function bumpPresence() {
    // Главного админа в список игроков НЕ пишем
    if (isOwner()) {
      removeSelfFromPresence();
      return;
    }
    const nick = getNick();
    if (!nick) return;
    const payload = {
      type: "presence",
      nick,
      game: gameIdFromPath(),
      gameTitle: gameTitle(gameIdFromPath()),
      at: Date.now(),
      live: true,
      role: "guest",
      liveGuest: true,
    };
    const map = loadPresence();
    map[nick] = payload;
    storeSet(KEYS.presence, map);
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
    sendPresenceToHost(payload);
  }

  function removeSelfFromPresence() {
    const nick = getNick();
    const map = loadPresence();
    let changed = false;
    if (nick && map[nick]) {
      delete map[nick];
      changed = true;
    }
    if (changed) storeSet(KEYS.presence, map);
  }

  function recentPlayers(maxAgeMs) {
    const age = maxAgeMs || 1000 * 60 * 30;
    const now = Date.now();
    const myNick = (getNick() || "").toLowerCase();
    const merged = {};
    Object.values(loadPresence()).forEach((p) => {
      if (!p || !p.nick) return;
      merged[p.nick] = p;
    });
    Object.values(livePlayers).forEach((p) => {
      if (!p || !p.nick) return;
      const prev = merged[p.nick];
      if (!prev || (p.at || 0) >= (prev.at || 0)) merged[p.nick] = p;
    });
    return Object.values(merged)
      .filter((p) => p && p.at && now - p.at < age)
      .filter((p) => {
        // хозяин не скрывает гостей даже с похожим ником, если это помечено как guest
        if (p.role === "guest" || p.liveGuest) return true;
        if (isOwner() && String(p.nick || "").toLowerCase() === myNick) return false;
        if (!isOwner() && String(p.nick || "").toLowerCase() === myNick) return false;
        return true;
      })
      .sort((a, b) => b.at - a.at);
  }

  function loadPeerScript(cb) {
    if (global.Peer) {
      cb();
      return;
    }
    const existing = document.querySelector("script[data-amal-peer]");
    if (existing) {
      existing.addEventListener("load", () => cb());
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
    s.async = true;
    s.dataset.amalPeer = "1";
    s.onload = () => cb();
    s.onerror = () => {
      presenceStatus = "error";
    };
    document.head.appendChild(s);
  }

  function startPresenceNet() {
    try {
      if (!global.__amalPresenceBc) {
        global.__amalPresenceBc = new BroadcastChannel("amal-hub-presence");
        global.__amalPresenceBc.onmessage = (ev) => {
          const data = ev.data;
          if (!data) return;
          if (data.type === "owner-gift") {
            receiveOwnerGift(data);
            return;
          }
          if (data.type === "face-refresh" && data.nick && data.seed) {
            applyFaceSeed(data.nick, data.seed);
            if (isOwner()) maybeRepaintPlayers();
            else if ((getNick() || "").toLowerCase() === String(data.nick).toLowerCase()) {
              showHubToast("🔄 Хозяин обновил твой профиль");
            }
            return;
          }
          if (data.type === "admin-abuse") {
            startAdminAbuseFromRemote(data);
            return;
          }
          if (data.type === "admin-msg" && data.text) {
            receiveAdminMessage(data);
            return;
          }
          if (isOwner()) {
            upsertLivePlayer(data);
            if (data.nick) deliverQueuedGiftsForNick(data.nick);
            if (data.type === "register" && data.nick) {
              const reg = registerEverywhere(data.nick, data.game);
              if (reg.isNew) notifyOwnerAboutRegistration(reg.entry);
            }
          } else if (data.nick) {
            upsertLivePlayer(data);
          }
          updateSameGameStrip();
        };
      }
    } catch {
      /* ignore */
    }

    loadPeerScript(() => {
      try {
        if (!global.Peer) return;
        if (presencePeer) return;
        if (isOwner()) startPresenceHost();
        else startPresenceClient();
      } catch {
        presenceStatus = "error";
      }
    });
  }

  function startPresenceHost() {
    presenceStatus = "hosting";
    try {
      if (presencePeer) {
        presencePeer.destroy();
        presencePeer = null;
      }
    } catch {
      /* ignore */
    }
    presencePeer = new global.Peer(PRESENCE_HOST_ID, { debug: 0 });
    presencePeer.on("open", () => {
      presenceReady = true;
      presenceStatus = "online";
      maybeRepaintPlayers();
    });
    presencePeer.on("error", (err) => {
      const t = String(err && err.type);
      if (t === "unavailable-id") {
        // ID занят другим окном хозяина — подключаемся как наблюдатель к нему
        presenceStatus = "online-alt";
        try {
          presencePeer.destroy();
        } catch {
          /* ignore */
        }
        presencePeer = new global.Peer(undefined, { debug: 0 });
        presencePeer.on("open", () => {
          presenceStatus = "online-alt";
          // слушаем локальный BroadcastChannel; peer-host уже в другом окне
        });
        presencePeer.on("error", () => {
          presenceStatus = "error";
          setTimeout(() => {
            if (isOwner()) startPresenceHost();
          }, 8000);
        });
      } else {
        presenceStatus = "error";
        setTimeout(() => {
          if (isOwner() && presenceStatus === "error") startPresenceHost();
        }, 6000);
      }
    });
    presencePeer.on("connection", onHostConnection);
  }

  function injectTestGuest(nickRaw) {
    if (!isOwner()) return { ok: false, error: "Только хозяин" };
    const nick = String(nickRaw || "ТестГость")
      .trim()
      .slice(0, NICK_MAX) || "ТестГость";
    const payload = {
      type: "presence",
      nick,
      game: gameIdFromPath(),
      gameTitle: gameTitle(gameIdFromPath()),
      at: Date.now(),
      live: true,
      role: "guest",
      liveGuest: true,
    };
    upsertLivePlayer(payload);
    showHubToast("Тестовый гость: " + nick);
    return { ok: true, nick };
  }

  function guestTestLink() {
    try {
      const u = new URL(location.href);
      u.searchParams.delete("owner");
      u.searchParams.set("guest", "1");
      u.searchParams.set("nick", "Гость" + Math.floor(100 + Math.random() * 899));
      return u.toString();
    } catch {
      return "./?guest=1";
    }
  }

  function onHostConnection(conn) {
    hostConnections.add(conn);
    conn.on("data", (data) => {
      if (!data) return;
      if (data.type === "presence" || data.nick) {
        const wasNew = !livePlayers[data.nick];
        upsertLivePlayer(data);
        deliverQueuedGiftsForNick(data.nick);
        if (data.type === "register" && data.nick) {
          const reg = registerEverywhere(data.nick, data.game);
          if (reg.isNew) {
            notifyOwnerAboutRegistration(reg.entry);
          } else {
            showHubToast("Снова вошёл: " + data.nick + " · " + gameTitle(data.game || "portal"));
          }
        } else if (wasNew && data.nick) {
          showHubToast("Вошёл: " + data.nick + " · " + gameTitle(data.game || "portal"));
        }
      }
    });
    conn.on("close", () => hostConnections.delete(conn));
    conn.on("open", () => {
      try {
        conn.send({ type: "hello", role: "host" });
      } catch {
        /* ignore */
      }
    });
  }

  function startPresenceClient() {
    presenceStatus = "connecting";
    presencePeer = new global.Peer(undefined, { debug: 0 });
    presencePeer.on("open", () => {
      presenceReady = true;
      connectToHost();
    });
    presencePeer.on("error", () => {
      presenceStatus = "error";
    });
  }

  function startAdminAbuseFromRemote(data) {
    const onlyGame = data && (data.game || data.fromGame);
    if (onlyGame && onlyGame !== gameIdFromPath()) return;
    const payload = {
      type: "admin-abuse",
      text: (data && data.text) || "Admin Abuse начинается!",
      at: (data && data.at) || Date.now(),
      until: (data && data.until) || Date.now() + 45000,
      fromGame: onlyGame || gameIdFromPath(),
      game: onlyGame || gameIdFromPath(),
      fromNick: (data && data.fromNick) || "Amal",
    };
    storeSet(KEYS.abuse, payload);
    showAdminAbuseFx(payload);
  }

  function connectToHost() {
    if (!presencePeer || isOwner()) return;
    try {
      if (presenceConn) {
        try {
          presenceConn.close();
        } catch {
          /* ignore */
        }
      }
      presenceConn = presencePeer.connect(PRESENCE_HOST_ID, { reliable: true });
      presenceConn.on("open", () => {
        presenceStatus = "linked";
        bumpPresence();
      });
      presenceConn.on("data", (data) => {
        if (!data) return;
        if (data.type === "owner-gift") {
          receiveOwnerGift(data);
          return;
        }
        if (data.type === "face-refresh" && data.nick && data.seed) {
          applyFaceSeed(data.nick, data.seed);
          if ((getNick() || "").toLowerCase() === String(data.nick).toLowerCase()) {
            showHubToast("🔄 Хозяин обновил твой профиль");
          }
          return;
        }
        if (data.type === "admin-abuse") {
          startAdminAbuseFromRemote(data);
          showHubToast("🔥 " + (data.text || "Admin Abuse"));
        } else if (data.type === "admin-msg" && data.text) {
          if (/admin\s*abuse|админ\s*абуз|abuse/i.test(data.text)) {
            startAdminAbuseFromRemote({ ...data, game: data.fromGame || data.game });
          } else {
            receiveAdminMessage(data);
          }
        }
      });
      presenceConn.on("close", () => {
        presenceStatus = "retry";
        setTimeout(connectToHost, 4000);
      });
      presenceConn.on("error", () => {
        presenceStatus = "retry";
        setTimeout(connectToHost, 5000);
      });
    } catch {
      presenceStatus = "retry";
      setTimeout(connectToHost, 5000);
    }
  }

  function sendPresenceToHost(payload) {
    if (isOwner()) return;
    try {
      if (presenceConn && presenceConn.open) {
        presenceConn.send({ type: "presence", ...payload });
      }
    } catch {
      /* ignore */
    }
  }

  function ensureStyles() {
    if (document.getElementById("amal-hub-css")) {
      document.getElementById("amal-hub-css").remove();
    }
    const css = document.createElement("style");
    css.id = "amal-hub-css";
    css.textContent = `
#amal-hub-root{position:fixed;z-index:2147483000;inset:0;pointer-events:none;font-family:"Segoe UI",system-ui,-apple-system,sans-serif}
#amal-hub-root *{box-sizing:border-box}
.amal-hub-fab{pointer-events:auto;position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));width:54px;height:54px;border-radius:18px;border:1px solid rgba(255,255,255,.2);background:linear-gradient(160deg,#1e1b4b,#0f172a);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.45);z-index:2147483001}
.amal-hub-fab.admin{border-color:rgba(251,191,36,.65);background:linear-gradient(160deg,#78350f,#422006);box-shadow:0 12px 28px rgba(245,158,11,.25)}
.amal-hub-dock{pointer-events:auto;position:fixed;left:50%;transform:translateX(-50%);top:calc(52px + env(safe-area-inset-top,0px));bottom:auto;display:flex;gap:6px;padding:6px;border-radius:16px;border:1px solid rgba(251,191,36,.4);background:rgba(12,10,6,.92);backdrop-filter:blur(10px);box-shadow:0 10px 28px rgba(0,0,0,.4);max-width:calc(100vw - 24px);overflow:auto;z-index:2147483001}
.amal-hub-dock button{border:0;border-radius:12px;padding:8px 10px;background:rgba(255,255,255,.08);color:#fff7ed;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
.amal-hub-dock button.primary{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111}
.amal-hub-overlay{pointer-events:auto;position:fixed;inset:0;background:rgba(2,6,23,.78);display:flex;align-items:flex-end;justify-content:center;padding:12px;backdrop-filter:blur(8px)}
@media(min-width:720px){.amal-hub-overlay{align-items:center}}
.amal-hub-modal{position:relative;width:min(100%,440px);max-height:min(90dvh,680px);display:flex;flex-direction:column;overflow:hidden;border-radius:24px 24px 18px 18px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,#171526f5,#0b1020f7);color:#f8fafc;padding:0;box-shadow:0 24px 80px rgba(0,0,0,.55)}
.amal-hub-modal-body{flex:1 1 auto;overflow:auto;padding:16px 18px 20px;-webkit-overflow-scrolling:touch}
.amal-hub-bar{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 12px;background:rgba(11,16,32,.97);z-index:3}
.amal-hub-bar.top{border-bottom:1px solid rgba(255,255,255,.12)}
.amal-hub-bar.bottom{border-top:1px solid rgba(255,255,255,.12);justify-content:stretch;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}
.amal-hub-bar.bottom button{flex:1;min-height:46px}
.amal-hub-close-btn{min-width:110px}
.amal-hub-side-close{position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:6;width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.82);color:#fff;font:800 18px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.4);padding:0}
.amal-hub-side-close.left{right:auto;left:8px}
@media(max-width:520px){
  .amal-hub-side-close.left{display:none}
  .amal-hub-side-close{top:auto;bottom:68px;transform:none}
}
.amal-hub-modal h2{margin:0;font-size:1.25rem;letter-spacing:-.02em}
.amal-hub-modal .sub{margin:6px 0 0;font-size:13px;opacity:.7;line-height:1.4}
.amal-hub-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.amal-hub-modal input,.amal-hub-modal textarea{width:100%;margin-top:10px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;padding:12px 14px;font:inherit}
.amal-hub-modal textarea{min-height:96px;resize:vertical}
.amal-hub-modal button{border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;padding:11px 14px;font-weight:800;cursor:pointer}
.amal-hub-modal button.primary{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111;border:none}
.amal-hub-modal button:disabled{opacity:.45}
.amal-hub-tabs{display:flex;gap:6px;margin-top:14px;flex-wrap:wrap}
.amal-hub-tabs button{flex:1;min-width:88px;font-size:12px}
.amal-hub-tabs button.on{background:rgba(251,191,36,.18);outline:2px solid #fbbf24;color:#fde68a}
.amal-hub-list{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:8px}
.amal-hub-list li{border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px;background:rgba(255,255,255,.04);font-size:13px}
.amal-hub-list .meta{opacity:.65;font-size:11px;margin-bottom:6px;font-weight:800}
.amal-hub-chip{position:fixed;right:12px;top:calc(12px + env(safe-area-inset-top,0px));left:auto;pointer-events:auto;padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(15,23,42,.82);color:#e2e8f0;font-size:11px;font-weight:800;max-width:min(58vw,280px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;backdrop-filter:blur(8px);z-index:2147483001}
.amal-hub-chip.owner{border-color:rgba(251,191,36,.45);color:#fde68a;background:rgba(69,26,3,.85)}
.amal-hub-exit{pointer-events:auto;position:fixed;left:10px;top:calc(10px + env(safe-area-inset-top,0px));z-index:2147483002;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.78);color:#fff;font:700 13px/1.2 system-ui,sans-serif;text-decoration:none;backdrop-filter:blur(6px);box-shadow:0 6px 18px rgba(0,0,0,.35)}
.amal-hub-exit:hover{background:rgba(0,0,0,.92)}
.amal-hub-err{color:#fca5a5;font-size:12px;margin-top:8px;font-weight:800}
.amal-hub-ok{color:#86efac;font-size:12px;margin-top:8px;font-weight:800}
.amal-hub-help{margin-top:12px;padding:12px 14px;border-radius:16px;border:1px solid rgba(125,211,252,.28);background:rgba(14,165,233,.12);color:#e0f2fe;font-size:13px;font-weight:700;line-height:1.45}
.amal-hub-step{margin-top:12px;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}
.amal-hub-step h3{margin:0 0 6px;font-size:14px}
.amal-hub-step p{margin:0;font-size:12px;opacity:.75;line-height:1.4}
.amal-hub-big{display:grid;gap:8px;margin-top:12px}
.amal-hub-big button{width:100%;text-align:left;padding:14px;font-size:14px;background:rgba(255,255,255,.05)}
.amal-hub-big button b{display:block;font-size:15px}
.amal-hub-big button span{display:block;font-size:12px;opacity:.72;font-weight:650;margin-top:3px}
.amal-hub-games{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.amal-hub-games label{display:flex;gap:8px;align-items:center;font-size:12px;font-weight:750;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}
.amal-hub-linkbox{margin-top:10px;padding:10px;border-radius:12px;background:rgba(0,0,0,.35);font-size:11px;word-break:break-all;line-height:1.4}
.amal-hub-hero{display:flex;gap:12px;align-items:center;margin-bottom:4px}
.amal-hub-hero .badge{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(160deg,#fbbf24,#b45309);font-size:24px;flex:0 0 auto;box-shadow:0 8px 20px rgba(245,158,11,.35)}
.amal-hub-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.amal-hub-stat{padding:12px 10px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);text-align:center}
.amal-hub-stat .n{font-size:20px;font-weight:900;color:#fde68a}
.amal-hub-stat .l{font-size:10px;opacity:.65;font-weight:800;margin-top:2px;text-transform:uppercase;letter-spacing:.04em}
.amal-hub-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.amal-hub-grid2 button{min-height:76px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:4px;padding:12px;text-align:left;background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.1)}
.amal-hub-grid2 button .ico{font-size:18px}
.amal-hub-grid2 button b{font-size:13px}
.amal-hub-grid2 button span{font-size:10px;opacity:.65;font-weight:650}
.amal-hub-toast{pointer-events:none;position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:2147483010;background:rgba(15,23,42,.95);border:1px solid rgba(251,191,36,.45);color:#fde68a;padding:10px 14px;border-radius:14px;font-size:13px;font-weight:800;max-width:90vw;box-shadow:0 12px 30px rgba(0,0,0,.4)}
.amal-hub-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.35);color:#86efac;font-size:11px;font-weight:800}
.amal-hub-pill.off{background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.35);color:#fca5a5}
.amal-hub-live{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:12px}
.amal-hub-face{border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:12px 10px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));text-align:center}
.amal-hub-face img{width:72px;height:72px;border-radius:50%;background:#0f172a;border:2px solid rgba(251,191,36,.45);object-fit:cover}
.amal-hub-face .nm{margin-top:8px;font-size:13px;font-weight:900}
.amal-hub-face .gm{margin-top:4px;font-size:11px;opacity:.7;font-weight:700}
.amal-hub-face .on{margin-top:6px;font-size:10px;font-weight:800;color:#86efac}
.amal-hub-face.offline .on{color:#fca5a5}
.amal-hub-face.offline img{filter:grayscale(.4);opacity:.75}
.amal-hub-face[data-amal="open-profile"]{cursor:pointer}
.amal-hub-profile{text-align:center;padding:8px 0 4px}
.amal-hub-profile img{width:112px;height:112px;border-radius:50%;border:3px solid rgba(251,191,36,.55);background:#0f172a;object-fit:cover;box-shadow:0 12px 28px rgba(0,0,0,.35)}
.amal-hub-profile .nm{margin-top:10px;font-size:1.35rem;font-weight:900}
.amal-hub-profile .gm{margin-top:4px;font-size:13px;opacity:.75;font-weight:700}
.amal-hub-profile .on{margin-top:8px}
.amal-hub-list li[data-amal="open-profile"]{cursor:pointer}
`;
    document.head.appendChild(css);
  }

  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  let root;
  let view = "home";
  let adminPage = "menu";
  let open = false;
  let gateMode = false;
  let msg = "";
  let err = "";
  let replyTo = "";
  let profileNick = "";
  let profileFaceBust = 0;

  function closeUi() {
    if (gateMode && !getNick()) return;
    open = false;
    gateMode = false;
    msg = "";
    err = "";
    paint();
  }

  function openUi(mode) {
    open = true;
    view = mode || (isOwner() || isGameAdmin() ? "admin" : "note");
    adminPage = "menu";
    replyTo = "";
    lastGrantLinks = [];
    if (isOwner()) ensureOwnerNick();
    if (!getNick()) {
      gateMode = true;
      view = "nick";
    }
    msg = "";
    err = "";
    paint();
  }

  function paint() {
    ensureStyles();
    if (!root) {
      root = document.createElement("div");
      root.id = "amal-hub-root";
      document.body.appendChild(root);
    }
    const nick = getNick();
    const owner = isOwner();
    const gameAdmin = isGameAdmin();
    const gid = gameIdFromPath();
    const inGame = gid && gid !== "portal";
    let html = "";

    // Всегда сверху слева — выход к каталогу, не перекрываем чипом хозяина
    if (inGame) {
      html += `<a class="amal-hub-exit" href="../" title="Выйти ко всем играм">← Все игры</a>`;
    }

    if (owner) {
      html += `<button type="button" class="amal-hub-chip owner" data-amal="open">👑 Хозяин</button>`;
    } else if (nick) {
      html += `<button type="button" class="amal-hub-chip" data-amal="open">${escapeHtml(
        nick,
      )} · ${escapeHtml(gameTitle(gid))}${gameAdmin ? " · админ" : ""}</button>`;
    }

    if (hubToast) {
      html += `<div class="amal-hub-toast">${escapeHtml(hubToast)}</div>`;
    }

    // Быстрые действия во время игры — без верхней «пятёрки»; всё в 👑 Хозяин
    if (!(owner && inGame && !open && !gateMode)) {
      html += `<button type="button" class="amal-hub-fab ${owner || gameAdmin ? "admin" : ""}" data-amal="open" title="${
        owner ? "Меню хозяина" : gameAdmin ? "Твоя админка" : "Ник и заметки"
      }">${owner || gameAdmin ? "👑" : "📝"}</button>`;
    }

    if (open || gateMode) {
      const canClose = !(gateMode && !nick);
      html += `<div class="amal-hub-overlay" data-amal="backdrop"><div class="amal-hub-modal" data-amal="modal">`;
      if (canClose) {
        html += `<div class="amal-hub-bar top"><button type="button" class="amal-hub-close-btn" data-amal="close">✕ Закрыть</button></div>`;
        html += `<button type="button" class="amal-hub-side-close" data-amal="close" title="Закрыть" aria-label="Закрыть">✕</button>`;
        html += `<button type="button" class="amal-hub-side-close left" data-amal="close" title="Закрыть" aria-label="Закрыть">✕</button>`;
      }
      html += `<div class="amal-hub-modal-body">`;
      if (view === "nick" || !nick) {
        html += nickFormHtml(nick);
      } else if (view === "updates") {
        html += updatesHtml();
      } else if (view === "admin" && (owner || gameAdmin)) {
        html += adminHtml();
      } else {
        html += noteFormHtml(nick);
      }
      html += `</div>`;
      if (canClose) {
        html += `<div class="amal-hub-bar bottom"><button type="button" class="primary amal-hub-close-btn" data-amal="close">Закрыть</button></div>`;
      }
      html += `</div></div>`;
    }
    root.innerHTML = html;
    bindUi();
    updateSameGameStrip();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nickFormHtml(current) {
    const already = current
      ? `<p class="sub" style="color:#bbf7d0">Ты уже зарегистрирован во <b>всех</b> играх Amal Games как <b>${escapeHtml(
          current,
        )}</b>.</p>`
      : "";
    return `
      <h2>${current ? "Твой ник" : "Регистрация"}</h2>
      <p class="sub">Один ник — сразу во всех играх. Сохранил здесь → можешь заходить в любую игру без новой регистрации.</p>
      ${already}
      <input id="amal-nick-input" maxlength="${NICK_MAX}" placeholder="Например: AmalPro" value="${escapeHtml(
        current || "",
      )}" />
      ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
      ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
      <div class="amal-hub-row">
        <button type="button" class="primary" data-amal="save-nick" style="flex:1">${
          current ? "Обновить ник" : "Зарегистрироваться"
        }</button>
        ${current && !gateMode ? `<button type="button" data-amal="close">Закрыть</button>` : ""}
      </div>
    `;
  }

  function noteFormHtml(nick) {
    const mine = loadNotes()
      .filter((n) => n.nick === nick || n.toNick === nick)
      .slice(-8)
      .reverse();
    return `
      <h2>Заметка Амалю</h2>
      <p class="sub">Ты: <b>${escapeHtml(nick)}</b> · игра: ${escapeHtml(gameTitle(gameIdFromPath()))}</p>
      <div class="amal-hub-tabs">
        <button type="button" class="on" data-amal="tab-note">Заметка</button>
        <button type="button" data-amal="tab-nick">Ник</button>
        <button type="button" data-amal="tab-updates">Обновления</button>
        ${isOwner() ? `<button type="button" data-amal="tab-admin">Админ</button>` : ""}
      </div>
      <textarea id="amal-note-input" maxlength="500" placeholder="Напиши Амалю..."></textarea>
      ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
      ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
      <div class="amal-hub-row">
        <button type="button" class="primary" data-amal="send-note" style="flex:1">Отправить</button>
        <button type="button" data-amal="close">Закрыть</button>
      </div>
      ${
        !isOwner()
          ? `<div class="amal-hub-help" style="margin-top:10px">${
              isLuckyAdmin()
                ? "👑 У тебя админка удачи · во всех играх · без выдачи другим"
                : "Испытай удачу: 5% шанс админки во всех играх (эксклюзивы откроются, выдавать другим нельзя)"
            }</div>
        ${
          isLuckyAdmin()
            ? ""
            : `<div class="amal-hub-row" style="margin-top:8px"><button type="button" data-amal="roll-lucky" style="flex:1">🎲 Удача 5%</button></div>`
        }`
          : ""
      }
      <ul class="amal-hub-list">${
        mine.length
          ? mine
              .map(
                (n) =>
                  `<li><div class="meta">${n.fromAdmin ? "От Амаля" : "Ты"} · ${escapeHtml(
                    gameTitle(n.game),
                  )} · ${fmtTime(n.at)}</div>${escapeHtml(n.text)}</li>`,
              )
              .join("")
          : `<li class="meta">Пока нет заметок</li>`
      }</ul>
    `;
  }

  function updatesHtml() {
    return `
      <h2>Обновления</h2>
      <p class="sub">Что нового на сайте</p>
      <div class="amal-hub-tabs">
        <button type="button" data-amal="tab-note">Заметка</button>
        <button type="button" data-amal="tab-nick">Ник</button>
        <button type="button" class="on" data-amal="tab-updates">Обновления</button>
        ${isOwner() ? `<button type="button" data-amal="tab-admin">Админ</button>` : ""}
      </div>
      <ul class="amal-hub-list">${CHANGELOG.map(
        (c) =>
          `<li><div class="meta">${escapeHtml(c.id)}</div><b>${escapeHtml(c.title)}</b><div style="margin-top:4px">${escapeHtml(
            c.body,
          )}</div></li>`,
      ).join("")}</ul>
      <div class="amal-hub-row"><button type="button" data-amal="close" style="flex:1">Закрыть</button></div>
    `;
  }

  let lastGrantLinks = [];

  function adminHtml() {
    const players = recentPlayers();
    const notes = loadNotes().slice().reverse().slice(0, 40);
    const incoming = notes.filter((n) => !n.fromAdmin);
    const unread = incoming.filter((n) => n.status !== "done");
    const fullOwner = canGrantAdmin();
    const liveCount = recentPlayers(1000 * 60 * 3).filter((p) => p.live || Date.now() - p.at < 120000).length;
    const onlinePill =
      presenceStatus === "online" || presenceStatus === "online-alt" || presenceStatus === "linked"
        ? `<span class="amal-hub-pill">● связь ок</span>`
        : `<span class="amal-hub-pill off">● нет связи</span>`;
    const back = `<div class="amal-hub-row"><button type="button" data-amal="admin-menu" style="flex:1">← Меню</button><button type="button" data-amal="close">Закрыть</button></div>`;

    if (adminPage === "players") {
      return `
        <div class="amal-hub-hero"><div class="badge">👥</div><div>
          <h2>Кто играет</h2>
          <p class="sub">Жми на игрока — профиль, обновить лицо, выдать другое</p>
        </div></div>
        <div style="margin-top:10px">${onlinePill} · свежих: <b>${liveCount}</b></div>
        <ul class="amal-hub-list">${
          players.length
            ? players
                .map(
                  (p) =>
                    `<li data-amal="open-profile" data-nick="${escapeHtml(p.nick)}"><div class="meta">${fmtTime(p.at)}${
                      p.live || Date.now() - p.at < 120000 ? " · онлайн" : ""
                    }</div>
                    <div style="display:flex;gap:10px;align-items:center">
                      <img src="${faceUrl(p.nick)}" alt="" width="44" height="44" style="border-radius:50%;border:2px solid rgba(251,191,36,.45);background:#0f172a;flex:0 0 auto" />
                      <div><b>${escapeHtml(p.nick)}</b><div style="margin-top:4px;opacity:.75">Игра: ${escapeHtml(
                        p.gameTitle || p.game,
                      )}</div></div>
                    </div>
                    <div class="amal-hub-row" style="margin-top:8px">
                      <button type="button" data-amal="open-profile" data-nick="${escapeHtml(p.nick)}">👤 Профиль</button>
                      <button type="button" data-amal="reply" data-to="${escapeHtml(p.nick)}">✉️ Написать</button>
                      ${
                        fullOwner
                          ? `<button type="button" class="primary" data-amal="quick-grant-nick" data-nick="${escapeHtml(
                              p.nick,
                            )}">⚡ В эту игру</button><button type="button" data-amal="grant-pick" data-nick="${escapeHtml(
                              p.nick,
                            )}">Игры</button>`
                          : ""
                      }
                    </div></li>`,
                )
                .join("")
            : `<li class="meta">Пока пусто.</li>`
        }</ul>
        <div class="amal-hub-help" style="margin-top:10px">Хозяин в списке не показывается. Гость должен открыть игру с ником (другое окно/телефон). Для проверки жми кнопки ниже.</div>
        <div class="amal-hub-row" style="margin-top:10px">
          <button type="button" class="primary" data-amal="admin-test-guest">＋ Тестовый гость</button>
          <button type="button" data-amal="admin-open-guest">Открыть окно гостя</button>
          <button type="button" data-amal="admin-clear-presence">Очистить список</button>
        </div>
        ${back}`;
    }

    if (adminPage === "profile" && fullOwner) {
      const nick = profileNick || replyTo || "";
      const p = findPlayerByNick(nick) || {
        nick,
        game: gameIdFromPath(),
        gameTitle: gameTitle(gameIdFromPath()),
        at: Date.now(),
        live: false,
      };
      const online = !!(p.live || (p.at && Date.now() - p.at < 120000));
      const lastGift = giftById(lastGiftIdFor(nick) || "mega-sun");
      return `
        <div class="amal-hub-hero"><div class="badge">👤</div><div>
          <h2>Профиль игрока</h2>
          <p class="sub">Обновить лицо · выдать что-то другое</p>
        </div></div>
        <div class="amal-hub-profile">
          <img src="${faceUrl(p.nick, profileFaceBust || Date.now())}" alt="" />
          <div class="nm">${escapeHtml(p.nick || "—")}</div>
          <div class="gm">${escapeHtml(p.gameTitle || p.game || "—")}</div>
          <div class="on"><span class="amal-hub-pill ${online ? "" : "off"}">${
            online ? "● сейчас играет" : "○ был недавно / оффлайн"
          }</span></div>
          <div class="sub" style="margin-top:10px">Последний подарок: <b>${escapeHtml(lastGift.label)}</b></div>
        </div>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row" style="margin-top:12px">
          <button type="button" class="primary" data-amal="profile-refresh" data-nick="${escapeHtml(
            p.nick,
          )}" style="flex:1">🔄 Обновить профиль</button>
        </div>
        <div class="amal-hub-row">
          <button type="button" class="primary" data-amal="profile-gift-other" data-nick="${escapeHtml(
            p.nick,
          )}" style="flex:1">🎁 Выдать другое</button>
        </div>
        <div class="amal-hub-row">
          <button type="button" data-amal="gift-pick-nick" data-nick="${escapeHtml(p.nick)}">🎁 Выбрать подарок</button>
          <button type="button" data-amal="reply" data-to="${escapeHtml(p.nick)}">✉️ Написать</button>
          <button type="button" data-amal="quick-grant-nick" data-nick="${escapeHtml(p.nick)}">⚡ Админка</button>
        </div>
        <div class="amal-hub-row"><button type="button" data-amal="admin-players" style="flex:1">← Кто играет</button><button type="button" data-amal="close">Закрыть</button></div>`;
    }

    if (adminPage === "registry") {
      const regs = listRegistry();
      return `
        <div class="amal-hub-hero"><div class="badge">🆕</div><div>
          <h2>Регистрации</h2>
          <p class="sub">Кто зарегистрировался, в какой день и из какой игры (сразу на весь портал)</p>
        </div></div>
        <ul class="amal-hub-list">${
          regs.length
            ? regs
                .map(
                  (r) =>
                    `<li><div class="meta">${escapeHtml(formatRegDay(r.firstAt))}</div>` +
                    `<b>${escapeHtml(r.nick)}</b>` +
                    `<div style="margin-top:4px;opacity:.8">Первая игра: ${escapeHtml(
                      gameTitle(r.firstGame),
                    )}</div>` +
                    `<div style="margin-top:2px;opacity:.7;font-size:11px">Игр заходил: ${(r.games || [])
                      .map((g) => gameTitle(g))
                      .join(", ")}</div></li>`,
                )
                .join("")
            : `<li class="meta">Пока никто не регистрировался.</li>`
        }</ul>
        ${back}`;
    }

    if (adminPage === "inbox") {
      return `
        <div class="amal-hub-hero"><div class="badge">📩</div><div>
          <h2>Входящие</h2>
          <p class="sub">Непрочитанных: ${unread.length}</p>
        </div></div>
        <ul class="amal-hub-list">${
          incoming.length
            ? incoming
                .map(
                  (n) =>
                    `<li><div class="meta">От <b>${escapeHtml(n.nick)}</b> · ${escapeHtml(
                      gameTitle(n.game),
                    )} · ${fmtTime(n.at)}${n.status === "done" ? " · ✓" : " · новое"}</div>${escapeHtml(n.text)}
                    <div class="amal-hub-row" style="margin-top:8px">
                      <button type="button" class="primary" data-amal="reply" data-to="${escapeHtml(n.nick)}">Ответить</button>
                      <button type="button" data-amal="mark" data-id="${escapeHtml(n.id)}">Прочитано</button>
                      ${
                        fullOwner
                          ? `<button type="button" data-amal="quick-grant-nick" data-nick="${escapeHtml(n.nick)}">⚡</button>`
                          : ""
                      }
                    </div></li>`,
                )
                .join("")
            : `<li class="meta">Сообщений нет</li>`
        }</ul>
        <div class="amal-hub-row"><button type="button" data-amal="admin-clear-notes">Очистить входящие</button></div>
        ${back}`;
    }

    if (adminPage === "write") {
      return `
        <div class="amal-hub-hero"><div class="badge">✉️</div><div>
          <h2>Написать</h2>
          <p class="sub">Одному игроку по нику · себе тоже можно (ник хозяина: ${escapeHtml(
            getNick() || "Amal",
          )})</p>
        </div></div>
        <input id="amal-admin-to" maxlength="${NICK_MAX}" placeholder="Ник" value="${escapeHtml(replyTo || "")}" />
        <textarea id="amal-admin-note" maxlength="500" placeholder="Текст сообщения..."></textarea>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row">
          <button type="button" class="primary" data-amal="admin-send" style="flex:1">Отправить</button>
          <button type="button" data-amal="admin-send-self">Себе (тест)</button>
        </div>
        ${back}`;
    }


    if (adminPage === "live" && fullOwner) {
      const list = recentPlayers(1000 * 60 * 30);
      return `
        <div class="amal-hub-hero"><div class="badge">📡</div><div>
          <h2>Живая карта</h2>
          <p class="sub">Лица игроков в реальном времени · можно смотреть с каталога, не заходя в их игру</p>
        </div></div>
        <div style="margin-top:10px">${onlinePill} · игроков: <b>${list.length}</b></div>
        <div class="amal-hub-help">Оставь эту вкладку открытой. Когда гость зайдёт и напишет ник — здесь появится его лицо и игра.</div>
        <div class="amal-hub-live">${
          list.length
            ? list
                .map((p) => {
                  const online = p.live || Date.now() - p.at < 120000;
                  return `<div class="amal-hub-face ${online ? "" : "offline"}" data-amal="open-profile" data-nick="${escapeHtml(
                    p.nick,
                  )}">
                    <img src="${faceUrl(p.nick)}" alt="" loading="lazy" />
                    <div class="nm">${escapeHtml(p.nick)}</div>
                    <div class="gm">${escapeHtml(p.gameTitle || p.game)}</div>
                    <div class="on">${online ? "● сейчас играет" : "○ был недавно"}</div>
                    <div class="amal-hub-row" style="margin-top:8px;justify-content:center">
                      <button type="button" data-amal="open-profile" data-nick="${escapeHtml(p.nick)}">👤</button>
                      <button type="button" data-amal="reply" data-to="${escapeHtml(p.nick)}">✉️</button>
                      <button type="button" class="primary" data-amal="quick-grant-nick" data-nick="${escapeHtml(p.nick)}">⚡</button>
                    </div>
                  </div>`;
                })
                .join("")
            : `<div class="amal-hub-face"><div class="nm">Пока никого</div><div class="gm">Жду гостей…</div></div>`
        }</div>
        <div class="amal-hub-row" style="margin-top:12px">
          <button type="button" data-amal="admin-live" style="flex:1">Обновить</button>
        </div>
        ${back}`;
    }
    if (adminPage === "gift" && fullOwner) {
      const peers = recentPlayers();
      const curGame = gameIdFromPath();
      return `
        <div class="amal-hub-hero"><div class="badge">🎁</div><div>
          <h2>Выдать подарок</h2>
          <p class="sub">Ты даёшь сразу · одному игроку · в одной игре</p>
        </div></div>
        <label class="sub">Ник игрока</label>
        <input id="amal-gift-nick" maxlength="${NICK_MAX}" placeholder="Ник" value="${escapeHtml(replyTo || "")}" />
        <div class="amal-hub-row" style="flex-wrap:wrap;margin:6px 0 8px">
          ${peers
            .slice(0, 8)
            .map(
              (p) =>
                `<button type="button" data-amal="gift-pick-nick" data-nick="${escapeHtml(p.nick)}">${escapeHtml(
                  p.nick,
                )}</button>`,
            )
            .join("") || `<span class="meta">Пока нет онлайн — впиши ник руками</span>`}
        </div>
        <label class="sub">Игра</label>
        <select id="amal-gift-game" style="width:100%;margin:6px 0 10px;padding:10px;border-radius:12px;border:0;background:#111;color:#fff;font:800 13px system-ui">
          ${GRANTABLE_GAMES.map(
            (g) =>
              `<option value="${g.id}" ${g.id === curGame ? "selected" : ""}>${escapeHtml(g.name)}</option>`,
          ).join("")}
        </select>
        <label class="sub">Что выдаём</label>
        <div class="amal-gift-pick" id="amal-gift-pick">
          ${OWNER_GIFTS.map(
            (g, i) =>
              `<button type="button" class="${i === 0 ? "on" : ""}" data-amal="gift-select" data-gift="${g.id}"><strong>${escapeHtml(
                g.label,
              )}</strong>${escapeHtml(g.detail)}</button>`,
          ).join("")}
        </div>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row">
          <button type="button" class="primary" data-amal="gift-send" style="flex:1">Выдать сейчас</button>
        </div>
        ${back}`;
    }
    if (adminPage === "broadcast" && fullOwner) {
      return `
        <div class="amal-hub-hero"><div class="badge">📢</div><div>
          <h2>Сказать всем</h2>
          <p class="sub">Abuse = радуга + большой смотрит + «Забрать всё» у человечка</p>
        </div></div>
        <textarea id="amal-broadcast" maxlength="240" placeholder="Например: Admin Abuse начинается!"></textarea>
        <div class="amal-hub-row" style="margin-top:8px">
          <button type="button" class="primary" data-amal="admin-abuse" style="flex:1">🔥 Admin Abuse</button>
        </div>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row">
          <button type="button" data-amal="admin-broadcast" style="flex:1">Отправить текст</button>
        </div>
        ${back}`;
    }

    if (adminPage === "games" && fullOwner) {
      return `
        <div class="amal-hub-hero"><div class="badge">🎮</div><div>
          <h2>Быстрый переход</h2>
          <p class="sub">Открыть игру</p>
        </div></div>
        <div class="amal-hub-games">${GRANTABLE_GAMES.map((g) => {
          const href =
            (gameIdFromPath() === "portal" ? "./" : "../") + g.id + "/?owner=AmalOwner2026";
          return `<a href="${href}" style="text-decoration:none;color:inherit"><label style="cursor:pointer">▶ ${escapeHtml(
            g.name,
          )}</label></a>`;
        }).join("")}</div>
        ${back}`;
    }

    if (adminPage === "grant" && fullOwner) {
      const grants = activeIssuedGrants().slice(0, 20);
      return `
        <div class="amal-hub-hero"><div class="badge">⚡</div><div>
          <h2>Админка игроку</h2>
          <p class="sub">Он не сможет выдавать дальше</p>
        </div></div>
        <input id="amal-grant-nick" maxlength="${NICK_MAX}" placeholder="Ник игрока" value="${escapeHtml(
          replyTo || "",
        )}" />
        <div class="amal-hub-games">${GRANTABLE_GAMES.map((g) => {
          const checked = g.id === gameIdFromPath() ? " checked" : "";
          return `<label><input type="checkbox" data-grant-game="${g.id}"${checked} /> ${escapeHtml(g.name)}</label>`;
        }).join("")}</div>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row">
          <button type="button" class="primary" data-amal="grant-issue" style="flex:1">Выдать</button>
        </div>
        ${
          lastGrantLinks.length
            ? lastGrantLinks
                .map(
                  (l) =>
                    `<div class="amal-hub-step"><h3>${escapeHtml(l.name)}</h3><div class="amal-hub-linkbox">${escapeHtml(
                      l.link,
                    )}</div><button type="button" data-amal="copy-link" data-link="${escapeHtml(
                      l.link,
                    )}" style="margin-top:6px;width:100%">Скопировать</button></div>`,
                )
                .join("")
            : ""
        }
        <h3 style="margin:14px 0 0;font-size:13px">Уже выдано</h3>
        <ul class="amal-hub-list">${
          grants.length
            ? grants
                .map(
                  (g) =>
                    `<li><div class="meta">${escapeHtml(g.nick)} · ${escapeHtml(gameTitle(g.game))}</div>
                    <div class="amal-hub-row" style="margin-top:6px">
                      <button type="button" data-amal="grant-revoke" data-id="${escapeHtml(g.id)}">Забрать</button>
                      <button type="button" data-amal="copy-link" data-link="${escapeHtml(g.link || "")}">Ссылка</button>
                    </div></li>`,
                )
                .join("")
            : `<li class="meta">Пока пусто</li>`
        }</ul>
        ${back}`;
    }

    if (!fullOwner && isGameAdmin()) {
      const games = isLuckyAdmin()
        ? GRANTABLE_GAMES.map((g) => g.id)
        : myAdminGames();
      const title = isLuckyAdmin() ? "Админка удачи (5%)" : "Твоя админка";
      const sub = isLuckyAdmin()
        ? "Во всех играх · эксклюзивы открыты · выдавать другим нельзя"
        : "Выдана Амалем";
      return `
        <div class="amal-hub-hero"><div class="badge">⚡</div><div>
          <h2>${title}</h2>
          <p class="sub">${sub}</p>
        </div></div>
        <div class="amal-hub-help">Игры: ${games.length ? games.map((g) => gameTitle(g)).join(", ") : "нет"}</div>
        <div class="amal-hub-row" style="margin-top:12px">
          <button type="button" data-amal="close" style="flex:1">Закрыть</button>
        </div>`;
    }

    return `
      <div class="amal-hub-hero"><div class="badge">👑</div><div>
        <h2>Панель хозяина</h2>
        <p class="sub">Крупные кнопки · тебя нет в списке игроков</p>
      </div></div>
      <div style="margin-top:10px">${onlinePill}</div>
      <div class="amal-hub-stats">
        <div class="amal-hub-stat"><div class="n">${liveCount}</div><div class="l">онлайн</div></div>
        <div class="amal-hub-stat"><div class="n">${players.length}</div><div class="l">в списке</div></div>
        <div class="amal-hub-stat"><div class="n">${unread.length}</div><div class="l">писем</div></div>
      </div>
      <div class="amal-hub-grid2"><button type="button" data-amal="admin-live"><span class="ico">📡</span><b>Живая карта</b><span>Лица онлайн</span></button>
        <button type="button" data-amal="admin-players"><span class="ico">👥</span><b>Кто играет</b><span>Ники и игры</span></button>
        <button type="button" data-amal="admin-registry"><span class="ico">🆕</span><b>Регистрации</b><span>Кто и когда</span></button>
        <button type="button" data-amal="admin-inbox"><span class="ico">📩</span><b>Входящие</b><span>${
          unread.length ? unread.length + " новых" : "пусто"
        }</span></button>
        <button type="button" data-amal="admin-write"><span class="ico">✉️</span><b>Написать</b><span>Одному нику</span></button>
        <button type="button" data-amal="admin-gift"><span class="ico">🎁</span><b>Выдать подарок</b><span>Игрок · игра · что именно</span></button>
        <button type="button" data-amal="admin-broadcast"><span class="ico">📢</span><b>Всем онлайн</b><span>Рассылка</span></button>
        <button type="button" data-amal="admin-grant"><span class="ico">⚡</span><b>Админка</b><span>Выдать / забрать</span></button>
        <button type="button" data-amal="admin-games"><span class="ico">🎮</span><b>Игры</b><span>Быстрый переход</span></button>
        <button type="button" data-amal="export"><span class="ico">📋</span><b>Копировать</b><span>Весь список</span></button>
        <button type="button" data-amal="tab-updates"><span class="ico">✨</span><b>Обновления</b><span>Что нового</span></button>
      </div>
      ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
      <div class="amal-hub-row" style="margin-top:12px">
        <button type="button" data-amal="close" style="flex:1">Закрыть</button>
      </div>`;
  }

  function bindUi() {
    root.querySelectorAll("[data-amal]").forEach((el) => {
      el.addEventListener("click", (e) => {
        const act = el.getAttribute("data-amal");
        if (act === "backdrop") {
          if (!gateMode) closeUi();
          return;
        }
        if (act === "modal") {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        if (act === "open") openUi(isOwner() || isGameAdmin() ? "admin" : "note");
        if (act === "close") closeUi();
        if (act === "tab-note") {
          view = "note";
          paint();
        }
        if (act === "roll-lucky") {
          if (isOwner() || isLuckyAdmin()) {
            msg = isLuckyAdmin() ? "Админка удачи уже есть" : "";
            paint();
            return;
          }
          const res = tryRollLuckyAdmin(0.05);
          if (res.won || res.granted) {
            msg = "👑 Админка удачи! Во всех играх · без выдачи другим";
            err = "";
          } else if (res.rolled) {
            msg = "";
            err = "Не выпало (5%). Можно попробовать снова.";
          } else {
            err = "Сейчас нельзя";
          }
          paint();
          return;
        }
        if (act === "tab-nick") {
          view = "nick";
          paint();
        }
        if (act === "tab-updates") {
          view = "updates";
          storeSet(KEYS.changelogSeen, CHANGELOG[0].id);
          paint();
        }
        if (act === "tab-admin") {
          if (!isOwner() && !isGameAdmin()) return;
          view = "admin";
          adminPage = "menu";
          paint();
        }
        if (act === "admin-menu") {
          adminPage = "menu";
          lastGrantLinks = [];
          paint();
        }
        if (act === "admin-grant") {
          if (!canGrantAdmin()) return;
          adminPage = "grant";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-gift") {
          if (!isOwner()) return;
          adminPage = "gift";
          open = true;
          view = "admin";
          paint();
          return;
        }
        if (act === "gift-pick-nick") {
          replyTo = el.getAttribute("data-nick") || "";
          profileNick = replyTo;
          adminPage = "gift";
          open = true;
          view = "admin";
          paint();
          return;
        }
        if (act === "open-profile") {
          if (!isOwner()) return;
          profileNick = el.getAttribute("data-nick") || "";
          replyTo = profileNick;
          profileFaceBust = Date.now();
          adminPage = "profile";
          open = true;
          view = "admin";
          err = "";
          msg = "";
          paint();
          return;
        }
        if (act === "profile-refresh") {
          if (!isOwner()) return;
          const nick = el.getAttribute("data-nick") || profileNick || "";
          const res = refreshPlayerProfile(nick);
          if (!res.ok) {
            err = res.error || "Не вышло";
            msg = "";
          } else {
            err = "";
            msg = "Профиль обновлён — новое лицо";
            profileNick = nick;
            profileFaceBust = Date.now();
          }
          adminPage = "profile";
          paint();
          return;
        }
        if (act === "profile-gift-other") {
          if (!isOwner()) return;
          const nick = el.getAttribute("data-nick") || profileNick || "";
          const p = findPlayerByNick(nick);
          const game = (p && p.game) || gameIdFromPath();
          const giftId = pickOtherGiftId(nick);
          const res = giveGiftToPlayer({ nick, game, giftId });
          if (!res.ok) {
            err = res.error || "Не вышло";
            msg = "";
          } else {
            err = "";
            msg = "Выдано другое: «" + res.gift.label + "» → " + nick;
          }
          profileNick = nick;
          adminPage = "profile";
          paint();
          return;
        }
        if (act === "gift-select") {
          root.querySelectorAll(".amal-gift-pick [data-gift]").forEach((btn) => {
            btn.classList.toggle("on", btn === el);
          });
          return;
        }
        if (act === "gift-send") {
          if (!isOwner()) return;
          const nickEl = root.querySelector("#amal-gift-nick");
          const gameEl = root.querySelector("#amal-gift-game");
          const onGift = root.querySelector(".amal-gift-pick [data-gift].on");
          const res = giveGiftToPlayer({
            nick: nickEl && nickEl.value,
            game: gameEl && gameEl.value,
            giftId: onGift && onGift.getAttribute("data-gift"),
          });
          if (!res.ok) {
            err = res.error || "Не вышло";
            msg = "";
            paint();
            return;
          }
          err = "";
          msg =
            "Выдано «" +
            res.gift.label +
            "» → " +
            res.payload.toNick +
            " · " +
            gameTitle(res.payload.game) +
            "\nЧто это: " +
            res.gift.detail;
          paint();
          return;
        }
        if (act === "admin-abuse") {
          if (!canGrantAdmin()) return;
          const area = root.querySelector("#amal-broadcast");
          const text =
            (area && area.value && area.value.trim()) || "Admin Abuse начинается!";
          const res = startAdminAbuse(text);
          err = res.ok ? "" : res.error || "";
          msg = res.ok ? "🔥 Abuse в эфире · онлайн: " + (res.count || 0) : "";
          paint();
          return;
        }
        if (act === "admin-same") {
          adminPage = "players";
          open = true;
          view = "admin";
          msg =
            "Сейчас в этой игре: " +
            (playersInThisGame()
              .map((p) => p.nick)
              .join(", ") || "пока только ты");
          paint();
          return;
        }
        if (act === "admin-broadcast") {
          if (!canGrantAdmin()) return;
          // If on broadcast page and button is submit - check textarea
          const area = root.querySelector("#amal-broadcast");
          if (area) {
            const res = broadcastToPlayers(area.value);
            if (!res.ok) {
              err = res.error;
              msg = "";
              paint();
              return;
            }
            err = "";
            msg = res.count
              ? "Отправлено онлайн: " + res.count
              : "Сохранено. Сейчас никто не подключён — увидят, когда зайдут в заметках.";
            showHubToast("📢 Рассылка отправлена");
            paint();
            return;
          }
          adminPage = "broadcast";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-games") {
          if (!canGrantAdmin()) return;
          adminPage = "games";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-clear-notes") {
          if (!canGrantAdmin()) return;
          clearIncomingNotes();
          msg = "Входящие очищены";
          paint();
        }
        if (act === "admin-clear-presence") {
          if (!canGrantAdmin()) return;
          clearPresenceList();
          msg = "Список игроков очищен";
          paint();
        }
        if (act === "admin-test-guest") {
          if (!isOwner()) return;
          const res = injectTestGuest("ТестГость");
          err = res.ok ? "" : res.error || "";
          msg = res.ok ? "В списке: " + res.nick + " — открой профиль и выдай подарок" : "";
          adminPage = "players";
          open = true;
          view = "admin";
          paint();
          return;
        }
        if (act === "admin-open-guest") {
          if (!isOwner()) return;
          const link = guestTestLink();
          try {
            global.open(link, "_blank", "noopener,noreferrer");
          } catch {
            /* ignore */
          }
          msg = "Открыл окно гостя. Там сохрани ник — и он появится здесь.";
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link);
          } catch {
            /* ignore */
          }
          paint();
          return;
        }
        if (act === "quick-grant-nick") {
          if (!canGrantAdmin()) return;
          const nick = el.getAttribute("data-nick") || "";
          const res = quickGrantThisGame(nick);
          if (!res.ok) {
            err = res.error;
            msg = "";
            adminPage = "grant";
            replyTo = nick;
            open = true;
            view = "admin";
            paint();
            return;
          }
          err = "";
          lastGrantLinks = res.links || [];
          replyTo = nick;
          adminPage = "grant";
          open = true;
          view = "admin";
          msg = "Админка в этой игре для «" + nick + "». Скопируй ссылку.";
          showHubToast("⚡ Админка выдана: " + nick);
          paint();
        }
        if (act === "quick-grant") {
          if (!canGrantAdmin()) return;
          replyTo = "";
          adminPage = "grant";
          open = true;
          view = "admin";
          msg = "Сейчас игра: " + gameTitle(gameIdFromPath()) + " — она уже отмечена галочкой";
          err = "";
          paint();
        }
        if (act === "admin-live") {
          if (!canGrantAdmin()) return;
          adminPage = "live";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-players") {
          adminPage = "players";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-registry") {
          adminPage = "registry";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-inbox") {
          adminPage = "inbox";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-write") {
          adminPage = "write";
          open = true;
          view = "admin";
          paint();
        }
        if (act === "admin-send-self") {
          if (!isOwner()) return;
          replyTo = getNick() || "Amal";
          const area = root.querySelector("#amal-admin-note");
          const body =
            (area && area.value && area.value.trim()) || "Тест: сообщение себе от хозяина";
          const res = sendAdminDm(replyTo, body);
          err = res.ok ? "" : res.error || "";
          msg = res.ok ? "Проверка себе отправлена — смотри жёлтое сообщение сверху" : "";
          adminPage = "write";
          paint();
          return;
        }
        if (act === "grant-pick") {
          if (!canGrantAdmin()) return;
          replyTo = el.getAttribute("data-nick") || "";
          adminPage = "grant";
          view = "admin";
          msg = "Ник выбран — отметь игры";
          err = "";
          paint();
        }
        if (act === "grant-issue") {
          if (!canGrantAdmin()) return;
          const nickEl = root.querySelector("#amal-grant-nick");
          const games = [];
          root.querySelectorAll("[data-grant-game]").forEach((box) => {
            if (box.checked) games.push(box.getAttribute("data-grant-game"));
          });
          const res = issueGrants(nickEl && nickEl.value, games);
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          lastGrantLinks = res.links || [];
          msg =
            "Готово для «" +
            res.nick +
            "». Скопируй ссылку и отправь игроку. Он откроет — и админка в выбранных играх включится.";
          paint();
        }
        if (act === "grant-revoke") {
          if (!canGrantAdmin()) return;
          const id = el.getAttribute("data-id");
          const res = revokeGrant(id);
          if (!res.ok) {
            err = res.error || "Не вышло";
            msg = "";
            paint();
            return;
          }
          err = "";
          msg = "Админка забрана на этом устройстве.";
          if (res.revokeLink) {
            lastGrantLinks = [
              {
                id: id,
                name: "Ссылка отмены для игрока",
                link: res.revokeLink,
                game: (res.grant && res.grant.game) || "",
              },
            ];
            msg += " Если игрок на другом телефоне — отправь ему ссылку отмены (кнопка ниже).";
          }
          adminPage = "grant";
          paint();
        }
        if (act === "copy-link") {
          const link = el.getAttribute("data-link") || "";
          if (!link) return;
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(link).then(
                () => {
                  msg = "Ссылка скопирована";
                  paint();
                },
                () => {
                  msg = "Не удалось скопировать";
                  paint();
                },
              );
            }
          } catch {
            msg = "Не удалось скопировать";
            paint();
          }
        }
        if (act === "save-nick") {
          const input = root.querySelector("#amal-nick-input");
          const res = setNick(input && input.value);
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          if (res.isNew) {
            msg =
              "Готово! «" +
              res.nick +
              "» зарегистрирован во ВСЕХ играх · " +
              formatRegDay(res.registeredAt || Date.now());
            showHubToast("Регистрация на весь портал: " + res.nick);
          } else {
            msg = "Снова привет, " + res.nick + " — ты уже во всех играх";
          }
          gateMode = false;
          view = isOwner() ? "admin" : "note";
          paint();
        }
        if (act === "send-note") {
          const input = root.querySelector("#amal-note-input");
          const res = addNote(input && input.value, { game: gameIdFromPath() });
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          msg = "Заметка отправлена Амалю";
          try {
            const packet = `[Amal Games]\nНик: ${res.note.nick}\nИгра: ${gameTitle(res.note.game)}\n${res.note.text}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(packet).catch(() => {});
            }
          } catch {
            /* ignore */
          }
          paint();
        }
        if (act === "admin-send") {
          if (!isOwner()) return;
          const text = root.querySelector("#amal-admin-note");
          const to = root.querySelector("#amal-admin-to");
          const res = sendAdminDm(to && to.value, text && text.value);
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          msg =
            "Отправлено игроку «" +
            res.nick +
            "»" +
            ((getNick() || "").toLowerCase() === res.nick.toLowerCase()
              ? " · проверка себе: смотри всплывающее сообщение сверху"
              : res.count
                ? " · онлайн: " + res.count
                : " · сохранено, увидит когда будет онлайн / в заметках");
          if (text) text.value = "";
          paint();
          return;
        }
        if (act === "reply") {
          replyTo = el.getAttribute("data-to") || "";
          adminPage = "write";
          view = "admin";
          msg = "Ник подставлен — пиши ответ ниже";
          err = "";
          paint();
        }
        if (act === "mark") {
          const id = el.getAttribute("data-id");
          const list = loadNotes().map((n) => (n.id === id ? { ...n, status: "done" } : n));
          saveNotes(list);
          msg = "Отмечено";
          paint();
        }
        if (act === "export") {
          const packet = JSON.stringify(
            { players: recentPlayers(), notes: loadNotes() },
            null,
            2,
          );
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(packet).then(
                () => {
                  msg = "Скопировано в буфер";
                  paint();
                },
                () => {
                  msg = "Не удалось скопировать";
                  paint();
                },
              );
            }
          } catch {
            msg = "Не удалось скопировать";
            paint();
          }
        }
      });
    });
  }

  function boot() {
    ensureStyles();
    try {
      const params = new URLSearchParams(location.search);
      const qNick = params.get("nick");
      if (qNick) setNick(qNick);
    } catch {
      /* ignore */
    }
    if (isOwner()) ensureOwnerNick();
    const redeemed = redeemGrantFromUrl();
    bumpPresence();
    startPresenceNet();
    flushPendingGifts();
    paint();
    updateSameGameStrip();
    setInterval(() => {
      bumpPresence();
      updateSameGameStrip();
      maybeRepaintPlayers();
    }, 8000);
    const abuse = activeAbuse();
    if (abuse) showAdminAbuseFx(abuse);
    if (!getNick() && !isOwner()) {
      gateMode = true;
      open = true;
      view = "nick";
      paint();
    } else if (redeemed) {
      open = true;
      view = isOwner() || isGameAdmin() ? "admin" : "note";
      adminPage = "menu";
      msg = redeemed.message || "";
      err = redeemed.ok ? "" : redeemed.message || "";
      paint();
    } else {
      const seen = storeGet(KEYS.changelogSeen, "");
      if (seen !== CHANGELOG[0].id && gameIdFromPath() === "portal") {
        open = true;
        view = "updates";
        paint();
      }
    }
    try {
      if (isOwner() && new URLSearchParams(location.search).get("live") === "1") {
        open = true;
        view = "admin";
        adminPage = "live";
        paint();
      }
    } catch (_) {}

    // тихие коды хозяина / админ-команды на любой игре
    let teamDigitBuf = "";
    global.addEventListener("keydown", (e) => {
      if (!isOwner() && !isGameAdmin()) return;
      const digit =
        e.code === "Digit6" || e.code === "Numpad6"
          ? "6"
          : e.code === "Digit7" || e.code === "Numpad7"
            ? "7"
            : e.code === "Digit5" || e.code === "Numpad5"
              ? "5"
              : e.code === "Digit2" || e.code === "Numpad2"
                ? "2"
                : "";
      if (!digit) {
        if (e.key && e.key.length === 1) teamDigitBuf = "";
        return;
      }
      teamDigitBuf = (teamDigitBuf + digit).slice(-2);
      try {
        if (teamDigitBuf === "67" && global.AmalSurprises && AmalSurprises.giveTeamPack) {
          teamDigitBuf = "";
          const res = AmalSurprises.giveTeamPack({ to: getNick() || "админ-команда" });
          if (res && res.already) showHubToast("Командный пак уже открыт");
          else if (res && res.ok) showHubToast("✨ Команде — сразу несколько сюрпризов");
          return;
        }
        if (teamDigitBuf === "77" && isOwner() && global.AmalSurprises && AmalSurprises.giveOwnerWave) {
          teamDigitBuf = "";
          const res = AmalSurprises.giveOwnerWave({ to: getNick() || "хозяин" });
          if (res && res.already) showHubToast("Волна обновлений уже активна");
          else if (res && res.ok) showHubToast("👑 Волна сюрпризов по играм хаба");
          return;
        }
        if (teamDigitBuf === "52" && isOwner() && global.AmalSurprises && AmalSurprises.giveOwnerWave) {
          teamDigitBuf = "";
          const res = AmalSurprises.giveOwnerWave({ to: getNick() || "хозяин", force: true });
          if (res && res.ok) showHubToast("👑 Волна сюрпризов обновлена");
        }
      } catch {
        /* ignore */
      }
    });

    setInterval(bumpPresence, 8000);
    setInterval(() => {
      if (open && (adminPage === "live" || adminPage === "players" || adminPage === "profile") && isOwner()) paint();
    }, 3000);
    global.addEventListener("amal-owner-changed", () => {
      try {
        if (presencePeer) {
          presencePeer.destroy();
          presencePeer = null;
          presenceConn = null;
        }
      } catch {
        /* ignore */
      }
      if (isOwner()) ensureOwnerNick();
      startPresenceNet();
      paint();
    });
  }

  global.AmalHub = {
    getNick,
    setNick,
    addNote,
    isOwner,
    canGrantAdmin,
    isGameAdmin,
    isLuckyAdmin,
    canGiveToPlayers,
    grantLuckyAdmin,
    tryRollLuckyAdmin,
    myAdminGames,
    issueGrants,
    revokeGrant,
    open: openUi,
    gameId: gameIdFromPath,
    registerEverywhere,
    listRegistry,
    startAdminAbuse,
    giveGiftToPlayer,
    playersInThisGame,
    refreshPlayerProfile,
    findPlayerByNick,
    injectTestGuest,
    guestTestLink,
    sendAdminDm,
    CHANGELOG,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  try {
    if (!document.querySelector('script[src*="amal-site-faq.js"]')) {
      var sFaq = document.createElement("script");
      sFaq.src = (function () {
        try {
          var p = location.pathname || "";
          if (p.indexOf("/animal-hospital/") !== -1) return "../shared/amal-site-faq.js?v=1";
          if (/\/amal-games\/?$/.test(p) || /\/amal-games\/index\.html$/.test(p)) return "./shared/amal-site-faq.js?v=1";
          return "../shared/amal-site-faq.js?v=1";
        } catch (e) {
          return "../shared/amal-site-faq.js?v=1";
        }
      })();
      document.head.appendChild(sFaq);
    }
  } catch (eFaq) {}

})(typeof window !== "undefined" ? window : globalThis);
