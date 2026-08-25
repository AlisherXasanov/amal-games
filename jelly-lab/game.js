import * as THREE from "three";

const canvas = document.getElementById("c");
const speech = document.getElementById("speech");
const placeEl = document.getElementById("place");
const invEl = document.getElementById("inv");
const cross = document.getElementById("cross");
const boot = document.getElementById("boot");
const hud = document.getElementById("hud");
const fridgeModal = document.getElementById("fridgeModal");
const fridgeIn = document.getElementById("fridgeIn");
const fridgeExtra = document.getElementById("fridgeExtra");
const pcModal = document.getElementById("pcModal");
const pcScreen = document.getElementById("pcScreen");
const peepModal = document.getElementById("peepModal");
const peepView = document.getElementById("peepView");
const filmFlash = document.getElementById("filmFlash");
const questEl = document.getElementById("quest");

/** Много предметов (не «тысячи» за раз — пачка, реально на полу/полках) */
const ITEM = {
  candy: { emoji: "🍬", name: "конфета" },
  dumpling: { emoji: "🥟", name: "дамплинг" },
  butter: { emoji: "🍮", name: "баттерсквиш" },
  ball: { emoji: "🎾", name: "мяч" },
  pizza: { emoji: "🍕", name: "пицца" },
  water: { emoji: "💧", name: "вода" },
  juice: { emoji: "🧃", name: "сок" },
  milk: { emoji: "🥛", name: "молоко" },
  cookie: { emoji: "🍪", name: "печенье" },
  apple: { emoji: "🍎", name: "яблоко" },
  banana: { emoji: "🍌", name: "банан" },
  cake: { emoji: "🍰", name: "торт" },
  ice: { emoji: "🍦", name: "мороженое" },
  soap: { emoji: "🧼", name: "мыло" },
  towel: { emoji: "🧻", name: "полотенце" },
  shampoo: { emoji: "🧴", name: "шампунь" },
  toothbrush: { emoji: "🪥", name: "щётка" },
  battery: { emoji: "🔋", name: "батарейка" },
  cube: { emoji: "🟦", name: "кубик" },
  book: { emoji: "📖", name: "книжка" },
  toy: { emoji: "🧸", name: "игрушка" },
  remote: { emoji: "📺", name: "пульт" },
  phone: { emoji: "📱", name: "телефон" },
  keys: { emoji: "🔑", name: "ключи" },
  coat: { emoji: "🧥", name: "халатик" },
  goggles: { emoji: "🥽", name: "очки" },
  candle: { emoji: "🕯️", name: "свечка" },
  camera: { emoji: "📷", name: "камера" },
  pillow: { emoji: "🛏️", name: "подушка" },
  sock: { emoji: "🧦", name: "носок" },
  slipper: { emoji: "🩴", name: "тапок" },
  spoon: { emoji: "🥄", name: "ложка" },
  plate: { emoji: "🍽️", name: "тарелка" },
  cup: { emoji: "☕", name: "чашка" },
  plant: { emoji: "🪴", name: "цветок" },
  lamp: { emoji: "💡", name: "лампа" },
  clock: { emoji: "⏰", name: "будильник" },
  brush: { emoji: "🧹", name: "щётка-пол" },
  paper: { emoji: "🧻", name: "бумага" },
  duck: { emoji: "🦆", name: "уточка" }
};

const LOOT = new Set(Object.keys(ITEM));
const FOOD = new Set(["candy", "dumpling", "butter", "pizza", "cookie", "apple", "banana", "cake", "ice", "juice", "milk"]);

const state = {
  locked: false,
  inv: [],
  selected: null,
  peepDone: false,
  greeted: false,
  played: false,
  rested: false,
  doorOpen: false,
  atBeach: false,
  guestHere: false,
  clips: [],
  yaw: Math.PI,
  pitch: 0
};

const player = { x: 0, z: 2.5, speed: 4.5 };
const keys = {};
const clickables = [];
const solids = [];
let yellowRef = null;
let doorGroup = null;
let guestTimer = 0;
let interactBusyUntil = 0;
let skipNextClick = false;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe8a0);
scene.fog = new THREE.Fog(0xffe8a0, 16, 40);

const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 100);
scene.add(new THREE.AmbientLight(0xfff6e0, 0.95));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.05);
sun.position.set(3, 10, 4);
scene.add(sun);

