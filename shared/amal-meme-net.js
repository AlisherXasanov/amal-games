/**
 * Мемы — один общий канал (дома, семья, друзья).
 */
(function (global) {
  "use strict";

  var CFG = global.AMAL_CHAT_CONFIG || { enabled: false };
  var STORE_NICK = "amal-meme-name-v2";
  var STORE_LOCAL = "amal-meme-local-v4";
  var APP_ID = "amal-games-memes-v1";
  var ROOM = "amal-memes-home";
  var STICKERS = ["🤣", "😭", "💀", "🗿", "🤡", "👀", "🫠", "😎", "🤯", "🐸", "🍕", "⭐", "💜", "🎮", "🐣", "🐱", "😺", "🏠", "🌙"];

  var state = { posts: [], peers: {}, room: null, sendPost: null, listeners: [] };

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

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(STORE_LOCAL) || "[]"); } catch (_) { return []; }
  }

  function saveLocal(posts) {
    try { localStorage.setItem(STORE_LOCAL, JSON.stringify(posts.slice(-100))); } catch (_) {}
  }

  function mergePosts(incoming) {
    if (!incoming || !incoming.id) return;
    if (state.posts.some(function (p) { return p.id === incoming.id; })) return;
    state.posts.push(incoming);
    state.posts.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    if (state.posts.length > 120) state.posts = state.posts.slice(-120);
    saveLocal(state.posts);
    state.listeners.forEach(function (fn) { try { fn(state.posts.slice()); } catch (_) {} });
  }

  function fbBase() {
    var url = (CFG.databaseURL || "").replace(/\/$/, "");
    return url ? url + ".json" : "";
  }

  function fbPush(path, data) {
    return fetch(fbBase().replace(".json", "/" + path + ".json"), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
  }

  function fbGet(path) {
    return fetch(fbBase().replace(".json", "/" + path + ".json"), { cache: "no-store" }).then(function (r) { return r.json(); });
  }

  function loadFirebase() {
    if (!CFG.enabled || !CFG.databaseURL) return;
    fbGet("memes/home/posts").then(function (data) {
      if (!data || typeof data !== "object") return;
      Object.keys(data).forEach(function (k) { mergePosts(data[k]); });
    }).catch(function () {});
  }

  function startP2P() {
    if (state.room) return Promise.resolve(true);
    return import("https://esm.sh/trystero@0.21.0").then(function (mod) {
      var room = mod.joinRoom({ appId: APP_ID }, ROOM);
      var postAct = room.makeAction("post");
      state.sendPost = postAct[0];
      state.room = room;
      postAct[1](function (data) { mergePosts(data); });
      return true;
    }).catch(function () { return false; });
  }

  function broadcast(post) {
    if (state.sendPost) state.sendPost(post);
    if (CFG.enabled && CFG.databaseURL) fbPush("memes/home/posts", post).catch(function () {});
  }

  function send(type, extra) {
    if (!nick()) return false;
    var post = Object.assign({ id: uid(), name: nick(), type: type, t: Date.now() }, extra || {});
    mergePosts(post);
    broadcast(post);
    return true;
  }

  global.AmalMemeNet = {
    stickers: STICKERS,
    getNick: nick,
    setNick: setNick,
    fmtTime: fmtTime,
    esc: esc,
    init: function () {
      state.posts = loadLocal();
      state.listeners.forEach(function (fn) { try { fn(state.posts.slice()); } catch (_) {} });
      startP2P();
      loadFirebase();
      if (CFG.enabled && CFG.databaseURL) setInterval(loadFirebase, 12000);
    },
    setChannel: function () {},
    onUpdate: function (fn) {
      state.listeners.push(fn);
      try { fn(state.posts.slice()); } catch (_) {}
    },
    networkNote: function () {
      return CFG.enabled && CFG.databaseURL
        ? "💬 Все видят сообщения · интернет"
        : "📡 Откройте вместе — сразу увидите мемы друг друга";
    },
    sendText: function (text) {
      text = String(text || "").trim();
      return text ? send("text", { text: text }) : false;
    },
    sendSticker: function (emoji) { return send("sticker", { emoji: emoji }); },
    sendNews: function (text) {
      text = String(text || "").trim();
      return text ? send("news", { text: text }) : false;
    },
    sendMeme: function (emoji, cap, bg) {
      return send("meme", { emoji: emoji || "😂", cap: String(cap || "").slice(0, 120), bg: bg || "linear-gradient(135deg,#334155,#1e293b)" });
    },
    channels: { home: { title: "Мемы", sub: "дома", hint: "", icon: "😂" } },
  };
})(window);
