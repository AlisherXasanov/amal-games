/**
 * Котёл и молот — физический подъём (в духе Getting Over It).
 * Молот упирается → котёл едет по дуге; сквозь скалы не проходит.
 */
import * as THREE from "three";

window.__AMAL_NO_WORLD__ = true;

const GRAVITY = -22;
const POT_R = 0.48;
const HAMMER_LEN = 2.15;
const HAMMER_HEAD = 0.28;
const WIN_Y = 26;
const SUBSTEPS = 5;
const MAX_PLANT_STEP = 0.28;

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
  const trunkH = r * 6.2;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.36, r * 0.46, trunkH, 12),
    mat(0x5c4030, { roughness: 0.9 })
  );
  trunk.position.set(cx, cy + trunkH / 2, 0);
  trunk.castShadow = true;
  scene.add(trunk);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(r * 1.6, 12, 10), mat(0x3d6b2e, { roughness: 0.95 }));
  canopy.position.set(cx, cy + trunkH + r * 0.4, 0);
  canopy.castShadow = true;
  scene.add(canopy);
  const top = cy + trunkH;
  const bot = cy;
  const tw = r * 0.4;
  boxes.push({ x: cx, y: cy + trunkH / 2, w: tw * 2, h: trunkH, hx: tw, hy: trunkH / 2 });
  segments.push(
    { ax: cx - tw, ay: bot, bx: cx - tw, by: top },
    { ax: cx + tw, ay: bot, bx: cx + tw, by: top },
    { ax: cx - tw, ay: top, bx: cx + tw, by: top }
  );
}

// Старт: земля короче, уступы и дерево рядом — сразу можно упереться
addBoxTerrain(0, -0.35, 9.5, 0.7, 0xd2b48c);
addBoxTerrain(1.05, 0.45, 1.15, 0.55, 0xb8956a);
addBoxTerrain(-0.85, 0.55, 1.1, 0.7, 0xb8956a);
addCircleTree(-1.15, 0.0, 0.42);
addBoxTerrain(2.15, 1.35, 1.3, 1.8, 0xb8956a);
addBoxTerrain(-2.55, 2.4, 1.6, 3.6, 0xb8956a);
addBoxTerrain(3.4, 3.8, 1.8, 2.4, 0xb8956a);
addBoxTerrain(-1.6, 6.2, 2.4, 1.0, 0xc4a574);
addBoxTerrain(2.2, 8.6, 2.4, 1.0, 0xc4a574);
addBoxTerrain(-2.8, 11.2, 2.2, 0.95, 0xb8956a);
addBoxTerrain(1.4, 14.0, 3.0, 1.0, 0xc4a574);
addBoxTerrain(-1.8, 17.0, 2.4, 0.95, 0xb8956a);
addBoxTerrain(2.6, 20.0, 2.8, 1.0, 0xc4a574);
addBoxTerrain(0, 23.2, 4.2, 1.15, 0xd2b48c);
addBoxTerrain(5.4, 12.0, 1.4, 9, 0xa67c52);

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
pot.position.y = 0.12;
pot.castShadow = true;
potGroup.add(pot);

const rim = new THREE.Mesh(
  new THREE.TorusGeometry(POT_R * 0.92, 0.06, 8, 24),
  mat(0x3a4a20, { metalness: 0.3, roughness: 0.4 })
);
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.38;
potGroup.add(rim);

const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.35, 4, 10), mat(0xe8b896, { roughness: 0.7 }));
torso.position.y = 0.82;
torso.castShadow = true;
potGroup.add(torso);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0xf0c4a8, { roughness: 0.65 }));
head.position.y = 1.3;
head.castShadow = true;
potGroup.add(head);

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
  mat(0x2a1a12, { roughness: 0.9 })
);
hair.position.y = 1.37;
potGroup.add(hair);

const hammerPivot = new THREE.Group();
hammerPivot.position.set(0.12, 0.88, 0.12);
potGroup.add(hammerPivot);

const handle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.055, HAMMER_LEN, 8),
  mat(0x8b5a2b, { roughness: 0.8 })
);
handle.position.y = HAMMER_LEN / 2;
handle.castShadow = true;
hammerPivot.add(handle);

