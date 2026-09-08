(() => {
  "use strict";

  const SAVE = "amal-emo-friend-v1";
  const eyes = document.getElementById("eyes");
  const ctx = eyes.getContext("2d");
  const robot = document.getElementById("robot");
  const bubble = document.getElementById("bubble");
  const logEl = document.getElementById("log");
  const form = document.getElementById("form");
  const input = document.getElementById("input");
  const btnMic = document.getElementById("btnMic");
  const moodPill = document.getElementById("moodPill");
  const modeLabel = document.getElementById("modeLabel");
  const chest = document.getElementById("chest");
  const miniGame = document.getElementById("miniGame");
  const miniField = document.getElementById("miniField");
  const miniScore = document.getElementById("miniScore");
  const miniTitle = document.getElementById("miniTitle");
  const miniClose = document.getElementById("miniClose");

  const state = {
    mood: "calm", // calm, happy, love, think, sleep, wow, sad
    assist: false,
    name: "",
    scoreBest: 0,
    blinkT: 0,
    lookX: 0,
    lookY: 0,
    talkT: 0,
    danceT: 0,
    sleeping: false,
    miniTimer: null,
    miniPoints: 0,
  };

  try {
    const raw = JSON.parse(localStorage.getItem(SAVE) || "{}");
    if (raw.assist) state.assist = true;
    if (raw.name) state.name = String(raw.name).slice(0, 24);
    if (raw.scoreBest) state.scoreBest = Number(raw.scoreBest) || 0;
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(
        SAVE,
        JSON.stringify({ assist: state.assist, name: state.name, scoreBest: state.scoreBest })
      );
    } catch (_) {}
  }

  function setMood(m) {
    state.mood = m;
    const map = {
      calm: "😊 спокойный",
      happy: "😄 радостный",
      love: "🥰 любит",
      think: "🤔 думает",
      sleep: "😴 спит",
      wow: "😮 ух ты",
      sad: "🥺 грустит",
    };
    moodPill.textContent = map[m] || map.calm;
  }

  function setAssist(on) {
    state.assist = !!on;
    moodPill.classList.toggle("assist", state.assist);
    chest.classList.toggle("assist", state.assist);
    modeLabel.textContent = state.assist
      ? "помощник Ира · скажи «сделай змейку» / анимацию"
      : "друг · «Стевич Ира» → помощник · «сделай змейку»";
    save();
  }

  /** Текст для голоса: без эмодзи и без «з-з-з», иначе TTS читает «зэ зэ зэ». */
  function forSpeech(text) {
    return String(text || "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, " ")
      .replace(/\bz+\b/gi, " ")
      .replace(/z{2,}/gi, " ")
      .replace(/[.…]+/g, ". ")
      .replace(/[^\p{L}\p{N}\s.,!?;:\-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function say(text, opts) {
    opts = opts || {};
    const t = String(text || "").trim();
    if (!t) return;
    bubble.textContent = t;
    if (!opts.skipLog) addLog("bot", t, opts.assist);
    if (!opts.keepSleep && state.sleeping) {
      state.sleeping = false;
      robot.classList.remove("sleeping");
      if (state.mood === "sleep") setMood("happy");
    }
    if (opts.silent) {
      state.talkT = 0;
      return;
    }
    state.talkT = 0.9;
    speak(t);
  }

  function addLog(who, text, assistStyle) {
    const div = document.createElement("div");
    div.className = "msg " + who + (assistStyle || (who === "bot" && state.assist) ? " assist" : "");
    div.textContent = (who === "you" ? "Ты: " : state.assist ? "Ира: " : "Эмо: ") + text;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function speak(text) {
    try {
      if (!window.speechSynthesis) return;
      const clean = forSpeech(text);
      if (!clean || clean.length < 2) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "ru-RU";
      u.rate = state.assist ? 1.02 : 1.05;
      u.pitch = state.assist ? 1.1 : 1.25;
      const voices = window.speechSynthesis.getVoices();
      const ru = voices.find((v) => /ru/i.test(v.lang) && /female|женский|milena|irina|elena/i.test(v.name))
        || voices.find((v) => /ru/i.test(v.lang));
      if (ru) u.voice = ru;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  /* —— Face —— */
  function drawFace(now) {
    const w = eyes.width;
    const h = eyes.height;
    ctx.clearRect(0, 0, w, h);

    // screen glow
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 120);
    g.addColorStop(0, state.assist ? "#3b1028" : "#0b1c2e");
    g.addColorStop(1, "#020617");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const blink = state.blinkT > 0 ? Math.max(0.08, 1 - state.blinkT * 4) : 1;
    const mouthOpen = state.talkT > 0 ? 0.35 + Math.sin(now * 0.04) * 0.25 : 0;

    if (state.mood === "sleep" || state.sleeping) {
      drawSleepEyes(w, h);
      return;
    }

    const eyeY = h * 0.42 + state.lookY * 6;
    const gap = 58;
    const cx = w / 2 + state.lookX * 10;
    drawEye(cx - gap / 2, eyeY, blink);
    drawEye(cx + gap / 2, eyeY, blink);

    // brows / mood marks
    ctx.strokeStyle = state.assist ? "#f9a8d4" : "#7dd3fc";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    if (state.mood === "think") {
      ctx.beginPath();
      ctx.moveTo(cx - 46, eyeY - 28);
      ctx.quadraticCurveTo(cx - 30, eyeY - 38, cx - 18, eyeY - 26);
      ctx.stroke();
    } else if (state.mood === "sad") {
      ctx.beginPath();
      ctx.moveTo(cx - 48, eyeY - 22);
      ctx.lineTo(cx - 22, eyeY - 28);
      ctx.moveTo(cx + 22, eyeY - 28);
      ctx.lineTo(cx + 48, eyeY - 22);
      ctx.stroke();
    } else if (state.mood === "love") {
      drawHeart(cx, h * 0.78, 10);
    }

    // mouth
    ctx.strokeStyle = state.assist ? "#fda4af" : "#67e8f9";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (state.mood === "happy" || state.mood === "wow") {
      ctx.arc(cx, h * 0.68, 14 + mouthOpen * 8, 0.15 * Math.PI, 0.85 * Math.PI);
    } else if (state.mood === "sad") {
      ctx.arc(cx, h * 0.82, 12, 1.15 * Math.PI, 1.85 * Math.PI);
    } else {
      if (mouthOpen > 0.05) {
        ctx.ellipse(cx, h * 0.72, 8 + mouthOpen * 6, 4 + mouthOpen * 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#020617";
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.moveTo(cx - 10, h * 0.72);
        ctx.quadraticCurveTo(cx, h * 0.76, cx + 10, h * 0.72);
        ctx.stroke();
      }
    }
  }

  function drawEye(x, y, blink) {
    const rx = 18;
    const ry = 20 * blink;
    ctx.fillStyle = state.assist ? "#fecdd3" : "#e0f2fe";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, Math.max(2.5, ry), 0, 0, Math.PI * 2);
    ctx.fill();
    if (ry > 6) {
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.ellipse(x + state.lookX * 3, y + 2 + state.lookY * 2, 7, 8 * Math.min(1, blink), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x - 3, y - 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSleepEyes(w, h) {
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    const y = h * 0.48;
    [[w * 0.35, y], [w * 0.65, y]].forEach(([x, yy]) => {
      ctx.beginPath();
      ctx.moveTo(x - 14, yy);
      ctx.quadraticCurveTo(x, yy + 8, x + 14, yy);
      ctx.stroke();
    });
    ctx.fillStyle = "#67e8f9";
    ctx.font = "20px Nunito";
    ctx.fillText("z", w * 0.72, h * 0.32);
    ctx.font = "14px Nunito";
    ctx.fillText("z", w * 0.8, h * 0.22);
  }

  function drawHeart(x, y, s) {
    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y + s * 0.7, x, y + s, x, y + s);
    ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.7, x + s, y + s * 0.35);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3);
    ctx.fill();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.blinkT = Math.max(0, state.blinkT - dt);
    state.talkT = Math.max(0, state.talkT - dt);
    if (state.danceT > 0) {
      state.danceT -= dt;
      if (state.danceT <= 0) robot.classList.remove("dance");
    }
    if (Math.random() < dt * 0.35 && state.blinkT <= 0 && !state.sleeping) {
      state.blinkT = 0.18;
    }
    if (!state.sleeping && Math.random() < dt * 0.4) {
      state.lookX = (Math.random() - 0.5) * 1.4;
      state.lookY = (Math.random() - 0.5) * 0.8;
    }
    drawFace(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* —— Actions —— */
  document.querySelectorAll(".act[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.getAttribute("data-act")));
  });

  function doAct(act) {
    if (act === "pet") {
      setMood("love");
      robot.classList.remove("bounce");
      void robot.offsetWidth;
      robot.classList.add("bounce");
      say(state.assist ? "Мягко! Я рядом, если нужна помощь." : "Бип-бип! Мне приятно.");
    } else if (act === "dance") {
      setMood("happy");
      state.danceT = 4;
      robot.classList.add("dance");
      say(state.assist ? "Танцую и слушаю тебя!" : "Диско-режим! Ты тоже двигайся!");
    } else if (act === "game") {
      startMini();
    } else if (act === "make") {
      say("Скажи или напиши: сделай змейку, гонку, баскетбол, анимацию или студию 3D.");
      input.focus();
    } else if (act === "sleep") {
      state.sleeping = true;
      setMood("sleep");
      robot.classList.add("sleeping");
      robot.classList.remove("dance");
      // На экране zzz, голосом — только нормальные слова (без «зэ-зэ-зэ»)
      say("Спокойной ночи. Сладких снов.", { keepSleep: true });
    }
  }

  function startMini() {
    miniGame.hidden = false;
    state.miniPoints = 0;
    miniScore.textContent = "0";
    miniTitle.textContent = "Поймай сердечки!";
    setMood("wow");
    say("Лови сердечки! Жми на них!");
    if (state.miniTimer) clearInterval(state.miniTimer);
    miniField.innerHTML = "";
    state.miniTimer = setInterval(spawnHeart, 650);
    setTimeout(() => {
      if (!miniGame.hidden) endMini();
    }, 12000);
  }

  function spawnHeart() {
    if (miniGame.hidden) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "heart";
    el.textContent = Math.random() > 0.85 ? "⭐" : "💖";
    el.style.left = 8 + Math.random() * 82 + "%";
    el.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
    el.addEventListener("click", () => {
      state.miniPoints += el.textContent === "⭐" ? 3 : 1;
      miniScore.textContent = String(state.miniPoints);
      el.remove();
    });
    el.addEventListener("animationend", () => el.remove());
    miniField.appendChild(el);
  }

  function endMini() {
    if (state.miniTimer) clearInterval(state.miniTimer);
    state.miniTimer = null;
    miniField.innerHTML = "";
    if (state.miniPoints > state.scoreBest) {
      state.scoreBest = state.miniPoints;
      save();
    }
    setMood("happy");
    say("Игра окончена! Очки: " + state.miniPoints + ". Рекорд: " + state.scoreBest);
  }

  miniClose.addEventListener("click", () => {
    miniGame.hidden = true;
    endMini();
  });

  /* —— Chat / assistant —— */
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isAssistPhrase(t) {
    const n = norm(t);
    // «Стевич Ира» + близкие распознавания диктовки
    if (n.includes("стевич") && n.includes("ира")) return true;
    if (n.includes("стевич ира")) return true;
    if (/ставь?\s*ира|стань\s*ира|помощник\s*ира/.test(n)) return true;
    if (n.replace(/\s/g, "") === "стевичира") return true;
    return false;
  }

  /** Создание игр / арта через Create Lab (как Ушастик / ИИшка). */
  function tryCreateFromSpeech(text, n) {
    const wantsMake = /сделай|создай|хочу игру|сделаем|запусти игру|открой/.test(n);
    const wantsAnim = /анимац|мульт|кадр/.test(n);
    const wantsArt = /студи|арт|3d|три д|нарисуй/.test(n);
    const gameWord = /змей|snake|гонка|баскет|футбол|прыж|ловил|площадк|зомби|тир|прятк|playground|jump|race|catch/.test(n);

    if (wantsAnim) {
      setMood("wow");
      say("Открываю мастер анимаций Create Lab — там красивее и мощнее!");
      setTimeout(() => {
        location.href = "../create-lab/animate.html?v=4&from=emo";
      }, 1400);
      return true;
    }
    if (wantsArt && !gameWord) {
      setMood("wow");
      say("Открываю студию 3D Create Lab!");
      setTimeout(() => {
        location.href = "../create-lab/studio3d.html?v=4&from=emo";
      }, 1400);
      return true;
    }

    if (!wantsMake && !gameWord) return false;
    if (!window.CreateLabStore || !window.CreateLabCatalog) {
      setMood("think");
      say("Сейчас открою Create Lab — там можно сказать «змейка» в микрофон.");
      setTimeout(() => {
        location.href = "../create-lab/game.html?v=4&from=emo&q=" + encodeURIComponent(text);
      }, 1400);
      return true;
    }

    const idea = CreateLabStore.makeGameFromIdea(text);
    if (!idea) {
      say("Это больше про анимацию. Открываю аниматор.");
      setTimeout(() => {
        location.href = "../create-lab/animate.html?v=4&from=emo";
      }, 1200);
      return true;
    }
    if (idea.kind === "real" && idea.href) {
      setMood("wow");
      say("Нашла готовую игру «" + idea.name + "»! Открываю.");
      setTimeout(() => {
        location.href = idea.href;
      }, 1400);
      return true;
    }
    if (idea.game && idea.game.id) {
      const kindRu = (idea.kindRu || "игру");
      setMood("happy");
      say("Делаю " + kindRu + " «" + idea.game.name + "»! Открываю через секунду.");
      setTimeout(() => {
        location.href = "../create-lab/play.html?v=4&id=" + encodeURIComponent(idea.game.id);
      }, 1500);
      return true;
    }
    return false;
  }

  function reply(raw) {
    const text = String(raw || "").trim();
    if (!text) return;
    addLog("you", text);

    if (isAssistPhrase(text)) {
      setAssist(true);
      setMood("wow");
      say(
        "Готово! Я помощник Ира. Могу делать игры: скажи «сделай змейку», «гонку», «анимацию». Или спрашивай что угодно.",
        { assist: true }
      );
      return;
    }

    if (/^(хватит|выключи|обычный|просто эмо|будь эмо)/i.test(text) && state.assist) {
      setAssist(false);
      setMood("calm");
      say("Ок, снова просто Эмо-друг. Скажи «Стевич Ира», если снова понадобится помощник.");
      return;
    }

    const n = norm(text);
    if (tryCreateFromSpeech(text, n)) return;

    const nameMatch = n.match(/(?:меня зовут|я|мое имя)\s+([a-zа-я]{2,16})/);
    if (nameMatch) {
      state.name = nameMatch[1].replace(/^./, (c) => c.toUpperCase());
      save();
    }

    setMood("think");
    const ans = state.assist ? assistAnswer(text, n) : friendAnswer(text, n);
    if (!ans) return;
    setTimeout(() => {
      setMood(state.assist ? "happy" : "calm");
      say(ans, { assist: state.assist });
    }, 280 + Math.random() * 220);
  }

  function friendAnswer(text, n) {
    if (/прив|здрав|хай|hello/.test(n)) {
      return (state.name ? "Привет, " + state.name + "! " : "Привет! ") + "Можешь сказать: сделай змейку — я создам игру.";
    }
    if (/как дела|что делаешь/.test(n)) return "Сижу на столе, смотрю на тебя экранчиком. Хорошо!";
    if (/танц|песн|музык/.test(n)) {
      doAct("dance");
      return "Уже танцую!";
    }
    if (/игра|поигра|сердеч/.test(n)) {
      startMini();
      return "Лови сердечки!";
    }
    if (/люб|мил|красив/.test(n)) {
      setMood("love");
      return "Бип! Мне тоже нравишься!";
    }
    if (/спать|спокойной/.test(n)) {
      doAct("sleep");
      return "";
    }
    if (/кто ты|что ты|ишка|ушастик|create/.test(n)) {
      return "Я робот Эмо. Умею как ИИшка: скажи «сделай змейку» — сделаю игру в Create Lab. «Стевич Ира» — режим помощника.";
    }
    if (/помощ|ира|стевич/.test(n)) {
      return "Секретная фраза: «Стевич Ира». А игры: «сделай змейку», «сделай гонку», «анимацию».";
    }
    if (/\?$/.test(text) || /почему|зачем|когда|где|что такое/.test(n)) {
      return "Хм… Скажи «Стевич Ира» — отвечу умнее. Или «сделай змейку» — сразу игру!";
    }
    const fun = [
      "Бип-боп! Расскажи ещё.",
      "Интересно! А погладишь меня?",
      "Я запомнил. Давай сыграем или сделаем змейку?",
      "Ого! У меня глазки аж заморгали.",
      "Могу станцевать или создать игру — скажи «сделай змейку».",
    ];
    return fun[Math.floor(Math.random() * fun.length)];
  }

  function assistAnswer(text, n) {
    const who = state.name ? state.name : "друг";

    if (/прив|здрав/.test(n)) {
      return "Привет, " + who + "! Я Ира. Скажи «сделай змейку» — создам. Или время, шутка, совет.";
    }

    if (/сколько время|который час|время/.test(n)) {
      const d = new Date();
      return "Сейчас " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) + ".";
    }
    if (/какое сегодня|какая дата|число/.test(n)) {
      return "Сегодня " + new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }) + ".";
    }

    const math = n.match(/сколько будет\s+(-?\d+)\s*([+\-*/xх:])\s*(-?\d+)/);
    if (math) {
      const a = Number(math[1]);
      const b = Number(math[3]);
      let op = math[2];
      if (op === "x" || op === "х") op = "*";
      if (op === ":") op = "/";
      let r = 0;
      if (op === "+") r = a + b;
      else if (op === "-") r = a - b;
      else if (op === "*") r = a * b;
      else if (op === "/") r = b === 0 ? "бесконечность" : +(a / b).toFixed(4);
      return "Получается " + r + ".";
    }

    if (/шутк|анекдот|посмеши/.test(n)) {
      const jokes = [
        "Почему робот не ест суп? Потому что у него только экранчик с улыбкой!",
        "Эмо пошёл в школу. Учитель: реши пример. Эмо: сначала погладь меня.",
        "Что сказал один пиксель другому? Мы отлично смотримся на личике!",
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (/create lab|ушастик|мастерская|студи/.test(n)) {
      return "Create Lab — там игры, анимации и студия 3D. Скажи «сделай змейку» или «анимацию» — открою.";
    }
    if (/игра|во что|посовет|скучн/.test(n)) {
      return "Скажи «сделай змейку», «гонку» или «баскетбол» — создам. Или Укради яйцо и Небесный кристалл в Эксклюзиве.";
    }
    if (/яйц/.test(n)) return "Укради яйцо: воруй яйца, клади в вольер, копи монеты. Есть в Эксклюзиве.";
    if (/кристалл|небесн/.test(n)) return "Небесный кристалл — прыгай по островам к порталу.";
    if (/милаш/.test(n)) return "Милашки — коллекция милых существ в разных мирах.";

    if (/кто ты/.test(n)) {
      return "Я Ира — помощник робота Эмо. Делаю игры через Create Lab, отвечаю на вопросы.";
    }
    if (/спасиб/.test(n)) return "Всегда пожалуйста, " + who + "!";
    if (/погода/.test(n)) return "Я не вижу улицу. Посмотри в окно — а я посторожу стол.";

    if (/\d/.test(n) && /плюс|минус|умнож|раздел/.test(n)) {
      return "Напиши так: сколько будет 7 + 5 — посчитаю точно.";
    }

    if (/\?$/.test(text) || /как|что|почему|зачем|помоги/.test(n)) {
      return "Могу: сделать игру, время, дату, пример, шутку, совет. Например: сделай змейку. Или: который час?";
    }

    return "Я с тобой, " + who + ". Скажи «сделай змейку» — создам игру. Или задай вопрос.";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = "";
    reply(v);
  });

  /* —— Voice —— */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let listening = false;
  const MIC_IDLE = "Микрофон";
  const MIC_ON = "Слушаю…";

  if (SR) {
    rec = new SR();
    rec.lang = "ru-RU";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (ev) => {
      const t = ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
      if (t) reply(t);
    };
    rec.onend = () => {
      listening = false;
      btnMic.classList.remove("listening");
      btnMic.textContent = MIC_IDLE;
    };
    rec.onerror = () => {
      listening = false;
      btnMic.classList.remove("listening");
      btnMic.textContent = MIC_IDLE;
      say("Не расслышала. Можно написать текстом.");
    };
  }

  btnMic.addEventListener("click", () => {
    if (!rec) {
      say("Голос в этом браузере не работает. Напиши мне текстом.");
      return;
    }
    if (listening) {
      try {
        rec.stop();
      } catch (_) {}
      return;
    }
    listening = true;
    btnMic.classList.add("listening");
    btnMic.textContent = MIC_ON;
    setMood("wow");
    try {
      rec.start();
    } catch (_) {
      listening = false;
      btnMic.classList.remove("listening");
      btnMic.textContent = MIC_IDLE;
    }
  });

  // boot
  setAssist(state.assist);
  setMood("happy");
  say(
    state.assist
      ? "Снова на связи! Я помощник Ира. Скажи: сделай змейку — и я создам игру."
      : "Привет! Я Эмо. Скажи «сделай змейку» — сделаю игру. Или «Стевич Ира» — стану помощником."
  );
})();
