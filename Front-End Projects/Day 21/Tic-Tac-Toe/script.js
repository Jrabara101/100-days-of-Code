// Game state array - represents the 3x3 board
// 0 = empty, 1 = X, 2 = O
let gameState = [0, 0, 0, 0, 0, 0, 0, 0, 0];

// Current player: true = X, false = O
let currentPlayer = true;

// Game over flag
let gameOver = false;

// DOM elements
const cells = document.querySelectorAll('.cell');
const currentPlayerDisplay = document.getElementById('current-player');
const gameStatusDisplay = document.getElementById('game-status');
const resetBtn = document.getElementById('reset-btn');

// Initialize game
function initGame() {
    gameState = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    currentPlayer = true;
    gameOver = false;
    
    // Clear all cells
    cells.forEach((cell, index) => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'disabled', 'winning');
        cell.setAttribute('data-index', index);
    });
    
    updateDisplay();
    gameStatusDisplay.textContent = '';
}

// Update display elements
function updateDisplay() {
    currentPlayerDisplay.textContent = currentPlayer ? 'X' : 'O';
    currentPlayerDisplay.style.color = currentPlayer ? '#667eea' : '#764ba2';
}

// Make a move
function makeMove(index) {
    // Check if cell is empty and game is not over
    if (gameState[index] !== 0 || gameOver) {
        return false;
    }
    
    // Update game state
    gameState[index] = currentPlayer ? 1 : 2;
    
    // Update UI
    const cell = cells[index];
    cell.textContent = currentPlayer ? 'X' : 'O';
    cell.classList.add(currentPlayer ? 'x' : 'o');
    cell.classList.add('disabled');
    
    // Check for win or draw
    const winner = checkWin();
    if (winner) {
        gameOver = true;
        highlightWinningCells(winner.winningCells);
        gameStatusDisplay.textContent = `Player ${currentPlayer ? 'X' : 'O'} wins!`;
        gameStatusDisplay.style.color = '#28a745';
        disableAllCells();
        return true;
    }
    
    if (checkDraw()) {
        gameOver = true;
        gameStatusDisplay.textContent = "It's a draw!";
        gameStatusDisplay.style.color = '#ffc107';
        return true;
    }
    
    // Switch player
    currentPlayer = !currentPlayer;
    updateDisplay();
    return true;
}

// Check for win condition
function checkWin() {
    // Winning combinations (indices)
    const winCombinations = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal top-left to bottom-right
        [2, 4, 6]  // Diagonal top-right to bottom-left
    ];
    
    // Check each winning combination
    for (let combo of winCombinations) {
        const [a, b, c] = combo;
        
        // Check if all three cells have the same non-zero value
        if (gameState[a] !== 0 && 
            gameState[a] === gameState[b] && 
            gameState[a] === gameState[c]) {
            return {
                winner: gameState[a],
                winningCells: combo
            };
        }
    }
    
    return null;
}

// Check for draw
function checkDraw() {
    // Draw if all cells are filled and no winner
    return gameState.every(cell => cell !== 0);
}

// Highlight winning cells
function highlightWinningCells(winningCells) {
    winningCells.forEach(index => {
        cells[index].classList.add('winning');
    });
}

// Disable all cells
function disableAllCells() {
    cells.forEach(cell => {
        cell.classList.add('disabled');
    });
}

// Click event handling
cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        makeMove(index);
    });
});

// Keypress event handling (number keys 1-9)
document.addEventListener('keypress', (e) => {
    // Map number keys 1-9 to board indices
    const keyMap = {
        '1': 0, '2': 1, '3': 2,
        '4': 3, '5': 4, '6': 5,
        '7': 6, '8': 7, '9': 8
    };
    
    const key = e.key;
    if (keyMap.hasOwnProperty(key)) {
        const index = keyMap[key];
        makeMove(index);
        // Focus the cell for visual feedback
        cells[index].focus();
    }
});

// Reset button event
resetBtn.addEventListener('click', () => {
    initGame();
});

// Initialize game on load
initGame();

