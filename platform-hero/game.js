/**
 * Прыг-Герой v2 — Kenney New Platformer Pack (CC0).
 * Фикс: слаймы с гравитацией, нормальные платформы (не белые),
 * двойной прыжок, боссы, рестарт, помощница Ишка.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var ASSET = "../shared/kenney-platformer/";
  var TILE = 48;
  var GRAV = 2100;
  var JUMP = 720;
  var JUMP2 = 640;
  var SPEED = 280;
  var SAVE = "amal-platform-hero-v2";

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
        if (!f) return false;
        c.save();
        if (flip) {
          c.translate(dx + dw, dy);
          c.scale(-1, 1);
          c.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, dw, dh);
        } else {
          c.drawImage(img, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
        }
        c.restore();
        return true;
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

  /* # земля  D заливка  = платформа  C монета  S слайм  B пчела
     O босс  ^ шипы  F флаг  P игрок */
  var LEVELS = [
    {
      name: "Луга",
      theme: "grass",
      map: [
        "..........................................",
        "..........................................",
        "....................C.....................",
        "...............####.......................",
        "..........C................C..............",
        ".......####..............####.............",
        "..........................................",
        "....C.........#######...........C.........",
        "..........................................",
        "P......S..........S........B.......C...F..",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Платформы",
      theme: "grass",
      map: [
        "..........................................",
        ".........................C................",
        "......................====................",
        ".............C............................",
        "..........====...........C....====........",
        "..........................................",
        "....C..............====...................",
        "...........S......................C.......",
        "P......====..........B.....====.....F.....",
        "...........S..............................",
        "....^^^^..........^^^^....................",
        "##########################################",
      ],
    },
    {
      name: "Пещера",
      theme: "stone",
      map: [
        "..........................................",
        "......C...........C...........C...........",
        "....####........####........####..........",
        "..........................................",
        "..........................................",
        "........#######..........#######..........",
        "...........S................S.............",
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
        "...C.................====......C..........",
        "........S.................................",
        "P.....====..............^^^^........F.....",
        "..............S...........................",
        "....^^^^..................................",
        "##########################################",
      ],
    },
    {
      name: "Босс · Слайм",
      theme: "grass",
      map: [
        "..........................................",
        "..............C...........C...............",
        "...........====.........====..............",
        "..........................................",
        "......====...................====.........",
        "..........................................",
        "..........................................",
        ".........S.........O.........S............",
        "P.....................................F...",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Пустыня",
      theme: "sand",
      map: [
        "..........................................",
        ".......................C..................",
        "....................====..................",
        "..............C................C..........",
        "...........====.............====..........",
        "......C...........B..............C........",
        "...====........====..........====.........",
        "..........................................",
        "P..C..====..^^^^..====..^^^^..====..C..F..",
        ".........S..............S.................",
        "..........................................",
        "##########################################",
      ],
    },
    {
      name: "Улей",
      theme: "stone",
      map: [
        "..........................................",
        "........C.....B.....C.....B.....C.........",
        "......====.........====.........====......",
        "..........................................",
        "....====......====......====......====....",
        ".........B.................B..............",
        "..........................................",
        "......S......S......S......S..............",
        "P.....................................F...",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Босс · Финал",
      theme: "purple",
      map: [
        "..........................................",
        "...........C.................C............",
        "........====...............====...........",
        "..........................................",
        ".....====......B.....B......====..........",
        "..........................................",
        "..............S.....O.....S...............",
        "..........................................",
        "P.....................................F...",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
  ];

  var state = { level: 0, coins: 0, hp: 3, best: 0 };
  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      state.best = d.best || 0;
      if (d.level != null) state.level = Math.min(d.level, LEVELS.length - 1);
    }
  } catch (_) {}

  var world = null;
  var chars, tiles, enemies, bgHills, bgClouds;
  var camX = 0;
  var animT = 0;
  var keys = Object.create(null);
  var stickX = 0;
  var jumpQueued = false;

  function themeTiles(theme) {
    var p = theme || "grass";
    return {
      top: "terrain_" + p + "_block_top",
      fill: p === "grass" ? "terrain_dirt_block_center" : "terrain_" + p + "_block_center",
      left: "terrain_" + p + "_block_top_left",
      right: "terrain_" + p + "_block_top_right",
      platL: "terrain_" + p + "_horizontal_left",
      platM: "terrain_" + p + "_horizontal_middle",
      platR: "terrain_" + p + "_horizontal_right",
    };
  }

  function platSprite(th, map, x, y) {
    var left = x > 0 && map[y][x - 1] === "=";
    var right = x < map[y].length - 1 && map[y][x + 1] === "=";
    if (!left && right) return th.platL;
    if (left && !right) return th.platR;
    if (!left && !right) return th.platM;
    return th.platM;
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
    var player = {
      x: TILE * 2,
      y: TILE,
      vx: 0,
      vy: 0,
      w: 36,
      h: 52,
      onGround: false,
      facing: 1,
      hurtT: 0,
      duck: false,
      jumpsLeft: 2,
    };
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
          solids.push({
            x: px,
            y: py + 10,
            w: TILE,
            h: 22,
            sprite: platSprite(th, map, x, y),
            platform: true,
            drawY: py,
          });
        } else if (ch === "^") {
          hazards.push({ x: px + 6, y: py + 20, w: TILE - 12, h: TILE - 20, sprite: "spikes" });
        } else if (ch === "C") {
          coins.push({ x: px + 8, y: py + 8, w: 32, h: 32, taken: false });
        } else if (ch === "S") {
          mobs.push({
            kind: "slime",
            x: px + 4,
            y: py,
            w: 40,
            h: 40,
            vx: -55,
            vy: 0,
            onGround: false,
            anim: 0,
            hp: 1,
          });
        } else if (ch === "O") {
          mobs.push({
            kind: "boss",
            x: px,
            y: py - 20,
            w: 72,
            h: 72,
            vx: -70,
            vy: 0,
            onGround: false,
            anim: 0,
            hp: 5,
            maxHp: 5,
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
            hp: 1,
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

  function resolveSolid(ent, s, axis) {
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
    toast(LEVELS[i].name + (LEVELS[i].name.indexOf("Босс") >= 0 ? " · прыгай на голову!" : ""), 1.6);
    saveProgress();
  }

  function doRestart() {
    state.hp = 3;
    if (world && world.won && state.level >= LEVELS.length - 1) {
      state.level = 0;
      state.coins = 0;
    }
    startLevel(state.level);
    toast("Рестарт", 1);
  }

  function nextLevel() {
    playSfx(sfx.gem, 0.45);
    if (state.level >= LEVELS.length - 1) {
      state.best = Math.max(state.best, state.coins);
      toast("Победа! Монет: " + state.coins + " · Рестарт — сначала", 4);
      world.won = true;
      saveProgress();
      return;
    }
    state.level++;
    startLevel(state.level);
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
      toast("Проиграл · жми Рестарт или R", 3);
      return;
    }
    p.vy = -380;
    p.vx = -p.facing * 180;
  }

  function updateMobPhysics(mob, dt) {
    if (mob.kind === "bee") {
      mob.phase += dt * 2.2;
      mob.y = mob.baseY + Math.sin(mob.phase) * 28;
      mob.x += Math.sin(mob.phase * 0.5) * 20 * dt;
      return;
    }
    mob.vy += GRAV * dt;
    if (mob.vy > 1100) mob.vy = 1100;
    mob.onGround = false;
    mob.x += mob.vx * dt;
    for (var i = 0; i < world.solids.length; i++) resolveSolid(mob, world.solids[i], "x");
    mob.y += mob.vy * dt;
    for (var j = 0; j < world.solids.length; j++) resolveSolid(mob, world.solids[j], "y");
    if (mob.onGround) {
      var foot = { x: mob.vx > 0 ? mob.x + mob.w + 2 : mob.x - 4, y: mob.y + mob.h + 2, w: 4, h: 6 };
      var hasGround = false;
      for (var k = 0; k < world.solids.length; k++) {
        if (aabb(foot, world.solids[k])) {
          hasGround = true;
          break;
        }
      }
      if (!hasGround) mob.vx *= -1;
    }
    if (mob.y > world.height + 40) {
      mob.dead = true;
    }
  }

  function update(dt) {
    if (!world) return;
    if (world.dead || world.won) return;
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

    if (p.onGround) p.jumpsLeft = 2;
    if ((jumpQueued || keys.Space || keys.KeyW || keys.ArrowUp || keys.KeyZ) && p.jumpsLeft > 0 && !p.duck) {
      var first = p.onGround || p.jumpsLeft === 2;
      // allow mid-air second jump only if already used ground or left air
      if (p.onGround || p.jumpsLeft === 1) {
        p.vy = first && p.onGround ? -JUMP : -JUMP2;
        p.onGround = false;
        p.jumpsLeft--;
        playSfx(sfx.jump, 0.28);
        keys.Space = keys.KeyW = keys.ArrowUp = keys.KeyZ = false;
      }
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
        p.jumpsLeft = 2;
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
      updateMobPhysics(mob, dt);
      if (mob.dead) continue;
      if (aabb(p, mob)) {
        var stomp = p.vy > 60 && p.y + p.h < mob.y + mob.h * 0.55;
        if (stomp) {
          mob.hp--;
          p.vy = -420;
          playSfx(sfx.coin, 0.25);
          if (mob.hp <= 0) {
            mob.dead = true;
            state.coins += mob.kind === "boss" ? 15 : 2;
            if (mob.kind === "boss") toast("Босс повержен!", 1.5);
            syncHud();
          } else if (mob.kind === "boss") {
            toast("Босс ❤️ " + mob.hp + "/" + mob.maxHp, 1);
          }
        } else {
          hurtPlayer();
        }
      }
    }

    if (world.flag && aabb(p, world.flag)) {
      var bossesLeft = world.mobs.some(function (b) {
        return b.kind === "boss" && !b.dead;
      });
      if (bossesLeft) {
        toast("Сначала победи босса!", 1.2);
      } else {
        world.won = true;
        nextLevel();
      }
    }

    var target = p.x - canvas.width * 0.35;
    camX += (target - camX) * Math.min(1, dt * 6);
    if (camX < 0) camX = 0;
    if (camX > world.width - canvas.width) camX = Math.max(0, world.width - canvas.width);
  }

  function heroFrame(p) {
    if (p.hurtT > 0 && Math.floor(animT * 20) % 2 === 0) return "character_yellow_hit";
    if (!p.onGround) return "character_yellow_jump";
    if (p.duck) return "character_yellow_duck";
    if (Math.abs(p.vx) > 20) {
      return "character_yellow" + (Math.floor(animT * 10) % 2 === 0 ? "_walk_a" : "_walk_b");
    }
    return "character_yellow_idle";
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
      ctx.globalAlpha = 0.5;
      for (var j = -1; j < 3; j++) {
        ctx.drawImage(bgClouds, cx + j * bgClouds.width, 20, bgClouds.width * 0.9, bgClouds.height * 0.7);
      }
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    drawBg();
    if (!world) return;
    ctx.save();
    ctx.translate(-Math.floor(camX), 0);

    for (var i = 0; i < world.solids.length; i++) {
      var s = world.solids[i];
      var dy = s.platform ? s.drawY : s.y;
      var ok = tiles.draw(ctx, s.sprite, s.x, dy, TILE, TILE, false);
      if (!ok) {
        ctx.fillStyle = "#5a8f4a";
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
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
      if (mob.kind === "bee") {
        frame = Math.floor(mob.anim * 10) % 2 === 0 ? "bee_a" : "bee_b";
        enemies.draw(ctx, frame, mob.x, mob.y, mob.w, mob.h, false);
      } else if (mob.kind === "boss") {
        frame = Math.floor(mob.anim * 6) % 2 === 0 ? "slime_spike_walk_a" : "slime_spike_walk_b";
        enemies.draw(ctx, frame, mob.x, mob.y, mob.w, mob.h, mob.vx > 0);
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(mob.x, mob.y - 12, mob.w, 6);
        ctx.fillStyle = "#f87171";
        ctx.fillRect(mob.x, mob.y - 12, mob.w * (mob.hp / mob.maxHp), 6);
      } else {
        frame = Math.floor(mob.anim * 8) % 2 === 0 ? "slime_normal_walk_a" : "slime_normal_walk_b";
        enemies.draw(ctx, frame, mob.x, mob.y, mob.w, mob.h, mob.vx > 0);
      }
    }
    if (world.flag) {
      var ff = Math.floor(animT * 6) % 2 === 0 ? "flag_yellow_a" : "flag_yellow_b";
      tiles.draw(ctx, ff, world.flag.x, world.flag.y, 48, 48, false);
    }

    var p = world.player;
    var hf = heroFrame(p);
    var drawH = p.duck ? 44 : 56;
    chars.draw(ctx, hf, p.x - 10, p.y + (p.h - drawH) - 4, 56, drawH, p.facing < 0);

    ctx.restore();
  }

  /* —— Ишка —— */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function ishkaReply(raw) {
    var n = (raw || "").toLowerCase();
    if (/привет|здрав|hello/.test(n)) return pick(["Привет! Я Ишка — помощница по уровням.", "Йо! Спрашивай про слаймов, боссов и прыжки."]);
    if (/слиз|почему|воздух|висит|лета/.test(n))
      return pick([
        "Раньше слаймы ставились в воздухе без пола — баг. Теперь у них гравитация, ходят по земле.",
        "Слизь больше не «висит»: падает и ходит по платформам. Прыгай ей на голову!",
      ]);
    if (/босс|boss/.test(n))
      return pick([
        "Боссы — большие колючие слаймы. Прыгай на голову несколько раз, следи за полоской HP.",
        "На уровнях с боссом флаг не откроется, пока босс жив. Дабл-прыжок помогает.",
      ]);
    if (/как пройти|подсказ|помощь|что делать/.test(n))
      return pick([
        "WASD · пробел/прыг два раза в воздухе · на врагов сверху. Рестарт справа сверху.",
        "Собирай монеты, обходи шипы, на боссе — несколько прыжков на голову, потом к флагу.",
      ]);
    if (/дом|дома|квартир|мама|семья/.test(n))
      return pick([
        "Дома можно отдохнуть и потом продолжить уровень — прогресс сохраняется.",
        "Домашки важнее игры, но одна катка в Прыг-Героя — норм разрядка 😊",
      ]);
    if (/двойн|прыж|дабл/.test(n)) return "Двойной прыжок: первый с земли, второй в воздухе. Удобно до платформ.";
    if (/рестарт|проигр/.test(n)) return "Кнопка «Рестарт» или клавиша R — сразу с текущего уровня, с полным HP.";
    if (/кто ты|ишка/.test(n)) return "Я Ишка — маленькая помощница к этому 2D. Не босс, а подсказчик.";
    return pick([
      "Могу про слаймов, боссов, двойной прыжок и рестарт. Спроси!",
      "Не поняла. Нажми быстрые кнопки или спроси «как пройти».",
    ]);
  }

  function aiLog(cls, text) {
    var log = document.getElementById("ai-log");
    var div = document.createElement("div");
    div.className = cls;
    div.textContent = (cls === "me" ? "Ты: " : "Ишка: ") + text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function askIshka(q) {
    q = (q || "").trim();
    if (!q) return;
    aiLog("me", q);
    var a = ishkaReply(q);
    aiLog("bot", a);
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(a);
        u.lang = "ru-RU";
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
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
    if (e.code === "KeyR") doRestart();
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") e.preventDefault();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });
  window.addEventListener("pointerdown", ensureAudio, { once: true });

  document.getElementById("btn-restart").onclick = doRestart;
  document.getElementById("btn-ai").onclick = function () {
    document.getElementById("ai-panel").classList.add("open");
    document.getElementById("btn-ai").style.display = "none";
  };
  document.getElementById("ai-close").onclick = function () {
    document.getElementById("ai-panel").classList.remove("open");
    document.getElementById("btn-ai").style.display = "";
  };
  document.getElementById("ai-send").onclick = function () {
    var inp = document.getElementById("ai-input");
    askIshka(inp.value);
    inp.value = "";
  };
  document.getElementById("ai-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      askIshka(this.value);
      this.value = "";
    }
  });
  document.querySelectorAll("#ai-quick button").forEach(function (b) {
    b.onclick = function () {
      askIshka(b.getAttribute("data-q"));
    };
  });

  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickActive = false;
  function setStick(cx, cy) {
    var r = pad.getBoundingClientRect();
    var dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
    var len = Math.hypot(dx, (cy - (r.top + r.height / 2)) / (r.height / 2)) || 1;
    if (len > 1) dx /= len;
    stickX = dx;
    knob.style.transform = "translate(" + dx * 28 + "px,0)";
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

  toast("Загрузка…", 4);
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
      aiLog("bot", "Привет! Слаймы больше не висят в воздухе. Спроси «как пройти» или «босс».");
      toast("Двойной прыжок · Рестарт · Ишка справа", 3);
      requestAnimationFrame(frame);
    })
    .catch(function (err) {
      console.error(err);
      toast("Ошибка загрузки спрайтов", 8);
    });
})();
