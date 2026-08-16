/**
 * Amal Hub — общий ник, заметки и админ-инбокс для всех игр Amal's Games.
 * Один origin (GitHub Pages) → один localStorage на все игры.
 */
(function (global) {
  "use strict";

  /**
   * Аварийный режим: ?lite=1 полностью выключает хаб и запоминает выбор.
   * Нужен, если хаб на слабом устройстве вешает страницу. Вернуть: ?lite=0
   */
  try {
    var _liteParam = new URLSearchParams(global.location.search).get("lite");
    if (_liteParam === "0") localStorage.removeItem("amal-lite-mode");
    else if (_liteParam === "1") localStorage.setItem("amal-lite-mode", "1");
    if (localStorage.getItem("amal-lite-mode") === "1") {
      global.AmalHub = { lite: true, isOwner: function () { return false; } };
      return;
    }
  } catch (_) {
    /* ignore */
  }

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
    bans: "amal-hub-bans-v1",
    wipes: "amal-hub-wipes-v1",
    myBan: "amal-hub-my-ban-v1",
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
      id: "2026-08-14-secret-cube",
      title: "Секретный кубик · твоя админка",
      body: "В каждой игре у хозяина появляется секретный кубик 🎲 (слева снизу). Забери его — останется кнопка 🎲, по ней открывается вся админка: кто играет, сколько игроков, все кнопки.",
    },
    {
      id: "2026-08-14-shift-timer-ushastik",
      title: "Таймер смены · Ушастик тихий",
      body: "Смена в больнице снова идёт по времени (∞ только монеты). Create Lab: Ушастик не говорит сам — только текст. Комикс с картинками.",
    },
    {
      id: "2026-08-14-create-comic",
      title: "Создать игру · комикс",
      body: "На главной сайта кнопка «Создать игру» (Create Lab). Маленький комикс из 5 кадров — потом сразу мастер игры.",
    },
    {
      id: "2026-08-14-universe",
      title: "Вселенная Animal Hospital",
      body: "Страница «Вселенная»: больница, Lab, Best Console, все мини и ссылки на весь сайт Amal — всё в одном месте.",
    },
    {
      id: "2026-08-14-watch-players",
      title: "Слежка за игроком",
      body: "Хозяин может нажать «Следить»: видно лицо, игра и что делает человек. Забаненный не зайдёт — сразу блок.",
    },
    {
      id: "2026-08-14-players-ban",
      title: "Таблица игроков · бан и сброс",
      body: "В «Кто играет» снова видна таблица всех игроков. Хозяин может банить на 1ч / 5ч / 10ч / 1 день или сбросить весь прогресс во всех играх.",
    },
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

  /** Невидимый режим (полигон): владелец не светится в присутствии, его никто не видит. */
  function isStealth() {
    try {
      if (global.__AMAL_STEALTH__ === true) return true;
      const s = new URLSearchParams(location.search).get("stealth");
      if (s === "1" || s === "true" || s === "yes") {
        global.__AMAL_STEALTH__ = true;
        return true;
      }
      if (localStorage.getItem("amal-stealth-v1") === "1") return true;
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

  function loadBans() {
    const list = storeGet(KEYS.bans, []);
    return Array.isArray(list) ? list : [];
  }

  function saveBans(list) {
    storeSet(KEYS.bans, Array.isArray(list) ? list : []);
  }

  function activeBans() {
    const now = Date.now();
    return loadBans().filter((b) => b && Number(b.until || 0) > now);
  }

  function banForNick(nick) {
    const key = String(nick || "").trim().toLowerCase();
    if (!key) return null;
    return activeBans().find((b) => String(b.nick || "").trim().toLowerCase() === key) || null;
  }

  function formatBanLeft(until) {
    const ms = Math.max(0, Number(until || 0) - Date.now());
    if (ms <= 0) return "0 мин";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 24) {
      const d = Math.floor(h / 24);
      const rh = h % 24;
      return rh ? `${d}д ${rh}ч` : `${d}д`;
    }
    if (h > 0) return m ? `${h}ч ${m}мин` : `${h}ч`;
    return `${Math.max(1, m)} мин`;
  }

  function applyLocalBan(payload) {
    const until = Number(payload && payload.until) || 0;
    if (until <= Date.now()) {
      try {
        localStorage.removeItem(KEYS.myBan);
      } catch {
        /* ignore */
      }
      return null;
    }
    const row = {
      until,
      reason: String((payload && payload.reason) || "Бан от владельца").slice(0, 120),
      by: String((payload && payload.by) || "owner").slice(0, 40),
      at: Number((payload && payload.at) || Date.now()),
    };
    try {
      localStorage.setItem(KEYS.myBan, JSON.stringify(row));
    } catch {
      /* ignore */
    }
    return row;
  }

  function clearLocalBan() {
    try {
      localStorage.removeItem(KEYS.myBan);
    } catch {
      /* ignore */
    }
  }

  function readLocalBan() {
    try {
      const raw = localStorage.getItem(KEYS.myBan);
      if (!raw) return null;
      const row = JSON.parse(raw);
      if (!row || Number(row.until || 0) <= Date.now()) {
        clearLocalBan();
        return null;
      }
      return row;
    } catch {
      return null;
    }
  }

  function myBanStatus() {
    if (isOwner()) return null;
    const nickBan = banForNick(getNick());
    if (nickBan) {
      applyLocalBan(nickBan);
      return nickBan;
    }
    return readLocalBan();
  }

  function broadcastModeration(payload) {
    if (!payload || !payload.type) return;
    try {
      if (typeof hostConnections !== "undefined" && hostConnections) {
        hostConnections.forEach((conn) => {
          try {
            if (conn && conn.open) conn.send(payload);
          } catch {
            /* ignore */
          }
        });
      }
    } catch {
      /* ignore */
    }
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
  }

  function banPlayer(nick, hours, reason) {
    if (!isOwner()) return { ok: false, error: "Только владелец" };
    const name = String(nick || "").trim().slice(0, NICK_MAX);
    if (!name) return { ok: false, error: "Нужен ник" };
    if (name.toLowerCase() === String(getNick() || "").trim().toLowerCase()) {
      return { ok: false, error: "Нельзя банить себя" };
    }
    const hrs = Math.max(0.1, Number(hours) || 1);
    const until = Date.now() + Math.round(hrs * 3600000);
    const row = {
      nick: name,
      until,
      hours: hrs,
      reason: String(reason || "Бан от владельца").slice(0, 120),
      by: getNick() || "owner",
      at: Date.now(),
    };
    const next = loadBans().filter((b) => String(b.nick || "").trim().toLowerCase() !== name.toLowerCase());
    next.unshift(row);
    saveBans(next.slice(0, 200));
    broadcastModeration({
      type: "ban",
      nick: name,
      until,
      reason: row.reason,
      by: row.by,
      at: row.at,
    });
    return { ok: true, ban: row };
  }

  function unbanPlayer(nick) {
    if (!isOwner()) return { ok: false, error: "Только владелец" };
    const name = String(nick || "").trim().slice(0, NICK_MAX);
    if (!name) return { ok: false, error: "Нужен ник" };
    saveBans(loadBans().filter((b) => String(b.nick || "").trim().toLowerCase() !== name.toLowerCase()));
    broadcastModeration({ type: "unban", nick: name });
    return { ok: true };
  }

  function wipePlayerProgress(nick) {
    if (!isOwner()) return { ok: false, error: "Только владелец" };
    const name = String(nick || "").trim().slice(0, NICK_MAX);
    if (!name) return { ok: false, error: "Нужен ник" };
    const stamp = Date.now();
    const wipes = storeGet(KEYS.wipes, []);
    const list = Array.isArray(wipes) ? wipes : [];
    list.unshift({ nick: name, at: stamp, by: getNick() || "owner" });
    storeSet(KEYS.wipes, list.slice(0, 100));
    broadcastModeration({ type: "wipe", nick: name, at: stamp, by: getNick() || "owner" });
    return { ok: true };
  }

  function shouldWipeLocal(nick) {
    const name = String(nick || getNick() || "")
      .trim()
      .toLowerCase();
    if (!name) return false;
    const wipes = storeGet(KEYS.wipes, []);
    if (!Array.isArray(wipes)) return false;
    return wipes.some((w) => String(w.nick || "").trim().toLowerCase() === name);
  }

  function applyLocalWipe(force) {
    if (isOwner()) return false;
    const nick = getNick();
    if (!force && !shouldWipeLocal(nick)) return false;
    const keep = new Set([KEYS.nick, KEYS.nickGuest, KEYS.myBan, KEYS.bans, KEYS.changelogSeen]);
    OWNER_KEYS.forEach((k) => keep.add(k));
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }
      keys.forEach((k) => {
        if (keep.has(k)) return;
        if (k.startsWith("amal-owner-")) return;
        try {
          localStorage.removeItem(k);
        } catch {
          /* ignore */
        }
      });
      const wipes = storeGet(KEYS.wipes, []);
      storeSet(
        KEYS.wipes,
        (Array.isArray(wipes) ? wipes : []).filter(
          (w) => String(w.nick || "").trim().toLowerCase() !== String(nick || "").trim().toLowerCase()
        )
      );
      try {
        showHubToast("Прогресс сброшен хозяином");
      } catch {
        /* ignore */
      }
      return true;
    } catch {
      return false;
    }
  }

  function handleModerationMessage(data) {
    if (!data || !data.type) return false;
    const my = String(getNick() || "")
      .trim()
      .toLowerCase();
    if (data.type === "ban" && data.nick) {
      const target = String(data.nick).trim().toLowerCase();
      if (!isOwner()) {
        const next = loadBans().filter((b) => String(b.nick || "").trim().toLowerCase() !== target);
        next.unshift({
          nick: data.nick,
          until: Number(data.until) || 0,
          reason: data.reason || "Бан от владельца",
          by: data.by || "owner",
          at: Number(data.at) || Date.now(),
        });
        saveBans(next.slice(0, 200));
      }
      if (my && my === target && !isOwner()) {
        applyLocalBan(data);
        enforceBanGate();
      }
      if (isOwner()) maybeRepaintPlayers();
      return true;
    }
    if (data.type === "unban" && data.nick) {
      const target = String(data.nick).trim().toLowerCase();
      saveBans(loadBans().filter((b) => String(b.nick || "").trim().toLowerCase() !== target));
      if (my && my === target) clearLocalBan();
      const gate = document.getElementById("amal-ban-gate");
      if (gate && my === target) gate.remove();
      if (isOwner()) maybeRepaintPlayers();
      return true;
    }
    if (data.type === "wipe" && data.nick) {
      const target = String(data.nick).trim().toLowerCase();
      if (!isOwner()) {
        const wipes = storeGet(KEYS.wipes, []);
        const list = Array.isArray(wipes) ? wipes : [];
        list.unshift({ nick: data.nick, at: Number(data.at) || Date.now(), by: data.by || "owner" });
        storeSet(KEYS.wipes, list.slice(0, 100));
      }
      if (my && my === target && !isOwner()) applyLocalWipe(true);
      return true;
    }
    if (data.type === "bans-sync" && Array.isArray(data.bans) && !isOwner()) {
      saveBans(data.bans);
      const mine = banForNick(getNick());
      if (mine) {
        applyLocalBan(mine);
        enforceBanGate();
      }
      return true;
    }
    if (data.type === "wipes-sync" && Array.isArray(data.wipes) && !isOwner()) {
      storeSet(KEYS.wipes, data.wipes.slice(0, 100));
      if (shouldWipeLocal(getNick())) applyLocalWipe(true);
      return true;
    }
    return false;
  }

  function enforceBanGate() {
    if (isOwner()) return false;
    const ban = myBanStatus();
    if (!ban) return false;
    showBanGate(ban);
    try {
      open = false;
    } catch {
      /* ignore */
    }
    return true;
  }

  function playersTableRows() {
    const byNick = new Map();
    const put = (p, source) => {
      const nick = String((p && p.nick) || "").trim();
      if (!nick) return;
      const key = nick.toLowerCase();
      const at = Number(p.at || p.lastSeen || p.lastAt || 0);
      const online = !!(p.live || p.online || (at && Date.now() - at < 120000));
      const gameLabel = p.gameTitle || gameTitle(p.game || p.lastGame || "") || p.game || p.lastGame || "—";
      const prev = byNick.get(key);
      if (prev && prev.online && !online) return;
      if (prev && Number(prev.lastSeen || 0) > at && prev.source === "live") return;
      byNick.set(key, {
        nick,
        game: gameLabel,
        gameId: p.game || p.lastGame || "",
        online,
        role: p.role || "player",
        lastSeen: at || Date.now(),
        source: source || prev?.source || "live",
        activity: String(p.activity || "").slice(0, 120),
      });
    };
    try {
      recentPlayers(1000 * 60 * 60 * 24 * 7).forEach((p) => put(p, "presence"));
    } catch {
      /* ignore */
    }
    try {
      Object.values(livePlayers || {}).forEach((p) => put(p, "live"));
    } catch {
      /* ignore */
    }
    try {
      listRegistry().forEach((p) => put(p, "registry"));
    } catch {
      /* ignore */
    }
    return Array.from(byNick.values()).sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return Number(b.lastSeen || 0) - Number(a.lastSeen || 0);
    });
  }

  function showBanGate(ban) {
    const until = ban && ban.until;
    const left = formatBanLeft(until);
    const reason = String((ban && ban.reason) || "Бан от владельца");
    let root = document.getElementById("amal-ban-gate");
    if (!root) {
      root = document.createElement("div");
      root.id = "amal-ban-gate";
      root.setAttribute(
        "style",
        "position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(8,12,18,.94);color:#f4f7fb;font-family:Segoe UI,system-ui,sans-serif;padding:24px;text-align:center"
      );
      document.documentElement.appendChild(root);
    }
    const reasonSafe = String(reason)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    root.innerHTML = `<div style="max-width:420px"><h1 style="margin:0 0 12px;font-size:1.6rem">Доступ закрыт</h1><p style="margin:0 0 8px;opacity:.9">${reasonSafe}</p><p style="margin:0;font-size:1.1rem">Осталось: <strong>${left}</strong></p><p style="margin:16px 0 0;opacity:.65;font-size:13px">Бан на все игры Amal Games</p></div>`;
  }

  function getPlayerActivity() {
    try {
      if (global.__AMAL_ACTIVITY__ && String(global.__AMAL_ACTIVITY__).trim()) {
        return String(global.__AMAL_ACTIVITY__).trim().slice(0, 120);
      }
    } catch {
      /* ignore */
    }
    try {
      const t = String(document.title || "").trim();
      if (t) return t.slice(0, 120);
    } catch {
      /* ignore */
    }
    return "В игре";
  }

  function reportActivity(text) {
    try {
      global.__AMAL_ACTIVITY__ = String(text || "").trim().slice(0, 120);
    } catch {
      /* ignore */
    }
    if (!isOwner()) bumpPresence();
  }

  const activityLog = {};
  const MAX_ACTIVITY_LOG = 14;
  let watchNick = "";
  try {
    watchNick = sessionStorage.getItem("amal-hub-watch-v1") || "";
  } catch {
    watchNick = "";
  }

  function pushActivityLog(nick, data) {
    const key = String(nick || "").trim();
    if (!key || !data) return;
    const prev = activityLog[key] && activityLog[key][0];
    const activity = String(data.activity || "").trim();
    const game = data.game || data.gameTitle || "";
    if (prev && prev.activity === activity && prev.game === game && Date.now() - (prev.at || 0) < 15000) return;
    if (!activityLog[key]) activityLog[key] = [];
    activityLog[key].unshift({
      at: data.at || Date.now(),
      activity: activity || "В игре",
      game: gameTitle(game) || game || "—",
    });
    activityLog[key] = activityLog[key].slice(0, MAX_ACTIVITY_LOG);
  }

  function getWatchTarget() {
    const nick = String(watchNick || "").trim();
    if (!nick) return null;
    return findPlayerByNick(nick) || { nick, game: "portal", gameTitle: "—", at: 0, live: false, activity: "—" };
  }

  function startWatch(nick) {
    if (!isOwner()) return { ok: false, error: "Только хозяин" };
    const name = String(nick || "").trim().slice(0, NICK_MAX);
    if (!name) return { ok: false, error: "Нужен ник" };
    watchNick = name;
    try {
      sessionStorage.setItem("amal-hub-watch-v1", name);
    } catch {
      /* ignore */
    }
    updateWatchPanel();
    showHubToast("👁 Слежу за: " + name);
    return { ok: true, nick: name };
  }

  function stopWatch() {
    watchNick = "";
    try {
      sessionStorage.removeItem("amal-hub-watch-v1");
    } catch {
      /* ignore */
    }
    const el = document.getElementById("amal-watch-panel");
    if (el) el.remove();
  }

  function updateWatchPanel() {
    if (!isOwner()) {
      stopWatch();
      return;
    }
    const nick = String(watchNick || "").trim();
    if (!nick) {
      const el = document.getElementById("amal-watch-panel");
      if (el) el.remove();
      return;
    }
    const p = getWatchTarget();
    const online = !!(p && (p.live || (p.at && Date.now() - p.at < 120000)));
    const ban = banForNick(nick);
    let panel = document.getElementById("amal-watch-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "amal-watch-panel";
      const hub = document.getElementById("amal-hub-root");
      if (hub) hub.appendChild(panel);
      else document.body.appendChild(panel);
      panel.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-amal]");
        if (!btn) return;
        e.stopPropagation();
        const act = btn.getAttribute("data-amal");
        const n = btn.getAttribute("data-nick") || watchNick;
        if (act === "watch-stop") {
          stopWatch();
          return;
        }
        if (act === "watch-profile") {
          profileNick = n;
          replyTo = n;
          adminPage = "profile";
          open = true;
          view = "admin";
          paint();
          return;
        }
        if (act === "watch-open") {
          openWatchGame(n);
          return;
        }
        if (act === "ban-player") {
          const hrs = Number(btn.getAttribute("data-hours") || 1);
          const res = banPlayer(n, hrs);
          if (res.ok) showHubToast("🚫 Бан " + n);
          updateWatchPanel();
          if (open && view === "admin") paint();
        }
      });
    }
    const activity = String((p && p.activity) || "В игре").slice(0, 120);
    const gameLabel = escapeHtml((p && (p.gameTitle || gameTitle(p.game))) || "—");
    const log = (activityLog[nick] || []).slice(0, 4);
    panel.innerHTML =
      `<div class="amal-watch-head"><span>👁 Слежу</span><button type="button" data-amal="watch-stop" title="Стоп">✕</button></div>` +
      `<div class="amal-watch-body">` +
      `<img src="${faceUrl(nick, Date.now())}" alt="" />` +
      `<div class="amal-watch-info">` +
      `<div class="amal-watch-nick">${escapeHtml(nick)}</div>` +
      `<div class="amal-watch-game">${gameLabel}</div>` +
      `<div class="amal-watch-act">${escapeHtml(activity)}</div>` +
      `<div class="amal-watch-on"><span class="amal-hub-pill ${online ? "" : "off"}">${online ? "● онлайн" : "○ оффлайн"}</span>` +
      (ban ? `<span class="amal-hub-pill off">🚫 бан ${escapeHtml(formatBanLeft(ban.until))}</span>` : "") +
      `</div></div></div>` +
      (log.length
        ? `<ul class="amal-watch-log">${log
            .map(
              (row) =>
                `<li><span class="t">${fmtTime(row.at)}</span> ${escapeHtml(row.game)} · ${escapeHtml(row.activity)}</li>`,
            )
            .join("")}</ul>`
        : "") +
      `<div class="amal-watch-actions">` +
      `<button type="button" data-amal="watch-open" data-nick="${escapeHtml(nick)}">В игру</button>` +
      `<button type="button" data-amal="watch-profile" data-nick="${escapeHtml(nick)}">Профиль</button>` +
      `<button type="button" data-amal="ban-player" data-nick="${escapeHtml(nick)}" data-hours="1">Бан 1ч</button>` +
      `</div>`;
  }

  function openWatchGame(nick) {
    const p = findPlayerByNick(nick);
    const gid = (p && p.game) || "portal";
    try {
      const base = gameIdFromPath() === "portal" ? "./" : "../";
      const href = base + gid + "/?owner=AmalOwner2026";
      global.open(href, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore */
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
    bumpPresence();
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
    // Хозяин сам себя в список не пишет как «гостя»; роль owner — можно
    if (
      isOwner() &&
      data.role !== "guest" &&
      data.role !== "owner" &&
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
      liveGuest: !!data.liveGuest,
      activity: String(data.activity || getPlayerActivity()).slice(0, 120),
    };
    if (isOwner()) pushActivityLog(nick, livePlayers[nick]);
    // Дублируем в localStorage хозяина, чтобы список не пустел сразу
    if (isOwner()) {
      const map = loadPresence();
      map[nick] = { ...livePlayers[nick], live: true };
      storeSet(KEYS.presence, map);
    }
    maybeRepaintPlayers();
    if (isOwner()) broadcastRoster();
  }

  function broadcastRoster() {
    if (!isOwner()) return;
    const players = recentPlayers(1000 * 60 * 5).map((p) => ({
      nick: p.nick,
      game: p.game,
      gameTitle: p.gameTitle,
      at: p.at,
      live: true,
      role: p.role || "guest",
      liveGuest: !!p.liveGuest,
      activity: p.activity || "",
    }));
    const payload = { type: "roster", players, at: Date.now() };
    hostConnections.forEach((conn) => {
      try {
        if (conn && conn.open) conn.send(payload);
      } catch {
        /* ignore */
      }
    });
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
  }

  function applyRoster(data) {
    if (!data || !Array.isArray(data.players)) return;
    data.players.forEach((p) => {
      if (!p || !p.nick) return;
      const nick = String(p.nick).trim();
      livePlayers[nick] = {
        nick,
        game: p.game || "portal",
        gameTitle: gameTitle(p.game || "portal"),
        at: p.at || Date.now(),
        live: true,
        role: p.role || "guest",
        liveGuest: !!p.liveGuest,
        activity: String(p.activity || "").slice(0, 120),
      };
      if (isOwner()) pushActivityLog(nick, livePlayers[nick]);
    });
    updateSameGameStrip();
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
    const myNick = (getNick() || "").toLowerCase();
    return recentPlayers(maxAgeMs)
      .filter((p) => p && p.game === gid)
      .filter((p) => {
        // в полоске «с тобой» показываем других; себя добавим отдельно
        return String(p.nick || "").toLowerCase() !== myNick;
      });
  }

  function playersInThisGameAll(maxAgeMs) {
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
    if (isStealth() || !gid || gid === "portal") {
      if (old) old.remove();
      return;
    }
    const all = playersInThisGameAll();
    const myNick = (getNick() || "").toLowerCase();
    const others = all.filter((p) => String(p.nick || "").toLowerCase() !== myNick);
    // Полоску показываем только когда есть ДРУГИЕ игроки. Себе «ты играешь» не показываем.
    if (!others.length) {
      if (old) old.remove();
      return;
    }
    let el = old;
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-same-game";
      document.body.appendChild(el);
    }
    const ordered = all.slice().sort((a, b) => (a.at || 0) - (b.at || 0));
    const faces = ordered
      .slice(0, 8)
      .map((p) => {
        const mine = String(p.nick || "").toLowerCase() === myNick;
        const title = mine ? "Ты · " + p.nick : p.nick + (p.role === "owner" ? " · хозяин" : "");
        return (
          '<img src="' +
          faceUrl(p.nick) +
          '" title="' +
          escapeHtml(title) +
          '" alt="" style="' +
          (mine ? "box-shadow:0 0 0 2px #fbbf24;" : "") +
          '" />'
        );
      })
      .join("");
    const names = ordered
      .map((p, i) => {
        const mine = String(p.nick || "").toLowerCase() === myNick;
        const first = i === 0 ? " · первый" : "";
        if (mine) return "<b>Ты</b>" + first;
        return escapeHtml(p.nick) + (p.role === "owner" ? " (хозяин)" : "") + first;
      })
      .join(", ");
    el.innerHTML =
      '<span class="sg-faces">' +
      faces +
      "</span><span>В этой игре: " +
      names +
      " · <b>" +
      ordered.length +
      "</b></span>";
  }

  function clearIncomingNotes() {
    const kept = loadNotes().filter((n) => n.fromAdmin);
    saveNotes(kept);
  }

  function maybeRepaintPlayers() {
    updateSameGameStrip();
    if (isOwner()) updateWatchPanel();
    if (!open || (adminPage !== "players" && adminPage !== "live" && adminPage !== "profile" && adminPage !== "watch")) return;
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
    if (isStealth()) {
      try {
        removeSelfFromPresence();
      } catch (_) {
        /* ignore */
      }
      return;
    }
    if (!isOwner() && myBanStatus()) {
      enforceBanGate();
      return;
    }
    const nick = getNick();
    const gid = gameIdFromPath();
    const activity = getPlayerActivity();
    if (!nick) return;
    // Хозяин тоже светится в игре, чтобы гости видели обоих (и кто зашёл первым)
    if (isOwner()) {
      if (!gid || gid === "portal") {
        removeSelfFromPresence();
        broadcastRoster();
        return;
      }
      const ownerPayload = {
        type: "presence",
        nick,
        game: gid,
        gameTitle: gameTitle(gid),
        at: Date.now(),
        live: true,
        role: "owner",
        liveGuest: false,
        activity,
      };
      livePlayers[nick] = ownerPayload;
      const map = loadPresence();
      map[nick] = ownerPayload;
      storeSet(KEYS.presence, map);
      try {
        if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(ownerPayload);
      } catch {
        /* ignore */
      }
      broadcastRoster();
      updateSameGameStrip();
      return;
    }
    const payload = {
      type: "presence",
      nick,
      game: gid,
      gameTitle: gameTitle(gid),
      at: Date.now(),
      live: true,
      role: "guest",
      liveGuest: true,
      activity,
    };
    const map = loadPresence();
    map[nick] = payload;
    storeSet(KEYS.presence, map);
    livePlayers[nick] = payload;
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(payload);
    } catch {
      /* ignore */
    }
    sendPresenceToHost(payload);
    updateSameGameStrip();
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
        const pn = String(p.nick || "").toLowerCase();
        // хозяина в игре показываем всем
        if (p.role === "owner") return true;
        if (p.role === "guest" || p.liveGuest) {
          // себя в общем списке админки можно скрыть, но не выкидываем из «той же игры»
          return true;
        }
        if (isOwner() && pn === myNick) return false;
        if (!isOwner() && pn === myNick) return true;
        return true;
      })
      .sort((a, b) => (a.at || 0) - (b.at || 0));
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
          if (handleModerationMessage(data)) return;
          if (data.type === "chat") {
            chatAddLine(data);
            return;
          }
          if (data.type === "chat-clear") {
            chatClearLocal();
            return;
          }
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
          if (data.type === "roster") {
            applyRoster(data);
            return;
          }
          if (isOwner()) {
            upsertLivePlayer(data);
            if (data.nick) deliverQueuedGiftsForNick(data.nick);
            if (data.type === "register" && data.nick) {
              const reg = registerEverywhere(data.nick, data.game);
              if (reg.isNew) notifyOwnerAboutRegistration(reg.entry);
            }
            broadcastRoster();
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
      if (data.type === "chat") {
        handleChatMessage(data, conn);
        return;
      }
      if (data.type === "chat-clear") {
        handleChatClear(data, conn);
        return;
      }
      if (data.type === "presence" || data.nick) {
        const wasNew = !livePlayers[data.nick];
        upsertLivePlayer(data);
        deliverQueuedGiftsForNick(data.nick);
        const banned = data.nick ? banForNick(data.nick) : null;
        if (banned) {
          try {
            if (conn.open) {
              conn.send({
                type: "ban",
                nick: banned.nick,
                until: banned.until,
                reason: banned.reason,
                by: banned.by,
                at: banned.at,
              });
            }
          } catch {
            /* ignore */
          }
          showHubToast("🚫 Забаненный не пустит: " + data.nick);
        } else if (data.type === "register" && data.nick) {
          const reg = registerEverywhere(data.nick, data.game);
          if (reg.isNew) {
            notifyOwnerAboutRegistration(reg.entry);
          } else {
            showHubToast("Снова вошёл: " + data.nick + " · " + gameTitle(data.game || "portal"));
          }
        } else if (wasNew && data.nick) {
          showHubToast("Вошёл: " + data.nick + " · " + gameTitle(data.game || "portal"));
        }
        broadcastRoster();
      }
    });
    conn.on("close", () => {
      hostConnections.delete(conn);
      broadcastRoster();
    });
    conn.on("open", () => {
      try {
        conn.send({ type: "hello", role: "host" });
        conn.send({ type: "bans-sync", bans: activeBans() });
        conn.send({ type: "wipes-sync", wipes: storeGet(KEYS.wipes, []) });
        broadcastRoster();
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
        if (handleModerationMessage(data)) return;
        if (data.type === "chat") {
          chatAddLine(data);
          return;
        }
        if (data.type === "chat-clear") {
          chatClearLocal();
          return;
        }
        if (data.type === "roster") {
          applyRoster(data);
          return;
        }
        if (data.type === "presence" || (data.nick && data.game)) {
          upsertLivePlayer(data);
          updateSameGameStrip();
          return;
        }
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
.amal-hub-modal.wide{width:min(100%,720px)}
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
.amal-hub-table-wrap{margin-top:12px;overflow:auto;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.03)}
.amal-hub-table{width:100%;border-collapse:collapse;font-size:12px;min-width:520px}
.amal-hub-table th,.amal-hub-table td{padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:top}
.amal-hub-table th{font-size:11px;opacity:.7;font-weight:800;position:sticky;top:0;background:#12101cf2}
.amal-hub-table tr:last-child td{border-bottom:0}
.amal-hub-linkish{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;color:inherit;padding:0;cursor:pointer;font:inherit}
.amal-hub-linkish img{border-radius:50%;border:1px solid rgba(251,191,36,.4);background:#0f172a}
.amal-hub-ban-actions{display:flex;flex-wrap:wrap;gap:4px}
.amal-hub-ban-actions button{padding:6px 8px;font-size:11px;border-radius:10px}
.amal-hub-modal button.danger{background:rgba(185,28,28,.35);border-color:rgba(248,113,113,.45);color:#fecaca}
#amal-watch-panel{pointer-events:auto;position:fixed;left:12px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:2147483002;width:min(92vw,300px);border-radius:18px;border:1px solid rgba(251,191,36,.45);background:linear-gradient(165deg,#1a1528f5,#0b1020f8);color:#f8fafc;box-shadow:0 16px 40px rgba(0,0,0,.55);overflow:hidden;font-size:12px}
.amal-watch-head{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:rgba(251,191,36,.12);font-weight:800;font-size:11px}
.amal-watch-head button{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer}
.amal-watch-body{display:flex;gap:10px;padding:10px;align-items:flex-start}
.amal-watch-body img{width:56px;height:56px;border-radius:50%;border:2px solid rgba(251,191,36,.5);background:#0f172a;flex:0 0 auto}
.amal-watch-nick{font-weight:800;font-size:14px}
.amal-watch-game{opacity:.75;margin-top:2px}
.amal-watch-act{margin-top:6px;font-size:11px;line-height:1.35;color:#fde68a}
.amal-watch-on{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px}
.amal-watch-log{margin:0;padding:8px 10px 0;list-style:none;border-top:1px solid rgba(255,255,255,.08);max-height:88px;overflow:auto}
.amal-watch-log li{font-size:10px;opacity:.8;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06)}
.amal-watch-log .t{opacity:.55;margin-right:4px}
.amal-watch-actions{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px 10px;border-top:1px solid rgba(255,255,255,.08)}
.amal-watch-actions button{flex:1;min-width:72px;padding:8px 6px;font-size:11px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-weight:800}
.amal-hub-table .act-cell{max-width:140px;font-size:11px;opacity:.85;line-height:1.3}
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

    // Внутри игры хозяин входит через личный предмет-куб, а не через обычный чип.
    if (owner && !inGame) {
      html += `<button type="button" class="amal-hub-chip owner" data-amal="open">👑 Хозяин</button>`;
    } else if (!owner && nick) {
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
      html += `<div class="amal-hub-overlay" data-amal="backdrop"><div class="amal-hub-modal${
        view === "admin" && adminPage === "players" ? " wide" : ""
      }" data-amal="modal">`;
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
      const rows = playersTableRows();
      const onlineNow = rows.filter((r) => r.online).length;
      return `
        <div class="amal-hub-hero"><div class="badge">👥</div><div>
          <h2>Кто играет</h2>
          <p class="sub">Таблица игроков · бан / сброс прогресса</p>
        </div></div>
        <div style="margin-top:10px">${onlinePill} · в таблице: <b>${rows.length}</b> · онлайн: <b>${onlineNow}</b></div>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-table-wrap">
          <table class="amal-hub-table">
            <thead>
              <tr><th>Игрок</th><th>Игра</th><th>Что делает</th><th>Статус</th><th>Действия</th></tr>
            </thead>
            <tbody>
              ${
                rows.length
                  ? rows
                      .map((p) => {
                        const ban = banForNick(p.nick);
                        const banLabel = ban ? `бан ${formatBanLeft(ban.until)}` : "";
                        return `<tr>
                          <td>
                            <button type="button" class="amal-hub-linkish" data-amal="open-profile" data-nick="${escapeHtml(p.nick)}">
                              <img src="${faceUrl(p.nick)}" alt="" width="28" height="28" />
                              <b>${escapeHtml(p.nick)}</b>
                            </button>
                          </td>
                          <td>${escapeHtml(p.game || "—")}</td>
                          <td class="act-cell">${escapeHtml(p.activity || "—")}</td>
                          <td>${p.online ? '<span class="amal-hub-pill">● онлайн</span>' : '<span class="amal-hub-pill off">○ был</span>'}${
                            banLabel ? `<div class="meta" style="margin-top:4px">${escapeHtml(banLabel)}</div>` : ""
                          }</td>
                          <td>
                            <div class="amal-hub-ban-actions">
                              <button type="button" data-amal="watch-player" data-nick="${escapeHtml(p.nick)}">👁</button>
                              <button type="button" data-amal="open-profile" data-nick="${escapeHtml(p.nick)}">Профиль</button>
                              ${
                                fullOwner
                                  ? `<button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="1">1ч</button>
                              <button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="5">5ч</button>
                              <button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="10">10ч</button>
                              <button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="24">1д</button>
                              ${
                                ban
                                  ? `<button type="button" data-amal="unban-player" data-nick="${escapeHtml(p.nick)}">Снять бан</button>`
                                  : ""
                              }
                              <button type="button" class="danger" data-amal="wipe-player" data-nick="${escapeHtml(p.nick)}">Сброс всего</button>`
                                  : ""
                              }
                            </div>
                          </td>
                        </tr>`;
                      })
                      .join("")
                  : `<tr><td colspan="5" class="meta">Пока никого нет. Гость должен открыть игру с ником (другое окно/телефон) или жми «Тестовый гость».</td></tr>`
              }
            </tbody>
          </table>
        </div>
        <div class="amal-hub-row" style="margin-top:10px">
          <button type="button" class="primary" data-amal="admin-test-guest">＋ Тестовый гость</button>
          <button type="button" data-amal="admin-open-guest">Открыть окно гостя</button>
          <button type="button" data-amal="admin-clear-presence">Очистить список</button>
        </div>
        ${back}`;
    }

    if (adminPage === "watch" && fullOwner) {
      const nick = watchNick || profileNick || "";
      const p = findPlayerByNick(nick) || { nick, game: "portal", gameTitle: "—", activity: "—", at: 0 };
      const online = !!(p.live || (p.at && Date.now() - p.at < 120000));
      const log = (activityLog[nick] || []).slice(0, MAX_ACTIVITY_LOG);
      const ban = banForNick(nick);
      return `
        <div class="amal-hub-hero"><div class="badge">👁</div><div>
          <h2>Слежу за игроком</h2>
          <p class="sub">Лицо · игра · что делает · история</p>
        </div></div>
        <div class="amal-hub-profile">
          <img src="${faceUrl(nick, Date.now())}" alt="" />
          <div class="nm">${escapeHtml(nick || "—")}</div>
          <div class="gm">${escapeHtml(p.gameTitle || p.game || "—")}</div>
          <div class="sub" style="margin-top:8px">${escapeHtml(String(p.activity || "—"))}</div>
          <div class="on"><span class="amal-hub-pill ${online ? "" : "off"}">${online ? "● онлайн" : "○ оффлайн"}</span>${
            ban ? `<span class="amal-hub-pill off">🚫 бан ${escapeHtml(formatBanLeft(ban.until))}</span>` : ""
          }</div>
        </div>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <ul class="amal-hub-list">${
          log.length
            ? log
                .map(
                  (row) =>
                    `<li><div class="meta">${fmtTime(row.at)} · ${escapeHtml(row.game)}</div>${escapeHtml(row.activity)}</li>`,
                )
                .join("")
            : `<li class="meta">История появится, когда игрок что-то делает</li>`
        }</ul>
        <div class="amal-hub-row">
          <button type="button" data-amal="watch-open" data-nick="${escapeHtml(nick)}" style="flex:1">В его игру</button>
          <button type="button" data-amal="open-profile" data-nick="${escapeHtml(nick)}">Профиль</button>
        </div>
        <div class="amal-hub-row">
          <button type="button" data-amal="watch-stop" style="flex:1">Стоп слежку</button>
          <button type="button" data-amal="admin-live">Живая карта</button>
        </div>
        <div class="amal-hub-row"><button type="button" data-amal="admin-players" style="flex:1">← Кто играет</button><button type="button" data-amal="close">Закрыть</button></div>`;
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
          <div class="sub" style="margin-top:8px">Сейчас: <b>${escapeHtml(String(p.activity || "—"))}</b></div>
        </div>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row" style="margin-top:12px">
          <button type="button" class="primary" data-amal="watch-player" data-nick="${escapeHtml(
            p.nick,
          )}" style="flex:1">👁 Следить</button>
          <button type="button" data-amal="watch-open" data-nick="${escapeHtml(p.nick)}">В его игру</button>
        </div>
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
        <div class="amal-hub-row" style="margin-top:10px">
          <button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="1">Бан 1ч</button>
          <button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="5">5ч</button>
          <button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="10">10ч</button>
          <button type="button" data-amal="ban-player" data-nick="${escapeHtml(p.nick)}" data-hours="24">1д</button>
          <button type="button" data-amal="unban-player" data-nick="${escapeHtml(p.nick)}">Снять бан</button>
          <button type="button" class="danger" data-amal="wipe-player" data-nick="${escapeHtml(p.nick)}">Сброс всего</button>
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
                    <div class="act" style="font-size:10px;opacity:.8;margin-top:4px;max-height:32px;overflow:hidden">${escapeHtml(
                      String(p.activity || "В игре"),
                    )}</div>
                    <div class="on">${online ? "● сейчас играет" : "○ был недавно"}</div>
                    <div class="amal-hub-row" style="margin-top:8px;justify-content:center">
                      <button type="button" data-amal="watch-player" data-nick="${escapeHtml(p.nick)}">👁</button>
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
        <button type="button" data-amal="owner-abilities"><span class="ico">⚡</span><b>Все способности</b><span>Сила · скорость · монеты</span></button>
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
        if (act === "close") {
          if (view === "updates") storeSet(KEYS.changelogSeen, CHANGELOG[0].id);
          closeUi();
        }
        if (act === "owner-abilities") {
          closeUi();
          const powers = document.getElementById("amal-powers-panel");
          if (powers) powers.classList.add("open");
          else showHubToast("⚡ Способности загружаются");
        }
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
        if (act === "watch-player") {
          if (!isOwner()) return;
          const nick = el.getAttribute("data-nick") || "";
          const res = startWatch(nick);
          if (!res.ok) {
            err = res.error || "";
            msg = "";
          } else {
            err = "";
            msg = "Слежу за «" + nick + "» — панель слева внизу";
            profileNick = nick;
            adminPage = "watch";
          }
          open = true;
          view = "admin";
          paint();
          return;
        }
        if (act === "watch-open") {
          if (!isOwner()) return;
          openWatchGame(el.getAttribute("data-nick") || profileNick || watchNick);
          return;
        }
        if (act === "watch-stop") {
          if (!isOwner()) return;
          stopWatch();
          msg = "Слежка выключена";
          if (adminPage === "watch") adminPage = "players";
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
        if (act === "ban-player") {
          if (!isOwner()) return;
          const nick = el.getAttribute("data-nick") || "";
          const hours = Number(el.getAttribute("data-hours") || 1);
          const res = banPlayer(nick, hours);
          err = res.ok ? "" : res.error || "";
          msg = res.ok
            ? "Бан «" + nick + "» на " + (hours === 24 ? "1 день" : hours + " ч")
            : "";
          if (res.ok) showHubToast("🚫 " + msg);
          adminPage = adminPage === "profile" ? "profile" : "players";
          paint();
          return;
        }
        if (act === "unban-player") {
          if (!isOwner()) return;
          const nick = el.getAttribute("data-nick") || "";
          const res = unbanPlayer(nick);
          err = res.ok ? "" : res.error || "";
          msg = res.ok ? "Бан снят: " + nick : "";
          if (res.ok) showHubToast("✅ " + msg);
          paint();
          return;
        }
        if (act === "wipe-player") {
          if (!isOwner()) return;
          const nick = el.getAttribute("data-nick") || "";
          let ok = false;
          try {
            ok = global.confirm(
              "Сбросить весь прогресс игрока «" + nick + "» во всех играх? Это нельзя отменить."
            );
          } catch {
            ok = true;
          }
          if (!ok) return;
          const res = wipePlayerProgress(nick);
          err = res.ok ? "" : res.error || "";
          msg = res.ok ? "Прогресс сброшен: " + nick : "";
          if (res.ok) showHubToast("🧹 " + msg);
          paint();
          return;
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

  const CUBE_KEY = "amal-secret-cube-v2";

  function cubeKey() {
    return CUBE_KEY + ":" + (gameIdFromPath() || "portal");
  }

  function cubeState() {
    try {
      return localStorage.getItem(cubeKey()) || "";
    } catch (_) {
      return "";
    }
  }

  function setCubeState(value) {
    try {
      localStorage.setItem(cubeKey(), value);
    } catch (_) {
      /* ignore */
    }
  }

  function ensureCubeStyles() {
    if (document.getElementById("amal-cube-css")) return;
    const s = document.createElement("style");
    s.id = "amal-cube-css";
    s.textContent =
      "#amal-cube-pickup{position:fixed;right:16px;top:42dvh;z-index:2147483002;width:68px;height:68px;" +
      "display:grid;place-items:center;border-radius:20px;cursor:pointer;color:#fff7d6;font-size:34px;" +
      "background:radial-gradient(circle at 38% 28%,#fde68a,#b45309 58%,#451a03);border:2px solid #fbbf24;" +
      "box-shadow:0 0 0 5px rgba(251,191,36,.16),0 10px 28px rgba(0,0,0,.48);" +
      "animation:amalCubeGlow 1.6s ease-in-out infinite;transition:transform .2s;touch-action:manipulation}" +
      "#amal-cube-pickup::after{content:'ТВОЙ ПРЕДМЕТ';position:absolute;top:74px;right:0;white-space:nowrap;" +
      "padding:4px 7px;border-radius:7px;background:rgba(15,23,42,.92);color:#fde68a;font:900 9px system-ui,sans-serif;letter-spacing:.04em}" +
      "#amal-cube-pickup:hover,#amal-cube-pickup:active{transform:scale(1.1)}" +
      "@keyframes amalCubeGlow{0%,100%{filter:brightness(1);box-shadow:0 0 8px rgba(251,191,36,.5),0 10px 28px rgba(0,0,0,.48)}50%{filter:brightness(1.2);box-shadow:0 0 28px rgba(251,191,36,.95),0 10px 28px rgba(0,0,0,.48)}}" +
      "#amal-cube-activate{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483003;" +
      "width:min(310px,calc(100vw - 28px));padding:18px;border-radius:22px;text-align:center;color:#fff7ed;" +
      "background:linear-gradient(160deg,#291804,#0f172a);border:2px solid #fbbf24;box-shadow:0 24px 70px rgba(0,0,0,.65);font-family:system-ui,sans-serif}" +
      "#amal-cube-activate .cube{font-size:48px;margin-bottom:6px}#amal-cube-activate b{display:block;font-size:18px;margin-bottom:5px}" +
      "#amal-cube-activate p{margin:0 0 13px;color:#fde68a;font:700 12px/1.4 system-ui,sans-serif}" +
      "#amal-cube-activate button{width:100%;min-height:52px;border:0;border-radius:14px;cursor:pointer;background:linear-gradient(135deg,#fbbf24,#f97316);color:#1c1002;font:950 14px system-ui,sans-serif;letter-spacing:.05em;touch-action:manipulation}" +
      "#amal-cube-btn{position:fixed;right:16px;top:42dvh;z-index:2147483002;width:62px;height:62px;padding:0;border:0;" +
      "background:transparent;cursor:pointer;perspective:320px;touch-action:manipulation;filter:drop-shadow(0 10px 20px rgba(0,0,0,.5))}" +
      "#amal-cube-btn .c3d{position:absolute;inset:7px;transform-style:preserve-3d;animation:amalCubeSpin 7s linear infinite}" +
      "#amal-cube-btn:hover .c3d,#amal-cube-btn:active .c3d{animation-duration:2.2s}" +
      "#amal-cube-btn .c3d .f{position:absolute;width:48px;height:48px;display:grid;place-items:center;font-size:24px;" +
      "border:2px solid var(--edge,#fbbf24);border-radius:9px;background:var(--face,linear-gradient(160deg,#92400e,#422006));" +
      "box-shadow:0 0 12px var(--glow,rgba(245,158,11,.5)) inset;color:#fff;backface-visibility:hidden}" +
      "#amal-cube-btn .c3d .f0{transform:translateZ(24px)}#amal-cube-btn .c3d .f1{transform:rotateY(180deg) translateZ(24px)}" +
      "#amal-cube-btn .c3d .f2{transform:rotateY(90deg) translateZ(24px)}#amal-cube-btn .c3d .f3{transform:rotateY(-90deg) translateZ(24px)}" +
      "#amal-cube-btn .c3d .f4{transform:rotateX(90deg) translateZ(24px)}#amal-cube-btn .c3d .f5{transform:rotateX(-90deg) translateZ(24px)}" +
      "#amal-cube-btn.cube-glitch .c3d{animation:amalCubeSpin 7s linear infinite,amalCubeGlitch .5s steps(2) infinite}" +
      /* RGB · нестабильный: 3D сохраняется (крутится быстрее), а глитч/лаг/хрома — на обёртке, чтобы не сплющивать куб */
      "#amal-cube-btn.cube-rgb .c3d{animation:amalCubeSpin 6s linear infinite}" +
      "#amal-cube-btn.cube-rgb .c3d .f{text-shadow:-2px 0 rgba(255,0,80,.9),2px 0 rgba(0,229,255,.9);box-shadow:0 0 18px rgba(0,229,255,.5) inset}" +
      /* глитч короткой вспышкой раз в 7 секунд — «нестабильный», но экран не мигает */
      "#amal-cube-btn.cube-rgb{animation:amalCubeRgbFlick 7s ease-in-out infinite}" +
      "@keyframes amalCubeRgbFlick{0%,86%{filter:hue-rotate(0deg) saturate(1.3) drop-shadow(0 10px 20px rgba(0,0,0,.5));transform:translate(0,0)}" +
      "89%{filter:hue-rotate(150deg) saturate(1.9) drop-shadow(0 0 12px rgba(0,229,255,.7));transform:translate(2px,-1px)}" +
      "92%{filter:hue-rotate(300deg) saturate(1.9) drop-shadow(0 0 12px rgba(255,0,80,.6));transform:translate(-2px,1px)}" +
      "95%,100%{filter:hue-rotate(360deg) saturate(1.3) drop-shadow(0 10px 20px rgba(0,0,0,.5));transform:translate(0,0)}}" +
      /* «разрыв» сбоку: узкая RGB-полоса изредка съезжает вбок, будто картинку рвёт */
      "#amal-cube-btn.cube-rgb::before{content:'';position:absolute;left:-7px;right:-7px;top:38%;height:8px;z-index:5;pointer-events:none;border-radius:2px;" +
      "background:linear-gradient(90deg,rgba(255,0,80,.85),rgba(255,255,255,.65),rgba(0,229,255,.85));mix-blend-mode:screen;opacity:0;" +
      "animation:amalCubeTear 9s ease-in-out infinite}" +
      "@keyframes amalCubeTear{0%,64%{opacity:0;transform:translateX(0);top:38%}" +
      "66%{opacity:.9;transform:translateX(-8px);top:34%}" +
      "68%{opacity:.7;transform:translateX(7px);top:52%}" +
      "70%{opacity:.9;transform:translateX(-5px);top:44%}" +
      "72%,87%{opacity:0;transform:translateX(0);top:44%}" +
      "89%{opacity:.85;transform:translateX(6px);top:60%}" +
      "91%,100%{opacity:0;transform:translateX(0);top:38%}}" +
      "#amal-cube-btn::after{content:attr(data-label);position:absolute;top:66px;right:0;white-space:nowrap;padding:3px 7px;border-radius:7px;" +
      "background:rgba(15,23,42,.92);color:#fde68a;font:900 9px system-ui,sans-serif;max-width:130px;overflow:hidden;text-overflow:ellipsis}" +
      "@keyframes amalCubeSpin{0%{transform:rotateX(-22deg) rotateY(0)}100%{transform:rotateX(-22deg) rotateY(360deg)}}" +
      "@keyframes amalCubeGlitch{0%{filter:hue-rotate(0) saturate(1)}50%{filter:hue-rotate(80deg) saturate(2)}100%{filter:hue-rotate(0) saturate(1)}}" +
      "#amal-cube-story{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483004;" +
      "width:min(330px,calc(100vw - 28px));padding:20px;border-radius:22px;text-align:center;color:#fff7ed;" +
      "background:linear-gradient(160deg,#291804,#0f172a);border:2px solid #fbbf24;box-shadow:0 24px 70px rgba(0,0,0,.7);font-family:system-ui,sans-serif}" +
      "#amal-cube-story .cube{font-size:46px;margin-bottom:6px}#amal-cube-story b{display:block;font-size:18px;margin-bottom:8px;color:#fde68a}" +
      "#amal-cube-story p{margin:0 0 14px;color:#fde68a;font:600 12.5px/1.55 system-ui,sans-serif}" +
      "#amal-cube-story button{width:100%;min-height:50px;border:0;border-radius:14px;cursor:pointer;background:linear-gradient(135deg,#fbbf24,#f97316);color:#1c1002;font:950 14px system-ui,sans-serif;letter-spacing:.04em;touch-action:manipulation}" +
      "@media(max-width:480px){#amal-cube-pickup,#amal-cube-btn{right:12px;top:38dvh}}" +
      /* боковые панели — не перекрывают центр, можно играть и таскать их */
      "#amal-cube-dash{position:fixed;inset:0;z-index:2147483002;pointer-events:none;font-family:system-ui,sans-serif}" +
      "#amal-cube-dash .acd-col{position:absolute;top:56px;bottom:10px;display:flex;flex-direction:column;gap:10px;width:196px;max-width:46vw;overflow:visible;pointer-events:none}" +
      "#amal-cube-dash .acd-col.left{left:10px}#amal-cube-dash .acd-col.right{right:10px}" +
      "#amal-cube-dash .acd-panel{pointer-events:auto;position:relative;background:linear-gradient(168deg,rgba(31,18,3,.97),rgba(8,11,22,.97));" +
      "border:1.5px solid rgba(251,191,36,.75);border-radius:16px;padding:0 0 9px;color:#fff7ed;" +
      "box-shadow:0 0 0 1px rgba(255,255,255,.05) inset,0 0 22px rgba(251,191,36,.16),0 14px 34px rgba(0,0,0,.6);overflow:hidden}" +
      "#amal-cube-dash .acd-panel.acd-free{position:fixed;width:196px;max-width:46vw;z-index:5}" +
      "#amal-cube-dash .acd-panel.acd-dragging{opacity:.92;box-shadow:0 0 0 2px #fbbf24,0 20px 44px rgba(0,0,0,.7)}" +
      "#amal-cube-dash .acd-h{display:flex;align-items:center;gap:5px;padding:8px 9px;margin-bottom:7px;cursor:grab;touch-action:none;" +
      "background:linear-gradient(100deg,rgba(251,191,36,.32),rgba(249,115,22,.12));border-bottom:1px solid rgba(251,191,36,.32)}" +
      "#amal-cube-dash .acd-h:active{cursor:grabbing}" +
      "#amal-cube-dash .acd-h .grip{color:rgba(253,230,138,.8);font-size:12px;letter-spacing:-1px}" +
      "#amal-cube-dash .acd-h b{flex:1;font:900 11.5px system-ui,sans-serif;letter-spacing:.05em;color:#fde68a;text-shadow:0 0 10px rgba(251,191,36,.5)}" +
      "#amal-cube-dash .acd-h button{width:24px;height:24px;flex:0 0 auto;border:0;border-radius:8px;background:rgba(0,0,0,.4);color:#fde68a;font-size:12px;cursor:pointer;line-height:1;touch-action:manipulation}" +
      "#amal-cube-dash .acd-body{padding:0 9px}" +
      "#amal-cube-dash .acd-panel.acd-min{padding-bottom:0}#amal-cube-dash .acd-panel.acd-min .acd-h{margin-bottom:0}" +
      "#amal-cube-dash .acd-panel.acd-min .acd-body{display:none}" +
      "#amal-cube-dash .acd-fxgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:2px}" +
      "#amal-cube-dash .acd-fx{aspect-ratio:1;border:1px solid rgba(251,191,36,.28);border-radius:12px;cursor:pointer;font-size:22px;" +
      "background:radial-gradient(circle at 40% 30%,rgba(251,191,36,.25),rgba(0,0,0,.35));color:#fff;touch-action:manipulation;transition:transform .12s}" +
      "#amal-cube-dash .acd-fx:active{transform:scale(.9)}" +
      "#amal-cube-dash .acd-btn{display:block;width:100%;margin:5px 0 0;min-height:42px;border:1px solid rgba(255,255,255,.09);border-radius:11px;cursor:pointer;" +
      "background:linear-gradient(150deg,rgba(52,211,153,.24),rgba(16,185,129,.1));color:#d1fae5;font:800 12.5px system-ui,sans-serif;touch-action:manipulation}" +
      "#amal-cube-dash .acd-btn:active{transform:scale(.97)}" +
      "#amal-cube-dash .acd-btn.amber{background:linear-gradient(150deg,rgba(251,191,36,.26),rgba(217,119,6,.12));color:#fde68a}" +
      "#amal-cube-dash .acd-btn.max{background:linear-gradient(135deg,#fbbf24,#f97316);color:#1c1002;font-weight:950;letter-spacing:.04em;box-shadow:0 0 16px rgba(251,191,36,.45)}" +
      "#amal-cube-dash .acd-btn.done{background:rgba(255,255,255,.07);color:#94a3b8;cursor:default}" +
      "#amal-cube-dash .acd-stats{display:flex;gap:6px;margin-bottom:6px}" +
      "#amal-cube-dash .acd-stat{flex:1;text-align:center;background:rgba(255,255,255,.07);border-radius:10px;padding:6px 2px}" +
      "#amal-cube-dash .acd-stat .n{font:900 18px system-ui,sans-serif;color:#fde68a}#amal-cube-dash .acd-stat .l{font-size:8px;opacity:.7;text-transform:uppercase;letter-spacing:.05em}" +
      "#amal-cube-dash .acd-list{font-size:11px;line-height:1.5;max-height:118px;overflow:auto;color:#e2e8f0;background:rgba(0,0,0,.28);border-radius:9px;padding:6px 8px}" +
      "#amal-cube-dash input.acd-amt{width:100%;box-sizing:border-box;border:1px solid rgba(251,191,36,.35);border-radius:10px;padding:9px;font:900 14px system-ui,sans-serif;background:#080c17;color:#fde68a;margin-bottom:5px;text-align:center}" +
      "#amal-cube-dash .acd-presets{display:flex;flex-wrap:wrap;gap:5px}" +
      "#amal-cube-dash .acd-presets button{flex:1 0 auto;min-height:28px;padding:5px 7px;border:0;border-radius:999px;background:rgba(251,191,36,.18);color:#fde68a;font:800 10.5px system-ui,sans-serif;cursor:pointer;touch-action:manipulation}" +
      "#amal-cube-dash .acd-scroll{max-height:190px;overflow:auto;margin-top:4px;display:flex;flex-direction:column;gap:4px;padding-right:2px}" +
      "#amal-cube-dash .acd-scroll .acd-btn{margin:0}" +
      "#amal-cube-dash .acd-emgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-top:2px}" +
      "#amal-cube-dash .acd-emgrid .acd-fx{aspect-ratio:1;font-size:19px}" +
      ".amal-big-emote{position:fixed;left:50%;top:44%;transform:translate(-50%,-50%);font-size:clamp(96px,30vw,260px);line-height:1;z-index:2147483041;pointer-events:none;user-select:none;filter:drop-shadow(0 10px 26px rgba(0,0,0,.55))}" +
      "@media(max-width:480px){#amal-cube-dash .acd-col{width:154px;top:52px}#amal-cube-dash .acd-panel.acd-free{width:154px}" +
      "#amal-cube-dash .acd-emgrid{grid-template-columns:repeat(5,1fr)}" +
      "#amal-cube-dash .acd-btn{min-height:38px;font-size:11.5px}#amal-cube-dash .acd-stat .n{font-size:16px}}";
    document.head.appendChild(s);
  }

  function removeCubeEl(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function runCubeAbility(id) {
    try {
      if (global.AmalPowers && AmalPowers.runAbility) AmalPowers.runAbility(id);
      else showHubToast("⚡ Силы загружаются");
    } catch (_) {
      /* ignore */
    }
  }

  function cubeGive(kind) {
    try {
      const src = document.getElementById("amal-cube-amount");
      const inp = document.getElementById("amal-powers-amount");
      if (inp) inp.value = (src && src.value) || "100000";
      if (global.AmalPowers && AmalPowers.giveAmount) AmalPowers.giveAmount(kind);
      else showHubToast("💰 Силы загружаются");
    } catch (_) {
      /* ignore */
    }
  }

  /* ── Весёлые эффекты для куба — сыпем прямо поверх игры, играть не мешает ── */
  function ensureFxLayer() {
    let layer = document.getElementById("amal-fx-layer");
    if (layer) return layer;
    if (!document.getElementById("amal-fx-css")) {
      const st = document.createElement("style");
      st.id = "amal-fx-css";
      st.textContent =
        "#amal-fx-layer{position:fixed;inset:0;z-index:2147483040;pointer-events:none;overflow:hidden}" +
        "#amal-fx-layer .amal-fx-p{position:fixed;top:0;left:0;will-change:transform,opacity;user-select:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}" +
        "#amal-fx-flash{position:fixed;inset:0;z-index:2147483039;pointer-events:none;opacity:0;mix-blend-mode:screen}" +
        "#amal-vibe{position:fixed;inset:0;z-index:2147483001;pointer-events:none;display:none}" +
        "#amal-vibe.amal-vibe-gold{background:radial-gradient(circle at 50% 30%,rgba(255,215,90,.6),rgba(180,120,0,.4));mix-blend-mode:overlay}" +
        "#amal-vibe.amal-vibe-night{background:linear-gradient(180deg,rgba(8,12,44,.55),rgba(2,4,20,.68));mix-blend-mode:multiply}" +
        "#amal-vibe.amal-vibe-neon{background:linear-gradient(120deg,rgba(255,0,200,.42),rgba(0,220,255,.42));mix-blend-mode:overlay}" +
        "#amal-vibe.amal-vibe-rainbow{background:linear-gradient(120deg,#ff004c,#ff9500,#ffe600,#00e676,#00b0ff,#d500f9);background-size:300% 300%;opacity:.35;mix-blend-mode:overlay;animation:amalVibeShift 6s linear infinite}" +
        "@keyframes amalVibeShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}";
      document.head.appendChild(st);
    }
    layer = document.createElement("div");
    layer.id = "amal-fx-layer";
    document.body.appendChild(layer);
    return layer;
  }

  function fxPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function fxRain(emojis, count) {
    const layer = ensureFxLayer();
    const W = window.innerWidth;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "amal-fx-p";
      s.textContent = fxPick(emojis);
      s.style.fontSize = 16 + Math.random() * 24 + "px";
      layer.appendChild(s);
      const startX = Math.random() * W;
      const drift = (Math.random() * 2 - 1) * 120;
      const rot = (Math.random() * 2 - 1) * 540;
      const dur = 1900 + Math.random() * 1900;
      s.animate(
        [
          { transform: "translate(" + startX + "px,-8vh) rotate(0deg)", opacity: 1 },
          { transform: "translate(" + (startX + drift) + "px,108vh) rotate(" + rot + "deg)", opacity: 1 },
        ],
        { duration: dur, delay: Math.random() * 500, easing: "linear" },
      ).onfinish = () => s.remove();
    }
  }

  function fxBurst(emojis, count) {
    const layer = ensureFxLayer();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.42;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "amal-fx-p";
      s.textContent = fxPick(emojis);
      s.style.fontSize = 16 + Math.random() * 20 + "px";
      layer.appendChild(s);
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 230;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      const dur = 900 + Math.random() * 900;
      s.animate(
        [
          { transform: "translate(" + cx + "px," + cy + "px) scale(.4)", opacity: 1 },
          { transform: "translate(" + (cx + dx) + "px," + (cy + dy + 60) + "px) scale(1.1)", opacity: 1, offset: 0.7 },
          { transform: "translate(" + (cx + dx * 1.1) + "px," + (cy + dy + 140) + "px) scale(.9)", opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(.15,.7,.4,1)" },
      ).onfinish = () => s.remove();
    }
  }

  function fxDisco() {
    ensureFxLayer();
    let flash = document.getElementById("amal-fx-flash");
    if (!flash) {
      flash = document.createElement("div");
      flash.id = "amal-fx-flash";
      document.body.appendChild(flash);
    }
    const colors = ["#ff3b6b", "#ffd23b", "#3bff88", "#3bc9ff", "#c23bff", "#ff8a3b"];
    let n = 0;
    const iv = setInterval(() => {
      flash.style.background = fxPick(colors);
      flash.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 260, easing: "ease-out" });
      if (++n >= 10) clearInterval(iv);
    }, 240);
    fxBurst(["✨", "⭐", "🌟", "💫"], 16);
  }

  function cubeFx(kind) {
    try {
      if (kind === "confetti") {
        fxRain(["🎉", "🎊", "✨", "🟡", "🔴", "🟢", "🔵", "🟣"], 46);
        fxSound("applause");
      } else if (kind === "coins") {
        fxRain(["💰", "🪙", "⭐", "💎"], 40);
        fxSound("coin");
      } else if (kind === "stars") {
        fxRain(["⭐", "🌟", "✨", "💫"], 40);
        fxSound("coin");
      } else if (kind === "hearts") fxRain(["💚", "💛", "❤️", "💖", "💕"], 38);
      else if (kind === "fireworks") {
        fxBurst(["🎆", "✨", "⭐", "💥", "🌟"], 30);
        setTimeout(() => fxBurst(["🎇", "✨", "💫"], 24), 350);
        setTimeout(() => fxBurst(["🎆", "⭐", "💥"], 24), 700);
        fxSound("boom");
        setTimeout(() => fxSound("fanfare"), 300);
      } else if (kind === "disco") {
        fxDisco();
        fxSound("beat");
      }
    } catch (_) {
      /* ignore */
    }
  }

  /* ── Звук куба: синтез через WebAudio, без файлов, работает в любой игре ── */
  let _amalActx = null;
  function fxAudioCtx() {
    try {
      if (!_amalActx) _amalActx = new (window.AudioContext || window.webkitAudioContext)();
      if (_amalActx.state === "suspended") _amalActx.resume();
      return _amalActx;
    } catch (_) {
      return null;
    }
  }

  function fxBeep(ctx, freq, start, dur, type, gain) {
    const t0 = ctx.currentTime + start;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  function fxSound(kind) {
    const ctx = fxAudioCtx();
    if (!ctx) return;
    try {
      if (kind === "coin") {
        fxBeep(ctx, 988, 0, 0.08, "square", 0.16);
        fxBeep(ctx, 1319, 0.06, 0.12, "square", 0.16);
      } else if (kind === "fanfare") {
        [523, 659, 784, 1047].forEach((f, i) => fxBeep(ctx, f, i * 0.12, 0.2, "triangle", 0.2));
      } else if (kind === "jackpot") {
        [523, 659, 784, 1047, 1319, 1047, 1319].forEach((f, i) => fxBeep(ctx, f, i * 0.09, 0.2, "triangle", 0.22));
      } else if (kind === "boom") {
        fxBeep(ctx, 90, 0, 0.35, "sawtooth", 0.32);
        fxBeep(ctx, 55, 0.02, 0.42, "sine", 0.3);
      } else if (kind === "laser") {
        const t0 = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(1200, t0);
        o.frequency.exponentialRampToValueAtTime(180, t0 + 0.25);
        g.gain.setValueAtTime(0.2, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t0);
        o.stop(t0 + 0.3);
      } else if (kind === "applause") {
        for (let i = 0; i < 20; i++) fxBeep(ctx, 400 + Math.random() * 3200, Math.random() * 0.5, 0.05, "square", 0.04);
      } else if (kind === "beat") {
        [0, 0.2, 0.4, 0.6].forEach((t) => fxBeep(ctx, 120, t, 0.12, "sine", 0.3));
      }
    } catch (_) {
      /* ignore */
    }
  }

  /* ── Визуальный «стиль игры» — цветной слой поверх игры (панели не красит) ── */
  function ensureVibeLayer() {
    let v = document.getElementById("amal-vibe");
    if (v) return v;
    ensureFxLayer();
    v = document.createElement("div");
    v.id = "amal-vibe";
    v.style.display = "none";
    document.body.appendChild(v);
    return v;
  }

  function applyVibe(kind) {
    const v = ensureVibeLayer();
    const map = { gold: "amal-vibe-gold", night: "amal-vibe-night", rainbow: "amal-vibe-rainbow", neon: "amal-vibe-neon" };
    v.className = "";
    if (kind === "off" || !map[kind]) {
      v.style.display = "none";
      try {
        localStorage.removeItem("amal-vibe-v1");
      } catch (_) {
        /* ignore */
      }
      showHubToast("🎨 Обычный вид");
      return;
    }
    v.classList.add(map[kind]);
    v.style.display = "block";
    try {
      localStorage.setItem("amal-vibe-v1", kind);
    } catch (_) {
      /* ignore */
    }
  }

  function restoreVibe() {
    let saved = "";
    try {
      saved = localStorage.getItem("amal-vibe-v1") || "";
    } catch (_) {
      saved = "";
    }
    if (saved) applyVibe(saved);
  }

  /* ── Мистери-бокс — случайный джекпот монет с эффектом и звуком ── */
  function cubeMystery() {
    const rewards = [1000, 5000, 25000, 100000, 500000, 1000000, 999999999];
    const amt = fxPick(rewards);
    try {
      const src = document.getElementById("amal-cube-amount");
      if (src) src.value = String(amt);
    } catch (_) {
      /* ignore */
    }
    cubeGive("coins");
    const jackpot = amt >= 1000000;
    fxSound(jackpot ? "jackpot" : "coin");
    cubeFx(jackpot ? "fireworks" : "coins");
    let pretty = String(amt);
    try {
      pretty = amt.toLocaleString("ru-RU");
    } catch (_) {
      /* ignore */
    }
    showHubToast("🎁 Мистери-бокс: +" + pretty + " 💰" + (jackpot ? " · ДЖЕКПОТ!" : ""));
  }

  /* ── Панель «Все игры» — быстрый переход в любую игру прямо из куба ── */
  function gameHref(id) {
    const here = gameIdFromPath();
    const base = here === "portal" ? "./" : "../";
    if (id === "__portal") return base;
    return base + id + "/";
  }

  function cubeGamesHtml() {
    const here = gameIdFromPath();
    let list = [];
    try {
      list = GRANTABLE_GAMES.slice();
    } catch (_) {
      list = [];
    }
    const items = list
      .filter((g) => g && g.id !== here)
      .map((g) => '<button type="button" class="acd-btn" data-game="' + escapeHtml(g.id) + '">🎮 ' + escapeHtml(g.name || g.id) + "</button>")
      .join("");
    return (
      '<button type="button" class="acd-btn amber" data-game="__portal">🏠 Каталог всех игр</button>' +
      '<div class="acd-scroll">' + (items || '<div style="opacity:.7;font-size:11px;padding:4px">пусто</div>') + "</div>"
    );
  }

  /* ── Эмоции: большой эмодзи на весь экран (не мешает игре) + запоминаем для фото ── */
  const CUBE_EMOTES = ["😀", "😎", "😍", "🤩", "😂", "😮", "😢", "😡", "🥳", "😴", "🤔", "😱", "👍", "👎", "❤️", "🔥", "💯", "🎉", "👑", "🌈", "💪", "✌️", "🙌", "💖"];
  let _amalLastEmote = "😎";

  function cubeEmotesHtml() {
    const grid = CUBE_EMOTES.map((e) => '<button type="button" class="acd-fx" data-emote="' + e + '" title="Показать эмоцию">' + e + "</button>").join("");
    return (
      '<div class="acd-emgrid">' + grid + "</div>" +
      '<button type="button" class="acd-btn amber" data-cube="emote-face">🎲 Эту эмоцию на куб</button>' +
      '<button type="button" class="acd-btn" data-cube="photo">📸 Сделать фото</button>'
    );
  }

  function bigEmote(emoji) {
    ensureFxLayer();
    _amalLastEmote = emoji;
    const s = document.createElement("div");
    s.className = "amal-big-emote";
    s.textContent = emoji;
    document.body.appendChild(s);
    s.animate(
      [
        { transform: "translate(-50%,-50%) scale(.2) rotate(-14deg)", opacity: 0 },
        { transform: "translate(-50%,-50%) scale(1.18) rotate(6deg)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1, offset: 0.72 },
        { transform: "translate(-50%,-62%) scale(.85) rotate(-3deg)", opacity: 0 },
      ],
      { duration: 1500, easing: "cubic-bezier(.2,.85,.3,1)" },
    ).onfinish = () => s.remove();
  }

  function fxPhotoFlash() {
    ensureFxLayer();
    let flash = document.getElementById("amal-fx-flash");
    if (!flash) {
      flash = document.createElement("div");
      flash.id = "amal-fx-flash";
      document.body.appendChild(flash);
    }
    flash.style.background = "#fff";
    flash.style.mixBlendMode = "normal";
    flash.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 320, easing: "ease-out" });
  }

  function drawPhotoBg(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#291804");
    g.addColorStop(1, "#0f172a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawPhotoCaption(ctx, w, h) {
    const cap = gameTitle(gameIdFromPath()) + " · " + (getNick() || "Amal");
    const fs = Math.max(14, Math.round(h * 0.045));
    ctx.font = "bold " + fs + "px system-ui,sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillText(cap, 16, h - 14);
    ctx.fillStyle = "#fde68a";
    ctx.fillText(cap, 14, h - 16);
  }

  function cubePhoto() {
    try {
      const W = window.innerWidth;
      const H = window.innerHeight;
      let best = null;
      let bestArea = 0;
      document.querySelectorAll("canvas").forEach((c) => {
        const a = (c.width || 0) * (c.height || 0);
        if (a > bestArea) {
          bestArea = a;
          best = c;
        }
      });
      const cv = document.createElement("canvas");
      cv.width = best ? best.width : W;
      cv.height = best ? best.height : H;
      const ctx = cv.getContext("2d");
      let tainted = false;
      if (best) {
        try {
          ctx.drawImage(best, 0, 0, cv.width, cv.height);
        } catch (_) {
          tainted = true;
        }
      } else {
        drawPhotoBg(ctx, cv.width, cv.height);
      }
      if (_amalLastEmote) {
        ctx.font = Math.round(cv.height * 0.32) + "px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(_amalLastEmote, cv.width / 2, cv.height * 0.4);
      }
      drawPhotoCaption(ctx, cv.width, cv.height);
      let url = "";
      try {
        url = cv.toDataURL("image/png");
      } catch (_) {
        tainted = true;
      }
      if (tainted || !url) {
        // Кадр игры защищён — рисуем красивую рамку с эмоцией
        drawPhotoBg(ctx, cv.width, cv.height);
        if (_amalLastEmote) {
          ctx.font = Math.round(cv.height * 0.36) + "px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(_amalLastEmote, cv.width / 2, cv.height * 0.42);
        }
        drawPhotoCaption(ctx, cv.width, cv.height);
        url = cv.toDataURL("image/png");
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = "amal-" + gameIdFromPath() + "-" + Date.now() + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      fxPhotoFlash();
      fxSound("coin");
      showHubToast("📸 Фото сохранено");
    } catch (_) {
      showHubToast("📸 Не вышло снять кадр");
    }
  }

  /* ── «Матрица» и крутые эффекты — оверлеи поверх игры, играть не мешают ── */
  function toggleMatrixFx() {
    const ex = document.getElementById("amal-mtx");
    if (ex) {
      try {
        cancelAnimationFrame(ex._raf);
      } catch (_) {
        /* ignore */
      }
      window.removeEventListener("resize", ex._resize);
      ex.remove();
      showHubToast("🟩 Матрица выключена");
      return;
    }
    const c = document.createElement("canvas");
    c.id = "amal-mtx";
    c.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;opacity:.55";
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const size = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    size();
    c._resize = size;
    window.addEventListener("resize", size);
    const step = 15;
    let cols = Math.max(1, Math.floor(c.width / step));
    let drops = Array(cols).fill(0).map(() => Math.random() * -40);
    const glyphs = "01アイウエオカキクケコサシスセソタチツテトﾊﾋﾌﾍﾎ$#@%&";
    const draw = () => {
      ctx.fillStyle = "rgba(2,10,6,.10)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#34d399";
      ctx.font = step + "px monospace";
      cols = Math.max(1, Math.floor(c.width / step));
      for (let i = 0; i < cols; i++) {
        if (drops[i] === undefined) drops[i] = Math.random() * -40;
        const t = glyphs[Math.floor(Math.random() * glyphs.length)];
        const y = drops[i] * step;
        ctx.fillText(t, i * step, y);
        if (y > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      c._raf = requestAnimationFrame(draw);
    };
    draw();
    showHubToast("🟩 Матрица включена");
  }

  function fxGlitchScreen() {
    ensureFxLayer();
    const g = document.createElement("div");
    g.style.cssText =
      "position:fixed;inset:0;z-index:2147483038;pointer-events:none;mix-blend-mode:screen;" +
      "background:repeating-linear-gradient(0deg,rgba(255,0,80,.08),rgba(0,220,255,.08) 3px,transparent 6px)";
    document.body.appendChild(g);
    let n = 0;
    const iv = setInterval(() => {
      g.style.transform = "translate(" + (Math.random() * 10 - 5) + "px," + (Math.random() * 8 - 4) + "px)";
      g.style.filter = "hue-rotate(" + Math.floor(Math.random() * 360) + "deg)";
      if (++n > 14) {
        clearInterval(iv);
        g.remove();
      }
    }, 70);
    fxSound("laser");
  }

  /* ── Тесла-силы Амаля: BZZZ, Тайм-стоп, Бессмертие, Дюп монет, X-Ray ──
     Эффекты работают в любой игре, а сигнал через событие 'amal-power'
     позволяет каждой игре сделать настоящее действие (убить врагов и т.п.). */
  function amalDispatchPower(type, extra) {
    try {
      var detail = { type: type };
      if (extra) for (var k in extra) detail[k] = extra[k];
      global.dispatchEvent(new CustomEvent("amal-power", { detail: detail }));
    } catch (_) {
      /* ignore */
    }
  }
  function fxTeslaLightning() {
    ensureFxLayer();
    var flash = document.createElement("div");
    flash.style.cssText =
      "position:fixed;inset:0;z-index:2147483044;pointer-events:none;mix-blend-mode:screen;" +
      "background:radial-gradient(circle at 50% 40%,rgba(180,240,255,.95),rgba(120,80,255,.35) 40%,transparent 70%);" +
      "opacity:0;animation:amalBzzz .5s ease forwards";
    document.body.appendChild(flash);
    if (!document.getElementById("amal-bzzz-style")) {
      var st = document.createElement("style");
      st.id = "amal-bzzz-style";
      st.textContent =
        "@keyframes amalBzzz{0%{opacity:0}12%{opacity:1}25%{opacity:.2}40%{opacity:.9}100%{opacity:0}}" +
        "@keyframes amalBolt{0%{opacity:0;transform:scaleY(0)}20%{opacity:1;transform:scaleY(1)}100%{opacity:0}}";
      document.head.appendChild(st);
    }
    for (var i = 0; i < 6; i++) {
      var bolt = document.createElement("div");
      var x = Math.round((global.innerWidth || 800) * (0.1 + Math.random() * 0.8));
      bolt.style.cssText =
        "position:fixed;top:0;left:" + x + "px;width:3px;height:100vh;z-index:2147483044;pointer-events:none;" +
        "background:linear-gradient(180deg,#eaffff,#7c4dff);box-shadow:0 0 14px #9be8ff;transform-origin:top;" +
        "opacity:0;animation:amalBolt .4s ease " + (i * 0.03) + "s forwards";
      document.body.appendChild(bolt);
      (function (b) { setTimeout(function () { if (b.parentNode) b.remove(); }, 600); })(bolt);
    }
    setTimeout(function () { if (flash.parentNode) flash.remove(); }, 560);
    try { fxSound("laser"); } catch (_) { /* ignore */ }
  }
  var amalTimeStopOn = false;
  function fxTimeStop(force) {
    amalTimeStopOn = typeof force === "boolean" ? force : !amalTimeStopOn;
    var ex = document.getElementById("amal-timestop");
    if (!amalTimeStopOn) {
      if (ex) ex.remove();
      return amalTimeStopOn;
    }
    if (!ex) {
      ex = document.createElement("div");
      ex.id = "amal-timestop";
      ex.style.cssText =
        "position:fixed;inset:0;z-index:2147483043;pointer-events:none;" +
        "background:radial-gradient(circle at 50% 45%,rgba(120,220,255,.10),rgba(40,90,180,.22));" +
        "backdrop-filter:hue-rotate(160deg) saturate(1.2);" +
        "display:flex;align-items:flex-start;justify-content:center";
      ex.innerHTML =
        '<div style="margin-top:12%;font:900 16px Nunito,sans-serif;color:#eaffff;' +
        'background:rgba(20,60,120,.7);padding:8px 16px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.5)">' +
        "⏸ ВРЕМЯ ОСТАНОВЛЕНО</div>";
      document.body.appendChild(ex);
    }
    return amalTimeStopOn;
  }
  function fxTeslaShield() {
    ensureFxLayer();
    var el = document.createElement("div");
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483043;pointer-events:none;border-radius:0;" +
      "box-shadow:inset 0 0 80px 20px rgba(120,220,255,.65),inset 0 0 160px 40px rgba(124,77,255,.4);" +
      "opacity:0;transition:opacity .25s ease";
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = "1"; });
    setTimeout(function () { el.style.opacity = "0"; }, 900);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 1200);
  }
  var amalXrayOn = false;
  function fxXrayToggle(force) {
    amalXrayOn = typeof force === "boolean" ? force : !amalXrayOn;
    if (!document.getElementById("amal-xray-style")) {
      var st = document.createElement("style");
      st.id = "amal-xray-style";
      st.textContent =
        "html.amal-xray{filter:invert(1) hue-rotate(180deg) saturate(2.5) contrast(1.2)}" +
        "html.amal-xray img,html.amal-xray canvas,html.amal-xray video{filter:invert(1) hue-rotate(180deg)}";
      document.head.appendChild(st);
    }
    document.documentElement.classList.toggle("amal-xray", amalXrayOn);
    return amalXrayOn;
  }

  /* ── RGB · нестабильные эффекты: помехи, разрыв экрана, хрома, лаг ── */
  function fxOverlay(css, ms, tick) {
    ensureFxLayer();
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;z-index:2147483037;pointer-events:none;" + css;
    document.body.appendChild(el);
    let n = 0;
    const iv = setInterval(() => {
      try {
        if (tick) tick(el, n);
      } catch (_) {
        /* ignore */
      }
      n++;
    }, 60);
    setTimeout(() => {
      clearInterval(iv);
      el.remove();
    }, ms || 2600);
    return el;
  }

  function fxRgbStorm(ms) {
    fxSound("laser");
    fxOverlay(
      "mix-blend-mode:screen;background:repeating-linear-gradient(90deg,rgba(255,0,76,.55) 0 3px,rgba(0,229,255,.55) 3px 6px,rgba(0,255,120,.45) 6px 9px,transparent 9px 17px)",
      ms || 2800,
      (el) => {
        el.style.transform = "translate(" + (Math.random() * 14 - 7) + "px," + (Math.random() * 10 - 5) + "px)";
        el.style.filter = "hue-rotate(" + Math.floor(Math.random() * 360) + "deg)";
        el.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
      },
    );
  }

  function fxScreenTear(ms) {
    fxSound("laser");
    fxOverlay(
      "background:repeating-linear-gradient(0deg,rgba(255,255,255,.09) 0 18px,transparent 18px 40px);mix-blend-mode:overlay",
      ms || 2200,
      (el) => {
        el.style.transform = "translateY(" + (Math.random() * 22 - 11) + "px) skewX(" + (Math.random() * 5 - 2.5) + "deg)";
        el.style.filter = "hue-rotate(" + Math.floor(Math.random() * 360) + "deg) contrast(1.4)";
      },
    );
  }

  function fxChroma(ms) {
    fxSound("beat");
    fxOverlay("mix-blend-mode:screen;background:radial-gradient(circle at 50% 45%,rgba(255,0,60,.4),transparent 62%)", ms || 2400, (el) => {
      el.style.transform = "translateX(" + (Math.random() * 18 - 9) + "px)";
    });
    fxOverlay("mix-blend-mode:screen;background:radial-gradient(circle at 50% 45%,rgba(0,150,255,.4),transparent 62%)", ms || 2400, (el) => {
      el.style.transform = "translateX(" + (Math.random() * 18 - 9) + "px)";
    });
  }

  function fxLagStutter(ms) {
    fxSound("boom");
    fxOverlay("mix-blend-mode:screen;background:linear-gradient(0deg,rgba(255,0,76,.3),rgba(0,229,255,.3))", ms || 1900, (el) => {
      el.style.opacity = Math.random() > 0.5 ? "0.9" : "0";
      el.style.transform = "translate(" + (Math.random() * 12 - 6) + "px," + (Math.random() * 12 - 6) + "px)";
      el.style.filter = "hue-rotate(" + Math.floor(Math.random() * 360) + "deg)";
    });
  }

  function fxRave() {
    fxDisco();
    fxSound("beat");
    fxRgbStorm(2600);
  }

  function fxRgbOverload() {
    setCubeSkin("rgb");
    fxRgbStorm(3600);
    fxScreenTear(3200);
    fxChroma(3000);
    fxBurst(["🌈", "💥", "⚡", "✨", "🟥", "🟦", "🟩"], 42);
    fxSound("boom");
    setTimeout(() => fxSound("laser"), 200);
    setTimeout(() => fxSound("jackpot"), 520);
    showHubToast("🌈 RGB-ПЕРЕГРУЗ · куб нестабилен!");
  }

  function cubeCoolFx(kind) {
    try {
      if (kind === "matrix") toggleMatrixFx();
      else if (kind === "glitch") fxGlitchScreen();
      else if (kind === "rgbstorm") fxRgbStorm();
      else if (kind === "tear") fxScreenTear();
      else if (kind === "chroma") fxChroma();
      else if (kind === "lag") fxLagStutter();
      else if (kind === "rave") fxRave();
      else if (kind === "overload") fxRgbOverload();
      else if (kind === "gravity") fxRain(["🪙", "💎", "⭐", "🍀", "🧊", "🔷", "🟪"], 70);
      else if (kind === "petals") fxRain(["🌸", "🍁", "🍃", "❄️", "🌼"], 46);
      else if (kind === "shock") {
        fxBurst(["⚡", "💥", "✨", "🌩️"], 34);
        fxSound("boom");
        fxPhotoFlash();
      } else if (kind === "off") {
        const ex = document.getElementById("amal-mtx");
        if (ex) toggleMatrixFx();
        applyVibe("off");
        showHubToast("🚫 Эффекты выключены");
      }
    } catch (_) {
      /* ignore */
    }
  }

  function cubeDashPlayersHtml() {
    let list = [];
    try {
      list = playersInThisGameAll();
    } catch (_) {
      list = [];
    }
    let online = 0;
    try {
      online = recentPlayers(1000 * 60 * 3).filter((p) => p.live || Date.now() - p.at < 120000).length;
    } catch (_) {
      online = list.length;
    }
    const names =
      list
        .slice(0, 12)
        .map((p) => escapeHtml(p.nick || "?") + (p.role === "owner" ? " 👑" : ""))
        .join("<br>") || "пока никого";
    return (
      '<div class="acd-stats">' +
      '<div class="acd-stat"><div class="n">' + online + '</div><div class="l">онлайн</div></div>' +
      '<div class="acd-stat"><div class="n">' + list.length + '</div><div class="l">в игре</div></div>' +
      "</div>" +
      '<div class="acd-list">' + names + "</div>" +
      '<button type="button" class="acd-btn amber" data-cube="admin-full">📋 Полная админка</button>' +
      '<button type="button" class="acd-btn" data-cube="polygon">🧪 Мой полигон</button>'
    );
  }

  function refreshCubeDashPlayers() {
    const dash = document.getElementById("amal-cube-dash");
    if (!dash || dash.style.display === "none") return;
    setLegacyThingsBarHidden(true);
    const box = document.getElementById("amal-cube-players-body");
    if (box) box.innerHTML = cubeDashPlayersHtml();
  }

  /** Эксклюзивные вещи админа переезжают в панель куба, чтобы нижний бар не закрывал игру. */
  function cubeDashThingsHtml() {
    let loot = [];
    try {
      loot = (global.AmalAdminThings && AmalAdminThings.lootFor()) || [];
    } catch (_) {
      loot = [];
    }
    if (!loot.length) return "";
    return loot
      .map((it) => {
        let has = false;
        try {
          has = !!(global.AmalAdminThings && AmalAdminThings.owned(it.id));
        } catch (_) {
          has = false;
        }
        return (
          '<button type="button" class="acd-btn' +
          (has ? " done" : " amber") +
          '" data-thing="' +
          escapeHtml(it.id) +
          '">' +
          (has ? "✓ " : "") +
          (it.emoji || "✨") +
          " " +
          escapeHtml(it.label || it.id) +
          "</button>"
        );
      })
      .join("");
  }

  function refreshCubeDashThings() {
    const box = document.getElementById("amal-cube-things-body");
    if (!box) return;
    const html = cubeDashThingsHtml();
    box.innerHTML = html;
    const panel = box.closest(".acd-panel");
    if (panel) panel.style.display = html ? "" : "none";
  }

  /** Нижний бар вещей закрывает игру — пока панели открыты, он не нужен. */
  function setLegacyThingsBarHidden(hidden) {
    const bar = document.getElementById("amal-admin-things");
    if (bar) bar.style.display = hidden ? "none" : "";
  }

  function cubeFlagStore() {
    try {
      return JSON.parse(localStorage.getItem("amal-cube-flags-v1") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function saveCubePanelFlag(kind, id, value) {
    try {
      const all = cubeFlagStore();
      if (!all[kind] || typeof all[kind] !== "object") all[kind] = {};
      if (value) all[kind][id] = true;
      else delete all[kind][id];
      localStorage.setItem("amal-cube-flags-v1", JSON.stringify(all));
    } catch (_) {
      /* ignore */
    }
  }

  function cubePosStore() {
    try {
      return JSON.parse(localStorage.getItem("amal-cube-pos-v1") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function saveCubePos(id, x, y) {
    try {
      const all = cubePosStore();
      all[id] = { x: Math.round(x), y: Math.round(y) };
      localStorage.setItem("amal-cube-pos-v1", JSON.stringify(all));
    } catch (_) {
      /* ignore */
    }
  }

  function placeCubePanel(panel, x, y) {
    const w = panel.offsetWidth || 180;
    const h = panel.offsetHeight || 120;
    const maxX = Math.max(2, window.innerWidth - w - 4);
    const maxY = Math.max(2, window.innerHeight - Math.min(h, 120) - 4);
    const nx = Math.min(Math.max(2, x), maxX);
    const ny = Math.min(Math.max(2, y), maxY);
    panel.classList.add("acd-free");
    panel.style.left = nx + "px";
    panel.style.top = ny + "px";
    return { x: nx, y: ny };
  }

  /** Панели можно перетащить за шапку — пальцем или мышью. */
  function makeCubePanelDraggable(panel, dash) {
    const head = panel.querySelector(".acd-h");
    if (!head) return;
    let dx = 0;
    let dy = 0;
    let moved = false;
    const onMove = (ev) => {
      moved = true;
      placeCubePanel(panel, ev.clientX - dx, ev.clientY - dy);
    };
    const onUp = (ev) => {
      head.removeEventListener("pointermove", onMove);
      head.removeEventListener("pointerup", onUp);
      head.removeEventListener("pointercancel", onUp);
      panel.classList.remove("acd-dragging");
      try {
        head.releasePointerCapture(ev.pointerId);
      } catch (_) {
        /* ignore */
      }
      if (moved) {
        const r = panel.getBoundingClientRect();
        saveCubePos(panel.getAttribute("data-panel"), r.left, r.top);
      }
    };
    head.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("button")) return;
      const r = panel.getBoundingClientRect();
      dx = ev.clientX - r.left;
      dy = ev.clientY - r.top;
      moved = false;
      if (panel.parentElement !== dash) dash.appendChild(panel);
      placeCubePanel(panel, r.left, r.top);
      panel.classList.add("acd-dragging");
      try {
        head.setPointerCapture(ev.pointerId);
      } catch (_) {
        /* ignore */
      }
      head.addEventListener("pointermove", onMove);
      head.addEventListener("pointerup", onUp);
      head.addEventListener("pointercancel", onUp);
      ev.preventDefault();
    });
  }

  function cubePanelHtml(id, title, body, extraBtn, attrs) {
    return (
      '<div class="acd-panel" data-panel="' +
      id +
      '"' +
      (attrs || "") +
      '><div class="acd-h"><span class="grip">⠿</span><b>' +
      title +
      "</b>" +
      (extraBtn || "") +
      '<button type="button" data-cube="min" title="Свернуть">▾</button>' +
      '<button type="button" data-cube="hide" title="Убрать эту панель">✕</button></div>' +
      '<div class="acd-body">' +
      body +
      "</div></div>"
    );
  }

  function showCubeDashboard() {
    ensureCubeStyles();
    const existing = document.getElementById("amal-cube-dash");
    if (existing) {
      existing.style.display = "block";
      try {
        localStorage.setItem("amal-cube-dash-open-v1", "1");
      } catch (_) {
        /* ignore */
      }
      setLegacyThingsBarHidden(true);
      refreshCubeDashPlayers();
      refreshCubeDashThings();
      restoreVibe();
      return;
    }
    const dash = document.createElement("div");
    dash.id = "amal-cube-dash";
    const things = cubeDashThingsHtml();
    const thingsStyle = things ? "" : ' style="display:none"';
    dash.innerHTML =
      '<div class="acd-col left">' +
      cubePanelHtml(
        "players",
        "👥 ИГРОКИ",
        '<div id="amal-cube-players-body">' + cubeDashPlayersHtml() + "</div>",
        '<button type="button" data-cube="reset" title="Вернуть панели по бокам">↺</button>',
      ) +
      cubePanelHtml("things", "👑 ТВОИ ВЕЩИ", '<div id="amal-cube-things-body">' + things + "</div>", "", thingsStyle) +
      cubePanelHtml(
        "fx",
        "🎉 ВЕСЕЛЬЕ",
        '<div class="acd-fxgrid">' +
          '<button type="button" class="acd-fx" data-fx="confetti" title="Конфетти">🎉</button>' +
          '<button type="button" class="acd-fx" data-fx="fireworks" title="Салют">🎆</button>' +
          '<button type="button" class="acd-fx" data-fx="coins" title="Дождь монет">💰</button>' +
          '<button type="button" class="acd-fx" data-fx="stars" title="Звездопад">⭐</button>' +
          '<button type="button" class="acd-fx" data-fx="hearts" title="Сердечки">💖</button>' +
          '<button type="button" class="acd-fx" data-fx="disco" title="Дискотека">🕶️</button>' +
          "</div>" +
          '<button type="button" class="acd-btn amber" data-cube="mystery">🎁 Мистери-бокс</button>',
      ) +
      cubePanelHtml("cube", "🎲 КУБ · СКИНЫ", cubeSkinPanelBody()) +
      cubePanelHtml("games", "🎮 ВСЕ ИГРЫ", '<div id="amal-cube-games-body">' + cubeGamesHtml() + "</div>") +
      cubePanelHtml("emotions", "😀 ЭМОЦИИ · ФОТО", cubeEmotesHtml()) +
      "</div>" +
      '<div class="acd-col right">' +
      cubePanelHtml(
        "abilities",
        "⚡ СПОСОБНОСТИ",
        '<button type="button" class="acd-btn max" data-cube="ab-mega">🌈 RGB-ПЕРЕГРУЗ · ВСЁ+ГЛИТЧ</button>' +
          '<button type="button" class="acd-btn max" data-cube="ab-max">⚡ ВСЁ НА МАКС</button>' +
          '<button type="button" class="acd-btn" data-cube="ab-coins">💰 ∞ монеты</button>' +
          '<button type="button" class="acd-btn" data-cube="ab-heal">💚 Полный хилл</button>' +
          '<button type="button" class="acd-btn" data-cube="ab-god">🛡️ Бессмертие</button>' +
          '<button type="button" class="acd-btn" data-cube="ab-speed">⚡ Скорость</button>' +
          '<button type="button" class="acd-btn" data-cube="ab-unlock">🔓 Всё открыть</button>',
      ) +
      cubePanelHtml(
        "give",
        "🎁 ВЫДАТЬ СЕБЕ",
        '<input class="acd-amt" id="amal-cube-amount" type="text" inputmode="numeric" value="100000" placeholder="Напиши число" />' +
          '<div class="acd-presets"><button type="button" data-amt="1000">1К</button><button type="button" data-amt="100000">100К</button><button type="button" data-amt="1000000">1М</button><button type="button" data-amt="999999999">∞</button></div>' +
          '<button type="button" class="acd-btn amber" data-cube="give-coins">💰 Монеты</button>' +
          '<button type="button" class="acd-btn amber" data-cube="give-score">🏆 Очки</button>' +
          '<button type="button" class="acd-btn amber" data-cube="give-cups">🏅 Кубки</button>',
      ) +
      cubePanelHtml(
        "vibe",
        "🎨 СТИЛЬ ИГРЫ",
        '<div class="acd-fxgrid">' +
          '<button type="button" class="acd-fx" data-vibe="gold" title="Золото">👑</button>' +
          '<button type="button" class="acd-fx" data-vibe="night" title="Ночь">🌙</button>' +
          '<button type="button" class="acd-fx" data-vibe="rainbow" title="Радуга">🌈</button>' +
          '<button type="button" class="acd-fx" data-vibe="neon" title="Неон">💜</button>' +
          '<button type="button" class="acd-fx" data-vibe="off" title="Обычный вид">🚫</button>' +
          "</div>" +
          '<div class="acd-fxgrid" style="margin-top:6px">' +
          '<button type="button" class="acd-fx" data-snd="fanfare" title="Фанфары">🎺</button>' +
          '<button type="button" class="acd-fx" data-snd="boom" title="Взрыв">💣</button>' +
          '<button type="button" class="acd-fx" data-snd="laser" title="Лазер">🔫</button>' +
          '<button type="button" class="acd-fx" data-snd="applause" title="Аплодисменты">👏</button>' +
          "</div>",
      ) +
      cubePanelHtml(
        "matrix",
        "🌈 RGB · ГЛИТЧ",
        '<button type="button" class="acd-btn max" data-cool="overload">🌈💥 RGB-ПЕРЕГРУЗ</button>' +
          '<div class="acd-fxgrid" style="margin-top:6px">' +
          '<button type="button" class="acd-fx" data-cool="rgbstorm" title="RGB-буря (помехи)">🌈</button>' +
          '<button type="button" class="acd-fx" data-cool="tear" title="Разрыв экрана">📺</button>' +
          '<button type="button" class="acd-fx" data-cool="chroma" title="Хрома-сдвиг">👓</button>' +
          '<button type="button" class="acd-fx" data-cool="lag" title="Лаг · нестабильность">🐢</button>' +
          '<button type="button" class="acd-fx" data-cool="rave" title="RGB-рейв">🔊</button>' +
          '<button type="button" class="acd-fx" data-cool="glitch" title="Глитч экрана">🎞️</button>' +
          '<button type="button" class="acd-fx" data-cool="shock" title="Разряд">⚡</button>' +
          '<button type="button" class="acd-fx" data-cool="matrix" title="Матрица (по желанию)">🟩</button>' +
          '<button type="button" class="acd-fx" data-cool="off" title="Выключить всё">🚫</button>' +
          "</div>",
      ) +
      cubePanelHtml(
        "super",
        "🔥 СУПЕР-СИЛЫ",
        '<button type="button" class="acd-btn max" data-cube="super-all">🔥 СУПЕР-НАБОР · ВСЁ СРАЗУ</button>' +
          '<button type="button" class="acd-btn" data-cube="super-ghost">👻 Вызвать глитч-куб</button>' +
          '<button type="button" class="acd-btn" data-cube="super-boss">🐲 Позвать доброго босса</button>' +
          '<button type="button" class="acd-btn" data-cube="super-peace">🕊️ Мир · убрать врагов</button>' +
          '<button type="button" class="acd-btn amber" data-cube="super-announce">📣 Объявление всем</button>' +
          '<button type="button" class="acd-btn" data-cube="super-chatclear">🧹 Очистить чат</button>',
      ) +
      cubePanelHtml(
        "tesla",
        "⚡ ТЕСЛА-СИЛЫ АМАЛЯ",
        '<button type="button" class="acd-btn max" data-cube="power-bzzz">💥 BZZZ · Аннигиляция врагов</button>' +
          '<button type="button" class="acd-btn" data-cube="power-timestop">⏳ Тайм-Стоп · заморозить время</button>' +
          '<button type="button" class="acd-btn" data-cube="power-immortal">🛡️ Бессмертный Тесла</button>' +
          '<button type="button" class="acd-btn amber" data-cube="power-dupe">🪙 Дюп монет · ×1 000 000</button>' +
          '<button type="button" class="acd-btn" data-cube="power-xray">👁️ Взгляд Робота · X-Ray</button>',
      ) +
      "</div>";
    dash.addEventListener("click", (e) => {
      const fx = e.target.closest("[data-fx]");
      if (fx) {
        cubeFx(fx.getAttribute("data-fx"));
        return;
      }
      const vibe = e.target.closest("[data-vibe]");
      if (vibe) {
        applyVibe(vibe.getAttribute("data-vibe"));
        return;
      }
      const snd = e.target.closest("[data-snd]");
      if (snd) {
        fxSound(snd.getAttribute("data-snd"));
        return;
      }
      const gj = e.target.closest("[data-game]");
      if (gj) {
        try {
          location.href = gameHref(gj.getAttribute("data-game"));
        } catch (_) {
          /* ignore */
        }
        return;
      }
      const emo = e.target.closest("[data-emote]");
      if (emo) {
        bigEmote(emo.getAttribute("data-emote"));
        return;
      }
      const cool = e.target.closest("[data-cool]");
      if (cool) {
        cubeCoolFx(cool.getAttribute("data-cool"));
        return;
      }
      const skin = e.target.closest("[data-skin]");
      if (skin) {
        const id = skin.getAttribute("data-skin");
        setCubeSkin(id);
        showHubToast("🎲 Скин: " + ((CUBE_SKINS[id] && CUBE_SKINS[id].name) || id));
        return;
      }
      const tr = e.target.closest("[data-tr]");
      if (tr) {
        const nameEl = document.getElementById("amal-cube-treasure-name");
        setTreasure(tr.getAttribute("data-tr"), nameEl ? nameEl.value : "");
        showHubToast("💎 Сокровище на кубе");
        return;
      }
      const thing = e.target.closest("[data-thing]");
      if (thing) {
        try {
          if (global.AmalAdminThings && AmalAdminThings.claim) AmalAdminThings.claim(thing.getAttribute("data-thing"));
        } catch (_) {
          /* ignore */
        }
        setLegacyThingsBarHidden(true);
        refreshCubeDashThings();
        return;
      }
      const b = e.target.closest("[data-cube]");
      if (b) {
        const act = b.getAttribute("data-cube");
        if (act === "min") {
          const panel = b.closest(".acd-panel");
          if (panel) {
            const min = panel.classList.toggle("acd-min");
            b.textContent = min ? "▸" : "▾";
            saveCubePanelFlag("min", panel.getAttribute("data-panel"), min);
          }
          return;
        }
        if (act === "hide") {
          const panel = b.closest(".acd-panel");
          if (panel) {
            panel.style.display = "none";
            setLegacyThingsBarHidden(true);
            saveCubePanelFlag("hidden", panel.getAttribute("data-panel"), true);
            showHubToast("Панель убрана · кубик 🎲 вернёт");
          }
          return;
        }
        if (act === "reset") {
          try {
            localStorage.removeItem("amal-cube-pos-v1");
            localStorage.removeItem("amal-cube-flags-v1");
          } catch (_) {
            /* ignore */
          }
          dash.remove();
          showCubeDashboard();
          return;
        }
        if (act === "admin-full") {
          openUi("admin");
          return;
        }
        if (act === "polygon") {
          const base = gameIdFromPath() === "portal" ? "polygon/" : "../polygon/";
          location.href = base + "?owner=AmalOwner2026&stealth=1";
          return;
        }
        if (act === "ab-mega") {
          runCubeAbility("max");
          fxRgbOverload();
          return;
        }
        if (act === "super-all") {
          ["god", "heal", "max"].forEach(function (a) { runCubeAbility(a); });
          fxRgbOverload();
          showHubToast("🔥 Супер-набор: бессмертие + хилл + всё на макс");
          return;
        }
        if (act === "power-bzzz") {
          fxTeslaLightning();
          amalDispatchPower("killAll");
          showHubToast("💥 BZZZ! Молния Теслы — враги на уровне уничтожены");
          return;
        }
        if (act === "power-timestop") {
          var on = fxTimeStop();
          amalDispatchPower("timestop", { on: on });
          showHubToast(on ? "⏳ Время остановлено — собирай спокойно" : "▶️ Время снова идёт");
          return;
        }
        if (act === "power-immortal") {
          try { global.__amalInvincible = true; } catch (_) { /* ignore */ }
          fxTeslaShield();
          runCubeAbility("god");
          amalDispatchPower("invincible", { on: true });
          showHubToast("🛡️ Бессмертный Тесла: удары превращаются в искры");
          return;
        }
        if (act === "power-dupe") {
          amalDispatchPower("coinMult", { factor: 1000000 });
          runCubeAbility("coins");
          showHubToast("🪙 Дюп монет ×1 000 000!");
          return;
        }
        if (act === "power-xray") {
          var xr = fxXrayToggle();
          amalDispatchPower("xray", { on: xr });
          showHubToast(xr ? "👁️ Взгляд Робота: X-Ray включён" : "Взгляд Робота выключен");
          return;
        }
        if (act === "super-ghost") {
          try {
            if (typeof global.amalGlitchGhost === "function") global.amalGlitchGhost();
            else showHubToast("👻 Глитч-куб загружается");
          } catch (_) {
            /* ignore */
          }
          return;
        }
        if (act === "super-boss") {
          try {
            if (typeof global.amalGoodBoss === "function") {
              global.amalGoodBoss();
              showHubToast("🐲 Добрый босс идёт");
            } else {
              showHubToast("🐲 Добрый босс живёт в Пиксель-Террариуме");
            }
          } catch (_) {
            /* ignore */
          }
          return;
        }
        if (act === "super-peace") {
          try {
            var tapi = global.__TERRARIUM__;
            if (tapi && typeof tapi.enablePeaceful === "function") tapi.enablePeaceful();
            else if (tapi && typeof tapi.clearHostiles === "function") tapi.clearHostiles();
            showHubToast("🕊️ Мирный режим");
          } catch (_) {
            showHubToast("🕊️ Мир доступен не во всех играх");
          }
          return;
        }
        if (act === "super-announce") {
          try {
            var txt = (global.prompt && global.prompt("Объявление всем игрокам:")) || "";
            txt = (txt || "").trim();
            if (txt) chatSendAnnounce(txt);
          } catch (_) {
            /* ignore */
          }
          return;
        }
        if (act === "super-chatclear") {
          try { chatClearAll(); } catch (_) { /* ignore */ }
          return;
        }
        if (act.startsWith("ab-")) {
          const map = { "ab-max": "max", "ab-coins": "coins", "ab-heal": "heal", "ab-god": "god", "ab-speed": "speed", "ab-unlock": "unlock" };
          runCubeAbility(map[act]);
          return;
        }
        if (act === "mystery") {
          cubeMystery();
          return;
        }
        if (act === "photo") {
          cubePhoto();
          return;
        }
        if (act === "emote-face") {
          setTreasure(_amalLastEmote || "😎", "эмоция");
          showHubToast("🎲 Эмоция на кубе: " + (_amalLastEmote || "😎"));
          return;
        }
        if (act === "treasure-save") {
          const cur = getTreasure();
          const nameEl = document.getElementById("amal-cube-treasure-name");
          setTreasure((cur && cur.emoji) || "💎", nameEl ? nameEl.value : "");
          showHubToast("💎 Сокровище обновлено");
          return;
        }
        if (act === "story") {
          showCubeStory();
          return;
        }
        if (act === "give-coins") cubeGive("coins");
        if (act === "give-score") cubeGive("score");
        if (act === "give-cups") cubeGive("cups");
        return;
      }
      const preset = e.target.closest("[data-amt]");
      if (preset) {
        const amt = document.getElementById("amal-cube-amount");
        if (amt) amt.value = preset.getAttribute("data-amt");
      }
    });
    document.body.appendChild(dash);
    try {
      localStorage.setItem("amal-cube-dash-open-v1", "1");
    } catch (_) {
      /* ignore */
    }
    // вещи подключаются своим скриптом чуть позже хаба
    setTimeout(refreshCubeDashThings, 900);
    const saved = cubePosStore();
    const flags = cubeFlagStore();
    dash.querySelectorAll(".acd-panel").forEach((panel) => {
      makeCubePanelDraggable(panel, dash);
      const id = panel.getAttribute("data-panel");
      const pos = saved[id];
      if (pos) {
        dash.appendChild(panel);
        placeCubePanel(panel, pos.x, pos.y);
      }
      if (flags.min && flags.min[id]) {
        panel.classList.add("acd-min");
        const mb = panel.querySelector('[data-cube="min"]');
        if (mb) mb.textContent = "▸";
      }
      if (flags.hidden && flags.hidden[id]) panel.style.display = "none";
    });
    setLegacyThingsBarHidden(true);
    restoreVibe();
  }

  /** Кубик — выключатель: одним нажатием убрать все панели с экрана и вернуть обратно. */
  function toggleCubeDashboard() {
    const dash = document.getElementById("amal-cube-dash");
    if (dash && dash.style.display !== "none") {
      dash.style.display = "none";
      try {
        localStorage.setItem("amal-cube-dash-open-v1", "0");
      } catch (_) {
        /* ignore */
      }
      return;
    }
    if (dash) {
      // вернуть и те панели, что были убраны крестиком
      dash.querySelectorAll(".acd-panel").forEach((p) => {
        const id = p.getAttribute("data-panel");
        if (id === "things" && !document.querySelector("#amal-cube-things-body .acd-btn")) return;
        p.style.display = "";
        saveCubePanelFlag("hidden", id, false);
      });
    }
    showCubeDashboard();
  }

  /* ── 3D-куб: скины и «сокровище игры» ── */
  const CUBE_SKINS = {
    classic: { name: "Классика", emoji: "🎲", face: "linear-gradient(160deg,#92400e,#422006)", edge: "#fbbf24", glow: "rgba(245,158,11,.55)" },
    gold: { name: "Золото", emoji: "👑", face: "linear-gradient(160deg,#fde68a,#b45309)", edge: "#fff3c4", glow: "rgba(251,191,36,.85)" },
    diamond: { name: "Алмаз", emoji: "💎", face: "linear-gradient(160deg,#67e8f9,#0e7490)", edge: "#a5f3fc", glow: "rgba(34,211,238,.7)" },
    fire: { name: "Огонь", emoji: "🔥", face: "linear-gradient(160deg,#f97316,#7f1d1d)", edge: "#fca5a5", glow: "rgba(239,68,68,.7)" },
    ice: { name: "Лёд", emoji: "❄️", face: "linear-gradient(160deg,#bfdbfe,#1e3a8a)", edge: "#dbeafe", glow: "rgba(96,165,250,.7)" },
    neon: { name: "Неон", emoji: "⚡", face: "linear-gradient(160deg,#d946ef,#4c1d95)", edge: "#f0abfc", glow: "rgba(217,70,239,.8)" },
    matrix: { name: "Матрица", emoji: "🟢", face: "linear-gradient(160deg,#065f46,#022c22)", edge: "#34d399", glow: "rgba(16,185,129,.8)" },
    mistake: { name: "Ошибка", emoji: "⚠️", face: "linear-gradient(160deg,#1f2937,#000)", edge: "#ef4444", glow: "rgba(239,68,68,.9)", glitch: true },
    rgb: { name: "RGB · нестабильный", emoji: "🌈", face: "linear-gradient(135deg,#ff004c,#7c3aed 45%,#00e5ff)", edge: "#ffffff", glow: "rgba(0,229,255,.9)", rgb: true },
  };

  function cubeSkinId() {
    try {
      const saved = localStorage.getItem("amal-cube-skin-v1");
      // по умолчанию — нестабильный RGB: редкий глитч и разрыв, без мигания
      return CUBE_SKINS[saved] ? saved : "rgb";
    } catch (_) {
      return "rgb";
    }
  }

  function setCubeSkin(id) {
    if (!CUBE_SKINS[id]) id = "classic";
    try {
      localStorage.setItem("amal-cube-skin-v1", id);
    } catch (_) {
      /* ignore */
    }
    paintCube3d();
  }

  function cubeTreasureKey() {
    return "amal-cube-treasure:" + (gameIdFromPath() || "portal");
  }

  function getTreasure() {
    try {
      const v = JSON.parse(localStorage.getItem(cubeTreasureKey()) || "null");
      if (v && v.emoji) return v;
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  function setTreasure(emoji, name) {
    try {
      localStorage.setItem(cubeTreasureKey(), JSON.stringify({ emoji: emoji || "💎", name: (name || "").slice(0, 24) }));
    } catch (_) {
      /* ignore */
    }
    paintCube3d();
  }

  function paintCube3d() {
    const btn = document.getElementById("amal-cube-btn");
    if (!btn) return;
    const sk = CUBE_SKINS[cubeSkinId()] || CUBE_SKINS.classic;
    btn.style.setProperty("--face", sk.face);
    btn.style.setProperty("--edge", sk.edge);
    btn.style.setProperty("--glow", sk.glow);
    btn.classList.toggle("cube-glitch", !!sk.glitch);
    btn.classList.toggle("cube-rgb", !!sk.rgb);
    const tr = getTreasure();
    const faces = btn.querySelectorAll(".c3d .f");
    const frontEmoji = tr ? tr.emoji : sk.emoji;
    faces.forEach((f, i) => {
      f.textContent = i === 0 ? frontEmoji : sk.emoji;
    });
    btn.dataset.label = tr && tr.name ? tr.name : "АДМИН";
  }

  function cubeSkinPanelBody() {
    const skins = Object.keys(CUBE_SKINS)
      .map((id) => '<button type="button" class="acd-fx" data-skin="' + id + '" title="' + CUBE_SKINS[id].name + '">' + CUBE_SKINS[id].emoji + "</button>")
      .join("");
    const trPresets = ["💎", "👑", "🔥", "🗝️", "🏆", "⭐"]
      .map((e) => '<button type="button" class="acd-fx" data-tr="' + e + '">' + e + "</button>")
      .join("");
    const tr = getTreasure();
    return (
      '<div class="acd-fxgrid">' + skins + "</div>" +
      '<div style="margin-top:9px;font:800 10px system-ui,sans-serif;color:#fde68a;opacity:.85">💎 Сокровище игры (видно на кубе)</div>' +
      '<div class="acd-fxgrid" style="margin-top:5px">' + trPresets + "</div>" +
      '<input class="acd-amt" id="amal-cube-treasure-name" type="text" maxlength="24" placeholder="Название сокровища" value="' +
      escapeHtml((tr && tr.name) || "") +
      '" style="margin-top:6px;font-size:12px" />' +
      '<button type="button" class="acd-btn amber" data-cube="treasure-save">💾 Поставить на куб</button>' +
      '<button type="button" class="acd-btn" data-cube="story">📜 История куба</button>'
    );
  }

  function showCubeStory() {
    ensureCubeStyles();
    if (document.getElementById("amal-cube-story")) return;
    const box = document.createElement("div");
    box.id = "amal-cube-story";
    box.innerHTML =
      '<div class="cube">🎲</div><b>История куба</b>' +
      "<p>Я задумывал совсем другое. А получилось — вот это, по ошибке.<br>" +
      "Куб появился сам. Убрать его нельзя, и команду сменить он не даёт.<br>" +
      "Зато теперь он твой: 3D, со скинами, и показывает главное сокровище каждой игры.</p>" +
      "<button type=\"button\">Понятно</button>";
    box.querySelector("button").addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  }

  function showCubeButton() {
    removeCubeEl("amal-cube-pickup");
    removeCubeEl("amal-cube-activate");
    if (document.getElementById("amal-cube-btn")) return;
    ensureCubeStyles();
    const btn = document.createElement("button");
    btn.id = "amal-cube-btn";
    btn.type = "button";
    btn.innerHTML =
      '<span class="c3d"><span class="f f0"></span><span class="f f1"></span><span class="f f2"></span>' +
      '<span class="f f3"></span><span class="f f4"></span><span class="f f5"></span></span>';
    btn.dataset.label = "АДМИН";
    btn.title = "Админ-куб: показать или спрятать панели";
    btn.setAttribute("aria-label", "Показать или спрятать боковые панели админ-куба");
    btn.addEventListener("click", toggleCubeDashboard);
    document.body.appendChild(btn);
    paintCube3d();
  }

  function showCubeActivate() {
    removeCubeEl("amal-cube-pickup");
    if (document.getElementById("amal-cube-activate")) return;
    ensureCubeStyles();
    const box = document.createElement("div");
    box.id = "amal-cube-activate";
    box.innerHTML =
      '<div class="cube">🎲</div><b>Личный админ-куб найден</b>' +
      "<p>Боковые панели: игроки, все способности и «выдать себе» — прямо во время игры.</p>" +
      '<button type="button">АКТИВИРОВАТЬ</button>';
    box.querySelector("button").addEventListener("click", () => {
      setCubeState("active");
      showCubeButton();
      showHubToast("🎲 Панели открыты — играй и пользуйся");
      showCubeDashboard();
    });
    document.body.appendChild(box);
  }

  function showCubePickup() {
    if (document.getElementById("amal-cube-pickup")) return;
    ensureCubeStyles();
    const el = document.createElement("button");
    el.id = "amal-cube-pickup";
    el.type = "button";
    el.textContent = "🎲";
    el.title = "Забрать личный админ-куб";
    el.setAttribute("aria-label", "Забрать личный админ-куб");
    el.addEventListener("click", () => {
      setCubeState("taken");
      showCubeActivate();
    });
    document.body.appendChild(el);
  }

  /** Личный предмет в каждой игре: взять → активировать → несколько разделов админки. */
  function mountSecretCube() {
    if (!isOwner()) return;
    // На оболочке полигона куб не нужен — он появляется внутри загруженной игры.
    if (gameIdFromPath() === "polygon") return;
    // В полигоне (невидимый режим) куб сразу активен — не надо искать предмет.
    if (isStealth()) {
      setCubeState("active");
      showCubeButton();
      showCubeDashboard();
      return;
    }
    const state = cubeState();
    if (state === "active") {
      showCubeButton();
      // вещи живут в панели куба — нижний бар больше не закрывает игру
      setLegacyThingsBarHidden(true);
      setTimeout(() => setLegacyThingsBarHidden(true), 700);
      setTimeout(() => setLegacyThingsBarHidden(true), 1500);
      let open = "1";
      try {
        open = localStorage.getItem("amal-cube-dash-open-v1") || "1";
      } catch (_) {
        open = "1";
      }
      if (open !== "0") showCubeDashboard();
    }
    else if (state === "taken") showCubeActivate();
    else showCubePickup();
  }

  /* ── Призрак глитч-куба: редко на доли секунды мигает где-то на экране ── */
  var glitchGhostStarted = false;
  function ensureGlitchGhostStyles() {
    if (document.getElementById("amal-glitch-ghost-style")) return;
    var st = document.createElement("style");
    st.id = "amal-glitch-ghost-style";
    st.textContent =
      "#amal-glitch-ghost{position:fixed;z-index:2147483040;width:46px;height:46px;pointer-events:none;" +
      "display:grid;place-items:center;font-size:26px;border-radius:9px;" +
      "background:linear-gradient(135deg,#ff004c,#7c3aed 45%,#00e5ff);" +
      "box-shadow:0 0 18px rgba(0,229,255,.75);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);" +
      "opacity:0;mix-blend-mode:screen;animation:amalGhostBlip .42s steps(3) forwards}" +
      "@keyframes amalGhostBlip{0%{opacity:0;transform:translate(-3px,2px) scale(.8)}" +
      "30%{opacity:.95;transform:translate(3px,-2px) scale(1.08)}" +
      "60%{opacity:.7;transform:translate(-2px,1px) scale(.96)}" +
      "100%{opacity:0;transform:translate(2px,-1px) scale(1.05)}}" +
      /* Ловимый глитч-куб: можно кликнуть и «поймать» */
      "#amal-glitch-catch{position:fixed;z-index:2147483045;pointer-events:auto;cursor:pointer;" +
      "display:flex;flex-direction:column;align-items:center;gap:4px;" +
      "transition:left .3s ease,top .3s ease;animation:amalGcJit .5s steps(2) infinite}" +
      "#amal-glitch-catch .amal-gc-face{width:56px;height:56px;display:grid;place-items:center;font-size:34px;border-radius:12px;" +
      "background:linear-gradient(135deg,#ff004c,#7c3aed 45%,#00e5ff);box-shadow:0 0 24px rgba(0,229,255,.85);" +
      "color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);mix-blend-mode:screen}" +
      "#amal-glitch-catch .amal-gc-tag{font:900 11px Nunito,sans-serif;color:#fff;background:rgba(124,58,237,.9);" +
      "padding:2px 8px;border-radius:8px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.45)}" +
      "@keyframes amalGcJit{0%{filter:hue-rotate(0deg)}50%{transform:translate(2px,-1px);filter:hue-rotate(90deg)}" +
      "100%{transform:translate(-2px,1px);filter:hue-rotate(0deg)}}" +
      "#amal-glitch-toast{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:2147483046;" +
      "pointer-events:none;font:900 13px Nunito,sans-serif;color:#fff;text-align:center;max-width:82vw;" +
      "background:linear-gradient(135deg,#ff004c,#7c3aed);padding:8px 14px;border-radius:12px;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.5);opacity:0;transition:opacity .2s ease}" +
      "#amal-glitch-toast.show{opacity:1}";
    document.head.appendChild(st);
  }
  function flashGlitchGhost() {
    try {
      if (document.hidden) return;
      ensureGlitchGhostStyles();
      var el = document.createElement("div");
      el.id = "amal-glitch-ghost";
      var icons = ["🎲", "🔺", "🔷", "⬡", "⚡", "🌈"];
      el.textContent = icons[Math.floor(Math.random() * icons.length)];
      // где-то на экране, но не у самых краёв
      var vw = global.innerWidth || 800;
      var vh = global.innerHeight || 600;
      el.style.left = Math.round(vw * (0.12 + Math.random() * 0.72)) + "px";
      el.style.top = Math.round(vh * (0.14 + Math.random() * 0.66)) + "px";
      document.body.appendChild(el);
      setTimeout(function () {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 460);
    } catch (_) {
      /* ignore */
    }
  }
  // Небольшое сообщение поверх экрана — видно всем игрокам, не только хозяину
  function glitchToast(text) {
    try {
      var t = document.getElementById("amal-glitch-toast");
      if (!t) {
        ensureGlitchGhostStyles();
        t = document.createElement("div");
        t.id = "amal-glitch-toast";
        document.body.appendChild(t);
      }
      t.textContent = String(text || "");
      t.classList.add("show");
      if (t._hide) clearTimeout(t._hide);
      t._hide = setTimeout(function () { t.classList.remove("show"); }, 3600);
    } catch (_) {
      /* ignore */
    }
  }
  function addCubePower(n) {
    try {
      var k = "amal-cube-power-v1";
      var v = Math.max(0, (parseInt(localStorage.getItem(k), 10) || 0) + n);
      localStorage.setItem(k, String(v));
      return v;
    } catch (_) {
      return 0;
    }
  }
  /* Ловимый глитч-куб: «ошибка» задерживается на экране, его можно поймать кликом */
  function spawnCatchGlitchCube() {
    try {
      if (document.hidden) return;
      if (document.getElementById("amal-glitch-catch")) return; // один за раз
      ensureGlitchGhostStyles();
      var wrap = document.createElement("div");
      wrap.id = "amal-glitch-catch";
      wrap.setAttribute("role", "button");
      wrap.setAttribute("tabindex", "0");
      wrap.setAttribute("aria-label", "Поймать глитч-куб");
      var icons = ["🎲", "🔷", "⬡", "🧊", "🎲"];
      var face = icons[Math.floor(Math.random() * icons.length)];
      wrap.innerHTML =
        '<span class="amal-gc-face">' + face + "</span>" +
        '<span class="amal-gc-tag">⚠ ГЛИТЧ! Поймай куб</span>';
      var vw = global.innerWidth || 800;
      var vh = global.innerHeight || 600;
      var place = function () {
        wrap.style.left = Math.round(vw * (0.1 + Math.random() * 0.75)) + "px";
        wrap.style.top = Math.round(vh * (0.14 + Math.random() * 0.62)) + "px";
      };
      place();
      document.body.appendChild(wrap);
      var jump = setInterval(place, 900); // куб «убегает»
      var caught = false;
      var life;
      var done = function () {
        clearInterval(jump);
        if (life) clearTimeout(life);
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      };
      var onCatch = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (caught) return;
        caught = true;
        var reward = 15 + Math.floor(Math.random() * 21);
        addCubePower(reward);
        done();
        glitchToast("🧊 Глитч-куб пойман! Это была ошибка — теперь он под твоим контролем. +" + reward + " силы");
      };
      wrap.addEventListener("click", onCatch);
      wrap.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") onCatch(e);
      });
      life = setTimeout(function () {
        if (caught) return;
        done();
        glitchToast("👻 Глитч исчез — куб ускользнул");
      }, 4600);
      glitchToast("⚠ Ошибка в игре: на экране глитч-куб! Успей поймать");
    } catch (_) {
      /* ignore */
    }
  }
  // Любой игрок может вызвать глитч-куб сам
  try {
    global.amalGlitchGhost = flashGlitchGhost;
    global.amalGlitchCatch = spawnCatchGlitchCube;
  } catch (_) {
    /* ignore */
  }
  function startGlitchGhost() {
    if (glitchGhostStarted) return;
    glitchGhostStarted = true;
    var loop = function () {
      // редко: раз в 40–110 секунд
      var wait = 40000 + Math.floor(Math.random() * 70000);
      setTimeout(function () {
        // 40% — это «ошибка»: ловимый глитч-куб; иначе — короткая вспышка
        if (Math.random() < 0.4) spawnCatchGlitchCube();
        else flashGlitchGhost();
        loop();
      }, wait);
    };
    // первый показ не сразу
    setTimeout(function () {
      if (Math.random() < 0.4) spawnCatchGlitchCube();
      else flashGlitchGhost();
      loop();
    }, 12000 + Math.floor(Math.random() * 18000));
  }

  /* ── Общий чат: игроки общаются между собой (через ту же сеть) ── */
  var CHAT_KEY = "amal-chat-log-v1";
  var chatSeen = {};
  var chatUnread = 0;
  function chatLoad() {
    try {
      return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }
  function chatSave(arr) {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(arr.slice(-60)));
    } catch (_) {
      /* ignore */
    }
  }
  function ensureChatUi() {
    if (document.getElementById("amal-chat-fab")) return;
    if (!document.getElementById("amal-chat-style")) {
      var st = document.createElement("style");
      st.id = "amal-chat-style";
      st.textContent =
        "#amal-chat-fab{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:2147483020;" +
        "width:52px;height:52px;border-radius:16px;border:1px solid rgba(255,255,255,.2);cursor:pointer;" +
        "background:linear-gradient(160deg,#0d6e5f,#0a2a28);color:#fff;font-size:22px;box-shadow:0 10px 24px rgba(0,0,0,.4)}" +
        "#amal-chat-fab .badge{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;" +
        "background:#ef4444;color:#fff;font:800 11px/18px system-ui,sans-serif;display:none}" +
        "#amal-chat-fab .badge.on{display:block}" +
        "#amal-chat-box{position:fixed;left:14px;bottom:calc(74px + env(safe-area-inset-bottom,0px));z-index:2147483021;" +
        "width:min(92vw,320px);height:min(60vh,420px);display:none;flex-direction:column;overflow:hidden;border-radius:16px;" +
        "border:1px solid rgba(13,110,95,.5);background:linear-gradient(180deg,#0f1b1a,#0a1220);box-shadow:0 18px 44px rgba(0,0,0,.5)}" +
        "#amal-chat-box.open{display:flex}" +
        "#amal-chat-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:9px 11px;" +
        "background:rgba(13,110,95,.22);color:#e6fff8;font:800 12px system-ui,sans-serif}" +
        "#amal-chat-head button{border:0;background:rgba(255,255,255,.12);color:#fff;width:26px;height:26px;border-radius:8px;cursor:pointer}" +
        "#amal-chat-list{flex:1 1 auto;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:7px}" +
        "#amal-chat-list .m{max-width:88%;padding:6px 9px;border-radius:12px;background:rgba(255,255,255,.07);color:#eef;" +
        "font:600 12px/1.35 system-ui,sans-serif;align-self:flex-start;word-break:break-word}" +
        "#amal-chat-list .m.me{align-self:flex-end;background:rgba(13,110,95,.45)}" +
        "#amal-chat-list .m.sys{align-self:center;background:transparent;color:#9fe;opacity:.8;font-size:11px;font-weight:800}" +
        "#amal-chat-list .m.ann{align-self:stretch;max-width:100%;text-align:center;color:#1a1400;font-weight:900;font-size:13px;" +
        "background:linear-gradient(135deg,#fde68a,#f59e0b);border:1px solid #fbbf24;box-shadow:0 4px 14px rgba(245,158,11,.4)}" +
        "#amal-chat-list .m .who{display:block;font-size:10px;font-weight:900;opacity:.75;margin-bottom:2px}" +
        "#amal-chat-list .m.owner .who{color:#fde68a}" +
        "#amal-chat-foot{flex:0 0 auto;display:flex;gap:6px;padding:8px;border-top:1px solid rgba(255,255,255,.08)}" +
        "#amal-chat-foot input{flex:1;min-width:0;border-radius:10px;border:1px solid rgba(255,255,255,.14);" +
        "background:rgba(255,255,255,.06);color:#fff;padding:9px 10px;font:inherit}" +
        "#amal-chat-foot button{border:0;border-radius:10px;padding:0 12px;cursor:pointer;" +
        "background:linear-gradient(135deg,#0d6e5f,#0a5248);color:#fff;font:900 13px system-ui,sans-serif}";
      document.head.appendChild(st);
    }
    var fab = document.createElement("button");
    fab.id = "amal-chat-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", "Открыть чат");
    fab.innerHTML = '💬<span class="badge" id="amal-chat-badge"></span>';
    var box = document.createElement("div");
    box.id = "amal-chat-box";
    var ownerTools = isOwner()
      ? '<button type="button" id="amal-chat-announce" aria-label="Объявление всем" title="Объявление всем">📢</button>' +
        '<button type="button" id="amal-chat-clear" aria-label="Очистить чат у всех" title="Очистить чат у всех">🧹</button>'
      : "";
    box.innerHTML =
      '<div id="amal-chat-head"><span>💬 Общий чат</span><span style="display:flex;gap:6px">' +
      ownerTools +
      '<button type="button" id="amal-chat-x" aria-label="Закрыть">✕</button></span></div>' +
      '<div id="amal-chat-list"></div>' +
      '<div id="amal-chat-foot"><input id="amal-chat-input" type="text" maxlength="240" placeholder="Написать всем…" /><button type="button" id="amal-chat-send">➤</button></div>';
    document.body.appendChild(fab);
    document.body.appendChild(box);
    var toggle = function (openIt) {
      var open = openIt != null ? openIt : !box.classList.contains("open");
      box.classList.toggle("open", open);
      if (open) {
        chatUnread = 0;
        updateChatBadge();
        renderChatList();
        var inp = document.getElementById("amal-chat-input");
        if (inp) setTimeout(function () { inp.focus(); }, 30);
      }
    };
    fab.addEventListener("click", function () { toggle(); });
    box.querySelector("#amal-chat-x").addEventListener("click", function () { toggle(false); });
    var sendNow = function () {
      var inp = document.getElementById("amal-chat-input");
      if (!inp) return;
      var v = inp.value;
      inp.value = "";
      chatSend(v);
    };
    box.querySelector("#amal-chat-send").addEventListener("click", sendNow);
    box.querySelector("#amal-chat-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); sendNow(); }
    });
    var clearBtn = box.querySelector("#amal-chat-clear");
    if (clearBtn) clearBtn.addEventListener("click", chatClearAll);
    var annBtn = box.querySelector("#amal-chat-announce");
    if (annBtn) annBtn.addEventListener("click", function () {
      var inp = document.getElementById("amal-chat-input");
      var t = inp && inp.value.trim();
      if (!t) t = (global.prompt && global.prompt("Объявление всем игрокам:")) || "";
      t = (t || "").trim();
      if (!t) return;
      if (inp) inp.value = "";
      chatSendAnnounce(t);
    });
    renderChatList();
  }
  function chatSendAnnounce(text) {
    text = (text || "").trim();
    if (!text || !isOwner()) return;
    var m = chatMsg(text, false);
    m.announce = true;
    m.mine = true;
    chatAddLine(m);
    delete m.mine;
    chatBroadcast(m);
  }
  function chatClearLocal() {
    chatSeen = {};
    chatSave([]);
    renderChatList();
  }
  function chatClearAll() {
    if (!isOwner()) return;
    chatClearLocal();
    var m = { type: "chat-clear", id: Date.now() + "-clr", at: Date.now() };
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(m);
    } catch (_) {
      /* ignore */
    }
    try {
      hostConnections.forEach(function (c) { if (c && c.open) c.send(m); });
    } catch (_) {
      /* ignore */
    }
    var note = chatMsg("🧹 Хозяин очистил чат", true);
    chatAddLine(note);
    chatBroadcast(note);
  }
  function handleChatClear(data, fromConn) {
    if (!data || data.type !== "chat-clear") return false;
    chatClearLocal();
    try {
      if (isOwner()) {
        hostConnections.forEach(function (c) { if (c && c.open && c !== fromConn) c.send(data); });
      }
    } catch (_) {
      /* ignore */
    }
    return true;
  }
  function updateChatBadge() {
    var b = document.getElementById("amal-chat-badge");
    if (!b) return;
    if (chatUnread > 0) { b.textContent = chatUnread > 9 ? "9+" : String(chatUnread); b.classList.add("on"); }
    else b.classList.remove("on");
  }
  function renderChatList() {
    var list = document.getElementById("amal-chat-list");
    if (!list) return;
    var me = (getNick() || "").toLowerCase();
    var log = chatLoad();
    list.innerHTML = log.map(function (m) {
      var cls = "m";
      if (m.sys) cls += " sys";
      else {
        if (m.owner) cls += " owner";
        if ((m.nick || "").toLowerCase() === me && me) cls += " me";
      }
      if (m.sys) return '<div class="' + cls + '">' + escapeHtml(m.text) + "</div>";
      if (m.announce) {
        return '<div class="m ann">📢 ' + escapeHtml(m.text) + "</div>";
      }
      var who = (m.owner ? "👑 " : "") + escapeHtml(m.nick || "Гость");
      return '<div class="' + cls + '"><span class="who">' + who + "</span>" + escapeHtml(m.text) + "</div>";
    }).join("");
    list.scrollTop = list.scrollHeight;
  }
  function chatAddLine(m) {
    if (!m || !m.id) return;
    if (chatSeen[m.id]) return;
    chatSeen[m.id] = 1;
    var log = chatLoad();
    log.push(m);
    chatSave(log);
    if (m.announce && !m.mine) {
      try { showHubToast("📢 " + m.text); } catch (_) { /* ignore */ }
    }
    var box = document.getElementById("amal-chat-box");
    var isOpen = box && box.classList.contains("open");
    if (isOpen) renderChatList();
    else if (!m.mine) { chatUnread++; updateChatBadge(); }
  }
  function chatBroadcast(m) {
    try {
      if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(m);
    } catch (_) {
      /* ignore */
    }
    try {
      if (isOwner()) {
        hostConnections.forEach(function (c) { if (c && c.open) c.send(m); });
      } else if (presenceConn && presenceConn.open) {
        presenceConn.send(m);
      }
    } catch (_) {
      /* ignore */
    }
  }
  function chatMsg(text, isSys) {
    return {
      type: "chat",
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      nick: getNick() || "Гость",
      game: gameIdFromPath() || "portal",
      text: String(text).slice(0, 240),
      at: Date.now(),
      owner: isOwner(),
      sys: !!isSys,
    };
  }
  function chatSend(text) {
    text = (text || "").trim();
    if (!text) return;
    var m = chatMsg(text, false);
    m.mine = true;
    chatAddLine(m);
    delete m.mine;
    chatBroadcast(m);
  }
  function chatAnnounceJoin() {
    try {
      if (sessionStorage.getItem("amal-chat-joined") === "1") return;
      sessionStorage.setItem("amal-chat-joined", "1");
    } catch (_) {
      /* ignore */
    }
    var who = getNick() || (isOwner() ? "Amal" : "Гость");
    var m = chatMsg("👋 " + who + " зашёл(ла) · " + gameTitle(gameIdFromPath() || "portal"), true);
    chatAddLine(m);
    chatBroadcast(m);
  }
  // приём чата в общий обработчик (BroadcastChannel и peer)
  function handleChatMessage(data, fromConn) {
    if (!data || data.type !== "chat") return false;
    chatAddLine(data);
    // хост ретранслирует всем остальным + своим вкладкам
    try {
      if (isOwner()) {
        hostConnections.forEach(function (c) {
          if (c && c.open && c !== fromConn) c.send(data);
        });
        if (global.__amalPresenceBc) global.__amalPresenceBc.postMessage(data);
      }
    } catch (_) {
      /* ignore */
    }
    return true;
  }
  try {
    global.amalChatSend = chatSend;
  } catch (_) {
    /* ignore */
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
    if (enforceBanGate()) {
      return;
    }
    try {
      if (!isOwner() && shouldWipeLocal(getNick())) applyLocalWipe(true);
    } catch {
      /* ignore */
    }
    const redeemed = redeemGrantFromUrl();
    bumpPresence();
    startPresenceNet();
    flushPendingGifts();
    paint();
    updateSameGameStrip();
    if (isOwner() && watchNick) updateWatchPanel();
    setInterval(() => {
      bumpPresence();
      updateSameGameStrip();
      maybeRepaintPlayers();
      if (isOwner() && cubeState() === "active") {
        setLegacyThingsBarHidden(true);
        refreshCubeDashPlayers();
      }
      if (!isOwner() && myBanStatus()) enforceBanGate();
    }, 8000);
    const abuse = activeAbuse();
    if (abuse) showAdminAbuseFx(abuse);
    try {
      mountSecretCube();
    } catch (_) {
      /* ignore */
    }
    try {
      startGlitchGhost();
    } catch (_) {
      /* ignore */
    }
    try {
      ensureChatUi();
    } catch (_) {
      /* ignore */
    }
    try {
      if (getNick() || isOwner()) setTimeout(chatAnnounceJoin, 3500);
    } catch (_) {
      /* ignore */
    }
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
        // отметить прочитанным сразу, чтобы окно показалось один раз и не мешало меню
        storeSet(KEYS.changelogSeen, CHANGELOG[0].id);
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
      if (open && (adminPage === "live" || adminPage === "players" || adminPage === "profile" || adminPage === "watch") && isOwner()) paint();
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
    banPlayer,
    unbanPlayer,
    wipePlayerProgress,
    playersTableRows,
    startWatch,
    stopWatch,
    reportActivity,
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
