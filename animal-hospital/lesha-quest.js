(() => {
  "use strict";

  const SAVE = "lesha-quest-v1";
  const TOTAL = 5;

  const STAGES = [
    {
      title: "Комната 1 · Только ты",
      type: "pick",
      riddle: "Эта игра сделана для одного человека. Кто проходит?",
      hint: "Ты же сам просил — сюрприз только для тебя.",
      picks: [
        { label: "Для всех подряд", sub: "нет", wrong: true },
        { label: "Для гостей", sub: "нет", wrong: true },
        { label: "Для меня", sub: "✦", wrong: false },
        { label: "Не знаю", sub: "…", wrong: true },
      ],
      ok: "✓ Конечно. Поехали.",
    },
    {
      title: "Комната 2 · Больница",
      riddle: "Сколько монет у админа в Animal Hospital? (одно слово или символ)",
      hint: "Смотри кошелёк в лобби. Это не число.",
      check: (v) => /^(∞|inf|беск|бесконеч|бесконечно|infinity)$/i.test(v.trim()) || v.trim() === "∞",
      ok: "✓ ∞ — конечно.",
    },
    {
      title: "Комната 3 · Память",
      type: "sequence",
      riddle: "Запомни порядок и повтори. Смотри на символы.",
      hint: "Сначала смотри — потом нажимай так же.",
    },
    {
      title: "Комната 4 · Вилла",
      riddle: "Где в больнице отдыхают под звёздами? (одно слово)",
      hint: "Комната с баром и светом. Была переименована из «перерыва».",
      check: (v) => /^(вилла|villa|отдых|звёзд|звезд)/i.test(v.trim()),
      ok: "✓ Тихо и тепло. Как надо.",
    },
    {
      title: "Комната 5 · Создатели",
      type: "pick",
      riddle: "Sammy и Jendel снова соревнуются. Что ты выберешь?",
      hint: "В Animal Hospital есть сюрприз, когда оба в порядке.",
      picks: [
        { label: "Пусть Sammy победит", sub: "красный", wrong: true },
        { label: "Пусть Jendel победит", sub: "синий", wrong: true },
        { label: "Перемирие · обоих вылечить", sub: "✦", wrong: false },
        { label: "Выгнать обоих", sub: "…", wrong: true },
      ],
      ok: "✓ Мир лучше войны.",
    },
  ];

  const card = document.getElementById("card");
  const stageEl = document.getElementById("stage");
  const progress = document.getElementById("progress");
  const msg = document.getElementById("msg");

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { stage: 0, done: false, code: null, seqKey: randSeq() };
  }

  function save() {
    localStorage.setItem(SAVE, JSON.stringify(state));
  }

  function randSeq() {
    const icons = ["🐾", "☕", "✦", "💡"];
    const len = 4;
    const seq = [];
    for (let i = 0; i < len; i++) seq.push(icons[(Math.random() * icons.length) | 0]);
    return seq.join(",");
  }

  function norm(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е");
  }

  function makeCode() {
    const n = ((Date.now() / 1000) | 0) % 10000;
    return "L" + n.toString().padStart(4, "0");
  }

  function renderProgress() {
    progress.innerHTML = "";
    for (let i = 0; i < TOTAL; i++) {
      const d = document.createElement("div");
      d.className = "dot" + (state.done || i < state.stage ? " done" : i === state.stage ? " now" : "");
      progress.appendChild(d);
    }
  }

  function showMsg(text, ok) {
    msg.textContent = text || "";
    msg.className = "msg" + (ok === true ? " ok" : ok === false ? " bad" : "");
  }

  function nextStage() {
    state.stage += 1;
    if (state.stage >= TOTAL && !state.done) {
      state.done = true;
      state.code = makeCode();
    }
    save();
    render();
  }

  function renderIntro() {
    stageEl.innerHTML =
      `<p class="brand">✦ Сюрприз-квест</p>` +
      `<p class="sub">Только для тебя. Пять загадок. Без кодов в чате. Если застрянешь — спроси меня, помогу, но не сразу всё.</p>` +
      `<p class="riddle">Когда пройдёшь до конца — сфоткай экран с кодом и пришли мне. Так я увижу, что ты правда прошёл.</p>` +
      `<div class="row"><button type="button" class="btn gold" id="btnStart">Начать</button></div>`;
    document.getElementById("btnStart").addEventListener("click", () => {
      if (state.stage === 0 && !state.done) nextStage();
      else render();
    });
  }

  function renderFinal() {
    renderProgress();
    stageEl.innerHTML =
      `<p class="brand">✦ Прошёл!</p>` +
      `<p class="sub">Ты дошёл до конца. Молодец.</p>` +
      `<div class="final-code">` +
      `<span>Твой код прохождения</span>` +
      `<strong id="winCode">${state.code || makeCode()}</strong>` +
      `</div>` +
      `<p class="riddle">Сфоткай этот экран (код должен быть виден) и отправь мне в чат. Иногда я помогу по загадкам — просто спроси.</p>` +
      `<div class="row">` +
      `<button type="button" class="btn" id="btnAgain">Пройти ещё раз</button>` +
      `<a class="btn ghost" href="./index.html" style="text-decoration:none;display:inline-flex;align-items:center;">← Больница</a>` +
      `</div>`;
    if (!state.code) {
      state.code = document.getElementById("winCode").textContent;
      save();
    }
    document.getElementById("btnAgain").addEventListener("click", () => {
      state = { stage: 0, done: false, code: null, seqKey: randSeq() };
      save();
      render();
    });
    spawnSparkles(24);
  }

  function renderSequence(stage, idx) {
    const icons = ["🐾", "☕", "✦", "💡"];
    const seq = (state.seqKey || "🐾,☕,✦,💡").split(",");
    let phase = "watch";
    let step = 0;
    let input = [];
    let flashT = 0;

    stageEl.innerHTML =
      `<h2>${stage.title}</h2>` +
      `<p class="riddle">${stage.riddle}</p>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint}</div>` +
      `<p class="sub" id="seqStatus">Смотри…</p>` +
      `<div class="seq-grid" id="seqGrid"></div>` +
      `<div class="row"><button type="button" class="btn ghost" id="btnReplay">Показать снова</button></div>`;

    const grid = document.getElementById("seqGrid");
    const status = document.getElementById("seqStatus");
    const btns = icons.map((ic, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "seq-btn";
      b.textContent = ic;
      b.dataset.i = String(i);
      b.disabled = true;
      b.addEventListener("click", () => onPick(ic));
      grid.appendChild(b);
      return b;
    });

    document.getElementById("hintBtn").addEventListener("click", () => {
      document.getElementById("hintBox").classList.add("show");
    });
    document.getElementById("btnReplay").addEventListener("click", () => {
      phase = "watch";
      step = 0;
      input = [];
      btns.forEach((b) => (b.disabled = true));
      playSeq();
    });

    function flashIcon(ic) {
      const i = icons.indexOf(ic);
      if (i < 0) return;
      btns[i].classList.add("flash");
      setTimeout(() => btns[i].classList.remove("flash"), 420);
    }

    function playSeq() {
      status.textContent = "Смотри…";
      let t = 0;
      seq.forEach((ic, n) => {
        setTimeout(() => flashIcon(ic), 600 + n * 700);
      });
      setTimeout(() => {
        phase = "repeat";
        status.textContent = "Теперь повтори!";
        btns.forEach((b) => (b.disabled = false));
      }, 600 + seq.length * 700 + 400);
    }

    function onPick(ic) {
      if (phase !== "repeat") return;
      input.push(ic);
      flashIcon(ic);
      const want = seq[input.length - 1];
      if (ic !== want) {
        showMsg("Не тот порядок. Жми «Показать снова».", false);
        phase = "watch";
        input = [];
        btns.forEach((b) => (b.disabled = true));
        return;
      }
      if (input.length >= seq.length) {
        showMsg(stage.ok || "✓", true);
        setTimeout(nextStage, 700);
      }
    }

    playSeq();
  }

  function renderPick(stage) {
    stageEl.innerHTML =
      `<h2>${stage.title}</h2>` +
      `<p class="riddle">${stage.riddle}</p>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint}</div>` +
      `<div class="pick-grid" id="pickGrid"></div>`;
    document.getElementById("hintBtn").addEventListener("click", () => {
      document.getElementById("hintBox").classList.add("show");
    });
    const grid = document.getElementById("pickGrid");
    stage.picks.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pick";
      b.innerHTML = `${p.label}<small>${p.sub}</small>`;
      b.addEventListener("click", () => {
        if (p.wrong) {
          showMsg("Неа. Попробуй ещё.", false);
          return;
        }
        showMsg(stage.ok, true);
        setTimeout(nextStage, 700);
      });
      grid.appendChild(b);
    });
  }

  function renderText(stage) {
    stageEl.innerHTML =
      `<h2>${stage.title}</h2>` +
      `<p class="riddle">${stage.riddle}</p>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint}</div>` +
      `<div class="row">` +
      `<input type="text" id="answer" autocomplete="off" spellcheck="false" placeholder="ответ…" />` +
      `<button type="button" class="btn" id="btnGo">Дальше</button>` +
      `</div>`;
    const input = document.getElementById("answer");
    document.getElementById("hintBtn").addEventListener("click", () => {
      document.getElementById("hintBox").classList.add("show");
    });
    const submit = () => {
      const v = input.value;
      if (stage.check(v)) {
        showMsg(stage.ok, true);
        setTimeout(nextStage, 650);
      } else {
        showMsg("Почти — попробуй ещё.", false);
      }
    };
    document.getElementById("btnGo").addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    input.focus();
  }

  function spawnSparkles(n) {
    const box = document.getElementById("sparkles");
    if (!box) return;
    box.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "spark";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = 60 + Math.random() * 40 + "%";
      s.style.animationDelay = Math.random() * 2 + "s";
      s.style.background = i % 2 ? "#ffd76a" : "#e8b4ff";
      box.appendChild(s);
    }
  }

  function render() {
    showMsg("");
    renderProgress();
    if (state.done) {
      renderFinal();
      return;
    }
    if (state.stage === 0) {
      renderIntro();
      return;
    }
    const idx = state.stage - 1;
    const stage = STAGES[idx];
    if (!stage) {
      state.done = true;
      state.code = makeCode();
      save();
      renderFinal();
      return;
    }
    if (stage.type === "sequence") renderSequence(stage, idx);
    else if (stage.type === "pick") renderPick(stage);
    else renderText(stage);
  }

  render();
})();
