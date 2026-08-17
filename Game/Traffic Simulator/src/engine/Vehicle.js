import { calculateIDMAcceleration, DRIVER_PROFILES } from './IDM.js';

export const PIXELS_PER_METER = 3.5;

export class Vehicle {
  constructor({
    id,
    s = 0,
    v = 0,
    laneId = 'main',
    profileKey = 'COMMUTER',
    customParams = null,
    vehicleType = 'car',
    color = null
  }) {
    this.id = id;
    this.s = s;                  // Longitudinal arc-length position along lane (meters)
    this.v = Math.max(0, v);     // Velocity (m/s)
    this.a = 0;                  // Instantaneous acceleration (m/s^2)
    this.laneId = laneId;
    this.targetLaneId = laneId;
    this.lateralOffset = 0;      // 0 = center of lane, in meters
    this.laneChangeProgress = 1; // 1 = fully in lane, 0..1 = transitioning
    this.laneChangeDirection = 0; // -1 (left), +1 (right)

    this.profileKey = profileKey;
    const baseProfile = DRIVER_PROFILES[profileKey] || DRIVER_PROFILES.COMMUTER;
    this.params = { ...baseProfile, ...(customParams || {}) };

    this.vehicleType = vehicleType;
    this.initVehicleDimensions(vehicleType);

    this.color = color || baseProfile.color;
    this.isBraking = false;
    this.isStalled = false;
    this.forcedBrakeDuration = 0; // In seconds
    this.blinker = null;          // 'left' | 'right' | 'hazard' | null

    // Telemetry tracking
    this.totalDistance = 0;
    this.timeAlive = 0;
    this.stoppedDuration = 0;
    this.targetGapSStar = 0;
    this.actualHeadway = Infinity;
    this.vLead = null;
  }

  initVehicleDimensions(type) {
    switch (type) {
      case 'truck':
        this.length = 12.0; // 12 meters
        this.width = 2.6;
        break;
      case 'bus':
        this.length = 11.0;
        this.width = 2.5;
        break;
      case 'sports':
        this.length = 4.4;
        this.width = 1.9;
        break;
      case 'compact':
        this.length = 3.8;
        this.width = 1.7;
        break;
      case 'car':
      default:
        this.length = 4.8;
        this.width = 1.8;
        break;
    }
  }

  /**
   * Update acceleration based on lead vehicle using IDM equation
   */
  computeAcceleration(leadVehicle, netDistance) {
    if (this.isStalled) {
      this.a = -this.params.bMax;
      this.isBraking = true;
      return this.a;
    }

    if (this.forcedBrakeDuration > 0) {
      this.a = -this.params.bComf * 1.6;
      this.isBraking = true;
      return this.a;
    }

    this.actualHeadway = netDistance;
    this.vLead = leadVehicle ? leadVehicle.v : null;

    // Cache s* for inspector UI
    const deltaV = leadVehicle ? (this.v - leadVehicle.v) : 0;
    const dynamicTerm = (this.v * deltaV) / (2 * Math.sqrt(this.params.aMax * this.params.bComf));
    this.targetGapSStar = this.params.s0 + Math.max(0, this.v * this.params.T + dynamicTerm);

    this.a = calculateIDMAcceleration(
      this.v,
      this.vLead,
      netDistance,
      this.params
    );

    this.isBraking = this.a < -0.3;
    return this.a;
  }

  /**
   * Integrates acceleration to velocity and position over time step dt (seconds)
   */
  integrate(dt) {
    if (this.forcedBrakeDuration > 0) {
      this.forcedBrakeDuration = Math.max(0, this.forcedBrakeDuration - dt);
    }

    // Velocity update clamped to >= 0 (no reversing cars)
    const prevV = this.v;
    this.v = Math.max(0, this.v + this.a * dt);

    // Position update (Euler / Trapezoidal average)
    const ds = ((prevV + this.v) / 2) * dt;
    this.s += ds;
    this.totalDistance += ds;
    this.timeAlive += dt;

    if (this.v < 0.5) {
      this.stoppedDuration += dt;
    }

    // Smooth lane changing lateral transition
    if (this.laneChangeProgress < 1.0) {
      this.laneChangeProgress = Math.min(1.0, this.laneChangeProgress + dt * 1.5);
      if (this.laneChangeProgress >= 1.0) {
        this.laneId = this.targetLaneId;
        this.lateralOffset = 0;
        this.laneChangeDirection = 0;
        this.blinker = null;
      }
    }
  }

  startLaneChange(targetLaneId, direction = 1) {
    if (this.laneChangeProgress < 1.0) return;
    this.targetLaneId = targetLaneId;
    this.laneChangeProgress = 0.0;
    this.laneChangeDirection = direction;
    this.blinker = direction > 0 ? 'right' : 'left';
  }

  triggerTapBrake(duration = 2.0) {
    this.forcedBrakeDuration = duration;
    this.isBraking = true;
  }

  toggleStall() {
    this.isStalled = !this.isStalled;
    this.blinker = this.isStalled ? 'hazard' : null;
  }

  getSpeedKmh() {
    return this.v * 3.6;
  }

  getPixelLength() {
    return this.length * PIXELS_PER_METER;
  }

  getPixelWidth() {
    return this.width * PIXELS_PER_METER;
  }
}
