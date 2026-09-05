/**
 * Небесный кристалл v2 — нормальный вид: небо, острова-скалы, деревья, герой, камера.
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9ec9ff, 0.012);

// Градиент неба через большой купол
(function makeSky() {
  const geo = new THREE.SphereGeometry(180, 32, 16);
  const uniforms = {
    top: { value: new THREE.Color(0x4aa3ff) },
    mid: { value: new THREE.Color(0xb8dfff) },
    bot: { value: new THREE.Color(0xe8f4ff) },
  };
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
      varying vec3 vPos;
      void main() {
        float h = clamp(vPos.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(bot, mid, smoothstep(0.0, 0.45, h));
        c = mix(c, top, smoothstep(0.4, 1.0, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(geo, mat));
})();

const camera = new THREE.PerspectiveCamera(58, innerWidth / Math.max(1, innerHeight), 0.1, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xdff2ff, 0x5a7a4a, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3d4, 1.55);
sun.position.set(28, 48, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.near = 2; sc.far = 130;
sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50;
sun.shadow.bias = -0.00035;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.28));

// Облака-пушистики
function addCloud(x, y, z, s) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, transparent: true, opacity: 0.88,
  });
  const parts = [
    [0, 0, 0, 1], [0.9, 0.1, 0.2, 0.7], [-0.85, 0.05, -0.15, 0.75],
    [0.2, 0.35, -0.3, 0.55], [-0.3, 0.25, 0.35, 0.5],
  ];
  parts.forEach(([px, py, pz, sc]) => {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), m);
    ball.scale.set(sc * s, sc * s * 0.65, sc * s * 0.9);
    ball.position.set(px * s, py * s, pz * s);
    g.add(ball);
  });
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}
for (let i = 0; i < 22; i++) {
  addCloud(
    (Math.random() - 0.5) * 120,
    10 + Math.random() * 28,
    -10 + Math.random() * 140,
    1.6 + Math.random() * 2.4
  );
}

// Далёкие горы / силуэты
(function mountains() {
  const m = new THREE.MeshStandardMaterial({ color: 0x6b8cae, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 10; i++) {
    const h = 8 + Math.random() * 14;
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(6 + Math.random() * 5, h, 5), m);
    mesh.position.set(-60 + i * 14 + Math.random() * 4, h * 0.35 - 6, 130 + Math.random() * 20);
    scene.add(mesh);
  }
})();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 7.5,
  pitch: 0.4,
  yaw: Math.PI,
  lookOffsetY: 1.15,
  minDist: 3.2,
  maxDist: 14,
  lerp: 0.22,
});

function mat(color, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness != null ? opts.roughness : 0.55,
    metalness: opts.metalness != null ? opts.metalness : 0.08,
    emissive: opts.emissive || 0x000000,
    emissiveIntensity: opts.emissiveIntensity || 0,
    flatShading: !!opts.flat,
  });
}

function makePlayer() {
  const g = new THREE.Group();
  // Более «живой» персонаж
  const skin = mat(0xffd2b3, { roughness: 0.65 });
  const hairC = mat(0x2c1810, { roughness: 0.9 });
  const shirt = mat(0x2563eb, { roughness: 0.45, metalness: 0.1 });
  const pants = mat(0x1e3a8a, { roughness: 0.55 });
  const shoe = mat(0x111827, { roughness: 0.4, metalness: 0.2 });

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.28), pants);
  hips.position.y = 0.78;
  hips.castShadow = true;
  g.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.32), shirt);
  torso.position.y = 1.12;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), skin);
  head.position.y = 1.58;
  head.castShadow = true;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hairC);
  hair.position.y = 1.64;
  g.add(hair);

  // глаза
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  [-0.07, 0.07].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeM);
    eye.position.set(x, 1.6, 0.17);
    g.add(eye);
  });

  g.userData.limbs = [];
  [-0.28, 0.28].forEach((x, i) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 4, 8), skin);
    arm.position.set(x, 1.15, 0);
    arm.castShadow = true;
    g.add(arm);
    g.userData.limbs.push({ mesh: arm, side: i ? 1 : -1, kind: "arm" });
  });
  [-0.12, 0.12].forEach((x, i) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.4, 4, 8), pants);
    leg.position.set(x, 0.42, 0);
    leg.castShadow = true;
    g.add(leg);
    g.userData.limbs.push({ mesh: leg, side: i ? 1 : -1, kind: "leg" });
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.3), shoe);
    boot.position.set(x, 0.08, 0.04);
    boot.castShadow = true;
    g.add(boot);
  });

  // рюкзак-кристалл
  const pack = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 0),
    mat(0x67e8f9, { roughness: 0.2, metalness: 0.55, emissive: 0x22d3ee, emissiveIntensity: 0.45 })
  );
  pack.position.set(0, 1.2, -0.22);
  g.add(pack);

  g.userData.height = 1.7;
  scene.add(g);
  return g;
}

const player = makePlayer();
const vel = new THREE.Vector3();
let onGround = false;
let walkPhase = 0;
let coyote = 0;
let jumpBuf = 0;

// Трейл за игроком
const trail = [];
const TRAIL_N = 18;
for (let i = 0; i < TRAIL_N; i++) {
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.35 * (1 - i / TRAIL_N),
    })
  );
  p.visible = false;
  scene.add(p);
  trail.push({ mesh: p, life: 0 });
}
let trailTimer = 0;

const platforms = [];
const crystals = [];
const checkpoints = [];
const decorSpin = [];
let activeCp = 0;
let crystalCount = 0;
let finished = false;
let startTime = performance.now();
let spawn = { x: 0, y: 2.4, z: 0 };

function addTree(x, y, z, scale) {
  scale = scale || 1;
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.7 * scale, 6),
    mat(0x7c4a2a, { roughness: 0.9, flat: true })
  );
  trunk.position.y = 0.35 * scale;
  trunk.castShadow = true;
  g.add(trunk);
  const leaf = new THREE.Mesh(
    new THREE.ConeGeometry(0.55 * scale, 1.1 * scale, 7),
    mat(0x22c55e, { roughness: 0.85, flat: true })
  );
  leaf.position.y = 1.05 * scale;
  leaf.castShadow = true;
  g.add(leaf);
  const leaf2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.4 * scale, 0.8 * scale, 7),
    mat(0x16a34a, { roughness: 0.85, flat: true })
  );
  leaf2.position.y = 1.55 * scale;
  leaf2.castShadow = true;
  g.add(leaf2);
  g.position.set(x, y, z);
  scene.add(g);
}

function addIsland(opts) {
  const {
    x, y, z,
    w = 5, h = 0.55, d = 5,
    color = 0x4ade80,
    rock = 0x78716c,
    shape = "box",
    trees = 0,
  } = opts;

  const g = new THREE.Group();
  let topGeo;
  if (shape === "hex") topGeo = new THREE.CylinderGeometry(Math.max(w, d) / 2, Math.max(w, d) / 2, h, 6);
  else if (shape === "round") topGeo = new THREE.CylinderGeometry(Math.max(w, d) / 2, Math.max(w, d) / 2 * 0.92, h, 20);
  else topGeo = new THREE.BoxGeometry(w, h, d);

  const top = new THREE.Mesh(topGeo, mat(color, { roughness: 0.7 }));
  top.position.y = 0;
  top.receiveShadow = true;
  top.castShadow = true;
  g.add(top);

  // скала снизу
  const rockH = 1.2 + Math.min(w, d) * 0.25;
  const rockMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(w, d) * 0.42, Math.max(w, d) * 0.18, rockH, shape === "hex" ? 6 : 8),
    mat(rock, { roughness: 0.92, flat: true })
  );
  rockMesh.position.y = -h / 2 - rockH / 2 + 0.05;
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  g.add(rockMesh);

  // травяной край
  if (shape === "box") {
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.02, 0.1, d * 1.02),
      mat(0x22c55e, { roughness: 0.85 })
    );
    rim.position.y = h / 2 + 0.02;
    rim.receiveShadow = true;
    g.add(rim);
  }

  g.position.set(x, y, z);
  scene.add(g);

  const bw = shape === "box" ? w : Math.max(w, d);
  const bd = shape === "box" ? d : Math.max(w, d);
  const collider = {
    x, y, z,
    w: bw * 1.02,
    h: Math.max(h, 0.4),
    d: bd * 1.02,
    topY: y + h / 2,
  };
  platforms.push(collider);

  for (let i = 0; i < trees; i++) {
    const ox = (Math.random() - 0.5) * (bw * 0.55);
    const oz = (Math.random() - 0.5) * (bd * 0.55);
    addTree(x + ox, y + h / 2, z + oz, 0.7 + Math.random() * 0.5);
  }

  return collider;
}

function addCrystal(x, y, z) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    mat(0x22d3ee, { roughness: 0.12, metalness: 0.75, emissive: 0x06b6d4, emissiveIntensity: 0.85 })
  );
  core.castShadow = true;
  g.add(core);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.22 })
  );
  g.add(glow);
  g.position.set(x, y, z);
  g.userData = { taken: false, baseY: y };
  scene.add(g);
  crystals.push(g);
  decorSpin.push(g);
  return g;
}

function addCheckpoint(x, y, z, index) {
  addIsland({ x, y, z, w: 4.2, h: 0.5, d: 4.2, color: 0xfbbf24, rock: 0xa16207, shape: "hex", trees: 0 });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.1, 12, 40),
    mat(0xfde68a, { roughness: 0.25, metalness: 0.45, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y + 1.35, z);
  scene.add(ring);
  decorSpin.push(ring);
  checkpoints.push({ x, y: y + 1.6, z, index, ring, topY: y + 0.25 });
}

function addFinish(x, y, z) {
  addIsland({ x, y, z, w: 6.5, h: 0.55, d: 6.5, color: 0xa78bfa, rock: 0x5b21b6, shape: "hex", trees: 2 });
  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.2, 14, 48),
    mat(0xc4b5fd, { roughness: 0.2, metalness: 0.6, emissive: 0x8b5cf6, emissiveIntensity: 0.75 })
  );
  portal.position.set(x, y + 2.1, z);
  scene.add(portal);
  const swirl = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 36),
    new THREE.MeshBasicMaterial({ color: 0xddd6fe, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  );
  swirl.position.copy(portal.position);
  scene.add(swirl);
  decorSpin.push(portal, swirl);
  return { portal, swirl, x, y: y + 1.8, z };
}

// —— Уровень: короткие прыжки, широкие острова (проходимо) ——
// Шаг по Z ≈ 6–7 при платформе 4–5 → щель ~2 м, прыжок лёгкий
addIsland({ x: 0, y: 0, z: 0, w: 11, h: 0.6, d: 11, color: 0x4ade80, rock: 0x57534e, shape: "round", trees: 3 });
addCheckpoint(0, 0, 0, 0);

addIsland({ x: 0, y: 0.4, z: 9, w: 5.5, h: 0.5, d: 5.5, color: 0x86efac, shape: "round" });
addCrystal(0, 1.5, 9);

addIsland({ x: 1.2, y: 0.9, z: 17, w: 5.2, h: 0.5, d: 5.2, color: 0x4ade80, shape: "hex" });
addCrystal(1.2, 2.0, 17);

addIsland({ x: -1, y: 1.4, z: 25, w: 5.5, h: 0.5, d: 5.5, color: 0x22c55e, shape: "round", trees: 1 });
addCheckpoint(-1, 1.4, 25, 1);
addCrystal(-1, 2.5, 25);

addIsland({ x: 0.5, y: 1.9, z: 33, w: 5, h: 0.5, d: 5, color: 0x86efac, shape: "round" });
addCrystal(0.5, 3.0, 33);

addIsland({ x: 2, y: 2.4, z: 41, w: 5.2, h: 0.5, d: 5.2, color: 0x4ade80, shape: "hex" });
addCrystal(2, 3.5, 41);

addIsland({ x: 0, y: 2.9, z: 49, w: 6.5, h: 0.55, d: 6.5, color: 0x22c55e, shape: "round", trees: 2 });
addCheckpoint(0, 2.9, 49, 2);
addCrystal(-1.5, 4.1, 48);
addCrystal(1.5, 4.1, 50);

addIsland({ x: -1.5, y: 3.4, z: 57, w: 5, h: 0.5, d: 5, color: 0x86efac, shape: "round" });
addCrystal(-1.5, 4.5, 57);

addIsland({ x: 0.8, y: 3.9, z: 65, w: 5.2, h: 0.5, d: 5.2, color: 0x4ade80, shape: "hex" });
addCrystal(0.8, 5.0, 65);

addIsland({ x: 0, y: 4.5, z: 73, w: 6, h: 0.55, d: 6, color: 0x16a34a, shape: "round", trees: 2 });
addCrystal(0, 5.7, 73);

addIsland({ x: 1, y: 5.0, z: 81, w: 5.5, h: 0.5, d: 5.5, color: 0x86efac, shape: "round" });
addCrystal(1, 6.1, 81);

const finish = addFinish(0, 5.6, 90);
addCrystal(0, 7.0, 90);

document.getElementById("crystals-max").textContent = String(crystals.length);

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1300);
}

function respawn() {
  player.position.set(spawn.x, spawn.y, spawn.z);
  vel.set(0, 0, 0);
  toast("⚑ Чекпоинт");
}

function setCheckpoint(cp) {
  if (cp.index <= activeCp) return;
  activeCp = cp.index;
  spawn = { x: cp.x, y: cp.y, z: cp.z };
  document.getElementById("cp").textContent = String(activeCp + 1);
  toast("Новый чекпоинт!");
}

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

const pad = document.getElementById("pad");
const knob = document.getElementById("pad-knob");
const stick = { x: 0, y: 0, active: false };
function setStick(clientX, clientY) {
  const r = pad.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = (clientX - cx) / (r.width / 2);
  let dy = (clientY - cy) / (r.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  if (len > 1) { dx /= len; dy /= len; }
  stick.x = dx; stick.y = dy;
  knob.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
}
function clearStick() {
  stick.x = 0; stick.y = 0; stick.active = false;
  knob.style.transform = "translate(0,0)";
}
pad.addEventListener("pointerdown", (e) => {
  stick.active = true;
  pad.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY);
});
pad.addEventListener("pointermove", (e) => { if (stick.active) setStick(e.clientX, e.clientY); });
pad.addEventListener("pointerup", clearStick);
pad.addEventListener("pointercancel", clearStick);
document.getElementById("jump-btn").addEventListener("pointerdown", (e) => { e.preventDefault(); keys.Space = true; });
document.getElementById("jump-btn").addEventListener("pointerup", () => { keys.Space = false; });

function getInput() {
  let x = 0, z = 0;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) z -= 1;
  if (keys.KeyS || keys.ArrowDown) z += 1;
  if (stick.active) { x += stick.x; z += stick.y; }
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return { x, z, jump: !!keys.Space };
}

function collidePlatforms() {
  onGround = false;
  const px = player.position.x;
  const py = player.position.y;
  const pz = player.position.z;
  const radius = 0.3;
  const height = player.userData.height;

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const hw = p.w / 2;
    const hd = p.d / 2;
    const top = p.topY;
    const within =
      px > p.x - hw - radius && px < p.x + hw + radius &&
      pz > p.z - hd - radius && pz < p.z + hd + radius;
    if (!within) continue;

    if (vel.y <= 0 && py <= top + 0.14 && py >= top - 0.6) {
      player.position.y = top;
      vel.y = 0;
      onGround = true;
    }
    const bottom = p.y - p.h / 2;
    if (vel.y > 0 && py + height > bottom && py + height < bottom + 0.5 &&
        Math.abs(px - p.x) < hw * 0.85 && Math.abs(pz - p.z) < hd * 0.85) {
      vel.y = 0;
      player.position.y = bottom - height;
    }
  }
}

function win() {
  if (finished) return;
  finished = true;
  const sec = ((performance.now() - startTime) / 1000).toFixed(1);
  document.getElementById("win-text").textContent =
    "Кристаллы: " + crystalCount + "/" + crystals.length + " · " + sec + "с";
  document.getElementById("win").classList.add("show");
  toast("Портал! ✨");
}
document.getElementById("again").onclick = () => location.reload();

player.position.set(spawn.x, spawn.y, spawn.z);

let last = performance.now();
let jumpBuf = 0;

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  if (!finished) {
    document.getElementById("time").textContent = ((now - startTime) / 1000).toFixed(1);
    const input = getInput();
    const speed = 7.6;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const wish = new THREE.Vector3();
    wish.addScaledVector(right, input.x);
    wish.addScaledVector(forward, -input.z);

    const moving = wish.lengthSq() > 0.0001;
    if (moving) {
      wish.normalize();
      vel.x = wish.x * speed;
      vel.z = wish.z * speed;
      player.rotation.y = Math.atan2(wish.x, wish.z);
      if (onGround) walkPhase += dt * 10;
    } else {
      vel.x *= 0.8;
      vel.z *= 0.8;
      walkPhase *= 0.9;
    }

    // анимация ног/рук
    (player.userData.limbs || []).forEach((L) => {
      const amp = onGround && moving ? 0.55 : 0.08;
      const ang = Math.sin(walkPhase) * amp * L.side * (L.kind === "arm" ? -1 : 1);
      L.mesh.rotation.x = ang;
    });

    if (input.jump) jumpBuf = 0.12;
    jumpBuf -= dt;
    if (jumpBuf > 0 && onGround) {
      vel.y = 9.6;
      onGround = false;
      jumpBuf = 0;
    }

    vel.y -= 24 * dt;
    player.position.x += vel.x * dt;
    player.position.y += vel.y * dt;
    player.position.z += vel.z * dt;
    collidePlatforms();
    if (player.position.y < -10) respawn();

    const pCenter = player.position.clone().add(new THREE.Vector3(0, 1, 0));
    for (let i = 0; i < crystals.length; i++) {
      const c = crystals[i];
      if (c.userData.taken) continue;
      c.rotation.y += dt * 2;
      c.position.y = c.userData.baseY + Math.sin(now * 0.004 + i) * 0.2;
      if (c.position.distanceTo(pCenter) < 1.4) {
        c.userData.taken = true;
        c.visible = false;
        crystalCount++;
        document.getElementById("crystals").textContent = String(crystalCount);
        toast("💎 +" + crystalCount);
      }
    }

    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      if (Math.hypot(player.position.x - cp.x, player.position.z - cp.z) < 1.7 &&
          Math.abs(player.position.y - cp.topY) < 2.4) {
        setCheckpoint(cp);
      }
    }

    finish.portal.rotation.y += dt * 1.1;
    finish.swirl.rotation.z -= dt * 1.6;
    const need = Math.max(1, Math.ceil(crystals.length * 0.55));
    if (
      crystalCount >= need &&
      Math.hypot(player.position.x - finish.x, player.position.z - finish.z) < 2 &&
      Math.abs(player.position.y - finish.y) < 2.8
    ) {
      win();
    }
  }

  orbit.follow(player.position);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
toast("Собери кристаллы → фиолетовый портал");
