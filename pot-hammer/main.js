/**
 * Котёл и молот — Getting Over It–стиль.
 * Котёл твёрдый (не сквозь скалы). Молот упирается головой → дуга.
 */
import * as THREE from "three";

window.__AMAL_NO_WORLD__ = true;

const GRAVITY = -24;
const POT_R = 0.46;
const HAMMER_LEN = 2.05;
const HEAD_R = 0.34;
const WIN_Y = 25.5;
const SUBS = 8;
const MAX_CORR = 0.22;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6b7a42);
scene.fog = new THREE.Fog(0x6b7a42, 42, 95);

const camera = new THREE.PerspectiveCamera(50, innerWidth / Math.max(1, innerHeight), 0.1, 200);
camera.position.set(0, 3.5, 13);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f0c8, 0x3a4520, 0.9));
const sun = new THREE.DirectionalLight(0xfff0d0, 1.05);
sun.position.set(8, 22, 10);
sun.castShadow = true;
scene.add(sun);

function mat(color, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness != null ? opts.roughness : 0.65,
    metalness: opts.metalness != null ? opts.metalness : 0.05,
  });
}

const boxes = [];

function addBox(cx, cy, w, h, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.35), mat(color || 0xc4a574, { roughness: 0.88 }));
  mesh.position.set(cx, cy, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  boxes.push({ x: cx, y: cy, hx: w / 2, hy: h / 2 });
}

function addTree(cx, cy, r) {
  const trunkH = r * 5.8;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.34, r * 0.44, trunkH, 12),
    mat(0x5c4030, { roughness: 0.92 })
  );
  trunk.position.set(cx, cy + trunkH / 2, 0);
  trunk.castShadow = true;
  scene.add(trunk);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(r * 1.45, 12, 10), mat(0x3d6b2e, { roughness: 0.95 }));
  leaf.position.set(cx, cy + trunkH + r * 0.35, 0);
  leaf.castShadow = true;
  scene.add(leaf);
  const tw = r * 0.38;
  boxes.push({ x: cx, y: cy + trunkH / 2, hx: tw, hy: trunkH / 2 });
}

// Уровень: всё близко, сразу есть куда упереть молот
addBox(0, -0.4, 8.5, 0.8, 0xd2b48c);
addBox(0.95, 0.4, 1.1, 0.5, 0xb8956a);
addBox(-0.75, 0.5, 1.05, 0.65, 0xb8956a);
addTree(-1.05, 0.0, 0.4);
addBox(1.95, 1.2, 1.2, 1.6, 0xb8956a);
addBox(-2.35, 2.2, 1.5, 3.4, 0xb8956a);
addBox(3.15, 3.5, 1.7, 2.2, 0xb8956a);
addBox(-1.45, 5.8, 2.3, 0.95, 0xc4a574);
addBox(2.0, 8.2, 2.3, 0.95, 0xc4a574);
addBox(-2.6, 10.8, 2.1, 0.9, 0xb8956a);
addBox(1.3, 13.5, 2.9, 0.95, 0xc4a574);
addBox(-1.7, 16.4, 2.3, 0.9, 0xb8956a);
addBox(2.4, 19.3, 2.7, 0.95, 0xc4a574);
addBox(0, 22.5, 4.0, 1.1, 0xd2b48c);
addBox(5.1, 11.5, 1.35, 8.5, 0xa67c52);

for (let i = 0; i < 6; i++) {
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(3 + (i % 3), 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0x4f5f32, { roughness: 1 })
  );
  hill.position.set(-10 + i * 5, -1.3, -6);
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
pot.position.y = 0.1;
pot.castShadow = true;
potGroup.add(pot);

const rim = new THREE.Mesh(
  new THREE.TorusGeometry(POT_R * 0.9, 0.055, 8, 24),
  mat(0x3a4a20, { metalness: 0.3, roughness: 0.4 })
);
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.36;
potGroup.add(rim);

const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 4, 10), mat(0xe8b896, { roughness: 0.7 }));
torso.position.y = 0.78;
torso.castShadow = true;
potGroup.add(torso);

const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), mat(0xf0c4a8, { roughness: 0.65 }));
headMesh.position.y = 1.24;
potGroup.add(headMesh);

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.19, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
  mat(0x2a1a12, { roughness: 0.9 })
);
hair.position.y = 1.3;
potGroup.add(hair);

const PIVOT_OX = 0.12;
const PIVOT_OY = 0.84;
const hammerPivot = new THREE.Group();
hammerPivot.position.set(PIVOT_OX, PIVOT_OY, 0.1);
potGroup.add(hammerPivot);

