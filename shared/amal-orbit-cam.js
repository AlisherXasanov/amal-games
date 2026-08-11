/**
 * Поворот камеры для Roblox-style 3D игр Amal.
 *
 * ПК: зажми ПКМ (или СКМ) и двигай мышь · колёсико — зум · Q/E — поворот
 * Телефон: один палец справа / два пальца — крутить · щипок — зум
 *
 * Использование:
 *   const orbit = AmalOrbitCam.attach(camera, renderer.domElement, { distance: 12 });
 *   // в animate:
 *   orbit.follow(player.position.x, player.position.y + 1.2, player.position.z);
 *   // или для обзора карты:
 *   orbit.lookAt(0, 1, 0);
 */
(function (global) {
  "use strict";

  function attach(camera, domElement, opts) {
    opts = opts || {};
    const state = {
      yaw: opts.yaw != null ? opts.yaw : 0,
      pitch: opts.pitch != null ? opts.pitch : 0.45,
      distance: opts.distance != null ? opts.distance : 12,
      minDist: opts.minDist != null ? opts.minDist : 3,
      maxDist: opts.maxDist != null ? opts.maxDist : 40,
      minPitch: opts.minPitch != null ? opts.minPitch : 0.12,
      maxPitch: opts.maxPitch != null ? opts.maxPitch : 1.35,
      rotateSpeed: opts.rotateSpeed != null ? opts.rotateSpeed : 0.005,
      zoomSpeed: opts.zoomSpeed != null ? opts.zoomSpeed : 0.12,
      lerp: opts.lerp != null ? opts.lerp : 0.18,
      target: { x: 0, y: 1, z: 0 },
      dragging: false,
      lastX: 0,
      lastY: 0,
      pointers: new Map(),
      pinchStart: 0,
      pinchDist: 0,
    };

    function apply() {
      const cp = Math.cos(state.pitch);
      const sp = Math.sin(state.pitch);
      const cy = Math.cos(state.yaw);
      const sy = Math.sin(state.yaw);
      const tx = state.target.x;
      const ty = state.target.y;
      const tz = state.target.z;
      const desired = {
        x: tx + state.distance * cp * sy,
        y: ty + state.distance * sp,
        z: tz + state.distance * cp * cy,
      };
      camera.position.x += (desired.x - camera.position.x) * state.lerp;
      camera.position.y += (desired.y - camera.position.y) * state.lerp;
      camera.position.z += (desired.z - camera.position.z) * state.lerp;
      camera.lookAt(tx, ty, tz);
    }

    function isRotateButton(ev) {
      // ПКМ / СКМ; на тачпадах иногда button===0 с buttons===2
      return ev.button === 2 || ev.button === 1 || (ev.buttons & 2) === 2 || (ev.buttons & 4) === 4;
    }

    function onPointerDown(ev) {
      if (ev.pointerType === "mouse" && !isRotateButton(ev) && ev.button === 0) {
        // ЛКМ оставляем игре (клики по UI / размещение башен)
        return;
      }
      state.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (state.pointers.size === 1) {
        state.dragging = true;
        state.lastX = ev.clientX;
        state.lastY = ev.clientY;
        try {
          domElement.setPointerCapture(ev.pointerId);
        } catch (_) {}
      } else if (state.pointers.size === 2) {
        const pts = [...state.pointers.values()];
        state.pinchStart = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        state.pinchDist = state.distance;
        state.dragging = false;
      }
      ev.preventDefault();
    }

    function onPointerMove(ev) {
      if (!state.pointers.has(ev.pointerId) && !state.dragging) return;
      if (state.pointers.has(ev.pointerId)) {
        state.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      }

      if (state.pointers.size === 2) {
        const pts = [...state.pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (state.pinchStart > 0) {
          const scale = state.pinchStart / Math.max(1, dist);
          state.distance = clamp(state.pinchDist * scale, state.minDist, state.maxDist);
        }
        // средний сдвиг = поворот
        const mx = (pts[0].x + pts[1].x) / 2;
        const my = (pts[0].y + pts[1].y) / 2;
        if (state.lastX || state.lastY) {
          state.yaw -= (mx - state.lastX) * state.rotateSpeed;
          state.pitch = clamp(
            state.pitch + (my - state.lastY) * state.rotateSpeed,
            state.minPitch,
            state.maxPitch
          );
        }
        state.lastX = mx;
        state.lastY = my;
        return;
      }

      if (!state.dragging) return;
      const dx = ev.clientX - state.lastX;
      const dy = ev.clientY - state.lastY;
      state.lastX = ev.clientX;
      state.lastY = ev.clientY;
      state.yaw -= dx * state.rotateSpeed;
      state.pitch = clamp(state.pitch + dy * state.rotateSpeed, state.minPitch, state.maxPitch);
    }

    function onPointerUp(ev) {
      state.pointers.delete(ev.pointerId);
      if (state.pointers.size === 0) {
        state.dragging = false;
        state.pinchStart = 0;
      } else if (state.pointers.size === 1) {
        const only = [...state.pointers.values()][0];
        state.dragging = true;
        state.lastX = only.x;
        state.lastY = only.y;
        state.pinchStart = 0;
      }
    }

    function onWheel(ev) {
      ev.preventDefault();
      const factor = ev.deltaY > 0 ? 1 + state.zoomSpeed : 1 - state.zoomSpeed;
      state.distance = clamp(state.distance * factor, state.minDist, state.maxDist);
    }

    function onContextMenu(ev) {
      ev.preventDefault();
    }

    function onKeyDown(ev) {
      if (ev.code === "KeyQ") state.yaw += 0.12;
      if (ev.code === "KeyE") state.yaw -= 0.12;
      if (ev.code === "Equal" || ev.code === "NumpadAdd") {
        state.distance = clamp(state.distance * 0.9, state.minDist, state.maxDist);
      }
      if (ev.code === "Minus" || ev.code === "NumpadSubtract") {
        state.distance = clamp(state.distance * 1.1, state.minDist, state.maxDist);
      }
    }

    domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    domElement.addEventListener("wheel", onWheel, { passive: false });
    domElement.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    domElement.style.touchAction = "none";

    if (opts.hint !== false) ensureHint(opts.hintText);

    // Init yaw from current camera if possible
    if (opts.bootstrap !== false && camera && camera.position) {
      const dx = camera.position.x - state.target.x;
      const dy = camera.position.y - state.target.y;
      const dz = camera.position.z - state.target.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 0.1) {
        state.distance = clamp(dist, state.minDist, state.maxDist);
        state.yaw = Math.atan2(dx, dz);
        state.pitch = clamp(Math.asin(dy / dist), state.minPitch, state.maxPitch);
      }
    }

    return {
      state,
      follow(x, y, z) {
        if (x && typeof x === "object") {
          state.target.x = x.x;
          state.target.y = (x.y != null ? x.y : 0) + (opts.lookOffsetY != null ? opts.lookOffsetY : 1.2);
          state.target.z = x.z;
        } else {
          state.target.x = x;
          state.target.y = y;
          state.target.z = z;
        }
        apply();
      },
      lookAt(x, y, z) {
        state.target.x = x;
        state.target.y = y;
        state.target.z = z;
        apply();
      },
      setDistance(d) {
        state.distance = clamp(d, state.minDist, state.maxDist);
      },
      rotate(dyaw, dpitch) {
        state.yaw += dyaw || 0;
        state.pitch = clamp(state.pitch + (dpitch || 0), state.minPitch, state.maxPitch);
      },
      dispose() {
        domElement.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        domElement.removeEventListener("wheel", onWheel);
        domElement.removeEventListener("contextmenu", onContextMenu);
        window.removeEventListener("keydown", onKeyDown);
      },
    };
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function ensureHint(text) {
    if (document.getElementById("amal-orbit-hint")) return;
    const el = document.createElement("div");
    el.id = "amal-orbit-hint";
    el.textContent =
      text ||
      "Камера: ПКМ + мышь · колёсико зум · Q/E поворот · на телефоне — палец / щипок";
    el.style.cssText =
      "position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:40;" +
      "padding:6px 12px;border-radius:8px;font:12px/1.3 system-ui,sans-serif;" +
      "background:rgba(0,0,0,.55);color:#fff;pointer-events:none;max-width:92vw;text-align:center;";
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .6s";
      el.style.opacity = "0.35";
    }, 5000);
  }

  global.AmalOrbitCam = { attach };
})(typeof window !== "undefined" ? window : globalThis);
