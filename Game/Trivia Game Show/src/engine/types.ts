export type FSMPhase =
  | 'INTRO'
  | 'COUNTDOWN'
  | 'LOCKED'
  | 'REVEAL'
  | 'GAME_OVER'
  | 'VICTORY';

export interface Question {
  tier: number;
  category: string;
  question: string;
  options: [string, string, string, string];
  correct: number; // 0..3
  explanation: string;
  pollPercentages: [number, number, number, number];
}

export interface PrizeTier {
  tier: number;
  bounty: number;
  safe: boolean;
}

export interface LifelineState {
  fiftyFifty: boolean;
  freeze: boolean;
  skip: boolean;
}

export interface EngineSnapshot {
  phase: FSMPhase;
  tierIndex: number;
  question: Question;
  remainingMs: number;
  totalDuration: number;
  selectedOption: number | null;
  isCorrect: boolean | null;
  roundPoints: number;
  totalScore: number;
  safeHavenScore: number;
  streak: number;
  lifelines: LifelineState;
  hiddenOptions: number[];
  isFrozen: boolean;
  freezeRemainingMs: number;
  lastAnswerTimeMs: number | null;
}
