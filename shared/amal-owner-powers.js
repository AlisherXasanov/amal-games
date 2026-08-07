/**
 * Единые силы хозяина Amal во ВСЕХ играх + синхронизация ключей владельца.
 */
(function (global) {
  "use strict";

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const SECRET = "AmalOwner2026";
  const INF = 999999999;

  const GAME_BOOSTS = {
    blockbust: [
      ["bb-web-coins", INF],
      ["bb-web-best", INF],
    ],
    "kick-buddy": [
      ["kick-buddy-coins", INF],
      ["kb-coins", INF],
    ],
    "space-courier": [
      ["space-courier-best", INF],
      ["sc-best", INF],
    ],
    "coin-arsenal": [
      ["coin-arsenal-coins", INF],
      ["ca-coins", INF],
    ],
    "x-buggy": [["x-buggy-best", INF]],
    "ladder-climb": [["ladder-climb-best", INF]],
    "snake-game": [["snake-best", INF]],
    hideout: [["hideout-best", INF]],
    "zombie-vs-plants": [["zvp-sun", INF]],
    "bravol-stars": [["bs-coins", INF]],
    minecraft: [["mc-creative", true]],
    terraverse: [["terra-creative", true]],
    "melon-playground": [["melon-unlock", true]],
    "globe-battle": [["globe-best", INF]],
  };

  function gameId() {
    try {
      if (global.AmalHub && typeof AmalHub.gameId === "function") return AmalHub.gameId();
    } catch (_) {
      /* ignore */
    }
    const parts = location.pathname.replace(/\\/g, "/").split("/").filter(Boolean);
    const cleaned = parts.filter((p) => !/\.(html?|js|css)$/i.test(p));
    const idx = cleaned.indexOf("amal-games");
    if (idx >= 0) return cleaned[idx + 1] || "portal";
    return cleaned[cleaned.length - 1] || "portal";
  }

  function isOwner() {
    if (global.__AMAL_OWNER__ === true) return true;
    try {
      if (global.AmalOwner && AmalOwner.isOwner()) return true;
    } catch (_) {
      /* ignore */
    }
    try {
      const params = new URLSearchParams(location.search);
      const code = params.get("owner");
      if (code === SECRET || code === "amal" || code === "1234") {
        unlockAll();
        return true;
      }
    } catch (_) {
      /* ignore */
    }
    try {
      return OWNER_KEYS.some((k) => localStorage.getItem(k) === "1");
    } catch (_) {
      return false;
    }
  }

  function unlockAll() {
    global.__AMAL_OWNER__ = true;
    try {
      OWNER_KEYS.forEach((k) => localStorage.setItem(k, "1"));
    } catch (_) {
      /* ignore */
    }
    try {
      if (global.AmalOwner && typeof AmalOwner.unlock === "function") {
        // don't fail if secrets differ
        AmalOwner.unlock(SECRET);
        AmalOwner.unlock("amal");
      }
    } catch (_) {
      /* ignore */
    }
    applyBoosts();
    global.dispatchEvent(new CustomEvent("amal-owner-changed", { detail: true }));
  }

  function storeSet(k, v) {
    try {
      localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    } catch (_) {
      /* ignore */
    }
  }

  function applyBoosts() {
    if (!isOwner()) return;
    const id = gameId();
    const list = GAME_BOOSTS[id] || [];
    list.forEach(([k, v]) => storeSet(k, v));
  }

  function ensureUi() {
    if (!isOwner()) return;
    if (document.getElementById("amal-powers-css")) return;
    const css = document.createElement("style");
    css.id = "amal-powers-css";
    css.textContent = `
#amal-powers-fab{position:fixed;right:14px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:2147482990;border:0;border-radius:16px;padding:10px 12px;background:linear-gradient(135deg,#fbbf24,#d97706);color:#111;font:800 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(245,158,11,.35)}
#amal-powers-panel{position:fixed;right:14px;bottom:calc(130px + env(safe-area-inset-bottom,0px));z-index:2147482990;width:min(92vw,280px);padding:12px;border-radius:18px;border:1px solid rgba(251,191,36,.4);background:rgba(12,10,6,.94);color:#fff7ed;font:700 12px/1.35 system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.45);display:none}
#amal-powers-panel.open{display:block}
#amal-powers-panel h3{margin:0 0 8px;font-size:14px}
#amal-powers-panel button{width:100%;margin-top:6px;border:0;border-radius:12px;padding:10px;background:rgba(255,255,255,.1);color:#fff;font-weight:800;cursor:pointer}
#amal-powers-panel button.primary{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111}
`;
    document.head.appendChild(css);

    if (gameId() === "portal") return;
    if (document.getElementById("amal-powers-fab")) return;

    const fab = document.createElement("button");
    fab.id = "amal-powers-fab";
    fab.type = "button";
    fab.textContent = "⚡ Силы";
    const panel = document.createElement("div");
    panel.id = "amal-powers-panel";
    panel.innerHTML = `
      <h3>⚡ Силы хозяина</h3>
      <div style="opacity:.75;margin-bottom:6px">Игра: ${gameId()}</div>
      <button type="button" class="primary" data-ap="boost">Включить ∞ бонусы</button>
      <button type="button" data-ap="live">Живая карта игроков</button>
      <button type="button" data-ap="hub">Меню хозяина</button>
    `;
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    fab.onclick = () => panel.classList.toggle("open");
    panel.querySelector('[data-ap="boost"]').onclick = () => {
      applyBoosts();
      fab.textContent = "⚡ ∞ ON";
      panel.classList.remove("open");
    };
    panel.querySelector('[data-ap="live"]').onclick = () => {
      location.href = "../?owner=" + encodeURIComponent(SECRET) + "&live=1";
    };
    panel.querySelector('[data-ap="hub"]').onclick = () => {
      try {
        if (global.AmalHub) AmalHub.open("admin");
      } catch (_) {
        /* ignore */
      }
      panel.classList.remove("open");
    };
  }

  function boot() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("owner")) unlockAll();
    } catch (_) {
      /* ignore */
    }
    if (isOwner()) {
      applyBoosts();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureUi);
      } else {
        ensureUi();
      }
    }
    global.addEventListener("amal-owner-changed", (e) => {
      if (e.detail) {
        unlockAll();
        ensureUi();
      }
    });
  }

  global.AmalPowers = { isOwner, unlockAll, applyBoosts, gameId };
  boot();
})(typeof window !== "undefined" ? window : globalThis);
