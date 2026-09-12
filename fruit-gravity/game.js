/**
 * Фрукт-гравитация — Pixel Adventure (Pixel Frog).
 * Уникально: фрукты переключают направление гравитации.
 * A=яблоко ↑  B=банан →  C=вишня ↓
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;
  var W = 960,
    H = 540,
    TS = 32,
    ASSET = "../shared/pixel-adventure/",
    SPEED = 230,
    JUMP = 680;

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var toastEl = document.getElementById("toast");
  var gravEl = document.getElementById("grav");
  var toastT = 0;
  var imgs = {};
  var animT = 0;

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2.2 : t;
  }
  function load(src) {
    return new Promise(function (res, rej) {
      var i = new Image();
      i.onload = function () {
        res(i);
      };
      i.onerror = rej;
      i.src = src;
    });
  }

  // # земля  . воздух  P старт  F флаг  A яблоко↑  B банан→  C вишня↓
  var LEVELS = [
    {
      tip: "Съешь яблоко A — гравитация вверх. Вернись вишней C.",
      map: [
        "........................",
        "...................F....",
        ".............A..........",
        "........................",
        "....P.........####......",
        "########################",
      ],
    },
    {
      tip: "Банан B тянет вправо как «пол».",
      map: [
        "...................F....",
        "........................",
        "........B...............",
        "......####..............",
        ".P.................C....",
        "######.............#####",
      ],
    },
    {
      tip: "Комбо: вверх → вбок → вниз к флагу.",
      map: [
        "................F.......",
        "..........A.............",
        "........................",
        "......####......B.......",
        ".P.................C....",
        "#####..............#####",
      ],
    },
    {
      tip: "Узкий коридор. Не перепутай фрукты.",
      map: [
        "...................F....",
        "....A...................",
        "........................",
        "#########....###########",
        ".P......B..........C....",
        "########################",
      ],
    },
    {
      tip: "Финал: три смены гравитации.",
      map: [
        "......................F.",
        "............A...........",
        "........................",
        ".....####......B........",
        ".P.................C....",
        "####...............#####",
      ],
    },
  ];

  var level = 0;
  var solids = [];
  var fruits = [];
  var flag = null;
  var player = null;
  var grav = { x: 0, y: 1 }; // down
  var camX = 0;
  var keys = Object.create(null);
  var jumpQ = false;
  var stickX = 0;
  var worldW = 0;
  var baseY = 0;

  function setGrav(gx, gy, label) {
    grav.x = gx;
    grav.y = gy;
    gravEl.textContent = label;
    toast("Гравитация: " + label, 1.4);
  }

  function build(i) {
    level = i;
    document.getElementById("lvl").textContent = String(i + 1);
    var L = LEVELS[i];
    solids = [];
    fruits = [];
    flag = null;
    setGrav(0, 1, "↓");
    var rows = L.map;
    worldW = rows[0].length * TS;
    baseY = H - rows.length * TS;
    player = { x: 40, y: 100, w: 24, h: 28, vx: 0, vy: 0, onGround: false, facing: 1 };
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        var px = x * TS,
          py = baseY + y * TS;
        if (ch === "#") solids.push({ x: px, y: py, w: TS, h: TS });
        if (ch === "P") {
          player.x = px + 4;
          player.y = py - 8;
        }
        if (ch === "F") flag = { x: px, y: py - 16, w: 32, h: 48 };
        if (ch === "A") fruits.push({ x: px + 4, y: py + 4, w: 24, h: 24, kind: "apple" });
        if (ch === "B") fruits.push({ x: px + 4, y: py + 4, w: 24, h: 24, kind: "banana" });
        if (ch === "C") fruits.push({ x: px + 4, y: py + 4, w: 24, h: 24, kind: "cherry" });
      }
    }
    toast(L.tip, 3.5);
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function collide() {
    player.onGround = false;
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (!aabb(player, s)) continue;
      var ox = player.x + player.w / 2 - (s.x + s.w / 2);
      var oy = player.y + player.h / 2 - (s.y + s.h / 2);
      var dx = player.w / 2 + s.w / 2 - Math.abs(ox);
      var dy = player.h / 2 + s.h / 2 - Math.abs(oy);
      if (dx < dy) {
        if (ox > 0) player.x += dx;
        else player.x -= dx;
        player.vx = 0;
        if (grav.x !== 0 && Math.sign(ox) === Math.sign(grav.x)) player.onGround = true;
      } else {
        if (oy > 0) player.y += dy;
        else player.y -= dy;
        player.vy = 0;
        if (grav.y !== 0 && Math.sign(oy) === Math.sign(grav.y)) player.onGround = true;
      }
    }
  }

  function update(dt) {
    var ix = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) ix -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) ix += 1;
    if (stickX) ix = stickX > 0.2 ? 1 : stickX < -0.2 ? -1 : ix;
    // движение перпендикулярно гравитации
    if (Math.abs(grav.y) > Math.abs(grav.x)) {
      player.vx = ix * SPEED;
      if (ix) player.facing = ix;
      player.vy += grav.y * 2000 * dt;
      if (jumpQ && player.onGround) {
        player.vy = -JUMP * grav.y;
        player.onGround = false;
      }
    } else {
      player.vy = ix * SPEED;
      player.vx += grav.x * 2000 * dt;
      if (jumpQ && player.onGround) {
        player.vx = -JUMP * grav.x;
        player.onGround = false;
      }
    }
    jumpQ = false;

    player.x += player.vx * dt;
    player.y += player.vy * dt;
    collide();

    for (var f = fruits.length - 1; f >= 0; f--) {
      if (aabb(player, fruits[f])) {
        var k = fruits[f].kind;
        fruits.splice(f, 1);
        if (k === "apple") setGrav(0, -1, "↑");
        else if (k === "banana") setGrav(1, 0, "→");
        else setGrav(0, 1, "↓");
        player.vx *= 0.3;
        player.vy *= 0.3;
      }
    }
    if (flag && aabb(player, flag)) {
      if (level >= LEVELS.length - 1) {
        toast("Все уровни! Гравитация покорена.", 3);
        setTimeout(function () {
          build(0);
        }, 1200);
      } else build(level + 1);
      return;
    }
    if (player.y > H + 120 || player.y < -120 || player.x < -80 || player.x > worldW + 80) {
      toast("Выпал из мира", 1.2);
      build(level);
      return;
    }
    camX = Math.max(0, Math.min(worldW - W, player.x - W * 0.4));
  }

  function drawSheet(img, dx, dy, size) {
    if (!img) return false;
    var fw = Math.min(32, img.height || 32);
    ctx.drawImage(img, 0, 0, fw, fw, dx, dy, size, size);
    return true;
  }

  function draw() {
    if (imgs.bg) {
      for (var x = 0; x < W; x += 64) for (var y = 0; y < H; y += 64) ctx.drawImage(imgs.bg, x, y, 64, 64);
    } else {
      ctx.fillStyle = "#2e1065";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.save();
    ctx.translate(-camX, 0);
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (imgs.terrain) ctx.drawImage(imgs.terrain, 96, 0, 16, 16, s.x, s.y, s.w, s.h);
      else {
        ctx.fillStyle = "#6d28d9";
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
    }
    for (var f = 0; f < fruits.length; f++) {
      var fr = fruits[f];
      var im = fr.kind === "apple" ? imgs.apple : fr.kind === "banana" ? imgs.banana : imgs.cherry;
      if (!drawSheet(im, fr.x, fr.y, 28)) {
        ctx.fillStyle = fr.kind === "apple" ? "#ef4444" : fr.kind === "banana" ? "#fbbf24" : "#ec4899";
        ctx.beginPath();
        ctx.arc(fr.x + 12, fr.y + 12, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (flag) {
      if (imgs.flag) ctx.drawImage(imgs.flag, 0, 0, 64, 64, flag.x, flag.y, 40, 40);
      else {
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(flag.x + 8, flag.y, 6, 40);
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(flag.x + 14, flag.y, 20, 14);
      }
    }
    // player
    var run = Math.abs(player.vx) + Math.abs(player.vy) > 40;
    var sheet = run ? imgs.run : imgs.idle;
    var frame = Math.floor(animT * 10) % 11;
    ctx.save();
    if (player.facing < 0) {
      ctx.translate(player.x + player.w, player.y);
      ctx.scale(-1, 1);
      if (sheet) ctx.drawImage(sheet, frame * 32, 0, 32, 32, -4, -6, 32, 32);
      else {
        ctx.fillStyle = "#67e8f9";
        ctx.fillRect(0, 0, 24, 28);
      }
    } else {
      if (sheet) ctx.drawImage(sheet, frame * 32, 0, 32, 32, player.x - 4, player.y - 6, 32, 32);
      else {
        ctx.fillStyle = "#67e8f9";
        ctx.fillRect(player.x, player.y, 24, 28);
      }
    }
    ctx.restore();
    ctx.restore();
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
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      jumpQ = true;
    }
    if (e.code === "KeyR") build(level);
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });
  document.getElementById("btn-jump").onpointerdown = function (e) {
    e.preventDefault();
    jumpQ = true;
  };
  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickOn = false;
  function setStick(cx) {
    var r = pad.getBoundingClientRect();
    stickX = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width / 2)));
    knob.style.transform = "translate(" + stickX * 28 + "px,0)";
  }
  pad.addEventListener("pointerdown", function (e) {
    stickOn = true;
    pad.setPointerCapture(e.pointerId);
    setStick(e.clientX);
  });
  pad.addEventListener("pointermove", function (e) {
    if (stickOn) setStick(e.clientX);
  });
  function endStick() {
    stickOn = false;
    stickX = 0;
    knob.style.transform = "translate(0,0)";
  }
  pad.addEventListener("pointerup", endStick);
  pad.addEventListener("pointercancel", endStick);

  var char = "Ninja Frog";
  Promise.all([
    load(ASSET + "Background/Purple.png"),
    load(ASSET + "Terrain/Terrain (16x16).png"),
    load(ASSET + "Items/Fruits/Apple.png"),
    load(ASSET + "Items/Fruits/Bananas.png"),
    load(ASSET + "Items/Fruits/Cherries.png"),
    load(ASSET + "Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle)(64x64).png"),
    load(ASSET + "Chars/" + char + "/Idle (32x32).png"),
    load(ASSET + "Chars/" + char + "/Run (32x32).png"),
  ])
    .then(function (a) {
      imgs.bg = a[0];
      imgs.terrain = a[1];
      imgs.apple = a[2];
      imgs.banana = a[3];
      imgs.cherry = a[4];
      imgs.flag = a[5];
      imgs.idle = a[6];
      imgs.run = a[7];
      build(0);
      requestAnimationFrame(frame);
    })
    .catch(function (e) {
      console.warn(e);
      build(0);
      requestAnimationFrame(frame);
    });
})();
