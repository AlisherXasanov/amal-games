/** Shared localStorage for Create Lab */
window.CreateLabStore = (() => {
  const ANIM_KEY = "create-lab-anims-v1";
  const GAMES_KEY = "create-lab-games-v1";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      return data ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function guessGame(text) {
    const Cat = window.CreateLabCatalog;
    const t = String(text || "").toLowerCase();
    if (/анимац|кадр|мульт/.test(t)) return { kind: null };

    const real = Cat ? Cat.matchReal(text) : null;
    if (real) {
      return {
        kind: "real",
        real,
        color: "#0d6e5f",
        name: real.title,
        prompt: String(text || "").trim(),
        kindRu: "полная игра",
      };
    }

    const kind = Cat ? Cat.matchKind(text) : "playground";
    const meta = Cat ? Cat.kindMeta(kind) : { kindRu: kind, name: "Игра" };

    let color = "#0d6e5f";
    if (/зелён|зелен|green/.test(t)) color = "#12a374";
    else if (/син|blue/.test(t)) color = "#2563eb";
    else if (/красн|red|оранж|basket|баскет/.test(t)) color = kind === "basketball" ? "#ea580c" : "#dc2626";
    else if (/жёлт|желт|yellow/.test(t)) color = "#ca8a04";
    else if (kind === "basketball") color = "#ea580c";
    else if (kind === "soccer") color = "#16a34a";

    let name = String(text || "")
      .replace(/^(сделай|создай|хочу|пожалуйста|включи|открой|make|create)[,\s]+/i, "")
      .trim();
    if (!name || name.length < 2) name = meta.name;
    if (name.length > 42) name = name.slice(0, 42) + "…";

    return {
      kind,
      color,
      name,
      prompt: String(text || "").trim(),
      kindRu: meta.kindRu,
    };
  }

  function makeGameFromIdea(text) {
    const g = guessGame(text);
    if (!g.kind) return null;
    if (g.kind === "real") {
      return { game: null, ...g, href: g.real.href };
    }
    const game = {
      id: uid("game"),
      name: g.name,
      prompt: g.prompt || g.name,
      kind: g.kind,
      color: g.color,
      createdAt: Date.now(),
    };
    const list = read(GAMES_KEY, []);
    const arr = Array.isArray(list) ? list : [];
    arr.unshift(game);
    write(GAMES_KEY, arr);
    return { game, ...g };
  }

  return {
    listAnims() {
      const list = read(ANIM_KEY, []);
      return Array.isArray(list) ? list : [];
    },
    saveAnims(list) {
      write(ANIM_KEY, list);
    },
    upsertAnim(anim) {
      const list = this.listAnims();
      const i = list.findIndex((a) => a.id === anim.id);
      if (i >= 0) list[i] = anim;
      else list.unshift(anim);
      this.saveAnims(list);
      return anim;
    },
    deleteAnim(id) {
      this.saveAnims(this.listAnims().filter((a) => a.id !== id));
    },
    getAnim(id) {
      return this.listAnims().find((a) => a.id === id) || null;
    },
    listGames() {
      const list = read(GAMES_KEY, []);
      return Array.isArray(list) ? list : [];
    },
    saveGames(list) {
      write(GAMES_KEY, list);
    },
    upsertGame(game) {
      const list = this.listGames();
      const i = list.findIndex((g) => g.id === game.id);
      if (i >= 0) list[i] = game;
      else list.unshift(game);
      this.saveGames(list);
      return game;
    },
    deleteGame(id) {
      this.saveGames(this.listGames().filter((g) => g.id !== id));
    },
    getGame(id) {
      return this.listGames().find((g) => g.id === id) || null;
    },
    guessGame,
    makeGameFromIdea,
    uid,
  };
})();