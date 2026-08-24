/**
 * Procedural Web Audio Synthesizer for Boids Flocking
 * Generates an ambient generative drone modulated by flock velocity and dispersion.
 */

class FlockingSynth {
  constructor() {
    this.ctx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.filter = null;
    this.masterGain = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Lowpass filter for smooth harmonic warmth
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // Oscillator 1 (Sine Sub/Root)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

    // Oscillator 2 (Triangle Harmonic Fifth)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime); // E3

    const oscGain1 = this.ctx.createGain();
    oscGain1.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.osc1.connect(oscGain1);
    oscGain1.connect(this.filter);

    const oscGain2 = this.ctx.createGain();
    oscGain2.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.osc2.connect(oscGain2);
    oscGain2.connect(this.filter);

    this.osc1.start();
    this.osc2.start();
  }

  toggle(enable) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const targetGain = enable ? 0.22 : 0.0001;
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    this.isPlaying = enable;
  }

  update(avgSpeed, activeBoids) {
    if (!this.isPlaying || !this.ctx) return;

    // Modulate filter cutoff with flock velocity
    const targetFreq = 200 + Math.min(1800, avgSpeed * 500);
    this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);

    // Modulate subtle pitch drift
    const rootFreq = 110 + (avgSpeed * 12);
    this.osc1.frequency.setTargetAtTime(rootFreq, this.ctx.currentTime, 0.2);
    this.osc2.frequency.setTargetAtTime(rootFreq * 1.5, this.ctx.currentTime, 0.2);
  }

  playBurst() {
    if (!this.isPlaying || !this.ctx) return;

    const burstOsc = this.ctx.createOscillator();
    const burstGain = this.ctx.createGain();

    burstOsc.type = 'sawtooth';
    burstOsc.frequency.setValueAtTime(320, this.ctx.currentTime);
    burstOsc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.35);

    burstGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    burstGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    burstOsc.connect(burstGain);
    burstGain.connect(this.filter);

    burstOsc.start();
    burstOsc.stop(this.ctx.currentTime + 0.36);
  }
}

export const synth = new FlockingSynth();