const texCache = {};
function tex(key, draw, size = 256) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache[key] = t;
  return t;
}
function floorTex(g, s) {
  for (let r = 0; r < 8; r++) {
    g.fillStyle = r % 2 ? "#b8884c" : "#d2ad78";
    g.fillRect(0, (r * s) / 8, s, s / 8 - 1);
  }
}
function wallTex(g, s) {
  g.fillStyle = "#f3e6c8";
  g.fillRect(0, 0, s, s);
}
function tileTex(g, s) {
  g.fillStyle = "#dfeaf2";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#9bb";
  for (let i = 0; i <= 8; i++) {
    g.beginPath();
    g.moveTo((i * s) / 8, 0);
    g.lineTo((i * s) / 8, s);
    g.stroke();
    g.beginPath();
    g.moveTo(0, (i * s) / 8);
    g.lineTo(s, (i * s) / 8);
    g.stroke();
  }
}
function woodTex(g, s) {
  g.fillStyle = "#a8753a";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = "rgba(60,30,10,0.22)";
    g.beginPath();
    g.moveTo(0, i * 18);
    g.lineTo(s, i * 18 + 3);
    g.stroke();
  }
}
function doorTex(g, s) {
  g.fillStyle = "#7a4a22";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#5a3418";
  g.lineWidth = 10;
  g.strokeRect(14, 14, s - 28, s - 28);
  g.fillStyle = "#111";
  g.beginPath();
  g.arc(s * 0.5, s * 0.42, 14, 0, Math.PI * 2);
  g.fill();
}
function metalTex(g, s) {
  const grd = g.createLinearGradient(0, 0, s, s);
  grd.addColorStop(0, "#f0f4f8");
  grd.addColorStop(1, "#8fa4b2");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
}
function candyTex(g, s) {
  g.fillStyle = "#e51d30";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#fff";
  g.fillRect(0, s * 0.4, s, s * 0.2);
}
function sandTex(g, s) {
  g.fillStyle = "#e8d4a4";
  g.fillRect(0, 0, s, s);
}
function bookTex(g, s) {
  g.fillStyle = "#245fd0";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#f0b429";
  g.fillRect(s * 0.1, s * 0.15, s * 0.8, s * 0.12);
}
function rugTex(g, s) {
  g.fillStyle = "#c94a3a";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#f0c84a";
  g.lineWidth = 12;
  g.strokeRect(14, 14, s - 28, s - 28);
}
function asphaltTex(g, s) {
  g.fillStyle = "#6a6e74";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#d8c86a";
  g.fillRect(s * 0.45, 0, s * 0.1, s);
}
function screenTex(g, s) {
  g.fillStyle = "#102018";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#3dff8a";
  g.font = "bold " + Math.floor(s * 0.12) + "px sans-serif";
  g.textAlign = "center";
  g.fillText("ПК ВАЛЕРЫ", s / 2, s * 0.5);
}

function say(t) {
  speech.textContent = t;
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "ru-RU";
      window.speechSynthesis.speak(u);
    }
  } catch (_) {}
}

function updateQuest() {
  if (!questEl) return;
  if (!state.greeted) questEl.textContent = "→ Подойди к Валере в гостиной и поздоровайся";
  else if (!state.played) questEl.textContent = "→ Дай Валере еду (конфета / баттерсквиш / мяч) — поиграть";
  else if (!state.rested) questEl.textContent = "→ Клик по дивану или кровати — отдохнуть с Валерой";
  else if (!has("camera")) questEl.textContent = "→ Возьми камеру в гостиной";
  else if (!state.clips.length) questEl.textContent = "→ Выбери камеру и сними Валеру";
  else questEl.textContent = "Можно: комп · ванная · туалет · улица → машина на пляж · ждать гостя";
}

function matColor(c) {
  return new THREE.MeshLambertMaterial({ color: c });
}
function matMap(key, drawer, color = 0xffffff, rx = 1, ry = 1) {
  const map = tex(key, drawer).clone();
  map.repeat.set(rx, ry);
  map.needsUpdate = true;
  return new THREE.MeshLambertMaterial({ map, color });
}

function addSolid(x, z, w, d, tag) {
  solids.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    tag: tag || null
  });
}

/** Коробка: низ на полу, если y не задан — ставим по высоте */
function box(w, h, d, material, x, y, z, solid = true, tag) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  scene.add(m);
  if (solid) addSolid(x, z, w * 0.9, d * 0.9, tag);
  return m;
}
/** Мебель: низ касается пола (y = h/2) */
function furniture(w, h, d, material, x, z, solid = true) {
  return box(w, h, d, material, x, h / 2, z, solid);
}
/** Предмет на поверхности: surfaceY = верх полки/стола */
function putOn(mesh, surfaceY) {
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox;
  const half = Math.max(0.01, -bb.min.y * (mesh.scale.y || 1));
  mesh.position.y = surfaceY + half + 0.01;
}

function mark(obj, id, title) {
  obj.traverse((ch) => {
    ch.userData.clickId = id;
    ch.userData.title = title;
    if (ch.isMesh) clickables.push(ch);
  });
}

