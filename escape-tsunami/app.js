(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const LANES = [H * 0.72, H * 0.54, H * 0.36, H * 0.18];
  const MEMES = ["🧠", "🗿", "💀", "🔥", "✨", "🤡", "🍌", "👽"];
  const SAVE = "escape-tsunami-v3";

  let px = 90;
  let lane = 0;
  let targetLane = 0;
  let py = LANES[0];
  let waveX = -140;
  let waveW = 95;
  let coins = 0;
  let brains = 0;
  let waveN = 1;
  let alive = true;
  let sprint = 0;
  let safeCooldown = 0;
  let t = 0;
  const picks = [];
  let keys = {};

  function $(id) { return document.getElementById(id); }

  function toast(m) {
    const el = $("toast");
    el.textContent = m;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function waveSpeed() {
    return (2 + Math.min(waveN, 30) * 0.1) * (sprint > 0 ? 1.45 : 1);
  }

  function save() {
    try { localStorage.setItem(SAVE, JSON.stringify({ coins, brains, waveN })); } catch (_) {}
  }

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE) || "{}");
      if (d.coins != null) coins = Math.min(d.coins, 999999);
      if (d.brains != null) brains = Math.min(d.brains, 99999);
      if (d.waveN != null) waveN = Math.min(Math.max(1, d.waveN), 999);
    } catch (_) {}
  }

  function spawnPick() {
    const laneIdx = Math.floor(Math.random() * LANES.length);
    picks.push({
      x: W + 30 + Math.random() * 180,
      y: LANES[laneIdx],
      rare: Math.random() < 0.28,
      meme: MEMES[Math.floor(Math.random() * MEMES.length)],
    });
  }

  function resetRound(keepPos) {
    if (!keepPos) { px = 90; lane = 0; targetLane = 0; py = LANES[0]; }
    waveX = -140 - Math.min(waveN, 20) * 8;
    waveW = 90 + Math.min(waveN, 20) * 3;
    alive = true;
    sprint = 0;
    picks.length = 0;
    const n = Math.min(5 + waveN, 12);
    for (let i = 0; i < n; i++) spawnPick();
  }

  document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "ArrowUp" || e.key === "w") targetLane = Math.max(0, targetLane - 1);
    if (e.key === "ArrowDown" || e.key === "s") targetLane = Math.min(LANES.length - 1, targetLane + 1);
    if (e.key === " ") { sprint = 1.2; e.preventDefault(); }
  });
  document.addEventListener("keyup", (e) => { keys[e.key] = false; });

  $("btn-up").onclick = () => { targetLane = Math.max(0, targetLane - 1); };
  $("btn-down").onclick = () => { targetLane = Math.min(LANES.length - 1, targetLane + 1); };
  $("btn-sprint").onclick = () => { sprint = 1.2; toast("Спринт! ⚡"); };

  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, lastY: e.clientY };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.lastY;
    if (Math.abs(dy) > 14) {
      targetLane += dy < 0 ? -1 : 1;
      targetLane = Math.max(0, Math.min(LANES.length - 1, targetLane));
      drag.lastY = e.clientY;
    }
  });
  canvas.addEventListener("pointerup", () => { drag = null; });

  function drawWave() {
    const grd = ctx.createLinearGradient(waveX, 0, waveX + waveW, 0);
    grd.addColorStop(0, "rgba(14,165,233,0)");
    grd.addColorStop(0.45, "rgba(56,189,248,.88)");
    grd.addColorStop(1, "rgba(2,132,199,1)");
    ctx.fillStyle = grd;
    ctx.fillRect(waveX, 0, waveW, H);
    ctx.font = "32px serif";
    ctx.fillText("🌊", waveX + waveW * 0.5, H * 0.5 + Math.sin(t * 4) * 8);
    ctx.font = "bold 13px Nunito,sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText("ЦУНАМИ", waveX + 10, 22);
  }

  function trySafeZone() {
    const waveClose = waveX > 60;
    if (px > W - 62 && waveClose && safeCooldown <= 0) {
      waveN++;
      coins += 20 + Math.min(waveN, 25) * 2;
      brains += 1;
      safeCooldown = 4;
      toast("Сейф-зона! Волна " + waveN + " 🏁");
      px = 85;
      resetRound(true);
      save();
    }
  }

  function loop() {
    t += 0.016;
    const speed = waveSpeed();
    if (safeCooldown > 0) safeCooldown -= 0.016;
    if (sprint > 0) sprint -= 0.016;

    if (alive) {
      if (keys.ArrowRight || keys.d) px += 3.8 * speed;
      if (keys.ArrowLeft || keys.a) px -= 3.2;
      px = Math.max(50, Math.min(W - 48, px));

      const ty = LANES[targetLane];
      py += (ty - py) * 0.14;

      waveX += speed;
      picks.forEach((p) => { p.x -= speed * 0.9; });

      for (let i = picks.length - 1; i >= 0; i--) {
        const p = picks[i];
        if (p.x < -40) { picks.splice(i, 1); spawnPick(); continue; }
        if (Math.hypot(px - p.x, py - p.y) < 32) {
          picks.splice(i, 1);
          if (p.rare) { brains++; coins += 12; }
          else coins += 3;
          spawnPick();
        }
      }

      if (waveX + waveW * 0.25 > px - 8) {
        alive = false;
        toast("Волна догнала! 😱 Волна 1 снова");
        setTimeout(() => {
          waveN = 1;
          resetRound(false);
          save();
        }, 1200);
      }

      trySafeZone();
    }

    ctx.fillStyle = "#0e7490";
    ctx.fillRect(0, 0, W, H);
    LANES.forEach((ly, i) => {
      ctx.fillStyle = i % 2 ? "#155e75" : "#164e63";
      ctx.fillRect(0, ly - 28, W, 56);
      ctx.strokeStyle = "rgba(255,255,255,.12)";
      ctx.strokeRect(8, ly - 24, W - 16, 48);
    });

    picks.forEach((p) => {
      const bob = Math.sin(t * 5 + p.x * 0.02) * 4;
      ctx.font = p.rare ? "28px serif" : "20px serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(p.meme, p.x, p.y + bob);
      if (p.rare) {
        ctx.font = "bold 8px Nunito,sans-serif";
        ctx.fillStyle = "#fde047";
        ctx.fillText("RARE", p.x, p.y + bob + 16);
      }
    });

    drawWave();

    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.fillText(sprint > 0 ? "🏃‍♂️💨" : "🏃", px, py + 6);

    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.fillRect(W - 50, 10, 40, H - 20);
    ctx.fillStyle = safeCooldown > 0 ? "#6b7280" : "#4ade80";
    ctx.font = "18px serif";
    ctx.fillText("🏁", W - 30, H * 0.5);
    if (safeCooldown <= 0 && waveX > 60) {
      ctx.font = "bold 9px Nunito,sans-serif";
      ctx.fillStyle = "#bbf7d0";
      ctx.fillText("БЕГИ!", W - 30, H * 0.5 + 22);
    }

    $("coins").textContent = coins;
    $("brains").textContent = brains;
    $("wave").textContent = waveN;
    requestAnimationFrame(loop);
  }

  load();
  resetRound(false);
  toast("Беги от волны! Доберись до 🏁 когда она близко");
  loop();
})();
