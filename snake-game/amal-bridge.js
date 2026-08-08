/**
 * Мост сил хозяина → Snake Game (бессмертие).
 * Игра читает window.__AMAL_GOD__ / __AMAL_OWNER__ в коллизиях.
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
  }

  if (isOwner()) applyGod();

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (t === "god" || t === "heal" || t === "max" || t === "snake-god") applyGod();
  });

  window.addEventListener("amal-owner-changed", () => {
    if (isOwner()) applyGod();
  });
})();