/** Мишка стоит на полу — ноги у y=0 */
function makeBear(color, scale = 1) {
  const g = new THREE.Group();
  const mat = matColor(color);
  const dark = matColor(0x2a1010);
  const belly = matColor(0xfff3d6);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), mat);
  body.scale.set(1, 1.12, 0.92);
  body.position.y = 0.72;
  g.add(body);
  const tum = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), belly);
  tum.position.set(0, 0.68, 0.26);
  g.add(tum);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), mat);
  head.position.y = 1.22;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mat);
    ear.position.set(s * 0.22, 1.44, 0);
    g.add(ear);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat);
    arm.position.set(s * 0.4, 0.72, 0);
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat);
    leg.position.set(s * 0.16, 0.15, 0.02);
    g.add(leg);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), dark);
    e.position.set(s * 0.09, 1.26, 0.28);
    g.add(e);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), dark);
  nose.position.set(0, 1.16, 0.32);
  g.add(nose);
  g.scale.setScalar(scale);
  return g;
}

function zoneName() {
  const { x, z } = player;
  if (state.atBeach || z < -40) return "Пляж";
  if (z < -2.15) return "Улица";
  if (x > 4.2 && z > 3.5) return "Ванная";
  if (x > 4.2 && z <= 3.5 && z > 0.5) return "Туалет";
  if (x < -4.2) return "Кухня";
  if (z > 5.2) return "Спальня";
  return "Гостиная";
}

function bumpInteract() {
  interactBusyUntil = performance.now() + 260;
}
function canInteract() {
  return performance.now() >= interactBusyUntil;
}

function setDoorOpen(open, silent) {
  state.doorOpen = open;
  if (doorGroup) doorGroup.rotation.y = open ? -Math.PI / 2 : 0;
  for (let i = solids.length - 1; i >= 0; i--) {
    if (solids[i].tag === "doorway") solids.splice(i, 1);
  }
  if (!open) addSolid(0, -2.0, 1.8, 0.32, "doorway");
  if (!silent) say(open ? "Дверь открыта — выходи на улицу." : "Дверь закрыта.");
}

function goToBeach() {
  state.atBeach = true;
  player.x = 0;
  player.z = -52;
  state.yaw = 0;
  updateQuest();
  placeEl.textContent = zoneName();
  say("Пляж далеко. Валера дома. Синяя машина — обратно.");
}
function goHomeStreet() {
  state.atBeach = false;
  player.x = 0;
  player.z = -3.8;
  state.yaw = 0;
  setDoorOpen(true, true);
  updateQuest();
  placeEl.textContent = zoneName();
  say("У дома Валеры. Дверь открыта.");
}

function spawnLootSphere(id, x, surfaceY, z, color, r = 0.1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), color ? matColor(color) : matMap("candy", candyTex));
  m.position.set(x, 0, z);
  putOn(m, surfaceY);
  scene.add(m);
  mark(m, id, ITEM[id]?.name || id);
  return m;
}
function spawnLootBox(id, w, h, d, color, x, surfaceY, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matColor(color));
  m.position.set(x, 0, z);
  putOn(m, surfaceY);
  scene.add(m);
  mark(m, id, ITEM[id]?.name || id);
  return m;
}

