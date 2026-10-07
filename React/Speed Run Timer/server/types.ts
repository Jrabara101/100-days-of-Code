export type RaceStatus = 'LOBBY' | 'STARTING_COUNTDOWN' | 'RACING' | 'SPLIT_IN_PROGRESS' | 'RACE_FINISHED';

export interface SplitSegmentDefinition {
  id: string;
  name: string;
  targetDurationMs?: number;
  personalBestSplitMs?: number;
  goldSegmentDurationMs?: number;
}

export interface PlayerSegmentRecord {
  splitIndex: number;
  completedAtMs: number; // Elapsed race time when split was triggered
  segmentDurationMs: number; // Time spent strictly in this segment
  isGold: boolean; // Faster than all-time best segment
  deltaVsLeaderMs: number; // Negative = ahead, Positive = behind
  deltaVsPbMs?: number;
}

export interface RaceParticipant {
  playerId: string;
  username: string;
  avatarUrl: string;
  isReady: boolean;
  hasFinished: boolean;
  currentSplitIndex: number;
  completedSplits: PlayerSegmentRecord[];
  currentRunTimeMs: number;
  finalTimeMs?: number;
  isHost: boolean;
  isGhost?: boolean;
  ghostPaceCurve?: number[]; // Pre-recorded cumulative ms per split
  currentVelocity?: number;  // px/s or speed units for esports HUD
  currentApm?: number;       // actions/inputs per minute
}

export interface MultiplayerRaceState {
  roomId: string;
  roomCode: string;
  hostPlayerId: string;
  gameTitle: string;
  categoryName: string;
  status: RaceStatus;
  countdownRemainingMs: number;
  serverStartTimestamp: number;
  segments: SplitSegmentDefinition[];
  participants: RaceParticipant[];
  myPlayerId?: string;
  startedAtUtc?: number;
  finishedAtUtc?: number;
}

export interface GameCategoryTemplate {
  id: string;
  gameTitle: string;
  categoryName: string;
  estimatedFinishMs: number;
  worldRecordTimeMs: number;
  worldRecordHolder: string;
  segments: SplitSegmentDefinition[];
}

// WebSocket message contracts
export type ClientMessage =
  | { type: 'SYNC_PING'; clientSendTime: number }
  | { type: 'CREATE_ROOM'; gameTitle: string; categoryName: string; segments?: SplitSegmentDefinition[]; username: string; avatarUrl: string }
  | { type: 'JOIN_ROOM'; roomCode: string; username: string; avatarUrl: string }
  | { type: 'TOGGLE_READY'; roomId: string; playerId: string }
  | { type: 'START_COUNTDOWN'; roomId: string; playerId: string }
  | { type: 'SUBMIT_SPLIT'; roomId: string; playerId: string; splitIndex: number; elapsedClientMs: number; telemetryHash?: string }
  | { type: 'UNDO_SPLIT'; roomId: string; playerId: string }
  | { type: 'SKIP_SPLIT'; roomId: string; playerId: string }
  | { type: 'RESET_RUN'; roomId: string; playerId: string }
  | { type: 'UPDATE_TELEMETRY'; roomId: string; playerId: string; currentRunTimeMs: number; inputRate?: number; velocity?: number }
  | { type: 'ADD_GHOST'; roomId: string; ghostType: 'WR' | 'PB' | 'DEV_TARGET' }
  | { type: 'REMOVE_GHOST'; roomId: string; ghostId: string }
  | { type: 'CHANGE_CATEGORY'; roomId: string; playerId: string; templateId: string };

export type ServerMessage =
  | { type: 'SYNC_PONG'; clientSendTime: number; serverTime: number }
  | { type: 'ROOM_STATE'; state: MultiplayerRaceState; yourPlayerId: string }
  | { type: 'ROOM_UPDATE'; state: MultiplayerRaceState }
  | { type: 'COUNTDOWN_TICK'; remainingMs: number; serverStartTimestamp: number }
  | { type: 'RACE_STARTED'; serverStartTimestamp: number }
  | { type: 'SPLIT_RECORDED'; playerId: string; splitRecord: PlayerSegmentRecord; nextSplitIndex: number; hasFinished: boolean; finalTimeMs?: number; surgeAlert?: boolean; isGold?: boolean }
  | { type: 'SURGE_ALERT'; playerId: string; username: string; message: string; isGold: boolean; splitIndex: number }
  | { type: 'ERROR'; message: string; code?: string };
