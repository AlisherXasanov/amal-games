/**
 * Переключатель версий: телефон / планшет / ПК / друзья.
 * На домашнем ПК Амаля 📱 не уводит в «пустой» phone.html — в Эксклюзив.
 */
(function (global) {
  "use strict";

  var FRIEND_KEY = "amal-friends-access-v1";
  var FRIEND_CODE = "amal-star-friends";

  function hasFriendsAccess() {
    try {
      if (localStorage.getItem(FRIEND_KEY) === "1") return true;
    } catch (_) {}
    try {
      if (global.AmalDevice && AmalDevice.friendsAllowed()) return true;
    } catch (_) {}
    try {
      if (sessionStorage.getItem("amal-device-hub-v1") === "friends") return true;
    } catch (_) {}
    try {
      if (global.AmalOwnerSession && AmalOwnerSession.isOwner && AmalOwnerSession.isOwner()) return true;
    } catch (_) {}
    return /[?&]hub=friends/.test(location.search);
  }

  function isOwnerPc() {
    try {
      if (global.AmalOwnerSession && AmalOwnerSession.isOwner && AmalOwnerSession.isOwner()) return true;
    } catch (_) {}
    try {
      return localStorage.getItem("amal-home-pc-v1") === "1" ||
        localStorage.getItem("amal-owner-v3") === "1" ||
        localStorage.getItem("amal-owner-v1") === "1";
    } catch (_) {}
    return false;
  }

  function friendsHref() {
    var h = "./friends.html?v=8&stay=1&code=" + encodeURIComponent(FRIEND_CODE);
    if (isOwnerPc()) h += "&owner=amal";
    return h;
  }

  function desktopHref() {
    if (hasFriendsAccess()) {
      return isOwnerPc() ? "./?stay=1&hub=friends&owner=amal" : "./?stay=1&hub=friends";
    }
    return "./?stay=1";
  }

  /** Телефон: с доступом друзей / хозяина — в Эксклюзив, не в обычный phone.html */
  function phoneHref() {
    if (hasFriendsAccess() || isOwnerPc()) return friendsHref();
    return "./phone.html?v=2&stay=1";
  }

  function tabletHref() {
    if (hasFriendsAccess() || isOwnerPc()) return friendsHref();
    return "./tablet.html?v=1&stay=1";
  }

  function mount(containerId) {
    var root = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!root || root.querySelector(".device-switcher")) return;

    var dev = global.AmalDevice ? AmalDevice.detect() : "desktop";
    var path = (location.pathname || "").toLowerCase();
    var current = "desktop";
    if (path.indexOf("phone.html") >= 0) current = "phone";
    else if (path.indexOf("tablet.html") >= 0) current = "tablet";
    else if (path.indexOf("friends.html") >= 0) current = "friends";
    else if (hasFriendsAccess() && /[?&]hub=friends/.test(location.search)) current = "friends";

    var el = document.createElement("nav");
    el.className = "device-switcher";
    el.setAttribute("aria-label", "Выбор версии сайта");
    el.innerHTML =
      '<span class="ds-label">Версия:</span>' +
      '<a class="ds-btn' + (current === "phone" ? " on" : "") + '" href="' + phoneHref() + '" title="Телефон / Эксклюзив">📱</a>' +
      '<a class="ds-btn' + (current === "tablet" ? " on" : "") + '" href="' + tabletHref() + '" title="Планшет / Эксклюзив">📟</a>' +
      '<a class="ds-btn' + (current === "desktop" ? " on" : "") + '" href="' + desktopHref() + '" title="Компьютер">💻</a>' +
      (hasFriendsAccess() || isOwnerPc()
        ? '<a class="ds-btn' + (current === "friends" ? " on" : "") + '" href="' + friendsHref() + '" title="Друзья">⭐</a>'
        : "") +
      (isOwnerPc()
        ? '<a class="ds-btn" href="./my-links.html" title="Мои ссылки">🔗</a>'
        : "") +
      '<span class="ds-hint">' + (global.AmalDevice ? AmalDevice.icon(dev) : "💻") + "</span>";

    root.appendChild(el);
  }

  global.AmalDeviceSwitcher = { mount: mount, hasFriendsAccess: hasFriendsAccess };
})(window);
