import * as THREE from "three";

const canvas = document.getElementById("c");
const speech = document.getElementById("speech");
const roomTag = document.getElementById("roomTag");
const hoverLabel = document.getElementById("hoverLabel");
const invEl = document.getElementById("inv");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const elikModal = document.getElementById("elikModal");
const elikGrid = document.getElementById("elikGrid");
const elikStatus = document.getElementById("elikStatus");
const fridgeModal = document.getElementById("fridgeModal");
const fridgeIn = document.getElementById("fridgeIn");

const ROOMS = ["bedroom", "hall", "kitchen", "door", "robots", "beach"];
const TITLES = {
  bedroom: "Спальня",
  hall: "Коридор",
  kitchen: "Кухня",
  door: "Дверь соседа",
  robots: "Роботы",
  beach: "Пляж"
};

const ITEM_META = {
  candy: { emoji: "🍬", name: "конфета" },
  dumpling: { emoji: "🥟", name: "дамплинг" },
  ball: { emoji: "🎾", name: "мяч" },
  pizza: { emoji: "🍕", name: "пицца" },
  water: { emoji: "💧", name: "вода" },
  charge: { emoji: "🔋", name: "батарейка" },
  cube: { emoji: "🟦", name: "кубик" },
  book: { emoji: "📖", name: "книжка" },
  coat: { emoji: "🧥", name: "халатик" },
  goggles: { emoji: "🥽", name: "очки для опыта" }
};

const FRIDGE_STOCK = [
  { id: "pizza", label: "Пицца" },
  { id: "water", label: "Вода" },
  { id: "candy", label: "Конфета" },
  { id: "charge", label: "Батарейка" }
];

const state = {
  room: 0,
  inv: [],
  selected: null,
  bearHome: true,
  candyN: 0,
  peepDone: false,
  yellowAsleep: true,
  kubCharged: false,
  elikStep: 0,
  lookYaw: 0,
  babyDressed: false,
  fridgeOpen: false
};

const clickables = [];
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 120);
const camBase = new THREE.Vector3(0, 1.7, 3.55);
camera.position.copy(camBase);

scene.add(new THREE.AmbientLight(0xffffff, 0.95));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
sun.position.set(2.5, 6, 3.5);
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

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

function applyLook() {
  const yaw = state.lookYaw;
  camera.position.set(
    Math.sin(yaw) * 3.55,
    1.7,
    Math.cos(yaw) * 3.55
  );
  camera.lookAt(0, 1.05, 0);
}

function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  world.add(m);
  return m;
}

function makeBear(color, sleepy, scale = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a1010 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 28, 20), mat);
  body.scale.set(1, 1.15, 0.92);
  body.position.y = 1.08;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 28, 20), mat);
  head.position.y = 1.62;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), mat);
    ear.position.set(s * 0.27, 1.88, 0);
    g.add(ear);
    if (sleepy) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.02), dark);
      eye.position.set(s * 0.12, 1.64, 0.32);
      g.add(eye);
    } else {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), dark);
      eye.position.set(s * 0.12, 1.66, 0.32);
      g.add(eye);
    }
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), dark);
  nose.position.set(0, 1.52, 0.36);
  g.add(nose);
  const hi = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 })
  );
  hi.position.set(-0.18, 1.74, 0.26);
  g.add(hi);
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.36, 10), mat);
    arm.position.set(s * 0.54, 1.08, 0.05);
    arm.rotation.z = s * 0.55;
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 10), mat);
    leg.position.set(s * 0.18, 0.62, 0.04);
    g.add(leg);
  });
  if (sleepy) g.rotation.z = 0.5;
  g.scale.setScalar(scale);
  return g;
}

function makeBook(color, x, y, z) {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.32, 0.06),
    new THREE.MeshLambertMaterial({ color })
  );
  g.add(cover);
  const page = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.3, 0.04),
    new THREE.MeshLambertMaterial({ color: 0xfff8e8 })
  );
  page.position.z = 0.02;
  g.add(page);
  g.position.set(x, y, z);
  world.add(g);
  return g;
}

function makeDumpling() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 18, 14),
    new THREE.MeshLambertMaterial({ color: 0xf7e7c8 })
  );
  body.scale.set(1.25, 0.85, 1);
  g.add(body);
  return g;
}

