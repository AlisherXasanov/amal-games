/* Auto season theme by calendar month (Northern Hemisphere) */
window.SkazhiSeason = (() => {
  const KEY = "skazhigru-season-v1";

  const names = {
    ru: { spring: "Весна", summer: "Лето", autumn: "Осень", winter: "Зима" },
    en: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
    kk: { spring: "Көктем", summer: "Жаз", autumn: "Күз", winter: "Қыс" },
    es: { spring: "Primavera", summer: "Verano", autumn: "Otoño", winter: "Invierno" },
    tr: { spring: "İlkbahar", summer: "Yaz", autumn: "Sonbahar", winter: "Kış" },
  };

  function detect(date = new Date()) {
    const m = date.getMonth(); // 0-11
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  }

  function apply(force) {
    const season = force || detect();
    document.documentElement.setAttribute("data-season", season);
    document.body.setAttribute("data-season", season);
    const badge = document.getElementById("season-badge");
    if (badge) {
      const lang = (window.SkazhiI18n && window.SkazhiI18n.getLang()) || "ru";
      const pack = names[lang] || names.ru;
      badge.textContent = pack[season] || season;
      badge.dataset.season = season;
    }
    try {
      localStorage.setItem(KEY, season);
    } catch (_) {}
    return season;
  }

  return { detect, apply, names, KEY };
})();
