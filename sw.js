/* Amaya Games · офлайн-кэш (Service Worker) */
/* eslint-disable no-restricted-globals */
(function () {
  "use strict";

  var VERSION = "amal-offline-v117";
  var CORE = VERSION + "-core";
  var RUNTIME = VERSION + "-runtime";

  function basePath() {
    try {
      var scope = self.registration && self.registration.scope;
      if (scope) return new URL("./", scope).href;
    } catch (_) {}
    return self.location.href.replace(/[^/]+$/, "");
  }

  function u(path) {
    return new URL(path, basePath()).href;
  }

  // Главная + общие скрипты + игры/приложения, которые реально работают офлайн.
  // YouTube внутри «Смотри» нужен интернет — сама оболочка кэшируется.
  var PRECACHE = [
    "./",
    "./index.html",
    "./offline.html",
    "./manifest.webmanifest",
    "./icons/amal.svg",
    "./shared/amal-pwa.js",
    "./shared/amal-3d-wip-lock.js",
    "./shared/amal-throne.js",
    "./shared/amal-hub.js",
    "./shared/amal-gallery-ratings.js",
    "./shared/amal-site-faq.js",
    "./shared/amal-owner-powers.js",
    "./snake-game/",
    "./snake-game/index.html",
    "./zombie-vs-plants/",
    "./zombie-vs-plants/index.html",
    "./rift-storm/",
    "./rift-storm/index.html",
    "./rift-storm/game.js",
    "./rift-storm/style.css",
    "./kick-buddy/",
    "./kick-buddy/index.html",
    "./candle-mine/",
    "./candle-mine/index.html",
    "./candle-mine/main.js",
    "./pot-hammer/",
    "./pot-hammer/index.html",
    "./pot-hammer/main.js",
    "./obby/",
    "./obby/index.html",
    "./obby/main.js",
    "./create-lab/game.html",
    "./create-lab/lab3d.html",
    "./apps/",
    "./apps/index.html",
  ].map(u);

  self.addEventListener("install", function (event) {
    event.waitUntil(
      caches
        .open(CORE)
        .then(function (cache) {
          return Promise.all(
            PRECACHE.map(function (url) {
              return cache.add(url).catch(function () {
                /* файл мог отсутствовать — не валим весь install */
              });
            })
          );
        })
        .then(function () {
          return self.skipWaiting();
        })
    );
  });

  self.addEventListener("activate", function (event) {
    event.waitUntil(
      caches
        .keys()
        .then(function (keys) {
          return Promise.all(
            keys.map(function (key) {
              if (key.indexOf("amal-offline-") === 0 && key !== CORE && key !== RUNTIME) {
                return caches.delete(key);
              }
            })
          );
        })
        .then(function () {
          return self.clients.claim();
        })
    );
  });

  function isNav(req) {
    return req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") !== -1;
  }

  function sameOrigin(url) {
    try {
      return new URL(url).origin === self.location.origin;
    } catch (_) {
      return false;
    }
  }

  function hasCacheBust(url) {
    try {
      var s = new URL(url).search;
      return /[?&]v=/.test(s) || /[?&]fresh=/.test(s);
    } catch (_) {
      return false;
    }
  }

  function putRuntime(req, res) {
    if (!res || res.status !== 200 || res.type === "opaque") return;
    var copy = res.clone();
    caches.open(RUNTIME).then(function (c) {
      c.put(req, copy);
    });
  }

  self.addEventListener("fetch", function (event) {
    var req = event.request;
    if (req.method !== "GET") return;
    if (!sameOrigin(req.url)) return;

    if (req.url.indexOf("/youtube-free/") !== -1) {
      event.respondWith(
        fetch(req, { cache: "no-store" }).catch(function () {
          return caches.match(req);
        })
      );
      return;
    }

    if (/meme-channel|go-memes|qr-memes|amal-meme-net|school-party|friends\.html/.test(req.url)) {
      event.respondWith(fetch(req, { cache: "no-store" }).catch(function () { return caches.match(req); }));
      return;
    }

    if (isNav(req) || hasCacheBust(req.url)) {
      event.respondWith(
        fetch(req)
          .then(function (res) {
            putRuntime(req, res);
            return res;
          })
          .catch(function () {
            return caches.match(req).then(function (hit) {
              if (hit) return hit;
              if (!isNav(req)) return caches.match(u("./offline.html"));
              return caches.match(u("./index.html")).then(function (hub) {
                if (hub) return hub;
                return caches.match(u("./offline.html"));
              });
            });
          })
      );
      return;
    }

    event.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req)
          .then(function (res) {
            putRuntime(req, res);
            return res;
          })
          .catch(function () {
            return caches.match(u("./offline.html"));
          });
      })
    );
  });

  self.addEventListener("message", function (event) {
    if (!event.data) return;
    if (event.data.type === "SKIP_WAITING") self.skipWaiting();
    if (event.data.type === "PREFETCH" && Array.isArray(event.data.urls)) {
      event.waitUntil(
        caches.open(RUNTIME).then(function (cache) {
          return Promise.all(
            event.data.urls.map(function (path) {
              var url = u(path);
              return fetch(url)
                .then(function (res) {
                  if (res && res.ok) return cache.put(url, res);
                })
                .catch(function () {});
            })
          );
        })
      );
    }
  });
})();
