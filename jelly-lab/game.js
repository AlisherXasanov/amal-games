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
  camera: { emoji: "📷", name: "камера" }
};

const state = {
  locked: false,
  inv: [],
  selected: null,
  candyN: 0,
  peepDone: false,
  yellowAsleep: true,
  fridgeBearSleep: false,
  babyDressed: false,
  kubCharged: false,
  bathing: false,
  greeted: false,
  played: false,
  clips: [],
  yaw: Math.PI,
  pitch: 0
};

const player = { x: 0, z: 3.2, speed: 4.0 };
const keys = {};
const clickables = [];
const solids = [];
let yellowRef = null;
let valeraRef = null;
let monitorMat = null;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe8a0);
scene.fog = new THREE.Fog(0xffe8a0, 14, 34);

const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 90);
scene.add(new THREE.AmbientLight(0xfff6e0, 0.92));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
sun.position.set(5, 12, 4);
scene.add(sun);
const lamp = new THREE.PointLight(0xffe0a0, 0.55, 14);
lamp.position.set(0, 2.6, 2);
scene.add(lamp);

const texCache = {};
function tex(key, draw, size = 256) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  texCache[key] = t;
  return t;
}

function floorTex(g, s) {
  g.fillStyle = "#c9a06a";
  g.fillRect(0, 0, s, s);
  const rows = 8;
  const h = s / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * h;
    g.fillStyle = r % 2 ? "#b8884c" : "#d2ad78";
    g.fillRect(0, y, s, h - 1);
    g.strokeStyle = "rgba(70,40,15,0.35)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, y + h);
    g.lineTo(s, y + h);
    g.stroke();
    for (let k = 0; k < 3; k++) {
      const x = ((r * 37 + k * 89) % 100) / 100 * s;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + h);
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
  g.fillStyle = "rgba(210,170,90,0.12)";
  for (let i = 0; i < 40; i++) {
    g.fillRect((i * 47) % s, (i * 29) % s, 8, 8);
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
  g.fillStyle = "#d4b06a";
  g.beginPath();
  g.arc(s * 0.78, s * 0.52, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#111";
  g.beginPath();
  g.arc(s * 0.5, s * 0.42, 14, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#333";
  g.beginPath();
  g.arc(s * 0.5, s * 0.42, 7, 0, Math.PI * 2);
  g.fill();
}

function metalTex(g, s) {
  const grd = g.createLinearGradient(0, 0, s, s);
  grd.addColorStop(0, "#f0f4f8");
  grd.addColorStop(0.5, "#c5d2dc");
  grd.addColorStop(1, "#8fa4b2");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.fillRect(s * 0.15, 0, s * 0.12, s);
  g.fillStyle = "#6a7";
  g.fillRect(s * 0.08, s * 0.42, 10, 28);
}

function candyTex(g, s) {
  g.fillStyle = "#e51d30";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#fff";
  g.fillRect(0, s * 0.38, s, s * 0.24);
  g.fillStyle = "#e51d30";
  g.font = "bold " + (s * 0.35) + "px sans-serif";
  g.textAlign = "center";
  g.fillText("★", s / 2, s * 0.62);
}

function sandTex(g, s) {
  g.fillStyle = "#e8d4a4";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 120; i++) {
    g.fillStyle = `rgba(120,90,40,${0.08 + (i % 7) * 0.02})`;
    g.fillRect((i * 53) % s, (i * 97) % s, 2 + (i % 3), 2);
  }
}

function bookTex(g, s) {
  g.fillStyle = "#245fd0";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#f0b429";
  g.fillRect(s * 0.08, s * 0.12, s * 0.84, s * 0.14);
  g.fillStyle = "#fff8e0";
  g.fillRect(s * 0.12, s * 0.38, s * 0.76, s * 0.42);
  g.fillStyle = "#333";
  g.font = "bold " + Math.floor(s * 0.12) + "px sans-serif";
  g.fillText("АЗБУКА", s * 0.18, s * 0.58);
}

function rugTex(g, s) {
  g.fillStyle = "#c94a3a";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#f0c84a";
  g.lineWidth = 14;
  g.strokeRect(18, 18, s - 36, s - 36);
  g.fillStyle = "#f0c84a";
  g.beginPath();
  g.arc(s / 2, s / 2, s * 0.18, 0, Math.PI * 2);
  g.fill();
}

function asphaltTex(g, s) {
  g.fillStyle = "#6a6e74";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 80; i++) {
    g.fillStyle = `rgba(0,0,0,${0.08 + (i % 5) * 0.03})`;
    g.fillRect((i * 41) % s, (i * 73) % s, 3, 3);
  }
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
  g.font = Math.floor(s * 0.1) + "px sans-serif";
  g.fillText("клик → ролики", s / 2, s * 0.62);
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
  const map = tex(key, drawer);
  const m = map.clone();
  m.repeat.set(repeatX, repeatY);
  m.needsUpdate = true;
  return new THREE.MeshLambertMaterial({ map: m, color });
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
  if (z < -12) return "Пляж";
  if (z < -1.8) return "Улица";
  if (x > 5.2) return "Роботы";
  if (x < -4.8) return "Кухня";
  if (z > 5.5) return "Спальня";
  if (z > 1.5 && x > -1.5 && x < 2.5) return "Гостиная";
  return "Коридор";
}

function addClip(title, line) {
  state.clips.push({ title, line, t: Date.now() });
  if (state.clips.length > 8) state.clips.shift();
  say("Кадр снят. Потом открой компьютер.");
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
  // floors
  const houseFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 12),
    matMap("floor", floorTex, 0xffffff, 4, 3)
  );
  houseFloor.rotation.x = -Math.PI / 2;
  houseFloor.position.set(0, 0, 3.5);
  scene.add(houseFloor);

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2.2),
    matMap("rug", rugTex)
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.02, 3.0);
  scene.add(rug);

  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 10),
    matMap("asphalt", asphaltTex, 0xffffff, 3, 2)
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, -0.01, -6);
  scene.add(street);

  // walls: cream inside look
  const wallM = matMap("wall", wallTex, 0xffffff, 2, 1);
  const woodM = matMap("wood", woodTex);
  // back
  box(16, 3.1, 0.22, wallM, 0, 1.55, 9.2);
  // sides
  box(0.22, 3.1, 12, wallM, -8, 1.55, 3.2);
  box(0.22, 3.1, 12, wallM, 8, 1.55, 3.2);
  // front with door gap
  box(6.2, 3.1, 0.22, wallM, -4.9, 1.55, -2.0);
  box(6.2, 3.1, 0.22, wallM, 4.9, 1.55, -2.0);
  // door frame
  box(0.25, 2.6, 0.3, woodM, -1.05, 1.3, -2.0);
  box(0.25, 2.6, 0.3, woodM, 1.05, 1.3, -2.0);
  box(2.35, 0.25, 0.3, woodM, 0, 2.55, -2.0);

  const door = box(1.9, 2.45, 0.12, matMap("door", doorTex), 0, 1.25, -2.0, false);
  mark(door, "door", "Дверь");
  // real peephole hole (dark circle + click)
  const peepHole = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 20),
    matColor(0x050505)
  );
  peepHole.position.set(0, 1.55, -1.93);
  scene.add(peepHole);
  mark(peepHole, "peep", "Глазок");
  const peepRing = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.14, 20),
    matColor(0xb0b0b0)
  );
  peepRing.position.set(0, 1.55, -1.925);
  scene.add(peepRing);
  mark(peepRing, "peep", "Глазок");

  // --- bedroom ---
  const bed = box(2.6, 0.4, 1.5, woodM, -1.2, 0.32, 7.5);
  box(2.6, 0.18, 1.5, matColor(0xe8f0ff), -1.2, 0.58, 7.5, false);
  box(0.55, 0.35, 1.5, matColor(0xfff8e0), -2.2, 0.7, 7.5, false);
  mark(bed, "bed", "Кровать");
  const dresser = box(1.4, 1.15, 0.55, woodM, 2.8, 0.7, 7.7);
  mark(dresser, "dresser", "Комод");
  const book = box(0.28, 0.38, 0.1, matMap("book", bookTex), 2.55, 1.4, 7.55, false);
  mark(book, "book", "Книжка");

  // Валера — ТОЛЬКО дома
  valeraRef = makeBear(0xe51d30, false, 1);
  valeraRef.position.set(0.2, 0, 6.6);
  valeraRef.rotation.y = Math.PI;
  scene.add(valeraRef);
  mark(valeraRef, "valera", "Валера");

  const baby = makeBear(0xff8fab, false, 0.4);
  baby.position.set(1.3, 0, 7.0);
  scene.add(baby);
  mark(baby, "baby", "Крошка");

  // --- living: shelf, candy, camera, PC ---
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), matMap("candy", candyTex));
    c.position.set(-2.4 + i * 0.32, 1.52, 3.6);
    scene.add(c);
    mark(c, "candy", "Конфета");
  }
  const shelf = box(2.0, 0.1, 0.38, woodM, -2.0, 1.35, 3.45, false);
  mark(shelf, "shelf", "Полка");

  const dump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), matColor(0xf5e6c8));
  dump.scale.set(1.35, 0.85, 1);
  dump.position.set(1.5, 0.85, 3.4);
  scene.add(dump);
  mark(dump, "dumpling", "Дамплинг");

  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 12), matColor(0xfff4d0));
  candle.position.set(1.95, 0.9, 3.4);
  scene.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matColor(0xff8800));
  flame.position.set(1.95, 1.1, 3.4);
  scene.add(flame);
  mark(candle, "candle", "Свечка");
  mark(flame, "candle", "Свечка");

  const camBody = box(0.32, 0.2, 0.24, matColor(0x2a2a2a), 2.6, 0.95, 3.5, false);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 14), matColor(0x111));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(2.6, 0.95, 3.66);
  scene.add(lens);
  mark(camBody, "camera", "Камера");
  mark(lens, "camera", "Камера");

  // свой компьютер
  const desk = box(1.6, 0.12, 0.7, woodM, 4.2, 0.85, 5.2);
  box(0.08, 0.75, 0.08, woodM, 3.55, 0.4, 4.95, false);
  box(0.08, 0.75, 0.08, woodM, 4.85, 0.4, 4.95, false);
  box(0.08, 0.75, 0.08, woodM, 3.55, 0.4, 5.45, false);
  box(0.08, 0.75, 0.08, woodM, 4.85, 0.4, 5.45, false);
  mark(desk, "desk", "Стол с компом");
  const monitor = box(0.7, 0.48, 0.06, matColor(0x222), 4.2, 1.35, 5.0, false);
  monitorMat = matMap("screen", screenTex);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), monitorMat);
  screen.position.set(4.2, 1.35, 5.04);
  scene.add(screen);
  mark(monitor, "pc", "Компьютер");
  mark(screen, "pc", "Компьютер");
  const kb = box(0.55, 0.04, 0.22, matColor(0x444), 4.2, 0.95, 5.25, false);
  mark(kb, "pc", "Компьютер");

  const bath = box(1.5, 0.5, 0.85, matColor(0xd8ecff), 5.8, 0.38, 7.2);
  mark(bath, "bath", "Ванночка");

  // --- kitchen ---
  const fridge = box(1.15, 2.2, 0.8, matMap("metal", metalTex), -6.3, 1.15, 2.2);
  mark(fridge, "fridge", "Холодильник");
  const table = box(2.0, 0.14, 1.1, woodM, -5.6, 0.85, 4.4);
  mark(table, "table", "Кухонный стол");
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.26, 14),
    new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.78 })
  );
  water.position.set(-5.2, 1.05, 4.1);
  scene.add(water);
  mark(water, "water", "Вода");
  const battery = box(0.24, 0.12, 0.14, matColor(0x33aa55), -5.0, 1.0, 4.5, false);
  mark(battery, "battery", "Батарейка");
  const goggles = box(0.28, 0.1, 0.18, matColor(0x44c0ff), -5.5, 1.0, 4.0, false);
  mark(goggles, "goggles", "Очки");
  const coat = box(0.3, 0.45, 0.12, matColor(0xffffff), -6.6, 1.2, 4.9, false);
  mark(coat, "coat", "Халатик");
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), matColor(0x7dff4a));
  ball.position.set(-4.6, 0.25, 3.2);
  scene.add(ball);
  mark(ball, "ball", "Мяч");

  // --- желтобрюх ТОЛЬКО на улице ---
  yellowRef = makeBear(0xf0c000, true, 0.95);
  yellowRef.position.set(1.8, 0, -5.2);
  yellowRef.rotation.y = -0.4;
  scene.add(yellowRef);
  mark(yellowRef, "yellow", "Желтобрюх");

  // mailbox / street props
  box(0.35, 1.1, 0.35, matColor(0x4a6), -2.2, 0.55, -4.5, false);
  box(0.5, 0.35, 0.35, matColor(0x336), -2.2, 1.2, -4.5, false);

  // robots
  const elik = box(0.55, 0.7, 0.4, matColor(0x6ec9ff), 6.5, 0.9, 2.4);
  mark(elik, "elik", "Элик");
  const kub = box(0.5, 0.5, 0.5, matColor(0x8899aa), 6.5, 0.8, 4.0);
  mark(kub, "kub", "Робот Куб");
  for (let i = 0; i < 3; i++) {
    const cu = box(0.18, 0.18, 0.18, matColor([0xe51d30, 0x2f6fdb, 0xf0b429][i]), 5.8 + i * 0.25, 0.3, 3.2, false);
    mark(cu, "cube", "Кубик");
  }

  // beach — без Валеры
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), matMap("sand", sandTex, 0xffffff, 4, 3));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.03, -18);
  scene.add(sand);
  const waterPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 12),
    new THREE.MeshLambertMaterial({ color: 0x3aa0d8 })
  );
  waterPlane.rotation.x = -Math.PI / 2;
  waterPlane.position.set(0, -0.02, -26);
  scene.add(waterPlane);
  const path = box(3.2, 0.04, 6, matMap("sand", sandTex), 0, 0.015, -10.5, false);
  mark(path, "path", "Тропинка на пляж");
  const umbrella = box(0.1, 1.5, 0.1, matColor(0xffffff), -1.4, 0.8, -16.5, false);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.28, 14), matColor(0xe51d30));
  cone.position.set(-1.4, 1.6, -16.5);
  scene.add(cone);
  mark(umbrella, "umbrella", "Зонтик");
  mark(cone, "umbrella", "Зонтик");
}

