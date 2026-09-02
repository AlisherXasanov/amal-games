/**
 * Сеть друзей — чат и «кто играет» через Trystero (P2P, без сервера).
 * Комната только для тех, кто зашёл по секретному QR.
 */
(function (global) {
  "use strict";

  var APP_ID = "amal-games-friends-eureka-v2";
  var ROOM_ID = "amal-star-friends";
  var STORE_NICK = "amal-friends-nick-v1";
  var STORE_WELCOME = "amal-friends-welcomed-v1";
  var STORE_OWNER = "amal-friends-owner-v1";
  var OWNER_NICKS = ["амаль", "amal", "хозяин", "амаля"];
  var emojis = ["😀", "😂", "❤️", "👍", "🎮", "🐣", "⭐", "🔥", "🥳", "👋", "💜", "✨", "🕵️", "🌊"];

  var room = null;
  var sendChat = null;
  var sendPing = null;
  var sendAct = null;
  var sendChallenge = null;
  var sendRace = null;
  var sendResult = null;
  var messages = [];
  var peers = {};
  var activities = [];
  var challenges = [];
  var challengeListeners = [];
  var raceListeners = [];
  var isOwner = false;
  var netReady = false;

  function $(id) { return document.getElementById(id); }

  function nick() {
    try {
      var n = localStorage.getItem(STORE_NICK);
      if (n && n.trim()) return n.trim().slice(0, 16);
    } catch (_) {}
    return "";
  }

  function setNick(n) {
    try { localStorage.setItem(STORE_NICK, String(n).slice(0, 16)); } catch (_) {}
    checkOwner();
  }

  function checkOwner() {
    var n = nick().toLowerCase();
    try {
      if (localStorage.getItem(STORE_OWNER) === "1") isOwner = true;
    } catch (_) {}
    isOwner = isOwner || OWNER_NICKS.indexOf(n) >= 0;
    return isOwner;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmtTime(t) {
    var d = new Date(t);
    return d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }

  function logActivity(text, game) {
    var ev = { name: nick() || "?", text: text, game: game || "", t: Date.now() };
    activities.unshift(ev);
    if (activities.length > 40) activities.length = 40;
    if (sendAct) sendAct(ev);
    if (isOwner) renderOwner();
  }

  function renderMessages() {
    var list = $("friends-chat-log");
    if (!list) return;
    list.innerHTML = messages.slice(-60).map(function (m) {
      var mine = m.name === nick();
      return (
        '<div class="chat-msg' + (mine ? " mine" : "") + '">' +
        '<div class="chat-meta"><b>' + esc(m.name) + "</b> · " + fmtTime(m.t) + "</div>" +
        '<div class="chat-text">' + esc(m.text) + "</div></div>"
      );
    }).join("");
    list.scrollTop = list.scrollHeight;
  }

  function renderOnline() {
    var box = $("friends-online");
    if (!box) return;
    var names = Object.keys(peers);
    var me = nick();
    if (!names.length && !me) {
      box.innerHTML = "🟡 Введи имя — и увидишь друзей";
      return;
    }
    var html = "";
    if (me) html += '<span class="on-user">🟢 ' + esc(me) + " (ты)</span> ";
    names.forEach(function (p) {
      if (peers[p].name && peers[p].name !== me) {
        html += '<span class="on-user">' + (peers[p].alive ? "🟢" : "🟡") + " " + esc(peers[p].name) + "</span> ";
      }
    });
    box.innerHTML = html || "🟡 Пока только ты — жди друзей";
  }

  function renderOwner() {
    var panel = $("friends-owner-panel");
    if (!panel) return;
    if (!checkOwner()) { panel.hidden = true; return; }
    panel.hidden = false;
    var list = $("friends-activity");
    if (!list) return;
    list.innerHTML = activities.slice(0, 20).map(function (a) {
      return "<li><b>" + esc(a.name) + "</b> · " + esc(a.text) +
        (a.game ? " <small>(" + esc(a.game) + ")</small>" : "") +
        " <small>" + fmtTime(a.t) + "</small></li>";
    }).join("") || "<li>Пока тихо — друзья ещё не зашли</li>";
  }

  function addMessage(m) {
    messages.push(m);
    if (messages.length > 80) messages = messages.slice(-80);
    renderMessages();
  }

  function startNetwork() {
    if (room || !global.Trystero) return Promise.resolve(false);

    return import("https://esm.sh/trystero@0.21.0").then(function (mod) {
      var joinRoom = mod.joinRoom;
      room = joinRoom({ appId: APP_ID }, ROOM_ID);
      var chatAct = room.makeAction("chat");
      sendChat = chatAct[0];
      chatAct[1](function (data) {
        if (data && data.text) addMessage(data);
      });

      var pingAct = room.makeAction("ping");
      sendPing = pingAct[0];
      pingAct[1](function (data, peerId) {
        if (!data) return;
        peers[peerId] = { name: data.name, alive: true, t: Date.now() };
        renderOnline();
      });

      var actAct = room.makeAction("activity");
      sendAct = actAct[0];
      actAct[1](function (data) {
        if (!data || !checkOwner()) return;
        activities.unshift(data);
        if (activities.length > 40) activities.length = 40;
        renderOwner();
      });

      var chAct = room.makeAction("challenge");
      sendChallenge = chAct[0];
      chAct[1](function (data) {
        if (!data || !data.from || data.from === nick()) return;
        var id = data.id || String(data.t || Date.now());
        if (challenges.some(function (c) { return c.id === id; })) return;
        challenges.unshift({
          id: id,
          from: data.from,
          game: data.game || "",
          mode: data.mode || "tap",
          label: data.label || "соревнование",
          t: data.t || Date.now(),
        });
        if (challenges.length > 8) challenges.length = 8;
        notifyChallenges();
      });

      var raceAct = room.makeAction("race");
      sendRace = raceAct[0];
      raceAct[1](function (data) {
        if (!data) return;
        raceListeners.forEach(function (fn) { fn(data); });
      });

      var resAct = room.makeAction("result");
      sendResult = resAct[0];
      resAct[1](function (data) {
        if (!data || !data.name) return;
        var txt = data.name + " набрал " + data.score + " в «" + (data.game || "?") + "» 🎉";
        addMessage({ name: "🏆", text: txt, t: Date.now() });
      });

      netReady = true;
      room.onPeerJoin(function (peerId) {
        peers[peerId] = { name: "?", alive: true, t: Date.now() };
        if (sendPing && nick()) sendPing({ name: nick(), t: Date.now() });
        renderOnline();
      });

      room.onPeerLeave(function (peerId) {
        delete peers[peerId];
        renderOnline();
      });

      setInterval(function () {
        if (sendPing && nick()) sendPing({ name: nick(), t: Date.now() });
        Object.keys(peers).forEach(function (id) {
          if (Date.now() - (peers[id].t || 0) > 25000) peers[id].alive = false;
        });
        renderOnline();
      }, 8000);

      return true;
    }).catch(function () {
      return false;
    });
  }

  function showWelcome(onDone) {
    try {
      if (global.AmalDevice && AmalDevice.isSiteOwner && AmalDevice.isSiteOwner()) {
        localStorage.setItem(STORE_WELCOME, "1");
        if (onDone) onDone();
        return;
      }
    } catch (_) {}
    if (isOwner) {
      try { localStorage.setItem(STORE_WELCOME, "1"); } catch (_) {}
      if (onDone) onDone();
      return;
    }
    try {
      if (localStorage.getItem(STORE_WELCOME) === "1") {
        if (onDone) onDone();
        return;
      }
    } catch (_) {}
    var ov = $("friends-welcome");
    if (!ov) { if (onDone) onDone(); return; }
    ov.hidden = false;
    $("friends-welcome-ok").onclick = function () {
      try { localStorage.setItem(STORE_WELCOME, "1"); } catch (_) {}
      ov.hidden = true;
      logActivity("зашёл на секретную страницу");
      if (onDone) onDone();
    };
  }

  var AmalFriendsNet = {
    emojis: emojis,

    init: function () {
      checkOwner();
      showWelcome(function () {
        startNetwork().then(function (ok) {
          var note = $("friends-chat-note");
          if (note) {
            note.textContent = ok
              ? "💜 Чат только для друзей с секретным QR · нужен интернет"
              : "📱 Нет сети Trystero — попробуй обновить страницу";
          }
        });
      });
      logActivity("открыл страницу друзей");
      renderOwner();
    },

    mountChat: function (rootId) {
      var root = $(rootId);
      if (!root) return;

      root.innerHTML =
        '<div class="chat-setup"><label>Твоё имя ' +
        '<input id="friends-nick" maxlength="16" placeholder="Напиши как тебя зовут" /></label></div>' +
        '<div class="chat-online" id="friends-online">Подключение…</div>' +
        '<div class="chat-log" id="friends-chat-log"></div>' +
        '<div class="chat-emojis" id="friends-emojis"></div>' +
        '<form class="chat-form" id="friends-chat-form">' +
        '<input id="friends-chat-input" maxlength="120" placeholder="Только друзья увидят…" />' +
        '<button type="submit">➤</button></form>' +
        '<p class="chat-note" id="friends-chat-note"></p>' +
        '<div id="friends-owner-panel" class="owner-panel" hidden>' +
        "<h3>👑 Панель Амаля — кто играет</h3>" +
        '<ul id="friends-activity"></ul></div>';

      var nickIn = $("friends-nick");
      nickIn.value = nick();
      nickIn.addEventListener("change", function () {
        setNick(nickIn.value);
        renderOnline();
      });
      nickIn.addEventListener("blur", function () {
        setNick(nickIn.value);
        renderOnline();
      });

      $("friends-emojis").innerHTML = emojis.map(function (e) {
        return '<button type="button" data-e="' + e + '">' + e + "</button>";
      }).join("");
      $("friends-emojis").addEventListener("click", function (ev) {
        var b = ev.target.closest("button[data-e]");
        if (!b) return;
        var inp = $("friends-chat-input");
        inp.value = (inp.value + b.getAttribute("data-e")).slice(0, 120);
      });

      $("friends-chat-form").addEventListener("submit", function (ev) {
        ev.preventDefault();
        AmalFriendsNet.send($("friends-chat-input").value);
        $("friends-chat-input").value = "";
      });

      renderMessages();
      renderOnline();
      renderOwner();
    },

    send: function (text) {
      text = String(text || "").trim();
      if (!text) return;
      if (!nick()) { alert("Сначала напиши своё имя!"); return; }
      var msg = { name: nick(), text: text, t: Date.now() };
      addMessage(msg);
      if (sendChat) sendChat(msg);
    },

    trackGame: function (gameName) {
      logActivity("играет", gameName);
    },

    /** Лёгкий старт сети без полного чата (для игр) */
    initLite: function (onDone) {
      checkOwner();
      startNetwork().then(function () {
        if (onDone) onDone(netReady);
      });
    },

    nick: nick,
    setNick: setNick,

    sendChallenge: function (opts) {
      opts = opts || {};
      if (!nick()) { alert("Сначала имя!"); return; }
      var payload = {
        id: "ch-" + Date.now(),
        from: nick(),
        game: opts.game || "game",
        mode: opts.mode || "tap",
        label: opts.label || "соревнование",
        t: Date.now(),
      };
      if (sendChallenge) sendChallenge(payload);
      addMessage({ name: nick(), text: "📣 Вызываю всех: " + payload.label + "!", t: Date.now() });
      if (sendChat) sendChat({ name: nick(), text: "📣 Вызываю всех: " + payload.label + "!", t: Date.now() });
    },

    acceptChallenge: function (id) {
      challenges = challenges.filter(function (c) { return c.id !== id; });
      notifyChallenges();
      if (sendRace) sendRace({ phase: "join", name: nick(), t: Date.now() });
    },

    dismissChallenge: function (id) {
      challenges = challenges.filter(function (c) { return c.id !== id; });
      notifyChallenges();
    },

    onChallenges: function (fn) {
      challengeListeners.push(fn);
      fn(challenges.slice());
    },

    broadcastRace: function (data) {
      if (!sendRace || !nick()) return;
      data.name = data.name || nick();
      sendRace(data);
    },

    onRaceUpdate: function (fn) {
      raceListeners.push(fn);
    },

    postResult: function (game, score, mode) {
      if (!nick()) return;
      var payload = { name: nick(), game: game, score: score, mode: mode || "", t: Date.now() };
      if (sendResult) sendResult(payload);
      logActivity("закончил " + game + " · " + score + " очков", game);
    },

    isOwner: checkOwner,
  };

  function notifyChallenges() {
    var copy = challenges.slice();
    challengeListeners.forEach(function (fn) { fn(copy); });
  }

  global.AmalFriendsNet = AmalFriendsNet;
})(window);
