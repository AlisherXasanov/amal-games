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
  yaw: 0,
  pitch: 0
};

const player = { x: 0, z: 4.5, speed: 4.2 };
const keys = {};
const clickables = [];
const solids = []; // {minX,maxX,minZ,maxZ}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe566);
scene.fog = new THREE.Fog(0xffe566, 12, 28);

const camera = new THREE.PerspectiveCamera(70, 1, 0.08, 80);
scene.add(new THREE.AmbientLight(0xffffff, 0.88));
const sun = new THREE.DirectionalLight(0xfff1c8, 1.05);
sun.position.set(4, 10, 6);
scene.add(sun);

const texCache = {};
function tex(key, draw, size = 128) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache[key] = t;
  return t;
}
function woodTex(g, s) {
  g.fillStyle = "#b8894a";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = `rgba(90,50,20,${0.15 + Math.random() * 0.25})`;
    g.beginPath();
    g.moveTo(0, i * 8 + 3);
    g.bezierCurveTo(s * 0.3, i * 8, s * 0.7, i * 8 + 6, s, i * 8);
    g.stroke();
  }
}
function metalTex(g, s) {
  const grd = g.createLinearGradient(0, 0, s, s);
  grd.addColorStop(0, "#e8eef4");
  grd.addColorStop(1, "#9aadb8");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  g.fillStyle = "rgba(255,255,255,0.25)";
  g.fillRect(10, 0, 20, s);
}
function candyTex(g, s) {
  g.fillStyle = "#e51d30";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#fff";
  g.fillRect(0, s * 0.4, s, s * 0.2);
}
function sandTex(g, s) {
  g.fillStyle = "#e6d3a0";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 80; i++) {
    g.fillStyle = `rgba(120,90,40,${Math.random() * 0.25})`;
    g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
}
function bookTex(g, s) {
  g.fillStyle = "#2f6fdb";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#f0b429";
  g.fillRect(s * 0.1, s * 0.15, s * 0.8, s * 0.12);
  g.fillStyle = "#fff8e0";
  g.fillRect(s * 0.15, s * 0.4, s * 0.7, s * 0.35);
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
function matMap(key, drawer, color = 0xffffff) {
  return new THREE.MeshLambertMaterial({ map: tex(key, drawer), color });
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
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), mat);
  body.scale.set(1, 1.12, 0.9);
  body.position.y = 0.95;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), mat);
  head.position.y = 1.45;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat);
    ear.position.set(s * 0.24, 1.68, 0);
    g.add(ear);
    if (sleepy) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), dark);
      e.position.set(s * 0.1, 1.48, 0.28);
      g.add(e);
    } else {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), dark);
      e.position.set(s * 0.1, 1.5, 0.28);
      g.add(e);
    }
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), dark);
  nose.position.set(0, 1.38, 0.32);
  g.add(nose);
  if (sleepy) g.rotation.z = 0.5;
  g.scale.setScalar(scale);
  return g;
}

function zoneName() {
  const { x, z } = player;
  if (z < -10) return "Пляж";
  if (x > 6) return "Роботы";
  if (x < -5.5) return "Кухня";
  if (z < 1.2) return "Дверь соседа";
  if (z > 6) return "Спальня";
  return "Коридор / гостиная";
}

