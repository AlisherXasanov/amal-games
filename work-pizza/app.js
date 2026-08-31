(() => {
  "use strict";
  const TOP_EMOJI = { sauce: "🍅", cheese: "🧀", pepper: "🌶️", mush: "🍄" };
  const TOP_NAME = { sauce: "соус", cheese: "сыр", pepper: "пепперони", mush: "грибы" };
  const CUSTOMERS = ["🧑", "👩", "👦", "👧", "🧓", "👴"];
  let coins = 0, rep = 0, order = [], built = [];
  let baking = false, bakeT = 0, baked = false, boxed = false;
  let carX = 40;
  const $ = (id) => document.getElementById(id);

  function toast(m) {
    const t = $("toast");
    t.textContent = m;
    t.classList.add("show");
    clearTimeout(toast._x);
    toast._x = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function newOrder() {
    const keys = Object.keys(TOP_EMOJI);
    const n = 2 + Math.floor(Math.random() * 2);
    order = [];
    for (let i = 0; i < n; i++) order.push(keys[Math.floor(Math.random() * keys.length)]);
    built = [];
    baked = false;
    boxed = false;
    baking = false;
    bakeT = 0;
    $("timer").textContent = "";
    $("box-pizza").textContent = "📦?";
    const c = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    $("cust").textContent = c;
    $("cust-big").textContent = c;
    renderOrder();
    renderPizza();
  }

  function renderOrder() {
    $("order").textContent = "Заказ: " + order.map((k) => TOP_EMOJI[k]).join(" ") + " · " + order.map((k) => TOP_NAME[k]).join(", ");
  }

  function renderPizza() {
    const g = $("toppings");
    g.innerHTML = "";
    built.forEach((k, i) => {
      const s = document.createElement("span");
      s.textContent = TOP_EMOJI[k];
      const a = (i / Math.max(1, built.length)) * Math.PI * 2;
      s.style.left = (50 + Math.cos(a) * 28) + "%";
      s.style.top = (50 + Math.sin(a) * 28) + "%";
      g.appendChild(s);
    });
    $("coins").textContent = coins;
    $("rep").textContent = rep;
  }

  document.querySelectorAll("[data-top]").forEach((btn) => {
    btn.onclick = () => {
      if (baking || baked || boxed) { toast("Уже готовится или готово"); return; }
      built.push(btn.dataset.top);
      renderPizza();
    };
  });

  $("btn-oven").onclick = () => {
    if (!built.length) { toast("Сначала ингредиенты"); return; }
    if (baking || baked) return;
    baking = true;
    bakeT = 3;
    toast("В печи… 🔥");
  };

  $("btn-box").onclick = () => {
    if (!baked) { toast(baking ? "Печётся…" : "Сначала испеки"); return; }
    boxed = true;
    $("box-pizza").textContent = "🍕📦";
    toast("В коробке! Иди на стойку 🛎️");
    document.querySelector('[data-tab="counter"]').click();
  };

  $("btn-serve").onclick = () => {
    if (!boxed) { toast("Сначала кухня → коробка"); return; }
    const ok = order.slice().sort().join(",") === built.slice().sort().join(",");
    if (ok) { coins += 12; rep++; toast("Клиент доволен! +12 🪙"); }
    else { coins += 4; toast("Не тот заказ… +4"); }
    document.querySelector('[data-tab="delivery"]').click();
    carX = 30;
    drawDrive();
  };

  $("btn-deliver").onclick = () => {
    if (!boxed) { toast("Нет пиццы"); return; }
    coins += 10;
    rep++;
    toast("Доставлено! +10 🪙 Бонус!");
    newOrder();
    document.querySelector('[data-tab="kitchen"]').click();
  };

  setInterval(() => {
    if (!baking) return;
    bakeT -= 0.016;
    $("timer").textContent = "🔥 " + Math.ceil(Math.max(0, bakeT));
    if (bakeT <= 0) {
      baking = false;
      baked = true;
      $("timer").textContent = "✅ Готово!";
    }
  }, 16);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("on"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("on"));
      tab.classList.add("on");
      $("panel-" + tab.dataset.tab).classList.add("on");
    };
  });

  const dcanvas = $("drive");
  const dctx = dcanvas.getContext("2d");
  function drawDrive() {
    const w = dcanvas.width, h = dcanvas.height;
    dctx.fillStyle = "#44403c";
    dctx.fillRect(0, 0, w, h);
    dctx.fillStyle = "#fde047";
    dctx.fillRect(0, h * 0.45, w, 8);
    dctx.font = "36px serif";
    dctx.fillText("🛵", carX, h * 0.42);
    dctx.fillText("🏠", w - 40, h * 0.42);
  }
  dcanvas.addEventListener("pointerdown", (e) => {
    const r = dcanvas.getBoundingClientRect();
    carX = Math.max(20, Math.min(dcanvas.width - 50, (e.clientX - r.left) * (dcanvas.width / r.width)));
    drawDrive();
  });
  dcanvas.addEventListener("pointermove", (e) => {
    if (e.buttons !== 1) return;
    const r = dcanvas.getBoundingClientRect();
    carX = Math.max(20, Math.min(dcanvas.width - 50, (e.clientX - r.left) * (dcanvas.width / r.width)));
    drawDrive();
  });

  newOrder();
  drawDrive();
})();
