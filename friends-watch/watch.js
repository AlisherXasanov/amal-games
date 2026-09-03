/**
 * Смотрим вместе — свои мульты (Полка Валеры), синхрон для друзей.
 * Чужие ролики YouTube / Premium-клон сюда не тащим.
 */
(function () {
  "use strict";

  var EPISODES = [
    { id: "hello", ico: "🐻", title: "Привет из жёлтой хаты", blurb: "Мишка здоровается", lines: ["Привет! Я мишка из Мульт-студии.", "Сегодня будет короткое приключение."] },
    { id: "candy", ico: "🍬", title: "Конфеты на столе", blurb: "Сладкий выпуск", lines: ["Ого, сколько конфет!", "Одну можно? Ну хотя бы маленькую…"] },
    { id: "water", ico: "💧", title: "Эксперимент с водой", blurb: "Бульк!", lines: ["Наливаем воду…", "Бульк! Я желейный, мне мокро и весело."] },
    { id: "morning", ico: "☀️", title: "Утро в хате", blurb: "Новый день", lines: ["Доброе утро!", "Солнышко светит, пора начинать выпуск."] },
    { id: "dance", ico: "💃", title: "Танцующий мишка", blurb: "Ритм", lines: ["Раз, два, три!", "Танцуем без рекламы — только свой мульт."] },
    { id: "sleep", ico: "🌙", title: "Мишка хочет спать", blurb: "Тихий выпуск", lines: ["Я немного устал…", "Спокойной ночи. До следующего ролика."] },
    { id: "thanks", ico: "💜", title: "Спасибо за лайк", blurb: "Общее спасибо", lines: ["Спасибо, что смотришь наши ролики!", "Лайк на сайте очень помогает."] },
    { id: "box", ico: "🎁", title: "Сюрприз в коробке", blurb: "Чего там?", lines: ["Что в коробке?", "Открываем… Вау! Это для тебя."] },
    { id: "puzzle", ico: "🧩", title: "Мишка и кубик-пазл", blurb: "Своя игра", lines: ["Соберём пазл вместе?", "Получилось! Ты молодец."] },
    { id: "song", ico: "🎵", title: "Весёлая песенка", blurb: "Свой выпуск", lines: ["Ля-ля-ля, сегодня весело!", "Это наш ролик, не чужой канал."] },
    { id: "friends", ico: "⭐", title: "Друзья в хате", blurb: "Для компании", lines: ["Вы зашли — ура!", "Смотрим вместе, как в кинотеатре друзей."] },
    { id: "minion-joke", ico: "💛", title: "Жёлтый друг (свой)", blurb: "Не чужой фильм", lines: ["У нас свой жёлтый герой — мишка!", "Чужие Миньоны с YouTube сюда не копируем — рисуем своих."] },
  ];

  var mode = "solo"; // solo | party
  var current = null;
  var playing = false;
  var lineIdx = 0;
  var timer = null;
  var isHost = false;

  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }
  function nick() {
    return (window.AmalFriendsNet && AmalFriendsNet.nick && AmalFriendsNet.nick()) || "";
  }

  function renderShelf() {
    var box = $("shelf");
    box.innerHTML = EPISODES.map(function (ep) {
      return (
        '<button type="button" class="card' + (current && current.id === ep.id ? " on" : "") + '" data-id="' + ep.id + '">' +
        '<span class="ico">' + ep.ico + "</span>" +
        "<span><strong>" + ep.title + "</strong><small>" + ep.blurb + "</small></span></button>"
      );
    }).join("");
  }

  function showEpisode(ep, reset) {
    current = ep;
    if (reset !== false) { lineIdx = 0; playing = false; clearInterval(timer); }
    $("title").textContent = ep.title;
    $("blurb").textContent = ep.blurb;
    $("line").textContent = ep.lines[0] || "—";
    $("status").textContent = "выбран · жми ▶";
    renderShelf();
  }

  function playLocal() {
    if (!current) { toast("Сначала выбери мульт"); return; }
    playing = true;
    lineIdx = 0;
    $("status").textContent = "смотрим…";
    $("line").textContent = current.lines[0];
    clearInterval(timer);
    timer = setInterval(function () {
      lineIdx++;
      if (lineIdx >= current.lines.length) {
        clearInterval(timer);
        playing = false;
        $("status").textContent = "конец · можно ещё раз";
        $("line").textContent = "✨ Конец выпуска. Спасибо, что смотрели вместе!";
        toast("Конец · выбери следующий");
        return;
      }
      $("line").textContent = current.lines[lineIdx];
    }, 2800);
  }

  function broadcast(state) {
    if (mode !== "party" || !window.AmalFriendsNet || !AmalFriendsNet.sendBoard) return;
    if (!isHost && state.type !== "hello") return;
    AmalFriendsNet.sendBoard({
      game: "friends-watch",
      type: state.type,
      ep: state.ep || (current && current.id),
      line: state.line,
      from: nick(),
    });
  }

  function applyRemote(data) {
    if (!data || data.game !== "friends-watch") return;
    if (data.from === nick()) return;
    if (data.type === "pick" || data.type === "play") {
      var ep = EPISODES.filter(function (e) { return e.id === data.ep; })[0];
      if (!ep) return;
      showEpisode(ep, true);
      if (data.type === "play") {
        isHost = false;
        playLocal();
        toast("▶ " + (data.from || "друг") + " включил(а) мульт");
      } else {
        toast("🎬 " + (data.from || "друг") + " выбрал(а): " + ep.title);
      }
    }
  }

  function init() {
    var ni = $("nick");
    if (nick()) ni.value = nick();
    $("btn-nick").onclick = function () {
      var n = (ni.value || "").trim().slice(0, 16);
      if (!n) return toast("Напиши имя");
      if (AmalFriendsNet.setNick) AmalFriendsNet.setNick(n);
      toast("Привет, " + n + "!");
      if (AmalFriendsNet.setPlace) AmalFriendsNet.setPlace("Смотрим вместе");
    };

    document.querySelectorAll(".modes button").forEach(function (b) {
      b.onclick = function () {
        mode = b.getAttribute("data-mode");
        document.querySelectorAll(".modes button").forEach(function (x) {
          x.classList.toggle("on", x === b);
        });
        $("btn-host").hidden = mode !== "party";
        toast(mode === "party" ? "Режим: вместе ⭐" : "Режим: один 👤");
      };
    });

    $("shelf").onclick = function (e) {
      var b = e.target.closest("[data-id]");
      if (!b) return;
      var ep = EPISODES.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0];
      if (!ep) return;
      if (mode === "party" && !isHost) {
        toast("В режиме «вместе» выбирает ведущий");
        return;
      }
      showEpisode(ep, true);
      broadcast({ type: "pick", ep: ep.id });
    };

    $("btn-play").onclick = function () {
      if (mode === "party" && !isHost) {
        toast("Попроси ведущего нажать ▶");
        return;
      }
      playLocal();
      broadcast({ type: "play", ep: current && current.id });
    };

    $("btn-host").onclick = function () {
      isHost = true;
      toast("📣 Ты ведущий — выбирай мульт и жми ▶");
      if (AmalFriendsNet.sendText) AmalFriendsNet.sendText("📣 я ведущий в «Смотрим вместе»");
    };

    renderShelf();

    if (window.AmalFriendsNet) {
      AmalFriendsNet.initLite(function (ok) {
        $("online").textContent = ok ? "💜 Комната мультов онлайн" : "📱 Без сети — можно смотреть одному";
      }, "Смотрим вместе");
      AmalFriendsNet.onBoard(applyRemote);
      setInterval(function () {
        if (AmalFriendsNet.renderOnlineInto) AmalFriendsNet.renderOnlineInto($("online"));
      }, 2000);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
