(() => {
  const W = 960;
  const H = 640;
  const ROUND_SEC = 90;
  const ITEMS_NEEDED = 5;
  const CATCH_R = 28;
  const MERGE_R = 42;
  const HIDE_SPOT_R = 36;

  const app = document.getElementById("app");
  const screen = document.createElement("div");
  screen.className = "screen";
  app.appendChild(screen);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  screen.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.hidden = true;
  screen.appendChild(hud);

  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  screen.appendChild(toastEl);

  const touch = document.createElement("div");
  touch.className = "touch";
  touch.innerHTML = `
    <div class="pad left" id="stick"></div>
    <div class="pad right" id="actBtn">E<br>действие</div>
  `;
  touch.hidden = true;
  screen.appendChild(touch);

  const menu = document.createElement("div");
  menu.className = "panel";
  menu.innerHTML = `
    <h1>Укрытие</h1>
    <p class="sub">Искатели ищут предметы и прячущихся. Прячущиеся прячутся в укрытиях и сливаются с командой и ботами, чтобы раствориться в толпе.</p>
    <div class="roles">
      <button class="btn seeker" data-role="seeker">Искатель</button>
      <button class="btn hider" data-role="hider">Прячущийся</button>
    </div>
    <p class="hints">
      WASD / стрелки — ходьба · E — поймать / слиться / спрятаться<br>
      Искатели: собери ${ITEMS_NEEDED} предметов или поймай всех.<br>
      Прячущиеся: дождись таймера или слейся с командой.
    </p>
  `;
  screen.appendChild(menu);

  const endPanel = document.createElement("div");
  endPanel.className = "panel";
  endPanel.hidden = true;
  screen.appendChild(endPanel);

  let toastTimer = 0;
  function toast(msg, ms = 2200) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  // Map: walls as AABBs, hide spots as circles, items as points
  const walls = [
    { x: 0, y: 0, w: W, h: 24 },
    { x: 0, y: H - 24, w: W, h: 24 },
    { x: 0, y: 0, w: 24, h: H },
    { x: W - 24, y: 0, w: 24, h: H },
    // rooms / crates
    { x: 120, y: 100, w: 110, h: 70 },
    { x: 320, y: 80, w: 60, h: 140 },
    { x: 520, y: 120, w: 160, h: 50 },
    { x: 700, y: 80, w: 90, h: 90 },
    { x: 80, y: 280, w: 80, h: 160 },
    { x: 220, y: 320, w: 140, h: 50 },
    { x: 420, y: 260, w: 50, h: 180 },
    { x: 520, y: 340, w: 120, h: 70 },
    { x: 720, y: 280, w: 100, h: 140 },
    { x: 160, y: 480, w: 200, h: 50 },
    { x: 480, y: 500, w: 80, h: 70 },
    { x: 640, y: 470, w: 160, h: 45 },
  ];

  const hideSpots = [
    { x: 175, y: 200, r: HIDE_SPOT_R },
    { x: 350, y: 260, r: HIDE_SPOT_R },
    { x: 600, y: 210, r: HIDE_SPOT_R },
    { x: 745, y: 210, r: HIDE_SPOT_R },
    { x: 120, y: 470, r: HIDE_SPOT_R },
    { x: 300, y: 420, r: HIDE_SPOT_R },
    { x: 560, y: 450, r: HIDE_SPOT_R },
    { x: 770, y: 450, r: HIDE_SPOT_R },
    { x: 860, y: 320, r: HIDE_SPOT_R },
    { x: 450, y: 150, r: HIDE_SPOT_R },
  ];

  const itemSpawns = [
    [90, 60], [280, 60], [450, 60], [620, 70], [850, 60],
    [60, 200], [400, 200], [680, 200], [880, 180],
    [60, 400], [280, 400], [500, 400], [650, 380], [880, 400],
    [100, 560], [350, 560], [550, 560], [800, 560], [880, 560],
  ];

  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function circleRectHit(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }

  function resolveWalls(ent, r) {
    for (const w of walls) {
      if (!circleRectHit(ent.x, ent.y, r, w)) continue;
      const cx = w.x + w.w / 2;
      const cy = w.y + w.h / 2;
      const dx = ent.x - cx;
      const dy = ent.y - cy;
      const px = w.w / 2 + r;
      const py = w.h / 2 + r;
      if (Math.abs(dx) / px > Math.abs(dy) / py) {
        ent.x = cx + Math.sign(dx || 1) * px;
      } else {
        ent.y = cy + Math.sign(dy || 1) * py;
      }
    }
    ent.x = Math.max(r + 4, Math.min(W - r - 4, ent.x));
    ent.y = Math.max(r + 4, Math.min(H - r - 4, ent.y));
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pickFreeSpot(r = 16) {
    for (let i = 0; i < 40; i++) {
      const p = { x: rand(50, W - 50), y: rand(50, H - 50) };
      let ok = true;
      for (const w of walls) {
        if (circleRectHit(p.x, p.y, r + 4, w)) {
          ok = false;
          break;
        }
      }
      if (ok) return p;
    }
    return { x: W / 2, y: H / 2 };
  }

  const keys = Object.create(null);
  const stick = { x: 0, y: 0, active: false };
  let actionPulse = false;

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE" || e.code === "Space") {
      e.preventDefault();
      actionPulse = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  const stickEl = touch.querySelector("#stick");
  const actBtn = touch.querySelector("#actBtn");
  let stickId = null;

  stickEl.addEventListener("pointerdown", (e) => {
    stickId = e.pointerId;
    stickEl.setPointerCapture(e.pointerId);
    updateStick(e);
  });
  stickEl.addEventListener("pointermove", (e) => {
    if (e.pointerId === stickId) updateStick(e);
  });
  function endStick(e) {
    if (e.pointerId !== stickId) return;
    stickId = null;
    stick.x = 0;
    stick.y = 0;
    stick.active = false;
  }
  stickEl.addEventListener("pointerup", endStick);
  stickEl.addEventListener("pointercancel", endStick);

  function updateStick(e) {
    const rect = stickEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (e.clientX - cx) / (rect.width / 2);
    let dy = (e.clientY - cy) / (rect.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    stick.x = dx;
    stick.y = dy;
    stick.active = true;
  }

  actBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    actionPulse = true;
  });

  let state = "menu"; // menu | play | end
  let g = null;
  let last = 0;

  menu.querySelectorAll("[data-role]").forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.dataset.role));
  });

  function makeActor(role, team, isPlayer, x, y, name) {
    return {
      role,
      team,
      isPlayer,
      name,
      x,
      y,
      vx: 0,
      vy: 0,
      r: role === "seeker" ? 15 : 14,
      speed: role === "seeker" ? 175 : 155,
      caught: false,
      hidden: false,
      mergeId: null,
      mergeLeader: false,
      aiTimer: rand(0.4, 1.2),
      aiTx: x,
      aiTy: y,
      face: 1,
      bob: Math.random() * Math.PI * 2,
      color: role === "seeker" ? "#e85a3a" : team === "A" ? "#3db8a0" : "#5a9fd4",
    };
  }

  function startGame(playerRole) {
    const items = [];
    const used = new Set();
    while (items.length < ITEMS_NEEDED + 3) {
      const i = (Math.random() * itemSpawns.length) | 0;
      if (used.has(i)) continue;
      used.add(i);
      const [x, y] = itemSpawns[i];
      items.push({ x, y, taken: false, pulse: Math.random() * 6 });
    }

    const actors = [];
    const pSpot = pickFreeSpot();
    const player = makeActor(playerRole, playerRole === "hider" ? "A" : "S", true, pSpot.x, pSpot.y, "Ты");
    actors.push(player);

    // 2 seekers total looking for items
    const seekerCount = 2;
    let seekersMade = playerRole === "seeker" ? 1 : 0;
    while (seekersMade < seekerCount) {
      const s = pickFreeSpot();
      actors.push(makeActor("seeker", "S", false, s.x, s.y, "Искатель-бот"));
      seekersMade++;
    }

    // Hider team A: player (if hider) + bots that can merge
    const hidersA = playerRole === "hider" ? 3 : 4;
    let madeA = playerRole === "hider" ? 1 : 0;
    while (madeA < hidersA) {
      const s = pickFreeSpot();
      actors.push(makeActor("hider", "A", false, s.x, s.y, "Команда A"));
      madeA++;
    }

    // Extra crowd bots (team B) — look alike, merge targets for camouflage
    for (let i = 0; i < 5; i++) {
      const s = pickFreeSpot();
      actors.push(makeActor("hider", "B", false, s.x, s.y, "Толпа"));
    }

    g = {
      playerRole,
      player,
      actors,
      items,
      timeLeft: ROUND_SEC,
      itemsGot: 0,
      caughtCount: 0,
      win: null,
      msg: "",
      merges: new Map(), // id -> { leader, members[] }
      nextMerge: 1,
    };

    menu.hidden = true;
    endPanel.hidden = true;
    hud.hidden = false;
    touch.hidden = false;
    state = "play";
    toast(playerRole === "seeker"
      ? "Найди предметы и поймай прячущихся!"
      : "Прячься и сливайся с командой (E)!");
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function inputDir() {
    let x = stick.x;
    let y = stick.y;
    if (keys.KeyA || keys.ArrowLeft) x -= 1;
    if (keys.KeyD || keys.ArrowRight) x += 1;
    if (keys.KeyW || keys.ArrowUp) y -= 1;
    if (keys.KeyS || keys.ArrowDown) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1e-6) {
      x /= len;
      y /= len;
    } else {
      x = 0;
      y = 0;
    }
    return { x, y };
  }

  function nearestSpot(ent) {
    let best = null;
    let bd = 1e9;
    for (const s of hideSpots) {
      const d = dist(ent, s);
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    return { spot: best, d: bd };
  }

  function teammatesNear(ent, radius) {
    return g.actors.filter(
      (a) =>
        a !== ent &&
        !a.caught &&
        a.role === "hider" &&
        (a.team === ent.team || a.team === "B" || ent.team === "B") &&
        dist(a, ent) < radius
    );
  }

  function getMergeGroup(ent) {
    if (!ent.mergeId) return null;
    return g.merges.get(ent.mergeId) || null;
  }

  function breakMerge(ent) {
    const m = getMergeGroup(ent);
    if (!m) return;
    for (const mem of m.members) {
      mem.mergeId = null;
      mem.mergeLeader = false;
    }
    g.merges.delete(m.id);
  }

  function doMerge(leader) {
    if (leader.role !== "hider" || leader.caught) return;
    const near = teammatesNear(leader, MERGE_R);
    if (!near.length) {
      toast("Рядом нет команды для слияния");
      return;
    }
    if (leader.mergeId) {
      breakMerge(leader);
      toast("Слияние разорвано");
      return;
    }
    const members = [leader, ...near.filter((a) => !a.mergeId)].slice(0, 5);
    if (members.length < 2) {
      toast("Нужен хотя бы один рядом");
      return;
    }
    const id = g.nextMerge++;
    for (const m of members) {
      m.mergeId = id;
      m.mergeLeader = m === leader;
      m.hidden = false;
    }
    g.merges.set(id, { id, leader, members });
    toast("Слились с командой — искателям труднее заметить!");
  }

  function doHide(ent) {
    const { spot, d } = nearestSpot(ent);
    if (!spot || d > spot.r) {
      toast("Подойди ближе к укрытию");
      return;
    }
    if (ent.mergeId) breakMerge(ent);
    ent.hidden = !ent.hidden;
    if (ent.hidden) {
      ent.x = spot.x;
      ent.y = spot.y;
      toast("Ты в укрытии");
    } else {
      toast("Вышел из укрытия");
    }
  }

  function tryCatch(seeker) {
    let best = null;
    let bd = CATCH_R + 8;
    for (const a of g.actors) {
      if (a.role !== "hider" || a.caught) continue;
      let effectiveR = CATCH_R;
      if (a.hidden) effectiveR *= 0.55;
      if (a.mergeId) effectiveR *= 0.62;
      const d = dist(seeker, a);
      if (d < effectiveR && d < bd) {
        bd = d;
        best = a;
      }
    }
    if (!best) {
      if (seeker.isPlayer) toast("Рядом никого нет");
      return;
    }
    // Merged groups: must catch the whole cluster by hitting any member closely
    if (best.mergeId) {
      const m = g.merges.get(best.mergeId);
      if (m) {
        for (const mem of m.members) {
          if (!mem.caught) {
            mem.caught = true;
            mem.hidden = false;
            mem.mergeId = null;
            g.caughtCount++;
          }
        }
        g.merges.delete(m.id);
        toast("Поймана вся слитая группа!");
        return;
      }
    }
    best.caught = true;
    best.hidden = false;
    g.caughtCount++;
    toast(best.isPlayer ? "Тебя поймали!" : `Пойман: ${best.name}`);
  }

  function tryPickup(seeker) {
    for (const it of g.items) {
      if (it.taken) continue;
      if (dist(seeker, it) < 26) {
        it.taken = true;
        g.itemsGot++;
        toast(`Предмет ${g.itemsGot}/${ITEMS_NEEDED}`);
        return true;
      }
    }
    return false;
  }

  function playerAction() {
    const p = g.player;
    if (p.caught) return;
    if (p.role === "seeker") {
      if (!tryPickup(p)) tryCatch(p);
    } else {
      const nearTeam = teammatesNear(p, MERGE_R);
      const { d } = nearestSpot(p);
      if (nearTeam.length && d > HIDE_SPOT_R) doMerge(p);
      else if (d <= HIDE_SPOT_R) doHide(p);
      else if (nearTeam.length) doMerge(p);
      else toast("Укрытие или команда рядом — тогда E");
    }
  }

  function moveEntity(ent, dx, dy, dt) {
    if (ent.caught) return;
    if (ent.hidden && ent.role === "hider") {
      ent.vx = 0;
      ent.vy = 0;
      return;
    }
    // Follow merge leader
    if (ent.mergeId && !ent.mergeLeader) {
      const m = getMergeGroup(ent);
      if (m && m.leader && !m.leader.caught) {
        const idx = m.members.indexOf(ent);
        const ang = (idx / Math.max(1, m.members.length)) * Math.PI * 2;
        const tx = m.leader.x + Math.cos(ang) * 18;
        const ty = m.leader.y + Math.sin(ang) * 18;
        dx = tx - ent.x;
        dy = ty - ent.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        if (dist(ent, m.leader) < 10) {
          dx = 0;
          dy = 0;
        }
      }
    }
    const sp = ent.speed * (ent.mergeId && ent.mergeLeader ? 0.85 : 1);
    ent.vx = dx * sp;
    ent.vy = dy * sp;
    ent.x += ent.vx * dt;
    ent.y += ent.vy * dt;
    if (Math.abs(dx) > 0.1) ent.face = dx > 0 ? 1 : -1;
    resolveWalls(ent, ent.r);
  }

  function updateAI(ent, dt) {
    if (ent.isPlayer || ent.caught) return;
    if (ent.mergeId && !ent.mergeLeader) return;

    ent.aiTimer -= dt;
    if (ent.aiTimer <= 0) {
      ent.aiTimer = rand(0.8, 2.2);
      if (ent.role === "seeker") {
        // Hunt items or nearest visible hider
        let target = null;
        let best = 1e9;
        for (const it of g.items) {
          if (it.taken) continue;
          const d = dist(ent, it);
          if (d < best) {
            best = d;
            target = it;
          }
        }
        for (const a of g.actors) {
          if (a.role !== "hider" || a.caught) continue;
          let vis = true;
          if (a.hidden && Math.random() > 0.15) vis = false;
          if (a.mergeId && Math.random() > 0.35) vis = false;
          if (!vis) continue;
          const d = dist(ent, a);
          if (d < best) {
            best = d;
            target = a;
          }
        }
        if (target) {
          ent.aiTx = target.x + rand(-20, 20);
          ent.aiTy = target.y + rand(-20, 20);
        } else {
          const p = pickFreeSpot();
          ent.aiTx = p.x;
          ent.aiTy = p.y;
        }
      } else {
        // Hider: go to hide spot or wander near team
        if (Math.random() < 0.45) {
          const s = hideSpots[(Math.random() * hideSpots.length) | 0];
          ent.aiTx = s.x + rand(-10, 10);
          ent.aiTy = s.y + rand(-10, 10);
        } else {
          const mates = g.actors.filter((a) => a.role === "hider" && a.team === ent.team && a !== ent);
          if (mates.length) {
            const m = mates[(Math.random() * mates.length) | 0];
            ent.aiTx = m.x + rand(-40, 40);
            ent.aiTy = m.y + rand(-40, 40);
          } else {
            const p = pickFreeSpot();
            ent.aiTx = p.x;
            ent.aiTy = p.y;
          }
        }
      }
    }

    let dx = ent.aiTx - ent.x;
    let dy = ent.aiTy - ent.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len < 12) {
      dx = 0;
      dy = 0;
      if (ent.role === "hider") {
        const { spot, d } = nearestSpot(ent);
        if (spot && d < spot.r && Math.random() < 0.02) {
          ent.hidden = true;
          ent.x = spot.x;
          ent.y = spot.y;
        }
        // bots sometimes merge
        if (!ent.mergeId && Math.random() < 0.008) {
          const near = teammatesNear(ent, MERGE_R);
          if (near.length >= 1) {
            const leader = ent;
            const members = [leader, ...near.filter((a) => !a.mergeId)].slice(0, 4);
            if (members.length >= 2) {
              const id = g.nextMerge++;
              for (const m of members) {
                m.mergeId = id;
                m.mergeLeader = m === leader;
                m.hidden = false;
              }
              g.merges.set(id, { id, leader, members });
            }
          }
        }
      } else {
        tryPickup(ent);
        if (Math.random() < 0.04) tryCatch(ent);
      }
    } else {
      dx /= len;
      dy /= len;
      if (ent.hidden) ent.hidden = false;
    }
    moveEntity(ent, dx, dy, dt);
  }

  function checkEnd() {
    const hiders = g.actors.filter((a) => a.role === "hider" && a.team === "A");
    const alive = hiders.filter((a) => !a.caught);
    if (g.itemsGot >= ITEMS_NEEDED) {
      g.win = "seeker";
      g.msg = "Искатели собрали все предметы!";
      return true;
    }
    if (alive.length === 0) {
      g.win = "seeker";
      g.msg = "Все прячущиеся из команды пойманы!";
      return true;
    }
    if (g.timeLeft <= 0) {
      g.win = "hider";
      g.msg = "Время вышло — прячущиеся победили!";
      return true;
    }
    if (g.player.role === "hider" && g.player.caught) {
      // player lost but round can continue briefly — end when caught
      g.win = "seeker";
      g.msg = "Тебя нашли! Искатели победили.";
      return true;
    }
    return false;
  }

  function finish() {
    state = "end";
    hud.hidden = true;
    touch.hidden = true;
    const youWin =
      (g.playerRole === "seeker" && g.win === "seeker") ||
      (g.playerRole === "hider" && g.win === "hider");
    endPanel.hidden = false;
    endPanel.innerHTML = `
      <h1>${youWin ? "Победа!" : "Поражение"}</h1>
      <p class="sub">${g.msg}</p>
      <p class="sub">Предметы: ${g.itemsGot}/${ITEMS_NEEDED} · Поймано: ${g.caughtCount}</p>
      <div class="roles">
        <button class="btn again" id="again">Ещё раз</button>
        <button class="btn ghost" id="tomenu">В меню</button>
      </div>
    `;
    endPanel.querySelector("#again").onclick = () => startGame(g.playerRole);
    endPanel.querySelector("#tomenu").onclick = () => {
      endPanel.hidden = true;
      menu.hidden = false;
      state = "menu";
    };
  }

  function update(dt) {
    g.timeLeft = Math.max(0, g.timeLeft - dt);

    if (actionPulse) {
      actionPulse = false;
      playerAction();
    }

    const dir = inputDir();
    if (!g.player.caught) {
      if (g.player.hidden && (dir.x || dir.y)) g.player.hidden = false;
      moveEntity(g.player, dir.x, dir.y, dt);
    }

    for (const a of g.actors) {
      a.bob += dt * 4;
      updateAI(a, dt);
    }

    // Seekers auto-pickup when walking over
    for (const a of g.actors) {
      if (a.role === "seeker" && !a.caught) tryPickup(a);
    }

    if (checkEnd()) finish();
    updateHud();
  }

  function updateHud() {
    const role = g.playerRole === "seeker" ? "Искатель" : "Прячущийся";
    const t = Math.ceil(g.timeLeft);
    hud.innerHTML = `
      <span class="pill">${role}</span>
      <span class="pill">⏱ ${t}с</span>
      <span class="pill">◎ ${g.itemsGot}/${ITEMS_NEEDED}</span>
      <span class="pill">Поймано ${g.caughtCount}</span>
    `;
  }

  function drawMap() {
    // floor
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, "#1a2c24");
    grd.addColorStop(1, "#152018");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // hide spots
    for (const s of hideSpots) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(61,184,160,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(61,184,160,0.35)";
      ctx.stroke();
      ctx.fillStyle = "rgba(200,255,230,0.35)";
      ctx.font = "600 11px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("укрытие", s.x, s.y + 4);
    }

    // walls
    for (const w of walls) {
      ctx.fillStyle = "#2a3d34";
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = "#3d5548";
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }

    // items
    for (const it of g.items) {
      if (it.taken) continue;
      it.pulse += 0.08;
      const s = 8 + Math.sin(it.pulse) * 2;
      ctx.beginPath();
      ctx.arc(it.x, it.y, s, 0, Math.PI * 2);
      ctx.fillStyle = "#f0d060";
      ctx.fill();
      ctx.strokeStyle = "#fff3a8";
      ctx.stroke();
      ctx.fillStyle = "#3a2a00";
      ctx.font = "700 10px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("?", it.x, it.y + 3);
    }
  }

  function drawActor(a) {
    if (a.caught) {
      ctx.globalAlpha = 0.35;
    } else if (a.hidden) {
      // Seekers barely see hidden; hiders see own team better
      if (g.playerRole === "seeker" && !a.isPlayer) ctx.globalAlpha = 0.18;
      else ctx.globalAlpha = a.isPlayer || a.team === g.player.team ? 0.55 : 0.2;
    } else if (a.mergeId && g.playerRole === "seeker" && a.role === "hider") {
      ctx.globalAlpha = 0.72;
    } else {
      ctx.globalAlpha = 1;
    }

    const bounce = Math.sin(a.bob) * (a.hidden ? 0 : 2);
    const x = a.x;
    const y = a.y + bounce;

    // merge ring
    if (a.mergeId) {
      ctx.beginPath();
      ctx.arc(x, y, a.r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(126,200,255,0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // body
    ctx.beginPath();
    ctx.arc(x, y, a.r, 0, Math.PI * 2);
    ctx.fillStyle = a.color;
    ctx.fill();
    if (a.isPlayer) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // face mark
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(x + a.face * 4, y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // role badge
    ctx.fillStyle = "#fff";
    ctx.font = "700 9px Outfit, sans-serif";
    ctx.textAlign = "center";
    const label = a.role === "seeker" ? "И" : a.mergeId ? "◎" : "П";
    ctx.fillText(label, x, y + a.r + 11);

    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }

  function draw() {
    drawMap();
    // draw non-players first
    const sorted = [...g.actors].sort((a, b) => a.y - b.y);
    for (const a of sorted) drawActor(a);

    // prompt near player
    const p = g.player;
    if (!p.caught) {
      let tip = "";
      if (p.role === "seeker") {
        const nearItem = g.items.some((it) => !it.taken && dist(p, it) < 30);
        tip = nearItem ? "E — взять предмет" : "E — поймать";
      } else {
        const { d } = nearestSpot(p);
        const near = teammatesNear(p, MERGE_R).length;
        if (d <= HIDE_SPOT_R) tip = p.hidden ? "E — выйти" : "E — спрятаться";
        else if (near) tip = p.mergeId ? "E — выйти из слияния" : "E — слиться с командой";
      }
      if (tip) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.font = "600 13px Outfit, sans-serif";
        const tw = ctx.measureText(tip).width;
        ctx.fillRect(p.x - tw / 2 - 8, p.y - 42, tw + 16, 22);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(tip, p.x, p.y - 27);
      }
    }
  }

  function loop(now) {
    if (state !== "play") return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    if (state === "play") requestAnimationFrame(loop);
  }
})();
