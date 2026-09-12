/**
 * Сценарий: осень — дубы/клёны fall, грибы, скалы (Kenney Nature Kit CC0).
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";
import { loadMany, place, makeGround, makeLights, makePlayer } from "../shared/kenney-nature/kit.js";

window.__AMAL_NO_WORLD__ = true;
const SAVE = "amal-nature-fall-v1";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd4a574);
scene.fog = new THREE.Fog(0xc48a5a, 25, 80);
makeLights(scene);
makeGround(scene, 0x8b7355);

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

let score = 0;
let gatherLv = 0;
let basketLv = 0;
const picks = [];

try {
  const d = JSON.parse(localStorage.getItem(SAVE) || "null");
  if (d) {
    score = d.score || 0;
    gatherLv = d.gatherLv || 0;
    basketLv = d.basketLv || 0;
  }
} catch (_) {}

function save() {
  localStorage.setItem(SAVE, JSON.stringify({ score, gatherLv, basketLv }));
}

const FILES = [
  "tree_oak_fall.glb",
  "tree_tall_fall.glb",
  "tree_oak.glb",
  "mushroom_red.glb",
  "mushroom_tan.glb",
  "rock_largeA.glb",
  "rock_tallA.glb",
  "cliff_stone.glb",
  "stump_old.glb",
  "log_large.glb",
  "plant_bushLarge.glb",
  "bed.glb",
  "sign.glb",
  "path_stone.glb",
];

toast("Загрузка Kenney Nature Kit…");
const models = await loadMany(FILES);

place(models["cliff_stone.glb"], scene, -18, -8, 1.05, 0.6);
place(models["rock_tallA.glb"], scene, 16, 10, 1, -0.3);
place(models["bed.glb"], scene, 0, -2, 1, 0.2);
place(models["sign.glb"], scene, 2, 0, 1, -0.4);
place(models["path_stone.glb"], scene, 0, 3, 1, 0);
place(models["stump_old.glb"], scene, -3, 2, 1, 0);
place(models["log_large.glb"], scene, 5, -4, 1, 1.1);

for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const r = 9 + (i % 5) * 2.2;
  const fall = i % 2 ? "tree_oak_fall.glb" : "tree_tall_fall.glb";
  place(models[fall] || models["tree_oak.glb"], scene, Math.cos(a) * r, Math.sin(a) * r, 0.95 + (i % 3) * 0.1, a);
}
for (let i = 0; i < 7; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 6 + Math.random() * 14;
  place(models["rock_largeA.glb"], scene, Math.cos(a) * r, Math.sin(a) * r, 0.85, a);
  place(models["plant_bushLarge.glb"], scene, Math.cos(a + 0.3) * (r + 1.5), Math.sin(a + 0.3) * (r + 1.5), 1, 0);
}

for (let i = 0; i < 12; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 4 + Math.random() * 16;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  const kind = i % 3 === 0 ? "mushroom_tan.glb" : "mushroom_red.glb";
  const m = place(models[kind], scene, x, z, 1.1 + Math.random() * 0.4, a);
  if (m) picks.push({ mesh: m, x, z, kind: kind.includes("tan") ? "tan" : "red", hp: 1, respawn: 0 });
}

const player = makePlayer();
player.position.set(1, 0, 5);
scene.add(player);
const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 11,
  pitch: 0.48,
  yaw: -0.15,
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
  document.getElementById("score").textContent = Math.floor(score);
  document.getElementById("basket").textContent = basketLv;
}
function renderUp() {
  const ups = document.getElementById("ups");
  const c1 = 14 + gatherLv * 16;
  const c2 = 20 + basketLv * 24;
  ups.innerHTML =
    '<button type="button" data-u="g">🍄 Сбор ур.' +
    gatherLv +
    " · 🍄" +
    c1 +
    "</button>" +
    '<button type="button" data-u="b">🧺 Корзина ур.' +
    basketLv +
    " · 🍄" +
    c2 +
    "</button>";
  ups.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      if (b.getAttribute("data-u") === "g") {
        if (score < c1) return toast("Мало грибов");
        score -= c1;
        gatherLv++;
        toast("Сбор лучше");
      } else {
        if (score < c2) return toast("Мало грибов");
        score -= c2;
        basketLv++;
        toast("Корзина больше · пассив +" + basketLv);
      }
      save();
      sync();
      renderUp();
    };
  });
}

function nearest() {
  let best = null;
  let bestD = 2.5;
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
  const got = Math.round((p.kind === "red" ? 6 : 4) * (1 + gatherLv * 0.4));
  score += got;
  toast("🍄 +" + got);
  p.mesh.visible = false;
  p.respawn = 12;
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
toast("Осень Kenney: E — грибы · качай корзину");

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
  player.position.x = Math.max(-38, Math.min(38, player.position.x));
  player.position.z = Math.max(-38, Math.min(38, player.position.z));

  picks.forEach((p) => {
    if (p.respawn > 0) {
      p.respawn -= dt;
      if (p.respawn <= 0) p.mesh.visible = true;
    }
  });

  incomeAcc += dt;
  if (incomeAcc >= 1) {
    incomeAcc = 0;
    if (basketLv) {
      score += basketLv;
      sync();
      save();
    }
  }

  const n = nearest();
  promptEl.style.display = n ? "block" : "none";
  promptEl.textContent = n ? "E — сорвать гриб" : "";

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }

  orbit.follow(player.position);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
