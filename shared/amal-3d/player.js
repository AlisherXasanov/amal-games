/**
 * Пеший игрок WASD относительно камеры — ESM.
 */
export function createWalkPlayer(scene, THREE, opts) {
  opts = opts || {};
  const keys = Object.create(null);
  const color = opts.color != null ? opts.color : 0x60a5fa;
  const speed = opts.speed != null ? opts.speed : 8;
  const jump = opts.jump != null ? opts.jump : 8;
  const radius = opts.radius != null ? opts.radius : 0.35;
  const height = opts.height != null ? opts.height : 1.2;

  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, height * 0.55, 4, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 })
  );
  mesh.castShadow = true;
  mesh.position.set(opts.x || 0, height / 2 + 0.05, opts.z || 0);
  scene.add(mesh);

  const state = {
    mesh,
    vx: 0,
    vy: 0,
    vz: 0,
    onGround: true,
    speed,
    jump,
    fly: !!opts.fly,
    god: !!opts.god,
    radius,
    height,
  };

  function onKey(e, down) {
    keys[e.code] = down;
  }
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));

  return {
    mesh,
    state,
    keys,
    setFly(v) {
      state.fly = !!v;
    },
    setGod(v) {
      state.god = !!v;
    },
    /**
     * @param {number} dt
     * @param {{ yaw: number }} orbit
     * @param {(x:number,y:number,z:number)=>boolean} [solidAt]
     */
    update(dt, orbit, solidAt) {
      const yaw = orbit && orbit.yaw != null ? orbit.yaw : 0;
      let ix = 0;
      let iz = 0;
      if (keys.KeyW || keys.ArrowUp) iz -= 1;
      if (keys.KeyS || keys.ArrowDown) iz += 1;
      if (keys.KeyA || keys.ArrowLeft) ix -= 1;
      if (keys.KeyD || keys.ArrowRight) ix += 1;
      const len = Math.hypot(ix, iz) || 1;
      ix /= len;
      iz /= len;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const wx = ix * cy + iz * sy;
      const wz = -ix * sy + iz * cy;
      state.vx = wx * state.speed;
      state.vz = wz * state.speed;

      if (state.fly) {
        if (keys.Space) state.vy = state.speed;
        else if (keys.ShiftLeft || keys.ShiftRight) state.vy = -state.speed;
        else state.vy = 0;
      } else {
        if (state.onGround && keys.Space) {
          state.vy = state.jump;
          state.onGround = false;
        }
        state.vy -= 22 * dt;
      }

      const nx = mesh.position.x + state.vx * dt;
      const nz = mesh.position.z + state.vz * dt;
      const ny = mesh.position.y + state.vy * dt;

      if (!solidAt || !solidAt(nx, mesh.position.y, mesh.position.z)) mesh.position.x = nx;
      if (!solidAt || !solidAt(mesh.position.x, mesh.position.y, nz)) mesh.position.z = nz;

      if (state.fly) {
        mesh.position.y = Math.max(state.height / 2, ny);
      } else {
        mesh.position.y = ny;
        const groundY = state.height / 2;
        if (mesh.position.y <= groundY) {
          mesh.position.y = groundY;
          state.vy = 0;
          state.onGround = true;
        }
      }
      if (state.vx || state.vz) mesh.rotation.y = Math.atan2(state.vx, state.vz);
    },
  };
}
