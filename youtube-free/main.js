/**
 * Смотри v3 — лента, лайки, подписки, каналы, реальные видео внутри (без ухода).
 */
(function () {
  window.__AMAL_NO_WORLD__ = true;

  const CHANNELS = window.YT_CHANNELS || [];
  const SUB_KEY = "amal-watch-subs-v1";
  const LIKE_KEY = "amal-watch-likes-v1";

  const viewHome = document.getElementById("viewHome");
  const viewChannel = document.getElementById("viewChannel");
  const btnHome = document.getElementById("btnHome");
  const channelShelf = document.getElementById("channelShelf");
  const feed = document.getElementById("feed");
  const shortsRow = document.getElementById("shortsRow");
  const tvPreview = document.getElementById("tvPreview");
  const tvHint = document.getElementById("tvHint");
  const channelHead = document.getElementById("channelHead");
  const videoGrid = document.getElementById("videoGrid");
  const uploadBox = document.getElementById("uploadBox");
  const fileIn = document.getElementById("fileIn");
  const playerPh = document.getElementById("playerPh");
  const ytFrame = document.getElementById("ytFrame");
  const localVideo = document.getElementById("localVideo");
  const nowPlaying = document.getElementById("nowPlaying");
  const likeBtn = document.getElementById("likeBtn");
  const likeCount = document.getElementById("likeCount");
  const subsStat = document.getElementById("subsStat");
  const subBtn = document.getElementById("subBtn");

  let currentChannel = null;
  let currentVideoKey = "";
  let myVideos = [];
  let liked = loadMap(LIKE_KEY);
  let subs = loadMap(SUB_KEY);

  function loadMap(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (_) {
      return {};
    }
  }

  function saveMap(key, obj) {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (_) {}
  }

  function findChannel(id) {
    return CHANNELS.find((c) => c.id === id);
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  /** Реальные ролики YouTube внутри iframe — поиск-плейлист, без перехода */
  function searchEmbed(q) {
    return (
      "https://www.youtube-nocookie.com/embed?listType=search&list=" +
      encodeURIComponent(q) +
      "&autoplay=1&rel=0"
    );
  }

  function stopPlayers() {
    ytFrame.hidden = true;
    ytFrame.src = "";
    localVideo.hidden = true;
    localVideo.pause();
    localVideo.removeAttribute("src");
    try {
      localVideo.load();
    } catch (_) {}
    playerPh.hidden = false;
  }

  function setTvPreview(src) {
    if (!src) {
      tvPreview.innerHTML = "<span>📺 Выбери видео ниже</span>";
      return;
    }
    tvPreview.innerHTML =
      '<iframe src="' +
      src +
      '" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>';
  }

  function playSearch(q, title, opts) {
    opts = opts || {};
    const src = searchEmbed(q);
    stopPlayers();
    playerPh.hidden = true;
    ytFrame.hidden = false;
    ytFrame.src = src;
    if (opts.alsoTv) setTvPreview(src);
    nowPlaying.textContent = "Сейчас: " + title;
    tvHint.textContent = "▶ " + title;
    currentVideoKey = (opts.channelId || "") + "::" + q;
    refreshLikeUi(opts.likesLabel);
  }

  function playLocal(url, title) {
    stopPlayers();
    playerPh.hidden = true;
    localVideo.hidden = false;
    localVideo.src = url;
    localVideo.play().catch(function () {});
    nowPlaying.textContent = "Сейчас: " + title;
    currentVideoKey = "local::" + title;
    refreshLikeUi("—");
  }

  function refreshLikeUi(fallbackLabel) {
    const on = !!liked[currentVideoKey];
    likeBtn.classList.toggle("on", on);
    if (fallbackLabel && fallbackLabel !== "—") {
      likeCount.textContent = on ? fallbackLabel + " · ты 👍" : fallbackLabel;
    } else {
      likeCount.textContent = on ? "нравится" : "лайк";
    }
  }

  function refreshSubUi(ch) {
    if (!ch) return;
    const on = !!subs[ch.id];
    subBtn.classList.toggle("on", on);
    subBtn.textContent = on ? "Вы подписаны" : "Подписаться";
    subsStat.textContent = "👥 " + ch.subs + (on ? " · +ты" : "");
  }

  function showView(name) {
    viewHome.classList.toggle("active", name === "home");
    viewChannel.classList.toggle("active", name === "channel");
    btnHome.hidden = name !== "channel";
  }

  function openHome() {
    currentChannel = null;
    showView("home");
    stopPlayers();
    setTvPreview("");
  }

  function openChannel(id, autoPlay) {
    const ch = findChannel(id);
    if (!ch) return;
    currentChannel = ch;
    showView("channel");

    channelHead.innerHTML =
      "<h2>" +
      ch.emoji +
      " " +
      escapeHtml(ch.name) +
      "</h2><p>" +
      escapeHtml(ch.desc) +
      '</p><div class="head-stats">👥 ' +
      escapeHtml(ch.subs) +
      " подписчиков</div>";

    refreshSubUi(ch);
    uploadBox.hidden = !ch.allowUpload;

    const vids = [];
    if (ch.allowUpload) {
      myVideos.forEach(function (v) {
        vids.push({ local: true, url: v.url, title: v.title, likes: "—" });
      });
    }
    (ch.videos || []).forEach(function (v) {
      vids.push(v);
    });

    videoGrid.innerHTML = "";
    if (!vids.length && ch.allowUpload) {
      videoGrid.innerHTML =
        '<p style="grid-column:1/-1;color:#999;font-size:13px;padding:8px">Загрузи первый ролик ↑</p>';
    }

    vids.forEach(function (v) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vid-card";
      const badge = v.short ? '<span class="badge">Shorts</span>' : "";
      btn.innerHTML =
        '<div class="vid-thumb">' +
        badge +
        "<span>" +
        (v.local ? "🌙" : v.short ? "📱" : ch.emoji) +
        "</span></div><b>" +
        escapeHtml(v.title) +
        '</b><div class="vl">👍 ' +
        escapeHtml(v.likes || "—") +
        "</div>";
      btn.addEventListener("click", function () {
        if (v.local) playLocal(v.url, v.title);
        else playSearch(v.q || ch.search, v.title, { channelId: ch.id, likesLabel: v.likes });
      });
      videoGrid.appendChild(btn);
    });

    if (autoPlay && autoPlay.q) {
      playSearch(autoPlay.q, autoPlay.title, { channelId: ch.id, likesLabel: autoPlay.likes });
    } else if (vids.length && !vids[0].local) {
      const first = vids[0];
      playSearch(first.q || ch.search, first.title, { channelId: ch.id, likesLabel: first.likes });
    } else if (vids.length && vids[0].local) {
      playLocal(vids[0].url, vids[0].title);
    }
  }

  function buildFeed() {
    feed.innerHTML = "";
    shortsRow.innerHTML = "";
    const all = [];

    CHANNELS.forEach(function (ch) {
      if (ch.allowUpload) return;
      (ch.videos || []).forEach(function (v, i) {
        all.push({ ch: ch, v: v, order: i });
      });
    });

    // перемешать чуть-чуть, но оставить разнообразие
    all.sort(function (a, b) {
      return (a.order % 3) - (b.order % 3) || a.ch.name.localeCompare(b.ch.name);
    });

    all.forEach(function (item) {
      const v = item.v;
      const ch = item.ch;
      const card = document.createElement("button");
      card.type = "button";
      card.className = v.short ? "short-card" : "feed-card";
      card.innerHTML =
        '<div class="feed-thumb"><span>' +
        (v.short ? "📱" : ch.emoji) +
        '</span></div><div class="feed-meta"><b>' +
        escapeHtml(v.title) +
        '</b><div class="ch">' +
        ch.emoji +
        " " +
        escapeHtml(ch.name) +
        '</div><div class="likes">👍 ' +
        escapeHtml(v.likes || "—") +
        " · 👥 " +
        escapeHtml(ch.subs) +
        "</div></div>";
      card.addEventListener("click", function () {
        openChannel(ch.id, v);
        playSearch(v.q || ch.search, v.title, {
          channelId: ch.id,
          likesLabel: v.likes,
          alsoTv: true,
        });
      });
      if (v.short) shortsRow.appendChild(card);
      else feed.appendChild(card);
    });
  }

  CHANNELS.forEach(function (ch) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ch-card";
    b.style.borderColor = ch.color;
    b.innerHTML =
      '<span class="ico">' +
      ch.emoji +
      '</span><span class="nm">' +
      escapeHtml(ch.name) +
      '</span><span class="subs">👥 ' +
      escapeHtml(ch.subs) +
      "</span>";
    b.addEventListener("click", function () {
      openChannel(ch.id);
    });
    channelShelf.appendChild(b);
  });

  buildFeed();

  btnHome.addEventListener("click", openHome);

  likeBtn.addEventListener("click", function () {
    if (!currentVideoKey) return;
    if (liked[currentVideoKey]) delete liked[currentVideoKey];
    else liked[currentVideoKey] = 1;
    saveMap(LIKE_KEY, liked);
    const ch = currentChannel;
    const v = ch && (ch.videos || []).find(function (x) {
      return currentVideoKey.indexOf(x.q) !== -1;
    });
    refreshLikeUi(v && v.likes);
  });

  subBtn.addEventListener("click", function () {
    if (!currentChannel) return;
    if (subs[currentChannel.id]) delete subs[currentChannel.id];
    else subs[currentChannel.id] = 1;
    saveMap(SUB_KEY, subs);
    refreshSubUi(currentChannel);
  });

  fileIn.addEventListener("change", function () {
    const f = fileIn.files && fileIn.files[0];
    if (!f || !currentChannel) return;
    const url = URL.createObjectURL(f);
    const title = f.name.replace(/\.[^.]+$/, "") || "Мой ролик";
    myVideos.unshift({ title: title, url: url });
    openChannel(currentChannel.id);
    playLocal(url, title);
  });

  // PWA
  let deferredPrompt = null;
  const installBtn = document.getElementById("installBtn");
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
})();
