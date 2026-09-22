import { create } from 'zustand';
import { GameSettings, GameStats, GameStatus, TrackMeta, AudioMetrics, VisualTheme } from '@/types/game';
import { decodeTrackSeed, encodeTrackSeed } from '@/lib/utils';

interface CalloutState {
  message: string;
  combo: number;
  type: 'sync' | 'jump' | 'hazard';
  visible: boolean;
  color?: string;
}

interface GameStoreState {
  gameStatus: GameStatus;
  trackMeta: TrackMeta;
  settings: GameSettings;
  stats: GameStats;
  audioMetrics: AudioMetrics;
  callout: CalloutState;

  // Modal Open Controls
  isLoaderOpen: boolean;
  isSettingsOpen: boolean;
  isSummaryOpen: boolean;

  // Actions
  setGameStatus: (status: GameStatus) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  setTrackMeta: (meta: Partial<TrackMeta>) => void;
  updateAudioMetrics: (metrics: AudioMetrics) => void;
  updateStats: (partial: Partial<GameStats>) => void;
  resetStats: () => void;
  triggerCallout: (message: string, combo: number, type: 'sync' | 'jump' | 'hazard', color?: string) => void;
  hideCallout: () => void;
  setLoaderOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSummaryOpen: (open: boolean) => void;
  loadSeedFromHash: () => void;
  getShareableSeedUrl: () => string;
}

const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 1.4,
  speed: 1.0,
  visualTheme: 'neon_noir',
  zenMode: false,
  volume: 0.8,
  motionBlur: 0.65,
  cameraShake: true,
};

const DEFAULT_STATS: GameStats = {
  score: 0,
  multiplier: 1,
  combo: 0,
  maxCombo: 0,
  accuracyHits: 0,
  totalNotes: 0,
  shield: 100,
  grade: 'S',
};

const DEFAULT_TRACK: TrackMeta = {
  title: 'SYNTHWAVE ODYSSEY (140 BPM)',
  duration: 165,
  currentTime: 0,
  bpm: 140,
  sourceType: 'procedural',
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameStatus: 'READY',
  trackMeta: DEFAULT_TRACK,
  settings: DEFAULT_SETTINGS,
  stats: DEFAULT_STATS,
  audioMetrics: {
    bpm: 140,
    bassIntensity: 0.2,
    midIntensity: 0.15,
    trebleIntensity: 0.1,
    isBeat: false,
    energy: 0.15,
  },
  callout: {
    message: '',
    combo: 0,
    type: 'sync',
    visible: false,
  },

  isLoaderOpen: false,
  isSettingsOpen: false,
  isSummaryOpen: false,

  setGameStatus: (status) => set({ gameStatus: status }),

  updateSettings: (partial) => {
    set((state) => {
      const nextSettings = { ...state.settings, ...partial };
      // Sync to URL hash
      if (typeof window !== 'undefined') {
        const hash = encodeTrackSeed(nextSettings, state.trackMeta.title);
        window.history.replaceState(null, '', `#${hash}`);
      }
      return { settings: nextSettings };
    });
  },

  setTrackMeta: (meta) => set((state) => ({ trackMeta: { ...state.trackMeta, ...meta } })),

  updateAudioMetrics: (metrics) => set({ audioMetrics: metrics }),

  updateStats: (partial) => {
    set((state) => {
      const nextStats = { ...state.stats, ...partial };
      // Calculate grade
      if (nextStats.totalNotes > 0) {
        const acc = (nextStats.accuracyHits / nextStats.totalNotes) * 100;
        if (acc >= 98 && nextStats.maxCombo >= 30) nextStats.grade = 'S+';
        else if (acc >= 92) nextStats.grade = 'S';
        else if (acc >= 80) nextStats.grade = 'A';
        else if (acc >= 65) nextStats.grade = 'B';
        else nextStats.grade = 'C';
      }
      return { stats: nextStats };
    });
  },

  resetStats: () => set({ stats: { ...DEFAULT_STATS } }),

  triggerCallout: (message, combo, type, color) => {
    set({
      callout: { message, combo, type, color, visible: true },
    });
  },

  hideCallout: () => {
    set((state) => ({ callout: { ...state.callout, visible: false } }));
  },

  setLoaderOpen: (open) => set({ isLoaderOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setSummaryOpen: (open) => set({ isSummaryOpen: open }),

  loadSeedFromHash: () => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash) return;
    const decoded = decodeTrackSeed(hash);
    if (Object.keys(decoded).length > 0) {
      set((state) => ({
        settings: {
          ...state.settings,
          ...(decoded.visualTheme && { visualTheme: decoded.visualTheme as VisualTheme }),
          ...(decoded.speed !== undefined && { speed: decoded.speed }),
          ...(decoded.sensitivity !== undefined && { sensitivity: decoded.sensitivity }),
          ...(decoded.zenMode !== undefined && { zenMode: decoded.zenMode }),
          ...(decoded.motionBlur !== undefined && { motionBlur: decoded.motionBlur }),
        },
      }));
    }
  },

  getShareableSeedUrl: () => {
    if (typeof window === 'undefined') return '';
    const state = get();
    const hash = encodeTrackSeed(state.settings, state.trackMeta.title);
    return `${window.location.origin}${window.location.pathname}#${hash}`;
  },
}));
