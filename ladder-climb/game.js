(() => {
  const TILE = 36;
  const GRAVITY = 2000;
  const MOVE = 220;
  const JUMP = 780;
  const STORAGE = "stair-steps-v1";

  // Surfaces / obstacles on small stairs
  const SURF = {
    NORMAL: 0,
    ICE_SLIP: 1, // скользкий лёд — скользишь и падаешь
    ICE_STICK: 2, // липкий лёд — медленно, прыжок слабый
    HONEY: 3, // мёд — липнет
    SLUSH: 4, // слякоть
    OIL: 5, // масло — очень скользко
    SPIKE: 6, // шипы
    WATER: 7, // вода — лужа, скользишь
  };

  const KEY = {
    unlock: STORAGE + "-unlock",
    best: STORAGE + "-best",
  };

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

  /**
   * Маленькие ступеньки к верхнему этажу (gapX/gapY ≈ 1 — можно подниматься шагом).
   * На ступенях — препятствия: лёд, вода и другое.
   */
  const LEVELS = [
    {
      id: 1,
      name: "Маленькие ступеньки",
      hint: "Поднимайся по маленьким ступеням на верхний этаж",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.NORMAL,
        SURF.NORMAL,
        SURF.NORMAL,
        SURF.NORMAL,
        SURF.NORMAL,
        SURF.NORMAL,
        SURF.NORMAL,
      ],
    },
    {
      id: 2,
      name: "Лёд на ступенях",
      hint: "На ступеньках лёд — можно поскользнуться",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.ICE_SLIP,
        SURF.NORMAL,
        SURF.ICE_SLIP,
        SURF.ICE_SLIP,
        SURF.NORMAL,
        SURF.ICE_SLIP,
        SURF.NORMAL,
      ],
    },
    {
      id: 3,
      name: "Лужи воды",
      hint: "Вода на ступенях тоже скользкая",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.WATER,
        SURF.WATER,
        SURF.NORMAL,
        SURF.WATER,
        SURF.ICE_SLIP,
        SURF.WATER,
        SURF.NORMAL,
      ],
    },
    {
      id: 4,
      name: "Лёд и вода",
      hint: "Лёд уносит сильнее, вода — чуть слабее, но тоже скользко",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.ICE_SLIP,
        SURF.WATER,
        SURF.ICE_SLIP,
        SURF.WATER,
        SURF.WATER,
        SURF.ICE_SLIP,
        SURF.NORMAL,
      ],
    },
    {
      id: 5,
      name: "Липкий лёд",
      hint: "Синий лёд липкий: медленно, прыжок слабый",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.ICE_STICK,
        SURF.WATER,
        SURF.ICE_STICK,
        SURF.ICE_SLIP,
        SURF.ICE_STICK,
        SURF.WATER,
        SURF.NORMAL,
      ],
    },
    {
      id: 6,
      name: "Мёд и слякоть",
      hint: "Мёд липнет, слякоть скользит",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.HONEY,
        SURF.SLUSH,
        SURF.WATER,
        SURF.HONEY,
        SURF.ICE_SLIP,
        SURF.SLUSH,
        SURF.NORMAL,
      ],
    },
    {
      id: 7,
      name: "Масло",
      hint: "Масло ещё скользче льда и воды",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.OIL,
        SURF.WATER,
        SURF.OIL,
        SURF.ICE_SLIP,
        SURF.OIL,
        SURF.WATER,
        SURF.NORMAL,
      ],
    },
    {
      id: 8,
      name: "Шипы на пути",
      hint: "Прыгай через шипы, не стой на них",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.WATER,
        SURF.SPIKE,
        SURF.ICE_SLIP,
        SURF.SPIKE,
        SURF.WATER,
        SURF.ICE_STICK,
        SURF.NORMAL,
      ],
    },
    {
      id: 9,
      name: "Долгий подъём",
      hint: "Много маленьких ступеней с разными препятствиями",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.ICE_SLIP,
        SURF.WATER,
        SURF.ICE_STICK,
        SURF.HONEY,
        SURF.SPIKE,
        SURF.OIL,
        SURF.WATER,
        SURF.SLUSH,
        SURF.ICE_SLIP,
        SURF.NORMAL,
      ],
    },
    {
      id: 10,
      name: "Верхний этаж",
      hint: "Финал: лёд, вода и всё остальное на пути наверх",
      stepW: 2,
      gapX: 1,
      gapY: 1,
      steps: [
        SURF.NORMAL,
        SURF.ICE_SLIP,
        SURF.WATER,
        SURF.ICE_STICK,
        SURF.SPIKE,
        SURF.OIL,
        SURF.WATER,
        SURF.HONEY,
        SURF.ICE_SLIP,
        SURF.SLUSH,
        SURF.WATER,
        SURF.NORMAL,
      ],
    },
  ];

  const SURF_INFO = {
    [SURF.NORMAL]: {
      name: "ступень",
      color: "#8b6914",
      shade: "#6a4f0e",
      friction: 1,
      slip: 0,
      jumpMul: 1,
      moveMul: 1,
    },
    [SURF.ICE_SLIP]: {
      name: "скользкий лёд",
      color: "#b8ecff",
      shade: "#7ec8f0",
      friction: 0.05,
      slip: 1.7,
      jumpMul: 0.95,
      moveMul: 1,
    },
    [SURF.ICE_STICK]: {
      name: "липкий лёд",
      color: "#5eb0e0",
      shade: "#3a88b8",
      friction: 2.4,
      slip: 0,
      jumpMul: 0.72,
      moveMul: 0.45,
    },
    [SURF.HONEY]: {
      name: "мёд",
      color: "#e8a820",
      shade: "#b07810",
      friction: 2.6,
      slip: 0,
      jumpMul: 0.75,
      moveMul: 0.4,
    },
    [SURF.SLUSH]: {
      name: "слякоть",
      color: "#7a8f6a",
      shade: "#5a6f4a",
      friction: 0.35,
      slip: 0.7,
      jumpMul: 0.85,
      moveMul: 0.7,
    },
    [SURF.OIL]: {
      name: "масло",
      color: "#3a3a28",
      shade: "#2a2a18",
      friction: 0.03,
      slip: 2,
      jumpMul: 0.8,
      moveMul: 1,
    },
    [SURF.SPIKE]: {
      name: "шипы",
      color: "#c44b4b",
      shade: "#8a2f2f",
      friction: 0.8,
      slip: 0.2,
      jumpMul: 1,
      moveMul: 1,
    },
    [SURF.WATER]: {
      name: "вода",
      color: "#3a8fd4",
      shade: "#2a6fa8",
      friction: 0.12,
      slip: 1.2,
      jumpMul: 0.9,
      moveMul: 0.85,
    },
  };

  function buildWorld(level) {
    const n = level.steps.length;
    const stepW = Math.max(2, level.stepW || 3);
    const gapX = level.gapX || 2;
    const gapY = level.gapY || 2;
    const margin = 4;
    const w = margin + n * gapX + stepW + 6;
    const h = n * gapY + 8;
    const groundY = h - 2;
    const steps = [];

    const spawnX = (margin - 2) * TILE + TILE / 2;
    const spawnY = groundY * TILE;

    for (let i = 0; i < n; i++) {
      const surf = level.steps[i];
      const tx = margin + i * gapX;
      const ty = groundY - gapY - i * gapY;
      steps.push({
        i,
        surf,
        x: tx * TILE,
        y: ty * TILE,
        w: stepW * TILE,
        h: TILE,
        top: ty * TILE,
      });
    }

    const top = steps[steps.length - 1];
    // Upper floor continues from the last small step
    const topFloor = {
      x: top.x,
      y: top.y,
      w: top.w + TILE * 6,
      h: TILE,
    };
    const goal = {
      x: topFloor.x + topFloor.w - TILE * 1.5,
      y: topFloor.y,
    };

    // Slightly wider world so the upper floor fits
    const needW = Math.ceil((topFloor.x + topFloor.w) / TILE) + 2;

    return {
      w: Math.max(w, needW),
      h,
      groundY,
      steps,
      spawnX,
      spawnY,
      goal,
      topFloor,
      level,
      gapY,
    };
  }

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

  let unlock = store.get(KEY.unlock, 1);
  if (amalGod()) unlock = 99;
  let best = store.get(KEY.best, {});

  const keys = Object.create(null);
  const touch = { left: false, right: false, jump: false };

  const state = {
    screen: "menu",
    levelIndex: 0,
    world: null,
    player: null,
    won: false,
    dead: false,
    message: "",
    messageCd: 0,
    camX: 0,
    camY: 0,
    time: 0,
  };

  const app = document.getElementById("app");

  function makePlayer(world) {
    return {
      x: world.spawnX,
      y: world.spawnY,
      vx: 0,
      vy: 0,
      w: 18,
      h: 28,
      onGround: false,
      iceVx: 0,
      invuln: 0,
      hp: 3,
      face: 1,
      onStep: null,
    };
  }

  function startLevel(index) {
    state.levelIndex = index;
    state.world = buildWorld(LEVELS[index]);
    state.player = makePlayer(state.world);
    state.won = false;
    state.dead = false;
    state.message = "";
    state.messageCd = 0;
    state.time = 0;
    state.screen = "play";
    render();
  }

  function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function feetOn(p, plat) {
    const fx = p.x - p.w / 2;
    const fy = p.y - 2;
    return (
      p.vy >= 0 &&
      fx + p.w > plat.x + 2 &&
      fx < plat.x + plat.w - 2 &&
      fy >= plat.y - 6 &&
      fy <= plat.y + 10
    );
  }

  function platforms(world) {
    const list = [];
    // ground — solid
    list.push({
      x: 0,
      y: world.groundY * TILE,
      w: world.w * TILE,
      h: TILE * 2,
      surf: SURF.NORMAL,
      kind: "ground",
      solid: true,
    });
    // steps — only the top surface (one-way), so you never get stuck "behind" the riser
    for (const s of world.steps) {
      list.push({
        x: s.x,
        y: s.y,
        w: s.w,
        h: 10,
        surf: s.surf,
        kind: "step",
        step: s,
        solid: false,
        oneWay: true,
      });
    }
    list.push({
      x: world.topFloor.x,
      y: world.topFloor.y,
      w: world.topFloor.w,
      h: 10,
      surf: SURF.NORMAL,
      kind: "top",
      solid: false,
      oneWay: true,
    });
    return list;
  }

  function hurt(p, msg) {
    if (p.invuln > 0) return;
    if (amalGod()) return;
    p.hp -= 1;
    p.invuln = 0.9;
    p.vy = -280;
    p.vx = -p.face * 140;
    p.iceVx = 0;
    if (p.hp <= 0) {
      state.dead = true;
      state.message = msg || "Упал со ступеней…";
    }
  }

  function update(dt) {
    if (state.screen !== "play" || !state.player || state.won || state.dead) return;
    const p = state.player;
    const world = state.world;
    state.time += dt;
    if (state.messageCd > 0) {
      state.messageCd -= dt;
      if (state.messageCd <= 0) state.message = "";
    }
    p.invuln = Math.max(0, p.invuln - dt);

    const left = keys.ArrowLeft || keys.KeyA || touch.left;
    const right = keys.ArrowRight || keys.KeyD || touch.right;
    const jump = keys.Space || keys.KeyW || keys.ArrowUp || touch.jump;
    const wish = (right ? 1 : 0) - (left ? 1 : 0);
    if (wish) p.face = wish;

    const plats = platforms(world);
    // find current surface under feet
    let stand = null;
    for (const plat of plats) {
      if (feetOn(p, plat)) {
        stand = plat;
        break;
      }
    }

    const info = stand ? SURF_INFO[stand.surf] : SURF_INFO[SURF.NORMAL];
    p.onGround = !!stand;
    p.onStep = stand && stand.kind === "step" ? stand.step : null;

    if (p.onGround) {
      const fric = info.friction;
      const moveMul = info.moveMul ?? 1;
      if (fric < 0.2) {
        // slippery ice / water / oil — slide and risk falling off
        p.iceVx = (p.iceVx || 0) * (0.988 + fric * 0.05) + wish * MOVE * (0.018 + fric * 0.15);
        const max = MOVE * (1.25 + info.slip);
        p.iceVx = Math.max(-max, Math.min(max, p.iceVx));
        if (!wish) p.iceVx *= 0.996;
        p.vx = p.iceVx;
      } else if (fric > 1.5) {
        // sticky ice / honey — slow walk, hard to slip
        p.vx = wish * MOVE * moveMul;
        p.iceVx = 0;
      } else if (fric < 0.5) {
        // slush
        p.iceVx = (p.iceVx || 0) * 0.94 + wish * MOVE * 0.12;
        p.iceVx = Math.max(-MOVE, Math.min(MOVE, p.iceVx));
        p.vx = p.iceVx * 0.65 + wish * MOVE * 0.3 * moveMul;
      } else {
        p.vx = wish * MOVE * moveMul;
        p.iceVx = wish * MOVE;
      }

      if (jump) {
        p.vy = -JUMP * (info.jumpMul ?? 1);
        p.onGround = false;
        if (info.friction >= 0.2) p.iceVx = p.vx * 0.5;
        else p.iceVx = p.vx; // keep slide momentum in air from slippery ice
      }

      if (stand.surf === SURF.SPIKE) hurt(p, "Наступил на шипы!");
    } else {
      p.vx = wish ? wish * MOVE * 0.85 : p.vx * 0.98;
      p.vy += GRAVITY * dt;
    }

    p.vy = Math.min(p.vy, 1200);

    // Auto step-up onto small stairs (1 tile high)
    if (wish !== 0 || Math.abs(p.vx) > 8) {
      const dir = wish || Math.sign(p.vx) || p.face;
      let best = null;
      let bestRise = 9999;
      for (const plat of plats) {
        if (!plat.oneWay) continue;
        const reachL = p.x - p.w / 2 + dir * 2;
        const reachR = p.x + p.w / 2 + dir * 20;
        const overlap = reachR > plat.x && reachL < plat.x + plat.w;
        if (!overlap) continue;
        const rise = p.y - plat.y;
        if (rise > 2 && rise <= TILE * 1.25 && rise < bestRise) {
          bestRise = rise;
          best = plat;
        }
      }
      if (best) {
        p.y = best.y;
        p.vy = 0;
        p.onGround = true;
        // Keep some slide on ice/water when mounting the next step
        const keepSlide = stand && SURF_INFO[stand.surf].friction < 0.2;
        p.vx = keepSlide
          ? p.vx
          : dir * Math.max(Math.abs(p.vx), MOVE * 0.55);
        if (!keepSlide) p.iceVx = p.vx;
      }
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // collide: ground solid; steps/top one-way
    p.onGround = false;
    let bestStand = null;
    for (const plat of plats) {
      const px = p.x - p.w / 2;
      const prevFeet = p.y - p.vy * dt;
      const hitH = plat.oneWay ? 12 : plat.h;
      if (!rectHit(px, p.y - p.h, p.w, p.h, plat.x, plat.y, plat.w, hitH)) continue;

      if (plat.oneWay) {
        if (p.vy >= -40 && prevFeet <= plat.y + 12 && p.y >= plat.y - 4) {
          p.y = plat.y;
          p.vy = 0;
          p.onGround = true;
          if (!bestStand || plat.y < bestStand.y) bestStand = plat;
        }
        continue;
      }

      if (p.vy >= 0 && prevFeet <= plat.y + 12) {
        p.y = plat.y;
        p.vy = 0;
        p.onGround = true;
        bestStand = plat;
      }
    }

    if (bestStand) {
      p.onStep = bestStand.kind === "step" ? bestStand.step : null;
    } else if (!p.onGround) {
      p.onStep = null;
    }

    // world bounds
    p.x = Math.max(p.w / 2, Math.min(p.x, world.w * TILE - p.w / 2));

    // fell off map
    if (p.y > world.h * TILE + 40) {
      state.dead = true;
      state.message = "Поскользнулся и упал вниз!";
    }

    // Win: walk to the flag on the top floor (same height as last step)
    const tf = world.topFloor;
    if (
      !state.won &&
      p.onGround &&
      Math.abs(p.y - tf.y) <= 8 &&
      p.x > tf.x + tf.w * 0.45
    ) {
      state.won = true;
      const id = LEVELS[state.levelIndex].id;
      best[id] = 1;
      store.set(KEY.best, best);
      unlock = Math.max(unlock, Math.min(LEVELS.length, id + 1));
      store.set(KEY.unlock, unlock);
      state.message =
        id >= LEVELS.length ? "Ты на верхнем этаже! Все 10 пройдены!" : "Финиш! Уровень пройден";
    }

    // camera
    const canvas = document.getElementById("game");
    if (canvas) {
      const vw = canvas.clientWidth;
      const vh = canvas.clientHeight;
      state.camX = Math.max(0, Math.min(p.x - vw * 0.4, world.w * TILE - vw));
      state.camY = Math.max(0, Math.min(p.y - vh * 0.7, world.h * TILE - vh));
    }
  }

  function drawStep(ctx, plat, camX, camY) {
    const sx = Math.round(plat.x - camX);
    const sy = Math.round(plat.y - camY);
    const drawH = plat.kind === "ground" ? plat.h : TILE;
    const info = SURF_INFO[plat.surf];
    ctx.fillStyle = info.color;
    ctx.fillRect(sx, sy, plat.w, drawH);
    ctx.fillStyle = info.shade;
    ctx.fillRect(sx, sy, plat.w, 4);
    ctx.fillRect(sx, sy + drawH - 4, plat.w, 4);

    if (plat.surf === SURF.ICE_SLIP) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(sx + 6, sy + 10, 14, 3);
      ctx.fillRect(sx + plat.w / 2, sy + 18, 12, 2);
      ctx.fillStyle = "rgba(180,230,255,0.35)";
      ctx.fillRect(sx + 2, sy + 2, plat.w - 4, 6);
    } else if (plat.surf === SURF.ICE_STICK) {
      ctx.fillStyle = "rgba(40,100,140,0.35)";
      ctx.fillRect(sx + 4, sy + 8, plat.w - 8, drawH - 12);
      ctx.fillStyle = "rgba(200,230,255,0.25)";
      ctx.beginPath();
      ctx.ellipse(sx + plat.w / 2, sy + drawH / 2, plat.w * 0.28, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (plat.surf === SURF.HONEY) {
      ctx.fillStyle = "rgba(255,220,100,0.45)";
      ctx.beginPath();
      ctx.ellipse(sx + plat.w / 2, sy + drawH / 2, plat.w * 0.3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (plat.surf === SURF.SLUSH) {
      ctx.fillStyle = "rgba(200,220,180,0.35)";
      for (let i = 0; i < 4; i++) ctx.fillRect(sx + 8 + i * 14, sy + 12, 8, 5);
    } else if (plat.surf === SURF.OIL) {
      ctx.fillStyle = "rgba(80,80,40,0.5)";
      ctx.beginPath();
      ctx.ellipse(sx + plat.w * 0.4, sy + 14, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (plat.surf === SURF.SPIKE) {
      ctx.fillStyle = "#ff6b6b";
      const spikes = Math.max(2, Math.floor(plat.w / 16));
      for (let i = 0; i < spikes; i++) {
        const x = sx + 8 + i * (plat.w / spikes);
        ctx.beginPath();
        ctx.moveTo(x, sy + drawH - 4);
        ctx.lineTo(x + 6, sy + 6);
        ctx.lineTo(x + 12, sy + drawH - 4);
        ctx.fill();
      }
    } else if (plat.surf === SURF.WATER) {
      ctx.fillStyle = "rgba(120,200,255,0.45)";
      ctx.fillRect(sx + 2, sy + 2, plat.w - 4, drawH - 6);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.ellipse(sx + plat.w * 0.35, sy + 10, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx + plat.w * 0.7, sy + 16, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (plat.kind === "step") {
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + drawH / 2);
      ctx.lineTo(sx + plat.w - 4, sy + drawH / 2);
      ctx.stroke();
    }
  }

  function paint() {
    const canvas = document.getElementById("game");
    if (!canvas || state.screen !== "play" || !state.world || !state.player) return;
    const ctx = canvas.getContext("2d");
    const world = state.world;
    const p = state.player;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const vw = cssW;
    const vh = cssH;
    const camX = state.camX;
    const camY = state.camY;

    const sky = ctx.createLinearGradient(0, 0, 0, vh);
    sky.addColorStop(0, "#3d5a80");
    sky.addColorStop(1, "#1b2838");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, vw, vh);

    // soft wall backdrop
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, 0, vw, vh);

    for (const plat of platforms(world)) drawStep(ctx, plat, camX, camY);

    // goal flag on top floor
    const gx = Math.round(world.goal.x - camX);
    const gy = Math.round(world.goal.y - camY);
    ctx.fillStyle = "#5c4030";
    ctx.fillRect(gx - 2, gy - 36, 4, 36);
    ctx.fillStyle = "#ffe066";
    ctx.beginPath();
    ctx.moveTo(gx + 2, gy - 36);
    ctx.lineTo(gx + 24, gy - 24);
    ctx.lineTo(gx + 2, gy - 12);
    ctx.fill();

    // label top floor
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "700 12px Nunito, system-ui";
    ctx.fillText(
      "верхний этаж — дойди сюда",
      Math.round(world.topFloor.x - camX + 8),
      Math.round(world.topFloor.y - camY - 10),
    );

    // player
    const px = Math.round(p.x - p.w / 2 - camX);
    const py = Math.round(p.y - p.h - camY);
    ctx.globalAlpha = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0 ? 0.35 : 1;
    ctx.fillStyle = "#ff7a59";
    ctx.fillRect(px, py + 8, p.w, p.h - 8);
    ctx.fillStyle = "#ffd7b5";
    ctx.fillRect(px + 2, py, p.w - 4, 12);
    ctx.fillStyle = "#2a1c00";
    ctx.fillRect(px + (p.face > 0 ? p.w - 8 : 4), py + 4, 3, 3);
    ctx.globalAlpha = 1;

    // hearts
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < p.hp ? "#ff5a6a" : "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(18 + i * 18, 18, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // current surface hint
    if (p.onGround && p.onStep) {
      const info = SURF_INFO[p.onStep.surf];
      ctx.fillStyle = "#fff";
      ctx.font = "800 13px Nunito, system-ui";
      ctx.fillText("Под ногами: " + info.name, 78, 22);
    }

    if (state.message && (state.won || state.dead)) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(vw / 2 - 180, vh / 2 - 40, 360, 84);
      ctx.fillStyle = "#fff";
      ctx.font = "800 18px Nunito, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(state.message, vw / 2, vh / 2 - 2);
      ctx.font = "700 13px Nunito, system-ui";
      ctx.fillStyle = "#cfd8ef";
      ctx.fillText(state.won ? "Enter — дальше · Esc — меню" : "R — заново · Esc — меню", vw / 2, vh / 2 + 26);
      ctx.textAlign = "left";
    }
  }

  function renderMenu() {
    app.innerHTML = `
      <div class="screen">
        <div class="panel">
          <h1>Ступеньки вверх</h1>
          <p>Маленькие ступеньки ведут на верхний этаж. На них препятствия: лёд и вода (скользишь), липкий лёд, мёд, слякоть, масло и шипы.</p>
          <div class="legend">
            <span class="chip ladder">🪵 ступень</span>
            <span class="chip ice">❄️ лёд</span>
            <span class="chip" style="color:#6ec0ff">💧 вода</span>
            <span class="chip" style="color:#7ec8f0">🧊 липкий лёд</span>
            <span class="chip" style="color:#e8a820">🍯 мёд</span>
            <span class="chip slime">💧 слякоть</span>
            <span class="chip" style="color:#c4c49a">🛢️ масло</span>
            <span class="chip spike">🔺 шипы</span>
          </div>
          <button class="btn" id="btn-play" type="button">Играть</button>
          <button class="btn ghost" id="btn-levels" type="button">Уровни (10)</button>
        </div>
      </div>`;
    document.getElementById("btn-play").onclick = () => startLevel(0);
    document.getElementById("btn-levels").onclick = () => {
      state.screen = "levels";
      render();
    };
  }

  function renderLevels() {
    app.innerHTML = `
      <div class="screen">
        <div class="panel">
          <h1>Уровни</h1>
          <p>10 подъёмов по маленьким ступенькам. Цель — верхний этаж.</p>
          <div class="level-grid">
            ${LEVELS.map((lv) => {
              const open = lv.id <= unlock;
              const done = !!best[lv.id];
              return `<button class="level-btn ${open ? "open" : ""} ${done ? "done" : ""}" data-id="${lv.id}" ${open ? "" : "disabled"} type="button">${lv.id}</button>`;
            }).join("")}
          </div>
          <button class="btn ghost" id="btn-back" type="button">Назад</button>
        </div>
      </div>`;
    app.querySelectorAll(".level-btn").forEach((btn) => {
      btn.addEventListener("click", () => startLevel(Number(btn.dataset.id) - 1));
    });
    document.getElementById("btn-back").onclick = () => {
      state.screen = "menu";
      render();
    };
  }

  function renderPlay() {
    const lv = LEVELS[state.levelIndex];
    app.innerHTML = `
      <div class="screen">
        <div class="hud">
          <div>
            <div>Уровень ${lv.id}/10 — ${lv.name}</div>
            <div class="hint">${lv.hint}</div>
          </div>
          <div>
            <button class="btn ghost" id="btn-menu" type="button" style="pointer-events:auto;padding:0.4rem 0.9rem;font-size:0.85rem">Меню</button>
          </div>
        </div>
        <canvas id="game"></canvas>
        <div class="controls">
          <div class="pad">
            <button type="button" data-k="left">◀</button>
            <button type="button" data-k="right">▶</button>
          </div>
          <div class="actions">
            <button type="button" data-k="jump">⤒</button>
          </div>
        </div>
      </div>`;
    document.getElementById("btn-menu").onclick = () => {
      state.screen = "menu";
      render();
    };
    app.querySelectorAll(".controls button").forEach((btn) => {
      const k = btn.dataset.k;
      const set = (v) => {
        if (k === "left") touch.left = v;
        if (k === "right") touch.right = v;
        if (k === "jump") touch.jump = v;
      };
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        set(true);
      });
      btn.addEventListener("pointerup", () => set(false));
      btn.addEventListener("pointercancel", () => set(false));
    });
  }

  function render() {
    if (state.screen === "menu") renderMenu();
    else if (state.screen === "levels") renderLevels();
    else renderPlay();
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (state.screen === "play") {
      if (e.code === "KeyR") startLevel(state.levelIndex);
      if (e.code === "Escape") {
        state.screen = "menu";
        render();
      }
      if (e.code === "Enter" && state.won) {
        if (state.levelIndex < LEVELS.length - 1) startLevel(state.levelIndex + 1);
        else {
          state.screen = "menu";
          render();
        }
      }
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    paint();
    requestAnimationFrame(frame);
  }

  render();
  requestAnimationFrame(frame);

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if ((t === "heal" || t === "max") && state.player) {
      state.player.hp = 3;
      state.player.invuln = 2;
      state.dead = false;
      state.message = "💚 Хилл хозяина";
      state.messageCd = 1.5;
    }
    if (t === "unlock" || t === "max") unlock = LEVELS.length;
  });
})();
