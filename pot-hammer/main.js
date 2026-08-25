/**
 * Котёл и молот — физический подъём (в духе Getting Over It).
 * Молот упирается в землю/скалу → котёл едет и «летит» в сторону.
 */
import * as THREE from "three";

window.__AMAL_NO_WORLD__ = true;

const GRAVITY = -26;
const POT_R = 0.52;
const HAMMER_LEN = 2.45;
const HAMMER_HEAD = 0.32;
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

scene.add(new THREE.HemisphereLight(0xe8f0c8, 0x3a4520, 0.85));
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

/** { ax,ay,bx,by } + твёрдые боксы {x,y,w,h} */
const segments = [];
const boxes = [];

function addBoxTerrain(cx, cy, w, h, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4), mat(color || 0xc4a574, { roughness: 0.85 }));
  mesh.position.set(cx, cy, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  const hx = w / 2;
  const hy = h / 2;
  boxes.push({ x: cx, y: cy, w, h, hx, hy });
  segments.push(
    { ax: cx - hx, ay: cy + hy, bx: cx + hx, by: cy + hy },
    { ax: cx - hx, ay: cy - hy, bx: cx + hx, by: cy - hy },
    { ax: cx - hx, ay: cy - hy, bx: cx - hx, by: cy + hy },
    { ax: cx + hx, ay: cy - hy, bx: cx + hx, by: cy + hy }
  );
  return mesh;
}

function addCircleTree(cx, cy, r) {
  const trunkH = r * 7;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.38, r * 0.48, trunkH, 12),
    mat(0x5c4030, { roughness: 0.9 })
  );
  trunk.position.set(cx, cy + trunkH / 2, 0);
  trunk.castShadow = true;
  scene.add(trunk);
  const top = cy + trunkH;
  const bot = cy;
  const tw = r * 0.42;
  boxes.push({ x: cx, y: cy + trunkH / 2, w: tw * 2, h: trunkH, hx: tw, hy: trunkH / 2 });
  segments.push(
    { ax: cx - tw, ay: bot, bx: cx - tw, by: top },
    { ax: cx + tw, ay: bot, bx: cx + tw, by: top },
    { ax: cx - tw, ay: top, bx: cx + tw, by: top }
  );
}

// === Уровень: старт проще — дерево и уступы рядом ===
addBoxTerrain(0, -0.4, 16, 0.8, 0xd2b48c);
addBoxTerrain(1.6, 0.55, 1.4, 0.7, 0xb8956a); // камень у ног вправо
addBoxTerrain(-1.1, 0.7, 1.3, 0.9, 0xb8956a); // камень влево — дотянуться молотом
addCircleTree(-1.55, 0.0, 0.5); // дерево БЛИЗКО
addBoxTerrain(-4.2, 3.2, 2.0, 5.5, 0xb8956a);
addBoxTerrain(3.6, 2.0, 2.2, 3.6, 0xb8956a);
addBoxTerrain(-2.2, 7.5, 3.0, 1.1, 0xc4a574);
addBoxTerrain(2.5, 10.0, 2.8, 1.1, 0xc4a574);
addBoxTerrain(-3.5, 13.0, 2.5, 1, 0xb8956a);
addBoxTerrain(1.5, 16.0, 3.5, 1.1, 0xc4a574);
addBoxTerrain(-2, 19.0, 2.6, 1, 0xb8956a);
addBoxTerrain(3, 22.0, 3, 1.1, 0xc4a574);
addBoxTerrain(0, 25.5, 4.5, 1.2, 0xd2b48c);
addBoxTerrain(6.2, 13.5, 1.6, 10, 0xa67c52);

for (let i = 0; i < 6; i++) {
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(3 + (i % 3), 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0x4f5f32, { roughness: 1 })
  );
  hill.position.set(-10 + i * 5, -1.2, -6);
  hill.rotation.x = -Math.PI / 2;
  scene.add(hill);
}

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
hammerPivot.position.set(0.12, 0.92, 0.12);
potGroup.add(hammerPivot);

const handle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.055, HAMMER_LEN, 8),
  mat(0x8b5a2b, { roughness: 0.8 })
);
handle.position.y = HAMMER_LEN / 2;
handle.castShadow = true;
hammerPivot.add(handle);

