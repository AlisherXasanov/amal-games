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
  var STORE_MOD = "amal-friends-mod-v1";
  var STORE_POWER = "amal-friends-power-v1";
  var STORE_BOOK = "amal-friends-book-v1";
  var OWNER_NICKS = ["амаль", "amal", "хозяин", "амаля"];
  /** Договорённость: одноклассник Азам → ник «Азам» = админ (предупреждения + бан) */
  var ADMIN_NICKS = ["азам", "azam"];
  var BAN_MS = 3 * 24 * 60 * 60 * 1000; // 3 дня
  var POWER_LEVELS = [
    { v: 1, label: "🌱 Новичок" },
    { v: 2, label: "⚡ Средний" },
    { v: 3, label: "💪 Сильный" },
    { v: 4, label: "🔥 Очень сильный" },
    { v: 5, label: "👑 Легенда" },
  ];
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
  var sendDm = null;
  var sendTask = null;
  var sendMod = null;
  var boardListeners = [];
  var dmListeners = [];
  var taskListeners = [];
  var dmLog = []; // for owner watch + local
  var taskList = [];
  var STORE_MSGS = "amal-friends-msgs-v1";
  var STORE_VISITS = "amal-friends-visits-v1";
  var messages = loadMessages();
  var peers = {};

  function loadMessages() {
    try {
      var raw = localStorage.getItem(STORE_MSGS);
      if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) return arr.slice(-80); }
    } catch (_) {}
    return [];
  }
  function saveMessages() {
    try { localStorage.setItem(STORE_MSGS, JSON.stringify(messages.slice(-80))); } catch (_) {}
  }
  function logVisit(name) {
    try {
      var raw = localStorage.getItem(STORE_VISITS);
      var visits = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(visits)) visits = [];
      visits.push({ name: name || "?", t: Date.now() });
      if (visits.length > 200) visits = visits.slice(-200);
      localStorage.setItem(STORE_VISITS, JSON.stringify(visits));
    } catch (_) {}
  }
  function getVisits() {
    try {
      var raw = localStorage.getItem(STORE_VISITS);
      if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; }
    } catch (_) {}
    return [];
  }

  function powerLabel(v) {
    v = Number(v) || 0;
    for (var i = 0; i < POWER_LEVELS.length; i++) {
      if (POWER_LEVELS[i].v === v) return POWER_LEVELS[i].label;
    }
    return "❓ неизвестно";
  }

  function myPower() {
    try {
      var n = Number(localStorage.getItem(STORE_POWER) || "0");
      if (n >= 1 && n <= 5) return n;
    } catch (_) {}
    return 0;
  }

  function setMyPower(v) {
    v = Math.max(0, Math.min(5, Number(v) || 0));
    try { localStorage.setItem(STORE_POWER, String(v)); } catch (_) {}
    if (sendPing && nick()) {
      sendPing({ name: nick(), place: myPlace, power: v, t: Date.now() });
    }
    if (v && nick()) {
      addMessage({
        name: "⚔️",
        text: nick() + " говорит: я " + powerLabel(v) + "!",
        t: Date.now(),
      });
      if (sendChat) {
        sendChat({ name: "⚔️", text: nick() + " говорит: я " + powerLabel(v) + "!", t: Date.now() });
      }
    }
    renderPowerPanel();
    renderOnline();
    renderBook();
  }

  function loadBook() {
    try {
      var raw = localStorage.getItem(STORE_BOOK);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (_) {}
    return [];
  }

  function saveBook(book) {
    try { localStorage.setItem(STORE_BOOK, JSON.stringify(book.slice(0, 80))); } catch (_) {}
  }

  function collectFriend(name, power, opts) {
    opts = opts || {};
    name = String(name || "").trim() || "незнакомец";
    var unknown = !!opts.unknown || name === "?" || /^незнак/i.test(name);
    var book = loadBook();
    var key = nickKey(name);
    var found = -1;
    for (var i = 0; i < book.length; i++) {
      if (nickKey(book[i].name) === key) { found = i; break; }
    }
    var entry = {
      name: name,
      power: Number(power) || 0,
      unknown: unknown,
      t: Date.now(),
    };
    if (found >= 0) book[found] = entry;
    else book.unshift(entry);
    saveBook(book);
    renderBook();
    return entry;
  }

  function removeFromBook(name) {
    var book = loadBook().filter(function (e) { return nickKey(e.name) !== nickKey(name); });
    saveBook(book);
    renderBook();
  }

  function renderPowerPanel() {
    var panel = $("friends-power-panel");
    if (!panel) return;
    var cur = myPower();
    var opts = POWER_LEVELS.map(function (p) {
      return '<option value="' + p.v + '"' + (cur === p.v ? " selected" : "") + ">" + p.label + "</option>";
    }).join("");
    panel.innerHTML =
      "<h3>⚔️ Моя сила (сам говоришь)</h3>" +
      '<p class="mod-hint">Друзья увидят, насколько ты сильный. Даже если ник чужой — сила всё равно видна.</p>' +
      '<label>Я: <select id="friends-power-sel"><option value="0">не выбрано</option>' + opts + "</select></label>" +
      '<div class="mod-btns" style="margin-top:8px">' +
      '<button type="button" id="friends-power-say">📢 Сказать всем</button>' +
      '<button type="button" id="friends-collect-all">📥 Собрать всех онлайн</button>' +
      "</div>";
    $("friends-power-sel").onchange = function () {
      setMyPower(this.value);
    };
    $("friends-power-say").onclick = function () {
      var v = Number($("friends-power-sel").value) || myPower();
      if (!v) { alert("Сначала выбери силу!"); return; }
      setMyPower(v);
    };
    $("friends-collect-all").onclick = function () {
      var me = nick();
      Object.keys(peers).forEach(function (id) {
        var p = peers[id];
        if (!p || !p.name || p.name === me) return;
        collectFriend(p.name, p.power || 0, { unknown: p.name === "?" });
      });
      addMessage({ name: "📥", text: "Собрал друзей онлайн в свою коллекцию", t: Date.now() });
    };
  }

  function renderBook() {
    var box = $("friends-book");
    if (!box) return;
    var book = loadBook();
    if (!book.length) {
      box.innerHTML = "<p class=\"mod-hint\">Пока пусто — собери друзей кнопкой ➕ или «Собрать всех»</p>";
      return;
    }
    box.innerHTML =
      "<h3>📒 Моя коллекция друзей</h3>" +
      "<ul>" +
      book.map(function (e) {
        var who = e.unknown ? "❓ незнакомец «" + esc(e.name) + "»" : esc(e.name);
        return (
          "<li><b>" + who + "</b> · " + esc(powerLabel(e.power)) +
          ' <button type="button" class="book-del" data-n="' + esc(e.name) + '">✕</button></li>'
        );
      }).join("") +
      "</ul>";
    box.querySelectorAll(".book-del").forEach(function (btn) {
      btn.onclick = function () { removeFromBook(btn.getAttribute("data-n")); };
    });
  }
  var activities = [];
  var challenges = [];
  var challengeListeners = [];
  var raceListeners = [];
  var chatListeners = [];
  var joinListeners = [];
  var leaveListeners = [];
  var isOwner = false;
  var isAdmin = false;
  var netReady = false;
  var myPlace = "";
  var announcedNames = {};
  var modState = loadModState();

  function loadModState() {
    try {
      var raw = localStorage.getItem(STORE_MOD);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === "object") {
          return { warns: o.warns || {}, bans: o.bans || {} };
        }
      }
    } catch (_) {}
    return { warns: {}, bans: {} };
  }

  function saveModState() {
    try { localStorage.setItem(STORE_MOD, JSON.stringify(modState)); } catch (_) {}
  }

  function nickKey(n) {
    return String(n || "").trim().toLowerCase();
  }

  function isOwnerNick(n) {
    return OWNER_NICKS.indexOf(nickKey(n)) >= 0;
  }

  function isAdminNick(n) {
    return ADMIN_NICKS.indexOf(nickKey(n)) >= 0;
  }

  function banUntil(name) {
    if (isOwnerNick(name)) {
      if (modState.bans[nickKey(name)]) {
        delete modState.bans[nickKey(name)];
        saveModState();
      }
      return 0;
    }
    var b = modState.bans[nickKey(name)];
    if (!b || !b.until) return 0;
    if (Date.now() >= b.until) {
      delete modState.bans[nickKey(name)];
      saveModState();
      return 0;
    }
    return b.until;
  }

  function clearOwnerBans() {
    var changed = false;
    Object.keys(modState.bans || {}).forEach(function (k) {
      if (isOwnerNick(k)) {
        delete modState.bans[k];
        changed = true;
      }
    });
    if (changed) saveModState();
  }

  function warnCount(name) {
    return modState.warns[nickKey(name)] || 0;
  }

  function daysLeft(until) {
    return Math.max(1, Math.ceil((until - Date.now()) / (24 * 60 * 60 * 1000)));
  }

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
    checkAdmin();
    renderModPanel();
  }

  function checkOwner() {
    var n = nick().toLowerCase();
    try {
      if (localStorage.getItem(STORE_OWNER) === "1") isOwner = true;
    } catch (_) {}
    isOwner = isOwner || OWNER_NICKS.indexOf(n) >= 0;
    try {
      if (global.AmalOwnerSession && AmalOwnerSession.isOwner && AmalOwnerSession.isOwner()) isOwner = true;
    } catch (_) {}
    if (isOwner) clearOwnerBans();
    return isOwner;
  }

  function checkAdmin() {
    checkOwner();
    isAdmin = isOwner || isAdminNick(nick());
    return isAdmin;
  }

  function applyModEvent(ev, fromNet) {
    if (!ev || !ev.type) return;
    if (ev.type === "state" && ev.state) {
      modState = { warns: ev.state.warns || {}, bans: ev.state.bans || {} };
      saveModState();
      renderModPanel();
      return;
    }
    if (ev.type === "warn" && ev.target) {
      var wk = nickKey(ev.target);
      modState.warns[wk] = Math.min(3, (modState.warns[wk] || 0) + 1);
      if (modState.warns[wk] >= 3) {
        modState.bans[wk] = {
          until: Date.now() + BAN_MS,
          by: ev.by || "админ",
          reason: "3 предупреждения",
        };
        modState.warns[wk] = 0;
        addMessage({
          name: "⛔",
          text: "«" + ev.target + "» получил 3-е предупреждение → бан на 3 дня (от " + (ev.by || "?") + ")",
          t: Date.now(),
        });
      } else {
        addMessage({
          name: "⚠️",
          text: "Предупреждение " + modState.warns[wk] + "/3 для «" + ev.target + "» (от " + (ev.by || "?") + ")",
          t: Date.now(),
        });
      }
      saveModState();
      renderModPanel();
      return;
    }
    if (ev.type === "ban" && ev.target) {
      var tk = nickKey(ev.target);
      // Бан Амаля → отражается на того, кто банил
      if (isOwnerNick(ev.target)) {
        var adminName = ev.by || "админ";
        var ak = nickKey(adminName);
        if (ak && !isOwnerNick(adminName)) {
          modState.bans[ak] = {
            until: Date.now() + BAN_MS,
            by: "🛡️ защита Амаля",
            reason: "забанил хозяина",
          };
          delete modState.bans[tk];
          addMessage({
            name: "🛡️",
            text: "Нельзя банить Амаля! Бан на 3 дня получил «" + adminName + "».",
            t: Date.now(),
          });
        } else {
          addMessage({ name: "🛡️", text: "Амаля банить нельзя.", t: Date.now() });
        }
        saveModState();
        renderModPanel();
        return;
      }
      modState.bans[tk] = {
        until: ev.until || (Date.now() + BAN_MS),
        by: ev.by || "админ",
        reason: ev.reason || "бан админа",
      };
      modState.warns[tk] = 0;
      addMessage({
        name: "⛔",
        text: "«" + ev.target + "» в бане на " + daysLeft(modState.bans[tk].until) + " дн. (от " + (ev.by || "?") + ")",
        t: Date.now(),
      });
      saveModState();
      renderModPanel();
      return;
    }
    if (ev.type === "unban" && ev.target) {
      delete modState.bans[nickKey(ev.target)];
      addMessage({
        name: "✅",
        text: "Бан снят с «" + ev.target + "»" + (fromNet ? "" : ""),
        t: Date.now(),
      });
      saveModState();
      renderModPanel();
    }
  }

  function broadcastMod(ev) {
    applyModEvent(ev, false);
    if (sendMod) sendMod(ev);
  }

  function peerNamesList() {
    var me = nick();
    var out = [];
    if (me) out.push(me);
    Object.keys(peers).forEach(function (id) {
      var p = peers[id];
      if (p && p.name && p.name !== "?" && out.indexOf(p.name) < 0) out.push(p.name);
    });
    return out;
  }

  function renderModPanel() {
    var panel = $("friends-mod-panel");
    if (!panel) return;
    if (!checkAdmin()) { panel.hidden = true; return; }
    panel.hidden = false;
    var role = checkOwner() ? "👑 Хозяин" : "🛡️ Админ Азам";
    var names = peerNamesList();
    var opts = names.map(function (n) {
      var w = warnCount(n);
      var until = banUntil(n);
      var tag = until ? " [БАН " + daysLeft(until) + "д]" : (w ? " [⚠" + w + "/3]" : "");
      return '<option value="' + esc(n) + '">' + esc(n) + tag + "</option>";
    }).join("");
    panel.innerHTML =
      "<h3>" + role + " · команды</h3>" +
      '<p class="mod-hint">Ник <b>Азам</b> = админ. 3 предупреждения → бан 3 дня. Банить Амаля нельзя — бан вернётся админу.</p>' +
      '<label>Кто: <select id="friends-mod-who">' + opts + "</select></label>" +
      '<div class="mod-btns">' +
      '<button type="button" id="friends-mod-warn">⚠️ Предупреждение</button>' +
      '<button type="button" id="friends-mod-ban">⛔ Бан 3 дня</button>' +
      '<button type="button" id="friends-mod-unban">✅ Снять бан</button>' +
      "</div>";
    var who = $("friends-mod-who");
    $("friends-mod-warn").onclick = function () {
      var t = who && who.value;
      if (!t) return;
      broadcastMod({ type: "warn", target: t, by: nick(), t: Date.now() });
    };
    $("friends-mod-ban").onclick = function () {
      var t = who && who.value;
      if (!t) return;
      broadcastMod({
        type: "ban",
        target: t,
        by: nick(),
        until: Date.now() + BAN_MS,
        reason: "бан админа",
        t: Date.now(),
      });
    };
    $("friends-mod-unban").onclick = function () {
      var t = who && who.value;
      if (!t) return;
      if (!checkOwner() && isOwnerNick(t)) return;
      broadcastMod({ type: "unban", target: t, by: nick(), t: Date.now() });
    };
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
    if (me) {
      html += '<span class="on-user">🟢 ' + esc(me) + " (ты)" +
        (myPower() ? " · " + esc(powerLabel(myPower())) : "") + "</span> ";
    }
    names.forEach(function (p) {
      if (peers[p].name && peers[p].name !== me) {
        var nm = peers[p].name === "?" ? "❓ незнакомец" : peers[p].name;
        var pw = peers[p].power ? " · " + powerLabel(peers[p].power) : "";
        html +=
          '<span class="on-user">' + (peers[p].alive ? "🟢" : "🟡") + " " + esc(nm) + esc(pw) +
          ' <button type="button" class="collect-btn" data-n="' + esc(peers[p].name) +
          '" data-p="' + (peers[p].power || 0) + '" title="Собрать к себе">➕</button></span> ';
      }
    });
    box.innerHTML = html || "🟡 Пока только ты — жди друзей";
    box.querySelectorAll(".collect-btn").forEach(function (btn) {
      btn.onclick = function () {
        collectFriend(btn.getAttribute("data-n"), btn.getAttribute("data-p"), {
          unknown: btn.getAttribute("data-n") === "?",
        });
        addMessage({
          name: "📥",
          text: "Добавил «" + btn.getAttribute("data-n") + "» в коллекцию (" +
            powerLabel(btn.getAttribute("data-p")) + ")",
          t: Date.now(),
        });
      };
    });
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

    if (!$("friends-clear-chat-btn")) {
      var div = document.createElement("div");
      div.style.cssText = "margin-top:10px;display:flex;gap:8px;flex-wrap:wrap";
      div.innerHTML =
        '<button id="friends-clear-chat-btn" style="background:#dc2626;color:#fff;border:0;border-radius:10px;padding:8px 14px;font:800 12px inherit;cursor:pointer">🧹 Очистить чат</button>' +
        '<button id="friends-clear-visits-btn" style="background:#7c3aed;color:#fff;border:0;border-radius:10px;padding:8px 14px;font:800 12px inherit;cursor:pointer">🗑️ Очистить визиты</button>';
      panel.appendChild(div);
      $("friends-clear-chat-btn").onclick = function () {
        if (confirm("Удалить всю переписку?")) AmalFriendsNet.clearChat();
      };
      $("friends-clear-visits-btn").onclick = function () {
        if (confirm("Очистить журнал визитов?")) { AmalFriendsNet.clearVisits(); alert("Готово!"); }
      };
    }
  }

  function addMessage(m) {
    messages.push(m);
    if (messages.length > 80) messages = messages.slice(-80);
    saveMessages();
    renderMessages();
    chatListeners.forEach(function (fn) { try { fn(m); } catch (_) {} });
  }

  function notifyJoin(name, place, peerId) {
    if (!name || name === "?" || name === nick()) return;
    var key = name + "|" + (peerId || "");
    if (announcedNames[key] && Date.now() - announcedNames[key] < 8000) return;
    announcedNames[key] = Date.now();
    logVisit(name);
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
    addMessage({
      name: "👋",
      text: "друг «" + name + "» вышел",
      t: Date.now(),
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
        if (!data) return;
        if (data.clear) { messages = []; saveMessages(); renderMessages(); }
        if (data.text) addMessage(data);
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
          power: data.power != null ? Number(data.power) : ((prev && prev.power) || 0),
        };
        renderOnline();
        if (data.name && (wasUnknown || nameChanged || data.hello)) {
          notifyJoin(data.name, data.place || myPlace, peerId);
        }
        if (data.power && data.name && data.name !== nick()) {
          // тихий апдейт силы без спама
          renderBook();
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
          power: data.power != null ? Number(data.power) : 0,
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

      var modAct = room.makeAction("mod");
      sendMod = modAct[0];
      modAct[1](function (data) {
        if (!data || data.by === nick()) return;
        applyModEvent(data, true);
      });

      var dmAct = room.makeAction("dm");
      sendDm = dmAct[0];
      dmAct[1](function (data) {
        if (!data || !data.from) return;
        dmLog.push(data);
        if (dmLog.length > 200) dmLog = dmLog.slice(-200);
        dmListeners.forEach(function (fn) { try { fn(data); } catch (_) {} });
      });

      var taskAct = room.makeAction("task");
      sendTask = taskAct[0];
      taskAct[1](function (data) {
        if (!data) return;
        if (data.type === "list" && Array.isArray(data.items)) {
          taskList = data.items.slice(0, 40);
        } else if (data.type === "add" && data.task) {
          taskList.unshift(data.task);
          if (taskList.length > 40) taskList.length = 40;
        } else if (data.type === "propose" && data.task) {
          taskList.unshift(data.task);
          if (taskList.length > 40) taskList.length = 40;
        } else if (data.type === "done" && data.id) {
          taskList.forEach(function (t) { if (t.id === data.id) t.done = true; });
        }
        taskListeners.forEach(function (fn) { try { fn(data, taskList.slice()); } catch (_) {} });
      });

      netReady = true;
      room.onPeerJoin(function (peerId) {
        peers[peerId] = { name: "?", alive: true, t: Date.now(), place: "" };
        if (sendPing && nick()) {
          sendPing({ name: nick(), place: myPlace, power: myPower(), hello: true, t: Date.now() });
        }
        if (sendHello && nick()) {
          sendHello({ name: nick(), place: myPlace || "клуб", power: myPower(), t: Date.now() });
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
        if (sendPing && nick()) sendPing({ name: nick(), place: myPlace, power: myPower(), t: Date.now() });
        Object.keys(peers).forEach(function (id) {
          if (Date.now() - (peers[id].t || 0) > 25000) peers[id].alive = false;
        });
        renderOnline();
      }, 8000);

      // сразу сказать «я здесь»
      if (nick() && sendPing) sendPing({ name: nick(), place: myPlace, power: myPower(), hello: true, t: Date.now() });

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
      renderModPanel();
    },

    mountChat: function (rootId) {
      var root = $(rootId);
      if (!root) return;

      root.innerHTML =
        '<div class="chat-setup"><label>Твоё имя ' +
        '<input id="friends-nick" maxlength="16" placeholder="Напиши как тебя зовут" /></label></div>' +
        '<div class="chat-online" id="friends-online">Подключение…</div>' +
        '<div id="friends-power-panel" class="owner-panel power-panel"></div>' +
        '<div id="friends-book" class="owner-panel book-panel"></div>' +
        '<div class="chat-log" id="friends-chat-log"></div>' +
        '<div class="chat-emojis" id="friends-emojis"></div>' +
        '<form class="chat-form" id="friends-chat-form">' +
        '<input id="friends-chat-input" maxlength="120" placeholder="Только друзья увидят…" />' +
        '<button type="submit">➤</button></form>' +
        '<p class="chat-note" id="friends-chat-note"></p>' +
        '<div id="friends-mod-panel" class="owner-panel mod-panel" hidden></div>' +
        '<div id="friends-owner-panel" class="owner-panel" hidden>' +
        "<h3>👑 Панель Амаля — кто играет</h3>" +
        '<ul id="friends-activity"></ul></div>';

      var nickIn = $("friends-nick");
      nickIn.value = nick();
      nickIn.addEventListener("change", function () {
        setNick(nickIn.value);
        renderOnline();
        renderOwner();
        renderModPanel();
        renderPowerPanel();
      });
      nickIn.addEventListener("blur", function () {
        setNick(nickIn.value);
        renderOnline();
        renderOwner();
        renderModPanel();
        renderPowerPanel();
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
      renderModPanel();
      renderPowerPanel();
      renderBook();
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
      var until = banUntil(nick());
      if (until) {
        addMessage({
          name: "⛔",
          text: "Ты в бане ещё " + daysLeft(until) + " дн. Писать нельзя.",
          t: Date.now(),
        });
        return;
      }
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
          if (sendPing) sendPing({ name: nick(), place: myPlace, power: myPower(), hello: true, t: Date.now() });
          if (sendHello) sendHello({ name: nick(), place: myPlace || "клуб", power: myPower(), t: Date.now() });
          logActivity("зашёл", myPlace || "клуб");
        }
        if (onDone) onDone(ok);
      });
    },

    setPlace: function (place) {
      myPlace = String(place || "").slice(0, 40);
      if (sendPing && nick()) sendPing({ name: nick(), place: myPlace, power: myPower(), t: Date.now() });
      if (sendHello && nick()) sendHello({ name: nick(), place: myPlace, power: myPower(), t: Date.now() });
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

    /** Личное сообщение: to = имя друга; type: invite|accept|msg|leave */
    sendDm: function (payload) {
      if (!sendDm || !nick()) return false;
      payload = payload || {};
      payload.from = nick();
      payload.t = Date.now();
      dmLog.push(payload);
      if (dmLog.length > 200) dmLog = dmLog.slice(-200);
      sendDm(payload);
      dmListeners.forEach(function (fn) { try { fn(payload); } catch (_) {} });
      return true;
    },

    onDm: function (fn) {
      if (typeof fn === "function") dmListeners.push(fn);
    },

    getDmLog: function () { return dmLog.slice(); },

    /** Задания клуба */
    sendTask: function (payload) {
      if (!sendTask || !nick()) return false;
      payload = payload || {};
      payload.from = nick();
      payload.t = Date.now();
      if (payload.type === "add" || payload.type === "propose") {
        if (payload.task) {
          taskList.unshift(payload.task);
          if (taskList.length > 40) taskList.length = 40;
        }
      }
      if (payload.type === "done" && payload.id) {
        taskList.forEach(function (t) { if (t.id === payload.id) t.done = true; });
      }
      sendTask(payload);
      taskListeners.forEach(function (fn) { try { fn(payload, taskList.slice()); } catch (_) {} });
      return true;
    },

    onTask: function (fn) {
      if (typeof fn === "function") taskListeners.push(fn);
    },

    getTasks: function () { return taskList.slice(); },

    setTasksLocal: function (list) {
      taskList = (list || []).slice(0, 40);
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
    isAdmin: checkAdmin,
    warnCount: warnCount,
    banUntil: banUntil,
    getVisits: getVisits,
    getMessages: function () { return messages.slice(); },
    myPower: myPower,
    setMyPower: setMyPower,
    collectFriend: collectFriend,
    getBook: loadBook,
    clearOwnerBan: function () {
      clearOwnerBans();
      OWNER_NICKS.forEach(function (n) {
        delete modState.bans[nickKey(n)];
        delete modState.warns[nickKey(n)];
      });
      saveModState();
      if (sendMod) sendMod({ type: "unban", target: nick() || "Амаль", by: nick() || "Амаль", t: Date.now() });
      renderModPanel();
    },

    /** Хозяин: обнулить всю переписку */
    clearChat: function () {
      if (!checkOwner()) return;
      messages = [];
      saveMessages();
      renderMessages();
      if (sendChat) sendChat({ name: "🧹", text: "Амаль очистил чат", t: Date.now(), clear: true });
    },

    /** Хозяин: обнулить журнал визитов */
    clearVisits: function () {
      if (!checkOwner()) return;
      try { localStorage.removeItem(STORE_VISITS); } catch (_) {}
    },
  };

  function notifyChallenges() {
    var copy = challenges.slice();
    challengeListeners.forEach(function (fn) { fn(copy); });
  }

  global.AmalFriendsNet = AmalFriendsNet;
})(window);
