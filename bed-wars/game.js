import * as THREE from "three";

/** Bed Wars - bright 3D arena, walk on islands. */

function isOwner() {
  try {
    if (window.__AMAL_OWNER__ || window.__AMAL_GOD__) return true;
    if (["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"].some((k) => localStorage.getItem(k) === "1")) return true;
    if (new URLSearchParams(location.search).get("owner")) return true;
    if (window.AmalPowers?.isOwner?.()) return true;
    if (window.AmalHub?.isOwner?.()) return true;
  } catch (_) {}
  return false;
}

const TEAMS = [
  { id: "yellow", name: "Жёлтые", hex: "#facc15", color: 0xfacc15, x: -36, z: -36 },
  { id: "blue", name: "Синие", hex: "#38bdf8", color: 0x38bdf8, x: 36, z: -36 },
  { id: "red", name: "Красные", hex: "#f87171", color: 0xf87171, x: -36, z: 36 },
  { id: "green", name: "Зелёные", hex: "#4ade80", color: 0x4ade80, x: 36, z: 36 }
];
const ME = "yellow";
const ISLAND = 12;
const BRIDGE_HALF = 2.8; // ширина прохода по мосту

const COST = {
  wall: [0, 40, 90, 180, 320],
  bow: [0, 40, 100, 200],
  helmet: [0, 50, 110, 220, 380],
  pickaxe: [0, 45, 100, 200, 350],
  sword: [0, 60, 140, 280],
  magic: [0, 60, 140, 280],
  skin: [0, 80, 160, 300]
};

const SKINS = [
  { name: "Новичок", body: 0xfacc15, accent: 0xfef08a },
  { name: "Воин", body: 0xea580c, accent: 0xfbbf24 },
  { name: "Рыцарь", body: 0x64748b, accent: 0xe2e8f0 },
  { name: "Маг", body: 0x7c3aed, accent: 0xe9d5ff }
];

function blockTex(fill, light) {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = fill;
  g.fillRect(0, 0, 32, 32);
  g.fillStyle = light || "rgba(255,255,255,.2)";
  g.fillRect(0, 0, 32, 6);
  g.strokeStyle = "rgba(0,0,0,.28)";
  g.strokeRect(0.5, 0.5, 31, 31);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const TEX = {
  grass: blockTex("#5ecf6a", "rgba(255,255,255,.28)"),
  dirt: blockTex("#8b5a2b"),
  stone: blockTex("#9aa3b2", "rgba(255,255,255,.22)"),
  wood: blockTex("#c47a2c"),
  wool: blockTex("#f5f5f5", "rgba(255,255,255,.4)"),
  water: blockTex("#2aa5d9", "rgba(255,255,255,.3)"),
  roof: blockTex("#b45309")
};

const walkPads = [];

function addWalk(x, z, hw, hd) {
  walkPads.push({ x, z, hw, hd });
}

function distToSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const ab2 = abx * abx + abz * abz || 1;
  let t = (apx * abx + apz * abz) / ab2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

/** Сплошная земля: остров + широкий мост + центр — без дыр, не застрянешь. */
function onGround(x, z) {
  if (Math.hypot(x, z) <= 9) return true;
  for (const t of TEAMS) {
    if (Math.abs(x - t.x) <= ISLAND && Math.abs(z - t.z) <= ISLAND) return true;
  }
  for (const t of TEAMS) {
    const len = Math.hypot(t.x, t.z) || 1;
    const edge = ISLAND - 0.2;
    const ex = t.x + (-t.x / len) * edge;
    const ez = t.z + (-t.z / len) * edge;
    const bx = (t.x / len) * 7;
    const bz = (t.z / len) * 7;
    if (distToSegment(x, z, ex, ez, bx, bz) <= BRIDGE_HALF) return true;
  }
  for (const p of walkPads) {
    if (Math.abs(x - p.x) <= p.hw && Math.abs(z - p.z) <= p.hd) return true;
  }
  return false;
}

function tryMove(from, dx, dz) {
  const nx = from.x + dx;
  const nz = from.z + dz;
  if (onGround(nx, nz)) return { x: nx, z: nz };
  if (onGround(nx, from.z)) return { x: nx, z: from.z };
  if (onGround(from.x, nz)) return { x: from.x, z: nz };
  // маленький шаг по диагонали не проходит — всё равно попробуем чуть короче
  const hx = from.x + dx * 0.5;
  const hz = from.z + dz * 0.5;
  if (onGround(hx, hz)) return { x: hx, z: hz };
  return { x: from.x, z: from.z };
}

const app = document.getElementById("app");
app.innerHTML = `
  <canvas id="game"></canvas>
  <div class="hud">
    <div class="goal" id="goal">Цель: защити жёлтую кровать и сломай чужие</div>
    <div class="hud-top">
      <div class="pill resources" id="res"></div>
      <div class="pill" id="beds"></div>
    </div>
    <div class="mission" id="mission">Шаг 1 — купи стену в магазине</div>
    <div class="toast" id="toast"></div>
    <div class="shop-float" id="shop">
      <h3>Магазин — нажми товар</h3>
      <div class="hint" id="shopHint">Железо копят сами. Нажми кнопку — купится.</div>
      <div class="shop-grid" id="shopGrid"></div>
    </div>
    <div class="controls">
      <span><b>W A S D</b> — ходить</span>
      <span><b>Пробел</b> — удар (1-4 способности слева)</span>
      <span class="you-tag">Ты = жёлтый</span>
    </div>
    <div class="abil" id="abil"></div>
    <button type="button" id="btnShopToggle" class="shop-toggle">Открыть магазин</button>
  </div>
  <div class="overlay" id="start">
    <h1>Bed Wars</h1>
    <p class="lead">Ты жёлтый. С тобой 2 союзника. Враги — синие, красные, зелёные.</p>
    <ol class="howto">
      <li><b>Ходи</b> клавишами W A S D</li>
      <li><b>Купи</b> стену в магазине (кнопка внизу)</li>
      <li><b>Иди на центр</b> за алмазами, потом ломай чужие кровати</li>
    </ol>
    <p class="win-line">Победа = сломать все чужие кровати. Проигрыш = сломали твою.</p>
    <button type="button" id="btnPlay">Понятно, играть</button>
  </div>
  <div class="overlay hidden" id="end">
    <h1 id="endTitle">Победа</h1>
    <p id="endText"></p>
    <button type="button" id="btnAgain">Ещё раз</button>
  </div>
`;

const canvas = document.getElementById("game");
const toastEl = document.getElementById("toast");
const shopEl = document.getElementById("shop");
const shopGrid = document.getElementById("shopGrid");
const abilEl = document.getElementById("abil");

let toastT = 0;
function toast(m) {
  toastEl.textContent = m;
  toastEl.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove("show"), 2000);
}

