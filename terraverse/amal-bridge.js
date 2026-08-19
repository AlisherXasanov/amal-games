/**
 * Мост сил хозяина → Пиксель-Террариум (Creative / бессмертие / мирный режим).
 * Плюс: убирает чужие оверлеи, чтобы клики доходили до холста.
 */
(function () {
  "use strict";

  var OVERLAY_IDS = [
    "amal-world-root",
    "amal-world-showpill",
    "amal-world-dock",
    "amal-powers-quick",
    "amal-powers-fab",
    "amal-powers-panel",
    "amal-us-eggs",
    "amal-us-toast",
    "amal-cube-btn",
    "amal-cube-dash",
    "amal-cube-pickup",
    "amal-chat-fab",
    "amal-chat-box",
    "amal-faq-fab",
    "amal-good-boss",
    "amal-hub-root",
    "amal-watch-panel"
  ];

  function wipeOverlays() {
    for (var i = 0; i < OVERLAY_IDS.length; i++) {
      var n = document.getElementById(OVERLAY_IDS[i]);
      if (n && n.parentNode) n.parentNode.removeChild(n);
    }
  }

  wipeOverlays();
  setInterval(wipeOverlays, 400);

  function isGuestMode() {
    try {
      if (window.__AMAL_GUEST__ === true) return true;
      var g = new URLSearchParams(location.search).get("guest");
      if (g === "1" || g === "true" || g === "yes") {
        window.__AMAL_GUEST__ = true;
        window.__AMAL_OWNER__ = false;
        window.__AMAL_GOD__ = false;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function isPeacefulMode() {
    try {
      if (window.__AMAL_PEACEFUL__ === true) return true;
      var p = new URLSearchParams(location.search).get("peaceful");
      if (p === "1" || p === "true" || p === "yes") {
        window.__AMAL_PEACEFUL__ = true;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function isOwner() {
    if (isGuestMode()) return false;
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

  function clearHostFlag() {
    try {
      localStorage.removeItem("pixel-terrarium-host-v1");
    } catch (_) {}
  }

  function enableImmortal() {
    if (isGuestMode()) return;
    window.__AMAL_GOD__ = true;
    window.__AMAL_OWNER__ = true;
    ensureHost();
    var api = window.__TERRARIUM__;
    if (api && typeof api.enableCreative === "function") {
      try {
        api.enableCreative();
      } catch (_) {}
    }
  }

  function enforceGuest() {
    window.__AMAL_GUEST__ = true;
    window.__AMAL_OWNER__ = false;
    window.__AMAL_GOD__ = false;
    clearHostFlag();
    var api = window.__TERRARIUM__;
    if (api && typeof api.disableCreative === "function") {
      try {
        api.disableCreative();
      } catch (_) {}
    }
  }

  function enforcePeaceful() {
    window.__AMAL_PEACEFUL__ = true;
    var api = window.__TERRARIUM__;
    if (api && typeof api.enablePeaceful === "function") {
      try {
        api.enablePeaceful();
      } catch (_) {}
    } else if (api && typeof api.clearHostiles === "function") {
      try {
        api.clearHostiles();
      } catch (_) {}
    }
  }

  if (isGuestMode()) {
    enforceGuest();
    var nGuest = 0;
    var tickGuest = setInterval(function () {
      nGuest++;
      enforceGuest();
      if (nGuest > 40) clearInterval(tickGuest);
    }, 400);
  } else if (isOwner()) {
    ensureHost();
    enableImmortal();
    var nOwn = 0;
    var tickOwn = setInterval(function () {
      nOwn++;
      if (window.__TERRARIUM__ && window.__AMAL_GOD__ !== false) {
        enableImmortal();
        if (nOwn > 8) clearInterval(tickOwn);
      }
      if (nOwn > 40) clearInterval(tickOwn);
    }, 400);
  }

  if (!isGuestMode() && isOwner()) {
    var kickCreative = function () {
      enableImmortal();
      try {
        if (window.__TERRARIUM__ && typeof window.__TERRARIUM__.enableCreative === "function") {
          window.__TERRARIUM__.enableCreative();
        }
      } catch (_) {}
    };
    document.addEventListener("pointerdown", kickCreative, { capture: true, once: true });
    setTimeout(kickCreative, 800);
  }

  if (isPeacefulMode()) {
    var nP = 0;
    var tickP = setInterval(function () {
      nP++;
      enforcePeaceful();
      if (nP > 50) clearInterval(tickP);
    }, 400);
  }

  window.addEventListener("amal-power", function (e) {
    if (isGuestMode()) return;
    var t = e.detail && e.detail.type;
    var on = e.detail && e.detail.on;
    if (t === "god" && on === false) {
      window.__AMAL_GOD__ = false;
      var api = window.__TERRARIUM__;
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

  window.addEventListener("amal-owner-changed", function () {
    if (isGuestMode()) {
      enforceGuest();
      return;
    }
    if (isOwner()) enableImmortal();
  });
})();