function mark(obj, id, title) {
  obj.traverse((ch) => {
    ch.userData.clickId = id;
    ch.userData.title = title;
    if (ch.isMesh) clickables.push(ch);
  });
  if (obj.isMesh) {
    obj.userData.clickId = id;
    obj.userData.title = title;
    clickables.push(obj);
  }
}

function clearWorld() {
  clickables.length = 0;
  while (world.children.length) {
    const o = world.children.pop();
    o.traverse((ch) => {
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) {
        if (Array.isArray(ch.material)) ch.material.forEach((m) => m.dispose());
        else ch.material.dispose();
      }
    });
  }
}

function shell(wall = 0xffe566) {
  scene.background = new THREE.Color(wall);
  box(7.6, 3.5, 0.22, wall, 0, 1.6, -1.6);
  box(0.22, 3.5, 3.6, 0xffe08a, -3.7, 1.6, 0);
  box(0.22, 3.5, 3.6, 0xffe08a, 3.7, 1.6, 0);
  box(7.6, 0.22, 4, 0xd9a428, 0, 0, 0.15);
}

function build() {
  clearWorld();
  const id = ROOMS[state.room];
  roomTag.textContent = TITLES[id];
  prevBtn.disabled = state.room <= 0;
  nextBtn.disabled = state.room >= ROOMS.length - 1;
  state.lookYaw = 0;
  applyLook();

  if (id === "beach") {
    scene.background = new THREE.Color(0x87c8ef);
    // sand + water
    box(14, 0.3, 10, 0xe8d39a, 0, -0.1, 0);
    box(14, 0.2, 6, 0x3aa0d8, 0, -0.15, -4);
    const umbrella = box(0.12, 1.6, 0.12, 0xffffff, -1.2, 0.9, 0.5);
    mark(umbrella, "umbrella", "Зонтик");
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 0.35, 12),
      new THREE.MeshLambertMaterial({ color: 0xe51d30 })
    );
    top.position.set(-1.2, 1.75, 0.5);
    world.add(top);
    mark(top, "umbrella", "Зонтик на пляже");
    if (state.bearHome === false || true) {
      // beach trip bear if away OR always show vacation scene bear
      const beachBear = makeBear(0xe51d30, false, 1);
      beachBear.position.set(0.3, 0.2, 0.8);
      world.add(beachBear);
      mark(beachBear, "bear", "Мишка на пляже");
    }
    const towel = box(1.2, 0.05, 0.7, 0x2f6fdb, 1.3, 0.12, 1.0);
    mark(towel, "towel", "Пляжное полотенце");
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 10),
      new THREE.MeshLambertMaterial({ color: 0xffd1a8 })
    );
    shell.scale.set(1.3, 0.5, 1);
    shell.position.set(-0.3, 0.12, 1.4);
    world.add(shell);
    mark(shell, "shell", "Ракушка");
    return;
  }

  shell();

  if (id === "bedroom") {
    const bed = box(2.7, 0.5, 1.5, 0x8b5a2b, -0.4, 0.4, 0.1);
    mark(bed, "bed", "Кровать");
    box(2.7, 0.15, 1.5, 0xf5e6c8, -0.4, 0.68, 0.1);
    const dresser = box(1.4, 1.2, 0.6, 0xa67c52, 2.3, 0.75, -0.85);
    mark(dresser, "dresser", "Комод");
    // books — nicer
    const b1 = makeBook(0xe51d30, 2.05, 1.5, -0.7);
    mark(b1, "book", "Красивая книжка");
    const b2 = makeBook(0x2f6fdb, 2.3, 1.5, -0.7);
    mark(b2, "book", "Синяя книжка");
    const b3 = makeBook(0xf0b429, 2.55, 1.5, -0.7);
    mark(b3, "book", "Жёлтая книжка");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(0.15, 0.55, 0.45);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
      // baby Angelina / Kroshka
      const baby = makeBear(0xff8fab, false, 0.45);
      baby.position.set(0.85, 0.55, 0.55);
      if (state.babyDressed) {
        const coat = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.25, 0.2),
          new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        coat.position.set(0, 0.95, 0.15);
        baby.add(coat);
      }
      world.add(baby);
      mark(baby, "baby", "Крошка · маленькая мишка");
    }
    const bag = box(0.6, 0.42, 0.42, 0x5a3d1a, -2.3, 0.35, 0.55);
    mark(bag, "sea", "Чемодан → пляж");
  }

  if (id === "hall") {
    box(2.1, 0.14, 0.5, 0xc48a18, -1.9, 1.75, -1.3);
    box(2.1, 0.14, 0.5, 0xc48a18, 1.9, 1.75, -1.3);
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 14, 12),
        new THREE.MeshLambertMaterial({ color: i % 2 ? 0xe51d30 : 0xff6b6b })
      );
      c.position.set(-2.5 + i * 0.32, 1.95, -1.12);
      world.add(c);
      mark(c, "candy", "Конфета");
    }
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xf0c000 })
      );
      c.position.set(1.2 + i * 0.32, 1.95, -1.12);
      world.add(c);
      mark(c, "candy", "Жёлтая конфета");
    }
    const dump = makeDumpling();
    dump.position.set(0.15, 1.45, -1.05);
    world.add(dump);
    mark(dump, "dumpling", "Дамплинг");
    const bench = box(1.8, 0.3, 0.65, 0x8b5a2b, 0, 0.4, 0.7);
    mark(bench, "sit", "Скамейка");
    const coat = box(0.35, 0.55, 0.15, 0xffffff, -2.6, 1.2, 0.2);
    mark(coat, "coat", "Халатик для Крошки");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(-1.15, 0.55, 0.5);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
    }
  }

  if (id === "kitchen") {
    box(3.8, 0.22, 1.8, 0xe8c878, 0, 0.55, 0.25);
    const fridge = box(1.25, 2.4, 0.9, 0xe8eef5, -2.6, 1.3, -0.65);
    mark(fridge, "fridge", "Холодильник — заглянуть");
    box(0.1, 0.8, 0.1, 0x777777, -1.98, 1.3, -0.2);
    const shelf = box(1.8, 0.12, 0.45, 0xc48a18, 2.3, 1.7, -1.25);
    mark(shelf, "shelf", "Полка");
    const goggles = box(0.28, 0.12, 0.18, 0x44c0ff, 2.0, 1.85, -1.1);
    mark(goggles, "goggles", "Очки для опыта");
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.3, 14),
      new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.72 })
    );
    water.position.set(0.55, 0.8, 0.7);
    world.add(water);
    mark(water, "water", "Стакан воды");
    const dump = makeDumpling();
    dump.position.set(-0.55, 0.8, 0.75);
    world.add(dump);
    mark(dump, "dumpling", "Дамплинг");
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 12),
      new THREE.MeshLambertMaterial({ color: 0x4ec3ff })
    );
    ball.position.set(1.1, 0.74, 0.85);
    world.add(ball);
    mark(ball, "ball", "Мяч");
    const bat = box(0.28, 0.14, 0.16, 0x33aa55, 1.6, 0.72, 0.45);
    mark(bat, "charge", "Батарейка");
    [-0.85, 0.85].forEach((x) => {
      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xf0c29a })
      );
      hand.position.set(x, 2.15, 1.1);
      world.add(hand);
    });
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(0, 0.55, 0);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
      const baby = makeBear(0xff8fab, false, 0.42);
      baby.position.set(0.9, 0.55, 0.15);
      world.add(baby);
      mark(baby, "baby", "Крошка");
    }
  }

  if (id === "door") {
    const door = box(1.7, 2.7, 0.18, 0x8b5a2b, 0, 1.4, -1.35);
    mark(door, "door", "Дверь");
    const peep = new THREE.Mesh(
      new THREE.CircleGeometry(0.13, 20),
      new THREE.MeshLambertMaterial({ color: 0x0a0a0a })
    );
    peep.position.set(0, 1.7, -1.24);
    world.add(peep);
    mark(peep, "peep", "Глазок — смотри сначала!");
    const bell = box(0.18, 0.18, 0.14, 0xd4af37, 0.75, 1.4, -1.22);
    mark(bell, "bell", "Звонок");
    const yel = makeBear(0xf0c000, state.yellowAsleep, 0.95);
    yel.position.set(1.55, 0.55, 0.2);
    world.add(yel);
    mark(yel, "yellow", "Жёлтый мишка");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(-1.45, 0.55, 0.45);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
    }
  }

  if (id === "robots") {
    const elikBody = box(0.6, 0.75, 0.45, 0x6ec9ff, -1.2, 0.9, 0.25);
    mark(elikBody, "elik", "Элик — игра");
    const elikHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0xe8f7ff })
    );
    elikHead.position.set(-1.2, 1.5, 0.25);
    world.add(elikHead);
    mark(elikHead, "elik", "Элик");
    const kub = box(0.55, 0.55, 0.55, state.kubCharged ? 0x7dffb0 : 0x8899aa, 1.2, 0.8, 0.25);
    mark(kub, "kub", state.kubCharged ? "Робот Куб (заряжен)" : "Робот Куб (нужна батарейка)");
    for (let i = 0; i < 4; i++) {
      const c = box(0.22, 0.22, 0.22, [0xe51d30, 0x2f6fdb, 0xf0b429, 0x2a9d6e][i], -0.45 + i * 0.3, 0.35, 0.95);
      mark(c, "cube", "Кубик");
    }
  }
}

