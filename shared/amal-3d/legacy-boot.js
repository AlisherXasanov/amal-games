/**
 * Подключает Three 0.160 + Amal3D в старые страницы (вместо r128 CDN).
 * Использование в index.html:
 *
 * <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
 * <script type="module" src="../shared/amal-3d/legacy-boot.js"></script>
 * <script src="./main.legacy.js" defer></script>  <!-- или ждать amal-3d-ready -->
 */
import { bootLegacyGlobals } from "./index.js";

bootLegacyGlobals().then(() => {
  const q = document.querySelectorAll("script[data-amal-3d-game]");
  q.forEach((node) => {
    const src = node.getAttribute("data-amal-3d-game");
    if (!src) return;
    const s = document.createElement("script");
    s.src = src;
    s.defer = false;
    document.body.appendChild(s);
  });
  // Если игра была inline в type=module waiter
  if (typeof window.__amal3dGameMain === "function") {
    try {
      window.__amal3dGameMain(window.THREE);
    } catch (e) {
      console.error("[Amal3D] game main failed", e);
    }
  }
});
