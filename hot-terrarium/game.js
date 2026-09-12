/**
 * Жаркий террариум — новый песчаный биом:
 * сыпучий песок (наступил — сыпется), физическая вода,
 * лава/жар, деревья валятся, рука ломается без топора, хил.
 * Текстуры: Kenney New Platformer (CC0).
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var W = 960;
  var H = 540;
  var TS = 24;
  var COLS = 120;
  var ROWS = 48;
  var ASSET = "../shared/kenney-platformer/";
  var G = 1800;
  var JUMP = 620;
  var SPEED = 210;

  var AIR = 0;
  var STONE = 1;
  var DIRT = 2;
  var SAND = 3;
  var WATER = 4;
  var WOOD = 5;
  var LEAF = 6;
  var LAVA = 7;
  var HEAL = 8;
  var BEDROCK = 9;

  var DEF = {};
  DEF[AIR] = { name: "воздух", solid: false, powder: false, liquid: false };
  DEF[STONE] = { name: "камень", solid: true, hard: 2.4, tile: "brick_grey" };
  DEF[DIRT] = { name: "земля", solid: true, hard: 1.1, tile: "terrain_dirt_block_center" };
  DEF[SAND] = { name: "песок", solid: true, powder: true, hard: 0.55, tile: "terrain_sand_block_center" };
  DEF[WATER] = { name: "вода", solid: false, liquid: true, tile: "water" };
  DEF[WOOD] = { name: "дерево", solid: true, hard: 1.8, tile: "block_plank", tree: true };
  DEF[LEAF] = { name: "листва", solid: true, hard: 0.35, tile: "bush", tree: true };
  DEF[LAVA] = { name: "лава", solid: false, liquid: true, hot: true, tile: "lava" };
  DEF[HEAL] = { name: "ягода", solid: false, tile: "heart", pickup: true };
  DEF[BEDROCK] = { name: "дно", solid: true, hard: 99, tile: "brick_grey" };

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var toastEl = document.getElementById("toast");
  var toastT = 0;
  var tiles = null;
  var chars = null;
  var bgImg = null;
  var animT = 0;
  var physAcc = 0;

  var grid = new Uint8Array(COLS * ROWS);
  var hpMap = new Float32Array(COLS * ROWS);
  var unstable = new Uint8Array(COLS * ROWS);
  var falling = [];

  var player = {
    x: 40 * TS,
    y: 10 * TS,
    w: 18,
    h: 28,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    hp: 100,
    arm: 100,
    heat: 0,
    inv: { heal: 2, wood: 0, sand: 8, water: 0 },
    place: SAND,
    digProg: 0,
    digTx: -1,
    digTy: -1,
  };

  var camX = 0;
  var camY = 0;
  var keys = Object.create(null);
  var mouse = { x: 0, y: 0, down: false, rdown: false };
  var jumpQ = false;
  var stickX = 0;

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2.2 : t;
  }
  function idx(x, y) {
    return y * COLS + x;
  }
  function inb(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS;
  }
  function get(x, y) {
    return inb(x, y) ? grid[idx(x, y)] : BEDROCK;
  }
  function set(x, y, id) {
    if (!inb(x, y)) return;
    grid[idx(x, y)] = id;
    hpMap[idx(x, y)] = DEF[id] && DEF[id].hard ? DEF[id].hard : 0;
    unstable[idx(x, y)] = 0;
  }
  function solidAt(x, y) {
    var id = get(x, y);
    return DEF[id] && DEF[id].solid;
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

  function plantTree(tx, baseY) {
    var h = 4 + ((tx * 7) % 4);
    for (var i = 0; i < h; i++) set(tx, baseY - i, WOOD);
    var top = baseY - h;
    for (var dx = -2; dx <= 2; dx++) {
      for (var dy = -2; dy <= 1; dy++) {
        if (Math.abs(dx) + Math.abs(dy) > 3) continue;
        var x = tx + dx;
        var y = top + dy;
        if (get(x, y) === AIR) set(x, y, LEAF);
      }
    }
  }

  function genWorld() {
    grid.fill(AIR);
    hpMap.fill(0);
    unstable.fill(0);
    falling.length = 0;
    var ground = new Int16Array(COLS);
    for (var x = 0; x < COLS; x++) {
      ground[x] = 28 + Math.floor(Math.sin(x * 0.12) * 3 + Math.sin(x * 0.05) * 2);
    }
    for (var x = 0; x < COLS; x++) {
      for (var y = 0; y < ROWS; y++) {
        if (y >= ROWS - 2) set(x, y, BEDROCK);
        else if (y > ground[x] + 6) set(x, y, STONE);
        else if (y > ground[x] + 1) set(x, y, DIRT);
        else if (y === ground[x] + 1) set(x, y, x > 55 ? SAND : DIRT);
        else if (y === ground[x]) {
          if (x > 50) set(x, y, SAND);
          else set(x, y, DIRT);
        }
      }
    }
    // дюны песка
    for (var x = 58; x < 110; x++) {
      var hump = ground[x] - (2 + ((x * 3) % 4));
      for (var y = hump; y <= ground[x]; y++) set(x, y, SAND);
    }
    // оазис воды
    for (var x = 22; x < 34; x++) {
      for (var y = ground[x] - 1; y <= ground[x] + 3; y++) {
        if (get(x, y) !== BEDROCK) set(x, y, WATER);
      }
    }
    // лава-карман (жаркий биом)
    for (var x = 78; x < 92; x++) {
      for (var y = ground[x] + 2; y <= ground[x] + 5; y++) {
        if (get(x, y) === STONE || get(x, y) === DIRT || get(x, y) === SAND) set(x, y, LAVA);
      }
      if (x % 3 === 0) set(x, ground[x] - 1, LAVA);
    }
    // деревья
    for (var t = 8; t < 52; t += 7) plantTree(t, ground[t] - 1);
    for (var t = 96; t < 115; t += 8) {
      // кактусы жаркого биома — тоже «деревья»
      var h = 3 + (t % 3);
      for (var i = 0; i < h; i++) set(t, ground[t] - 1 - i, WOOD);
      set(t, ground[t] - 1 - h, LEAF);
    }
    // ягоды для хила
    set(18, ground[18] - 1, HEAL);
    set(40, ground[40] - 1, HEAL);
    set(64, ground[64] - 1, HEAL);
    set(100, ground[100] - 1, HEAL);

    player.x = 12 * TS;
    player.y = (ground[12] - 3) * TS;
    player.vx = 0;
    player.vy = 0;
    player.hp = 100;
    player.arm = 100;
    player.heat = 0;
    player.inv = { heal: 2, wood: 0, sand: 8, water: 0 };
    toast("Жаркий биом: песок сыпется под ногами. Не ломай дерево голой рукой!", 4);
  }

  function swap(x1, y1, x2, y2) {
    var a = get(x1, y1);
    var b = get(x2, y2);
    grid[idx(x1, y1)] = b;
    grid[idx(x2, y2)] = a;
    var ha = hpMap[idx(x1, y1)];
    hpMap[idx(x1, y1)] = hpMap[idx(x2, y2)];
    hpMap[idx(x2, y2)] = ha;
  }

  function stepPowder(x, y) {
    if (get(x, y) !== SAND) return;
    if (get(x, y + 1) === AIR || get(x, y + 1) === WATER) {
      swap(x, y, x, y + 1);
      return;
    }
    var dir = Math.random() < 0.5 ? -1 : 1;
    if (get(x + dir, y + 1) === AIR || get(x + dir, y + 1) === WATER) {
      swap(x, y, x + dir, y + 1);
      return;
    }
    if (get(x - dir, y + 1) === AIR || get(x - dir, y + 1) === WATER) {
      swap(x, y, x - dir, y + 1);
    }
  }

  function stepLiquid(x, y, id) {
    if (get(x, y) !== id) return;
    var below = get(x, y + 1);
    if (below === AIR || (id === LAVA && below === WATER) || (id === WATER && below === LAVA && Math.random() < 0.3)) {
      if (id === LAVA && below === WATER) {
        set(x, y, AIR);
        set(x, y + 1, STONE);
        return;
      }
      if (id === WATER && below === LAVA) {
        set(x, y, AIR);
        set(x, y + 1, STONE);
        return;
      }
      swap(x, y, x, y + 1);
      return;
    }
    var dir = Math.random() < 0.5 ? -1 : 1;
    if (get(x + dir, y) === AIR) {
      swap(x, y, x + dir, y);
      return;
    }
    if (get(x - dir, y) === AIR) swap(x, y, x - dir, y);
  }

  function physicsStep() {
    // снизу вверх — песок и жидкости
    for (var y = ROWS - 3; y >= 0; y--) {
      var ltr = y % 2 === 0;
      for (var n = 0; n < COLS; n++) {
        var x = ltr ? n : COLS - 1 - n;
        var id = get(x, y);
        if (id === SAND) stepPowder(x, y);
        else if (id === WATER || id === LAVA) stepLiquid(x, y, id);
      }
    }
    // нестабильный песок после шага
    for (var i = 0; i < unstable.length; i++) {
      if (!unstable[i]) continue;
      unstable[i] = 0;
      var ux = i % COLS;
      var uy = (i / COLS) | 0;
      if (get(ux, uy) === SAND) {
        // «рассыпать» — дать шанс соседям тоже поехать
        for (var dx = -1; dx <= 1; dx++) {
          if (get(ux + dx, uy) === SAND) unstable[idx(ux + dx, uy)] = 1;
        }
      }
    }
  }

  function disturbSandAt(tx, ty) {
    for (var dy = 0; dy <= 2; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var x = tx + dx;
        var y = ty + dy;
        if (get(x, y) === SAND) unstable[idx(x, y)] = 1;
      }
    }
  }

  function fallTree(tx, ty) {
    // собрать ствол вверх и листву, уронить вбок
    var dir = player.facing >= 0 ? 1 : -1;
    var parts = [];
    for (var y = ty; y >= 0; y--) {
      var id = get(tx, y);
      if (id !== WOOD && id !== LEAF) break;
      parts.push({ x: tx, y: y, id: id });
      set(tx, y, AIR);
    }
    for (var dx = -3; dx <= 3; dx++) {
      for (var dy = -4; dy <= 2; dy++) {
        var x = tx + dx;
        var y = ty + dy;
        if (get(x, y) === LEAF) {
          parts.push({ x: x, y: y, id: LEAF });
          set(x, y, AIR);
        }
      }
    }
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      falling.push({
        id: p.id,
        x: p.x * TS,
        y: p.y * TS,
        vx: dir * (40 + Math.random() * 80),
        vy: -40 - Math.random() * 60,
        rot: 0,
        vr: dir * (2 + Math.random() * 4),
        life: 2.5,
      });
    }
    toast("Дерево упало!", 1.5);
  }

  function hurtArm(amount, msg) {
    player.arm = Math.max(0, player.arm - amount);
    if (msg) toast(msg, 2);
    if (player.arm <= 0) {
      player.arm = 0;
      toast("Рука сломана! Хились ягодами (E)", 3);
    }
  }

  function damagePlayer(n, reason) {
    player.hp = Math.max(0, player.hp - n);
    if (player.hp <= 0) {
      toast("Ты погиб… мир перезапущен", 2.5);
      genWorld();
    } else if (reason) toast(reason, 1.4);
  }

  function tryMine(tx, ty, dt) {
    if (!inb(tx, ty)) return;
    var id = get(tx, ty);
    if (id === AIR || id === BEDROCK || id === WATER || id === LAVA) return;
    if (player.arm <= 0 && DEF[id].tree) {
      toast("Рука сломана — сначала хил (E)", 1.5);
      return;
    }
    if (player.digTx !== tx || player.digTy !== ty) {
      player.digTx = tx;
      player.digTy = ty;
      player.digProg = 0;
    }
    var hard = DEF[id].hard || 1;
    var rate = 1.1;
    if (DEF[id].tree) {
      // голой рукой медленнее + шанс травмы
      rate = 0.55;
      if (Math.random() < dt * 0.35) hurtArm(8 + Math.random() * 12, "Ай! Рука от дерева");
    }
    if (player.arm < 40) rate *= 0.55;
    player.digProg += (dt * rate) / hard;
    if (player.digProg >= 1) {
      player.digProg = 0;
      if (id === WOOD) {
        // шанс уронить всё дерево
        fallTree(tx, ty);
        player.inv.wood += 3;
      } else if (id === LEAF) {
        set(tx, ty, AIR);
        if (Math.random() < 0.25) player.inv.heal += 1;
      } else if (id === SAND) {
        set(tx, ty, AIR);
        player.inv.sand += 1;
        disturbSandAt(tx, ty);
      } else if (id === HEAL) {
        set(tx, ty, AIR);
        player.inv.heal += 1;
        toast("Ягода! (+хил)", 1.2);
      } else if (id === DIRT || id === STONE) {
        set(tx, ty, AIR);
      } else set(tx, ty, AIR);
      // соседний песок может посыпаться
      disturbSandAt(tx, ty + 1);
    }
  }

  function tryPlace(tx, ty) {
    if (!inb(tx, ty) || get(tx, ty) !== AIR) return;
    // не ставить в игрока
    var px = Math.floor((player.x + player.w / 2) / TS);
    var py = Math.floor((player.y + player.h / 2) / TS);
    if (tx === px && (ty === py || ty === py - 1)) return;
    var id = player.place;
    if (id === SAND) {
      if (player.inv.sand <= 0) return toast("Нет песка", 1);
      player.inv.sand--;
      set(tx, ty, SAND);
      disturbSandAt(tx, ty);
    } else if (id === WOOD) {
      if (player.inv.wood <= 0) return toast("Нет дерева", 1);
      player.inv.wood--;
      set(tx, ty, WOOD);
    } else if (id === WATER) {
      set(tx, ty, WATER);
    } else if (id === HEAL) {
      if (player.inv.heal <= 0) return;
      player.inv.heal--;
      set(tx, ty, HEAL);
    }
  }

  function useHeal() {
    if (player.inv.heal <= 0) return toast("Нет ягод — ищи ♥", 1.5);
    player.inv.heal--;
    player.hp = Math.min(100, player.hp + 28);
    player.arm = Math.min(100, player.arm + 40);
    player.heat = Math.max(0, player.heat - 25);
    toast("Хил! HP и рука восстановлены", 1.6);
  }

  function worldMouse() {
    var r = canvas.getBoundingClientRect();
    var sx = canvas.width / r.width;
    var sy = canvas.height / r.height;
    return {
      x: (mouse.x - r.left) * sx + camX,
      y: (mouse.y - r.top) * sy + camY,
    };
  }

  function tileMouse() {
    var m = worldMouse();
    return { tx: Math.floor(m.x / TS), ty: Math.floor(m.y / TS) };
  }

  function movePlayer(dt) {
    var ix = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) ix -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) ix += 1;
    if (stickX) ix = stickX > 0.2 ? 1 : stickX < -0.2 ? -1 : ix;
    if (ix) player.facing = ix;
    var spd = SPEED * (player.arm < 30 ? 0.7 : 1) * (player.heat > 60 ? 0.75 : 1);
    player.vx = ix * spd;
    player.vy += G * dt;
    if (jumpQ && player.onGround) {
      player.vy = -JUMP;
      player.onGround = false;
      // прыжок по песку — сыпется
      var fx = Math.floor((player.x + player.w / 2) / TS);
      var fy = Math.floor((player.y + player.h + 2) / TS);
      disturbSandAt(fx, fy);
    }
    jumpQ = false;

    player.x += player.vx * dt;
    collide(true);
    player.y += player.vy * dt;
    player.onGround = false;
    collide(false);

    // наступил на песок — сыпется
    var feetX = Math.floor((player.x + player.w / 2) / TS);
    var feetY = Math.floor((player.y + player.h + 1) / TS);
    if (get(feetX, feetY) === SAND || get(feetX, feetY - 1) === SAND) {
      if (Math.abs(player.vx) > 20 || Math.abs(player.vy) > 40) disturbSandAt(feetX, feetY);
    }

    // пикап ягод
    var hx = Math.floor((player.x + player.w / 2) / TS);
    var hy = Math.floor((player.y + player.h / 2) / TS);
    if (get(hx, hy) === HEAL) {
      set(hx, hy, AIR);
      player.inv.heal += 1;
      toast("Подобрал ягоду", 1);
    }

    // жар от лавы рядом
    var nearLava = false;
    for (var dx = -2; dx <= 2; dx++) {
      for (var dy = -2; dy <= 2; dy++) {
        if (get(hx + dx, hy + dy) === LAVA) nearLava = true;
      }
    }
    var inWater = get(hx, hy) === WATER || get(hx, hy + 1) === WATER;
    if (nearLava && !inWater) {
      player.heat = Math.min(100, player.heat + dt * 28);
      if (player.heat > 70) damagePlayer(dt * 12, "Обжог от жара!");
    } else {
      player.heat = Math.max(0, player.heat - dt * (inWater ? 40 : 12));
    }
    if (get(hx, hy) === LAVA || get(hx, hy + 1) === LAVA) {
      damagePlayer(dt * 35, "Лава!");
      player.heat = 100;
    }
  }

  function collide(axisX) {
    var x0 = Math.floor(player.x / TS);
    var y0 = Math.floor(player.y / TS);
    var x1 = Math.floor((player.x + player.w - 0.1) / TS);
    var y1 = Math.floor((player.y + player.h - 0.1) / TS);
    for (var ty = y0; ty <= y1; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        if (!solidAt(tx, ty)) continue;
        var sx = tx * TS;
        var sy = ty * TS;
        if (axisX) {
          if (player.vx > 0) player.x = sx - player.w;
          else if (player.vx < 0) player.x = sx + TS;
          player.vx = 0;
        } else {
          if (player.vy > 0) {
            player.y = sy - player.h;
            player.vy = 0;
            player.onGround = true;
          } else if (player.vy < 0) {
            player.y = sy + TS;
            player.vy = 0;
          }
        }
      }
    }
  }

  function updateFalling(dt) {
    for (var i = falling.length - 1; i >= 0; i--) {
      var f = falling[i];
      f.vy += 900 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      f.life -= dt;
      // урон если бревно бьёт игрока
      if (
        f.id === WOOD &&
        f.x < player.x + player.w &&
        f.x + TS > player.x &&
        f.y < player.y + player.h &&
        f.y + TS > player.y &&
        f.vy > 80
      ) {
        damagePlayer(8, "Упало дерево!");
        hurtArm(15, null);
        f.life = 0;
      }
      var tx = Math.floor((f.x + TS / 2) / TS);
      var ty = Math.floor((f.y + TS / 2) / TS);
      if (f.life <= 0 || (f.vy > 0 && solidAt(tx, ty + 1) && f.y > ty * TS)) {
        if (inb(tx, ty) && get(tx, ty) === AIR && f.id === WOOD) {
          set(tx, ty, WOOD);
          player.inv.wood += 1;
        } else if (f.id === WOOD) player.inv.wood += 1;
        else if (f.id === LEAF && Math.random() < 0.2) player.inv.heal += 1;
        falling.splice(i, 1);
      }
    }
  }

  function updateHud() {
    document.getElementById("hp-fill").style.transform = "scaleX(" + player.hp / 100 + ")";
    document.getElementById("arm-fill").style.transform = "scaleX(" + player.arm / 100 + ")";
    document.getElementById("heat-fill").style.transform = "scaleX(" + player.heat / 100 + ")";
    document.getElementById("heal-n").textContent = player.inv.heal;
    document.getElementById("wood-n").textContent = player.inv.wood;
    document.getElementById("sand-n").textContent = player.inv.sand;
  }

  function update(dt) {
    physAcc += dt;
    while (physAcc >= 1 / 28) {
      physicsStep();
      physAcc -= 1 / 28;
    }
    movePlayer(dt);
    updateFalling(dt);

    if (mouse.down) {
      var t = tileMouse();
      var dx = t.tx - Math.floor((player.x + player.w / 2) / TS);
      var dy = t.ty - Math.floor((player.y + player.h / 2) / TS);
      if (dx * dx + dy * dy <= 25) tryMine(t.tx, t.ty, dt);
    } else {
      player.digProg = 0;
      player.digTx = -1;
    }
    if (mouse.rdown) {
      var t2 = tileMouse();
      var dx2 = t2.tx - Math.floor((player.x + player.w / 2) / TS);
      var dy2 = t2.ty - Math.floor((player.y + player.h / 2) / TS);
      if (dx2 * dx2 + dy2 * dy2 <= 25) {
        tryPlace(t2.tx, t2.ty);
        mouse.rdown = false;
      }
    }

    camX = player.x + player.w / 2 - W / 2;
    camY = player.y + player.h / 2 - H / 2;
    camX = Math.max(0, Math.min(COLS * TS - W, camX));
    camY = Math.max(0, Math.min(ROWS * TS - H, camY));
    updateHud();
  }

  function drawTile(id, x, y, w, h) {
    var d = DEF[id];
    if (!d || id === AIR) return;
    var name = d.tile;
    if (id === LAVA && Math.floor(animT * 6) % 2) name = "lava_top";
    if (id === WATER && y > 0 && get(Math.floor(x / TS), Math.floor(y / TS) - 1) === AIR) name = "water";
    if (tiles && name && tiles.draw(ctx, name, x, y, w, h, false)) return;
    var colors = {
      1: "#64748b",
      2: "#92400e",
      3: "#eab308",
      4: "#38bdf8",
      5: "#a16207",
      6: "#22c55e",
      7: "#ef4444",
      8: "#f43f5e",
      9: "#334155",
    };
    ctx.fillStyle = colors[id] || "#888";
    ctx.fillRect(x, y, w, h);
  }

  function draw() {
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, W, H);
      ctx.fillStyle = "rgba(124,45,18,0.35)";
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#431407";
      ctx.fillRect(0, 0, W, H);
    }

    var x0 = Math.max(0, Math.floor(camX / TS) - 1);
    var y0 = Math.max(0, Math.floor(camY / TS) - 1);
    var x1 = Math.min(COLS - 1, Math.ceil((camX + W) / TS) + 1);
    var y1 = Math.min(ROWS - 1, Math.ceil((camY + H) / TS) + 1);

    ctx.save();
    ctx.translate(-camX, -camY);

    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var id = get(x, y);
        if (id === AIR) continue;
        drawTile(id, x * TS, y * TS, TS, TS);
      }
    }

    // прогресс копания
    if (player.digProg > 0 && player.digTx >= 0) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(player.digTx * TS + 2, player.digTy * TS + 2, TS - 4, TS - 4);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(player.digTx * TS, player.digTy * TS + TS * (1 - player.digProg), TS, TS * player.digProg);
    }

    for (var i = 0; i < falling.length; i++) {
      var f = falling[i];
      ctx.save();
      ctx.translate(f.x + TS / 2, f.y + TS / 2);
      ctx.rotate(f.rot);
      drawTile(f.id, -TS / 2, -TS / 2, TS, TS);
      ctx.restore();
    }

    // игрок (голова Kenney beige)
    var pf = "character_beige_idle";
    if (!player.onGround) pf = "character_beige_jump";
    else if (Math.abs(player.vx) > 20) pf = Math.floor(animT * 8) % 2 ? "character_beige_walk_a" : "character_beige_walk_b";
    if (player.heat > 70) pf = "character_beige_hit";
    var ok =
      chars &&
      chars.draw(ctx, pf, player.x - 10, player.y - 14, player.w + 20, player.h + 16, player.facing < 0);
    if (!ok) {
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(player.x + 9, player.y + 8, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(player.x + 2, player.y + 14, 14, 14);
    }

    // прицел
    var m = worldMouse();
    ctx.strokeStyle = mouse.down ? "#ef4444" : "#fdba74";
    ctx.beginPath();
    ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // оверлей жара
    if (player.heat > 40) {
      ctx.fillStyle = "rgba(220,38,38," + (player.heat - 40) / 200 + ")";
      ctx.fillRect(0, 0, W, H);
    }
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

  canvas.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  canvas.addEventListener("mousedown", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rdown = true;
  });
  window.addEventListener("mouseup", function (e) {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rdown = false;
  });
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  canvas.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch") {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.down = true;
    }
  });
  canvas.addEventListener("pointerup", function () {
    mouse.down = false;
  });

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      jumpQ = true;
    }
    if (e.code === "KeyE") useHeal();
    if (e.code === "Digit1") {
      player.place = SAND;
      toast("Ставить: песок", 1);
    }
    if (e.code === "Digit2") {
      player.place = WOOD;
      toast("Ставить: дерево", 1);
    }
    if (e.code === "Digit3") {
      player.place = WATER;
      toast("Ставить: вода (физика)", 1);
    }
    if (e.code === "Digit4") {
      player.place = HEAL;
      toast("Ставить: ягода", 1);
    }
    if (e.code === "KeyR") genWorld();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

  document.getElementById("btn-heal").onclick = useHeal;
  document.getElementById("btn-jump").onpointerdown = function (e) {
    e.preventDefault();
    jumpQ = true;
  };
  document.getElementById("btn-reset").onclick = genWorld;

  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickOn = false;
  function setStick(cx, cy) {
    var r = pad.getBoundingClientRect();
    var dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
    stickX = Math.max(-1, Math.min(1, dx));
    knob.style.transform = "translate(" + stickX * 28 + "px,0)";
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

  Promise.all([
    loadImage(ASSET + "Spritesheets/spritesheet-tiles-default.png"),
    fetch(ASSET + "Spritesheets/spritesheet-tiles-default.xml").then(function (r) {
      return r.text();
    }),
    loadImage(ASSET + "Spritesheets/spritesheet-characters-default.png"),
    fetch(ASSET + "Spritesheets/spritesheet-characters-default.xml").then(function (r) {
      return r.text();
    }),
    loadImage(ASSET + "Backgrounds/background_color_hills.png").catch(function () {
      return loadImage(ASSET + "background_color_hills.png");
    }),
  ])
    .then(function (arr) {
      tiles = makeAtlas(arr[0], parseAtlas(arr[1]));
      chars = makeAtlas(arr[2], parseAtlas(arr[3]));
      bgImg = arr[4];
      genWorld();
      requestAnimationFrame(frame);
    })
    .catch(function (err) {
      console.warn(err);
      toast("Текстуры частично недоступны", 2);
      genWorld();
      requestAnimationFrame(frame);
    });
})();
