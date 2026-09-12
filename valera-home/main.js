/**
 * Дом Валеры 3D — комнаты, мебель Kenney, свой телефон,
 * брать вещи кликом, двигать стрелками, рисовать предметы.
 */
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

window.__AMAL_NO_WORLD__ = true;

const FURN = "../shared/kenney-furniture/Models/";
const toastEl = document.getElementById("toast");
const heldEl = document.getElementById("held");
let toastT = 0;
function toast(m) {
  toastEl.textContent = m;
  toastEl.style.display = "block";
  toastT = 2.2;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b7e0);
scene.fog = new THREE.Fog(0x87b7e0, 18, 42);

const camera = new THREE.PerspectiveCamera(60, innerWidth / Math.max(1, innerHeight), 0.1, 80);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.domElement.id = "game";
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xfff1c1, 1.05);
sun.position.set(8, 14, 6);
scene.add(sun);

const floorMat = new THREE.MeshLambertMaterial({ color: 0xc4a574 });
const wallMat = new THREE.MeshLambertMaterial({ color: 0xf3e8d8 });
const wallMat2 = new THREE.MeshLambertMaterial({ color: 0xdbeafe });
const wallMat3 = new THREE.MeshLambertMaterial({ color: 0xfce7f3 });

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

// House footprint: 3 rooms
box(14, 0.2, 10, floorMat, 0, 0, 0);
// walls outer
box(14.2, 3, 0.2, wallMat, 0, 1.5, -5);
box(14.2, 3, 0.2, wallMat, 0, 1.5, 5);
box(0.2, 3, 10.2, wallMat, -7, 1.5, 0);
box(0.2, 3, 10.2, wallMat, 7, 1.5, 0);
// room dividers (door gaps)
box(0.2, 3, 3.2, wallMat2, -2, 1.5, -3.4);
box(0.2, 3, 3.2, wallMat2, -2, 1.5, 3.4);
box(0.2, 3, 3.2, wallMat3, 2.5, 1.5, -3.4);
box(0.2, 3, 3.2, wallMat3, 2.5, 1.5, 3.4);
// roof flat
box(14.4, 0.15, 10.4, new THREE.MeshLambertMaterial({ color: 0xb45309 }), 0, 3.1, 0);

// labels
function makeLabel(text, x, z) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(15,23,42,0.75)";
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = "#fde68a";
  g.font = "bold 28px sans-serif";
  g.fillText(text, 16, 42);
  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  mesh.position.set(x, 2.6, z);
  mesh.rotation.y = Math.PI;
  scene.add(mesh);
}
makeLabel("Гостиная", -4.5, -4.6);
makeLabel("Кухня", 0.2, -4.6);
makeLabel("Комната Валеры", 4.8, -4.6);

/** Смартфон для Валеры (свой меш — в паке мебели телефона не было) */
function makePhone() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.04, 0.42),
    new THREE.MeshLambertMaterial({ color: 0x111827 })
  );
  g.add(body);
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.01, 0.34),
    new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.35 })
  );
  screen.position.y = 0.025;
  g.add(screen);
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 10), new THREE.MeshLambertMaterial({ color: 0x334155 }));
  cam.rotation.x = Math.PI / 2;
  cam.position.set(0.06, 0.03, -0.15);
  g.add(cam);
  g.userData.pickable = true;
  g.userData.name = "Телефон Валеры";
  g.userData.kind = "phone";
  return g;
}

/** Валера — другой цвет (жёлто-рыжий), не как обычные NPC */
function makeValera() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 8), new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
  body.position.y = 0.7;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshLambertMaterial({ color: 0xfde68a }));
  head.position.y = 1.35;
  g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), new THREE.MeshLambertMaterial({ color: 0xb45309 }));
  hair.position.y = 1.48;
  hair.scale.set(1, 0.55, 1);
  g.add(hair);
  // eyes
  const eyeM = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeM);
  e1.position.set(-0.09, 1.38, 0.22);
  const e2 = e1.clone();
  e2.position.x = 0.09;
  g.add(e1, e2);
  g.userData.isValera = true;
  return g;
}

const pickables = [];
const player = { x: 0, z: 3.5, yaw: Math.PI, speed: 4.2 };
const keys = {};
let held = null;
let heldOffset = new THREE.Vector3(0.5, 0.9, 0);

const valera = makeValera();
valera.position.set(4.5, 0, 0.5);
scene.add(valera);

