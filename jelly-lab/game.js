import * as THREE from "three";

const canvas = document.getElementById("c");
const bubble = document.getElementById("bubble");
const who = document.getElementById("who");
const roomTitle = document.getElementById("roomTitle");
const recEl = document.getElementById("rec");
const peep = document.getElementById("peep");
const actionsEl = document.getElementById("actions");
const navL = document.getElementById("navL");
const navR = document.getElementById("navR");

const FILM_KEY = "jelly-lab-films-v1";

/** Порядок комнат для стрелок */
const ROOM_ORDER = ["bedroom", "hall", "kitchen", "door"];

const ROOMS = {
  bedroom: {
    title: "Спальня",
    desc: "Здесь Руби спит и просыпается",
    actions: ["talk", "candy", "sea", "film"]
  },
  hall: {
    title: "Коридор",
    desc: "Полки с конфетами, можно пройти дальше",
    actions: ["candyShelf", "sit", "film"]
  },
  kitchen: {
    title: "Кухня-лаборатория",
    desc: "Опыты, вода, антистресс",
    actions: ["water", "throw", "squash", "pizza", "tik", "film"]
  },
  door: {
    title: "Дверь к Лимону",
    desc: "Звонок и глазок",
    actions: ["bell", "peep", "visit", "film"]
  }
};

const state = {
  room: "bedroom",
  rubiHome: true,
  rubiAsleep: true,
  morningDone: false,
  limonHome: true,
  tikIn: false,
  peepOpen: false,
  filming: false,
  filmLines: [],
  sayToken: 0
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 80);
camera.position.set(0, 1.5, 2.7);
camera.lookAt(0, 1.1, 0);

const ambient = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff1c8, 1);
sun.position.set(2, 5, 3);
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

function clearWorld() {
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

function meshBox(w, h, d, color, x, y, z, parent = world) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function jellyBear(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x3a1010 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16), mat);
  body.scale.set(1, 1.1, 0.9);
  body.position.y = 0.88;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 16), mat);
  head.position.y = 1.3;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat);
    ear.position.set(s * 0.2, 1.5, 0);
    g.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), dark);
    eye.position.set(s * 0.09, 1.34, 0.22);
    g.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), dark);
  nose.position.set(0, 1.26, 0.26);
  g.add(nose);
  g.position.set(0, 0.55, 0.4);
  return g;
}

let rubi = null;
let limon = null;
let tik = null;
let ball = null;
let squash = null;
let water = null;
let throwT = -1;
let squashT = -1;

