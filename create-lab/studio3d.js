import * as THREE from "three";
import {
  initTextures, TEX_LIST, SOUND_LIST, PIC_LIST, TEX_PREVIEWS,
  makeMaterial, applyMaterialToObject, makeEmojiTexture, buildTexturePreviews,
  playSound, buildExtraPrefabs, setEditModeVisible, toggleSoundRings,
} from "./studio3d-assets.js?v=3";
import {
  loadUnlocks, saveUnlocks, loadCoins, saveCoins, shopPrice,
  buildCatalogPrefabs, buildPicPrefabs, FREE_ITEMS,
} from "./studio3d-catalog.js?v=3";

const STORAGE = "amal-studio-world-v4";
const canvas = document.getElementById("studio-canvas");
const prefabList = document.getElementById("prefab-list");
const explorer = document.getElementById("explorer");
const propsEl = document.getElementById("props");
const statusText = document.getElementById("status-text");
const vpMode = document.getElementById("vp-mode");
const vpHint = document.getElementById("vp-hint");
const toastEl = document.getElementById("toast");
const btnPlay = document.getElementById("btn-play");

let editMode = true;
let toolMode = "select";
let snapOn = true;
let gridVisible = true;
let selectedId = null;
let placementPrefab = null;
let objects = [];
let idCounter = 0;
let playPlayer = null;
let playOrbit = null;
let ghostMesh = null;
const soundState = new Map();
const pickedUp = new Set();

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function uid() {
  idCounter += 1;
  return "obj_" + idCounter + "_" + Math.random().toString(36).slice(2, 6);
}

function snap(v) {
  return snapOn ? Math.round(v) : Math.round(v * 10) / 10;
}

/* ── Prefab definitions ── */
const PREFABS = {
  block: {
    cat: "build", name: "Блок", icon: "🧱",
    create(d) {
      const c = d.color || "#38bdf8";
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(d.sx || 2, d.sy || 2, d.sz || 2),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness: 0.55 })
      );
      return wrap(m, d);
    },
  },
  ball: {
    cat: "build", name: "Шар", icon: "⚽",
    create(d) {
      const s = d.sx || 1.5;
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(s, 16, 16),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color || "#f87171"), roughness: 0.4 })
      );
      return wrap(m, d);
    },
  },
  plate: {
    cat: "build", name: "Плита", icon: "▭",
    create(d) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(d.sx || 8, d.sy || 0.4, d.sz || 8),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color || "#4ade80"), roughness: 0.85 })
      );
      m.position.y = 0.2;
      return wrap(m, d);
    },
  },
  cylinder: {
    cat: "build", name: "Цилиндр", icon: "🛢",
    create(d) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(d.sx || 1.2, d.sx || 1.2, d.sy || 3, 16),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color || "#c084fc"), roughness: 0.5 })
      );
      return wrap(m, d);
    },
  },
  tree: {
    cat: "nature", name: "Дерево", icon: "🌲",
    create(d) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      trunk.position.y = 1.1;
      g.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 3.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x16a34a })
      );
      leaves.position.y = 3.2;
      g.add(leaves);
      return wrap(g, d);
    },
  },
  spawn: {
    cat: "game", name: "Старт игрока", icon: "🏁",
    create(d) {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.15, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.5 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.15;
      g.add(ring);
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 2.5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      pole.position.y = 1.25;
      g.add(pole);
      return wrap(g, Object.assign({}, d, { isSpawn: true }));
    },
  },
  pen: {
    cat: "game", name: "Вольер", icon: "🏠",
    create(d) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.5, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x166534 })
      );
      base.position.y = 0.25;
      g.add(base);
      const fence = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x854d0e })
      );
      fence.position.set(0, 0.65, 1.35);
      g.add(fence);
      return wrap(g, d);
    },
  },
  treadmill: {
    cat: "game", name: "Дорожка", icon: "🏃",
    create(d) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.3, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, emissive: 0x64748b, emissiveIntensity: 0.25 })
      );
      m.position.y = 0.15;
      return wrap(m, Object.assign({}, d, { isTreadmill: true }));
    },
  },
  zone: {
    cat: "game", name: "Зона босса", icon: "⭕",
    create(d) {
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4.2, 0.35, 32),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(d.color || "#ef4444"),
          emissive: new THREE.Color(d.color || "#ef4444"),
          emissiveIntensity: 0.2,
        })
      );
      pad.position.y = 0.18;
      return wrap(pad, d);
    },
  },
  boss: {
    cat: "game", name: "Босс", icon: "👹",
    create(d) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.2, 0.45),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color || "#dc2626") })
      );
      body.position.y = 1.1;
      g.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffcc99 })
      );
      head.position.y = 1.95;
      g.add(head);
      return wrap(g, Object.assign({}, d, { isBoss: true }));
    },
  },
  egg_basic: { cat: "game", name: "Яйцо обыч.", icon: "🥚", create: (d) => makeEgg("egg", d) },
  egg_gold: { cat: "game", name: "Золотое", icon: "✨", create: (d) => makeEgg("gold", d) },
  egg_slime: { cat: "game", name: "Слайм", icon: "🟢", create: (d) => makeEgg("slime", d) },
  egg_crystal: { cat: "game", name: "Кристалл", icon: "💎", create: (d) => makeEgg("crystal", d) },
  egg_dragon: { cat: "game", name: "Дракон", icon: "🐉", create: (d) => makeEgg("dragon", d) },
  egg_void: { cat: "game", name: "Пустота", icon: "🌑", create: (d) => makeEgg("void", d) },
  egg_star: { cat: "game", name: "Звезда", icon: "⭐", create: (d) => makeEgg("star", d) },
  egg_final: { cat: "game", name: "ФИНАЛ", icon: "👑", create: (d) => makeEgg("final", d) },
};