const handle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.042, 0.05, HAMMER_LEN, 8),
  mat(0x8b5a2b, { roughness: 0.8 })
);
handle.position.y = HAMMER_LEN / 2;
hammerPivot.add(handle);

const headHammer = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.32, 0.32),
  mat(0x8a9099, { metalness: 0.65, roughness: 0.35 })
);
headHammer.position.y = HAMMER_LEN;
hammerPivot.add(headHammer);

const body = {
  x: 0.1,
  y: 0.86,
  vx: 0,
  vy: 0,
  angle: 1.0,
  targetAngle: 1.0,
  prevAngle: 1.0,
  planted: false,
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function pivotAt(x, y) {
  return { x: x + PIVOT_OX, y: y + PIVOT_OY };
}

function tipAt(x, y, angle) {
  const p = pivotAt(x, y);
  return {
    x: p.x + Math.sin(angle) * HAMMER_LEN,
    y: p.y + Math.cos(angle) * HAMMER_LEN,
  };
}

/** Ближайшая точка поверхности бокса к точке + нормаль наружу */
function closestOnBox(px, py, b) {
  const cx = clamp(px, b.x - b.hx, b.x + b.hx);
  const cy = clamp(py, b.y - b.hy, b.y + b.hy);
  const ox = px - cx;
  const oy = py - cy;
  const d = Math.hypot(ox, oy);

  if (d > 1e-8) {
    return { d, cx, cy, nx: ox / d, ny: oy / d, inside: false };
  }

  // внутри или точно на грани
  const left = px - (b.x - b.hx);
  const right = b.x + b.hx - px;
  const bottom = py - (b.y - b.hy);
  const top = b.y + b.hy - py;
  const m = Math.min(left, right, bottom, top);
  if (m === left) return { d: 0, cx: b.x - b.hx, cy: py, nx: -1, ny: 0, inside: true };
  if (m === right) return { d: 0, cx: b.x + b.hx, cy: py, nx: 1, ny: 0, inside: true };
  if (m === bottom) return { d: 0, cx: px, cy: b.y - b.hy, nx: 0, ny: -1, inside: true };
  return { d: 0, cx: px, cy: b.y + b.hy, nx: 0, ny: 1, inside: true };
}

/** Вытолкнуть круг из ВСЕХ боксов — много проходов, без «пола-невидимки» */
function resolveCircle(x, y, r) {
  let nx = x;
  let ny = y;
  let hit = false;
  let snx = 0;
  let sny = 0;
  for (let pass = 0; pass < 6; pass++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const info = closestOnBox(nx, ny, b);
      const need = r;
      if (info.inside || info.d < need) {
        hit = true;
        moved = true;
        const push = info.inside ? need + 0.02 : need - info.d + 0.01;
        nx = info.cx + info.nx * (info.inside ? need + 0.02 : need + 0.005);
        ny = info.cy + info.ny * (info.inside ? need + 0.02 : need + 0.005);
        // если closestOnBox дал точку на поверхности, ставим центр по нормали
        if (!info.inside) {
          nx = info.cx + info.nx * need;
          ny = info.cy + info.ny * need;
        } else {
          nx = info.cx + info.nx * (need + 0.02);
          ny = info.cy + info.ny * (need + 0.02);
        }
        snx = info.nx;
        sny = info.ny;
        void push;
      }
    }
    if (!moved) break;
  }
  return { x: nx, y: ny, hit, nx: snx, ny: sny };
}

function hammerContact(bx, by, angle) {
  // голова + точки у конца рукояти (чтобы не «проскакивать»)
  const samples = [1, 0.92, 0.84];
  let best = null;
  const p = pivotAt(bx, by);
  for (let s = 0; s < samples.length; s++) {
    const t = samples[s];
    const hx = p.x + Math.sin(angle) * HAMMER_LEN * t;
    const hy = p.y + Math.cos(angle) * HAMMER_LEN * t;
    const rad = s === 0 ? HEAD_R : HEAD_R * 0.55;
    for (let i = 0; i < boxes.length; i++) {
      const info = closestOnBox(hx, hy, boxes[i]);
      if (info.inside || info.d <= rad) {
        const score = info.inside ? -1 : info.d;
        if (!best || score < best.score) {
          best = { ...info, score, rad };
        }
      }
    }
  }
  return best;
}

