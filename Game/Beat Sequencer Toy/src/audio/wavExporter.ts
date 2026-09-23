import { BeatSequencerState } from '../types/sequencer';
import { triggerTrackSound } from './synthesizer';

export async function exportPatternToWav(state: BeatSequencerState, totalBars: number = 2): Promise<Blob> {
  const sampleRate = 44100;
  const secondsPerBeat = 60.0 / state.bpm;
  const totalSteps = totalBars * 16;
  const totalSeconds = secondsPerBeat * 4 * totalBars + 0.5; // +0.5s tail for reverb/decays

  const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalSeconds), sampleRate);

  // Master Gain
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);

  // Master Resonant Filter
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(state.masterEffects.filterCutoff, 0);
  filter.Q.setValueAtTime(2.5, 0);

  // Compressor
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-4, 0);
  compressor.knee.setValueAtTime(10, 0);
  compressor.ratio.setValueAtTime(8, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.18, 0);

  filter.connect(compressor);
  compressor.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  // Create per-track gain & pan nodes
  const trackNodes = new Map<string, AudioNode>();
  state.tracks.forEach((track) => {
    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(track.volume, 0);

    const panner = offlineCtx.createStereoPanner();
    panner.pan.setValueAtTime(track.pan, 0);

    panner.connect(gain);
    gain.connect(filter);
    trackNodes.set(track.id, panner);
  });

  const hasAnySolo = state.tracks.some((t) => t.isSoloed);

  // Schedule all step events
  for (let bar = 0; bar < totalBars; bar++) {
    for (let step = 0; step < 16; step++) {
      const isOddStep = step % 2 === 1;
      const stepBaseTime = bar * 4 * secondsPerBeat + step * 0.25 * secondsPerBeat;
      const swingOffset = isOddStep ? 0.25 * secondsPerBeat * state.swing * 0.7 : 0;
      const triggerTime = stepBaseTime + swingOffset;

      state.tracks.forEach((track) => {
        if (track.steps[step]) {
          const isPlayable = hasAnySolo ? track.isSoloed : !track.isMuted;
          if (isPlayable) {
            const dest = trackNodes.get(track.id);
            triggerTrackSound(track.id, triggerTime, state.activeKit, track.pitchOffset, true, offlineCtx, dest);

            // Stutter division
            if (state.masterEffects.activeStutter !== 'none') {
              const divSec =
                state.masterEffects.activeStutter === '1/8'
                  ? secondsPerBeat * 0.5
                  : state.masterEffects.activeStutter === '1/16'
                  ? secondsPerBeat * 0.25
                  : secondsPerBeat * 0.125;
              triggerTrackSound(track.id, triggerTime + divSec * 0.5, state.activeKit, track.pitchOffset, true, offlineCtx, dest);
            }
          }
        }
      });
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // 16 for PCM
  setUint16(1); // Linear quantization (PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // 16 bits per sample
  // DATA sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  const channels: Float32Array[] = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 0;
  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
