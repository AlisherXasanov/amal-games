(function () {
  "use strict";

  var canvas, ctx, W, H;
  var mode = "tap";
  var running = false;
  var myScore = 0;
  var rivalScore = 0;
  var rivalName = "";
  var timeLeft = 0;
  var raf = 0;
  var runY = 180;
  var runVy = 0;
  var runDist = 0;
  var obstacles = [];
  var doodlePaths = [];
  var doodleLaugh = 0;
  var challengeId = null;

  function $(id) { return document.getElementById(id); }

  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function myNick() {
    return window.AmalFriendsNet ? AmalFriendsNet.nick() : "Ты";
  }

  function renderScores() {
    var box = $("scores");
    if (!box) return;
    box.innerHTML =
      '<span class="score-pill me">🟢 ' + esc(myNick()) + ": " + myScore + "</span>" +
      (rivalName
        ? '<span class="score-pill">🔵 ' + esc(rivalName) + ": " + rivalScore + "</span>"
        : '<span class="score-pill">🟡 Жди друга…</span>');
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll(".mode-btn").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-mode") === m);
    });
    resetArena();
  }

  function resetArena() {
    running = false;
    cancelAnimationFrame(raf);
    myScore = 0;
    rivalScore = 0;
    runDist = 0;
    runY = H * 0.5;
    runVy = 0;
    obstacles = [];
    doodlePaths = [];
    doodleLaugh = 0;
    $("timer").textContent = "—";
    $("btn-go").textContent = "▶ Играть!";
    renderScores();
    drawIdle();
  }

  function drawIdle() {
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
    ctx.fillStyle = "#fde68a";
    ctx.font = "900 22px system-ui,sans-serif";
    ctx.textAlign = "center";
    var titles = { tap: "👏 Жми экран!", run: "🎒 Тап — прыжок!", doodle: "😂 Рисуй пальцем!" };
    ctx.fillText(titles[mode] || "Играем", W / 2, H * 0.42);
    ctx.font = "600 14px system-ui,sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Не викторина — просто весело!", W / 2, H * 0.52);
    if (mode === "doodle") drawBoard(true);
  }

  function drawBoard(empty) {
    ctx.fillStyle = "#166534";
    ctx.fillRect(W * 0.08, H * 0.12, W * 0.84, H * 0.55);
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.08, H * 0.12, W * 0.84, H * 0.55);
    if (!empty) {
      doodlePaths.forEach(function (p) {
        if (!p.pts || p.pts.length < 2) return;
        ctx.strokeStyle = p.color || "#fff";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.pts[0].x, p.pts[0].y);
        for (var i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i].x, p.pts[i].y);
        ctx.stroke();
      });
    }
  }

  var tapEndAt = 0;

  function startGame() {
    if (running) return;
    running = true;
    myScore = 0;
    rivalScore = 0;
    $("btn-go").textContent = "■ Стоп";

    if (mode === "tap") {
      timeLeft = 10;
      tapEndAt = Date.now() + 10000;
      toast("👏 Хлопай быстрее!");
      if (AmalFriendsNet && AmalFriendsNet.broadcastRace) {
        AmalFriendsNet.broadcastRace({ phase: "start", mode: "tap", t: Date.now() });
      }
      tickTap();
    } else if (mode === "run") {
      timeLeft = 20;
      obstacles = [];
      runDist = 0;
      toast("🎒 Прыгай через учебники!");
      tickRun();
    } else {
      timeLeft = 15;
      doodlePaths = [];
      doodleLaugh = 0;
      toast("😂 Рисуй что-то смешное!");
      tickDoodle();
    }
    renderScores();
  }

  function stopGame() {
    running = false;
    cancelAnimationFrame(raf);
    $("btn-go").textContent = "▶ Ещё раз!";
    if (mode === "tap" && AmalFriendsNet && AmalFriendsNet.broadcastRace) {
      AmalFriendsNet.broadcastRace({
        phase: "done", mode: "tap", score: myScore, name: myNick(), t: Date.now(),
      });
      AmalFriendsNet.postResult("Школьная вечеринка", myScore, mode);
    }
    if (mode === "run") AmalFriendsNet && AmalFriendsNet.postResult("Бег с рюкзаком", Math.floor(runDist), "run");
    if (mode === "doodle") {
      myScore = doodleLaugh + doodlePaths.length * 2;
      AmalFriendsNet && AmalFriendsNet.postResult("Смешной урок", myScore, "doodle");
    }
    renderScores();
    var msg = myScore >= rivalScore && rivalName ? "🥳 Ты выиграл!" : rivalName ? "😄 Друг молодец!" : "✨ Круто!";
    toast(msg + " Баллы: " + myScore);
  }

  function tickTap(now) {
    if (!running) return;
    var left = Math.max(0, Math.ceil((tapEndAt - Date.now()) / 1000));
    timeLeft = left;
    $("timer").textContent = left + " сек";
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    var pulse = 1 + Math.sin(Date.now() / 120) * 0.08;
    ctx.arc(W / 2, H / 2, 70 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.font = "900 36px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(myScore), W / 2, H / 2 + 12);
    ctx.font = "700 14px system-ui,sans-serif";
    ctx.fillStyle = "#fde68a";
    ctx.fillText("ЖМИ!", W / 2, H - 24);
    if (left <= 0) { stopGame(); return; }
    raf = requestAnimationFrame(tickTap);
  }

  function tickRun() {
    if (!running) return;
    runVy += 0.55;
    runY += runVy;
    if (runY > H * 0.65) { runY = H * 0.65; runVy = 0; }
    runDist += 2.2;
    myScore = Math.floor(runDist);

    if (Math.random() < 0.035) {
      obstacles.push({ x: W + 20, h: 30 + Math.random() * 25 });
    }
    obstacles.forEach(function (o) { o.x -= 4.5; });
    obstacles = obstacles.filter(function (o) {
      if (o.x < -40) return false;
      if (o.x < 90 && o.x > 40 && runY > H * 0.65 - o.h - 30) {
        toast("📚 Учебник! Тап — прыжок");
        runDist *= 0.92;
      }
      return true;
    });

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(50, runY, 36, 36);
    ctx.font = "28px serif";
    ctx.fillText("🎒", 42, runY + 30);
    ctx.fillStyle = "#fca5a5";
    obstacles.forEach(function (o) {
      ctx.fillRect(o.x, H * 0.72 - o.h, 28, o.h);
      ctx.font = "18px serif";
      ctx.fillText("📕", o.x + 2, H * 0.72 - o.h + 20);
    });
    ctx.fillStyle = "#fff";
    ctx.font = "800 14px system-ui,sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("📏 " + Math.floor(runDist) + " м", 12, 22);
    $("timer").textContent = timeLeft + " сек";
    timeLeft -= 1 / 60;
    if (timeLeft <= 0) { stopGame(); return; }
    raf = requestAnimationFrame(tickRun);
  }

  function tickDoodle() {
    if (!running) return;
    ctx.fillStyle = "#422006";
    ctx.fillRect(0, 0, W, H);
    drawBoard(false);
    ctx.font = "32px serif";
    ctx.textAlign = "right";
    ctx.fillText("😂".repeat(Math.min(5, Math.floor(doodleLaugh / 3))), W - 16, 40);
    ctx.fillStyle = "#fde68a";
    ctx.font = "700 13px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Рисуй — потом жми 😂 для смеха!", W / 2, H - 16);
    $("timer").textContent = Math.ceil(timeLeft) + " сек";
    timeLeft -= 1 / 60;
    if (timeLeft <= 0) { stopGame(); return; }
    raf = requestAnimationFrame(tickDoodle);
  }

  function onTap() {
    if (!running) { startGame(); return; }
    if (mode === "tap") {
      myScore++;
      renderScores();
      if (AmalFriendsNet && AmalFriendsNet.broadcastRace) {
        AmalFriendsNet.broadcastRace({ phase: "tap", score: myScore, name: myNick(), t: Date.now() });
      }
    } else if (mode === "run") {
      runVy = -9;
    } else if (mode === "doodle") {
      doodleLaugh += 3;
      myScore = doodleLaugh;
      renderScores();
    }
  }

  function onDraw(x, y) {
    if (mode !== "doodle" || !running) return;
    if (!doodlePaths.length) doodlePaths.push({ color: "#fff", pts: [] });
    var p = doodlePaths[doodlePaths.length - 1];
    p.pts.push({ x: x, y: y });
    if (p.pts.length > 1) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      var pts = p.pts;
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  function renderInbox(list) {
    var box = $("challenge-inbox");
    if (!box) return;
    if (!list.length) { box.innerHTML = ""; return; }
    box.innerHTML = list.map(function (c) {
      return (
        '<div class="ch-card" data-id="' + esc(c.id) + '">' +
        "<b>" + esc(c.from) + "</b> зовёт в <b>" + esc(c.label || "игру") + "</b>!" +
        '<br><button type="button" class="yes" data-yes="' + esc(c.id) + '">✅ Иду!</button>' +
        '<button type="button" class="no" data-no="' + esc(c.id) + '">Потом</button></div>'
      );
    }).join("");
    box.querySelectorAll("[data-yes]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-yes");
        AmalFriendsNet.acceptChallenge(id);
        if (cModeFromChallenge(list, id)) setMode(cModeFromChallenge(list, id));
        startGame();
        toast("🥳 Погнали!");
      };
    });
    box.querySelectorAll("[data-no]").forEach(function (b) {
      b.onclick = function () { AmalFriendsNet.dismissChallenge(b.getAttribute("data-no")); };
    });
  }

  function cModeFromChallenge(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i].mode || "tap";
    }
    return "tap";
  }

  function modeLabel(m) {
    return m === "run" ? "🎒 Бег с рюкзаком" : m === "doodle" ? "😂 Смешной урок" : "👏 Хлоп-хлоп";
  }

  function init() {
    if (window.AmalHubBack && AmalHubBack.wire) AmalHubBack.wire();
    if (!window.AmalDevice || !AmalDevice.friendsAllowed()) {
      $("locked").hidden = false;
      return;
    }
    $("app").hidden = false;

    canvas = $("c");
    ctx = canvas.getContext("2d");
    W = canvas.width;
    H = canvas.height;

    AmalFriendsNet.initLite(function () {
      AmalFriendsNet.onChallenges(renderInbox);
      AmalFriendsNet.onRaceUpdate(function (data) {
        if (!data) return;
        if (data.name && data.name !== myNick()) {
          rivalName = data.name;
          if (typeof data.score === "number") rivalScore = data.score;
          renderScores();
        }
        if (data.phase === "start" && data.mode) {
          setMode(data.mode);
          if (!running) startGame();
        }
      });
    });

    document.querySelectorAll(".mode-btn").forEach(function (b) {
      b.onclick = function () { setMode(b.getAttribute("data-mode")); };
    });

    $("btn-go").onclick = function () {
      if (running) stopGame();
      else startGame();
    };

    $("btn-challenge").onclick = function () {
      if (!AmalFriendsNet.nick()) {
        var n = prompt("Напиши своё имя для друзей:", "");
        if (n) AmalFriendsNet.setNick(n);
        else return;
      }
      AmalFriendsNet.sendChallenge({
        game: "school-party",
        mode: mode,
        label: modeLabel(mode),
      });
      toast("📣 Вызов отправлен друзьям!");
    };

    $("btn-nick").onclick = function () {
      var n = prompt("Твоё имя:", AmalFriendsNet.nick() || "");
      if (n) { AmalFriendsNet.setNick(n); renderScores(); }
    };

    canvas.addEventListener("click", onTap);
    canvas.addEventListener("touchstart", function (e) {
      e.preventDefault();
      onTap();
    }, { passive: false });

    var drawing = false;
    function pos(ev) {
      var r = canvas.getBoundingClientRect();
      var t = ev.touches ? ev.touches[0] : ev;
      return { x: (t.clientX - r.left) * (W / r.width), y: (t.clientY - r.top) * (H / r.height) };
    }
    canvas.addEventListener("mousedown", function (e) { drawing = true; onDraw(pos(e).x, pos(e).y); });
    canvas.addEventListener("mousemove", function (e) { if (drawing) onDraw(pos(e).x, pos(e).y); });
    canvas.addEventListener("mouseup", function () { drawing = false; if (mode === "doodle") doodlePaths.push({ color: "#fff", pts: [] }); });
    canvas.addEventListener("touchmove", function (e) {
      e.preventDefault();
      var p = pos(e);
      onDraw(p.x, p.y);
    }, { passive: false });

    resetArena();
    AmalFriendsNet.trackGame("Школьная вечеринка");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
