/**
 * Amal World Character — общий герой, телепортер и 20 способностей между играми.
 * Подключается из amal-hub.js. Работает только для хозяина (owner).
 */
(function (global) {
  "use strict";

  if (global.AmalWorld) return;

  var SAVE_KEY = "amal-world-hero-v1";
  var ARRIVE_KEY = "amal-world-arrive-v1";
  var BEACON_KEY = "amal-world-beacon-v1";
  var HISTORY_MAX = 8;
  var HERO_SCALE = 1.35;

  var state = {
    name: "Амаль",
    energy: 100,
    hair: "#2b2118",
    skin: "#e8b890",
    shirt: "#5b8def",
    pants: "#2f3d55",
    beard: false,
    lastGame: "",
    history: [],
    fly: false,
    shield: false,
    invincible: false,
    slow: false,
    reward: false,
    xray: false,
    rainbow: false,
    clone: false,
    visible: true,
    portalGun: false,
    ammo: "map",
    outfit: "classic",
    creepy: true,
    uiVer: 0,
    bossOn: false,
    mirror: false,
    beauty: false,
    leaves: false,
    hidePref: "auto", // "auto" — прятать на телефоне; "hide" — всегда прятать; "show" — всегда показывать
  };

  var OUTFITS = {
    classic: { name: "Обычный Амаль", icon: "👤", shirt: "#5b8def", pants: "#2f3d55", cape: ["#7c3aed", "#2563eb"], crown: null, aura: "#a78bfa", trim: "#fde68a" },
    king: { name: "Король", icon: "👑", shirt: "#facc15", pants: "#7c2d12", cape: ["#dc2626", "#7f1d1d"], crown: "gold", aura: "#fde047", trim: "#fff7ae" },
    emperor: { name: "Император", icon: "🏛", shirt: "#f8fafc", pants: "#b45309", cape: ["#f59e0b", "#b45309"], crown: "imperial", aura: "#fcd34d", trim: "#fde68a" },
    diamond: { name: "Алмазный принц", icon: "💎", shirt: "#a5f3fc", pants: "#0e7490", cape: ["#67e8f9", "#0891b2"], crown: "diamond", aura: "#a5f3fc", trim: "#ecfeff" },
    shadow: { name: "Тёмный лорд", icon: "🖤", shirt: "#1f2937", pants: "#111827", cape: ["#6d28d9", "#111827"], crown: "spiked", aura: "#a855f7", trim: "#c4b5fd" },
    dragon: { name: "Драконий король", icon: "🐉", shirt: "#15803d", pants: "#14532d", cape: ["#22c55e", "#065f46"], crown: "horns", aura: "#4ade80", trim: "#bbf7d0" },
    phoenix: { name: "Царь-Феникс", icon: "🔥", shirt: "#f97316", pants: "#7c2d12", cape: ["#fbbf24", "#dc2626"], crown: "flame", aura: "#fb923c", trim: "#fed7aa" },
    galaxy: { name: "Галактический царь", icon: "🌌", shirt: "#312e81", pants: "#1e1b4b", cape: ["#8b5cf6", "#0f172a"], crown: "star", aura: "#818cf8", trim: "#c7d2fe" },
  };

  function outfit() {
    return OUTFITS[state.outfit] || OUTFITS.classic;
  }

  function isRoyal() {
    return !!(state.outfit && state.outfit !== "classic");
  }

  var ui = {
    root: null,
    canvas: null,
    panel: null,
    teleport: null,
    energyEl: null,
    msgEl: null,
  };

  var hero = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    phase: 0,
    mode: "idle",
    teleporting: false,
    keys: Object.create(null),
    localAim: false,
  };

  var cds = Object.create(null);
  var clones = [];
  var last = performance.now();
  var hospitalHooked = false;
  var AW_VERSION = "v40";

  // Портал-пушка: снаряды летят, открывают портал; вход в портал = телепорт.
  var portalGunArmed = false;
  var portalGunEquipped = false; // предмет всегда в руках — стреляй сколько угодно
  var portalClickHandler = null;
  var pendingPortalTarget = "map"; // "map" — переход по экрану; иначе id игры
  var portalShots = [];
  var portals = [];
  var portalCooldownUntil = 0;
  var portalTime = 0; // общее время для анимации воронки
  // Добрый босс-гигант: владелец сам решает, когда вызвать, и раздаёт дары.
  var bossActive = false;
  var boss = { x: 0, y: 0, tx: 0, ty: 0, phase: 0, scale: 3.4 };
  var bossGifts = []; // падающие подарки при раздаче
  var leaves = []; // ambient листопад
  // Куда ставим героя при выходе из парного портала (дальше кольца, чтобы не
  // засчиталось повторным входом). Возврат назад — обычным заходом в кольцо.
  var EXIT_DIST = 110;

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      Object.keys(state).forEach(function (k) {
        if (data[k] != null) state[k] = data[k];
      });
      if (!Array.isArray(state.history)) state.history = [];
    } catch (_) {}
  }

  function save() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          name: state.name,
          energy: state.energy,
          hair: state.hair,
          skin: state.skin,
          shirt: state.shirt,
          pants: state.pants,
          beard: state.beard,
          lastGame: state.lastGame,
          history: state.history.slice(0, HISTORY_MAX),
          visible: state.visible,
          portalGun: state.portalGun,
          ammo: state.ammo,
          outfit: state.outfit,
          creepy: state.creepy,
          uiVer: state.uiVer,
          bossOn: state.bossOn,
          mirror: state.mirror,
          beauty: state.beauty,
          leaves: state.leaves,
          hidePref: state.hidePref,
        })
      );
    } catch (_) {}
  }

  var OWNER_CODES = ["amalowner2026", "amal", "1234", "buddy"];

  /**
   * Хозяин определяется по ЛЮБОМУ источнику. Важно не доверять только хабу:
   * в аварийном lite-режиме он подменяется заглушкой с isOwner() === false.
   */
  function isOwner() {
    try {
      var code = new URLSearchParams(location.search).get("owner");
      if (code && OWNER_CODES.indexOf(String(code).trim().toLowerCase()) >= 0) {
        try {
          localStorage.setItem("amal-owner-v1", "1");
          localStorage.setItem("amal-owner-v3", "1");
        } catch (_) {}
        global.__AMAL_OWNER__ = true;
        return true;
      }
    } catch (_) {}
    try {
      if (global.__AMAL_OWNER__ === true) return true;
    } catch (_) {}
    try {
      if (
        ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"].some(function (k) {
          return localStorage.getItem(k) === "1";
        })
      ) {
        return true;
      }
    } catch (_) {}
    try {
      if (global.AmalOwner && typeof global.AmalOwner.isOwner === "function" && global.AmalOwner.isOwner()) return true;
    } catch (_) {}
    try {
      if (global.AmalPowers && typeof global.AmalPowers.isOwner === "function" && global.AmalPowers.isOwner()) return true;
    } catch (_) {}
    try {
      if (global.AmalHub && !global.AmalHub.lite && typeof global.AmalHub.isOwner === "function" && global.AmalHub.isOwner()) {
        return true;
      }
    } catch (_) {}
    return false;
  }

  function gameId() {
    try {
      if (global.AmalHub && typeof global.AmalHub.gameId === "function") return global.AmalHub.gameId() || "portal";
    } catch (_) {}
    try {
      var parts = (location.pathname || "").split("/").filter(Boolean);
      var i = parts.indexOf("amal-games");
      if (i >= 0) return parts[i + 1] || "portal";
      return parts[parts.length - 1] || "portal";
    } catch (_) {
      return "portal";
    }
  }

  function isCatalogPage() {
    var id = gameId();
    return !id || id === "portal";
  }

  function isThreeStyleGame() {
    try {
      var p = String(location.pathname || "").toLowerCase();
      var ids = [
        "/obby",
        "/tower-defense",
        "/tycoon",
        "/murder-mystery",
        "/pet-simulator",
        "/flee-facility",
        "/build-boat",
        "/adopt-me",
        "/blox-fruits",
        "/brookhaven-rp",
        "/grow-garden",
        "/nights-forest",
        "/rivals-arena",
        "/speed-escape",
        "/steal-brainrot",
        "/minecraft",
        "/bed-wars",
        "/portal-3d",
        "/lab3d",
        "/pot-hammer",
        "/candle-mine",
      ];
      for (var i = 0; i < ids.length; i++) {
        if (p.indexOf(ids[i]) !== -1) return true;
      }
    } catch (_) {}
    return false;
  }

  function shouldRunWorld() {
    if (global.__AMAL_NO_WORLD__) return false;
    if (isCatalogPage()) return false;
    if (isThreeStyleGame()) return false;
    return isOwner();
  }

  function gameList() {
    var list = [];
    try {
      if (global.AmalHub && Array.isArray(global.AmalHub.GRANTABLE_GAMES)) list = global.AmalHub.GRANTABLE_GAMES.slice();
    } catch (_) {}
    if (!list.length) {
      list = [
        { id: "animal-hospital", name: "Animal Hospital" },
        { id: "tesla-arena", name: "Тесла-Арена" },
        { id: "adopt-me", name: "Adopt Me" },
        { id: "pet-simulator", name: "Pet Simulator" },
        { id: "zombie-vs-plants", name: "Зомби vs растения" },
        { id: "minecraft", name: "CraftWorld" },
        { id: "obby", name: "Obby" },
        { id: "joy-surprise", name: "Секретный подарок" },
      ];
    }
    try {
      var dreamAt = Number(localStorage.getItem("amal-secret-dream-unlock-v1")) || 0;
      if (dreamAt && Date.now() >= dreamAt && !list.some(function (g) { return g.id === "secret-dream"; })) {
        list.unshift({ id: "secret-dream", name: "???" });
      }
    } catch (_) {}
    return list;
  }

  function gameHref(id) {
    var here = gameId();
    var base = here === "portal" ? "./" : "../";
    if (!id || id === "__portal" || id === "portal") return base;
    return base + id + "/";
  }

  function toast(text) {
    if (!ui.msgEl) return;
    ui.msgEl.textContent = text;
    ui.msgEl.classList.add("show");
    clearTimeout(ui.msgEl._t);
    ui.msgEl._t = setTimeout(function () {
      ui.msgEl.classList.remove("show");
    }, 2200);
  }

  function setEnergy(n) {
    state.energy = Math.max(0, Math.min(100, Math.floor(n)));
    if (ui.energyEl) {
      ui.energyEl.textContent = "⚡ " + state.energy + "%";
      ui.energyEl.classList.toggle("full", state.energy >= 100);
    }
    save();
  }

  function spend(cost) {
    if (state.energy < cost) {
      toast("Нужно " + cost + "⚡");
      return false;
    }
    setEnergy(state.energy - cost);
    return true;
  }

  function onCd(id, ms) {
    var now = Date.now();
    if ((cds[id] || 0) > now) {
      toast("Перезарядка…");
      return false;
    }
    cds[id] = now + ms;
    return true;
  }

  function dispatch(type, extra) {
    try {
      var detail = { type: type, source: "amal-world" };
      if (extra) for (var k in extra) detail[k] = extra[k];
      global.dispatchEvent(new CustomEvent("amal-power", { detail: detail }));
    } catch (_) {}
  }

  function ensureStyle() {
    if (document.getElementById("amal-world-style")) return;
    var st = document.createElement("style");
    st.id = "amal-world-style";
    st.textContent =
      "#amal-world-root{position:fixed;inset:0;z-index:2147483300;pointer-events:none;background:transparent;font-family:system-ui,Segoe UI,sans-serif}" +
      "#amal-world-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:transparent}" +
      "#amal-world-dock{position:fixed;left:8px;top:50%;transform:translateY(-50%);z-index:2147483305;pointer-events:auto;display:flex;align-items:center;gap:8px}" +
      "#amal-world-fab{width:54px;height:54px;flex:0 0 auto;border-radius:16px;border:1px solid rgba(167,139,250,.6);background:linear-gradient(160deg,#7c3aed,#2563eb);color:#fff;font-size:26px;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.5),0 0 0 rgba(167,139,250,.6);animation:awFabPulse 2.4s ease-in-out infinite}" +
      "@keyframes awFabPulse{0%,100%{box-shadow:0 10px 26px rgba(0,0,0,.5),0 0 0 0 rgba(167,139,250,.5)}50%{box-shadow:0 10px 26px rgba(0,0,0,.5),0 0 0 10px rgba(167,139,250,0)}}" +
      "#amal-world-tools{display:none;flex-direction:column;gap:6px;align-items:stretch;padding:10px;border-radius:16px;border:1px solid rgba(255,255,255,.16);background:rgba(10,12,22,.9);backdrop-filter:blur(8px);box-shadow:0 16px 40px rgba(0,0,0,.55);max-height:88vh;overflow:auto;width:200px}" +
      "#amal-world-dock.open #amal-world-tools{display:flex}" +
      "#amal-world-dock .aw-row{display:flex;flex-direction:column;gap:6px}" +
      "#amal-world-dock button{border:1px solid rgba(255,255,255,.22);border-radius:12px;padding:9px 11px;cursor:pointer;background:linear-gradient(160deg,#1e293b,#0f172a);color:#fff;font:800 12px system-ui;box-shadow:0 8px 20px rgba(0,0,0,.35);text-align:left}" +
      "#amal-world-dock button.primary{background:linear-gradient(160deg,#7c3aed,#2563eb)}" +
      "#amal-world-dock button.heal{background:linear-gradient(135deg,#10b981,#059669)}" +
      "#amal-world-dock button.equipped{background:linear-gradient(135deg,#f59e0b,#dc2626);border-color:#fde68a;box-shadow:0 0 0 2px rgba(253,224,71,.5),0 8px 20px rgba(0,0,0,.35)}" +
      "#amal-world-dock .aw-energy{padding:7px 10px;border-radius:999px;background:rgba(15,23,42,.88);border:1px solid rgba(103,232,249,.35);color:#a5f3fc;font:800 12px system-ui;text-align:center}" +
      "#amal-world-dock .aw-energy.full{background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff}" +
      "#amal-world-msg{position:fixed;left:50%;top:12%;transform:translateX(-50%);z-index:2147483310;max-width:88vw;padding:10px 14px;border-radius:14px;background:rgba(76,29,149,.92);color:#fff;font:900 14px system-ui;opacity:0;transition:opacity .2s;pointer-events:none;text-align:center}" +
      "#amal-world-msg.show{opacity:1}" +
      "#amal-world-panel,#amal-world-tele{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483320;width:min(420px,94vw);max-height:min(80vh,620px);overflow:auto;pointer-events:auto;display:none;border-radius:20px;border:1px solid rgba(167,139,250,.5);background:linear-gradient(165deg,#1a1030fa,#0b1220fc);color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.7),0 0 0 9999px rgba(4,6,14,.55);padding:14px}" +
      "#amal-world-panel.open,#amal-world-tele.open{display:block}" +
      "#amal-world-panel h3,#amal-world-tele h3{margin:0 0 10px;font:900 16px system-ui;display:flex;align-items:center;justify-content:space-between;gap:8px}" +
      "#amal-world-panel h3 .aw-x,#amal-world-tele h3 .aw-x{width:30px;height:30px;flex:0 0 auto;border-radius:9px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font:900 14px system-ui;cursor:pointer;padding:0;text-align:center}" +
      "#amal-world-panel .aw-g{margin:0 0 10px}" +
      "#amal-world-panel .aw-g b{display:block;margin:0 0 6px;color:#c4b5fd;font-size:11px;letter-spacing:.04em}" +
      "#amal-world-panel .aw-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
      "#amal-world-panel button,#amal-world-tele button{width:100%;text-align:left;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:10px 11px;background:rgba(255,255,255,.07);color:#fff;font:800 12px/1.3 system-ui;cursor:pointer}" +
      "#amal-world-panel button[data-aw=superheal]{background:linear-gradient(135deg,#10b981,#059669);border-color:rgba(167,243,208,.6);grid-column:1/-1;font-size:13px}" +
      "#amal-world-panel button:hover,#amal-world-tele button:hover{background:rgba(124,58,237,.35)}" +
      "#amal-world-panel button small,#amal-world-tele button small{display:block;opacity:.75;font-weight:700}" +
      "#amal-world-tele input{width:100%;margin:0 0 8px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#fff;padding:8px 10px;font:700 13px system-ui}" +
      "#amal-world-tele .aw-list{display:flex;flex-direction:column;gap:5px;max-height:52vh;overflow:auto}" +
      "#amal-world-fx{position:fixed;inset:0;z-index:2147483030;pointer-events:none}" +
      "@keyframes awPortalIn{0%{opacity:0;transform:scale(.6)}40%{opacity:1;transform:scale(1.08)}100%{opacity:0;transform:scale(1.4)}}" +
      "@keyframes awPortalOut{0%{opacity:0}20%{opacity:1}100%{opacity:1;filter:brightness(2)}}" +
      ".aw-portal-burst{position:fixed;left:50%;top:50%;width:min(70vw,420px);height:min(70vw,420px);margin:-35vmin;border-radius:50%;background:radial-gradient(circle,#a5f3fc,#7c3aed 45%,transparent 70%);animation:awPortalIn .85s ease forwards}" +
      ".aw-portal-veil{position:fixed;inset:0;background:radial-gradient(circle at 50% 50%,rgba(103,232,249,.55),rgba(15,23,42,.92));animation:awPortalOut .7s ease forwards}" +
      "#amal-world-root.hospital-hide #amal-world-canvas{opacity:0}" +
      "#amal-world-root.aw-hidden{display:none!important}" +
      "#amal-world-showpill{position:fixed;left:6px;bottom:calc(70px + env(safe-area-inset-bottom,0px));z-index:2147483340;width:40px;height:40px;border-radius:12px;border:1px solid rgba(167,139,250,.55);background:rgba(10,12,22,.72);color:#fff;font-size:18px;cursor:pointer;display:none;padding:0;box-shadow:0 8px 20px rgba(0,0,0,.4)}" +
      "#amal-world-showpill.on{display:block}" +
      "@media(max-width:820px){#amal-world-dock{left:6px;top:auto;bottom:calc(70px + env(safe-area-inset-bottom,0px));transform:none}#amal-world-tools{width:min(72vw,220px);max-height:70vh}#amal-world-dock button{font-size:11px;padding:7px 9px}}";
    document.head.appendChild(st);
  }

  function ensureUi() {
    if (ui.root) return;
    ensureStyle();
    var root = document.createElement("div");
    root.id = "amal-world-root";
    root.innerHTML =
      '<canvas id="amal-world-canvas"></canvas>' +
      '<div id="amal-world-msg"></div>' +
      '<div id="amal-world-dock">' +
      '<button type="button" id="amal-world-fab" title="Силы Амаля">🦸</button>' +
      '<div class="aw-tools" id="amal-world-tools">' +
      '<div class="aw-energy" id="amal-world-energy">⚡ 100%</div>' +
      '<div class="aw-row">' +
      '<button type="button" class="primary" id="amal-world-tele-btn">🌀 Портал в игру</button>' +
      '<button type="button" class="primary" id="amal-world-portalgun">🔫 Портал-пушка</button>' +
      '<button type="button" id="amal-world-portalammo">🎯 Заряд: карта</button>' +
      '<button type="button" id="amal-world-portalgame">🎮 Портал в игру</button>' +
      '<button type="button" class="heal" id="amal-world-heal">💚 Супер-лечение</button>' +
      '<button type="button" id="amal-world-powers-btn">⚡ Силы</button>' +
      '<button type="button" id="amal-world-portalclear">🗑 Убрать порталы</button>' +
      '<button type="button" id="amal-world-skins">👑 Скины</button>' +
      '<button type="button" id="amal-world-toggle">👤 Амаль</button>' +
      '<button type="button" id="amal-world-creepy">😈 Жуткая улыбка</button>' +
      '<button type="button" id="amal-world-beard">🧔 Борода</button>' +
      '<button type="button" id="amal-world-hide">🙈 Скрыть на телефоне</button>' +
      '<button type="button" id="amal-world-cancel">⏹ Стоп</button>' +
      "</div></div></div>" +
      '<div id="amal-world-panel"></div>' +
      '<div id="amal-world-tele"></div>';
    document.body.appendChild(root);
    ui.root = root;
    ui.canvas = document.getElementById("amal-world-canvas");
    ui.panel = document.getElementById("amal-world-panel");
    ui.teleport = document.getElementById("amal-world-tele");
    ui.energyEl = document.getElementById("amal-world-energy");
    ui.msgEl = document.getElementById("amal-world-msg");
    setEnergy(state.energy);

    hero.x = Math.max(80, (innerWidth || 800) * 0.72);
    hero.y = Math.max(120, (innerHeight || 600) * 0.62);

    document.getElementById("amal-world-fab").onclick = function () {
      var dock = document.getElementById("amal-world-dock");
      if (dock) dock.classList.toggle("open");
    };
    document.getElementById("amal-world-toggle").onclick = function () {
      // В играх с привязкой к центру кнопка переключает режим:
      // «играю за Амаля по центру» ↔ «свободный герой (бегает где хочу)».
      if (Object.prototype.hasOwnProperty.call(CENTER_LOCK_GAMES, gameId())) {
        freeRoamHere = !freeRoamHere;
        state.visible = true;
        save();
        try {
          window.__AMAL_HIDE_NATIVE__ = !freeRoamHere;
        } catch (_) {}
        toast(freeRoamHere ? "🕹 Свободный Амаль (виден игрок игры)" : "🎮 Играю за Амаля (один персонаж)");
        return;
      }
      state.visible = !state.visible;
      save();
      toast(state.visible ? "Герой Амаль виден" : "Герой скрыт");
    };
    document.getElementById("amal-world-creepy").onclick = function () {
      state.creepy = !state.creepy;
      save();
      try {
        window.__AMAL_WORLD_CREEPY__ = state.creepy;
      } catch (_) {}
      var b = document.getElementById("amal-world-creepy");
      if (b) b.classList.toggle("equipped", state.creepy);
      toast(state.creepy ? "😈 Жуткая улыбка всегда" : "Обычное лицо");
    };
    document.getElementById("amal-world-portalclear").onclick = function () {
      portals = [];
      portalShots = [];
      toast("🗑 Порталы убраны · заряд пушки сохранён: " + ammoLabel());
    };
    document.getElementById("amal-world-beard").onclick = function () {
      state.beard = !state.beard;
      save();
      try {
        window.__AMAL_WORLD_BEARD__ = state.beard;
      } catch (_) {}
      toast(state.beard ? "🧔 Борода надета" : "Борода снята");
    };
    document.getElementById("amal-world-portalgun").onclick = function () {
      if (portalGunEquipped) {
        equipPortalGun(false);
        return;
      }
      pendingPortalTarget = state.ammo || "map";
      equipPortalGun(true);
    };
    document.getElementById("amal-world-portalammo").onclick = function () {
      ui.panel.classList.remove("open");
      ui.teleport.classList.add("open");
      renderTeleport("", "ammo");
      toast("🎯 Выбери, куда будет вести портал — пушка зарядится этой игрой");
    };
    document.getElementById("amal-world-portalgame").onclick = function () {
      ui.panel.classList.remove("open");
      ui.teleport.classList.add("open");
      renderTeleport("", true);
      toast("Выбери игру — портал откроется рядом с тобой, зайди в него");
    };
    document.getElementById("amal-world-tele-btn").onclick = function () {
      ui.panel.classList.remove("open");
      ui.teleport.classList.toggle("open");
      renderTeleport();
    };
    document.getElementById("amal-world-powers-btn").onclick = function () {
      ui.teleport.classList.remove("open");
      ui.panel.classList.toggle("open");
      renderPowers();
    };
    document.getElementById("amal-world-skins").onclick = function () {
      ui.teleport.classList.remove("open");
      ui.panel.classList.add("open");
      renderSkins();
    };
    document.getElementById("amal-world-heal").onclick = function () {
      superHeal();
    };
    document.getElementById("amal-world-cancel").onclick = cancelModes;
    document.getElementById("amal-world-hide").onclick = function () {
      state.hidePref = "hide";
      save();
      applyHidden();
      toast("🙈 Герой скрыт · нажми фиолетовую кнопку слева, чтобы вернуть");
    };

    var pill = document.getElementById("amal-world-showpill");
    if (!pill) {
      pill = document.createElement("button");
      pill.type = "button";
      pill.id = "amal-world-showpill";
      pill.title = "Показать героя Амаля";
      pill.textContent = "🦸";
      pill.onclick = function () {
        state.hidePref = "show";
        save();
        applyHidden();
        toast("🦸 Герой Амаль снова тут");
      };
      document.body.appendChild(pill);
    }
    applyHidden();

    if (state.creepy) {
      var cb = document.getElementById("amal-world-creepy");
      if (cb) cb.classList.add("equipped");
    }
    addEventListener("keydown", onKey);
    addEventListener("keyup", function (e) {
      hero.keys[e.key.toLowerCase()] = false;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        hero.keys[e.key] = false;
      }
    });
    addEventListener("resize", function () {
      resizeCanvas();
      applyHidden();
    });
    resizeCanvas();
    renderPowers();
    renderTeleport();
  }

  function resizeCanvas() {
    if (!ui.canvas) return;
    ui.canvas.width = innerWidth || 800;
    ui.canvas.height = innerHeight || 600;
  }

  function isTouch() {
    try {
      return (
        (window.matchMedia && window.matchMedia("(pointer:coarse)").matches) ||
        "ontouchstart" in window ||
        (navigator.maxTouchPoints || 0) > 0 ||
        (innerWidth || 9999) <= 820
      );
    } catch (_) {
      return false;
    }
  }

  // Скрываем фигуру героя и его кнопки, чтобы не мешали игре на телефоне.
  function heroHidden() {
    if (state.hidePref === "hide") return true;
    if (state.hidePref === "show") return false;
    // "auto": на телефоне/таче прячем всегда (фигура + кнопки мешают играть)
    return isTouch();
  }

  function applyHidden() {
    var hidden = heroHidden();
    if (ui.root) ui.root.classList.toggle("aw-hidden", hidden);
    var pill = document.getElementById("amal-world-showpill");
    if (pill) pill.classList.toggle("on", hidden);
  }

  function onKey(e) {
    if (!isOwner()) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    var k = e.key.toLowerCase();
    hero.keys[k] = true;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") hero.keys[e.key] = true;
    if (k === "p" && e.altKey) {
      e.preventDefault();
      ui.panel.classList.toggle("open");
      renderPowers();
    }
    if (k === "f") {
      state.fly = !state.fly;
      dispatch("fly", { on: state.fly });
      toast(state.fly ? "🕊️ Полёт вкл (F)" : "Полёт выкл (F)");
    }
  }

  function renderPowers() {
    if (!ui.panel) return;
    var groups = [
      {
        title: "ДОБРЫЙ БОСС",
        items: [
          { id: "boss", label: "🦁 Вызвать босса-гиганта", cost: 0, tip: "вкл/выкл · встаёт за спиной · запомнит" },
          { id: "bossgift", label: "🎁 Босс раздаёт дары", cost: 0, tip: "всем награды + лечение" },
          { id: "bossrain", label: "🌈 Щедрый ливень", cost: 0, tip: "море подарков" },
          { id: "bossfreeze", label: "❄️ Босс защищает", cost: 0, tip: "заморозить врагов" },
          { id: "bosscome", label: "🕹 Босс, ко мне", cost: 0, tip: "поставить рядом" },
        ],
      },
      {
        title: "КРАСОТА МИРА",
        items: [
          { id: "mirror", label: "🪞 Зеркальный двойник", cost: 0, tip: "уникальное отражение · запомнит" },
          { id: "beauty", label: "🎨 Красивый мир", cost: 0, tip: "свет, тени, сочность · запомнит" },
          { id: "leaves", label: "🌿 Листопад", cost: 0, tip: "падающие листья · запомнит" },
        ],
      },
      {
        title: "ПОРТАЛЫ",
        items: [
          { id: "warp", label: "В любую игру", cost: 0, tip: "открыть список" },
          { id: "local", label: "Локальный скачок", cost: 15, tip: "кликни точку" },
          { id: "back", label: "Назад", cost: 10, tip: "прошлый мир" },
          { id: "beacon", label: "Маяк", cost: 20, tip: "запомнить место" },
          { id: "swap", label: "К маяку", cost: 25, tip: "прыжок к маяку" },
        ],
      },
      {
        title: "ТЕСЛА",
        items: [
          { id: "zap", label: "Цепная молния", cost: 30, tip: "BZZZ" },
          { id: "magnet", label: "Магнит", cost: 35, tip: "притянуть" },
          { id: "timestop", label: "Тайм-стоп", cost: 45, tip: "заморозка" },
          { id: "nova", label: "Тесла-нова", cost: 70, tip: "вспышка" },
          { id: "recharge", label: "Полный заряд", cost: 0, tip: "⚡100%" },
        ],
      },
      {
        title: "ГЕРОЙ",
        items: [
          { id: "superheal", label: "💚 Супер-лечение", cost: 0, tip: "всё по максимуму" },
          { id: "immortal", label: "Бессмертие", cost: 40, tip: "вкл/выкл" },
          { id: "shield", label: "Щит", cost: 30, tip: "защита" },
          { id: "fly", label: "Полёт", cost: 20, tip: "вверх/вниз" },
          { id: "clone", label: "Клон", cost: 50, tip: "двойник" },
        ],
      },
      {
        title: "МИР",
        items: [
          { id: "rainbow", label: "Радуга", cost: 35, tip: "цвет мира" },
          { id: "xray", label: "X-Ray", cost: 30, tip: "взгляд" },
          { id: "slow", label: "Замедление", cost: 35, tip: "slow-mo" },
          { id: "reward", label: "×Награды", cost: 40, tip: "бонус" },
          { id: "allin", label: "Всё сразу", cost: 90, tip: "комбо" },
        ],
      },
    ];
    ui.panel.innerHTML =
      '<h3><span>⚡ Силы Амаля</span><button type="button" class="aw-x" data-aw-close="1">✕</button></h3>' +
      groups
        .map(function (g) {
          return (
            '<div class="aw-g"><b>' +
            g.title +
            '</b><div class="aw-grid">' +
            g.items
              .map(function (it) {
                return (
                  '<button type="button" data-aw="' +
                  it.id +
                  '">' +
                  it.label +
                  "<small>" +
                  (it.cost ? it.cost + "⚡ · " : "") +
                  it.tip +
                  "</small></button>"
                );
              })
              .join("") +
            "</div></div>"
          );
        })
        .join("");
    ui.panel.onclick = function (e) {
      if (e.target.closest("[data-aw-close]")) {
        ui.panel.classList.remove("open");
        return;
      }
      var btn = e.target.closest("[data-aw]");
      if (!btn) return;
      usePower(btn.getAttribute("data-aw"));
    };
  }

  function renderSkins() {
    if (!ui.panel) return;
    var cur = state.outfit || "classic";
    ui.panel.innerHTML =
      '<h3><span>👑 Королевские скины</span><button type="button" class="aw-x" data-aw-close="1">✕</button></h3>' +
      '<div class="aw-list">' +
      Object.keys(OUTFITS)
        .map(function (id) {
          var o = OUTFITS[id];
          return (
            '<button type="button" data-aw-skin="' +
            id +
            '"' +
            (id === cur ? ' class="equipped"' : "") +
            ">" +
            o.icon +
            " " +
            o.name +
            (id === cur ? " ✓" : "") +
            "</button>"
          );
        })
        .join("") +
      "</div>";
    ui.panel.onclick = function (e) {
      if (e.target.closest("[data-aw-close]")) {
        ui.panel.classList.remove("open");
        return;
      }
      var b = e.target.closest("[data-aw-skin]");
      if (!b) return;
      var id = b.getAttribute("data-aw-skin");
      state.outfit = id;
      save();
      try {
        window.__AMAL_WORLD_OUTFIT__ = id;
      } catch (_) {}
      renderSkins();
      var o = OUTFITS[id];
      toast(o.icon + " Надет скин: " + o.name);
    };
  }

  function renderTeleport(filter, mode) {
    if (!ui.teleport) return;
    // mode: "ammo" — зарядить пушку; иначе всегда открываем портал рядом
    // (мгновенных переносов больше нет — только через вход в портал)
    ui.teleport._mode = mode === "ammo" ? "ammo" : "portal";
    var q = (filter || "").toLowerCase();
    var here = gameId();
    var items = gameList().filter(function (g) {
      if (g.id === here) return false;
      if (!q) return true;
      return (g.name + " " + g.id).toLowerCase().indexOf(q) >= 0;
    });
    var head =
      ui.teleport._mode === "ammo" ? "🎯 Чем зарядить пушку" : "🌀 Портал рядом со мной";
    ui.teleport.innerHTML =
      '<h3><span>' + head + '</span><button type="button" class="aw-x" data-aw-close="1">✕</button></h3>' +
      '<input id="amal-world-tele-q" type="search" placeholder="Найти игру…" value="' +
      (filter || "").replace(/"/g, "&quot;") +
      '" />' +
      '<div class="aw-list">' +
      (ui.teleport._mode === "ammo"
        ? '<button type="button" data-game="__map">🗺 По карте (прыжок по экрану)</button>'
        : "") +
      '<button type="button" data-game="__portal">🏠 Каталог</button>' +
      (ui.teleport._mode === "ammo" ? "" : '<button type="button" data-aw-act="back">↩ Назад</button>') +
      items
        .map(function (g) {
          return '<button type="button" data-game="' + g.id + '">🎮 ' + (g.name || g.id) + "</button>";
        })
        .join("") +
      "</div>";
    var inp = document.getElementById("amal-world-tele-q");
    if (inp) {
      inp.oninput = function () {
        renderTeleport(inp.value, ui.teleport._mode);
        var n = document.getElementById("amal-world-tele-q");
        if (n) {
          n.focus();
          try {
            n.setSelectionRange(n.value.length, n.value.length);
          } catch (_) {}
        }
      };
    }
    ui.teleport.onclick = function (e) {
      if (e.target.closest("[data-aw-close]")) {
        ui.teleport.classList.remove("open");
        return;
      }
      var back = e.target.closest("[data-aw-act]");
      if (back && back.getAttribute("data-aw-act") === "back") {
        usePower("back");
        return;
      }
      var btn = e.target.closest("[data-game]");
      if (!btn) return;
      var gid = btn.getAttribute("data-game");
      var mode = ui.teleport._mode;
      if (mode === "ammo") {
        var ammo = gid === "__map" ? "map" : gid === "__portal" ? "portal" : gid;
        state.ammo = ammo;
        pendingPortalTarget = ammo;
        save();
        updateAmmoBtn();
        ui.teleport.classList.remove("open");
        equipPortalGun(true);
        return;
      }
      var tgt = gid === "__portal" ? "portal" : gid;
      // Любая выбранная игра одновременно становится постоянным зарядом пушки.
      // Закрытие самого портала этот выбор не сбрасывает.
      if (gid !== "__portal") {
        state.ammo = gid;
        pendingPortalTarget = gid;
        save();
        updateAmmoBtn();
      }
      ui.teleport.classList.remove("open");
      var dock = document.getElementById("amal-world-dock");
      if (dock) dock.classList.remove("open");
      openPortalNear(tgt);
    };
  }

  function ammoLabel() {
    var a = state.ammo || "map";
    if (a === "map") return "карта";
    if (a === "portal") return "Каталог";
    return titleOf(a);
  }

  function updateAmmoBtn() {
    var b = document.getElementById("amal-world-portalammo");
    if (b) b.textContent = "🎯 Заряд: " + ammoLabel();
  }

  function portalFx(kind) {
    var layer = document.createElement("div");
    layer.id = "amal-world-fx";
    layer.innerHTML = kind === "out" ? '<div class="aw-portal-veil"></div><div class="aw-portal-burst"></div>' : '<div class="aw-portal-burst"></div>';
    document.body.appendChild(layer);
    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 900);
  }

  function pushHistory(fromId) {
    if (!fromId) return;
    state.history = [fromId].concat(state.history.filter(function (x) {
      return x !== fromId;
    })).slice(0, HISTORY_MAX);
    state.lastGame = fromId;
    save();
  }

  function goToGame(id) {
    if (!isOwner() && !ui.root) return;
    var target = id === "__portal" ? "portal" : id;
    if (!target) return;
    var from = gameId();
    if (target === from || (target === "portal" && from === "portal")) {
      toast("Ты уже здесь");
      return;
    }
    pushHistory(from);
    try {
      localStorage.setItem(
        ARRIVE_KEY,
        JSON.stringify({ from: from, to: target, at: Date.now(), name: state.name })
      );
    } catch (_) {}
    hero.teleporting = true;
    hero.mode = "teleport";
    portalFx("out");
    toast("🌀 Телепорт…");
    var href = gameHref(target);
    try {
      var u = new URL(href, location.href);
      u.searchParams.set("owner", "AmalOwner2026");
      u.searchParams.set("amalArrive", "1");
      href = u.href;
    } catch (_) {
      href = href + (href.indexOf("?") >= 0 ? "&" : "?") + "owner=AmalOwner2026&amalArrive=1";
    }
    setTimeout(function () {
      location.href = href;
    }, 650);
  }

  function handleArrival() {
    var data = null;
    try {
      data = JSON.parse(localStorage.getItem(ARRIVE_KEY) || "null");
      localStorage.removeItem(ARRIVE_KEY);
    } catch (_) {}
    try {
      var params = new URLSearchParams(location.search);
      if (params.get("amalArrive") === "1") {
        params.delete("amalArrive");
        var clean = location.pathname + (params.toString() ? "?" + params.toString() : "") + location.hash;
        history.replaceState(null, "", clean);
      }
    } catch (_) {}
    if (!data || !data.from) return;
    portalFx("in");
    hero.mode = "teleport";
    hero.teleporting = true;
    setTimeout(function () {
      hero.teleporting = false;
      hero.mode = "idle";
    }, 800);
    toast("✨ " + (data.name || "Амаль") + " прибыл из «" + titleOf(data.from) + "» · 💚 супер-лечение");
    setTimeout(function () {
      superHeal(true);
      openReturnPortal(data.from);
    }, 900);
  }

  function titleOf(id) {
    if (!id || id === "portal") return "Каталог";
    var hit = gameList().find(function (g) {
      return g.id === id;
    });
    return (hit && hit.name) || id;
  }

  function cancelModes() {
    state.fly = false;
    state.shield = false;
    state.invincible = false;
    state.slow = false;
    state.reward = false;
    state.xray = false;
    state.rainbow = false;
    state.clone = false;
    clones = [];
    hero.localAim = false;
    equipPortalGun(false);
    portalShots = [];
    portals = [];
    document.documentElement.style.filter = "";
    document.documentElement.style.animation = "";
    dispatch("timestop", { on: false });
    dispatch("invincible", { on: false });
    dispatch("shield", { on: false });
    dispatch("fly", { on: false });
    dispatch("xray", { on: false });
    dispatch("slow", { on: false });
    dispatch("rewardBoost", { on: false });
    toast("Режимы сняты");
  }

  function usePower(id) {
    if (!isOwner()) return;
    switch (id) {
      case "warp":
        ui.panel.classList.remove("open");
        ui.teleport.classList.add("open");
        renderTeleport();
        return;
      case "local":
        if (!spend(15) || !onCd("local", 1200)) return;
        if (ui.panel) ui.panel.classList.remove("open");
        if (ui.teleport) ui.teleport.classList.remove("open");
        hero.localAim = true;
        toast("Кликни на поле, куда прыгнуть");
        onceLocalTeleport();
        return;
      case "back":
        if (!spend(10)) return;
        var prev = state.history[0];
        if (!prev) {
          setEnergy(state.energy + 10);
          toast("Нет прошлого мира");
          return;
        }
        openPortalNear(prev);
        return;
      case "beacon":
        if (!spend(20) || !onCd("beacon", 1500)) return;
        try {
          localStorage.setItem(
            BEACON_KEY,
            JSON.stringify({ game: gameId(), x: hero.x, y: hero.y, at: Date.now() })
          );
        } catch (_) {}
        toast("📍 Маяк поставлен");
        return;
      case "swap":
        if (!spend(25) || !onCd("swap", 2000)) return;
        var beacon = null;
        try {
          beacon = JSON.parse(localStorage.getItem(BEACON_KEY) || "null");
        } catch (_) {}
        if (!beacon || !beacon.game) {
          setEnergy(state.energy + 25);
          toast("Сначала поставь маяк");
          return;
        }
        if (beacon.game === gameId()) {
          hero.x = beacon.x;
          hero.y = beacon.y;
          portalFx("in");
          dispatch("localTeleport", { x: beacon.x, y: beacon.y });
          toast("К маяку!");
        } else {
          openPortalNear(beacon.game);
        }
        return;
      case "zap":
        if (!spend(30) || !onCd("zap", 1800)) return;
        flashBolts();
        dispatch("killAll");
        toast("💥 Цепная молния!");
        return;
      case "magnet":
        if (!spend(35) || !onCd("magnet", 2000)) return;
        dispatch("magnet", { on: true, ms: 5000 });
        toast("🧲 Магнит!");
        return;
      case "timestop":
        if (!spend(45) || !onCd("timestop", 2500)) return;
        state.slow = !state.slow;
        dispatch("timestop", { on: true });
        toast("⏳ Тайм-стоп");
        setTimeout(function () {
          dispatch("timestop", { on: false });
          state.slow = false;
        }, 6000);
        return;
      case "nova":
        if (!spend(70) || !onCd("nova", 4000)) return;
        portalFx("in");
        flashBolts();
        dispatch("killAll");
        dispatch("nova");
        toast("💥 Тесла-нова!");
        return;
      case "recharge":
        if (!onCd("recharge", 8000)) return;
        setEnergy(100);
        toast("⚡ Катушка заряжена");
        return;
      case "immortal":
        if (!spend(40) || !onCd("immortal", 1500)) return;
        state.invincible = !state.invincible;
        dispatch("invincible", { on: state.invincible });
        toast(state.invincible ? "🛡️ Бессмертие вкл" : "Бессмертие выкл");
        return;
      case "superheal":
        if (!onCd("superheal", 1200)) return;
        superHeal();
        return;
      case "shield":
        if (!spend(30) || !onCd("shield", 1500)) return;
        state.shield = !state.shield;
        dispatch("shield", { on: state.shield });
        toast(state.shield ? "🛡️ Щит" : "Щит снят");
        return;
      case "fly":
        if (!spend(20) || !onCd("fly", 1000)) return;
        state.fly = !state.fly;
        dispatch("fly", { on: state.fly });
        toast(state.fly ? "🕊️ Полёт" : "Полёт выкл");
        return;
      case "clone":
        if (!spend(50) || !onCd("clone", 3000)) return;
        state.clone = true;
        clones = [
          { x: hero.x - 40, y: hero.y, life: 10, phase: 0 },
          { x: hero.x + 40, y: hero.y, life: 10, phase: 1 },
        ];
        dispatch("clone", { count: 2 });
        toast("👥 Клоны!");
        return;
      case "rainbow":
        if (!spend(35) || !onCd("rainbow", 2000)) return;
        state.rainbow = !state.rainbow;
        document.documentElement.style.filter = state.rainbow ? "hue-rotate(90deg) saturate(1.35)" : "";
        dispatch("rainbow", { on: state.rainbow });
        toast(state.rainbow ? "🌈 Радуга" : "Радуга выкл");
        return;
      case "xray":
        if (!spend(30) || !onCd("xray", 1500)) return;
        state.xray = !state.xray;
        document.documentElement.style.filter = state.xray ? "contrast(1.25) brightness(1.1)" : "";
        dispatch("xray", { on: state.xray });
        toast(state.xray ? "👁️ X-Ray" : "X-Ray выкл");
        return;
      case "slow":
        if (!spend(35) || !onCd("slow", 2000)) return;
        state.slow = true;
        dispatch("slow", { on: true, factor: 0.4 });
        toast("⏳ Замедление");
        setTimeout(function () {
          state.slow = false;
          dispatch("slow", { on: false });
        }, 6000);
        return;
      case "reward":
        if (!spend(40) || !onCd("reward", 2500)) return;
        state.reward = true;
        dispatch("rewardBoost", { on: true, factor: 5 });
        dispatch("coinMult", { factor: 5 });
        toast("🎁 Награды ×5");
        setTimeout(function () {
          state.reward = false;
          dispatch("rewardBoost", { on: false });
        }, 12000);
        return;
      case "allin":
        if (!spend(90) || !onCd("allin", 10000)) return;
        state.invincible = true;
        state.shield = true;
        state.fly = true;
        state.rainbow = true;
        setEnergy(100);
        document.documentElement.style.filter = "hue-rotate(40deg) saturate(1.3)";
        dispatch("invincible", { on: true });
        dispatch("killAll");
        dispatch("heal", { amount: 999 });
        dispatch("coinMult", { factor: 10 });
        portalFx("in");
        toast("🤝 Всё сразу!");
        return;
      case "boss":
        bossActive = !bossActive;
        state.bossOn = bossActive;
        save();
        if (bossActive) {
          bossSummonAt();
          portalFx("in");
          toast("🦁 Добрый босс-гигант с тобой · он за спиной · запомню");
        } else {
          toast("Босс ушёл отдыхать");
        }
        return;
      case "bosscome":
        if (!bossActive) {
          bossActive = true;
          state.bossOn = true;
          save();
          toast("🦁 Босс пришёл");
        }
        bossSummonAt(true);
        return;
      case "bossgift":
        if (!bossActive) {
          toast("Сначала вызови босса 🦁");
          return;
        }
        bossGiveGifts();
        return;
      case "bossrain":
        if (!bossActive) {
          toast("Сначала вызови босса 🦁");
          return;
        }
        bossGiveGifts();
        setTimeout(bossGiveGifts, 400);
        setTimeout(bossGiveGifts, 900);
        toast("🌈 Щедрый ливень даров!");
        return;
      case "bossfreeze":
        if (!bossActive) {
          toast("Сначала вызови босса 🦁");
          return;
        }
        dispatch("killAll");
        dispatch("timestop", { ms: 4000 });
        flashBolts();
        toast("❄️ Босс заморозил врагов и защитил всех");
        return;
      case "mirror":
        state.mirror = !state.mirror;
        save();
        if (state.mirror) {
          spawnMirror();
          toast("🪞 Зеркальный двойник с тобой · запомню");
        } else {
          clones = clones.filter(function (c) {
            return !c.mirror;
          });
          if (!clones.length) state.clone = false;
          toast("Зеркало убрано");
        }
        return;
      case "beauty":
        state.beauty = !state.beauty;
        save();
        applyBeauty();
        toast(state.beauty ? "🎨 Красивый мир включён · запомню" : "Обычный вид");
        return;
      case "leaves":
        state.leaves = !state.leaves;
        save();
        if (!state.leaves) leaves = [];
        toast(state.leaves ? "🌿 Листопад включён · запомню" : "Листопад выключен");
        return;
      default:
        return;
    }
  }

  function spawnMirror() {
    // Уникальное зеркало: полупрозрачный двойник, отражённый по горизонтали,
    // повторяет позу героя с задержкой и лёгким мерцанием.
    clones = clones.filter(function (c) {
      return !c.mirror;
    });
    clones.push({ x: hero.x, y: hero.y, life: 1e9, phase: 0, mirror: true });
    state.clone = true;
  }

  function applyBeauty() {
    try {
      var id = "amal-beauty-style";
      var el = document.getElementById(id);
      if (state.beauty) {
        if (!el) {
          el = document.createElement("style");
          el.id = id;
          document.head.appendChild(el);
        }
        // Мягкая цветокоррекция + виньетка поверх любой игры — безопасно, без движка.
        el.textContent =
          "html{filter:saturate(1.18) contrast(1.06) brightness(1.03)!important;}" +
          "#amal-beauty-vignette{position:fixed;inset:0;pointer-events:none;z-index:2147483000;" +
          "background:radial-gradient(120% 120% at 50% 38%,transparent 55%,rgba(10,10,30,.34) 100%);" +
          "mix-blend-mode:multiply;}" +
          "#amal-beauty-sun{position:fixed;inset:0;pointer-events:none;z-index:2147483000;" +
          "background:radial-gradient(60% 45% at 72% 8%,rgba(255,241,190,.28),transparent 60%);}";
        if (!document.getElementById("amal-beauty-vignette")) {
          var v = document.createElement("div");
          v.id = "amal-beauty-vignette";
          document.body.appendChild(v);
          var sun = document.createElement("div");
          sun.id = "amal-beauty-sun";
          document.body.appendChild(sun);
        }
      } else {
        if (el) el.remove();
        var vv = document.getElementById("amal-beauty-vignette");
        if (vv) vv.remove();
        var ss = document.getElementById("amal-beauty-sun");
        if (ss) ss.remove();
      }
    } catch (_) {}
  }

  function updateLeaves(dt) {
    var W = (ui.canvas && ui.canvas.width) || innerWidth || 800;
    var H = (ui.canvas && ui.canvas.height) || innerHeight || 600;
    if (state.leaves && Math.random() < dt * 6) {
      leaves.push({
        x: Math.random() * W,
        y: -10,
        vy: 20 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 30,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 2,
        sway: Math.random() * 6,
        icon: Math.random() < 0.5 ? "🍃" : Math.random() < 0.5 ? "🍂" : "🌿",
        life: 12,
      });
    }
    leaves = leaves.filter(function (l) {
      l.life -= dt;
      l.x += (l.vx + Math.sin((l.life + l.sway) * 2) * 14) * dt;
      l.y += l.vy * dt;
      l.rot += l.vr * dt;
      return l.life > 0 && l.y < H + 20;
    });
  }

  function drawLeaves(ctx) {
    if (!leaves.length) return;
    ctx.save();
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    leaves.forEach(function (l) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.9, l.life / 3);
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.fillText(l.icon, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  function bossSummonAt(instant) {
    var behind = -(hero.facing || 1);
    boss.tx = hero.x + behind * 96;
    boss.ty = hero.y;
    if (instant || (!boss.x && !boss.y)) {
      boss.x = boss.tx;
      boss.y = boss.ty;
    }
  }

  function bossGiveGifts() {
    // Гигант осыпает всех дарами: награды, лечение, монеты + дождь подарков.
    var icons = ["🎁", "💎", "👑", "⭐", "🍬", "💰", "❤️"];
    var W = (ui.canvas && ui.canvas.width) || innerWidth || 800;
    for (var i = 0; i < 26; i++) {
      bossGifts.push({
        x: Math.random() * W,
        y: -20 - Math.random() * 160,
        vy: 90 + Math.random() * 130,
        vx: (Math.random() - 0.5) * 40,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 4,
        icon: icons[(Math.random() * icons.length) | 0],
        life: 5,
      });
    }
    superHeal(true);
    dispatch("rewardBoost", { on: true, factor: 5 });
    dispatch("coinMult", { factor: 5 });
    dispatch("heal", { amount: 999 });
    try {
      if (global.AmalHub && global.AmalHub.broadcastGift) global.AmalHub.broadcastGift("boss");
    } catch (_) {}
    portalFx("in");
    toast("🎁 Босс раздаёт дары всем! +награды +лечение");
    setTimeout(function () {
      dispatch("rewardBoost", { on: false });
    }, 12000);
  }

  function updateBoss(dt) {
    if (bossActive) bossSummonAt();
    boss.phase += dt;
    boss.x += (boss.tx - boss.x) * Math.min(1, dt * 6);
    boss.y += (boss.ty - boss.y) * Math.min(1, dt * 6);
    var W = (ui.canvas && ui.canvas.width) || innerWidth || 800;
    var H = (ui.canvas && ui.canvas.height) || innerHeight || 600;
    bossGifts = bossGifts.filter(function (g) {
      g.life -= dt;
      g.vy += dt * 60;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.rot += g.vr * dt;
      if (g.y > H - 8) {
        g.y = H - 8;
        g.vy *= -0.35;
        g.vx *= 0.6;
      }
      return g.life > 0 && g.x > -40 && g.x < W + 40;
    });
  }

  function superHeal(silent) {
    setEnergy(100);
    state.shield = true;
    dispatch("heal", { amount: 999999 });
    dispatch("shield", { on: true });
    dispatch("superheal", { on: true });
    portalFx("in");
    if (!silent) toast("💚 СУПЕР-ЛЕЧЕНИЕ · полное восстановление!");
  }

  function armPortalGun() {
    // Теперь портал-пушка — постоянный предмет: включаем режим стрельбы.
    equipPortalGun(true);
  }

  function equipPortalGun(on) {
    if (!isOwner()) return;
    if (on == null) on = !portalGunEquipped;
    portalGunEquipped = !!on;
    portalGunArmed = portalGunEquipped;
    state.portalGun = portalGunEquipped;
    if (portalGunEquipped) pendingPortalTarget = state.ammo || "map";
    save();
    var btn = document.getElementById("amal-world-portalgun");
    if (btn) {
      btn.classList.toggle("equipped", portalGunEquipped);
      btn.textContent = portalGunEquipped ? "🔫 Пушка ВКЛ (ПКМ)" : "🔫 Портал-пушка";
    }
    updateAmmoBtn();
    if (!portalGunEquipped) {
      if (portalClickHandler) removeEventListener("contextmenu", portalClickHandler, true);
      portalClickHandler = null;
      toast("🔫 Портал-пушка убрана");
      return;
    }
    if (ui.panel) ui.panel.classList.remove("open");
    if (ui.teleport) ui.teleport.classList.remove("open");
    var dock = document.getElementById("amal-world-dock");
    if (dock) dock.classList.remove("open");
    var where = pendingPortalTarget === "map" ? "по карте" : "в «" + ammoLabel() + "»";
    toast("🔫 Пушка заряжена: " + where + " · ЛКМ — играй/копай · ПКМ — стреляй порталом");
    // Стреляем ТОЛЬКО по правой кнопке — левый клик остаётся игре (копать/ходить).
    // Пушка держится заряженной всю игру: стреляй сколько угодно, без переактивации.
    if (!portalClickHandler) {
      portalClickHandler = function (e) {
        if (!portalGunEquipped) return;
        var t = e.target;
        if (t && t.closest && t.closest("#amal-world-dock,#amal-world-panel,#amal-world-tele,#amal-world-fab")) return;
        e.preventDefault();
        firePortal(e.clientX, e.clientY, pendingPortalTarget);
      };
      addEventListener("contextmenu", portalClickHandler, true);
    }
  }

  function firePortal(tx, ty, target) {
    if (!spend(15)) return;
    var sx = hero.x;
    var sy = hero.y - 12;
    var ang = Math.atan2(ty - sy, tx - sx);
    if (tx < hero.x) hero.facing = -1;
    else hero.facing = 1;
    portalShots.push({
      x: sx,
      y: sy,
      tx: tx,
      ty: ty,
      vx: Math.cos(ang) * 900,
      vy: Math.sin(ang) * 900,
      target: target || "map",
      life: 2.5,
    });
    flashBolts();
  }

  function worldCam() {
    // Игра сообщает положение камеры — значит портал можно «прибить» к миру,
    // и он перестанет ездить за героем по экрану.
    try {
      var c = window.__AMAL_NATIVE_CAM__;
      if (c && Date.now() - c.t < 900) return c;
    } catch (_) {}
    return null;
  }

  function portalPos(p) {
    if (p.world) {
      var cam = worldCam();
      if (cam) return { x: p.wx - cam.x, y: p.wy - cam.y };
    }
    return { x: p.x, y: p.y };
  }

  function pushPortal(p) {
    var cam = worldCam();
    if (cam) {
      p.world = true;
      p.wx = p.x + cam.x;
      p.wy = p.y + cam.y;
    }
    if (p.target === "map") {
      // Порталы по карте живут парой: синий и оранжевый.
      var mapPortals = portals.filter(function (q) {
        return q.target === "map";
      });
      var prev = mapPortals[mapPortals.length - 1];
      p.slot = prev && prev.slot === "a" ? "b" : "a";
      // третий выстрел вытесняет самый старый портал пары
      while (mapPortals.length >= 2) {
        var dead = mapPortals.shift();
        portals.splice(portals.indexOf(dead), 1);
      }
      var mate = portals.filter(function (q) {
        return q.target === "map";
      })[0];
      if (mate) {
        p.pair = mate;
        mate.pair = p;
      }
    }
    portals.push(p);
    while (portals.length > 3) {
      var idx = portals.findIndex(function (q) {
        return !q.back && q.target !== "map";
      });
      if (idx < 0) {
        idx = portals.findIndex(function (q) {
          return !q.back;
        });
      }
      portals.splice(idx >= 0 ? idx : 0, 1);
    }
  }

  function openPortalNear(target) {
    // Портал появляется прямо рядом с героем — заходишь и попадаешь в игру.
    var dir = hero.facing || 1;
    var px = Math.max(60, Math.min((innerWidth || 800) - 60, hero.x + dir * 90));
    var py = hero.y;
    pushPortal({ x: px, y: py, r: 4, target: target || "map", born: 0, ready: false });
    portalFx("in");
    var name = target === "map" || target === "portal" ? "Каталог" : titleOf(target);
    toast("🌀 Портал в «" + name + "» рядом с тобой · подойди и войди (или 🗑 убрать)");
  }

  function openReturnPortal(fromId) {
    // Обратный портал: появляется за спиной героя и ведёт туда, откуда пришёл.
    var dir = -(hero.facing || 1);
    var px = Math.max(60, Math.min((innerWidth || 800) - 60, hero.x + dir * 110));
    var py = hero.y;
    pushPortal({ x: px, y: py, r: 4, target: fromId, born: 0, ready: false, back: true });
    toast("↩ Обратный портал в «" + titleOf(fromId) + "» открыт рядом — можно вернуться");
  }

  function openPortalAt(x, y, target) {
    pushPortal({ x: x, y: y, r: 4, target: target || "map", born: 0, ready: false });
    toast(target === "map" ? "🌀 Портал открыт · зайди в него" : "🌀 Портал в «" + titleOf(target) + "» · зайди в него");
  }

  function updatePortals(dt) {
    portalTime += dt;
    portalShots = portalShots.filter(function (s) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      var reached = Math.hypot(s.x - s.tx, s.y - s.ty) < 24;
      var edge = s.x < 0 || s.y < 0 || s.x > (innerWidth || 800) || s.y > (innerHeight || 600);
      if (reached || edge || s.life <= 0) {
        openPortalAt(s.tx, s.ty, s.target);
        return false;
      }
      return true;
    });
    portals.forEach(function (p) {
      p.born += dt;
      if (p.r < 26) p.r += dt * 90;
      if (p.born > 0.5) p.ready = true;
      // Портал снова «живой», как только герой вышел из его кольца.
      // От мгновенного засасывания защищает не расстояние, а таймер lockUntil.
      var pp = portalPos(p);
      if (Math.hypot(hero.x - pp.x, hero.y - pp.y) > p.r + 45) p.canEnter = true;
    });
    // вход героя в готовый портал (нужно реально зайти в него, встав рядом)
    if (portalCooldownUntil && Date.now() < portalCooldownUntil) return;
    var now = Date.now();
    for (var i = 0; i < portals.length; i++) {
      var p = portals[i];
      if (!p.ready || !p.canEnter) continue;
      if (p.lockUntil && now < p.lockUntil) continue;
      var pos = portalPos(p);
      if (Math.hypot(hero.x - pos.x, hero.y - pos.y) < p.r + 12) {
        enterPortal(p);
        break;
      }
    }
  }

  function enterPortal(p) {
    if (p.target && p.target !== "map") {
      portals = [];
      goToGame(p.target);
      return;
    }
    // Карта: порталы ПОСТОЯННЫЕ — выходишь из парного и можешь ходить туда-обратно.
    var other =
      p.pair && portals.indexOf(p.pair) >= 0
        ? p.pair
        : portals.find(function (q) {
            return q !== p && q.target === "map";
          });
    if (!other) {
      toast("🌀 Нужен второй портал — выстрели ещё раз");
      return;
    }
    // В играх, где я играю ОДНИМ персонажем по центру (Terraverse и т.п.),
    // двигать надо самого игрока игры — иначе телепорт оверлея перезатрётся.
    var ref = null;
    try {
      ref = window.__AMAL_NATIVE_REF__;
    } catch (_) {}
    var centerLock =
      Object.prototype.hasOwnProperty.call(CENTER_LOCK_GAMES, gameId()) && !freeRoamHere;
    if (ref && centerLock && other.world) {
      ref.x = other.wx;
      ref.y = other.wy;
      if (ref.vx != null) ref.vx = 0;
      if (ref.vy != null) ref.vy = 0;
      other.canEnter = false;
      other.lockUntil = Date.now() + 650;
      p.canEnter = false;
      p.lockUntil = Date.now() + 650;
      portalCooldownUntil = Date.now() + 650;
      hero.mode = "teleport";
      portalFx("in");
      superHeal(true);
      toast("✨ Прыжок игрока сквозь портал · 💚");
      setTimeout(function () {
        hero.mode = "idle";
      }, 400);
      return;
    }
    var op = portalPos(other);
    var w = innerWidth || 800;
    var h = innerHeight || 600;
    // выходим далеко от кольца, выбирая сторону, где есть место на экране
    var gap = other.r + EXIT_DIST;
    var side = op.x + gap > w - 40 ? -1 : op.x - gap < 40 ? 1 : hero.facing || 1;
    hero.x = Math.max(24, Math.min(w - 24, op.x + gap * side));
    hero.y = op.y;
    // на узком экране бок мог обрезаться — тогда отходим по вертикали
    if (Math.abs(hero.x - op.x) < other.r + 70) {
      hero.y = op.y - 120 > 60 ? op.y - 120 : Math.min(h - 60, op.y + 120);
    }
    // короткая пауза, чтобы момент прибытия не засчитался как вход;
    // осознанный проход назад (ты сам идёшь в кольцо) сработает сразу после неё
    other.canEnter = false;
    other.lockUntil = Date.now() + 650;
    p.canEnter = false;
    p.lockUntil = Date.now() + 650;
    portalCooldownUntil = Date.now() + 650;
    hero.mode = "teleport";
    portalFx("in");
    dispatch("localTeleport", { x: hero.x, y: hero.y, screen: true });
    superHeal(true);
    toast("✨ Портал → портал · отойди и заходи снова · 💚");
    setTimeout(function () {
      hero.mode = "idle";
    }, 400);
  }

  function portalColors(p) {
    if (p.back) return { a: "#34d399", b: "#059669", glow: "#6ee7b7" };
    if (p.target === "map") {
      return p.slot === "b"
        ? { a: "#fdba74", b: "#ea580c", glow: "#fed7aa" }
        : { a: "#67e8f9", b: "#2563eb", glow: "#a5f3fc" };
    }
    return { a: "#fcd34d", b: "#a855f7", glow: "#fde68a" };
  }

  function drawPortals(ctx) {
    portalShots.forEach(function (s) {
      ctx.save();
      var c = portalColors({ target: s.target });
      // хвост-комета
      for (var i = 1; i <= 6; i++) {
        ctx.globalAlpha = 0.14 * (7 - i);
        ctx.fillStyle = c.a;
        ctx.beginPath();
        ctx.arc(s.x - (s.vx / 60) * i * 0.5, s.y - (s.vy / 60) * i * 0.5, 6 - i * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    portals.forEach(function (p) {
      var c = portalColors(p);
      var pos = portalPos(p);
      var rx = p.r;
      var ry = p.r * 1.35;
      var t = portalTime;
      var pulse = 1 + Math.sin(t * 3 + pos.x * 0.01) * 0.05;
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(pulse, pulse);

      // тёмная воронка внутри
      var grad = ctx.createRadialGradient(0, 0, 2, 0, 0, ry);
      grad.addColorStop(0, "rgba(8,6,20,.96)");
      grad.addColorStop(0.55, c.b);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // закрученные рукава вихря
      ctx.globalCompositeOperation = "lighter";
      for (var arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        ctx.strokeStyle = arm % 2 ? c.a : c.glow;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        for (var k = 0; k <= 26; k++) {
          var f = k / 26;
          var ang = t * 2.2 + arm * ((Math.PI * 2) / 3) + f * Math.PI * 2.1;
          var rr = f * rx;
          var px = Math.cos(ang) * rr;
          var py = Math.sin(ang) * rr * 1.35;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // светящееся кольцо
      ctx.strokeStyle = c.a;
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 22;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 6, ry + 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // искры по орбите
      for (var s2 = 0; s2 < 7; s2++) {
        var sa = t * 1.6 + (s2 * Math.PI * 2) / 7;
        var sr = rx + 10 + Math.sin(t * 4 + s2) * 4;
        ctx.fillStyle = s2 % 2 ? c.glow : "#fff";
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + s2));
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr * 1.2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // подпись-табличка
      if (p.ready) {
        var label = p.back
          ? "↩ " + titleOf(p.target)
          : p.target === "map"
          ? (p.slot === "b" ? "оранжевый" : "синий") + (p.canEnter ? "" : " · отойди")
          : titleOf(p.target);
        ctx.save();
        ctx.font = "900 11px system-ui";
        ctx.textAlign = "center";
        var w = ctx.measureText(label).width + 14;
        var ly = pos.y - ry - 16;
        ctx.fillStyle = "rgba(10,10,20,.8)";
        ctx.strokeStyle = c.a;
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(pos.x - w / 2, ly - 11, w, 18, 9);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(pos.x - w / 2, ly - 11, w, 18);
        }
        ctx.fillStyle = "#fff";
        ctx.fillText(label, pos.x, ly + 2);
        ctx.restore();
      }
    });
  }

  function onceLocalTeleport() {
    function onClick(e) {
      if (!hero.localAim) return;
      var t = e.target;
      if (t && t.closest && t.closest("#amal-world-dock,#amal-world-panel,#amal-world-tele")) {
        return;
      }
      hero.localAim = false;
      removeEventListener("pointerdown", onClick, true);
      hero.x = e.clientX;
      hero.y = e.clientY;
      hero.mode = "teleport";
      portalFx("in");
      dispatch("localTeleport", { x: e.clientX, y: e.clientY, screen: true });
      superHeal(true);
      toast("✨ Скачок! · 💚 супер-лечение");
      setTimeout(function () {
        hero.mode = "idle";
      }, 400);
    }
    addEventListener("pointerdown", onClick, true);
  }

  function flashBolts() {
    var layer = document.createElement("div");
    layer.id = "amal-world-fx";
    layer.style.cssText = "position:fixed;inset:0;z-index:2147483030;pointer-events:none;background:radial-gradient(circle at 50% 40%,rgba(180,240,255,.55),transparent 60%)";
    document.body.appendChild(layer);
    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 420);
  }

  function hexA(hex, a) {
    try {
      var h = String(hex).replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    } catch (_) {
      return "rgba(167,139,250," + a + ")";
    }
  }

  function drawCrown(ctx, fit, top, phase) {
    var kind = fit.crown;
    var gold = ctx.createLinearGradient(0, top - 12, 0, top + 6);
    gold.addColorStop(0, "#fff7ae");
    gold.addColorStop(0.5, "#facc15");
    gold.addColorStop(1, "#b45309");
    ctx.save();
    ctx.shadowColor = hexA(fit.aura, 0.9);
    ctx.shadowBlur = 12;

    if (kind === "horns") {
      ctx.fillStyle = "#e5e7eb";
      [-1, 1].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(s * 7, top + 5);
        ctx.quadraticCurveTo(s * 17, top - 2, s * 13, top - 14);
        ctx.quadraticCurveTo(s * 11, top - 3, s * 5, top + 5);
        ctx.fill();
      });
      ctx.restore();
      return;
    }

    if (kind === "flame") {
      for (var f = -1; f <= 1; f++) {
        var hgt = 13 + Math.sin(phase * 9 + f) * 4;
        var g = ctx.createLinearGradient(0, top + 4, 0, top - hgt);
        g.addColorStop(0, "#dc2626");
        g.addColorStop(0.5, "#f97316");
        g.addColorStop(1, "#fde68a");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(f * 7 - 4, top + 4);
        ctx.quadraticCurveTo(f * 7, top - hgt, f * 7 + 4, top + 4);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // общая золотая лента
    ctx.fillStyle = gold;
    roundRectPath(ctx, -12, top, 24, 6, 2);
    ctx.fill();

    if (kind === "diamond") {
      ctx.fillStyle = "#a5f3fc";
      [-8, 0, 8].forEach(function (px, i) {
        var h = i === 1 ? 14 : 10;
        ctx.beginPath();
        ctx.moveTo(px, top - h);
        ctx.lineTo(px + 4, top);
        ctx.lineTo(px, top + 2);
        ctx.lineTo(px - 4, top);
        ctx.closePath();
        ctx.fill();
      });
    } else if (kind === "spiked") {
      ctx.fillStyle = "#111827";
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.4;
      [-9, -3, 3, 9].forEach(function (px) {
        ctx.beginPath();
        ctx.moveTo(px - 3, top);
        ctx.lineTo(px, top - 13);
        ctx.lineTo(px + 3, top);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else if (kind === "star") {
      ctx.fillStyle = "#c7d2fe";
      for (var s2 = -1; s2 <= 1; s2++) {
        var cx = s2 * 8;
        var cy = top - 9;
        var rr = s2 === 0 ? 6 : 4.5;
        ctx.beginPath();
        for (var k = 0; k < 10; k++) {
          var ang = (Math.PI / 5) * k - Math.PI / 2;
          var rad = k % 2 ? rr * 0.45 : rr;
          var xx = cx + Math.cos(ang) * rad;
          var yy = cy + Math.sin(ang) * rad;
          if (k === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === "imperial") {
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(-11, top);
      ctx.quadraticCurveTo(0, top - 18, 11, top);
      ctx.lineTo(8, top);
      ctx.quadraticCurveTo(0, top - 12, -8, top);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, top - 16, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(0, top + 3, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // gold — классические зубцы
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(-12, top);
      ctx.lineTo(-8, top - 12);
      ctx.lineTo(-4, top - 3);
      ctx.lineTo(0, top - 15);
      ctx.lineTo(4, top - 3);
      ctx.lineTo(8, top - 12);
      ctx.lineTo(12, top);
      ctx.closePath();
      ctx.fill();
      ["#ef4444", "#22d3ee", "#a855f7"].forEach(function (col, i) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(-8 + i * 8, top + 3, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function drawHero(ctx, x, y, facing, phase, mode, alpha, tagName) {
    var fit = outfit();
    var royal = isRoyal();
    var shirtCol = royal ? fit.shirt : state.shirt;
    var pantsCol = royal ? fit.pants : state.pants;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, y);
    ctx.scale(facing * HERO_SCALE, HERO_SCALE);
    var bob = mode === "idle" ? Math.sin(phase) * 1.5 : Math.sin(phase * 2) * 2.5;
    var leg = mode === "walk" || mode === "run" ? Math.sin(phase * (mode === "run" ? 10 : 7)) * (mode === "run" ? 10 : 7) : 0;
    var arm = mode === "walk" || mode === "run" ? Math.sin(phase * (mode === "run" ? 10 : 7) + Math.PI) * (mode === "run" ? 9 : 6) : Math.sin(phase) * 2;
    if (mode === "fly") {
      bob = Math.sin(phase * 3) * 4 - 8;
      arm = -18 + Math.sin(phase * 4) * 4;
      leg = 4;
    }
    if (mode === "teleport") {
      ctx.globalAlpha *= 0.35 + Math.abs(Math.sin(phase * 8)) * 0.65;
      ctx.shadowColor = "#67e8f9";
      ctx.shadowBlur = 24;
    }
    if (state.shield || state.invincible) {
      ctx.strokeStyle = state.invincible ? "rgba(253,224,71,.7)" : "rgba(103,232,249,.65)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    var intense = mode === "fly" || mode === "run" || mode === "teleport" || hero.teleporting;
    if (intense) {
      for (var tr = 1; tr <= 4; tr++) {
        ctx.globalAlpha = (alpha == null ? 1 : alpha) * (0.16 - tr * 0.03);
        ctx.fillStyle = mode === "teleport" || hero.teleporting ? "#67e8f9" : "#a78bfa";
        ctx.beginPath();
        ctx.ellipse(tr * 2.2 * -hero.facing, -18 + bob + tr * 1.5, 12, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = alpha == null ? 1 : alpha;
    }
    var pulse = 1 + Math.sin(phase * 2.2) * (royal ? 0.1 : 0.05);
    var auraR = (intense ? 58 : royal ? 52 : 46) * pulse;
    var glow = ctx.createRadialGradient(0, -20 + bob, 4, 0, -20 + bob, auraR);
    if (intense) {
      glow.addColorStop(0, "rgba(103,232,249,.42)");
      glow.addColorStop(0.55, "rgba(103,232,249,.14)");
    } else {
      glow.addColorStop(0, hexA(fit.aura, royal ? 0.42 : 0.28));
      glow.addColorStop(0.55, hexA(fit.aura, royal ? 0.16 : 0.1));
    }
    glow.addColorStop(1, hexA(fit.aura, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -20 + bob, auraR, 0, Math.PI * 2);
    ctx.fill();
    if (royal) {
      // корона света: мягкое кольцо + орбитальные искры вокруг царственного скина
      ctx.save();
      ctx.globalAlpha = (alpha == null ? 1 : alpha) * 0.7;
      ctx.strokeStyle = hexA(fit.trim, 0.5);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -20 + bob, auraR * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      for (var sp = 0; sp < 6; sp++) {
        var sa = phase * 1.3 + (sp / 6) * Math.PI * 2;
        var sr = auraR * 0.9;
        ctx.fillStyle = sp % 2 ? fit.trim : fit.aura;
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * sr, -20 + bob + Math.sin(sa) * sr * 0.6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = alpha == null ? 1 : alpha;
    }

    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 15 - Math.abs(bob) * 0.4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    var capeSwing = Math.sin(phase * (mode === "run" ? 8 : 3)) * (mode === "fly" ? 12 : 5);
    var cape = ctx.createLinearGradient(0, -30, 0, 20);
    cape.addColorStop(0, fit.cape[0]);
    cape.addColorStop(1, fit.cape[1]);
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(-9, -26 + bob);
    ctx.quadraticCurveTo(-22 - capeSwing, -4 + bob, -13 - capeSwing, 20 + bob);
    ctx.lineTo(9 - capeSwing * 0.3, 18 + bob);
    ctx.quadraticCurveTo(12, -6 + bob, 9, -26 + bob);
    ctx.closePath();
    ctx.fill();
    if (royal) {
      // меховая оторочка мантии
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.beginPath();
      ctx.ellipse(-2, -25 + bob, 12, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = pantsCol;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5, 2 + bob);
    ctx.lineTo(-6, 15 + bob + leg);
    ctx.moveTo(5, 2 + bob);
    ctx.lineTo(6, 15 + bob - leg);
    ctx.stroke();
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-6, 16 + bob + leg);
    ctx.lineTo(-9, 18 + bob + leg);
    ctx.moveTo(6, 16 + bob - leg);
    ctx.lineTo(9, 18 + bob - leg);
    ctx.stroke();

    var torso = ctx.createLinearGradient(-11, -24 + bob, 11, 6 + bob);
    torso.addColorStop(0, lighten(shirtCol, 26));
    torso.addColorStop(1, shirtCol);
    ctx.fillStyle = torso;
    roundRectPath(ctx, -12, -23 + bob, 24, 27, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = hexA(fit.trim, 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, -12 + bob);
    ctx.lineTo(9, -2 + bob);
    ctx.stroke();
    ctx.fillStyle = fit.trim;
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("A", 0, -10 + bob);

    ctx.strokeStyle = state.skin;
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-11, -15 + bob);
    ctx.lineTo(-18, -4 + bob + arm);
    ctx.moveTo(11, -15 + bob);
    ctx.lineTo(18, -4 + bob - arm);
    ctx.stroke();
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(-18, -4 + bob + arm, 3.2, 0, Math.PI * 2);
    ctx.arc(18, -4 + bob - arm, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state.skin;
    ctx.beginPath();
    ctx.arc(0, -31 + bob, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.08)";
    ctx.beginPath();
    ctx.arc(3, -31 + bob, 11.5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    if (state.beard) {
      ctx.fillStyle = state.hair;
      ctx.beginPath();
      ctx.moveTo(-10, -31 + bob);
      ctx.quadraticCurveTo(0, -14 + bob, 10, -31 + bob);
      ctx.quadraticCurveTo(7, -25 + bob, 0, -23 + bob);
      ctx.quadraticCurveTo(-7, -25 + bob, -10, -31 + bob);
      ctx.fill();
    }

    ctx.fillStyle = state.hair;
    ctx.beginPath();
    ctx.ellipse(0, -37 + bob, 12.5, 8, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12, -36 + bob);
    ctx.quadraticCurveTo(-6, -44 + bob, 4, -41 + bob);
    ctx.quadraticCurveTo(11, -39 + bob, 12, -34 + bob);
    ctx.quadraticCurveTo(4, -39 + bob, -12, -36 + bob);
    ctx.fill();

    if (fit.crown) drawCrown(ctx, fit, -44 + bob, phase);

    var blink = Math.sin(phase * 0.7) > 0.985 ? 0.25 : 1;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-4, -32 + bob, 2.6, 2.6 * blink, 0, 0, Math.PI * 2);
    ctx.ellipse(4.5, -32 + bob, 2.6, 2.6 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(-3.4, -32 + bob, 1.3 * blink + 0.3, 0, Math.PI * 2);
    ctx.arc(5.2, -32 + bob, 1.3 * blink + 0.3, 0, Math.PI * 2);
    ctx.fill();
    var creepy = mode === "teleport" || hero.teleporting || state.creepy;
    if (creepy) {
      ctx.save();
      ctx.shadowColor = "rgba(239,68,68,.9)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-3.6, -32 + bob, 2.6, 0, Math.PI * 2);
      ctx.arc(5.4, -32 + bob, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(-7.5, -26.5 + bob);
      ctx.quadraticCurveTo(0.5, -15 + bob, 8.5, -26.5 + bob);
      ctx.quadraticCurveTo(0.5, -21 + bob, -7.5, -26.5 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      for (var ti = -6; ti <= 6; ti += 2.4) {
        ctx.beginPath();
        ctx.moveTo(ti, -26 + bob);
        ctx.lineTo(ti + 1.2, -26 + bob);
        ctx.lineTo(ti + 0.6, -22 + bob);
        ctx.closePath();
        ctx.fill();
      }
    } else if (!state.beard) {
      ctx.strokeStyle = "rgba(120,53,15,.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0.5, -27 + bob, 4.2, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.stroke();
    }

    ctx.save();
    ctx.scale(facing, 1);
    ctx.fillStyle = "rgba(15,23,42,.85)";
    ctx.strokeStyle = "rgba(167,139,250,.7)";
    ctx.lineWidth = 1.2;
    var label = tagName || state.name || "Амаль";
    ctx.font = "900 11px system-ui";
    var w = ctx.measureText(label).width + 14;
    roundRectPath(ctx, -w / 2, -56 + bob, w, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e9d5ff";
    ctx.textAlign = "center";
    ctx.fillText(label, 0, -45 + bob);
    ctx.restore();

    if (creepy) {
      for (var gi = 0; gi < 3; gi++) {
        var gy = -40 + bob + Math.random() * 56;
        var gx = (Math.random() - 0.5) * 10;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = gi % 2 ? "rgba(103,232,249,.6)" : "rgba(236,72,153,.6)";
        ctx.fillRect(-14 + gx, gy, 28, 2 + Math.random() * 2);
      }
      ctx.globalAlpha = alpha == null ? 1 : alpha;
    }
    ctx.restore();
  }

  function lighten(hex, amt) {
    try {
      var h = String(hex).replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      var r = Math.min(255, ((n >> 16) & 255) + amt);
      var g = Math.min(255, ((n >> 8) & 255) + amt);
      var b = Math.min(255, (n & 255) + amt);
      return "rgb(" + r + "," + g + "," + b + ")";
    } catch (_) {
      return hex;
    }
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function getScrollY() {
    try {
      return window.scrollY != null ? window.scrollY : document.documentElement.scrollTop || 0;
    } catch (_) {
      return 0;
    }
  }
  function getScrollX() {
    try {
      return window.scrollX != null ? window.scrollX : document.documentElement.scrollLeft || 0;
    } catch (_) {
      return 0;
    }
  }
  function scrollByAmt(dx, dy) {
    try {
      window.scrollBy(dx, dy);
    } catch (_) {
      try {
        document.documentElement.scrollTop += dy;
        document.documentElement.scrollLeft += dx;
      } catch (__) {}
    }
  }

  // Игры со своим персонажем, где камера держит игрока в ЦЕНТРЕ экрана.
  // Там сажаем Амаля в центр поверх встроенного игрока: ты играешь ЗА Амаля,
  // чужой человечек скрыт под ним. Значение = доля высоты экрана для ног.
  var CENTER_LOCK_GAMES = {
    terraverse: 0.5,
    minecraft: 0.5,
    "melon-playground": 0.5,
    obby: 0.5,
    "ladder-climb": 0.5,
    "speed-escape": 0.5,
    "flee-facility": 0.5,
    "murder-mystery": 0.5,
    "brookhaven-rp": 0.5,
    "adopt-me": 0.5,
    "steal-brainrot": 0.5,
    hideout: 0.5,
    "roof-house": 0.5,
    "nights-forest": 0.5,
    "night-stitch": 0.5,
    "ghost-lesson": 0.5,
    "blox-fruits": 0.5,
    "pet-simulator": 0.5,
    "grow-garden": 0.5,
  };
  var freeRoamHere = false; // кнопка 👤 переключает: свободный герой ↔ по центру

  function centerLockFactor() {
    if (freeRoamHere) return null;
    var id = gameId();
    return Object.prototype.hasOwnProperty.call(CENTER_LOCK_GAMES, id) ? CENTER_LOCK_GAMES[id] : null;
  }

  function updateHero(dt) {
    if (!state.visible) return;
    // В игре со своим персонажем (больница) оверлейный герой спрятан —
    // не двигаем его и не крутим страницу, управляет только игровой персонаж.
    if (gameId() === "animal-hospital" && hospitalActive()) {
      updatePortals(dt);
      if (state.energy < 100) setEnergy(state.energy + dt * 1.2);
      return;
    }
    // Играешь ЗА Амаля: он сидит в центре поверх встроенного игрока,
    // движение идёт клавишами игры (native ходит — камера центрирует — Амаль на месте).
    var lf = centerLockFactor();
    if (lf != null) {
      var vwC = innerWidth || 800;
      var vhC = innerHeight || 600;
      // Игра сообщает экранную позицию своего человечка — прячем его и встаём ровно на него.
      var np = null;
      try {
        np = window.__AMAL_NATIVE_PLAYER__;
        if (np && Date.now() - np.t > 900) np = null;
        window.__AMAL_HIDE_NATIVE__ = true;
      } catch (_) {}
      if (np) {
        hero.x = np.x;
        hero.y = np.y - 24;
      } else {
        hero.x = vwC / 2;
        hero.y = vhC * lf;
      }
      var movingC = hero.keys.a || hero.keys.arrowleft || hero.keys.d || hero.keys.arrowright;
      if (np && np.face) hero.facing = np.face < 0 ? -1 : 1;
      else if (hero.keys.a || hero.keys.arrowleft) hero.facing = -1;
      else if (hero.keys.d || hero.keys.arrowright) hero.facing = 1;
      hero.mode = hero.teleporting ? "teleport" : movingC ? "walk" : "idle";
      hero.phase += dt;
      updatePortals(dt);
      if (state.energy < 100) setEnergy(state.energy + dt * 1.2);
      return;
    }
    var speed = state.fly ? 380 : 240;
    if (hero.keys.shift) speed *= 1.8;
    var dx = 0;
    var dy = 0;
    if (hero.keys.a || hero.keys.arrowleft) dx -= 1;
    if (hero.keys.d || hero.keys.arrowright) dx += 1;
    if (hero.keys.w || hero.keys.arrowup) dy -= 1;
    if (hero.keys.s || hero.keys.arrowdown) dy += 1;
    if (dx || dy) {
      var len = Math.hypot(dx, dy) || 1;
      hero.vx = (dx / len) * speed;
      hero.vy = (dy / len) * speed;
      if (dx) hero.facing = dx < 0 ? -1 : 1;
      hero.mode = state.fly ? "fly" : hero.keys.shift ? "run" : "walk";
    } else {
      hero.vx *= 0.8;
      hero.vy *= 0.8;
      if (!hero.teleporting) hero.mode = state.fly ? "fly" : "idle";
    }
    hero.x += hero.vx * dt;
    hero.y += hero.vy * dt;
    // Камера: у края экрана страница прокручивается за героем (он ведёт «экран»).
    var vw = innerWidth || 800;
    var vh = innerHeight || 600;
    var mY = 70;
    if (hero.y < mY && hero.vy < 0) {
      var upBy = mY - hero.y;
      var beforeUp = getScrollY();
      scrollByAmt(0, -upBy);
      hero.y = getScrollY() === beforeUp ? Math.max(24, hero.y) : mY;
    } else if (hero.y > vh - mY && hero.vy > 0) {
      var downBy = hero.y - (vh - mY);
      var beforeDn = getScrollY();
      scrollByAmt(0, downBy);
      hero.y = getScrollY() === beforeDn ? Math.min(hero.y, vh - 24) : vh - mY;
    }
    var mX = 60;
    if (hero.x < mX && hero.vx < 0) {
      var leftBy = mX - hero.x;
      var beforeL = getScrollX();
      scrollByAmt(-leftBy, 0);
      hero.x = getScrollX() === beforeL ? Math.max(24, hero.x) : mX;
    } else if (hero.x > vw - mX && hero.vx > 0) {
      var rightBy = hero.x - (vw - mX);
      var beforeR = getScrollX();
      scrollByAmt(rightBy, 0);
      hero.x = getScrollX() === beforeR ? Math.min(hero.x, vw - 24) : vw - mX;
    }
    hero.x = Math.max(24, Math.min(vw - 24, hero.x));
    hero.y = Math.max(24, Math.min(vh - 24, hero.y));
    hero.phase += dt;
    clones = clones.filter(function (c) {
      c.life -= dt;
      c.phase += dt;
      if (c.mirror) {
        // зеркало держится рядом, отражая героя с мягкой задержкой
        var mx = hero.x - (hero.facing || 1) * 46;
        c.x += (mx - c.x) * Math.min(1, dt * 8);
        c.y += (hero.y - c.y) * Math.min(1, dt * 8);
      } else {
        c.x += Math.sin(c.phase * 3) * 20 * dt;
      }
      return c.life > 0;
    });
    if (!clones.length) state.clone = false;
    if (state.energy < 100) setEnergy(state.energy + dt * 1.2);
    updatePortals(dt);
  }

  function drawFrame() {
    if (!ui.canvas) return;
    var ctx = ui.canvas.getContext("2d");
    ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    drawVersionTag(ctx);
    drawLeaves(ctx);
    if (bossActive) drawBoss(ctx);
    drawGifts(ctx);
    if (!state.visible) return;
    // Прячем оверлейного Амаля только в больнице (там свой игровой Амаль).
    var hideHero = gameId() === "animal-hospital" && hospitalActive();
    if (hideHero) {
      ui.root.classList.remove("hospital-hide");
      drawPortals(ctx);
      return;
    }
    ui.root.classList.remove("hospital-hide");
    drawPortals(ctx);
    drawHero(ctx, hero.x, hero.y, hero.facing, hero.phase, hero.mode, 1);
  }

  function drawGifts(ctx) {
    if (!bossGifts.length) return;
    ctx.save();
    ctx.font = "22px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    bossGifts.forEach(function (g) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, g.life);
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      ctx.fillText(g.icon, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  function drawBoss(ctx) {
    var fit = outfit();
    var ph = boss.phase;
    var bob = Math.sin(ph * 1.4) * 6;
    ctx.save();
    ctx.translate(boss.x, boss.y + bob);
    var s = boss.scale;
    // огромная тёплая аура доброго босса
    var R = 150 * (s / 3.4);
    var gr = ctx.createRadialGradient(0, -70, 20, 0, -70, R);
    gr.addColorStop(0, hexA(fit.aura, 0.5));
    gr.addColorStop(0.5, hexA(fit.aura, 0.18));
    gr.addColorStop(1, hexA(fit.aura, 0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, -70, R, 0, Math.PI * 2);
    ctx.fill();
    // орбитальные искры-звёзды вокруг гиганта
    for (var i = 0; i < 10; i++) {
      var a = ph * 1.1 + (i / 10) * Math.PI * 2;
      var rr = 90 + Math.sin(ph * 2 + i) * 12;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = i % 2 ? fit.trim : fit.aura;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rr, -70 + Math.sin(a) * rr * 0.7, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // тень
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 54 * (s / 3.4), 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(s, s);
    // плащ-мантия
    var cape = ctx.createLinearGradient(0, -34, 0, 8);
    cape.addColorStop(0, fit.cape[0]);
    cape.addColorStop(1, fit.cape[1]);
    ctx.fillStyle = cape;
    var sw = Math.sin(ph * 1.6) * 4;
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.quadraticCurveTo(-26 - sw, -2, -16 - sw, 8);
    ctx.lineTo(16 - sw * 0.4, 8);
    ctx.quadraticCurveTo(16, -4, 12, -30);
    ctx.closePath();
    ctx.fill();
    // ноги
    ctx.strokeStyle = fit.pants;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-7, 10);
    ctx.moveTo(6, 0);
    ctx.lineTo(7, 10);
    ctx.stroke();
    // торс
    var torso = ctx.createLinearGradient(-14, -30, 14, 2);
    torso.addColorStop(0, lighten(fit.shirt, 26));
    torso.addColorStop(1, fit.shirt);
    ctx.fillStyle = torso;
    roundRectPath(ctx, -14, -30, 28, 32, 10);
    ctx.fill();
    ctx.fillStyle = hexA(fit.trim, 0.9);
    ctx.fillRect(-2.5, -30, 5, 32);
    // огромная раскрытая рука-«дарящая» (машет)
    ctx.strokeStyle = "#f2c9a0";
    ctx.lineWidth = 7;
    var wave = Math.sin(ph * 3) * 6;
    ctx.beginPath();
    ctx.moveTo(12, -22);
    ctx.lineTo(24, -30 - wave);
    ctx.moveTo(-12, -22);
    ctx.lineTo(-22, -16 + wave);
    ctx.stroke();
    // голова
    ctx.fillStyle = "#f6d3ad";
    ctx.beginPath();
    ctx.arc(0, -40, 9, 0, Math.PI * 2);
    ctx.fill();
    // добрые глаза + улыбка
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(-3.2, -41, 1.3, 0, Math.PI * 2);
    ctx.arc(3.2, -41, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -38, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // корона гиганта
    drawCrown(ctx, fit, -49, ph);
    ctx.restore();
    // подпись
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = fit.trim;
    ctx.shadowColor = hexA(fit.aura, 0.9);
    ctx.shadowBlur = 8;
    ctx.fillText("🦁 Добрый босс", boss.x, boss.y - 150 * (s / 3.4) + 40);
    ctx.restore();
  }

  function drawVersionTag(ctx) {
    try {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.font = "700 10px system-ui";
      ctx.textAlign = "right";
      ctx.fillStyle = "#a78bfa";
      ctx.fillText("Amal " + AW_VERSION, (ui.canvas.width || 800) - 8, 14);
      ctx.restore();
    } catch (_) {}
  }

  function hospitalActive() {
    try {
      return !!(global.__AMAL_HOSPITAL_HERO__ && global.__AMAL_HOSPITAL_HERO__.active);
    } catch (_) {
      return false;
    }
  }

  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    try {
      if (shouldRunWorld() && ui.root) {
        updateHero(dt);
        updateBoss(dt);
        updateLeaves(dt);
        drawFrame();
      } else if (ui.root) {
        ui.root.style.display = "none";
      }
    } catch (err) {
      try {
        if (!loop._warned) {
          console.warn("[amal-world] draw error (skipped):", err);
          loop._warned = true;
        }
      } catch (_) {}
    }
    requestAnimationFrame(loop);
  }

  function exposeHubApi() {
    try {
      if (!global.AmalHub) global.AmalHub = {};
      global.AmalHub.goToGame = goToGame;
      global.AmalHub.worldHero = api;
      if (!global.AmalHub.GRANTABLE_GAMES) {
        // filled lazily from closed hub scope if later assigned
      }
    } catch (_) {}
  }

  function tryCopyGrantable() {
    try {
      // GRANTABLE_GAMES is closed in hub IIFE; mirror via DOM game cards if needed
      if (global.AmalHub && global.AmalHub.GRANTABLE_GAMES) return;
      var cards = document.querySelectorAll("a.card[href]");
      if (!cards.length) return;
      var list = [];
      cards.forEach(function (a) {
        var href = a.getAttribute("href") || "";
        if (href.indexOf(".html") >= 0) return;
        var id = href.replace(/^\.\//, "").replace(/\/$/, "").split("/").filter(Boolean).pop();
        if (!id || id === "shared" || id === "apps") return;
        var name = (a.querySelector("h2") && a.querySelector("h2").textContent) || id;
        if (!list.some(function (g) {
          return g.id === id;
        })) list.push({ id: id, name: name.trim() });
      });
      if (list.length && global.AmalHub) global.AmalHub.GRANTABLE_GAMES = list;
    } catch (_) {}
  }

  var api = {
    goToGame: goToGame,
    usePower: usePower,
    getState: function () {
      return state;
    },
    getHero: function () {
      return hero;
    },
    drawCanvasHero: drawHero,
    isReady: function () {
      return !!ui.root;
    },
  };

  var booted = false;

  function boot() {
    if (booted) return;
    if (!shouldRunWorld()) return;
    booted = true;
    load();
    // Пушка никогда не «залипает» между входами — иначе она перехватывает все клики.
    state.portalGun = false;
    portalGunEquipped = false;
    portalGunArmed = false;
    // Разовая миграция: у старых сохранений creepy=false перекрывал новый умолчательный true.
    if (state.uiVer !== 2) {
      state.creepy = true;
      state.uiVer = 2;
      save();
    }
    try {
      window.__AMAL_WORLD_BEARD__ = !!state.beard;
      window.__AMAL_WORLD_CREEPY__ = !!state.creepy;
      window.__AMAL_HIDE_NATIVE__ =
        Object.prototype.hasOwnProperty.call(CENTER_LOCK_GAMES, gameId()) && !freeRoamHere;
    } catch (_) {}
    ensureUi();
    updateAmmoBtn();
    pendingPortalTarget = state.ammo || "map";
    exposeHubApi();
    tryCopyGrantable();
    handleArrival();
    // Память: восстанавливаем то, что владелец включал раньше.
    try {
      if (state.bossOn && !isCatalogPage()) {
        bossActive = true;
        bossSummonAt(true);
      } else {
        bossActive = false;
      }
      if (state.mirror) spawnMirror();
      if (state.beauty) applyBeauty();
    } catch (_) {}
    state.lastGame = gameId();
    save();
    toast("👤 Герой Амаль готов · 🌀 телепорт · ⚡ 20 сил");
  }

  // Повторяем попытку запуска: owner-режим может включиться чуть позже
  // (гонка загрузки owner-cheats / hub / owner-powers, ?owner в URL и т.п.).
  var bootTries = 0;
  var bootTimer = setInterval(function () {
    bootTries++;
    if (booted || bootTries > 40) {
      clearInterval(bootTimer);
      return;
    }
    boot();
    if (booted) clearInterval(bootTimer);
  }, 500);

  try {
    global.addEventListener("amal-owner-changed", function () {
      boot();
    });
    global.addEventListener("amal-powers-applied", function () {
      boot();
    });
  } catch (_) {}

  global.AmalWorld = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(boot, 120);
    });
  } else {
    setTimeout(boot, 120);
  }
  requestAnimationFrame(loop);
})(typeof window !== "undefined" ? window : globalThis);
