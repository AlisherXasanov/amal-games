(() => {
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const menu = document.getElementById("menu");
  const endOv = document.getElementById("end");
  const hud = document.getElementById("hud");
  const roleEl = document.getElementById("role");
  const timerEl = document.getElementById("timer");
  const noteEl = document.getElementById("note");
  const endTitle = document.getElementById("endTitle");
  const endText = document.getElementById("endText");
  const locked = document.getElementById("locked");
  const seatHint = document.getElementById("seatHint");

  let W = 0,
    H = 0,
    dpr = 1;
  let mode = "realism"; // realism | skill
  let seat = "coco"; // coco | other
  let running = false;
  let t = 0;
  let hangUntil = 0;
  let state = "hang"; // hang | fall | done
  let coco = { x: 0, y: 0, vx: 0, vy: 0, r: 22, angle: 0, spin: 0 };
  let attach = { x: 0, y: 0 };
  let sway = 0;
  let groundY = 0;
  let particles = [];
  let birds = [];

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
        : "Ты второй — когда кокос играет, ты ничего не можешь сделать. Только смотреть.";
  }

  document.querySelectorAll(".seat").forEach((b) => {
    b.addEventListener("click", () => setSeat(b.dataset.seat));
  });

  document.querySelectorAll(".mode").forEach((b) => {
    b.addEventListener("click", () => start(b.dataset.mode));
  });

  document.getElementById("again").addEventListener("click", () => {
    endOv.classList.add("hidden");
    menu.classList.remove("hidden");
  });

  function start(m) {
    mode = m;
    menu.classList.add("hidden");
    endOv.classList.add("hidden");
    running = true;
    state = "hang";
    t = 0;
    hangUntil = mode === "skill" ? rand(8, 14) : rand(6, 12);
    sway = 0;
    coco.r = mode === "skill" ? 20 : 24;
    coco.vx = 0;
    coco.vy = 0;
    coco.spin = 0;
    coco.angle = 0;
    particles = [];
    birds = [];
    for (let i = 0; i < 3; i++) {
      birds.push({
        x: rand(-40, W + 40),
        y: rand(40, H * 0.35),
        vx: rand(18, 40) * (Math.random() < 0.5 ? -1 : 1),
        phase: rand(0, Math.PI * 2),
      });
    }
    placeHang();
    hud.hidden = false;
    if (seat === "coco") {
      roleEl.textContent = "Ты — кокос";
      noteEl.textContent =
        mode === "skill"
          ? "Скилл: не видишь и не двигаешься"
          : "Реализм: висишь, качаешься, потом упадёшь";
      locked.classList.add("hidden");
    } else {
      roleEl.textContent = "Ты — второй";
      noteEl.textContent = "Ничего не можешь сделать";
      locked.classList.remove("hidden");
    }
  }

  function placeHang() {
    const ang = mode === "skill" ? 0 : Math.sin(sway) * 0.28;
    const stem = mode === "skill" ? 48 : 58;
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

  function finish() {
    running = false;
    state = "done";
    endOv.classList.remove("hidden");
    if (seat === "other") {
      endTitle.textContent = "Он упал";
      endText.textContent = "Ты ничего не сделал — так и задумано. Кокос сам упал.";
    } else if (mode === "skill") {
      endTitle.textContent = "Упал (скилл)";
      endText.textContent =
        "Ты не видел и не двигался — и всё равно упал. Это и есть режим «Скилл».";
    } else {
      endTitle.textContent = "Бух!";
      endText.textContent = "Кокос реалистично отвис и упал на песок. Можно ещё раз.";
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
    if (state === "hang") {
      if (mode === "realism") {
        sway += dt * 1.35;
        placeHang();
      } else {
        // skill: no sway, blind coconut
        placeHang();
      }
      const left = Math.max(0, hangUntil - t);
      timerEl.textContent = left > 0 ? "ещё " + left.toFixed(1) + " с" : "…";
      if (t >= hangUntil) {
        state = "fall";
        coco.vx = mode === "skill" ? rand(-20, 20) : rand(-40, 55);
        coco.vy = 20;
        coco.spin = mode === "skill" ? 0.6 : rand(2.5, 5.5) * (Math.random() < 0.5 ? -1 : 1);
        noteEl.textContent = seat === "other" ? "Смотри — падает" : "Падаешь!";
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
        finish();
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

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (mode === "skill" && running) {
      g.addColorStop(0, "#1a2430");
      g.addColorStop(0.55, "#2a3a48");
      g.addColorStop(1, "#3d4a3a");
    } else {
      g.addColorStop(0, "#7ec8e8");
      g.addColorStop(0.45, "#b8e4f2");
      g.addColorStop(1, "#e8d5a3");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // sun
    if (!(mode === "skill" && running)) {
      ctx.beginPath();
      ctx.fillStyle = "#ffe29a";
      ctx.arc(W * 0.82, H * 0.14, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,226,154,0.25)";
      ctx.arc(W * 0.82, H * 0.14, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGround() {
    ctx.fillStyle = mode === "skill" && running ? "#3a4030" : "#d2b48c";
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = mode === "skill" && running ? "#2e3428" : "#c4a574";
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

    // trunk
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

    // fronds
    const frondN = 7;
    for (let i = 0; i < frondN; i++) {
      const a = -Math.PI * 0.85 + (i / (frondN - 1)) * Math.PI * 1.1;
      const len = 70 + (i % 2) * 18;
      const wob = mode === "skill" && running ? 0 : Math.sin(t * 1.2 + i) * 0.08;
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

    // shadow on ground when falling near
    if (state === "fall") {
      const shadowY = groundY - coco.y;
      // drawn outside
    }

    // body
    const body = ctx.createRadialGradient(-6, -8, 4, 0, 0, coco.r);
    body.addColorStop(0, "#c49a6c");
    body.addColorStop(0.55, "#8b5a2b");
    body.addColorStop(1, "#4a2c14");
    ctx.beginPath();
    ctx.fillStyle = body;
    ctx.ellipse(0, 0, coco.r * 0.92, coco.r, 0, 0, Math.PI * 2);
    ctx.fill();

    // fiber lines
    ctx.strokeStyle = "rgba(40,20,8,0.35)";
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, coco.r * 0.55, coco.r * 0.85, i * 0.2, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // eyes
    if (mode === "skill" && (state === "hang" || state === "fall")) {
      // closed eyes — doesn't see
      ctx.strokeStyle = "#2a1810";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.quadraticCurveTo(-5, 1, -2, -2);
      ctx.moveTo(2, -2);
      ctx.quadraticCurveTo(5, 1, 8, -2);
      ctx.stroke();
    } else {
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
    }

    // highlight
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,240,200,0.22)";
    ctx.ellipse(-7, -9, 5, 3.5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ground shadow
    if (running) {
      const sy = groundY - 2;
      const scale = Math.max(0.15, 1 - (sy - coco.y) / (H * 0.7));
      ctx.beginPath();
      ctx.fillStyle = "rgba(40,30,10,0.22)";
      ctx.ellipse(coco.x, sy, coco.r * 0.9 * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBirds() {
    if (mode === "skill" && running) return;
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
    const saved = mode;
    mode = "realism";
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#6eb8d8");
    g.addColorStop(0.5, "#c5e6f0");
    g.addColorStop(1, "#e0c98a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    groundY = H * 0.82;
    attach.x = W * 0.52;
    attach.y = H * 0.22;
    drawGround();
    drawPalm();
    sway = performance.now() / 1000;
    placeHang();
    drawStem();
    drawCoconut();
    mode = saved;
  }

  function draw() {
    if (!running && menu && !menu.classList.contains("hidden")) {
      drawIdleScene();
      return;
    }
    drawSky();
    drawBirds();
    drawGround();
    drawPalm();
    drawStem();
    drawCoconut();
    drawParticles();

    if (mode === "skill" && running && state === "hang") {
      // vignette — "doesn't see"
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(244,241,232,0.7)";
      ctx.font = "800 13px Nunito,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("режим Скилл · кокос не видит и не двигается", W / 2, H - 28);
    }
  }

  // Block input for "other" seat during run — nothing they can do
  function blockIfOther(e) {
    if (running && seat === "other") {
      e.preventDefault();
      e.stopPropagation();
      locked.classList.remove("hidden");
    }
  }
  ["pointerdown", "keydown", "touchstart", "click"].forEach((ev) => {
    window.addEventListener(ev, blockIfOther, true);
  });

  window.addEventListener("resize", resize);
  resize();
  setSeat("coco");
  requestAnimationFrame(frame);
})();
