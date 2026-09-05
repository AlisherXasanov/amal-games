/**
 * Помнит, что зашёл Амаль — localStorage + sessionStorage + cookie.
 * На ЭТОМ компьютере (Chrome) админ восстанавливается сам, без QR.
 */
(function (global) {
  "use strict";

  var SESSION_KEY = "amal-owner-session-v1";
  var COOKIE_KEY = "amal_owner";
  var HOME_PC_KEY = "amal-home-pc-v1";
  var OWNER_CODES = ["amal", "1234", "buddy", "amalowner2026"];
  var LS_KEYS = ["amal-owner-v3", "amal-owner-v1", "amal-owner-v2", HOME_PC_KEY];
  var HINT_KEYS = [
    "animal-hospital-owner-god",
    "mp-owner-god",
    "hideout-owner-god",
    "globe-owner-god",
    "zvp-owner-god",
    "minecraft-owner-god",
  ];

  function query() {
    try { return new URLSearchParams(global.location.search); } catch (_) { return new URLSearchParams(); }
  }

  function ownerFromUrl() {
    var c = (query().get("owner") || "").trim().toLowerCase();
    return OWNER_CODES.indexOf(c) >= 0;
  }

  function cookieGet() {
    try {
      var parts = (document.cookie || "").split(";");
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.indexOf(COOKIE_KEY + "=") === 0) return p.slice(COOKIE_KEY.length + 1);
      }
    } catch (_) {}
    return "";
  }

  function cookieSet() {
    try {
      document.cookie = COOKIE_KEY + "=1; path=/; max-age=31536000; SameSite=Lax";
    } catch (_) {}
  }

  function lsGet(k) {
    try { return global.localStorage.getItem(k); } catch (_) { return null; }
  }

  function lsSet(k, v) {
    try { global.localStorage.setItem(k, v); } catch (_) {}
  }

  function thisPcLooksLikeOwner() {
    if (lsGet(HOME_PC_KEY) === "1") return true;
    for (var i = 0; i < LS_KEYS.length; i++) {
      if (lsGet(LS_KEYS[i]) === "1") return true;
    }
    if (cookieGet() === "1") return true;
    for (var j = 0; j < HINT_KEYS.length; j++) {
      var h = lsGet(HINT_KEYS[j]);
      if (h === "1" || h === "true") return true;
    }
    try {
      if (global.sessionStorage.getItem(SESSION_KEY) === "1") return true;
    } catch (_) {}
    return false;
  }

  function markOwner() {
    global.__AMAL_OWNER__ = true;
    global.__SCHOOL_PARTY_OK__ = true;
    try { global.sessionStorage.setItem(SESSION_KEY, "1"); } catch (_) {}
    lsSet("amal-owner-v3", "1");
    lsSet("amal-owner-v1", "1");
    lsSet(HOME_PC_KEY, "1");
    lsSet("amal-friends-access-v1", "1");
    lsSet("amal-friends-owner-v1", "1");
    cookieSet();
    try {
      if (global.AmalOwner && AmalOwner.unlock) AmalOwner.unlock("amal");
    } catch (_) {}
  }

  function isOwner() {
    if (global.__AMAL_OWNER__ === true) return true;
    if (ownerFromUrl()) {
      markOwner();
      return true;
    }
    if (thisPcLooksLikeOwner()) {
      markOwner();
      return true;
    }
    try {
      if (global.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner()) {
        markOwner();
        return true;
      }
    } catch (_) {}
    return false;
  }

  function markFriendsAccess() {
    lsSet("amal-friends-access-v1", "1");
    try { global.sessionStorage.setItem("amal-friends-session-v1", "1"); } catch (_) {}
    try {
      document.cookie = "amal_friends=1; path=/; max-age=31536000; SameSite=Lax";
    } catch (_) {}
  }

  function hasFriendsAccess() {
    if (isOwner()) {
      markFriendsAccess();
      return true;
    }
    try {
      var q = query();
      if (q.get("code") === "amal-star-friends" || q.get("from") === "friends" ||
          q.get("friends") === "1" || q.get("hub") === "friends") {
        markFriendsAccess();
        return true;
      }
    } catch (_) {}
    if (lsGet("amal-friends-access-v1") === "1") return true;
    try {
      if (global.sessionStorage.getItem("amal-friends-session-v1") === "1") return true;
    } catch (_) {}
    try {
      if ((document.cookie || "").indexOf("amal_friends=1") >= 0) {
        markFriendsAccess();
        return true;
      }
    } catch (_) {}
    return false;
  }

  /** Зашёл на страницу друзей / вечеринки = как будто уже отсканировал QR */
  function admitLikeQrScanned() {
    markFriendsAccess();
    // На домашнем Chrome Амаля — сразу хозяин, без скана
    if (isOwner() || ownerFromUrl() || thisPcLooksLikeOwner()) markOwner();
  }

  /** Вызвать после owner-cheats.js — подтянуть AmalOwner.unlock */
  function syncOwnerCheats() {
    if (!isOwner()) return false;
    markOwner();
    try {
      if (global.AmalOwner && AmalOwner.unlock) AmalOwner.unlock("amal");
    } catch (_) {}
    return true;
  }

  if (ownerFromUrl() || thisPcLooksLikeOwner()) markOwner();
  isOwner();

  // На домашнем ПК способности держатся крепче (каждый заход заново закрепляет)
  try {
    if (thisPcLooksLikeOwner()) {
      markOwner();
      markFriendsAccess();
    }
  } catch (_) {}

  global.AmalOwnerSession = {
    isOwner: isOwner,
    markOwner: markOwner,
    ownerFromUrl: ownerFromUrl,
    markFriendsAccess: markFriendsAccess,
    hasFriendsAccess: hasFriendsAccess,
    admitLikeQrScanned: admitLikeQrScanned,
    syncOwnerCheats: syncOwnerCheats,
    thisPcLooksLikeOwner: thisPcLooksLikeOwner,
  };
})(window);
