/**
 * 2048 - Premium Staff Architected Edition
 * Features:
 * - CSS-decoupled tile positioning (via CSS variables --col and --row)
 * - State preservation and Undo Stack (Command Pattern)
 * - Web Audio API synthesized retro sound effects
 * - Touch swipe support for mobile
 * - Dual themes (Sleek Dark Synthwave and Cozy Light Mode)
 * - Persistent local storage autosave
 */

class Tile {
    constructor(row, col, value) {
        this.row = row;
        this.col = col;
        this.value = value;
        this.id = Tile.nextId++;
        this.previousPosition = null;
        this.mergedInto = null;
        this.isNew = false;
        this.isMerged = false;
    }

    savePosition() {
        this.previousPosition = { row: this.row, col: this.col };
    }
}
Tile.nextId = 1;

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API not supported on this browser.", e);
        }
    }

    playMove() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Quick retro click/sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.07);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.07);
    }

    playMerge() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Clean dual-chime synthetic sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
        osc.frequency.setValueAtTime(554.37, this.ctx.currentTime + 0.05); // C#5

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
    }

    playUndo() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Reverse whoosh/pitch-down sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playGameOver() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Descending synth minor chord
        const t = this.ctx.currentTime;
        const playTone = (freq, duration, delay, vol = 0.08) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + delay);
            osc.frequency.linearRampToValueAtTime(freq * 0.75, t + delay + duration);

            gain.gain.setValueAtTime(0.001, t + delay);
            gain.gain.linearRampToValueAtTime(vol, t + delay + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + duration);

            osc.start(t + delay);
            osc.stop(t + delay + duration);
        };

        playTone(196, 0.45, 0);       // G3
        playTone(164.81, 0.45, 0.12); // E3
        playTone(130.81, 0.6, 0.24);  // C3
    }

    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Sweet major arpeggio
        const t = this.ctx.currentTime;
        const playTone = (freq, duration, delay, vol = 0.08) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + delay);

            gain.gain.setValueAtTime(0.001, t + delay);
            gain.gain.linearRampToValueAtTime(vol, t + delay + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + duration);

            osc.start(t + delay);
            osc.stop(t + delay + duration);
        };

        playTone(261.63, 0.15, 0);     // C4
        playTone(329.63, 0.15, 0.07);  // E4
        playTone(392.00, 0.15, 0.14);  // G4
        playTone(523.25, 0.35, 0.21, 0.1); // C5
    }
}

class DOM2048 {
    constructor() {
        this.boardSize = 4;
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.tiles = [];
        this.history = []; // Undo Stack
        this.score = 0;
        this.bestScore = 0;
        this.moves = 0;
        
        this.won = false;
        this.keepGoing = false;
        this.over = false;
        this.isMovingState = false; // block inputs during board animations

        // Views
        this.container = document.getElementById('tile-container');
        this.undoBtn = document.getElementById('undo-btn');
        this.undoCount = document.getElementById('undo-count');
        this.restartBtn = document.getElementById('restart-btn');
        
        // Sound and Theme subsystems
        this.sound = new SoundManager();
        
        this.setupBackground();
        this.setupTheme();
        this.setupAudio();
        
        // Attempt load, fallback to new game
        if (!this.loadFromLocalStorage()) {
            this.newGame();
        } else {
            this.render();
            this.updateUI();
            
            // Check UI states
            if (this.over) {
                this.showOverlay(false);
            } else if (this.won && !this.keepGoing) {
                this.showOverlay(true);
            }
        }
        
        this.bindInput();
        this.setupTouchEvents();
    }

