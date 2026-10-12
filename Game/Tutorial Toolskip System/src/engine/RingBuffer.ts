import { KeyframeSnapshot, PlayerInputPacket, ReplayEventMarker, ReplayMetadata, ReplayPayload } from '../types/replay';

export class ReplayRingBuffer {
  private maxTicks: number;
  private keyframeInterval: number;

  // Discrete arrays for ticks and snapshots
  private inputs: PlayerInputPacket[] = [];
  private keyframes: KeyframeSnapshot[] = [];
  private markers: ReplayEventMarker[] = [];

  // Head and tail indices for rolling buffer
  private currentTick: number = 0;
  private startTick: number = 0;

  constructor(maxTicks: number = 108000, keyframeInterval: number = 60) {
    this.maxTicks = maxTicks;
    this.keyframeInterval = keyframeInterval;
  }

  public reset(): void {
    this.inputs = [];
    this.keyframes = [];
    this.markers = [];
    this.currentTick = 0;
    this.startTick = 0;
  }

  public pushInput(packet: PlayerInputPacket): void {
    this.inputs.push(packet);
    this.currentTick = packet.tick;

    // Prune if exceeds max buffer size
    if (this.inputs.length > this.maxTicks) {
      const dropCount = this.inputs.length - this.maxTicks;
      this.inputs.splice(0, dropCount);
      this.startTick = this.inputs[0]?.tick ?? 0;
      // Also prune keyframes older than startTick
      this.keyframes = this.keyframes.filter(kf => kf.tick >= this.startTick);
      this.markers = this.markers.filter(m => m.tick >= this.startTick);
    }
  }

  public pushKeyframe(snapshot: KeyframeSnapshot): void {
    this.keyframes.push(snapshot);
  }

  public addMarker(marker: ReplayEventMarker): void {
    this.markers.push(marker);
  }

  public getCurrentTick(): number {
    return this.currentTick;
  }

  public getTotalTicks(): number {
    if (this.inputs.length === 0) return 0;
    return this.currentTick - this.startTick;
  }

  public getInputs(): PlayerInputPacket[] {
    return this.inputs;
  }

  public getKeyframes(): KeyframeSnapshot[] {
    return this.keyframes;
  }

  public getMarkers(): ReplayEventMarker[] {
    return this.markers;
  }

  // Find bounding keyframes for a specific tick for interpolation
  public getBoundingKeyframes(targetTick: number): { prev: KeyframeSnapshot | null; next: KeyframeSnapshot | null } {
    if (this.keyframes.length === 0) return { prev: null, next: null };

    let prev: KeyframeSnapshot | null = null;
    let next: KeyframeSnapshot | null = null;

    for (let i = 0; i < this.keyframes.length; i++) {
      const kf = this.keyframes[i];
      if (kf.tick <= targetTick) {
        prev = kf;
      }
      if (kf.tick >= targetTick && next === null) {
        next = kf;
        break;
      }
    }

    if (!prev && this.keyframes.length > 0) prev = this.keyframes[0];
    if (!next && prev) next = prev;

    return { prev, next };
  }

  // Slice a time/tick range for clip trimming
  public extractSlice(startTick: number, endTick: number): {
    inputs: PlayerInputPacket[];
    keyframes: KeyframeSnapshot[];
    markers: ReplayEventMarker[];
  } {
    const clampedStart = Math.max(this.startTick, startTick);
    const clampedEnd = Math.min(this.currentTick, endTick);

    const slicedInputs = this.inputs
      .filter(i => i.tick >= clampedStart && i.tick <= clampedEnd)
      .map(i => ({ ...i, tick: i.tick - clampedStart }));

    const slicedKeyframes = this.keyframes
      .filter(k => k.tick >= clampedStart && k.tick <= clampedEnd)
      .map(k => ({ ...k, tick: k.tick - clampedStart }));

    const slicedMarkers = this.markers
      .filter(m => m.tick >= clampedStart && m.tick <= clampedEnd)
      .map(m => ({ ...m, tick: m.tick - clampedStart }));

    return {
      inputs: slicedInputs,
      keyframes: slicedKeyframes,
      markers: slicedMarkers,
    };
  }

  public exportDataPackage(metadata: Omit<ReplayMetadata, 'totalTicks' | 'durationMs' | 'checksum'>, checksum: string): ReplayPayload {
    const totalTicks = this.getTotalTicks();
    const durationMs = Math.round((totalTicks / 60) * 1000);

    const fullMetadata: ReplayMetadata = {
      ...metadata,
      totalTicks,
      durationMs,
      checksum,
      markers: [...this.markers],
    };

    return {
      metadata: fullMetadata,
      keyframes: [...this.keyframes],
      inputs: [...this.inputs],
    };
  }

  // Memory estimation in bytes
  public estimateMemoryBytes(): number {
    // 4 bytes per float/int approximate telemetry footprint
    const inputBytes = this.inputs.length * 32; // tick, dt, keys, cursor(x,y)
    let entityBytes = 0;
    for (const kf of this.keyframes) {
      entityBytes += 16 + kf.entities.length * 48;
    }
    const markerBytes = this.markers.length * 64;
    return inputBytes + entityBytes + markerBytes;
  }
}
