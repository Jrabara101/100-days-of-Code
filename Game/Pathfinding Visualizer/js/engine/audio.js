/**
 * Procedural Web Audio API Sound Synthesizer
 * Cartographic Pathfinding Laboratory
 */

export class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.lastTickTime = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15; // Pleasant baseline volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0.0 : 0.15;
    }
  }

  /**
   * Sound effect for node expansion
   * Pitch dynamically increases as heuristic distance to target decreases
   */
  playNodeTick(distanceRatio = 1.0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Rate-limit clicks so high-speed execution doesn't clip audio buffer
    const now = performance.now();
    if (now - this.lastTickTime < 24) return;
    this.lastTickTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Base frequency 240Hz, rises up to 880Hz near goal
      const freq = 240 + (1.0 - Math.min(1.0, Math.max(0.0, distanceRatio))) * 640;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      // AudioContext unavailable
    }
  }

  /**
   * Sound effect when Target is reached
   */
  playGoalFound() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.06 + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.5);
      });
    } catch (e) {}
  }

  /**
   * Tactical Klaxon for Dynamic Chaos Reroute Incident
   */
  playChaosAlarm() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {}
  }
}