Object.assign(PREFABS, buildExtraPrefabs(wrap, makeEgg));
Object.assign(PREFABS, buildCatalogPrefabs(wrap));
Object.assign(PREFABS, buildPicPrefabs(wrap));
initTextures();
buildTexturePreviews();

let unlocks = loadUnlocks();
Object.keys(PREFABS).forEach((k) => unlocks.add(k));
saveUnlocks(unlocks);

const EGG_STYLES = {
  egg: { color: 0xf8fafc, geo: "sphere", sy: 1.28 },
  gold: { color: 0xfbbf24, geo: "sphere", sy: 1.28, em: 0.4, metal: 0.6 },
  slime: { color: 0x84cc16, geo: "blob" },
  crystal: { color: 0x38bdf8, geo: "octa", em: 0.45 },
  dragon: { color: 0xef4444, geo: "dragon", em: 0.5 },
  void: { color: 0x312e81, geo: "void", em: 0.55 },
  star: { color: 0xfde68a, geo: "dodeca", em: 0.6 },
  final: { color: 0xfde68a, geo: "crown", em: 0.75, metal: 0.6 },
};

function makeEgg(styleKey, d) {
  const st = EGG_STYLES[styleKey] || EGG_STYLES.egg;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: st.color,
    emissive: st.color,
    emissiveIntensity: st.em || 0,
    metalness: st.metal || 0.15,
    roughness: 0.45,
  });
  let core;
  if (st.geo === "sphere") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 18), mat);
    core.scale.y = st.sy || 1;
  } else if (st.geo === "blob") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 12), mat);
    core.scale.set(1.15, 0.85, 1.15);
  } else if (st.geo === "octa") {
    core = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), mat);
  } else if (st.geo === "dodeca") {
    core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mat);
  } else if (st.geo === "dragon") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), mat);
    core.scale.set(1, 1.35, 0.9);
    [[-0.3, 0.55], [0.3, 0.55]].forEach(([x, y]) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 5), mat);
      horn.position.set(x, y, 0);
      g.add(horn);
    });
  } else if (st.geo === "void") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), mat);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.05, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.8 })
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  } else if (st.geo === "crown") {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.52, 18, 18), mat);
    core.scale.y = 1.2;
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.45, 4),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfde68a, emissiveIntensity: 0.9 })
    );
    crown.position.y = 0.75;
    g.add(crown);
  } else {
    core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 14), mat);
  }
  core.position.y = 0.55;
  g.add(core);
  return wrap(g, Object.assign({}, d, { eggStyle: styleKey }));
}

