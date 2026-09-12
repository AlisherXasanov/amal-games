/**
 * Яйцо в фарах — короткий 3D-хаос как в шортсах:
 * ночь, летающая машина с фарами, герой-яйцо (текстура «как яйцо»).
 */
import * as THREE from "three";

window.__AMAL_NO_WORLD__ = true;
const SAVE = "amal-egg-night-v1";

const scoreEl = document.getElementById("score");
const sceneEl = document.getElementById("scene");
const toastEl = document.getElementById("toast");
const titleEl = document.getElementById("title");
const pad = document.getElementById("pad");
const knob = document.getElementById("pad-knob");

let score = 0;
let sceneIdx = 0;
let toastT = 0;
let best = 0;
try {
  best = Number(JSON.parse(localStorage.getItem(SAVE) || "{}").best) || 0;
} catch (_) {}

function toast(m, t) {
  toastEl.textContent = m;
  toastEl.style.display = "block";
  toastT = t == null ? 2.2 : t;
}

function saveBest() {
  try {
    localStorage.setItem(SAVE, JSON.stringify({ best: Math.max(best, score) }));
  } catch (_) {}
}

/** Яичная текстура Kenney-style: гладкая скраска + крапинки */
function makeEggTexture(base, speck) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(110, 100, 20, 128, 128, 140);
  grd.addColorStop(0, base);
  grd.addColorStop(1, speck);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = "rgba(90,60,40," + (0.08 + Math.random() * 0.18) + ")";
    g.beginPath();
    g.ellipse(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 5, 1 + Math.random() * 3, Math.random(), 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(255,255,255,0.25)";
  g.beginPath();
  g.ellipse(95, 88, 28, 18, -0.4, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeAsphalt() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#1e293b";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = "rgba(148,163,184," + Math.random() * 0.12 + ")";
    g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  g.strokeStyle = "rgba(251,191,36,0.35)";
  g.lineWidth = 3;
  g.setLineDash([10, 12]);
  g.beginPath();
  g.moveTo(64, 0);
  g.lineTo(64, 128);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const WORDS = ["креативных", "гениальных", "ночных", "яичных", "летающих"];

const world = new THREE.Scene();
world.background = new THREE.Color(0x0b1220);
world.fog = new THREE.FogExp2(0x0b1220, 0.045);

const camera = new THREE.PerspectiveCamera(55, innerWidth / Math.max(1, innerHeight), 0.1, 120);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0x64748b, 0x0f172a, 0.55);
world.add(hemi);
const moon = new THREE.DirectionalLight(0x93c5fd, 0.35);
moon.position.set(-8, 16, -6);
world.add(moon);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 60),
  new THREE.MeshStandardMaterial({ map: makeAsphalt(), roughness: 0.95, metalness: 0.05 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

// бордюры / здания-силуэты
for (let i = -4; i <= 4; i++) {
  if (i === 0) continue;
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(3 + Math.random() * 2, 4 + Math.random() * 8, 3),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
  );
  b.position.set(i * 4.2, b.geometry.parameters[1] / 2, -8 - Math.random() * 20);
  world.add(b);
}

const eggTex = makeEggTexture("#fde68a", "#f59e0b");
const eggMat = new THREE.MeshStandardMaterial({ map: eggTex, roughness: 0.55, metalness: 0.05 });
const egg = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), eggMat);
egg.scale.set(0.85, 1.15, 0.85);
egg.castShadow = true;
egg.position.set(0, 0.7, 8);
world.add(egg);

// глазки
function makeEye(x) {
  const e = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  e.position.set(x, 0.25, 0.42);
  egg.add(e);
  const shine = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  shine.position.set(-0.02, 0.02, 0.06);
  e.add(shine);
}
makeEye(-0.16);
makeEye(0.16);

const papers = [];
for (let i = 0; i < 28; i++) {
  const p = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, side: THREE.DoubleSide, roughness: 0.8 })
  );
  p.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
  p.position.set((Math.random() - 0.5) * 10, 0.02, (Math.random() - 0.5) * 30);
  world.add(p);
  papers.push(p);
}

const shards = [];
function spawnShards(n) {
  while (shards.length) {
    const s = shards.pop();
    world.remove(s);
  }
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10),
      new THREE.MeshStandardMaterial({
        map: makeEggTexture("#fef3c7", "#fbbf24"),
        emissive: 0x92400e,
        emissiveIntensity: 0.25,
        roughness: 0.4,
      })
    );
    s.scale.set(0.8, 1.1, 0.8);
    s.position.set((Math.random() - 0.5) * 8, 0.35, -4 - Math.random() * 22);
    s.userData.got = false;
    world.add(s);
    shards.push(s);
  }
}

