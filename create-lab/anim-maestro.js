/**
 * Маэстро — «режиссёр» анимаций по тексту.
 * Рисует кадры на canvas: плавно, как мульт, не как голая нейросеть.
 */
(function (global) {
  "use strict";

  var W = 480;
  var H = 360;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function wobble(seed, amp) {
    return Math.sin(seed * 12.9898) * amp;
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function filmGrain(ctx, frame, amount) {
    var img = ctx.getImageData(0, 0, W, H);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.sin(i * 0.013 + frame * 7.1) * 0.5 + 0.5) * amount;
      d[i] = Math.min(255, d[i] + n);
      d[i + 1] = Math.min(255, d[i + 1] + n);
      d[i + 2] = Math.min(255, d[i + 2] + n);
    }
    ctx.putImageData(img, 0, 0);
  }

  function vignette(ctx) {
    var g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.65);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function parsePrompt(raw) {
    var t = String(raw || "").toLowerCase();
    if (/мяу|кот|кош|cat|meow|котик|котён/.test(t)) return { id: "cat_meow", title: "Мяу-мяу 🐱", fps: 12 };
    if (/эльф|труб|brainrot|брейн|брын|укради|steal|pipe|elf|мем.*труб/.test(t)) {
      return { id: "elf_pipe", title: "Эльф с трубой 🧝", fps: 12 };
    }
    if (/волос|волной|ветер|wind|hair|развев/.test(t)) return { id: "hair_wave", title: "Волосы волной 🌬️", fps: 10 };
    if (/танц|dance|пляш|диск/.test(t)) return { id: "dance", title: "Танец 💃", fps: 12 };
    if (/ракет|косм|space|rocket|звезд/.test(t)) return { id: "rocket", title: "В космос 🚀", fps: 12 };
    if (/рыб|fish|аквар/.test(t)) return { id: "fish", title: "Рыбка 🐟", fps: 10 };
    return { id: "magic", title: "Магия ✨", fps: 12 };
  }

  function drawCatMeow(ctx, f, total) {
    var t = f / total;
    var bounce = Math.sin(t * Math.PI * 2) * 4;
    var mouth = t < 0.35 ? 0 : t < 0.55 ? ease((t - 0.35) / 0.2) : t < 0.75 ? 1 - ease((t - 0.55) / 0.2) : 0;
    var blink = t > 0.82 && t < 0.88;

    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#fef3c7");
    sky.addColorStop(1, "#fde68a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    var cx = W * 0.5 + wobble(f, 1.2);
    var cy = H * 0.52 + bounce;

    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.78, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fb923c";
    roundRect(ctx, cx - 38, cy + 20, 76, 48, 18);
    ctx.fill();

    ctx.fillStyle = "#fdba74";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 52, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 20);
    ctx.lineTo(cx - 28, cy - 52);
    ctx.lineTo(cx - 12, cy - 22);
    ctx.closePath();
    ctx.moveTo(cx + 40, cy - 20);
    ctx.lineTo(cx + 28, cy - 52);
    ctx.lineTo(cx + 12, cy - 22);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy + 10);
    ctx.quadraticCurveTo(cx - 75, cy + 30 + Math.sin(t * 20) * 8, cx - 65, cy + 45);
    ctx.stroke();

    if (blink) {
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 4);
      ctx.lineTo(cx - 6, cy - 4);
      ctx.moveTo(cx + 6, cy - 4);
      ctx.lineTo(cx + 18, cy - 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#1a2420";
      ctx.beginPath();
      ctx.ellipse(cx - 12, cy - 2, 7, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 12, cy - 2, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - 14, cy - 5, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fecaca";
    ctx.beginPath();
    ctx.arc(cx, cy + 8, 6 + mouth * 10, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (mouth > 0.2) {
      roundRect(ctx, cx + 45, cy - 55, 90, 42, 12);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1e293b";
      ctx.font = "800 22px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("МЯУ!", cx + 90, cy - 28);
    }
  }

  function drawElfPipe(ctx, f, total) {
    var t = f / total;
    var smoke = t * Math.PI * 4;

    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#4c1d95");
    bg.addColorStop(0.4, "#7c3aed");
    bg.addColorStop(0.7, "#f472b6");
    bg.addColorStop(1, "#fbbf24");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < 8; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (0.08 + i * 0.02) + ")";
      ctx.beginPath();
      ctx.arc(
        (Math.sin(t * 3 + i) * 0.5 + 0.5) * W,
        (Math.cos(t * 2 + i * 1.3) * 0.5 + 0.5) * H * 0.5,
        20 + i * 8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.font = "900 28px system-ui,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.textAlign = "center";
    ctx.fillText("BRAINROT", W / 2, 42);

    var cx = W * 0.48;
    var cy = H * 0.55 + Math.sin(t * Math.PI * 2) * 3;

    ctx.fillStyle = "rgba(0,0,0,.15)";
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.82, 44, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#166534";
    roundRect(ctx, cx - 22, cy + 28, 44, 50, 8);
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    roundRect(ctx, cx - 28, cy + 8, 56, 28, 6);
    ctx.fill();

    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 18, 30, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 48);
    ctx.lineTo(cx - 18, cy - 62);
    ctx.lineTo(cx + 2, cy - 50);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 48);
    ctx.lineTo(cx + 18, cy - 62);
    ctx.lineTo(cx - 2, cy - 50);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#1a2420";
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 20, 4, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 10, cy - 20, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx + 22, cy - 8);
    ctx.lineTo(cx + 55, cy - 18);
    ctx.stroke();
    ctx.fillStyle = "#92400e";
    roundRect(ctx, cx + 52, cy - 28, 18, 22, 4);
    ctx.fill();

    for (var s = 0; s < 4; s++) {
      var st = (t + s * 0.15) % 1;
      var sx = cx + 58 + st * 35;
      var sy = cy - 35 - st * 55 - Math.sin(smoke + s) * 8;
      var sr = 8 + st * 18;
      ctx.fillStyle = "rgba(255,255,255," + (0.35 - st * 0.3) + ")";
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fff";
    ctx.font = "800 16px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🧝 + 🎷 vibes", W / 2, H - 24);
  }

  function drawHairWave(ctx, f, total) {
    if (global.AmalHairWave && global.AmalHairWave.drawOnce) {
      var c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      var g = c.getContext("2d");
      global.AmalHairWave.drawOnce(c, f * 80, false);
      ctx.drawImage(c, 0, 0);
      return;
    }
    var t = f / total;
    ctx.fillStyle = "#bae6fd";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1a2420";
    ctx.font = "800 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🌬️ волосы волной", W / 2, H / 2);
  }

  function drawDance(ctx, f, total) {
    var t = f / total;
    var jump = Math.abs(Math.sin(t * Math.PI * 2)) * 28;
    var lean = Math.sin(t * Math.PI * 2) * 0.12;

    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#a855f7";
    for (var i = 0; i < 12; i++) {
      var x = ((i / 12 + t * 0.3) % 1) * W;
      ctx.fillRect(x, H * 0.7 + Math.sin(i + t * 10) * 20, 4, H * 0.3);
    }

    var cx = W / 2;
    var cy = H * 0.55 - jump;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lean);

    ctx.fillStyle = "#f472b6";
    roundRect(ctx, -20, 20, 40, 45, 10);
    ctx.fill();
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(0, -10, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("😄", 0, 2);

    ctx.restore();
  }

  function drawRocket(ctx, f, total) {
    var t = f / total;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 40; i++) {
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.3 + (i % 5) * 0.12;
      ctx.fillRect((i * 97 + f * 3) % W, (i * 53) % H, 2, 2);
    }
    ctx.globalAlpha = 1;

    var y = lerp(H + 40, H * 0.25, ease(Math.min(1, t * 1.2)));
    var x = W / 2 + Math.sin(t * 8) * 12;

    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(x, y - 50);
    ctx.lineTo(x - 22, y + 30);
    ctx.lineTo(x + 22, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 20);
    ctx.lineTo(x - 28, y + 45 + Math.sin(f * 2) * 6);
    ctx.lineTo(x - 6, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 20);
    ctx.lineTo(x + 28, y + 45 + Math.sin(f * 2 + 1) * 6);
    ctx.lineTo(x + 6, y + 30);
    ctx.closePath();
    ctx.fill();
  }

  function drawFish(ctx, f, total) {
    var t = f / total;
    var water = ctx.createLinearGradient(0, 0, 0, H);
    water.addColorStop(0, "#0ea5e9");
    water.addColorStop(1, "#0369a1");
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, W, H);

    var fx = W * 0.3 + t * W * 0.5;
    var fy = H * 0.5 + Math.sin(t * Math.PI * 4) * 25;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(t > 0.5 ? -1 : 1, 1);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-38, 0);
    ctx.lineTo(-58, -18);
    ctx.lineTo(-58, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1a2420";
    ctx.beginPath();
    ctx.arc(18, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMagic(ctx, f, total) {
    var t = f / total;
    ctx.fillStyle = "#312e81";
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 20; i++) {
      var a = t * Math.PI * 2 + i;
      var px = W / 2 + Math.cos(a) * (60 + i * 4);
      var py = H / 2 + Math.sin(a * 1.3) * (40 + i * 3);
      ctx.fillStyle = i % 2 ? "#f472b6" : "#fde68a";
      ctx.beginPath();
      ctx.arc(px, py, 4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = "900 48px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("✨", W / 2, H / 2 + 16);
  }

  var DRAWERS = {
    cat_meow: drawCatMeow,
    elf_pipe: drawElfPipe,
    hair_wave: drawHairWave,
    dance: drawDance,
    rocket: drawRocket,
    fish: drawFish,
    magic: drawMagic,
  };

  function renderFrame(sceneId, frameIndex, frameCount) {
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var ctx = c.getContext("2d");
    var draw = DRAWERS[sceneId] || drawMagic;
    draw(ctx, frameIndex, frameCount);
    filmGrain(ctx, frameIndex, 6);
    vignette(ctx);
    return c;
  }

  function generate(rawPrompt) {
    var plan = parsePrompt(rawPrompt);
    var count = plan.id === "hair_wave" ? 10 : plan.id === "elf_pipe" ? 16 : 14;
    var frames = [];
    for (var i = 0; i < count; i++) {
      frames.push(renderFrame(plan.id, i, count));
    }
    return {
      frames: frames,
      name: plan.title,
      fps: plan.fps,
      sceneId: plan.id,
      reply:
        "Готово! «" +
        plan.title +
        "» — " +
        count +
        " кадров, как настоящий мульт. Можешь подправить карандашом или нажать ▶ Плей.",
    };
  }

  function hints() {
    return [
      "кот мяу мяу",
      "эльф с трубой brainrot",
      "волосы волной",
      "танец",
      "ракета в космос",
      "рыбка плавает",
    ];
  }

  global.AnimMaestro = {
    generate: generate,
    parsePrompt: parsePrompt,
    hints: hints,
    W: W,
    H: H,
  };
})(window);
