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

const ITEM = {
  candy: { emoji: "🍬", name: "конфета" },
  dumpling: { emoji: "🥟", name: "дамплинг" },
  ball: { emoji: "🎾", name: "мяч" },
  pizza: { emoji: "🍕", name: "пицца" },
  water: { emoji: "💧", name: "вода" },
  battery: { emoji: "🔋", name: "батарейка" },
  cube: { emoji: "🟦", name: "кубик" },
  book: { emoji: "📖", name: "книжка" },
  coat: { emoji: "🧥", name: "халатик" },
  goggles: { emoji: "🥽", name: "очки" },
  candle: { emoji: "🕯️", name: "свечка" },
  camera: { emoji: "📷", name: "камера" }
};

const LOOT = new Set(Object.keys(ITEM));

const state = {
  locked: false,
  inv: [],
  selected: null,
  peepDone: false,
  greeted: false,
  played: false,
  doorOpen: false,
  atBeach: false,
  clips: [],
  yaw: Math.PI,
  pitch: 0
};

const player = { x: 0, z: 4, speed: 4.6 };
const keys = {};
const clickables = [];
const solids = [];
let yellowRef = null;
let doorGroup = null;
let interactBusyUntil = 0;
let skipNextClick = false;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe8a0);
scene.fog = new THREE.Fog(0xffe8a0, 18, 48);

const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 120);
scene.add(new THREE.AmbientLight(0xfff6e0, 0.95));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.1);
sun.position.set(4, 12, 3);
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
    const h = s / 8;
    g.fillStyle = r % 2 ? "#b8884c" : "#d2ad78";
    g.fillRect(0, r * h, s, h - 1);
  }
}
function wallTex(g, s) {
  g.fillStyle = "#f3e6c8";
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 20) {
    g.strokeStyle = "rgba(180,150,100,0.28)";
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(s, y);
    g.stroke();
  }
}
function woodTex(g, s) {
  g.fillStyle = "#a8753a";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 16; i++) {
    g.strokeStyle = "rgba(60,30,10,0.2)";
    g.beginPath();
    g.moveTo(0, i * 16);
    g.lineTo(s, i * 16 + 4);
    g.stroke();
  }
}
function doorTex(g, s) {
  g.fillStyle = "#7a4a22";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#5a3418";
  g.lineWidth = 10;
  g.strokeRect(12, 12, s - 24, s - 24);
  g.strokeRect(30, 30, s - 60, s * 0.36);
  g.strokeRect(30, s * 0.52, s - 60, s * 0.32);
  g.fillStyle = "#111";
  g.beginPath();
  g.arc(s * 0.5, s * 0.4, 16, 0, Math.PI * 2);
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
  g.lineWidth = 14;
  g.strokeRect(16, 16, s - 32, s - 32);
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
  g.font = "bold " + Math.floor(s * 0.14) + "px sans-serif";
  g.textAlign = "center";
  g.fillText("ПК ВАЛЕРЫ", s / 2, s * 0.45);
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
  if (!state.greeted) questEl.textContent = "1) Подойди к Валере и поздоровайся";
  else if (!state.played) questEl.textContent = "2) Дай Валере конфету или мяч";
  else if (!has("camera")) questEl.textContent = "3) Возьми камеру на полке";
  else if (state.clips.length < 1) questEl.textContent = "4) Выбери камеру и сними Валеру";
  else if (!state.atBeach) questEl.textContent = "5) Открой дверь → машина на улице → пляж";
  else questEl.textContent = "На пляже: другие желейные. Машина — домой";
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
function box(w, h, d, material, x, y, z, solid = true, tag) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  scene.add(m);
  if (solid) addSolid(x, z, w * 0.92, d * 0.92, tag);
  return m;
}
function mark(obj, id, title) {
  obj.traverse((ch) => {
    ch.userData.clickId = id;
    ch.userData.title = title;
    if (ch.isMesh) clickables.push(ch);
  });
}

function makeBear(color, scale = 1) {
  const g = new THREE.Group();
  const mat = matColor(color);
  const dark = matColor(0x2a1010);
  const belly = matColor(0xfff3d6);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), mat);
  body.scale.set(1, 1.15, 0.92);
  body.position.y = 0.95;
  g.add(body);
  const tum = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), belly);
  tum.position.set(0, 0.9, 0.28);
  g.add(tum);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), mat);
  head.position.y = 1.48;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat);
    ear.position.set(s * 0.24, 1.72, 0);
    g.add(ear);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat);
    arm.position.set(s * 0.42, 0.95, 0);
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat);
    leg.position.set(s * 0.18, 0.42, 0);
    g.add(leg);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), dark);
    e.position.set(s * 0.1, 1.52, 0.3);
    g.add(e);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), dark);
  nose.position.set(0, 1.4, 0.34);
  g.add(nose);
  g.scale.setScalar(scale);
  return g;
}

