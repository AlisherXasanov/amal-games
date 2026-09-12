/**
 * Тайный питомец — говорит, просит еду, иногда ест сам.
 * Вид раскрывается заботой. Без телефона.
 */
(function () {
  "use strict";
  window.__AMAL_NO_WORLD__ = true;

  var SAVE = "amal-mystery-pet-v1";
  var canvas = document.getElementById("c");
  var ctx = canvas.getContext("2d");
  var bubble = document.getElementById("bubble");
  var speciesEl = document.getElementById("species");

  var LINES = {
    hungry: ["Ну, покорми меня", "Я голоден…", "Еды бы…", "Покорми, пожалуйста"],
    happy: ["Мур… почти", "Ты классная", "Ещё!", "Люблю это"],
    play: ["Давай играть!", "Уиии!", "Лови!"],
    sleep: ["Ззз…", "Спокойной", "Глазки закрываю"],
    lonely: ["Ты тут?", "Скучно без тебя", "Эй…"],
    self: ["Ом-ном… сам справился", "Нашёл крошки", "Поел без тебя!"],
    mystery: ["Кто я? Хе-хе", "Угадаешь?", "Я не то, чем кажусь"],
    reveal: ["Та-да! Теперь знаешь", "Я был загадкой", "Спасибо, что заботилась"],
  };

  var SPECIES = [
    { id: "blob", name: "Комок-загадка", need: 0 },
    { id: "fox", name: "Лисичка-шёпот", need: 40 },
    { id: "owl", name: "Сова-полуночница", need: 80 },
    { id: "dragon", name: "Мини-дракончик", need: 140 },
  ];

  var pet = {
    hunger: 62,
    mood: 70,
    energy: 75,
    care: 0,
    species: 0,
    sleeping: false,
    bounce: 0,
    blink: 0,
    mouth: 0,
    autoT: 18 + Math.random() * 20,
    talkT: 8,
    lastLine: "",
  };

  try {
    var d = JSON.parse(localStorage.getItem(SAVE) || "null");
    if (d) {
      pet.hunger = d.hunger != null ? d.hunger : pet.hunger;
      pet.mood = d.mood != null ? d.mood : pet.mood;
      pet.energy = d.energy != null ? d.energy : pet.energy;
      pet.care = d.care || 0;
      pet.species = d.species || 0;
    }
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(
        SAVE,
        JSON.stringify({
          hunger: Math.round(pet.hunger),
          mood: Math.round(pet.mood),
          energy: Math.round(pet.energy),
          care: Math.round(pet.care),
          species: pet.species,
        })
      );
    } catch (_) {}
  }

  function say(list, force) {
    var line = list[(Math.random() * list.length) | 0];
    if (!force && line === pet.lastLine && list.length > 1) line = list[(Math.random() * list.length) | 0];
    pet.lastLine = line;
    bubble.textContent = "«" + line + "»";
    bubble.classList.add("on");
    clearTimeout(say._t);
    say._t = setTimeout(function () {
      bubble.classList.remove("on");
    }, 2800);
  }

  function clamp(n) {
    return Math.max(0, Math.min(100, n));
  }

  function updateSpecies() {
    var next = 0;
    for (var i = 0; i < SPECIES.length; i++) {
      if (pet.care >= SPECIES[i].need) next = i;
    }
    if (next > pet.species) {
      pet.species = next;
      say(LINES.reveal, true);
    }
    speciesEl.textContent =
      pet.species === 0
        ? "Кто это? Пока загадка… (забота: " + Math.round(pet.care) + ")"
        : "Это: " + SPECIES[pet.species].name + " · забота " + Math.round(pet.care);
  }

  function feed(fromSelf) {
    if (pet.sleeping) {
      say(["Не сейчас… сплю", "Потом…"], true);
      return;
    }
    pet.hunger = clamp(pet.hunger + (fromSelf ? 18 : 28));
    pet.mood = clamp(pet.mood + (fromSelf ? 4 : 10));
    pet.mouth = 0.5;
    if (!fromSelf) {
      pet.care += 3;
      say(["Ням!", "Спасибо!", "Вкусно!"], true);
    } else say(LINES.self, true);
    updateSpecies();
    save();
  }

  function petMe() {
    if (pet.sleeping) {
      say(LINES.sleep, true);
      return;
    }
    pet.mood = clamp(pet.mood + 14);
    pet.energy = clamp(pet.energy - 3);
    pet.care += 2;
    pet.bounce = 0.4;
    say(LINES.happy, true);
    updateSpecies();
    save();
  }

  function play() {
    if (pet.sleeping) {
      say(["Сначала разбуди", "Ззз…"], true);
      return;
    }
    if (pet.energy < 15) {
      say(["Устал…", "Хочу спать"], true);
      return;
    }
    pet.mood = clamp(pet.mood + 16);
    pet.energy = clamp(pet.energy - 18);
    pet.hunger = clamp(pet.hunger - 8);
    pet.care += 4;
    pet.bounce = 0.8;
    say(LINES.play, true);
    updateSpecies();
    save();
  }

  function sleepToggle() {
    pet.sleeping = !pet.sleeping;
    if (pet.sleeping) say(LINES.sleep, true);
    else {
      pet.energy = clamp(pet.energy + 20);
      say(["Проснулся!", "Что дальше?"], true);
    }
    save();
  }

  function hud() {
    document.getElementById("h-fill").style.transform = "scaleX(" + pet.hunger / 100 + ")";
    document.getElementById("m-fill").style.transform = "scaleX(" + pet.mood / 100 + ")";
    document.getElementById("e-fill").style.transform = "scaleX(" + pet.energy / 100 + ")";
  }

  function drawPet(t) {
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // soft floor glow
    ctx.fillStyle = "rgba(167,139,250,0.15)";
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.78, 110, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    var bob = Math.sin(t * 2.2) * 4 + (pet.bounce > 0 ? Math.sin(pet.bounce * 20) * 10 : 0);
    var cx = W / 2;
    var cy = H * 0.52 + bob;
    var sp = SPECIES[pet.species].id;

    // body
    if (sp === "blob" || sp === "dragon") {
      var g = ctx.createRadialGradient(cx - 20, cy - 30, 10, cx, cy, 90);
      g.addColorStop(0, sp === "dragon" ? "#fde68a" : "#ddd6fe");
      g.addColorStop(1, sp === "dragon" ? "#f97316" : "#8b5cf6");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 78, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      if (sp === "dragon") {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(cx + 70, cy - 10);
        ctx.lineTo(cx + 110, cy);
        ctx.lineTo(cx + 70, cy + 18);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 78);
        ctx.lineTo(cx - 10, cy - 100);
        ctx.lineTo(cx + 5, cy - 72);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy - 78);
        ctx.lineTo(cx + 28, cy - 102);
        ctx.lineTo(cx + 40, cy - 70);
        ctx.fill();
      }
    } else if (sp === "fox") {
      ctx.fillStyle = "#fb923c";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 72, 64, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fdba74";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 40, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.moveTo(cx - 48, cy - 40);
      ctx.lineTo(cx - 70, cy - 90);
      ctx.lineTo(cx - 18, cy - 58);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 48, cy - 40);
      ctx.lineTo(cx + 70, cy - 90);
      ctx.lineTo(cx + 18, cy - 58);
      ctx.fill();
      ctx.fillStyle = "#fff7ed";
      ctx.beginPath();
      ctx.moveTo(cx - 48, cy - 44);
      ctx.lineTo(cx - 62, cy - 78);
      ctx.lineTo(cx - 28, cy - 56);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 48, cy - 44);
      ctx.lineTo(cx + 62, cy - 78);
      ctx.lineTo(cx + 28, cy - 56);
      ctx.fill();
    } else if (sp === "owl") {
      ctx.fillStyle = "#a16207";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70, 78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 42, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.ellipse(cx - 55, cy - 10, 18, 40, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 55, cy - 10, 18, 40, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // eyes
    var blink = pet.blink > 0 || pet.sleeping;
    ctx.fillStyle = "#0f172a";
    if (blink) {
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 34, cy - 12);
      ctx.lineTo(cx - 14, cy - 12);
      ctx.moveTo(cx + 14, cy - 12);
      ctx.lineTo(cx + 34, cy - 12);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx - 24, cy - 12, 10, 0, Math.PI * 2);
      ctx.arc(cx + 24, cy - 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - 21, cy - 15, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + 27, cy - 15, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // mouth
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (pet.mouth > 0) {
      ctx.ellipse(cx, cy + 22, 14, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#9f1239";
      ctx.fill();
    } else if (pet.hunger < 35) {
      ctx.moveTo(cx - 12, cy + 28);
      ctx.quadraticCurveTo(cx, cy + 18, cx + 12, cy + 28);
      ctx.stroke();
    } else {
      ctx.moveTo(cx - 12, cy + 22);
      ctx.quadraticCurveTo(cx, cy + 34, cx + 12, cy + 22);
      ctx.stroke();
    }

    if (sp === "owl") {
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(cx, cy + 2);
      ctx.lineTo(cx - 10, cy + 14);
      ctx.lineTo(cx + 10, cy + 14);
      ctx.fill();
    }
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (pet.sleeping) {
      pet.energy = clamp(pet.energy + dt * 6);
      pet.hunger = clamp(pet.hunger - dt * 1.2);
    } else {
      pet.hunger = clamp(pet.hunger - dt * 1.8);
      pet.energy = clamp(pet.energy - dt * 0.7);
      if (pet.hunger < 40) pet.mood = clamp(pet.mood - dt * 2);
      else pet.mood = clamp(pet.mood - dt * 0.4);
    }

    pet.autoT -= dt;
    pet.talkT -= dt;
    if (pet.bounce > 0) pet.bounce = Math.max(0, pet.bounce - dt);
    if (pet.mouth > 0) pet.mouth = Math.max(0, pet.mouth - dt);
    if (pet.blink > 0) pet.blink = Math.max(0, pet.blink - dt);
    else if (Math.random() < dt * 0.35) pet.blink = 0.12;

    // сам иногда ест
    if (pet.autoT <= 0 && !pet.sleeping) {
      pet.autoT = 22 + Math.random() * 35;
      if (pet.hunger < 55) feed(true);
      else say(LINES.mystery);
    }

    // сам просит еду / болтает
    if (pet.talkT <= 0 && !pet.sleeping) {
      pet.talkT = 10 + Math.random() * 16;
      if (pet.hunger < 38) say(LINES.hungry);
      else if (pet.mood < 35) say(LINES.lonely);
      else if (Math.random() < 0.35) say(LINES.mystery);
      else if (Math.random() < 0.5) say(LINES.happy);
    }

    hud();
    drawPet(now / 1000);
    requestAnimationFrame(frame);
  }

  document.getElementById("btn-feed").onclick = function () {
    feed(false);
  };
  document.getElementById("btn-pet").onclick = petMe;
  document.getElementById("btn-play").onclick = play;
  document.getElementById("btn-sleep").onclick = sleepToggle;

  updateSpecies();
  say(["Привет! Покорми меня… или я сам", "Я тайный питомец"], true);
  requestAnimationFrame(frame);
  setInterval(save, 8000);
})();
