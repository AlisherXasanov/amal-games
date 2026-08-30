/** Каталог предметов + магазин Amal Studio */
import * as THREE from "three";
import { makeMaterial, makeEmojiTexture } from "./studio3d-assets.js";

export const UNLOCK_KEY = "amal-studio-unlocks-v3";
export const COINS_KEY = "amal-studio-coins-v3";

/** Бесплатно с начала */
export const FREE_ITEMS = new Set([
  "block", "ball", "plate", "cylinder", "wedge", "spawn",
  "tex_grass", "tex_brick", "tex_wood", "tree", "rock", "lamp",
  "picture", "chair", "flower", "acc_hat",
]);

/** Цена если не бесплатно */
export const SHOP_PRICES = {
  acc_crown: 40, acc_wings: 80, acc_sword: 60, acc_shield: 50,
  acc_glasses: 25, acc_backpack: 45, acc_pet: 70, acc_cape: 55, acc_halo: 90,
  acc_umbrella: 35, acc_mask: 30,
  car: 120, bike: 80, rocket: 150,
  flower: 0, bush: 20, cloud: 30, mushroom: 25, cactus: 25,
  chair: 0, table: 35, bed: 50, sofa: 55,
  door: 30, window: 25, pillar: 20, ramp: 15,
  balloon: 40, disco: 100, trampoline: 90, rainbow: 75,
  fence: 25, stairs: 30, crate: 15, sign: 20, portal: 110,
  coin_pickup: 20, sound_zone: 35, billboard: 45,
  tex_stone: 15, tex_sand: 15, tex_metal: 25, tex_ice: 30,
  tex_lava: 40, tex_water: 25, tex_dirt: 10, tex_roof: 20,
  tex_glass: 30, tex_neon: 50, tex_check: 15,
  egg_basic: 50, egg_gold: 80, egg_slime: 80, egg_crystal: 100,
  egg_dragon: 150, egg_void: 180, egg_star: 200, egg_final: 250,
  pen: 40, treadmill: 60, zone: 35, boss: 70,
};

export function loadUnlocks() {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (_) {}
  return new Set(FREE_ITEMS);
}

export function saveUnlocks(set) {
  localStorage.setItem(UNLOCK_KEY, JSON.stringify([...set]));
}

export function loadCoins() {
  try {
    const n = parseInt(localStorage.getItem(COINS_KEY), 10);
    if (n >= 0) return n;
  } catch (_) {}
  return 500;
}

export function saveCoins(n) {
  localStorage.setItem(COINS_KEY, String(Math.max(0, n)));
}

export function shopPrice(key) {
  return 0; /* всё бесплатно — своя студия */
}

