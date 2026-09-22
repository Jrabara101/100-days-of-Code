import { AudioMetrics } from '@/types/game';

export interface ProceduralTrackInfo {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  description: string;
}

export const PROCEDURAL_TRACKS: ProceduralTrackInfo[] = [
  {
    id: 'synthwave',
    title: 'Synthwave Odyssey',
    bpm: 140,
    genre: 'Outrun / Electro',
    description: 'Pumping analog sub-bass, 80s arpeggios & cyber snare strikes',
  },
  {
    id: 'cyberpunk',
    title: 'Cyber Overdrive',
    bpm: 174,
    genre: 'Drum & Bass / Neuro',
    description: 'High-velocity breakbeats, distorted reese bass & laser transients',
  },
  {
    id: 'solar',
    title: 'Solar Drift',
    bpm: 110,
    genre: 'Chill Synth / Ambient',
    description: 'Lush polyphonic chords, warm 808 glide & celestial resonance',
  },
  {
    id: 'chillwave',
    title: 'Neon Twilight',
    bpm: 96,
    genre: 'Lo-Fi / Chillwave',
    description: 'Relaxed melodic progression, soft kick & hypnotic groove',
  },
];

export class AudioPipeline {
  private ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public filter: BiquadFilterNode | null = null;
  public gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private micStream: MediaStream | null = null;
  public dataArray: Uint8Array<ArrayBuffer> | null = null;
  public fftSize = 2048;

  private previousFlux = 0;
  private synthTimer: number | null = null;
  public isProcedural = true;
  public currentTrackId = 'synthwave';
  public onEndedCallback: (() => void) | null = null;

  public audioMetrics: AudioMetrics = {
    bpm: 140,
    bassIntensity: 0.2,
    midIntensity: 0.15,
    trebleIntensity: 0.1,
    isBeat: false,
    energy: 0.15,
  };

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with autoplay policy
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.82;
      this.dataArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.8;

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowshelf';
      this.filter.frequency.value = 320;
      this.filter.gain.value = 3.5;

