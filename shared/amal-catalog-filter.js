/**
 * Витрина каталога: в списке только лучшие игры.
 * Остальные скрыты (не видны, не крутятся в ленте).
 * Хозяин: ?all=1 или кнопка «Показать все» / localStorage amal-catalog-show-all-v1=1
 */
(function (global) {
  "use strict";

  var SHOW_ALL_KEY = "amal-catalog-show-all-v1";

  /** Что видно в витрине (короткий список) */
  var SHOWCASE = [
    "animal-hospital",
    "bed-wars",
    "blockbust",
    "blockbust-normal",
    "snake-game",
    "create-lab",
    "emo-friend",
    "milashki",
    "youtube-free",
    "iskra",
    "sky-crystal",
    "versions",
    "v1",
    "v2",
    "my-links",
    "friends",
    "hits",
    "zombie-vs-plants",
    "obby",
    "work-pizza",
    "escape-tsunami",
    "kick-buddy",
    "minecraft",
  ];

  /** По умолчанию полный каталог. Короткая витрина: ?all=0 или localStorage = "0" */
  function showAll() {
    try {
      var q = new URLSearchParams(location.search).get("all");
      if (q === "0") return false;
      if (q === "1") return true;
      if (localStorage.getItem(SHOW_ALL_KEY) === "0") return false;
    } catch (_) {}
    return true;
  }

  function setShowAll(on) {
    try {
      localStorage.setItem(SHOW_ALL_KEY, on ? "1" : "0");
    } catch (_) {}
  }

  function pathAllowed(href) {
    if (!href || href === "#" || href.indexOf("javascript:") === 0) return true;
    var h = String(href).toLowerCase();
    if (h.charAt(0) === "?" || h === "./" || h === "/" || h === "../") return true;
    for (var i = 0; i < SHOWCASE.length; i++) {
      if (h.indexOf(SHOWCASE[i]) !== -1) return true;
    }
    return false;
  }

  function filterList(list) {
    if (showAll() || !list) return list || [];
    return list.filter(function (g) {
      return pathAllowed(g.path || g.href || "");
    });
  }

  function hideIndexCards() {
    if (showAll()) return;
    var cards = document.querySelectorAll(
      "a.card, a.game-card, #hubQuickLinks a, .hub-quick-links a"
    );
    cards.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (!pathAllowed(href)) {
        a.style.display = "none";
        a.setAttribute("data-amal-hidden", "1");
      }
    });
    // спрятать пустые секции
    document.querySelectorAll(".grid").forEach(function (grid) {
      var visible = 0;
      grid.querySelectorAll("a.card, a.game-card").forEach(function (a) {
        if (a.getAttribute("data-amal-hidden") !== "1" && a.style.display !== "none") visible++;
      });
      if (!visible) {
        grid.style.display = "none";
        var prev = grid.previousElementSibling;
        if (prev && (prev.classList.contains("section-title") || prev.tagName === "P")) {
          prev.style.display = "none";
          prev.setAttribute("data-amal-hidden", "1");
        }
      }
    });
  }

  function mountToggle() {
    if (document.getElementById("amal-catalog-toggle")) return;
    var owner = false;
    try {
      owner =
        (global.AmalOwnerSession && AmalOwnerSession.isOwner && AmalOwnerSession.isOwner()) ||
        localStorage.getItem("amal-owner-v3") === "1" ||
        localStorage.getItem("amal-owner-v2") === "1";
    } catch (_) {}
    if (!owner && !showAll()) return;
    var btn = document.createElement("button");
    btn.id = "amal-catalog-toggle";
    btn.type = "button";
    btn.textContent = showAll() ? "Каталог: коротко" : "Показать все игры";
    btn.style.cssText =
      "position:fixed;left:12px;bottom:12px;z-index:99950;border:0;border-radius:12px;" +
      "padding:10px 12px;font:900 12px Nunito,Segoe UI,sans-serif;cursor:pointer;" +
      "background:#0f172a;color:#e2e8f0;border:2px solid #38bdf8;box-shadow:0 8px 24px #0008";
    btn.onclick = function () {
      setShowAll(!showAll());
      location.reload();
    };
    document.body.appendChild(btn);
  }

  function applyHubData() {
    var d = global.AmalHubData;
    if (!d || showAll()) return;
    d.GAMES_2D = filterList(d.GAMES_2D);
    d.GAMES_3D = filterList(d.GAMES_3D);
    d.MILA = filterList(d.MILA);
    d.EXCLUSIVE = filterList(d.EXCLUSIVE);
  }

  global.AmalCatalog = {
    SHOWCASE: SHOWCASE,
    showAll: showAll,
    setShowAll: setShowAll,
    pathAllowed: pathAllowed,
    filterList: filterList,
    hideIndexCards: hideIndexCards,
    applyHubData: applyHubData,
    mountToggle: mountToggle,
  };

  function boot() {
    applyHubData();
    hideIndexCards();
    mountToggle();
    try {
      if (typeof global.__amalRefreshCatalogStats === "function") {
        global.__amalRefreshCatalogStats();
      }
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
