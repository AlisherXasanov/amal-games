# Amal 3D — общий каркас

Как обычно делают браузерные 3D-игры:

1. **Одна версия Three.js** — `0.160.0`
2. **Общие модули** — сцена, камера, игрок, цикл
3. Игра подключает каркас, а не копирует движок заново

## Файлы

| Файл | Назначение |
|------|------------|
| `app.js` | `createApp()` — сцена, камера, рендерер, цикл |
| `orbit.js` | Камера от 3-го лица (ПКМ / тач) |
| `player.js` | WASD-игрок |
| `legacy-boot.js` | Мост для старых HTML-игр |
| `index.js` | Точка входа ESM |

## Новая игра (как у людей)

```html
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js" } }
</script>
<script type="module" src="./main.js"></script>
```

```js
import { createApp, createOrbitCam, createWalkPlayer } from "../shared/amal-3d/index.js";

const app = createApp({ bg: 0x87ceeb, shadows: true, fogFar: 120 });
const orbit = createOrbitCam(app.camera, app.canvas, { distance: 10 });
const player = createWalkPlayer(app.scene, app.THREE, { x: 0, z: 0 });

app.start((dt) => {
  player.update(dt, orbit);
  orbit.follow(player.mesh.position);
});
```
