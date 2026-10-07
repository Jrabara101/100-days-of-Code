/**
 * High-Octane Procedural Web Audio Synthesizer
 * Zero external audio dependencies - 100% browser-native synthesis
 */

class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private activeLoops: number[] = [];

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllSamples();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stopAllSamples() {
    this.activeLoops.forEach(id => window.clearTimeout(id));
    this.activeLoops = [];
  }

  /**
   * Mechanical Cyber Click for UI buttons and stickers
   */
  public playUiClick(pitch: number = 800) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * Glitch stinger for mystery card unmasking
   */
  public playGlitchStinger() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.18;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.18);
    } catch {
      // Silent catch
    }
  }

  /**
   * "The Unveiling Bell" - Triumphant theme reveal fanfare
   */
  public playThemeRevealFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio + fanfare
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.09;
        const duration = 0.45;

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
      });

      // Low power sub-thump
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.85);

    } catch {
      // Audio catch
    }
  }

  /**
   * Emergency sirens / Priority transmission pulse
   */
  public playCriticalAlertSiren() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + i * 0.22;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, startTime);
        osc.frequency.linearRampToValueAtTime(587, startTime + 0.18);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.22);
      }
    } catch {
      // Silent catch
    }
  }

  /**
   * Radar sweep ping for Jammer Radar
   */
  public playRadarPing() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Silent catch
    }
  }

  /**
   * Procedural Audio Preview for Jammer Audio/OST Composers
   */
  public playComposerSample(type: 'synthwave' | 'chiptune' | 'cyberpunk' | 'ambient' = 'synthwave'): () => void {
    const ctx = this.getContext();
    this.stopAllSamples();
    if (!ctx) return () => {};

    const isRunning = { active: true };

    if (type === 'chiptune') {
      // 8-bit fast arpeggio loop
      const scale = [261.63, 311.13, 392.00, 466.16, 523.25, 622.25];
      let step = 0;
      const playStep = () => {
        if (!isRunning.active) return;
        const noteCtx = this.getContext();
        if (noteCtx) {
          const t = noteCtx.currentTime;
          const osc = noteCtx.createOscillator();
          const g = noteCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(scale[step % scale.length], t);
          g.gain.setValueAtTime(0.1, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.connect(g);
          g.connect(noteCtx.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        }
        step++;
        if (step < 24) {
          const timer = window.setTimeout(playStep, 110);
          this.activeLoops.push(timer);
        }
      };
      playStep();

    } else if (type === 'synthwave') {
      // Warm analog chord stab + pulse bass
      const chords = [
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [196, 246.94, 293.66], // G
        [164.81, 196, 246.94], // Em
      ];

      chords.forEach((chord, cIdx) => {
        const chordTimer = window.setTimeout(() => {
          if (!isRunning.active) return;
          const noteCtx = this.getContext();
          if (!noteCtx) return;
          const t = noteCtx.currentTime;

          chord.forEach(freq => {
            const osc = noteCtx.createOscillator();
            const filter = noteCtx.createBiquadFilter();
            const g = noteCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.exponentialRampToValueAtTime(2200, t + 0.15);
            filter.frequency.exponentialRampToValueAtTime(600, t + 0.7);

            g.gain.setValueAtTime(0.08, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

            osc.connect(filter);
            filter.connect(g);
            g.connect(noteCtx.destination);

            osc.start(t);
            osc.stop(t + 0.8);
          });
        }, cIdx * 750);
        this.activeLoops.push(chordTimer);
      });

    } else if (type === 'cyberpunk') {
      // Heavy dark sub bass + distortion crunch
      const bassNotes = [110, 110, 123.47, 98, 110, 130.81];
      bassNotes.forEach((freq, idx) => {
        const tId = window.setTimeout(() => {
          if (!isRunning.active) return;
          const noteCtx = this.getContext();
          if (!noteCtx) return;
          const t = noteCtx.currentTime;
          const osc = noteCtx.createOscillator();
          const g = noteCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq / 2, t);
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(g);
          g.connect(noteCtx.destination);
          osc.start(t);
          osc.stop(t + 0.28);
        }, idx * 260);
        this.activeLoops.push(tId);
      });

    } else {
      // Ethereal ambient pad
      const noteCtx = this.getContext();
      if (noteCtx) {
        const t = noteCtx.currentTime;
        [220, 277.18, 329.63, 440].forEach(f => {
          const osc = noteCtx.createOscillator();
          const g = noteCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.08, t + 0.6);
          g.gain.exponentialRampToValueAtTime(0.001, t + 2.8);
          osc.connect(g);
          g.connect(noteCtx.destination);
          osc.start(t);
          osc.stop(t + 2.9);
        });
      }
    }

    return () => {
      isRunning.active = false;
      this.stopAllSamples();
    };
  }
}

export const soundFx = new SoundFxEngine();
