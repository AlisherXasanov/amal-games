(() => {
  "use strict";

  const MSG =
    "Эти игры временно недоступны, к сожалению.\nОни ещё дорабатываются — подожди немного.";

  function canEnter3d() {
    try {
      if (window.__AMAL_OWNER__ === true || window.__AMAL_GOD__ === true) return true;
      if (window.AmalPowers && typeof window.AmalPowers.isOwner === "function" && window.AmalPowers.isOwner()) {
        return true;
      }
      if (window.AmalHub && typeof window.AmalHub.isOwner === "function" && window.AmalHub.isOwner()) {
        return true;
      }
      if (window.AmalHub && typeof window.AmalHub.isGameAdmin === "function" && window.AmalHub.isGameAdmin()) {
        return true;
      }
      return ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"].some(
        (k) => localStorage.getItem(k) === "1"
      );
    } catch (_) {
      return false;
    }
  }

  function ensureModalCss() {
    if (document.getElementById("amal-3d-lock-css")) return;
    const s = document.createElement("style");
    s.id = "amal-3d-lock-css";
    s.textContent = `
      .amal-3d-lock-overlay{position:fixed;inset:0;z-index:99990;display:grid;place-items:center;
        background:rgba(10,32,28,.62);backdrop-filter:blur(7px);padding:1rem}
      .amal-3d-lock-card{width:min(400px,92vw);padding:1.4rem 1.25rem;border-radius:18px;
        background:linear-gradient(180deg,#fffef8,#eef7f2);border:2px solid rgba(13,110,95,.28);
        text-align:center;box-shadow:0 22px 50px rgba(0,0,0,.28);color:#102018;
        font-family:Nunito,system-ui,sans-serif}
      .amal-3d-lock-card .ico{font-size:2.4rem;margin-bottom:.35rem}
      .amal-3d-lock-card h3{font:700 1.25rem Fredoka,Nunito,sans-serif;color:#0d6e5f;margin:.2rem 0 .55rem}
      .amal-3d-lock-card p{white-space:pre-line;font:600 14px/1.45 Nunito,sans-serif;color:#5a6a62}
      .amal-3d-lock-card a{display:inline-block;margin-top:.75rem;color:#0d6e5f;font:800 13px Nunito,sans-serif}
      .amal-3d-page-block{position:fixed;inset:0;z-index:99980;display:grid;place-items:center;
        background:linear-gradient(165deg,#0d6e5f,#102018);color:#f3efe6;padding:1.5rem;text-align:center;
        font-family:Nunito,system-ui,sans-serif}
      .amal-3d-page-block .chains{font-size:3rem;letter-spacing:.2em;margin-bottom:.6rem}
      .amal-3d-page-block h1{font:700 1.6rem Fredoka,Nunito,sans-serif;margin-bottom:.5rem}
      .amal-3d-page-block p{white-space:pre-line;max-width:28rem;margin:0 auto .9rem;opacity:.92;line-height:1.45}
      .amal-3d-page-block a{color:#7ed9b8;font-weight:800}
    `;
    document.head.appendChild(s);
  }

  function faqHref() {
    try {
      const p = location.pathname || "";
      if (p.indexOf("/portal-3d") !== -1) return "#faq";
      if (p.indexOf("/animal-hospital") !== -1) return "../portal-3d/#faq";
      return "portal-3d/#faq";
    } catch (_) {
      return "portal-3d/#faq";
    }
  }

  function showLockedModal() {
    ensureModalCss();
    const old = document.getElementById("amal-3d-lock-overlay");
    if (old) old.remove();
    const el = document.createElement("div");
    el.id = "amal-3d-lock-overlay";
    el.className = "amal-3d-lock-overlay";
    el.innerHTML =
      '<div class="amal-3d-lock-card" role="dialog" aria-modal="true">' +
      '<div class="ico">🔒⛓</div>' +
      "<h3>Под замком</h3>" +
      "<p>" +
      MSG.replace(/\n/g, "\n") +
      "</p>" +
      '<a href="' +
      faqHref() +
      '">❓ Все вопросы · внутри</a><br/>' +
      '<button type="button">Понятно</button></div>';
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.tagName === "BUTTON") el.remove();
    });
    document.body.appendChild(el);
  }

  function blockPageIfNeeded() {
    if (canEnter3d()) return false;
    ensureModalCss();
    // hide game UI
    document.documentElement.style.overflow = "hidden";
    const block = document.createElement("div");
    block.className = "amal-3d-page-block";
    block.innerHTML =
      '<div class="chains">⛓ 🔒 ⛓</div>' +
      "<h1>Игра временно недоступна</h1>" +
      "<p>" +
      MSG +
      "</p>" +
      '<p><a href="../">← Назад в Lab</a> · <a href="../portal-3d/">3D полка</a></p>';
    document.body.appendChild(block);
    return true;
  }

  function wireLockedCards(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-amal-3d-lock]").forEach((node) => {
      const href = node.getAttribute("data-href") || node.getAttribute("href");
      if (!href) return;
      node.addEventListener("click", (e) => {
        if (canEnter3d()) {
          if (node.tagName !== "A") {
            e.preventDefault();
            location.href = href;
          }
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        showLockedModal();
      });
    });
  }

  window.Amal3dLock = {
    canEnter: canEnter3d,
    showModal: showLockedModal,
    blockPage: blockPageIfNeeded,
    wire: wireLockedCards,
    MSG,
  };

  // Auto page-guard when this script is included inside a 3D game folder
  const auto = document.currentScript && document.currentScript.getAttribute("data-guard") === "1";
  if (auto) {
    const run = () => blockPageIfNeeded();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
  }
})();
