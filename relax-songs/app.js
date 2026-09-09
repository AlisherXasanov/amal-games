(() => {
  const extra = [
    {
      title: "Black Rose",
      artist: "расслабляющая · поиск в Яндексе",
      ico: "🌹",
      q: "Black Rose chill",
    },
    {
      title: "Wet Hands",
      artist: "Minecraft · C418",
      ico: "🎹",
      q: "C418 Wet Hands",
    },
    {
      title: "Minecraft Volume Alpha",
      artist: "саундтрек Minecraft",
      ico: "⛏️",
      q: "Minecraft Volume Alpha C418",
    },
    {
      title: "Haggstrom",
      artist: "Minecraft · спокойная",
      ico: "🌿",
      q: "C418 Haggstrom",
    },
  ];

  function yandex(q) {
    return "https://music.yandex.ru/search?text=" + encodeURIComponent(q);
  }

  const box = document.getElementById("list");
  extra.forEach((item) => {
    const a = document.createElement("a");
    a.className = "song";
    a.href = yandex(item.q);
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML =
      '<div class="ico">' +
      item.ico +
      "</div>" +
      '<div class="meta"><strong></strong><span></span></div>' +
      '<div class="go">Яндекс →</div>';
    a.querySelector("strong").textContent = item.title;
    a.querySelector("span").textContent = item.artist;
    box.appendChild(a);
  });
})();
