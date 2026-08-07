/**
 * Супер-силы хозяина Amal — одна панель во всех играх:
 * хил, бессмертие, ∞ монеты, ∞ урон, всё открыто, скорость.
 */
(function (global) {
  "use strict";

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const SECRET = "AmalOwner2026";
  const INF = 999999999;

  const flags = {
    god: true,
    healPulse: 0,
    speed: true,
    dmg: true,
    coins: true,
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
    toast._t = setTimeout(() => el.classList.remove("show"), 1600);
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
    const id = gameId();

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
    } else {
      jset("kick-buddy-v4", {
        coins: INF,
        owned: [],
        ownedWeapons: [],
        ownedBuddies: [],
        infCoins: true,
        infDmg: true,
        godMode: !!flags.god,
        vip: true,
        vipPlus: true,
        gotSite300k: true,
      });
    }

    const ca = jget("coin-arsenal-v1", {
      coins: 0,
      owned: ["pipe"],
      equipped: "pipe",
      bestWave: 0,
      bestKills: 0,
    });
    if (ca && typeof ca === "object") {
      ca.coins = INF;
      ca.owned = Array.from(
        new Set([...(ca.owned || []), "pipe", "pistol", "smg", "shotgun", "railgun", "doomsday"]),
      );
      ca.equipped = "doomsday";
      jset("coin-arsenal-v1", ca);
    }

    jset("bravol-coins", INF);
    jset("bravol-best", INF);
    jset("bravol-wins", INF);
    jset("stair-steps-v1-unlock", 99);
    jset("stair-steps-v1-best", INF);
    jset("space-courier-v2-unlock", 99);
    jset("space-courier-v2-best", INF);
    jset("mp-owner-god", true);
    jset("hideout-owner-god", true);
    jset("globe-owner-god", true);
    jset("zvp-owner-god", true);
    jset("minecraft-owner-god", true);

    global.dispatchEvent(new CustomEvent("amal-powers-applied", { detail: { game: id } }));
  }

  function doHeal() {
    if (!isOwner()) return;
    flags.healPulse = Date.now();
    global.__AMAL_HEAL__ = flags.healPulse;
    fire("heal");
    toast("💚 Хилл!");
  }

  function doGod(on) {
    if (!isOwner()) return;
    flags.god = on == null ? !flags.god : !!on;
    global.__AMAL_GOD__ = flags.god;
    applyBoosts();
    fire("god", { on: flags.god });
    toast(flags.god ? "🛡️ Бессмертие ВКЛ" : "🛡 Бессмертие выкл");
    syncUi();
  }

  function doCoins() {
    if (!isOwner()) return;
    flags.coins = true;
    applyBoosts();
    fire("coins");
    toast("💰 ∞ монеты");
  }

  function doDmg() {
    if (!isOwner()) return;
    flags.dmg = true;
    global.__AMAL_DMG__ = true;
    applyBoosts();
    fire("dmg");
    toast("💥 ∞ урон");
  }

  function doUnlock() {
    if (!isOwner()) return;
    applyBoosts();
    fire("unlock");
    toast("🔓 Всё открыто");
  }

  function doSpeed() {
    if (!isOwner()) return;
    flags.speed = true;
    global.__AMAL_SPEED__ = true;
    fire("speed");
    toast("⚡ Супер-скорость");
  }

  function doMax() {
    if (!isOwner()) return;
    flags.god = true;
    flags.speed = true;
    flags.dmg = true;
    flags.coins = true;
    global.__AMAL_GOD__ = true;
    global.__AMAL_DMG__ = true;
    global.__AMAL_SPEED__ = true;
    applyBoosts();
    doHeal();
    fire("max");
    fire("god", { on: true });
    fire("coins");
    fire("dmg");
    fire("unlock");
    fire("speed");
    toast("⚡ ВСЕ СИЛЫ НА МАКС");
    syncUi();
  }

  function syncUi() {
    const fab = document.getElementById("amal-powers-fab");
    if (fab) fab.textContent = flags.god ? "⚡ СИЛЫ ●" : "⚡ Силы";
    const godBtn = document.querySelector('[data-ap="god"]');
    if (godBtn) godBtn.textContent = flags.god ? "🛡️ Бессмертие ●" : "🛡️ Бессмертие";
  }

  function ensureUi() {
    if (!isOwner()) return;
    if (!document.getElementById("amal-powers-css")) {
      const css = document.createElement("style");
      css.id = "amal-powers-css";
      css.textContent = `
#amal-powers-fab{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:2147482990;border:0;border-radius:16px;padding:10px 12px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#111;font:800 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(245,158,11,.35)}
#amal-powers-panel{position:fixed;right:14px;bottom:calc(130px + env(safe-area-inset-bottom,0px));z-index:2147482990;width:min(94vw,320px);padding:12px;border-radius:18px;border:1px solid rgba(251,191,36,.45);background:rgba(12,10,6,.97);color:#fff7ed;font:700 12px/1.35 system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.5);display:none}
#amal-powers-panel.open{display:block}
#amal-powers-panel h3{margin:0 0 6px;font-size:14px}
#amal-powers-panel .sub{opacity:.75;font-size:11px;margin-bottom:8px}
#amal-powers-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#amal-powers-panel button{border:0;border-radius:12px;padding:11px 8px;background:rgba(255,255,255,.1);color:#fff;font:800 12px/1.2 system-ui,sans-serif;cursor:pointer}
#amal-powers-panel button.primary{background:linear-gradient(135deg,#34d399,#059669);color:#052e1c;grid-column:1/-1}
#amal-powers-panel button.max{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111;grid-column:1/-1}
#amal-powers-panel button.wide{grid-column:1/-1;background:rgba(255,255,255,.08)}
#amal-powers-toast{position:fixed;left:50%;top:18%;transform:translateX(-50%) translateY(-8px);z-index:2147483000;padding:10px 16px;border-radius:14px;background:rgba(0,0,0,.82);color:#fff;font:800 14px/1 system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}
#amal-powers-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#amal-powers-quick{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482985;display:flex;gap:8px;padding:8px;border-radius:18px;background:rgba(8,6,4,.78);backdrop-filter:blur(8px);box-shadow:0 10px 28px rgba(0,0,0,.35)}
#amal-powers-quick button{border:0;border-radius:14px;padding:10px 12px;font:800 13px/1 system-ui,sans-serif;cursor:pointer;color:#111}
#amal-powers-quick .heal{background:linear-gradient(135deg,#6ee7b7,#10b981)}
#amal-powers-quick .god{background:linear-gradient(135deg,#93c5fd,#3b82f6);color:#eff6ff}
#amal-powers-quick .max{background:linear-gradient(135deg,#fde68a,#f59e0b)}
`;
      document.head.appendChild(css);
    }
    if (gameId() === "portal") return;

    if (!document.getElementById("amal-powers-fab")) {
      const fab = document.createElement("button");
      fab.id = "amal-powers-fab";
      fab.type = "button";
      fab.textContent = "⚡ СИЛЫ ●";
      const panel = document.createElement("div");
      panel.id = "amal-powers-panel";
      panel.innerHTML = `
        <h3>⚡ Супер-силы хозяина</h3>
        <div class="sub">Игра: <b id="amal-powers-game">${gameId()}</b> · одни кнопки во всех играх</div>
        <div id="amal-powers-grid">
          <button type="button" class="primary" data-ap="heal">💚 Хилл</button>
          <button type="button" data-ap="god">🛡️ Бессмертие ●</button>
          <button type="button" data-ap="coins">💰 ∞ монеты</button>
          <button type="button" data-ap="dmg">💥 ∞ урон</button>
          <button type="button" data-ap="unlock">🔓 Всё открыто</button>
          <button type="button" data-ap="speed">⚡ Скорость</button>
          <button type="button" class="max" data-ap="max">⚡ Включить ВСЕ силы</button>
          <button type="button" class="wide" data-ap="reload">↻ Обновить игру с силами</button>
          <button type="button" class="wide" data-ap="live">📡 Живая карта</button>
          <button type="button" class="wide" data-ap="hub">👑 Меню хозяина</button>
        </div>
      `;
      document.body.appendChild(fab);
      document.body.appendChild(panel);
      fab.onclick = () => panel.classList.toggle("open");
      panel.querySelector('[data-ap="heal"]').onclick = () => doHeal();
      panel.querySelector('[data-ap="god"]').onclick = () => doGod();
      panel.querySelector('[data-ap="coins"]').onclick = () => doCoins();
      panel.querySelector('[data-ap="dmg"]').onclick = () => doDmg();
      panel.querySelector('[data-ap="unlock"]').onclick = () => doUnlock();
      panel.querySelector('[data-ap="speed"]').onclick = () => doSpeed();
      panel.querySelector('[data-ap="max"]').onclick = () => doMax();
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

    if (!document.getElementById("amal-powers-quick")) {
      const quick = document.createElement("div");
      quick.id = "amal-powers-quick";
      quick.innerHTML = `
        <button type="button" class="heal" data-aq="heal" title="Хилл">💚 Хилл</button>
        <button type="button" class="god" data-aq="god" title="Бессмертие">🛡️</button>
        <button type="button" class="max" data-aq="max" title="Все силы">⚡ Макс</button>
      `;
      document.body.appendChild(quick);
      quick.querySelector('[data-aq="heal"]').onclick = () => doHeal();
      quick.querySelector('[data-aq="god"]').onclick = () => doGod(true);
      quick.querySelector('[data-aq="max"]').onclick = () => doMax();
    }
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
    heal: doHeal,
    doGod,
    doCoins,
    doDmg,
    doUnlock,
    doSpeed,
    doMax,
    flags,
  };
  boot();
})(typeof window !== "undefined" ? window : globalThis);
