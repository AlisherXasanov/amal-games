/**
 * Мост сил хозяина → Snake Game (бессмертие / щиты / сердца).
 */
(function () {
  "use strict";

  function isOwner() {
    try {
      if (window.__AMAL_OWNER__ || window.__AMAL_GOD__) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      if (new URLSearchParams(location.search).get("owner")) return true;
      if (window.AmalPowers && AmalPowers.isOwner && AmalPowers.isOwner()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
    } catch (_) {}
    return false;
  }

  function applyGod() {
    window.__AMAL_GOD__ = true;
    window.__AMAL_OWNER__ = true;
    const api = window.__SNAKE_AMAL__;
    if (api && typeof api.godUp === "function") {
      try {
        api.godUp();
      } catch (_) {}
    }
  }

  function pulse() {
    if (!isOwner() && !window.__AMAL_GOD__) return;
    applyGod();
  }

  if (isOwner()) {
    window.__AMAL_GOD__ = true;
    let n = 0;
    const id = setInterval(() => {
      n++;
      pulse();
      if (n > 60) clearInterval(id);
    }, 500);
  }

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (t === "god" || t === "heal" || t === "max" || t === "snake-god") {
      applyGod();
    }
    if (t === "set-score" || (t === "set-amount" && e.detail && e.detail.kind === "score")) {
      const amount = Number(e.detail.amount);
      const api = window.__SNAKE_AMAL__;
      if (api && api.get && Number.isFinite(amount)) {
        try {
          // score lives in React ref; best-effort via localStorage used by game if any
          localStorage.setItem("snake-best", JSON.stringify(amount));
        } catch (_) {}
      }
    }
  });

  window.addEventListener("amal-owner-changed", () => {
    if (isOwner()) applyGod();
  });
})();
