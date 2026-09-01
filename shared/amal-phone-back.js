/**
 * Если зашли с phone.html (?from=phone) — «назад» ведёт на телефонную версию.
 */
(function () {
  "use strict";

  var PHONE = "../phone.html?v=2";
  var KEY = "amal-from-phone";

  function cameFromPhone() {
    try {
      if (/[?&]from=phone(?:&|$)/.test(location.search)) {
        sessionStorage.setItem(KEY, "1");
        return true;
      }
      return sessionStorage.getItem(KEY) === "1";
    } catch (_) {
      return /[?&]from=phone/.test(location.search);
    }
  }

  function wire() {
    if (!cameFromPhone()) return;

    var sel =
      'a.portal-back, a.back, a#back, a.task-exit, ' +
      'a[href="../"], a[href="../index.html"], a[href="../index.html?fresh=820"]';

    document.querySelectorAll(sel).forEach(function (a) {
      a.setAttribute("href", PHONE);
      var t = (a.textContent || "").trim();
      if (/^←|^Все|^Каталог|^Игры|^назад|^Выйти/i.test(t) || t === "←") {
        a.textContent = "← Телефон";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.AmalPhoneBack = { wire: wire, phoneUrl: PHONE };
})();
