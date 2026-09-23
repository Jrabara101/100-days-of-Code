import { create } from 'zustand';
import { BeatSequencerState, SequencerTrack, SoundKitId, StutterType, SerializedPattern } from '../types/sequencer';
import { audioEngine } from '../audio/audioGraph';
import { generateChaosTrack, generateEuclideanRhythm } from '../audio/euclidean';

const INITIAL_TRACKS: SequencerTrack[] = [
  {
    id: 'kick',
    name: 'KICK 808',
    accentColor: '#EF4444',
    pitchOffset: 0,
    volume: 0.9,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    steps: [true, false, false, false,  true, false, false, false,  true, false, false, false,  true, false, false, false],
  },
  {
    id: 'snare',
    name: 'SNARE SNAP',
    accentColor: '#06B6D4',
    pitchOffset: 0,
    volume: 0.8,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    steps: [false, false, false, false, true, false, false, false,  false, false, false, false, true, false, false, false],
  },
  {
    id: 'hihat',
    name: 'CH CLOSED',
    accentColor: '#10B981',
    pitchOffset: 0,
    volume: 0.65,
    pan: -0.2,
    isMuted: false,
    isSoloed: false,
    steps: [true, true, true, true,    true, true, true, true,     true, true, true, true,     true, true, true, true],
  },
  {
    id: 'openhat',
    name: 'OH OPEN',
    accentColor: '#34D399',
    pitchOffset: 0,
    volume: 0.6,
    pan: 0.25,
    isMuted: false,
    isSoloed: false,
    steps: [false, false, true, false,  false, false, true, false,  false, false, true, false,  false, false, true, false],
  },
  {
    id: 'clap',
    name: 'CLAP PERC',
    accentColor: '#F59E0B',
    pitchOffset: 0,
    volume: 0.75,
    pan: 0.15,
    isMuted: false,
    isSoloed: false,
    steps: [false, false, false, false, true, false, false, true,   false, false, false, false, true, false, true, false],
  },
  {
    id: 'subbass',
    name: 'SUB BASS',
    accentColor: '#EC4899',
    pitchOffset: 0,
    volume: 0.85,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    steps: [true, false, false, true,   false, false, false, false, true, false, true, false,   false, false, false, false],
  },
];

