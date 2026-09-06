/**
 * Укради яйцо · 3D v5 — прокачка: магазин, вольер, зоны, боссы, дорожка, сейв.
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;

const EGG_DEFS = [
  { id: "basic", name: "Обычное", price: 30, rate: 1, color: 0xf8fafc, geo: "egg", emissive: 0, scale: 1 },
  { id: "gold", name: "Золотое", price: 80, rate: 4, color: 0xfbbf24, geo: "egg", emissive: 0.35, scale: 1.08 },
  { id: "slime", name: "Слайм", price: 140, rate: 8, color: 0x84cc16, geo: "blob", emissive: 0.2, scale: 1.1 },
  { id: "rare", name: "Редкое", price: 220, rate: 12, color: 0xa855f7, geo: "crystal", emissive: 0.4, scale: 1 },
  { id: "crystal", name: "Кристалл", price: 350, rate: 22, color: 0x38bdf8, geo: "diamond", emissive: 0.45, scale: 1.05 },
  { id: "epic", name: "Эпик", price: 480, rate: 28, color: 0x6366f1, geo: "ring", emissive: 0.5, scale: 1 },
  { id: "ghost", name: "Призрак", price: 700, rate: 45, color: 0xe2e8f0, geo: "ghost", emissive: 0.15, scale: 1 },
  { id: "lava", name: "Лава", price: 950, rate: 58, color: 0xf97316, geo: "lava", emissive: 0.7, scale: 1.1 },
  { id: "dragon", name: "Дракон", price: 1300, rate: 70, color: 0xef4444, geo: "dragon", emissive: 0.55, scale: 1.15 },
  { id: "void", name: "Пустота", price: 1800, rate: 110, color: 0x312e81, geo: "void", emissive: 0.6, scale: 1.1 },
  { id: "star", name: "Звезда", price: 2500, rate: 160, color: 0xfde68a, geo: "star", emissive: 0.65, scale: 1.2 },
  { id: "final", name: "ФИНАЛ", price: 4000, rate: 200, color: 0xfde68a, geo: "crown", emissive: 0.8, scale: 1.25 },
];

const ZONES = [
  { id: "mine", name: "ТВОЯ", x: -32, z: 0, r: 7, color: 0x22c55e, pool: [], slots: 4, boss: false },
  { id: "z1", name: "НУБ", x: -18, z: 0, r: 6, color: 0x64748b, pool: ["basic", "basic", "gold"], boss: true },
  { id: "z2", name: "СОСЕД", x: -4, z: 0, r: 6, color: 0xef4444, pool: ["basic", "gold", "slime", "rare"], boss: true },
  { id: "z3", name: "КАТЯ", x: 10, z: 0, r: 6, color: 0xf97316, pool: ["gold", "slime", "rare", "crystal"], boss: true },
  { id: "z4", name: "РИК", x: 24, z: 0, r: 6, color: 0x3b82f6, pool: ["rare", "crystal", "epic", "ghost"], boss: true },
  { id: "z5", name: "ЕРОКС", x: 38, z: 0, r: 6.5, color: 0xa855f7, pool: ["epic", "ghost", "lava", "dragon"], boss: true },
  { id: "z6", name: "ДРАКОН", x: 52, z: 0, r: 6.5, color: 0xdc2626, pool: ["lava", "dragon", "void", "star"], boss: true },
  { id: "z7", name: "ФИНАЛ", x: 66, z: 0, r: 7, color: 0xeab308, pool: ["dragon", "void", "star", "final"], boss: true },
];

const SAVE_KEY = "amal-steal-egg-3d-v5";
let nextUid = 1;

function eggDef(id) {
  return EGG_DEFS.find((e) => e.id === id) || EGG_DEFS[0];
}
function pickEgg(pool) {
  const id = pool[Math.floor(Math.random() * pool.length)];
  return Object.assign({}, eggDef(id));
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7dd3fc);
scene.fog = new THREE.Fog(0x86efac, 40, 140);

const camera = new THREE.PerspectiveCamera(60, innerWidth / Math.max(1, innerHeight), 0.1, 220);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const sun = new THREE.DirectionalLight(0xfff7ed, 1.2);
sun.position.set(28, 48, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbae6fd, 0x4ade80, 0.45));

const MAP_W = 160;
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(MAP_W, 42),
  new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.92 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(MAP_W - 8, 7.5),
  new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.85 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(17, 0.02, 0);
road.receiveShadow = true;
scene.add(road);

// Полоски на дорожке
for (let i = -6; i < 12; i++) {
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc })
  );
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(i * 6, 0.03, 0);
  scene.add(stripe);
}

function makeMat(def, alpha) {
  return new THREE.MeshStandardMaterial({
    color: def.color,
    emissive: def.color,
    emissiveIntensity: def.emissive || 0,
    transparent: alpha != null,
    opacity: alpha != null ? alpha : 1,
    roughness: 0.42,
    metalness: def.id === "gold" || def.id === "final" ? 0.55 : 0.12,
  });
}

function makeEggMesh(def, scaleMul) {
  const g = new THREE.Group();
  const s = (def.scale || 1) * (scaleMul || 1);
  const mat = makeMat(def);
  let core;
  if (def.geo === "egg") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 18, 18), mat);
    core.scale.y = 1.28;
  } else if (def.geo === "blob") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.42 * s, 14, 12), mat);
    core.scale.set(1.15, 0.85, 1.15);
  } else if (def.geo === "crystal") {
    core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 0), mat);
  } else if (def.geo === "diamond") {
    core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45 * s, 0), mat);
  } else if (def.geo === "ring") {
    core = new THREE.Mesh(new THREE.TorusGeometry(0.32 * s, 0.12 * s, 10, 24), mat);
    core.rotation.x = Math.PI / 2;
  } else if (def.geo === "ghost") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.4 * s, 16, 16), makeMat(def, 0.72));
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28 * s, 0.5 * s, 8), makeMat(def, 0.55));
    tail.position.y = -0.35 * s;
    g.add(tail);
  } else if (def.geo === "lava") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.36 * s, 14, 14), mat);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.15 * s, 0.35 * s, 6), mat);
    spike.position.set(0, 0.42 * s, 0);
    g.add(spike);
  } else if (def.geo === "dragon") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.34 * s, 16, 16), mat);
    core.scale.set(1, 1.35, 0.9);
    [[-0.25], [0.25]].forEach(([x]) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08 * s, 0.35 * s, 5), mat);
      horn.position.set(x * s, 0.45 * s, 0);
      g.add(horn);
    });
  } else if (def.geo === "void") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.4 * s, 16, 16), mat);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 * s, 0.04 * s, 8, 32),
      makeMat({ color: 0xa855f7, emissive: 0.8, id: "void" }, 0.9)
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  } else if (def.geo === "star") {
    core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 * s, 0), mat);
  } else if (def.geo === "crown") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 18, 18), mat);
    core.scale.y = 1.2;
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.12 * s, 0.35 * s, 4),
      makeMat({ color: 0xfde68a, emissive: 0.9, id: "final" })
    );
    crown.position.set(0, 0.55 * s, 0);
    g.add(crown);
  } else {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 14, 14), mat);
  }
  core.castShadow = true;
  g.add(core);
  g.userData.spin = 0.8 + Math.random() * 0.6;
  return g;
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
      new THREE.MeshStandardMaterial({ color: helm, roughness: 0.4, metalness: 0.25 })
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

const myZone = ZONES[0];
const mySlots = [];
const worldEggs = [];
const bosses = [];

ZONES.forEach((z, zi) => {
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(z.r, z.r + 0.3, 0.38, 36),
    new THREE.MeshStandardMaterial({
      color: z.color,
      emissive: z.color,
      emissiveIntensity: zi === 0 ? 0.4 : 0.14,
      roughness: 0.55,
    })
  );
  pad.position.set(z.x, 0.19, z.z);
  pad.receiveShadow = true;
  scene.add(pad);

  // табличка зоны
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.9, 0.12),
    new THREE.MeshStandardMaterial({ color: z.color, emissive: z.color, emissiveIntensity: 0.2 })
  );
  sign.position.set(z.x, 2.6, z.z + z.r * 0.7);
  scene.add(sign);

  const slotN = zi === 0 ? myZone.slots : 3;
  for (let s = 0; s < slotN; s++) {
    const ang = (s / slotN) * Math.PI * 2 - Math.PI / 2;
    const sx = z.x + Math.cos(ang) * (z.r * 0.52);
    const sz = z.z + Math.sin(ang) * (z.r * 0.52);
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.7, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: zi === 0 ? 0x166534 : 0x475569 })
    );
    ped.position.set(sx, 0.4, sz);
    ped.castShadow = true;
    scene.add(ped);

    const slot = { x: sx, z: sz, ped, egg: null, mesh: null, zone: z };
    if (zi === 0) {
      mySlots.push(slot);
    } else {
      const def = pickEgg(z.pool);
      const mesh = makeEggMesh(def);
      mesh.position.set(sx, 1.05, sz);
      scene.add(mesh);
      const uid = nextUid++;
      worldEggs.push({ uid, def, mesh, x: sx, z: sz, zone: z, taken: false, respawn: 0 });
    }
  }

  if (z.boss) {
    const b = makeHumanoid(z.color, 0x1e293b, 0x7f1d1d);
    b.position.set(z.x, 0, z.z - 3.4);
    scene.add(b);
    bosses.push({
      mesh: b,
      zone: z,
      homeX: z.x,
      homeZ: z.z - 3.4,
      angry: false,
    });
  }
});

const treadmill = { x: myZone.x, z: myZone.z + 5.4, w: 6.2, d: 2.6 };
const treadMesh = new THREE.Mesh(
  new THREE.BoxGeometry(treadmill.w, 0.28, treadmill.d),
  new THREE.MeshStandardMaterial({ color: 0x94a3b8, emissive: 0x64748b, emissiveIntensity: 0.2 })
);
treadMesh.position.set(treadmill.x, 0.3, treadmill.z);
treadMesh.castShadow = true;
scene.add(treadMesh);

const playerMesh = makeHumanoid(0x38bdf8, 0x1e3a8a, 0xfbbf24);
playerMesh.position.set(myZone.x, 0, myZone.z + 2);
scene.add(playerMesh);
const vel = new THREE.Vector3();
let onGround = true;

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 13,
  pitch: 0.5,
  yaw: Math.PI * 0.5,
  lookOffsetY: 1.2,
  minDist: 5,
  maxDist: 26,
  lerp: 0.2,
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const bounds = { minX: -40, maxX: 78, minZ: -15, maxZ: 15 };

let coins = 120;
let speedStat = 1;
let carry = null;
let carryMesh = null;
let carryFromUid = 0;
let carryFromZone = null;
let toastT = 0;
let alarmT = 0;
let incomeAcc = 0;
let onTreadmill = false;
let treadmillRun = false;
let forceRun = false;

const coinsEl = document.getElementById("coins");
const incomeEl = document.getElementById("income");
const speedEl = document.getElementById("speed");
const carryEl = document.getElementById("carry");
const promptEl = document.getElementById("prompt");
const toastEl = document.getElementById("toast");
const alarmEl = document.getElementById("alarm");
const slotList = document.getElementById("slotList");
const shopList = document.getElementById("shopList");

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e4) return Math.round(n / 1000) + "K";
  return Math.floor(n).toString();
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  toastT = 2.1;
}

function incomeRate() {
  return mySlots.reduce((s, sl) => s + (sl.egg ? sl.egg.rate : 0), 0);
}

function syncUI() {
  coinsEl.textContent = formatNum(coins);
  incomeEl.textContent = formatNum(incomeRate());
  speedEl.textContent = formatNum(speedStat);
  carryEl.textContent = carry ? carry.name : "пусто";
  slotList.innerHTML = mySlots
    .map((sl, i) => {
      if (!sl.egg) return "<div>Слот " + (i + 1) + ": пусто</div>";
      return "<div>Слот " + (i + 1) + ": " + sl.egg.name + " · +" + sl.egg.rate + "/с</div>";
    })
    .join("");
}

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        coins,
        speedStat,
        mine: mySlots.map((s) => (s.egg ? s.egg.id : null)),
      })
    );
  } catch (_) {}
}

function loadGame() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!d) return;
    if (d.coins != null) coins = d.coins;
    if (d.speedStat != null) speedStat = d.speedStat;
    if (Array.isArray(d.mine)) {
      d.mine.forEach((id, i) => {
        if (!id || !mySlots[i]) return;
        const def = eggDef(id);
        mySlots[i].egg = Object.assign({}, def);
        mySlots[i].mesh = makeEggMesh(def);
        mySlots[i].mesh.position.set(mySlots[i].x, 1.05, mySlots[i].z);
        scene.add(mySlots[i].mesh);
      });
    }
  } catch (_) {}
}

function dist2(x1, z1, x2, z2) {
  return Math.hypot(x1 - x2, z1 - z2);
}

function nearestSteal() {
  const px = playerMesh.position.x;
  const pz = playerMesh.position.z;
  let best = null;
  let bestD = 2.15;
  worldEggs.forEach((w) => {
    if (w.taken || w.respawn > 0) return;
    const d = dist2(px, pz, w.x, w.z);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  });
  return best;
}

function freeMySlot() {
  return mySlots.find((s) => !s.egg);
}

function onMyBase() {
  return dist2(playerMesh.position.x, playerMesh.position.z, myZone.x, myZone.z) < myZone.r + 0.55;
}

function updatePrompt() {
  let t = "";
  if (onTreadmill) {
    t = treadmillRun
      ? "🏃 БЕЖИМ! +" + formatNum(8 + speedStat * 0.02) + " ⚡/с"
      : "👟 Жми W на дорожке!";
  } else if (carry && onMyBase() && freeMySlot()) t = "E — в вольер";
  else if (carry && onMyBase() && !freeMySlot()) t = "Вольер полон (4)";
  else if (!carry && nearestSteal()) t = "E — украсть «" + nearestSteal().def.name + "»";
  promptEl.style.display = t ? "block" : "none";
  promptEl.textContent = t;
}

function placeEgg() {
  const slot = freeMySlot();
  if (!slot || !carry) return false;
  slot.egg = Object.assign({}, carry);
  slot.mesh = makeEggMesh(carry);
  slot.mesh.position.set(slot.x, 1.05, slot.z);
  scene.add(slot.mesh);
  if (carryMesh) {
    scene.remove(carryMesh);
    carryMesh = null;
  }
  if (carryFromUid) {
    const w = worldEggs.find((x) => x.uid === carryFromUid);
    if (w) w.respawn = 10;
  }
  toast("🐣 " + carry.name + " в вольере! +" + carry.rate + "/с");
  carry = null;
  carryFromUid = 0;
  carryFromZone = null;
  alarmT = 0;
  alarmEl.style.display = "none";
  bosses.forEach((b) => {
    b.angry = false;
  });
  saveGame();
  syncUI();
  return true;
}

function stealEgg(w) {
  w.taken = true;
  w.mesh.visible = false;
  carry = Object.assign({}, w.def);
  carryFromUid = w.uid;
  carryFromZone = w.zone.id;
  if (carryMesh) scene.remove(carryMesh);
  carryMesh = makeEggMesh(carry, 0.85);
  scene.add(carryMesh);
  bosses.forEach((b) => {
    b.angry = b.zone.id === w.zone.id;
  });
  alarmT = 4;
  alarmEl.style.display = "block";
  toast("Украл «" + carry.name + "»! Беги домой!");
  syncUI();
}

function buyEgg(i) {
  const def = EGG_DEFS[i];
  if (carry) {
    toast("Сначала поставь яйцо в вольер!");
    return;
  }
  if (coins < def.price) {
    toast("Мало монет · нужно " + def.price);
    return;
  }
  coins -= def.price;
  carry = Object.assign({}, def);
  carryFromUid = 0;
  carryFromZone = null;
  if (carryMesh) scene.remove(carryMesh);
  carryMesh = makeEggMesh(carry, 0.85);
  scene.add(carryMesh);
  toast("Куплено: " + def.name);
  syncUI();
  saveGame();
}

function dropCarry(msg) {
  if (!carry) return;
  if (carryFromUid) {
    const w = worldEggs.find((x) => x.uid === carryFromUid);
    if (w) {
      w.taken = false;
      w.mesh.visible = true;
      w.respawn = 0;
    }
  }
  if (carryMesh) {
    scene.remove(carryMesh);
    carryMesh = null;
  }
  carry = null;
  carryFromUid = 0;
  carryFromZone = null;
  alarmT = 0;
  alarmEl.style.display = "none";
  bosses.forEach((b) => {
    b.angry = false;
  });
  syncUI();
  if (msg) toast(msg);
}

function doAction() {
  if (carry && onMyBase()) {
    placeEgg();
    return;
  }
  if (!carry) {
    const w = nearestSteal();
    if (w) stealEgg(w);
  }
}

function renderShop() {
  shopList.innerHTML = EGG_DEFS.slice(0, 8)
    .map((item, i) => {
      return (
        '<button type="button" class="item" data-i="' +
        i +
        '"><span>' +
        item.name +
        " · +" +
        item.rate +
        '/с</span><span class="price">🪙' +
        item.price +
        "</span></button>"
      );
    })
    .join("");
  shopList.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => buyEgg(+btn.getAttribute("data-i"));
  });
}

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyE") {
    e.preventDefault();
    doAction();
  }
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

document.getElementById("btnRun").onclick = () => {
  forceRun = !forceRun;
  document.getElementById("btnRun").textContent = forceRun ? "🏃 Бег ВКЛ" : "🏃 Бег";
};
document.getElementById("btn-e").onclick = () => doAction();
document.getElementById("btn-jump").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  keys.Space = true;
});
document.getElementById("btn-jump").addEventListener("pointerup", () => {
  keys.Space = false;
});

const pad = document.getElementById("pad");
const knob = document.getElementById("pad-knob");
const stick = { x: 0, y: 0, active: false };
function setStick(cx, cy) {
  const r = pad.getBoundingClientRect();
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
  return { x, z, jump: !!keys.Space, forward: !!(keys.KeyW || keys.ArrowUp || (stick.active && stick.y < -0.3) || forceRun) };
}

renderShop();
loadGame();
syncUI();
toast("Укради яйцо прокачано! Купи или воруй → вольер");

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const input = getInput();
  const baseSpeed = 8.5 + Math.min(6, Math.log10(Math.max(10, speedStat)));
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
    playerMesh.rotation.y = Math.atan2(wish.x, wish.z);
  } else {
    vel.x *= 0.8;
    vel.z *= 0.8;
  }
  if (input.jump && onGround) {
    vel.y = 7.2;
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

  const px = playerMesh.position.x;
  const pz = playerMesh.position.z;

  onTreadmill =
    px > treadmill.x - treadmill.w / 2 &&
    px < treadmill.x + treadmill.w / 2 &&
    pz > treadmill.z - treadmill.d / 2 &&
    pz < treadmill.z + treadmill.d / 2;

  treadmillRun = onTreadmill && input.forward;
  treadMesh.material.emissiveIntensity = treadmillRun ? 0.6 : 0.2;
  treadMesh.material.color.setHex(treadmillRun ? 0xfde68a : 0x94a3b8);
  if (treadmillRun) speedStat += (8 + Math.log10(Math.max(10, speedStat)) * 6) * dt;

  if (carryMesh) {
    carryMesh.position.set(px, 1.55, pz);
    carryMesh.rotation.y += dt * 2.2;
  }

  worldEggs.forEach((w) => {
    if (!w.taken && w.mesh.visible) {
      w.mesh.rotation.y += dt * w.mesh.userData.spin;
      w.mesh.position.y = 1.05 + Math.sin(now * 0.003 + w.x) * 0.07;
    }
    if (w.taken && w.respawn > 0) {
      w.respawn -= dt;
      if (w.respawn <= 0) {
        w.taken = false;
        w.def = pickEgg(w.zone.pool);
        scene.remove(w.mesh);
        w.mesh = makeEggMesh(w.def);
        w.mesh.position.set(w.x, 1.05, w.z);
        scene.add(w.mesh);
      }
    }
  });

  mySlots.forEach((s) => {
    if (s.mesh) s.mesh.rotation.y += dt * 0.55;
  });

  bosses.forEach((b) => {
    if (carry && carryFromZone === b.zone.id && b.angry) {
      const d = dist2(px, pz, b.mesh.position.x, b.mesh.position.z);
      if (d < 1.55) {
        dropCarry("💥 " + b.zone.name + " вернул яйцо!");
      } else if (d < 22) {
        b.mesh.position.x += (px - b.mesh.position.x) * dt * 3.2;
        b.mesh.position.z += (pz - b.mesh.position.z) * dt * 3.2;
        b.mesh.rotation.y = Math.atan2(px - b.mesh.position.x, pz - b.mesh.position.z);
      }
    } else {
      // домой
      b.mesh.position.x += (b.homeX - b.mesh.position.x) * dt * 1.8;
      b.mesh.position.z += (b.homeZ - b.mesh.position.z) * dt * 1.8;
    }
  });

  incomeAcc += dt;
  if (incomeAcc >= 1) {
    incomeAcc = 0;
    coins += incomeRate();
    saveGame();
  }

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }
  if (alarmT > 0) {
    alarmT -= dt;
    alarmEl.style.opacity = String(0.25 + 0.35 * Math.abs(Math.sin(now * 0.012)));
    if (alarmT <= 0) alarmEl.style.display = "none";
  }

  orbit.follow(playerMesh.position);
  updatePrompt();
  syncUI();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
