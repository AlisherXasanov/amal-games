/* Shared bot profiles for Erihoka mini-games */
window.ErihokaBots = {
  eri: { id: "eri", name: "Эри Хока", speed: 0.72, react: 0.55, color: "#a78bfa" },
  easy: { id: "easy", name: "Лёгкий бот", speed: 0.42, react: 0.35, color: "#7dd3fc" },
  hard: { id: "hard", name: "Сильный бот", speed: 0.92, react: 0.85, color: "#fb7185" },
};

window.ErihokaUI = {
  bindOpponent(container, onChange) {
    const bots = window.ErihokaBots;
    let current = bots.eri;
    const buttons = container.querySelectorAll("[data-bot]");
    const set = (id) => {
      current = bots[id] || bots.eri;
      buttons.forEach((b) => b.classList.toggle("active", b.dataset.bot === current.id));
      onChange(current);
    };
    buttons.forEach((b) => b.addEventListener("click", () => set(b.dataset.bot)));
    set("eri");
    return () => current;
  },
};