function has(id) {
  return state.inv.includes(id);
}
function take(id) {
  if (!ITEM_META[id]) return;
  if (has(id)) {
    say("Уже есть.");
    return;
  }
  state.inv.push(id);
  renderInv();
  say("Взял: " + ITEM_META[id].name);
}
function useUp(id) {
  state.inv = state.inv.filter((x) => x !== id);
  if (state.selected === id) state.selected = null;
  renderInv();
}

function renderInv() {
  invEl.innerHTML = "";
  if (!state.inv.length) {
    invEl.innerHTML = "<span class='muted'>пусто</span>";
    return;
  }
  state.inv.forEach((id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "item" + (state.selected === id ? " sel" : "");
    b.innerHTML = ITEM_META[id].emoji + "<small>" + ITEM_META[id].name + "</small>";
    b.onclick = () => {
      state.selected = state.selected === id ? null : id;
      renderInv();
      say(state.selected ? "Выбрано: " + ITEM_META[id].name : "Ок.");
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
  state.fridgeOpen = true;
  fridgeIn.innerHTML = "";
  FRIDGE_STOCK.forEach((it) => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = "<span class='e'>" + ITEM_META[it.id].emoji + "</span>" + it.label;
    b.onclick = () => take(it.id);
    fridgeIn.appendChild(b);
  });
  fridgeModal.hidden = false;
  say("Холодильник открыт. Бери что нужно.");
}
document.getElementById("fridgeClose").onclick = () => {
  fridgeModal.hidden = true;
  state.fridgeOpen = false;
};

function openElik() {
  state.elikStep = 0;
  elikStatus.textContent = "Жми 1 → 2 → 3 → 4";
  elikGrid.innerHTML = "";
  [1, 2, 3, 4].forEach((n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(n);
    b.onclick = () => {
      if (n === state.elikStep + 1) {
        state.elikStep++;
        if (state.elikStep >= 4) {
          elikStatus.textContent = "Победа!";
          say("Получилось.");
          take("cube");
        } else elikStatus.textContent = state.elikStep + " из 4";
      } else {
        state.elikStep = 0;
        elikStatus.textContent = "Снова с 1";
      }
    };
    elikGrid.appendChild(b);
  });
  elikModal.hidden = false;
}
document.getElementById("elikClose").onclick = () => {
  elikModal.hidden = true;
};

function onClickId(id) {
  if (id === "bear") {
    if (state.selected === "candy") {
      useUp("candy");
      say("Ммм… Дай конфетку, дай конфетку.");
      return;
    }
    if (state.selected === "dumpling") {
      say("Хлюп. Дамплинг.");
      return;
    }
    if (state.selected === "water") {
      useUp("water");
      say("Бульк.");
      return;
    }
    askCandy();
    return;
  }
  if (id === "baby") {
    if (state.selected === "coat") {
      useUp("coat");
      state.babyDressed = true;
      build();
      say("Крошка в халатике. Можно к опыту.");
      return;
    }
    if (state.selected === "goggles") {
      useUp("goggles");
      say("Очки на Крошке. Готова к опыту.");
      return;
    }
    say(state.babyDressed ? "Крошка готова." : "Крошку надо одеть: халатик или очки.");
    return;
  }
  if (id === "candy") take("candy");
  if (id === "dumpling") take("dumpling");
  if (id === "ball") take("ball");
  if (id === "water") take("water");
  if (id === "charge") take("charge");
  if (id === "cube") take("cube");
  if (id === "coat") take("coat");
  if (id === "goggles") take("goggles");
  if (id === "book") take("book");
  if (id === "sit") say("Сел.");
  if (id === "bed") say("Кровать.");
  if (id === "dresser") {
    if (!has("coat")) take("coat");
    else say("В комоде вещи Крошки.");
  }
  if (id === "shelf") say("Полка на кухне.");
  if (id === "fridge") openFridge();
  if (id === "sea") {
    state.bearHome = false;
    state.room = ROOMS.indexOf("beach");
    build();
    say("Пляж. Можно поворачивать взгляд кнопками ⟲ ⟳");
  }
  if (id === "towel") say("Полотенце на песке.");
  if (id === "umbrella") say("Тень от зонтика.");
  if (id === "shell") take("candy"); // fun: shell finds candy
  if (id === "peep") {
    state.peepDone = true;
    state.yellowAsleep = Math.random() < 0.7;
    build();
    say(state.yellowAsleep ? "В глазок: спит." : "В глазок: смотрит.");
  }
  if (id === "bell") {
    if (!state.peepDone) {
      say("Сначала глазок.");
      return;
    }
    say("Динь-дон.");
  }
  if (id === "door") say("Сначала глазок.");
  if (id === "yellow") {
    if (!state.peepDone) {
      say("Сначала посмотри в глазок.");
      return;
    }
    if (state.yellowAsleep) {
      say("…хррр…");
      return;
    }
    say("Чего надо? Конфеты мои.");
  }
  if (id === "elik") openElik();
  if (id === "kub") {
    if (state.selected === "charge") {
      useUp("charge");
      state.kubCharged = true;
      build();
      say("Батарейка вставлена. Заряжен.");
      return;
    }
    if (!state.kubCharged) {
      say("Мало энергии. Нужна батарейка.");
      return;
    }
    if (state.selected === "cube") {
      useUp("cube");
      say("Кубик принят.");
      return;
    }
    say("Дай кубик.");
  }
}

function getHit(ev) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(clickables, false)[0] || null;
}

canvas.addEventListener("pointermove", (ev) => {
  const hit = getHit(ev);
  if (hit && hit.object.userData.title) {
    hoverLabel.hidden = false;
    hoverLabel.textContent = hit.object.userData.title;
    const rect = canvas.getBoundingClientRect();
    hoverLabel.style.left = ev.clientX - rect.left + 12 + "px";
    hoverLabel.style.top = ev.clientY - rect.top + 12 + "px";
  } else hoverLabel.hidden = true;
});
canvas.addEventListener("click", (ev) => {
  const hit = getHit(ev);
  if (hit && hit.object.userData.clickId) onClickId(hit.object.userData.clickId);
});

function go(d) {
  const n = state.room + d;
  if (n < 0 || n >= ROOMS.length) return;
  state.room = n;
  build();
  say(TITLES[ROOMS[n]]);
}
prevBtn.onclick = () => go(-1);
nextBtn.onclick = () => go(1);
document.getElementById("lookL").onclick = () => {
  state.lookYaw -= 0.35;
  applyLook();
};
document.getElementById("lookR").onclick = () => {
  state.lookYaw += 0.35;
  applyLook();
};
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") go(-1);
  if (e.key === "ArrowRight") go(1);
});

function resize() {
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = canvas.clientHeight || Math.round((w * 9) / 16);
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

const t0 = performance.now();
function loop(now) {
  const t = (now - t0) / 1000;
  world.traverse((ch) => {
    if (ch.parent === world && ch.userData.clickId === "bear" && ch.children && ch.children.length > 4) {
      ch.rotation.y = Math.sin(t * 0.8) * 0.1;
    }
  });
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

build();
renderInv();
resize();
applyLook();
requestAnimationFrame(loop);
say("Дай конфетку. У двери — сначала глазок. Холодильник можно открыть.");
