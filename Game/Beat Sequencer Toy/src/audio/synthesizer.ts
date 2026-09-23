import { SoundKitId } from '../types/sequencer';
import { audioEngine } from './audioGraph';

export function triggerTrackSound(
  trackId: string,
  time: number,
  kit: SoundKitId,
  pitchOffset: number = 0,
  isOffline: boolean = false,
  offlineCtx?: BaseAudioContext,
  offlineDest?: AudioNode
) {
  const ctx = isOffline && offlineCtx ? offlineCtx : audioEngine.ctx;
  if (!ctx) return;

  const targetGain = isOffline && offlineDest ? offlineDest : audioEngine.getTrackInput(trackId);
  const effectivePitchRatio = Math.pow(2, pitchOffset / 12);

  // Dispatch visual event for kick hits if real-time
  if (!isOffline && (trackId === 'kick' || trackId === 'subbass')) {
    if (audioEngine.onKickTrigger) {
      audioEngine.onKickTrigger();
    }
  }

  switch (trackId) {
    case 'kick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(targetGain);

      let startFreq = 160;
      let decay = 0.35;
      osc.type = 'sine';

      if (kit === 'neon_808') {
        startFreq = 165 * effectivePitchRatio;
        decay = 0.42;
        osc.type = 'sine';
      } else if (kit === 'lofi_tape') {
        startFreq = 115 * effectivePitchRatio;
        decay = 0.45;
        osc.type = 'sine';

        // Add vintage tape click transient
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(80, time);
        clickGain.gain.setValueAtTime(0.28, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        clickOsc.connect(clickGain);
        clickGain.connect(targetGain);
        clickOsc.start(time);
        clickOsc.stop(time + 0.02);
      } else if (kit === 'chiptune') {
        startFreq = 190 * effectivePitchRatio;
        decay = 0.28;
        osc.type = 'triangle';
      } else if (kit === 'toy_foley') {
        // Ceramic mug bottom tap: resonant double ping
        startFreq = 135 * effectivePitchRatio;
        decay = 0.24;
        osc.type = 'sine';

        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(260 * effectivePitchRatio, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        bodyGain.gain.setValueAtTime(0.4, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(targetGain);
        bodyOsc.start(time);
        bodyOsc.stop(time + 0.1);
      }

      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + decay);

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

      osc.start(time);
      osc.stop(time + decay + 0.05);
      break;
    }

    case 'snare': {
      // Noise burst component
      const dur = kit === 'chiptune' ? 0.16 : (kit === 'toy_foley' ? 0.14 : 0.24);
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      if (kit === 'lofi_tape') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950 * effectivePitchRatio, time);
        filter.Q.setValueAtTime(2.0, time);
      } else if (kit === 'toy_foley') {
        // Pencil snap: tight bandpass
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800 * effectivePitchRatio, time);
        filter.Q.setValueAtTime(3.5, time);
      } else {
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200 * effectivePitchRatio, time);
      }

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(kit === 'toy_foley' ? 0.9 : 0.75, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(targetGain);

      // Body Tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = kit === 'chiptune' ? 'square' : 'triangle';
      const toneFreq = (kit === 'chiptune' ? 240 : (kit === 'toy_foley' ? 320 : 190)) * effectivePitchRatio;
      osc.frequency.setValueAtTime(toneFreq, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

      oscGain.gain.setValueAtTime(0.6, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(oscGain);
      oscGain.connect(targetGain);

      noiseSource.start(time);
      noiseSource.stop(time + dur);
      osc.start(time);
      osc.stop(time + 0.14);
      break;
    }

    case 'hihat':
    case 'openhat': {
      const isOpen = trackId === 'openhat';
      const dur = isOpen ? 0.35 : 0.055;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      if (kit === 'chiptune') {
        filter.type = 'highpass';
        filter.frequency.setValueAtTime((isOpen ? 6500 : 9000) * effectivePitchRatio, time);
      } else if (kit === 'lofi_tape') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime((isOpen ? 5500 : 7000) * effectivePitchRatio, time);
        filter.Q.setValueAtTime(1.5, time);
      } else if (kit === 'toy_foley') {
        // Metallic keychain clink
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime((isOpen ? 7500 : 10500) * effectivePitchRatio, time);
        filter.Q.setValueAtTime(4.0, time);
      } else {
        filter.type = 'highpass';
        filter.frequency.setValueAtTime((isOpen ? 8000 : 10000) * effectivePitchRatio, time);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isOpen ? 0.6 : 0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(targetGain);

      noiseSource.start(time);
      noiseSource.stop(time + dur + 0.01);
      break;
    }

    case 'clap': {
      // Clustered micro-transients simulating multiple hands or natural clapping
      const bursts = [0, 0.011, 0.023, 0.036];
      bursts.forEach((burstTime, idx) => {
        const isLast = idx === bursts.length - 1;
        const dur = isLast ? 0.18 : 0.016;
        const bSize = Math.floor(ctx.sampleRate * dur);
        const noiseBuffer = ctx.createBuffer(1, bSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        const centerFreq = (kit === 'toy_foley' ? 2200 : (kit === 'lofi_tape' ? 900 : 1200)) * effectivePitchRatio;
        band.frequency.setValueAtTime(centerFreq, time);
        band.Q.setValueAtTime(2.2, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(isLast ? 0.75 : 0.45, time + burstTime);
        gain.gain.exponentialRampToValueAtTime(0.001, time + burstTime + dur);

        noiseSource.connect(band);
        band.connect(gain);
        gain.connect(targetGain);

        noiseSource.start(time + burstTime);
        noiseSource.stop(time + burstTime + dur);
      });
      break;
    }

    case 'subbass': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (kit === 'chiptune') {
        osc.type = 'sawtooth';
      } else if (kit === 'lofi_tape') {
        osc.type = 'triangle';
      } else if (kit === 'toy_foley') {
        osc.type = 'triangle';
      } else {
        osc.type = 'sine';
      }

      // Root note: A1 (55 Hz) adjusted by pitch offset
      const baseFreq = 55 * effectivePitchRatio;
      osc.frequency.setValueAtTime(baseFreq, time);
      if (kit === 'neon_808') {
        osc.frequency.setValueAtTime(baseFreq * 1.5, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.08);
      }

      const dur = 0.4;
      gain.gain.setValueAtTime(0.85, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(targetGain);

      osc.start(time);
      osc.stop(time + dur + 0.05);
      break;
    }
  }
}
