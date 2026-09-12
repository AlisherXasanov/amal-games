/**
 * Stud Park · Тайкун v1 — стиль Roblox-стаддов (как бесплатные паки с itch), без чужих файлов.
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;
const SAVE_KEY = "amal-stud-park-v1";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x60a5fa);
scene.fog = new THREE.Fog(0x93c5fd, 40, 100);

const camera = new THREE.PerspectiveCamera(55, innerWidth / Math.max(1, innerHeight), 0.1, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(20, 40, 15);
sun.castShadow = true;
scene.add(sun);

function studMat(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, flatShading: true });
}

function makeStudPlate(w, d, color) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), studMat(color));
  base.position.y = 0.2;
  base.receiveShadow = true;
  base.castShadow = true;
  g.add(base);
  const cols = Math.max(2, Math.floor(w));
  const rows = Math.max(2, Math.floor(d));
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const stud = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.16, 8),
        studMat(color)
      );
      stud.position.set(-w / 2 + 0.5 + ix * (w / cols), 0.48, -d / 2 + 0.5 + iz * (d / rows));
      g.add(stud);
    }
  }
  return g;
}

function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), studMat(0xa16207));
  trunk.position.y = 0.8;
  g.add(trunk);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), studMat(0x16a34a));
  leaf.position.y = 2;
  g.add(leaf);
  return g;
}

function makeCoin() {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.45, flatShading: true })
  );
  m.rotation.x = Math.PI / 2;
  return m;
}

function makePlayer() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.5), studMat(0x3b82f6));
  body.position.y = 1.15;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), studMat(0xffdbac));
  head.position.y = 1.95;
  g.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.4), studMat(0x1e3a8a));
  legL.position.set(-0.22, 0.35, 0);
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.22;
  g.add(legR);
  return g;
}

// Базовая платформа-парк
const base = makeStudPlate(22, 22, 0x4ade80);
scene.add(base);

const path = makeStudPlate(6, 40, 0xf8fafc);
path.position.set(0, 0.02, 20);
scene.add(path);

for (let i = 0; i < 10; i++) {
  const t = makeTree();
  const a = (i / 10) * Math.PI * 2;
  t.position.set(Math.cos(a) * 14, 0, Math.sin(a) * 14);
  scene.add(t);
}

const pads = [];
const PAD_DEFS = [
  { name: "Синий плот", color: 0x3b82f6, cost: 25, rate: 2, w: 4, d: 4 },
  { name: "Розовый плот", color: 0xec4899, cost: 80, rate: 6, w: 5, d: 5 },
  { name: "Золотой плот", color: 0xfbbf24, cost: 200, rate: 15, w: 5.5, d: 5.5 },
  { name: "Фиолет плот", color: 0xa855f7, cost: 450, rate: 35, w: 6, d: 6 },
  { name: "Красный плот", color: 0xef4444, cost: 900, rate: 70, w: 6.5, d: 6.5 },
];

const coins3d = [];
function spawnCoin(x, z) {
  const m = makeCoin();
  m.position.set(x, 1.2, z);
  scene.add(m);
  coins3d.push({ mesh: m, x, z, life: 18 + Math.random() * 10 });
}

for (let i = 0; i < 12; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 4 + Math.random() * 12;
  spawnCoin(Math.cos(a) * r, Math.sin(a) * r);
}

const player = makePlayer();
player.position.set(0, 0, 2);
scene.add(player);
const vel = new THREE.Vector3();

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 14,
  pitch: 0.55,
  yaw: 0.2,
  lookOffsetY: 1.3,
  minDist: 6,
  maxDist: 28,
  lerp: 0.2,
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let coins = 40;
let speedLv = 0;
let toastT = 0;
let incomeAcc = 0;
let nextPadSlot = 0;
const padSlots = [
  { x: -12, z: 8 },
  { x: 12, z: 8 },
  { x: -12, z: -8 },
  { x: 12, z: -8 },
  { x: 0, z: -14 },
  { x: -16, z: 0 },
  { x: 16, z: 0 },
];

const coinsEl = document.getElementById("coins");
const incomeEl = document.getElementById("income");
const spdEl = document.getElementById("spd");
const shopList = document.getElementById("shopList");
const promptEl = document.getElementById("prompt");
const toastEl = document.getElementById("toast");

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  toastT = 2;
}
function incomeRate() {
  return pads.reduce((s, p) => s + p.rate, 0);
}
function syncUI() {
  coinsEl.textContent = Math.floor(coins);
  incomeEl.textContent = incomeRate();
  spdEl.textContent = (1 + speedLv * 0.25).toFixed(1);
}
function save() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        coins,
        speedLv,
        pads: pads.map((p) => p.defIndex),
      })
    );
  } catch (_) {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!d) return;
    if (d.coins != null) coins = d.coins;
    if (d.speedLv != null) speedLv = d.speedLv;
    if (Array.isArray(d.pads)) {
      d.pads.forEach((idx) => placePad(idx, true));
    }
  } catch (_) {}
}

function placePad(defIndex, silent) {
  if (nextPadSlot >= padSlots.length) {
    if (!silent) toast("Нет места для плота");
    return false;
  }
  const def = PAD_DEFS[defIndex];
  if (!def) return false;
  const slot = padSlots[nextPadSlot++];
  const mesh = makeStudPlate(def.w, def.d, def.color);
  mesh.position.set(slot.x, 0.05, slot.z);
  scene.add(mesh);
  pads.push({ mesh, rate: def.rate, defIndex, x: slot.x, z: slot.z });
  if (!silent) toast("🧱 " + def.name + " · +" + def.rate + "/с");
  return true;
}

function buyPad(i) {
  const def = PAD_DEFS[i];
  if (nextPadSlot >= padSlots.length) return toast("Парк полный");
  if (coins < def.cost) return toast("Нужно 🪙 " + def.cost);
  coins -= def.cost;
  placePad(i, false);
  syncUI();
  save();
  renderShop();
}

function buySpeed() {
  const cost = 30 + speedLv * 40;
  if (coins < cost) return toast("Нужно 🪙 " + cost);
  coins -= cost;
  speedLv += 1;
  toast("⚡ Скорость ур." + speedLv);
  syncUI();
  save();
  renderShop();
}

function renderShop() {
  let html = PAD_DEFS.map(
    (d, i) =>
      '<button type="button" data-pad="' +
      i +
      '"><span>🧱 ' +
      d.name +
      " · +" +
      d.rate +
      '/с</span><span class="c">🪙' +
      d.cost +
      "</span></button>"
  ).join("");
  html +=
    '<button type="button" data-spd="1"><span>⚡ Скорость ур.' +
    (speedLv + 1) +
    '</span><span class="c">🪙' +
    (30 + speedLv * 40) +
    "</span></button>";
  shopList.innerHTML = html;
  shopList.querySelectorAll("[data-pad]").forEach((b) => {
    b.onclick = () => buyPad(+b.getAttribute("data-pad"));
  });
  shopList.querySelectorAll("[data-spd]").forEach((b) => {
    b.onclick = () => buySpeed();
  });
}

function nearestCoin() {
  const px = player.position.x;
  const pz = player.position.z;
  let best = null;
  let bestD = 2;
  coins3d.forEach((c) => {
    const d = Math.hypot(px - c.x, pz - c.z);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  });
  return best;
}

function doAction() {
  const c = nearestCoin();
  if (!c) return;
  coins += 5 + Math.floor(Math.random() * 6);
  scene.remove(c.mesh);
  const i = coins3d.indexOf(c);
  if (i >= 0) coins3d.splice(i, 1);
  toast("🪙 Монета!");
  syncUI();
  save();
  // новый спавн
  const a = Math.random() * Math.PI * 2;
  const r = 3 + Math.random() * 16;
  spawnCoin(Math.cos(a) * r, Math.sin(a) * r);
}

function updatePrompt() {
  const t = nearestCoin() ? "E — подобрать монету" : pads.length ? "Покупай плоты справа → доход" : "Собери монеты · купи первый плот";
  promptEl.style.display = "block";
  promptEl.textContent = t;
}

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyE") {
    e.preventDefault();
    doAction();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
document.getElementById("btn-e").onclick = () => doAction();

const padEl = document.getElementById("pad");
const knob = document.getElementById("pad-knob");
const stick = { x: 0, y: 0, active: false };
function setStick(cx, cy) {
  const r = padEl.getBoundingClientRect();
  let dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
  let dy = (cy - (r.top + r.height / 2)) / (r.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  if (len > 1) {
    dx /= len;
    dy /= len;
  }
  stick.x = dx;
  stick.y = dy;
  knob.style.transform = "translate(" + dx * 26 + "px," + dy * 26 + "px)";
}
padEl.addEventListener("pointerdown", (e) => {
  stick.active = true;
  padEl.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY);
});
padEl.addEventListener("pointermove", (e) => {
  if (stick.active) setStick(e.clientX, e.clientY);
});
padEl.addEventListener("pointerup", () => {
  stick.active = false;
  stick.x = stick.y = 0;
  knob.style.transform = "translate(0,0)";
});

function getInput() {
  let x = 0;
  let z = 0;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) z -= 1;
  if (keys.KeyS || keys.ArrowDown) z += 1;
  if (stick.active) {
    x += stick.x;
    z += stick.y;
  }
  const len = Math.hypot(x, z);
  if (len > 1) {
    x /= len;
    z /= len;
  }
  return { x, z };
}

load();
renderShop();
syncUI();
toast("Stud Park! Собирай монеты, строй цветные плоты 🧱");

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const input = getInput();
  const spd = 8 * (1 + speedLv * 0.25);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const wish = new THREE.Vector3();
  wish.addScaledVector(right, input.x);
  wish.addScaledVector(forward, -input.z);
  if (wish.lengthSq() > 0.0001) {
    wish.normalize();
    vel.x = wish.x * spd;
    vel.z = wish.z * spd;
    player.rotation.y = Math.atan2(wish.x, wish.z);
  } else {
    vel.x *= 0.8;
    vel.z *= 0.8;
  }
  player.position.x += vel.x * dt;
  player.position.z += vel.z * dt;
  player.position.x = Math.max(-28, Math.min(28, player.position.x));
  player.position.z = Math.max(-18, Math.min(42, player.position.z));

  coins3d.forEach((c) => {
    c.mesh.rotation.z += dt * 2;
    c.mesh.position.y = 1.2 + Math.sin(now * 0.005 + c.x) * 0.2;
    c.life -= dt;
  });
  for (let i = coins3d.length - 1; i >= 0; i--) {
    if (coins3d[i].life <= 0) {
      scene.remove(coins3d[i].mesh);
      coins3d.splice(i, 1);
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 16;
      spawnCoin(Math.cos(a) * r, Math.sin(a) * r);
    }
  }

  // автоподбор
  const near = nearestCoin();
  if (near && Math.hypot(player.position.x - near.x, player.position.z - near.z) < 1.2) doAction();

  incomeAcc += dt;
  if (incomeAcc >= 1) {
    incomeAcc = 0;
    coins += incomeRate();
    syncUI();
    save();
  }

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }

  orbit.follow(player.position);
  updatePrompt();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
