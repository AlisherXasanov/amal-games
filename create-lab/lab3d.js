import * as THREE from "three";

const STORAGE = "amal-3d-lab-world-v1";
const canvas = document.getElementById("lab-canvas");
const toastEl = document.getElementById("lab-toast");
const powerSlider = document.getElementById("lab-power");
const powerVal = document.getElementById("lab-power-val");

let tool = "block";
let powerMult = 1000;
let worldObjects = [];
let guys = [];

function toast(m) {
  toastEl.textContent = m;
  toastEl.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function isOwner() {
  try {
    if (window.__AMAL_OWNER__ || window.__AMAL_GOD__) return true;
    if (["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"].some((k) => localStorage.getItem(k) === "1")) return true;
    if (new URLSearchParams(location.search).get("owner")) return true;
  } catch (_) {}
  return false;
}

if (!isOwner()) powerSlider.value = 100;
powerMult = Number(powerSlider.value);
powerVal.textContent = String(powerMult);
powerSlider.oninput = () => {
  powerMult = Number(powerSlider.value);
  powerVal.textContent = String(powerMult);
};

document.querySelectorAll("[data-tool]").forEach((btn) => {
  btn.onclick = () => {
    tool = btn.dataset.tool;
    document.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b === btn));
  };
});

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec8e8);
scene.fog = new THREE.Fog(0x7ec8e8, 40, 120);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
camera.position.set(12, 14, 16);

const sun = new THREE.DirectionalLight(0xfff4e0, 1.1);
sun.position.set(10, 20, 8);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.85));

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(40, 1, 40),
  new THREE.MeshLambertMaterial({ color: 0x5ecf6a })
);
ground.position.y = -0.5;
scene.add(ground);

const grid = new THREE.GridHelper(40, 40, 0xffffff, 0xffffff);
grid.material.opacity = 0.25;
grid.material.transparent = true;
grid.position.y = 0.01;
scene.add(grid);

const player = new THREE.Group();
const pBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.9, 1.1, 0.5),
  new THREE.MeshLambertMaterial({ color: 0xfacc15 })
);
pBody.position.y = 1.05;
player.add(pBody);
const pHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.75, 0.75, 0.75),
  new THREE.MeshLambertMaterial({ color: 0xffe082 })
);
pHead.position.y = 2;
player.add(pHead);
player.position.set(0, 0, 0);
scene.add(player);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const keys = Object.create(null);
window.addEventListener("keydown", (e) => { keys[e.code] = true; });
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

function snap(v) { return Math.round(v); }

function addBlock(x, y, z, color, big = false) {
  const s = big ? 4 : 1;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(s, big ? 0.4 : s, s),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(color) })
  );
  m.position.set(snap(x), big ? 0.2 : snap(y) + s * 0.5, snap(z));
  m.userData.lab = { type: big ? "floor" : "block", color };
  scene.add(m);
  worldObjects.push(m);
  return m;
}

function addGuy(x, z, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.1, 0.5),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(color) })
  );
  body.position.y = 1.05;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.MeshLambertMaterial({ color: 0xffe082 })
  );
  head.position.y = 1.85;
  g.add(head);
  g.position.set(snap(x), 0, snap(z));
  g.userData.lab = { type: "guy", color, hp: 100 };
  scene.add(g);
  worldObjects.push(g);
  guys.push(g);
  return g;
}

function pickGround() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([ground, ...worldObjects.filter((o) => o.userData.lab)], false);
  return hits[0] || null;
}

function onPointer(ev) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  const hit = pickGround();
  if (!hit) return;
  const p = hit.point;
  const color = document.getElementById("lab-color").value;

  if (tool === "erase") {
    if (hit.object !== ground && hit.object.userData.lab) {
      scene.remove(hit.object);
      worldObjects = worldObjects.filter((o) => o !== hit.object);
      guys = guys.filter((g) => g !== hit.object);
      toast("Удалено");
    }
    return;
  }
  if (tool === "floor") {
    addBlock(p.x, 0, p.z, color, true);
    toast("Пол");
    return;
  }
  if (tool === "guy") {
    addGuy(p.x, p.z, color);
    toast("Герой");
    return;
  }
  addBlock(p.x, 1, p.z, color, false);
  toast("Блок");
}

