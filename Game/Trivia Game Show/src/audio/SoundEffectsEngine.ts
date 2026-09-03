/**
 * Low-Latency Procedural Web Audio Synthesizer
 * Generates all gameshow stingers, tension ticks, chords, and buzzers
 * directly via native AudioContext oscillators with ZERO external audio dependencies.
 *
 * Fully compliant with browser Autoplay Policy: does not instantiate or resume
 * AudioContext until after a user gesture (click, keydown, touch), preventing
 * console warnings and errors.
 */
export class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private hasUserInteracted: boolean = false;
  private activeDroneNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
  private removeUnlockListeners: (() => void) | null = null;

  constructor() {
    this.setupGestureListeners();
  }

  private setupGestureListeners() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
    };

    const events = ['click', 'keydown', 'touchstart', 'pointerdown'];
    events.forEach(evt => {
      window.addEventListener(evt, unlockHandler, { passive: true });
    });

    this.removeUnlockListeners = () => {
      events.forEach(evt => {
        window.removeEventListener(evt, unlockHandler);
      });
    };
  }

  /**
   * Explicitly unlock audio context upon user gesture
   */
  public unlock() {
    this.hasUserInteracted = true;
    if (this.removeUnlockListeners) {
      this.removeUnlockListeners();
      this.removeUnlockListeners = null;
    }
    this.ensureContext();
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' || !this.hasUserInteracted) return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          return null;
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Silently handled if user gesture is pending
      });
    }

    return this.ctx;
  }

  public init(): AudioContext | null {
    if (!this.hasUserInteracted) {
      return null;
    }
    return this.ensureContext();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopDrone();
    }
  }

  public toggleMute(): boolean {
    this.unlock();
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getHasUserInteracted(): boolean {
    return this.hasUserInteracted;
  }

  /**
   * Monotonic Countdown Tension Tick (Triangle wave sweep)
   */
  public playTick() {
    if (this.isMuted || !this.hasUserInteracted) return;
    const ctx = this.init();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Ignore audio scheduling blips
    }
  }

  /**
   * Answer Selection Lock-In Stinger
   */
  public playLockIn() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.init();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  /**
   * Suspense Drone during ANSWER_LOCKED phase
   */
  public startDrone() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.init();
    if (!ctx) return;

    this.stopDrone();

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2
      osc2.frequency.setValueAtTime(66.2, ctx.currentTime);  // Detuned beat frequency

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      this.activeDroneNodes = { osc1, osc2, gain };
    } catch {
      // Ignore
    }
  }

  public stopDrone() {
    if (this.activeDroneNodes && this.ctx) {
      try {
        const { osc1, osc2, gain } = this.activeDroneNodes;
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {
            // Already stopped
          }
        }, 160);
      } catch {
        // Ignore
      }
      this.activeDroneNodes = null;
    }
  }

  /**
   * Triumphal Correct Answer Arpeggio
   */
  public playCorrect() {
    this.stopDrone();
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.init();
    if (!ctx) return;

    try {
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio (C5, E5, G5, C6)
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const startTime = ctx.currentTime + idx * 0.075;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Dissonant Buzzer for Wrong Answers
   */
  public playWrong() {
    this.stopDrone();
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.init();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
      osc2.frequency.setValueAtTime(138.59, ctx.currentTime); // C#3 (Minor 2nd dissonance)

      gain.gain.setValueAtTime(0.24, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.48);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(ctx.currentTime + 0.48);
      osc2.stop(ctx.currentTime + 0.48);
    } catch {
      // Ignore
    }
  }

  /**
   * Lifeline Trigger Whoosh
   */
  public playWhoosh() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.init();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.24);

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } catch {
      // Ignore
    }
  }

  /**
   * Grand Champion Victory Fanfare
   */
  public playFanfare() {
    this.stopDrone();
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.init();
    if (!ctx) return;

    try {
      const fanfareTones = [
        { freq: 523.25, time: 0.0, dur: 0.2 },
        { freq: 659.25, time: 0.18, dur: 0.2 },
        { freq: 783.99, time: 0.36, dur: 0.2 },
        { freq: 1046.50, time: 0.54, dur: 0.7 },
        { freq: 1318.51, time: 0.72, dur: 0.8 }
      ];

      fanfareTones.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const start = ctx.currentTime + time;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Ignore
    }
  }
}
