/**
 * Steal a Brainrot v4 — нормальная 3D-игра: база, магазин, охрана, респавн.
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;

const SHOP = [
  { id: "tung", name: "Тунг-Тунг", price: 40, rate: 2, color: 0xf472b6, shape: "box" },
  { id: "bomba", name: "Бомбардино", price: 90, rate: 5, color: 0xfbbf24, shape: "sphere" },
  { id: "capi", name: "Капибара-бум", price: 160, rate: 9, color: 0x34d399, shape: "cone" },
  { id: "skib", name: "Скибиди-кекс", price: 280, rate: 15, color: 0x60a5fa, shape: "torus" },
  { id: "meow", name: "Мяу Делюкс", price: 420, rate: 24, color: 0xa78bfa, shape: "octa" },
  { id: "tral", name: "Тралалело", price: 650, rate: 40, color: 0xf43f5e, shape: "sphere" },
  { id: "brr", name: "Брр Патапим", price: 1000, rate: 65, color: 0x2dd4bf, shape: "octa" },
  { id: "liri", name: "Лирили", price: 1600, rate: 110, color: 0xe879f9, shape: "cone" },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0b2e);
scene.fog = new THREE.Fog(0x1a0b2e, 45, 95);

const camera = new THREE.PerspectiveCamera(62, innerWidth / Math.max(1, innerHeight), 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe9d5ff, 0x3b0764, 0.85));
const sun = new THREE.DirectionalLight(0xffe4e6, 1.15);
sun.position.set(18, 32, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.28));
const neon = new THREE.PointLight(0xa855f7, 0.7, 50);
neon.position.set(0, 10, 0);
scene.add(neon);

const MAP = 72;
const half = MAP / 2 - 1.2;
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(MAP, MAP),
  new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.95 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

for (let ix = -4; ix <= 4; ix++) {
  for (let iz = -4; iz <= 4; iz++) {
    if ((ix + iz) % 2) continue;
    const tile = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 6.8),
      new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.9 })
    );
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(ix * 7.5, 0.02, iz * 7.5);
    tile.receiveShadow = true;
    scene.add(tile);
  }
}

function wall(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 })
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
wall(MAP, 3.5, 1, 0x5b21b6, 0, 1.75, -half);
wall(MAP, 3.5, 1, 0x5b21b6, 0, 1.75, half);
wall(1, 3.5, MAP, 0x5b21b6, -half, 1.75, 0);
wall(1, 3.5, MAP, 0x5b21b6, half, 1.75, 0);

function makeShape(def, scale) {
  let geo;
  if (def.shape === "sphere") geo = new THREE.SphereGeometry(0.42, 16, 14);
  else if (def.shape === "cone") geo = new THREE.ConeGeometry(0.42, 0.85, 12);
  else if (def.shape === "torus") geo = new THREE.TorusGeometry(0.32, 0.14, 10, 18);
  else if (def.shape === "octa") geo = new THREE.OctahedronGeometry(0.48);
  else geo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.color,
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.25,
    })
  );
  m.castShadow = true;
  if (scale) m.scale.setScalar(scale);
  return m;
}

function makeHumanoid(shirt, pants, helm) {
  const g = new THREE.Group();
  const skin = 0xffc9a3;
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.6, 0.3),
    new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.5 })
  );
  torso.position.y = 1.05;
  torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 14, 12),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 0.65 })
  );
  head.position.y = 1.55;
  head.castShadow = true;
  g.add(head);
  if (helm != null) {
    const h = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: helm, roughness: 0.4, metalness: 0.3 })
    );
    h.position.y = 1.62;
    g.add(h);
  }
  [-0.32, 0.32].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: skin })
    );
    arm.position.set(x, 1.1, 0);
    arm.castShadow = true;
    g.add(arm);
  });
  [-0.12, 0.12].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: pants })
    );
    leg.position.set(x, 0.4, 0);
    leg.castShadow = true;
    g.add(leg);
  });
  return g;
}

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 12,
  pitch: 0.45,
  yaw: Math.PI * 0.15,
  lookOffsetY: 1.2,
  minDist: 5,
  maxDist: 28,
  lerp: 0.2,
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// —— База игрока ——
const BASE = { x: -20, z: 20, r: 6.2 };
const basePad = new THREE.Mesh(
  new THREE.CylinderGeometry(BASE.r, BASE.r + 0.25, 0.4, 40),
  new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x14532d, emissiveIntensity: 0.45, roughness: 0.55 })
);
basePad.position.set(BASE.x, 0.2, BASE.z);
basePad.receiveShadow = true;
scene.add(basePad);
const baseRing = new THREE.Mesh(
  new THREE.TorusGeometry(BASE.r + 0.1, 0.14, 10, 48),
  new THREE.MeshStandardMaterial({ color: 0x86efac, emissive: 0x22c55e, emissiveIntensity: 0.5 })
);
baseRing.rotation.x = Math.PI / 2;
baseRing.position.set(BASE.x, 0.42, BASE.z);
scene.add(baseRing);
wall(2.4, 1.1, 0.15, 0x4ade80, BASE.x + 4.2, 2.8, BASE.z + 3.8);
wall(0.2, 2.8, 0.2, 0x86efac, BASE.x + 4.2, 1.4, BASE.z + 3.8);

const SLOT_COUNT = 4;
const mySlots = [];
for (let i = 0; i < SLOT_COUNT; i++) {
  const ang = (i / SLOT_COUNT) * Math.PI * 2 - Math.PI / 2;
  const sx = BASE.x + Math.cos(ang) * 3.0;
  const sz = BASE.z + Math.sin(ang) * 3.0;
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.65, 0.85, 14),
    new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 })
  );
  ped.position.set(sx, 0.42, sz);
  ped.castShadow = true;
  scene.add(ped);
  mySlots.push({ x: sx, z: sz, ped, brainrot: null, mesh: null });
}

const otherBases = [
  { x: 18, z: -16, color: 0xef4444, label: "Сосед" },
  { x: 20, z: 16, color: 0x3b82f6, label: "Рик" },
  { x: -16, z: -18, color: 0xf59e0b, label: "Катя" },
  { x: 2, z: 22, color: 0xec4899, label: "Богдан" },
];
const worldPedestals = [];
let nextUid = 1;

otherBases.forEach((ob, bi) => {
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(4.0, 4.2, 0.32, 32),
    new THREE.MeshStandardMaterial({ color: ob.color, emissive: ob.color, emissiveIntensity: 0.2, roughness: 0.6 })
  );
  pad.position.set(ob.x, 0.16, ob.z);
  pad.receiveShadow = true;
  scene.add(pad);
  wall(1.7, 0.75, 0.12, ob.color, ob.x + 2.8, 2.6, ob.z + 2.2);
  wall(0.16, 2.5, 0.16, 0xf8fafc, ob.x + 2.8, 1.25, ob.z + 2.2);

  for (let s = 0; s < 2; s++) {
    const def = SHOP[(bi * 2 + s + 1) % SHOP.length];
    const ox = ob.x + (s === 0 ? -1.35 : 1.35);
    const oz = ob.z;
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.6, 0.95, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    ped.position.set(ox, 0.48, oz);
    ped.castShadow = true;
    scene.add(ped);
    const item = makeShape(def);
    item.position.set(ox, 1.3, oz);
    scene.add(item);
    worldPedestals.push({
      uid: nextUid++,
      def: Object.assign({}, def),
      ped, item, x: ox, z: oz, base: ob,
      taken: false, respawn: 0,
    });
  }
});

[[0, 0], [8, -6], [-7, 7], [12, 5], [-10, -5]].forEach((spot, i) => {
  const def = SHOP[i % SHOP.length];
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.65, 0.95, 12),
    new THREE.MeshStandardMaterial({ color: 0x78716c })
  );
  ped.position.set(spot[0], 0.48, spot[1]);
  ped.castShadow = true;
  scene.add(ped);
  const item = makeShape(def);
  item.position.set(spot[0], 1.3, spot[1]);
  scene.add(item);
  worldPedestals.push({
    uid: nextUid++,
    def: Object.assign({}, def),
    ped, item, x: spot[0], z: spot[1], base: null,
    taken: false, respawn: 0,
  });
});

[[-8, 10], [14, -12], [6, 16]].forEach(([x, z]) => {
  wall(1.8, 1.1, 1.4, 0x78350f, x, 0.55, z);
});

// Игрок
const playerMesh = makeHumanoid(0x7c3aed, 0x1e1b4b, 0xfbbf24);
playerMesh.position.set(BASE.x, 0, BASE.z - 3.5);
scene.add(playerMesh);
const vel = new THREE.Vector3();
let onGround = true;
let facing = 0;

const guards = [];
[[12, -8], [6, 12], [16, 6], [-4, -8], [0, -14]].forEach(([x, z], i) => {
  const mesh = makeHumanoid(i % 2 ? 0xf87171 : 0xfb7185, 0x1e1b4b, 0x7f1d1d);
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  guards.push({ mesh, home: new THREE.Vector3(x, 0, z), stun: 0 });
});

let yen = 200;
let carry = null;
let carryMesh = null;
let carryFromUid = 0;
let toastT = 0;
let alarmT = 0;
let stun = 0;
let tut = { bought: false, placed: false, stole: false };
let yenAcc = 0;

const yenEl = document.getElementById("yen");
const incomeEl = document.getElementById("income");
const carryEl = document.getElementById("carry");
const statusEl = document.getElementById("status");
const promptEl = document.getElementById("prompt");
const alarmEl = document.getElementById("alarm");
const slotList = document.getElementById("slotList");
const shopList = document.getElementById("shopList");

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.display = "block";
  toastT = 2;
}

function incomeRate() {
  return mySlots.reduce((s, sl) => s + (sl.brainrot ? sl.brainrot.rate : 0), 0);
}

function syncTut() {
  document.getElementById("t1").classList.toggle("done", tut.bought);
  document.getElementById("t2").classList.toggle("done", tut.placed);
  document.getElementById("t3").classList.toggle("done", tut.stole);
}

function syncUI() {
  yenEl.textContent = String(Math.floor(yen));
  incomeEl.textContent = String(incomeRate());
  carryEl.textContent = carry ? carry.name : "пусто";
  slotList.innerHTML = mySlots
    .map((sl, i) => {
      if (!sl.brainrot) return '<div class="slot">Слот ' + (i + 1) + ": пусто</div>";
      return (
        '<div class="slot">Слот ' + (i + 1) + ": " + sl.brainrot.name +
        " · +" + sl.brainrot.rate + "¥/с</div>"
      );
    })
    .join("");
  syncTut();
}

function renderShop() {
  shopList.innerHTML = SHOP.map((item, i) => {
    return (
      '<button type="button" class="item" data-i="' + i + '"><span>' +
      item.name + " · +" + item.rate + '¥/с</span><span class="price">¥' +
      item.price + "</span></button>"
    );
  }).join("");
  shopList.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => buyShop(+btn.getAttribute("data-i"));
  });
}

function buyShop(i) {
  const def = SHOP[i];
  if (carry) { toast("Сначала поставь то, что в руках!"); return; }
  if (yen < def.price) { toast("Мало йен · нужно ¥" + def.price); return; }
  yen -= def.price;
  carry = Object.assign({}, def, { fromShop: true, stolen: false });
  carryFromUid = 0;
  if (carryMesh) scene.remove(carryMesh);
  carryMesh = makeShape(def, 0.8);
  scene.add(carryMesh);
  tut.bought = true;
  statusEl.textContent = "Неси на ЗЕЛЁНУЮ базу → E";
  toast("Куплено: " + def.name);
  syncUI();
}

function freeSlot() {
  return mySlots.find((s) => !s.brainrot);
}

function placeOnBase() {
  const slot = freeSlot();
  if (!slot) { toast("База полна (4 слота)!"); return false; }
  slot.brainrot = Object.assign({}, carry);
  slot.mesh = makeShape(carry);
  slot.mesh.position.set(slot.x, 1.25, slot.z);
  scene.add(slot.mesh);
  if (carryMesh) { scene.remove(carryMesh); carryMesh = null; }
  if (carry.stolen) {
    tut.stole = true;
    const ped = worldPedestals.find((p) => p.uid === carryFromUid);
    if (ped) ped.respawn = 12;
  }
  tut.placed = true;
  toast("Поставлено! +" + carry.rate + " ¥/сек");
  carry = null;
  carryFromUid = 0;
  statusEl.textContent = "Доход идёт · воруй чужие!";
  alarmT = 0;
  alarmEl.style.display = "none";
  syncUI();
  return true;
}

function dropCarry(msg, loseYen) {
  if (!carry) return;
  if (carryMesh) { scene.remove(carryMesh); carryMesh = null; }
  if (carry.stolen && carryFromUid) {
    const ped = worldPedestals.find((p) => p.uid === carryFromUid);
    if (ped) {
      ped.taken = false;
      ped.item.visible = true;
      ped.respawn = 0;
    }
  }
  carry = null;
  carryFromUid = 0;
  if (loseYen > 0) yen = Math.max(0, yen - loseYen);
  syncUI();
  if (msg) toast(msg);
}

function nearestAction() {
  const px = playerMesh.position.x;
  const pz = playerMesh.position.z;
  const onBase = Math.hypot(px - BASE.x, pz - BASE.z) < BASE.r + 0.6;
  if (carry && onBase) return { type: "place", label: "E — поставить на базу" };
  if (!carry) {
    for (const p of worldPedestals) {
      if (p.taken || p.respawn > 0) continue;
      if (Math.hypot(px - p.x, pz - p.z) < 1.9) {
        return { type: "steal", ped: p, label: "E — украсть «" + p.def.name + "»" };
      }
    }
  }
  return null;
}

function doAction() {
  if (stun > 0) return;
  const act = nearestAction();
  if (!act) return;
  if (act.type === "place") { placeOnBase(); return; }
  if (act.type === "steal") {
    const p = act.ped;
    p.taken = true;
    p.item.visible = false;
    carry = Object.assign({}, p.def, { fromShop: false, stolen: true });
    carryFromUid = p.uid;
    carryMesh = makeShape(p.def, 0.8);
    scene.add(carryMesh);
    alarmT = 5;
    alarmEl.style.display = "block";
    statusEl.textContent = "ТРЕВОГА! Беги на зелёную базу!";
    toast("Украл: " + p.def.name);
    syncUI();
  }
}

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyE") { e.preventDefault(); doAction(); }
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

const pad = document.getElementById("pad");
const knob = document.getElementById("pad-knob");
const stick = { x: 0, y: 0, active: false };
function setStick(cx, cy) {
  const r = pad.getBoundingClientRect();
  let dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
  let dy = (cy - (r.top + r.height / 2)) / (r.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  if (len > 1) { dx /= len; dy /= len; }
  stick.x = dx; stick.y = dy;
  knob.style.transform = "translate(" + dx * 26 + "px," + dy * 26 + "px)";
}
pad.addEventListener("pointerdown", (e) => {
  stick.active = true;
  pad.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY);
});
pad.addEventListener("pointermove", (e) => { if (stick.active) setStick(e.clientX, e.clientY); });
pad.addEventListener("pointerup", () => {
  stick.active = false; stick.x = 0; stick.y = 0;
  knob.style.transform = "translate(0,0)";
});
document.getElementById("btn-e").onclick = () => doAction();
document.getElementById("btn-jump").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  keys.Space = true;
});
document.getElementById("btn-jump").addEventListener("pointerup", () => { keys.Space = false; });

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

const bounds = { minX: -half + 1.2, maxX: half - 1.2, minZ: -half + 1.2, maxZ: half - 1.2 };

renderShop();
syncUI();
toast("Купи · поставь · воруй");

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) document.getElementById("toast").style.display = "none";
  }
  if (alarmT > 0) {
    alarmT -= dt;
    alarmEl.style.opacity = String(0.25 + 0.35 * Math.abs(Math.sin(now * 0.012)));
    if (alarmT <= 0) alarmEl.style.display = "none";
  }
  baseRing.rotation.z += dt * 0.8;

  const rate = incomeRate();
  if (rate > 0) {
    yenAcc += rate * dt;
    if (yenAcc >= 1) {
      const add = Math.floor(yenAcc);
      yen += add;
      yenAcc -= add;
      yenEl.textContent = String(Math.floor(yen));
    }
  }

  if (stun > 0) stun -= dt;

  if (stun <= 0) {
    const input = getInput();
    const speed = 8.8;
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
      vel.x = wish.x * speed;
      vel.z = wish.z * speed;
      facing = Math.atan2(wish.x, wish.z);
      playerMesh.rotation.y = facing;
    } else {
      vel.x *= 0.8;
      vel.z *= 0.8;
    }
    if (input.jump && onGround) {
      vel.y = 7.5;
      onGround = false;
    }
    vel.y -= 22 * dt;
    playerMesh.position.x += vel.x * dt;
    playerMesh.position.y += vel.y * dt;
    playerMesh.position.z += vel.z * dt;
    if (playerMesh.position.y <= 0) {
      playerMesh.position.y = 0;
      vel.y = 0;
      onGround = true;
    }
    playerMesh.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, playerMesh.position.x));
    playerMesh.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, playerMesh.position.z));
  }

  orbit.follow(playerMesh.position);

  if (carryMesh) {
    carryMesh.position.copy(playerMesh.position);
    carryMesh.position.y += 1.7;
    carryMesh.rotation.y += dt * 2.4;
  }

  mySlots.forEach((sl) => { if (sl.mesh) sl.mesh.rotation.y += dt * 1.2; });

  worldPedestals.forEach((p) => {
    if (p.respawn > 0) {
      p.respawn -= dt;
      if (p.respawn <= 0) {
        p.taken = false;
        p.item.visible = true;
      }
    }
    if (!p.taken) p.item.rotation.y += dt * 1.4;
  });

  guards.forEach((g) => {
    if (g.stun > 0) { g.stun -= dt; return; }
    const chasing = !!(carry && carry.stolen);
    const target = chasing ? playerMesh.position : g.home;
    const dir = new THREE.Vector3().subVectors(target, g.mesh.position);
    dir.y = 0;
    const d = dir.length();
    if (d > 0.3) {
      dir.normalize();
      const spd = chasing ? 6.2 : 2.8;
      g.mesh.position.x += dir.x * spd * dt;
      g.mesh.position.z += dir.z * spd * dt;
      g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
    g.mesh.position.y = 0;
    if (chasing && g.mesh.position.distanceTo(playerMesh.position) < 1.35 && stun <= 0) {
      dropCarry("Поймали! −¥25", 25);
      stun = 1.3;
      playerMesh.position.set(BASE.x, 0, BASE.z - 3.5);
      vel.set(0, 0, 0);
      g.stun = 1.2;
      alarmT = 0;
      alarmEl.style.display = "none";
      statusEl.textContent = "Потерял добычу · попробуй ещё";
    }
  });

  const act = nearestAction();
  if (act) {
    promptEl.style.display = "block";
    promptEl.textContent = act.label;
  } else promptEl.style.display = "none";

  incomeEl.textContent = String(incomeRate());
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
