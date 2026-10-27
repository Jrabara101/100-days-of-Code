import { Chess, Square, PieceSymbol, Color } from 'chess.js';

export interface MoveResult {
  success: boolean;
  san?: string;
  from?: string;
  to?: string;
  captured?: PieceSymbol;
  color?: Color;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isDraw?: boolean;
  isStalemate?: boolean;
  promotion?: string;
}

export interface CapturedPieces {
  w: PieceSymbol[];
  b: PieceSymbol[];
  scoreDiff: number; // positive = white ahead, negative = black ahead
}

export interface CandidateMove {
  san: string;
  from: string;
  to: string;
  promotion?: string;
  score: number;
}

export interface TacticalAnalysis {
  bestMove: {
    from: string;
    to: string;
    promotion?: string;
    san: string;
  };
  scoreCentipawns: number;
  evalText: string;
  evalBarPercent: number; // 0 to 100 for visual evaluation bar
  tacticalSummary: string;
  tacticalPoints: string[];
  turn: 'w' | 'b';
  alternatives: CandidateMove[];
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

// Positional Piece-Square Tables (from White's perspective)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

export class ChessGame {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public loadFen(fen: string) {
    this.chess.load(fen);
  }

  public reset() {
    this.chess.reset();
  }

  public getTurn(): Color {
    return this.chess.turn();
  }

  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  public isCheck(): boolean {
    return this.chess.inCheck();
  }

  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  public isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  public getHistory(): string[] {
    return this.chess.history();
  }

  public getPiece(square: string) {
    return this.chess.get(square as Square);
  }

  public getBoard() {
    return this.chess.board();
  }