const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
mtlLoader.setPath(FURN);
objLoader.setPath(FURN);

async function loadFurniture(name, x, z, scale, rotY, label) {
  try {
    const mats = await mtlLoader.loadAsync(name + ".mtl");
    mats.preload();
    objLoader.setMaterials(mats);
    const obj = await objLoader.loadAsync(name + ".obj");
    obj.scale.setScalar(scale || 1);
    obj.position.set(x, 0, z);
    if (rotY) obj.rotation.y = rotY;
    obj.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = false;
        c.userData.pickable = true;
        c.userData.name = label || name;
        c.userData.root = obj;
      }
    });
    obj.userData.pickable = true;
    obj.userData.name = label || name;
    obj.userData.kind = "furniture";
    scene.add(obj);
    pickables.push(obj);
    return obj;
  } catch (e) {
    console.warn("furn miss", name, e);
    // fallback box
    const m = box(0.8, 0.6, 0.8, new THREE.MeshLambertMaterial({ color: 0x92400e }), x, 0.3, z);
    m.userData.pickable = true;
    m.userData.name = label || name;
    pickables.push(m);
    return m;
  }
}

function addPickable(mesh, x, y, z, name, kind) {
  mesh.position.set(x, y, z);
  mesh.userData.pickable = true;
  mesh.userData.name = name;
  mesh.userData.kind = kind || "item";
  scene.add(mesh);
  pickables.push(mesh);
  return mesh;
}

toast("Собираем дом Валеры…");

await Promise.all([
  loadFurniture("loungeSofa", -4.5, -2.5, 1, Math.PI, "Диван"),
  loadFurniture("tableCoffee", -4.2, -0.8, 1, 0, "Столик"),
  loadFurniture("televisionModern", -4.5, 3.2, 1, Math.PI, "ТВ"),
  loadFurniture("kitchenFridge", 0.2, -3.5, 1, 0, "Холодильник"),
  loadFurniture("table", 0.3, 0.2, 1, 0, "Кухонный стол"),
  loadFurniture("chair", 0.3, 1.2, 1, Math.PI, "Стул"),
  loadFurniture("bedSingle", 5.2, -2.8, 1, Math.PI / 2, "Кровать"),
  loadFurniture("desk", 5.0, 2.2, 1, Math.PI, "Стол Валеры"),
  loadFurniture("chairDesk", 5.0, 1.2, 1, 0, "Кресло"),
  loadFurniture("bookcaseOpen", 3.3, 3.5, 1, Math.PI / 2, "Полка"),
  loadFurniture("laptop", 5.0, 2.0, 1, 0, "Ноутбук"),
  loadFurniture("radio", -3.2, -0.5, 1, 0, "Радио"),
  loadFurniture("plantSmall2", 6.2, 3.2, 1, 0, "Цветок"),
  loadFurniture("lampRoundFloor", 3.6, -3.5, 1, 0, "Лампа"),
]);

// Phone on Valera's desk
const phone = makePhone();
addPickable(phone, 4.7, 0.85, 2.15, "Телефон Валеры", "phone");
phone.rotation.y = 0.4;

// small movable toys
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshLambertMaterial({ color: 0x22c55e }));
addPickable(ball, -3.5, 0.18, 1.5, "Мячик", "toy");
const book = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.35), new THREE.MeshLambertMaterial({ color: 0x7c3aed }));
addPickable(book, 4.4, 0.9, 2.0, "Книжка", "toy");

toast("Дом готов! Кликни вещь · стрелки двигают");

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function findPickRoot(obj) {
  let o = obj;
  while (o) {
    if (o.userData && o.userData.pickable && pickables.includes(o)) return o;
    if (o.userData && o.userData.root && pickables.includes(o.userData.root)) return o.userData.root;
    o = o.parent;
  }
  return null;
}

function setHeld(obj) {
  if (held) {
    held.userData.held = false;
  }
  held = obj;
  if (held) {
    held.userData.held = true;
    heldEl.textContent = "в руках: " + (held.userData.name || "вещь");
    toast("Взял: " + held.userData.name + " · стрелки двигают");
    if (held.userData.kind === "phone") toast("Телефон Валеры! Можно носить по комнатам");
  } else {
    heldEl.textContent = "в руках: ничего";
  }
}

