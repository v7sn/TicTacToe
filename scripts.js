const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const newBtn = document.getElementById("newGame");
const resetBtn = document.getElementById("resetScore");
const choose = document.getElementById("choose");
const chooseBtns = [...choose.querySelectorAll("button[data-symbol]")];
const youWinsEl = document.getElementById("youWins");
const aiWinsEl = document.getElementById("aiWins");
const drawsEl = document.getElementById("draws");
const winLineEl = document.getElementById("line");
let rows = 3,
  cols = 3,
  board = [],
  cells = [],
  you = "X",
  ai = "O",
  turn = "you",
  gameOver = false,
  extensionUsed = false,
  locked = false,
  lastCell = null,
  focusIndex = 0;

function loadScore() {
  const s = JSON.parse(
    localStorage.getItem("xoScore") || '{"you":0,"ai":0,"draw":0}'
  );
  youWinsEl.textContent = s.you;
  aiWinsEl.textContent = s.ai;
  drawsEl.textContent = s.draw;
}

function saveScore(p) {
  const s = JSON.parse(
    localStorage.getItem("xoScore") || '{"you":0,"ai":0,"draw":0}'
  );
  if (p === "you") s.you++;
  else if (p === "ai") s.ai++;
  else s.draw++;
  localStorage.setItem("xoScore", JSON.stringify(s));
  loadScore();
}

function resetScore() {
  localStorage.setItem("xoScore", JSON.stringify({ you: 0, ai: 0, draw: 0 }));
  loadScore();
}

function makeBoard() {
  board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push("");
    board.push(row);
  }
}

function buildGrid() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = cols - 1; c >= 0; c--) {
      const idx = r * cols + (cols - 1 - c);
      const d = document.createElement("button");
      d.className = "cell";
      d.setAttribute("data-r", r);
      d.setAttribute("data-c", c);
      d.tabIndex = 0;
      d.addEventListener("click", () => cellClick(r, c, d));
      d.addEventListener("mousemove", () => (focusIndex = idx));
      boardEl.appendChild(d);
      cells.push(d);
    }
  }
}

function setStatus(t) {
  statusEl.textContent = t;
}

function startRound(keepSymbol) {
  rows = 3;
  cols = 3;
  extensionUsed = false;
  gameOver = false;
  locked = false;
  winLineEl.classList.remove("show");
  winLineEl.style.cssText = "";
  makeBoard();
  buildGrid();
  updateGridUI();
  setStatus(turn === "you" ? "دورك" : "دور الذكاء الاصطناعي");
  if (!keepSymbol) {
    choose.classList.remove("hidden");
    locked = true;
  } else {
    locked = false;
    if (ai === "X") aiPlay();
  }
}

function updateGridUI() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + (cols - 1 - c);
      if (idx >= cells.length || idx < 0) continue;

      const v = board[r][c];
      const el = cells[idx];
      el.textContent = v;
      el.classList.toggle("me", v === you);
      el.classList.toggle("ai", v === ai);
      el.classList.toggle(
        "disabled",
        locked || gameOver || turn !== "you" || v !== ""
      );
    }
  }
}

function cellClick(r, c, el) {
  if (locked || gameOver || turn !== "you") return;
  if (board[r][c] !== "") return;
  place(r, c, you, el);
  const w = checkWin();
  if (w) {
    finish("you", w);
    return;
  }
  if (isFull()) {
    if (!extensionUsed) {
      extendPhase();
      return;
    } else {
      finish("draw");
      return;
    }
  }
  turn = "ai";
  setStatus("دور الذكاء الاصطناعي");
  locked = true;
  setTimeout(aiPlay, 120);
}

function place(r, c, who, el) {
  board[r][c] = who;
  el = el || cells[r * cols + (cols - 1 - c)];
  if (lastCell) lastCell.classList.remove("last");
  el.textContent = who;
  el.classList.add(who === you ? "me" : "ai");
  el.classList.add("last");
  lastCell = el;
}

function isFull() {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (board[r][c] === "") return false;
  return true;
}

