(() => {
  "use strict";

  function drawEyes(c, x, y, s, mood) {
    const e = 7 * s;
    c.fillStyle = "#1e1b4b";
    [[-1, 0], [1, 0]].forEach(([sx]) => {
      const ex = x + sx * 14 * s;
      const ey = y - 2 * s;
      c.beginPath();
      c.ellipse(ex, ey, e, mood === "sad" ? e * 0.7 : e, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(ex + 2 * s, ey - 2 * s, 2.5 * s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#1e1b4b";
    });
    c.strokeStyle = "#4a044e";
    c.lineWidth = 1.2 * s;
    if (mood === "happy") {
      c.beginPath();
      c.arc(x, y + 8 * s, 6 * s, 0.1 * Math.PI, 0.9 * Math.PI);
      c.stroke();
    }
  }

  function drawCheeks(c, x, y, s, color) {
    c.fillStyle = color || "rgba(249,168,212,.55)";
    [[-1, 1], [1, 1]].forEach(([sx, sy]) => {
      c.beginPath();
      c.ellipse(x + sx * 22 * s, y + sy * 6 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
      c.fill();
    });
  }

  function bodyBase(c, x, y, s, sp) {
    c.fillStyle = sp.color;
    c.beginPath();
    c.ellipse(x, y, 46 * s, 42 * s, 0, 0, Math.PI * 2);
    c.fill();
    if (sp.belly) {
      c.fillStyle = sp.belly;
      c.beginPath();
      c.ellipse(x, y + 8 * s, 28 * s, 24 * s, 0, 0, Math.PI * 2);
      c.fill();
    }
    if (sp.spots) {
      c.fillStyle = sp.spots;
      [[-18, -8], [12, 4], [0, 16]].forEach(([dx, dy]) => {
        c.beginPath();
        c.arc(x + dx * s, y + dy * s, 5 * s, 0, Math.PI * 2);
        c.fill();
      });
    }
  }

  const SHAPES = {
    bunny(c, x, y, s, sp, t) {
      bodyBase(c, x, y, s, sp);
      c.fillStyle = sp.color;
      [[-1, 0], [1, 0]].forEach(([sx]) => {
        c.beginPath();
        c.ellipse(x + sx * 12 * s, y - 38 * s + Math.sin(t * 3) * 2, 10 * s, 26 * s, sx * 0.15, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = sp.belly || "#fff";
        c.beginPath();
        c.ellipse(x + sx * 12 * s, y - 38 * s, 5 * s, 18 * s, sx * 0.15, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = sp.color;
      });
      c.fillStyle = sp.color;
      c.beginPath();
      c.ellipse(x + 28 * s, y + 10 * s, 12 * s, 8 * s, 0.4, 0, Math.PI * 2);
      c.fill();
    },
    cat(c, x, y, s, sp) {
      bodyBase(c, x, y, s, sp);
      c.fillStyle = sp.color;
      [[-1, 0], [1, 0]].forEach(([sx]) => {
        c.beginPath();
        c.moveTo(x + sx * 8 * s, y - 30 * s);
        c.lineTo(x + sx * 22 * s, y - 48 * s);
        c.lineTo(x + sx * 26 * s, y - 26 * s);
        c.closePath();
        c.fill();
      });
      c.strokeStyle = "#4a044e";
      c.lineWidth = 1 * s;
      [[-1, 1], [1, 1]].forEach(([sx, sy]) => {
        c.beginPath();
        c.moveTo(x + sx * 10 * s, y + 4 * s);
        c.lineTo(x + sx * 34 * s, y + sy * 2 * s);
        c.stroke();
      });
      c.beginPath();
      c.moveTo(x, y + 14 * s);
      c.lineTo(x + 32 * s, y + 18 * s);
      c.stroke();
    },
    fox(c, x, y, s, sp) {
      bodyBase(c, x, y, s, sp);
      c.fillStyle = sp.color;
      [[-1, 0], [1, 0]].forEach(([sx]) => {
        c.beginPath();
        c.moveTo(x + sx * 10 * s, y - 28 * s);
        c.lineTo(x + sx * 24 * s, y - 50 * s);
        c.lineTo(x + sx * 28 * s, y - 24 * s);
        c.closePath();
        c.fill();
      });
      c.fillStyle = sp.belly || "#fff";
      c.beginPath();
      c.moveTo(x, y - 18 * s);
      c.lineTo(x + 34 * s, y + 6 * s);
      c.lineTo(x, y + 20 * s);
      c.closePath();
      c.fill();
    },
    bear(c, x, y, s, sp) {
      bodyBase(c, x, y + 4 * s, s, sp);
      c.fillStyle = sp.color;
      [[-1, 0], [1, 0]].forEach(([sx]) => {
        c.beginPath();
        c.arc(x + sx * 30 * s, y - 32 * s, 12 * s, 0, Math.PI * 2);
        c.fill();
      });
      c.fillStyle = sp.belly || "#d6d3d1";
      c.beginPath();
      c.ellipse(x, y + 6 * s, 22 * s, 18 * s, 0, 0, Math.PI * 2);
      c.fill();
    },
    hop(c, x, y, s, sp, t) {
      const hop = Math.abs(Math.sin(t * 5)) * 8 * s;
      bodyBase(c, x, y - hop, s, sp);
      c.fillStyle = sp.color;
      [[-1, 0], [1, 0]].forEach(([sx]) => {
        c.beginPath();
        c.ellipse(x + sx * 20 * s, y + 22 * s - hop, 14 * s, 9 * s, 0, 0, Math.PI * 2);
        c.fill();
      });
      if (sp.beak) {
        c.fillStyle = "#f59e0b";
        c.beginPath();
        c.moveTo(x, y - 6 * s - hop);
        c.lineTo(x + 10 * s, y - 2 * s - hop);
        c.lineTo(x, y + 2 * s - hop);
        c.closePath();
        c.fill();
      }
    },
    fly(c, x, y, s, sp, t) {
      const fl = Math.sin(t * 4) * 10 * s;
      c.globalAlpha = 0.45;
      c.fillStyle = "#fff";
      [[-1, 0], [1, 0]].forEach(([sx]) => {
        c.beginPath();
        c.ellipse(x + sx * 44 * s, y - 6 * s + fl, 22 * s, 12 * s, sx * -0.5, 0, Math.PI * 2);
        c.fill();
      });
      c.globalAlpha = 1;
      bodyBase(c, x, y + fl * 0.3, s, sp);
      if (sp.horn) {
        c.fillStyle = "#fbbf24";
        c.beginPath();
        c.moveTo(x - 4 * s, y - 36 * s);
        c.lineTo(x, y - 58 * s);
        c.lineTo(x + 4 * s, y - 36 * s);
        c.closePath();
        c.fill();
      }
    },
    blob(c, x, y, s, sp, t) {
      const sq = Math.sin(t * 2) * 3 * s;
      c.fillStyle = sp.color;
      c.beginPath();
      c.ellipse(x, y + sq, 48 * s, 40 * s, 0, 0, Math.PI * 2);
      c.fill();
      if (sp.eyePatch) {
        c.fillStyle = sp.eyePatch;
        [[-1, 0], [1, 0]].forEach(([sx]) => {
          c.beginPath();
          c.ellipse(x + sx * 14 * s, y - 4 * s, 12 * s, 10 * s, 0, 0, Math.PI * 2);
          c.fill();
        });
      }
      if (sp.topping) {
        c.font = `${28 * s}px serif`;
        c.textAlign = "center";
        c.fillText(sp.topping, x, y - 34 * s);
      }
    },
    mini(c, x, y, s, sp, t) {
      c.fillStyle = sp.color;
      c.beginPath();
      c.arc(x, y + Math.sin(t * 4) * 3 * s, 34 * s, 0, Math.PI * 2);
      c.fill();
      if (sp.glow) {
        c.strokeStyle = sp.glow;
        c.lineWidth = 3 * s;
        c.beginPath();
        c.arc(x, y, 40 * s, 0, Math.PI * 2);
        c.stroke();
      }
    },
  };

  window.MilashkiDraw = {
    draw(c, x, y, sp, t, scale, mood) {
      const s = scale || 1;
      c.save();
      c.fillStyle = "rgba(0,0,0,.1)";
      c.beginPath();
      c.ellipse(x, y + 52 * s, 40 * s, 10 * s, 0, 0, Math.PI * 2);
      c.fill();
      const fn = SHAPES[sp.shape] || SHAPES.blob;
      fn(c, x, y, s, sp, t);
      drawCheeks(c, x, y, s, sp.cheek);
      drawEyes(c, x, y, s, mood || "happy");
      if (sp.emojiMark) {
        c.font = `bold ${14 * s}px Nunito,sans-serif`;
        c.fillStyle = "#4a044e";
        c.textAlign = "center";
        c.fillText(sp.emojiMark, x, y + 56 * s);
      }
      c.font = `bold ${12 * s}px Nunito,sans-serif`;
      c.fillStyle = "#fff";
      const tw = c.measureText(sp.name).width;
      c.fillRect(x - tw / 2 - 6, y + 62 * s, tw + 12, 16 * s);
      c.fillStyle = "#4a044e";
      c.fillText(sp.name, x, y + 73 * s);
      c.restore();
    },
  };
})();
