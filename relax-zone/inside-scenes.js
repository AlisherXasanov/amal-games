/** Отрисовка «что внутри» — у каждого предмета свой способ */
window.RelaxInside = (function () {
  "use strict";

  const EXPERIMENTS = [
    { id: "kinder_surprise", icon: "🥚", label: "Kinder Surprise", type: "kinderSurprise",
      reveal: "Яйцо открылось! Шоколад снаружи, внутри кapsula и игрушка 🧸" },
    { id: "kinder_choco", icon: "🍫", label: "Kinder шок.", type: "kinderChoco",
      reveal: "Молочный шоколад — внутри белая молочная начинка." },
    { id: "kinder_joy", icon: "🍭", label: "Kinder Joy", type: "kinderJoy",
      reveal: "Палочка + яйцо. Сверху шоколад, внутри игрушка и крем!" },
    { id: "kinder_maxi", icon: "🐣", label: "Kinder Maxi", type: "kinderMaxi",
      reveal: "Большое яйцо — больше шоколада и большая игрушка 🦁" },
    { id: "nee_doh", icon: "🟢", label: "Nee Doh", type: "neeDoh",
      reveal: "Жмёшь — gel внутри, slow rise назад!" },
    { id: "pop_it", icon: "🫧", label: "Pop-it", type: "popIt",
      reveal: "Пузырьки лопаются по одному — pop pop pop!" },
    { id: "ice", icon: "🧊", label: "Лёд", type: "ice",
      reveal: "Трещины — внутри чистая вода." },
    { id: "icecream", icon: "🍦", label: "Мороженое", type: "icecream",
      reveal: "Рожок — розовый пломбир и вафля." },
    { id: "dumpling", icon: "🥟", label: "Пельмень", type: "dumpling",
      reveal: "Тесто и горячая начинка внутри." },
    { id: "slime", icon: "🟣", label: "Слайм", type: "slime",
      reveal: "Тянется между двумя кусками — блестит." },
    { id: "soap", icon: "🧼", label: "Мыло", type: "soap",
      reveal: "Слои: жёлтый, розовый, голубой." },
    { id: "balloon", icon: "🎈", label: "Шарик", type: "balloon",
      reveal: "Лопнул — внутри только воздух. *psssh…*" },
  ];

  function ease(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  function draw(ctx, W, H, ex, p) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, W, H);
    const cx = W * 0.5;
    const cy = H * 0.52;
    const e = ease(p);

    const T = {
      kinderSurprise() {
        const gap = e * 26;
        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.ellipse(cx, cy - gap - 8, 58, 40, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(cx, cy + gap + 8, 58, 40, 0, 0, Math.PI);
        ctx.fill();
        if (p > 0.2) {
          ctx.globalAlpha = Math.min(1, (p - 0.2) * 2.5);
          ctx.fillStyle = "#f1f5f9";
          ctx.beginPath();
          ctx.ellipse(cx, cy + 4, 32, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = "34px serif";
          ctx.textAlign = "center";
          ctx.fillText("🧸", cx, cy + 14);
          ctx.globalAlpha = 1;
        }
        cap("шоколад + кapsula + игрушка");
      },

      kinderChoco() {
        const split = e * 20;
        [-1, 1].forEach((s) => {
          ctx.fillStyle = "#5c3d2e";
          ctx.beginPath();
          ctx.roundRect(cx - 68 * s - 8 + s * split, cy - 20, 68, 40, 8);
          ctx.fill();
          if (p > 0.25) {
            ctx.fillStyle = "#fff7ed";
            ctx.fillRect(cx - 48 * s + s * split, cy - 6, 38, 12);
          }
        });
        cap("ломается — белая начинка");
      },

      kinderJoy() {
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(cx - 7, cy + 18, 14, 52);
        const lift = e * 32;
        ctx.fillStyle = "#6b4226";
        ctx.beginPath();
        ctx.ellipse(cx, cy - lift, 46, 34, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6 - lift * 0.25, 46, 28, 0, 0, Math.PI);
        ctx.fill();
        if (p > 0.35) {
          ctx.font = "26px serif";
          ctx.textAlign = "center";
          ctx.fillText("🎠", cx, cy + 10);
        }
        cap("палочка · шоколад · игрушка");
      },

      kinderMaxi() {
        const gap = e * 34;
        ctx.fillStyle = "#7c2d12";
        ctx.beginPath();
        ctx.ellipse(cx, cy - gap - 10, 70, 50, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(cx, cy + gap + 10, 70, 50, 0, 0, Math.PI);
        ctx.fill();
        if (p > 0.25) {
          ctx.font = "40px serif";
          ctx.textAlign = "center";
          ctx.fillText("🦁", cx, cy + 14);
        }
        cap("большая игрушка");
      },

      neeDoh() {
        const squ = 1 + Math.sin(p * Math.PI) * 0.12;
        ctx.fillStyle = "#86efac";
        ctx.beginPath();
        ctx.ellipse(cx, cy, 60 * squ, 50 / squ, 0, 0, Math.PI * 2);
        ctx.fill();
        if (p > 0.35) {
          ctx.strokeStyle = "#4ade80";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 26, 20, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        cap("squish — gel внутри");
      },

      popIt() {
        for (let i = 0; i < 12; i++) {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const popped = p > 0.12 + i * 0.055;
          ctx.fillStyle = popped ? "#312e81" : "#a78bfa";
          ctx.beginPath();
          ctx.arc(cx - 54 + col * 36, cy - 38 + row * 36, 13, 0, Math.PI * 2);
          ctx.fill();
        }
        cap("pop · pop · pop");
      },

      ice() {
        ctx.fillStyle = "rgba(186,230,253,0.92)";
        ctx.fillRect(cx - 48, cy - 42, 96, 84);
        const cracks = Math.floor(e * 5);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;
        for (let i = 0; i < cracks; i++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(i * 1.3) * 50, cy + Math.sin(i * 1.3) * 46);
          ctx.stroke();
        }
        cap("трещины — вода внутри");
      },

      icecream() {
        ctx.fillStyle = "#d4a574";
        ctx.beginPath();
        ctx.moveTo(cx - 28, cy + 38);
        ctx.lineTo(cx + 28, cy + 38);
        ctx.lineTo(cx, cy - 8);
        ctx.fill();
        const n = Math.min(3, 1 + Math.floor(p * 3));
        ["#fbcfe8", "#fda4af", "#fef08a"].forEach((c, i) => {
          if (i >= n) return;
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(cx, cy - 4 - i * 20, 30 - i * 4, 0, Math.PI * 2);
          ctx.fill();
        });
        cap("вафля + шарики");
      },

      dumpling() {
        const open = e * 0.75;
        ctx.fillStyle = "#fef3c7";
        ctx.beginPath();
        ctx.ellipse(cx - 18 * open, cy, 38, 28, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 18 * open, cy, 38, 28, 0.2, 0, Math.PI * 2);
        ctx.fill();
        if (p > 0.4) {
          ctx.fillStyle = "#92400e";
          ctx.beginPath();
          ctx.ellipse(cx, cy + 2, 20, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        cap("начинка");
      },

      slime() {
        const st = e * 36;
        ctx.fillStyle = "#c084fc";
        ctx.beginPath();
        ctx.ellipse(cx - st * 0.35, cy, 42, 36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + st * 0.35, cy, 42, 36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e9d5ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy);
        ctx.quadraticCurveTo(cx, cy + 16 + st * 0.15, cx + 18, cy);
        ctx.stroke();
        cap("тянется…");
      },

      soap() {
        const n = Math.min(4, 1 + Math.floor(p * 4));
        ["#fef08a", "#fbcfe8", "#bae6fd", "#fde047"].forEach((c, i) => {
          if (i >= n) return;
          ctx.fillStyle = c;
          ctx.fillRect(cx - 52, cy - 28 + i * 13, 104, 13);
        });
        cap("слои мыла");
      },

      balloon() {
        if (p < 0.5) {
          ctx.fillStyle = "#f472b6";
          ctx.beginPath();
          ctx.ellipse(cx, cy - 8, 38 + e * 6, 46 + e * 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#444";
          ctx.beginPath();
          ctx.moveTo(cx, cy + 36);
          ctx.lineTo(cx + 8, cy + 58);
          ctx.stroke();
          cap("надувается…");
        } else {
          for (let i = 0; i < 7; i++) {
            ctx.fillStyle = `hsl(${320 + i * 18},75%,68%)`;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(i * 0.9) * (18 + e * 28), cy + Math.sin(i) * 12, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          cap("внутри — воздух");
        }
      },
    };

    function cap(txt) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(txt, cx, H - 12);
      ctx.textAlign = "left";
    }

    (T[ex.type] || T.kinderSurprise)();
  }

  return { EXPERIMENTS, draw, ease };
})();
