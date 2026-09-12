/**
 * 2D дом Валеры — исследовать комнаты, титры к вещам, брать предметы,
 * «снимать» ролики и пересматривать, делать опыты (познавательные).
 * Валера — жёлтый друг. Мебель: Kenney Furniture Topdown (CC0).
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var W = 960,
    H = 540,
    TS = 48,
    ASSET = "../shared/kenney-furniture/Topdown/",
    SAVE = "amal-valera-house-2d-v1";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var toastEl = document.getElementById("toast");
  var titleEl = document.getElementById("title");
  var invEl = document.getElementById("inv");
  var recEl = document.getElementById("rec");
  var panel = document.getElementById("panel");
  var panelBody = document.getElementById("panel-body");
  var toastT = 0;
  var titleT = 0;
  var imgs = {};
  var animT = 0;

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2 : t;
  }
  function showTitle(m, t) {
    titleEl.textContent = m;
    titleEl.style.display = "block";
    titleT = t == null ? 2.5 : t;
  }
  function load(src) {
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () {
        res(i);
      };
      i.onerror = function () {
        res(null);
      };
      i.src = src;
    });
  }

  /* комнаты-локации как «обрывки видео» дома */
  var ROOMS = {
    living: {
      name: "Гостиная",
      color: "#3f2a14",
      floor: "#6b4423",
      w: 18,
      h: 10,
      doors: { right: "kitchen" },
    },
    kitchen: {
      name: "Кухня",
      color: "#1e3a2f",
      floor: "#2f5d4a",
      w: 14,
      h: 10,
      doors: { left: "living", right: "lab", down: "bedroom" },
    },
    bedroom: {
      name: "Комната Валеры",
      color: "#3b2a55",
      floor: "#5b4a7a",
      w: 14,
      h: 10,
      doors: { up: "kitchen" },
    },
    lab: {
      name: "Уголок опытов",
      color: "#0c4a6e",
      floor: "#155e75",
      w: 12,
      h: 10,
      doors: { left: "kitchen" },
    },
  };

  var ITEMS = [
    // living
    { id: "sofa", room: "living", x: 3, y: 3, spr: "loungeSofa", title: "Диван", text: "Мягкий. Валера тут смотрит «ролики».", take: false },
    { id: "rug", room: "living", x: 6, y: 5, spr: "rugRectangle", title: "Ковёр", text: "Тёплый. Хорошо для съёмок с пола.", take: false },
    { id: "tv", room: "living", x: 8, y: 2, spr: "televisionModern", title: "Телевизор", text: "Можно «снимать» и потом пересматривать клипы.", take: false, action: "clips" },
    { id: "tablec", room: "living", x: 5, y: 5, spr: "tableCoffee", title: "Столик", text: "На нём обычно лежит пульт… и крошки.", take: false },
    { id: "radio", room: "living", x: 12, y: 3, spr: "radio", title: "Радио", text: "Шумит волнами. Почти как фон в видео.", take: true },
    { id: "plant1", room: "living", x: 14, y: 7, spr: "plantSmall1", title: "Цветок", text: "Его надо иногда «поливать» (кнопка опыт).", take: false },
    { id: "bear", room: "living", x: 2, y: 7, spr: "bear", title: "Мишка", text: "Старый друг. Не настоящий блогер.", take: true },
    { id: "box", room: "living", x: 15, y: 4, spr: "cardboardBoxOpen", title: "Коробка", text: "Внутри — реквизит для съёмок.", take: false, action: "loot" },
    // kitchen
    { id: "fridge", room: "kitchen", x: 2, y: 2, spr: "kitchenFridge", title: "Холодильник", text: "Сода, уксус, лёд — всё для опытов.", take: false, action: "fridge" },
    { id: "ktable", room: "kitchen", x: 6, y: 4, spr: "table", title: "Кухонный стол", text: "Главная сцена домашних экспериментов.", take: false },
    { id: "chair", room: "kitchen", x: 6, y: 6, spr: "chair", title: "Стул", text: "Шаткая ножка. Классика.", take: false },
    { id: "sink", room: "kitchen", x: 10, y: 2, spr: "kitchenSink", title: "Раковина", text: "Вода для пузырей и «извержений».", take: false },
    { id: "soda", room: "kitchen", x: 8, y: 4, spr: null, title: "Банка соды", text: "Для вулкана. Можно взять.", take: true, color: "#f8fafc", emoji: "🧂" },
    { id: "vinegar", room: "kitchen", x: 9, y: 4, spr: null, title: "Уксус", text: "Пахнет резко. Нужен для реакции.", take: true, color: "#a3e635", emoji: "🧴" },
    // bedroom
    { id: "bed", room: "bedroom", x: 2, y: 3, spr: "bedSingle", title: "Кровать", text: "Жёлтый Валера тут высыпается после съёмок.", take: false },
    { id: "desk", room: "bedroom", x: 8, y: 2, spr: "desk", title: "Стол Валеры", text: "Ноутбук, телефон, идеи для новых роликов.", take: false },
    { id: "chaird", room: "bedroom", x: 8, y: 5, spr: "chairDesk", title: "Кресло", text: "Крутится. Опасно для эксперимента «спин».", take: false },
    { id: "laptop", room: "bedroom", x: 9, y: 2, spr: "laptop", title: "Ноутбук", text: "Монтаж «видео». Открой ролики.", take: false, action: "clips" },
    { id: "phone", room: "bedroom", x: 10, y: 3, spr: null, title: "Телефон Валеры", text: "Не настоящая съёмка — но можно «писать» клип в игре.", take: true, color: "#111827", emoji: "📱" },
    { id: "books", room: "bedroom", x: 4, y: 7, spr: "books", title: "Книжки", text: "Специальные: химия дома, физика на подоконнике.", take: false, action: "books" },
    { id: "shelf", room: "bedroom", x: 11, y: 2, spr: "bookcaseOpen", title: "Полка", text: "Реквизит, кубки, странные банки.", take: false },
    // lab
    { id: "labtable", room: "lab", x: 4, y: 4, spr: "table", title: "Стол опытов", text: "Здесь делают познавательные опыты.", take: false, action: "lab" },
    { id: "magnet", room: "lab", x: 7, y: 3, spr: null, title: "Магнит", text: "Тянет железки. Классика.", take: true, color: "#ef4444", emoji: "🧲" },
    { id: "flask", room: "lab", x: 3, y: 6, spr: null, title: "Колба", text: "Пустая. Ждёт смелый опыт.", take: true, color: "#67e8f9", emoji: "🧪" },
    { id: "notes", room: "lab", x: 9, y: 6, spr: "books", title: "Журнал опытов", text: "Записи: вулкан, лампа, пузыри…", take: false, action: "journal" },
    { id: "lamp", room: "lab", x: 2, y: 2, spr: "lampRoundTable", title: "Лампа", text: "Для опыта «цепь».", take: false },
  ];

  var EXPS = [
    { id: "volcano", name: "Вулкан", need: ["soda", "vinegar"], where: "kitchen", tip: "Сода + уксус на кухне" },
    { id: "bubbles", name: "Пузыри", need: [], where: "kitchen", tip: "У раковины — мыльные пузыри" },
    { id: "magnet", name: "Магнитный лов", need: ["magnet"], where: "lab", tip: "С магнитом в уголке опытов" },
    { id: "static", name: "Статика", need: [], where: "bedroom", tip: "Потри шар… ну почти: кресло!" },
    { id: "lamp", name: "Лампа-схема", need: ["flask"], where: "lab", tip: "Колба + лампа = «цепь» по-игровому" },
  ];

  var state = {
    room: "living",
    x: 6,
    y: 6,
    facing: 1,
    held: null,
    gone: {},
    clips: [],
    recording: false,
    recFrames: [],
    recT: 0,
    doneExp: {},
    iq: 0,
    books: 0,
  };

  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      state.clips = d.clips || [];
      state.doneExp = d.doneExp || {};
      state.iq = d.iq || 0;
      state.books = d.books || 0;
      state.held = d.held || null;
      state.gone = d.gone || {};
    }
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(
        SAVE,
        JSON.stringify({
          clips: state.clips.slice(-12),
          doneExp: state.doneExp,
          iq: state.iq,
          books: state.books,
          held: state.held,
          gone: state.gone,
        })
      );
    } catch (_) {}
  }

  function room() {
    return ROOMS[state.room];
  }
  function itemsHere() {
    return ITEMS.filter(function (it) {
      return it.room === state.room && !state.gone[it.id];
    });
  }

  function worldPx(tx) {
    return tx * TS;
  }
  function cam() {
    var R = room();
    var px = state.x * TS;
    var py = state.y * TS;
    return {
      x: Math.max(0, Math.min(R.w * TS - W, px - W / 2)),
      y: Math.max(0, Math.min(R.h * TS - H, py - H / 2)),
    };
  }

  function nearItem() {
    var best = null;
    var bestD = 1.6;
    itemsHere().forEach(function (it) {
      var d = Math.hypot(it.x - state.x, it.y - state.y);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    });
    return best;
  }

  function interact() {
    if (nearValera()) {
      talkValera();
      return;
    }
    var it = nearItem();
    if (!it) {
      // doors
      var R = room();
      if (state.x <= 1 && R.doors.left) return goRoom(R.doors.left, R.w - 3, state.y);
      if (state.x >= R.w - 2 && R.doors.right) return goRoom(R.doors.right, 2, state.y);
      if (state.y <= 1 && R.doors.up) return goRoom(R.doors.up, state.x, R.h - 3);
      if (state.y >= R.h - 2 && R.doors.down) return goRoom(R.doors.down, state.x, 2);
      toast("Подойди к вещи, к Валере или к двери");
      return;
    }
    showTitle(it.title + " — " + it.text, 3.2);
    if (it.action === "clips") return openClips();
    if (it.action === "lab") return openLab();
    if (it.action === "books") {
      state.books = Math.min(3, state.books + 1);
      state.iq += 5;
      toast("Прочитал спецкнижку! Книг: " + state.books);
      save();
      return;
    }
    if (it.action === "journal") {
      toast("Опытов сделано: " + Object.keys(state.doneExp).length + " · ум " + state.iq);
      return;
    }
    if (it.action === "fridge") {
      toast("Внутри: сода и уксус на столе. Возьми их!");
      return;
    }
    if (it.action === "loot") {
      toast("Достал блестяшку для ролика (+реквизит)");
      return;
    }
    if (it.take) {
      if (state.held) {
        toast("Сначала положи то, что в руках (Q)");
        return;
      }
      state.held = it.id;
      state.gone[it.id] = 1;
      invEl.textContent = "в руках: " + it.title;
      toast("Взял: " + it.title);
      save();
    }
  }

  function dropHeld() {
    if (!state.held) return toast("Пусто");
    var id = state.held;
    var it = null;
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) it = ITEMS[i];
    if (!it) return;
    it.room = state.room;
    it.x = Math.round(state.x + state.facing);
    it.y = Math.round(state.y);
    delete state.gone[id];
    state.held = null;
    invEl.textContent = "в руках: ничего";
    toast("Положил: " + it.title);
    save();
  }

  function goRoom(id, x, y) {
    state.room = id;
    state.x = x;
    state.y = Math.max(2, Math.min(room().h - 2, y));
    showTitle("Локация: " + room().name, 2);
    toast(room().name);
  }

  function toggleCam() {
    if (!state.recording) {
      state.recording = true;
      state.recFrames = [];
      state.recT = 0;
      recEl.style.display = "block";
      toast("Камера: запись… походи и сделай опыт");
    } else {
      state.recording = false;
      recEl.style.display = "none";
      if (state.recFrames.length > 4) {
        var clip = {
          id: Date.now(),
          name: "Ролик · " + room().name + " · " + new Date().toLocaleTimeString(),
          room: state.room,
          frames: state.recFrames.slice(),
          note: Object.keys(state.doneExp).length ? "с опытом" : "прогулка",
        };
        state.clips.push(clip);
        toast("Ролик сохранён! Смотри в «ролики»");
        save();
      } else toast("Слишком короткий клип");
      state.recFrames = [];
    }
  }

  function openClips() {
    panel.style.display = "flex";
    var html = "<h2>🎞 Ролики из дома</h2><p style='opacity:.8;margin-bottom:8px;font:600 13px system-ui'>Ты гость со камерой. Не настоящее видео — игровые клипы.</p>";
    if (!state.clips.length) html += "<p>Пока пусто. Жми «камера», походи, снова «камера».</p>";
    state.clips
      .slice()
      .reverse()
      .forEach(function (c) {
        html +=
          '<div style="margin:8px 0;padding:8px;border:1px solid #78350f;border-radius:10px"><b>' +
          c.name +
          "</b><br/><span style='opacity:.75'>" +
          c.note +
          " · кадров " +
          c.frames.length +
          '</span><br/><button type="button" data-play="' +
          c.id +
          '">смотреть</button></div>';
      });
    html += '<button type="button" class="x" id="px">закрыть</button>';
    panelBody.innerHTML = html;
    panelBody.onclick = function (e) {
      var t = e.target;
      if (t.id === "px") panel.style.display = "none";
      var id = t.getAttribute("data-play");
      if (id) {
        panel.style.display = "none";
        playClip(+id);
      }
    };
  }

  var replay = null;
  function playClip(id) {
    for (var i = 0; i < state.clips.length; i++) {
      if (state.clips[i].id === id) {
        replay = { clip: state.clips[i], i: 0, t: 0 };
        showTitle("▶ " + state.clips[i].name, 2);
        toast("Пересмотр ролика");
        return;
      }
    }
  }

  function openLab() {
    panel.style.display = "flex";
    var html = "<h2>🔬 Опыты</h2><p style='font:600 13px system-ui;opacity:.85;margin-bottom:8px'>Как домашние познавательные опыты. Нужные вещи — в руках / в комнате.</p>";
    EXPS.forEach(function (ex) {
      var done = state.doneExp[ex.id] ? " ✓" : "";
      html +=
        '<button type="button" data-ex="' +
        ex.id +
        '">' +
        ex.name +
        done +
        "</button> <span style='font:600 11px system-ui;opacity:.7'>" +
        ex.tip +
        "</span><br/>";
    });
    html += '<button type="button" class="x" id="px">закрыть</button>';
    panelBody.innerHTML = html;
    panelBody.onclick = function (e) {
      if (e.target.id === "px") panel.style.display = "none";
      var id = e.target.getAttribute("data-ex");
      if (id) {
        panel.style.display = "none";
        doExp(id);
      }
    };
  }

  function hasItem(id) {
    if (state.held === id) return true;
    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i];
      if (it.id === id && it.room === state.room && !state.gone[it.id]) return true;
    }
    return false;
  }

  function doExp(id) {
    var ex = null;
    for (var i = 0; i < EXPS.length; i++) if (EXPS[i].id === id) ex = EXPS[i];
    if (!ex) return;
    if (state.room !== ex.where) {
      toast("Этот опыт — в комнате «" + ROOMS[ex.where].name + "»");
      return;
    }
    for (var n = 0; n < ex.need.length; n++) {
      if (!hasItem(ex.need[n])) {
        toast("Нужен предмет поближе / в руках");
        return;
      }
    }
    if (ex.id === "volcano" && state.books < 1) {
      toast("Сначала глянь книжки в комнате Валеры");
      return;
    }
    state.doneExp[ex.id] = 1;
    state.iq += 10;
    showTitle("Опыт: " + ex.name + " удался!", 3);
    toast("Валера: «Вау! Запиши на камеру!»");
    if (state.recording) state.recFrames.push({ kind: "fx", fx: ex.id, t: animT });
    save();
  }

  var keys = Object.create(null);
  var stickX = 0,
    stickY = 0;
  var player = { bob: 0 };
  /* Валера — NPC в доме; ты — гость со съёмкой */
  var valera = {
    room: "living",
    x: 4.2,
    y: 4.5,
    facing: 1,
    bob: 0,
    wanderT: 0,
    tx: 4.2,
    ty: 4.5,
    sayT: 0,
  };
  var VALERA_LINES = [
    "Привет! Это мой дом — смотри всё!",
    "Давай снимем ролик про опыт!",
    "В кухне сода и уксус — классика.",
    "Жми камеру и ходи рядом со мной.",
    "В уголке опытов самые крутые штуки.",
    "Я жёлтый! Не перепутай с мебелью 😄",
  ];

  function nearValera() {
    if (valera.room !== state.room) return false;
    return Math.hypot(valera.x - state.x, valera.y - state.y) < 1.55;
  }

  function talkValera() {
    var line = VALERA_LINES[(Math.random() * VALERA_LINES.length) | 0];
    showTitle("Валера: «" + line + "»", 3.2);
    toast("Валера что-то сказал");
    valera.sayT = 2.5;
  }

  function updateValera(dt) {
    valera.bob += dt * 7;
    valera.wanderT -= dt;
    valera.sayT = Math.max(0, valera.sayT - dt);
    var R = ROOMS[valera.room];
    if (valera.wanderT <= 0) {
      valera.wanderT = 2.2 + Math.random() * 3.5;
      /* иногда переходит в комнату игрока */
      if (Math.random() < 0.28) {
        valera.room = state.room;
        R = ROOMS[valera.room];
      } else if (Math.random() < 0.18) {
        var keysD = Object.keys(R.doors);
        if (keysD.length) {
          var side = keysD[(Math.random() * keysD.length) | 0];
          valera.room = R.doors[side];
          R = ROOMS[valera.room];
          valera.x = R.w / 2;
          valera.y = R.h / 2;
        }
      }
      valera.tx = 2 + Math.random() * (R.w - 4);
      valera.ty = 2 + Math.random() * (R.h - 4);
    }
    var dx = valera.tx - valera.x;
    var dy = valera.ty - valera.y;
    var dist = Math.hypot(dx, dy);
    if (dist > 0.08) {
      var sp = 1.35 * dt;
      valera.x += (dx / dist) * sp;
      valera.y += (dy / dist) * sp;
      if (dx) valera.facing = dx > 0 ? 1 : -1;
    }
  }

  function update(dt) {
    if (replay) {
      replay.t += dt;
      if (replay.t > 0.12) {
        replay.t = 0;
        replay.i++;
        if (replay.i >= replay.clip.frames.length) {
          replay = null;
          toast("Конец ролика");
        }
      }
      updateValera(dt * 0.35);
      return;
    }

    var ix = 0,
      iy = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) ix -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) ix += 1;
    if (keys["KeyW"] || keys["ArrowUp"]) iy -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) iy += 1;
    if (stickX || stickY) {
      ix = stickX > 0.25 ? 1 : stickX < -0.25 ? -1 : ix;
      iy = stickY > 0.25 ? 1 : stickY < -0.25 ? -1 : iy;
    }
    if (ix) state.facing = ix;
    var sp = 3.2 * dt;
    var R = room();
    state.x = Math.max(1, Math.min(R.w - 2, state.x + ix * sp));
    state.y = Math.max(1, Math.min(R.h - 2, state.y + iy * sp));
    player.bob += dt * 8;
    updateValera(dt);

    if (state.recording) {
      state.recT += dt;
      if (state.recT > 0.2) {
        state.recT = 0;
        state.recFrames.push({
          room: state.room,
          x: state.x,
          y: state.y,
          facing: state.facing,
          held: state.held,
          vx: valera.room === state.room ? valera.x : null,
          vy: valera.room === state.room ? valera.y : null,
          vf: valera.facing,
        });
        if (state.recFrames.length > 200) state.recFrames.shift();
      }
    }
  }

  /** Рисует спрайт с сохранением пропорций (без растягивания в квадрат). */
  function drawSpr(name, cx, cy, maxW, maxH) {
    var im = imgs[name];
    if (!im || !im.width) return false;
    var scale = Math.min(maxW / im.width, maxH / im.height);
    /* крошечные пиксельки увеличиваем сильнее, но без каши */
    if (im.width < 20 || im.height < 16) scale = Math.max(scale, 2.4);
    var dw = im.width * scale;
    var dh = im.height * scale;
    var x = cx - dw / 2;
    var y = cy - dh;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, dw * 0.42, Math.max(4, dh * 0.12), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im, x, y, dw, dh);
    return true;
  }

  function itemMax(it) {
    if (it.spr === "loungeSofa" || it.spr === "rugRectangle") return { w: 110, h: 58 };
    if (it.spr === "bedSingle") return { w: 70, h: 100 };
    if (it.spr === "table" || it.spr === "tableCoffee" || it.spr === "desk") return { w: 88, h: 56 };
    if (it.spr === "televisionModern") return { w: 72, h: 36 };
    if (it.spr === "bookcaseOpen" || it.spr === "kitchenFridge") return { w: 64, h: 72 };
    return { w: 64, h: 64 };
  }

  function drawItem(it, ox, oy) {
    var cx = worldPx(it.x) + TS * 0.5 - ox;
    var cy = worldPx(it.y) + TS * 0.92 - oy;
    var m = itemMax(it);
    if (!drawSpr(it.spr, cx, cy, m.w, m.h)) {
      ctx.fillStyle = it.color || "#fbbf24";
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - 36, 32, 32, 8);
      ctx.fill();
      if (it.emoji) {
        ctx.font = "22px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(it.emoji, cx, cy - 12);
        ctx.textAlign = "left";
      }
    }
  }

  function drawGuest(px, py, facing) {
    var bob = Math.sin(player.bob) * 2.5;
    var cx = px + 20;
    var cy = py + 28 + bob;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(cx, py + 48, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    /* тело — гость в синем, с «камерой» */
    ctx.fillStyle = "#0ea5e9";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.arc(cx, cy - 16, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0369a1";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 22, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    var look = facing > 0 ? 2 : -2;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(cx - 5 + look, cy - 18, 3, 3);
    ctx.fillRect(cx + 2 + look, cy - 18, 3, 3);
    /* камера на руке */
    ctx.fillStyle = "#111827";
    ctx.fillRect(cx + (facing > 0 ? 10 : -18), cy - 4, 10, 7);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(cx + (facing > 0 ? 12 : -16), cy - 2, 4, 3);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Гость", cx, py + 54 + bob);
    ctx.textAlign = "left";
  }

  function drawValeraNpc(px, py, facing, talking) {
    var bob = Math.sin(valera.bob) * 3;
    var cx = px + 20;
    var cy = py + 26 + bob;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(cx, py + 48, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    /* жёлтый медвежонок-мармелад */
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 17, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(cx, cy - 14, 14, 0, Math.PI * 2);
    ctx.fill();
    /* ушки */
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 24, 5, 0, Math.PI * 2);
    ctx.arc(cx + 11, cy - 24, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 24, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 11, cy - 24, 2.5, 0, Math.PI * 2);
    ctx.fill();
    /* мордочка */
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    var look = facing > 0 ? 2 : -2;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(cx - 5 + look, cy - 16, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 5 + look, cy - 16, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.ellipse(cx + look * 0.5, cy - 9, 2.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    if (talking) {
      ctx.fillStyle = "#fff7ed";
      ctx.beginPath();
      ctx.roundRect(cx + 16, cy - 34, 10, 10, 4);
      ctx.fill();
    }
    ctx.fillStyle = "#fef3c7";
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Валера", cx, py + 54 + bob);
    ctx.textAlign = "left";
  }

  function draw() {
    var fr = null;
    if (replay) {
      fr = replay.clip.frames[Math.min(replay.i, replay.clip.frames.length - 1)];
    }
    var view = fr
      ? { room: fr.room, x: fr.x, y: fr.y, facing: fr.facing }
      : { room: state.room, x: state.x, y: state.y, facing: state.facing };

    var R = ROOMS[view.room];
    var ox = Math.max(0, Math.min(R.w * TS - W, view.x * TS - W / 2));
    var oy = Math.max(0, Math.min(R.h * TS - H, view.y * TS - H / 2));

    ctx.fillStyle = R.color;
    ctx.fillRect(0, 0, W, H);
    // floor tiles
    for (var ty = 0; ty < R.h; ty++) {
      for (var tx = 0; tx < R.w; tx++) {
        ctx.fillStyle = (tx + ty) % 2 ? R.floor : mix(R.floor, "#000", 0.08);
        ctx.fillRect(tx * TS - ox, ty * TS - oy, TS, TS);
      }
    }
    // walls fringe
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0 - ox, 0 - oy, R.w * TS, 12);
    ctx.fillRect(0 - ox, R.h * TS - 12 - oy, R.w * TS, 12);

    // door marks
    ctx.fillStyle = "#fde68a";
    ctx.font = "800 12px system-ui";
    if (R.doors.left) ctx.fillText("← " + ROOMS[R.doors.left].name, 8, H / 2);
    if (R.doors.right) ctx.fillText(ROOMS[R.doors.right].name + " →", W - 140, H / 2);
    if (R.doors.up) ctx.fillText("↑ " + ROOMS[R.doors.up].name, W / 2 - 40, 24);
    if (R.doors.down) ctx.fillText("↓ " + ROOMS[R.doors.down].name, W / 2 - 40, H - 16);

    /* сначала ковры, потом остальное по глубине (y) */
    var here = ITEMS.filter(function (it) {
      return it.room === view.room && !state.gone[it.id];
    }).sort(function (a, b) {
      var ra = a.spr && a.spr.indexOf("rug") === 0 ? 0 : 1;
      var rb = b.spr && b.spr.indexOf("rug") === 0 ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return a.y - b.y || a.x - b.x;
    });
    here.forEach(function (it) {
      drawItem(it, ox, oy);
    });

    /* Валера и гость — кто ниже по экрану, тот поверх */
    var actors = [];
    var vx = valera.x;
    var vy = valera.y;
    var vf = valera.facing;
    if (fr && fr.vx != null) {
      vx = fr.vx;
      vy = fr.vy;
      vf = fr.vf || 1;
    }
    if ((fr && fr.vx != null) || (!fr && valera.room === view.room)) {
      actors.push({ kind: "v", x: vx, y: vy, f: vf });
    }
    actors.push({ kind: "g", x: view.x, y: view.y, f: view.facing });
    actors.sort(function (a, b) {
      return a.y - b.y;
    });
    actors.forEach(function (a) {
      if (a.kind === "v") drawValeraNpc(a.x * TS - ox, a.y * TS - oy, a.f, valera.sayT > 0);
      else drawGuest(a.x * TS - ox, a.y * TS - oy, a.f);
    });

    // film frame when recording / replay
    if (state.recording || replay) {
      ctx.strokeStyle = replay ? "#4ade80" : "#ef4444";
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, W - 20, H - 20);
      ctx.fillStyle = replay ? "#4ade80" : "#ef4444";
      ctx.font = "900 14px system-ui";
      ctx.fillText(replay ? "ПРОСМОТР" : "REC", 20, 36);
    }

    // room caption
    ctx.fillStyle = "rgba(15,23,42,0.75)";
    ctx.fillRect(W / 2 - 90, 12, 180, 28);
    ctx.fillStyle = "#fde68a";
    ctx.font = "900 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(R.name, W / 2, 32);
    ctx.textAlign = "left";
  }

  function mix(hex, to, a) {
    return hex;
  }

  // polyfill roundRect
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    };
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    animT += dt;
    update(dt);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.style.display = "none";
    }
    if (titleT > 0) {
      titleT -= dt;
      if (titleT <= 0) titleEl.style.display = "none";
    }
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("pointerdown", function (e) {
    if (replay) return;
    var r = canvas.getBoundingClientRect();
    var c = cam();
    var mx = ((e.clientX - r.left) * canvas.width) / r.width + c.x;
    var my = ((e.clientY - r.top) * canvas.height) / r.height + c.y;
    var tx = mx / TS;
    var ty = my / TS;
    var hit = null;
    itemsHere().forEach(function (it) {
      if (Math.hypot(it.x + 0.5 - tx, it.y + 0.5 - ty) < 1.1) hit = it;
    });
    if (valera.room === state.room && Math.hypot(valera.x + 0.3 - tx, valera.y + 0.3 - ty) < 1.2) {
      talkValera();
      return;
    }
    if (hit) {
      state.x = hit.x;
      state.y = Math.min(room().h - 2, hit.y + 1);
      interact();
    }
  });

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "KeyE" || e.code === "Space") {
      e.preventDefault();
      interact();
    }
    if (e.code === "KeyQ") dropHeld();
    if (e.code === "KeyC") toggleCam();
    if (e.code === "KeyV") openClips();
    if (e.code === "KeyF") openLab();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

  document.getElementById("btn-cam").onclick = toggleCam;
  document.getElementById("btn-clips").onclick = openClips;
  document.getElementById("btn-lab").onclick = openLab;
  document.getElementById("btn-use").onclick = interact;

  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickOn = false;
  function setStick(cx, cy) {
    var r = pad.getBoundingClientRect();
    stickX = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width / 2)));
    stickY = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height / 2)));
    knob.style.transform = "translate(" + stickX * 28 + "px," + stickY * 28 + "px)";
  }
  pad.addEventListener("pointerdown", function (e) {
    stickOn = true;
    pad.setPointerCapture(e.pointerId);
    setStick(e.clientX, e.clientY);
  });
  pad.addEventListener("pointermove", function (e) {
    if (stickOn) setStick(e.clientX, e.clientY);
  });
  function endStick() {
    stickOn = false;
    stickX = stickY = 0;
    knob.style.transform = "translate(0,0)";
  }
  pad.addEventListener("pointerup", endStick);
  pad.addEventListener("pointercancel", endStick);

  var sprNames = {};
  ITEMS.forEach(function (it) {
    if (it.spr) sprNames[it.spr] = 1;
  });
  Promise.all(
    Object.keys(sprNames).map(function (n) {
      return load(ASSET + n + ".png").then(function (im) {
        imgs[n] = im;
      });
    })
  ).then(function () {
    if (state.held) {
      var h = null;
      for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === state.held) h = ITEMS[i];
      invEl.textContent = "в руках: " + (h ? h.title : state.held);
    }
    showTitle("Дом Валеры · ты гость", 2.5);
    toast("Мебель нормальная · подойди к жёлтому Валере (E)");
    requestAnimationFrame(frame);
  });
})();