const headHammer = new THREE.Mesh(
  new THREE.BoxGeometry(0.52, 0.34, 0.34),
  mat(0x8a9099, { metalness: 0.65, roughness: 0.35 })
);
headHammer.position.y = HAMMER_LEN;
headHammer.castShadow = true;
hammerPivot.add(headHammer);

const body = {
  x: 0,
  y: 1.05,
  vx: 0,
  vy: 0,
  angle: 1.05,
  targetAngle: 1.05,
  prevAngle: 1.05,
  planted: false,
};

function pivot() {
  return { x: body.x + 0.12, y: body.y + 0.88 };
}

function hammerHeadAt(angle) {
  const p = pivot();
  return {
    x: p.x + Math.sin(angle) * HAMMER_LEN,
    y: p.y + Math.cos(angle) * HAMMER_LEN,
  };
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function distPointSeg(px, py, seg) {
  const abx = seg.bx - seg.ax;
  const aby = seg.by - seg.ay;
  const apx = px - seg.ax;
  const apy = py - seg.ay;
  const ab2 = abx * abx + aby * aby || 1;
  let t = (apx * abx + apy * aby) / ab2;
  t = clamp(t, 0, 1);
  const cx = seg.ax + abx * t;
  const cy = seg.ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  const d = Math.hypot(dx, dy);
  return { d, cx, cy, nx: d > 1e-6 ? dx / d : 0, ny: d > 1e-6 ? dy / d : 1 };
}

/** Вытолкнуть круг из боксов (несколько проходов). Без бесконечного пола. */
function resolvePotSolid(x, y, r) {
  let nx = x;
  let ny = y;
  let hit = false;
  let snx = 0;
  let sny = 0;
  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const dx = nx - b.x;
      const dy = ny - b.y;
      const px = b.hx + r;
      const py = b.hy + r;
      if (Math.abs(dx) < px && Math.abs(dy) < py) {
        hit = true;
        moved = true;
        const ox = px - Math.abs(dx);
        const oy = py - Math.abs(dy);
        if (ox < oy) {
          const s = dx > 0 ? 1 : -1;
          nx += s * ox;
          snx = s;
          sny = 0;
        } else {
          const s = dy > 0 ? 1 : -1;
          ny += s * oy;
          snx = 0;
          sny = s;
        }
      }
    }
    if (!moved) break;
  }
  return { x: nx, y: ny, hit, nx: snx, ny: sny };
}

function nearestHammerHit(hx, hy) {
  let best = null;
  for (let i = 0; i < segments.length; i++) {
    const info = distPointSeg(hx, hy, segments[i]);
    if (info.d <= HAMMER_HEAD) {
      if (!best || info.d < best.d) best = { ...info, kind: "seg" };
    }
  }
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const cx = clamp(hx, b.x - b.hx, b.x + b.hx);
    const cy = clamp(hy, b.y - b.hy, b.y + b.hy);
    const ox = hx - cx;
    const oy = hy - cy;
    const d = Math.hypot(ox, oy);
    if (d <= HAMMER_HEAD && d > 1e-6) {
      const info = { d, cx, cy, nx: ox / d, ny: oy / d, kind: "box" };
      if (!best || info.d < best.d) best = info;
    } else if (d < 1e-6 && Math.abs(hx - b.x) < b.hx && Math.abs(hy - b.y) < b.hy) {
      const left = hx - (b.x - b.hx);
      const right = b.x + b.hx - hx;
      const bottom = hy - (b.y - b.hy);
      const top = b.y + b.hy - hy;
      const m = Math.min(left, right, bottom, top);
      let cx2 = hx;
      let cy2 = hy;
      let nnx = 0;
      let nny = 0;
      if (m === left) {
        cx2 = b.x - b.hx;
        nnx = -1;
      } else if (m === right) {
        cx2 = b.x + b.hx;
        nnx = 1;
      } else if (m === bottom) {
        cy2 = b.y - b.hy;
        nny = -1;
      } else {
        cy2 = b.y + b.hy;
        nny = 1;
      }
      const info = { d: 0, cx: cx2, cy: cy2, nx: nnx, ny: nny, kind: "inside" };
      if (!best || info.d < best.d) best = info;
    }
  }
  return best;
}