    setupBackground() {
        const bg = document.getElementById('grid-bg');
        bg.innerHTML = '';
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            bg.appendChild(cell);
        }
    }

    newGame() {
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.tiles = [];
        this.history = [];
        this.score = 0;
        this.moves = 0;
        this.won = false;
        this.keepGoing = false;
        this.over = false;
        
        this.hideOverlay();
        this.addRandomTile();
        this.addRandomTile();
        this.render();
        this.updateUI();
        this.saveToLocalStorage();
    }

    bindInput() {
        document.addEventListener('keydown', (e) => {
            if (this.isMovingState) return;

            // Directions mapping
            const keyMap = {
                'ArrowUp': 'UP', 'w': 'UP', 'W': 'UP',
                'ArrowDown': 'DOWN', 's': 'DOWN', 'S': 'DOWN',
                'ArrowLeft': 'LEFT', 'a': 'LEFT', 'A': 'LEFT',
                'ArrowRight': 'RIGHT', 'd': 'RIGHT', 'D': 'RIGHT'
            };

            if (keyMap[e.key]) {
                e.preventDefault();
                this.handleMove(keyMap[e.key]);
            } else if (e.key === 'Backspace' || e.key === 'u' || e.key === 'U') {
                e.preventDefault();
                this.undo();
            }
        });

        this.undoBtn.addEventListener('click', () => this.undo());
        this.restartBtn.addEventListener('click', () => {
            this.sound.playUndo();
            this.newGame();
        });

        // Overlay buttons
        document.getElementById('overlay-btn-action').addEventListener('click', () => {
            this.newGame();
        });
        
        document.getElementById('overlay-btn-keep-going').addEventListener('click', () => {
            this.keepGoing = true;
            this.hideOverlay();
            this.sound.playMerge();
            this.saveToLocalStorage();
        });
    }

    setupTouchEvents() {
        const board = document.getElementById('board-container');
        let touchStartX = 0;
        let touchStartY = 0;
        
        board.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1 || this.isMovingState) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        board.addEventListener('touchend', (e) => {
            if (e.touches.length > 0 && e.changedTouches.length === 0) return;
            if (this.isMovingState) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            
            // Threshold
            if (Math.max(absDx, absDy) > 40) {
                // If it is a swipe, prevent scrolling
                e.preventDefault();
                
                if (absDx > absDy) {
                    if (dx > 0) {
                        this.handleMove('RIGHT');
                    } else {
                        this.handleMove('LEFT');
                    }
                } else {
                    if (dy > 0) {
                        this.handleMove('DOWN');
                    } else {
                        this.handleMove('UP');
                    }
                }
            }
        }, { passive: false });
    }

    setupTheme() {
        const themeBtn = document.getElementById('theme-btn');
        const darkIcon = document.getElementById('theme-dark-icon');
        const lightIcon = document.getElementById('theme-light-icon');
        
        let theme = localStorage.getItem('2048_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        
        const updateThemeUI = (t) => {
            if (t === 'dark') {
                darkIcon.classList.add('hidden');
                lightIcon.classList.remove('hidden');
            } else {
                lightIcon.classList.add('hidden');
                darkIcon.classList.remove('hidden');
            }
        };
        
        updateThemeUI(theme);
        
        themeBtn.addEventListener('click', () => {
            theme = theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('2048_theme', theme);
            updateThemeUI(theme);
            this.sound.playMove();
        });
    }

    setupAudio() {
        const audioBtn = document.getElementById('audio-btn');
        const onIcon = document.getElementById('audio-on-icon');
        const muteIcon = document.getElementById('audio-mute-icon');
        
        let enabled = localStorage.getItem('2048_audio') !== 'false';
        this.sound.enabled = enabled;
        
        const updateAudioUI = (e) => {
            if (e) {
                onIcon.classList.remove('hidden');
                muteIcon.classList.add('hidden');
            } else {
                onIcon.classList.add('hidden');
                muteIcon.classList.remove('hidden');
            }
        };
        
        updateAudioUI(enabled);
        
        audioBtn.addEventListener('click', () => {
            enabled = !enabled;
            this.sound.enabled = enabled;
            localStorage.setItem('2048_audio', enabled);
            updateAudioUI(enabled);
            
            if (enabled) {
                this.sound.playMerge();
            }
        });
    }

    // --- STATE PERSISTENCE ---

    saveToLocalStorage() {
        const boardValues = this.grid.map(row => 
            row.map(tile => tile ? tile.value : 0)
        );
        const gameState = {
            board: boardValues,
            score: this.score,
            moves: this.moves,
            won: this.won,
            keepGoing: this.keepGoing,
            history: this.history
        };
        localStorage.setItem('2048_game_state', JSON.stringify(gameState));
        localStorage.setItem('2048_best_score', this.bestScore.toString());
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('2048_game_state');
        const savedBest = localStorage.getItem('2048_best_score');
        this.bestScore = savedBest ? parseInt(savedBest, 10) : 0;
        
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.score = state.score;
                this.moves = state.moves;
                this.won = state.won;
                this.keepGoing = state.keepGoing;
                this.history = state.history || [];
                
                this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
                this.tiles = [];
                
                let maxId = 0;
                for (let r = 0; r < this.boardSize; r++) {
                    for (let c = 0; c < this.boardSize; c++) {
                        const val = state.board[r][c];
                        if (val > 0) {
                            const tile = new Tile(r, c, val);
                            this.grid[r][c] = tile;
                            this.tiles.push(tile);
                            if (tile.id > maxId) maxId = tile.id;
                        }
                    }
                }
                Tile.nextId = maxId + 1;
                this.over = !this.movesAvailable();
                return true;
            } catch (e) {
                console.error("Autoload error:", e);
            }
        }
        return false;
    }

    // --- UNDO STACK ---

    undo() {
        if (this.history.length === 0 || this.isMovingState) return;
        
        const previousState = this.history.pop();
        this.score = previousState.score;
        this.moves = previousState.moves;
        this.won = previousState.won;
        this.keepGoing = previousState.keepGoing;
        this.over = false;
        
        this.hideOverlay();
        
        // Rebuild elements
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.tiles = [];
        
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const val = previousState.board[r][c];
                if (val > 0) {
                    const tile = new Tile(r, c, val);
                    this.grid[r][c] = tile;
                    this.tiles.push(tile);
                }
            }
        }
        
        this.sound.playUndo();
        this.render();
        this.updateUI();
        this.saveToLocalStorage();
    }

    // --- GAME LOGIC ---

    prepareTiles() {
        this.tiles.forEach(tile => {
            tile.savePosition();
            tile.mergedInto = null;
            tile.isNew = false;
            tile.isMerged = false;
        });
    }

    getVector(direction) {
        const map = {
            'UP':    { x: 0,  y: -1 },
            'DOWN':  { x: 0,  y: 1  },
            'LEFT':  { x: -1, y: 0  },
            'RIGHT': { x: 1,  y: 0  }
        };
        return map[direction];
    }

    buildTraversals(vector) {
        const traversals = { x: [], y: [] };
        for (let i = 0; i < this.boardSize; i++) {
            traversals.x.push(i);
            traversals.y.push(i);
        }
        if (vector.x === 1) traversals.x.reverse(); // right to left
        if (vector.y === 1) traversals.y.reverse(); // bottom to top
        return traversals;
    }

    findFarthestPosition(cell, vector) {
        let previous;
        let next = { r: cell.r, c: cell.c };
        
        do {
            previous = next;
            next = { r: previous.r + vector.y, c: previous.c + vector.x };
        } while (this.withinBounds(next) && this.cellAvailable(next));
        
        return {
            farthest: previous,
            next: next
        };
    }

    withinBounds(cell) {
        return cell.r >= 0 && cell.r < this.boardSize &&
               cell.c >= 0 && cell.c < this.boardSize;
    }

    cellAvailable(cell) {
        return !this.grid[cell.r][cell.c];
    }

    movesAvailable() {
        // Empty cells available?
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (!this.grid[r][c]) return true;
            }
        }
        // Match in adjacents?
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const val = this.grid[r][c].value;
                if (c < this.boardSize - 1 && this.grid[r][c+1] && this.grid[r][c+1].value === val) return true;
                if (r < this.boardSize - 1 && this.grid[r+1][c] && this.grid[r+1][c].value === val) return true;
            }
        }
        return false;
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (!this.grid[r][c]) {
                    emptyCells.push({ r, c });
                }
            }
        }
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const val = Math.random() < 0.9 ? 2 : 4;
            const tile = new Tile(r, c, val);
            tile.isNew = true;
            this.grid[r][c] = tile;
            this.tiles.push(tile);
        }
    }

    handleMove(direction) {
        if (this.over || (this.won && !this.keepGoing) || this.isMovingState) return;

        const vector = this.getVector(direction);
        const traversals = this.buildTraversals(vector);
        
        let moved = false;
        let scoreAdded = 0;
        
        this.prepareTiles();
        
        // Track the current snapshot before moving to push to undo history
        const previousState = {
            board: this.grid.map(row => row.map(tile => tile ? tile.value : 0)),
            score: this.score,
            moves: this.moves,
            won: this.won,
            keepGoing: this.keepGoing
        };

        traversals.y.forEach(r => {
            traversals.x.forEach(c => {
                const tile = this.grid[r][c];
                if (tile) {
                    const positions = this.findFarthestPosition({ r, c }, vector);
                    const nextTile = this.withinBounds(positions.next) ? this.grid[positions.next.r][positions.next.c] : null;
                    
                    if (nextTile && nextTile.value === tile.value && !nextTile.isMerged) {
                        // Merge tiles
                        const mergedValue = tile.value * 2;
                        const mergedTile = new Tile(positions.next.r, positions.next.c, mergedValue);
                        mergedTile.isMerged = true;
                        
                        // Link sliding animations
                        tile.mergedInto = mergedTile.id;
                        tile.row = positions.next.r;
                        tile.col = positions.next.c;
                        
                        nextTile.mergedInto = mergedTile.id;
                        nextTile.row = positions.next.r;
                        nextTile.col = positions.next.c;
                        
                        // Clear source positions
                        this.grid[r][c] = null;
                        
                        // Place merged tile in next
                        this.grid[positions.next.r][positions.next.c] = mergedTile;
                        this.tiles.push(mergedTile);
                        
                        this.score += mergedValue;
                        scoreAdded += mergedValue;
                        
                        moved = true;
                    } else {
                        // Move to farthest empty position
                        this.grid[r][c] = null;
                        this.grid[positions.farthest.r][positions.farthest.c] = tile;
                        
                        if (positions.farthest.r !== r || positions.farthest.c !== c) {
                            tile.row = positions.farthest.r;
                            tile.col = positions.farthest.c;
                            moved = true;
                        }
                    }
                }
            });
        });

        if (moved) {
            // Block user inputs during transition to prevent command race conditions
            this.isMovingState = true;
            
            // Push previousState to history stack (max 100)
            this.history.push(previousState);
            if (this.history.length > 100) this.history.shift();
            
            this.moves++;
            this.addRandomTile();
            
            // Play relevant synthesized sound
            if (scoreAdded > 0) {
                this.sound.playMerge();
                this.showScoreAddition(scoreAdded);
            } else {
                this.sound.playMove();
            }

            // Sync bestScore immediately
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
            }
            
            this.render();
            this.updateUI();
            
            // Schedule the transition animation cleanup
            setTimeout(() => {
                // Filter out tiles that have finished merging into others
                this.tiles = this.tiles.filter(t => !t.mergedInto);
                this.rebuildGrid();
                
                // Final render to delete leftover DOM elements
                this.render();
                
                // Allow user moves again
                this.isMovingState = false;
                
                // Check if victory or loss occurred
                this.checkGameStatus();
                this.saveToLocalStorage();
            }, 160); // Matches CSS transition speed (0.16s)
        }
    }

    rebuildGrid() {
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.tiles.forEach(tile => {
            if (!tile.mergedInto) {
                this.grid[tile.row][tile.col] = tile;
            }
        });
    }

    checkGameStatus() {
        // Victory check
        if (!this.won && !this.keepGoing) {
            let reached2048 = false;
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.grid[r][c] && this.grid[r][c].value === 2048) {
                        reached2048 = true;
                        break;
                    }
                }
            }
            if (reached2048) {
                this.won = true;
                this.showOverlay(true);
                this.sound.playVictory();
                this.saveToLocalStorage();
                return;
            }
        }
        
        // Defeat check
        if (!this.movesAvailable()) {
            this.over = true;
            this.showOverlay(false);
            this.sound.playGameOver();
            this.saveToLocalStorage();
        }
    }

    // --- THE VIEW LAYER (DOM UPDATE) ---

    showScoreAddition(added) {
        const scoreAddEl = document.getElementById('score-addition');
        scoreAddEl.innerText = `+${added}`;
        scoreAddEl.classList.remove('active');
        void scoreAddEl.offsetWidth; // Force Reflow
        scoreAddEl.classList.add('active');
    }

    updateUI() {
        document.getElementById('score').innerText = this.score;
        document.getElementById('best-score').innerText = this.bestScore;
        document.getElementById('moves-count').innerText = this.moves;
        
        // Undo UI updates
        this.undoCount.innerText = this.history.length;
        this.undoBtn.disabled = (this.history.length === 0);
    }

    render() {
        const activeIds = new Set();
        
        this.tiles.forEach(tile => {
            activeIds.add(tile.id.toString());
            let el = this.container.querySelector(`[data-id="${tile.id}"]`);
            
            if (!el) {
                el = document.createElement('div');
                el.className = 'tile';
                el.dataset.id = tile.id;
                el.dataset.value = tile.value;
                el.innerText = tile.value;
                
                // Position via CSS Custom variables (extremely fluid and responsive)
                el.style.setProperty('--col', tile.col);
                el.style.setProperty('--row', tile.row);
                
                if (tile.isNew) {
                    el.classList.add('tile-new');
                } else if (tile.isMerged) {
                    el.classList.add('tile-merged');
                }
                
                this.container.appendChild(el);
            } else {
                // Update coordinates
                el.style.setProperty('--col', tile.col);
                el.style.setProperty('--row', tile.row);
                
                // If tile upgraded during merge, update content
                if (el.dataset.value !== tile.value.toString()) {
                    el.dataset.value = tile.value;
                    el.innerText = tile.value;
                    el.classList.add('tile-merged');
                }
            }
        });

        // Cleanup DOM nodes of merged-out tiles
        const domElements = this.container.querySelectorAll('.tile');
        domElements.forEach(el => {
            if (!activeIds.has(el.dataset.id)) {
                el.remove();
            }
        });
    }

    // --- OVERLAYS ---

    showOverlay(isVictory) {
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-msg');
        const score = document.getElementById('overlay-score');
        const moves = document.getElementById('overlay-moves');
        const actionBtn = document.getElementById('overlay-btn-action');
        const keepGoingBtn = document.getElementById('overlay-btn-keep-going');
        
        score.innerText = this.score;
        moves.innerText = this.moves;
        
        if (isVictory) {
            title.innerText = "Victory!";
            msg.innerText = "You joined the tiles and reached 2048!";
            actionBtn.innerText = "New Game";
            keepGoingBtn.classList.remove('hidden');
        } else {
            title.innerText = "Game Over";
            msg.innerText = "No more moves possible!";
            actionBtn.innerText = "Try Again";
            keepGoingBtn.classList.add('hidden');
        }
        
        overlay.classList.remove('hidden');
    }

    hideOverlay() {
        const overlay = document.getElementById('game-overlay');
        overlay.classList.add('hidden');
    }
}

// Boot the game
window.addEventListener('DOMContentLoaded', () => {
    new DOM2048();
});
