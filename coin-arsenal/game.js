(() => {
  const W = 960;
  const H = 640;
  const STORAGE = "coin-arsenal-v1";
  const ARENA = { x: 40, y: 40, w: W - 80, h: H - 80 };

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

  // Each tier ~2× previous; late tiers slightly more than 2×
  const WEAPONS = [
    { id: "pipe", name: "Труба", dmg: 8, rate: 2.2, range: 70, speed: 0, melee: true, spread: 0, pellets: 1, cost: 0, desc: "Стартовое оружие ближнего боя" },
    { id: "pistol", name: "Пистолет", dmg: 16, rate: 3.5, range: 420, speed: 520, melee: false, spread: 0.04, pellets: 1, cost: 40, desc: "В 2 раза сильнее трубы" },
    { id: "smg", name: "ПП", dmg: 32, rate: 9, range: 400, speed: 560, melee: false, spread: 0.12, pellets: 1, cost: 120, desc: "В 2 раза сильнее пистолета" },
    { id: "shotgun", name: "Дробовик", dmg: 14, rate: 1.4, range: 260, speed: 480, melee: false, spread: 0.28, pellets: 5, cost: 280, desc: "~2× ПП суммарно за выстрел" },
    { id: "railgun", name: "Рельсотрон", dmg: 140, rate: 1.1, range: 700, speed: 900, melee: false, spread: 0, pellets: 1, cost: 650, desc: "~2.2× дробовика, пробивает" },
    { id: "doomsday", name: "Судный день", dmg: 110, rate: 2.4, range: 650, speed: 700, melee: false, spread: 0.08, pellets: 3, cost: 1600, desc: "Ломает баланс — как и обещали" },
  ];

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

  const save = store.get(STORAGE, {
    coins: 0,
    owned: ["pipe"],
    equipped: "pipe",
    bestWave: 0,
    bestKills: 0,
  });
  if (!save.owned.includes("pipe")) save.owned.push("pipe");
  if (!WEAPONS.find((w) => w.id === save.equipped)) save.equipped = "pipe";
  if (amalGod()) {
    save.coins = 999999999;
    save.owned = WEAPONS.map((w) => w.id);
    save.equipped = "doomsday";
  }

  function persist() {
    store.set(STORAGE, {
      coins: save.coins,
      owned: save.owned,
      equipped: save.equipped,
      bestWave: save.bestWave,
      bestKills: save.bestKills,
    });
  }

  const app = document.getElementById("app");
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
      <div class="pill hp"><span class="label">Жизни</span><span class="value" id="h-hp">100</span></div>
      <div class="pill coins"><span class="label">Монеты</span><span class="value" id="h-coins">0</span></div>
      <div class="pill wave"><span class="label">Волна</span><span class="value" id="h-wave">1</span></div>
      <div class="pill weapon"><span class="label">Оружие</span><span class="value" id="h-weapon">Труба</span></div>
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
    <div class="pad-move">
      <button class="pad up" data-k="up">▲</button>
      <button class="pad left" data-k="left">◀</button>
      <button class="pad right" data-k="right">▶</button>
      <button class="pad down" data-k="down">▼</button>
    </div>
    <button class="pad fire" data-k="fire">ОГОНЬ</button>
  `;
  screen.appendChild(touch);

  const el = {
    hp: hud.querySelector("#h-hp"),
    coins: hud.querySelector("#h-coins"),
    wave: hud.querySelector("#h-wave"),
    weapon: hud.querySelector("#h-weapon"),
    msg: hud.querySelector("#h-msg"),
  };

  const state = {
    screen: "menu",
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    coinsDrop: [],
    wave: 1,
    kills: 0,
    waveKills: 0,
    toSpawn: 0,
    spawnAcc: 0,
    fireCd: 0,
    invuln: 0,
    msgT: 0,
    aimX: W / 2,
    aimY: H / 2,
    autoAim: true,
    keys: Object.create(null),
    pad: { up: false, down: false, left: false, right: false, fire: false },
    pointerDown: false,
  };

  function weaponById(id) {
    return WEAPONS.find((w) => w.id === id) || WEAPONS[0];
  }

  function showMsg(text, t = 1.2) {
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
      <div class="brand">COIN ARSENAL</div>
      <p class="tagline">Волновая арена на свалке: тебя могут убить. Монеты и купленное оружие сохраняются. Каждое следующее оружие примерно в 2 раза сильнее.</p>
      <p class="tagline">Монеты: <b style="color:var(--gold)">${save.coins}</b> · Рекорд волны: <b style="color:var(--cyan)">${save.bestWave}</b></p>
      <button class="btn" id="start">В бой</button>
      <button class="btn ghost" id="shop-menu">Арсенал</button>
      <p class="hint-keys">
        <kbd>WASD</kbd> ход · мышь прицел · <kbd>ЛКМ</kbd>/<kbd>Пробел</kbd> стрельба · авто-прицел на ближайшего
      </p>
    `;
    overlay.querySelector("#start").onclick = () => startRun();
    overlay.querySelector("#shop-menu").onclick = () => renderShop({ fromMenu: true });
  }

  function renderShop(opts = {}) {
    const { fromMenu = false, betweenWaves = false } = opts;
    state.screen = betweenWaves ? "shop" : "shop";
    hud.hidden = betweenWaves ? false : true;
    touch.classList.remove("on");
    overlay.classList.remove("hidden");

    const cards = WEAPONS.map((w) => {
      const owned = save.owned.includes(w.id);
      const equipped = save.equipped === w.id;
      const canBuy = !owned && save.coins >= w.cost;
      let action = "";
      if (equipped) action = `<button class="btn" disabled>Надето</button>`;
      else if (owned) action = `<button class="btn" data-eq="${w.id}">Надеть</button>`;
      else action = `<button class="btn" data-buy="${w.id}" ${canBuy ? "" : "disabled"}>${w.cost} ◎</button>`;
      return `
        <div class="shop-card${owned ? " owned" : ""}${equipped ? " equipped" : ""}">
          <h4>${w.name}</h4>
          <p><span class="dmg">${w.dmg * w.pellets} урона</span> · ${w.melee ? "ближний" : "дальн."}${w.pellets > 1 ? ` · ${w.pellets}×` : ""}<br>${w.desc}</p>
          ${action}
        </div>`;
    }).join("");

    overlay.innerHTML = `
      <div class="brand" style="font-size:1.6rem">${betweenWaves ? "ПЕРЕРЫВ" : "АРСЕНАЛ"}</div>
      <div class="shop-head">
        <span class="shop-coins">${save.coins} ◎</span>
        ${betweenWaves ? `<span class="tagline">Волна ${state.wave} пройдена</span>` : ""}
      </div>
      <div class="shop-grid">${cards}</div>
      <button class="btn" id="shop-go">${betweenWaves ? "Следующая волна" : "Назад"}</button>
    `;

    overlay.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-buy");
        const w = weaponById(id);
        if (save.owned.includes(id)) return;
        if (!amalGod() && save.coins < w.cost) return;
        if (!amalGod()) save.coins -= w.cost;
        save.owned.push(id);
        save.equipped = id;
        persist();
        if (state.player) {
          state.player.weaponId = id;
          el.weapon.textContent = w.name;
        }
        el.coins.textContent = String(save.coins);
        renderShop(opts);
      });
    });
    overlay.querySelectorAll("[data-eq]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-eq");
        save.equipped = id;
        persist();
        if (state.player) {
          state.player.weaponId = id;
          el.weapon.textContent = weaponById(id).name;
        }
        renderShop(opts);
      });
    });
    overlay.querySelector("#shop-go").onclick = () => {
      if (betweenWaves) beginWave(state.wave + 1);
      else if (fromMenu) renderMenu();
      else renderMenu();
    };
  }

  function renderDeath() {
    state.screen = "dead";
    hud.hidden = true;
    touch.classList.remove("on");
    overlay.classList.remove("hidden");
    if (state.wave > save.bestWave) save.bestWave = state.wave;
    if (state.kills > save.bestKills) save.bestKills = state.kills;
    persist();
    overlay.innerHTML = `
      <div class="brand">ТЫ УБИТ</div>
      <p class="tagline">Волна ${state.wave} · убийств ${state.kills}<br>Монеты и оружие сохранены: <b style="color:var(--gold)">${save.coins} ◎</b></p>
      <button class="btn" id="again">Снова в бой</button>
      <button class="btn ghost" id="to-shop">Арсенал</button>
      <button class="btn ghost" id="to-menu">Меню</button>
    `;
    overlay.querySelector("#again").onclick = () => startRun();
    overlay.querySelector("#to-shop").onclick = () => renderShop({ fromMenu: true });
    overlay.querySelector("#to-menu").onclick = () => renderMenu();
  }

  function makePlayer() {
    return {
      x: W / 2,
      y: H / 2,
      r: 16,
      hp: 100,
      maxHp: 100,
      speed: 210,
      weaponId: save.equipped,
      vx: 0,
      vy: 0,
    };
  }

  function startRun() {
    state.player = makePlayer();
    state.enemies = [];
    state.bullets = [];
    state.particles = [];
    state.coinsDrop = [];
    state.wave = 0;
    state.kills = 0;
    state.waveKills = 0;
    state.toSpawn = 0;
    state.spawnAcc = 0;
    state.fireCd = 0;
    state.invuln = 1;
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
    hud.hidden = false;
    touch.classList.add("on");
    el.coins.textContent = String(save.coins);
    el.weapon.textContent = weaponById(save.equipped).name;
    beginWave(1);
  }

  function waveCount(wave) {
    return Math.min(40, 4 + Math.floor(wave * 2.2));
  }

  function beginWave(n) {
    state.screen = "play";
    state.wave = n;
    state.waveKills = 0;
    state.toSpawn = waveCount(n);
    state.spawnAcc = 0;
    state.enemies = [];
    state.bullets = state.bullets.filter((b) => b.fromPlayer);
    overlay.classList.add("hidden");
    overlay.innerHTML = "";
    hud.hidden = false;
    touch.classList.add("on");
    if (state.player) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 20);
      state.invuln = 0.8;
    }
    el.wave.textContent = String(n);
    el.hp.textContent = String(Math.ceil(state.player.hp));
    showMsg("ВОЛНА " + n, 1.3);
  }

  function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = ARENA.x + Math.random() * ARENA.w; y = ARENA.y - 20; }
    else if (side === 1) { x = ARENA.x + ARENA.w + 20; y = ARENA.y + Math.random() * ARENA.h; }
    else if (side === 2) { x = ARENA.x + Math.random() * ARENA.w; y = ARENA.y + ARENA.h + 20; }
    else { x = ARENA.x - 20; y = ARENA.y + Math.random() * ARENA.h; }

    const wave = state.wave;
    const ranged = wave >= 3 && Math.random() < 0.25 + Math.min(0.25, wave * 0.02);
    const elite = wave >= 5 && Math.random() < 0.12;
    const hp = (ranged ? 28 : 40) * (1 + wave * 0.18) * (elite ? 2.2 : 1);
    const speed = (ranged ? 70 : 95) * (1 + wave * 0.03) * (elite ? 0.85 : 1);
    const dmg = (ranged ? 8 : 12) * (1 + wave * 0.08) * (elite ? 1.5 : 1);
    const coins = Math.floor((ranged ? 3 : 2) * (elite ? 3 : 1) * (1 + wave * 0.15));

    state.enemies.push({
      x, y, r: elite ? 20 : ranged ? 14 : 16,
      hp, maxHp: hp, speed, dmg, coins,
      ranged, elite, fireCd: 0.5 + Math.random(),
      tint: elite ? "#f72585" : ranged ? "#4cc9f0" : "#80ed99",
    });
  }

  function nearestEnemy(px, py) {
    let best = null;
    let bestD = Infinity;
    for (const e of state.enemies) {
      const d = (e.x - px) ** 2 + (e.y - py) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 160;
      state.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.4 + Math.random() * 0.5,
        s: 2 + Math.random() * 3,
        color,
      });
    }
  }

  function fireWeapon() {
    const p = state.player;
    const w = weaponById(p.weaponId);
    if (state.fireCd > 0) return;

    let ax = state.aimX;
    let ay = state.aimY;
    if (state.autoAim && !state.pointerDown) {
      const t = nearestEnemy(p.x, p.y);
      if (t) { ax = t.x; ay = t.y; }
    }
    let ang = Math.atan2(ay - p.y, ax - p.x);
    state.fireCd = 1 / w.rate;

    if (w.melee) {
      const reach = w.range;
      let hit = false;
      for (const e of state.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d > reach + e.r) continue;
        const ea = Math.atan2(e.y - p.y, e.x - p.x);
        let da = Math.abs(ea - ang);
        while (da > Math.PI) da = Math.abs(da - Math.PI * 2);
        if (da < 0.9) {
          hurtEnemy(e, w.dmg, ea);
          hit = true;
        }
      }
      burst(p.x + Math.cos(ang) * 28, p.y + Math.sin(ang) * 28, "#ffd166", hit ? 12 : 5);
      return;
    }

    for (let i = 0; i < w.pellets; i++) {
      const spread = (Math.random() - 0.5) * w.spread * 2;
      const a = ang + spread;
      state.bullets.push({
        x: p.x + Math.cos(a) * 18,
        y: p.y + Math.sin(a) * 18,
        vx: Math.cos(a) * w.speed,
        vy: Math.sin(a) * w.speed,
        dmg: w.dmg,
        life: w.range / w.speed,
        fromPlayer: true,
        pierce: w.id === "railgun" ? 4 : w.id === "doomsday" ? 2 : 0,
        r: w.id === "railgun" ? 5 : 3.5,
        color: w.id === "railgun" ? "#00f5d4" : w.id === "doomsday" ? "#f72585" : "#ffd166",
      });
    }
  }

  function hurtEnemy(e, dmg, knockAng) {
    e.hp -= dmg;
    if (knockAng != null) {
      e.x += Math.cos(knockAng) * 8;
      e.y += Math.sin(knockAng) * 8;
    }
    burst(e.x, e.y, e.tint, 6);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    const i = state.enemies.indexOf(e);
    if (i >= 0) state.enemies.splice(i, 1);
    state.kills++;
    state.waveKills++;
    save.coins += e.coins;
    persist();
    el.coins.textContent = String(save.coins);
    state.coinsDrop.push({ x: e.x, y: e.y, life: 0.6, n: e.coins });
    burst(e.x, e.y, "#ffd166", 14);

    if (state.toSpawn <= 0 && state.enemies.length === 0) {
      const bonus = 8 + state.wave * 4;
      save.coins += bonus;
      persist();
      el.coins.textContent = String(save.coins);
      showMsg("ВОЛНА +" + bonus + " ◎", 1.2);
      setTimeout(() => {
        if (state.screen === "play" && state.player && state.player.hp > 0) {
          renderShop({ betweenWaves: true });
        }
      }, 900);
    }
  }

  function hurtPlayer(dmg) {
    if (state.invuln > 0 || state.screen !== "play") return;
    if (amalGod()) return;
    state.player.hp -= dmg;
    state.invuln = 0.55;
    burst(state.player.x, state.player.y, "#ff4d6d", 10);
    el.hp.textContent = String(Math.max(0, Math.ceil(state.player.hp)));
    if (state.player.hp <= 0) {
      state.player.hp = 0;
      showMsg("ПОГИБ", 1);
      setTimeout(() => renderDeath(), 700);
    }
  }

  function clampPlayer() {
    const p = state.player;
    p.x = Math.max(ARENA.x + p.r, Math.min(ARENA.x + ARENA.w - p.r, p.x));
    p.y = Math.max(ARENA.y + p.r, Math.min(ARENA.y + ARENA.h - p.r, p.y));
  }

  function update(dt) {
    if (state.screen !== "play" || !state.player) return;
    const p = state.player;
    const wpn = weaponById(p.weaponId);

    let mx = 0;
    let my = 0;
    if (state.keys.w || state.keys.W || state.keys.ArrowUp || state.pad.up) my -= 1;
    if (state.keys.s || state.keys.S || state.keys.ArrowDown || state.pad.down) my += 1;
    if (state.keys.a || state.keys.A || state.keys.ArrowLeft || state.pad.left) mx -= 1;
    if (state.keys.d || state.keys.D || state.keys.ArrowRight || state.pad.right) mx += 1;
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      p.x += (mx / len) * p.speed * dt;
      p.y += (my / len) * p.speed * dt;
      clampPlayer();
    }

    if (state.fireCd > 0) state.fireCd -= dt;
    if (state.invuln > 0) state.invuln -= dt;
    if (state.msgT > 0) {
      state.msgT -= dt;
      if (state.msgT <= 0) el.msg.classList.remove("show");
    }

    const manualFire = state.pointerDown || state.pad.fire || state.keys[" "] || state.keys.Spacebar;
    if (state.enemies.length > 0 || manualFire) {
      fireWeapon();
    }

    // spawn
    if (state.toSpawn > 0) {
      state.spawnAcc += dt;
      const interval = Math.max(0.25, 0.85 - state.wave * 0.04);
      if (state.spawnAcc >= interval) {
        state.spawnAcc = 0;
        spawnEnemy();
        state.toSpawn--;
      }
    }

    // enemies
    for (const e of state.enemies) {
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      if (e.ranged) {
        const dist = Math.hypot(p.x - e.x, p.y - e.y);
        if (dist > 280) {
          e.x += Math.cos(ang) * e.speed * dt;
          e.y += Math.sin(ang) * e.speed * dt;
        } else if (dist < 180) {
          e.x -= Math.cos(ang) * e.speed * 0.7 * dt;
          e.y -= Math.sin(ang) * e.speed * 0.7 * dt;
        }
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = Math.max(0.7, 1.6 - state.wave * 0.05);
          state.bullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(ang) * 220,
            vy: Math.sin(ang) * 220,
            dmg: e.dmg,
            life: 2.2,
            fromPlayer: false,
            pierce: 0,
            r: 4,
            color: "#4cc9f0",
          });
        }
      } else {
        e.x += Math.cos(ang) * e.speed * dt;
        e.y += Math.sin(ang) * e.speed * dt;
        if (Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r - 2) {
          hurtPlayer(e.dmg * dt * 1.8);
        }
      }
    }

    // bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) {
        state.bullets.splice(i, 1);
        continue;
      }
      if (b.fromPlayer) {
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const e = state.enemies[j];
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
            hurtEnemy(e, b.dmg, Math.atan2(b.vy, b.vx));
            if (b.pierce > 0) {
              b.pierce--;
              b.dmg *= 0.85;
            } else {
              state.bullets.splice(i, 1);
              break;
            }
          }
        }
      } else if (Math.hypot(p.x - b.x, p.y - b.y) < p.r + b.r) {
        hurtPlayer(b.dmg);
        state.bullets.splice(i, 1);
      }
    }

    for (const c of state.coinsDrop) c.life -= dt;
    state.coinsDrop = state.coinsDrop.filter((c) => c.life > 0);

    for (const pt of state.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    state.particles = state.particles.filter((pt) => pt.life > 0);

    el.hp.textContent = String(Math.max(0, Math.ceil(p.hp)));
    el.weapon.textContent = wpn.name;
  }

  function drawArena() {
    // floor
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#12101f");
    g.addColorStop(1, "#0a1820");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(0,245,212,0.06)";
    ctx.lineWidth = 1;
    for (let x = ARENA.x; x <= ARENA.x + ARENA.w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, ARENA.y);
      ctx.lineTo(x, ARENA.y + ARENA.h);
      ctx.stroke();
    }
    for (let y = ARENA.y; y <= ARENA.y + ARENA.h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(ARENA.x, y);
      ctx.lineTo(ARENA.x + ARENA.w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(0,245,212,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);

    // scrap decorations
    ctx.fillStyle = "rgba(247,37,133,0.12)";
    ctx.fillRect(ARENA.x + 30, ARENA.y + 40, 50, 18);
    ctx.fillRect(ARENA.x + ARENA.w - 90, ARENA.y + ARENA.h - 70, 60, 22);
    ctx.fillStyle = "rgba(255,209,102,0.1)";
    ctx.fillRect(ARENA.x + ARENA.w / 2 - 40, ARENA.y + 24, 80, 12);
  }

  function drawPlayer() {
    const p = state.player;
    if (!p) return;
    const flash = state.invuln > 0 && Math.floor(state.invuln * 20) % 2 === 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    let ang = Math.atan2(state.aimY - p.y, state.aimX - p.x);
    if (state.autoAim && !state.pointerDown) {
      const t = nearestEnemy(p.x, p.y);
      if (t) ang = Math.atan2(t.y - p.y, t.x - p.x);
    }
    ctx.rotate(ang);

    ctx.fillStyle = flash ? "#fff" : "#00f5d4";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, -12);
    ctx.closePath();
    ctx.fill();

    const w = weaponById(p.weaponId);
    ctx.fillStyle = "#ffd166";
    if (w.melee) {
      ctx.fillRect(8, -3, 28, 6);
    } else {
      ctx.fillRect(10, -2, 22, 4);
    }
    ctx.restore();

    // hp bar
    const bw = 36;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(p.x - bw / 2, p.y - 28, bw, 5);
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(p.x - bw / 2, p.y - 28, bw * (p.hp / p.maxHp), 5);
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = e.tint;
    ctx.beginPath();
    if (e.elite) {
      ctx.moveTo(0, -e.r);
      ctx.lineTo(e.r, 0);
      ctx.lineTo(0, e.r);
      ctx.lineTo(-e.r, 0);
      ctx.closePath();
    } else {
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = "#0a0a12";
    ctx.beginPath();
    ctx.arc(-4, -3, 3, 0, Math.PI * 2);
    ctx.arc(4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bw = e.r * 2;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(e.x - bw / 2, e.y - e.r - 10, bw, 4);
    ctx.fillStyle = "#80ed99";
    ctx.fillRect(e.x - bw / 2, e.y - e.r - 10, bw * (e.hp / e.maxHp), 4);
  }

  function render() {
    drawArena();
    for (const c of state.coinsDrop) {
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(c.x, c.y - (0.6 - c.life) * 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const b of state.bullets) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of state.enemies) drawEnemy(e);
    if (state.screen === "play" || state.screen === "shop") drawPlayer();
    for (const pt of state.particles) {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.s, pt.s);
      ctx.globalAlpha = 1;
    }

    // aim reticle
    if (state.screen === "play") {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(state.aimX, state.aimY, 8, 0, Math.PI * 2);
      ctx.moveTo(state.aimX - 12, state.aimY);
      ctx.lineTo(state.aimX + 12, state.aimY);
      ctx.moveTo(state.aimX, state.aimY - 12);
      ctx.lineTo(state.aimX, state.aimY + 12);
      ctx.stroke();
    }
  }

  // input
  window.addEventListener("keydown", (e) => {
    state.keys[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    if (e.key === "Escape" && state.screen === "play") {
      // pause to shop? no — back not during fight
    }
  });
  window.addEventListener("keyup", (e) => {
    state.keys[e.key] = false;
  });

  function canvasPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * W,
      y: ((ev.clientY - rect.top) / rect.height) * H,
    };
  }
  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPos(e);
    state.aimX = p.x;
    state.aimY = p.y;
  });
  canvas.addEventListener("pointerdown", (e) => {
    const p = canvasPos(e);
    state.aimX = p.x;
    state.aimY = p.y;
    state.pointerDown = true;
    state.autoAim = false;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  canvas.addEventListener("pointerup", () => {
    state.pointerDown = false;
    state.autoAim = true;
  });
  canvas.addEventListener("pointercancel", () => {
    state.pointerDown = false;
    state.autoAim = true;
  });

  function bindPad(btn) {
    const k = btn.dataset.k;
    const set = (v) => {
      if (k === "up") state.pad.up = v;
      if (k === "down") state.pad.down = v;
      if (k === "left") state.pad.left = v;
      if (k === "right") state.pad.right = v;
      if (k === "fire") state.pad.fire = v;
      btn.classList.toggle("held", v);
    };
    const down = (e) => {
      e.preventDefault();
      try { if (e.pointerId != null) btn.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      set(true);
    };
    const up = () => set(false);
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
  }
  touch.querySelectorAll(".pad").forEach(bindPad);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    if (state.screen === "play" || state.screen === "shop" || state.screen === "dead") {
      // keep drawing arena under overlays for shop/dead atmosphere when player exists
    }
    if (state.screen !== "menu") render();
    else {
      // idle backdrop
      drawArena();
    }
    requestAnimationFrame(frame);
  }

  renderMenu();
  requestAnimationFrame(frame);

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (t === "heal" || t === "max") {
      if (state.player) {
        state.player.hp = state.player.maxHp;
        state.invuln = 2;
        if (el && el.hp) el.hp.textContent = String(Math.ceil(state.player.hp));
      }
      if (state.screen === "dead") state.screen = "play";
    }
    if (t === "ca-clear" || t === "max") {
      state.enemies = [];
      state.toSpawn = 0;
      showMsg("☠ ВОЛНА ЧИСТА", 1.2);
    }
    if (t === "ca-doomsday" || t === "unlock" || t === "max") {
      save.equipped = "doomsday";
      save.owned = WEAPONS.map((w) => w.id);
      if (state.player) state.player.weaponId = "doomsday";
      if (el && el.weapon) el.weapon.textContent = weaponById("doomsday").name;
      persist();
    }
    if (t === "ca-wave" || t === "max") {
      if (typeof beginWave === "function") beginWave((state.wave || 1) + 5);
    }
    if (t === "coins" || t === "max" || t === "unlock") {
      save.coins = 999999999;
      save.owned = WEAPONS.map((w) => w.id);
      persist();
      if (el && el.coins) el.coins.textContent = String(save.coins);
    }
    if (t === "speed" || t === "max") {
      if (state.player) state.player.speed = Math.max(state.player.speed || 0, 360);
    }
    if (t === "god" || t === "max") state.invuln = 999;
  });
})();
