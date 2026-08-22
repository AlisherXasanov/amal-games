(() => {
  "use strict";

  const GALLERY_KEY = "amal-owner-gallery-v1";
  const RATINGS_KEY = "amal-hub-game-ratings-v1";
  const LIKES_KEY = "amal-gallery-likes-v1";
  const BC = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("amal-gallery-ratings") : null;
  let starClickBound = false;

  function toast(msg) {
    ensureCss();
    let t = document.getElementById("amal-gr-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "amal-gr-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function storeGet(k, fb) {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fb;
    } catch (_) {
      return fb;
    }
  }
  function storeSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      if (BC) BC.postMessage({ type: "sync", key: k });
      return true;
    } catch (_) {
      return false;
    }
  }

  function isOwner() {
    try {
      if (new URLSearchParams(location.search).get("owner") === "AmalOwner2026") return true;
      if (window.AmalHub && typeof AmalHub.isOwner === "function" && AmalHub.isOwner()) return true;
      if (window.AmalOwner && typeof AmalOwner.isOwner === "function" && AmalOwner.isOwner()) return true;
      return ["amal-owner-v1", "amal-owner-v2", "amal-owner-v3"].some((x) => localStorage.getItem(x) === "1");
    } catch (_) {
      return false;
    }
  }

  function nick() {
    try {
      if (window.AmalHub && AmalHub.getNick && AmalHub.getNick()) return AmalHub.getNick();
      const n = localStorage.getItem("amal-hub-nick-v1");
      if (n) return n;
    } catch (_) { /* ignore */ }
    return "гость";
  }

  function gameIdFromHref(href) {
    if (!href) return "";
    const h = href.split("?")[0].replace(/^\.\//, "");
    if (/\.html$/i.test(h)) return h.replace(/\.html$/i, "").replace(/\//g, "-") || "page";
    const m = h.match(/^([a-z0-9-]+)\/?$/i);
    return m ? m[1].toLowerCase() : "";
  }

  function loadGallery() {
    return storeGet(GALLERY_KEY, []);
  }

  function saveGalleryItem(item) {
    const list = loadGallery();
    const entry = {
      id: item.id || "g" + Date.now(),
      png: item.png,
      title: (item.title || "Рисунок Amal").slice(0, 40),
      at: Date.now(),
    };
    list.unshift(entry);
    while (list.length > 24) list.pop();
    storeSet(GALLERY_KEY, list);
    return entry;
  }

  function deleteGalleryItem(id) {
    const list = loadGallery().filter((x) => x.id !== id);
    storeSet(GALLERY_KEY, list);
  }

  function loadLikes() {
    return storeGet(LIKES_KEY, {});
  }

  function likeCount(id) {
    const likes = loadLikes();
    return (likes[id] || []).length;
  }

  function toggleLike(id) {
    const n = nick();
    const likes = loadLikes();
    const set = new Set(likes[id] || []);
    if (set.has(n)) set.delete(n);
    else set.add(n);
    likes[id] = Array.from(set);
    storeSet(LIKES_KEY, likes);
    return likes[id].length;
  }

  function didLike(id) {
    return (loadLikes()[id] || []).includes(nick());
  }

  function loadRatings() {
    return storeGet(RATINGS_KEY, { votes: [] });
  }

  function effectiveStars(v) {
    return typeof v.ownerStars === "number" ? v.ownerStars : v.stars;
  }

  function statsForGame(gameId) {
    const votes = loadRatings().votes.filter((v) => v.gameId === gameId);
    if (!votes.length) return { avg: 0, count: 0, votes: [] };
    const sum = votes.reduce((a, v) => a + effectiveStars(v), 0);
    return { avg: sum / votes.length, count: votes.length, votes };
  }

  function myVote(gameId) {
    const n = nick();
    return loadRatings().votes.find((v) => v.gameId === gameId && v.nick === n) || null;
  }

  function rateGame(gameId, stars) {
    stars = Math.max(1, Math.min(5, Math.round(stars)));
    const data = loadRatings();
    const n = nick();
    const idx = data.votes.findIndex((v) => v.gameId === gameId && v.nick === n);
    const vote = {
      id: idx >= 0 ? data.votes[idx].id : "v" + Date.now() + Math.random().toString(36).slice(2, 6),
      gameId,
      nick: n,
      stars,
      at: Date.now(),
    };
    if (idx >= 0) {
      if (typeof data.votes[idx].ownerStars === "number") vote.ownerStars = data.votes[idx].ownerStars;
      data.votes[idx] = vote;
    } else data.votes.push(vote);
    storeSet(RATINGS_KEY, data);
    return vote;
  }

  function ownerSetVoteStars(voteId, stars) {
    if (!isOwner()) return { ok: false, error: "Только хозяин" };
    stars = Math.max(1, Math.min(5, Math.round(stars)));
    const data = loadRatings();
    const v = data.votes.find((x) => x.id === voteId);
    if (!v) return { ok: false, error: "Нет такой оценки" };
    v.ownerStars = stars;
    v.ownerAt = Date.now();
    storeSet(RATINGS_KEY, data);
    return { ok: true, vote: v };
  }

  function starsHtml(value, interactive, gameId) {
    const full = Math.round(value * 2) / 2;
    let out = "";
    for (let i = 1; i <= 5; i++) {
      const on = i <= Math.floor(full) || (i === Math.ceil(full) && full % 1 >= 0.5);
      out +=
        '<button type="button" class="amal-star' +
        (on ? " on" : "") +
        (interactive ? " pick" : "") +
        '" data-star="' +
        i +
        '" data-game="' +
        (gameId || "") +
        '" aria-label="' +
        i +
        ' из 5">' +
        (on ? "★" : "☆") +
        "</button>";
    }
    return out;
  }

  function ensureCss() {
    if (document.getElementById("amal-gr-css")) return;
    const s = document.createElement("style");
    s.id = "amal-gr-css";
    s.textContent = `
      .amal-gallery-wrap{max-width:1100px;margin:0 auto 1.5rem;padding:0 1rem}
      .amal-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
      .amal-gallery-item{background:rgba(255,255,255,.92);border:1px solid rgba(13,110,95,.18);border-radius:16px;overflow:hidden;box-shadow:0 8px 22px rgba(16,40,32,.06)}
      .amal-gallery-item img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#fffef8;display:block}
      .amal-gallery-meta{padding:.65rem .75rem .75rem}
      .amal-gallery-meta h3{margin:0;font:700 14px/1.3 Nunito,sans-serif;color:#102018}
      .amal-gallery-meta p{margin:.25rem 0 0;font:600 11px Nunito,sans-serif;color:#5a6a62}
      .amal-gallery-like{margin-top:.45rem;display:flex;align-items:center;gap:.35rem}
      .amal-gallery-like button{border:0;background:rgba(226,90,60,.12);color:#e25a3c;border-radius:999px;padding:4px 10px;font:800 12px Nunito,sans-serif;cursor:pointer}
      .amal-gallery-like button.on{background:linear-gradient(135deg,#e25a3c,#f0b429);color:#1a1400}
      .amal-rating-row{margin-top:.55rem;display:flex;flex-wrap:wrap;align-items:center;gap:.25rem .35rem}
      .amal-star{border:0;background:none;padding:0;font-size:15px;line-height:1;cursor:pointer;color:#cbd5e1}
      .amal-star.on{color:#f0b429}
      .amal-star.pick:hover{transform:scale(1.15)}
      .amal-rating-label{font:800 11px Nunito,sans-serif;color:#0d6e5f}
      .amal-rating-count{font:700 10px Nunito,sans-serif;color:#5a6a62}
      .amal-rating-owner{font:800 9px Nunito,sans-serif;color:#7c3aed;text-transform:uppercase;letter-spacing:.06em;border:0;background:rgba(124,58,237,.1);border-radius:8px;padding:3px 7px;cursor:pointer}
      .amal-rating-panel{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(8,32,24,.62);padding:1rem;cursor:default}
      .amal-rating-box{width:min(420px,96vw);max-height:80vh;overflow:auto;background:#fffef8;border-radius:18px;padding:1rem;border:2px solid rgba(13,110,95,.2);box-shadow:0 22px 50px rgba(0,0,0,.45);cursor:default;position:relative;z-index:1}
      .amal-rating-box h3{margin:0 0 .6rem;font:700 1.05rem Fredoka,Nunito,sans-serif;color:#0d6e5f}
      .amal-rating-vote{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem;padding:.45rem 0;border-top:1px dashed rgba(13,110,95,.15)}
      .amal-rating-vote b{font:800 12px Nunito,sans-serif;color:#102018;min-width:4rem}
      .amal-rating-vote .was{font:700 11px Nunito,sans-serif;color:#5a6a62}
      .amal-rating-vote .edit{display:flex;gap:2px}
      .amal-rating-vote .edit button{border:0;border-radius:6px;padding:2px 6px;font:800 11px Nunito,sans-serif;cursor:pointer;background:rgba(13,110,95,.1);color:#0d6e5f}
      .amal-rating-vote .edit button.cur{background:#f0b429;color:#1a1400}
      .amal-rating-close{margin-top:.75rem;width:100%;border:0;border-radius:12px;padding:.65rem;font:800 14px Nunito,sans-serif;cursor:pointer;background:linear-gradient(135deg,#0d6e5f,#0a5248);color:#f3efe6}
      #amal-gr-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483647;padding:10px 16px;border-radius:14px;background:rgba(13,110,95,.95);color:#f3efe6;font:800 14px Nunito,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s;box-shadow:0 10px 28px rgba(0,0,0,.35)}
      #amal-gr-toast.show{opacity:1}
    `;
    document.head.appendChild(s);
  }

  function renderGallery(host) {
    if (!host) return;
    ensureCss();
    const items = loadGallery();
    if (!items.length) {
      host.innerHTML =
        '<p class="amal-rating-label" style="text-align:center;padding:.5rem">Пока нет рисунков. Хозяин может нарисовать: кнопка «Галерея» или «Нарисовать» сбоку.</p>';
      return;
    }
    host.innerHTML =
      '<div class="amal-gallery-grid">' +
      items
        .map((it) => {
          const likes = likeCount(it.id);
          const liked = didLike(it.id);
          return (
            '<article class="amal-gallery-item">' +
            '<img src="' +
            it.png +
            '" alt="' +
            (it.title || "Рисунок") +
            '" loading="lazy" />' +
            '<div class="amal-gallery-meta"><h3>' +
            (it.title || "Рисунок Amal") +
            "</h3>" +
            '<p>Смотри и оцени 💚</p>' +
            '<div class="amal-gallery-like"><button type="button" class="amal-like' +
            (liked ? " on" : "") +
            '" data-like="' +
            it.id +
            '">' +
            (liked ? "❤️" : "🤍") +
            " " +
            likes +
            "</button></div></div></article>"
          );
        })
        .join("") +
      "</div>";
    host.querySelectorAll(".amal-like").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-like");
        const n = toggleLike(id);
        btn.textContent = (didLike(id) ? "❤️ " : "🤍 ") + n;
        btn.classList.toggle("on", didLike(id));
      });
    });
  }

  function injectCardRatings() {
    ensureCss();
    document.querySelectorAll("a.card[href]").forEach((card) => {
      if (card.querySelector(".amal-rating-row")) return;
      const href = card.getAttribute("href") || "";
      const gid = gameIdFromHref(href);
      if (!gid) return;
      const body = card.querySelector(".card-body");
      if (!body) return;
      const st = statsForGame(gid);
      const mine = myVote(gid);
      const row = document.createElement("div");
      row.className = "amal-rating-row";
      row.setAttribute("data-game-id", gid);
      const avgTxt = st.count ? st.avg.toFixed(1) : "—";
      row.innerHTML =
        starsHtml(st.avg, true, gid) +
        '<span class="amal-rating-label">' +
        avgTxt +
        "</span>" +
        '<span class="amal-rating-count">(' +
        st.count +
        ")</span>" +
        (isOwner() ? '<button type="button" class="amal-rating-owner" data-admin-rating="' + gid + '">✏️ оценки</button>' : "");
      body.appendChild(row);
      row.addEventListener("click", (e) => {
        if (e.target.closest(".amal-star, .amal-rating-owner, .amal-rating-row")) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
      if (mine && typeof mine.ownerStars === "number" && mine.ownerStars !== mine.stars) {
        const note = document.createElement("span");
        note.className = "amal-rating-count";
        note.textContent = "автор поставил " + mine.ownerStars + " (было " + mine.stars + ")";
        body.appendChild(note);
      }
    });
    if (!starClickBound) {
      starClickBound = true;
      document.addEventListener("click", onStarClick, true);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const p = document.getElementById("amal-rating-panel");
          if (p) p.remove();
        }
      });
    }
  }

  function onStarClick(e) {
    const star = e.target.closest(".amal-star.pick");
    if (star) {
      e.preventDefault();
      e.stopPropagation();
      const gid = star.getAttribute("data-game") || (star.closest("[data-game-id]") && star.closest("[data-game-id]").getAttribute("data-game-id"));
      if (!gid) return;
      const s = parseInt(star.getAttribute("data-star"), 10);
      rateGame(gid, s);
      refreshCard(gid);
      toast("Спасибо! Ты поставил " + s + " ★");
      return;
    }
    const admin = e.target.closest("[data-admin-rating]");
    if (admin && isOwner()) {
      e.preventDefault();
      e.stopPropagation();
      openOwnerPanel(admin.getAttribute("data-admin-rating"));
    }
  }

  function refreshCard(gid) {
    const row = document.querySelector('.amal-rating-row[data-game-id="' + gid + '"]');
    if (!row) return;
    const st = statsForGame(gid);
    const avgTxt = st.count ? st.avg.toFixed(1) : "—";
    row.innerHTML =
      starsHtml(st.avg, true, gid) +
      '<span class="amal-rating-label">' +
      avgTxt +
      "</span>" +
      '<span class="amal-rating-count">(' +
      st.count +
      ")</span>" +
      (isOwner() ? '<button type="button" class="amal-rating-owner" data-admin-rating="' + gid + '">✏️ оценки</button>' : "");
  }

  function openOwnerPanel(gameId) {
    ensureCss();
    const sov = document.getElementById("amal-throne-sovereign");
    if (sov) sov.classList.remove("on");
    const old = document.getElementById("amal-rating-panel");
    if (old) old.remove();
    const st = statsForGame(gameId);
    const title =
      (document.querySelector('a.card[href="' + gameId + '/"] h2') ||
        document.querySelector('a.card[href*="' + gameId + '"] h2'))?.textContent || gameId;
    const el = document.createElement("div");
    el.id = "amal-rating-panel";
    el.className = "amal-rating-panel";
    const votesHtml = st.votes.length
      ? st.votes
          .map((v) => {
            const eff = effectiveStars(v);
            const changed = typeof v.ownerStars === "number" && v.ownerStars !== v.stars;
            return (
              '<div class="amal-rating-vote" data-vote="' +
              v.id +
              '"><b>' +
              v.nick +
              "</b>" +
              (changed
                ? '<span class="was">было ' + v.stars + " → сейчас " + eff + "</span>"
                : '<span class="was">' + v.stars + "/5</span>") +
              '<span class="edit">' +
              [1, 2, 3, 4, 5]
                .map(
                  (n) =>
                    '<button type="button" class="' +
                    (eff === n ? "cur" : "") +
                    '" data-set="' +
                    n +
                    '">' +
                    n +
                    "</button>"
                )
                .join("") +
              "</span></div>"
            );
          })
          .join("")
      : "<p class='was'>Пока никто не оценил.</p>";
    el.innerHTML =
      '<div class="amal-rating-box" role="dialog">' +
      "<h3>✏️ Оценки · " +
      title +
      "</h3>" +
      "<p class='was'>Можешь поменять чужую оценку: поставил 5 — отправь 3.</p>" +
      votesHtml +
      '<button type="button" class="amal-rating-close">Закрыть</button></div>';
    el.addEventListener("click", (ev) => {
      if (ev.target === el || ev.target.classList.contains("amal-rating-close")) {
        ev.preventDefault();
        ev.stopPropagation();
        el.remove();
        return;
      }
      const set = ev.target.closest("[data-set]");
      if (set) {
        const voteEl = set.closest("[data-vote]");
        const vid = voteEl?.getAttribute("data-vote");
        if (vid) {
          ownerSetVoteStars(vid, parseInt(set.getAttribute("data-set"), 10));
          openOwnerPanel(gameId);
          refreshCard(gameId);
        }
      }
    });
    document.body.appendChild(el);
  }

  function mount() {
    const gal = document.getElementById("amal-gallery-grid");
    if (gal) renderGallery(gal);
    injectCardRatings();
    const glink = document.getElementById("galleryLink");
    const glinkTop = document.getElementById("galleryLinkTop");
    if (glink && isOwner()) {
      glink.hidden = false;
      glink.style.display = "";
    }
    if (glinkTop && isOwner()) {
      glinkTop.hidden = false;
      glinkTop.style.display = "";
    }
  }

  if (BC) {
    BC.onmessage = (ev) => {
      if (ev.data && ev.data.type === "sync") mount();
    };
  }

  window.AmalGalleryRatings = {
    loadGallery,
    saveGalleryItem,
    deleteGalleryItem,
    rateGame,
    statsForGame,
    ownerSetVoteStars,
    toggleLike,
    isOwner,
    mount,
    renderGallery,
  };

  const boot = () => {
    mount();
    if (window.AmalHub) return;
    setTimeout(mount, 400);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
