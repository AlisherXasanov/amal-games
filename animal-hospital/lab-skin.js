(() => {
  "use strict";
  document.body.classList.add("lab-skin");
  document.documentElement.classList.add("lab-skin");

  if (!document.querySelector(".lab-banner")) {
    const banner = document.createElement("div");
    banner.className = "lab-banner";
    banner.innerHTML =
      '<span class="dot" aria-hidden="true"></span>' +
      '<span>🧪 Лаборатория · группа</span>' +
      '<a href="./lab-group.html">все игры</a>' +
      '<span class="dot" aria-hidden="true"></span>';
    document.body.prepend(banner);
  }

  document.querySelectorAll("a.back, a.portal-back").forEach((a) => {
    const href = (a.getAttribute("href") || "").replace(/^\.\//, "");
    if (href === "index.html" || /Больница/.test(a.textContent || "")) {
      a.setAttribute("href", "./lab-group.html");
      a.textContent = "← Лаборатория";
    }
  });
})();
