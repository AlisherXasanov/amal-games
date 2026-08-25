/** UI languages for Create Lab buttons/labels (speech stays Russian). */
window.CreateLabI18n = (() => {
  const KEY = "create-lab-ui-lang-v1";

  const LANGS = [
    { code: "ru", label: "RU" },
    { code: "en", label: "EN" },
    { code: "kk", label: "KK" },
    { code: "es", label: "ES" },
    { code: "tr", label: "TR" },
  ];

  const T = {
    ru: {
      navHome: "Главная",
      navAnim: "Анимации",
      navGames: "Игры",
      navCatalog: "Amaya Games",
      eyebrow: "Твоя мастерская",
      lede: "Рисуй анимации, собирай игры и пиши Ушастику текстом — или говори в микрофон (нажал → говоришь → Стоп).",
      ctaAnim: "Сделать анимацию",
      ctaGame: "Сделать игру",
      statusIdle: "Напиши идею — сразу включу. Или: микрофон → говори → Стоп.",
      greet: "Поздороваться",
      micStart: "Сказать",
      micStop: "СТОП",
      cardAnimTitle: "Анимации",
      cardAnimBody: "Кадры на холсте, лук, скорость, сохранение.",
      cardGameTitle: "Игры",
      cardGameBody: "Змейка, ловилка, прыжки или гонка — голосом или текстом.",
      chatTitle: "Диалог с Ушастиком",
      chatHint: "Напиши идею — сразу запущу игру. Или микрофон: нажал → сказал → Стоп.",
      placeholder: "Напиши… например: маленькая площадка",
      send: "Включить",
      yourAnims: "Твои анимации",
      yourGames: "Твои игры",
      emptyAnim: "Пока пусто — зайди в аниматор.",
      emptyGame: "Пока пусто — создай игру.",
      open: "Открыть",
      play: "Играть",
      footer: "Микрофон: Chrome / Edge. Можно всегда писать текстом. Сохранения — в этом браузере.",
      langLabel: "Язык кнопок",
    },
    en: {
      navHome: "Home",
      navAnim: "Animations",
      navGames: "Games",
      navCatalog: "Amaya Games",
      eyebrow: "Your workshop",
      lede: "Make animations and games. Type to Ushastik, or use the mic (press → talk → Stop).",
      ctaAnim: "Make animation",
      ctaGame: "Make game",
      statusIdle: "Type an idea — I start it now. Or: mic → talk → Stop.",
      greet: "Say hello",
      micStart: "Speak",
      micStop: "STOP",
      cardAnimTitle: "Animations",
      cardAnimBody: "Frames, onion skin, speed, save.",
      cardGameTitle: "Games",
      cardGameBody: "Snake, catch, jump or race — voice or text.",
      chatTitle: "Chat with Ushastik",
      chatHint: "Type an idea — I launch it right away. Or mic: press → speak → Stop.",
      placeholder: "Type… e.g. small playground",
      send: "Start",
      yourAnims: "Your animations",
      yourGames: "Your games",
      emptyAnim: "Empty — open the animator.",
      emptyGame: "Empty — create a game.",
      open: "Open",
      play: "Play",
      footer: "Mic needs Chrome/Edge. You can always type. Saves stay in this browser.",
      langLabel: "Button language",
    },
    kk: {
      navHome: "Басты",
      navAnim: "Анимация",
      navGames: "Ойындар",
      navCatalog: "Amaya Games",
      eyebrow: "Сенің шеберханаң",
      lede: "Анимация мен ойын жаса. Ушастикке жаз, немесе микрофон (бас → сөйле → Тоқта).",
      ctaAnim: "Анимация жасау",
      ctaGame: "Ойын жасау",
      statusIdle: "Төменге жаз, немесе: микрофон → сөйле → қайта бас (Тоқта).",
      greet: "Сәлемдесу",
      micStart: "Айту",
      micStop: "ТОҚТА",
      cardAnimTitle: "Анимация",
      cardAnimBody: "Кадрлар, жылдамдық, сақтау.",
      cardGameTitle: "Ойындар",
      cardGameBody: "Жылан, ұстау, секіру немесе жарыс.",
      chatTitle: "Ушастикпен сөйлесу",
      chatHint: "Жазу ыңғайлы. Немесе микрофон: бас → сөйле → Тоқта.",
      placeholder: "Ушастикке жаз… мысалы: сәлем",
      send: "Жіберу",
      yourAnims: "Сенің анимацияларың",
      yourGames: "Сенің ойындарың",
      emptyAnim: "Бос — аниматорға кір.",
      emptyGame: "Бос — ойын жаса.",
      open: "Ашу",
      play: "Ойнау",
      footer: "Микрофон: Chrome / Edge. Әрқашан жазуға болады.",
      langLabel: "Батырма тілі",
    },
    es: {
      navHome: "Inicio",
      navAnim: "Animaciones",
      navGames: "Juegos",
      navCatalog: "Amaya Games",
      eyebrow: "Tu taller",
      lede: "Crea animaciones y juegos. Escribe a Ushastik o usa el mic (pulsar → hablar → Stop).",
      ctaAnim: "Crear animación",
      ctaGame: "Crear juego",
      statusIdle: "Escribe abajo, o: mic → habla → mic otra vez (Stop).",
      greet: "Saludar",
      micStart: "Hablar",
      micStop: "STOP",
      cardAnimTitle: "Animaciones",
      cardAnimBody: "Fotogramas, velocidad, guardar.",
      cardGameTitle: "Juegos",
      cardGameBody: "Serpiente, atrapar, saltar o carrera.",
      chatTitle: "Chat con Ushastik",
      chatHint: "Mejor escribir. O mic: pulsar → hablar → Stop.",
      placeholder: "Escribe a Ushastik… p. ej. hola",
      send: "Enviar",
      yourAnims: "Tus animaciones",
      yourGames: "Tus juegos",
      emptyAnim: "Vacío — abre el animador.",
      emptyGame: "Vacío — crea un juego.",
      open: "Abrir",
      play: "Jugar",
      footer: "Mic: Chrome/Edge. Siempre puedes escribir.",
      langLabel: "Idioma de botones",
    },
    tr: {
      navHome: "Ana",
      navAnim: "Animasyon",
      navGames: "Oyunlar",
      navCatalog: "Amaya Games",
      eyebrow: "Atölyen",
      lede: "Animasyon ve oyun yap. Ushastik'e yaz veya mikrofona bas (bas → konuş → Dur).",
      ctaAnim: "Animasyon yap",
      ctaGame: "Oyun yap",
      statusIdle: "Aşağıya yaz veya: mikrofon → konuş → tekrar bas (Dur).",
      greet: "Selam ver",
      micStart: "Konuş",
      micStop: "DUR",
      cardAnimTitle: "Animasyon",
      cardAnimBody: "Kareler, hız, kaydet.",
      cardGameTitle: "Oyunlar",
      cardGameBody: "Yılan, yakala, zıpla veya yarış.",
      chatTitle: "Ushastik sohbeti",
      chatHint: "Yazmak daha kolay. Veya mikrofon: bas → konuş → Dur.",
      placeholder: "Ushastik'e yaz… örn. merhaba",
      send: "Gönder",
      yourAnims: "Animasyonların",
      yourGames: "Oyunların",
      emptyAnim: "Boş — animatöre git.",
      emptyGame: "Boş — oyun yap.",
      open: "Aç",
      play: "Oyna",
      footer: "Mikrofon: Chrome/Edge. Her zaman yazabilirsin.",
      langLabel: "Düğme dili",
    },
  };

  function getLang() {
    const saved = localStorage.getItem(KEY);
    if (saved && T[saved]) return saved;
    return "ru";
  }

  function setLang(code) {
    if (!T[code]) return getLang();
    localStorage.setItem(KEY, code);
    return code;
  }

  function t(code) {
    return T[code] || T.ru;
  }

  function apply(root = document) {
    const code = getLang();
    const d = t(code);
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (d[key] != null) el.textContent = d[key];
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (d[key] != null) el.setAttribute("placeholder", d[key]);
    });
    const micLabel = root.getElementById?.("mic-label") || document.getElementById("mic-label");
    if (micLabel) {
      micLabel.dataset.labelStart = d.micStart;
      micLabel.dataset.labelStop = d.micStop;
    }
    const micBtn = document.getElementById("btn-mic");
    if (micBtn) {
      const pressed = micBtn.getAttribute("aria-pressed") === "true";
      const start = d.micStart || "Сказать";
      const stop = d.micStop || "СТОП";
      micBtn.innerHTML = pressed
        ? `<span class="mic-ico">⏹</span><span class="mic-txt">${stop}</span>`
        : `<span class="mic-ico">🎤</span><span class="mic-txt">${start}</span>`;
    }
    root.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.lang === code);
    });
    document.documentElement.lang = code === "kk" ? "kk" : code;
    return d;
  }

  function mountLangBar(host) {
    if (!host) return;
    host.innerHTML = `
      <span class="lang-label" data-i18n="langLabel">Язык кнопок</span>
      <div class="lang-btns" role="group" aria-label="Languages">
        ${LANGS.map((l) => `<button type="button" class="lang-btn" data-lang="${l.code}">${l.label}</button>`).join("")}
      </div>
    `;
    host.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLang(btn.dataset.lang);
        apply();
      });
    });
    apply();
  }

  return { LANGS, getLang, setLang, t, apply, mountLangBar };
})();