function checkWin() {
  // فحص الصفوف
  for (let r = 0; r < rows; r++)
    for (let c = 0; c <= cols - 3; c++) {
      const a = board[r][c],
        b = board[r][c + 1],
        d = board[r][c + 2];
      if (a && a === b && a === d)
        return [
          [r, c],
          [r, c + 2],
        ];
    }
  // فحص الأعمدة
  for (let c = 0; c < cols; c++) {
    const a = board[0][c],
      b = board[1][c],
      d = board[2][c];
    if (a && a === b && a === d)
      return [
        [0, c],
        [2, c],
      ];
  }
  // فحص القطر الرئيسي
  for (let c = 0; c <= cols - 3; c++) {
    const a = board[0][c],
      b = board[1][c + 1],
      d = board[2][c + 2];
    if (a && a === b && a === d)
      return [
        [0, c],
        [2, c + 2],
      ];
  }
  // فحص القطر الثانوي
  for (let c = 0; c <= cols - 3; c++) {
    const a = board[2][c],
      b = board[1][c + 1],
      d = board[0][c + 2];
    if (a && a === b && a === d)
      return [
        [2, c],
        [0, c + 2],
      ];
  }
  return null;
}

function drawWinLine(points) {
  if (!boardEl || !boardEl.isConnected) return;

  const p1 = points[0];
  const p2 = points[1];

  const cell1 = cells[p1[0] * cols + (cols - 1 - p1[1])];
  const cell2 = cells[p2[0] * cols + (cols - 1 - p2[1])];

  if (!cell1 || !cell2) return;

  const boardRect = boardEl.getBoundingClientRect();
  const rect1 = cell1.getBoundingClientRect();
  const rect2 = cell2.getBoundingClientRect();

  const centerX1 = rect1.left + rect1.width / 2;
  const centerY1 = rect1.top + rect1.height / 2;
  const centerX2 = rect2.left + rect2.width / 2;
  const centerY2 = rect2.top + rect2.height / 2;

  const length = Math.sqrt(
    Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
  );

  const angle =
    (Math.atan2(centerY2 - centerY1, centerX2 - centerX1) * 180) / Math.PI;

  winLineEl.style.position = "fixed";
  winLineEl.style.width = `${length}px`;
  winLineEl.style.height = "6px";
  winLineEl.style.left = `${centerX1}px`;
  winLineEl.style.top = `${centerY1}px`;
  winLineEl.style.transformOrigin = "left center";
  winLineEl.style.transform = `rotate(${angle}deg)`;
  winLineEl.style.background =
    "linear-gradient(90deg, var(--accent), var(--accent))";
  winLineEl.style.borderRadius = "3px";
  winLineEl.style.zIndex = "10";
  winLineEl.classList.add("show");
}

function finish(w, points) {
  gameOver = true;
  locked = true;
  if (points) {
    setTimeout(() => {
      drawWinLine(points);
    }, 50);
  }
  if (w === "you") {
    setStatus("فزت");
    saveScore("you");
  } else if (w === "ai") {
    setStatus("فاز الذكاء الاصطناعي");
    saveScore("ai");
  } else {
    setStatus("تعادل");
    saveScore("draw");
  }
  updateGridUI();
}

function aiPlay() {
  if (gameOver) return;
  const move = bestMove3x3();
  if (move) {
    place(move.r, move.c, ai);
    const w = checkWin();
    if (w) {
      finish("ai", w);
      return;
    }
  }
  if (isFull()) {
    if (!extensionUsed) {
      extendPhase();
      return;
    } else {
      finish("draw");
      return;
    }
  }
  turn = "you";
  locked = false;
  setStatus("دورك");
  updateGridUI();
}

function bestMove3x3() {
  let best = -Infinity,
    bm = null;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === "") {
        board[r][c] = ai;
        const score = minimax(board, 0, false, -Infinity, Infinity);
        board[r][c] = "";
        if (score > best) {
          best = score;
          bm = { r, c };
        }
      }
    }
  }
  return bm;
}

function minimax(b, depth, isMax, alpha, beta) {
  const w = evaluate3x3();
  if (w !== null) return w - depth;
  if (isMax) {
    let maxEval = -Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (b[r][c] === "") {
          b[r][c] = ai;
          const ev = minimax(b, depth + 1, false, alpha, beta);
          b[r][c] = "";
          maxEval = Math.max(maxEval, ev);
          alpha = Math.max(alpha, ev);
          if (beta <= alpha) return maxEval;
        }
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (b[r][c] === "") {
          b[r][c] = you;
          const ev = minimax(b, depth + 1, true, alpha, beta);
          b[r][c] = "";
          minEval = Math.min(minEval, ev);
          beta = Math.min(beta, ev);
          if (beta <= alpha) return minEval;
        }
      }
    }
    return minEval;
  }
}

