/**
 * Маленькие сюрпризы хозяина игрокам + журнал (день / кому / что).
 * Секрет хозяина — без спойлеров в UI.
 */
(function (global) {
  "use strict";

  const STORAGE = "amal-surprise-log-v1";
  const SECRET_FLAG = "amal-owner-secret-v1";

  const LITTLE = [
    { id: "sun-kiss", label: "Поцелуй солнца", detail: "+75 солнца и тёплый блеск" },
    { id: "nut-hug", label: "Ореховый подарок", detail: "Бесплатный стенорех на поле" },
    { id: "soft-pause", label: "Мягкий стоп", detail: "Зомби замедлены на 4 сек" },
    { id: "green-heal", label: "Зелёный шёпот", detail: "Все растения подлечены" },
    { id: "lucky-seed", label: "Удачное семя", detail: "Случайное сильное растение" },
    { id: "sparkle", label: "Искры удачи", detail: "Красивая вспышка + немного солнца" },
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
    } catch (_) {
      /* ignore */
    }
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
    el.querySelector(".asfx-kicker").textContent = "Маленький сюрприз";
    el.querySelector(".asfx-title").textContent = entry.label || "Сюрприз";
    el.querySelector(".asfx-detail").textContent = entry.detail || "";
    el.querySelector(".asfx-when").textContent = "Выдано: " + formatDay(entry.at);
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

  /** Секрет хозяина — без расшифровки в интерфейсе */
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
    } catch (_) {
      /* ignore */
    }
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

  global.AmalSurprises = {
    LITTLE,
    giveLittle,
    giveSecretOwner,
    history,
    historyHtml,
    formatDay,
    showCinematic,
    hasSecretUnlocked,
    STORAGE,
  };
})(typeof window !== "undefined" ? window : globalThis);
