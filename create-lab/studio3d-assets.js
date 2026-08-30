/** Текстуры, звуки, картинки — библиотека Amal Studio (своё, не Roblox) */
import * as THREE from "three";

export const TEX = {};
export const TEX_LIST = [
  { id: "grass", name: "Трава", icon: "🟩" },
  { id: "brick", name: "Кирпич", icon: "🧱" },
  { id: "wood", name: "Дерево", icon: "🪵" },
  { id: "stone", name: "Камень", icon: "🪨" },
  { id: "sand", name: "Песок", icon: "🏜" },
  { id: "metal", name: "Металл", icon: "⚙" },
  { id: "ice", name: "Лёд", icon: "🧊" },
  { id: "lava", name: "Лава", icon: "🌋" },
  { id: "water", name: "Вода", icon: "💧" },
  { id: "dirt", name: "Земля", icon: "🟫" },
  { id: "roof", name: "Черепица", icon: "🏠" },
  { id: "glass", name: "Стекло", icon: "🪟" },
  { id: "neon", name: "Неон", icon: "💜" },
  { id: "check", name: "Клетка", icon: "♟" },
];

export const SOUND_LIST = [
  { id: "coin", name: "Монетка", icon: "🪙" },
  { id: "alarm", name: "Тревога", icon: "🚨" },
  { id: "step", name: "Шаги", icon: "👟" },
  { id: "steal", name: "Украл!", icon: "🥷" },
  { id: "hatch", name: "Вылупление", icon: "🐣" },
  { id: "win", name: "Победа", icon: "🏆" },
  { id: "boom", name: "Взрыв", icon: "💥" },
  { id: "music", name: "Музыка", icon: "🎵" },
];

export const PIC_LIST = [
  { id: "🥚", name: "Яйцо" },
  { id: "⭐", name: "Звезда" },
  { id: "💎", name: "Алмаз" },
  { id: "🔥", name: "Огонь" },
  { id: "❤", name: "Сердце" },
  { id: "💀", name: "Череп" },
  { id: "👑", name: "Корона" },
  { id: "🐉", name: "Дракон" },
  { id: "⚡", name: "Молния" },
  { id: "🎯", name: "Цель" },
];

const TEX_DRAW = {
  grass(ctx, s) {
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = i % 2 ? "#22c55e" : "#86efac";
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 6);
    }
  },
  brick(ctx, s) {
    ctx.fillStyle = "#b45309";
    ctx.fillRect(0, 0, s, s);
    const bw = 32, bh = 16;
    for (let y = 0; y < s; y += bh) {
      const off = (y / bh) % 2 ? bw / 2 : 0;
      for (let x = -off; x < s; x += bw) {
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
        ctx.fillStyle = "#d97706";
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    }
  },
  wood(ctx, s) {
    ctx.fillStyle = "#92400e";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = i % 2 ? "#78350f" : "#b45309";
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(0, i * (s / 12));
      ctx.lineTo(s, i * (s / 12) + 8);
      ctx.stroke();
    }
  },
  stone(ctx, s) {
    ctx.fillStyle = "#78716c";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = ["#57534e", "#a8a29e", "#44403c"][i % 3];
      const w = 10 + Math.random() * 25;
      ctx.fillRect(Math.random() * s, Math.random() * s, w, w * 0.7);
    }
  },
  sand(ctx, s) {
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = i % 3 ? "#fbbf24" : "#fef3c7";
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  },
  metal(ctx, s) {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "#e2e8f0");
    g.addColorStop(0.5, "#94a3b8");
    g.addColorStop(1, "#64748b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 16, 0);
      ctx.lineTo(i * 16 + 20, s);
      ctx.stroke();
    }
  },
  ice(ctx, s) {
    ctx.fillStyle = "#bae6fd";
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,.8)";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, 0);
      ctx.lineTo(Math.random() * s, s);
      ctx.stroke();
    }
  },
  lava(ctx, s) {
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = ["#f97316", "#fbbf24", "#7f1d1d"][i % 3];
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 4 + Math.random() * 12, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  water(ctx, s) {
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    for (let y = 0; y < s; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= s; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.08) * 4);
      ctx.stroke();
    }
  },
  dirt(ctx, s) {
    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = "#92400e";
      ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
    }
  },
  roof(ctx, s) {
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 14) {
      for (let x = 0; x < s; x += 20) {
        ctx.fillStyle = y % 28 ? "#b91c1c" : "#7f1d1d";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y + 14);
        ctx.lineTo(x + 20, y);
        ctx.fill();
      }
    }
  },
  glass(ctx, s) {
    ctx.fillStyle = "rgba(147,197,253,.45)";
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.strokeRect(4, 4, s - 8, s - 8);
    ctx.strokeRect(s / 2, 4, 1, s - 8);
    ctx.strokeRect(4, s / 2, s - 8, 1);
  },
  neon(ctx, s) {
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, s, s);
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#a855f7";
    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("✦", 40, 80);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("◆", 70, 110);
  },
  check(ctx, s) {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, s, s);
    const step = 16;
    for (let y = 0; y < s; y += step) {
      for (let x = 0; x < s; x += step) {
        if ((x / step + y / step) % 2) {
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(x, y, step, step);
        }
      }
    }
  },
};

