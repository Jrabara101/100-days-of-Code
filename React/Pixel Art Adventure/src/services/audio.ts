// Real-time Web Audio API Retro Sound Synthesizer
// Provides pitch-modulated dialogue typewriter blips, footstep clicks, lantern ignite,
// harmonic flute arpeggios, and memory echo shimmering pad with zero external audio files.

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Pitch-modulated typewriter blip for dialogues
  public playDialogueChirp(voiceType: 'elder' | 'golem' | 'spirit' | 'wanderer' | 'player' = 'player') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      let baseFreq = 320;
      let type: OscillatorType = 'triangle';

      switch (voiceType) {
        case 'elder':
          baseFreq = 160 + (Math.random() * 20 - 10);
          type = 'triangle';
          break;
        case 'golem':
          baseFreq = 95 + (Math.random() * 15 - 7);
          type = 'sawtooth';
          break;
        case 'spirit':
          baseFreq = 620 + (Math.random() * 40 - 20);
          type = 'sine';
          break;
        case 'wanderer':
          baseFreq = 260 + (Math.random() * 25 - 12);
          type = 'triangle';
          break;
        case 'player':
        default:
          baseFreq = 340 + (Math.random() * 30 - 15);
          type = 'square';
          break;
      }

      osc.type = type;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.04);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore audio context restrictions
    }
  }

  // Soft footstep pop
  public playFootstep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.035);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // ignore
    }
  }

  // Tactile choice button hover/click
  public playChoiceSelect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }

  // Lantern ignition warm swell
  public playLanternToggle(isOn: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (isOn) {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
      } else {
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
      }

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  // Harmonic Flute 3-note melody
  public playFluteArpeggio() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major ancient chord
    notes.forEach((freq, idx) => {
      const delay = idx * 0.14;
      const now = (this.ctx?.currentTime || 0) + delay;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  // Shimmering Memory Echo resonance pad
  public playMemoryEcho() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [392, 493.88, 587.33, 783.99]; // G major 7 ethereal spread
    chords.forEach((freq, idx) => {
      const now = (this.ctx?.currentTime || 0) + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.5);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  // Quest objective or completion fanfare
  public playQuestComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const fanfare = [
      { f: 523.25, t: 0.0 }, // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.5, t: 0.36 }, // C6
    ];

    fanfare.forEach((n) => {
      const now = (this.ctx?.currentTime || 0) + n.t;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }
}

export const audioEngine = new RetroAudioEngine();
