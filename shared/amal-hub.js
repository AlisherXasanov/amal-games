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
    { id: "globe-battle", name: "Globe Battle" },
  ];

  const CHANGELOG = [
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

  function isOwner() {
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

  function isGameAdmin(gameId) {
    const id = gameId || gameIdFromPath();
    if (isOwner()) return true;
    const map = pruneMyPowers();
    return !!(map[id] && map[id].on);
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
      const nick = getNick();
      if (!nick) {
        setNick(payload.nick);
      } else if (nick.toLowerCase() !== String(payload.nick).toLowerCase()) {
        return {
          ok: false,
          message: "Ссылка для ника «" + payload.nick + "», а у тебя «" + nick + "». Смени ник.",
        };
      }
      applyPower(payload.game, payload.id, payload.exp);
      return {
        ok: true,
        message: "Админка включена в игре: " + gameTitle(payload.game),
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
      "coin-arsenal": "Coin Arsenal",
      "x-buggy": "X-Buggy",
      "melon-playground": "Melon Playground",
      "space-courier": "Космический курьер",
      "bravol-stars": "Brawl Stars",
      "snake-game": "Snake",
      "ladder-climb": "Ступеньки вверх",
      terraverse: "Пиксель-Террариум",
      "globe-battle": "Globe Battle",
    };
    return map[id] || id;
  }

  function getNick() {
    const n = storeGet(KEYS.nick, "");
    return typeof n === "string" ? n.trim() : "";
  }

  function setNick(raw) {
    const nick = String(raw || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, NICK_MAX);
    if (nick.length < NICK_MIN) return { ok: false, error: "Минимум " + NICK_MIN + " символа" };
    if (/[<>]/.test(nick)) return { ok: false, error: "Без < >" };
    storeSet(KEYS.nick, nick);
    if (!isOwner()) bumpPresence();
    else removeSelfFromPresence();
    return { ok: true, nick };
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

  function bumpPresence() {
    // Главного админа в список игроков НЕ пишем
    if (isOwner()) {
      removeSelfFromPresence();
      return;
    }
    const nick = getNick();
    if (!nick) return;
    const map = loadPresence();
    map[nick] = {
      nick,
      game: gameIdFromPath(),
      gameTitle: gameTitle(gameIdFromPath()),
      at: Date.now(),
    };
    storeSet(KEYS.presence, map);
  }

  function removeSelfFromPresence() {
    const nick = getNick();
    const map = loadPresence();
    let changed = false;
    if (nick && map[nick]) {
      delete map[nick];
      changed = true;
    }
    // На всякий случай убрать типичные админ-ники
    ["AmalNova", "Amal", "AmalX", "AmalOwner"].forEach((n) => {
      if (map[n]) {
        delete map[n];
        changed = true;
      }
    });
    if (changed) storeSet(KEYS.presence, map);
  }

  function recentPlayers(maxAgeMs) {
    const age = maxAgeMs || 1000 * 60 * 60 * 24 * 7;
    const now = Date.now();
    const myNick = (getNick() || "").toLowerCase();
    return Object.values(loadPresence())
      .filter((p) => p && p.at && now - p.at < age)
      .filter((p) => String(p.nick || "").toLowerCase() !== myNick)
      .filter((p) => !p.isOwner)
      .sort((a, b) => b.at - a.at);
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
.amal-hub-modal{width:min(100%,440px);max-height:min(90dvh,680px);overflow:auto;border-radius:24px 24px 18px 18px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,#171526f5,#0b1020f7);color:#f8fafc;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.55)}
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
.amal-hub-hero .badge{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(160deg,#fbbf24,#b45309);font-size:22px;flex:0 0 auto}
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

    // Быстрые действия во время игры (только главному)
    if (owner && inGame && !open && !gateMode) {
      const players = recentPlayers();
      html += `<div class="amal-hub-dock">
        <button type="button" class="primary" data-amal="quick-grant">⚡ Админка</button>
        <button type="button" data-amal="admin-players">👥 Кто (${players.length})</button>
        <button type="button" data-amal="admin-write">✉️</button>
        <button type="button" data-amal="admin-inbox">📩</button>
        <button type="button" data-amal="open">☰</button>
      </div>`;
    } else {
      html += `<button type="button" class="amal-hub-fab ${owner || gameAdmin ? "admin" : ""}" data-amal="open" title="${
        owner ? "Меню хозяина" : gameAdmin ? "Твоя админка" : "Ник и заметки"
      }">${owner || gameAdmin ? "👑" : "📝"}</button>`;
    }

    if (open || gateMode) {
      html += `<div class="amal-hub-overlay" data-amal="backdrop"><div class="amal-hub-modal" data-amal="modal">`;
      if (view === "nick" || !nick) {
        html += nickFormHtml(nick);
      } else if (view === "updates") {
        html += updatesHtml();
      } else if (view === "admin" && (owner || gameAdmin)) {
        html += adminHtml();
      } else {
        html += noteFormHtml(nick);
      }
      html += `</div></div>`;
    }
    root.innerHTML = html;
    bindUi();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nickFormHtml(current) {
    return `
      <h2>${current ? "Сменить ник" : "Как тебя зовут?"}</h2>
      <p class="sub">Ник нужен во всех играх Amal's Games. Без ника играть нельзя.</p>
      <input id="amal-nick-input" maxlength="${NICK_MAX}" placeholder="Например: AmalPro" value="${escapeHtml(
        current || "",
      )}" />
      ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
      ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
      <div class="amal-hub-row">
        <button type="button" class="primary" data-amal="save-nick" style="flex:1">Сохранить ник</button>
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
    const fullOwner = canGrantAdmin();
    const tabs = `
      <div class="amal-hub-tabs">
        <button type="button" class="on" data-amal="tab-admin">Моё меню</button>
        <button type="button" data-amal="tab-note">Как игрок</button>
        <button type="button" data-amal="tab-updates">Что нового</button>
      </div>`;

    if (adminPage === "players") {
      return `
        <h2>1. Кто играет</h2>
        <p class="sub">Ники людей с этого браузера</p>
        ${tabs}
        <div class="amal-hub-help">Нажми ник, чтобы выдать ему админку (если ты главный).</div>
        <ul class="amal-hub-list">${
          players.length
            ? players
                .map(
                  (p) =>
                    `<li><div class="meta">${fmtTime(p.at)}</div><b>${escapeHtml(p.nick)}</b><div style="margin-top:4px">Играет в: ${escapeHtml(
                      p.gameTitle || p.game,
                    )}</div>${
                      fullOwner
                        ? `<div class="amal-hub-row" style="margin-top:6px"><button type="button" class="primary" data-amal="grant-pick" data-nick="${escapeHtml(
                            p.nick,
                          )}">Выдать админку</button></div>`
                        : ""
                    }</li>`,
                )
                .join("")
            : `<li class="meta">Пока никто не заходил.</li>`
        }</ul>
        <div class="amal-hub-row">
          <button type="button" data-amal="admin-menu" style="flex:1">← Назад в меню</button>
          <button type="button" data-amal="close">Закрыть</button>
        </div>`;
    }

    if (adminPage === "inbox") {
      return `
        <h2>2. Сообщения тебе</h2>
        <p class="sub">Что написали игроки</p>
        ${tabs}
        <div class="amal-hub-help">«Ответить» подставит ник. «Прочитано» — отметить.</div>
        <ul class="amal-hub-list">${
          incoming.length
            ? incoming
                .map(
                  (n) =>
                    `<li><div class="meta">От: <b>${escapeHtml(n.nick)}</b> · ${escapeHtml(
                      gameTitle(n.game),
                    )} · ${fmtTime(n.at)}${n.status === "done" ? " · прочитано" : ""}</div>${escapeHtml(n.text)}
                    <div class="amal-hub-row" style="margin-top:6px">
                      <button type="button" class="primary" data-amal="reply" data-to="${escapeHtml(n.nick)}">Ответить</button>
                      <button type="button" data-amal="mark" data-id="${escapeHtml(n.id)}">Прочитано</button>
                      ${
                        fullOwner
                          ? `<button type="button" data-amal="grant-pick" data-nick="${escapeHtml(n.nick)}">Дать админку</button>`
                          : ""
                      }
                    </div></li>`,
                )
                .join("")
            : `<li class="meta">Сообщений пока нет.</li>`
        }</ul>
        <div class="amal-hub-row">
          <button type="button" data-amal="admin-menu" style="flex:1">← Назад в меню</button>
          <button type="button" data-amal="close">Закрыть</button>
        </div>`;
    }

    if (adminPage === "write") {
      return `
        <h2>3. Написать игроку</h2>
        <p class="sub">Ответ для ника</p>
        ${tabs}
        <div class="amal-hub-help">Сначала ник, потом текст, потом «Отправить».</div>
        <input id="amal-admin-to" maxlength="${NICK_MAX}" placeholder="Ник игрока" value="${escapeHtml(
          replyTo || "",
        )}" />
        <textarea id="amal-admin-note" maxlength="500" placeholder="Напиши ответ..."></textarea>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row">
          <button type="button" class="primary" data-amal="admin-send" style="flex:1">Отправить</button>
          <button type="button" data-amal="admin-menu">← Меню</button>
        </div>`;
    }

    if (adminPage === "grant" && fullOwner) {
      const grants = activeIssuedGrants().slice(0, 20);
      return `
        <h2>5. Выдать админку</h2>
        <p class="sub">Игрок получит силы в выбранных играх, но НЕ сможет выдавать админку другим</p>
        ${tabs}
        <div class="amal-hub-help">1) Ник → 2) галочки игр → 3) «Выдать». Потом скопируй ссылку игроку. Отмена — кнопка «Забрать».</div>
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
          <button type="button" data-amal="admin-menu">← Меню</button>
        </div>
        ${
          lastGrantLinks.length
            ? `<h3 style="margin:14px 0 0;font-size:13px">Ссылки для игрока</h3>${lastGrantLinks
                .map(
                  (l) =>
                    `<div class="amal-hub-step"><h3>${escapeHtml(l.name)}</h3><div class="amal-hub-linkbox">${escapeHtml(
                      l.link,
                    )}</div><button type="button" data-amal="copy-link" data-link="${escapeHtml(
                      l.link,
                    )}" style="margin-top:6px;width:100%">Скопировать ссылку</button></div>`,
                )
                .join("")}`
            : ""
        }
        <h3 style="margin:14px 0 0;font-size:13px">Уже выдано</h3>
        <ul class="amal-hub-list">${
          grants.length
            ? grants
                .map(
                  (g) =>
                    `<li><div class="meta">${escapeHtml(g.nick)} · ${escapeHtml(gameTitle(g.game))} · ${fmtTime(
                      g.at,
                    )}</div>
                    <div class="amal-hub-row" style="margin-top:6px">
                      <button type="button" data-amal="grant-revoke" data-id="${escapeHtml(g.id)}">Забрать админку</button>
                      <button type="button" data-amal="copy-link" data-link="${escapeHtml(g.link || "")}">Ссылка</button>
                    </div></li>`,
                )
                .join("")
            : `<li class="meta">Пока никому не выдавал</li>`
        }</ul>`;
    }

    if (!fullOwner && isGameAdmin()) {
      const games = myAdminGames();
      return `
        <h2>⚡ Ты админ в игре</h2>
        <p class="sub">Амаль выдал тебе силы. Выдавать админку другим нельзя.</p>
        ${tabs}
        <div class="amal-hub-help">Твои игры с админкой: ${
          games.length ? games.map((g) => gameTitle(g)).join(", ") : "нет"
        }</div>
        <div class="amal-hub-row" style="margin-top:12px">
          <button type="button" data-amal="close" style="flex:1">Понятно, закрыть</button>
        </div>`;
    }

    return `
      <div class="amal-hub-hero"><div class="badge">👑</div><div>
        <h2>Меню хозяина</h2>
        <p class="sub">Ты не в списке игроков. Здесь можно писать людям и выдавать админку по играм.</p>
      </div></div>
      ${tabs}
      <div class="amal-hub-help">Во время игры внизу есть быстрые кнопки: дать админку в эту игру, кто здесь, написать.</div>
      <div class="amal-hub-big">
        <button type="button" data-amal="admin-players"><b>👥 Кто играет</b><span>Только гости — тебя там нет</span></button>
        <button type="button" data-amal="admin-inbox"><b>📩 Сообщения мне</b><span>${
          incoming.filter((n) => n.status !== "done").length
            ? "Новых: " + incoming.filter((n) => n.status !== "done").length
            : "Пока пусто"
        }</span></button>
        <button type="button" data-amal="admin-write"><b>✉️ Написать игроку</b><span>Ответ на ник</span></button>
        ${
          fullOwner
            ? `<button type="button" data-amal="admin-grant"><b>⚡ Выдать / забрать админку</b><span>Выбери ник и одну или несколько игр</span></button>`
            : ""
        }
        <button type="button" data-amal="export"><b>📋 Скопировать всё</b><span>Список игроков и заметок</span></button>
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
        if (act === "admin-players") {
          adminPage = "players";
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
          msg = "Ник сохранён: " + res.nick;
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
          const res = addNote(text && text.value, {
            fromAdmin: true,
            toNick: (to && to.value.trim()) || null,
            game: gameIdFromPath(),
          });
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          msg = "Ответ сохранён";
          paint();
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
    const redeemed = redeemGrantFromUrl();
    bumpPresence();
    paint();
    if (!getNick()) {
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
    setInterval(bumpPresence, 30000);
    global.addEventListener("amal-owner-changed", () => paint());
  }

  global.AmalHub = {
    getNick,
    setNick,
    addNote,
    isOwner,
    canGrantAdmin,
    isGameAdmin,
    myAdminGames,
    issueGrants,
    revokeGrant,
    open: openUi,
    gameId: gameIdFromPath,
    CHANGELOG,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
