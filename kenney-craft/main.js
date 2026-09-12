/**
 * Kenney Craft — 3D Minecraft-like с блоками в стиле Kenney (процедурные текстуры).
 * Бесконечные чанки вокруг игрока, ломать/ставить.
 */
import * as THREE from "three";

window.__AMAL_NO_WORLD__ = true;

const SIZE = 16;
const WORLD_H = 40;
const AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  SAND = 4,
  WOOD = 5,
  LEAF = 6,
  WATER = 7;

const NAMES = ["", "трава", "земля", "камень", "песок", "дерево", "листва", "вода"];

function hash(x, z) {
  let n = (x * 374761393 + z * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function heightAt(x, z) {
  return Math.floor(
    18 +
      Math.sin(x * 0.11) * 3 +
      Math.cos(z * 0.09) * 3 +
      Math.sin((x + z) * 0.05) * 2 +
      hash(x, z) * 2
  );
}

function makeKenneyTex(opts) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = opts.base;
  g.fillRect(0, 0, 64, 64);
  if (opts.topBand) {
    g.fillStyle = opts.topBand;
    g.fillRect(0, 0, 64, 14);
  }
  for (let i = 0; i < (opts.dots || 40); i++) {
    g.fillStyle = opts.dot || "rgba(0,0,0,0.12)";
    g.fillRect((hash(i, 3) * 64) | 0, (hash(i, 7) * 64) | 0, 2 + (i % 3), 2 + (i % 2));
  }
  if (opts.grid) {
    g.strokeStyle = "rgba(0,0,0,0.15)";
    g.strokeRect(0.5, 0.5, 63, 63);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const mats = {
  [GRASS]: new THREE.MeshLambertMaterial({
    map: makeKenneyTex({ base: "#6d4c2f", topBand: "#5ea83a", dots: 50, grid: true }),
  }),
  [DIRT]: new THREE.MeshLambertMaterial({
    map: makeKenneyTex({ base: "#8b5a2b", dots: 55, grid: true }),
  }),
  [STONE]: new THREE.MeshLambertMaterial({
    map: makeKenneyTex({ base: "#8a9099", dot: "rgba(0,0,0,0.2)", dots: 60, grid: true }),
  }),
  [SAND]: new THREE.MeshLambertMaterial({
    map: makeKenneyTex({ base: "#e2c56a", dots: 35, grid: true }),
  }),
  [WOOD]: new THREE.MeshLambertMaterial({
    map: makeKenneyTex({ base: "#a0672f", topBand: "#7a4a1e", dots: 25, grid: true }),
  }),
  [LEAF]: new THREE.MeshLambertMaterial({
    map: makeKenneyTex({ base: "#3f9b45", dots: 30, grid: true }),
    transparent: true,
    opacity: 0.92,
  }),
  [WATER]: new THREE.MeshLambertMaterial({
    map: makeKenneyTex({ base: "#3aa0d8", dots: 20 }),
    transparent: true,
    opacity: 0.65,
  }),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0xa8d8f0, 40, 110);

const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
sun.position.set(40, 60, 20);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xb0c4de, 0.55));

const camera = new THREE.PerspectiveCamera(75, innerWidth / Math.max(1, innerHeight), 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
document.body.appendChild(renderer.domElement);

const chunks = new Map();
const meshes = new Map();
let selected = GRASS;

function key(cx, cz) {
  return cx + "," + cz;
}

function genChunk(cx, cz) {
  const data = new Uint8Array(SIZE * WORLD_H * SIZE);
  function set(lx, y, lz, id) {
    if (y < 0 || y >= WORLD_H) return;
    data[(y * SIZE + lz) * SIZE + lx] = id;
  }
  function get(lx, y, lz) {
    if (lx < 0 || lz < 0 || lx >= SIZE || lz >= SIZE || y < 0 || y >= WORLD_H) return AIR;
    return data[(y * SIZE + lz) * SIZE + lx];
  }
  for (let lz = 0; lz < SIZE; lz++) {
    for (let lx = 0; lx < SIZE; lx++) {
      const wx = cx * SIZE + lx;
      const wz = cz * SIZE + lz;
      const h = heightAt(wx, wz);
      const desert = hash(Math.floor(wx / 24), Math.floor(wz / 24)) > 0.62;
      for (let y = 0; y <= h; y++) {
        let id = STONE;
        if (y === h) id = desert ? SAND : GRASS;
        else if (y >= h - 3) id = desert ? SAND : DIRT;
        set(lx, y, lz, id);
      }
      if (!desert && hash(wx, wz + 99) > 0.97 && h + 5 < WORLD_H) {
        const th = 4 + ((hash(wx, wz) * 3) | 0);
        for (let i = 1; i <= th; i++) set(lx, h + i, lz, WOOD);
        const top = h + th;
        for (let dx = -2; dx <= 2; dx++) {
          for (let dz = -2; dz <= 2; dz++) {
            for (let dy = -1; dy <= 2; dy++) {
              if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) > 4) continue;
              const nx = lx + dx;
              const nz = lz + dz;
              if (nx >= 0 && nz >= 0 && nx < SIZE && nz < SIZE && get(nx, top + dy, nz) === AIR) set(nx, top + dy, nz, LEAF);
            }
          }
        }
      }
      if (desert && hash(wx, wz + 5) > 0.9 && h < 20) {
        for (let y = h + 1; y <= Math.min(h + 2, WORLD_H - 1); y++) set(lx, y, lz, WATER);
      }
    }
  }
  return data;
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);

