/**
 * Автообновление: если на сервере новая сборка — страница сама перезагрузится.
 * Работает для всех (друзья / основной сайт / телефон).
 */
(function () {
  "use strict";
  if (window.__AMAL_AUTO_REFRESH__) return;
  window.__AMAL_AUTO_REFRESH__ = true;

  var KEY = "amal-build-seen-v1";
  var INTERVAL_MS = 40000;
  var first = true;

  function buildUrl() {
    try {
      return new URL("./shared/amal-build.txt", location.href).href + "?t=" + Date.now();
    } catch (_) {
      return "./shared/amal-build.txt?t=" + Date.now();
    }
  }

  function check() {
    fetch(buildUrl(), { cache: "no-store", credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("no build");
        return r.text();
      })
      .then(function (raw) {
        var v = String(raw || "").trim().split(/\s+/)[0];
        if (!v || v.length < 4) return;
        var prev = "";
        try {
          prev = localStorage.getItem(KEY) || "";
        } catch (_) {}
        if (first) {
          first = false;
          try {
            localStorage.setItem(KEY, v);
          } catch (_) {}
          return;
        }
        if (prev && prev !== v) {
          try {
            localStorage.setItem(KEY, v);
          } catch (_) {}
          // Не дёргать посреди ввода в чат/игре, если пользователь печатает
          try {
            var ae = document.activeElement;
            if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) {
              setTimeout(function () {
                location.reload();
              }, 8000);
              return;
            }
          } catch (_) {}
          location.reload();
        } else if (!prev) {
          try {
            localStorage.setItem(KEY, v);
          } catch (_) {}
        }
      })
      .catch(function () {});
  }

  setTimeout(check, 2500);
  setInterval(check, INTERVAL_MS);

  // Когда вкладка снова активна — сразу проверить обновление
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") check();
  });
})();
