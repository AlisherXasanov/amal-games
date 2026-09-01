/**
 * Amal Mobile — телефон: масштаб, альбомная ориентация, полный экран.
 * AmalMobile.init({ landscape: true, canvas: "#game", fit: true });
 */
(function (global) {
  "use strict";

  var STYLE_HREF = "../shared/amal-mobile.css?v=1";
  var rotateEl = null;
  var fsBtn = null;
  var rotateDismissed = false;

  function isPhone() {
    try {
      if (global.matchMedia && matchMedia("(max-width: 900px)").matches) return true;
      if (global.matchMedia && matchMedia("(pointer: coarse)").matches) return true;
    } catch (_) {}
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function isLandscape() {
    try {
      if (global.matchMedia && matchMedia("(orientation: landscape)").matches) return true;
    } catch (_) {}
    return global.innerWidth > global.innerHeight;
  }

  function loadCss() {
    if (document.querySelector('link[data-amal-mobile-css]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLE_HREF.replace("../shared/", detectSharedPrefix());
    link.setAttribute("data-amal-mobile-css", "1");
    document.head.appendChild(link);
  }

  function detectSharedPrefix() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("amal-mobile.js") >= 0) {
        return src.replace(/amal-mobile\.js.*$/, "");
      }
    }
    return "../shared/";
  }

  function ensureRotateHint() {
    if (rotateEl) return rotateEl;
    rotateEl = document.createElement("div");
    rotateEl.id = "amal-rotate-hint";
    rotateEl.innerHTML =
      '<div class="box">' +
      '<div class="icon">📱</div>' +
      "<p><strong>Поверни телефон горизонтально</strong><br>Так играть удобнее — как на компьютере!</p>" +
      '<button type="button" id="amal-rotate-ok">Ок, играю так</button>' +
      "</div>";
    document.body.appendChild(rotateEl);
    rotateEl.querySelector("#amal-rotate-ok").addEventListener("click", function () {
      rotateDismissed = true;
      rotateEl.classList.remove("show");
      try { sessionStorage.setItem("amal-rotate-ok", "1"); } catch (_) {}
    });
    return rotateEl;
  }

  function syncRotateHint(wantLandscape) {
    if (!wantLandscape || !isPhone()) return;
    try {
      if (sessionStorage.getItem("amal-rotate-ok") === "1") rotateDismissed = true;
    } catch (_) {}
    var el = ensureRotateHint();
    if (!rotateDismissed && !isLandscape()) el.classList.add("show");
    else el.classList.remove("show");
  }

  function ensureFsBtn() {
    if (fsBtn) return fsBtn;
    fsBtn = document.createElement("button");
    fsBtn.id = "amal-fs-btn";
    fsBtn.type = "button";
    fsBtn.textContent = "⛶";
    fsBtn.title = "На весь экран";
    fsBtn.addEventListener("click", toggleFullscreen);
    document.body.appendChild(fsBtn);
    return fsBtn;
  }

  function toggleFullscreen() {
    var el = document.documentElement;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (_) {}
  }

  function fitCanvas(sel) {
    var canvas = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!canvas || !canvas.getAttribute("width")) return;

    var baseW = +canvas.getAttribute("width");
    var baseH = +canvas.getAttribute("height");
    var stage = canvas.closest(".game-stage") || canvas.parentElement;

    function resize() {
      if (!isPhone()) {
        canvas.style.width = "100%";
        canvas.style.height = "";
        canvas.style.maxHeight = "";
        return;
      }
      var pad = 12;
      var availW = (stage ? stage.clientWidth : global.innerWidth) - pad;
      var availH = (stage ? stage.clientHeight : global.innerHeight * 0.55) - pad;
      if (availW < 80 || availH < 80) return;

      var scale = Math.min(availW / baseW, availH / baseH, 2.5);
      var dw = Math.floor(baseW * scale);
      var dh = Math.floor(baseH * scale);
      canvas.style.width = dw + "px";
      canvas.style.height = dh + "px";
      canvas.style.maxHeight = availH + "px";
      canvas.style.margin = "0 auto";
      canvas.style.display = "block";
    }

    if (stage && !stage.style.minHeight) {
      stage.style.minHeight = "0";
      stage.style.flex = "1 1 auto";
    }
    global.addEventListener("resize", resize);
    global.addEventListener("orientationchange", function () {
      setTimeout(resize, 120);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    setTimeout(resize, 0);
    setTimeout(resize, 200);
  }

  function init(opts) {
    opts = opts || {};
    if (!isPhone()) return { isPhone: false };

    loadCss();
    document.documentElement.classList.add("amal-phone");
    document.body.classList.add("amal-game-mobile");

    if (opts.landscape) {
      document.body.classList.add("amal-prefer-landscape");
      if (opts.lockScroll !== false) document.body.classList.add("amal-lock-scroll");
      syncRotateHint(true);
      global.addEventListener("resize", function () { syncRotateHint(true); });
      global.addEventListener("orientationchange", function () {
        setTimeout(function () { syncRotateHint(true); }, 150);
      });
    }

    if (opts.canvas && opts.fit !== false) fitCanvas(opts.canvas);

    if (opts.fullscreen !== false) {
      var btn = ensureFsBtn();
      btn.classList.add("show");
    }

    return { isPhone: true, isLandscape: isLandscape() };
  }

  global.AmalMobile = {
    init: init,
    isPhone: isPhone,
    isLandscape: isLandscape,
    fitCanvas: fitCanvas,
  };

  /* Назад на phone.html если пришли с телефонной версии */
  function loadPhoneBack() {
    if (document.querySelector('script[data-amal-hub-back]')) return;
    var s = document.createElement("script");
    s.src = detectSharedPrefix() + "amal-hub-back.js?v=1";
    s.setAttribute("data-amal-hub-back", "1");
    document.head.appendChild(s);
  }
  loadPhoneBack();
})(window);