const keys = Object.create(null);
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 90, 160);

const viewH = 13;
const camera = new THREE.OrthographicCamera(
  -viewH * (innerWidth / innerHeight),
  viewH * (innerWidth / innerHeight),
  viewH,
  -viewH,
  0.1,
  300
);
window.addEventListener("resize", () => {
  const a = innerWidth / innerHeight;
  camera.left = -viewH * a;
  camera.right = viewH * a;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff, 1.15));
const sun = new THREE.DirectionalLight(0xfff6e0, 0.95);
sun.position.set(15, 40, 10);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbfe9ff, 0.45);
fill.position.set(-20, 30, -15);
scene.add(fill);

function mat(tex, color = 0xffffff) {
  return new THREE.MeshLambertMaterial({ map: tex, color });
}

function box(w, h, d, material, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function label(text, color) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.6)";
  ctx.fillRect(12, 12, 232, 40);
  ctx.font = "bold 26px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.scale.set(5.5, 1.4, 1);
  return s;
}

// вода
{
  const w = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), mat(TEX.water));
  w.rotation.x = -Math.PI / 2;
  w.position.y = -1.5;
  scene.add(w);
}

function makeGuy(teamColor, skinIdx = 0, nametag = "") {
  const g = new THREE.Group();
  const skin = SKINS[Math.min(skinIdx, SKINS.length - 1)];
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.1, 0.5),
    new THREE.MeshLambertMaterial({ color: skinIdx ? skin.body : teamColor })
  );
  body.position.y = 0.95;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.MeshLambertMaterial({ color: 0xffe082 })
  );
  head.position.y = 1.85;
  g.add(head);
  const helm = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.35, 0.78),
    new THREE.MeshLambertMaterial({ color: teamColor })
  );
  helm.position.y = 2.15;
  g.add(helm);
  if (nametag) {
    const tag = label(nametag, "#ffffff");
    tag.position.y = 3.1;
    tag.scale.set(4.2, 1.1, 1);
    g.add(tag);
  }
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.2, 0.55),
    new THREE.MeshLambertMaterial({ color: skin.accent })
  );
  stripe.position.y = 1.3;
  g.add(stripe);
  // кирка в руке
  const pick = new THREE.Group();
  pick.position.set(0.55, 1.1, 0);
  const stick = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.9, 0.12),
    new THREE.MeshLambertMaterial({ color: 0x6b3f1a })
  );
  stick.rotation.z = 0.5;
  pick.add(stick);
  const headP = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.2, 0.2),
    new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
  );
  headP.position.set(0.25, 0.35, 0);
  pick.add(headP);
  g.add(pick);
  g.userData = { body, stripe, helm, pick };
  scene.add(g);
  return g;
}

function applySkin(mesh, skinIdx, teamColor) {
  const s = SKINS[skinIdx] || SKINS[0];
  mesh.userData.body.material.color.setHex(skinIdx ? s.body : teamColor);
  mesh.userData.stripe.material.color.setHex(s.accent);
}

function makeIsland(team) {
  const root = new THREE.Group();
  root.position.set(team.x, 0, team.z);
  scene.add(root);

  const len = Math.hypot(team.x, team.z) || 1;
  const toMidX = -team.x / len;
  const toMidZ = -team.z / len;

  box(ISLAND * 2, 1.2, ISLAND * 2, mat(TEX.dirt), 0, 0, 0, root);
  box(ISLAND * 2 - 0.4, 0.35, ISLAND * 2 - 0.4, mat(TEX.grass), 0, 0.7, 0, root);
  box(ISLAND * 2 + 0.5, 0.3, ISLAND * 2 + 0.5, new THREE.MeshLambertMaterial({ color: team.color }), 0, 0.45, 0, root);

  // ДОМ сзади (дальше от центра), выход к мосту свободен
  const back = 5.5;
  const house = new THREE.Group();
  house.position.set(-toMidX * back, 0, -toMidZ * back);
  root.add(house);
  const W = mat(TEX.wood);
  const S = mat(TEX.stone);
  box(7, 0.3, 6, mat(TEX.wool), 0, 0.9, 0, house);
  box(7, 3.2, 0.4, W, 0, 2.5, -2.8, house);
  box(0.4, 3.2, 6, W, -3.3, 2.5, 0, house);
  box(0.4, 3.2, 6, W, 3.3, 2.5, 0, house);
  box(2.2, 3.2, 0.4, W, -2.4, 2.5, 2.8, house);
  box(2.2, 3.2, 0.4, W, 2.4, 2.5, 2.8, house);
  box(7.6, 0.35, 6.6, mat(TEX.roof), 0, 4.3, 0, house);

  const bed = new THREE.Group();
  bed.position.set(-toMidX * back, 1.1, -toMidZ * back);
  box(2.2, 0.35, 3.0, mat(TEX.wool), 0, 0.2, 0, bed);
  box(2.0, 0.4, 2.3, new THREE.MeshLambertMaterial({ color: team.color }), 0, 0.5, -0.1, bed);
  root.add(bed);

  // стена между домом и выходом к мосту
  const wall = box(8.5, 2.6, 0.7, S, -toMidX * 2.2, 2.0, -toMidZ * 2.2, root);
  wall.lookAt(toMidX, 2, toMidZ);
  const wallTag = label("СТЕНА", "#e2e8f0");
  wallTag.position.set(-toMidX * 2.2, 4.0, -toMidZ * 2.2);
  root.add(wallTag);

  const side = new THREE.Vector3(-toMidZ, 0, toMidX);
  const bowL = makeBow(-toMidX * 2.2 + side.x * 3.5, 1.7, -toMidZ * 2.2 + side.z * 3.5);
  const bowR = makeBow(-toMidX * 2.2 - side.x * 3.5, 1.7, -toMidZ * 2.2 - side.z * 3.5);
  root.add(bowL, bowR);

  // магазин у выхода к мосту — рядом со спавном
  const seller = makeGuy(0x78716c, 0);
  const shopLocal = new THREE.Vector3(toMidX * 4.5, 0, toMidZ * 4.5);
  seller.position.copy(shopLocal);
  seller.position.y = 1.05;
  root.add(seller);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 3.0, 36),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(shopLocal);
  ring.position.y = 0.85;
  root.add(ring);
  const shopTag = label("МАГАЗИН", "#fde68a");
  shopTag.position.set(shopLocal.x, 3.4, shopLocal.z);
  root.add(shopTag);

  const houseTag = label("ДОМ · КРОВАТЬ", team.hex);
  houseTag.position.set(-toMidX * back, 5.5, -toMidZ * back);
  root.add(houseTag);

  // спавн у выхода к мосту — сразу можно уйти
  const spawnLocal = new THREE.Vector3(toMidX * 6, 1.05, toMidZ * 6);

  return {
    team: team.id,
    root,
    bed,
    bedAlive: true,
    bedHp: 150,
    wall,
    wallTag,
    wallLv: 1,
    wallHp: 140,
    wallMax: 140,
    wallBroken: false,
    bows: [
      { mesh: bowL, lv: 1, cd: 0 },
      { mesh: bowR, lv: 1, cd: 0 }
    ],
    seller,
    shopPos: new THREE.Vector3(team.x + shopLocal.x, 0, team.z + shopLocal.z),
    spawn: new THREE.Vector3(team.x + spawnLocal.x, 1.05, team.z + spawnLocal.z),
    bedWorld: new THREE.Vector3(team.x - toMidX * back, 1, team.z - toMidZ * back)
  };
}