function evaluate3x3() {
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] &&
      board[i][0] === board[i][1] &&
      board[i][1] === board[i][2]
    )
      return board[i][0] === ai ? 10 : -10;
  }
  for (let i = 0; i < 3; i++) {
    if (
      board[0][i] &&
      board[0][i] === board[1][i] &&
      board[1][i] === board[2][i]
    )
      return board[0][i] === ai ? 10 : -10;
  }
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2])
    return board[0][0] === ai ? 10 : -10;
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0])
    return board[0][2] === ai ? 10 : -10;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) if (board[r][c] === "") return null;
  return 0;
}

function extendPhase() {
  extensionUsed = true;
  setStatus("تعادل - تحليل إمكانيات التمديد");

  setTimeout(() => {
    // تحقق من إمكانية الفوز في كلا الاتجاهين
    const rightWin = canWinWithRightExtension();
    const leftWin = canWinWithLeftExtension();

    if (rightWin && leftWin) {
      // إذا كان يمكن الفوز في كلا الاتجاهين، اختر الأفضل
      if (rightWin.priority >= leftWin.priority) {
        extendRight(rightWin);
      } else {
        extendLeft(leftWin);
      }
    } else if (rightWin) {
      // يمكن الفوز فقط من اليمين
      extendRight(rightWin);
    } else if (leftWin) {
      // يمكن الفوز فقط من اليسار
      extendLeft(leftWin);
    } else {
      // لا يمكن الفوز في أي اتجاه - تعادل
      finish("draw");
    }
  }, 150);
}

function canWinWithRightExtension() {
  // محاكاة إضافة عمود على اليمين
  const tempBoard = board.map((row) => [...row, ""]);

  // تحقق من إمكانيات الفوز المختلفة
  let bestStrategy = null;
  let maxPriority = 0;

  // 1. فوز مباشر بحركة واحدة
  for (let r = 0; r < 3; r++) {
    tempBoard[r][3] = ai;
    if (checkWinInBoard(tempBoard)) {
      tempBoard[r][3] = "";
      return { type: "immediate", row: r, priority: 10 };
    }
    tempBoard[r][3] = "";
  }

  // 2. تشكيل خط في الصف
  for (let r = 0; r < 3; r++) {
    if (board[r][1] === ai && board[r][2] === ai) {
      return { type: "row", row: r, priority: 8 };
    }
  }

  // 3. تشكيل قطر
  if (board[1][2] === ai && board[2][1] === ai) {
    return { type: "diagonal", position: "main", priority: 7 };
  }

  // 4. استراتيجية من خطوتين
  const twoStepWin = findTwoStepWinInDirection(tempBoard, 3);
  if (twoStepWin) {
    return { type: "twoStep", strategy: twoStepWin, priority: 6 };
  }

  return null;
}

function canWinWithLeftExtension() {
  // محاكاة إضافة عمود على اليسار
  const tempBoard = board.map((row) => ["", ...row]);

  // تحقق من إمكانيات الفوز المختلفة
  let bestStrategy = null;
  let maxPriority = 0;

  // 1. فوز مباشر بحركة واحدة
  for (let r = 0; r < 3; r++) {
    tempBoard[r][0] = ai;
    if (checkWinInBoard(tempBoard)) {
      tempBoard[r][0] = "";
      return { type: "immediate", row: r, priority: 10 };
    }
    tempBoard[r][0] = "";
  }

  // 2. تشكيل خط في الصف
  for (let r = 0; r < 3; r++) {
    if (board[r][0] === ai && board[r][1] === ai) {
      return { type: "row", row: r, priority: 8 };
    }
  }

  // 3. تشكيل قطر
  if (board[1][1] === ai && board[2][2] === ai) {
    return { type: "diagonal", position: "main", priority: 7 };
  }

  // 4. استراتيجية من خطوتين
  const twoStepWin = findTwoStepWinInDirection(tempBoard, 0);
  if (twoStepWin) {
    return { type: "twoStep", strategy: twoStepWin, priority: 6 };
  }

  return null;
}

function extendRight(strategy) {
  // إضافة العمود على اليمين
  for (let r = 0; r < 3; r++) {
    board[r].push("");
  }
  cols = 4;
  buildGrid();
  updateGridUI();

  setStatus("دور الذكاء الاصطناعي - تمديد يميني");
  setTimeout(() => executeStrategy(strategy, 3), 150);
}

function extendLeft(strategy) {
  // إضافة العمود على اليسار
  for (let r = 0; r < 3; r++) {
    board[r].unshift("");
  }
  cols = 4;
  buildGrid();
  updateGridUI();

  setStatus("دور الذكاء الاصطناعي - تمديد يساري");
  setTimeout(() => executeStrategy(strategy, 0), 150);
}

