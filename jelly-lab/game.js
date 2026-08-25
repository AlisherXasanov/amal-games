import * as THREE from "three";

const canvas = document.getElementById("c");
const bubble = document.getElementById("bubble");
const who = document.getElementById("who");
const recEl = document.getElementById("rec");

const FILM_KEY = "jelly-lab-films-v1";

const state = {
  asleep: true,
  hunger: 0.6,
  wet: false,
  limonIn: false,
  tikIn: false,
  filming: false,
  filmLines: [],
  sayToken: 0
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe566);

const camera = new THREE.PerspectiveCamera(40, 16 / 10, 0.1, 80);
// tabletop close-up: face clearly in frame
camera.position.set(0, 1.45, 2.6);
camera.lookAt(0, 1.15, 0.2);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xfff1c8, 1.05);
sun.position.set(2.5, 5, 3);
scene.add(sun);

function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

// yellow house / lab
box(7, 3.4, 0.2, 0xffe566, 0, 1.5, -1.5);
box(0.2, 3.4, 3.2, 0xffe08a, -3.4, 1.5, 0);
box(0.2, 3.4, 3.2, 0xffe08a, 3.4, 1.5, 0);
box(7, 0.2, 3.6, 0xd9a428, 0, 0, 0.1);
box(3.4, 0.16, 1.7, 0xe8c878, 0, 0.55, 0.35); // table

// shelf props
box(0.9, 0.08, 0.25, 0xc48a18, -2.2, 2.1, -1.3);
box(0.9, 0.08, 0.25, 0xc48a18, 2.2, 2.1, -1.3);

function jellyBear(color, name) {
  const g = new THREE.Group();
  g.userData.name = name;
  const mat = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x3a1010 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 18), mat);
  body.scale.set(1, 1.12, 0.92);
  body.position.y = 0.92;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), mat);
  head.position.y = 1.36;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), mat);
    ear.position.set(s * 0.22, 1.58, 0);
    g.add(ear);
  });
  const eyes = [];
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), dark);
    eye.position.set(s * 0.1, 1.4, 0.24);
    g.add(eye);
    eyes.push(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), dark);
  nose.position.set(0, 1.32, 0.28);
  g.add(nose);
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.016, 8, 16, Math.PI),
    dark
  );
  mouth.position.set(0, 1.22, 0.26);
  mouth.rotation.x = Math.PI;
  g.add(mouth);
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 10), mat);
    arm.position.set(s * 0.4, 0.92, 0.05);
    arm.rotation.z = s * 0.5;
    g.add(arm);
  });
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 10), mat);
    leg.position.set(s * 0.15, 0.6, 0.04);
    g.add(leg);
  });
  // face highlight so "лицо видно"
  const shine = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
  );
  shine.position.set(-0.12, 1.48, 0.2);
  g.add(shine);
  g.userData.eyes = eyes;
  g.userData.mouth = mouth;
  g.position.set(0, 0.55, 0.45);
  scene.add(g);
  return g;
}

const rubi = jellyBear(0xe51d30, "Руби");
const limon = jellyBear(0xf0c000, "Лимон");
limon.position.set(1.15, 0.55, 0.55);
limon.visible = false;
limon.scale.setScalar(0.92);

function makeTik() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.55, 14),
    new THREE.MeshLambertMaterial({ color: 0x6ec9ff })
  );
  body.position.y = 0.85;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 12),
    new THREE.MeshLambertMaterial({ color: 0xdff4ff })
  );
  head.position.y = 1.28;
  g.add(head);
  // headphones
  [-1, 1].forEach((s) => {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    cup.rotation.z = Math.PI / 2;
    cup.position.set(s * 0.22, 1.28, 0);
    g.add(cup);
  });
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.02, 8, 20, Math.PI),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  band.position.y = 1.38;
  band.rotation.x = Math.PI;
  g.add(band);
  // two little legs
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.28, 8),
      new THREE.MeshLambertMaterial({ color: 0x4aa3d8 })
    );
    leg.position.set(s * 0.1, 0.42, 0);
    g.add(leg);
  });
  g.position.set(-1.15, 0.55, 0.55);
  g.visible = false;
  scene.add(g);
  return g;
}
const tik = makeTik();

