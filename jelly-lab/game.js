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
  camera: { emoji: "📷", name: "камера" },
  star: { emoji: "⭐", name: "звезда" }
};

const LOOT = new Set(Object.keys(ITEM));

const state = {
  locked: false,
  inv: [],
  selected: null,
  candyN: 0,
  peepDone: false,
  yellowAsleep: false,
  fridgeBearSleep: false,
  babyDressed: false,
  kubCharged: false,
  bathing: false,
  greeted: false,
  played: false,
  doorOpen: false,
  clips: [],
  yaw: Math.PI,
  pitch: 0
};

const player = { x: 0, z: 3.2, speed: 4.4 };
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
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe8a0);
scene.fog = new THREE.Fog(0xffe8a0, 16, 42);

const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 100);
scene.add(new THREE.AmbientLight(0xfff6e0, 0.92));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
sun.position.set(5, 12, 4);
scene.add(sun);
const lamp = new THREE.PointLight(0xffe0a0, 0.55, 16);
lamp.position.set(0, 2.6, 2);
scene.add(lamp);

const texCache = {};
function tex(key, draw, size = 256) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  texCache[key] = t;
  return t;
}

function floorTex(g, s) {
  const rows = 8;
  const h = s / rows;
  for (let r = 0; r < rows; r++) {
    g.fillStyle = r % 2 ? "#b8884c" : "#d2ad78";
    g.fillRect(0, r * h, s, h - 1);
    g.strokeStyle = "rgba(70,40,15,0.35)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, r * h + h);
    g.lineTo(s, r * h + h);
    g.stroke();
    for (let k = 0; k < 3; k++) {
      const x = (((r * 37 + k * 89) % 100) / 100) * s;
      g.beginPath();
      g.moveTo(x, r * h);
      g.lineTo(x, r * h + h);
      g.stroke();
    }
  }
}
function wallTex(g, s) {
  g.fillStyle = "#f3e6c8";
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 18) {
    g.strokeStyle = "rgba(180,150,100,0.25)";
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(s, y);
    g.stroke();
  }
}
function woodTex(g, s) {
  g.fillStyle = "#a8753a";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 22; i++) {
    g.strokeStyle = `rgba(60,30,10,${0.12 + (i % 5) * 0.04})`;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, i * 12 + 4);
    g.bezierCurveTo(s * 0.25, i * 12, s * 0.6, i * 12 + 8, s, i * 12 + 2);
    g.stroke();
  }
}
function doorTex(g, s) {
  g.fillStyle = "#7a4a22";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#5a3418";
  g.lineWidth = 8;
  g.strokeRect(10, 10, s - 20, s - 20);
  g.strokeRect(28, 28, s - 56, s * 0.38);
  g.strokeRect(28, s * 0.52, s - 56, s * 0.35);
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
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.fillRect(s * 0.15, 0, s * 0.12, s);
}
function candyTex(g, s) {
  g.fillStyle = "#e51d30";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#fff";
  g.fillRect(0, s * 0.38, s, s * 0.24);
}
function sandTex(g, s) {
  g.fillStyle = "#e8d4a4";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 100; i++) {
    g.fillStyle = `rgba(120,90,40,${0.1 + (i % 5) * 0.02})`;
    g.fillRect((i * 53) % s, (i * 97) % s, 2, 2);
  }
}
function bookTex(g, s) {
  g.fillStyle = "#245fd0";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#f0b429";
  g.fillRect(s * 0.08, s * 0.12, s * 0.84, s * 0.14);
  g.fillStyle = "#fff8e0";
  g.fillRect(s * 0.12, s * 0.38, s * 0.76, s * 0.42);
}
function rugTex(g, s) {
  g.fillStyle = "#c94a3a";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#f0c84a";
  g.lineWidth = 14;
  g.strokeRect(18, 18, s - 36, s - 36);
}
function asphaltTex(g, s) {
  g.fillStyle = "#6a6e74";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#d8c86a";
  g.fillRect(s * 0.46, 0, s * 0.08, s);
}
function screenTex(g, s) {
  g.fillStyle = "#102018";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#3dff8a";
  g.font = "bold " + Math.floor(s * 0.14) + "px sans-serif";
  g.textAlign = "center";
  g.fillText("МОЙ ПК", s / 2, s * 0.42);
  g.fillStyle = "#9fefc0";
  g.font = Math.floor(s * 0.09) + "px sans-serif";
  g.fillText("Esc / клик снаружи", s / 2, s * 0.62);
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

function matColor(color) {
  return new THREE.MeshLambertMaterial({ color });
}
function matMap(key, drawer, color = 0xffffff, repeatX = 1, repeatY = 1) {
  const map = tex(key, drawer).clone();
  map.repeat.set(repeatX, repeatY);
  map.needsUpdate = true;
  return new THREE.MeshLambertMaterial({ map, color });
}
function addSolid(x, z, w, d) {
  solids.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}
function box(w, h, d, material, x, y, z, solid = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  scene.add(m);
  if (solid) addSolid(x, z, w * 0.95, d * 0.95);
  return m;
}
function mark(obj, id, title) {
  obj.traverse((ch) => {
    ch.userData.clickId = id;
    ch.userData.title = title;
    if (ch.isMesh) clickables.push(ch);
  });
}

function makeBear(color, sleepy = false, scale = 1) {
  const g = new THREE.Group();
  const mat = matColor(color);
  const dark = matColor(0x2a1010);
  const belly = matColor(0xfff3d6);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), mat);
  body.scale.set(1, 1.15, 0.92);
  body.position.y = 0.95;
  g.add(body);
  const tum = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), belly);
  tum.position.set(0, 0.9, 0.28);
  g.add(tum);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 20), mat);
  head.position.y = 1.48;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), mat);
    ear.position.set(s * 0.24, 1.72, 0);
    g.add(ear);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat);
    arm.position.set(s * 0.42, 0.95, 0.05);
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat);
    leg.position.set(s * 0.18, 0.42, 0.05);
    g.add(leg);
    if (sleepy) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.02), dark);
      e.position.set(s * 0.1, 1.5, 0.3);
      g.add(e);
    } else {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), dark);
      e.position.set(s * 0.1, 1.52, 0.3);
      g.add(e);
    }
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), dark);
  nose.position.set(0, 1.4, 0.34);
  g.add(nose);
  if (sleepy) g.rotation.z = 0.55;
  g.scale.setScalar(scale);
  return g;
}

