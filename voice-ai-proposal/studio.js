(() => {
  const I18n = window.SkazhiI18n;
  const SITE_KEY = "skazhigru-site-v1";
  const GAMES_KEY = "skazhigru-games-v1";

  const siteName = document.getElementById("site-name");
  const siteAbout = document.getElementById("site-about");
  const siteStatus = document.getElementById("site-status");
  const gamePrompt = document.getElementById("game-prompt");
  const gameName = document.getElementById("game-name");
  const gameStatus = document.getElementById("game-status");
  const gameList = document.getElementById("game-list");
  const btnMic = document.getElementById("btn-mic");
  const btnSiteMic = document.getElementById("btn-site-mic");
  const micHint = document.getElementById("mic-hint");
  const micLabel = document.getElementById("mic-label");
  const siteMicHint = document.getElementById("site-mic-hint");
  const btnMake = document.getElementById("btn-make-game");
  const btnPlay = document.getElementById("btn-play-game");
  const btnSaveSite = document.getElementById("btn-save-site");
  const aiSpeak = document.getElementById("ai-speak");
  const aiText = document.getElementById("ai-text");
  const heardBox = document.getElementById("heard-box");
  const heardText = document.getElementById("heard-text");
  const liveWrite = document.getElementById("live-write");
  const liveWriteStatus = document.getElementById("live-write-status");
  const langSelect = document.getElementById("lang-select");
  const langBtns = document.getElementById("lang-btns");
  const clockNow = document.getElementById("clock-adults");
  const clockKids = document.getElementById("clock-kids");
  const clockKidsLeft = document.getElementById("clock-kids-left");
  const clockLeft = document.getElementById("clock-left");
  const listenKidsLeft = document.getElementById("listen-kids-left");
  const listenMeter = document.getElementById("listen-meter");
  const listenBar = document.getElementById("listen-bar");
  const confirmBox = document.getElementById("confirm-box");
  const confirmText = document.getElementById("confirm-text");
  const btnTest = document.getElementById("btn-test-game");
  const toast = document.getElementById("toast");
  const toastTitle = document.getElementById("toast-title");
  const toastBody = document.getElementById("toast-body");
  const LISTEN_MS = 0; // unlimited — speak as long as you want
  let speakStartedAt = 0;
  let fullTranscript = "";
  let pendingFinals = "";
  let sessionFinals = "";


  let lastGameId = null;
  let mode = null;
  let rec = null;
  let restartTimer = null;
  let levelTimer = null;
  let audioCtx = null;
  let analyser = null;
  let micStream = null;
  let finishing = false;
  let lastHeard = "";
  let listenEndsAt = 0;
  let listenTick = null;
  let pendingMode = "game";
  let confirmOpen = false;
  let networkFails = 0;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordStream = null;
  let usingWhisper = false;
  let whisperBusy = false;
  let pcmChunks = [];
  let pcmCtx = null;
  let pcmNode = null;
  let pcmSource = null;
  let pcmAnalyser = null;
  let pcmRaf = 0;
  let heardSound = false;
  let recordStartedAt = 0;
  let lastLoudAt = 0;
  let autoStopTimer = null;
  let speechFrames = 0; // need several loud frames before we count "speech"
  let captureSession = 0; // bumps when stop/finish — kills in-flight start after await
  let noiseFloor = 0.008;
  let speechPeak = 0;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function d() {
    return I18n.t();
  }

  function speechLang() {
    return I18n.meta().speech;
  }

  function loadSite() {
    try {
      return JSON.parse(localStorage.getItem(SITE_KEY) || "null") || { name: "", about: "" };
    } catch {
      return { name: "", about: "" };
    }
  }

  function loadGames() {
    try {
      const list = JSON.parse(localStorage.getItem(GAMES_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveGames(list) {
    localStorage.setItem(GAMES_KEY, JSON.stringify(list));
  }

  function stopTalking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function speak(text) {
    aiSpeak.hidden = false;
    aiText.textContent = text;
    if (!("speechSynthesis" in window)) return;
    stopTalking();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang();
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }

  function guessKind(text) {
    const t = (text || "").toLowerCase();
    if (/змей|snake|яблок|serpiente|yılan|жылан/.test(t)) return "snake";
    if (/гонка|багги|машин|race|drive|carrera|yarış|жарыс/.test(t)) return "race";
    if (/прыг|платформ|jump|salta|zıpla|секір/.test(t)) return "jump";
    return "catch";
  }

  function guessColor(text) {
    const t = (text || "").toLowerCase();
    if (/зелён|зелен|green|verde|yeşil|жасыл/.test(t)) return "#12a374";
    if (/син|blue|azul|mavi|көк/.test(t)) return "#2563eb";
    if (/красн|red|rojo|kırmızı|қызыл/.test(t)) return "#dc2626";
    if (/жёлт|желт|yellow|amarillo|sarı|сары/.test(t)) return "#ca8a04";
    if (/фиолет|purple|morado|mor|күлгін/.test(t)) return "#7c3aed";
    return "#0b6e4f";
  }

  function cleanGameName(text) {
    return text
      .replace(/^(сделай|создай|хочу|напиши|пожалуйста|make|create|haz|hazme|yap|жаса)[,\s]+/i, "")
      .replace(/^(игру|игра|game|juego|oyun|ойын)[,\s]+/i, "")
      .trim()
      .slice(0, 28) || d().gameNamePh;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderList() {
    const games = loadGames();
    const dict = d();
    if (!games.length) {
      gameList.innerHTML = `<p class="empty">${escapeHtml(dict.emptyList)}</p>`;
      return;
    }
    gameList.innerHTML = games
      .map(
        (g) => `
      <article class="game-card">
        <div>
          <h3>${escapeHtml(g.name)}</h3>
          <p>${escapeHtml(g.prompt || "")}</p>
        </div>
        <div class="card-actions">
          <a class="btn primary" href="play.html?id=${encodeURIComponent(g.id)}">${escapeHtml(dict.play)}</a>
          <a class="btn ghost" href="test.html?id=${encodeURIComponent(g.id)}">${escapeHtml(dict.testScreen || "Test")}</a>
        </div>
      </article>`
      )
      .join("");
  }

  function showToast(title, body) {
    if (!toast) return;
    toastTitle.textContent = title;
    toastBody.textContent = body;
    toast.hidden = false;
  }

  function hideToast() {
    if (toast) toast.hidden = true;
  }

  function formatLeft(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `0:${String(r).padStart(2, "0")}`;
  }

  function dayPart(hour) {
    const dict = d();
    if (hour >= 5 && hour < 12) return dict.partMorning || "утро";
    if (hour >= 12 && hour < 17) return dict.partDay || "день";
    if (hour >= 17 && hour < 22) return dict.partEvening || "вечер";
    return dict.partNight || "ночь";
  }

  function kidsHour(date) {
    const h = date.getHours();
    const min = date.getMinutes();
    const h12 = h % 12 || 12;
    const fn = d().kidsClock;
    if (typeof fn === "function") {
      try {
        return fn(h12, dayPart(h), h, min);
      } catch (_) {}
    }
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  function updateLeftDisplays(ms) {
    // ms = elapsed speaking time when listening; null = idle
    if (ms == null) {
      if (clockLeft) clockLeft.textContent = "∞";
      if (clockKidsLeft) clockKidsLeft.textContent = d().timeIdleKids || "Говори сколько хочешь";
      if (listenKidsLeft) listenKidsLeft.textContent = "";
      return;
    }
    const secs = Math.max(0, Math.floor(ms / 1000));
    if (clockLeft) clockLeft.textContent = formatLeft(ms);
    const kidsTalk =
      typeof d().timeTalkKids === "function"
        ? d().timeTalkKids(secs)
        : `Ты говоришь уже ${secs} сек. Говори сколько хочешь`;
    if (clockKidsLeft) clockKidsLeft.textContent = kidsTalk;
    if (listenKidsLeft) listenKidsLeft.textContent = kidsTalk;
  }

  function stopListenCountdown() {
    if (listenTick) clearInterval(listenTick);
    listenTick = null;
    listenEndsAt = 0;
    speakStartedAt = 0;
    if (listenMeter) listenMeter.hidden = true;
    updateLeftDisplays(null);
    if (listenBar) listenBar.style.width = "100%";
  }

  function startListenCountdown() {
    stopListenCountdown();
    speakStartedAt = Date.now();
    if (listenMeter) listenMeter.hidden = false;
    if (listenBar) listenBar.style.width = "100%";
    listenTick = setInterval(() => {
      if (!speakStartedAt) return;
      const elapsed = Date.now() - speakStartedAt;
      // soft pulse on the bar so kids see it is still listening
      const pulse = 70 + Math.round(30 * Math.abs(Math.sin(elapsed / 600)));
      if (listenBar) listenBar.style.width = pulse + "%";
      updateLeftDisplays(elapsed);
    }, 200);
  }

  function setLiveStatus(msg) {
    if (liveWriteStatus) liveWriteStatus.textContent = msg || "";
  }

  function setLiveListening(on) {
    if (liveWrite) liveWrite.classList.toggle("is-listening", !!on);
  }

  function writeHeard(text, statusMsg) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean) {
      lastHeard = clean;
      fullTranscript = clean;
      if (heardText) {
        heardText.textContent = clean;
        heardText.classList.remove("is-empty");
      }
      if (heardBox) heardBox.hidden = false;
      if (confirmBox && !confirmBox.hidden && confirmText) {
        confirmText.value = clean;
      }
      if (gamePrompt) gamePrompt.value = clean;
      if (liveWrite) liveWrite.hidden = false;
    }
    if (statusMsg != null) setLiveStatus(statusMsg);
    else if (clean) setLiveStatus("Слышу тебя… продолжай или нажми микрофон ещё раз");
  }

  function clearLiveWrite(placeholder) {
    if (heardText) {
      heardText.textContent = placeholder || "…";
      heardText.classList.add("is-empty");
    }
  }

  function openConfirm(text, forMode) {
    pendingMode = forMode || "game";
    confirmOpen = true;
    stopListening();
    stopListenCountdown();
    heardBox.hidden = false;
    heardText.textContent = text;
    confirmBox.hidden = false;
    confirmText.value = text;
    confirmText.readOnly = true;
    gameStatus.textContent = d().confirmTitle;
  }

  function pickPraise(count) {
    const dict = d();
    const more = Array.isArray(dict.praiseMore) ? dict.praiseMore : [];
    const base = Array.isArray(dict.praises) ? dict.praises : ["Ура! Молодец!"];
    const pool = count >= 3 && more.length ? more.concat(base) : base;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function finishWithGame(game) {
    lastGameId = game.id;
    btnPlay.hidden = false;
    if (btnTest) {
      btnTest.href = "test.html?id=" + encodeURIComponent(game.id);
      btnTest.classList.add("is-ready");
    }
    const count = loadGames().length;
    const praise = pickPraise(count);
    const title = praise;
    const body = d().toastDoneBody;
    showToast(title, body);
    const line =
      typeof d().praiseSpeak === "function" ? d().praiseSpeak(praise, game.name) : d().understood(game.name);
    speak(line);
  }

  function createGame(prompt, nameFromInput) {
    const clean = (prompt || "").trim();
    const dict = d();
    if (!clean) {
      gameStatus.textContent = dict.needPrompt;
      return null;
    }
    const name = (nameFromInput || "").trim() || cleanGameName(clean);
    const game = {
      id: "g-" + Date.now().toString(36),
      name,
      prompt: clean,
      kind: guessKind(clean),
      color: guessColor(clean),
      createdAt: Date.now(),
    };
    const games = loadGames();
    games.unshift(game);
    saveGames(games.slice(0, 30));
    lastGameId = game.id;
    btnPlay.hidden = false;
    gamePrompt.value = clean;
    gameName.value = name;
    gameStatus.textContent = dict.created(name);
    renderList();

    const site = loadSite();
    if (!site.name) {
      localStorage.setItem(
        SITE_KEY,
        JSON.stringify({
          name: dict.defaultSite,
          about: dict.defaultAbout,
          updatedAt: Date.now(),
        })
      );
    }
    return game;
  }

  function saveSiteData(name, about) {
    const dict = d();
    const data = {
      name: (name || "").trim() || dict.mySiteFallback,
      about: (about || "").trim() || dict.myGamesAbout,
      updatedAt: Date.now(),
    };
    localStorage.setItem(SITE_KEY, JSON.stringify(data));
    siteName.value = data.name;
    siteAbout.value = data.about;
    siteStatus.textContent = dict.siteSaved(data.name);
    return data;
  }

  function parseSiteSpeech(text) {
    const t = text.trim().replace(/^[\s.,!?]+|[\s.,!?]+$/g, "");
    if (t.length < 2) return null;

    const nameMatch = t.match(
      /(?:назови(?:те)?\s+сайт|название(?:\s+сайта)?|сайт\s+(?:называется|будет|имя)|моя?\s+сайт(?:\s+называется)?)\s*[:\-]?\s*(.+)/i
    );
    const aboutMatch = t.match(/(?:описание|про сайт|сайт про|это сайт(?:\s+про)?|расскажи)\s*[:\-]?\s*(.+)/i);

    if (nameMatch) {
      const name = nameMatch[1].replace(/^["«]|["»]$/g, "").trim();
      if (name.length < 2) return null;
      return saveSiteData(name, siteAbout.value || loadSite().about);
    }
    if (aboutMatch) {
      const about = aboutMatch[1].trim();
      if (about.length < 2) return null;
      return saveSiteData(siteName.value || loadSite().name || "Мой сайт", about);
    }

    // "сайт Мир Амаля" / "сайт: динозавры"
    const sitePrefix = t.match(/^сайт\s*[:\-]?\s*(.+)$/i);
    if (sitePrefix) {
      const rest = sitePrefix[1].trim();
      if (rest.length <= 40) return saveSiteData(rest, siteAbout.value || loadSite().about);
      return saveSiteData(siteName.value || loadSite().name || cleanGameName(rest), rest);
    }

    // Short phrase = name; longer = about (keep old name if any)
    if (t.length <= 40) return saveSiteData(t, siteAbout.value || loadSite().about || "Здесь будут мои игры.");
    return saveSiteData(siteName.value || loadSite().name || cleanGameName(t), t);
  }

  function setGameMicUi(on) {
    const dict = d();
    btnMic.classList.toggle("is-on", on);
    btnMic.setAttribute("aria-pressed", on ? "true" : "false");
    micLabel.textContent = on ? "Стоп" : dict.micLabel;
  }

  function setSiteMicUi(on) {
    const dict = d();
    btnSiteMic.classList.toggle("is-on", on);
    btnSiteMic.setAttribute("aria-pressed", on ? "true" : "false");
    btnSiteMic.textContent = on ? "Стоп" : dict.siteMic;
  }

  function setLevel(pct) {
    btnMic.style.setProperty("--level", Math.max(0, Math.min(100, pct)) + "%");
  }

  async function openMicMeter() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("no-media");
    }
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyser || mode !== "game") return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel(Math.min(100, rms * 350));
      levelTimer = requestAnimationFrame(tick);
    };
    tick();
  }

  function closeMicMeter() {
    if (levelTimer) cancelAnimationFrame(levelTimer);
    levelTimer = null;
    setLevel(0);
    if (analyser) {
      try { analyser.disconnect(); } catch (_) {}
    }
    analyser = null;
    if (audioCtx) {
      try { audioCtx.close(); } catch (_) {}
    }
    audioCtx = null;
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
  }

  function clearRestart() {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
  }

  function stopPcmCapture() {
    if (pcmRaf) cancelAnimationFrame(pcmRaf);
    pcmRaf = 0;
    try {
      if (pcmNode) pcmNode.disconnect();
    } catch (_) {}
    try {
      if (pcmSource) pcmSource.disconnect();
    } catch (_) {}
    try {
      if (pcmAnalyser) pcmAnalyser.disconnect();
    } catch (_) {}
    pcmNode = null;
    pcmSource = null;
    pcmAnalyser = null;
    if (pcmCtx) {
      try {
        pcmCtx.close();
      } catch (_) {}
    }
    pcmCtx = null;
    setLevel(0);
  }

  function stopListening(opts = {}) {
    finishing = true;
    captureSession += 1; // cancel any startWhisperCapture waiting on getUserMedia
    clearRestart();
    clearAutoStop();
    stopListenCountdown();
    try {
      if (rec) rec.onend = null;
      if (rec) rec.stop();
    } catch (_) {}
    rec = null;
    try {
      if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    } catch (_) {}
    mediaRecorder = null;
    stopPcmCapture();
    if (recordStream) {
      recordStream.getTracks().forEach((t) => t.stop());
      recordStream = null;
    }
    recordedChunks = [];
    pcmChunks = [];
    usingWhisper = false;
    heardSound = false;
    recordStartedAt = 0;
    speechPeak = 0;
    const was = mode;
    mode = null;
    setGameMicUi(false);
    setSiteMicUi(false);
    closeMicMeter();
    finishing = false;
    return was;
  }

  function waitForWhisper(timeoutMs) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const tick = () => {
        if (window.SkazhiWhisper) return resolve(window.SkazhiWhisper);
        if (Date.now() - t0 > timeoutMs) return resolve(null);
        setTimeout(tick, 120);
      };
      tick();
    });
  }

  function clearAutoStop() {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
  }

  function applyHeardSpeech(text, forMode) {
    const clean = String(text || "").trim();
    if (clean.length < 2) return false;
    // Ignore empty praise / noise the mic sometimes "hears"
    if (/^(молодец|ура|хорошо|спасибо|thanks|thank you|you|ok|okay|мм+|а+|э+)[.!?]*$/i.test(clean)) {
      setLiveStatus("Это не похоже на идею. Нажми микрофон и скажи ещё раз.");
      return false;
    }
    pendingMode = forMode || "game";
    writeHeard(clean, "Готово!");
    if (confirmBox) confirmBox.hidden = true;
    gameStatus.textContent = d().working;

    if (pendingMode === "site") {
      const data = parseSiteSpeech(clean);
      if (!data) {
        setLiveStatus("Не понял сайт. Скажи название, например: «Сайт Мир Амаля».");
        return false;
      }
      // Show fields so the kid sees what changed
      const siteDetails = document.getElementById("site-write-box");
      if (siteDetails) siteDetails.open = true;
      siteMicHint.textContent = d().siteReady(data.name);
      siteStatus.textContent = "Записал: «" + data.name + "»";
      setLiveStatus("Сайт обновлён: «" + data.name + "»");
      const praise = pickPraise(loadGames().length);
      showToast(praise, "Сайт «" + data.name + "» сохранён. Открой «Мой сайт».");
      setTimeout(() => {
        const line =
          typeof d().praiseSite === "function" ? d().praiseSite(praise, data.name) : d().siteReady(data.name);
        speak(line);
      }, 200);
      return true;
    }

    const game = createGame(clean, "");
    if (!game) return false;
    finishWithGame(game);
    return true;
  }

  async function finishWhisperCapture() {
    if (whisperBusy) return;
    if (!usingWhisper && !mode) return;
    // Always cancel in-flight start (user pressed Стоп while mic was still opening)
    captureSession += 1;
    whisperBusy = true;
    clearAutoStop();
    const forMode = mode || pendingMode || "game";
    pendingMode = forMode;
    setLiveStatus("Пишу твои слова…");
    setGameMicUi(false);
    setSiteMicUi(false);

    const chunks = recordedChunks.slice();
    const mr = mediaRecorder;
    try {
      if (mr && mr.state !== "inactive") {
        await new Promise((resolve) => {
          const done = () => resolve();
          mr.onstop = done;
          setTimeout(done, 1200);
          try {
            mr.requestData();
          } catch (_) {}
          try {
            mr.stop();
          } catch (_) {
            resolve();
          }
        });
      }
    } catch (_) {}
    const allChunks = recordedChunks.length ? recordedChunks.slice() : chunks;

    stopPcmCapture();
    if (recordStream) {
      recordStream.getTracks().forEach((t) => t.stop());
      recordStream = null;
    }
    mediaRecorder = null;
    recordedChunks = [];
    pcmChunks = [];
    usingWhisper = false;
    stopListenCountdown();
    clearRestart();
    try {
      if (rec) {
        rec.onend = null;
        rec.stop();
      }
    } catch (_) {}
    rec = null;
    mode = null;
    fullTranscript = "";
    pendingFinals = "";
    lastHeard = "";

    const blob = new Blob(allChunks, { type: (allChunks[0] && allChunks[0].type) || "audio/webm" });

    if (!allChunks.length || blob.size < 800) {
      setLiveListening(false);
      setLiveStatus("Слишком тихо / коротко. Нажми микрофон и скажи ещё раз.");
      whisperBusy = false;
      return;
    }

    const W = await waitForWhisper(90000);
    if (!W) {
      setLiveListening(false);
      setLiveStatus("Подожди: уши ещё качаются. Когда будет «готовы» — нажми микрофон.");
      whisperBusy = false;
      return;
    }

    try {
      setLiveStatus("Пишу слова… подожди");
      const text = await W.transcribeBlob(blob, I18n.getLang(), (p) => {
        if (!p || typeof p.progress !== "number") return;
        const pct = Math.round((p.progress || 0) * 100);
        if (p.status === "progress" || p.status === "download") {
          setLiveStatus("Качаю уши… " + pct + "%");
        }
      });
      setLiveListening(false);
      if (!text || text.length < 2) {
        setLiveStatus("Не разобрал. Нажми микрофон и скажи громче и яснее.");
        clearLiveWrite("…");
      } else {
        writeHeard(text, "Слышу: «" + text + "»");
        applyHeardSpeech(text, forMode);
      }
    } catch (err) {
      console.error(err);
      setLiveListening(false);
      setLiveStatus("Ошибка. Нужен интернет для ушей. Попробуй ещё раз.");
    }
    whisperBusy = false;
  }

  async function startWhisperCapture(nextMode) {
    stopTalking();
    stopListening();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setLiveStatus("Этот браузер не даёт микрофон. Открой Chrome или Edge.");
      return;
    }
    const mySession = ++captureSession;
    mode = nextMode;
    pendingMode = nextMode;
    finishing = false;
    usingWhisper = true;
    heardSound = false;
    noiseFloor = 0.008;
    speechPeak = 0;
    lastHeard = "";
    fullTranscript = "";
    pendingFinals = "";
    sessionFinals = "";
    recordedChunks = [];
    pcmChunks = [];
    recordStartedAt = 0;
    clearLiveWrite("…");
    setLiveListening(true);
    setLiveStatus("Включаю микрофон…");
    if (confirmBox) confirmBox.hidden = true;
    clearAutoStop();
    lastLoudAt = 0;

    if (nextMode === "game") {
      setGameMicUi(true);
      setSiteMicUi(false);
      gameStatus.textContent = "Слушаю… просто говори";
      if (micHint) micHint.textContent = "Говори. Замолчи — или нажми «Стоп».";
      startListenCountdown();
    } else {
      setSiteMicUi(true);
      setGameMicUi(false);
      siteStatus.textContent = "Слушаю… просто говори";
      startListenCountdown();
    }

    try {
      recordStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch (_) {
      if (mySession !== captureSession) return;
      stopListening();
      setLiveListening(false);
      setLiveStatus("Разреши микрофон: замок у адреса сайта → Микрофон → Разрешить.");
      return;
    }

    // User pressed Стоп while mic permission was opening
    if (mySession !== captureSession) {
      try {
        recordStream.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      recordStream = null;
      return;
    }

    waitForWhisper(120000).then((W) => {
      if (!W || mySession !== captureSession) return;
      W.warm((p) => {
        if (!usingWhisper || mySession !== captureSession || !p || typeof p.progress !== "number") return;
        if (p.status === "progress" || p.status === "download") {
          const pct = Math.round(p.progress * 100);
          if (!heardSound) setLiveStatus("Слушаю… (уши " + pct + "%)");
        }
      }).catch((err) => {
        window.__whisperPreloadError = String(err && err.message ? err.message : err);
      });
    });

    try {
      pcmCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (pcmCtx.state === "suspended") await pcmCtx.resume();
      if (mySession !== captureSession) {
        try {
          recordStream.getTracks().forEach((t) => t.stop());
        } catch (_) {}
        recordStream = null;
        return;
      }
      pcmSource = pcmCtx.createMediaStreamSource(recordStream);
      pcmAnalyser = pcmCtx.createAnalyser();
      pcmAnalyser.fftSize = 2048;
      pcmSource.connect(pcmAnalyser);
      const data = new Uint8Array(pcmAnalyser.fftSize);
      const tickLevel = () => {
        if (!pcmAnalyser || !usingWhisper || whisperBusy || mySession !== captureSession) return;
        pcmAnalyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const pct = Math.min(100, rms * 350);
        setLevel(pct);
        if (listenBar) listenBar.style.width = Math.max(12, pct) + "%";

        // Learn quiet room, then require speech clearly above it
        if (!heardSound) {
          noiseFloor = noiseFloor * 0.95 + rms * 0.05;
        }
        const speakGate = Math.max(0.018, noiseFloor * 2.8 + 0.01);
        const quietGate = Math.max(0.01, noiseFloor * 1.6 + 0.006);

        const now = Date.now();
        if (rms > speakGate) {
          speechFrames += 1;
          lastLoudAt = now;
          if (rms > speechPeak) speechPeak = rms;
          if (!heardSound && speechFrames >= 4) {
            heardSound = true;
            setLiveStatus("Слышу! Говори… (Стоп = микрофон)");
            if (heardText) {
              heardText.textContent = "🔊 слушаю…";
              heardText.classList.remove("is-empty");
            }
          }
        } else if (rms < quietGate) {
          speechFrames = Math.max(0, speechFrames - 2);
        }

        // Auto-stop ~1.2s after real speech ends (need a bit of speech first)
        if (
          heardSound &&
          lastLoudAt &&
          now - lastLoudAt > 1200 &&
          now - recordStartedAt > 2200 &&
          speechPeak > noiseFloor * 2
        ) {
          setLiveStatus("Останавливаю… пишу слова");
          finishWhisperCapture();
          return;
        }
        // Max 8 seconds
        if (recordStartedAt && now - recordStartedAt > 8000) {
          setLiveStatus("Останавливаю… пишу слова");
          finishWhisperCapture();
          return;
        }
        pcmRaf = requestAnimationFrame(tickLevel);
      };
      tickLevel();
    } catch (err) {
      console.warn("meter failed", err);
    }

    if (mySession !== captureSession) {
      try {
        if (recordStream) recordStream.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      recordStream = null;
      stopPcmCapture();
      return;
    }

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    try {
      mediaRecorder = mime ? new MediaRecorder(recordStream, { mimeType: mime }) : new MediaRecorder(recordStream);
    } catch (_) {
      mediaRecorder = new MediaRecorder(recordStream);
    }
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    mediaRecorder.start(200);
    recordStartedAt = Date.now();
    lastLoudAt = 0;
    speechFrames = 0;
    setLiveStatus("Слушаю… говори! Потом замолчи или нажми «Стоп»");

    autoStopTimer = setTimeout(() => {
      if (usingWhisper && !whisperBusy && mode && mySession === captureSession) {
        setLiveStatus("Останавливаю… пишу слова");
        finishWhisperCapture();
      }
    }, 8000);

    // Do NOT start Chrome SpeechRecognition here — it lies / praises too early.
    // Whisper alone writes the real words.
  }

  function acceptSpeech(text) {
    const clean = text.trim();
    if (clean.length < 2) return false;
    openConfirm(clean, mode || pendingMode || "game");
    return true;
  }

  function commitConfirmed() {
    const clean = confirmText.value.trim();
    if (!clean) return;
    confirmOpen = false;
    confirmBox.hidden = true;
    gameStatus.textContent = d().working;

    if (pendingMode === "site") {
      const data = parseSiteSpeech(clean);
      if (!data) return;
      const siteDetails = document.getElementById("site-write-box");
      if (siteDetails) siteDetails.open = true;
      siteMicHint.textContent = d().siteReady(data.name);
      siteStatus.textContent = "Записал: «" + data.name + "»";
      const praise = pickPraise(loadGames().length);
      showToast(praise, "Сайт «" + data.name + "» сохранён. Открой «Мой сайт».");
      setTimeout(() => {
        const line =
          typeof d().praiseSite === "function" ? d().praiseSite(praise, data.name) : d().siteReady(data.name);
        speak(line);
      }, 200);
      return;
    }

    const game = createGame(clean, "");
    if (!game) return;
    finishWithGame(game);
  }

  function attachRecHandlers() {
    rec.onstart = () => {
      setLiveListening(true);
      setLiveStatus("Слушаю… говори в микрофон громко и ясно");
      if (mode === "game") {
        gameStatus.textContent = d().micListening;
        micHint.textContent = d().micHintListen;
      } else if (mode === "site") {
        siteStatus.textContent = d().micListening;
      }
    };

    rec.onresult = (event) => {
      let interim = "";
      sessionFinals = "";
      for (let i = 0; i < event.results.length; i++) {
        const piece = (event.results[i][0] && event.results[i][0].transcript) || "";
        if (!piece) continue;
        if (event.results[i].isFinal) {
          sessionFinals = (sessionFinals + " " + piece).replace(/\s+/g, " ").trim();
        } else {
          interim += piece;
        }
      }
      const full = (pendingFinals + " " + sessionFinals + " " + interim).replace(/\s+/g, " ").trim();
      fullTranscript = full;
      if (full) {
        networkFails = 0;
        writeHeard(full, interim ? "Пишу… ещё говори" : "Есть слова! Можно говорить дальше или нажать микрофон");
      } else {
        setLiveStatus("Слушаю, но слов пока нет — говори громче");
      }
    };

    rec.onerror = (event) => {
      const code = event.error || "";
      if (code === "aborted") return;
      if (code === "no-speech") {
        setLiveStatus("Тихо… ничего не услышал. Говори громче и ближе к микрофону");
        return;
      }
      if (code === "offline" || code === "network") {
        networkFails += 1;
        // Do NOT stop listening and do NOT jump to the text box — keep trying to hear
        setLiveStatus(
          networkFails < 8
            ? "Связь с распознаванием мигает… Я всё ещё слушаю, говори!"
            : "Пока плохо ловит речь. Я всё равно слушаю — говори. (Если совсем не пишет — можно потом написать.)"
        );
        if (mode === "game") gameStatus.textContent = d().micListening;
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        stopListening();
        setLiveListening(false);
        setLiveStatus("Микрофон запрещён. Нажми замок у адреса сайта → Микрофон → Разрешить");
        micHint.textContent = "Разреши микрофон в браузере и нажми снова.";
        gameStatus.textContent = "Микрофон запрещён браузером.";
        return;
      }
      if (code === "audio-capture") {
        stopListening();
        setLiveListening(false);
        setLiveStatus("Микрофон не найден или занят другой программой.");
        micHint.textContent = "Микрофон не найден.";
        return;
      }
      setLiveStatus("Ошибка: " + code + ". Попробуй Chrome и F5.");
    };

    rec.onend = () => {
      if (sessionFinals) {
        pendingFinals = (pendingFinals + " " + sessionFinals).replace(/\s+/g, " ").trim();
        sessionFinals = "";
      }
      if (pendingFinals) {
        fullTranscript = pendingFinals;
        writeHeard(pendingFinals, finishing ? "Готово" : "Секунду… снова слушаю");
      }
      if (finishing || !mode) {
        setLiveListening(false);
        return;
      }
      clearRestart();
      restartTimer = setTimeout(() => {
        if (!mode || finishing) return;
        try {
          sessionFinals = "";
          rec = makeRec();
          attachRecHandlers();
          rec.start();
        } catch (_) {
          setTimeout(() => {
            if (!mode || finishing) return;
            try {
              sessionFinals = "";
              rec = makeRec();
              attachRecHandlers();
              rec.start();
            } catch (err) {
              stopListening();
              setLiveListening(false);
              setLiveStatus("Не удалось слушать. Нажми F5 и открой в Google Chrome.");
              micHint.textContent = "Не удалось держать микрофон. Обнови страницу (F5).";
              gameStatus.textContent = String(err && err.message ? err.message : "ошибка");
            }
          }, 400);
        }
      }, 250);
    };
  }

  function makeRec() {
    const r = new SpeechRecognition();
    r.lang = speechLang() || "ru-RU";
    // Alternate mode after network fails — sometimes works better
    const useBurst = networkFails >= 2;
    r.continuous = !useBurst;
    r.interimResults = true;
    r.maxAlternatives = 3;
    return r;
  }

  async function ensureMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("no-media");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // MUST release tracks before SpeechRecognition — otherwise Chrome often writes nothing
    stream.getTracks().forEach((t) => t.stop());
  }

  async function startListening(nextMode) {
    if (!SpeechRecognition) {
      setLiveStatus("Этот браузер плохо слышит речь. Попробуй Google Chrome или Microsoft Edge.");
      return;
    }
    stopTalking();
    stopListening();
    mode = nextMode;
    finishing = false;
    lastHeard = "";
    fullTranscript = "";
    pendingFinals = "";
    sessionFinals = "";
    networkFails = 0;
    clearLiveWrite("…");
    setLiveListening(true);
    setLiveStatus("Слушаю тебя… говори! Я жду твои слова.");
    if (confirmBox) confirmBox.hidden = true;
    const stopBtn = document.getElementById("btn-mic-stop");
    if (stopBtn) stopBtn.hidden = false;

    if (nextMode === "game") {
      setGameMicUi(true);
      setSiteMicUi(false);
      gameStatus.textContent = d().micListening;
      micHint.textContent = d().micHintListen;
      startListenCountdown();
    } else {
      setSiteMicUi(true);
      setGameMicUi(false);
      siteStatus.textContent = d().micListening;
      siteMicHint.textContent = d().siteMicHint;
      startListenCountdown();
    }

    // Do NOT call getUserMedia first — let SpeechRecognition own the mic
    closeMicMeter();
    await new Promise((r) => setTimeout(r, 120));
    if (mode !== nextMode) return;

    rec = makeRec();
    attachRecHandlers();
    try {
      rec.start();
      setLiveStatus("Слушаю… скажи идею игры");
    } catch (err) {
      // Retry once after a short wait (Chrome sometimes needs it)
      await new Promise((r) => setTimeout(r, 400));
      if (mode !== nextMode) return;
      try {
        rec = makeRec();
        attachRecHandlers();
        rec.start();
        setLiveStatus("Слушаю… скажи идею игры");
      } catch (err2) {
        stopListening();
        setLiveListening(false);
        setLiveStatus("Не запустилось. Открой Microsoft Edge или Chrome и нажми F5.");
        micHint.textContent = "Не удалось запустить микрофон.";
        gameStatus.textContent = String(err2 && err2.message ? err2.message : "ошибка");
        if (stopBtn) stopBtn.hidden = true;
      }
    }
  }

  const site = loadSite();
  siteName.value = site.name || "";
  siteAbout.value = site.about || "";

  function bindLangButtons() {
    if (!langBtns) return;
    langBtns.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.onclick = () => {
        I18n.setLang(btn.getAttribute("data-lang"));
        stopTalking();
        if (mode) stopListening();
        refreshUi();
        speak(d().welcome);
      };
    });
  }

  function refreshUi() {
    I18n.applyStudioDom();
    if (window.SkazhiSeason) window.SkazhiSeason.apply();
    renderList();
    bindLangButtons();
    if (!mode) {
      setGameMicUi(false);
      setSiteMicUi(false);
      aiSpeak.hidden = false;
      aiText.textContent = d().welcome;
      micHint.textContent = d().micHint;
    }
  }

  try {
    refreshUi();
  } catch (err) {
    console.error("refreshUi", err);
  }

  // live clock — kids + adults
  function tickClock() {
    try {
      const now = new Date();
      if (clockNow) {
        clockNow.textContent = now.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        });
      }
      if (clockKids) clockKids.textContent = kidsHour(now);
      if (!speakStartedAt) updateLeftDisplays(null);
    } catch (err) {
      if (clockNow) {
        const n = new Date();
        clockNow.textContent =
          String(n.getHours()).padStart(2, "0") +
          ":" +
          String(n.getMinutes()).padStart(2, "0") +
          ":" +
          String(n.getSeconds()).padStart(2, "0");
      }
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  const reloadBtn = document.getElementById("btn-reload");
  if (reloadBtn) {
    reloadBtn.onclick = () => {
      try {
        location.reload();
      } catch (_) {
        location.href = location.href;
      }
    };
  }
  if (langSelect) {
    langSelect.addEventListener("change", () => {
      I18n.setLang(langSelect.value);
      stopTalking();
      if (mode) stopListening();
      refreshUi();
      speak(d().welcome);
    });
  }

  const yesBtn = document.getElementById("btn-confirm-yes");
  const retryBtn = document.getElementById("btn-confirm-retry");
  const editBtn = document.getElementById("btn-confirm-edit");
  if (yesBtn) {
    yesBtn.onclick = () => {
      stopTalking();
      commitConfirmed();
    };
  }
  if (retryBtn) {
    retryBtn.onclick = () => {
      stopTalking();
      confirmBox.hidden = true;
      confirmOpen = false;
      startWhisperCapture(pendingMode || "game");
    };
  }
  if (editBtn) {
    editBtn.onclick = () => {
      stopTalking();
      confirmText.readOnly = false;
      confirmText.focus();
    };
  }

  if (toast) {
    document.getElementById("toast-close").onclick = () => {
      stopTalking();
      hideToast();
    };
    document.getElementById("toast-test").onclick = () => {
      stopTalking();
      hideToast();
      if (lastGameId) location.href = "test.html?id=" + encodeURIComponent(lastGameId);
      else location.href = "test.html";
    };
  }

  btnSaveSite.onclick = () => {
    stopTalking();
    const data = saveSiteData(siteName.value, siteAbout.value);
    const praise = pickPraise(loadGames().length);
    showToast(praise, d().toastDoneBody);
    const line =
      typeof d().praiseSite === "function" ? d().praiseSite(praise, data.name) : d().siteSaved(data.name);
    speak(line);
  };

  btnMake.onclick = () => {
    stopTalking();
    const game = createGame(gamePrompt.value, gameName.value);
    if (!game) {
      setLiveStatus("Напиши идею в большом поле, потом нажми «Создать игру».");
      if (gamePrompt) gamePrompt.focus();
      return;
    }
    finishWithGame(game);
  };

  if (gamePrompt) {
    gamePrompt.addEventListener("input", () => {
      const v = gamePrompt.value.trim();
      if (v) writeHeard(v, "Пишу с клавиатуры — так всегда работает");
      else clearLiveWrite("…");
    });
    gamePrompt.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        btnMake.click();
      }
    });
  }

  btnPlay.onclick = () => {
    if (!lastGameId) return;
    window.location.href = "play.html?id=" + encodeURIComponent(lastGameId);
  };

  if (!SpeechRecognition && !window.MediaRecorder) {
    if (btnMic) btnMic.disabled = true;
    if (btnSiteMic) btnSiteMic.disabled = true;
    if (micLabel) micLabel.textContent = (d().micLabel || "Микрофон");
    if (micHint) micHint.textContent = "Открой Google Chrome или Microsoft Edge.";
  } else {
    if (btnMic) {
      btnMic.onclick = () => {
        try {
          stopTalking();
          // Listening or opening mic → STOP (even before MediaRecorder starts)
          if (usingWhisper || mode === "game" || mode === "site") {
            if (whisperBusy) {
              setLiveStatus("Ещё пишу слова… подожди секунду");
              return;
            }
            setLiveStatus("Останавливаю… пишу слова");
            finishWhisperCapture();
            return;
          }
          if (whisperBusy) {
            setLiveStatus("Ещё пишу слова… подожди секунду");
            return;
          }
          if (confirmBox) confirmBox.hidden = true;
          startWhisperCapture("game");
        } catch (err) {
          console.error(err);
          setLiveStatus("Ошибка микрофона.");
        }
      };
    }

    if (btnSiteMic) {
      btnSiteMic.onclick = () => {
        try {
          stopTalking();
          if (usingWhisper || mode === "site") {
            if (whisperBusy) return;
            finishWhisperCapture();
            return;
          }
          if (whisperBusy) return;
          startWhisperCapture("site");
        } catch (err) {
          console.error(err);
        }
      };
    }
  }

  const earsStatus = document.getElementById("ears-status");

  function setEarsUi(text, kind) {
    if (!earsStatus) return;
    earsStatus.textContent = text;
    earsStatus.classList.toggle("is-ready", kind === "ready");
    earsStatus.classList.toggle("is-bad", kind === "bad");
  }

  async function bootEars() {
    setEarsUi("Уши: ищу…", "bad");
    const W = await waitForWhisper(20000);
    if (!W) {
      setEarsUi("Уши: нужен интернет", "bad");
      return;
    }
    setEarsUi("Уши: качаю…", "bad");
    try {
      await W.warm((p) => {
        if (!p || typeof p.progress !== "number") return;
        if (p.status === "progress" || p.status === "download") {
          setEarsUi("Уши: качаю " + Math.round(p.progress * 100) + "%", "bad");
        }
      });
      setEarsUi("Уши: готовы ✓", "ready");
    } catch (err) {
      setEarsUi("Уши: ошибка", "bad");
    }
  }

  bootEars();
})();
