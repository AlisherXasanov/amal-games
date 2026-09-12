/**
 * Укради яйцо · 3D v8 — играбельная карта:
 * сейф-база (погоня не достаёт) · рынок добрых ботов · вражеские базы · авто-дорожка без W.
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;

const EGG_DEFS = [
  { id: "basic", name: "Белое", rarity: "Обычное", price: 20, rate: 1, weight: 45, hatchMul: 0.65, recSpeed: 1, color: 0xf8fafc, geo: "egg", emissive: 0, scale: 1 },
  { id: "gold", name: "Золотое", rarity: "Необычное", price: 60, rate: 3, weight: 16, hatchMul: 0.85, recSpeed: 4, color: 0xfbbf24, geo: "egg", emissive: 0.35, scale: 1.08 },
  { id: "slime", name: "Слайм", rarity: "Необычное", price: 100, rate: 6, weight: 11, hatchMul: 1, recSpeed: 8, color: 0x84cc16, geo: "blob", emissive: 0.2, scale: 1.1 },
  { id: "rare", name: "Редкое", rarity: "Редкое", price: 180, rate: 12, weight: 7, hatchMul: 1.25, recSpeed: 15, color: 0xa855f7, geo: "crystal", emissive: 0.4, scale: 1 },
  { id: "crystal", name: "Кристалл", rarity: "Редкое", price: 280, rate: 20, weight: 5, hatchMul: 1.4, recSpeed: 25, color: 0x38bdf8, geo: "diamond", emissive: 0.45, scale: 1.05 },
  { id: "epic", name: "Эпик", rarity: "Эпик", price: 420, rate: 30, weight: 3.5, hatchMul: 1.55, recSpeed: 40, color: 0x6366f1, geo: "ring", emissive: 0.5, scale: 1 },
  { id: "ghost", name: "Призрак", rarity: "Эпик", price: 600, rate: 45, weight: 2.8, hatchMul: 1.7, recSpeed: 55, color: 0xe2e8f0, geo: "ghost", emissive: 0.15, scale: 1 },
  { id: "lava", name: "Лава", rarity: "Легенда", price: 850, rate: 60, weight: 2, hatchMul: 1.9, recSpeed: 90, color: 0xf97316, geo: "lava", emissive: 0.7, scale: 1.1 },
  { id: "dragon", name: "Дракон", rarity: "Легенда", price: 1200, rate: 80, weight: 1.5, hatchMul: 2.1, recSpeed: 120, color: 0xef4444, geo: "dragon", emissive: 0.55, scale: 1.15 },
  { id: "void", name: "Пустота", rarity: "Миф", price: 1700, rate: 115, weight: 1, hatchMul: 2.4, recSpeed: 180, color: 0x312e81, geo: "void", emissive: 0.6, scale: 1.1 },
  { id: "star", name: "Звезда", rarity: "Миф", price: 2400, rate: 165, weight: 0.7, hatchMul: 2.6, recSpeed: 240, color: 0xfde68a, geo: "star", emissive: 0.65, scale: 1.2 },
  { id: "final", name: "ФИНАЛ", rarity: "Секрет", price: 3800, rate: 230, weight: 0.3, hatchMul: 3, recSpeed: 320, color: 0xfde68a, geo: "crown", emissive: 0.8, scale: 1.25 },
];

/** Карта: СЕЙФ слева → РЫНОК ботов → базы врагов справа */
const ZONES = [
  { id: "mine", name: "ТВОЯ · СЕЙФ", x: -36, z: 0, r: 8.5, color: 0x22c55e, pool: [], slots: 6, boss: false, safe: true, recSpeed: 0 },
  { id: "market", name: "РЫНОК БОТОВ", x: -14, z: 0, r: 9, color: 0x38bdf8, pool: [], slots: 0, boss: false, market: true, recSpeed: 0 },
  { id: "z1", name: "НУБ", x: 6, z: 0, r: 5.5, color: 0x64748b, pool: ["basic", "basic", "basic", "basic", "gold"], boss: true, recSpeed: 1 },
  { id: "z2", name: "СОСЕД", x: 20, z: 0, r: 5.5, color: 0xef4444, pool: ["basic", "basic", "gold", "slime"], boss: true, recSpeed: 6 },
  { id: "z3", name: "КАТЯ", x: 34, z: 0, r: 5.5, color: 0xf97316, pool: ["gold", "slime", "rare", "rare"], boss: true, recSpeed: 18 },
  { id: "z4", name: "РИК", x: 48, z: 0, r: 5.8, color: 0x3b82f6, pool: ["rare", "crystal", "epic"], boss: true, recSpeed: 40 },
  { id: "z5", name: "ДРАКОН", x: 62, z: 0, r: 6, color: 0xdc2626, pool: ["epic", "lava", "dragon", "void"], boss: true, recSpeed: 100 },
  { id: "z6", name: "ФИНАЛ", x: 78, z: 0, r: 6.5, color: 0xeab308, pool: ["dragon", "void", "star", "final"], boss: true, recSpeed: 220 },
];

