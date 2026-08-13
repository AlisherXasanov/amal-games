(() => {
  "use strict";

  const VW = 960;
  const VH = 420;
  const SCALE = 1.55;
  const HIT_R = 55;
  const SELL_X = 820;
  const PRICE_COMMON = 25;
  const PRICE_RARE = 60;
  const PRICE_MAKE = 20;

  const RARE_NAMES = ["Золотой", "Царский", "Алмазный", "Огненный", "Лунный"];
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
  let sold = 0;
  let audioCtx = null;
  let drag = null; // { i, ox, oy }
  let pointer = { x: 0, y: 0 };

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

  function clamp(v, lo, hi) {
    if (hi == null) {
      hi = 100;
      lo = 0;
    }
    return Math.max(lo, Math.min(hi, v));
  }

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * VW,
      y: ((e.clientY - r.top) / r.height) * VH,
    };
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

  function freeSpot() {
    for (let tries = 0; tries < 40; tries++) {
      const x = 100 + Math.random() * 620;
      const y = 120 + Math.random() * 220;
      if (!dumplings.some((d) => Math.hypot(d.x - x, d.y - y) < 90)) return { x, y };
    }
    return { x: 200 + Math.random() * 400, y: 180 + Math.random() * 120 };
  }

  function makeDumpling(kind, rare) {
    const spot = freeSpot();
    const isRare = !!rare;
    return {
      id: Date.now() + Math.random(),
      name: isRare
        ? RARE_NAMES[(Math.random() * RARE_NAMES.length) | 0]
        : NAMES[(Math.random() * NAMES.length) | 0],
      kind, // bought | homemade
      rare: isRare,
      hunger: 55 + Math.random() * 20 + (isRare ? 10 : 0),
      clean: 60 + Math.random() * 25,
      happy: 50 + Math.random() * 30 + (isRare ? 15 : 0),
      cooked: kind === "bought" ? (isRare ? 55 : 40) : 10,
      bob: Math.random() * 6,
      anim: 0,
      effect: null,
      x: spot.x,
      y: spot.y,
      scale: SCALE * (isRare ? 1.12 : 1),
      carried: false,
      baseValue: isRare ? 55 : 18,
    };
  }

  function showMenu() {
    done = false;
    drag = null;
    menu.hidden = false;
    play.hidden = true;
    outro.hidden = true;
    bubble.hidden = true;
  }

  function start() {
    money = 120;
    score = 0;
    cared = made = eaten = bought = sold = 0;
    dumplings = [makeDumpling("homemade", false), makeDumpling("bought", true)];
    active = 0;
    particles = [];
    done = false;
    drag = null;
    menu.hidden = true;
    play.hidden = false;
    outro.hidden = true;
    syncHud();
    renderPanel();
    say("Кнопки сверху! Обычный / Редкий · Варить · Продать. Тащи в зону 💰.", 3.5);
    draw();
  }

  function syncHud() {
    moneyEl.textContent = "💰 " + money;
    scoreEl.textContent = "❤ " + score;
  }

  function cur() {
    return dumplings[active];
  }

  function sellPrice(d) {
    const avg = (d.hunger + d.clean + d.happy + d.cooked) / 4;
    const rareBonus = d.rare ? 40 : 0;
    const homeBonus = d.kind === "homemade" ? 8 : 0;
    return d.baseValue + Math.round(avg * (d.rare ? 0.7 : 0.4)) + rareBonus + homeBonus;
  }

  function moodLabel(d) {
    const avg = (d.hunger + d.clean + d.happy) / 3;
    if (avg >= 80) return "😊 отлично";
    if (avg >= 55) return "🙂 норм";
    if (avg >= 30) return "😐 так себе";
    return "😢 плохо";
  }

  function removeAt(i) {
    dumplings.splice(i, 1);
    if (active >= dumplings.length) active = Math.max(0, dumplings.length - 1);
  }

  function sellDumpling(i) {
    const d = dumplings[i];
    if (!d) return;
    const price = sellPrice(d);
    money += price;
    score += d.rare ? 8 : 4;
    sold++;
    burst(d.x, d.y, d.rare ? "#ffd040" : "#ffb070", 18);
    beep(d.rare ? 620 : 500, 0.08);
    say(
      (d.rare ? "✨ Редкий " : "") + "«" + d.name + "» продан за " + price + "💰!",
      2.5
    );
    removeAt(i);
    syncHud();
    renderPanel();
    maybeOutro();
  }

  function renderPanel() {
    panel.innerHTML = dumplings
      .map((d, i) => {
        const avg = ((d.hunger + d.clean + d.happy + d.cooked) / 4) | 0;
        return `<button type="button" class="card ${i === active ? "active" : ""} ${d.rare ? "rare" : ""}" data-i="${i}">
          <span class="tag ${d.rare ? "rare" : "common"}">${d.rare ? "✨ редкий" : "обычный"}</span>
          <strong>${d.kind === "bought" ? "🛒" : "✋"} ${d.name}</strong>
          <div>${moodLabel(d)}</div>
          сытость <div class="bar"><i style="width:${d.hunger}%"></i></div>
          радость <div class="bar"><i style="width:${d.happy}%;background:linear-gradient(90deg,#ff90b8,#ff6080)"></i></div>
          готовность <div class="bar"><i style="width:${d.cooked}%;background:linear-gradient(90deg,#80e060,#40a040)"></i></div>
          <span>продать ${sellPrice(d)}💰</span>
        </button>`;
      })
      .join("");
    panel.querySelectorAll(".card").forEach((el) => {
      el.onclick = () => {
        active = +el.dataset.i;
        renderPanel();
        const d = dumplings[active];
        say(
          (d.rare ? "✨ Редкий · " : "") + d.name + " · настроение: " + moodLabel(d) + " · " + sellPrice(d) + "💰",
          2
        );
      };
    });
  }

  function maybeOutro() {
    if (score >= 35 && (made + bought) >= 2 && (eaten + sold) >= 2) showOutro();
  }

  function doAct(act) {
    if (done) return;

    if (act === "buy" || act === "buyRare") {
      const rare = act === "buyRare";
      const cost = rare ? PRICE_RARE : PRICE_COMMON;
      if (money < cost) {
        say("Мало денег. Нужно " + cost + "💰.", 2);
        return;
      }
      if (dumplings.length >= 8) {
        say("Кухня полная! Унеси и продай.", 2);
        return;
      }
      money -= cost;
      bought++;
      dumplings.push(makeDumpling("bought", rare));
      active = dumplings.length - 1;
      beep(rare ? 520 : 360, 0.08);
      say(
        (rare ? "✨ Купили РЕДКОГО «" : "Купили обычного «") + cur().name + "» за " + cost + "!",
        2.3
      );
      syncHud();
      renderPanel();
      return;
    }

    if (act === "make") {
      if (money < PRICE_MAKE) {
        say("Нужно " + PRICE_MAKE + " монет.", 2);
        return;
      }
      if (dumplings.length >= 8) {
        say("Слишком много! Продай или съешь.", 2);
        return;
      }
      money -= PRICE_MAKE;
      made++;
      const rare = Math.random() < 0.18;
      dumplings.push(makeDumpling("homemade", rare));
      active = dumplings.length - 1;
      beep(420, 0.08);
      say(
        rare
          ? "✨ Слепили РЕДКОГО «" + cur().name + "»!"
          : "Слепили обычного «" + cur().name + "»!",
        2.3
      );
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
      say(d.name + ": спасибо за уход!", 2.2);
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
    } else if (act === "choco") {
      // endless chocolate
      d.hunger = clamp(d.hunger + 35);
      d.happy = clamp(d.happy + 30);
      d.anim = 0.9;
      d.effect = "choco";
      score += 2;
      burst(d.x, d.y - 25, "#6a3a20", 14);
      beep(380, 0.07);
      say("🍫 Бесконечный шоколад для «" + d.name + "»!", 2.3);
    } else if (act === "sell") {
      sellDumpling(active);
      return;
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
      removeAt(active);
    }

    syncHud();
    renderPanel();
    maybeOutro();
  }

  function showOutro() {
    if (done) return;
    done = true;
    drag = null;
    play.hidden = true;
    outro.hidden = false;
    outroText.textContent =
      "Не забудь поставить лайк, поделиться с друзьями и подписаться!";
    outroCode.textContent =
      "🥟 +" + bought + " · слеп " + made + " · продано " + sold + " · съед " + eaten + " · ❤ " + score;
    outroHint.textContent = "";
  }

  function hitIndex(x, y) {
    let best = -1;
    let bestD = HIT_R;
    // topmost first (last drawn)
    for (let i = dumplings.length - 1; i >= 0; i--) {
      const d = dumplings[i];
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    }
    return best;
  }

  function tick(dt) {
    for (const d of dumplings) {
      if (d.carried) continue;
      d.hunger = clamp(d.hunger - dt * 1.2);
      d.clean = clamp(d.clean - dt * 1.0);
      d.happy = clamp(d.happy - dt * 1.1);
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

    ctx.fillStyle = "#c89060";
    ctx.fillRect(0, VH * 0.72, VW, VH * 0.28);
    ctx.fillStyle = "#b07848";
    ctx.fillRect(0, VH * 0.72, VW, 12);

    // sell zone
    ctx.fillStyle = "rgba(255, 208, 64, 0.22)";
    ctx.fillRect(SELL_X - 20, 40, VW - SELL_X + 20, VH - 80);
    ctx.strokeStyle = "rgba(200, 140, 20, 0.55)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(SELL_X - 14, 50, VW - SELL_X + 4, VH - 110);
    ctx.setLineDash([]);
    ctx.fillStyle = "#a07020";
    ctx.font = "800 18px Fredoka, Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("💰 ПРОДАЖА", SELL_X + 55, 80);
    ctx.font = "600 12px Nunito, sans-serif";
    ctx.fillText("отпусти здесь", SELL_X + 55, 100);

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

    // chocolate mountain (endless)
    ctx.fillStyle = "#5a3018";
    ctx.beginPath();
    ctx.moveTo(VW - 70, VH * 0.72);
    ctx.lineTo(VW - 40, VH * 0.55);
    ctx.lineTo(VW - 10, VH * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 11px Nunito, sans-serif";
    ctx.fillText("🍫∞", VW - 40, VH * 0.68);
  }

  function drawDumpling(d, selected) {
    const bob = d.carried ? 0 : Math.sin(d.bob) * 4;
    const s = d.scale * (d.carried ? 1.12 : 1);
    ctx.save();
    ctx.translate(d.x, d.y + bob - (d.carried ? 18 : 0));
    ctx.scale(s, s);

    if (selected || d.carried) {
      ctx.strokeStyle = d.carried ? "rgba(255, 180, 40, 0.8)" : "rgba(255, 144, 64, 0.6)";
      ctx.lineWidth = 3 / s;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(0, 32, 48, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = `rgba(0,0,0,${d.carried ? 0.08 : 0.14})`;
    ctx.beginPath();
    ctx.ellipse(0, 30, 40, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    const cookedTint = d.cooked / 100;
    if (d.rare) {
      ctx.fillStyle = `rgb(${255 - cookedTint * 20}, ${220 - cookedTint * 30}, ${120 - cookedTint * 20})`;
    } else {
      ctx.fillStyle = `rgb(${240 - cookedTint * 30}, ${216 - cookedTint * 40}, ${176 - cookedTint * 50})`;
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    if (d.rare) {
      ctx.strokeStyle = "rgba(255, 200, 40, 0.85)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#fff8c0";
      ctx.font = "800 10px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("RARE", 0, -38);
    }

    ctx.strokeStyle = "rgba(160, 120, 80, 0.45)";
    ctx.lineWidth = 2.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 9, -22);
      ctx.quadraticCurveTo(i * 12, -4, i * 7, 10);
      ctx.stroke();
    }

    ctx.fillStyle = "#302028";
    ctx.beginPath();
    ctx.arc(-12, -4, 4, 0, Math.PI * 2);
    ctx.arc(12, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-11, -5, 1.5, 0, Math.PI * 2);
    ctx.arc(13, -5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#302028";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (d.happy > 40) ctx.arc(0, 6, 10, 0.15, Math.PI - 0.15);
    else ctx.arc(0, 14, 10, Math.PI + 0.2, -0.2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 120, 140, 0.35)";
    ctx.beginPath();
    ctx.ellipse(-22, 6, 7, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(22, 6, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (d.effect === "boil") {
      ctx.fillStyle = "rgba(120, 180, 255, 0.5)";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(-18 + i * 12, -36 - ((d.anim * 20 + i * 5) % 20), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (d.effect === "care") {
      ctx.font = "22px serif";
      ctx.fillText("♥", -8, -40);
    }
    if (d.effect === "choco") {
      ctx.font = "22px serif";
      ctx.fillText("🍫", -10, -42);
    }

    ctx.fillStyle = "#806050";
    ctx.font = "700 13px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(d.name, 0, 52);
    if (d.carried) {
      ctx.fillStyle = "#c08020";
      ctx.font = "800 11px Nunito, sans-serif";
      ctx.fillText("несу…", 0, -52);
    }

    ctx.restore();
  }

  function draw() {
    drawKitchen();
    // draw non-carried first, carried on top
    dumplings.forEach((d, i) => {
      if (!d.carried) drawDumpling(d, i === active);
    });
    dumplings.forEach((d, i) => {
      if (d.carried) drawDumpling(d, i === active);
    });
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

  canvas.addEventListener("pointerdown", (e) => {
    if (done) return;
    const p = canvasPos(e);
    pointer = p;
    const i = hitIndex(p.x, p.y);
    if (i < 0) return;
    active = i;
    const d = dumplings[i];
    drag = { i, ox: d.x - p.x, oy: d.y - p.y };
    d.carried = true;
    // move to end for draw order
    const item = dumplings.splice(i, 1)[0];
    dumplings.push(item);
    drag.i = dumplings.length - 1;
    active = drag.i;
    canvas.setPointerCapture(e.pointerId);
    renderPanel();
    say("Несу «" + item.name + "»…", 1.2);
    beep(300, 0.04);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = canvasPos(e);
    pointer = p;
    const d = dumplings[drag.i];
    if (!d) return;
    d.x = clamp(p.x + drag.ox, 50, VW - 40);
    d.y = clamp(p.y + drag.oy, 70, VH - 50);
  });

  function endDrag(e) {
    if (!drag) return;
    const d = dumplings[drag.i];
    if (d) {
      d.carried = false;
      if (d.x >= SELL_X - 10) {
        sellDumpling(drag.i);
      } else {
        say("Поставили «" + d.name + "» сюда.", 1.4);
      }
    }
    drag = null;
  }

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  document.getElementById("btnStart").onclick = start;
  document.getElementById("btnMenu").onclick = showMenu;
  document.getElementById("btnOutroMenu").onclick = showMenu;
  document.getElementById("moodToggle").onclick = () => {
    const wrap = document.querySelector(".mood-wrap");
    wrap.classList.toggle("collapsed");
    document.getElementById("moodToggle").textContent = wrap.classList.contains("collapsed")
      ? "Настроение ▸"
      : "Настроение ▾";
  };
  document.querySelectorAll(".act").forEach((btn) => {
    btn.addEventListener("click", () => doAct(btn.dataset.act));
  });
  document.getElementById("btnLike").onclick = () => {
    outroHint.textContent = "👍 Лайк! Спасибо!";
    beep(520, 0.08);
  };
  document.getElementById("btnShare").onclick = () => {
    money += 20;
    outroHint.textContent = "↗ Поделились с друзьями!";
    beep(440, 0.08);
  };
  document.getElementById("btnSub").onclick = () => {
    outroHint.textContent = "🔔 Подписка! Спасибо за просмотр!";
    beep(660, 0.1);
  };

  requestAnimationFrame(frame);
})();
