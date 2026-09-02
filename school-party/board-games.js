/**
 * Настолки клуба друзей: шахматы, шашки, морской бой, крестики, память, хлопки.
 * Режим: hotseat (вдвоём) или vs AI.
 */
(function (global) {
  "use strict";

  var host, statusEl, vsAi = true, current = null, onToast = function () {};

  function setStatus(t) { if (statusEl) statusEl.textContent = t; }
  function clear() { if (host) host.innerHTML = ""; current = null; }

  function toast(m) { onToast(m); }

  /* ——— Крестики-нолики ——— */
  function startXO() {
    clear();
    var board = [0,0,0,0,0,0,0,0,0], turn = 1, over = false;
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
      var pick = empties[Math.floor(Math.random() * empties.length)];
      board[pick] = 2;
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
          board[i] = turn;
          var w = winner(board);
          if (w) { over = true; setStatus(w === 3 ? "Ничья!" : (w === 1 ? "❌ победил!" : "⭕ победил!")); render(); return; }
          if (vsAi && turn === 1) {
            aiMove();
            w = winner(board);
            if (w) { over = true; setStatus(w === 3 ? "Ничья!" : (w === 1 ? "❌ победил!" : "⭕ победил!")); }
            else setStatus("Твой ход ❌");
          } else {
            turn = turn === 1 ? 2 : 1;
            setStatus(turn === 1 ? "Ход ❌" : "Ход ⭕");
          }
          render();
        };
        wrap.appendChild(c);
      });
    }
    host.appendChild(wrap);
    setStatus(vsAi ? "Ты ❌ · компьютер ⭕" : "Ход ❌");
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
      var pick = all[Math.floor(Math.random() * all.length)];
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
            if (vsAi && turn === 2) return;
            if (sel && sel[0] === cx && sel[1] === cy) { sel = null; render(); return; }
            if (isMine(board[cy][cx])) { sel = [cx, cy]; render(); return; }
            if (!sel) return;
            var ms = movesFrom(sel[0], sel[1]);
            var hit = null;
            for (var i = 0; i < ms.length; i++) if (ms[i][0] === cx && ms[i][1] === cy) hit = ms[i];
            if (!hit) return;
            applyMove(sel[0], sel[1], cx, cy, hit[2]);
            sel = null;
            if (vsAi && turn === 2) {
              setStatus("Ход компьютера…");
              render();
              setTimeout(aiTurn, 350);
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
    setStatus(vsAi ? "Ты ⚪ · компьютер 🔴" : "Ход ⚪");
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
      // предпочесть взятие
      all.sort(function (a, b) {
        var ca = board[a[3]][a[2]] ? 1 : 0;
        var cb = board[b[3]][b[2]] ? 1 : 0;
        return cb - ca;
      });
      var pick = all[Math.floor(Math.random() * Math.min(3, all.length))];
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
            if (vsAi && turn === "b") return;
            var piece = board[cy][cx];
            if (sel && sel[0] === cx && sel[1] === cy) { sel = null; render(); return; }
            if (piece && color(piece) === turn) { sel = [cx, cy]; render(); return; }
            if (!sel) return;
            var ok = genMoves(sel[0], sel[1]).some(function (m) { return m[0] === cx && m[1] === cy; });
            if (!ok) return;
            doMove(sel[0], sel[1], cx, cy);
            sel = null;
            if (vsAi && turn === "b") {
              setStatus("Ход компьютера…");
              render();
              setTimeout(aiMove, 280);
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
    setStatus(vsAi ? "Ты белые ♔ · компьютер ♚" : "Ход белых ♔");
    render();
    current = "chess";
  }

  /* ——— Морской бой vs AI ——— */
  function startSea() {
    clear();
    var N = 8;
    function empty() {
      var g = [];
      for (var y = 0; y < N; y++) { g[y] = []; for (var x = 0; x < N; x++) g[y][x] = 0; }
      return g;
    }
    function placeFleet(g) {
      var ships = [4, 3, 3, 2, 2];
      ships.forEach(function (len) {
        var ok = false, tries = 0;
        while (!ok && tries++ < 200) {
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
          if (ok) cells.forEach(function (c) { g[c[1]][c[0]] = 1; });
        }
      });
    }
    var my = empty(), enemy = empty(), fog = empty();
    placeFleet(my); placeFleet(enemy);
    var myTurn = true, over = false;
    var wrap = document.createElement("div");
    var title = document.createElement("p");
    title.style.cssText = "font:800 12px inherit;color:#a5b4fc;text-align:center";
    title.textContent = "Стреляй по верхней карте (враг). Внизу — твои корабли.";
    var enemyBoard = document.createElement("div");
    enemyBoard.className = "board";
    enemyBoard.style.gridTemplateColumns = "repeat(8,1fr)";
    enemyBoard.style.marginBottom = "12px";
    var myBoard = document.createElement("div");
    myBoard.className = "board";
    myBoard.style.gridTemplateColumns = "repeat(8,1fr)";

    function alive(g) {
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (g[y][x] === 1) return true;
      return false;
    }
    function aiShoot() {
      var opts = [];
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (my[y][x] < 2) opts.push([x, y]);
      if (!opts.length) return;
      var p = opts[Math.floor(Math.random() * opts.length)];
      if (my[p[1]][p[0]] === 1) { my[p[1]][p[0]] = 3; toast("💥 В тебя попали!"); }
      else my[p[1]][p[0]] = 2;
      if (!alive(my)) { over = true; setStatus("Корабли потоплены… 😢"); }
      else { myTurn = true; setStatus("Твой выстрел!"); }
      render();
    }
    function render() {
      enemyBoard.innerHTML = "";
      myBoard.innerHTML = "";
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var ec = document.createElement("button");
        ec.type = "button";
        ec.className = "cell sea";
        if (fog[y][x] === 2) { ec.className += " miss"; ec.textContent = "·"; }
        if (fog[y][x] === 3) { ec.className += " hit"; ec.textContent = "💥"; }
        (function (cx, cy) {
          ec.onclick = function () {
            if (over || !myTurn || fog[cy][cx]) return;
            if (enemy[cy][cx] === 1) {
              enemy[cy][cx] = 3; fog[cy][cx] = 3; toast("💥 Попадание!");
            } else { fog[cy][cx] = 2; }
            if (!alive(enemy)) { over = true; setStatus("Победа! Флот врага потоплен 🚢🎉"); render(); return; }
            myTurn = false; setStatus("Ход компьютера…");
            render();
            setTimeout(aiShoot, 400);
          };
        })(x, y);
        enemyBoard.appendChild(ec);

        var mc = document.createElement("button");
        mc.type = "button";
        mc.className = "cell sea";
        if (my[y][x] === 1) { mc.className += " ship"; mc.textContent = "🚢"; }
        if (my[y][x] === 2) { mc.className += " miss"; mc.textContent = "·"; }
        if (my[y][x] === 3) { mc.className += " hit"; mc.textContent = "💥"; }
        myBoard.appendChild(mc);
      }
    }
    wrap.appendChild(title);
    wrap.appendChild(enemyBoard);
    wrap.appendChild(myBoard);
    host.appendChild(wrap);
    setStatus("Твой выстрел по верхней карте!");
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
      vsAi = opts.vsAi !== false;
    },
    setVsAi: function (v) { vsAi = !!v; },
    isVsAi: function () { return vsAi; },
    start: start,
    clear: clear,
  };
})(window);
