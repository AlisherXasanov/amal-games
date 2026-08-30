/** 3D-превью заготовок — картинка = то же, что встанет на карту */
import * as THREE from "three";

const PREVIEW_CACHE = {};
let pvRenderer = null;
let pvScene = null;
let pvCam = null;

function ensurePreview() {
  if (pvRenderer) return;
  pvRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  pvRenderer.setSize(96, 96);
  pvRenderer.setPixelRatio(1);
  pvScene = new THREE.Scene();
  pvScene.background = new THREE.Color(0x2d2d30);
  pvScene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xfff4e6, 1);
  sun.position.set(3, 5, 4);
  pvScene.add(sun);
  pvCam = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
}

function disposeObj(obj) {
  obj.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material.dispose();
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
    pvScene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfff4e6, 1);
    sun.position.set(3, 5, 4);
    pvScene.add(sun);
    obj.position.sub(center);
    pvScene.add(obj);
    pvCam.position.set(maxDim * 1.8, maxDim * 1.2, maxDim * 2.2);
    pvCam.lookAt(0, size.y * 0.15, 0);
    pvRenderer.render(pvScene, pvCam);
    const url = pvRenderer.domElement.toDataURL("image/png");
    PREVIEW_CACHE[key] = url;
    disposeObj(obj);
    return url;
  } catch (_) {
    return null;
  }
}

export async function preloadCategoryPreviews(PREFABS, keys, onDone) {
  for (const key of keys) {
    if (!PREVIEW_CACHE[key]) renderPrefabPreview(PREFABS, key);
    if (onDone) onDone(key, PREVIEW_CACHE[key]);
    await new Promise((r) => setTimeout(r, 0));
  }
}

export function getPreviewUrl(key) {
  return PREVIEW_CACHE[key] || null;
}
