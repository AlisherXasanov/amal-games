/**
 * Небесный кристалл — нормальная 3D-игра (Three.js 0.160).
 * Острова в небе · кристаллы · чекпоинты · портал финиша.
 */
import * as THREE from "three";
import { createOrbitCam } from "../shared/amal-3d/orbit.js";

window.__AMAL_NO_WORLD__ = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6eb6ff);
scene.fog = new THREE.Fog(0x6eb6ff, 40, 160);

const camera = new THREE.PerspectiveCamera(62, innerWidth / Math.max(1, innerHeight), 0.1, 320);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xd9f0ff, 0x3b6b4a, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 1.4);
sun.position.set(35, 55, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 140;
sun.shadow.camera.left = -55;
sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55;
sun.shadow.camera.bottom = -55;
sun.shadow.bias = -0.0003;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

// Облака / даль
const cloudGeo = new THREE.SphereGeometry(1, 10, 8);
for (let i = 0; i < 18; i++) {
  const c = new THREE.Mesh(
    cloudGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.55 })
  );
  const s = 2.5 + Math.random() * 4;
  c.scale.set(s * 1.6, s * 0.7, s);
  c.position.set((Math.random() - 0.5) * 140, 8 + Math.random() * 22, -20 + Math.random() * 160);
  scene.add(c);
}

const voidMat = new THREE.MeshStandardMaterial({
  color: 0x1d4f7a,
  roughness: 1,
  transparent: true,
  opacity: 0.4,
});
const voidPlane = new THREE.Mesh(new THREE.CircleGeometry(200, 48), voidMat);
voidPlane.rotation.x = -Math.PI / 2;
voidPlane.position.y = -12;
voidPlane.receiveShadow = true;
scene.add(voidPlane);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const orbit = createOrbitCam(camera, renderer.domElement, {
  distance: 8,
  pitch: 0.42,
  yaw: Math.PI,
  lookOffsetY: 1.2,
  minDist: 3.5,
  maxDist: 16,
});

function mat(color, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness != null ? opts.roughness : 0.52,
    metalness: opts.metalness != null ? opts.metalness : 0.1,
    emissive: opts.emissive != null ? opts.emissive : 0x000000,
    emissiveIntensity: opts.emissiveIntensity != null ? opts.emissiveIntensity : 0,
  });
}

function makePlayer() {
  const g = new THREE.Group();
  const skin = mat(0xffc9a3, { roughness: 0.7 });
  const shirt = mat(0x0891b2, { roughness: 0.4, metalness: 0.15 });
  const pants = mat(0x164e63, { roughness: 0.6 });
  const shoes = mat(0x0f172a, { roughness: 0.35, metalness: 0.25 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 0.34), shirt);
  torso.position.y = 1.05;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 22, 16), skin);
  head.position.y = 1.62;
  head.castShadow = true;
  g.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mat(0x1e293b, { roughness: 0.85 })
  );
  hair.position.y = 1.7;
  g.add(hair);

  [-0.38, 0.38].forEach((x) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.4, 4, 8), skin);
    arm.position.set(x, 1.1, 0);
    arm.castShadow = true;
    g.add(arm);
  });
  [-0.16, 0.16].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.44, 4, 8), pants);
    leg.position.set(x, 0.45, 0);
    leg.castShadow = true;
    g.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.34), shoes);
    shoe.position.set(x, 0.08, 0.04);
    shoe.castShadow = true;
    g.add(shoe);
  });

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12, 0),
    mat(0x67e8f9, { roughness: 0.2, metalness: 0.6, emissive: 0x22d3ee, emissiveIntensity: 0.55 })
  );
  gem.position.set(0, 1.15, 0.2);
  g.add(gem);

  g.userData.height = 1.72;
  scene.add(g);
  return g;
}

const player = makePlayer();
const vel = new THREE.Vector3();
let onGround = false;
let facing = 0;

const platforms = [];
const crystals = [];
const checkpoints = [];
let activeCp = 0;
let crystalCount = 0;
let finished = false;
let startTime = performance.now();
let spawn = { x: 0, y: 2.2, z: 0 };

