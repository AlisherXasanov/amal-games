/**
 * Котёл и молот — физический подъём (в духе Getting Over It).
 * Боковой вид, котёл + молот, управление углом молота мышью/тачем.
 */
import * as THREE from "three";

window.__AMAL_NO_WORLD__ = true;

const GRAVITY = -22;
const POT_R = 0.55;
const HAMMER_LEN = 2.35;
const HAMMER_HEAD = 0.28;
const WIN_Y = 28;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6b7a42);
scene.fog = new THREE.Fog(0x6b7a42, 40, 90);

const camera = new THREE.PerspectiveCamera(50, innerWidth / Math.max(1, innerHeight), 0.1, 200);
camera.position.set(0, 4, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xe8f0c8, 0x3a4520, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 1.1);
sun.position.set(8, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

function mat(color, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness != null ? opts.roughness : 0.65,
    metalness: opts.metalness != null ? opts.metalness : 0.05,
  });
}

/** Сегменты мира: { ax, ay, bx, by } в плоскости X–Y */
const segments = [];

function addBoxTerrain(cx, cy, w, h, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4), mat(color || 0xc4a574, { roughness: 0.85 }));
  mesh.position.set(cx, cy, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  const hx = w / 2;
  const hy = h / 2;
  // 4 стороны как отрезки (для коллизий молота и котла)
  segments.push(
    { ax: cx - hx, ay: cy + hy, bx: cx + hx, by: cy + hy }, // top
    { ax: cx - hx, ay: cy - hy, bx: cx + hx, by: cy - hy }, // bottom
    { ax: cx - hx, ay: cy - hy, bx: cx - hx, by: cy + hy }, // left
    { ax: cx + hx, ay: cy - hy, bx: cx + hx, by: cy + hy } // right
  );
  return mesh;
}

function addCircleTree(cx, cy, r) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.35, r * 0.45, r * 6, 10),
    mat(0x5c4030, { roughness: 0.9 })
  );
  trunk.position.set(cx, cy + r * 2.2, 0);
  trunk.castShadow = true;
  scene.add(trunk);
  // вертикальный ствол как два сегмента (левая/правая кора)
  const top = cy + r * 5.2;
  const bot = cy - r * 0.2;
  segments.push(
    { ax: cx - r * 0.4, ay: bot, bx: cx - r * 0.4, by: top },
    { ax: cx + r * 0.4, ay: bot, bx: cx + r * 0.4, by: top }
  );
}

// === Уровень (как на скрине: полка + дерево вверх) ===
addBoxTerrain(0, -0.4, 14, 0.8, 0xd2b48c); // стартовая полка
addBoxTerrain(-5.5, 3.5, 2.2, 7, 0xb8956a);
addBoxTerrain(4.2, 2.2, 2.5, 4.2, 0xb8956a);
addBoxTerrain(-2.5, 8, 3.2, 1.2, 0xc4a574);
addBoxTerrain(2.8, 10.5, 2.8, 1.1, 0xc4a574);
addBoxTerrain(-4, 13.5, 2.5, 1, 0xb8956a);
addBoxTerrain(1.5, 16.5, 3.5, 1.1, 0xc4a574);
addBoxTerrain(-2, 19.5, 2.6, 1, 0xb8956a);
addBoxTerrain(3, 22.5, 3, 1.1, 0xc4a574);
addBoxTerrain(0, 26, 4.5, 1.2, 0xd2b48c); // вершина
addCircleTree(-3.2, 0.2, 0.55);
addBoxTerrain(6.5, 14, 1.6, 10, 0xa67c52);

// Фоновые холмы
for (let i = 0; i < 6; i++) {
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(3 + (i % 3), 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0x4f5f32, { roughness: 1 })
  );
  hill.position.set(-10 + i * 5, -1.2, -6);
  hill.rotation.x = -Math.PI / 2;
  scene.add(hill);
}

// === Котёл + человек + молот ===
const potGroup = new THREE.Group();
scene.add(potGroup);

