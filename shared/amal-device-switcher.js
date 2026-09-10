/**
 * Переключатель версий: телефон / планшет / ПК / друзья.
 * Крупные кнопки с подписями — удобно друзьям с QR.
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
    var h = "./friends.html?v=10&stay=1&code=" + encodeURIComponent(FRIEND_CODE);
    if (isOwnerPc()) h += "&owner=amal";
    return h;
  }

  function desktopHref() {
    if (hasFriendsAccess()) {
      return isOwnerPc() ? "./?stay=1&hub=friends&owner=amal" : "./?stay=1&hub=friends";
    }
    return "./?stay=1";
  }

  function phoneHref() {
    if (hasFriendsAccess()) return "./phone.html?v=3&stay=1&hub=friends";
    return "./phone.html?v=3&stay=1";
  }

  function tabletHref() {
    if (hasFriendsAccess()) return "./tablet.html?v=2&stay=1&hub=friends";
    return "./tablet.html?v=2&stay=1";
  }

  function ensureCss() {
    if (document.getElementById("amal-device-switcher-css")) return;
    var s = document.createElement("style");
    s.id = "amal-device-switcher-css";
    s.textContent =
      ".device-switcher{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;" +
      "padding:12px 14px;margin:8px auto 12px;max-width:min(720px,96vw);" +
      "background:rgba(255,255,255,.96);border:2px solid rgba(13,110,95,.22);border-radius:20px;" +
      "font-family:Nunito,system-ui,sans-serif;font-weight:800}" +
      ".device-switcher .ds-label{color:#5a6a62;font-size:13px;margin-right:4px}" +
      ".device-switcher .ds-btn{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;" +
      "gap:2px;min-width:72px;min-height:64px;padding:10px 12px;border-radius:16px;text-decoration:none;" +
      "font-size:28px;line-height:1;border:2px solid transparent;background:#f1f5f9;color:#102018}" +
      ".device-switcher .ds-btn small{font-size:11px;font-weight:800;letter-spacing:.02em;opacity:.85}" +
      ".device-switcher .ds-btn.on{background:#0d6e5f;border-color:#0d6e5f;color:#fff;" +
      "box-shadow:0 0 0 3px rgba(126,217,184,.55)}" +
      ".device-switcher .ds-btn.on small{opacity:1;color:#ecfdf5}" +
      ".device-switcher .ds-hint{font-size:12px;color:#5a6a62;font-weight:700;margin-left:4px}";
    document.head.appendChild(s);
  }

  function btn(cls, href, ico, label) {
    return (
      '<a class="ds-btn' + cls + '" href="' + href + '" title="' + label + '">' +
      ico + "<small>" + label + "</small></a>"
    );
  }

  function mount(containerId) {
    var root = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!root || root.querySelector(".device-switcher")) return;
    ensureCss();

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
      btn(current === "phone" ? " on" : "", phoneHref(), "📱", "Телефон") +
      btn(current === "tablet" ? " on" : "", tabletHref(), "📟", "Планшет") +
      btn(current === "desktop" ? " on" : "", desktopHref(), "💻", "Сайт") +
      (hasFriendsAccess() || isOwnerPc()
        ? btn(current === "friends" ? " on" : "", friendsHref(), "⭐", "Друзья")
        : "") +
      (isOwnerPc() ? btn("", "./my-links.html", "🔗", "Ссылки") : "") +
      '<span class="ds-hint">' + (global.AmalDevice ? AmalDevice.icon(dev) : "💻") + "</span>";

    root.appendChild(el);
  }

  global.AmalDeviceSwitcher = { mount: mount, hasFriendsAccess: hasFriendsAccess };
})(window);