function rebuildChunk(cx, cz) {
  const k = key(cx, cz);
  const old = meshes.get(k);
  if (old) {
    scene.remove(old);
    meshes.delete(k);
  }
  let data = chunks.get(k);
  if (!data) {
    data = genChunk(cx, cz);
    chunks.set(k, data);
  }
  const group = new THREE.Group();
  const counts = {};
  for (let y = 0; y < WORLD_H; y++) {
    for (let lz = 0; lz < SIZE; lz++) {
      for (let lx = 0; lx < SIZE; lx++) {
        const id = data[(y * SIZE + lz) * SIZE + lx];
        if (!id) continue;
        const wx = cx * SIZE + lx;
        const wz = cz * SIZE + lz;
        if (isSolid(wx + 1, y, wz) && isSolid(wx - 1, y, wz) && isSolid(wx, y + 1, wz) && isSolid(wx, y - 1, wz) && isSolid(wx, y, wz + 1) && isSolid(wx, y, wz - 1)) continue;
        counts[id] = (counts[id] || 0) + 1;
      }
    }
  }
  for (const idStr of Object.keys(counts)) {
    const id = +idStr;
    const mesh = new THREE.InstancedMesh(boxGeo, mats[id], counts[id]);
    let i = 0;
    const m = new THREE.Matrix4();
    for (let y = 0; y < WORLD_H; y++) {
      for (let lz = 0; lz < SIZE; lz++) {
        for (let lx = 0; lx < SIZE; lx++) {
          if (data[(y * SIZE + lz) * SIZE + lx] !== id) continue;
          const wx = cx * SIZE + lx;
          const wz = cz * SIZE + lz;
          if (isSolid(wx + 1, y, wz) && isSolid(wx - 1, y, wz) && isSolid(wx, y + 1, wz) && isSolid(wx, y - 1, wz) && isSolid(wx, y, wz + 1) && isSolid(wx, y, wz - 1)) continue;
          m.setPosition(wx + 0.5, y + 0.5, wz + 0.5);
          mesh.setMatrixAt(i++, m);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }
  meshes.set(k, group);
  scene.add(group);
}

function getBlock(x, y, z) {
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  if (y < 0 || y >= WORLD_H) return y < 0 ? STONE : AIR;
  const cx = Math.floor(x / SIZE);
  const cz = Math.floor(z / SIZE);
  const k = key(cx, cz);
  let data = chunks.get(k);
  if (!data) {
    data = genChunk(cx, cz);
    chunks.set(k, data);
  }
  const lx = ((x % SIZE) + SIZE) % SIZE;
  const lz = ((z % SIZE) + SIZE) % SIZE;
  return data[(y * SIZE + lz) * SIZE + lx];
}

function setBlock(x, y, z, id) {
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  if (y < 1 || y >= WORLD_H - 1) return;
  const cx = Math.floor(x / SIZE);
  const cz = Math.floor(z / SIZE);
  const k = key(cx, cz);
  let data = chunks.get(k);
  if (!data) {
    data = genChunk(cx, cz);
    chunks.set(k, data);
  }
  const lx = ((x % SIZE) + SIZE) % SIZE;
  const lz = ((z % SIZE) + SIZE) % SIZE;
  data[(y * SIZE + lz) * SIZE + lx] = id;
  rebuildChunk(cx, cz);
  // соседние чанки если на краю
  if (lx === 0) rebuildChunk(cx - 1, cz);
  if (lx === SIZE - 1) rebuildChunk(cx + 1, cz);
  if (lz === 0) rebuildChunk(cx, cz - 1);
  if (lz === SIZE - 1) rebuildChunk(cx, cz + 1);
}

function isSolid(x, y, z) {
  const id = getBlock(x, y, z);
  return id !== AIR && id !== WATER && id !== LEAF;
}

function ensureAround(px, pz) {
  const cx = Math.floor(px / SIZE);
  const cz = Math.floor(pz / SIZE);
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      const k = key(cx + dx, cz + dz);
      if (!meshes.has(k)) rebuildChunk(cx + dx, cz + dz);
    }
  }
}

// player
const player = {
  x: 8,
  y: 30,
  z: 8,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: 0,
  pitch: -0.2,
};
player.y = heightAt(8, 8) + 3;

const keys = {};
let locked = false;
const toastEl = document.getElementById("toast");
let toastT = 0;
function toast(m) {
  toastEl.textContent = m;
  toastEl.style.display = "block";
  toastT = 2;
}

function raycast(max = 6) {
  const dir = new THREE.Vector3(
    -Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch),
    -Math.cos(player.yaw) * Math.cos(player.pitch)
  ).normalize();
  let x = player.x;
  let y = player.y + 1.6;
  let z = player.z;
  let lx = Math.floor(x);
  let ly = Math.floor(y);
  let lz = Math.floor(z);
  for (let i = 0; i < max * 10; i++) {
    x += dir.x * 0.1;
    y += dir.y * 0.1;
    z += dir.z * 0.1;
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);
    if (bx === lx && by === ly && bz === lz) continue;
    const id = getBlock(bx, by, bz);
    if (id !== AIR && id !== WATER) {
      return { hit: { x: bx, y: by, z: bz }, prev: { x: lx, y: ly, z: lz }, id };
    }
    lx = bx;
    ly = by;
    lz = bz;
  }
  return null;
}

