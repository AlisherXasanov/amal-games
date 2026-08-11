/** Каталог идей игр для Ушастика */
window.CreateLabCatalog = (() => {
  const KINDS = {
    basketball: {
      kindRu: "баскетбол",
      name: "Баскетбол",
      words: /баскет|basket|кольц|брос.*мяч|в кольцо|хоп/,
    },
    soccer: {
      kindRu: "футбол",
      name: "Футбол",
      words: /футбол|soccer|гол|ворота|пина.*мяч/,
    },
    playground: {
      kindRu: "площадка",
      name: "Маленькая площадка",
      words: /площадк|playground|песочниц|sandbox|дыня|melon|кидай|фигур|физик/,
    },
    snake: {
      kindRu: "змейка",
      name: "Змейка",
      words: /змей|snake|яблок/,
    },
    jump: {
      kindRu: "прыжки",
      name: "Прыжки",
      words: /прыг|платформ|jump|ladder|лестниц/,
    },
    race: {
      kindRu: "гонка",
      name: "Гонка",
      words: /гонка|машин|race|багги|buggy/,
    },
    catch: {
      kindRu: "ловилка",
      name: "Ловилка",
      words: /лови|падающ|кубик|шар лови|catch/,
    },
    zombie: {
      kindRu: "зомби",
      name: "Зомби у грядок",
      words: /зомби|zombie|растен|plants/,
    },
    shooter: {
      kindRu: "стрельба",
      name: "Тир",
      words: /стрел|тир|оруж|arsenal|стреля/,
    },
    hide: {
      kindRu: "прятки",
      name: "Прятки",
      words: /прятк|укрыт|hide|спряч/,
    },
  };

  /** Реальные игры из каталога Amal — открыть целиком */
  const REAL = [
    { words: /melon|дыня.*площад|площадк.*дыня/, href: "../melon-playground/", title: "Melon Playground" },
    { words: /зомби.*растен|растен.*зомби|zombie.?vs.?plants|звп/, href: "../zombie-vs-plants-2/", title: "Зомби против растений 2" },
    { words: /kick.?buddy|кик.?бадди|бокс.*бадди/, href: "../kick-buddy/", title: "Kick Buddy" },
    { words: /багги|x-?buggy|машинк/, href: "../x-buggy/", title: "X-Buggy" },
    { words: /minecraft|крафт|craftworld/, href: "../minecraft/", title: "CraftWorld" },
    { words: /больниц|hospital|аномал/, href: "../animal-hospital/", title: "Animal Hospital" },
    { words: /укрыт|hideout|прятки.*дом/, href: "../hideout/", title: "Укрытие" },
    { words: /монет|arsenal|тир.*монет/, href: "../coin-arsenal/", title: "Coin Arsenal" },
    { words: /змейк.*каталог|snake.?game/, href: "../snake-game/", title: "Snake" },
    { words: /лестниц|ladder/, href: "../ladder-climb/", title: "Ladder Climb" },
    { words: /blockbust|блокбаст/, href: "../blockbust/", title: "Blockbust" },
    { words: /bravol|brawl|зв[её]зд/, href: "../bravol-stars/", title: "Bravol Stars" },
    { words: /terra|терра/, href: "../terraverse/", title: "Terraverse" },
  ];

  function matchReal(text) {
    const t = String(text || "").toLowerCase();
    return REAL.find((r) => r.words.test(t)) || null;
  }

  function matchKind(text) {
    const t = String(text || "").toLowerCase();
    // порядок: сначала точные жанры, площадка не должна перехватывать всё
    const order = [
      "basketball", "soccer", "zombie", "shooter", "hide",
      "snake", "jump", "race", "catch", "playground",
    ];
    for (const k of order) {
      if (KINDS[k].words.test(t)) return k;
    }
    if (/сделай|создай|хочу|включи|игр|game/.test(t)) return "playground";
    return "playground";
  }

  function kindMeta(kind) {
    return KINDS[kind] || KINDS.playground;
  }

  function listHints() {
    return Object.values(KINDS).map((k) => k.kindRu).join(", ");
  }

  return { KINDS, REAL, matchReal, matchKind, kindMeta, listHints };
})();
