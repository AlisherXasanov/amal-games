(() => {
  "use strict";

  const VW = 960;
  const VH = 500;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const play = document.getElementById("play");
  const bubble = document.getElementById("bubble");
  const scoreEl = document.getElementById("score");
  const samplesEl = document.getElementById("samples");
  const logEl = document.getElementById("log");
  const resultEl = document.getElementById("result");
  const resultKicker = document.getElementById("resultKicker");
  const resultIcon = document.getElementById("resultIcon");
  const resultTitle = document.getElementById("resultTitle");
  const resultGot = document.getElementById("resultGot");
  const resultBody = document.getElementById("resultBody");
  const resultPts = document.getElementById("resultPts");

  const CATALOG = [
    { id: "fur", name: "Шерсть", icon: "🧶", color: "#d4a060", fact: "Мягкая. Пахнет парком." },
    { id: "leaf", name: "Лист", icon: "🍃", color: "#6aaa3a", fact: "Живой хлорофилл. Шепчет." },
    { id: "goo", name: "Слизь", icon: "🟢", color: "#40c060", fact: "Тянется. Не еда." },
    { id: "crystal", name: "Кристалл", icon: "💎", color: "#70c8f0", fact: "Светится в темноте." },
    { id: "butter", name: "Buttersquish", icon: "🧈", color: "#f5e06a", fact: "Медленный rise. Не Irish." },
    { id: "pelmen", name: "Пельмень", icon: "🥟", color: "#e8d8c0", fact: "Тёплый. Редкий — блестит." },
    { id: "feather", name: "Перо", icon: "🪶", color: "#c8b8e8", fact: "Лёгкое. Почти летает." },
    { id: "sand", name: "Песок", icon: "⌛", color: "#e0c878", fact: "Шуршит как таймер." },
    { id: "spark", name: "Искра", icon: "✨", color: "#f0b429", fact: "Короткая вспышка радости." },
    { id: "bone", name: "Кость", icon: "🦴", color: "#f0e8d8", fact: "Старая. Добрая история." },
    { id: "ink", name: "Чернила", icon: "🖋️", color: "#304858", fact: "Пишут открытия." },
    { id: "cloud", name: "Облако", icon: "☁️", color: "#e8f0f8", fact: "В банке всё равно пушистое." },
  ];

  const MIXES = {
    "butter+fur": { title: "Мягкий пёс-масло", text: "Buttersquish подтверждён как питомец." },
    "fur+bone": { title: "Друг парка", text: "Пёс готов гулять без шкал голода." },
    "leaf+spark": { title: "Живой сад", text: "Растение сверкает от радости." },
    "pelmen+goo": { title: "Скользкий ужин", text: "Не рекомендуется, но забавно." },
    "crystal+ink": { title: "Светящийся журнал", text: "Записи сами подсвечиваются." },
    "cloud+sand": { title: "Песочный дождь", text: "В лаборатории тихо шумит." },
    "feather+spark": { title: "Искорка-птица", text: "Почти улетела в потолок." },
    "goo+crystal": { title: "Желе-самоцвет", text: "Тянется и сверкает." },
    "butter+spark": { title: "Золотой squish", text: "Slow-rise + фейерверк." },
    "pelmen+fur": { title: "Тёплый друг", text: "Пельмень обнимает шерсть. Наука одобряет." },
  };

  let discoveries = 0;
  let selected = [];
  let log = [];
  let bubbleT = 0;
  let playing = false;
  let last = performance.now();
  let t = 0;
  let studyT = 0;
  let mixFlash = 0;
  let particles = [];
  let tray = [];
  let scopeZoom = 0;
  let audioCtx = null;
  let found = Object.create(null);

  function say(text, sec) {
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleT = sec || 2.6;
  }

  function beep(freq, dur) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 12); i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 200,
        vy: -40 - Math.random() * 160,
        life: 0.4 + Math.random() * 0.5,
        color,
        r: 2 + Math.random() * 4,
      });
    }
  }

  function byId(id) {
    return CATALOG.find((s) => s.id === id);
  }

  function mixKey(a, b) {
    return [a, b].sort().join("+");
  }

  function showResult(opts) {
    resultKicker.textContent = opts.kicker || "Результат";
    resultIcon.textContent = opts.icon || "🔬";
    resultTitle.textContent = opts.title || "—";
    resultGot.textContent = opts.gotLabel || "Ты получил:";
    resultBody.textContent = opts.body || "";
    resultPts.textContent = opts.ptsLabel || "";
    resultEl.hidden = false;
  }

  function hideResult() {
    resultEl.hidden = true;
  }

  function addDiscovery(title, text, pts) {
    const key = title;
    let gained = pts || 1;
    let isNew = false;
    if (!found[key]) {
      found[key] = true;
      isNew = true;
      discoveries += gained;
      log.unshift({ title, text });
      if (log.length > 24) log.pop();
      renderLog();
    } else {
      gained = 1;
      discoveries += 1;
    }
    scoreEl.textContent = "открытий " + discoveries;
    return { isNew, gained, total: discoveries };
  }

  function renderLog() {
    logEl.innerHTML = log
      .map((e) => `<li><strong>${e.title}</strong> — ${e.text}</li>`)
      .join("") || "<li>Пока пусто. Изучи что-нибудь!</li>";
  }

  function renderChips() {
    samplesEl.innerHTML = "";
    tray.forEach((id, idx) => {
      const s = byId(id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      if (selected[0] === id) btn.classList.add("on");
      if (selected[1] === id) btn.classList.add("slot2");
      btn.textContent = `${s.icon} ${s.name}`;
      btn.onclick = () => toggleSelect(id);
      samplesEl.appendChild(btn);
    });
  }

  function toggleSelect(id) {
    const i = selected.indexOf(id);
    if (i >= 0) {
      selected.splice(i, 1);
    } else if (selected.length < 2) {
      selected.push(id);
    } else {
      selected = [selected[1], id];
    }
    renderChips();
    const names = selected.map((x) => byId(x).name).join(" + ");
    if (selected.length) say("Выбрано: " + names, 1.6);
  }

  function refillTray() {
    const pool = CATALOG.slice().sort(() => Math.random() - 0.5);
    tray = pool.slice(0, 6).map((s) => s.id);
    selected = [];
    renderChips();
  }

  function start() {
    discoveries = 0;
    found = Object.create(null);
    log = [];
    scoreEl.textContent = "открытий 0";
    studyT = 0;
    mixFlash = 0;
    particles = [];
    scopeZoom = 0;
    refillTray();
    renderLog();
    playing = true;
    menu.hidden = true;
    play.hidden = false;
    say("Добро пожаловать в лабораторию. Изучаем всё подряд!", 3);
  }

  function showMenu() {
    playing = false;
    menu.hidden = false;
    play.hidden = true;
  }

  function study() {
    if (!selected.length) {
      say("Выбери образец на столе.");
      return;
    }
    const s = byId(selected[0]);
    studyT = 1.6;
    scopeZoom = 1;
    beep(520, 0.08);
    burst(VW * 0.55, VH * 0.45, s.color, 14);
    const r = addDiscovery(s.name, s.fact, 2);
    say(`🔬 Изучено: ${s.name}`, 2);
    showResult({
      kicker: "Результат изучения",
      icon: s.icon,
      title: s.name,
      gotLabel: "Ты получил:",
      body: s.fact + (r.isNew ? " · новое в журнале" : " · уже было, +1 за повтор"),
      ptsLabel: "+" + r.gained + " · всего открытий " + r.total,
    });
  }

  function mix() {
    if (selected.length < 2) {
      say("Для смеси нужны 2 образца.");
      return;
    }
    const a = selected[0];
    const b = selected[1];
    const key = mixKey(a, b);
    const sa = byId(a);
    const sb = byId(b);
    mixFlash = 1;
    studyT = 1.2;
    beep(340, 0.1);
    burst(VW * 0.55, VH * 0.48, sa.color, 10);
    burst(VW * 0.58, VH * 0.42, sb.color, 10);
    const known = MIXES[key];
    const title = known ? known.title : sa.name + " × " + sb.name;
    const text = known ? known.text : "Странная смесь. Наука записывает и улыбается.";
    const r = addDiscovery(title, text, known ? 4 : 2);
    say(`⚗️ Смесь готова: ${title}`, 2.2);
    showResult({
      kicker: "Результат смеси",
      icon: sa.icon + sb.icon,
      title: title,
      gotLabel: "Ты получил:",
      body: text + (r.isNew ? " · новое открытие!" : " · повторная смесь"),
      ptsLabel: "+" + r.gained + " · всего открытий " + r.total,
    });
  }

  function note() {
    if (!selected.length) {
      say("Нечего записывать — выбери образец.");
      return;
    }
    const s = byId(selected[0]);
    const r = addDiscovery("Заметка: " + s.name, "Аккуратно занесено в журнал.", 1);
    beep(460, 0.06);
    say("📓 Записано: " + s.name);
    showResult({
      kicker: "Запись в журнал",
      icon: "📓",
      title: s.name,
      gotLabel: "Ты получил:",
      body: "Заметка про «" + s.name + "» сохранена.",
      ptsLabel: "+" + r.gained + " · всего открытий " + r.total,
    });
  }

  function newSample() {
    const left = CATALOG.filter((s) => !tray.includes(s.id));
    const pick = (left.length ? left : CATALOG)[(Math.random() * (left.length || CATALOG.length)) | 0];
    if (tray.length >= 8) tray.shift();
    tray.push(pick.id);
    renderChips();
    beep(600, 0.05);
    say("🎲 Новый образец на столе");
    burst(120, 120, pick.color, 8);
    showResult({
      kicker: "Новый образец",
      icon: pick.icon,
      title: pick.name,
      gotLabel: "Ты получил на стол:",
      body: pick.fact + " Нажми «Изучить», чтобы узнать подробнее.",
      ptsLabel: "ещё не изучен",
    });
  }

  function drawLab() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#1a2e28");
    g.addColorStop(0.55, "#243a32");
    g.addColorStop(1, "#15241f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // floor tiles
    ctx.fillStyle = "#2a4038";
    ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
    ctx.strokeStyle = "rgba(126,217,184,0.12)";
    for (let x = 0; x < VW; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, VH * 0.72);
      ctx.lineTo(x, VH);
      ctx.stroke();
    }

    // back shelves
    ctx.fillStyle = "#314840";
    ctx.fillRect(40, 60, 260, 200);
    ctx.fillStyle = "#1e322c";
    for (let i = 0; i < 3; i++) ctx.fillRect(55, 90 + i * 50, 230, 10);
    const shelfColors = ["#e25a3c", "#70c8f0", "#f0b429", "#7ed9b8", "#c8b8e8"];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = shelfColors[i];
      ctx.beginPath();
      ctx.roundRect?.(70 + i * 42, 108, 18, 28, 4);
      if (!ctx.roundRect) {
        ctx.fillRect(70 + i * 42, 108, 18, 28);
      } else ctx.fill();
      ctx.fillStyle = shelfColors[(i + 2) % 5];
      ctx.fillRect(70 + i * 42, 158, 18, 28);
    }

    // window / glow
    ctx.fillStyle = "#3a6a58";
    ctx.fillRect(VW - 220, 50, 160, 110);
    ctx.fillStyle = "rgba(126,217,184,0.35)";
    ctx.fillRect(VW - 210, 60, 140, 90);
    ctx.fillStyle = "#f0b429";
    ctx.beginPath();
    ctx.arc(VW - 140, 100, 18, 0, Math.PI * 2);
    ctx.fill();

    // bench
    ctx.fillStyle = "#3d554c";
    ctx.fillRect(280, VH * 0.58, 520, 28);
    ctx.fillStyle = "#2a3e36";
    ctx.fillRect(300, VH * 0.58 + 28, 20, 70);
    ctx.fillRect(760, VH * 0.58 + 28, 20, 70);

    // microscope
    const mx = VW * 0.55;
    const my = VH * 0.48;
    ctx.fillStyle = "#5a7068";
    ctx.fillRect(mx - 18, my + 10, 36, 50);
    ctx.fillStyle = "#7a9088";
    ctx.beginPath();
    ctx.arc(mx, my, 34 + scopeZoom * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#102018";
    ctx.beginPath();
    ctx.arc(mx, my, 18 + scopeZoom * 4, 0, Math.PI * 2);
    ctx.fill();
    if (selected[0]) {
      const s = byId(selected[0]);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(mx, my, 10 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "16px serif";
      ctx.textAlign = "center";
      ctx.fillText(s.icon, mx, my + 5);
    }

    // beaker
    const bx = VW * 0.72;
    const by = VH * 0.5;
    ctx.strokeStyle = "rgba(200,230,220,0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 22, by - 40);
    ctx.lineTo(bx - 28, by + 40);
    ctx.lineTo(bx + 28, by + 40);
    ctx.lineTo(bx + 22, by - 40);
    ctx.stroke();
    if (mixFlash > 0 || selected.length === 2) {
      const ca = selected[0] ? byId(selected[0]).color : "#7ed9b8";
      const cb = selected[1] ? byId(selected[1]).color : "#f0b429";
      ctx.fillStyle = mixFlash > 0.5 ? cb : ca;
      ctx.globalAlpha = 0.55 + mixFlash * 0.35;
      ctx.fillRect(bx - 24, by + 8 - mixFlash * 20, 48, 30 + mixFlash * 18);
      ctx.globalAlpha = 1;
    }

    // tray samples on bench
    tray.forEach((id, i) => {
      const s = byId(id);
      const x = 320 + i * 55;
      const y = VH * 0.58 - 8;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.fillText(s.icon, x, y + 5);
      if (selected.includes(id)) {
        ctx.strokeStyle = selected[0] === id ? "#f0b429" : "#e25a3c";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // scientist
    const sx = 160;
    const sy = VH * 0.62;
    ctx.fillStyle = "#f0d0b0";
    ctx.beginPath();
    ctx.arc(sx, sy - 50, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3efe6";
    ctx.fillRect(sx - 16, sy - 36, 32, 40);
    ctx.fillStyle = "#0d6e5f";
    ctx.fillRect(sx - 18, sy - 20, 36, 8);
    ctx.fillStyle = "#f3efe6";
    ctx.font = "700 12px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ты", sx, sy - 70);

    ctx.fillStyle = "#7ed9b8";
    ctx.font = "700 14px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Лаборатория · изучаем всё", 24, 32);

    if (studyT > 0) {
      ctx.fillStyle = `rgba(126,217,184,${studyT * 0.2})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function draw() {
    drawLab();
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(dt) {
    if (studyT > 0) studyT -= dt;
    if (mixFlash > 0) mixFlash -= dt;
    scopeZoom = Math.max(0, scopeZoom - dt * 0.8);
    for (const p of particles) {
      p.life -= dt;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (playing) {
      tick(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      this.moveTo(x + rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.arcTo(x, y + h, x, y, rr);
      this.arcTo(x, y, x + w, y, rr);
      this.closePath();
      return this;
    };
  }

  document.getElementById("btnStart").onclick = start;
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnStudy").onclick = study;
  document.getElementById("btnMix").onclick = mix;
  document.getElementById("btnNote").onclick = note;
  document.getElementById("btnNew").onclick = newSample;
  document.getElementById("btnResultOk").onclick = hideResult;
  resultEl.addEventListener("click", (e) => {
    if (e.target === resultEl) hideResult();
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (!playing) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * VW;
    const y = ((e.clientY - r.top) / r.height) * VH;
    tray.forEach((id, i) => {
      const sx = 320 + i * 55;
      const sy = VH * 0.58 - 8;
      if (Math.hypot(x - sx, y - sy) < 22) toggleSelect(id);
    });
  });

  requestAnimationFrame(frame);
})();