// hands of host (only arms)
function hand(x) {
  const g = new THREE.Group();
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.11, 0.5, 12),
    new THREE.MeshLambertMaterial({ color: 0x2f6fdb })
  );
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.z = -0.25;
  g.add(sleeve);
  const palm = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 14, 12),
    new THREE.MeshLambertMaterial({ color: 0xf0c29a })
  );
  palm.scale.set(1.15, 0.7, 1.2);
  g.add(palm);
  g.position.set(x, 2.05, 1.0);
  scene.add(g);
  return g;
}
const handL = hand(-0.7);
const handR = hand(0.7);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 14, 12),
  new THREE.MeshLambertMaterial({ color: 0x4ec3ff })
);
ball.position.set(0.7, 0.72, 0.85);
scene.add(ball);

const squash = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 14, 12),
  new THREE.MeshLambertMaterial({ color: 0xff8ec8 })
);
squash.position.set(-0.65, 0.74, 0.85);
squash.scale.set(1, 0.85, 1);
scene.add(squash);

const water = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.12, 0.01, 16),
  new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.65 })
);
water.position.set(0.35, 0.64, 0.95);
water.visible = false;
scene.add(water);

let bounce = 0;
let throwT = -1;
let squashT = -1;

function resize() {
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = canvas.clientHeight || Math.round(w * 10 / 16);
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

function say(text, secs = 2.4) {
  const token = ++state.sayToken;
  bubble.textContent = text;
  if (state.filming) state.filmLines.push(text);
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ru-RU";
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    }
  } catch (_) {}
  return new Promise((resolve) => {
    setTimeout(() => {
      if (token === state.sayToken) resolve();
      else resolve();
    }, secs * 1000);
  });
}

function updateWho() {
  const parts = ["Руби"];
  if (state.limonIn) parts.push("Лимон");
  if (state.tikIn) parts.push("Тик");
  who.textContent = "В кадре: " + parts.join(" · ");
}

