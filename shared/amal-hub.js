/**
 * Amal Hub — общий ник, заметки и админ-инбокс для всех игр Amal's Games.
 * Один origin (GitHub Pages) → один localStorage на все игры.
 */
(function (global) {
  "use strict";

  const KEYS = {
    nick: "amal-hub-nick-v1",
    notes: "amal-hub-notes-v1",
    presence: "amal-hub-presence-v1",
    adminNotes: "amal-hub-admin-notes-v1",
    changelogSeen: "amal-hub-changelog-seen-v1",
  };

  const OWNER_KEYS = ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"];
  const MAX_NOTES = 200;
  const NICK_MIN = 2;
  const NICK_MAX = 16;

  const CHANGELOG = [
    {
      id: "2026-08-07-hub",
      title: "Ник и заметки во всех играх",
      body: "Перед игрой пишешь ник. Можно отправить заметку Амалю. Админ видит, кто во что играет.",
    },
    {
      id: "2026-08-07-blockbust",
      title: "Blockbust: аниме-скины и Кинозал",
      body: "Новые аниме-кубики, админ-фон «Кинозал», удобнее тянуть фигуры на телефоне.",
    },
    {
      id: "2026-08-07-catalog",
      title: "Каталог обновлён",
      body: "Счётчик игр на главной и метки «Новое / Обновлено».",
    },
  ];

  function storeGet(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  function storeSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }

  function isOwner() {
    if (global.__AMAL_OWNER__ === true) return true;
    try {
      if (global.AmalOwner && typeof global.AmalOwner.isOwner === "function" && global.AmalOwner.isOwner()) {
        return true;
      }
    } catch {
      /* ignore */
    }
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("owner") === "AmalOwner2026") {
        localStorage.setItem("amal-owner-v1", "1");
        global.__AMAL_OWNER__ = true;
        return true;
      }
    } catch {
      /* ignore */
    }
    try {
      return OWNER_KEYS.some((k) => localStorage.getItem(k) === "1");
    } catch {
      return false;
    }
  }

  function gameIdFromPath() {
    const parts = location.pathname.replace(/\\/g, "/").split("/").filter(Boolean);
    const cleaned = parts.filter((p) => !/\.(html?|js|css)$/i.test(p));
    const idx = cleaned.indexOf("amal-games");
    if (idx >= 0) return cleaned[idx + 1] || "portal";
    const g = cleaned.indexOf("games");
    if (g >= 0) return cleaned[g + 1] || "portal";
    if (cleaned.length === 0) return "portal";
    return cleaned[cleaned.length - 1] || "portal";
  }

  function gameTitle(id) {
    const map = {
      portal: "Каталог",
      blockbust: "Blockbust",
      hideout: "Укрытие",
      minecraft: "CraftWorld",
      "kick-buddy": "Kick Buddy",
      "zombie-vs-plants": "Зомби vs растения",
      "coin-arsenal": "Coin Arsenal",
      "x-buggy": "X-Buggy",
      "melon-playground": "Melon Playground",
      "space-courier": "Космический курьер",
      "bravol-stars": "Brawl Stars",
      "snake-game": "Snake",
      "ladder-climb": "Ступеньки вверх",
      terraverse: "Пиксель-Террариум",
      "globe-battle": "Globe Battle",
    };
    return map[id] || id;
  }

  function getNick() {
    const n = storeGet(KEYS.nick, "");
    return typeof n === "string" ? n.trim() : "";
  }

  function setNick(raw) {
    const nick = String(raw || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, NICK_MAX);
    if (nick.length < NICK_MIN) return { ok: false, error: "Минимум " + NICK_MIN + " символа" };
    if (/[<>]/.test(nick)) return { ok: false, error: "Без < >" };
    storeSet(KEYS.nick, nick);
    bumpPresence();
    return { ok: true, nick };
  }

  function loadNotes() {
    const list = storeGet(KEYS.notes, []);
    return Array.isArray(list) ? list : [];
  }

  function saveNotes(list) {
    storeSet(KEYS.notes, list.slice(-MAX_NOTES));
  }

  function addNote(text, meta) {
    const body = String(text || "").trim().slice(0, 500);
    if (!body) return { ok: false, error: "Пустая заметка" };
    const nick = getNick() || "Без ника";
    const note = {
      id: "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      nick,
      game: meta && meta.game ? meta.game : gameIdFromPath(),
      text: body,
      at: Date.now(),
      fromAdmin: !!(meta && meta.fromAdmin),
      toNick: (meta && meta.toNick) || null,
      status: "new",
    };
    const list = loadNotes();
    list.push(note);
    saveNotes(list);
    bumpPresence();
    return { ok: true, note };
  }

  function loadPresence() {
    const map = storeGet(KEYS.presence, {});
    return map && typeof map === "object" ? map : {};
  }

  function bumpPresence() {
    const nick = getNick();
    if (!nick) return;
    const map = loadPresence();
    map[nick] = {
      nick,
      game: gameIdFromPath(),
      gameTitle: gameTitle(gameIdFromPath()),
      at: Date.now(),
    };
    storeSet(KEYS.presence, map);
  }

  function recentPlayers(maxAgeMs) {
    const age = maxAgeMs || 1000 * 60 * 60 * 24 * 7;
    const now = Date.now();
    return Object.values(loadPresence())
      .filter((p) => p && p.at && now - p.at < age)
      .sort((a, b) => b.at - a.at);
  }

  function ensureStyles() {
    if (document.getElementById("amal-hub-css")) return;
    const css = document.createElement("style");
    css.id = "amal-hub-css";
    css.textContent = `
#amal-hub-root{position:fixed;z-index:2147483000;inset:0;pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
#amal-hub-root *{box-sizing:border-box}
.amal-hub-fab{pointer-events:auto;position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:48px;height:48px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(15,15,25,.92);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.amal-hub-fab.admin{border-color:rgba(251,191,36,.55);background:rgba(60,40,10,.95)}
.amal-hub-overlay{pointer-events:auto;position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px}
.amal-hub-modal{width:min(100%,420px);max-height:min(88dvh,640px);overflow:auto;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:#12131cf5;color:#f4f4f5;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.amal-hub-modal h2{margin:0;font-size:1.15rem}
.amal-hub-modal .sub{margin:4px 0 0;font-size:12px;opacity:.65}
.amal-hub-row{display:flex;gap:8px;margin-top:12px}
.amal-hub-modal input,.amal-hub-modal textarea{width:100%;margin-top:10px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;padding:10px 12px;font:inherit}
.amal-hub-modal textarea{min-height:90px;resize:vertical}
.amal-hub-modal button{border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff;padding:10px 12px;font-weight:700;cursor:pointer}
.amal-hub-modal button.primary{background:#eab308;color:#111;border:none}
.amal-hub-modal button:disabled{opacity:.45}
.amal-hub-tabs{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
.amal-hub-tabs button{flex:1;min-width:90px;font-size:12px}
.amal-hub-tabs button.on{outline:2px solid #eab308}
.amal-hub-list{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:8px}
.amal-hub-list li{border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px 10px;background:rgba(255,255,255,.04);font-size:12px}
.amal-hub-list .meta{opacity:.6;font-size:10px;margin-bottom:4px;font-weight:700}
.amal-hub-chip{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));pointer-events:auto;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.7);color:#fde68a;font-size:11px;font-weight:800;max-width:55vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.amal-hub-err{color:#fca5a5;font-size:12px;margin-top:8px;font-weight:700}
.amal-hub-ok{color:#86efac;font-size:12px;margin-top:8px;font-weight:700}
.amal-hub-help{margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(251,191,36,.35);background:rgba(251,191,36,.12);color:#fde68a;font-size:12px;font-weight:700;line-height:1.45}
.amal-hub-step{margin-top:12px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05)}
.amal-hub-step h3{margin:0 0 6px;font-size:14px}
.amal-hub-step p{margin:0;font-size:12px;opacity:.75;line-height:1.4}
.amal-hub-big{display:grid;gap:8px;margin-top:12px}
.amal-hub-big button{width:100%;text-align:left;padding:12px 14px;font-size:14px}
.amal-hub-big button b{display:block;font-size:15px}
.amal-hub-big button span{display:block;font-size:11px;opacity:.7;font-weight:600;margin-top:2px}
`;
    document.head.appendChild(css);
  }

  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  let root;
  let view = "home";
  let adminPage = "menu";
  let open = false;
  let gateMode = false;
  let msg = "";
  let err = "";
  let replyTo = "";

  function closeUi() {
    if (gateMode && !getNick()) return;
    open = false;
    gateMode = false;
    msg = "";
    err = "";
    paint();
  }

  function openUi(mode) {
    open = true;
    view = mode || (isOwner() ? "admin" : "note");
    adminPage = "menu";
    replyTo = "";
    if (!getNick()) {
      gateMode = true;
      view = "nick";
    }
    msg = "";
    err = "";
    paint();
  }

  function paint() {
    ensureStyles();
    if (!root) {
      root = document.createElement("div");
      root.id = "amal-hub-root";
      document.body.appendChild(root);
    }
    const nick = getNick();
    const owner = isOwner();
    let html = "";
    if (nick) {
      html += `<button type="button" class="amal-hub-chip" data-amal="open">${escapeHtml(
        nick,
      )} · ${escapeHtml(gameTitle(gameIdFromPath()))}</button>`;
    }
    html += `<button type="button" class="amal-hub-fab ${owner ? "admin" : ""}" data-amal="open" title="${
      owner ? "Моё админ-меню" : "Ник и заметки"
    }">${owner ? "👑" : "📝"}</button>`;

    if (open || gateMode) {
      html += `<div class="amal-hub-overlay" data-amal="backdrop"><div class="amal-hub-modal" data-amal="modal">`;
      if (view === "nick" || !nick) {
        html += nickFormHtml(nick);
      } else if (view === "updates") {
        html += updatesHtml();
      } else if (view === "admin" && owner) {
        html += adminHtml();
      } else {
        html += noteFormHtml(nick);
      }
      html += `</div></div>`;
    }
    root.innerHTML = html;
    bindUi();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nickFormHtml(current) {
    return `
      <h2>${current ? "Сменить ник" : "Как тебя зовут?"}</h2>
      <p class="sub">Ник нужен во всех играх Amal's Games. Без ника играть нельзя.</p>
      <input id="amal-nick-input" maxlength="${NICK_MAX}" placeholder="Например: AmalPro" value="${escapeHtml(
        current || "",
      )}" />
      ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
      ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
      <div class="amal-hub-row">
        <button type="button" class="primary" data-amal="save-nick" style="flex:1">Сохранить ник</button>
        ${current && !gateMode ? `<button type="button" data-amal="close">Закрыть</button>` : ""}
      </div>
    `;
  }

  function noteFormHtml(nick) {
    const mine = loadNotes()
      .filter((n) => n.nick === nick || n.toNick === nick)
      .slice(-8)
      .reverse();
    return `
      <h2>Заметка Амалю</h2>
      <p class="sub">Ты: <b>${escapeHtml(nick)}</b> · игра: ${escapeHtml(gameTitle(gameIdFromPath()))}</p>
      <div class="amal-hub-tabs">
        <button type="button" class="on" data-amal="tab-note">Заметка</button>
        <button type="button" data-amal="tab-nick">Ник</button>
        <button type="button" data-amal="tab-updates">Обновления</button>
        ${isOwner() ? `<button type="button" data-amal="tab-admin">Админ</button>` : ""}
      </div>
      <textarea id="amal-note-input" maxlength="500" placeholder="Напиши Амалю..."></textarea>
      ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
      ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
      <div class="amal-hub-row">
        <button type="button" class="primary" data-amal="send-note" style="flex:1">Отправить</button>
        <button type="button" data-amal="close">Закрыть</button>
      </div>
      <ul class="amal-hub-list">${
        mine.length
          ? mine
              .map(
                (n) =>
                  `<li><div class="meta">${n.fromAdmin ? "От Амаля" : "Ты"} · ${escapeHtml(
                    gameTitle(n.game),
                  )} · ${fmtTime(n.at)}</div>${escapeHtml(n.text)}</li>`,
              )
              .join("")
          : `<li class="meta">Пока нет заметок</li>`
      }</ul>
    `;
  }

  function updatesHtml() {
    return `
      <h2>Обновления</h2>
      <p class="sub">Что нового на сайте</p>
      <div class="amal-hub-tabs">
        <button type="button" data-amal="tab-note">Заметка</button>
        <button type="button" data-amal="tab-nick">Ник</button>
        <button type="button" class="on" data-amal="tab-updates">Обновления</button>
        ${isOwner() ? `<button type="button" data-amal="tab-admin">Админ</button>` : ""}
      </div>
      <ul class="amal-hub-list">${CHANGELOG.map(
        (c) =>
          `<li><div class="meta">${escapeHtml(c.id)}</div><b>${escapeHtml(c.title)}</b><div style="margin-top:4px">${escapeHtml(
            c.body,
          )}</div></li>`,
      ).join("")}</ul>
      <div class="amal-hub-row"><button type="button" data-amal="close" style="flex:1">Закрыть</button></div>
    `;
  }

  function adminHtml() {
    const players = recentPlayers();
    const notes = loadNotes().slice().reverse().slice(0, 40);
    const incoming = notes.filter((n) => !n.fromAdmin);
    const tabs = `
      <div class="amal-hub-tabs">
        <button type="button" class="on" data-amal="tab-admin">Моё меню</button>
        <button type="button" data-amal="tab-note">Как игрок</button>
        <button type="button" data-amal="tab-updates">Что нового</button>
      </div>`;

    if (adminPage === "players") {
      return `
        <h2>1. Кто играет</h2>
        <p class="sub">Здесь ники людей, которые заходили с этого браузера</p>
        ${tabs}
        <div class="amal-hub-help">Читай так: <b>ник</b> — в какую игру зашёл — когда</div>
        <ul class="amal-hub-list">${
          players.length
            ? players
                .map(
                  (p) =>
                    `<li><div class="meta">${fmtTime(p.at)}</div><b>${escapeHtml(p.nick)}</b><div style="margin-top:4px">Играет в: ${escapeHtml(
                      p.gameTitle || p.game,
                    )}</div></li>`,
                )
                .join("")
            : `<li class="meta">Пока никто не заходил. Когда напишут ник — появятся здесь.</li>`
        }</ul>
        <div class="amal-hub-row">
          <button type="button" data-amal="admin-menu" style="flex:1">← Назад в меню</button>
          <button type="button" data-amal="close">Закрыть</button>
        </div>`;
    }

    if (adminPage === "inbox") {
      return `
        <h2>2. Сообщения тебе</h2>
        <p class="sub">Что написали игроки</p>
        ${tabs}
        <div class="amal-hub-help">Жёлтая кнопка «Ответить» подставит ник. «Прочитано» — убрать из важных.</div>
        <ul class="amal-hub-list">${
          incoming.length
            ? incoming
                .map(
                  (n) =>
                    `<li><div class="meta">От: <b>${escapeHtml(n.nick)}</b> · ${escapeHtml(
                      gameTitle(n.game),
                    )} · ${fmtTime(n.at)}${n.status === "done" ? " · прочитано" : ""}</div>${escapeHtml(n.text)}
                    <div class="amal-hub-row" style="margin-top:6px">
                      <button type="button" class="primary" data-amal="reply" data-to="${escapeHtml(n.nick)}">Ответить</button>
                      <button type="button" data-amal="mark" data-id="${escapeHtml(n.id)}">Прочитано</button>
                    </div></li>`,
                )
                .join("")
            : `<li class="meta">Сообщений пока нет. Игрок жмёт 📝 и пишет тебе.</li>`
        }</ul>
        <div class="amal-hub-row">
          <button type="button" data-amal="admin-menu" style="flex:1">← Назад в меню</button>
          <button type="button" data-amal="close">Закрыть</button>
        </div>`;
    }

    if (adminPage === "write") {
      return `
        <h2>3. Написать игроку</h2>
        <p class="sub">Твой ответ сохранится у него в заметках (на этом же браузере)</p>
        ${tabs}
        <div class="amal-hub-help">Сначала ник игрока, потом текст, потом «Отправить».</div>
        <input id="amal-admin-to" maxlength="${NICK_MAX}" placeholder="Ник игрока, например AmalNova" value="${escapeHtml(
          replyTo || "",
        )}" />
        <textarea id="amal-admin-note" maxlength="500" placeholder="Напиши ответ..."></textarea>
        ${err ? `<div class="amal-hub-err">${escapeHtml(err)}</div>` : ""}
        ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
        <div class="amal-hub-row">
          <button type="button" class="primary" data-amal="admin-send" style="flex:1">Отправить</button>
          <button type="button" data-amal="admin-menu">← Меню</button>
        </div>`;
    }

    return `
      <h2>👑 Привет, Амаль!</h2>
      <p class="sub">Это твоё простое админ-меню. Выбери, что сделать:</p>
      ${tabs}
      <div class="amal-hub-help">Коротко: смотри кто играет → читай сообщения → отвечай. Кнопка 👑 всегда внизу справа.</div>
      <div class="amal-hub-big">
        <button type="button" data-amal="admin-players"><b>1. Кто играет</b><span>Список ников и в какую игру зашли</span></button>
        <button type="button" data-amal="admin-inbox"><b>2. Сообщения мне</b><span>Заметки от игроков${
          incoming.length ? " · новых: " + incoming.filter((n) => n.status !== "done").length : ""
        }</span></button>
        <button type="button" data-amal="admin-write"><b>3. Написать игроку</b><span>Ответить на ник</span></button>
        <button type="button" data-amal="export"><b>4. Скопировать всё</b><span>Если хочешь сохранить список себе</span></button>
      </div>
      ${msg ? `<div class="amal-hub-ok">${escapeHtml(msg)}</div>` : ""}
      <div class="amal-hub-row" style="margin-top:12px">
        <button type="button" data-amal="close" style="flex:1">Закрыть</button>
      </div>`;
  }

  function bindUi() {
    root.querySelectorAll("[data-amal]").forEach((el) => {
      el.addEventListener("click", (e) => {
        const act = el.getAttribute("data-amal");
        if (act === "backdrop") {
          if (!gateMode) closeUi();
          return;
        }
        if (act === "modal") {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        if (act === "open") openUi(isOwner() ? "admin" : "note");
        if (act === "close") closeUi();
        if (act === "tab-note") {
          view = "note";
          paint();
        }
        if (act === "tab-nick") {
          view = "nick";
          paint();
        }
        if (act === "tab-updates") {
          view = "updates";
          storeSet(KEYS.changelogSeen, CHANGELOG[0].id);
          paint();
        }
        if (act === "tab-admin") {
          if (!isOwner()) return;
          view = "admin";
          adminPage = "menu";
          paint();
        }
        if (act === "admin-menu") {
          adminPage = "menu";
          paint();
        }
        if (act === "admin-players") {
          adminPage = "players";
          paint();
        }
        if (act === "admin-inbox") {
          adminPage = "inbox";
          paint();
        }
        if (act === "admin-write") {
          adminPage = "write";
          paint();
        }
        if (act === "save-nick") {
          const input = root.querySelector("#amal-nick-input");
          const res = setNick(input && input.value);
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          msg = "Ник сохранён: " + res.nick;
          gateMode = false;
          view = isOwner() ? "admin" : "note";
          paint();
        }
        if (act === "send-note") {
          const input = root.querySelector("#amal-note-input");
          const res = addNote(input && input.value, { game: gameIdFromPath() });
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          msg = "Заметка отправлена Амалю";
          try {
            const packet = `[Amal Games]\nНик: ${res.note.nick}\nИгра: ${gameTitle(res.note.game)}\n${res.note.text}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(packet).catch(() => {});
            }
          } catch {
            /* ignore */
          }
          paint();
        }
        if (act === "admin-send") {
          if (!isOwner()) return;
          const text = root.querySelector("#amal-admin-note");
          const to = root.querySelector("#amal-admin-to");
          const res = addNote(text && text.value, {
            fromAdmin: true,
            toNick: (to && to.value.trim()) || null,
            game: gameIdFromPath(),
          });
          if (!res.ok) {
            err = res.error;
            msg = "";
            paint();
            return;
          }
          err = "";
          msg = "Ответ сохранён";
          paint();
        }
        if (act === "reply") {
          replyTo = el.getAttribute("data-to") || "";
          adminPage = "write";
          view = "admin";
          msg = "Ник подставлен — пиши ответ ниже";
          err = "";
          paint();
        }
        if (act === "mark") {
          const id = el.getAttribute("data-id");
          const list = loadNotes().map((n) => (n.id === id ? { ...n, status: "done" } : n));
          saveNotes(list);
          msg = "Отмечено";
          paint();
        }
        if (act === "export") {
          const packet = JSON.stringify(
            { players: recentPlayers(), notes: loadNotes() },
            null,
            2,
          );
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(packet).then(
                () => {
                  msg = "Скопировано в буфер";
                  paint();
                },
                () => {
                  msg = "Не удалось скопировать";
                  paint();
                },
              );
            }
          } catch {
            msg = "Не удалось скопировать";
            paint();
          }
        }
      });
    });
  }

  function boot() {
    ensureStyles();
    try {
      const params = new URLSearchParams(location.search);
      const qNick = params.get("nick");
      if (qNick) setNick(qNick);
    } catch {
      /* ignore */
    }
    bumpPresence();
    paint();
    if (!getNick()) {
      gateMode = true;
      open = true;
      view = "nick";
      paint();
    } else {
      const seen = storeGet(KEYS.changelogSeen, "");
      if (seen !== CHANGELOG[0].id && gameIdFromPath() === "portal") {
        open = true;
        view = "updates";
        paint();
      }
    }
    setInterval(bumpPresence, 30000);
    global.addEventListener("amal-owner-changed", () => paint());
  }

  global.AmalHub = {
    getNick,
    setNick,
    addNote,
    isOwner,
    open: openUi,
    gameId: gameIdFromPath,
    CHANGELOG,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
