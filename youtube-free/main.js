/**
 * Смотри без рекламы v2 — спальня, каналы, плеер внутри (без переходов).
 */
(function () {
  window.__AMAL_NO_WORLD__ = true;

  const CHANNELS = window.YT_CHANNELS || [];
  const SUGGESTED = window.YT_SUGGESTED || [];
  const MY_KEY = "amal-watch-my-videos-v1";

  const viewHome = document.getElementById("viewHome");
  const viewChannel = document.getElementById("viewChannel");
  const btnHome = document.getElementById("btnHome");
  const channelShelf = document.getElementById("channelShelf");
  const suggestRow = document.getElementById("suggestRow");
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

  const chatToggle = document.getElementById("chatToggle");
  const chatPanel = document.getElementById("chatPanel");
  const chatLog = document.getElementById("chatLog");
  const chatForm = document.getElementById("chatForm");
  const chatIn = document.getElementById("chatIn");

  let currentChannel = null;
  let myVideos = [];

  function loadMyVideos() {
    return [];
  }

  function saveMyVideos() {
    /* blob-ссылки живут пока открыта вкладка */
  }

  function findChannel(id) {
    return CHANNELS.find((c) => c.id === id);
  }

  function ytEmbed(id) {
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?rel=0&modestbranding=1&autoplay=1";
  }

  function ytPlaylist(pl) {
    return "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(pl) + "&rel=0&autoplay=1";
  }

  function stopAllPlayers() {
    ytFrame.hidden = true;
    ytFrame.src = "";
    localVideo.hidden = true;
    localVideo.pause();
    localVideo.removeAttribute("src");
    localVideo.load();
    playerPh.hidden = false;
    tvPreview.innerHTML = "<span>📺 Выбери канал на полке</span>";
  }

  function playInBox(targetEl, opts) {
    stopAllPlayers();
    playerPh.hidden = true;

    if (opts.type === "local") {
      localVideo.hidden = false;
      localVideo.src = opts.url;
      localVideo.play().catch(function () {});
      if (targetEl === tvPreview) {
        tvPreview.innerHTML = "";
        const v = localVideo.cloneNode(true);
        v.hidden = false;
        v.src = opts.url;
        v.controls = true;
        v.playsInline = true;
        tvPreview.appendChild(v);
      }
      nowPlaying.textContent = "Сейчас: " + opts.title;
      tvHint.textContent = opts.title;
      return;
    }

    if (opts.type === "playlist") {
      ytFrame.hidden = false;
      ytFrame.src = ytPlaylist(opts.playlist);
      if (targetEl === tvPreview) {
        tvPreview.innerHTML =
          '<iframe src="' + ytPlaylist(opts.playlist) + '" allowfullscreen allow="autoplay; encrypted-media"></iframe>';
      }
      nowPlaying.textContent = "Сейчас: лента «" + opts.title + "»";
      tvHint.textContent = "▶ " + opts.title;
      return;
    }

    ytFrame.hidden = false;
    ytFrame.src = ytEmbed(opts.id);
    if (targetEl === tvPreview) {
      tvPreview.innerHTML =
        '<iframe src="' + ytEmbed(opts.id) + '" allowfullscreen allow="autoplay; encrypted-media"></iframe>';
    }
    nowPlaying.textContent = "Сейчас: " + opts.title;
    tvHint.textContent = "▶ " + opts.title;
  }

  function showView(name) {
    viewHome.classList.toggle("active", name === "home");
    viewChannel.classList.toggle("active", name === "channel");
    btnHome.hidden = name !== "channel";
  }

  function openHome() {
    currentChannel = null;
    showView("home");
    stopAllPlayers();
  }

  function openChannel(id) {
    const ch = findChannel(id);
    if (!ch) return;
    currentChannel = ch;
    showView("channel");

    channelHead.innerHTML =
      '<h2>' + ch.emoji + " " + ch.name + "</h2><p>" + ch.desc + "</p>";

    uploadBox.hidden = !ch.allowUpload;

    const vids = ch.allowUpload ? myVideos.map((v, i) => ({ local: true, url: v.url, title: v.title, idx: i })) : [];
    ch.videos.forEach(function (v) {
      vids.push(v);
    });

    videoGrid.innerHTML = "";
    if (!vids.length && ch.allowUpload) {
      videoGrid.innerHTML = '<p style="grid-column:1/-1;color:#999;font-size:13px;padding:8px">Загрузи свой первый ролик ↑</p>';
    }

    vids.forEach(function (v) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vid-card";
      const thumb = v.playlist ? "📋" : v.local ? "🌙" : "▶";
      btn.innerHTML = '<div class="vid-thumb">' + thumb + '</div><b>' + escapeHtml(v.title) + "</b>";
      btn.addEventListener("click", function () {
        if (v.local) {
          playInBox(null, { type: "local", url: v.url, title: v.title });
        } else if (v.playlist && ch.playlist) {
          playInBox(null, { type: "playlist", playlist: ch.playlist, title: ch.name + " — все серии" });
        } else if (v.id === "playlist" && ch.playlist) {
          playInBox(null, { type: "playlist", playlist: ch.playlist, title: ch.name });
        } else {
          playInBox(null, { type: "yt", id: v.id, title: v.title });
        }
      });
      videoGrid.appendChild(btn);
    });

    if (vids.length && !vids[0].local) {
      const first = vids[0];
      if (first.playlist && ch.playlist) {
        playInBox(null, { type: "playlist", playlist: ch.playlist, title: first.title });
      } else if (first.id && first.id !== "playlist") {
        playInBox(null, { type: "yt", id: first.id, title: first.title });
      }
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function playSuggest(item) {
    const ch = findChannel(item.channelId);
    if (!ch) return;
    if (item.pick === "upload") {
      openChannel(ch.id);
      return;
    }
    openChannel(ch.id);
    const v = ch.videos[item.pick || 0];
    if (!v) return;
    if (v.playlist && ch.playlist) {
      playInBox(tvPreview, { type: "playlist", playlist: ch.playlist, title: v.title });
    } else {
      playInBox(tvPreview, { type: "yt", id: v.id, title: v.title });
    }
  }

  // полка каналов
  CHANNELS.forEach(function (ch) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ch-card";
    b.style.borderColor = ch.color;
    b.innerHTML = '<span class="ico">' + ch.emoji + '</span><span class="nm">' + ch.name + "</span>";
    b.addEventListener("click", function () {
      openChannel(ch.id);
    });
    channelShelf.appendChild(b);
  });

  SUGGESTED.forEach(function (s) {
    const ch = findChannel(s.channelId);
    if (!ch) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sug-btn";
    b.textContent = ch.emoji + " " + ch.name;
    b.addEventListener("click", function () {
      playSuggest(s);
    });
    suggestRow.appendChild(b);
  });

  btnHome.addEventListener("click", openHome);

  fileIn.addEventListener("change", function () {
    const f = fileIn.files && fileIn.files[0];
    if (!f || !currentChannel) return;
    const url = URL.createObjectURL(f);
    const title = f.name.replace(/\.[^.]+$/, "") || "Мой ролик";
    myVideos.unshift({ title: title, url: url, at: Date.now() });
    saveMyVideos();
    openChannel(currentChannel.id);
    playInBox(null, { type: "local", url: url, title: title });
    chatMsg("Загрузила «" + title + "» на канал Amal 🌙", "bot");
  });

  // чат
  function chatMsg(text, role) {
    const d = document.createElement("div");
    d.className = "msg " + role;
    d.innerHTML = text;
    chatLog.appendChild(d);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function matchChannel(text) {
    const t = text.toLowerCase();
    for (let i = 0; i < CHANNELS.length; i++) {
      const c = CHANNELS[i];
      if (t.indexOf(c.name.toLowerCase()) !== -1) return c;
      if (c.id === "tri-kota" && /три кота|трикота|3 кота/.test(t)) return c;
      if (c.id === "vlada4" && /vlad|влад|a4|а4/.test(t)) return c;
      if (c.id === "gravity" && /gravity|гравити|фолз/.test(t)) return c;
      if (c.id === "amal-room" && /мой|amal|амал|свой канал/.test(t)) return c;
      if (/мульт|детск|детям/.test(t) && c.cat === "kids") return c;
      if (/челлендж|блог/.test(t) && c.cat === "blog") return c;
    }
    return null;
  }

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const text = chatIn.value.trim();
    if (!text) return;
    chatMsg(escapeHtml(text), "user");
    chatIn.value = "";
    const ch = matchChannel(text);
    if (ch) {
      chatMsg("Открываю канал <b>" + ch.name + "</b> — видео включится здесь, без перехода.", "bot");
      openChannel(ch.id);
      chatPanel.hidden = false;
    } else {
      chatMsg("Не нашла канал. Попробуй: <b>Три кота</b>, <b>Vlad A4</b>, <b>мультики</b>, <b>мой канал</b>.", "bot");
    }
  });

  chatToggle.addEventListener("click", function () {
    chatPanel.hidden = !chatPanel.hidden;
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

  chatMsg("Привет! 🏠 Это твоя <b>спальня-телевизор</b>. Жми канал на полке — видео играет <b>здесь</b>, никуда не перекидывает.", "bot");

  if (location.hash.indexOf("channel=") === 1) {
    openChannel(location.hash.split("=")[1]);
  }
})();
