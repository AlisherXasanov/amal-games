/**
 * Валера Idle · Студия
 * Механика как idle-tycoon: источник → доставщики/коптеры → герой на «троне».
 * Текстуры новые: Kenney Shape Characters + Platformer Art Pixel (CC0) — не мебель из дома.
 * Прокачка: Валера + подруга Лина (розовая) + юниты.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var AS = "../shared/kenney-shapes/";
  var AP = "../shared/kenney-plat-art/";
  var SAVE = "amal-valera-idle-v1";
  var W = 960,
    H = 420;
  var GROUND = H - 56;

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var floatEl = document.getElementById("float");
  var toastEl = document.getElementById("toast");
  var shopEl = document.getElementById("shop");
  var coinsEl = document.getElementById("coins");
  var gemsEl = document.getElementById("gems");
  var roomNameEl = document.getElementById("roomName");
  var toastT = 0;
  var imgs = {};
  var t = 0;

  var ROOMS = [
    {
      id: "studio",
      name: "Студия",
      bg: "#3d4654",
      floor: "#2a3140",
      sourceX: 140,
      throneX: 820,
      unlock: 0,
    },
    {
      id: "lab",
      name: "Лаборатория",
      bg: "#1e3a4c",
      floor: "#163040",
      sourceX: 150,
      throneX: 800,
      unlock: 2500,
    },
    {
      id: "kitchen",
      name: "Кухня опытов",
      bg: "#3a2f28",
      floor: "#2a221c",
      sourceX: 160,
      throneX: 790,
      unlock: 18000,
    },
  ];

  var SHOP = [
    {
      id: "carrier",
      name: "Доставщик",
      max: 6,
      base: 25,
      grow: 1.55,
      spr: "red_body_circle",
      tip: "Бегает от блока к Валере",
    },
    {
      id: "copter",
      name: "Коптер",
      max: 4,
      base: 120,
      grow: 1.7,
      spr: "tile_cloud",
      tip: "Летает и таскает монеты",
    },
    {
      id: "lina",
      name: "Лина",
      max: 8,
      base: 200,
      grow: 1.85,
      spr: "pink_body_circle",
      tip: "Подруга · усиливает доход",
      isHero: true,
    },
    {
      id: "miner",
      name: "Добытчик",
      max: 5,
      base: 80,
      grow: 1.6,
      spr: "green_body_circle",
      tip: "Бьёт блок быстрее",
    },
  ];

  var state = {
    coins: 40,
    gems: 0,
    room: 0,
    buff: 0,
    lina: 0,
    units: { carrier: 1, copter: 0, miner: 0 },
    giftT: 0,
    totalEarned: 0,
  };

  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      state.coins = d.coins || 40;
      state.gems = d.gems || 0;
      state.room = Math.min(ROOMS.length - 1, d.room || 0);
      state.buff = d.buff || 0;
      state.lina = d.lina || 0;
      state.units = d.units || state.units;
      state.totalEarned = d.totalEarned || 0;
    }
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(
        SAVE,
        JSON.stringify({
          coins: Math.floor(state.coins),
          gems: state.gems,
          room: state.room,
          buff: state.buff,
          lina: state.lina,
          units: state.units,
          totalEarned: Math.floor(state.totalEarned),
        })
      );
    } catch (_) {}
  }

  function toast(m) {
    toastEl.textContent = m;
    toastEl.style.display = "block";
    toastT = 2.2;
  }

  function fmt(n) {
    n = Math.floor(n);
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + " млн";
    if (n >= 1000) return (n / 1000).toFixed(3).replace(/\.?0+$/, "") + " тыс";
    return String(n);
  }

  function room() {
    return ROOMS[state.room];
  }

  function mult() {
    return (1 + state.buff * 0.35) * (1 + state.lina * 0.28) * (1 + state.room * 0.4);
  }

  function deliveryPay() {
    return Math.floor((8 + state.buff * 3 + state.lina * 4) * (1 + state.room * 0.5));
  }

  function priceOf(item) {
    var owned = item.id === "lina" ? state.lina : state.units[item.id] || 0;
    return Math.floor(item.base * Math.pow(item.grow, owned));
  }

  function ownedOf(item) {
    return item.id === "lina" ? state.lina : state.units[item.id] || 0;
  }

  /* entities */
  var carriers = [];
  var copters = [];
  var miners = [];
  var pops = [];
  var blockPulse = 0;
  var blockCoins = [];

  function syncUnits() {
    while (carriers.length < (state.units.carrier || 0)) {
      carriers.push({
        x: 200 + Math.random() * 200,
        y: GROUND - 36,
        phase: Math.random() < 0.5 ? "toSource" : "toThrone",
        load: 0,
        speed: 90 + Math.random() * 40,
        bob: Math.random() * 10,
      });
    }
    while (carriers.length > (state.units.carrier || 0)) carriers.pop();

    while (copters.length < (state.units.copter || 0)) {
      copters.push({
        x: 250 + Math.random() * 300,
        y: 80 + Math.random() * 60,
        phase: "toSource",
        load: 0,
        speed: 130 + Math.random() * 50,
        bob: Math.random() * 6,
      });
    }
    while (copters.length > (state.units.copter || 0)) copters.pop();

    while (miners.length < (state.units.miner || 0)) {
      miners.push({
        x: room().sourceX - 10 + Math.random() * 30,
        y: GROUND - 36,
        hitT: Math.random(),
        bob: Math.random() * 4,
      });
    }
    while (miners.length > (state.units.miner || 0)) miners.pop();
  }

  function addCoins(n, x, y) {
    n = Math.floor(n * mult());
    if (n < 1) n = 1;
    state.coins += n;
    state.totalEarned += n;
    pop("+" + n, x, y);
    refreshHud();
    save();
  }

  function pop(txt, x, y) {
    var r = canvas.getBoundingClientRect();
    var sx = (x / W) * r.width;
    var sy = (y / H) * r.height;
    var el = document.createElement("div");
    el.className = "pop";
    el.textContent = txt;
    el.style.left = sx + "px";
    el.style.top = sy + "px";
    floatEl.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 1000);
  }

  function load(src) {
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () {
        res(i);
      };
      i.onerror = function () {
        res(null);
      };
      i.src = src;
    });
  }

  function drawImg(name, x, y, w, h, flip) {
    var im = imgs[name];
    if (!im) return false;
    ctx.save();
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(im, 0, 0, w, h);
    } else {
      ctx.drawImage(im, x, y, w, h);
    }
    ctx.restore();
    return true;
  }

  function drawShape(body, face, x, y, s, flip) {
    var sh = imgs.shadow;
    if (sh) ctx.drawImage(sh, x + s * 0.1, y + s * 0.85, s * 0.8, s * 0.25);
    drawImg(body, x, y, s, s, flip);
    if (face) drawImg(face, x + s * 0.22, y + s * 0.18, s * 0.55, s * 0.55, flip);
  }

  function refreshHud() {
    coinsEl.textContent = fmt(state.coins);
    gemsEl.textContent = String(state.gems);
    roomNameEl.textContent = room().name;
    document.getElementById("navL").disabled = state.room <= 0;
    document.getElementById("navR").disabled = state.room >= ROOMS.length - 1;
    renderShop();
  }

  function renderShop() {
    shopEl.innerHTML = "";
    SHOP.forEach(function (item) {
      var owned = ownedOf(item);
      var maxed = owned >= item.max;
      var price = priceOf(item);
      var card = document.createElement("div");
      card.className = "card" + (maxed ? " max" : "");
      var img = document.createElement("img");
      img.src = AS + item.spr + ".png";
      img.alt = "";
      var title = document.createElement("b");
      title.textContent = item.name;
      var meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = maxed ? "Максимум! " + owned + "/" + item.max : owned + "/" + item.max;
      var priceEl = document.createElement("div");
      priceEl.className = "price";
      priceEl.textContent = maxed ? "✓" : "🪙 " + fmt(price);
      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(priceEl);
      card.title = item.tip;
      card.onclick = function () {
        buy(item);
      };
      shopEl.appendChild(card);
    });
  }

  function buy(item) {
    var owned = ownedOf(item);
    if (owned >= item.max) {
      toast("Уже максимум!");
      return;
    }
    var p = priceOf(item);
    if (state.coins < p) {
      toast("Мало монет");
      return;
    }
    state.coins -= p;
    if (item.id === "lina") {
      state.lina++;
      toast("Лина +" + state.lina + " · доход растёт!");
    } else {
      state.units[item.id] = (state.units[item.id] || 0) + 1;
      toast(item.name + " нанят!");
    }
    syncUnits();
    refreshHud();
    save();
  }

  function buffPrice() {
    return Math.floor(150 * Math.pow(1.65, state.buff));
  }

  function buyBuff() {
    var p = buffPrice();
    if (state.coins < p) {
      toast("Нужно " + fmt(p));
      return;
    }
    state.coins -= p;
    state.buff++;
    toast("Валера усилен ×" + (1 + state.buff * 0.35).toFixed(2));
    refreshHud();
    save();
  }

  function gift() {
    if (state.giftT > 0) {
      toast("Бонус через " + Math.ceil(state.giftT) + "с");
      return;
    }
    var n = 40 + state.buff * 15 + state.lina * 20 + state.room * 50;
    addCoins(n, W / 2, 120);
    state.gems += 1;
    state.giftT = 45;
    toast("🎁 Бонус студии!");
    refreshHud();
    save();
  }

  function goRoom(dir) {
    var n = state.room + dir;
    if (n < 0 || n >= ROOMS.length) return;
    var need = ROOMS[n].unlock;
    if (state.totalEarned < need && dir > 0) {
      toast("Ещё рано. Заработай всего ~" + fmt(need));
      return;
    }
    state.room = n;
    miners.forEach(function (m) {
      m.x = room().sourceX - 10 + Math.random() * 30;
    });
    toast(room().name);
    refreshHud();
    save();
  }

  function hitBlock(manual) {
    blockPulse = 0.25;
    var pay = manual ? 3 + state.buff : 2 + Math.floor(state.units.miner * 0.5);
    var R = room();
    addCoins(pay, R.sourceX, GROUND - 70);
    if (Math.random() < 0.35) {
      blockCoins.push({
        x: R.sourceX + (Math.random() * 40 - 20),
        y: GROUND - 80,
        vy: -80 - Math.random() * 40,
        life: 0.8,
      });
    }
  }

  function update(dt) {
    t += dt;
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.style.display = "none";
    }
    if (state.giftT > 0) state.giftT -= dt;
    if (blockPulse > 0) blockPulse -= dt;

    var R = room();
    var src = R.sourceX;
    var thr = R.throneX;

    miners.forEach(function (m) {
      m.hitT -= dt;
      m.bob += dt * 8;
      if (m.hitT <= 0) {
        m.hitT = Math.max(0.35, 1.1 - state.units.miner * 0.08);
        hitBlock(false);
      }
    });

    carriers.forEach(function (c) {
      c.bob += dt * 10;
      var target = c.phase === "toSource" ? src : thr;
      var dx = target - c.x;
      var step = c.speed * dt * (1 + state.buff * 0.05);
      if (Math.abs(dx) < 12) {
        if (c.phase === "toSource") {
          c.load = deliveryPay();
          c.phase = "toThrone";
        } else {
          addCoins(c.load || deliveryPay(), thr, GROUND - 90);
          c.load = 0;
          c.phase = "toSource";
        }
      } else {
        c.x += Math.sign(dx) * step;
      }
    });

    copters.forEach(function (c) {
      c.bob += dt * 14;
      var target = c.phase === "toSource" ? src : thr;
      var dx = target - c.x;
      var step = c.speed * dt;
      c.y = 70 + Math.sin(c.bob) * 10;
      if (Math.abs(dx) < 14) {
        if (c.phase === "toSource") {
          c.load = Math.floor(deliveryPay() * 1.6);
          c.phase = "toThrone";
        } else {
          addCoins(c.load || deliveryPay(), thr, 100);
          c.load = 0;
          c.phase = "toSource";
        }
      } else c.x += Math.sign(dx) * step;
    });

    for (var i = blockCoins.length - 1; i >= 0; i--) {
      var bc = blockCoins[i];
      bc.life -= dt;
      bc.y += bc.vy * dt;
      bc.vy += 280 * dt;
      if (bc.life <= 0) blockCoins.splice(i, 1);
    }
  }

  function drawFloor(R) {
    ctx.fillStyle = R.bg;
    ctx.fillRect(0, 0, W, H);
    /* soft sky stripe */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var tile = imgs.tile || imgs.tile_center;
    var tw = 48;
    for (var x = 0; x < W; x += tw) {
      if (tile) ctx.drawImage(tile, x, GROUND, tw, tw);
      else {
        ctx.fillStyle = R.floor;
        ctx.fillRect(x, GROUND, tw, H - GROUND);
      }
    }
    if (imgs.tile_background_grass) {
      for (var gx = 40; gx < W; gx += 160) {
        ctx.drawImage(imgs.tile_background_grass, gx, GROUND - 40, 64, 48);
      }
    }
  }

  function draw() {
    var R = room();
    drawFloor(R);

    /* source block */
    var bs = 64 + (blockPulse > 0 ? 6 : 0);
    var bx = R.sourceX - bs / 2;
    var by = GROUND - bs - 4;
    if (!drawImg("tile_exclamation", bx, by, bs, bs)) {
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(bx, by, bs, bs);
      ctx.fillStyle = "#fff";
      ctx.font = "900 36px system-ui";
      ctx.fillText("?", bx + 18, by + 46);
    }

    blockCoins.forEach(function (bc) {
      drawImg("tile_coin", bc.x, bc.y, 22, 22);
    });

    /* miners */
    miners.forEach(function (m) {
      var bob = Math.sin(m.bob) * 3;
      drawShape("green_body_circle", "face_c", m.x - 22, m.y - 8 + bob, 44, false);
    });

    /* carriers */
    carriers.forEach(function (c) {
      var bob = Math.abs(Math.sin(c.bob)) * 4;
      var flip = c.phase === "toSource";
      drawShape("red_body_circle", "face_a", c.x - 22, c.y - 8 + bob, 44, flip);
      if (c.load) drawImg("tile_coin", c.x + (flip ? -18 : 10), c.y - 6, 20, 20);
    });

    /* copters */
    copters.forEach(function (c) {
      drawImg("tile_cloud", c.x - 28, c.y - 10, 56, 40);
      if (c.load) drawImg("tile_coin", c.x - 10, c.y + 18, 22, 22);
      /* prop blur */
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 24, c.y - 12);
      ctx.lineTo(c.x + 24, c.y - 12);
      ctx.stroke();
    });

    /* throne / chair for Valera */
    var tx = R.throneX;
    ctx.fillStyle = "#b45309";
    ctx.fillRect(tx - 36, GROUND - 70, 72, 70);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(tx - 40, GROUND - 78, 80, 16);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(tx - 28, GROUND - 100, 56, 28);

    /* Valera yellow king */
    var vb = 4 + Math.sin(t * 3) * 2;
    drawShape("yellow_body_squircle", "face_b", tx - 36, GROUND - 118 + vb, 72, false);
    /* crown */
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(tx - 20, GROUND - 112 + vb);
    ctx.lineTo(tx - 12, GROUND - 128 + vb);
    ctx.lineTo(tx, GROUND - 112 + vb);
    ctx.lineTo(tx + 12, GROUND - 128 + vb);
    ctx.lineTo(tx + 20, GROUND - 112 + vb);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff7ed";
    ctx.font = "800 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Валера", tx, GROUND - 8);

    /* Lina — pink upgrade girl beside throne */
    if (state.lina > 0) {
      var lx = tx - 110;
      var lb = Math.sin(t * 4) * 3;
      drawShape("pink_body_circle", "face_e", lx - 28, GROUND - 90 + lb, 56, false);
      ctx.fillStyle = "#fce7f3";
      ctx.fillText("Лина ×" + state.lina, lx, GROUND - 8);
    }
    ctx.textAlign = "left";

    /* hint */
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(16, 16, 220, 36);
    ctx.fillStyle = "#fde68a";
    ctx.font = "700 12px system-ui";
    ctx.fillText("Тап по жёлтому блоку · юниты сами", 24, 38);
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect();
    var x = ((e.clientX - r.left) * W) / r.width;
    var y = ((e.clientY - r.top) * H) / r.height;
    var R = room();
    if (Math.hypot(x - R.sourceX, y - (GROUND - 40)) < 70) {
      hitBlock(true);
    }
  });

  document.getElementById("btn-buff").onclick = buyBuff;
  document.getElementById("btn-gift").onclick = gift;
  document.getElementById("navL").onclick = function () {
    goRoom(-1);
  };
  document.getElementById("navR").onclick = function () {
    goRoom(1);
  };

  var names = [
    "yellow_body_circle",
    "yellow_body_squircle",
    "pink_body_circle",
    "red_body_circle",
    "green_body_circle",
    "face_a",
    "face_b",
    "face_c",
    "face_e",
    "shadow",
    "tile",
    "tile_coin",
    "tile_exclamation",
    "tile_cloud",
    "tile_center",
    "tile_background_grass",
  ];

  Promise.all(
    names.map(function (n) {
      return load(AS + n + ".png").then(function (im) {
        imgs[n] = im;
      });
    })
  ).then(function () {
    var coinIco = document.getElementById("ico-coin");
    if (imgs.tile_coin) coinIco.src = AS + "tile_coin.png";
    syncUnits();
    refreshHud();
    document.getElementById("btn-buff").textContent = "⚡ Усиление · " + fmt(buffPrice());
    setInterval(function () {
      document.getElementById("btn-buff").textContent = "⚡ Усиление · " + fmt(buffPrice());
    }, 500);
    toast("Новые текстуры Kenney · прокачай Лину и Валеру");
    requestAnimationFrame(frame);
  });
})();