function makeBow(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  box(0.15, 1.4, 0.15, mat(TEX.wood), 0, 0, 0, g);
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.07, 6, 12, Math.PI),
    new THREE.MeshLambertMaterial({ color: 0xd6d3d1 })
  );
  arc.rotation.y = Math.PI / 2;
  arc.position.y = 0.3;
  g.add(arc);
  return g;
}

// широкие мосты к центру (визуал = той же полосе, где можно ходить)
for (const t of TEAMS) {
  const len = Math.hypot(t.x, t.z) || 1;
  const ex = t.x + (-t.x / len) * (ISLAND - 0.5);
  const ez = t.z + (-t.z / len) * (ISLAND - 0.5);
  const bx = (t.x / len) * 7;
  const bz = (t.z / len) * 7;
  const mx = (ex + bx) / 2;
  const mz = (ez + bz) / 2;
  const dist = Math.hypot(bx - ex, bz - ez);
  const bridge = box(BRIDGE_HALF * 2, 0.45, Math.max(4, dist), mat(TEX.stone), mx, 0.28, mz);
  bridge.lookAt(bx, 0.28, bz);
}

// центр — большой
box(16, 1.1, 16, mat(TEX.stone), 0, 0, 0);
box(14.5, 0.3, 14.5, mat(TEX.grass), 0, 0.65, 0);
const midTag = label("АЛМАЗЫ", "#67e8f9");
midTag.position.set(0, 3.5, 0);
scene.add(midTag);

const midGems = [];
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  const r = 3.2;
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 0),
    new THREE.MeshLambertMaterial({ color: 0x67e8f9, emissive: 0x0e7490, emissiveIntensity: 0.45 })
  );
  mesh.position.set(Math.cos(a) * r, 1.5, Math.sin(a) * r);
  scene.add(mesh);
  midGems.push({ mesh, alive: true, hp: 35, maxHp: 35, recharge: 0 });
}

const midCoins = [];
function spawnCoin(x, z) {
  if (!onGround(x, z)) {
    x = 0;
    z = 0;
  }
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.12, 12),
    new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
  );
  m.rotation.x = Math.PI / 2;
  m.position.set(x, 0.95, z);
  scene.add(m);
  midCoins.push({ mesh: m, alive: true });
}
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  spawnCoin(Math.cos(a) * 1.5, Math.sin(a) * 1.5);
}

const islands = TEAMS.map(makeIsland);
let state = null;
const pops = [];

function popBurst(x, y, z, color = 0xfbbf24) {
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      new THREE.MeshBasicMaterial({ color })
    );
    m.position.set(x, y, z);
    m.userData.vx = (Math.random() - 0.5) * 10;
    m.userData.vy = 2 + Math.random() * 5;
    m.userData.vz = (Math.random() - 0.5) * 10;
    m.userData.life = 0.45 + Math.random() * 0.25;
    scene.add(m);
    pops.push(m);
  }
}

function updatePops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const m = pops[i];
    m.userData.life -= dt;
    m.position.x += m.userData.vx * dt;
    m.position.y += m.userData.vy * dt;
    m.position.z += m.userData.vz * dt;
    m.userData.vy -= 18 * dt;
    m.scale.setScalar(Math.max(0.05, m.userData.life * 2));
    if (m.userData.life <= 0) {
      scene.remove(m);
      pops.splice(i, 1);
    }
  }
}

function shopPrice(id) {
  const map = {
    wall: ["iron", COST.wall[state.wallLv + 1]],
    bow: ["coins", COST.bow[state.bowLv + 1]],
    helmet: ["iron", COST.helmet[state.helmet + 1]],
    pickaxe: ["iron", COST.pickaxe[state.pickaxe + 1]],
    sword: ["gold", COST.sword[state.sword + 1]],
    magic: ["diamonds", COST.magic[state.magic + 1]],
    skin: ["coins", COST.skin[state.skin + 1]]
  };
  return map[id] || null;
}

function canAfford(id) {
  const p = shopPrice(id);
  if (!p) return false;
  const [cur, price] = p;
  if (price == null) return false;
  return Math.floor(state[cur]) >= price;
}

