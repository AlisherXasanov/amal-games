/**
 * Время с шагом — гениальная механика:
 * идёшь вперёд → время течёт вперёд;
 * идёшь назад → время откатывается;
 * стоишь → время замирает.
 * 2D-геймплей + лёгкая глубина (параллакс 2.5D). Kenney CC0.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var ASSET = "../shared/kenney-platformer/";
  var TILE = 48;
  var W = 960;
  var H = 540;
  var GRAV = 2200;
  var JUMP = 760;
  var SPEED = 260;
  var SAVE = "amal-time-walk-v2";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var toastEl = document.getElementById("toast");
  var timeArrow = document.getElementById("timeArrow");
  var lvlEl = document.getElementById("lvl");
  var toastT = 0;

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2.4 : t;
  }

  function loadImage(src) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        res(img);
      };
      img.onerror = rej;
      img.src = src;
    });
  }
  function parseAtlas(xml) {
    var f = Object.create(null);
    var re = /name="([^"]+)"\s+x="(\d+)"\s+y="(\d+)"\s+width="(\d+)"\s+height="(\d+)"/g;
    var m;
    while ((m = re.exec(xml))) {
      f[m[1]] = { x: +m[2], y: +m[3], w: +m[4], h: +m[5] };
    }
    return f;
  }
  function makeAtlas(img, frames) {
    return {
      draw: function (c, name, x, y, w, h, flip) {
        var f = frames[name];
        if (!f) return false;
        c.save();
        if (flip) {
          c.translate(x + w, y);
          c.scale(-1, 1);
          c.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, w, h);
        } else {
          c.drawImage(img, f.x, f.y, f.w, f.h, x, y, w, h);
        }
        c.restore();
        return true;
      },
    };
  }

  var chars, tiles, enemies, bgHills, bgClouds;
  var keys = Object.create(null);
  var stickX = 0;
  var jumpQ = false;
  var camX = 0;
  var worldTime = 0;
  var timeDir = 0; // -1 back, 0 pause, +1 forward
  var maxWorldTime = 0;
  var level = 0;
  var won = false;
  var dead = false;

  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d && d.level != null) level = Math.min(d.level, 4);
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({ level: level }));
    } catch (_) {}
  }

  /* Карты: P игрок  # земля  = платформа  C монета  S слайм(по времени)  F флаг  V «машина-время»  X шип */
  var LEVELS = [
    {
      name: "Урок времени",
      story: "→ время вперёд · ← время назад · стой — пауза",
      map: [
        "........................................",
        "........................................",
        "................C.......................",
        ".............====.......................",
        "........................................",
        "....C...................................",
        "P.......S...............C..........F....",
        "########################################",
      ],
    },
    {
      name: "Падающий шип",
      story: "Шип падает во времени. Отойди назад — он взлетит обратно!",
      map: [
        "........................................",
        "..........X.............................",
        "........................................",
        ".......====.............................",
        "........................................",
        "..............C.........................",
        "P...................S..............F....",
        "########################################",
      ],
    },
    {
      name: "Ночные фары",
      story: "Машина едет только когда время идёт. Откатись — она вернётся.",
      map: [
        "........................................",
        "........................................",
        "....C..........====.....................",
        "........................................",
        ".........V..............................",
        "......................C.................",
        "P......S...........................F....",
        "########################################",
      ],
    },
    {
      name: "Двойная ловушка",
      story: "Слайм и шип живут во времени. Комбинируй шаги.",
      map: [
        "........................................",
        ".....X...............X..................",
        "........................................",
        "....====...........====.................",
        "........................................",
        "..C.......S....C......S.................",
        "P..................................F....",
        "########################################",
      ],
    },
    {
      name: "Финал · креатив",
      story: "Дойди до флага, откатывая опасности назад.",
      map: [
        "........................................",
        "...X.........X..........X...............",
        "........................................",
        "..====.....====......====...............",
        "......V.................................",
        "....C....S....C....S....C...............",
        "P..................................F....",
        "########################################",
      ],
    },
  ];

  var solids = [];
  var coins = [];
  var mobs = [];
  var spikes = [];
  var cars = [];
  var flag = null;
  var player = null;
  var mapW = 0;
  var mapH = 0;

  function samplePath(path, t) {
    if (!path.length) return { x: 0, y: 0 };
    var i = Math.max(0, Math.min(path.length - 1, Math.floor(t * 60)));
    return path[i];
  }

  function buildLevel(idx) {
    var L = LEVELS[idx];
    var map = L.map;
    var rows = map.length;
    var cols = map[0].length;
    mapW = cols * TILE;
    mapH = rows * TILE;
    solids = [];
    coins = [];
    mobs = [];
    spikes = [];
    cars = [];
    flag = null;
    player = {
      x: TILE,
      y: TILE,
      w: 36,
      h: 52,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      hurtT: 0,
    };
    worldTime = 0;
    maxWorldTime = 0;
    won = false;
    dead = false;
    camX = 0;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var ch = map[y][x];
        var px = x * TILE;
        var py = y * TILE;
        if (ch === "#" || ch === "D") {
          solids.push({ x: px, y: py, w: TILE, h: TILE, kind: "ground" });
        } else if (ch === "=") {
          solids.push({ x: px, y: py + 12, w: TILE, h: 20, kind: "plat", drawY: py });
        } else if (ch === "C") {
          coins.push({ x: px + 8, y: py + 8, w: 32, h: 32, takenAt: -1 });
        } else if (ch === "S") {
          var path = [];
          var sx = px + 4;
          var sy = py;
          var svx = -55;
          for (var ti = 0; ti < 60 * 40; ti++) {
            sx += svx / 60;
            if (sx < px - 80 || sx > px + 80) svx *= -1;
            path.push({ x: sx, y: sy });
          }
          mobs.push({ path: path, w: 40, h: 40, anim: 0 });
        } else if (ch === "X") {
          var sp = [];
          var dropY = py;
          var fall = 0;
          var grounded = false;
          for (var si = 0; si < 60 * 40; si++) {
            if (!grounded) {
              fall += 1800 / 60;
              dropY += fall / 60;
              if (dropY >= (rows - 2) * TILE - 40) {
                dropY = (rows - 2) * TILE - 40;
                grounded = true;
                fall = 0;
              }
            }
            sp.push({ x: px + 4, y: dropY });
          }
          spikes.push({ path: sp, w: 40, h: 40 });
        } else if (ch === "V") {
          var cp = [];
          var cx = px;
          var cy = py - 10;
          for (var ci = 0; ci < 60 * 40; ci++) {
            cx += 90 / 60;
            if (cx > mapW - TILE * 2) cx = px;
            cp.push({ x: cx, y: cy });
          }
          cars.push({ path: cp, w: 70, h: 36 });
        } else if (ch === "F") {
          flag = { x: px, y: py - 8, w: 40, h: 56 };
        } else if (ch === "P") {
          player.x = px + 6;
          player.y = py - 8;
        }
      }
    }
    lvlEl.textContent = String(idx + 1);
    toast(L.name + " — " + L.story, 3.5);
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

  function entAt(pathObj) {
    var p = samplePath(pathObj.path, worldTime);
    return { x: p.x, y: p.y, w: pathObj.w, h: pathObj.h };
  }

  function update(dt) {
    if (won || dead || !player) return;

    var ix = 0;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1;
    if (Math.abs(stickX) > 0.2) ix = stickX > 0 ? 1 : -1;

    // ГЛАВНАЯ МЕХАНИКА: направление шага = направление времени
    timeDir = ix;
    if (timeDir > 0) {
      worldTime += dt;
      if (worldTime > maxWorldTime) maxWorldTime = worldTime;
      timeArrow.textContent = "▶ время вперёд";
      timeArrow.style.color = "#4ade80";
    } else if (timeDir < 0) {
      worldTime = Math.max(0, worldTime - dt);
      timeArrow.textContent = "◀ время назад";
      timeArrow.style.color = "#f472b6";
    } else {
      timeArrow.textContent = "⏸ время стоит";
      timeArrow.style.color = "#67e8f9";
    }

    player.vx = ix * SPEED;
    if (ix) player.facing = ix;

    if (jumpQ && player.onGround) {
      player.vy = -JUMP;
      player.onGround = false;
    }
    jumpQ = false;

    player.vy += GRAV * dt;
    if (player.vy > 1400) player.vy = 1400;
    player.onGround = false;
    player.x += player.vx * dt;
    for (var i = 0; i < solids.length; i++) resolve(player, solids[i], "x");
    player.y += player.vy * dt;
    for (var j = 0; j < solids.length; j++) resolve(player, solids[j], "y");

    if (player.hurtT > 0) player.hurtT -= dt;

    // монеты: взяты в момент времени takenAt
    for (var c = 0; c < coins.length; c++) {
      var coin = coins[c];
      var visible = coin.takenAt < 0 || worldTime < coin.takenAt;
      if (visible && aabb(player, coin)) {
        coin.takenAt = worldTime;
      }
    }

    // опасность
    if (player.hurtT <= 0) {
      for (var m = 0; m < mobs.length; m++) {
        if (aabb(player, entAt(mobs[m]))) hurt();
      }
      for (var s = 0; s < spikes.length; s++) {
        if (aabb(player, entAt(spikes[s]))) hurt();
      }
      for (var v = 0; v < cars.length; v++) {
        if (aabb(player, entAt(cars[v]))) hurt();
      }
    }

    if (flag && aabb(player, flag)) {
      won = true;
      if (level >= LEVELS.length - 1) {
        toast("Ты прошёл всё! Механика времени — твоя. ⏳", 4);
        level = 0;
        save();
        setTimeout(function () {
          buildLevel(0);
        }, 1800);
      } else {
        level++;
        save();
        toast("Уровень пройден!", 1.2);
        setTimeout(function () {
          buildLevel(level);
        }, 900);
      }
    }

    if (player.y > mapH + 80) hurt(true);

    camX += (player.x - W * 0.35 - camX) * Math.min(1, dt * 6);
    camX = Math.max(0, Math.min(mapW - W, camX));
  }

  function hurt(fall) {
    if (dead || won) return;
    player.hurtT = 0.9;
    player.vy = -400;
    if (fall) {
      dead = true;
      toast("Упал! Жми ↻ или R", 99);
      return;
    }
    toast("Ай! Откати время ← и обойди", 1.5);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // параллакс 2.5D
    if (bgHills) {
      var hx = (-camX * 0.15) % bgHills.width;
      ctx.drawImage(bgHills, hx, 0, W, H);
      ctx.drawImage(bgHills, hx + bgHills.width, 0, W, H);
    } else {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, W, H);
    }
    if (bgClouds) {
      var cx = (-camX * 0.35) % bgClouds.width;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(bgClouds, cx, 20, W, H * 0.5);
      ctx.globalAlpha = 1;
    }

    // лёгкая «глубина» — дальние плитки
    ctx.save();
    ctx.translate(-camX * 0.7, 8);
    ctx.globalAlpha = 0.25;
    for (var d = 0; d < solids.length; d++) {
      var ds = solids[d];
      if (ds.kind !== "ground") continue;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(ds.x, ds.y, ds.w, ds.h);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.translate(-camX, 0);

    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (s.kind === "plat") {
        tiles.draw(ctx, "bridge", s.x, s.drawY != null ? s.drawY : s.y - 12, TILE, TILE, false) ||
          (ctx.fillStyle = "#a16207", ctx.fillRect(s.x, s.y, s.w, s.h));
      } else {
        tiles.draw(ctx, "terrain_grass_block_top", s.x, s.y, TILE, TILE, false) ||
          (ctx.fillStyle = "#166534", ctx.fillRect(s.x, s.y, s.w, s.h));
      }
    }

    for (var c = 0; c < coins.length; c++) {
      var coin = coins[c];
      if (coin.takenAt >= 0 && worldTime >= coin.takenAt) continue;
      tiles.draw(ctx, "coin_gold", coin.x, coin.y, 32, 32, false) ||
        (ctx.fillStyle = "#fbbf24", ctx.beginPath(), ctx.arc(coin.x + 16, coin.y + 16, 12, 0, Math.PI * 2), ctx.fill());
    }

    for (var m = 0; m < mobs.length; m++) {
      var me = entAt(mobs[m]);
      enemies.draw(ctx, Math.floor(worldTime * 8) % 2 ? "slime_normal_walk_b" : "slime_normal_walk_a", me.x, me.y, me.w, me.h, false) ||
        (ctx.fillStyle = "#86efac", ctx.fillRect(me.x, me.y, me.w, me.h));
    }

    for (var sp = 0; sp < spikes.length; sp++) {
      var se = entAt(spikes[sp]);
      enemies.draw(ctx, "block_idle", se.x, se.y, se.w, se.h, false) ||
        (ctx.fillStyle = "#94a3b8", ctx.fillRect(se.x, se.y, se.w, se.h));
      ctx.fillStyle = "#f87171";
      ctx.font = "900 14px system-ui";
      ctx.fillText("▼", se.x + 12, se.y + 24);
    }

    for (var v = 0; v < cars.length; v++) {
      var ve = entAt(cars[v]);
      // машина + фары (2.5D деталь)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(ve.x, ve.y, ve.w, ve.h);
      ctx.fillStyle = "#334155";
      ctx.fillRect(ve.x + 10, ve.y - 14, ve.w - 24, 16);
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.moveTo(ve.x + ve.w, ve.y + 10);
      ctx.lineTo(ve.x + ve.w + 80, ve.y + 40);
      ctx.lineTo(ve.x + ve.w + 80, ve.y - 10);
      ctx.closePath();
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(ve.x + ve.w - 8, ve.y + 8, 8, 8);
      ctx.fillRect(ve.x + ve.w - 8, ve.y + 20, 8, 8);
    }

    if (flag) {
      tiles.draw(ctx, Math.floor(worldTime * 6) % 2 ? "flag_yellow_b" : "flag_yellow_a", flag.x, flag.y, 48, 48, false) ||
        (ctx.fillStyle = "#fbbf24", ctx.fillRect(flag.x, flag.y, 20, 48));
    }

    // игрок (Kenney, «яйцеподобная» округлая голова)
    if (player) {
      var spr = "character_yellow_idle";
      if (player.hurtT > 0) spr = "character_yellow_hit";
      else if (!player.onGround) spr = "character_yellow_jump";
      else if (Math.abs(player.vx) > 20) spr = Math.floor(worldTime * 10) % 2 ? "character_yellow_walk_b" : "character_yellow_walk_a";
      var ok = chars.draw(ctx, spr, player.x, player.y, player.w, player.h, player.facing < 0);
      if (!ok) {
        ctx.fillStyle = "#fde68a";
        ctx.beginPath();
        ctx.ellipse(player.x + player.w / 2, player.y + 18, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(player.x + 6, player.y + 30, 24, 22);
      }
    }

    ctx.restore();

    // виньетка времени
    if (timeDir < 0) {
      ctx.fillStyle = "rgba(244,114,182,0.08)";
      ctx.fillRect(0, 0, W, H);
    } else if (timeDir > 0) {
      ctx.fillStyle = "rgba(74,222,128,0.06)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    if (toastT > 0 && !dead) {
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
    if (e.code === "KeyR") {
      dead = false;
      toastEl.style.display = "none";
      buildLevel(level);
    }
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });
  document.getElementById("btn-restart").onclick = function () {
    dead = false;
    toastEl.style.display = "none";
    buildLevel(level);
  };
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

  toast("Загрузка…", 3);
  Promise.all([
    loadImage(ASSET + "Spritesheets/spritesheet-characters-default.png"),
    fetch(ASSET + "Spritesheets/spritesheet-characters-default.xml").then(function (r) {
      return r.text();
    }),
    loadImage(ASSET + "Spritesheets/spritesheet-tiles-default.png"),
    fetch(ASSET + "Spritesheets/spritesheet-tiles-default.xml").then(function (r) {
      return r.text();
    }),
    loadImage(ASSET + "Spritesheets/spritesheet-enemies-default.png"),
    fetch(ASSET + "Spritesheets/spritesheet-enemies-default.xml").then(function (r) {
      return r.text();
    }),
    loadImage(ASSET + "Backgrounds/background_color_hills.png"),
    loadImage(ASSET + "Backgrounds/background_clouds.png"),
  ])
    .then(function (res) {
      chars = makeAtlas(res[0], parseAtlas(res[1]));
      tiles = makeAtlas(res[2], parseAtlas(res[3]));
      enemies = makeAtlas(res[4], parseAtlas(res[5]));
      bgHills = res[6];
      bgClouds = res[7];
      buildLevel(level);
      requestAnimationFrame(frame);
    })
    .catch(function (err) {
      console.error(err);
      toast("Ошибка загрузки. Проверь интернет/файлы Kenney.", 8);
      // fallback без спрайтов
      chars = tiles = enemies = { draw: function () { return false; } };
      buildLevel(level);
      requestAnimationFrame(frame);
    });
})();