function buildWorld() {
  const wood = matMap("wood", woodTex);
  const wall = matMap("wall", wallTex, 0xffffff, 2, 1);
  const tile = matMap("tile", tileTex, 0xffffff, 2, 2);
  const H = 3.2;
  const Y = H / 2;
  const DH = 1.0;

  // ——— этаж квартиры ———
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), matMap("floor", floorTex, 0xffffff, 4, 4));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 3.5);
  scene.add(floor);

  // плитка в ванной/туалете
  const bathFloor = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 6.5), tile);
  bathFloor.rotation.x = -Math.PI / 2;
  bathFloor.position.set(6.2, 0.01, 4.2);
  scene.add(bathFloor);

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), matMap("rug", rugTex));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.015, 2.2);
  scene.add(rug);

  const street = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), matMap("asphalt", asphaltTex, 0xffffff, 3, 2));
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, -0.01, -6);
  scene.add(street);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16.2, 14.2), matColor(0xf7edd8));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H - 0.02, 3.5);
  scene.add(ceil);

  // наружные стены
  box(16, H, 0.22, wall, 0, Y, 10.2);
  box(0.22, H, 14, wall, -8, Y, 3.5);
  box(0.22, H, 14, wall, 8, Y, 3.5);
  const leftW = 8 - DH;
  box(leftW, H, 0.22, wall, -8 + leftW / 2, Y, -2.0);
  box(leftW, H, 0.22, wall, 8 - leftW / 2, Y, -2.0);
  box(DH * 2, 0.9, 0.22, wall, 0, H - 0.45, -2.0);
  box(0.16, 2.4, 0.2, wood, -DH - 0.05, 1.2, -2.0, false);
  box(0.16, 2.4, 0.2, wood, DH + 0.05, 1.2, -2.0, false);

  // входная дверь
  doorGroup = new THREE.Group();
  doorGroup.position.set(-DH, 0, -2.0);
  scene.add(doorGroup);
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(DH * 2 - 0.06, 2.35, 0.08), matMap("door", doorTex));
  doorMesh.position.set(DH, 1.175, 0);
  doorGroup.add(doorMesh);
  mark(doorMesh, "door", "Дверь");
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), matColor(0xe0c060));
  handle.position.set(DH * 2 - 0.22, 1.1, 0.08);
  doorGroup.add(handle);
  mark(handle, "handle", "Ручка");
  const peep = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), matColor(0x111));
  peep.position.set(DH, 1.5, 0.06);
  doorGroup.add(peep);
  mark(peep, "peep", "Глазок");
  setDoorOpen(false, true);

  // ——— внутренние стены (комнаты) ———
  // стена спальня | гостиная (проём по центру)
  box(5.5, H, 0.18, wall, -4.5, Y, 5.4);
  box(5.5, H, 0.18, wall, 2.2, Y, 5.4);
  // стена кухня | гостиная
  box(0.18, H, 4.5, wall, -4.4, Y, 1.2);
  box(0.18, H, 3.2, wall, -4.4, Y, 7.8);
  // стена ванная+туалет | гостиная
  box(0.18, H, 3.2, wall, 4.4, Y, 7.6);
  box(0.18, H, 2.4, wall, 4.4, Y, 1.5);
  // перегородка ванна | туалет
  box(3.4, H, 0.18, wall, 6.2, Y, 3.6);

  // ——— ГОСТИНАЯ ———
  const sofaH = 0.5;
  const sofa = furniture(2.2, sofaH, 0.85, matColor(0x4a7fd4), -1.8, 2.4);
  box(2.2, 0.45, 0.22, matColor(0x3a6ab8), -1.8, sofaH + 0.22, 2.05, false);
  mark(sofa, "sofa", "Диван");

  const tableH = 0.45;
  const coffee = furniture(1.1, tableH, 0.55, wood, 0.3, 2.0);
  mark(coffee, "table", "Столик");

  const shelfH = 0.1;
  const shelfY = 1.15;
  const shelf = box(2.0, shelfH, 0.35, wood, 1.5, shelfY, 4.6, false);
  mark(shelf, "shelf", "Полка");
  const shelfTop = shelfY + shelfH / 2;
  for (let i = 0; i < 5; i++) {
    spawnLootSphere("candy", 0.7 + i * 0.28, shelfTop, 4.55, null, 0.09);
  }
  spawnLootSphere("butter", 2.2, shelfTop, 4.55, 0xe8b84a, 0.11);
  spawnLootBox("camera", 0.28, 0.16, 0.2, 0x2a2a2a, 2.55, shelfTop, 4.55);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), matColor(0x7dff4a));
  ball.position.set(0.8, 0, 1.5);
  putOn(ball, 0);
  scene.add(ball);
  mark(ball, "ball", "Мяч");

  spawnLootBox("remote", 0.22, 0.06, 0.1, 0x333, -0.1, tableH, 2.0);
  spawnLootBox("phone", 0.12, 0.02, 0.22, 0x111, 0.4, tableH, 1.9);
  spawnLootSphere("dumpling", 0.6, tableH, 2.15, 0xf5e6c8, 0.12);

  // ПК
  const deskH = 0.75;
  furniture(1.4, deskH, 0.55, wood, 2.8, 0.8);
  const mon = box(0.6, 0.4, 0.05, matColor(0x222), 2.8, deskH + 0.28, 0.65, false);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.34), matMap("screen", screenTex));
  scr.position.set(2.8, deskH + 0.28, 0.69);
  scene.add(scr);
  mark(mon, "pc", "Компьютер");
  mark(scr, "pc", "Компьютер");

  const tv = box(1.1, 0.65, 0.08, matColor(0x222), -2.5, 1.4, 4.9, false);
  mark(tv, "tv", "Телевизор");

  // Валера на полу
  const valera = makeBear(0xe51d30, 1);
  valera.position.set(0.2, 0, 3.6);
  valera.rotation.y = Math.PI;
  scene.add(valera);
  mark(valera, "valera", "Валера");

  const baby = makeBear(0xff8fab, 0.38);
  baby.position.set(1.1, 0, 3.9);
  scene.add(baby);
  mark(baby, "baby", "Крошка");

  // ——— СПАЛЬНЯ (z > 5.4) ———
  const bedH = 0.35;
  const bed = furniture(2.4, bedH, 1.5, wood, -1.5, 7.8);
  box(2.4, 0.12, 1.5, matColor(0xe8f0ff), -1.5, bedH + 0.06, 7.8, false);
  mark(bed, "bed", "Кровать");
  spawnLootBox("pillow", 0.45, 0.18, 0.35, 0xfff8e0, -2.3, bedH + 0.12, 7.8);
  spawnLootBox("book", 0.22, 0.3, 0.08, 0x245fd0, 0.2, bedH + 0.12, 7.3);
  spawnLootBox("clock", 0.2, 0.2, 0.08, 0x444, 0.5, bedH + 0.12, 8.2);
  spawnLootBox("sock", 0.15, 0.08, 0.25, 0x6688cc, -0.5, 0, 6.8);

  const dressH = 1.0;
  furniture(1.2, dressH, 0.5, wood, 2.0, 8.5);
  spawnLootBox("coat", 0.25, 0.4, 0.1, 0xffffff, 2.0, dressH, 8.4);
  spawnLootBox("slipper", 0.2, 0.08, 0.28, 0xaa6644, 1.4, 0, 7.2);
  spawnLootBox("toy", 0.25, 0.28, 0.2, 0xcc8866, 2.4, dressH, 8.5);

  // ——— КУХНЯ (x < -4.4) ———
  const fridge = furniture(1.0, 2.0, 0.7, matMap("metal", metalTex), -6.3, 2.0);
  mark(fridge, "fridge", "Холодильник");
  const kh = 0.8;
  furniture(1.8, kh, 0.7, wood, -6.0, 4.5);
  spawnLootBox("plate", 0.28, 0.04, 0.28, 0xeee, -5.7, kh, 4.4);
  spawnLootBox("cup", 0.12, 0.14, 0.12, 0xffffff, -6.2, kh, 4.3);
  spawnLootBox("spoon", 0.06, 0.02, 0.22, 0xcccccc, -5.4, kh, 4.5);
  spawnLootBox("cookie", 0.12, 0.05, 0.12, 0xc4a35a, -5.5, kh, 4.7);
  spawnLootSphere("apple", -6.4, kh, 4.6, 0xe51d30, 0.09);
  spawnLootBox("juice", 0.1, 0.22, 0.1, 0xffaa33, -5.9, kh, 4.8);
  spawnLootBox("keys", 0.15, 0.03, 0.08, 0xd4af37, -5.3, kh, 4.2);

  // ——— ВАННАЯ (x>4.4, z>3.6) ———
  const bath = furniture(1.5, 0.45, 0.75, matColor(0xd8ecff), 6.2, 7.5);
  mark(bath, "bath", "Ванна");
  spawnLootSphere("duck", 6.0, 0.45, 7.4, 0xffdd44, 0.1);
  spawnLootBox("soap", 0.14, 0.08, 0.1, 0xaaddee, 6.6, 0.45, 7.6);
  spawnLootBox("shampoo", 0.1, 0.22, 0.1, 0x88ccff, 6.8, 0.45, 7.3);
  spawnLootBox("towel", 0.25, 0.35, 0.08, 0xffeeee, 5.2, 0, 8.0);
  spawnLootBox("toothbrush", 0.04, 0.22, 0.04, 0x66ddaa, 5.5, 0.9, 6.5);
  // раковина
  furniture(0.7, 0.75, 0.45, matColor(0xeeeeee), 5.5, 6.2);

  // ——— ТУАЛЕТ (x>4.4, z<3.6) ———
  const toilet = furniture(0.45, 0.4, 0.55, matColor(0xf5f5f5), 6.3, 2.0);
  mark(toilet, "toilet", "Унитаз");
  box(0.4, 0.35, 0.2, matColor(0xf5f5f5), 6.3, 0.55, 1.65, false);
  spawnLootBox("paper", 0.14, 0.14, 0.14, 0xffffff, 5.5, 0.9, 2.2);
  spawnLootBox("brush", 0.08, 0.35, 0.08, 0x4488aa, 7.0, 0, 2.5);

  // роботы в коридоре у ванной
  mark(furniture(0.45, 0.55, 0.35, matColor(0x6ec9ff), 3.5, 5.0), "elik", "Элик");
  mark(furniture(0.4, 0.4, 0.4, matColor(0x8899aa), 3.5, 4.0), "kub", "Куб");
  spawnLootBox("battery", 0.18, 0.1, 0.12, 0x33aa55, 3.2, 0, 3.5);
  spawnLootBox("cube", 0.14, 0.14, 0.14, 0x2f6fdb, 3.8, 0, 3.3);
  spawnLootBox("goggles", 0.22, 0.08, 0.14, 0x44c0ff, 3.3, 0.55, 5.0);
  spawnLootBox("candle", 0.08, 0.2, 0.08, 0xfff4d0, 1.0, tableH, 2.2);
  spawnLootBox("plant", 0.2, 0.35, 0.2, 0x3d9b5f, -3.2, 0, 0.5);
  spawnLootBox("lamp", 0.15, 0.35, 0.15, 0xffe566, -3.0, 0, 4.0);

  // желтобрюх на улице (гость иногда заходит)
  yellowRef = makeBear(0xf0c000, 0.92);
  yellowRef.position.set(2.2, 0, -4.8);
  yellowRef.rotation.y = -0.4;
  scene.add(yellowRef);
  mark(yellowRef, "yellow", "Желтобрюх");

  // машина
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 1.0), matColor(0xe51d30));
  body.position.y = 0.48;
  car.add(body);
  car.position.set(-3.2, 0, -5.8);
  scene.add(car);
  mark(car, "car", "Машина на пляж");

  // пляж далеко
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(36, 24), matMap("sand", sandTex, 0xffffff, 4, 3));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.02, -55);
  scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(36, 14), matColor(0x3aa0d8));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.01, -66);
  scene.add(sea);

  [
    { id: "tosha", c: 0x5b8def, x: -3, z: -54 },
    { id: "mika", c: 0xff66aa, x: 2, z: -53 },
    { id: "leva", c: 0x66dd88, x: 5, z: -55 }
  ].forEach((f) => {
    const b = makeBear(f.c, 0.9);
    b.position.set(f.x, 0, f.z);
    scene.add(b);
    mark(b, f.id, f.id);
  });

  const car2 = new THREE.Group();
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 1.0), matColor(0x2f6fdb));
  b2.position.y = 0.48;
  car2.add(b2);
  car2.position.set(3, 0, -50);
  scene.add(car2);
  mark(car2, "carHome", "Машина домой");
}