function zoneName() {
  const { x, z } = player;
  if (z < -20) return "Пляж";
  if (z < -10) return "Двор";
  if (z < -1.5) return "Улица";
  if (x > 7) return "Роботы";
  if (x < -6.5) return "Кухня";
  if (x > 4.5 && z > 6) return "Ванная";
  if (z > 6.8) return "Спальня";
  if (Math.abs(x) < 3 && z > 1) return "Гостиная";
  return "Коридор";
}

function bumpInteract() {
  interactBusyUntil = performance.now() + 300;
}
function canInteract() {
  return performance.now() >= interactBusyUntil;
}

function addClip(title, line) {
  state.clips.push({ title, line });
  if (state.clips.length > 8) state.clips.shift();
  say("Кадр снят. Открой компьютер.");
}
function flashFilm() {
  if (!filmFlash) return;
  filmFlash.hidden = false;
  filmFlash.classList.remove("go");
  void filmFlash.offsetWidth;
  filmFlash.classList.add("go");
  setTimeout(() => {
    filmFlash.hidden = true;
  }, 280);
}

function buildWorld() {
  const woodM = matMap("wood", woodTex);
  const wallM = matMap("wall", wallTex, 0xffffff, 2, 1);
  const wallH = 3.6;
  const wallY = wallH / 2;

  const houseFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), matMap("floor", floorTex, 0xffffff, 5, 4));
  houseFloor.rotation.x = -Math.PI / 2;
  houseFloor.position.set(0, 0, 4);
  scene.add(houseFloor);

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), matMap("rug", rugTex));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.02, 3.2);
  scene.add(rug);

  const street = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), matMap("asphalt", asphaltTex, 0xffffff, 4, 2));
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, -0.01, -7);
  scene.add(street);

  const yard = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), matColor(0x7cb86a));
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, -0.015, -15);
  scene.add(yard);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(20.2, 14.2), matColor(0xf7edd8));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, wallH - 0.02, 4);
  scene.add(ceil);

  box(20, wallH, 0.22, wallM, 0, wallY, 10.5);
  box(0.22, wallH, 14, wallM, -10, wallY, 3.5);
  box(0.22, wallH, 14, wallM, 10, wallY, 3.5);
  // фасад без щелей: проём ~2.0 под дверь
  box(8.0, wallH, 0.22, wallM, -5.95, wallY, -2.0);
  box(8.0, wallH, 0.22, wallM, 5.95, wallY, -2.0);
  box(2.1, 1.05, 0.22, wallM, 0, wallH - 0.52, -2.0);
  box(0.22, 2.55, 0.28, woodM, -1.05, 1.28, -2.0);
  box(0.22, 2.55, 0.28, woodM, 1.05, 1.28, -2.0);
  box(2.32, 0.22, 0.28, woodM, 0, 2.55, -2.0);

  doorGroup = new THREE.Group();
  doorGroup.position.set(-0.95, 0, -2.0);
  scene.add(doorGroup);
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.45, 0.1), matMap("door", doorTex));
  doorMesh.position.set(0.95, 1.25, 0);
  doorGroup.add(doorMesh);
  mark(doorMesh, "door", "Дверь");
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), matColor(0xd4b06a));
  handle.position.set(1.65, 1.2, 0.09);
  doorGroup.add(handle);
  mark(handle, "handle", "Ручка");
  const peepHole = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), matColor(0x050505));
  peepHole.position.set(0.95, 1.55, 0.06);
  doorGroup.add(peepHole);
  mark(peepHole, "peep", "Глазок");
  const peepRing = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.14, 20), matColor(0xb0b0b0));
  peepRing.position.set(0.95, 1.55, 0.065);
  doorGroup.add(peepRing);
  mark(peepRing, "peep", "Глазок");

  const bed = box(2.6, 0.4, 1.5, woodM, -1.2, 0.32, 8.6);
  box(2.6, 0.18, 1.5, matColor(0xe8f0ff), -1.2, 0.58, 8.6, false);
  mark(bed, "bed", "Кровать");
  const dresser = box(1.4, 1.15, 0.55, woodM, 3.2, 0.7, 9.0);
  mark(dresser, "dresser", "Комод");
  const book = box(0.28, 0.38, 0.1, matMap("book", bookTex), 2.95, 1.4, 8.85, false);
  mark(book, "book", "Книжка");

  const valera = makeBear(0xe51d30, false, 1);
  valera.position.set(0.2, 0, 7.4);
  valera.rotation.y = Math.PI;
  scene.add(valera);
  mark(valera, "valera", "Валера");

  const baby = makeBear(0xff8fab, false, 0.4);
  baby.position.set(1.4, 0, 8.0);
  scene.add(baby);
  mark(baby, "baby", "Крошка");

  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), matMap("candy", candyTex));
    c.position.set(-2.6 + i * 0.32, 1.52, 3.8);
    scene.add(c);
    mark(c, "candy", "Конфета");
  }
  const shelf = box(2.0, 0.1, 0.38, woodM, -2.2, 1.35, 3.65, false);
  mark(shelf, "shelf", "Полка");

  const dump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), matColor(0xf5e6c8));
  dump.scale.set(1.35, 0.85, 1);
  dump.position.set(1.5, 0.85, 3.6);
  scene.add(dump);
  mark(dump, "dumpling", "Дамплинг");

  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 12), matColor(0xfff4d0));
  candle.position.set(1.95, 0.9, 3.6);
  scene.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matColor(0xff8800));
  flame.position.set(1.95, 1.1, 3.6);
  scene.add(flame);
  mark(candle, "candle", "Свечка");
  mark(flame, "candle", "Свечка");

  const camBody = box(0.32, 0.2, 0.24, matColor(0x2a2a2a), 2.8, 0.95, 3.7, false);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 14), matColor(0x111));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(2.8, 0.95, 3.86);
  scene.add(lens);
  mark(camBody, "camera", "Камера");
  mark(lens, "camera", "Камера");

  const desk = box(1.6, 0.12, 0.7, woodM, 5.0, 0.85, 5.6);
  mark(desk, "desk", "Стол");
  const monitor = box(0.7, 0.48, 0.06, matColor(0x222), 5.0, 1.35, 5.4, false);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), matMap("screen", screenTex));
  screen.position.set(5.0, 1.35, 5.44);
  scene.add(screen);
  mark(monitor, "pc", "Компьютер");
  mark(screen, "pc", "Компьютер");
  mark(box(0.55, 0.04, 0.22, matColor(0x444), 5.0, 0.95, 5.65, false), "pc", "Компьютер");

  mark(box(1.5, 0.5, 0.85, matColor(0xd8ecff), 7.2, 0.38, 8.4), "bath", "Ванночка");
  mark(box(1.15, 2.2, 0.8, matMap("metal", metalTex), -7.8, 1.15, 2.4), "fridge", "Холодильник");
  mark(box(2.0, 0.14, 1.1, woodM, -7.0, 0.85, 4.8), "table", "Стол");

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.26, 14),
    new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.78 })
  );
  water.position.set(-6.5, 1.05, 4.5);
  scene.add(water);
  mark(water, "water", "Вода");
  mark(box(0.24, 0.12, 0.14, matColor(0x33aa55), -6.4, 1.0, 5.0, false), "battery", "Батарейка");
  mark(box(0.28, 0.1, 0.18, matColor(0x44c0ff), -7.0, 1.0, 4.4, false), "goggles", "Очки");
  mark(box(0.3, 0.45, 0.12, matColor(0xffffff), -8.2, 1.2, 5.4, false), "coat", "Халатик");
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), matColor(0x7dff4a));
  ball.position.set(-5.8, 0.25, 3.5);
  scene.add(ball);
  mark(ball, "ball", "Мяч");

  yellowRef = makeBear(0xf0c000, false, 0.95);
  yellowRef.position.set(2.2, 0, -5.5);
  yellowRef.rotation.y = -0.35;
  scene.add(yellowRef);
  mark(yellowRef, "yellow", "Желтобрюх");

  mark(box(0.55, 0.7, 0.4, matColor(0x6ec9ff), 8.2, 0.9, 2.6), "elik", "Элик");
  mark(box(0.5, 0.5, 0.5, matColor(0x8899aa), 8.2, 0.8, 4.2), "kub", "Куб");
  for (let i = 0; i < 3; i++) {
    mark(box(0.18, 0.18, 0.18, matColor([0xe51d30, 0x2f6fdb, 0xf0b429][i]), 7.4 + i * 0.25, 0.3, 3.4, false), "cube", "Кубик");
  }

  const skelli = makeBear(0xc8d0d8, false, 0.85);
  skelli.position.set(-9, 0, -13);
  scene.add(skelli);
  mark(skelli, "skelli", "Скелли");
  const grandy = makeBear(0x3d9b5f, false, 1.25);
  grandy.position.set(10, 0, -7);
  scene.add(grandy);
  mark(grandy, "grandy", "Гранди");
  const oz = makeBear(0xff7a18, false, 0.9);
  oz.position.set(8.5, 0, 8.8);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.45, 12), matColor(0x5b2d8e));
  hat.position.set(0, 1.85, 0);
  oz.add(hat);
  scene.add(oz);
  mark(oz, "oz", "Оз");

  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.38), matColor(0xfff36a));
  star.position.set(-3.5, 6.4, -11);
  scene.add(star);
  mark(star, "star", "Звезда");

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(42, 26), matMap("sand", sandTex, 0xffffff, 5, 4));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.03, -26);
  scene.add(sand);
  const waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(42, 16), matColor(0x3aa0d8));
  waterPlane.rotation.x = -Math.PI / 2;
  waterPlane.position.set(0, -0.02, -36);
  scene.add(waterPlane);
  mark(box(3.6, 0.04, 12, matMap("sand", sandTex), 0, 0.015, -15, false), "path", "Тропинка");
  const umbrella = box(0.1, 1.5, 0.1, matColor(0xffffff), -2, 0.8, -24, false);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.28, 14), matColor(0xe51d30));
  cone.position.set(-2, 1.6, -24);
  scene.add(cone);
  mark(umbrella, "umbrella", "Зонтик");
  mark(cone, "umbrella", "Зонтик");
}

