(() => {
  "use strict";

  const KEY = "amal-joy-surprise-unlock-v1";
  const MIN_WAIT = 3 * 60 * 1000;
  const MAX_WAIT = 45 * 60 * 1000;

  function unlockAt() {
    let at = 0;
    try { at = Number(localStorage.getItem(KEY)) || 0; } catch (_) {}
    if (!at) {
      at = Date.now() + MIN_WAIT + Math.floor(Math.random() * (MAX_WAIT - MIN_WAIT));
      try { localStorage.setItem(KEY, String(at)); } catch (_) {}
    }
    return at;
  }

  /* Пока прячем с сайта: таймер «???» / секретный подарок слишком путает. */
  return;

  const at = unlockAt();

  function refreshCount() {
    const n = document.querySelectorAll("a.card[href]").length;
    const count = document.getElementById("games-count");
    const menuCount = document.getElementById("menu-games-n");
    if (count) count.innerHTML = "образцов в каталоге: <strong>" + n + "</strong>";
    if (menuCount) menuCount.textContent = n;
  }

  function ensureTimerUi() {
    let box = document.getElementById("amalSurpriseTimer");
    if (box) return box;
    box = document.createElement("div");
    box.id = "amalSurpriseTimer";
    box.style.cssText =
      "position:fixed;left:50%;transform:translateX(-50%);" +
      "bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147482000;" +
      "display:flex;align-items:center;gap:8px;white-space:nowrap;" +
      "padding:9px 16px;border-radius:999px;color:#fff;font:800 13px/1.2 system-ui,sans-serif;" +
      "background:linear-gradient(135deg,#fb7185,#7c3aed 55%,#22d3ee);" +
      "box-shadow:0 8px 24px rgba(124,58,237,.4);max-width:92vw;cursor:default;" +
      "border:1px solid rgba(255,255,255,.35)";
    box.innerHTML =
      "<span>🎁 Секретный подарок</span>" +
      '<span id="amalSurpriseClock" style="font-size:17px;letter-spacing:.04em;' +
      'padding:2px 9px;border-radius:999px;background:rgba(0,0,0,.28)">--:--</span>';
    document.body.appendChild(box);
    return box;
  }

  function fmt(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function reveal() {
    if (document.getElementById("amalJoySurpriseCard")) return true;
    const host = document.getElementById("newGamesGrid");
    if (!host) return false;
    const card = document.createElement("a");
    card.id = "amalJoySurpriseCard";
    card.className = "card featured";
    card.href = "joy-surprise/";
    card.innerHTML =
      '<div class="card-img joysurprise">🎁</div>' +
      '<div class="card-body"><span class="badge new">Появилось само</span>' +
      "<h2>Секретный подарок</h2><p>Этой карточки раньше не было. Сейчас она выбрала тебя.</p>" +
      '<span class="play-btn">Открыть</span></div>';
    host.insertBefore(card, host.firstChild);
    refreshCount();
    return true;
  }

  function done() {
    const box = document.getElementById("amalSurpriseTimer");
    if (box) {
      const clock = document.getElementById("amalSurpriseClock");
      if (clock) clock.textContent = "готово!";
      box.innerHTML = "<span>🎁 Подарок открылся! Карточка уже в «Новых играх»</span>";
      setTimeout(() => { if (box.parentNode) box.remove(); }, 8000);
    }
  }

  function tick() {
    const left = at - Date.now();
    if (left <= 0) {
      reveal();
      done();
      clearInterval(timer);
      return;
    }
    ensureTimerUi();
    const clock = document.getElementById("amalSurpriseClock");
    if (clock) clock.textContent = fmt(left);
  }

  if (at - Date.now() <= 0) {
    reveal();
  } else {
    ensureTimerUi();
    tick();
    var timer = setInterval(tick, 1000);
  }
})();
