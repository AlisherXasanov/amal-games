(() => {
  const plants = window.PVZ2_PLANTS || [];
  const types = window.PVZ2_TYPES || [];
  const typeName = Object.fromEntries(types.map((t) => [t.id, t.name]));

  const screenMenu = document.getElementById("screenMenu");
  const screenAlmanac = document.getElementById("screenAlmanac");
  const plantCount = document.getElementById("plantCount");
  const typeFilters = document.getElementById("typeFilters");
  const plantGrid = document.getElementById("plantGrid");
  const plantSearch = document.getElementById("plantSearch");
  const almanacSub = document.getElementById("almanacSub");
  const toast = document.getElementById("toast");
  const btnAlmanac = document.getElementById("btnAlmanac");
  const btnBackMenu = document.getElementById("btnBackMenu");

  let activeType = "all";
  let hideTimer = 0;

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      toast.hidden = true;
    }, 1800);
  }

  function showMenu() {
    screenMenu.hidden = false;
    screenAlmanac.hidden = true;
  }

  function showAlmanac() {
    screenMenu.hidden = true;
    screenAlmanac.hidden = false;
    renderGrid();
  }

  function parseSun(value) {
    const n = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function renderFilters() {
    typeFilters.innerHTML = "";
    types.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "type-btn" + (t.id === activeType ? " active" : "");
      const count =
        t.id === "all"
          ? plants.length
          : plants.filter((p) => (p.types || []).includes(t.id)).length;
      btn.textContent = `${t.icon} ${t.name} (${count})`;
      btn.addEventListener("click", () => {
        activeType = t.id;
        renderFilters();
        renderGrid();
      });
      typeFilters.appendChild(btn);
    });
  }

  function filteredPlants() {
    const q = (plantSearch.value || "").trim().toLowerCase();
    return plants.filter((p) => {
      if (activeType !== "all" && !(p.types || []).includes(activeType)) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.en} ${p.worldRu} ${(p.types || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function renderGrid() {
    const list = filteredPlants();
    almanacSub.textContent = `Показано ${list.length} из ${plants.length}`;
    plantGrid.innerHTML = "";
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Ничего не найдено";
      plantGrid.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((p) => {
      const card = document.createElement("article");
      card.className = "plant-card";
      const sun = parseSun(p.sun);
      const tags = (p.types || [])
        .map((t) => `<span class="tag ${t}">${typeName[t] || t}</span>`)
        .join("");
      card.innerHTML = `
        <div class="emoji">${p.icon || "🌱"}</div>
        <h3>${p.name}</h3>
        <div class="en">${p.en}</div>
        <div class="meta">☀️ ${sun == null ? p.sun : sun} · ⏱ ${p.recharge}с · ${p.worldRu}</div>
        <div class="tags">${tags}</div>
      `;
      card.addEventListener("click", () => {
        showToast(`${p.name}: ${(p.types || []).map((t) => typeName[t] || t).join(", ")}`);
      });
      frag.appendChild(card);
    });
    plantGrid.appendChild(frag);
  }

  if (plantCount) plantCount.textContent = `Растений в альманахе: ${plants.length}`;
  renderFilters();

  btnAlmanac?.addEventListener("click", showAlmanac);
  btnBackMenu?.addEventListener("click", showMenu);
  plantSearch?.addEventListener("input", renderGrid);
})();
