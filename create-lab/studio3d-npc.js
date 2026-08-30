/** NPC с ногами, текстурой и ходьбой (свои персонажи) */
import * as THREE from "three";
import { makeMaterial } from "./studio3d-assets.js";

export function makeFaceTexture(kind) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (kind === "luntik") {
    ctx.fillStyle = "#c4b5fd";
    ctx.beginPath();
    ctx.ellipse(64, 72, 42, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a78bfa";
    [[38, 38], [90, 38]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, 14, 22, -0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#1e1b4b";
    [[48, 68], [80, 68]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(52, 66, 2.5, 0, Math.PI * 2);
    ctx.arc(84, 66, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(64, 82, 12, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (kind === "circus") {
    const gr = ctx.createLinearGradient(0, 0, 128, 128);
    gr.addColorStop(0, "#ef4444");
    gr.addColorStop(0.5, "#fbbf24");
    gr.addColorStop(1, "#a855f7");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 128, 128);
    ctx.font = "bold 52px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText("🎪", 64, 78);
  } else {
    ctx.fillStyle = "#6366f1";
    ctx.fillRect(0, 0, 128, 128);
    ctx.font = "72px serif";
    ctx.textAlign = "center";
    ctx.fillText("🗣", 64, 88);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createWalkNpc(d, opts) {
  opts = opts || {};
  const skin = opts.skin || "default";
  const bodyColor = opts.bodyColor || (skin === "luntik" ? "#c4b5fd" : "#6366f1");
  const g = new THREE.Group();
  const faceTex = makeFaceTexture(skin);

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.55, 6, 10),
    makeMaterial({ color: bodyColor })
  );
  torso.position.y = 0.95;
  g.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 14, 14),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 })
  );
  head.position.y = 1.55;
  head.name = "head";
  g.add(head);

  function leg(side) {
    const lg = new THREE.Group();
    lg.name = side === -1 ? "legL" : "legR";
    const upper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.35, 4, 6),
      makeMaterial({ color: bodyColor })
    );
    upper.position.y = -0.2;
    lg.add(upper);
    lg.position.set(side * 0.18, 0.55, 0);
    return lg;
  }

  const legL = leg(-1);
  const legR = leg(1);
  g.add(legL);
  g.add(legR);
  g.userData.npcRig = { legL, legR, head, baseY: 0, phase: Math.random() * 6 };
  return g;
}

export function animateNpcRig(obj, dt, moving) {
  const rig = obj.userData.npcRig;
  if (!rig) return;
  if (moving) {
    rig.phase += dt * 9;
    const s = Math.sin(rig.phase) * 0.55;
    rig.legL.rotation.x = s;
    rig.legR.rotation.x = -s;
    rig.head.position.y = 1.55 + Math.abs(Math.sin(rig.phase * 2)) * 0.04;
    obj.position.y = rig.baseY + Math.abs(Math.sin(rig.phase * 2)) * 0.03;
  } else {
    rig.legL.rotation.x *= 0.9;
    rig.legR.rotation.x *= 0.9;
  }
}

export function buildNpcPrefabs(wrap) {
  return {
    npc: {
      cat: "game", name: "NPC ходит", icon: "🗣",
      create(d) {
        const g = createWalkNpc(d, { skin: d.npcSkin || "default" });
        return wrap(g, Object.assign({}, d, {
          isNpc: true, isTrigger: true, npcWalk: true,
          npcText: d.npcText || "Привет! T — поговорить",
          patrolR: d.patrolR != null ? d.patrolR : 5,
          walkSpeed: d.walkSpeed != null ? d.walkSpeed : 1,
          hitboxW: 1.2, hitboxH: 2, hitboxD: 1.2,
        }));
      },
    },
    npc_luntik: {
      cat: "game", name: "Пример · инопланетянин", icon: "👽",
      create(d) {
        const g = createWalkNpc(d, { skin: "luntik", bodyColor: "#c4b5fd" });
        return wrap(g, Object.assign({}, d, {
          prefab: "npc_luntik", name: d.name || "Инопланетянин",
          isNpc: true, isTrigger: true, npcWalk: true, npcSkin: "luntik",
          npcText: d.npcText || "Привет! Я пришёл из космоса 🌙",
          patrolR: 6, walkSpeed: 1.1,
          hitboxW: 1.3, hitboxH: 2, hitboxD: 1.3,
        }));
      },
    },
    npc_circus: {
      cat: "game", name: "Цирк · Кен", icon: "🎪",
      create(d) {
        const g = createWalkNpc(d, { skin: "circus", bodyColor: "#ef4444" });
        const hat = new THREE.Mesh(
          new THREE.ConeGeometry(0.35, 0.4, 8),
          makeMaterial({ color: "#fbbf24" })
        );
        hat.position.y = 1.85;
        g.add(hat);
        return wrap(g, Object.assign({}, d, {
          prefab: "npc_circus", name: d.name || "Кен · Цифровой цирк",
          isNpc: true, isTrigger: true, npcWalk: true, npcSkin: "circus",
          npcText: d.npcText || "Добро пожаловать в удивительный цифровой цирк!",
          patrolR: 8, walkSpeed: 1.3,
          hitboxW: 1.3, hitboxH: 2.2, hitboxD: 1.3,
        }));
      },
    },
  };
}