/** Упор молота: котёл на дуге вокруг точки контакта, без телепортов. */
function applyHammerPlant(dt) {
  const head = hammerHeadAt(body.angle);
  const hit = nearestHammerHit(head.x, head.y);
  body.planted = !!hit;
  if (!hit) return;

  const tipX = hit.cx + hit.nx * 0.04;
  const tipY = hit.cy + hit.ny * 0.04;
  const desiredPx = tipX - Math.sin(body.angle) * HAMMER_LEN;
  const desiredPy = tipY - Math.cos(body.angle) * HAMMER_LEN;
  let wantX = desiredPx - 0.12;
  let wantY = desiredPy - 0.88;

  let dx = wantX - body.x;
  let dy = wantY - body.y;
  const len = Math.hypot(dx, dy);
  if (len > MAX_PLANT_STEP) {
    dx = (dx / len) * MAX_PLANT_STEP;
    dy = (dy / len) * MAX_PLANT_STEP;
    wantX = body.x + dx;
    wantY = body.y + dy;
  }

  const invDt = 1 / Math.max(dt, 1e-4);
  body.vx = dx * invDt;
  body.vy = dy * invDt;
  body.x = wantX;
  body.y = wantY;

  // чуть «цепляемся» за нормаль, чтобы не проскальзывать в камень
  body.vx += hit.nx * 1.2;
  body.vy += hit.ny * 1.2;
}

function setAngleFromClient(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  const span = camera.position.z * 0.52;
  const worldX = camera.position.x + ndcX * span;
  const worldY = camera.position.y + ndcY * span * 0.72;
  const p = pivot();
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
  body.x = 0.15;
  body.y = 1.05;
  body.vx = 0;
  body.vy = 0;
  body.angle = 1.05;
  body.targetAngle = 1.05;
  body.prevAngle = body.angle;
  body.planted = false;
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
      "Крути <b>мышкой</b> молот. Упри голову <b>в землю / камень под собой</b> и крути дальше — котёл уедет в сторону. Дерево слева рядом.";
  }
}

let last = performance.now();

function tick(now) {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  const dt = Math.min(0.03, (now - last) / 1000);
  last = now;

  body.prevAngle = body.angle;
  let da = body.targetAngle - body.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const maxTurn = 10 * dt;
  body.angle += clamp(da, -maxTurn, maxTurn);

  const h = dt / SUBSTEPS;
  for (let s = 0; s < SUBSTEPS; s++) {
    if (!body.planted) {
      body.vy += GRAVITY * h;
      body.vx *= 0.999;
      body.vy *= 0.999;
    } else {
      body.vx *= 0.992;
      body.vy *= 0.992;
    }

    body.x += body.vx * h;
    body.y += body.vy * h;

    applyHammerPlant(h);

    const solid = resolvePotSolid(body.x, body.y, POT_R * 0.88);
    if (solid.hit) {
      body.x = solid.x;
      body.y = solid.y;
      if (solid.nx || solid.ny) {
        const vn = body.vx * solid.nx + body.vy * solid.ny;
        if (vn < 0) {
          body.vx -= vn * solid.nx * 1.08;
          body.vy -= vn * solid.ny * 1.08;
        }
        body.vx *= 0.9;
        body.vy *= 0.9;
      }
    }
  }

  // ограничение скорости — без ракетного вылета
  const spd = Math.hypot(body.vx, body.vy);
  if (spd > 18) {
    body.vx = (body.vx / spd) * 18;
    body.vy = (body.vy / spd) * 18;
  }

  if (body.y < -3 || body.x < -14 || body.x > 14) reset();

  potGroup.position.set(body.x, body.y, 0);
  hammerPivot.rotation.z = -body.angle;

  camera.position.x += (body.x - camera.position.x) * 0.12;
  camera.position.y += (body.y + 1.5 - camera.position.y) * 0.12;
  camera.lookAt(body.x, body.y + 0.7, 0);

  heightEl.textContent = "Высота: " + Math.max(0, body.y - 1.05).toFixed(1) + " м";

  if (!won && body.y >= WIN_Y) {
    won = true;
    document.getElementById("win").classList.add("show");
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
