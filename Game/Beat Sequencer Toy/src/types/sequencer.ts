export type SoundKitId = 'lofi_tape' | 'neon_808' | 'chiptune' | 'toy_foley';

export type StutterType = 'none' | '1/8' | '1/16' | '1/32';

export interface SequencerTrack {
  id: string;
  name: string;
  sampleUrl?: string;
  steps: boolean[]; // 16 boolean flags
  volume: number; // 0.0 - 1.0
  pan: number; // -1.0 to 1.0
  isMuted: boolean;
  isSoloed: boolean;
  pitchOffset: number; // in semitones (-12 to +12)
  accentColor: string;
}

export interface MasterEffectsState {
  filterCutoff: number; // 20 - 20000 Hz
  tapeStopActive: boolean;
  activeStutter: StutterType;
}

export interface BeatSequencerState {
  bpm: number;
  swing: number; // 0.0 - 1.0
  isPlaying: boolean;
  currentStep: number;
  activeKit: SoundKitId;
  tracks: SequencerTrack[];
  masterEffects: MasterEffectsState;
}

export interface SerializedPattern {
  version: number;
  bpm: number;
  swing: number;
  activeKit: SoundKitId;
  tracks: {
    id: string;
    steps: boolean[];
    pitchOffset: number;
    volume?: number;
    pan?: number;
  }[];
}
