export type HitJudgement = 'MARVELOUS' | 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
export type NoteType = 'tap' | 'hold';

export interface BeatmapNote {
  id: string;
  lane: 0 | 1 | 2 | 3;
  targetTimeMs: number;
  durationMs?: number; // For hold notes
  type: NoteType;
  isFever?: boolean; // Gold fever notes give bonus fever meter & score
}

export interface Beatmap {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  audioUrl?: string;
  synthTheme?: 'synthwave' | 'cyberpunk' | 'drumandbass' | 'chiptune';
  offsetMs: number;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Expert';
  starRating: number;
  notes: BeatmapNote[];
  durationMs: number;
}

export interface InputTelemetry {
  timeMs: number;
  lane: 0 | 1 | 2 | 3;
  action: 'DOWN' | 'UP';
}

export interface RunSubmission {
  songId: string;
  beatmapSnapshot?: Beatmap;
  inputTelemetry: InputTelemetry[];
  clientReportedScore?: number;
  playerName: string;
}

export interface ScoreValidationResult {
  isValid: boolean;
  score: number;
  grade: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' | 'FAIL';
  accuracy: number;
  maxCombo: number;
  judgementCounts: Record<HitJudgement, number>;
  totalNotes: number;
  reason?: string;
  ghostReplay?: InputTelemetry[];
}

export interface LeaderboardEntry {
  id: string;
  songId: string;
  playerName: string;
  score: number;
  grade: string;
  accuracy: number;
  maxCombo: number;
  timestamp: number;
  ghostTelemetry: InputTelemetry[];
}

export interface RhythmGameState {
  status: 'IDLE' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'FAILED' | 'COMPLETED';
  currentSong: Beatmap | null;
  score: number;
  multiplier: number;
  combo: number;
  maxCombo: number;
  health: number; // 0.0 - 100.0
  feverGauge: number; // 0.0 - 100.0
  isFeverActive: boolean;
  judgementCounts: Record<HitJudgement, number>;
  latestJudgement: { rating: HitJudgement; timestamp: number; deltaMs: number } | null;
  settings: {
    audioOffsetMs: number;
    scrollSpeed: number; // approach rate (1.0 - 5.0)
    zenMode: boolean;
    ghostEnabled: boolean;
    volume: number;
  };
}