function has(id) {
  return state.inv.includes(id);
}
function take(id) {
  if (!ITEM[id]) return false;
  const count = state.inv.filter((x) => x === id).length;
  if (count >= 5) {
    say("Много уже.");
    return false;
  }
  state.inv.push(id);
  renderInv();
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
    if (p.distanceTo(origin) < 0.7) {
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
      e.preventDefault();
      state.selected = state.selected === id ? null : id;
      renderInv();
      say(state.selected ? "Выбрано: " + ITEM[id].name + ". Клик по герою — дать." : "Убрал из рук.");
    };
    invEl.appendChild(b);
  });
}

function tryFilm(who) {
  if (state.selected !== "camera") return false;
  flashFilm();
  if (who === "valera") {
    if (!state.greeted) {
      say("Сначала поздоровайся без камеры.");
      return true;
    }
    if (!state.played) {
      say("Сначала поиграй: дай конфету или мяч.");
      return true;
    }
    addClip("Играем с Валерой", "Сняли, как играем с Валерой дома.");
    return true;
  }
  if (who === "yellow") {
    addClip("Желтобрюх", "Желтобрюх на улице — не спит.");
    return true;
  }
  if (who === "baby") {
    addClip("Крошка", "Крошка дома.");
    return true;
  }
  if (who === "skelli" || who === "grandy" || who === "oz") {
    addClip("Пасхалка", "Поймали редкого гостя: " + who);
    return true;
  }
  return false;
}

