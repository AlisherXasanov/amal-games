/**
 * Общие данные и UI для phone / tablet / friends.
 */
(function (global) {
  "use strict";

  var GAMES_2D = [
    { ico: "🐣", name: "Милашки v7", path: "milashki/?v=7", note: "6 миров · 42 вида" },
    { ico: "🌊", name: "Escape Tsunami", path: "escape-tsunami/?v=4", note: "бег от волны" },
    { ico: "🍕", name: "Пиццерия", path: "work-pizza/?v=3", note: "Pizza Place" },
    { ico: "🐍", name: "Snake", path: "snake-game/", note: "змейка" },
    { ico: "🐾", name: "Animal Hospital", path: "animal-hospital/", note: "больница" },
    { ico: "🌿", name: "Relax Zone", path: "relax-zone/?v=4", note: "антистресс" },
    { ico: "🥊", name: "Kick Buddy", path: "kick-buddy/", note: "кукла" },
    { ico: "🏠", name: "Желейная хата", path: "jelly-lab/", note: "Валера" },
    { ico: "🧟", name: "Зомби vs растения", path: "zombie-vs-plants/", note: "полная" },
    { ico: "🕯️", name: "Свеча в шахте", path: "candle-mine/", note: "кликер" },
    { ico: "🍲", name: "Котёл и молот", path: "pot-hammer/", note: "варка" },
    { ico: "🧗", name: "Obby", path: "obby/", note: "полоса" },
    { ico: "🌱", name: "Grow Garden", path: "grow-garden/", note: "сад" },
    { ico: "🐕", name: "Pet Simulator", path: "pet-simulator/", note: "питомцы" },
    { ico: "🏰", name: "Tower Defense", path: "tower-defense/", note: "башни" },
    { ico: "🏭", name: "Tycoon", path: "tycoon/", note: "фабрика" },
    { ico: "🥚", name: "Steal Egg", path: "steal-egg/", note: "яйца" },
    { ico: "🧠", name: "Steal Brainrot", path: "steal-brainrot/", note: "мемы" },
    { ico: "🕵️", name: "Невидимый шпион", path: "invisible-spy/", note: "плащ · фабрика конфет" },
    { ico: "🏃", name: "Speed Escape", path: "speed-escape/", note: "побег" },
  ];

  var GAMES_3D = [
    { ico: "🛏️", name: "Bed Wars", path: "bed-wars/", note: "3D команда" },
    { ico: "⛏️", name: "CraftWorld", path: "minecraft/", note: "майнкрафт" },
    { ico: "🧊", name: "3D Lab", path: "create-lab/lab3d.html", note: "лаборатория" },
    { ico: "🎬", name: "Studio 3D", path: "create-lab/studio3d.html", note: "студия" },
    { ico: "🌀", name: "Portal 3D", path: "portal-3d/", note: "порталы" },
    { ico: "🌍", name: "Globe Battle", path: "globe-battle/", note: "глобус" },
    { ico: "⭐", name: "Bravol Stars", path: "bravol-stars/", note: "3D бой" },
    { ico: "🧱", name: "Blockbust", path: "blockbust/", note: "блоки" },
    { ico: "🌌", name: "Шторм Разломов", path: "rift-storm/", note: "космос" },
  ];

  var MILA = [
    { ico: "🐣", name: "Милашки v7", path: "milashki/?v=7", note: "6 миров · 42 вида" },
  ];

  var EXCLUSIVE = [
    { ico: "✦", name: "Мы с тобой", path: "we-two/", note: "⭐ секрет · только друзья" },
    { ico: "🎬", name: "Мульт-эфир", path: "efir/", note: "эфир" },
    { ico: "🎨", name: "Полка Валеры", path: "mult-studio/", note: "свои мульты" },
    { ico: "✨", name: "Создать игру", path: "create-lab/game.html", note: "новая · раньше всех" },
    { ico: "🌙", name: "Secret Dream", path: "secret-dream/", note: "тайна" },
    { ico: "🧠", name: "Steal Brainrot+", path: "steal-brainrot/", note: "ранний доступ" },
    { ico: "🌱", name: "Grow Garden+", path: "grow-garden/", note: "эксклюзив сад" },
    { ico: "🎁", name: "Joy Surprise", path: "joy-surprise/", note: "сюрприз" },
    { ico: "🏫", name: "Клуб друзей", path: "school-party/?v=9", note: "чат · настолки · смешное" },
  ];

  global.AmalHubData = {
    GAMES_2D: GAMES_2D,
    GAMES_3D: GAMES_3D,
    MILA: MILA,
    EXCLUSIVE: EXCLUSIVE,
  };

  function $(id) { return document.getElementById(id); }

  function card(g, opts) {
    opts = opts || {};
    var locked = !!opts.locked;
    var el = document.createElement(locked ? "div" : "a");
    el.className = "game-card" + (opts.exclusive ? " exclusive" : "") + (locked ? " locked" : "");
    if (!locked) el.href = g.path + (g.path.indexOf("?") >= 0 ? "&" : "?") + "from=" + (opts.from || "phone");
    el.innerHTML =
      '<span class="ico">' + g.ico + "</span>" +
      "<span class=\"name\">" + g.name + "</span>" +
      "<small>" + g.note + "</small>" +
      (opts.exclusive ? '<span class="x-badge">⭐ ЭКСКЛЮЗИВ</span>' : "") +
      (locked ? '<span class="x-badge lock">🔒</span>' : "");
    return el;
  }

  function fillGrid(id, list, opts) {
    var box = $(id);
    if (!box) return;
    box.innerHTML = "";
    list.forEach(function (g) { box.appendChild(card(g, opts)); });
  }

  function showTab(id) {
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("on"); });
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("on"); });
    var p = $("panel-" + id);
    var t = document.querySelector('.tab[data-tab="' + id + '"]');
    if (p) p.classList.add("on");
    if (t) t.classList.add("on");
    if (id === "chat" && !global.__chatMounted && global.AmalClassChat) {
      global.__chatMounted = true;
      AmalClassChat.mount("chat-root");
    }
    try { sessionStorage.setItem("amal-hub-tab", id); } catch (_) {}
  }

  global.AmalHubUI = {
    init: function (opts) {
      opts = opts || {};
      var from = opts.from || "phone";
      var d3Playable = !!opts.d3Playable;
      var tag = $("device-tag");
      if (tag && global.AmalDevice) {
        tag.textContent = AmalDevice.label(AmalDevice.detect()) + " · версия для " +
          (from === "tablet" ? "планшета" : from === "friends" ? "друзей" : "телефона");
      }

      fillGrid("list-games", AmalHubData.GAMES_2D, { from: from });
      fillGrid("list-mila", AmalHubData.MILA, { from: from });
      fillGrid("list-d3", AmalHubData.GAMES_3D, { from: from, locked: !d3Playable && from === "phone" });
      fillGrid("list-exclusive", AmalHubData.EXCLUSIVE, { from: from, exclusive: true });

      var search = $("search-games");
      if (search) {
        search.addEventListener("input", function (e) {
          var q = e.target.value.toLowerCase();
          fillGrid("list-games", AmalHubData.GAMES_2D.filter(function (g) {
            return !q || g.name.toLowerCase().indexOf(q) >= 0;
          }), { from: from });
        });
      }

      var tabs = $("tabs");
      if (tabs) {
        tabs.addEventListener("click", function (e) {
          var b = e.target.closest(".tab");
          if (b) showTab(b.getAttribute("data-tab"));
        });
      }

      document.querySelectorAll(".cat-btn[data-go]").forEach(function (b) {
        b.addEventListener("click", function () { showTab(b.getAttribute("data-go")); });
      });

      try {
        var saved = sessionStorage.getItem("amal-hub-tab");
        if (saved && $("panel-" + saved)) showTab(saved);
      } catch (_) {}
    },
  };
})(window);