function collideMove(dt) {
  const speed = keys["ShiftLeft"] ? 9 : 5.5;
  const forward = (-(keys["KeyW"] ? 1 : 0) + (keys["KeyS"] ? 1 : 0)) * speed;
  const strafe = (-(keys["KeyA"] ? 1 : 0) + (keys["KeyD"] ? 1 : 0)) * speed;
  const fx = -Math.sin(player.yaw);
  const fz = -Math.cos(player.yaw);
  const rx = Math.cos(player.yaw);
  const rz = -Math.sin(player.yaw);
  let dx = (fx * -forward + rx * strafe) * dt;
  let dz = (fz * -forward + rz * strafe) * dt;
  player.vy -= 22 * dt;
  if (keys["Space"] && onGround()) player.vy = 8.2;

  function tryAxis(axis, delta) {
    if (axis === "x") player.x += delta;
    if (axis === "z") player.z += delta;
    if (axis === "y") player.y += delta;
    if (collides()) {
      if (axis === "x") player.x -= delta;
      if (axis === "z") player.z -= delta;
      if (axis === "y") {
        player.y -= delta;
        player.vy = 0;
      }
    }
  }
  tryAxis("x", dx);
  tryAxis("z", dz);
  tryAxis("y", player.vy * dt);
}

function collides() {
  const minX = player.x - 0.3;
  const maxX = player.x + 0.3;
  const minY = player.y;
  const maxY = player.y + 1.7;
  const minZ = player.z - 0.3;
  const maxZ = player.z + 0.3;
  for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
    for (let x = Math.floor(minX); x <= Math.floor(maxX); x++) {
      for (let z = Math.floor(minZ); z <= Math.floor(maxZ); z++) {
        if (isSolid(x, y, z)) return true;
      }
    }
  }
  return false;
}
function onGround() {
  const y = player.y - 0.08;
  return isSolid(player.x, y, player.z) || isSolid(player.x - 0.25, y, player.z) || isSolid(player.x + 0.25, y, player.z);
}

// hotbar
const hot = document.getElementById("hot");
const barIds = [GRASS, DIRT, STONE, SAND, WOOD, LEAF];
barIds.forEach((id, i) => {
  const b = document.createElement("button");
  b.textContent = NAMES[id];
  b.dataset.id = String(id);
  if (id === selected) b.classList.add("on");
  b.onclick = () => {
    selected = id;
    [...hot.children].forEach((el) => el.classList.toggle("on", +el.dataset.id === selected));
    toast(NAMES[id]);
  };
  hot.appendChild(b);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Digit" + (i + 1)) {
      selected = id;
      [...hot.children].forEach((el) => el.classList.toggle("on", +el.dataset.id === selected));
    }
  });
});

document.getElementById("lock").onclick = async () => {
  try {
    await renderer.domElement.requestPointerLock();
  } catch (_) {}
};
document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === renderer.domElement;
  document.getElementById("lock").style.display = locked ? "none" : "flex";
});
document.addEventListener("mousemove", (e) => {
  if (!locked) return;
  player.yaw -= e.movementX * 0.0025;
  player.pitch -= e.movementY * 0.0025;
  player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch));
});
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
window.addEventListener("mousedown", (e) => {
  if (!locked) return;
  const hit = raycast();
  if (!hit) return;
  if (e.button === 0) {
    setBlock(hit.hit.x, hit.hit.y, hit.hit.z, AIR);
    toast("Сломал");
  } else if (e.button === 2) {
    const p = hit.prev;
    if (Math.hypot(p.x + 0.5 - player.x, p.y + 0.5 - (player.y + 0.9), p.z + 0.5 - player.z) > 0.9) {
      setBlock(p.x, p.y, p.z, selected);
      toast("Поставил " + NAMES[selected]);
    }
  }
});
window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

ensureAround(player.x, player.z);
toast("Kenney Craft: мир без края");

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (locked) {
    collideMove(dt);
    ensureAround(player.x, player.z);
  }
  camera.position.set(player.x, player.y + 1.6, player.z);
  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
