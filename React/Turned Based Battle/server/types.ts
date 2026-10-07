import {
  FighterStance,
  ActionType,
  ElementType,
  AbilityDefinition,
  StatusEffect,
  FighterEntity,
  TurnEvent,
  CombatRoundResolution,
  MatchStats,
  CombatGameState,
  ActionCommitPayload,
  ClientWsMessage,
  ServerWsMessage,
} from '../src/types/combat.js';

export type {
  FighterStance,
  ActionType,
  ElementType,
  AbilityDefinition,
  StatusEffect,
  FighterEntity,
  TurnEvent,
  CombatRoundResolution,
  MatchStats,
  CombatGameState,
  ActionCommitPayload,
  ClientWsMessage,
  ServerWsMessage,
};

export interface PlayerSession {
  token: string;
  name: string;
  slot: 'host' | 'guest';
  ws?: unknown; // WebSocket
  isAi?: boolean;
  committedAction?: ActionCommitPayload;
  fighter: FighterEntity;
  ready: boolean;
}

export interface GameRoom {
  id: string;
  code: string;
  phase: 'LOBBY' | 'PLANNING_PHASE' | 'SIMULTANEOUS_COMMIT' | 'RESOLVING_ACTIONS' | 'MATCH_OVER';
  roundNumber: number;
  planningTimerEnd: number;
  timerInterval?: NodeJS.Timeout;
  host: PlayerSession;
  guest?: PlayerSession;
  resolutionHistory: CombatRoundResolution[];
  lastResolution?: CombatRoundResolution;
  winnerId?: string;
  stats: MatchStats;
  isAiMatch: boolean;
  createdAt: number;
}