// машина + фары
const car = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 0.55, 3.4),
  new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.35 })
);
body.castShadow = true;
car.add(body);
const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.45, 1.5),
  new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.3 })
);
cabin.position.set(0, 0.45, -0.2);
car.add(cabin);

const headL = new THREE.SpotLight(0xffe08a, 28, 28, 0.35, 0.35, 1.2);
headL.position.set(-0.45, 0.1, 1.7);
headL.target.position.set(-0.45, -2, 8);
car.add(headL);
car.add(headL.target);
const headR = new THREE.SpotLight(0xffe08a, 28, 28, 0.35, 0.35, 1.2);
headR.position.set(0.45, 0.1, 1.7);
headR.target.position.set(0.45, -2, 8);
car.add(headR);
car.add(headR.target);

const lampGeo = new THREE.SphereGeometry(0.12, 10, 10);
[-0.45, 0.45].forEach((x) => {
  const lamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xffe08a }));
  lamp.position.set(x, 0.05, 1.75);
  car.add(lamp);
});

car.position.set(0, 4.5, -18);
world.add(car);

const player = {
  x: 0,
  z: 8,
  y: 0.7,
  vx: 0,
  vz: 0,
  vy: 0,
  onGround: true,
  hitT: 0,
  roll: 0,
};

const keys = Object.create(null);
const stick = { x: 0, y: 0 };
let jumpQ = false;

const SCENES = [
  { name: "Фары сверху", carY: 4.2, carSpeed: 10, shards: 5 },
  { name: "Низкий пролёт", carY: 2.4, carSpeed: 13, shards: 6 },
  { name: "Зигзаг", carY: 3.5, carSpeed: 12, shards: 7, zig: true },
  { name: "Буря бумаг", carY: 5, carSpeed: 11, shards: 8, wind: true },
  { name: "Финал · гений", carY: 3, carSpeed: 15, shards: 10, zig: true },
];

function resetScene(i) {
  sceneIdx = ((i % SCENES.length) + SCENES.length) % SCENES.length;
  const S = SCENES[sceneIdx];
  sceneEl.textContent = String(sceneIdx + 1);
  titleEl.textContent = WORDS[sceneIdx % WORDS.length];
  player.x = 0;
  player.z = 8;
  player.y = 0.7;
  player.vx = player.vz = player.vy = 0;
  player.onGround = true;
  player.hitT = 0;
  car.position.set((Math.random() - 0.5) * 4, S.carY, -22);
  car.userData.t = 0;
  spawnShards(S.shards);
  toast(S.name + " · собери яйца, увернись от машины", 2.5);
}

function nextScene() {
  if (sceneIdx >= SCENES.length - 1) {
    toast("Все шорты пройдены! Очки: " + score + (best ? " · рекорд " + Math.max(best, score) : ""), 3.5);
    saveBest();
    score = Math.floor(score * 0.5);
    scoreEl.textContent = String(score);
    resetScene(0);
    return;
  }
  resetScene(sceneIdx + 1);
}

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    jumpQ = true;
  }
  if (e.code === "KeyN" || e.code === "Enter") nextScene();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

document.getElementById("btn-jump").onclick = () => {
  jumpQ = true;
};
document.getElementById("btn-next").onclick = () => nextScene();

let stickOn = false;
function setStick(cx, cy) {
  const r = pad.getBoundingClientRect();
  let dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
  let dy = (cy - (r.top + r.height / 2)) / (r.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  if (len > 1) {
    dx /= len;
    dy /= len;
  }
  stick.x = dx;
  stick.y = dy;
  knob.style.transform = "translate(" + dx * 28 + "px," + dy * 28 + "px)";
}
pad.addEventListener("pointerdown", (e) => {
  stickOn = true;
  pad.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY);
});
pad.addEventListener("pointermove", (e) => {
  if (stickOn) setStick(e.clientX, e.clientY);
});
function endStick() {
  stickOn = false;
  stick.x = stick.y = 0;
  knob.style.transform = "translate(0,0)";
}
pad.addEventListener("pointerup", endStick);
pad.addEventListener("pointercancel", endStick);

