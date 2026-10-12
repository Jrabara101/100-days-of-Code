/**
 * Synthesized Web Audio API sound system
 * Zero external audio assets required; zero 404s, instantaneous loading.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterVolume = 0.8;
  private sfxVolume = 0.8;
  private isMuted = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.masterGain.gain.value = this.masterVolume;
        this.sfxGain.gain.value = this.sfxVolume;

        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
    return this.isMuted;
  }

  // Generate white noise buffer
  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playPistol() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Transient click
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);

    // Gunshot body noise
    const noise = this.createNoiseBuffer(0.12);
    if (noise) {
      const noiseSource = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();
      noiseSource.buffer = noise;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      noiseGain.gain.setValueAtTime(0.7, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noiseSource.start(t);
    }
  }

  public playShotgun() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Sub rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    oscGain.gain.setValueAtTime(1.0, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);

    // Heavy blast noise
    const noise = this.createNoiseBuffer(0.3);
    if (noise) {
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      src.buffer = noise;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.linearRampToValueAtTime(400, t + 0.28);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(t);
    }
  }

  public playTesla() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1400, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playRifle() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playZombieGroan() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const pitch = 85 + Math.random() * 30;
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.linearRampToValueAtTime(pitch - 25, t + 0.35);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  public playZombieDeath() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const noise = this.createNoiseBuffer(0.15);
    if (noise) {
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      src.buffer = noise;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(t);
    }
  }

  public playHit() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playReloadStart() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.07);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playActiveReloadSweetSpot() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // High success double chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, t); // A5
    osc1.frequency.setValueAtTime(1174.66, t + 0.06); // D6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, t);
    osc2.frequency.setValueAtTime(587.33, t + 0.06);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  public playActiveReloadFail() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.15);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playScrapPickup() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playHeartbeat() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Dual sub pulse: lub-dub
    const pulse = (timeOffset: number, freq: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(35, t + timeOffset + 0.12);
      gain.gain.setValueAtTime(0.7, t + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + timeOffset + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + timeOffset);
      osc.stop(t + timeOffset + 0.15);
    };

    pulse(0, 75);
    pulse(0.14, 60);
  }

  public playWaveSiren() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(640, t + 0.4);
    osc.frequency.linearRampToValueAtTime(320, t + 0.8);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  public playBlackoutAlarm() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  public playFortify() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }
}

export const sound = new SoundEngine();