function executeStrategy(strategy, colIndex) {
  switch (strategy.type) {
    case "immediate":
      place(strategy.row, colIndex, ai);
      const w1 = checkWin();
      if (w1) {
        finish("ai", w1);
      } else {
        finish("ai");
      }
      break;

    case "row":
      place(strategy.row, colIndex, ai);
      const w2 = checkWin();
      if (w2) {
        finish("ai", w2);
      } else {
        finish("ai");
      }
      break;

    case "diagonal":
      const row = strategy.position === "main" ? 0 : 2;
      place(row, colIndex, ai);
      const w3 = checkWin();
      if (w3) {
        finish("ai", w3);
      } else {
        finish("ai");
      }
      break;

    case "twoStep":
      place(strategy.strategy.first.r, strategy.strategy.first.c, ai);
      setTimeout(() => {
        place(strategy.strategy.second.r, strategy.strategy.second.c, ai);
        const w4 = checkWin();
        if (w4) {
          finish("ai", w4);
        } else {
          finish("ai");
        }
      }, 160);
      break;

    default:
      finish("draw");
  }
}

function checkWinInBoard(testBoard) {
  const rows = testBoard.length;
  const cols = testBoard[0].length;

  // فحص الصفوف
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 3; c++) {
      const a = testBoard[r][c];
      const b = testBoard[r][c + 1];
      const d = testBoard[r][c + 2];
      if (a && a === b && a === d) return true;
    }
  }

  // فحص الأعمدة
  for (let c = 0; c < cols; c++) {
    if (rows >= 3) {
      const a = testBoard[0][c];
      const b = testBoard[1][c];
      const d = testBoard[2][c];
      if (a && a === b && a === d) return true;
    }
  }

  // فحص الأقطار
  for (let c = 0; c <= cols - 3; c++) {
    if (rows >= 3) {
      // القطر الرئيسي
      const a1 = testBoard[0][c];
      const b1 = testBoard[1][c + 1];
      const d1 = testBoard[2][c + 2];
      if (a1 && a1 === b1 && a1 === d1) return true;

      // القطر الثانوي
      const a2 = testBoard[2][c];
      const b2 = testBoard[1][c + 1];
      const d2 = testBoard[0][c + 2];
      if (a2 && a2 === b2 && a2 === d2) return true;
    }
  }

  return false;
}

function findTwoStepWinInDirection(tempBoard, colIndex) {
  const availableRows = [];
  for (let r = 0; r < 3; r++) {
    if (tempBoard[r][colIndex] === "") {
      availableRows.push(r);
    }
  }

  if (availableRows.length < 2) return null;

  for (let i = 0; i < availableRows.length; i++) {
    for (let j = i + 1; j < availableRows.length; j++) {
      const r1 = availableRows[i];
      const r2 = availableRows[j];

      tempBoard[r1][colIndex] = ai;
      tempBoard[r2][colIndex] = ai;

      const win = checkWinInBoard(tempBoard);

      tempBoard[r1][colIndex] = "";
      tempBoard[r2][colIndex] = "";

      if (win) {
        return {
          first: { r: r1, c: colIndex },
          second: { r: r2, c: colIndex },
        };
      }
    }
  }

  return null;
}

chooseBtns.forEach((b) =>
  b.addEventListener("click", () => {
    you = b.getAttribute("data-symbol");
    ai = you === "X" ? "O" : "X";
    choose.classList.add("hidden");
    locked = false;
    turn = "X" === you ? "you" : "ai";
    setStatus(turn === "you" ? "دورك" : "دور الذكاء الاصطناعي");
    if (turn === "ai") setTimeout(aiPlay, 150);
  })
);

newBtn.addEventListener("click", () => {
  startRound(true);
});

resetBtn.addEventListener("click", resetScore);

loadScore();
startRound(false);

document.addEventListener("keydown", (e) => {
  if (locked || gameOver) return;
  const key = e.key;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key))
    e.preventDefault();
  if (key === "ArrowLeft") moveFocus(1);
  if (key === "ArrowRight") moveFocus(-1);
  if (key === "ArrowUp") moveFocus(-cols);
  if (key === "ArrowDown") moveFocus(cols);
  if (key === "Enter" || key === " ") {
    const idx = clamp(focusIndex, 0, cells.length - 1);
    cells[idx].click();
  }
});

function moveFocus(delta) {
  const next = clamp(focusIndex + delta, 0, cells.length - 1);
  focusIndex = next;
  cells[next].focus();
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
