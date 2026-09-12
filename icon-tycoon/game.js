/**
 * Icon Tycoon 2D — стиль бесплатных Roblox/icon паков с itch (эмодзи-иконки + яркий GUI).
 */
(function () {
  const SAVE = "amal-icon-tycoon-v1";

  const ITEMS = [
    { id: "coin", name: "Монета", emoji: "🪙", rate: 1, price: 20, rarity: "обычная" },
    { id: "gem", name: "Гем", emoji: "💎", rate: 3, price: 60, rarity: "обычная" },
    { id: "bread", name: "Хлеб", emoji: "🍞", rate: 5, price: 100, rarity: "еда" },
    { id: "steak", name: "Стейк", emoji: "🥩", rate: 8, price: 180, rarity: "еда" },
    { id: "corn", name: "Кукуруза", emoji: "🌽", rate: 10, price: 250, rarity: "еда" },
    { id: "pizza", name: "Пицца", emoji: "🍕", rate: 14, price: 400, rarity: "еда" },
    { id: "egg", name: "Яйцо", emoji: "🥚", rate: 18, price: 550, rarity: "пет" },
    { id: "chest", name: "Сундук", emoji: "🧰", rate: 25, price: 800, rarity: "лут" },
    { id: "sword", name: "Меч", emoji: "⚔️", rate: 35, price: 1200, rarity: "RPG" },
    { id: "potion", name: "Зелье", emoji: "🧪", rate: 45, price: 1700, rarity: "RPG" },
    { id: "star", name: "Звезда", emoji: "⭐", rate: 60, price: 2500, rarity: "редкая" },
    { id: "crown", name: "Корона", emoji: "👑", rate: 100, price: 5000, rarity: "легенда" },
  ];

  const EGG_POOL = ["coin", "gem", "bread", "steak", "corn", "pizza", "egg", "chest", "sword", "potion", "star"];

  let state = {
    coins: 40,
    tap: 1,
    owned: {}, // id -> count
  };

  const elCoins = document.getElementById("coins");
  const elIncome = document.getElementById("income");
  const elTap = document.getElementById("tap");
  const elShop = document.getElementById("shop");
  const elInv = document.getElementById("inv");
  const toastEl = document.getElementById("toast");
  let toastT = 0;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    toastT = 1.8;
  }

  function item(id) {
    return ITEMS.find((x) => x.id === id);
  }

  function income() {
    let s = 0;
    Object.keys(state.owned).forEach((id) => {
      const it = item(id);
      if (it) s += it.rate * state.owned[id];
    });
    return s;
  }

  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify(state));
    } catch (_) {}
  }

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE) || "null");
      if (!d) return;
      if (d.coins != null) state.coins = d.coins;
      if (d.tap != null) state.tap = d.tap;
      if (d.owned) state.owned = d.owned;
    } catch (_) {}
  }

  function sync() {
    elCoins.textContent = Math.floor(state.coins);
    elIncome.textContent = income();
    elTap.textContent = state.tap;
    renderInv();
    renderShop();
  }

  function renderInv() {
    const ids = Object.keys(state.owned).filter((id) => state.owned[id] > 0);
    if (!ids.length) {
      elInv.innerHTML = '<span class="badge">Пока пусто — купи иконку или открой яйцо</span>';
      return;
    }
    elInv.innerHTML = ids
      .map((id) => {
        const it = item(id);
        const n = state.owned[id];
        return (
          '<span class="badge">' +
          it.emoji +
          " " +
          it.name +
          " ×" +
          n +
          " · +" +
          it.rate * n +
          "/с</span>"
        );
      })
      .join("");
  }

  function renderShop() {
    elShop.innerHTML = ITEMS.map((it) => {
      const n = state.owned[it.id] || 0;
      const owned = n > 0 ? " owned" : "";
      return (
        '<button type="button" class="icon-card' +
        owned +
        '" data-buy="' +
        it.id +
        '">' +
        '<div class="emoji">' +
        it.emoji +
        "</div>" +
        '<div class="name">' +
        it.name +
        "</div>" +
        '<div class="rate">+' +
        it.rate +
        "/с · " +
        it.rarity +
        "</div>" +
        '<div class="price">🪙 ' +
        it.price +
        (n ? " · есть ×" + n : "") +
        "</div>" +
        "</button>"
      );
    }).join("");
    elShop.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.onclick = () => buy(btn.getAttribute("data-buy"));
    });
  }

  function buy(id) {
    const it = item(id);
    if (!it) return;
    if (state.coins < it.price) return toast("Мало монет · нужно " + it.price);
    state.coins -= it.price;
    state.owned[id] = (state.owned[id] || 0) + 1;
    toast(it.emoji + " Купил «" + it.name + "»! +" + it.rate + "/с");
    save();
    sync();
  }

  function tap() {
    state.coins += state.tap;
    toast("👆 +" + state.tap);
    save();
    sync();
  }

  function upgradeTap() {
    const cost = 25 + state.tap * 20;
    if (state.coins < cost) return toast("Сила тапа стоит 🪙 " + cost);
    state.coins -= cost;
    state.tap += 1;
    toast("💪 Тап теперь ×" + state.tap);
    save();
    sync();
  }

  function openEgg() {
    const cost = 75;
    if (state.coins < cost) return toast("Яйцо стоит 🪙 " + cost);
    state.coins -= cost;
    // чаще простые
    const weights = EGG_POOL.map((id, i) => ({ id, w: Math.max(1, 14 - i) }));
    let total = weights.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    let pick = weights[0].id;
    for (const w of weights) {
      r -= w.w;
      if (r <= 0) {
        pick = w.id;
        break;
      }
    }
    const it = item(pick);
    state.owned[pick] = (state.owned[pick] || 0) + 1;
    toast("🥚 Из яйца: " + it.emoji + " " + it.name + "!");
    save();
    sync();
  }

  document.getElementById("btnTap").onclick = tap;
  document.getElementById("btnTapUp").onclick = upgradeTap;
  document.getElementById("btnEgg").onclick = openEgg;

  load();
  sync();
  toast("Добро пожаловать в Icon Tycoon!");

  setInterval(() => {
    const inc = income();
    if (inc > 0) {
      state.coins += inc;
      elCoins.textContent = Math.floor(state.coins);
      save();
    }
    if (toastT > 0) {
      toastT -= 1;
      if (toastT <= 0) toastEl.style.display = "none";
    }
  }, 1000);
})();
