/**
 * Шарик и кольца — дыры в кольцах + прокачка, 20 уровней.
 */
(function () {
  const SAVE = "amal-ring-ball-v1";
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const toastEl = document.getElementById("toast");

  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  let state = { coins: 0, level: 1, spdLv: 0, holeLv: 0, bounceLv: 0 };
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE) || "null");
      if (d) Object.assign(state, d);
    } catch (_) {}
  }
  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify(state));
    } catch (_) {}
  }

  function spdMul() {
    return 1 + state.spdLv * 0.1;
  }
  function gapHalf() {
    return 0.45 + state.holeLv * 0.07;
  }
  function jumpPower() {
    return 9 + state.bounceLv * 1.5;
  }

  const rings = [];
  let ball = { y: 0, vy: 0, r: 15 };
  let alive = true;
  let toastT = 0;
  let camY = 0;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    toastT = 1.9;
  }

  function angNorm(a) {
    while (a < -Math.PI) a += Math.PI * 2;
    while (a > Math.PI) a -= Math.PI * 2;
    return a;
  }

  function syncHud() {
    document.getElementById("lvl").textContent = state.level;
    document.getElementById("coins").textContent = Math.floor(state.coins);
    document.getElementById("spd").textContent = String(1 + state.spdLv);
    document.getElementById("hole").textContent = String(1 + state.holeLv);
    document.getElementById("upSpd").textContent = "⚡ Скорость · 🪙" + (20 + state.spdLv * 25);
    document.getElementById("upHole").textContent = "🕳 Дыра · 🪙" + (25 + state.holeLv * 30);
    document.getElementById("upBounce").textContent = "🔼 Прыжок · 🪙" + (18 + state.bounceLv * 22);
  }

  function buildLevel() {
    rings.length = 0;
    const n = Math.min(7 + Math.floor(state.level * 0.55), 15);
    const spin = (0.7 + state.level * 0.045) * (state.level % 2 ? 1 : -1);
    const R = Math.min(innerWidth, 440) * 0.3;
    const startY = innerHeight * 0.42;
    for (let i = 0; i < n; i++) {
      rings.push({
        y: startY + i * 56,
        angle: Math.random() * Math.PI * 2,
        gap: gapHalf(),
        spin: spin * (0.85 + Math.random() * 0.35),
        radius: R,
        h: 16,
        done: false,
      });
    }
    ball.y = rings[0].y - 50;
    ball.vy = 0;
    alive = true;
    camY = ball.y - innerHeight * 0.38;
    syncHud();
  }

  function jump() {
    if (!alive) {
      buildLevel();
      return;
    }
    ball.vy = -jumpPower();
  }

  addEventListener("pointerdown", (e) => {
    if (e.target.closest("#shop") || e.target.closest(".back")) return;
    jump();
  });
  addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
  });

  function buy(kind) {
    if (kind === "spd") {
      const c = 20 + state.spdLv * 25;
      if (state.coins < c) return toast("Нужно 🪙 " + c);
      state.coins -= c;
      state.spdLv++;
      toast("⚡ Быстрее");
    } else if (kind === "hole") {
      const c = 25 + state.holeLv * 30;
      if (state.coins < c) return toast("Нужно 🪙 " + c);
      state.coins -= c;
      state.holeLv++;
      rings.forEach((r) => {
        r.gap = gapHalf();
      });
      toast("🕳 Дыра шире");
    } else {
      const c = 18 + state.bounceLv * 22;
      if (state.coins < c) return toast("Нужно 🪙 " + c);
      state.coins -= c;
      state.bounceLv++;
      toast("🔼 Прыжок");
    }
    save();
    syncHud();
  }

  document.getElementById("upSpd").onclick = () => buy("spd");
  document.getElementById("upHole").onclick = () => buy("hole");
  document.getElementById("upBounce").onclick = () => buy("bounce");

  function winLevel() {
    state.coins += 12 + state.level * 4;
    if (state.level < 20) {
      state.level++;
      toast("🎉 Уровень " + state.level + "!");
    } else toast("🏆 Все 20 уровней!");
    save();
    buildLevel();
  }

  function drawRing(ring, cx) {
    const palette = ["#38bdf8", "#a78bfa", "#f472b6", "#4ade80", "#fbbf24", "#fb923c"];
    const col = palette[rings.indexOf(ring) % palette.length];
    ctx.save();
    ctx.translate(cx, ring.y);
    ctx.rotate(ring.angle);
    ctx.strokeStyle = col;
    ctx.lineWidth = ring.h;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.arc(0, 0, ring.radius, ring.gap, Math.PI * 2 - ring.gap);
    ctx.stroke();
    // gap highlight
    ctx.fillStyle = "rgba(253,224,71,.22)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, ring.radius + 6, -ring.gap, ring.gap);
    ctx.fill();
    ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    const w = innerWidth;
    const h = innerHeight;
    const cx = w / 2;

    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0284c7");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (alive) {
      ball.vy += 26 * dt * spdMul();
      if (ball.vy > 20) ball.vy = 20;
      ball.y += ball.vy * 60 * dt;

      rings.forEach((r) => {
        r.spin && (r.angle += r.spin * dt);
      });

      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];
        const top = ring.y - ring.h * 0.5;
        const bot = ring.y + ring.h * 0.5;
        if (ball.vy >= 0 && ball.y + ball.r >= top && ball.y - ball.r <= bot + 2) {
          // ball always "at angle 0" (front); gap centered on ring.angle
          const d = Math.abs(angNorm(0 - ring.angle));
          if (d <= ring.gap) {
            if (!ring.done) {
              ring.done = true;
              state.coins += 2 + Math.floor(state.level / 3);
              syncHud();
            }
          } else {
            alive = false;
            toast("💥 Обод! Тап — заново");
            save();
            break;
          }
        }
      }

      const lastR = rings[rings.length - 1];
      if (lastR && ball.y > lastR.y + 55) {
        const ok = rings.every((r) => r.done);
        if (ok) winLevel();
        else {
          alive = false;
          toast("Не все кольца · тап — ещё");
          save();
        }
      }

      camY += (ball.y - h * 0.38 - camY) * Math.min(1, dt * 8);
    }

    ctx.save();
    ctx.translate(0, -camY);
    rings.forEach((r) => drawRing(r, cx));
    ctx.beginPath();
    ctx.arc(cx, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = alive ? "#fde68a" : "#f87171";
    ctx.shadowColor = alive ? "#fbbf24" : "#ef4444";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.style.display = "none";
    }
    requestAnimationFrame(frame);
  }

  load();
  buildLevel();
  toast("Шарик и кольца — прыгай в жёлтую дыру!");
  requestAnimationFrame(frame);
})();
