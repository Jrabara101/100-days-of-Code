export type FighterStance = 'BALANCED' | 'AGGRESSIVE' | 'DEFENSIVE';
export type ActionType = 'ATTACK' | 'DEFEND' | 'SKILL' | 'ULTIMATE';
export type ElementType = 'PHYSICAL' | 'FIRE' | 'ICE' | 'LIGHTNING';

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  type: ActionType;
  element: ElementType;
  energyCost: number;
  cooldownTurns: number;
  currentCooldown: number;
  baseDamage: number;
  priority: number; // 0 (Heavy) to 3 (Defense/Evade)
  staggerDamage: number;
  iconName: string;
  hotkey?: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'BUFF' | 'DEBUFF';
  durationTurns: number;
  statModifier?: { attack?: number; defense?: number; speed?: number };
  damagePerTurn?: number;
  icon?: string;
  description?: string;
}

export interface FighterEntity {
  id: string;
  name: string;
  avatarUrl: string;
  currentHp: number;
  maxHp: number;
  currentEnergy: number;
  maxEnergy: number;
  staggerMeter: number; // 0 to 100
  isStaggered: boolean;
  abilities: AbilityDefinition[];
  activeStatuses: StatusEffect[];
  selectedActionId: string | null;
  isActionCommitted: boolean;
  stance: FighterStance;
  speed: number;
  shield?: number;
  isAi?: boolean;
}

export interface TurnEvent {
  actingFighterId: string;
  targetFighterId: string;
  actionId: string;
  actionName: string;
  actionType: ActionType;
  elementType: ElementType;
  damageDealt: number;
  wasCritical: boolean;
  wasBlocked: boolean;
  wasParried: boolean;
  staggerInflicted: number;
  resultantHp: number;
  resultantStagger: number;
  staggerBreakOccurred: boolean;
  logText: string;
  energyRefunded?: number;
  energySpent?: number;
}

export interface CombatRoundResolution {
  roundNumber: number;
  turnEvents: TurnEvent[];
}

export interface MatchStats {
  totalRounds: number;
  playerDamageDealt: number;
  enemyDamageDealt: number;
  playerCrits: number;
  staggerBreaks: number;
  mvpAbility: string;
}

export interface CombatGameState {
  roomId: string;
  roomCode: string;
  phase: 'LOBBY' | 'PLANNING_PHASE' | 'SIMULTANEOUS_COMMIT' | 'RESOLVING_ACTIONS' | 'MATCH_OVER';
  roundNumber: number;
  planningTimeRemainingMs: number;
  playerFighter: FighterEntity;
  enemyFighter: FighterEntity;
  resolutionQueue: CombatRoundResolution | null;
  winnerId?: string;
  matchStats?: MatchStats;
  isPvP?: boolean;
  playerSlot?: 'host' | 'guest';
}

export interface FloatingTextItem {
  id: string;
  text: string;
  type: 'damage' | 'crit' | 'block' | 'parry' | 'break' | 'heal' | 'energy';
  targetFighterId: string;
  xOffset?: number;
}

export interface ActionCommitPayload {
  actionId: string;
  targetId: string;
  stanceModifier: FighterStance;
}

// WebSocket message protocols
export type ClientWsMessage =
  | { type: 'CREATE_ROOM'; payload: { fighterName: string; isAi: boolean } }
  | { type: 'JOIN_ROOM'; payload: { roomCode: string; fighterName: string } }
  | { type: 'COMMIT_ACTION'; payload: ActionCommitPayload }
  | { type: 'READY_CHECK'; payload: { ready: boolean } }
  | { type: 'REQUEST_REMATCH' }
  | { type: 'RECONNECT'; payload: { token: string; roomCode: string } };

export type ServerWsMessage =
  | { type: 'ROOM_CREATED'; payload: { roomId: string; roomCode: string; token: string; slot: 'host' } }
  | { type: 'ROOM_JOINED'; payload: { roomId: string; roomCode: string; token: string; slot: 'guest' } }
  | { type: 'OPPONENT_JOINED'; payload: { opponentName: string } }
  | { type: 'STATE_SYNC'; payload: CombatGameState }
  | { type: 'OPPONENT_COMMITTED'; payload: { isCommitted: boolean } }
  | { type: 'ROUND_RESOLVED'; payload: CombatRoundResolution }
  | { type: 'TIMER_TICK'; payload: { timeRemainingMs: number } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'MATCH_ENDED'; payload: { winnerId: string; stats: MatchStats } };
