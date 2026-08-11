(() => {
  const iconsEl = document.getElementById("icons");
  const windowsEl = document.getElementById("windows");
  const taskAppsEl = document.getElementById("task-apps");
  const startMenu = document.getElementById("start-menu");
  const startItemsEl = document.getElementById("start-items");
  const btnStart = document.getElementById("btn-start");
  const clockEl = document.getElementById("clock");

  const SAVE_WELCOME = "old-pc-welcome-v1";
  const SAVE_MINE_HELP = "old-pc-mine-help-v1";

  const welcomeEl = document.getElementById("welcome");
  const welcomeList = document.getElementById("welcome-list");
  const welcomeGo = document.getElementById("welcome-go");
  const welcomeOut = document.getElementById("welcome-out");
  let zTop = 10;
  let winId = 0;
  const openWins = new Map();

  function welcomeSeen() {
    try { return localStorage.getItem(SAVE_WELCOME) === "1"; } catch { return false; }
  }

  function markWelcomeSeen() {
    try { localStorage.setItem(SAVE_WELCOME, "1"); } catch { /* ignore */ }
  }

  function mineHelpSeen() {
    try { return localStorage.getItem(SAVE_MINE_HELP) === "1"; } catch { return false; }
  }

  function markMineHelpSeen() {
    try { localStorage.setItem(SAVE_MINE_HELP, "1"); } catch { /* ignore */ }
  }

  function startDesktop(openMine) {
    document.body.classList.add("started");
    welcomeEl.hidden = true;
    markWelcomeSeen();
    if (openMine) openApp("mine");
  }

  function showWelcome() {
    welcomeList.innerHTML = TIPS.map((t) => `<li>${t}</li>`).join("");
    welcomeEl.hidden = false;
  }

  welcomeGo.addEventListener("click", () => startDesktop(true));
  welcomeOut.addEventListener("click", () => startDesktop(false));

  const TASK_TOP = 44;

  const TIPS = [
    "Панель сверху: «← Выйти» — в каталог, «⊞ Пуск» — все программы.",
    "Закрыть окно: красный ✕ вверху или кнопка «✕ Закрыть окно» внизу.",
    "«Новые игры» — свежие игры Amal. «Ещё игры» — попроси добавить новую.",
    "Сапёр: жми клетки, флажок — ПКМ или кнопка «Флажок».",
    "«Поговорить» — чат с Амалем по-русски.",
    "Дважды щёлкни по иконке — быстрее откроется программа.",
  ];

  const CHAT_REPLIES = [
    { keys: ["привет", "здрав", "хай", "hello"], text: "Привет! Я Амаль. Открой «Мои игры» — там куча крутых штук." },
    { keys: ["игр", "play", "game"], text: "Открой «Новые игры» или «Ещё игры» — попроси добавить то, что хочешь." },
    { keys: ["помо", "help", "как"], text: "Щёлкай по иконкам. «Подсказки» — советы. «Проигрыватель» — смотреть ролики." },
    { keys: ["спасиб", "thanks"], text: "Пожалуйста! Приятной игры на старом компе." },
    { keys: ["пока", "bye"], text: "Пока! Закрой окно красным ✕ или «← Выйти» наверху." },
    { keys: ["комп", "windows", "стар"], text: "Это мой старый компьютер. Все программы настоящие — просто маленькие." },
  ];

  const NEW_GAMES = [
    { name: "Дом под крышей", href: "../roof-house/", tag: "new" },
    { name: "Лифт без цифр", href: "../lift-void/", tag: "new" },
    { name: "Несуществующий урок", href: "../ghost-lesson/", tag: "new" },
    { name: "Эхо-почтальон", href: "../echo-postman/", tag: "new" },
    { name: "Animal Hospital", href: "../animal-hospital/", tag: "new" },
    { name: "Create Lab", href: "../create-lab/", tag: "new" },
  ];

  const CLASSIC_GAMES = [
    { name: "Kick Buddy", href: "../kick-buddy/" },
    { name: "Blockbust", href: "../blockbust/" },
    { name: "Укрытие", href: "../hideout/" },
    { name: "Зомби vs растения 2", href: "../zombie-vs-plants-2/" },
    { name: "Melon Playground", href: "../melon-playground/" },
    { name: "CraftWorld", href: "../minecraft/" },
    { name: "Каталог всех игр", href: "../" },
  ];

  const APPS = [
    { id: "newgames", title: "Новые игры", icon: "✨", make: makeNewGamesApp },
    { id: "store", title: "Магазин", icon: "📦", make: makeStoreApp },
    { id: "wish", title: "Ещё игры", icon: "📣", make: makeWishApp },
    { id: "mine", title: "Сапёр", icon: "💣", make: makeMineApp },
    { id: "player", title: "Проигрыватель", icon: "📼", make: makePlayerApp },
    { id: "tips", title: "Подсказки", icon: "💡", make: makeTipsApp },
    { id: "chat", title: "Поговорить", icon: "💬", make: makeChatApp },
    { id: "notepad", title: "Блокнот", icon: "📝", make: makeNotepadApp },
    { id: "calc", title: "Калькулятор", icon: "🔢", make: makeCalcApp },
    { id: "paint", title: "Рисовалка", icon: "🎨", make: makePaintApp },
  ];

  const STORE_SAVE = "old-pc-store-v1";
  const STORE_APPS = [
    { id: "weather", title: "Погода", icon: "🌤️", desc: "Прогноз на сегодня — случайный" },
    { id: "music", title: "Музыка", icon: "🎵", desc: "Мини-плеер с виртуальными треками" },
    { id: "clock-app", title: "Будильник", icon: "⏰", desc: "Таймер и секундомер" },
    { id: "photo", title: "Фото", icon: "📷", desc: "Галерея — рисуй и сохраняй снимки" },
    { id: "messenger", title: "Мессенджер", icon: "✉️", desc: "Чат с ботом-другом" },
    { id: "snake", title: "Змейка", icon: "🐍", desc: "Классическая мини-игра" },
  ];

  function getInstalled() {
    try { return JSON.parse(localStorage.getItem(STORE_SAVE) || "[]"); } catch { return []; }
  }
  function setInstalled(list) {
    try { localStorage.setItem(STORE_SAVE, JSON.stringify(list)); } catch { /* ignore */ }
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function replyChat(text) {
    const low = text.toLowerCase();
    for (const r of CHAT_REPLIES) {
      if (r.keys.some((k) => low.includes(k))) return r.text;
    }
    return "Интересно! Попробуй открыть другую программу на рабочем столе — там много всего.";
  }

  function renderIcons() {
    iconsEl.innerHTML = APPS.map((a) => `
      <button type="button" class="icon-btn" data-app="${a.id}" title="${a.title}">
        <span class="icon-art">${a.icon}</span>
        <span>${a.title}</span>
      </button>
    `).join("");

    iconsEl.querySelectorAll(".icon-btn").forEach((btn) => {
      btn.addEventListener("click", () => openApp(btn.dataset.app));
    });
  }

  function renderStartMenu() {
    startItemsEl.innerHTML = APPS.map((a) => `
      <button type="button" class="start-item" data-app="${a.id}">${a.icon} ${a.title}</button>
    `).join("") + `
      <button type="button" class="start-item" data-act="welcome">💡 Все подсказки</button>
      <button type="button" class="start-item" data-app="shutdown">⏻ Завершение работы</button>
    `;

    startItemsEl.querySelectorAll(".start-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleStart(false);
        if (btn.dataset.act === "welcome") {
          showWelcome();
          return;
        }
        if (btn.dataset.app === "shutdown") {
          document.body.innerHTML = `<div style="background:#000;color:#888;height:100vh;display:grid;place-items:center;font-family:Tahoma,sans-serif;text-align:center;padding:2rem"><p>Можно закрыть вкладку.<br><a href="../" style="color:#6cf">← Вернуться в каталог</a></p></div>`;
          return;
        }
        openApp(btn.dataset.app);
      });
    });
  }

  function toggleStart(open) {
    const show = open ?? startMenu.hidden;
    startMenu.hidden = !show;
    btnStart.classList.toggle("pressed", show);
    btnStart.setAttribute("aria-expanded", show ? "true" : "false");
  }

  btnStart.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleStart(startMenu.hidden);
  });

  document.addEventListener("click", (e) => {
    if (!startMenu.hidden && !startMenu.contains(e.target) && e.target !== btnStart) {
      toggleStart(false);
    }
  });

  function focusWin(id) {
    const w = openWins.get(id);
    if (!w) return;
    w.el.style.zIndex = String(++zTop);
    document.querySelectorAll(".win-title").forEach((t) => t.classList.add("inactive"));
    w.el.querySelector(".win-title").classList.remove("inactive");
    document.querySelectorAll(".task-tab").forEach((t) => t.classList.remove("active"));
    w.tab.classList.add("active");
  }

  function openApp(appId) {
    const existing = [...openWins.values()].find((w) => w.appId === appId && !w.minimized);
    if (existing) {
      existing.minimized = false;
      existing.el.classList.remove("minimized");
      focusWin(existing.id);
      return;
    }

    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
    openAppDirect(app);
  }

  function openAppDirect(app) {

    const id = ++winId;
    const left = 24 + (id * 24) % 180;
    const top = TASK_TOP + 12 + (id * 18) % 90;
    const appId = app.id;
    const w = appId === "mine" ? 300 : 440;
    const h = appId === "mine" ? (mineHelpSeen() ? 320 : 400) : 360;

    const el = document.createElement("div");
    el.className = "win";
    el.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;z-index:${++zTop}`;
    el.innerHTML = `
      <div class="win-title"><span>${app.icon} ${app.title}</span>
        <div class="win-btns">
          <button type="button" class="win-btn" data-act="min" title="Свернуть">_</button>
          <button type="button" class="win-btn" data-act="max" title="Развернуть">□</button>
          <button type="button" class="win-btn close" data-act="close" title="Закрыть">✕</button>
        </div>
      </div>
      <div class="win-body"></div>
      <div class="win-foot">
        <button type="button" class="win-close-big" data-act="close">✕ Закрыть окно</button>
      </div>
    `;

    const body = el.querySelector(".win-body");
    app.make(body);

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "task-tab active";
    tab.textContent = app.title;
    tab.addEventListener("click", () => {
      const w = openWins.get(id);
      if (!w) return;
      if (w.minimized) {
        w.minimized = false;
        w.el.classList.remove("minimized");
      }
      focusWin(id);
    });

    const state = { id, appId, el, tab, minimized: false, maximized: false };
    openWins.set(id, state);

    el.querySelectorAll('[data-act="close"]').forEach((btn) => {
      btn.addEventListener("click", () => closeWin(id));
    });
    el.querySelector('[data-act="min"]').addEventListener("click", () => {
      state.minimized = true;
      el.classList.add("minimized");
    });
    el.querySelector('[data-act="max"]').addEventListener("click", () => {
      state.maximized = !state.maximized;
      el.classList.toggle("maximized", state.maximized);
    });

    el.addEventListener("mousedown", () => focusWin(id));
    setupDrag(el);

    windowsEl.appendChild(el);
    taskAppsEl.appendChild(tab);
    focusWin(id);
  }

  function closeWin(id) {
    const w = openWins.get(id);
    if (!w) return;
    w.el.remove();
    w.tab.remove();
    openWins.delete(id);
  }

  function setupDrag(el) {
    const title = el.querySelector(".win-title");
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;

    title.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("win-btn")) return;
      if (el.classList.contains("maximized")) return;
      sx = e.clientX;
      sy = e.clientY;
      ox = el.offsetLeft;
      oy = el.offsetTop;

      function move(ev) {
        el.style.left = `${ox + ev.clientX - sx}px`;
        el.style.top = `${Math.max(TASK_TOP + 4, oy + ev.clientY - sy)}px`;
      }
      function up() {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      }
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    });
  }

  function gameLinks(list) {
    return list.map((g) => `
      <a class="game-link${g.tag === "new" ? " new" : ""}" href="${g.href}" target="_blank" rel="noopener">${g.name}</a>
    `).join("");
  }

  function makeNewGamesApp(root) {
    root.className = "app-games";
    root.innerHTML = `
      <h3>✨ Новые игры</h3>
      ${gameLinks(NEW_GAMES)}
      <h3>📚 Классика</h3>
      ${gameLinks(CLASSIC_GAMES)}
    `;
  }

  function makeStoreApp(root) {
    root.className = "app-store";
    const installed = getInstalled();

    function render() {
      root.innerHTML = `
        <p style="font-size:12px;margin-bottom:10px">Скачай приложения — появятся на рабочем столе.</p>
        <div class="store-list" id="store-list"></div>
      `;
      const list = root.querySelector("#store-list");
      STORE_APPS.forEach((app) => {
        const done = installed.includes(app.id);
        const card = document.createElement("div");
        card.className = "store-card" + (done ? " installed" : "");
        card.innerHTML = `
          <span class="store-icon">${app.icon}</span>
          <div class="store-info">
            <strong>${app.title}</strong>
            <span>${app.desc}</span>
          </div>
          <button type="button" class="store-dl" ${done ? "disabled" : ""}>${done ? "✓" : "⬇ Скачать"}</button>
        `;
        if (!done) {
          card.querySelector(".store-dl").addEventListener("click", () => {
            installed.push(app.id);
            setInstalled(installed);
            addInstalledIcon(app);
            render();
            speak(app.title + " установлено!");
          });
        }
        list.appendChild(card);
      });
    }
    render();
  }

  function addInstalledIcon(storeApp) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-btn";
    btn.dataset.app = "installed-" + storeApp.id;
    btn.title = storeApp.title;
    btn.innerHTML = `<span class="icon-art">${storeApp.icon}</span><span>${storeApp.title}</span>`;
    btn.addEventListener("click", () => openInstalledApp(storeApp));
    iconsEl.appendChild(btn);
  }

  function openInstalledApp(storeApp) {
    const fakeApp = { id: "installed-" + storeApp.id, title: storeApp.title, icon: storeApp.icon, make: (root) => makeInstalledContent(root, storeApp) };
    const existing = [...openWins.values()].find((w) => w.appId === fakeApp.id && !w.minimized);
    if (existing) {
      existing.minimized = false;
      existing.el.classList.remove("minimized");
      focusWin(existing.id);
      return;
    }
    openAppDirect(fakeApp);
  }

  function makeInstalledContent(root, storeApp) {
    if (storeApp.id === "weather") {
      const temps = ["-5°C Снег", "12°C Облачно", "24°C Солнечно", "18°C Дождь", "30°C Жара", "8°C Ветер"];
      const t = temps[Math.floor(Math.random() * temps.length)];
      root.innerHTML = `<p style="font-size:14px;text-align:center;padding:20px">🌤️ Сегодня: <strong>${t}</strong></p><p style="text-align:center;font-size:11px;color:#888">Обновляется каждый раз</p>`;
    } else if (storeApp.id === "music") {
      const tracks = [
        { name: "Закат в пикселях", notes: [262, 294, 330, 349, 392, 349, 330, 294] },
        { name: "8-bit лето", notes: [392, 440, 494, 523, 494, 440, 392, 330] },
        { name: "Тишина уровня", notes: [330, 330, 294, 294, 262, 262, 294, 330] },
        { name: "Босс приближается", notes: [196, 220, 196, 165, 196, 220, 262, 196] },
        { name: "Меню тема", notes: [523, 494, 440, 392, 440, 494, 523, 587] },
      ];
      let playing = null;
      root.innerHTML = `<div style="padding:8px"><p style="margin-bottom:8px;font-size:12px">🎵 Нажми — послушай мелодию:</p><div id="music-list"></div><p id="music-status" style="margin-top:8px;font-size:11px;color:#666"></p></div>`;
      const list = root.querySelector("#music-list");
      const status = root.querySelector("#music-status");
      tracks.forEach((t, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.cssText = "display:block;width:100%;text-align:left;padding:6px 8px;margin-bottom:4px;border:1px solid #ccc;border-radius:4px;background:#f0f8ff;cursor:pointer;font-size:12px";
        btn.textContent = `${i + 1}. ${t.name} ▶`;
        btn.addEventListener("click", () => {
          if (playing) return;
          playing = true;
          status.textContent = "♪ Играет: " + t.name;
          btn.style.background = "#d0e8ff";
          const actx = new (window.AudioContext || window.webkitAudioContext)();
          t.notes.forEach((freq, j) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = "square";
            osc.frequency.value = freq;
            gain.gain.value = 0.08;
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(actx.currentTime + j * 0.25);
            osc.stop(actx.currentTime + j * 0.25 + 0.22);
          });
          setTimeout(() => { playing = null; status.textContent = ""; btn.style.background = "#f0f8ff"; }, t.notes.length * 250 + 100);
        });
        list.appendChild(btn);
      });
    } else if (storeApp.id === "clock-app") {
      root.innerHTML = `<div style="text-align:center;padding:20px"><p style="font-size:28px;font-weight:700" id="timer-display">00:00</p><div style="margin-top:12px;display:flex;gap:8px;justify-content:center"><button type="button" id="timer-start" style="padding:6px 12px">▶ Старт</button><button type="button" id="timer-reset" style="padding:6px 12px">↺ Сброс</button></div></div>`;
      let sec = 0;
      let iv = null;
      const disp = root.querySelector("#timer-display");
      root.querySelector("#timer-start").addEventListener("click", function () {
        if (iv) { clearInterval(iv); iv = null; this.textContent = "▶ Старт"; }
        else { iv = setInterval(() => { sec++; disp.textContent = String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0"); }, 1000); this.textContent = "⏸ Пауза"; }
      });
      root.querySelector("#timer-reset").addEventListener("click", () => { sec = 0; disp.textContent = "00:00"; });
    } else if (storeApp.id === "photo") {
      root.innerHTML = `<p style="font-size:12px;margin-bottom:8px">📷 Нарисуй что-нибудь — это твоё фото!</p><canvas width="300" height="180" style="border:1px solid #aaa;border-radius:4px;background:#fff;cursor:crosshair;display:block;touch-action:none"></canvas>`;
      const c = root.querySelector("canvas");
      const ctx = c.getContext("2d");
      ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#222";
      let d = false;
      function pos(e) { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }; }
      c.addEventListener("mousedown", (e) => { d = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
      c.addEventListener("mousemove", (e) => { if (!d) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
      window.addEventListener("mouseup", () => { d = false; });
    } else if (storeApp.id === "messenger") {
      root.innerHTML = `<div style="padding:8px"><div id="msg-log" style="height:140px;overflow:auto;border:1px solid #aaa;border-radius:4px;padding:6px;background:#fff;margin-bottom:6px;font-size:12px"><div style="color:#060"><b>Друг:</b> Привет! Как дела? Напиши мне.</div></div><div style="display:flex;gap:6px"><input id="msg-in" style="flex:1;padding:6px;border:1px solid #aaa;border-radius:4px" placeholder="Сообщение…"><button type="button" id="msg-send" style="padding:6px 10px">→</button></div></div>`;
      const log = root.querySelector("#msg-log");
      const inp = root.querySelector("#msg-in");
      const replies = ["Круто!", "Расскажи ещё", "Ого, серьёзно?", "Ладно, давай потом", "Я тут играю в сапёра 😄", "Напиши Амалю в «Ещё игры» — он добавит", "Ха-ха, согласен"];
      function add(who, text, cls) { log.innerHTML += `<div style="color:${cls};margin-top:4px"><b>${who}:</b> ${text}</div>`; log.scrollTop = log.scrollHeight; }
      function send() {
        const t = inp.value.trim(); if (!t) return; inp.value = "";
        add("Ты", t, "#006");
        setTimeout(() => add("Друг", replies[Math.floor(Math.random() * replies.length)], "#060"), 600 + Math.random() * 800);
      }
      root.querySelector("#msg-send").addEventListener("click", send);
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    } else if (storeApp.id === "snake") {
      root.innerHTML = `<canvas width="200" height="200" style="border:1px solid #888;background:#1a3a12;display:block;margin:0 auto"></canvas><p style="text-align:center;font-size:11px;margin-top:6px">Стрелки — управление</p>`;
      const c = root.querySelector("canvas");
      const ctx = c.getContext("2d");
      const sz = 10;
      let snake = [{ x: 5, y: 5 }];
      let dir = { x: 1, y: 0 };
      let food = { x: 10, y: 10 };
      let iv = setInterval(() => {
        const head = { x: (snake[0].x + dir.x + 20) % 20, y: (snake[0].y + dir.y + 20) % 20 };
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) { food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) }; }
        else snake.pop();
        ctx.fillStyle = "#1a3a12"; ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = "#f44"; ctx.fillRect(food.x * sz, food.y * sz, sz, sz);
        snake.forEach((s, i) => { ctx.fillStyle = i === 0 ? "#6f6" : "#4a4"; ctx.fillRect(s.x * sz, s.y * sz, sz - 1, sz - 1); });
      }, 150);
      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" && dir.y !== 1) dir = { x: 0, y: -1 };
        else if (e.key === "ArrowDown" && dir.y !== -1) dir = { x: 0, y: 1 };
        else if (e.key === "ArrowLeft" && dir.x !== 1) dir = { x: -1, y: 0 };
        else if (e.key === "ArrowRight" && dir.x !== -1) dir = { x: 1, y: 0 };
      });
    } else {
      root.innerHTML = `<p style="padding:20px;text-align:center">${storeApp.icon} ${storeApp.title} — открыто!</p>`;
    }
  }

  function makeWishApp(root) {
    root.className = "app-wish";
    root.innerHTML = `
      <p style="font-size:12px;line-height:1.45;margin-bottom:8px">
        Напиши, какую игру хочешь. Например: <em>«Чувак, добавь игру про динозавров»</em>
      </p>
      <textarea id="wish-text" placeholder="Твоё пожелание…"></textarea>
      <div class="wish-row">
        <button type="button" class="wish-send" id="wish-send">📨 Отправить Амалю</button>
      </div>
      <div class="wish-ok" id="wish-ok" hidden></div>
    `;

    const ta = root.querySelector("#wish-text");
    const ok = root.querySelector("#wish-ok");

    root.querySelector("#wish-send").addEventListener("click", () => {
      const text = ta.value.trim();
      if (!text) {
        ok.hidden = false;
        ok.textContent = "Напиши хоть пару слов 🙂";
        return;
      }
      const msg = "🖥️ Пожелание с компа: " + text;
      let sent = false;
      try {
        if (window.AmalHub && typeof AmalHub.addNote === "function") {
          const res = AmalHub.addNote(msg, { game: "old-pc" });
          sent = !!(res && res.ok);
        }
      } catch { /* ignore */ }
      ok.hidden = false;
      ok.textContent = sent
        ? "Отправлено! Амаль увидит. Можешь ещё написать."
        : "Записано! (Открой ник 📝 в углу — так точно дойдёт до Амаля.)";
      ta.value = "";
      speak("Принял! Посмотрим, что можно добавить.");
    });
  }

  function makeNotepadApp(root) {
    root.className = "app-note";
    root.innerHTML = `<textarea placeholder="Пиши что угодно…"></textarea>`;
  }

  function makeCalcApp(root) {
    root.className = "app-calc";
    let cur = "0";
    let prev = null;
    let op = null;

    const display = document.createElement("div");
    display.className = "display";
    display.textContent = "0";
    root.appendChild(display);

    function set(v) {
      cur = String(v);
      display.textContent = cur;
    }

    function press(val) {
      if (val === "C") {
        prev = null;
        op = null;
        set("0");
        return;
      }
      if (val === "=") {
        if (prev != null && op) {
          const a = parseFloat(prev);
          const b = parseFloat(cur);
          let r = 0;
          if (op === "+") r = a + b;
          else if (op === "-") r = a - b;
          else if (op === "*") r = a * b;
          else if (op === "/") r = b === 0 ? "Err" : a / b;
          set(typeof r === "number" ? (+r.toFixed(8)).toString() : r);
          prev = null;
          op = null;
        }
        return;
      }
      if ("+-*/".includes(val)) {
        prev = cur;
        op = val;
        set("0");
        return;
      }
      if (val === ".") {
        if (!cur.includes(".")) set(cur + ".");
        return;
      }
      set(cur === "0" ? val : cur + val);
    }

    ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"].forEach((k) => {
      const b = document.createElement("button");
      b.textContent = k;
      b.addEventListener("click", () => press(k));
      root.appendChild(b);
    });
    const c = document.createElement("button");
    c.textContent = "C";
    c.style.gridColumn = "1 / -1";
    c.addEventListener("click", () => press("C"));
    root.appendChild(c);
  }

  function makePaintApp(root) {
    root.className = "app-paint";
    const colors = ["#000", "#f00", "#0a0", "#00f", "#ff0", "#f0f"];
    let color = colors[0];
    let drawing = false;

    const tools = document.createElement("div");
    tools.className = "paint-tools";
    colors.forEach((c) => {
      const b = document.createElement("button");
      b.textContent = "■";
      b.style.color = c;
      b.addEventListener("click", () => { color = c; });
      tools.appendChild(b);
    });
    const clear = document.createElement("button");
    clear.textContent = "Стереть";
    tools.appendChild(clear);

    const canvas = document.createElement("canvas");
    canvas.width = 380;
    canvas.height = 220;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width / r.width);
      const y = (e.clientY - r.top) * (canvas.height / r.height);
      return { x, y };
    }

    function start(e) {
      drawing = true;
      const p = pos(e);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
    function move(e) {
      if (!drawing) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    function end() { drawing = false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); start(e.touches[0]); }, { passive: false });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); move(e.touches[0]); }, { passive: false });
    canvas.addEventListener("touchend", end);

    clear.addEventListener("click", () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    root.appendChild(tools);
    root.appendChild(canvas);
  }

  function makeTipsApp(root) {
    root.className = "app-tips";
    let idx = Math.floor(Math.random() * TIPS.length);
    root.innerHTML = `
      <div class="tip-box" id="tip-text">${TIPS[idx]}</div>
      <div class="app-row">
        <button type="button" id="tip-next">Следующая подсказка</button>
        <button type="button" id="tip-say">🔊 Прочитать</button>
      </div>
    `;
    const box = root.querySelector("#tip-text");
    root.querySelector("#tip-next").addEventListener("click", () => {
      idx = (idx + 1) % TIPS.length;
      box.textContent = TIPS[idx];
    });
    root.querySelector("#tip-say").addEventListener("click", () => speak(box.textContent));
  }

  function makeChatApp(root) {
    root.className = "app-chat";
    root.innerHTML = `
      <div class="chat-log" id="chat-log">
        <div class="chat-msg bot"><b>Амаль:</b> Привет! Напиши что-нибудь — отвечу по-русски.</div>
      </div>
      <div class="chat-row">
        <input type="text" id="chat-in" placeholder="Напиши сообщение…" autocomplete="off" />
        <button type="button" id="chat-send">Отправить</button>
      </div>
      <div class="app-row" style="margin-top:6px">
        <button type="button" id="chat-voice">🔊 Озвучить ответ</button>
      </div>
    `;

    const log = root.querySelector("#chat-log");
    const input = root.querySelector("#chat-in");
    let lastBot = "Привет! Напиши что-нибудь — отвечу по-русски.";

    function add(role, name, text) {
      const d = document.createElement("div");
      d.className = `chat-msg ${role}`;
      d.innerHTML = `<b>${name}:</b> ${text}`;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }

    function send() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      add("me", "Ты", text);
      lastBot = replyChat(text);
      add("bot", "Амаль", lastBot);
      speak(lastBot);
    }

    root.querySelector("#chat-send").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    root.querySelector("#chat-voice").addEventListener("click", () => speak(lastBot));
  }

  function makePlayerApp(root) {
    root.className = "app-player";
    const scenes = [
      { name: "Заставка Windows", draw: drawBoot },
      { name: "Космос", draw: drawSpace },
      { name: "Город ночью", draw: drawCity },
      { name: "Змейка", draw: drawSnake },
    ];
    let scene = 0;
    let playing = false;
    let frame = 0;
    let raf = 0;

    root.innerHTML = `
      <div class="player-screen"><canvas id="pl-canvas" width="400" height="200"></canvas></div>
      <p id="pl-title" style="margin:6px 0;font-size:12px"></p>
      <div class="player-controls">
        <button type="button" id="pl-prev">⏮</button>
        <button type="button" id="pl-play">▶ Смотреть</button>
        <button type="button" id="pl-next">⏭</button>
      </div>
    `;

    const canvas = root.querySelector("#pl-canvas");
    const ctx = canvas.getContext("2d");
    const title = root.querySelector("#pl-title");
    const btnPlay = root.querySelector("#pl-play");

    function render() {
      title.textContent = scenes[scene].name;
      scenes[scene].draw(ctx, frame, canvas.width, canvas.height);
    }

    function loop() {
      if (!playing) return;
      frame++;
      render();
      raf = requestAnimationFrame(loop);
    }

    btnPlay.addEventListener("click", () => {
      playing = !playing;
      btnPlay.textContent = playing ? "⏸ Пауза" : "▶ Смотреть";
      if (playing) loop();
      else cancelAnimationFrame(raf);
    });

    root.querySelector("#pl-prev").addEventListener("click", () => {
      scene = (scene - 1 + scenes.length) % scenes.length;
      frame = 0;
      render();
    });
    root.querySelector("#pl-next").addEventListener("click", () => {
      scene = (scene + 1) % scenes.length;
      frame = 0;
      render();
    });

    render();
  }

  function drawBoot(ctx, f, w, h) {
    ctx.fillStyle = "#000080";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Tahoma";
    ctx.fillText("Microsoft Windows 95", 20, 40);
    const barW = Math.min(w - 40, (f * 3) % (w - 20));
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(20, h - 50, w - 40, 16);
    ctx.fillStyle = "#fff";
    ctx.fillRect(22, h - 48, barW, 12);
    ctx.font = "11px Tahoma";
    ctx.fillText("Загрузка…", 20, h - 58);
  }

  function drawSpace(ctx, f, w, h) {
    ctx.fillStyle = "#020818";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const x = (i * 37 + f) % w;
      const y = (i * 53) % h;
      ctx.fillStyle = i % 3 ? "#fff" : "#8cf";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = "#ffd36a";
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.35, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCity(ctx, f, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0a1030");
    sky.addColorStop(1, "#301050");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const bw = 30 + (i % 3) * 20;
      const bh = 40 + (i * 17) % 80;
      ctx.fillStyle = "#111";
      ctx.fillRect(i * 52, h - bh, bw, bh);
      for (let wn = 0; wn < 4; wn++) {
        if ((f + i + wn) % 30 < 15) {
          ctx.fillStyle = "#ffe066";
          ctx.fillRect(i * 52 + 6 + wn * 7, h - bh + 8, 4, 6);
        }
      }
    }
  }

  function drawSnake(ctx, f, w, h) {
    ctx.fillStyle = "#1a3a12";
    ctx.fillRect(0, 0, w, h);
    const len = 8;
    for (let i = 0; i < len; i++) {
      const x = 40 + ((f * 2 - i * 14) % (w - 80));
      const y = 60 + Math.sin((f + i) * 0.08) * 30;
      ctx.fillStyle = i === 0 ? "#6f6" : "#4a4";
      ctx.fillRect(x, y, 12, 12);
    }
    ctx.fillStyle = "#f44";
    ctx.beginPath();
    ctx.arc(30 + (f * 5) % (w - 60), 50 + (f * 3) % (h - 80), 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function makeMineApp(root) {
    root.className = "mine-app-wrap";
    const size = 8;
    const mines = 10;
    let board;
    let revealed;
    let flags;
    let dead;
    let won;
    let firstClick = true;
    let flagMode = false;
    let showHelp = !mineHelpSeen();

    function init() {
      board = Array.from({ length: size }, () => Array(size).fill(0));
      revealed = Array.from({ length: size }, () => Array(size).fill(false));
      flags = Array.from({ length: size }, () => Array(size).fill(false));
      dead = false;
      won = false;
      firstClick = true;
      flagMode = false;
      placeMines(-1, -1);
      paint();
    }

    function placeMines(safeX, safeY) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) board[y][x] = 0;
      }
      let placed = 0;
      while (placed < mines) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        if (Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1) continue;
        if (board[y][x] === -1) continue;
        board[y][x] = -1;
        placed++;
      }
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (board[y][x] === -1) continue;
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < size && nx >= 0 && nx < size && board[ny][nx] === -1) n++;
            }
          }
          board[y][x] = n;
        }
      }
    }

    function flagsLeft() {
      return mines - flags.flat().filter(Boolean).length;
    }

    function checkWin() {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (board[y][x] !== -1 && !revealed[y][x]) return false;
        }
      }
      return true;
    }

    function paint() {
      const helpHtml = showHelp ? `
        <div class="mine-help">
          <button type="button" class="mine-help-close" id="mine-help-close">✕ Закрыть</button>
          <strong>Как играть</strong>
          Жми серые клетки. Цифра = мины рядом. Не наступай на 💣.<br>
          ЛКМ — открыть · ПКМ или «Флажок» — 🚩
        </div>` : "";

      root.innerHTML = `
        ${helpHtml}
        <div class="mine-toolbar">
          <button type="button" id="mine-flag-mode">🚩 Флажок: ВЫКЛ</button>
          ${showHelp ? "" : `<button type="button" id="mine-help-open">❓ Подсказка</button>`}
          <span class="mine-status" id="mine-status">Мин осталось: ${flagsLeft()}</span>
        </div>
        <div class="mine-grid" id="mine-grid"></div>
        <button type="button" class="mine-again" id="mine-again">🔄 Заново</button>
      `;

      if (showHelp) {
        root.querySelector("#mine-help-close").addEventListener("click", () => {
          showHelp = false;
          markMineHelpSeen();
          paint();
        });
      } else {
        const reopen = root.querySelector("#mine-help-open");
        if (reopen) reopen.addEventListener("click", () => { showHelp = true; paint(); });
      }

      const status = root.querySelector("#mine-status");
      if (dead) {
        status.textContent = "💥 Бум! Это была мина. Нажми «Заново».";
        status.className = "mine-status boom";
      } else if (won) {
        status.textContent = "🎉 Победа! Все безопасные клетки открыты.";
        status.className = "mine-status win";
      } else {
        status.textContent = `Мин осталось: ${flagsLeft()}`;
        status.className = "mine-status";
      }

      const flagBtn = root.querySelector("#mine-flag-mode");
      flagBtn.textContent = flagMode ? "🚩 Флажок: ВКЛ" : "🚩 Флажок: ВЫКЛ";
      flagBtn.classList.toggle("active", flagMode);
      flagBtn.addEventListener("click", () => {
        flagMode = !flagMode;
        paint();
      });

      const grid = root.querySelector("#mine-grid");
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "mine-cell";
          if (flags[y][x]) {
            btn.classList.add("flag");
            btn.textContent = "🚩";
          } else if (revealed[y][x]) {
            btn.classList.add("open");
            if (board[y][x] === -1) {
              btn.classList.add("mine-hit");
              btn.textContent = "💣";
            } else if (board[y][x] > 0) {
              btn.textContent = String(board[y][x]);
              btn.style.color = ["", "#00f", "#080", "#f00", "#008", "#800", "#088", "#000", "#666"][board[y][x]] || "#000";
            }
          }
          btn.addEventListener("click", () => {
            if (flagMode) toggleFlag(x, y);
            else openCell(x, y);
          });
          btn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            toggleFlag(x, y);
          });
          grid.appendChild(btn);
        }
      }

      root.querySelector("#mine-again").addEventListener("click", init);
    }

    function toggleFlag(x, y) {
      if (dead || won || revealed[y][x]) return;
      flags[y][x] = !flags[y][x];
      paint();
    }

    function openCell(x, y) {
      if (dead || won || revealed[y][x] || flags[y][x]) return;
      if (firstClick) {
        firstClick = false;
        placeMines(x, y);
      }
      revealed[y][x] = true;
      if (board[y][x] === -1) {
        dead = true;
        for (let yy = 0; yy < size; yy++) {
          for (let xx = 0; xx < size; xx++) {
            if (board[yy][xx] === -1) revealed[yy][xx] = true;
          }
        }
      } else if (board[y][x] === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < size && nx >= 0 && nx < size && !revealed[ny][nx] && !flags[ny][nx]) {
              openCell(nx, ny);
            }
          }
        }
      }
      if (!dead && checkWin()) won = true;
      paint();
    }

    init();
  }

  function tickClock() {
    const n = new Date();
    clockEl.textContent = n.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  renderIcons();
  getInstalled().forEach((sid) => {
    const sa = STORE_APPS.find((a) => a.id === sid);
    if (sa) addInstalledIcon(sa);
  });
  renderStartMenu();
  tickClock();
  setInterval(tickClock, 10000);

  if (welcomeSeen()) {
    document.body.classList.add("started");
  } else {
    showWelcome();
  }
})();
