(() => {
  "use strict";
  const SAVE = "amal-space-elevator-v1";
  const app = document.getElementById("app");
  app.innerHTML =
    '<canvas id="c"></canvas><div class="click-zone" id="zone"></div>' +
    '<div class="hud"><span class="chip" id="alt">Высота: 0 км</span><span class="chip" id="energy">⚡ 0</span>' +
    '<span class="chip" id="auto">Авто: 0/с</span><span class="chip" id="best">Рекорд: 0</span></div>' +
    '<div class="heat"><div class="bar"><i id="heatBar"></i></div></div>' +
    '<button type="button" class="big-tap" id="tap">🚀 ПОДЪЁМ</button>' +
    '<div class="shop">' +
    '<button type="button" id="upCable">🪢 Трос (+)</button>' +
    '<button type="button" id="upMotor">⚙️ Двигатель</button>' +
    '<button type="button" id="upAuto">🤖 Авто</button>' +
    '<button type="button" id="btnMute">🔊</button></div>' +
    '<div class="overlay" id="menu"><div class="panel"><h1>🚀 Космический Лифт</h1>' +
    '<p>Кликай / тапай, чтобы поднимать кабину. Покупай трос, двигатель и автоподъём. Следи за перегревом! Цель — Марс (100 000 км).</p>' +
    '<button type="button" class="btn" id="btnStart">СТАРТ</button></div></div>' +
    '<div class="overlay hidden" id="end"><div class="panel"><h1 id="endTitle"></h1><p id="endText"></p>' +
    '<button type="button" class="btn" id="btnAgain">Ещё</button></div></div>' +
    '<div class="toast" id="toast"></div>';

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  let muted = false, state = "menu";
  let alt = 0, energy = 0, heat = 0, best = 0;
  let cable = 1, motor = 1, auto = 0, stars = [];
  let timeStop = false, coinMult = 1;
  const MARS = 100000;

  try { best = parseInt(localStorage.getItem(SAVE), 10) || 0; } catch (_) {}
  el("best").textContent = "Рекорд: " + best;

  function toast(m) {
    const n = el("toast"); n.textContent = m; n.classList.add("show");
    clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("show"), 1500);
  }
  function beep(f, d) {
    if (muted) return;
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = f; g.gain.value = 0.04; o.connect(g); g.connect(a.destination); o.start();
      setTimeout(() => { o.stop(); a.close(); }, d || 50);
    } catch (_) {}
  }
  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener("resize", resize); resize();

  function costs() {
    return {
      cable: Math.floor(25 * Math.pow(1.45, cable - 1)),
      motor: Math.floor(40 * Math.pow(1.5, motor - 1)),
      auto: Math.floor(80 * Math.pow(1.65, auto)),
    };
  }
  function refreshShop() {
    const c = costs();
    el("upCable").textContent = "🪢 Трос L" + cable + " (" + c.cable + ")";
    el("upMotor").textContent = "⚙️ Двиг. L" + motor + " (" + c.motor + ")";
    el("upAuto").textContent = "🤖 Авто L" + auto + " (" + c.auto + ")";
  }

  function start() {
    state = "play";
    alt = 0; energy = 0; heat = 0; cable = 1; motor = 1; auto = 0;
    stars = Array.from({ length: 80 }, () => ({
      x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.5,
    }));
    el("menu").classList.add("hidden");
    el("end").classList.add("hidden");
    refreshShop();
    toast("Тяни лифт к звёздам!");
  }

  function climb(amount) {
    if (state !== "play") return;
    if (heat > 95) { toast("🔥 Перегрев! Подожди"); return; }
    const gain = amount * cable * motor;
    alt += gain;
    energy += Math.round(gain * 0.35 * coinMult);
    heat = Math.min(100, heat + gain * 0.08 + 2);
    beep(400 + Math.min(800, alt / 80), 40);
    if (alt >= MARS) win();
  }

  function win() {
    state = "end";
    if (alt > best) { best = Math.floor(alt); try { localStorage.setItem(SAVE, String(best)); } catch (_) {} }
    el("best").textContent = "Рекорд: " + best;
    el("endTitle").textContent = "🪐 Марс!";
    el("endText").textContent = "Лифт дошёл до Марса. Энергия: " + energy;
    el("end").classList.remove("hidden");
    beep(900, 200);
  }

  function milestone() {
    if (alt > 1000 && alt < 1100) toast("☁️ Выше облаков");
    if (alt > 10000 && alt < 10200) toast("🛰️ Орбита Земли!");
    if (alt > 40000 && alt < 40300) toast("🌑 Луна мимо");
  }

  function update(dt) {
    if (state !== "play") return;
    if (timeStop) dt *= 0.1;
    heat = Math.max(0, heat - dt * 12);
    if (auto > 0) climb(auto * 2.2 * dt);
    milestone();
    el("alt").textContent = "Высота: " + Math.floor(alt).toLocaleString("ru-RU") + " км";
    el("energy").textContent = "⚡ " + energy;
    el("auto").textContent = "Авто: " + (auto * 2.2).toFixed(1) + "/с";
    el("heatBar").style.width = heat + "%";
    if (alt > best) {
      best = Math.floor(alt);
      try { localStorage.setItem(SAVE, String(best)); } catch (_) {}
      el("best").textContent = "Рекорд: " + best;
    }
  }

  function skyColor() {
    const k = Math.min(1, alt / 20000);
    const r = Math.floor(90 * (1 - k) + 2 * k);
    const g = Math.floor(160 * (1 - k) + 6 * k);
    const b = Math.floor(220 * (1 - k) + 20 * k);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = skyColor();
    ctx.fillRect(0, 0, w, h);
    // stars appear high
    const starA = Math.min(1, Math.max(0, (alt - 3000) / 8000));
    if (starA > 0) {
      ctx.fillStyle = "rgba(255,255,255," + starA + ")";
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x * w, ((s.y + alt * 0.00001) % 1) * h, s.s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // cable
    const cx = w / 2;
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    // cabin
    const bob = Math.sin(performance.now() / 300) * 4;
    const cy = h * 0.55 + bob;
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(cx - 28, cy - 36, 56, 48);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(cx - 18, cy - 26, 16, 14);
    ctx.fillRect(cx + 2, cy - 26, 16, 14);
    ctx.font = "28px system-ui";
    ctx.fillText("🚀", cx - 14, cy - 48);
    // ground / mars
    if (alt < 500) {
      ctx.fillStyle = "#166534";
      ctx.fillRect(0, h - 40 + alt * 0.05, w, 80);
    }
    if (alt > MARS * 0.85) {
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(cx, h + 40 - (alt / MARS) * 80, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "40px system-ui";
      ctx.fillText("🪐", cx - 20, h - 20);
    }
    // labels
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = "800 14px system-ui";
    ctx.fillText(Math.floor((alt / MARS) * 100) + "% до Марса", 16, h - 16);
  }

  function buy(kind) {
    if (state !== "play") return;
    const c = costs();
    const price = c[kind];
    if (energy < price) { toast("Мало энергии"); return; }
    energy -= price;
    if (kind === "cable") cable++;
    if (kind === "motor") motor++;
    if (kind === "auto") auto++;
    refreshShop();
    toast("Улучшение куплено!");
    beep(620, 70);
  }

  el("tap").onclick = () => climb(1 + motor * 0.5);
  el("zone").onclick = (e) => {
    if (e.target.closest(".shop,.overlay,.portal-back,.big-tap,.hud,.heat")) return;
    climb(1 + motor * 0.5);
  };
  el("upCable").onclick = () => buy("cable");
  el("upMotor").onclick = () => buy("motor");
  el("upAuto").onclick = () => buy("auto");
  el("btnMute").onclick = () => { muted = !muted; el("btnMute").textContent = muted ? "🔇" : "🔊"; };
  el("btnStart").onclick = start;
  el("btnAgain").onclick = start;

  window.addEventListener("amal-power", (e) => {
    const d = (e && e.detail) || {};
    if (d.type === "se-tesla" || d.type === "coinMult") { coinMult = 1000; energy = Math.max(energy, 1e6); toast("⚡ Миллион энергии"); refreshShop(); }
    if (d.type === "se-rewind" || d.type === "killAll") { heat = 0; toast("⏪ Перегрев сброшен"); }
    if (d.type === "se-spawn") { energy += 50000; toast("✨ Бонус-жизни / энергия"); refreshShop(); }
    if (d.type === "se-owl") { heat = 0; toast("🦉 Сова ведёт кабину"); }
    if (d.type === "god") { heat = 0; toast("🛡 Перегрев не страшен"); }
    if (d.type === "killAll") { heat = 0; toast("💥 Перегрев сброшен"); }
    if (d.type === "timestop") timeStop = !!d.on;
    if (d.type === "invincible") { heat = 0; toast("🛡️ Перегрев не страшен"); }
    if (d.type === "coinMult") { coinMult = Number(d.factor) || 1; energy = Math.max(energy, energy * Math.min(coinMult, 1000)); toast("🪙 Энергия ×миллион"); refreshShop(); }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
