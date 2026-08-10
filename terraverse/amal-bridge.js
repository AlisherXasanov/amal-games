/**
 * Мост сил хозяина → Пиксель-Террариум (Creative / бессмертие).
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

  function ensureHost() {
    try {
      localStorage.setItem("pixel-terrarium-host-v1", "1");
    } catch (_) {}
  }

  function enableImmortal() {
    window.__AMAL_GOD__ = true;
    window.__AMAL_OWNER__ = true;
    ensureHost();
    const api = window.__TERRARIUM__;
    if (api && typeof api.enableCreative === "function") {
      try {
        api.enableCreative();
      } catch (_) {}
    }
  }

  if (isOwner()) {
    ensureHost();
    // Небольшой повтор — React-игра монтируется чуть позже
    let n = 0;
    const tick = setInterval(() => {
      n++;
      if (window.__TERRARIUM__ && window.__AMAL_GOD__ !== false) {
        enableImmortal();
        if (n > 8) clearInterval(tick);
      }
      if (n > 40) clearInterval(tick);
    }, 400);
  }

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    const on = e.detail && e.detail.on;
    if (t === "god" && on === false) {
      window.__AMAL_GOD__ = false;
      const api = window.__TERRARIUM__;
      if (api && typeof api.disableCreative === "function") {
        try {
          api.disableCreative();
        } catch (_) {}
      }
      return;
    }
    if (t === "god" || t === "heal" || t === "max" || t === "tv-creative" || t === "abuse-gift") {
      enableImmortal();
    }
  });

  window.addEventListener("amal-owner-changed", () => {
    if (isOwner()) enableImmortal();
  });
})();
