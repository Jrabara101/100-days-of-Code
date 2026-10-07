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
  ghostPaceCurve?: number[];
  currentVelocity?: number;
  currentApm?: number;
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

export type ViewportMode = 'RUNNER' | 'CASTER' | 'SPLIT_BOARD';