function has(id) {
  return state.inv.includes(id);
}
function take(id) {
  if (!ITEM[id]) return false;
  if (state.inv.filter((x) => x === id).length >= 8) {
    say("Много уже.");
    return false;
  }
  state.inv.push(id);
  renderInv();
  updateQuest();
  say("Взял: " + ITEM[id].name);
  return true;
}
function takeWorld(mesh, id) {
  if (!take(id)) return;
  const o = new THREE.Vector3();
  mesh.getWorldPosition(o);
  for (let i = clickables.length - 1; i >= 0; i--) {
    const ch = clickables[i];
    if (ch.userData.clickId !== id) continue;
    const p = new THREE.Vector3();
    ch.getWorldPosition(p);
    if (p.distanceTo(o) < 0.7) {
      ch.visible = false;
      ch.userData.clickId = null;
      clickables.splice(i, 1);
    }
  }
}
function useOne(id) {
  const i = state.inv.indexOf(id);
  if (i >= 0) state.inv.splice(i, 1);
  if (state.selected === id && !has(id)) state.selected = null;
  renderInv();
  updateQuest();
}
function renderInv() {
  invEl.innerHTML = "";
  const seen = {};
  state.inv.forEach((id) => {
    seen[id] = (seen[id] || 0) + 1;
  });
  Object.keys(seen).forEach((id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "item" + (state.selected === id ? " sel" : "");
    b.innerHTML = ITEM[id].emoji + "<small>" + ITEM[id].name + (seen[id] > 1 ? "×" + seen[id] : "") + "</small>";
    b.onclick = (e) => {
      e.stopPropagation();
      state.selected = state.selected === id ? null : id;
      renderInv();
    };
    invEl.appendChild(b);
  });
}