function buildWorld() {
  // floor house
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    matMap("wood", woodTex)
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 2);
  scene.add(floor);

  // стены дома с проходом на пляж (юг)
  box(6, 3.2, 0.25, matMap("wood", woodTex), -5, 1.6, -2.0);
  box(6, 3.2, 0.25, matMap("wood", woodTex), 5, 1.6, -2.0);
  box(0.25, 3.2, 14, matMap("wood", woodTex), -8, 1.6, 2);
  box(0.25, 3.2, 14, matMap("wood", woodTex), 8, 1.6, 2);
  box(16, 3.2, 0.25, matMap("wood", woodTex), 0, 1.6, 9.5);
  // --- bedroom (z ~ 7) ---
  const bed = box(2.4, 0.45, 1.4, matMap("wood", woodTex), 0, 0.35, 7.6);
  mark(bed, "bed", "Кровать");
  const dresser = box(1.3, 1.1, 0.55, matMap("wood", woodTex), 3.2, 0.7, 7.8);
  mark(dresser, "dresser", "Комод");
  const book = box(0.25, 0.35, 0.08, matMap("book", bookTex), 3.0, 1.4, 7.7, false);
  mark(book, "book", "Книжка");
  const bear = makeBear(0xe51d30, false);
  bear.position.set(-0.8, 0, 7.2);
  scene.add(bear);
  mark(bear, "bear", "Желейный мишка");
  const baby = makeBear(0xff8fab, false, 0.42);
  baby.position.set(0.6, 0, 7.3);
  if (state.babyDressed) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.15), matColor(0xffffff));
    c.position.set(0, 0.9, 0.12);
    baby.add(c);
  }
  scene.add(baby);
  mark(baby, "baby", "Крошка");

  // --- hall / living ---
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), matMap("candy", candyTex));
    c.position.set(-2.5 + i * 0.35, 1.55, 3.5);
    scene.add(c);
    mark(c, "candy", "Конфета");
  }
  const shelf = box(2.2, 0.12, 0.4, matMap("wood", woodTex), -2.0, 1.4, 3.3, false);
  mark(shelf, "shelf", "Полка");
  const dump = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), matColor(0xf5e6c8));
  dump.scale.set(1.3, 0.85, 1);
  dump.position.set(1.2, 0.9, 3.2);
  scene.add(dump);
  mark(dump, "dumpling", "Дамплинг");
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 10), matColor(0xfff2c8));
  candle.position.set(1.6, 0.95, 3.2);
  scene.add(candle);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matColor(0xff8800));
  flame.position.set(1.6, 1.15, 3.2);
  scene.add(flame);
  mark(candle, "candle", "Свечка");
  mark(flame, "candle", "Свечка");
  const cam = box(0.28, 0.18, 0.22, matColor(0x333333), 2.4, 0.95, 3.4, false);
  mark(cam, "camera", "Камера");
  const bath = box(1.6, 0.55, 0.9, matColor(0xddeeff), 4.5, 0.4, 4.5);
  mark(bath, "bath", "Ванночка");

  // --- kitchen (x negative) ---
  const fridge = box(1.2, 2.3, 0.85, matMap("metal", metalTex), -6.2, 1.2, 2.5);
  mark(fridge, "fridge", "Холодильник");
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12),
    new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.75 })
  );
  water.position.set(-5.2, 1.0, 3.5);
  scene.add(water);
  mark(water, "water", "Вода");
  const table = box(2.2, 0.15, 1.2, matMap("wood", woodTex), -5.5, 0.85, 4.2);
  mark(table, "table", "Стол");
  const battery = box(0.25, 0.12, 0.15, matColor(0x33aa55), -5.0, 1.0, 4.0, false);
  mark(battery, "battery", "Батарейка");
  const goggles = box(0.28, 0.1, 0.18, matColor(0x44c0ff), -5.5, 1.0, 3.8, false);
  mark(goggles, "goggles", "Очки");
  const coat = box(0.3, 0.45, 0.12, matColor(0xffffff), -6.5, 1.2, 4.8, false);
  mark(coat, "coat", "Халатик");

  // --- neighbor door (z small) ---
  const door = box(1.5, 2.5, 0.15, matMap("wood", woodTex), 0, 1.3, -1.5);
  mark(door, "door", "Дверь");
  const peep = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), matColor(0x111));
  peep.position.set(0, 1.6, -1.4);
  scene.add(peep);
  mark(peep, "peep", "Глазок");
  const yellow = makeBear(0xf0c000, state.yellowAsleep, 0.9);
  yellow.position.set(2.2, 0, -0.5);
  scene.add(yellow);
  mark(yellow, "yellow", "Жёлтый мишка");

  // --- robots (x positive) ---
  const elik = box(0.55, 0.7, 0.4, matColor(0x6ec9ff), 6.5, 0.9, 2.5);
  mark(elik, "elik", "Элик");
  const kub = box(0.5, 0.5, 0.5, matColor(state.kubCharged ? 0x7dffb0 : 0x8899aa), 6.5, 0.8, 4.0);
  mark(kub, "kub", "Робот Куб");
  for (let i = 0; i < 3; i++) {
    const cu = box(0.18, 0.18, 0.18, matColor([0xe51d30, 0x2f6fdb, 0xf0b429][i]), 5.8 + i * 0.25, 0.3, 3.2, false);
    mark(cu, "cube", "Кубик");
  }

  // --- beach (z < -12) ---
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), matMap("sand", sandTex));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.02, -18);
  scene.add(sand);
  const waterPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 12),
    new THREE.MeshLambertMaterial({ color: 0x3aa0d8 })
  );
  waterPlane.rotation.x = -Math.PI / 2;
  waterPlane.position.set(0, -0.01, -26);
  scene.add(waterPlane);
  scene.background = new THREE.Color(0xffe566);

  // path to beach - opening
  const path = box(3.5, 0.05, 8, matMap("sand", sandTex), 0, 0.02, -6, false);
  mark(path, "path", "Тропинка на пляж");
  const umbrella = box(0.1, 1.5, 0.1, matColor(0xffffff), -1.5, 0.8, -16, false);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.3, 12), matColor(0xe51d30));
  cone.position.set(-1.5, 1.6, -16);
  scene.add(cone);
  mark(umbrella, "umbrella", "Зонтик");
  mark(cone, "umbrella", "Зонтик");
  const beachBear = makeBear(0xe51d30, false);
  beachBear.position.set(0.5, 0, -15.5);
  scene.add(beachBear);
  mark(beachBear, "bear", "Мишка на пляже");
}

