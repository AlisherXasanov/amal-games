/**
 * Жаркий террариум v3 — бесконечный мир (чанки), персонаж+год,
 * дома, сундуки, игрушки, торговля, боты-помощники.
 * Песок/вода/лава/деревья. Kenney New Platformer CC0.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var W = 960;
  var H = 540;
  var TS = 24;
  var CW = 32;
  var ROWS = 48;
  var ASSET = "../shared/kenney-platformer/";
  var G = 1800;
  var JUMP = 620;
  var SPEED = 210;
  var SAVE = "amal-hot-terrarium-v3";

  var AIR = 0,
    STONE = 1,
    DIRT = 2,
    SAND = 3,
    WATER = 4,
    WOOD = 5,
    LEAF = 6,
    LAVA = 7,
    HEAL = 8,
    BEDROCK = 9,
    PLANK = 10,
    CHEST = 11;

  var DEF = {};
  DEF[AIR] = { solid: false };
  DEF[STONE] = { solid: true, hard: 2.4, tile: "brick_grey" };
  DEF[DIRT] = { solid: true, hard: 1.1, tile: "terrain_dirt_block_center" };
  DEF[SAND] = { solid: true, powder: true, hard: 0.55, tile: "terrain_sand_block_center" };
  DEF[WATER] = { solid: false, liquid: true, tile: "water" };
  DEF[WOOD] = { solid: true, hard: 1.8, tile: "block_plank", tree: true };
  DEF[LEAF] = { solid: true, hard: 0.35, tile: "bush", tree: true };
  DEF[LAVA] = { solid: false, liquid: true, hot: true, tile: "lava" };
  DEF[HEAL] = { solid: false, tile: "heart", pickup: true };
  DEF[BEDROCK] = { solid: true, hard: 99, tile: "brick_grey" };
  DEF[PLANK] = { solid: true, hard: 1.2, tile: "block_planks" };
  DEF[CHEST] = { solid: true, hard: 1.5, tile: "block_exclamation" };

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var toastEl = document.getElementById("toast");
  var toastT = 0;
  var tiles = null;
  var chars = null;
  var bgImg = null;
  var animT = 0;
  var physAcc = 0;
  var started = false;
  var season = 0;

  var chunks = Object.create(null);
  var entities = [];
  var falling = [];
  var skin = "beige";

  var player = {
    name: "Амаль",
    year: 2026,
    x: 0,
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
    inv: { heal: 2, wood: 0, sand: 8, coin: 5, toy: 0 },
    place: SAND,
    digProg: 0,
    digTx: 0,
    digTy: 0,
    digOk: false,
  };

  var camX = 0;
  var camY = 0;
  var keys = Object.create(null);
  var mouse = { x: 0, y: 0, down: false, rdown: false };
  var jumpQ = false;
  var stickX = 0;
  var shopNpc = null;

  function toast(m, t) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = t == null ? 2.2 : t;
  }
  function hash(n) {
    n = (n | 0) * 374761393 + 668265263;
    n = (n ^ (n >>> 13)) * 1274126177;
    return (n ^ (n >>> 16)) >>> 0;
  }
  function noise1(x) {
    return (hash(x) % 1000) / 1000;
  }
  function groundH(wx) {
    var n = Math.sin(wx * 0.07) * 3 + Math.sin(wx * 0.021) * 5 + noise1(wx) * 2;
    return Math.floor(26 + n + season * 0.4);
  }

  function chunkKey(cx) {
    return String(cx);
  }
  function ensureChunk(cx) {
    var k = chunkKey(cx);
    if (chunks[k]) return chunks[k];
    var grid = new Uint8Array(CW * ROWS);
    var unstable = new Uint8Array(CW * ROWS);
    for (var lx = 0; lx < CW; lx++) {
      var wx = cx * CW + lx;
      var g = groundH(wx);
      var desert = ((hash(cx * 31 + Math.floor(wx / 40)) >> 3) & 1) === 1 || wx > 40;
      for (var y = 0; y < ROWS; y++) {
        var id = AIR;
        if (y >= ROWS - 2) id = BEDROCK;
        else if (y > g + 7) id = STONE;
        else if (y > g + 1) id = DIRT;
        else if (y === g + 1) id = desert ? SAND : DIRT;
        else if (y === g) id = desert ? SAND : DIRT;
        grid[y * CW + lx] = id;
      }
      // дюны
      if (desert && noise1(wx + 9) > 0.55) {
        var hump = g - 1 - ((hash(wx) >> 5) % 3);
        for (var y2 = hump; y2 <= g; y2++) grid[y2 * CW + lx] = SAND;
      }
      // вода оазис
      if (!desert && noise1(wx + 77) > 0.92) {
        for (var y3 = g - 1; y3 <= g + 3; y3++) if (y3 < ROWS - 2) grid[y3 * CW + lx] = WATER;
      }
      // лава карман
      if (desert && noise1(wx + 130) > 0.88) {
        for (var y4 = g + 2; y4 <= g + 5; y4++) if (y4 < ROWS - 2) grid[y4 * CW + lx] = LAVA;
        if (lx % 4 === 0 && g - 1 > 0) grid[(g - 1) * CW + lx] = LAVA;
      }
    }
    // деревья / кактусы
    for (var lx = 2; lx < CW - 2; lx++) {
      var wx = cx * CW + lx;
      if (noise1(wx + 200) < 0.88) continue;
      var g = groundH(wx);
      var desert = grid[g * CW + lx] === SAND;
      var h = desert ? 3 + (hash(wx) % 3) : 4 + (hash(wx) % 4);
      for (var i = 0; i < h; i++) {
        var yy = g - 1 - i;
        if (yy > 0) grid[yy * CW + lx] = WOOD;
      }
      var top = g - 1 - h;
      if (!desert) {
        for (var dx = -2; dx <= 2; dx++) {
          for (var dy = -2; dy <= 1; dy++) {
            if (Math.abs(dx) + Math.abs(dy) > 3) continue;
            var xx = lx + dx;
            var yy2 = top + dy;
            if (xx >= 0 && xx < CW && yy2 > 0 && grid[yy2 * CW + xx] === AIR) grid[yy2 * CW + xx] = LEAF;
          }
        }
      } else if (top > 0) grid[top * CW + lx] = LEAF;
      if (noise1(wx + 333) > 0.7 && g - 1 > 0 && grid[(g - 1) * CW + lx] === AIR) grid[(g - 1) * CW + lx] = HEAL;
    }
    // дом + сундук иногда
    if ((hash(cx * 97) % 5) === 0) {
      var bx = 8 + (hash(cx) % 12);
      var by = groundH(cx * CW + bx) - 1;
      for (var hx = 0; hx < 6; hx++) {
        for (var hy = 0; hy < 4; hy++) {
          var x = bx + hx;
          var y = by - hy;
          if (x >= 0 && x < CW && y > 0) {
            if (hy === 0 || hx === 0 || hx === 5 || hy === 3) grid[y * CW + x] = PLANK;
            else grid[y * CW + x] = AIR;
          }
        }
      }
      if (bx + 2 < CW && by - 1 > 0) grid[(by - 1) * CW + (bx + 2)] = CHEST;
      entities.push({
        kind: "house",
        x: (cx * CW + bx + 3) * TS,
        y: (by - 4) * TS,
        label: "дом",
      });
    }
    // торговец / бот
    if ((hash(cx * 53) % 4) === 1) {
      var tx = cx * CW + 10 + (hash(cx + 3) % 10);
      var ty = groundH(tx) - 1;
      entities.push({
        kind: "trader",
        x: tx * TS,
        y: ty * TS,
        name: "Торговец Саид",
        stock: true,
      });
    }
    if ((hash(cx * 71) % 4) === 2) {
      var bx2 = cx * CW + 6 + (hash(cx + 9) % 14);
      var by2 = groundH(bx2) - 1;
      entities.push({
        kind: "bot",
        x: bx2 * TS,
        y: by2 * TS,
        name: "Бот-помощник",
        cool: 0,
      });
    }
    // игрушка на поверхности
    if ((hash(cx * 17) % 3) === 0) {
      var ix = cx * CW + 4 + (hash(cx + 1) % 20);
      entities.push({
        kind: "toy",
        x: ix * TS,
        y: (groundH(ix) - 1) * TS,
        taken: false,
      });
    }

    var ch = { cx: cx, grid: grid, unstable: unstable };
    chunks[k] = ch;
    return ch;
  }

  function worldToChunk(wx) {
    return Math.floor(wx / CW);
  }
  function get(wx, y) {
    if (y < 0 || y >= ROWS) return BEDROCK;
    var cx = worldToChunk(wx);
    var ch = ensureChunk(cx);
    var lx = wx - cx * CW;
    if (lx < 0 || lx >= CW) return BEDROCK;
    return ch.grid[y * CW + lx];
  }
  function set(wx, y, id) {
    if (y < 0 || y >= ROWS) return;
    var cx = worldToChunk(wx);
    var ch = ensureChunk(cx);
    var lx = wx - cx * CW;
    if (lx < 0 || lx >= CW) return;
    ch.grid[y * CW + lx] = id;
    ch.unstable[y * CW + lx] = 0;
  }
  function solidAt(wx, y) {
    var id = get(wx, y);
    return DEF[id] && DEF[id].solid;
  }
  function markUnstable(wx, y) {
    var cx = worldToChunk(wx);
    var ch = ensureChunk(cx);
    var lx = wx - cx * CW;
    if (lx >= 0 && lx < CW && y >= 0 && y < ROWS) ch.unstable[y * CW + lx] = 1;
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

  function swap(x1, y1, x2, y2) {
    var a = get(x1, y1);
    var b = get(x2, y2);
    set(x1, y1, b);
    set(x2, y2, a);
  }
  function stepPowder(x, y) {
    if (get(x, y) !== SAND) return;
    var b = get(x, y + 1);
    if (b === AIR || b === WATER) {
      swap(x, y, x, y + 1);
      return;
    }
    var dir = Math.random() < 0.5 ? -1 : 1;
    if (get(x + dir, y + 1) === AIR || get(x + dir, y + 1) === WATER) swap(x, y, x + dir, y + 1);
    else if (get(x - dir, y + 1) === AIR || get(x - dir, y + 1) === WATER) swap(x, y, x - dir, y + 1);
  }
  function stepLiquid(x, y, id) {
    if (get(x, y) !== id) return;
    var below = get(x, y + 1);
    if (below === AIR) {
      swap(x, y, x, y + 1);
      return;
    }
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
    var dir = Math.random() < 0.5 ? -1 : 1;
    if (get(x + dir, y) === AIR) swap(x, y, x + dir, y);
    else if (get(x - dir, y) === AIR) swap(x, y, x - dir, y);
  }

  function fallTree(tx, ty) {
    var dir = player.facing >= 0 ? 1 : -1;
    var parts = [];
    var seen = Object.create(null);
    var queue = [];
    function pushCell(x, y) {
      var id = get(x, y);
      if (id !== WOOD && id !== LEAF) return;
      var k = x + "," + y;
      if (seen[k]) return;
      seen[k] = 1;
      queue.push({ x: x, y: y, id: id });
    }
    pushCell(tx, ty);
    if (get(tx, ty) !== WOOD) {
      for (var dx0 = -2; dx0 <= 2; dx0++) for (var dy0 = -2; dy0 <= 2; dy0++) if (get(tx + dx0, ty + dy0) === WOOD) pushCell(tx + dx0, ty + dy0);
    }
    while (queue.length) {
      var c = queue.pop();
      parts.push(c);
      set(c.x, c.y, AIR);
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) if (dx || dy) pushCell(c.x + dx, c.y + dy);
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
    if (parts.length) toast("Дерево упало!", 1.4);
  }

  function treeSupported(tx, ty) {
    var y = ty;
    while (get(tx, y + 1) === WOOD || get(tx, y + 1) === LEAF) y++;
    var below = get(tx, y + 1);
    return below === STONE || below === DIRT || below === SAND || below === BEDROCK || below === WOOD || below === PLANK;
  }

  function checkUnsupportedTrees(x0, x1) {
    for (var x = x0; x <= x1; x++) {
      for (var y = ROWS - 4; y >= 1; y--) {
        if (get(x, y) !== WOOD) continue;
        if (get(x, y + 1) === WOOD) continue;
        if (!treeSupported(x, y)) {
          fallTree(x, y);
          return;
        }
      }
    }
  }

  function physicsNearPlayer() {
    var px = Math.floor(player.x / TS);
    var x0 = px - 28;
    var x1 = px + 28;
    for (var y = ROWS - 3; y >= 0; y--) {
      var ltr = y % 2 === 0;
      for (var n = 0; n <= x1 - x0; n++) {
        var x = ltr ? x0 + n : x1 - n;
        var id = get(x, y);
        if (id === SAND) stepPowder(x, y);
        else if (id === WATER || id === LAVA) stepLiquid(x, y, id);
      }
    }
    for (var cx = worldToChunk(x0); cx <= worldToChunk(x1); cx++) {
      var ch = ensureChunk(cx);
      for (var i = 0; i < ch.unstable.length; i++) {
        if (!ch.unstable[i]) continue;
        ch.unstable[i] = 0;
        var lx = i % CW;
        var uy = (i / CW) | 0;
        var wx = cx * CW + lx;
        if (get(wx, uy) === SAND) {
          for (var dx = -1; dx <= 1; dx++) if (get(wx + dx, uy) === SAND) markUnstable(wx + dx, uy);
        }
      }
    }
    checkUnsupportedTrees(x0, x1);
  }

  function disturbSandAt(tx, ty) {
    for (var dy = 0; dy <= 2; dy++) for (var dx = -1; dx <= 1; dx++) if (get(tx + dx, ty + dy) === SAND) markUnstable(tx + dx, ty + dy);
  }

  function hurtArm(amount, msg) {
    player.arm = Math.max(0, player.arm - amount);
    if (msg) toast(msg, 2);
    if (player.arm <= 0) toast("Рука сломана! E — хил", 3);
  }
  function damagePlayer(n, reason) {
    player.hp = Math.max(0, player.hp - n);
    if (player.hp <= 0) {
      toast("Погиб… возрождение у дома", 2.5);
      player.hp = 100;
      player.arm = 60;
      player.heat = 0;
      player.x = 8 * TS;
      player.y = (groundH(8) - 3) * TS;
    } else if (reason) toast(reason, 1.3);
  }

  function tryMine(tx, ty, dt) {
    var id = get(tx, ty);
    if (id === AIR || id === BEDROCK || id === WATER || id === LAVA) return;
    if (player.arm <= 0 && DEF[id].tree) return toast("Рука сломана — хил (E)", 1.4);
    if (!player.digOk || player.digTx !== tx || player.digTy !== ty) {
      player.digTx = tx;
      player.digTy = ty;
      player.digProg = 0;
      player.digOk = true;
    }
    var hard = DEF[id].hard || 1;
    var rate = DEF[id].tree ? 0.55 : 1.1;
    if (DEF[id].tree && Math.random() < dt * 0.35) hurtArm(8 + Math.random() * 12, "Ай! Рука");
    if (player.arm < 40) rate *= 0.55;
    player.digProg += (dt * rate) / hard;
    if (player.digProg < 1) return;
    player.digProg = 0;
    if (id === WOOD) {
      fallTree(tx, ty);
      player.inv.wood += 3;
    } else if (id === LEAF) {
      set(tx, ty, AIR);
      if (Math.random() < 0.25) player.inv.heal++;
    } else if (id === SAND) {
      set(tx, ty, AIR);
      player.inv.sand++;
      disturbSandAt(tx, ty);
    } else if (id === HEAL) {
      set(tx, ty, AIR);
      player.inv.heal++;
      toast("Ягода!", 1);
    } else if (id === CHEST) {
      set(tx, ty, AIR);
      var loot = 3 + ((hash(tx * 13 + ty) % 8) | 0);
      player.inv.coin += loot;
      player.inv.heal += 1;
      if (Math.random() < 0.4) player.inv.toy++;
      toast("Сундук! +" + loot + " монет", 2);
    } else if (id === PLANK) {
      set(tx, ty, AIR);
      player.inv.wood++;
    } else set(tx, ty, AIR);
    disturbSandAt(tx, ty + 1);
  }

  function tryPlace(tx, ty) {
    if (get(tx, ty) !== AIR) return;
    var px = Math.floor((player.x + player.w / 2) / TS);
    var py = Math.floor((player.y + player.h / 2) / TS);
    if (tx === px && (ty === py || ty === py - 1)) return;
    if (player.place === SAND) {
      if (player.inv.sand <= 0) return toast("Нет песка", 1);
      player.inv.sand--;
      set(tx, ty, SAND);
      disturbSandAt(tx, ty);
    } else if (player.place === WOOD || player.place === PLANK) {
      if (player.inv.wood <= 0) return toast("Нет дерева", 1);
      player.inv.wood--;
      set(tx, ty, PLANK);
    } else if (player.place === WATER) set(tx, ty, WATER);
  }

  function useHeal() {
    if (player.inv.heal <= 0) return toast("Нет ягод", 1.4);
    player.inv.heal--;
    player.hp = Math.min(100, player.hp + 28);
    player.arm = Math.min(100, player.arm + 40);
    player.heat = Math.max(0, player.heat - 25);
    toast("Хил!", 1.4);
  }

  function nearestEntity(kind, maxD) {
    var best = null;
    var bestD = maxD * maxD;
    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      if (kind && e.kind !== kind) continue;
      if (e.taken) continue;
      var dx = e.x - player.x;
      var dy = e.y - player.y;
      var d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function openShop(npc) {
    shopNpc = npc;
    var el = document.getElementById("shop");
    var body = document.getElementById("shop-body");
    body.innerHTML =
      "<b>" +
      npc.name +
      "</b><p style='margin:8px 0;opacity:.85;font:600 13px system-ui'>Торговля как в жизни — но цены странные.</p>" +
      "<div>У тебя 🪙" +
      player.inv.coin +
      "</div>" +
      '<button type="button" data-buy="heal">Ягода — 2🪙</button>' +
      '<button type="button" data-buy="sand">Песок×5 — 1🪙</button>' +
      '<button type="button" data-buy="wood">Дерево×3 — 2🪙</button>' +
      '<button type="button" data-buy="toy">Игрушка — 4🪙</button>' +
      '<button type="button" data-sell="toy">Продать игрушку +3🪙</button>' +
      '<button type="button" class="x" id="shop-close">Закрыть</button>';
    el.style.display = "flex";
    body.onclick = function (ev) {
      var t = ev.target;
      if (t.id === "shop-close") {
        el.style.display = "none";
        return;
      }
      var buy = t.getAttribute("data-buy");
      var sell = t.getAttribute("data-sell");
      if (buy === "heal" && player.inv.coin >= 2) {
        player.inv.coin -= 2;
        player.inv.heal++;
        toast("Купил ягоду", 1);
      } else if (buy === "sand" && player.inv.coin >= 1) {
        player.inv.coin -= 1;
        player.inv.sand += 5;
        toast("Купил песок", 1);
      } else if (buy === "wood" && player.inv.coin >= 2) {
        player.inv.coin -= 2;
        player.inv.wood += 3;
        toast("Купил дерево", 1);
      } else if (buy === "toy" && player.inv.coin >= 4) {
        player.inv.coin -= 4;
        player.inv.toy++;
        toast("Купил игрушку", 1);
      } else if (sell === "toy" && player.inv.toy > 0) {
        player.inv.toy--;
        player.inv.coin += 3;
        toast("Продал игрушку", 1);
      } else if (buy || sell) toast("Не хватает", 1);
      openShop(npc);
    };
  }

  function talk() {
    var toy = nearestEntity("toy", 40);
    if (toy) {
      toy.taken = true;
      player.inv.toy++;
      player.inv.coin += 1;
      toast("Нашёл игрушку! +1🪙", 2);
      return;
    }
    var bot = nearestEntity("bot", 50);
    if (bot) {
      if (bot.cool > 0) return toast("Бот отдыхает…", 1.5);
      bot.cool = 25;
      var gift = hash((player.x / TS) | 0) % 3;
      if (gift === 0) {
        player.inv.heal += 2;
        toast(bot.name + ": держи ягоды!", 2);
      } else if (gift === 1) {
        player.inv.sand += 6;
        toast(bot.name + ": вот песок", 2);
      } else {
        player.inv.wood += 4;
        player.inv.coin += 2;
        toast(bot.name + ": дерево и монеты!", 2);
      }
      return;
    }
    var tr = nearestEntity("trader", 50);
    if (tr) {
      openShop(tr);
      return;
    }
    toast("Рядом никого. Ищи дома, сундуки, ботов →", 2);
  }

  function worldMouse() {
    var r = canvas.getBoundingClientRect();
    return {
      x: ((mouse.x - r.left) * canvas.width) / r.width + camX,
      y: ((mouse.y - r.top) * canvas.height) / r.height + camY,
    };
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
      disturbSandAt(Math.floor((player.x + player.w / 2) / TS), Math.floor((player.y + player.h + 2) / TS));
    }
    jumpQ = false;
    player.x += player.vx * dt;
    collide(true);
    player.y += player.vy * dt;
    player.onGround = false;
    collide(false);

    var feetX = Math.floor((player.x + player.w / 2) / TS);
    var feetY = Math.floor((player.y + player.h + 1) / TS);
    if (get(feetX, feetY) === SAND || get(feetX, feetY - 1) === SAND) {
      if (Math.abs(player.vx) > 20 || Math.abs(player.vy) > 40) disturbSandAt(feetX, feetY);
    }
    var hx = Math.floor((player.x + player.w / 2) / TS);
    var hy = Math.floor((player.y + player.h / 2) / TS);
    if (get(hx, hy) === HEAL) {
      set(hx, hy, AIR);
      player.inv.heal++;
      toast("Ягода", 1);
    }
    var nearLava = false;
    for (var dx = -2; dx <= 2; dx++) for (var dy = -2; dy <= 2; dy++) if (get(hx + dx, hy + dy) === LAVA) nearLava = true;
    var inWater = get(hx, hy) === WATER || get(hx, hy + 1) === WATER;
    if (nearLava && !inWater) {
      player.heat = Math.min(100, player.heat + dt * 28);
      if (player.heat > 70) damagePlayer(dt * 12, "Обжог!");
    } else player.heat = Math.max(0, player.heat - dt * (inWater ? 40 : 12));
    if (get(hx, hy) === LAVA || get(hx, hy + 1) === LAVA) {
      damagePlayer(dt * 35, "Лава!");
      player.heat = 100;
    }

    // подгружаем чанки вокруг
    var pcx = worldToChunk(hx);
    for (var c = pcx - 2; c <= pcx + 2; c++) ensureChunk(c);
  }

  function updateFalling(dt) {
    for (var i = falling.length - 1; i >= 0; i--) {
      var f = falling[i];
      f.vy += 900 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      f.life -= dt;
      if (f.id === WOOD && f.vy > 80 && f.x < player.x + player.w && f.x + TS > player.x && f.y < player.y + player.h && f.y + TS > player.y) {
        damagePlayer(8, "Упало дерево!");
        hurtArm(12, null);
        f.life = 0;
      }
      var tx = Math.floor((f.x + TS / 2) / TS);
      var ty = Math.floor((f.y + TS / 2) / TS);
      if (f.life <= 0 || (f.vy > 0 && solidAt(tx, ty + 1))) {
        if (f.id === WOOD) player.inv.wood++;
        else if (f.id === LEAF && Math.random() < 0.2) player.inv.heal++;
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
    document.getElementById("coin-n").textContent = player.inv.coin;
    document.getElementById("toy-n").textContent = player.inv.toy;
    document.getElementById("px").textContent = Math.floor(player.x / TS);
  }

  function update(dt) {
    if (!started) return;
    for (var i = 0; i < entities.length; i++) if (entities[i].cool > 0) entities[i].cool -= dt;
    physAcc += dt;
    while (physAcc >= 1 / 28) {
      physicsNearPlayer();
      physAcc -= 1 / 28;
    }
    movePlayer(dt);
    updateFalling(dt);
    if (mouse.down) {
      var m = worldMouse();
      var tx = Math.floor(m.x / TS);
      var ty = Math.floor(m.y / TS);
      var dx = tx - Math.floor((player.x + player.w / 2) / TS);
      var dy = ty - Math.floor((player.y + player.h / 2) / TS);
      if (dx * dx + dy * dy <= 25) tryMine(tx, ty, dt);
    } else {
      player.digProg = 0;
      player.digOk = false;
    }
    if (mouse.rdown) {
      var m2 = worldMouse();
      var tx2 = Math.floor(m2.x / TS);
      var ty2 = Math.floor(m2.y / TS);
      var dx2 = tx2 - Math.floor((player.x + player.w / 2) / TS);
      var dy2 = ty2 - Math.floor((player.y + player.h / 2) / TS);
      if (dx2 * dx2 + dy2 * dy2 <= 25) {
        tryPlace(tx2, ty2);
        mouse.rdown = false;
      }
    }
    camX = player.x + player.w / 2 - W / 2;
    camY = player.y + player.h / 2 - H / 2;
    camY = Math.max(0, Math.min(ROWS * TS - H, camY));
    updateHud();
  }

  function drawTile(id, x, y, w, h) {
    if (!id) return;
    var d = DEF[id];
    var name = d && d.tile;
    if (id === LAVA && Math.floor(animT * 6) % 2) name = "lava_top";
    if (tiles && name && tiles.draw(ctx, name, x, y, w, h, false)) return;
    var colors = { 1: "#64748b", 2: "#92400e", 3: "#eab308", 4: "#38bdf8", 5: "#a16207", 6: "#22c55e", 7: "#ef4444", 8: "#f43f5e", 9: "#334155", 10: "#b45309", 11: "#fbbf24" };
    ctx.fillStyle = colors[id] || "#888";
    ctx.fillRect(x, y, w, h);
  }

  function draw() {
    var tint = season > 1 ? "rgba(251,146,60,0.25)" : season < 0 ? "rgba(56,189,248,0.2)" : "rgba(124,45,18,0.3)";
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, W, H);
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#431407";
      ctx.fillRect(0, 0, W, H);
    }
    if (!started) return;
    var x0 = Math.floor(camX / TS) - 1;
    var y0 = Math.max(0, Math.floor(camY / TS) - 1);
    var x1 = Math.ceil((camX + W) / TS) + 1;
    var y1 = Math.min(ROWS - 1, Math.ceil((camY + H) / TS) + 1);
    ctx.save();
    ctx.translate(-camX, -camY);
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) drawTile(get(x, y), x * TS, y * TS, TS, TS);
    if (player.digOk && player.digProg > 0) {
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(player.digTx * TS + 2, player.digTy * TS + 2, TS - 4, TS - 4);
    }
    for (var i = 0; i < falling.length; i++) {
      var f = falling[i];
      ctx.save();
      ctx.translate(f.x + TS / 2, f.y + TS / 2);
      ctx.rotate(f.rot);
      drawTile(f.id, -TS / 2, -TS / 2, TS, TS);
      ctx.restore();
    }
    for (var e = 0; e < entities.length; e++) {
      var ent = entities[e];
      if (ent.taken) continue;
      if (ent.x < camX - 40 || ent.x > camX + W + 40) continue;
      if (ent.kind === "trader") {
        chars && chars.draw(ctx, "character_green_idle", ent.x - 8, ent.y - 20, 36, 40, false);
        ctx.fillStyle = "#fff";
        ctx.font = "800 10px system-ui";
        ctx.fillText("торговец", ent.x - 10, ent.y - 24);
      } else if (ent.kind === "bot") {
        chars && chars.draw(ctx, "character_purple_idle", ent.x - 8, ent.y - 20, 36, 40, false);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "800 10px system-ui";
        ctx.fillText("бот", ent.x, ent.y - 24);
      } else if (ent.kind === "toy") {
        tiles && tiles.draw(ctx, "gem_yellow", ent.x, ent.y, 18, 18, false);
      } else if (ent.kind === "house") {
        ctx.fillStyle = "rgba(255,255,255,.7)";
        ctx.font = "800 11px system-ui";
        ctx.fillText("дом", ent.x, ent.y);
      }
    }
    var pref = "character_" + skin + "_";
    var pf = pref + "idle";
    if (!player.onGround) pf = pref + "jump";
    else if (Math.abs(player.vx) > 20) pf = pref + (Math.floor(animT * 8) % 2 ? "walk_a" : "walk_b");
    if (player.heat > 70) pf = pref + "hit";
    if (!(chars && chars.draw(ctx, pf, player.x - 10, player.y - 14, player.w + 20, player.h + 16, player.facing < 0))) {
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(player.x + 9, player.y + 8, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    var m = worldMouse();
    ctx.strokeStyle = "#fdba74";
    ctx.beginPath();
    ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
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

  function beginGame() {
    player.name = (document.getElementById("name").value || "Амаль").slice(0, 16);
    player.year = Math.max(1900, Math.min(2099, parseInt(document.getElementById("year").value, 10) || 2026));
    season = player.year % 4 === 0 ? 1 : player.year % 3 === 0 ? -1 : 0;
    document.getElementById("pname").textContent = player.name;
    document.getElementById("pyear").textContent = String(player.year);
    document.getElementById("char").style.display = "none";
    document.getElementById("hud").style.display = "block";
    document.getElementById("inv").style.display = "block";
    document.getElementById("btns").style.display = "flex";
    chunks = Object.create(null);
    entities = [];
    for (var c = -2; c <= 2; c++) ensureChunk(c);
    player.x = 10 * TS;
    player.y = (groundH(10) - 3) * TS;
    started = true;
    try {
      localStorage.setItem(SAVE, JSON.stringify({ name: player.name, year: player.year, skin: skin }));
    } catch (_) {}
    toast("Мир без края. Иди вправо/влево — дома, сундуки, боты!", 4);
  }

  // character UI
  var skinBtns = document.querySelectorAll("#skins button");
  for (var s = 0; s < skinBtns.length; s++) {
    skinBtns[s].onclick = function () {
      for (var i = 0; i < skinBtns.length; i++) skinBtns[i].classList.remove("on");
      this.classList.add("on");
      skin = this.getAttribute("data-skin");
    };
  }
  try {
    var saved = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (saved) {
      if (saved.name) document.getElementById("name").value = saved.name;
      if (saved.year) document.getElementById("year").value = saved.year;
      if (saved.skin) {
        skin = saved.skin;
        for (var i = 0; i < skinBtns.length; i++) {
          skinBtns[i].classList.toggle("on", skinBtns[i].getAttribute("data-skin") === skin);
        }
      }
    }
  } catch (_) {}
  document.getElementById("start").onclick = beginGame;

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
  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (!started) return;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      jumpQ = true;
    }
    if (e.code === "KeyE") useHeal();
    if (e.code === "KeyF") talk();
    if (e.code === "Digit1") {
      player.place = SAND;
      toast("Ставить: песок", 1);
    }
    if (e.code === "Digit2") {
      player.place = PLANK;
      toast("Ставить: доски", 1);
    }
    if (e.code === "Digit3") {
      player.place = WATER;
      toast("Ставить: вода", 1);
    }
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });
  document.getElementById("btn-heal").onclick = useHeal;
  document.getElementById("btn-talk").onclick = talk;
  document.getElementById("btn-jump").onpointerdown = function (e) {
    e.preventDefault();
    jumpQ = true;
  };

  var pad = document.getElementById("pad");
  var knob = document.getElementById("pad-knob");
  var stickOn = false;
  function setStick(cx, cy) {
    var r = pad.getBoundingClientRect();
    stickX = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width / 2)));
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
    loadImage(ASSET + "Backgrounds/background_color_hills.png"),
  ])
    .then(function (arr) {
      tiles = makeAtlas(arr[0], parseAtlas(arr[1]));
      chars = makeAtlas(arr[2], parseAtlas(arr[3]));
      bgImg = arr[4];
      requestAnimationFrame(frame);
    })
    .catch(function () {
      requestAnimationFrame(frame);
    });
})();