function zoneName() {
  const { x, z } = player;
  if (state.atBeach || z < -40) return "Пляж (далеко)";
  if (z < -1.2) return "Улица у дома Валеры";
  if (x < -5) return "Кухня Валеры";
  if (x > 5) return "Уголок роботов";
  if (z > 6) return "Спальня Валеры";
  return "Дом Валеры · гостиная";
}

function bumpInteract() {
  interactBusyUntil = performance.now() + 280;
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
  if (!open) {
    addSolid(0, -2.0, 1.85, 0.35, "doorway");
  }
  if (!silent) say(open ? "Дверь открыта — проходи на улицу." : "Дверь закрыта.");
}

function goToBeach() {
  state.atBeach = true;
  player.x = 0;
  player.z = -52;
  state.yaw = 0;
  updateQuest();
  placeEl.textContent = zoneName();
  say("Приехали на пляж! Тут другие желейные. Валера дома. Машина — обратно.");
}
function goHomeStreet() {
  state.atBeach = false;
  player.x = 0;
  player.z = -4.5;
  state.yaw = 0;
  state.doorOpen = true;
  setDoorOpen(true, true);
  updateQuest();
  placeEl.textContent = zoneName();
  say("Снова у дома Валеры. Дверь открыта.");
}

function buildWorld() {
  const woodM = matMap("wood", woodTex);
  const wallM = matMap("wall", wallTex, 0xffffff, 2, 1);
  const H = 3.5;
  const Y = H / 2;
  const DOOR_HALF = 1.0; // проём -1..+1

  // пол дома
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 13), matMap("floor", floorTex, 0xffffff, 5, 4));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 3.8);
  scene.add(floor);

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), matMap("rug", rugTex));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.02, 3.5);
  scene.add(rug);

  // только улица у дома (пляжа рядом НЕТ)
  const street = new THREE.Mesh(new THREE.PlaneGeometry(22, 12), matMap("asphalt", asphaltTex, 0xffffff, 3, 2));
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, -0.01, -6.5);
  scene.add(street);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(18.2, 13.2), matColor(0xf7edd8));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H - 0.02, 3.8);
  scene.add(ceil);

  // стены — проём ровно под дверь, без дыр
  box(18, H, 0.25, wallM, 0, Y, 10.0);
  box(0.25, H, 13, wallM, -9, Y, 3.5);
  box(0.25, H, 13, wallM, 9, Y, 3.5);
  const leftW = 9 - DOOR_HALF; // от -9 до -1
  const rightW = 9 - DOOR_HALF;
  box(leftW, H, 0.25, wallM, -9 + leftW / 2, Y, -2.0);
  box(rightW, H, 0.25, wallM, 9 - rightW / 2, Y, -2.0);
  box(DOOR_HALF * 2, 1.0, 0.25, wallM, 0, H - 0.5, -2.0); // над дверью

  // наличники — НЕ solid, чтобы не клинили проход
  box(0.18, 2.5, 0.22, woodM, -DOOR_HALF - 0.05, 1.25, -2.0, false);
  box(0.18, 2.5, 0.22, woodM, DOOR_HALF + 0.05, 1.25, -2.0, false);
  box(DOOR_HALF * 2 + 0.4, 0.18, 0.22, woodM, 0, 2.55, -2.0, false);

  // дверь на петле слева
  doorGroup = new THREE.Group();
  doorGroup.position.set(-DOOR_HALF, 0, -2.0);
  scene.add(doorGroup);
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(DOOR_HALF * 2 - 0.05, 2.4, 0.1), matMap("door", doorTex));
  doorMesh.position.set(DOOR_HALF, 1.2, 0);
  doorGroup.add(doorMesh);
  mark(doorMesh, "door", "Дверь");
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), matColor(0xe0c060));
  handle.position.set(DOOR_HALF * 2 - 0.25, 1.15, 0.1);
  doorGroup.add(handle);
  mark(handle, "handle", "Ручка");
  const peep = new THREE.Mesh(new THREE.CircleGeometry(0.1, 18), matColor(0x050505));
  peep.position.set(DOOR_HALF, 1.55, 0.07);
  doorGroup.add(peep);
  mark(peep, "peep", "Глазок");
  setDoorOpen(false, true);

  // —— дом Валеры: больше его вещей ——
  const bed = box(2.8, 0.4, 1.6, woodM, -1.5, 0.32, 8.2);
  box(2.8, 0.2, 1.6, matColor(0xe8f0ff), -1.5, 0.58, 8.2, false);
  box(0.6, 0.35, 1.6, matColor(0xfff8e0), -2.6, 0.72, 8.2, false);
  mark(bed, "bed", "Кровать Валеры");

  const sofa = box(2.4, 0.55, 0.9, matColor(0x4a7fd4), 2.2, 0.4, 4.2);
  box(2.4, 0.55, 0.25, matColor(0x3a6ab8), 2.2, 0.85, 3.85, false);
  mark(sofa, "sofa", "Диван Валеры");

  const tv = box(1.2, 0.7, 0.1, matColor(0x222), -0.2, 1.3, 9.5, false);
  mark(tv, "tv", "Телевизор");

  const dresser = box(1.5, 1.2, 0.55, woodM, 4.0, 0.7, 8.5);
  mark(dresser, "dresser", "Комод Валеры");
  mark(box(0.28, 0.38, 0.1, matMap("book", bookTex), 3.7, 1.45, 8.35, false), "book", "Книжка Валеры");

  // Валера — центр дома
  const valera = makeBear(0xe51d30, 1.05);
  valera.position.set(0.3, 0, 6.2);
  valera.rotation.y = Math.PI;
  scene.add(valera);
  mark(valera, "valera", "Валера");

  const baby = makeBear(0xff8fab, 0.4);
  baby.position.set(1.5, 0, 7.2);
  scene.add(baby);
  mark(baby, "baby", "Крошка");

  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), matMap("candy", candyTex));
    c.position.set(-3.0 + i * 0.3, 1.45, 3.6);
    scene.add(c);
    mark(c, "candy", "Конфета");
  }
  mark(box(2.2, 0.1, 0.4, woodM, -2.4, 1.28, 3.45, false), "shelf", "Полка Валеры");

  const dump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), matColor(0xf5e6c8));
  dump.scale.set(1.3, 0.85, 1);
  dump.position.set(1.2, 0.85, 3.4);
  scene.add(dump);
  mark(dump, "dumpling", "Дамплинг");

  const cam = box(0.32, 0.2, 0.24, matColor(0x2a2a2a), 3.0, 0.95, 3.5, false);
  mark(cam, "camera", "Камера");
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 12), matColor(0x111));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(3.0, 0.95, 3.66);
  scene.add(lens);
  mark(lens, "camera", "Камера");

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), matColor(0x7dff4a));
  ball.position.set(-1.5, 0.22, 4.5);
  scene.add(ball);
  mark(ball, "ball", "Мяч Валеры");

  // комп Валеры
  mark(box(1.5, 0.12, 0.65, woodM, 5.5, 0.85, 5.5), "desk", "Стол");
  const mon = box(0.7, 0.45, 0.06, matColor(0x222), 5.5, 1.3, 5.3, false);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), matMap("screen", screenTex));
  scr.position.set(5.5, 1.3, 5.34);
  scene.add(scr);
  mark(mon, "pc", "Компьютер Валеры");
  mark(scr, "pc", "Компьютер Валеры");

  mark(box(1.15, 2.15, 0.75, matMap("metal", metalTex), -7.0, 1.1, 2.5), "fridge", "Холодильник");
  mark(box(1.8, 0.14, 1.0, woodM, -6.2, 0.85, 4.6), "table", "Кухонный стол");
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12),
    new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.75 })
  );
  water.position.set(-5.7, 1.05, 4.3);
  scene.add(water);
  mark(water, "water", "Вода");
  mark(box(0.24, 0.12, 0.14, matColor(0x33aa55), -5.6, 1.0, 4.8, false), "battery", "Батарейка");
  mark(box(0.28, 0.1, 0.16, matColor(0x44c0ff), -6.3, 1.0, 4.2, false), "goggles", "Очки");
  mark(box(0.28, 0.42, 0.12, matColor(0xffffff), -7.5, 1.15, 5.2, false), "coat", "Халатик");
  mark(box(1.4, 0.48, 0.8, matColor(0xd8ecff), 6.5, 0.35, 8.0), "bath", "Ванночка");
  mark(box(0.5, 0.65, 0.4, matColor(0x6ec9ff), 7.2, 0.85, 2.8), "elik", "Элик");
  mark(box(0.45, 0.45, 0.45, matColor(0x8899aa), 7.2, 0.75, 4.0), "kub", "Куб");

  // улица: желтобрюх + МАШИНА на пляж
  yellowRef = makeBear(0xf0c000, 0.95);
  yellowRef.position.set(2.5, 0, -5.2);
  yellowRef.rotation.y = -0.5;
  scene.add(yellowRef);
  mark(yellowRef, "yellow", "Желтобрюх");

  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.1), matColor(0xe51d30));
  body.position.y = 0.55;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 1.0), matColor(0x88c8ef));
  cabin.position.set(-0.2, 1.05, 0);
  car.add(cabin);
  [-1, 1].forEach((s) => {
    [-1, 1].forEach((t) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12), matColor(0x222));
      w.rotation.z = Math.PI / 2;
      w.position.set(s * 0.7, 0.28, t * 0.55);
      car.add(w);
    });
  });
  car.position.set(-3.5, 0, -6.5);
  car.rotation.y = 0.4;
  scene.add(car);
  mark(car, "car", "Машина на пляж");
  const sign = box(1.6, 0.7, 0.08, matColor(0xfff36a), -3.5, 1.7, -5.6, false);
  mark(sign, "car", "На пляж");

  // —— пляж ДАЛЕКО (только на машине) ——
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(40, 28), matMap("sand", sandTex, 0xffffff, 5, 4));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.02, -55);
  scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), matColor(0x3aa0d8));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.01, -68);
  scene.add(sea);

  const umb = box(0.1, 1.5, 0.1, matColor(0xffffff), -2, 0.8, -58, false);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.3, 12), matColor(0xe51d30));
  cone.position.set(-2, 1.6, -58);
  scene.add(cone);
  mark(umb, "umbrella", "Зонтик");
  mark(cone, "umbrella", "Зонтик");

  // другие желейные (не Валера)
  const friends = [
    { name: "Тоша", id: "tosha", color: 0x5b8def, x: -3, z: -54 },
    { name: "Мика", id: "mika", color: 0xff66aa, x: 1.5, z: -53 },
    { name: "Лёва", id: "leva", color: 0x66dd88, x: 4, z: -55 },
    { name: "Скелли", id: "skelli", color: 0xc8d0d8, x: -6, z: -56 },
    { name: "Гранди", id: "grandy", color: 0x3d9b5f, x: 7, z: -54, scale: 1.2 },
    { name: "Оз", id: "oz", color: 0xff7a18, x: 0, z: -57 }
  ];
  friends.forEach((f) => {
    const b = makeBear(f.color, f.scale || 0.9);
    b.position.set(f.x, 0, f.z);
    if (f.id === "oz") {
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 10), matColor(0x5b2d8e));
      hat.position.set(0, 1.85, 0);
      b.add(hat);
    }
    scene.add(b);
    mark(b, f.id, f.name);
  });

  // машина обратно домой
  const car2 = new THREE.Group();
  const body2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.1), matColor(0x2f6fdb));
  body2.position.y = 0.55;
  car2.add(body2);
  car2.position.set(3, 0, -50);
  scene.add(car2);
  mark(car2, "carHome", "Машина домой");
}

