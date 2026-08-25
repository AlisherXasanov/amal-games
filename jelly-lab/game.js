import * as THREE from "three";

const canvas = document.getElementById("c");
const speech = document.getElementById("speech");
const roomTag = document.getElementById("roomTag");
const hoverLabel = document.getElementById("hoverLabel");
const invEl = document.getElementById("inv");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const ROOMS = ["bedroom", "hall", "kitchen", "door"];
const TITLES = {
  bedroom: "Спальня",
  hall: "Коридор",
  kitchen: "Кухня",
  door: "Дверь к жёлтому мишке"
};

const state = {
  room: 0,
  inv: [],
  selected: null,
  bearHome: true,
  candyN: 0,
  sayN: 0
};

const clickables = []; // { mesh, id, title }

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 100);
camera.position.set(0, 1.55, 3.1);
camera.lookAt(0, 1.05, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.05);
sun.position.set(2.2, 5, 3);
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function say(t) {
  state.sayN++;
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

function box(w, h, d, color, x, y, z, parent = world) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function makeBear(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a1010 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), mat);
  body.scale.set(1, 1.15, 0.92);
  body.position.y = 1.0;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 20), mat);
  head.position.y = 1.5;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), mat);
    ear.position.set(s * 0.24, 1.74, 0);
    g.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), dark);
    eye.position.set(s * 0.11, 1.54, 0.28);
    g.add(eye);
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine.position.set(s * 0.1, 1.56, 0.32);
    g.add(shine);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), dark);
  nose.position.set(0, 1.44, 0.32);
  g.add(nose);
  // jelly highlight
  const hi = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
  );
  hi.position.set(-0.16, 1.62, 0.22);
  g.add(hi);
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 10), mat);
    arm.position.set(s * 0.48, 1.0, 0.05);
    arm.rotation.z = s * 0.55;
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.24, 10), mat);
    leg.position.set(s * 0.16, 0.62, 0.04);
    g.add(leg);
  });
  return g;
}

