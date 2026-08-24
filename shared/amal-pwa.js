/**
 * Amal PWA — офлайн + режим экономии телефона.
 * Подключать на главной и (по желанию) в играх.
 */
(function (global) {
  "use strict";

  var BADGE_ID = "amal-offline-badge";
  var STYLE_ID = "amal-pwa-style";

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent =
      "#" + BADGE_ID + "{" +
      "position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);" +
      "z-index:2147483000;padding:7px 12px;border-radius:999px;font:800 12px/1.2 system-ui,sans-serif;" +
      "background:rgba(16,32,24,.92);color:#7ed9b8;border:1px solid rgba(126,217,184,.4);" +
      "box-shadow:0 8px 22px rgba(0,0,0,.28);pointer-events:none;opacity:0;transition:opacity .25s}" +
      "#" + BADGE_ID + ".show{opacity:1}" +
      "#" + BADGE_ID + ".warn{color:#fde68a;border-color:rgba(251,191,36,.45)}" +
      /* Экономия телефона: меньше анимаций и эффектов */
      "body.amal-phone-saver .menu-cube," +
      "body.amal-phone-saver .menu-cube-rainbow," +
      "body.amal-phone-saver .menu-cube-inner," +
      "body.amal-phone-saver .side-cube .menu-cube," +
      "body.amal-phone-saver .vials span{" +
      "animation:none!important}" +
      "body.amal-phone-saver{" +
      "background-attachment:scroll!important}" +
      "body.amal-phone-saver .side-cube{" +
      "backdrop-filter:none!important;-webkit-backdrop-filter:none!important}" +
      "@media (prefers-reduced-motion:reduce){" +
      "body .menu-cube,body .menu-cube-rainbow,body .menu-cube-inner,body .vials span{" +
      "animation:none!important}}";
    document.head.appendChild(st);
  }

  function showBadge(text, warn) {
    injectCss();
    var el = document.getElementById(BADGE_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = BADGE_ID;
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.toggle("warn", !!warn);
    el.classList.add("show");
    clearTimeout(showBadge._t);
    showBadge._t = setTimeout(function () {
      el.classList.remove("show");
    }, 4200);
  }

  function isPhone() {
    try {
      if (global.matchMedia && matchMedia("(max-width: 820px)").matches) return true;
      if (global.matchMedia && matchMedia("(pointer:coarse)").matches) return true;
    } catch (_) {}
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function enablePhoneSaver() {
    injectCss();
    document.documentElement.classList.add("amal-phone-saver");
    document.body.classList.add("amal-phone-saver");
    // Пауза тяжёлых анимаций, когда вкладка не видна
    var sync = function () {
      document.body.classList.toggle("amal-paused", document.hidden);
    };
    document.addEventListener("visibilitychange", sync);
    sync();

    // Если батарея низкая или режим экономии данных — ещё тише
    try {
      if (navigator.connection && navigator.connection.saveData) {
        document.body.classList.add("amal-save-data");
      }
    } catch (_) {}
    try {
      if (navigator.getBattery) {
        navigator.getBattery().then(function (b) {
          var apply = function () {
            if (b.level <= 0.2 || b.charging === false && b.level <= 0.35) {
              document.body.classList.add("amal-low-battery");
            } else {
              document.body.classList.remove("amal-low-battery");
            }
          };
          b.addEventListener("levelchange", apply);
          b.addEventListener("chargingchange", apply);
          apply();
        });
      }
    } catch (_) {}
  }

  function registerSw() {
    if (!("serviceWorker" in navigator)) return;
    var swUrl;
    var scope;
    try {
      swUrl = new URL("./sw.js", location.href).href;
      scope = new URL("./", location.href).href;
    } catch (_) {
      swUrl = "./sw.js";
      scope = "./";
    }

    navigator.serviceWorker
      .register(swUrl, { scope: scope })
      .then(function (reg) {
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.addEventListener("updatefound", function () {
          var w = reg.installing;
          if (!w) return;
          w.addEventListener("statechange", function () {
            if (w.state === "installed" && navigator.serviceWorker.controller) {
              showBadge("Обновление сайта сохранено офлайн");
            }
          });
        });
        setTimeout(function () {
          if (!reg.active) return;
          reg.active.postMessage({
            type: "PREFETCH",
            urls: [
              "./animal-hospital/",
              "./animal-hospital/index.html",
              "./bed-wars/",
              "./bed-wars/index.html",
              "./ladder-climb/",
              "./ladder-climb/index.html",
              "./old-pc/",
              "./old-pc/index.html",
            ],
          });
        }, 4000);
      })
      .catch(function () {
        /* SW недоступен (file:// и т.п.) */
      });
  }

  function wireOnlineStatus() {
    var ping = function () {
      if (!navigator.onLine) {
        showBadge("Офлайн · играй из сохранённых", true);
      }
    };
    window.addEventListener("offline", function () {
      showBadge("Нет интернета · сохранённые игры работают", true);
    });
    window.addEventListener("online", function () {
      showBadge("Сеть снова есть");
    });
    if (!navigator.onLine) ping();
  }

  function boot() {
    injectCss();
    if (isPhone()) enablePhoneSaver();
    // На узких экранах тоже экономим
    try {
      if (matchMedia("(max-width: 820px)").matches) enablePhoneSaver();
    } catch (_) {}
    registerSw();
    wireOnlineStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.AmalPwa = {
    showBadge: showBadge,
    enablePhoneSaver: enablePhoneSaver,
  };
})(typeof window !== "undefined" ? window : globalThis);