function addPlatform(opts) {
  const {
    x, y, z,
    w = 4, h = 0.45, d = 4,
    color = 0x38bdf8,
    shape = "box",
  } = opts;
  let geo;
  if (shape === "cylinder") geo = new THREE.CylinderGeometry(Math.max(w, d) / 2, Math.max(w, d) / 2, h, 28);
  else if (shape === "hex") geo = new THREE.CylinderGeometry(Math.max(w, d) / 2, Math.max(w, d) / 2, h, 6);
  else geo = new THREE.BoxGeometry(w, h, d);

  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.48, metalness: 0.12 }));
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.userData = {
    w: (shape === "cylinder" || shape === "hex" ? Math.max(w, d) : w) * 1.02,
    h: Math.max(h, 0.35),
    d: (shape === "cylinder" || shape === "hex" ? Math.max(w, d) : d) * 1.02,
  };
  scene.add(mesh);
  platforms.push(mesh);

  // Трава / край
  if (shape !== "hex") {
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.98, 0.08, d * 0.98),
      mat(0x4ade80, { roughness: 0.9 })
    );
    rim.position.set(x, y + h / 2 + 0.02, z);
    rim.receiveShadow = true;
    scene.add(rim);
  }
  return mesh;
}

function addCrystal(x, y, z) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.38, 0),
    mat(0x67e8f9, { roughness: 0.15, metalness: 0.7, emissive: 0x22d3ee, emissiveIntensity: 0.7 })
  );
  core.castShadow = true;
  g.add(core);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.18 })
  );
  g.add(glow);
  g.position.set(x, y, z);
  g.userData = { taken: false, baseY: y };
  scene.add(g);
  crystals.push(g);
  return g;
}

function addCheckpoint(x, y, z, index) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.08, 10, 36),
    mat(0xfbbf24, { roughness: 0.3, metalness: 0.4, emissive: 0xf59e0b, emissiveIntensity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y + 1.2, z);
  scene.add(ring);
  const pad = addPlatform({ x, y, z, w: 3.2, h: 0.4, d: 3.2, color: 0xf59e0b, shape: "hex" });
  checkpoints.push({ x, y: y + 1.5, z, index, ring, pad });
}

function addFinish(x, y, z) {
  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.18, 12, 40),
    mat(0xa78bfa, { roughness: 0.25, metalness: 0.55, emissive: 0x8b5cf6, emissiveIntensity: 0.6 })
  );
  portal.position.set(x, y + 1.8, z);
  scene.add(portal);
  const swirl = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 32),
    new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  swirl.position.copy(portal.position);
  scene.add(swirl);
  addPlatform({ x, y, z, w: 5, h: 0.5, d: 5, color: 0x7c3aed, shape: "hex" });
  return { portal, swirl, x, y: y + 1.5, z };
}

// —— Уровень ——
addPlatform({ x: 0, y: 0, z: 0, w: 8, h: 0.5, d: 8, color: 0x0ea5e9 });
addCheckpoint(0, 0, 0, 0);

addPlatform({ x: 0, y: 0.6, z: 10, w: 3.2, h: 0.4, d: 3.2, color: 0x38bdf8, shape: "cylinder" });
addPlatform({ x: 3.5, y: 1.4, z: 16, w: 3, h: 0.4, d: 3, color: 0x22d3ee });
addPlatform({ x: -2.5, y: 2.2, z: 22, w: 3.4, h: 0.4, d: 3.4, color: 0x06b6d4, shape: "hex" });
addCrystal(3.5, 2.3, 16);
addCrystal(-2.5, 3.1, 22);

addPlatform({ x: 2, y: 3.2, z: 30, w: 5.5, h: 0.45, d: 4, color: 0x14b8a6 });
addCheckpoint(2, 3.2, 30, 1);
addCrystal(0.5, 4.2, 30);
addCrystal(3.5, 4.2, 31);

