/**
 * Прыг-Герой — 2D платформер на Kenney New Platformer Pack (CC0).
 * Персонаж: character_yellow (idle / walk / jump / duck / hit).
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var ASSET = "../shared/kenney-platformer/";
  var TILE = 48;
  var GRAV = 2100;
  var JUMP = 720;
  var SPEED = 280;
  var SAVE = "amal-platform-hero-v1";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  var toastEl = document.getElementById("toast");
  var toastT = 0;
  function toast(msg, t) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    toastT = t == null ? 2 : t;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function parseAtlas(xmlText) {
    var frames = Object.create(null);
    var re = /name="([^"]+)"\s+x="(\d+)"\s+y="(\d+)"\s+width="(\d+)"\s+height="(\d+)"/g;
    var m;
    while ((m = re.exec(xmlText))) {
      frames[m[1]] = { x: +m[2], y: +m[3], w: +m[4], h: +m[5] };
    }
    return frames;
  }

  function makeAtlas(img, frames) {
    return {
      img: img,
      frames: frames,
      draw: function (c, name, dx, dy, dw, dh, flip) {
        var f = frames[name];
        if (!f) return;
        c.save();
        if (flip) {
          c.translate(dx + dw, dy);
          c.scale(-1, 1);
          c.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, dw, dh);
        } else {
          c.drawImage(img, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
        }
        c.restore();
      },
    };
  }

  function playSfx(buf, vol) {
    if (!audioCtx || !buf) return;
    try {
      var src = audioCtx.createBufferSource();
      var g = audioCtx.createGain();
      g.gain.value = vol == null ? 0.35 : vol;
      src.buffer = buf;
      src.connect(g);
      g.connect(audioCtx.destination);
      src.start(0);
    } catch (_) {}
  }

  var audioCtx = null;
  var sfx = {};
  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {}
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function loadOgg(url) {
    return fetch(url)
      .then(function (r) {
        return r.arrayBuffer();
      })
      .then(function (ab) {
        ensureAudio();
        if (!audioCtx) return null;
        return audioCtx.decodeAudioData(ab.slice(0));
      })
      .catch(function () {
        return null;
      });
  }

  /* Level legend:
     # grass top  D dirt  = platform cloud
     C coin  S slime  B bee  ^ spike  F flag  P player  . empty
  */
  var LEVELS = [
    {
      name: "Луга",
      theme: "grass",
      map: [
        "..........................................",
        "..........................................",
        "..........................................",
        "....................C.....................",
        "...............####.......................",
        "..........C................C..............",
        ".......####..............####.............",
        ".................S........................",
        "....C.........#######...........C.........",
        "..........................................",
        "P......S...............B...........C...F..",
        "##########################################",
      ],
    },
    {
      name: "Облака",
      theme: "grass",
      map: [
        "..........................................",
        ".........................C................",
        "......................====................",
        ".............C............................",
        "..........====...........C....====........",
        "..........................................",
        "....C.........S......====.................",
        "....................................C.....",
        "P......====................B........F.....",
        "..........................................",
        "....^^^^..........^^^^....................",
        "##########################################",
      ],
    },
    {
      name: "Пещера",
      theme: "stone",
      map: [
        "..........................................",
        "..........................................",
        "......C...........C...........C...........",
        "....####........####........####..........",
        "..........................................",
        "...........S................S.............",
        "........#######..........#######..........",
        "..........................................",
        "P...C......B.........^^^^......C......F...",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Пурпур",
      theme: "purple",
      map: [
        "..........................................",
        ".................C........................",
        "..............====........................",
        ".........C................C...............",
        "......====.............====...............",
        ".................B........................",
        "...C........S.........====......C.........",
        "..........................................",
        "P.....====..............^^^^........F.....",
        "..........................................",
        "....^^^^..................................",
        "##########################################",
      ],
    },
    {
      name: "Финиш",
      theme: "sand",
      map: [
        "..........................................",
        ".......................C..................",
        "....................====..................",
        "..............C................C..........",
        "...........====.............====..........",
        "......C...........B..............C........",
        "...====........====..........====.........",
        ".........S..............S.................",
        "P..C..====..^^^^..====..^^^^..====..C..F..",
        "..........................................",
        "..........................................",
        "##########################################",
      ],
    },
  ];

  var state = {
    level: 0,
    coins: 0,
    hp: 3,
    best: 0,
  };
  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      state.best = d.best || 0;
      if (d.level != null) state.level = Math.min(d.level, LEVELS.length - 1);
    }
  } catch (_) {}

  var world = null;
  var chars;
  var tiles;
  var enemies;
  var bgHills;
  var bgClouds;
  var camX = 0;
  var animT = 0;
  var keys = Object.create(null);
  var stickX = 0;
  var jumpQueued = false;

  function themeTiles(theme) {
    if (theme === "stone")
      return {
        top: "terrain_stone_block_top",
        fill: "terrain_stone_block_center",
        left: "terrain_stone_block_top_left",
        right: "terrain_stone_block_top_right",
        cloudL: "terrain_stone_cloud_left",
        cloudM: "terrain_stone_cloud_middle",
        cloudR: "terrain_stone_cloud_right",
      };
    if (theme === "purple")
      return {
        top: "terrain_purple_block_top",
        fill: "terrain_purple_block_center",
        left: "terrain_purple_block_top_left",
        right: "terrain_purple_block_top_right",
        cloudL: "terrain_purple_cloud_left",
        cloudM: "terrain_purple_cloud_middle",
        cloudR: "terrain_purple_cloud_right",
      };
    if (theme === "sand")
      return {
        top: "terrain_sand_block_top",
        fill: "terrain_sand_block_center",
        left: "terrain_sand_block_top_left",
        right: "terrain_sand_block_top_right",
        cloudL: "terrain_sand_cloud_left",
        cloudM: "terrain_sand_cloud_middle",
        cloudR: "terrain_sand_cloud_right",
      };
    return {
      top: "terrain_grass_block_top",
      fill: "terrain_dirt_block_center",
      left: "terrain_grass_block_top_left",
      right: "terrain_grass_block_top_right",
      cloudL: "terrain_grass_cloud_left",
      cloudM: "terrain_grass_cloud_middle",
      cloudR: "terrain_grass_cloud_right",
    };
  }

  function buildLevel(idx) {
    var L = LEVELS[idx];
    var map = L.map;
    var rows = map.length;
    var cols = map[0].length;
    var solids = [];
    var hazards = [];
    var coins = [];
    var mobs = [];
    var flag = null;
    var player = { x: TILE * 2, y: TILE, vx: 0, vy: 0, w: 36, h: 52, onGround: false, facing: 1, hurtT: 0, duck: false };
    var th = themeTiles(L.theme);

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var ch = map[y][x];
        var px = x * TILE;
        var py = y * TILE;
        if (ch === "#" || ch === "D") {
          var sprite = ch === "#" ? th.top : th.fill;
          if (ch === "#" && x > 0 && map[y][x - 1] !== "#" && map[y][x - 1] !== "D") sprite = th.left;
          if (ch === "#" && x < cols - 1 && map[y][x + 1] !== "#" && map[y][x + 1] !== "D") sprite = th.right;
          solids.push({ x: px, y: py, w: TILE, h: TILE, sprite: sprite });
        } else if (ch === "=") {
          solids.push({ x: px, y: py + 8, w: TILE, h: TILE - 8, sprite: th.cloudM, platform: true });
        } else if (ch === "^") {
          hazards.push({ x: px + 6, y: py + 20, w: TILE - 12, h: TILE - 20, sprite: "spikes" });
        } else if (ch === "C") {
          coins.push({ x: px + 8, y: py + 8, w: 32, h: 32, taken: false });
        } else if (ch === "S") {
          mobs.push({
            kind: "slime",
            x: px + 4,
            y: py + 8,
            w: 40,
            h: 40,
            vx: -50,
            minX: px - TILE * 2,
            maxX: px + TILE * 3,
            anim: 0,
          });
        } else if (ch === "B") {
          mobs.push({
            kind: "bee",
            x: px,
            y: py,
            w: 40,
            h: 36,
            baseY: py,
            phase: Math.random() * Math.PI * 2,
            anim: 0,
          });
        } else if (ch === "F") {
          flag = { x: px, y: py - 8, w: 40, h: 56 };
        } else if (ch === "P") {
          player.x = px + 6;
          player.y = py - 8;
        }
      }
    }

    return {
      name: L.name,
      theme: L.theme,
      cols: cols,
      rows: rows,
      width: cols * TILE,
      height: rows * TILE,
      solids: solids,
      hazards: hazards,
      coins: coins,
      mobs: mobs,
      flag: flag,
      player: player,
      won: false,
      dead: false,
    };
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function resolveSolid(p, s, axis) {
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

  function hurtPlayer() {
    var p = world.player;
    if (p.hurtT > 0 || world.won) return;
    p.hurtT = 1.1;
    state.hp--;
    playSfx(sfx.hurt, 0.4);
    syncHud();
    if (state.hp <= 0) {
      world.dead = true;
      toast("Ой… R — заново", 3);
      return;
    }
    p.vy = -380;
    p.vx = -p.facing * 180;
  }

  function syncHud() {
    document.getElementById("coins").textContent = String(state.coins);
    document.getElementById("lvl").textContent = String(state.level + 1);
    document.getElementById("lvlt").textContent = String(LEVELS.length);
    document.getElementById("hp").textContent = String(Math.max(0, state.hp));
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({ level: state.level, best: state.best, coins: state.coins }));
    } catch (_) {}
  }

  function startLevel(i) {
    state.level = i;
    world = buildLevel(i);
    camX = 0;
    syncHud();
    toast(LEVELS[i].name, 1.4);
    saveProgress();
  }

  function nextLevel() {
    playSfx(sfx.gem, 0.45);
    if (state.level >= LEVELS.length - 1) {
      state.best = Math.max(state.best, state.coins);
      toast("Победа! Монет: " + state.coins + " · R — сначала", 4);
      world.won = true;
      saveProgress();
      return;
    }
    state.level++;
    startLevel(state.level);
  }

  function update(dt) {
    if (!world || world.dead || world.won) return;
    var p = world.player;
    animT += dt;
    if (p.hurtT > 0) p.hurtT -= dt;

    var ix = 0;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1;
    if (Math.abs(stickX) > 0.2) ix = stickX > 0 ? 1 : -1;

    p.duck = !!(keys.KeyS || keys.ArrowDown) && p.onGround;
    if (p.duck) ix = 0;

    p.vx = ix * SPEED;
    if (ix) p.facing = ix;

    if ((jumpQueued || keys.Space || keys.KeyW || keys.ArrowUp || keys.KeyZ) && p.onGround && !p.duck) {
      p.vy = -JUMP;
      p.onGround = false;
      playSfx(sfx.jump, 0.3);
    }
    jumpQueued = false;

    p.vy += GRAV * dt;
    if (p.vy > 1200) p.vy = 1200;

    p.onGround = false;
    p.x += p.vx * dt;
    for (var i = 0; i < world.solids.length; i++) resolveSolid(p, world.solids[i], "x");
    p.y += p.vy * dt;
    for (var j = 0; j < world.solids.length; j++) resolveSolid(p, world.solids[j], "y");

    if (p.y > world.height + 80) {
      hurtPlayer();
      if (!world.dead) {
        p.x = TILE * 2;
        p.y = TILE;
        p.vx = p.vy = 0;
      }
    }

    for (var c = 0; c < world.coins.length; c++) {
      var coin = world.coins[c];
      if (coin.taken) continue;
      if (aabb(p, coin)) {
        coin.taken = true;
        state.coins++;
        playSfx(sfx.coin, 0.35);
        syncHud();
      }
    }

    for (var h = 0; h < world.hazards.length; h++) {
      if (aabb(p, world.hazards[h])) hurtPlayer();
    }

    for (var m = 0; m < world.mobs.length; m++) {
      var mob = world.mobs[m];
      if (mob.dead) continue;
      mob.anim += dt;
      if (mob.kind === "slime") {
        mob.x += mob.vx * dt;
        if (mob.x < mob.minX || mob.x > mob.maxX) mob.vx *= -1;
      } else if (mob.kind === "bee") {
        mob.phase += dt * 2.2;
        mob.y = mob.baseY + Math.sin(mob.phase) * 28;
        mob.x += Math.sin(mob.phase * 0.5) * 20 * dt;
      }
      if (aabb(p, mob)) {
        if (p.vy > 80 && p.y + p.h < mob.y + mob.h * 0.55) {
          mob.dead = true;
          p.vy = -420;
          playSfx(sfx.coin, 0.25);
          state.coins += 2;
          syncHud();
        } else {
          hurtPlayer();
        }
      }
    }

    if (world.flag && aabb(p, world.flag)) {
      world.won = true;
      nextLevel();
    }

    var target = p.x - canvas.width * 0.35;
    camX += (target - camX) * Math.min(1, dt * 6);
    if (camX < 0) camX = 0;
    if (camX > world.width - canvas.width) camX = Math.max(0, world.width - canvas.width);
  }

  function drawBg() {
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgHills) {
      var sx = (-camX * 0.15) % bgHills.width;
      for (var i = -1; i < 3; i++) {
        ctx.drawImage(bgHills, sx + i * bgHills.width, canvas.height - bgHills.height * 0.85, bgHills.width, bgHills.height * 0.85);
      }
    }
    if (bgClouds) {
      var cx = (-camX * 0.08) % bgClouds.width;
      ctx.globalAlpha = 0.55;
      for (var j = -1; j < 3; j++) {
        ctx.drawImage(bgClouds, cx + j * bgClouds.width, 20, bgClouds.width * 0.9, bgClouds.height * 0.7);
      }
      ctx.globalAlpha = 1;
    }
  }

  function heroFrame(p) {
    var color = "yellow";
    if (p.hurtT > 0 && Math.floor(animT * 20) % 2 === 0) return "character_" + color + "_hit";
    if (!p.onGround) return "character_" + color + "_jump";
    if (p.duck) return "character_" + color + "_duck";
    if (Math.abs(p.vx) > 20) {
      return "character_" + color + (Math.floor(animT * 10) % 2 === 0 ? "_walk_a" : "_walk_b");
    }
    return "character_" + color + "_idle";
  }

  function draw() {
    drawBg();
    if (!world) return;
    ctx.save();
    ctx.translate(-Math.floor(camX), 0);

    for (var i = 0; i < world.solids.length; i++) {
      var s = world.solids[i];
      tiles.draw(ctx, s.sprite, s.x, s.platform ? s.y - 8 : s.y, TILE, TILE, false);
    }
    for (var h = 0; h < world.hazards.length; h++) {
      var hz = world.hazards[h];
      tiles.draw(ctx, hz.sprite, hz.x - 6, hz.y - 20, TILE, TILE, false);
    }
    for (var c = 0; c < world.coins.length; c++) {
      var coin = world.coins[c];
      if (coin.taken) continue;
      var cn = Math.floor(animT * 8) % 2 === 0 ? "coin_gold" : "coin_gold_side";
      tiles.draw(ctx, cn, coin.x, coin.y + Math.sin(animT * 4 + c) * 3, 32, 32, false);
    }
    for (var m = 0; m < world.mobs.length; m++) {
      var mob = world.mobs[m];
      if (mob.dead) continue;
      var frame;
      if (mob.kind === "slime") {
        frame = Math.floor(mob.anim * 8) % 2 === 0 ? "slime_normal_walk_a" : "slime_normal_walk_b";
        enemies.draw(ctx, frame, mob.x, mob.y, mob.w, mob.h, mob.vx > 0);
      } else {
        frame = Math.floor(mob.anim * 10) % 2 === 0 ? "bee_a" : "bee_b";
        enemies.draw(ctx, frame, mob.x, mob.y, mob.w, mob.h, false);
      }
    }
    if (world.flag) {
      var ff = Math.floor(animT * 6) % 2 === 0 ? "flag_yellow_a" : "flag_yellow_b";
      tiles.draw(ctx, ff, world.flag.x, world.flag.y, 48, 48, false);
    }

    var p = world.player;
    var hf = heroFrame(p);
    var drawH = p.duck ? 44 : 56;
    var drawY = p.y + (p.h - drawH);
    chars.draw(ctx, hf, p.x - 10, drawY - 4, 56, drawH, p.facing < 0);

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
    draw();
    requestAnimationFrame(frame);
  }

  function resize() {
    var maxW = Math.min(1100, window.innerWidth);
    var maxH = window.innerHeight;
    var aspect = 960 / 540;
    var w = maxW;
    var h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    canvas.style.width = Math.floor(w) + "px";
    canvas.style.height = Math.floor(h) + "px";
  }

  window.addEventListener("resize", resize);
  resize();

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    ensureAudio();
    if (e.code === "KeyR") {
      state.hp = 3;
      if (world && world.won && state.level >= LEVELS.length - 1) {
        state.level = 0;
        state.coins = 0;
      }
      startLevel(state.level);
    }
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") e.preventDefault();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });
  window.addEventListener("pointerdown", ensureAudio, { once: true });

  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickActive = false;
  function setStick(cx, cy) {
    var r = pad.getBoundingClientRect();
    var dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
    var dy = (cy - (r.top + r.height / 2)) / (r.height / 2);
    var len = Math.hypot(dx, dy) || 1;
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    stickX = dx;
    knob.style.transform = "translate(" + dx * 28 + "px," + dy * 28 + "px)";
  }
  pad.addEventListener("pointerdown", function (e) {
    stickActive = true;
    pad.setPointerCapture(e.pointerId);
    setStick(e.clientX, e.clientY);
    ensureAudio();
  });
  pad.addEventListener("pointermove", function (e) {
    if (stickActive) setStick(e.clientX, e.clientY);
  });
  pad.addEventListener("pointerup", function () {
    stickActive = false;
    stickX = 0;
    knob.style.transform = "translate(0,0)";
  });
  document.getElementById("btn-jump").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    jumpQueued = true;
    ensureAudio();
  });

  toast("Загрузка Kenney New Platformer Pack…", 5);

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
    loadOgg(ASSET + "Sounds/sfx_jump.ogg"),
    loadOgg(ASSET + "Sounds/sfx_coin.ogg"),
    loadOgg(ASSET + "Sounds/sfx_hurt.ogg"),
    loadOgg(ASSET + "Sounds/sfx_gem.ogg"),
  ])
    .then(function (res) {
      chars = makeAtlas(res[0], parseAtlas(res[1]));
      tiles = makeAtlas(res[2], parseAtlas(res[3]));
      enemies = makeAtlas(res[4], parseAtlas(res[5]));
      bgHills = res[6];
      bgClouds = res[7];
      sfx.jump = res[8];
      sfx.coin = res[9];
      sfx.hurt = res[10];
      sfx.gem = res[11];
      startLevel(state.level);
      toast("WASD / стрелки · пробел — прыжок · прыгай на слаймов", 3);
      requestAnimationFrame(frame);
    })
    .catch(function (err) {
      console.error(err);
      toast("Не удалось загрузить спрайты", 8);
    });
})();
