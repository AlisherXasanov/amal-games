/**
 * Смотри без рекламы — умный поиск YouTube по блогерам и темам.
 * Честно: не взламываем YouTube, а быстро находим нужное видео.
 */
(function () {
  window.__AMAL_NO_WORLD__ = true;

  /** Подборки: поиск + известные ролики (публичные embed) */
  const TOPICS = [
    {
      id: "sakvashin",
      name: "Саквашин",
      emoji: "🎮",
      keys: ["саквашин", "sakvashin", "sakva", "саква"],
      search: "Саквашин",
      videos: [{ id: "search", title: "Смотреть Саквашина", searchOnly: true }],
      blurb: "Саквашин — игровые ролики и приключения. Вот что могу включить:",
    },
    {
      id: "vlada4",
      name: "Vlad A4",
      emoji: "🔥",
      keys: ["vlad", "влад", "a4", "а4", "vlada", "влада 4", "vlad a4"],
      search: "Vlad A4",
      videos: [{ id: "search", title: "Лучшее Vlad A4", searchOnly: true }],
      blurb: "Vlad A4 — челленджи и безумные эксперименты:",
    },
    {
      id: "mrbeast",
      name: "MrBeast",
      emoji: "💰",
      keys: ["mrbeast", "мистер", "бист", "mr beast", "мрбист"],
      search: "MrBeast русская озвучка",
      videos: [{ id: "search", title: "MrBeast — популярное", searchOnly: true }],
      blurb: "MrBeast — большие челленджи и призы:",
    },
    {
      id: "gravity",
      name: "Gravity Falls",
      emoji: "🌲",
      keys: ["gravity", "гравити", "фолз", "falls", "гравити фолз", "гравити фолс"],
      search: "Gravity Falls русская озвучка",
      videos: [{ id: "search", title: "Gravity Falls — серии", searchOnly: true }],
      blurb: "Gravity Falls — ждём новые серии? Пока вот классика:",
    },
    {
      id: "meme",
      name: "Мемы и Shorts",
      emoji: "😂",
      keys: ["мем", "shorts", "шorts", "прикол", "смешн"],
      search: "youtube shorts смешные русские",
      videos: [{ id: "search", title: "Shorts подборка", searchOnly: true }],
      blurb: "Короткие ролики — быстро, без долгого поиска:",
    },
    {
      id: "minecraft",
      name: "Minecraft",
      emoji: "⛏️",
      keys: ["minecraft", "майн", "майнкрафт", "крафт"],
      search: "Minecraft русский let's play",
      videos: [{ id: "search", title: "Minecraft LP", searchOnly: true }],
      blurb: "Minecraft — выживание и постройки:",
    },
  ];

  const logEl = document.getElementById("chatLog");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatIn");
  const playerBox = document.getElementById("playerBox");
  const placeholder = document.getElementById("placeholder");
  const nowPlaying = document.getElementById("nowPlaying");
  const chipsEl = document.getElementById("quickChips");

  function ytSearchUrl(q) {
    return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  }

  function ytEmbedUrl(id) {
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?rel=0&modestbranding=1";
  }

  function addMsg(text, role, actions) {
    const d = document.createElement("div");
    d.className = "msg " + role;
    d.innerHTML = text;
    if (actions && actions.length) {
      const acts = document.createElement("div");
      acts.className = "acts";
      actions.forEach((a) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = a.label;
        b.addEventListener("click", a.onClick);
        acts.appendChild(b);
      });
      d.appendChild(acts);
    }
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function playVideo(id, title, searchFallback) {
    if (!id || id === "search") {
      if (searchFallback) window.open(ytSearchUrl(searchFallback), "_blank", "noopener");
      nowPlaying.textContent = "Поиск на YouTube: " + (searchFallback || title);
      return;
    }
    placeholder.style.display = "none";
    let iframe = playerBox.querySelector("iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.title = title || "YouTube";
      playerBox.appendChild(iframe);
    }
    iframe.src = ytEmbedUrl(id);
    nowPlaying.textContent = "Сейчас: " + (title || id);
  }

  function openTopic(topic) {
    addMsg(
      topic.emoji + " <b>" + topic.name + "</b><br>" + topic.blurb,
      "bot",
      topic.videos.map((v, i) => ({
        label: v.title || topic.name + " " + (i + 1),
        onClick: () => {
          if (v.searchOnly) {
            playVideo("search", v.title, topic.search);
            addMsg("Открываю поиск «" + topic.search + "» на YouTube.", "bot");
          } else {
            playVideo(v.id, v.title, topic.search);
          }
        },
      })).concat([
        {
          label: "🔍 Все видео «" + topic.search + "»",
          onClick: () => window.open(ytSearchUrl(topic.search), "_blank", "noopener"),
        },
      ])
    );
  }

  function matchTopic(text) {
    const t = text.toLowerCase();
    let best = null;
    let score = 0;
    for (let i = 0; i < TOPICS.length; i++) {
      const topic = TOPICS[i];
      for (let k = 0; k < topic.keys.length; k++) {
        if (t.indexOf(topic.keys[k]) !== -1) {
          const s = topic.keys[k].length;
          if (s > score) {
            score = s;
            best = topic;
          }
        }
      }
    }
    return best;
  }

  function replyToUser(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    addMsg(trimmed.replace(/</g, "&lt;"), "user");

    const topic = matchTopic(trimmed);

    if (/привет|здрав|хай|hello/i.test(trimmed)) {
      addMsg(
        "Привет! 👋 Я помощник <b>Смотри без рекламы</b>.<br>Напиши, кого смотреть: <b>Саквашин</b>, <b>Vlad A4</b>, <b>MrBeast</b>, <b>Gravity Falls</b> — или любую другую тему.",
        "bot"
      );
      return;
    }

    if (/реклам|premium|премиум|без реклам/i.test(trimmed)) {
      addMsg(
        "Честно: полностью убрать рекламу внутри YouTube может только <b>YouTube Premium</b> (платно).<br><br>" +
          "Это приложение <b>бесплатное</b>: ты пишешь — я сразу нахожу нужного блогера или тему, без долгого листания и лишних кликов.",
        "bot",
        [
          {
            label: "YouTube Premium",
            onClick: () => window.open("https://www.youtube.com/premium", "_blank", "noopener"),
          },
        ]
      );
      return;
    }

    if (topic) {
      openTopic(topic);
      return;
    }

    // произвольный запрос — поиск
    const q = trimmed.replace(/^(хочу|покажи|найди|смотреть|про|посмотреть)\s+/gi, "").trim() || trimmed;
    addMsg(
      "Ищу на YouTube: <b>" + q.replace(/</g, "&lt;") + "</b><br>Можешь уточнить блогера — я знаю Саквашина, Vlad A4, MrBeast, Gravity Falls и других.",
      "bot",
      [
        {
          label: "▶ Искать «" + q.slice(0, 28) + "»",
          onClick: () => {
            window.open(ytSearchUrl(q), "_blank", "noopener");
            nowPlaying.textContent = "Поиск: " + q;
          },
        },
      ]
    );
  }

  // быстрые кнопки
  TOPICS.forEach((topic) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = topic.emoji + " " + topic.name;
    b.addEventListener("click", () => {
      openTopic(topic);
      input.value = topic.name;
    });
    chipsEl.appendChild(b);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    replyToUser(input.value);
    input.value = "";
  });

  // PWA install
  let deferredPrompt = null;
  const installBtn = document.getElementById("installBtn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  addMsg(
    "Я <b>нейросеть-помощник Amal</b> 🤖<br>" +
      "Напиши, что хочешь посмотреть — например:<br>«<i>про Саквашина</i>», «<i>Gravity Falls</i>», «<i>Vlad A4</i>», «<i>MrBeast</i>».",
    "bot"
  );
})();
