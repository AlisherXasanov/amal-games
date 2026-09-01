/**
 * Переключатель версий: телефон / планшет / ПК — вручную, без авто-перекидывания.
 */
(function (global) {
  "use strict";

  function mount(containerId) {
    var root = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!root || root.querySelector(".device-switcher")) return;

    var dev = global.AmalDevice ? AmalDevice.detect() : "desktop";
    var path = (location.pathname || "").toLowerCase();
    var current = "desktop";
    if (path.indexOf("phone.html") >= 0) current = "phone";
    else if (path.indexOf("tablet.html") >= 0) current = "tablet";
    else if (path.indexOf("friends.html") >= 0) current = "friends";

    var el = document.createElement("nav");
    el.className = "device-switcher";
    el.setAttribute("aria-label", "Выбор версии сайта");
    el.innerHTML =
      '<span class="ds-label">Версия:</span>' +
      '<a class="ds-btn' + (current === "phone" ? " on" : "") + '" href="./phone.html?v=2&stay=1" title="Телефон">📱</a>' +
      '<a class="ds-btn' + (current === "tablet" ? " on" : "") + '" href="./tablet.html?v=1&stay=1" title="Планшет">📟</a>' +
      '<a class="ds-btn' + (current === "desktop" ? " on" : "") + '" href="./?stay=1" title="Компьютер">💻</a>' +
      '<a class="ds-btn' + (current === "friends" ? " on" : "") + '" href="./friends.html?v=1&stay=1" title="Друзья">⭐</a>' +
      '<span class="ds-hint">сейчас: ' + (global.AmalDevice ? AmalDevice.icon(dev) : "💻") + '</span>';

    root.appendChild(el);
  }

  global.AmalDeviceSwitcher = { mount: mount };
})(window);
