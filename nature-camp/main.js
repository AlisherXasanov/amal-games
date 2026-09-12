/**
 * Сценарий: лагерь — палатки, костёр, брёвна (модели Kenney Nature Kit CC0).
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";
import { loadMany, place, makeGround, makeLights, makePlayer } from "../shared/kenney-nature/kit.js";

window.__AMAL_NO_WORLD__ = true;
const SAVE = "amal-nature-camp-v1";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0xa8d4e8, 30, 90);
makeLights(scene);
makeGround(scene, 0x4a7c59);

const camera = new THREE.PerspectiveCamera(55, innerWidth / Math.max(1, innerHeight), 0.1, 160);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const toastEl = document.getElementById("toast");
const promptEl = document.getElementById("prompt");
let toastT = 0;
function toast(m) {
  toastEl.textContent = m;
  toastEl.style.display = "block";
  toastT = 2;
}

let wood = 0;
let cozy = 0;
let gatherLv = 0;
let campLv = 0;
const picks = [];

try {
  const d = JSON.parse(localStorage.getItem(SAVE) || "null");
  if (d) {
    wood = d.wood || 0;
    cozy = d.cozy || 0;
    gatherLv = d.gatherLv || 0;
    campLv = d.campLv || 0;
  }
} catch (_) {}

function save() {
  localStorage.setItem(SAVE, JSON.stringify({ wood, cozy, gatherLv, campLv }));
}

const FILES = [
  "tent_detailedOpen.glb",
  "tent_smallOpen.glb",
  "campfire_stones.glb",
  "campfire_logs.glb",
  "log.glb",
  "log_large.glb",
  "tree_pineTallA.glb",
  "tree_pineTallB.glb",
  "tree_pineDefaultA.glb",
  "rock_largeA.glb",
  "rock_smallA.glb",
  "plant_bush.glb",
  "stump_round.glb",
  "sign.glb",
  "path_stone.glb",
  "platform_grass.glb",
];

toast("Загрузка Kenney Nature Kit…");
const models = await loadMany(FILES);

place(models["platform_grass.glb"], scene, 0, 0, 1.2, 0);
place(models["campfire_stones.glb"], scene, 0, 0.5, 1.2, 0);
place(models["campfire_logs.glb"], scene, 0.2, 0.4, 1, 0.3);
place(models["tent_detailedOpen.glb"], scene, -4, 1, 1.1, 0.4);
place(models["tent_smallOpen.glb"], scene, 4, -1, 1, -0.5);
place(models["sign.glb"], scene, -1.5, 3, 1, 0);
place(models["path_stone.glb"], scene, 0, 5, 1, 0);

for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2;
  const r = 10 + (i % 4) * 2.5;
  const pine = i % 2 ? "tree_pineTallA.glb" : "tree_pineTallB.glb";
  place(models[pine] || models["tree_pineDefaultA.glb"], scene, Math.cos(a) * r, Math.sin(a) * r, 0.9 + (i % 3) * 0.15, a);
}
for (let i = 0; i < 8; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 7 + Math.random() * 12;
  place(models["rock_largeA.glb"] || models["rock_smallA.glb"], scene, Math.cos(a) * r, Math.sin(a) * r, 0.8, a);
  place(models["plant_bush.glb"], scene, Math.cos(a + 0.2) * (r + 1), Math.sin(a + 0.2) * (r + 1), 1, 0);
}

// collectible logs
for (let i = 0; i < 10; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 6 + Math.random() * 14;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  const m = place(models["log.glb"] || models["log_large.glb"], scene, x, z, 0.9, a);
  if (m) picks.push({ mesh: m, x, z, kind: "log", hp: 2, respawn: 0 });
}
for (let i = 0; i < 5; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 10;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  const m = place(models["stump_round.glb"], scene, x, z, 1, 0);
  if (m) picks.push({ mesh: m, x, z, kind: "stump", hp: 3, respawn: 0 });
}

const player = makePlayer();
player.position.set(2, 0, 4);
scene.add(player);
const vel = new THREE.Vector3();
const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 11,
  pitch: 0.48,
  yaw: 0.2,
  lookOffsetY: 1.2,
  minDist: 5,
  maxDist: 22,
  lerp: 0.18,
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function sync() {
  document.getElementById("wood").textContent = Math.floor(wood);
  document.getElementById("cozy").textContent = cozy + campLv * 2;
}
function renderUp() {
  const ups = document.getElementById("ups");
  const c1 = 15 + gatherLv * 18;
  const c2 = 20 + campLv * 25;
  ups.innerHTML =
    '<button type="button" data-u="g">🪓 Сбор ур.' +
    gatherLv +
    " · 🪵" +
    c1 +
    "</button>" +
    '<button type="button" data-u="c">🔥 Уют лагеря ур.' +
    campLv +
    " · 🪵" +
    c2 +
    "</button>";
  ups.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      if (b.getAttribute("data-u") === "g") {
        if (wood < c1) return toast("Мало дров");
        wood -= c1;
        gatherLv++;
        toast("Сбор сильнее");
      } else {
        if (wood < c2) return toast("Мало дров");
        wood -= c2;
        campLv++;
        cozy += 2;
        toast("Лагерь уютнее");
      }
      save();
      sync();
      renderUp();
    };
  });
}

function nearest() {
  let best = null;
  let bestD = 2.6;
  picks.forEach((p) => {
    if (p.respawn > 0 || !p.mesh.visible) return;
    const d = Math.hypot(player.position.x - p.x, player.position.z - p.z);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  });
  return best;
}

function gather() {
  const p = nearest();
  if (!p) return;
  p.hp--;
  const got = Math.round((p.kind === "log" ? 4 : 6) * (1 + gatherLv * 0.35));
  wood += got;
  toast("🪵 +" + got);
  if (p.hp <= 0) {
    p.mesh.visible = false;
    p.respawn = 14;
    p.hp = p.kind === "log" ? 2 : 3;
  }
  save();
  sync();
}

const keys = Object.create(null);
addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyE") gather();
});
addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
document.getElementById("btn-e").onclick = gather;

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
  stick.x = stick.y = 0;
  knob.style.transform = "translate(0,0)";
});

sync();
renderUp();
toast("Лагерь Kenney: E — рубить брёвна · качай уют");

let incomeAcc = 0;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  let ix = 0;
  let iz = 0;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (keys.KeyW || keys.ArrowUp) iz -= 1;
  if (keys.KeyS || keys.ArrowDown) iz += 1;
  if (stick.active) {
    ix += stick.x;
    iz += stick.y;
  }
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const wish = new THREE.Vector3();
  wish.addScaledVector(right, ix);
  wish.addScaledVector(forward, -iz);
  if (wish.lengthSq() > 0.001) {
    wish.normalize();
    player.position.x += wish.x * 8 * dt;
    player.position.z += wish.z * 8 * dt;
    player.rotation.y = Math.atan2(wish.x, wish.z);
  }
  player.position.x = Math.max(-40, Math.min(40, player.position.x));
  player.position.z = Math.max(-40, Math.min(40, player.position.z));

  picks.forEach((p) => {
    if (p.respawn > 0) {
      p.respawn -= dt;
      if (p.respawn <= 0) p.mesh.visible = true;
    }
  });

  incomeAcc += dt;
  if (incomeAcc >= 1) {
    incomeAcc = 0;
    const add = campLv;
    if (add) {
      wood += add;
      sync();
      save();
    }
  }

  const n = nearest();
  promptEl.style.display = n ? "block" : "none";
  promptEl.textContent = n ? "E — взять дрова" : "";

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }

  orbit.follow(player.position);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