export function initTextures() {
  TEX_LIST.forEach(({ id }) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    (TEX_DRAW[id] || TEX_DRAW.stone)(ctx, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    TEX[id] = t;
  });
}

export function getTexture(id) {
  return TEX[id] || TEX.stone;
}

export function makeMaterial(d) {
  const rough = d.roughness != null ? d.roughness : 0.65;
  const metal = d.metalness != null ? d.metalness : 0;
  const opts = { roughness: rough, metalness: metal };
  if (d.texture) {
    const src = getTexture(d.texture);
    opts.map = src.clone();
    opts.map.repeat.set(d.texRepeat || 1, d.texRepeat || 1);
    opts.map.needsUpdate = true;
  }
  if (d.color) opts.color = new THREE.Color(d.color);
  else if (!d.texture) opts.color = new THREE.Color("#38bdf8");
  if (d.transparent || d.texture === "glass" || d.texture === "water") {
    opts.transparent = true;
    opts.opacity = d.opacity != null ? d.opacity : d.texture === "glass" ? 0.55 : 0.85;
  }
  if (d.emissive) {
    opts.emissive = new THREE.Color(d.emissive);
    opts.emissiveIntensity = d.emissiveIntensity || 0.4;
  }
  return new THREE.MeshStandardMaterial(opts);
}

export function applyMaterialToObject(obj, d) {
  obj.traverse((c) => {
    if (c.isMesh && c.userData.canTexture !== false) {
      const nd = Object.assign({}, d);
      if (c.userData.partColor) nd.color = c.userData.partColor;
      c.material = makeMaterial(nd);
    }
  });
}

export function makeEmojiTexture(emoji, bg) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);
  } else {
    ctx.clearRect(0, 0, 256, 256);
  }
  ctx.font = "180px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji || "⭐", 128, 138);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── Web Audio звуки ── */
let audioCtx = null;

