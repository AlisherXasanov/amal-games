/**
 * Хозяин/админ для черновых 3D-игр: бессмертие + полёт.
 * После AmalWalkPlayer.create: AmalDraftOwner.attachPlayer(player); AmalDraftOwner.badge();
 * Перед смертью проверяй AmalDraftOwner.canDie() — если false, только отброс, без гибели.
 */
(function (global) {
  "use strict";

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const SECRET = "AmalOwner2026";
  let attached = null;

  function isGuestMode() {
    try {
      if (global.__AMAL_GUEST__ === true) return true;
      const g = new URLSearchParams(location.search).get("guest");
      if (g === "1" || g === "true" || g === "yes") {
        global.__AMAL_GUEST__ = true;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function isOwner() {
    if (isGuestMode()) return false;
    if (global.__AMAL_OWNER__ === true || global.__AMAL_GOD__ === true || global.__AMAL_LEGEND__ === true) {
      return true;
    }
    try {
      if (global.AmalPowers && typeof AmalPowers.isOwner === "function" && AmalPowers.isOwner()) return true;
    } catch (_) {}
    try {
      if (global.AmalHub && typeof AmalHub.isOwner === "function" && AmalHub.isOwner()) return true;
    } catch (_) {}
    try {
      if (global.AmalOwner && typeof AmalOwner.isOwner === "function" && AmalOwner.isOwner()) return true;
    } catch (_) {}
    try {
      const code = new URLSearchParams(location.search).get("owner");
      if (code === SECRET || code === "amal" || code === "1234" || code === "buddy") {
        global.__AMAL_OWNER__ = true;
        global.__AMAL_GOD__ = true;
        try {
          OWNER_KEYS.forEach((k) => localStorage.setItem(k, "1"));
        } catch (_) {}
        return true;
      }
    } catch (_) {}
    try {
      return OWNER_KEYS.some((k) => localStorage.getItem(k) === "1");
    } catch (_) {
      return false;
    }
  }

  function canDie() {
    return !isOwner();
  }

  function applyFlight(player) {
    if (!player || !isOwner()) return;
    try {
      if (typeof player.setFly === "function") player.setFly(true);
      else if (player.state) player.state.fly = true;
    } catch (_) {}
    try {
      if (typeof player.setGod === "function") player.setGod(true);
      else if (player.state) player.state.god = true;
    } catch (_) {}
    if (player.state) {
      player.state.speed = Math.max(player.state.speed || 8, 12);
    }
  }

  function attachPlayer(player) {
    attached = player || null;
    if (!attached) return;
    if (isOwner()) {
      global.__AMAL_OWNER__ = true;
      global.__AMAL_GOD__ = true;
      applyFlight(attached);
    }
    global.addEventListener("amal-owner-changed", () => {
      if (isOwner() && attached) applyFlight(attached);
    });
  }

  function badge() {
    if (!isOwner()) return;
    let el = document.getElementById("amal-draft-owner-badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-draft-owner-badge";
      el.textContent = "👑 хозяин · полёт · без смерти";
      el.style.cssText =
        "position:fixed;top:44px;right:12px;z-index:50;padding:6px 10px;border-radius:8px;" +
        "background:rgba(120,53,15,.88);border:1px solid rgba(251,191,36,.55);color:#fde68a;" +
        "font:800 11px/1.2 system-ui,sans-serif;pointer-events:none;";
      document.body.appendChild(el);
    }
    el.style.display = "block";
  }

  global.AmalDraftOwner = {
    isOwner: isOwner,
    canDie: canDie,
    attachPlayer: attachPlayer,
    badge: badge,
    applyFlight: applyFlight,
  };
})(typeof window !== "undefined" ? window : globalThis);
