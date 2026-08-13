(() => {
  "use strict";

  const VW = 960;
  const VH = 440;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const cChoice = document.getElementById("cChoice");
  const ctxC = cChoice.getContext("2d");

  const menu = document.getElementById("menu");
  const choice = document.getElementById("choice");
  const play = document.getElementById("play");
  const end = document.getElementById("end");
  const bubble = document.getElementById("bubble");
  const stats = document.getElementById("stats");
  const actions = document.getElementById("actions");
  const placeLabel = document.getElementById("placeLabel");
  const loveEl = document.getElementById("love");
  const endBrand = document.getElementById("endBrand");
  const endText = document.getElementById("endText");
  const endCode = document.getElementById("endCode");

  // adopted = took home; street = left outside but still must care
  let path = null;
  let love = 0;
  let day = 1;
  let dayT = 0;
  let bubbleT = 0;
  let playing = false;
  let done = false;
  let last = performance.now();
  let t = 0;
  let particles = [];
  let audioCtx = null;
  let mollySaid = false;

  const dog = {
    x: VW * 0.45,
    y: VH * 0.62,
    hunger: 35,
    clean: 25,
    happy: 20,
    warmth: 30,
    trust: 15,
    bob: 0,
    anim: 0,
    effect: null,
    shiver: 1,
  };

  const HOME_ACTS = [
    { id: "feed", label: "🍖 Кормить" },
    { id: "wash", label: "🛁 Мыть" },
    { id: "pet", label: "🤚 Гладить" },
    { id: "bed", label: "🛏 Лежанка" },
    { id: "play", label: "🎾 Играть" },
    { id: "molly", label: "💬 Молли" },
  ];

  const STREET_ACTS = [
    { id: "feed", label: "🍖 Еда с улицы" },
    { id: "blanket", label: "🧥 Плед" },
    { id: "pet", label: "🤚 Подойти" },
    { id: "box", label: "📦 Коробка" },
    { id: "vet", label: "💊 Помочь" },
    { id: "molly", label: "💬 Молли" },
  ];

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
      g.gain.value = 0.1;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function clamp(v) {
    return Math.max(0, Math.min(100, v));
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 10); i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: -40 - Math.random() * 120,
        life: 0.4 + Math.random() * 0.5,
        color,
        r: 3 + Math.random() * 3,
      });
    }
  }

  function avgCare() {
    return (dog.hunger + dog.clean + dog.happy + dog.warmth + dog.trust) / 5;
  }

  function showMenu() {
    playing = false;
    done = false;
    path = null;
    menu.hidden = false;
    choice.hidden = true;
    play.hidden = true;
    end.hidden = true;
    bubble.hidden = true;
  }

  function showChoice() {
    menu.hidden = true;
    choice.hidden = false;
    play.hidden = true;
    end.hidden = true;
    drawChoicePreview();
    say("Молли: «Его зовут Butterscotch… Он один.»", 3.5);
  }

  function resetDog(street) {
    Object.assign(dog, {
      hunger: street ? 30 : 55,
      clean: street ? 20 : 60,
      happy: street ? 18 : 50,
      warmth: street ? 25 : 70,
      trust: street ? 12 : 40,
      bob: 0,
      anim: 0,
      effect: null,
      shiver: street ? 1 : 0.2,
      x: VW * 0.45,
      y: path === "home" ? VH * 0.64 : VH * 0.66,
    });
    love = 0;
    day = 1;
    dayT = 0;
    particles = [];
    mollySaid = false;
    done = false;
  }

  function beginPath(p) {
    path = p;
    resetDog(p === "street");
    choice.hidden = true;
    play.hidden = false;
    playing = true;
    loveEl.textContent = "❤ 0";
    placeLabel.textContent = p === "home" ? "🏠 Дом · Butterscotch" : "🌧 Улица · Butterscotch";
    buildActions();
    renderStats();
    if (p === "home") {
      say("Ты взял его домой. Молли улыбнулась. Теперь ухаживай за Butterscotch.", 3.5);
    } else {
      say("Ты не взял его… Но Молли права: на улице о нём всё равно нужно заботиться.", 3.8);
    }
    beep(320, 0.08);
  }

  function buildActions() {
    const list = path === "home" ? HOME_ACTS : STREET_ACTS;
    actions.innerHTML = list
      .map((a) => `<button type="button" class="act" data-act="${a.id}">${a.label}</button>`)
      .join("");
    actions.querySelectorAll(".act").forEach((btn) => {
      btn.onclick = () => doAct(btn.dataset.act);
    });
  }

  function renderStats() {
    const where = path === "home" ? "дома" : "на улице (бездомный)";
    stats.innerHTML = `
      <h3>🐕 Butterscotch · ${where}</h3>
      голод <div class="bar"><i style="width:${dog.hunger}%;background:#ff9040"></i></div>
      чистота <div class="bar"><i style="width:${dog.clean}%;background:#60a0ff"></i></div>
      радость <div class="bar"><i style="width:${dog.happy}%;background:#ff80b0"></i></div>
      тепло <div class="bar"><i style="width:${dog.warmth}%;background:#e8b050"></i></div>
      доверие <div class="bar"><i style="width:${dog.trust}%;background:#90c070"></i></div>
      <span>день ${day} · Молли назвала его Butterscotch</span>`;
  }

  function doAct(act) {
    if (!playing || done) return;

    if (act === "molly") {
      mollySaid = true;
      const lines =
        path === "home"
          ? [
              "Молли: «Butterscotch… Я так его назвала. Спасибо, что взял.»",
              "Молли: «Он раньше дрожал под дождём. Теперь у него дом.»",
              "Молли: «Гладь его медленно. Он учится доверять.»",
            ]
          : [
              "Молли: «Ты не взял его домой… Но еда и плед всё равно важны.»",
              "Молли: «Butterscotch — бездомный. Если не взять — ухаживать всё равно надо.»",
              "Молли: «Я назвала его Butterscotch. Не бросай его совсем.»",
            ];
      say(lines[(Math.random() * lines.length) | 0], 3.5);
      dog.trust = clamp(dog.trust + 6);
      love += 2;
      loveEl.textContent = "❤ " + love;
      beep(400, 0.07);
      renderStats();
      return;
    }

    if (path === "home") {
      if (act === "feed") {
        dog.hunger = clamp(dog.hunger + 28);
        dog.happy = clamp(dog.happy + 10);
        dog.trust = clamp(dog.trust + 4);
        say("Butterscotch ест из миски. Хвост осторожно виляет.", 2.4);
      } else if (act === "wash") {
        dog.clean = clamp(dog.clean + 30);
        dog.happy = clamp(dog.happy + 4);
        say("Тёплый душ. Butterscotch чистый и пахнет домом.", 2.4);
      } else if (act === "pet") {
        dog.happy = clamp(dog.happy + 22);
        dog.trust = clamp(dog.trust + 10);
        say("Ты гладишь его. Он прижимается. Доверие растёт.", 2.4);
      } else if (act === "bed") {
        dog.warmth = clamp(dog.warmth + 28);
        dog.energyBoost = true;
        dog.happy = clamp(dog.happy + 12);
        say("Мягкая лежанка. Butterscotch сворачивается калачиком.", 2.4);
      } else if (act === "play") {
        dog.happy = clamp(dog.happy + 26);
        dog.hunger = clamp(dog.hunger - 8);
        dog.trust = clamp(dog.trust + 6);
        say("Игра дома! Мячик. Butterscotch уже почти не боится.", 2.4);
      }
    } else {
      if (act === "feed") {
        dog.hunger = clamp(dog.hunger + 26);
        dog.trust = clamp(dog.trust + 5);
        dog.happy = clamp(dog.happy + 8);
        say("Ты принёс еду на улицу. Butterscotch ест жадно, но осторожно.", 2.6);
      } else if (act === "blanket") {
        dog.warmth = clamp(dog.warmth + 32);
        dog.shiver = Math.max(0.15, dog.shiver - 0.25);
        dog.happy = clamp(dog.happy + 10);
        say("Плед на мокром асфальте. Ему теплее. Молли кивает.", 2.6);
      } else if (act === "pet") {
        dog.happy = clamp(dog.happy + 16);
        dog.trust = clamp(dog.trust + 12);
        say("Ты медленно садишься рядом. Он даёт себя погладить.", 2.5);
      } else if (act === "box") {
        dog.warmth = clamp(dog.warmth + 22);
        dog.clean = clamp(dog.clean + 8);
        dog.trust = clamp(dog.trust + 4);
        say("Картонная коробка — маленький дом на улице.", 2.5);
      } else if (act === "vet") {
        dog.clean = clamp(dog.clean + 20);
        dog.hunger = clamp(dog.hunger + 10);
        dog.trust = clamp(dog.trust + 8);
        dog.happy = clamp(dog.happy + 8);
        say("Ты обработал лапу и дал воду. Бездомному тоже нужна помощь.", 2.7);
      }
    }

    dog.anim = 0.85;
    dog.effect = act;
    love += 3;
    loveEl.textContent = "❤ " + love;
    burst(dog.x, dog.y - 20, "#e8b070", 10);
    beep(360, 0.06);
    renderStats();
    checkEnd();
  }

  function checkEnd() {
    if (avgCare() >= 85 && dog.trust >= 70 && love >= 35 && day >= 2) {
      finish(true);
    } else if (avgCare() <= 12 && day >= 3) {
      finish(false);
    }
  }

  function finish(ok) {
    if (done) return;
    done = true;
    playing = false;
    play.hidden = true;
    end.hidden = false;
    if (ok) {
      if (path === "home") {
        endBrand.textContent = "✦ Дом для Butterscotch";
        endText.textContent =
          "Ты взял его и заботился. Молли назвала его Butterscotch — и он больше не один.";
      } else {
        endBrand.textContent = "✦ Ты не бросил улицу";
        endText.textContent =
          "Ты не взял его домой, но ухаживал на улице. Butterscotch доверяет. Молли тихо говорит спасибо.";
      }
      endCode.textContent = "BUTTER · ❤ " + love + " · день " + day;
    } else {
      endBrand.textContent = "… Ему плохо";
      endText.textContent =
        "Butterscotch всё ещё бездомный и слабый. Молли смотрит грустно. Попробуй ещё раз.";
      endCode.textContent = "COLD · день " + day;
    }
  }

  function tick(dt) {
    dog.bob += dt * 3;
    if (dog.anim > 0) dog.anim -= dt;
    else dog.effect = null;

    const drain = path === "street" ? 1.35 : 1;
    dog.hunger = clamp(dog.hunger - dt * 1.5 * drain);
    dog.clean = clamp(dog.clean - dt * 1.1 * drain);
    dog.happy = clamp(dog.happy - dt * 1.2 * drain);
    dog.warmth = clamp(dog.warmth - dt * (path === "street" ? 1.8 : 0.9));
    dog.trust = clamp(dog.trust - dt * 0.35);
    dog.shiver = path === "street" ? Math.max(0.2, 1 - dog.warmth / 100) : Math.max(0, 0.35 - dog.warmth / 200);

    dayT += dt;
    if (dayT >= 26) {
      dayT = 0;
      day++;
      say("День " + day + ". Butterscotch ждёт тебя.", 2.2);
      renderStats();
      checkEnd();
    }

    for (const p of particles) {
      p.life -= dt;
      p.vy += 240 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    if (((t * 2) | 0) !== (((t - dt) * 2) | 0)) renderStats();
  }

  function drawDogFigure(c, x, y, scale, shiver) {
    const bob = Math.sin(dog.bob) * 2;
    const sh = Math.sin(t * 18) * shiver * 3;
    c.save();
    c.translate(x + sh, y + bob);
    c.scale(scale, scale);

    c.fillStyle = "rgba(0,0,0,0.18)";
    c.beginPath();
    c.ellipse(0, 22, 40, 9, 0, 0, Math.PI * 2);
    c.fill();

    // butterscotch-colored coat (golden-brown dog)
    c.fillStyle = "#d4a04a";
    c.beginPath();
    c.ellipse(0, 2, 40, 22, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#f0d8a0";
    c.beginPath();
    c.ellipse(-6, 6, 16, 12, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#c88838";
    c.beginPath();
    c.ellipse(-32, -6, 20, 17, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#f5e6c8";
    c.beginPath();
    c.ellipse(-44, -2, 11, 9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#302018";
    c.beginPath();
    c.arc(-50, -2, 3.5, 0, Math.PI * 2);
    c.fill();

    // floppy ears
    c.fillStyle = "#b07030";
    c.beginPath();
    c.ellipse(-38, -22, 8, 14, -0.4, 0, Math.PI * 2);
    c.ellipse(-22, -20, 8, 14, 0.35, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#203040";
    c.beginPath();
    c.arc(-36, -8, 2.8, 0, Math.PI * 2);
    c.arc(-26, -8, 2.8, 0, Math.PI * 2);
    c.fill();

    // thin / street look ribs hint
    if (path === "street" && dog.hunger < 45) {
      c.strokeStyle = "rgba(120, 70, 30, 0.35)";
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-8 + i * 10, -4);
        c.quadraticCurveTo(-4 + i * 10, 8, -8 + i * 10, 14);
        c.stroke();
      }
    }

    c.fillStyle = "#a87838";
    c.fillRect(-26, 16, 12, 14);
    c.fillRect(-8, 16, 12, 14);
    c.fillRect(10, 16, 12, 14);
    c.fillRect(26, 16, 11, 14);

    c.strokeStyle = "#c88838";
    c.lineWidth = 7;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(36, 0);
    c.quadraticCurveTo(52, -14 + Math.sin(dog.bob * 3) * 6, 44, -2);
    c.stroke();

    if (dog.effect) {
      c.font = "18px serif";
      c.fillText(dog.effect === "feed" ? "🍖" : dog.effect === "pet" ? "♥" : "✨", 16, -28);
    }

    c.restore();
  }

  function drawStreetScene() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#6a7380");
    g.addColorStop(1, "#3a4048");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // rain
    ctx.strokeStyle = "rgba(180, 200, 220, 0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const x = (i * 47 + t * 120) % VW;
      const y = (i * 73 + t * 180) % VH;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 14);
      ctx.stroke();
    }

    // alley wall
    ctx.fillStyle = "#505860";
    ctx.fillRect(0, VH * 0.35, VW, VH * 0.45);
    ctx.fillStyle = "#3a424c";
    for (let y = VH * 0.35; y < VH * 0.8; y += 22) {
      ctx.fillRect(0, y, VW, 2);
    }

    // cardboard
    ctx.fillStyle = "#a88850";
    ctx.fillRect(dog.x - 55, dog.y + 10, 90, 36);
    ctx.fillStyle = "#8a7040";
    ctx.strokeRect(dog.x - 55, dog.y + 10, 90, 36);

    // puddle
    ctx.fillStyle = "rgba(100, 140, 180, 0.35)";
    ctx.beginPath();
    ctx.ellipse(dog.x + 80, dog.y + 40, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c8d0d8";
    ctx.font = "700 13px Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Молли: «Его зовут Butterscotch…»", 24, 36);
  }

  function drawHomeScene() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#f0e8d8");
    g.addColorStop(1, "#d8c8b0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // floor
    ctx.fillStyle = "#c8a878";
    ctx.fillRect(0, VH * 0.7, VW, VH * 0.3);

    // window
    ctx.fillStyle = "#a8d0f0";
    ctx.fillRect(40, 40, 160, 110);
    ctx.strokeStyle = "#8a7040";
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 160, 110);

    // couch
    ctx.fillStyle = "#70a080";
    ctx.fillRect(VW - 280, VH * 0.48, 220, 90);
    ctx.fillStyle = "#508068";
    ctx.fillRect(VW - 280, VH * 0.48, 220, 18);

    // bowl
    ctx.fillStyle = "#808890";
    ctx.beginPath();
    ctx.ellipse(dog.x - 70, dog.y + 28, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // bed
    ctx.fillStyle = "#e8b878";
    ctx.beginPath();
    ctx.ellipse(dog.x + 70, dog.y + 24, 48, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#806040";
    ctx.font = "700 13px Nunito, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Молли: «Дома ему лучше. Butterscotch…»", 24, 36);
  }

  function draw() {
    if (path === "home") drawHomeScene();
    else drawStreetScene();
    drawDogFigure(ctx, dog.x, dog.y, 1.35, dog.shiver);

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(VW - 200, 12, 180, 26);
    ctx.fillStyle = "#806040";
    ctx.font = "700 12px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(path === "home" ? "взяли домой" : "не взяли · уход на улице", VW - 110, 30);
  }

  function drawChoicePreview() {
    const W = cChoice.width;
    const H = cChoice.height;
    const g = ctxC.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#6a7380");
    g.addColorStop(1, "#3a4048");
    ctxC.fillStyle = g;
    ctxC.fillRect(0, 0, W, H);
    // simple street dog preview
    ctxC.fillStyle = "#a88850";
    ctxC.fillRect(W * 0.35, H * 0.62, 100, 40);
    // reuse dog draw with temp
    const oldPath = path;
    path = "street";
    dog.shiver = 0.8;
    dog.bob = t;
    drawDogOn(ctxC, W * 0.48, H * 0.55, 1.1);
    path = oldPath;
    ctxC.fillStyle = "#e8e0d0";
    ctxC.font = "700 16px Fredoka, Nunito, sans-serif";
    ctxC.textAlign = "center";
    ctxC.fillText("Butterscotch", W / 2, 36);
  }

  function drawDogOn(c, x, y, scale) {
    drawDogFigure(c, x, y, scale, 0.7);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (!choice.hidden) drawChoicePreview();
    if (playing && !done) {
      tick(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  document.getElementById("btnStart").onclick = showChoice;
  document.getElementById("btnTake").onclick = () => beginPath("home");
  document.getElementById("btnLeave").onclick = () => beginPath("street");
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnEndMenu").onclick = showMenu;
  document.getElementById("btnAgain").onclick = () => {
    end.hidden = true;
    showChoice();
  };

  requestAnimationFrame(frame);
})();
