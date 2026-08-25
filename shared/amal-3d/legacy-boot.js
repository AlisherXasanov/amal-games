/**
 * Подключает Three 0.160, затем НАСТОЯЩИЕ AmalOrbitCam + AmalWalkPlayer
 * (старые рабочие файлы), и только потом запускает игру.
 */
import * as THREE from "three";

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = function () {
      resolve();
    };
    s.onerror = function () {
      reject(new Error("Не загрузился: " + src));
    };
    document.head.appendChild(s);
  });
}

function sharedUrl(name) {
  try {
    return new URL("../" + name, import.meta.url).href;
  } catch (_) {
    return "../shared/" + name;
  }
}

async function boot() {
  window.THREE = THREE;
  window.Amal3D = window.Amal3D || { THREE: THREE };

  // CapsuleGeometry есть в 0.160; на всякий случай
  if (!THREE.CapsuleGeometry && THREE.CylinderGeometry) {
    THREE.CapsuleGeometry = THREE.CylinderGeometry;
  }

  try {
    await loadScript(sharedUrl("amal-orbit-cam.js") + "?v=2");
    await loadScript(sharedUrl("amal-walk-player.js") + "?v=2");
  } catch (e) {
    console.error("[Amal3D] helpers", e);
  }

  window.dispatchEvent(new Event("amal-3d-ready"));

  if (typeof window.__amal3dGameMain === "function") {
    try {
      window.__amal3dGameMain(THREE);
    } catch (e) {
      console.error("[Amal3D] game main", e);
    }
  }
}

boot().catch(function (e) {
  console.error("[Amal3D] boot failed", e);
  var box = document.createElement("div");
  box.style.cssText =
    "position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#102018;color:#fff;font:800 16px system-ui;padding:24px;text-align:center";
  box.innerHTML =
    "<div><h1>3D не загрузилось</h1><p>Нужен интернет для Three.js (один раз).</p><p style='opacity:.8;margin-top:12px'>" +
    (e && e.message ? e.message : String(e)) +
    "</p><p style='margin-top:16px'><a href='../' style='color:#7ed9b8'>← Каталог</a></p></div>";
  document.body.appendChild(box);
});