function closeAllModals() {
  fridgeModal.hidden = true;
  pcModal.hidden = true;
  peepModal.hidden = true;
}

function openFridge() {
  fridgeExtra.textContent = "Можно взять вещи. Клик снаружи / Esc — закрыть.";
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
  state.yellowAsleep = false;
  if (yellowRef) yellowRef.rotation.z = 0;
  peepView.textContent = "В дырочке: желтобрюх на улице стоит и смотрит. Не спит.";
  peepModal.hidden = false;
  exitPointer();
  say("В глазок: желтобрюх на улице. Не спит.");
}

function openPc() {
  if (!state.clips.length) {
    pcScreen.innerHTML =
      "<p class='pc-empty'>Пока пусто.<br>Камера → Валера → снять → сюда.<br><b>Esc</b> или клик по тёмному — выход.</p>";
  } else {
    pcScreen.innerHTML = state.clips
      .map((c, i) => `<article class="clip"><b>Ролик ${i + 1}: ${c.title}</b><p>${c.line}</p></article>`)
      .join("");
  }
  pcModal.hidden = false;
  exitPointer();
  say("Комп. Esc или клик снаружи — выйти.");
}

function toggleDoor() {
  state.doorOpen = !state.doorOpen;
  if (doorGroup) doorGroup.rotation.y = state.doorOpen ? -1.25 : 0;
  say(state.doorOpen ? "Дверь открыта. Можно на улицу." : "Дверь закрыта.");
}

