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

const ROOMS = ["bedroom", "hall", "kitchen", "door", "robots"];
const TITLES = {
  bedroom: "Спальня",
  hall: "Коридор",
  kitchen: "Кухня",
  door: "Дверь соседа",
  robots: "Уголок роботов"
};

const ITEM_META = {
  candy: { emoji: "🍬", name: "конфета" },
  dumpling: { emoji: "🥟", name: "дамплинг" },
  ball: { emoji: "🎾", name: "мяч" },
  pizza: { emoji: "🍕", name: "пицца" },
  water: { emoji: "💧", name: "стакан воды" },
  charge: { emoji: "🔋", name: "зарядка" },
  cube: { emoji: "🟦", name: "кубик" }
};

const state = {
  room: 0,
  inv: [],
  selected: null,
  bearHome: true,
  candyN: 0,
  peepDone: false,
  yellowAsleep: true,
  kubCharged: false,
  elikStep: 0
};

const clickables = [];
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
camera.position.set(0, 1.65, 3.45);
camera.lookAt(0, 1.05, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.92));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.1);
sun.position.set(2.4, 5.5, 3.2);
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function say(t) {
  // без «кто сказал»
  speech.textContent = t;
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "ru-RU";
      u.rate = 1;
      window.speechSynthesis.speak(u);
    }
  } catch (_) {}
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

function makeBear(color, sleepy) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a1010 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 28, 20), mat);
  body.scale.set(1, 1.15, 0.92);
  body.position.y = 1.05;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 20), mat);
  head.position.y = 1.58;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), mat);
    ear.position.set(s * 0.26, 1.84, 0);
    g.add(ear);
    if (sleepy) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), dark);
      eye.position.set(s * 0.12, 1.6, 0.3);
      g.add(eye);
    } else {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), dark);
      eye.position.set(s * 0.12, 1.62, 0.3);
      g.add(eye);
    }
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), dark);
  nose.position.set(0, 1.5, 0.34);
  g.add(nose);
  const hi = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
  );
  hi.position.set(-0.18, 1.7, 0.24);
  g.add(hi);
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.34, 10), mat);
    arm.position.set(s * 0.52, 1.05, 0.05);
    arm.rotation.z = s * 0.55;
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 10), mat);
    leg.position.set(s * 0.17, 0.62, 0.04);
    g.add(leg);
  });
  if (sleepy) g.rotation.z = 0.45;
  return g;
}

function makeDumpling() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 14),
    new THREE.MeshLambertMaterial({ color: 0xf5e6c8 })
  );
  body.scale.set(1.2, 0.85, 1);
  g.add(body);
  const blush = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xff8fa3 })
  );
  blush.position.set(0.12, 0.02, 0.18);
  g.add(blush);
  return g;
}

function makeElik() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x6ec9ff })
  );
  body.position.y = 0.85;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12),
    new THREE.MeshLambertMaterial({ color: 0xe8f7ff })
  );
  head.position.y = 1.4;
  g.add(head);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.22),
    new THREE.MeshBasicMaterial({ color: 0x113355 })
  );
  screen.position.set(0, 0.9, 0.21);
  g.add(screen);
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 0.35, 10),
      new THREE.MeshLambertMaterial({ color: 0x4aa3d8 })
    );
    leg.position.set(s * 0.14, 0.35, 0);
    g.add(leg);
  });
  return g;
}

function makeKub() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshLambertMaterial({ color: state.kubCharged ? 0x7dffb0 : 0x8899aa })
  );
  body.position.y = 0.75;
  g.add(body);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.14),
      new THREE.MeshLambertMaterial({ color: [0xe51d30, 0x2f6fdb, 0xf0b429][i] })
    );
    c.position.set(-0.2 + i * 0.2, 1.15, 0.2);
    g.add(c);
  }
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
  box(7.4, 3.4, 0.2, wall, 0, 1.55, -1.55);
  box(0.2, 3.4, 3.4, 0xffe08a, -3.6, 1.55, 0);
  box(0.2, 3.4, 3.4, 0xffe08a, 3.6, 1.55, 0);
  box(7.4, 0.2, 3.8, 0xd9a428, 0, 0, 0.15);
}

