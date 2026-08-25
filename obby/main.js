/**
 * Obby — нормальный 3D-паркур на каркасе Amal3D (Three 0.160).
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;

const app = (() => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87b7e8);
  scene.fog = new THREE.Fog(0x87b7e8, 55, 180);

  const camera = new THREE.PerspectiveCamera(65, innerWidth / Math.max(1, innerHeight), 0.1, 400);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.body.appendChild(renderer.domElement);

  // Небо / свет — как в нормальных 3D
  const hemi = new THREE.HemisphereLight(0xdcecff, 0x3d5a40, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.35);
  sun.position.set(40, 70, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 160;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.00025;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  // Дальний «пол-пропасть» для ощущения мира
  const voidMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.35,
  });
  const voidPlane = new THREE.Mesh(new THREE.CircleGeometry(220, 48), voidMat);
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.y = -8;
  voidPlane.receiveShadow = true;
  scene.add(voidPlane);

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / Math.max(1, innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return { THREE, scene, camera, renderer, sun };
})();

const { scene, camera, renderer } = app;

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 7.2,
  pitch: 0.38,
  yaw: Math.PI,
  lookOffsetY: 1.25,
  minDist: 3.2,
  maxDist: 18,
});

function mat(color, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness != null ? opts.roughness : 0.55,
    metalness: opts.metalness != null ? opts.metalness : 0.08,
    emissive: opts.emissive != null ? opts.emissive : 0x000000,
    emissiveIntensity: opts.emissiveIntensity != null ? opts.emissiveIntensity : 0,
  });
}

function makePlayer() {
  const g = new THREE.Group();
  const skin = mat(0xffc9a3, { roughness: 0.7 });
  const shirt = mat(0x2563eb, { roughness: 0.45, metalness: 0.12 });
  const pants = mat(0x1e3a5f, { roughness: 0.6 });
  const shoes = mat(0x111827, { roughness: 0.4, metalness: 0.2 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.32), shirt);
  torso.position.y = 1.05;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), skin);
  head.position.y = 1.6;
  head.castShadow = true;
  g.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mat(0x3f2a1a, { roughness: 0.85 })
  );
  hair.position.y = 1.68;
  g.add(hair);

  [-0.38, 0.38].forEach((x) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.38, 4, 8), skin);
    arm.position.set(x, 1.1, 0);
    arm.castShadow = true;
    g.add(arm);
  });
  [-0.16, 0.16].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.42, 4, 8), pants);
    leg.position.set(x, 0.45, 0);
    leg.castShadow = true;
    g.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.32), shoes);
    shoe.position.set(x, 0.08, 0.04);
    shoe.castShadow = true;
    g.add(shoe);
  });

  // Значок «A» на груди
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.22),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  badge.position.set(0, 1.12, 0.17);
  g.add(badge);

  g.userData.height = 1.7;
  scene.add(g);
  return g;
}

const platforms = [];
const lasers = [];
const checkpoints = [];
let activeCp = 0;
let deaths = 0;
let finished = false;
let FINISH_Z = 280;

function addShape(opts) {
  const {
    x, y, z,
    w = 3, h = 0.4, d = 3,
    color = 0x60a5fa,
    shape = "box",
    rotX = 0, rotZ = 0, rotY = 0,
  } = opts;

  let geo;
  if (shape === "cylinder") geo = new THREE.CylinderGeometry(Math.max(w, d) / 2, Math.max(w, d) / 2, h, 28);
  else if (shape === "sphere") geo = new THREE.SphereGeometry(Math.max(w, d) / 2, 24, 16);
  else if (shape === "cone") geo = new THREE.ConeGeometry(Math.max(w, d) / 2, h * 2.2, 20);
  else if (shape === "torus") geo = new THREE.TorusGeometry(Math.max(w, d) / 2.4, h * 0.7, 12, 36);
  else if (shape === "diamond") geo = new THREE.OctahedronGeometry(Math.max(w, d) / 2, 0);
  else if (shape === "beam") geo = new THREE.BoxGeometry(w, h, d);
  else geo = new THREE.BoxGeometry(w, h, d);

  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.48, metalness: 0.1 }));
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  if (shape === "torus") mesh.rotation.x = Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  const bw = shape === "sphere" || shape === "diamond" ? Math.max(w, d) * 0.95 : w;
  const bh = shape === "sphere" ? Math.max(w, d) * 0.7 : shape === "torus" ? h * 1.6 : h;
  const bd = shape === "sphere" || shape === "diamond" ? Math.max(w, d) * 0.95 : d;
  mesh.userData = { w: bw * 1.05, h: Math.max(bh, 0.35), d: bd * 1.05, shape };
  scene.add(mesh);
  platforms.push(mesh);
  return mesh;
}

function addCheckpoint(x, y, z, name) {
  addShape({ x, y, z, w: 4, h: 0.45, d: 4, color: 0x22d3ee, shape: "cylinder" });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 10), mat(0xfbbf24, { metalness: 0.4, roughness: 0.3 }));
  pole.position.set(x + 1.4, y + 1.3, z);
  pole.castShadow = true;
  scene.add(pole);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, emissive: 0xb45309, emissiveIntensity: 0.25 })
  );
  banner.position.set(x + 0.9, y + 2.0, z);
  scene.add(banner);
  checkpoints.push({ x, y: y + 1.4, z, name, unlocked: false });
}

function addLaser(opts) {
  const {
    x, y, z, len = 4, axis = "x",
    mode = "static",
    color = 0xff2255,
    speed = 1,
    amp = 2,
    period = 1.2,
    phase = 0,
  } = opts;
  const geo = axis === "x" ? new THREE.BoxGeometry(len, 0.12, 0.12) : new THREE.BoxGeometry(0.12, 0.12, len);
  const beam = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95,
    })
  );
  beam.position.set(x, y, z);
  scene.add(beam);
  const glow = new THREE.PointLight(color, 0.7, 7);
  glow.position.copy(beam.position);
  scene.add(glow);
  lasers.push({ beam, glow, base: { x, y, z }, len, axis, mode, speed, amp, period, phase, color, active: true });
}

// === Трасса ===
addShape({ x: 0, y: 0, z: 0, w: 8, h: 0.5, d: 8, color: 0x4ade80, shape: "cylinder" });
addCheckpoint(0, 0, 0, "Старт");

const exclusiveOwned = { orb: false, rainbow: false, crown: false };
const exclusiveMeshes = [];

function isAdmin() {
  try {
    if (window.__AMAL_OWNER__ === true || window.__AMAL_GOD__ === true || window.__AMAL_LEGEND__) return true;
    if (window.AmalPowers && typeof AmalPowers.isOwner === "function" && AmalPowers.isOwner()) return true;
    if (window.AmalHub && typeof AmalHub.isGameAdmin === "function" && AmalHub.isGameAdmin("obby")) return true;
    if (window.AmalHub && typeof AmalHub.isOwner === "function" && AmalHub.isOwner()) return true;
  } catch (_) {}
  return false;
}

function trackExclusive(mesh) {
  scene.add(mesh);
  exclusiveMeshes.push(mesh);
  return mesh;
}

function placeOrb() {
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 24, 20),
    mat(0xfbbf24, { metalness: 0.6, roughness: 0.25, emissive: 0xb45309, emissiveIntensity: 0.45 })
  );
  orb.position.set(-5.8, 1.6, -1.5);
  orb.castShadow = true;
  trackExclusive(orb);
  const glow = new THREE.PointLight(0xfbbf24, 1.2, 8);
  glow.position.set(-5.8, 1.8, -1.5);
  trackExclusive(glow);
}

function placeRainbowPad() {
  const colors = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7];
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7 + i * 0.18, 0.06, 8, 28), mat(colors[i], { roughness: 0.35 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(5.8, 0.12 + i * 0.02, -1.5);
    trackExclusive(ring);
  }
}

function placeCrownStatue() {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.35, 16), mat(0x78716c));
  base.position.set(-5.8, 0.2, 2.5);
  base.castShadow = true;
  trackExclusive(base);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.2, 12), mat(0xfbbf24, { metalness: 0.55, roughness: 0.3 }));
  band.position.set(-5.8, 0.7, 2.5);
  trackExclusive(band);
  for (let i = 0; i < 5; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), mat(i % 2 ? 0xfde68a : 0xf59e0b, { metalness: 0.4 }));
    const a = (i / 5) * Math.PI * 2;
    spike.position.set(-5.8 + Math.cos(a) * 0.28, 1.05, 2.5 + Math.sin(a) * 0.28);
    trackExclusive(spike);
  }
}

const exclusiveDefs = {
  orb: { id: "ex-orb", place: placeOrb },
  rainbow: { id: "ex-rainbow", place: placeRainbowPad },
  crown: { id: "ex-crown", place: placeCrownStatue },
};

function claimExclusive(key) {
  if (!isAdmin() || exclusiveOwned[key]) return;
  exclusiveOwned[key] = true;
  exclusiveDefs[key].place();
  syncAdminShop();
}

function syncAdminShop() {
  const admin = isAdmin();
  const shop = document.getElementById("admin-shop");
  const tag = document.getElementById("admin-tag");
  if (shop) shop.classList.toggle("show", admin);
  if (tag) tag.style.display = admin ? "block" : "none";
  if (!admin) return;
  Object.keys(exclusiveDefs).forEach((key) => {
    const btn = document.getElementById(exclusiveDefs[key].id);
    if (!btn) return;
    btn.disabled = !!exclusiveOwned[key];
    btn.classList.toggle("owned", !!exclusiveOwned[key]);
  });
}

let z = 8;
for (let i = 0; i < 8; i++) {
  addShape({
    x: i % 2 ? 0.5 : -0.5,
    y: i * 0.12,
    z,
    w: 3.6, h: 0.4, d: 3.4,
    color: 0x60a5fa,
    shape: i % 2 ? "cylinder" : "box",
  });
  z += 3.8;
}
addCheckpoint(0, 1.0, z, "Чек 1");
z += 6;

for (let i = 0; i < 9; i++) {
  addShape({
    x: (i % 3 - 1) * 0.7,
    y: 1.1 + i * 0.1,
    z,
    w: 3.2, h: 0.45, d: 3.2,
    color: i % 2 ? 0xa78bfa : 0xc4b5fd,
    shape: i % 2 ? "sphere" : "cylinder",
  });
  if (i === 3 || i === 7) {
    addLaser({ x: 0, y: 2.6 + i * 0.1, z, len: 3.5, axis: "x", mode: "blink", period: 3.0, phase: i, color: 0xff5588 });
  }
  z += 3.6;
}
addCheckpoint(0, 2.0, z, "Чек 2");
z += 6;

for (let i = 0; i < 7; i++) {
  addShape({ x: 0, y: 2.1, z, w: 2.2, h: 0.35, d: 5.5, color: 0x34d399, shape: "beam" });
  if (i % 3 === 1) {
    addLaser({ x: 0, y: 3.3, z, len: 4, axis: "x", mode: "sweep", speed: 0.4, amp: 0.8, phase: i, color: 0xff3355 });
  }
  z += 5.2;
}
addCheckpoint(0, 2.2, z, "Чек 3");
z += 6;

for (let i = 0; i < 8; i++) {
  if (i % 2 === 0) {
    addShape({ x: i % 4 < 2 ? -0.6 : 0.6, y: 2.3 + i * 0.12, z, w: 3.8, h: 0.35, d: 3.8, color: 0xf472b6, shape: "torus" });
  } else {
    addShape({ x: 0, y: 2.0 + i * 0.12, z, w: 2.8, h: 0.9, d: 2.8, color: 0xfb7185, shape: "cone" });
    addShape({ x: 0, y: 2.7 + i * 0.12, z, w: 2.6, h: 0.3, d: 2.6, color: 0xfda4af, shape: "cylinder" });
  }
  z += 4.0;
}
addCheckpoint(0, 3.2, z, "Чек 4");
z += 6;

for (let i = 0; i < 8; i++) {
  addShape({
    x: (i % 2 ? 1.0 : -1.0) * 0.5,
    y: 3.2 + i * 0.15,
    z,
    w: 3.0, h: 1.2, d: 3.0,
    color: 0x38bdf8,
    shape: i % 2 ? "diamond" : "box",
  });
  z += 3.7;
}
addCheckpoint(0, 4.2, z, "Чек 5");
z += 6;

const mix = ["box", "cylinder", "sphere", "torus", "beam", "diamond"];
for (let i = 0; i < 12; i++) {
  const sh = mix[i % mix.length];
  addShape({
    x: Math.sin(i * 0.7) * 0.8,
    y: 4.3 + i * 0.1,
    z,
    w: sh === "beam" ? 2.4 : 3.4,
    h: sh === "beam" ? 0.35 : 0.45,
    d: sh === "beam" ? 4.8 : 3.4,
    color: [0x818cf8, 0xa78bfa, 0x67e8f9, 0x86efac, 0xfcd34d, 0xf9a8d4][i % 6],
    shape: sh,
  });
  if (i === 5) {
    addLaser({ x: 0, y: 5.6, z, len: 3.2, axis: "x", mode: "blink", period: 3.2, phase: 0, color: 0xff6644 });
  }
  z += sh === "beam" ? 4.6 : 3.8;
}
addCheckpoint(0, 5.4, z, "Чек 6");
z += 6;

addShape({ x: 0, y: 5.4, z, w: 5, h: 0.4, d: 12, color: 0x7dd3fc, shape: "box" });
z += 8;
for (let i = 0; i < 6; i++) {
  addShape({
    x: (i % 2 ? 1.2 : -1.2) * 0.4,
    y: 5.5 + i * 0.08,
    z,
    w: 3.5, h: 0.4, d: 3.5,
    color: 0xc084fc,
    shape: "cylinder",
  });
  z += 3.5;
}

FINISH_Z = z + 2;
addShape({ x: 0, y: 6.0, z: FINISH_Z, w: 9, h: 0.55, d: 9, color: 0xfbbf24, shape: "cylinder" });
const finishRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.0, 0.14, 10, 40),
  mat(0xfde68a, { emissive: 0xfbbf24, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.35 })
);
finishRing.position.set(0, 8.0, FINISH_Z);
finishRing.rotation.x = Math.PI / 2;
scene.add(finishRing);

const player = makePlayer();

const safetyFloor = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 0.25, 3.2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
);
safetyFloor.visible = false;
scene.add(safetyFloor);

let vx = 0;
let vy = 0;
let vz = 0;
let onGround = false;
const GRAVITY = -26;
const JUMP = 12;
let moveSpeed = 9.5;

const admin = { god: false, fly: false, floor: false, speed: false };

function isSiteOwner() {
  try {
    if (window.__AMAL_OWNER__ || window.__AMAL_GOD__ || window.__AMAL_LEGEND__) return true;
    if (window.AmalPowers && AmalPowers.isOwner && AmalPowers.isOwner()) return true;
    if (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) return true;
  } catch (_) {}
  return false;
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1600);
}

function applyOwnerDefaults() {
  if (!isSiteOwner()) return;
  admin.god = true;
  admin.fly = true;
  admin.floor = true;
  admin.speed = true;
  moveSpeed = 13;
  toast("Админ Obby: полёт · ∞ · невидимый пол");
}

function handlePower(detail) {
  const type = detail && detail.type;
  if (!type) return;
  if (type === "god" || type === "owner-legend") {
    admin.god = true;
    toast("🛡 Бессмертие");
  }
  if (type === "obby-fly") {
    admin.fly = !admin.fly;
    toast(admin.fly ? "🕊 Полёт ВКЛ" : "Полёт ВЫКЛ");
  }
  if (type === "obby-floor") {
    admin.floor = !admin.floor;
    if (!admin.floor) safetyFloor.visible = false;
    toast(admin.floor ? "⬛ Невидимый пол ВКЛ" : "Невидимый пол ВЫКЛ");
  }
  if (type === "speed") {
    admin.speed = true;
    moveSpeed = 13;
    toast("⚡ Супер-бег");
  }
  if (type === "obby-cp") {
    activeCp = Math.min(activeCp + 1, checkpoints.length - 1);
    spawnAtCheckpoint();
    toast("Чек: " + checkpoints[activeCp].name);
  }
  if (type === "obby-finish") {
    player.position.set(0, 8, FINISH_Z);
    vx = vy = vz = 0;
    toast("🏁 Финиш");
  }
  if (type === "max") {
    admin.god = true;
    admin.fly = true;
    admin.floor = true;
    admin.speed = true;
    moveSpeed = 14;
    toast("⚡ ВСЁ НА МАКС");
  }
}

window.addEventListener("amal-power", (e) => handlePower(e.detail || {}));
window.addEventListener("amal-powers-applied", () => {
  applyOwnerDefaults();
  syncAdminShop();
});
window.addEventListener("amal-owner-changed", () => {
  applyOwnerDefaults();
  syncAdminShop();
});
setTimeout(applyOwnerDefaults, 400);
Object.keys(exclusiveDefs).forEach((key) => {
  const btn = document.getElementById(exclusiveDefs[key].id);
  if (btn) btn.addEventListener("click", () => claimExclusive(key));
});
syncAdminShop();
setTimeout(syncAdminShop, 200);
setTimeout(syncAdminShop, 1000);

const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

let mLeft = false;
let mRight = false;
let mFwd = false;
let mJump = false;
function bindHold(id, set) {
  const el = document.getElementById(id);
  if (!el) return;
  const on = (ev) => {
    ev.preventDefault();
    set(true);
  };
  const off = (ev) => {
    ev.preventDefault();
    set(false);
  };
  el.addEventListener("pointerdown", on);
  el.addEventListener("pointerup", off);
  el.addEventListener("pointerleave", off);
  el.addEventListener("pointercancel", off);
}
bindHold("m-left", (v) => (mLeft = v));
bindHold("m-right", (v) => (mRight = v));
bindHold("m-fwd", (v) => (mFwd = v));
const jumpBtn = document.getElementById("m-jump");
if (jumpBtn) {
  jumpBtn.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    mJump = true;
    setTimeout(() => (mJump = false), 120);
  });
}

function spawnAtCheckpoint() {
  const cp = checkpoints[activeCp];
  player.position.set(cp.x, cp.y, cp.z);
  vx = vy = vz = 0;
  finished = false;
  document.getElementById("win").classList.remove("show");
  updateHud();
}

function updateHud() {
  document.getElementById("cp").textContent = checkpoints[activeCp].name;
  document.getElementById("deaths").textContent = String(deaths);
  const startZ = checkpoints[0].z;
  const p = Math.max(0, Math.min(100, Math.round(((player.position.z - startZ) / (FINISH_Z - startZ)) * 100)));
  document.getElementById("prog").textContent = String(p);
}

function feetY() {
  return player.position.y;
}

function collidePlatforms() {
  onGround = false;
  const px = player.position.x;
  const pz = player.position.z;
  const py = feetY();
  let bestY = -Infinity;
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const ud = p.userData;
    const halfW = ud.w / 2;
    const halfD = ud.d / 2;
    const top = p.position.y + ud.h / 2;
    if (Math.abs(px - p.position.x) <= halfW && Math.abs(pz - p.position.z) <= halfD) {
      if (py >= top - 0.35 && py <= top + 0.55 && vy <= 0.5) {
        if (top > bestY) bestY = top;
      }
    }
  }
  if (bestY > -Infinity) {
    player.position.y = bestY;
    vy = 0;
    onGround = true;
  }
}

function hitLaser(t) {
  for (let i = 0; i < lasers.length; i++) {
    const L = lasers[i];
    let active = true;
    if (L.mode === "blink") {
      active = Math.sin(t * (Math.PI * 2) / L.period + L.phase) > 0;
      L.beam.visible = active;
      L.glow.visible = active;
    }
    if (L.mode === "sweep") {
      const off = Math.sin(t * L.speed + L.phase) * L.amp;
      if (L.axis === "x") L.beam.position.x = L.base.x + off;
      else L.beam.position.z = L.base.z + off;
      L.glow.position.copy(L.beam.position);
    }
    if (!active && L.mode === "blink") continue;
    const b = L.beam.position;
    const dx = player.position.x - b.x;
    const dy = player.position.y + 0.9 - b.y;
    const dz = player.position.z - b.z;
    const rad = L.axis === "x" ? L.len / 2 + 0.35 : 0.45;
    const along = L.axis === "x" ? Math.abs(dx) : Math.abs(dz);
    const across = L.axis === "x" ? Math.hypot(dy, dz) : Math.hypot(dy, dx);
    if (along < rad && across < 0.55) return true;
  }
  return false;
}

function die() {
  if (admin.god) return;
  deaths++;
  spawnAtCheckpoint();
  toast("Упс! Чекпоинт");
}

function win() {
  if (finished) return;
  finished = true;
  document.getElementById("win").classList.add("show");
}

document.getElementById("replay").addEventListener("click", () => {
  activeCp = 0;
  deaths = 0;
  spawnAtCheckpoint();
});

spawnAtCheckpoint();

let last = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  if (document.hidden) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  let ix = 0;
  let iz = 0;
  if (keys.KeyW || keys.ArrowUp || mFwd) iz -= 1;
  if (keys.KeyS || keys.ArrowDown) iz += 1;
  if (keys.KeyA || keys.ArrowLeft || mLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight || mRight) ix += 1;

  const yaw = orbit.yaw;
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const fx = -sy;
  const fz = -cy;
  const rx = cy;
  const rz = -sy;
  let wishX = 0;
  let wishZ = 0;
  if (ix || iz) {
    wishX = fx * -iz + rx * ix;
    wishZ = fz * -iz + rz * ix;
    const len = Math.hypot(wishX, wishZ) || 1;
    wishX /= len;
    wishZ /= len;
    player.rotation.y = Math.atan2(wishX, wishZ);
  }

  const spd = admin.speed ? moveSpeed : 9.5;
  vx = wishX * spd;
  vz = wishZ * spd;

  if (admin.fly) {
    vy = 0;
    if (keys.Space || mJump) vy = spd;
    if (keys.ShiftLeft || keys.ShiftRight) vy = -spd;
  } else {
    if (onGround && (keys.Space || mJump)) {
      vy = JUMP;
      onGround = false;
    }
    vy += GRAVITY * dt;
  }

  player.position.x += vx * dt;
  player.position.y += vy * dt;
  player.position.z += vz * dt;

  if (!admin.fly) collidePlatforms();
  else onGround = false;

  if (admin.floor) {
    safetyFloor.position.set(player.position.x, player.position.y - 0.05, player.position.z);
  }

  // Чекпоинты
  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i];
    if (i > activeCp && Math.hypot(player.position.x - cp.x, player.position.z - cp.z) < 2.2 && Math.abs(player.position.y - cp.y) < 2.5) {
      activeCp = i;
      toast("Чек: " + cp.name);
      updateHud();
    }
  }

  if (hitLaser(t) && !admin.god) die();
  if (player.position.y < -6) die();
  if (player.position.z >= FINISH_Z - 1.5 && player.position.y > 5) win();

  finishRing.rotation.z += dt * 1.2;
  exclusiveMeshes.forEach((o, i) => {
    if (o.isLight) return;
    if (o.rotation) o.rotation.y += 0.01 + (i % 3) * 0.002;
  });

  orbit.follow(player.position);
  app.sun.position.set(player.position.x + 40, 70, player.position.z + 20);
  updateHud();
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
