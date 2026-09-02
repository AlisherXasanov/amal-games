/**
 * Кадр — мастер анимаций v2.
 * Плавные мульты по тексту: кот, эльф, школа, дракон…
 */
(function (global) {
  "use strict";

  var W = 480;
  var H = 360;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function spring(t) { return 1 - Math.cos(t * Math.PI * 2) * Math.exp(-t * 4); }

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

  function polish(ctx, frame) {
    var g = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (var i = 0; i < 30; i++) {
      var x = (Math.sin(i * 17.3 + frame * 0.7) * 0.5 + 0.5) * W;
      var y = (Math.cos(i * 11.1 + frame * 0.5) * 0.5 + 0.5) * H;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  var extra = { text: "" };

  function parsePrompt(raw) {
    var t = String(raw || "").toLowerCase();
    var orig = String(raw || "").trim();
    if (/клубнич|strawberry|земляник/.test(t) && /слон|elephant|слоник/.test(t)) {
      return { id: "strawberry_elephant", title: "Клубничный слон 🍓🐘", fps: 12, understood: "клубничный слон" };
    }
    if (/слон|elephant|слоник/.test(t)) return { id: "elephant", title: "Слон 🐘", fps: 12, understood: "слон" };
    if (/клубнич|strawberry|земляник/.test(t)) return { id: "strawberry", title: "Клубничка 🍓", fps: 12, understood: "клубника" };
    if (/мяу|кот|кош|cat|meow|котик/.test(t)) return { id: "cat", title: "Котик «Мяу!» 🐱", fps: 14, understood: "кот" };
    if (/эльф|труб|brainrot|брейн|брын|укради|steal|pipe|elf/.test(t)) {
      return { id: "elf", title: "Эльф с трубой 🧝", fps: 14, understood: "эльф с трубой" };
    }
    if (/школ|класс|праздник|линейк|1 сент|первоклас/.test(t)) {
      return { id: "school", title: "Школьный праздник 🎒", fps: 12, understood: "школа" };
    }
    if (/дракон|dragon|огон/.test(t)) return { id: "dragon", title: "Дракон 🔥", fps: 12, understood: "дракон" };
    if (/супер|герой|hero|полёт|лет/.test(t)) return { id: "hero", title: "Супергерой 🦸", fps: 14, understood: "супергерой" };
    if (/танц|dance|пляш/.test(t)) return { id: "dance", title: "Танец 🕺", fps: 14, understood: "танец" };
    if (/косм|ракет|space|rocket/.test(t)) return { id: "rocket", title: "Ракета 🚀", fps: 12, understood: "ракета" };
    if (/день рожд|birthday|8 лет|торт/.test(t)) return { id: "birthday", title: "День рождения 🎂", fps: 12, understood: "день рождения" };
    var short = orig.slice(0, 36);
    return { id: "custom", title: short || "Твой мульт ✨", fps: 12, understood: short, customText: short };
  }

  function drawCat(ctx, f, n) {
    var t = f / n;
    var cycle = t * Math.PI * 2;
    var squash = 1 + Math.sin(cycle) * 0.06;
    var mouthOpen = Math.max(0, Math.sin(cycle * 2 - 0.5) * 0.8);
    var blink = (t % 1) > 0.88 && (t % 1) < 0.93;

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#fff7ed");
    bg.addColorStop(1, "#fed7aa");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, H * 0.74, W, H * 0.26);

    var cx = W * 0.5;
    var cy = H * 0.54;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, squash);

    ctx.fillStyle = "rgba(0,0,0,.08)";
    ctx.beginPath();
    ctx.ellipse(0, 58, 52, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fb923c";
    roundRect(ctx, -42, 18, 84, 52, 20);
    ctx.fill();
    ctx.fillStyle = "#fdba74";
    ctx.beginPath();
    ctx.ellipse(0, -8, 56, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.moveTo(-44, -22); ctx.lineTo(-32, -58); ctx.lineTo(-14, -24); ctx.closePath();
    ctx.moveTo(44, -22); ctx.lineTo(32, -58); ctx.lineTo(14, -24); ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-58, 8);
    ctx.quadraticCurveTo(-82, 28 + Math.sin(cycle * 3) * 10, -72, 48);
    ctx.stroke();

    if (blink) {
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, -6); ctx.lineTo(-8, -6);
      ctx.moveTo(8, -6); ctx.lineTo(20, -6);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.ellipse(-14, -4, 8, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(14, -4, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-16, -7, 3, 0, Math.PI * 2);
      ctx.arc(12, -7, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fecaca";
    ctx.beginPath();
    ctx.ellipse(0, 10, 8 + mouthOpen * 14, 6 + mouthOpen * 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (mouthOpen > 0.35) {
      roundRect(ctx, cx + 55, cy - 70, 100, 46, 14);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 26px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("МЯУ!", cx + 105, cy - 42);
    }
  }

  function drawElf(ctx, f, n) {
    var t = f / n;
    var bob = Math.sin(t * Math.PI * 2) * 4;

    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#312e81");
    bg.addColorStop(0.35, "#7c3aed");
    bg.addColorStop(0.7, "#ec4899");
    bg.addColorStop(1, "#fbbf24");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.font = "900 32px system-ui,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.textAlign = "center";
    ctx.fillText("STEAL A BRAINROT", W / 2, 38);

    for (var i = 0; i < 6; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (0.06 + i * 0.02) + ")";
      ctx.beginPath();
      ctx.arc(W * (0.15 + i * 0.14), H * (0.2 + (i % 3) * 0.08), 16 + i * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    var cx = W * 0.46;
    var cy = H * 0.56 + bob;

    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.84, 48, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#15803d";
    roundRect(ctx, cx - 24, cy + 26, 48, 54, 10);
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    roundRect(ctx, cx - 30, cy + 4, 60, 30, 8);
    ctx.fill();
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 32, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 50); ctx.lineTo(cx - 22, cy - 68); ctx.lineTo(cx + 2, cy - 52); ctx.closePath();
    ctx.moveTo(cx + 10, cy - 50); ctx.lineTo(cx + 22, cy - 68); ctx.lineTo(cx - 2, cy - 52); ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(cx - 11, cy - 22, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 11, cy - 22, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + 24, cy - 6);
    ctx.lineTo(cx + 62, cy - 16);
    ctx.stroke();
    ctx.fillStyle = "#92400e";
    roundRect(ctx, cx + 58, cy - 30, 20, 26, 5);
    ctx.fill();

    for (var s = 0; s < 5; s++) {
      var st = (t + s * 0.12) % 1;
      ctx.fillStyle = "rgba(255,255,255," + (0.4 - st * 0.35) + ")";
      ctx.beginPath();
      ctx.arc(cx + 66 + st * 40, cy - 38 - st * 60, 6 + st * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSchool(ctx, f, n) {
    var t = f / n;
    var wave = Math.sin(t * Math.PI * 4) * 8;

    ctx.fillStyle = "#dbeafe";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(0, H * 0.65, W, H * 0.35);

    roundRect(ctx, W * 0.1, 40, W * 0.8, 80, 12);
    ctx.fillStyle = "#dc2626";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "800 22px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🎉 1 СЕНТЯБРЯ · ПРАЗДНИК", W / 2, 88);

    for (var i = 0; i < 4; i++) {
      var bx = W * (0.22 + i * 0.18);
      var by = H * 0.72 + Math.sin(t * Math.PI * 2 + i) * 6;
      ctx.fillStyle = i === 0 ? "#229ed9" : i === 1 ? "#f97316" : i === 2 ? "#22c55e" : "#a855f7";
      roundRect(ctx, bx - 18, by - 50 + (i === 0 ? wave * 0.3 : 0), 36, 50, 8);
      ctx.fill();
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(bx, by - 58 + (i === 0 ? wave * 0.3 : 0), 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "48px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🎒", W / 2, H * 0.55 + wave);
  }

  function drawDragon(ctx, f, n) {
    var t = f / n;
    var flap = Math.sin(t * Math.PI * 2) * 0.4;

    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fbbf24";
    for (var i = 0; i < 20; i++) {
      ctx.globalAlpha = 0.2 + (i % 3) * 0.15;
      ctx.fillRect((i * 113 + f * 2) % W, (i * 67) % (H * 0.5), 2, 2);
    }
    ctx.globalAlpha = 1;

    var cx = W / 2;
    var cy = H * 0.48 + Math.sin(t * Math.PI * 2) * 10;

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy);
    ctx.lineTo(cx - 90, cy - 30 - flap * 40);
    ctx.lineTo(cx - 40, cy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 55, cy);
    ctx.lineTo(cx + 90, cy - 30 - flap * 40);
    ctx.lineTo(cx + 40, cy - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.moveTo(cx + 50, cy + 5);
    ctx.lineTo(cx + 90 + Math.sin(t * 20) * 15, cy + 20);
    ctx.lineTo(cx + 55, cy + 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(cx + 20, cy - 8, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHero(ctx, f, n) {
    var t = f / n;
    var fly = Math.sin(t * Math.PI * 2) * 12;

    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#38bdf8");
    sky.addColorStop(1, "#bae6fd");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2 + Math.sin(t * Math.PI * 2) * 30;
    var cy = H * 0.45 - fly;

    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy + 40);
    ctx.lineTo(cx + 80, cy + 40);
    ctx.stroke();

    ctx.fillStyle = "#2563eb";
    roundRect(ctx, cx - 22, cy, 44, 48, 10);
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 5);
    ctx.lineTo(cx - 55, cy + 35);
    ctx.lineTo(cx - 15, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.font = "36px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🦸", cx, cy - 2);
  }

  function drawDance(ctx, f, n) {
    var t = f / n;
    var jump = Math.abs(Math.sin(t * Math.PI * 2)) * 32;
    var lean = Math.sin(t * Math.PI * 2) * 0.15;

    ctx.fillStyle = "#4c1d95";
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#f472b6" : "#a78bfa";
      ctx.fillRect((i / 8) * W, H * 0.7, W / 8, H * 0.3);
    }

    var cx = W / 2;
    var cy = H * 0.52 - jump;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lean);
    ctx.fillStyle = "#f472b6";
    roundRect(ctx, -22, 18, 44, 50, 12);
    ctx.fill();
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(0, -8, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🕺", 0, 4);
    ctx.restore();
  }

  function drawRocket(ctx, f, n) {
    var t = easeInOut(Math.min(1, t * 1.1));
    var y = lerp(H + 30, H * 0.22, t);
    var x = W / 2 + Math.sin(f * 0.4) * 10;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    for (var i = 0; i < 35; i++) {
      ctx.globalAlpha = 0.15 + (i % 4) * 0.1;
      ctx.fillRect((i * 97 + f * 4) % W, (i * 53) % H, 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(x, y - 55);
    ctx.lineTo(x - 24, y + 32);
    ctx.lineTo(x + 24, y + 32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 18);
    ctx.lineTo(x - 30, y + 50 + Math.sin(f * 3) * 8);
    ctx.lineTo(x - 4, y + 28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 18);
    ctx.lineTo(x + 30, y + 50 + Math.sin(f * 3 + 1) * 8);
    ctx.lineTo(x + 4, y + 28);
    ctx.closePath();
    ctx.fill();
  }

  function drawBirthday(ctx, f, n) {
    var t = f / n;
    var pop = spring(Math.min(1, t * 1.5));

    ctx.fillStyle = "#fdf2f8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fbcfe8";
    for (var i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(W * ((i * 0.09 + t * 0.2) % 1), H * 0.15 + (i % 4) * 20, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "800 26px system-ui,sans-serif";
    ctx.fillStyle = "#be185d";
    ctx.textAlign = "center";
    ctx.fillText("🎂 С ДНЁМ РОЖДЕНИЯ!", W / 2, 50);

    var cx = W / 2;
    var cy = H * 0.58;
    roundRect(ctx, cx - 50, cy - 20, 100, 60, 10);
    ctx.fillStyle = "#f9a8d4";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 28px system-ui,sans-serif";
    ctx.fillText("8", cx, cy + 18);

    ctx.font = (40 + pop * 20) + "px system-ui";
    ctx.fillText("🎈", cx - 70, cy - 30 - pop * 20);
    ctx.fillText("🎈", cx + 70, cy - 30 - pop * 20);
  }

  function drawStrawberryElephant(ctx, f, n) {
    var t = f / n;
    var cycle = t * Math.PI * 2;
    var bounce = Math.sin(cycle) * 6;
    var trunkWave = Math.sin(cycle * 2) * 18;

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#ecfccb");
    bg.addColorStop(1, "#bbf7d0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    var cx = W * 0.5;
    var cy = H * 0.5 + bounce;
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.82, 70, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 72, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    for (var i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(cx - 50 + (i % 5) * 22, cy - 5 + Math.floor(i / 5) * 20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 48);
    ctx.lineTo(cx, cy - 72);
    ctx.lineTo(cx + 8, cy - 48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fca5a5";
    ctx.beginPath();
    ctx.ellipse(cx - 52, cy - 5, 28, 38, 0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 52, cy - 5, 28, 38, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#b91c1c";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 22, 38, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 26, 5, 0, Math.PI * 2);
    ctx.arc(cx + 14, cy - 26, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#991b1b";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.quadraticCurveTo(cx + 30 + trunkWave, cy + 10, cx + 50 + trunkWave, cy - 20);
    ctx.stroke();

    ctx.font = "800 18px system-ui,sans-serif";
    ctx.fillStyle = "#14532d";
    ctx.textAlign = "center";
    ctx.fillText("🍓 КЛУБНИЧНЫЙ СЛОН 🐘", W / 2, 36);
  }

  function drawElephant(ctx, f, n) {
    var t = f / n;
    var bounce = Math.sin(t * Math.PI * 2) * 5;
    var cx = W / 2;
    var cy = H * 0.52 + bounce;
    ctx.fillStyle = "#dbeafe";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 30, 65, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 15, 40, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy);
    ctx.quadraticCurveTo(cx + 45, cy + 20, cx + 55, cy - 15 + Math.sin(t * 12) * 12);
    ctx.stroke();
  }

  function drawStrawberry(ctx, f, n) {
    var t = f / n;
    var wobble = Math.sin(t * Math.PI * 2) * 8;
    var cx = W / 2 + wobble;
    var cy = H * 0.52;
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 55);
    ctx.bezierCurveTo(cx + 65, cy - 20, cx + 55, cy + 55, cx, cy + 65);
    ctx.bezierCurveTo(cx - 55, cy + 55, cx - 65, cy - 20, cx, cy - 55);
    ctx.fill();
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 58);
    ctx.lineTo(cx - 15, cy - 78);
    ctx.lineTo(cx + 15, cy - 78);
    ctx.closePath();
    ctx.fill();
  }

  function drawCustom(ctx, f, n) {
    var t = f / n;
    var text = extra.text || "Твой мульт";
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "900 56px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🎬", W / 2, H * 0.38 + Math.sin(t * Math.PI * 2) * 8);
    ctx.fillStyle = "#fff";
    ctx.font = "800 18px system-ui,sans-serif";
    ctx.fillText(text, W / 2, H * 0.55);
    ctx.fillStyle = "#a5b4fc";
    ctx.font = "700 13px system-ui,sans-serif";
    ctx.fillText("Попробуй: клубничный слон · кот мяу · эльф", W / 2, H - 30);
  }

  var SCENES = {
    cat: drawCat,
    elf: drawElf,
    school: drawSchool,
    dragon: drawDragon,
    hero: drawHero,
    dance: drawDance,
    rocket: drawRocket,
    birthday: drawBirthday,
    strawberry_elephant: drawStrawberryElephant,
    elephant: drawElephant,
    strawberry: drawStrawberry,
    custom: drawCustom,
  };

  function renderFrame(sceneId, i, count) {
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var ctx = c.getContext("2d");
    (SCENES[sceneId] || drawCustom)(ctx, i, count);
    polish(ctx, i);
    return c;
  }

  function generate(raw) {
    var plan = parsePrompt(raw);
    extra.text = plan.customText || plan.understood || plan.title;
    var count = 20;
    var frames = [];
    for (var i = 0; i < count; i++) frames.push(renderFrame(plan.id, i, count));
    var reply = plan.id === "custom"
      ? "Кадр пока не знает «" + extra.text + "». Попробуй «клубничный слон» или «кот мяу»!"
      : "Понял: «" + (plan.understood || plan.title) + "» — " + count + " кадров, смотри!";
    return {
      frames: frames,
      name: plan.title,
      fps: plan.fps,
      sceneId: plan.id,
      understood: plan.understood || plan.title,
      reply: reply,
    };
  }

  function hints() {
    return ["клубничный слон", "кот мяу", "эльф с трубой brainrot", "школьный праздник", "дракон", "день рождения 8 лет"];
  }

  var loops = new WeakMap();

  function play(canvas) {
    if (!canvas) return function () {};
    var ctx = canvas.getContext("2d");
    var Wc = canvas.clientWidth || 240;
    var Hc = canvas.clientHeight || 180;
    canvas.width = Wc * 2;
    canvas.height = Hc * 2;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    var start = performance.now();
    var id;
    function frame(now) {
      var t = (now - start) / 1000;
      var plan = parsePrompt("cat");
      var n = 20;
      var i = Math.floor(t * 14) % n;
      ctx.clearRect(0, 0, Wc, Hc);
      ctx.save();
      ctx.scale(Wc / W, Hc / H);
      (SCENES.cat)(ctx, i, n);
      polish(ctx, i);
      ctx.restore();
      id = requestAnimationFrame(frame);
    }
    id = requestAnimationFrame(frame);
    loops.set(canvas, id);
    return function () { cancelAnimationFrame(loops.get(canvas)); };
  }

  global.AnimMaster = {
    NAME: "Кадр",
    VERSION: "v3",
    generate: generate,
    parsePrompt: parsePrompt,
    hints: hints,
    playPreview: play,
    PAGE: "anim-master.html",
    W: W,
    H: H,
  };
})(window);
