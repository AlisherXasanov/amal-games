(() => {
  const W = 960;
  const H = 640;
  const STORAGE = "kick-buddy-v3";
  const FLOOR = H - 52;
  const GRAVITY = 2200;

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

  const PHRASES = [
    "Привет!",
    "Поиграй со мной!",
    "Мне это нравится!",
    "Давай ещё разок!",
    "Я Бади!",
    "Подбрось меня повыше!",
    "Как круто!",
    "Я умею прыгать!",
    "Может, новую одёжку?",
    "Ты самый лучший!",
    "Смотри, я хожу!",
    "Кидай меня в сторону!",
    "Ай, щекотно!",
    "Сильнее оружие — больше монет!",
    "Не скучай!",
    "Я всё ещё тут!",
    "Расскажу ещё что-нибудь!",
    "Хочешь поговорить?",
    "Я могу болтать без остановки!",
    "Слушай, это весело!",
    "Ещё фразу!",
    "Админ крутой!",
    "Шериф на месте!",
    "Купи бомбу — будет бабах!",
    "Огонь горячий!",
    "Лёд холодный!",
    "Я не замолкаю!",
  ];

  // Strength ladder: more dmg + coinMul → more coins per hit
  // ranged: click anywhere — projectile flies to that point
  const WEAPONS = [
    { id: "hand", name: "Рука", cost: 0, dmg: 0, coinMul: 0, knock: 0, element: "none", color: "#c4a060", desc: "Только двигать и кидать" },
    { id: "slap", name: "Пощёчина", cost: 30, dmg: 8, coinMul: 1, knock: 280, element: "none", color: "#e8a060", desc: "Слабый удар, мало монет" },
    { id: "bat", name: "Бита", cost: 90, dmg: 18, coinMul: 1.4, knock: 520, element: "none", color: "#8a5a28", desc: "Сильнее пощёчины" },
    { id: "sling", name: "Рогатка", cost: 130, dmg: 26, coinMul: 1.6, knock: 480, element: "none", color: "#6a8a40", ranged: true, proj: "pebble", speed: 920, size: 5, cd: 0.28, desc: "Кликни куда угодно — камень летит туда" },
    { id: "fire", name: "Огонь", cost: 180, dmg: 36, coinMul: 1.8, knock: 400, element: "fire", color: "#e05030", desc: "Стихия огня · поджог" },
    { id: "ice", name: "Лёд", cost: 220, dmg: 40, coinMul: 2, knock: 360, element: "ice", color: "#5ec8e8", desc: "Стихия льда · заморозка" },
    { id: "poison", name: "Яд", cost: 260, dmg: 28, coinMul: 2.1, knock: 300, element: "poison", color: "#6aaa3a", desc: "Яд · урон со временем" },
    { id: "shock", name: "Молния", cost: 320, dmg: 55, coinMul: 2.4, knock: 600, element: "shock", color: "#f1c40f", desc: "Электричество · сильный отброс" },
    { id: "wind", name: "Ветер", cost: 360, dmg: 48, coinMul: 2.5, knock: 1100, element: "wind", color: "#a8d8ff", desc: "Сносит Бади далеко" },
    { id: "lasso", name: "Лассо шерифа", cost: 400, dmg: 60, coinMul: 2.7, knock: 200, element: "lasso", color: "#c4a060", desc: "Шерифское · тянет и бьёт" },
    { id: "revolver", name: "Револьвер", cost: 450, dmg: 75, coinMul: 2.9, knock: 700, element: "none", color: "#4a4a50", ranged: true, proj: "bullet", speed: 1400, size: 4, cd: 0.16, desc: "Кликни в стену/Бади — пуля летит" },
    { id: "shotgun", name: "Дробовик", cost: 520, dmg: 28, coinMul: 2.6, knock: 650, element: "none", color: "#6a5040", ranged: true, exclusive: true, proj: "pellet", speed: 1100, size: 3, cd: 0.45, pellets: 6, spread: 0.22, desc: "Эксклюзив · дробь веером" },
    { id: "uzi", name: "Пистолет-пулемёт", cost: 580, dmg: 22, coinMul: 2.5, knock: 420, element: "none", color: "#5a5a60", ranged: true, exclusive: true, proj: "bullet", speed: 1250, size: 3, cd: 0.07, auto: true, spread: 0.08, desc: "Эксклюзив · зажми и строй очередь" },
    { id: "machinegun", name: "Пулемёт", cost: 720, dmg: 30, coinMul: 2.8, knock: 520, element: "none", color: "#3a4a3a", ranged: true, exclusive: true, proj: "bullet", speed: 1350, size: 4, cd: 0.05, auto: true, spread: 0.12, desc: "Эксклюзив · зажми ЛКМ — очередь" },
    { id: "sniper", name: "Снайперка", cost: 800, dmg: 140, coinMul: 3.4, knock: 900, element: "none", color: "#2a4a2a", ranged: true, exclusive: true, proj: "bullet", speed: 2200, size: 3, cd: 0.7, desc: "Эксклюзив · точный дальний выстрел" },
    { id: "bazooka", name: "Базука", cost: 950, dmg: 160, coinMul: 3.8, knock: 1200, element: "bomb", color: "#5a6a40", ranged: true, exclusive: true, proj: "rocket", speed: 620, size: 10, cd: 0.85, explode: true, explodeR: 95, desc: "Эксклюзив · кликни в стену — ракета летит и бахает" },
    { id: "flamethrower", name: "Огнемёт", cost: 880, dmg: 18, coinMul: 2.7, knock: 280, element: "fire", color: "#e05030", ranged: true, exclusive: true, proj: "flame", speed: 480, size: 14, cd: 0.04, auto: true, spread: 0.18, life: 0.55, desc: "Эксклюзив · зажми — струя огня" },
    { id: "minigun", name: "Миниган", cost: 1400, dmg: 38, coinMul: 3.2, knock: 580, element: "none", color: "#2a2a30", ranged: true, exclusive: true, proj: "bullet", speed: 1500, size: 4, cd: 0.03, auto: true, spread: 0.16, desc: "Эксклюзив · бешеный темп огня" },
    { id: "railgun", name: "Рельсотрон", cost: 1600, dmg: 220, coinMul: 4.2, knock: 1500, element: "shock", color: "#3de7ff", ranged: true, exclusive: true, proj: "laser", speed: 2800, size: 6, cd: 0.9, desc: "Эксклюзив · луч сквозь комнату" },
    { id: "bomb", name: "Бомба", cost: 480, dmg: 90, coinMul: 3, knock: 900, element: "bomb", color: "#3a3a3a", desc: "Взрыв · много монет" },
    { id: "meteor", name: "Метеор", cost: 750, dmg: 130, coinMul: 3.6, knock: 1000, element: "fire", color: "#c44a10", desc: "Огненный удар с неба" },
    { id: "admin", name: "Молот админа", cost: 900, dmg: 160, coinMul: 4, knock: 1200, element: "shock", color: "#a78bfa", desc: "Для админа команды" },
    { id: "nuke", name: "Супербомба", cost: 1200, dmg: 200, coinMul: 4.5, knock: 1400, element: "nuke", color: "#3a9a4a", desc: "Максимум силы и монет" },
  ];

  const CLOTHES = [
    { id: "none", name: "Без одежды", cost: 0, kind: "shirt", draw: null, desc: "Снять футболку · просто мешок" },
    { id: "tee_red", name: "Красная футболка", cost: 40, kind: "shirt", color: "#e05030", desc: "Яркая классика" },
    { id: "tee_blue", name: "Синяя футболка", cost: 40, kind: "shirt", color: "#3a7abd", desc: "Спокойный стиль" },
    { id: "tee_target", name: "Футболка-мишень", cost: 80, kind: "shirt", color: "#fff8f0", target: true, desc: "Как в ролике" },
    { id: "hoodie", name: "Толстовка", cost: 120, kind: "shirt", color: "#5a3a8a", hoodie: true, desc: "Уютно" },
    { id: "cap", name: "Кепка", cost: 60, kind: "hat", color: "#2a6a3a", desc: "На голову" },
    { id: "crown", name: "Корона", cost: 200, kind: "hat", color: "#e8a820", crown: true, desc: "Царь Бади" },
    { id: "scarf", name: "Шарф", cost: 70, kind: "extra", color: "#e05030", desc: "На шею" },
    { id: "glasses", name: "Очки", cost: 90, kind: "extra", glasses: true, desc: "Умный вид" },
  ];

  const BUDDIES = [
    {
      id: "SkinAdminBuffer",
      name: "SkinAdminBuffer",
      cost: 5000,
      cloth: "#d4b8ff",
      dark: "#6d28d9",
      eye: "#fde68a",
      exclusive: true,
      premium: true,
      desc: "★ №1 эксклюзив · самый дорогой и красивый админ-скин",
    },
    { id: "classic", name: "Классика", cost: 0, cloth: "#c4a060", dark: "#a88848", eye: "#1a1410", desc: "Обычный тряпичный Бади" },
    { id: "snow", name: "Снежный", cost: 120, cloth: "#e8f0f8", dark: "#b8c8d8", eye: "#3a5080", desc: "Белый зимний Бади" },
    { id: "mint", name: "Мятный", cost: 150, cloth: "#7dcea0", dark: "#54996f", eye: "#1a4030", desc: "Зелёный скин" },
    { id: "berry", name: "Ягодный", cost: 150, cloth: "#e07090", dark: "#a04060", eye: "#401020", desc: "Розовый скин" },
    { id: "robot", name: "Робот", cost: 280, cloth: "#8a94a8", dark: "#5a6478", eye: "#3de7ff", desc: "Металлический тип" },
    { id: "shadow", name: "Тень", cost: 320, cloth: "#3a3548", dark: "#1a1528", eye: "#a78bfa", desc: "Тёмный тип Бади" },
    { id: "sheriff", name: "Шериф", cost: 400, cloth: "#d4b070", dark: "#8a6830", eye: "#2a1c08", star: true, desc: "Шерифский Бади" },
    { id: "zombie", name: "Зомби", cost: 450, cloth: "#6a9a58", dark: "#3a6030", eye: "#c0ff40", desc: "Гнилой тип Бади" },
    { id: "fire", name: "Огненный", cost: 550, cloth: "#e07040", dark: "#902010", eye: "#ffe080", desc: "Горячий скин" },
    { id: "gold", name: "Золотой", cost: 800, cloth: "#f0d060", dark: "#c09020", eye: "#5a3800", desc: "Легендарный скин" },
  ];

  const old = store.get("kick-buddy-v2", null);
  const save = store.get(STORAGE, old ? {
    coins: old.coins || 80,
    owned: old.owned || ["none"],
    shirt: old.shirt || "none",
    hat: old.hat || null,
    extra: old.extra || null,
    ownedWeapons: old.ownedWeapons || ["hand"],
    weapon: old.weapon || "hand",
    mute: !!old.mute,
    buddyType: "classic",
    ownedBuddies: ["classic"],
    infDmg: false,
    infCoins: false,
    godMode: false,
    giant: false,
  } : {
    coins: 100,
    owned: ["none"],
    shirt: "none",
    hat: null,
    extra: null,
    ownedWeapons: ["hand"],
    weapon: "hand",
    mute: false,
    buddyType: "classic",
    ownedBuddies: ["classic"],
    infDmg: false,
    infCoins: false,
    godMode: false,
    giant: false,
  });
  if (!save.owned) save.owned = ["none"];
  if (!save.owned.includes("none")) save.owned.push("none");
  if (!save.ownedWeapons) save.ownedWeapons = ["hand"];
  if (!save.ownedWeapons.includes("hand")) save.ownedWeapons.push("hand");
  if (!save.ownedBuddies) save.ownedBuddies = ["classic"];
  if (!save.ownedBuddies.includes("classic")) save.ownedBuddies.push("classic");
  // migrate old admin skin id → SkinAdminBuffer
  if (save.buddyType === "admin") save.buddyType = "SkinAdminBuffer";
  save.ownedBuddies = [...new Set(save.ownedBuddies.map((id) => (id === "admin" ? "SkinAdminBuffer" : id)))];
  if (!BUDDIES.find((b) => b.id === save.buddyType)) save.buddyType = "classic";
  if (!WEAPONS.find((w) => w.id === save.weapon)) save.weapon = "hand";
  if (typeof save.mute !== "boolean") save.mute = false;
  if (typeof save.infDmg !== "boolean") save.infDmg = false;
  if (typeof save.infCoins !== "boolean") save.infCoins = false;
  if (typeof save.godMode !== "boolean") save.godMode = false;
  if (typeof save.giant !== "boolean") save.giant = false;

  // Infinite-damage admin weapon (unlocked via admin panel)
  if (!WEAPONS.find((w) => w.id === "infdmg")) {
    WEAPONS.push({
      id: "infdmg",
      name: "∞ Урон",
      cost: 0,
      dmg: 99999,
      coinMul: 10,
      knock: 1600,
      element: "nuke",
      color: "#ff0044",
      desc: "Админ-команда: бесконечный урон",
      cheat: true,
    });
  }

  function persist() {
    store.set(STORAGE, {
      coins: save.coins,
      owned: save.owned,
      shirt: save.shirt,
      hat: save.hat,
      extra: save.extra,
      ownedWeapons: save.ownedWeapons,
      weapon: save.weapon,
      mute: save.mute,
      buddyType: save.buddyType,
      ownedBuddies: save.ownedBuddies,
      infDmg: save.infDmg,
      infCoins: save.infCoins,
      godMode: save.godMode,
      giant: save.giant,
    });
  }

  function itemById(id) {
    return CLOTHES.find((c) => c.id === id) || CLOTHES[0];
  }

  function weaponById(id) {
    return WEAPONS.find((w) => w.id === id) || WEAPONS[0];
  }

  function buddyById(id) {
    return BUDDIES.find((b) => b.id === id) || BUDDIES[0];
  }

  function effectiveWeapon() {
    const w = weaponById(save.weapon);
    if (save.infDmg && w.id !== "hand") {
      return { ...w, dmg: Math.max(w.dmg, 99999), coinMul: Math.max(w.coinMul, 10), knock: Math.max(w.knock, 1400) };
    }
    return w;
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
  hud.innerHTML = `
    <div class="pill hp"><span class="label">Бади</span><span class="value" id="h-hp">100</span></div>
    <div class="pill coins"><span class="label">Монеты</span><span class="value" id="h-coins">0</span></div>
    <div class="pill weapon"><span class="label">Оружие</span><span class="value" id="h-weapon">Рука</span></div>
  `;
  screen.appendChild(hud);

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Рука — таскай · Ближний — удар по Бади · Стрельба — клик в стену/пол";
  screen.appendChild(hint);

  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  toolbar.innerHTML = `
    <button class="btn ghost" id="btn-shop">Одежда</button>
    <button class="btn ghost" id="btn-buddies">Типы Бади</button>
    <button class="btn danger" id="btn-weapons">Оружие</button>
    <button class="btn ghost" id="btn-mute">${save.mute ? "Бади молчит" : "Бади болтает"}</button>
    <button class="btn" id="btn-say">Сказать</button>
    <button class="btn" id="btn-listen">Слушать</button>
    <button class="btn" id="btn-jump">Прыг!</button>
    <button class="btn danger" id="btn-admin">Админ</button>
    <button class="btn danger" id="btn-revive" hidden>Оживить Бади</button>
  `;
  screen.appendChild(toolbar);

  const overlay = document.createElement("div");
  overlay.className = "overlay hidden";
  screen.appendChild(overlay);

  const el = {
    hp: hud.querySelector("#h-hp"),
    coins: hud.querySelector("#h-coins"),
    weapon: hud.querySelector("#h-weapon"),
  };

  const buddy = {
    x: W / 2,
    y: FLOOR - 70,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 1,
    squat: 0,
    armPhase: 0,
    blink: 0,
    smile: 1,
    phrase: "",
    phraseT: 0,
    jumpCd: 1.5 + Math.random() * 2,
    sayCd: 0.8,
    walkCd: 0.5,
    walkDir: 1,
    coinAcc: 0,
    bob: 0,
    spin: 0,
    hp: 100,
    maxHp: 100,
    hurtT: 0,
    frozenT: 0,
    burnT: 0,
    poisonT: 0,
    rebuildT: 0,
    dead: false,
  };

  const particles = [];
  const floats = [];
  const blasts = [];
  const projectiles = [];
  let drag = null;
  let listening = false;
  let recognition = null;
  let attackCd = 0;
  let aim = { x: W * 0.7, y: H * 0.4, down: false };
  let muzzleFlash = 0;

  function isRanged(w) {
    return !!(w && w.ranged);
  }

  function muzzlePos(tx, ty) {
    // Gun sits near bottom-left; flips if aiming left
    const left = tx < W * 0.45;
    return {
      x: left ? W - 70 : 70,
      y: FLOOR - 28,
    };
  }

  let speakTimer = null;
  let speakDelay = null;
  let speaking = false;
  let voiceLockUntil = 0;

  function clearSpeakKeepAlive() {
    if (speakTimer) {
      clearInterval(speakTimer);
      speakTimer = null;
    }
  }

  function stopAllSpeech() {
    clearSpeakKeepAlive();
    if (speakDelay) {
      clearTimeout(speakDelay);
      speakDelay = null;
    }
    speaking = false;
    voiceLockUntil = Infinity;
    buddy.phrase = "";
    buddy.phraseT = 0;
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        // second cancel — some browsers keep a queued utterance after the first
        setTimeout(() => {
          try {
            if (save.mute && window.speechSynthesis) window.speechSynthesis.cancel();
          } catch { /* ignore */ }
        }, 40);
      }
    } catch {
      /* ignore */
    }
  }

  function syncHud() {
    el.hp.textContent = String(Math.max(0, Math.ceil(buddy.hp)));
    el.coins.textContent = save.infCoins ? "∞" : String(save.coins);
    const wName = weaponById(save.weapon).name;
    el.weapon.textContent = save.infDmg && save.weapon !== "hand" ? wName + " ∞" : wName;
  }

  function floatText(x, y, text, color) {
    floats.push({ x, y, text, color, life: 1 });
  }

  function burst(x, y, color, n = 12, speed = 220) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.3 + Math.random());
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0.4 + Math.random() * 0.5,
        s: 2 + Math.random() * 5,
        color,
      });
    }
  }

  function setDeadUI(dead) {
    const rev = toolbar.querySelector("#btn-revive");
    if (rev) rev.hidden = !dead;
    if (dead) {
      hint.textContent = "Бади погиб (0 HP). Нажми «Оживить Бади»";
    } else if (save.mute) {
      hint.textContent = "Бади молчит полностью — ни голоса, ни фраз. Жми «Бади болтает», чтобы снова слышать";
    } else {
      const w = effectiveWeapon();
      hint.textContent = isRanged(w)
        ? (w.auto ? "Зажми ЛКМ — очередь летит куда целишься (стена, пол, Бади)" : "Кликни куда угодно — снаряд летит в эту точку")
        : "Бади болтает сам. Ближнее оружие — удар по Бади · Рука — таскай";
    }
  }

  function rebuildBuddy() {
    buddy.hp = buddy.maxHp;
    buddy.dead = false;
    buddy.rebuildT = 0;
    buddy.frozenT = 0;
    buddy.burnT = 0;
    buddy.poisonT = 0;
    buddy.x = W / 2;
    buddy.y = FLOOR - 70;
    buddy.vx = 0;
    buddy.vy = 0;
    setDeadUI(false);
    syncHud();
    say("Я снова цел!", { voice: true });
  }

  function killBuddy(wpn) {
    if (buddy.dead) return;
    buddy.hp = 0;
    buddy.dead = true;
    buddy.rebuildT = 0; // no auto-revive — wait for admin button
    buddy.burnT = 0;
    buddy.poisonT = 0;
    buddy.frozenT = 0;
    buddy.vx *= 0.3;
    buddy.vy = -200;
    const mul = wpn && wpn.coinMul ? wpn.coinMul : 1;
    const bonus = Math.floor(25 * mul);
    save.coins += bonus;
    persist();
    syncHud();
    setDeadUI(true);
    floatText(buddy.x, buddy.y - 120, "ПОГИБ · +" + bonus + "◎", "#e05030");
    burst(buddy.x, buddy.y, "#c4a060", 40, 450);
    say("Я погиб… Оживи меня!", { voice: true });
  }

  function attackBuddy(wpnIn, fromX, fromY, opts = {}) {
    const wpn = save.infDmg && wpnIn.id !== "hand" ? { ...effectiveWeapon(), ...wpnIn, dmg: wpnIn.dmg } : wpnIn;
    if (buddy.dead || wpn.id === "hand" || wpn.dmg <= 0) return;
    if (!opts.skipCd && attackCd > 0) return;
    if (!opts.skipCd) {
      const heavy = ["bomb", "nuke", "meteor", "admin", "infdmg", "bazooka"].includes(wpn.id) || wpn.element === "bomb" || wpn.element === "nuke";
      attackCd = wpn.cd != null ? wpn.cd : heavy ? 0.55 : 0.2;
    }

    let dmg = wpn.dmg;
    if (buddy.frozenT > 0 && (wpn.element === "fire" || wpn.id === "meteor")) dmg = Math.floor(dmg * 1.35);
    if (buddy.burnT > 0 && wpn.element === "ice") dmg = Math.floor(dmg * 1.2);
    if (wpn.element === "lasso") dmg = Math.floor(dmg * 1.1);

    if (save.godMode) {
      floatText(buddy.x, buddy.y - 100, "БОГ · 0", "#7c3aed");
    } else {
      buddy.hp -= dmg;
    }
    buddy.hurtT = 0.35;
    buddy.smile = 0.7;

    const coins = save.infCoins ? Math.floor(dmg * 0.1) : Math.max(1, Math.floor(dmg * wpn.coinMul * 0.35));
    if (!save.infCoins) save.coins += coins;
    else save.coins = Math.max(save.coins, 999999);
    persist();
    syncHud();

    let ang = Math.atan2(buddy.y - fromY, buddy.x - fromX);
    if (!Number.isFinite(ang)) ang = buddy.facing >= 0 ? 0.2 : Math.PI - 0.2;
    if (wpn.element === "lasso") {
      // pull toward click then bounce
      buddy.vx = (fromX - buddy.x) * 4;
      buddy.vy = (fromY - buddy.y) * 2 - 200;
    } else if (wpn.element === "wind") {
      buddy.vx += Math.cos(ang) * wpn.knock;
      buddy.vy += -Math.abs(wpn.knock) * 0.35;
    } else {
      buddy.vx += Math.cos(ang) * wpn.knock * 0.9;
      buddy.vy += Math.sin(ang) * wpn.knock * 0.35 - wpn.knock * 0.25;
    }
    buddy.onGround = false;
    buddy.spin += (buddy.vx > 0 ? 1 : -1) * (8 + wpn.dmg * 0.05);

    floatText(buddy.x, buddy.y - 80, "-" + dmg, wpn.color);
    floatText(buddy.x + 24, buddy.y - 100, "+" + coins + "◎", "#e8a820");
    burst(buddy.x, buddy.y - 20, wpn.color, 10 + Math.min(30, dmg / 4), 160 + wpn.knock * 0.15);

    const quiet = opts.skipCd && Math.random() > 0.14;

    if (wpn.element === "fire" || wpn.id === "meteor") {
      buddy.burnT = Math.max(buddy.burnT, wpn.id === "meteor" ? 3.2 : wpn.proj === "flame" ? 1.4 : 2.2);
      buddy.frozenT = 0;
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.35, r: wpn.id === "meteor" ? 70 : 40, color: "#e05030" });
      if (!quiet) say("Жарко!", { voice: false });
    } else if (wpn.element === "ice") {
      buddy.frozenT = 1.8;
      buddy.burnT = 0;
      buddy.vx *= 0.2;
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.4, r: 36, color: "#5ec8e8" });
      if (!quiet) say("Холодно!", { voice: false });
    } else if (wpn.element === "poison") {
      buddy.poisonT = 3.5;
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.4, r: 38, color: "#6aaa3a" });
      if (!quiet) say("Фу, яд!", { voice: false });
    } else if (wpn.element === "shock") {
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 30, life: 0.25, r: 50, color: wpn.color });
      if (!quiet) say(wpn.id === "admin" || wpn.id === "railgun" ? "Бзззт!" : "Бзззт!", { voice: !save.mute && Math.random() < 0.35 });
    } else if (wpn.element === "wind") {
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.3, r: 55, color: "#a8d8ff" });
      if (!quiet) say("Уносит!", { voice: false });
    } else if (wpn.element === "lasso") {
      if (!opts.skipCd) blasts.push({ x: buddy.x, y: buddy.y - 20, life: 0.3, r: 45, color: "#c4a060" });
      if (!quiet) say("Шериф поймал!", { voice: !save.mute && Math.random() < 0.4 });
    } else if (wpn.element === "bomb" || wpn.element === "nuke") {
      if (!opts.skipCd) {
        blasts.push({
          x: buddy.x,
          y: buddy.y - 10,
          life: 0.5,
          r: wpn.element === "nuke" ? 120 : 70,
          color: wpn.color,
        });
        burst(buddy.x, buddy.y, "#ffe08a", wpn.element === "nuke" ? 40 : 22, 500);
      }
      if (!quiet) say(wpn.element === "nuke" ? "Какой взрыв!" : "Бабах!", { voice: !opts.skipCd });
    } else if (!quiet) {
      say(["Ай!", "Ой!", "Больно!", "Ещё!"][Math.floor(Math.random() * 4)], { voice: false });
    }

    if (buddy.hp <= 0 && !save.godMode) killBuddy(wpn);
  }

  function spawnProjectile(wpn, tx, ty, angOffset = 0) {
    const m = muzzlePos(tx, ty);
    let ang = Math.atan2(ty - m.y, tx - m.x) + angOffset;
    const spd = wpn.speed || 1000;
    const life = wpn.life || Math.hypot(tx - m.x, ty - m.y) / spd + 0.15;
    projectiles.push({
      x: m.x,
      y: m.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life,
      maxLife: life,
      r: wpn.size || 4,
      color: wpn.color,
      kind: wpn.proj || "bullet",
      wpnId: wpn.id,
      targetX: tx,
      targetY: ty,
      explode: !!wpn.explode,
      explodeR: wpn.explodeR || 70,
      hit: false,
    });
    muzzleFlash = 0.08;
  }

  function fireRangedAt(tx, ty) {
    const wpn = effectiveWeapon();
    if (!isRanged(wpn) || buddy.dead) return false;
    if (attackCd > 0) return false;

    attackCd = wpn.cd != null ? wpn.cd : 0.2;
    const pellets = wpn.pellets || 1;
    const spread = wpn.spread || 0;

    for (let i = 0; i < pellets; i++) {
      let off = 0;
      if (pellets > 1) off = (i - (pellets - 1) / 2) * (spread || 0.12);
      else if (spread) off = (Math.random() - 0.5) * spread * 2;
      spawnProjectile(wpn, tx, ty, off);
    }

    // muzzle sparks
    const m = muzzlePos(tx, ty);
    burst(m.x, m.y, wpn.color, pellets > 1 ? 8 : 4, 180);
    return true;
  }

  function applyProjectileHit(proj, fromX, fromY, splashScale = 1) {
    const base = weaponById(proj.wpnId);
    let wpn = save.infDmg && base.id !== "hand"
      ? { ...base, dmg: Math.max(base.dmg, 99999), coinMul: Math.max(base.coinMul, 10), knock: Math.max(base.knock, 1400) }
      : { ...base };
    wpn.dmg = Math.max(1, Math.floor(wpn.dmg * splashScale));
    if (buddy.dead || wpn.dmg <= 0) return;
    attackBuddy(wpn, fromX, fromY, { skipCd: true });
  }

  function explodeAt(x, y, proj) {
    const r = proj.explodeR || 80;
    blasts.push({ x, y, life: 0.55, r, color: proj.color });
    burst(x, y, "#ffe08a", 28, 520);
    burst(x, y, proj.color, 18, 400);

    const dx = buddy.x - x;
    const dy = (buddy.y - 20) - y;
    const dist = Math.hypot(dx, dy);
    if (dist < r + 40 && !buddy.dead) {
      const falloff = Math.max(0.35, 1 - dist / (r + 40));
      applyProjectileHit(proj, x, y, falloff);
    } else {
      say("Бабах по стене!", { voice: false });
    }
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const ox = p.x;
      const oy = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.kind === "rocket") {
        // slight smoke trail
        if (Math.random() < 0.6) {
          particles.push({
            x: p.x - p.vx * 0.01,
            y: p.y - p.vy * 0.01,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 0.25,
            s: 3 + Math.random() * 4,
            color: "rgba(80,80,80,0.45)",
          });
        }
      } else if (p.kind === "flame") {
        p.r += 40 * dt;
        particles.push({
          x: p.x + (Math.random() - 0.5) * 10,
          y: p.y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 30,
          vy: -40 - Math.random() * 40,
          life: 0.2,
          s: 4 + Math.random() * 6,
          color: Math.random() < 0.5 ? "#e05030" : "#ffcc40",
        });
      } else if (p.kind === "laser") {
        particles.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0.12,
          s: p.r,
          color: p.color,
        });
      }

      // reached aim point (for rockets / precise shots)
      const toTarget = Math.hypot(p.targetX - p.x, p.targetY - p.y);
      const passed =
        (p.targetX - ox) * (p.targetX - p.x) + (p.targetY - oy) * (p.targetY - p.y) <= 0;

      // buddy collision along segment
      const bx = buddy.x;
      const by = buddy.y - 20;
      const hitR = 55 + p.r;
      const nearBuddy = Math.hypot(p.x - bx, p.y - by) < hitR;

      if (!p.hit && nearBuddy && !buddy.dead) {
        p.hit = true;
        if (p.explode) {
          explodeAt(p.x, p.y, p);
        } else {
          applyProjectileHit(p, ox, oy, 1);
          burst(p.x, p.y, p.color, 8, 220);
        }
        projectiles.splice(i, 1);
        continue;
      }

      const out =
        p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40 || p.life <= 0 || (passed && toTarget < 22);

      if (out) {
        const ix = Math.max(8, Math.min(W - 8, passed && toTarget < 40 ? p.targetX : p.x));
        const iy = Math.max(8, Math.min(H - 8, passed && toTarget < 40 ? p.targetY : p.y));
        if (p.explode && !p.hit) {
          explodeAt(ix, iy, p);
        } else if (!p.hit && (p.kind === "bullet" || p.kind === "pellet" || p.kind === "pebble" || p.kind === "laser")) {
          burst(ix, iy, p.color, 6, 160);
          blasts.push({ x: ix, y: iy, life: 0.15, r: 12, color: p.color });
        }
        projectiles.splice(i, 1);
      }
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      if (p.kind === "rocket") {
        ctx.fillStyle = p.color;
        roundRectPath(-12, -5, 22, 10, 3);
        ctx.fill();
        ctx.fillStyle = "#e05030";
        ctx.beginPath();
        ctx.moveTo(-12, -5);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-12, 5);
        ctx.fill();
        ctx.fillStyle = "#ffcc40";
        ctx.beginPath();
        ctx.arc(10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "flame") {
        ctx.globalAlpha = Math.max(0.25, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.kind === "laser") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.r;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.kind === "pebble") {
        ctx.fillStyle = "#6a5630";
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#f5f0c8";
        ctx.fillRect(-6, -1.5, 12, 3);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(6, 0, p.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawMuzzle() {
    const wpn = effectiveWeapon();
    if (!isRanged(wpn)) return;
    const m = muzzlePos(aim.x, aim.y);
    const ang = Math.atan2(aim.y - m.y, aim.x - m.x);

    // aim laser / dotted line
    ctx.save();
    ctx.strokeStyle = "rgba(224, 80, 48, 0.35)";
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(aim.x, aim.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(224, 80, 48, 0.55)";
    ctx.beginPath();
    ctx.arc(aim.x, aim.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff8f0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // gun body
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(ang);
    ctx.fillStyle = wpn.color;
    if (wpn.proj === "rocket") {
      roundRectPath(-8, -10, 42, 20, 4);
      ctx.fill();
      ctx.fillStyle = "#2a2a28";
      roundRectPath(28, -4, 18, 8, 2);
      ctx.fill();
    } else if (wpn.auto) {
      roundRectPath(-6, -7, 36, 14, 3);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      roundRectPath(20, -3, 22, 6, 1);
      ctx.fill();
    } else {
      roundRectPath(-4, -5, 28, 10, 3);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      roundRectPath(18, -2, 16, 4, 1);
      ctx.fill();
    }
    if (muzzleFlash > 0) {
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.moveTo(38, 0);
      ctx.lineTo(52, -8);
      ctx.lineTo(48, 0);
      ctx.lineTo(52, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function say(text, opts = {}) {
    // Full silence mode: no bubble, no voice, nothing
    if (save.mute) return;

    const t = text || PHRASES[Math.floor(Math.random() * PHRASES.length)];
    buddy.phrase = t;
    buddy.phraseT = Math.max(2.8, Math.min(7, 1.6 + t.length * 0.08));
    buddy.smile = 1.4;

    const wantVoice = opts.silent !== true && opts.voice !== false;
    const now = performance.now();
    if (wantVoice) {
      if (opts.force || (!speaking && now >= voiceLockUntil)) {
        voiceLockUntil = now + Math.max(1600, Math.min(4500, t.length * 90));
        speak(t, { force: !!opts.force });
      }
    }
  }

  function speak(text, opts = {}) {
    try {
      if (save.mute) {
        stopAllSpeech();
        return;
      }
      if (!window.speechSynthesis || !text) return;
      const clean = String(text).replace(/[!?…]+$/g, (m) => m[0]).trim();
      if (!clean) return;

      const startUtter = () => {
        if (save.mute) return;
        try {
          const u = new SpeechSynthesisUtterance(clean);
          u.lang = "ru-RU";
          u.rate = 0.98;
          u.pitch = 1.15;
          u.volume = 1;
          const voices = window.speechSynthesis.getVoices();
          const ru =
            voices.find((v) => /ru[-_]?RU/i.test(v.lang) && /Google|Microsoft|Neural|Premium/i.test(v.name)) ||
            voices.find((v) => /ru/i.test(v.lang));
          if (ru) u.voice = ru;

          u.onstart = () => {
            if (save.mute) {
              window.speechSynthesis.cancel();
              return;
            }
            speaking = true;
            clearSpeakKeepAlive();
            speakTimer = setInterval(() => {
              if (save.mute || !window.speechSynthesis.speaking) {
                clearSpeakKeepAlive();
                speaking = false;
                return;
              }
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }, 8000);
          };
          u.onend = () => {
            speaking = false;
            clearSpeakKeepAlive();
            if (!save.mute && !buddy.dead) buddy.sayCd = Math.min(buddy.sayCd, 0.35);
          };
          u.onerror = () => {
            speaking = false;
            clearSpeakKeepAlive();
            if (!save.mute) buddy.sayCd = Math.min(buddy.sayCd, 0.5);
          };

          window.speechSynthesis.speak(u);
        } catch {
          speaking = false;
        }
      };

      if (opts.force || !speaking) {
        clearSpeakKeepAlive();
        if (speakDelay) clearTimeout(speakDelay);
        window.speechSynthesis.cancel();
        speaking = false;
        speakDelay = setTimeout(() => {
          speakDelay = null;
          startUtter();
        }, 30);
      } else {
        buddy.sayCd = Math.min(buddy.sayCd, 0.4);
      }
    } catch {
      /* ignore */
    }
  }

  function jump(power = 680, opts = {}) {
    if (drag || buddy.dead) return;
    if (!buddy.onGround && Math.abs(buddy.vy) > 40) return;
    buddy.vy = -power;
    buddy.onGround = false;
    buddy.squat = 0.15;
    if (opts.quiet) {
      if (!save.mute) {
        buddy.phrase = ["оп", "прыг", "хе"][Math.floor(Math.random() * 3)];
        buddy.phraseT = 0.6;
      }
    } else if (!buddy.dead) {
      say(["Уиии!", "Прыгаю!", "Выше!", "Лечу!"][Math.floor(Math.random() * 4)], {
        voice: !save.mute && Math.random() < 0.35,
        fromAuto: true,
      });
    }
    for (let i = 0; i < (opts.quiet ? 4 : 8); i++) {
      particles.push({
        x: buddy.x + (Math.random() - 0.5) * 30,
        y: FLOOR - 4,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 60,
        life: 0.4,
        s: 2 + Math.random() * 3,
        color: "rgba(120,90,40,0.35)",
      });
    }
  }

  function openShop() {
    overlay.classList.remove("hidden");
    const cards = CLOTHES.map((c) => {
      const owned = save.owned.includes(c.id);
      let equipped = false;
      if (c.kind === "shirt") equipped = save.shirt === c.id;
      if (c.kind === "hat") equipped = save.hat === c.id;
      if (c.kind === "extra") equipped = save.extra === c.id;

      let action;
      if (equipped) {
        if (c.id === "none") action = `<button class="btn" disabled>Уже без одежды</button>`;
        else action = `<button class="btn danger" data-uneq="${c.id}">Снять</button>`;
      } else if (owned) {
        action = `<button class="btn" data-eq="${c.id}">${c.id === "none" ? "Раздеть тело" : "Надеть"}</button>`;
      } else {
        const can = save.infCoins || save.coins >= c.cost;
        action = `<button class="btn" data-buy="${c.id}" ${can ? "" : "disabled"}>${c.cost} ◎</button>`;
      }
      return `
        <div class="shop-card${owned ? " owned" : ""}${equipped ? " equipped" : ""}">
          <h4>${c.name}</h4>
          <p>${c.desc}<br><span style="opacity:.7">${c.kind === "shirt" ? "тело" : c.kind === "hat" ? "голова" : "аксессуар"}</span></p>
          ${action}
        </div>`;
    }).join("");

    const wearingSomething = (save.shirt && save.shirt !== "none") || save.hat || save.extra;

    overlay.innerHTML = `
      <div class="brand">ОДЕЖДА</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b> · можно снять любую вещь</p>
      <div class="shop-grid">${cards}</div>
      <button class="btn danger" id="btn-undress-all" ${wearingSomething ? "" : "disabled"} style="width:min(320px,100%)">Раздеть всё</button>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelector("#btn-undress-all").onclick = () => {
      save.shirt = "none";
      save.hat = null;
      save.extra = null;
      persist();
      syncHud();
      say("Я снова без одежды!");
      openShop();
    };
    overlay.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-buy");
        const item = itemById(id);
        if (save.owned.includes(id)) return;
        if (!save.infCoins) {
          if (save.coins < item.cost) return;
          save.coins -= item.cost;
        }
        save.owned.push(id);
        equipClothes(id);
        persist();
        syncHud();
        say("Спасибо за одёжку!");
        openShop();
      };
    });
    overlay.querySelectorAll("[data-eq]").forEach((btn) => {
      btn.onclick = () => {
        equipClothes(btn.getAttribute("data-eq"));
        persist();
        syncHud();
        say(save.shirt === "none" && !save.hat && !save.extra ? "Без одежды!" : "Мне идёт?");
        openShop();
      };
    });
    overlay.querySelectorAll("[data-uneq]").forEach((btn) => {
      btn.onclick = () => {
        unequipClothes(btn.getAttribute("data-uneq"));
        persist();
        syncHud();
        say("Снял!");
        openShop();
      };
    });
  }

  function openWeaponShop() {
    overlay.classList.remove("hidden");
    const cards = WEAPONS.filter((w) => !w.cheat || save.ownedWeapons.includes(w.id)).map((w) => {
      const owned = save.ownedWeapons.includes(w.id);
      const equipped = save.weapon === w.id;
      let action;
      if (equipped) action = `<button class="btn" disabled>Выбрано</button>`;
      else if (owned) action = `<button class="btn" data-weq="${w.id}">Взять</button>`;
      else {
        const can = save.infCoins || save.coins >= w.cost;
        action = `<button class="btn" data-wbuy="${w.id}" ${can ? "" : "disabled"}>${w.cost} ◎</button>`;
      }
      const power = w.dmg > 0
        ? `<span class="dmg">${w.dmg} урона · ×${w.coinMul} монет${w.ranged ? " · стрельба" : ""}${w.exclusive ? " · EX" : ""}</span>`
        : `<span class="dmg">без урона</span>`;
      return `
        <div class="shop-card${owned ? " owned" : ""}${equipped ? " equipped" : ""}${w.exclusive ? " exclusive" : ""}">
          <h4>${w.exclusive ? "★ " : ""}${w.name}</h4>
          <p>${power}<br>${w.desc}</p>
          ${action}
        </div>`;
    }).join("");

    overlay.innerHTML = `
      <div class="brand">ОРУЖИЕ</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b> · EX = эксклюзив · клик в стену = выстрел</p>
      <div class="shop-grid">${cards}</div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelectorAll("[data-wbuy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-wbuy");
        const w = weaponById(id);
        if (save.ownedWeapons.includes(id)) return;
        if (!save.infCoins) {
          if (save.coins < w.cost) return;
          save.coins -= w.cost;
        }
        save.ownedWeapons.push(id);
        save.weapon = id;
        persist();
        syncHud();
        setDeadUI(buddy.dead);
        canvas.style.cursor = isRanged(w) ? "crosshair" : "grab";
        say(isRanged(w) ? "Кликай куда угодно — стреляю!" : "Новая пушка!");
        openWeaponShop();
      };
    });
    overlay.querySelectorAll("[data-weq]").forEach((btn) => {
      btn.onclick = () => {
        save.weapon = btn.getAttribute("data-weq");
        persist();
        syncHud();
        setDeadUI(buddy.dead);
        const w = effectiveWeapon();
        canvas.style.cursor = isRanged(w) ? "crosshair" : "grab";
        say(w.id === "hand" ? "Только руками!" : isRanged(w) ? "Прицел готов!" : "Готов бить!");
        openWeaponShop();
      };
    });
  }

  function openBuddyShop() {
    overlay.classList.remove("hidden");
    const cards = BUDDIES.map((b) => {
      const owned = save.ownedBuddies.includes(b.id);
      const equipped = save.buddyType === b.id;
      let action;
      if (equipped) action = `<button class="btn" disabled>Выбран</button>`;
      else if (owned) action = `<button class="btn" data-beq="${b.id}">Выбрать</button>`;
      else {
        const can = save.coins >= b.cost || save.infCoins;
        action = `<button class="btn" data-bbuy="${b.id}" ${can ? "" : "disabled"}>${b.cost} ◎</button>`;
      }
      const badge = b.exclusive ? `<span class="ex-badge">EX · №1</span>` : "";
      return `
        <div class="shop-card${owned ? " owned" : ""}${equipped ? " equipped" : ""}${b.exclusive ? " exclusive premium-skin" : ""}">
          <h4>${b.exclusive ? "★ " : ""}${b.name} ${badge}</h4>
          <p><span class="dmg" style="color:${b.cloth}">██</span> ${b.desc}${b.exclusive ? `<br><b style="color:#ffd76a">${b.cost} ◎ · самый дорогой</b>` : ""}</p>
          ${action}
        </div>`;
    }).join("");

    overlay.innerHTML = `
      <div class="brand">ТИПЫ БАДИ</div>
      <p class="tagline">Монеты: <b style="color:#ffd76a">${save.infCoins ? "∞" : save.coins}</b> · ★ SkinAdminBuffer — топ эксклюзив</p>
      <div class="shop-grid">${cards}</div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelectorAll("[data-bbuy]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-bbuy");
        const b = buddyById(id);
        if (save.ownedBuddies.includes(id)) return;
        if (!save.infCoins) {
          if (save.coins < b.cost) return;
          save.coins -= b.cost;
        }
        save.ownedBuddies.push(id);
        save.buddyType = id;
        persist();
        syncHud();
        say(id === "SkinAdminBuffer" ? "SkinAdminBuffer активирован!" : "Новый я!");
        openBuddyShop();
      };
    });
    overlay.querySelectorAll("[data-beq]").forEach((btn) => {
      btn.onclick = () => {
        save.buddyType = btn.getAttribute("data-beq");
        persist();
        say(save.buddyType === "SkinAdminBuffer" ? "Админ-скин на месте!" : "Это я!");
        openBuddyShop();
      };
    });
  }

  function openAdminPanel() {
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="brand">АДМИН</div>
      <p class="tagline">Команды админа команды · шериф одобряет</p>
      <div class="shop-grid">
        <div class="shop-card ${save.infDmg ? "equipped" : ""}">
          <h4>∞ Урон</h4>
          <p>Любое оружие (кроме руки) бьёт на 99999</p>
          <button class="btn" id="adm-infdmg">${save.infDmg ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card ${save.infCoins ? "equipped" : ""}">
          <h4>∞ Монеты</h4>
          <p>Монеты не тратятся · в HUD ∞</p>
          <button class="btn" id="adm-infcoins">${save.infCoins ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card">
          <h4>+99999 монет</h4>
          <p>Разовая выдача</p>
          <button class="btn" id="adm-addcoins">Выдать</button>
        </div>
        <div class="shop-card">
          <h4>Всё оружие</h4>
          <p>Открыть весь арсенал + ∞ урон</p>
          <button class="btn" id="adm-allw">Открыть</button>
        </div>
        <div class="shop-card">
          <h4>Все типы Бади</h4>
          <p>Открыть все скины</p>
          <button class="btn" id="adm-allb">Открыть</button>
        </div>
        <div class="shop-card ${save.godMode ? "equipped" : ""}">
          <h4>Режим бога</h4>
          <p>Бади не теряет HP · бессмертие</p>
          <button class="btn" id="adm-god">${save.godMode ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card ${save.giant ? "equipped" : ""}">
          <h4>Гигант-Бади</h4>
          <p>Увеличить Бади в 1.6×</p>
          <button class="btn" id="adm-giant">${save.giant ? "Выкл" : "Вкл"}</button>
        </div>
        <div class="shop-card">
          <h4>Убить / Оживить</h4>
          <p>Мгновенно 0 HP или полный HP</p>
          <button class="btn" id="adm-kill">Убить</button>
          <button class="btn" id="adm-revive" style="margin-top:6px">Оживить</button>
        </div>
      </div>
      <button class="btn" id="close-shop">Закрыть</button>
    `;
    overlay.querySelector("#close-shop").onclick = () => overlay.classList.add("hidden");
    overlay.querySelector("#adm-infdmg").onclick = () => {
      save.infDmg = !save.infDmg;
      if (save.infDmg && !save.ownedWeapons.includes("infdmg")) save.ownedWeapons.push("infdmg");
      if (save.infDmg) save.weapon = "infdmg";
      persist();
      syncHud();
      openAdminPanel();
    };
    overlay.querySelector("#adm-infcoins").onclick = () => {
      save.infCoins = !save.infCoins;
      if (save.infCoins) save.coins = Math.max(save.coins, 999999);
      persist();
      syncHud();
      openAdminPanel();
    };
    overlay.querySelector("#adm-addcoins").onclick = () => {
      save.coins += 99999;
      persist();
      syncHud();
      openAdminPanel();
    };
    overlay.querySelector("#adm-allw").onclick = () => {
      WEAPONS.forEach((w) => {
        if (!save.ownedWeapons.includes(w.id)) save.ownedWeapons.push(w.id);
      });
      save.infDmg = true;
      save.weapon = "infdmg";
      persist();
      syncHud();
      openAdminPanel();
    };
    overlay.querySelector("#adm-allb").onclick = () => {
      BUDDIES.forEach((b) => {
        if (!save.ownedBuddies.includes(b.id)) save.ownedBuddies.push(b.id);
      });
      persist();
      openAdminPanel();
    };
    overlay.querySelector("#adm-god").onclick = () => {
      save.godMode = !save.godMode;
      persist();
      openAdminPanel();
    };
    overlay.querySelector("#adm-giant").onclick = () => {
      save.giant = !save.giant;
      persist();
      openAdminPanel();
    };
    overlay.querySelector("#adm-kill").onclick = () => {
      overlay.classList.add("hidden");
      save.godMode = false;
      killBuddy(effectiveWeapon());
    };
    overlay.querySelector("#adm-revive").onclick = () => {
      overlay.classList.add("hidden");
      rebuildBuddy();
    };
  }

  function equipClothes(id) {
    const item = itemById(id);
    if (item.kind === "shirt") save.shirt = id;
    if (item.kind === "hat") save.hat = id;
    if (item.kind === "extra") save.extra = id;
  }

  function unequipClothes(id) {
    const item = itemById(id);
    if (item.kind === "shirt") save.shirt = "none";
    if (item.kind === "hat" && save.hat === id) save.hat = null;
    if (item.kind === "extra" && save.extra === id) save.extra = null;
  }

  toolbar.querySelector("#btn-shop").onclick = () => openShop();
  toolbar.querySelector("#btn-buddies").onclick = () => openBuddyShop();
  toolbar.querySelector("#btn-weapons").onclick = () => openWeaponShop();
  toolbar.querySelector("#btn-admin").onclick = () => openAdminPanel();
  toolbar.querySelector("#btn-mute").onclick = () => {
    save.mute = !save.mute;
    persist();
    const btn = toolbar.querySelector("#btn-mute");
    btn.textContent = save.mute ? "Бади молчит" : "Бади болтает";
    if (save.mute) {
      stopAllSpeech();
      voiceLockUntil = Infinity;
      if (listening && recognition) {
        try { recognition.stop(); } catch { /* ignore */ }
        listening = false;
        const lb = toolbar.querySelector("#btn-listen");
        if (lb) lb.textContent = "Слушать";
      }
      setDeadUI(buddy.dead);
    } else {
      voiceLockUntil = 0;
      buddy.sayCd = 0.2;
      setDeadUI(buddy.dead);
      say("Снова болтаю!", { force: true, voice: true });
    }
  };
  toolbar.querySelector("#btn-revive").onclick = () => {
    if (buddy.dead) rebuildBuddy();
  };
  toolbar.querySelector("#btn-say").onclick = () => {
    if (save.mute) return;
    voiceLockUntil = 0;
    speaking = false;
    say(undefined, { force: true });
  };
  toolbar.querySelector("#btn-jump").onclick = () => jump(720);
  toolbar.querySelector("#btn-listen").onclick = () => {
    if (save.mute) return;
    toggleListen();
  };

  function toggleListen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = toolbar.querySelector("#btn-listen");
    if (!SR) {
      say("Микрофон недоступен");
      return;
    }
    if (listening && recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
      listening = false;
      btn.textContent = "Слушать";
      return;
    }
    recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      listening = true;
      btn.textContent = "Слушаю…";
      buddy.phrase = "…";
      buddy.phraseT = 3;
    };
    recognition.onresult = (ev) => {
      const text = (ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript || "").trim();
      if (text) {
        voiceLockUntil = 0;
        speaking = false;
        say(text);
        save.coins += 2;
        persist();
        syncHud();
      }
    };
    recognition.onerror = () => {
      listening = false;
      btn.textContent = "Слушать";
      say("Не расслышал");
    };
    recognition.onend = () => {
      listening = false;
      btn.textContent = "Слушать";
    };
    try {
      recognition.start();
    } catch {
      say("Включи микрофон");
    }
  }

  function hitTest(x, y) {
    const dx = x - buddy.x;
    const dy = y - (buddy.y - 20);
    return dx * dx + dy * dy < 85 * 85;
  }

  function canvasPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * W,
      y: ((ev.clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!overlay.classList.contains("hidden")) return;
    const p = canvasPos(e);
    aim.x = p.x;
    aim.y = p.y;
    const wpn = effectiveWeapon();

    // Ranged: click anywhere (wall / floor / buddy) to shoot toward that point
    if (isRanged(wpn) && !buddy.dead) {
      e.preventDefault();
      aim.down = true;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      fireRangedAt(p.x, p.y);
      canvas.style.cursor = "crosshair";
      return;
    }

    if (buddy.dead) return;
    if (!hitTest(p.x, p.y)) return;
    e.preventDefault();
    const now = performance.now();
    drag = {
      ox: p.x - buddy.x,
      oy: p.y - buddy.y,
      samples: [{ t: now, x: buddy.x, y: buddy.y }],
      startX: p.x,
      startY: p.y,
      moved: 0,
    };
    buddy.vx = 0;
    buddy.vy = 0;
    buddy.onGround = false;
    buddy.spin = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPos(e);
    aim.x = p.x;
    aim.y = p.y;

    if (aim.down && isRanged(effectiveWeapon())) {
      canvas.style.cursor = "crosshair";
      return;
    }

    if (!drag) return;
    const now = performance.now();
    const nx = Math.max(40, Math.min(W - 40, p.x - drag.ox));
    const ny = Math.max(60, Math.min(FLOOR - 30, p.y - drag.oy));
    drag.moved += Math.hypot(nx - buddy.x, ny - buddy.y);
    if (nx > buddy.x + 2) buddy.facing = 1;
    if (nx < buddy.x - 2) buddy.facing = -1;
    buddy.x = nx;
    buddy.y = ny;
    drag.samples.push({ t: now, x: nx, y: ny });
    while (drag.samples.length > 8) drag.samples.shift();
    while (drag.samples.length > 2 && now - drag.samples[0].t > 100) drag.samples.shift();
    if (drag.moved > 6) buddy.coinAcc += 0.02;
  });

  function endDrag(e) {
    if (aim.down) {
      aim.down = false;
      if (e) {
        const p = canvasPos(e);
        aim.x = p.x;
        aim.y = p.y;
      }
      canvas.style.cursor = isRanged(effectiveWeapon()) ? "crosshair" : "grab";
    }

    if (!drag) return;
    const samples = drag.samples;
    const moved = drag.moved;
    const startX = drag.startX;
    const startY = drag.startY;
    drag = null;
    canvas.style.cursor = isRanged(effectiveWeapon()) ? "crosshair" : "grab";

    const wpn = effectiveWeapon();
    if (moved < 18 && wpn.id !== "hand" && !isRanged(wpn) && !buddy.dead) {
      attackBuddy(wpn, startX, startY);
      return;
    }

    let tvx = 0;
    let tvy = 0;
    if (samples.length >= 2) {
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = Math.max(0.016, (b.t - a.t) / 1000);
      tvx = (b.x - a.x) / dt;
      tvy = (b.y - a.y) / dt;
    }
    buddy.vx = Math.max(-1400, Math.min(1400, tvx * 1.15));
    buddy.vy = Math.max(-1600, Math.min(900, tvy * 1.15));
    buddy.onGround = false;
    buddy.spin = buddy.vx * 0.008;

    const speed = Math.hypot(buddy.vx, buddy.vy);
    if (speed > 400) {
      say(["Лечууу!", "Уиии, высоко!", "Крылья нашлись!", "Полёт!"][Math.floor(Math.random() * 4)]);
    }

    if (buddy.coinAcc >= 1) {
      const add = Math.floor(buddy.coinAcc);
      save.coins += add;
      buddy.coinAcc = 0;
      persist();
      syncHud();
    }
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  function update(dt) {
    if (attackCd > 0) attackCd -= dt;
    if (muzzleFlash > 0) muzzleFlash -= dt;

    // Hold-to-fire for auto ranged weapons (machine gun, uzi, flamethrower…)
    if (aim.down && !buddy.dead && overlay.classList.contains("hidden")) {
      const wpn = effectiveWeapon();
      if (isRanged(wpn) && wpn.auto) fireRangedAt(aim.x, aim.y);
    }

    updateProjectiles(dt);

    buddy.armPhase += dt * (Math.abs(buddy.vx) > 40 || !buddy.onGround ? 12 : 6);
    buddy.bob += dt * 3;
    if (buddy.blink > 0) buddy.blink -= dt;
    else if (Math.random() < dt * 0.4) buddy.blink = 0.12;
    if (buddy.smile > 1) buddy.smile -= dt * 0.5;
    else if (buddy.smile < 1) buddy.smile = Math.min(1, buddy.smile + dt);
    if (buddy.phraseT > 0) buddy.phraseT -= dt;
    if (buddy.hurtT > 0) buddy.hurtT -= dt;
    if (buddy.frozenT > 0) buddy.frozenT -= dt;
    if (buddy.burnT > 0) {
      buddy.burnT -= dt;
      if (!buddy.dead && !save.godMode && Math.floor(buddy.burnT * 5) !== Math.floor((buddy.burnT + dt) * 5)) {
        buddy.hp -= 2;
        save.coins += 1;
        persist();
        syncHud();
        burst(buddy.x, buddy.y - 30, "#e05030", 3, 80);
        floatText(buddy.x, buddy.y - 70, "-2", "#e05030");
        if (buddy.hp <= 0) killBuddy(weaponById("fire"));
      }
    }
    if (buddy.poisonT > 0) {
      buddy.poisonT -= dt;
      if (!buddy.dead && !save.godMode && Math.floor(buddy.poisonT * 4) !== Math.floor((buddy.poisonT + dt) * 4)) {
        buddy.hp -= 3;
        save.coins += 2;
        persist();
        syncHud();
        burst(buddy.x, buddy.y - 30, "#6aaa3a", 4, 70);
        floatText(buddy.x, buddy.y - 70, "-3", "#6aaa3a");
        if (buddy.hp <= 0) killBuddy(weaponById("poison"));
      }
    }
    if (Math.abs(buddy.spin) > 0.01) {
      buddy.spin *= Math.max(0, 1 - 2.5 * dt);
    } else {
      buddy.spin = 0;
    }

    // Dead: stay down until revive (no auto-rebuild)
    if (buddy.dead) {
      buddy.phraseT = Math.max(buddy.phraseT, 0.1);
    }

    if (!drag && !buddy.dead) {
      buddy.jumpCd -= dt;
      buddy.sayCd -= dt;
      buddy.walkCd -= dt;

      const canWalk = buddy.frozenT <= 0;
      if (buddy.onGround && canWalk) {
        if (buddy.walkCd <= 0) {
          buddy.walkDir = Math.random() < 0.5 ? -1 : 1;
          buddy.walkCd = 1.2 + Math.random() * 2.5;
        }
        const targetSpeed = buddy.walkDir * (70 + Math.random() * 40);
        buddy.vx += (targetSpeed - buddy.vx) * Math.min(1, 4 * dt);
        buddy.facing = buddy.vx >= 0 ? 1 : -1;

        if (buddy.jumpCd <= 0) {
          const big = Math.random() < 0.35;
          jump(big ? 520 + Math.random() * 160 : 280 + Math.random() * 100, { quiet: !big });
          buddy.jumpCd = big ? 2.2 + Math.random() * 2.5 : 0.7 + Math.random() * 1.1;
        }
      } else if (buddy.frozenT > 0) {
        buddy.vx *= 0.9;
      }

      if (buddy.sayCd <= 0 && !listening && !save.mute) {
        say(undefined, { fromAuto: true, voice: true });
        buddy.sayCd = 1.4 + Math.random() * 1.6;
      }
    }

    if (!drag) {
      buddy.vy += GRAVITY * dt;
      buddy.x += buddy.vx * dt;
      buddy.y += buddy.vy * dt;
      if (!buddy.onGround) {
        buddy.vx *= Math.max(0, 1 - 0.35 * dt);
      } else {
        buddy.vx *= Math.max(0, 1 - 1.2 * dt);
      }

      if (buddy.x < 50) {
        buddy.x = 50;
        buddy.vx = Math.abs(buddy.vx) * 0.55;
        buddy.facing = 1;
        buddy.walkDir = 1;
      }
      if (buddy.x > W - 50) {
        buddy.x = W - 50;
        buddy.vx = -Math.abs(buddy.vx) * 0.55;
        buddy.facing = -1;
        buddy.walkDir = -1;
      }

      const groundY = FLOOR - 70;
      if (buddy.y >= groundY) {
        buddy.y = groundY;
        if (buddy.vy > 200) {
          buddy.squat = Math.min(0.3, buddy.vy * 0.00025);
          if (buddy.vy > 500) {
            buddy.vy = -buddy.vy * 0.35;
            buddy.onGround = false;
            if (!buddy.dead) say(["Бух!", "Ой!", "Мягкая посадка!"][Math.floor(Math.random() * 3)], { voice: false });
          } else {
            buddy.vy = 0;
            buddy.onGround = true;
          }
        } else {
          buddy.vy = 0;
          buddy.onGround = true;
        }
        if (buddy.onGround) buddy.spin *= 0.5;
      } else {
        buddy.onGround = false;
      }
    }

    if (buddy.squat > 0) buddy.squat -= dt;

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
    for (const f of floats) {
      f.y -= 50 * dt;
      f.life -= dt;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      if (floats[i].life <= 0) floats.splice(i, 1);
    }
    for (const b of blasts) b.life -= dt;
    for (let i = blasts.length - 1; i >= 0; i--) {
      if (blasts[i].life <= 0) blasts.splice(i, 1);
    }
  }

  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f3e7c0");
    g.addColorStop(1, "#d8c48a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(120, 90, 40, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + 4);
      ctx.stroke();
    }
    ctx.fillStyle = "#b89a58";
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, FLOOR, W, 8);
  }

  function drawClothes(hx, hy, torsoY, facing) {
    const shirt = itemById(save.shirt);
    if (shirt && shirt.id !== "none") {
      ctx.fillStyle = shirt.color || "#e05030";
      if (shirt.hoodie) {
        roundRectPath(hx - 36, torsoY - 38, 72, 78, 16);
        ctx.fill();
        // hood
        ctx.beginPath();
        ctx.arc(hx, hy + 8, 30, Math.PI, 0);
        ctx.fill();
      } else {
        roundRectPath(hx - 34, torsoY - 36, 68, 72, 14);
        ctx.fill();
      }
      if (shirt.target) {
        ctx.fillStyle = "#e05030";
        ctx.beginPath();
        ctx.arc(hx, torsoY + 4, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff8f0";
        ctx.beginPath();
        ctx.arc(hx, torsoY + 4, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e05030";
        ctx.beginPath();
        ctx.arc(hx, torsoY + 4, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (save.extra) {
      const ex = itemById(save.extra);
      if (ex.glasses) {
        ctx.strokeStyle = "#1a1410";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx - 10 * facing, hy - 2, 8, 0, Math.PI * 2);
        ctx.arc(hx + 10 * facing, hy - 2, 8, 0, Math.PI * 2);
        ctx.moveTo(hx - 2 * facing, hy - 2);
        ctx.lineTo(hx + 2 * facing, hy - 2);
        ctx.stroke();
      } else if (ex.color) {
        // scarf
        ctx.fillStyle = ex.color;
        roundRectPath(hx - 28, hy + 18, 56, 14, 6);
        ctx.fill();
        ctx.fillRect(hx + 10 * facing, hy + 28, 12, 36);
      }
    }

    if (save.hat) {
      const hat = itemById(save.hat);
      if (hat.crown) {
        ctx.fillStyle = hat.color;
        ctx.beginPath();
        ctx.moveTo(hx - 22, hy - 22);
        ctx.lineTo(hx - 14, hy - 42);
        ctx.lineTo(hx - 4, hy - 26);
        ctx.lineTo(hx, hy - 48);
        ctx.lineTo(hx + 4, hy - 26);
        ctx.lineTo(hx + 14, hy - 42);
        ctx.lineTo(hx + 22, hy - 22);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff8f0";
        ctx.beginPath();
        ctx.arc(hx, hy - 48, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = hat.color;
        roundRectPath(hx - 26, hy - 34, 52, 14, 4);
        ctx.fill();
        roundRectPath(hx - 18, hy - 48, 36, 18, 4);
        ctx.fill();
      }
    }
  }

  function drawBuddy() {
    const squat = buddy.squat * 40;
    const bob = buddy.onGround && !drag ? Math.sin(buddy.bob) * 2 : 0;
    const hx = buddy.x;
    const hy = buddy.y - 55 + squat * 0.4 + bob;
    const torsoY = buddy.y - 10 + squat * 0.5 + bob;
    const facing = buddy.facing;
    const skin = buddyById(save.buddyType);
    const cloth = skin.cloth;
    const clothDark = skin.dark;
    const eyeColor = skin.eye;
    const swing = Math.sin(buddy.armPhase) * (Math.abs(buddy.vx) > 50 || !buddy.onGround ? 14 : 8);
    const scale = save.giant ? 1.55 : 1;

    ctx.save();
    if (scale !== 1) {
      ctx.translate(buddy.x, FLOOR);
      ctx.scale(scale, scale);
      ctx.translate(-buddy.x, -FLOOR);
    }

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(buddy.x, FLOOR - 4, 36 - squat * 0.2, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(buddy.x, buddy.y);
    ctx.rotate(buddy.spin * 0.015);
    ctx.translate(-buddy.x, -buddy.y);

    // SkinAdminBuffer — premium aura behind body
    if (skin.premium) {
      const pulse = 0.55 + Math.sin(buddy.bob * 2.2) * 0.2;
      const g = ctx.createRadialGradient(hx, torsoY, 10, hx, torsoY, 78);
      g.addColorStop(0, `rgba(253, 224, 71, ${0.35 * pulse})`);
      g.addColorStop(0.45, `rgba(167, 139, 250, ${0.28 * pulse})`);
      g.addColorStop(1, "rgba(109, 40, 217, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 78, 0, Math.PI * 2);
      ctx.fill();

      // floating sparkles
      for (let i = 0; i < 6; i++) {
        const a = buddy.bob * 1.4 + i * (Math.PI / 3);
        const rr = 48 + Math.sin(buddy.bob + i) * 6;
        const sx = hx + Math.cos(a) * rr;
        const sy = torsoY + Math.sin(a) * rr * 0.7 - 8;
        ctx.fillStyle = i % 2 ? "#fde68a" : "#fff";
        ctx.globalAlpha = 0.55 + Math.sin(buddy.bob * 3 + i) * 0.35;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // velvet cape
      ctx.fillStyle = "#4c1d95";
      ctx.beginPath();
      ctx.moveTo(hx - 28, torsoY - 28);
      ctx.quadraticCurveTo(hx - 58, torsoY + 10, hx - 36, buddy.y + 48 - squat);
      ctx.quadraticCurveTo(hx, torsoY + 40, hx + 36, buddy.y + 48 - squat);
      ctx.quadraticCurveTo(hx + 58, torsoY + 10, hx + 28, torsoY - 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(hx - 26, torsoY - 30, 52, 5);
    }

    // legs
    ctx.strokeStyle = clothDark;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    const legSwing = drag || !buddy.onGround ? swing * 0.4 : Math.sin(buddy.armPhase) * 14;
    ctx.beginPath();
    ctx.moveTo(hx - 10, torsoY + 28);
    ctx.lineTo(hx - 16 - legSwing, buddy.y + 55 - squat);
    ctx.moveTo(hx + 10, torsoY + 28);
    ctx.lineTo(hx + 16 + legSwing, buddy.y + 55 - squat);
    ctx.stroke();

    // arms
    ctx.strokeStyle = cloth;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(hx - 22, torsoY - 18);
    ctx.lineTo(hx - 40, torsoY + 10 + swing);
    ctx.moveTo(hx + 22, torsoY - 18);
    ctx.lineTo(hx + 40, torsoY + 10 - swing);
    ctx.stroke();

    // torso (plain burlap unless shirt)
    if (skin.premium) {
      const tg = ctx.createLinearGradient(hx - 32, torsoY - 36, hx + 32, torsoY + 34);
      tg.addColorStop(0, "#f5e1ff");
      tg.addColorStop(0.4, cloth);
      tg.addColorStop(1, clothDark);
      ctx.fillStyle = tg;
    } else {
      ctx.fillStyle = cloth;
    }
    roundRectPath(hx - 32, torsoY - 36, 64, 70 - squat * 0.3, 18);
    ctx.fill();
    if (skin.premium) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      roundRectPath(hx - 32, torsoY - 36, 64, 70 - squat * 0.3, 18);
      ctx.stroke();
      // ADMIN badge
      ctx.fillStyle = "#fbbf24";
      roundRectPath(hx - 22, torsoY - 6, 44, 16, 6);
      ctx.fill();
      ctx.fillStyle = "#4c1d95";
      ctx.font = "900 10px Nunito, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ADMIN", hx, torsoY + 2);
    }
    // shoulder patches
    ctx.fillStyle = clothDark;
    ctx.beginPath();
    ctx.arc(hx - 26, torsoY - 22, 9, 0, Math.PI * 2);
    ctx.arc(hx + 26, torsoY - 22, 9, 0, Math.PI * 2);
    ctx.fill();
    if (skin.premium) {
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(hx - 26, torsoY - 22, 3.5, 0, Math.PI * 2);
      ctx.arc(hx + 26, torsoY - 22, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    drawClothes(hx, hy, torsoY, facing);

    // sheriff star badge
    if (skin.star) {
      const cx = hx;
      const cy = torsoY + 2;
      ctx.fillStyle = "#e8a820";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const a2 = a + Math.PI / 5;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
        else ctx.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
        ctx.lineTo(cx + Math.cos(a2) * 4, cy + Math.sin(a2) * 4);
      }
      ctx.closePath();
      ctx.fill();
    }

    // head
    if (skin.premium) {
      const hg = ctx.createRadialGradient(hx - 6, hy - 8, 4, hx, hy, 28);
      hg.addColorStop(0, "#fff7ff");
      hg.addColorStop(0.55, cloth);
      hg.addColorStop(1, clothDark);
      ctx.fillStyle = hg;
    } else {
      ctx.fillStyle = cloth;
    }
    ctx.beginPath();
    ctx.arc(hx, hy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skin.premium ? "#fbbf24" : "rgba(60,40,20,0.25)";
    ctx.lineWidth = skin.premium ? 2.5 : 2;
    ctx.stroke();

    // SkinAdminBuffer crown
    if (skin.premium) {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(hx - 22, hy - 22);
      ctx.lineTo(hx - 16, hy - 44);
      ctx.lineTo(hx - 6, hy - 28);
      ctx.lineTo(hx, hy - 50);
      ctx.lineTo(hx + 6, hy - 28);
      ctx.lineTo(hx + 16, hy - 44);
      ctx.lineTo(hx + 22, hy - 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath();
      ctx.arc(hx, hy - 50, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(hx - 16, hy - 44, 2.2, 0, Math.PI * 2);
      ctx.arc(hx + 16, hy - 44, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // eyes
    const eyeY = hy - 2;
    // Dead X eyes
    if (buddy.dead) {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx - 14, eyeY - 4);
      ctx.lineTo(hx - 6, eyeY + 4);
      ctx.moveTo(hx - 14, eyeY + 4);
      ctx.lineTo(hx - 6, eyeY - 4);
      ctx.moveTo(hx + 6, eyeY - 4);
      ctx.lineTo(hx + 14, eyeY + 4);
      ctx.moveTo(hx + 6, eyeY + 4);
      ctx.lineTo(hx + 14, eyeY - 4);
      ctx.stroke();
    } else if (buddy.blink > 0) {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx - 14, eyeY);
      ctx.lineTo(hx - 6, eyeY);
      ctx.moveTo(hx + 6, eyeY);
      ctx.lineTo(hx + 14, eyeY);
      ctx.stroke();
    } else if (skin.premium) {
      // gem eyes
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(hx - 10, eyeY, 6.2, 0, Math.PI * 2);
      ctx.arc(hx + 10, eyeY, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6d28d9";
      ctx.beginPath();
      ctx.arc(hx - 10, eyeY, 3.2, 0, Math.PI * 2);
      ctx.arc(hx + 10, eyeY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(hx - 11.5, eyeY - 1.5, 1.4, 0, Math.PI * 2);
      ctx.arc(hx + 8.5, eyeY - 1.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(hx - 10, eyeY, 5.5, 0, Math.PI * 2);
      ctx.arc(hx + 10, eyeY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cloth;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx - 12, eyeY - 2);
      ctx.lineTo(hx - 8, eyeY + 2);
      ctx.moveTo(hx - 12, eyeY + 2);
      ctx.lineTo(hx - 8, eyeY - 2);
      ctx.moveTo(hx + 8, eyeY - 2);
      ctx.lineTo(hx + 12, eyeY + 2);
      ctx.moveTo(hx + 8, eyeY + 2);
      ctx.lineTo(hx + 12, eyeY - 2);
      ctx.stroke();
    }

    // smile
    ctx.strokeStyle = skin.premium ? "#6d28d9" : eyeColor;
    ctx.lineWidth = skin.premium ? 2.5 : 2;
    ctx.setLineDash(skin.premium ? [] : [3, 3]);
    ctx.beginPath();
    ctx.arc(hx, hy + 6, 11 * Math.min(1.2, buddy.smile), 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // elemental aura
    if (buddy.frozenT > 0) {
      ctx.fillStyle = "rgba(94,200,232,0.28)";
      ctx.beginPath();
      ctx.arc(hx, torsoY, 48, 0, Math.PI * 2);
      ctx.fill();
    }
    if (buddy.burnT > 0) {
      ctx.fillStyle = "rgba(224,80,48,0.22)";
      ctx.beginPath();
      ctx.arc(hx, torsoY - 10, 42, 0, Math.PI * 2);
      ctx.fill();
    }
    if (buddy.poisonT > 0) {
      ctx.fillStyle = "rgba(106,170,58,0.25)";
      ctx.beginPath();
      ctx.arc(hx, torsoY, 44, 0, Math.PI * 2);
      ctx.fill();
    }
    if (buddy.hurtT > 0) {
      ctx.strokeStyle = `rgba(224,80,48,${buddy.hurtT})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, torsoY, 55, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HP bar
    const bw = 72;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(hx - bw / 2, hy - 48, bw, 7);
    ctx.fillStyle = buddy.hp / buddy.maxHp > 0.3 ? "#3a9a4a" : "#e05030";
    ctx.fillRect(hx - bw / 2, hy - 48, bw * Math.max(0, buddy.hp / buddy.maxHp), 7);

    // speech bubble (not rotated)
    if (buddy.phraseT > 0 && buddy.phrase) {
      const text = buddy.phrase;
      ctx.font = "800 16px Nunito, system-ui";
      const tw = Math.min(280, ctx.measureText(text).width);
      const bx = Math.min(W - tw - 40, Math.max(12, hx + 36));
      const by = hy - 58;
      const bblW = tw + 24;
      const bh = 34;
      ctx.fillStyle = "#fffdf5";
      roundRectPath(bx, by, bblW, bh, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(80,50,10,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx + 8, by + bh);
      ctx.lineTo(bx + 4, by + bh + 12);
      ctx.lineTo(bx + 22, by + bh);
      ctx.fill();
      ctx.fillStyle = "#2a1c08";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + 12, by + bh / 2);
    }

    ctx.restore(); // giant scale
  }

  function render() {
    drawBackground();
    drawBuddy();
    drawProjectiles();
    drawMuzzle();

    for (const b of blasts) {
      const t = Math.max(0, b.life);
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1.2 - t), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.globalAlpha = Math.min(0.25, t);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1.1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.s, p.s);
      ctx.globalAlpha = 1;
    }

    ctx.font = "900 18px Nunito, system-ui";
    ctx.textAlign = "center";
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  syncHud();
  setDeadUI(false);
  toolbar.querySelector("#btn-mute").textContent = save.mute ? "Бади молчит" : "Бади болтает";
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
  if (save.mute) {
    stopAllSpeech();
  } else {
    buddy.sayCd = 0.6;
    say("Я буду болтать без остановки!", { force: true, voice: true });
  }
  canvas.style.cursor = isRanged(effectiveWeapon()) ? "crosshair" : "grab";

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
