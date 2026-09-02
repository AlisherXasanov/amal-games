/**
 * Amal Device — распознаёт телефон / планшет / компьютер.
 * AmalDevice.detect() → "phone" | "tablet" | "desktop"
 */
(function (global) {
  "use strict";

  var STORE_HUB = "amal-device-hub-v1";
  var STORE_DEV = "amal-device-last-v1";
  var STORE_FRIENDS = "amal-friends-access-v1";
  var FRIENDS_CODE = "amal-star-friends";

  function detect() {
    var ua = navigator.userAgent || "";
    var touch = navigator.maxTouchPoints || 0;
    var w = global.innerWidth || 1024;
    var h = global.innerHeight || 768;
    var min = Math.min(w, h);
    var max = Math.max(w, h);

    var isIPad =
      /iPad/.test(ua) ||
      (navigator.platform === "MacIntel" && touch > 1) ||
      (/Macintosh/.test(ua) && touch > 1);

    var isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);
    var isTablet =
      isIPad ||
      isAndroidTablet ||
      (touch > 0 && min >= 600 && max >= 900 && min < 1024);

    var isPhone =
      !isTablet &&
      (min < 640 ||
        /iPhone|iPod|Windows Phone/i.test(ua) ||
        (/Android/i.test(ua) && /Mobile/i.test(ua)));

    if (isPhone) return "phone";
    if (isTablet) return "tablet";
    return "desktop";
  }

  function label(dev) {
    return dev === "phone" ? "📱 Телефон" : dev === "tablet" ? "📟 Планшет" : "💻 Компьютер";
  }

  function icon(dev) {
    return dev === "phone" ? "📱" : dev === "tablet" ? "📟" : "💻";
  }

  function hubUrl(dev, exclusive) {
    if (exclusive) return "./friends.html?v=1&stay=1";
    if (dev === "phone") return "./phone.html?v=2&stay=1";
    if (dev === "tablet") return "./tablet.html?v=1&stay=1";
    return "./?stay=1";
  }

  function remember(dev, hub) {
    try {
      sessionStorage.setItem(STORE_DEV, dev);
      if (hub) sessionStorage.setItem(STORE_HUB, hub);
    } catch (_) {}
  }

  function getHub() {
    try { return sessionStorage.getItem(STORE_HUB) || "phone"; } catch (_) { return "phone"; }
  }

  function setHub(hub) {
    try { sessionStorage.setItem(STORE_HUB, hub); } catch (_) {}
  }

  function query() {
    try { return new URLSearchParams(global.location.search); } catch (_) { return new URLSearchParams(); }
  }

  function hasStay() {
    var q = query();
    return q.get("stay") === "1" || q.get("desktop") === "1";
  }

  function routeFromGo(exclusive) {
    var q = query();
    var dev = detect();
    remember(dev, exclusive ? "friends" : dev);

    if (exclusive) {
      var code = q.get("code") || "";
      if (code === FRIENDS_CODE) {
        try { localStorage.setItem(STORE_FRIENDS, "1"); } catch (_) {}
      }
      var url =
        "./friends.html?v=1&stay=1&device=" + dev +
        (code ? "&code=" + encodeURIComponent(code) : "");
      global.location.replace(url);
      return;
    }

    global.location.replace(hubUrl(dev, false));
  }

  function maybeRedirectFromIndex() {
    if (hasStay()) return;
    var path = (global.location.pathname || "").toLowerCase();
    var isRoot =
      path.endsWith("/") ||
      path.endsWith("/index.html") ||
      path.endsWith("/amal-games") ||
      path.endsWith("/amal-games/");
    if (!isRoot) return;

    var dev = detect();
    remember(dev, dev);
    if (dev === "phone") global.location.replace("./phone.html?v=2&stay=1");
    else if (dev === "tablet") global.location.replace("./tablet.html?v=1&stay=1");
  }

  function wrongDeviceBanner(rootId) {
    var dev = detect();
    var hub = getHub();
    if (hub === dev) return;

    var root = document.getElementById(rootId);
    if (!root) return;

    var bar = document.createElement("div");
    bar.className = "amal-device-bar";
    bar.innerHTML =
      icon(dev) + " Сейчас " + label(dev).slice(2) +
      ' · <a href="' + hubUrl(dev, hub === "friends") + '">Перейти на свою версию</a>';
    root.insertBefore(bar, root.firstChild);
  }

  function isSiteOwner() {
    try {
      if (global.AmalOwnerSession && AmalOwnerSession.isOwner && AmalOwnerSession.isOwner()) {
        return true;
      }
      if (global.__AMAL_OWNER__ === true) return true;
      if (global.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner()) {
        global.__AMAL_OWNER__ = true;
        return true;
      }
      var q = query();
      var ownerCode = (q.get("owner") || "").trim().toLowerCase();
      var ownerCodes = ["amalowner2026", "amal", "1234", "buddy"];
      if (ownerCodes.indexOf(ownerCode) >= 0) {
        global.__AMAL_OWNER__ = true;
        try {
          localStorage.setItem("amal-owner-v1", "1");
          localStorage.setItem("amal-owner-v3", "1");
          localStorage.setItem(STORE_FRIENDS, "1");
        } catch (_) {}
        return true;
      }
      if (["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"].some(function (k) {
        return localStorage.getItem(k) === "1";
      })) {
        global.__AMAL_OWNER__ = true;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function friendsAllowed() {
    if (global.AmalOwnerSession && AmalOwnerSession.hasFriendsAccess && AmalOwnerSession.hasFriendsAccess()) {
      return true;
    }
    if (isSiteOwner()) {
      try { localStorage.setItem(STORE_FRIENDS, "1"); } catch (_) {}
      return true;
    }
    var q = query();
    if (q.get("code") === FRIENDS_CODE) {
      try { localStorage.setItem(STORE_FRIENDS, "1"); } catch (_) {}
      return true;
    }
    if (q.get("from") === "friends" || q.get("friends") === "1" || q.get("hub") === "friends") {
      try { localStorage.setItem(STORE_FRIENDS, "1"); } catch (_) {}
      return true;
    }
    try { return localStorage.getItem(STORE_FRIENDS) === "1"; } catch (_) { return false; }
  }

  global.AmalDevice = {
    detect: detect,
    label: label,
    icon: icon,
    hubUrl: hubUrl,
    remember: remember,
    getHub: getHub,
    setHub: setHub,
    routeFromGo: routeFromGo,
    maybeRedirectFromIndex: maybeRedirectFromIndex,
    wrongDeviceBanner: wrongDeviceBanner,
    friendsAllowed: friendsAllowed,
    isSiteOwner: isSiteOwner,
    FRIENDS_CODE: FRIENDS_CODE,
    STORE_HUB: STORE_HUB,
  };
})(window);