export function buildCatalogPrefabs(wrap) {
  const box = (d, sx, sy, sz, mat) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      mat || makeMaterial(d)
    );
    return wrap(m, d);
  };

  return {
    /* ── Аксессуары ── */
    acc_hat: {
      cat: "acc", name: "Шляпа", icon: "🎩", price: 0,
      create(d) {
        const g = new THREE.Group();
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), makeMaterial({ color: "#1e293b" }));
        brim.position.y = 0.04;
        g.add(brim);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.55, 12), makeMaterial({ color: "#1e293b" }));
        top.position.y = 0.35;
        g.add(top);
        return wrap(g, Object.assign({}, d, { prefab: "acc_hat" }));
      },
    },
    acc_crown: {
      cat: "acc", name: "Корона", icon: "👑",
      create(d) {
        const g = new THREE.Group();
        for (let i = 0; i < 5; i++) {
          const sp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), makeMaterial({ color: "#fbbf24", metalness: 0.9, emissive: "#f59e0b", emissiveIntensity: 0.3 }));
          sp.position.set(-0.4 + i * 0.2, 0.2, 0);
          g.add(sp);
        }
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 20), makeMaterial({ color: "#fbbf24", metalness: 0.85 }));
        band.rotation.x = Math.PI / 2;
        g.add(band);
        return wrap(g, d);
      },
    },
    acc_wings: {
      cat: "acc", name: "Крылья", icon: "🪽",
      create(d) {
        const g = new THREE.Group();
        [-1, 1].forEach((s) => {
          const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), makeMaterial({ color: "#e0f2fe", emissive: "#38bdf8", emissiveIntensity: 0.25 }));
          w.position.set(s * 1.1, 0.5, 0);
          w.rotation.z = s * 0.35;
          g.add(w);
        });
        return wrap(g, d);
      },
    },
    acc_sword: {
      cat: "acc", name: "Меч", icon: "⚔",
      create(d) {
        const g = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.35), makeMaterial({ color: "#cbd5e1", metalness: 0.95, roughness: 0.15 }));
        blade.position.y = 1.1;
        g.add(blade);
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 8), makeMaterial({ color: "#78350f" }));
        hilt.position.y = 0.18;
        g.add(hilt);
        return wrap(g, d);
      },
    },
    acc_shield: {
      cat: "acc", name: "Щит", icon: "🛡",
      create(d) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 6), makeMaterial({ color: "#2563eb", metalness: 0.4 }));
        m.rotation.x = Math.PI / 2;
        m.position.y = 0.9;
        return wrap(m, d);
      },
    },
    acc_glasses: {
      cat: "acc", name: "Очки", icon: "👓",
      create(d) {
        const g = new THREE.Group();
        [-0.25, 0.25].forEach((x) => {
          const lens = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), makeMaterial({ color: "#111" }));
          lens.position.set(x, 0.5, 0.2);
          g.add(lens);
        });
        return wrap(g, d);
      },
    },
    acc_backpack: {
      cat: "acc", name: "Рюкзак", icon: "🎒",
      create(d) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 0.45), makeMaterial({ color: "#dc2626" }));
        m.position.y = 0.75;
        return wrap(m, d);
      },
    },
    acc_pet: {
      cat: "acc", name: "Питомец", icon: "🐕",
      create(d) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.35), makeMaterial({ color: "#d97706" }));
        body.position.y = 0.35;
        g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), makeMaterial({ color: "#d97706" }));
        head.position.set(0.45, 0.45, 0);
        g.add(head);
        return wrap(g, d);
      },
    },
    acc_cape: {
      cat: "acc", name: "Плащ", icon: "🦸",
      create(d) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), makeMaterial({ color: "#dc2626", roughness: 0.8 }));
        m.position.set(0, 1, -0.2);
        return wrap(m, d);
      },
    },
    acc_halo: {
      cat: "acc", name: "Нимб", icon: "😇",
      create(d) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 24), makeMaterial({ color: "#fde68a", emissive: "#fbbf24", emissiveIntensity: 0.9 }));
        m.rotation.x = Math.PI / 2;
        m.position.y = 1.6;
        return wrap(m, d);
      },
    },
    acc_umbrella: {
      cat: "acc", name: "Зонт", icon: "☂️",
      create(d) {
        const g = new THREE.Group();
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.35, 12), makeMaterial({ color: "#ec4899" }));
        top.rotation.x = Math.PI;
        top.position.y = 1.5;
        g.add(top);
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), makeMaterial({ color: "#57534e" }));
        stick.position.y = 0.75;
        g.add(stick);
        return wrap(g, d);
      },
    },
    acc_mask: {
      cat: "acc", name: "Маска", icon: "🎭",
      create(d) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), makeMaterial({ color: "#f8fafc" }));
        m.position.y = 0.9;
        return wrap(m, d);
      },
    },

    /* ── Природа ── */
    flower: {
      cat: "nature", name: "Цветок", icon: "🌸", price: 0,
      create(d) {
        const g = new THREE.Group();
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6), makeMaterial({ color: "#16a34a" }));
        stem.position.y = 0.35;
        g.add(stem);
        const pet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), makeMaterial({ color: "#ec4899" }));
        pet.position.y = 0.75;
        g.add(pet);
        return wrap(g, d);
      },
    },
    bush: {
      cat: "nature", name: "Куст", icon: "🌿",
      create(d) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), makeMaterial({ color: "#15803d" }));
        m.position.y = 0.55;
        m.scale.set(1.2, 0.85, 1.2);
        return wrap(m, d);
      },
    },
    cloud: {
      cat: "nature", name: "Облако", icon: "☁",
      create(d) {
        const g = new THREE.Group();
        [[0, 0], [-0.5, 0.1], [0.5, 0.05], [-0.2, 0.25]].forEach(([x, y]) => {
          const p = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), makeMaterial({ color: "#f8fafc" }));
          p.position.set(x, 2.5 + y, 0);
          g.add(p);
        });
        return wrap(g, d);
      },
    },
    mushroom: {
      cat: "nature", name: "Гриб", icon: "🍄",
      create(d) {
        const g = new THREE.Group();
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), makeMaterial({ color: "#ef4444" }));
        cap.position.y = 0.55;
        g.add(cap);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.45, 8), makeMaterial({ color: "#fef3c7" }));
        stem.position.y = 0.22;
        g.add(stem);
        return wrap(g, d);
      },
    },
    cactus: {
      cat: "nature", name: "Кактус", icon: "🌵",
      create(d) {
        const g = new THREE.Group();
        const main = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.6, 8), makeMaterial({ color: "#16a34a" }));
        main.position.y = 0.8;
        g.add(main);
        return wrap(g, d);
      },
    },

    /* ── Транспорт ── */
    car: {
      cat: "ride", name: "Машина", icon: "🚗",
      create(d) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 1.1), makeMaterial({ color: "#ef4444" }));
        body.position.y = 0.55;
        g.add(body);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.95), makeMaterial({ color: "#94a3b8", transparent: true, opacity: 0.7 }));
        cabin.position.set(-0.1, 1.05, 0);
        g.add(cabin);
        [[-0.7, 0.25], [0.7, 0.25], [-0.7, -0.25], [0.7, -0.25]].forEach(([x, z]) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 10), makeMaterial({ color: "#111" }));
          w.rotation.z = Math.PI / 2;
          w.position.set(x, 0.22, z);
          g.add(w);
        });
        return wrap(g, d);
      },
    },
    bike: {
      cat: "ride", name: "Велик", icon: "🚲",
      create(d) {
        const g = new THREE.Group();
        [[-0.6, 0], [0.6, 0]].forEach(([x]) => {
          const w = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 16), makeMaterial({ color: "#111" }));
          w.rotation.y = Math.PI / 2;
          w.position.set(x, 0.35, 0);
          g.add(w);
        });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.06), makeMaterial({ color: "#dc2626" }));
        frame.position.y = 0.65;
        g.add(frame);
        return wrap(g, d);
      },
    },
    rocket: {
      cat: "ride", name: "Ракета", icon: "🚀",
      create(d) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 10), makeMaterial({ color: "#e2e8f0", metalness: 0.6 }));
        body.position.y = 1.1;
        g.add(body);
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 10), makeMaterial({ color: "#ef4444" }));
        nose.position.y = 2.35;
        g.add(nose);
        return wrap(g, d);
      },
    },

    /* ── Мебель / строительство ── */
    chair: {
      cat: "props", name: "Стул", icon: "🪑", price: 0,
      create(d) {
        const g = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), makeMaterial({ texture: "wood" }));
        seat.position.y = 0.55;
        g.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.1), makeMaterial({ texture: "wood" }));
        back.position.set(0, 0.95, -0.35);
        g.add(back);
        return wrap(g, d);
      },
    },
    table: {
      cat: "props", name: "Стол", icon: "🪵",
      create(d) {
        const g = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.2), makeMaterial({ texture: "wood" }));
        top.position.y = 0.85;
        g.add(top);
        return wrap(g, d);
      },
    },
    bed: {
      cat: "props", name: "Кровать", icon: "🛏",
      create(d) {
        const g = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.35, 1.2), makeMaterial({ color: "#78350f" }));
        base.position.y = 0.2;
        g.add(base);
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1.1), makeMaterial({ color: "#38bdf8" }));
        mattress.position.y = 0.5;
        g.add(mattress);
        return wrap(g, d);
      },
    },
    sofa: {
      cat: "props", name: "Диван", icon: "🛋",
      create(d) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 0.9), makeMaterial({ color: "#7c3aed" }));
        m.position.y = 0.35;
        return wrap(m, d);
      },
    },
    door: {
      cat: "build", name: "Дверь", icon: "🚪",
      create(d) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.15), makeMaterial({ texture: "wood", color: "#92400e" }));
        m.position.y = 1.2;
        return wrap(m, d);
      },
    },
    window: {
      cat: "build", name: "Окно", icon: "🪟",
      create(d) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.12), makeMaterial({ texture: "glass", transparent: true }));
        m.position.y = 1.5;
        return wrap(m, d);
      },
    },
    pillar: {
      cat: "build", name: "Колонна", icon: "🏛",
      create(d) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 3.5, 10), makeMaterial({ texture: "stone" }));
        m.position.y = 1.75;
        return wrap(m, d);
      },
    },
    ramp: {
      cat: "build", name: "Рампа", icon: "📐",
      create(d) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 3), makeMaterial({ texture: "check" }));
        m.position.y = 0.8;
        m.rotation.x = -0.35;
        return wrap(m, d);
      },
    },

    /* ── Веселье ── */
    balloon: {
      cat: "fun", name: "Шарик", icon: "🎈",
      create(d) {
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 14), makeMaterial({ color: "#ef4444", emissive: "#ef4444", emissiveIntensity: 0.15 }));
        b.position.y = 2;
        g.add(b);
        const str = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), makeMaterial({ color: "#ccc" }));
        str.position.y = 1.2;
        g.add(str);
        return wrap(g, d);
      },
    },
    disco: {
      cat: "fun", name: "Диско-шар", icon: "🪩",
      create(d) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), makeMaterial({ color: "#cbd5e1", metalness: 0.95, emissive: "#a855f7", emissiveIntensity: 0.4 }));
        m.position.y = 2.5;
        return wrap(m, d);
      },
    },
    trampoline: {
      cat: "fun", name: "Батут", icon: "🤸",
      create(d) {
        const g = new THREE.Group();
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 20), makeMaterial({ color: "#38bdf8" }));
        pad.position.y = 0.5;
        g.add(pad);
        return wrap(g, Object.assign({}, d, { isTrampoline: true }));
      },
    },
    rainbow: {
      cat: "fun", name: "Радуга", icon: "🌈",
      create(d) {
        const g = new THREE.Group();
        const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
        colors.forEach((c, i) => {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(2.5 - i * 0.15, 0.12, 6, 32, Math.PI),
            makeMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 })
          );
          ring.rotation.x = Math.PI / 2;
          ring.rotation.z = Math.PI;
          ring.position.y = 0.1 + i * 0.05;
          g.add(ring);
        });
        return wrap(g, d);
      },
    },
  };
}

export function buildPicPrefabs(wrap) {
  const pics = [
    ["pic_star", "⭐", "Звезда"], ["pic_fire", "🔥", "Огонь"], ["pic_heart", "❤", "Сердце"],
    ["pic_skull", "💀", "Череп"], ["pic_crown", "👑", "Корона"], ["pic_dragon", "🐉", "Дракон"],
    ["pic_bolt", "⚡", "Молния"], ["pic_target", "🎯", "Цель"], ["pic_gem", "💎", "Алмаз"],
    ["pic_egg", "🥚", "Яйцо"], ["pic_ufo", "🛸", "НЛО"], ["pic_pizza", "🍕", "Пицца"],
    ["pic_soccer", "⚽", "Мяч"], ["pic_music", "🎵", "Музыка"], ["pic_ghost", "👻", "Призрак"],
  ];
  const out = {};
  pics.forEach(([key, em, name]) => {
    out[key] = {
      cat: "pic", name, icon: em, previewEmoji: em,
      create(d) {
        const tex = makeEmojiTexture(em, "#1e293b");
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(2.2, 2.2),
          new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        m.position.y = 1.5;
        return wrap(m, Object.assign({}, d, { imageChar: em, prefab: key }));
      },
    };
  });
  return out;
}