function has(id) {
  return state.inv.includes(id);
}
function take(id) {
  if (!ITEM[id]) return false;
  if (state.inv.filter((x) => x === id).length >= 5) {
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
  const origin = new THREE.Vector3();
  mesh.getWorldPosition(origin);
  for (let i = clickables.length - 1; i >= 0; i--) {
    const ch = clickables[i];
    if (ch.userData.clickId !== id) continue;
    const p = new THREE.Vector3();
    ch.getWorldPosition(p);
    if (p.distanceTo(origin) < 0.75) {
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
      say(state.selected ? "В руках: " + ITEM[id].name : "Убрал.");
    };
    invEl.appendChild(b);
  });
}

function addClip(title, line) {
  state.clips.push({ title, line });
  if (state.clips.length > 8) state.clips.shift();
  updateQuest();
  say("Снято! Посмотри на компе Валеры.");
}
function flashFilm() {
  filmFlash.hidden = false;
  filmFlash.classList.remove("go");
  void filmFlash.offsetWidth;
  filmFlash.classList.add("go");
  setTimeout(() => {
    filmFlash.hidden = true;
  }, 250);
}

function tryFilm(who) {
  if (state.selected !== "camera") return false;
  flashFilm();
  if (who === "valera") {
    if (!state.greeted || !state.played) {
      say("Сначала привет и игра (конфета/мяч).");
      return true;
    }
    addClip("Валера дома", "Ролик: мы с Валерой дома.");
    return true;
  }
  addClip("Пляж", "Ролик с желейным другом: " + who);
  return true;
}

