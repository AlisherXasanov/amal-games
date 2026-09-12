/**
 * Домашняя лаборатория — своя игра в духе познавательных опытов дома.
 * Комнаты-обрывки, опыты, книжки, текстовые команды, Валера-помощник.
 * Не копия чужого канала — оригинальный сценарий «Миры Амаля».
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var SAVE = "amal-poznavatel-lab-v1";
  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var logEl = document.getElementById("log");
  var toastEl = document.getElementById("toast");
  var toastT = 0;

  var ROOMS = [
    { id: "kitchen", name: "Кухня", x: 40, y: 80, w: 280, h: 200, color: "#14532d", detail: "стол, раковина, банки" },
    { id: "desk", name: "Стол", x: 340, y: 60, w: 260, h: 180, color: "#1e3a8a", detail: "лампа, тетрадь, провода" },
    { id: "balcony", name: "Балкон", x: 640, y: 90, w: 260, h: 190, color: "#0e7490", detail: "небо, ящик с магнитами" },
    { id: "bath", name: "Ванная", x: 120, y: 310, w: 300, h: 180, color: "#4c1d95", detail: "вода, мыло, стаканы" },
    { id: "hall", name: "Коридор", x: 460, y: 300, w: 360, h: 180, color: "#7c2d12", detail: "полки с книжками" },
  ];

  var EXPS = [
    {
      id: "volcano",
      name: "Вулкан",
      room: "kitchen",
      needBook: "chem",
      words: ["вулкан", "сода", "уксус"],
      iq: 12,
      desc: "Сода + уксус — пенный вулкан на кухне.",
    },
    {
      id: "lamp",
      name: "Лампа-схема",
      room: "desk",
      needBook: "electro",
      words: ["лампа", "схема", "батарейка", "провод"],
      iq: 14,
      desc: "Замкни цепь — лампочка загорится.",
    },
    {
      id: "ice",
      name: "Лёд и соль",
      room: "kitchen",
      needBook: "phys",
      words: ["лёд", "лед", "соль", "мороз"],
      iq: 10,
      desc: "Соль ускоряет таяние — измеряем время.",
    },
    {
      id: "magnet",
      name: "Магнитный лов",
      room: "balcony",
      needBook: "phys",
      words: ["магнит", "железо", "притяни"],
      iq: 11,
      desc: "На балконе собираем железки магнитом.",
    },
    {
      id: "bubbles",
      name: "Мыльные пузыри",
      room: "bath",
      needBook: null,
      words: ["пузыри", "мыло", "пена"],
      iq: 8,
      desc: "Ванная: гигантские пузыри без книжки.",
    },
    {
      id: "static",
      name: "Статическое чудо",
      room: "hall",
      needBook: "electro",
      words: ["статик", "шар", "волосы", "наэлектриз"],
      iq: 13,
      desc: "Натри шар — волосы Валеры встанут дыбом.",
    },
  ];

  var BOOKS = [
    { id: "chem", name: "Химия дома", unlock: "Открывает вулкан и ещё опыты с реакциями." },
    { id: "phys", name: "Физика на подоконнике", unlock: "Лёд/соль и магниты." },
    { id: "electro", name: "Ток без страха", unlock: "Лампа и статика." },
  ];

  var state = {
    room: "kitchen",
    iq: 0,
    done: {},
    books: {},
    anim: 0,
    fx: null,
    fxT: 0,
    valeraMood: "idle",
    selectedExp: null,
  };

  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      state.iq = d.iq || 0;
      state.done = d.done || {};
      state.books = d.books || {};
      state.room = d.room || "kitchen";
    }
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(
        SAVE,
        JSON.stringify({ iq: state.iq, done: state.done, books: state.books, room: state.room })
      );
    } catch (_) {}
  }

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2.2 : t;
  }
  function log(m) {
    logEl.textContent = m + "\n" + logEl.textContent;
  }

  function doneCount() {
    return Object.keys(state.done).length;
  }
  function booksCount() {
    return Object.keys(state.books).length;
  }

  function refreshUI() {
    document.getElementById("iq").textContent = String(state.iq);
    document.getElementById("done").textContent = String(doneCount());
    document.getElementById("books-n").textContent = String(booksCount());

    var rooms = document.getElementById("rooms");
    rooms.innerHTML = "";
    ROOMS.forEach(function (r) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.room === r.id ? " on" : "");
      b.textContent = r.name;
      b.onclick = function () {
        state.room = r.id;
        log("Валера: пошли в «" + r.name + "». " + r.detail);
        toast("Комната: " + r.name);
        refreshUI();
        save();
      };
      rooms.appendChild(b);
    });

    var exps = document.getElementById("exps");
    exps.innerHTML = "";
    EXPS.forEach(function (e) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.selectedExp === e.id ? " on" : "");
      var locked = e.needBook && !state.books[e.needBook];
      b.disabled = !!locked;
      b.textContent = (state.done[e.id] ? "✓ " : "") + e.name + (locked ? " 🔒" : "");
      b.title = e.desc + (locked ? " Нужна книжка." : "");
      b.onclick = function () {
        if (locked) return toast("Сначала прочитай книжку");
        state.selectedExp = e.id;
        state.room = e.room;
        log("Выбран опыт: " + e.name + ". Скажи команду или жми «Го».");
        refreshUI();
      };
      exps.appendChild(b);
    });

    var books = document.getElementById("books");
    books.innerHTML = "";
    BOOKS.forEach(function (bk) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (state.books[bk.id] ? " on" : "");
      b.textContent = (state.books[bk.id] ? "✓ " : "📖 ") + bk.name;
      b.onclick = function () {
        if (state.books[bk.id]) {
          toast("Уже прочитано");
          return;
        }
        if (state.room !== "hall" && state.room !== "desk") {
          toast("Книжки удобнее читать в Коридоре или за Столом");
          state.room = "hall";
          refreshUI();
        }
        state.books[bk.id] = 1;
        state.iq += 5;
        log("Прочитал «" + bk.name + "». " + bk.unlock);
        toast("Книга открыта!");
        sayValera("Теперь новые опыты!");
        refreshUI();
        save();
      };
      books.appendChild(b);
    });
  }

  function sayValera(t) {
    state.valeraMood = "talk";
    log("Валера: " + t);
  }

  function findExpByText(text) {
    var t = (text || "").toLowerCase().trim();
    if (!t) return null;
    if (t.indexOf("чита") >= 0) return { special: "read" };
    for (var i = 0; i < EXPS.length; i++) {
      var e = EXPS[i];
      for (var w = 0; w < e.words.length; w++) {
        if (t.indexOf(e.words[w]) >= 0) return e;
      }
      if (t.indexOf(e.name.toLowerCase()) >= 0) return e;
    }
    if (state.selectedExp) {
      for (var j = 0; j < EXPS.length; j++) if (EXPS[j].id === state.selectedExp) return EXPS[j];
    }
    return null;
  }

  function runExp(e) {
    if (!e) {
      toast("Не понял команду. Пример: вулкан");
      return;
    }
    if (e.special === "read") {
      toast("Выбери книжку справа");
      state.room = "hall";
      refreshUI();
      return;
    }
    if (e.needBook && !state.books[e.needBook]) {
      toast("Нужна книжка для этого опыта");
      sayValera("Сначала учись по книге!");
      return;
    }
    state.room = e.room;
    state.selectedExp = e.id;
    state.fx = e.id;
    state.fxT = 2.8;
    state.valeraMood = "wow";
    if (!state.done[e.id]) {
      state.done[e.id] = 1;
      state.iq += e.iq;
      log("✓ Опыт «" + e.name + "» удался! +" + e.iq + " ума. " + e.desc);
      toast("Получилось: " + e.name);
      sayValera("Класс! Запиши в журнал.");
    } else {
      log("Повторили «" + e.name + "». Всё ещё круто.");
      toast("Повтор: " + e.name);
      sayValera("Ещё раз — ещё точнее!");
    }
    // новая функция: связка опытов
    if (state.done.volcano && state.done.lamp && !state.done._combo) {
      state.done._combo = 1;
      state.iq += 20;
      log("✨ Новая функция: связка «Кухня+Стол»! Вулкан осветили лампой. +20 ума");
      toast("Новая функция разблокирована!");
      sayValera("Смотри — опыты связались!");
    }
    if (doneCount() >= 6 && !state.done._master) {
      state.done._master = 1;
      state.iq += 30;
      log("🏆 Домашняя лаборатория собрана целиком. Ты — познаватель дома!");
      toast("Все основные опыты!");
    }
    refreshUI();
    save();
  }

  function onCommand() {
    var text = document.getElementById("cmd").value;
    document.getElementById("cmd").value = "";
    if (!text.trim()) {
      if (state.selectedExp) {
        for (var i = 0; i < EXPS.length; i++) if (EXPS[i].id === state.selectedExp) return runExp(EXPS[i]);
      }
      toast("Напиши: вулкан / лампа / пузыри…");
      return;
    }
    log("> " + text);
    runExp(findExpByText(text));
  }

  document.getElementById("go").onclick = onCommand;
  document.getElementById("cmd").addEventListener("keydown", function (e) {
    if (e.key === "Enter") onCommand();
  });

  function roomById(id) {
    for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) return ROOMS[i];
    return ROOMS[0];
  }

  function draw() {
    var W = canvas.width;
    var H = canvas.height;
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);

    // stitches between room fragments
    ctx.strokeStyle = "rgba(125,211,252,0.25)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(320, 180);
    ctx.lineTo(340, 150);
    ctx.moveTo(600, 150);
    ctx.lineTo(640, 170);
    ctx.moveTo(280, 280);
    ctx.lineTo(200, 310);
    ctx.moveTo(420, 310);
    ctx.lineTo(460, 300);
    ctx.stroke();
    ctx.setLineDash([]);

    for (var i = 0; i < ROOMS.length; i++) {
      var r = ROOMS[i];
      var on = state.room === r.id;
      ctx.fillStyle = r.color;
      ctx.globalAlpha = on ? 1 : 0.55;
      roundRect(r.x, r.y, r.w, r.h, 16);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = on ? "#7dd3fc" : "rgba(255,255,255,0.15)";
      ctx.lineWidth = on ? 3 : 1;
      roundRect(r.x, r.y, r.w, r.h, 16);
      ctx.stroke();
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "900 16px system-ui";
      ctx.fillText(r.name, r.x + 14, r.y + 28);
      ctx.font = "600 12px system-ui";
      ctx.fillStyle = "rgba(224,242,254,0.75)";
      ctx.fillText(r.detail, r.x + 14, r.y + 48);

      // mini props
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(r.x + 20, r.y + r.h - 50, r.w - 40, 18);
    }

    // player (познаватель)
    var rm = roomById(state.room);
    var px = rm.x + rm.w * 0.35;
    var py = rm.y + rm.h * 0.55;
    drawPerson(px, py, "#38bdf8", "Ты");

    // Valera
    var vx = rm.x + rm.w * 0.62;
    var vy = rm.y + rm.h * 0.58 + Math.sin(state.anim * 3) * 3;
    drawPerson(vx, vy, "#fbbf24", "Валера");
    if (state.valeraMood === "talk" || state.valeraMood === "wow") {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      roundRect(vx - 10, vy - 70, 100, 28, 10);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "800 11px system-ui";
      ctx.fillText(state.valeraMood === "wow" ? "Вау!" : "Я тут!", vx, vy - 52);
    }

    // FX
    if (state.fx && state.fxT > 0) {
      drawFx(state.fx, rm);
    }

    ctx.fillStyle = "rgba(7,19,31,0.75)";
    roundRect(16, H - 54, 520, 38, 12);
    ctx.fill();
    ctx.fillStyle = "#7dd3fc";
    ctx.font = "700 13px system-ui";
    ctx.fillText("Обрывки дома склеены → ходи по комнатам, читай, говори опыты", 28, H - 30);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPerson(x, y, color, label) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 28, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 12, y - 14, 24, 28);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "800 11px system-ui";
    ctx.fillText(label, x - 16, y + 28);
  }

  function drawFx(id, rm) {
    var cx = rm.x + rm.w / 2;
    var cy = rm.y + rm.h / 2;
    if (id === "volcano") {
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 20);
      ctx.lineTo(cx, cy - 40);
      ctx.lineTo(cx + 30, cy + 20);
      ctx.fill();
      ctx.fillStyle = "#4ade80";
      for (var i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(cx + Math.sin(state.anim * 8 + i) * 20, cy - 30 - i * 6, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id === "lamp") {
      ctx.fillStyle = state.fxT > 0 ? "#fde047" : "#64748b";
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      for (var j = 0; j < 6; j++) {
        var a = (j / 6) * Math.PI * 2 + state.anim;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 28, cy - 10 + Math.sin(a) * 28);
        ctx.lineTo(cx + Math.cos(a) * 40, cy - 10 + Math.sin(a) * 40);
        ctx.stroke();
      }
    } else if (id === "bubbles") {
      ctx.strokeStyle = "#a5f3fc";
      for (var b = 0; b < 7; b++) {
        ctx.beginPath();
        ctx.arc(cx + Math.sin(state.anim + b) * 40, cy - b * 12, 10 + (b % 3) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (id === "magnet") {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(cx - 35, cy - 8, 30, 18);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(cx + 5, cy - 8, 30, 18);
    } else if (id === "ice") {
      ctx.fillStyle = "#bae6fd";
      ctx.fillRect(cx - 28, cy - 10, 56, 28);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "900 12px system-ui";
      ctx.fillText("соль!", cx - 14, cy + 8);
    } else if (id === "static") {
      ctx.strokeStyle = "#e879f9";
      ctx.lineWidth = 2;
      for (var s = 0; s < 10; s++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(state.anim * 5 + s) * 50, cy + Math.sin(state.anim * 5 + s) * 50);
        ctx.stroke();
      }
    }
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.anim += dt;
    if (state.fxT > 0) {
      state.fxT -= dt;
      if (state.fxT <= 0) {
        state.fx = null;
        state.valeraMood = "idle";
      }
    }
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.style.display = "none";
    }
    draw();
    requestAnimationFrame(frame);
  }

  // click rooms on canvas
  canvas.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect();
    var x = ((e.clientX - r.left) * canvas.width) / r.width;
    var y = ((e.clientY - r.top) * canvas.height) / r.height;
    for (var i = 0; i < ROOMS.length; i++) {
      var room = ROOMS[i];
      if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
        state.room = room.id;
        log("Перешёл в «" + room.name + "»");
        refreshUI();
        save();
        break;
      }
    }
  });

  refreshUI();
  log("Старт: дом из обрывков собран. Читай книжки, выбирай опыты, пиши команды.");
  sayValera("Я Валера. Давай познавать дом!");
  toast("Пиши команду: вулкан", 3);
  requestAnimationFrame(frame);
})();