function mark(mesh, id, title) {
  mesh.userData.clickId = id;
  mesh.userData.title = title;
  clickables.push(mesh);
  mesh.traverse((ch) => {
    if (ch.isMesh) {
      ch.userData.clickId = id;
      ch.userData.title = title;
      clickables.push(ch);
    }
  });
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

function build() {
  clearWorld();
  const id = ROOMS[state.room];
  roomTag.textContent = TITLES[id];
  prevBtn.disabled = state.room <= 0;
  nextBtn.disabled = state.room >= ROOMS.length - 1;

  const wall = 0xffe566;
  scene.background = new THREE.Color(wall);
  box(7, 3.3, 0.2, wall, 0, 1.5, -1.5);
  box(0.2, 3.3, 3.2, 0xffe08a, -3.4, 1.5, 0);
  box(0.2, 3.3, 3.2, 0xffe08a, 3.4, 1.5, 0);
  box(7, 0.2, 3.6, 0xd9a428, 0, 0, 0.15);

  if (id === "bedroom") {
    const bed = box(2.4, 0.4, 1.3, 0x8b5a2b, 0, 0.4, 0.2);
    mark(bed, "bed", "Кровать");
    box(2.4, 0.12, 1.3, 0xf5e6c8, 0, 0.62, 0.2);
    if (state.bearHome) {
      const bear = makeBear(0xe51d30);
      bear.position.set(0.1, 0.55, 0.35);
      world.add(bear);
      mark(bear, "bear", "Желейный мишка");
    } else {
      const bag = box(0.6, 0.4, 0.4, 0x5a3d1a, 1.3, 0.35, 0.4);
      mark(bag, "sea", "Чемодан / море");
    }
    const seaBtn = box(0.5, 0.35, 0.5, 0x4ec3ff, -1.5, 0.9, -0.8);
    mark(seaBtn, "sea", state.bearHome ? "Уехать на море" : "Вернуться");
  }

  if (id === "hall") {
    box(1.8, 0.12, 0.4, 0xc48a18, -1.7, 1.55, -1.2);
    box(1.8, 0.12, 0.4, 0xc48a18, 1.7, 1.55, -1.2);
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 14, 12),
        new THREE.MeshLambertMaterial({ color: i % 2 ? 0xe51d30 : 0xff6b6b })
      );
      c.position.set(-2.2 + i * 0.28, 1.7, -1.05);
      world.add(c);
      mark(c, "candy", "Конфета");
    }
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xf0c000 })
      );
      c.position.set(1.2 + i * 0.28, 1.7, -1.05);
      world.add(c);
      mark(c, "candy", "Жёлтая конфета");
    }
    const bench = box(1.5, 0.25, 0.55, 0x8b5a2b, 0, 0.4, 0.6);
    mark(bench, "sit", "Скамейка");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30);
      bear.position.set(-1.0, 0.55, 0.45);
      world.add(bear);
      mark(bear, "bear", "Желейный мишка");
    }
  }

  if (id === "kitchen") {
    box(3.4, 0.18, 1.6, 0xe8c878, 0, 0.55, 0.35);
    [-0.75, 0.75].forEach((x) => {
      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 12),
        new THREE.MeshLambertMaterial({ color: 0xf0c29a })
      );
      hand.position.set(x, 2.05, 1.0);
      world.add(hand);
    });
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16),
      new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.75 })
    );
    water.position.set(0.35, 0.7, 0.7);
    world.add(water);
    mark(water, "water", "Вода / опыт");

    const komok = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0xff8ec8 })
    );
    komok.position.set(-0.7, 0.75, 0.75);
    komok.scale.set(1, 0.85, 1);
    world.add(komok);
    mark(komok, "komok", "Антистресс «Комок»");

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 12),
      new THREE.MeshLambertMaterial({ color: 0x4ec3ff })
    );
    ball.position.set(0.85, 0.72, 0.8);
    world.add(ball);
    mark(ball, "ball", "Мяч");

    const pizza = box(0.35, 0.05, 0.35, 0xf0b429, -0.2, 0.68, 0.9);
    mark(pizza, "pizza", "Пицца");

    if (state.bearHome) {
      const bear = makeBear(0xe51d30);
      bear.position.set(0, 0.55, 0.2);
      world.add(bear);
      mark(bear, "bear", "Желейный мишка");
    }
  }

  if (id === "door") {
    const door = box(1.5, 2.5, 0.14, 0x8b5a2b, 0, 1.3, -1.25);
    mark(door, "door", "Дверь");
    const knob = box(0.12, 0.12, 0.1, 0xd4af37, 0.5, 1.2, -1.15);
    mark(knob, "bell", "Звонок");
    const peep = new THREE.Mesh(
      new THREE.CircleGeometry(0.09, 16),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    peep.position.set(0, 1.6, -1.16);
    world.add(peep);
    mark(peep, "peep", "Глазок");
    const yel = makeBear(0xf0c000);
    yel.position.set(1.35, 0.55, 0.3);
    yel.scale.setScalar(0.85);
    world.add(yel);
    mark(yel, "yellow", "Жёлтый мишка");
    if (state.bearHome) {
      const bear = makeBear(0xe51d30);
      bear.position.set(-1.2, 0.55, 0.4);
      world.add(bear);
      mark(bear, "bear", "Желейный мишка");
    }
  }
}

function has(id) {
  return state.inv.includes(id);
}
function take(id, name) {
  if (has(id)) {
    say("Уже есть в инвентаре.");
    return;
  }
  state.inv.push(id);
  renderInv();
  say("Взял: " + name);
}
function useUp(id) {
  state.inv = state.inv.filter((x) => x !== id);
  if (state.selected === id) state.selected = null;
  renderInv();
}

function renderInv() {
  const names = { candy: "конфета", komok: "комок", ball: "мяч", pizza: "пицца" };
  const emoji = { candy: "🍬", komok: "🫧", ball: "🎾", pizza: "🍕" };
  invEl.innerHTML = "";
  if (!state.inv.length) {
    invEl.innerHTML = "<span style='opacity:.65;font-weight:700'>пусто — кликай конфеты и вещи в 3D</span>";
    return;
  }
  state.inv.forEach((id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "item" + (state.selected === id ? " sel" : "");
    b.innerHTML = emoji[id] + "<small>" + names[id] + "</small>";
    b.onclick = () => {
      state.selected = state.selected === id ? null : id;
      renderInv();
      say(state.selected ? "Выбрано. Теперь кликни по мишке." : "Ок.");
    };
    invEl.appendChild(b);
  });
}

