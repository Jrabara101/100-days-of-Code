/**
 * Web Worker for off-thread CPU busy-wait burn simulation.
 * Simulates heavy background computations (e.g., pathfinding, physics solvers, crypto operations).
 */

let running = false;
let loadPct = 0; // 0 to 100
let intervalId: any = null;

function runBurnCycle() {
  if (!running || loadPct <= 0) return;

  const cycleDurationMs = 50; // 50ms cycle
  const workTimeMs = (loadPct / 100) * cycleDurationMs;
  const start = performance.now();

  // Burn CPU on worker thread
  while (performance.now() - start < workTimeMs) {
    Math.sin(Math.random()) * Math.cos(Math.random()) * Math.sqrt(Math.random());
  }
}

self.onmessage = (e: MessageEvent) => {
  const { command, load } = e.data || {};

  if (command === 'setLoad') {
    loadPct = Math.max(0, Math.min(100, Number(load) || 0));
    if (loadPct > 0 && !running) {
      running = true;
      intervalId = setInterval(runBurnCycle, 50);
    } else if (loadPct === 0 && running) {
      running = false;
      if (intervalId) clearInterval(intervalId);
    }
  } else if (command === 'stop') {
    running = false;
    loadPct = 0;
    if (intervalId) clearInterval(intervalId);
  }
};