function has(id) {
  return state.inv.includes(id);
}
function take(id) {
  if (!ITEM[id]) return;
  const count = state.inv.filter((x) => x === id).length;
  if (count >= 5) {
    say("Много уже.");
    return;
  }
  state.inv.push(id);
  renderInv();
  say("Взял: " + ITEM[id].name + (count ? " ×" + (count + 1) : ""));
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
      state.selected = state.selected === id ? null : id;
      renderInv();
    };
    invEl.appendChild(b);
  });
}

function askCandy() {
  state.candyN++;
  const n = state.candyN % 3;
  if (n === 1) say("Дай конфетку.");
  else if (n === 2) say("Дай конфетку, дай конфетку.");
  else say("Дай конфетку, дай конфетку, дай конфетку.");
}

function tryFilm(who) {
  if (state.selected !== "camera") return false;
  flashFilm();
  if (who === "valera") {
    if (!state.greeted) {
      addClip("Привет", "Подошёл к Валере. Пока только зашёл.");
      say("Сначала поздоровайся — кликни без камеры.");
      return true;
    }
    if (!state.played) {
      addClip("Валера дома", "Валера дома. Пока без игры.");
      say("Сначала поиграй: дай конфету или мяч.");
      return true;
    }
    addClip("Играем с Валерой", "Здорово! Сняли, как играем с Валерой дома.");
    say("Снято! Теперь на компе можно посмотреть.");
    return true;
  }
  if (who === "yellow") {
    addClip("Желтобрюх на улице", "В кадре желтобрюх на улице — не в хате.");
    return true;
  }
  if (who === "baby") {
    addClip("Крошка", "Крошка дома, как всегда.");
    return true;
  }
  return false;
}