function applyPlant(dt) {
  const hit = hammerContact(body.x, body.y, body.angle);
  // дуга между prev и current — ловим быстрый промах
  if (!hit) {
    let da = body.angle - body.prevAngle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    for (let i = 1; i <= 4; i++) {
      const a = body.prevAngle + (da * i) / 4;
      const h = hammerContact(body.x, body.y, a);
      if (h) {
        body.planted = true;
        return plantFromHit(h, dt);
      }
    }
    body.planted = false;
    return;
  }
  body.planted = true;
  plantFromHit(hit, dt);
}

function plantFromHit(hit, dt) {
  const tipX = hit.cx + hit.nx * 0.06;
  const tipY = hit.cy + hit.ny * 0.06;
  const wantPx = tipX - Math.sin(body.angle) * HAMMER_LEN;
  const wantPy = tipY - Math.cos(body.angle) * HAMMER_LEN;
  let wantX = wantPx - PIVOT_OX;
  let wantY = wantPy - PIVOT_OY;

  let dx = wantX - body.x;
  let dy = wantY - body.y;
  const len = Math.hypot(dx, dy);
  if (len > MAX_CORR) {
    dx = (dx / len) * MAX_CORR;
    dy = (dy / len) * MAX_CORR;
  }

  body.x += dx;
  body.y += dy;

  const inv = 1 / Math.max(dt, 1e-4);
  body.vx = dx * inv * 0.75;
  body.vy = dy * inv * 0.75;

  // после упора — сразу вытолкнуть котёл из скал
  const solid = resolveCircle(body.x, body.y, POT_R);
  if (solid.hit) {
    body.x = solid.x;
    body.y = solid.y;
    const vn = body.vx * solid.nx + body.vy * solid.ny;
    if (vn < 0) {
      body.vx -= vn * solid.nx;
      body.vy -= vn * solid.ny;
    }
  }
}

function setAngleFromClient(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  const span = camera.position.z * 0.5;
  const worldX = camera.position.x + ndcX * span;
  const worldY = camera.position.y + ndcY * span * 0.7;
  const p = pivotAt(body.x, body.y);
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
  body.x = 0.1;
  body.y = 0.86;
  body.vx = 0;
  body.vy = 0;
  body.angle = 1.0;
  body.targetAngle = 1.0;
  body.prevAngle = 1.0;
  body.planted = false;
  won = false;
  document.getElementById("win").classList.remove("show");
  // сразу сесть на землю без проваливания
  const s = resolveCircle(body.x, body.y, POT_R);
  body.x = s.x;
  body.y = s.y;
}

let won = false;
reset();
document.getElementById("again").addEventListener("click", reset);

const heightEl = document.getElementById("height");
const tip = document.querySelector("#hud p");
if (tip) {
  tip.innerHTML =
    "Крути <b>мышкой</b>. Упри <b>голову молота</b> в землю/камень под собой и крути — котёл уедет. Котёл сквозь скалы <b>не проходит</b>.";
}

let last = performance.now();
window.__ph = body;

function tick(now) {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  const dt = Math.min(0.028, (now - last) / 1000);
  last = now;

  body.prevAngle = body.angle;
  let da = body.targetAngle - body.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  body.angle += clamp(da, -9 * dt, 9 * dt);

  const h = dt / SUBS;
  for (let i = 0; i < SUBS; i++) {
    applyPlant(h);

    if (!body.planted) {
      body.vy += GRAVITY * h;
      body.vx *= 0.9985;
      body.vy *= 0.9985;
      body.x += body.vx * h;
      body.y += body.vy * h;
    }

    const solid = resolveCircle(body.x, body.y, POT_R);
    if (solid.hit) {
      body.x = solid.x;
      body.y = solid.y;
      const vn = body.vx * solid.nx + body.vy * solid.ny;
      if (vn < 0) {
        body.vx -= vn * solid.nx * 1.05;
        body.vy -= vn * solid.ny * 1.05;
      }
      body.vx *= 0.88;
      body.vy *= 0.88;
    }
  }

  const spd = Math.hypot(body.vx, body.vy);
  if (spd > 16) {
    body.vx = (body.vx / spd) * 16;
    body.vy = (body.vy / spd) * 16;
  }

  if (body.y < -3.5 || Math.abs(body.x) > 13) reset();

  potGroup.position.set(body.x, body.y, 0);
  hammerPivot.rotation.z = -body.angle;

  camera.position.x += (body.x - camera.position.x) * 0.12;
  camera.position.y += (body.y + 1.4 - camera.position.y) * 0.12;
  camera.lookAt(body.x, body.y + 0.65, 0);

  heightEl.textContent = "Высота: " + Math.max(0, body.y - 0.86).toFixed(1) + " м";

  if (!won && body.y >= WIN_Y) {
    won = true;
    document.getElementById("win").classList.add("show");
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