const SAVE_KEY = "amal-steal-egg-3d-v8";
let nextUid = 1;

function eggDef(id) {
  return EGG_DEFS.find((e) => e.id === id) || EGG_DEFS[0];
}
function pickWeighted(pool) {
  let total = 0;
  const items = pool.map((id) => {
    const d = eggDef(id);
    const w = d.weight || 1;
    total += w;
    return { d, w };
  });
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return Object.assign({}, it.d);
  }
  return Object.assign({}, items[0].d);
}
function pickMarketEgg() {
  return pickWeighted(["basic", "basic", "basic", "basic", "basic", "gold", "gold", "slime", "rare", "crystal"]);
}
function hatchSeconds(def) {
  return Math.max(6, 18 - Math.min(10, (def.rate || 1) * 0.06)) * (def.hatchMul || 1);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x9be7ff, 55, 170);

const camera = new THREE.PerspectiveCamera(58, innerWidth / Math.max(1, innerHeight), 0.1, 240);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xfff7ed, 1.15);
sun.position.set(20, 50, 20);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbae6fd, 0x4ade80, 0.4));

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 48),
  new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.92 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(170, 8),
  new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.85 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(20, 0.02, 0);
road.receiveShadow = true;
scene.add(road);

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
    core = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 16, 16), mat);
    core.scale.y = 1.28;
  } else if (def.geo === "blob") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.42 * s, 12, 10), mat);
    core.scale.set(1.15, 0.85, 1.15);
  } else if (def.geo === "crystal") {
    core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 0), mat);
  } else if (def.geo === "diamond") {
    core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45 * s, 0), mat);
  } else if (def.geo === "ring") {
    core = new THREE.Mesh(new THREE.TorusGeometry(0.32 * s, 0.12 * s, 8, 20), mat);
    core.rotation.x = Math.PI / 2;
  } else if (def.geo === "ghost") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.4 * s, 14, 14), makeMat(def, 0.72));
  } else if (def.geo === "lava") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.36 * s, 12, 12), mat);
  } else if (def.geo === "dragon") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.34 * s, 14, 14), mat);
    core.scale.set(1, 1.35, 0.9);
  } else if (def.geo === "void") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.4 * s, 14, 14), mat);
  } else if (def.geo === "star") {
    core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 * s, 0), mat);
  } else if (def.geo === "crown") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 16, 16), mat);
    core.scale.y = 1.2;
  } else {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 12, 12), mat);
  }
  core.castShadow = true;
  g.add(core);
  g.userData.spin = 0.8 + Math.random() * 0.6;
  return g;
}

function makePetMesh(def) {
  const g = new THREE.Group();
  const s = def.scale || 1;
  const mat = makeMat(def);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.36 * s, 12, 10), mat);
  body.position.y = 0.45 * s;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 10, 8), mat);
  head.position.set(0, 0.85 * s, 0.05 * s);
  g.add(head);
  g.userData.spin = 1.2;
  g.userData.isPet = true;
  return g;
}

function makeHumanoid(shirt, pants, helm) {
  const g = new THREE.Group();
  const skin = 0xffc9a3;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: shirt }));
  torso.position.y = 1.05;
  torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: skin }));
  head.position.y = 1.55;
  g.add(head);
  if (helm != null) {
    const h = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: helm, metalness: 0.3 })
    );
    h.position.y = 1.62;
    g.add(h);
  }
  [-0.32, 0.32].forEach((x) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 6), new THREE.MeshStandardMaterial({ color: skin }));
    arm.position.set(x, 1.1, 0);
    g.add(arm);
  });
  [-0.12, 0.12].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 6), new THREE.MeshStandardMaterial({ color: pants }));
    leg.position.set(x, 0.4, 0);
    g.add(leg);
  });
  return g;
}