function addClip(title, line) {
  state.clips.push({ title, line });
  if (state.clips.length > 10) state.clips.shift();
  updateQuest();
  say("Снято! Смотри на компе.");
}
function flashFilm() {
  filmFlash.hidden = false;
  filmFlash.classList.remove("go");
  void filmFlash.offsetWidth;
  filmFlash.classList.add("go");
  setTimeout(() => {
    filmFlash.hidden = true;
  }, 240);
}

function tryFilm(who) {
  if (state.selected !== "camera") return false;
  flashFilm();
  addClip(who === "valera" ? "С Валерой" : "Кадр", "Сняли: " + who);
  return true;
}

function closeAllModals() {
  fridgeModal.hidden = true;
  pcModal.hidden = true;
  peepModal.hidden = true;
}

function openFridge() {
  fridgeExtra.textContent = "Еда Валеры. Esc — закрыть.";
  fridgeIn.innerHTML = "";
  ["pizza", "water", "candy", "butter", "milk", "ice", "banana", "cake"].forEach((id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = ITEM[id].emoji + " " + ITEM[id].name;
    b.onclick = (e) => {
      e.stopPropagation();
      take(id);
    };
    fridgeIn.appendChild(b);
  });
  fridgeModal.hidden = false;
  exitPointer();
}
function openPeep() {
  state.peepDone = true;
  peepView.textContent = state.guestHere
    ? "Глазок: желтобрюх УЖЕ в гостях в доме!"
    : "Улица. Желтобрюх там. Иногда приходит в гости. Красная машина — пляж.";
  peepModal.hidden = false;
  exitPointer();
}
function openPc() {
  pcScreen.innerHTML = state.clips.length
    ? state.clips.map((c, i) => `<article class="clip"><b>${i + 1}. ${c.title}</b><p>${c.line}</p></article>`).join("")
    : "<p class='pc-empty'>Пусто. Сними что-нибудь.<br>Esc — выход.</p>";
  pcModal.hidden = false;
  exitPointer();
}

