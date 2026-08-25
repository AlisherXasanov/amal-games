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
const camHud = document.getElementById("camHud");
const expModal = document.getElementById("expModal");
const expList = document.getElementById("expList");

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
  duck: { emoji: "🦆", name: "уточка" },
  candyBox: { emoji: "🍬", name: "конфетница" },
  valCandle: { emoji: "🕯️", name: "свечка-Валера" },
  chocValera: { emoji: "🍫", name: "шоколадный Валера" },
  dubaiValera: { emoji: "🍫", name: "дубайский шоколад Валера" },
  jelly: { emoji: "🟡", name: "желе" },
  lollipop: { emoji: "🍭", name: "леденец" }
};

const LOOT = new Set(Object.keys(ITEM).filter((k) => k !== "candyBox"));
const FOOD = new Set(["candy", "dumpling", "butter", "pizza", "cookie", "apple", "banana", "cake", "ice", "juice", "milk", "jelly", "lollipop", "chocValera", "dubaiValera"]);

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
  camOn: false,
  experimentsDone: [],
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
function tex(key, draw, size = 512) {
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
function noise(g, s, a = 0.12, step = 2) {
  const img = g.getImageData(0, 0, s, s);
  const d = img.data;
  for (let y = 0; y < s; y += step) {
    for (let x = 0; x < s; x += step) {
      const n = (Math.random() - 0.5) * 255 * a;
      for (let dy = 0; dy < step && y + dy < s; dy++) {
        for (let dx = 0; dx < step && x + dx < s; dx++) {
          const i = ((y + dy) * s + (x + dx)) * 4;
          d[i] = Math.max(0, Math.min(255, d[i] + n));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
        }
      }
    }
  }
  g.putImageData(img, 0, 0);
}
function floorTex(g, s) {
  const rows = 8;
  const h = s / rows;
  for (let r = 0; r < rows; r++) {
    const base = r % 2 ? [168, 118, 62] : [210, 168, 108];
    g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
    g.fillRect(0, r * h, s, h - 1);
    for (let x = 0; x < s; x += 3) {
      const wobble = Math.sin(x * 0.04 + r) * 2;
      g.strokeStyle = `rgba(80,40,12,${0.08 + Math.random() * 0.12})`;
      g.beginPath();
      g.moveTo(x, r * h + 2 + wobble);
      g.lineTo(x + 2, r * h + h - 3 + wobble * 0.5);
      g.stroke();
    }
    g.fillStyle = "rgba(60,30,10,0.35)";
    g.fillRect(0, (r + 1) * h - 2, s, 2);
  }
  noise(g, s, 0.1, 2);
}
function wallTex(g, s) {
  const grd = g.createLinearGradient(0, 0, 0, s);
  grd.addColorStop(0, "#faf3e4");
  grd.addColorStop(0.55, "#f0e2c4");
  grd.addColorStop(1, "#e6d4ae");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = `rgba(180,150,100,${0.08 + (i % 3) * 0.04})`;
    g.lineWidth = 1;
    const y = ((i + 0.5) * s) / 18;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(s, y + Math.sin(i) * 2);
    g.stroke();
  }
  noise(g, s, 0.06, 3);
}
function tileTex(g, s) {
  const n = 8;
  const cell = s / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const shade = 220 + ((x + y) % 2) * 12 + Math.floor(Math.random() * 8);
      g.fillStyle = `rgb(${shade - 8},${shade},${shade + 6})`;
      g.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      g.strokeStyle = "rgba(140,160,170,0.55)";
      g.strokeRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1);
    }
  }
  noise(g, s, 0.07, 2);
}
function woodTex(g, s) {
  g.fillStyle = "#a8753a";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 28; i++) {
    g.strokeStyle = `rgba(60,30,10,${0.12 + Math.random() * 0.18})`;
    g.lineWidth = 1 + (i % 3);
    g.beginPath();
    g.moveTo(0, (i * s) / 28 + Math.random() * 4);
    g.bezierCurveTo(s * 0.35, (i * s) / 28 + 6, s * 0.65, (i * s) / 28 - 4, s, (i * s) / 28 + 3);
    g.stroke();
  }
  noise(g, s, 0.09, 2);
}
function fabricTex(g, s) {
  g.fillStyle = "#3d6eb8";
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 4) {
    for (let x = 0; x < s; x += 4) {
      const weave = ((x / 4 + y / 4) % 2) === 0;
      g.fillStyle = weave ? "rgba(90,140,210,0.55)" : "rgba(40,80,150,0.45)";
      g.fillRect(x, y, 4, 4);
    }
  }
  for (let i = 0; i < s; i += 8) {
    g.strokeStyle = "rgba(255,255,255,0.08)";
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, s);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(s, i);
    g.stroke();
  }
  noise(g, s, 0.08, 2);
}
function doorTex(g, s) {
  const grd = g.createLinearGradient(0, 0, s, 0);
  grd.addColorStop(0, "#6a3e1c");
  grd.addColorStop(0.5, "#8a5628");
  grd.addColorStop(1, "#5e3616");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 20; i++) {
    g.strokeStyle = `rgba(40,20,8,${0.15 + Math.random() * 0.2})`;
    g.beginPath();
    g.moveTo(0, i * (s / 20));
    g.lineTo(s, i * (s / 20) + 2);
    g.stroke();
  }
  g.strokeStyle = "#4a2a12";
  g.lineWidth = 14;
  g.strokeRect(18, 18, s - 36, s - 36);
  g.lineWidth = 6;
  g.strokeRect(s * 0.12, s * 0.12, s * 0.76, s * 0.35);
  g.strokeRect(s * 0.12, s * 0.52, s * 0.76, s * 0.35);
  g.fillStyle = "#c9a227";
  g.beginPath();
  g.arc(s * 0.78, s * 0.5, 14, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2a1a0a";
  g.beginPath();
  g.arc(s * 0.78, s * 0.5, 5, 0, Math.PI * 2);
  g.fill();
  noise(g, s, 0.08, 2);
}
function metalTex(g, s) {
  const grd = g.createLinearGradient(0, 0, s, s);
  grd.addColorStop(0, "#f4f7fa");
  grd.addColorStop(0.4, "#c5d0d8");
  grd.addColorStop(0.7, "#9aadb8");
  grd.addColorStop(1, "#dfe6eb");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.08})`;
    g.beginPath();
    g.moveTo(0, Math.random() * s);
    g.lineTo(s, Math.random() * s);
    g.stroke();
  }
  noise(g, s, 0.05, 2);
}
function candyTex(g, s) {
  g.fillStyle = "#e51d30";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 10; i++) {
    g.fillStyle = i % 2 ? "#fff8f0" : "#e51d30";
    g.fillRect(0, (i * s) / 10, s, s / 10);
  }
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.fillRect(0, s * 0.38, s, s * 0.24);
  noise(g, s, 0.06, 3);
}
function sandTex(g, s) {
  g.fillStyle = "#e8d4a4";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = 1 + Math.random() * 2;
    g.fillStyle = `rgba(${180 + Math.random() * 60},${150 + Math.random() * 40},${90 + Math.random() * 40},${0.25 + Math.random() * 0.35})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  noise(g, s, 0.1, 2);
}
function bookTex(g, s) {
  const grd = g.createLinearGradient(0, 0, s, 0);
  grd.addColorStop(0, "#1a3a8a");
  grd.addColorStop(0.15, "#2a55c0");
  grd.addColorStop(1, "#1e48a8");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#f0b429";
  g.fillRect(s * 0.1, s * 0.15, s * 0.8, s * 0.1);
  g.fillStyle = "rgba(255,255,255,0.15)";
  g.fillRect(s * 0.1, s * 0.55, s * 0.8, s * 0.04);
  g.fillRect(s * 0.1, s * 0.65, s * 0.55, s * 0.04);
  noise(g, s, 0.07, 3);
}
function rugTex(g, s) {
  g.fillStyle = "#b83a2e";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 6; i++) {
    g.strokeStyle = i % 2 ? "#f0c84a" : "#8a2418";
    g.lineWidth = 10 - i;
    g.strokeRect(20 + i * 18, 20 + i * 18, s - 40 - i * 36, s - 40 - i * 36);
  }
  for (let y = 40; y < s - 40; y += 6) {
    for (let x = 40; x < s - 40; x += 6) {
      if ((x + y) % 12 === 0) {
        g.fillStyle = "rgba(240,200,80,0.25)";
        g.fillRect(x, y, 3, 3);
      }
    }
  }
  noise(g, s, 0.08, 2);
}
function asphaltTex(g, s) {
  g.fillStyle = "#5a5e64";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 800; i++) {
    g.fillStyle = `rgba(${50 + Math.random() * 40},${50 + Math.random() * 40},${55 + Math.random() * 40},0.4)`;
    g.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 4, 2);
  }
  g.fillStyle = "#d8c86a";
  g.fillRect(s * 0.46, 0, s * 0.08, s);
  g.fillStyle = "rgba(0,0,0,0.25)";
  for (let y = 0; y < s; y += 48) g.fillRect(s * 0.46, y + 24, s * 0.08, 16);
  noise(g, s, 0.09, 2);
}
function screenTex(g, s) {
  const grd = g.createLinearGradient(0, 0, 0, s);
  grd.addColorStop(0, "#0a1812");
  grd.addColorStop(1, "#102818");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 3) {
    g.fillStyle = `rgba(61,255,138,${0.03 + (y % 9 === 0 ? 0.06 : 0)})`;
    g.fillRect(0, y, s, 1);
  }
  g.fillStyle = "#3dff8a";
  g.font = "bold " + Math.floor(s * 0.11) + "px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "#1aff66";
  g.shadowBlur = 12;
  g.fillText("ПК ВАЛЕРЫ", s / 2, s * 0.5);
  g.shadowBlur = 0;
  noise(g, s, 0.04, 4);
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
  if (!state.greeted) questEl.textContent = "Кликни Валеру — поговорить";
  else if (!state.played) questEl.textContent = "Кликни вещь, потом Валеру — или просто кликни Валеру (сам возьмёт еду из кармана)";
  else questEl.textContent = "Гуляй по комнатам. Диван — отдых. Дверь — улица.";
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
    if (solids[i].tag === "doorway" || solids[i].tag === "doorclear") solids.splice(i, 1);
  }
  if (!open) {
    addSolid(0, -2.0, 2.0, 0.4, "doorway");
  }
  if (!silent) {
    say(open ? "Дверь открыта! Смотри на коврик у двери и иди вперёд (W) на улицу." : "Дверь закрыта. E или ручка — открыть.");
  }
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

  // коврик-стрелка к двери (видно куда идти)
  const exitMat = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.4),
    matColor(0x3dff8a)
  );
  exitMat.rotation.x = -Math.PI / 2;
  exitMat.position.set(0, 0.03, -0.6);
  scene.add(exitMat);
  const exitOut = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), matColor(0xffe066));
  exitOut.rotation.x = -Math.PI / 2;
  exitOut.position.set(0, 0.03, -3.2);
  scene.add(exitOut);

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
  const sofa = furniture(2.2, sofaH, 0.85, matMap("fabric", fabricTex), -1.8, 2.4);
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
  const candyBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.14, 18),
    matColor(0xff6b9d)
  );
  candyBowl.position.set(0.85, 0, 4.55);
  putOn(candyBowl, shelfTop);
  scene.add(candyBowl);
  mark(candyBowl, "candyBox", "конфетница");
  const candyPile = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), matMap("candy", candyTex));
  candyPile.position.set(0.85, shelfTop + 0.16, 4.55);
  scene.add(candyPile);
  spawnLootSphere("butter", 2.2, shelfTop, 4.55, 0xe8b84a, 0.11);
  spawnLootBox("camera", 0.28, 0.16, 0.2, 0x2a2a2a, 2.55, shelfTop, 4.55);
  spawnLootSphere("jelly", 1.35, shelfTop, 4.55, 0xffdd44, 0.1);
  spawnLootBox("lollipop", 0.06, 0.22, 0.06, 0xff66aa, 1.55, shelfTop, 4.5);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), matColor(0x7dff4a));
  ball.position.set(0.8, 0, 1.5);
  putOn(ball, 0);
  scene.add(ball);
  mark(ball, "ball", "Мяч");

  spawnLootBox("remote", 0.22, 0.06, 0.1, 0x333, -0.1, tableH, 2.0);
  spawnLootBox("phone", 0.12, 0.02, 0.22, 0x111, 0.4, tableH, 1.9);
  spawnLootSphere("dumpling", 0.6, tableH, 2.15, 0xf5e6c8, 0.12);
  const valCandleBear = makeBear(0xe51d30, 0.25);
  valCandleBear.position.set(-0.35, 0, 2.15);
  putOn(valCandleBear, tableH);
  scene.add(valCandleBear);
  mark(valCandleBear, "valCandle", ITEM.valCandle.name);
  const labTable = furniture(1.0, 0.72, 0.55, matColor(0xc4a574), -1.6, 3.6);
  mark(labTable, "lab", "Стол опытов");
  box(0.35, 0.08, 0.25, matColor(0x88aacc), -1.6, 0.76, 3.6, false);

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
  spawnLootBox("chocValera", 0.16, 0.22, 0.1, 0x5c3310, -5.1, kh, 4.65);
  spawnLootBox("dubaiValera", 0.18, 0.12, 0.12, 0x3d2314, -6.45, kh, 4.35);
  spawnLootSphere("jelly", -5.65, kh, 4.15, 0xffcc33, 0.09);

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


