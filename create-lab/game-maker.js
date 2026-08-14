(() => {
  const nameEl = document.getElementById("game-name");
  const promptEl = document.getElementById("game-prompt");
  const kindEl = document.getElementById("game-kind");
  const colorEl = document.getElementById("game-color");
  const playBtn = document.getElementById("btn-play");
  const savedList = document.getElementById("saved-list");
  const preview = document.getElementById("gamePreview");
  const caption = document.getElementById("preview-caption");
  const pctx = preview.getContext("2d");

  let lastId = null;
  let t0 = performance.now();

  const KIND_NAMES = {
    playground: "площадка",
    catch: "ловилка",
    snake: "змейка",
    jump: "прыжки",
    race: "гонка",
  };

  function kindLabel(k) {
    return KIND_NAMES[k] || k;
  }

  function guessFromText(text) {
    const t = (text || "").toLowerCase();
    let kind = "playground";
    if (/площадк|playground|песочниц|sandbox|дыня|melon|кидай|фигур|физик/.test(t)) kind = "playground";
    else if (/змей|snake|яблок/.test(t)) kind = "snake";
    else if (/прыг|платформ|jump/.test(t)) kind = "jump";
    else if (/гонка|машин|race|багги/.test(t)) kind = "race";
    else if (/лови|падающ|кубик|шар лови|catch/.test(t)) kind = "catch";
    else if (/сделай|создай|хочу|игр/.test(t) && !/змей|прыг|гонка|лови/.test(t)) kind = "playground";

    let color = "#0d6e5f";
    if (/зелён|зелен|green/.test(t)) color = "#12a374";
    else if (/син|blue/.test(t)) color = "#2563eb";
    else if (/красн|red/.test(t)) color = "#dc2626";
    else if (/жёлт|желт|yellow/.test(t)) color = "#ca8a04";
    else if (/оранж/.test(t)) color = "#ea580c";
    else if (/фиолет/.test(t)) color = "#7c3aed";

    let name = text
      .replace(/^(сделай|создай|хочу|пожалуйста|make|create)[,\s]+/i, "")
      .trim();
    if (name.length > 42) name = name.slice(0, 42) + "…";
    if (!name) {
      name = {
        playground: "Маленькая площадка",
        snake: "Змейка",
        jump: "Прыжки",
        race: "Гонка",
        catch: "Ловилка",
      }[kind];
    }
    return { kind, color, name, prompt: text.trim() };
  }

  function applyDraft(draft) {
    if (!draft) return;
    if (draft.prompt) promptEl.value = draft.prompt;
    if (draft.kind) kindEl.value = draft.kind;
    if (draft.color) colorEl.value = draft.color;
    if (draft.name) nameEl.value = draft.name;
    else if (draft.prompt) nameEl.value = guessFromText(draft.prompt).name;
    updateCaption();
  }

  function updateCaption() {
    if (!caption) return;
    const k = kindEl.value;
    const tips = {
      playground: "Превью: площадка — кидаешь шары и кубы (не ловилка!)",
      catch: "Превью: ловилка — шар внизу ловит падающие кубики",
      snake: "Превью: змейка",
      jump: "Превью: прыжки по платформам",
      race: "Превью: гонка",
    };
    caption.textContent = tips[k] || `Превью: ${kindLabel(k)}`;
  }

  try {
    const draft = JSON.parse(sessionStorage.getItem("create-lab-draft") || "null");
    if (draft) {
      applyDraft(draft);
      sessionStorage.removeItem("create-lab-draft");
    }
  } catch (_) {}

  function drawPreview() {
    const kind = kindEl.value;
    const color = colorEl.value;
    const t = (performance.now() - t0) / 1000;
    const w = preview.width;
    const h = preview.height;
    pctx.fillStyle = "#10241f";
    pctx.fillRect(0, 0, w, h);

    if (kind === "playground") {
      pctx.fillStyle = "#2a4038";
      pctx.fillRect(0, h - 28, w, 28);
      const items = [
        { x: 70, y: h - 70 - Math.abs(Math.sin(t * 2)) * 20, r: 16, round: true },
        { x: 150, y: h - 90, s: 28, round: false },
        { x: 220, y: h - 60 - Math.abs(Math.cos(t * 1.7)) * 30, r: 14, round: true },
        { x: 270, y: h - 100, s: 22, round: false },
      ];
      items.forEach((it, i) => {
        pctx.fillStyle = i % 2 ? color : "#e25a3c";
        if (it.round) {
          pctx.beginPath();
          pctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
          pctx.fill();
        } else {
          pctx.fillRect(it.x, it.y, it.s, it.s);
        }
      });
    } else if (kind === "snake") {
      pctx.fillStyle = color;
      for (let i = 0; i < 6; i++) {
        const x = 40 + i * 22 + Math.sin(t * 3 + i) * 4;
        const y = h / 2 + Math.cos(t * 2 + i) * 18;
        pctx.fillRect(x, y, 18, 18);
      }
      pctx.fillStyle = "#e25a3c";
      pctx.beginPath();
      pctx.arc(w - 50, h / 2, 10, 0, Math.PI * 2);
      pctx.fill();
    } else if (kind === "jump") {
      pctx.fillStyle = "#3d524a";
      pctx.fillRect(0, h - 40, w, 40);
      pctx.fillRect(120, h - 90, 70, 14);
      pctx.fillRect(220, h - 140, 70, 14);
      const y = h - 70 - Math.abs(Math.sin(t * 4)) * 70;
      pctx.fillStyle = color;
      pctx.fillRect(60, y, 28, 28);
    } else if (kind === "race") {
      pctx.fillStyle = "#2a3531";
      pctx.fillRect(0, h * 0.35, w, h * 0.3);
      pctx.strokeStyle = "#f0b429";
      pctx.setLineDash([12, 10]);
      pctx.beginPath();
      pctx.moveTo(0, h / 2);
      pctx.lineTo(w, h / 2);
      pctx.stroke();
      pctx.setLineDash([]);
      const x = ((t * 120) % (w + 40)) - 20;
      pctx.fillStyle = color;
      pctx.fillRect(x, h / 2 - 18, 40, 22);
    } else {
      // catch
      pctx.fillStyle = color;
      const px = w / 2 + Math.sin(t * 2) * 40;
      const py = h - 50;
      pctx.beginPath();
      pctx.arc(px, py, 16, 0, Math.PI * 2);
      pctx.fill();
      pctx.fillStyle = "#f0b429";
      const fy = 30 + ((t * 80) % (h - 60));
      pctx.fillRect(w / 2 - 10, fy, 20, 20);
    }

    requestAnimationFrame(drawPreview);
  }

  drawPreview();
  updateCaption();
  kindEl.addEventListener("change", () => {
    t0 = performance.now();
    updateCaption();
  });

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function renderSaved() {
    const list = CreateLabStore.listGames();
    savedList.innerHTML = list.length
      ? list.map((g) => `
          <div class="list-item">
            <div>
              <h4>${escapeHtml(g.name)}</h4>
              <p>${escapeHtml(kindLabel(g.kind))}</p>
            </div>
            <div class="toolbar">
              <a class="btn primary" href="./play.html?id=${encodeURIComponent(g.id)}">▶</a>
              <button type="button" class="btn ghost" data-del="${g.id}">✕</button>
            </div>
          </div>
        `).join("")
      : '<p class="empty">Ещё нет игр.</p>';

    savedList.querySelectorAll("[data-del]").forEach((btn) => {
      btn.onclick = () => {
        CreateLabStore.deleteGame(btn.dataset.del);
        renderSaved();
      };
    });
  }

  const ai = Ushastik.create({
    autoNavigate: false,
    onCommand() {},
  });

  function launchNow(text) {
    const made = CreateLabStore.makeGameFromIdea(text);
    if (!made) return;

    if (made.href) {
      const log = document.getElementById("chat-log");
      if (log) {
        const u = document.createElement("div");
        u.className = "bubble user";
        u.textContent = text;
        log.appendChild(u);
      }
      ai.say(`Открываю «${made.name}»!`);
      setTimeout(() => { location.href = made.href; }, 700);
      return;
    }

    applyDraft({
      prompt: made.prompt,
      kind: made.kind,
      color: made.color,
      name: made.name,
    });
    if (kindEl.querySelector(`option[value="${made.kind}"]`)) kindEl.value = made.kind;
    updateCaption();
    lastId = made.game.id;
    playBtn.hidden = false;
    playBtn.href = `./play.html?id=${encodeURIComponent(made.game.id)}`;
    renderSaved();
    const log = document.getElementById("chat-log");
    if (log) {
      const u = document.createElement("div");
      u.className = "bubble user";
      u.textContent = text;
      log.appendChild(u);
    }
    ai.say(`Включаю «${made.kindRu}»!`);
    setTimeout(() => {
      location.href = `./play.html?id=${encodeURIComponent(made.game.id)}`;
    }, 700);
  }

  ai.handleTranscript = (text) => {
    launchNow(text);
  };

  document.getElementById("btn-create").onclick = () => {
    const text = promptEl.value.trim() || nameEl.value.trim() || "маленькая площадка";
    launchNow(text);
  };

  renderSaved();
  ai.say("Напиши или скажи идею — покажу текстом. Голос: кнопка «Поздороваться» или микрофон (если включишь 🔊).");

  const textForm = document.getElementById("text-form");
  if (textForm) {
    textForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("text-input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      launchNow(text);
    });
  }
})();