(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const LANES = [H * 0.72, H * 0.54, H * 0.36, H * 0.18];
  const MEMES = ["🧠", "🗿", "💀", "🔥", "✨", "🤡", "🍌", "👽"];

  let px = 80;
  let lane = 0;
  let targetLane = 0;
  let py = LANES[0];
  let waveX = -120;
  let waveW = 90;
  let coins = 0;
  let brains = 0;
  let waveN = 1;
  let alive = true;
  let sprint = 0;
  let t = 0;
  const picks = [];
  let keys = {};

  function $(id) { return document.getElementById(id); }

  function toast(m) {
    const el = document.getElementById("toast");
    el.textContent = m;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function spawnPick() {
    const laneIdx = Math.floor(Math.random() * LANES.length);
  const rare = Math.random() < 0.35;
    picks.push({
      x: W + 40 + Math.random() * 200,
      lane: laneIdx,
      y: LANES[laneIdx],
      rare,
      meme: MEMES[Math.floor(Math.random() * MEMES.length)],
      got: false,
    });
  }

  function reset(full) {
    if (full) { px = 80; lane = 0; targetLane = 0; py = LANES[0]; }
    waveX = -120 - waveN * 10;
    waveW = 85 + waveN * 5;
    alive = true;
    sprint = 0;
    picks.length = 0;
    for (let i = 0; i < 5 + waveN; i++) spawnPick();
    if (full) toast("Беги от волны! 🌊");
  }

  document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "ArrowUp" || e.key === "w") targetLane = Math.max(0, targetLane - 1);
    if (e.key === "ArrowDown" || e.key === "s") targetLane = Math.min(LANES.length - 1, targetLane + 1);
    if (e.key === " ") sprint = 1.2;
  });
  document.addEventListener("keyup", (e) => { keys[e.key] = false; });

  $("btn-up").onclick = () => { targetLane = Math.max(0, targetLane - 1); };
  $("btn-down").onclick = () => { targetLane = Math.min(LANES.length - 1, targetLane + 1); };
  $("btn-sprint").onclick = () => { sprint = 1.4; toast("Спринт! ⚡"); };

  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    px += (e.clientX - drag.x) * 0.6;
    drag.x = e.clientX;
    const dy = e.clientY - drag.y;
    if (Math.abs(dy) > 18) {
      targetLane += dy < 0 ? -1 : 1;
      targetLane = Math.max(0, Math.min(LANES.length - 1, targetLane));
      drag.y = e.clientY;
    }
  });
  canvas.addEventListener("pointerup", () => { drag = null; });

  function drawWave() {
    const grd = ctx.createLinearGradient(waveX, 0, waveX + waveW, 0);
    grd.addColorStop(0, "rgba(14,165,233,0)");
    grd.addColorStop(0.4, "rgba(56,189,248,.9)");
    grd.addColorStop(1, "rgba(2,132,199,1)");
    ctx.fillStyle = grd;
    ctx.fillRect(waveX, 0, waveW, H);
    ctx.font = "32px serif";
    ctx.fillText("🌊", waveX + waveW * 0.55, H * 0.5 + Math.sin(t * 4) * 8);
    ctx.font = "bold 14px Nunito,sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText("ЦУНАМИ", waveX + 12, 24);
  }

  function loop() {
    t += 0.016;
    const speed = (2.2 + waveN * 0.15) * (sprint > 0 ? 1.55 : 1);
    if (sprint > 0) sprint -= 0.016;

    if (alive) {
      if (keys.ArrowRight || keys.d) px += 4.5 * speed;
      if (keys.ArrowLeft || keys.a) px -= 3.5;
      px = Math.max(40, Math.min(W - 40, px));
      px += 0.35 * speed;

      lane += (targetLane - lane) * 0.14;
      py = LANES[Math.round(lane)] || LANES[0];
      const ty = LANES[targetLane];
      py += (ty - py) * 0.12;

      waveX += speed;
      picks.forEach((p) => { p.x -= speed * 0.85; });

      for (let i = picks.length - 1; i >= 0; i--) {
        const p = picks[i];
        if (p.x < -30) { picks.splice(i, 1); spawnPick(); continue; }
        if (Math.hypot(px - p.x, py - p.y) < 34) {
          picks.splice(i, 1);
          if (p.rare) {
            brains++;
            coins += 15;
            toast(p.meme + " brainrot! +15");
          } else {
            coins += 4;
          }
          spawnPick();
        }
      }

      if (waveX + waveW * 0.3 > px - 10) {
        alive = false;
        toast("Волна догнала! 😱");
        setTimeout(() => { waveN = Math.max(1, waveN); reset(true); }, 1400);
      }

      if (px > W - 50) {
        waveN++;
        coins += 25 + waveN * 5;
        toast("Сейф-зона! Волна " + waveN);
        px = 60;
        reset(false);
      }
    }

    ctx.fillStyle = "#0e7490";
    ctx.fillRect(0, 0, W, H);
    LANES.forEach((ly, i) => {
      ctx.fillStyle = i % 2 ? "#155e75" : "#164e63";
      ctx.fillRect(0, ly - 28, W, 56);
      ctx.strokeStyle = "rgba(255,255,255,.15)";
      ctx.strokeRect(8, ly - 24, W - 16, 48);
    });

    picks.forEach((p) => {
      const bob = Math.sin(t * 5 + p.x * 0.02) * 4;
      ctx.font = p.rare ? "30px serif" : "22px serif";
      ctx.textAlign = "center";
      ctx.fillText(p.meme, p.x, p.y + bob);
      if (p.rare) {
        ctx.font = "9px Nunito,sans-serif";
        ctx.fillStyle = "#fde047";
        ctx.fillText("RARE", p.x, p.y + bob + 18);
        ctx.fillStyle = "#fff";
      }
    });

    drawWave();

    ctx.font = "38px serif";
    ctx.textAlign = "center";
    ctx.fillText(sprint > 0 ? "🏃‍♂️💨" : "🏃", px, py + 6);

    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(W - 52, 8, 44, H - 16);
    ctx.fillStyle = "#4ade80";
    ctx.font = "20px serif";
    ctx.fillText("🏁", W - 30, H * 0.5);

    $("coins").textContent = coins;
    $("brains").textContent = brains;
    $("wave").textContent = waveN;
    requestAnimationFrame(loop);
  }

  reset(true);
  loop();
})();
