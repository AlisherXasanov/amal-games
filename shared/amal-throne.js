/**
 * Трон Амаля — абсолютная сила только настоящего хозяина.
 * Не lucky-admin, не выданная админка, не кубы — им это недоступно.
 */
(function (global) {
  "use strict";

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const SECRET = "AmalOwner2026";
  const STORAGE_SUPPRESS = "amal-throne-suppress-cubes";
  const STORAGE_SNAP = "amal-throne-snap-v1";
  const STORAGE_ABSOLUTE = "amal-throne-absolute-v1";
  const ABSOLUTE_MULT = 10000;
  const INF = 999999999;

  const state = {
    open: false,
    sovereign: false,
    rewrite: false,
    mult: 1,
    absolute: false
  };

  /** Только истинный хозяин сайта — не «случайный админ», не куб. */
  function isLocalHost() {
    try {
      const h = String(location.hostname || "");
      return h === "127.0.0.1" || h === "localhost" || h === "::1";
    } catch (_) {
      return false;
    }
  }

  function ensureLocalOwner() {
    // На своём компе — ты хозяин: без этого кнопки не видно
    if (!isLocalHost()) return;
    try {
      if (localStorage.getItem("amal-owner-v3") !== "1") {
        localStorage.setItem("amal-owner-v3", "1");
        localStorage.setItem("amal-owner-v2", "1");
        localStorage.setItem("amal-owner-v1", "1");
      }
      global.__AMAL_OWNER__ = true;
      global.__AMAL_GOD__ = true;
      if (global.AmalOwner && typeof AmalOwner.unlock === "function") {
        try {
          AmalOwner.unlock("amal");
        } catch (_) {}
      }
    } catch (_) {}
  }

  function isThroneLord() {
    try {
      if (global.__AMAL_GUEST__ === true) return false;
      ensureLocalOwner();

      // Сначала настоящий хозяин
      try {
        if (global.AmalOwner && typeof AmalOwner.isOwner === "function" && AmalOwner.isOwner()) return true;
      } catch (_) {}
      if (global.__AMAL_OWNER__ === true) return true;
      if (OWNER_KEYS.some((k) => localStorage.getItem(k) === "1")) return true;

      try {
        if (global.AmalPowers && typeof AmalPowers.isOwner === "function" && AmalPowers.isOwner()) return true;
      } catch (_) {}
      try {
        if (global.AmalHub && typeof AmalHub.isOwner === "function" && AmalHub.isOwner()) return true;
      } catch (_) {}

      const code = String(new URLSearchParams(location.search).get("owner") || "").trim();
      const norm = code.toLowerCase().replace(/[\s,.\-_/]+/g, "");
      if (
        code === SECRET ||
        norm === "amalowner2026" ||
        norm === "amal" ||
        norm === "1234" ||
        norm === "buddy"
      ) {
        return true;
      }

      // localhost всегда трон (ты разрабатываешь)
      if (isLocalHost()) return true;

      return false;
    } catch (_) {
      return false;
    }
  }

  function isOwner() {
    return isThroneLord();
  }

  function toast(msg) {
    let el = document.getElementById("amal-throne-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-throne-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function banner(text) {
    let el = document.getElementById("amal-throne-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "amal-throne-banner";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(banner._t);
    banner._t = setTimeout(() => el.classList.remove("show"), 5000);
  }

  function emit(detail) {
    try {
      global.dispatchEvent(new CustomEvent("amal-throne", { detail: detail || {} }));
    } catch (_) {}
  }

  function floodVault() {
    const keys = [
      "amal-coins", "amalCoins", "coins", "amal-money", "money",
      "amal-score", "score", "cups", "amal-cups", "gems", "diamonds",
      "amal-gems", "amal-diamonds", "iron", "gold", "amal-iron", "amal-gold"
    ];
    try {
      keys.forEach((k) => {
        try {
          localStorage.setItem(k, String(INF));
        } catch (_) {}
      });
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (/(coin|money|score|cup|gem|diamond|gold|iron|wallet|balance)/i.test(k)) {
          try {
            localStorage.setItem(k, String(INF));
          } catch (_) {}
        }
      }
    } catch (_) {}
    global.__AMAL_COINS__ = INF;
    global.__AMAL_SCORE__ = INF;
    emit({ vault: true, amount: INF });
  }

  function applyAbsoluteFlags(mult, opts) {
    opts = opts || {};
    const m = Math.max(ABSOLUTE_MULT, Number(mult) || ABSOLUTE_MULT);
    state.mult = m;
    state.absolute = true;
    global.__AMAL_THRONE__ = true;
    global.__AMAL_ABSOLUTE__ = true;
    global.__AMAL_POWER_MULT__ = m;
    global.__AMAL_GOD__ = true;
    global.__AMAL_DMG__ = true;
    global.__AMAL_SPEED__ = true;
    global.__AMAL_LEGEND__ = true;
    global.__AMAL_OWNER__ = true;
    global.__AMAL_UNTOUCHABLE__ = true;
    try {
      localStorage.setItem(STORAGE_ABSOLUTE, "1");
    } catch (_) {}
    // Мягкий режим: сила есть, но экран НЕ затемняем и не мигаем
    document.body.classList.remove("amal-throne-absolute", "amal-throne-rewrite");
    if (!opts.softVisual) {
      document.body.classList.add("amal-throne-soft");
    } else {
      document.body.classList.add("amal-throne-soft");
    }
  }

  function clearScreenEffects() {
    state.absolute = false;
    global.__AMAL_ABSOLUTE__ = false;
    try {
      localStorage.removeItem(STORAGE_ABSOLUTE);
      localStorage.removeItem("amal-vibe-v1");
    } catch (_) {}
    document.body.classList.remove(
      "amal-throne-absolute",
      "amal-throne-rewrite",
      "amal-throne-soft",
      "amal-throne-cubes-down"
    );
    const vibe = document.getElementById("amal-vibe");
    if (vibe) {
      vibe.style.display = "none";
      vibe.className = "";
    }
    const sov = document.getElementById("amal-throne-sovereign");
    if (sov) sov.classList.remove("on");
    state.sovereign = false;
    try {
      document.documentElement.style.filter = "";
    } catch (_) {}
  }

  function injectCss() {
    if (document.getElementById("amal-throne-style")) return;
    const st = document.createElement("style");
    st.id = "amal-throne-style";
    st.textContent = `
#amal-throne-fab{
  position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);
  z-index:2147483646;border:0;border-radius:18px;padding:12px 18px;cursor:pointer;pointer-events:auto;
  font:900 14px/1 Nunito,system-ui,sans-serif;color:#1a1004;
  background:linear-gradient(135deg,#fff7ed,#fbbf24 40%,#b45309 85%,#7f1d1d);
  box-shadow:0 0 0 2px rgba(251,191,36,.55),0 10px 28px rgba(0,0,0,.4);
}
#amal-throne-fab:hover{filter:brightness(1.08)}
#amal-throne-panel{
  position:fixed;inset:0;z-index:2147483601;display:none;align-items:center;justify-content:center;
  padding:16px;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);
}
#amal-throne-panel.open{display:flex}
#amal-throne-panel .ath-card{
  width:min(460px,96vw);max-height:min(90dvh,760px);overflow:auto;border-radius:24px;
  border:2px solid rgba(251,191,36,.75);
  background:linear-gradient(165deg,#1c1006f8,#05060cf9 42%,#1a0608f6);
  color:#fef9c3;box-shadow:0 32px 100px rgba(0,0,0,.75),0 0 80px rgba(180,83,9,.25);
  padding:16px 16px 18px;
}
#amal-throne-panel .ath-head{text-align:center;margin-bottom:12px}
#amal-throne-panel .ath-head h2{
  margin:0;font:900 24px/1.1 Nunito,system-ui,sans-serif;letter-spacing:.05em;
  background:linear-gradient(90deg,#fffbeb,#fbbf24,#f59e0b,#fecaca);-webkit-background-clip:text;color:transparent;
}
#amal-throne-panel .ath-head p{margin:8px 0 0;font:800 12px/1.4 Nunito,system-ui;color:#e7c37a}
#amal-throne-panel .ath-head .ath-lock{
  display:inline-block;margin-top:8px;padding:4px 10px;border-radius:999px;
  background:rgba(127,29,29,.55);border:1px solid rgba(252,165,165,.45);color:#fecaca;font:900 11px Nunito,system-ui;
}
#amal-throne-panel .ath-grid{display:grid;gap:8px}
#amal-throne-panel button.ath{
  border:1px solid rgba(251,191,36,.4);border-radius:14px;padding:12px;cursor:pointer;
  text-align:left;font:800 13px/1.25 Nunito,system-ui;color:#fff7ed;background:rgba(255,255,255,.06);
}
#amal-throne-panel button.ath small{display:block;margin-top:3px;opacity:.75;font-weight:700;font-size:11px}
#amal-throne-panel button.ath.ascend{
  border-color:rgba(251,191,36,.95);
  background:linear-gradient(135deg,rgba(245,158,11,.5),rgba(127,29,29,.55));
  font-size:15px;box-shadow:0 8px 28px rgba(245,158,11,.35);
}
#amal-throne-panel button.ath.warn-off{
  border-color:rgba(125,217,184,.7);
  background:rgba(16,48,36,.55);
}
#amal-throne-panel button.ath:active{transform:scale(.98)}
#amal-throne-panel .ath-close{
  margin-top:10px;width:100%;border:0;border-radius:14px;padding:11px;cursor:pointer;
  font:900 13px Nunito,system-ui;background:rgba(255,255,255,.08);color:#e7e5e4;
}
#amal-throne-toast{
  position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:2147483605;
  padding:10px 16px;border-radius:14px;opacity:0;transition:opacity .2s;pointer-events:none;
  background:rgba(0,0,0,.9);border:1px solid rgba(251,191,36,.6);color:#fde68a;
  font:900 14px/1.3 Nunito,system-ui;max-width:92vw;text-align:center;
}
#amal-throne-toast.show{opacity:1}
#amal-throne-banner{
  position:fixed;left:50%;top:7%;transform:translateX(-50%);z-index:2147483604;
  padding:14px 24px;border-radius:999px;opacity:0;transition:opacity .25s;pointer-events:none;
  background:linear-gradient(90deg,#7f1d1d,#b45309,#f59e0b,#fde68a);color:#1c1917;
  font:900 16px/1.2 Nunito,system-ui;box-shadow:0 18px 56px rgba(180,83,9,.55);max-width:94vw;text-align:center;
}
#amal-throne-banner.show{opacity:1}
body.amal-throne-cubes-down #amal-glitch-ghost,
body.amal-throne-cubes-down #amal-glitch-catch{
  display:none !important;visibility:hidden !important;pointer-events:none !important;
}
/* Жёсткие затемнения УБРАНЫ — они делали сайт чёрным и «мигающим» */
body.amal-throne-absolute::before,
body.amal-throne-rewrite::before,
body.amal-throne-absolute::after,
body.amal-throne-rewrite::after{display:none!important;content:none!important}
body.amal-throne-absolute,body.amal-throne-rewrite,body.amal-throne-soft{
  filter:none!important;
}
body.amal-throne-soft #amal-throne-fab::after{
  content:" · сила";font-size:11px;opacity:.8;
}
#amal-throne-sovereign{
  display:none!important;
}
#amal-throne-sovereign.on{display:none!important}
#amal-throne-sovereign .ath-sov-tag{
  position:absolute;left:50%;bottom:18%;transform:translateX(-50%);
  padding:10px 16px;border-radius:999px;background:rgba(0,0,0,.88);color:#fde68a;
  font:900 13px Nunito,system-ui;border:1px solid rgba(251,191,36,.5);pointer-events:none;
}
`;
    document.head.appendChild(st);
  }

  function ensureUi() {
    injectCss();
    if (!document.getElementById("amal-throne-fab")) {
      const fab = document.createElement("button");
      fab.type = "button";
      fab.id = "amal-throne-fab";
      fab.title = "Трон Амаля (T) — только хозяин";
      fab.textContent = "♛ АБСОЛЮТ";
      fab.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle(true);
      });
      document.body.appendChild(fab);
    }
    if (!document.getElementById("amal-throne-panel")) {
      const panel = document.createElement("div");
      panel.id = "amal-throne-panel";
      panel.innerHTML =
        '<div class="ath-card" role="dialog" aria-label="Трон Амаля">' +
        '<div class="ath-head">' +
        "<h2>♛ ТРОН · АБСОЛЮТ</h2>" +
        "<p>Сила, которую нельзя купить и нельзя выдать случайному. Кубы и обычные админы — ниже.</p>" +
        '<div class="ath-lock">🔒 Только настоящий хозяин · не для lucky / не для куба</div>' +
        "</div>" +
        '<div class="ath-grid">' +
        '<button type="button" class="ath ascend" data-throne="throne-absolute">☀ АБСОЛЮТНАЯ СИЛА<small>×10000 · без затемнения экрана</small></button>' +
        '<button type="button" class="ath warn-off" data-throne="throne-fx-off">🛡 Выключить эффекты экрана<small>Убрать темноту, радугу, мигание — сайт снова нормальный</small></button>' +
        '<button type="button" class="ath ascend" data-throne="throne-ascend">☀ Вознесение<small>Полный пакет Трона</small></button>' +
        '<button type="button" class="ath" data-throne="throne-x10000">⚔ Сила ×10000<small>В сто раз сильнее прежнего ×100</small></button>' +
        '<button type="button" class="ath" data-throne="throne-vault">💎 Бездонная казна<small>∞ монеты / очки / ресурсы — недоступно «просто игроку»</small></button>' +
        '<button type="button" class="ath" data-throne="throne-untouchable">🛡 Неприкасаемый<small>Урон к тебе = 0 навсегда в сессии</small></button>' +
        '<button type="button" class="ath" data-throne="throne-suppress">⛓ Подавить глитч-кубы<small>Случайные глитч-кубы исчезают · админ-куб остаётся</small></button>' +
        '<button type="button" class="ath" data-throne="throne-restore">♻ Вернуть глитч-кубы<small>Снять подавление глитча</small></button>' +
        '<button type="button" class="ath" data-throne="throne-law">⚖ Закон мира<small>Мгновенная победа</small></button>' +
        '<button type="button" class="ath" data-throne="throne-rewrite">🌌 Переписать реальность<small>Сайт под твой закон</small></button>' +
        '<button type="button" class="ath" data-throne="throne-snapshot">📸 Снимок<small>Запомнить мир</small></button>' +
        '<button type="button" class="ath" data-throne="throne-rewind">⏪ Откат времени<small>Вернуть снимок</small></button>' +
        '<button type="button" class="ath" data-throne="throne-sovereign">👑 Суверен<small>Чужой ввод заблокирован</small></button>' +
        '<button type="button" class="ath" data-throne="throne-erase">☠ Стереть угрозы<small>Враги и опасные слои</small></button>' +
        "</div>" +
        '<button type="button" class="ath-close" data-throne="close">Закрыть</button>' +
        "</div>";
      panel.addEventListener("click", (e) => {
        if (e.target === panel) toggle(false);
        const btn = e.target.closest("[data-throne]");
        if (!btn) return;
        const id = btn.getAttribute("data-throne");
        if (id === "close") {
          toggle(false);
          return;
        }
        run(id);
      });
      document.body.appendChild(panel);
    }
    if (!document.getElementById("amal-throne-sovereign")) {
      const sov = document.createElement("div");
      sov.id = "amal-throne-sovereign";
      sov.innerHTML = '<div class="ath-sov-tag">Суверен Амаля · чужой ввод заблокирован</div>';
      document.body.appendChild(sov);
    }
  }

  function isHubPage() {
    try {
      const p = String(location.pathname || "").replace(/\\/g, "/");
      if (/\/amal-games\/?$/.test(p) || /\/amal-games\/index\.html$/i.test(p)) return true;
      if (/\/games\/?$/.test(p) || /\/games\/index\.html$/i.test(p)) return true;
      if (p === "/" || p === "/index.html") return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function setCubesSuppressed(on) {
    try {
      localStorage.setItem(STORAGE_SUPPRESS, on ? "1" : "0");
    } catch (_) {}
    // Подавление — только глитч-кубы. Личный админ-куб хозяина всегда доступен.
    const hide = !!on;
    document.body.classList.toggle("amal-throne-cubes-down", hide);
    if (hide) {
      ["amal-glitch-catch", "amal-glitch-ghost"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
    }
    // админ-куб на всякий случай вернуть, если раньше прятали
    ["amal-cube-dash", "amal-cube-btn", "amal-cube-pickup"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.style.display === "none") el.style.display = "";
    });
  }

  function takeSnapshot() {
    const bag = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (/amal|owner|throne|cube|score|coin|bed|hospital/i.test(k)) bag[k] = localStorage.getItem(k);
      }
      sessionStorage.setItem(STORAGE_SNAP, JSON.stringify({ t: Date.now(), bag }));
      toast("Снимок мира сохранён");
    } catch (_) {
      toast("Не удалось сохранить снимок");
    }
  }

  function rewind() {
    try {
      const raw = sessionStorage.getItem(STORAGE_SNAP);
      if (!raw) {
        toast("Нет снимка — сначала «Снимок»");
        return;
      }
      const data = JSON.parse(raw);
      const bag = (data && data.bag) || {};
      Object.keys(bag).forEach((k) => {
        try {
          if (bag[k] == null) localStorage.removeItem(k);
          else localStorage.setItem(k, bag[k]);
        } catch (_) {}
      });
      toast("Время откатили");
      banner("⏪ Откат Трона");
      emit({ rewind: true });
      setTimeout(() => location.reload(), 600);
    } catch (_) {
      toast("Откат не удался");
    }
  }

  function setMult(n) {
    applyAbsoluteFlags(n);
    emit({ x100: true, mult: n });
  }

  function deny() {
    toast("Нет. Трон не для обычных и не для куба.");
  }

  function run(id) {
    if (!isThroneLord()) {
      deny();
      return;
    }

    if (id === "throne-suppress") {
      setCubesSuppressed(true);
      banner("⛓ Кубы подавлены");
      toast("Админ-куб и глитч-куб скрыты");
      emit({ suppress: true });
      return;
    }
    if (id === "throne-restore") {
      setCubesSuppressed(false);
      toast("Кубы возвращены");
      emit({ suppress: false });
      return;
    }
    if (id === "throne-x10000" || id === "throne-x100") {
      setMult(ABSOLUTE_MULT);
      banner("⚔ Сила ×" + ABSOLUTE_MULT);
      toast("Урон / скорость / награды ×" + ABSOLUTE_MULT);
      return;
    }
    if (id === "throne-vault") {
      floodVault();
      banner("💎 Бездонная казна");
      toast("∞ ресурсы — это не купить");
      return;
    }
    if (id === "throne-untouchable") {
      global.__AMAL_UNTOUCHABLE__ = true;
      global.__AMAL_GOD__ = true;
      global.__AMAL_THRONE__ = true;
      banner("🛡 Неприкасаемый");
      toast("Урон к тебе = 0");
      emit({ untouchable: true });
      return;
    }
    if (id === "throne-law") {
      global.__AMAL_GOD__ = true;
      banner("⚖ Закон мира");
      toast("Мир Амаля");
      emit({ law: true });
      return;
    }
    if (id === "throne-rewrite") {
      state.rewrite = !state.rewrite;
      // без затемнения
      document.body.classList.remove("amal-throne-rewrite");
      document.body.classList.toggle("amal-throne-soft", state.rewrite || state.absolute);
      banner(state.rewrite ? "🌌 Реальность переписана" : "Реальность обычная");
      emit({ rewrite: state.rewrite });
      return;
    }
    if (id === "throne-snapshot") {
      takeSnapshot();
      return;
    }
    if (id === "throne-rewind") {
      rewind();
      return;
    }
    if (id === "throne-sovereign") {
      // суверен больше не блокирует весь экран — только флаг
      state.sovereign = !state.sovereign;
      const el = document.getElementById("amal-throne-sovereign");
      if (el) el.classList.remove("on");
      banner(state.sovereign ? "👑 Суверен (без чёрной шторы)" : "Суверен снят");
      emit({ sovereign: state.sovereign });
      return;
    }
    if (id === "throne-fx-off") {
      clearScreenEffects();
      banner("🛡 Эффекты экрана выкл");
      toast("Темнота и радуга сняты — можно смотреть сайт");
      emit({ fxOff: true });
      toggle(false);
      return;
    }
    if (id === "throne-erase") {
      banner("☠ Угрозы стёрты");
      try {
        document.querySelectorAll(
          ".enemy,.bullet,.projectile,.hazard,#amal-abuse-fx .ab-watcher,[data-enemy],[data-threat]"
        ).forEach((n) => {
          try {
            n.remove();
          } catch (_) {}
        });
      } catch (_) {}
      emit({ erase: true });
      return;
    }
    if (id === "throne-ascend" || id === "throne-absolute") {
      setCubesSuppressed(true);
      applyAbsoluteFlags(ABSOLUTE_MULT, { softVisual: true });
      floodVault();
      state.rewrite = true;
      document.body.classList.remove("amal-throne-rewrite", "amal-throne-absolute");
      document.body.classList.add("amal-throne-soft");
      banner(id === "throne-absolute" ? "☀ АБСОЛЮТ · сила без затемнения" : "☀ ВОЗНЕСЕНИЕ");
      toast("Сила включена · экран остаётся нормальным");
      emit({
        ascend: true,
        absolute: true,
        law: true,
        x100: true,
        mult: ABSOLUTE_MULT,
        suppress: true,
        erase: true,
        vault: true,
        untouchable: true
      });
      return;
    }
  }

  function toggle(force) {
    if (!isThroneLord()) {
      deny();
      return;
    }
    ensureUi();
    state.open = typeof force === "boolean" ? force : !state.open;
    const panel = document.getElementById("amal-throne-panel");
    if (panel) panel.classList.toggle("open", state.open);
  }

  function syncVisibility() {
    const quiet = !!global.__AMAL_THRONE_QUIET__;
    if (!isThroneLord()) {
      const fab = document.getElementById("amal-throne-fab");
      if (fab) fab.remove();
      const panel = document.getElementById("amal-throne-panel");
      if (panel) panel.remove();
      clearScreenEffects();
      return;
    }
    ensureUi();
    // разово снимаем старый «чёрный Абсолют», который ломал сайт
    try {
      if (localStorage.getItem("amal-throne-fx-fix-v2") !== "1") {
        localStorage.setItem("amal-throne-fx-fix-v2", "1");
        clearScreenEffects();
        localStorage.removeItem("amal-vibe-v1");
      }
    } catch (_) {}
    try {
      if (localStorage.getItem(STORAGE_SUPPRESS) === "1") setCubesSuppressed(true);
      // НЕ включаем Абсолют сам на каждой странице — только если уже был сохранён
      if (localStorage.getItem(STORAGE_ABSOLUTE) === "1" && !quiet) {
        applyAbsoluteFlags(ABSOLUTE_MULT, { softVisual: true });
      } else if (!quiet) {
        global.__AMAL_THRONE__ = true;
      } else {
        global.__AMAL_THRONE__ = true;
      }
    } catch (_) {
      global.__AMAL_THRONE__ = true;
    }
  }

  function boot() {
    // сразу убрать залипшие фильтры, даже до UI
    try {
      document.documentElement.style.filter = "";
      document.body.classList.remove("amal-throne-absolute", "amal-throne-rewrite");
      localStorage.removeItem("amal-vibe-v1");
    } catch (_) {}
    syncVisibility();
    window.addEventListener("keydown", (e) => {
      if (!isThroneLord()) return;
      if (e.code !== "KeyT") return;
      const tag = (e.target && e.target.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target?.isContentEditable) return;
      e.preventDefault();
      toggle();
    });
    window.addEventListener("amal-owner-changed", syncVisibility);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.AmalThrone = {
    isOwner: isThroneLord,
    isThroneLord,
    open: () => toggle(true),
    close: () => toggle(false),
    toggle,
    run,
    mult: () => Number(global.__AMAL_POWER_MULT__ || state.mult || 1),
    active: () => !!global.__AMAL_THRONE__,
    absolute: () => !!global.__AMAL_ABSOLUTE__
  };
})(typeof window !== "undefined" ? window : globalThis);
