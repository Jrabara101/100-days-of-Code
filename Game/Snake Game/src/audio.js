// Chiptune WebAudio helpers for Snake
let ctx = null;
let masterGain = null;
let enabled = true;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip({ freq = 440, dur = 0.08, type = 'square', vol = 0.5, slide = 0, attack = 0.005, release = 0.05 } = {}) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.linearRampToValueAtTime(0, t0 + dur + release);
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + dur + release + 0.02);
}

function noise({ dur = 0.2, vol = 0.4, freq = 800, q = 1 } = {}) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(g).connect(masterGain);
  src.start(t0);
  src.stop(t0 + dur);
}

const sounds = {
  eat() {
    blip({ freq: 660, slide: 220, dur: 0.06, type: 'square', vol: 0.45 });
    setTimeout(() => blip({ freq: 990, dur: 0.05, type: 'square', vol: 0.35 }), 50);
  },
  turn() {
    blip({ freq: 320, dur: 0.025, type: 'square', vol: 0.18 });
  },
  powerup() {
    blip({ freq: 523, dur: 0.06, type: 'triangle', vol: 0.4 });
    setTimeout(() => blip({ freq: 659, dur: 0.06, type: 'triangle', vol: 0.4 }), 60);
    setTimeout(() => blip({ freq: 880, dur: 0.1, type: 'triangle', vol: 0.4 }), 120);
  },
  levelup() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => blip({ freq: f, dur: 0.08, type: 'square', vol: 0.4 }), i * 70));
  },
  die() {
    blip({ freq: 220, slide: -180, dur: 0.4, type: 'sawtooth', vol: 0.5 });
    setTimeout(() => noise({ dur: 0.3, vol: 0.3, freq: 400 }), 100);
  },
  achievement() {
    blip({ freq: 880, dur: 0.05, type: 'square', vol: 0.35 });
    setTimeout(() => blip({ freq: 1175, dur: 0.05, type: 'square', vol: 0.35 }), 60);
    setTimeout(() => blip({ freq: 1568, dur: 0.12, type: 'square', vol: 0.4 }), 120);
  },
  start() {
    blip({ freq: 440, dur: 0.05, type: 'square', vol: 0.3 });
    setTimeout(() => blip({ freq: 880, dur: 0.08, type: 'square', vol: 0.35 }), 60);
  },
  pause() {
    blip({ freq: 330, dur: 0.06, type: 'triangle', vol: 0.3 });
  },
  combo(n) {
    const f = 440 + n * 60;
    blip({ freq: f, dur: 0.04, type: 'square', vol: 0.3 });
  },
};

export const SnakeAudio = {
  play(name, ...args) {
    const fn = sounds[name];
    if (fn) try { fn(...args); } catch (e) {}
  },
  setEnabled(v) { enabled = !!v; },
  isEnabled() { return enabled; },
  setVolume(v) { if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v)); },
  resume() { ensureCtx(); },
};
