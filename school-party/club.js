/**
 * Клуб друзей — чат, смешное, настолки, отдых, сюрприз.
 */
(function () {
  "use strict";

  var STORE_SHARE = "school-party-share-v1";
  var STORE_SURPRISE = "school-party-golden-night-v1";
  var STORE_STARS = "school-party-friend-stars-v1";
  var EMOJIS = ["😀", "😂", "❤️", "👍", "🎮", "🐣", "⭐", "🔥", "🥳", "👋", "💜", "✨"];
  var JOKES = [
    "Почему учебник грустный? Потому что у него много проблем! 📚",
    "Учитель: почему ты опоздал? Я: часы шли, а я бежал! ⏰",
    "Школа — это место, где будильник важнее будильника… стоп 😄",
    "Что сказал ноль числу восемь? «Крутой ремень!» 😎",
    "Дружба — это когда можно молчать и всё равно весело. 💜",
    "Морской бой: «Мимо!» — самое частое слово в классе после «тихо». 🚢",
  ];
  var KINDS = [
    "Ты делаешь этот клуб добрее одним заходом.",
    "Отдых — тоже сила. Ты молодец.",
    "Друзьям рядом с тобой спокойнее.",
    "Сегодня можно просто быть собой.",
    "Ты уже достаточно хороший друг.",
    "Маленький шаг — тоже победа.",
  ];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function toast(msg) {
    var el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }
  function nick() {
    return (window.AmalFriendsNet && AmalFriendsNet.nick && AmalFriendsNet.nick()) || "Гость";
  }

  function showPanel(id) {
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("on"); });
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("on", t.getAttribute("data-panel") === id);
    });
    var p = $("panel-" + id);
    if (p) p.classList.add("on");
  }

  /* ——— Share feed ——— */
  function loadShare() {
    try { return JSON.parse(localStorage.getItem(STORE_SHARE) || "[]") || []; }
    catch (_) { return []; }
  }
  function saveShare(list) {
    try { localStorage.setItem(STORE_SHARE, JSON.stringify(list.slice(0, 40))); } catch (_) {}
  }
  function renderShare() {
    var box = $("share-feed");
    if (!box) return;
    var list = loadShare();
    if (!list.length) {
      box.innerHTML = '<p class="tip">Пока пусто — кинь первую смешную ссылку!</p>';
      return;
    }
    box.innerHTML = list.map(function (item) {
      var body = item.kind === "pic"
        ? '<img src="' + esc(item.url) + '" alt="смешная картинка" loading="lazy" onerror="this.style.display=\'none\'" />' +
          '<div><a href="' + esc(item.url) + '" target="_blank" rel="noopener">' + esc(item.title || item.url) + "</a></div>"
        : '<a href="' + esc(item.url) + '" target="_blank" rel="noopener">' + esc(item.title || item.url) + "</a>";
      return '<div class="share-card"><div class="who">' + esc(item.name) + " · " +
        (item.kind === "pic" ? "🖼" : "🔗") + "</div>" + body + "</div>";
    }).join("");
  }
  function addShare(kind, url, title) {
    url = String(url || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      toast("Нужна ссылка, начинающаяся с https://");
      return;
    }
    var item = {
      name: nick(),
      kind: kind,
      url: url.slice(0, 400),
      title: String(title || "").trim().slice(0, 40),
      t: Date.now(),
    };
    var list = loadShare();
    list.unshift(item);
    saveShare(list);
    renderShare();
    if (window.AmalFriendsNet && AmalFriendsNet.sendText) {
      AmalFriendsNet.sendText((kind === "pic" ? "🖼 " : "🔗 ") + (item.title || item.url));
    }
    toast(kind === "pic" ? "Картинка в ленте!" : "Ссылка отправлена!");
  }

  /* ——— Chat UI ——— */
  function renderChat() {
    var log = $("chat-log");
    if (!log || !window.AmalFriendsNet) return;
    var msgs = AmalFriendsNet.getMessages ? AmalFriendsNet.getMessages() : [];
    log.innerHTML = msgs.slice(-50).map(function (m) {
      var mine = m.name === nick();
      return '<div class="chat-msg' + (mine ? " mine" : "") + '"><b>' + esc(m.name) +
        "</b>: " + esc(m.text) + "</div>";
    }).join("") || '<div class="chat-msg"><b>Клуб</b>: Напиши «привет» друзьям 👋</div>';
    log.scrollTop = log.scrollHeight;
  }

  /* ——— Rest ——— */
  var breathTimer = null;
  function startBreath() {
    var el = $("breath");
    if (!el) return;
    clearInterval(breathTimer);
    var phase = 0;
    var labels = ["Вдох…", "Держи…", "Выдох…", "Пауза…"];
    el.textContent = labels[0];
    el.style.transform = "scale(1.15)";
    breathTimer = setInterval(function () {
      phase = (phase + 1) % 4;
      el.textContent = labels[phase];
      el.style.transform = phase === 0 || phase === 1 ? "scale(1.18)" : "scale(0.92)";
      el.style.opacity = phase === 3 ? "0.7" : "1";
    }, 3000);
    toast("Дышим вместе 4 счёта");
  }
  function softSound() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { toast("Звук недоступен"); return; }
      var ctx = softSound._ctx || (softSound._ctx = new Ctx());
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 392;
      g.gain.value = 0.0001;
      o.connect(g); g.connect(ctx.destination);
      var now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.04, now + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      o.start(now); o.stop(now + 2);
      toast("Тинь…");
    } catch (_) { toast("Не удалось включить звук"); }
  }
  function drawStars() {
    var c = $("rest-stars");
    if (!c) return;
    var ctx = c.getContext("2d");
    var w = c.width, h = c.height;
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < 60; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (0.3 + Math.random() * 0.7) + ")";
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.8 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ——— Surprise ——— */
  function stars() {
    try { return Number(localStorage.getItem(STORE_STARS) || 0) || 0; } catch (_) { return 0; }
  }
  function setStars(n) {
    try { localStorage.setItem(STORE_STARS, String(n)); } catch (_) {}
  }
  function hasGolden() {
    try { return localStorage.getItem(STORE_SURPRISE) === "1"; } catch (_) { return false; }
  }
  function openSurprise() {
    $("surprise-modal").hidden = false;
  }
  function claimSurprise() {
    try { localStorage.setItem(STORE_SURPRISE, "1"); } catch (_) {}
    setStars(stars() + 67);
    document.body.classList.add("golden-night");
    $("surprise-modal").hidden = true;
    toast("🎁 Золотая ночь! +" + 67 + " звёзд дружбы");
    if (window.AmalFriendsNet && AmalFriendsNet.sendText) {
      AmalFriendsNet.sendText("🎁 открыл(а) Золотую ночь!");
    }
  }

  /* ——— Games panel ——— */
  function openGame(name) {
    $("game-pick").hidden = true;
    $("game-stage").hidden = false;
    var titles = {
      chess: "♟️ Шахматы", checkers: "🔴 Шашки", sea: "🚢 Морской бой",
      xo: "❌⭕ Крестики-нолики", memory: "🃏 Память", tap: "👏 Хлоп-хлоп",
    };
    $("game-title").textContent = titles[name] || "Игра";
    ClubBoardGames.mount({
      host: $("board-host"),
      status: $("game-status"),
      toast: toast,
      vsAi: true,
    });
    $("btn-vs").textContent = "👤 vs 🤖";
    ClubBoardGames.start(name);
  }

  function init() {
    if (window.AmalOwnerSession && AmalOwnerSession.admitLikeQrScanned) {
      AmalOwnerSession.admitLikeQrScanned();
    }

    // tabs
    $("tabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-panel]");
      if (b) showPanel(b.getAttribute("data-panel"));
    });
    document.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { showPanel(b.getAttribute("data-go")); });
    });

    // nick
    var ni = $("nick-input");
    if (ni) ni.value = nick() === "Гость" ? "" : nick();
    $("btn-nick-save").onclick = function () {
      var n = (ni.value || "").trim().slice(0, 16);
      if (!n) { toast("Напиши имя"); return; }
      if (window.AmalFriendsNet && AmalFriendsNet.setNick) AmalFriendsNet.setNick(n);
      else try { localStorage.setItem("amal-friends-nick-v1", n); } catch (_) {}
      toast("Привет, " + n + "!");
      renderChat();
    };

    // emojis
    var er = $("emoji-row");
    if (er) {
      er.innerHTML = EMOJIS.map(function (e) {
        return '<button type="button" data-e="' + e + '">' + e + "</button>";
      }).join("");
      er.onclick = function (ev) {
        var b = ev.target.closest("[data-e]");
        if (!b) return;
        var inp = $("chat-input");
        inp.value = (inp.value || "") + b.getAttribute("data-e");
        inp.focus();
      };
    }
    $("btn-send").onclick = function () {
      var t = ($("chat-input").value || "").trim();
      if (!t) return;
      if (window.AmalFriendsNet && AmalFriendsNet.sendText) AmalFriendsNet.sendText(t);
      else {
        // локально
        var fake = { name: nick(), text: t, t: Date.now() };
        if (!window.__localChat) window.__localChat = [];
        window.__localChat.push(fake);
      }
      $("chat-input").value = "";
      renderChat();
    };
    $("chat-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") $("btn-send").click();
    });

    // share
    $("btn-share-link").onclick = function () {
      addShare("link", $("share-url").value, $("share-title").value);
    };
    $("btn-share-pic").onclick = function () {
      addShare("pic", $("share-url").value, $("share-title").value);
    };
    $("btn-share-joke").onclick = function () {
      var j = JOKES[Math.floor(Math.random() * JOKES.length)];
      if (window.AmalFriendsNet && AmalFriendsNet.sendText) AmalFriendsNet.sendText("🎲 " + j);
      toast(j);
      renderChat();
    };
    renderShare();

    // games
    $("game-pick").addEventListener("click", function (e) {
      var b = e.target.closest("[data-game]");
      if (b) openGame(b.getAttribute("data-game"));
    });
    $("btn-game-back").onclick = function () {
      ClubBoardGames.clear();
      $("game-stage").hidden = true;
      $("game-pick").hidden = false;
    };
    $("btn-vs").onclick = function () {
      var next = !ClubBoardGames.isVsAi();
      ClubBoardGames.setVsAi(next);
      $("btn-vs").textContent = next ? "👤 vs 🤖" : "👥 вдвоём";
      toast(next ? "Против компьютера" : "Вдвоём на одном экране");
    };

    // rest
    drawStars();
    setInterval(drawStars, 4000);
    $("btn-breathe").onclick = startBreath;
    $("btn-soft").onclick = softSound;
    $("btn-kind").onclick = function () {
      $("kind-text").textContent = KINDS[Math.floor(Math.random() * KINDS.length)];
    };

    // surprise
    $("btn-surprise").onclick = openSurprise;
    $("home-surprise").onclick = openSurprise;
    $("btn-surprise-ok").onclick = claimSurprise;
    if (hasGolden()) document.body.classList.add("golden-night");

    // net
    if (window.AmalFriendsNet) {
      AmalFriendsNet.initLite(function () {
        toast("Клуб онлайн 💜");
        renderChat();
      });
      if (AmalFriendsNet.onChat) AmalFriendsNet.onChat(renderChat);
      setInterval(renderChat, 2000);
      setInterval(function () {
        var box = $("online-box");
        if (!box) return;
        if (AmalFriendsNet.renderOnlineInto) AmalFriendsNet.renderOnlineInto(box);
        else box.textContent = "💜 Имя: " + nick() + (hasGolden() ? " · ⭐ " + stars() + " звёзд" : "");
      }, 2000);
    }

    toast("Добро пожаловать в клуб друзей!");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
