(() => {
  const COLS = 9;
  const ROWS = 5;
  const LEFT = 70;
  const TOP = 36;
  const CELL_W = 86;
  const CELL_H = 88;
  const ALLERGY_CHANCE = 0.1;
  const START_SUN = 200;
  const MAX_WAVES = 8;

  const plantsCatalog = window.PVZ2_PLANTS || [];
  const typesMeta = window.PVZ2_TYPES || [];
  const typeName = Object.fromEntries(typesMeta.map((t) => [t.id, t.name]));
  const plantById = Object.fromEntries(plantsCatalog.map((p) => [p.id, p]));

  const els = {
    screenMenu: document.getElementById("screenMenu"),
    screenAlmanac: document.getElementById("screenAlmanac"),
    screenPlay: document.getElementById("screenPlay"),
    screenEnd: document.getElementById("screenEnd"),
    plantCount: document.getElementById("plantCount"),
    modeSelect: document.getElementById("modeSelect"),
    testMode: document.getElementById("testMode"),
    typeFilters: document.getElementById("typeFilters"),
    plantGrid: document.getElementById("plantGrid"),
    plantSearch: document.getElementById("plantSearch"),
    almanacSub: document.getElementById("almanacSub"),
    seedBar: document.getElementById("seedBar"),
    sunText: document.getElementById("sunText"),
    waveText: document.getElementById("waveText"),
    modeText: document.getElementById("modeText"),
    coopHint: document.getElementById("coopHint"),
    playHint: document.getElementById("playHint"),
    endTitle: document.getElementById("endTitle"),
    endSub: document.getElementById("endSub"),
    toast: document.getElementById("toast"),
    canvas: document.getElementById("gameCanvas"),
  };

  const ctx = els.canvas.getContext("2d");
  let activeType = "all";
  let toastTimer = 0;
  let lastTs = 0;
  let animId = 0;
  let shovel = false;

  const state = {
    mode: "solo",
    test: true,
    running: false,
    sun: START_SUN,
    wave: 1,
    waveTimer: 0,
    spawnTimer: 2,
    zombiesLeft: 0,
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [],
    mowers: [],
    fx: [],
    selectedP1: "peashooter",
    selectedP2: "sunflower",
    cooldown: {},
    lost: false,
    won: false,
    fallen: 0,
  };

  function showToast(text) {
    els.toast.textContent = text;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2200);
  }

  function showScreen(name) {
    els.screenMenu.hidden = name !== "menu";
    els.screenAlmanac.hidden = name !== "almanac";
    els.screenPlay.hidden = name !== "play";
    els.screenEnd.hidden = name !== "end";
  }

  function parseSun(value) {
    const n = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 100;
  }

  function parseRecharge(value) {
    const n = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? Math.max(1, n) : 5;
  }

  function isNutPlant(p) {
    const id = (p.id || "").toLowerCase();
    const en = (p.en || "").toLowerCase();
    return (
      (p.types || []).includes("defense") &&
      (id.includes("nut") ||
        en.includes("nut") ||
        en.includes("endurian") ||
        en.includes("gumnut") ||
        en.includes("blockoli") ||
        en.includes("pumpkin"))
    );
  }

  function combatStats(raw) {
    const types = raw.types || ["other"];
    const sun = parseSun(raw.sun);
    const recharge = parseRecharge(raw.recharge);
    const primary = types[0] || "other";
    let hp = 300;
    let damage = 20;
    let shootEvery = 1.45;
    let role = "shooter";
    let pierce = 1;
    let aoe = 0;
    let slow = 0;
    let burn = 0;
    let instant = false;
    let generateSun = 0;
    let sunEvery = 0;
    let ground = false;
    let melee = false;
    let lob = false;
    let chain = 0;

    if (types.includes("defense")) {
      role = "wall";
      hp = 1200 + Math.min(sun, 300) * 4;
      damage = 0;
    }
    if (types.includes("sun")) {
      role = "sun";
      hp = 300;
      generateSun = types.includes("sun") && sun >= 100 ? 50 : 25;
      sunEvery = 7.5;
      if (raw.id.includes("twin") || raw.id.includes("primal-sun")) generateSun = 50;
    }
    if (types.includes("bomb")) {
      role = "bomb";
      hp = 200;
      damage = 900 + sun * 2;
      aoe = 1;
      instant = true;
      if (raw.id.includes("mine") || raw.en.toLowerCase().includes("mine")) {
        role = "mine";
        instant = false;
        damage = 900;
      }
    }
    if (types.includes("spike")) {
      role = "spike";
      hp = 99999;
      damage = 18 + Math.floor(sun / 20);
      ground = true;
    }
    if (types.includes("melee")) {
      role = "melee";
      melee = true;
      damage = 28 + Math.floor(sun / 15);
      shootEvery = 0.55;
      hp = 450;
    }
    if (types.includes("pea") || types.includes("shadow") || primary === "other") {
      if (role === "shooter" || types.includes("pea") || types.includes("shadow")) {
        role = "shooter";
        damage = 20 + Math.floor(sun / 25);
        if (raw.id.includes("repeater") || raw.id.includes("split")) damage = 20;
        if (raw.id.includes("threepeater") || raw.id.includes("gatling")) {
          damage = 20;
          shootEvery = 1.2;
        }
        if (types.includes("shadow")) damage += 5;
      }
    }
    if (types.includes("lobber")) {
      role = "lobber";
      lob = true;
      damage = 35 + Math.floor(sun / 20);
      shootEvery = 2.1;
      aoe = types.includes("ice") || types.includes("fire") ? 0.5 : 0;
    }
    if (types.includes("fire")) {
      if (role === "shooter" || role === "lobber") burn = 1;
      if (raw.id.includes("snapdragon") || raw.id.includes("pyre") || raw.id.includes("inferno")) {
        role = "breath";
        damage = 35;
        shootEvery = 1.2;
        aoe = 1;
      }
      if (raw.id.includes("jalapeno") || raw.en.toLowerCase().includes("jalapeno")) {
        role = "rowbomb";
        instant = true;
        damage = 1400;
      }
    }
    if (types.includes("ice")) {
      slow = 0.45;
      if (raw.id.includes("iceberg") || raw.id.includes("ice-bloom") || raw.id.includes("stunion")) {
        role = "freeze";
        instant = true;
        damage = 0;
        aoe = raw.id.includes("ice-bloom") ? 9 : 0;
      }
      if (role === "shooter" || role === "lobber") damage = Math.max(15, damage - 5);
    }
    if (types.includes("electric")) {
      role = "electric";
      damage = 22 + Math.floor(sun / 20);
      chain = 2;
      pierce = 3;
      shootEvery = 1.3;
    }
    if (types.includes("poison")) {
      role = "fume";
      damage = 22;
      pierce = 99;
      shootEvery = 1.4;
    }
    if (types.includes("water") && (raw.id.includes("kelp") || raw.id.includes("guac"))) {
      role = "trap";
      instant = false;
      damage = 9999;
      hp = 300;
    }
    if (types.includes("support")) {
      if (role === "shooter" && !types.includes("pea")) {
        role = "support";
        damage = 0;
        hp = 300;
      }
    }
    if (types.includes("mint")) {
      role = "mint";
      instant = true;
      damage = 400;
      aoe = 2;
    }
    if (raw.id === "cherry-bomb" || raw.en === "Cherry Bomb") {
      role = "bomb";
      instant = true;
      damage = 1800;
      aoe = 1;
    }

    return {
      ...raw,
      sunCost: sun,
      recharge,
      hp,
      damage,
      shootEvery,
      role,
      pierce,
      aoe,
      slow,
      burn,
      instant,
      generateSun,
      sunEvery,
      ground,
      melee,
      lob,
      chain,
      nut: isNutPlant(raw),
    };
  }

  const COMBAT = Object.fromEntries(
    plantsCatalog.map((p) => [p.id, combatStats(p)])
  );

  const STARTER_LOADOUT = [
    "peashooter",
    "sunflower",
    "wall-nut",
    "potato-mine",
    "cabbage-pult",
    "bloomerang",
    "iceberg-lettuce",
    "bonk-choy",
    "snapdragon",
    "lightning-reed",
    "spikeweed",
    "cherry-bomb",
    "snow-pea",
    "fire-peashooter",
    "electric-blueberry",
    "repeater",
    "tall-nut",
    "kernel-pult",
    "threepeater",
    "winter-melon",
  ].filter((id) => COMBAT[id]);

  function cellRect(row, col) {
    return {
      x: LEFT + col * CELL_W,
      y: TOP + row * CELL_H,
      w: CELL_W,
      h: CELL_H,
    };
  }

  function plantAt(row, col) {
    return state.plants.find((p) => p.row === row && p.col === col && !p.dead);
  }

  function showMenu() {
    cancelAnimationFrame(animId);
    state.running = false;
    showScreen("menu");
  }

  function endGame(won, reason) {
    state.running = false;
    state.won = won;
    state.lost = !won;
    cancelAnimationFrame(animId);
    showScreen("end");
    els.endTitle.textContent = won ? "Победа!" : "Зомби дошли до дома";
    els.endSub.textContent = reason || (won ? "Все волны отражены." : "Попробуй ещё раз.");
  }

  function startGame() {
    state.mode = els.modeSelect.value === "coop" ? "coop" : "solo";
    state.test = !!(els.testMode && els.testMode.checked);
    state.running = true;
    state.sun = state.test ? 99999 : START_SUN;
    state.wave = 1;
    state.waveTimer = 0;
    state.spawnTimer = 1.5;
    state.zombiesLeft = 6;
    state.plants = [];
    state.zombies = [];
    state.projectiles = [];
    state.suns = [];
    state.fx = [];
    state.cooldown = {};
    state.lost = false;
    state.won = false;
    state.fallen = 0;
    state.selectedP1 = STARTER_LOADOUT[0];
    state.selectedP2 = STARTER_LOADOUT[1] || STARTER_LOADOUT[0];
    shovel = false;
    state.mowers = Array.from({ length: ROWS }, (_, row) => ({
      row,
      used: false,
      x: 18,
      active: false,
    }));
    showScreen("play");
    els.modeText.textContent =
      (state.mode === "coop" ? "Вдвоём" : "Соло") + (state.test ? " · ТЕСТ ∞" : "");
    els.coopHint.hidden = state.mode !== "coop";
    els.playHint.textContent = state.test
      ? "Тест: ∞ косилки и солнце. " +
        (state.mode === "coop"
          ? "Игрок 1: клик · Игрок 2: Shift+клик"
          : "Выбери растение и кликни по клетке")
      : state.mode === "coop"
        ? "Игрок 1: клик · Игрок 2: Shift+клик · лопата снимает растение"
        : "Выбери растение сверху и кликни по клетке";
    renderSeedBar();
    updateHud();
    lastTs = performance.now();
    animId = requestAnimationFrame(frame);
    showToast(
      state.test
        ? "Тест включён: ∞ косилки и солнце"
        : state.mode === "coop"
          ? "Кооп: сажайте вместе!"
          : "Защищай грядки!"
    );
  }

  function updateHud() {
    els.sunText.textContent = state.test ? "∞" : String(Math.floor(state.sun));
    els.waveText.textContent = `Волна ${state.wave}/${MAX_WAVES}`;
  }

  function renderSeedBar() {
    els.seedBar.innerHTML = "";
    STARTER_LOADOUT.forEach((id) => {
      const p = COMBAT[id];
      if (!p) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seed";
      const cd = state.cooldown[id] || 0;
      if (cd > 0) btn.classList.add("cd");
      if (state.selectedP1 === id) btn.classList.add("active-p1");
      if (state.mode === "coop" && state.selectedP2 === id) btn.classList.add("active-p2");
      btn.innerHTML = `<span class="ic">${p.icon}</span>${p.name}<span class="cost">☀️${p.sunCost}</span>${
        state.mode === "coop"
          ? `<span class="who">${state.selectedP1 === id ? "P1" : ""}${
              state.selectedP2 === id ? (state.selectedP1 === id ? "+P2" : "P2") : ""
            }</span>`
          : ""
      }`;
      btn.title = `${p.name} · ${(p.types || []).map((t) => typeName[t] || t).join(", ")}`;
      btn.addEventListener("click", (e) => {
        shovel = false;
        if (state.mode === "coop" && (e.shiftKey || e.button === 2)) {
          state.selectedP2 = id;
        } else if (state.mode === "coop" && e.altKey) {
          state.selectedP2 = id;
        } else {
          state.selectedP1 = id;
        }
        renderSeedBar();
      });
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (state.mode === "coop") {
          state.selectedP2 = id;
          shovel = false;
          renderSeedBar();
        }
      });
      els.seedBar.appendChild(btn);
    });
  }

  function spawnZombie(forcedType) {
    const pool = ["normal", "normal", "cone", "runner", "bucket"];
    const kind = forcedType || pool[Math.floor(Math.random() * pool.length)];
    const row = Math.floor(Math.random() * ROWS);
    const allergy = Math.random() < ALLERGY_CHANCE;
    const base = {
      normal: { hp: 120, speed: 22, damage: 20, icon: "🧟", name: "Обычный" },
      runner: { hp: 80, speed: 38, damage: 14, icon: "🏃🧟", name: "Быстрый" },
      cone: { hp: 220, speed: 20, damage: 20, icon: "🔶🧟", name: "С конусом" },
      bucket: { hp: 420, speed: 14, damage: 28, icon: "🪣🧟", name: "С ведром" },
    }[kind];
    const z = {
      id: Math.random().toString(36).slice(2),
      kind,
      row,
      x: LEFT + COLS * CELL_W + 20,
      hp: base.hp + state.wave * 18,
      maxHp: base.hp + state.wave * 18,
      speed: base.speed,
      damage: base.damage,
      icon: allergy ? "🥜😵🧟" : base.icon,
      name: allergy ? `${base.name} (аллергия на орехи)` : base.name,
      biteCd: 0,
      slow: 0,
      burn: 0,
      nutAllergy: allergy,
      dead: false,
    };
    state.zombies.push(z);
    if (allergy) showToast("Зомби с аллергией на орехи! (10%)");
  }

  function addFx(text, x, y, color) {
    state.fx.push({ text, x, y, color: color || "#fff", life: 1 });
  }

  function explodeAt(row, col, radius, damage) {
    for (let r = row - radius; r <= row + radius; r++) {
      for (let c = col - radius; c <= col + radius; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        const rect = cellRect(r, c);
        state.zombies.forEach((z) => {
          if (z.dead || z.row !== r) return;
          if (z.x >= rect.x - 10 && z.x <= rect.x + rect.w + 10) {
            z.hp -= damage;
          }
        });
      }
    }
    addFx("БУМ", cellRect(row, col).x + 30, cellRect(row, col).y + 30, "#ff8866");
  }

  function freezeZombies(row, all) {
    state.zombies.forEach((z) => {
      if (z.dead) return;
      if (!all && z.row !== row) return;
      z.slow = Math.max(z.slow, 3.5);
      z.speed *= 0.2;
    });
    addFx("❄", LEFT + 200, cellRect(row, 4).y + 40, "#9fdfff");
  }

  function placePlant(typeId, row, col, player) {
    const type = COMBAT[typeId];
    if (!type) return;
    if ((state.cooldown[typeId] || 0) > 0) {
      showToast("Ещё перезарядка");
      return;
    }
    if (!state.test && state.sun < type.sunCost) {
      showToast("Мало солнца");
      return;
    }
    if (plantAt(row, col)) {
      showToast("Клетка занята");
      return;
    }

    if (!state.test) state.sun -= type.sunCost;
    state.cooldown[typeId] = state.test ? Math.min(1.2, type.recharge * 0.25) : type.recharge;

    if (type.instant) {
      if (type.role === "bomb" || type.role === "mint") {
        explodeAt(row, col, type.aoe || 1, type.damage);
      } else if (type.role === "rowbomb") {
        state.zombies.forEach((z) => {
          if (!z.dead && z.row === row) z.hp -= type.damage;
        });
        addFx("🔥РЯД", cellRect(row, 4).x, cellRect(row, 4).y + 20, "#ff6633");
      } else if (type.role === "freeze") {
        freezeZombies(row, type.aoe >= 9);
      }
      updateHud();
      renderSeedBar();
      showToast(`${player}: ${type.name}`);
      return;
    }

    const plant = {
      id: Math.random().toString(36).slice(2),
      typeId,
      row,
      col,
      hp: type.hp,
      maxHp: type.hp,
      cd: type.role === "mine" ? 8 : 0.4,
      sunCd: type.sunEvery || 0,
      armed: type.role !== "mine",
      dead: false,
      owner: player,
    };
    state.plants.push(plant);
    updateHud();
    renderSeedBar();
  }

  function tryShovel(row, col) {
    const p = plantAt(row, col);
    if (!p) return;
    p.dead = true;
    state.plants = state.plants.filter((x) => !x.dead);
    showToast("Растение убрано");
  }

  function canvasToCell(clientX, clientY) {
    const rect = els.canvas.getBoundingClientRect();
    const sx = els.canvas.width / rect.width;
    const sy = els.canvas.height / rect.height;
    const x = (clientX - rect.left) * sx;
    const y = (clientY - rect.top) * sy;
    const col = Math.floor((x - LEFT) / CELL_W);
    const row = Math.floor((y - TOP) / CELL_H);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return { row, col };
  }

  function shootFrom(plant, type) {
    const rect = cellRect(plant.row, plant.col);
    const mk = (row, extra = {}) => ({
      row,
      x: rect.x + rect.w * 0.7,
      y: rect.y + rect.h * 0.45,
      speed: type.lob ? 160 : 220,
      damage: type.damage,
      pierce: type.pierce || 1,
      slow: type.slow || 0,
      burn: type.burn || 0,
      chain: type.chain || 0,
      lob: !!type.lob,
      color:
        type.types.includes("fire")
          ? "#ff6a2a"
          : type.types.includes("ice")
            ? "#7ecbff"
            : type.types.includes("electric")
              ? "#ffe566"
              : type.types.includes("shadow")
                ? "#a56bff"
                : "#7dff6a",
      hit: new Set(),
      ...extra,
    });

    if (type.role === "breath") {
      state.zombies.forEach((z) => {
        if (z.dead || z.row < plant.row - 1 || z.row > plant.row + 1) return;
        if (z.x < rect.x || z.x > rect.x + CELL_W * 3.2) return;
        z.hp -= type.damage;
        z.burn = Math.max(z.burn, 2);
      });
      addFx("🔥", rect.x + 50, rect.y + 30, "#ff7744");
      return;
    }

    if (type.melee || type.role === "melee") {
      let hit = false;
      state.zombies.forEach((z) => {
        if (z.dead || z.row !== plant.row) return;
        if (z.x > rect.x - 10 && z.x < rect.x + CELL_W * 1.6) {
          z.hp -= type.damage;
          hit = true;
        }
      });
      if (hit) addFx("👊", rect.x + 40, rect.y + 30, "#ffe0a0");
      return;
    }

    if (type.role === "fume" || type.role === "electric") {
      const sorted = state.zombies
        .filter((z) => !z.dead && z.row === plant.row && z.x >= rect.x)
        .sort((a, b) => a.x - b.x);
      let left = type.pierce || 3;
      for (const z of sorted) {
        if (left <= 0) break;
        z.hp -= type.damage;
        if (type.slow) z.slow = Math.max(z.slow, type.slow * 4);
        if (type.burn) z.burn = Math.max(z.burn, 2);
        left -= 1;
      }
      if (type.role === "electric") addFx("⚡", rect.x + 60, rect.y + 25, "#ffe566");
      return;
    }

    const rows =
      type.id.includes("threepeater")
        ? [plant.row - 1, plant.row, plant.row + 1].filter((r) => r >= 0 && r < ROWS)
        : [plant.row];
    rows.forEach((r) => state.projectiles.push(mk(r)));
    if (type.id.includes("repeater") || type.id.includes("split-pea")) {
      state.projectiles.push(mk(plant.row, { x: rect.x + rect.w * 0.55 }));
    }
  }

  function updatePlants(dt) {
    state.plants.forEach((plant) => {
      const type = COMBAT[plant.typeId];
      if (!type || plant.dead) return;
      plant.cd -= dt;
      if (!plant.armed) {
        plant.cd -= dt;
        if (plant.cd <= 0) {
          plant.armed = true;
          addFx("✓", cellRect(plant.row, plant.col).x + 30, cellRect(plant.row, plant.col).y + 20, "#c6ff9a");
        }
      }

      if (type.role === "sun" && type.generateSun) {
        plant.sunCd -= dt;
        if (plant.sunCd <= 0) {
          plant.sunCd = type.sunEvery;
          const rect = cellRect(plant.row, plant.col);
          state.suns.push({
            x: rect.x + 30 + Math.random() * 20,
            y: rect.y + 20,
            value: type.generateSun,
            life: 8,
          });
        }
      }

      if (type.role === "spike" || type.ground) {
        const rect = cellRect(plant.row, plant.col);
        state.zombies.forEach((z) => {
          if (z.dead || z.row !== plant.row) return;
          if (z.x > rect.x && z.x < rect.x + rect.w) z.hp -= type.damage * dt;
        });
      }

      if (type.role === "mine" && plant.armed) {
        const rect = cellRect(plant.row, plant.col);
        const victim = state.zombies.find(
          (z) => !z.dead && z.row === plant.row && z.x > rect.x && z.x < rect.x + rect.w
        );
        if (victim) {
          explodeAt(plant.row, plant.col, 1, type.damage);
          plant.dead = true;
        }
      }

      if (type.role === "trap") {
        const rect = cellRect(plant.row, plant.col);
        const victim = state.zombies.find(
          (z) => !z.dead && z.row === plant.row && z.x > rect.x && z.x < rect.x + rect.w
        );
        if (victim) {
          victim.hp = 0;
          plant.dead = true;
          addFx("🌊", rect.x + 30, rect.y + 30, "#7ecbff");
        }
      }

      const canShoot = ["shooter", "lobber", "breath", "melee", "fume", "electric"].includes(type.role);
      if (canShoot && plant.cd <= 0) {
        const hasTarget = state.zombies.some(
          (z) =>
            !z.dead &&
            (type.role === "breath"
              ? Math.abs(z.row - plant.row) <= 1
              : type.id.includes("threepeater")
                ? Math.abs(z.row - plant.row) <= 1
                : z.row === plant.row) &&
            z.x >= cellRect(plant.row, plant.col).x
        );
        if (hasTarget || type.role === "melee") {
          shootFrom(plant, type);
          plant.cd = type.shootEvery;
        }
      }
    });
    state.plants = state.plants.filter((p) => !p.dead && p.hp > 0);
  }

  function updateZombies(dt) {
    state.zombies.forEach((z) => {
      if (z.dead) return;
      if (z.burn > 0) {
        z.burn -= dt;
        z.hp -= 12 * dt;
      }
      if (z.slow > 0) z.slow -= dt;

      const speedMul = z.slow > 0 ? 0.45 : 1;
      const plant = state.plants
        .filter((p) => !p.dead && p.row === z.row && !COMBAT[p.typeId]?.ground)
        .find((p) => {
          const rect = cellRect(p.row, p.col);
          return z.x <= rect.x + rect.w * 0.75 && z.x >= rect.x - 8;
        });

      if (plant) {
        const type = COMBAT[plant.typeId];
        z.biteCd -= dt;
        if (z.biteCd <= 0) {
          z.biteCd = 1;
          if (z.nutAllergy && type?.nut) {
            z.hp = 0;
            z.dead = true;
            addFx("АЛЛЕРГИЯ!", cellRect(plant.row, plant.col).x, cellRect(plant.row, plant.col).y, "#ffd27a");
            showToast("Зомби съел орех и умер от аллергии!");
            return;
          }
          plant.hp -= z.damage;
          if (plant.hp <= 0) plant.dead = true;
        }
      } else {
        z.x -= z.speed * speedMul * dt;
      }

      if (z.x < LEFT - 20) {
        const mower = state.mowers[z.row];
        if (mower && (!mower.used || state.test)) {
          if (!state.test) mower.used = true;
          mower.active = true;
          state.zombies.forEach((zz) => {
            if (!zz.dead && zz.row === z.row) zz.hp = 0;
          });
          showToast(
            state.test
              ? `∞ Косилка снова спасла ряд ${z.row + 1}`
              : `Косилка спасла ряд ${z.row + 1}`
          );
          if (state.test) {
            // бесконечные косилки: сразу снова доступны
            mower.used = false;
            mower.active = false;
          }
        } else {
          endGame(false, "Зомби прорвались. Косилки больше нет.");
        }
      }
      if (z.hp <= 0) {
        z.dead = true;
        state.fallen += 1;
        if (Math.random() < 0.18) {
          state.suns.push({ x: z.x, y: cellRect(z.row, 0).y + 30, value: 25, life: 7 });
        }
      }
    });
    state.zombies = state.zombies.filter((z) => !z.dead);
  }

  function updateProjectiles(dt) {
    state.projectiles.forEach((pr) => {
      pr.x += pr.speed * dt;
      for (const z of state.zombies) {
        if (z.dead || z.row !== pr.row || pr.hit.has(z.id)) continue;
        if (Math.abs(z.x - pr.x) < 28) {
          z.hp -= pr.damage;
          if (pr.slow) z.slow = Math.max(z.slow, pr.slow * 5);
          if (pr.burn) z.burn = Math.max(z.burn, 2.2);
          pr.hit.add(z.id);
          pr.pierce -= 1;
          if (pr.chain > 0) {
            const next = state.zombies.find(
              (o) => !o.dead && o.row === z.row && o.x > z.x && !pr.hit.has(o.id)
            );
            if (next) {
              next.hp -= pr.damage * 0.7;
              pr.hit.add(next.id);
            }
            pr.chain -= 1;
          }
          if (pr.pierce <= 0) pr.dead = true;
          break;
        }
      }
      if (pr.x > LEFT + COLS * CELL_W + 40) pr.dead = true;
    });
    state.projectiles = state.projectiles.filter((p) => !p.dead);
  }

  function updateSuns(dt) {
    state.suns.forEach((s) => {
      s.life -= dt;
      s.y += 8 * dt;
    });
    state.suns = state.suns.filter((s) => s.life > 0);
  }

  function updateWaves(dt) {
    Object.keys(state.cooldown).forEach((id) => {
      state.cooldown[id] = Math.max(0, state.cooldown[id] - dt);
    });

    if (state.zombiesLeft > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnZombie();
        state.zombiesLeft -= 1;
        state.spawnTimer = Math.max(0.8, 2.4 - state.wave * 0.15);
      }
    } else if (state.zombies.length === 0) {
      state.waveTimer += dt;
      if (state.waveTimer > 1.6) {
        state.waveTimer = 0;
        if (state.wave >= MAX_WAVES) {
          endGame(true, `Победа! Побеждено зомби: ${state.fallen}`);
          return;
        }
        state.wave += 1;
        state.zombiesLeft = 5 + state.wave * 2;
        showToast(`Волна ${state.wave}!`);
        updateHud();
      }
    }

    // passive sky sun
    state._sky = (state._sky || 0) + dt;
    if (state._sky > 9) {
      state._sky = 0;
      state.suns.push({
        x: LEFT + 40 + Math.random() * (COLS * CELL_W - 80),
        y: 10,
        value: 25,
        life: 9,
        falling: true,
      });
    }
  }

  function updateFx(dt) {
    state.fx.forEach((f) => {
      f.life -= dt;
      f.y -= 18 * dt;
    });
    state.fx = state.fx.filter((f) => f.life > 0);
  }

  function draw() {
    const w = els.canvas.width;
    const h = els.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // lawn
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const rect = cellRect(r, c);
        ctx.fillStyle = (r + c) % 2 === 0 ? "#4f9a3c" : "#3f8532";
        ctx.fillRect(rect.x, rect.y, rect.w - 2, rect.h - 2);
      }
    }

    // house strip
    ctx.fillStyle = "#6b4a2e";
    ctx.fillRect(0, TOP, LEFT - 8, ROWS * CELL_H);
    ctx.fillStyle = "#f0e2c0";
    ctx.font = "800 12px Nunito";
    ctx.fillText("ДОМ", 16, TOP + ROWS * CELL_H * 0.5);

    state.mowers.forEach((m) => {
      if (m.used && !m.active) return;
      ctx.font = "28px sans-serif";
      ctx.fillText("🚜", 8, TOP + m.row * CELL_H + 55);
    });

    state.plants.forEach((p) => {
      const type = COMBAT[p.typeId];
      const rect = cellRect(p.row, p.col);
      ctx.font = "34px sans-serif";
      ctx.fillText(type.icon || "🌱", rect.x + 22, rect.y + 55);
      if (type.nut) {
        ctx.font = "800 10px Nunito";
        ctx.fillStyle = "#ffe7a8";
        ctx.fillText("орех", rect.x + 24, rect.y + 72);
      }
      // hp bar
      const pct = Math.max(0, p.hp / p.maxHp);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(rect.x + 10, rect.y + 8, rect.w - 24, 5);
      ctx.fillStyle = pct > 0.35 ? "#8fd35a" : "#e85a3a";
      ctx.fillRect(rect.x + 10, rect.y + 8, (rect.w - 24) * pct, 5);
      if (!p.armed) {
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.fillRect(rect.x + 18, rect.y + 40, 50, 12);
        ctx.fillStyle = "#fff";
        ctx.font = "800 10px Nunito";
        ctx.fillText("заряд…", rect.x + 22, rect.y + 50);
      }
    });

    state.zombies.forEach((z) => {
      ctx.font = "32px sans-serif";
      ctx.fillText(z.icon, z.x - 10, cellRect(z.row, 0).y + 55);
      const pct = Math.max(0, z.hp / z.maxHp);
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.fillRect(z.x - 12, cellRect(z.row, 0).y + 14, 40, 5);
      ctx.fillStyle = z.nutAllergy ? "#ffd27a" : "#e85a3a";
      ctx.fillRect(z.x - 12, cellRect(z.row, 0).y + 14, 40 * pct, 5);
      if (z.nutAllergy) {
        ctx.fillStyle = "#ffe7a8";
        ctx.font = "800 9px Nunito";
        ctx.fillText("аллерг.", z.x - 8, cellRect(z.row, 0).y + 12);
      }
    });

    state.projectiles.forEach((pr) => {
      ctx.beginPath();
      ctx.fillStyle = pr.color;
      ctx.arc(pr.x, pr.y, pr.lob ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
    });

    state.suns.forEach((s) => {
      ctx.font = "28px sans-serif";
      ctx.fillText("☀️", s.x, s.y + 20);
    });

    state.fx.forEach((f) => {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = "800 16px Nunito";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });
  }

  function frame(ts) {
    if (!state.running) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    updateWaves(dt);
    if (!state.running) return;
    updatePlants(dt);
    updateZombies(dt);
    updateProjectiles(dt);
    updateSuns(dt);
    updateFx(dt);
    if (Math.floor(ts / 250) !== Math.floor((ts - dt * 1000) / 250)) renderSeedBar();
    updateHud();
    draw();
    animId = requestAnimationFrame(frame);
  }

  // Almanac
  function renderFilters() {
    els.typeFilters.innerHTML = "";
    typesMeta.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "type-btn" + (t.id === activeType ? " active" : "");
      const count =
        t.id === "all"
          ? plantsCatalog.length
          : plantsCatalog.filter((p) => (p.types || []).includes(t.id)).length;
      btn.textContent = `${t.icon} ${t.name} (${count})`;
      btn.addEventListener("click", () => {
        activeType = t.id;
        renderFilters();
        renderAlmanacGrid();
      });
      els.typeFilters.appendChild(btn);
    });
  }

  function renderAlmanacGrid() {
    const q = (els.plantSearch.value || "").trim().toLowerCase();
    const list = plantsCatalog.filter((p) => {
      if (activeType !== "all" && !(p.types || []).includes(activeType)) return false;
      if (!q) return true;
      return `${p.name} ${p.en} ${p.worldRu} ${(p.types || []).join(" ")}`
        .toLowerCase()
        .includes(q);
    });
    els.almanacSub.textContent = `Показано ${list.length} из ${plantsCatalog.length}`;
    els.plantGrid.innerHTML = "";
    if (!list.length) {
      els.plantGrid.innerHTML = `<div class="empty">Ничего не найдено</div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((p) => {
      const card = document.createElement("article");
      card.className = "plant-card";
      const tags = (p.types || [])
        .map((t) => `<span class="tag ${t}">${typeName[t] || t}</span>`)
        .join("");
      card.innerHTML = `
        <div class="emoji">${p.icon || "🌱"}</div>
        <h3>${p.name}</h3>
        <div class="en">${p.en}</div>
        <div class="meta">☀️ ${parseSun(p.sun)} · ⏱ ${p.recharge}с · ${p.worldRu}</div>
        <div class="tags">${tags}</div>
      `;
      card.addEventListener("click", () => showToast(`${p.name}: ${(p.types || []).map((t) => typeName[t] || t).join(", ")}`));
      frag.appendChild(card);
    });
    els.plantGrid.appendChild(frag);
  }

  // Events
  document.getElementById("btnPlay").addEventListener("click", startGame);
  document.getElementById("btnAlmanac").addEventListener("click", () => {
    showScreen("almanac");
    renderFilters();
    renderAlmanacGrid();
  });
  document.getElementById("btnBackMenu").addEventListener("click", showMenu);
  document.getElementById("btnAgain").addEventListener("click", startGame);
  document.getElementById("btnEndMenu").addEventListener("click", showMenu);
  document.getElementById("btnQuit").addEventListener("click", showMenu);
  document.getElementById("btnShovel").addEventListener("click", () => {
    shovel = !shovel;
    showToast(shovel ? "Лопата включена" : "Лопата выключена");
  });
  els.plantSearch.addEventListener("input", renderAlmanacGrid);

  els.canvas.addEventListener("click", (e) => {
    if (!state.running) return;
    const rect = els.canvas.getBoundingClientRect();
    const sx = els.canvas.width / rect.width;
    const sy = els.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    const sun = state.suns.find((s) => Math.hypot(s.x + 10 - x, s.y + 10 - y) < 40);
    if (sun) {
      state.sun += sun.value;
      sun.life = 0;
      updateHud();
      return;
    }
    const cell = canvasToCell(e.clientX, e.clientY);
    if (!cell) return;
    if (shovel) {
      tryShovel(cell.row, cell.col);
      return;
    }
    const player2 = state.mode === "coop" && e.shiftKey;
    const typeId = player2 ? state.selectedP2 : state.selectedP1;
    placePlant(typeId, cell.row, cell.col, player2 ? "Игрок 2" : "Игрок 1");
  });

  if (els.plantCount) {
    els.plantCount.textContent = `Растений в альманахе: ${plantsCatalog.length}`;
  }
  renderFilters();
})();