function bindModalClose(modal, btnId) {
  document.getElementById(btnId).onclick = (e) => {
    e.stopPropagation();
    modal.hidden = true;
  };
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.hidden = true;
  });
  modal.querySelector(".modal-card")?.addEventListener("click", (e) => e.stopPropagation());
}
bindModalClose(fridgeModal, "fridgeClose");
bindModalClose(pcModal, "pcClose");
bindModalClose(peepModal, "peepClose");

function bringGuest() {
  if (!yellowRef || state.guestHere || state.atBeach) return;
  state.guestHere = true;
  yellowRef.position.set(1.5, 0, 2.8);
  yellowRef.rotation.y = Math.PI;
  setDoorOpen(true, true);
  say("В гости пришёл желтобрюх!");
  updateQuest();
}
function sendGuestOut() {
  if (!yellowRef || !state.guestHere) return;
  state.guestHere = false;
  yellowRef.position.set(2.2, 0, -4.8);
  yellowRef.rotation.y = -0.4;
  say("Желтобрюх ушёл на улицу.");
}

function interact(id, mesh) {
  if (!canInteract()) return;
  bumpInteract();

  if (LOOT.has(id) && mesh) {
    takeWorld(mesh, id);
    return;
  }
  if (id === "handle" || id === "door") {
    setDoorOpen(!state.doorOpen);
    return;
  }
  if (id === "peep") {
    openPeep();
    return;
  }
  if (id === "car") {
    goToBeach();
    return;
  }
  if (id === "carHome") {
    goHomeStreet();
    return;
  }
  if (id === "valera") {
    if (tryFilm("valera")) return;
    if (state.selected && FOOD.has(state.selected)) {
      const n = ITEM[state.selected].name;
      useOne(state.selected);
      state.played = true;
      updateQuest();
      say("Ммм, " + n + "! Поиграли.");
      return;
    }
    if (state.selected === "ball") {
      useOne("ball");
      state.played = true;
      updateQuest();
      say("Кинули мяч! Играем.");
      return;
    }
    if (!state.greeted) {
      state.greeted = true;
      updateQuest();
      say("Привет! Это квартира Валеры: гостиная, спальня, кухня, ванна, туалет.");
      return;
    }
    say("Дай еду или мяч — поиграем. Диван/кровать — отдых.");
    return;
  }
  if (id === "sofa" || id === "bed") {
    state.rested = true;
    updateQuest();
    say(id === "sofa" ? "Отдыхаем на диване с Валерой." : "Отдых в спальне.");
    return;
  }
  if (id === "baby") {
    if (state.selected === "coat") {
      useOne("coat");
      say("Крошка в халатике.");
      return;
    }
    say("Крошка дома.");
    return;
  }
  if (id === "yellow") {
    if (tryFilm("yellow")) return;
    if (state.guestHere) {
      if (state.selected === "butter") {
        useOne("butter");
        say("Желтобрюх: баттерсквиш! Спасибо.");
        return;
      }
      say("Я в гостях. Дай баттерсквиш?");
      return;
    }
    say("Я на улице. Иногда захожу в гости.");
    return;
  }
  if (["tosha", "mika", "leva"].includes(id)) {
    if (tryFilm(id)) return;
    say("Привет с пляжа! Валера дома.");
    return;
  }
  if (id === "fridge") openFridge();
  if (id === "pc") openPc();
  if (id === "bath") say(state.selected === "duck" || state.selected === "soap" ? "Купаемся!" : "Ванна. Возьми уточку или мыло.");
  if (id === "toilet") say("Туалет.");
  if (id === "tv") say("Телевизор Валеры.");
  if (id === "elik") say("Бип.");
  if (id === "kub") {
    if (state.selected === "battery") {
      useOne("battery");
      say("Заряжен.");
      return;
    }
    say("Нужна батарейка.");
  }
  if (id === "shelf" || id === "table") say("Можно брать вещи с поверхности.");
}