function openFridge() {
  state.fridgeBearSleep = Math.random() < 0.3;
  fridgeExtra.textContent = state.fridgeBearSleep
    ? "Ого… кто-то спит между полками."
    : "Холодно. Можно взять вещи.";
  fridgeIn.innerHTML = "";
  ["pizza", "water", "candy", "battery"].forEach((id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = ITEM[id].emoji + " " + ITEM[id].name;
    b.onclick = () => take(id);
    fridgeIn.appendChild(b);
  });
  fridgeModal.hidden = false;
  exitPointer();
}

function openPeep() {
  state.peepDone = true;
  state.yellowAsleep = Math.random() < 0.6;
  if (yellowRef) yellowRef.rotation.z = state.yellowAsleep ? 0.55 : 0;
  peepView.textContent = state.yellowAsleep
    ? "В дырочке: желтобрюх на улице… спит у стены."
    : "В дырочке: желтобрюх на улице смотрит в сторону.";
  peepModal.hidden = false;
  exitPointer();
  say(state.yellowAsleep ? "В глазок: спит на улице." : "В глазок: на улице смотрит.");
}

function openPc() {
  if (!state.clips.length) {
    pcScreen.innerHTML =
      "<p class='pc-empty'>Пока пусто.<br>Возьми камеру → поздоровайся с Валерой → поиграй → сними → вернись сюда.</p>";
  } else {
    pcScreen.innerHTML = state.clips
      .map(
        (c, i) =>
          `<article class="clip"><b>Ролик ${i + 1}: ${c.title}</b><p>${c.line}</p></article>`
      )
      .join("");
  }
  pcModal.hidden = false;
  exitPointer();
  say(state.clips.length ? "Смотрим, как получилось." : "Сначала сними что-нибудь камерой.");
}

