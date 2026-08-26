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
  const MINE_KEY = "amal-watch-mychannel-v1";
  const PLAY_BUTTONS = [
    { id: "bronze", name: "Бронзовая", need: 50, cls: "bronze" },
    { id: "silver", name: "Серебряная", need: 100, cls: "silver" },
    { id: "silver2", name: "Серебро+", need: 250, cls: "silver" },
    { id: "romantic", name: "Романтик", need: 500, cls: "romantic" },
    { id: "gold", name: "Золотая", need: 1000, cls: "gold" },
    { id: "gold2", name: "Золото+", need: 2500, cls: "gold" },
    { id: "ruby", name: "Рубиновая", need: 5000, cls: "ruby" },
    { id: "diamond", name: "Бриллиант", need: 10000, cls: "diamond" },
    { id: "diamond2", name: "Бриллиант+", need: 25000, cls: "diamond" },
    { id: "opal", name: "Опал", need: 50000, cls: "opal" },
    { id: "rainbow", name: "Радуга", need: 100000, cls: "rainbow" },
    { id: "neural", name: "Нейросеть", need: 250000, cls: "neural" },
    { id: "mythic", name: "Миф", need: 500000, cls: "mythic" },
  ];
  const CLUB_NEED = 1000;
  const ACHS = [
    { id: "first_up", title: "Первый ролик", check: function (c) { return (c.videos || 0) >= 1; } },
    { id: "ten", title: "10 роликов", check: function (c) { return (c.videos || 0) >= 10; } },
    { id: "gift", title: "Именной подарок", check: function (c) { return !!c.giftOpened; } },
    { id: "club", title: "Свой клуб", check: function (c) { return (c.subs || 0) >= CLUB_NEED; } },
    { id: "silver", title: "Серебро", check: function (c) { return (c.subs || 0) >= 100; } },
    { id: "romantic", title: "Романтик", check: function (c) { return (c.subs || 0) >= 500; } },
    { id: "gold", title: "Золото", check: function (c) { return (c.subs || 0) >= 1000; } },
    { id: "diamond", title: "Бриллиант", check: function (c) { return (c.subs || 0) >= 10000; } },
    { id: "neural", title: "Нейро-кнопка", check: function (c) { return (c.subs || 0) >= 250000; } },
  ];
  function loadMineCh() {
    try {
      return Object.assign(
        { subs: 0, videos: 0, giftOpened: false, hiddenButtons: {}, achievements: {}, gameNick: "" },
        JSON.parse(localStorage.getItem(MINE_KEY) || "{}")
      );
    } catch (_) {
      return { subs: 0, videos: 0, giftOpened: false, hiddenButtons: {}, achievements: {}, gameNick: "" };
    }
  }
  function saveMineCh() {
    localStorage.setItem(MINE_KEY, JSON.stringify(mineCh));
  }
  let mineCh = loadMineCh();
  // Обычный YouTube-embed может с рекламой.
  // «Без рекламы» = прямой поток через API (свой <video>), БЕЗ сайта Piped на экране.
  const EMBED_WORKS = "https://www.youtube-nocookie.com/embed/";
  const EMBED_YT = "https://www.youtube.com/embed/";
  const PIPED_APIS = [
    "https://pipedapi.adminforge.de",
    "https://api.piped.private.coffee",
    "https://pipedapi.nosebs.ru",
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.leptons.xyz",
  ];
  let playGen = 0;
  let rescueTimer = null;
  const streamCache = {};
  const STREAM_CACHE_MS = 20 * 60 * 1000;
  const INV_APIS = [
    "https://yewtu.be",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://iv.ggtyler.dev",
  ];
  let embedHostFlip = 0;

  function clearAdRescue() {
    if (rescueTimer) {
      clearInterval(rescueTimer);
      rescueTimer = null;
    }
  }

  /** Когда уже крутится YouTube (возможна реклама) — сами переключаемся на чистый поток */
  function startAdRescue(videoId, gen) {
    clearAdRescue();
    let tries = 0;
    rescueTimer = setInterval(function () {
      if (gen !== playGen || currentPlayId !== videoId) {
        clearAdRescue();
        return;
      }
      if (localVideo && !localVideo.hidden && localVideo.src) {
        clearAdRescue();
        return;
      }
      tries++;
      if (tries > 25) {
        clearAdRescue();
        return;
      }
      fetchDirectStream(videoId).then(function (url) {
        if (!url || gen !== playGen || currentPlayId !== videoId) return;
        applyCleanStream(url, gen, videoId);
      });
    }, 1100);
  }

  function disableVideoCaptions() {
    if (!localVideo) return;
    try {
      const tracks = localVideo.textTracks;
      if (!tracks) return;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = "disabled";
      }
    } catch (_) {}
  }

  let captionLangPref = "ru";
  try {
    const saved = localStorage.getItem("amal-watch-cc-lang");
    if (saved) captionLangPref = saved;
  } catch (_) {}

  const LANG_LABELS = {
    ru: "Русский",
    uk: "Українська",
    be: "Беларуская",
    en: "English",
    es: "Español",
    de: "Deutsch",
    fr: "Français",
    it: "Italiano",
    pt: "Português",
    tr: "Türkçe",
    pl: "Polski",
    kk: "Қазақша",
    uz: "Oʻzbekcha",
    ar: "العربية",
    hi: "हिन्दी",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
  };

  function normLang(code) {
    return String(code || "")
      .toLowerCase()
      .replace("_", "-")
      .split("-")[0];
  }

  function langTitle(code, fallback) {
    const c = normLang(code);
    return LANG_LABELS[c] || fallback || code || "Субтитры";
  }

  function clearVideoTracks(videoEl) {
    if (!videoEl) return;
    videoEl.querySelectorAll("track").forEach(function (t) {
      try {
        if (t.src && t.src.indexOf("blob:") === 0) URL.revokeObjectURL(t.src);
      } catch (_) {}
      t.remove();
    });
  }

  function setCaptionMode(videoEl, langOrOff) {
    if (!videoEl || !videoEl.textTracks) return;
    const want = langOrOff === "off" || !langOrOff ? "" : normLang(langOrOff);
    for (let i = 0; i < videoEl.textTracks.length; i++) {
      const tr = videoEl.textTracks[i];
      const code = normLang(tr.language);
      if (want && (code === want || tr.label.toLowerCase().indexOf(want) >= 0)) {
        tr.mode = "showing";
      } else {
        tr.mode = "disabled";
      }
    }
  }

  function pickDefaultCaptionLang(list) {
    if (!list || !list.length) return "off";
    const pref = normLang(captionLangPref);
    const codes = list.map(function (s) {
      return normLang(s.code);
    });
    const order = [pref, "ru", "uk", "en"].filter(Boolean);
    for (let i = 0; i < order.length; i++) {
      if (codes.indexOf(order[i]) >= 0) return order[i];
    }
    return codes[0] || "off";
  }

  /** Вешаем дорожки субтитров (с переводом/автопереводом, если есть у ролика). */
  function attachCaptions(videoEl, subtitles, opts) {
    opts = opts || {};
    if (!videoEl) return Promise.resolve();
    clearVideoTracks(videoEl);
    const list = (subtitles || []).filter(function (s) {
      return s && s.url;
    });
    if (!list.length) {
      updateCaptionBtn(null);
      return Promise.resolve();
    }
    const jobs = list.map(function (s) {
      return fetch(s.url, { signal: AbortSignal.timeout(8000) })
        .then(function (res) {
          if (!res.ok) throw new Error("cc");
          return res.text();
        })
        .then(function (text) {
          // иногда приходит XML/SRV3 — браузер ждёт VTT
          let body = text;
          if (text.indexOf("WEBVTT") < 0 && text.indexOf("-->") >= 0) {
            body = "WEBVTT\n\n" + text;
          }
          if (text.indexOf("WEBVTT") < 0 && text.indexOf("<") === 0) {
            // сырой xml без конвертации — пропускаем
            throw new Error("not-vtt");
          }
          const blobUrl = URL.createObjectURL(
            new Blob([beepText(body, false)], { type: "text/vtt" })
          );
          const track = document.createElement("track");
          track.kind = "subtitles";
          track.label =
            langTitle(s.code, s.name) + (s.autoGenerated ? " · авто" : "");
          track.srclang = normLang(s.code) || "und";
          track.src = blobUrl;
          videoEl.appendChild(track);
        })
        .catch(function () {
          // прямая ссылка, если CORS/формат ок
          try {
            const track = document.createElement("track");
            track.kind = "subtitles";
            track.label =
              langTitle(s.code, s.name) + (s.autoGenerated ? " · авто" : "");
            track.srclang = normLang(s.code) || "und";
            track.src = s.url;
            videoEl.appendChild(track);
          } catch (_) {}
        });
    });
    return Promise.all(jobs).then(function () {
      const chosen =
        opts.lang ||
        (captionLangPref === "off"
          ? "off"
          : pickDefaultCaptionLang(list));
      setCaptionMode(videoEl, chosen);
      updateCaptionBtn(list, chosen);
      bindCaptionBeep(videoEl);
    });
  }

  function bindCaptionBeep(videoEl) {
    if (!videoEl || videoEl.dataset.beepBound === "1") return;
    videoEl.dataset.beepBound = "1";
    videoEl.addEventListener("cuechange", function () {
      if (!beepOn) return;
      try {
        const tracks = videoEl.textTracks;
        if (!tracks) return;
        for (let i = 0; i < tracks.length; i++) {
          const t = tracks[i];
          if (t.mode !== "showing") continue;
          const cues = t.activeCues;
          if (!cues) continue;
          for (let j = 0; j < cues.length; j++) {
            const txt = cues[j] && (cues[j].text || "");
            if (txt && beepText(txt, false) !== txt) playBeepSound();
          }
        }
      } catch (_) {}
    });
  }

  function updateCaptionBtn(list, chosen) {
    const btn = document.getElementById("btnFloatCc");
    if (!btn) return;
    if (!list || !list.length) {
      btn.textContent = "🌐 Перевод";
      btn.disabled = true;
      btn.title = "У этого ролика нет дорожек перевода";
      return;
    }
    btn.disabled = false;
    btn.title = "Субтитры / перевод";
    if (chosen && chosen !== "off") {
      btn.textContent = "🌐 " + (LANG_LABELS[chosen] || chosen);
    } else {
      btn.textContent = "🌐 Перевод";
    }
  }

  function ensureCaptionPanel() {
    let panel = document.getElementById("captionPanel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "captionPanel";
    panel.className = "caption-panel";
    panel.hidden = true;
    panel.innerHTML =
      "<b>Перевод / субтитры</b><div class=\"caption-list\" id=\"captionList\"></div>" +
      "<p class=\"caption-hint\">Берём дорожки с ролика (в т.ч. автоперевод). Голоса не меняем — только текст.</p>";
    if (playerBox) playerBox.appendChild(panel);
    return panel;
  }

  function openCaptionPicker() {
    const panel = ensureCaptionPanel();
    const listEl = document.getElementById("captionList");
    const hit = currentPlayId && streamCache[currentPlayId];
    const list = (hit && hit.subtitles) || [];
    if (!listEl) return;
    listEl.innerHTML = "";
    const off = document.createElement("button");
    off.type = "button";
    off.textContent = "Выкл";
    off.className = captionLangPref === "off" ? "on" : "";
    off.onclick = function () {
      captionLangPref = "off";
      try {
        localStorage.setItem("amal-watch-cc-lang", "off");
      } catch (_) {}
      setCaptionMode(localVideo, "off");
      updateCaptionBtn(list, "off");
      panel.hidden = true;
    };
    listEl.appendChild(off);
    const seen = {};
    list.forEach(function (s) {
      const code = normLang(s.code);
      if (!code || seen[code]) return;
      seen[code] = 1;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent =
        langTitle(code, s.name) + (s.autoGenerated ? " · авто" : "");
      if (captionLangPref === code) b.className = "on";
      b.onclick = function () {
        captionLangPref = code;
        try {
          localStorage.setItem("amal-watch-cc-lang", code);
        } catch (_) {}
        setCaptionMode(localVideo, code);
        updateCaptionBtn(list, code);
        panel.hidden = true;
      };
      listEl.appendChild(b);
    });
    if (!list.length) {
      listEl.innerHTML =
        "<p>Пока нет дорожек — включи «Чистый экран», чтобы подтянуть перевод.</p>";
    }
    panel.hidden = false;
  }

  function setYtChromeTip(show) {
    let tip = document.getElementById("ytChromeTip");
    if (!show) {
      if (tip) tip.hidden = true;
      if (viewChannel) viewChannel.classList.remove("yt-chrome");
      return;
    }
    if (!tip && playerBox) {
      tip = document.createElement("div");
      tip.id = "ytChromeTip";
      tip.className = "yt-chrome-tip";
      tip.innerHTML =
        '<button type="button" id="btnCleanScreen" class="accent">🎬 Чистый экран</button>' +
        "<p>Убрать титры по бокам, шайбу, субтитры и значок паузы</p>";
      playerBox.appendChild(tip);
      tip.querySelector("#btnCleanScreen").onclick = function () {
        forceCleanScreen();
      };
    }
    if (tip) tip.hidden = false;
    if (viewChannel) viewChannel.classList.add("yt-chrome");
  }

  function setCinemaPure(on) {
    if (viewChannel) viewChannel.classList.toggle("cinema-pure", !!on);
    if (playerBox) playerBox.classList.toggle("cinema-pure", !!on);
  }

  function forceCleanScreen() {
    usingNoAds = true;
    savePlayerPref();
    setAltBtnLabel();
    if (!currentPlayId) return;
    const title =
      (nowPlaying && nowPlaying.textContent
        ? nowPlaying.textContent.replace(/^Сейчас:\s*/, "")
        : "Ролик") || "Ролик";
    const id = currentPlayId;
    const btn = document.getElementById("btnCleanScreen");
    const floatBtn = document.getElementById("btnFloatNoAds");
    if (btn) btn.textContent = "⏳ Убираю…";
    if (floatBtn) floatBtn.textContent = "⏳ Убираю…";
    const hit = streamCache[id];
    if (hit && Date.now() - hit.t < STREAM_CACHE_MS && hit.url) {
      playGen++;
      const gen = playGen;
      currentPlayId = id;
      applyCleanStream(hit.url, gen, id);
      if (btn) btn.textContent = "🎬 Чистый экран";
      if (floatBtn) floatBtn.textContent = "🎬 Чистый экран";
      return;
    }
    playId(id, title, {
      channelId: currentChannel && currentChannel.id,
    });
    setTimeout(function () {
      if (btn) btn.textContent = "🎬 Чистый экран";
      if (floatBtn) floatBtn.textContent = "🎬 Чистый экран";
    }, 1600);
  }

  function applyCleanStream(url, gen, videoId) {
    if (gen !== playGen) return;
    if (videoId && currentPlayId !== videoId) return;
    clearAdRescue();
    bindLocalVideoRescue();
    ytFrame.hidden = true;
    ytFrame.src = "about:blank";
    playerPh.hidden = true;
    localVideo.hidden = false;
    if (localVideo.src !== url) {
      localVideo.src = url;
    }
    localVideo.play().catch(function () {
      // автоплей блокируют — покажем YouTube
      showYtFallback(videoId, gen);
    });
    const hit = videoId && streamCache[videoId];
    attachCaptions(localVideo, (hit && hit.subtitles) || []);
    usingNoAds = true;
    setYtChromeTip(false);
    setCinemaPure(true);
    try {
      savePlayerPref();
    } catch (_) {}
    // если за 5 сек так и нет кадров — запасной YouTube
    setTimeout(function () {
      if (gen !== playGen || currentPlayId !== videoId) return;
      if (!localVideo.hidden && localVideo.readyState < 2) {
        if (streamCache[videoId]) delete streamCache[videoId];
        embedHostFlip++;
        showYtFallback(videoId, gen);
      }
    }, 5000);
  }

  const viewHome = document.getElementById("viewHome");
  const viewChannel = document.getElementById("viewChannel");
  const viewShorts = document.getElementById("viewShorts");
  const viewMine = document.getElementById("viewMine");
  const btnHome = document.getElementById("btnHome");
  const btnShorts = document.getElementById("btnShorts");
  const btnMine = document.getElementById("btnMine");
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
  // по умолчанию сразу плеер без рекламы YouTube
  let usingNoAds = true;
  try {
    const pref = localStorage.getItem("amal-watch-player");
    if (pref === "yt") usingNoAds = false;
    if (pref === "noads") usingNoAds = true;
  } catch (_) {}
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

  /** Запикивание мата в текстах (названия, комменты, титры). */
  const BEEP_KEY = "amal-watch-beep-v1";
  let beepOn = true;
  try {
    const saved = localStorage.getItem(BEEP_KEY);
    if (saved === "0") beepOn = false;
    if (saved === "1") beepOn = true;
  } catch (_) {}
  let lastBeepAt = 0;
  // Частые «плохие» слова (RU + EN). Слово → ■■■ + короткий бип.
  const BEEP_RE =
    /(^|[^а-яёa-z0-9])((?:бля(?:ть|д\w*)?|сука|сучк\w*|хуй\w*|хуё\w*|хуе\w*|пизд\w*|ёб\w*|еб(?:ать|анул\w*|лан\w*|ись|ётся|ёт)|мудак\w*|гандон\w*|дроч\w*|говн\w*|дерьм\w*|fuck(?:ing|ed|er)?|shit|bitch|asshole|cunt|dick))(?=[^а-яёa-z0-9]|$)/gi;

  function setBeepOn(on) {
    beepOn = !!on;
    try {
      localStorage.setItem(BEEP_KEY, beepOn ? "1" : "0");
    } catch (_) {}
    const btn = document.getElementById("btnFloatBeep");
    if (btn) {
      btn.textContent = beepOn ? "🔇 Бип вкл" : "🔊 Бип выкл";
      btn.title = beepOn
        ? "Мат запикивается (нажми, чтобы выключить)"
        : "Запикивание выкл (нажми, чтобы включить)";
      btn.classList.toggle("accent", beepOn);
    }
  }

  function playBeepSound() {
    const now = Date.now();
    if (now - lastBeepAt < 280) return;
    lastBeepAt = now;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!playBeepSound._ctx) playBeepSound._ctx = new Ctx();
      const ctx = playBeepSound._ctx;
      if (ctx.state === "suspended") ctx.resume().catch(function () {});
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 780;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = ctx.currentTime;
      o.start(t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);
      o.stop(t0 + 0.12);
    } catch (_) {}
  }

  function beepText(s, withSound) {
    const raw = String(s == null ? "" : s);
    if (!beepOn || !raw) return raw;
    let hit = false;
    BEEP_RE.lastIndex = 0;
    const out = raw.replace(BEEP_RE, function (_m, lead) {
      hit = true;
      return (lead || "") + "■■■";
    });
    if (hit && withSound) playBeepSound();
    return out;
  }

  function displayText(s) {
    return escapeHtml(beepText(s, false));
  }

  function isLiveVideo(v) {
    if (!v) return false;
    if (v.live) return true;
    if (v.duration === -1) return true;
    return false;
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

  function embedUrl(id, autoplay) {
    const ap = autoplay === false ? "0" : "1";
    const host = embedHostFlip % 2 === 0 ? EMBED_WORKS : EMBED_YT;
    return (
      host +
      encodeURIComponent(id) +
      "?rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&playsinline=1&autoplay=" +
      ap
    );
  }

  function showYtFallback(id, gen) {
    if (gen !== playGen || currentPlayId !== id) return;
    playerPh.hidden = true;
    localVideo.hidden = true;
    localVideo.removeAttribute("src");
    try {
      localVideo.load();
    } catch (_) {}
    ytFrame.hidden = false;
    ytFrame.src = embedUrl(id, true);
    setCinemaPure(false);
    setYtChromeTip(true);
    startAdRescue(id, gen);
  }

  function bindLocalVideoRescue() {
    if (!localVideo || localVideo.dataset.rescueBound === "1") return;
    localVideo.dataset.rescueBound = "1";
    localVideo.addEventListener("error", function () {
      const id = currentPlayId;
      if (!id || id.indexOf("duo-") === 0) return;
      if (streamCache[id]) delete streamCache[id];
      embedHostFlip++;
      showToast("↻ Поток не открылся — пробую другой способ…");
      showYtFallback(id, playGen);
    });
    localVideo.addEventListener("stalled", function () {
      if (!localVideo.hidden && localVideo.readyState < 2) {
        // тихо пробуем догрузить
        try {
          localVideo.load();
          localVideo.play().catch(function () {});
        } catch (_) {}
      }
    });
  }

  function pickStreamFromPiped(data) {
    if (!data) return null;
    const streams = (data.videoStreams || []).filter(function (s) {
      return s && s.url && s.videoOnly === false;
    });
    if (!streams.length) return data.hls || null;
    streams.sort(function (a, b) {
      function score(s) {
        const q = parseInt(s.quality, 10) || 0;
        // средние качества стартуют быстрее тяжёлого 1080p
        if (q >= 360 && q <= 720) return 2000 + q;
        return q;
      }
      return score(b) - score(a);
    });
    return streams[0].url;
  }

  function pickStreamFromInv(data) {
    if (!data) return null;
    const formats = data.formatStreams || [];
    if (!formats.length) return null;
    // берём не самый огромный — быстрее старт
    const mid = formats[Math.min(formats.length - 1, Math.max(0, formats.length - 2))];
    return (mid && mid.url) || formats[formats.length - 1].url || null;
  }

  function pickSubsFromPiped(data) {
    return (data && data.subtitles ? data.subtitles : [])
      .map(function (s) {
        return {
          url: s.url,
          name: s.name || s.code || "CC",
          code: s.code || "",
          autoGenerated: !!s.autoGenerated,
        };
      })
      .filter(function (s) {
        return !!s.url;
      });
  }

  function pickSubsFromInv(data, base) {
    return (data && data.captions ? data.captions : [])
      .map(function (c) {
        let url = c.url || "";
        if (url && url.indexOf("http") !== 0) url = base + url;
        return {
          url: url,
          name: c.label || c.language_code || "CC",
          code: c.language_code || "",
          autoGenerated: /auto/i.test(c.label || ""),
        };
      })
      .filter(function (s) {
        return !!s.url;
      });
  }

  function fetchWithTimeout(url, ms) {
    return fetch(url, { signal: AbortSignal.timeout(ms || 4500) });
  }

  /** Параллельно зеркала — первое живое (url + субтитры в кэше). */
  function fetchDirectStream(videoId) {
    const hit = streamCache[videoId];
    if (hit && Date.now() - hit.t < STREAM_CACHE_MS && hit.url) {
      return Promise.resolve(hit.url);
    }

    const jobs = [];
    PIPED_APIS.forEach(function (base) {
      jobs.push(
        fetchWithTimeout(base + "/streams/" + encodeURIComponent(videoId), 4500)
          .then(function (res) {
            if (!res.ok) throw new Error("bad");
            return res.json();
          })
          .then(function (data) {
            return {
              url: pickStreamFromPiped(data),
              subtitles: pickSubsFromPiped(data),
            };
          })
      );
    });
    INV_APIS.forEach(function (base) {
      jobs.push(
        fetchWithTimeout(base + "/api/v1/videos/" + encodeURIComponent(videoId), 4500)
          .then(function (res) {
            if (!res.ok) throw new Error("bad");
            return res.json();
          })
          .then(function (data) {
            return {
              url: pickStreamFromInv(data),
              subtitles: pickSubsFromInv(data, base),
            };
          })
      );
    });

    return new Promise(function (resolve) {
      let pending = jobs.length;
      let finished = false;
      if (!pending) {
        resolve(null);
        return;
      }
      jobs.forEach(function (job) {
        job
          .then(function (pack) {
            if (finished) return;
            const url = pack && pack.url;
            if (!url) {
              pending--;
              if (pending <= 0) resolve(null);
              return;
            }
            finished = true;
            streamCache[videoId] = {
              url: url,
              subtitles: (pack && pack.subtitles) || [],
              t: Date.now(),
            };
            resolve(url);
          })
          .catch(function () {
            if (finished) return;
            pending--;
            if (pending <= 0) resolve(null);
          });
      });
    });
  }

  function prefetchStream(videoId) {
    if (!videoId || videoId === "playlist") return;
    const hit = streamCache[videoId];
    if (hit && Date.now() - hit.t < STREAM_CACHE_MS) return;
    fetchDirectStream(videoId).catch(function () {});
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

  function savePlayerPref() {
    try {
      localStorage.setItem("amal-watch-player", usingNoAds ? "noads" : "yt");
    } catch (_) {}
  }

  function setAltBtnLabel() {
    const alt = document.getElementById("btnAltPlayer");
    if (alt) {
      alt.textContent = usingNoAds
        ? "Обычный YouTube"
        : "🚫 Без рекламы";
    }
  }

  function ensurePlayerTools() {
    ensureWatchFloat();
    if (document.getElementById("playerTools")) return;
    const bar = document.createElement("div");
    bar.id = "playerTools";
    bar.className = "player-tools";
    bar.innerHTML =
      '<button type="button" id="btnAltPlayer" class="sub-btn accent-ad"></button>' +
      '<button type="button" id="btnToMenu" class="sub-btn">📋 К меню</button>' +
      '<span id="vidCountLabel" class="stat"></span>';
    if (playerBox && playerBox.parentNode) {
      playerBox.parentNode.insertBefore(bar, playerBox.nextSibling);
    }
    setAltBtnLabel();
    document.getElementById("btnAltPlayer").onclick = function () {
      if (!currentPlayId) return;
      usingNoAds = !usingNoAds;
      savePlayerPref();
      setAltBtnLabel();
      const title =
        (nowPlaying && nowPlaying.textContent
          ? nowPlaying.textContent.replace(/^Сейчас:\s*/, "")
          : "Ролик") || "Ролик";
      playId(currentPlayId, title, {
        channelId: currentChannel && currentChannel.id,
      });
    };
    document.getElementById("btnToMenu").onclick = function () {
      setWatching(false);
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

  let shortsChannelFilter = "";

  function renderShortsFilters() {
    const box = document.getElementById("shortsFilters");
    if (!box) return;
    const counts = {};
    collectShorts().forEach(function (item) {
      counts[item.ch.id] = (counts[item.ch.id] || 0) + 1;
    });
    const ids = Object.keys(counts);
    box.innerHTML = "";
    const all = document.createElement("button");
    all.type = "button";
    all.className = "shorts-chip" + (!shortsChannelFilter ? " on" : "");
    all.textContent = "Все";
    all.onclick = function () {
      shortsChannelFilter = "";
      buildShortsFeed();
    };
    box.appendChild(all);
    ids.slice(0, 14).forEach(function (id) {
      const ch = findChannel(id);
      if (!ch) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "shorts-chip" + (shortsChannelFilter === id ? " on" : "");
      b.textContent = ch.name + " · " + counts[id];
      b.onclick = function () {
        shortsChannelFilter = id;
        buildShortsFeed();
      };
      box.appendChild(b);
    });
  }

  /** Лента как Shorts: Shorts + обычные ролики, листаешь без канала */
  function collectSwipeFeed() {
    let shorts = collectShorts().filter(function (item) {
      return item && item.v && item.v.id && !shortFailIds[item.v.id];
    });
    if (shortsChannelFilter) {
      shorts = shorts.filter(function (item) {
        return item.ch && item.ch.id === shortsChannelFilter;
      });
      return shorts.slice(0, 80);
    }
    const rest = [];
    const seen = {};
    shorts.forEach(function (item) {
      seen[item.v.id] = 1;
    });
    CHANNELS.forEach(function (ch) {
      if (ch.allowUpload) return;
      realVideos(ch).forEach(function (v, i) {
        if (!v || !v.id || seen[v.id] || shortFailIds[v.id]) return;
        if (i > 14) return;
        seen[v.id] = 1;
        rest.push({ ch: ch, v: v });
      });
    });
    rest.sort(function (a, b) {
      return ((a.v.id.charCodeAt(0) + a.v.id.charCodeAt(2)) % 7) - ((b.v.id.charCodeAt(0) + b.v.id.charCodeAt(2)) % 7);
    });
    return shorts.concat(rest).slice(0, 80);
  }

  function stopShortsPlayers() {
    if (!shortsFeed) return;
    shortsFeed.querySelectorAll("video.shorts-vid").forEach(function (vid) {
      try {
        vid.pause();
        vid.removeAttribute("src");
        vid.load();
      } catch (_) {}
    });
    shortsFeed.querySelectorAll("iframe").forEach(function (fr) {
      fr.src = "";
    });
  }

  const shortFailIds = {};

  function markShortFail(id) {
    if (id) shortFailIds[id] = 1;
  }

  function skipBrokenShort(slide, reason) {
    if (!slide) return;
    const loadEl = slide.querySelector(".shorts-loading");
    const video = slide.querySelector("video.shorts-vid");
    const fr = slide.querySelector("iframe.shorts-fallback");
    if (video) {
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch (_) {}
      video.hidden = false;
    }
    if (fr) {
      fr.src = "";
      fr.hidden = true;
    }
    if (loadEl) {
      loadEl.hidden = false;
      loadEl.textContent = reason || "⏭ Это видео нельзя тут — дальше…";
    }
    clearTimeout(slide._skipT);
    slide._skipT = setTimeout(function () {
      if (loadEl) loadEl.hidden = true;
      goShortBy(1);
    }, 700);
  }

  /** Один шорт в ленте — свой <video>, без ухода на YouTube */
  function playShortSlide(slide) {
    if (!slide || !shortsFeed) return;
    const video = slide.querySelector("video.shorts-vid");
    const vid = slide.dataset.vid;
    const loadEl = slide.querySelector(".shorts-loading");
    if (!video || !vid) return;

    // уже знаем, что это видео запрещено / битое — сразу дальше
    if (shortFailIds[vid]) {
      skipBrokenShort(slide);
      return;
    }

    shortsFeed.querySelectorAll("video.shorts-vid").forEach(function (other) {
      if (other === video) return;
      try {
        other.pause();
        other.removeAttribute("src");
        other.load();
      } catch (_) {}
    });
    // прячем старый iframe-фолбэк, если был
    shortsFeed.querySelectorAll("iframe.shorts-fallback").forEach(function (fr) {
      fr.src = "";
      fr.hidden = true;
    });
    video.hidden = false;

    function showLoad(on, text) {
      if (!loadEl) return;
      loadEl.hidden = !on;
      if (on) loadEl.textContent = text || "⏳ Загрузка…";
    }

    function startUrl(url) {
      if (!url || slide.dataset.vid !== vid) return;
      showLoad(false);
      video.onerror = function () {
        if (slide.dataset.vid !== vid) return;
        markShortFail(vid);
        skipBrokenShort(slide, "⏭ Ролик не открылся — дальше…");
      };
      if (video.getAttribute("src") !== url) {
        video.src = url;
      }
      video.play().catch(function () {});
      try {
        const tracks = video.textTracks;
        if (tracks) {
          for (let i = 0; i < tracks.length; i++) tracks[i].mode = "disabled";
        }
      } catch (_) {}
    }

    const hit = streamCache[vid];
    if (hit && Date.now() - hit.t < STREAM_CACHE_MS && hit.url) {
      startUrl(hit.url);
      fetchDirectStream(vid).catch(function () {});
      return;
    }

    showLoad(true, "⏳ Без рекламы…");
    fetchDirectStream(vid).then(function (url) {
      if (slide.dataset.vid !== vid) return;
      if (url) {
        startUrl(url);
        return;
      }
      // YouTube-встройка часто «запрещена владельцем» — не показываем её, идём дальше
      markShortFail(vid);
      skipBrokenShort(
        slide,
        "⏭ Владелец запретил встройку — следующий…"
      );
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
          displayText(c.who) +
          '</span><span class="when">' +
          escapeHtml(c.when) +
          "</span><p>" +
          displayText(c.text) +
          "</p></div>"
        );
      })
      .join("");
  }

  function addComment(who, text) {
    if (!currentVideoKey || !text.trim()) return;
    const cleaned = beepText(text.trim().slice(0, 400), true);
    if (!comments[currentVideoKey]) comments[currentVideoKey] = [];
    comments[currentVideoKey].push({
      who: beepText((who || "Гость").trim().slice(0, 24) || "Гость", false),
      text: cleaned,
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
    if (ytFrame) ytFrame.style.pointerEvents = "auto";
    if (localVideo) localVideo.style.pointerEvents = "auto";
    const tip = document.getElementById("panOverlay");
    if (tip) tip.hidden = true;
  }

  function setZoom(z) {
    zoom = Math.max(1, Math.min(4, z));
    if (zoom <= 1.001) {
      zoom = 1;
      panX = 0;
      panY = 0;
    }
    applyTransform();
    const zlab = document.getElementById("zoomLabel");
    if (zlab) zlab.textContent = Math.round(zoom * 100) + "%";
    if (ytFrame) ytFrame.style.pointerEvents = zoom > 1 ? "none" : "auto";
    if (localVideo) localVideo.style.pointerEvents = zoom > 1 ? "none" : "auto";
    let tip = document.getElementById("panOverlay");
    if (zoom > 1) {
      if (!tip && playerBox) {
        tip = document.createElement("div");
        tip.id = "panOverlay";
        tip.className = "pan-overlay";
        tip.style.pointerEvents = "none";
        playerBox.appendChild(tip);
      }
      if (tip) tip.hidden = false;
    } else if (tip) tip.hidden = true;
  }

  function togglePlayerFullscreen() {
    const el = playerBox || document.documentElement;
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (el.requestFullscreen) {
        el.requestFullscreen();
      }
    } catch (_) {}
  }

  function showToast(msg, ms) {
    let t = document.getElementById("amalToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "amalToast";
      t.className = "amal-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._hide);
    t._hide = setTimeout(function () {
      t.classList.remove("show");
    }, ms || 2400);
  }

  let autoQueue = [];
  let autoQueuePos = -1;

  function startChannelQueue(ch, fromId) {
    if (!ch) return;
    autoQueue = realVideos(ch);
    autoQueuePos = 0;
    if (fromId) {
      const i = autoQueue.findIndex(function (v) {
        return v.id === fromId;
      });
      if (i >= 0) autoQueuePos = i;
    }
    const v = autoQueue[autoQueuePos];
    if (!v) {
      showToast("Пока нет роликов в списке");
      return;
    }
    showToast("▶ Смотрим подряд · " + (autoQueuePos + 1) + "/" + autoQueue.length);
    playVideoObj(ch, v);
  }

  function playNextInQueue() {
    if (!autoQueue.length || autoQueuePos < 0) return;
    if (autoQueuePos >= autoQueue.length - 1) {
      showToast("✓ Все ролики из списка просмотрены");
      return;
    }
    autoQueuePos++;
    const v = autoQueue[autoQueuePos];
    if (!v || !currentChannel) return;
    showToast("⏭ Дальше · " + (autoQueuePos + 1) + "/" + autoQueue.length);
    playVideoObj(currentChannel, v);
  }

  function setWatching(on) {
    if (viewChannel) viewChannel.classList.toggle("watching", !!on);
  }

  function setMenuTab(tab) {
    const menu = document.getElementById("channelMenu");
    if (!menu) return;
    menu.dataset.tab = tab === "comments" ? "comments" : "videos";
    const tVideos = document.getElementById("tabVideos");
    const tComments = document.getElementById("tabComments");
    if (tVideos) tVideos.classList.toggle("on", menu.dataset.tab === "videos");
    if (tComments) tComments.classList.toggle("on", menu.dataset.tab === "comments");
  }

  function ensureWatchFloat() {
    if (document.getElementById("watchFloat")) return;
    const wrap = document.createElement("div");
    wrap.id = "watchFloat";
    wrap.className = "watch-float";
    wrap.innerHTML =
      '<button type="button" id="btnFloatMenu">📋 Ролики</button>' +
      '<button type="button" id="btnFloatComments">💬</button>' +
      '<button type="button" id="btnFloatNext">⏭</button>' +
      '<button type="button" id="btnFloatFs">⛶</button>' +
      '<button type="button" class="accent" id="btnFloatNoAds">🎬 Чистый экран</button>' +
      '<button type="button" id="btnFloatCc">🌐 Перевод</button>' +
      '<button type="button" id="btnFloatBeep">🔇 Бип вкл</button>' +
      '<button type="button" id="btnFloatExtra">⋯</button>';
    if (playerBox) playerBox.appendChild(wrap);
    document.getElementById("btnFloatMenu").onclick = function () {
      setWatching(false);
      setMenuTab("videos");
      const menu = document.getElementById("channelMenu");
      if (menu) menu.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.getElementById("btnFloatComments").onclick = function () {
      setWatching(false);
      setMenuTab("comments");
      const box = document.getElementById("commentsBox");
      if (box) box.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.getElementById("btnFloatNext").onclick = function () {
      playNextInQueue();
    };
    document.getElementById("btnFloatFs").onclick = function () {
      togglePlayerFullscreen();
    };
    document.getElementById("btnFloatNoAds").onclick = function () {
      forceCleanScreen();
    };
    document.getElementById("btnFloatCc").onclick = function () {
      const panel = document.getElementById("captionPanel");
      if (panel && !panel.hidden) {
        panel.hidden = true;
        return;
      }
      openCaptionPicker();
    };
    document.getElementById("btnFloatBeep").onclick = function () {
      setBeepOn(!beepOn);
      showToast(
        beepOn
          ? "🔇 Мат запикивается в названиях, комментах и титрах"
          : "🔊 Запикивание выключено"
      );
    };
    setBeepOn(beepOn);
    document.getElementById("btnFloatExtra").onclick = function () {
      document.body.classList.toggle("show-extra-panels");
    };
  }

  function ensureZoomBar() {
    ensureWatchFloat();
    if (document.getElementById("zoomBar")) return;
    const bar = document.createElement("div");
    bar.id = "zoomBar";
    bar.className = "zoom-bar";
    bar.innerHTML =
      '<button type="button" id="zoomOut">−</button>' +
      '<span id="zoomLabel">100%</span>' +
      '<button type="button" id="zoomIn">+</button>' +
      '<button type="button" id="zoomReset">1×</button>' +
      '<span class="zoom-tip">зум</span>';
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
    clearAdRescue();
    playGen++;
    ytFrame.hidden = true;
    ytFrame.src = "about:blank";
    localVideo.hidden = true;
    localVideo.pause();
    localVideo.removeAttribute("src");
    try {
      localVideo.load();
    } catch (_) {}
    hideStoryPlayer();
    playerPh.hidden = false;
    playerPh.textContent = "▶ Выбери видео из меню ниже";
    currentPlayId = "";
    setYtChromeTip(false);
    setCinemaPure(false);
    setWatchTitle("");
    resetZoom();
  }

  function playId(id, title, opts) {
    opts = opts || {};
    ensureZoomBar();
    ensurePlayerTools();
    stopAllMedia();
    const gen = ++playGen;
    currentPlayId = id;
    const playObj = { id: id, title: title };
    ensureTitleRu(playObj).then(function (ru) {
      if (currentPlayId !== id) return;
      const safeTitle = beepText(ru || title, false);
      nowPlaying.textContent = "Сейчас: " + safeTitle;
      setWatchTitle(safeTitle);
      if (tvHint) {
        tvHint.textContent = (opts.live ? "🔴 Эфир · " : "▶ ") + safeTitle;
      }
    });
    const safeTitle = beepText(shownTitle(playObj), false);
    nowPlaying.textContent = "Сейчас: " + safeTitle;
    setWatchTitle(safeTitle);
    currentVideoKey = (opts.channelId || "") + "::" + id;
    currentLikesLabel = formatLikes(opts.likesLabel);
    refreshLikeUi();
    renderComments();
    setAltBtnLabel();
    setWatching(true);
    document.body.classList.remove("show-extra-panels");
    if (tvHint) {
      tvHint.textContent = (opts.live ? "🔴 Эфир · " : "▶ ") + safeTitle;
    }
    if (opts.live) showToast("🔴 Прямой эфир — смотрим внутри приложения");

    // 1) кэш — сразу без рекламы
    const cached = streamCache[id];
    if (cached && Date.now() - cached.t < STREAM_CACHE_MS && cached.url) {
      applyCleanStream(cached.url, gen, id);
      fetchDirectStream(id).catch(function () {});
      return;
    }

    // 2) ищем чистый поток; YouTube только как мост, и сами с него уйдём
    playerPh.hidden = false;
    playerPh.textContent = "⏳ Без рекламы…";
    ytFrame.hidden = true;
    localVideo.hidden = true;

    let settled = false;
    const bridgeTimer = setTimeout(function () {
      if (settled || gen !== playGen || currentPlayId !== id) return;
      showYtFallback(id, gen);
    }, 2800);

    fetchDirectStream(id).then(function (url) {
      if (gen !== playGen || currentPlayId !== id) return;
      if (url) {
        settled = true;
        clearTimeout(bridgeTimer);
        applyCleanStream(url, gen, id);
        return;
      }
      settled = true;
      clearTimeout(bridgeTimer);
      embedHostFlip++;
      showYtFallback(id, gen);
      if (tvHint) tvHint.textContent = "↻ Чистого потока нет — смотри через YouTube. Жми другое видео, если чёрный экран.";
    });
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
    setWatchTitle(title);
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
    setWatchTitle(title);
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
    if (v.story) return playStory(ch, v);
    if (v.playlist || v.id === "playlist") {
      showToast("⏳ Гружу все ролики канала…");
      loadAllFromChannel(ch).then(function () {
        startChannelQueue(ch, null);
        setMenuTab("videos");
        showToast("▶ Все ролики — смотрим подряд");
      });
      return;
    }
    if (currentChannel && currentChannel.id === ch.id) {
      autoQueue = realVideos(ch);
      autoQueuePos = Math.max(
        0,
        autoQueue.findIndex(function (x) {
          return x.id === v.id;
        })
      );
    }
    playId(v.id, v.title || "Ролик", {
      channelId: ch.id,
      likesLabel: v.likes,
      live: isLiveVideo(v),
    });
  }

  function hideStoryPlayer() {
    const box = document.getElementById("storyPlayer");
    if (box) box.hidden = true;
  }

  function playStory(ch, v) {
    ensureZoomBar();
    ensurePlayerTools();
    stopAllMedia();
    hideStoryPlayer();
    const pages = (v.pages || []).slice();
    if (!pages.length) pages.push(v.title || "Серия");
    let page = 0;
    currentPlayId = v.id;
    currentVideoKey = "duo::" + v.id;
    currentLikesLabel = "∞";
    const title = beepText(v.title || "Серия", false);
    nowPlaying.textContent = "Сейчас: " + title;
    setWatchTitle(title);
    if (tvHint) tvHint.textContent = "✦ Наш канал · " + title;
    playerPh.hidden = true;
    ytFrame.hidden = true;
    localVideo.hidden = true;
    setCinemaPure(true);
    setWatching(true);
    refreshLikeUi();
    renderComments();

    let box = document.getElementById("storyPlayer");
    if (!box && playerBox) {
      box = document.createElement("div");
      box.id = "storyPlayer";
      box.className = "story-player";
      playerBox.appendChild(box);
    }
    if (!box) return;

    function paint() {
      const openBtn = v.openWeTwo
        ? '<a class="story-link" href="../we-two/">Открыть уголок ✦</a>'
        : "";
      box.hidden = false;
      box.innerHTML =
        '<div class="story-inner">' +
        '<div class="story-badge">✦ Мы с тобой</div>' +
        "<h3>" +
        escapeHtml(title) +
        "</h3>" +
        '<p class="story-page">' +
        escapeHtml(pages[page] || "") +
        "</p>" +
        '<div class="story-nav">' +
        '<button type="button" id="storyPrev"' +
        (page <= 0 ? " disabled" : "") +
        ">←</button>" +
        '<span>' +
        (page + 1) +
        " / " +
        pages.length +
        "</span>" +
        '<button type="button" id="storyNext">' +
        (page >= pages.length - 1 ? "✓" : "→") +
        "</button>" +
        "</div>" +
        openBtn +
        '<p class="story-foot">Канал Амаля и Курсора · внутри Смотри</p>' +
        "</div>";
      const prev = document.getElementById("storyPrev");
      const next = document.getElementById("storyNext");
      if (prev)
        prev.onclick = function () {
          if (page > 0) {
            page -= 1;
            paint();
          }
        };
      if (next)
        next.onclick = function () {
          if (page < pages.length - 1) {
            page += 1;
            paint();
          } else {
            showToast("✦ Серия просмотрена");
            playNextInQueue();
          }
        };
    }
    paint();
    showToast("✦ Наша серия — листай стрелками");
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
    if (viewMine) viewMine.classList.toggle("active", name === "mine");
    btnHome.hidden = name === "home";
    if (btnShorts) btnShorts.hidden = name === "shorts";
    if (btnMine) btnMine.hidden = name === "mine";
  }

  function openHome() {
    currentChannel = null;
    setWatching(false);
    document.body.classList.remove("show-extra-panels");
    showView("home");
  }

  function mineNick() {
    if (mineCh.gameNick && String(mineCh.gameNick).trim()) {
      return String(mineCh.gameNick).trim().slice(0, 24);
    }
    try {
      if (window.AmalHub && AmalHub.getNick) {
        const n = AmalHub.getNick();
        if (n) return n;
      }
    } catch (_) {}
    return "Друг";
  }

  function playAwardAnim(b) {
    let overlay = document.getElementById("awardAnim");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "awardAnim";
      overlay.className = "award-anim";
      document.body.appendChild(overlay);
    }
    overlay.className = "award-anim show " + (b.cls || "");
    overlay.innerHTML =
      '<div class="award-anim-card">' +
      '<div class="award-burst"></div>' +
      "<strong>" +
      escapeHtml(b.name) +
      "</strong>" +
      "<p>Кнопка для «" +
      escapeHtml(mineNick()) +
      "»</p>" +
      '<button type="button" class="btn accent" id="awardAnimClose">Ещё раз / закрыть</button>' +
      "</div>";
    overlay.hidden = false;
    clearTimeout(overlay._t);
    const close = function () {
      overlay.classList.remove("show");
      overlay.hidden = true;
    };
    const closeBtn = document.getElementById("awardAnimClose");
    if (closeBtn) {
      closeBtn.onclick = function () {
        // повтор анимации
        overlay.classList.remove("show");
        void overlay.offsetWidth;
        overlay.classList.add("show");
        clearTimeout(overlay._t);
        overlay._t = setTimeout(close, 4200);
      };
      closeBtn.ondblclick = close;
    }
    overlay.onclick = function (e) {
      if (e.target === overlay) close();
    };
    overlay._t = setTimeout(close, 4200);
  }

  function bumpMine(n) {
    const before = mineCh.subs || 0;
    mineCh.subs = Math.min(999999, before + (n | 0));
    ACHS.forEach(function (a) {
      if (!mineCh.achievements[a.id] && a.check(mineCh)) mineCh.achievements[a.id] = Date.now();
    });
    // если только что открыли новую кнопку — показать анимацию самой сильной новой
    let best = null;
    PLAY_BUTTONS.forEach(function (b) {
      if (before < b.need && mineCh.subs >= b.need) best = b;
    });
    saveMineCh();
    renderMine();
    if (best) playAwardAnim(best);
  }

  function renderMine() {
    const nick = mineNick();
    const nickEl = document.getElementById("mineNick");
    const subsEl = document.getElementById("mineSubs");
    const gift = document.getElementById("mineGift");
    const gameNickIn = document.getElementById("mineGameNick");
    if (nickEl) nickEl.textContent = nick;
    if (subsEl) subsEl.textContent = String(mineCh.subs || 0);
    if (gameNickIn && document.activeElement !== gameNickIn) {
      gameNickIn.value = mineCh.gameNick || "";
    }
    if (gift) {
      gift.textContent = mineCh.giftOpened
        ? "🎁 Для " + nick + " · именной подарок"
        : "🎁 Подарок с твоим именем";
    }
    const club = document.getElementById("mineClub");
    if (club) {
      const open = (mineCh.subs || 0) >= CLUB_NEED;
      club.hidden = false;
      club.className = "mine-club" + (open ? " open" : " locked");
      club.innerHTML = open
        ? "<h3>🏠 Клуб «" +
          escapeHtml(nick) +
          "»</h3><p>Твой именной клуб на сайте — за " +
          CLUB_NEED +
          "+ подписчиков. Сюда можно возвращаться и смотреть кнопки снова.</p>"
        : "<h3>🔒 Клуб закроется позже</h3><p>Нужно " +
          CLUB_NEED +
          " подписчиков. Сейчас: " +
          (mineCh.subs || 0) +
          ". Имя клуба = твоё игровое имя.</p>";
    }
    const row = document.getElementById("mineButtons");
    if (row) {
      row.innerHTML = "";
      PLAY_BUTTONS.forEach(function (b) {
        const unlocked = (mineCh.subs || 0) >= b.need;
        const hidden = !!(mineCh.hiddenButtons && mineCh.hiddenButtons[b.id]);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "play-award " +
          b.cls +
          (unlocked ? "" : " locked") +
          (hidden && unlocked ? " hidden-award" : "");
        btn.innerHTML =
          "<strong>" +
          b.name +
          "</strong><small>" +
          (unlocked
            ? hidden
              ? "спрятана · жми показать"
              : "жми — снова анимация"
            : "нужно " + b.need) +
          "</small>";
        btn.disabled = !unlocked;
        btn.addEventListener("click", function () {
          if (!unlocked) return;
          // длинный клик/второй режим: спрятать; обычный — пересмотреть анимацию
          if (btn.dataset.mode === "hide") {
            mineCh.hiddenButtons = mineCh.hiddenButtons || {};
            mineCh.hiddenButtons[b.id] = !mineCh.hiddenButtons[b.id];
            saveMineCh();
            renderMine();
            return;
          }
          playAwardAnim(b);
        });
        btn.addEventListener("contextmenu", function (e) {
          e.preventDefault();
          if (!unlocked) return;
          mineCh.hiddenButtons = mineCh.hiddenButtons || {};
          mineCh.hiddenButtons[b.id] = !mineCh.hiddenButtons[b.id];
          saveMineCh();
          renderMine();
        });
        row.appendChild(btn);
      });
    }
    const ach = document.getElementById("mineAch");
    if (ach) {
      ach.innerHTML = "";
      ACHS.forEach(function (a) {
        const done = !!mineCh.achievements[a.id] || a.check(mineCh);
        const div = document.createElement("div");
        div.className = "ach" + (done ? " done" : "");
        div.textContent = (done ? "✅ " : "⬜ ") + a.title;
        ach.appendChild(div);
      });
    }
    const grid = document.getElementById("mineGrid");
    if (grid) {
      grid.innerHTML = "";
      if (!myVideos.length) {
        grid.innerHTML =
          '<p style="color:#999;font-size:13px">Пока нет своих роликов — загрузи выше.</p>';
      } else {
        myVideos.forEach(function (v) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "vid-card";
          btn.innerHTML = '<div class="vid-thumb">🌙</div><b></b>';
          btn.querySelector("b").textContent = v.title;
          btn.addEventListener("click", function () {
            showView("channel");
            playLocal(v.url, v.title);
          });
          grid.appendChild(btn);
        });
      }
    }
  }

  function openMine() {
    setWatching(false);
    showView("mine");
    renderMine();
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
      const badge = v.story
        ? '<span class="badge duo">✦ наша</span>'
        : isLiveVideo(v)
        ? '<span class="badge live">LIVE</span>'
        : v.streamVod
          ? '<span class="badge stream">стрим</span>'
          : v.short
            ? '<span class="badge">Shorts</span>'
            : v.part
              ? '<span class="badge">ч.' + v.part + "</span>"
              : v.playlist
                ? '<span class="badge">все</span>'
                : "";
      const likeLine = formatLikes(v.likes);
      btn.dataset.vid = v.id || "";
      btn.innerHTML =
        '<div class="vid-thumb">' +
        badge +
        thumbHtml(v.thumb, v.local ? "🌙" : ch.emoji) +
        "</div><b>" +
        displayText(shownTitle(v)) +
        "</b>" +
        (likeLine ? '<div class="vl">👍 ' + escapeHtml(likeLine) + "</div>" : '<div class="vl"></div>');
      if (isLiveVideo(v)) btn.classList.add("is-live");
      btn.addEventListener("click", function () {
        playVideoObj(ch, v);
      });
      btn.addEventListener("pointerenter", function () {
        if (v.id && v.id !== "playlist" && !v.local) prefetchStream(v.id);
      });
      videoGrid.appendChild(btn);
    });
    translateVisibleTitles(vids);

    // заранее греем первые ролики — кнопка «без рекламы» сработает мгновеннее
    let warmed = 0;
    vids.forEach(function (v) {
      if (warmed >= 8) return;
      if (!v.id || v.id === "playlist" || v.local || v.playlist || v.story) return;
      prefetchStream(v.id);
      warmed++;
    });

    if (!ch.allowUpload && ch.channelId) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "vid-card load-more play-all";
      more.innerHTML =
        '<div class="vid-thumb play-all-thumb">▶</div><b>Смотреть все подряд</b><div class="vl">жёлтая кнопка · вся лента</div>';
      more.addEventListener("click", function () {
        showToast("⏳ Гружу все ролики…");
        loadAllFromChannel(ch).then(function () {
          startChannelQueue(ch, null);
        });
      });
      videoGrid.appendChild(more);
    }
  }

  function setWatchTitle(title) {
    let el = document.getElementById("watchTitle");
    if (!el && playerBox) {
      el = document.createElement("div");
      el.id = "watchTitle";
      el.className = "watch-title";
      playerBox.appendChild(el);
    }
    if (!el) return;
    const t = beepText(String(title || "").replace(/^Сейчас:\s*/, "").trim(), false);
    el.textContent = t;
    el.hidden = !t;
  }

  /** Названия всегда по-русски: если латиница — переводим и кэшируем. */
  const TITLE_RU_KEY = "amal-watch-title-ru-v1";
  let titleRuCache = {};
  try {
    titleRuCache = JSON.parse(localStorage.getItem(TITLE_RU_KEY) || "{}") || {};
  } catch (_) {
    titleRuCache = {};
  }
  function saveTitleRuCache() {
    try {
      const keys = Object.keys(titleRuCache);
      if (keys.length > 400) {
        keys.slice(0, keys.length - 300).forEach(function (k) {
          delete titleRuCache[k];
        });
      }
      localStorage.setItem(TITLE_RU_KEY, JSON.stringify(titleRuCache));
    } catch (_) {}
  }
  function looksEnglishTitle(s) {
    const t = String(s || "").trim();
    if (!t || t.length < 3) return false;
    const lat = (t.match(/[A-Za-z]/g) || []).length;
    const cyr = (t.match(/[А-Яа-яЁё]/g) || []).length;
    return lat >= 4 && lat > cyr * 1.2;
  }
  function videoTitleKey(v) {
    if (!v) return "";
    return String(v.id || v.title || "").slice(0, 80);
  }
  function shownTitle(v) {
    if (!v) return "Ролик";
    const key = videoTitleKey(v);
    if (key && titleRuCache[key]) return titleRuCache[key];
    if (v.titleRu) return v.titleRu;
    return v.title || "Ролик";
  }
  function applyRuTitleEverywhere(v, ru) {
    if (!v || !ru) return;
    v.titleRu = ru;
    const key = videoTitleKey(v);
    if (key) {
      titleRuCache[key] = ru;
      saveTitleRuCache();
    }
    // обновить видимые карточки с этим id
    if (!v.id) return;
    document.querySelectorAll(".vid-card, .feed-card, .live-card").forEach(function (card) {
      if (card.dataset.vid !== v.id) return;
      const b = card.querySelector("b");
      if (b) b.innerHTML = displayText(ru);
    });
    if (currentPlayId === v.id) {
      const safe = beepText(ru, false);
      if (nowPlaying) nowPlaying.textContent = "Сейчас: " + safe;
      setWatchTitle(safe);
    }
  }
  function ensureTitleRu(v) {
    if (!v || !v.title) return Promise.resolve(v.title || "Ролик");
    const key = videoTitleKey(v);
    if (v.titleRu) return Promise.resolve(v.titleRu);
    if (key && titleRuCache[key]) {
      v.titleRu = titleRuCache[key];
      return Promise.resolve(v.titleRu);
    }
    if (!looksEnglishTitle(v.title)) {
      v.titleRu = v.title;
      return Promise.resolve(v.title);
    }
    const q = encodeURIComponent(String(v.title).slice(0, 180));
    const url =
      "https://api.mymemory.translated.net/get?q=" +
      q +
      "&langpair=en|ru";
    return fetch(url, { signal: AbortSignal.timeout(8000) })
      .then(function (r) {
        if (!r.ok) throw new Error("tr");
        return r.json();
      })
      .then(function (data) {
        const ru =
          (data &&
            data.responseData &&
            data.responseData.translatedText &&
            String(data.responseData.translatedText).trim()) ||
          "";
        if (!ru || /MYMEMORY WARNING/i.test(ru)) throw new Error("empty");
        applyRuTitleEverywhere(v, ru);
        return ru;
      })
      .catch(function () {
        return v.title;
      });
  }
  function translateVisibleTitles(list) {
    (list || []).slice(0, 24).forEach(function (v) {
      if (v && looksEnglishTitle(v.title) && !v.titleRu) ensureTitleRu(v);
    });
  }

  function applyChannelAvatar(ch, url) {
    if (!ch || !url) return false;
    const next = String(url).trim();
    if (!next || next === ch.icon) return false;
    ch.icon = next;
    if (channelShelf) {
      channelShelf.querySelectorAll(".ch-card").forEach(function (card) {
        const nm = card.querySelector(".nm");
        if (!nm || nm.textContent !== ch.name) return;
        let img = card.querySelector(".ch-ico-img");
        if (img) {
          img.src = next;
        } else {
          const ico = card.querySelector(".ico");
          if (ico) {
            img = document.createElement("img");
            img.className = "ch-ico-img";
            img.alt = "";
            img.src = next;
            ico.replaceWith(img);
          }
        }
      });
    }
    if (currentChannel && currentChannel.id === ch.id && channelHead) {
      const av = channelHead.querySelector(".ch-avatar");
      if (av && av.tagName === "IMG") av.src = next;
    }
    return true;
  }

  function mergeVideos(ch, incoming) {
    if (!ch.videos) ch.videos = [];
    const byId = {};
    ch.videos.forEach(function (v) {
      if (v && v.id) byId[v.id] = v;
    });
    let added = 0;
    const fresh = [];
    (incoming || []).forEach(function (v) {
      if (!v || !v.id || v.id === "playlist") return;
      const old = byId[v.id];
      if (old) {
        if (v.title) old.title = v.title;
        if (v.thumb) old.thumb = v.thumb;
        if (v.short) old.short = true;
        if (v.likes) old.likes = v.likes;
        if (v.live) old.live = true;
        else if (v.live === false) old.live = false;
        if (v.streamVod) old.streamVod = true;
        if (v.duration != null) old.duration = v.duration;
        return;
      }
      byId[v.id] = v;
      fresh.push(v);
      added++;
    });
    if (fresh.length) {
      ch.videos = fresh.concat(ch.videos);
    }
    return added;
  }

  async function fetchYoutubeRss(channelId) {
    if (!channelId) return [];
    const url =
      "https://www.youtube.com/feeds/videos.xml?channel_id=" +
      encodeURIComponent(channelId);
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const vids = [];
    const re = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = re.exec(xml))) {
      const block = m[1];
      const idM = block.match(/yt:videoId>([^<]+)/);
      const titleM = block.match(/<title>([^<]*)<\/title>/);
      if (!idM) continue;
      const id = idM[1];
      const title = (titleM && titleM[1] ? titleM[1] : "Ролик")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .slice(0, 100);
      vids.push({
        id: id,
        title: title,
        likes: "",
        thumb: "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
        short: /#shorts|shorts/i.test(title),
      });
    }
    return vids;
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
    const duration =
      typeof s.duration === "number"
        ? s.duration
        : typeof s.lengthSeconds === "number"
          ? s.lengthSeconds
          : null;
    const live =
      duration === -1 ||
      !!s.livestream ||
      s.type === "livestream" ||
      (s.type === "stream" && (duration == null || duration < 0));
    const out = {
      id: id,
      title: String(title).slice(0, 100),
      likes: formatLikes(s.likes) || "",
      thumb: s.thumbnail || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
    };
    if (duration != null) out.duration = duration;
    if (short) out.short = true;
    if (live) out.live = true;
    else if (
      s.type === "livestream" ||
      /прямой\s*эфир|#live|\blive\b|стрим\s*сейчас/i.test(title)
    ) {
      out.streamVod = true;
    }
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
        const avatar =
          data.avatarUrl ||
          data.avatar ||
          (data.authorThumbnails &&
            data.authorThumbnails.length &&
            data.authorThumbnails[data.authorThumbnails.length - 1].url) ||
          "";
        if (vids.length || avatar || (data.tabs && data.tabs.length)) {
          return {
            videos: vids,
            nextpage: data.nextpage || null,
            avatar: avatar || "",
            tabs: data.tabs || [],
            base: base,
          };
        }
      } catch (_) {}
    }
    // Piped часто пустой — подтягиваем свежие через официальный RSS YouTube
    if (!nextpage) {
      try {
        const rssVids = await fetchYoutubeRss(channelId);
        if (rssVids.length) return { videos: rssVids, nextpage: null, avatar: "", tabs: [], base: "" };
      } catch (_) {}
    }
    return { videos: [], nextpage: null, avatar: "", tabs: [], base: "" };
  }

  /** Прямые эфиры канала (вкладка livestreams у Piped). */
  async function fetchPipedLivestreams(channelId, pageHint) {
    const out = [];
    const bases = [];
    if (pageHint && pageHint.base) bases.push(pageHint.base);
    PIPED_APIS.forEach(function (b) {
      if (bases.indexOf(b) < 0) bases.push(b);
    });
    for (let bi = 0; bi < bases.length; bi++) {
      const base = bases[bi];
      try {
        let tabs = (pageHint && pageHint.tabs) || [];
        if (!tabs.length) {
          const res = await fetch(base + "/channel/" + encodeURIComponent(channelId), {
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) continue;
          const data = await res.json();
          tabs = data.tabs || [];
        }
        const liveTab = tabs.find(function (t) {
          return String(t.name || "").toLowerCase() === "livestreams";
        });
        if (!liveTab || !liveTab.data) continue;
        const tabRes = await fetch(
          base + "/channels/tabs?data=" + encodeURIComponent(liveTab.data),
          { signal: AbortSignal.timeout(12000) }
        );
        if (!tabRes.ok) continue;
        const tabData = await tabRes.json();
        const content = tabData.content || tabData.relatedStreams || [];
        content.forEach(function (s) {
          const v = parsePipedStream(s);
          if (!v) return;
          // вкладка эфиров: без длительности или -1 → сейчас в эфире
          if (v.duration == null || v.duration < 0) v.live = true;
          else v.streamVod = true;
          out.push(v);
        });
        if (out.length) return out;
      } catch (_) {}
    }
    return out;
  }

  function pickLiveNow(ch, liveList) {
    const fromList = (liveList || []).find(isLiveVideo);
    if (fromList) return fromList;
    return realVideos(ch).find(isLiveVideo) || null;
  }

  function updateShelfLiveBadges() {
    if (!channelShelf) return;
    channelShelf.querySelectorAll(".ch-card").forEach(function (card) {
      const id = card.dataset.ch;
      const ch = id ? findChannel(id) : null;
      let badge = card.querySelector(".live-dot");
      if (ch && ch.liveNow && isLiveVideo(ch.liveNow)) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "live-dot";
          badge.textContent = "LIVE";
          card.appendChild(badge);
        }
        card.classList.add("is-live");
      } else {
        if (badge) badge.remove();
        card.classList.remove("is-live");
      }
    });
  }

  function renderLiveShelf() {
    const row = document.getElementById("liveNowRow");
    const strip = document.getElementById("liveNowStrip");
    if (!row || !strip) return;
    strip.innerHTML = "";
    const lives = [];
    CHANNELS.forEach(function (ch) {
      if (ch.liveNow && isLiveVideo(ch.liveNow)) {
        lives.push({ ch: ch, v: ch.liveNow });
      }
    });
    if (!lives.length) {
      row.hidden = true;
      return;
    }
    row.hidden = false;
    lives.forEach(function (item) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "feed-card live-card";
      card.innerHTML =
        '<div class="feed-thumb">' +
        '<span class="badge live">LIVE</span>' +
        thumbHtml(item.v.thumb, item.ch.emoji) +
        '</div><div class="feed-meta"><b>' +
        displayText(shownTitle(item.v) || "Прямой эфир") +
        '</b><div class="ch">' +
        displayText(item.ch.name) +
        " · эфир</div></div>";
      card.dataset.vid = item.v.id || "";
      card.addEventListener("click", function () {
        openChannel(item.ch.id, item.v);
      });
      strip.appendChild(card);
    });
    translateVisibleTitles(
      lives.map(function (x) {
        return x.v;
      })
    );
  }

  async function fetchChannelAvatar(channelId) {
    if (!channelId) return "";
    for (let i = 0; i < INV_APIS.length; i++) {
      try {
        const res = await fetchWithTimeout(
          INV_APIS[i] + "/api/v1/channels/" + encodeURIComponent(channelId),
          8000
        );
        if (!res.ok) continue;
        const data = await res.json();
        const thumbs = data.authorThumbnails || [];
        if (thumbs.length) {
          thumbs.sort(function (a, b) {
            return (a.width || 0) - (b.width || 0);
          });
          const best = thumbs[Math.min(thumbs.length - 1, thumbs.length - 1)];
          // берём крупнее среднего
          const pick = thumbs[Math.max(0, thumbs.length - 2)] || best;
          if (pick && pick.url) return pick.url;
        }
        if (data.authorAvatar) return data.authorAvatar;
      } catch (_) {}
    }
    return "";
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
      if (page.avatar) applyChannelAvatar(ch, page.avatar);
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
    // short только если явно Shorts и нет запроса «открыть на канале»
    if (autoPlay && isShortVideo(autoPlay) && autoPlay.forceShorts) {
      openShorts(autoPlay.id);
      return;
    }
    currentChannel = ch;
    channelNextpage = null;
    showView("channel");
    setMenuTab("videos");
    ensurePlayerTools();
    autoQueue = [];
    autoQueuePos = -1;

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

    if (autoPlay) {
      // всегда этот ролик в плеере канала (даже если short)
      playVideoObj(ch, autoPlay);
    } else {
      const liveFirst = ch.liveNow && isLiveVideo(ch.liveNow) ? ch.liveNow : null;
      const first = liveFirst || pickAutoPlay(vids);
      if (first) playVideoObj(ch, first);
    }
    renderComments();

    if (ch.channelId && !ch.allowUpload) {
      fetchPipedChannel(ch.channelId, null).then(function (page) {
        if (page.avatar) applyChannelAvatar(ch, page.avatar);
        if (page.videos && page.videos.length) {
          mergeVideos(ch, page.videos);
        }
        return fetchPipedLivestreams(ch.channelId, page).then(function (lives) {
          if (lives && lives.length) mergeVideos(ch, lives);
          ch.liveNow = pickLiveNow(ch, lives);
          updateShelfLiveBadges();
          renderLiveShelf();
          if (currentChannel && currentChannel.id === ch.id) {
            refreshChannelGrid(ch);
          }
        });
      });
      loadAllFromChannel(ch);
    }
  }

  function buildShortsFeed(startId) {
    if (!shortsFeed) return;
    renderShortsFilters();
    allShorts = collectSwipeFeed();
    if (!allShorts.length) {
      shortsFeed.innerHTML =
        '<p class="shorts-empty">Пока пусто — выбери другой канал в фильтре сверху.</p>';
      return;
    }
    const touchSwipe =
      window.matchMedia &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches;
    shortsFeed.classList.toggle("touch-swipe", !!touchSwipe);
    shortsFeed.innerHTML = "";
    allShorts.forEach(function (item, idx) {
      const slide = document.createElement("div");
      slide.className = "shorts-slide";
      slide.dataset.vid = item.v.id;
      slide.dataset.idx = String(idx);
      slide.dataset.chid = item.ch.id;
      const poster = item.v.thumb
        ? ' poster="' + escapeHtml(item.v.thumb) + '"'
        : "";
      const controlsAttr = touchSwipe ? "" : " controls";
      slide.innerHTML =
        '<div class="shorts-player">' +
        '<video class="shorts-vid" playsinline loop' +
        controlsAttr +
        poster +
        "></video>" +
        (touchSwipe
          ? '<button type="button" class="shorts-tap-play" aria-label="Пауза"><span>❚❚</span></button>'
          : "") +
        '<div class="shorts-loading" hidden>⏳ Загрузка…</div>' +
        "</div>" +
        '<div class="shorts-meta"><b>' +
        escapeHtml(item.v.title) +
        '</b><div class="ch">' +
        escapeHtml(item.ch.name) +
        '</div><button type="button" class="shorts-ch-btn" data-ch="' +
        escapeHtml(item.ch.id) +
        '">Канал</button></div>';
      shortsFeed.appendChild(slide);
      prefetchStream(item.v.id);
    });

    shortsFeed.querySelectorAll(".shorts-ch-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = btn.getAttribute("data-ch");
        if (id) openChannel(id);
      });
    });

    shortsFeed.querySelectorAll(".shorts-tap-play").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const slide = btn.closest(".shorts-slide");
        const video = slide && slide.querySelector("video.shorts-vid");
        if (!video) return;
        if (video.paused) {
          video.play().catch(function () {});
          slide.classList.remove("is-paused");
          btn.querySelector("span").textContent = "❚❚";
        } else {
          video.pause();
          slide.classList.add("is-paused");
          btn.querySelector("span").textContent = "▶";
        }
        btn.classList.add("show-icon");
        clearTimeout(btn._hideT);
        btn._hideT = setTimeout(function () {
          btn.classList.remove("show-icon");
        }, 700);
      });
    });

    if (shortsObserver) shortsObserver.disconnect();
    shortsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const slide = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
            playShortSlide(slide);
          } else if (!entry.isIntersecting) {
            const video = slide.querySelector("video.shorts-vid");
            if (video) {
              try {
                video.pause();
              } catch (_) {}
            }
            const fr = slide.querySelector("iframe.shorts-fallback");
            if (fr) fr.src = "";
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
        playShortSlide(target);
      });
    } else {
      playShortSlide(shortsFeed.querySelector(".shorts-slide"));
    }

    setupShortsNav();
  }

  let feedWheelLock = false;
  function currentShortIndex() {
    if (!shortsFeed) return 0;
    const slides = shortsFeed.querySelectorAll(".shorts-slide");
    if (!slides.length) return 0;
    const h = Math.max(1, shortsFeed.clientHeight);
    return Math.max(
      0,
      Math.min(slides.length - 1, Math.round(shortsFeed.scrollTop / h))
    );
  }

  function goShortBy(delta) {
    if (!shortsFeed || !viewShorts || !viewShorts.classList.contains("active")) {
      return;
    }
    const slides = Array.prototype.slice.call(
      shortsFeed.querySelectorAll(".shorts-slide")
    );
    if (!slides.length) return;
    let next = currentShortIndex() + delta;
    // пропускаем ролики, которые уже не играют
    while (next >= 0 && next < slides.length) {
      const id = slides[next] && slides[next].dataset.vid;
      if (id && shortFailIds[id]) {
        next += delta > 0 ? 1 : -1;
        continue;
      }
      break;
    }
    next = Math.max(0, Math.min(slides.length - 1, next));
    const target = slides[next];
    if (!target) return;
    // если и текущий битый — ищем любой живой в сторону delta
    if (shortFailIds[target.dataset.vid]) {
      let found = null;
      for (
        let i = next;
        i >= 0 && i < slides.length;
        i += delta > 0 ? 1 : -1
      ) {
        if (!shortFailIds[slides[i].dataset.vid]) {
          found = slides[i];
          break;
        }
      }
      if (!found) {
        for (let i = 0; i < slides.length; i++) {
          if (!shortFailIds[slides[i].dataset.vid]) {
            found = slides[i];
            break;
          }
        }
      }
      if (!found) return;
      found.scrollIntoView({ behavior: "smooth", block: "start" });
      playShortSlide(found);
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    playShortSlide(target);
  }

  function setupShortsNav() {
    const nav = document.getElementById("shortsNav");
    if (nav) nav.hidden = false;

    if (!shortsFeed) return;

    if (shortsFeed.dataset.wheelBound !== "1") {
      shortsFeed.dataset.wheelBound = "1";
      shortsFeed.addEventListener(
        "wheel",
        function (e) {
          if (Math.abs(e.deltaY) < 8) return;
          e.preventDefault();
          if (feedWheelLock) return;
          feedWheelLock = true;
          goShortBy(e.deltaY > 0 ? 1 : -1);
          setTimeout(function () {
            feedWheelLock = false;
          }, 380);
        },
        { passive: false }
      );
    }

    if (document.body.dataset.shortsKeys !== "1") {
      document.body.dataset.shortsKeys = "1";
      document.addEventListener("keydown", function (e) {
        if (!viewShorts || !viewShorts.classList.contains("active")) return;
        const tag = (e.target && e.target.tagName) || "";
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
          e.preventDefault();
          goShortBy(1);
        } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
          e.preventDefault();
          goShortBy(-1);
        }
      });
    }

    const prev = document.getElementById("shortsPrev");
    const next = document.getElementById("shortsNext");
    if (prev && prev.dataset.bound !== "1") {
      prev.dataset.bound = "1";
      prev.addEventListener("click", function () {
        goShortBy(-1);
      });
    }
    if (next && next.dataset.bound !== "1") {
      next.dataset.bound = "1";
      next.addEventListener("click", function () {
        goShortBy(1);
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
    renderLiveShelf();
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
      // живые эфиры — выше
      const la = isLiveVideo(a.v) ? 0 : 1;
      const lb = isLiveVideo(b.v) ? 0 : 1;
      if (la !== lb) return la - lb;
      return (a.order % 3) - (b.order % 3);
    });

    all.forEach(function (item) {
      const v = item.v;
      const ch = item.ch;
      const card = document.createElement("button");
      card.type = "button";
      card.className = isShortVideo(v) ? "short-card" : "feed-card";
      if (isLiveVideo(v)) card.classList.add("live-card");
      card.dataset.vid = v.id || "";
      const liveBadge = isLiveVideo(v)
        ? '<span class="badge live">LIVE</span>'
        : "";
      card.innerHTML =
        '<div class="feed-thumb">' +
        liveBadge +
        thumbHtml(v.thumb, ch.emoji) +
        '</div><div class="feed-meta"><b>' +
        displayText(shownTitle(v)) +
        '</b><div class="ch">' +
        displayText(ch.name) +
        (isLiveVideo(v) ? " · эфир" : "") +
        "</div></div>";
      card.addEventListener("click", function () {
        // короткое — в ленту шортов внутри приложения, без ухода на YouTube
        if (isShortVideo(v) && !isLiveVideo(v)) {
          openShorts(v.id);
          return;
        }
        openChannel(ch.id, v);
      });
      if (isShortVideo(v) && !isLiveVideo(v)) shortsRow.appendChild(card);
      else feed.appendChild(card);
    });
    translateVisibleTitles(
      all.map(function (x) {
        return x.v;
      })
    );
  }

  const shelfList = CHANNELS.slice().sort(function (a, b) {
    return (b.pinShelf ? 1 : 0) - (a.pinShelf ? 1 : 0);
  });
  shelfList.forEach(function (ch) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ch-card" + (ch.specialDuo ? " duo-card" : "");
    b.dataset.ch = ch.id;
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
  updateShelfLiveBadges();

  function setupChannelShelfScroll() {
    if (!channelShelf || channelShelf.dataset.scrollBound === "1") return;
    channelShelf.dataset.scrollBound = "1";
    const left = document.getElementById("chScrollLeft");
    const right = document.getElementById("chScrollRight");
    if (left) {
      left.addEventListener("click", function () {
        channelShelf.scrollBy({ left: -240, behavior: "smooth" });
      });
    }
    if (right) {
      right.addEventListener("click", function () {
        channelShelf.scrollBy({ left: 240, behavior: "smooth" });
      });
    }
    channelShelf.addEventListener(
      "wheel",
      function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        channelShelf.scrollLeft += e.deltaY;
      },
      { passive: false }
    );
    let drag = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    let activePid = null;
    channelShelf.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      // клик по карточке канала — не перехватывать, иначе канал не открывается
      if (e.target.closest("button.ch-card")) {
        drag = false;
        moved = false;
        return;
      }
      drag = true;
      moved = false;
      startX = e.clientX;
      startLeft = channelShelf.scrollLeft;
      activePid = e.pointerId;
    });
    channelShelf.addEventListener("pointermove", function (e) {
      if (!drag) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 14) {
        moved = true;
        try {
          channelShelf.setPointerCapture(activePid);
        } catch (_) {}
      }
      if (moved) {
        channelShelf.scrollLeft = startLeft - dx;
      }
    });
    function endDrag() {
      drag = false;
      activePid = null;
    }
    channelShelf.addEventListener("pointerup", endDrag);
    channelShelf.addEventListener("pointercancel", endDrag);
    channelShelf.addEventListener(
      "click",
      function (e) {
        if (!moved) return;
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      },
      true
    );
  }
  setupChannelShelfScroll();

  function updateShelfCounts() {
    if (!channelShelf) return;
    const cards = channelShelf.querySelectorAll(".ch-card");
    CHANNELS.forEach(function (ch) {
      Array.prototype.forEach.call(cards, function (card) {
        const nm = card.querySelector(".nm");
        if (nm && nm.textContent === ch.name) {
          const subsEl = card.querySelector(".subs");
          const n = realVideos(ch).length;
          if (subsEl) subsEl.textContent = n ? n + " видео" : ch.subs;
        }
      });
    });
  }

  async function refreshAllChannelsLive(silent) {
    if (!silent && tvHint) tvHint.textContent = "⏳ Подтягиваю новые ролики с каналов…";
    let addedTotal = 0;
    let liveCount = 0;
    for (let i = 0; i < CHANNELS.length; i++) {
      const ch = CHANNELS[i];
      if (!ch.channelId || ch.allowUpload) continue;
      try {
        let vids = [];
        let avatar = "";
        let page = null;
        // Piped: свежие ролики + аватар канала
        try {
          page = await fetchPipedChannel(ch.channelId, null);
          vids = page.videos || [];
          avatar = page.avatar || "";
        } catch (_) {}
        // Прямые эфиры (вкладка livestreams)
        let lives = [];
        try {
          lives = await fetchPipedLivestreams(ch.channelId, page);
        } catch (_) {}
        if (lives.length) {
          // эфиры — в начало списка
          vids = lives.concat(vids);
        }
        // RSS дополняет, если Piped молчит
        if (!vids.length) {
          try {
            vids = await fetchYoutubeRss(ch.channelId);
          } catch (_) {}
        } else {
          try {
            const rss = await fetchYoutubeRss(ch.channelId);
            if (rss.length) vids = rss.concat(vids);
          } catch (_) {}
        }
        if (!avatar) {
          try {
            avatar = await fetchChannelAvatar(ch.channelId);
          } catch (_) {}
        }
        // если аватарки нет — берём превью самого нового ролика
        if (!avatar && vids[0] && vids[0].thumb) avatar = vids[0].thumb;
        if (avatar) applyChannelAvatar(ch, avatar);
        addedTotal += mergeVideos(ch, vids);
        ch.liveNow = pickLiveNow(ch, lives);
        if (ch.liveNow) liveCount++;
      } catch (_) {}
    }
    updateShelfCounts();
    updateShelfLiveBadges();
    renderLiveShelf();
    if (viewHome && viewHome.classList.contains("active")) {
      buildFeed();
    }
    if (currentChannel) {
      refreshChannelGrid(currentChannel);
    }
    if (tvHint) {
      if (liveCount) {
        tvHint.textContent =
          "🔴 Сейчас в эфире: " + liveCount + " канал(ов). Смотри полку «Прямой эфир».";
      } else if (addedTotal) {
        tvHint.textContent =
          "✓ Новые ролики с каналов: +" + addedTotal + ". Смотри в ленте.";
      } else if (!silent) {
        tvHint.textContent = "✓ Список свежий — новых роликов пока нет.";
      }
    }
    try {
      localStorage.setItem("amal-watch-last-refresh", String(Date.now()));
    } catch (_) {}
  }

  buildFeed();
  refreshAllChannelsLive(true);
  setInterval(function () {
    refreshAllChannelsLive(true);
  }, 2 * 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      refreshAllChannelsLive(true);
    }
  });

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
    { keys: ["любопытный", "любопытный познаватель", "лп познаватель"], channel: "poznavatel-lp" },
    { keys: ["простоквашин", "матроскин", "дядя фёд", "шарик"], channel: "prostokvashino" },
    { keys: ["маша и медведь", "маша медведь"], channel: "masha" },
    { keys: ["синий трактор", "трактор"], channel: "siniy-traktor" },
    { keys: ["мимимишк", "ми-ми"], channel: "mimishki" },
    { keys: ["лунтик"], channel: "luntik" },
    { keys: ["барбоскин"], channel: "barboskiny" },
    { keys: ["буба"], channel: "buba" },
    { keys: ["сказочный патруль", "патруль"], channel: "skaz-patrul" },
    { keys: ["капуки", "кануки"], channel: "kapuki" },
    { keys: ["настя", "like nastya"], channel: "like-nastya" },
    { keys: ["влад и никита", "никита"], channel: "vlad-nikita" },
    { keys: ["смешарик"], channel: "smeshariki" },
    { keys: ["союзмульт", "чебурашк", "гена"], channel: "soyuzmult" },
    { keys: ["пеппа", "свинка"], channel: "peppa" },
    { keys: ["щенячий", "paw patrol"], channel: "pawpatrol" },
    { keys: ["фиксай", "fixeye"], channel: "fixeye" },
    { keys: ["владус", "мармелад"], channel: "vladus" },
    { keys: ["а4", "влад а4", "vlad"], channel: "vlada4" },
    { keys: ["мистер бист", "mrbeast", "mr beast", "бист"], channel: "mrbeast" },
    { keys: ["гравити", "gravity", "фолз", "dipper", "мейбл"], channel: "gravity" },
    { keys: ["сладост", "гадост", "конфет", "gadosti"], channel: "sladosti" },
    { keys: ["милс", "милс play", "нил скел", "нилскел"], channel: "mils-play" },
    { keys: ["милс кел", "милскел"], channel: "mils-kel" },
    { keys: ["милс стрим", "стримы милс"], channel: "mils-streams" },
    { keys: ["вэлл", "вэл", "well", "vell"], channel: "vell" },
    { keys: ["биллиент", "billy", "билли"], channel: "billionent" },
    { keys: ["ярокс", "ерокс", "erox", "стандофф"], channel: "yaroks" },
    { keys: ["кукутик"], channel: "kukutiki" },
    { keys: ["тёма", "тема и катя", "тема катя"], channel: "tema-katya" },
    { keys: ["hard play", "хард плей", "хардплей"], channel: "hardplay" },
    { keys: ["брайн", "brain maps", "теори"], channel: "brius" },
    { keys: ["денчик"], channel: "denchik" },
    { keys: ["junior", "джуниор"], channel: "junior" },
    { keys: ["кобяков"], channel: "cobel" },
    { keys: ["wylsa", "вилса", "уайса"], channel: "wylsa" },
    { keys: ["простая наука", "лаборатор"], channel: "laber" },
    { keys: ["вилли", "вили", "willi", "villy", "кот вилли"], channel: "villy" },
    { keys: ["вилли теор", "теории вилли"], channel: "villy-theory" },
    { keys: ["мы с тобой", "курсор", "наш канал", "amal duo", "duo"], channel: "amal-duo" },
    { keys: ["синие очки", "синий очк", "blas", "блас", "파란안경", "퍼런안경", "meccha", "chameleon"], channel: "blas" },
    { keys: ["фази", "fazie"], channel: "fazie" },
    { keys: ["кекич"], channel: "kekich" },
    { keys: ["бравл топ", "brawl топ"], channel: "browl" },
    { keys: ["саймон", "simon cat", "кот саймон"], channel: "kot-simona" },
    { keys: ["гофман"], channel: "gofman" },
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
      showToast("⏳ Гружу все ролики…");
      loadAllFromChannel(currentChannel).then(function () {
        startChannelQueue(currentChannel, null);
      });
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
      showToast("💬 Комментарий отправлен");
      setMenuTab("comments");
    });
  }

  const tabVideos = document.getElementById("tabVideos");
  const tabCommentsBtn = document.getElementById("tabComments");
  if (tabVideos) {
    tabVideos.addEventListener("click", function () {
      setMenuTab("videos");
    });
  }
  if (tabCommentsBtn) {
    tabCommentsBtn.addEventListener("click", function () {
      setMenuTab("comments");
    });
  }

  if (localVideo) {
    localVideo.addEventListener("ended", function () {
      playNextInQueue();
    });
  }

  if (btnMine) {
    btnMine.addEventListener("click", openMine);
  }

  fileIn && fileIn.addEventListener("change", function () {
    const f = fileIn.files && fileIn.files[0];
    if (!f || !currentChannel) return;
    const url = URL.createObjectURL(f);
    const title = f.name.replace(/\.[^.]+$/, "") || "Мой ролик";
    myVideos.unshift({ title: title, url: url });
    mineCh.videos = myVideos.length;
    bumpMine(25);
    openChannel(currentChannel.id);
    playLocal(url, title);
  });

  const mineFile = document.getElementById("mineFile");
  if (mineFile) {
    mineFile.addEventListener("change", function () {
      const f = mineFile.files && mineFile.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const title = f.name.replace(/\.[^.]+$/, "") || "Мой ролик";
      myVideos.unshift({ title: title, url: url });
      mineCh.videos = myVideos.length;
      bumpMine(25);
      renderMine();
      playLocal(url, title);
    });
  }
  document.getElementById("btnMineGift") &&
    document.getElementById("btnMineGift").addEventListener("click", function () {
      mineCh.giftOpened = true;
      bumpMine(15);
    });
  document.getElementById("btnMineBoost") &&
    document.getElementById("btnMineBoost").addEventListener("click", function () {
      bumpMine(50);
    });

  const mineGameNick = document.getElementById("mineGameNick");
  if (mineGameNick) {
    mineGameNick.addEventListener("change", function () {
      mineCh.gameNick = String(mineGameNick.value || "").trim().slice(0, 24);
      saveMineCh();
      renderMine();
    });
    mineGameNick.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        mineGameNick.blur();
      }
    });
  }

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

  try {
    const openCh = new URLSearchParams(location.search).get("open");
    if (openCh && findChannel(openCh)) {
      setTimeout(function () {
        openChannel(openCh);
      }, 200);
    }
  } catch (_) {}
})();