const EXPERIMENTS = [
  { id: "e1", title: "Свечка + конфета", need: ["candle", "candy"], result: "Конфета загорелась карамельным огоньком! Валера: «Ого, сладкий факел!»" },
  { id: "e2", title: "Дамплинг + вода", need: ["dumpling", "water"], result: "Дамплинг распарился и запел. Крошка хлопает." },
  { id: "e3", title: "Баттерсквиш + свечка-Валера", need: ["butter", "valCandle"], result: "Сквошь расплавился в золотой лужице. Пахнет праздником!" },
  { id: "e4", title: "Шоколадный Валера + желе", need: ["chocValera", "jelly"], result: "Шоколадный Валера в желе — дрожит, но улыбается!" },
  { id: "e5", title: "Дубайский + конфета", need: ["dubaiValera", "candy"], result: "Дубайский шоколад хрустнул фисташкой. Валера: «Богатство во рту!»" },
  { id: "e6", title: "Батарейка + кубик", need: ["battery", "cube"], result: "Кубик замигал и сказал «бип-бип». Элик ревнует." },
  { id: "e7", title: "Леденец + свечка", need: ["lollipop", "candle"], result: "Леденец стал прозрачной призмой. Радуга на стене!" },
  { id: "e8", title: "Желе + вода", need: ["jelly", "water"], result: "Желе разбухло до размера мяча. Можно кидать (осторожно)." },
  { id: "e9", title: "Молоко + печенье", need: ["milk", "cookie"], result: "Классика: печенье намокло идеально. Валера доволен." },
  { id: "e10", title: "Сок + лёд", need: ["juice", "ice"], result: "Сок со льдом — шипит и пузырится. Летний клип готов." },
  { id: "e11", title: "Пицца + баттерсквиш", need: ["pizza", "butter"], result: "Пицца получила сквошь-топпинг. Спорная, но вкусная наука." },
  { id: "e12", title: "Яблоко + леденец", need: ["apple", "lollipop"], result: "Яблоко в сахарной глазури. Ярмарка прямо на столе!" },
  { id: "e13", title: "Банан + желе", need: ["banana", "jelly"], result: "Бананово-желейный смузи в чашке. Крошка: «Ещё!»" },
  { id: "e14", title: "Торт + свечка-Валера", need: ["cake", "valCandle"], result: "День рождения! Свечка-Валера поёт фальшиво, но мило." },
  { id: "e15", title: "Камера + очки", need: ["camera", "goggles"], result: "Очки на камере: фильтр «лаборатория». Всё выглядит научнее." },
  { id: "e16", title: "Мыло + уточка", need: ["soap", "duck"], result: "Пена + уточка = мини-океан в миске. Ква-эксперимент." },
  { id: "e17", title: "Шампунь + вода", need: ["shampoo", "water"], result: "Горы пузырей. Валера чихает от радости." },
  { id: "e18", title: "Книжка + свечка", need: ["book", "candle"], result: "Читаем при свете. Концовка: «и жили-были сладко»." },
  { id: "e19", title: "Мяч + желе", need: ["ball", "jelly"], result: "Мяч в желе не тонет и не всплывает — квантовый мяч!" },
  { id: "e20", title: "Ключи + кубик", need: ["keys", "cube"], result: "Кубик открыл «секретный ящик»… с ещё одной конфетой." },
  { id: "e21", title: "Телефон + камера", need: ["phone", "camera"], result: "Стрим с двух камер. Желтобрюх набрал 3 зрителя." },
  { id: "e22", title: "Пульт + конфета", need: ["remote", "candy"], result: "Пульт + конфета: канал «Сладкие опыты» сам включился." },
  { id: "e23", title: "Ложка + шоколадный Валера", need: ["spoon", "chocValera"], result: "Ложка вырезала улыбку на шоколаде. Арт-объект." },
  { id: "e24", title: "Тарелка + дамплинг + вода", need: ["plate", "dumpling", "water"], result: "Ресторан «Валера». Оценка: пять звёзд из пяти желе." },
  { id: "e25", title: "Дубайский + желе + конфета", need: ["dubaiValera", "jelly", "candy"], result: "Тройной десерт: хруст, дрожь, блеск. Клип «Мишлен дома»." },
  { id: "e26", title: "Свечка-Валера + леденец", need: ["valCandle", "lollipop"], result: "Леденец расплавился в кляксу-сердце. Романтика лаборатории." },
  { id: "e27", title: "Батарейка + лампа", need: ["battery", "lamp"], result: "Лампа вспыхнула жёлтым. Ночной режим опытов ВКЛ." },
  { id: "e28", title: "Цветок + вода + конфета", need: ["plant", "water", "candy"], result: "Цветок вырос на 2 мм и пахнет карамелью. Ботаника 2.0." }
];

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
  state.selected = id;
  renderInv();
  updateQuest();
  if (id === "camera") {
    state.camOn = true;
    syncCamHud();
    say("Камера ВКЛ. F — выкл/вкл. Кликай на героя — снять.");
  } else {
    say("Взял: " + ITEM[id].name);
  }
  return true;
}
function pickForValera() {
  if (state.selected && (FOOD.has(state.selected) || state.selected === "ball" || state.selected === "camera")) return state.selected;
  for (const id of state.inv) if (FOOD.has(id)) return id;
  if (has("ball")) return "ball";
  if (has("camera")) return "camera";
  return null;
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
function invSlots() {
  const slots = [];
  const seen = new Set();
  state.inv.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      slots.push(id);
    }
  });
  return slots;
}
function selectSlot(n) {
  const slots = invSlots();
  if (n < 0 || n >= slots.length) {
    say(slots.length ? "Пустой слот. Есть вещи в 1–" + slots.length : "Карман пуст — кликни вещь в мире.");
    return;
  }
  state.selected = slots[n];
  renderInv();
  say("Слот " + (n + 1) + ": " + ITEM[state.selected].name);
}
function renderInv() {
  invEl.innerHTML = "";
  const slots = invSlots();
  const counts = {};
  state.inv.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  slots.forEach((id, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    const inHand = state.selected === id;
    b.className = "item" + (inHand ? " sel" : "");
    b.innerHTML =
      "<span class='slotn'>" +
      (idx + 1) +
      "</span>" +
      ITEM[id].emoji +
      "<small>" +
      ITEM[id].name +
      (counts[id] > 1 ? "×" + counts[id] : "") +
      "</small>";
    b.onclick = (e) => {
      e.stopPropagation();
      state.selected = state.selected === id ? null : id;
      renderInv();
      if (state.selected) say("В руках: " + ITEM[id].name);
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
  if (!has("camera") || !state.camOn) return false;
  flashFilm();
  addClip(who === "valera" ? "С Валерой" : "Кадр", "Сняли: " + who);
  return true;
}

function syncCamHud() {
  if (camHud) camHud.hidden = !state.camOn;
}

function toggleCamera() {
  if (!has("camera")) {
    say("Сначала возьми камеру с полки.");
    return;
  }
  state.camOn = !state.camOn;
  syncCamHud();
  say(state.camOn ? "Камера ВКЛ. Кликай героя — снять." : "Камера ВЫКЛ. F — снова вкл.");
}

function openExp() {
  expList.innerHTML = "";
  EXPERIMENTS.forEach((ex) => {
    const b = document.createElement("button");
    b.type = "button";
    const done = state.experimentsDone.includes(ex.id);
    if (done) b.classList.add("done");
    const needTxt = ex.need.map((id) => (ITEM[id] ? ITEM[id].emoji + " " + ITEM[id].name : id)).join(" + ");
    b.innerHTML = (done ? "✓ " : "") + ex.title + "<span class='need'>Нужно: " + needTxt + "</span>";
    b.onclick = (e) => {
      e.stopPropagation();
      runExp(ex);
    };
    expList.appendChild(b);
  });
  expModal.hidden = false;
  exitPointer();
}

function runExp(ex) {
  for (const id of ex.need) {
    if (!has(id)) {
      say("Не хватает: " + (ITEM[id]?.name || id));
      return;
    }
  }
  if (ex.need.includes("candy")) useOne("candy");
  if (!state.experimentsDone.includes(ex.id)) state.experimentsDone.push(ex.id);
  say(ex.result);
  addClip("Опыт: " + ex.title, ex.result);
  openExp();
}

function closeAllModals() {
  fridgeModal.hidden = true;
  pcModal.hidden = true;
  peepModal.hidden = true;
  if (expModal) expModal.hidden = true;
}

function openFridge() {
  fridgeExtra.textContent = "Еда Валеры. Esc — закрыть.";
  fridgeIn.innerHTML = "";
  ["pizza", "water", "candy", "butter", "milk", "ice", "banana", "cake", "jelly", "lollipop"].forEach((id) => {
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
bindModalClose(expModal, "expClose");

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

  if (id === "candyBox") {
    take("candy");
    say("Конфетница бесконечная — ещё конфета!");
    return;
  }
  if (id === "lab") {
    openExp();
    return;
  }
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
    const give = pickForValera();
    if (give === "camera") {
      state.selected = "camera";
      if (tryFilm("valera")) return;
    }
    if (give && FOOD.has(give)) {
      const n = ITEM[give].name;
      useOne(give);
      state.played = true;
      updateQuest();
      say("Ммм, " + n + "! Поиграли.");
      return;
    }
    if (give === "ball") {
      useOne("ball");
      state.played = true;
      updateQuest();
      say("Кинули мяч! Играем.");
      return;
    }
    if (!state.greeted) {
      state.greeted = true;
      updateQuest();
      say("Привет! Это квартира Валеры.");
      return;
    }
    say("Кликни еду или мяч, потом меня — или просто кликни: возьму из кармана.");
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
  // открытая дверь: свободный коридор через проём
  const inDoorCorridor =
    state.doorOpen && nx > -0.95 && nx < 0.95 && nz > -3.4 && nz < 0.2;
  if (!inDoorCorridor) {
    for (const s of solids) {
      if (nx > s.minX && nx < s.maxX && nz > s.minZ && nz < s.maxZ) return;
    }
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
  return !fridgeModal.hidden || !pcModal.hidden || !peepModal.hidden || !(expModal?.hidden ?? true) || !boot.hidden;
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
  if (e.code === "KeyF" && !anyModalOpen()) {
    e.preventDefault();
    toggleCamera();
  }
  if (e.code === "KeyG" && !state.atBeach) bringGuest();
  if (e.code === "KeyE" && !state.atBeach && !anyModalOpen()) {
    setDoorOpen(!state.doorOpen);
  }
  // слоты 1–9 (и numpad)
  const digit = e.code.match(/^Digit([1-9])$/);
  const pad = e.code.match(/^Numpad([1-9])$/);
  const n = digit ? +digit[1] : pad ? +pad[1] : 0;
  if (n >= 1 && n <= 9 && !anyModalOpen()) {
    e.preventDefault();
    selectSlot(n - 1);
  }
  if (e.code === "Digit0" || e.code === "Numpad0") {
    state.selected = null;
    renderInv();
    say("Убрал из рук.");
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
  say("1–9 вещи · F камера · стол опытов · конфетница бесконечная.");
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