function reset() {
  if (state?.bots) for (const b of state.bots) scene.remove(b.mesh);
  if (state?.player?.mesh) scene.remove(state.player.mesh);

  for (const g of midGems) {
    g.alive = true;
    g.hp = g.maxHp;
    g.recharge = 0;
    g.mesh.visible = true;
    g.mesh.scale.setScalar(1);
  }
  for (const isl of islands) {
    isl.bedAlive = true;
    isl.bedHp = 150;
    isl.bed.visible = true;
    isl.wallBroken = false;
    isl.wallLv = 1;
    isl.wallMax = 140;
    isl.wallHp = 140;
    isl.wall.visible = true;
    isl.wallTag.visible = true;
    isl.wall.scale.set(1, 1, 1);
    isl.bows.forEach((b) => { b.lv = 1; b.cd = 0; });
  }

  const my = islands.find((i) => i.team === ME);
  const playerMesh = makeGuy(0xfacc15, 0, "ТЫ");
  playerMesh.position.copy(my.spawn);

  for (const isl of islands) {
    isl.seller.position.set(isl.shopPos.x, 0.7, isl.shopPos.z);
  }

  const bots = [];
  function addBot(teamId, offsetX = 0, nametag = "") {
    const isl = islands.find((i) => i.team === teamId);
    const col = TEAMS.find((t) => t.id === teamId).color;
    const mesh = makeGuy(col, 0, nametag);
    mesh.position.copy(isl.spawn);
    mesh.position.x += offsetX;
    bots.push({
      team: teamId,
      ally: teamId === ME,
      mesh,
      hp: 100,
      maxHp: 100,
      alive: true,
      respawn: 0,
      atkCd: 0,
      ai: Math.random() * 4,
      helmet: 0,
      pickaxe: 1,
      sword: 1,
      magic: 0,
      skin: 0,
      iron: 30,
      gold: 8,
      coins: 15,
      diamonds: 0
    });
  }
  addBot(ME, -2.2, "СОЮЗНИК");
  addBot(ME, 2.2, "СОЮЗНИК");
  for (const isl of islands) {
    if (isl.team === ME) continue;
    const name = TEAMS.find((t) => t.id === isl.team).name;
    addBot(isl.team, -1.5, name);
    addBot(isl.team, 1.5, name);
  }

  state = {
    running: true,
    t: 0,
    iron: isOwner() ? 999999 : 45,
    gold: isOwner() ? 999999 : 12,
    coins: isOwner() ? 999999 : 28,
    diamonds: isOwner() ? 99999 : 0,
    helmet: 0,
    pickaxe: 1,
    sword: 1,
    magic: 0,
    skin: 0,
    wallLv: 1,
    bowLv: 1,
    player: { mesh: playerMesh, hp: 100, maxHp: 100, alive: true, respawn: 0, atkCd: 0 },
    bots,
    bullets: [],
    ability: { storm: 0, shield: 0, haste: 0, rage: 0 },
    cd: { storm: 0, shield: 0, haste: 0, rage: 0 },
    inShop: false,
    shopOpen: true,
    shopStamp: "",
    won: null,
    cam: my.spawn.clone()
  };
  shopEl.classList.add("open");
  syncWall();
  buildAbil();
  refreshShop(true);
  updateHud();
  toast(isOwner() ? "Хозяин: ×1000 сила, без перезарядки, алмазы быстро" : "Старт: копи железо, покупай стену.");
}

function syncWall() {
  const isl = islands.find((i) => i.team === ME);
  isl.wallLv = state.wallLv;
  isl.wallMax = 120 + state.wallLv * 55;
  if (!isl.wallBroken) isl.wallHp = Math.min(isl.wallMax, Math.max(isl.wallHp, isl.wallMax * 0.5));
  const h = 1 + (state.wallLv - 1) * 0.22;
  isl.wall.scale.set(1, h, 1);
  isl.wall.position.y = 1.3 * h + 0.5;
  isl.bows.forEach((b) => { b.lv = state.bowLv; });
}

function playerMaxHp() { return 100 + state.helmet * 40 + state.magic * 10; }
function throneMult() {
  if (isOwner()) return Math.max(1000, Number(window.__AMAL_POWER_MULT__ || 1000));
  if (!window.__AMAL_ABSOLUTE__) return 1;
  const m = Number(window.__AMAL_POWER_MULT__ || 1);
  return m > 1 ? m : 1;
}
function playerSpeed() {
  const base = 11 + state.skin * 0.7 + (state.ability.rage > 0 ? 3 : 0);
  const boost = isOwner() ? 2.5 : (state.ability.haste > 0 ? 1.25 : 1);
  return base * boost;
}
function swordDmg() {
  let d = 18 + state.sword * 16 + state.magic * 6 + (state.ability.rage > 0 ? 20 : 0);
  if (keys.KeySpace) d *= 1.5;
  return d * throneMult();
}
function pickSpeed() {
  const base = 18 + state.pickaxe * 16 + (state.ability.haste > 0 ? 40 : 0);
  return base * (isOwner() ? 50 : throneMult());
}

const ABIL = {
  shield: { cd: 14, dur: 5, label: "🛡 Щит", hint: "Меньше урона" },
  haste: { cd: 12, dur: 5, label: "⛏ Рывок", hint: "Быстрее бег и копка" },
  rage: { cd: 16, dur: 5, label: "⚔ Ярость", hint: "Сильнее удар" },
  storm: { cd: 18, dur: 5, label: "💥 Волна", hint: "Бьёт врагов вокруг" }
};

function abilityCd(id) {
  return isOwner() ? 0 : ABIL[id].cd;
}

function useAbility(id) {
  if (!state?.running || !state.player.alive) return;
  if (!isOwner() && state.cd[id] > 0) {
    toast(`Подожди ${Math.ceil(state.cd[id])} сек`);
    return;
  }
  const def = ABIL[id];
  state.cd[id] = abilityCd(id);
  state.ability[id] = def.dur;
  toast(isOwner() ? `${def.hint} ×${throneMult()}` : def.hint);
  if (id === "storm") {
    popBurst(state.player.mesh.position.x, 1.5, state.player.mesh.position.z, 0xa78bfa);
    const dmg = 35 * throneMult();
    for (const b of state.bots) {
      if (!b.alive || b.ally || b.team === ME) continue;
      if (state.player.mesh.position.distanceTo(b.mesh.position) < 8) {
        b.hp -= dmg;
        popBurst(b.mesh.position.x, 1.2, b.mesh.position.z, 0xf87171);
        if (b.hp <= 0) killBot(b);
      }
    }
  }
  refreshAbilButtons();
}