function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function playSound(id, volume) {
  try {
    const ctx = ac();
    const v = (volume != null ? volume : 0.7) * 0.35;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.value = v;
    g.connect(ctx.destination);

    function tone(freq, type, start, dur, vol) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, start);
      const gg = ctx.createGain();
      gg.gain.setValueAtTime(vol, start);
      gg.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(gg);
      gg.connect(g);
      o.start(start);
      o.stop(start + dur);
    }

    if (id === "coin") {
      tone(880, "sine", t, 0.12, 1);
      tone(1320, "sine", t + 0.05, 0.15, 0.6);
    } else if (id === "alarm") {
      for (let i = 0; i < 4; i++) tone(440 + i * 20, "square", t + i * 0.15, 0.12, 0.5);
    } else if (id === "step") {
      tone(80, "triangle", t, 0.06, 0.8);
    } else if (id === "steal") {
      tone(200, "sawtooth", t, 0.08, 0.6);
      tone(600, "sine", t + 0.06, 0.2, 0.5);
    } else if (id === "hatch") {
      tone(520, "sine", t, 0.1, 0.7);
      tone(780, "sine", t + 0.08, 0.15, 0.5);
    } else if (id === "win") {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, "sine", t + i * 0.1, 0.2, 0.6));
    } else if (id === "boom") {
      tone(60, "sawtooth", t, 0.35, 0.9);
      tone(120, "square", t, 0.25, 0.4);
    } else if (id === "music") {
      [262, 330, 392, 523].forEach((f, i) => tone(f, "triangle", t + i * 0.22, 0.18, 0.35));
    }
  } catch (_) {}
}