const myZone = ZONES[0];
const marketZone = ZONES.find((z) => z.market);
const mySlots = [];
const worldEggs = [];
const bosses = [];
const marketBots = [];

ZONES.forEach((z, zi) => {
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(z.r, z.r + 0.35, z.safe ? 0.5 : 0.38, 40),
    new THREE.MeshStandardMaterial({
      color: z.color,
      emissive: z.color,
      emissiveIntensity: z.safe ? 0.55 : z.market ? 0.4 : 0.14,
      roughness: 0.55,
    })
  );
  pad.position.set(z.x, z.safe ? 0.25 : 0.19, z.z);
  pad.receiveShadow = true;
  scene.add(pad);

  // кольцо сейфа
  if (z.safe) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(z.r + 0.4, 0.12, 8, 48),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 0.8 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(z.x, 0.55, z.z);
    scene.add(ring);
  }

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(z.market ? 3.4 : 2.4, 1, 0.14),
    new THREE.MeshStandardMaterial({ color: z.color, emissive: z.color, emissiveIntensity: 0.25 })
  );
  sign.position.set(z.x, 2.8, z.z + z.r * 0.75);
  scene.add(sign);

  if (z.safe) {
    const slotN = z.slots;
    for (let s = 0; s < slotN; s++) {
      const ang = (s / slotN) * Math.PI * 2 - Math.PI / 2;
      const sx = z.x + Math.cos(ang) * (z.r * 0.48);
      const sz = z.z + Math.sin(ang) * (z.r * 0.48);
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.7, 0.55, 12),
        new THREE.MeshStandardMaterial({ color: 0x166534 })
      );
      ped.position.set(sx, 0.45, sz);
      scene.add(ped);
      mySlots.push({ x: sx, z: sz, ped, egg: null, mesh: null, hatched: false, hatchLeft: 0 });
    }
  } else if (z.boss) {
    for (let s = 0; s < 3; s++) {
      const ang = (s / 3) * Math.PI * 2 - Math.PI / 2;
      const sx = z.x + Math.cos(ang) * (z.r * 0.5);
      const sz = z.z + Math.sin(ang) * (z.r * 0.5);
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.65, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      ped.position.set(sx, 0.4, sz);
      scene.add(ped);
      const def = pickWeighted(z.pool);
      const mesh = makeEggMesh(def);
      mesh.position.set(sx, 1.05, sz);
      scene.add(mesh);
      worldEggs.push({
        uid: nextUid++,
        def,
        mesh,
        x: sx,
        z: sz,
        zone: z,
        taken: false,
        respawn: 0,
      });
    }
    const b = makeHumanoid(z.color, 0x1e293b, 0x7f1d1d);
    b.position.set(z.x, 0, z.z - 3.2);
    scene.add(b);
    bosses.push({ mesh: b, zone: z, homeX: z.x, homeZ: z.z - 3.2, angry: false });
  }
});

// Добрые боты только на РЫНКЕ — патруль по кругу
for (let i = 0; i < 5; i++) {
  const def = pickMarketEgg();
  const body = makeHumanoid(0xe0f2fe, 0x0369a1, 0x38bdf8);
  const eggM = makeEggMesh(def, 0.7);
  eggM.position.set(0, 1.85, 0);
  body.add(eggM);
  const ang = (i / 5) * Math.PI * 2;
  body.position.set(
    marketZone.x + Math.cos(ang) * 4.5,
    0,
    marketZone.z + Math.sin(ang) * 4.5
  );
  scene.add(body);
  marketBots.push({
    mesh: body,
    eggMesh: eggM,
    def,
    ang,
    radius: 4.2 + (i % 2) * 1.2,
    spin: 0.55 + i * 0.08,
    reload: 0,
  });
}

