import * as THREE from "three";

const EPISODES = [
  {
    id: "hello",
    title: "Привет из жёлтой хаты",
    blurb: "Мишка здоровается",
    lines: ["Привет! Я мишка из Мульт-студии.", "Сегодня будет короткое приключение."]
  },
  {
    id: "candy",
    title: "Конфеты на столе",
    blurb: "Сладкий выпуск",
    lines: ["Ого, сколько конфет!", "Одну можно? Ну хотя бы маленькую…"]
  },
  {
    id: "water",
    title: "Эксперимент с водой",
    blurb: "Бульк!",
    lines: ["Наливаем воду…", "Бульк! Я желейный, мне мокро и весело."]
  },
  {
    id: "morning",
    title: "Утро в хате",
    blurb: "Новый день",
    lines: ["Доброе утро!", "Солнышко светит, пора начинать выпуск."]
  },
  {
    id: "dance",
    title: "Танцующий мишка",
    blurb: "Ритм",
    lines: ["Раз, два, три!", "Танцуем без рекламы — только свой мульт."]
  },
  {
    id: "sleep",
    title: "Мишка хочет спать",
    blurb: "Тихий выпуск",
    lines: ["Я немного устал…", "Спокойной ночи. До следующего ролика."]
  },
  {
    id: "thanks",
    title: "Спасибо за лайк",
    blurb: "Общее спасибо",
    lines: ["Спасибо, что смотришь наши ролики!", "Лайк и подписка на сайте очень помогают."]
  },
  {
    id: "new1",
    title: "Сюрприз в коробке",
    blurb: "Чего там?",
    lines: ["Что в коробке?", "Открываем… Вау! Это для тебя."]
  },
  {
    id: "new2",
    title: "Мишка и кубик-пазл",
    blurb: "Своя игра",
    lines: ["Соберём пазл вместе?", "Получилось! Ты молодец."]
  },
  {
    id: "new3",
    title: "Песня про сосиски (своя)",
    blurb: "Шуточный выпуск",
    lines: ["Ля-ля-ля, сегодня весело!", "Это наш ролик, не чужой канал."]
  }
];

const SAVE_KEY = "mult-studio-mine-v1";
const ASK_KEY = "mult-studio-asks-v1";

const canvas = document.getElementById("view");
const shelf = document.getElementById("shelf");
const nowTitle = document.getElementById("nowTitle");
const btnPlay = document.getElementById("btnPlay");
const btnStop = document.getElementById("btnStop");
const studioScene = document.getElementById("studioScene");
const studioNick = document.getElementById("studioNick");
const studioLine = document.getElementById("studioLine");
const studioNote = document.getElementById("studioNote");
const commentsEl = document.getElementById("comments");

let current = EPISODES[0];
let playing = false;
let playToken = 0;
let customLines = null;

/* ——— 3D scene ——— */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe566);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 1.35, 2.55);
camera.lookAt(0, 0.75, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const sun = new THREE.DirectionalLight(0xfff2cc, 1.05);
sun.position.set(2, 5, 3);
scene.add(sun);

const room = new THREE.Group();
scene.add(room);

const wallMat = new THREE.MeshLambertMaterial({ color: 0xffe566 });
const wall = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 0.2), wallMat);
wall.position.set(0, 1.4, -1.4);
room.add(wall);
const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 3), wallMat);
wallL.position.set(-2.9, 1.4, 0);
room.add(wallL);
const wallR = wallL.clone();
wallR.position.x = 2.9;
room.add(wallR);

const table = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 0.18, 1.6),
  new THREE.MeshLambertMaterial({ color: 0xe8c878 })
);
table.position.set(0, 0.55, 0.35);
room.add(table);

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.15, 4),
  new THREE.MeshLambertMaterial({ color: 0xd9a428 })
);
floor.position.set(0, -0.05, 0.2);
room.add(floor);

function makeBear() {
  const g = new THREE.Group();
  const red = new THREE.MeshLambertMaterial({ color: 0xe51d30 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x5c0712 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 18), red);
  body.scale.set(1, 1.15, 0.9);
  body.position.y = 0.95;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 18), red);
  head.position.y = 1.38;
  g.add(head);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), red);
    ear.position.set(s * 0.2, 1.58, 0);
    g.add(ear);
  });
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), dark);
    eye.position.set(s * 0.09, 1.42, 0.22);
    g.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), dark);
  nose.position.set(0, 1.34, 0.26);
  g.add(nose);
  [-1, 1].forEach((s) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.18, 4, 8), red);
    arm.position.set(s * 0.42, 0.95, 0.05);
    arm.rotation.z = s * 0.4;
    g.add(arm);
  });
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.12, 4, 8), red);
    leg.position.set(s * 0.16, 0.62, 0.05);
    g.add(leg);
  });
  g.position.set(0, 0.55, 0.45);
  return g;
}