const headHammer = new THREE.Mesh(
  new THREE.BoxGeometry(0.58, 0.38, 0.38),
  mat(0x8a9099, { metalness: 0.65, roughness: 0.35 })
);
headHammer.position.y = HAMMER_LEN;
headHammer.castShadow = true;
hammerPivot.add(headHammer);

const body = {
  x: 0,
  y: 1.15,
  vx: 0,
  vy: 0,
  angle: 0.9,
  targetAngle: 0.9,
  prevAngle: 0.9,
  grounded: false,
};

function pivot() {
  return { x: body.x + 0.12, y: body.y + 0.92 };
}

function hammerHeadAt(angle) {
  const p = pivot();
  return {
    x: p.x + Math.sin(angle) * HAMMER_LEN,
    y: p.y + Math.cos(angle) * HAMMER_LEN,
    px: p.x,
    py: p.y,
  };
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
  const d = Math.hypot(dx, dy);
  return { d, cx, cy, nx: d > 1e-6 ? dx / d : 0, ny: d > 1e-6 ? dy / d : 1, t };
}

/** Вытолкнуть круг из всех боксов (твердо, без прохождения) */
function resolvePotSolid(x, y, r) {
  let nx = x;
  let ny = y;
  let hit = false;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const dx = nx - b.x;
    const dy = ny - b.y;
    const px = b.hx + r;
    const py = b.hy + r;
    if (Math.abs(dx) < px && Math.abs(dy) < py) {
      hit = true;
      const ox = px - Math.abs(dx);
      const oy = py - Math.abs(dy);
      if (ox < oy) {
        nx += dx > 0 ? ox : -ox;
      } else {
        ny += dy > 0 ? oy : -oy;
      }
    }
  }
  // пол на всякий случай
  if (ny < r + 0.0) {
    ny = r;
    hit = true;
  }
  return { x: nx, y: ny, hit };
}

function nearestHammerHit(hx, hy) {
  let best = null;
  for (let i = 0; i < segments.length; i++) {
    const info = distPointSeg(hx, hy, segments[i]);
    if (info.d <= HAMMER_HEAD) {
      if (!best || info.d < best.d) best = info;
    }
  }
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const dx = hx - b.x;
    const dy = hy - b.y;
    const cx = Math.max(b.x - b.hx, Math.min(b.x + b.hx, hx));
    const cy = Math.max(b.y - b.hy, Math.min(b.y + b.hy, hy));
    const ox = hx - cx;
    const oy = hy - cy;
    const d = Math.hypot(ox, oy);
    if (d <= HAMMER_HEAD && d > 1e-6) {
      const info = { d, cx, cy, nx: ox / d, ny: oy / d };
      if (!best || info.d < best.d) best = info;
    } else if (d < 1e-6 && Math.abs(dx) < b.hx && Math.abs(dy) < b.hy) {
      // голова внутри бокса — выталкиваем к ближайшей грани
      const left = Math.abs(hx - (b.x - b.hx));
      const right = Math.abs(hx - (b.x + b.hx));
      const bottom = Math.abs(hy - (b.y - b.hy));
      const top = Math.abs(hy - (b.y + b.hy));
      const m = Math.min(left, right, bottom, top);
      let cx2 = hx;
      let cy2 = hy;
      let nx = 0;
      let ny = 0;
      if (m === left) {
        cx2 = b.x - b.hx;
        nx = -1;
      } else if (m === right) {
        cx2 = b.x + b.hx;
        nx = 1;
      } else if (m === bottom) {
        cy2 = b.y - b.hy;
        ny = -1;
      } else {
        cy2 = b.y + b.hy;
        ny = 1;
      }
      const info = { d: 0, cx: cx2, cy: cy2, nx, ny };
      if (!best || info.d < best.d) best = info;
    }
  }
  return best;
}

function setAngleFromClient(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  const p = pivot();
  const worldX = body.x + ndcX * 9;
  const worldY = body.y + 1.2 + ndcY * 6;
  body.targetAngle = Math.atan2(worldX - p.x, worldY - p.y);
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  try {
    renderer.domElement.setPointerCapture(e.pointerId);
  } catch (_) {}
  setAngleFromClient(e.clientX, e.clientY);
});
renderer.domElement.addEventListener("pointermove", (e) => setAngleFromClient(e.clientX, e.clientY));
window.addEventListener("mousemove", (e) => setAngleFromClient(e.clientX, e.clientY));

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function reset() {
  body.x = 0.2;
  body.y = 1.15;
  body.vx = 0;
  body.vy = 0;
  body.angle = 1.05;
  body.targetAngle = 1.05;
  body.prevAngle = body.angle;
  won = false;
  document.getElementById("win").classList.remove("show");
}
let won = false;
reset();
document.getElementById("again").addEventListener("click", reset);

