(() => {
  const KEY = "amal-vika-songs-mine-v1";

  const curated = [
    {
      title: "Я хочу тебя",
      artist: "Vika Gromik",
      ico: "💛",
      q: "Vika Gromik Я хочу тебя",
    },
    {
      title: "Vika Gromik — все песни",
      artist: "открыть артиста в Яндексе",
      ico: "🎤",
      q: "Vika Gromik",
    },
    {
      title: "Вика",
      artist: "Корни",
      ico: "🌧️",
      q: "Корни Вика",
    },
    {
      title: "Поиск: Вика",
      artist: "найти в Яндекс Музыке",
      ico: "🔎",
      q: "Вика",
    },
  ];

  function yandex(q) {
    return "https://music.yandex.ru/search?text=" + encodeURIComponent(q);
  }

  function loadMine() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]") || [];
    } catch (_) {
      return [];
    }
  }

  function saveMine(arr) {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  function card(item, opts) {
    opts = opts || {};
    const a = document.createElement("a");
    a.className = "song";
    a.href = yandex(item.q || item.title);
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML =
      '<div class="ico">' +
      (item.ico || "🎵") +
      "</div>" +
      '<div class="meta"><strong></strong><span></span></div>' +
      '<div class="go">Яндекс →</div>';
    a.querySelector("strong").textContent = item.title;
    a.querySelector("span").textContent = item.artist || "моя полка";
    if (opts.onRemove) {
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "rm";
      rm.textContent = "✕";
      rm.title = "Убрать";
      rm.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        opts.onRemove();
      });
      a.appendChild(rm);
      a.style.gridTemplateColumns = "auto 1fr auto auto";
    }
    return a;
  }

  function renderCurated() {
    const box = document.getElementById("list");
    box.innerHTML = "";
    curated.forEach((s) => box.appendChild(card(s)));
  }

  function renderMine() {
    const box = document.getElementById("mine");
    box.innerHTML = "";
    const mine = loadMine();
    if (!mine.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Пока пусто — напиши песню выше, если что-то особенно нравится.";
      box.appendChild(p);
      return;
    }
    mine.forEach((s, i) => {
      box.appendChild(
        card(s, {
          onRemove: () => {
            const next = loadMine().filter((_, j) => j !== i);
            saveMine(next);
            renderMine();
          },
        })
      );
    });
  }

  document.getElementById("addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("songTitle");
    const title = (input.value || "").trim();
    if (!title) return;
    const mine = loadMine();
    mine.unshift({
      title,
      artist: "Vika · моя полка",
      ico: "⭐",
      q: "Vika Gromik " + title,
    });
    saveMine(mine.slice(0, 40));
    input.value = "";
    renderMine();
  });

  renderCurated();
  renderMine();
})();