const bear = makeBear();
scene.add(bear);

function makeHand(x) {
  const g = new THREE.Group();
  const sleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.1, 0.35, 4, 8),
    new THREE.MeshLambertMaterial({ color: 0x2f6fdb })
  );
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.set(0, 0, -0.2);
  g.add(sleeve);
  const palm = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 12),
    new THREE.MeshLambertMaterial({ color: 0xf0c29a })
  );
  palm.scale.set(1.1, 0.7, 1.2);
  g.add(palm);
  g.position.set(x, 1.85, 0.9);
  return g;
}

const handL = makeHand(-0.55);
const handR = makeHand(0.55);
scene.add(handL, handR);

const candy = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 12, 10),
  new THREE.MeshLambertMaterial({ color: 0xff4d5e })
);
candy.position.set(0.55, 0.72, 0.7);
scene.add(candy);

function resize() {
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = canvas.clientHeight || 360;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let t0 = performance.now();
function animate(now) {
  const t = (now - t0) / 1000;
  bear.position.y = 0.55 + Math.abs(Math.sin(t * 3)) * 0.04;
  bear.rotation.y = Math.sin(t * 1.2) * 0.15;
  handL.position.y = 1.85 + Math.sin(t * 2) * 0.03;
  handR.position.y = 1.85 + Math.cos(t * 2.1) * 0.03;
  candy.rotation.y = t;
  if (playing && current.id === "dance") {
    bear.rotation.z = Math.sin(t * 6) * 0.2;
  } else {
    bear.rotation.z = 0;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

/* ——— speech ——— */
function speak(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ru-RU";
      u.rate = 1.02;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    } catch (_) {
      resolve();
    }
  });
}

function stopSpeech() {
  try {
    window.speechSynthesis && window.speechSynthesis.cancel();
  } catch (_) {}
}

async function playEpisode(ep, linesOverride) {
  current = ep;
  customLines = linesOverride || null;
  nowTitle.textContent = ep.title;
  highlightShelf();
  playing = true;
  const token = ++playToken;
  btnPlay.textContent = "▶ Идёт…";
  const lines = customLines || ep.lines;
  for (const line of lines) {
    if (token !== playToken) return;
    nowTitle.textContent = line;
    await speak(line);
    await wait(350);
  }
  if (token !== playToken) return;
  playing = false;
  btnPlay.textContent = "▶ Смотреть";
  nowTitle.textContent = ep.title + " · конец";
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function shoutoutLines(nick) {
  const name = String(nick || "друг").trim() || "друг";
  return [
    `Привет, ${name}!`,
    "Спасибо, что подписался и поставил лайк.",
    "Я не настоящий Валера с YouTube, но этот ролик я посвящаю тебе.",
    "Спасибо за всё. Ты крутой!"
  ];
}

/* ——— UI shelf ——— */
function loadMine() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
  } catch (_) {
    return [];
  }
}

function saveMine(list) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 40)));
}

function allCards() {
  const mine = loadMine().map((m) => ({
    id: m.id,
    title: m.title,
    blurb: "твой ролик",
    lines: m.lines,
    mine: true
  }));
  return EPISODES.concat(mine);
}

function renderShelf() {
  shelf.innerHTML = "";
  allCards().forEach((ep) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card" + (current && current.id === ep.id ? " active" : "");
    btn.dataset.id = ep.id;
    btn.innerHTML = `<strong>${ep.title}</strong><span>${ep.blurb}</span>`;
    btn.addEventListener("click", () => {
      current = ep;
      customLines = ep.mine ? ep.lines : null;
      nowTitle.textContent = ep.title;
      highlightShelf();
      playEpisode(ep, ep.mine ? ep.lines : null);
    });
    shelf.appendChild(btn);
  });
}

function highlightShelf() {
  shelf.querySelectorAll(".card").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === current.id);
  });
}

EPISODES.forEach((ep) => {
  const opt = document.createElement("option");
  opt.value = ep.id;
  opt.textContent = ep.title;
  studioScene.appendChild(opt);
});