function buildAbil() {
  abilEl.innerHTML = "";
  for (const id of Object.keys(ABIL)) {
    const def = ABIL[id];
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.ab = id;
    b.title = def.hint + (isOwner() ? " · без перезарядки ×1000" : "");
    b.textContent = def.label;
    b.onclick = () => useAbility(id);
    abilEl.appendChild(b);
  }
}

function refreshAbilButtons() {
  if (!abilEl) return;
  abilEl.querySelectorAll("[data-ab]").forEach((b) => {
    const id = b.dataset.ab;
    const cd = isOwner() ? 0 : (state?.cd?.[id] || 0);
    const active = state?.ability?.[id] > 0;
    b.disabled = !isOwner() && cd > 0;
    b.textContent = !isOwner() && cd > 0 ? `${ABIL[id].label.split(" ")[0]} ${Math.ceil(cd)}с` : ABIL[id].label;
    b.style.opacity = active ? "1" : cd > 0 ? "0.45" : "1";
    b.style.boxShadow = active ? "0 0 14px rgba(251,191,36,.85)" : "";
  });
}

function refreshShop(force = false) {
  if (!state) return;
  const stamp = [
    state.wallLv, state.bowLv, state.helmet, state.pickaxe, state.sword, state.magic, state.skin,
    Math.floor(state.iron), Math.floor(state.gold), Math.floor(state.coins), Math.floor(state.diamonds)
  ].join("|");
  if (!force && stamp === state.shopStamp) return;
  state.shopStamp = stamp;

  const curN = { iron: "🔩", gold: "🥇", coins: "🪙", diamonds: "💎" };
  const items = [
    ["wall", `Стена уровня ${state.wallLv + 1}`, COST.wall[state.wallLv + 1], "iron", state.wallLv < 4],
    ["bow", `Луки уровня ${state.bowLv + 1}`, COST.bow[state.bowLv + 1], "coins", state.bowLv < 3],
    ["helmet", `Шлем (+жизнь)`, COST.helmet[state.helmet + 1], "iron", state.helmet < 4],
    ["pickaxe", `Кирка (быстрее алмазы)`, COST.pickaxe[state.pickaxe + 1], "iron", state.pickaxe < 4],
    ["sword", `Меч (сильнее удар)`, COST.sword[state.sword + 1], "gold", state.sword < 3],
    ["magic", `Магия`, COST.magic[state.magic + 1], "diamonds", state.magic < 3],
    ["skin", `Скин: ${SKINS[Math.min(state.skin + 1, SKINS.length - 1)].name}`, COST.skin[state.skin + 1], "coins", state.skin < SKINS.length - 1]
  ];
  const curWord = { iron: "железа", gold: "золота", coins: "монет", diamonds: "алмазов" };
  shopGrid.innerHTML = items.map(([id, title, price, cur, ok]) => {
    if (!ok || price == null) return `<button disabled>${title}<small>уже максимум</small></button>`;
    const can = canAfford(id);
    return `<button type="button" class="${can ? "hot" : "broke"}" data-buy="${id}" data-price="${price}" data-cur="${cur}" ${can ? "" : "disabled"}>${title}<small>${can ? "КУПИТЬ" : "не хватает"} · ${price} ${curWord[cur]} ${curN[cur]}</small></button>`;
  }).join("");
  shopGrid.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      buy(btn.dataset.buy);
    };
  });
}

function pay(cur, n) {
  const have = Math.floor(state[cur]);
  if (have < n) {
    toast(`Не хватает: нужно ${n}, есть ${have}`);
    return false;
  }
  state[cur] -= n;
  return true;
}

function buy(id) {
  if (!state.shopOpen && !state.inShop) {
    toast("Открой магазин внизу");
    return;
  }
  if (!canAfford(id)) {
    const p = shopPrice(id);
    if (p) toast(`Не хватает ресурсов (${p[1]})`);
    else toast("Уже максимум");
    refreshShop(true);
    return;
  }
  let ok = false;
  if (id === "wall" && state.wallLv < 4 && pay("iron", COST.wall[state.wallLv + 1])) {
    state.wallLv++;
    const isl = islands.find((i) => i.team === ME);
    isl.wallBroken = false;
    isl.wall.visible = true;
    isl.wallTag.visible = true;
    syncWall();
    isl.wallHp = isl.wallMax;
    toast("Стена сильнее");
    ok = true;
  } else if (id === "bow" && state.bowLv < 3 && pay("coins", COST.bow[state.bowLv + 1])) {
    state.bowLv++; syncWall(); toast("Луки лучше"); ok = true;
  } else if (id === "helmet" && state.helmet < 4 && pay("iron", COST.helmet[state.helmet + 1])) {
    state.helmet++; state.player.maxHp = playerMaxHp(); state.player.hp += 40; toast("+HP"); ok = true;
  } else if (id === "pickaxe" && state.pickaxe < 4 && pay("iron", COST.pickaxe[state.pickaxe + 1])) {
    state.pickaxe++; toast("Кирка быстрее"); ok = true;
  } else if (id === "sword" && state.sword < 3 && pay("gold", COST.sword[state.sword + 1])) {
    state.sword++; toast("Меч сильнее"); ok = true;
  } else if (id === "magic" && state.magic < 3 && pay("diamonds", COST.magic[state.magic + 1])) {
    state.magic++; state.player.maxHp = playerMaxHp(); toast("Магия"); ok = true;
  } else if (id === "skin" && state.skin < SKINS.length - 1 && pay("coins", COST.skin[state.skin + 1])) {
    state.skin++; applySkin(state.player.mesh, state.skin, 0xfacc15); toast(SKINS[state.skin].name); ok = true;
  }
  if (ok) {
    state.shopStamp = "";
    refreshShop(true);
    updateHud();
  }
}

function missionText() {
  const my = islands.find((i) => i.team === ME);
  if (!my.bedAlive) return "Кровать разбита — без респауна. Держись!";
  if (state.wallLv < 2) return "Шаг 1: открой магазин внизу → купи «Стена»";
  if (state.pickaxe < 2 && state.t < 90) return "Шаг 2: иди по мосту в центр (АЛМАЗЫ) и копи";
  const left = islands.filter((i) => i.team !== ME && i.bedAlive).length;
  if (left > 0) return `Шаг 3: сломай чужие кровати (осталось ${left})`;
  return "Все кровати врагов разбиты!";
}

