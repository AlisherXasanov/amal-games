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
  var sendHello = null;
  var sendBoard = null;
  var boardListeners = [];
  var messages = [];
  var peers = {};
  var activities = [];
  var challenges = [];
  var challengeListeners = [];
  var raceListeners = [];
  var chatListeners = [];
  var joinListeners = [];
  var leaveListeners = [];
  var isOwner = false;
  var netReady = false;
  var myPlace = "";
  var announcedNames = {};

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
    chatListeners.forEach(function (fn) { try { fn(m); } catch (_) {} });
  }

  function notifyJoin(name, place, peerId) {
    if (!name || name === "?" || name === nick()) return;
    var key = name + "|" + (peerId || "");
    if (announcedNames[key] && Date.now() - announcedNames[key] < 8000) return;
    announcedNames[key] = Date.now();
    var info = { name: name, place: place || "", peerId: peerId || "", t: Date.now() };
    joinListeners.forEach(function (fn) { try { fn(info); } catch (_) {} });
    addMessage({
      name: "🔔",
      text: "друг «" + name + "» зашёл" + (place ? " в «" + place + "»" : "") + "!",
      t: Date.now(),
    });
  }

  function notifyLeave(name) {
    if (!name || name === "?" || name === nick()) return;
    leaveListeners.forEach(function (fn) {
      try { fn({ name: name, t: Date.now() }); } catch (_) {}
    });
  }

  function startNetwork() {
    if (room) return Promise.resolve(true);

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
        var prev = peers[peerId];
        var wasUnknown = !prev || !prev.name || prev.name === "?";
        var nameChanged = prev && prev.name && data.name && prev.name !== data.name;
        peers[peerId] = {
          name: data.name || (prev && prev.name) || "?",
          alive: true,
          t: Date.now(),
          place: data.place || (prev && prev.place) || "",
        };
        renderOnline();
        if (data.name && (wasUnknown || nameChanged || data.hello)) {
          notifyJoin(data.name, data.place || myPlace, peerId);
        }
      });

      var helloAct = room.makeAction("hello");
      sendHello = helloAct[0];
      helloAct[1](function (data, peerId) {
        if (!data || !data.name || data.name === nick()) return;
        peers[peerId] = {
          name: data.name,
          alive: true,
          t: Date.now(),
          place: data.place || "",
        };
        renderOnline();
        notifyJoin(data.name, data.place || "", peerId);
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

      var boardAct = room.makeAction("board");
      sendBoard = boardAct[0];
      boardAct[1](function (data) {
        if (!data || data.from === nick()) return;
        boardListeners.forEach(function (fn) { try { fn(data); } catch (_) {} });
      });

      netReady = true;
      room.onPeerJoin(function (peerId) {
        peers[peerId] = { name: "?", alive: true, t: Date.now(), place: "" };
        if (sendPing && nick()) {
          sendPing({ name: nick(), place: myPlace, hello: true, t: Date.now() });
        }
        if (sendHello && nick()) {
          sendHello({ name: nick(), place: myPlace || "клуб", t: Date.now() });
        }
        renderOnline();
      });

      room.onPeerLeave(function (peerId) {
        var leftName = peers[peerId] && peers[peerId].name;
        delete peers[peerId];
        renderOnline();
        notifyLeave(leftName);
      });

      setInterval(function () {
        if (sendPing && nick()) sendPing({ name: nick(), place: myPlace, t: Date.now() });
        Object.keys(peers).forEach(function (id) {
          if (Date.now() - (peers[id].t || 0) > 25000) peers[id].alive = false;
        });
        renderOnline();
      }, 8000);

      // сразу сказать «я здесь»
      if (nick() && sendPing) sendPing({ name: nick(), place: myPlace, hello: true, t: Date.now() });

      return true;
    }).catch(function (err) {
      console.warn("[AmalFriendsNet] сеть не поднялась", err);
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
      if (!nick()) {
        try {
          var n = prompt("Как тебя зовут?", "") || "";
          if (n.trim()) setNick(n.trim());
        } catch (_) {}
      }
      if (!nick()) return;
      var msg = { name: nick(), text: text, t: Date.now() };
      addMessage(msg);
      if (sendChat) sendChat(msg);
      chatListeners.forEach(function (fn) { try { fn(msg); } catch (_) {} });
    },

    sendText: function (text) { AmalFriendsNet.send(text); },

    getMessages: function () { return messages.slice(); },

    onChat: function (fn) {
      if (typeof fn === "function") chatListeners.push(fn);
    },

    renderOnlineInto: function (box) {
      if (!box) return;
      var names = Object.keys(peers);
      var me = nick();
      var html = "";
      if (me) html += "🟢 " + me + " (ты) ";
      names.forEach(function (p) {
        if (peers[p].name && peers[p].name !== me) {
          html += (peers[p].alive ? "🟢 " : "🟡 ") + peers[p].name + " ";
        }
      });
      box.textContent = html || "🟡 Пока только ты — жди друзей";
    },

    trackGame: function (gameName) {
      logActivity("играет", gameName);
    },

    /** Лёгкий старт сети без полного чата (для игр) */
    initLite: function (onDone, place) {
      checkOwner();
      if (place) myPlace = String(place).slice(0, 40);
      // если хозяин без имени — зовём Амаль, чтобы сеть сразу работала
      if (!nick() && checkOwner()) setNick("Амаль");
      try {
        if (!nick() && global.AmalOwnerSession && AmalOwnerSession.isOwner && AmalOwnerSession.isOwner()) {
          setNick("Амаль");
        }
      } catch (_) {}
      startNetwork().then(function (ok) {
        if (ok && nick()) {
          if (sendPing) sendPing({ name: nick(), place: myPlace, hello: true, t: Date.now() });
          if (sendHello) sendHello({ name: nick(), place: myPlace || "клуб", t: Date.now() });
          logActivity("зашёл", myPlace || "клуб");
        }
        if (onDone) onDone(ok);
      });
    },

    setPlace: function (place) {
      myPlace = String(place || "").slice(0, 40);
      if (sendPing && nick()) sendPing({ name: nick(), place: myPlace, t: Date.now() });
      if (sendHello && nick()) sendHello({ name: nick(), place: myPlace, t: Date.now() });
    },

    onFriendJoin: function (fn) {
      if (typeof fn === "function") joinListeners.push(fn);
    },

    onFriendLeave: function (fn) {
      if (typeof fn === "function") leaveListeners.push(fn);
    },

    isOnline: function () { return !!netReady; },

    friendCount: function () {
      var me = nick();
      return Object.keys(peers).filter(function (id) {
        return peers[id].alive && peers[id].name && peers[id].name !== "?" && peers[id].name !== me;
      }).length;
    },

    friendNames: function () {
      var me = nick();
      var out = [];
      Object.keys(peers).forEach(function (id) {
        var p = peers[id];
        if (p.alive && p.name && p.name !== "?" && p.name !== me) out.push(p.name);
      });
      return out;
    },

    sendBoard: function (payload) {
      if (!sendBoard || !nick()) return false;
      payload = payload || {};
      payload.from = nick();
      payload.t = Date.now();
      sendBoard(payload);
      return true;
    },

    onBoard: function (fn) {
      if (typeof fn === "function") boardListeners.push(fn);
    },

    invitePlay: function (game, label) {
      if (!nick()) return;
      var text = "🎮 " + nick() + " зовёт играть: " + (label || game) + "! Заходи в Настолки → тот же режим «С другом»";
      AmalFriendsNet.send(text);
      AmalFriendsNet.sendBoard({ type: "invite", game: game, label: label || game });
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