const heightEl = document.getElementById("height");
const hud = document.getElementById("hud");
if (hud) {
  const tip = hud.querySelector("p");
  if (tip) {
    tip.innerHTML =
      "Крути <b>мышкой</b> молот. Упри голову молота <b>в землю под собой</b> и крути дальше — котёл уедет в сторону. Дерево рядом — зацепись и лезь вверх.";
  }
}

let last = performance.now();

function tick(now) {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  const dt = Math.min(0.028, (now - last) / 1000);
  last = now;

  body.prevAngle = body.angle;
  let da = body.targetAngle - body.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const maxTurn = 12 * dt;
  body.angle += Math.max(-maxTurn, Math.min(maxTurn, da));
  const omega = (body.angle - body.prevAngle) / Math.max(dt, 1e-4);

  // Гравитация
  body.vy += GRAVITY * dt;
  body.vx *= 0.997;
  body.vy *= 0.998;

  body.x += body.vx * dt;
  body.y += body.vy * dt;

  // Молот упёрся → котёл двигается вокруг точки контакта (главная механика)
  let head = hammerHeadAt(body.angle);
  let hit = nearestHammerHit(head.x, head.y);
  if (hit) {
    // Точка на поверхности
    const cx = hit.cx + hit.nx * HAMMER_HEAD * 0.98;
    const cy = hit.cy + hit.ny * HAMMER_HEAD * 0.98;
    // Поставить pivot на расстоянии LEN от контакта вдоль молота
    const p = pivot();
    const desiredPx = cx - Math.sin(body.angle) * HAMMER_LEN;
    const desiredPy = cy - Math.cos(body.angle) * HAMMER_LEN;
    const ox = desiredPx - p.x;
    const oy = desiredPy - p.y;
    body.x += ox;
    body.y += oy;

    // Скорость от вращения вокруг контакта: v = ω × r
    // направление перпендикулярно рукояти
    const tx = Math.cos(body.angle);
    const ty = -Math.sin(body.angle);
    const tangential = omega * HAMMER_LEN;
    // сила «отталкивания» при вращении в землю
    body.vx = body.vx * 0.35 + tx * tangential * 0.85;
    body.vy = body.vy * 0.35 + ty * tangential * 0.85;

    // лёгкий толчок от нормали, если вдавливаем
    body.vx += hit.nx * 2.5 * dt * 60;
    body.vy += hit.ny * 2.5 * dt * 60;
  }

  // Котёл твёрдый — не сквозь скалы
  const solid = resolvePotSolid(body.x, body.y, POT_R * 0.9);
  if (solid.hit) {
    const dx = solid.x - body.x;
    const dy = solid.y - body.y;
    body.x = solid.x;
    body.y = solid.y;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const vn = body.vx * nx + body.vy * ny;
      if (vn < 0) {
        body.vx -= vn * nx * 1.05;
        body.vy -= vn * ny * 1.05;
      }
      body.vx *= 0.88;
      body.vy *= 0.88;
      body.grounded = true;
    }
  } else {
    body.grounded = false;
  }

  if (body.y < -2) reset();
  if (body.x < -13) {
    body.x = -13;
    body.vx = Math.abs(body.vx) * 0.2;
  }
  if (body.x > 13) {
    body.x = 13;
    body.vx = -Math.abs(body.vx) * 0.2;
  }

  potGroup.position.set(body.x, body.y, 0);
  hammerPivot.rotation.z = -body.angle;

  camera.position.x += (body.x - camera.position.x) * 0.1;
  camera.position.y += (body.y + 1.6 - camera.position.y) * 0.1;
  camera.lookAt(body.x, body.y + 0.8, 0);

  heightEl.textContent = "Высота: " + Math.max(0, body.y - 1.15).toFixed(1) + " м";

  if (!won && body.y >= WIN_Y) {
    won = true;
    document.getElementById("win").classList.add("show");
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
