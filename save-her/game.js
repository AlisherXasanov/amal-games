/**
 * Спаси её — комикс-пролог + 2D приключение (Kenney CC0).
 * Украли жену → обучение → тематические уровни → боссы.
 * Деньги-снаряды, комбо, ломаемые блоки, кейсы/питомцы, бот-союзник, P2.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var ASSET = "../shared/kenney-platformer/";
  var TILE = 48;
  var GRAV = 2100;
  var JUMP = 720;
  var JUMP2 = 640;
  var SPEED = 270;
  var SAVE = "amal-save-her-v2";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var comicC = document.getElementById("comic-c");
  var cctx = comicC.getContext("2d");

  var toastEl = document.getElementById("toast");
  var hintEl = document.getElementById("hint");
  var toastT = 0;
  var hintT = 0;
  function toast(msg, t) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    toastT = t == null ? 2 : t;
  }
  function hint(msg, t) {
    hintEl.textContent = msg;
    hintEl.style.display = "block";
    hintT = t == null ? 3.5 : t;
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
    while ((m = re.exec(xml))) f[m[1]] = { x: +m[2], y: +m[3], w: +m[4], h: +m[5] };
    return f;
  }
  function makeAtlas(img, frames) {
    return {
      img: img,
      frames: frames,
      draw: function (c, name, dx, dy, dw, dh, flip) {
        var fr = frames[name];
        if (!fr) return false;
        c.save();
        if (flip) {
          c.translate(dx + dw, dy);
          c.scale(-1, 1);
          c.drawImage(img, fr.x, fr.y, fr.w, fr.h, 0, 0, dw, dh);
        } else c.drawImage(img, fr.x, fr.y, fr.w, fr.h, dx, dy, dw, dh);
        c.restore();
        return true;
      },
    };
  }

  /* ——— Комикс на спрайтах Kenney (жёлтый герой + розовая жена) ——— */
  var COMIC = [
    { title: "Спокойная жизнь", text: "Герой жил тихо со своей женой. Дом, сад, смех — всё было хорошо." },
    { title: "Утро", text: "Они пили чай. Он обещал: «Сегодня только мы вдвоём»." },
    { title: "Тень", text: "Вдруг — вспышка магии. Злодеи ворвались и схватили её." },
    { title: "Пропала", text: "Осталась только её вещица и записка: «Заберишь — если дойдёшь»." },
    { title: "Клятва", text: "Он взял монеты как оружие и отправился в путь. Спасти её — любой ценой." },
    { title: "Обучение", text: "Сначала — школа боя. Потом луга, магия, война… и клетка с ней." },
  ];
  var comicI = 0;

  /** Нарисовать кадр персонажа Kenney (центр по низу ног). */
  function drawKenney(c, atlas, frame, x, y, size, flip) {
    size = size || 128;
    if (!atlas || !atlas.draw(c, frame, x - size / 2, y - size, size, size, !!flip)) {
      c.fillStyle = "#f9a8d4";
      c.fillRect(x - 20, y - 60, 40, 60);
    }
  }

  function drawGroundStrip(c, y, theme) {
    theme = theme || "grass";
    if (!tiles) {
      c.fillStyle = "#4d7c0f";
      c.fillRect(0, y, comicC.width, comicC.height - y);
      return;
    }
    for (var x = 0; x < comicC.width; x += 64) {
      tiles.draw(c, "terrain_" + theme + "_block_top", x, y, 64, 64, false);
      tiles.draw(c, theme === "grass" ? "terrain_dirt_block_center" : "terrain_" + theme + "_block_center", x, y + 64, 64, 64, false);
    }
  }

  function drawComicPanel(i) {
    var w = comicC.width;
    var h = comicC.height;
    cctx.clearRect(0, 0, w, h);
    cctx.imageSmoothingEnabled = false;

    // фон
    if (i <= 1 && bgHills) {
      cctx.fillStyle = "#87ceeb";
      cctx.fillRect(0, 0, w, h);
      cctx.drawImage(bgHills, 0, h - 180, w, 160);
    } else if (i === 2) {
      var g2 = cctx.createLinearGradient(0, 0, 0, h);
      g2.addColorStop(0, "#312e81");
      g2.addColorStop(1, "#7f1d1d");
      cctx.fillStyle = g2;
      cctx.fillRect(0, 0, w, h);
    } else if (i === 3) {
      cctx.fillStyle = "#0f172a";
      cctx.fillRect(0, 0, w, h);
    } else if (i === 4 || i === 5) {
      var g3 = cctx.createLinearGradient(0, 0, 0, h);
      g3.addColorStop(0, "#4c1d95");
      g3.addColorStop(1, "#be185d");
      cctx.fillStyle = g3;
      cctx.fillRect(0, 0, w, h);
    } else {
      cctx.fillStyle = "#87ceeb";
      cctx.fillRect(0, 0, w, h);
    }

    var groundY = h - 100;

    if (i === 0 || i === 1) {
      drawGroundStrip(cctx, groundY, "grass");
      // домик из тайлов
      if (tiles) {
        for (var hx = 70; hx < 280; hx += 48) {
          tiles.draw(cctx, "bricks_brown", hx, groundY - 96, 48, 48, false);
          tiles.draw(cctx, "bricks_brown", hx, groundY - 48, 48, 48, false);
        }
        tiles.draw(cctx, "terrain_grass_block_top", 70, groundY - 120, 48, 48, false);
        tiles.draw(cctx, "terrain_grass_block_top", 118, groundY - 120, 48, 48, false);
        tiles.draw(cctx, "terrain_grass_block_top", 166, groundY - 120, 48, 48, false);
        tiles.draw(cctx, "terrain_grass_block_top", 214, groundY - 120, 48, 48, false);
      }
      // герой (жёлтый) + жена (розовая) — настоящие спрайты Kenney
      drawKenney(cctx, chars, i === 1 ? "character_yellow_front" : "character_yellow_idle", 340, groundY + 8, 140, false);
      drawKenney(cctx, chars, i === 1 ? "character_pink_front" : "character_pink_idle", 470, groundY + 8, 140, false);
      cctx.fillStyle = "#fb7185";
      cctx.font = "900 36px system-ui";
      cctx.fillText("❤", 390, groundY - 110);
      if (i === 1 && tiles) {
        tiles.draw(cctx, "coin_gold", 400, groundY - 40, 28, 28, false);
      }
    } else if (i === 2) {
      drawGroundStrip(cctx, groundY, "purple");
      drawKenney(cctx, chars, "character_yellow_hit", 160, groundY + 8, 130, false);
      // злодеи тянут жену
      drawKenney(cctx, chars, "character_purple_walk_a", 360, groundY + 8, 120, false);
      drawKenney(cctx, chars, "character_pink_hit", 480, groundY - 10, 130, false);
      drawKenney(cctx, chars, "character_beige_walk_b", 560, groundY + 8, 120, true);
      if (enemies) {
        enemies.draw(cctx, "slime_spike_walk_a", 250, groundY - 50, 64, 64, false);
      }
      // магическая вспышка
      cctx.strokeStyle = "rgba(232,121,249,0.9)";
      cctx.lineWidth = 5;
      cctx.beginPath();
      cctx.arc(420, groundY - 80, 50 + (comicI % 2) * 8, 0, Math.PI * 2);
      cctx.stroke();
    } else if (i === 3) {
      drawGroundStrip(cctx, groundY, "stone");
      drawKenney(cctx, chars, "character_yellow_duck", 200, groundY + 8, 140, false);
      // «оставшаяся» розовая — силуэт / hit
      cctx.globalAlpha = 0.35;
      drawKenney(cctx, chars, "character_pink_idle", 420, groundY + 8, 120, false);
      cctx.globalAlpha = 1;
      if (tiles) {
        tiles.draw(cctx, "flag_red_a", 500, groundY - 40, 48, 48, false);
      }
      cctx.fillStyle = "#fde68a";
      cctx.font = "800 18px system-ui";
      cctx.fillText("«Заберишь — если дойдёшь»", 280, 120);
    } else if (i === 4) {
      drawGroundStrip(cctx, groundY, "grass");
      drawKenney(cctx, chars, "character_yellow_jump", 180, groundY - 20, 150, false);
      if (tiles) {
        for (var k = 0; k < 6; k++) {
          tiles.draw(cctx, "coin_gold", 300 + k * 42, groundY - 60 - (k % 2) * 20, 36, 36, false);
        }
      }
      cctx.fillStyle = "#fff";
      cctx.font = "900 22px system-ui";
      cctx.fillText("Монеты = оружие", 320, 100);
    } else {
      drawGroundStrip(cctx, groundY, "stone");
      drawKenney(cctx, chars, "character_yellow_idle", 160, groundY + 8, 140, false);
      // клетка
      cctx.strokeStyle = "#fbbf24";
      cctx.lineWidth = 4;
      cctx.strokeRect(380, groundY - 150, 160, 160);
      for (var bx = 0; bx < 4; bx++) {
        cctx.beginPath();
        cctx.moveTo(400 + bx * 35, groundY - 150);
        cctx.lineTo(400 + bx * 35, groundY + 10);
        cctx.stroke();
      }
      drawKenney(cctx, chars, "character_pink_front", 460, groundY + 8, 130, false);
      if (tiles) tiles.draw(cctx, "flag_yellow_a", 560, groundY - 40, 48, 48, false);
      cctx.fillStyle = "#fff";
      cctx.font = "900 18px system-ui";
      cctx.fillText("Цель: спасти её", 380, 80);
    }

    // заголовок кадра
    cctx.fillStyle = "rgba(0,0,0,0.55)";
    cctx.fillRect(12, 12, 280, 40);
    cctx.fillStyle = "#fff";
    cctx.font = "900 22px system-ui";
    cctx.fillText(COMIC[i].title, 24, 40);
  }

  function showComic() {
    document.getElementById("comic").classList.remove("hide");
    document.getElementById("comic-text").textContent = COMIC[comicI].text;
    drawComicPanel(comicI);
    document.getElementById("comic-next").textContent = comicI >= COMIC.length - 1 ? "Начать обучение ▶" : "Далее ▶";
  }

  /* ——— Уровни ———
     # D = платформа  C монета  S слайм  B пчела  O босс
     X ломкий блок  K кейс  G гель-моб  F флаг/выход
     W клетка с женой  P игрок  2 игрок2  A союзник
     H подсказка-зона (мета в level.hints)
  */
  var LEVELS = [
    {
      name: "Обучение",
      theme: "grass",
      tutorial: true,
      map: [
        "..........................................",
        "..........................................",
        "..............C...........................",
        "...........====...........................",
        "..........................................",
        ".....X....K...............................",
        "..........................................",
        "P..A.................S...............F....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
      hints: [
        { at: 2, text: "A/D — ходить · ПРОБЕЛ — прыжок (можно два раза)" },
        { at: 8, text: "J — удар · дважды J подряд = КОМБО" },
        { at: 14, text: "K — кинуть монету во врага (нужны 💰)" },
        { at: 20, text: "Ломай блоки X ударом · кейс K даёт питомца" },
      ],
    },
    {
      name: "Луга",
      theme: "grass",
      map: [
        "..........................................",
        ".............C.............C..............",
        "..........====..........====..............",
        "..........................................",
        "....====......X....K....====..............",
        "..........................................",
        "P.....S.....G.....S.....B............F....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Магия",
      theme: "purple",
      magic: true,
      map: [
        "..........................................",
        "........C.....====.....C..................",
        ".....====.............====................",
        "...........................K..............",
        "....X......====......====......X..........",
        "..........................................",
        "P....G....S....G....B....G...........F....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Войнушка",
      theme: "stone",
      war: true,
      map: [
        "..........................................",
        "......C...........C...........C...........",
        "....====........====........====..........",
        "..........................................",
        ".......X....K.............X...............",
        "..........................................",
        "P..A...S.....S.....G.....S...........F....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Блоки и кейсы",
      theme: "sand",
      map: [
        "..........................................",
        "...........C.....K.....C..................",
        "........====...====...====................",
        ".....X.............X.............X........",
        "..........................................",
        "....====.....====.....====.....====.......",
        "P.....G.....S.....G.....B............F....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Босс · Страж",
      theme: "grass",
      map: [
        "..........................................",
        ".........C...............C................",
        "......====.............====...............",
        "..........................................",
        "....====.......K.........====.............",
        "..........................................",
        "P........S......O......S.............F....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Магия 2",
      theme: "purple",
      magic: true,
      map: [
        "..........................................",
        "....C...====...C...====...C...====........",
        "..........................................",
        "..X....K....X....K....X...................",
        "....====.....====.....====.....====.......",
        "..........................................",
        "P..G..B..G..S..G..B..................F....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
    {
      name: "Спасение",
      theme: "stone",
      map: [
        "..........................................",
        ".............C.....K.....C................",
        "..........====.........====...............",
        "..........................................",
        ".......====.....O.....====................",
        "..........................................",
        "P..A...S...........S.................W....",
        "##########################################",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ],
    },
  ];

  var state = {
    level: 0,
    coins: 12,
    hp: 5,
    pet: null,
    coop: false,
    seenComic: false,
  };
  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      if (d.level != null) state.level = Math.min(d.level, LEVELS.length - 1);
      state.coins = d.coins != null ? d.coins : state.coins;
      state.pet = d.pet || null;
      state.seenComic = !!d.seenComic;
    }
  } catch (_) {}

  var world = null;
  var chars, tiles, enemies, bgHills;
  var camX = 0;
  var animT = 0;
  var keys = Object.create(null);
  var stickX = 0;
  var jumpQ = false;
  var hitQ = false;
  var throwQ = false;
  var projectiles = [];
  var particles = [];
  var warGuys = [];

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

  function makePlayer(x, y, color, isP2) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      w: 36,
      h: 52,
      onGround: false,
      facing: 1,
      hurtT: 0,
      jumpsLeft: 2,
      color: color,
      isP2: !!isP2,
      combo: 0,
      comboT: 0,
      attackT: 0,
      hitBox: null,
    };
  }

  function buildLevel(idx) {
    var L = LEVELS[idx];
    var map = L.map;
    var rows = map.length;
    var cols = map[0].length;
    var th = themeTiles(L.theme);
    var solids = [];
    var hazards = [];
    var coins = [];
    var mobs = [];
    var breaks = [];
    var cases = [];
    var flag = null;
    var wife = null;
    var ally = null;
    var p1 = makePlayer(TILE * 2, TILE, "yellow", false);
    var p2 = null;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var ch = map[y][x];
        var px = x * TILE;
        var py = y * TILE;
        if (ch === "#" || ch === "D") {
          var sp = ch === "#" ? th.top : th.fill;
          if (ch === "#" && x > 0 && map[y][x - 1] !== "#" && map[y][x - 1] !== "D") sp = th.left;
          if (ch === "#" && x < cols - 1 && map[y][x + 1] !== "#" && map[y][x + 1] !== "D") sp = th.right;
          solids.push({ x: px, y: py, w: TILE, h: TILE, sprite: sp });
        } else if (ch === "=") {
          var left = x > 0 && map[y][x - 1] === "=";
          var right = x < cols - 1 && map[y][x + 1] === "=";
          var ps = !left && right ? th.platL : left && !right ? th.platR : th.platM;
          solids.push({ x: px, y: py + 10, w: TILE, h: 22, sprite: ps, platform: true, drawY: py });
        } else if (ch === "C") coins.push({ x: px + 8, y: py + 8, w: 32, h: 32, taken: false });
        else if (ch === "S")
          mobs.push({ kind: "slime", x: px + 4, y: py, w: 40, h: 40, vx: -50, vy: 0, hp: 2, anim: 0 });
        else if (ch === "G")
          mobs.push({ kind: "gel", x: px + 4, y: py, w: 42, h: 36, vx: -40, vy: 0, hp: 3, anim: 0, gel: true });
        else if (ch === "B")
          mobs.push({ kind: "bee", x: px, y: py, w: 40, h: 36, baseY: py, phase: Math.random() * 6, hp: 1, anim: 0 });
        else if (ch === "O")
          mobs.push({ kind: "boss", x: px, y: py - 24, w: 76, h: 76, vx: -60, vy: 0, hp: 8, maxHp: 8, anim: 0 });
        else if (ch === "X") breaks.push({ x: px, y: py, w: TILE, h: TILE, hp: 2 });
        else if (ch === "K") cases.push({ x: px + 6, y: py + 6, w: 36, h: 36, open: false });
        else if (ch === "F") flag = { x: px, y: py - 8, w: 40, h: 56 };
        else if (ch === "W") wife = { x: px, y: py - 16, w: 48, h: 64 };
        else if (ch === "P") {
          p1.x = px + 6;
          p1.y = py - 8;
        } else if (ch === "2") {
          p2 = makePlayer(px + 6, py - 8, "pink", true);
        } else if (ch === "A") {
          ally = makePlayer(px + 6, py - 8, "green", false);
          ally.isAlly = true;
        }
      }
    }
    if (!ally && L.war) {
      ally = makePlayer(p1.x + 60, p1.y, "green", false);
      ally.isAlly = true;
    }
    projectiles = [];
    particles = [];
    warGuys = [];
    if (L.war) {
      for (var i = 0; i < 6; i++) {
        warGuys.push({
          x: 200 + i * 90,
          y: (rows - 2) * TILE - 40,
          facing: i % 2 ? 1 : -1,
          anim: Math.random(),
          side: i % 2,
        });
      }
    }

    return {
      L: L,
      width: cols * TILE,
      height: rows * TILE,
      solids: solids,
      coins: coins,
      mobs: mobs,
      breaks: breaks,
      cases: cases,
      flag: flag,
      wife: wife,
      p1: p1,
      p2: p2,
      ally: ally,
      won: false,
      dead: false,
      hintI: 0,
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
    document.getElementById("hp").textContent = String(Math.max(0, state.hp));
    document.getElementById("lvl").textContent = String(state.level + 1);
    document.getElementById("lvlt").textContent = String(LEVELS.length);
    document.getElementById("pet").textContent = state.pet ? state.pet : "нет";
    document.getElementById("ally").textContent = world && world.ally ? "бот с тобой" : "—";
  }

  function save() {
    try {
      localStorage.setItem(
        SAVE,
        JSON.stringify({ level: state.level, coins: state.coins, pet: state.pet, seenComic: state.seenComic })
      );
    } catch (_) {}
  }

  function showHeartBreak() {
    var fx = document.getElementById("heart-fx");
    fx.classList.remove("break");
    fx.classList.add("show");
    // force reflow
    void fx.offsetWidth;
    fx.classList.add("break");
    setTimeout(function () {
      fx.classList.remove("show", "break");
    }, 700);
  }

  function hurt() {
    if (!world || world.p1.hurtT > 0 || world.won) return;
    world.p1.hurtT = 1.1;
    state.hp--;
    showHeartBreak();
    syncHud();
    if (state.hp <= 0) {
      world.dead = true;
      toast("Проиграл · Рестарт", 3);
    } else {
      world.p1.vy = -360;
      world.p1.vx = -world.p1.facing * 160;
    }
  }

  function spawnBurst(x, y, color) {
    for (var i = 0; i < 8; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 220,
        vy: -Math.random() * 200 - 40,
        t: 0.5 + Math.random() * 0.4,
        color: color || "#fbbf24",
      });
    }
  }

  function doAttack(p) {
    if (p.attackT > 0) return;
    p.attackT = 0.22;
    if (p.comboT > 0) p.combo = Math.min(2, p.combo + 1);
    else p.combo = 1;
    p.comboT = 0.55;
    var reach = p.combo >= 2 ? 52 : 38;
    var dmg = p.combo >= 2 ? 2 : 1;
    p.hitBox = {
      x: p.facing > 0 ? p.x + p.w : p.x - reach,
      y: p.y + 8,
      w: reach,
      h: 36,
      dmg: dmg,
      life: 0.12,
    };
    if (p.combo >= 2) toast("КОМБО!", 0.6);
  }

  function doThrow(p) {
    if (state.coins < 1) {
      toast("Нет монет!", 1);
      return;
    }
    state.coins--;
    syncHud();
    projectiles.push({
      x: p.x + p.w / 2,
      y: p.y + 18,
      vx: p.facing * 420,
      vy: -40,
      r: 10,
      life: 1.6,
      from: p,
    });
  }

  function damageMob(mob, dmg, fromX) {
    mob.hp -= dmg;
    mob.vx = (mob.x > fromX ? 1 : -1) * 120;
    spawnBurst(mob.x + mob.w / 2, mob.y + mob.h / 2, mob.gel ? "#67e8f9" : "#86efac");
    if (mob.gel && mob.hp > 0 && Math.random() < 0.4) {
      toast("Гель застыл!", 0.8);
      mob.stun = 1.2;
    }
    if (mob.hp <= 0) {
      mob.dead = true;
      state.coins += mob.kind === "boss" ? 10 : 2;
      syncHud();
      if (mob.kind === "boss") toast("Страж пал!", 1.5);
    }
  }

  function openCase(c) {
    if (c.open) return;
    c.open = true;
    var pets = ["🐝 пчёлка", "🐌 улитка", "🐸 лягушка"];
    state.pet = pets[Math.floor(Math.random() * pets.length)];
    toast("Кейс! Питомец: " + state.pet, 2);
    syncHud();
    save();
  }

  function startLevel(i) {
    state.level = i;
    world = buildLevel(i);
    camX = 0;
    syncHud();
    toast(LEVELS[i].name, 1.5);
    if (LEVELS[i].tutorial) hint("Смотри подсказки снизу · J удар · K монета", 4);
    save();
  }

  function nextLevel() {
    if (state.level >= LEVELS.length - 1) {
      toast("Ты спас её! Вместе снова ❤  Рестарт — сначала", 5);
      world.won = true;
      save();
      return;
    }
    state.level++;
    startLevel(state.level);
  }

  function doRestart() {
    state.hp = 5;
    if (world && world.won && state.level >= LEVELS.length - 1) {
      state.level = 0;
      state.coins = 12;
    }
    startLevel(state.level);
  }

  function controlPlayer(p, dt, left, right, jump, hit, thrw) {
    if (!p) return;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.comboT > 0) p.comboT -= dt;
    else p.combo = 0;
    if (p.attackT > 0) p.attackT -= dt;
    if (p.hitBox) {
      p.hitBox.life -= dt;
      if (p.hitBox.life <= 0) p.hitBox = null;
    }

    var ix = 0;
    if (left) ix -= 1;
    if (right) ix += 1;
    if (!p.isAlly && !p.isP2 && Math.abs(stickX) > 0.2) ix = stickX > 0 ? 1 : -1;
    p.vx = ix * SPEED;
    if (ix) p.facing = ix;

    if (p.onGround) p.jumpsLeft = 2;
    if (jump && p.jumpsLeft > 0 && (p.onGround || p.jumpsLeft === 1)) {
      p.vy = p.onGround ? -JUMP : -JUMP2;
      p.onGround = false;
      p.jumpsLeft--;
    }
    if (hit) doAttack(p);
    if (thrw) doThrow(p);

    p.vy += GRAV * dt;
    if (p.vy > 1200) p.vy = 1200;
    p.onGround = false;
    p.x += p.vx * dt;
    for (var i = 0; i < world.solids.length; i++) resolveSolid(p, world.solids[i], "x");
    for (var b = 0; b < world.breaks.length; b++) {
      if (world.breaks[b].hp > 0) resolveSolid(p, world.breaks[b], "x");
    }
    p.y += p.vy * dt;
    for (var j = 0; j < world.solids.length; j++) resolveSolid(p, world.solids[j], "y");
    for (var b2 = 0; b2 < world.breaks.length; b2++) {
      if (world.breaks[b2].hp > 0) resolveSolid(p, world.breaks[b2], "y");
    }
  }

  function updateAlly(dt) {
    var a = world.ally;
    if (!a) return;
    var target = null;
    var best = 9999;
    for (var i = 0; i < world.mobs.length; i++) {
      var m = world.mobs[i];
      if (m.dead) continue;
      var d = Math.abs(m.x - a.x);
      if (d < best) {
        best = d;
        target = m;
      }
    }
    var follow = world.p1;
    var left = false;
    var right = false;
    var jump = false;
    var hit = false;
    if (target && best < 220) {
      if (target.x < a.x - 10) left = true;
      if (target.x > a.x + 10) right = true;
      if (best < 50) hit = Math.random() < 0.08;
      if (!a.onGround && Math.random() < 0.01) jump = true;
      if (target.y + 20 < a.y && a.onGround) jump = true;
    } else {
      if (follow.x < a.x - 70) left = true;
      if (follow.x > a.x + 70) right = true;
    }
    controlPlayer(a, dt, left, right, jump, hit, false);
  }

  function updateMob(mob, dt) {
    if (mob.dead) return;
    mob.anim += dt;
    if (mob.stun > 0) {
      mob.stun -= dt;
      return;
    }
    if (mob.kind === "bee") {
      mob.phase += dt * 2.2;
      mob.y = mob.baseY + Math.sin(mob.phase) * 26;
      return;
    }
    mob.vy += GRAV * dt;
    mob.onGround = false;
    mob.x += mob.vx * dt;
    for (var i = 0; i < world.solids.length; i++) resolveSolid(mob, world.solids[i], "x");
    mob.y += mob.vy * dt;
    for (var j = 0; j < world.solids.length; j++) resolveSolid(mob, world.solids[j], "y");
    if (mob.onGround) {
      var foot = { x: mob.vx > 0 ? mob.x + mob.w + 2 : mob.x - 4, y: mob.y + mob.h + 2, w: 4, h: 6 };
      var ok = false;
      for (var k = 0; k < world.solids.length; k++) if (aabb(foot, world.solids[k])) ok = true;
      if (!ok) mob.vx *= -1;
    }
  }

  function update(dt) {
    if (!world || world.dead || world.won) return;
    animT += dt;

    var p1 = world.p1;
    controlPlayer(
      p1,
      dt,
      keys.KeyA || keys.ArrowLeft,
      keys.KeyD || keys.ArrowRight,
      jumpQ || keys.Space || keys.KeyW,
      hitQ || keys.KeyJ || keys.KeyZ,
      throwQ || keys.KeyK || keys.KeyX
    );
    jumpQ = hitQ = throwQ = false;
    keys.Space = keys.KeyW = false;

    if (world.p2) {
      controlPlayer(
        world.p2,
        dt,
        keys.ArrowLeft,
        keys.ArrowRight,
        keys.Enter || keys.ArrowUp,
        keys.Numpad1 || keys.KeyU,
        keys.Numpad2 || keys.KeyI
      );
    }
    updateAlly(dt);

    if (p1.y > world.height + 80) {
      hurt();
      if (!world.dead) {
        p1.x = TILE * 2;
        p1.y = TILE;
        p1.vx = p1.vy = 0;
      }
    }

    // coins
    for (var c = 0; c < world.coins.length; c++) {
      var coin = world.coins[c];
      if (!coin.taken && aabb(p1, coin)) {
        coin.taken = true;
        state.coins++;
        syncHud();
      }
    }

    // cases pickup / hit
    for (var k = 0; k < world.cases.length; k++) {
      var cs = world.cases[k];
      if (!cs.open && aabb(p1, cs)) openCase(cs);
    }

    // hitboxes vs breaks & mobs
    var hitters = [p1, world.p2, world.ally];
    for (var h = 0; h < hitters.length; h++) {
      var pl = hitters[h];
      if (!pl || !pl.hitBox) continue;
      for (var br = 0; br < world.breaks.length; br++) {
        var blk = world.breaks[br];
        if (blk.hp <= 0) continue;
        if (aabb(pl.hitBox, blk)) {
          blk.hp -= pl.hitBox.dmg;
          spawnBurst(blk.x + 24, blk.y + 24, "#a8a29e");
          if (blk.hp <= 0) {
            state.coins += 1;
            if (Math.random() < 0.35) world.cases.push({ x: blk.x + 6, y: blk.y + 6, w: 36, h: 36, open: false });
            else world.coins.push({ x: blk.x + 8, y: blk.y + 8, w: 32, h: 32, taken: false });
            toast("Блок сломан!", 0.8);
            syncHud();
          }
        }
      }
      for (var m = 0; m < world.mobs.length; m++) {
        var mob = world.mobs[m];
        if (mob.dead) continue;
        if (aabb(pl.hitBox, mob)) damageMob(mob, pl.hitBox.dmg, pl.x);
      }
    }

    // projectiles
    for (var pr = projectiles.length - 1; pr >= 0; pr--) {
      var p = projectiles[pr];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
      var hit = false;
      for (var mi = 0; mi < world.mobs.length; mi++) {
        var mo = world.mobs[mi];
        if (mo.dead) continue;
        if (p.x > mo.x && p.x < mo.x + mo.w && p.y > mo.y && p.y < mo.y + mo.h) {
          damageMob(mo, 2, p.x);
          hit = true;
          break;
        }
      }
      for (var bi = 0; bi < world.breaks.length; bi++) {
        var bb = world.breaks[bi];
        if (bb.hp <= 0) continue;
        if (p.x > bb.x && p.x < bb.x + bb.w && p.y > bb.y && p.y < bb.y + bb.h) {
          bb.hp -= 2;
          hit = true;
          if (bb.hp <= 0) {
            state.coins++;
            syncHud();
          }
        }
      }
      if (hit || p.life <= 0) projectiles.splice(pr, 1);
    }

    // mobs
    for (var mo2 = 0; mo2 < world.mobs.length; mo2++) {
      var mob2 = world.mobs[mo2];
      updateMob(mob2, dt);
      if (mob2.dead) continue;
      if (aabb(p1, mob2)) {
        if (p1.vy > 80 && p1.y + p1.h < mob2.y + mob2.h * 0.55) {
          damageMob(mob2, 1, p1.x);
          p1.vy = -400;
        } else hurt();
      }
    }

    // pet help
    if (state.pet && Math.random() < 0.02) {
      for (var mp = 0; mp < world.mobs.length; mp++) {
        var mm = world.mobs[mp];
        if (!mm.dead && Math.abs(mm.x - p1.x) < 160) {
          damageMob(mm, 1, p1.x);
          break;
        }
      }
    }

    // particles
    for (var pi = particles.length - 1; pi >= 0; pi--) {
      var pt = particles[pi];
      pt.t -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 600 * dt;
      if (pt.t <= 0) particles.splice(pi, 1);
    }

    // war guys animation
    for (var w = 0; w < warGuys.length; w++) {
      warGuys[w].anim += dt;
      warGuys[w].x += warGuys[w].facing * 20 * dt;
      if (warGuys[w].x < 150 || warGuys[w].x > world.width - 150) warGuys[w].facing *= -1;
    }

    // tutorial hints by x
    if (world.L.hints) {
      var hx = p1.x / TILE;
      for (var hi = 0; hi < world.L.hints.length; hi++) {
        if (hx >= world.L.hints[hi].at && world.hintI === hi) {
          hint(world.L.hints[hi].text, 4);
          world.hintI++;
        }
      }
    }

    // win
    if (world.wife && aabb(p1, world.wife)) {
      var bosses = world.mobs.some(function (b) {
        return b.kind === "boss" && !b.dead;
      });
      if (bosses) toast("Сначала победи стража!", 1.2);
      else {
        world.won = true;
        toast("Она свободна! ❤", 2);
        setTimeout(nextLevel, 900);
      }
    } else if (world.flag && aabb(p1, world.flag)) {
      var bosses2 = world.mobs.some(function (b) {
        return b.kind === "boss" && !b.dead;
      });
      if (bosses2) toast("Сначала босс!", 1.2);
      else {
        world.won = true;
        setTimeout(nextLevel, 400);
      }
    }

    var target = p1.x - canvas.width * 0.35;
    camX += (target - camX) * Math.min(1, dt * 6);
    if (camX < 0) camX = 0;
    if (camX > world.width - canvas.width) camX = Math.max(0, world.width - canvas.width);
  }

  function drawPerson(c, p, spriteColor) {
    var name =
      p.hurtT > 0 && Math.floor(animT * 20) % 2 === 0
        ? "character_" + spriteColor + "_hit"
        : !p.onGround
          ? "character_" + spriteColor + "_jump"
          : Math.abs(p.vx) > 20
            ? "character_" + spriteColor + (Math.floor(animT * 10) % 2 ? "_walk_b" : "_walk_a")
            : "character_" + spriteColor + "_idle";
    chars.draw(c, name, p.x - 10, p.y - 4, 56, 56, p.facing < 0);
    if (p.hitBox) {
      c.fillStyle = p.combo >= 2 ? "rgba(251,191,36,.45)" : "rgba(255,255,255,.3)";
      c.fillRect(p.hitBox.x, p.hitBox.y, p.hitBox.w, p.hitBox.h);
    }
  }

  function draw() {
    var magic = world && world.L.magic;
    ctx.fillStyle = magic ? "#2e1065" : "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgHills && !magic) {
      var sx = (-camX * 0.15) % bgHills.width;
      for (var i = -1; i < 3; i++) {
        ctx.drawImage(bgHills, sx + i * bgHills.width, canvas.height - bgHills.height * 0.85, bgHills.width, bgHills.height * 0.85);
      }
    }
    if (magic) {
      ctx.globalAlpha = 0.35;
      for (var s = 0; s < 12; s++) {
        ctx.fillStyle = "#e879f9";
        var sx2 = ((animT * 30 + s * 80) % (canvas.width + 40)) - 20;
        ctx.beginPath();
        ctx.arc(sx2, 40 + (s % 5) * 50, 3 + (s % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (!world) return;
    ctx.save();
    ctx.translate(-Math.floor(camX), 0);

    for (var i = 0; i < world.solids.length; i++) {
      var s = world.solids[i];
      if (!tiles.draw(ctx, s.sprite, s.x, s.platform ? s.drawY : s.y, TILE, TILE, false)) {
        ctx.fillStyle = "#4d7c0f";
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
    }
    for (var br = 0; br < world.breaks.length; br++) {
      var blk = world.breaks[br];
      if (blk.hp <= 0) continue;
      tiles.draw(ctx, "bricks_brown", blk.x, blk.y, TILE, TILE, false) ||
        (ctx.fillStyle = "#a8a29e", ctx.fillRect(blk.x, blk.y, TILE, TILE));
      ctx.fillStyle = "#fff";
      ctx.font = "900 10px system-ui";
      ctx.fillText("X", blk.x + 18, blk.y + 28);
    }
    for (var c = 0; c < world.coins.length; c++) {
      var coin = world.coins[c];
      if (coin.taken) continue;
      tiles.draw(ctx, Math.floor(animT * 8) % 2 ? "coin_gold_side" : "coin_gold", coin.x, coin.y, 32, 32, false);
    }
    for (var k = 0; k < world.cases.length; k++) {
      var cs = world.cases[k];
      if (cs.open) continue;
      ctx.fillStyle = "#b45309";
      ctx.fillRect(cs.x, cs.y, cs.w, cs.h);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(cs.x + 4, cs.y + 4, cs.w - 8, 10);
      ctx.fillStyle = "#fff";
      ctx.font = "900 11px system-ui";
      ctx.fillText("КЕЙС", cs.x + 2, cs.y + 28);
    }
    for (var w = 0; w < warGuys.length; w++) {
      var g = warGuys[w];
      ctx.fillStyle = g.side ? "#ef4444" : "#3b82f6";
      ctx.fillRect(g.x, g.y, 14, 22);
      ctx.fillStyle = "#ffc9a3";
      ctx.beginPath();
      ctx.arc(g.x + 7, g.y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (var m = 0; m < world.mobs.length; m++) {
      var mob = world.mobs[m];
      if (mob.dead) continue;
      if (mob.kind === "bee") {
        enemies.draw(ctx, Math.floor(mob.anim * 10) % 2 ? "bee_b" : "bee_a", mob.x, mob.y, mob.w, mob.h, false);
      } else if (mob.kind === "boss") {
        enemies.draw(ctx, Math.floor(mob.anim * 6) % 2 ? "slime_spike_walk_b" : "slime_spike_walk_a", mob.x, mob.y, mob.w, mob.h, mob.vx > 0);
        ctx.fillStyle = "rgba(0,0,0,.4)";
        ctx.fillRect(mob.x, mob.y - 14, mob.w, 7);
        ctx.fillStyle = "#f87171";
        ctx.fillRect(mob.x, mob.y - 14, mob.w * (mob.hp / mob.maxHp), 7);
      } else if (mob.gel) {
        enemies.draw(ctx, Math.floor(mob.anim * 8) % 2 ? "slime_normal_walk_b" : "slime_normal_walk_a", mob.x, mob.y, mob.w, mob.h, mob.vx > 0);
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(mob.x, mob.y, mob.w, mob.h);
        ctx.globalAlpha = 1;
      } else {
        enemies.draw(ctx, Math.floor(mob.anim * 8) % 2 ? "slime_normal_walk_b" : "slime_normal_walk_a", mob.x, mob.y, mob.w, mob.h, mob.vx > 0);
      }
    }
    if (world.flag) tiles.draw(ctx, Math.floor(animT * 6) % 2 ? "flag_yellow_b" : "flag_yellow_a", world.flag.x, world.flag.y, 48, 48, false);
    if (world.wife) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.strokeRect(world.wife.x, world.wife.y, world.wife.w, world.wife.h);
      chars.draw(ctx, "character_pink_idle", world.wife.x - 4, world.wife.y + 8, 56, 56, false);
      ctx.fillStyle = "#fff";
      ctx.font = "900 12px system-ui";
      ctx.fillText("спаси!", world.wife.x + 4, world.wife.y - 6);
    }

    drawPerson(ctx, world.p1, "yellow");
    if (world.p2) drawPerson(ctx, world.p2, "pink");
    if (world.ally) drawPerson(ctx, world.ally, "green");

    // pet
    if (state.pet) {
      var px = world.p1.x + Math.sin(animT * 3) * 20 - 10;
      var py = world.p1.y - 20 + Math.cos(animT * 4) * 6;
      ctx.font = "28px system-ui";
      ctx.fillText(state.pet.indexOf("пчел") >= 0 ? "🐝" : state.pet.indexOf("улит") >= 0 ? "🐌" : "🐸", px, py);
    }

    for (var pr = 0; pr < projectiles.length; pr++) {
      var p = projectiles[pr];
      tiles.draw(ctx, "coin_gold", p.x - 10, p.y - 10, 20, 20, false);
    }
    for (var pi = 0; pi < particles.length; pi++) {
      var pt = particles[pi];
      ctx.globalAlpha = Math.max(0, pt.t);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 5, 5);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (!document.getElementById("comic").classList.contains("hide")) {
      requestAnimationFrame(frame);
      return;
    }
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
    if (e.code === "KeyR") doRestart();
    if (e.code === "Space" || e.code === "ArrowUp") e.preventDefault();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

  document.getElementById("btn-restart").onclick = doRestart;
  document.getElementById("btn-jump").onpointerdown = function (e) {
    e.preventDefault();
    jumpQ = true;
  };
  document.getElementById("btn-hit").onpointerdown = function (e) {
    e.preventDefault();
    hitQ = true;
  };
  document.getElementById("btn-throw").onpointerdown = function (e) {
    e.preventDefault();
    throwQ = true;
  };

  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickActive = false;
  function setStick(cx, cy) {
    var r = pad.getBoundingClientRect();
    var dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
    var len = Math.hypot(dx, (cy - (r.top + r.height / 2)) / (r.height / 2)) || 1;
    if (len > 1) dx /= len;
    stickX = dx;
    knob.style.transform = "translate(" + dx * 26 + "px,0)";
  }
  pad.addEventListener("pointerdown", function (e) {
    stickActive = true;
    pad.setPointerCapture(e.pointerId);
    setStick(e.clientX, e.clientY);
  });
  pad.addEventListener("pointermove", function (e) {
    if (stickActive) setStick(e.clientX, e.clientY);
  });
  pad.addEventListener("pointerup", function () {
    stickActive = false;
    stickX = 0;
    knob.style.transform = "translate(0,0)";
  });

  document.getElementById("comic-next").onclick = function () {
    if (comicI < COMIC.length - 1) {
      comicI++;
      showComic();
    } else {
      document.getElementById("comic").classList.add("hide");
      state.seenComic = true;
      save();
      startLevel(0);
      toast("Обучение · J удар · K монета · пробел прыжок", 3);
    }
  };

  // fix heart fx: two halves
  (function () {
    var fx = document.getElementById("heart-fx");
    fx.innerHTML = '<span class="h left">💔</span><span class="h right" style="margin-left:-0.55em">❤️</span>';
  })();

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
  ]).then(function (res) {
    chars = makeAtlas(res[0], parseAtlas(res[1]));
    tiles = makeAtlas(res[2], parseAtlas(res[3]));
    enemies = makeAtlas(res[4], parseAtlas(res[5]));
    bgHills = res[6];
    if (state.seenComic) {
      document.getElementById("comic").classList.add("hide");
      startLevel(state.level);
    } else showComic();
    requestAnimationFrame(frame);
  });
})();