// Дорожка в сейфе — без W: просто стой на ней
const treadmill = { x: myZone.x, z: myZone.z + 6.2, w: 7, d: 2.8 };
const treadMesh = new THREE.Mesh(
  new THREE.BoxGeometry(treadmill.w, 0.28, treadmill.d),
  new THREE.MeshStandardMaterial({ color: 0x64748b, emissive: 0x334155, emissiveIntensity: 0.15 })
);
treadMesh.position.set(treadmill.x, 0.35, treadmill.z);
scene.add(treadMesh);
const treadLock = new THREE.Mesh(
  new THREE.BoxGeometry(treadmill.w + 0.15, 1.2, 0.1),
  new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.5 })
);
treadLock.position.set(treadmill.x, 0.85, treadmill.z + treadmill.d / 2);
scene.add(treadLock);

const playerMesh = makeHumanoid(0x38bdf8, 0x1e3a8a, 0xfbbf24);
playerMesh.position.set(myZone.x, 0, myZone.z + 2);
scene.add(playerMesh);
const vel = new THREE.Vector3();
let onGround = true;

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 14,
  pitch: 0.48,
  yaw: Math.PI * 0.5,
  lookOffsetY: 1.2,
  minDist: 6,
  maxDist: 28,
  lerp: 0.2,
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const bounds = { minX: -50, maxX: 92, minZ: -18, maxZ: 18 };

let coins = 150;
let speedStat = 1;
let carry = null;
let carryMesh = null;
let carryFromUid = 0;
let carryFromZone = null;
let toastT = 0;
let alarmT = 0;
let incomeAcc = 0;
let unlockedSlots = 2;
let treadmillUnlocked = false;
let treadLevel = 1;
let flingT = 0;
let forceRun = false;
let autoDepositFlash = 0;

const coinsEl = document.getElementById("coins");
const incomeEl = document.getElementById("income");
const speedEl = document.getElementById("speed");
const carryEl = document.getElementById("carry");
const promptEl = document.getElementById("prompt");
const toastEl = document.getElementById("toast");
const alarmEl = document.getElementById("alarm");
const slotList = document.getElementById("slotList");
const shopList = document.getElementById("shopList");
const upgList = document.getElementById("upgList");
const slotCapEl = document.getElementById("slotCap");
const treadStatEl = document.getElementById("treadStat");
const rarityBox = document.getElementById("rarityBox");
const rarityTable = document.getElementById("rarityTable");

const UPGRADES = {
  slot: [0, 0, 70, 160, 300, 520, 900],
  treadUnlock: 100,
  treadLv: [0, 0, 160, 380, 750, 1400],
};

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e4) return Math.round(n / 1000) + "K";
  return Math.floor(n).toString();
}
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  toastT = 2.4;
}
function dist2(x1, z1, x2, z2) {
  return Math.hypot(x1 - x2, z1 - z2);
}
function inSafeZone() {
  return dist2(playerMesh.position.x, playerMesh.position.z, myZone.x, myZone.z) < myZone.r + 0.35;
}
function inMarket() {
  return dist2(playerMesh.position.x, playerMesh.position.z, marketZone.x, marketZone.z) < marketZone.r;
}
function incomeRate() {
  return mySlots.reduce((s, sl) => {
    if (!sl.egg) return s;
    return s + sl.egg.rate * (sl.hatched ? 2 : 1);
  }, 0);
}
function freeMySlot() {
  return mySlots.find((s, i) => i < unlockedSlots && !s.egg);
}
function syncTreadVisual() {
  treadLock.visible = !treadmillUnlocked;
  treadMesh.material.color.setHex(treadmillUnlocked ? 0x94a3b8 : 0x475569);
}

function syncUI() {
  coinsEl.textContent = formatNum(coins);
  incomeEl.textContent = formatNum(incomeRate());
  speedEl.textContent = formatNum(speedStat);
  carryEl.textContent = carry ? carry.name : "пусто";
  if (slotCapEl) slotCapEl.textContent = unlockedSlots + "/" + mySlots.length;
  if (treadStatEl) treadStatEl.textContent = treadmillUnlocked ? "ур." + treadLevel + " (стой — качает)" : "купи";
  slotList.innerHTML = mySlots
    .map((sl, i) => {
      if (i >= unlockedSlots) return "<div>Слот " + (i + 1) + ": 🔒</div>";
      if (!sl.egg) return "<div>Слот " + (i + 1) + ": пусто</div>";
      if (!sl.hatched) return "<div>Слот " + (i + 1) + ": 🥚 " + sl.egg.name + " · " + Math.ceil(sl.hatchLeft) + "с</div>";
      return "<div>Слот " + (i + 1) + ": 🐾 " + sl.egg.name + " · +" + sl.egg.rate * 2 + "/с</div>";
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
        unlockedSlots,
        treadmillUnlocked,
        treadLevel,
        mine: mySlots.map((s) =>
          s.egg ? { id: s.egg.id, hatched: !!s.hatched, hatchLeft: s.hatchLeft || 0 } : null
        ),
      })
    );
  } catch (_) {}
}