function closeAllModals() {
  fridgeModal.hidden = true;
  pcModal.hidden = true;
  peepModal.hidden = true;
}

function openFridge() {
  fridgeExtra.textContent = "Esc / клик снаружи — закрыть";
  fridgeIn.innerHTML = "";
  ["pizza", "water", "candy", "battery"].forEach((id) => {
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
  peepView.textContent = "На улице желтобрюх. Рядом красная машина — на пляж далеко.";
  peepModal.hidden = false;
  exitPointer();
  say("В глазок: улица. Пляжа рядом нет — только машина.");
}
function openPc() {
  pcScreen.innerHTML = state.clips.length
    ? state.clips.map((c, i) => `<article class="clip"><b>Ролик ${i + 1}: ${c.title}</b><p>${c.line}</p></article>`).join("")
    : "<p class='pc-empty'>Пусто. Сними Валеру камерой.<br>Esc — выйти.</p>";
  pcModal.hidden = false;
  exitPointer();
}

function bindModalClose(modal, btnId) {
  const btn = document.getElementById(btnId);
  if (btn) btn.onclick = (e) => {
    e.stopPropagation();
    modal.hidden = true;
  };
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.hidden = true;
  });
  const card = modal.querySelector(".modal-card");
  if (card) card.addEventListener("click", (e) => e.stopPropagation());
}
bindModalClose(fridgeModal, "fridgeClose");
bindModalClose(pcModal, "pcClose");
bindModalClose(peepModal, "peepClose");

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
    if (state.selected === "candy") {
      useOne("candy");
      state.played = true;
      updateQuest();
      say("Спасибо! Дай конфетку.");
      return;
    }
    if (state.selected === "ball") {
      useOne("ball");
      state.played = true;
      updateQuest();
      say("Играем!");
      return;
    }
    if (!state.greeted) {
      state.greeted = true;
      updateQuest();
      say("Привет! Это дом Валеры.");
      return;
    }
    say("Дай конфетку или мяч.");
    return;
  }
  if (id === "baby") {
    if (state.selected === "coat") {
      useOne("coat");
      say("Крошка в халатике.");
      return;
    }
    say("Крошка дома у Валеры.");
    return;
  }
  if (id === "yellow") {
    if (tryFilm("yellow")) return;
    say("Я на улице. На пляж — на красной машине.");
    return;
  }
  if (["tosha", "mika", "leva", "skelli", "grandy", "oz"].includes(id)) {
    if (tryFilm(id)) return;
    say("Привет с пляжа! Мы не Валера. Валера дома.");
    return;
  }
  if (id === "fridge") openFridge();
  if (id === "pc" || id === "desk") openPc();
  if (id === "sofa") say("Диван Валеры.");
  if (id === "tv") say("Телевизор Валеры.");
  if (id === "bed") say("Кровать Валеры.");
  if (id === "bath") say("Ванночка.");
  if (id === "elik") say("Бип.");
  if (id === "kub") {
    if (state.selected === "battery") {
      useOne("battery");
      say("Заряжен.");
      return;
    }
    say("Нужна батарейка.");
  }
  if (id === "dresser") {
    if (!has("coat")) take("coat");
    else say("Комод Валеры.");
  }
  if (id === "umbrella") say("Пляж далеко от дома — вы сюда на машине.");
}