async function act(name) {
  if (name === "film") {
    if (!state.filming) {
      state.filming = true;
      state.filmLines = ["Начало выпуска в Желейной хате"];
      recEl.hidden = false;
      await say("Съёмка началась! Делай действия — всё попадёт в ролик.", 2.2);
    } else {
      state.filming = false;
      recEl.hidden = true;
      const lines = state.filmLines.slice(0, 12);
      const title = "Выпуск · " + new Date().toLocaleString("ru-RU");
      try {
        const list = JSON.parse(localStorage.getItem(FILM_KEY) || "[]");
        list.unshift({ id: "f-" + Date.now(), title, lines, at: Date.now() });
        localStorage.setItem(FILM_KEY, JSON.stringify(list.slice(0, 30)));
        // also drop into mult-studio shelf if present
        const mine = JSON.parse(localStorage.getItem("mult-studio-mine-v1") || "[]");
        mine.unshift({ id: "lab-" + Date.now(), title, lines });
        localStorage.setItem("mult-studio-mine-v1", JSON.stringify(mine.slice(0, 40)));
      } catch (_) {}
      await say("Ролик сохранён! Смотри в Мульт-студии → полка «твой ролик».", 3);
    }
    return;
  }

  if (name === "wake") {
    state.asleep = false;
    await say("Руби: Ку-ку… Дай конфетку! Дай конфетку!");
    return;
  }
  if (name === "candy") {
    state.hunger = Math.max(0, state.hunger - 0.25);
    state.asleep = false;
    await say("Руби: Ммм! Спасибо! Ещё одну можно?");
    return;
  }
  if (name === "enough") {
    await say("Ведущий: Руби, хватит! Хватит просить конфеты.");
    await say("Руби: Ну ладно… чуть-чуть ещё?");
    return;
  }
  if (name === "bath") {
    state.wet = true;
    rubi.scale.set(1.05, 0.92, 1.05);
    await say("Руби: Ванна! Бульк-бульк… тепло!");
    setTimeout(() => rubi.scale.set(1, 1, 1), 2500);
    return;
  }
  if (name === "pizza") {
    state.hunger = 0;
    await say("Руби: Пицца! Синенькие… ой, то есть вкусные кусочки!");
    return;
  }
  if (name === "water") {
    water.visible = true;
    water.scale.set(1, 1, 1);
    await say("Опыт: наливаем воду…");
    await say("Руби: Бульк! Я желейный, мне мокро и весело!");
    setTimeout(() => { water.visible = false; }, 4000);
    return;
  }
  if (name === "throw") {
    throwT = 0;
    await say("Кидаем мячик!");
    await say("Руби: Лови! Уиии!");
    return;
  }
  if (name === "squash") {
    squashT = 0;
    await say("Антистресс «Комок»: жмяк-жмяк!");
    await say("Руби: Хлюп! Ещё раз!");
    return;
  }
  if (name === "limon") {
    state.limonIn = !state.limonIn;
    limon.visible = state.limonIn;
    updateWho();
    if (state.limonIn) {
      await say("Лимон: Привет! А конфеты где?");
      await say("Руби: Эй! Это мои конфеты!");
    } else {
      await say("Лимон ушёл. Руби: Фух…");
    }
    return;
  }
  if (name === "tik") {
    state.tikIn = !state.tikIn;
    tik.visible = state.tikIn;
    updateWho();
    if (state.tikIn) {
      await say("Тик: Бип! Я помогу с опытом. Наушники на месте.");
    } else {
      await say("Тик: Бип-бай! Ушёл заряжаться.");
    }
  }
}

document.getElementById("actions").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  act(btn.dataset.act);
});

// start asleep pose
rubi.rotation.z = 0.35;
say("Руби спит… Разбуди его!", 2);

const t0 = performance.now();
function loop(now) {
  const t = (now - t0) / 1000;
  bounce = Math.abs(Math.sin(t * 3)) * 0.03;

  if (!state.asleep) {
    rubi.rotation.z = Math.sin(t * 1.5) * 0.05;
    rubi.position.y = 0.55 + bounce;
  } else {
    rubi.rotation.z = 0.35;
    rubi.position.y = 0.55;
  }

  if (state.limonIn) {
    limon.position.y = 0.55 + Math.abs(Math.sin(t * 2.5)) * 0.02;
    limon.rotation.y = Math.sin(t) * 0.2;
  }
  if (state.tikIn) {
    tik.position.y = 0.55 + Math.sin(t * 4) * 0.02;
  }

  handL.position.y = 2.05 + Math.sin(t * 2) * 0.025;
  handR.position.y = 2.05 + Math.cos(t * 2.2) * 0.025;

  if (throwT >= 0) {
    throwT += 0.05;
    ball.position.set(0.7 - throwT * 0.9, 0.72 + Math.sin(throwT * 2.2) * 0.55, 0.85 - throwT * 0.1);
    if (throwT > 2.2) {
      throwT = -1;
      ball.position.set(0.7, 0.72, 0.85);
    }
  }

  if (squashT >= 0) {
    squashT += 0.08;
    const s = 1 + Math.sin(squashT * 6) * 0.35;
    squash.scale.set(s, 1.2 - (s - 1), s);
    if (squashT > 2.5) {
      squashT = -1;
      squash.scale.set(1, 0.85, 1);
    }
  }

  if (water.visible) {
    water.scale.y = 1 + Math.sin(t * 6) * 0.15;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
requestAnimationFrame(resize);
updateWho();