const pot = new THREE.Mesh(
  new THREE.SphereGeometry(POT_R, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.72),
  mat(0x4a5a28, { roughness: 0.45, metalness: 0.25 })
);
pot.rotation.x = Math.PI;
pot.position.y = 0.15;
pot.castShadow = true;
potGroup.add(pot);

const rim = new THREE.Mesh(
  new THREE.TorusGeometry(POT_R * 0.92, 0.06, 8, 24),
  mat(0x3a4a20, { metalness: 0.3, roughness: 0.4 })
);
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.42;
potGroup.add(rim);

const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.35, 4, 10), mat(0xe8b896, { roughness: 0.7 }));
torso.position.y = 0.85;
torso.castShadow = true;
potGroup.add(torso);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0xf0c4a8, { roughness: 0.65 }));
head.position.y = 1.35;
head.castShadow = true;
potGroup.add(head);

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
  mat(0x2a1a12, { roughness: 0.9 })
);
hair.position.y = 1.42;
potGroup.add(hair);

const hammerPivot = new THREE.Group();
hammerPivot.position.set(0.15, 0.95, 0.15);
potGroup.add(hammerPivot);

const handle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.055, HAMMER_LEN, 8),
  mat(0x8b5a2b, { roughness: 0.8 })
);
handle.position.y = HAMMER_LEN / 2;
handle.castShadow = true;
hammerPivot.add(handle);

const headHammer = new THREE.Mesh(
  new THREE.BoxGeometry(0.55, 0.35, 0.35),
  mat(0x8a9099, { metalness: 0.65, roughness: 0.35 })
);
headHammer.position.y = HAMMER_LEN;
headHammer.castShadow = true;
hammerPivot.add(headHammer);

// Физика котла
const body = {
  x: 0,
  y: 1.2,
  vx: 0,
  vy: 0,
  angle: 0, // угол молота (рад), 0 = вверх
  targetAngle: 0,
  prevHead: { x: 0, y: 0 },
  grounded: false,
};

function hammerHeadWorld() {
  // молот крутится в плоскости XY вокруг pivot
  const px = body.x + 0.15;
  const py = body.y + 0.95;
  const a = body.angle;
  // angle 0 = вверх (+Y), как в «Getting Over It» стиль
  const hx = px + Math.sin(a) * HAMMER_LEN;
  const hy = py + Math.cos(a) * HAMMER_LEN;
  return { x: hx, y: hy, px, py };
}

function distPointSeg(px, py, seg) {
  const abx = seg.bx - seg.ax;
  const aby = seg.by - seg.ay;
  const apx = px - seg.ax;
  const apy = py - seg.ay;
  const ab2 = abx * abx + aby * aby || 1;
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = seg.ax + abx * t;
  const cy = seg.ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return { d: Math.hypot(dx, dy), nx: dx, ny: dy, cx, cy, t };
}

function resolveCircleWorld(x, y, r, pushOut) {
  let nx = x;
  let ny = y;
  let hit = false;
  for (let i = 0; i < segments.length; i++) {
    const info = distPointSeg(nx, ny, segments[i]);
    if (info.d < r && info.d > 1e-6) {
      hit = true;
      if (pushOut) {
        const pen = r - info.d;
        const inv = 1 / info.d;
        nx += (info.nx * inv) * pen;
        ny += (info.ny * inv) * pen;
      }
    } else if (info.d < r) {
      hit = true;
      if (pushOut) ny += r;
    }
  }
  return { x: nx, y: ny, hit };
}

let pointerActive = false;
const pointer = { x: 0, y: 0 };