function bindModalClose(modal, btnId) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.onclick = (e) => {
      e.stopPropagation();
      modal.hidden = true;
      say("Закрыто.");
    };
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.hidden = true;
      say("Закрыто.");
    }
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
    toggleDoor();
    return;
  }
  if (id === "peep") {
    openPeep();
    return;
  }
  if (id === "valera") {
    if (tryFilm("valera")) return;
    if (state.selected === "candy") {
      useOne("candy");
      state.played = true;
      say("Ммм… Спасибо!");
      return;
    }
    if (state.selected === "ball") {
      useOne("ball");
      state.played = true;
      say("Играем с мячом!");
      return;
    }
    if (state.selected === "water") {
      useOne("water");
      say("Бульк.");
      return;
    }
    if (!state.greeted) {
      state.greeted = true;
      say("Привет, Валера! Ты дома.");
      return;
    }
    say("Дай конфетку — или мяч.");
    return;
  }
  if (id === "baby") {
    if (tryFilm("baby")) return;
    if (state.selected === "coat") {
      useOne("coat");
      state.babyDressed = true;
      say("Крошка в халатике.");
      return;
    }
    if (state.selected === "goggles") {
      useOne("goggles");
      say("Очки на Крошке.");
      return;
    }
    say("Крошка дома.");
    return;
  }
  if (id === "yellow") {
    if (tryFilm("yellow")) return;
    say("Я на улице. Не сплю.");
    return;
  }
  if (id === "skelli") {
    if (tryFilm("skelli")) return;
    say("Скелли: …ты меня раньше не видел.");
    return;
  }
  if (id === "grandy") {
    if (tryFilm("grandy")) return;
    say("Гранди: я большой и редкий.");
    return;
  }
  if (id === "oz") {
    if (tryFilm("oz")) return;
    say("Оз: шляпа с секретом.");
    return;
  }
  if (id === "star") {
    takeWorld(mesh, "star");
    say("Пасхалка: звезда с неба!");
    return;
  }
  if (id === "fridge") openFridge();
  if (id === "pc" || id === "desk") openPc();
  if (id === "bath") {
    state.bathing = !state.bathing;
    say(state.bathing ? "Купается." : "Вылез.");
  }
  if (id === "elik") say("Бип! Элик.");
  if (id === "kub") {
    if (state.selected === "battery") {
      useOne("battery");
      state.kubCharged = true;
      say("Батарейка вставлена.");
      return;
    }
    say(state.kubCharged ? "Заряжен." : "Нужна батарейка.");
  }
  if (id === "bed") say("Кровать Валеры.");
  if (id === "dresser") {
    if (!has("coat")) take("coat");
    else say("Комод.");
  }
  if (id === "table" || id === "shelf") say("Можно ставить вещи.");
  if (id === "umbrella" || id === "path") say("Пляж дальше. Валера дома.");
}

