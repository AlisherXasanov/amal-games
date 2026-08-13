(() => {
  "use strict";

  const VW = 960;
  const VH = 480;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const play = document.getElementById("play");
  const outro = document.getElementById("outro");
  const panel = document.getElementById("panel");
  const bubble = document.getElementById("bubble");
  const moneyEl = document.getElementById("money");
  const scoreEl = document.getElementById("score");
  const outroText = document.getElementById("outroText");
  const outroCode = document.getElementById("outroCode");
  const outroHint = document.getElementById("outroHint");

  const NAMES = ["Петя", "Варя", "Боря", "Лёля", "Тёма", "Миша", "Зоя", "Кира", "Стёпа", "Нюша"];

  let money = 100;
  let score = 0;
  let dumplings = [];
  let active = 0;
  let bubbleT = 0;
  let particles = [];
  let done = false;
  let last = performance.now();
  let t = 0;
  let cared = 0;
  let made = 0;
  let eaten = 0;
  let bought = 0;
  let audioCtx = null;
  let liked = false;
  let shared = false;
  let subbed = false;

  function say(text, sec) {
    bubble.textContent = text;
    bubble.hidden = false;
    bubbleT = sec || 2.4;
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
        vx: (Math.random() - 0.5) * 200,
        vy: -60 - Math.random() * 140,
        life: 0.4 + Math.random() * 0.5,
        color,
        r: 3 + Math.random() * 4,
      });
    }
  }

  function makeDumpling(kind) {
    const i = dumplings.length;
    const cols = 5;
    const col = i % cols;
    const row = (i / cols) | 0;
    return {
      id: Date.now() + Math.random(),
      name: NAMES[(Math.random() * NAMES.length) | 0],
      kind, // bought | homemade
      hunger: 55 + Math.random() * 20,
      clean: 60 + Math.random() * 25,
      happy: 50 + Math.random() * 30,
      cooked: kind === "bought" ? 40 : 10,
      bob: Math.random() * 6,
      anim: 0,
      effect: null,
      x: 120 + col * 160 + (Math.random() - 0.5) * 20,
      y: 160 + row * 110,
      alive: true,
    };
  }

  function showMenu() {
    done = false;
    menu.hidden = false;
    play.hidden = true;
    outro.hidden = true;
    bubble.hidden = true;
  }

  function start() {
    money = 100;
    score = 0;
    cared = 0;
    made = 0;
    eaten = 0;
    bought = 0;
    liked = shared = subbed = false;
    dumplings = [makeDumpling("homemade"), makeDumpling("bought")];
    active = 0;
    particles = [];
    done = false;
    menu.hidden = true;
    play.hidden = false;
    outro.hidden = true;
    syncHud();
    renderPanel();
    say("Кухня открыта! Купи, слепи, ухаживай или съешь.", 3);
    draw();
  }

  function syncHud() {
    moneyEl.textContent = "💰 " + money;
    scoreEl.textContent = "❤ " + score;
  }

  function cur() {
    return dumplings[active];
  }

  function renderPanel() {
    panel.innerHTML = dumplings
      .map((d, i) => {
        const avg = ((d.hunger + d.clean + d.happy + d.cooked) / 4) | 0;
        return `<button type="button" class="card ${i === active ? "active" : ""}" data-i="${i}">
          <strong>${d.kind === "bought" ? "🛒" : "✋"} ${d.name}</strong>
          сытость <div class="bar"><i style="width:${d.hunger}%"></i></div>
          чистота <div class="bar"><i style="width:${d.clean}%;background:linear-gradient(90deg,#7ec8ff,#4080ff)"></i></div>
          радость <div class="bar"><i style="width:${d.happy}%;background:linear-gradient(90deg,#ff90b8,#ff6080)"></i></div>
          готовность <div class="bar"><i style="width:${d.cooked}%;background:linear-gradient(90deg,#80e060,#40a040)"></i></div>
          <span>${avg}% · ${d.kind === "bought" ? "куплен" : "слеплен"}</span>
        </button>`;
      })
      .join("");
    panel.querySelectorAll(".card").forEach((el) => {
      el.onclick = () => {
        active = +el.dataset.i;
        renderPanel();
        say("Выбран: " + dumplings[active].name, 1.5);
      };
    });
  }

  function doAct(act) {
    if (done) return;

    if (act === "buy") {
      if (money < 30) {
        say("Мало денег. Съешь или ухаживай за готовыми.", 2);
        return;
      }
      if (dumplings.length >= 10) {
        say("Кухня полная! Съешь кого-нибудь.", 2);
        return;
      }
      money -= 30;
      bought++;
      dumplings.push(makeDumpling("bought"));
      active = dumplings.length - 1;
      beep(360, 0.08);
      say("Купили пельменя «" + cur().name + "»!", 2.2);
      syncHud();
      renderPanel();
      return;
    }

    if (act === "make") {
      if (money < 20) {
        say("Нужно 20 монет, чтобы слепить.", 2);
        return;
      }
      if (dumplings.length >= 10) {
        say("Слишком много пельменей!", 2);
        return;
      }
      money -= 20;
      made++;
      dumplings.push(makeDumpling("homemade"));
      active = dumplings.length - 1;
      beep(420, 0.08);
      say("Слепили нового: «" + cur().name + "»!", 2.2);
      syncHud();
      renderPanel();
      return;
    }

    const d = cur();
    if (!d) {
      say("Нет пельменей. Купи или слепи!", 2);
      return;
    }

    if (act === "care") {
      d.hunger = clamp(d.hunger + 18);
      d.clean = clamp(d.clean + 22);
      d.happy = clamp(d.happy + 20);
      d.anim = 0.8;
      d.effect = "care";
      cared++;
      score += 3;
      money += 5;
      burst(d.x, d.y - 20, "#ffb070", 12);
      beep(480, 0.07);
      say(d.name + ": мрр… вкусно ухаживают!", 2.2);
    } else if (act === "boil") {
      d.cooked = clamp(d.cooked + 28);
      d.clean = clamp(d.clean + 8);
      d.happy = clamp(d.happy + 6);
      d.anim = 1;
      d.effect = "boil";
      cared++;
      score += 2;
      burst(d.x, d.y - 30, "#80c0ff", 14);
      beep(300, 0.09);
      say(d.name + " варится… буль-буль!", 2.2);
    } else if (act === "eat") {
      if (d.cooked < 35) {
        say("Слишком сырой! Сначала свари.", 2);
        return;
      }
      const bonus = Math.round((d.hunger + d.clean + d.happy + d.cooked) / 20);
      score += 5 + bonus;
      money += 10 + bonus;
      eaten++;
      burst(d.x, d.y, "#c05040", 20);
      beep(220, 0.1);
      say("Съели «" + d.name + "»! +" + (5 + bonus) + " ❤", 2.4);
      dumplings.splice(active, 1);
      if (active >= dumplings.length) active = Math.max(0, dumplings.length - 1);
    }

    syncHud();
    renderPanel();
    if (score >= 40 && (made + bought) >= 3 && eaten >= 2) showOutro();
  }

  function showOutro() {
    if (done) return;
    done = true;
    play.hidden = true;
    outro.hidden = false;
    outroText.textContent =
      "Не забудь поставить лайк, поделиться с друзьями и подписаться!";
    outroCode.textContent =
      "🥟 куплено " + bought + " · слеплено " + made + " · съедено " + eaten + " · ❤ " + score;
    outroHint.textContent = "";
  }

  function tick(dt) {
    for (const d of dumplings) {
      d.hunger = clamp(d.hunger - dt * 1.5);
      d.clean = clamp(d.clean - dt * 1.2);
      d.happy = clamp(d.happy - dt * 1.3);
      d.bob += dt * 3;
      if (d.anim > 0) d.anim -= dt;
      else d.effect = null;
    }
    for (const p of particles) {
      p.life -= dt;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function drawKitchen() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#ffe8d0");
    g.addColorStop(1, "#f0d8b8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    // table
    ctx.fillStyle = "#c89060";
    ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
    ctx.fillStyle = "#b07848";
    ctx.fillRect(0, VH * 0.72, VW, 12);

    // pot
    ctx.fillStyle = "#708090";
    ctx.beginPath();
    ctx.ellipse(80, VH * 0.78, 50, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(40, VH * 0.7, 80, 40);
    ctx.fillStyle = "#90b0ff";
    ctx.beginPath();
    ctx.ellipse(80, VH * 0.72, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // flour sack
    ctx.fillStyle = "#f8f0e0";
    ctx.fillRect(VW - 120, VH * 0.62, 70, 55);
    ctx.fillStyle = "#c05040";
    ctx.font = "700 12px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("мука", VW - 85, VH * 0.72);
  }

  function drawDumpling(d, selected) {
    const bob = Math.sin(d.bob) * 3;
    ctx.save();
    ctx.translate(d.x, d.y + bob);

    if (selected) {
      ctx.strokeStyle = "rgba(255, 144, 64, 0.6)";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(0, 28, 42, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, 26, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // dough body
    const cookedTint = d.cooked / 100;
    ctx.fillStyle = `rgb(${240 - cookedTint * 30}, ${216 - cookedTint * 40}, ${176 - cookedTint * 50})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // fold / pleats
    ctx.strokeStyle = "rgba(160, 120, 80, 0.45)";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, -18);
      ctx.quadraticCurveTo(i * 10, -4, i * 6, 8);
      ctx.stroke();
    }

    // face
    ctx.fillStyle = "#302028";
    ctx.beginPath();
    ctx.arc(-10, -4, 3, 0, Math.PI * 2);
    ctx.arc(10, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#302028";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (d.happy > 40) ctx.arc(0, 4, 8, 0.15, Math.PI - 0.15);
    else ctx.arc(0, 12, 8, Math.PI + 0.2, -0.2);
    ctx.stroke();

    // blush
    ctx.fillStyle = "rgba(255, 120, 140, 0.35)";
    ctx.beginPath();
    ctx.ellipse(-18, 4, 6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(18, 4, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (d.effect === "boil") {
      ctx.fillStyle = "rgba(120, 180, 255, 0.5)";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-15 + i * 10, -30 - ((d.anim * 20 + i * 5) % 20), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (d.effect === "care") {
      ctx.font = "16px serif";
      ctx.fillText("♥", -6, -34 - (1 - d.anim) * 10);
    }

    ctx.fillStyle = "#806050";
    ctx.font = "700 11px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(d.name, 0, 44);

    ctx.restore();
  }

  function draw() {
    drawKitchen();
    dumplings.forEach((d, i) => drawDumpling(d, i === active));
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (bubbleT > 0) {
      bubbleT -= dt;
      if (bubbleT <= 0) bubble.hidden = true;
    }
    if (!play.hidden && !done) {
      tick(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  document.getElementById("btnStart").onclick = start;
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnOutroMenu").onclick = showMenu;
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.dataset.act));
  });

  document.getElementById("btnLike").onclick = () => {
    liked = true;
    score += 10;
    outroHint.textContent = "👍 Лайк! Спасибо!";
    beep(520, 0.08);
  };
  document.getElementById("btnShare").onclick = () => {
    shared = true;
    money += 20;
    outroHint.textContent = "↗ Поделились с друзьями!";
    beep(440, 0.08);
  };
  document.getElementById("btnSub").onclick = () => {
    subbed = true;
    outroHint.textContent = "🔔 Подписка оформлена! Спасибо за просмотр!";
    beep(660, 0.1);
    if (liked && shared) {
      outroCode.textContent += " · FULL FAN";
    }
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (done || !dumplings.length) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * VW;
    const y = ((e.clientY - r.top) / r.height) * VH;
    let best = -1;
    let bestD = 55;
    dumplings.forEach((d, i) => {
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    });
    if (best >= 0) {
      active = best;
      renderPanel();
      say("Выбран: " + dumplings[active].name, 1.4);
    }
  });

  requestAnimationFrame(frame);
})();
