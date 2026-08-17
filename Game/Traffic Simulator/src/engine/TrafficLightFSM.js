/**
 * Intersection Traffic Light Finite State Machine (FSM)
 * and Virtual Obstacle Generator for unified IDM physics.
 */

export const SIGNAL_PHASES = {
  NS_GREEN: 'NS_GREEN',
  NS_YELLOW: 'NS_YELLOW',
  ALL_RED_1: 'ALL_RED_1',
  EW_GREEN: 'EW_GREEN',
  EW_YELLOW: 'EW_YELLOW',
  ALL_RED_2: 'ALL_RED_2'
};

export class TrafficLightFSM {
  constructor({
    greenDuration = 10.0, // seconds
    yellowDuration = 2.5,
    allRedDuration = 1.0,
    adaptiveMode = false,
    minGreenDuration = 4.0,
    maxGreenDuration = 25.0
  } = {}) {
    this.greenDuration = greenDuration;
    this.yellowDuration = yellowDuration;
    this.allRedDuration = allRedDuration;
    this.adaptiveMode = adaptiveMode;
    this.minGreenDuration = minGreenDuration;
    this.maxGreenDuration = maxGreenDuration;

    this.currentPhase = SIGNAL_PHASES.NS_GREEN;
    this.phaseTimer = 0; // seconds
    this.totalCycleCount = 0;

    // Stop line coordinates along 1D tracks (in meters)
    this.stopLines = {
      NS_NORTHBOUND: 0,
      NS_SOUTHBOUND: 0,
      EW_EASTBOUND: 0,
      EW_WESTBOUND: 0
    };
  }

  setStopLine(laneId, sMeters) {
    this.stopLines[laneId] = sMeters;
  }

  update(dt, queueMetrics = {}) {
    this.phaseTimer += dt;

    if (this.adaptiveMode && (this.currentPhase === SIGNAL_PHASES.NS_GREEN || this.currentPhase === SIGNAL_PHASES.EW_GREEN)) {
      this.evaluateAdaptiveTransition(queueMetrics);
    } else {
      this.evaluateFixedTransition();
    }
  }

  evaluateFixedTransition() {
    switch (this.currentPhase) {
      case SIGNAL_PHASES.NS_GREEN:
        if (this.phaseTimer >= this.greenDuration) {
          this.transitionTo(SIGNAL_PHASES.NS_YELLOW);
        }
        break;
      case SIGNAL_PHASES.NS_YELLOW:
        if (this.phaseTimer >= this.yellowDuration) {
          this.transitionTo(SIGNAL_PHASES.ALL_RED_1);
        }
        break;
      case SIGNAL_PHASES.ALL_RED_1:
        if (this.phaseTimer >= this.allRedDuration) {
          this.transitionTo(SIGNAL_PHASES.EW_GREEN);
        }
        break;
      case SIGNAL_PHASES.EW_GREEN:
        if (this.phaseTimer >= this.greenDuration) {
          this.transitionTo(SIGNAL_PHASES.EW_YELLOW);
        }
        break;
      case SIGNAL_PHASES.EW_YELLOW:
        if (this.phaseTimer >= this.yellowDuration) {
          this.transitionTo(SIGNAL_PHASES.ALL_RED_2);
        }
        break;
      case SIGNAL_PHASES.ALL_RED_2:
        if (this.phaseTimer >= this.allRedDuration) {
          this.transitionTo(SIGNAL_PHASES.NS_GREEN);
          this.totalCycleCount++;
        }
        break;
    }
  }

  evaluateAdaptiveTransition(queueMetrics) {
    // In adaptive mode, extend green if cars are queued and maxGreenDuration not reached
    const isNS = this.currentPhase === SIGNAL_PHASES.NS_GREEN;
    const activeQueue = isNS ? (queueMetrics.nsQueue || 0) : (queueMetrics.ewQueue || 0);
    const waitingCrossQueue = isNS ? (queueMetrics.ewQueue || 0) : (queueMetrics.nsQueue || 0);

    if (this.phaseTimer < this.minGreenDuration) {
      return; // Keep minimum green
    }

    if (this.phaseTimer >= this.maxGreenDuration) {
      this.transitionTo(isNS ? SIGNAL_PHASES.NS_YELLOW : SIGNAL_PHASES.EW_YELLOW);
      return;
    }

    // If cross street has waiting vehicles and active street is clear, cycle early
    if (waitingCrossQueue > 2 && activeQueue === 0) {
      this.transitionTo(isNS ? SIGNAL_PHASES.NS_YELLOW : SIGNAL_PHASES.EW_YELLOW);
    }
  }

  transitionTo(nextPhase) {
    this.currentPhase = nextPhase;
    this.phaseTimer = 0;
  }

  forceCycleNext() {
    switch (this.currentPhase) {
      case SIGNAL_PHASES.NS_GREEN:
        this.transitionTo(SIGNAL_PHASES.NS_YELLOW);
        break;
      case SIGNAL_PHASES.NS_YELLOW:
      case SIGNAL_PHASES.ALL_RED_1:
        this.transitionTo(SIGNAL_PHASES.EW_GREEN);
        break;
      case SIGNAL_PHASES.EW_GREEN:
        this.transitionTo(SIGNAL_PHASES.EW_YELLOW);
        break;
      case SIGNAL_PHASES.EW_YELLOW:
      case SIGNAL_PHASES.ALL_RED_2:
        this.transitionTo(SIGNAL_PHASES.NS_GREEN);
        break;
    }
  }

  getLaneSignalState(laneId) {
    const isNS = laneId.startsWith('NS');
    const isEW = laneId.startsWith('EW');

    if (isNS) {
      if (this.currentPhase === SIGNAL_PHASES.NS_GREEN) return 'GREEN';
      if (this.currentPhase === SIGNAL_PHASES.NS_YELLOW) return 'YELLOW';
      return 'RED';
    }

    if (isEW) {
      if (this.currentPhase === SIGNAL_PHASES.EW_GREEN) return 'GREEN';
      if (this.currentPhase === SIGNAL_PHASES.EW_YELLOW) return 'YELLOW';
      return 'RED';
    }

    return 'GREEN';
  }

  /**
   * Generates a Virtual Obstacle at the stop line if light is RED or YELLOW,
   * taking into account yellow light dilemma zone physics.
   * 
   * @param {Vehicle} vehicle 
   * @param {string} laneId 
   * @returns {{s: number, v: number, length: number} | null}
   */
  getVirtualObstacle(vehicle, laneId) {
    const signalState = this.getLaneSignalState(laneId);
    if (signalState === 'GREEN') return null;

    const stopLineS = this.stopLines[laneId];
    if (stopLineS === undefined) return null;

    // If car has already crossed the stop line into intersection, let it proceed!
    if (vehicle.s >= stopLineS - 1.0) {
      return null;
    }

    const distToStop = stopLineS - vehicle.s;

    // Yellow Dilemma Zone check:
    // If signal is YELLOW and vehicle cannot stop safely at comfortable deceleration (bComf)
    // stopping distance = v^2 / (2 * bComf)
    if (signalState === 'YELLOW') {
      const requiredStoppingDist = (vehicle.v * vehicle.v) / (2 * Math.max(0.5, vehicle.params.bComf * 1.3));
      if (distToStop < requiredStoppingDist && vehicle.v > 4.0) {
        // Dilemma zone: too close to stop comfortably -> proceed through yellow!
        return null;
      }
    }

    // Return virtual stationary vehicle at stop line
    return {
      s: stopLineS,
      v: 0,
      length: 0
    };
  }
}
