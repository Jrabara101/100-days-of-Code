export interface SyncRequestPayload {
  playerId: string;
  handle?: string;
  lastSavedAt: number;
  localCurrency: string;
  lifetimeCurrency?: string;
  highestCps?: string;
  generators: Record<string, number>;
  upgrades: string[];
  prestigeShards?: number;
  tapCount?: number;
  tapSampleDeltas?: number[]; // ms between recent taps for cadence analysis
}

export interface SyncResponse {
  serverTime: number;
  offlineSeconds: number;
  offlineGains: string;
  validatedCurrency: string;
  serverCps: string;
  antiCheatStatus: 'VALID' | 'CADENCE_WARNING' | 'ANOMALOUS';
  message?: string;
}

export interface PrestigeRequestPayload {
  playerId: string;
  handle?: string;
  lifetimeCurrency: string;
  generators: Record<string, number>;
  upgrades: string[];
  totalPlaytimeSeconds?: number;
}

export interface PrestigeResponse {
  approved: boolean;
  awardedShards: number;
  totalShards: number;
  serverTime: number;
  antiCheatStatus: 'VALID' | 'FLAGGED';
  reason?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  handle: string;
  lifetimeCurrency: string;
  prestigeShards: number;
  highestCps: string;
  updatedAt: number;
  isVerified: boolean;
}

export interface WsMessage {
  type: 'LEADERBOARD_UPDATE' | 'COSMIC_ANOMALY' | 'SYNC_ACK' | 'HEARTBEAT';
  payload: any;
}
