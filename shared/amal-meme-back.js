/**
 * Кнопка «назад» с канала мемов → телефон / ПК / друзья.
 */
(function () {
  "use strict";

  function hasFriends() {
    try {
      if (localStorage.getItem("amal-friends-access-v1") === "1") return true;
    } catch (_) {}
    try {
      if (window.AmalDevice && AmalDevice.friendsAllowed()) return true;
    } catch (_) {}
    try {
      return sessionStorage.getItem("amal-device-hub-v1") === "friends";
    } catch (_) {}
    return /[?&]hub=friends/.test(location.search) || /[?&]from=friends/.test(location.search);
  }

  function hubFromUrl() {
    if (/[?&]from=phone/.test(location.search)) return "phone";
    if (/[?&]from=tablet/.test(location.search)) return "tablet";
    if (/[?&]from=friends/.test(location.search)) return "friends";
    if (/[?&]from=desktop/.test(location.search)) return "desktop";
    try {
      var h = sessionStorage.getItem("amal-device-hub-v1");
      if (h) return h;
    } catch (_) {}
    try {
      if (window.AmalDevice) return AmalDevice.detect();
    } catch (_) {}
    return "desktop";
  }

  function backUrl(hub) {
    if (hub === "phone") return "./phone.html?v=2&stay=1";
    if (hub === "tablet") return "./tablet.html?v=1&stay=1";
    if (hub === "friends" || (hub === "desktop" && hasFriends())) {
      var u = "./friends.html?v=2&stay=1";
      if (hasFriends()) u += "&code=amal-star-friends";
      return u;
    }
    return "./?stay=1";
  }

  function backLabel(hub) {
    if (hub === "phone") return "🏠 Игры Амаля (телефон)";
    if (hub === "tablet") return "🏠 Игры Амаля (планшет)";
    if (hub === "friends" || (hub === "desktop" && hasFriends())) return "🏠 Игры Амаля ⭐";
    return "🏠 Игры Амаля";
  }

  function wire() {
    if (document.documentElement.classList.contains("qr-lock") || document.body.classList.contains("qr-lock")) return;
    var hub = hubFromUrl();
    try { sessionStorage.setItem("amal-device-hub-v1", hub); } catch (_) {}
    var url = backUrl(hub);
    var label = backLabel(hub);
    document.querySelectorAll("a.back, a.portal-back, [data-meme-back], #home-quick, .home-quick").forEach(function (a) {
      a.setAttribute("href", url);
      if (a.classList.contains("home-quick") || a.id === "home-quick") {
        a.textContent = label;
      } else if (/^←|^🏠/.test((a.textContent || "").trim()) || a.hasAttribute("data-meme-back")) {
        a.textContent = label.replace("🏠 ", "← ");
      }
    });
  }

  window.AmalMemeBack = { wire: wire, backUrl: backUrl, backLabel: backLabel };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
