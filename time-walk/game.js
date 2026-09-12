/**
 * Время и место — механика «как в Braid, мир 4»:
 * горизонтальный шаг двигает время мира.
 * Своя живописная графика (не Kenney). Уровни колонкой в хабе.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var W = 960;
  var H = 540;
  var G = 2100;
  var JUMP = 740;
  var SPEED = 240;
  var TIME_PER_PX = 0.012; // время мира от смещения по X
  var SAVE = "amal-time-place-v3";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var hub = document.getElementById("hub");
  var levelsEl = document.getElementById("levels");
  var toastEl = document.getElementById("toast");
  var hintEl = document.getElementById("hint");
  var lvlName = document.getElementById("lvlName");
  var timeLabel = document.getElementById("timeLabel");
  var toastT = 0;
  var hintT = 0;

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2.2 : t;
  }
  function hint(m, t) {
    hintEl.textContent = m;
    hintEl.style.display = "block";
    hintT = t == null ? 4 : t;
  }

  var state = { unlocked: 1, best: 0 };
  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      state.unlocked = Math.max(1, d.unlocked || 1);
      state.best = d.best || 0;
    }
  } catch (_) {}
  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify(state));
    } catch (_) {}
  }

  var LEVELS = [
    {
      id: 0,
      name: "1 · Яма-урок",
      tip: "Иди ВПРАВО — монстр идёт. Иди ВЛЕВО — монстр идёт назад.",
      w: 28,
      platforms: [
        [0, 9, 28],
        [6, 7, 4],
        [14, 6, 4],
      ],
      monsters: [{ x0: 10, y: 8, amp: 3, period: 4 }],
      key: null,
      door: null,
      exit: [25, 8],
      spawn: [2, 8],
    },
    {
      id: 1,
      name: "2 · Ключ во времени",
      tip: "Дождись, пока монстр возьмёт ключ справа — потом вернись и забери.",
      w: 30,
      platforms: [
        [0, 9, 30],
        [8, 7, 5],
        [18, 7, 5],
      ],
      monsters: [{ x0: 12, y: 8, amp: 5, period: 5 }],
      key: { x: 22, y: 8 },
      door: { x: 5, y: 8 },
      exit: [27, 8],
      spawn: [2, 8],
    },
    {
      id: 2,
      name: "3 · Два монстра",
      tip: "Оба живут во времени. Прыгай, когда они в нужном месте.",
      w: 32,
      platforms: [
        [0, 9, 32],
        [7, 7, 3],
        [14, 6, 4],
        [22, 7, 3],
      ],
      monsters: [
        { x0: 9, y: 8, amp: 2.5, period: 3.5 },
        { x0: 20, y: 8, amp: 3, period: 4.2 },
      ],
      key: null,
      door: null,
      exit: [29, 8],
      spawn: [2, 8],
    },
    {
      id: 3,
      name: "4 · Башня",
      tip: "Вверх не крутит время — только влево/вправо.",
      w: 26,
      platforms: [
        [0, 9, 26],
        [4, 7, 4],
        [10, 5, 4],
        [16, 3, 4],
        [20, 6, 4],
      ],
      monsters: [
        { x0: 11, y: 4, amp: 2, period: 3 },
        { x0: 17, y: 8, amp: 3, period: 4 },
      ],
      key: { x: 17, y: 2 },
      door: { x: 21, y: 5 },
      exit: [23, 5],
      spawn: [2, 8],
    },
    {
      id: 4,
      name: "5 · Финал",
      tip: "Собери ключ, открой дверь, дойди до выхода — не спеша.",
      w: 34,
      platforms: [
        [0, 9, 34],
        [6, 7, 3],
        [12, 5, 5],
        [20, 7, 4],
        [26, 5, 4],
      ],
      monsters: [
        { x0: 8, y: 8, amp: 2, period: 3 },
        { x0: 14, y: 4, amp: 2.5, period: 3.8 },
        { x0: 22, y: 8, amp: 3, period: 4.5 },
      ],
      key: { x: 28, y: 4 },
      door: { x: 4, y: 8 },
      exit: [31, 8],
      spawn: [2, 8],
    },
  ];

  var TS = 48; // tile size
  var playing = false;
  var levelI = 0;
  var world = null;
  var keys = Object.create(null);
  var stickX = 0;
  var jumpQ = false;
  var camX = 0;

  function monX(m, t) {
    return (m.x0 + Math.sin(t * ((Math.PI * 2) / m.period)) * m.amp) * TS;
  }
  function monY(m) {
    return m.y * TS;
  }

  function build(i) {
    var L = LEVELS[i];
    levelI = i;
    var p = {
      x: L.spawn[0] * TS,
      y: L.spawn[1] * TS,
      w: 28,
      h: 44,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      lastX: L.spawn[0] * TS,
      originX: L.spawn[0] * TS,
      hasKey: false,
      doorOpen: false,
      hurtT: 0,
    };
    world = {
      L: L,
      p: p,
      time: 0,
      solids: [],
      won: false,
    };
    for (var pi = 0; pi < L.platforms.length; pi++) {
      var pl = L.platforms[pi];
      world.solids.push({
        x: pl[0] * TS,
        y: pl[1] * TS,
        w: pl[2] * TS,
        h: TS,
      });
    }
    camX = 0;
    lvlName.textContent = L.name;
    timeLabel.textContent = "время замерло";
    hint(L.tip, 5);
    toast(L.name, 1.5);
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function resolve(p, s, axis) {
    if (!aabb(p, s)) return;
    if (axis === "x") {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;
    } else {
      if (p.vy > 0) {
        p.y = s.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else if (p.vy < 0) {
        p.y = s.y + s.h;
        p.vy = 0;
      }
    }
  }

  function openHub() {
    playing = false;
    hub.classList.remove("hide");
    levelsEl.innerHTML = "";
    for (var i = 0; i < LEVELS.length; i++) {
      var b = document.createElement("button");
      var unlocked = i < state.unlocked;
      b.className = unlocked ? "" : "locked";
      b.innerHTML = '<span class="n">' + (i + 1) + "</span><span>" + LEVELS[i].name.replace(/^\d+\s·\s/, "") + (unlocked ? "" : " 🔒") + "</span>";
      (function (idx, ok) {
        b.onclick = function () {
          if (!ok) return;
          hub.classList.add("hide");
          build(idx);
          playing = true;
        };
      })(i, unlocked);
      levelsEl.appendChild(b);
    }
  }

  function update(dt) {
    if (!playing || !world || world.won) return;
    var p = world.p;
    var L = world.L;

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

    p.vy += G * dt;
    if (p.vy > 1300) p.vy = 1300;
    p.onGround = false;
    p.x += p.vx * dt;
    for (var i = 0; i < world.solids.length; i++) resolve(p, world.solids[i], "x");
    p.y += p.vy * dt;
    for (var j = 0; j < world.solids.length; j++) resolve(p, world.solids[j], "y");

    // ВРЕМЯ = от горизонтального смещения (как Braid мир 4)
    var dx = p.x - p.lastX;
    world.time = Math.max(0, world.time + dx * TIME_PER_PX);
    p.lastX = p.x;

    if (Math.abs(dx) < 0.2) {
      timeLabel.textContent = "⏸ время замерло";
      timeLabel.style.color = "#9ec5ff";
    } else if (dx > 0) {
      timeLabel.textContent = "▶ мир идёт вперёд";
      timeLabel.style.color = "#86efac";
    } else {
      timeLabel.textContent = "◀ мир идёт назад";
      timeLabel.style.color = "#f9a8d4";
    }

    if (p.hurtT > 0) p.hurtT -= dt;

    // ключ
    if (L.key && !p.hasKey) {
      var k = { x: L.key.x * TS, y: L.key.y * TS, w: 28, h: 28 };
      // ключ может нести монстр 0
      if (L.monsters[0]) {
        var mx = monX(L.monsters[0], world.time);
        var my = monY(L.monsters[0]);
        if (mx > L.key.x * TS - 20) {
          k.x = mx + 8;
          k.y = my - 10;
        }
      }
      if (aabb(p, k)) {
        p.hasKey = true;
        toast("Ключ!", 1);
      }
      world._keyDraw = k;
    } else world._keyDraw = null;

    // дверь
    if (L.door && p.hasKey && !p.doorOpen) {
      var door = { x: L.door.x * TS, y: L.door.y * TS - 20, w: 36, h: 64 };
      if (aabb(p, door)) {
        p.doorOpen = true;
        toast("Дверь открыта", 1);
      }
    }

    // монстры
    if (p.hurtT <= 0) {
      for (var m = 0; m < L.monsters.length; m++) {
        var mon = L.monsters[m];
        var box = { x: monX(mon, world.time), y: monY(mon), w: 36, h: 36 };
        if (aabb(p, box)) {
          // прыжок сверху — «убить» только если идём вправо (время вперёд)
          if (p.vy > 0 && p.y + p.h - 12 < box.y + 10) {
            p.vy = -500;
            // визуально ок, но в braid kill is position-tied; keep simple bounce
          } else {
            p.hurtT = 0.8;
            p.vy = -360;
            p.x = Math.max(p.originX, p.x - 40);
            p.lastX = p.x;
            toast("Ай! Отойди влево — время откатится", 1.6);
          }
        }
      }
    }

    // выход
    var ex = { x: L.exit[0] * TS, y: L.exit[1] * TS - 10, w: 40, h: 56 };
    if (L.door && !p.doorOpen) {
      /* blocked until door */
    } else if (aabb(p, ex)) {
      world.won = true;
      if (levelI + 1 >= state.unlocked) state.unlocked = Math.min(LEVELS.length, levelI + 2);
      save();
      toast("Уровень пройден!", 1.4);
      setTimeout(function () {
        if (levelI >= LEVELS.length - 1) {
          toast("Все уровни! Ты понял время.", 3);
          openHub();
        } else {
          build(levelI + 1);
        }
      }, 1000);
    }

    if (p.y > 12 * TS) {
      p.x = L.spawn[0] * TS;
      p.y = L.spawn[1] * TS;
      p.vx = p.vy = 0;
      p.lastX = p.x;
      toast("Упал — снова у старта", 1.2);
    }

    var mapW = L.w * TS;
    camX += (p.x - W * 0.38 - camX) * Math.min(1, dt * 5);
    camX = Math.max(0, Math.min(Math.max(0, mapW - W), camX));
  }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a2744");
    g.addColorStop(0.55, "#3d5a80");
    g.addColorStop(1, "#c4a574");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // облака-силуэты (2.5D)
    ctx.fillStyle = "rgba(241,233,210,0.12)";
    for (var i = 0; i < 5; i++) {
      var cx = ((i * 220 - camX * 0.2) % (W + 200)) - 100;
      ctx.beginPath();
      ctx.ellipse(cx, 70 + i * 18, 70, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 40, 70 + i * 18, 50, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPerson(x, y, facing, hurt) {
    ctx.save();
    ctx.translate(x + 14, y + 44);
    if (facing < 0) ctx.scale(-1, 1);
    // живописный силуэт (не Kenney)
    ctx.fillStyle = hurt ? "#fca5a5" : "#2b2118";
    ctx.beginPath();
    ctx.ellipse(0, -30, 11, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hurt ? "#fecaca" : "#c4a574";
    ctx.beginPath();
    ctx.ellipse(0, -30, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d4f73";
    ctx.fillRect(-8, -18, 16, 22);
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(-7, 4, 6, 14);
    ctx.fillRect(1, 4, 6, 14);
    ctx.fillStyle = "#0c1222";
    ctx.beginPath();
    ctx.arc(3, -32, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMonster(x, y) {
    ctx.save();
    ctx.translate(x + 18, y + 36);
    ctx.fillStyle = "#5b2c6f";
    ctx.beginPath();
    ctx.ellipse(0, -10, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5e6c8";
    ctx.beginPath();
    ctx.arc(-5, -14, 3, 0, Math.PI * 2);
    ctx.arc(5, -14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0c1222";
    ctx.beginPath();
    ctx.arc(-5, -14, 1.4, 0, Math.PI * 2);
    ctx.arc(5, -14, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    drawSky();
    if (!world) return;
    var L = world.L;
    var p = world.p;
    ctx.save();
    ctx.translate(-camX, 0);

    // дальние колонны (глубина)
    ctx.globalAlpha = 0.2;
    for (var col = 0; col < L.w; col += 4) {
      ctx.fillStyle = "#1a2030";
      ctx.fillRect(col * TS + 10, 40, 28, H);
    }
    ctx.globalAlpha = 1;

    // платформы — «масло»
    for (var i = 0; i < world.solids.length; i++) {
      var s = world.solids[i];
      var pg = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
      pg.addColorStop(0, "#6b8f71");
      pg.addColorStop(1, "#3d5c45");
      ctx.fillStyle = pg;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = "rgba(245,230,200,0.25)";
      ctx.fillRect(s.x, s.y, s.w, 6);
    }

    // дверь
    if (L.door) {
      ctx.fillStyle = p.doorOpen ? "rgba(196,165,116,0.25)" : "#5c4033";
      ctx.fillRect(L.door.x * TS, L.door.y * TS - 20, 36, 64);
      if (!p.doorOpen) {
        ctx.fillStyle = "#c4a574";
        ctx.font = "900 12px Georgia";
        ctx.fillText("дверь", L.door.x * TS - 2, L.door.y * TS - 26);
      }
    }

    // ключ
    if (world._keyDraw && !p.hasKey) {
      var k = world._keyDraw;
      ctx.fillStyle = "#f5d76e";
      ctx.beginPath();
      ctx.arc(k.x + 10, k.y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(k.x + 10, k.y + 8, 16, 4);
    } else if (p.hasKey) {
      ctx.fillStyle = "#f5d76e";
      ctx.font = "900 14px Georgia";
      ctx.fillText("🔑", p.x, p.y - 8);
    }

    // монстры во времени
    for (var m = 0; m < L.monsters.length; m++) {
      var mon = L.monsters[m];
      drawMonster(monX(mon, world.time), monY(mon));
    }

    // выход — колонна/арка
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(L.exit[0] * TS, L.exit[1] * TS - 40, 10, 80);
    ctx.fillRect(L.exit[0] * TS + 30, L.exit[1] * TS - 40, 10, 80);
    ctx.fillRect(L.exit[0] * TS, L.exit[1] * TS - 48, 40, 10);
    ctx.fillStyle = "rgba(158,197,255,0.35)";
    ctx.fillRect(L.exit[0] * TS + 10, L.exit[1] * TS - 40, 20, 70);
    ctx.fillStyle = "#f5e6c8";
    ctx.font = "italic 700 13px Georgia";
    ctx.fillText("выход", L.exit[0] * TS - 2, L.exit[1] * TS - 54);

    drawPerson(p.x, p.y, p.facing, p.hurtT > 0);

    ctx.restore();

    // рамка картины
    ctx.strokeStyle = "rgba(196,165,116,0.35)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);
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
    if (playing) draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      jumpQ = true;
    }
    if (e.code === "KeyR" && playing) build(levelI);
    if (e.code === "Escape") openHub();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });
  document.getElementById("btn-hub").onclick = openHub;
  document.getElementById("btn-jump").onpointerdown = function (e) {
    e.preventDefault();
    jumpQ = true;
  };

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

  openHub();
  requestAnimationFrame(frame);
})();
