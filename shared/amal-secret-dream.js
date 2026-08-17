(() => {
  "use strict";
  const KEY = "amal-secret-dream-unlock-v1";
  const MIN = 2 * 60 * 1000;
  const MAX = 18 * 60 * 1000;
  let at = 0;
  try { at = Number(localStorage.getItem(KEY)) || 0; } catch (_) {}
  if (!at) {
    at = Date.now() + MIN + Math.floor(Math.random() * (MAX - MIN));
    try { localStorage.setItem(KEY, String(at)); } catch (_) {}
  }

  function fmt(ms) {
    const n = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(n / 60), s = n % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  function timer() {
    let el = document.getElementById("amalNewSecretTimer");
    if (el) return el;
    el = document.createElement("div");
    el.id = "amalNewSecretTimer";
    el.style.cssText = "position:fixed;right:12px;bottom:74px;z-index:2147481900;padding:9px 13px;border-radius:14px;background:#080514e8;border:1px solid #a5f3fc88;color:#fff;font:900 12px system-ui;box-shadow:0 0 24px #7c3aed66";
    document.body.appendChild(el);
    return el;
  }
  function reveal() {
    if (document.getElementById("amalSecretDreamCard")) return;
    const host = document.getElementById("newGamesGrid") || document.querySelector(".games-grid");
    if (!host) return;
    const card = document.createElement("a");
    card.id = "amalSecretDreamCard";
    card.className = "card featured";
    card.href = "secret-dream/";
    card.innerHTML =
      '<div class="card-img" style="background:radial-gradient(circle,#67e8f9,#7c3aed 48%,#05030d);font-size:68px">◈</div>' +
      '<div class="card-body"><span class="badge new">Новое · появилось само</span>' +
      "<h2>???</h2><p>Такой игры здесь раньше не было. Узнать её можно только внутри.</p>" +
      '<span class="play-btn">Войти</span></div>';
    host.insertBefore(card, host.firstChild);
    const box = document.getElementById("amalNewSecretTimer");
    if (box) {
      box.textContent = "◈ Новая игра появилась!";
      setTimeout(() => box.remove(), 7000);
    }
  }
  function tick() {
    const left = at - Date.now();
    if (left <= 0) { reveal(); clearInterval(id); return; }
    timer().textContent = "◈ Новая тайна через " + fmt(left);
  }
  if (Date.now() >= at) reveal();
  else { tick(); var id = setInterval(tick, 1000); }
})();
