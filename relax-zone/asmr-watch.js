/**
 * ASMR «видео» — свои ролики: баттер в воде, слоники, лёд… без YouTube.
 */
(function () {
  "use strict";

  var canvas, ctx, W, H;
  var audioCtx, master;
  var current = 0;
  var playing = false;
  var frame = 0;
  var raf = 0;
  var t0 = 0;

  var VIDEOS = [
    {
      id: "butter_ice",
      title: "🧈 Баттерсквиш во льду",
      sub: "Заморозили в воде · медленно тает · squish",
      dur: 28,
    },
    {
      id: "elephants",
      title: "🐘 Маленькие слоники",
      sub: "Купаются · брызги · тихо и мило",
      dur: 24,
    },
    {
      id: "squish",
      title: "🧈 Slow-rise squish",
      sub: "Жми экран — приятный звук",
      dur: 20,
    },
    {
      id: "ice_water",
      title: "🧊 Лёд в воде",
      sub: "Треск · пузырьки · прохлада",
      dur: 22,
    },
    {
      id: "rain",
      title: "🌧️ Дождь за окном",
      sub: "Капли · тишина · отдых",
      dur: 30,
    },
  ];

  function ensureAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.55;
    master.connect(audioCtx.destination);
  }

  function vol() {
    var s = document.getElementById("vol");
    return s ? Number(s.value) / 100 : 0.55;
  }

  function squish() {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    var t = audioCtx.currentTime;
    function tone(f, d, g) {
      var o = audioCtx.createOscillator();
      var gn = audioCtx.createGain();
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t);
      gn.gain.exponentialRampToValueAtTime(g * vol(), t + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(gn);
      gn.connect(master);
      o.start(t);
      o.stop(t + d + 0.05);
    }
    tone(130 + Math.random() * 40, 0.14, 0.4);
    setTimeout(function () { tone(65, 0.2, 0.3); }, 30);
  }

  function crack() {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    var len = Math.floor(audioCtx.sampleRate * 0.12);
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var f = audioCtx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 4000;
    var g = audioCtx.createGain();
    g.gain.value = 0.45 * vol();
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start();
  }

  function splash() {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    var len = Math.floor(audioCtx.sampleRate * 0.08);
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var f = audioCtx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 800;
    var g = audioCtx.createGain();
    g.gain.value = 0.35 * vol();
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start();
  }

  function roundRect(x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawButterIce(elapsed) {
    var t = (elapsed % 28) / 28;
    var water = ctx.createLinearGradient(0, 0, 0, H);
    water.addColorStop(0, "#0c4a6e");
    water.addColorStop(1, "#0369a1");
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, W, H);

    for (var b = 0; b < 12; b++) {
      ctx.fillStyle = "rgba(255,255,255," + (0.08 + (b % 3) * 0.04) + ")";
      ctx.beginPath();
      ctx.arc((b * 73 + elapsed * 20) % W, H * 0.2 + (b % 4) * 30, 3 + b % 4, 0, Math.PI * 2);
      ctx.fill();
    }

    var melt = t < 0.4 ? 0 : (t - 0.4) / 0.5;
    var cx = W / 2;
    var cy = H * 0.48;
    var squish = 1 + Math.sin(elapsed * 2) * 0.04 * melt;

    ctx.fillStyle = "rgba(186,230,253,0.35)";
    roundRect(cx - 90, cy - 30, 180, 100, 20);
    ctx.fill();

    ctx.fillStyle = "#fde047";
    ctx.save();
    ctx.translate(cx, cy + 20);
    ctx.scale(1.1, squish);
    ctx.beginPath();
    ctx.ellipse(0, 0, 55, 40 + melt * 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var ix = cx - 40 + i * 16;
      ctx.beginPath();
      ctx.moveTo(ix, cy - 35);
      ctx.lineTo(ix + 4, cy - 55);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "700 14px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("slow rise…", cx, H - 24);
  }

  function drawElephants(elapsed) {
    var t = (elapsed % 24) / 24;
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#bae6fd");
    bg.addColorStop(1, "#7dd3fc");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    for (var w = 0; w < 5; w++) {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(W * 0.2 + w * 0.15 * W + Math.sin(elapsed + w) * 20, H * 0.58, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    [0.35, 0.5, 0.65].forEach(function (xp, i) {
      var ex = W * xp;
      var bob = Math.sin(elapsed * 3 + i) * 6;
      var ey = H * 0.52 + bob;
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.ellipse(ex, ey + 18, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(ex, ey, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ex + 12, ey + 5);
      ctx.quadraticCurveTo(ex + 28, ey + 15, ex + 32, ey - 5 + Math.sin(elapsed * 4 + i) * 8);
      ctx.stroke();
      if (Math.sin(elapsed * 2 + i * 2) > 0.85) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(ex + 20, ey - 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = "#0c4a6e";
    ctx.font = "800 15px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("маленькие слоники купаются 🐘", W / 2, 32);
  }

  function drawSquish(elapsed) {
    var t = (elapsed % 20) / 20;
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, W, H);
    var cx = W / 2;
    var cy = H / 2;
    var press = Math.sin(elapsed * 1.5);
    var scaleY = press > 0 ? 0.75 + press * 0.15 : 1 + Math.abs(press) * 0.2;
    var scaleX = press > 0 ? 1.15 - press * 0.1 : 0.9;

    ctx.fillStyle = "#fbbf24";
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);
    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(-20, -15, 25, 15, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#c4b5fd";
    ctx.font = "700 13px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("нажми экран — squish ♡", W / 2, H - 28);
  }

  function drawIceWater(elapsed) {
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(0, 0, W, H);
    var cx = W / 2;
    var cy = H * 0.45;
    for (var c = 0; c < 8; c++) {
      var ang = c / 8 * Math.PI * 2 + elapsed * 0.2;
      var r = 50 + Math.sin(elapsed + c) * 8;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      ctx.lineTo(cx + Math.cos(ang + 0.4) * (r + 20), cy + Math.sin(ang + 0.4) * (r + 20));
      ctx.lineTo(cx + Math.cos(ang + 0.2) * (r + 10), cy + Math.sin(ang + 0.2) * (r + 10));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRain(elapsed) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 1;
    for (var i = 0; i < 40; i++) {
      var x = (i * 47 + elapsed * 80) % W;
      var y = (i * 31 + elapsed * 120) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 14);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(W * 0.1, H * 0.15, W * 0.8, H * 0.7);
    ctx.font = "700 14px system-ui,sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("шшшш… дождь", W / 2, H - 30);
  }

  var DRAWERS = {
    butter_ice: drawButterIce,
    elephants: drawElephants,
    squish: drawSquish,
    ice_water: drawIceWater,
    rain: drawRain,
  };

  function render(elapsed) {
    var v = VIDEOS[current];
    (DRAWERS[v.id] || drawSquish)(elapsed);
    frame++;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = "#fff";
    ctx.font = "800 15px system-ui,sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(v.title, 12, 22);
    ctx.font = "600 11px system-ui,sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(v.sub, 12, 38);

    var prog = (elapsed % v.dur) / v.dur;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, H - 4, W, 4);
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(0, H - 4, W * prog, 4);
  }

  function loop(now) {
    if (!playing) return;
    var elapsed = (now - t0) / 1000;
    render(elapsed);
    raf = requestAnimationFrame(loop);
  }

  function startPlay() {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    playing = true;
    t0 = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    document.getElementById("btn-play").textContent = "■ Пауза";
  }

  function stopPlay() {
    playing = false;
    cancelAnimationFrame(raf);
    document.getElementById("btn-play").textContent = "▶ Смотреть";
  }

  function showVideo(i) {
    current = (i + VIDEOS.length) % VIDEOS.length;
    var v = VIDEOS[current];
    document.getElementById("vid-title").textContent = v.title;
    document.getElementById("vid-sub").textContent = v.sub;
    renderList();
    t0 = performance.now();
    if (playing) raf = requestAnimationFrame(loop);
    else {
      ctx.clearRect(0, 0, W, H);
      render(0);
    }
  }

  function renderList() {
    var list = document.getElementById("playlist");
    list.innerHTML = "";
    VIDEOS.forEach(function (v, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pl-item" + (i === current ? " on" : "");
      b.innerHTML = "<strong>" + v.title + "</strong><span>" + v.sub + "</span>";
      b.onclick = function () { showVideo(i); startPlay(); };
      list.appendChild(b);
    });
  }

  function init() {
    canvas = document.getElementById("screen");
    ctx = canvas.getContext("2d");
    W = canvas.width;
    H = canvas.height;

    renderList();
    showVideo(0);

    document.getElementById("btn-play").onclick = function () {
      if (playing) stopPlay();
      else startPlay();
    };
    document.getElementById("btn-prev").onclick = function () { showVideo(current - 1); if (!playing) startPlay(); };
    document.getElementById("btn-next").onclick = function () { showVideo(current + 1); if (!playing) startPlay(); };

    canvas.addEventListener("click", function () {
      ensureAudio();
      var v = VIDEOS[current];
      if (v.id === "squish" || v.id === "butter_ice") squish();
      else if (v.id === "ice_water") crack();
      else if (v.id === "elephants") splash();
    });

    document.getElementById("vol").oninput = function () {
      if (master) master.gain.value = vol();
    };

    startPlay();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