function tryMove(dx, dz) {
  const nx = player.x + dx;
  const nz = player.z + dz;
  for (const s of solids) {
    if (nx > s.minX && nx < s.maxX && nz > s.minZ && nz < s.maxZ) return;
  }
  // не уходить пешком «на пляж» из дома — только машина
  if (!state.atBeach && nz < -10) {
    say("Пляж далеко. Садись в красную машину.");
    return;
  }
  if (state.atBeach && nz > -45) {
    // не уходить с пляжа пешком к дому
    return;
  }
  player.x = nx;
  player.z = nz;
}

function updateCam() {
  camera.position.set(player.x, 1.55, player.z);
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
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    doRayInteract(nx, ny);
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
  say("Ты в доме Валеры. Поздоровайся с ним. Пляж — только на машине с улицы.");
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
    player.x = Math.max(-12, Math.min(12, player.x));
    player.z = Math.max(-66, Math.min(-48, player.z));
    scene.background = new THREE.Color(0x87c8ef);
  } else {
    player.x = Math.max(-8.2, Math.min(8.2, player.x));
    player.z = Math.max(-9.5, Math.min(9.2, player.z));
    scene.background = new THREE.Color(player.z < -1.5 ? 0xc8d8e8 : 0xffe8a0);
  }
  scene.fog.color.copy(scene.background);
  updateCam();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