addPlatform({ x: 8, y: 4.2, z: 36, w: 2.6, h: 0.35, d: 2.6, color: 0x2dd4bf, shape: "cylinder" });
addPlatform({ x: 12.5, y: 5.2, z: 42, w: 2.8, h: 0.35, d: 2.8, color: 0x5eead4 });
addPlatform({ x: 9, y: 6.4, z: 49, w: 4.5, h: 0.45, d: 4.5, color: 0x67e8f9, shape: "hex" });
addCrystal(12.5, 6.1, 42);
addCrystal(9, 7.4, 49);

addPlatform({ x: 4, y: 7.2, z: 57, w: 3, h: 0.4, d: 3, color: 0x38bdf8 });
addPlatform({ x: -1, y: 8.2, z: 64, w: 3.2, h: 0.4, d: 3.2, color: 0x0ea5e9, shape: "cylinder" });
addPlatform({ x: -6, y: 9.4, z: 72, w: 6, h: 0.5, d: 6, color: 0x0284c7 });
addCheckpoint(-6, 9.4, 72, 2);
addCrystal(4, 8.2, 57);
addCrystal(-1, 9.2, 64);
addCrystal(-7.5, 10.5, 72);
addCrystal(-4.5, 10.5, 73.5);

addPlatform({ x: -10, y: 10.6, z: 80, w: 2.8, h: 0.35, d: 2.8, color: 0x38bdf8, shape: "hex" });
addPlatform({ x: -6, y: 11.8, z: 87, w: 3, h: 0.35, d: 3, color: 0x22d3ee });
addPlatform({ x: -2, y: 13, z: 94, w: 3.4, h: 0.4, d: 3.4, color: 0x06b6d4, shape: "cylinder" });
addCrystal(-10, 11.5, 80);
addCrystal(-2, 14, 94);

const finish = addFinish(2, 14.2, 104);
addCrystal(2, 15.5, 104);

document.getElementById("crystals-max").textContent = String(crystals.length);

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1400);
}

function respawn() {
  player.position.set(spawn.x, spawn.y, spawn.z);
  vel.set(0, 0, 0);
  toast("Чекпоинт ⚑");
}

function setCheckpoint(cp) {
  if (cp.index <= activeCp) return;
  activeCp = cp.index;
  spawn = { x: cp.x, y: cp.y, z: cp.z };
  document.getElementById("cp").textContent = String(activeCp + 1);
  toast("Новый чекпоинт!");
}

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

// Мобильный стик
const pad = document.getElementById("pad");
const knob = document.getElementById("pad-knob");
const stick = { x: 0, y: 0, active: false };
function setStick(clientX, clientY) {
  const r = pad.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = (clientX - cx) / (r.width / 2);
  let dy = (clientY - cy) / (r.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  if (len > 1) { dx /= len; dy /= len; }
  stick.x = dx;
  stick.y = dy;
  knob.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
}
function clearStick() {
  stick.x = 0; stick.y = 0; stick.active = false;
  knob.style.transform = "translate(0,0)";
}
pad.addEventListener("pointerdown", (e) => {
  stick.active = true;
  pad.setPointerCapture(e.pointerId);
  setStick(e.clientX, e.clientY);
});
pad.addEventListener("pointermove", (e) => {
  if (!stick.active) return;
  setStick(e.clientX, e.clientY);
});
pad.addEventListener("pointerup", clearStick);
pad.addEventListener("pointercancel", clearStick);
document.getElementById("jump-btn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  keys.Space = true;
});
document.getElementById("jump-btn").addEventListener("pointerup", () => { keys.Space = false; });

function getInput() {
  let x = 0, z = 0;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) z -= 1;
  if (keys.KeyS || keys.ArrowDown) z += 1;
  if (stick.active) {
    x += stick.x;
    z += stick.y;
  }
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return { x, z, jump: !!(keys.Space) };
}

