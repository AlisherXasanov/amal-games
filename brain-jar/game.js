/**
 * Мозг в колбе + Ишка — лаборатория 2D, доставка колбы, чат с помощницей.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var ASSET = "../shared/kenney-platformer/";
  var TILE = 48;
  var GRAV = 2100;
  var JUMP = 700;
  var JUMP2 = 620;
  var SPEED = 270;
  var SPEED_CARRY = 200;
  var SAVE = "amal-brain-jar-v2";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var face = document.getElementById("ai-face");
  var fctx = face.getContext("2d");

  var toastEl = document.getElementById("toast");
  var toastT = 0;
  function toast(msg, t) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    toastT = t == null ? 2.2 : t;
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
    while ((m = re.exec(xmlText))) frames[m[1]] = { x: +m[2], y: +m[3], w: +m[4], h: +m[5] };
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
        } else c.drawImage(img, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
        c.restore();
        return true;
      },
    };
  }

  function drawBrainJar(c, x, y, scale, t, glow) {
    var s = scale || 1;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    if (glow) {
      c.fillStyle = "rgba(168,85,247," + (0.2 + Math.sin(t * 4) * 0.08) + ")";
      c.beginPath();
      c.arc(0, -6, 28, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#64748b";
    c.fillRect(-14, 18, 28, 8);
    c.fillStyle = "#94a3b8";
    c.fillRect(-16, 14, 32, 6);
    c.strokeStyle = "rgba(200,230,255,0.85)";
    c.lineWidth = 3;
    c.fillStyle = "rgba(120,200,255,0.18)";
    c.beginPath();
    c.moveTo(-12, 14);
    c.lineTo(-14, -22);
    c.quadraticCurveTo(-14, -34, 0, -36);
    c.quadraticCurveTo(14, -34, 14, -22);
    c.lineTo(12, 14);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "rgba(192,132,252,0.35)";
    c.fillRect(-11, -4, 22, 14);
    var by = -14 + Math.sin(t * 3) * 2;
    c.fillStyle = "#f9a8d4";
    c.beginPath();
    c.ellipse(0, by, 10, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#f472b6";
    c.beginPath();
    c.ellipse(-4, by - 2, 5, 4, -0.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(4, by - 1, 5, 4, 0.3, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(255,255,255,0.5)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-8, -20);
    c.lineTo(-9, 0);
    c.stroke();
    c.restore();
  }

  function drawDeliveryTube(c, x, y, t, ready) {
    c.save();
    c.translate(x, y);
    c.fillStyle = "#334155";
    c.fillRect(-22, -8, 44, 56);
    c.fillStyle = ready ? "rgba(74,222,128,0.35)" : "rgba(56,189,248,0.25)";
    c.fillRect(-16, 0, 32, 40);
    c.strokeStyle = ready ? "#4ade80" : "#38bdf8";
    c.lineWidth = 3;
    c.strokeRect(-16, 0, 32, 40);
    c.fillStyle = "#94a3b8";
    c.fillRect(-26, -14, 52, 10);
    c.fillStyle = ready ? "#86efac" : "#7dd3fc";
    c.font = "900 11px system-ui";
    c.textAlign = "center";
    c.fillText(ready ? "СЮДА!" : "ТРУБА", 0, -20);
    c.restore();
  }

  var LEVELS = [
    { name: "Лаба · старт", map: ["..........................................","..........................................",".............====.........................","..........................................","........====.............====.............","..........................................","J.....S.......................T...........","P.........................................","##########################################","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"] },
    { name: "Шипы", map: ["..........................................",".................====.....................","..........====.........====...............","....====.......................====.......","J......^^^^....S..........B........T......","P.........................................","##########################################","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"] },
    { name: "Полки", map: ["..............C...........................","...........====..............====.........",".....====...........B...........====......","...............====.......................","J....S.....................^^^^......T....","P.........................................","##########################################","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"] },
    { name: "Коридор", map: [".........====.....====.....====...........","....====......................====........","..............S........B..................",".........====.....====.....====...........","J...^^^^......................^^^^...T....","P.........................................","##########################################","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"] },
    { name: "Больше врагов", map: ["...........====.....====.....====.........","......====.....................====.......","....S....B....S....B....S.................",".........====.....====.....====...........","J..^^^^......................^^^^....T....","P.........................................","##########################################","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"] },
    { name: "Финальная труба", map: [".................====.....................","..........====.........====...............",".....====......B......S......====.........",".........====.....====.....====...........","J..^^^^..S....^^^^....B....^^^^......T....","P.........................................","##########################################","DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"] },
  ];

  var state = { level: 0, hp: 3 };
  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d && d.level != null) state.level = Math.min(d.level, LEVELS.length - 1);
  } catch (_) {}

  var world = null;
  var chars, tiles, enemies, bgHills;
  var camX = 0;
  var animT = 0;
  var keys = Object.create(null);
  var stickX = 0;
  var jumpQueued = false;
  var interactQueued = false;

  function syncHud() {
    document.getElementById("lvl").textContent = String(state.level + 1);
    document.getElementById("lvlt").textContent = String(LEVELS.length);
    document.getElementById("hp").textContent = String(Math.max(0, state.hp));
    document.getElementById("jumps").textContent = world && world.player ? String(world.player.jumpsLeft) : "2";
    document.getElementById("carry").textContent = world && world.carrying ? "несёшь колбу!" : "E — взять / сдать";
    document.getElementById("btn-restart").style.display = world && world.dead ? "block" : "block";
  }

  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify({ level: state.level }));
    } catch (_) {}
  }

  function buildLevel(idx) {
    var L = LEVELS[idx];
    var map = L.map;
    var rows = map.length;
    var cols = map[0].length;
    var solids = [];
    var hazards = [];
    var mobs = [];
    var jar = null;
    var tube = null;
    var player = { x: TILE * 2, y: TILE, vx: 0, vy: 0, w: 36, h: 52, onGround: false, facing: 1, hurtT: 0, jumpsLeft: 2 };

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var ch = map[y][x];
        var px = x * TILE;
        var py = y * TILE;
        if (ch === "#" || ch === "D") {
          var sprite = ch === "#" ? "terrain_purple_block_top" : "terrain_purple_block_center";
          solids.push({ x: px, y: py, w: TILE, h: TILE, sprite: sprite });
        } else if (ch === "=") {
          var left = x > 0 && map[y][x - 1] === "=";
          var right = x < cols - 1 && map[y][x + 1] === "=";
          var ps = !left && right ? "terrain_purple_horizontal_left" : left && !right ? "terrain_purple_horizontal_right" : "terrain_purple_horizontal_middle";
          solids.push({ x: px, y: py + 10, w: TILE, h: 22, sprite: ps, platform: true, drawY: py });
        } else if (ch === "^") {
          hazards.push({ x: px + 6, y: py + 20, w: TILE - 12, h: TILE - 20, sprite: "spikes" });
        } else if (ch === "S") {
          mobs.push({ kind: "slime", x: px + 4, y: py, w: 40, h: 40, vx: -50, vy: 0, anim: 0 });
        } else if (ch === "B") {
          mobs.push({ kind: "bee", x: px, y: py, w: 40, h: 36, baseY: py, phase: Math.random() * 6, anim: 0 });
        } else if (ch === "J") {
          jar = { x: px + 24, y: py + 20, w: 36, h: 48, held: false, vx: 0, vy: 0 };
        } else if (ch === "T") {
          tube = { x: px + 24, y: py - 8, w: 44, h: 56 };
        } else if (ch === "P") {
          player.x = px + 6;
          player.y = py - 8;
        }
      }
    }
    return { name: L.name, width: cols * TILE, height: rows * TILE, solids: solids, hazards: hazards, mobs: mobs, jar: jar, tube: tube, player: player, carrying: false, won: false, dead: false };
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

  function dropJar(force) {
    if (!world.carrying || !world.jar) return;
    var p = world.player;
    world.carrying = false;
    world.jar.held = false;
    world.jar.x = p.x + p.w / 2;
    world.jar.y = p.y + 10;
    world.jar.vx = p.facing * (force ? 120 : 40);
    world.jar.vy = force ? -200 : -80;
    syncHud();
  }

  function hurtPlayer() {
    var p = world.player;
    if (p.hurtT > 0 || world.won) return;
    p.hurtT = 1;
    state.hp--;
    if (world.carrying) dropJar(true);
    syncHud();
    if (state.hp <= 0) {
      world.dead = true;
      toast("Проиграл · Рестарт", 3);
      return;
    }
    p.vy = -360;
    p.vx = -p.facing * 160;
  }

  function tryInteract() {
    if (!world || world.dead || world.won) return;
    var p = world.player;
    var jar = world.jar;
    var tube = world.tube;
    if (world.carrying && tube && Math.hypot(p.x + p.w / 2 - tube.x, p.y + p.h / 2 - (tube.y + 20)) < 55) {
      world.carrying = false;
      jar.held = false;
      world.won = true;
      toast("Колба в трубе! ✓", 1.4);
      setTimeout(function () {
        if (state.level >= LEVELS.length - 1) toast("Лаба спасена! Рестарт — сначала", 4);
        else {
          state.level++;
          startLevel(state.level);
        }
      }, 700);
      return;
    }
    if (!world.carrying && jar && !jar.held && Math.hypot(p.x + p.w / 2 - jar.x, p.y + p.h / 2 - jar.y) < 50) {
      world.carrying = true;
      jar.held = true;
      toast("Неси к трубе!", 1.4);
      syncHud();
    }
  }

  function doRestart() {
    state.hp = 3;
    if (world && world.won && state.level >= LEVELS.length - 1) state.level = 0;
    startLevel(state.level);
  }

  function startLevel(i) {
    state.level = i;
    world = buildLevel(i);
    camX = 0;
    syncHud();
    toast(LEVELS[i].name, 1.6);
    save();
  }

  function updateMob(mob, dt) {
    mob.anim += dt;
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
    var p = world.player;
    var jar = world.jar;
    animT += dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (interactQueued) {
      interactQueued = false;
      tryInteract();
    }

    var ix = 0;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1;
    if (Math.abs(stickX) > 0.2) ix = stickX > 0 ? 1 : -1;
    p.vx = ix * (world.carrying ? SPEED_CARRY : SPEED);
    if (ix) p.facing = ix;

    if (p.onGround) p.jumpsLeft = 2;
    if ((jumpQueued || keys.Space || keys.KeyW || keys.ArrowUp) && p.jumpsLeft > 0) {
      if (p.onGround || p.jumpsLeft === 1) {
        p.vy = p.onGround ? -JUMP : -JUMP2;
        p.onGround = false;
        p.jumpsLeft--;
        keys.Space = keys.KeyW = keys.ArrowUp = false;
      }
    }
    jumpQueued = false;

    p.vy += GRAV * dt;
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

    if (jar && !jar.held) {
      jar.vy += GRAV * dt;
      jar.x += jar.vx * dt;
      jar.y += jar.vy * dt;
      jar.vx *= 0.98;
      var jBox = { x: jar.x - 14, y: jar.y - 30, w: 28, h: 44, vx: 0, vy: jar.vy };
      for (var s = 0; s < world.solids.length; s++) {
        if (!aabb(jBox, world.solids[s])) continue;
        if (jar.vy > 0) {
          jar.y = world.solids[s].y - 14;
          jar.vy = 0;
        }
      }
    }
    if (world.carrying && jar) {
      jar.x = p.x + p.w / 2;
      jar.y = p.y - 8 + Math.sin(animT * 5) * 2;
    }

    for (var h = 0; h < world.hazards.length; h++) if (aabb(p, world.hazards[h])) hurtPlayer();
    for (var m = 0; m < world.mobs.length; m++) {
      var mob = world.mobs[m];
      if (mob.dead) continue;
      updateMob(mob, dt);
      if (aabb(p, mob)) {
        if (p.vy > 80 && p.y + p.h < mob.y + mob.h * 0.55) {
          mob.dead = true;
          p.vy = -400;
        } else hurtPlayer();
      }
    }

    var target = p.x - canvas.width * 0.38;
    camX += (target - camX) * Math.min(1, dt * 6);
    if (camX < 0) camX = 0;
    if (camX > world.width - canvas.width) camX = Math.max(0, world.width - canvas.width);
    syncHud();
  }

  function drawFace() {
    fctx.clearRect(0, 0, face.width, face.height);
    fctx.fillStyle = "#1e1b4b";
    fctx.fillRect(0, 0, face.width, face.height);
    drawBrainJar(fctx, face.width / 2, face.height / 2 + 10, 1.4, animT, true);
    fctx.fillStyle = "#f5d0fe";
    fctx.font = "800 12px system-ui";
    fctx.textAlign = "center";
    fctx.fillText(world && world.carrying ? "несусь с тобой!" : "спрашивай меня", face.width / 2, 16);
  }

  function draw() {
    ctx.fillStyle = "#1a1030";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgHills) {
      ctx.globalAlpha = 0.3;
      var sx = (-camX * 0.12) % bgHills.width;
      for (var i = -1; i < 3; i++) ctx.drawImage(bgHills, sx + i * bgHills.width, canvas.height - bgHills.height * 0.8, bgHills.width, bgHills.height * 0.8);
      ctx.globalAlpha = 1;
    }
    if (!world) return;
    ctx.save();
    ctx.translate(-Math.floor(camX), 0);
    for (var i = 0; i < world.solids.length; i++) {
      var s = world.solids[i];
      if (!tiles.draw(ctx, s.sprite, s.x, s.platform ? s.drawY : s.y, TILE, TILE, false)) {
        ctx.fillStyle = "#6b21a8";
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
    }
    for (var h = 0; h < world.hazards.length; h++) {
      var hz = world.hazards[h];
      tiles.draw(ctx, hz.sprite, hz.x - 6, hz.y - 20, TILE, TILE, false);
    }
    for (var m = 0; m < world.mobs.length; m++) {
      var mob = world.mobs[m];
      if (mob.dead) continue;
      if (mob.kind === "slime") enemies.draw(ctx, Math.floor(mob.anim * 8) % 2 ? "slime_normal_walk_b" : "slime_normal_walk_a", mob.x, mob.y, mob.w, mob.h, mob.vx > 0);
      else enemies.draw(ctx, Math.floor(mob.anim * 10) % 2 ? "bee_b" : "bee_a", mob.x, mob.y, mob.w, mob.h, false);
    }
    if (world.tube) drawDeliveryTube(ctx, world.tube.x, world.tube.y, animT, world.carrying);
    var p = world.player;
    var hf = p.hurtT > 0 && Math.floor(animT * 20) % 2 === 0 ? "character_purple_hit" : !p.onGround ? "character_purple_jump" : Math.abs(p.vx) > 20 ? "character_purple" + (Math.floor(animT * 10) % 2 ? "_walk_b" : "_walk_a") : "character_purple_idle";
    chars.draw(ctx, hf, p.x - 10, p.y - 4, 56, 56, p.facing < 0);
    if (world.jar) drawBrainJar(ctx, world.jar.x, world.jar.y, 1, animT, world.carrying);
    ctx.restore();
    drawFace();
  }

  function pick(a) {
    return a[Math.floor(Math.random() * a.length)];
  }
  function ishkaReply(raw) {
    var n = (raw || "").toLowerCase();
    if (/привет|здрав/.test(n)) return pick(["Привет! Я Ишка — мозг в колбе. Спроси про дом или уровень.", "Йо! Неси меня к трубе и болтай."]);
    if (/дом|дома|квартир|мама/.test(n)) return pick(["Дома сначала уроки/покой — потом лаба. Я подожду в колбе.", "Дома можно отдохнуть. Прогресс уровней сохраняется."]);
    if (/как пройти|помощь|подсказ/.test(n)) return "E — взять колбу, донести до трубы, снова E. Двойной прыжок · не роняй меня на врагах.";
    if (/кто ты|ишка/.test(n)) return "Я Ишка, учёный мозг в колбе. Помощница, не босс уровня.";
    if (/следит|следить|экран/.test(n)) return "Маленький экранчик сверху — это я. Открывай «Ишка» и спрашивай.";
    return pick(["Спроси «дома», «как пройти» или «кто ты».", "Я отвечаю по-разному — попробуй ещё раз той же темой."]);
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
    if (e.code === "KeyE") tryInteract();
    if (e.code === "KeyR") doRestart();
    if (e.code === "Space" || e.code === "ArrowUp") e.preventDefault();
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

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
  });
  document.getElementById("btn-e").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    interactQueued = true;
  });

  // mic
  document.getElementById("ai-mic").onclick = function () {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      askIshka("микрофон недоступен");
      return;
    }
    var r = new SR();
    r.lang = "ru-RU";
    r.onresult = function (ev) {
      askIshka(ev.results[0][0].transcript);
    };
    r.start();
  };

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
    startLevel(state.level);
    aiLog("bot", "Я Ишка. Слаймы ходят по полу. Спроси «дома» или «как пройти».");
    requestAnimationFrame(frame);
  });
})();
