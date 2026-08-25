(function () {
  "use strict";

  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var btnPlay = document.getElementById("btnPlay");
  var btnAgain = document.getElementById("btnAgain");
  var status = document.getElementById("status");

  var W = canvas.width;
  var H = canvas.height;
  var playing = false;
  var t0 = 0;
  var raf = 0;
  var DURATION = 12000;

  function wobble(seed, x, amp) {
    return Math.sin(seed * 12.9898 + x * 0.07) * amp;
  }

  function handLine(x1, y1, x2, y2, w, color, seed) {
    ctx.beginPath();
    ctx.moveTo(x1 + wobble(seed, x1, 1.2), y1 + wobble(seed + 1, y1, 1.2));
    var mx = (x1 + x2) / 2 + wobble(seed + 2, x1 + x2, 4);
    var my = (y1 + y2) / 2 + wobble(seed + 3, y1 + y2, 4);
    ctx.quadraticCurveTo(mx, my, x2 + wobble(seed + 4, x2, 1.2), y2 + wobble(seed + 5, y2, 1.2));
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function handCircle(cx, cy, r, w, color, seed, fill) {
    ctx.beginPath();
    for (var i = 0; i <= 28; i++) {
      var a = (i / 28) * Math.PI * 2;
      var rr = r + wobble(seed + i, a * 40, 1.8);
      var x = cx + Math.cos(a) * rr;
      var y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.stroke();
  }

  function drawSky(p) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#b9d9ea");
    g.addColorStop(0.55, "#f0d3a4");
    g.addColorStop(1, "#d8c39a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // paper grain feel
    ctx.globalAlpha = 0.05;
    for (var i = 0; i < 90; i++) {
      ctx.fillStyle = i % 2 ? "#2a2218" : "#fff8e8";
      ctx.fillRect((i * 97) % W, (i * 53) % H, 2, 2);
    }
    ctx.globalAlpha = 1;

    var sunY = 360 - p * 220;
    handCircle(760, sunY, 54, 4, "#3d3124", 11, "#f0b429");
    handCircle(760, sunY, 54, 2.2, "#3d3124", 17, null);
  }

  function drawHills() {
    ctx.beginPath();
    ctx.moveTo(0, 390);
    for (var x = 0; x <= W; x += 30) {
      var y = 370 + Math.sin(x * 0.01) * 18 + Math.sin(x * 0.03) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = "#7aa45f";
    ctx.fill();
    ctx.strokeStyle = "#3d3124";
    ctx.lineWidth = 4;
    ctx.stroke();

    handLine(40, 430, 200, 430, 3, "#3d3124", 21);
    handLine(220, 470, 420, 455, 3, "#3d3124", 22);
  }

  function drawHero(x, y, walk, wave) {
    var leg = Math.sin(walk) * 10;
    // body
    handLine(x, y - 58, x, y - 10, 5, "#3d3124", 30);
    // head
    handCircle(x, y - 78, 22, 4, "#3d3124", 31, "#f6e2c4");
    // eyes
    ctx.fillStyle = "#3d3124";
    ctx.beginPath();
    ctx.arc(x - 7, y - 80, 2.2, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 82, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // smile
    ctx.beginPath();
    ctx.arc(x, y - 74, 8, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = "#3d3124";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // arms
    handLine(x, y - 48, x - 22, y - 28 + Math.sin(wave) * 6, 4, "#3d3124", 32);
    handLine(x, y - 48, x + 24, y - 34 - Math.sin(wave) * 10, 4, "#3d3124", 33);
    // legs
    handLine(x, y - 10, x - 12, y + 28 + leg, 4, "#3d3124", 34);
    handLine(x, y - 10, x + 12, y + 28 - leg, 4, "#3d3124", 35);
  }

  function drawBird(x, y, flap) {
    var f = Math.sin(flap) * 8;
    handLine(x - 14, y + f, x, y, 3, "#3d3124", 40);
    handLine(x + 14, y + f, x, y, 3, "#3d3124", 41);
  }

  function drawCaption(text, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = "700 42px Caveat, cursive";
    ctx.fillStyle = "#2a2218";
    ctx.strokeStyle = "rgba(243,231,211,0.85)";
    ctx.lineWidth = 8;
    ctx.textAlign = "center";
    ctx.strokeText(text, W / 2, 64);
    ctx.fillText(text, W / 2, 64);
    ctx.restore();
  }

  function frame(now) {
    if (!playing) return;
    var elapsed = now - t0;
    var p = Math.min(1, elapsed / DURATION);

    drawSky(p);
    drawHills();

    var heroX = 80 + p * 620;
    var heroY = 400 + Math.sin(elapsed * 0.01) * 3;
    drawHero(heroX, heroY, elapsed * 0.012, elapsed * 0.01);

    drawBird(200 + p * 400, 120 + Math.sin(elapsed * 0.004) * 20, elapsed * 0.02);
    drawBird(260 + p * 380, 150 + Math.cos(elapsed * 0.005) * 16, elapsed * 0.023 + 1);

    if (p < 0.18) drawCaption("Жил-был человечек…", (0.18 - p) / 0.06);
    else if (p > 0.35 && p < 0.55) drawCaption("Он шёл к солнышку", 1 - Math.abs(p - 0.45) / 0.1);
    else if (p > 0.78) drawCaption("И дошёл.", (p - 0.78) / 0.12);

    if (p >= 1) {
      playing = false;
      status.textContent = "конец · можно ещё раз";
      btnAgain.hidden = false;
      btnPlay.textContent = "▶ Смотреть";
      return;
    }

    status.textContent = "идёт мульт…";
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (playing) return;
    playing = true;
    btnAgain.hidden = true;
    btnPlay.textContent = "▶ Смотрится…";
    status.textContent = "старт";
    t0 = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function drawIdle() {
    drawSky(0.15);
    drawHills();
    drawHero(140, 400, 0, 0);
    drawCaption("Жми «Смотреть»", 1);
  }

  btnPlay.addEventListener("click", start);
  btnAgain.addEventListener("click", start);
  canvas.addEventListener("click", start);

  drawIdle();
})();
