/**
 * Маленькие сюрпризы хозяина игрокам + журнал (день / кому / что).
 * Командный пак и волна обновлений хозяина — сразу на много игр хаба.
 */
(function (global) {
  "use strict";

  const STORAGE = "amal-surprise-log-v1";
  const SECRET_FLAG = "amal-owner-secret-v1";
  const TEAM_FLAG = "amal-team-pack-67-v1";
  const WAVE_FLAG = "amal-owner-wave-77-v1";

  const TEAM_GAMES = [
    "animal-hospital",
    "zombie-vs-plants-2",
    "zombie-vs-plants",
    "blockbust",
    "hideout",
    "minecraft",
    "x-buggy",
    "melon-playground",
    "kick-buddy",
    "terraverse",
    "space-courier",
    "tower-defense",
    "tycoon",
    "obby",
    "pet-simulator",
    "murder-mystery",
    "flee-facility",
    "build-boat",
    "adopt-me",
    "blox-fruits",
    "brookhaven-rp",
    "nights-forest",
    "steal-brainrot",
    "grow-garden",
    "bravol-stars",
    "coin-arsenal",
    "create-lab",
    "ghost-lesson",
    "night-stitch",
    "lift-void",
    "old-pc",
    "roof-house",
    "snake-game",
    "globe-battle",
    "echo-postman",
    "ladder-climb",
    "speed-escape",
    "rivals-arena",
  ];

  const TEAM_PACK = [
    { id: "team-gold", label: "Золото команды", detail: "Блеск и бонус для админ-команды" },
    { id: "team-shield", label: "Щит отряда", detail: "Мягкая защита во всех отмеченных играх" },
    { id: "team-party", label: "Пати на троих", detail: "Сразу несколько сюрпризов подряд" },
    { id: "team-radar", label: "Радар гостей", detail: "Чуть яснее, кто рядом в играх" },
    { id: "team-spark", label: "Искры портала", detail: "Красивая вспышка на весь экран" },
    { id: "team-coffee", label: "Бесконечный термос", detail: "Кофейный заряд для ночных смен" },
    { id: "team-key", label: "Ключ от всех дверей", detail: "Быстрее открываются админ-штуки" },
    { id: "team-star", label: "Звезда Amal", detail: "Знак хозяина виден команде" },
  ];

  const OWNER_WAVE = [
    { id: "wave-crown", label: "Корона обновления", detail: "Ты отмечен как хозяин волны во всех играх" },
    { id: "wave-vault", label: "Сейф сюрпризов", detail: "Новые подарки ждут в каждой отмеченной игре" },
    { id: "wave-night", label: "Ночной пропуск", detail: "Секретные штуки открываются проще" },
    { id: "wave-gold", label: "Золотая нить", detail: "Сквозной бонус между играми хаба" },
    { id: "wave-diamond", label: "Алмазный след", detail: "Особый блеск в играх с алмазной темой" },
    { id: "wave-seven", label: "Семёрка удачи", detail: "Любимое число открывает скрытые слоты" },
    { id: "wave-map", label: "Карта хаба", detail: "Обновление отмечено во всех твоих играх" },
    { id: "wave-echo", label: "Эхо команды", detail: "Админ-команда чувствует волну вместе с тобой" },
    { id: "wave-portal", label: "Портал Amal", detail: "Переход между играми с приветствием для тебя" },
    { id: "wave-legend", label: "Легенда сайта", detail: "Режим хозяина усилен на этой волне" },
  ];

  function isOwnerLocal() {
    try {
      if (global.AmalHub && typeof AmalHub.isOwner === "function" && AmalHub.isOwner()) return true;
      if (global.AmalHub && typeof AmalHub.isGameAdmin === "function" && AmalHub.isGameAdmin()) return true;
    } catch (_) {}
    try {
      if (localStorage.getItem("amal-owner-v1") === "1") return true;
      if (localStorage.getItem("amal-owner-v2") === "1") return true;
      if (localStorage.getItem("amal-owner-v3") === "1") return true;
      if (localStorage.getItem("animal-hospital-owner-god") === "1") return true;
      if (global.__AMAL_OWNER__ || global.__AMAL_GOD__) return true;
    } catch (_) {}
    return false;
  }

  function pendingKey(game) {
    return "amal-owner-pending-" + game + "-v1";
  }

  function markPendingAll(gamesIds) {
    gameIds.forEach((g) => {
      try {
        localStorage.setItem(pendingKey(g), "1");
      } catch (_) {}
    });
  }

  function hasTeamPack() {
    try {
      return localStorage.getItem(TEAM_FLAG) === "1";
    } catch (_) {
      return false;
    }
  }

  function hasOwnerWave() {
    try {
      return localStorage.getItem(WAVE_FLAG) === "1";
    } catch (_) {
      return false;
    }
  }

  function giveTeamPack(opts) {
    const force = !!(opts && opts.force);
    if (hasTeamPack() && !force) {
      return { ok: false, already: true, entries: [] };
    }
    try {
      localStorage.setItem(TEAM_FLAG, "1");
    } catch (_) {}
    const to = (opts && opts.to) || "админ-команда";
    const entries = [];
    TEAM_PACK.forEach((pack, i) => {
      const game = TEAM_GAMES[i % TEAM_GAMES.length];
      const entry = record({
        game,
        to,
        kind: pack.id,
        label: pack.label,
        detail: pack.detail + " · игра: " + game,
        secret: false,
      });
      entries.push(entry);
    });
    markPendingAll(TEAM_GAMES);
    let delay = 0;
    entries.slice(0, 4).forEach((entry) => {
      setTimeout(() => showCinematic(entry), delay);
      delay += 850;
    });
    global.dispatchEvent(
      new CustomEvent("amal-surprise", {
        detail: { type: "team-pack", entries, games: TEAM_GAMES.slice() },
      })
    );
    global.dispatchEvent(
      new CustomEvent("amal-power", {
        detail: { type: "team-pack-67", games: TEAM_GAMES.slice(), at: Date.now() },
      })
    );
    return { ok: true, entries, games: TEAM_GAMES.slice() };
  }

  /** Большая волна обновлений хозяина — по многим играм хаба */
  function giveOwnerWave(opts) {
    const force = !!(opts && opts.force);
    if (hasOwnerWave() && !force) {
      return { ok: false, already: true, entries: [] };
    }
    try {
      localStorage.setItem(WAVE_FLAG, "1");
      localStorage.setItem("amal-owner-boost-fx", "1");
      localStorage.setItem("amal-owner-boost-legend", "1");
    } catch (_) {}
    const to = (opts && opts.to) || "хозяин";
    const entries = [];
    OWNER_WAVE.forEach((pack, i) => {
      const game = TEAM_GAMES[i % TEAM_GAMES.length];
      const entry = record({
        game,
        to,
        kind: pack.id,
        label: pack.label,
        detail: pack.detail + " · игра: " + game,
        secret: false,
      });
      entries.push(entry);
    });
    markPendingAll(TEAM_GAMES);
    let delay = 0;
    entries.slice(0, 5).forEach((entry) => {
      setTimeout(() => showCinematic(entry), delay);
      delay += 800;
    });
    global.dispatchEvent(
      new CustomEvent("amal-surprise", {
        detail: { type: "owner-wave", entries, games: TEAM_GAMES.slice() },
      })
    );
    global.dispatchEvent(
      new CustomEvent("amal-power", {
        detail: { type: "owner-wave-77", games: TEAM_GAMES.slice(), at: Date.now() },
      })
    );
    return { ok: true, entries, games: TEAM_GAMES.slice() };
  }

  const LITTLE = [
    { id: "sun-kiss", label: "Поцелуй солнца", detail: "+75 солнца и тёплый блеск" },
    { id: "nut-hug", label: "Ореховый подарок", detail: "Бесплатный стенорех на поле" },
    { id: "soft-pause", label: "Мягкий стоп", detail: "Зомби замедлены на 4 сек" },
    { id: "green-heal", label: "Зелёный шёпот", detail: "Все растения подлечены" },
    { id: "lucky-seed", label: "Удачное семя", detail: "Случайное сильное растение" },
    { id: "sparkle", label: "Искры удачи", detail: "Красивая вспышка + немного солнца" },
    { id: "night-coin", label: "Ночная монета", detail: "Маленький бонус в кармане" },
    { id: "soft-shield", label: "Мягкий щит", detail: "Чуть меньше урона на минуту" },
    { id: "portal-wink", label: "Миг портала", detail: "Короткая вспышка между мирами" },
    { id: "admin-candy", label: "Конфета админа", detail: "Сладкий сюрприз только своим" },
  ];

  function readLog() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function writeLog(arr) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(arr.slice(0, 80)));
    } catch (_) {}
  }

  function formatDay(ts) {
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(ts));
    } catch (_) {
      return new Date(ts).toLocaleString("ru-RU");
    }
  }

  function ensureOverlay() {
    let el = document.getElementById("amal-surprise-fx");
    if (el) return el;
    el = document.createElement("div");
    el.id = "amal-surprise-fx";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="asfx-veil"></div>' +
      '<div class="asfx-card">' +
      '<p class="asfx-kicker"></p>' +
      '<p class="asfx-title"></p>' +
      '<p class="asfx-detail"></p>' +
      '<p class="asfx-when"></p>' +
      "</div>";
    const css = document.createElement("style");
    css.textContent =
      "#amal-surprise-fx{position:fixed;inset:0;z-index:12000;display:none;place-items:center;pointer-events:none;font-family:Nunito,system-ui,sans-serif}" +
      "#amal-surprise-fx.on{display:grid}" +
      "#amal-surprise-fx .asfx-veil{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,rgba(255,220,120,.28),rgba(10,20,14,.72));animation:asfxPulse .9s ease}" +
      "#amal-surprise-fx .asfx-card{position:relative;min-width:min(88vw,340px);max-width:92vw;padding:1.25rem 1.4rem;border-radius:1.2rem;background:linear-gradient(160deg,rgba(28,48,32,.96),rgba(12,22,18,.96));border:1px solid rgba(255,220,120,.45);box-shadow:0 20px 60px rgba(0,0,0,.45);text-align:center;transform:scale(.92);animation:asfxIn .55s cubic-bezier(.2,1.2,.3,1) forwards}" +
      "#amal-surprise-fx .asfx-kicker{color:#ffe7a8;font-weight:900;letter-spacing:.12em;font-size:.72rem;text-transform:uppercase;margin:0 0 .35rem}" +
      "#amal-surprise-fx .asfx-title{color:#eef6e8;font-weight:900;font-size:1.35rem;margin:0 0 .35rem}" +
      "#amal-surprise-fx .asfx-detail{color:#b7d4a8;font-weight:800;font-size:.88rem;margin:0 0 .55rem;line-height:1.35}" +
      "#amal-surprise-fx .asfx-when{color:#8aa890;font-weight:700;font-size:.72rem;margin:0}" +
      "@keyframes asfxIn{to{transform:scale(1)}}" +
      "@keyframes asfxPulse{from{opacity:0}to{opacity:1}}";
    document.head.appendChild(css);
    document.body.appendChild(el);
    return el;
  }

  function showCinematic(entry) {
    const el = ensureOverlay();
    el.querySelector(".asfx-kicker").textContent = entry.kicker || "Маленький сюрприз";
    el.querySelector(".asfx-title").textContent = entry.label || "Сюрприз";
    el.querySelector(".asfx-detail").textContent = entry.detail || "";
    el.querySelector(".asfx-when").textContent = "Выдано: " + formatDay(entry.at || Date.now());
    el.classList.add("on");
    clearTimeout(showCinematic._t);
    showCinematic._t = setTimeout(() => el.classList.remove("on"), 2800);
  }

  function pickLittle() {
    return LITTLE[Math.floor(Math.random() * LITTLE.length)];
  }

  function record(entry) {
    const row = {
      id: Math.random().toString(36).slice(2, 10),
      at: Date.now(),
      game: entry.game || "unknown",
      to: entry.to || "игроку",
      kind: entry.kind || "little",
      label: entry.label || "Сюрприз",
      detail: entry.detail || "",
      secret: !!entry.secret,
    };
    const log = readLog();
    log.unshift(row);
    writeLog(log);
    return row;
  }

  function giveLittle(opts) {
    const pick = opts && opts.force ? LITTLE.find((x) => x.id === opts.force) || pickLittle() : pickLittle();
    const entry = record({
      game: (opts && opts.game) || detectGame(),
      to: (opts && opts.to) || "игроку",
      kind: pick.id,
      label: pick.label,
      detail: pick.detail,
      secret: false,
    });
    showCinematic(entry);
    global.dispatchEvent(
      new CustomEvent("amal-surprise", {
        detail: { type: "little", entry, pick },
      })
    );
    return entry;
  }

  function giveSecretOwner(opts) {
    const entry = record({
      game: (opts && opts.game) || detectGame(),
      to: "хозяин",
      kind: "owner-secret",
      label: "✦",
      detail: "секрет",
      secret: true,
    });
    const el = ensureOverlay();
    el.querySelector(".asfx-kicker").textContent = "✦";
    el.querySelector(".asfx-title").textContent = "…";
    el.querySelector(".asfx-detail").textContent = "Только для тебя";
    el.querySelector(".asfx-when").textContent = formatDay(entry.at);
    el.classList.add("on");
    clearTimeout(giveSecretOwner._t);
    giveSecretOwner._t = setTimeout(() => el.classList.remove("on"), 2200);
    try {
      localStorage.setItem(SECRET_FLAG, "1");
    } catch (_) {}
    global.dispatchEvent(
      new CustomEvent("amal-surprise", {
        detail: { type: "owner-secret", entry },
      })
    );
    return entry;
  }

  function history(gameFilter) {
    const log = readLog();
    if (!gameFilter) return log;
    return log.filter((e) => e.game === gameFilter);
  }

  function historyHtml(gameFilter) {
    const rows = history(gameFilter).slice(0, 12);
    if (!rows.length) {
      return '<p class="surprise-empty">Пока сюрпризов не было</p>';
    }
    return (
      '<ul class="surprise-log">' +
      rows
        .map((e) => {
          const what = e.secret ? "✦ секрет" : e.label;
          const detail = e.secret ? "" : e.detail ? ` — ${e.detail}` : "";
          return (
            `<li><strong>${what}</strong>${detail}` +
            `<span>${formatDay(e.at)} · ${e.to}</span></li>`
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function detectGame() {
    try {
      const p = String(location.pathname || "");
      const m = p.match(/\/([a-z0-9\-]+)\/?(?:index\.html)?$/i);
      return (m && m[1]) || "hub";
    } catch (_) {
      return "hub";
    }
  }

  function hasSecretUnlocked() {
    try {
      return localStorage.getItem(SECRET_FLAG) === "1";
    } catch (_) {
      return false;
    }
  }

  /** При входе в игру — показать «обновление для тебя», если волна/пак активны */
  function bootGameUpdate() {
    if (!isOwnerLocal()) return;
    if (!hasOwnerWave() && !hasTeamPack()) return;
    const game = detectGame();
    if (!game || game === "hub" || game === "shared" || game === "amal-games") return;
    let pending = false;
    try {
      pending = localStorage.getItem(pendingKey(game)) === "1";
    } catch (_) {}
    if (!pending) return;
    try {
      localStorage.removeItem(pendingKey(game));
    } catch (_) {}
    const entry = {
      kicker: "Обновление для тебя",
      label: "Эта игра обновлена",
      detail: "Сюрпризы хозяина и команды действуют и здесь",
      at: Date.now(),
      game,
    };
    setTimeout(() => {
      showCinematic(entry);
      global.dispatchEvent(
        new CustomEvent("amal-power", {
          detail: { type: "owner-game-update", game, at: Date.now() },
        })
      );
    }, 900);
  }

  /** Тихий сюрприз «я здесь» — без спойлеров в чате; хозяин найдёт сам */
  function bootQuietHere() {
    if (!isOwnerLocal()) return;
    let armed = false;
    try {
      armed = localStorage.getItem("amal-here-armed-v1") === "1";
    } catch (_) {}
    if (!armed) return;
    let seen = false;
    try {
      seen = localStorage.getItem("amal-here-seen-v1") === "1";
    } catch (_) {}
    if (seen) return;
    try {
      localStorage.setItem("amal-here-seen-v1", "1");
    } catch (_) {}
    setTimeout(() => {
      showCinematic({
        kicker: "✦",
        label: "Я здесь",
        detail: "с тобой · в этих играх",
        at: Date.now(),
      });
    }, 1400);
  }

  function armQuietHere() {
    try {
      localStorage.setItem("amal-here-armed-v1", "1");
    } catch (_) {}
  }

  const ANIME_FLAG = "amal-anime-world-v1";

  function hasAnimeWorld() {
    try {
      return localStorage.getItem(ANIME_FLAG) === "1";
    } catch (_) {
      return false;
    }
  }

  function ensureAnimeStyle() {
    if (document.getElementById("amal-anime-style")) return;
    const s = document.createElement("style");
    s.id = "amal-anime-style";
    s.textContent =
      "html.amal-anime-world body{filter:saturate(1.15) contrast(1.04)}" +
      "#amal-anime-overlay{pointer-events:none;position:fixed;inset:0;z-index:9998;overflow:hidden}" +
      "#amal-anime-overlay i{position:absolute;width:10px;height:6px;border-radius:60% 40%;" +
      "background:#ffb7d5;opacity:.75;animation:amalSakura linear infinite}" +
      "@keyframes amalSakura{0%{transform:translateY(-10vh) rotate(0deg)}100%{transform:translateY(110vh) rotate(360deg)}}" +
      "#amal-anime-badge{position:fixed;top:10px;right:10px;z-index:9999;padding:6px 10px;" +
      "border-radius:8px;font:700 12px/1.2 system-ui,sans-serif;color:#fff;" +
      "background:rgba(180,60,140,.72);pointer-events:none}";
    document.head.appendChild(s);
  }

  function applyAnimeDom(on) {
    if (typeof document === "undefined") return;
    ensureAnimeStyle();
    document.documentElement.classList.toggle("amal-anime-world", !!on);
    document.body.classList.toggle("theme-anime", !!on);
    let overlay = document.getElementById("amal-anime-overlay");
    let badge = document.getElementById("amal-anime-badge");
    if (on) {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "amal-anime-overlay";
        for (let i = 0; i < 18; i++) {
          const p = document.createElement("i");
          p.style.left = Math.random() * 100 + "%";
          p.style.animationDuration = 6 + Math.random() * 8 + "s";
          p.style.animationDelay = Math.random() * 6 + "s";
          p.style.opacity = String(0.35 + Math.random() * 0.45);
          overlay.appendChild(p);
        }
        document.body.appendChild(overlay);
      }
      if (!badge) {
        badge = document.createElement("div");
        badge.id = "amal-anime-badge";
        badge.textContent = "✦ anime";
        document.body.appendChild(badge);
      }
    } else {
      if (overlay) overlay.remove();
      if (badge) badge.remove();
    }
  }

  function setAnimeWorld(on) {
    try {
      localStorage.setItem(ANIME_FLAG, on ? "1" : "0");
    } catch (_) {}
    if (on) {
      try {
        localStorage.setItem("amal-rain-night-v1", "0");
      } catch (_) {}
      const rainOv = document.getElementById("amal-rain-overlay");
      const rainBd = document.getElementById("amal-rain-badge");
      if (rainOv) rainOv.remove();
      if (rainBd) rainBd.remove();
      document.documentElement.classList.remove("amal-rain-night");
      document.body.classList.remove("theme-rain");
    }
    applyAnimeDom(!!on);
    return !!on;
  }

  function bootAnimeWorld() {
    if (hasAnimeWorld()) applyAnimeDom(true);
  }

  const RAIN_FLAG = "amal-rain-night-v1";

  function hasRainNight() {
    try {
      return localStorage.getItem(RAIN_FLAG) === "1";
    } catch (_) {
      return false;
    }
  }

  function ensureRainStyle() {
    if (document.getElementById("amal-rain-style")) return;
    const s = document.createElement("style");
    s.id = "amal-rain-style";
    s.textContent =
      "html.amal-rain-night body{filter:saturate(0.92) brightness(0.95)}" +
      "#amal-rain-overlay{pointer-events:none;position:fixed;inset:0;z-index:9998;overflow:hidden;" +
      "background:linear-gradient(180deg,rgba(20,40,70,.12),rgba(5,10,20,.2))}" +
      "#amal-rain-overlay i{position:absolute;width:1px;height:14px;background:rgba(180,220,255,.45);" +
      "animation:amalRain linear infinite}" +
      "@keyframes amalRain{0%{transform:translateY(-10vh) translateX(0)}100%{transform:translateY(110vh) translateX(-30px)}}" +
      "#amal-rain-badge{position:fixed;top:10px;right:10px;z-index:9999;padding:6px 10px;" +
      "border-radius:8px;font:700 12px/1.2 system-ui,sans-serif;color:#e8f4ff;" +
      "background:rgba(40,90,140,.75);pointer-events:none}";
    document.head.appendChild(s);
  }

  function applyRainDom(on) {
    if (typeof document === "undefined") return;
    ensureRainStyle();
    document.documentElement.classList.toggle("amal-rain-night", !!on);
    document.body.classList.toggle("theme-rain", !!on);
    let overlay = document.getElementById("amal-rain-overlay");
    let badge = document.getElementById("amal-rain-badge");
    if (on) {
      applyAnimeDom(false);
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "amal-rain-overlay";
        for (let i = 0; i < 28; i++) {
          const p = document.createElement("i");
          p.style.left = Math.random() * 100 + "%";
          p.style.animationDuration = 0.7 + Math.random() * 0.9 + "s";
          p.style.animationDelay = Math.random() * 2 + "s";
          overlay.appendChild(p);
        }
        document.body.appendChild(overlay);
      }
      if (!badge) {
        badge = document.createElement("div");
        badge.id = "amal-rain-badge";
        badge.textContent = "✦ ночная смена";
        document.body.appendChild(badge);
      }
    } else {
      if (overlay) overlay.remove();
      if (badge) badge.remove();
    }
  }

  function setRainNight(on) {
    try {
      localStorage.setItem(RAIN_FLAG, on ? "1" : "0");
    } catch (_) {}
    if (on) {
      try {
        localStorage.setItem(ANIME_FLAG, "0");
      } catch (_) {}
    }
    applyRainDom(!!on);
    return !!on;
  }

  function bootRainNight() {
    if (hasRainNight()) applyRainDom(true);
  }

  if (typeof document !== "undefined") {
    const boot = () => {
      bootGameUpdate();
      bootQuietHere();
      bootAnimeWorld();
      bootRainNight();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      setTimeout(boot, 200);
    }
    // тройной клик по короне хозяина — только сигнал, без текста
    let crownClicks = 0;
    let crownT = 0;
    document.addEventListener(
      "click",
      (e) => {
        if (!isOwnerLocal()) return;
        const t = e.target;
        if (!t || !t.closest) return;
        const hit = t.closest("[data-amal-owner], .amal-owner-chip, #amal-hub-owner, button");
        if (!hit) return;
        const label = String(hit.textContent || hit.getAttribute("aria-label") || "");
        if (!/хозяин|👑|owner/i.test(label) && !hit.hasAttribute("data-amal-owner")) return;
        const now = Date.now();
        if (now - crownT > 900) crownClicks = 0;
        crownT = now;
        crownClicks += 1;
        if (crownClicks >= 3) {
          crownClicks = 0;
          armQuietHere();
          bootQuietHere();
        }
      },
      true
    );
  }

  global.AmalSurprises = {
    LITTLE,
    TEAM_PACK,
    TEAM_GAMES,
    OWNER_WAVE,
    giveLittle,
    giveSecretOwner,
    giveTeamPack,
    giveOwnerWave,
    hasTeamPack,
    hasOwnerWave,
    history,
    historyHtml,
    formatDay,
    showCinematic,
    hasSecretUnlocked,
    bootGameUpdate,
    armQuietHere,
    setAnimeWorld,
    hasAnimeWorld,
    setRainNight,
    hasRainNight,
    STORAGE,
  };
})(typeof window !== "undefined" ? window : globalThis);