function askCandy() {
  state.candyN++;
  const n = state.candyN % 3;
  if (n === 1) say("Мишка: Дай конфетку.");
  else if (n === 2) say("Мишка: Дай конфетку, дай конфетку.");
  else say("Мишка: Дай конфетку, дай конфетку, дай конфетку.");
}

function onClickId(id) {
  if (id === "bear") {
    if (!state.bearHome) return;
    if (state.selected === "candy") {
      useUp("candy");
      say("Мишка: Ммм… Дай конфетку, дай конфетку.");
      return;
    }
    if (state.selected === "pizza") {
      useUp("pizza");
      say("Мишка: Пицца класс. Но конфетку всё равно дай.");
      return;
    }
    if (state.selected === "komok") {
      say("Мишка жмёт комок. Хлюп. Потом снова смотрит на тебя.");
      return;
    }
    askCandy();
    return;
  }
  if (id === "candy") take("candy", "конфета");
  if (id === "komok") take("komok", "комок");
  if (id === "ball") take("ball", "мяч");
  if (id === "pizza") take("pizza", "пицца");
  if (id === "water") {
    say("Бульк. Опыт с водой.");
    if (state.bearHome) setTimeout(askCandy, 900);
  }
  if (id === "sit") say("Сел на скамейку в коридоре.");
  if (id === "bed") say("Кровать мишки.");
  if (id === "sea") {
    state.bearHome = !state.bearHome;
    build();
    say(state.bearHome ? "Мишка дома." : "Мишка уехал на море.");
  }
  if (id === "bell") say("Динь-дон. За дверью шаги.");
  if (id === "peep") say("В глазок видно жёлтого мишку.");
  if (id === "door") say("Дверь соседа.");
  if (id === "yellow") say("Жёлтый мишка: Чего надо? Конфеты мои.");
}

function getIntersect(ev) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  return hits[0] || null;
}

canvas.addEventListener("pointermove", (ev) => {
  const hit = getIntersect(ev);
  if (hit && hit.object.userData.title) {
    hoverLabel.hidden = false;
    hoverLabel.textContent = hit.object.userData.title;
    const rect = canvas.getBoundingClientRect();
    hoverLabel.style.left = ev.clientX - rect.left + 12 + "px";
    hoverLabel.style.top = ev.clientY - rect.top + 12 + "px";
    canvas.style.cursor = "pointer";
  } else {
    hoverLabel.hidden = true;
    canvas.style.cursor = "default";
  }
});

canvas.addEventListener("click", (ev) => {
  const hit = getIntersect(ev);
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
  const h = canvas.clientHeight || Math.round((w * 10) / 16);
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

const t0 = performance.now();
function loop(now) {
  const t = (now - t0) / 1000;
  world.children.forEach((ch) => {
    if (ch.userData.clickId === "bear" || (ch.children && ch.children.length > 3)) {
      // gentle bob for groups that look like bears
    }
  });
  world.traverse((ch) => {
    if (ch.userData.clickId === "bear" && ch.parent === world) {
      ch.position.y = 0.55 + Math.abs(Math.sin(t * 2.2)) * 0.03;
      ch.rotation.y = Math.sin(t * 0.9) * 0.12;
    }
  });
  // bedroom bear sits higher
  if (ROOMS[state.room] === "bedroom") {
    world.traverse((ch) => {
      if (ch.userData.clickId === "bear" && ch.parent === world) {
        ch.position.y = 0.55 + Math.abs(Math.sin(t * 2.2)) * 0.03;
      }
    });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

build();
renderInv();
resize();
requestAnimationFrame(loop);
say("Красный желейный мишка. Кликни по нему. Дай конфетку.");
