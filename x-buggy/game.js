(() => {
  const W = 960;
  const H = 640;
  const STORAGE = "x-buggy-v1";
  const ROAD_W = 2100;
  const SEG_LEN = 200;
  const DRAW_DIST = 160;
  const CAM_H = 1000;
  const CAM_DEPTH = 0.84;

  function amalGod() {
    try {
      if (window.__AMAL_GOD__ || window.__AMAL_OWNER__) return true;
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      if (new URLSearchParams(location.search).get("owner")) return true;
      if (window.AmalPowers && AmalPowers.god && AmalPowers.god()) return true;
      if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
      if (window.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner()) return true;
    } catch (_) {}
    return false;
  }

  const store = {
    get(k, f) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? f : JSON.parse(v);
      } catch {
        return f;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
  };

  const FLAG_COLORS = [
    { id: "R", fill: "#e74c3c", name: "красный" },
    { id: "Y", fill: "#f1c40f", name: "жёлтый" },
    { id: "B", fill: "#3498db", name: "синий" },
    { id: "G", fill: "#2ecc71", name: "зелёный" },
  ];

  const COURSES = [
    {
      id: "offroad",
      name: "Offroad",
      sub: "кольцо · 3 круга",
      theme: "desert",
      legs: 3,
      time: 55,
      length: 320,
      curveAmp: 1.1,
      hillAmp: 0.9,
      dens: 1,
    },
    {
      id: "safari",
      name: "Safari",
      sub: "саванна · 4 этапа",
      theme: "savanna",
      legs: 4,
      time: 48,
      length: 280,
      curveAmp: 1.4,
      hillAmp: 0.7,
      dens: 1.15,
    },
    {
      id: "dakar",
      name: "Dakar",
      sub: "пустыня · 5 этапов",
      theme: "dunes",
      legs: 5,
      time: 42,
      length: 260,
      curveAmp: 1.6,
      hillAmp: 1.3,
      dens: 1.3,
    },
    {
      id: "canyon",
      name: "Canyon",
      sub: "ущелье · 4 этапа",
      theme: "canyon",
      legs: 4,
      time: 45,
      length: 300,
      curveAmp: 1.8,
      hillAmp: 1.1,
      dens: 1.25,
    },
  ];

  const THEMES = {
    desert: {
      sky0: "#5ec8e8",
      sky1: "#f5c16c",
      ground: "#c4a574",
      groundDark: "#a88858",
      road: "#5a5048",
      roadLine: "#e8dcc8",
      rumble: "#c44a2a",
      rumbleAlt: "#f0e6d0",
      fog: "rgba(245,193,108,0.35)",
    },
    savanna: {
      sky0: "#87ceeb",
      sky1: "#e8b84a",
      ground: "#b8a050",
      groundDark: "#8a7838",
      road: "#4a4438",
      roadLine: "#d8c898",
      rumble: "#d06020",
      rumbleAlt: "#e8d8a0",
      fog: "rgba(232,184,74,0.3)",
    },
    dunes: {
      sky0: "#6a9ec8",
      sky1: "#e8a040",
      ground: "#d4a860",
      groundDark: "#b08040",
      road: "#6a5848",
      roadLine: "#f0e0c0",
      rumble: "#c03818",
      rumbleAlt: "#f8e8c8",
      fog: "rgba(232,160,64,0.4)",
    },
    canyon: {
      sky0: "#4a90b8",
      sky1: "#e87840",
      ground: "#a86040",
      groundDark: "#784028",
      road: "#483830",
      roadLine: "#d8c0a0",
      rumble: "#e05030",
      rumbleAlt: "#e8c8a0",
      fog: "rgba(232,120,64,0.35)",
    },
  };

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function buildTrack(course) {
    const rng = mulberry32(hashStr(course.id + "-xbuggy"));
    const n = course.length;
    const segs = [];
    let curve = 0;
    let y = 0;
    const dens = course.dens;

    for (let i = 0; i < n; i++) {
      const t = i / n;
      if (i % 28 === 0) curve = (rng() - 0.5) * 4.2 * course.curveAmp;
      if (i % 22 === 0) {
        const target = (rng() - 0.5) * 1400 * course.hillAmp;
        y += (target - y) * 0.35;
      }

      const seg = {
        index: i,
        p1: { world: { z: i * SEG_LEN, y }, screen: {}, scale: 0, clip: 0 },
        p2: { world: { z: (i + 1) * SEG_LEN, y: 0 }, screen: {}, scale: 0, clip: 0 },
        curve,
        color: i % 2 ? 1 : 0,
        sprites: [],
        objects: [],
      };
      segs.push(seg);
    }

    for (let i = 0; i < n - 1; i++) {
      segs[i].p2.world.y = segs[i + 1].p1.world.y;
    }
    segs[n - 1].p2.world.y = segs[0].p1.world.y;

    const place = (i, type, offset, extra = {}) => {
      if (i < 4 || i > n - 4) return;
      segs[i].objects.push({ type, offset, hit: false, ...extra });
    };

    // Intro props so the first stretch isn't empty
    place(6, "flag", -0.25, { color: "R" });
    place(9, "log", 0.1);
    place(11, "flag", 0.3, { color: "Y" });
    place(14, "stump", -0.3);
    place(16, "time", 0.2, { bonus: 2 });
    place(18, "gate", 0, { points: 500 });
    place(20, "rock", 0.35);

    const flagSeq = [];
    for (let k = 0; k < 12; k++) flagSeq.push(FLAG_COLORS[k % FLAG_COLORS.length].id);

    let fi = 0;
    for (let i = 12; i < n - 10; i += Math.floor(14 / dens)) {
      const roll = rng();
      if (roll < 0.28) {
        place(i, "rock", (rng() - 0.5) * 0.72);
      } else if (roll < 0.42) {
        place(i, "wall", (rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.25), { w: 0.35 });
      } else if (roll < 0.55) {
        place(i, "log", (rng() - 0.5) * 0.35);
      } else if (roll < 0.68) {
        place(i, "stump", (rng() < 0.5 ? -0.28 : 0.28) + (rng() - 0.5) * 0.08);
      } else if (roll < 0.82) {
        const cid = flagSeq[fi % flagSeq.length];
        place(i, "flag", (rng() - 0.5) * 0.55, { color: cid });
        fi++;
      } else if (roll < 0.92) {
        place(i, "gate", 0, { points: 500 });
      } else {
        place(i, "time", (rng() - 0.5) * 0.4, { bonus: 2 });
      }
    }

    // roadside palms / cacti
    for (let i = 0; i < n; i += 2) {
      if (rng() < 0.55) {
        const side = rng() < 0.5 ? -1 : 1;
        segs[i].sprites.push({
          type: rng() < 0.5 ? "cactus" : "rockside",
          offset: side * (1.15 + rng() * 1.4),
        });
      }
      if (rng() < 0.25) {
        segs[i].sprites.push({
          type: "bush",
          offset: (rng() < 0.5 ? -1 : 1) * (1.4 + rng()),
        });
      }
    }

    // checkpoint banners at leg ends
    const legLen = Math.floor(n / course.legs);
    for (let L = 1; L <= course.legs; L++) {
      const idx = Math.min(n - 3, L * legLen);
      place(idx, "checkpoint", 0, { leg: L });
    }

    return { segs, n, flagSeq, legLen };
  }

  const app = document.getElementById("app");
  const best = store.get(STORAGE + "-best", {});

  const state = {
    screen: "menu",
    courseIdx: 0,
    track: null,
    theme: null,
    course: null,
    pos: 0,
    playerX: 0,
    speed: 0,
    maxSpeed: 0,
    accel: 0,
    gear: 1, // 1 low, 2 high
    steer: 0,
    centrifugal: 0,
    airborne: 0,
    tilt: 0, // two-wheel
    tiltSide: 0,
    score: 0,
    timeLeft: 0,
    leg: 1,
    flagNext: 0,
    flagsGot: [],
    crashed: 0,
    finished: false,
    dead: false,
    msg: "",
    msgT: 0,
    particles: [],
    keys: Object.create(null),
    pad: { left: false, right: false, accel: false, brake: false, gear: false },
    gearQueued: false,
  };

  // ——— DOM ———
  const screen = document.createElement("div");
  screen.className = "screen";
  app.appendChild(screen);

  const canvas = document.createElement("canvas");
  canvas.id = "game";
  canvas.width = W;
  canvas.height = H;
  screen.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.hidden = true;
  hud.innerHTML = `
    <div class="hud-top">
      <div class="hud-pill time"><span class="label">Время</span><span class="value" id="h-time">0.0</span></div>
      <div class="hud-pill score"><span class="label">Очки</span><span class="value" id="h-score">0</span></div>
      <div class="hud-pill speed"><span class="label">Скорость</span><span class="value" id="h-speed">0</span></div>
    </div>
    <div class="hud-center">
      <div class="leg" id="h-leg">Этап 1</div>
      <div class="flags" id="h-flags"></div>
    </div>
    <div class="msg" id="h-msg"></div>
  `;
  screen.appendChild(hud);

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  screen.appendChild(overlay);

  const touch = document.createElement("div");
  touch.className = "touch";
  touch.innerHTML = `
    <button class="pad" data-k="left">◀</button>
    <div style="display:grid;grid-template-rows:1fr 1fr;gap:8px">
      <button class="pad" data-k="accel">▲ газ</button>
      <button class="pad" data-k="brake">▼ тормоз</button>
    </div>
    <button class="pad" data-k="right">▶</button>
  `;
  screen.appendChild(touch);

  const el = {
    time: hud.querySelector("#h-time"),
    score: hud.querySelector("#h-score"),
    speed: hud.querySelector("#h-speed"),
    leg: hud.querySelector("#h-leg"),
    flags: hud.querySelector("#h-flags"),
    msg: hud.querySelector("#h-msg"),
  };

  function showMsg(text, t = 1.2) {
    state.msg = text;
    state.msgT = t;
    el.msg.textContent = text;
    el.msg.classList.add("show");
  }

  function renderMenu() {
    state.screen = "menu";
    hud.hidden = true;
    touch.classList.remove("on");
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="brand">X-BUGGY</div>
      <p class="tagline">Оффроуд на багги: успей до чекпоинта, собирай флаги по порядку, прыгай через брёвна и заезжай на два колеса.</p>
      <div class="course-grid" id="courses"></div>
      <p class="hint-keys">
        <kbd>←</kbd><kbd>→</kbd> руль · <kbd>↑</kbd>/<kbd>W</kbd> газ · <kbd>↓</kbd>/<kbd>S</kbd> тормоз · <kbd>Пробел</kbd> передача
      </p>
    `;
    const grid = overlay.querySelector("#courses");
    COURSES.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "course-btn" + (best[c.id] ? " best" : "");
      b.innerHTML = `${c.name}<span class="sub">${best[c.id] ? "рекорд " + best[c.id] : c.sub}</span>`;
      b.addEventListener("click", () => startCourse(i));
      grid.appendChild(b);
    });
  }

  function renderResult(won) {
    state.screen = "result";
    hud.hidden = true;
    touch.classList.remove("on");
    overlay.classList.remove("hidden");
    const c = state.course;
    const prev = best[c.id] || 0;
    if (won && state.score > prev) {
      best[c.id] = state.score;
      store.set(STORAGE + "-best", best);
    }
    overlay.innerHTML = `
      <div class="brand">${won ? "ФИНИШ!" : "ВРЕМЯ ВЫШЛО"}</div>
      <p class="tagline">${c.name} · ${state.score} очков${won && state.score > prev ? " · новый рекорд!" : ""}</p>
      <button class="btn" id="again">Ещё раз</button>
      <button class="btn ghost" id="tomenu">К трассам</button>
    `;
    overlay.querySelector("#again").onclick = () => startCourse(state.courseIdx);
    overlay.querySelector("#tomenu").onclick = () => renderMenu();
  }

  function startCourse(idx) {
    const course = COURSES[idx];
    state.courseIdx = idx;
    state.course = course;
    state.theme = THEMES[course.theme];
    state.track = buildTrack(course);
    state.pos = 0;
    state.playerX = 0;
    state.speed = 0;
    state.maxSpeed = course.id === "dakar" ? 6200 : 5800;
    state.accel = 0;
    state.gear = 1;
    state.steer = 0;
    state.airborne = 0;
    state.tilt = 0;
    state.tiltSide = 0;
    state.score = 0;
    state.timeLeft = course.time;
    state.leg = 1;
    state.flagNext = 0;
    state.flagsGot = [];
    state.crashed = 0;
    state.finished = false;
    state.dead = false;
    state.particles = [];
    state.screen = "play";
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
    hud.hidden = false;
    touch.classList.add("on");
    updateFlagHud();
    showMsg(course.name.toUpperCase(), 1.5);
    if (amalGod()) setTimeout(() => showMsg("⚡ БЕССМЕРТИЕ ХОЗЯИНА", 2), 1600);
  }

  function updateFlagHud() {
    const seq = state.track.flagSeq;
    const next = state.flagNext % FLAG_COLORS.length;
    el.flags.innerHTML = FLAG_COLORS.map((f, i) => {
      const got = state.flagsGot.includes(f.id) && i < next;
      return `<span class="flag-dot${got ? " got" : ""}" style="background:${f.fill}"></span>`;
    }).join("");
    // show upcoming order hint via title
    const upcoming = seq.slice(state.flagNext, state.flagNext + 4)
      .map((id) => FLAG_COLORS.find((f) => f.id === id).fill);
    el.flags.innerHTML = upcoming
      .map((c, i) => `<span class="flag-dot${i === 0 ? " got" : ""}" style="background:${c}"></span>`)
      .join("");
  }

  // ——— projection ———
  function project(p, camX, camY, camZ) {
    const scale = CAM_DEPTH / (p.world.z - camZ || 0.001);
    p.screen.scale = scale;
    p.screen.x = Math.round(W / 2 + scale * (p.world.x - camX) * W / 2);
    p.screen.y = Math.round(H / 2 - scale * (p.world.y - camY) * H / 2);
    p.screen.w = Math.round(scale * ROAD_W * W / 2);
  }

  function rumbleWidth(projectedRoadWidth, lanes) {
    return projectedRoadWidth / Math.max(6, 2 * lanes);
  }

  function drawPolygon(x1, y1, w1, x2, y2, w2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x2 - w2, y2);
    ctx.closePath();
    ctx.fill();
  }

  function drawSegment(seg, x1, y1, w1, x2, y2, w2, fogA) {
    const th = state.theme;
    const rumble1 = rumbleWidth(w1, 3);
    const rumble2 = rumbleWidth(w2, 3);
    const lane1 = rumbleWidth(w1, 6);
    const lane2 = rumbleWidth(w2, 6);
    const odd = seg.color;

    ctx.fillStyle = odd ? th.groundDark : th.ground;
    ctx.fillRect(0, y2, W, y1 - y2);

    drawPolygon(x1, y1, w1 * 1.15, x2, y2, w2 * 1.15, odd ? th.rumble : th.rumbleAlt);
    drawPolygon(x1, y1, w1, x2, y2, w2, th.road);

    if (odd) {
      drawPolygon(x1, y1, rumble1, x2, y2, rumble2, th.rumbleAlt);
      drawPolygon(x1, y1, lane1 * 0.35, x2, y2, lane2 * 0.35, th.roadLine);
    } else {
      drawPolygon(x1, y1, rumble1, x2, y2, rumble2, th.rumble);
    }

    if (fogA > 0.02) {
      ctx.fillStyle = th.fog.replace(/[\d.]+\)$/, Math.min(0.55, fogA).toFixed(2) + ")");
      // simpler fog via rgba rebuild
      const m = th.fog.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(",").map((s) => s.trim());
        ctx.fillStyle = `rgba(${parts[0]},${parts[1]},${parts[2]},${Math.min(0.5, fogA).toFixed(2)})`;
        ctx.fillRect(0, y2, W, Math.max(1, y1 - y2));
      }
    }
  }

  function spriteScale(segScale, base) {
    return Math.max(0.05, segScale * base * W);
  }

  function drawBuggy(px, py, scale, tilt, air) {
    const s = scale;
    ctx.save();
    ctx.translate(px, py - air * 40 * s);
    ctx.rotate(tilt * 0.55);
    ctx.scale(s, s);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 28 + air * 8, 38, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // body
    const body = ctx.createLinearGradient(-40, -20, 40, 30);
    body.addColorStop(0, "#ff8a3a");
    body.addColorStop(0.5, "#ff4d1a");
    body.addColorStop(1, "#c02808");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-36, 8);
    ctx.lineTo(-30, -18);
    ctx.lineTo(8, -26);
    ctx.lineTo(40, -10);
    ctx.lineTo(36, 16);
    ctx.lineTo(-28, 20);
    ctx.closePath();
    ctx.fill();

    // roll cage
    ctx.strokeStyle = "#2a2018";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.quadraticCurveTo(0, -38, 22, -6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, -18);
    ctx.lineTo(-8, 6);
    ctx.moveTo(12, -20);
    ctx.lineTo(12, 8);
    ctx.stroke();

    // windshield
    ctx.fillStyle = "rgba(140,210,255,0.45)";
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.lineTo(6, -18);
    ctx.lineTo(18, -6);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // wheels
    const drawWheel = (wx, wy, lean) => {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(lean);
      ctx.fillStyle = "#1a1410";
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    if (Math.abs(tilt) > 0.35) {
      // two-wheel: lift one side
      if (tilt > 0) {
        drawWheel(28, 18, 0.2);
        drawWheel(-8, 8, -0.4);
      } else {
        drawWheel(-28, 18, -0.2);
        drawWheel(8, 8, 0.4);
      }
    } else {
      drawWheel(-26, 18, -0.1 + state.steer * 0.3);
      drawWheel(26, 16, 0.1 + state.steer * 0.3);
      drawWheel(-18, 22, 0);
      drawWheel(22, 22, 0);
    }

    // headlight
    ctx.fillStyle = "#ffe8a0";
    ctx.beginPath();
    ctx.arc(34, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawObject(obj, seg, x, y, scale) {
    if (obj.hit && (obj.type === "flag" || obj.type === "gate" || obj.type === "time")) return;
    const s = spriteScale(scale, 0.0032);
    const ox = x + obj.offset * seg.p1.screen.w * 2;

    ctx.save();
    ctx.translate(ox, y);

    if (obj.type === "rock") {
      ctx.fillStyle = "#6a6058";
      ctx.beginPath();
      ctx.moveTo(-18 * s, 0);
      ctx.lineTo(-10 * s, -28 * s);
      ctx.lineTo(8 * s, -34 * s);
      ctx.lineTo(22 * s, -12 * s);
      ctx.lineTo(14 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#8a8078";
      ctx.beginPath();
      ctx.ellipse(-2 * s, -16 * s, 8 * s, 5 * s, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === "wall") {
      const ww = (obj.w || 0.3) * seg.p1.screen.w;
      ctx.fillStyle = "#a84838";
      ctx.fillRect(-ww, -40 * s, ww * 2, 40 * s);
      ctx.fillStyle = "#c86850";
      for (let r = 0; r < 3; r++) {
        ctx.fillRect(-ww + 2, -38 * s + r * 12 * s, ww * 2 - 4, 5 * s);
      }
    } else if (obj.type === "log") {
      ctx.fillStyle = "#6b3e18";
      ctx.fillRect(-40 * s, -10 * s, 80 * s, 12 * s);
      ctx.fillStyle = "#8a5520";
      ctx.beginPath();
      ctx.ellipse(-40 * s, -4 * s, 6 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(40 * s, -4 * s, 6 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === "stump") {
      ctx.fillStyle = "#5a3810";
      ctx.fillRect(-8 * s, -16 * s, 16 * s, 16 * s);
      ctx.fillStyle = "#7a5020";
      ctx.beginPath();
      ctx.ellipse(0, -16 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === "flag") {
      const col = FLAG_COLORS.find((f) => f.id === obj.color) || FLAG_COLORS[0];
      ctx.strokeStyle = "#333";
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -48 * s);
      ctx.stroke();
      ctx.fillStyle = col.fill;
      ctx.beginPath();
      ctx.moveTo(0, -48 * s);
      ctx.lineTo(28 * s, -38 * s);
      ctx.lineTo(0, -28 * s);
      ctx.closePath();
      ctx.fill();
    } else if (obj.type === "gate") {
      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = Math.max(2, 4 * s);
      ctx.strokeRect(-50 * s, -55 * s, 100 * s, 55 * s);
      ctx.fillStyle = "rgba(241,196,15,0.2)";
      ctx.fillRect(-50 * s, -55 * s, 100 * s, 55 * s);
      ctx.fillStyle = "#ffe08a";
      ctx.font = `bold ${Math.max(10, 18 * s)}px Exo 2`;
      ctx.textAlign = "center";
      ctx.fillText("+500", 0, -28 * s);
    } else if (obj.type === "time") {
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(0, -22 * s, 16 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, 14 * s)}px Exo 2`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+2", 0, -22 * s);
    } else if (obj.type === "checkpoint") {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(-70 * s, -70 * s, 140 * s, 70 * s);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, 3 * s);
      ctx.strokeRect(-70 * s, -70 * s, 140 * s, 70 * s);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(11, 16 * s)}px Bebas Neue`;
      ctx.textAlign = "center";
      ctx.fillText("CHECK", 0, -40 * s);
    }

    ctx.restore();
  }

  function drawSprite(sp, seg, x, y, scale) {
    const s = spriteScale(scale, 0.0028);
    const ox = x + sp.offset * seg.p1.screen.w * 2;
    ctx.save();
    ctx.translate(ox, y);
    if (sp.type === "cactus") {
      ctx.fillStyle = "#3d8a3a";
      ctx.fillRect(-6 * s, -50 * s, 12 * s, 50 * s);
      ctx.fillRect(-22 * s, -38 * s, 16 * s, 8 * s);
      ctx.fillRect(-22 * s, -38 * s, 8 * s, 22 * s);
      ctx.fillRect(6 * s, -28 * s, 16 * s, 8 * s);
      ctx.fillRect(14 * s, -28 * s, 8 * s, 16 * s);
    } else if (sp.type === "rockside") {
      ctx.fillStyle = "#7a7060";
      ctx.beginPath();
      ctx.moveTo(-20 * s, 0);
      ctx.lineTo(-5 * s, -30 * s);
      ctx.lineTo(18 * s, -18 * s);
      ctx.lineTo(12 * s, 0);
      ctx.closePath();
      ctx.fill();
    } else if (sp.type === "bush") {
      ctx.fillStyle = "#4a7a28";
      ctx.beginPath();
      ctx.arc(-8 * s, -10 * s, 14 * s, 0, Math.PI * 2);
      ctx.arc(8 * s, -12 * s, 12 * s, 0, Math.PI * 2);
      ctx.arc(0, -18 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSky() {
    const th = state.theme;
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, th.sky0);
    g.addColorStop(1, th.sky1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // sun
    ctx.fillStyle = "rgba(255,240,180,0.9)";
    ctx.beginPath();
    ctx.arc(W * 0.78, H * 0.16, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,200,80,0.25)";
    ctx.beginPath();
    ctx.arc(W * 0.78, H * 0.16, 70, 0, Math.PI * 2);
    ctx.fill();

    // distant dunes silhouette
    ctx.fillStyle = "rgba(90,60,30,0.25)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.42);
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * W;
      const y = H * 0.42 - Math.sin(i * 0.9 + state.pos * 0.00002) * 28 - (i % 3) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H * 0.55);
    ctx.lineTo(0, H * 0.55);
    ctx.fill();
  }

  function renderWorld() {
    const track = state.track;
    const segs = track.segs;
    const len = track.n;
    const base = Math.floor(state.pos / SEG_LEN) % len;
    const camY = CAM_H + (segs[base].p1.world.y || 0);
    const camZ = state.pos;
    let x = 0;
    let dx = 0;
    let maxY = H;

    drawSky();

    for (let n = 0; n < DRAW_DIST; n++) {
      const i = (base + n) % len;
      const seg = segs[i];
      const looped = base + n >= len;
      const zOff = looped ? len * SEG_LEN : 0;

      seg.p1.world.x = 0;
      seg.p2.world.x = 0;
      project(seg.p1, state.playerX * ROAD_W - x, camY, camZ - zOff);
      project(seg.p2, state.playerX * ROAD_W - x - dx, camY, camZ - zOff);

      // advance curve for next segment
      x += dx;
      dx += segs[i].curve;

      seg.clip = maxY;
      seg._fog = n / DRAW_DIST;
      if (n > 0 && seg.p1.screen.y < maxY) {
        maxY = seg.p1.screen.y;
      }
    }

    for (let n = DRAW_DIST - 1; n > 0; n--) {
      const i = (base + n) % len;
      const seg = segs[i];
      const prev = segs[(i - 1 + len) % len];
      if (seg.p1.screen.y >= seg.clip) continue;

      drawSegment(
        seg,
        prev.p1.screen.x,
        prev.p1.screen.y,
        prev.p1.screen.w,
        seg.p1.screen.x,
        seg.p1.screen.y,
        seg.p1.screen.w,
        seg._fog * 0.5
      );

      if (seg.p1.screen.scale < 0.01) continue;
      for (const sp of seg.sprites) {
        drawSprite(sp, seg, seg.p1.screen.x, seg.p1.screen.y, seg.p1.screen.scale);
      }
      for (const obj of seg.objects) {
        drawObject(obj, seg, seg.p1.screen.x, seg.p1.screen.y, seg.p1.screen.scale);
      }
    }

    const bogY = H - 70 - Math.sin(state.pos * 0.02) * (state.airborne > 0 ? 0 : 3);
    const bogX = W / 2 + state.playerX * 28 - state.steer * 8;
    drawBuggy(bogX, bogY, 1.15, state.tilt * state.tiltSide, state.airborne > 0 ? 1 : 0);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(W - 110, H - 58, 90, 40);
    ctx.fillStyle = state.gear === 2 ? "#ff6b2c" : "#7ec8ff";
    ctx.font = "800 18px Exo 2";
    ctx.textAlign = "center";
    ctx.fillText(state.gear === 2 ? "HIGH" : "LOW", W - 65, H - 32);

    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.s, p.s);
      ctx.globalAlpha = 1;
    }
  }

  function hitTest(obj) {
    const half = Math.abs(obj.offset);
    if (obj.type === "gate" || obj.type === "checkpoint" || obj.type === "time") {
      return Math.abs(state.playerX - obj.offset) < 0.55;
    }
    if (obj.type === "flag") {
      return Math.abs(state.playerX - obj.offset) < 0.28;
    }
    if (obj.type === "log") {
      return Math.abs(state.playerX - obj.offset) < 0.45;
    }
    if (obj.type === "stump") {
      return Math.abs(state.playerX - obj.offset) < 0.22;
    }
    if (obj.type === "wall") {
      return Math.abs(state.playerX - obj.offset) < (obj.w || 0.3) + 0.12;
    }
    if (obj.type === "rock") {
      return Math.abs(state.playerX - obj.offset) < 0.2;
    }
    return half < 0.25 && Math.abs(state.playerX - obj.offset) < 0.25;
  }

  function crash(severity = 1) {
    if (amalGod()) return;
    if (state.crashed > 0 || state.airborne > 0.15) return;
    state.crashed = 0.9 * severity;
    state.speed *= 0.25;
    state.gear = 1;
    state.tilt = 0;
    state.score = Math.max(0, state.score - 100);
    showMsg("АВАРИЯ!", 0.8);
    for (let i = 0; i < 14; i++) {
      state.particles.push({
        x: W / 2 + (Math.random() - 0.5) * 80,
        y: H - 90,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 180 - 40,
        s: 3 + Math.random() * 5,
        life: 1,
        color: Math.random() < 0.5 ? "#c44a2a" : "#e8d0a0",
      });
    }
  }

  function update(dt) {
    if (state.screen !== "play" || state.finished || state.dead) return;

    const left = state.keys["ArrowLeft"] || state.keys["a"] || state.keys["A"] || state.pad.left;
    const right = state.keys["ArrowRight"] || state.keys["d"] || state.keys["D"] || state.pad.right;
    const accel = state.keys["ArrowUp"] || state.keys["w"] || state.keys["W"] || state.pad.accel;
    const brake = state.keys["ArrowDown"] || state.keys["s"] || state.keys["S"] || state.pad.brake;
    const gearKey = state.keys[" "] || state.pad.gear;

    if (gearKey && !state.gearQueued) {
      state.gear = state.gear === 1 ? 2 : 1;
      state.gearQueued = true;
      showMsg(state.gear === 2 ? "HIGH GEAR" : "LOW GEAR", 0.6);
    }
    if (!gearKey) state.gearQueued = false;

    if (state.crashed > 0) {
      state.crashed -= dt;
      state.speed *= 0.96;
    } else {
      const maxSp = state.gear === 1 ? state.maxSpeed * 0.55 : state.maxSpeed;
      const acc = state.gear === 1 ? 3200 : 2200;
      if (accel) state.speed += acc * dt;
      else state.speed -= 900 * dt;
      if (brake) state.speed -= 4200 * dt;
      if (state.speed > maxSp) state.speed += (maxSp - state.speed) * 3 * dt;
      if (state.speed < 0) state.speed = 0;
    }

    // steering
    const steerSp = 2.4 * (0.4 + state.speed / state.maxSpeed);
    if (left) state.steer = Math.max(-1, state.steer - 4 * dt);
    else if (right) state.steer = Math.min(1, state.steer + 4 * dt);
    else state.steer *= Math.max(0, 1 - 6 * dt);

    if (state.airborne <= 0) {
      state.playerX += state.steer * steerSp * dt * (0.7 + state.speed / state.maxSpeed);
    } else {
      state.playerX += state.steer * steerSp * 0.35 * dt;
      state.airborne -= dt;
    }

    // centrifugal on curves
    const base = Math.floor(state.pos / SEG_LEN) % state.track.n;
    const curve = state.track.segs[base].curve;
    state.playerX -= curve * state.speed * 0.0000018 * dt * 60;

    // tilt decay
    if (state.tilt > 0) {
      state.tilt -= dt * 0.55;
      if (state.tilt < 0) state.tilt = 0;
    }

    // off road
    if (Math.abs(state.playerX) > 1.05) {
      state.speed *= 0.97;
      if (Math.abs(state.playerX) > 1.35) {
        state.playerX = Math.sign(state.playerX) * 1.35;
        crash(0.7);
      }
    }

    state.pos += state.speed * dt;
    const trackLen = state.track.n * SEG_LEN;
    // wrap for offroad-style continuous, but legs still tracked by distance
    while (state.pos >= trackLen) state.pos -= trackLen;
    while (state.pos < 0) state.pos += trackLen;

    // collisions with nearby segment objects
    const si = Math.floor(state.pos / SEG_LEN) % state.track.n;
    for (let d = 0; d <= 1; d++) {
      const seg = state.track.segs[(si + d) % state.track.n];
      const segZ = ((si + d) % state.track.n) * SEG_LEN;
      // approximate player z relative
      let rel = state.pos - segZ;
      if (rel < -trackLen / 2) rel += trackLen;
      if (rel > trackLen / 2) rel -= trackLen;
      if (Math.abs(rel) > SEG_LEN * 0.65) continue;

      for (const obj of seg.objects) {
        if (obj.hit) continue;
        if (!hitTest(obj)) continue;

        if (obj.type === "log") {
          obj.hit = true;
          if (state.speed > 1800) {
            state.airborne = 0.75 + Math.min(0.5, state.speed / 8000);
            state.score += 200;
            showMsg("ПРЫЖОК! +200", 0.9);
          } else {
            crash(0.5);
          }
        } else if (obj.type === "stump") {
          obj.hit = true;
          state.tilt = 1.2;
          state.tiltSide = obj.offset >= 0 ? 1 : -1;
          state.score += 150;
          showMsg("НА ДВА КОЛЕСА! +150", 0.9);
        } else if (obj.type === "flag") {
          obj.hit = true;
          const want = state.track.flagSeq[state.flagNext % state.track.flagSeq.length];
          if (obj.color === want) {
            state.flagNext++;
            state.flagsGot.push(obj.color);
            const bonus = 100 + (state.flagNext % 4 === 0 ? 400 : 0);
            state.score += bonus;
            showMsg(state.flagNext % 4 === 0 ? "СЕРИЯ! +" + bonus : "ФЛАГ +" + bonus, 0.8);
          } else {
            state.score += 50;
            showMsg("ФЛАГ +50", 0.5);
          }
          updateFlagHud();
        } else if (obj.type === "gate") {
          obj.hit = true;
          state.score += obj.points || 500;
          showMsg("ВОРОТА +" + (obj.points || 500), 0.8);
        } else if (obj.type === "time") {
          obj.hit = true;
          state.timeLeft += obj.bonus || 2;
          state.score += 100;
          showMsg("+" + (obj.bonus || 2) + " СЕК", 0.8);
        } else if (obj.type === "checkpoint") {
          obj.hit = true;
          if (obj.leg === state.leg) {
            state.leg++;
            state.timeLeft += 8 + state.course.legs;
            state.score += 1000;
            if (state.leg > state.course.legs) {
              state.finished = true;
              state.score += Math.floor(state.timeLeft * 50);
              showMsg("ФИНИШ!", 1.5);
              setTimeout(() => renderResult(true), 900);
            } else {
              showMsg("ЭТАП " + (state.leg - 1) + " · +" + (8 + state.course.legs) + "с", 1.2);
            }
          }
        } else if (obj.type === "rock" || obj.type === "wall") {
          if (state.airborne > 0.1) {
            // clear while jumping
            if (obj.type === "rock") {
              obj.hit = true;
              state.score += 100;
            }
          } else if (state.tilt > 0.4 && obj.type === "rock" && Math.abs(state.playerX) > 0.15) {
            // squeeze past on two wheels sometimes
            obj.hit = true;
            state.score += 80;
          } else {
            crash(1);
            obj.hit = true;
          }
        }
      }
    }

    // score from speed
    state.score += Math.floor(state.speed * dt * 0.02);

    state.timeLeft -= dt;
    if (amalGod()) state.timeLeft = Math.max(state.timeLeft, 45);
    if (state.timeLeft <= 0 && !state.finished) {
      state.timeLeft = 0;
      state.dead = true;
      showMsg("ВРЕМЯ!", 1.2);
      setTimeout(() => renderResult(false), 800);
    }

    if (state.msgT > 0) {
      state.msgT -= dt;
      if (state.msgT <= 0) el.msg.classList.remove("show");
    }

    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
      p.life -= dt * 1.5;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    // dust when moving
    if (state.speed > 800 && state.airborne <= 0 && Math.random() < dt * 12) {
      state.particles.push({
        x: W / 2 + state.playerX * 30 + (Math.random() - 0.5) * 40,
        y: H - 55,
        vx: -state.speed * 0.02 + (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 40,
        s: 2 + Math.random() * 4,
        life: 0.6,
        color: "rgba(196,165,116,0.7)",
      });
    }

    el.time.textContent = state.timeLeft.toFixed(1);
    el.score.textContent = String(Math.floor(state.score));
    el.speed.textContent = String(Math.floor(state.speed / 40));
    el.leg.textContent = state.finished
      ? "Финиш"
      : `Этап ${Math.min(state.leg, state.course.legs)} / ${state.course.legs}`;
  }

  // ——— input ———
  window.addEventListener("keydown", (e) => {
    state.keys[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    if (e.key === "Escape" && state.screen === "play") renderMenu();
  });
  window.addEventListener("keyup", (e) => {
    state.keys[e.key] = false;
  });

  function bindPad(btn) {
    const k = btn.dataset.k;
    const set = (v) => {
      if (k === "left") state.pad.left = v;
      if (k === "right") state.pad.right = v;
      if (k === "accel") state.pad.accel = v;
      if (k === "brake") state.pad.brake = v;
      btn.classList.toggle("held", v);
    };
    const down = (e) => {
      e.preventDefault();
      try {
        if (e.pointerId != null) btn.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      set(true);
    };
    const up = () => set(false);
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); set(true); }, { passive: false });
    btn.addEventListener("touchend", up);
    btn.addEventListener("touchcancel", up);
  }
  touch.querySelectorAll(".pad").forEach(bindPad);

  // double-tap gear on accel+brake? add gear via long-press on speed area — use Space; on mobile: tap HUD gear
  canvas.addEventListener("pointerdown", () => {
    if (state.screen === "play") {
      // tap canvas right side = gear
    }
  });

  // mobile gear: hold both left+right briefly — simpler: third row already; add click on gear box
  canvas.addEventListener("click", (e) => {
    if (state.screen !== "play") return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (x > W - 120 && y > H - 70) {
      state.gear = state.gear === 1 ? 2 : 1;
      showMsg(state.gear === 2 ? "HIGH GEAR" : "LOW GEAR", 0.6);
    }
  });

  // Expose for debugging / external control
  window.__xbuggy = state;

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (state.screen === "play") {
      update(dt);
      renderWorld();
    }
    requestAnimationFrame(frame);
  }

  renderMenu();
  requestAnimationFrame(frame);

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (t === "heal" || t === "xb-fix" || t === "max") {
      state.crashed = 0;
      state.dead = false;
      state.timeLeft = Math.max(state.timeLeft, 60);
      state.speed = Math.max(state.speed, 40);
      showMsg("💚 Хилл · багги цел", 1.5);
    }
    if (t === "xb-turbo" || t === "speed" || t === "max") {
      state.maxSpeed = Math.max(state.maxSpeed || 0, 280);
      state.speed = Math.max(state.speed, 180);
      state.gear = 2;
      showMsg("🚀 ТУРБО", 1);
    }
    if (t === "xb-time" || t === "max") {
      state.timeLeft = (state.timeLeft || 0) + 99;
      showMsg("⏱ +99 сек", 1);
    }
    if (t === "xb-finish") {
      state.finished = true;
      state.dead = false;
      state.crashed = 0;
      state.score += Math.floor((state.timeLeft || 0) * 50);
      showMsg("🏁 ФИНИШ!", 1.5);
      setTimeout(() => renderResult(true), 500);
    }
    if (t === "god" || t === "max") {
      state.crashed = 0;
      window.__AMAL_GOD__ = true;
    }
    const amount = e.detail && Number(e.detail.amount);
    if ((t === "set-score" || (t === "set-amount" && e.detail.kind === "score")) && Number.isFinite(amount)) {
      state.score = amount;
      showMsg("🏆 Очки: " + amount, 1);
    }
    if ((t === "set-coins" || (t === "set-amount" && e.detail.kind === "coins")) && Number.isFinite(amount)) {
      state.score = amount;
      showMsg("💰 " + amount, 1);
    }
    if ((t === "set-cups" || (t === "set-amount" && e.detail.kind === "cups")) && Number.isFinite(amount)) {
      state.timeLeft = amount;
      showMsg("⏱ " + amount + " сек", 1);
    }
  });
})();