function tryMove(dx, dz) {
  const nx = player.x + dx;
  const nz = player.z + dz;
  if (!state.doorOpen && nz < -1.85 && nz > -2.3 && nx > -1.0 && nx < 1.0) return;
  for (const s of solids) {
    if (nx > s.minX && nx < s.maxX && nz > s.minZ && nz < s.maxZ) return;
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
  if (hits[0] && hits[0].object.userData.clickId) {
    interact(hits[0].object.userData.clickId, hits[0].object);
  }
}
function shootInteract() {
  doRayInteract(0, 0);
}
function shootAtClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
  doRayInteract(nx, ny);
}

let dragging = false;
let dragStart = null;
let dragMoved = false;

function lockPointer() {
  try {
    const p = canvas.requestPointerLock && canvas.requestPointerLock();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (_) {}
}
function exitPointer() {
  if (document.pointerLockElement) document.exitPointerLock();
}

document.addEventListener("pointerlockchange", () => {
  state.locked = document.pointerLockElement === canvas;
  cross.hidden = !state.locked;
  if (state.locked) {
    dragging = false;
    dragStart = null;
    dragMoved = false;
  }
});

function lookDelta(dx, dy) {
  state.yaw -= dx * 0.0022;
  state.pitch -= dy * 0.0022;
  state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
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
    shootAtClient(e.clientX, e.clientY);
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
  if (state.locked) shootInteract();
  else lockPointer();
});

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Escape") {
    exitPointer();
    if (anyModalOpen() && boot.hidden) {
      closeAllModals();
      say("Закрыто. Esc ещё раз — курсор.");
    }
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
  say("Предмет кликом берётся в инвентарь. Ручка двери открывает. Желтобрюх не спит. Ищи Скелли, Гранди, Оз и звезду.");
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
  player.x = Math.max(-9.2, Math.min(9.2, player.x));
  player.z = Math.max(-36, Math.min(9.8, player.z));
  updateCam();
  scene.background = new THREE.Color(player.z < -18 ? 0x87c8ef : player.z < -2 ? 0xc8d8e8 : 0xffe8a0);
  scene.fog.color.copy(scene.background);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
