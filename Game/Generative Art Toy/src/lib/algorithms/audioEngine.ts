/**
 * Procedural Web Audio API Pentatonic Chime Synthesizer.
 * Generates meditative, ambient harmonic tones mapped to velocity,
 * particle density, and spatial position with zero external audio assets.
 */

// Pentatonic scale note frequencies (C3, D3, E3, G3, A3 up through C6)
const PENTATONIC_FREQUENCIES = [
  // Octave 3
  130.81, 146.83, 164.81, 196.00, 220.00,
  // Octave 4
  261.63, 293.66, 329.63, 392.00, 440.00,
  // Octave 5
  523.25, 587.33, 659.25, 783.99, 880.00,
  // Octave 6
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isEnabled: boolean = false;
  private lastTriggerTime: number = 0;
  private readonly minTriggerInterval: number = 45; // ms throttle for melodious cadence

  constructor() {
    // Lazy initialization on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output filter (smooth warm lowpass to remove harsh highs)
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(2400, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Triggers a procedural resonant chime
   * @param normalizedPitch 0.0 to 1.0 (maps to pentatonic scale)
   * @param velocity relative speed 0.0 to 1.0 (maps to volume & decay)
   * @param pan horizontal position -1.0 (left) to 1.0 (right)
   */
  public triggerChime(normalizedPitch: number = 0.5, velocity: number = 0.5, pan: number = 0) {
    if (!this.isEnabled) return;
    const now = performance.now();
    if (now - this.lastTriggerTime < this.minTriggerInterval) return;
    this.lastTriggerTime = now;

    this.initContext();
    if (!this.ctx || !this.filterNode) return;

    const audioCtx = this.ctx;
    const currentTime = audioCtx.currentTime;

    // Pick note from pentatonic scale
    const noteIdx = Math.min(
      PENTATONIC_FREQUENCIES.length - 1,
      Math.max(0, Math.floor(normalizedPitch * PENTATONIC_FREQUENCIES.length))
    );
    const fundamentalFreq = PENTATONIC_FREQUENCIES[noteIdx];

    // Primary Oscillator (warm sine wave)
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamentalFreq, currentTime);

    // Secondary Harmonic Oscillator (triangle wave at octave or fifth)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(fundamentalFreq * 2.0, currentTime);

    // Note Gain Envelope
    const noteGain = audioCtx.createGain();
    const peakVolume = Math.min(0.25, 0.05 + velocity * 0.18);
    const decayDuration = 0.35 + velocity * 0.7; // 350ms to 1.05s

    // Click-free exponential envelope
    noteGain.gain.setValueAtTime(0.0001, currentTime);
    noteGain.gain.exponentialRampToValueAtTime(peakVolume, currentTime + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, currentTime + decayDuration);

    // Harmonic balance
    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.setValueAtTime(0.2, currentTime);

    // Spatial Stereo Panner if supported
    if (audioCtx.createStereoPanner) {
      const panner = audioCtx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), currentTime);

      osc1.connect(noteGain);
      osc2.connect(osc2Gain);
      osc2Gain.connect(noteGain);

      noteGain.connect(panner);
      panner.connect(this.filterNode);
    } else {
      osc1.connect(noteGain);
      osc2.connect(osc2Gain);
      osc2Gain.connect(noteGain);

      noteGain.connect(this.filterNode);
    }

    osc1.start(currentTime);
    osc2.start(currentTime);

    osc1.stop(currentTime + decayDuration + 0.05);
    osc2.stop(currentTime + decayDuration + 0.05);
  }

  /**
   * Harmonic burst for "Aesthetic Chaos Dice" or algorithm switch
   */
  public triggerSerendipityChord() {
    if (!this.isEnabled) return;
    this.initContext();
    const chordNotes = [0.2, 0.45, 0.65, 0.85];
    chordNotes.forEach((pitch, i) => {
      setTimeout(() => {
        this.triggerChime(pitch, 0.7, (i - 1.5) * 0.5);
      }, i * 65);
    });
  }
}

export const soundSynth = new AudioEngine();
