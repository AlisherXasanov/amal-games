/**
 * Смотри v8 — много реальных роликов, правильные каналы, надёжный плеер.
 */
(function () {
  window.__AMAL_NO_WORLD__ = true;

  const CHANNELS = window.YT_CHANNELS || [];
  const SUB_KEY = "amal-watch-subs-v1";
  const LIKE_KEY = "amal-watch-likes-v1";
  const COMMENT_KEY = "amal-watch-comments-v1";
  const REPORT_KEY = "amal-watch-reports-v1";
  // Без рекламы по умолчанию (Piped). Если не играет — кнопка «Обычный плеер».
  const EMBED_NOADS = "https://piped.video/embed/";
  const EMBED_WORKS = "https://www.youtube-nocookie.com/embed/";
  const PIPED_APIS = [
    "https://pipedapi.adminforge.de",
    "https://pipedapi.nosebs.ru",
    "https://api.piped.private.coffee",
  ];

  const viewHome = document.getElementById("viewHome");
  const viewChannel = document.getElementById("viewChannel");
  const viewShorts = document.getElementById("viewShorts");
  const btnHome = document.getElementById("btnHome");
  const btnShorts = document.getElementById("btnShorts");
  const btnShortsBack = document.getElementById("btnShortsBack");
  const channelShelf = document.getElementById("channelShelf");
  const feed = document.getElementById("feed");
  const shortsRow = document.getElementById("shortsRow");
  const shortsFeed = document.getElementById("shortsFeed");
  const feedShortsLabel = document.getElementById("feedShortsLabel");
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
  const allVideosBtn = document.getElementById("allVideosBtn");
  const reportBtn = document.getElementById("reportBtn");
  const reportModal = document.getElementById("reportModal");
  const reportText = document.getElementById("reportText");
  const reportCancel = document.getElementById("reportCancel");
  const reportSend = document.getElementById("reportSend");
  const commentsList = document.getElementById("commentsList");
  const commentForm = document.getElementById("commentForm");
  const commentNick = document.getElementById("commentNick");
  const commentText = document.getElementById("commentText");

  let currentChannel = null;
  let currentVideoKey = "";
  let currentLikesLabel = "—";
  let currentPlayId = "";
  let usingNoAds = true;
  let myVideos = [];
  let liked = loadMap(LIKE_KEY);
  let subs = loadMap(SUB_KEY);
  let comments = loadMap(COMMENT_KEY);
  let allShorts = [];
  let shortsObserver = null;
  let channelNextpage = null;
  let channelLiveLoading = false;

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

  function realVideos(ch) {
    return (ch.videos || []).filter(function (v) {
      return v && v.id && v.id !== "playlist" && !v.playlist && !v.local;
    });
  }

  function formatLikes(raw) {
    if (raw == null || raw === "" || raw === "—") return "";
    if (typeof raw === "number" && isFinite(raw) && raw >= 0) {
      if (raw >= 1e6) return (raw / 1e6).toFixed(1).replace(/\.0$/, "") + " млн";
      if (raw >= 1000) return (raw / 1000).toFixed(1).replace(/\.0$/, "") + " тыс.";
      return String(Math.round(raw));
    }
    const s = String(raw).trim();
    // не показываем выдуманные подписи — только цифры с API
    if (/^\d+$/.test(s)) return formatLikes(Number(s));
    if (/^\d+([.,]\d+)?\s*(тыс\.?|млн|k|m)$/i.test(s)) return s;
    return "";
  }

  function embedUrl(id, autoplay, noAds) {
    const ap = autoplay === false ? "0" : "1";
    const useNoAds = noAds !== false;
    if (useNoAds) {
      return EMBED_NOADS + encodeURIComponent(id) + "?autoplay=" + ap;
    }
    return (
      EMBED_WORKS +
      encodeURIComponent(id) +
      "?rel=0&modestbranding=1&iv_load_policy=3&autoplay=" +
      ap
    );
  }

  function playlistUrl(list) {
    // плейлист YouTube часто с рекламой — лучше не использовать; оставляем как запасной
    return (
      EMBED_WORKS +
      "videoseries?list=" +
      encodeURIComponent(list) +
      "&rel=0&modestbranding=1&autoplay=1"
    );
  }

  function ensurePlayerTools() {
    if (document.getElementById("playerTools")) return;
    const bar = document.createElement("div");
    bar.id = "playerTools";
    bar.className = "player-tools";
    bar.innerHTML =
      '<button type="button" id="btnAltPlayer" class="sub-btn">Если не играет — обычный плеер</button>' +
      '<button type="button" id="btnToMenu" class="sub-btn">📋 К меню роликов</button>' +
      '<span id="vidCountLabel" class="stat"></span>';
    if (playerBox && playerBox.parentNode) {
      playerBox.parentNode.insertBefore(bar, playerBox.nextSibling);
    }
    document.getElementById("btnAltPlayer").onclick = function () {
      if (!currentPlayId) return;
      usingNoAds = !usingNoAds;
      ytFrame.src = embedUrl(currentPlayId, true, usingNoAds);
      this.textContent = usingNoAds
        ? "Если не играет — обычный плеер"
        : "Вернуть без рекламы";
    };
    document.getElementById("btnToMenu").onclick = function () {
      const menu = document.getElementById("channelMenu");
      if (menu) menu.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (videoGrid) videoGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  function setVidCount(ch) {
    ensurePlayerTools();
    const lab = document.getElementById("vidCountLabel");
    if (!lab || !ch) return;
    const n = realVideos(ch).length;
    lab.textContent = n ? "📋 " + n + " роликов в списке" : "";
  }

  function isShortVideo(v) {
    if (v.short) return true;
    const t = (v.title || "").toLowerCase();
    return t.indexOf("#shorts") >= 0 || t.indexOf("shorts") >= 0;
  }

  function collectShorts() {
    const out = [];
    const seen = {};
    CHANNELS.forEach(function (ch) {
      if (ch.allowUpload) return;
      realVideos(ch).forEach(function (v) {
        if (!isShortVideo(v)) return;
        if (seen[v.id]) return;
        seen[v.id] = 1;
        out.push({ ch: ch, v: v });
      });
    });
    return out;
  }

  /** Лента как Shorts: Shorts + обычные ролики, листаешь без канала */
  function collectSwipeFeed() {
    const shorts = collectShorts();
    const rest = [];
    const seen = {};
    shorts.forEach(function (item) {
      seen[item.v.id] = 1;
    });
    CHANNELS.forEach(function (ch) {
      if (ch.allowUpload) return;
      realVideos(ch).forEach(function (v, i) {
        if (seen[v.id]) return;
        if (i > 14) return;
        seen[v.id] = 1;
        rest.push({ ch: ch, v: v });
      });
    });
    // перемешать чуть-чуть обычные
    rest.sort(function (a, b) {
      return ((a.v.id.charCodeAt(0) + a.v.id.charCodeAt(2)) % 7) - ((b.v.id.charCodeAt(0) + b.v.id.charCodeAt(2)) % 7);
    });
    return shorts.concat(rest).slice(0, 80);
  }

  function stopShortsPlayers() {
    if (!shortsFeed) return;
    shortsFeed.querySelectorAll("iframe").forEach(function (fr) {
      fr.src = "";
    });
  }

  function clearTvPreview() {
    if (!tvPreview) return;
    tvPreview.innerHTML = "<span>📺 Выбери видео ниже</span>";
  }

  function stopAllMedia() {
    stopPlayers();
    stopShortsPlayers();
    clearTvPreview();
  }

  function loadReports() {
    try {
      return JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }
  function saveReports(arr) {
    try {
      localStorage.setItem(REPORT_KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  function renderComments() {
    if (!commentsList) return;
    const list = comments[currentVideoKey] || [];
    if (!list.length) {
      commentsList.innerHTML = '<p class="comment-empty">Пока нет комментариев — будь первым.</p>';
      return;
    }
    commentsList.innerHTML = list
      .slice()
      .reverse()
      .map(function (c) {
        return (
          '<div class="comment-item"><span class="who">' +
          escapeHtml(c.who) +
          '</span><span class="when">' +
          escapeHtml(c.when) +
          "</span><p>" +
          escapeHtml(c.text) +
          "</p></div>"
        );
      })
      .join("");
  }

  function addComment(who, text) {
    if (!currentVideoKey || !text.trim()) return;
    if (!comments[currentVideoKey]) comments[currentVideoKey] = [];
    comments[currentVideoKey].push({
      who: (who || "Гость").trim().slice(0, 24) || "Гость",
      text: text.trim().slice(0, 400),
      when: new Date().toLocaleString("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    if (comments[currentVideoKey].length > 80) {
      comments[currentVideoKey] = comments[currentVideoKey].slice(-80);
    }
    saveMap(COMMENT_KEY, comments);
    renderComments();
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
      '<button type="button" id="zoomOut">−</button>' +
      '<span id="zoomLabel">100%</span>' +
      '<button type="button" id="zoomIn">+</button>' +
      '<button type="button" id="zoomReset">1×</button>' +
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
    ytFrame.src = "about:blank";
    localVideo.hidden = true;
    localVideo.pause();
    localVideo.removeAttribute("src");
    try {
      localVideo.load();
    } catch (_) {}
    playerPh.hidden = false;
    currentPlayId = "";
    resetZoom();
  }

  function playId(id, title, opts) {
    opts = opts || {};
    ensureZoomBar();
    ensurePlayerTools();
    stopAllMedia();
    usingNoAds = true;
    currentPlayId = id;
    playerPh.hidden = true;
    ytFrame.hidden = false;
    ytFrame.src = embedUrl(id, true, true);
    nowPlaying.textContent = "Сейчас: " + title;
    if (tvHint) tvHint.textContent = "▶ " + title + " · без рекламы";
    currentVideoKey = (opts.channelId || "") + "::" + id;
    currentLikesLabel = formatLikes(opts.likesLabel);
    refreshLikeUi();
    renderComments();
    const alt = document.getElementById("btnAltPlayer");
    if (alt) alt.textContent = "Если не играет — обычный плеер";
  }

  function playPlaylist(list, title) {
    ensureZoomBar();
    ensurePlayerTools();
    stopAllMedia();
    currentPlayId = "";
    playerPh.hidden = true;
    ytFrame.hidden = false;
    ytFrame.src = playlistUrl(list);
    nowPlaying.textContent = "Сейчас: " + title;
    if (tvHint) tvHint.textContent = "▶ " + title + " · вся лента канала";
    currentVideoKey = "pl::" + list;
    currentLikesLabel = "—";
    refreshLikeUi();
    renderComments();
  }

  function playLocal(url, title) {
    ensureZoomBar();
    stopAllMedia();
    playerPh.hidden = true;
    localVideo.hidden = false;
    localVideo.src = url;
    localVideo.play().catch(function () {});
    nowPlaying.textContent = "Сейчас: " + title;
    if (tvHint) tvHint.textContent = "▶ " + title;
    currentVideoKey = "local::" + title;
    currentLikesLabel = "—";
    refreshLikeUi();
    renderComments();
  }

  function pickAutoPlay(vids) {
    for (let i = 0; i < vids.length; i++) {
      const v = vids[i];
      if (v.local) return v;
      if (v.id === "playlist" || v.playlist) continue;
      const t = (v.title || "").toLowerCase();
      if (t.indexOf("трейлер") >= 0 || t.indexOf("тизер") >= 0) continue;
      if (t === "ролик") continue;
      return v;
    }
    return (
      vids.find(function (v) {
        return v.id !== "playlist" && !v.playlist;
      }) || null
    );
  }

  function playVideoObj(ch, v) {
    if (v.local) return playLocal(v.url, v.title);
    if (v.playlist || v.id === "playlist") {
      // не открываем YouTube-плейлист (там реклама) — грузим меню
      loadAllFromChannel(ch);
      const menu = document.getElementById("channelMenu");
      if (menu) menu.scrollTo({ top: 0, behavior: "smooth" });
      if (tvHint) tvHint.textContent = "📋 Меню роликов ниже — листай и выбирай";
      return;
    }
    if (isShortVideo(v)) {
      openShorts(v.id);
      return;
    }
    playId(v.id, v.title || "Ролик", { channelId: ch.id, likesLabel: v.likes });
  }

  function refreshLikeUi() {
    const on = !!liked[currentVideoKey];
    likeBtn.classList.toggle("on", on);
    // только свой лайк — без накрученных цифр
    likeCount.textContent = on ? "ты 👍" : "лайк";
  }

  function refreshSubUi(ch) {
    if (!ch) return;
    const on = !!subs[ch.id];
    subBtn.classList.toggle("on", on);
    subBtn.textContent = on ? "Вы подписаны" : "Подписаться";
    subsStat.textContent = "👥 " + ch.subs + (on ? " · +ты" : "");
  }

  function showView(name) {
    stopAllMedia();
    viewHome.classList.toggle("active", name === "home");
    viewChannel.classList.toggle("active", name === "channel");
    if (viewShorts) viewShorts.classList.toggle("active", name === "shorts");
    btnHome.hidden = name !== "channel";
    if (btnShorts) btnShorts.hidden = name === "shorts";
  }

  function openHome() {
    currentChannel = null;
    showView("home");
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

  function renderVideoGrid(ch, vids) {
    videoGrid.innerHTML = "";
    if (!vids.length && ch.allowUpload) {
      videoGrid.innerHTML =
        '<p style="grid-column:1/-1;color:#999;font-size:13px;padding:8px">Загрузи первый ролик ↑</p>';
      return;
    }
    const count = document.createElement("p");
    count.className = "grid-count";
    count.style.cssText = "grid-column:1/-1;font-size:12px;color:#c4b5fd;padding:4px 0 8px";
    count.textContent =
      "Меню: " +
      realVideos(ch).length +
      " роликов — листай вниз и жми на любой";
    videoGrid.appendChild(count);

    vids.forEach(function (v) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vid-card";
      const badge = v.short
        ? '<span class="badge">Shorts</span>'
        : v.part
          ? '<span class="badge">ч.' + v.part + "</span>"
          : v.playlist
            ? '<span class="badge">все</span>'
            : "";
      const likeLine = formatLikes(v.likes);
      btn.innerHTML =
        '<div class="vid-thumb">' +
        badge +
        thumbHtml(v.thumb, v.local ? "🌙" : ch.emoji) +
        "</div><b>" +
        escapeHtml(v.title || "Ролик") +
        "</b>" +
        (likeLine ? '<div class="vl">👍 ' + escapeHtml(likeLine) + "</div>" : '<div class="vl"></div>');
      btn.addEventListener("click", function () {
        playVideoObj(ch, v);
      });
      videoGrid.appendChild(btn);
    });

    if (!ch.allowUpload && ch.channelId) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "vid-card load-more";
      more.innerHTML =
        '<div class="vid-thumb" style="display:grid;place-items:center;font-size:28px">⬇️</div><b>Загрузить ВСЕ ролики канала</b><div class="vl">подтянуть оставшиеся</div>';
      more.addEventListener("click", function () {
        loadAllFromChannel(ch);
      });
      videoGrid.appendChild(more);
    }
  }

  function mergeVideos(ch, incoming) {
    if (!ch.videos) ch.videos = [];
    const have = {};
    ch.videos.forEach(function (v) {
      if (v.id) have[v.id] = true;
    });
    let added = 0;
    incoming.forEach(function (v) {
      if (!v.id || have[v.id] || v.id === "playlist") return;
      have[v.id] = true;
      const plIdx = ch.videos.findIndex(function (x) {
        return x.id === "playlist" || x.playlist;
      });
      if (plIdx >= 0) ch.videos.splice(plIdx, 0, v);
      else ch.videos.push(v);
      added++;
    });
    return added;
  }

  function parsePipedStream(s) {
    const url = s.url || "";
    const m =
      String(url).match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
      String(url).match(/\/watch\/([A-Za-z0-9_-]{11})/) ||
      String(url).match(/\/([A-Za-z0-9_-]{11})$/);
    const id = s.id || (m && m[1]);
    if (!id) return null;
    const title = s.title || "Ролик";
    const short = !!s.isShort || isShortVideo({ title: title });
    const out = {
      id: id,
      title: String(title).slice(0, 100),
      likes: formatLikes(s.likes) || "",
      thumb: s.thumbnail || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
    };
    if (short) out.short = true;
    return out;
  }

  async function fetchPipedChannel(channelId, nextpage) {
    for (let i = 0; i < PIPED_APIS.length; i++) {
      const base = PIPED_APIS[i];
      try {
        let url;
        if (nextpage) {
          url =
            base +
            "/nextpage/channel/" +
            encodeURIComponent(channelId) +
            "?nextpage=" +
            encodeURIComponent(nextpage);
        } else {
          url = base + "/channel/" + encodeURIComponent(channelId);
        }
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) continue;
        const data = await res.json();
        const streams = data.relatedStreams || data.videos || [];
        const vids = [];
        streams.forEach(function (s) {
          const v = parsePipedStream(s);
          if (v) vids.push(v);
        });
        return { videos: vids, nextpage: data.nextpage || null };
      } catch (_) {}
    }
    return { videos: [], nextpage: null };
  }

  function refreshChannelGrid(ch) {
    if (!currentChannel || currentChannel.id !== ch.id) return;
    const vids = [];
    if (ch.allowUpload) {
      myVideos.forEach(function (v) {
        vids.push({ local: true, url: v.url, title: v.title, likes: "", thumb: "" });
      });
    }
    (ch.videos || []).forEach(function (v) {
      vids.push(v);
    });
    renderVideoGrid(ch, vids);
    setVidCount(ch);
    const headStats = channelHead && channelHead.querySelector(".head-stats");
    if (headStats) {
      headStats.textContent =
        "👥 " + ch.subs + " · " + realVideos(ch).length + " роликов";
    }
  }

  async function loadMoreFromChannel(ch, userClick) {
    if (!ch || !ch.channelId || channelLiveLoading) return 0;
    channelLiveLoading = true;
    if (tvHint && userClick) tvHint.textContent = "⏳ Грузим ролики с канала…";
    let added = 0;
    try {
      const page = await fetchPipedChannel(ch.channelId, channelNextpage);
      channelNextpage = page.nextpage;
      added = mergeVideos(ch, page.videos);
      refreshChannelGrid(ch);
      if (tvHint) {
        tvHint.textContent = added
          ? "✓ В списке уже " + realVideos(ch).length + " роликов"
          : "✓ Все доступные ролики в списке · или жми «Все ролики»";
      }
    } catch (_) {
      if (tvHint) tvHint.textContent = "Не удалось догрузить — жми «Все ролики»";
    }
    channelLiveLoading = false;
    return added;
  }

  async function loadAllFromChannel(ch) {
    if (!ch || !ch.channelId) return;
    if (tvHint) tvHint.textContent = "⏳ Загружаю ВСЕ ролики канала…";
    channelNextpage = null;
    let rounds = 0;
    while (rounds < 40) {
      rounds++;
      await loadMoreFromChannel(ch, false);
      if (tvHint) {
        tvHint.textContent =
          "⏳ Загрузка… уже " + realVideos(ch).length + " роликов";
      }
      if (!channelNextpage) break;
    }
    if (tvHint) {
      tvHint.textContent =
        "✓ Готово: " +
        realVideos(ch).length +
        " роликов в списке. «Все ролики» — смотреть ленту подряд.";
    }
  }

  function openChannel(id, autoPlay) {
    const ch = findChannel(id);
    if (!ch) return;
    if (autoPlay && isShortVideo(autoPlay)) {
      openShorts(autoPlay.id);
      return;
    }
    currentChannel = ch;
    channelNextpage = null;
    showView("channel");
    ensurePlayerTools();

    const icon = ch.icon
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
      " · " +
      realVideos(ch).length +
      " роликов</div></div></div>";

    refreshSubUi(ch);
    setVidCount(ch);
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

    renderVideoGrid(ch, vids);

    if (autoPlay) playVideoObj(ch, autoPlay);
    else {
      const first = pickAutoPlay(vids);
      if (first) {
        if (isShortVideo(first)) playVideoObj(ch, first);
        else playId(first.id, first.title || "Ролик", { channelId: ch.id, likesLabel: first.likes });
      }
    }
    renderComments();

    if (ch.channelId && !ch.allowUpload) {
      loadAllFromChannel(ch);
    }
  }

  function buildShortsFeed(startId) {
    if (!shortsFeed) return;
    allShorts = collectSwipeFeed();
    if (!allShorts.length) {
      shortsFeed.innerHTML = '<p class="shorts-empty">Пока пусто — зайди позже.</p>';
      return;
    }
    shortsFeed.innerHTML = "";
    allShorts.forEach(function (item, idx) {
      const slide = document.createElement("div");
      slide.className = "shorts-slide";
      slide.dataset.vid = item.v.id;
      slide.dataset.idx = String(idx);
      slide.dataset.chid = item.ch.id;
      slide.innerHTML =
        '<div class="shorts-player"><iframe title="' +
        escapeHtml(item.v.title) +
        '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
        '<div class="shorts-meta"><b>' +
        escapeHtml(item.v.title) +
        '</b><div class="ch">' +
        escapeHtml(item.ch.name) +
        '</div><button type="button" class="shorts-ch-btn" data-ch="' +
        escapeHtml(item.ch.id) +
        '">Канал</button></div>';
      shortsFeed.appendChild(slide);
    });

    shortsFeed.querySelectorAll(".shorts-ch-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = btn.getAttribute("data-ch");
        if (id) openChannel(id);
      });
    });

    if (shortsObserver) shortsObserver.disconnect();
    shortsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const slide = entry.target;
          const fr = slide.querySelector("iframe");
          if (!fr) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
            shortsFeed.querySelectorAll("iframe").forEach(function (other) {
              if (other !== fr) other.src = "";
            });
            const vid = slide.dataset.vid;
            if (vid && (!fr.src || fr.src.indexOf(vid) < 0)) {
              fr.src = embedUrl(vid, true, true);
            }
          } else if (!entry.isIntersecting) {
            fr.src = "";
          }
        });
      },
      { threshold: [0.55, 0.75], root: shortsFeed, rootMargin: "0px" }
    );
    shortsFeed.querySelectorAll(".shorts-slide").forEach(function (sl) {
      shortsObserver.observe(sl);
    });

    let startIdx = 0;
    if (startId) {
      const found = allShorts.findIndex(function (x) {
        return x.v.id === startId;
      });
      if (found >= 0) startIdx = found;
    }
    const target = shortsFeed.querySelector('.shorts-slide[data-idx="' + startIdx + '"]');
    if (target) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }

  function openShorts(startId) {
    if (!viewShorts) return;
    currentChannel = null;
    showView("shorts");
    buildShortsFeed(startId);
  }

  function buildFeed() {
    feed.innerHTML = "";
    shortsRow.innerHTML = "";
    const all = [];
    CHANNELS.forEach(function (ch) {
      if (ch.allowUpload) return;
      realVideos(ch)
        .slice(0, 10)
        .forEach(function (v, i) {
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
      card.className = isShortVideo(v) ? "short-card" : "feed-card";
      card.innerHTML =
        '<div class="feed-thumb">' +
        thumbHtml(v.thumb, ch.emoji) +
        '</div><div class="feed-meta"><b>' +
        escapeHtml(v.title || "Ролик") +
        '</b><div class="ch">' +
        escapeHtml(ch.name) +
        "</div></div>";
      // сразу лента — без перехода на канал
      card.addEventListener("click", function () {
        openShorts(v.id);
      });
      if (isShortVideo(v)) shortsRow.appendChild(card);
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
    const n = realVideos(ch).length;
    b.innerHTML =
      ico +
      '<span class="nm">' +
      escapeHtml(ch.name) +
      '</span><span class="subs">' +
      (n ? n + " видео" : escapeHtml(ch.subs)) +
      "</span>";
    b.addEventListener("click", function () {
      openChannel(ch.id);
    });
    channelShelf.appendChild(b);
  });

  buildFeed();
  btnHome.addEventListener("click", openHome);

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchReply = document.getElementById("searchReply");
  const searchHits = document.getElementById("searchHits");

  const SEARCH_ALIASES = [
    { keys: ["фиксик", "фикс", "симк", "нолик"], channel: "fixiki" },
    { keys: ["фиксики новые", "новые фикси"], channel: "fixiki-new" },
    { keys: ["три кота", "коржик", "карамельк", "компот"], channel: "tri-kota" },
    { keys: ["пляж", "море", "краб"], channel: "tri-beach" },
    { keys: ["познаватель", "валера", "желей"], channel: "poznavatel" },
    { keys: ["фиксай", "fixeye"], channel: "fixeye" },
    { keys: ["владус", "мармелад"], channel: "vladus" },
    { keys: ["а4", "влад а4", "vlad"], channel: "vlada4" },
    { keys: ["мистер бист", "mrbeast", "mr beast", "бист"], channel: "mrbeast" },
    { keys: ["саквашин", "квашен", "саша"], channel: "sakvashin" },
    { keys: ["гравити", "gravity", "фолз", "dipper", "мейбл"], channel: "gravity" },
    { keys: ["сладост", "гадост", "конфет"], channel: "sladosti" },
    { keys: ["биллиент", "billy", "билли"], channel: "billionent" },
    { keys: ["ярокс", "ерокс", "erox", "стандофф"], channel: "yaroks" },
    { keys: ["мой канал", "амал", "загруз"], channel: "amal-room" },
  ];

  function normRu(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .trim();
  }

  function runSearch(qRaw) {
    const q = normRu(qRaw);
    if (!searchHits || !searchReply) return;
    searchHits.innerHTML = "";
    if (!q) {
      searchReply.textContent = "Напиши, что хочешь посмотреть.";
      return;
    }

    let matchedCh = null;
    for (let i = 0; i < SEARCH_ALIASES.length; i++) {
      const a = SEARCH_ALIASES[i];
      if (a.keys.some(function (k) { return q.indexOf(k) >= 0; })) {
        matchedCh = findChannel(a.channel);
        if (matchedCh) break;
      }
    }

    const hits = [];
    CHANNELS.forEach(function (ch) {
      if (ch.allowUpload && q.indexOf("амал") < 0 && q.indexOf("мой") < 0) return;
      const chName = normRu(ch.name + " " + (ch.desc || ""));
      const chMatch = chName.indexOf(q) >= 0 || (matchedCh && matchedCh.id === ch.id);
      realVideos(ch).forEach(function (v) {
        const t = normRu(v.title);
        if (chMatch || t.indexOf(q) >= 0 || (matchedCh && matchedCh.id === ch.id && hits.length < 8)) {
          hits.push({ ch: ch, v: v, score: (t.indexOf(q) >= 0 ? 2 : 0) + (chMatch ? 1 : 0) });
        }
      });
    });

    hits.sort(function (a, b) { return b.score - a.score; });
    const top = hits.slice(0, 12);

    if (matchedCh && !top.length) {
      searchReply.textContent = "Нашла канал «" + matchedCh.name + "». Открываю меню роликов.";
      openChannel(matchedCh.id);
      return;
    }

    if (!top.length) {
      searchReply.textContent =
        "Пока не нашла. Попробуй: фиксики, три кота, пляж, влад а4, познаватель, ярокс.";
      return;
    }

    searchReply.textContent =
      (matchedCh ? "Канал «" + matchedCh.name + "». " : "") +
      "Вот что нашлось (" + top.length + "). Жми — откроется без рекламы.";

    if (matchedCh) {
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "search-hit";
      openBtn.innerHTML =
        (matchedCh.icon
          ? '<img src="' + matchedCh.icon + '" alt="" />'
          : "<span></span>") +
        "<div><b>▶ Весь канал: " +
        escapeHtml(matchedCh.name) +
        "</b><span>открыть меню всех роликов</span></div>";
      openBtn.addEventListener("click", function () {
        openChannel(matchedCh.id);
      });
      searchHits.appendChild(openBtn);
    }

    top.forEach(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "search-hit";
      btn.innerHTML =
        '<img src="' +
        escapeHtml(item.v.thumb || item.ch.icon || "") +
        '" alt="" />' +
        "<div><b>" +
        escapeHtml(item.v.title || "Ролик") +
        "</b><span>" +
        escapeHtml(item.ch.name) +
        "</span></div>";
      btn.addEventListener("click", function () {
        openChannel(item.ch.id, item.v);
      });
      searchHits.appendChild(btn);
    });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      runSearch(searchInput ? searchInput.value : "");
    });
  }
  if (searchInput) {
    let t = null;
    searchInput.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (searchInput.value.trim().length >= 2) runSearch(searchInput.value);
      }, 280);
    });
  }

  if (btnShorts) {
    btnShorts.addEventListener("click", function () {
      openShorts();
    });
  }
  if (btnShortsBack) btnShortsBack.addEventListener("click", openHome);
  if (feedShortsLabel) {
    feedShortsLabel.addEventListener("click", function () {
      openShorts();
    });
  }

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

  if (allVideosBtn) {
    allVideosBtn.addEventListener("click", function () {
      if (!currentChannel) return;
      const menu = document.getElementById("channelMenu");
      if (menu) menu.scrollTo({ top: 0, behavior: "smooth" });
      loadAllFromChannel(currentChannel);
    });
  }

  if (reportBtn && reportModal) {
    reportBtn.addEventListener("click", function () {
      reportModal.hidden = false;
      if (reportText) reportText.value = "";
    });
  }
  if (reportCancel && reportModal) {
    reportCancel.addEventListener("click", function () {
      reportModal.hidden = true;
    });
  }
  if (reportSend && reportModal) {
    reportSend.addEventListener("click", function () {
      const text = (reportText && reportText.value.trim()) || "";
      if (!text) return;
      const reports = loadReports();
      reports.push({
        when: new Date().toISOString(),
        channel: currentChannel ? currentChannel.name : "—",
        video: nowPlaying.textContent.replace(/^Сейчас:\s*/, ""),
        text: text.slice(0, 500),
      });
      saveReports(reports.slice(-50));
      reportModal.hidden = true;
      if (reportText) reportText.value = "";
      if (tvHint) tvHint.textContent = "✓ Жалоба сохранена.";
    });
  }

  if (commentForm) {
    commentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addComment(commentNick ? commentNick.value : "", commentText ? commentText.value : "");
      if (commentText) commentText.value = "";
    });
  }

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