function buildRoom(id) {
  clearWorld();
  rubi = limon = tik = ball = squash = water = null;
  throwT = squashT = -1;
  peep.hidden = true;
  state.peepOpen = false;

  const wall = id === "bedroom" && state.rubiAsleep && !state.morningDone ? 0x3a4560 : 0xffe566;
  scene.background = new THREE.Color(wall);

  // common shell
  meshBox(6.5, 3.2, 0.18, wall, 0, 1.45, -1.35);
  meshBox(0.18, 3.2, 3, 0xffe08a, -3.15, 1.45, 0);
  meshBox(0.18, 3.2, 3, 0xffe08a, 3.15, 1.45, 0);
  meshBox(6.5, 0.18, 3.4, 0xd9a428, 0, 0, 0.1);

  if (id === "bedroom") {
    meshBox(2.2, 0.35, 1.2, 0x8b5a2b, -0.2, 0.45, 0.2); // bed
    meshBox(2.2, 0.12, 1.2, 0xf5e6c8, -0.2, 0.66, 0.2);
    if (state.rubiHome) {
      rubi = jellyBear(0xe51d30);
      world.add(rubi);
      rubi.position.set(0.15, 0.7, 0.35);
      if (state.rubiAsleep) rubi.rotation.z = 0.55;
    } else {
      // suitcase hint — away
      meshBox(0.55, 0.35, 0.35, 0x5a3d1a, 1.2, 0.35, 0.4);
    }
  }

  if (id === "hall") {
    // candy shelves
    meshBox(1.6, 0.1, 0.35, 0xc48a18, -1.6, 1.5, -1.15);
    meshBox(1.6, 0.1, 0.35, 0xc48a18, 1.6, 1.5, -1.15);
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 8),
        new THREE.MeshLambertMaterial({ color: i % 2 ? 0xe51d30 : 0xf0c000 })
      );
      c.position.set(-2.1 + i * 0.22, 1.62, -1.05);
      world.add(c);
    }
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 8),
        new THREE.MeshLambertMaterial({ color: i % 2 ? 0xf0c000 : 0xff6b6b })
      );
      c.position.set(1.1 + i * 0.22, 1.62, -1.05);
      world.add(c);
    }
    // bench to sit
    meshBox(1.4, 0.2, 0.5, 0x8b5a2b, 0, 0.45, 0.55);
    if (state.rubiHome && state.morningDone) {
      rubi = jellyBear(0xe51d30);
      world.add(rubi);
      rubi.position.set(-0.8, 0.55, 0.45);
    }
  }

  if (id === "kitchen") {
    meshBox(3.2, 0.16, 1.5, 0xe8c878, 0, 0.55, 0.35);
    // host hands
    [-0.7, 0.7].forEach((x) => {
      const g = new THREE.Group();
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.1, 0.45, 10),
        new THREE.MeshLambertMaterial({ color: 0x2f6fdb })
      );
      sleeve.rotation.x = Math.PI / 2;
      sleeve.position.z = -0.2;
      g.add(sleeve);
      const palm = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 10),
        new THREE.MeshLambertMaterial({ color: 0xf0c29a })
      );
      g.add(palm);
      g.position.set(x, 2.0, 0.95);
      world.add(g);
    });
    if (state.rubiHome && state.morningDone) {
      rubi = jellyBear(0xe51d30);
      world.add(rubi);
    }
    ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 10),
      new THREE.MeshLambertMaterial({ color: 0x4ec3ff })
    );
    ball.position.set(0.65, 0.72, 0.8);
    world.add(ball);
    squash = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 10),
      new THREE.MeshLambertMaterial({ color: 0xff8ec8 })
    );
    squash.position.set(-0.6, 0.74, 0.8);
    squash.scale.set(1, 0.85, 1);
    world.add(squash);
    water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.02, 14),
      new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.65 })
    );
    water.position.set(0.3, 0.64, 0.9);
    water.visible = false;
    world.add(water);
    if (state.tikIn) {
      tik = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.24, 0.5, 12),
        new THREE.MeshLambertMaterial({ color: 0x6ec9ff })
      );
      body.position.y = 0.8;
      tik.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 10),
        new THREE.MeshLambertMaterial({ color: 0xdff4ff })
      );
      head.position.y = 1.2;
      tik.add(head);
      [-1, 1].forEach((s) => {
        const cup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8),
          new THREE.MeshLambertMaterial({ color: 0x333 })
        );
        cup.rotation.z = Math.PI / 2;
        cup.position.set(s * 0.2, 1.2, 0);
        tik.add(cup);
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.05, 0.25, 8),
          new THREE.MeshLambertMaterial({ color: 0x4aa3d8 })
        );
        leg.position.set(s * 0.09, 0.4, 0);
        tik.add(leg);
      });
      tik.position.set(-1.1, 0.55, 0.5);
      world.add(tik);
    }
  }

  if (id === "door") {
    // door
    meshBox(1.4, 2.4, 0.12, 0x8b5a2b, 0, 1.25, -1.2);
    meshBox(0.12, 0.12, 0.08, 0xd4af37, 0.45, 1.2, -1.12); // knob
    // peephole ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.02, 8, 16),
      new THREE.MeshLambertMaterial({ color: 0x333 })
    );
    ring.position.set(0, 1.55, -1.12);
    world.add(ring);
    if (state.rubiHome && state.morningDone) {
      rubi = jellyBear(0xe51d30);
      world.add(rubi);
      rubi.position.set(-1.1, 0.55, 0.45);
    }
  }

  refreshChrome();
}

