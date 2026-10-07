// Web Audio API high-precision synthesis and audio pipeline
// Features: zero external asset download dependency, sub-millisecond clock,
// dynamic Fever Overdrive audio filters, and arcade sound effects (SFX).

export class RhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private feverFilter: BiquadFilterNode | null = null;
  private feverGain: GainNode | null = null;
  private isFeverActive: boolean = false;
  
  // Synthesis sequencer state
  private isPlayingSynth: boolean = false;
  private synthBpm: number = 130;
  private synthTheme: string = 'synthwave';
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private timerId: number | null = null;
  private scheduledOscillators: AudioNode[] = [];

  constructor() {
    // Lazily initialized on first user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });

      // Master output pipeline
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // Fever dynamic overdrive filter
      this.feverFilter = this.ctx.createBiquadFilter();
      this.feverFilter.type = 'lowpass';
      this.feverFilter.frequency.setValueAtTime(18000, this.ctx.currentTime);
      this.feverFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      this.feverGain = this.ctx.createGain();
      this.feverGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.masterGain.connect(this.feverFilter);
      this.feverFilter.connect(this.feverGain);
      this.feverGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  // "Fever Overdrive" Dynamic Juice Audio Filter
  public setFeverMode(active: boolean) {
    this.isFeverActive = active;
    if (!this.feverFilter || !this.feverGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    if (active) {
      // Dynamic sweep: high resonance peak + bass saturation boost
      this.feverFilter.frequency.cancelScheduledValues(now);
      this.feverFilter.Q.cancelScheduledValues(now);
      this.feverGain.gain.cancelScheduledValues(now);

      this.feverFilter.frequency.setValueAtTime(6000, now);
      this.feverFilter.frequency.exponentialRampToValueAtTime(16000, now + 0.4);
      this.feverFilter.Q.setValueAtTime(4.5, now);
      this.feverGain.gain.setValueAtTime(1.25, now); // slight boost
    } else {
      this.feverFilter.frequency.setValueAtTime(18000, now);
      this.feverFilter.Q.setValueAtTime(1.0, now);
      this.feverGain.gain.setValueAtTime(1.0, now);
    }
  }

  // ---------------------------------------------------------
  // ARCADE SFX HIT ENGINE
  // ---------------------------------------------------------
  public playHitSound(judgement: 'MARVELOUS' | 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (judgement === 'MARVELOUS') {
        // Crisp dual chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // A6
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      } else if (judgement === 'PERFECT') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      } else if (judgement === 'GREAT') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      } else if (judgement === 'GOOD') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.07);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      } else {
        // MISS: dull downpitch thud
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      }

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Audio node fallback
    }
  }

  // Metronome click for hardware latency calibrator
  public playCalibrationClick(isAccent: boolean = false) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Fever activation swoosh
  public playFeverTriggerSfx() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // ---------------------------------------------------------
  // MUSIC SYNTHESIS ENGINE (ZERO DOWNLOAD DEPENDENCY)
  // ---------------------------------------------------------
  public startSynthTrack(bpm: number, theme: string = 'synthwave') {
    this.init();
    if (!this.ctx) return;

    this.stopSynthTrack();
    this.isPlayingSynth = true;
    this.synthBpm = bpm;
    this.synthTheme = theme;
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    this.scheduler();
  }

  public stopSynthTrack() {
    this.isPlayingSynth = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler = () => {
    if (!this.isPlayingSynth || !this.ctx) return;

    // Look ahead 100ms and schedule notes
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.schedulePatternStep(this.current16thNote, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.scheduler, 25);
  };

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.synthBpm;
    // 16th note = 0.25 beat
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote = (this.current16thNote + 1) % 64; // 4-bar loop
  }

  private schedulePatternStep(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const beatInBar = Math.floor(step / 4) % 4; // 0, 1, 2, 3
    const isQuarterBeat = step % 4 === 0;

    // 1. KICK DRUM (beats 0, 1, 2, 3)
    if (isQuarterBeat) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.1);
      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.15);
    }

    // 2. SNARE / CLAP (beats 1 & 3)
    if (isQuarterBeat && (beatInBar === 1 || beatInBar === 3)) {
      this.playSnare(time);
    }

    // 3. HI-HAT (every 8th note, plus syncopated 16ths)
    if (step % 2 === 1 || step % 4 === 2) {
      this.playHiHat(time, step % 4 === 2);
    }

    // 4. BASSLINE SYNTH
    this.playBassNote(step, time);

    // 5. LEAD MELODY SYNTH
    this.playLeadNote(step, time);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    // Snare tone + noise burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.11);

    // Filtered noise
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.08);
  }

  private playHiHat(time: number, accent: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.22 : 0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.03);
  }

  private playBassNote(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    // Rolling electro bass notes: D2, F2, G2, A2
    const rootNotes = [73.42, 87.31, 98.0, 110.0]; // D, F, G, A
    const chordIndex = Math.floor(step / 16) % rootNotes.length;
    const rootFreq = rootNotes[chordIndex];

    // Trigger on 16th groove
    if (step % 2 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(rootFreq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.isFeverActive ? 2200 : 1200, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + 0.12);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.14);
    }
  }

  private playLeadNote(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    // Arpeggiator melodies on certain steps
    const scale = [293.66, 329.63, 349.23, 440.0, 523.25, 587.33]; // D Dorian
    if (step % 4 === 1 || step % 4 === 3) {
      const noteFreq = scale[(step * 2) % scale.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = this.synthTheme === 'chiptune' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(noteFreq, time);

      gain.gain.setValueAtTime(this.isFeverActive ? 0.3 : 0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.13);
    }
  }
}

// Global audio engine singleton
export const globalAudioEngine = new RhythmAudioEngine();
