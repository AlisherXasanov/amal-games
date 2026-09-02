/**
 * Самодельная анимация «Волосы волной» — Амаль на ветру.
 */
(function (global) {
  "use strict";

  var loops = new WeakMap();

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

  function drawScene(ctx, W, H, t, mini) {
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#7dd3fc");
    sky.addColorStop(0.55, "#bae6fd");
    sky.addColorStop(1, "#fef3c7");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // облака
    ctx.fillStyle = "rgba(255,255,255,.75)";
    for (var c = 0; c < 3; c++) {
      var cx = ((c * 0.35 + t * 0.015) % 1.2) * W - W * 0.1;
      var cy = H * (0.12 + c * 0.06);
      ctx.beginPath();
      ctx.ellipse(cx, cy, W * 0.08, H * 0.04, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + W * 0.05, cy - H * 0.01, W * 0.06, H * 0.035, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + W * 0.09, cy, W * 0.07, H * 0.038, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // земля
    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, H * 0.78, W, H * 0.04);

    var cx = W * 0.5;
    var cy = H * 0.52;
    var scale = mini ? Math.min(W, H) / 360 : 1;
    var s = scale * (mini ? 0.85 : 1);

    // тень
    ctx.fillStyle = "rgba(0,0,0,.12)";
    ctx.beginPath();
    ctx.ellipse(cx, H * 0.82, 42 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // ноги
    ctx.fillStyle = "#1e3a5f";
    roundRect(ctx, cx - 18 * s, cy + 38 * s, 14 * s, 34 * s, 6 * s);
    ctx.fill();
    roundRect(ctx, cx + 4 * s, cy + 38 * s, 14 * s, 34 * s, 6 * s);
    ctx.fill();

    // рубашка
    ctx.fillStyle = "#229ed9";
    roundRect(ctx, cx - 26 * s, cy + 4 * s, 52 * s, 40 * s, 10 * s);
    ctx.fill();

    // рюкзак
    ctx.fillStyle = "#f97316";
    roundRect(ctx, cx - 38 * s, cy + 8 * s, 16 * s, 28 * s, 5 * s);
    ctx.fill();

    // голова
    ctx.fillStyle = "#f5c89a";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8 * s, 34 * s, 38 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // уши
    ctx.fillStyle = "#efb882";
    ctx.beginPath();
    ctx.ellipse(cx - 30 * s, cy - 6 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 30 * s, cy - 6 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // волосы — волной
    var wind = Math.sin(t * 0.004) * 0.4 + Math.sin(t * 0.007) * 0.2;
    ctx.lineCap = "round";
    for (var i = 0; i < 14; i++) {
      var side = i < 7 ? -1 : 1;
      var idx = i % 7;
      var bx = cx + side * (8 + idx * 3.5) * s;
      var by = cy - 36 * s + idx * 1.2 * s;
      ctx.strokeStyle = i % 3 === 0 ? "#5c3d2e" : "#4a3024";
      ctx.lineWidth = (4.5 - idx * 0.25) * s;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      var segs = 8;
      for (var j = 1; j <= segs; j++) {
        var p = j / segs;
        var wave = Math.sin(t * 0.006 + idx * 0.5 + p * 4 + side) * (12 + idx * 2) * s * (0.5 + wind);
        var px = bx + side * p * 18 * s + wave * 0.35;
        var py = by + p * 48 * s + Math.sin(t * 0.005 + p * 3) * 3 * s;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // чёлка
    ctx.fillStyle = "#4a3024";
    ctx.beginPath();
    ctx.moveTo(cx - 28 * s, cy - 22 * s);
    for (var k = 0; k <= 6; k++) {
      var q = k / 6;
      var fw = Math.sin(t * 0.008 + k) * 4 * s;
      ctx.lineTo(cx - 28 * s + q * 56 * s + fw, cy - 28 * s + Math.abs(Math.sin(q * Math.PI)) * 8 * s);
    }
    ctx.lineTo(cx + 28 * s, cy - 14 * s);
    ctx.lineTo(cx - 28 * s, cy - 14 * s);
    ctx.closePath();
    ctx.fill();

    // глаза
    ctx.fillStyle = "#1a2420";
    ctx.beginPath();
    ctx.ellipse(cx - 11 * s, cy - 6 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 11 * s, cy - 6 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - 12 * s, cy - 8 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.arc(cx + 10 * s, cy - 8 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // улыбка
    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.arc(cx, cy + 2 * s, 12 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // щёки
    ctx.fillStyle = "rgba(248,113,113,.35)";
    ctx.beginPath();
    ctx.ellipse(cx - 20 * s, cy + 4 * s, 6 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 20 * s, cy + 4 * s, 6 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // ветер — линии
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 2 * s;
    for (var w = 0; w < 5; w++) {
      var wx = ((w * 0.22 + t * 0.003) % 1.1) * W;
      var wy = H * (0.25 + w * 0.08);
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 28 * s, wy - 4 * s);
      ctx.stroke();
    }

    if (!mini) {
      ctx.fillStyle = "rgba(26,36,32,.75)";
      ctx.font = "800 " + Math.round(18 * s) + "px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Волосы волной 🌬️", cx, H * 0.1);
      ctx.font = "700 " + Math.round(13 * s) + "px system-ui,sans-serif";
      ctx.fillStyle = "rgba(26,36,32,.55)";
      ctx.fillText("самодельная анимация · Амаль", cx, H * 0.1 + 22 * s);
    }
  }

  function play(canvas, opts) {
    if (!canvas) return function () {};
    opts = opts || {};
    var mini = !!opts.mini;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = canvas.clientWidth || canvas.width;
    var H = canvas.clientHeight || canvas.height;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    stop(canvas);
    var id = 0;
    function frame(now) {
      drawScene(ctx, W, H, now, mini);
      id = requestAnimationFrame(frame);
    }
    id = requestAnimationFrame(frame);
    loops.set(canvas, id);
    return function () { stop(canvas); };
  }

  function stop(canvas) {
    var id = loops.get(canvas);
    if (id) {
      cancelAnimationFrame(id);
      loops.delete(canvas);
    }
  }

  global.AmalHairWave = {
    play: play,
    stop: stop,
    drawOnce: function (canvas, t, mini) {
      if (!canvas) return;
      var ctx = canvas.getContext("2d");
      var W = canvas.clientWidth || canvas.width;
      var H = canvas.clientHeight || canvas.height;
      drawScene(ctx, W, H, t || 0, !!mini);
    },
    ANIM_ID: "hair-wave-v1",
    TITLE: "Волосы волной 🌬️",
    CAP: "Самодельная анимация — волосы развеваются на ветру!",
  };
})(window);
