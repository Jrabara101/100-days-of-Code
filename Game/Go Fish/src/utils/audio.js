// Web Audio API retro 8-bit sound generator
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, startGain = 0.15, endGain = 0.01) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(startGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(endGain, 0.0001), this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }

  playClick() {
    this.playTone(800, 'square', 0.05, 0.1, 0.01);
  }

  playDeal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Noise buffer for card ruffle sound
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      whiteNoise.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch (e) {
      this.playTone(300, 'triangle', 0.05, 0.08, 0.01);
    }
  }

  playAskSuccess() {
    // Upward retro arpeggio
    const now = typeof window !== 'undefined' && this.ctx ? this.ctx.currentTime : 0;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 0.1, 0.12, 0.01);
      }, i * 70);
    });
  }

  playGoFish() {
    // Descending wobble
    [440, 370, 310, 220].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.12, 0.1, 0.01);
      }, i * 80);
    });
  }

  playBookComplete() {
    // Victory fanfare snippet
    const notes = [
      { f: 523.25, d: 0.1 },
      { f: 659.25, d: 0.1 },
      { f: 783.99, d: 0.1 },
      { f: 1046.50, d: 0.25 },
    ];
    notes.forEach((note, i) => {
      setTimeout(() => {
        this.playTone(note.f, 'triangle', note.d, 0.2, 0.01);
      }, i * 110);
    });
  }

  playWin() {
    const victoryNotes = [440, 554.37, 659.25, 880, 740, 880];
    victoryNotes.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 'square', 0.15, 0.2, 0.01);
      }, i * 120);
    });
  }

  playGameOver() {
    const loseNotes = [300, 260, 220, 160];
    loseNotes.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 'sawtooth', 0.25, 0.15, 0.01);
      }, i * 160);
    });
  }
}

export const soundFX = new SoundFX();
