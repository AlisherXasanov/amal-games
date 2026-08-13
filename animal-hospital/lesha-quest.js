(() => {
  "use strict";

  const SAVE = "lesha-quest-v2";
  const STAGES = [
    {
      title: "Комната 1 · Только ты",
      type: "pick",
      riddle: "Игра для одного. Кто проходит?",
      hint: "Ты сам просил — только для тебя.",
      picks: [
        { label: "Для всех", sub: "нет", wrong: true },
        { label: "Для гостей", sub: "нет", wrong: true },
        { label: "Для меня", sub: "✦", wrong: false },
        { label: "Не знаю", sub: "…", wrong: true },
      ],
      ok: "✓ Поехали.",
    },
    {
      title: "Комната 2 · Кошелёк",
      riddle: "Сколько монет у админа в Animal Hospital? Не число — символ или слово.",
      hint: "Посмотри кошелёк в лобби больницы.",
      check: (v) => /^(∞|inf|беск|бесконеч|бесконечно|infinity)$/i.test(norm(v)) || v.trim() === "∞",
      ok: "✓ ∞.",
    },
    {
      title: "Комната 3 · Память · I",
      type: "sequence",
      seqLen: 5,
      speed: 520,
      riddle: "Запомни 5 символов подряд. Ошибка — с начала.",
      hint: "Не торопись после показа. Можно «Показать снова».",
      ok: "✓ Первая память пройдена.",
    },
    {
      title: "Комната 4 · Secret death",
      type: "timer",
      sec: 14,
      riddle: "Как называется маленькое поле внизу лобби, куда пишут коды? (как в игре, можно по-английски)",
      hint: "Два слова через пробел. Вторая — death.",
      check: (v) => /secret\s*death|секрет\s*death|смерть/i.test(norm(v)),
      ok: "✓ Видишь — ты в теме.",
    },
    {
      title: "Комната 5 · Порядок лечения",
      type: "order",
      riddle: "Нажми шаги лечения в правильном порядке (1 → 2 → 3):",
      hint: "Сначала узнай болезнь, потом достань вещь, потом вылечи.",
      order: ["Диагноз у окна", "Автомат · взять лекарство", "Вылечить пациента"],
      ok: "✓ Ты знаешь больницу.",
    },
    {
      title: "Комната 6 · Вилла",
      type: "timer",
      sec: 12,
      riddle: "Где отдыхают под звёздами? Одно слово.",
      hint: "Комната с баром. Свет включается на E.",
      check: (v) => /^(вилла|villa)$/i.test(norm(v)),
      ok: "✓ Тихо и тепло.",
    },
    {
      title: "Комната 7 · Сок",
      type: "pick",
      riddle: "Кнопка 🧃 Сок — кому её можно давать?",
      hint: "Обычным пациентам сок не подходит.",
      picks: [
        { label: "Всем подряд", sub: "нет", wrong: true },
        { label: "Только обычным", sub: "нет", wrong: true },
        { label: "Только аномалиям", sub: "✓", wrong: false },
        { label: "Только Barney", sub: "нет", wrong: true },
      ],
      ok: "✓ Точно.",
    },
    {
      title: "Комната 8 · Создатели",
      type: "pick",
      riddle: "Sammy и Jendel снова соревнуются. Твой выбор?",
      hint: "В больнице есть сюрприз, когда оба в порядке.",
      picks: [
        { label: "Sammy победит", sub: "красный", wrong: true },
        { label: "Jendel победит", sub: "синий", wrong: true },
        { label: "Перемирие · обоих вылечить", sub: "✦", wrong: false },
        { label: "Выгнать обоих", sub: "…", wrong: true },
      ],
      ok: "✓ Мир лучше.",
    },
    {
      title: "Комната 9 · Память · II",
      type: "sequence",
      seqLen: 6,
      speed: 380,
      reverse: true,
      riddle: "6 символов — но повтори НАЗАД. Ошибка — с начала.",
      hint: "Последний символ показа = первый твой клик.",
      ok: "✓ Железная память.",
    },
    {
      title: "Комната 10 · Финал",
      type: "timer",
      sec: 20,
      riddle: "Что ты пришлёшь мне в чат, когда пройдёшь всё? (одно слово)",
      hint: "На экране будет код — его надо снять на…",
      check: (v) => /^(фото|фотку|фотка|photo|снимок|скрин|скриншот|screenshot|картинку|картинка)$/i.test(norm(v)),
      ok: "✓ Всё верно. Сейчас получишь код.",
    },
  ];

  const TOTAL = STAGES.length;
  const ICONS = ["🐾", "☕", "✦", "💡", "🧃", "⚠"];

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
    return { stage: 0, done: false, code: null, seqKey: randSeq(5), seqKey2: randSeq(6) };
  }

  function save() {
    localStorage.setItem(SAVE, JSON.stringify(state));
  }

  function randSeq(len) {
    const seq = [];
    for (let i = 0; i < len; i++) seq.push(ICONS[(Math.random() * ICONS.length) | 0]);
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

  function bindHint(stage) {
    const btn = document.getElementById("hintBtn");
    const box = document.getElementById("hintBox");
    if (btn && box) btn.addEventListener("click", () => box.classList.add("show"));
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
      `<p class="sub">Только для тебя. <strong>${TOTAL} комнат</strong> — сложнее, чем было. Таймеры, память, порядок. Застрянешь — спроси, помогу.</p>` +
      `<p class="riddle">В конце — код на экране. Сфоткай и пришли мне.</p>` +
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
      `<p class="sub">Все ${TOTAL} комнат. Серьёзно молодец.</p>` +
      `<div class="final-code">` +
      `<span>Код прохождения</span>` +
      `<strong id="winCode">${state.code || makeCode()}</strong>` +
      `</div>` +
      `<p class="riddle">Сфоткай экран — код должен быть виден — и пришли мне.</p>` +
      `<div class="row">` +
      `<button type="button" class="btn" id="btnAgain">Сначала</button>` +
      `<a class="btn ghost" href="./index.html" style="text-decoration:none;display:inline-flex;align-items:center;">← Больница</a>` +
      `</div>`;
    if (!state.code) {
      state.code = document.getElementById("winCode").textContent;
      save();
    }
    document.getElementById("btnAgain").addEventListener("click", () => {
      state = { stage: 0, done: false, code: null, seqKey: randSeq(5), seqKey2: randSeq(6) };
      save();
      render();
    });
    spawnSparkles(32);
  }

  function renderSequence(stage) {
    const len = stage.seqLen || 4;
    const speed = stage.speed || 650;
    const reverse = !!stage.reverse;
    const keyName = len >= 6 ? "seqKey2" : "seqKey";
    if (!state[keyName] || state[keyName].split(",").length !== len) state[keyName] = randSeq(len);
    const seq = state[keyName].split(",");
    const showSeq = reverse ? seq.slice().reverse() : seq;
    let phase = "watch";

    stageEl.innerHTML =
      `<h2>${stage.title}</h2>` +
      `<p class="riddle">${stage.riddle}</p>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint}</div>` +
      `<p class="sub" id="seqStatus">Смотри…</p>` +
      `<div class="seq-grid seq-grid-6" id="seqGrid"></div>` +
      `<div class="row"><button type="button" class="btn ghost" id="btnReplay">Показать снова</button></div>`;
    bindHint(stage);

    const grid = document.getElementById("seqGrid");
    const status = document.getElementById("seqStatus");
    let input = [];
    const btns = ICONS.map((ic) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "seq-btn";
      b.textContent = ic;
      b.disabled = true;
      b.addEventListener("click", () => onPick(ic));
      grid.appendChild(b);
      return b;
    });

    document.getElementById("btnReplay").addEventListener("click", () => {
      phase = "watch";
      input = [];
      btns.forEach((b) => (b.disabled = true));
      playSeq();
    });

    function flashIcon(ic) {
      const i = ICONS.indexOf(ic);
      if (i < 0) return;
      btns[i].classList.add("flash");
      setTimeout(() => btns[i].classList.remove("flash"), speed * 0.65);
    }

    function playSeq() {
      status.textContent = reverse ? "Смотри… потом — назад!" : "Смотри…";
      showSeq.forEach((ic, n) => {
        setTimeout(() => flashIcon(ic), 500 + n * speed);
      });
      setTimeout(() => {
        phase = "repeat";
        status.textContent = reverse ? "Повтори в обратном порядке!" : "Повтори!";
        btns.forEach((b) => (b.disabled = false));
      }, 500 + showSeq.length * speed + 350);
    }

    function fail() {
      showMsg("Мимо. Жми «Показать снова».", false);
      phase = "watch";
      input = [];
      btns.forEach((b) => (b.disabled = true));
      state[keyName] = randSeq(len);
      save();
    }

    function onPick(ic) {
      if (phase !== "repeat") return;
      input.push(ic);
      flashIcon(ic);
      const want = showSeq[input.length - 1];
      if (ic !== want) {
        fail();
        return;
      }
      if (input.length >= showSeq.length) {
        showMsg(stage.ok || "✓", true);
        setTimeout(nextStage, 700);
      }
    }

    playSeq();
  }

  function renderOrder(stage) {
    const correct = stage.order.slice();
    const shuffled = correct.slice().sort(() => Math.random() - 0.5);
    if (shuffled.every((v, i) => v === correct[i]) && shuffled.length > 1) {
      shuffled.reverse();
    }
    let step = 0;

    stageEl.innerHTML =
      `<h2>${stage.title}</h2>` +
      `<p class="riddle">${stage.riddle}</p>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint}</div>` +
      `<p class="sub" id="ordStatus">Шаг 1 из ${correct.length}</p>` +
      `<div class="pick-grid" id="ordGrid"></div>`;
    bindHint(stage);

    const grid = document.getElementById("ordGrid");
    const status = document.getElementById("ordStatus");
    shuffled.forEach((label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pick";
      b.textContent = label;
      b.addEventListener("click", () => {
        if (b.disabled) return;
        if (label === correct[step]) {
          b.disabled = true;
          b.style.opacity = "0.45";
          step += 1;
          status.textContent = step >= correct.length ? "Готово!" : `Шаг ${step + 1} из ${correct.length}`;
          if (step >= correct.length) {
            showMsg(stage.ok, true);
            setTimeout(nextStage, 700);
          }
        } else {
          showMsg("Не тот шаг. Сначала другое.", false);
        }
      });
      grid.appendChild(b);
    });
  }

  function renderTimer(stage) {
    let left = stage.sec || 15;
    stageEl.innerHTML =
      `<h2>${stage.title}</h2>` +
      `<p class="riddle">${stage.riddle}</p>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint}</div>` +
      `<p class="timer" id="timer">${left} сек</p>` +
      `<div class="row">` +
      `<input type="text" id="answer" autocomplete="off" spellcheck="false" placeholder="ответ…" />` +
      `<button type="button" class="btn" id="btnGo">Дальше</button>` +
      `</div>`;
    bindHint(stage);
    const input = document.getElementById("answer");
    const timerEl = document.getElementById("timer");
    let dead = false;
    const tick = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        dead = true;
        clearInterval(tick);
        timerEl.textContent = "Время!";
        timerEl.classList.add("bad");
        showMsg("Время вышло. Обнови комнату (назад и вперёд) или начни сначала.", false);
        return;
      }
      timerEl.textContent = left + " сек";
      if (left <= 4) timerEl.classList.add("warn");
    }, 1000);

    const submit = () => {
      if (dead) return;
      if (stage.check(input.value)) {
        clearInterval(tick);
        showMsg(stage.ok, true);
        setTimeout(nextStage, 650);
      } else {
        showMsg("Не то. Быстрее!", false);
      }
    };
    document.getElementById("btnGo").addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    input.focus();
  }

  function renderPick(stage) {
    stageEl.innerHTML =
      `<h2>${stage.title}</h2>` +
      `<p class="riddle">${stage.riddle}</p>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint}</div>` +
      `<div class="pick-grid" id="pickGrid"></div>`;
    bindHint(stage);
    const grid = document.getElementById("pickGrid");
    stage.picks.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pick";
      b.innerHTML = `${p.label}<small>${p.sub}</small>`;
      b.addEventListener("click", () => {
        if (p.wrong) {
          showMsg("Неа.", false);
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
    bindHint(stage);
    const input = document.getElementById("answer");
    const submit = () => {
      if (stage.check(input.value)) {
        showMsg(stage.ok, true);
        setTimeout(nextStage, 650);
      } else {
        showMsg("Почти — ещё раз.", false);
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
    const stage = STAGES[state.stage - 1];
    if (!stage) {
      state.done = true;
      state.code = makeCode();
      save();
      renderFinal();
      return;
    }
    if (stage.type === "sequence") renderSequence(stage);
    else if (stage.type === "order") renderOrder(stage);
    else if (stage.type === "timer") renderTimer(stage);
    else if (stage.type === "pick") renderPick(stage);
    else renderText(stage);
  }

  render();
})();