  /**
   * Get king square for color ('w' or 'b')
   */
  public getKingSquare(color: Color): string | null {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          const file = String.fromCharCode(97 + c);
          const rank = (8 - r).toString();
          return `${file}${rank}`;
        }
      }
    }
    return null;
  }

  /**
   * Get legal destination squares for a chosen origin square
   */
  public getLegalMovesForSquare(square: string): string[] {
    try {
      const moves = this.chess.moves({ square: square as Square, verbose: true });
      return moves.map((m) => m.to);
    } catch {
      return [];
    }
  }

  /**
   * Make a chess move
   */
  public makeMove(from: string, to: string, promotion: string = 'q'): MoveResult {
    try {
      const move = this.chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion as 'n' | 'b' | 'r' | 'q',
      });

      if (!move) {
        return { success: false };
      }

      return {
        success: true,
        san: move.san,
        from: move.from,
        to: move.to,
        captured: move.captured,
        color: move.color,
        isCheck: this.chess.inCheck(),
        isCheckmate: this.chess.isCheckmate(),
        isDraw: this.chess.isDraw(),
        isStalemate: this.chess.isStalemate(),
        promotion: move.promotion,
      };
    } catch (e) {
      return { success: false };
    }
  }

  /**
   * Check if a move needs pawn promotion
   */
  public isPromotionMove(from: string, to: string): boolean {
    const piece = this.chess.get(from as Square);
    if (!piece || piece.type !== 'p') return false;
    const destRank = to[1];
    return (piece.color === 'w' && destRank === '8') || (piece.color === 'b' && destRank === '1');
  }

  /**
   * Calculate captured pieces and score difference
   */
  public getCapturedPieces(): CapturedPieces {
    const fullSet: Record<PieceSymbol, number> = {
      p: 8,
      n: 2,
      b: 2,
      r: 2,
      q: 1,
      k: 1,
    };

    const currentCounts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } as Record<PieceSymbol, number>,
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } as Record<PieceSymbol, number>,
    };

    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          currentCounts[piece.color][piece.type]++;
        }
      }
    }

    const capturedW: PieceSymbol[] = [];
    const capturedB: PieceSymbol[] = [];
    let whiteScore = 0;
    let blackScore = 0;

    const types: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q'];
    types.forEach((t) => {
      // White pieces lost (captured by black)
      const missingWhite = Math.max(0, fullSet[t] - currentCounts.w[t]);
      for (let i = 0; i < missingWhite; i++) {
        capturedW.push(t);
        blackScore += PIECE_VALUES[t];
      }
      // Black pieces lost (captured by white)
      const missingBlack = Math.max(0, fullSet[t] - currentCounts.b[t]);
      for (let i = 0; i < missingBlack; i++) {
        capturedB.push(t);
        whiteScore += PIECE_VALUES[t];
      }
    });

    return {
      w: capturedW,
      b: capturedB,
      scoreDiff: whiteScore - blackScore,
    };
  }

  /**
   * Compute best move using Minimax / Alpha-Beta evaluation
   */
  public getBestAIMove(difficulty: 'novice' | 'apprentice' | 'master'): { from: string; to: string; promotion?: string } | null {
    const moves = this.chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    if (difficulty === 'novice') {
      // Random move with bias towards captures
      const captureMoves = moves.filter((m) => m.captured);
      if (captureMoves.length > 0 && Math.random() < 0.6) {
        const m = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        return { from: m.from, to: m.to, promotion: m.promotion || 'q' };
      }
      const m = moves[Math.floor(Math.random() * moves.length)];
      return { from: m.from, to: m.to, promotion: m.promotion || 'q' };
    }

    const depth = difficulty === 'apprentice' ? 2 : 3;
    const isMaximizing = this.chess.turn() === 'w';

    let bestMove = moves[0];
    let bestValue = isMaximizing ? -Infinity : Infinity;

    // Shuffle moves slightly to avoid deterministic repetitive lines
    const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);

    for (const move of shuffledMoves) {
      this.chess.move(move);
      const val = this.minimax(depth - 1, -Infinity, Infinity, !isMaximizing);
      this.chess.undo();

      if (isMaximizing) {
        if (val > bestValue) {
          bestValue = val;
          bestMove = move;
        }
      } else {
        if (val < bestValue) {
          bestValue = val;
          bestMove = move;
        }
      }
    }

    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || 'q',
    };
  }

  private evaluateBoard(): number {
    let total = 0;
    const board = this.chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const pieceVal = PIECE_VALUES[piece.type] * 100;
        let posVal = 0;

        // Position lookup: flip row for black
        const rowIdx = piece.color === 'w' ? r : 7 - r;
        const colIdx = c;
        const squareIdx = rowIdx * 8 + colIdx;

        switch (piece.type) {
          case 'p':
            posVal = PAWN_TABLE[squareIdx];
            break;
          case 'n':
            posVal = KNIGHT_TABLE[squareIdx];
            break;
          case 'b':
            posVal = BISHOP_TABLE[squareIdx];
            break;
          case 'r':
            posVal = ROOK_TABLE[squareIdx];
            break;
          case 'q':
            posVal = QUEEN_TABLE[squareIdx];
            break;
          case 'k':
            posVal = KING_TABLE[squareIdx];
            break;
        }

        const score = pieceVal + posVal;
        if (piece.color === 'w') {
          total += score;
        } else {
          total -= score;
        }
      }
    }

    return total;
  }

  private minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || this.chess.isGameOver()) {
      if (this.chess.isCheckmate()) {
        return isMaximizing ? -99999 : 99999;
      }
      if (this.chess.isDraw()) {
        return 0;
      }
      return this.evaluateBoard();
    }

    const moves = this.chess.moves({ verbose: true });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.chess.move(move);
        const evaluation = this.minimax(depth - 1, alpha, beta, false);
        this.chess.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.chess.move(move);
        const evaluation = this.minimax(depth - 1, alpha, beta, true);
        this.chess.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  /**
   * Deep Tactical Position Analysis
   * Evaluates position, finds the optimal move, calculates centipawn score,
   * and generates human-like tactical insights and alternative candidate moves.
   */
  public analyzePosition(): TacticalAnalysis | null {
    const moves = this.chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    const currentTurn = this.chess.turn();
    const isMaximizing = currentTurn === 'w';

    // Evaluate each legal candidate move at depth 3
    const scoredMoves: CandidateMove[] = [];
    for (const move of moves) {
      this.chess.move(move);
      const score = this.minimax(2, -Infinity, Infinity, !isMaximizing);
      this.chess.undo();
      scoredMoves.push({
        san: move.san,
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        score,
      });
    }

    // Sort moves by score (highest first for White, lowest first for Black)
    scoredMoves.sort((a, b) => (isMaximizing ? b.score - a.score : a.score - b.score));
    const bestCandidate = scoredMoves[0];
    const bestMoveObj = moves.find((m) => m.from === bestCandidate.from && m.to === bestCandidate.to) || moves[0];

    const rawScore = bestCandidate.score / 100;
    const sign = rawScore > 0 ? '+' : '';
    let evalText = '';

    if (Math.abs(bestCandidate.score) > 90000) {
      evalText = isMaximizing ? 'Forced Mate for White' : 'Forced Mate for Black';
    } else if (Math.abs(rawScore) <= 0.3) {
      evalText = `${sign}${rawScore.toFixed(1)} · Dynamically Balanced`;
    } else if (rawScore > 0) {
      evalText = `${sign}${rawScore.toFixed(1)} · Advantage White`;
    } else {
      evalText = `${rawScore.toFixed(1)} · Advantage Black`;
    }

    // Centipawn gauge percentage for evaluation bar (50 = equal)
    const evalBarPercent = Math.max(5, Math.min(95, 50 + rawScore * 8));

    // Tactical reason breakdown
    let tacticalSummary = '';
    const tacticalPoints: string[] = [];
    const pieceMoved = bestMoveObj.piece.toUpperCase();
    const isCapture = !!bestMoveObj.captured;
    const isCastling = bestMoveObj.san === 'O-O' || bestMoveObj.san === 'O-O-O';
    const isCheck = bestMoveObj.san.includes('+');
    const isMate = bestMoveObj.san.includes('#');

    const pieceNames: Record<string, string> = {
      P: 'pawn',
      N: 'knight',
      B: 'bishop',
      R: 'rook',
      Q: 'queen',
      K: 'king',
    };

    if (isMate) {
      tacticalSummary = `Decisive blow: ${bestMoveObj.san} delivers checkmate!`;
      tacticalPoints.push('Traps the enemy king with no escaping squares.');
    } else if (isCheck) {
      tacticalSummary = `Aggressive check with ${bestMoveObj.san}, seizing the tactical initiative.`;
      tacticalPoints.push('Forces defensive responses, disrupting opponent tempo.');
    } else if (isCapture) {
      const capName = pieceNames[bestMoveObj.captured?.toUpperCase() || ''] || 'piece';
      tacticalSummary = `Winning material: captures the enemy ${capName} on ${bestMoveObj.to}.`;
      tacticalPoints.push(`Simplifies the position while cementing material advantage.`);
    } else if (isCastling) {
      tacticalSummary = `Castling (${bestMoveObj.san}): secures King safety and connects back-rank Rooks.`;
      tacticalPoints.push('Tucks the sovereign behind a solid pawn fortress.');
    } else if (pieceMoved === 'N') {
      const isCenter = ['d4', 'd5', 'e4', 'e5', 'c3', 'c4', 'c5', 'c6', 'f3', 'f4', 'f5', 'f6'].includes(bestMoveObj.to);
      tacticalSummary = isCenter
        ? `Centralizes the knight to ${bestMoveObj.to}, dominating vital outposts.`
        : `Reroutes the knight to ${bestMoveObj.to} to threaten tactical infiltration.`;
      tacticalPoints.push('Knights excel on central squares controlling up to 8 radial targets.');
    } else if (pieceMoved === 'B') {
      tacticalSummary = `Activates the bishop along the open diagonal toward ${bestMoveObj.to}.`;
      tacticalPoints.push('Applies long-range pressure across key diagonal diagonals.');
    } else if (pieceMoved === 'R') {
      tacticalSummary = `Slides rook to ${bestMoveObj.to} to command the vertical file.`;
      tacticalPoints.push('Rooks provide decisive pressure along open ranks and files.');
    } else if (pieceMoved === 'Q') {
      tacticalSummary = `Deploys Queen to ${bestMoveObj.to}, radiating offensive pressure.`;
      tacticalPoints.push('Combines long-range diagonal and linear strike capabilities.');
    } else {
      const isCenterPawn = ['e4', 'd4', 'e5', 'd5'].includes(bestMoveObj.to);
      tacticalSummary = isCenterPawn
        ? `Claims space in the center with ${bestMoveObj.san}, opening line development.`
        : `Advances pawn to ${bestMoveObj.to}, strengthening pawn structure.`;
      tacticalPoints.push('Establishes spatial presence while restricting opponent piece mobility.');
    }

    return {
      bestMove: {
        from: bestCandidate.from,
        to: bestCandidate.to,
        promotion: bestCandidate.promotion,
        san: bestCandidate.san,
      },
      scoreCentipawns: bestCandidate.score,
      evalText,
      evalBarPercent,
      tacticalSummary,
      tacticalPoints,
      turn: currentTurn,
      alternatives: scoredMoves.slice(1, 3),
    };
  }
}
