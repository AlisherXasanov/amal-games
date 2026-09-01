/**
 * «Назад» → на правильную версию (телефон / планшет / ПК / друзья).
 */
(function () {
  "use strict";

  var HUBS = {
    phone: "../phone.html?v=2&stay=1",
    tablet: "../tablet.html?v=1&stay=1",
    desktop: "../?stay=1",
    friends: "../friends.html?v=1&stay=1",
  };

  var KEY_HUB = "amal-device-hub-v1";

  function detectFromUrl() {
    if (/[?&]from=phone/.test(location.search)) return "phone";
    if (/[?&]from=tablet/.test(location.search)) return "tablet";
    if (/[?&]from=friends/.test(location.search)) return "friends";
    if (/[?&]from=desktop/.test(location.search)) return "desktop";
    try {
      var h = sessionStorage.getItem(KEY_HUB);
      if (h && HUBS[h]) return h;
    } catch (_) {}
    return null;
  }

  function hubLabel(h) {
    return h === "phone" ? "← Телефон" : h === "tablet" ? "← Планшет" : h === "friends" ? "← Друзья" : "← Игры";
  }

  function wire() {
    var hub = detectFromUrl();
    if (!hub) return;

    try { sessionStorage.setItem(KEY_HUB, hub); } catch (_) {}

    var back = HUBS[hub];
    var sel =
      'a.portal-back, a.back, a#back, a.task-exit, ' +
      'a[href="../"], a[href="../index.html"], a[href="../index.html?fresh=820"], ' +
      'a[href="../phone.html"], a[href="../phone.html?v=2"]';

    document.querySelectorAll(sel).forEach(function (a) {
      a.setAttribute("href", back);
      var t = (a.textContent || "").trim();
      if (/^←|^Все|^Каталог|^Игры|^назад|^Выйти|^Телефон/i.test(t) || t === "←") {
        a.textContent = hubLabel(hub);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.AmalHubBack = { wire: wire, hubs: HUBS };
})();