function updateHud() {
  document.getElementById("res").innerHTML =
    `Железо <b>${Math.floor(state.iron)}</b> · Монеты <b>${Math.floor(state.coins)}</b> · Золото <b>${Math.floor(state.gold)}</b> · Алмазы <b>${Math.floor(state.diamonds)}</b>`;
  document.getElementById("beds").innerHTML = islands.map((i) => {
    const t = TEAMS.find((x) => x.id === i.team);
    const you = i.team === ME ? " (ты)" : "";
    return `<span style="color:${t.hex}">${t.name}${you}${i.bedAlive ? " 🛏" : " ✖"}</span>`;
  }).join(" · ");
  document.getElementById("mission").textContent = missionText();
  const btn = document.getElementById("btnShopToggle");
  if (btn) btn.textContent = state.shopOpen ? "Закрыть магазин" : "Открыть магазин";
}

function hurtPlayer(n) {
  if (!state.player.alive) return;
  if (window.__AMAL_UNTOUCHABLE__ || isOwner()) n = 0;
  if (state.ability.shield > 0) n *= 0.35;
  state.player.hp -= n;
  if (state.player.hp <= 0) {
    state.player.alive = false;
    state.player.mesh.visible = false;
    const isl = islands.find((i) => i.team === ME);
    if (isl.bedAlive) {
      state.player.respawn = 3;
      toast("Респаун 3 сек у кровати");
    } else {
      state.won = "lose";
      endGame();
    }
  }
}

function killBot(bot) {
  bot.alive = false;
  bot.mesh.visible = false;
  const isl = islands.find((i) => i.team === bot.team);
  bot.respawn = isl.bedAlive ? 3 : 0;
  state.coins += 3;
}

function endGame() {
  state.running = false;
  document.getElementById("end").classList.remove("hidden");
  document.getElementById("endTitle").textContent = state.won === "win" ? "Победа!" : "Поражение";
  document.getElementById("endText").textContent =
    state.won === "win" ? "Чужие кровати разбиты." : "Кровать уничтожена — респауна нет.";
}

/** Стена: урон; если не добили — чинится со временем */
function damageWall(isl, amount) {
  if (isl.wallBroken) return true; // already open
  isl.wallHp -= amount;
  if (isl.wallHp <= 0) {
    isl.wallHp = 0;
    isl.wallBroken = true;
    isl.wall.visible = false;
    isl.wallTag.visible = false;
    toast(`Стена ${TEAMS.find((t) => t.id === isl.team).name} разрушена`);
    return true;
  }
  return false;
}

function repairWalls(dt) {
  for (const isl of islands) {
    if (isl.wallBroken) continue;
    if (isl.wallHp < isl.wallMax) {
      // чинится сама, если не доломали
      isl.wallHp = Math.min(isl.wallMax, isl.wallHp + (8 + isl.wallLv * 3) * dt);
    }
  }
}

function updatePlayer(dt) {
  const p = state.player;
  if (!p.alive) {
    if (p.respawn > 0) {
      p.respawn -= dt;
      if (p.respawn <= 0) {
        const isl = islands.find((i) => i.team === ME);
        if (isl.bedAlive) {
          p.alive = true;
          p.hp = p.maxHp = playerMaxHp();
          p.mesh.visible = true;
          p.mesh.position.copy(isl.spawn);
        }
      }
    }
    return;
  }

  let mx = 0;
  let mz = 0;
  if (keys.KeyW || keys.ArrowUp) mz -= 1;
  if (keys.KeyS || keys.ArrowDown) mz += 1;
  if (keys.KeyA || keys.ArrowLeft) mx -= 1;
  if (keys.KeyD || keys.ArrowRight) mx += 1;
  const L = Math.hypot(mx, mz) || 1;
  const spd = playerSpeed() * dt;
  const next = tryMove(p.mesh.position, (mx / L) * spd, (mz / L) * spd);
  p.mesh.position.x = next.x;
  p.mesh.position.z = next.z;
  if (mx || mz) p.mesh.rotation.y = Math.atan2(mx, mz);
  p.mesh.position.y = 1.05 + Math.abs(Math.sin(state.t * 14)) * (mx || mz ? 0.08 : 0.02);

  state.iron += 2.2 * dt;
  state.coins += 1.4 * dt;
  state.gold += 0.35 * dt;

  // если всё же не на земле — вернуть на базу
  if (!onGround(p.mesh.position.x, p.mesh.position.z)) {
    const isl = islands.find((i) => i.team === ME);
    p.mesh.position.copy(isl.spawn);
    toast("Нельзя ходить по воздуху");
  }

  const my = islands.find((i) => i.team === ME);
  state.inShop = p.mesh.position.distanceTo(my.shopPos) < 4.5;
  if (state.inShop && !state.shopOpen) {
    state.shopOpen = true;
    shopEl.classList.add("open");
    refreshShop(true);
  }
  const hint = document.getElementById("shopHint");
  if (hint) {
    hint.textContent = "Нажми товар — купится сразу, если хватает железа/монет.";
  }

  for (const g of midGems) {
    if (!g.alive) continue;
    if (p.mesh.position.distanceTo(g.mesh.position) < 2.2) {
      g.hp -= pickSpeed() * dt;
      g.mesh.scale.setScalar(0.6 + 0.4 * Math.max(0, g.hp / g.maxHp));
      if (g.hp <= 0) {
        g.alive = false;
        g.mesh.visible = false;
        g.recharge = isOwner() ? 0.3 : 2.2;
        state.diamonds += 1;
        state.coins += 5;
        popBurst(g.mesh.position.x, 1.4, g.mesh.position.z, 0x67e8f9);
        const ox = (Math.random() - 0.5) * 2.5;
        const oz = (Math.random() - 0.5) * 2.5;
        spawnCoin(g.mesh.position.x + ox, g.mesh.position.z + oz);
      }
    }
  }

  for (const c of midCoins) {
    if (!c.alive) continue;
    c.mesh.rotation.z += dt * 2;
    if (p.mesh.position.distanceTo(c.mesh.position) < 1.5) {
      c.alive = false;
      c.mesh.visible = false;
      state.coins += 3;
      popBurst(c.mesh.position.x, 1, c.mesh.position.z, 0xfbbf24);
    }
  }

  p.atkCd = Math.max(0, p.atkCd - dt);
  const wantHit = keys.KeySpace;
  let near = null;
  let nd = wantHit ? 4.2 : 3.2;
  for (const b of state.bots) {
    if (!b.alive || b.ally || b.team === ME) continue;
    const d = p.mesh.position.distanceTo(b.mesh.position);
    if (d < nd) { nd = d; near = b; }
  }
  if (near && p.atkCd <= 0 && (wantHit || nd < 2.8)) {
    p.atkCd = wantHit ? 0.55 : 0.4;
    const dmg = swordDmg();
    near.hp -= dmg;
    popBurst(near.mesh.position.x, 1.2, near.mesh.position.z, 0xf87171);
    if (near.hp <= 0) killBot(near);
    else toast(`−${Math.round(dmg)} HP`);
  }

  for (const isl of islands) {
    if (isl.team === ME || !isl.bedAlive) continue;
    if (p.mesh.position.distanceTo(isl.bedWorld) < 5.5) {
      const open = damageWall(isl, (14 + state.sword * 6) * dt);
      if (open) {
        isl.bedHp -= (20 + state.sword * 10) * dt;
        if (isl.bedHp <= 0) {
          isl.bedAlive = false;
          isl.bed.visible = false;
          toast("Кровать сломана");
          for (const b of state.bots) if (b.team === isl.team && !b.alive) b.respawn = 0;
        }
      }
    }
  }

  if (state.ability.storm > 0) {
    for (const b of state.bots) {
      if (!b.alive || b.ally || b.team === ME) continue;
      if (p.mesh.position.distanceTo(b.mesh.position) < 5.5) {
        b.hp -= 12 * dt;
        if (b.hp <= 0) killBot(b);
      }
    }
  }
}