export interface SequencerStore extends BeatSequencerState {
  masterVolume: number;
  setIsPlaying: (playing: boolean) => void;
  setCurrentStep: (step: number) => void;
  setBpm: (bpm: number) => void;
  setSwing: (swing: number) => void;
  setActiveKit: (kit: SoundKitId) => void;
  toggleStep: (trackIndex: number, stepIndex: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  setTrackPitch: (trackId: string, pitchOffset: number) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  setFilterCutoff: (cutoff: number) => void;
  setTapeStopActive: (active: boolean) => void;
  setActiveStutter: (stutter: StutterType) => void;
  setMasterVolume: (vol: number) => void;
  clearGrid: () => void;
  rollChaosDice: () => void;
  applyEuclideanRhythm: (trackId: string, pulses: number, rotation?: number) => void;
  loadPattern: (serialized: SerializedPattern) => void;
  getSerializedPattern: () => SerializedPattern;
  getUrlShareHash: () => string;
  loadFromUrlHash: (hashString: string) => boolean;
}

export const useSequencerStore = create<SequencerStore>((set, get) => ({
  bpm: 120,
  swing: 0.0,
  isPlaying: false,
  currentStep: -1,
  activeKit: 'neon_808',
  tracks: INITIAL_TRACKS,
  masterVolume: 0.85,
  masterEffects: {
    filterCutoff: 20000,
    tapeStopActive: false,
    activeStutter: 'none',
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying, currentStep: isPlaying ? get().currentStep : -1 });
  },

  setCurrentStep: (currentStep) => set({ currentStep }),

  setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(240, Math.round(bpm))) }),

  setSwing: (swing) => set({ swing: Math.max(0, Math.min(1, swing)) }),

  setActiveKit: (activeKit) => set({ activeKit }),

  toggleStep: (trackIndex, stepIndex) => {
    set((state) => {
      const newTracks = [...state.tracks];
      const track = { ...newTracks[trackIndex] };
      const newSteps = [...track.steps];
      newSteps[stepIndex] = !newSteps[stepIndex];
      track.steps = newSteps;
      newTracks[trackIndex] = track;
      return { tracks: newTracks };
    });
  },

  setTrackVolume: (trackId, volume) => {
    audioEngine.setTrackVolume(trackId, volume);
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)),
    }));
  },

  setTrackPan: (trackId, pan) => {
    audioEngine.setTrackPan(trackId, pan);
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, pan } : t)),
    }));
  },

  setTrackPitch: (trackId, pitchOffset) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, pitchOffset } : t)),
    }));
  },

  toggleMute: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t)),
    }));
  },

  toggleSolo: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, isSoloed: !t.isSoloed } : t)),
    }));
  },

  setFilterCutoff: (filterCutoff) => {
    audioEngine.setFilterCutoff(filterCutoff);
    set((state) => ({
      masterEffects: { ...state.masterEffects, filterCutoff },
    }));
  },

  setTapeStopActive: (tapeStopActive) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, tapeStopActive },
    }));
  },

  setActiveStutter: (activeStutter) => {
    set((state) => ({
      masterEffects: { ...state.masterEffects, activeStutter },
    }));
  },

  setMasterVolume: (masterVolume) => {
    audioEngine.setMasterVolume(masterVolume);
    set({ masterVolume });
  },

  clearGrid: () => {
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        steps: new Array(16).fill(false),
      })),
    }));
  },

  rollChaosDice: () => {
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        steps: generateChaosTrack(t.id),
      })),
    }));
  },

  applyEuclideanRhythm: (trackId, pulses, rotation = 0) => {
    const pattern = generateEuclideanRhythm(16, pulses, rotation);
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, steps: pattern } : t)),
    }));
  },

  loadPattern: (serialized) => {
    set((state) => {
      const updatedTracks = state.tracks.map((track) => {
        const found = serialized.tracks.find((t) => t.id === track.id);
        if (found) {
          return {
            ...track,
            steps: found.steps || track.steps,
            pitchOffset: found.pitchOffset ?? track.pitchOffset,
            volume: found.volume ?? track.volume,
            pan: found.pan ?? track.pan,
          };
        }
        return track;
      });

      return {
        bpm: serialized.bpm || state.bpm,
        swing: serialized.swing ?? state.swing,
        activeKit: serialized.activeKit || state.activeKit,
        tracks: updatedTracks,
      };
    });
  },

  getSerializedPattern: () => {
    const state = get();
    return {
      version: 1,
      bpm: state.bpm,
      swing: state.swing,
      activeKit: state.activeKit,
      tracks: state.tracks.map((t) => ({
        id: t.id,
        steps: t.steps,
        pitchOffset: t.pitchOffset,
        volume: t.volume,
        pan: t.pan,
      })),
    };
  },

  getUrlShareHash: () => {
    const pattern = get().getSerializedPattern();
    const jsonStr = JSON.stringify(pattern);
    const base64 = btoa(jsonStr);
    return `#beat=${base64}`;
  },

  loadFromUrlHash: (hashString: string) => {
    try {
      const match = hashString.match(/#(?:beat|pattern)=([A-Za-z0-9+/=_-]+)/);
      if (!match || !match[1]) return false;
      const jsonStr = atob(match[1]);
      const parsed = JSON.parse(jsonStr) as SerializedPattern;
      if (parsed && Array.isArray(parsed.tracks)) {
        get().loadPattern(parsed);
        return true;
      }
    } catch (e) {
      console.error('Failed to parse URL pattern hash', e);
    }
    return false;
  },
}));