function setAngleFromClient(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  // приближённо: экран → мир относительно pivot
  const worldX = body.x + ndcX * 8;
  const worldY = body.y + 1 + ndcY * 5;
  const px = body.x + 0.15;
  const py = body.y + 0.95;
  body.targetAngle = Math.atan2(worldX - px, worldY - py);
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  pointerActive = true;
  try {
    renderer.domElement.setPointerCapture(e.pointerId);
  } catch (_) {}
  setAngleFromClient(e.clientX, e.clientY);
});
renderer.domElement.addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  if (pointerActive || e.pointerType === "mouse") setAngleFromClient(e.clientX, e.clientY);
});
renderer.domElement.addEventListener("pointerup", () => {
  pointerActive = false;
});
window.addEventListener("mousemove", (e) => setAngleFromClient(e.clientX, e.clientY));

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function reset() {
  body.x = 0;
  body.y = 1.2;
  body.vx = 0;
  body.vy = 0;
  body.angle = 0.4;
  body.targetAngle = 0.4;
  document.getElementById("win").classList.remove("show");
  const h = hammerHeadWorld();
  body.prevHead.x = h.x;
  body.prevHead.y = h.y;
}
reset();
document.getElementById("again").addEventListener("click", reset);

const heightEl = document.getElementById("height");
let won = false;
let last = performance.now();

function tick(now) {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // Плавный поворот молота к курсору
  let da = body.targetAngle - body.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const maxTurn = 10 * dt;
  body.angle += Math.max(-maxTurn, Math.min(maxTurn, da));

  const headNow = hammerHeadWorld();
  const hx = headNow.x;
  const hy = headNow.y;
  const mhx = hx - body.prevHead.x;
  const mhy = hy - body.prevHead.y;

  // Коллизия головы молота со скалами → сила на котёл (как рычаг)
  let hammerHit = false;
  for (let i = 0; i < segments.length; i++) {
    const info = distPointSeg(hx, hy, segments[i]);
    if (info.d < HAMMER_HEAD) {
      hammerHit = true;
      const inv = info.d > 1e-4 ? 1 / info.d : 1;
      const nx = info.nx * inv;
      const ny = info.ny * inv;
      // выталкиваем голову
      const pen = HAMMER_HEAD - info.d;
      // реакция: скорость головы вглубь поверхности
      const vIn = mhx * -nx + mhy * -ny;
      const impulse = Math.max(0, vIn) * 18 + pen * 40;
      // сила на котёл — против нормали + чуть «подтягивание» вдоль движения молота
      body.vx += -nx * impulse * dt * 55;
      body.vy += -ny * impulse * dt * 55;
      // трение / сдвиг
      body.vx += -mhx * 8 * dt;
      body.vy += -mhy * 8 * dt;
    }
  }

  // Гравитация и демпфирование
  body.vy += GRAVITY * dt;
  body.vx *= hammerHit ? 0.92 : 0.995;
  body.vy *= hammerHit ? 0.92 : 0.998;

  body.x += body.vx * dt;
  body.y += body.vy * dt;

  // Котёл не проваливается в землю
  const potHit = resolveCircleWorld(body.x, body.y, POT_R * 0.85, true);
  if (potHit.hit) {
    const dx = potHit.x - body.x;
    const dy = potHit.y - body.y;
    body.x = potHit.x;
    body.y = potHit.y;
    // гасим скорость внутрь
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const vn = body.vx * nx + body.vy * ny;
      if (vn < 0) {
        body.vx -= vn * nx;
        body.vy -= vn * ny;
      }
      body.vx *= 0.85;
      body.vy *= 0.85;
      body.grounded = true;
    }
  } else {
    body.grounded = false;
  }

  // Не улетать слишком далеко
  if (body.y < -2) reset();
  if (body.x < -12) {
    body.x = -12;
    body.vx *= -0.3;
  }
  if (body.x > 12) {
    body.x = 12;
    body.vx *= -0.3;
  }

  body.prevHead.x = hx;
  body.prevHead.y = hy;

  // Синхрон мешей
  potGroup.position.set(body.x, body.y, 0);
  hammerPivot.rotation.z = -body.angle;

  // Камера следует
  const camTargetY = body.y + 1.5;
  camera.position.x += (body.x - camera.position.x) * 0.08;
  camera.position.y += (camTargetY - camera.position.y) * 0.08;
  camera.lookAt(body.x, body.y + 0.8, 0);

  const meters = Math.max(0, body.y - 1.2);
  heightEl.textContent = "Высота: " + meters.toFixed(1) + " м";

  if (!won && body.y >= WIN_Y) {
    won = true;
    document.getElementById("win").classList.add("show");
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
