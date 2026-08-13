(() => {
  "use strict";

  const SAVE = "lesha-quest-v3";

  function n(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е");
  }

  const STAGES = [
    {
      title: "Диалог · Вход",
      type: "chat",
      hint: "Просто отвечай — как в чате.",
      lines: [
        { bot: "Привет. Это не тест из школы — это разговор. Готов?" },
        {
          you: "pick",
          picks: [
            { label: "Готов", ok: true },
            { label: "Нет", ok: false },
            { label: "Потом", ok: false },
          ],
          replyOk: "Хорошо. Тогда поехали.",
          replyBad: "Ну ладно… но ты уже здесь. Жми «Готов».",
        },
        { bot: "Игра только для одного. Кто проходит?" },
        {
          you: "pick",
          picks: [
            { label: "Для гостей", ok: false },
            { label: "Для меня", ok: true },
            { label: "Для всех", ok: false },
          ],
          replyOk: "Верно. Дальше будет интереснее.",
          replyBad: "Не то. Кто хозяин этой истории?",
        },
      ],
      ok: "✓ Диалог начат.",
    },
    {
      title: "Диалог · Кошелёк",
      type: "chat",
      hint: "В лобби больницы смотри на монеты.",
      lines: [
        { bot: "Слушай. У админа в Animal Hospital кошелёк странный." },
        { bot: "Сколько там монет? Не число — символ или слово." },
        {
          you: "text",
          placeholder: "ответ…",
          check: (v) => /^(∞|inf|беск|бесконеч|бесконечно|infinity)$/i.test(n(v)) || v.trim() === "∞",
          replyOk: "∞. Конечно. Ты же сам так сделал.",
          replyBad: "Не число. Подумай ещё.",
        },
      ],
      ok: "✓ Кошелёк.",
    },
    {
      title: "Спроси меня · Больница",
      type: "ask",
      hint: "Сначала спроси — потом ответь на проверку.",
      intro: "Я знаю секреты больницы. Задай мне 2 вопроса. Потом я спрошу тебя.",
      needAsk: 2,
      questions: [
        { q: "Где отдыхают под звёздами?", a: "На вилле · зона отдыха." },
        { q: "Кому можно давать 🧃 сок?", a: "Только аномалиям." },
        { q: "Как называется поле для кодов внизу лобби?", a: "secret death." },
        { q: "Что делает кнопка ⚠ слева на смене?", a: "Без аномалий — тихо." },
      ],
      quiz: {
        bot: "Проверка. Куда идут отдыхать под звёздами? Одно слово.",
        check: (v) => /^(вилла|villa)$/i.test(n(v)),
        replyOk: "Вилла. Запомнил.",
        replyBad: "Спроси ещё раз или открой подсказку.",
      },
      ok: "✓ Спросил — ответил.",
    },
    {
      title: "Память · разговор",
      type: "sequence",
      seqLen: 5,
      speed: 500,
      riddle: "Я покажу 5 символов. Повтори — как эхо.",
      hint: "Ошибка — новая цепочка. Можно показать снова.",
      ok: "✓ Эхо принято.",
    },
    {
      title: "Диалог · Secret death",
      type: "chat",
      hint: "Два слова. Второе — death.",
      lines: [
        { bot: "Внизу лобби есть крошечное поле." },
        { bot: "Туда пишут коды. Как оно называется?" },
        {
          you: "text",
          placeholder: "как в игре…",
          check: (v) => /secret\s*death|секрет\s*death|секретная\s*смерть/i.test(n(v)),
          replyOk: "secret death. Ты в теме.",
          replyBad: "Почти. Два слова…",
        },
        { bot: "А зачем оно тебе вообще?" },
        {
          you: "pick",
          picks: [
            { label: "Чтобы открывать сюрпризы", ok: true },
            { label: "Чтобы удалить сейв", ok: false },
            { label: "Просто так", ok: false },
          ],
          replyOk: "Да. Сюрпризы — это смысл.",
          replyBad: "Ну… ближе к сюрпризам.",
        },
      ],
      ok: "✓ Коды.",
    },
    {
      title: "Порядок · лечение",
      type: "order",
      riddle: "Расскажи мне порядок. Нажми шаги 1 → 2 → 3:",
      hint: "Сначала диагноз, потом автомат, потом лечение.",
      order: ["Диагноз у окна", "Автомат · взять лекарство", "Вылечить пациента"],
      ok: "✓ Ты знаешь больницу.",
    },
    {
      title: "Спроси меня · Создатели",
      type: "ask",
      hint: "Спроси про Sammy и Jendel — потом ответь.",
      intro: "Sammy и Jendel — соперники. Задай 2 вопроса, потом я спрошу.",
      needAsk: 2,
      questions: [
        { q: "Какой цвет у Sammy?", a: "Красный." },
        { q: "Какой цвет у Jendel?", a: "Синий." },
        { q: "Что будет, если вылечить обоих?", a: "Перемирие · сюрприз." },
        { q: "Кто третий создатель рядом?", a: "Woodstock · золотой." },
      ],
      quiz: {
        bot: "Что выбрать, когда они соревнуются?",
        pick: true,
        picks: [
          { label: "Sammy победит", ok: false },
          { label: "Jendel победит", ok: false },
          { label: "Перемирие · обоих вылечить", ok: true },
          { label: "Выгнать обоих", ok: false },
        ],
        replyOk: "Мир лучше войны.",
        replyBad: "Не война. Подумай.",
      },
      ok: "✓ Перемирие.",
    },
    {
      title: "Диалог · Сок",
      type: "chat",
      hint: "Обычным пациентам сок не подходит.",
      lines: [
        { bot: "На ресепшене есть кнопка 🧃 Сок." },
        { bot: "Кому её можно давать?" },
        {
          you: "pick",
          picks: [
            { label: "Всем подряд", ok: false },
            { label: "Только обычным", ok: false },
            { label: "Только аномалиям", ok: true },
            { label: "Только Барни", ok: false },
          ],
          replyOk: "Аномалиям. Обычные — нет.",
          replyBad: "Не всем. Кому особенным?",
        },
        { bot: "А если дать обычному?" },
        {
          you: "pick",
          picks: [
            { label: "Ничего страшного", ok: false },
            { label: "Откажется / не то", ok: true },
            { label: "Станет аномалией", ok: false },
          ],
          replyOk: "Да. Сок — не для всех.",
          replyBad: "Он просто не возьмёт «не то».",
        },
      ],
      ok: "✓ Сок.",
    },
    {
      title: "Память · назад",
      type: "sequence",
      seqLen: 6,
      speed: 360,
      reverse: true,
      riddle: "6 символов. Повтори НАЗАД — как я сказал, но наоборот.",
      hint: "Последний показанный = первый твой клик.",
      ok: "✓ Железная память.",
    },
    {
      title: "Диалог · Финал",
      type: "chat",
      hint: "Что пришлёшь мне в чат с экраном кода?",
      lines: [
        { bot: "Ты почти у конца." },
        { bot: "Когда пройдёшь — что пришлёшь мне в чат? Одно слово." },
        {
          you: "text",
          placeholder: "фото / скрин…",
          check: (v) =>
            /^(фото|фотку|фотка|photo|снимок|скрин|скриншот|screenshot|картинку|картинка)$/i.test(n(v)),
          replyOk: "Фото. Чтобы я видел — ты правда прошёл.",
          replyBad: "Не текст. Снимок экрана.",
        },
        { bot: "Сейчас дам код. Сфоткай его." },
      ],
      ok: "✓ Договорились.",
    },
  ];

  const TOTAL = STAGES.length;
  const ICONS = ["🐾", "☕", "✦", "💡", "🧃", "⚠"];
  const ROOM_EMOJI = ["✦", "💬", "🪙", "❓", "🧠", "☠", "💊", "⚔", "🧃", "🔥", "📸"];

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

  function makeCode() {
    const n = ((Date.now() / 1000) | 0) % 10000;
    return "L" + n.toString().padStart(4, "0");
  }

  function setMood() {
    if (state.done) document.body.className = "mood-win";
    else if (state.stage === 0) document.body.className = "mood-intro";
    else document.body.className = "mood-room-" + Math.min(state.stage, 10);
  }

  function roomBadge() {
    const num = state.done ? TOTAL : state.stage;
    const em = ROOM_EMOJI[num] || "✦";
    const label = state.done ? "финал" : "комната " + num + " · " + TOTAL;
    return `<div class="room-badge">${em} ${label}</div>`;
  }

  function burstWin() {
    const box = document.getElementById("burst");
    if (!box) return;
    box.innerHTML = "";
    const colors = ["#ffd76a", "#e8b4ff", "#7ed9b8", "#ff80c0", "#7af0ff"];
    for (let i = 0; i < 28; i++) {
      const d = document.createElement("div");
      d.className = "burst-dot";
      d.style.left = "50%";
      d.style.top = "42%";
      d.style.background = colors[i % colors.length];
      const a = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * 130;
      d.style.setProperty("--bx", Math.cos(a) * r + "px");
      d.style.setProperty("--by", Math.sin(a) * r + "px");
      box.appendChild(d);
    }
    setTimeout(() => {
      box.innerHTML = "";
    }, 750);
  }

  function stageSuccess(text) {
    showMsg(text, true);
    burstWin();
    setTimeout(nextStage, 800);
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

  function appendBubble(log, who, text) {
    const b = document.createElement("div");
    b.className = "bubble " + who;
    b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function renderChat(stage) {
    let line = 0;
    stageEl.innerHTML =
      roomBadge() +
      `<h2>${stage.title}</h2>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint || ""}</div>` +
      `<div class="chat-log" id="chatLog"></div>` +
      `<div id="chatInput"></div>`;
    bindHint(stage);
    const log = document.getElementById("chatLog");
    const inputArea = document.getElementById("chatInput");

    function advance() {
      while (line < stage.lines.length && stage.lines[line].bot) {
        appendBubble(log, "bot", stage.lines[line].bot);
        line += 1;
      }
      if (line >= stage.lines.length) {
        stageSuccess(stage.ok || "✓");
        return;
      }
      const turn = stage.lines[line];
      if (turn.you === "pick") showPick(turn);
      else if (turn.you === "text") showText(turn);
    }

    function showPick(turn) {
      inputArea.innerHTML = `<div class="pick-grid" id="pickGrid"></div>`;
      const grid = document.getElementById("pickGrid");
      turn.picks.forEach((p) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pick";
        btn.textContent = p.label;
        btn.addEventListener("click", () => {
          appendBubble(log, "you", p.label);
          inputArea.innerHTML = "";
          if (!p.ok) {
            appendBubble(log, "bot", turn.replyBad || "Не то.");
            showMsg("Неа.", false);
            showPick(turn);
            return;
          }
          appendBubble(log, "bot", turn.replyOk || "Ок.");
          line += 1;
          setTimeout(advance, 420);
        });
        grid.appendChild(btn);
      });
    }

    function showText(turn) {
      inputArea.innerHTML =
        `<div class="row">` +
        `<input type="text" id="answer" autocomplete="off" spellcheck="false" placeholder="${turn.placeholder || "ответ…"}" />` +
        `<button type="button" class="btn" id="btnGo">Ответить</button>` +
        `</div>`;
      const input = document.getElementById("answer");
      const go = () => {
        const v = input.value;
        if (!v.trim()) return;
        appendBubble(log, "you", v);
        if (!turn.check(v)) {
          appendBubble(log, "bot", turn.replyBad || "Не то.");
          showMsg("Почти.", false);
          input.value = "";
          input.focus();
          return;
        }
        appendBubble(log, "bot", turn.replyOk || "Верно.");
        inputArea.innerHTML = "";
        line += 1;
        setTimeout(advance, 420);
      };
      document.getElementById("btnGo").addEventListener("click", go);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") go();
      });
      input.focus();
    }

    advance();
  }

  function renderAsk(stage) {
    const asked = new Set();
    let phase = "ask";
    stageEl.innerHTML =
      roomBadge() +
      `<h2>${stage.title}</h2>` +
      `<button type="button" class="hint-btn" id="hintBtn">Подсказка</button>` +
      `<div class="hint-box" id="hintBox">${stage.hint || ""}</div>` +
      `<div class="chat-log" id="chatLog"></div>` +
      `<div id="chatInput"></div>`;
    bindHint(stage);
    const log = document.getElementById("chatLog");
    const inputArea = document.getElementById("chatInput");
    appendBubble(log, "bot", stage.intro);

    function renderAskPicks() {
      const left = stage.needAsk - asked.size;
      inputArea.innerHTML =
        `<p class="sub ask-count">Спроси ещё: <strong>${left}</strong></p>` +
        `<div class="pick-grid" id="pickGrid"></div>`;
      const grid = document.getElementById("pickGrid");
      stage.questions.forEach((item, i) => {
        if (asked.has(i)) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pick";
        btn.innerHTML = `❓ ${item.q}`;
        btn.addEventListener("click", () => {
          asked.add(i);
          appendBubble(log, "you", item.q);
          appendBubble(log, "bot", item.a);
          if (asked.size >= stage.needAsk) {
            phase = "quiz";
            setTimeout(startQuiz, 500);
          } else {
            renderAskPicks();
          }
        });
        grid.appendChild(btn);
      });
    }

    function startQuiz() {
      const q = stage.quiz;
      appendBubble(log, "bot", q.bot);
      if (q.pick) {
        inputArea.innerHTML = `<div class="pick-grid" id="pickGrid"></div>`;
        const grid = document.getElementById("pickGrid");
        q.picks.forEach((p) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "pick";
          btn.textContent = p.label;
          btn.addEventListener("click", () => {
            appendBubble(log, "you", p.label);
            if (!p.ok) {
              appendBubble(log, "bot", q.replyBad || "Не то.");
              showMsg("Неа.", false);
              startQuiz();
              return;
            }
            appendBubble(log, "bot", q.replyOk || "Верно.");
            inputArea.innerHTML = "";
            stageSuccess(stage.ok || "✓");
          });
          grid.appendChild(btn);
        });
        return;
      }
      inputArea.innerHTML =
        `<div class="row">` +
        `<input type="text" id="answer" autocomplete="off" spellcheck="false" placeholder="твой ответ…" />` +
        `<button type="button" class="btn" id="btnGo">Ответить</button>` +
        `</div>`;
      const input = document.getElementById("answer");
      const go = () => {
        const v = input.value;
        if (!v.trim()) return;
        appendBubble(log, "you", v);
        if (!q.check(v)) {
          appendBubble(log, "bot", q.replyBad || "Не то.");
          showMsg("Почти.", false);
          input.value = "";
          input.focus();
          return;
        }
        appendBubble(log, "bot", q.replyOk || "Верно.");
        inputArea.innerHTML = "";
        stageSuccess(stage.ok || "✓");
      };
      document.getElementById("btnGo").addEventListener("click", go);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") go();
      });
      input.focus();
    }

    renderAskPicks();
  }

  function renderIntro() {
    stageEl.innerHTML =
      roomBadge() +
      `<p class="brand">✦ Сюрприз-квест</p>` +
      `<p class="sub">Только для тебя. <strong>${TOTAL} комнат</strong> — диалоги, «спроси меня», память, таймеры.</p>` +
      `<p class="riddle">Не только вопросы: ты отвечаешь — я отвечаю. В конце — код. Сфоткай и пришли.</p>` +
      `<div class="row"><button type="button" class="btn gold" id="btnStart">Начать разговор</button></div>`;
    document.getElementById("btnStart").addEventListener("click", () => {
      if (state.stage === 0 && !state.done) nextStage();
      else render();
    });
  }

  function renderFinal() {
    renderProgress();
    setMood();
    stageEl.innerHTML =
      roomBadge() +
      `<p class="brand">✦ Прошёл!</p>` +
      `<p class="sub">Все ${TOTAL} комнат. Диалоги закрыты.</p>` +
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
      roomBadge() +
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
      if (input.length >= showSeq.length) stageSuccess(stage.ok || "✓");
    }

    playSeq();
  }

  function renderOrder(stage) {
    const correct = stage.order.slice();
    const shuffled = correct.slice().sort(() => Math.random() - 0.5);
    if (shuffled.every((v, i) => v === correct[i]) && shuffled.length > 1) shuffled.reverse();
    let step = 0;

    stageEl.innerHTML =
      roomBadge() +
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
          step += 1;
          status.textContent = step >= correct.length ? "Готово!" : `Шаг ${step + 1} из ${correct.length}`;
          if (step >= correct.length) stageSuccess(stage.ok);
        } else {
          showMsg("Не тот шаг.", false);
        }
      });
      grid.appendChild(b);
    });
  }

  function addAmbientSpark() {
    const box = document.getElementById("sparkles");
    if (!box || box.children.length > 48) return;
    const s = document.createElement("div");
    s.className = "spark";
    const size = 2 + Math.random() * 4;
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = 55 + Math.random() * 45 + "%";
    s.style.animationDuration = 2.2 + Math.random() * 2.5 + "s";
    s.style.animationDelay = Math.random() * 1.5 + "s";
    s.style.background = Math.random() < 0.5 ? "#ffd76a" : "#e8b4ff";
    box.appendChild(s);
    setTimeout(() => s.remove(), 5500);
  }

  function startAmbient() {
    for (let i = 0; i < 16; i++) addAmbientSpark();
    setInterval(addAmbientSpark, 1800);
  }

  function spawnSparkles(n) {
    for (let i = 0; i < n; i++) addAmbientSpark();
  }

  function render() {
    showMsg("");
    setMood();
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
    if (stage.type === "chat") renderChat(stage);
    else if (stage.type === "ask") renderAsk(stage);
    else if (stage.type === "sequence") renderSequence(stage);
    else if (stage.type === "order") renderOrder(stage);
    else renderChat(stage);
  }

  startAmbient();
  render();
})();