function fillStudioLine() {
  const ep = EPISODES.find((e) => e.id === studioScene.value) || EPISODES[0];
  const nick = studioNick.value.trim();
  if (nick) {
    studioLine.value = shoutoutLines(nick).join(" ");
  } else {
    studioLine.value = ep.lines.join(" ");
  }
}
studioScene.addEventListener("change", fillStudioLine);
studioNick.addEventListener("input", fillStudioLine);
fillStudioLine();

try {
  if (window.AmalHub && AmalHub.getNick) {
    const n = AmalHub.getNick();
    if (n) {
      studioNick.value = n;
      document.getElementById("askNick").value = n;
      fillStudioLine();
    }
  }
} catch (_) {}

btnPlay.addEventListener("click", () => {
  playEpisode(current, customLines);
});
btnStop.addEventListener("click", () => {
  playToken++;
  playing = false;
  stopSpeech();
  btnPlay.textContent = "▶ Смотреть";
  nowTitle.textContent = current.title;
});

document.getElementById("btnShoot").addEventListener("click", () => {
  const ep = EPISODES.find((e) => e.id === studioScene.value) || EPISODES[0];
  const nick = studioNick.value.trim();
  const raw = studioLine.value.trim();
  const lines = nick
    ? shoutoutLines(nick)
    : raw
      ? raw.split(/(?<=[.!?…])\s+/).filter(Boolean).slice(0, 6)
      : ep.lines;
  document.querySelector('.tab[data-tab="watch"]').click();
  playEpisode(
    { id: "studio-live", title: nick ? `Для ${nick}` : "Студийный ролик", blurb: "снято сейчас", lines },
    lines
  );
  studioNote.textContent = "Снято. Можно сохранить в полку кнопкой «В мою полку».";
  window.__lastShot = {
    id: "mine-" + Date.now(),
    title: nick ? `Для ${nick}` : "Мой ролик · " + ep.title,
    lines
  };
});

document.getElementById("btnSaveMine").addEventListener("click", () => {
  const shot = window.__lastShot;
  if (!shot) {
    studioNote.textContent = "Сначала нажми «Снять ролик».";
    return;
  }
  const list = loadMine();
  list.unshift(shot);
  saveMine(list);
  renderShelf();
  studioNote.textContent = "Сохранено в полку (в этом браузере).";
});

/* ——— asks / comments ——— */
function loadAsks() {
  try {
    return JSON.parse(localStorage.getItem(ASK_KEY) || "[]");
  } catch (_) {
    return [];
  }
}
function saveAsks(list) {
  localStorage.setItem(ASK_KEY, JSON.stringify(list.slice(0, 60)));
}

function renderAsks() {
  const list = loadAsks();
  commentsEl.innerHTML = "";
  if (!list.length) {
    commentsEl.innerHTML = "<p class='note'>Пока нет запросов — напиши первый.</p>";
    return;
  }
  list.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `<b>${item.nick}</b><span>${item.text}</span>`;
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "Сделать ролик для " + item.nick;
    b.addEventListener("click", () => {
      document.querySelector('.tab[data-tab="watch"]').click();
      const lines = shoutoutLines(item.nick);
      playEpisode({ id: "ask-" + idx, title: `Для ${item.nick}`, blurb: "по запросу", lines }, lines);
      window.__lastShot = {
        id: "mine-" + Date.now(),
        title: `Для ${item.nick}`,
        lines
      };
    });
    div.appendChild(b);
    commentsEl.appendChild(div);
  });
}

document.getElementById("askForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nick = document.getElementById("askNick").value.trim();
  const text = document.getElementById("askText").value.trim();
  if (!nick || !text) return;
  const list = loadAsks();
  list.unshift({ nick, text, at: Date.now() });
  saveAsks(list);
  document.getElementById("askText").value = "";
  renderAsks();
});

document.getElementById("btnShout").addEventListener("click", () => {
  const nick =
    document.getElementById("askNick").value.trim() ||
    studioNick.value.trim() ||
    "друг";
  document.querySelector('.tab[data-tab="watch"]').click();
  const lines = shoutoutLines(nick);
  playEpisode({ id: "shout", title: `Для ${nick}`, blurb: "персональный", lines }, lines);
  window.__lastShot = { id: "mine-" + Date.now(), title: `Для ${nick}`, lines };
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
    tab.classList.add("on");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("on");
    resize();
  });
});

renderShelf();
renderAsks();
nowTitle.textContent = current.title;