function hitPlayer(force) {
  if (player.hitT > 0) return;
  player.hitT = 1.1;
  player.vy = 4;
  player.vx += (Math.random() - 0.5) * force;
  player.vz += force * 0.4;
  score = Math.max(0, score - 5);
  scoreEl.textContent = String(score);
  toast("Бац! Фары задели яйцо (−5)", 1.4);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  const S = SCENES[sceneIdx];

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toastEl.style.display = "none";
  }

  let ix = 0;
  let iz = 0;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (keys.KeyW || keys.ArrowUp) iz -= 1;
  if (keys.KeyS || keys.ArrowDown) iz += 1;
  if (Math.abs(stick.x) > 0.15 || Math.abs(stick.y) > 0.15) {
    ix = stick.x;
    iz = stick.y;
  }

  const spd = 7;
  player.vx += ix * spd * dt * 8;
  player.vz += iz * spd * dt * 8;
  player.vx *= Math.pow(0.04, dt);
  player.vz *= Math.pow(0.04, dt);

  if (jumpQ && player.onGround) {
    player.vy = 7.2;
    player.onGround = false;
  }
  jumpQ = false;

  player.vy -= 18 * dt;
  player.x += player.vx * dt;
  player.z += player.vz * dt;
  player.y += player.vy * dt;
  if (player.y <= 0.7) {
    player.y = 0.7;
    player.vy = 0;
    player.onGround = true;
  }
  player.x = Math.max(-7, Math.min(7, player.x));
  player.z = Math.max(-24, Math.min(12, player.z));
  if (player.hitT > 0) player.hitT -= dt;

  player.roll += (Math.abs(player.vx) + Math.abs(player.vz)) * dt * 2.2;
  egg.position.set(player.x, player.y, player.z);
  egg.rotation.x = player.roll;
  egg.rotation.z = -player.vx * 0.08;
  if (player.hitT > 0) egg.rotation.y += dt * 8;

  // машина
  car.userData.t += dt;
  const t = car.userData.t;
  car.position.z += S.carSpeed * dt;
  if (S.zig) car.position.x = Math.sin(t * 2.2) * 4.5;
  else car.position.x += (player.x - car.position.x) * dt * 1.4;
  car.position.y = S.carY + Math.sin(t * 3) * 0.25;
  car.lookAt(player.x, 0.5, player.z + 2);
  headL.target.position.set(player.x - 0.3, 0.2, player.z);
  headR.target.position.set(player.x + 0.3, 0.2, player.z);
  headL.target.updateMatrixWorld();
  headR.target.updateMatrixWorld();

  if (car.position.z > 16) {
    car.position.z = -24;
    car.position.x = (Math.random() - 0.5) * 6;
    score += 2;
    scoreEl.textContent = String(score);
  }

  // столкновение с машиной (простая сфера)
  const dx = car.position.x - player.x;
  const dy = car.position.y - player.y;
  const dz = car.position.z - player.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 2.2) hitPlayer(10);

  // сбор яиц
  for (let i = 0; i < shards.length; i++) {
    const s = shards[i];
    if (s.userData.got) continue;
    s.rotation.y += dt * 2;
    s.position.y = 0.35 + Math.sin(now * 0.005 + i) * 0.08;
    if (Math.hypot(s.position.x - player.x, s.position.z - player.z) < 1.1) {
      s.userData.got = true;
      world.remove(s);
      score += 10;
      scoreEl.textContent = String(score);
      toast("+10 яичко!", 0.8);
    }
  }
  if (shards.every((s) => s.userData.got)) {
    toast("Сцена чиста! Жми «След. шорт»", 2);
    saveBest();
  }

  if (S.wind) {
    for (let i = 0; i < papers.length; i++) {
      const p = papers[i];
      p.position.y = 0.05 + Math.abs(Math.sin(now * 0.003 + i)) * 1.5;
      p.rotation.z += dt * (1 + (i % 3));
      p.position.x += Math.sin(now * 0.001 + i) * dt * 2;
    }
  }

  camera.position.lerp(new THREE.Vector3(player.x * 0.35, 5.5, player.z + 10), 1 - Math.pow(0.001, dt));
  camera.lookAt(player.x, 1.2, player.z - 2);

  titleEl.style.opacity = String(0.35 + 0.35 * Math.sin(now * 0.002));

  renderer.render(world, camera);
  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

resetScene(0);
toast("Ночь · фары · катись яйцом. Собрал все — следующий шорт.", 3);
requestAnimationFrame(frame);