function wrap(meshOrGroup, data) {
  const root = meshOrGroup.isGroup ? meshOrGroup : new THREE.Group();
  if (!meshOrGroup.isGroup) root.add(meshOrGroup);
  root.userData.studio = {
    id: data.id || uid(),
    prefab: data.prefab,
    name: data.name || PREFABS[data.prefab]?.name || "Объект",
    color: data.color || "#38bdf8",
    sx: data.sx != null ? data.sx : 2,
    sy: data.sy != null ? data.sy : 2,
    sz: data.sz != null ? data.sz : 2,
    isSpawn: !!data.isSpawn,
    isBoss: !!data.isBoss,
    isTreadmill: !!data.isTreadmill,
    eggStyle: data.eggStyle || null,
    texture: data.texture || null,
    texRepeat: data.texRepeat != null ? data.texRepeat : 1,
    roughness: data.roughness != null ? data.roughness : 0.65,
    metalness: data.metalness != null ? data.metalness : 0,
    soundId: data.soundId || null,
    soundRadius: data.soundRadius != null ? data.soundRadius : 6,
    soundLoop: !!data.soundLoop,
    soundVolume: data.soundVolume != null ? data.soundVolume : 0.8,
    imageChar: data.imageChar || null,
    signText: data.signText || null,
    isPickup: !!data.isPickup,
    isPortal: !!data.isPortal,
    isLight: !!data.isLight,
    scale: data.scale != null ? data.scale : 1,
  };
  root.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return root;
}

function addObject(prefabKey, x, y, z, extra) {
  const def = PREFABS[prefabKey];
  if (!def) return null;
  const data = Object.assign({ prefab: prefabKey, name: def.name }, extra || {});
  if (prefabKey.startsWith("tex_") && !data.texture) data.texture = prefabKey.slice(4);
  const obj = def.create(data);
  obj.position.set(x, y, z);
  if (extra?.ry != null) obj.rotation.y = extra.ry;
  if (data.texture) applyMaterialToObject(obj, data);
  const sc = data.scale || 1;
  if (sc !== 1) obj.scale.setScalar(sc);
  scene.add(obj);
  objects.push(obj);
  refreshExplorer();
  return obj;
}

/* ── Scene ── */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 60, 180);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
camera.position.set(20, 18, 24);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const sun = new THREE.DirectionalLight(0xfff4e6, 1.1);
sun.position.set(25, 40, 15);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbae6fd, 0x4ade80, 0.3));

const baseplate = new THREE.Mesh(
  new THREE.BoxGeometry(120, 1, 120),
  new THREE.MeshStandardMaterial({ color: 0x5ecf6a, roughness: 0.92 })
);
baseplate.position.y = -0.5;
baseplate.receiveShadow = true;
baseplate.userData.studio = { id: "baseplate", name: "Baseplate", locked: true };
scene.add(baseplate);

const gridHelper = new THREE.GridHelper(120, 60, 0xffffff, 0xffffff);
gridHelper.material.opacity = 0.22;
gridHelper.material.transparent = true;
gridHelper.position.y = 0.01;
scene.add(gridHelper);

const selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x007acc);
selectionBox.visible = false;
scene.add(selectionBox);

let editOrbit = null;

function attachEditOrbit() {
  if (editOrbit) editOrbit.dispose();
  editOrbit = AmalOrbitCam.attach(camera, canvas, {
    distance: 28,
    pitch: 0.55,
    minDist: 4,
    maxDist: 80,
    hint: false,
  });
  editOrbit.follow(0, 0, 0);
}

attachEditOrbit();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let isDragging = false;
let isRotating = false;
let dragStart = null;
let dragObjStart = null;
let rotateStartX = 0;
let rotateStartY = 0;

function getSelectable() {
  return objects;
}

function pickObject(ev) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(getSelectable(), true);
  for (const h of hits) {
    let o = h.object;
    while (o.parent && !o.userData.studio) o = o.parent;
    if (o.userData.studio && !o.userData.studio.locked) return o;
  }
  return null;
}

function pickGround(ev) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([baseplate, ...objects], true);
  return hits[0] || null;
}

