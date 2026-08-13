(() => {
  "use strict";

  const FAQ = [
    {
      q: "Что делать в 3D-играх?",
      a: "Игрокам — ждать: они под замком и ещё дорабатываются. Админ может входить и тестировать через полку 3D.",
    },
    {
      q: "Где приложения (СкажиИгру, Create Lab)?",
      a: "Они на сайте, но под замком для обычных игроков. У хозяина / админа доступ открыт — программы и «руны» на месте.",
    },
    {
      q: "Почему грустно, будто приложения пропали?",
      a: "Их не удалили для тебя: они спрятаны замком от гостей. Зайди как админ — полка «Приложения» или прямые ссылки снова работают.",
    },
    {
      q: "Где открытые игры?",
      a: "Lab, Animal Hospital, Buttersquish, пельмени, 2D-игры на главной — без замка.",
    },
    {
      q: "Butterscotch выглядит как старый пёс со шкалами?",
      a: "Ctrl+F5. Нужен парк Buttersquish без голода.",
    },
    {
      q: "Как снять замок с 3D или приложений?",
      a: "Когда доработаешь — скажи открыть. Пока замок держит гостей, админ проходит.",
    },
  ];

  function ensureCss() {
    if (document.getElementById("amal-faq-css")) return;
    const s = document.createElement("style");
    s.id = "amal-faq-css";
    s.textContent = `
      .amal-faq-fab{position:fixed;right:12px;bottom:12px;z-index:99970;width:46px;height:46px;border-radius:50%;
        border:none;cursor:pointer;font:800 18px Nunito,system-ui,sans-serif;color:#f3efe6;
        background:linear-gradient(135deg,#0d6e5f,#0a5248);box-shadow:0 10px 24px rgba(13,110,95,.35)}
      .amal-faq-overlay{position:fixed;inset:0;z-index:99980;display:grid;place-items:center;
        background:rgba(10,32,28,.55);backdrop-filter:blur(6px);padding:1rem}
      .amal-faq-panel{width:min(440px,94vw);max-height:min(78vh,640px);overflow:auto;border-radius:18px;
        background:linear-gradient(180deg,#fffef8,#eef7f2);border:2px solid rgba(13,110,95,.25);
        padding:1.1rem 1.15rem 1rem;color:#102018;font-family:Nunito,system-ui,sans-serif;
        box-shadow:0 22px 50px rgba(0,0,0,.28)}
      .amal-faq-panel h2{font:700 1.2rem Fredoka,Nunito,sans-serif;color:#0d6e5f;margin:0 0 .55rem}
      .amal-faq-panel details{border-top:1px dashed rgba(13,110,95,.18);padding:.55rem 0}
      .amal-faq-panel summary{cursor:pointer;font:800 13px Nunito,sans-serif}
      .amal-faq-panel details p{margin:.35rem 0 0;color:#5a6a62;font:600 13px/1.45 Nunito,sans-serif}
      .amal-faq-panel .links{display:flex;flex-wrap:wrap;gap:8px;margin-top:.75rem}
      .amal-faq-panel a{color:#0d6e5f;font:800 12px Nunito,sans-serif;text-decoration:none;
        padding:6px 10px;border-radius:999px;background:rgba(13,110,95,.1)}
      .amal-faq-panel .x{margin-top:.8rem;width:100%;appearance:none;border:none;cursor:pointer;
        padding:10px 14px;border-radius:12px;font:800 14px Nunito,sans-serif;color:#f3efe6;
        background:linear-gradient(135deg,#0d6e5f,#0a5248)}
    `;
    document.head.appendChild(s);
  }

  function rootPrefix() {
    try {
      const p = location.pathname || "";
      if (p.indexOf("/animal-hospital/") !== -1) return "../";
      if (/\/(obby|tycoon|create-lab|voice-ai-proposal|portal-3d|minecraft)\//.test(p)) return "../";
      // nested game folder
      const parts = p.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[parts.length - 1] === "" || parts.length >= 2) {
        // amal-games/game/ or amal-games/game/index.html
        if (parts[0] === "amal-games" && parts.length >= 2) return "../";
        if (parts.length >= 1 && !p.endsWith("amal-games/") && !p.endsWith("amal-games/index.html")) {
          // if path has one more segment after repo
          const idx = parts.indexOf("amal-games");
          if (idx >= 0 && parts.length > idx + 2) return "../";
          if (idx >= 0 && parts.length === idx + 2 && !parts[parts.length - 1].includes(".")) return "../";
        }
      }
      return "./";
    } catch (_) {
      return "./";
    }
  }

  function openFaq() {
    ensureCss();
    const old = document.getElementById("amal-faq-overlay");
    if (old) old.remove();
    const pre = rootPrefix();
    const el = document.createElement("div");
    el.id = "amal-faq-overlay";
    el.className = "amal-faq-overlay";
    const items = FAQ.map(
      (f, i) =>
        `<details${i < 2 ? " open" : ""}><summary>${f.q}</summary><p>${f.a}</p></details>`
    ).join("");
    el.innerHTML =
      '<div class="amal-faq-panel" role="dialog" aria-modal="true">' +
      "<h2>❓ Вопросы · внутри</h2>" +
      items +
      '<div class="links">' +
      `<a href="${pre}portal-3d/#faq">3D полка</a>` +
      `<a href="${pre}apps/#faq">Приложения</a>` +
      `<a href="${pre}animal-hospital/lab-group.html">Группа Lab</a>` +
      `<a href="${pre}">Главная</a>` +
      "</div>" +
      '<button type="button" class="x">Закрыть</button></div>';
    el.addEventListener("click", (e) => {
      if (e.target === el || (e.target.classList && e.target.classList.contains("x"))) el.remove();
    });
    document.body.appendChild(el);
  }

  function mountFab() {
    if (document.getElementById("amal-faq-fab")) return;
    ensureCss();
    const btn = document.createElement("button");
    btn.id = "amal-faq-fab";
    btn.className = "amal-faq-fab";
    btn.type = "button";
    btn.title = "Вопросы внутри";
    btn.textContent = "?";
    btn.addEventListener("click", openFaq);
    document.body.appendChild(btn);
  }

  window.AmalFaq = { open: openFaq, mount: mountFab, FAQ };

  const boot = () => mountFab();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
