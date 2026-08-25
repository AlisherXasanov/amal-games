/**
 * Смотри v4 — настоящие ID, превью, иконки, зум/пан, лайки.
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
  const playerBox = document.getElementById("playerBox");

  let currentChannel = null;
  let currentVideoKey = "";
  let currentLikesLabel = "—";
  let myVideos = [];
  let liked = loadMap(LIKE_KEY);
  let subs = loadMap(SUB_KEY);

  // зум / пан
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

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

  function embedUrl(id) {
    return (
      "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(id) +
      "?rel=0&modestbranding=1&autoplay=1"
    );
  }
  function playlistUrl(list) {
    return (
      "https://www.youtube-nocookie.com/embed/videoseries?list=" +
      encodeURIComponent(list) +
      "&rel=0&autoplay=1"
    );
  }

  function applyTransform() {
    const t = "translate(" + panX + "px," + panY + "px) scale(" + zoom + ")";
    ytFrame.style.transform = t;
    localVideo.style.transform = t;
    ytFrame.style.transformOrigin = "center center";
    localVideo.style.transformOrigin = "center center";
  }

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
    const zlab = document.getElementById("zoomLabel");
    if (zlab) zlab.textContent = "100%";
  }

  function setZoom(z) {
    zoom = Math.max(1, Math.min(4, z));
    if (zoom === 1) {
      panX = 0;
      panY = 0;
    }
    applyTransform();
    const zlab = document.getElementById("zoomLabel");
    if (zlab) zlab.textContent = Math.round(zoom * 100) + "%";
    // при зуме iframe не перехватывает drag
    ytFrame.style.pointerEvents = zoom > 1 ? "none" : "auto";
    localVideo.style.pointerEvents = zoom > 1 ? "none" : "auto";
    let tip = document.getElementById("panOverlay");
    if (zoom > 1) {
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "panOverlay";
        tip.className = "pan-overlay";
        playerBox.appendChild(tip);
      }
      tip.hidden = false;
    } else if (tip) tip.hidden = true;
  }

  function ensureZoomBar() {
    if (document.getElementById("zoomBar")) return;
    const bar = document.createElement("div");
    bar.id = "zoomBar";
    bar.className = "zoom-bar";
    bar.innerHTML =
      '<button type="button" id="zoomOut" title="Отдалить">−</button>' +
      '<span id="zoomLabel">100%</span>' +
      '<button type="button" id="zoomIn" title="Приблизить лицо">+</button>' +
      '<button type="button" id="zoomReset" title="Сброс">1×</button>' +
      '<span class="zoom-tip">зажми и тяни экран</span>';
    playerBox.parentNode.insertBefore(bar, playerBox.nextSibling);
    document.getElementById("zoomIn").onclick = function () {
      setZoom(zoom + 0.35);
    };
    document.getElementById("zoomOut").onclick = function () {
      setZoom(zoom - 0.35);
    };
    document.getElementById("zoomReset").onclick = resetZoom;

    playerBox.addEventListener("pointerdown", function (e) {
      if (zoom <= 1) return;
      if (e.target.closest("button")) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        playerBox.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    playerBox.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      panX += e.clientX - lastX;
      panY += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      applyTransform();
    });
    function endDrag() {
      dragging = false;
    }
    playerBox.addEventListener("pointerup", endDrag);
    playerBox.addEventListener("pointercancel", endDrag);
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
    resetZoom();
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

  function playId(id, title, opts) {
    opts = opts || {};
    ensureZoomBar();
    const src = embedUrl(id);
    stopPlayers();
    playerPh.hidden = true;
    ytFrame.hidden = false;
    ytFrame.src = src;
    if (opts.alsoTv) setTvPreview(src);
    nowPlaying.textContent = "Сейчас: " + title;
    tvHint.textContent = "▶ " + title;
    currentVideoKey = (opts.channelId || "") + "::" + id;
    currentLikesLabel = opts.likesLabel || "—";
    refreshLikeUi();
  }

  function playPlaylist(list, title, opts) {
    opts = opts || {};
    ensureZoomBar();
    const src = playlistUrl(list);
    stopPlayers();
    playerPh.hidden = true;
    ytFrame.hidden = false;
    ytFrame.src = src;
    if (opts.alsoTv) setTvPreview(src);
    nowPlaying.textContent = "Сейчас: " + title;
    currentVideoKey = "pl::" + list;
    currentLikesLabel = "—";
    refreshLikeUi();
  }

  function playLocal(url, title) {
    ensureZoomBar();
    stopPlayers();
    playerPh.hidden = true;
    localVideo.hidden = false;
    localVideo.src = url;
    localVideo.play().catch(function () {});
    nowPlaying.textContent = "Сейчас: " + title;
    currentVideoKey = "local::" + title;
    currentLikesLabel = "—";
    refreshLikeUi();
  }

  function playVideoObj(ch, v, alsoTv) {
    if (v.local) return playLocal(v.url, v.title);
    if (v.playlist || v.id === "playlist") {
      return playPlaylist(v.playlist || ch.uploads, v.title || ch.name, {
        channelId: ch.id,
        alsoTv: alsoTv,
      });
    }
    playId(v.id, v.title, { channelId: ch.id, likesLabel: v.likes, alsoTv: alsoTv });
  }

  function refreshLikeUi() {
    const on = !!liked[currentVideoKey];
    likeBtn.classList.toggle("on", on);
    likeCount.textContent =
      currentLikesLabel && currentLikesLabel !== "—"
        ? on
          ? currentLikesLabel + " · ты 👍"
          : currentLikesLabel
        : on
          ? "нравится"
          : "лайк";
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

  function thumbHtml(src, fallbackEmoji) {
    if (src) {
      return (
        '<img src="' +
        src +
        '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'grid\')" />' +
        '<span class="fb" style="display:none">' +
        (fallbackEmoji || "▶") +
        "</span>"
      );
    }
    return "<span>" + (fallbackEmoji || "▶") + "</span>";
  }

  function openChannel(id, autoPlay) {
    const ch = findChannel(id);
    if (!ch) return;
    currentChannel = ch;
    showView("channel");

    const icon =
      ch.icon
        ? '<img class="ch-avatar" src="' + ch.icon + '" alt="" />'
        : '<span class="ch-avatar emoji">' + ch.emoji + "</span>";

    channelHead.innerHTML =
      '<div class="ch-title-row">' +
      icon +
      "<div><h2>" +
      escapeHtml(ch.name) +
      "</h2><p>" +
      escapeHtml(ch.desc) +
      '</p><div class="head-stats">👥 ' +
      escapeHtml(ch.subs) +
      " подписчиков</div></div></div>";

    refreshSubUi(ch);
    uploadBox.hidden = !ch.allowUpload;

    const vids = [];
    if (ch.allowUpload) {
      myVideos.forEach(function (v) {
        vids.push({ local: true, url: v.url, title: v.title, likes: "—", thumb: "" });
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
      const badge = v.short ? '<span class="badge">Shorts</span>' : v.part ? '<span class="badge">ч.' + v.part + "</span>" : "";
      btn.innerHTML =
        '<div class="vid-thumb">' +
        badge +
        thumbHtml(v.thumb, v.local ? "🌙" : ch.emoji) +
        "</div><b>" +
        escapeHtml(v.title) +
        '</b><div class="vl">👍 ' +
        escapeHtml(v.likes || "—") +
        "</div>";
      btn.addEventListener("click", function () {
        playVideoObj(ch, v, false);
      });
      videoGrid.appendChild(btn);
    });

    if (autoPlay) playVideoObj(ch, autoPlay, true);
    else if (vids.length) playVideoObj(ch, vids[0], false);
  }

  function buildFeed() {
    feed.innerHTML = "";
    shortsRow.innerHTML = "";
    const all = [];
    CHANNELS.forEach(function (ch) {
      if (ch.allowUpload) return;
      (ch.videos || []).forEach(function (v, i) {
        if (v.id === "playlist") return;
        all.push({ ch: ch, v: v, order: i });
      });
    });
    all.sort(function (a, b) {
      return (a.order % 3) - (b.order % 3);
    });

    all.forEach(function (item) {
      const v = item.v;
      const ch = item.ch;
      const card = document.createElement("button");
      card.type = "button";
      card.className = v.short ? "short-card" : "feed-card";
      card.innerHTML =
        '<div class="feed-thumb">' +
        thumbHtml(v.thumb, ch.emoji) +
        '</div><div class="feed-meta"><b>' +
        escapeHtml(v.title) +
        '</b><div class="ch"><img class="mini-ico" src="' +
        (ch.icon || v.thumb || "") +
        '" alt="" onerror="this.style.display=\'none\'" /> ' +
        escapeHtml(ch.name) +
        '</div><div class="likes">👍 ' +
        escapeHtml(v.likes || "—") +
        " · 👥 " +
        escapeHtml(ch.subs) +
        "</div></div>";
      card.addEventListener("click", function () {
        openChannel(ch.id, v);
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
    const ico = ch.icon
      ? '<img class="ch-ico-img" src="' + ch.icon + '" alt="" />'
      : '<span class="ico">' + ch.emoji + "</span>";
    b.innerHTML =
      ico +
      '<span class="nm">' +
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
    refreshLikeUi();
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
