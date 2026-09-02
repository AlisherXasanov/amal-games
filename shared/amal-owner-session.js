/**
 * Помнит, что зашёл Амаль — localStorage + sessionStorage + cookie + URL.
 * Кнопка «Я Амаль» не должна просто перезагружать страницу.
 */
(function (global) {
  "use strict";

  var SESSION_KEY = "amal-owner-session-v1";
  var COOKIE_KEY = "amal_owner";
  var OWNER_CODES = ["amal", "1234", "buddy", "amalowner2026"];
  var LS_KEYS = ["amal-owner-v3", "amal-owner-v1", "amal-owner-v2"];

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

  function markOwner() {
    global.__AMAL_OWNER__ = true;
    global.__SCHOOL_PARTY_OK__ = true;
    try { global.sessionStorage.setItem(SESSION_KEY, "1"); } catch (_) {}
    try {
      global.localStorage.setItem("amal-owner-v3", "1");
      global.localStorage.setItem("amal-owner-v1", "1");
      global.localStorage.setItem("amal-friends-access-v1", "1");
    } catch (_) {}
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
    try {
      if (global.sessionStorage.getItem(SESSION_KEY) === "1") {
        global.__AMAL_OWNER__ = true;
        return true;
      }
    } catch (_) {}
    if (cookieGet() === "1") {
      markOwner();
      return true;
    }
    try {
      for (var i = 0; i < LS_KEYS.length; i++) {
        if (global.localStorage.getItem(LS_KEYS[i]) === "1") {
          markOwner();
          return true;
        }
      }
    } catch (_) {}
    try {
      if (global.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner()) {
        markOwner();
        return true;
      }
    } catch (_) {}
    return false;
  }

  function markFriendsAccess() {
    try { global.localStorage.setItem("amal-friends-access-v1", "1"); } catch (_) {}
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
    try {
      if (global.localStorage.getItem("amal-friends-access-v1") === "1") return true;
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
    if (isOwner() || ownerFromUrl()) markOwner();
  }

  if (ownerFromUrl()) markOwner();
  isOwner();

  global.AmalOwnerSession = {
    isOwner: isOwner,
    markOwner: markOwner,
    ownerFromUrl: ownerFromUrl,
    markFriendsAccess: markFriendsAccess,
    hasFriendsAccess: hasFriendsAccess,
    admitLikeQrScanned: admitLikeQrScanned,
  };
})(window);
