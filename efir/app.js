(function () {
  "use strict";

  /** Прямые MP4 — без iframe и без рекламных вставок в плеере. */
  var LIBRARY = [
    {
      id: "bbb",
      title: "Big Buck Bunny",
      meta: "короткий мульт · демо",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
    },
    {
      id: "elephants",
      title: "Elephants Dream",
      meta: "короткий фильм · демо",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg"
    },
    {
      id: "sintel",
      title: "Sintel",
      meta: "короткий фильм · демо",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg"
    },
    {
      id: "tears",
      title: "Tears of Steel",
      meta: "короткий фильм · демо",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg"
    }
  ];

  var player = document.getElementById("player");
  var empty = document.getElementById("empty");
  var shelf = document.getElementById("shelf");
  var now = document.getElementById("now");
  var fileIn = document.getElementById("fileIn");
  var activeId = null;
  var localUrl = null;

  function setEmpty(on) {
    if (empty) empty.classList.toggle("hide", !on);
    if (player) player.dataset.empty = on ? "1" : "0";
  }

  function playSrc(src, title, id) {
    if (localUrl) {
      try { URL.revokeObjectURL(localUrl); } catch (_) {}
      localUrl = null;
    }
    activeId = id || null;
    player.src = src;
    player.load();
    setEmpty(false);
    var p = player.play();
    if (p && p.catch) p.catch(function () {});
    if (now) now.textContent = "Сейчас: " + (title || "ролик");
    Array.prototype.forEach.call(shelf.querySelectorAll(".card"), function (btn) {
      btn.classList.toggle("active", btn.dataset.id === activeId);
    });
  }

  function renderShelf() {
    shelf.innerHTML = "";
    LIBRARY.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.dataset.id = item.id;
      btn.setAttribute("role", "listitem");
      btn.innerHTML =
        '<img class="thumb" alt="" loading="lazy" src="' + item.thumb + '" />' +
        "<div><strong>" + item.title + "</strong><span>" + item.meta + "</span></div>";
      btn.addEventListener("click", function () {
        playSrc(item.src, item.title, item.id);
      });
      shelf.appendChild(btn);
    });
  }

  if (fileIn) {
    fileIn.addEventListener("change", function () {
      var file = fileIn.files && fileIn.files[0];
      if (!file) return;
      if (localUrl) {
        try { URL.revokeObjectURL(localUrl); } catch (_) {}
      }
      localUrl = URL.createObjectURL(file);
      playSrc(localUrl, file.name || "свой файл", "local");
      fileIn.value = "";
    });
  }

  setEmpty(true);
  renderShelf();
})();
