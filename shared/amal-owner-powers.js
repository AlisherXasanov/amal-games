/**
 * Сильные силы хозяина Amal — во всех играх.
 * Ставит правильные ключи сохранения и флаг window.__AMAL_GOD__.
 */
(function (global) {
  "use strict";

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const SECRET = "AmalOwner2026";
  const INF = 999999999;

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

  function unlockAll() {
    global.__AMAL_OWNER__ = true;
    global.__AMAL_GOD__ = true;
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
    global.__AMAL_GOD__ = true;
    const id = gameId();

    // Blockbust
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

    // Kick Buddy blob
    const kb = jget("kick-buddy-v4", null);
    if (kb && typeof kb === "object") {
      kb.infCoins = true;
      kb.infDmg = true;
      kb.godMode = true;
      kb.coins = INF;
      kb.vip = true;
      kb.vipPlus = true;
      jset("kick-buddy-v4", kb);
    } else {
      jset("kick-buddy-v4", {
        coins: INF,
        owned: [],
        ownedWeapons: [],
        ownedBuddies: [],
        infCoins: true,
        infDmg: true,
        godMode: true,
        vip: true,
        vipPlus: true,
        gotSite300k: true,
      });
    }

    // Coin Arsenal (реальные id из game.js)
    const ca = jget("coin-arsenal-v1", { coins: 0, owned: ["pipe"], equipped: "pipe", bestWave: 0, bestKills: 0 });
    if (ca && typeof ca === "object") {
      ca.coins = INF;
      const all = ["pipe", "pistol", "smg", "shotgun", "railgun", "doomsday"];
      ca.owned = Array.from(new Set([...(ca.owned || []), ...all]));
      ca.equipped = "doomsday";
      jset("coin-arsenal-v1", ca);
    }

    // Bravol
    jset("bravol-coins", INF);
    jset("bravol-best", INF);
    jset("bravol-wins", INF);

    // Ladder
    jset("stair-steps-v1-unlock", 99);
    jset("stair-steps-v1-best", INF);

    // X-Buggy / Space
    jset("x-buggy-v1-best", jget("x-buggy-v1-best", {}) || {});
    jset("space-courier-v2-unlock", 99);
    jset("space-courier-v2-best", INF);

    // Melon skins flag
    jset("mp-owner-god", true);

    // Hideout / globe / zvp flags
    jset("hideout-owner-god", true);
    jset("globe-owner-god", true);
    jset("zvp-owner-god", true);
    jset("minecraft-owner-god", true);

    global.dispatchEvent(new CustomEvent("amal-powers-applied", { detail: { game: id } }));
  }

  function ensureUi() {
    if (!isOwner()) return;
    if (document.getElementById("amal-powers-css")) {
      // refresh panel labels
    } else {
      const css = document.createElement("style");
      css.id = "amal-powers-css";
      css.textContent = `
#amal-powers-fab{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:2147482990;border:0;border-radius:16px;padding:10px 12px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#111;font:800 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(245,158,11,.35)}
#amal-powers-panel{position:fixed;right:14px;bottom:calc(130px + env(safe-area-inset-bottom,0px));z-index:2147482990;width:min(92vw,300px);padding:12px;border-radius:18px;border:1px solid rgba(251,191,36,.4);background:rgba(12,10,6,.96);color:#fff7ed;font:700 12px/1.35 system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.45);display:none}
#amal-powers-panel.open{display:block}
#amal-powers-panel h3{margin:0 0 8px;font-size:14px}
#amal-powers-panel button{width:100%;margin-top:6px;border:0;border-radius:12px;padding:10px;background:rgba(255,255,255,.1);color:#fff;font-weight:800;cursor:pointer}
#amal-powers-panel button.primary{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111}
#amal-powers-panel .ok{color:#86efac;margin-top:8px}
`;
      document.head.appendChild(css);
    }
    if (gameId() === "portal") return;
    if (document.getElementById("amal-powers-fab")) return;

    const fab = document.createElement("button");
    fab.id = "amal-powers-fab";
    fab.type = "button";
    fab.textContent = "⚡ Супер-силы";
    const panel = document.createElement("div");
    panel.id = "amal-powers-panel";
    panel.innerHTML = `
      <h3>⚡ Супер-силы хозяина</h3>
      <div style="opacity:.8;margin-bottom:6px">Игра: <b>${gameId()}</b></div>
      <div style="opacity:.75;font-size:11px;margin-bottom:8px">∞ монеты · бессмертие · всё открыто (где есть в игре)</div>
      <button type="button" class="primary" data-ap="boost">Включить максимум сил</button>
      <button type="button" data-ap="reload">Применить и обновить игру</button>
      <button type="button" data-ap="live">📡 Живая карта игроков</button>
      <button type="button" data-ap="hub">👑 Меню хозяина</button>
      <div class="ok" id="amal-powers-msg"></div>
    `;
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    const msg = () => panel.querySelector("#amal-powers-msg");
    fab.onclick = () => panel.classList.toggle("open");
    panel.querySelector('[data-ap="boost"]').onclick = () => {
      applyBoosts();
      fab.textContent = "⚡ МАКС";
      if (msg()) msg().textContent = "Силы включены. Если мало — нажми «Обновить».";
    };
    panel.querySelector('[data-ap="reload"]').onclick = () => {
      applyBoosts();
      location.reload();
    };
    panel.querySelector('[data-ap="live"]').onclick = () => {
      location.href = "../?owner=" + encodeURIComponent(SECRET) + "&live=1";
    };
    panel.querySelector('[data-ap="hub"]').onclick = () => {
      try {
        if (global.AmalHub) AmalHub.open("admin");
      } catch (_) {}
      panel.classList.remove("open");
    };
  }

  function boot() {
    try {
      if (new URLSearchParams(location.search).get("owner")) unlockAll();
    } catch (_) {}
    if (isOwner()) {
      global.__AMAL_GOD__ = true;
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
    god: () => !!(global.__AMAL_GOD__ || isOwner()),
  };
  boot();
})(typeof window !== "undefined" ? window : globalThis);
