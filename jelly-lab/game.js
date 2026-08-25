(function () {
  "use strict";

  var roomEl = document.getElementById("room");
  var roomName = document.getElementById("roomName");
  var speech = document.getElementById("speech");
  var invEl = document.getElementById("inv");
  var tip = document.getElementById("tip");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");

  var ROOMS = ["bedroom", "hall", "kitchen", "door"];
  var TITLES = {
    bedroom: "Спальня",
    hall: "Коридор",
    kitchen: "Кухня",
    door: "Дверь к Лимону"
  };

  var state = {
    roomIndex: 0,
    inventory: [],
    selected: null,
    rubiHome: true,
    candyAsked: 0,
    limonHome: true,
    sayToken: 0
  };

  var ITEMS = {
    candy: { id: "candy", emoji: "🍬", name: "конфета" },
    komok: { id: "komok", emoji: "🫧", name: "комок" },
    ball: { id: "ball", emoji: "🎾", name: "мяч" },
    pizza: { id: "pizza", emoji: "🍕", name: "пицца" }
  };

  function say(text) {
    state.sayToken += 1;
    speech.textContent = text;
    tip.textContent = text;
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = "ru-RU";
        u.rate = 1;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }

  function hasItem(id) {
    return state.inventory.indexOf(id) >= 0;
  }

  function addItem(id) {
    if (hasItem(id)) {
      say("Это уже есть в инвентаре.");
      return false;
    }
    state.inventory.push(id);
    renderInv();
    say("В инвентарь: " + ITEMS[id].name + ".");
    return true;
  }

  function removeItem(id) {
    state.inventory = state.inventory.filter(function (x) { return x !== id; });
    if (state.selected === id) state.selected = null;
    renderInv();
  }

  function renderInv() {
    invEl.innerHTML = "";
    if (!state.inventory.length) {
      invEl.innerHTML = "<span style='opacity:.6;font-weight:700'>пусто — подбери вещи в комнатах</span>";
      return;
    }
    state.inventory.forEach(function (id) {
      var it = ITEMS[id];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "item" + (state.selected === id ? " selected" : "");
      b.title = it.name + " (жми, чтобы выбрать)";
      b.innerHTML = it.emoji + "<span>" + it.name + "</span>";
      b.addEventListener("click", function () {
        state.selected = state.selected === id ? null : id;
        renderInv();
        tip.textContent = state.selected
          ? "Выбрано: " + it.name + ". Теперь жми на Руби или предмет."
          : "Выбор снят.";
      });
      invEl.appendChild(b);
    });
  }

  function hot(label, emoji, style, onClick) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "hot";
    el.style.cssText = style;
    el.innerHTML = "<span class='emoji'>" + emoji + "</span>" + label;
    el.addEventListener("click", onClick);
    roomEl.appendChild(el);
  }

  function askCandy() {
    state.candyAsked += 1;
    if (state.candyAsked % 3 === 1) say("Руби: Дай конфетку.");
    else if (state.candyAsked % 3 === 2) say("Руби: Дай конфетку, дай конфетку.");
    else say("Руби: Дай конфетку, дай конфетку, дай конфетку.");
  }

  function onRubi() {
    if (!state.rubiHome) {
      say("Руби на море. Дома его нет.");
      return;
    }
    if (state.selected === "candy") {
      removeItem("candy");
      say("Руби: Ммм… вкусно. Дай конфетку… дай конфетку.");
      return;
    }
    if (state.selected === "pizza") {
      removeItem("pizza");
      say("Руби: Пицца! Спасибо. Но конфетку всё равно дай.");
      return;
    }
    if (state.selected === "komok") {
      say("Руби жмёт комок: хлюп-хлюп. Потом снова: дай конфетку.");
      return;
    }
    if (state.selected === "ball") {
      say("Руби чуть отбил мяч… и снова смотрит на тебя.");
      askCandy();
      return;
    }
    askCandy();
  }

  function renderRoom() {
    var id = ROOMS[state.roomIndex];
    roomName.textContent = TITLES[id];
    roomEl.className = "room " + id;
    roomEl.innerHTML = "";
    prevBtn.disabled = state.roomIndex <= 0;
    nextBtn.disabled = state.roomIndex >= ROOMS.length - 1;

    if (id === "bedroom") {
      hot("Кровать", "🛏️", "left:8%;bottom:18%;width:34%;height:28%;", function () {
        say("Кровать. Руби тут спит и просыпается.");
      });
      if (state.rubiHome) {
        hot("Руби", "🐻", "left:42%;bottom:22%;width:22%;height:36%;background:rgba(229,29,48,.2);", onRubi);
      } else {
        hot("Чемодан", "🧳", "left:70%;bottom:20%;width:18%;height:22%;", function () {
          say("Чемодан. Руби уехал на море.");
        });
      }
      hot(state.rubiHome ? "Море" : "Домой", state.rubiHome ? "🌊" : "🏠", "right:6%;top:14%;width:20%;height:16%;", function () {
        state.rubiHome = !state.rubiHome;
        renderRoom();
        say(state.rubiHome ? "Руби вернулся домой." : "Руби: Я на море… отдыхаю.");
      });
    }

    if (id === "hall") {
      hot("Полка конфет", "🍬", "left:6%;top:16%;width:28%;height:20%;", function () {
        addItem("candy");
      });
      hot("Полка Лимона", "💛", "right:6%;top:16%;width:28%;height:20%;", function () {
        addItem("candy");
        say("На полке жёлтые конфеты. Похоже, запас Лимона.");
      });
      hot("Скамейка", "🪑", "left:35%;bottom:14%;width:30%;height:18%;", function () {
        say("Ты сел. В коридоре тихо. С полки пахнет конфетами.");
      });
      if (state.rubiHome) {
        hot("Руби", "🐻", "left:10%;bottom:20%;width:18%;height:30%;background:rgba(229,29,48,.2);", onRubi);
      }
    }

    if (id === "kitchen") {
      hot("Стол", "🧪", "left:22%;bottom:16%;width:56%;height:26%;", function () {
        say("Кухонный стол. Тут можно делать опыты.");
      });
      hot("Вода", "💧", "left:28%;bottom:28%;width:14%;height:14%;", function () {
        say("Бульк. Вода на столе. Руби: Ой, холодно.");
        if (state.rubiHome) setTimeout(askCandy, 1200);
      });
      hot("Комок", "🫧", "left:12%;bottom:22%;width:16%;height:16%;", function () {
        addItem("komok");
      });
      hot("Мяч", "🎾", "right:12%;bottom:22%;width:14%;height:14%;", function () {
        addItem("ball");
      });
      hot("Пицца", "🍕", "left:55%;top:18%;width:16%;height:14%;", function () {
        addItem("pizza");
      });
      if (state.rubiHome) {
        hot("Руби", "🐻", "left:40%;bottom:30%;width:20%;height:32%;background:rgba(229,29,48,.25);", onRubi);
      }
    }

    if (id === "door") {
      hot("Дверь", "🚪", "left:32%;top:12%;width:36%;height:58%;", function () {
        say("Дверь к Лимону. Можно позвонить или заглянуть в глазок.");
      });
      hot("Звонок", "🔔", "right:18%;top:28%;width:14%;height:12%;", function () {
        say("Динь-дон.");
        setTimeout(function () {
          say(state.limonHome ? "Лимон за дверью: Чего надо?" : "Никого.");
        }, 700);
      });
      hot("Глазок", "👁️", "left:46%;top:30%;width:12%;height:12%;", function () {
        say(state.limonHome
          ? "В глазок видно жёлтого Лимона."
          : "В глазок никого нет.");
      });
      hot("В гости", "💛", "left:36%;bottom:12%;width:28%;height:14%;", function () {
        if (!state.limonHome) {
          say("Лимона нет дома.");
          return;
        }
        say("Лимон: Мои конфеты. Не трогай.");
        if (state.rubiHome) setTimeout(function () { say("Руби: Дай конфетку…"); }, 1400);
      });
      if (state.rubiHome) {
        hot("Руби", "🐻", "left:8%;bottom:18%;width:18%;height:30%;background:rgba(229,29,48,.2);", onRubi);
      }
    }
  }

  function go(dir) {
    var n = state.roomIndex + dir;
    if (n < 0 || n >= ROOMS.length) return;
    state.roomIndex = n;
    renderRoom();
    say("Комната: " + TITLES[ROOMS[n]]);
  }

  prevBtn.addEventListener("click", function () { go(-1); });
  nextBtn.addEventListener("click", function () { go(1); });
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  renderInv();
  renderRoom();
  say("Руби: Эй… вставай. Дай конфетку.");
})();