function collidePlatforms() {
  onGround = false;
  const px = player.position.x;
  const py = player.position.y;
  const pz = player.position.z;
  const radius = 0.28;
  const height = player.userData.height;

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const hw = p.userData.w / 2;
    const hd = p.userData.d / 2;
    const top = p.position.y + p.userData.h / 2;
    const within =
      px > p.position.x - hw - radius &&
      px < p.position.x + hw + radius &&
      pz > p.position.z - hd - radius &&
      pz < p.position.z + hd + radius;

    if (!within) continue;

    // стоять сверху
    if (vel.y <= 0 && py <= top + 0.12 && py >= top - 0.55) {
      player.position.y = top;
      vel.y = 0;
      onGround = true;
    }
    // голова
    const bottom = p.position.y - p.userData.h / 2;
    if (vel.y > 0 && py + height > bottom && py + height < bottom + 0.45 &&
        Math.abs(px - p.position.x) < hw * 0.9 && Math.abs(pz - p.position.z) < hd * 0.9) {
      vel.y = 0;
      player.position.y = bottom - height;
    }
  }
}

function win() {
  if (finished) return;
  finished = true;
  const sec = ((performance.now() - startTime) / 1000).toFixed(1);
  document.getElementById("win-text").textContent =
    "Кристаллы: " + crystalCount + "/" + crystals.length + " · время " + sec + "с";
  document.getElementById("win").classList.add("show");
  toast("Портал! ✨");
}

document.getElementById("again").onclick = () => location.reload();

player.position.set(spawn.x, spawn.y, spawn.z);

let last = performance.now();
let jumpBuf = 0;

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  if (!finished) {
    document.getElementById("time").textContent = ((now - startTime) / 1000).toFixed(1);

    const input = getInput();
    const speed = 7.2;
    // движение относительно камеры
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const wish = new THREE.Vector3();
    wish.addScaledVector(right, input.x);
    wish.addScaledVector(forward, -input.z);
    if (wish.lengthSq() > 0.0001) {
      wish.normalize();
      vel.x = wish.x * speed;
      vel.z = wish.z * speed;
      facing = Math.atan2(wish.x, wish.z);
      player.rotation.y = facing;
    } else {
      vel.x *= 0.78;
      vel.z *= 0.78;
    }

    if (input.jump) jumpBuf = 0.12;
    jumpBuf -= dt;
    if (jumpBuf > 0 && onGround) {
      vel.y = 9.2;
      onGround = false;
      jumpBuf = 0;
    }

    vel.y -= 22 * dt;
    player.position.x += vel.x * dt;
    player.position.y += vel.y * dt;
    player.position.z += vel.z * dt;
    collidePlatforms();

    if (player.position.y < -8) respawn();

    // кристаллы
    for (let i = 0; i < crystals.length; i++) {
      const c = crystals[i];
      if (c.userData.taken) continue;
      c.rotation.y += dt * 1.8;
      c.position.y = c.userData.baseY + Math.sin(now * 0.004 + i) * 0.18;
      if (c.position.distanceTo(player.position.clone().add(new THREE.Vector3(0, 1, 0))) < 1.35) {
        c.userData.taken = true;
        c.visible = false;
        crystalCount++;
        document.getElementById("crystals").textContent = String(crystalCount);
        toast("Кристалл +" + crystalCount);
      }
    }

    // чекпоинты
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      cp.ring.rotation.z += dt * 1.2;
      const dx = player.position.x - cp.x;
      const dz = player.position.z - cp.z;
      if (Math.hypot(dx, dz) < 1.6 && Math.abs(player.position.y - (cp.y - 1.2)) < 2.2) {
        setCheckpoint(cp);
      }
    }

    // финиш
    finish.portal.rotation.y += dt * 0.9;
    finish.swirl.rotation.z -= dt * 1.4;
    if (
      crystalCount >= Math.max(1, Math.floor(crystals.length * 0.6)) &&
      Math.hypot(player.position.x - finish.x, player.position.z - finish.z) < 1.8 &&
      Math.abs(player.position.y - finish.y) < 2.5
    ) {
      win();
    }
  }

  orbit.follow(player.position.x, player.position.y + 1.25, player.position.z);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
toast("Собери кристаллы → портал");