function dropHeld() {
  if (!held) return toast("Пусто");
  held.position.y = held.userData.kind === "phone" || held.userData.kind === "toy" ? Math.max(0.05, held.position.y) : 0;
  if (held.userData.kind === "furniture") held.position.y = 0;
  toast("Поставил: " + held.userData.name);
  setHeld(null);
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(pickables, true);
  if (!hits.length) return;
  const root = findPickRoot(hits[0].object);
  if (!root) return;
  if (held === root) {
    dropHeld();
    return;
  }
  setHeld(root);
});

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyE") dropHeld();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
document.getElementById("btn-drop").onclick = dropHeld;

// draw item
const drawUI = document.getElementById("draw");
const paint = document.getElementById("paint");
const pctx = paint.getContext("2d");
pctx.fillStyle = "#ffffff";
pctx.fillRect(0, 0, paint.width, paint.height);
pctx.strokeStyle = "#111827";
pctx.lineWidth = 4;
pctx.lineCap = "round";
let painting = false;
function paintAt(ev) {
  const r = paint.getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width) * paint.width;
  const y = ((ev.clientY - r.top) / r.height) * paint.height;
  pctx.lineTo(x, y);
  pctx.stroke();
}
paint.addEventListener("pointerdown", (e) => {
  painting = true;
  paint.setPointerCapture(e.pointerId);
  const r = paint.getBoundingClientRect();
  pctx.beginPath();
  pctx.moveTo(((e.clientX - r.left) / r.width) * paint.width, ((e.clientY - r.top) / r.height) * paint.height);
});
paint.addEventListener("pointermove", (e) => {
  if (painting) paintAt(e);
});
paint.addEventListener("pointerup", () => {
  painting = false;
});
document.getElementById("btn-draw").onclick = () => {
  drawUI.style.display = "flex";
};
document.getElementById("paint-x").onclick = () => {
  drawUI.style.display = "none";
};
document.getElementById("paint-clear").onclick = () => {
  pctx.fillStyle = "#fff";
  pctx.fillRect(0, 0, paint.width, paint.height);
};
document.getElementById("paint-ok").onclick = () => {
  const tex = new THREE.CanvasTexture(paint);
  tex.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.5),
    new THREE.MeshLambertMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  );
  addPickable(plane, player.x, 0.9, player.z - 0.8, "Рисунок", "draw");
  setHeld(plane);
  drawUI.style.display = "none";
  toast("Рисунок в доме! Кликай и двигай стрелками");
  pctx.fillStyle = "#fff";
  pctx.fillRect(0, 0, paint.width, paint.height);
};

function collideHouse(x, z) {
  return Math.abs(x) > 6.4 || Math.abs(z) > 4.4;
}

function update(dt) {
  let dx = 0;
  let dz = 0;
  if (keys["KeyW"]) {
    dx -= Math.sin(player.yaw) * player.speed * dt;
    dz -= Math.cos(player.yaw) * player.speed * dt;
  }
  if (keys["KeyS"]) {
    dx += Math.sin(player.yaw) * player.speed * dt;
    dz += Math.cos(player.yaw) * player.speed * dt;
  }
  if (keys["KeyA"]) player.yaw += 1.8 * dt;
  if (keys["KeyD"]) player.yaw -= 1.8 * dt;

  // стрелки — только двигать вещь по комнатам
  if (held) {
    const step = 2.6 * dt;
    if (keys["ArrowLeft"]) held.position.x -= step;
    if (keys["ArrowRight"]) held.position.x += step;
    if (keys["ArrowUp"]) held.position.z -= step;
    if (keys["ArrowDown"]) held.position.z += step;
    held.position.x = Math.max(-6.5, Math.min(6.5, held.position.x));
    held.position.z = Math.max(-4.5, Math.min(4.5, held.position.z));
    if (held.userData.kind === "furniture") held.position.y = 0;
    else if (held.userData.kind === "phone" || held.userData.kind === "draw") held.position.y = 0.9;
    else held.position.y = Math.max(0.15, held.position.y);
  }

  const nx = player.x + dx;
  const nz = player.z + dz;
  if (!collideHouse(nx, player.z)) player.x = nx;
  if (!collideHouse(player.x, nz)) player.z = nz;

  // camera follow
  camera.position.set(player.x + Math.sin(player.yaw) * 6, 4.2, player.z + Math.cos(player.yaw) * 6);
  camera.lookAt(player.x, 1.1, player.z);

  // Valera idle bob + face player
  valera.position.y = Math.sin(performance.now() / 400) * 0.03;
  valera.lookAt(player.x, 1, player.z);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