function botUpgrade(bot) {
  if (bot.helmet < 3 && bot.iron >= COST.helmet[bot.helmet + 1]) {
    bot.iron -= COST.helmet[bot.helmet + 1]; bot.helmet++; bot.maxHp = 100 + bot.helmet * 30; bot.hp = bot.maxHp;
  } else if (bot.pickaxe < 3 && bot.iron >= COST.pickaxe[bot.pickaxe + 1]) {
    bot.iron -= COST.pickaxe[bot.pickaxe + 1]; bot.pickaxe++;
  } else if (bot.sword < 2 && bot.gold >= COST.sword[bot.sword + 1]) {
    bot.gold -= COST.sword[bot.sword + 1]; bot.sword++;
  }
}

function updateBots(dt) {
  const grace = state.t < 45;
  for (const bot of state.bots) {
    if (!bot.alive) {
      if (bot.respawn > 0) {
        bot.respawn -= dt;
        if (bot.respawn <= 0) {
          const isl = islands.find((i) => i.team === bot.team);
          if (isl.bedAlive) {
            bot.alive = true; bot.hp = bot.maxHp; bot.mesh.visible = true;
            bot.mesh.position.copy(isl.spawn);
          }
        }
      }
      continue;
    }
    bot.iron += 1.4 * dt; bot.coins += 1.1 * dt; bot.gold += 0.3 * dt;
    botUpgrade(bot);
    bot.atkCd = Math.max(0, bot.atkCd - dt);
    bot.ai += dt;

    const p = state.player;
    const home = islands.find((i) => i.team === bot.team);
    const myIsl = islands.find((i) => i.team === ME);
    const phase = bot.ai % 10;

    let tx = home.spawn.x;
    let tz = home.spawn.z;

    if (bot.ally || bot.team === ME) {
      // Союзники: с тобой, бьют врагов, фармят центр
      let foe = null;
      let best = 28;
      for (const e of state.bots) {
        if (!e.alive || e.ally || e.team === ME) continue;
        const d = bot.mesh.position.distanceTo(e.mesh.position);
        if (d < best) { best = d; foe = e; }
      }
      if (foe) {
        tx = foe.mesh.position.x;
        tz = foe.mesh.position.z;
      } else if (p.alive && bot.mesh.position.distanceTo(p.mesh.position) > 8) {
        tx = p.mesh.position.x;
        tz = p.mesh.position.z;
      } else {
        tx = 0;
        tz = 0;
      }
      // атака врагов
      if (foe && best < 2.5 && bot.atkCd <= 0) {
        bot.atkCd = 0.7;
        foe.hp -= 14 + bot.sword * 3;
        if (foe.hp <= 0) killBot(foe);
      }
    } else {
      const distToPlayer = p.alive ? bot.mesh.position.distanceTo(p.mesh.position) : 999;
      if (grace) {
        if (phase < 5) { tx = 0; tz = 0; }
        else { tx = home.spawn.x; tz = home.spawn.z; }
      } else if (distToPlayer < 14) {
        tx = p.mesh.position.x;
        tz = p.mesh.position.z;
      } else if (phase < 4) {
        tx = 0; tz = 0;
      } else if (phase < 7) {
        tx = myIsl.bedWorld.x;
        tz = myIsl.bedWorld.z;
      } else if (p.alive) {
        tx = p.mesh.position.x;
        tz = p.mesh.position.z;
      }

      if (p.alive && distToPlayer < 2.4 && bot.atkCd <= 0) {
        bot.atkCd = 0.85;
        hurtPlayer(grace ? 6 : 9 + bot.sword * 2);
      }
      if (!grace && bot.mesh.position.distanceTo(myIsl.bedWorld) < 5) {
        const open = damageWall(myIsl, 6 * dt);
        if (open && myIsl.bedAlive) {
          myIsl.bedHp -= 7 * dt;
          if (myIsl.bedHp <= 0) {
            myIsl.bedAlive = false;
            myIsl.bed.visible = false;
            toast("Кровать сломали!");
          }
        }
      }
    }

    const dx = tx - bot.mesh.position.x;
    const dz = tz - bot.mesh.position.z;
    const L = Math.hypot(dx, dz) || 1;
    const spd = (grace ? 7.2 : 8.5) * dt;
    const next = tryMove(bot.mesh.position, (dx / L) * spd, (dz / L) * spd);
    bot.mesh.position.x = next.x;
    bot.mesh.position.z = next.z;
    bot.mesh.position.y = 1.05;
    bot.mesh.rotation.y = Math.atan2(dx, dz);

    for (const g of midGems) {
      if (g.alive && bot.mesh.position.distanceTo(g.mesh.position) < 2) {
        g.hp -= (6 + bot.pickaxe * 4) * dt;
        if (g.hp <= 0) {
          g.alive = false; g.mesh.visible = false; g.recharge = isOwner() ? 0.3 : 2.2;
          bot.diamonds++; bot.coins += 4;
        }
      }
    }
  }
}

