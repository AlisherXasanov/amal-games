/**
 * Amal 3D — общий каркас браузерных 3D-игр (как делают обычно).
 * Одна версия Three.js, сцена / рендерер / цикл / камера / игрок.
 */
export const AMAL_THREE_VERSION = "0.160.0";
export const AMAL_THREE_CDN =
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/** Готовый importmap для HTML */
export function importMapJson() {
  return JSON.stringify(
    {
      imports: {
        three: AMAL_THREE_CDN,
        "amal-3d/": "./",
      },
    },
    null,
    2
  );
}
