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
  function toast(msg, kind) {
    var el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("friend", kind === "friend");
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); el.classList.remove("friend"); }, kind === "friend" ? 4500 : 2400);
  }

  function showJoinBanner(text) {
    var b = $("join-banner");
    if (!b) return;
    b.hidden = false;
    b.textContent = text;
    clearTimeout(showJoinBanner._t);
    showJoinBanner._t = setTimeout(function () { b.hidden = true; }, 6000);
  }

  function ding() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = ding._ctx || (ding._ctx = new Ctx());
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 660;
      g.gain.value = 0.0001;
      o.connect(g); g.connect(ctx.destination);
      var now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      o.start(now); o.stop(now + 0.55);
    } catch (_) {}
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
  var playMode = "ai";
  var difficulty = 2;
  var currentGame = "";
  var THANKS = [
    "Спасибо, что зашли! Я так рада вас видеть 💜",
    "Спасибо, что вообще зашли — вы лучшие!",
    "Я знала, что вы зайдёте. Спасибо, что пришли!",
    "Спасибо, что зашли в клуб. Давно хотела с вами встретиться!",
    "Ура, вы здесь! Спасибо, что зашли — давайте играть вместе ⭐",
  ];

  function isHost() {
    try {
      if (window.AmalOwnerSession && AmalOwnerSession.isOwner && AmalOwnerSession.isOwner()) return true;
      if (window.AmalFriendsNet && AmalFriendsNet.isOwner && AmalFriendsNet.isOwner()) return true;
    } catch (_) {}
    var n = (nick() || "").toLowerCase();
    return n === "амаль" || n === "amal";
  }

  function hostThank(friendName) {
    if (!isHost()) return;
    var phrase = THANKS[Math.floor(Math.random() * THANKS.length)];
    var text = "💜 " + phrase + (friendName ? " (привет, " + friendName + "!)" : "");
    showJoinBanner(text);
    toast(text, "friend");
    if (window.AmalFriendsNet && AmalFriendsNet.sendText) AmalFriendsNet.sendText(text);
  }

  function syncDiffUi() {
    document.querySelectorAll("#diff-row .df").forEach(function (b) {
      b.classList.toggle("on", Number(b.getAttribute("data-diff")) === difficulty);
    });
    $("diff-row").style.opacity = playMode === "ai" ? "1" : "0.45";
  }

  function hideRematch() {
    var b = $("rematch-banner");
    if (b) b.hidden = true;
  }

  function showRematch(text) {
    var b = $("rematch-banner");
    var t = $("rematch-text");
    if (t) t.textContent = text || "Бой окончен";
    if (b) b.hidden = false;
  }

  function rematch() {
    if (!currentGame) return;
    hideRematch();
    toast("🔄 Новый бой!");
    openGame(currentGame);
  }

  function openGame(name) {
    currentGame = name;
    hideRematch();
    $("game-pick").hidden = true;
    $("game-stage").hidden = false;
    var titles = {
      chess: "♟️ Шахматы", checkers: "🔴 Шашки", sea: "🚢 Морской бой",
      xo: "❌⭕ Крестики-нолики", memory: "🃏 Память", tap: "👏 Хлоп-хлоп",
    };
    $("game-title").textContent = titles[name] || "Игра";
    if (playMode === "online" && window.AmalFriendsNet) {
      if (AmalFriendsNet.friendCount && AmalFriendsNet.friendCount() < 1) {
        toast("Пока нет друга онлайн — позови или выбери бота");
      } else {
        AmalFriendsNet.invitePlay(name, titles[name] || name);
      }
      AmalFriendsNet.setPlace && AmalFriendsNet.setPlace(titles[name] || name);
    }
    ClubBoardGames.mount({
      host: $("board-host"),
      status: $("game-status"),
      toast: toast,
      mode: playMode,
      difficulty: difficulty,
      onMove: function (payload) {
        if (playMode === "online" && window.AmalFriendsNet) AmalFriendsNet.sendBoard(payload);
      },
      onEnd: function (result) {
        // result: "win" | "lose" | "draw"
        var msg = result === "win" ? "🎉 Ты победил!" : result === "lose" ? "😢 Поражение" : "🤝 Ничья";
        showRematch(msg + " · можно заново");
      },
    });
    ClubBoardGames.start(name);
    renderOwnerPowers();
  }

  function renderOwnerPowers() {
    var box = $("owner-powers");
    var grid = $("op-grid");
    if (!box || !grid) return;
    if (!isHost() || !ClubBoardGames.hasPowers || !ClubBoardGames.hasPowers()) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    // Простые и понятные силы — смысл сразу виден
    var powers = [
      { id: "freeze", label: "🧊 Сон бота", tip: "бот пропускает ходы" },
      { id: "chaos", label: "🌊 Удар по врагу", tip: "ломает фигуры бота" },
      { id: "rift", label: "⚡ Я победил!", tip: "сразу конец боя · твоя победа", mega: true },
    ];
    grid.innerHTML = powers.map(function (p) {
      return '<button type="button" data-pow="' + p.id + '" class="' + (p.mega ? "mega" : "") + '" title="' + p.tip + '">' +
        p.label + '<small style="display:block;font-weight:700;opacity:.85">' + p.tip + "</small></button>";
    }).join("");
    grid.onclick = function (e) {
      var b = e.target.closest("[data-pow]");
      if (!b) return;
      ClubBoardGames.usePower(b.getAttribute("data-pow"));
    };
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
      if (window.AmalFriendsNet && AmalFriendsNet.setPlace) AmalFriendsNet.setPlace("Клуб друзей");
      toast("Привет, " + n + "! Друзья увидят, что ты здесь");
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
    $("play-modes").addEventListener("click", function (e) {
      var b = e.target.closest("[data-mode]");
      if (!b) return;
      playMode = b.getAttribute("data-mode");
      document.querySelectorAll("#play-modes .pm").forEach(function (x) {
        x.classList.toggle("on", x === b);
      });
      syncDiffUi();
      toast(playMode === "online" ? "Режим: с другом онлайн ⭐" : playMode === "hotseat" ? "Режим: вдвоём на экране" : "Режим: против бота");
    });
    $("diff-row").addEventListener("click", function (e) {
      var b = e.target.closest("[data-diff]");
      if (!b) return;
      difficulty = Number(b.getAttribute("data-diff")) || 2;
      syncDiffUi();
      ClubBoardGames.setDifficulty(difficulty);
      toast(difficulty === 1 ? "Бот лёгкий 🌱" : difficulty === 3 ? "Бот экстрим 🔥" : "Бот средний 🧠");
    });
    syncDiffUi();
    $("game-pick").addEventListener("click", function (e) {
      var b = e.target.closest("[data-game]");
      if (b) openGame(b.getAttribute("data-game"));
    });
    $("btn-game-back").onclick = function () {
      ClubBoardGames.clear();
      $("game-stage").hidden = true;
      $("game-pick").hidden = false;
      hideRematch();
      var op = $("owner-powers");
      if (op) op.hidden = true;
    };
    function bindRematch(id) {
      var el = $(id);
      if (el) el.onclick = rematch;
    }
    bindRematch("btn-rematch");
    bindRematch("btn-rematch-big");
    $("btn-invite").onclick = function () {
      if (!window.AmalFriendsNet) return;
      if (AmalFriendsNet.friendCount && AmalFriendsNet.friendCount() < 1) {
        toast("Друг ещё не зашёл — подожди или скинь ссылку");
        return;
      }
      AmalFriendsNet.invitePlay(currentGame || "xo", $("game-title").textContent || "игру");
      toast("Приглашение отправлено друзьям!");
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

    // net — оповещаем, когда друг зашёл (только если друг РЕАЛЬНО пришёл)
    if (window.AmalFriendsNet) {
      AmalFriendsNet.onFriendJoin(function (info) {
        if (!info || !info.name) return;
        var place = info.place ? " в «" + info.place + "»" : " в клуб";
        var msg = "👋 Друг «" + info.name + "» зашёл" + place + "!";
        showJoinBanner(msg);
        toast(msg, "friend");
        ding();
        hostThank(info.name);
        renderChat();
      });
      AmalFriendsNet.onFriendLeave(function (info) {
        if (!info || !info.name) return;
        toast("👋 " + info.name + " вышел");
      });
      AmalFriendsNet.onBoard(function (data) {
        if (!data) return;
        if (data.type === "invite") {
          toast("🎮 " + data.from + " зовёт: " + (data.label || data.game), "friend");
          showJoinBanner("Друг зовёт играть: " + (data.label || data.game) + " · вкладка Настолки → «С другом»");
          return;
        }
        if (playMode === "online") ClubBoardGames.applyRemote(data);
      });
      AmalFriendsNet.initLite(function (ok) {
        if (ok) {
          toast("Клуб онлайн · жду друзей 💜");
          // без ложных «друг зашёл», пока никого нет
          var box = $("online-box");
          if (box) box.textContent = "Ты в клубе. Когда друг зайдёт — скажу и поблагодарю.";
        } else {
          toast("Нет сети — обнови страницу");
        }
        var ni2 = $("nick-input");
        if (ni2 && nick() && nick() !== "Гость") ni2.value = nick();
        renderChat();
      }, "Клуб друзей");
      if (AmalFriendsNet.onChat) AmalFriendsNet.onChat(renderChat);
      setInterval(renderChat, 2000);
      setInterval(function () {
        var box = $("online-box");
        if (!box || !AmalFriendsNet.renderOnlineInto) return;
        AmalFriendsNet.renderOnlineInto(box);
        if (hasGolden() && AmalFriendsNet.friendCount) {
          box.textContent += " · ⭐ " + stars();
        }
      }, 2000);
    }

    toast("Добро пожаловать в клуб друзей!");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