canvas.addEventListener("pointerdown", onPointer);

function saveWorld() {
  const data = worldObjects.map((o) => {
    const d = o.userData.lab;
    return {
      type: d.type,
      color: d.color,
      x: o.position.x,
      y: o.position.y,
      z: o.position.z
    };
  });
  localStorage.setItem(STORAGE, JSON.stringify({ power: powerMult, objects: data }));
  toast("Мир сохранён в браузере");
}

function loadWorld() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) { toast("Нет сохранения"); return; }
    const data = JSON.parse(raw);
    worldObjects.forEach((o) => scene.remove(o));
    worldObjects = [];
    guys = [];
    if (data.power) {
      powerSlider.value = data.power;
      powerMult = data.power;
      powerVal.textContent = String(powerMult);
    }
    for (const o of data.objects || []) {
      if (o.type === "guy") addGuy(o.x, o.z, o.color);
      else if (o.type === "floor") {
        const m = addBlock(o.x, 0, o.z, o.color, true);
        m.position.set(o.x, o.y, o.z);
      } else {
        const m = addBlock(o.x, o.y - 0.5, o.z, o.color, false);
        m.position.set(o.x, o.y, o.z);
      }
    }
    toast("Мир загружен");
  } catch (_) {
    toast("Ошибка загрузки");
  }
}

function clearWorld() {
  worldObjects.forEach((o) => scene.remove(o));
  worldObjects = [];
  guys = [];
  toast("Очищено");
}

document.getElementById("lab-save").onclick = saveWorld;
document.getElementById("lab-load").onclick = loadWorld;
document.getElementById("lab-clear").onclick = clearWorld;

let atkCd = 0;
function megaBlast() {
  const dmg = 50 * powerMult;
  toast(`Удар ×${powerMult} (−${dmg})`);
  for (let i = guys.length - 1; i >= 0; i--) {
    const g = guys[i];
    if (player.position.distanceTo(g.position) < 8 + powerMult * 0.002) {
      g.userData.lab.hp -= dmg;
      g.scale.setScalar(0.5 + Math.max(0, g.userData.lab.hp / 100) * 0.5);
      if (g.userData.lab.hp <= 0) {
        scene.remove(g);
        worldObjects = worldObjects.filter((o) => o !== g);
        guys.splice(i, 1);
      }
    }
  }
  for (const o of worldObjects) {
    if (o.userData.lab?.type === "block" && player.position.distanceTo(o.position) < 6) {
      scene.remove(o);
      worldObjects = worldObjects.filter((x) => x !== o);
    }
  }
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let camYaw = 0.6;
let camPitch = 0.45;
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  atkCd = Math.max(0, atkCd - dt);

  let mx = 0, mz = 0;
  if (keys.KeyW) mz -= 1;
  if (keys.KeyS) mz += 1;
  if (keys.KeyA) mx -= 1;
  if (keys.KeyD) mx += 1;
  const L = Math.hypot(mx, mz) || 1;
  const spd = (8 + powerMult * 0.003) * dt;
  player.position.x += (mx / L) * spd;
  player.position.z += (mz / L) * spd;
  player.position.y = Math.abs(Math.sin(now * 0.012)) * (mx || mz ? 0.06 : 0);
  if (mx || mz) player.rotation.y = Math.atan2(mx, mz);

  if (keys.KeyQ) camPitch = Math.min(1.2, camPitch + dt);
  if (keys.KeyE) camPitch = Math.max(0.15, camPitch - dt);
  if (keys.ArrowLeft) camYaw -= dt;
  if (keys.ArrowRight) camYaw += dt;

  if (keys.Space && atkCd <= 0) {
    atkCd = 0; // без перезарядки
    megaBlast();
  }

  const dist = 14;
  camera.position.set(
    player.position.x + Math.sin(camYaw) * Math.cos(camPitch) * dist,
    player.position.y + Math.sin(camPitch) * dist + 8,
    player.position.z + Math.cos(camYaw) * Math.cos(camPitch) * dist
  );
  camera.lookAt(player.position.x, 1.2, player.position.z);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

toast(isOwner() ? "3D Lab · сила до ×10000 · без перезарядки" : "3D Lab · строй свою игру");
