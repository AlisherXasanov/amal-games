(() => {
  const frame = document.getElementById("frame");
  const nowTitle = document.getElementById("nowTitle");

  const extra = [
    {
      title: "Wet Hands",
      artist: "Minecraft · C418",
      ico: "🎹",
      yt: "mSiHNXWGZqM",
      q: "C418 Wet Hands",
    },
    {
      title: "Minecraft Volume Alpha",
      artist: "саундтрек · поиск",
      ico: "⛏️",
      yt: "",
      q: "Minecraft Volume Alpha C418",
    },
    {
      title: "Haggstrom",
      artist: "Minecraft · спокойная",
      ico: "🌿",
      yt: "KAhWLb3tO2Q",
      q: "C418 Haggstrom",
    },
    {
      title: "Black Rose · ещё варианты",
      artist: "поиск на YouTube",
      ico: "🌹",
      yt: "",
      q: "Black Rose relaxing chill music",
    },
  ];

  function ytSearch(q) {
    return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  }

  function play(id, title, searchQ) {
    nowTitle.textContent = title || "Играет…";
    if (id) {
      frame.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' +
        encodeURIComponent(id) +
        '?autoplay=1&rel=0" title="player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
      return;
    }
    const q = searchQ || title || "relaxing music";
    const url = ytSearch(q);
    frame.innerHTML =
      '<p class="placeholder">Яндекс недоступен — открываем YouTube.<br><a href="' +
      url +
      '" target="_blank" rel="noopener">Слушать «' +
      (title || q) +
      '» →</a></p>';
    window.open(url, "_blank", "noopener");
  }

  document.querySelectorAll(".hero").forEach((btn) => {
    btn.addEventListener("click", () => {
      play(
        btn.getAttribute("data-yt") || "",
        btn.getAttribute("data-title"),
        btn.getAttribute("data-q") || ""
      );
    });
  });

  const box = document.getElementById("list");
  extra.forEach((item) => {
    const a = document.createElement("button");
    a.type = "button";
    a.className = "song";
    a.innerHTML =
      '<div class="ico">' +
      item.ico +
      "</div>" +
      '<div class="meta"><strong></strong><span></span></div>' +
      '<div class="go">▶</div>';
    a.querySelector("strong").textContent = item.title;
    a.querySelector("span").textContent = item.artist;
    a.addEventListener("click", () => play(item.yt, item.title + " · " + item.artist, item.q));
    box.appendChild(a);
  });
})();
