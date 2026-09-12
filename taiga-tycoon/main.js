/**
 * Тайга · Тайгун 3D v1 — low-poly тайга, лагерь, дерево прокачки.
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;

const SAVE_KEY = "amal-taiga-tycoon-v1";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7eb6d9);
scene.fog = new THREE.Fog(0xa8d4e8, 35, 95);

const camera = new THREE.PerspectiveCamera(58, innerWidth / Math.max(1, innerHeight), 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.1);
sun.position.set(30, 45, 20);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xb8e0f0, 0x3d6b45, 0.45));

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(55, 48),
  new THREE.MeshStandardMaterial({ color: 0x3f7a4a, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Снежные пятна
for (let i = 0; i < 18; i++) {
  const ang = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 40;
  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(1.2 + Math.random() * 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8f4fc, roughness: 1 })
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(Math.cos(ang) * r, 0.03, Math.sin(ang) * r);
  scene.add(patch);
}

function makePine(scale) {
  const g = new THREE.Group();
  const s = scale || 1;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * s, 0.28 * s, 1.4 * s, 6),
    new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 })
  );
  trunk.position.y = 0.7 * s;
  trunk.castShadow = true;
  g.add(trunk);
  const greens = [0x1b5e30, 0x166534, 0x14532d];
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry((1.3 - i * 0.25) * s, 1.5 * s, 7),
      new THREE.MeshStandardMaterial({ color: greens[i], roughness: 0.85 })
    );
    cone.position.y = (1.6 + i * 0.85) * s;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

function makeRock() {
  const g = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.5, 0),
    new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85, flatShading: true })
  );
  g.scale.set(1, 0.55 + Math.random() * 0.4, 1);
  g.castShadow = true;
  return g;
}

function makeBush() {
  const g = new THREE.Group();
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 })
  );
  leaf.position.y = 0.35;
  leaf.scale.set(1.2, 0.7, 1.1);
  g.add(leaf);
  const berry = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x4c1d95, emissiveIntensity: 0.3 })
  );
  berry.position.set(0.25, 0.45, 0.15);
  g.add(berry);
  return g;
}

function makeCampfire() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.4, 0.25, 10),
    new THREE.MeshStandardMaterial({ color: 0x44403c })
  );
  base.position.y = 0.12;
  g.add(base);
  for (let i = 0; i < 5; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x5c3d2e })
    );
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 5) * Math.PI;
    log.position.y = 0.28;
    g.add(log);
  }
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.9, 6),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.9 })
  );
  flame.position.y = 0.85;
  g.add(flame);
  return g;
}

function makeTent() {
  const g = new THREE.Group();
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(1.8, 2.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8, flatShading: true })
  );
  tent.position.y = 1.1;
  tent.rotation.y = Math.PI / 4;
  tent.castShadow = true;
  g.add(tent);
  return g;
}

// Лагерь в центре
const camp = new THREE.Group();
camp.add(makeCampfire());
const tent = makeTent();
tent.position.set(-3.5, 0, 1.5);
camp.add(tent);
const tent2 = makeTent();
tent2.position.set(3.2, 0, -1.2);
tent2.rotation.y = 0.6;
camp.add(tent2);
scene.add(camp);

const campRing = new THREE.Mesh(
  new THREE.RingGeometry(5.5, 6.2, 32),
  new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.35, side: THREE.DoubleSide })
);
campRing.rotation.x = -Math.PI / 2;
campRing.position.y = 0.04;
scene.add(campRing);

const resources = [];
function placeResource(kind, mesh, x, z, yieldAmt) {
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  resources.push({
    kind,
    mesh,
    x,
    z,
    yieldAmt,
    hp: kind === "tree" ? 3 : 2,
    maxHp: kind === "tree" ? 3 : 2,
    respawn: 0,
  });
}

// Тайга вокруг лагеря
for (let i = 0; i < 55; i++) {
  const ang = Math.random() * Math.PI * 2;
  const r = 9 + Math.random() * 38;
  const x = Math.cos(ang) * r;
  const z = Math.sin(ang) * r;
  if (Math.hypot(x, z) < 7) continue;
  const pine = makePine(0.85 + Math.random() * 0.7);
  placeResource("tree", pine, x, z, 4 + Math.floor(Math.random() * 4));
}
for (let i = 0; i < 22; i++) {
  const ang = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 35;
  const rock = makeRock();
  rock.position.set(Math.cos(ang) * r, 0.2, Math.sin(ang) * r);
  scene.add(rock);
}
for (let i = 0; i < 18; i++) {
  const ang = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 30;
  const x = Math.cos(ang) * r;
  const z = Math.sin(ang) * r;
  if (Math.hypot(x, z) < 6.5) continue;
  placeResource("bush", makeBush(), x, z, 2 + Math.floor(Math.random() * 3));
}

function makePlayer() {
  const g = new THREE.Group();
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.6, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x166534 })
  );
  torso.position.y = 1.05;
  torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffc9a3 })
  );
  head.position.y = 1.55;
  g.add(head);
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b })
  );
  hat.position.y = 1.72;
  g.add(hat);
  [-0.12, 0.12].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    leg.position.set(x, 0.4, 0);
    g.add(leg);
  });
  return g;
}

const player = makePlayer();
player.position.set(0, 0, 3);
scene.add(player);
const vel = new THREE.Vector3();
let onGround = true;

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 12,
  pitch: 0.5,
  yaw: 0.3,
  lookOffsetY: 1.2,
  minDist: 5,
  maxDist: 24,
  lerp: 0.18,
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let wood = 0;
let berry = 0;
let speedLv = 0;
let gatherLv = 0;
let campLv = 0;
let toastT = 0;
let incomeAcc = 0;

const UPGRADES = [
  { id: "speed", name: "🥾 Скорость", desc: "бегать быстрее", max: 8, cost: (lv) => 12 + lv * 14 },
  { id: "gather", name: "🪓 Сбор", desc: "больше с дерева/куста", max: 8, cost: (lv) => 15 + lv * 16 },
  { id: "camp", name: "🏕️ Лагерь", desc: "пассивный доход 🪵", max: 10, cost: (lv) => 20 + lv * 22 },
];

const woodEl = document.getElementById("wood");
const berryEl = document.getElementById("berry");
const speedEl = document.getElementById("speed");
const gatherEl = document.getElementById("gather");
const campEl = document.getElementById("camp");
const upList = document.getElementById("upList");
const promptEl = document.getElementById("prompt");
const toastEl = document.getElementById("toast");

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  toastT = 2.1;
}

function speedMul() {
  return 1 + speedLv * 0.22;
}
function gatherMul() {
  return 1 + gatherLv * 0.35;
}
function campIncome() {
  return campLv * 2;
}

function syncUI() {
  woodEl.textContent = Math.floor(wood);
  berryEl.textContent = Math.floor(berry);
  speedEl.textContent = speedMul().toFixed(1);
  gatherEl.textContent = gatherMul().toFixed(1);
  campEl.textContent = campIncome();
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ wood, berry, speedLv, gatherLv, campLv }));
  } catch (_) {}
}

function loadGame() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!d) return;
    if (d.wood != null) wood = d.wood;
    if (d.berry != null) berry = d.berry;
    if (d.speedLv != null) speedLv = d.speedLv;
    if (d.gatherLv != null) gatherLv = d.gatherLv;
    if (d.campLv != null) campLv = d.campLv;
  } catch (_) {}
}

function getLv(id) {
  if (id === "speed") return speedLv;
  if (id === "gather") return gatherLv;
  return campLv;
}
function setLv(id, v) {
  if (id === "speed") speedLv = v;
  else if (id === "gather") gatherLv = v;
  else campLv = v;
}

function buyUpgrade(id) {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return;
  const lv = getLv(id);
  if (lv >= def.max) return toast("Уже максимум");
  const cost = def.cost(lv);
  if (wood < cost) return toast("Нужно 🪵 " + cost);
  wood -= cost;
  setLv(id, lv + 1);
  toast(def.name + " → ур." + (lv + 1));
  renderTree();
  syncUI();
  saveGame();
}

function renderTree() {
  upList.innerHTML = UPGRADES.map((u) => {
    const lv = getLv(u.id);
    const done = lv >= u.max;
    const cost = done ? "макс" : "🪵" + u.cost(lv);
    return (
      '<button type="button" class="up" data-id="' +
      u.id +
      '"><span>' +
      u.name +
      " · ур." +
      lv +
      "/" +
      u.max +
      "<br><span style='opacity:.75;font-size:11px'>" +
      u.desc +
      "</span></span><span class=\"cost\">" +
      cost +
      "</span></button>"
    );
  }).join("");
  upList.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => buyUpgrade(btn.getAttribute("data-id"));
  });
}

function nearestResource() {
  const px = player.position.x;
  const pz = player.position.z;
  let best = null;
  let bestD = 2.4;
  resources.forEach((r) => {
    if (r.respawn > 0 || !r.mesh.visible) return;
    const d = Math.hypot(px - r.x, pz - r.z);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  });
  return best;
}

function gather() {
  const r = nearestResource();
  if (!r) return;
  r.hp -= 1;
  const got = Math.max(1, Math.round(r.yieldAmt * gatherMul() * (0.4 + Math.random() * 0.3)));
  if (r.kind === "tree") {
    wood += got;
    toast("🪵 +" + got);
  } else {
    berry += got;
    wood += Math.floor(got * 0.5);
    toast("🫐 +" + got);
  }
  if (r.hp <= 0) {
    r.mesh.visible = false;
    r.respawn = 12 + Math.random() * 10;
    r.hp = r.maxHp;
  } else {
    r.mesh.scale.setScalar(0.85 + (r.hp / r.maxHp) * 0.15);
  }
  syncUI();
  saveGame();
}

function updatePrompt() {
  const r = nearestResource();
  let t = "";
  if (r) t = r.kind === "tree" ? "E — рубить ёлку (" + r.hp + " удара)" : "E — собрать ягоды (" + r.hp + ")";
  else if (Math.hypot(player.position.x, player.position.z) < 6.5) t = "🏕️ Лагерь · качай дерево справа";
  promptEl.style.display = t ? "block" : "none";
  promptEl.textContent = t;
}

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyE") {
    e.preventDefault();
    gather();
  }
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
document.getElementById("btn-e").onclick = () => gather();

const pad = document.getElementById("pad");
const knob = document.getElementById("pad-knob");
const stick = { x: 0, y: 0, active: false };
function setStick(cx, cy) {
  const rect = pad.getBoundingClientRect();
  let dx = (cx - (rect.left + rect.width / 2)) / (rect.width / 2);
  let dy = (cy - (rect.top + rect.height / 2)) / (rect.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  if (len > 1) {
    dx /= len;
    dy /= len;
  }
  stick.x = dx;
  stick.y = dy;
  knob.style.transform = "translate(" + dx * 26 + "px," + dy * 26 + "px)";
}
pad.addEventListener("pointerdown", (e) => {
  stick.active = true;
  pad.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY);
});
pad.addEventListener("pointermove", (e) => {
  if (stick.active) setStick(e.clientX, e.clientY);
});
pad.addEventListener("pointerup", () => {
  stick.active = false;
  stick.x = 0;
  stick.y = 0;
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
  return { x, z, jump: !!keys.Space };
}

loadGame();
renderTree();
syncUI();
toast("Добро пожаловать в тайгу! Руби ёлки (E), качай дерево справа");

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const input = getInput();
  const baseSpeed = 7.5 * speedMul();
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
    vel.x = wish.x * baseSpeed;
    vel.z = wish.z * baseSpeed;
    player.rotation.y = Math.atan2(wish.x, wish.z);
  } else {
    vel.x *= 0.8;
    vel.z *= 0.8;
  }
  if (input.jump && onGround) {
    vel.y = 7;
    onGround = false;
  }
  vel.y -= 22 * dt;
  player.position.x += vel.x * dt;
  player.position.y += vel.y * dt;
  player.position.z += vel.z * dt;
  if (player.position.y <= 0) {
    player.position.y = 0;
    vel.y = 0;
    onGround = true;
  }
  const lim = 52;
  player.position.x = Math.max(-lim, Math.min(lim, player.position.x));
  player.position.z = Math.max(-lim, Math.min(lim, player.position.z));

  resources.forEach((r) => {
    if (r.respawn > 0) {
      r.respawn -= dt;
      if (r.respawn <= 0) {
        r.mesh.visible = true;
        r.mesh.scale.setScalar(1);
        r.hp = r.maxHp;
      }
    }
  });

  incomeAcc += dt;
  if (incomeAcc >= 1) {
    incomeAcc = 0;
    const inc = campIncome();
    if (inc > 0) {
      wood += inc;
      syncUI();
      saveGame();
    }
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
