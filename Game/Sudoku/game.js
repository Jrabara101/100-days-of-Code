/**
 * Sudoku — game.js
 * Full game logic: puzzle generation, conflict detection,
 * pencil marks, undo, timer, hints, win/game-over, LocalStorage persistence.
 *
 * Architecture: single IIFE to avoid polluting global scope inside a WebView.
 */

'use strict';

(() => {

  /* ═══════════════════════════════════════════════
     CONSTANTS & STATE
  ═══════════════════════════════════════════════ */

  const DIFFICULTY_CLUES = { easy: 46, medium: 32, hard: 24 };
  const MAX_MISTAKES = 3;
  const STORAGE_KEY = 'sudoku_save_v2';

  let board        = [];   // 81-element array, 0 = empty
  let solution     = [];   // complete solved board
  let clues        = [];   // booleans — is this cell a given clue?
  let pencilMarks  = [];   // Array of Sets, one per cell
  let selectedCell = -1;   // index 0–80
  let pencilMode   = false;
  let mistakes     = 0;
  let hintsLeft    = 3;
  let difficulty   = 'medium';
  let timerSecs    = 0;
  let timerHandle  = null;
  let undoStack    = [];   // [{index, prevValue, prevPencil}]
  let gameActive   = false;

  /* ═══════════════════════════════════════════════
     DOM REFS
  ═══════════════════════════════════════════════ */

  const gridEl         = document.getElementById('sudoku-grid');
  const timerEl        = document.getElementById('timer');
  const mistakeEl      = document.getElementById('mistake-count');
  const diffLabelEl    = document.getElementById('difficulty-label');
  const btnNewGame     = document.getElementById('btn-new-game');
  const btnUndo        = document.getElementById('btn-undo');
  const btnErase       = document.getElementById('btn-erase');
  const btnPencil      = document.getElementById('btn-pencil');
  const btnHint        = document.getElementById('btn-hint');
  const winOverlay     = document.getElementById('win-overlay');
  const gameoverOverlay= document.getElementById('gameover-overlay');
  const winTimeEl      = document.getElementById('win-time-value');
  const winMistakesEl  = document.getElementById('win-mistakes-value');
  const btnPlayAgain   = document.getElementById('btn-play-again');
  const btnTryAgain    = document.getElementById('btn-try-again');
  const confettiCanvas = document.getElementById('confetti-canvas');

  /* ═══════════════════════════════════════════════
     PUZZLE GENERATOR & SOLVER
  ═══════════════════════════════════════════════ */

  function idx(r, c) { return r * 9 + c; }

  function isValid(grid, pos, num) {
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    // Row
    for (let j = 0; j < 9; j++) {
      if (grid[idx(r, j)] === num) return false;
    }
    // Column
    for (let i = 0; i < 9; i++) {
      if (grid[idx(i, c)] === num) return false;
    }
    // 3×3 box
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) {
        if (grid[idx(i, j)] === num) return false;
      }
    }
    return true;
  }

  /**
   * Fills the grid using a randomised backtracking algorithm.
   * Returns true when fully solved.
   */
  function fillGrid(grid) {
    for (let pos = 0; pos < 81; pos++) {
      if (grid[pos] === 0) {
        const nums = shuffle([1,2,3,4,5,6,7,8,9]);
        for (const n of nums) {
          if (isValid(grid, pos, n)) {
            grid[pos] = n;
            if (fillGrid(grid)) return true;
            grid[pos] = 0;
          }
        }
        return false;
      }
    }
    return true; // no empty cell found → complete
  }

  /**
   * Count solutions (capped at 2 to check uniqueness).
   * Fills `outSolution` with the first solution found.
   */
  function countSolutions(grid, outSolution, limit = 2) {
    let count = 0;
    function solve(g) {
      if (count >= limit) return;
      for (let pos = 0; pos < 81; pos++) {
        if (g[pos] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(g, pos, n)) {
              g[pos] = n;
              solve(g);
              if (count < limit) g[pos] = 0;
            }
          }
          return; // backtrack
        }
      }
      // Reached here → all cells filled
      count++;
      if (count === 1) outSolution.splice(0, 81, ...g);
    }
    const copy = [...grid];
    solve(copy);
    return count;
  }

  /**
   * Generate a new puzzle with the given number of clues.
   * Returns { puzzle, solution }.
   */
  function generatePuzzle(clueCount) {
    // 1. Create a full solved grid
    const full = new Array(81).fill(0);
    fillGrid(full);

    // 2. Remove cells while maintaining a unique solution
    const puzzle = [...full];
    const positions = shuffle([...Array(81).keys()]);

    let removed = 0;
    const target = 81 - clueCount;

    for (const pos of positions) {
      if (removed >= target) break;
      const backup = puzzle[pos];
      puzzle[pos] = 0;
      const sol = [];
      if (countSolutions(puzzle, sol) === 1) {
        removed++;
      } else {
        puzzle[pos] = backup; // restore — would break uniqueness
      }
    }

    return { puzzle, solution: full };
  }

  /* ═══════════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════════ */

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function row(i) { return Math.floor(i / 9); }
  function col(i) { return i % 9; }
  function box(i) { return Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3); }

  /** Returns all indices sharing a row, col, or box with i (excluding i itself). */
  function peers(i) {
    const r = row(i), c = col(i), b = box(i);
    const set = new Set();
    for (let j = 0; j < 81; j++) {
      if (j !== i && (row(j) === r || col(j) === c || box(j) === b)) {
        set.add(j);
      }
    }
    return set;
  }

  /* ═══════════════════════════════════════════════
     GRID RENDERING
  ═══════════════════════════════════════════════ */

  function buildGrid() {
    gridEl.innerHTML = '';
    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.dataset.row = row(i);
      cell.dataset.col = col(i);
      cell.setAttribute('role', 'gridcell');
      cell.addEventListener('click', () => onCellClick(i));
      // Touch: prevent ghost click delay
      cell.addEventListener('touchend', (e) => {
        e.preventDefault();
        onCellClick(i);
      }, { passive: false });
      gridEl.appendChild(cell);
    }
  }

  function renderCell(i) {
    const cell = gridEl.children[i];
    if (!cell) return;

    // Reset classes
    cell.className = 'cell';
    if (clues[i]) cell.classList.add('clue');

    const val = board[i];

    if (val !== 0) {
      // Clear pencil grid
      cell.innerHTML = '';
      const span = document.createElement('span');
      span.textContent = val;
      cell.appendChild(span);

      // Colour logic
      if (clues[i]) {
        // stays as clue colour (CSS handles)
      } else if (val === solution[i]) {
        cell.classList.add('correct');
      } else {
        cell.classList.add('conflict');
      }
    } else {
      // Pencil marks
      const marks = pencilMarks[i];
      if (marks && marks.size > 0) {
        cell.innerHTML = '';
        const pg = document.createElement('div');
        pg.className = 'pencil-grid';
        for (let n = 1; n <= 9; n++) {
          const span = document.createElement('span');
          span.className = 'pencil-mark' + (marks.has(n) ? ' active' : '');
          span.textContent = marks.has(n) ? n : '';
          pg.appendChild(span);
        }
        cell.appendChild(pg);
      } else {
        cell.innerHTML = '';
      }
    }
  }

  function renderBoard() {
    for (let i = 0; i < 81; i++) renderCell(i);
    updateSelection();
    updateNumberPadUsed();
  }

  /** Highlight selected cell, peers, and same-number cells. */
  function updateSelection() {
    const cells = gridEl.children;
    const selNum = selectedCell >= 0 ? board[selectedCell] : 0;
    const peerSet = selectedCell >= 0 ? peers(selectedCell) : new Set();

    for (let i = 0; i < 81; i++) {
      const cell = cells[i];
      cell.classList.remove('selected', 'highlighted', 'same-number');
      if (i === selectedCell) {
        cell.classList.add('selected');
      } else if (peerSet.has(i)) {
        cell.classList.add('highlighted');
      } else if (selNum !== 0 && board[i] === selNum) {
        cell.classList.add('same-number');
      }
    }
  }

  /** Grey out number buttons when all 9 instances are placed. */
  function updateNumberPadUsed() {
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 81; i++) {
      if (board[i] !== 0) counts[board[i]]++;
    }
    document.querySelectorAll('.num-btn').forEach(btn => {
      const n = Number(btn.dataset.num);
      btn.classList.toggle('used', counts[n] >= 9);
    });
  }

  /* ═══════════════════════════════════════════════
     GAME LOGIC
  ═══════════════════════════════════════════════ */

  function startNewGame(diff = difficulty) {
    difficulty = diff;
    diffLabelEl.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);

    // Update difficulty button states
    document.querySelectorAll('.diff-btn').forEach(btn => {
      const isActive = btn.dataset.diff === diff;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Generate puzzle
    const clueCount = DIFFICULTY_CLUES[diff];
    const { puzzle, solution: sol } = generatePuzzle(clueCount);

    board       = [...puzzle];
    solution    = [...sol];
    clues       = board.map(v => v !== 0);
    pencilMarks = Array.from({ length: 81 }, () => new Set());
    selectedCell= -1;
    pencilMode  = false;
    mistakes    = 0;
    hintsLeft   = 3;
    undoStack   = [];
    gameActive  = true;

    btnPencil.classList.remove('active');
    btnPencil.setAttribute('aria-pressed', 'false');
    updateMistakes();

    // Timer
    stopTimer();
    timerSecs = 0;
    timerEl.textContent = '0:00';
    startTimer();

    // Overlays
    winOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');

    buildGrid();
    renderBoard();
    saveGame();
  }

  function onCellClick(i) {
    if (!gameActive) return;
    selectedCell = i;
    updateSelection();
  }

  function onNumberInput(n) {
    if (!gameActive) return;
    if (selectedCell < 0) return;
    if (clues[selectedCell]) return; // cannot edit given clues

    if (pencilMode) {
      // Toggle pencil mark
      const marks = pencilMarks[selectedCell];
      if (board[selectedCell] !== 0) return; // can't pencil on a filled cell
      const prev = new Set(marks);
      if (marks.has(n)) marks.delete(n);
      else marks.add(n);
      undoStack.push({ index: selectedCell, prevValue: board[selectedCell], prevPencil: prev });
      renderCell(selectedCell);
      saveGame();
      return;
    }

    // Normal fill
    if (board[selectedCell] === n) return; // tapping same number deselects

    const prevValue = board[selectedCell];
    const prevPencil = new Set(pencilMarks[selectedCell]);
    undoStack.push({ index: selectedCell, prevValue, prevPencil });

    board[selectedCell] = n;
    pencilMarks[selectedCell].clear();

    // Check correctness
    if (n !== solution[selectedCell]) {
      mistakes++;
      updateMistakes();
      renderCell(selectedCell);
      triggerHaptic('error');
      if (mistakes >= MAX_MISTAKES) {
        gameOver();
        return;
      }
    } else {
      // Erase pencil marks of this number in peers
      const peerSet = peers(selectedCell);
      for (const p of peerSet) {
        if (pencilMarks[p].has(n)) {
          pencilMarks[p].delete(n);
          renderCell(p);
        }
      }
      triggerHaptic('success');
      renderCell(selectedCell);

      // Check win
      if (isSolved()) {
        onWin();
        return;
      }
    }

    updateSelection();
    updateNumberPadUsed();
    saveGame();
  }

  function onErase() {
    if (!gameActive) return;
    if (selectedCell < 0) return;
    if (clues[selectedCell]) return;

    const prevValue = board[selectedCell];
    const prevPencil = new Set(pencilMarks[selectedCell]);

    if (prevValue === 0 && pencilMarks[selectedCell].size === 0) return;

    undoStack.push({ index: selectedCell, prevValue, prevPencil });
    board[selectedCell] = 0;
    pencilMarks[selectedCell].clear();
    renderCell(selectedCell);
    updateSelection();
    updateNumberPadUsed();
    saveGame();
  }

  function onUndo() {
    if (!gameActive) return;
    if (undoStack.length === 0) return;
    const { index, prevValue, prevPencil } = undoStack.pop();
    board[index] = prevValue;
    pencilMarks[index] = prevPencil;
    renderCell(index);
    selectedCell = index;
    updateSelection();
    updateNumberPadUsed();
    saveGame();
  }

  function onHint() {
    if (!gameActive) return;
    if (hintsLeft <= 0) return;

    // Find an empty or incorrect cell
    const empties = [];
    for (let i = 0; i < 81; i++) {
      if (!clues[i] && board[i] !== solution[i]) empties.push(i);
    }
    if (empties.length === 0) return;

    // Pick the selected cell if it qualifies, else a random one
    let target;
    if (selectedCell >= 0 && empties.includes(selectedCell)) {
      target = selectedCell;
    } else {
      target = empties[Math.floor(Math.random() * empties.length)];
    }

    undoStack.push({ index: target, prevValue: board[target], prevPencil: new Set(pencilMarks[target]) });
    board[target] = solution[target];
    pencilMarks[target].clear();
    hintsLeft--;

    renderCell(target);
    gridEl.children[target].classList.add('hint-cell');
    setTimeout(() => gridEl.children[target]?.classList.remove('hint-cell'), 500);

    selectedCell = target;
    updateSelection();
    updateNumberPadUsed();

    if (isSolved()) { onWin(); return; }
    saveGame();
  }

  function isSolved() {
    for (let i = 0; i < 81; i++) {
      if (board[i] !== solution[i]) return false;
    }
    return true;
  }

  /* ═══════════════════════════════════════════════
     WIN / GAME OVER
  ═══════════════════════════════════════════════ */

  function onWin() {
    gameActive = false;
    stopTimer();

    winTimeEl.textContent = formatTime(timerSecs);
    winMistakesEl.textContent = mistakes;

    // Brief board animation
    for (let i = 0; i < 81; i++) {
      setTimeout(() => {
        gridEl.children[i]?.classList.add('win-glow');
      }, i * 8);
    }

    setTimeout(() => {
      winOverlay.classList.remove('hidden');
      launchConfetti();
      triggerHaptic('win');
    }, 700);

    clearSave();
  }

  function gameOver() {
    gameActive = false;
    stopTimer();
    gameoverOverlay.classList.remove('hidden');
    triggerHaptic('error');
    clearSave();
  }

  /* ═══════════════════════════════════════════════
     TIMER
  ═══════════════════════════════════════════════ */

  function startTimer() {
    timerHandle = setInterval(() => {
      timerSecs++;
      timerEl.textContent = formatTime(timerSecs);
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function updateMistakes() {
    mistakeEl.textContent = `${mistakes} / ${MAX_MISTAKES}`;
    if (mistakes > 0) mistakeEl.style.color = 'var(--neon-red)';
  }

  /* ═══════════════════════════════════════════════
     LOCALSTORAGE PERSISTENCE
  ═══════════════════════════════════════════════ */

  function saveGame() {
    if (!gameActive) return;
    try {
      const state = {
        board,
        solution,
        clues,
        pencilMarks: pencilMarks.map(s => [...s]),
        selectedCell,
        mistakes,
        hintsLeft,
        difficulty,
        timerSecs,
        undoStack: undoStack.slice(-50), // cap undo history size
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Storage not available (private mode, Capacitor sandbox, etc.)
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      board       = s.board;
      solution    = s.solution;
      clues       = s.clues;
      pencilMarks = s.pencilMarks.map(arr => new Set(arr));
      selectedCell= s.selectedCell ?? -1;
      mistakes    = s.mistakes ?? 0;
      hintsLeft   = s.hintsLeft ?? 3;
      difficulty  = s.difficulty ?? 'medium';
      timerSecs   = s.timerSecs ?? 0;
      undoStack   = s.undoStack ?? [];
      gameActive  = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearSave() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  /* ═══════════════════════════════════════════════
     HAPTIC FEEDBACK (Capacitor Haptics plugin)
  ═══════════════════════════════════════════════ */

  async function triggerHaptic(type) {
    try {
      // Capacitor Haptics API — only available after cap sync
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      if (type === 'success') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (type === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (type === 'win') {
        await Haptics.notification({ type: NotificationType.Success });
      }
    } catch {
      // Running in browser — haptics not available, fail silently
    }
  }

  /* ═══════════════════════════════════════════════
     STATUS BAR (Capacitor)
  ═══════════════════════════════════════════════ */

  async function initStatusBar() {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f0f1a' });
    } catch {
      // Browser — no-op
    }
  }

  /* ═══════════════════════════════════════════════
     CONFETTI
  ═══════════════════════════════════════════════ */

  function launchConfetti() {
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLOURS = ['#7c6fcd','#a78bfa','#34d399','#fbbf24','#f87171','#60a5fa'];
    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.5,
      r: Math.random() * 7 + 3,
      color: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      life: 1,
    }));

    let frame;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.spin;
        p.life  -= 0.006;
        if (p.life <= 0 || p.y > canvas.height) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    frame = requestAnimationFrame(animate);
  }

  /* ═══════════════════════════════════════════════
     KEYBOARD SUPPORT (Desktop & hardware keyboard)
  ═══════════════════════════════════════════════ */

  document.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    if (e.key >= '1' && e.key <= '9') {
      onNumberInput(Number(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      onErase();
    } else if (e.key === 'p' || e.key === 'P') {
      togglePencil();
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      onUndo();
    } else if (e.key === 'ArrowRight') {
      moveSel(0, 1);
    } else if (e.key === 'ArrowLeft') {
      moveSel(0, -1);
    } else if (e.key === 'ArrowDown') {
      moveSel(1, 0);
    } else if (e.key === 'ArrowUp') {
      moveSel(-1, 0);
    }
  });

  function moveSel(dr, dc) {
    if (selectedCell < 0) { selectedCell = 0; updateSelection(); return; }
    const r = Math.max(0, Math.min(8, row(selectedCell) + dr));
    const c = Math.max(0, Math.min(8, col(selectedCell) + dc));
    selectedCell = idx(r, c);
    updateSelection();
  }

  /* ═══════════════════════════════════════════════
     EVENT WIRING
  ═══════════════════════════════════════════════ */

  function togglePencil() {
    pencilMode = !pencilMode;
    btnPencil.classList.toggle('active', pencilMode);
    btnPencil.setAttribute('aria-pressed', String(pencilMode));
  }

  btnNewGame.addEventListener('click', () => startNewGame(difficulty));
  btnUndo.addEventListener('click', onUndo);
  btnErase.addEventListener('click', onErase);
  btnPencil.addEventListener('click', togglePencil);
  btnHint.addEventListener('click', onHint);
  btnPlayAgain.addEventListener('click', () => startNewGame(difficulty));
  btnTryAgain.addEventListener('click', () => startNewGame(difficulty));

  // Number pad
  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => onNumberInput(Number(btn.dataset.num)));
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      onNumberInput(Number(btn.dataset.num));
    }, { passive: false });
  });

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.diff === difficulty) return;
      startNewGame(btn.dataset.diff);
    });
  });

  // Pause timer when app is backgrounded (Capacitor app lifecycle)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
      saveGame();
    } else if (gameActive) {
      startTimer();
    }
  });

  /* ═══════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════ */

  function boot() {
    initStatusBar(); // no-op in browser, activates on device

    const resumed = loadGame();
    if (resumed) {
      // Restore difficulty UI
      diffLabelEl.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      document.querySelectorAll('.diff-btn').forEach(btn => {
        const isActive = btn.dataset.diff === difficulty;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
      timerEl.textContent = formatTime(timerSecs);
      updateMistakes();
      buildGrid();
      renderBoard();
      startTimer();
    } else {
      startNewGame('medium');
    }
  }

  // Wait for DOM ready (already deferred by script at end of body, but be safe)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