function loadGame() {
  try {
    let raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem("amal-steal-egg-3d-v7") || localStorage.getItem("amal-steal-egg-3d-v6");
    const d = JSON.parse(raw || "null");
    if (!d) return;
    if (d.coins != null) coins = d.coins;
    if (d.speedStat != null) speedStat = d.speedStat;
    if (d.unlockedSlots != null) unlockedSlots = Math.max(2, Math.min(mySlots.length, d.unlockedSlots));
    if (d.treadmillUnlocked) treadmillUnlocked = true;
    if (d.treadLevel != null) treadLevel = Math.max(1, Math.min(5, d.treadLevel));
    if (Array.isArray(d.mine)) {
      d.mine.forEach((row, i) => {
        if (!row || !mySlots[i]) return;
        const id = typeof row === "string" ? row : row.id;
        const def = eggDef(id);
        mySlots[i].egg = Object.assign({}, def);
        mySlots[i].hatched = !!row.hatched;
        mySlots[i].hatchLeft = row.hatched ? 0 : row.hatchLeft != null ? row.hatchLeft : hatchSeconds(def);
        mySlots[i].mesh = mySlots[i].hatched ? makePetMesh(def) : makeEggMesh(def);
        mySlots[i].mesh.position.set(mySlots[i].x, mySlots[i].hatched ? 0.25 : 1.05, mySlots[i].z);
        scene.add(mySlots[i].mesh);
      });
    }
    syncTreadVisual();
  } catch (_) {}
}

function renderRarityTable() {
  if (!rarityTable) return;
  let html = "<table><tr><th>Яйцо</th><th>Редкость</th><th>$/с</th><th>Вылуп</th><th>⚡</th></tr>";
  EGG_DEFS.forEach((e) => {
    html +=
      "<tr><td>" +
      e.name +
      "</td><td>" +
      e.rarity +
      "</td><td>+" +
      e.rate +
      "</td><td>" +
      Math.round(hatchSeconds(e)) +
      "с</td><td>" +
      e.recSpeed +
      "+</td></tr>";
  });
  html += "</table><p style='margin-top:6px;color:#94a3b8'>Базы:</p><table><tr><th>Зона</th><th>⚡ советую</th></tr>";
  ZONES.filter((z) => z.boss).forEach((z) => {
    html += "<tr><td>" + z.name + "</td><td>" + z.recSpeed + "+</td></tr>";
  });
  html += "</table>";
  rarityTable.innerHTML = html;
}

