/**
 * Доп. сцены Кадра — мемы, YouTube, сериалы, игры.
 */
(function (global) {
  "use strict";
  if (!global.AnimMaster || !global.AnimMaster._register) return;

  var W = 480;
  var H = 360;

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

  global.AnimMaster._register({
    rules: [
      { re: /youtube|ютуб|ютюб|ролик|подпис|блог|канал|video/i, id: "youtube", title: "YouTube-стиль 📺", understood: "YouTube" },
      { re: /сериал|series|сезон|серия|мультсериал|нетflix|netflix/i, id: "series", title: "Сериал · серия 1 📺", understood: "сериал" },
      { re: /мем|meme|viral|вирал|ржака|смешн|прикол/i, id: "meme", title: "Мем-ролик 😂", understood: "мем" },
      { re: /minecraft|майн|майнкрафт|steve|стив/i, id: "minecraft", title: "Майнкрафт ⛏️", understood: "minecraft" },
      { re: /roblox|роблокс|robux|робукс/i, id: "roblox", title: "Roblox 🟩", understood: "roblox" },
      { re: /диноз|dino|dinosaur|trex/i, id: "dino", title: "Динозавр 🦖", understood: "динозавр" },
      { re: /единор|unicorn/i, id: "unicorn", title: "Единорог 🦄", understood: "единорог" },
      { re: /собак|dog|пёс|пес|гав|woof/i, id: "dog", title: "Собака «Гав!» 🐶", understood: "собака" },
      { re: /акул|shark|baby shark|дудudu/i, id: "shark", title: "Акула 🦈", understood: "акула" },
      { re: /пицц|pizza/i, id: "pizza", title: "Пицца 🍕", understood: "пицца" },
      { re: /tiktok|тик\s*ток|тикток/i, id: "tiktok", title: "TikTok 🎵", understood: "TikTok" },
      { re: /impostor|импост|among|амонг|предатель|космонавт/i, id: "impostor", title: "Космонавт-мем 👾", understood: "impostor" },
      { re: /skibidi|скибид|туалет|toilet/i, id: "toilet_meme", title: "Мем-туалет 🚽", understood: "мем туалет" },
      { re: /sigma|сигма|gigachad|гигачад/i, id: "sigma", title: "Sigma 💪", understood: "sigma" },
      { re: /зомби|zombie/i, id: "zombie", title: "Зомби 🧟", understood: "зомби" },
      { re: /пингвин|penguin/i, id: "penguin", title: "Пингвин 🐧", understood: "пингвин" },
    ],
    catalog: [
      { cat: "⭐ Топ", prompt: "клубничный слон", label: "🍓🐘 Клубничный слон" },
      { cat: "⭐ Топ", prompt: "кот мяу", label: "🐱 Кот мяу" },
      { cat: "⭐ Топ", prompt: "эльф с трубой brainrot", label: "🧝 Brainrot эльф" },
      { cat: "📺 YouTube", prompt: "youtube ролик подпишись", label: "📺 YouTube" },
      { cat: "📺 YouTube", prompt: "сериал серия 1", label: "🎬 Сериал" },
      { cat: "📺 YouTube", prompt: "tiktok танец", label: "🎵 TikTok" },
      { cat: "😂 Мемы", prompt: "мем viral смешной", label: "😂 Мем" },
      { cat: "😂 Мемы", prompt: "skibidi туалет", label: "🚽 Мем-туалет" },
      { cat: "😂 Мемы", prompt: "sigma gigachad", label: "💪 Sigma" },
      { cat: "😂 Мемы", prompt: "among impostor", label: "👾 Космонавт" },
      { cat: "🎮 Игры", prompt: "minecraft steve", label: "⛏️ Minecraft" },
      { cat: "🎮 Игры", prompt: "roblox noob", label: "🟩 Roblox" },
      { cat: "🎮 Игры", prompt: "zombie", label: "🧟 Зомби" },
      { cat: "🐾 Животные", prompt: "динозавр", label: "🦖 Дино" },
      { cat: "🐾 Животные", prompt: "единорог радуга", label: "🦄 Единорог" },
      { cat: "🐾 Животные", prompt: "собака гав", label: "🐶 Собака" },
      { cat: "🐾 Животные", prompt: "акула baby shark", label: "🦈 Акула" },
      { cat: "🐾 Животные", prompt: "пингвин", label: "🐧 Пингвин" },
      { cat: "🎉 Другое", prompt: "школьный праздник", label: "🎒 Школа" },
      { cat: "🎉 Другое", prompt: "день рождения 8 лет", label: "🎂 ДР" },
      { cat: "🎉 Другое", prompt: "пizza пицца", label: "🍕 Пицца" },
      { cat: "🎉 Другое", prompt: "дракон огонь", label: "🔥 Дракон" },
      { cat: "🎉 Другое", prompt: "супергерой", label: "🦸 Герой" },
    ],
    scenes: {
      youtube: function (ctx, f, n) {
        var t = f / n;
        var pulse = 1 + Math.sin(t * Math.PI * 2) * 0.08;
        ctx.fillStyle = "#0f0f0f";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = "800 22px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("КАНАЛ АМАЛЯ", W / 2, 48);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = "#ff0000";
        roundRect(ctx, -50, -35, 100, 70, 16);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(-12, -22);
        ctx.lineTo(-12, 22);
        ctx.lineTo(28, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.font = "700 14px system-ui,sans-serif";
        ctx.fillText("▶ Смотреть · 👍 · 🔔 Подписаться", W / 2, H - 36);
      },
      series: function (ctx, f, n) {
        var t = f / n;
        function ease(x) { return x * x * (3 - 2 * x); }
        var fade = ease(Math.min(1, t * 2));
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        ctx.fillRect(0, 0, W, 36);
        ctx.fillRect(0, H - 36, W, 36);
        ctx.fillStyle = "rgba(255,255,255," + fade + ")";
        ctx.font = "900 " + Math.round(28 + fade * 8) + "px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("СЕРИЯ 1", W / 2, H / 2);
        ctx.font = "700 16px system-ui,sans-serif";
        ctx.fillText("«Приключения Амаля»", W / 2, H / 2 + 32);
        ctx.font = "48px system-ui";
        ctx.fillText("🎬", W / 2, H / 2 - 40);
      },
      meme: function (ctx, f, n) {
        var t = f / n;
        var shake = Math.sin(t * 40) * 4;
        var bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#f472b6");
        bg.addColorStop(0.5, "#fbbf24");
        bg.addColorStop(1, "#38bdf8");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.translate(W / 2 + shake, H / 2);
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 4;
        ctx.font = "900 42px Impact,system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.strokeText("МЕМ!", 0, 10);
        ctx.fillText("МЕМ!", 0, 10);
        ctx.restore();
        ctx.font = "800 18px system-ui,sans-serif";
        ctx.fillStyle = "#1e1b4b";
        ctx.fillText("😂 VIRAL · 1M просмотров", W / 2, H - 28);
      },
      minecraft: function (ctx, f, n) {
        var t = f / n;
        var walk = Math.sin(t * Math.PI * 2) * 6;
        ctx.fillStyle = "#87ceeb";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#6b8e23";
        ctx.fillRect(0, H * 0.72, W, H * 0.28);
        var cx = W / 2 + walk;
        var cy = H * 0.55;
        ctx.fillStyle = "#4ade80";
        for (var i = 0; i < 5; i++) ctx.fillRect(cx - 40 + i * 20, H * 0.72 - 30, 18, 30);
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(cx - 18, cy - 20, 36, 36);
        ctx.fillStyle = "#fcd34d";
        ctx.fillRect(cx - 16, cy - 52, 32, 32);
        ctx.fillStyle = "#1e3a5f";
        ctx.fillRect(cx - 10, cy - 44, 8, 8);
        ctx.fillRect(cx + 2, cy - 44, 8, 8);
        ctx.font = "800 16px system-ui,sans-serif";
        ctx.fillStyle = "#14532d";
        ctx.textAlign = "center";
        ctx.fillText("⛏ MINECRAFT", W / 2, 32);
      },
      roblox: function (ctx, f, n) {
        var t = f / n;
        var bob = Math.sin(t * Math.PI * 2) * 8;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#a3e635";
        ctx.fillRect(0, H * 0.75, W, H * 0.25);
        var cx = W / 2;
        var cy = H * 0.5 + bob;
        ctx.fillStyle = "#fde047";
        ctx.fillRect(cx - 22, cy - 55, 44, 44);
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(cx - 26, cy - 8, 52, 48);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(cx - 30, cy + 38, 22, 38);
        ctx.fillRect(cx + 8, cy + 38, 22, 38);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(cx - 12, cy - 40, 10, 10);
        ctx.fillRect(cx + 2, cy - 40, 10, 10);
        ctx.font = "800 18px system-ui,sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText("ROBLOX NOOB", W / 2, 34);
      },
      dino: function (ctx, f, n) {
        var t = f / n;
        var chomp = Math.abs(Math.sin(t * Math.PI * 4)) * 15;
        ctx.fillStyle = "#ecfccb";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(W * 0.2, H * 0.75);
        ctx.lineTo(W * 0.5, H * 0.35 - chomp);
        ctx.lineTo(W * 0.85, H * 0.75);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(W * 0.55, H * 0.48, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(W * 0.57, H * 0.48, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "900 32px system-ui,sans-serif";
        ctx.fillStyle = "#14532d";
        ctx.textAlign = "center";
        ctx.fillText("ROAR!", W / 2, H * 0.28);
      },
      unicorn: function (ctx, f, n) {
        var t = f / n;
        var gallop = Math.sin(t * Math.PI * 2) * 10;
        var cx = W / 2;
        var cy = H * 0.52 + gallop;
        var rg = ctx.createLinearGradient(0, 0, W, 0);
        rg.addColorStop(0, "#f472b6");
        rg.addColorStop(0.5, "#fbbf24");
        rg.addColorStop(1, "#38bdf8");
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 15, 50, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 35, cy - 15, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f472b6";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx + 50, cy - 25);
        ctx.lineTo(cx + 65, cy - 55);
        ctx.stroke();
        ctx.font = "900 28px system-ui,sans-serif";
        ctx.fillStyle = "#7c3aed";
        ctx.textAlign = "center";
        ctx.fillText("🦄", cx, cy + 5);
      },
      dog: function (ctx, f, n) {
        var t = f / n;
        var wag = Math.sin(t * Math.PI * 6) * 20;
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(0, 0, W, H);
        var cx = W / 2;
        var cy = H * 0.52;
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 45, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 35, cy - 10, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx - 40, cy + 5);
        ctx.lineTo(cx - 65 + wag, cy - 10);
        ctx.stroke();
        if (Math.sin(t * Math.PI * 4) > 0.3) {
          roundRect(ctx, cx + 40, cy - 50, 70, 36, 10);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.fillStyle = "#1e293b";
          ctx.font = "900 20px system-ui,sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("ГАВ!", cx + 75, cy - 26);
        }
      },
      shark: function (ctx, f, n) {
        var t = f / n;
        var swim = t * W * 0.6;
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(0, 0, W, H);
        var cx = W * 0.25 + (swim % (W * 0.6));
        var cy = H * 0.5 + Math.sin(t * Math.PI * 4) * 20;
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.ellipse(cx, cy, 55, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 50, cy);
        ctx.lineTo(cx - 80, cy - 25);
        ctx.lineTo(cx - 80, cy + 25);
        ctx.closePath();
        ctx.fill();
        ctx.font = "800 16px system-ui,sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText("du du du du ~", W / 2, H - 24);
      },
      pizza: function (ctx, f, n) {
        var t = f / n;
        var spin = t * Math.PI * 2;
        ctx.fillStyle = "#431407";
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(spin);
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.moveTo(0, -70);
        ctx.lineTo(60, 50);
        ctx.lineTo(-60, 50);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        [[-20, -10], [15, 5], [0, 25], [-25, 30]].forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p[0], p[1], 8, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        ctx.font = "800 22px system-ui,sans-serif";
        ctx.fillStyle = "#fde68a";
        ctx.textAlign = "center";
        ctx.fillText("🍕 PIZZA TIME", W / 2, 36);
      },
      tiktok: function (ctx, f, n) {
        var t = f / n;
        var dance = Math.sin(t * Math.PI * 4) * 12;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        roundRect(ctx, W * 0.22, 20, W * 0.56, H - 40, 16);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.font = (48 + dance) + "px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("🕺", W / 2, H / 2 + dance);
        ctx.fillStyle = "#fff";
        ctx.font = "800 14px system-ui,sans-serif";
        ctx.fillText("TikTok · For You", W / 2, 44);
        ctx.fillText("❤️ 🔁 💬", W / 2, H - 50);
      },
      impostor: function (ctx, f, n) {
        var t = f / n;
        var walk = Math.sin(t * Math.PI * 2) * 15;
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(0, 0, W, H);
        for (var i = 0; i < 8; i++) {
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.beginPath();
          ctx.arc((i * 97 + f * 2) % W, (i * 53) % H, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        var cx = W / 2 + walk;
        var cy = H * 0.52;
        ctx.fillStyle = "#ef4444";
        roundRect(ctx, cx - 28, cy - 40, 56, 70, 28);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        roundRect(ctx, cx - 32, cy - 55, 64, 28, 14);
        ctx.fill();
        ctx.fillStyle = "#1e3a5f";
        ctx.beginPath();
        ctx.ellipse(cx - 10, cy - 15, 10, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 10, cy - 15, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "800 16px system-ui,sans-serif";
        ctx.fillStyle = "#fca5a5";
        ctx.textAlign = "center";
        ctx.fillText("SUS 👀", W / 2, 36);
      },
      toilet_meme: function (ctx, f, n) {
        var t = f / n;
        var bounce = Math.sin(t * Math.PI * 2) * 5;
        ctx.fillStyle = "#312e81";
        ctx.fillRect(0, 0, W, H);
        var cx = W / 2;
        var cy = H * 0.55 + bounce;
        ctx.fillStyle = "#fff";
        roundRect(ctx, cx - 45, cy - 10, 90, 70, 12);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.ellipse(cx, cy - 25, 50, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fcd34d";
        ctx.beginPath();
        ctx.arc(cx, cy - 55, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 58, 5, 0, Math.PI * 2);
        ctx.arc(cx + 10, cy - 58, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "800 18px system-ui,sans-serif";
        ctx.fillStyle = "#c4b5fd";
        ctx.textAlign = "center";
        ctx.fillText("🚽 MEME MODE", W / 2, 36);
      },
      sigma: function (ctx, f, n) {
        var t = f / n;
        var walk = t * 40;
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(0, H * 0.7, W, 2);
        var cx = W * 0.35 + (walk % (W * 0.5));
        var cy = H * 0.55;
        ctx.fillStyle = "#525252";
        ctx.fillRect(cx - 20, cy - 50, 40, 50);
        ctx.fillRect(cx - 25, cy, 18, 45);
        ctx.fillRect(cx + 7, cy, 18, 45);
        ctx.fillStyle = "#737373";
        ctx.beginPath();
        ctx.arc(cx, cy - 62, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "900 24px system-ui,sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText("SIGMA 💪", W / 2, 40);
      },
      zombie: function (ctx, f, n) {
        var t = f / n;
        var lurch = Math.sin(t * Math.PI * 2) * 8;
        ctx.fillStyle = "#14532d";
        ctx.fillRect(0, 0, W, H);
        var cx = W / 2 + lurch;
        var cy = H * 0.52;
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(cx - 22, cy - 30, 44, 55);
        ctx.fillStyle = "#86efac";
        ctx.beginPath();
        ctx.arc(cx, cy - 45, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 48, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "800 20px system-ui,sans-serif";
        ctx.fillStyle = "#bbf7d0";
        ctx.textAlign = "center";
        ctx.fillText("🧟 BRAAAINS...", W / 2, 36);
      },
      penguin: function (ctx, f, n) {
        var t = f / n;
        var waddle = Math.sin(t * Math.PI * 2) * 15;
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, H * 0.78, W, H * 0.22);
        var cx = W / 2 + waddle;
        var cy = H * 0.52;
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 35, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(cx, cy - 5, 28, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy - 10);
        ctx.lineTo(cx + 38, cy - 5);
        ctx.lineTo(cx + 20, cy);
        ctx.closePath();
        ctx.fill();
        ctx.font = "36px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("🐧", cx, cy + 8);
      },
    },
  });
})(window);
