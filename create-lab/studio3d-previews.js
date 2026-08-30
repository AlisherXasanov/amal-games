/** 3D-превью заготовок — отдельный canvas, не трогает главный экран */
import * as THREE from "three";

const PREVIEW_CACHE = {};
let pvRenderer = null;
let pvScene = null;
let pvCam = null;
let pvQueue = [];
let pvRunning = false;

function ensurePreview() {
  if (pvRenderer) return;
  const c = document.createElement("canvas");
  pvRenderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
  pvRenderer.setSize(96, 96);
  pvRenderer.setPixelRatio(1);
  pvScene = new THREE.Scene();
  pvScene.background = new THREE.Color(0x2d2d30);
  pvCam = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
}

function disposePreviewObj(obj) {
  obj.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        if (m.map && m.map.isCanvasTexture) { /* keep shared tex cache */ }
        m.dispose();
      });
    }
  });
}

export function renderPrefabPreview(PREFABS, key) {
  if (PREVIEW_CACHE[key]) return PREVIEW_CACHE[key];
  const def = PREFABS[key];
  if (!def || !def.create) return null;
  ensurePreview();
  try {
    const obj = def.create({ prefab: key, name: def.name || key });
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);
    while (pvScene.children.length) pvScene.remove(pvScene.children[0]);
    pvScene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.1);
    sun.position.set(3, 5, 4);
    pvScene.add(sun);
    obj.position.sub(center);
    pvScene.add(obj);
    pvCam.position.set(maxDim * 1.8, maxDim * 1.2, maxDim * 2.2);
    pvCam.lookAt(0, size.y * 0.15, 0);
    pvRenderer.render(pvScene, pvCam);
    const url = pvRenderer.domElement.toDataURL("image/png");
    PREVIEW_CACHE[key] = url;
    disposePreviewObj(obj);
    return url;
  } catch (_) {
    return null;
  }
}

export async function preloadCategoryPreviews(PREFABS, keys, onDone) {
  for (const key of keys) {
    if (!PREVIEW_CACHE[key]) renderPrefabPreview(PREFABS, key);
    if (onDone) onDone(key, PREVIEW_CACHE[key]);
    await new Promise((r) => setTimeout(r, 8));
  }
}

export function getPreviewUrl(key) {
  return PREVIEW_CACHE[key] || null;
}
