/**
 * Сценарий: река — каноэ, мосты, лилии, водопад (Kenney Nature Kit CC0).
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";
import { loadMany, place, makeLights, makePlayer } from "../shared/kenney-nature/kit.js";

window.__AMAL_NO_WORLD__ = true;
const SAVE = "amal-nature-river-v1";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec8e3);
scene.fog = new THREE.Fog(0x9ad4e8, 28, 85);
makeLights(scene);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 22),
  new THREE.MeshStandardMaterial({ color: 0x2a8fc9, metalness: 0.15, roughness: 0.35 })
);
water.rotation.x = -Math.PI / 2;
water.position.set(0, -0.05, 0);
water.receiveShadow = true;
scene.add(water);

const bankMat = new THREE.MeshStandardMaterial({ color: 0x5a9a5a, roughness: 0.95 });
[-14, 14].forEach((z) => {
  const bank = new THREE.Mesh(new THREE.BoxGeometry(90, 0.4, 18), bankMat);
  bank.position.set(0, 0.1, z);
  bank.receiveShadow = true;
  scene.add(bank);
});

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
let bridgeLv = 0;
const picks = [];

try {
  const d = JSON.parse(localStorage.getItem(SAVE) || "null");
  if (d) {
    score = d.score || 0;
    gatherLv = d.gatherLv || 0;
    bridgeLv = d.bridgeLv || 0;
  }
} catch (_) {}

function save() {
  localStorage.setItem(SAVE, JSON.stringify({ score, gatherLv, bridgeLv }));
}

const FILES = [
  "canoe.glb",
  "canoe_paddle.glb",
  "bridge_wood.glb",
  "bridge_stone.glb",
  "lily_large.glb",
  "cliff_waterfall_stone.glb",
  "cliff_stone.glb",
  "tree_palm.glb",
  "tree_palmShort.glb",
  "platform_beach.glb",
  "rock_largeA.glb",
  "plant_bush.glb",
  "path_wood.glb",
  "fence_gate.glb",
];

toast("Загрузка Kenney Nature Kit…");
const models = await loadMany(FILES);

place(models["cliff_waterfall_stone.glb"], scene, -28, 0, 1.1, Math.PI / 2);
place(models["cliff_stone.glb"], scene, 28, 2, 1, -0.4);
place(models["bridge_wood.glb"], scene, -6, 0, 1.2, 0);
place(models["bridge_stone.glb"], scene, 8, 0, 1.1, 0);
place(models["canoe.glb"], scene, 0, 2.5, 1.15, 0.2);
place(models["canoe_paddle.glb"], scene, 1.2, 3.2, 1, 0.5);
place(models["platform_beach.glb"], scene, 2, 11, 1.1, 0);
place(models["path_wood.glb"], scene, 2, 8, 1, 0);
place(models["fence_gate.glb"], scene, -2, 10, 1, 0);

for (let i = 0; i < 12; i++) {
  const x = -22 + i * 4;
  const palm = i % 2 ? "tree_palm.glb" : "tree_palmShort.glb";
  place(models[palm], scene, x, 12 + (i % 3), 0.95 + (i % 2) * 0.1, i * 0.4);
  place(models[palm], scene, x + 1, -12 - (i % 2), 0.9, -i * 0.3);
}
for (let i = 0; i < 6; i++) {
  place(models["rock_largeA.glb"], scene, -18 + i * 7, 10 + (i % 2), 0.85, i);
  place(models["plant_bush.glb"], scene, -16 + i * 6.5, -11, 1, 0);
}

for (let i = 0; i < 14; i++) {
  const x = -20 + Math.random() * 40;
  const z = -6 + Math.random() * 12;
  const m = place(models["lily_large.glb"], scene, x, z, 0.9 + Math.random() * 0.3, Math.random() * 6);
  if (m) {
    m.position.y = 0.02;
    picks.push({ mesh: m, x, z, kind: "lily", hp: 1, respawn: 0 });
  }
}

const player = makePlayer();
player.position.set(2, 0, 9);
scene.add(player);
const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 12,
  pitch: 0.5,
  yaw: 0.1,
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

function sync() {
  document.getElementById("score").textContent = Math.floor(score);
  document.getElementById("bridge").textContent = bridgeLv;
}
function renderUp() {
  const ups = document.getElementById("ups");
  const c1 = 12 + gatherLv * 14;
  const c2 = 18 + bridgeLv * 22;
  ups.innerHTML =
    '<button type="button" data-u="g">🌸 Сбор ур.' +
    gatherLv +
    " · 🌸" +
    c1 +
    "</button>" +
    '<button type="button" data-u="b">🌉 Мост ур.' +
    bridgeLv +
    " · 🌸" +
    c2 +
    "</button>";
  ups.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      if (b.getAttribute("data-u") === "g") {
        if (score < c1) return toast("Мало лилий");
        score -= c1;
        gatherLv++;
        toast("Сбор быстрее");
      } else {
        if (score < c2) return toast("Мало лилий");
        score -= c2;
        bridgeLv++;
        toast("Река спокойнее · доход +" + bridgeLv);
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
  const got = Math.round(5 * (1 + gatherLv * 0.4));
  score += got;
  toast("🌸 +" + got);
  p.mesh.visible = false;
  p.respawn = 10;
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
toast("Река Kenney: E — собирать лилии · качай мост");

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
    player.position.x += wish.x * 8.5 * dt;
    player.position.z += wish.z * 8.5 * dt;
    player.rotation.y = Math.atan2(wish.x, wish.z);
  }
  player.position.x = Math.max(-36, Math.min(36, player.position.x));
  player.position.z = Math.max(-18, Math.min(18, player.position.z));

  picks.forEach((p) => {
    if (p.respawn > 0) {
      p.respawn -= dt;
      if (p.respawn <= 0) p.mesh.visible = true;
    }
  });

  incomeAcc += dt;
  if (incomeAcc >= 1) {
    incomeAcc = 0;
    if (bridgeLv) {
      score += bridgeLv;
      sync();
      save();
    }
  }

  const n = nearest();
  promptEl.style.display = n ? "block" : "none";
  promptEl.textContent = n ? "E — сорвать лилию" : "";

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }

  orbit.follow(player.position);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
