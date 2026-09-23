import { SequencerTrack } from '../types/sequencer';

class AudioEngineGraph {
  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public masterFilter: BiquadFilterNode | null = null;
  public compressor: DynamicsCompressorNode | null = null;
  public trackNodes: Map<string, { gain: GainNode; panner: StereoPannerNode }> = new Map();
  public onKickTrigger?: () => void;

  private isInitialized = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // 2. Resonant Filter (Lowpass)
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.masterFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // 3. Dynamics Compressor/Limiter to prevent clipping and add analog glue
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-4, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

    // Graph connection: Filter -> Compressor -> MasterGain -> Destination
    this.masterFilter.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  public registerTracks(tracks: SequencerTrack[]) {
    if (!this.ctx || !this.masterFilter) return;

    tracks.forEach((track) => {
      let nodes = this.trackNodes.get(track.id);
      if (!nodes) {
        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(track.volume, this.ctx!.currentTime);

        const panner = this.ctx!.createStereoPanner();
        panner.pan.setValueAtTime(track.pan, this.ctx!.currentTime);

        panner.connect(gain);
        gain.connect(this.masterFilter!);

        nodes = { gain, panner };
        this.trackNodes.set(track.id, nodes);
      } else {
        nodes.gain.gain.setValueAtTime(track.volume, this.ctx!.currentTime);
        nodes.panner.pan.setValueAtTime(track.pan, this.ctx!.currentTime);
      }
    });
  }

  public getTrackInput(trackId: string): AudioNode {
    const nodes = this.trackNodes.get(trackId);
    if (nodes) {
      return nodes.panner;
    }
    return this.masterFilter || this.ctx!.destination;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.02);
    }
  }

  public setFilterCutoff(freq: number) {
    if (this.masterFilter && this.ctx) {
      const clamped = Math.max(20, Math.min(20000, freq));
      this.masterFilter.frequency.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
    }
  }

  public setTrackVolume(trackId: string, volume: number) {
    const nodes = this.trackNodes.get(trackId);
    if (nodes && this.ctx) {
      nodes.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.01);
    }
  }

  public setTrackPan(trackId: string, pan: number) {
    const nodes = this.trackNodes.get(trackId);
    if (nodes && this.ctx) {
      nodes.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.01);
    }
  }
}

export const audioEngine = new AudioEngineGraph();
