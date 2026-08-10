(() => {
  // Собственные текстуры/спрайты зомби (не ассеты EA): ткань, кожа, кадры ходьбы и укуса.
  const FW = 96;
  const FH = 112;
  const WALK_FRAMES = 6;
  const EAT_FRAMES = 4;

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function paintNoise(ctx, x, y, w, h, color, density, seed) {
    const rnd = mulberry32(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < density; i++) {
      const px = x + rnd() * w;
      const py = y + rnd() * h;
      ctx.fillRect(px, py, 1 + (rnd() > 0.7 ? 1 : 0), 1);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTexturedZombieFrame(ctx, opts) {
    const {
      kind,
      allergy,
      frame,
      eating,
      total,
    } = opts;
    const t = frame / Math.max(1, total);
    const bob = Math.sin(t * Math.PI * 2) * (eating ? 1.5 : 3);
    const legA = Math.sin(t * Math.PI * 2) * (eating ? 0.12 : 0.55);
    const armA = eating
      ? Math.sin(t * Math.PI * 2) * 0.7
      : Math.sin(t * Math.PI * 2 + 0.4) * 0.4;
    const cx = FW / 2;
    const cy = 58 + bob;

    const skin = allergy ? "#a8c878" : "#9ec98a";
    const skinDark = allergy ? "#7a9a55" : "#6f9a5c";
    const shirt = kind === "runner" ? "#d4e05a" : kind === "bucket" ? "#5d6a58" : "#6e8f55";
    const pants = "#3f5236";

    ctx.clearRect(0, 0, FW, FH);

    // soft shadow baked into sprite
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, 100, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs with fabric noise
    const drawLeg = (side, swing) => {
      const lx = cx + side * 7;
      const ly = cy + 22;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(side * swing);
      const g = ctx.createLinearGradient(-5, 0, 5, 28);
      g.addColorStop(0, pants);
      g.addColorStop(1, "#2a3726");
      ctx.fillStyle = g;
      roundRect(ctx, -5, 0, 10, 28, 3);
      ctx.fill();
      paintNoise(ctx, -4, 1, 8, 26, "rgba(255,255,255,0.08)", 18, 40 + side * 9 + frame);
      paintNoise(ctx, -4, 1, 8, 26, "rgba(0,0,0,0.12)", 14, 90 + side * 5 + frame);
      // shoe
      ctx.fillStyle = "#2a2218";
      roundRect(ctx, -6, 24, 13, 6, 2);
      ctx.fill();
      ctx.restore();
    };
    drawLeg(-1, -legA);
    drawLeg(1, legA);

    // torso cloth texture
    ctx.save();
    ctx.translate(cx, cy + 4);
    const bodyGrad = ctx.createLinearGradient(-16, -18, 16, 22);
    bodyGrad.addColorStop(0, shirt);
    bodyGrad.addColorStop(0.5, skin);
    bodyGrad.addColorStop(1, skinDark);
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, -15, -16, 30, 36, 10);
    ctx.fill();
    // shirt weave
    paintNoise(ctx, -14, -14, 28, 32, "rgba(255,255,255,0.1)", 55, 120 + frame);
    paintNoise(ctx, -14, -14, 28, 32, "rgba(0,0,0,0.14)", 40, 220 + frame);
    // torn edge
    ctx.strokeStyle = "rgba(40,50,30,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, 16);
    ctx.lineTo(-6, 12);
    ctx.lineTo(0, 17);
    ctx.lineTo(7, 11);
    ctx.lineTo(13, 16);
    ctx.stroke();
    ctx.restore();

    // arms
    const drawArm = (side, swing) => {
      ctx.save();
      ctx.translate(cx + side * 14, cy - 4);
      ctx.rotate(side * (0.2 + swing));
      const ag = ctx.createLinearGradient(0, 0, 0, 24);
      ag.addColorStop(0, skin);
      ag.addColorStop(1, skinDark);
      ctx.fillStyle = ag;
      roundRect(ctx, -4, 0, 8, 24, 3);
      ctx.fill();
      paintNoise(ctx, -3, 1, 6, 22, "rgba(0,80,0,0.12)", 12, 300 + side + frame);
      // hand
      ctx.fillStyle = skinDark;
      ctx.beginPath();
      ctx.arc(0, 24, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawArm(-1, -armA);
    drawArm(1, armA * (eating ? 1.3 : 1));

    // head with skin mottling texture
    ctx.save();
    ctx.translate(cx, cy - 22);
    const hg = ctx.createRadialGradient(-3, -4, 2, 0, 0, 16);
    hg.addColorStop(0, "#c5e3a8");
    hg.addColorStop(0.55, skin);
    hg.addColorStop(1, skinDark);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    paintNoise(ctx, -12, -12, 24, 24, "rgba(40,90,30,0.16)", 35, 500 + frame);
    paintNoise(ctx, -10, -8, 20, 18, "rgba(255,255,255,0.08)", 20, 700 + frame);

    // brow ridge
    ctx.fillStyle = "rgba(50,70,40,0.25)";
    ctx.fillRect(-10, -8, 20, 3);

    // eyes
    ctx.fillStyle = "#fff6d2";
    ctx.beginPath();
    ctx.ellipse(-5, -3, 3.4, 4.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(5, -3, 3.4, 4.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c2812";
    ctx.beginPath();
    ctx.arc(-4, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(6, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // mouth
    const open = eating ? 3 + Math.abs(Math.sin(t * Math.PI * 2)) * 5 : 2.2;
    ctx.fillStyle = "#3a2018";
    ctx.beginPath();
    ctx.ellipse(0, 7, 5.5, open, 0, 0, Math.PI * 2);
    ctx.fill();
    if (eating) {
      ctx.fillStyle = "#c84a3a";
      ctx.fillRect(-3.5, 5, 7, 2);
    }

    if (allergy) {
      ctx.fillStyle = "#ff6f6f";
      [
        [-9, 2],
        [8, 0],
        [-3, -10],
        [6, 8],
        [-7, 9],
      ].forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(x, y, 2.1 + (i % 2) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();

    // accessories
    if (kind === "cone") {
      ctx.save();
      ctx.translate(cx, cy - 36);
      const cg = ctx.createLinearGradient(-12, 0, 12, -28);
      cg.addColorStop(0, "#d97820");
      cg.addColorStop(0.5, "#f0a040");
      cg.addColorStop(1, "#ffd089");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(-13, 8);
      ctx.lineTo(0, -28);
      ctx.lineTo(13, 8);
      ctx.closePath();
      ctx.fill();
      paintNoise(ctx, -10, -20, 20, 28, "rgba(255,255,255,0.15)", 22, 900);
      ctx.fillStyle = "#ffe0a8";
      ctx.fillRect(-9, -4, 18, 3);
      ctx.restore();
    }

    if (kind === "bucket") {
      ctx.save();
      ctx.translate(cx, cy - 34);
      const bg = ctx.createLinearGradient(-14, -8, 14, 14);
      bg.addColorStop(0, "#c5ced3");
      bg.addColorStop(0.5, "#8e9aa2");
      bg.addColorStop(1, "#5f6a70");
      ctx.fillStyle = bg;
      roundRect(ctx, -15, -6, 30, 18, 3);
      ctx.fill();
      paintNoise(ctx, -14, -5, 28, 16, "rgba(255,255,255,0.2)", 30, 1100);
      ctx.strokeStyle = "#e8eef1";
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -6, 30, 18);
      ctx.beginPath();
      ctx.arc(0, -6, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (kind === "runner") {
      ctx.save();
      ctx.strokeStyle = "#f2f78a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 28);
      ctx.lineTo(cx - 18, cy + 40);
      ctx.moveTo(cx + 10, cy + 28);
      ctx.lineTo(cx + 18, cy + 40);
      ctx.stroke();
      ctx.restore();
    }

    if (allergy) {
      ctx.font = "16px sans-serif";
      ctx.fillText("🥜", cx + 14, cy - 40);
    }
  }

  function buildSheet(kind, allergy, mode) {
    const frames = mode === "eat" ? EAT_FRAMES : WALK_FRAMES;
    const sheet = makeCanvas(FW * frames, FH);
    const sctx = sheet.getContext("2d");
    for (let i = 0; i < frames; i++) {
      const frameCanvas = makeCanvas(FW, FH);
      const fctx = frameCanvas.getContext("2d");
      drawTexturedZombieFrame(fctx, {
        kind,
        allergy,
        frame: i,
        eating: mode === "eat",
        total: frames,
      });
      sctx.drawImage(frameCanvas, i * FW, 0);
    }
    return { canvas: sheet, frames, fw: FW, fh: FH };
  }

  const KINDS = ["normal", "runner", "cone", "bucket"];
  const atlas = {};
  KINDS.forEach((kind) => {
    atlas[kind] = {
      walk: buildSheet(kind, false, "walk"),
      eat: buildSheet(kind, false, "eat"),
      walkAllergy: buildSheet(kind, true, "walk"),
      eatAllergy: buildSheet(kind, true, "eat"),
    };
  });

  window.PVZ2_ZombieSprites = {
    FW,
    FH,
    WALK_FRAMES,
    EAT_FRAMES,
    atlas,
    getFrame(kind, allergy, eating, time) {
      const pack = atlas[kind] || atlas.normal;
      const sheet = allergy
        ? eating
          ? pack.eatAllergy
          : pack.walkAllergy
        : eating
          ? pack.eat
          : pack.walk;
      const fps = eating ? 8 : 7;
      const idx = Math.floor(time * fps) % sheet.frames;
      return { sheet, idx };
    },
  };
})();
