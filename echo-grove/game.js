/**
 * Шёпот рощи — платформер на Sunny Land (ansimuz, CC-BY 3.0).
 * Уникальная механика: E оставляет «эхо» — твёрдую копию себя на 4 сек.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;
  var W = 960,
    H = 540,
    TS = 32,
    ASSET = "../shared/sunny-land/",
    G = 2100,
    JUMP = 700,
    SPEED = 230;

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var toastEl = document.getElementById("toast");
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

  /* уровни: # земля  . воздух  P старт  H дом  ^ шип */
  var LEVELS = [
    {
      tip: "E — эхо под ногами. Без эха до дальнего уступа не допрыгнешь.",
      map: [
        "..............................",
        "..............................",
        "..............................",
        "..............####............",
        "........P....................H",
        "########..........####..######",
      ],
    },
    {
      tip: "Эхо можно ставить в воздухе — прыгни и нажми E.",
      map: [
        "..............................",
        "..............................",
        "...................####.......",
        "...........####...............",
        "....P......................H..",
        "######.................#######",
      ],
    },
    {
      tip: "Цепочка эх: одно → прыг → новое эхо.",
      map: [
        "..............................",
        "..............................",
        "..............................",
        "......................##......",
        "..P.........................H.",
        "#####.....................#####",
      ],
    },
    {
      tip: "Осторожно: шипы ^ — эхо не спасает от них сверху.",
      map: [
        "..............................",
        "..............................",
        "............####..............",
        "......##..........##..........",
        "...P......^^^^..........H.....",
        "######.................#######",
      ],
    },
    {
      tip: "Высокая роща — эхо в падении.",
      map: [
        "..............................",
        "...................##.........",
        ".............####.............",
        ".......####...................",
        "..P.........................H.",
        "#####.....................#####",
      ],
    },
    {
      tip: "Финал рощи: дом далеко. Три эха подряд.",
      map: [
        "..............................",
        "..............................",
        "..............................",
        "..............................",
        ".P...........................H",
        "####.......................####",
      ],
    },
  ];

  var level = 0;
  var solids = [];
  var spikes = [];
  var house = null;
  var player = null;
  var echoes = [];
  var echoCd = 0;
  var camX = 0;
  var keys = Object.create(null);
  var jumpQ = false;
  var stickX = 0;
  var worldW = 0;

  function build(i) {
    level = i;
    document.getElementById("lvl").textContent = String(i + 1);
    var L = LEVELS[i];
    solids = [];
    spikes = [];
    house = null;
    echoes = [];
    echoCd = 0;
    player = { x: 40, y: 100, w: 22, h: 30, vx: 0, vy: 0, onGround: false, facing: 1 };
    var rows = L.map;
    worldW = rows[0].length * TS;
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        var px = x * TS,
          py = y * TS + (H - rows.length * TS);
        if (ch === "#") solids.push({ x: px, y: py, w: TS, h: TS });
        if (ch === "^") spikes.push({ x: px + 4, y: py + 16, w: TS - 8, h: 16 });
        if (ch === "P") {
          player.x = px + 4;
          player.y = py - 4;
        }
        if (ch === "H") house = { x: px - 10, y: py - 40, w: 48, h: 56 };
      }
    }
    toast(L.tip, 4);
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function plantEcho() {
    if (echoCd > 0) return;
    echoes.push({
      x: player.x,
      y: player.y,
      w: player.w,
      h: 10,
      life: 4,
      solid: { x: player.x, y: player.y + player.h - 10, w: player.w, h: 10 },
    });
    echoCd = 0.55;
    toast("Эхо!", 0.8);
  }

  function allSolids() {
    var a = solids.slice();
    for (var i = 0; i < echoes.length; i++) a.push(echoes[i].solid);
    return a;
  }

  function collide(axisX) {
    var list = allSolids();
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!aabb(player, s)) continue;
      if (axisX) {
        if (player.vx > 0) player.x = s.x - player.w;
        else if (player.vx < 0) player.x = s.x + s.w;
        player.vx = 0;
      } else {
        if (player.vy > 0) {
          player.y = s.y - player.h;
          player.vy = 0;
          player.onGround = true;
        } else if (player.vy < 0) {
          player.y = s.y + s.h;
          player.vy = 0;
        }
      }
    }
  }

  function update(dt) {
    var ix = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) ix -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) ix += 1;
    if (stickX) ix = stickX > 0.2 ? 1 : stickX < -0.2 ? -1 : ix;
    if (ix) player.facing = ix;
    player.vx = ix * SPEED;
    player.vy += G * dt;
    if (jumpQ && player.onGround) {
      player.vy = -JUMP;
      player.onGround = false;
    }
    jumpQ = false;
    if (echoCd > 0) echoCd -= dt;

    player.x += player.vx * dt;
    collide(true);
    player.y += player.vy * dt;
    player.onGround = false;
    collide(false);

    for (var i = echoes.length - 1; i >= 0; i--) {
      echoes[i].life -= dt;
      if (echoes[i].life <= 0) echoes.splice(i, 1);
    }
    for (var s = 0; s < spikes.length; s++) {
      if (aabb(player, spikes[s])) {
        toast("Шипы!", 1.2);
        build(level);
        return;
      }
    }
    if (player.y > H + 80) {
      toast("Упал…", 1);
      build(level);
      return;
    }
    if (house && aabb(player, { x: house.x + 10, y: house.y + 20, w: 28, h: 36 })) {
      if (level >= LEVELS.length - 1) {
        toast("Роща пройдена! Ты у дома.", 4);
        level = 0;
        setTimeout(function () {
          build(0);
        }, 1500);
      } else build(level + 1);
      return;
    }
    camX = Math.max(0, Math.min(worldW - W, player.x - W * 0.35));
  }

  function drawTileGround(x, y, w, h) {
    var ts = imgs.tileset;
    if (ts) {
      // верхняя трава примерно в tileset
      ctx.drawImage(ts, 0, 0, 16, 16, x, y, w, h);
    } else {
      ctx.fillStyle = "#52796f";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#84a98c";
      ctx.fillRect(x, y, w, 6);
    }
  }

  function drawPlayerFrame(px, py, flip, ghost) {
    var frames = imgs.idle;
    if (!player.onGround) frames = player.vy < 0 ? imgs.jump : imgs.fall;
    else if (Math.abs(player.vx) > 20) frames = imgs.skip;
    var fr = frames && frames.length ? frames[Math.floor(animT * 8) % frames.length] : null;
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.45;
    if (flip) {
      ctx.translate(px + 28, py);
      ctx.scale(-1, 1);
      px = 0;
      py = 0;
    }
    if (fr) ctx.drawImage(fr, px - 4, py - 6, 32, 36);
    else {
      ctx.fillStyle = "#f4a261";
      ctx.fillRect(px, py, 22, 30);
    }
    ctx.restore();
  }

  function draw() {
    // parallax
    if (imgs.bg) {
      var bx = -camX * 0.15;
      ctx.drawImage(imgs.bg, bx % imgs.bg.width, 0, W, H);
      ctx.drawImage(imgs.bg, (bx % imgs.bg.width) + imgs.bg.width, 0, W, H);
    } else {
      ctx.fillStyle = "#1b4332";
      ctx.fillRect(0, 0, W, H);
    }
    if (imgs.mid) {
      var mx = -camX * 0.4;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(imgs.mid, mx % (imgs.mid.width || W), H - 220, W + 40, 220);
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(-camX, 0);
    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      drawTileGround(s.x, s.y, s.w, s.h);
    }
    for (var j = 0; j < spikes.length; j++) {
      var sp = spikes[j];
      ctx.fillStyle = "#d62828";
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y + sp.h);
      ctx.lineTo(sp.x + sp.w / 2, sp.y);
      ctx.lineTo(sp.x + sp.w, sp.y + sp.h);
      ctx.fill();
    }
    if (house) {
      if (imgs.house) ctx.drawImage(imgs.house, house.x, house.y, house.w, house.h);
      else {
        ctx.fillStyle = "#bc6c25";
        ctx.fillRect(house.x, house.y, house.w, house.h);
      }
    }
    for (var e = 0; e < echoes.length; e++) {
      var ec = echoes[e];
      ctx.fillStyle = "rgba(148,210,189," + Math.min(1, ec.life / 2) * 0.7 + ")";
      ctx.fillRect(ec.solid.x, ec.solid.y, ec.solid.w, ec.solid.h);
      drawPlayerFrame(ec.x, ec.y, false, true);
    }
    // props
    if (imgs.tree) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(imgs.tree, 120, H - 200, 70, 110);
      ctx.drawImage(imgs.tree, 520, H - 190, 60, 100);
      ctx.globalAlpha = 1;
    }
    drawPlayerFrame(player.x, player.y, player.facing < 0, false);
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
    if (e.code === "KeyE") plantEcho();
    if (e.code === "KeyR") build(level);
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });
  document.getElementById("btn-echo").onclick = plantEcho;
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

  function loadSeq(base, n) {
    var arr = [];
    var p = [];
    for (var i = 1; i <= n; i++) {
      p.push(
        load(base + i + ".png").then(function (im) {
          arr.push(im);
        })
      );
    }
    return Promise.all(p).then(function () {
      return arr;
    });
  }

  Promise.all([
    load(ASSET + "layers/background.png"),
    load(ASSET + "layers/middleground.png"),
    load(ASSET + "layers/tileset.png"),
    load(ASSET + "props/house.png"),
    load(ASSET + "props/tree.png"),
    loadSeq(ASSET + "sprites/player/player-idle/player-idle-", 4),
    loadSeq(ASSET + "sprites/player/player-jump/player-jump-", 4),
    loadSeq(ASSET + "sprites/player/player-fall/player-fall-", 4),
    loadSeq(ASSET + "sprites/player/player-skip/player-skip-", 8),
  ])
    .then(function (a) {
      imgs.bg = a[0];
      imgs.mid = a[1];
      imgs.tileset = a[2];
      imgs.house = a[3];
      imgs.tree = a[4];
      imgs.idle = a[5];
      imgs.jump = a[6];
      imgs.fall = a[7];
      imgs.skip = a[8];
      build(0);
      requestAnimationFrame(frame);
    })
    .catch(function (err) {
      console.warn(err);
      toast("Часть графики не загрузилась", 2);
      build(0);
      requestAnimationFrame(frame);
    });
})();