function build() {
  clearWorld();
  const id = ROOMS[state.room];
  roomTag.textContent = TITLES[id];
  prevBtn.disabled = state.room <= 0;
  nextBtn.disabled = state.room >= ROOMS.length - 1;
  shell();

  if (id === "bedroom") {
    const bed = box(2.6, 0.45, 1.4, 0x8b5a2b, -0.3, 0.4, 0.15);
    mark(bed, "bed", "Кровать");
    box(2.6, 0.14, 1.4, 0xf5e6c8, -0.3, 0.65, 0.15);
    const dresser = box(1.3, 1.1, 0.55, 0xa67c52, 2.2, 0.7, -0.9);
    mark(dresser, "dresser", "Комод");
    const drawer = box(1.1, 0.25, 0.5, 0x8b6914, 2.2, 0.55, -0.88);
    mark(drawer, "dresser", "Ящик комода");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(0.2, 0.55, 0.4);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
    }
    const bag = box(0.55, 0.4, 0.4, 0x5a3d1a, -2.2, 0.35, 0.5);
    mark(bag, "sea", state.bearHome ? "Чемодан (на море)" : "Вернуться домой");
  }

  if (id === "hall") {
    box(2.0, 0.12, 0.45, 0xc48a18, -1.8, 1.7, -1.25);
    box(2.0, 0.12, 0.45, 0xc48a18, 1.8, 1.7, -1.25);
    box(2.0, 0.12, 0.45, 0xc48a18, -1.8, 1.2, -1.25);
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 14, 12),
        new THREE.MeshLambertMaterial({ color: i % 2 ? 0xe51d30 : 0xff6b6b })
      );
      c.position.set(-2.4 + i * 0.3, 1.88, -1.1);
      world.add(c);
      mark(c, "candy", "Конфета на полке");
    }
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xf0c000 })
      );
      c.position.set(1.2 + i * 0.3, 1.88, -1.1);
      world.add(c);
      mark(c, "candy", "Жёлтая конфета");
    }
    const dump = makeDumpling();
    dump.position.set(0.2, 1.4, -1.05);
    world.add(dump);
    mark(dump, "dumpling", "Дамплинг (антистресс)");
    const bench = box(1.7, 0.28, 0.6, 0x8b5a2b, 0, 0.4, 0.65);
    mark(bench, "sit", "Скамейка");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(-1.2, 0.55, 0.45);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
    }
  }

  if (id === "kitchen") {
    box(3.6, 0.2, 1.7, 0xe8c878, 0, 0.55, 0.3);
    const fridge = box(1.1, 2.2, 0.8, 0xdde7ef, -2.5, 1.2, -0.7);
    mark(fridge, "fridge", "Холодильник");
    const handle = box(0.08, 0.7, 0.08, 0x888888, -1.95, 1.2, -0.28);
    mark(handle, "fridge", "Дверца холодильника");
    const shelf = box(1.6, 0.1, 0.4, 0xc48a18, 2.2, 1.6, -1.2);
    mark(shelf, "shelf", "Кухонная полка");
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.28, 14),
      new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.7 })
    );
    water.position.set(0.5, 0.78, 0.7);
    world.add(water);
    mark(water, "water", "Вода");
    const dump = makeDumpling();
    dump.position.set(-0.6, 0.78, 0.75);
    world.add(dump);
    mark(dump, "dumpling", "Дамплинг");
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 14, 12),
      new THREE.MeshLambertMaterial({ color: 0x4ec3ff })
    );
    ball.position.set(1.0, 0.72, 0.8);
    world.add(ball);
    mark(ball, "ball", "Мяч");
    const pizza = box(0.4, 0.05, 0.4, 0xf0b429, -0.1, 0.68, 0.85);
    mark(pizza, "pizza", "Пицца");
    const charge = box(0.25, 0.12, 0.15, 0x33aa55, 1.5, 0.7, 0.5);
    mark(charge, "charge", "Зарядка");
    [-0.8, 0.8].forEach((x) => {
      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xf0c29a })
      );
      hand.position.set(x, 2.1, 1.05);
      world.add(hand);
    });
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(0, 0.55, 0.05);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
    }
  }

  if (id === "door") {
    const door = box(1.6, 2.6, 0.16, 0x8b5a2b, 0, 1.35, -1.3);
    mark(door, "door", "Дверь");
    const peep = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 18),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    peep.position.set(0, 1.65, -1.2);
    world.add(peep);
    mark(peep, "peep", "Глазок — смотри сюда сначала");
    const bell = box(0.16, 0.16, 0.12, 0xd4af37, 0.7, 1.35, -1.18);
    mark(bell, "bell", "Звонок");
    const yel = makeBear(0xf0c000, state.yellowAsleep);
    yel.position.set(1.5, 0.55, 0.25);
    yel.scale.setScalar(0.9);
    world.add(yel);
    mark(yel, "yellow", "Жёлтый мишка");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30, false);
      bear.position.set(-1.4, 0.55, 0.4);
      world.add(bear);
      mark(bear, "bear", "Красный желейный мишка");
    }
  }

  if (id === "robots") {
    const elik = makeElik();
    elik.position.set(-1.1, 0.55, 0.3);
    world.add(elik);
    mark(elik, "elik", "Элик — мини-игра");
    const kub = makeKub();
    kub.position.set(1.1, 0.55, 0.3);
    world.add(kub);
    mark(kub, "kub", state.kubCharged ? "Робот Куб (заряжен)" : "Робот Куб (нужна зарядка)");
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshLambertMaterial({ color: [0xe51d30, 0x2f6fdb, 0xf0b429, 0x2a9d6e][i] })
      );
      c.position.set(-0.4 + i * 0.28, 0.35, 0.9);
      world.add(c);
      mark(c, "cube", "Кубик");
    }
  }
}

