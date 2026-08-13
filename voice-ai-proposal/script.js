(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const deck = document.getElementById("deck");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const currentEl = document.getElementById("current");
  const totalEl = document.getElementById("total");
  const progressBar = document.getElementById("progress-bar");
  const dotsRoot = document.getElementById("dots");
  const STUDIO_URL = "studio.html";

  let index = 0;
  totalEl.textContent = String(slides.length);

  slides.forEach((slide, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `Слайд ${i + 1}: ${slide.dataset.title || ""}`);
    dot.addEventListener("click", () => go(i));
    dotsRoot.appendChild(dot);
  });

  const dots = [...dotsRoot.querySelectorAll(".dot")];

  function go(next) {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    if (clamped === index && slides[clamped].classList.contains("is-active")) {
      updateChrome();
      return;
    }
    slides[index].classList.remove("is-active");
    dots[index].classList.remove("is-active");
    index = clamped;
    slides[index].classList.add("is-active");
    dots[index].classList.add("is-active");
    updateChrome();
  }

  function updateChrome() {
    const last = index === slides.length - 1;
    currentEl.textContent = String(index + 1);
    progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = false;
    nextBtn.textContent = last ? "Готово" : "Далее →";
    nextBtn.setAttribute("aria-label", last ? "Перейти в студию" : "Следующий слайд");
  }

  function goToStudio() {
    window.location.assign(STUDIO_URL);
  }

  function nextOrFinish() {
    if (index >= slides.length - 1) {
      goToStudio();
      return;
    }
    go(index + 1);
  }

  prevBtn.addEventListener("click", () => go(index - 1));
  nextBtn.addEventListener("click", () => nextOrFinish());

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      nextOrFinish();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "Home") {
      go(0);
    } else if (e.key === "End") {
      go(slides.length - 1);
    }
  });

  let touchX = null;
  deck.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  deck.addEventListener(
    "touchend",
    (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0) nextOrFinish();
      else go(index - 1);
    },
    { passive: true }
  );

  updateChrome();
  deck.focus({ preventScroll: true });

  // language for free banners
  const freeMap = {
    ru: {
      decor: "играй · твори · делись",
      hero: "Создавай игры <strong>бесплатно</strong> — сайт открыт для всех. Это правда круто!",
      end: "И помни: всё это <strong>бесплатно</strong> — создавай сколько хочешь, платить не надо. Класс!",
    },
    en: {
      decor: "play · make · share",
      hero: "Create games <strong>for free</strong> — open to everyone, no payment. Yay, this site is free!",
      end: "And remember: it’s all <strong>free</strong> — make as many as you want. No pay. Awesome!",
    },
    kk: {
      decor: "ойнау · жасау · бөлісу",
      hero: "Ойындарды <strong>тегін</strong> жаса — бәріне ашық, төлем жоқ. Ура!",
      end: "Есіңде болсын: бәрі <strong>тегін</strong> — қанша керек, сонша жаса. Супер!",
    },
    es: {
      decor: "jugar · crear · compartir",
      hero: "Crea juegos <strong>gratis</strong> — abierto para todos. ¡Qué genial!",
      end: "Y recuerda: todo es <strong>gratis</strong> — crea cuanto quieras. ¡Genial!",
    },
    tr: {
      decor: "oyna · yap · paylaş",
      hero: "Oyunları <strong>ücretsiz</strong> yap — herkese açık. Ne güzel!",
      end: "Unutma: her şey <strong>ücretsiz</strong> — istediğin kadar yap. Harika!",
    },
  };

  const pitchLang = document.getElementById("pitch-lang");
  function applyFreeLang(code) {
    const pack = freeMap[code] || freeMap.ru;
    document.querySelectorAll("[data-free-decor]").forEach((el) => {
      el.textContent = pack.decor;
    });
    const hero = document.querySelector("#free-hero [data-free-html]");
    const end = document.querySelector("#free-end [data-free-html]");
    if (hero) hero.innerHTML = pack.hero;
    if (end) end.innerHTML = pack.end;
    if (window.SkazhiI18n) window.SkazhiI18n.setLang(code);
  }
  if (pitchLang) {
    const start = (window.SkazhiI18n && window.SkazhiI18n.getLang()) || "ru";
    pitchLang.value = start;
    applyFreeLang(start);
    pitchLang.addEventListener("change", () => {
      applyFreeLang(pitchLang.value);
      if (window.SkazhiSeason) window.SkazhiSeason.apply();
    });
  }

  if (window.SkazhiSeason) window.SkazhiSeason.apply();
})();
