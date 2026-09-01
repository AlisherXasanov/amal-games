/**
 * Чат класса — Firebase Realtime Database (если настроен) или локальный режим.
 * Настройка: shared/amal-chat-config.js
 */
(function (global) {
  "use strict";

  var CFG = global.AMAL_CHAT_CONFIG || { enabled: false };
  var ROOM = "amal-class-2b";
  var STORE_NICK = "amal-chat-nick-v1";
  var STORE_LOCAL = "amal-chat-local-v1";
  var emojis = ["😀", "😂", "❤️", "👍", "🎮", "🐣", "🌊", "🍕", "⭐", "🔥", "😎", "🥳", "👋", "💬", "✨"];

  function $(id) { return document.getElementById(id); }

  function nick() {
    try {
      var n = localStorage.getItem(STORE_NICK);
      if (n && n.trim()) return n.trim().slice(0, 16);
    } catch (_) {}
    return "Игрок";
  }

  function setNick(n) {
    try { localStorage.setItem(STORE_NICK, String(n).slice(0, 16)); } catch (_) {}
  }

  function localMessages() {
    try { return JSON.parse(localStorage.getItem(STORE_LOCAL) || "[]"); } catch (_) { return []; }
  }

  function saveLocal(msgs) {
    try { localStorage.setItem(STORE_LOCAL, JSON.stringify(msgs.slice(-80))); } catch (_) {}
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmtTime(t) {
    var d = new Date(t);
    return d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }

  function renderMessages(list, msgs) {
    if (!list) return;
    list.innerHTML = msgs.map(function (m) {
      var mine = m.name === nick();
      return (
        '<div class="chat-msg' + (mine ? " mine" : "") + '">' +
        '<div class="chat-meta"><b>' + esc(m.name) + "</b> · " + fmtTime(m.t) + "</div>" +
        '<div class="chat-text">' + esc(m.text) + "</div></div>"
      );
    }).join("");
    list.scrollTop = list.scrollHeight;
  }

  function renderOnline(box, online) {
    if (!box) return;
    var names = Object.keys(online || {}).filter(function (n) {
      return online[n] && Date.now() - online[n] < 45000;
    });
    if (!names.length) {
      box.innerHTML = '<span class="off">Пока только ты 🟡</span>';
      return;
    }
    box.innerHTML = names.map(function (n) {
      var on = Date.now() - online[n] < 20000;
      return '<span class="on-user">' + (on ? "🟢" : "🟡") + " " + esc(n) + "</span>";
    }).join(" ");
  }

  /* Firebase REST (без SDK — работает на GitHub Pages) */
  function fbBase() {
    var url = (CFG.databaseURL || "").replace(/\/$/, "");
    return url ? url + ".json" : "";
  }

  function fbGet(path) {
    var base = fbBase();
    if (!base) return Promise.reject(new Error("no firebase"));
    return fetch(base.replace(".json", "/" + path + ".json"), { cache: "no-store" })
      .then(function (r) { return r.json(); });
  }

  function fbPatch(path, data) {
    var base = fbBase();
    if (!base) return Promise.reject(new Error("no firebase"));
    return fetch(base.replace(".json", "/" + path + ".json"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  function fbPush(path, data) {
    var base = fbBase();
    if (!base) return Promise.reject(new Error("no firebase"));
    return fetch(base.replace(".json", "/" + path + ".json"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  var AmalClassChat = {
    emojis: emojis,

    mount: function (rootId, opts) {
      opts = opts || {};
      if (opts.room === "friends") return; /* друзья: amal-friends-net.js */
      var root = $(rootId);
      if (!root) return;

      root.innerHTML =
        '<div class="chat-setup">' +
        '<label>Твоё имя <input id="chat-nick" maxlength="16" placeholder="Амаль" /></label>' +
        "</div>" +
        '<div class="chat-online" id="chat-online">Загрузка…</div>' +
        '<div class="chat-log" id="chat-log"></div>' +
        '<div class="chat-emojis" id="chat-emojis"></div>' +
        '<form class="chat-form" id="chat-form">' +
        '<input id="chat-input" maxlength="120" placeholder="Напиши одноклассникам…" autocomplete="off" />' +
        '<button type="submit">➤</button></form>' +
        '<p class="chat-note" id="chat-note"></p>';

      var nickIn = $("chat-nick");
      nickIn.value = nick();
      nickIn.addEventListener("change", function () { setNick(nickIn.value); });

      var emoBox = $("chat-emojis");
      emojis.forEach(function (e) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = e;
        b.addEventListener("click", function () {
          var inp = $("chat-input");
          inp.value = (inp.value + e).slice(0, 120);
          inp.focus();
        });
        emoBox.appendChild(b);
      });

      var note = $("chat-note");
      if (CFG.enabled && CFG.databaseURL) {
        note.textContent = "💬 Общий чат класса · нужен интернет";
        this.startFirebase();
      } else {
        note.textContent = "📱 Сейчас сообщения только у тебя на телефоне. Общий чат включит родитель (Firebase, 5 мин).";
        renderMessages($("chat-log"), localMessages());
        renderOnline($("chat-online"), {});
      }

      $("chat-form").addEventListener("submit", function (ev) {
        ev.preventDefault();
        AmalClassChat.send($("chat-input").value);
        $("chat-input").value = "";
      });
    },

    send: function (text) {
      text = String(text || "").trim();
      if (!text) return;
      var msg = { name: nick(), text: text, t: Date.now() };

      if (CFG.enabled && CFG.databaseURL) {
        fbPush("rooms/" + ROOM + "/messages", msg).catch(function () {
          AmalClassChat._localSend(msg);
        });
      } else {
        this._localSend(msg);
      }
    },

    _localSend: function (msg) {
      var msgs = localMessages();
      msgs.push(msg);
      saveLocal(msgs);
      renderMessages($("chat-log"), msgs);
    },

    startFirebase: function () {
      var self = this;
      var list = $("chat-log");
      var onlineBox = $("chat-online");

      function pull() {
        fbGet("rooms/" + ROOM).then(function (data) {
          data = data || {};
          var msgs = [];
          if (data.messages) {
            Object.keys(data.messages).forEach(function (k) {
              msgs.push(data.messages[k]);
            });
            msgs.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
          }
          renderMessages(list, msgs.slice(-80));
          renderOnline(onlineBox, data.online || {});
        }).catch(function () {
          renderMessages(list, localMessages());
          if (onlineBox) onlineBox.innerHTML = '<span class="off">Нет связи · проверь интернет</span>';
        });

        fbPatch("rooms/" + ROOM + "/online/" + encodeURIComponent(nick()), Date.now()).catch(function () {});
      }

      pull();
      self._poll = setInterval(pull, 3000);
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) pull();
      });
    },
  };

  global.AmalClassChat = AmalClassChat;
})(window);