function has(id) {
  return state.inv.includes(id);
}
function take(id) {
  if (has(id)) {
    say("Уже есть в инвентаре.");
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
    invEl.innerHTML = "<span class='muted'>пусто — кликай конфеты, дамплинг, зарядку, кубики</span>";
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
      say(state.selected ? "Выбрано. Теперь кликни по мишке или роботу." : "Ок.");
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

function openElik() {
  state.elikStep = 0;
  elikStatus.textContent = "Жми 1, потом 2, 3, 4";
  elikGrid.innerHTML = "";
  [1, 2, 3, 4].forEach((n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(n);
    b.onclick = () => {
      if (n === state.elikStep + 1) {
        state.elikStep++;
        elikStatus.textContent = state.elikStep + " из 4";
        if (state.elikStep >= 4) {
          elikStatus.textContent = "Победа!";
          say("Ура, получилось.");
          take("cube");
        }
      } else {
        state.elikStep = 0;
        elikStatus.textContent = "Заново: жми 1";
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
    if (!state.bearHome) return;
    if (state.selected === "candy") {
      useUp("candy");
      say("Ммм… Дай конфетку, дай конфетку.");
      return;
    }
    if (state.selected === "dumpling") {
      say("Хлюп-хлюп. Дамплинг мягкий.");
      return;
    }
    if (state.selected === "pizza") {
      useUp("pizza");
      say("Пицца. Но конфетку всё равно дай.");
      return;
    }
    if (state.selected === "water") {
      useUp("water");
      say("Бульк. Мокро.");
      return;
    }
    askCandy();
    return;
  }
  if (id === "candy") take("candy");
  if (id === "dumpling") take("dumpling");
  if (id === "ball") take("ball");
  if (id === "pizza") take("pizza");
  if (id === "water") take("water");
  if (id === "charge") take("charge");
  if (id === "cube") take("cube");
  if (id === "sit") say("Сел. Тихо.");
  if (id === "bed") say("Кровать.");
  if (id === "dresser") {
    if (!has("candy")) take("candy");
    else say("В комоде шуршат обёртки.");
  }
  if (id === "fridge") {
    if (!has("pizza")) take("pizza");
    else if (!has("water")) take("water");
    else say("В холодильнике холодно и гудит.");
  }
  if (id === "shelf") say("На полке банки и ложки.");
  if (id === "sea") {
    state.bearHome = !state.bearHome;
    build();
    say(state.bearHome ? "Снова дома." : "Уехал на море отдыхать.");
  }
  if (id === "peep") {
    state.peepDone = true;
    state.yellowAsleep = Math.random() < 0.65;
    build();
    say(state.yellowAsleep
      ? "В глазок: жёлтый мишка спит."
      : "В глазок: жёлтый мишка смотрит.");
  }
  if (id === "bell") {
    if (!state.peepDone) {
      say("Сначала посмотри в глазок.");
      return;
    }
    say("Динь-дон.");
  }
  if (id === "door") say("Дверь. Сначала глазок.");
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
      say("Зарядился. Можно давать кубики.");
      return;
    }
    if (!state.kubCharged) {
      say("Бип… мало энергии. Нужна зарядка.");
      return;
    }
    if (state.selected === "cube") {
      useUp("cube");
      say("Кубик принят. Ещё!");
      return;
    }
    say("Дай кубик. Люблю кубики.");
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
  world.children.forEach((ch) => {
    if (ch.userData && ch.userData.clickId === "bear" && !ch.isMesh) {
      ch.position.y = 0.55 + Math.abs(Math.sin(t * 2)) * 0.03;
    }
  });
  // bob groups marked via first child trick — traverse parents
  world.traverse((ch) => {
    if (ch.parent === world && ch.children && ch.children.length > 5 && ch.userData.clickId === "bear") {
      const base = ROOMS[state.room] === "bedroom" ? 0.55 : 0.55;
      ch.position.y = base + Math.abs(Math.sin(t * 2.1)) * 0.03;
      ch.rotation.y = Math.sin(t * 0.8) * 0.1;
    }
  });
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

build();
renderInv();
resize();
requestAnimationFrame(loop);
say("Дай конфетку. Кликай предметы. У двери сначала глазок.");
