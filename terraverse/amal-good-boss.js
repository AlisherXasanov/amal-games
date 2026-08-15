/**
 * Добрый босс — событие-оверлей поверх Пиксель-Террариума.
 * Не трогает игровой движок: изредка появляется дружелюбный босс,
 * намекает на глитч-куб и даёт награду (силу). Безопасно для сборки игры.
 */
(function () {
  "use strict";

  var POWER_KEY = "amal-cube-power-v1";
  var active = false;

  function addPower(n) {
    try {
      var cur = Math.max(0, Number(localStorage.getItem(POWER_KEY)) || 0);
      cur += n;
      localStorage.setItem(POWER_KEY, String(cur));
      return cur;
    } catch (_) {
      return n;
    }
  }

  function ensureStyle() {
    if (document.getElementById("amal-good-boss-style")) return;
    var st = document.createElement("style");
    st.id = "amal-good-boss-style";
    st.textContent =
      "#amal-good-boss{position:fixed;z-index:2147483030;right:18px;top:64px;width:132px;pointer-events:auto;" +
      "cursor:pointer;font-family:system-ui,sans-serif;transform:translateY(-16px);opacity:0;" +
      "transition:opacity .4s ease,transform .4s ease}" +
      "#amal-good-boss.show{opacity:1;transform:translateY(0)}" +
      "#amal-good-boss .bubble{background:linear-gradient(135deg,#fde68a,#f59e0b);color:#1a1400;" +
      "border:2px solid #fbbf24;border-radius:12px;padding:7px 9px;font:800 11px/1.3 system-ui,sans-serif;" +
      "box-shadow:0 6px 18px rgba(0,0,0,.4);margin-bottom:6px}" +
      "#amal-good-boss .char{width:96px;height:96px;margin:0 auto;display:grid;place-items:center;font-size:58px;" +
      "filter:drop-shadow(0 8px 14px rgba(0,0,0,.5));animation:amalBossBob 2.4s ease-in-out infinite}" +
      "#amal-good-boss .tag{margin-top:2px;text-align:center;color:#fde68a;font:900 10px system-ui,sans-serif;" +
      "text-shadow:0 1px 3px rgba(0,0,0,.6)}" +
      "@keyframes amalBossBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}" +
      "#amal-good-boss .glow{position:absolute;inset:14px 8px auto 8px;height:96px;border-radius:50%;z-index:-1;" +
      "background:radial-gradient(circle,rgba(0,229,255,.5),transparent 70%);filter:blur(8px);" +
      "animation:amalBossGlow 3s ease-in-out infinite}" +
      "@keyframes amalBossGlow{0%,100%{opacity:.5}50%{opacity:.9}}";
    document.head.appendChild(st);
  }

  function hint() {
    var lines = [
      "Я добрый босс. Кажется, тут замешан глитч-куб…",
      "Тише! Глитч-куб иногда мигает где-то рядом.",
      "Держи подарок — от глитч-куба. Не бойся его.",
      "Я пришёл по трещине глитч-куба. Возьми силу!",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function spawnBoss() {
    if (active || document.hidden) return;
    if (document.getElementById("amal-good-boss")) return;
    active = true;
    ensureStyle();
    var box = document.createElement("div");
    box.id = "amal-good-boss";
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", "Добрый босс — забрать награду");
    box.innerHTML =
      '<div class="bubble" id="amal-good-boss-bubble">' + hint() + "</div>" +
      '<div class="glow"></div>' +
      '<div class="char">🐲👑</div>' +
      '<div class="tag">Нажми — забрать награду</div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add("show"); });

    var closed = false;
    var autoT = setTimeout(function () { leave(); }, 12000);

    function leave() {
      if (closed) return;
      closed = true;
      clearTimeout(autoT);
      box.classList.remove("show");
      setTimeout(function () {
        if (box.parentNode) box.parentNode.removeChild(box);
        active = false;
      }, 450);
    }

    box.addEventListener("click", function () {
      if (closed) return;
      var reward = 15 + Math.floor(Math.random() * 21);
      var total = addPower(reward);
      var bub = document.getElementById("amal-good-boss-bubble");
      if (bub) bub.textContent = "🎁 +" + reward + " силы! Всего: " + total;
      var tag = box.querySelector(".tag");
      if (tag) tag.textContent = "Спасибо! 🌈";
      try {
        if (window.AmalHub && typeof window.AmalHub.toast === "function") {
          window.AmalHub.toast("👑 Добрый босс: +" + reward + " силы");
        }
      } catch (_) {}
      setTimeout(leave, 1400);
    });
  }

  function loop() {
    var wait = 120000 + Math.floor(Math.random() * 180000);
    setTimeout(function () {
      spawnBoss();
      loop();
    }, wait);
  }

  // первый визит — раньше, чтобы игрок точно увидел
  setTimeout(spawnBoss, 40000 + Math.floor(Math.random() * 40000));
  loop();

  // дать возможность вызвать вручную из консоли/других мест
  try {
    window.amalGoodBoss = spawnBoss;
  } catch (_) {}
})();
