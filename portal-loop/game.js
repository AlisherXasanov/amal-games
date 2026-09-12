/**
 * Портал-петля — 2D в духе Portal / Portal 2 (Xbox):
 * синий + оранжевый портал, вход в один = выход из другого.
 * Коробки (Portal Push), логика уровней. Своя стилистика.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var W = 960;
  var H = 540;
  var TS = 40;
  var G = 2200;
  var JUMP = 720;
  var SPEED = 250;
  var SAVE = "amal-portal-loop-v1";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var toastEl = document.getElementById("toast");
  var hintEl = document.getElementById("hint");
  var lvlEl = document.getElementById("lvl");
  var gunEl = document.getElementById("gun");
  var toastT = 0;
  var hintT = 0;

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2 : t;
  }
  function hint(m, t) {
    hintEl.textContent = m;
    hintEl.style.display = "block";
    hintT = t == null ? 4 : t;
  }

  var level = 0;
  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d && d.level != null) level = Math.min(7, d.level | 0);
  } catch (_) {}
  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({ level: level }));
    } catch (_) {}
  }

  /* # стена  . пусто  P игрок  B коробка  E выход  ^ пол */
  var LEVELS = [
    {
      tip: "ЛКМ — синий портал на стену. Клавиша 2 + ЛКМ — оранжевый. Зайди в один.",
      map: [
        "########################",
        "#......................#",
        "#......................#",
        "#......................#",
        "#..P..............E....#",
        "#^^^^^^^^^^^^^^^^^^^^^^#",
        "########################",
      ],
    },
    {
      tip: "Портал на потолок и пол — петля. Доберись до выхода справа вверху.",
      map: [
        "########################",
        "#.................E....#",
        "#......................#",
        "#..........####........#",
        "#..P...................#",
        "#^^^^^^^^^^^^^^^^^^^^^^#",
        "########################",
      ],
    },
    {
      tip: "Portal Push: толкай коробку B на кнопку (квадрат), откроется выход.",
      map: [
        "########################",
        "#......................#",
        "#......................#",
        "#......B.........K.....#",
        "#..P..............E....#",
        "#^^^^^^^^^^^^^^^^^^^^^^#",
        "########################",
      ],
      needBtn: true,
    },
    {
      tip: "Коробка высоко. Порталы + прыжок помогут.",
      map: [
        "########################",
        "#......B..........E....#",
        "#.....####.............#",
        "#.................K....#",
        "#..P...................#",
        "#^^^^^^^^^^^^^^^^^^^^^^#",
        "########################",
      ],
      needBtn: true,
    },
    {
      tip: "Две комнаты. Портал сквозь стену — единственный путь.",
      map: [
        "########################",
        "#..........##.....E....#",
        "#..........##..........#",
        "#..........##..........#",
        "#..P.......##..........#",
        "#^^^^^^^^^^##^^^^^^^^^^#",
        "########################",
      ],
    },
    {
      tip: "Коробка в другой комнате. Принеси на кнопку.",
      map: [
        "########################",
        "#.....B....##.....E....#",
        "#..........##..........#",
        "#..........##.....K....#",
        "#..P.......##..........#",
        "#^^^^^^^^^^##^^^^^^^^^^#",
        "########################",
      ],
      needBtn: true,
    },
    {
      tip: "Три этажа. Строй портальную петлю вверх.",
      map: [
        "########################",
        "#.................E....#",
        "#.....##########.......#",
        "#......................#",
        "#.....##########.......#",
        "#..P...................#",
        "#^^^^^^^^^^^^^^^^^^^^^^#",
        "########################",
      ],
    },
    {
      tip: "Финал: коробка + порталы + кнопка.",
      map: [
        "########################",
        "#..B..............E....#",
        "#.####....####.........#",
        "#.................K....#",
        "#.####....####.........#",
        "#..P...................#",
        "#^^^^^^^^^^^^^^^^^^^^^^#",
        "########################",
      ],
      needBtn: true,
    },
  ];

  var keys = Object.create(null);
  var stickX = 0;
  var jumpQ = false;
  var gun = "blue"; // blue | orange
  var camX = 0;
  var world = null;
  var mouse = { x: 0, y: 0, down: false };
  var portalCd = 0;

  function setGun(c) {
    gun = c;
    gunEl.textContent = c === "blue" ? "пушка: СИНИЙ" : "пушка: ОРАНЖ";
    gunEl.className = c;
  }

  function build(i) {
    var L = LEVELS[i];
    level = i;
    lvlEl.textContent = String(i + 1);
    var map = L.map;
    var rows = map.length;
    var cols = map[0].length;
    var solids = [];
    var boxes = [];
    var player = null;
    var exit = null;
    var btn = null;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var ch = map[y][x];
        var px = x * TS;
        var py = y * TS;
        if (ch === "#" || ch === "^") {
          solids.push({ x: px, y: py, w: TS, h: TS, wall: ch === "#", floor: ch === "^" });
        } else if (ch === "P") {
          player = { x: px + 6, y: py, w: 28, h: 36, vx: 0, vy: 0, onGround: false, facing: 1, tpCd: 0 };
        } else if (ch === "B") {
          boxes.push({ x: px + 4, y: py, w: 32, h: 32, vx: 0, vy: 0 });
        } else if (ch === "E") {
          exit = { x: px, y: py - 8, w: 36, h: 48 };
        } else if (ch === "K") {
          btn = { x: px + 4, y: py + 28, w: 32, h: 12, on: false };
        }
      }
    }
    if (!player) player = { x: TS * 2, y: TS * 3, w: 28, h: 36, vx: 0, vy: 0, onGround: false, facing: 1, tpCd: 0 };

    world = {
      L: L,
      cols: cols,
      rows: rows,
      solids: solids,
      boxes: boxes,
      p: player,
      exit: exit,
      btn: btn,
      blue: null,
      orange: null,
      won: false,
      open: !L.needBtn,
    };
    camX = 0;
    hint(L.tip, 5);
    toast("Уровень " + (i + 1), 1.2);
    save();
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function resolve(ent, s, axis) {
    if (!aabb(ent, s)) return;
    if (axis === "x") {
      if (ent.vx > 0) ent.x = s.x - ent.w;
      else if (ent.vx < 0) ent.x = s.x + s.w;
      ent.vx = 0;
    } else {
      if (ent.vy > 0) {
        ent.y = s.y - ent.h;
        ent.vy = 0;
        ent.onGround = true;
      } else if (ent.vy < 0) {
        ent.y = s.y + s.h;
        ent.vy = 0;
      }
    }
  }

  function worldMouse() {
    var r = canvas.getBoundingClientRect();
    var sx = canvas.width / r.width;
    var sy = canvas.height / r.height;
    return {
      x: (mouse.x - r.left) * sx + camX,
      y: (mouse.y - r.top) * sy,
    };
  }

  function tryPlacePortal() {
    if (!world || world.won || portalCd > 0) return;
    var m = worldMouse();
    var hit = null;
    var best = 1e9;
    for (var i = 0; i < world.solids.length; i++) {
      var s = world.solids[i];
      if (!s.wall) continue;
      // ближайшая грань
      var cx = Math.max(s.x, Math.min(m.x, s.x + s.w));
      var cy = Math.max(s.y, Math.min(m.y, s.y + s.h));
      var d = Math.hypot(m.x - cx, m.y - cy);
      if (d < 28 && d < best) {
        best = d;
        // нормаль наружу от центра игрока
        var px = world.p.x + world.p.w / 2;
        var py = world.p.y + world.p.h / 2;
        var nx = 0;
        var ny = 0;
        var dx = px - (s.x + s.w / 2);
        var dy = py - (s.y + s.h / 2);
        if (Math.abs(dx) > Math.abs(dy)) nx = dx > 0 ? 1 : -1;
        else ny = dy > 0 ? 1 : -1;
        // портал на поверхности, обращённой к игроку
        var ox = nx > 0 ? s.x + s.w : nx < 0 ? s.x - 8 : s.x + s.w / 2 - 16;
        var oy = ny > 0 ? s.y + s.h : ny < 0 ? s.y - 8 : s.y + s.h / 2 - 20;
        if (nx !== 0) {
          ox = nx > 0 ? s.x + s.w : s.x - 10;
          oy = s.y + 4;
        } else {
          oy = ny > 0 ? s.y + s.h : s.y - 10;
          ox = s.x + 4;
        }
        hit = {
          x: ox,
          y: oy,
          w: nx !== 0 ? 10 : TS - 8,
          h: nx !== 0 ? TS - 8 : 10,
          nx: nx,
          ny: ny,
        };
      }
    }
    if (!hit) {
      toast("Целься в стену #", 1);
      return;
    }
    if (gun === "blue") world.blue = hit;
    else world.orange = hit;
    portalCd = 0.15;
    toast(gun === "blue" ? "Синий портал" : "Оранжевый портал", 0.7);
  }

  function portalCenter(pr) {
    return { x: pr.x + pr.w / 2, y: pr.y + pr.h / 2 };
  }

  function tryTeleport(ent) {
    if (!world.blue || !world.orange || ent.tpCd > 0) return;
    var pads = [
      { a: world.blue, b: world.orange },
      { a: world.orange, b: world.blue },
    ];
    for (var i = 0; i < 2; i++) {
      var a = pads[i].a;
      var b = pads[i].b;
      var zone = { x: a.x - 4, y: a.y - 4, w: a.w + 8, h: a.h + 8 };
      if (aabb(ent, zone)) {
        var out = portalCenter(b);
        ent.x = out.x - ent.w / 2 + b.nx * 22;
        ent.y = out.y - ent.h / 2 + b.ny * 22;
        // скорость через портал
        var spd = Math.hypot(ent.vx, ent.vy) || 280;
        if (b.nx || b.ny) {
          ent.vx = b.nx * spd;
          ent.vy = b.ny * spd;
        }
        ent.tpCd = 0.35;
        return;
      }
    }
  }

  function update(dt) {
    if (!world || world.won) return;
    if (portalCd > 0) portalCd -= dt;
    var p = world.p;
    if (p.tpCd > 0) p.tpCd -= dt;

    var ix = 0;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1;
    if (Math.abs(stickX) > 0.2) ix = stickX > 0 ? 1 : -1;
    p.vx = ix * SPEED;
    if (ix) p.facing = ix;
    if (jumpQ && p.onGround) {
      p.vy = -JUMP;
      p.onGround = false;
    }
    jumpQ = false;

    function moveEnt(ent, isBox) {
      ent.vy += G * dt;
      if (ent.vy > 1400) ent.vy = 1400;
      ent.onGround = false;
      ent.x += ent.vx * dt;
      for (var i = 0; i < world.solids.length; i++) resolve(ent, world.solids[i], "x");
      if (isBox) {
        // толкание игроком
        if (aabb(p, ent)) {
          if (p.x < ent.x) ent.x = p.x + p.w;
          else ent.x = p.x - ent.w;
        }
      }
      ent.y += ent.vy * dt;
      for (var j = 0; j < world.solids.length; j++) resolve(ent, world.solids[j], "y");
      tryTeleport(ent);
    }

    moveEnt(p, false);
    for (var b = 0; b < world.boxes.length; b++) {
      var box = world.boxes[b];
      if (box.tpCd > 0) box.tpCd -= dt;
      else box.tpCd = 0;
      // лёгкое трение
      box.vx *= 0.85;
      // игрок толкает
      if (aabb(p, box) && Math.abs(p.vx) > 10) {
        box.vx = p.vx * 0.9;
      }
      moveEnt(box, true);
    }

    // кнопка
    if (world.btn) {
      world.btn.on = false;
      for (var k = 0; k < world.boxes.length; k++) {
        if (aabb(world.boxes[k], world.btn)) world.btn.on = true;
      }
      if (aabb(p, world.btn)) world.btn.on = true;
      world.open = world.btn.on || !world.L.needBtn;
    }

    if (world.exit && world.open && aabb(p, world.exit)) {
      world.won = true;
      toast("Камера пройдена!", 1.2);
      setTimeout(function () {
        if (level >= LEVELS.length - 1) {
          level = 0;
          toast("Все 8 камер! Как мини-Portal 🌀", 3);
        } else level++;
        save();
        build(level);
      }, 900);
    }

    if (p.y > world.rows * TS + 80) {
      build(level);
      toast("Рестарт камеры", 1);
    }

    var mapW = world.cols * TS;
    camX += (p.x - W * 0.4 - camX) * Math.min(1, dt * 6);
    camX = Math.max(0, Math.min(Math.max(0, mapW - W), camX));
  }

  function drawPortal(pr, color) {
    if (!pr) return;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = color;
    ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(pr.x, pr.y, pr.w, pr.h);
    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, W, H);
    // сетка лаборатории
    ctx.strokeStyle = "rgba(56,189,248,0.06)";
    for (var gx = 0; gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }

    if (!world) return;
    ctx.save();
    ctx.translate(-camX, 0);

    for (var i = 0; i < world.solids.length; i++) {
      var s = world.solids[i];
      if (s.floor) {
        ctx.fillStyle = "#334155";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(s.x, s.y, s.w, 4);
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
      }
    }

    drawPortal(world.blue, "#38bdf8");
    drawPortal(world.orange, "#fb923c");

    if (world.btn) {
      ctx.fillStyle = world.btn.on ? "#4ade80" : "#f87171";
      ctx.fillRect(world.btn.x, world.btn.y, world.btn.w, world.btn.h);
      ctx.fillStyle = "#fff";
      ctx.font = "800 10px system-ui";
      ctx.fillText("кнопка", world.btn.x - 4, world.btn.y - 4);
    }

    for (var b = 0; b < world.boxes.length; b++) {
      var box = world.boxes[b];
      ctx.fillStyle = "#a3e635";
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = "#365314";
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = "#14532d";
      ctx.font = "900 11px system-ui";
      ctx.fillText("BOX", box.x + 4, box.y + 20);
    }

    if (world.exit) {
      ctx.fillStyle = world.open ? "#22d3ee" : "#475569";
      ctx.fillRect(world.exit.x, world.exit.y, world.exit.w, world.exit.h);
      ctx.fillStyle = "#ecfeff";
      ctx.font = "900 11px system-ui";
      ctx.fillText(world.open ? "ВЫХОД" : "ЗАКР", world.exit.x, world.exit.y - 6);
    }

    // игрок — «голова» + тело (стилистика петли)
    var p = world.p;
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(p.x + 14, p.y + 10, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(p.x + 4, p.y + 18, 20, 18);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(p.x + 10, p.y + 8, 3, 3);
    ctx.fillRect(p.x + 16, p.y + 8, 3, 3);

    // прицел
    var m = worldMouse();
    ctx.strokeStyle = gun === "blue" ? "#38bdf8" : "#fb923c";
    ctx.beginPath();
    ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.style.display = "none";
    }
    if (hintT > 0) {
      hintT -= dt;
      if (hintT <= 0) hintEl.style.display = "none";
    }
    draw();
    requestAnimationFrame(frame);
  }

  canvas.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  canvas.addEventListener("mousedown", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (e.button === 0) tryPlacePortal();
    if (e.button === 2) {
      setGun(gun === "blue" ? "orange" : "blue");
      tryPlacePortal();
    }
  });
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      jumpQ = true;
    }
    if (e.code === "Digit1" || e.code === "KeyZ") setGun("blue");
    if (e.code === "Digit2" || e.code === "KeyX") setGun("orange");
    if (e.code === "KeyR") build(level);
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

  document.getElementById("btn-blue").onclick = function () {
    setGun("blue");
  };
  document.getElementById("btn-orange").onclick = function () {
    setGun("orange");
  };
  document.getElementById("btn-jump").onpointerdown = function (e) {
    e.preventDefault();
    jumpQ = true;
  };
  document.getElementById("btn-reset").onclick = function () {
    build(level);
  };

  // тап = портал на мобилке (центр экрана → луч к стику нет, тап по canvas)
  canvas.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch") {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      tryPlacePortal();
    }
  });

  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickOn = false;
  function setStick(cx, cy) {
    var r = pad.getBoundingClientRect();
    var dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
    var len = Math.hypot(dx, (cy - (r.top + r.height / 2)) / (r.height / 2)) || 1;
    if (len > 1) dx /= len;
    stickX = dx;
    knob.style.transform = "translate(" + dx * 28 + "px,0)";
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
    stickX = 0;
    knob.style.transform = "translate(0,0)";
  }
  pad.addEventListener("pointerup", endStick);
  pad.addEventListener("pointercancel", endStick);

  setGun("blue");
  build(level);
  requestAnimationFrame(frame);
})();
