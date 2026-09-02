/**
 * ASMR «видео» v2 — громкий squish + хруст льда (баттерсквиш).
 */
(function () {
  "use strict";

  var canvas, ctx, W, H;
  var audioCtx, master, compressor;
  var current = 0;
  var playing = false;
  var frame = 0;
  var raf = 0;
  var t0 = 0;
  var lastAutoAt = -99;
  var lastPressPhase = 0;
  var meltCracked = false;

  var VIDEOS = [
    {
      id: "butter_ice",
      title: "🧈 Баттерсквиш во льду",
      sub: "Squish + хруст льда · жми экран",
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
      sub: "Авто-squish · жми для ещё громче",
      dur: 20,
    },
    {
      id: "ice_water",
      title: "🧊 Лёд в воде",
      sub: "Хруст · треск · прохлада",
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
    master.gain.value = boostVol();
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    master.connect(compressor);
    compressor.connect(audioCtx.destination);
  }

  function boostVol() {
    var s = document.getElementById("vol");
    var base = s ? Number(s.value) / 100 : 0.85;
    return Math.min(1.8, base * 1.35);
  }

  function vol() {
    return boostVol();
  }

  function resumeAudio() {
    ensureAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function noiseBurst(dur, filterFreq, gain, type, q) {
    var len = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
    var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var env = 1 - i / len;
      d[i] = (Math.random() * 2 - 1) * env * env;
    }
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var filt = audioCtx.createBiquadFilter();
    filt.type = type || "bandpass";
    filt.frequency.value = filterFreq;
    if (q) filt.Q.value = q;
    var g = audioCtx.createGain();
    g.gain.value = gain * vol();
    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    src.start();
  }

  function toneAt(t, freq, dur, type, gain, sweep) {
    var o = audioCtx.createOscillator();
    var gn = audioCtx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (sweep) o.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    gn.gain.setValueAtTime(0.001, t);
    gn.gain.exponentialRampToValueAtTime(Math.max(0.001, gain * vol()), t + 0.008);
    gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(gn);
    gn.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Баттерсквиш — мягкий sticky squish + slow rise */
  function butterSquish(extraLoud) {
    resumeAudio();
    var t = audioCtx.currentTime;
    var amp = extraLoud ? 1.15 : 0.95;
    toneAt(t, 165 + Math.random() * 25, 0.16, "sine", 0.55 * amp, 75);
    toneAt(t + 0.025, 95, 0.22, "triangle", 0.45 * amp, 55);
    noiseBurst(0.09, 650, 0.5 * amp, "bandpass", 1.2);
    noiseBurst(0.05, 1100, 0.35 * amp, "lowpass", 0.8);
    setTimeout(function () {
      toneAt(audioCtx.currentTime, 88, 0.35, "sine", 0.4 * amp, 130);
      noiseBurst(0.07, 420, 0.38 * amp, "bandpass", 0.9);
    }, 90);
  }

  /** Хруст льда — резкий crack + мелкие осколки */
  function iceCrunch(extraLoud) {
    resumeAudio();
    var amp = extraLoud ? 1.2 : 1;
    noiseBurst(0.07, 6500, 0.75 * amp, "highpass", 0.7);
    noiseBurst(0.05, 4200, 0.55 * amp, "bandpass", 2);
    noiseBurst(0.04, 9000, 0.45 * amp, "highpass", 0.5);
    var t = audioCtx.currentTime;
    toneAt(t, 1400 + Math.random() * 800, 0.035, "square", 0.2 * amp);
    toneAt(t + 0.04, 900 + Math.random() * 400, 0.03, "square", 0.15 * amp);
    setTimeout(function () {
      noiseBurst(0.04, 5500, 0.4 * amp, "highpass", 0.6);
    }, 55);
  }

  /** Баттер + лёд вместе — то, что ты хотела */
  function butterIceASMR(extraLoud) {
    butterSquish(extraLoud);
    setTimeout(function () { iceCrunch(extraLoud); }, 50);
    setTimeout(function () { butterSquish(false); }, 180);
  }

  function squish() {
    butterSquish(true);
  }

  function crack() {
    iceCrunch(true);
  }

  function splash() {
    resumeAudio();
    noiseBurst(0.1, 700, 0.55, "bandpass", 1);
    noiseBurst(0.06, 300, 0.4, "lowpass", 0.5);
  }

  function rainTick() {
    noiseBurst(0.025, 2800, 0.25, "bandpass", 2);
  }

  function maybeAutoSound(elapsed, videoId) {
    if (videoId === "butter_ice") {
      var t = (elapsed % 28) / 28;
      if (t > 0.38 && t < 0.42 && !meltCracked) {
        meltCracked = true;
        butterIceASMR(true);
      }
      if (t < 0.05) meltCracked = false;
      if (elapsed - lastAutoAt > 2.8) {
        lastAutoAt = elapsed;
        butterIceASMR(false);
      }
    } else if (videoId === "squish") {
      var press = Math.sin(elapsed * 1.5);
      if (press > 0.92 && lastPressPhase <= 0.92) butterSquish(true);
      if (press < -0.85 && lastPressPhase >= -0.85) butterSquish(true);
      lastPressPhase = press;
    } else if (videoId === "ice_water") {
      if (elapsed - lastAutoAt > 2.2) {
        lastAutoAt = elapsed;
        iceCrunch(true);
      }
    } else if (videoId === "rain") {
      if (elapsed - lastAutoAt > 0.35) {
        lastAutoAt = elapsed;
        rainTick();
      }
    } else if (videoId === "elephants") {
      if (elapsed - lastAutoAt > 2.5) {
        lastAutoAt = elapsed;
        splash();
      }
    }
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
    var squishAmt = 1 + Math.sin(elapsed * 2) * 0.06 * melt;

    ctx.fillStyle = "rgba(186,230,253,0.35)";
    roundRect(cx - 90, cy - 30, 180, 100, 20);
    ctx.fill();

    ctx.fillStyle = "#fde047";
    ctx.save();
    ctx.translate(cx, cy + 20);
    ctx.scale(1.1, squishAmt);
    ctx.beginPath();
    ctx.ellipse(0, 0, 55, 40 + melt * 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 2.5;
    for (var i = 0; i < 6; i++) {
      var ix = cx - 40 + i * 16;
      ctx.beginPath();
      ctx.moveTo(ix, cy - 35);
      ctx.lineTo(ix + 4, cy - 55);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 14px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔊 жми — squish + хруст льда", cx, H - 24);
  }

  function drawElephants(elapsed) {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#bae6fd");
    bg.addColorStop(1, "#7dd3fc");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

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
    });
    ctx.fillStyle = "#0c4a6e";
    ctx.font = "800 15px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("маленькие слоники купаются 🐘", W / 2, 32);
  }

  function drawSquish(elapsed) {
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, W, H);
    var cx = W / 2;
    var cy = H / 2;
    var press = Math.sin(elapsed * 1.5);
    var scaleY = press > 0 ? 0.72 + press * 0.18 : 1 + Math.abs(press) * 0.22;
    var scaleX = press > 0 ? 1.18 - press * 0.12 : 0.88;

    ctx.fillStyle = "#fbbf24";
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);
    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.ellipse(-20, -15, 25, 15, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fde68a";
    ctx.font = "700 13px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔊 auto squish · жми громче", W / 2, H - 28);
  }

  function drawIceWater(elapsed) {
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(0, 0, W, H);
    var cx = W / 2;
    var cy = H * 0.45;
    for (var c = 0; c < 8; c++) {
      var ang = c / 8 * Math.PI * 2 + elapsed * 0.2;
      var r = 50 + Math.sin(elapsed + c) * 8;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      ctx.lineTo(cx + Math.cos(ang + 0.4) * (r + 20), cy + Math.sin(ang + 0.4) * (r + 20));
      ctx.lineTo(cx + Math.cos(ang + 0.2) * (r + 10), cy + Math.sin(ang + 0.2) * (r + 10));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "700 13px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔊 жми — хруст льда", W / 2, H - 28);
  }

  function drawRain(elapsed) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,0.55)";
    ctx.lineWidth = 1.2;
    for (var i = 0; i < 40; i++) {
      var x = (i * 47 + elapsed * 80) % W;
      var y = (i * 31 + elapsed * 120) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 14);
      ctx.stroke();
    }
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
    maybeAutoSound(elapsed, v.id);
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
    render((now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  }

  function startPlay() {
    resumeAudio();
    playing = true;
    t0 = performance.now();
    lastAutoAt = -99;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    document.getElementById("btn-play").textContent = "■ Пауза";
    butterIceASMR(true);
  }

  function stopPlay() {
    playing = false;
    cancelAnimationFrame(raf);
    document.getElementById("btn-play").textContent = "▶ Смотреть";
  }

  function showVideo(i) {
    current = (i + VIDEOS.length) % VIDEOS.length;
    meltCracked = false;
    lastAutoAt = -99;
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

  function onTap() {
    resumeAudio();
    var v = VIDEOS[current];
    if (v.id === "butter_ice") butterIceASMR(true);
    else if (v.id === "squish") butterSquish(true);
    else if (v.id === "ice_water") iceCrunch(true);
    else if (v.id === "elephants") splash();
    else rainTick();
  }

  function init() {
    canvas = document.getElementById("screen");
    ctx = canvas.getContext("2d");
    W = canvas.width;
    H = canvas.height;

    var volEl = document.getElementById("vol");
    if (volEl) volEl.value = "85";

    renderList();
    showVideo(0);

    document.getElementById("btn-play").onclick = function () {
      if (playing) stopPlay();
      else startPlay();
    };
    document.getElementById("btn-prev").onclick = function () { showVideo(current - 1); if (!playing) startPlay(); };
    document.getElementById("btn-next").onclick = function () { showVideo(current + 1); if (!playing) startPlay(); };

    canvas.addEventListener("click", onTap);
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); onTap(); }, { passive: false });

    volEl.oninput = function () {
      if (master) master.gain.value = boostVol();
    };

    document.body.addEventListener("click", function once() {
      resumeAudio();
      document.body.removeEventListener("click", once);
    });

    startPlay();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
