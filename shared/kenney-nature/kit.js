/**
 * Kenney Nature Kit (CC0) — загрузчик GLB для игр Amal.
 * Модели: ../shared/kenney-nature/*.glb
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const cache = new Map();

/** Путь относительно страницы игры: ../shared/kenney-nature/file.glb */
export function assetPath(file) {
  return "../shared/kenney-nature/" + file;
}

export async function loadKenney(file) {
  if (cache.has(file)) return cache.get(file).clone(true);
  const gltf = await loader.loadAsync(assetPath(file));
  cache.set(file, gltf.scene);
  return gltf.scene.clone(true);
}

export async function loadMany(files) {
  const out = {};
  await Promise.all(
    files.map(async (f) => {
      try {
        out[f] = await loadKenney(f);
      } catch (e) {
        console.warn("Kenney miss", f, e);
      }
    })
  );
  return out;
}

export function place(model, scene, x, z, scale, rotY) {
  if (!model) return null;
  const m = model.clone(true);
  m.position.set(x, 0, z);
  if (scale) m.scale.setScalar(scale);
  if (rotY != null) m.rotation.y = rotY;
  m.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  scene.add(m);
  return m;
}

export function makeGround(scene, color) {
  const g = new THREE.Mesh(
    new THREE.CircleGeometry(48, 40),
    new THREE.MeshStandardMaterial({ color: color || 0x4a7c59, roughness: 0.95 })
  );
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  scene.add(g);
  return g;
}

export function makeLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.05);
  sun.position.set(25, 40, 15);
  sun.castShadow = true;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xb8e0f0, 0x3d6b45, 0.4));
}

export function makePlayer() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x2563eb })
  );
  body.position.y = 1.1;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffc9a3 })
  );
  head.position.y = 1.65;
  g.add(head);
  return g;
}