function has(id) {
  return state.inv.includes(id);
}
function take(id) {
  if (!ITEM[id]) return;
  // several same type allowed up to 5
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

function openFridge() {
  state.fridgeBearSleep = Math.random() < 0.35;
  fridgeExtra.textContent = state.fridgeBearSleep
    ? "Ого… там кто-то спит между полками."
    : "Холодно. Можно взять вещи.";
  fridgeIn.innerHTML = "";
  ["pizza", "water", "candy", "battery"].forEach((id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = ITEM[id].emoji + " " + ITEM[id].name;
    b.onclick = () => take(id);
    fridgeIn.appendChild(b);
  });
  if (state.fridgeBearSleep) {
    const wake = document.createElement("button");
    wake.type = "button";
    wake.textContent = "😴 Разбудить";
    wake.onclick = () => {
      state.fridgeBearSleep = false;
      fridgeExtra.textContent = "Проснулся. Дай конфетку.";
      askCandy();
    };
    fridgeIn.appendChild(wake);
  }
  fridgeModal.hidden = false;
  exitPointer();
}
document.getElementById("fridgeClose").onclick = () => {
  fridgeModal.hidden = true;
};

function interact(id) {
  if (id === "bear") {
    if (state.selected === "candy") {
      useOne("candy");
      say("Ммм… Дай конфетку, дай конфетку.");
      return;
    }
    if (state.selected === "camera") {
      say("Щёлк! Кадр сохранён в голове.");
      return;
    }
    if (state.selected === "dumpling") {
      say("Хлюп. Опыт с дамплингом.");
      return;
    }
    if (state.selected === "candle") {
      say("Свечка рядом. Тепло. Осторожно.");
      return;
    }
    if (state.selected === "water") {
      useOne("water");
      say("Бульк.");
      return;
    }
    askCandy();
    return;
  }
  if (id === "baby") {
    if (state.selected === "coat") {
      useOne("coat");
      state.babyDressed = true;
      say("Крошка в халатике. К опыту готова.");
      return;
    }
    if (state.selected === "goggles") {
      useOne("goggles");
      say("Очки на Крошке.");
      return;
    }
    say(state.babyDressed ? "Крошка тут. Всегда дома." : "Крошку можно одеть.");
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
  if (id === "fridge") openFridge();
  if (id === "bath") {
    state.bathing = !state.bathing;
    say(state.bathing ? "Купается. Бульк-бульк." : "Вылез из ванны.");
  }
  if (id === "peep") {
    state.peepDone = true;
    state.yellowAsleep = Math.random() < 0.65;
    say(state.yellowAsleep ? "В глазок: спит." : "В глазок: смотрит.");
  }
  if (id === "door") say(state.peepDone ? "Дверь." : "Сначала глазок.");
  if (id === "yellow") {
    if (!state.peepDone) {
      say("Сначала посмотри в глазок.");
      return;
    }
    say(state.yellowAsleep ? "…хррр…" : "Чего надо? Конфеты мои.");
  }
  if (id === "elik") say("Бип! Мини-игра потом — пока просто бип.");
  if (id === "kub") {
    if (state.selected === "battery") {
      useOne("battery");
      state.kubCharged = true;
      say("Батарейка вставлена.");
      return;
    }
    say(state.kubCharged ? "Дай кубик." : "Нужна батарейка.");
  }
  if (id === "bed") say("Кровать.");
  if (id === "dresser") {
    if (!has("coat")) take("coat");
    else say("Комод.");
  }
  if (id === "table" || id === "shelf") say("Можно ставить вещи.");
  if (id === "umbrella" || id === "path") say("Пляж рядом. Иди вперёд к песку.");
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

canvas.addEventListener("pointerdown", (e) => {
  if (fridgeModal.hidden === false || boot.hidden === false) return;
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
  if (fridgeModal.hidden === false || boot.hidden === false) return;
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
  if (fridgeModal.hidden === false || boot.hidden === false) return;
  if (state.locked) shootInteract();
  else lockPointer();
});

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Escape") {
    exitPointer();
    fridgeModal.hidden = true;
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
  say("Дай конфетку. WASD — ходить. Крошка всегда дома. Мышью можно крутить и без блокировки.");
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
  // soft bounds
  player.x = Math.max(-7.2, Math.min(7.2, player.x));
  player.z = Math.max(-28, Math.min(9.0, player.z));
  updateCam();
  // beach sky
  scene.background = new THREE.Color(player.z < -10 ? 0x87c8ef : 0xffe566);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
