import type { ChaosSettings } from '../types/telemetry';

export class ChaosEngine {
  private static instance: ChaosEngine;
  private worker: Worker | null = null;
  private memoryStressChunks: Float64Array[] = [];
  private settings: ChaosSettings = {
    targetFpsCap: 0, // 0 = uncapped
    cpuLagDelayMs: 0,
    cpuWorkerLoadPct: 0,
    artificialJitterMs: 0,
    memoryStressActive: false,
    memoryStressMb: 128,
    dropFramesProbability: 0,
  };

  private lastCapTime: number = 0;

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): ChaosEngine {
    if (!ChaosEngine.instance) {
      ChaosEngine.instance = new ChaosEngine();
    }
    return ChaosEngine.instance;
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL('../workers/chaosWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (e) {
      console.warn('Chaos Web Worker could not be instantiated:', e);
    }
  }

  public updateSettings(partial: Partial<ChaosSettings>) {
    this.settings = { ...this.settings, ...partial };

    // Update worker CPU load
    if (this.worker && partial.cpuWorkerLoadPct !== undefined) {
      this.worker.postMessage({
        command: 'setLoad',
        load: this.settings.cpuWorkerLoadPct,
      });
    }

    // Update memory stress
    if (partial.memoryStressActive !== undefined || partial.memoryStressMb !== undefined) {
      this.updateMemoryStress();
    }
  }

  public getSettings(): ChaosSettings {
    return { ...this.settings };
  }

  /**
   * Allocates or frees memory chunks to simulate heap pressure and GC churn.
   */
  private updateMemoryStress() {
    if (!this.settings.memoryStressActive) {
      this.memoryStressChunks = [];
      return;
    }

    const targetMb = this.settings.memoryStressMb;
    const currentMb = (this.memoryStressChunks.length * 8 * 1024 * 1024) / (1024 * 1024);

    if (currentMb < targetMb) {
      // Allocate 8MB Float64Array chunks (1M float64 elements each = 8MB)
      const chunksToAdd = Math.ceil((targetMb - currentMb) / 8);
      for (let i = 0; i < chunksToAdd; i++) {
        try {
          const chunk = new Float64Array(1024 * 1024);
          // Touch array to force physical RAM allocation
          for (let j = 0; j < chunk.length; j += 1024) {
            chunk[j] = Math.random();
          }
          this.memoryStressChunks.push(chunk);
        } catch (e) {
          console.warn('Memory allocation limit reached in Chaos sandbox:', e);
          break;
        }
      }
    } else if (currentMb > targetMb) {
      const chunksToRemove = Math.ceil((currentMb - targetMb) / 8);
      this.memoryStressChunks.splice(0, chunksToRemove);
    }
  }

  /**
   * Periodic GC churn pulse: briefly allocates temporary garbage to provoke GC pause
   */
  public triggerGarbageCollectionSpike(sizeMb: number = 64) {
    const temp: Float64Array[] = [];
    const chunks = Math.ceil(sizeMb / 8);
    for (let i = 0; i < chunks; i++) {
      const arr = new Float64Array(1024 * 1024);
      for (let j = 0; j < arr.length; j += 4096) {
        arr[j] = Math.random();
      }
      temp.push(arr);
    }
    // Release immediately for browser GC to clean up
    setTimeout(() => {
      temp.length = 0;
    }, 10);
  }

  /**
   * Injects an artificial blocking frame stutter (e.g. asset load freeze or synchronous parse)
   */
  public injectInstantHitch(durationMs: number = 80) {
    const start = performance.now();
    while (performance.now() - start < durationMs) {
      // Busy wait on main thread
      Math.sin(Math.random());
    }
  }

  /**
   * Checks whether the current frame should be skipped to enforce target FPS cap.
   * Returns true if frame should be processed, false if skipped.
   */
  public shouldRenderFrame(now: number): boolean {
    if (this.settings.targetFpsCap <= 0) {
      return true;
    }

    const interval = 1000 / this.settings.targetFpsCap;
    if (now - this.lastCapTime >= interval - 0.5) {
      this.lastCapTime = now;
      return true;
    }
    return false;
  }

  /**
   * Injects artificial CPU lag delay and jitter into the current frame.
   */
  public applyFrameThrottling() {
    let delay = this.settings.cpuLagDelayMs;

    if (this.settings.artificialJitterMs > 0) {
      delay += Math.random() * this.settings.artificialJitterMs;
    }

    if (this.settings.dropFramesProbability > 0 && Math.random() < this.settings.dropFramesProbability) {
      delay += 35 + Math.random() * 45; // Induce severe frame drop (hitch)
    }

    if (delay > 0) {
      const start = performance.now();
      while (performance.now() - start < delay) {
        Math.sqrt(Math.random());
      }
    }
  }

  public destroy() {
    if (this.worker) {
      this.worker.postMessage({ command: 'stop' });
      this.worker.terminate();
      this.worker = null;
    }
    this.memoryStressChunks = [];
  }
}

export const chaosEngine = ChaosEngine.getInstance();
