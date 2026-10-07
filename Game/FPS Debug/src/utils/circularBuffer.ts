/**
 * High-performance, zero-allocation circular buffer using Float32Array.
 * Designed to maintain rolling sub-millisecond frame telemetry outside React lifecycle.
 */
export class Float32CircularBuffer {
  private buffer: Float32Array;
  private capacity: number;
  private head: number = 0;
  private count: number = 0;
  private scratchSort: Float32Array;

  constructor(capacity: number = 1800) { // Default 1800 samples = 15 seconds at 120 FPS
    this.capacity = capacity;
    this.buffer = new Float32Array(capacity);
    this.scratchSort = new Float32Array(capacity);
  }

  public push(val: number): void {
    this.buffer[this.head] = val;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  public size(): number {
    return this.count;
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public clear(): void {
    this.head = 0;
    this.count = 0;
    this.buffer.fill(0);
  }

  /**
   * Retrieves the value relative to the newest element.
   * index 0 is newest, index count-1 is oldest.
   */
  public getFromNewest(index: number): number {
    if (index < 0 || index >= this.count) return 0;
    const idx = (this.head - 1 - index + this.capacity) % this.capacity;
    return this.buffer[idx];
  }

  /**
   * Retrieves the value relative to the oldest element.
   * index 0 is oldest, index count-1 is newest.
   */
  public getFromOldest(index: number): number {
    if (index < 0 || index >= this.count) return 0;
    const start = (this.head - this.count + this.capacity) % this.capacity;
    return this.buffer[(start + index) % this.capacity];
  }

  /**
   * Returns a copy of the last N entries in chronological order (oldest to newest).
   */
  public getLastN(n: number): number[] {
    const samples = Math.min(n, this.count);
    const result: number[] = new Array(samples);
    const start = (this.head - samples + this.capacity) % this.capacity;
    for (let i = 0; i < samples; i++) {
      result[i] = this.buffer[(start + i) % this.capacity];
    }
    return result;
  }

  /**
   * Calculates rolling average of the last `sampleCount` entries.
   */
  public average(sampleCount: number = 60): number {
    const samples = Math.min(sampleCount, this.count);
    if (samples === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples; i++) {
      sum += this.getFromNewest(i);
    }
    return sum / samples;
  }

  /**
   * Calculates rolling min and max of the last `sampleCount` entries.
   */
  public minMax(sampleCount: number = 60): { min: number; max: number } {
    const samples = Math.min(sampleCount, this.count);
    if (samples === 0) return { min: 0, max: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < samples; i++) {
      const val = this.getFromNewest(i);
      if (val < min) min = val;
      if (val > max) max = val;
    }
    return { min, max };
  }

  /**
   * Calculates 1% Low and 0.1% Low Frame Times and FPS.
   * The 1% low is the 99th percentile frame time (the slowest 1% of frames).
   * 1% low FPS = 1000 / p99FrameTimeMs.
   */
  public calculatePercentiles(sampleCount: number = 180): {
    p90Ms: number;
    p99Ms: number;
    p999Ms: number;
    onePercentLowFps: number;
    pointOnePercentLowFps: number;
  } {
    const samples = Math.min(sampleCount, this.count);
    if (samples < 5) {
      const avg = this.average(samples) || 16.6;
      const fps = avg > 0 ? 1000 / avg : 60;
      return { p90Ms: avg, p99Ms: avg, p999Ms: avg, onePercentLowFps: fps, pointOnePercentLowFps: fps };
    }

    // Copy to scratch array for sorting
    for (let i = 0; i < samples; i++) {
      this.scratchSort[i] = this.getFromNewest(i);
    }

    // Sort ascending
    const subarray = this.scratchSort.subarray(0, samples);
    subarray.sort();

    // 90th, 99th, and 99.9th percentiles (slowest frames)
    const idx90 = Math.min(samples - 1, Math.floor(samples * 0.90));
    const idx99 = Math.min(samples - 1, Math.floor(samples * 0.99));
    const idx999 = Math.min(samples - 1, Math.floor(samples * 0.999));

    const p90Ms = subarray[idx90] || 16.6;
    const p99Ms = subarray[idx99] || 16.6;
    const p999Ms = subarray[idx999] || p99Ms;

    const onePercentLowFps = p99Ms > 0 ? Math.min(1000 / p99Ms, 240) : 60;
    const pointOnePercentLowFps = p999Ms > 0 ? Math.min(1000 / p999Ms, 240) : 60;

    return {
      p90Ms,
      p99Ms,
      p999Ms,
      onePercentLowFps,
      pointOnePercentLowFps
    };
  }
}

export interface IncidentFrameRecord {
  timestamp: number;
  deltaMs: number;
  instantFps: number;
  isLongTask: boolean;
  heapUsedMb?: number;
}

/**
 * Circular incident flight-recorder storing 15 seconds of comprehensive frame diagnostics
 */
export class IncidentFlightRecorder {
  private records: IncidentFrameRecord[];
  private capacity: number;
  private head: number = 0;
  private count: number = 0;
  private errorLogs: { timestamp: number; message: string; stack?: string }[] = [];
  private longTaskLogs: { durationMs: number; startTime: number; name?: string }[] = [];

  constructor(capacity: number = 1800) {
    this.capacity = capacity;
    this.records = new Array(capacity);
  }

  public recordFrame(sample: IncidentFrameRecord): void {
    this.records[this.head] = sample;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  public recordError(message: string, stack?: string): void {
    this.errorLogs.unshift({
      timestamp: performance.now(),
      message,
      stack,
    });
    if (this.errorLogs.length > 50) this.errorLogs.pop();
  }

  public recordLongTask(durationMs: number, startTime: number, name: string = 'Long Task'): void {
    this.longTaskLogs.unshift({
      durationMs,
      startTime,
      name,
    });
    if (this.longTaskLogs.length > 50) this.longTaskLogs.pop();
  }

  public getRecentChronological(count?: number): IncidentFrameRecord[] {
    const samples = count ? Math.min(count, this.count) : this.count;
    const result: IncidentFrameRecord[] = new Array(samples);
    const start = (this.head - samples + this.capacity) % this.capacity;
    for (let i = 0; i < samples; i++) {
      result[i] = this.records[(start + i) % this.capacity];
    }
    return result;
  }

  public getLongTasks(): { durationMs: number; startTime: number; name?: string }[] {
    return [...this.longTaskLogs];
  }

  public getErrors(): { timestamp: number; message: string; stack?: string }[] {
    return [...this.errorLogs];
  }

  public clear(): void {
    this.head = 0;
    this.count = 0;
    this.errorLogs = [];
    this.longTaskLogs = [];
  }
}