function updateBows(dt) {
  if (state.t < 45) return; // луки молчат в начале
  for (const isl of islands) {
    if (!isl.bedAlive) continue;
    let home = false;
    if (isl.team === ME && state.player.alive && state.player.mesh.position.distanceTo(isl.spawn) < 11) home = true;
    for (const b of state.bots) if (b.team === isl.team && b.alive && b.mesh.position.distanceTo(isl.spawn) < 11) home = true;
    if (home) continue;
    for (const bow of isl.bows) {
      bow.cd -= dt;
      if (bow.cd > 0) continue;
      const origin = bow.mesh.getWorldPosition(new THREE.Vector3());
      let target = null;
      let best = 12; // ближе — не снайпят через всю карту
      if (isl.team !== ME && state.player.alive) {
        const d = origin.distanceTo(state.player.mesh.position);
        if (d < best) { best = d; target = { pos: state.player.mesh.position.clone(), player: true }; }
      }
      for (const b of state.bots) {
        if (!b.alive || b.team === isl.team) continue;
        const d = origin.distanceTo(b.mesh.position);
        if (d < best) { best = d; target = { pos: b.mesh.position.clone(), bot: b }; }
      }
      if (!target) continue;
      bow.cd = 1.8 - bow.lv * 0.15;
      const dir = target.pos.clone().sub(origin).setY(0).normalize();
      const bolt = box(0.18, 0.18, 0.65, new THREE.MeshLambertMaterial({ color: 0xfef3c7 }), origin.x, origin.y + 0.3, origin.z);
      state.bullets.push({ mesh: bolt, vel: dir.multiplyScalar(20), life: 0.9, dmg: 3 + bow.lv * 2, target });
    }
  }
}

function updateBullets(dt) {
  state.bullets = state.bullets.filter((b) => {
    b.life -= dt;
    b.mesh.position.addScaledVector(b.vel, dt);
    if (b.target.player && state.player.alive && b.mesh.position.distanceTo(state.player.mesh.position) < 1.2) {
      hurtPlayer(b.dmg); b.life = 0;
    }
    if (b.target.bot?.alive && b.mesh.position.distanceTo(b.target.bot.mesh.position) < 1.2) {
      b.target.bot.hp -= b.dmg;
      if (b.target.bot.hp <= 0) killBot(b.target.bot);
      b.life = 0;
    }
    if (b.life > 0) return true;
    scene.remove(b.mesh);
    return false;
  });
}

function updateCamera(dt) {
  if (!state) {
    camera.position.set(0, 26, 20);
    camera.lookAt(0, 0, 0);
    return;
  }
  const target = state.player.alive ? state.player.mesh.position : islands.find((i) => i.team === ME).spawn;
  state.cam.lerp(target, 1 - Math.pow(0.0008, dt));
  // ближе к персонажу — не «космос»
  camera.position.set(state.cam.x, 26, state.cam.z + 20);
  camera.lookAt(state.cam.x, 1, state.cam.z);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (state?.running) {
    state.t += dt;
    for (const k of Object.keys(state.cd)) state.cd[k] = Math.max(0, state.cd[k] - dt);
    for (const k of Object.keys(state.ability)) state.ability[k] = Math.max(0, state.ability[k] - dt);
    updatePlayer(dt);
    updateBots(dt);
    updateBows(dt);
    updateBullets(dt);
    repairWalls(dt);
    updatePops(dt);
    refreshAbilButtons();
    for (const g of midGems) {
      if (g.alive) g.mesh.rotation.y += dt * 1.6;
      else if (g.recharge > 0) {
        g.recharge -= dt;
        if (g.recharge <= 0) {
          g.alive = true; g.hp = g.maxHp; g.mesh.visible = true; g.mesh.scale.setScalar(1);
        }
      }
    }
    if (!islands.some((i) => i.team !== ME && i.bedAlive) &&
        !state.bots.some((b) => !b.ally && b.team !== ME && (b.alive || b.respawn > 0))) {
      state.won = "win";
      endGame();
    }
    refreshShop(false);
    updateHud();
  }
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.getElementById("btnPlay").onclick = () => {
  document.getElementById("start").classList.add("hidden");
  reset();
};
document.getElementById("btnAgain").onclick = () => {
  document.getElementById("end").classList.add("hidden");
  reset();
};

function toggleShop() {
  if (!state) return;
  state.shopOpen = !state.shopOpen;
  shopEl.classList.toggle("open", state.shopOpen);
  if (state.shopOpen) refreshShop(true);
}
document.getElementById("btnShopToggle").onclick = (e) => {
  e.stopPropagation();
  toggleShop();
};
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM" || e.code === "KeyE") toggleShop();
});

window.addEventListener("amal-throne", (ev) => {
  const d = (ev && ev.detail) || {};
  if (!state || !state.running) {
    if (d.law || d.ascend) toast("Трон: начни игру — закон мира сработает в матче");
  }
  if (d.x100 || d.ascend || d.absolute) toast("Трон ×" + (d.mult || window.__AMAL_POWER_MULT__ || 10000));
  if (d.vault && state) {
    state.iron = 999999;
    state.gold = 999999;
    state.coins = 999999;
    state.diamonds = 99999;
    updateHud();
    refreshShop(true);
  }
  if (d.erase || d.ascend || d.absolute) {
    if (state && state.bots) {
      for (const b of state.bots) {
        if (b.ally || b.team === ME) continue;
        if (b.alive) killBot(b);
        b.respawn = 0;
      }
      toast("Угрозы стёрты Троном");
    }
  }
  if (d.law || d.ascend || d.absolute) {
    if (state && state.running) {
      for (const isl of islands) {
        if (isl.team === ME) continue;
        isl.bedAlive = false;
        if (isl.bed) isl.bed.visible = false;
      }
      for (const b of state.bots) {
        if (b.ally || b.team === ME) continue;
        if (b.alive) killBot(b);
        b.respawn = 0;
      }
      state.won = "win";
      endGame();
      toast("Закон мира — победа Трона");
    }
  }
});
