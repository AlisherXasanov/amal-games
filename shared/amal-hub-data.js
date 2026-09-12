/**
 * Общие данные и UI для phone / tablet / friends.
 */
(function (global) {
  "use strict";

  var GAMES_2D = [
    { ico: "🦸", name: "Прыг-Герой", path: "platform-hero/?v=2", note: "Kenney 2D · боссы · Ишка · дабл-прыг" },
    { ico: "🧪", name: "Мозг в колбе", path: "brain-jar/?v=1", note: "лаба · Ишка · колба в трубу" },
    { ico: "🌹", name: "Расслаб · песни", path: "relax-songs/?v=4", note: "Black Rose · Minecraft · YouTube" },
    { ico: "🥥", name: "Кокос", path: "coconut/?v=1", note: "реализм · скилл · пальма" },
    { ico: "🌊", name: "Escape Tsunami", path: "escape-tsunami/?v=4", note: "бег от волны" },
    { ico: "🍕", name: "Пиццерия", path: "work-pizza/?v=3", note: "Pizza Place" },
    { ico: "🐍", name: "Snake", path: "snake-game/", note: "змейка" },
    { ico: "🐾", name: "Animal Hospital", path: "animal-hospital/", note: "больница" },
    { ico: "🌿", name: "Relax Zone", path: "relax-zone/?v=4", note: "антистресс" },
    { ico: "🥊", name: "Kick Buddy", path: "kick-buddy/", note: "кукла" },
    { ico: "🧟", name: "Зомби vs растения", path: "zombie-vs-plants/", note: "полная" },
    { ico: "🧗", name: "Obby", path: "obby/", note: "полоса" },
  ];

  var GAMES_3D = [
    { ico: "🏕️", name: "Лагерь Kenney", path: "nature-camp/?v=1", note: "Nature Kit · палатки" },
    { ico: "🛶", name: "Река Kenney", path: "nature-river/?v=1", note: "Nature Kit · каноэ" },
    { ico: "🍂", name: "Осень Kenney", path: "nature-fall/?v=1", note: "Nature Kit · грибы" },
    { ico: "💎", name: "Небесный кристалл", path: "sky-crystal/", note: "новая 3D · острова" },
    { ico: "🛏️", name: "Bed Wars", path: "bed-wars/", note: "3D команда" },
    { ico: "⛏️", name: "CraftWorld", path: "minecraft/", note: "майнкрафт" },
    { ico: "🌀", name: "Portal 3D", path: "portal-3d/", note: "порталы" },
    { ico: "🌍", name: "Globe Battle", path: "globe-battle/", note: "глобус" },
    { ico: "⭐", name: "Bravol Stars", path: "bravol-stars/", note: "3D бой" },
    { ico: "🧱", name: "Blockbust", path: "blockbust/", note: "блоки" },
  ];

  var MILA = [
    { ico: "🐣", name: "Милашки v7", path: "milashki/?v=7", note: "6 миров · 42 вида" },
  ];

  var EXCLUSIVE = [
    { ico: "🤖", name: "Робот Эмо", path: "emo-friend/?v=3", note: "игры здесь · микрофон · 3D" },
    { ico: "🦸", name: "Прыг-Герой", path: "platform-hero/?v=2", note: "боссы · Ишка · дабл-прыг" },
    { ico: "🧪", name: "Мозг в колбе", path: "brain-jar/?v=1", note: "Ишка · колба · лаба" },
    { ico: "🏕️", name: "Лагерь Kenney", path: "nature-camp/?v=1", note: "Nature Kit · палатки · дрова" },
    { ico: "🛶", name: "Река Kenney", path: "nature-river/?v=1", note: "Nature Kit · каноэ · лилии" },
    { ico: "🍂", name: "Осень Kenney", path: "nature-fall/?v=1", note: "Nature Kit · грибы · fall" },
    { ico: "🎯", name: "Шарик и кольца", path: "ring-ball/?v=1", note: "дыры · прокачка · 20 ур." },
    { ico: "🎮", name: "Icon Tycoon 2D", path: "icon-tycoon/?v=1", note: "иконки · яйца · GUI как itch" },
    { ico: "🧱", name: "Stud Park", path: "stud-park/?v=1", note: "Roblox-стадды · тайкун" },
    { ico: "🌲", name: "Тайга · Тайгун", path: "taiga-tycoon/?v=1", note: "3D тайга · дерево прокачки" },
    { ico: "🥚", name: "Укради яйцо", path: "steal-egg/play3d.html?v=8", note: "сейф + рынок ботов v8" },
    { ico: "🧠", name: "Steal a Brainrot", path: "steal-brainrot/", note: "воруй брейнротов · 3D" },
    { ico: "💎", name: "Небесный кристалл", path: "sky-crystal/", note: "новая 3D · острова" },
    { ico: "🔥", name: "Хиты · папка", path: "hits/", note: "хиты + умный" },
    { ico: "🍕", name: "Пиццерия", path: "work-pizza/?v=3", note: "Pizza Place" },
    { ico: "🌊", name: "Escape Tsunami", path: "escape-tsunami/?v=4", note: "бег от волны" },
    { ico: "🧗", name: "Obby", path: "obby/", note: "полоса" },
    { ico: "🐣", name: "Милашки v7", path: "milashki/?v=7", note: "6 миров · 42 вида" },
    { ico: "▶", name: "Смотри · Ютуб", path: "youtube-free/?v=46&from=friends", note: "нормальный просмотр" },
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

      var gamesList = AmalHubData.GAMES_2D;
      if (global.AmalCatalog && AmalCatalog.filterList) {
        gamesList = AmalCatalog.filterList(gamesList);
      }
      if (from === "friends") {
        var xPaths = {};
        var exclusiveList = AmalHubData.EXCLUSIVE;
        if (global.AmalCatalog && AmalCatalog.filterList) {
          exclusiveList = AmalCatalog.filterList(exclusiveList);
        }
        exclusiveList.forEach(function (g) {
          xPaths[g.path.split("?")[0]] = true;
        });
        gamesList = gamesList.filter(function (g) {
          return !xPaths[g.path.split("?")[0]];
        });
      }
      var milaList = AmalHubData.MILA;
      var d3List = AmalHubData.GAMES_3D;
      var exclList = AmalHubData.EXCLUSIVE;
      if (global.AmalCatalog && AmalCatalog.filterList) {
        milaList = AmalCatalog.filterList(milaList);
        d3List = AmalCatalog.filterList(d3List);
        exclList = AmalCatalog.filterList(exclList);
      }
      fillGrid("list-games", gamesList, { from: from });
      fillGrid("list-mila", milaList, { from: from });
      fillGrid("list-d3", d3List, { from: from, locked: !d3Playable && from === "phone" });
      fillGrid("list-exclusive", exclList, { from: from, exclusive: true });

      var search = $("search-games");
      if (search) {
        search.addEventListener("input", function (e) {
          var q = e.target.value.toLowerCase();
          fillGrid("list-games", gamesList.filter(function (g) {
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
