/**

 * Переключатель версий: телефон / планшет / ПК / друзья.

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

    return /[?&]hub=friends/.test(location.search);

  }



  function friendsHref() {

    var h = "./friends.html?v=3&stay=1";

    if (hasFriendsAccess()) h += "&code=" + encodeURIComponent(FRIEND_CODE);

    return h;

  }



  function desktopHref() {

    if (hasFriendsAccess()) return "./?stay=1&hub=friends";

    return "./?stay=1";

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

      '<a class="ds-btn' + (current === "phone" ? " on" : "") + '" href="./phone.html?v=2&stay=1' + (current === "friends" ? "&hub=friends" : "") + '" title="Телефон">📱</a>' +

      '<a class="ds-btn' + (current === "tablet" ? " on" : "") + '" href="./tablet.html?v=1&stay=1' + (current === "friends" ? "&hub=friends" : "") + '" title="Планшет">📟</a>' +

      '<a class="ds-btn' + (current === "desktop" ? " on" : "") + '" href="' + desktopHref() + '" title="Компьютер">💻</a>' +

      (hasFriendsAccess()

        ? '<a class="ds-btn' + (current === "friends" ? " on" : "") + '" href="' + friendsHref() + '" title="Друзья">⭐</a>'

        : "") +

      '<span class="ds-hint">' + (global.AmalDevice ? AmalDevice.icon(dev) : "💻") + "</span>";



    root.appendChild(el);

  }



  global.AmalDeviceSwitcher = { mount: mount, hasFriendsAccess: hasFriendsAccess };

})(window);