document.getElementById("fridgeClose").onclick = () => {
  fridgeModal.hidden = true;
};
document.getElementById("pcClose").onclick = () => {
  pcModal.hidden = true;
};
document.getElementById("peepClose").onclick = () => {
  peepModal.hidden = true;
};

function interact(id) {
  if (id === "valera") {
    if (tryFilm("valera")) return;
    if (state.selected === "candy") {
      useOne("candy");
      state.played = true;
      say("Ммм… Спасибо. Дай конфетку ещё.");
      return;
    }
    if (state.selected === "ball") {
      useOne("ball");
      state.played = true;
      say("Кинули мяч! Играем.");
      return;
    }
    if (state.selected === "dumpling") {
      say("Хлюп. Опыт с дамплингом.");
      return;
    }
    if (state.selected === "candle") {
      say("Свечка рядом. Осторожно.");
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
    if (!state.played) {
      askCandy();
      say("Дай конфетку — или мяч, поиграем.");
      return;
    }
    askCandy();
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
    say("Крошка дома. На пляж с нами не ходит.");
    return;
  }
  if (id === "candy") take("candy");
  if (id === "dumpling") take("dumpling");
  if (id === "water") take("water");
  if (id === "battery") take("battery");
  if (id === "cube") take("cube");
  if (id === "book") take("book");
  if (id === "coat") take("coat");
  if (id === "goggles") take("goggles");
  if (id === "candle") take("candle");
  if (id === "camera") take("camera");
  if (id === "ball") take("ball");
  if (id === "fridge") openFridge();
  if (id === "pc" || id === "desk") openPc();
  if (id === "bath") {
    state.bathing = !state.bathing;
    say(state.bathing ? "Купается. Бульк-бульк." : "Вылез из ванны.");
  }
  if (id === "peep") openPeep();
  if (id === "door") {
    if (!state.peepDone) say("Сначала посмотри в глазок — дырочку в двери.");
    else say("За дверью улица. Желтобрюх там, не в хате.");
  }
  if (id === "yellow") {
    if (tryFilm("yellow")) return;
    if (!state.peepDone) {
      say("Сначала глянь в глазок из хаты.");
      return;
    }
    say(state.yellowAsleep ? "…хррр… на улице." : "Чего надо? Я на улице.");
  }
  if (id === "elik") say("Бип! Элик дома у роботов.");
  if (id === "kub") {
    if (state.selected === "battery") {
      useOne("battery");
      state.kubCharged = true;
      say("Батарейка вставлена.");
      return;
    }
    say(state.kubCharged ? "Дай кубик." : "Нужна батарейка.");
  }
  if (id === "bed") say("Кровать Валеры.");
  if (id === "dresser") {
    if (!has("coat")) take("coat");
    else say("Комод.");
  }
  if (id === "table" || id === "shelf") say("Можно ставить вещи.");
  if (id === "umbrella" || id === "path") say("Пляж дальше. Валеры тут нет — он дома.");
}

function tryMove(dx, dz) {
  const nx = player.x + dx;
  const nz = player.z + dz;
  for (const s of solids) {
    if (nx > s.minX && nx < s.maxX && nz > s.minZ && nz < s.maxZ) return;
  }
  player.x = nx;
  player.z = nz;
}

function updateCam() {
  camera.position.set(player.x, 1.55, player.z);
  const e = new THREE.Euler(state.pitch, state.yaw, 0, "YXZ");
  camera.quaternion.setFromEuler(e);
}

const raycaster = new THREE.Raycaster();
function shootInteract() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (hits[0] && hits[0].object.userData.clickId) {
    interact(hits[0].object.userData.clickId);
  }
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

function shootAtClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
  const hits = raycaster.intersectObjects(clickables, false);
  if (hits[0] && hits[0].object.userData.clickId) {
    interact(hits[0].object.userData.clickId);
  }
}