function refreshChrome() {
  const meta = ROOMS[state.room];
  roomTitle.textContent = meta.title;
  who.textContent = meta.desc + (state.rubiHome ? "" : " · Руби сейчас на море");

  const idx = ROOM_ORDER.indexOf(state.room);
  navL.disabled = idx <= 0;
  navR.disabled = idx >= ROOM_ORDER.length - 1;

  const labels = {
    talk: "💬 Поговорить",
    candy: "🍬 Конфета",
    candyShelf: "🍬 Взять с полки",
    sit: "🪑 Сесть",
    sea: state.rubiHome ? "🌊 Уехать на море" : "🏠 Вернуться домой",
    water: "💧 Опыт: вода",
    throw: "🎾 Мячик",
    squash: "🫧 Комок",
    pizza: "🍕 Пицца",
    tik: state.tikIn ? "🤖 Тик уйти" : "🤖 Позвать Тика",
    bell: "🔔 Позвонить",
    peep: "👁️ Глазок",
    visit: "🚪 В гости",
    film: state.filming ? "⏹ Закончить ролик" : "🎬 Снять ролик"
  };

  actionsEl.innerHTML = "";
  meta.actions.forEach((key) => {
    if (!state.morningDone && key !== "talk" && state.room === "bedroom") {
      // only talk during morning until done — actually morning is auto
    }
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.act = key;
    b.textContent = labels[key] || key;
    if (key === "film") b.className = "film";
    if (!state.rubiHome && ["candy", "talk", "water", "throw", "pizza"].includes(key)) {
      b.disabled = true;
      b.style.opacity = "0.4";
    }
    actionsEl.appendChild(b);
  });
}

function say(text, secs = 2.3) {
  const token = ++state.sayToken;
  bubble.textContent = text;
  if (state.filming) state.filmLines.push(text);
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ru-RU";
      u.rate = 1;
      window.speechSynthesis.speak(u);
    }
  } catch (_) {}
  return new Promise((r) => setTimeout(r, secs * 1000));
}

function goRoom(dir) {
  const idx = ROOM_ORDER.indexOf(state.room);
  const next = idx + dir;
  if (next < 0 || next >= ROOM_ORDER.length) return;
  state.room = ROOM_ORDER[next];
  buildRoom(state.room);
  const names = { bedroom: "Спальня", hall: "Коридор", kitchen: "Кухня", door: "Дверь" };
  bubble.textContent = "Ты в комнате: " + names[state.room];
}

async function act(name) {
  if (name === "film") {
    if (!state.filming) {
      state.filming = true;
      state.filmLines = ["Выпуск в Желейной хате"];
      recEl.hidden = false;
      refreshChrome();
      await say("Съёмка идёт. Ходи по комнатам и жми действия.", 2.2);
    } else {
      state.filming = false;
      recEl.hidden = true;
      const lines = state.filmLines.slice(0, 14);
      const title = "Хата · " + new Date().toLocaleString("ru-RU");
      try {
        const list = JSON.parse(localStorage.getItem(FILM_KEY) || "[]");
        list.unshift({ id: "f-" + Date.now(), title, lines, at: Date.now() });
        localStorage.setItem(FILM_KEY, JSON.stringify(list.slice(0, 30)));
        const mine = JSON.parse(localStorage.getItem("mult-studio-mine-v1") || "[]");
        mine.unshift({ id: "lab-" + Date.now(), title, lines });
        localStorage.setItem("mult-studio-mine-v1", JSON.stringify(mine.slice(0, 40)));
      } catch (_) {}
      refreshChrome();
      await say("Ролик сохранён. Открой Мульт-студию — там полка «твой ролик».", 2.8);
    }
    return;
  }

  if (name === "talk") {
    if (state.rubiAsleep) {
      await say("Руби тихо сопит…");
      return;
    }
    if (!state.rubiHome) {
      await say("Руби нет дома. Он на море.");
      return;
    }
    await say("Руби: Ну что, пойдём в коридор? Там полки с конфетами.");
    return;
  }

  if (name === "candy" || name === "candyShelf") {
    if (!state.rubiHome) {
      await say("Конфеты на полке есть, но Руби сейчас не дома.");
      return;
    }
    await say("Руби: Дай конфетку… дай конфетку…");
    await say("Руби: Ещё одну. Ну пожалуйста.");
    return;
  }

  if (name === "sit") {
    await say("Ты сел на скамейку в коридоре. Тихо. Слышно, как шуршат конфеты на полке.");
    return;
  }

  if (name === "sea") {
    if (state.rubiHome) {
      state.rubiHome = false;
      buildRoom(state.room);
      await say("Руби собрал чемодан и уехал на море отдыхать.");
    } else {
      state.rubiHome = true;
      buildRoom(state.room);
      await say("Руби: Я дома. Море было тёплое… а конфеты где?");
    }
    return;
  }

  if (name === "water") {
    if (water) water.visible = true;
    await say("Наливаем воду на стол…");
    await say("Руби: Ой. Холодно. Но интересно.");
    setTimeout(() => { if (water) water.visible = false; }, 3500);
    return;
  }

  if (name === "throw") {
    throwT = 0;
    await say("Мячик полетел.");
    await say("Руби: Почти поймал.");
    return;
  }

  if (name === "squash") {
    squashT = 0;
    await say("Жмякаем «Комок».");
    await say("Руби: Хлюп. Ещё раз можно.");
    return;
  }

  if (name === "pizza") {
    await say("Руби: Пицца… кусочек мне.");
    return;
  }

  if (name === "tik") {
    state.tikIn = !state.tikIn;
    buildRoom(state.room);
    await say(state.tikIn ? "Тик: Бип. Я на кухне." : "Тик ушёл.");
    return;
  }

  if (name === "bell") {
    await say("Динь-дон.");
    if (state.limonHome) await say("За дверью шаги. Похоже, Лимон дома.");
    else await say("Тишина. Лимона нет.");
    return;
  }

  if (name === "peep") {
    state.peepOpen = !state.peepOpen;
    peep.hidden = !state.peepOpen;
    if (state.peepOpen) {
      await say(state.limonHome
        ? "В глазок видно жёлтого Лимона. Он стоит у себя."
        : "В глазок пусто. Лимона не видно.");
    }
    return;
  }

  if (name === "visit") {
    if (!state.limonHome) {
      await say("В гости не к кому — Лимона нет дома.");
      return;
    }
    await say("Лимон: Чего надо?");
    await say("Руби: Просто в гости… и конфету.");
    await say("Лимон: Мои конфеты. Не трогай.");
  }
}

actionsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn || btn.disabled) return;
  act(btn.dataset.act);
});

navL.addEventListener("click", () => goRoom(-1));
navR.addEventListener("click", () => goRoom(1));
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") goRoom(-1);
  if (e.key === "ArrowRight") goRoom(1);
});

function resize() {
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = canvas.clientHeight || Math.round((w * 10) / 16);
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

async function morning() {
  state.room = "bedroom";
  state.rubiAsleep = true;
  state.morningDone = false;
  buildRoom("bedroom");
  await say("Спальня. Темно. Руби спит.", 2);
  await say("…", 0.7);
  state.rubiAsleep = false;
  buildRoom("bedroom");
  await say("Руби: Эй. Ты ещё спишь?", 2.2);
  await say("Руби: Вставай. Хватит дрыхнуть.", 2.2);
  await say("Руби: Пойдём. В коридоре конфеты… дай потом конфетку.", 2.5);
  state.morningDone = true;
  refreshChrome();
  bubble.textContent = "Стрелки ← → или кнопки по краям — в другие комнаты";
}

const t0 = performance.now();
function loop(now) {
  const t = (now - t0) / 1000;
  if (rubi && !state.rubiAsleep) {
    rubi.position.y = (state.room === "bedroom" ? 0.7 : 0.55) + Math.abs(Math.sin(t * 2.5)) * 0.025;
    rubi.rotation.y = Math.sin(t * 0.8) * 0.12;
  }
  if (throwT >= 0 && ball) {
    throwT += 0.05;
    ball.position.set(0.65 - throwT * 0.85, 0.72 + Math.sin(throwT * 2) * 0.5, 0.8);
    if (throwT > 2) {
      throwT = -1;
      ball.position.set(0.65, 0.72, 0.8);
    }
  }
  if (squashT >= 0 && squash) {
    squashT += 0.08;
    const s = 1 + Math.sin(squashT * 6) * 0.3;
    squash.scale.set(s, 1.15 - (s - 1), s);
    if (squashT > 2.4) {
      squashT = -1;
      squash.scale.set(1, 0.85, 1);
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
requestAnimationFrame(resize);
morning();
