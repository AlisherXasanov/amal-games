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

  const at = unlockAt();

  function refreshCount() {
    const n = document.querySelectorAll("a.card[href]").length;
    const count = document.getElementById("games-count");
    const menuCount = document.getElementById("menu-games-n");
    if (count) count.innerHTML = "образцов в каталоге: <strong>" + n + "</strong>";
    if (menuCount) menuCount.textContent = n;
  }

  function reveal() {
    if (Date.now() < at || document.getElementById("amalJoySurpriseCard")) return false;
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

  if (!reveal()) {
    const timer = setInterval(() => {
      if (reveal()) clearInterval(timer);
    }, 15000);
  }
})();
