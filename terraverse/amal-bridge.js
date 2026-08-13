/**

 * Мост сил хозяина → Пиксель-Террариум (Creative / бессмертие / мирный режим).

 */

(function () {

  "use strict";



  function isGuestMode() {

    try {

      if (window.__AMAL_GUEST__ === true) return true;

      const g = new URLSearchParams(location.search).get("guest");

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

      const p = new URLSearchParams(location.search).get("peaceful");

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

    const api = window.__TERRARIUM__;

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

    const api = window.__TERRARIUM__;

    if (api && typeof api.disableCreative === "function") {

      try {

        api.disableCreative();

      } catch (_) {}

    }

  }



  function enforcePeaceful() {

    window.__AMAL_PEACEFUL__ = true;

    const api = window.__TERRARIUM__;

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

    let n = 0;

    const tick = setInterval(() => {

      n++;

      enforceGuest();

      if (n > 40) clearInterval(tick);

    }, 400);

  } else if (isOwner()) {

    ensureHost();

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



  if (isPeacefulMode()) {

    let n = 0;

    const tick = setInterval(() => {

      n++;

      enforcePeaceful();

      if (n > 50) clearInterval(tick);

    }, 400);

  }



  window.addEventListener("amal-power", (e) => {

    if (isGuestMode()) return;

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

    if (isGuestMode()) {

      enforceGuest();

      return;

    }

    if (isOwner()) enableImmortal();

  });

})();