function tryMove(dx, dz) {
  const nx = player.x + dx;
  const nz = player.z + dz;
  for (const s of solids) {
    if (nx > s.minX && nx < s.maxX && nz > s.minZ && nz < s.maxZ) return;
  }
  if (!state.atBeach && nz < -9.5) {
    say("Пляж только на машине.");
    return;
  }
  if (state.atBeach && nz > -46) return;
  player.x = nx;
  player.z = nz;
}

function updateCam() {
  camera.position.set(player.x, 1.5, player.z);
  camera.quaternion.setFromEuler(new THREE.Euler(state.pitch, state.yaw, 0, "YXZ"));
}

const raycaster = new THREE.Raycaster();
function doRayInteract(nx, ny) {
  if (!canInteract()) return;
  raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (hits[0]?.object?.userData?.clickId) {
    interact(hits[0].object.userData.clickId, hits[0].object);
  }
}

let dragging = false;
let dragStart = null;
let dragMoved = false;

function lockPointer() {
  try {
    const p = canvas.requestPointerLock?.();
    if (p?.catch) p.catch(() => {});
  } catch (_) {}
}
function exitPointer() {
  if (document.pointerLockElement) document.exitPointerLock();
}

document.addEventListener("pointerlockchange", () => {
  state.locked = document.pointerLockElement === canvas;
  cross.hidden = !state.locked;
});

function lookDelta(dx, dy) {
  state.yaw -= dx * 0.0022;
  state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch - dy * 0.0022));
}

function anyModalOpen() {
  return !fridgeModal.hidden || !pcModal.hidden || !peepModal.hidden || !boot.hidden;
}

canvas.addEventListener("pointerdown", (e) => {
  if (anyModalOpen() || e.button !== 0 || state.locked) return;
  dragging = true;
  dragMoved = false;
  dragStart = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (state.locked) {
    lookDelta(e.movementX, e.movementY);
    return;
  }
  if (!dragging || !dragStart) return;
  if (!dragMoved && Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) < 4) return;
  if (!dragMoved) {
    dragMoved = true;
    dragStart = { x: e.clientX, y: e.clientY };
    return;
  }
  lookDelta(e.clientX - dragStart.x, e.clientY - dragStart.y);
  dragStart = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointerup", (e) => {
  if (anyModalOpen() || state.locked) return;
  const moved = dragMoved;
  dragging = false;
  dragStart = null;
  dragMoved = false;
  if (!moved) {
    const rect = canvas.getBoundingClientRect();
    doRayInteract(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1));
    skipNextClick = true;
    lockPointer();
  }
});
canvas.addEventListener("click", () => {
  if (anyModalOpen()) return;
  if (skipNextClick) {
    skipNextClick = false;
    return;
  }
  if (state.locked) doRayInteract(0, 0);
  else lockPointer();
});

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Escape") {
    exitPointer();
    if (boot.hidden && anyModalOpen()) closeAllModals();
  }
  if (e.code === "KeyG" && !state.atBeach) bringGuest();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

document.getElementById("startBtn").onclick = () => {
  boot.hidden = true;
  hud.hidden = false;
  cross.hidden = false;
  lockPointer();
  updateQuest();
  say("Квартира Валеры. Гостиная → спальня → кухня → ванна → туалет. Предметы на полках.");
};

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

buildWorld();
renderInv();
resize();
updateCam();
updateQuest();
placeEl.textContent = zoneName();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  guestTimer += dt;
  if (!state.atBeach && !state.guestHere && guestTimer > 45) {
    guestTimer = 0;
    if (Math.random() < 0.45) bringGuest();
  }
  if (state.guestHere && guestTimer > 90) {
    guestTimer = 0;
    sendGuestOut();
  }

  const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) + (keys.KeyS || keys.ArrowDown ? -1 : 0);
  const strafe = (keys.KeyD || keys.ArrowRight ? 1 : 0) + (keys.KeyA || keys.ArrowLeft ? -1 : 0);
  if (forward || strafe) {
    const sp = player.speed * dt;
    const fx = -Math.sin(state.yaw) * forward + Math.cos(state.yaw) * strafe;
    const fz = -Math.cos(state.yaw) * forward - Math.sin(state.yaw) * strafe;
    const len = Math.hypot(fx, fz) || 1;
    tryMove((fx / len) * sp, (fz / len) * sp);
    placeEl.textContent = zoneName();
  }
  if (state.atBeach) {
    player.x = Math.max(-10, Math.min(10, player.x));
    player.z = Math.max(-64, Math.min(-48, player.z));
    scene.background.set(0x87c8ef);
  } else {
    player.x = Math.max(-7.4, Math.min(7.4, player.x));
    player.z = Math.max(-8.5, Math.min(9.5, player.z));
    scene.background.set(player.z < -2.2 ? 0xc8d8e8 : 0xffe8a0);
  }
  scene.fog.color.copy(scene.background);
  updateCam();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
