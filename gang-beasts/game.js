(() => {
  const { Engine, World, Bodies, Body, Constraint, Composite } = Matter;

  const COLORS = [
    { id: "lime", name: "Лайм", color: "#7CFC00", shade: "#4cae00", blush: "#c8ff7a" },
    { id: "pink", name: "Розовый", color: "#FF69B4", shade: "#d4488e", blush: "#ffb6d9" },
    { id: "cyan", name: "Бирюза", color: "#22d3ee", shade: "#0891b2", blush: "#a5f3fc" },
    { id: "yellow", name: "Жёлтый", color: "#fde047", shade: "#ca8a04", blush: "#fef9c3" },
    { id: "red", name: "Красный", color: "#ef4444", shade: "#b91c1c", blush: "#fca5a5" },
    { id: "blue", name: "Синий", color: "#3b82f6", shade: "#1d4ed8", blush: "#93c5fd" },
    { id: "orange", name: "Оранж", color: "#fb923c", shade: "#c2410c", blush: "#fdba74" },
    { id: "purple", name: "Фиолет", color: "#a855f7", shade: "#7e22ce", blush: "#d8b4fe" },
    { id: "mint", name: "Мята", color: "#34d399", shade: "#059669", blush: "#a7f3d0" },
    { id: "coral", name: "Коралл", color: "#fb7185", shade: "#e11d48", blush: "#fecdd3" },
    { id: "sky", name: "Небо", color: "#38bdf8", shade: "#0284c7", blush: "#bae6fd" },
    { id: "lemon", name: "Лимон", color: "#facc15", shade: "#a16207", blush: "#fef08a" },
    { id: "grape", name: "Виноград", color: "#8b5cf6", shade: "#5b21b6", blush: "#c4b5fd" },
    { id: "teal", name: "Тиль", color: "#14b8a6", shade: "#0f766e", blush: "#99f6e4" },
    { id: "magenta", name: "Маджента", color: "#e879f9", shade: "#a21caf", blush: "#f5d0fe" },
    { id: "amber", name: "Янтарь", color: "#f59e0b", shade: "#b45309", blush: "#fcd34d" },
    { id: "indigo", name: "Индиго", color: "#6366f1", shade: "#3730a3", blush: "#a5b4fc" },
    { id: "jade", name: "Нефрит", color: "#10b981", shade: "#047857", blush: "#6ee7b7" },
    { id: "salmon", name: "Лосось", color: "#fdba74", shade: "#ea580c", blush: "#ffedd5" },
    { id: "ice", name: "Лёд", color: "#e0f2fe", shade: "#7dd3fc", blush: "#ffffff" },
  ];

  const SLOTS = [
    {
      name: "Игрок 1",
      keys: { left: "KeyA", right: "KeyD", jump: "KeyW", punch: "KeyF", kick: "KeyG", grab: "KeyE" },
      label: "A/D · W прыжок · F удар · G пинок · E захват",
    },
    {
      name: "Игрок 2",
      keys: { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", punch: "KeyK", kick: "KeyL", grab: "KeyJ" },
      label: "←/→ · ↑ прыжок · K удар · L пинок · J захват",
    },
    {
      name: "Игрок 3",
      keys: { left: "KeyF", right: "KeyH", jump: "KeyT", punch: "KeyY", kick: "KeyU", grab: "KeyR" },
      label: "F/H · T прыжок · Y удар · U пинок · R захват",
      // Conflict with P1 F - use different for 3 when 3+ players
      keysAlt: { left: "Comma", right: "Period", jump: "KeyP", punch: "BracketLeft", kick: "BracketRight", grab: "Quote" },
      labelAlt: ",/. · P прыжок · [ удар · ] пинок · ' захват",
    },
    {
      name: "Игрок 4",
      keys: { left: "Numpad4", right: "Numpad6", jump: "Numpad8", punch: "Numpad1", kick: "Numpad2", grab: "Numpad0" },
      label: "Num 4/6 · 8 прыжок · 1 удар · 2 пинок · 0 захват",
    },
  ];

  // Fix P3 keys to not conflict with P1
  SLOTS[2].keys = SLOTS[2].keysAlt;
  SLOTS[2].label = SLOTS[2].labelAlt;

  const ARENAS = [
    {
      id: "scaffold",
      name: "Леса",
      desc: "Платформы высоко — упади вниз и выбыл",
      build(W, H, world) {
        const floorY = H - 70;
        const plats = [
          Bodies.rectangle(W * 0.5, floorY, W * 0.72, 28, { isStatic: true, friction: 0.9, label: "ground" }),
          Bodies.rectangle(W * 0.22, floorY - 130, 180, 22, { isStatic: true, friction: 0.9 }),
          Bodies.rectangle(W * 0.78, floorY - 130, 180, 22, { isStatic: true, friction: 0.9 }),
          Bodies.rectangle(W * 0.5, floorY - 250, 160, 22, { isStatic: true, friction: 0.9 }),
        ];
        World.add(world, plats);
        return {
          spawns: [
            { x: W * 0.3, y: floorY - 60 },
            { x: W * 0.7, y: floorY - 60 },
            { x: W * 0.22, y: floorY - 180 },
            { x: W * 0.78, y: floorY - 180 },
          ],
          hazards: [
            { type: "saw", x: W * 0.5, y: floorY - 18, r: 28 },
          ],
          killY: H + 40,
          drawExtra(ctx, t) {
            ctx.fillStyle = "#3a3340";
            for (const p of plats) {
              const { x, y } = p.position;
              const b = p.bounds;
              ctx.fillRect(b.min.x, b.min.y, b.max.x - b.min.x, b.max.y - b.min.y);
            }
            const saw = this.hazards[0];
            ctx.save();
            ctx.translate(saw.x, saw.y);
            ctx.rotate(t * 6);
            ctx.fillStyle = "#cbd5e1";
            ctx.beginPath();
            for (let i = 0; i < 12; i++) {
              const a = (i / 12) * Math.PI * 2;
              ctx.lineTo(Math.cos(a) * saw.r, Math.sin(a) * saw.r);
              ctx.lineTo(Math.cos(a + 0.15) * (saw.r * 0.55), Math.sin(a + 0.15) * (saw.r * 0.55));
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          },
        };
      },
    },
    {
      id: "truck",
      name: "Грузовик",
      desc: "Узкая платформа — спихни всех",
      build(W, H, world) {
        const y = H * 0.62;
        const bed = Bodies.rectangle(W * 0.5, y, W * 0.55, 36, { isStatic: true, friction: 1, label: "ground" });
        const cab = Bodies.rectangle(W * 0.22, y - 40, 90, 70, { isStatic: true, friction: 0.8 });
        World.add(world, [bed, cab]);
        return {
          spawns: [
            { x: W * 0.4, y: y - 50 },
            { x: W * 0.55, y: y - 50 },
            { x: W * 0.48, y: y - 50 },
            { x: W * 0.62, y: y - 50 },
          ],
          hazards: [{ type: "pit", y: H - 20 }],
          killY: H - 10,
          drawExtra(ctx) {
            ctx.fillStyle = "#b45309";
            const bb = bed.bounds;
            ctx.fillRect(bb.min.x, bb.min.y, bb.max.x - bb.min.x, bb.max.y - bb.min.y);
            ctx.fillStyle = "#1d4ed8";
            const cb = cab.bounds;
            ctx.fillRect(cb.min.x, cb.min.y, cb.max.x - cb.min.x, cb.max.y - cb.min.y);
            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(W * 0.35, y + 28, 22, 0, Math.PI * 2);
            ctx.arc(W * 0.65, y + 28, 22, 0, Math.PI * 2);
            ctx.fill();
          },
        };
      },
    },
    {
      id: "fan",
      name: "Вентилятор",
      desc: "Центр засасывает — держись за край",
      build(W, H, world) {
        const y = H - 90;
        const left = Bodies.rectangle(W * 0.22, y, 200, 26, { isStatic: true, friction: 0.95 });
        const right = Bodies.rectangle(W * 0.78, y, 200, 26, { isStatic: true, friction: 0.95 });
        World.add(world, [left, right]);
        return {
          spawns: [
            { x: W * 0.18, y: y - 50 },
            { x: W * 0.82, y: y - 50 },
            { x: W * 0.28, y: y - 50 },
            { x: W * 0.72, y: y - 50 },
          ],
          hazards: [{ type: "fan", x: W * 0.5, y: y + 10, r: 50 }],
          killY: H + 30,
          pull(players, dt) {
            for (const p of players) {
              if (!p.alive || p.out) continue;
              const dx = W * 0.5 - p.torso.position.x;
              const dy = y + 40 - p.torso.position.y;
              const d = Math.hypot(dx, dy) || 1;
              if (d < 220) {
                Body.applyForce(p.torso, p.torso.position, {
                  x: (dx / d) * 0.0011 * dt * 60,
                  y: (dy / d) * 0.0014 * dt * 60,
                });
              }
            }
          },
          drawExtra(ctx, t) {
            ctx.fillStyle = "#4b5563";
            for (const b of [left, right]) {
              const bb = b.bounds;
              ctx.fillRect(bb.min.x, bb.min.y, bb.max.x - bb.min.x, bb.max.y - bb.min.y);
            }
            ctx.save();
            ctx.translate(W * 0.5, y + 10);
            ctx.rotate(t * 8);
            ctx.fillStyle = "#94a3b8";
            for (let i = 0; i < 4; i++) {
              ctx.rotate(Math.PI / 2);
              ctx.beginPath();
              ctx.ellipse(0, -28, 10, 32, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          },
        };
      },
    },
  ];

  const app = document.getElementById("app");
  const keys = Object.create(null);
  let playerCount = 2;
  let arenaId = "scaffold";
  let matchModeId = "vs1";
  let selected = [0, 1, 2, 3];
  let mode = "lobby";
  let matchKind = "bots"; // ffa | bots
  let engine = null;
  let world = null;
  let canvas = null;
  let ctx = null;
  let players = [];
  let arena = null;
  let raf = 0;
  let lastTs = 0;
  let ended = false;
  let toast = "";
  let toastT = 0;
  let matchAge = 0;
  let W = 800;
  let H = 500;

  const MATCH_MODES = [
    {
      id: "vs1",
      name: "1 на 1 с ботом",
      desc: "Ты против одного бота",
      kind: "bots",
      lineup: [
        { human: true, team: 0 },
        { bot: true, team: 1 },
      ],
    },
    {
      id: "ally1",
      name: "Я+бот vs бот",
      desc: "Один бот в твоей команде, один у врага",
      kind: "bots",
      lineup: [
        { human: true, team: 0 },
        { bot: true, team: 0 },
        { bot: true, team: 1 },
      ],
    },
    {
      id: "vs2",
      name: "Я vs 2 бота",
      desc: "Два бота против тебя",
      kind: "bots",
      lineup: [
        { human: true, team: 0 },
        { bot: true, team: 1 },
        { bot: true, team: 1 },
      ],
    },
    {
      id: "2v2",
      name: "Я+бот vs 2 бота",
      desc: "Ты и бот против двух ботов",
      kind: "bots",
      lineup: [
        { human: true, team: 0 },
        { bot: true, team: 0 },
        { bot: true, team: 1 },
        { bot: true, team: 1 },
      ],
    },
    {
      id: "ffa",
      name: "Люди 2–4",
      desc: "Все против всех без ботов",
      kind: "ffa",
      lineup: null,
    },
  ];

  function toastMsg(m, s = 2) {
    toast = m;
    toastT = s;
  }

  function currentMode() {
    return MATCH_MODES.find((m) => m.id === matchModeId) || MATCH_MODES[0];
  }

  function showLobby() {
    mode = "lobby";
    stopLoop();
    clearWorld();
    const m0 = currentMode();
    app.innerHTML = `
      <div class="screen">
        <h1>Пластилиновая драка</h1>
        <p class="lead">Как <strong>Gang Beasts</strong>: удары, пинок, захват, нокаут. Есть режимы с ботами — 1 на 1 и командные.</p>
        <div class="row mode-pick" id="pick-mode">
          ${MATCH_MODES.map(
            (m) =>
              `<button type="button" data-mode="${m.id}" class="${m.id === matchModeId ? "active" : ""}">${m.name}</button>`
          ).join("")}
        </div>
        <p class="lead" id="mode-desc" style="margin-top:-0.35rem">${m0.desc}</p>
        <div class="row" id="pick-n" style="${m0.kind === "ffa" ? "" : "display:none"}">
          <button type="button" data-n="2" class="active">2 игрока</button>
          <button type="button" data-n="3">3 игрока</button>
          <button type="button" data-n="4">4 игрока</button>
        </div>
        <div class="row arena-pick" id="pick-a">
          ${ARENAS.map((a, i) => `<button type="button" data-a="${a.id}" class="${a.id === arenaId ? "active" : ""}">${a.name}</button>`).join("")}
        </div>
        <p class="lead" id="arena-desc" style="margin-top:-0.4rem">${(ARENAS.find((a) => a.id === arenaId) || ARENAS[0]).desc}</p>
        <div class="char-setup" id="chars"></div>
        <div class="hints" id="hints"></div>
        <button type="button" class="btn-go" id="go">Начать драку</button>
      </div>
    `;

    const render = () => {
      const md = currentMode();
      const n = md.kind === "ffa" ? playerCount : md.lineup.length;
      const lines = [];
      if (md.kind === "ffa") {
        lines.push(
          ...SLOTS.slice(0, n).map((s, i) => `<div><strong>${i + 1}. ${s.name}:</strong> ${s.label}</div>`)
        );
      } else {
        lines.push(`<div><strong>Ты (команда А):</strong> ${SLOTS[0].label}</div>`);
        md.lineup.forEach((slot, i) => {
          if (slot.human) return;
          const team = slot.team === 0 ? "А (твой)" : "Б (враг)";
          lines.push(`<div><strong>Бот ${i}:</strong> команда ${team}</div>`);
        });
      }
      app.querySelector("#hints").innerHTML = lines.join("");
      app.querySelector("#chars").innerHTML = Array.from({ length: n }, (_, si) => {
        const cur = selected[si] % COLORS.length;
        const mdSlot = md.kind === "bots" ? md.lineup[si] : { human: true, team: si };
        const who = mdSlot.human ? "Ты" : "Бот";
        const teamTxt = md.kind === "bots" ? ` · ком. ${mdSlot.team === 0 ? "А" : "Б"}` : "";
        return `<div class="char-row"><span class="char-slot" style="color:${COLORS[cur].color}">${who}${teamTxt}</span>
          <div class="char-grid">${COLORS.map(
            (c, ci) =>
              `<button type="button" class="char-btn${ci === cur ? " active" : ""}" data-slot="${si}" data-char="${ci}" style="--c:${c.color};--s:${c.shade}" title="${c.name}"><span class="preview"></span></button>`
          ).join("")}</div></div>`;
      }).join("");
    };

    render();
    app.querySelector("#pick-mode").onclick = (e) => {
      const b = e.target.closest("button[data-mode]");
      if (!b) return;
      matchModeId = b.dataset.mode;
      app.querySelectorAll("#pick-mode button").forEach((x) => x.classList.toggle("active", x === b));
      const md = currentMode();
      app.querySelector("#mode-desc").textContent = md.desc;
      app.querySelector("#pick-n").style.display = md.kind === "ffa" ? "" : "none";
      render();
    };
    app.querySelector("#pick-n").onclick = (e) => {
      const b = e.target.closest("button[data-n]");
      if (!b) return;
      playerCount = +b.dataset.n;
      app.querySelectorAll("#pick-n button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    };
    app.querySelector("#pick-a").onclick = (e) => {
      const b = e.target.closest("button[data-a]");
      if (!b) return;
      arenaId = b.dataset.a;
      app.querySelectorAll("#pick-a button").forEach((x) => x.classList.toggle("active", x === b));
      app.querySelector("#arena-desc").textContent = ARENAS.find((a) => a.id === arenaId).desc;
    };
    app.querySelector("#chars").onclick = (e) => {
      const b = e.target.closest("button[data-char]");
      if (!b) return;
      selected[+b.dataset.slot] = +b.dataset.char;
      render();
    };
    app.querySelector("#go").onclick = () => startMatch();
  }

  function clearWorld() {
    if (engine) {
      Engine.clear(engine);
      engine = null;
      world = null;
    }
    players = [];
    arena = null;
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function makeFighter(x, y, color, i) {
    const torso = Bodies.circle(x, y, 16, {
      density: 0.0035,
      friction: 0.4,
      frictionAir: 0.02,
      restitution: 0.2,
      label: `torso-${i}`,
    });
    const head = Bodies.circle(x, y - 24, 13, {
      density: 0.002,
      friction: 0.3,
      frictionAir: 0.02,
      restitution: 0.25,
      label: `head-${i}`,
    });
    const neck = Constraint.create({
      bodyA: torso,
      bodyB: head,
      length: 22,
      stiffness: 0.45,
      damping: 0.05,
    });
    World.add(world, [torso, head, neck]);
    return { torso, head, neck };
  }

  function startMatch() {
    mode = "play";
    ended = false;
    matchAge = 0;
    clearWorld();

    const md = currentMode();
    matchKind = md.kind;

    app.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <div class="hud">
        <div class="hud-top" id="scores"></div>
        <div class="toast" id="toast"></div>
        <div class="hud-actions">
          <button type="button" id="again">Заново</button>
          <button type="button" id="menu">Меню</button>
        </div>
      </div>
      <div class="overlay hidden" id="end">
        <div class="overlay-card">
          <h2>Конец раунда</h2>
          <p id="end-txt"></p>
          <button type="button" id="end-again">Ещё раз</button>
          <button type="button" class="ghost" id="end-menu">Меню</button>
        </div>
      </div>
    `;

    canvas = app.querySelector("#game-canvas");
    ctx = canvas.getContext("2d");
    resize();

    engine = Engine.create();
    engine.gravity.y = 1.05;
    world = engine.world;

    const def = ARENAS.find((a) => a.id === arenaId) || ARENAS[0];
    arena = def.build(W, H, world);

    const lineup =
      md.kind === "ffa"
        ? Array.from({ length: playerCount }, (_, i) => ({ human: true, team: i, slotIndex: i }))
        : md.lineup.map((s, i) => ({ ...s, slotIndex: i }));

    players = lineup.map((entry, i) => {
      const col = COLORS[selected[i] % COLORS.length];
      const sp = arena.spawns[i] || arena.spawns[0];
      const parts = makeFighter(sp.x + (entry.team === 1 ? 20 : -20), sp.y, col, i);
      const isBot = !!entry.bot;
      const humanSlot = md.kind === "ffa" ? SLOTS[i] : SLOTS[0];
      return {
        i,
        slot: isBot ? { name: `Бот ${i}`, keys: SLOTS[0].keys } : humanSlot,
        col,
        ...parts,
        team: entry.team,
        isBot,
        facing: entry.team === 0 ? 1 : -1,
        alive: true,
        out: false,
        koT: 0,
        punchCd: 0,
        kickCd: 0,
        grab: null,
        grabHeld: false,
        punchHeld: false,
        kickHeld: false,
        jumpHeld: false,
        onGround: false,
        botTimer: 0,
        botAction: 0,
        grabHeldTime: 0,
      };
    });

    updateHud();
    toastMsg(md.kind === "bots" ? "Боты в бою! Команда А против команды Б" : "Все против всех!");
    app.querySelector("#again").onclick = () => startMatch();
    app.querySelector("#menu").onclick = showLobby;
    app.querySelector("#end-again").onclick = () => startMatch();
    app.querySelector("#end-menu").onclick = showLobby;

    lastTs = performance.now();
    loop(lastTs);
  }

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = app.clientWidth;
    H = app.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function isEnemy(a, b) {
    if (!a || !b || a === b || a.out || b.out) return false;
    if (matchKind === "ffa") return true;
    return a.team !== b.team;
  }

  function enemiesOf(p) {
    return players.filter((o) => isEnemy(p, o));
  }

  function updateHud() {
    const el = app.querySelector("#scores");
    if (!el) return;
    el.innerHTML = players
      .map((p) => {
        let st = "";
        if (p.out) st = " · выбыл";
        else if (p.koT > 0) st = ` · нокаут ${p.koT.toFixed(1)}с`;
        const tag =
          matchKind === "bots"
            ? `<span class="team-tag">${p.isBot ? "бот" : "ты"} · ${p.team === 0 ? "А" : "Б"}</span>`
            : "";
        return `<div class="pill${p.out ? " out" : ""}${p.koT > 0 ? " ko" : ""}" style="border-color:${p.col.color}">
          <span class="swatch" style="background:linear-gradient(180deg,${p.col.color},${p.col.shade})"></span>
          ${p.col.name}${st} ${tag}
        </div>`;
      })
      .join("");
    const t = app.querySelector("#toast");
    if (t) {
      t.textContent = toastT > 0 ? toast : "";
      t.classList.toggle("show", toastT > 0);
    }
  }

  function grounded(p) {
    const y = p.torso.position.y;
    const bodies = Composite.allBodies(world).filter((b) => b.isStatic);
    for (const b of bodies) {
      if (y < b.bounds.min.y - 2 && y > b.bounds.min.y - 28) {
        if (p.torso.position.x > b.bounds.min.x - 10 && p.torso.position.x < b.bounds.max.x + 10) {
          if (Math.abs(p.torso.velocity.y) < 4 || p.torso.velocity.y > 0) return true;
        }
      }
    }
    return false;
  }

  function releaseGrab(p) {
    if (p.grab) {
      World.remove(world, p.grab.constraint);
      p.grab = null;
    }
  }

  function tryGrab(p) {
    if (p.koT > 0 || p.out) return;
    let best = null;
    let bestD = 48;
    for (const o of enemiesOf(p)) {
      const d = Math.hypot(o.torso.position.x - p.torso.position.x, o.torso.position.y - p.torso.position.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    if (!best) return;
    releaseGrab(p);
    const c = Constraint.create({
      bodyA: p.torso,
      bodyB: best.torso,
      length: 34,
      stiffness: 0.08,
      damping: 0.08,
    });
    World.add(world, c);
    p.grab = { target: best, constraint: c };
    toastMsg(`${p.col.name} схватил ${best.col.name}!`);
  }

  function tryPunch(p) {
    if (p.koT > 0 || p.out || p.punchCd > 0) return;
    p.punchCd = 0.35;
    const reach = 42;
    for (const o of enemiesOf(p)) {
      const dx = o.head.position.x - p.torso.position.x;
      const dy = o.head.position.y - p.torso.position.y;
      if (Math.hypot(dx, dy) < reach && Math.sign(dx || p.facing) === p.facing) {
        Body.applyForce(o.head, o.head.position, { x: p.facing * 0.045, y: -0.01 });
        Body.applyForce(o.torso, o.torso.position, { x: p.facing * 0.035, y: -0.008 });
        o.koT = Math.min(3.5, o.koT + 1.1);
        releaseGrab(o);
        toastMsg(`${p.col.name} ударил ${o.col.name}!`);
        break;
      }
    }
  }

  function tryKick(p) {
    if (p.koT > 0 || p.out || p.kickCd > 0) return;
    p.kickCd = 0.45;
    for (const o of enemiesOf(p)) {
      const dx = o.torso.position.x - p.torso.position.x;
      const dy = o.torso.position.y - p.torso.position.y;
      if (Math.hypot(dx, dy) < 50) {
        Body.applyForce(o.torso, o.torso.position, { x: p.facing * 0.06, y: -0.025 });
        o.koT = Math.min(3.5, o.koT + 0.7);
        releaseGrab(o);
        if (p.grab && p.grab.target === o) releaseGrab(p);
        toastMsg(`${p.col.name} пнул ${o.col.name}!`);
        break;
      }
    }
  }

  function checkWin() {
    if (matchKind === "ffa") {
      const left = players.filter((x) => !x.out);
      if (left.length <= 1) endRound(left[0] ? `Победил ${left[0].col.name}!` : "Ничья");
      return;
    }
    const aAlive = players.some((p) => !p.out && p.team === 0);
    const bAlive = players.some((p) => !p.out && p.team === 1);
    if (!aAlive && !bAlive) endRound("Ничья");
    else if (!aAlive) endRound("Победа команды Б (боты)!");
    else if (!bAlive) endRound("Победа команды А (ты)!");
  }

  function eliminate(p, reason) {
    if (p.out) return;
    p.out = true;
    p.alive = false;
    releaseGrab(p);
    for (const o of players) {
      if (o.grab && o.grab.target === p) releaseGrab(o);
    }
    World.remove(world, p.neck);
    World.remove(world, p.torso);
    World.remove(world, p.head);
    toastMsg(`${p.col.name} выбыл! (${reason})`);
    updateHud();
    checkWin();
  }

  function endRound(msg) {
    if (ended) return;
    ended = true;
    stopLoop();
    app.querySelector("#end-txt").textContent = msg;
    app.querySelector("#end").classList.remove("hidden");
  }

  function avoidHazards(p) {
    const x = p.torso.position.x;
    let push = 0;
    for (const h of arena.hazards || []) {
      if (h.type === "saw" || h.type === "fan") {
        const d = x - h.x;
        if (Math.abs(d) < (h.r || 40) + 50) push += d >= 0 ? 1 : -1;
      }
    }
    // stay away from screen edges / fall zones
    if (x < W * 0.12) push += 1;
    if (x > W * 0.88) push -= 1;
    return push;
  }

  function botThink(p, dt) {
    if (p.out) return;
    p.koT = Math.max(0, p.koT - dt);
    p.punchCd = Math.max(0, p.punchCd - dt);
    p.kickCd = Math.max(0, p.kickCd - dt);
    p.onGround = grounded(p);
    if (p.koT > 0) {
      Body.setVelocity(p.torso, { x: p.torso.velocity.x * 0.9, y: p.torso.velocity.y });
      return;
    }

    p.botTimer -= dt;
    if (p.botTimer <= 0) {
      p.botTimer = 0.25 + Math.random() * 0.35;
      p.botAction = Math.random();
    }

    const foes = enemiesOf(p);
    const avoid = avoidHazards(p);
    let target = null;
    let bestD = 1e9;
    for (const o of foes) {
      const d = Math.hypot(o.torso.position.x - p.torso.position.x, o.torso.position.y - p.torso.position.y);
      if (d < bestD) {
        bestD = d;
        target = o;
      }
    }

    if (avoid !== 0 && Math.abs(avoid) >= 1) {
      p.facing = avoid > 0 ? 1 : -1;
      Body.applyForce(p.torso, p.torso.position, { x: p.facing * 0.0028, y: 0 });
      if (p.onGround && Math.random() < 0.04) {
        Body.applyForce(p.torso, p.torso.position, { x: 0, y: -0.05 });
      }
      if (p.grab) {
        const t = p.grab.target;
        releaseGrab(p);
        Body.applyForce(t.torso, t.torso.position, { x: -p.facing * 0.055, y: -0.015 });
      }
      return;
    }

    if (!target) return;

    const dx = target.torso.position.x - p.torso.position.x;
    const dy = target.torso.position.y - p.torso.position.y;
    p.facing = dx >= 0 ? 1 : -1;

    if (bestD > 40) {
      Body.applyForce(p.torso, p.torso.position, { x: p.facing * 0.0025, y: 0 });
      if (dy < -40 && p.onGround) {
        Body.applyForce(p.torso, p.torso.position, { x: 0, y: -0.052 });
      }
    }

    if (bestD < 48) {
      if (p.botAction < 0.4) tryPunch(p);
      else if (p.botAction < 0.7) tryKick(p);
      else if (p.botAction < 0.9) {
        if (!p.grab) tryGrab(p);
        else if (p.grab && p.grabHeldTime > 0.6) {
          const t = p.grab.target;
          const edgeDir = p.torso.position.x < W * 0.5 ? -1 : 1;
          releaseGrab(p);
          Body.applyForce(t.torso, t.torso.position, { x: edgeDir * 0.06, y: -0.02 });
          p.grabHeldTime = 0;
        }
      }
    }

    if (p.grab) p.grabHeldTime = (p.grabHeldTime || 0) + dt;
    else p.grabHeldTime = 0;
  }

  function applyInput(p, dt) {
    if (p.out) return;
    p.koT = Math.max(0, p.koT - dt);
    p.punchCd = Math.max(0, p.punchCd - dt);
    p.kickCd = Math.max(0, p.kickCd - dt);
    p.onGround = grounded(p);

    const k = p.slot.keys;
    if (p.koT > 0) {
      Body.setVelocity(p.torso, {
        x: p.torso.velocity.x * 0.9,
        y: p.torso.velocity.y,
      });
      return;
    }

    if (keys[k.left]) {
      p.facing = -1;
      Body.applyForce(p.torso, p.torso.position, { x: -0.0024, y: 0 });
    }
    if (keys[k.right]) {
      p.facing = 1;
      Body.applyForce(p.torso, p.torso.position, { x: 0.0024, y: 0 });
    }

    const jump = !!keys[k.jump];
    if (jump && !p.jumpHeld && p.onGround) {
      Body.applyForce(p.torso, p.torso.position, { x: 0, y: -0.055 });
      Body.applyForce(p.head, p.head.position, { x: 0, y: -0.012 });
    }
    p.jumpHeld = jump;

    const punch = !!keys[k.punch];
    if (punch && !p.punchHeld) tryPunch(p);
    p.punchHeld = punch;

    const kick = !!keys[k.kick];
    if (kick && !p.kickHeld) tryKick(p);
    p.kickHeld = kick;

    const grab = !!keys[k.grab];
    if (grab && !p.grabHeld) tryGrab(p);
    if (!grab && p.grabHeld) {
      if (p.grab) {
        const t = p.grab.target;
        const fx = p.facing * 0.05;
        releaseGrab(p);
        Body.applyForce(t.torso, t.torso.position, { x: fx, y: -0.02 });
        toastMsg(`${p.col.name} бросил!`);
      }
    }
    p.grabHeld = grab;
  }

  function checkHazards(p) {
    if (p.out) return;
    if (p.torso.position.y > arena.killY || p.head.position.y > arena.killY) {
      eliminate(p, "упал");
      return;
    }
    for (const h of arena.hazards || []) {
      if (h.type === "saw") {
        const d = Math.hypot(p.torso.position.x - h.x, p.torso.position.y - h.y);
        if (d < h.r + 14) eliminate(p, "пила");
      }
      if (h.type === "fan") {
        const d = Math.hypot(p.torso.position.x - h.x, p.torso.position.y - h.y);
        if (d < h.r * 0.55) eliminate(p, "вентилятор");
      }
    }
  }

  function blob(x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawFighter(p, t) {
    if (p.out) return;
    const tx = p.torso.position.x;
    const ty = p.torso.position.y;
    const hx = p.head.position.x;
    const hy = p.head.position.y;
    const wob = Math.sin(t * 10 + p.i) * 2;
    const c = p.col;

    ctx.globalAlpha = p.koT > 0 ? 0.55 : 1;

    // legs (floppy)
    blob(tx - 8 + wob, ty + 18, 7, 12, c.shade);
    blob(tx + 8 - wob, ty + 19, 7, 12, c.shade);
    blob(tx - 8, ty + 28, 8, 6, c.color);
    blob(tx + 8, ty + 29, 8, 6, c.color);

    // arms
    const armX = tx + p.facing * 18;
    blob(tx - p.facing * 16, ty + 2, 8, 6, c.color);
    blob(armX, ty + (p.grab ? -4 : 2), 8, 6, c.color);

    // torso
    blob(tx, ty, 16, 15, c.color);
    blob(tx - 3, ty - 2, 8, 7, c.blush);

    // head (lollipop)
    blob(hx, hy, 14, 13, c.color);
    blob(hx - 3, hy - 4, 6, 4, c.blush);
    ctx.beginPath();
    ctx.arc(hx - 4, hy, 2, 0, Math.PI * 2);
    ctx.arc(hx + 4, hy, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,10,30,0.35)";
    ctx.fill();

    if (p.koT > 0) {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 11px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("не могу двигаться", hx, hy - 22);
    }

    if (p.grab) {
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.grab.target.torso.position.x, p.grab.target.torso.position.y);
      ctx.strokeStyle = "rgba(253,224,71,0.7)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#3d2a45");
    g.addColorStop(0.55, "#1e1824");
    g.addColorStop(1, "#0c0a10");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // city vibe
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let i = 0; i < 8; i++) {
      const bx = (i * 110 + 20) % W;
      ctx.fillRect(bx, H * 0.35 + (i % 3) * 20, 70, H);
    }

    if (arena && arena.drawExtra) arena.drawExtra(ctx, t);

    for (const p of players) drawFighter(p, t);

    ctx.fillStyle = "rgba(200,190,180,0.65)";
    ctx.font = "700 12px Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Боты бьют врагов команды. Ты: A/D · W · F удар · G пинок · E захват.", 12, H - 16);
  }

  function loop(ts) {
    if (mode !== "play" || ended) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    matchAge += dt;
    toastT = Math.max(0, toastT - dt);

    for (const p of players) {
      if (p.isBot) botThink(p, dt);
      else applyInput(p, dt);
    }
    if (arena.pull) arena.pull(players, dt);
    Engine.update(engine, dt * 1000);
    for (const p of players) checkHazards(p);

    draw(ts / 1000);
    if (((ts / 200) | 0) !== (((ts - dt * 1000) / 200) | 0)) updateHud();
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
  window.addEventListener("resize", () => {
    if (mode === "play") {
      // restart arena on resize to keep platforms correct
      resize();
    }
  });

  showLobby();
})();
