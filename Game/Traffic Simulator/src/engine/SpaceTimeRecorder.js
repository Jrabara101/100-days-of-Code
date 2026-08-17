/**
 * Space-Time Trajectory Recorder & Macroscopic Fundamental Diagram Metrics
 */

export class SpaceTimeRecorder {
  constructor({ maxHistorySeconds = 30, sampleIntervalSeconds = 0.1 } = {}) {
    this.maxHistorySeconds = maxHistorySeconds;
    this.sampleIntervalSeconds = sampleIntervalSeconds;
    this.sampleTimer = 0;
    this.simTime = 0;

    // Trajectory history: Array of { time, vehicles: Array<{ id, s, v, laneId, isBraking }> }
    this.trajectoryHistory = [];
    // Aggregated density/flow samples: Array of { time, density, flow, avgSpeed }
    this.macroscopicHistory = [];
  }

  record(dt, vehicles, trackLengthMeters) {
    this.simTime += dt;
    this.sampleTimer += dt;

    if (this.sampleTimer >= this.sampleIntervalSeconds) {
      this.sampleTimer = 0;

      // 1. Record individual vehicle points
      const snapshot = {
        time: this.simTime,
        vehicles: vehicles.map(v => ({
          id: v.id,
          s: v.s % (trackLengthMeters || 1000),
          v: v.v,
          laneId: v.laneId,
          isBraking: v.isBraking,
          color: v.color
        }))
      };

      this.trajectoryHistory.push(snapshot);

      // 2. Compute macroscopic fundamental parameters
      if (vehicles.length > 0 && trackLengthMeters > 0) {
        // Density k = N / (L / 1000) [vehicles / km]
        const lengthKm = trackLengthMeters / 1000;
        const density = vehicles.length / lengthKm;
        const totalV = vehicles.reduce((sum, v) => sum + v.v, 0);
        const avgSpeedMps = totalV / vehicles.length;
        const avgSpeedKmh = avgSpeedMps * 3.6;
        // Flow Q = k * avgSpeed [veh / hr]
        const flow = density * avgSpeedKmh;

        this.macroscopicHistory.push({
          time: this.simTime,
          density: Math.round(density),
          flow: Math.round(flow),
          avgSpeed: Math.round(avgSpeedKmh)
        });
      }

      // Prune old history
      const cutoffTime = this.simTime - this.maxHistorySeconds;
      while (this.trajectoryHistory.length > 0 && this.trajectoryHistory[0].time < cutoffTime) {
        this.trajectoryHistory.shift();
      }
      while (this.macroscopicHistory.length > 0 && this.macroscopicHistory[0].time < cutoffTime) {
        this.macroscopicHistory.shift();
      }
    }
  }

  clear() {
    this.trajectoryHistory = [];
    this.macroscopicHistory = [];
    this.simTime = 0;
    this.sampleTimer = 0;
  }
}