function selectObject(obj) {
  selectedId = obj ? obj.userData.studio.id : null;
  if (obj) {
    selectionBox.setFromObject(obj);
    selectionBox.visible = true;
  } else {
    selectionBox.visible = false;
  }
  refreshExplorer();
  refreshProps();
  canvas.classList.toggle("select-mode", toolMode === "select" && !placementPrefab);
}

function getSelected() {
  return objects.find((o) => o.userData.studio.id === selectedId) || null;
}

function refreshExplorer() {
  explorer.innerHTML = "";
  const base = document.createElement("div");
  base.className = "exp-item" + (selectedId === "baseplate" ? " on" : "");
  base.innerHTML = '<span class="ico">🟩</span> Baseplate';
  base.onclick = () => selectObject(null);
  explorer.appendChild(base);

  objects.forEach((o) => {
    const d = o.userData.studio;
    const pf = PREFABS[d.prefab];
    const el = document.createElement("div");
    el.className = "exp-item" + (d.id === selectedId ? " on" : "");
    el.innerHTML = `<span class="ico">${pf?.icon || "📦"}</span> ${d.name}`;
    el.onclick = () => selectObject(o);
    explorer.appendChild(el);
  });
}

function refreshProps() {
  const o = getSelected();
  if (!o) {
    propsEl.innerHTML = '<p class="prop-empty">Выбери объект в сцене или в проводнике</p>';
    return;
  }
  const d = o.userData.studio;
  const pf = PREFABS[d.prefab];
  let extra = "";
  if (d.texture || d.prefab?.startsWith("tex_")) {
    extra += `<div class="prop-row"><label>Текстура</label><select id="p-tex">${TEX_LIST.map((t) =>
      `<option value="${t.id}"${(d.texture || d.prefab?.replace("tex_", "")) === t.id ? " selected" : ""}>${t.icon} ${t.name}</option>`
    ).join("")}</select></div>`;
  }
  if (d.soundId != null || d.prefab === "sound_zone") {
    extra += `<div class="prop-row"><label>Звук</label><select id="p-sound">${SOUND_LIST.map((s) =>
      `<option value="${s.id}"${d.soundId === s.id ? " selected" : ""}>${s.icon} ${s.name}</option>`
    ).join("")}</select></div>
    <div class="prop-row"><label>Радиус звука</label><input id="p-sradius" type="number" step="1" value="${d.soundRadius || 6}" /></div>
    <div class="prop-row"><label><input id="p-sloop" type="checkbox"${d.soundLoop ? " checked" : ""}/> Зациклить</label></div>`;
  }
  if (d.imageChar != null || d.prefab === "picture" || d.prefab === "billboard") {
    extra += `<div class="prop-row"><label>Картинка</label><select id="p-pic">${PIC_LIST.map((p) =>
      `<option value="${p.id}"${d.imageChar === p.id ? " selected" : ""}>${p.id} ${p.name}</option>`
    ).join("")}</select></div>`;
  }
  propsEl.innerHTML = `
    <div class="prop-row"><label>Имя</label><input id="p-name" value="${esc(d.name)}" /></div>
    <div class="prop-row"><label>Тип</label><input readonly value="${pf?.name || d.prefab}" /></div>
    <div class="prop-row"><label>Позиция</label>
      <div class="prop-grid">
        <input id="p-x" type="number" step="0.5" value="${o.position.x.toFixed(1)}" />
        <input id="p-y" type="number" step="0.5" value="${o.position.y.toFixed(1)}" />
        <input id="p-z" type="number" step="0.5" value="${o.position.z.toFixed(1)}" />
      </div>
    </div>
    <div class="prop-row"><label>Поворот Y</label><input id="p-ry" type="number" step="15" value="${(o.rotation.y * 180 / Math.PI).toFixed(0)}" /></div>
    <div class="prop-row"><label>Размер ×</label><input id="p-scale" type="range" min="0.3" max="4" step="0.1" value="${d.scale || 1}" /></div>
    ${d.color !== undefined ? `<div class="prop-row"><label>Цвет</label><input id="p-color" type="color" value="${(d.color && d.color.startsWith("#")) ? d.color : "#38bdf8"}" /></div>` : ""}
    ${d.metalness != null ? `<div class="prop-row"><label>Металл</label><input id="p-metal" type="range" min="0" max="1" step="0.05" value="${d.metalness}" /></div>` : ""}
    ${extra}
    <button type="button" class="prop-del" id="p-del">🗑 Удалить объект</button>
  `;
  document.getElementById("p-name").oninput = (e) => { d.name = e.target.value; refreshExplorer(); };
  ["p-x", "p-y", "p-z"].forEach((id, i) => {
    document.getElementById(id).onchange = (e) => {
      const v = parseFloat(e.target.value) || 0;
      if (i === 0) o.position.x = v;
      else if (i === 1) o.position.y = v;
      else o.position.z = v;
      selectionBox.setFromObject(o);
    };
  });
  document.getElementById("p-ry").onchange = (e) => {
    o.rotation.y = (parseFloat(e.target.value) || 0) * Math.PI / 180;
    selectionBox.setFromObject(o);
  };
  const col = document.getElementById("p-color");
  if (col) col.oninput = (e) => applyColor(o, e.target.value);
  const pt = document.getElementById("p-tex");
  if (pt) pt.onchange = (e) => {
    d.texture = e.target.value;
    applyMaterialToObject(o, d);
  };
  const ps = document.getElementById("p-sound");
  if (ps) ps.onchange = (e) => { d.soundId = e.target.value; playSound(d.soundId, d.soundVolume); };
  const sr = document.getElementById("p-sradius");
  if (sr) sr.onchange = (e) => { d.soundRadius = parseFloat(e.target.value) || 6; };
  const sl = document.getElementById("p-sloop");
  if (sl) sl.onchange = (e) => { d.soundLoop = e.target.checked; };
  const pp = document.getElementById("p-pic");
  if (pp) pp.onchange = (e) => {
    d.imageChar = e.target.value;
    o.traverse((c) => {
      if (c.isMesh && c.material && c.material.map) {
        c.material.map.dispose();
        c.material.map = makeEmojiTexture(d.imageChar, d.prefab === "billboard" ? "#0f172a" : "#1e293b");
        c.material.needsUpdate = true;
      }
    });
  };
  const pm = document.getElementById("p-metal");
  if (pm) pm.oninput = (e) => {
    d.metalness = parseFloat(e.target.value);
    applyMaterialToObject(o, d);
  };
  const psc = document.getElementById("p-scale");
  if (psc) psc.oninput = (e) => {
    const s = parseFloat(e.target.value) || 1;
    d.scale = s;
    o.scale.setScalar(s);
    selectionBox.setFromObject(o);
  };
  document.getElementById("p-del").onclick = () => deleteSelected();
}

function esc(s) {
  return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function applyColor(obj, hex) {
  obj.userData.studio.color = hex;
  obj.traverse((c) => {
    if (c.isMesh && c.material && c.material.color) {
      c.material.color.set(hex);
    }
  });
}

function deleteSelected() {
  const o = getSelected();
  if (!o) return;
  scene.remove(o);
  objects = objects.filter((x) => x !== o);
  selectObject(null);
  toast("Объект удалён");
}

/* ── Toolbox UI + Магазин ── */
let activeCat = "build";

function updateShopUI() {
  const el = document.getElementById("shop-coins");
  if (el) el.textContent = String(studioCoins);
}

function isUnlocked(key) {
  return unlocks.has(key) || shopPrice(key) === 0;
}

function tryBuy(key) {
  unlocks.add(key);
  return true;
}

function buyAllItems() {
  Object.keys(PREFABS).forEach((k) => unlocks.add(k));
  saveUnlocks(unlocks);
  renderToolbox();
  toast("Все предметы доступны — бесплатно!");
}

function thumbHtml(key, pf) {
  if (key.startsWith("tex_") && TEX_PREVIEWS[key.slice(4)]) {
    return `<span class="thumb"><img src="${TEX_PREVIEWS[key.slice(4)]}" alt=""/></span>`;
  }
  if (pf.previewEmoji || (pf.cat === "pic" && pf.icon)) {
    const em = pf.previewEmoji || pf.icon;
    return `<span class="thumb preview-em">${em}</span>`;
  }
  return `<span class="thumb">${pf.icon || "📦"}</span>`;
}

function renderToolbox() {
  prefabList.className = "toolbox-list grid";
  prefabList.innerHTML = "";
  const entries = Object.entries(PREFABS).filter(([, pf]) => pf.cat === activeCat);
  if (!entries.length) {
    prefabList.innerHTML = '<p class="prop-empty" style="padding:8px">Пусто</p>';
    return;
  }
  entries.forEach(([key, pf]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "prefab card" + (placementPrefab === key ? " on" : "");
    btn.innerHTML = thumbHtml(key, pf) + `<span class="pname">${pf.name}</span>`;
    btn.onclick = () => {
      placementPrefab = placementPrefab === key ? null : key;
      toolMode = placementPrefab ? "place" : "select";
      if (pf.cat === "sound" && placementPrefab) playSound("coin", 0.4);
      document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === "select"));
      renderToolbox();
      updateGhost();
      statusText.textContent = placementPrefab
        ? "Клик — поставить «" + pf.name + "» · двигай/крути инструментами"
        : "Выбери предмет слева";
    };
    prefabList.appendChild(btn);
  });
}

document.querySelectorAll(".toolbox-tabs button").forEach((btn) => {
  btn.onclick = () => {
    activeCat = btn.dataset.cat;
    document.querySelectorAll(".toolbox-tabs button").forEach((b) => b.classList.toggle("on", b === btn));
    renderToolbox();
  };
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.onclick = () => {
    toolMode = btn.dataset.mode;
    placementPrefab = null;
    document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b === btn));
    renderToolbox();
    updateGhost();
    canvas.classList.toggle("select-mode", toolMode === "select");
  };
});

document.getElementById("btn-grid").onclick = (e) => {
  gridVisible = !gridVisible;
  gridHelper.visible = gridVisible;
  e.currentTarget.classList.toggle("on", gridVisible);
};

document.getElementById("btn-snap").onclick = (e) => {
  snapOn = !snapOn;
  e.currentTarget.classList.toggle("on", snapOn);
  toast(snapOn ? "Привязка к сетке вкл" : "Привязка выкл");
};
document.getElementById("btn-snap").classList.add("on");
document.getElementById("btn-grid").classList.add("on");

function updateGhost() {
  if (ghostMesh) {
    scene.remove(ghostMesh);
    ghostMesh = null;
  }
  if (!placementPrefab || !editMode) return;
  const def = PREFABS[placementPrefab];
  if (!def) return;
  ghostMesh = def.create({ prefab: placementPrefab, name: def.name });
  ghostMesh.traverse((c) => {
    if (c.isMesh && c.material) {
      c.material = c.material.clone();
      c.material.transparent = true;
      c.material.opacity = 0.45;
    }
  });
  scene.add(ghostMesh);
}

/* ── Pointer ── */
canvas.addEventListener("pointermove", (ev) => {
  if (!editMode) return;
  if (isRotating && toolMode === "rotate") {
    const o = getSelected();
    if (!o) return;
    o.rotation.y += (ev.movementX || 0) * 0.014;
    selectionBox.setFromObject(o);
    refreshProps();
    return;
  }
  if (isDragging && toolMode === "move") {
    const hit = pickGround(ev);
    if (!hit || !dragStart) return;
    const o = getSelected();
    if (!o) return;
    if (ev.shiftKey) {
      o.position.y = snap(Math.max(0, dragObjStart.y - (ev.movementY || 0) * 0.04));
    } else {
      const dx = hit.point.x - dragStart.x;
      const dz = hit.point.z - dragStart.z;
      o.position.x = snap(dragObjStart.x + dx);
      o.position.z = snap(dragObjStart.z + dz);
    }
    selectionBox.setFromObject(o);
    refreshProps();
    return;
  }
  if (ghostMesh && placementPrefab) {
    const hit = pickGround(ev);
    if (hit) {
      ghostMesh.position.set(snap(hit.point.x), snap(hit.point.y), snap(hit.point.z));
      ghostMesh.visible = true;
    } else ghostMesh.visible = false;
  }
});

canvas.addEventListener("pointerdown", (ev) => {
  if (!editMode || ev.button !== 0) return;
  if (placementPrefab) {
    const hit = pickGround(ev);
    if (!hit) return;
    const obj = addObject(placementPrefab, snap(hit.point.x), snap(hit.point.y), snap(hit.point.z));
    if (obj) {
      selectObject(obj);
      toast("Поставлено: " + PREFABS[placementPrefab].name);
    }
    return;
  }
  if (toolMode === "select" || toolMode === "move" || toolMode === "rotate") {
    const obj = pickObject(ev);
    selectObject(obj);
    if (obj && toolMode === "move") {
      const hit = pickGround(ev);
      if (hit) {
        isDragging = true;
        dragStart = { x: hit.point.x, z: hit.point.z };
        dragObjStart = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
      }
    }
    if (obj && toolMode === "rotate") {
      isRotating = true;
    }
    if (obj && toolMode === "scale") {
      toast("Колёсико мыши — больше/меньше");
    }
  }
});

canvas.addEventListener("pointerup", () => {
  isDragging = false;
  isRotating = false;
  dragStart = null;
});

canvas.addEventListener("wheel", (ev) => {
  if (!editMode || toolMode !== "scale") return;
  const o = getSelected();
  if (!o) return;
  ev.preventDefault();
  const d = o.userData.studio;
  d.scale = Math.max(0.3, Math.min(4, (d.scale || 1) - ev.deltaY * 0.002));
  o.scale.setScalar(d.scale);
  selectionBox.setFromObject(o);
  refreshProps();
}, { passive: false });

window.addEventListener("keydown", (e) => {
  if (!editMode) return;
  if (e.code === "Delete" || e.code === "Backspace") {
    if (document.activeElement?.tagName === "INPUT") return;
    e.preventDefault();
    deleteSelected();
  }
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyD") {
    e.preventDefault();
    const o = getSelected();
    if (!o) return;
    const d = o.userData.studio;
    const n = addObject(d.prefab, o.position.x + 2, o.position.y, o.position.z + 2, Object.assign({}, d));
    if (n) selectObject(n);
    toast("Копия!");
  }
});

/* ── Save / Load ── */
function serialize() {
  return {
    v: 2,
    objects: objects.map((o) => {
      const d = o.userData.studio;
      return {
        prefab: d.prefab,
        name: d.name,
        x: o.position.x,
        y: o.position.y,
        z: o.position.z,
        ry: o.rotation.y,
        color: d.color,
        sx: d.sx,
        sy: d.sy,
        sz: d.sz,
        texture: d.texture,
        texRepeat: d.texRepeat,
        roughness: d.roughness,
        metalness: d.metalness,
        soundId: d.soundId,
        soundRadius: d.soundRadius,
        soundLoop: d.soundLoop,
        soundVolume: d.soundVolume,
        imageChar: d.imageChar,
        signText: d.signText,
        scale: d.scale,
      };
    }),
  };
}

function saveWorld() {
  localStorage.setItem(STORAGE, JSON.stringify(serialize()));
  toast("Проект сохранён!");
}

function loadWorld() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) { toast("Нет сохранения"); return; }
    const data = JSON.parse(raw);
    objects.forEach((o) => scene.remove(o));
    objects = [];
    (data.objects || []).forEach((o) => {
      addObject(o.prefab, o.x, o.y, o.z, o);
    });
    selectObject(null);
    toast("Проект загружен");
  } catch (_) {
    toast("Ошибка загрузки");
  }
}

function startEmpty() {
  objects.forEach((o) => scene.remove(o));
  objects = [];
  selectObject(null);
  toast("Пустая карта — ставь предметы сам!");
}

function newWorld() {
  startEmpty();
  try { localStorage.removeItem(STORAGE); } catch (_) {}
  toast("Новый пустой проект");
}

document.getElementById("btn-save").onclick = saveWorld;
document.getElementById("btn-load").onclick = loadWorld;
document.getElementById("btn-new").onclick = newWorld;

/* ── Play mode ── */
function findSpawn() {
  const sp = objects.find((o) => o.userData.studio.isSpawn);
  if (sp) return { x: sp.position.x, z: sp.position.z };
  return { x: 0, z: 0 };
}

function startPlay() {
  editMode = false;
  btnPlay.textContent = "■ Стоп";
  btnPlay.classList.add("stop");
  vpMode.textContent = "ИГРА";
  vpHint.textContent = "WASD — ходить · Пробел — прыжок · ■ Стоп — в редактор";
  selectionBox.visible = false;
  if (ghostMesh) { scene.remove(ghostMesh); ghostMesh = null; }
  if (editOrbit) { editOrbit.dispose(); editOrbit = null; }
  setEditModeVisible(false);
  toggleSoundRings(objects, false);
  soundState.clear();
  pickedUp.clear();

  const sp = findSpawn();
  playPlayer = AmalWalkPlayer.create(scene, THREE, {
    humanoid: true,
    height: 1.75,
    speed: 10,
    x: sp.x,
    z: sp.z + 1,
  });
  playOrbit = AmalOrbitCam.attach(camera, canvas, {
    distance: 14,
    pitch: 0.5,
    minDist: 5,
    maxDist: 30,
    hint: false,
  });
  toast("▶ Игра! Персонаж появился на старте");
}

function stopPlay() {
  editMode = true;
  btnPlay.textContent = "▶ Играть";
  btnPlay.classList.remove("stop");
  vpMode.textContent = "РЕДАКТОР";
  vpHint.textContent = "ПКМ — камера · Клик — поставить · Del — удалить";
  if (playPlayer) {
    scene.remove(playPlayer.mesh);
    playPlayer = null;
  }
  if (playOrbit) {
    playOrbit.dispose();
    playOrbit = null;
  }
  attachEditOrbit();
  setEditModeVisible(true);
  toggleSoundRings(objects, true);
  soundState.clear();
  pickedUp.clear();
  objects.forEach((o) => {
    if (o.userData.studio.isPickup) o.visible = true;
  });
  toast("Редактор — персонажа нет");
}

btnPlay.onclick = () => {
  if (editMode) startPlay();
  else stopPlay();
};

/* ── Demo starter map ── */
function updatePlaySounds(px, pz, dt) {
  objects.forEach((o) => {
    const d = o.userData.studio;
    if (d.isPickup && pickedUp.has(d.id)) return;
    if (d.isPickup && d.pickupType === "coin") {
      o.rotation.y += dt * 2.5;
      const dist = Math.hypot(px - o.position.x, pz - o.position.z);
      if (dist < 1.4) {
        pickedUp.add(d.id);
        o.visible = false;
        playSound("coin", 0.9);
        toast("🪙 +1");
      }
      return;
    }
    if (!d.soundId) return;
    const dist = Math.hypot(px - o.position.x, pz - o.position.z);
    const r = d.soundRadius || 6;
    const inside = dist < r;
    const st = soundState.get(d.id) || { inside: false, t: 0 };
    if (inside && !st.inside) {
      playSound(d.soundId, d.soundVolume);
      st.inside = true;
    }
    if (!inside) st.inside = false;
    if (inside && d.soundLoop) {
      st.t += dt;
      if (st.t > 2.5) {
        st.t = 0;
        playSound(d.soundId, d.soundVolume * 0.6);
      }
    }
    soundState.set(d.id, st);
  });
}

function loadDemo() {
  startEmpty();
}

function exportMap() {
  const blob = new Blob([JSON.stringify(serialize(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-amal-game.json";
  a.click();
  toast("Карта скачана — это твоя игра!");
}

/* ── Loop ── */
function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!editMode && playPlayer) {
    const bounds = { minX: -55, maxX: 55, minZ: -55, maxZ: 55 };
    playPlayer.update(dt, playOrbit.state.yaw, bounds);
    playOrbit.follow(playPlayer.mesh.position);
    updatePlaySounds(playPlayer.mesh.position.x, playPlayer.mesh.position.z, dt);
  }

  objects.forEach((o) => {
    if (o.userData.studio.eggStyle) {
      o.rotation.y += dt * 0.4;
    }
  });

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

renderToolbox();
refreshExplorer();
try {
  const raw = localStorage.getItem(STORAGE);
  if (raw) loadWorld();
  else startEmpty();
} catch (_) {
  startEmpty();
}
updateShopUI();
document.getElementById("btn-shop-all")?.addEventListener("click", buyAllItems);
document.getElementById("btn-export")?.addEventListener("click", exportMap);
toast("Amal Studio — пустая карта, всё бесплатно!");
