export type PlayerRole = 'CIVILIAN' | 'WEREWOLF';

export type FsmState = 'SETUP' | 'REVEAL' | 'CLUES' | 'VOTING' | 'REBUTTAL' | 'SETTLEMENT';

export type NavSection = 'chamber' | 'switchboard' | 'dossiers' | 'evidence' | 'logs';

export interface Player {
  id: number;
  name: string;
  codename: string;
  title: string;
  isHuman: boolean;
  role: PlayerRole;
  word: string;
  alive: boolean;
  clue: string;
  clueHistory: string[];
  votes: number;
  suspicion: number; // 0.0 to 1.0 (Bayesian posterior probability)
  divergenceScore: number; // 0.0 to 1.0 divergence from civilian ground-truth
  colorHex: string;
  badge: string;
  perk: string;
}

export interface WordPair {
  id: string;
  title: string;
  category: string;
  civilianWord: string;
  werewolfWord: string;
  civilianClues: string[];
  werewolfClues: string[];
  description: string;
  divergenceHint: string;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  tickHex: string;
  type: 'SYSTEM' | 'CLUE' | 'VOTE' | 'BAYES' | 'VERDICT' | 'REBUTTAL';
  message: string;
  sender?: string;
  highlight?: boolean;
}

export interface CouncilSessionState {
  state: FsmState;
  round: number;
  tick: number;
  tickHex: string;
  players: Player[];
  currentWordPair: WordPair;
  civilianWord: string;
  werewolfWord: string;
  werewolfId: number;
  clueTurnIndex: number;
  cluesSubmitted: number;
  convictedPlayerId: number;
  winnerTeam: 'CIVILIANS' | 'WEREWOLF' | '';
  victoryReason: string;
  userPlayer: Player;
  telemetryLog: TelemetryEvent[];
  rebuttalGuessedWord?: string;
  isRebuttalCorrect?: boolean;
  deliberationTimeLeft: number;
}
