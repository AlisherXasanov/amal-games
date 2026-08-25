/**
 * Создание приложения Three.js — стандартный каркас.
 */
import * as THREE from "three";

/**
 * @param {object} [opts]
 * @param {HTMLElement|string} [opts.container] — куда вставить canvas (default: body)
 * @param {number} [opts.bg] — цвет фона
 * @param {number} [opts.fov]
 * @param {boolean} [opts.shadows]
 * @param {number} [opts.fogNear]
 * @param {number} [opts.fogFar]
 * @param {number} [opts.pixelRatioMax] — на телефоне меньше (экономия)
 */
export function createApp(opts) {
  opts = opts || {};
  const container =
    typeof opts.container === "string"
      ? document.querySelector(opts.container)
      : opts.container || document.body;

  const scene = new THREE.Scene();
  if (opts.bg != null) {
    scene.background = new THREE.Color(opts.bg);
    if (opts.fogFar) {
      scene.fog = new THREE.Fog(opts.bg, opts.fogNear || 40, opts.fogFar);
    }
  }

  const camera = new THREE.PerspectiveCamera(
    opts.fov != null ? opts.fov : 70,
    Math.max(1, innerWidth) / Math.max(1, innerHeight),
    opts.near != null ? opts.near : 0.1,
    opts.far != null ? opts.far : 500
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: opts.antialias !== false,
    powerPreference: "default",
    alpha: !!opts.alpha,
  });
  const maxPR = opts.pixelRatioMax != null ? opts.pixelRatioMax : isPhone() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, maxPR));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = !!opts.shadows;
  if (opts.shadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  // Базовый свет — как в типичных демо Three.js
  if (opts.lights !== false) {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, opts.hemiIntensity != null ? opts.hemiIntensity : 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, opts.sunIntensity != null ? opts.sunIntensity : 0.85);
    sun.position.set(30, 50, 20);
    if (opts.shadows) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
    }
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  }

  const clock = new THREE.Clock();
  let raf = 0;
  let running = false;
  let onFrame = null;

  function resize() {
    const w = innerWidth;
    const h = Math.max(1, innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", resize);

  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.05, clock.getDelta());
    if (typeof onFrame === "function") onFrame(dt, app);
    renderer.render(scene, camera);
  }

  const app = {
    THREE,
    scene,
    camera,
    renderer,
    clock,
    canvas: renderer.domElement,
    start(fn) {
      onFrame = fn || onFrame;
      if (running) return app;
      running = true;
      clock.start();
      frame();
      return app;
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      return app;
    },
    dispose() {
      app.stop();
      window.removeEventListener("resize", resize);
      try {
        renderer.dispose();
      } catch (_) {}
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };

  // Пауза при скрытой вкладке — меньше батареи
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && running) clock.getDelta();
  });

  return app;
}

function isPhone() {
  try {
    if (matchMedia("(max-width:820px)").matches) return true;
    if (matchMedia("(pointer:coarse)").matches) return true;
  } catch (_) {}
  return /Android|iPhone|iPad/i.test(navigator.userAgent || "");
}

export { THREE };
