(() => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const menu = document.getElementById("menu");
  const endOv = document.getElementById("end");
  const hud = document.getElementById("hud");
  const roleEl = document.getElementById("role");
  const timerEl = document.getElementById("timer");
  const noteEl = document.getElementById("note");
  const eventEl = document.getElementById("event");
  const endTitle = document.getElementById("endTitle");
  const endText = document.getElementById("endText");
  const locked = document.getElementById("locked");
  const seatHint = document.getElementById("seatHint");
  const exitBtn = document.getElementById("exitBtn");

  let W = 0,
    H = 0,
    dpr = 1;
  let mode = "normal"; // normal | realism
  let seat = "coco";
  let running = false;
  let t = 0;
  let nextEventAt = 0;
  let wind = 0;
  let windTarget = 0;
  let fallChance = 0;
  let state = "hang"; // hang | fall | done | calm
  let coco = { x: 0, y: 0, vx: 0, vy: 0, r: 24, angle: 0, spin: 0 };
  let attach = { x: 0, y: 0 };
  let sway = 0;
  let groundY = 0;
  let particles = [];
  let birds = [];
  let eventFlash = 0;
  let eventText = "";
  let realismPulse = 0;

  const EVENTS = [
    { text: "Подул ветер…", wind: 1.4, fall: 0.12 },
    { text: "Птица села рядом!", wind: 0.6, fall: 0.18 },
    { text: "Стебель скрипнул", wind: 0.3, fall: 0.22 },
    { text: "Облако закрыло солнце", wind: 0.1, fall: 0.05 },
    { text: "Сильный порыв!", wind: 2.2, fall: 0.35 },
    { text: "Тишина — только висишь", wind: 0, fall: 0.02 },
    { text: "Лист упал на кокос", wind: 0.4, fall: 0.1 },
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.82;
    attach.x = W * 0.52;
    attach.y = H * 0.22;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function setSeat(s) {
    seat = s;
    document.querySelectorAll(".seat").forEach((b) => {
      b.classList.toggle("on", b.dataset.seat === s);
    });
    seatHint.textContent =
      s === "coco"
        ? "Ты кокос — второй ничего не сможет."
        : "Ты второй — ничего не можешь, только смотреть. Выйти спокойно можно.";
  }

  document.querySelectorAll(".seat").forEach((b) => {
    b.addEventListener("click", () => setSeat(b.dataset.seat));
  });

  document.querySelectorAll(".mode").forEach((b) => {
    b.addEventListener("click", () => start(b.dataset.mode));
  });

  document.getElementById("again").addEventListener("click", () => {
    endOv.classList.add("hidden");
    goMenu();
  });

  exitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    calmExit();
  });

  function goMenu() {
    running = false;
    state = "hang";
    hud.hidden = true;
    exitBtn.classList.add("hidden");
    locked.classList.add("hidden");
    menu.classList.remove("hidden");
    endOv.classList.add("hidden");
    eventEl.textContent = "";
  }

  function calmExit() {
    if (!running) {
      goMenu();
      return;
    }
    // можно выйти не во время падения — и во время тоже спокойно
    running = false;
    state = "calm";
    hud.hidden = true;
    exitBtn.classList.add("hidden");
    locked.classList.add("hidden");
    endOv.classList.remove("hidden");
    endTitle.textContent = "Вышел спокойно";
    endText.textContent =
      "Не стал ждать падения. Можно снова в меню или открыть картинку с новым котиком.";
  }

  function start(m) {
    mode = m;
    menu.classList.add("hidden");
    endOv.classList.add("hidden");
    running = true;
    state = "hang";
    t = 0;
    wind = 0;
    windTarget = 0.35;
    fallChance = 0;
    sway = 0;
    eventFlash = 0;
    eventText = "";
    nextEventAt = mode === "normal" ? rand(2.5, 5) : 99999;
    coco.r = 24;
    coco.vx = 0;
    coco.vy = 0;
    coco.spin = 0;
    coco.angle = 0;
    particles = [];
    birds = [];
    if (mode === "normal") {
      for (let i = 0; i < 3; i++) {
        birds.push({
          x: rand(-40, W + 40),
          y: rand(40, H * 0.35),
          vx: rand(18, 40) * (Math.random() < 0.5 ? -1 : 1),
          phase: rand(0, Math.PI * 2),
        });
      }
    }
    placeHang();
    hud.hidden = false;
    exitBtn.classList.remove("hidden");
    if (seat === "coco") {
      roleEl.textContent = "Ты — кокос";
      noteEl.textContent =
        mode === "realism"
          ? "Реализм: не двигаешься и не слышишь"
          : "Обычный: висишь · ветер · события · можно выйти";
      locked.classList.add("hidden");
    } else {
      roleEl.textContent = "Ты — второй";
      noteEl.textContent = "Ничего не можешь сделать";
      locked.classList.remove("hidden");
    }
    timerEl.textContent = mode === "realism" ? "—" : "висишь";
    eventEl.textContent = "";
  }

  function placeHang() {
    const ang = Math.sin(sway) * (0.18 + wind * 0.2);
    const stem = 58;
    coco.x = attach.x + Math.sin(ang) * stem;
    coco.y = attach.y + Math.cos(ang) * stem;
    coco.angle = ang;
  }

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x,
        y,
        vx: rand(-90, 90),
        vy: rand(-160, -40),
        life: rand(0.4, 1.1),
        r: rand(2, 5),
        c: Math.random() < 0.5 ? "#6b3a1a" : "#c4a574",
      });
    }
  }

  function triggerFall(reason) {
    if (state !== "hang") return;
    state = "fall";
    coco.vx = rand(-50, 60) + wind * 30;
    coco.vy = 30;
    coco.spin = rand(2.5, 5.5) * (Math.random() < 0.5 ? -1 : 1);
    noteEl.textContent = seat === "other" ? "Смотри — падает" : "Падаешь!";
    eventEl.textContent = reason || "Упал от ветра";
  }

  function fireEvent() {
    const ev = EVENTS[(Math.random() * EVENTS.length) | 0];
    eventText = ev.text;
    eventFlash = 2.2;
    eventEl.textContent = "⚡ " + ev.text;
    windTarget = Math.min(2.8, windTarget + ev.wind);
    fallChance += ev.fall;
    if (Math.random() < fallChance) {
      triggerFall(ev.text);
    }
    nextEventAt = t + rand(3, 7);
  }

  function finishFall() {
    running = false;
    state = "done";
    exitBtn.classList.add("hidden");
    endOv.classList.remove("hidden");
    if (seat === "other") {
      endTitle.textContent = "Он упал";
      endText.textContent = "Ты ничего не сделал — так и задумано.";
    } else {
      endTitle.textContent = "Бух!";
      endText.textContent = "Кокос упал. Можно выйти в меню или посмотреть нового котика.";
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (running) update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    t += dt;
    realismPulse += dt;

    if (mode === "realism") {
      timerEl.textContent = Math.floor(t) + " с тишины";
      eventEl.textContent = "";
      return;
    }

    // normal mode
    wind += (windTarget - wind) * Math.min(1, dt * 1.5);
    windTarget += (0.25 - windTarget) * dt * 0.15;
    if (eventFlash > 0) eventFlash -= dt;

    if (state === "hang") {
      sway += dt * (1.1 + wind * 0.9);
      placeHang();
      timerEl.textContent = "висишь · ветер " + wind.toFixed(1);
      if (t >= nextEventAt) fireEvent();
      // сильный ветер сам может сорвать
      if (wind > 2.1 && Math.random() < dt * 0.25) {
        triggerFall("Сильный ветер сорвал!");
      }
    } else if (state === "fall") {
      coco.vy += 980 * dt * 0.55;
      coco.x += coco.vx * dt;
      coco.y += coco.vy * dt;
      coco.angle += coco.spin * dt;
      timerEl.textContent = "падение";
      if (coco.y + coco.r >= groundY - 4) {
        coco.y = groundY - 4 - coco.r;
        burst(coco.x, coco.y + coco.r, 18);
        finishFall();
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += 400 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    birds.forEach((b) => {
      b.x += b.vx * dt;
      b.phase += dt * 8;
      if (b.x < -60) b.x = W + 40;
      if (b.x > W + 60) b.x = -40;
    });
  }

  function drawRealism() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f4f1e8";
    ctx.textAlign = "center";
    ctx.font = "800 15px Nunito,sans-serif";
    ctx.globalAlpha = 0.85 + Math.sin(realismPulse * 1.2) * 0.08;
    ctx.fillText("РЕЖИМ РЕАЛИЗМ", W / 2, H * 0.38);
    ctx.font = "800 18px Fraunces,Georgia,serif";
    ctx.globalAlpha = 1;
    ctx.fillText("Кокос не может двигаться", W / 2, H * 0.48);
    ctx.fillText("и слышать", W / 2, H * 0.54);
    ctx.font = "700 13px Nunito,sans-serif";
    ctx.fillStyle = "#888";
    ctx.fillText("Чёрный экран. Можно выйти спокойно.", W / 2, H * 0.66);
    ctx.fillText("↓ кнопка сверху справа", W / 2, H * 0.72);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#7ec8e8");
    g.addColorStop(0.45, "#b8e4f2");
    g.addColorStop(1, "#e8d5a3");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.fillStyle = "#ffe29a";
    ctx.arc(W * 0.82, H * 0.14, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,226,154,0.25)";
    ctx.arc(W * 0.82, H * 0.14, 70, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround() {
    ctx.fillStyle = "#d2b48c";
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = "#c4a574";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 24) {
      ctx.lineTo(x, groundY - 6 - Math.sin(x * 0.04) * 4);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();
  }

  function drawPalm() {
    const trunkTopX = attach.x;
    const trunkTopY = attach.y + 8;
    const baseX = W * 0.48;
    const baseY = groundY;
    ctx.strokeStyle = "#6b4423";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(W * 0.42, H * 0.55, trunkTopX, trunkTopY);
    ctx.stroke();
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(baseX + 4, baseY);
    ctx.quadraticCurveTo(W * 0.43, H * 0.55, trunkTopX + 3, trunkTopY);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.85 + (i / 6) * Math.PI * 1.1;
      const len = 70 + (i % 2) * 18;
      const wob = Math.sin(t * 1.2 + i + wind) * (0.08 + wind * 0.04);
      ctx.strokeStyle = i % 2 ? "#1f7a45" : "#2d9a58";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(trunkTopX, trunkTopY - 4);
      ctx.quadraticCurveTo(
        trunkTopX + Math.cos(a + wob) * len * 0.55,
        trunkTopY + Math.sin(a + wob) * len * 0.35 - 20,
        trunkTopX + Math.cos(a + wob) * len,
        trunkTopY + Math.sin(a + wob) * len * 0.55
      );
      ctx.stroke();
    }
  }

  function drawStem() {
    if (state !== "hang") return;
    ctx.strokeStyle = "#4a7a38";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(attach.x, attach.y + 6);
    ctx.lineTo(coco.x, coco.y - coco.r * 0.7);
    ctx.stroke();
  }

  function drawCoconut() {
    ctx.save();
    ctx.translate(coco.x, coco.y);
    ctx.rotate(coco.angle);
    const body = ctx.createRadialGradient(-6, -8, 4, 0, 0, coco.r);
    body.addColorStop(0, "#c49a6c");
    body.addColorStop(0.55, "#8b5a2b");
    body.addColorStop(1, "#4a2c14");
    ctx.beginPath();
    ctx.fillStyle = body;
    ctx.ellipse(0, 0, coco.r * 0.92, coco.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(40,20,8,0.35)";
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, coco.r * 0.55, coco.r * 0.85, i * 0.2, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = "#1a120c";
    ctx.beginPath();
    ctx.arc(-6, -2, 2.2, 0, Math.PI * 2);
    ctx.arc(6, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8";
    ctx.beginPath();
    ctx.arc(-6.6, -2.6, 0.7, 0, Math.PI * 2);
    ctx.arc(5.4, -2.6, 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,240,200,0.22)";
    ctx.ellipse(-7, -9, 5, 3.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (running || state === "done") {
      const sy = groundY - 2;
      const scale = Math.max(0.15, 1 - (sy - coco.y) / (H * 0.7));
      ctx.beginPath();
      ctx.fillStyle = "rgba(40,30,10,0.22)";
      ctx.ellipse(coco.x, sy, coco.r * 0.9 * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBirds() {
    birds.forEach((b) => {
      const flap = Math.sin(b.phase) * 4;
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x - 7, b.y + flap);
      ctx.quadraticCurveTo(b.x, b.y - 3, b.x + 7, b.y + flap);
      ctx.stroke();
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawIdleScene() {
    drawSky();
    groundY = H * 0.82;
    attach.x = W * 0.52;
    attach.y = H * 0.22;
    drawGround();
    const savedT = t;
    t = performance.now() / 1000;
    wind = 0.4;
    drawPalm();
    sway = t;
    placeHang();
    drawStem();
    drawCoconut();
    t = savedT;
  }

  function draw() {
    if (!running && !menu.classList.contains("hidden")) {
      drawIdleScene();
      return;
    }
    if (running && mode === "realism") {
      drawRealism();
      return;
    }
    if (!running && endOv && !endOv.classList.contains("hidden") && mode === "realism") {
      drawRealism();
      return;
    }
    drawSky();
    drawBirds();
    drawGround();
    drawPalm();
    drawStem();
    drawCoconut();
    drawParticles();
  }

  // Второй игрок ничего не может — но выход спокойно и меню не блокируем
  function blockIfOther(e) {
    if (!running || seat !== "other") return;
    const t = e.target;
    if (t && (t.id === "exitBtn" || t.id === "backHome" || t.closest && (t.closest("#exitBtn") || t.closest("#backHome") || t.closest(".cats-link")))) {
      return;
    }
    if (t && (t.id === "again" || (t.closest && t.closest("#end")))) return;
    e.preventDefault();
    e.stopPropagation();
    locked.classList.remove("hidden");
  }
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => {
    window.addEventListener(ev, blockIfOther, true);
  });

  window.addEventListener("resize", resize);
  resize();
  setSeat("coco");
  requestAnimationFrame(frame);
})();
