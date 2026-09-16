/**
 * Deterministic 9-bit Bitboard Game Logic & Finite State Machine
 * Cell layout index mapping:
 * [0] [1] [2]      (Row 0: 0b000000111 = 7)
 * [3] [4] [5]      (Row 1: 0b000111000 = 56)
 * [6] [7] [8]      (Row 2: 0b111000000 = 448)
 *
 * Cols:
 * 0: 0b001001001 = 73
 * 1: 0b010010010 = 146
 * 2: 0b100100100 = 292
 *
 * Diagonals:
 * Main (0,4,8): 0b100010001 = 273
 * Anti (2,4,6): 0b001010100 = 84
 */

export const WIN_MASKS = [
  { mask: 7, indices: [0, 1, 2], name: 'Row 1' },
  { mask: 56, indices: [3, 4, 5], name: 'Row 2' },
  { mask: 448, indices: [6, 7, 8], name: 'Row 3' },
  { mask: 73, indices: [0, 3, 6], name: 'Col 1' },
  { mask: 146, indices: [1, 4, 7], name: 'Col 2' },
  { mask: 292, indices: [2, 5, 8], name: 'Col 3' },
  { mask: 273, indices: [0, 4, 8], name: 'Main Diagonal' },
  { mask: 84, indices: [2, 4, 6], name: 'Anti Diagonal' },
];

export const FULL_BOARD_MASK = 511; // 0b111111111

export class BitboardEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.mx = 0; // Player X bitboard
    this.mo = 0; // Player O bitboard
    this.currentTurn = 'X'; // 'X' or 'O'
    this.status = 'IN_PROGRESS'; // 'IN_PROGRESS' | 'WON' | 'DRAW'
    this.winner = null; // 'X' | 'O' | null
    this.winningMask = null;
    this.winningIndices = null;
    this.moveCount = 0;
    this.moveHistory = [];
  }

  getState() {
    return {
      mx: this.mx,
      mo: this.mo,
      occupiedMask: this.mx | this.mo,
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      winningMask: this.winningMask,
      winningIndices: this.winningIndices,
      moveCount: this.moveCount,
      moveHistory: [...this.moveHistory],
    };
  }

  isCellOccupied(index) {
    if (index < 0 || index > 8) return true;
    const bit = 1 << index;
    return (this.mx & bit) !== 0 || (this.mo & bit) !== 0;
  }

  /**
   * O(1) evaluation of bitboard against win masks
   * HasWon(M) <=> exists w in W such that (M & w) == w
   */
  evaluateWin(mask) {
    for (let i = 0; i < WIN_MASKS.length; i++) {
      const winPattern = WIN_MASKS[i];
      if ((mask & winPattern.mask) === winPattern.mask) {
        return winPattern;
      }
    }
    return null;
  }

  /**
   * Attempt to commit a move at given cell index (0..8)
   * Returns: { success: boolean, move?: object, error?: string }
   */
  makeMove(index, expectedPlayer = null) {
    if (this.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Game has already concluded.' };
    }

    if (index < 0 || index > 8) {
      return { success: false, error: `Invalid cell index: ${index}` };
    }

    if (expectedPlayer && expectedPlayer !== this.currentTurn) {
      return { success: false, error: `Not player ${expectedPlayer}'s turn.` };
    }

    const bit = 1 << index;
    if ((this.mx & bit) !== 0 || (this.mo & bit) !== 0) {
      return { success: false, error: `Cell ${index} is already occupied.` };
    }

    const player = this.currentTurn;
    if (player === 'X') {
      this.mx |= bit;
    } else {
      this.mo |= bit;
    }

    this.moveCount++;
    const moveRecord = {
      index,
      player,
      moveNumber: this.moveCount,
      timestamp: Date.now(),
      mx: this.mx,
      mo: this.mo,
    };
    this.moveHistory.push(moveRecord);

    // Evaluate win condition
    const currentMask = player === 'X' ? this.mx : this.mo;
    const winPattern = this.evaluateWin(currentMask);

    if (winPattern) {
      this.status = 'WON';
      this.winner = player;
      this.winningMask = winPattern.mask;
      this.winningIndices = winPattern.indices;
    } else if ((this.mx | this.mo) === FULL_BOARD_MASK) {
      this.status = 'DRAW';
      this.winner = null;
    } else {
      this.currentTurn = player === 'X' ? 'O' : 'X';
    }

    return {
      success: true,
      move: moveRecord,
      state: this.getState(),
    };
  }

  /**
   * Minimax AI move calculation for single player mode
   */
  getBestAIMove(aiPlayer = 'O') {
    if (this.status !== 'IN_PROGRESS') return null;

    const available = [];
    for (let i = 0; i < 9; i++) {
      if (!this.isCellOccupied(i)) available.push(i);
    }
    if (available.length === 0) return null;

    // Fast heuristic checks: 1) Instant win for AI
    for (const cell of available) {
      const bit = 1 << cell;
      const testMask = aiPlayer === 'X' ? (this.mx | bit) : (this.mo | bit);
      if (this.evaluateWin(testMask)) return cell;
    }

    // 2) Instant block human win
    const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';
    for (const cell of available) {
      const bit = 1 << cell;
      const testMask = humanPlayer === 'X' ? (this.mx | bit) : (this.mo | bit);
      if (this.evaluateWin(testMask)) return cell;
    }

    // 3) Center preference
    if (available.includes(4)) return 4;

    // 4) Corners preference
    const corners = [0, 2, 6, 8].filter(c => available.includes(c));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5) Any remaining
    return available[Math.floor(Math.random() * available.length)];
  }
}
