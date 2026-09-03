/**
 * Настолки клуба друзей: шахматы, шашки, морской бой, крестики, память, хлопки.
 * Режимы: бот (лёгкий/средний/экстрим) · вдвоём на экране · с другом онлайн.
 */
(function (global) {
  "use strict";

  var host, statusEl, vsAi = true, playMode = "ai", difficulty = 2;
  var current = null, onToast = function () {}, onMove = null, onEnd = null, applyFn = null;
  var powerApi = null;
  var botFrozen = 0;

  function setStatus(t) { if (statusEl) statusEl.textContent = t; }
  function endGame(result) {
    if (typeof onEnd === "function") onEnd(result);
  }
  function clear() {
    if (host) host.innerHTML = "";
    current = null; applyFn = null; powerApi = null; botFrozen = 0;
  }
  function toast(m) { onToast(m); }
  function emit(payload) {
    if (typeof onMove === "function") onMove(payload);
  }
  function useAi() { return playMode === "ai" || (playMode !== "hotseat" && playMode !== "online" && vsAi); }
  function online() { return playMode === "online"; }
  function botMayMove() {
    if (botFrozen > 0) {
      botFrozen--;
      toast("🧊 Бот заморожен · ход пропущен");
      return false;
    }
    return true;
  }

  function pickSmart(empties, board, me, enemy) {
    // экстрим: выиграть / блок; средний: иногда; лёгкий: почти рандом
    var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function findWin(side) {
      for (var i = 0; i < lines.length; i++) {
        var L = lines[i], vals = [board[L[0]], board[L[1]], board[L[2]]];
        var count = vals.filter(function (v) { return v === side; }).length;
        var empty = vals.filter(function (v) { return !v; }).length;
        if (count === 2 && empty === 1) {
          for (var j = 0; j < 3; j++) if (!board[L[j]]) return L[j];
        }
      }
      return -1;
    }
    if (difficulty >= 3) {
      var w = findWin(me); if (w >= 0) return w;
      var b = findWin(enemy); if (b >= 0) return b;
      if (empties.indexOf(4) >= 0) return 4;
    } else if (difficulty === 2 && Math.random() < 0.55) {
      var w2 = findWin(me); if (w2 >= 0) return w2;
      var b2 = findWin(enemy); if (b2 >= 0 && Math.random() < 0.7) return b2;
    }
    return empties[Math.floor(Math.random() * empties.length)];
  }

  /* ——— Крестики-нолики ——— */
  function startXO() {
    clear();
    var board = [0,0,0,0,0,0,0,0,0], turn = 1, over = false;
    var mySide = 1;
    var wrap = document.createElement("div");
    wrap.className = "board xo";
    wrap.style.gridTemplateColumns = "repeat(3,1fr)";
    function winner(b) {
      var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (var i = 0; i < lines.length; i++) {
        var a = lines[i][0], c = lines[i][1], d = lines[i][2];
        if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
      }
      return b.every(Boolean) ? 3 : 0;
    }
    function aiMove() {
      var empties = [];
      for (var i = 0; i < 9; i++) if (!board[i]) empties.push(i);
      if (!empties.length) return;
      var pick = pickSmart(empties, board, 2, 1);
      board[pick] = 2;
    }
    function afterMove() {
      var w = winner(board);
      if (w) {
        over = true;
        setStatus(w === 3 ? "Ничья!" : (w === 1 ? "❌ победил!" : "⭕ победил!"));
        endGame(w === 3 ? "draw" : (w === 1 ? "win" : "lose"));
        render();
        return true;
      }
      return false;
    }
    function render() {
      wrap.innerHTML = "";
      board.forEach(function (v, i) {
        var c = document.createElement("button");
        c.type = "button";
        c.className = "cell";
        c.textContent = v === 1 ? "❌" : v === 2 ? "⭕" : "";
        c.onclick = function () {
          if (over || board[i]) return;
          if (online() && turn !== mySide) { toast("Сейчас ход друга"); return; }
          board[i] = turn;
          emit({ game: "xo", type: "move", i: i, side: turn, board: board.slice() });
          if (afterMove()) return;
          if (useAi() && turn === 1) {
            if (botMayMove()) {
              aiMove();
              if (!afterMove()) setStatus("Твой ход ❌");
            } else {
              turn = 1;
              setStatus("Твой ход ❌ · бот заморожен");
            }
          } else {
            turn = turn === 1 ? 2 : 1;
            setStatus(turn === 1 ? "Ход ❌" : "Ход ⭕");
          }
          render();
        };
        wrap.appendChild(c);
      });
    }
    applyFn = function (data) {
      if (!data || data.game !== "xo") return;
      if (data.type === "move" && typeof data.i === "number" && !board[data.i] && !over) {
        board[data.i] = data.side || turn;
        turn = board[data.i] === 1 ? 2 : 1;
        afterMove();
        if (!over) setStatus(turn === mySide ? "Твой ход!" : "Ход друга…");
        render();
      }
      if (data.type === "start" && data.board) {
        board = data.board.slice();
        turn = data.turn || 1;
        over = false;
        render();
      }
    };
    powerApi = {
      game: "xo",
      teleport: function () {
        if (over) return toast("Игра уже кончилась");
        var empties = [];
        for (var i = 0; i < 9; i++) if (!board[i]) empties.push(i);
        if (!empties.length) return toast("Нет клетки для телепорта");
        var pick = empties[Math.floor(Math.random() * empties.length)];
        board[pick] = 1;
        toast("🌀 Астральный телепорт!");
        afterMove();
        render();
      },
      disintegrate: function () {
        for (var i = 0; i < 9; i++) if (board[i] === 2) board[i] = 0;
        toast("☢️ Распыление кругов!");
        render();
      },
      freeze: function () {
        botFrozen = 3;
        toast("🧊 Заморозка бота ×3");
      },
      foresight: function () {
        var empties = [];
        for (var i = 0; i < 9; i++) if (!board[i]) empties.push(i);
        var pick = pickSmart(empties, board, 1, 2);
        if (pick < 0) return;
        board[pick] = 1;
        toast("🔮 Предвидение — лучший ход!");
        afterMove();
        render();
      },
      chaos: function () {
        for (var i = 0; i < 9; i++) if (board[i] === 2 && Math.random() < 0.7) board[i] = 0;
        toast("🌊 Волна хаоса!");
        render();
      },
      throne: function () {
        over = true;
        board = [1,1,1,0,1,0,0,0,0];
        setStatus("👑 Трон хозяина — ❌ победил!");
        toast("👑 Победа силой трона!");
        endGame("win");
        render();
      },
      rift: function () {
        over = true;
        setStatus("⚡ Ты победил! Можно сыграть заново");
        toast("⚡ Победа!");
        endGame("win");
        render();
      },
    };
    host.appendChild(wrap);
    setStatus(useAi() ? ("Ты ❌ · бот ⭕ (" + (difficulty === 1 ? "лёгкий" : difficulty === 3 ? "экстрим" : "средний") + ")") : online() ? "С другом онлайн · ход ❌" : "Ход ❌");
    render();
    current = "xo";
  }

  /* ——— Память ——— */
  function startMemory() {
    clear();
    var icons = ["🐶","🐱","🦊","🐻","🐼","🐸","🦄","🐙"];
    var cards = icons.concat(icons).sort(function () { return Math.random() - 0.5; });
    var open = [], done = {}, lock = false, moves = 0;
    var wrap = document.createElement("div");
    wrap.className = "board memory";
    wrap.style.gridTemplateColumns = "repeat(4,1fr)";
    function render() {
      wrap.innerHTML = "";
      cards.forEach(function (ico, i) {
        var c = document.createElement("button");
        c.type = "button";
        c.className = "cell" + (done[i] ? " done" : open.indexOf(i) >= 0 ? " open" : "");
        c.textContent = done[i] || open.indexOf(i) >= 0 ? ico : "❓";
        c.onclick = function () {
          if (lock || done[i] || open.indexOf(i) >= 0) return;
          open.push(i);
          render();
          if (open.length === 2) {
            moves++;
            lock = true;
            var a = open[0], b = open[1];
            if (cards[a] === cards[b]) {
              done[a] = true; done[b] = true; open = []; lock = false;
              setStatus("Ходов: " + moves + (Object.keys(done).length === 16 ? " · 🎉 Все пары!" : ""));
              render();
            } else {
              setTimeout(function () { open = []; lock = false; render(); setStatus("Ходов: " + moves); }, 650);
            }
          }
        };
        wrap.appendChild(c);
      });
    }
    host.appendChild(wrap);
    setStatus("Найди пары!");
    render();
    current = "memory";
  }

  /* ——— Хлоп-хлоп ——— */
  function startTap() {
    clear();
    var score = 0, left = 10, timer = null;
    var arena = document.createElement("div");
    arena.className = "tap-arena";
    arena.textContent = "👏";
    var running = false;
    arena.onclick = function () {
      if (!running) {
        running = true; score = 0; left = 10;
        setStatus("10 секунд! Жми!");
        timer = setInterval(function () {
          left--;
          if (left <= 0) {
            clearInterval(timer); running = false;
            setStatus("Итог: " + score + " хлопков! 🎉");
            arena.textContent = "👏 " + score;
          } else setStatus("⏱ " + left + " · " + score);
        }, 1000);
      }
      if (running) { score++; arena.textContent = "👏 " + score; }
    };
    host.appendChild(arena);
    setStatus("Нажми арену, чтобы начать");
    current = "tap";
  }

  /* ——— Шашки (упрощённые) ——— */
  function startCheckers() {
    clear();
    var N = 8, board = [], sel = null, turn = 1; // 1 white, 2 black
    for (var y = 0; y < N; y++) {
      board[y] = [];
      for (var x = 0; x < N; x++) {
        var dark = (x + y) % 2 === 1;
        board[y][x] = 0;
        if (dark && y < 3) board[y][x] = 2;
        if (dark && y > 4) board[y][x] = 1;
      }
    }
    var wrap = document.createElement("div");
    wrap.className = "board";
    wrap.style.gridTemplateColumns = "repeat(8,1fr)";

    function piece(v) {
      if (v === 1) return "⚪";
      if (v === 2) return "🔴";
      if (v === 3) return "⬜";
      if (v === 4) return "🟥";
      return "";
    }
    function isMine(v) {
      return turn === 1 ? (v === 1 || v === 3) : (v === 2 || v === 4);
    }
    function movesFrom(x, y) {
      var v = board[y][x], out = [], dirs = [];
      var king = v === 3 || v === 4;
      if (v === 1 || v === 3) dirs = king ? [[-1,-1],[1,-1],[-1,1],[1,1]] : [[-1,-1],[1,-1]];
      if (v === 2 || v === 4) dirs = king ? [[-1,-1],[1,-1],[-1,1],[1,1]] : [[-1,1],[1,1]];
      dirs.forEach(function (d) {
        var nx = x + d[0], ny = y + d[1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        if (!board[ny][nx]) out.push([nx, ny, null]);
        else {
          var enemy = turn === 1 ? (board[ny][nx] === 2 || board[ny][nx] === 4) : (board[ny][nx] === 1 || board[ny][nx] === 3);
          var jx = nx + d[0], jy = ny + d[1];
          if (enemy && jx >= 0 && jy >= 0 && jx < N && jy < N && !board[jy][jx]) out.push([jx, jy, [nx, ny]]);
        }
      });
      return out;
    }
    function applyMove(fx, fy, tx, ty, cap) {
      var v = board[fy][fx];
      board[fy][fx] = 0;
      if (cap) board[cap[1]][cap[0]] = 0;
      if (v === 1 && ty === 0) v = 3;
      if (v === 2 && ty === 7) v = 4;
      board[ty][tx] = v;
      turn = turn === 1 ? 2 : 1;
    }
    function aiTurn() {
      var all = [];
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        if (!isMine(board[y][x])) continue;
        movesFrom(x, y).forEach(function (m) { all.push([x, y, m[0], m[1], m[2]]); });
      }
      if (!all.length) { setStatus("⚪ победили!"); return; }
      // лёгкий — случайно; средний/экстрим — чаще бить
      all.sort(function (a, b) {
        var ca = a[4] ? 2 : 0;
        var cb = b[4] ? 2 : 0;
        return cb - ca;
      });
      var pool = difficulty >= 2 ? all.slice(0, Math.max(1, Math.ceil(all.length * (difficulty === 3 ? 0.25 : 0.5)))) : all;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      applyMove(pick[0], pick[1], pick[2], pick[3], pick[4]);
      setStatus("Твой ход ⚪");
      render();
    }
    function render() {
      wrap.innerHTML = "";
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var c = document.createElement("button");
        c.type = "button";
        c.className = "cell " + ((x + y) % 2 ? "dark" : "light");
        if (sel && sel[0] === x && sel[1] === y) c.className += " sel";
        c.textContent = piece(board[y][x]);
        (function (cx, cy) {
          c.onclick = function () {
            if (useAi() && turn === 2) return;
            if (sel && sel[0] === cx && sel[1] === cy) { sel = null; render(); return; }
            if (isMine(board[cy][cx])) { sel = [cx, cy]; render(); return; }
            if (!sel) return;
            var ms = movesFrom(sel[0], sel[1]);
            var hit = null;
            for (var i = 0; i < ms.length; i++) if (ms[i][0] === cx && ms[i][1] === cy) hit = ms[i];
            if (!hit) return;
            applyMove(sel[0], sel[1], cx, cy, hit[2]);
            emit({ game: "checkers", type: "move", fx: sel[0], fy: sel[1], tx: cx, ty: cy, cap: hit[2] });
            sel = null;
            if (useAi() && turn === 2) {
              if (botMayMove()) {
                setStatus("Ход бота…");
                render();
                setTimeout(aiTurn, difficulty === 1 ? 200 : 350);
              } else {
                turn = 1;
                setStatus("Твой ход ⚪ · бот заморожен");
                render();
              }
            } else {
              setStatus(turn === 1 ? "Ход ⚪" : "Ход 🔴");
              render();
            }
          };
        })(x, y);
        wrap.appendChild(c);
      }
    }
    host.appendChild(wrap);
    powerApi = {
      game: "checkers",
      teleport: function () {
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          if (board[y][x] === 1) { board[y][x] = 0; board[Math.max(0, y - 2)][x] = 1; toast("🌀 Телепорт вперёд!"); render(); return; }
        }
      },
      disintegrate: function () {
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          if (board[y][x] === 2 || board[y][x] === 4) board[y][x] = 0;
        }
        toast("☢️ Все красные распылены!");
        render();
      },
      freeze: function () { botFrozen = 3; toast("🧊 Бот заморожен ×3"); },
      foresight: function () {
        turn = 1;
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          if (board[y][x] === 1 || board[y][x] === 3) {
            var ms = movesFrom(x, y);
            if (ms.length) {
              applyMove(x, y, ms[0][0], ms[0][1], ms[0][2]);
              toast("🔮 Автоход по предвидению!");
              render();
              return;
            }
          }
        }
      },
      chaos: function () {
        var n = 0;
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          if ((board[y][x] === 2 || board[y][x] === 4) && Math.random() < 0.5) { board[y][x] = 0; n++; }
        }
        toast("🌊 Хаос снёс " + n + " врагов");
        render();
      },
      throne: function () {
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          if (board[y][x] === 1) board[y][x] = 3;
          if (board[y][x] === 2 || board[y][x] === 4) board[y][x] = 0;
        }
        toast("👑 Победа на троне!");
        setStatus("👑 ⚪ победили!");
        endGame("win");
        render();
      },
      rift: function () {
        setStatus("⚡ Ты победил! Жми Заново");
        toast("⚡ Победа!");
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          if (board[y][x] === 2 || board[y][x] === 4) board[y][x] = 0;
        }
        endGame("win");
        render();
      },
    };
    setStatus(useAi() ? ("Ты ⚪ · бот 🔴 (" + (difficulty === 1 ? "лёгкий" : difficulty === 3 ? "экстрим" : "средний") + ")") : "Ход ⚪");
    render();
    current = "checkers";
  }

  /* ——— Шахматы (упрощённые ходы) ——— */
  var CHESS = {
    "wK": "♔", "wQ": "♕", "wR": "♖", "wB": "♗", "wN": "♘", "wP": "♙",
    "bK": "♚", "bQ": "♛", "bR": "♜", "bB": "♝", "bN": "♞", "bP": "♟"
  };
  function startChess() {
    clear();
    var start = [
      ["bR","bN","bB","bQ","bK","bB","bN","bR"],
      ["bP","bP","bP","bP","bP","bP","bP","bP"],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ["wP","wP","wP","wP","wP","wP","wP","wP"],
      ["wR","wN","wB","wQ","wK","wB","wN","wR"]
    ];
    var board = start.map(function (r) { return r.slice(); });
    var turn = "w", sel = null;
    var wrap = document.createElement("div");
    wrap.className = "board";
    wrap.style.gridTemplateColumns = "repeat(8,1fr)";

    function color(p) { return p ? p[0] : null; }
    function kind(p) { return p ? p[1] : null; }
    function inb(x, y) { return x >= 0 && y >= 0 && x < 8 && y < 8; }

    function genMoves(x, y) {
      var p = board[y][x]; if (!p) return [];
      var c = color(p), k = kind(p), out = [], enemy = c === "w" ? "b" : "w";
      function ray(dx, dy) {
        var nx = x + dx, ny = y + dy;
        while (inb(nx, ny)) {
          if (!board[ny][nx]) out.push([nx, ny]);
          else { if (color(board[ny][nx]) === enemy) out.push([nx, ny]); break; }
          nx += dx; ny += dy;
        }
      }
      if (k === "P") {
        var dir = c === "w" ? -1 : 1;
        var startRow = c === "w" ? 6 : 1;
        if (inb(x, y + dir) && !board[y + dir][x]) {
          out.push([x, y + dir]);
          if (y === startRow && !board[y + 2 * dir][x]) out.push([x, y + 2 * dir]);
        }
        [[-1, dir], [1, dir]].forEach(function (d) {
          var nx = x + d[0], ny = y + d[1];
          if (inb(nx, ny) && board[ny][nx] && color(board[ny][nx]) === enemy) out.push([nx, ny]);
        });
      }
      if (k === "N") {
        [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(function (d) {
          var nx = x + d[0], ny = y + d[1];
          if (!inb(nx, ny)) return;
          if (!board[ny][nx] || color(board[ny][nx]) === enemy) out.push([nx, ny]);
        });
      }
      if (k === "B" || k === "Q") { ray(1,1); ray(1,-1); ray(-1,1); ray(-1,-1); }
      if (k === "R" || k === "Q") { ray(1,0); ray(-1,0); ray(0,1); ray(0,-1); }
      if (k === "K") {
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var nx = x + dx, ny = y + dy;
          if (!inb(nx, ny)) continue;
          if (!board[ny][nx] || color(board[ny][nx]) === enemy) out.push([nx, ny]);
        }
      }
      return out;
    }

    function doMove(fx, fy, tx, ty) {
      var p = board[fy][fx];
      board[fy][fx] = null;
      if (kind(p) === "P" && (ty === 0 || ty === 7)) p = color(p) + "Q";
      board[ty][tx] = p;
      turn = turn === "w" ? "b" : "w";
    }

    function aiMove() {
      var all = [];
      for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
        if (color(board[y][x]) !== "b") continue;
        genMoves(x, y).forEach(function (m) { all.push([x, y, m[0], m[1]]); });
      }
      if (!all.length) { setStatus("Белые победили! 🎉"); return; }
      all.sort(function (a, b) {
        var ca = board[a[3]][a[2]] ? 1 : 0;
        var cb = board[b[3]][b[2]] ? 1 : 0;
        if (difficulty >= 3) {
          // чуть умнее: бить дорогие фигуры
          var score = function (m) {
            var p = board[m[3]][m[2]];
            if (!p) return 0;
            return ({ P: 1, N: 3, B: 3, R: 5, Q: 9, K: 99 }[p[1]] || 0);
          };
          return score(b) - score(a);
        }
        return cb - ca;
      });
      var top = difficulty === 1 ? all : all.slice(0, Math.max(1, Math.ceil(all.length * (difficulty === 3 ? 0.2 : 0.4))));
      var pick = top[Math.floor(Math.random() * top.length)];
      doMove(pick[0], pick[1], pick[2], pick[3]);
      setStatus("Твой ход ♔");
      render();
    }

    function render() {
      wrap.innerHTML = "";
      for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
        var c = document.createElement("button");
        c.type = "button";
        c.className = "cell " + ((x + y) % 2 ? "dark" : "light");
        if (sel && sel[0] === x && sel[1] === y) c.className += " sel";
        var p = board[y][x];
        c.textContent = p ? CHESS[p] : "";
        (function (cx, cy) {
          c.onclick = function () {
            if (useAi() && turn === "b") return;
            var piece = board[cy][cx];
            if (sel && sel[0] === cx && sel[1] === cy) { sel = null; render(); return; }
            if (piece && color(piece) === turn) { sel = [cx, cy]; render(); return; }
            if (!sel) return;
            var ok = genMoves(sel[0], sel[1]).some(function (m) { return m[0] === cx && m[1] === cy; });
            if (!ok) return;
            var fx = sel[0], fy = sel[1];
            doMove(fx, fy, cx, cy);
            emit({ game: "chess", type: "move", fx: fx, fy: fy, tx: cx, ty: cy });
            sel = null;
            if (useAi() && turn === "b") {
              if (botMayMove()) {
                setStatus("Ход бота…");
                render();
                setTimeout(aiMove, difficulty === 1 ? 180 : 280);
              } else {
                turn = "w";
                setStatus("Твой ход ♔ · бот заморожен");
                render();
              }
            } else {
              setStatus(turn === "w" ? "Ход белых ♔" : "Ход чёрных ♚");
              render();
            }
          };
        })(x, y);
        wrap.appendChild(c);
      }
    }
    host.appendChild(wrap);
    powerApi = {
      game: "chess",
      teleport: function () {
        for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
          if (board[y][x] === "wQ") {
            board[y][x] = null;
            board[3][3] = "wQ";
            toast("🌀 Ферзь телепортирован в центр!");
            render();
            return;
          }
        }
        toast("Нет ферзя — призван новый!");
        board[4][4] = "wQ";
        render();
      },
      disintegrate: function () {
        for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
          if (board[y][x] && board[y][x][0] === "b" && board[y][x] !== "bK") board[y][x] = null;
        }
        toast("☢️ Чёрные (кроме короля) распылены!");
        render();
      },
      freeze: function () { botFrozen = 3; toast("🧊 Бот заморожен ×3"); },
      foresight: function () {
        var all = [];
        for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
          if (color(board[y][x]) !== "w") continue;
          genMoves(x, y).forEach(function (m) { all.push([x, y, m[0], m[1]]); });
        }
        all.sort(function (a, b) {
          return (board[b[3]][b[2]] ? 1 : 0) - (board[a[3]][a[2]] ? 1 : 0);
        });
        if (!all.length) return;
        doMove(all[0][0], all[0][1], all[0][2], all[0][3]);
        turn = "w";
        toast("🔮 Предвидение сыграло лучший ход!");
        render();
      },
      chaos: function () {
        var n = 0;
        for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
          if (board[y][x] && board[y][x][0] === "b" && board[y][x] !== "bK" && Math.random() < 0.45) {
            board[y][x] = null; n++;
          }
        }
        toast("🌊 Хаос убрал " + n + " фигур");
        render();
      },
      throne: function () {
        for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
          if (board[y][x] === "wP") board[y][x] = "wQ";
        }
        board[0][4] = null;
        toast("👑 Победа!");
        setStatus("👑 Ты победил! Жми Заново");
        endGame("win");
        render();
      },
      rift: function () {
        for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
          if (board[y][x] && board[y][x][0] === "b") board[y][x] = null;
        }
        setStatus("⚡ Ты победил! Жми Заново");
        toast("⚡ Победа!");
        endGame("win");
        render();
      },
    };
    setStatus(useAi() ? ("Ты белые ♔ · бот (" + (difficulty === 1 ? "лёгкий" : difficulty === 3 ? "экстрим" : "средний") + ")") : "Ход белых ♔");
    render();
    current = "chess";
  }

  /* ——— Морской бой: мини-кораблики, волны, бой идёт дальше ——— */
  function startSea() {
    clear();
    var N = 8;
    var wave = 1;
    var maxWaves = 3;
    var sunkCount = 0;
    var friendTroll = playMode === "online" || playMode === "hotseat";

    function empty() {
      var g = [];
      for (var y = 0; y < N; y++) { g[y] = []; for (var x = 0; x < N; x++) g[y][x] = 0; }
      return g;
    }
    // cell: 0 empty, >0 shipId, -1 miss, -2 hit on ship
    function placeFleet(g) {
      // много одиночных мини + чуть двойных
      var ships = [1, 1, 1, 1, 1, 1, 2, 2, 1];
      var nextId = 1;
      ships.forEach(function (len) {
        var ok = false, tries = 0;
        while (!ok && tries++ < 250) {
          var horiz = Math.random() < 0.5;
          var x = Math.floor(Math.random() * N);
          var y = Math.floor(Math.random() * N);
          var cells = [];
          ok = true;
          for (var i = 0; i < len; i++) {
            var cx = x + (horiz ? i : 0), cy = y + (horiz ? 0 : i);
            if (cx >= N || cy >= N || g[cy][cx]) { ok = false; break; }
            cells.push([cx, cy]);
          }
          if (ok) {
            var id = nextId++;
            cells.forEach(function (c) { g[c[1]][c[0]] = id; });
          }
        }
      });
    }
    function shipCellsLeft(g, id) {
      var n = 0;
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (g[y][x] === id) n++;
      return n;
    }
    function aliveCount(g) {
      var seen = {};
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        if (g[y][x] > 0) seen[g[y][x]] = true;
      }
      return Object.keys(seen).length;
    }
    function spawnMini(g) {
      var tries = 0;
      while (tries++ < 80) {
        var x = Math.floor(Math.random() * N);
        var y = Math.floor(Math.random() * N);
        if (g[y][x] === 0) {
          var maxId = 0;
          for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) {
            if (g[yy][xx] > maxId) maxId = g[yy][xx];
          }
          g[y][x] = maxId + 1;
          return true;
        }
      }
      return false;
    }

    var my = empty(), enemy = empty(), fog = empty(); // fog: 0 unknown, 1 miss, 2 hit
    placeFleet(my); placeFleet(enemy);
    var myTurn = true, over = false;
    var wrap = document.createElement("div");
    var title = document.createElement("p");
    title.style.cssText = "font:800 12px inherit;color:#a5b4fc;text-align:center";
    title.textContent = "Мини-кораблики · волна " + wave + "/" + maxWaves + " · потопил один — бой идёт дальше!";
    var enemyBoard = document.createElement("div");
    enemyBoard.className = "board";
    enemyBoard.style.gridTemplateColumns = "repeat(8,1fr)";
    enemyBoard.style.marginBottom = "12px";
    var myBoard = document.createElement("div");
    myBoard.className = "board";
    myBoard.style.gridTemplateColumns = "repeat(8,1fr)";

    function startNextWave() {
      if (wave >= maxWaves) {
        over = true;
        setStatus("🎉 Все волны пройдены! Жми Заново");
        endGame("win");
        return;
      }
      wave++;
      enemy = empty();
      fog = empty();
      placeFleet(enemy);
      // подбросить пару мини
      spawnMini(enemy); spawnMini(enemy);
      title.textContent = "Мини-кораблики · волна " + wave + "/" + maxWaves + " · дальше!";
      toast("🌊 Новая волна мини-корабликов!");
      myTurn = true;
      setStatus("Волна " + wave + " · твой выстрел!");
      render();
    }

    function onEnemyHit(cx, cy) {
      var id = enemy[cy][cx];
      enemy[cy][cx] = 0;
      fog[cy][cx] = 2;
      if (id > 0 && shipCellsLeft(enemy, id) === 0) {
        sunkCount++;
        toast("🚢 Мини-кораблик потоплен! Бой идёт дальше · потоплено: " + sunkCount);
        // иногда появляется ещё один мини — чтобы не «всё кончилось»
        if (aliveCount(enemy) <= 2 && wave < maxWaves) {
          spawnMini(enemy);
          toast("✨ Выплыл ещё один мини-кораблик!");
        }
      } else {
        toast("💥 Попадание!");
      }
      if (aliveCount(enemy) === 0) {
        toast("🌊 Флот волны потоплен — дальше!");
        setTimeout(startNextWave, 700);
        return true;
      }
      return false;
    }

    function aiShoot() {
      if (over) return;
      var opts = [];
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        if (my[y][x] >= 0 && my[y][x] !== -1 && my[y][x] !== -2) {
          // still need track shots on my board - use parallel shot map
        }
      }
      // myShot: separate - simplify: cells with value -1 miss -2 hit, >0 ship
      opts = [];
      for (var y2 = 0; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) {
        if (my[y2][x2] !== -1 && my[y2][x2] !== -2) opts.push([x2, y2]);
      }
      if (!opts.length) {
        over = true;
        setStatus("😢 Все твои кораблики… Жми Заново");
        endGame("lose");
        render();
        return;
      }
      var p = opts[Math.floor(Math.random() * opts.length)];
      var v = my[p[1]][p[0]];
      if (v > 0) {
        var sid = v;
        my[p[1]][p[0]] = -2;
        toast("💥 В тебя попали!");
        if (shipCellsLeft(my, sid) === 0) {
          toast("🚢 Твой мини-кораблик потоплен — продолжаем!");
          if (aliveCount(my) === 0) {
            // дать ещё мини, если не последняя волна поражения
            if (spawnMini(my)) toast("✨ Тебе выплыл запасной мини!");
            else {
              over = true;
              setStatus("😢 Флот кончился · Заново?");
              endGame("lose");
            }
          }
        }
      } else {
        my[p[1]][p[0]] = -1;
      }
      if (!over) { myTurn = true; setStatus("Твой выстрел!"); }
      render();
    }

    function render() {
      enemyBoard.innerHTML = "";
      myBoard.innerHTML = "";
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var ec = document.createElement("button");
        ec.type = "button";
        ec.className = "cell sea";
        if (fog[y][x] === 1) { ec.className += " miss"; ec.textContent = "·"; }
        if (fog[y][x] === 2) { ec.className += " hit"; ec.textContent = "💥"; }
        (function (cx, cy) {
          ec.onclick = function () {
            if (over || !myTurn || fog[cy][cx]) return;
            if (enemy[cy][cx] > 0) {
              var waveDone = onEnemyHit(cx, cy);
              emit({ game: "sea", type: "shot", x: cx, y: cy, hit: true });
              if (waveDone) { render(); return; }
            } else {
              fog[cy][cx] = 1;
              toast("🌊 Мимо");
              emit({ game: "sea", type: "shot", x: cx, y: cy, hit: false });
            }
            myTurn = false;
            setStatus(useAi() ? "Ход бота…" : "Ход друга / следующий…");
            render();
            if (useAi()) setTimeout(aiShoot, 380);
            else {
              // вдвоём на экране — сразу можно снова (один экран)
              myTurn = true;
              setStatus("Следующий выстрел!");
            }
        })(x, y);
        enemyBoard.appendChild(ec);

        var mc = document.createElement("button");
        mc.type = "button";
        mc.className = "cell sea";
        if (my[y][x] > 0) { mc.className += " ship"; mc.textContent = "🚤"; }
        if (my[y][x] === -1) { mc.className += " miss"; mc.textContent = "·"; }
        if (my[y][x] === -2) { mc.className += " hit"; mc.textContent = "💥"; }
        myBoard.appendChild(mc);
      }
    }

    wrap.appendChild(title);
    wrap.appendChild(enemyBoard);
    wrap.appendChild(myBoard);
    host.appendChild(wrap);

    powerApi = {
      game: "sea",
      freeze: function () {
        botFrozen = friendTroll ? 2 : 4;
        toast(friendTroll ? "🧊 Другу запрещён ход (шутка)!" : "🧊 Бот спит");
        if (friendTroll) emit({ game: "sea", type: "troll", kind: "freeze" });
      },
      chaos: function () {
        // мягкий тролль: открыть 2 случайные пустые / или сдвинуть туман
        var opened = 0;
        for (var y = 0; y < N && opened < 3; y++) for (var x = 0; x < N && opened < 3; x++) {
          if (!fog[y][x] && enemy[y][x] <= 0 && Math.random() < 0.4) {
            fog[y][x] = 1; opened++;
          }
        }
        toast(friendTroll ? "🤡 Троллёк: в тумане дырки!" : "🌊 Чуть приоткрыло море");
        if (friendTroll) emit({ game: "sea", type: "troll", kind: "chaos" });
        render();
      },
      boo: function () {
        toast("👻 Бууу! (просто шутка, не страшно)");
        setStatus("👻 Испуг! …а теперь снова играем");
        if (friendTroll) emit({ game: "sea", type: "troll", kind: "boo", text: "👻 Бууу от Амаля! Не бойся, шутка 😄" });
      },
      giggle: function () {
        toast("😂 Ха-ха, я тебя троллю по-доброму!");
        if (friendTroll) emit({ game: "sea", type: "troll", kind: "giggle", text: "😂 Амаль над тобой смеётся (по-дружески)" });
      },
      skip: function () {
        myTurn = true;
        botFrozen = Math.max(botFrozen, 1);
        toast("🚫 Ход врага отменён (тролль)");
        setStatus("Твой выстрел снова!");
        if (friendTroll) emit({ game: "sea", type: "troll", kind: "skip" });
      },
      minispawn: function () {
        spawnMini(enemy);
        toast("🚤 Добавил мини-кораблик врагу — бой длиннее!");
        render();
      },
      // старые кнопки из UI
      rift: function () {
        toast("⚡ Не бахаем всех сразу — лучше волны. Вот тебе мини!");
        spawnMini(my);
        myTurn = true;
        render();
      },
    };

    var _aiShoot = aiShoot;
    aiShoot = function () {
      if (!botMayMove()) { myTurn = true; setStatus("Твой выстрел!"); render(); return; }
      _aiShoot();
    };

    applyFn = function (data) {
      if (!data || data.game !== "sea") return;
      if (data.type === "troll") {
        if (data.kind === "boo" || data.kind === "giggle") toast(data.text || "🤡 Троллёк!");
        if (data.kind === "freeze" || data.kind === "skip") {
          botFrozen = 2;
          toast("🧊 Тебе шуточно запретили ход");
        }
      }
    };

    setStatus("Волна 1 · стреляй по мини-корабликам сверху!");
    render();
    current = "sea";
  }

  function start(name) {
    if (name === "chess") startChess();
    else if (name === "checkers") startCheckers();
    else if (name === "sea") startSea();
    else if (name === "xo") startXO();
    else if (name === "memory") startMemory();
    else if (name === "tap") startTap();
  }

  global.ClubBoardGames = {
    mount: function (opts) {
      host = opts.host;
      statusEl = opts.status;
      onToast = opts.toast || function () {};
      onMove = opts.onMove || null;
      onEnd = opts.onEnd || null;
      if (opts.mode) playMode = opts.mode;
      if (opts.difficulty) difficulty = opts.difficulty;
      vsAi = playMode === "ai";
    },
    setVsAi: function (v) {
      vsAi = !!v;
      playMode = v ? "ai" : "hotseat";
    },
    isVsAi: function () { return playMode === "ai"; },
    setMode: function (m) {
      playMode = m === "online" ? "online" : m === "hotseat" ? "hotseat" : "ai";
      vsAi = playMode === "ai";
    },
    getMode: function () { return playMode; },
    setDifficulty: function (d) {
      difficulty = d === 1 || d === 3 ? d : 2;
    },
    getDifficulty: function () { return difficulty; },
    applyRemote: function (data) {
      if (applyFn) applyFn(data);
    },
    current: function () { return current; },
    usePower: function (id) {
      if (!powerApi || typeof powerApi[id] !== "function") {
        toast("Эта сила сейчас недоступна");
        return false;
      }
      powerApi[id]();
      return true;
    },
    hasPowers: function () { return !!powerApi; },
    start: start,
    clear: clear,
  };
})(window);