function anyModalOpen() {
  return (
    fridgeModal.hidden === false ||
    pcModal.hidden === false ||
    peepModal.hidden === false ||
    boot.hidden === false
  );
}

canvas.addEventListener("pointerdown", (e) => {
  if (anyModalOpen()) return;
  if (e.button !== 0) return;
  if (state.locked) return;
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
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (!dragMoved && Math.hypot(dx, dy) < 4) return;
  if (!dragMoved) {
    dragMoved = true;
    dragStart = { x: e.clientX, y: e.clientY };
    return;
  }
  lookDelta(e.clientX - dragStart.x, e.clientY - dragStart.y);
  dragStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", (e) => {
  if (anyModalOpen()) return;
  if (state.locked) return;
  const moved = dragMoved;
  dragging = false;
  dragStart = null;
  dragMoved = false;
  if (!moved) {
    shootAtClient(e.clientX, e.clientY);
    lockPointer();
  }
});

canvas.addEventListener("click", () => {
  if (anyModalOpen()) return;
  if (state.locked) shootInteract();
  else lockPointer();
});

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Escape") {
    exitPointer();
    fridgeModal.hidden = true;
    pcModal.hidden = true;
    peepModal.hidden = true;
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
  say("Валера дома. Поздоровайся → поиграй → сними камерой → смотри на компе. Желтобрюх на улице.");
};

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
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
  player.x = Math.max(-7.2, Math.min(7.2, player.x));
  player.z = Math.max(-28, Math.min(8.6, player.z));
  updateCam();
  scene.background = new THREE.Color(player.z < -12 ? 0x87c8ef : player.z < -2 ? 0xc8d8e8 : 0xffe8a0);
  scene.fog.color.copy(scene.background);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