function nearestSteal() {
  const px = playerMesh.position.x;
  const pz = playerMesh.position.z;
  let best = null;
  let bestD = 2.2;
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

function nearestMarketBot() {
  const px = playerMesh.position.x;
  const pz = playerMesh.position.z;
  let best = null;
  let bestD = 2.4;
  marketBots.forEach((b) => {
    if (!b.eggMesh || b.reload > 0) return;
    const d = dist2(px, pz, b.mesh.position.x, b.mesh.position.z);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  });
  return best;
}

function takeFromBot(b) {
  if (!b || !b.eggMesh || carry) return;
  carry = Object.assign({}, b.def);
  carryFromUid = 0;
  carryFromZone = null;
  if (carryMesh) scene.remove(carryMesh);
  carryMesh = makeEggMesh(carry, 0.85);
  scene.add(carryMesh);
  b.mesh.remove(b.eggMesh);
  b.eggMesh = null;
  b.reload = 4 + Math.random() * 3;
  toast("🤝 Бот отдал «" + carry.name + "»! Беги в зелёный СЕЙФ");
  syncUI();
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
  alarmT = 5;
  alarmEl.style.display = "block";
  toast("Украл «" + carry.name + "»! В СЕЙФ — там не поймают!");
  syncUI();
}

function placeEgg() {
  const slot = freeMySlot();
  if (!slot || !carry) return false;
  slot.egg = Object.assign({}, carry);
  slot.hatched = false;
  slot.hatchLeft = hatchSeconds(carry);
  slot.mesh = makeEggMesh(carry);
  slot.mesh.position.set(slot.x, 1.05, slot.z);
  scene.add(slot.mesh);
  if (carryMesh) {
    scene.remove(carryMesh);
    carryMesh = null;
  }
  if (carryFromUid) {
    const w = worldEggs.find((x) => x.uid === carryFromUid);
    if (w) w.respawn = 8;
  }
  toast("✅ В сейфе! «" + carry.name + "» вылупится через " + Math.ceil(slot.hatchLeft) + "с");
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

function flingFrom(bx, bz) {
  const px = playerMesh.position.x;
  const pz = playerMesh.position.z;
  let dx = px - bx;
  let dz = pz - bz;
  const len = Math.hypot(dx, dz) || 1;
  vel.x = (dx / len) * 28;
  vel.z = (dz / len) * 28;
  vel.y = 11;
  onGround = false;
  flingT = 0.9;
}

function hatchSlot(slot) {
  if (!slot.egg || slot.hatched) return;
  slot.hatched = true;
  slot.hatchLeft = 0;
  if (slot.mesh) scene.remove(slot.mesh);
  slot.mesh = makePetMesh(slot.egg);
  slot.mesh.position.set(slot.x, 0.25, slot.z);
  scene.add(slot.mesh);
  toast("🐣 Вылупился «" + slot.egg.name + "» · доход ×2");
  saveGame();
  syncUI();
}

function buyEgg(i) {
  const def = EGG_DEFS[i];
  if (carry) {
    toast("Сначала положи яйцо в сейф!");
    return;
  }
  if (coins < def.price) {
    toast("Мало монет · " + def.price);
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

function buyUpgrade(kind) {
  if (kind === "slot") {
    if (unlockedSlots >= mySlots.length) return toast("Все слоты открыты");
    const cost = UPGRADES.slot[unlockedSlots + 1];
    if (coins < cost) return toast("Нужно " + cost);
    coins -= cost;
    unlockedSlots += 1;
    toast("🔓 Слот " + unlockedSlots);
    saveGame();
    syncUI();
    renderUpgrades();
    return;
  }
  if (kind === "tread") {
    if (!treadmillUnlocked) {
      if (coins < UPGRADES.treadUnlock) return toast("Дорожка " + UPGRADES.treadUnlock);
      coins -= UPGRADES.treadUnlock;
      treadmillUnlocked = true;
      syncTreadVisual();
      toast("👟 Дорожка! Просто стой на ней — W не нужен");
      saveGame();
      syncUI();
      renderUpgrades();
      return;
    }
    if (treadLevel >= 5) return toast("Макс");
    const cost = UPGRADES.treadLv[treadLevel + 1];
    if (coins < cost) return toast("Нужно " + cost);
    coins -= cost;
    treadLevel += 1;
    toast("⚡ Дорожка ур." + treadLevel);
    saveGame();
    syncUI();
    renderUpgrades();
  }
}

function renderShop() {
  shopList.innerHTML = EGG_DEFS.slice(0, 8)
    .map(
      (item, i) =>
        '<button type="button" class="item" data-i="' +
        i +
        '"><span>' +
        item.name +
        " · +" +
        item.rate +
        '/с</span><span class="price">🪙' +
        item.price +
        "</span></button>"
    )
    .join("");
  shopList.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => buyEgg(+btn.getAttribute("data-i"));
  });
}

function renderUpgrades() {
  if (!upgList) return;
  const bits = [];
  if (unlockedSlots < mySlots.length) {
    bits.push(
      '<button type="button" class="item" data-upg="slot"><span>🔓 Слот вольера</span><span class="price">🪙' +
        UPGRADES.slot[unlockedSlots + 1] +
        "</span></button>"
    );
  }
  if (!treadmillUnlocked) {
    bits.push(
      '<button type="button" class="item" data-upg="tread"><span>👟 Дорожка (без W)</span><span class="price">🪙' +
        UPGRADES.treadUnlock +
        "</span></button>"
    );
  } else if (treadLevel < 5) {
    bits.push(
      '<button type="button" class="item" data-upg="tread"><span>⚡ Дорожка ур.' +
        (treadLevel + 1) +
        '</span><span class="price">🪙' +
        UPGRADES.treadLv[treadLevel + 1] +
        "</span></button>"
    );
  }
  upgList.innerHTML = bits.join("") || "<div style='opacity:.7'>Прокачка макс</div>";
  upgList.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => buyUpgrade(btn.getAttribute("data-upg"));
  });
}

