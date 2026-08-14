(() => {
  const W = 480;
  const H = 360;
  const stage = document.getElementById("stage");
  const ctx = stage.getContext("2d");
  const framesEl = document.getElementById("frames");
  const colorEl = document.getElementById("color");
  const sizeEl = document.getElementById("size");
  const sizeLabel = document.getElementById("size-label");
  const onionEl = document.getElementById("onion");
  const nameEl = document.getElementById("anim-name");
  const fpsEl = document.getElementById("fps");
  const savedList = document.getElementById("saved-list");

  let tool = "pen";
  let drawing = false;
  let animId = new URLSearchParams(location.search).get("id") || CreateLabStore.uid("anim");
  let frames = [blankFrame()];
  let current = 0;
  let playing = false;
  let playTimer = null;
  let lastX = 0;
  let lastY = 0;

  function blankFrame() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    g.clearRect(0, 0, W, H);
    return c;
  }

  function cloneFrame(src) {
    const c = blankFrame();
    c.getContext("2d").drawImage(src, 0, 0);
    return c;
  }

  function pos(e) {
    const r = stage.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: ((src.clientX - r.left) / r.width) * W,
      y: ((src.clientY - r.top) / r.height) * H,
    };
  }

  function redraw() {
    ctx.clearRect(0, 0, W, H);
    if (onionEl.checked && current > 0 && !playing) {
      ctx.globalAlpha = 0.28;
      ctx.drawImage(frames[current - 1], 0, 0);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(frames[current], 0, 0);
    renderThumbs();
  }

  function renderThumbs() {
    framesEl.innerHTML = "";
    frames.forEach((f, i) => {
      const wrap = document.createElement("button");
      wrap.type = "button";
      wrap.className = "frame-thumb" + (i === current ? " is-active" : "");
      const mini = document.createElement("canvas");
      mini.width = 72;
      mini.height = 54;
      const mctx = mini.getContext("2d");
      mctx.fillStyle = "#f7f3ea";
      mctx.fillRect(0, 0, 72, 54);
      mctx.drawImage(f, 0, 0, 72, 54);
      wrap.appendChild(mini);
      const label = document.createElement("span");
      label.textContent = String(i + 1);
      wrap.appendChild(label);
      wrap.addEventListener("click", () => {
        stopPlay();
        current = i;
        redraw();
      });
      framesEl.appendChild(wrap);
    });
  }

  function stroke(x0, y0, x1, y1) {
    const g = frames[current].getContext("2d");
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = Number(sizeEl.value);
    if (tool === "eraser") {
      g.globalCompositeOperation = "destination-out";
      g.strokeStyle = "rgba(0,0,0,1)";
    } else {
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = colorEl.value;
    }
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    g.globalCompositeOperation = "source-over";
  }

  function floodFill(x, y) {
    const g = frames[current].getContext("2d");
    const img = g.getImageData(0, 0, W, H);
    const data = img.data;
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
    const start = (sy * W + sx) * 4;
    const tr = data[start];
    const tg = data[start + 1];
    const tb = data[start + 2];
    const ta = data[start + 3];
    const hex = colorEl.value;
    const fr = parseInt(hex.slice(1, 3), 16);
    const fg = parseInt(hex.slice(3, 5), 16);
    const fb = parseInt(hex.slice(5, 7), 16);
    if (tr === fr && tg === fg && tb === fb && ta === 255) return;

    const stack = [[sx, sy]];
    const seen = new Uint8Array(W * H);
    const match = (i) =>
      data[i] === tr && data[i + 1] === tg && data[i + 2] === tb && data[i + 3] === ta;

    while (stack.length) {
      const [cx, cy] = stack.pop();
      const idx = cy * W + cx;
      if (seen[idx]) continue;
      seen[idx] = 1;
      const i = idx * 4;
      if (!match(i)) continue;
      data[i] = fr;
      data[i + 1] = fg;
      data[i + 2] = fb;
      data[i + 3] = 255;
      if (cx > 0) stack.push([cx - 1, cy]);
      if (cx < W - 1) stack.push([cx + 1, cy]);
      if (cy > 0) stack.push([cx, cy - 1]);
      if (cy < H - 1) stack.push([cx, cy + 1]);
    }
    g.putImageData(img, 0, 0);
  }

  function onDown(e) {
    e.preventDefault();
    stopPlay();
    const p = pos(e);
    drawing = true;
    lastX = p.x;
    lastY = p.y;
    if (tool === "fill") {
      floodFill(p.x, p.y);
      redraw();
      drawing = false;
      return;
    }
    stroke(p.x, p.y, p.x + 0.01, p.y + 0.01);
    redraw();
  }

  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    stroke(lastX, lastY, p.x, p.y);
    lastX = p.x;
    lastY = p.y;
    redraw();
  }

  function onUp() {
    drawing = false;
  }

  stage.addEventListener("mousedown", onDown);
  stage.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  stage.addEventListener("touchstart", onDown, { passive: false });
  stage.addEventListener("touchmove", onMove, { passive: false });
  stage.addEventListener("touchend", onUp);

  document.querySelectorAll("[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tool = btn.dataset.tool;
      document.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("is-on", b === btn));
    });
  });

  sizeEl.addEventListener("input", () => {
    sizeLabel.textContent = sizeEl.value;
  });
  onionEl.addEventListener("change", redraw);

  document.getElementById("btn-add").onclick = () => {
    frames.splice(current + 1, 0, blankFrame());
    current += 1;
    redraw();
    ai.say("Новый кадр готов. Рисуй дальше!");
  };

  document.getElementById("btn-dup").onclick = () => {
    frames.splice(current + 1, 0, cloneFrame(frames[current]));
    current += 1;
    redraw();
  };

  document.getElementById("btn-del").onclick = () => {
    if (frames.length === 1) {
      frames[0] = blankFrame();
    } else {
      frames.splice(current, 1);
      current = Math.max(0, current - 1);
    }
    redraw();
  };

  document.getElementById("btn-clear").onclick = () => {
    frames[current] = blankFrame();
    redraw();
  };

  function stopPlay() {
    playing = false;
    clearInterval(playTimer);
    playTimer = null;
    document.getElementById("btn-play").textContent = "▶ Плей";
    redraw();
  }

  function startPlay() {
    if (playing) {
      stopPlay();
      return;
    }
    playing = true;
    document.getElementById("btn-play").textContent = "■ Стоп";
    const fps = Math.max(1, Math.min(24, Number(fpsEl.value) || 8));
    playTimer = setInterval(() => {
      current = (current + 1) % frames.length;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(frames[current], 0, 0);
      renderThumbs();
    }, 1000 / fps);
  }

  document.getElementById("btn-play").onclick = startPlay;

  function exportPayload() {
    return {
      id: animId,
      name: nameEl.value.trim() || "Без названия",
      fps: Math.max(1, Math.min(24, Number(fpsEl.value) || 8)),
      updatedAt: Date.now(),
      frames: frames.map((f) => f.toDataURL("image/png")),
    };
  }

  function loadPayload(data) {
    if (!data) return;
    animId = data.id || animId;
    nameEl.value = data.name || "Моя анимация";
    fpsEl.value = data.fps || 8;
    frames = (data.frames || []).map((src) => {
      const c = blankFrame();
      const img = new Image();
      // Synchronous-ish: draw after load via Promise chain below
      c._src = src;
      return c;
    });
    if (!frames.length) frames = [blankFrame()];
    let left = frames.length;
    frames.forEach((c) => {
      const img = new Image();
      img.onload = () => {
        c.getContext("2d").drawImage(img, 0, 0);
        left -= 1;
        if (left === 0) {
          current = 0;
          redraw();
        }
      };
      img.src = c._src;
    });
  }

  document.getElementById("btn-save").onclick = () => {
    const payload = exportPayload();
    CreateLabStore.upsertAnim(payload);
    renderSaved();
    ai.say(`Сохранил анимацию «${payload.name}».`);
  };

  function renderSaved() {
    const list = CreateLabStore.listAnims();
    savedList.innerHTML = list.length
      ? list.map((a) => `
          <div class="list-item">
            <div>
              <h4>${escapeHtml(a.name)}</h4>
              <p>${a.frames?.length || 0} кадров</p>
            </div>
            <div class="toolbar">
              <button type="button" class="btn" data-load="${a.id}">Откр.</button>
              <button type="button" class="btn ghost" data-del="${a.id}">✕</button>
            </div>
          </div>
        `).join("")
      : '<p class="empty">Пока нет сохранений.</p>';

    savedList.querySelectorAll("[data-load]").forEach((btn) => {
      btn.onclick = () => {
        const a = CreateLabStore.getAnim(btn.dataset.load);
        if (a) loadPayload(a);
      };
    });
    savedList.querySelectorAll("[data-del]").forEach((btn) => {
      btn.onclick = () => {
        CreateLabStore.deleteAnim(btn.dataset.del);
        renderSaved();
      };
    });
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  const ai = Ushastik.create({
    autoNavigate: false,
    onCommand(result) {
      const t = (result.reply || "").toLowerCase();
      // Also interpret from last user intent via draft types
      if (result.type === "anim" || /кадр|анимац/.test(t)) {
        /* stay */
      }
    },
  });

  // Voice shortcuts for animator
  const rawHandle = ai.handleTranscript.bind(ai);
  ai.handleTranscript = (text) => {
    const low = text.toLowerCase();
    if (/новый кадр|добавь кадр/.test(low)) {
      document.getElementById("btn-add").click();
      return;
    }
    if (/играй|плей|воспроиз/.test(low)) {
      if (!playing) startPlay();
      ai.say("Кручу анимацию!");
      return;
    }
    if (/стоп|останови/.test(low)) {
      stopPlay();
      ai.say("Остановил.");
      return;
    }
    if (/сохрани/.test(low)) {
      document.getElementById("btn-save").click();
      return;
    }
    if (/очисти/.test(low)) {
      document.getElementById("btn-clear").click();
      ai.say("Кадр чистый.");
      return;
    }
    rawHandle(text);
  };

  const existing = CreateLabStore.getAnim(animId);
  if (existing) loadPayload(existing);
  else redraw();
  renderSaved();

  const textForm = document.getElementById("text-form");
  if (textForm) {
    textForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("text-input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      ai.handleTranscript(text);
    });
  }
})();
