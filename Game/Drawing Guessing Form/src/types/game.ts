export type GamePhase =
  | 'LOBBY'
  | 'WORD_SELECTION'
  | 'DRAWING'
  | 'ROUND_RECAP'
  | 'MATCH_PODIUM';

export type ToolType = 'brush' | 'eraser' | 'fill';

export interface DrawPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawStroke {
  type: 'stroke';
  id: string;
  points: DrawPoint[];
  color: string;
  width: number;
  tool: ToolType;
  timestamp: number;
}

export interface FillAction {
  type: 'fill';
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

export type DrawAction = DrawStroke | FillAction;

export interface Player {
  id: string;
  username: string;
  initials: string;
  avatarUrl?: string;
  score: number;
  hasGuessedCorrectly: boolean;
  isHost: boolean;
  isDrawing: boolean;
  isWarm?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'normal' | 'warm' | 'correct' | 'system';
  isPrivateToUser?: boolean;
  timestamp: number;
  pointsAwarded?: number;
}

export interface WordChoice {
  word: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
}

export interface PartyModifiers {
  blindfoldMode: boolean; // Ink fades after 1 second for the drawer
  oneLineOnly: boolean;   // Pen cannot be lifted once drawing begins
  activeDeck: string;     // 'Woodland Studio' | 'Tech Chaos' | 'Animals' | 'Foodie' | 'Custom'
  customWords: string[];  // User pasted words
}

export interface GameLobbyState {
  roomId: string;
  round: {
    current: number;
    total: number;
  };
  phase: GamePhase;
  timeLeft: number;
  maxTime: number;
  currentArtistId: string;
  hiddenWord: string;       // Masked as "_ _ _ _" for guessers
  targetWord: string;       // Raw target word
  activeCategory: string;   // Category hint
  wordChoices?: WordChoice[];
  players: Player[];
  canvasState: {
    actions: DrawAction[];
    backgroundColor: string;
  };
  modifiers: PartyModifiers;
  localPlayerId: string;
  isSoundEnabled: boolean;
  viewMode: 'standard' | 'mobile_stylus' | 'tv_spectator';
}