function updatePrompt() {
  let t = "";
  const px = playerMesh.position.x;
  const pz = playerMesh.position.z;
  const onTread =
    px > treadmill.x - treadmill.w / 2 &&
    px < treadmill.x + treadmill.w / 2 &&
    pz > treadmill.z - treadmill.d / 2 &&
    pz < treadmill.z + treadmill.d / 2;

  if (inSafeZone() && carry && freeMySlot()) t = "✅ СЕЙФ — яйцо ставится само!";
  else if (inSafeZone() && carry && !freeMySlot()) t = "Сейф полон — купи слот";
  else if (inSafeZone()) t = "🛡 СЕЙФ — охранники сюда не заходят";
  else if (onTread && !treadmillUnlocked) t = "🔒 Купи дорожку слева в магазине";
  else if (onTread && treadmillUnlocked) t = "👟 Качается скорость (стой, W не нужен)";
  else if (!carry && nearestMarketBot()) t = "E — взять яйцо у доброго бота";
  else if (!carry && nearestSteal()) {
    const w = nearestSteal();
    t = "E — украсть «" + w.def.name + "» · ⚡" + (w.zone.recSpeed || 1) + "+";
  } else if (carry) t = "Неси в зелёный СЕЙФ слева!";
  else if (inMarket()) t = "Рынок: подойди к боту и жми E";

  promptEl.style.display = t ? "block" : "none";
  promptEl.textContent = t;
}

