/**
 * NTP-style Clock Synchronization & Network Telemetry Estimator
 */

export class ClockSync {
  constructor() {
    this.rtt = 0; // ms
    this.smoothedRtt = 0;
    this.clockOffset = 0; // ms
    this.jitter = 0; // ms
    this.lastRtt = 0;

    this.packetsSent = 0;
    this.packetsReceived = 0;
    this.packetLoss = 0.0; // percentage
    this.bytesSent = 0;
    this.bytesReceived = 0;
    this.packetRate = 0; // packets/sec
    this.lastRateCheck = performance.now();
    this.ratePacketCount = 0;

    this.history = [];
    this.maxHistory = 30;
  }

  /**
   * Called when a Pong response or Ping round-trip arrives
   * @param {number} t0 - Local timestamp when ping was transmitted
   * @param {number} tHost - Remote host timestamp
   * @param {number} tRecv - Local timestamp upon arrival
   */
  processPong(t0, tHost, tRecv = performance.now()) {
    const measuredRtt = Math.max(0.1, tRecv - t0);
    this.rtt = measuredRtt;

    // Exponential moving average for smooth display
    if (this.smoothedRtt === 0) {
      this.smoothedRtt = measuredRtt;
    } else {
      this.smoothedRtt = this.smoothedRtt * 0.85 + measuredRtt * 0.15;
    }

    // Jitter calculation: |RTT_current - RTT_previous|
    if (this.lastRtt > 0) {
      const diff = Math.abs(measuredRtt - this.lastRtt);
      this.jitter = this.jitter * 0.8 + diff * 0.2;
    }
    this.lastRtt = measuredRtt;

    // Clock Offset estimation (NTP formulation)
    if (tHost !== undefined) {
      const estimatedOneWay = measuredRtt / 2;
      this.clockOffset = tHost - (t0 + estimatedOneWay);
    }

    // Record history for telemetry graphs
    this.history.push({
      time: performance.now(),
      rtt: measuredRtt,
      jitter: this.jitter
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  recordPacketSent(byteLength = 0) {
    this.packetsSent++;
    this.bytesSent += byteLength;
  }

  recordPacketReceived(byteLength = 0) {
    this.packetsReceived++;
    this.bytesReceived += byteLength;
    this.ratePacketCount++;

    const now = performance.now();
    const elapsed = (now - this.lastRateCheck) / 1000;
    if (elapsed >= 1.0) {
      this.packetRate = Math.round(this.ratePacketCount / elapsed);
      this.ratePacketCount = 0;
      this.lastRateCheck = now;
    }
  }

  getMetrics() {
    return {
      rtt: Math.round(this.rtt),
      smoothedRtt: Math.round(this.smoothedRtt),
      jitter: parseFloat(this.jitter.toFixed(1)),
      clockOffset: Math.round(this.clockOffset),
      packetLoss: this.packetLoss,
      packetsSent: this.packetsSent,
      packetsReceived: this.packetsReceived,
      packetRate: this.packetRate,
      bytesTransferred: this.bytesSent + this.bytesReceived,
      history: [...this.history]
    };
  }

  reset() {
    this.rtt = 0;
    this.smoothedRtt = 0;
    this.clockOffset = 0;
    this.jitter = 0;
    this.lastRtt = 0;
    this.packetsSent = 0;
    this.packetsReceived = 0;
    this.packetLoss = 0;
    this.bytesSent = 0;
    this.bytesReceived = 0;
    this.packetRate = 0;
    this.history = [];
  }
}
