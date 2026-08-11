(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("title");
  const blurbEl = document.getElementById("blurb");
  const startBtn = document.getElementById("start-btn");
  const hud = document.getElementById("hud");
  const orbLabel = document.getElementById("orb-label");
  const integrityEl = document.getElementById("integrity");
  const strangeEl = document.getElementById("strange");
  const hintEl = document.getElementById("hint");
  const touch = document.getElementById("touch");

  const W = canvas.width;
  const H = canvas.height;
  const TILE = 40;
  const GRAVITY = 0.55;
  const MOVE = 0.55;
  const MAX_SPEED = 4.2;
  const MAX_FALL = 14;
  const JUMP = -10.2;
  const GROUND_Y = 420;
  const WORLD_W = 3200;

  const RESIDENTS = [
    { id: "lina", name: "Лина", door: "№12", color: "#7ec8ff", line: "Я ждала этот двор…" },
    { id: "marco", name: "Марко", door: "№7", color: "#f0b429", line: "Поезд ещё стоит?" },
    { id: "vera", name: "Вера", door: "№3", color: "#c4a1ff", line: "Торт был с вишней." },
    { id: "oto", name: "Ото", door: "№19", color: "#6ee7b7", line: "Ключ всегда грел карман." },
    { id: "ash", name: "Эш", door: "№1", color: "#ff6b8a", line: "Я не просил чужих снов." },
  ];

  const MEMORIES = [
    {
      id: "yard",
      title: "Детский двор",
      correct: "lina",
      hue: "#7ec8ff",
      whisper: "Смех, мел на асфальте, качели скрипят.",
    },
    {
      id: "station",
      title: "Пустой вокзал",
      correct: "marco",
      hue: "#f0b429",
      whisper: "Табло мигает. Никто не садится.",
    },
    {
      id: "cake",
      title: "Чужой день рождения",
      correct: "vera",
      hue: "#c4a1ff",
      whisper: "Свечи, но имена на торте стёрты.",
    },
  ];

  /** @type {'menu'|'play'|'end'} */
  let mode = "menu";
  let time = 0;
  let strange = 0;
  let camX = 0;
  let message = "";
  let messageT = 0;
  let delivered = [];
  let remaining = [];
  let worldSeed = 1;

  const keys = Object.create(null);
  const touchHeld = Object.create(null);

  const player = {
    x: 80,
    y: 200,
    w: 22,
    h: 34,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    carrying: null,
    landHard: false,
  };

  /** @type {{x:number,y:number,w:number,h:number,kind?:string}[]} */
  let solids = [];
  /** @type {{x:number,y:number,w:number,h:number,resident:typeof RESIDENTS[0],glow:number}[]} */
  let doors = [];
  /** @type {{x:number,y:number,r:number,mem:typeof MEMORIES[0],taken:boolean}[]} */
  let orbs = [];
  /** @type {{x:number,y:number,w:number,h:number}[]} */
  let hazards = [];

  function rand(n) {
    worldSeed = (worldSeed * 1664525 + 1013904223) >>> 0;
    return (worldSeed % 10000) / 10000 * n;
  }

  function showMsg(text, sec = 2.4) {
    message = text;
    messageT = sec;
  }

  function buildLevel() {
    solids = [];
    doors = [];
    orbs = [];
    hazards = [];
    worldSeed = 42;

    solids.push({ x: 0, y: GROUND_Y, w: WORLD_W, h: 240 });
    solids.push({ x: -40, y: -200, w: 40, h: H + 400 });
    solids.push({ x: WORLD_W, y: -200, w: 40, h: H + 400 });

    // Depot platform
    solids.push({ x: 40, y: 300, w: 180, h: 24 });
    solids.push({ x: 260, y: 340, w: 120, h: 20 });

    // Stepping platforms (placed so roofs stay walkable)
    const plats = [
      [400, 360, 90],
      [700, 300, 100],
      [880, 340, 80],
      [1120, 280, 110],
      [1320, 360, 60],
      [1580, 300, 120],
      [1780, 250, 100],
      [2100, 340, 100],
      [2220, 290, 140],
      [2680, 360, 120],
      [2860, 310, 140],
    ];
    for (const [x, y, w] of plats) {
      solids.push({ x, y, w, h: 18 });
    }

    // Soft hazards (memory static)
    hazards.push({ x: 640, y: GROUND_Y - 18, w: 50, h: 18 });
    hazards.push({ x: 1480, y: GROUND_Y - 18, w: 70, h: 18 });
    hazards.push({ x: 2050, y: GROUND_Y - 18, w: 55, h: 18 });
    hazards.push({ x: 2580, y: GROUND_Y - 18, w: 60, h: 18 });

    // Houses: visual body + solid roof (so you don't fall through)
    const houseXs = [520, 980, 1400, 1900, 2500];
    houseXs.forEach((hx, i) => {
      const res = RESIDENTS[i];
      const houseW = 120;
      const roofY = GROUND_Y - 140;
      solids.push({ x: hx, y: roofY, w: houseW, h: 140, kind: "house", oneWay: false });
      // Extra roof cap — reliable landing surface
      solids.push({ x: hx - 6, y: roofY - 10, w: houseW + 12, h: 14, kind: "roof" });
      doors.push({
        x: hx + 38,
        y: GROUND_Y - 70,
        w: 44,
        h: 70,
        resident: res,
        glow: 0,
      });
    });

    // Memory orbs at depot
    remaining = MEMORIES.map((m) => m.id);
    MEMORIES.forEach((mem, i) => {
      orbs.push({
        x: 70 + i * 55,
        y: 260,
        r: 14,
        mem,
        taken: false,
      });
    });

    player.x = 100;
    player.y = 250;
    player.vx = 0;
    player.vy = 0;
    player.carrying = null;
    delivered = [];
    strange = 0;
    camX = 0;
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function overlaps(a, s) {
    return a.x < s.x + s.w && a.x + a.w > s.x && a.y < s.y + s.h && a.y + a.h > s.y;
  }

  /** Horizontal resolve — after X move only */
  function resolveX(p, s) {
    if (s.kind === "roof") return; // thin roof: vertical only
    if (!overlaps(p, s)) return;
    if (p.x + p.w / 2 < s.x + s.w / 2) p.x = s.x - p.w;
    else p.x = s.x + s.w;
    p.vx = 0;
  }

  /** Vertical resolve — after Y move only (fixes falling through roofs/houses) */
  function resolveY(p, s, prevBottom) {
    if (!overlaps(p, s)) return;
    if (p.vy >= 0) {
      // Land on top if we came from above (or already slightly inside top)
      if (prevBottom <= s.y + 12 || p.y + p.h - s.y <= Math.min(24, s.h)) {
        p.y = s.y - p.h;
        if (p.vy > 8.5) p.landHard = true;
        p.vy = 0;
        p.onGround = true;
      }
    } else if (s.kind !== "roof") {
      p.y = s.y + s.h;
      p.vy = 0;
    }
  }

  function nearestDoor() {
    let best = null;
    let bestD = 56;
    for (const d of doors) {
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      const dist = Math.hypot(cx - px, cy - py);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    return best;
  }

  function nearestOrb() {
    let best = null;
    let bestD = 42;
    for (const o of orbs) {
      if (o.taken) continue;
      const dist = Math.hypot(o.x - (player.x + player.w / 2), o.y - (player.y + player.h / 2));
      if (dist < bestD) {
        bestD = dist;
        best = o;
      }
    }
    return best;
  }

  function tryUse() {
    if (mode !== "play") return;

    if (!player.carrying) {
      const o = nearestOrb();
      if (!o) {
        showMsg("Сначала возьми шар у склада воспоминаний.");
        return;
      }
      o.taken = true;
      player.carrying = {
        ...o.mem,
        integrity: 100,
      };
      remaining = remaining.filter((id) => id !== o.mem.id);
      showMsg(`В руках: «${o.mem.title}». ${o.mem.whisper}`);
      return;
    }

    const door = nearestDoor();
    if (!door) {
      showMsg("Подойди к двери, чтобы отдать воспоминание.");
      return;
    }

    const mem = player.carrying;
    const correct = mem.correct === door.resident.id;
    const cracked = mem.integrity < 45;

    delivered.push({
      memId: mem.id,
      to: door.resident.id,
      correct,
      cracked,
    });

    if (correct && !cracked) {
      strange = Math.max(0, strange - 8);
      showMsg(`${door.resident.name}: «${door.resident.line}» Город чуть яснее.`);
    } else if (correct && cracked) {
      strange += 10;
      showMsg(`${door.resident.name} узнаёт момент… но он трещит. Странность растёт.`);
    } else {
      strange = Math.min(100, strange + 28);
      showMsg(
        `${door.resident.name} впитывает чужое. Вывески плывут. Странность ${Math.round(strange)}%.`
      );
    }

    player.carrying = null;

    if (delivered.length >= MEMORIES.length) {
      endShift();
    }
  }

  function endShift() {
    mode = "end";
    hud.classList.add("hidden");
    touch.classList.add("hidden");
    overlay.classList.remove("hidden");

    const ok = delivered.filter((d) => d.correct && !d.cracked).length;
    const mix = delivered.filter((d) => !d.correct).length;
    titleEl.textContent = ok === 3 ? "Район собран" : mix ? "Город помнит чужое" : "Смена окончена";

    const lines = [
      `Верных целых доставок: ${ok} из ${MEMORIES.length}.`,
      `Чужих адресов: ${mix}.`,
      `Странность района: ${Math.round(strange)}%.`,
    ];
    if (ok === 3) {
      lines.push("Тихий переулок снова знает, кому какие дни принадлежат.");
    } else if (strange >= 50) {
      lines.push("Сосед напевает твою колыбельную. Дождь идёт чуть вверх.");
    } else {
      lines.push("Часть памяти на месте. Часть гуляет по чужим окнам.");
    }
    blurbEl.textContent = lines.join(" ");
    startBtn.textContent = "Ещё одна смена";
  }

  function startGame() {
    buildLevel();
    mode = "play";
    overlay.classList.add("hidden");
    hud.classList.remove("hidden");
    if (matchMedia("(pointer: coarse)").matches) touch.classList.remove("hidden");
    showMsg("Склад слева. Три шара. Пять дверей. Не разбей память.");
  }

  function update(dt) {
    time += dt;
    if (messageT > 0) messageT -= dt;

    if (mode !== "play") return;

    const left = keys.ArrowLeft || keys.a || keys.A || touchHeld.left;
    const right = keys.ArrowRight || keys.d || keys.D || touchHeld.right;
    const jump = keys[" "] || keys.Space || keys.ArrowUp || keys.w || keys.W || touchHeld.jump;

    if (left) {
      player.vx -= MOVE * 60 * dt;
      player.facing = -1;
    }
    if (right) {
      player.vx += MOVE * 60 * dt;
      player.facing = 1;
    }
    if (!left && !right) player.vx *= Math.pow(0.78, dt * 60);
    player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));

    if (jump && player.onGround) {
      player.vy = JUMP;
      player.onGround = false;
    }

    player.vy += GRAVITY * 60 * dt;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;
    player.landHard = false;

    // Separate-axis collision (prevents tunneling through houses/roofs)
    player.x += player.vx;
    for (const s of solids) resolveX(player, s);

    const prevBottom = player.y + player.h;
    player.y += player.vy;
    player.onGround = false;
    for (const s of solids) resolveY(player, s, prevBottom);

    // Safety: never sink under the street
    if (player.y + player.h > GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    if (player.y > H + 120 || player.x < -80 || player.x > WORLD_W + 80) {
      player.x = 100;
      player.y = 250;
      player.vx = 0;
      player.vy = 0;
      if (player.carrying) {
        player.carrying.integrity = Math.max(0, player.carrying.integrity - 25);
        showMsg("Падение! Воспоминание треснуло.");
      }
    }

    for (const h of hazards) {
      if (aabb(player, h)) {
        player.vx *= 0.4;
        if (player.carrying) {
          player.carrying.integrity = Math.max(0, player.carrying.integrity - 18 * dt);
        }
      }
    }

    if (player.landHard && player.carrying) {
      player.carrying.integrity = Math.max(0, player.carrying.integrity - 12);
      showMsg("Жёсткое приземление. Шар звенит трещиной.");
    }

    camX += (player.x - W * 0.35 - camX) * Math.min(1, 6 * dt);
    camX = Math.max(0, Math.min(WORLD_W - W, camX));

    // HUD
    if (player.carrying) {
      orbLabel.textContent = `Воспоминание: ${player.carrying.title}`;
      integrityEl.textContent = `Целость: ${Math.round(player.carrying.integrity)}%`;
      integrityEl.style.color = player.carrying.integrity < 45 ? "#ff6b8a" : "#e8e2d6";
    } else {
      orbLabel.textContent = "Воспоминание: нет";
      integrityEl.textContent = "Целость: —";
      integrityEl.style.color = "";
    }
    strangeEl.textContent = `Странность: ${Math.round(strange)}%`;
    strangeEl.style.color = strange >= 50 ? "#ff6b8a" : strange >= 20 ? "#f0b429" : "#e8e2d6";

    const door = nearestDoor();
    const orb = nearestOrb();
    if (player.carrying && door) {
      hintEl.textContent = `E — отдать «${player.carrying.title}» → ${door.resident.name} (${door.resident.door})`;
    } else if (!player.carrying && orb) {
      hintEl.textContent = `E — взять «${orb.mem.title}»`;
    } else {
      hintEl.textContent = "A/D — ходьба · Пробел — прыжок · E — взять / отдать";
    }
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const shift = strange / 100;
    g.addColorStop(0, mix("#152238", "#2a1830", shift));
    g.addColorStop(0.55, mix("#0c1428", "#1a1020", shift));
    g.addColorStop(1, "#070a12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Stars / glitch dots
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const x = ((i * 97 + time * (8 + shift * 40)) % (W + 40)) - 20;
      const y = (i * 53) % (H * 0.55);
      ctx.globalAlpha = 0.25 + (i % 5) * 0.1;
      ctx.fillStyle = strange > 35 && i % 7 === 0 ? "#ff6b8a" : "#cfe7ff";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();

    // Moon
    ctx.beginPath();
    ctx.fillStyle = mix("#d9e7ff", "#ffd0dd", shift);
    ctx.arc(W * 0.78, 70, 28, 0, Math.PI * 2);
    ctx.fill();
    if (strange > 45) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,107,138,0.35)";
      ctx.arc(W * 0.78 + 18, 78, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function mix(a, b, t) {
    const pa = hex(a);
    const pb = hex(b);
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function hex(h) {
    const n = h.replace("#", "");
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-Math.round(camX), 0);

    // Far silhouettes
    ctx.fillStyle = `rgba(20,30,50,${0.55 + strange * 0.002})`;
    for (let i = 0; i < 12; i++) {
      const bx = i * 280 + 40;
      const bh = 80 + ((i * 37) % 90);
      ctx.fillRect(bx, 420 - bh, 90, bh);
    }

    // Hazards
    for (const h of hazards) {
      ctx.fillStyle = "rgba(255, 107, 138, 0.55)";
      for (let x = h.x; x < h.x + h.w; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, h.y + h.h);
        ctx.lineTo(x + 4, h.y);
        ctx.lineTo(x + 8, h.y + h.h);
        ctx.fill();
      }
    }

    // Ground & platforms
    for (const s of solids) {
      if (s.kind === "house") {
        drawHouse(s);
        continue;
      }
      if (s.kind === "roof") continue;
      ctx.fillStyle = s.y >= GROUND_Y ? "#1c2740" : "#2a3a58";
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = s.y >= GROUND_Y ? "#243352" : "#3d5278";
      ctx.fillRect(s.x, s.y, s.w, 4);
    }

    // Doors
    for (const d of doors) {
      const near = nearestDoor() === d;
      ctx.fillStyle = near ? d.resident.color : "#121826";
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = "#0a0e18";
      ctx.fillRect(d.x + 8, d.y + 12, d.w - 16, d.h - 24);
      ctx.fillStyle = "#e8e2d6";
      ctx.font = "700 11px Manrope, sans-serif";
      ctx.fillText(d.resident.door, d.x + 8, d.y - 8);
      if (near) {
        ctx.fillStyle = "rgba(232,226,214,0.9)";
        ctx.font = "700 12px Manrope, sans-serif";
        ctx.fillText(d.resident.name, d.x - 4, d.y - 22);
      }

      // Wrong-memory ghost faces when strange
      if (strange > 30) {
        ctx.globalAlpha = Math.min(0.55, (strange - 30) / 80);
        ctx.fillStyle = "#ff6b8a";
        ctx.beginPath();
        ctx.arc(d.x + d.w / 2, d.y + 22, 6 + Math.sin(time * 4 + d.x) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Orbs
    for (const o of orbs) {
      if (o.taken) continue;
      const bob = Math.sin(time * 3 + o.x) * 4;
      const grd = ctx.createRadialGradient(o.x, o.y + bob, 2, o.x, o.y + bob, o.r + 8);
      grd.addColorStop(0, "#fff");
      grd.addColorStop(0.35, o.mem.hue);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(o.x, o.y + bob, o.r + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = o.mem.hue;
      ctx.arc(o.x, o.y + bob, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Depot sign
    ctx.fillStyle = "#9aa3b2";
    ctx.font = "700 13px Manrope, sans-serif";
    ctx.fillText("Склад воспоминаний", 55, 290);

    drawPlayer();

    // Rain up when strange
    if (strange > 40) {
      ctx.strokeStyle = "rgba(126,200,255,0.25)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const x = ((i * 73 + camX) % 3200);
        const y = H - ((time * 120 + i * 40) % (H + 40));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y - 10);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Chromatic / glitch overlay
    if (strange > 20) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.18, strange / 400);
      ctx.fillStyle = "#ff6b8a";
      ctx.fillRect(4 * Math.sin(time * 20), 0, W, H);
      ctx.fillStyle = "#7ec8ff";
      ctx.fillRect(-4 * Math.sin(time * 17), 0, W, H);
      ctx.restore();
    }

    if (messageT > 0 && message) {
      ctx.fillStyle = "rgba(8,12,22,0.72)";
      const pad = 14;
      ctx.font = "600 15px Manrope, sans-serif";
      const tw = Math.min(W - 40, ctx.measureText(message).width + pad * 2);
      ctx.fillRect((W - tw) / 2, 64, tw, 36);
      ctx.fillStyle = "#e8e2d6";
      ctx.textAlign = "center";
      ctx.fillText(message, W / 2, 88, W - 60);
      ctx.textAlign = "left";
    }
  }

  function drawHouse(s) {
    ctx.fillStyle = mix("#1a2238", "#2a1828", strange / 120);
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = "#0e1424";
    ctx.fillRect(s.x + 10, s.y + 18, 28, 24);
    ctx.fillRect(s.x + s.w - 38, s.y + 18, 28, 24);
    // Roof
    ctx.fillStyle = mix("#2c3b5c", "#4a2038", strange / 100);
    ctx.beginPath();
    ctx.moveTo(s.x - 8, s.y);
    ctx.lineTo(s.x + s.w / 2, s.y - 36);
    ctx.lineTo(s.x + s.w + 8, s.y);
    ctx.closePath();
    ctx.fill();

    if (strange > 55) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.font = "700 10px Manrope, sans-serif";
      const gibber = strange > 70 ? "Я / ТЫ / МЫ" : "···";
      ctx.fillText(gibber, s.x + 18, s.y + 70);
    }
  }

  function drawPlayer() {
    const px = player.x;
    const py = player.y;
    // Body
    ctx.fillStyle = "#dfe7f5";
    ctx.fillRect(px + 4, py + 8, player.w - 8, player.h - 12);
    // Head
    ctx.fillStyle = "#f2efe6";
    ctx.fillRect(px + 5, py, 12, 12);
    // Bag / postman strap
    ctx.strokeStyle = "#f0b429";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 10);
    ctx.lineTo(px + player.w - 4, py + 22);
    ctx.stroke();
    // Legs
    ctx.fillStyle = "#9aa3b2";
    const step = player.onGround ? Math.sin(time * 12) * 3 * Math.min(1, Math.abs(player.vx)) : 0;
    ctx.fillRect(px + 5, py + player.h - 10, 6, 10 + step);
    ctx.fillRect(px + 12, py + player.h - 10, 6, 10 - step);

    if (player.carrying) {
      const ox = px + player.w / 2 + player.facing * 10;
      const oy = py + 6;
      const crack = player.carrying.integrity < 45;
      ctx.beginPath();
      ctx.fillStyle = player.carrying.hue;
      ctx.globalAlpha = 0.9;
      ctx.arc(ox, oy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = crack ? "#ff6b8a" : "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      if (crack) {
        ctx.beginPath();
        ctx.moveTo(ox - 3, oy - 4);
        ctx.lineTo(ox + 2, oy + 1);
        ctx.lineTo(ox - 1, oy + 5);
        ctx.stroke();
      }
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    drawSky();
    if (mode === "play" || mode === "end") drawWorld();
    else {
      // idle preview sky only + silhouette
      drawSky();
      ctx.fillStyle = "rgba(232,226,214,0.08)";
      ctx.font = "700 28px Literata, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("Тихий переулок ждёт смены", W / 2, H * 0.72);
      ctx.textAlign = "left";
    }
    requestAnimationFrame(frame);
  }

  startBtn.addEventListener("click", () => startGame());

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "e" || e.key === "E" || e.key === "у" || e.key === "У") {
      e.preventDefault();
      tryUse();
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  touch.querySelectorAll("button").forEach((btn) => {
    const act = btn.getAttribute("data-act");
    const on = (ev) => {
      ev.preventDefault();
      if (act === "use") tryUse();
      else touchHeld[act] = true;
    };
    const off = (ev) => {
      ev.preventDefault();
      if (act !== "use") touchHeld[act] = false;
    };
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointerleave", off);
    btn.addEventListener("pointercancel", off);
  });

  requestAnimationFrame(frame);
})();