export function buildExtraPrefabs(wrap, makeEgg) {
  const box = (d, sx, sy, sz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), makeMaterial(d));
    return wrap(m, d);
  };

  const out = {};

  TEX_LIST.forEach((tx) => {
    out["tex_" + tx.id] = {
      cat: "tex", name: tx.name, icon: tx.icon,
      create(d) {
        const data = Object.assign({ texture: tx.id, prefab: "tex_" + tx.id, name: tx.name }, d);
        if (tx.id === "metal") { data.metalness = 0.85; data.roughness = 0.25; }
        if (tx.id === "glass") { data.transparent = true; }
        if (tx.id === "lava") { data.emissive = "#f97316"; data.emissiveIntensity = 0.6; }
        if (tx.id === "neon") { data.emissive = "#a855f7"; data.emissiveIntensity = 0.8; }
        return box(data, data.sx || 4, data.sy || 2, data.sz || 4);
      },
    };
  });

  Object.assign(out, {
    wedge: {
      cat: "parts", name: "Склон", icon: "📐",
      create(d) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0, 2.5, 2, 4, 1), makeMaterial(Object.assign({ color: "#94a3b8" }, d)));
        m.rotation.y = Math.PI / 4;
        return wrap(m, d);
      },
    },
    fence: {
      cat: "decor", name: "Забор", icon: "🚧",
      create(d) {
        const g = new THREE.Group();
        for (let i = -2; i <= 2; i++) {
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 1.2, 0.2),
            makeMaterial({ color: "#854d0e" })
          );
          post.position.set(i * 1.1, 0.6, 0);
          g.add(post);
        }
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(5, 0.15, 0.15),
          makeMaterial({ color: "#a16207" })
        );
        rail.position.y = 0.9;
        g.add(rail);
        return wrap(g, Object.assign({}, d, { name: d.name || "Забор" }));
      },
    },
    lamp: {
      cat: "decor", name: "Фонарь", icon: "💡",
      create(d) {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 8), makeMaterial({ color: "#374151" }));
        pole.position.y = 1.5;
        g.add(pole);
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 12, 12),
          makeMaterial({ color: "#fde68a", emissive: "#fbbf24", emissiveIntensity: 1.2 })
        );
        bulb.position.y = 3.1;
        g.add(bulb);
        const pl = new THREE.PointLight(0xffeeaa, 0.8, 12);
        pl.position.y = 3.1;
        g.add(pl);
        return wrap(g, Object.assign({}, d, { isLight: true }));
      },
    },
    sign: {
      cat: "decor", name: "Табличка", icon: "📋",
      create(d) {
        const g = new THREE.Group();
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 1.4, 0.12),
          makeMaterial({ texture: "wood", color: "#d97706" })
        );
        board.position.y = 2;
        g.add(board);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2, 0.15), makeMaterial({ color: "#57534e" }));
        post.position.y = 1;
        g.add(post);
        return wrap(g, Object.assign({}, d, { signText: d.signText || "ПРИВЕТ" }));
      },
    },
    rock: {
      cat: "decor", name: "Камень", icon: "🪨",
      create(d) {
        const m = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.2, 0),
          makeMaterial({ texture: "stone", roughness: 0.95 })
        );
        m.position.y = 0.6;
        m.scale.set(1.3, 0.9, 1.1);
        return wrap(m, d);
      },
    },
    stairs: {
      cat: "decor", name: "Лестница", icon: "🪜",
      create(d) {
        const g = new THREE.Group();
        for (let i = 0; i < 5; i++) {
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.35, 0.8),
            makeMaterial({ texture: "stone" })
          );
          step.position.set(0, 0.2 + i * 0.35, i * 0.7);
          g.add(step);
        }
        return wrap(g, d);
      },
    },
    crate: {
      cat: "decor", name: "Ящик", icon: "📦",
      create(d) {
        return box(Object.assign({ texture: "wood", sx: 1.8, sy: 1.8, sz: 1.8 }, d), 1.8, 1.8, 1.8);
      },
    },
    coin_pickup: {
      cat: "decor", name: "Монетка", icon: "🪙",
      create(d) {
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.12, 20),
          makeMaterial({ color: "#fbbf24", metalness: 0.9, emissive: "#f59e0b", emissiveIntensity: 0.35 })
        );
        m.rotation.x = Math.PI / 2;
        m.position.y = 0.8;
        return wrap(m, Object.assign({}, d, { isPickup: true, pickupType: "coin" }));
      },
    },
    portal: {
      cat: "decor", name: "Портал", icon: "🌀",
      create(d) {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.8, 0.2, 10, 32),
          makeMaterial({ color: "#a855f7", emissive: "#7c3aed", emissiveIntensity: 0.9 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 1.8;
        g.add(ring);
        return wrap(g, Object.assign({}, d, { isPortal: true }));
      },
    },
    picture: {
      cat: "pic", name: "Картинка", icon: "🖼",
      create(d) {
        const em = d.imageChar || "⭐";
        const tex = makeEmojiTexture(em, "#1e293b");
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(2.5, 2.5),
          new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        m.position.y = 2;
        return wrap(m, Object.assign({}, d, { imageChar: em, prefab: "picture" }));
      },
    },
    billboard: {
      cat: "pic", name: "Баннер", icon: "📢",
      create(d) {
        const g = new THREE.Group();
        const em = d.imageChar || "🎯";
        const tex = makeEmojiTexture(em, "#0f172a");
        const face = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 2.2),
          new THREE.MeshStandardMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        face.position.y = 2.8;
        g.add(face);
        const legs = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), makeMaterial({ color: "#64748b" }));
        legs.position.y = 1.4;
        g.add(legs);
        return wrap(g, Object.assign({}, d, { imageChar: em, prefab: "billboard" }));
      },
    },
    sound_zone: {
      cat: "sound", name: "Зона звука", icon: "🔊",
      create(d) {
        const g = new THREE.Group();
        const speaker = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1.2, 0.6),
          makeMaterial({ color: "#334155", emissive: "#007acc", emissiveIntensity: 0.3 })
        );
        speaker.position.y = 0.6;
        g.add(speaker);
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.35, 0.5, 8),
          makeMaterial({ color: "#007acc" })
        );
        cone.rotation.x = Math.PI;
        cone.position.set(0, 1.1, 0.35);
        g.add(cone);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(2.5, 2.7, 32),
          new THREE.MeshBasicMaterial({ color: 0x007acc, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        ring.userData.canTexture = false;
        ring.name = "soundRing";
        g.add(ring);
        return wrap(g, Object.assign({}, d, {
          soundId: d.soundId || "coin",
          soundRadius: d.soundRadius || 6,
          soundLoop: !!d.soundLoop,
          prefab: "sound_zone",
        }));
      },
    },
  });

  return out;
}

let _editVisible = true;
export function setEditModeVisible(v) { _editVisible = v; }
export function toggleSoundRings(objects, visible) {
  objects.forEach((o) => {
    o.traverse((c) => { if (c.name === "soundRing") c.visible = visible; });
  });
}
