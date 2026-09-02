(function () {
  "use strict";

  var STORE_ACH = "school-party-ach-v1";
  var STORE_SECRET = "school-party-secret-v1";

  var canvas, ctx, W, H;
  var mode = "tap";
  var running = false;
  var isOwner = false;
  var myScore = 0;
  var rivalScore = 0;
  var rivalName = "";
  var timeLeft = 0;
  var raf = 0;
  var runY = 180;
  var runVy = 0;
  var runDist = 0;
  var runX = 50;
  var obstacles = [];
  var doodlePaths = [];
  var doodleLaugh = 0;
  var tapEndAt = 0;
  var enemyX = 400;
  var clones = [];
  var levUntil = 0;
  var shieldHits = 0;
  var invisibleUntil = 0;
  var powerCd = {};
  var secretUnlocked = false;
  var achievements = {};

  var ACH = [
    { id: "first", label: "🎉 Первый заход", check: function () { return true; } },
    { id: "tap30", label: "👏 30 хлопков", check: function () { return myScore >= 30; } },
    { id: "run100", label: "🎒 100 метров", check: function () { return runDist >= 100; } },
    { id: "clone", label: "👥 Клон!", check: function () { return achievements._usedClone; } },
    { id: "teleport", label: "✨ Телепорт", check: function () { return achievements._usedTp; } },
    { id: "escape", label: "🏃 Убежал!", check: function () { return achievements._escaped; } },
    { id: "secret", label: "⭐ Секрет", check: function () { return secretUnlocked; } },
  ];

  var POWERS_OWNER = [
    { id: "teleport", label: "✨ Телепорт", cd: 2500, fn: powerTeleport },
    { id: "clone", label: "👥 Клон", cd: 4000, fn: powerClone },
    { id: "levitate", label: "🎈 Левитация", cd: 3500, fn: powerLevitate },
    { id: "invis", label: "👻 Невидимка", cd: 5000, fn: powerInvis },
    { id: "dash", label: "💨 Рывок", cd: 2000, fn: powerDash },
  ];

  var POWERS_FRIEND = [
    { id: "teleport", label: "✨ Телепорт", cd: 3000, fn: powerTeleport },
    { id: "clone", label: "👥 Клон", cd: 4500, fn: powerClone },
    { id: "levitate", label: "🎈 Левитация", cd: 4000, fn: powerLevitate },
    { id: "shield", label: "🛡 Щит", cd: 5000, fn: powerShield },
    { id: "dash", label: "💨 Рывок", cd: 2500, fn: powerDash },
  ];

  function $(id) { return document.getElementById(id); }

  function toast(msg) {
    var el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function myNick() {
    return window.AmalFriendsNet && AmalFriendsNet.nick ? AmalFriendsNet.nick() : "Ты";
  }

  function canPlay() {
    if (window.__SCHOOL_PARTY_OK__ || window.__AMAL_OWNER__) return true;
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("owner") === "AmalOwner2026") {
        window.__AMAL_OWNER__ = true;
        return true;
      }
      if (["amal", "1234", "buddy", "amalowner2026"].indexOf((q.get("owner") || "").toLowerCase()) >= 0) {
        window.__AMAL_OWNER__ = true;
        return true;
      }
      if (q.get("code") === "amal-star-friends" || q.get("from") === "friends" || q.get("friends") === "1") {
        return true;
      }
    } catch (_) {}
    if (window.AmalHubBack && AmalHubBack.wire) AmalHubBack.wire();
    if (window.AmalDevice) {
      if (AmalDevice.isSiteOwner && AmalDevice.isSiteOwner()) return true;
      if (AmalDevice.friendsAllowed && AmalDevice.friendsAllowed()) return true;
    }
    try {
      return localStorage.getItem("amal-friends-access-v1") === "1" ||
        localStorage.getItem("amal-owner-v1") === "1" ||
        localStorage.getItem("amal-owner-v3") === "1";
    } catch (_) { return false; }
  }

  function loadAch() {
    try {
      achievements = JSON.parse(localStorage.getItem(STORE_ACH) || "{}") || {};
    } catch (_) { achievements = {}; }
    secretUnlocked = localStorage.getItem(STORE_SECRET) === "1" || achievements.secret;
    if (secretUnlocked) {
      var sec = $("mode-secret");
      if (sec) sec.classList.add("show");
    }
  }

  function saveAch() {
    try { localStorage.setItem(STORE_ACH, JSON.stringify(achievements)); } catch (_) {}
  }

  function unlockAch(id, msg) {
    if (achievements[id]) return;
    achievements[id] = true;
    saveAch();
    toast("🏆 " + (msg || "Достижение!"));
    renderAch();
    if (id === "secret" || Object.keys(achievements).filter(function (k) { return k[0] !== "_"; }).length >= 3) {
      secretUnlocked = true;
      try { localStorage.setItem(STORE_SECRET, "1"); } catch (_) {}
      var sec = $("mode-secret");
      if (sec) sec.classList.add("show");
    }
  }

  function renderAch() {
    var box = $("ach-list");
    if (!box) return;
    box.innerHTML = ACH.map(function (a) {
      var on = achievements[a.id] ? " on" : "";
      return '<span class="ach' + on + '">' + a.label + "</span>";
    }).join("");
  }

  function checkAchievements() {
    ACH.forEach(function (a) {
      if (!achievements[a.id] && a.check()) unlockAch(a.id);
    });
  }

  function renderScores() {
    var box = $("scores");
    if (!box) return;
    box.innerHTML =
      '<span class="score-pill me">' + (isOwner ? "👑" : "🟢") + " " + esc(myNick()) + ": " + myScore + "</span>" +
      (rivalName
        ? '<span class="score-pill">🔵 ' + esc(rivalName) + ": " + rivalScore + "</span>"
        : '<span class="score-pill">🟡 Жди друга…</span>');
  }

  function renderPowers() {
    var box = $("powers");
    if (!box) return;
    var list = isOwner ? POWERS_OWNER : POWERS_FRIEND;
    box.innerHTML = list.map(function (p) {
      return '<button type="button" data-p="' + p.id + '" class="' + (isOwner ? "owner" : "") + '">' + p.label + "</button>";
    }).join("");
    box.querySelectorAll("[data-p]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        usePower(btn.getAttribute("data-p"));
      };
    });
  }

  function powerReady(id) {
    return !powerCd[id] || Date.now() > powerCd[id];
  }

  function setPowerCd(id, ms) {
    powerCd[id] = Date.now() + ms;
    setTimeout(renderPowers, 50);
  }

  function usePower(id) {
    if (!running && mode !== "tap") { toast("Сначала жми ▶ Играть!"); return; }
    var list = isOwner ? POWERS_OWNER : POWERS_FRIEND;
    var p = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) { p = list[i]; break; }
    if (!p || !powerReady(id)) { toast("⏳ Подожди чуть-чуть…"); return; }
    p.fn(isOwner);
    setPowerCd(id, p.cd);
    if (mode === "tap") { myScore += isOwner ? 3 : 2; renderScores(); }
  }

  function powerTeleport(strong) {
    achievements._usedTp = true;
    if (mode === "chase" || mode === "run" || mode === "secret") {
      runX = Math.min(W - 60, runX + (strong ? 120 : 80));
      runDist += strong ? 15 : 10;
      toast("✨ Телепорт!");
    } else toast("✨ Телепорт — +очки!");
    checkAchievements();
  }

  function powerClone(strong) {
    achievements._usedClone = true;
    clones.push({ x: runX, life: strong ? 5 : 3.5, t: Date.now() });
    toast("👥 Клон! Враг отвлечётся!");
    checkAchievements();
  }

  function powerLevitate() {
    levUntil = Date.now() + 2500;
    runVy = -4;
    toast("🎈 Левитация!");
  }

  function powerInvis() {
    invisibleUntil = Date.now() + 3000;
    toast("👻 Невидимка — враг не видит!");
  }

  function powerShield() {
    shieldHits = 2;
    toast("🛡 Щит на 2 удара!");
  }

  function powerDash(strong) {
    runDist += strong ? 25 : 18;
    runX = Math.min(W - 50, runX + 40);
    toast("💨 Рывок!");
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
    runX = 50;
    runY = H * 0.5;
    runVy = 0;
    enemyX = W - 80;
    obstacles = [];
    clones = [];
    doodlePaths = [];
    doodleLaugh = 0;
    powerCd = {};
    $("timer").textContent = "—";
    $("btn-go").textContent = "▶ Играть!";
    renderScores();
    renderPowers();
    drawIdle();
  }

  function drawIdle() {
    ctx.fillStyle = mode === "secret" ? "#422006" : "#334155";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
    ctx.fillStyle = "#fde68a";
    ctx.font = "900 22px system-ui,sans-serif";
    ctx.textAlign = "center";
    var titles = {
      tap: "👏 Жми экран!",
      run: "🎒 Тап — прыжок!",
      chase: "👹 Враг! Способности ↓",
      doodle: "😂 Рисуй!",
      secret: "✨ Секретный коридор!",
    };
    ctx.fillText(titles[mode] || "Играем", W / 2, H * 0.4);
    ctx.font = "600 14px system-ui,sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Способности есть у всех!", W / 2, H * 0.52);
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

  function drawRunner() {
    var inv = invisibleUntil > Date.now();
    ctx.globalAlpha = inv ? 0.35 : 1;
    ctx.fillStyle = isOwner ? "#fde047" : "#fbbf24";
    ctx.fillRect(runX, runY, 36, 36);
    ctx.font = "28px serif";
    ctx.fillText(isOwner ? "👑" : "🎒", runX - 6, runY + 30);
    ctx.globalAlpha = 1;
  }

  function startGame() {
    if (running) return;
    running = true;
    myScore = 0;
    enemyX = W - 60;
    $("btn-go").textContent = "■ Стоп";

    if (mode === "tap") {
      tapEndAt = Date.now() + 10000;
      toast("👏 Хлопай!");
      if (AmalFriendsNet && AmalFriendsNet.broadcastRace) {
        AmalFriendsNet.broadcastRace({ phase: "start", mode: "tap", t: Date.now() });
      }
      tickTap();
    } else if (mode === "run" || mode === "chase" || mode === "secret") {
      timeLeft = mode === "secret" ? 30 : mode === "chase" ? 25 : 20;
      obstacles = [];
      runDist = 0;
      runX = 50;
      toast(mode === "chase" ? "👹 Убегай! Клон + телепорт!" : "🎒 Беги!");
      tickRun();
    } else {
      timeLeft = 15;
      doodlePaths = [];
      doodleLaugh = 0;
      toast("😂 Рисуй!");
      tickDoodle();
    }
    renderScores();
    unlockAch("first", "Добро пожаловать!");
  }

  function stopGame() {
    running = false;
    cancelAnimationFrame(raf);
    $("btn-go").textContent = "▶ Ещё раз!";
    checkAchievements();
    if (AmalFriendsNet && AmalFriendsNet.postResult) {
      AmalFriendsNet.postResult("Школьная вечеринка", myScore, mode);
    }
    renderScores();
    toast("✨ Баллы: " + myScore);
  }

  function tickTap() {
    if (!running) return;
    var left = Math.max(0, Math.ceil((tapEndAt - Date.now()) / 1000));
    $("timer").textContent = left + " сек";
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 70 + Math.sin(Date.now() / 120) * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.font = "900 36px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(myScore), W / 2, H / 2 + 12);
    if (left <= 0) { stopGame(); return; }
    raf = requestAnimationFrame(tickTap);
  }

  function tickRun() {
    if (!running) return;
    var lev = levUntil > Date.now();
    if (!lev) runVy += 0.55;
    runY += runVy;
    if (runY > H * 0.65) { runY = H * 0.65; runVy = 0; }
    if (lev) runY = Math.max(H * 0.35, runY - 0.8);
    runDist += mode === "secret" ? 3 : 2.2;
    myScore = Math.floor(runDist);
    runX = Math.min(W - 50, runX + 0.15);

    if (Math.random() < 0.03) obstacles.push({ x: W + 20, h: 28 + Math.random() * 22 });
    obstacles.forEach(function (o) { o.x -= 4.2; });
    obstacles = obstacles.filter(function (o) {
      if (o.x < -40) return true;
      if (o.x < runX + 36 && o.x > runX - 10 && runY > H * 0.65 - o.h - 30) {
        if (shieldHits > 0) { shieldHits--; toast("🛡 Щит!"); }
        else { runDist *= 0.9; toast("📚 Учебник!"); }
      }
      return o.x > -40;
    });

    if (mode === "chase" || mode === "secret") {
      var targetX = runX;
      var distracted = false;
      clones = clones.filter(function (c) {
        c.life -= 1 / 60;
        if (c.life > 0) { targetX = c.x; distracted = true; return true; }
        return false;
      });
      if (!distracted && invisibleUntil <= Date.now()) {
        enemyX += mode === "secret" ? 2.2 : 2.8;
        if (enemyX > runX - 20) {
          if (shieldHits > 0) { shieldHits--; enemyX -= 40; toast("🛡 Удар!"); }
          else {
            toast("👹 Догнал! Телепорт или клон!");
            runDist *= 0.85;
            enemyX = runX + 60;
          }
        }
      } else if (distracted) {
        enemyX += (targetX - enemyX) * 0.08;
      }
      if (runDist > 80 && mode === "chase") {
        achievements._escaped = true;
        unlockAch("escape", "Убежал от врага!");
      }
    }

    ctx.fillStyle = mode === "secret" ? "#422006" : "#0f172a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
    drawRunner();
    clones.forEach(function (c) {
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(c.x, runY, 32, 32);
      ctx.font = "24px serif";
      ctx.fillText("👤", c.x - 4, runY + 28);
    });
    if (mode === "chase" || mode === "secret") {
      ctx.font = "32px serif";
      ctx.fillText(mode === "secret" ? "🌟" : "👹", enemyX, runY + 30);
    }
    ctx.fillStyle = "#fca5a5";
    obstacles.forEach(function (o) {
      ctx.fillRect(o.x, H * 0.72 - o.h, 28, o.h);
    });
    ctx.fillStyle = "#fff";
    ctx.font = "800 14px system-ui,sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("📏 " + Math.floor(runDist) + " м", 12, 22);
    $("timer").textContent = Math.ceil(timeLeft) + " сек";
    timeLeft -= 1 / 60;
    if (timeLeft <= 0) { stopGame(); return; }
    raf = requestAnimationFrame(tickRun);
  }

  function tickDoodle() {
    if (!running) return;
    ctx.fillStyle = "#422006";
    ctx.fillRect(0, 0, W, H);
    drawBoard(false);
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
      if (myScore >= 30) unlockAch("tap30");
    } else if (mode === "run" || mode === "chase" || mode === "secret") {
      runVy = -9;
    } else if (mode === "doodle") {
      doodleLaugh += 3;
      myScore = doodleLaugh;
      renderScores();
    }
  }

  function onDraw(x, y) {
    if (mode !== "doodle" || !running) return;
    if (!doodlePaths.length || !doodlePaths[doodlePaths.length - 1].pts) {
      doodlePaths.push({ color: "#fff", pts: [] });
    }
    var p = doodlePaths[doodlePaths.length - 1];
    p.pts.push({ x: x, y: y });
  }

  function renderInbox(list) {
    var box = $("challenge-inbox");
    if (!box) return;
    if (!list.length) { box.innerHTML = ""; return; }
    box.innerHTML = list.map(function (c) {
      return '<div class="ch-card"><b>' + esc(c.from) + "</b> зовёт: <b>" + esc(c.label || "") +
        '</b><br><button type="button" class="yes" data-yes="' + esc(c.id) + '">✅ Иду!</button></div>';
    }).join("");
    box.querySelectorAll(".yes").forEach(function (b) {
      b.onclick = function () {
        AmalFriendsNet.acceptChallenge(b.getAttribute("data-yes"));
        startGame();
      };
    });
  }

  function modeLabel(m) {
    return { run: "🎒 Бег", chase: "👹 Погоня", doodle: "😂 Урок", secret: "✨ Секрет", tap: "👏 Хлоп" }[m] || "игра";
  }

  function init() {
    if (!canPlay()) {
      $("locked").hidden = false;
      return;
    }
    $("app").hidden = false;
    isOwner = !!(window.AmalDevice && AmalDevice.isSiteOwner && AmalDevice.isSiteOwner());
    if (window.AmalFriendsNet && AmalFriendsNet.isOwner && AmalFriendsNet.isOwner()) isOwner = true;

    canvas = $("c");
    ctx = canvas.getContext("2d");
    W = canvas.width;
    H = canvas.height;
    loadAch();
    renderAch();
    renderPowers();
    unlockAch("first");

    AmalFriendsNet.initLite(function () {
      AmalFriendsNet.onChallenges(renderInbox);
      AmalFriendsNet.onRaceUpdate(function (data) {
        if (!data || !data.name || data.name === myNick()) return;
        rivalName = data.name;
        if (typeof data.score === "number") rivalScore = data.score;
        renderScores();
      });
    });

    document.querySelectorAll(".mode-btn").forEach(function (b) {
      b.onclick = function () { setMode(b.getAttribute("data-mode")); };
    });

    $("btn-go").onclick = function () { running ? stopGame() : startGame(); };

    $("btn-challenge").onclick = function () {
      if (!AmalFriendsNet.nick()) {
        var n = prompt("Имя:", "");
        if (n) AmalFriendsNet.setNick(n); else return;
      }
      AmalFriendsNet.sendChallenge({ game: "school-party", mode: mode, label: modeLabel(mode) });
      toast("📣 Вызов отправлен!");
    };

    $("btn-nick").onclick = function () {
      var n = prompt("Имя:", AmalFriendsNet.nick() || "");
      if (n) { AmalFriendsNet.setNick(n); renderScores(); }
    };

    var badge = $("badge-star");
    var starTaps = 0;
    if (badge) {
      badge.onclick = function () {
        starTaps++;
        if (starTaps >= 5) {
          unlockAch("secret", "⭐ Секретный коридор открыт!");
          setMode("secret");
        }
      };
    }

    canvas.addEventListener("click", onTap);
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); onTap(); }, { passive: false });

    var drawing = false;
    function pos(ev) {
      var r = canvas.getBoundingClientRect();
      var t = ev.touches ? ev.touches[0] : ev;
      return { x: (t.clientX - r.left) * (W / r.width), y: (t.clientY - r.top) * (H / r.height) };
    }
    canvas.addEventListener("mousedown", function (e) { drawing = true; onDraw(pos(e).x, pos(e).y); });
    canvas.addEventListener("mousemove", function (e) { if (drawing) onDraw(pos(e).x, pos(e).y); });
    canvas.addEventListener("mouseup", function () { drawing = false; doodlePaths.push({ color: "#fff", pts: [] }); });
    canvas.addEventListener("touchmove", function (e) {
      e.preventDefault();
      var p = pos(e);
      onDraw(p.x, p.y);
    }, { passive: false });

    resetArena();
    if (isOwner) toast("👑 Амаль — все способности твои!");
    AmalFriendsNet.trackGame("Школьная вечеринка");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
