/**
 * Пеший игрок + опциональный полёт для хозяина.
 * WASD относительно камеры (W = куда смотришь) · Пробел прыжок · полёт: Пробел↑ Shift↓
 */
(function (global) {
  "use strict";

  function makeHumanoid(THREE, color, height) {
    const g = new THREE.Group();
    const skin = color != null ? color : 0xffcc99;
    const shirt = 0x3b82f6;
    const pants = 0x1e3a5f;
    const shoes = 0x111827;

    const hipsY = 0.55;
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.65, 0.32),
      new THREE.MeshLambertMaterial({ color: shirt })
    );
    torso.position.y = hipsY + 0.45;
    torso.castShadow = true;
    g.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshLambertMaterial({ color: skin })
    );
    head.position.y = hipsY + 0.95;
    head.castShadow = true;
    g.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshLambertMaterial({ color: 0x3f2a1a })
    );
    hair.position.y = hipsY + 1.05;
    g.add(hair);

    [[-0.38, 1], [0.38, 1]].forEach(([x]) => {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.08, 0.35, 3, 6),
        new THREE.MeshLambertMaterial({ color: skin })
      );
      arm.position.set(x, hipsY + 0.5, 0);
      arm.castShadow = true;
      g.add(arm);
    });

    [[-0.16, -1], [0.16, 1]].forEach(([x], i) => {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.4, 3, 6),
        new THREE.MeshLambertMaterial({ color: pants })
      );
      leg.position.set(x, hipsY - 0.15, 0);
      leg.castShadow = true;
      g.add(leg);
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.1, 0.28),
        new THREE.MeshLambertMaterial({ color: shoes })
      );
      shoe.position.set(x, 0.06, 0.04);
      g.add(shoe);
    });

    g.userData.height = height != null ? height : 1.7;
    return g;
  }

  function create(scene, THREE, opts) {
    opts = opts || {};
    const keys = Object.create(null);
    const color = opts.color != null ? opts.color : 0x60a5fa;
    const speed = opts.speed != null ? opts.speed : 8;
    const jump = opts.jump != null ? opts.jump : 8;
    const radius = opts.radius != null ? opts.radius : 0.35;
    const height = opts.height != null ? opts.height : opts.humanoid ? 1.7 : 1.2;

    let mesh;
    if (opts.humanoid) {
      mesh = makeHumanoid(THREE, opts.skinColor != null ? opts.skinColor : 0xffcc99, height);
      if (!THREE.CapsuleGeometry) {
        // arms/legs may still use capsule — polyfill handled by caller usually
      }
    } else {
      mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(radius, height * 0.55, 4, 8),
        new THREE.MeshLambertMaterial({ color: color })
      );
      mesh.castShadow = true;
    }
    mesh.position.set(opts.x || 0, opts.humanoid ? 0 : height / 2 + 0.05, opts.z || 0);
    scene.add(mesh);

    const state = {
      mesh: mesh,
      vx: 0,
      vy: 0,
      vz: 0,
      onGround: true,
      speed: speed,
      jump: jump,
      height: height,
      locked: false,
      fly: false,
      god: false,
      humanoid: !!opts.humanoid,
      facing: 0,
    };

    function onKey(e, down) {
      const k = e.key.toLowerCase();
      if (
        ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "shift"].includes(k) ||
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight"
      ) {
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = down;
        else keys[k] = down;
        if (down && (k === " " || k === "arrowup")) e.preventDefault();
      }
    }
    window.addEventListener("keydown", (e) => onKey(e, true));
    window.addEventListener("keyup", (e) => onKey(e, false));

    function setFly(on) {
      state.fly = !!on;
      if (state.fly) {
        state.onGround = false;
        state.vy = 0;
      }
    }

    function setGod(on) {
      state.god = !!on;
    }

    function update(dt, orbitYaw, bounds) {
      if (state.locked) return;
      let ix = 0;
      let iz = 0;
      // iz: -1 = вперёд (W), +1 = назад (S)
      if (keys.w || keys.arrowup) iz -= 1;
      if (keys.s || keys.arrowdown) iz += 1;
      if (keys.a || keys.arrowleft) ix -= 1;
      if (keys.d || keys.arrowright) ix += 1;

      const yaw = orbitYaw != null ? orbitYaw : 0;
      const sy = Math.sin(yaw);
      const cy = Math.cos(yaw);
      // Камера смотрит на цель с offset (sy, cy) → взгляд = (-sy, -cy)
      const fx = -sy;
      const fz = -cy;
      const rx = cy;
      const rz = -sy;

      let wishX = 0;
      let wishZ = 0;
      if (ix || iz) {
        // W (iz=-1): двигаться по направлению взгляда
        wishX = fx * -iz + rx * ix;
        wishZ = fz * -iz + rz * ix;
        const len = Math.hypot(wishX, wishZ) || 1;
        wishX /= len;
        wishZ /= len;
        state.facing = Math.atan2(wishX, wishZ);
      }

      const spd = state.fly ? state.speed * 1.6 : state.speed;
      state.vx = wishX * spd;
      state.vz = wishZ * spd;

      if (state.fly) {
        state.vy = 0;
        if (keys[" "]) state.vy = spd;
        if (keys.shift) state.vy = -spd;
        mesh.position.x += state.vx * dt;
        mesh.position.y += state.vy * dt;
        mesh.position.z += state.vz * dt;
        mesh.position.y = Math.max(0, mesh.position.y);
      } else {
        if (state.onGround && keys[" "]) {
          state.vy = state.jump;
          state.onGround = false;
        }
        state.vy -= 22 * dt;
        mesh.position.x += state.vx * dt;
        mesh.position.y += state.vy * dt;
        mesh.position.z += state.vz * dt;
        const groundY = state.humanoid ? 0 : height / 2 + 0.05;
        if (mesh.position.y <= groundY) {
          mesh.position.y = groundY;
          state.vy = 0;
          state.onGround = true;
        }
      }

      if (state.humanoid && (wishX || wishZ)) {
        mesh.rotation.y = state.facing;
      }

      if (bounds) {
        mesh.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, mesh.position.x));
        mesh.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, mesh.position.z));
      }
    }

    return { mesh: mesh, state: state, update: update, keys: keys, setFly: setFly, setGod: setGod };
  }

  global.AmalWalkPlayer = { create: create };
})(typeof window !== "undefined" ? window : globalThis);
