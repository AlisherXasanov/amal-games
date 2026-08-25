/**
 * Точка входа Amal 3D — импортируй из игр.
 *
 *   import { createApp, createOrbitCam, createWalkPlayer, THREE } from '../shared/amal-3d/index.js';
 */
export { createApp, THREE } from "./app.js";
export { createOrbitCam } from "./orbit.js";
export { createWalkPlayer } from "./player.js";
export { AMAL_THREE_VERSION, AMAL_THREE_CDN } from "./version.js";

/**
 * Мост для старых игр: кладёт THREE и хелперы в window, чтобы IIFE продолжали работать.
 */
export async function bootLegacyGlobals() {
  const { createApp, THREE } = await import("./app.js");
  const { createOrbitCam } = await import("./orbit.js");
  const { createWalkPlayer } = await import("./player.js");
  window.THREE = THREE;
  window.Amal3D = { createApp, createOrbitCam, createWalkPlayer, THREE };
  window.AmalOrbitCam = {
    attach(camera, dom, opts) {
      return createOrbitCam(camera, dom, opts);
    },
  };
  window.AmalWalkPlayer = {
    create(scene, _THREE, opts) {
      return createWalkPlayer(scene, THREE, opts);
    },
  };
  window.dispatchEvent(new Event("amal-3d-ready"));
  return { THREE, createApp, createOrbitCam, createWalkPlayer };
}