function doAction() {
  if (carry && inSafeZone()) {
    placeEgg();
    return;
  }
  if (!carry) {
    const bot = nearestMarketBot();
    if (bot) {
      takeFromBot(bot);
      return;
    }
    const w = nearestSteal();
    if (w) stealEgg(w);
  }
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
document.getElementById("btnTable").onclick = () => {
  rarityBox.classList.toggle("open");
  if (rarityBox.classList.contains("open")) renderRarityTable();
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
  return { x, z, jump: !!keys.Space };
}

renderShop();
renderUpgrades();
renderRarityTable();
loadGame();
syncTreadVisual();
syncUI();
toast("1) Рынок (синий) — E у бота  2) Неси в зелёный СЕЙФ  3) Там тебя не поймают");

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const input = getInput();
  const carrySlow = carry ? 0.58 : 1;
  const baseSpeed = (9 + Math.min(7, Math.log10(Math.max(10, speedStat)))) * carrySlow * (forceRun ? 1.15 : 1);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const wish = new THREE.Vector3();
  wish.addScaledVector(right, input.x);
  wish.addScaledVector(forward, -input.z);

  if (flingT > 0) flingT -= dt;
  else if (wish.lengthSq() > 0.0001) {
    wish.normalize();
    vel.x = wish.x * baseSpeed;
    vel.z = wish.z * baseSpeed;
    playerMesh.rotation.y = Math.atan2(wish.x, wish.z);
  } else {
    vel.x *= 0.78;
    vel.z *= 0.78;
  }

  if (input.jump && onGround) {
    vel.y = 7.4;
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
  const safe = inSafeZone();

  // Авто-сдача яйца в сейфе
  if (carry && safe && freeMySlot()) {
    autoDepositFlash += dt;
    if (autoDepositFlash > 0.15) {
      placeEgg();
      autoDepositFlash = 0;
    }
  } else autoDepositFlash = 0;

  // Дорожка: просто стой
  const onTread =
    px > treadmill.x - treadmill.w / 2 &&
    px < treadmill.x + treadmill.w / 2 &&
    pz > treadmill.z - treadmill.d / 2 &&
    pz < treadmill.z + treadmill.d / 2;
  if (treadmillUnlocked && onTread) {
    speedStat += (10 + Math.log10(Math.max(10, speedStat)) * 7) * treadLevel * dt;
    treadMesh.material.emissiveIntensity = 0.7;
    treadMesh.material.color.setHex(0xfde68a);
  } else if (treadmillUnlocked) {
    treadMesh.material.emissiveIntensity = 0.2;
    treadMesh.material.color.setHex(0x94a3b8);
  }

  if (carryMesh) {
    carryMesh.position.set(px, 1.55, pz);
    carryMesh.rotation.y += dt * 2.2;
  }

  // Рыночные боты — кружат только на рынке
  marketBots.forEach((b) => {
    b.ang += b.spin * dt;
    b.mesh.position.x = marketZone.x + Math.cos(b.ang) * b.radius;
    b.mesh.position.z = marketZone.z + Math.sin(b.ang) * b.radius;
    b.mesh.rotation.y = b.ang + Math.PI / 2;
    if (b.reload > 0) {
      b.reload -= dt;
      if (b.reload <= 0 && !b.eggMesh) {
        b.def = pickMarketEgg();
        b.eggMesh = makeEggMesh(b.def, 0.7);
        b.eggMesh.position.set(0, 1.85, 0);
        b.mesh.add(b.eggMesh);
      }
    } else if (b.eggMesh) b.eggMesh.rotation.y += dt * 2;
  });

  worldEggs.forEach((w) => {
    if (!w.taken && w.mesh.visible) {
      w.mesh.rotation.y += dt * (w.mesh.userData.spin || 1);
      w.mesh.position.y = 1.05 + Math.sin(now * 0.003 + w.x) * 0.07;
    }
    if (w.taken && w.respawn > 0) {
      w.respawn -= dt;
      if (w.respawn <= 0) {
        w.taken = false;
        w.def = pickWeighted(w.zone.pool);
        scene.remove(w.mesh);
        w.mesh = makeEggMesh(w.def);
        w.mesh.position.set(w.x, 1.05, w.z);
        scene.add(w.mesh);
      }
    }
  });

  mySlots.forEach((s) => {
    if (!s.egg) return;
    if (!s.hatched) {
      s.hatchLeft = Math.max(0, (s.hatchLeft || 0) - dt);
      if (s.mesh) {
        s.mesh.rotation.y += dt * 1.3;
        s.mesh.position.y = 1.05 + Math.sin(now * 0.01) * 0.1;
      }
      if (s.hatchLeft <= 0) hatchSlot(s);
    } else if (s.mesh) {
      s.mesh.rotation.y += dt * 0.9;
    }
  });

  // Охранники: НЕ заходят в сейф и не ловят там
  bosses.forEach((b) => {
    if (carry && carryFromZone === b.zone.id && b.angry && !safe) {
      const d = dist2(px, pz, b.mesh.position.x, b.mesh.position.z);
      if (d < 1.6) {
        flingFrom(b.mesh.position.x, b.mesh.position.z);
        dropCarry("💥 Поймали вне сейфа! Яйцо вернули");
      } else if (d < 24) {
        let nx = b.mesh.position.x + (px - b.mesh.position.x) * dt * 3.4;
        let nz = b.mesh.position.z + (pz - b.mesh.position.z) * dt * 3.4;
        // стоп у границы сейфа
        if (dist2(nx, nz, myZone.x, myZone.z) < myZone.r + 1.2) {
          const ang = Math.atan2(nz - myZone.z, nx - myZone.x);
          nx = myZone.x + Math.cos(ang) * (myZone.r + 1.3);
          nz = myZone.z + Math.sin(ang) * (myZone.r + 1.3);
        }
        // не в рынок глубоко
        b.mesh.position.x = nx;
        b.mesh.position.z = nz;
        b.mesh.rotation.y = Math.atan2(px - b.mesh.position.x, pz - b.mesh.position.z);
      }
    } else {
      b.mesh.position.x += (b.homeX - b.mesh.position.x) * dt * 2;
      b.mesh.position.z += (b.homeZ - b.mesh.position.z) * dt * 2;
      if (safe && b.angry) b.angry = false;
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
    alarmEl.style.opacity = String(0.2 + 0.35 * Math.abs(Math.sin(now * 0.012)));
    if (alarmT <= 0 || safe) alarmEl.style.display = "none";
  }

  orbit.follow(playerMesh.position);
  updatePrompt();
  syncUI();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
