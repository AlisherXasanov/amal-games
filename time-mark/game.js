/**
 * Метка времени — НОВАЯ игра.
 * Ходишь как обычно. E — ставишь метку «здесь и сейчас».
 * Q — телепортируешься в то время (и в то место), где стояла метка:
 * мир откатывается к моменту метки, ты оказываешься там.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var W = 960;
  var H = 540;
  var TS = 48;
  var G = 2100;
  var JUMP = 750;
  var SPEED = 255;
  var SAVE = "amal-time-mark-v1";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var toastEl = document.getElementById("toast");
  var hintEl = document.getElementById("hint");
  var lvlEl = document.getElementById("lvl");
  var markState = document.getElementById("markState");
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
    if (d && d.level != null) level = Math.min(5, d.level | 0);
  } catch (_) {}
  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({ level: level }));
    } catch (_) {}
  }

  /**
   * Объекты мира живут по времени t (секунды).
   * Дверь открыта только в окне времени, платформа ездит, ключ падает и т.д.
   */
  var LEVELS = [
    {
      name: "Урок метки",
      tip: "Поставь метку E у старта. Иди вправо, возьми монету. Q — вернись в то же время и место.",
      w: 22,
      groundY: 9,
      plats: [[8, 7, 4]],
      coin: [18, 8],
      door: null,
      moving: null,
      exit: [20, 8],
      needCoin: true,
    },
    {
      name: "Дверь на время",
      tip: "Дверь открыта только коротко. Открой путь, поставь метку ЗА дверью, вернись Q.",
      w: 24,
      groundY: 9,
      plats: [[4, 7, 3], [14, 7, 3]],
      coin: null,
      door: { x: 10, openFrom: 1.2, openTo: 2.8 },
      moving: null,
      exit: [21, 8],
      needCoin: false,
      needDoorPass: true,
    },
    {
      name: "Едущая полка",
      tip: "Платформа ездит во времени. Метка + телепорт — твой чит.",
      w: 26,
      groundY: 9,
      plats: [[2, 7, 3]],
      coin: [22, 5],
      door: null,
      moving: { x0: 8, x1: 18, y: 6, period: 4 },
      exit: [24, 8],
      needCoin: true,
    },
    {
      name: "Ключ падает",
      tip: "Ключ падает со временем. Поймай момент меткой.",
      w: 24,
      groundY: 9,
      plats: [[10, 5, 4], [16, 7, 3]],
      coin: null,
      door: { x: 6, needsKey: true, openFrom: 0, openTo: 99 },
      moving: null,
      keyDrop: { x: 12, y0: 2, fallAt: 1.5 },
      exit: [21, 8],
      needCoin: false,
      needKey: true,
    },
    {
      name: "Две метки ума",
      tip: "Монета высоко. Забери, телепортнись назад, иди к выходу.",
      w: 28,
      groundY: 9,
      plats: [[6, 7, 3], [12, 5, 3], [18, 3, 3]],
      coin: [19, 2],
      door: null,
      moving: { x0: 10, x1: 16, y: 7, period: 3.2 },
      exit: [25, 8],
      needCoin: true,
    },
    {
      name: "Финал",
      tip: "Дверь + полка + монета. Метка — твоё оружие.",
      w: 30,
      groundY: 9,
      plats: [[4, 7, 2], [20, 6, 3]],
      coin: [27, 5],
      door: { x: 12, openFrom: 2, openTo: 3.5 },
      moving: { x0: 14, x1: 22, y: 5, period: 3.5 },
      exit: [28, 8],
      needCoin: true,
      needDoorPass: true,
    },
  ];

  var keys = Object.create(null);
  var stickX = 0;
  var jumpQ = false;
  var markQ = false;
  var tpQ = false;
  var camX = 0;
  var world = null;

  function doorOpen(L, t) {
    if (!L.door) return true;
    if (L.door.needsKey) return !!(world && world.hasKey);
    return t >= L.door.openFrom && t <= L.door.openTo;
  }

  function movingPos(m, t) {
    if (!m) return null;
    var u = (Math.sin((t / m.period) * Math.PI * 2) + 1) / 2;
    return {
      x: (m.x0 + (m.x1 - m.x0) * u) * TS,
      y: m.y * TS,
      w: 3 * TS,
      h: 18,
    };
  }

  function keyPos(L, t) {
    if (!L.keyDrop) return null;
    var y = L.keyDrop.y0 * TS;
    if (t > L.keyDrop.fallAt) {
      y += (t - L.keyDrop.fallAt) * 220;
      var floor = (L.groundY - 1) * TS;
      if (y > floor) y = floor;
    }
    return { x: L.keyDrop.x * TS, y: y, w: 24, h: 24 };
  }

  function build(i) {
    var L = LEVELS[i];
    level = i;
    lvlEl.textContent = String(i + 1);
    world = {
      L: L,
      t: 0,
      mark: null,
      hasCoin: false,
      hasKey: false,
      passedDoor: false,
      won: false,
      p: {
        x: 2 * TS,
        y: (L.groundY - 1) * TS,
        w: 30,
        h: 44,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        hurtT: 0,
      },
      solids: [],
    };
    world.solids.push({ x: 0, y: L.groundY * TS, w: L.w * TS, h: TS * 2 });
    for (var p = 0; p < L.plats.length; p++) {
      var pl = L.plats[p];
      world.solids.push({ x: pl[0] * TS, y: pl[1] * TS, w: pl[2] * TS, h: 20 });
    }
    camX = 0;
    syncMarkHud();
    hint(L.tip, 5);
    toast(L.name, 1.6);
    save();
  }

  function syncMarkHud() {
    if (world && world.mark) {
      markState.textContent = "t=" + world.mark.t.toFixed(1) + "с · жми Q → в прошлое";
      markState.className = "ok";
    } else {
      markState.textContent = "нет (сначала E)";
      markState.className = "no";
    }
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

  function placeMark() {
    if (!world || world.won || world.rewinding) return;
    world.mark = {
      t: world.t,
      x: world.p.x,
      y: world.p.y,
      hasCoin: world.hasCoin,
      hasKey: world.hasKey,
      passedDoor: world.passedDoor,
    };
    syncMarkHud();
    toast("Метка в настоящем. Q — иди вперёд в прошлое к ней", 2);
  }

  /** Плавный путь «вперёд в прошлое» к метке */
  function startRewindToMark() {
    if (!world || world.won) return;
    if (!world.mark) {
      toast("Сначала метка (E)", 1.4);
      return;
    }
    if (world.rewinding) return;
    if (world.t <= world.mark.t + 0.05) {
      toast("Ты уже в прошлом метки", 1.2);
      world.p.x = world.mark.x;
      world.p.y = world.mark.y;
      return;
    }
    world.rewinding = {
      fromT: world.t,
      toT: world.mark.t,
      fromX: world.p.x,
      fromY: world.p.y,
      toX: world.mark.x,
      toY: world.mark.y,
      u: 0,
      dur: Math.min(2.2, 0.55 + (world.t - world.mark.t) * 0.35),
    };
    world.p.vx = 0;
    world.p.vy = 0;
    toast("→ в прошлое…", 1.2);
  }

  function update(dt) {
    if (!world || world.won) return;
    var L = world.L;
    var p = world.p;

    // Идём «вперёд» по шкале в прошлое к метке
    if (world.rewinding) {
      var rw = world.rewinding;
      rw.u += dt / rw.dur;
      if (rw.u >= 1) rw.u = 1;
      var ease = rw.u * rw.u * (3 - 2 * rw.u);
      world.t = rw.fromT + (rw.toT - rw.fromT) * ease;
      p.x = rw.fromX + (rw.toX - rw.fromX) * ease;
      p.y = rw.fromY + (rw.toY - rw.fromY) * ease;
      p.vx = p.vy = 0;
      p.facing = rw.toX >= rw.fromX ? 1 : -1;
      if (rw.u >= 1) {
        var m = world.mark;
        world.t = m.t;
        p.x = m.x;
        p.y = m.y;
        world.hasCoin = m.hasCoin;
        world.hasKey = m.hasKey;
        world.passedDoor = m.passedDoor;
        world.rewinding = null;
        toast("Ты в прошлом метки", 1.3);
      }
      camX += (p.x - W * 0.4 - camX) * Math.min(1, dt * 8);
      return;
    }

    world.t += dt;

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
    if (markQ) {
      placeMark();
      markQ = false;
    }
    if (tpQ) {
      startRewindToMark();
      tpQ = false;
    }

    p.vy += G * dt;
    if (p.vy > 1400) p.vy = 1400;
    p.onGround = false;

    // дверь как блок, если закрыта
    var solids = world.solids.slice();
    if (L.door && !doorOpen(L, world.t)) {
      solids.push({ x: L.door.x * TS, y: (L.groundY - 2) * TS, w: 28, h: TS * 2 });
    }
    var mov = movingPos(L.moving, world.t);
    if (mov) solids.push(mov);

    p.x += p.vx * dt;
    for (var i = 0; i < solids.length; i++) resolve(p, solids[i], "x");
    p.y += p.vy * dt;
    for (var j = 0; j < solids.length; j++) resolve(p, solids[j], "y");

    // монета
    if (L.coin && !world.hasCoin) {
      var c = { x: L.coin[0] * TS, y: L.coin[1] * TS, w: 28, h: 28 };
      if (aabb(p, c)) {
        world.hasCoin = true;
        toast("Монета!", 0.9);
      }
    }

    // ключ
    var kp = keyPos(L, world.t);
    if (kp && !world.hasKey && aabb(p, kp)) {
      world.hasKey = true;
      toast("Ключ!", 0.9);
    }

    // прошёл дверь пока открыта
    if (L.door && doorOpen(L, world.t) && p.x > L.door.x * TS + 20) {
      world.passedDoor = true;
    }

    // выход
    var ex = { x: L.exit[0] * TS, y: L.exit[1] * TS - 8, w: 36, h: 52 };
    if (aabb(p, ex)) {
      var ok = true;
      if (L.needCoin && !world.hasCoin) {
        ok = false;
        toast("Нужна монета!", 1);
        p.x -= 30;
      }
      if (L.needKey && !world.hasKey) {
        ok = false;
        toast("Нужен ключ!", 1);
        p.x -= 30;
      }
      if (L.needDoorPass && !world.passedDoor) {
        ok = false;
        toast("Сначала пройди дверь, пока открыта (метка поможет)", 2);
        p.x -= 30;
      }
      if (ok) {
        world.won = true;
        toast("Уровень пройден!", 1.2);
        setTimeout(function () {
          if (level >= LEVELS.length - 1) {
            level = 0;
            toast("Все 6 уровней! Новая игра пройдена ⏱", 3);
          } else level++;
          save();
          build(level);
        }, 900);
      }
    }

    if (p.y > 14 * TS) {
      p.x = 2 * TS;
      p.y = (L.groundY - 1) * TS;
      p.vx = p.vy = 0;
      toast("Упал", 0.8);
    }

    var mapW = L.w * TS;
    camX += (p.x - W * 0.4 - camX) * Math.min(1, dt * 6);
    camX = Math.max(0, Math.min(Math.max(0, mapW - W), camX));
  }

  function draw() {
    // фон
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0f0a1e");
    g.addColorStop(0.5, "#1e1b4b");
    g.addColorStop(1, "#312e81");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // звёзды
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (var s = 0; s < 40; s++) {
      var sx = (s * 97 + camX * 0.1) % W;
      ctx.fillRect(sx, (s * 53) % 200, 2, 2);
    }

    if (!world) return;
    var L = world.L;
    var p = world.p;
    ctx.save();
    ctx.translate(-camX, 0);

    // земля
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, L.groundY * TS, L.w * TS, TS * 3);
    ctx.fillStyle = "#4c1d95";
    ctx.fillRect(0, L.groundY * TS, L.w * TS, 8);

    // статичные платформы
    for (var i = 0; i < L.plats.length; i++) {
      var pl = L.plats[i];
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(pl[0] * TS, pl[1] * TS, pl[2] * TS, 18);
      ctx.fillStyle = "#a5b4fc";
      ctx.fillRect(pl[0] * TS, pl[1] * TS, pl[2] * TS, 4);
    }

    // движущаяся
    var mov = movingPos(L.moving, world.t);
    if (mov) {
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(mov.x, mov.y, mov.w, mov.h);
    }

    // дверь
    if (L.door) {
      var open = doorOpen(L, world.t);
      ctx.fillStyle = open ? "rgba(52,211,153,0.35)" : "#7f1d1d";
      ctx.fillRect(L.door.x * TS, (L.groundY - 2) * TS, 28, TS * 2);
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "800 11px system-ui";
      ctx.fillText(open ? "открыто" : "закрыто", L.door.x * TS - 6, (L.groundY - 2) * TS - 6);
    }

    // монета
    if (L.coin && !world.hasCoin) {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(L.coin[0] * TS + 14, L.coin[1] * TS + 14, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // ключ
    var kp = keyPos(L, world.t);
    if (kp && !world.hasKey) {
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(kp.x + 10, kp.y + 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(kp.x + 10, kp.y + 8, 14, 4);
    }

    // метка (призрак)
    if (world.mark) {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = "#c4b5fd";
      ctx.lineWidth = 3;
      ctx.strokeRect(world.mark.x - 4, world.mark.y - 4, p.w + 8, p.h + 8);
      ctx.fillStyle = "#ddd6fe";
      ctx.font = "900 12px system-ui";
      ctx.fillText("метка t=" + world.mark.t.toFixed(1), world.mark.x - 8, world.mark.y - 10);
      // силуэт
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(world.mark.x + 6, world.mark.y + 8, 18, 28);
      ctx.beginPath();
      ctx.arc(world.mark.x + 15, world.mark.y + 4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // выход
    ctx.fillStyle = "#34d399";
    ctx.fillRect(L.exit[0] * TS, L.exit[1] * TS - 20, 36, 56);
    ctx.fillStyle = "#ecfdf5";
    ctx.font = "900 12px system-ui";
    ctx.fillText("ВЫХОД", L.exit[0] * TS - 2, L.exit[1] * TS - 26);

    // игрок
    ctx.fillStyle = "#f9a8d4";
    ctx.beginPath();
    ctx.arc(p.x + 15, p.y + 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c084fc";
    ctx.fillRect(p.x + 5, p.y + 20, 20, 24);
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(p.x + 8, p.y + 8, 4, 4);
    ctx.fillRect(p.x + 18, p.y + 8, 4, 4);
    if (world.hasCoin) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "16px system-ui";
      ctx.fillText("●", p.x + 22, p.y);
    }
    if (world.hasKey) {
      ctx.fillStyle = "#fde68a";
      ctx.font = "14px system-ui";
      ctx.fillText("🔑", p.x - 4, p.y);
    }

    ctx.restore();

    // полоска времени: настоящее → метка в прошлом
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(W / 2 - 140, 12, 280, 12);
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(W / 2 - 140, 12, Math.min(280, world.t * 16), 12);
    if (world.mark) {
      var mx = W / 2 - 140 + Math.min(280, world.mark.t * 16);
      ctx.fillStyle = "#86efac";
      ctx.fillRect(mx - 2, 8, 4, 20);
      ctx.fillStyle = "#bbf7d0";
      ctx.font = "800 10px system-ui";
      ctx.fillText("прошлое", mx - 18, 42);
    }
    if (world.rewinding) {
      ctx.fillStyle = "rgba(244,114,182,0.18)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f9a8d4";
      ctx.font = "900 22px system-ui";
      ctx.fillText("→ вперёд в прошлое…", W / 2 - 110, H / 2);
    }
    ctx.fillStyle = "#e9d5ff";
    ctx.font = "800 11px system-ui";
    ctx.fillText("сейчас: " + world.t.toFixed(1) + "с", W / 2 - 40, 56);
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

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      jumpQ = true;
    }
    if (e.code === "KeyE" || e.code === "KeyF") placeMark();
    if (e.code === "KeyQ" || e.code === "KeyR") startRewindToMark();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

  document.getElementById("btn-mark").onclick = placeMark;
  document.getElementById("btn-tp").onclick = startRewindToMark;
  document.getElementById("btn-jump").onpointerdown = function (e) {
    e.preventDefault();
    jumpQ = true;
  };
  document.getElementById("btn-next").onclick = function () {
    build(level);
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

  build(level);
  requestAnimationFrame(frame);
})();