      // Pipeline topology: Source -> Filter -> Analyser -> Gain -> Destination
      this.filter.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public async resume(): Promise<void> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  public setVolume(vol: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, vol));
    }
  }

  // ================= Procedural Synth Engine =================
  public startProceduralSynth(trackId: string = 'synthwave', volume: number = 0.8): void {
    this.stopAudio();
    this.initContext();
    this.resume();
    this.setVolume(volume);

    this.isProcedural = true;
    this.currentTrackId = trackId;

    const trackInfo = PROCEDURAL_TRACKS.find((t) => t.id === trackId) || PROCEDURAL_TRACKS[0];
    const bpm = trackInfo.bpm;
    this.audioMetrics.bpm = bpm;

    const interval = ((60 / bpm) * 1000) / 2; // Eighth note tick
    let step = 0;

    this.synthTimer = window.setInterval(() => {
      step = (step + 1) % 16;
      this.playProceduralStep(step, trackId, volume);
    }, interval);
  }

  private playProceduralStep(step: number, trackId: string, masterVol: number): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const filterNode = this.filter!;

    // 1. Kick Drum
    const isKick =
      step % 4 === 0 ||
      (trackId === 'cyberpunk' && (step === 2 || step === 10 || step === 14)) ||
      (trackId === 'synthwave' && step === 14);

    if (isKick) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      const startFreq = trackId === 'cyberpunk' ? 160 : trackId === 'solar' ? 110 : 140;
      const endFreq = 30;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

      gain.gain.setValueAtTime(0.85 * masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(filterNode);
      osc.start(now);
      osc.stop(now + 0.23);
    }

    // 2. Snare / High Clap
    const isSnare = step % 8 === 4 || (trackId === 'cyberpunk' && (step === 7 || step === 12));
    if (isSnare) {
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.12), this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * masterVol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      whiteNoise.connect(noiseGain);
      noiseGain.connect(filterNode);
      whiteNoise.start(now);
    }

    // 3. Hi-Hat / Shimmer (Offbeats)
    if (step % 2 === 1 || trackId === 'cyberpunk') {
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      hatOsc.type = 'highpass' as unknown as OscillatorType;
      // High frequency triangle for metallic transient
      hatOsc.type = 'triangle';
      hatOsc.frequency.setValueAtTime(8000, now);
      hatGain.gain.setValueAtTime(0.12 * masterVol, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      hatOsc.connect(hatGain);
      hatGain.connect(filterNode);
      hatOsc.start(now);
      hatOsc.stop(now + 0.06);
    }

    // 4. Arpeggiator & Synth Leads
    const chords: Record<string, number[][]> = {
      synthwave: [
        [220, 261.63, 329.63, 440], // Am
        [174.61, 220, 261.63, 349.23], // F
        [196, 246.94, 293.66, 392], // G
        [164.81, 207.65, 246.94, 329.63], // Em
      ],
      cyberpunk: [
        [146.83, 220, 293.66, 370], // Dm
        [130.81, 196, 261.63, 329.63], // C
        [116.54, 174.61, 233.08, 293.66], // Bb
        [164.81, 220, 277.18, 329.63], // A
      ],
      solar: [
        [261.63, 329.63, 392, 523.25], // Cmaj7
        [220, 261.63, 329.63, 440], // Am
        [174.61, 220, 261.63, 349.23], // F
        [196, 246.94, 293.66, 392], // G
      ],
      chillwave: [
        [196, 246.94, 293.66, 392],
        [174.61, 220, 261.63, 329.63],
        [146.83, 196, 246.94, 293.66],
        [130.81, 164.81, 196, 261.63],
      ],
    };

    const currentProgression = chords[trackId] || chords.synthwave;
    const chordIndex = Math.floor(step / 4) % currentProgression.length;
    const activeChord = currentProgression[chordIndex];
    const pitch = activeChord[step % activeChord.length];

    const leadOsc = this.ctx.createOscillator();
    const leadGain = this.ctx.createGain();
    leadOsc.type = trackId === 'cyberpunk' ? 'sawtooth' : trackId === 'solar' ? 'sine' : 'triangle';
    leadOsc.frequency.setValueAtTime(pitch, now);

    leadGain.gain.setValueAtTime(0.18 * masterVol, now);
    leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    leadOsc.connect(leadGain);
    leadGain.connect(filterNode);
    leadOsc.start(now);
    leadOsc.stop(now + 0.16);
  }

  // ================= Load Local Audio File =================
  public async loadFile(file: File, volume: number = 0.8): Promise<{ title: string; duration: number }> {
    this.stopAudio();
    this.initContext();
    await this.resume();
    this.setVolume(volume);

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);

    const title = file.name.replace(/\.[^/.]+$/, '');
    const duration = audioBuffer.duration;

    this.sourceNode = this.ctx!.createBufferSource();
    this.sourceNode.buffer = audioBuffer;
    this.sourceNode.connect(this.filter!);
    this.isProcedural = false;

    this.sourceNode.onended = () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    this.sourceNode.start(0);

    return { title, duration };
  }

  // ================= Live Microphone Stream =================
  public async enableMicrophone(): Promise<boolean> {
    this.stopAudio();
    this.initContext();
    await this.resume();

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const micSource = this.ctx!.createMediaStreamSource(this.micStream);
      // Connect to filter and analyser, but NOT directly to output destination to prevent feedback loop!
      micSource.connect(this.filter!);
      this.isProcedural = false;
      return true;
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      return false;
    }
  }

  public stopAudio(): void {
    if (this.synthTimer !== null) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {
        // Source already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }

  // ================= Decoupled Metric Calculation =================
  public updateMetrics(sensitivity: number = 1.4): AudioMetrics {
    if (!this.analyser || !this.dataArray) {
      return this.audioMetrics;
    }

    (this.analyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(this.dataArray);

    const binCount = this.analyser.frequencyBinCount;
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const binHz = sampleRate / this.fftSize;

    // Frequency boundaries:
    // Sub-bass: 20 - 60 Hz
    // Mid: 250 - 2000 Hz
    // High: 4000 - 16000 Hz
    const subBassEnd = Math.max(1, Math.floor(60 / binHz));
    const midStart = Math.floor(250 / binHz);
    const midEnd = Math.floor(2000 / binHz);
    const highStart = Math.floor(4000 / binHz);

    let subBassSum = 0;
    let midSum = 0;
    let highSum = 0;

    for (let i = 0; i <= subBassEnd; i++) subBassSum += this.dataArray[i];
    for (let i = midStart; i <= midEnd; i++) midSum += this.dataArray[i];
    for (let i = highStart; i < binCount; i++) highSum += this.dataArray[i];

    const bassAvg = subBassSum / (subBassEnd + 1) / 255;
    const midAvg = midSum / (midEnd - midStart + 1) / 255;
    const highAvg = highSum / (binCount - highStart) / 255;

    // Spectral Flux Beat Detection
    const currentFlux = bassAvg * 1.5 + highAvg * 0.5;
    const fluxDelta = currentFlux - this.previousFlux;
    const beatThreshold = 0.22 / Math.max(0.2, sensitivity);

    const isBeat = fluxDelta > beatThreshold;
    this.previousFlux = currentFlux * 0.92;

    this.audioMetrics = {
      bpm: this.audioMetrics.bpm,
      bassIntensity: Math.min(1.0, bassAvg),
      midIntensity: Math.min(1.0, midAvg),
      trebleIntensity: Math.min(1.0, highAvg),
      isBeat,
      energy: (bassAvg + midAvg + highAvg) / 3,
    };

    return this.audioMetrics;
  }
}

export const globalAudioPipeline = new AudioPipeline();
