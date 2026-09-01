/**
 * Мемы — общая лента для семьи и класса.
 * Trystero P2P (когда онлайн вместе) + Firebase (если настроен в amal-chat-config.js).
 */
(function (global) {
  "use strict";

  var CFG = global.AMAL_CHAT_CONFIG || { enabled: false };
  var STORE_NICK = "amal-meme-name-v2";
  var STORE_LOCAL = "amal-meme-local-v3";
  var APP_ID = "amal-games-memes-v1";
  var STICKERS = ["🤣", "😭", "💀", "🗿", "🤡", "👀", "🫠", "🥶", "😎", "🤯", "🫡", "🙈", "🐸", "🍕", "🧊", "⭐", "💜", "🎮", "🐣", "🧟", "🐱", "🐈", "😺"];

  var channels = {
    family: { id: "family", room: "amal-memes-family", title: "Семья", icon: "👨‍👩‍👧", sub: "родственники кидают мемы друг другу" },
    class: { id: "class", room: "amal-memes-class", title: "Класс", icon: "🏫", sub: "одноклассники скидывают мемы" },
  };

  var state = {
    channel: "family",
    posts: [],
    peers: {},
    rooms: {},
    senders: {},
    listeners: [],
  };

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
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmtTime(t) {
    var d = new Date(t);
    return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }

  function uid() {
    return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function localKey(ch) {
    return STORE_LOCAL + "-" + ch;
  }

  function loadLocal(ch) {
    try { return JSON.parse(localStorage.getItem(localKey(ch)) || "[]"); } catch (_) { return []; }
  }

  function saveLocal(ch, posts) {
    try { localStorage.setItem(localKey(ch), JSON.stringify(posts.slice(-100))); } catch (_) {}
  }

  function mergePosts(incoming) {
    if (!incoming || !incoming.id) return;
    if (state.posts.some(function (p) { return p.id === incoming.id; })) return;
    state.posts.push(incoming);
    state.posts.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    if (state.posts.length > 120) state.posts = state.posts.slice(-120);
    saveLocal(state.channel, state.posts);
    notify();
  }

  function notify() {
    state.listeners.forEach(function (fn) {
      try { fn(state.posts.slice()); } catch (_) {}
    });
  }

  function fbBase() {
    var url = (CFG.databaseURL || "").replace(/\/$/, "");
    return url ? url + ".json" : "";
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

  function fbGet(path) {
    var base = fbBase();
    if (!base) return Promise.reject(new Error("no firebase"));
    return fetch(base.replace(".json", "/" + path + ".json"), { cache: "no-store" }).then(function (r) {
      return r.json();
    });
  }

  function loadFirebase(ch) {
    if (!CFG.enabled || !CFG.databaseURL) return;
    fbGet("memes/" + ch + "/posts").then(function (data) {
      if (!data || typeof data !== "object") return;
      Object.keys(data).forEach(function (k) {
        mergePosts(data[k]);
      });
    }).catch(function () {});
  }

  function startP2P(ch) {
    if (state.rooms[ch]) return Promise.resolve(true);
    return import("https://esm.sh/trystero@0.21.0").then(function (mod) {
      if (state.rooms[ch]) return true;
        var joinRoom = mod.joinRoom;
        var room = joinRoom({ appId: APP_ID }, channels[ch].room);
        var postAct = room.makeAction("post");
        var pingAct = room.makeAction("ping");
        state.senders[ch] = postAct[0];
        state.rooms[ch] = room;

        postAct[1](function (data) {
          if (data && data.channel === ch) mergePosts(data);
        });

        pingAct[1](function (data, peerId) {
          if (!data) return;
          state.peers[peerId] = { name: data.name, t: Date.now() };
        });

        var sendPing = pingAct[0];
        room.onPeerJoin(function () {
          if (sendPing && nick()) sendPing({ name: nick(), t: Date.now() });
        });

        setInterval(function () {
          if (sendPing && nick()) sendPing({ name: nick(), t: Date.now() });
        }, 10000);

        return true;
      }).catch(function () { return false; });
  }

  function broadcast(post) {
    var ch = state.channel;
    var send = state.senders[ch];
    if (send) send(post);
    if (CFG.enabled && CFG.databaseURL) {
      fbPush("memes/" + ch + "/posts", post).catch(function () {});
    }
  }

  var AmalMemeNet = {
    stickers: STICKERS,
    channels: channels,

    init: function (opts) {
      opts = opts || {};
      state.channel = opts.channel || "family";
      state.posts = loadLocal(state.channel);
      notify();
      startP2P("family");
      startP2P("class");
      loadFirebase(state.channel);
      if (CFG.enabled && CFG.databaseURL) {
        setInterval(function () { loadFirebase(state.channel); }, 12000);
      }
    },

    setChannel: function (ch) {
      if (!channels[ch]) return;
      state.channel = ch;
      state.posts = loadLocal(ch);
      notify();
      loadFirebase(ch);
    },

    onUpdate: function (fn) {
      state.listeners.push(fn);
      try { fn(state.posts.slice()); } catch (_) {}
    },

    getNick: nick,
    setNick: setNick,
    fmtTime: fmtTime,
    esc: esc,

    onlineCount: function () {
      var n = Object.keys(state.peers).length;
      return nick() ? n + 1 : n;
    },

    networkNote: function () {
      if (CFG.enabled && CFG.databaseURL) {
        return "💬 Общая лента · все видят мемы (интернет)";
      }
      return "📡 Когда друзья/родня онлайн — мемы летят сразу. Или попроси включить общий чат (Firebase).";
    },

    sendText: function (text) {
      text = String(text || "").trim();
      if (!text) return false;
      if (!nick()) return false;
      var post = { id: uid(), channel: state.channel, name: nick(), type: "text", text: text, t: Date.now() };
      mergePosts(post);
      broadcast(post);
      return true;
    },

    sendSticker: function (emoji) {
      if (!nick()) return false;
      var post = { id: uid(), channel: state.channel, name: nick(), type: "sticker", emoji: emoji, t: Date.now() };
      mergePosts(post);
      broadcast(post);
      return true;
    },

    sendMeme: function (emoji, cap, bg) {
      if (!nick()) return false;
      var post = {
        id: uid(), channel: state.channel, name: nick(), type: "meme",
        emoji: emoji || "😂", cap: String(cap || "").slice(0, 120),
        bg: bg || "linear-gradient(135deg,#334155,#1e293b)", t: Date.now(),
      };
      mergePosts(post);
      broadcast(post);
      return true;
    },
  };

  global.AmalMemeNet = AmalMemeNet;
})(window);
